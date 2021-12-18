import { ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { Flex, IconButton } from '@chakra-ui/react';
import { useState } from 'react';
import {
  Post,
  PostSnippetFragment,
  useVoteMutation,
  VoteMutation,
} from '../generated/graphql';
import { gql } from 'graphql-tag';
import { ApolloCache } from '@apollo/client';

interface Props {
  post: PostSnippetFragment;
}

const updateAfterVote = (
  value: number,
  postId: number,
  cache: ApolloCache<VoteMutation>
) => {
  const data = cache.readFragment<{
    id: number;
    points: number;
    voteStatus: number | null; // or just <PostSnippetFragment> even though we are not using all the types
  }>({
    id: 'Post:' + postId,
    fragment: gql`
      fragment _ on Post {
        id
        points
        voteStatus
      }
    `,
  });

  if (data) {
    if (data.voteStatus === value) {
      return;
    }
    const newPoints = data.points + (data.voteStatus ? 2 : 1) * value;

    cache.writeFragment({
      id: 'Post:' + postId,
      fragment: gql`
        fragment _ on Post {
          points
          voteStatus
        }
      `,
      data: {
        points: newPoints,
        voteStatus: value,
      },
    });
  }
};

const Votes = ({ post }: Props) => {
  const [loadingState, setLoadingState] = useState<
    'upvote-loading' | 'not-loading' | 'downvote-loading'
  >('not-loading');

  const [vote] = useVoteMutation();

  return (
    <Flex p={4} direction="column" align="center" justify="center">
      <IconButton
        aria-label="upvote post"
        variant="ghost"
        icon={<ChevronUpIcon boxSize={6} />}
        colorScheme={post.voteStatus === 1 ? 'green' : undefined}
        isLoading={loadingState === 'upvote-loading'}
        onClick={async () => {
          if (post.voteStatus === 1) {
            return;
          }
          setLoadingState('upvote-loading');
          await vote({
            variables: { postId: post.id, value: 1 },
            update: (cache) => updateAfterVote(1, post.id, cache),
          });
          setLoadingState('not-loading');
        }}
      />
      {post.points}
      <IconButton
        aria-label="downvote post"
        variant="ghost"
        icon={<ChevronDownIcon boxSize={6} />}
        colorScheme={post.voteStatus === -1 ? 'red' : undefined}
        isLoading={loadingState === 'downvote-loading'}
        onClick={async () => {
          if (post.voteStatus === -1) {
            return;
          }
          setLoadingState('downvote-loading');
          await vote({
            variables: {
              postId: post.id,
              value: -1,
            },
            update: (cache) => updateAfterVote(-1, post.id, cache),
          });
          setLoadingState('not-loading');
        }}
      />
    </Flex>
  );
};

export default Votes;
