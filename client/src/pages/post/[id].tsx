import Layout from '../../components/Layout';
import { Heading } from '@chakra-ui/react';
import { useGetPostFromUrl } from '../../hooks/useGetPostFromUrl';
import PostButtons from '../../components/PostButtons';
import { Box } from '@chakra-ui/react';
import { withApollo } from '../../utils/withApollo';

const Post = ({}) => {
  const { data, loading } = useGetPostFromUrl();

  if (loading) {
    return (
      <Layout>
        <div>loading...</div>
      </Layout>
    );
  }

  if (!data?.post) {
    return (
      <Layout>
        <div>could not find post</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Heading mb={4}>{data.post.title}</Heading>
      <Box mb={4}>{data.post.text}</Box>
      <PostButtons id={data.post.id} creatorId={data.post.creator.id} />
    </Layout>
  );
};

export default withApollo({ ssr: true })(Post);
