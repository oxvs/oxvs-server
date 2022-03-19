# oxvs-server

OXVS is an open-source platform for authentication and data storage. It works by allowing users to signup to a host server, and then have that data be communicated with the host server of the users they interact with. Users are given a unique user tag that is used to identify them. The tag contains their username, as well as their host server. Each user's data is only stored on their host server, and can be deleted at any time.

## Authentication

Users are given an ID that contains their host server and their username. The ID is used to control their permissions and to easily identify them with other users.

## Object Storage

Data is uploaded as an object, which is given a random ID. The object is saved under `/bucket/{userid}/{objectid}`, and contain meta information about the uploader and the people specified to have permission to access the object. Permission is checked before sending the object data first if `forceValidation` is enabled.

## Notes

- Not production ready
- [Documentation](https://docs.oxvs.net) is incomplete