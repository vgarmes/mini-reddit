import { ApolloClient, InMemoryCache } from '@apollo/client';
import { PaginatedPosts } from './generated/graphql';

const client = new ApolloClient({
  uri: process.env.NEXT_PUBLIC_API_URL as string,
  credentials: 'include',
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          posts: {
            keyArgs: [], // otherwise it will use limit and cursor as keys and create new a new cached query everytime they change
            merge(
              existing: PaginatedPosts | undefined,
              incoming: PaginatedPosts
            ): PaginatedPosts {
              return {
                ...incoming,
                posts: [...(existing?.posts || []), ...incoming.posts],
              };
            },
          },
        },
      },
    },
  }),
});

export default client;
