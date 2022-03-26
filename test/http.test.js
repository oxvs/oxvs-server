const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))

// login user
fetch("http://localhost:3000/api/v1/auth/login", {
    method: 'POST',
    body: JSON.stringify({
        "ouid": "@user:test!o.host[server.oxvs.net]",
        "password": "testpassword"
    }),
    headers: {
        'Content-Type': 'application/json',
    }
}).then((response) => response.json()).then((token) => {
    token = token.token

    // new user
    fetch("http://localhost:3000/api/v1/auth/new", {
        method: 'POST',
        body: JSON.stringify({
            "username": "test1",
            "password": "testpassword1"
        }),
        headers: {
            'Content-Type': 'application/json',
        }
    }).then((response) => response.json()).then((newUserInfo) => {
        // upload data
        fetch("http://localhost:3000/api/v1/bucket/upload", {
            method: 'POST',
            body: JSON.stringify({
                data: {
                    __data: [
                        { type: "o.encrypted", value: "Hello, world!" }
                    ]
                },
                encrypted: true,
                shareList: [
                    { type: "o.encrypted", value: "@user:test1!o.host[server.oxvs.net]", }
                ]
            }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': '@user:test!o.host[server.oxvs.net](::AT::)' + token
            }
        }).then((response) => response.json()).then((uploadInformation) => {
            console.log(uploadInformation)
            if (uploadInformation) {
                // get file
                fetch(`http://localhost:3000/api/v1/bucket/get/${uploadInformation.id}`, {
                    method: 'GET',
                    /* body: JSON.stringify({
                        "test": "test"
                    }), */
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': '@user:test!o.host[server.oxvs.net](::AT::)' + token
                    }
                }).then((response) => response.json()).then((data) => {
                    console.log(data)
                })

                // delete
                fetch(`http://localhost:3000/api/v1/bucket/${uploadInformation.id}/delete`, {
                    method: 'DELETE',
                    body: JSON.stringify({
                        requestFrom: "@user:test!o.host[server.oxvs.net]",
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': '@user:test!o.host[server.oxvs.net](::AT::)' + token
                    }
                }).then((response) => response.json()).then((data) => {
                    console.log(data)
                })
            }
        })
    })
})