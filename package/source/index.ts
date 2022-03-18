/// <reference path="storage/localdb.ts" />
/// <reference path="storage/auth.ts" />
/// <reference path="storage/bucket.ts" />

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

/**
 * @typedef {object} user
 * @typedef {object} userCredential 
 */
interface user { host: string, username: string, ouid: string, currentCredential: string, tag: "o.user" }
interface userCredential { ouid: string, tag: "o.userCredential" }
/**
 * @global
 * @typedef {object} upload
 */
interface upload { sender: string, tag: "o.upload" }

console.log("Run with no issues.")

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
        data: "Hello, world!"
    }, [
        "@user:test1!o.host[server.oxvs.net]",
        "@user:test2!o.host[server.oxvs.net]",
        "@user:test3!o.host[server.oxvs.net]"
    ])
}

test() */