import { Box, Link, Flex, Button, Heading } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useLogoutMutation, useMeQuery } from '../generated/graphql';
import { useEffect, useState } from 'react';

interface NavbarProps {}

const Navbar: React.FC<NavbarProps> = ({}) => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const [{ fetching: logoutFetching }, logout] = useLogoutMutation();
  const [{ data, fetching }] = useMeQuery({
    pause: !isMounted,
  }); // we actually don't need to pause it until is rendered in the browser because Urql client is set up to pass the cookies in SSR as well
  let body = null;

  if (fetching) {
  } else if (!data?.me) {
    body = (
      <>
        <NextLink href="/login">
          <Link color="white" mr={2}>
            login
          </Link>
        </NextLink>
        <NextLink href="/register">
          <Link color="white">register</Link>
        </NextLink>
      </>
    );
  } else {
    body = (
      <Flex align="center">
        <NextLink href="/create-post" passHref>
          <Button colorScheme="teal">create post</Button>
        </NextLink>
        <Box mx={4}>{data.me.username}</Box>
        <Button
          variant="link"
          onClick={() => logout()}
          isLoading={logoutFetching}
        >
          logout
        </Button>
      </Flex>
    );
  }

  return (
    <Flex zIndex={1} position="sticky" top={0} bg="tomato" p={4} align="center">
      <NextLink href="/">
        <Link>
          <Heading>miniReddit</Heading>
        </Link>
      </NextLink>
      <Box ml={'auto'}>{body}</Box>
    </Flex>
  );
};

export default Navbar;
