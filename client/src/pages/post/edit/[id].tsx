import Layout from '../../../components/Layout';
import { Formik, Form } from 'formik';
import { Box, Button } from '@chakra-ui/react';
import InputField from '../../../components/InputField';
import {
  usePostQuery,
  useUpdatePostMutation,
} from '../../../generated/graphql';
import { useGetPostIdFromUrl } from '../../../hooks/useGetPostIdFromUrl';
import { useRouter } from 'next/router';

const EditPost = () => {
  const router = useRouter();
  const intId = useGetPostIdFromUrl();
  const { data, loading } = usePostQuery({
    skip: intId === -1,
    variables: {
      id: intId,
    },
  });

  const [updatePost] = useUpdatePostMutation();

  if (loading) {
    return (
      <Layout>
        <Box>loading...</Box>
      </Layout>
    );
  }

  if (!data?.post) {
    return (
      <Layout>
        <Box>could not find post</Box>
      </Layout>
    );
  }

  return (
    <Layout variant="small">
      <Formik
        initialValues={{ title: data.post.title, text: data.post.text }}
        onSubmit={async (values) => {
          await updatePost({ variables: { id: intId, ...values } });
          router.back();
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField name="title" placeholder="title" label="Title" />
            <Box mt={4}>
              <InputField
                textarea
                name="text"
                placeholder="text..."
                label="Body"
              />
            </Box>

            <Button
              mt={4}
              type="submit"
              isLoading={isSubmitting}
              colorScheme="teal"
            >
              update post
            </Button>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

export default EditPost;
