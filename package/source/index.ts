/// <reference path="storage/localdb.ts" />
/// <reference path="storage/auth.ts" />
/// <reference path="storage/bucket.ts" />

/**
 * @global
 * @name DATA_PATH
 * @description The local path to where data is stored
 * @default "Supplied by LocalDB"
 */
const DATA_PATH = LocalDB.createDB("oxvs", {
    logStatus: true
})

// some jsdoc stuff

/**
 * @global
 * @name HOST_SERVER
 * @description The host server url that this service is deployed to
 * @example "https://server.oxvs.net"
 */
const HOST_SERVER = process.env.HOST_SERVER

/**
 * @global
 * @name doAllowNewUser
 * @description Control if new users are allowed to be created
 * @example true | false
 * @default true
 */
const doAllowNewUser = true

/**
 * @global
 * @name forceValidation
 * @description Force credential validation for all functions that interact with the database
 * @example true | false
 * @default true
 */
const forceValidation = true

// server

const express = require("express")
const api = express()
api.use(express.json())
api.listen(8080, () => { console.log("Local server active") })

// auth
api.post("/api/v1/auth/login", (request: any, response: any) => {
    const { ouid, password } = request.body
    if (forceValidation) {
        if (!ouid || !password) {
            response.status(400).send("Invalid credentials")
            return
        }
    }
    const authdb = new auth.AuthDatabase(DATA_PATH)
    authdb.login(ouid, password).then(token => {
        response.status(200).send({ token: token })
    }).catch(error => {
        response.status(400).send(error)
    })
})

// bucket
api.get("/api/v1/bucket/get/:id", (request: any, response: any) => {
    // create a new object handler
    const validator = new auth.Validator({
        type: "o.http"
    })

    // validate the request
    validator.validateUserRequest(request, "o.bucket")
        .then((data: any) => {
            response.status(200).send(data)
        }).catch((err: any) => {
            response.status(401).send({ message: "Unauthorized", response: err })
        })
})

api.post("/api/v1/bucket/upload", (request: any, response: any) => {
    /*
     * Example:
     * 
     *
     */

    // create a new object handler
    const validator = new auth.Validator({
        type: "o.http"
    })

    const authorization = request.headers.authorization
    const ouid = authorization.split("(::AT::)")[0] // should be the ouid of the user

    // validate the request
    validator.validateUserRequest(request, "o.token")
        .then(() => {
            const objdb = new bucket.ObjectHandler({
                sender: ouid
            })

            objdb.upload(request.body.data, request.body.encrypted, request.body.shareList).then((id: any) => {
                response.status(200).send({ id: id })
            }).catch((err) => {
                response.status(400).send({ message: "Error uploading object", response: err })
            })
        }).catch((err: any) => {
            response.status(401).send({ message: "Unauthorized", response: err })
        })
})

/* function test() {
    // auth
    const authdb = new auth.AuthDatabase({})
    authdb.newUser("test", "testpassword")
        ?.catch((err) => console.error(err));

    authdb.getUser("@user:test!o.host[server.oxvs.net]")
        .then(() => {
            // login test
            authdb.login("@user:test!o.host[server.oxvs.net]", "testpassword")
                .then((credentials) => console.log(credentials))
                .catch((err) => console.error(err))
        }).catch((err) => console.error(err))

    // bucket
    const objdb = new bucket.ObjectHandler({
        sender: "@user:test!o.host[server.oxvs.net]"
    })

    objdb.upload({
        __data: [
            { type: 'o.encrypted', value: 'Hello, world!' }
        ]
    }, true, [ "@user:test1!o.host[server.oxvs.net]" ]).then((id: any) => {
        objdb.get(id, "@user:test!o.host[server.oxvs.net]")
            .then((data: any) => console.log(data[0].value))
            .catch((err) => console.error(err))
    })
}

test() */