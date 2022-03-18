/// <reference path="../init.ts" />
require('dotenv').config()

/**
 * @file EVEXT Encryption handler
 * @name evext.ts
 * @author zbase EVEXT <admin@zbase.dev>
 * @version 0.1.5
 */

/**
 * @namespace evext
 * @description EVEXT encryption namespace
 */

namespace evext {
    /**
     * @func evext.encodeString 
     * @description Encode a string using evext
     * 
     * @param {string} string - The string to be encoded
     * @returns {string} An encoded string, or a blank string
     */
    export function encodeString(string: string): string {
        // for each character in the string, get the character's index in the encoding ruleset and then add that many zero-width spaces to the encoded string
        if (!process.env.CONTROL_ALPHABET) { return "" }

        let encodedString = ""
    
        for (let i = 0; i < string.length; i++) {
            let index = process.env.CONTROL_ALPHABET.indexOf(string[i]) + 1
    
            let zeroWidthSpaces = ""
            for (let j = 0; j < index; j++) {
                zeroWidthSpaces += "\u200B"
            }
    
            encodedString += zeroWidthSpaces + "."
        }
    
        return encodedString
    }

    /**
     * @func evext.decodeString 
     * @description Decode a string using evext
     * 
     * @param {string} string - The string to be encoded
     * @returns {string} An encoded string, or a blank string
     */
    export function decodeString(string: string): string {
        // for each group in the string (separated by .) get the index of the group and then the index of the character in the encoding ruleset and then add it to the decoded string
        if (!process.env.CONTROL_ALPHABET) { return "" }
    
        let decodedString = ""
    
        for (let group of string.split(".")) {
            let index = group.length - 1
            decodedString += process.env.CONTROL_ALPHABET.charAt(index)
        }
    
        return decodedString
    }
}