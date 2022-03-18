/// <reference path="auth.ts" />

namespace bucket {
    /**
     * Upload data to server
     * @class bucket.DataUploader
     */
    export class DataUploader {
        sender: string

        constructor(props) {
            this.sender = props.sender
        }

        /**
         * 
         * @param {object} data - The data that will be saved as a new bucket/object
         * @returns {Promise} Promise object returning either true or an error message
         */
        public upload(data: object) {
            const objectId = (performance.now().toString(36)+Math.random().toString(36)).replace(/\./g,"")

            return new Promise((resolve, reject) => {
                localdb.write(`auth/bucket/${objectId}.json`, JSON.stringify(data), (data, err) => { 
                    if (err) {
                        reject(err) // reject the promise and return an error
                    } else {
                        resolve(true) // return true
                    }
                })
            })
        }
    }
}