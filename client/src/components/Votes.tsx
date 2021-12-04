import { ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { Flex, IconButton } from '@chakra-ui/react';
import { useState } from 'react';
import { PostSnippetFragment, useVoteMutation } from '../generated/graphql';

interface Props {
  post: PostSnippetFragment;
}

const Votes = ({ post }: Props) => {
  const [loadingState, setLoadingState] = useState<
    'upvote-loading' | 'not-loading' | 'downvote-loading'
  >('not-loading');

  const [, vote] = useVoteMutation();

  return (
    <Flex p={4} direction="column" align="center" justify="center">
      <IconButton
        aria-label="upvote post"
        variant="ghost"
        icon={<ChevronUpIcon boxSize={6} />}
        isLoading={loadingState === 'upvote-loading'}
        onClick={async () => {
          setLoadingState('upvote-loading');
          await vote({
            postId: post.id,
            value: 1,
          });
          setLoadingState('not-loading');
        }}
      />
      {post.points}
      <IconButton
        aria-label="downvote post"
        variant="ghost"
        icon={<ChevronDownIcon boxSize={6} />}
        isLoading={loadingState === 'downvote-loading'}
        onClick={async () => {
          setLoadingState('downvote-loading');
          await vote({
            postId: post.id,
            value: -1,
          });
          setLoadingState('not-loading');
        }}
      />
    </Flex>
  );
};

export default Votes;
