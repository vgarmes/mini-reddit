import Layout from '../components/Layout';
import InputField from '../components/InputField';
import { Box, Button } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import { useCreatePostMutation } from '../generated/graphql';
import { useRouter } from 'next/router';
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from '../utils/createUrqlClient';
import { useIsAuth } from '../hooks/useIsAuth';

const CreatePost = () => {
  const router = useRouter();
  const { data, fetching } = useIsAuth();
  const [, createPost] = useCreatePostMutation();

  if (fetching || !data?.me) {
    return null;
  }

  return (
    <Layout variant="small">
      <Formik
        initialValues={{ title: '', text: '' }}
        onSubmit={async (values) => {
          const { error } = await createPost({ input: values });
          if (!error) {
            router.push('/');
          } // if there is any error, the global handler errorExchange will handle it
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
              create post
            </Button>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient)(CreatePost);
