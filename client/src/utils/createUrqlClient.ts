import { dedupExchange, fetchExchange, Exchange } from '@urql/core';
import { cacheExchange } from '@urql/exchange-graphcache';
import {
  LogoutMutation,
  MeQuery,
  MeDocument,
  LoginMutation,
  RegisterMutation,
  VoteMutationVariables,
} from '../generated/graphql';
import { betterUpdateQuery } from './betterUpdateQuery';
import { pipe, tap } from 'wonka';
import Router from 'next/router';
import { cursorPagination } from './cursorPagination';
import { gql } from '@urql/core';
import { isSSR } from './isSSR';

// errorExchange will catch all errors when using graphql queries/mutations
const errorExchange: Exchange =
  ({ forward }) =>
  (ops$) => {
    return pipe(
      forward(ops$),
      tap(({ error }) => {
        if (error?.message.includes('not authenticated')) {
          Router.replace('/login');
        }
      })
    );
  };

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
    exchanges: [
      dedupExchange,
      cacheExchange({
        keys: {
          PaginatedPosts: () => null, // no key
        },
        resolvers: {
          Query: {
            posts: cursorPagination(),
          },
        },
        updates: {
          Mutation: {
            vote: (_result, args, cache, info) => {
              const { postId, value } = args as VoteMutationVariables;
              const data = cache.readFragment(
                gql`
                  fragment _ on Post {
                    id
                    points
                    voteStatus
                  }
                `,
                { id: postId }
              );

              if (data) {
                if (data.voteStatus === value) {
                  return;
                }
                const newPoints =
                  data.points + (data.voteStatus ? 2 : 1) * value;

                cache.writeFragment(
                  gql`
                    fragment _ on Post {
                      points
                      voteStatus
                    }
                  `,
                  {
                    id: postId,
                    points: newPoints,
                    voteStatus: value,
                  }
                );
              }
            },
            createPost: (_result, args, cache, info) => {
              // invalidates cache for posts so they are fetched again after user posts
              const allFields = cache.inspectFields('Query');
              const fieldInfos = allFields.filter(
                (info) => info.fieldName === 'posts'
              );
              fieldInfos.forEach((fi) => {
                cache.invalidate('Query', 'posts', fi.arguments);
              });
            },
            logout: (_result, args, cache, info) => {
              betterUpdateQuery<LogoutMutation, MeQuery>(
                cache,
                { query: MeDocument },
                _result,
                () => ({ me: null })
              );
            },
            login: (_result, args, cache, info) => {
              betterUpdateQuery<LoginMutation, MeQuery>(
                cache,
                { query: MeDocument },
                _result,
                (result, query) => {
                  if (result.login.errors) {
                    return query;
                  } else {
                    return {
                      me: result.login.user,
                    };
                  }
                }
              );
            },
            register: (_result, args, cache, info) => {
              betterUpdateQuery<RegisterMutation, MeQuery>(
                cache,
                { query: MeDocument },
                _result,
                (result, query) => {
                  if (result.register.errors) {
                    return query;
                  } else {
                    return {
                      me: result.register.user,
                    };
                  }
                }
              );
            },
          },
        },
      }),
      errorExchange,
      ssrExchange,
      fetchExchange,
    ],
  };
};

// we force urql to re-cache after login and register, otherwise the query "me" returns null
