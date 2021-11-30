import { ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { Flex, IconButton } from '@chakra-ui/react';
import { PostSnippetFragment } from '../generated/graphql';

interface Props {
  post: PostSnippetFragment;
}

const Votes = ({ post }) => {
  return (
    <Flex p={4} direction="column" align="center" justify="center">
      <IconButton
        aria-label="upvote post"
        variant="ghost"
        icon={<ChevronUpIcon boxSize={6} />}
      />
      {post.points}
      <IconButton
        aria-label="downvote post"
        variant="ghost"
        icon={<ChevronDownIcon boxSize={6} />}
      />
    </Flex>
  );
};

export default Votes;
