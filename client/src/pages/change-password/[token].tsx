import { useRouter } from 'next/router';
import { Form, Formik } from 'formik';
import React from 'react';
import { toErrorMap } from '../../utils/toErrorMap';
import login from '../login';
import { Button } from '@chakra-ui/button';
import { Box } from '@chakra-ui/layout';
import InputField from '../../components/InputField';
import Wrapper from '../../components/Wrapper';

const ChangePassword = () => {
  const router = useRouter();
  const { token } = router.query;
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ newPassword: '' }}
        onSubmit={async (values, { setErrors }) => {
          /* const response = await login(values);
          if (response.data?.login.errors) {
            setErrors(toErrorMap(response.data.login.errors));
          } else if (response.data?.login.user) {
            router.push('/');
          } */
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name="newPassword"
              placeholder="new password"
              label="New Password"
              type="password"
            />

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

export default ChangePassword;
