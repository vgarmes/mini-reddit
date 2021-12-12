import DataLoader from 'dataloader';
import { User } from '../entities/User';

// DataLoader caches and batches queries, it will also remove duplicate queries (for example if we are requesting same id more than once)
// input: user IDs
export const createUserLoader = () =>
  new DataLoader<number, User>(async (userIds) => {
    const users = await User.findByIds(userIds as number[]);
    const userIdToUser: Record<number, User> = {};
    users.forEach((u) => {
      userIdToUser[u.id] = u;
    });

    return userIds.map((userId) => userIdToUser[userId]);
  });
