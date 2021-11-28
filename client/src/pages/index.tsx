import { createUrqlClient } from '../utils/createUrqlClient';
import { withUrqlClient } from 'next-urql';
import { usePostsQuery } from '../generated/graphql';
import Layout from '../components/Layout';

const Index = () => {
  const [{ data }] = usePostsQuery({
    variables: {
      limit: 10,
    },
  });

  return (
    <Layout>
      <div>hello world!</div>
      <br />
      {!data ? (
        <div>loading...</div>
      ) : (
        data.posts.map((p) => <div key={p.id}>{p.title}</div>)
      )}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
