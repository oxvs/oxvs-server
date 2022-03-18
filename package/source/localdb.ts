/**
 * @namespace LocalDB
 * @description Local database handler
 */
namespace LocalDB {
    const fs = require("fs")
    const path = require("path")

    let dataPath = path.join(process.cwd(), "data")

    /**
     * @func LocalDB.createDB
     * @description Creates a database folder
     * 
     * @param {string} name - The name of the database
     * @param {object} options Database options and rules
     * @returns {string} Path to the data folder on the local machine
     */
    export const createDB = function (name: string, options: { logStatus: boolean }) {
        // config
        if (options === null) {
            // defaults
            this.logStatus = true
        } else {
            // custom
            this.logStatus = options.logStatus
        }

        // create a folder in "process.cwd()" named "data" that stores JSON files for the DB

        const dbBase = [{
            name: name,
            lastUpdated: new Date().toLocaleString()
        }]

        fs.mkdir(path.join(__dirname, 'data'), { recursive: true }, (err) => {
            if (err) {
                return console.error(err)
            }
        })

        fs.writeFile(path.join(process.cwd(), "/data", "db.json"), JSON.stringify(dbBase), 'utf-8', (err) => {
            if (err) {
                return console.error(err)
            }
        })

        dataPath = path.join(process.cwd(), "data")
        if (this.logStatus === true) { console.log("[LocalDB]: Successful startup!") }

        return dataPath
    }

    /**
     * @func LocalDB.read
     * @description Read data from a local file
     * 
     * @param {string} path  - The path to the file relative to the /data/ folder
     * @param {Function} callback - A function that will run after all tasks have completed (or errored)
     */
    export const read = function (path: string, callback: Function) {
        // return a callback containing the data of the requested document (or the error)
        fs.readFile(`${dataPath}/${path}`, 'utf-8', function (data, err) {
            if (err) {
                if (callback) { return callback(data, err) }
            } else {
                if (callback) { return callback(data, err) }
            }
        })
    }

    /**
     * 
     * @param {string} path - The path to the file relative to the /data/ folder
     * @param {string} data - The data to be written
     * @param {Function} callback - A function that will run after all tasks have completed (or errored)
     */
    export const write = function (path: string, data: string, callback: Function) {
        // write data to the db

        // create collections (directories) when needed, don't do for final "/" because it will always be the document name
        const dir_split = path.split("/")

        if (dir_split[1]) {
            for (let datapoint of dir_split) {
                if (dir_split.indexOf(datapoint) !== dir_split.length - 1) {
                    fs.mkdir(`${dataPath}/${datapoint}`, { recursive: true }, (err) => {
                        if (err) {
                            return console.error(err)
                        }
                    })
                }
            }
        }

        // now that the directories exist, write the data
        fs.writeFile(`${dataPath}/${path}`, data, 'utf-8', (err) => {
            if (err) {
                if (callback) { return callback(err) }
                return err
            } else {
                if (callback) { return callback(err) }
            }
        })
    }
}