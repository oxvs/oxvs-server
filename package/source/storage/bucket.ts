/**
 * @file Manage the bucket and storage section of the OXVS-SERVER
 * @name bucket.ts
 * @author 0a_oq <hkau@oxvs.net>
 * @version 0.0.1
 */

/// <reference path="auth.ts" />

/**
 * @namespace bucket
 * @description Handle tasks related to object storage
 */
namespace bucket {
    /**
     * Upload data to server
     * @class ObjectHandler
     */
    export class ObjectHandler {
        sender: string

        constructor(props) {
            // props.sender is basically just who the object belongs to
            // a little weird to be named this.sender later on though, so remember that
            this.sender = props.sender
        }

        /**
         * @func ObjectHandler.upload
         * @description Upload JSON data to storage for quick access later
         * 
         * @param {object} data - The data that will be saved as a new bucket/object
         * @param {array} shareList - A list of user IDs that have access to the resource
         * @returns {Promise} Promise object returning either the ID or an error message
         */
        public upload(data: any, shareList: string[]) {
            // generate id
            const objectId = (performance.now().toString(36) + Math.random().toString(36)).replace(/\./g, "")

            // add sender value to data
            data["$oxvs"] = {}
            data["$oxvs"].sender = this.sender
            data["$oxvs"].shareList = shareList

            // write data
            return new Promise((resolve, reject) => {
                localdb.write(`auth/bucket/${this.sender}/${objectId}.json`, JSON.stringify(data), (data, err) => {
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
         */
        public get(id: string, requestFrom: string) {
            // create object validator
            const validator = new auth.Validator({
                type: 'object'
            })

            // create promise
            return new Promise((resolve, reject) => {
                localdb.read(`auth/bucket/${this.sender}/${id}.json`, (data, err) => {
                    if (err) {
                        reject(err) // reject the promise and return an error
                    } else {
                        if (forceValidation) {
                            // validate request
                            validator.validateObjectRequest(this.sender, requestFrom, id)
                                .then(() => {
                                    resolve(data) // return data
                                })
                                .catch((err) => {
                                    reject(err) // validation failed
                                })
                        } else {
                            // oh you're requesting this object? okay! (allow anybody through)
                            resolve(data) // return data
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
                    type: 'object'
                })

                // create promise
                return new Promise((resolve, reject) => {
                    function _delete() {
                        localdb.unlink(`auth/bucket/${this.sender}/${id}.json`, (err) => {
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