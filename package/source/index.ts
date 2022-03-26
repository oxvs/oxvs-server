/// <reference path="storage/localdb.ts" />
/// <reference path="storage/auth.ts" />
/// <reference path="storage/bucket.ts" />

let port = 8080
process.argv.forEach(function (value, index, array) {
    if (index === 2) {
        port = parseFloat(value) // set port
    }
})

/**
 * @file Handle HTTP requests
 * @name index.ts
 * @author oxvs <admin@oxvs.net>
 * @version 0.0.5
 */

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

/**
 * @global
 * @func newErrorString
 * @description Create a new error string
 * 
 * @param {string} ouid The ouid of a user that is requesting the data
 * @param {any} request The HTTP request object
 * @param {string} err The error message that was returned
 * @returns {string} An error message with all needed information
 */
function newErrorString(ouid: string, request: any, err: string): string {
    return `[${new Date().toISOString()}] [ERROR] [${ouid}] [${request.params.id || "#noid"}] [${err}]`
}

const express = require("express")
const rateLimit = require("express-rate-limit")

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 500,
	standardHeaders: true,
	legacyHeaders: false,
})

const api = express()
api.use(express.json())
api.use(limiter) // handle rate limiting
api.listen(port, () => { console.log("Local server active") })

api.get("/", (request: any, response: any) => {
    response.status(403).send("Forbidden")
})

// auth
api.post("/api/v1/auth/login", (request: any, response: any) => {
    // http://localhost:8080/api/v1/auth/login
    const { ouid, password } = request.body
    if (!ouid || !password) {
        response.status(400).send({ message: "Failed to create user", response: false, request: "/auth/login" })
        return
    }

    const authdb = new auth.AuthDatabase({})
    authdb.login(ouid, password).then(token => {
        response.status(200).send({ token: token })
    }).catch(error => {
        response.status(400).send(error)
    })
})

api.post("/api/v1/auth/new", (request: any, response: any) => {
    // http://localhost:8080/api/v1/auth/new
    const { username, password } = request.body
    if (!username || !password) {
        response.status(400).send({ message: "Failed to create user", response: false, request: "/auth/new" })
        return
    }

    const authdb = new auth.AuthDatabase({})
    authdb.newUser(username, password)
        .then(() => {
            response.status(200).send({ message: "User created" })
        }).catch(err => {
            console.log(newErrorString("@unknown", request, err))
            response.status(400).send({ message: "Failed to create user", response: err, request: "/auth/new" })
        })
})

// bucket
api.get("/api/v1/bucket/get/:id", (request: any, response: any) => {
    // http://localhost:8080/api/v1/bucket/get/example-id
    // create a new object handler
    const validator = new auth.Validator({
        type: "o.http"
    })

    // validate the request
    validator.validateUserRequest(request, "o.bucketowner")
        .then((data: any) => {
            response.status(200).send(data)
        }).catch((err: any) => {
            console.log(newErrorString("@unknown", request, err))
            response.status(401).send({ 
                message: "Unauthorized", 
                response: err, 
                request: `/bucket/get/${request.params.id}` 
            })
        })
})

api.post("/api/v1/bucket/upload", (request: any, response: any) => {
    // http://localhost:8080/api/v1/bucket/upload
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
                console.log(newErrorString(ouid, request, err))
                response.status(400).send({ message: "Error uploading object", response: err, request: "/bucket/upload" })
            })
        }).catch((err: any) => {
            console.log(newErrorString(ouid, request, err))
            response.status(401).send({ message: "Unauthorized", response: err, request: "/bucket/upload" })
        })
})

api.delete("/api/v1/bucket/:id/delete", (request: any, response: any) => {
    // http://localhost:8080/api/v1/bucket/example-id/delete
    const { id } = request.params

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

            objdb.delete(id, request.body.requestFrom).then(() => {
                response.status(200).send({ message: "Object deleted" })
            }).catch((err) => {
                console.log(newErrorString(ouid, request, err))
                response.status(400).send({ message: "Error deleting object", response: err, request: `/bucket/${id}/delete` })
            })
        }).catch((err: any) => {
            console.log(newErrorString(ouid, request, err))
            response.status(401).send({ message: "Unauthorized", response: err, request: `/bucket/${id}/delete` })
        })
})