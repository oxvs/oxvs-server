/// <reference path="../init.ts" />
/// <reference path="../crypto/evext.ts" />
require('dotenv').config()

/**
 * @file Manage the bucket and storage section of the OXVS-SERVER
 * @name bucket.ts
 * @author oxvs <admin@oxvs.net>
 * @version 0.0.3
 */

/// <reference path="auth.ts" />

/**
 * @namespace bucket
 * @description Handle tasks related to object storage
 */
namespace bucket {
    // https://oxvs.{hostserverurl}/api/v1/object/{function}?{data}
    // ex: https://oxvs.oxvs.net/api/v1/object/upload

    /**
     * Upload data to server
     * @class ObjectHandler
     */
    export class ObjectHandler {
        sender: string

        constructor(props: any) {
            // props.sender is basically just who the object belongs to
            // a little weird to be named this.sender later on though, so remember that
            this.sender = props.sender
            console.log("Created an ObjectHandler object with no issues.")
        }

        /**
         * @func ObjectHandler.upload
         * @description Upload JSON data to storage for quick access later
         * 
         * @param {object} data - The data that will be saved as a new bucket/object
         * @param {array} shareList - A list of user IDs that have access to the resource
         * @param {boolean} encrypt - Controls the encryption level of the data
         * @returns {Promise} Promise object returning either the ID or an error message
         * 
         * @example
         * objdb.upload({
         *   __data: [
         *    { type: 'o.encrypted', value: 'Hello, world!' }
         *   ]
         * }, true, [ "@user:test1!o.host[server.oxvs.net]" ]).then((id: any) => {
         *    console.log(id)
         * })
         */
        public upload(data: any, encrypt: boolean, shareList: string[]) {
            // generate id
            const objectId = _crypto.randomUUID()

            // add sender value to data
            data["$oxvs"] = {}
            data["$oxvs"].sender = this.sender
            data["$oxvs"].shareList = shareList

            // write data
            return new Promise((resolve, reject) => {
                if (!data.__data) { reject("Object should contain __data value.") }

                if (!encrypt) { 
                    data["$oxvs"].type = "o.rawdata"
                    data.__data = JSON.stringify(data.__data) 
                } else {
                    data["$oxvs"].type = "o.encrypted"

                    // set all objects with a type of "o.encrypted" to have an encrypted value
                    for (let _object of data.__data) {
                        if (typeof _object === "object") {
                            if (_object.type === "o.encrypted") {
                                data.__data[data.__data.indexOf(_object)].value = evext.encodeString(_object.value)
                            }
                        }
                    }
                }
                
                LocalDB.write(`bucket/${this.sender}/${objectId}.json`, JSON.stringify(data), (data: any, err: any) => {
                    if (err) {
                        reject(err) // reject the promise and return an error
                    } else {
                        resolve(objectId) // return id
                    }
                })
            })
        }

        /**
         * @func ObjectHandler.get
         * @description Get JSON data previously uploaded to storage by using the ID
         * 
         * @param {string} id - The objectId of the requested object 
         * @param {string} requestFrom - The ouid of the user requesting the object
         * @returns {Promise} Promise object returning the data or an error message
         * 
         * @example
         * objdb.get(id, "@user:test!o.host[server.oxvs.net]")
         *   .then((data: any) => console.log(data[0].value))
         *   .catch((err) => console.error(err))
         */
        public get(id: string, requestFrom: string) {
            // create object validator
            const validator = new auth.Validator({
                type: 'o.object'
            })

            // create promise
            return new Promise((resolve, reject) => {
                LocalDB.read(`bucket/${this.sender}/${id}.json`, (data: any, err: any) => {
                    if (err) {
                        reject(err) // reject the promise and return an error
                    } else {
                        data = JSON.parse(data)
                        if (forceValidation) {
                            // validate request
                            validator.validateObjectRequest(this.sender, requestFrom, id)
                                .then(() => {
                                    if (data["$oxvs"].type === "o.encrypted") { 
                                        // decrypt all objects with a type of "o.encrypted"
                                        for (let _object of data.__data) {
                                            if (typeof _object === "object") {
                                                if (_object.type === "o.encrypted") {
                                                    data.__data[data.__data.indexOf(_object)].value = evext.decodeString(_object.value)
                                                }
                                            }
                                        }

                                        // return decoded data
                                        resolve(data.__data)
                                    } else if (data["$oxvs"].type === "o.rawdata") { 
                                        resolve(data.__data) // return data
                                    }
                                })
                                .catch((err) => {
                                    reject(err) // validation failed
                                })
                        } else {
                            // oh you're requesting this object? okay! (allow anybody through)
                            if (data["$oxvs"].type !== "o.encrypted") {
                                resolve(data.__data)
                            } else {
                                resolve("**Cannot decrypt without forceValidation (https://docs.oxvs.net/global.html#forceValidation)**")
                            }
                        }
                    }
                })
            })
        }

        /**
         * @func ObjectHandler.delete
         * @description Delete a stored object by using the ID
         * 
         * @param {string} id - The objectId of the request object
         * @param {string} requestFrom - The ouid of the user requesting the object
         * @returns {Promise} Promise object returning true of an error message
         */
        public delete(id: string, requestFrom: string) {
            // delete file
            return new Promise((resolve, reject) => {
                // create object validator
                const validator = new auth.Validator({
                    type: 'o.object'
                })

                // create promise
                return new Promise((resolve, reject) => {
                    function _delete(this: any) {
                        LocalDB.unlink(`bucket/${this.sender}/${id}.json`, (err: any) => {
                            if (err !== true) {
                                reject(err)
                            } else {
                                resolve(true) // resolve
                            }
                        })
                    }

                    if (forceValidation) {
                        // validate request
                        validator.validateObjectRequest(this.sender, requestFrom, id)
                            .then(() => {
                                _delete() // delete file
                            })
                            .catch((err) => {
                                reject(err) // validation failed
                            })
                    } else {
                        // oh you're requesting this object? okay! (allow anybody through)
                        _delete() // delete file
                    }
                })
            })
        }
    }
}