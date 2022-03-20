/// <reference path="../init.ts" />
/// <reference path="../crypto/evext.ts" />
require('dotenv').config()

/**
 * @file Manage the bucket and storage section of the OXVS-SERVER
 * @name bucket.ts
 * @author oxvs <admin@oxvs.net>
 * @version 0.0.4
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
     * @func bucket.encryptObject
     * @description Encrypt all values in an object that are tagged with "o.encrypted"
     * 
     * @param {object} data - The object to encrypt
     * @returns {object} Data object with values encrypted
     */
    export function encryptObject(data: any) {
        for (let _object of data.__data) {
            if (typeof _object === "object") {
                if (_object.type === "o.encrypted") {
                    data.__data[data.__data.indexOf(_object)].value = evext.encodeString(_object.value)
                }
            }
        }

        return data
    }

    /**
     * @func bucket.decryptObject
     * @description Decrypt all values in an object that are tagged with "o.encrypted"
     * 
     * @param {object} data - The object to decrypt 
     * @returns {object} Data object with values decrypted 
     */
    export function decryptObject(data: any) {
        for (let _object of data.__data) {
            if (typeof _object === "object") {
                if (_object.type === "o.encrypted") {
                    data.__data[data.__data.indexOf(_object)].value = evext.decodeString(_object.value)
                }
            }
        }

        return data
    }

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
            console.log(`Created an ObjectHandler object with no issues. (${this.sender})`)
        }

        /**
         * @func ObjectHandler.upload
         * @description Upload JSON data to storage for quick access later
         * 
         * @param {object} data - The data that will be saved as a new bucket/object
         * @param {array} shareList - A list of user IDs that have access to the resource
         * @param {boolean} encrypt - Controls the encryption level of the data
         * @returns {Promise} Promise object returning either the object ID, or an error message
         * 
         * @example
         * exampledb.upload({
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
            data["$oxvs"].shareList.push("@0")

            // write data
            return new Promise((resolve, reject) => {
                if (!data.__data) { reject("Object should contain __data value.") }

                if (!encrypt) {
                    data["$oxvs"].type = "o.rawdata"
                    data.__data = JSON.stringify(data.__data)
                } else {
                    data["$oxvs"].type = "o.encrypted"
                    data = encryptObject(data)
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
         * @returns {Promise} Promise object returning either the data, or an error message
         * 
         * @example
         * exampledb.get(id, "@user:test!o.host[server.oxvs.net]")
         *   .then((data: any) => console.log(data[0].__data.value))
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
                                        data = decryptObject(data)

                                        // return decoded data
                                        resolve(data)
                                    } else if (data["$oxvs"].type === "o.rawdata") {
                                        resolve(data) // return data
                                    }
                                })
                                .catch((err) => {
                                    reject(err) // validation failed
                                })
                        } else {
                            // oh you're requesting this object? okay! (allow anybody through)
                            if (data["$oxvs"].type !== "o.encrypted") {
                                resolve(data)
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
         * @returns {Promise} Promise object returning either true, or an error message
         */
        public delete(id: string, requestFrom: string) {
            // delete file

            // create object validator
            const validator = new auth.Validator({
                type: 'o.object'
            })

            // create promise
            return new Promise((resolve, reject) => {
                if (forceValidation) {
                    // validate request
                    validator.validateObjectRequest(this.sender, requestFrom, id)
                        .then(() => {
                            LocalDB.unlink(`bucket/${this.sender}/${id}.json`, (err: any) => {
                                if (err !== true) {
                                    reject(err)
                                } else {
                                    resolve(true) // resolve
                                }
                            })
                        })
                        .catch((err) => {
                            reject("Validation failed") // validation failed
                        })
                } else {
                    // oh you're requesting this object? okay! (allow anybody through)
                    LocalDB.unlink(`bucket/${this.sender}/${id}.json`, (err: any) => {
                        if (err !== true) {
                            reject(err)
                        } else {
                            resolve(true) // resolve
                        }
                    })
                }
            })
        }

        /**
         * @func ObjectHandler.update
         * @description Update an object with new data by using the ID
         * 
         * @param {string} id - The objectId of the request object
         * @param {string} requestFrom - The ouid of the user requesting the object
         * @param {object} newData - The new data to write to the file (replaces)
         * @returns {Promise} Promise object returning either true, or an error message
         * 
         * @example
         * exampledb.update("2a2d0b59-9a2d-47ab-9488-23f5766a1413", "@user:test!o.host[server.oxvs.net]", {
         *   { type: 'o.encrypted', value: 'Updated Data' }
         * }).catch((err) => console.log(err))
         */
        public update(id: string, requestFrom: string, newData: any) {
            // update file
            return new Promise((resolve, reject) => {
                // this.get already validates requests
                this.get(id, requestFrom)
                    .then((__DECRYPTED: any) => {
                        // if we got to this point, the request has already been validated
                        LocalDB.read(`/bucket/${this.sender}/${id}.json`, (data: any, err: any) => {
                            if (err) {
                                reject(err)
                            } else {
                                data.__data = __DECRYPTED.__data

                                // set data.__data to be newData or newData.__data
                                if (newData.__data) { data.__data = newData.__data }
                                else { data.__data = newData }

                                data = encryptObject(data) // re-encrypt the decrypted object this.get sends us

                                // update file
                                LocalDB.write(`bucket/${this.sender}/${id}.json`, JSON.stringify(data), (data: any, err: string) => {
                                    if (err) {
                                        reject(err)
                                    } else {
                                        // resolve with success
                                        resolve(true)
                                    }
                                })
                            }
                        })
                    })
                    .catch((err) => reject(err))
            })
        }
    }
}