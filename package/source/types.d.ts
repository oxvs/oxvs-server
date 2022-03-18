/**
 * @typedef {object} user
 * @typedef {object} userCredential 
 */
export interface user { host: string, username: string, ouid: string, tag: "o.user" }
export interface userCredential { ouid: string, tag: "o.userCredential" }
/**
 * @typedef {object} upload
 */
export interface upload { sender: string, tag: "o.upload" }