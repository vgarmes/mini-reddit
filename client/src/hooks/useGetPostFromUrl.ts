import { usePostQuery } from '../generated/graphql';
import { useGetPostIdFromUrl } from './useGetPostIdFromUrl';

export const useGetPostFromUrl = () => {
  const intId = useGetPostIdFromUrl();
  return usePostQuery({
    pause: intId === -1, // bad id param
    variables: {
      id: intId,
    },
  });
};
