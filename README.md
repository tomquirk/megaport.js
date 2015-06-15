# Megaport JS Wrapper functions

## Initilising the wrapper

Staging Url 'https://api-staging.i.megaport.com'

```javascript
megaport = new mp('https://api-staging.i.megaport.com/v2/');
```

### Authenticating a User
```javascript
megaport.auth({
  username: 'wsmithers',
  password: 'password'
});

```
If you have a valid token you can pass that instead, { token: 'tokenstring' }

### Once Authenticated

######megaport.ready(callback)

Callback is run once a megaport wrapper has been authenticated.

```javascript
megaport.ready(
  function(credentials) {
    console.log(credentials);
  }
);
```

### On Authentication Failure

###### megaport.failauth(callback)

Callback is run once a megaport wrapper has failed an auth.

```javascript
megaport.failauth(function () {
  console.log('Authentication Failed');
});
```

## User Profile

Returning current authenicated profile information

```javascript
megaport.profile().then(
  function (profileObj) {
    console.log(profileObj);
  }
);
```
updating current authenicated profile information

```javascript
megaport.profile({
  firstName: "Pat",
}).then(
  function (response) {
    console.log(response);
  }
);
```


## Managing Services (products)

Return all services grouped by service groups you belong to.

```javascript
megaport.servicegroups().then(
  function (servicegroups) {
    console.log(servicegroups);
  }
);
```

Example Return

```json
[
  {
    serviceGroupId: 122,
    megaports: [
      {
        productId: int,
        associatedIxs: [...],
        associatedVxcs: [...],
        productName: "",
        productType: "",
        etc ...
      }
    ]
  }
]
```

### Get Service Details by productId

megaport.product(int)

works for both megaport and vxc and soon IX

```javascript
megaport.product(1).then(
  function (product) {
    console.log(product);
  }
);
```

### Update Service Details by productId

megaport.product(int).update(obj);

The object will have different params for product types (megaport/vxc/ix)

```json
megaport : {
  "name": String,
  "favourite": true/false
}
```

```json
vxc : {
  "name": String,
  "rateLimit": int,
  "aVlan": int,
  "bVlan": int
}
```

```javascript
megaport.product(728).update({
  name: "SG test port" //SG test port
}).then(
  function (product) {
    console.log(product);
  }
);
```
