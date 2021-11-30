import 'reflect-metadata';
import 'dotenv/config';
import { COOKIE_NAME, COOKIE_OPTIONS, __prod__ } from './constants';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
import Redis from 'ioredis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import cors from 'cors';
import { createConnection } from 'typeorm';
import { User } from './entities/User';
import { Post } from './entities/Post';
import { Upvote } from './entities/Upvote';
import path from 'path';

const main = async () => {
  const conn = await createConnection({
    type: 'postgres',
    database: 'minireddit',
    username: 'postgres',
    password: 'postgres',
    logging: true,
    synchronize: true, // creates tables automatically without having to use migrations
    migrations: [path.join(__dirname, './migrations/*')],
    entities: [Post, User, Upvote],
  });

  await conn.runMigrations();

  const app = express();

  const RedisStore = connectRedis(session);
  const redis = new Redis();

  app.set('trust proxy', 1);
  const whitelist = ['http://localhost:3000'];
  app.use(
    cors({
      origin: function (origin, callback) {
        if (!__prod__) {
          return callback(null, true);
        }

        if (origin && whitelist.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error(`${origin} : Not allowed by CORS`));
        }
      },
      credentials: true,
    })
  );

  // redis session middleware has to run before apollo server, because we will use it in apollo
  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
        disableTouch: true,
      }),
      cookie: COOKIE_OPTIONS,
      saveUninitialized: false, // do not store empty sessions
      secret: 'keyboard cat',
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({ req, res, redis }), // context available to all resolvers
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app, cors: false });

  app.listen(5000, () => {
    console.log('server listening on port 5000...');
  });
};

main();
