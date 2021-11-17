# mini-reddit

A basic reddit clone, inspired by [Ben Awad's lireddit](https://github.com/benawad/lireddit).

## Requirements:

Create a PostgreSQL database

## Tech stack:

- Typescript

> Backend:

- PostgreSQL: database
- MikroORM: Typescript ORM for connecting to PostgreSQL databases.
- GraphQL.js: Javascript implementation for GraphQL, for building type schemas and serving queries against them (Note: stick to the 15.x version of GraphQL, since v16 contains [breaking changes for TypeGraphQL](https://github.com/MichalLytek/type-graphql/issues/1100)).
- TypeGraphQL: Typescript classes and decorators for defining GraphQL schemas and resolvers.
- Apollo: GraphQL server
