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

## Menu Stats

Returning current authenicated profile account stats/notifications

```javascript
megaport.menuStats().then(
  function (menustats) {
    console.log(menustats);
  }
);
```

## Dashboard Info

Returning current authenicated profile dashboard information

```javascript
megaport.dashboard().then(
  function (menustats) {
    console.log(menustats);
  }
);
```

## User Profile

Returning current authenicated profile information

```javascript
megaport.profile().then(
  function (profileObj) {
    output(profileObj);
  }
);
```
Updating current authenicated profile information

```javascript
megaport.profile().update({
  firstName: "Pat",
}).then(
  function (response) {
    output(response);
  }
);
```

## Company Profile

Returning current users company

```javascript
megaport.company().then(
  function (profileObj) {
    console.log(profileObj);
  }
);
```

Updating current users company

```javascript
megaport.company().update({
  www: 'http://www.megaport.com',
}).then(
  function (response) {
    console.log(response);
  }
);
```

## Tickets

Listing open tickets.

```javascript
megaport.tickets().then(
  function (list) {
    output(list);
  }
);
```

TicketStatus: OPEN, CLOSED, ANY

```javascript
megaport.tickets().filter('CLOSED').then(
  function (list) {
    output(list);
  }
);
```
Returning specific ticket.

```javascript
megaport.tickets(ticketId).then(
 function (t) {
   output(t);
 }
);
```
Commenting on a ticket

```javascript
megaport.tickets(ticketId).comment('Comment String').then(
 function (response) {
   output(response);
 }
);
```

Closing a ticket

```javascript
megaport.tickets(ticketId).close().then(
 function (response) {
   output(response);
 }
);
```

Creating a ticket

```javascript
megaport.tickets().create({
 subject: 'Ticket 101',
 description: 'Ticket Description',
 queue: '',
 serviceId: '',
 companyId: ''
}).close().then(
 function (response) {
   output(response);
 }
);
```


## Markets

List of markets the current auth users company is registered in.

```javascript
megaport.markets().then(
  function (m) {
    output(m);
  }
);
```

Market registration information by market id

```javascript
megaport.markets(121).then(
 function (m) {
   output(m); 
 }
);
```

Update market registration

```javascript
megaport.markets(121).update({
 "billingContactName": "112",
 "billingContactEmail": "112@asdasd.com",
 "billingContactPhone": "112",
 "address1": "112",
 "address2": "112",
 "postcode": "12",
 "country": "Australia",
 "city": "112",
 "state": "12",
 "web": "112"
}).then(
 function (m) {
   console.log(m);
 }
);
```

## Managing Services

Return all megaport and thier assossiated services.

```javascript
megaport.ports().then(function(megaports){
    output(megaports);
});
```

### Update Service Details by productId

megaport.product(productUid)

works for both megaport, vxc, ix

```javascript
megaport.product(productUid).then(
  function (product) {
    console.log(product);
  }
);
```

Update product (if changing rateLimit be sure to use .checkPrice() first)

```javascript
megaport.product(productUid).update({
name: 'name change'
}).then(
  function (response) {
    output(response);
  }
);
```

Checking price on rateLimit changes

```javascript
megaport.product(productUid).checkPrice(1000).then(
  function (response) {
    output(response);
  }
);
```

### Price Book

```javascript
megaport.priceBook()
  .megaport({
    locationId: 2, //int
    speed: 1000, //int
    term: 1 // months (not required)
  }).then(function(priceobj){
    output(priceobj);
  });
```

```javascript
megaport.priceBook()
  .vxc({
    aLocationId: 2,
    bLocationId: 3,
    speed: 1000
  }).then(function(priceobj){
    output(priceobj);
  });
```

```javascript
megaport.priceBook()
  .ix({
    portLocationId: 6,
    ixType: "Brisbane IX",
    speed: 1000
  }).then(function(priceobj){
    output(priceobj);
  });
```


