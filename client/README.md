## Cookies configuration in Urql client:

By default, cookies are not passed to GraphQL queries when running in SSR because NextJS is in between the browser and Urql:

SSR:

- BROWSER -> NEXTJS -> GRAPHQL

CLIENT:

- BROWSER -> GRAPHQL

We have to set up the Urql client so that it takes the context from Next JS, so it can use the cookes:

```
export const createUrqlClient = (ssrExchange: any, ctx: any) => {
  let cookie = '';
  if (isSSR()) {
    // this way we can pass cookies to our graphql even when in SSR
    cookie = ctx.req.headers.cookie;
  }

  return {
    url: 'http://localhost:5000/graphql',
    fetchOptions: {
      credentials: 'include' as const,
      headers: cookie
        ? {
            cookie,
          }
        : undefined,
    },
  }
}
```
