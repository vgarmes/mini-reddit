import { createUrqlClient } from '../utils/createUrqlClient';
import { withUrqlClient } from 'next-urql';
import { usePostsQuery } from '../generated/graphql';
import Layout from '../components/Layout';
import {
  Stack,
  Box,
  Heading,
  Text,
  Flex,
  Link,
  Button,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useState } from 'react';
import Votes from '../components/Votes';

const Index = () => {
  const [variables, setVariables] = useState({
    limit: 15,
    cursor: null as string | null,
  });
  const [{ data, fetching }] = usePostsQuery({
    variables,
  });

  if (!fetching && !data) {
    return <div>No posts could be loaded</div>;
  }

  return (
    <Layout>
      <Flex align="center" mb={4}>
        <Heading>MiniReddit</Heading>
        <NextLink href="/create-post">
          <Link ml="auto">create post</Link>
        </NextLink>
      </Flex>
      {!data && fetching ? (
        <div>loading...</div>
      ) : (
        <Stack spacing={8}>
          {data.posts.posts.map((p) => (
            <Flex key={p.id} p={5} shadow="md" borderWidth="1px" align="center">
              <Votes post={p} />
              <Box>
                <Heading fontSize="xl">{p.title}</Heading>
                <Text>posted by {p.creator.username}</Text>
                <Text mt={4}>{p.textSnippet}...</Text>
              </Box>
            </Flex>
          ))}
        </Stack>
      )}

      {data && data.posts.hasMore ? (
        <Flex>
          <Button
            onClick={() =>
              setVariables({
                limit: 10,
                cursor: data.posts.posts[data.posts.posts.length - 1].createdAt,
              })
            }
            m="auto"
            my={8}
          >
            load more
          </Button>
        </Flex>
      ) : null}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
