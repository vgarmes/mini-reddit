## Cookies

The app uses the package `express-session` for setting cookies with the user's session details. These session details are stored in Redis. The way it works is the following:

1. Redis stores pairs of key/value with the session details. For example: `sess:Xasgg4t4gadgdasg` -> `{ cookie : { expires : "2022-11-17T12:30:08.339Z", secure : true, sameSite : "lax", ... }, userId : 1 }`.

2. On every request to the server, if there is no cookie present, express-session will set a cookie on user's browser. This cookie is a signed version of the Redis key, for example: `sess:Xasgg4t4gadgdasg` -> `qfdag454tXFdaghged`.

3. If there is already a cookie when user makes a request, this cookie will be sent to the server.

4. `express-session` decrypts the cookie: `qfdag454tXFdaghged` -> `sess:Xasgg4t4gadgdasg` and makes a request to Redis to retrieve the details: `sess:Xasgg4t4gadgdasg` -> `{ cookie : { expires : "2022-11-17T12:30:08.339Z", secure : true, sameSite : "lax", ... }, userId : 1 }`.

## Posts resolver: cursor based pagination

Instead of using an `offset` argument for paginating the Posts result, we use cursor-based pagination. This is because `offset` can cause some issues when posts are updating frequently, getting pages out of order.
