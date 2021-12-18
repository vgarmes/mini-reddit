import { useRouter } from 'next/router';
import { Form, Formik } from 'formik';
import { useState } from 'react';
import { toErrorMap } from '../../utils/toErrorMap';
import { Button } from '@chakra-ui/button';
import { Box } from '@chakra-ui/layout';
import InputField from '../../components/InputField';
import Wrapper from '../../components/Wrapper';
import {
  MeDocument,
  MeQuery,
  useChangePasswordMutation,
} from '../../generated/graphql';
import { withApollo } from '../../utils/withApollo';

const ChangePassword = () => {
  const [changePassword] = useChangePasswordMutation();
  const router = useRouter();
  const { token } = router.query;
  const [tokenError, setTokenError] = useState('');
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ password: '' }}
        onSubmit={async (values, { setErrors }) => {
          const response = await changePassword({
            variables: {
              newPassword: { password: values.password },
              token: typeof token === 'string' ? token : '',
            },
            update: (cache, { data }) => {
              cache.writeQuery<MeQuery>({
                query: MeDocument,
                data: {
                  __typename: 'Query',
                  me: data?.changePassword.user,
                },
              });
            },
          });

          if (response.data?.changePassword.errors) {
            const errorMap = toErrorMap(response.data.changePassword.errors);
            if ('token' in errorMap) {
              setTokenError(errorMap.token);
            }
            setErrors(errorMap);
          } else if (response.data?.changePassword.user) {
            router.push('/');
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name="password"
              placeholder="new password"
              label="New Password"
              type="password"
            />
            {tokenError && <Box color="red">{tokenError}</Box>}
            <Button
              mt={4}
              type="submit"
              isLoading={isSubmitting}
              colorScheme="teal"
            >
              change password
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default withApollo({ ssr: false })(ChangePassword);
