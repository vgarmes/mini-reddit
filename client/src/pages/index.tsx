import { Navbar } from '../components/Navbar';
import { createUrqlClient } from '../utils/createUrqlClient';
import { withUrqlClient } from 'next-urql';

const Index = () => (
  <>
    <Navbar />
    <div>hello world!</div>
  </>
);

export default withUrqlClient(createUrqlClient)(Index);
