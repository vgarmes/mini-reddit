import { useRouter } from 'next/router';

export const useGetPostIdFromUrl = () => {
  const router = useRouter();
  const intId =
    typeof router.query.id === 'string' ? parseInt(router.query.id) : -1;
  return intId;
};
