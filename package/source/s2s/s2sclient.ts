/**
 * @file Server to Server communication
 * @name s2sclient.ts
 * @version 0.0.2
 * @author oxvs <admin@oxvs.net>
 */

/// <reference path="../init.ts" />
require('dotenv').config()

/**
 * @namespace s2s
 * @description Handle Server to Server communication
 */
namespace s2s {
    /**
     * @typedef reqcontent
     * @description The content to send to the specified server
     */
    export type reqcontent = { name: string, content: string }[]

    /**
     * @typedef requestType
     * @description The type of request to send
     * @example "o.dummy"
     * @default "o.dummy"
     */
    export type requestType = "o.user" | "o.json" | "o.dummy" // o.user -> auth.ts; o.json -> bucket.ts

    /**
     * @typedef request
     * @description An object containing information about an HTTP request
     * @example 
     * { 
     *    destination: "https://server2.oxvs.net/api/v1/auth/new", 
     *    type: "o.user", 
     *    body: {
     *      host: "server.oxvs.net",
     *      username: "test",
     *      ouid: "@user:test!o.host[server.oxvs.net]",
     *      currentCredential: "-----"
     *    } 
     * }
     * @default null
     */
    export type request = { destination: string, type: requestType, body: {}, headers: {} }

    /**
     * @func s2s.checkHostServer
     * @description Check if the origin server sending a request matches the current host server
     * 
     * @param {string} origin - The origin host server that the request is coming form
     * @returns {boolean} If the origin server matches the current host server
     */
    export function checkHostServer(origin: string) {
        return (origin === HOST_SERVER)
    }

    /**
     * @func s2s.contentToString
     * @description Convert a reqcontent object to a URL-friendly string version
     * 
     * @param {reqcontent} content 
     * @returns {string} A URL-friendly string containing the information from the content
     * 
     * @deprecated Since version 0.0.2 due to the fetch() api being preferred
     */
    export function contentToString(content: reqcontent | string) {
        if (typeof content === "string") { return content }
        let body: string = ""

        for (let query of content) {
            // if the length of the body is more than 1, add & first
            if (body.length > 1) {
                body += `&${query.name}=${query.content}`
            } else {
                body += `${query.name}=${query.content}`
            }
        }

        return body
    }

    /**
     * Handle requests to other host servers
     * @class requestHandler
     */
    export class requestHandler {
        type: string

        constructor(props: any) {
            this.type = props.type
        }

        /**
         * @func requestHandler.POST
         * @description Send a POST request to an outside host server
         * 
         * @param {request} props - An object containing all information needed to send a request to another host server
         * @returns {Promise} Promise object returning either the response, or an error message
         */
        public POST = (props: request) => {
            return new Promise((resolve, reject) => {
                fetch(props.destination, {
                    method: 'POST',
                    body: JSON.stringify(props.body),
                    headers: props.headers
                }).then((response) => response.json())
                .then((json) => resolve(json))
                .catch((err) => reject(err))
            })
        }

        /**
         * @func requestHandler.GET
         * @description Send a GET request to an outside host server
         * 
         * @param {request} props 
         * @returns {Promise} Promise object returning either the response, or an error message
         */
        public GET = (props: request) => {
            return new Promise((resolve, reject) => {
                fetch(props.destination, {
                    method: 'GET',
                    body: JSON.stringify(props.body),
                    headers: props.headers
                }).then((response) => response.json())
                .then((json) => resolve(json))
                .catch((err) => reject(err))
            })
        }
    }
}