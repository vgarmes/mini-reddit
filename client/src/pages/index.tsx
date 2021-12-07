import { createUrqlClient } from '../utils/createUrqlClient';
import { withUrqlClient } from 'next-urql';
import { useDeletePostMutation, usePostsQuery } from '../generated/graphql';
import Layout from '../components/Layout';
import {
  Stack,
  Box,
  Heading,
  Text,
  Flex,
  Link,
  Button,
  IconButton,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useState } from 'react';
import Votes from '../components/Votes';
import { DeleteIcon } from '@chakra-ui/icons';

const Index = () => {
  const [variables, setVariables] = useState({
    limit: 15,
    cursor: null as string | null,
  });
  const [{ data, fetching }] = usePostsQuery({
    variables,
  });

  const [, deletePost] = useDeletePostMutation();

  if (!fetching && !data) {
    return <div>No posts could be loaded</div>;
  }

  return (
    <Layout>
      {!data && fetching ? (
        <div>loading...</div>
      ) : (
        <Stack spacing={8}>
          {data.posts.posts.map((p) => (
            <Flex key={p.id} p={5} shadow="md" borderWidth="1px" align="center">
              <Votes post={p} />
              <Box flex={1}>
                <NextLink href="/post/[id]" as={`/post/${p.id}`}>
                  <Link>
                    <Heading fontSize="xl">{p.title}</Heading>
                  </Link>
                </NextLink>
                <Text flex={1} mt={4}>
                  posted by {p.creator.username}
                </Text>
                <Flex>
                  <Text flex={1} mt={4}>
                    {p.textSnippet}...
                  </Text>
                  <IconButton
                    ml="auto"
                    aria-label="delete post"
                    icon={<DeleteIcon />}
                    onClick={() => {
                      deletePost({ id: p.id });
                    }}
                  />
                </Flex>
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
