/// <reference path="storage/localdb.ts" />
/// <reference path="storage/auth.ts" />
/// <reference path="storage/bucket.ts" />

// some jsdoc stuff

/**
 * @global
 * @name HOST_SERVER
 * @description The host server url that this service is deployed to
 * @example "https://server.oxvs.net"
 */
const HOST_SERVER = process.env.HOST_SERVER

/**
 * @global
 * @name doAllowNewUser
 * @description Control if new users are allowed to be created
 * @example true | false
 * @default true
 */
const doAllowNewUser = true

/**
 * @global
 * @name forceValidation
 * @description Force credential validation for all functions that interact with the database
 * @example true | false
 * @default true
 */
const forceValidation = true

/**
 * @typedef {object} user
 * @typedef {object} userCredential 
 */
interface user { host: string, username: string, ouid: string, currentCredential: string, tag: "o.user" }
interface userCredential { ouid: string, tag: "o.userCredential" }
/**
 * @global
 * @typedef {object} upload
 */
interface upload { sender: string, tag: "o.upload" }