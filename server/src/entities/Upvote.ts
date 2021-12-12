import { Entity, Column, BaseEntity, ManyToOne, PrimaryColumn } from 'typeorm';
import { ObjectType } from 'type-graphql';
import { User } from './User';
import { Post } from './Post';

// this is a join table between user and post
// typeorm can create a many-to-many relationship without a join table but we are going to create it so we can add additional fields

@ObjectType() // graphql decorator
@Entity() // typeorm decorator
export class Upvote extends BaseEntity {
  @Column({ type: 'int' })
  value: number;

  @PrimaryColumn()
  userId: number;

  @ManyToOne(() => User, (user) => user.upvotes)
  user: User;

  @PrimaryColumn()
  postId: number;

  @ManyToOne(() => Post, (post) => post.upvotes, {
    onDelete: 'CASCADE',
  })
  post: Post;
}

// in order to hide fields from Graphql schema, remove the @Field decorator
