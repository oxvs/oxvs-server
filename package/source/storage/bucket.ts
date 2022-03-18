/**
 * @file Manage the bucket and storage section of the OXVS-SERVER
 * @author 0a_oq <hkau@oxvs.net>
 * @version 0.0.1
 */

/// <reference path="auth.ts" />

namespace bucket {
    /**
     * Upload data to server
     * @class ObjectHandler
     */
    export class ObjectHandler {
        sender: string

        constructor(props) {
            this.sender = props.sender
        }

        /**
         * @func ObjectHandler.upload
         * @description Upload JSON data to storage for quick access later
         * 
         * @param {object} data - The data that will be saved as a new bucket/object
         * @returns {Promise} Promise object returning either the ID or an error message
         */
        public upload(data: any) {
            // generate id
            const objectId = (performance.now().toString(36)+Math.random().toString(36)).replace(/\./g,"")
            
            // add sender value to data
            data.__sender = this.sender

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
         * @returns {Promise} Promise object returning the data or an error message
         */
        public get(id: string) {
            return new Promise((resolve, reject) => {
                localdb.read(`auth/bucket/${this.sender}/${id}.json`, (data, err) => { 
                    if (err) {
                        reject(err) // reject the promise and return an error
                    } else {
                        resolve(data) // return data
                    }
                })
            })
        }
    }
}