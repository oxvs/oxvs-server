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

// host server identification
const HOST_SERVER = process.env.HOST_SERVER

// namespace
namespace authHandle {
    /**
     * Validate credentials within the auth handler
     * @class Validator
     */
    export class Validator {
        type: string

        /**
         * @constructor Construct a validator
         * @param props 
         */
        constructor(props) {
            this.type = props.type
        }

        /**
         * Validate a user request based on sent credentials
         * @param {string} credentials User access token
         * @param {string} ouid User's server id
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

        /**
         * @constructor Construct an AuthDatabase object
         * @param {string} dataName - The name of the database in use
         */
        constructor(props) {
            this.dataName = props.dataName
        }

        /**
         * Get a user's information from the server based on their id
         * @param {string} ouid user's server id
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
                        localdb.write("auth/users.json", JSON.stringify({
                            host: HOST_SERVER,
                            username: username,
                            ouid: ouid
                        }), () => { return })

                        resolve(true)
                    } else {
                        reject("User exists already")
                    }
                })
            })
        }
    }
}