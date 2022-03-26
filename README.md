# oxvs-server

OXVS is an open-source platform for authentication and data storage. It works by allowing users to signup to a host server, and then have that data be communicated with the host server of the users they interact with. Users are given a unique user tag that is used to identify them. The tag contains their username, as well as their host server. Each user's data is only stored on their host server, and can be deleted at any time.

## Authentication

Users are given an ID that contains their host server and their username. The ID is used to control their permissions and to easily identify them with other users.

### Sessions

Users are given a new session ID every time they log in. This ID is used to authenticate them with other users. The newest session ID will be preferred over older IDs, but older IDs are stored under the user in `user.activeSessions`. These IDs are stored to prevent users from losing access to their account after logging into a new device.

### Stored Information

- `user.username`: The username of the user.
- `user.host`: The host server of the user.
- `user.activeSessions`: The list of active sessions of the user.
- `user.currentCredential`: The current session ID of the user.
- `user.password`: The password of the user. Usually encrypted.
- `user.ouid`: The unique ID of the user containing their name and host server. Used to identify them with other users.
- `user.uuid`: Internal ID of the user. Used to identify them with more sensitive information.

## Object Storage

Data is uploaded as an object, which is given a random ID. The object is saved under `/bucket/{userid}/{objectid}`, and contain meta information about the uploader and the people specified to have permission to access the object. Permission is checked before sending the object data first if `forceValidation` is enabled.

### Encryption

Objects support basic encryption for their content, as well as for the people that the have permission to view the object.

Objects follow the `__data` model, which is a JSON object that contains the following fields:

```json
{
    "__data": [
        { type: "o.encrypted", value: "This text will be encrypted." }
    ],
    "$oxvs": [
        "All metadata will be put here.",
        "This is not sent when the object is requested."
    ]
}
```

When `/bucket/get` is called, the `__data` array is decrypted and the data is returned. If an object has the type of `o.rawdata`, nothing is done to it and it is returned as-is.

## Setup

- Create a `.env` file in the root directory of the project.
    - `HOST_SERVER`: The host server URL of the server.
    - `CONTROL_ALPHABET`: The alphabet order used to encrypt and decrypt data. Should be unique and kept internally. Must contain at least all lowercase letters, and all uppercase letters. Should also contain numbers 0-9, and symbols `!@#$%^&*()-_+=[]{[lsbracket]|\;:<>,./?`.
- Run server twice to generate the needed database files.
- (Additional setup steps will be added in the future.)

## Notes

- Not production ready
- [Documentation](https://docs.oxvs.net) is incomplete
- Planned updates are available on [Github](https://github.com/0aoq/oxvs-server/projects/1)