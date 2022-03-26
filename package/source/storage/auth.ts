/// <reference path="../init.ts" />
/// <reference path="localdb.ts" />
/// <reference path="bucket.ts" />
/// <reference path="../crypto/evext.ts" />

const _crypto = require("crypto")

/**
 * @file Manage the authentication section of the OXVS-SERVER
 * @name auth.ts
 * @author oxvs <admin@oxvs.net>
 * @version 0.0.5
 */

/*
 * ouid:
 * - user id format containing the user's username, and the location of their host-server
 * - the host-server format must be contained in a "o.host[]" block after the "!"
 * - ex: "@user:hkau!o.host[internal.oxvs.net]"
 */

const ouidPattern = /@user:(?<NAME>.*?)!o.host\[(?<HOSTSERVER>.*?)\]/gmi // a regex version of the stuff explained above

/**
 * @namespace auth
 * @description Handle tasks related to authentication
 */
namespace auth {
    // https://oxvs.{hostserverurl}/api/v1/auth/{function}?{data}
    // ex: https://oxvs.oxvs.net/api/v1/auth/new (new: newUser)

    /**
     * @typedef user
     * @description The "user" object that is stored
     */
    export interface user {
        host: string,
        username: string,
        ouid: string,
        currentCredential: string,
        password: string,
        uuid: string
    }

    /**
     * Validate credentials within the auth handler
     * @class Validator
     */
    export class Validator {
        type: string

        constructor(props: { type: "o.object" | "o.http" }) {
            this.type = props.type
        }

        /**
         * @func Validator.validateUserRequest
         * @description Validate a user request based on request headers
         * 
         * @param {any} request The send request object
         * @param {string} requestFor What the request is looking for
         * @returns {boolean} Approval or denial of request
         */
        public validateUserRequest = (request: any, requestFor: "o.bucketowner" | "o.token") => {
            return new Promise((resolve, reject) => {
                if (this.type !== "o.http") { return reject("Incorrect validator type") }

                // get information
                const { id } = request.params
                const headers = request.headers

                const authorization = headers.authorization
                const ouid = authorization.split("(::AT::)")[0] // should be the ouid of the user
                const token = authorization.split("(::AT::)")[1] // should be a token in the user's activesessions

                // get bucket
                const authdb = new auth.AuthDatabase({})
                if (requestFor === "o.bucketowner") {
                    const objdb = new bucket.ObjectHandler({
                        sender: ouid
                    })

                    objdb.get(id, ouid)
                        .then((data: any) => {
                            // get already validates the request, now we just need to fetch the user
                            authdb.getUser(data["$oxvs"].sender)
                                .then((user: any) => {
                                    // validate the token
                                    if (user.activeSessions.includes(token)) {
                                        resolve(data.__data)
                                    } else {
                                        reject("Invalid token")
                                    }
                                }).catch(() => reject("Unknown error (o.bucketowner tried)"))
                        }).catch((err) => reject(err))
                } else if (requestFor === "o.token") {
                    authdb.getUser(ouid)
                        .then((user: any) => {
                            // validate the token
                            if (user.activeSessions.includes(token)) {
                                resolve(true)
                            } else {
                                reject("Invalid token")
                            }
                        }).catch(() => reject("Unknown error (o.token tried)"))
                }
            })
        }

        /**
         * @func Validator.validateObjectRequest
         * @description Validate a request to fetch an object's information
         * 
         * @param {string} owner - The ouid of the owner of the object
         * @param {string} user - The ouid of the user requesting the object
         * @param {string} id - The objectId of the requested object 
         * @returns {Promise} Promise object returning either true, or rejecting with false
         */
        public validateObjectRequest = (owner: string, user: string, id: string) => {
            return new Promise((resolve, reject) => {
                if (this.type !== "o.object") { return reject("Incorrect validator type") }
                LocalDB.read(`auth/bucket/${owner}/${id}.json`, (data: any, err: string) => {
                    if (err) {
                        reject(err) // reject the promise and return an error
                    } else {
                        if (forceValidation) {
                            // validate request
                            if (user === owner) {
                                resolve(true) // return true
                            } else {
                                const shareList = bucket.decryptObject(data["$oxvs"].shareList)

                                for (let userList of shareList.__data) {
                                    if (userList.value === user || owner === user) {
                                        resolve(true)
                                        break
                                    }
                                }

                                reject(false) // don't return true
                            }
                        } else {
                            // oh you're requesting this object? okay! (allow anybody through)
                            resolve(true) // return true
                        }
                    }
                })
            })
        }
    }

    /**
     * Control the authentication database
     * @class AuthDatabase
     */
    export class AuthDatabase {
        dataName: string

