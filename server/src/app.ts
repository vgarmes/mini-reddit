import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/core';
import { __prod__ } from './constants';
import microConfig from './mikro-orm.config';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
import redis from 'redis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import cors from 'cors';

const main = async () => {
  const orm = await MikroORM.init(microConfig);
  await orm.getMigrator().up();

  const app = express();

  const RedisStore = connectRedis(session);
  const redisClient = redis.createClient();

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
      name: 'qid',
      store: new RedisStore({
        client: redisClient,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365,
        httpOnly: true, // so user cant access cookie from the frontend
        sameSite: 'lax', // csrf, set to none in dev env so cookie can be sent to Apollo Studio
        secure: __prod__, // cookie only works in https
      },
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
    context: ({ req, res }) => ({ em: orm.em, req, res }), // context available to all resolvers
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app, cors: false });

  app.listen(5000, () => {
    console.log('server listening on port 5000...');
  });
};

main();
