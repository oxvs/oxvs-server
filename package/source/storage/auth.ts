/**
 * @file Manage the authentication section of the OXVS-SERVER
 * @author 0a_oq <hkau@oxvs.net>
 * @version 0.0.1
 */

const localdb = null // placeholder

/*
 * ouid:
 * - user id format containing the user's username, and the location of their host-server
 * - the host-server format must be contained in a "o.host[]" block after the "!"
 * - ex: "@user:hkau!o.host[internal.oxvs.net]"
 */

const ouidPattern = /@user:(?<NAME>.*?)!o.host\[(?<HOSTSERVER>.*?)\]/gmi // a regex version of the stuff explained above

// namespace
namespace authHandle {
    /**
     * Validate credentials within the auth handler
     * @class Validator
     */
    export class Validator {
        type: string

        constructor(props) {
            this.type = props.type
        }

        /**
         * @func Validator.validateUserRequest
         * @description Validate a user request based on sent credentials
         * 
         * @param {string} credentials User access token
         * @param {string} ouid User's server ID
         * @returns {boolean} Approval or denial of request
         */
        public validateUserRequest = (credentials: string, ouid: string) => {

        }
    }

    /**
     * Control the authentication database
     * @class AuthDatabase
     */
    export class AuthDatabase {
        dataName: string

        constructor(props) {
            this.dataName = props.dataName
        }

        /**
         * @func AuthDatabase.getUser
         * @description Get a user's information from the server based on their id
         * 
         * @param {string} ouid User's server ID
         * @returns {Promise} Promise object returning either the user's data, or an error message
         */
        public getUser = (ouid: string) => {
            return new Promise((resolve, reject) => {
                localdb.read(`auth/users/${ouid}.json`, (data, err) => {
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
            return (performance.now().toString(36)+Math.random().toString(36)).replace(/\./g,"")
        }

        /**
         * @func AuthDatabase.newUser
         * @description Create a new user file
         * 
         * @param {string} username The user's requested username
         * @returns {Promise} Promise object returning either true or an error message
         */
        public newUser = (username: string) => {
            const ouid = `@user:${username}!o.host[${HOST_SERVER}]` // create an id for the user
            return new Promise((resolve, reject) => {
                localdb.read(`auth/users/${ouid}.json`, (data, err) => {
                    if (err) {
                        // assume this means the user doesn't exist yet
                        const credential = this.generateSessionCredential()

                        localdb.write("auth/users.json", JSON.stringify({
                            host: HOST_SERVER,
                            username: username,
                            ouid: ouid,
                            currentCredential: credential
                        }), () => { return })

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
         * @returns {Promise} Promise object returning either true or an error message
         */
        public renewUserSession = (ouid: string) => {
            return new Promise((resolve, reject) => {
                localdb.read(`auth/users/${ouid}.json`, (data, err) => {
                    if (err) {
                        reject(err) // reject with the error message
                    } else {
                        data = JSON.parse(data)
                        data.currentCredential = this.generateSessionCredential()
                        
                        localdb.write(`auth/users/${ouid}.json`, (data1, err1) => {
                            if (err1) {
                                reject(err1) // reject with other error message
                            } else {
                                resolve(true) // session has been renewed
                            }
                        })
                    }
                })
            })
        }
    }
}