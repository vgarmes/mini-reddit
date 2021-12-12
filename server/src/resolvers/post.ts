import { Post } from '../entities/Post';
import {
  Arg,
  Query,
  Resolver,
  Mutation,
  InputType,
  Field,
  Ctx,
  UseMiddleware,
  Int,
  FieldResolver,
  Root,
  ObjectType,
} from 'type-graphql';
import { MyContext } from '../types';
import { isAuth } from '../middleware/isAuth';
import { getConnection } from 'typeorm';
import { Upvote } from '../entities/Upvote';
import { User } from '../entities/User';

// @Query is for getting data
// @Mutation is for updating, creating, deleting
// @Arg: when we set it to nullable, we have to explicitly set type (f.ex. () => String)
@InputType()
class PostInput {
  @Field()
  title: string;

  @Field()
  text: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];

  @Field()
  hasMore: boolean;
}

@Resolver(Post) // we need to add Post in arguments because we are using a FieldResolver below
export class PostResolver {
  @FieldResolver(() => String) // this is a field that is not in the db but we create and send to client
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50);
  }

  @FieldResolver(() => User)
  creator(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
    return userLoader.load(post.creatorId);
  }

  @FieldResolver(() => Int, { nullable: true })
  async voteStatus(
    @Root() post: Post,
    @Ctx() { upvoteLoader, req }: MyContext
  ) {
    if (!req.session.userId) {
      return null;
    }

    const upvote = await upvoteLoader.load({
      postId: post.id,
      userId: req.session.userId,
    });

    return upvote ? upvote.value : null;
  }

  /* 
  // This is fine, but it will make an additional query for each post (not efficient when querying many posts)
  @FieldResolver(() => User)
  creator(@Root() post: Post) {
    return User.findOne(post.creatorId);
  } */

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg('postId', () => Int) postId: number,
    @Arg('value', () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    const isUpvote = value !== -1;
    const realValue = isUpvote ? 1 : -1;
    const { userId } = req.session;

    const upvote = await Upvote.findOne({ where: { postId, userId } });

    if (upvote && upvote.value !== realValue) {
      // the user has previously voted this post but user is changing the vote (up to down and viceversa)
      await getConnection().transaction(async (transactionalEntityManager) => {
        // if one of the database queries fails, the whole transaction rolls back
        await transactionalEntityManager
          .createQueryBuilder()
          .update(Upvote)
          .set({ value: realValue })
          .where('postId = :postId and userId = :userId', { postId, userId })
          .execute();

        await transactionalEntityManager
          .createQueryBuilder()
          .update(Post)
          .set({ points: () => `points + ${2 * realValue}` })
          .where('id = :id', { id: postId })
          .execute();
      });
    } else if (!upvote) {
      // user has never voted this post before
      await getConnection().transaction(async (transactionalEntityManager) => {
        await transactionalEntityManager
          .createQueryBuilder()
          .insert()
          .into(Upvote)
          .values({ userId, postId, value: realValue })
          .execute();

        await transactionalEntityManager
          .createQueryBuilder()
          .update(Post)
          .set({ points: () => `points + ${realValue}` })
          .where('id = :id', { id: postId })
          .execute();
      });
    }

    /* await Upvote.insert({
      userId,
      postId,
      value: realValue,
    }); */

    return true;
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg('limit', () => Int) limit: number,
    @Arg('cursor', () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit) + 1; // we cap the limit to 50 (+1 so we know if there are more posts)

    const query = getConnection()
      .getRepository(Post)
      .createQueryBuilder('p')
      .orderBy('p.createdAt', 'DESC')
      .take(realLimit);

    /* 
    // this makes the correct SQL query but somehow typeOrm is not able to map 'voteStatus' into the posts object
    const query = getConnection()
      .getRepository(Post)
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.creator', 'u', 'u.id = p.creatorId')
      .addSelect((subQuery) => {
        return subQuery
          .select('upvote.value', 'voteStatus')
          .from(Upvote, 'upvote')
          .where('upvote.userId = :userId and upvote.postId = p.id', {
            userId: req.session.userId,
          });
      }, 'voteStatus')
      .orderBy('p.createdAt', 'DESC')
      .take(realLimit); */

    if (cursor) {
      query.where('p.createdAt < :cursor', {
        cursor: new Date(parseInt(cursor)),
      });
    }

    const posts = await query.getMany();
    const hasMore = posts.length === realLimit;

    return { posts: posts.slice(0, realLimit - 1), hasMore };
  }

  @Query(() => Post, { nullable: true })
  post(@Arg('id', () => Int) id: number): Promise<Post | undefined> {
    return Post.findOne(id);
    // return Post.findOne(id, { relations: ['creator'] }); // we would use this if we didn't have creator as a FieldResolver
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg('input') input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    return Post.create({ ...input, creatorId: req.session.userId }).save();
  }

  @Mutation(() => Post, { nullable: true })
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg('id', () => Int) id: number,
    @Arg('title') title: string,
    @Arg('text') text: string,
    @Ctx() { req }: MyContext
  ): Promise<Post | null> {
    // we use the query builder so we can get the updated post back
    const result = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where('id = :id and creatorId = :creatorId', {
        id,
        creatorId: req.session.userId,
      })
      .returning('*')
      .execute();

    return result.raw[0];
    // return Post.update({ id, creatorId: req.session.userId }, { title, text });
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg('id', () => Int) id: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    /* // not cascade way:
    const post = await Post.findOne(id);
    if (!post) {
      return false;
    }
    if (post.creatorId !== req.session.userId) {
      throw new Error('not authorized');
    }

    // delete upvotes first
    await Upvote.delete({ postId: id });
    await Post.delete({ id }); */

    await Post.delete({ id, creatorId: req.session.userId }); // only creator will be able to delete post
    // Upvote entity is set to be cascade deleted if post is deleted
    return true;
  }
}
