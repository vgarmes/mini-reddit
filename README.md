# mini-reddit

A basic reddit clone, inspired by [Ben Awad's lireddit](https://github.com/benawad/lireddit).

## Develop

> You'll need [Node](https://nodejs.org/en/) and
> [Yarn](https://classic.yarnpkg.com/en/) installed
> You will need PostgreSQL installed and running with a database called 'minireddit' (otherwise edit the name correspondingly in `server/src/mikro-orm.config.ts`)
> You will need Redis installed

- run `yarn` to install dependencies
- from root folder run `cd server` and `yarn watch` to start the Typescript complier on watch mode (will compile everytime it detects a change).
- from root folder run `cd server`and `yarn dev` to start development server.
- from root folder run `cd client` and `yarn start` to start frontend.
- from any folder in local machine run `redis-server` to start Redis server.

## Backend technologies:

> Node.js / Express, in Typescript.

- [PostgreSQL](https://www.postgresql.org/): database
- [TypeORM](https://typeorm.io/#): Typescript ORM for connecting to PostgreSQL databases.
- [GraphQL.js](https://graphql.org/graphql-js/): Javascript implementation for GraphQL, for building type schemas and serving queries against them (Note: stick to the 15.x version of GraphQL, since v16 contains [breaking changes for TypeGraphQL](https://github.com/MichalLytek/type-graphql/issues/1100)).
- [TypeGraphQL](https://typegraphql.com/docs): Typescript classes and decorators for defining GraphQL schemas and resolvers.
- [Apollo Server](https://www.apollographql.com/docs): GraphQL server
- [class-validator](https://github.com/typestack/class-validator): Validation decorators
