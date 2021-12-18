import { IconButton, Link } from '@chakra-ui/react';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
import NextLink from 'next/link';
import { useDeletePostMutation, useMeQuery } from '../generated/graphql';

interface PostButtonsProps {
  id: number;
  creatorId: number;
}

const PostButtons: React.FC<PostButtonsProps> = ({ id, creatorId }) => {
  const [deletePost] = useDeletePostMutation();
  const { data: meData } = useMeQuery();

  if (meData?.me?.id !== creatorId) {
    return null;
  }

  return (
    <>
      <NextLink href={`/post/edit/${id}`} passHref>
        <IconButton
          as={Link}
          ml="auto"
          mr={4}
          aria-label="edit post"
          icon={<EditIcon />}
        />
      </NextLink>
      <IconButton
        ml="auto"
        aria-label="delete post"
        icon={<DeleteIcon />}
        onClick={() => {
          deletePost({
            variables: { id },
            update: (cache) => {
              cache.evict({ id: 'Post:' + id }); // deletes cache for the deleted post
            },
          });
        }}
      />
    </>
  );
};

export default PostButtons;