        constructor(props: any) {
            this.dataName = props.dataName
        }

        /**
         * @func AuthDatabase.getUser
         * @description Get a user's information from the server based on their id
         * 
         * @param {string} ouid User's server ID
         * @returns {Promise} Promise object returning either the user's data, or an error message
         * 
         * @example
         * exampledb.getUser("@user:test!o.host[server.oxvs.net]")
         *    .catch((err) => console.error(err))
         */
        public getUser = (ouid: string) => {
            return new Promise((resolve, reject) => {
                LocalDB.read(`users/${ouid}.json`, (data: string, err: string) => {
                    if (err) {
                        reject(err) /// the user does not exist
                    } else {
                        data = JSON.parse(data)
                        resolve(data)
                    }
                })
            })
        }

        /**
         * @func AuthDatabase.generateSessionCredential
         * @description Generate a new random session credential for the user
         * 
         * @returns {string} Session Credential
         */
        private generateSessionCredential = () => {
            return (performance.now().toString(36) + Math.random().toString(36)).replace(/\./g, "")
        }

        /**
         * @func AuthDatabase.newUser
         * @description Create a new user file
         * 
         * @param {string} username The user's requested username
         * @param {string} password The user's entered password
         * @returns {Promise} Promise object returning either true, or an error message
         * 
         * @example
         * exampledb.newUser("test", "testpassword")
         *    .catch((err) => console.error(err));
         */
        public newUser = (username: string, password: string) => {
            const ouid = `@user:${username}!o.host[${HOST_SERVER}]` // create an id for the user
            return new Promise((resolve, reject) => {
                if (!doAllowNewUser) { reject("New users cannot be created in this host.") }
                LocalDB.read(`users/${ouid}.json`, (data: any, err: any) => {
                    if (err) {
                        // assume this means the user doesn't exist yet
                        const credential = this.generateSessionCredential()

                        LocalDB.write(`users/${ouid}.json`, JSON.stringify({
                            host: HOST_SERVER,
                            username: username,
                            ouid: ouid,
                            currentCredential: credential,
                            password: evext.encodeString(password),
                            uuid: _crypto.randomUUID(),
                            activeSessions: [credential] // store credentials
                        }), (err?: string) => {
                            if (err) {
                                reject(err) // error occured
                            } else {
                                resolve(true) // processed successfully
                            }
                        })

                        resolve(true)
                    } else {
                        reject("User exists already")
                    }
                })
            })
        }

        /**
         * @func AuthDatabase.renewUserSession
         * @description Generates a new session credential and assigns it to a given user
         * 
         * @param {string} ouid User's server ID
         * @returns {Promise} Promise object returning either true, or an error message
         */
        public renewUserSession = (ouid: string) => {
            return new Promise((resolve, reject) => {
                LocalDB.read(`users/${ouid}.json`, (data: any, err: any) => {
                    if (err) {
                        reject(err) // reject with the error message
                    } else {
                        data = JSON.parse(data)
                        data.currentCredential = this.generateSessionCredential()
                        data.activeSessions.push(data.currentCredential)

                        LocalDB.write(`users/${ouid}.json`, JSON.stringify(data), (data1: any, err1: any) => {
                            if (err1) {
                                reject(err1) // reject with other error message
                            } else {
                                resolve(data.currentCredential) // session has been renewed
                            }
                        })
                    }
                })
            })
        }

        /**
         * @func AuthDatabase.login
         * @description Verifies the user's access information, and then generates new user credentials
         * 
         * @param {string} ouid - The puid of the user that is signing in
         * @param {string} password - The user's entered password that will be compared to the stored password
         * @returns {Promise} Promise object returning either the user's new credentials, or an error message
         * 
         * @example
         * exampledb.login("@user:test!o.host[server.oxvs.net]", "testpassword")
         *    .then((credentials) => console.log(credentials))
         *    .catch((err) => console.error(err))
         */
        public login = (ouid: string, password: string) => {
            return new Promise((resolve, reject) => {
                /*
                 * oxvs/auth/login:
                 * - use getUser() to fetch the user information for the database
                 * - decode the password with evext and compare the password given
                 * - return based on if the passwords match
                 * - if they do:
                 *  - return new session credentials after renewing them
                 * - if they don't:
                 *  - return an error message
                 */

                this.getUser(ouid)
                    .then((data: any) => {
                        if (evext.decodeString(data.password) === password) {
                            this.renewUserSession(ouid)
                                .then((newCredential) => resolve(newCredential))
                                .catch((err) => reject(err))
                        } else { reject("Passwords do not match.") }
                    }).catch((err) => reject(err))
            })
        }
    }
}