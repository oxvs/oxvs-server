/// <reference path="storage/auth.ts" />
/// <reference path="storage/bucket.ts" />
/// <reference path="init.ts" />

// some jsdoc stuff

/**
 * @global
 * @name HOST_SERVER
 * @description The host server url that this service is deployed to
 * @example https://server.exvs.net
 */
const HOST_SERVER = process.env.HOST_SERVER

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