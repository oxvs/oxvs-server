/**
 * @file Handle client object state syncing
 * @name sync.ts
 * @version 0.0.4
 * @author oxvs <admin@oxvs.net>
 */

/// <reference path="../storage/auth.ts" />
/// <reference path="../storage/bucket.ts" />

/**
 * @namespace sync
 * @description Sync client and server objects
 */
namespace sync {
    // https://oxvs.{hostserverurl}/api/v1/sync
    // ex: https://oxvs.oxvs.net/api/v1/sync

    /**
     * @func sync.syncState
     * @description Create a sync request to keep the user client up-to-date
     * 
     * @param {"o.userstate" | "o.object"} type - The type of object to sync 
     * @param {any} props - Any extra properties required by the specified object type 
     * @returns {Promise} Promise object returning either the result of the sync request, or an error message
     */
    export function syncState(type: "o.userstate" | "o.object", props: any) {
        /*
         * o.userstate:
         * - contains the state of the current user
         * - props:
         *  - {string} ouid
         *  - {string} sessionCredential
         * o.object:
         * - contains information about an object
         * - props:
         *  - {string} objectId
         *  - {string} ouid
         */

        return new Promise((resolve, reject) => {
            if (type === "o.userstate" && props.ouid && props.sessionCredential) {
                // create a database entry so we can fetch the user info
                const database = new auth.AuthDatabase({})

                // begin syncing
                database.getUser(props.ouid)
                    .then((data: auth.user | any) => {
                        if (data.activeSessions.includes(props.sessionCredential)) {
                            resolve(true) // user is all good
                        } else {
                            reject(false) // the current session is invalid
                        }
                    }).catch((err) => reject(err))
            } else if (type === "o.object" && props.objectId && props.ouid) {
                // create a database entry so we can fetch the object info
                const database = new bucket.ObjectHandler({})
                
                // begin syncing
                database.get(props.objectId, props.ouid)
                    .then((data: any) => {
                        resolve(data.__data) // resend the data
                    })
                    .catch((err) => reject(err))
            }
        })
    }
}