import {
  Resolver,
  Mutation,
  InputType,
  Field,
  Arg,
  Ctx,
  ObjectType,
  Query,
} from 'type-graphql';
import { MyContext } from '../types';
import { User } from '../entities/User';
import argon2 from 'argon2';
import { COOKIE_OPTIONS, COOKIE_NAME } from '../constants';
import { IsEmail, Length, Matches, MinLength, validate } from 'class-validator';

@InputType()
class UsernamePasswordInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @Length(3, 20)
  @Matches(/^[a-zA-Z0-9_.]*$/, {
    message:
      'Usernames may only contain letters, numbers, underscores ("_") and periods (".")',
  })
  username: string;

  @Field()
  @MinLength(8)
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Mutation(() => Boolean)
  async forgotPassword(@Arg('email') email: string, @Ctx() { em }: MyContext) {
    //const user = await em.findOne(User,{email});
    return true;
  }

  @Query(() => User, { nullable: true })
  async me(@Ctx() { req, em }: MyContext) {
    if (!req.session.userId) {
      return null;
    }
    const user = await em.findOne(User, { id: req.session.userId });
    return user;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const validationErrors = await validate(options);

    if (validationErrors.length > 0) {
      return {
        errors: validationErrors.map((err) => ({
          field: err.property,
          message: err.constraints
            ? Object.values(err.constraints)[0]
            : 'not valid',
        })),
      };
    }

    const hashedPassword = await argon2.hash(options.password);

    const user = em.create(User, {
      username: options.username,
      email: options.email,
      password: hashedPassword,
    });

    try {
      await em.persistAndFlush(user);
    } catch (error) {
      if (error.code === '23505') {
        return {
          errors: [
            {
              field: 'usernameOrEmail',
              message: 'username already taken',
            },
          ],
        };
      }
    }
    // store user id session
    // this will set a cookie on the user (log in)
    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('usernameOrEmail') usernameOrEmail: string,
    @Arg('password') password: string,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(
      User,
      usernameOrEmail.includes('@')
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail }
    );
    if (!user) {
      return {
        errors: [
          {
            field: 'username',
            message: 'invalid credentials',
          },
          {
            field: 'password',
            message: 'invalid credentials',
          },
        ],
      };
    }

    const valid = await argon2.verify(user.password, password);
    if (!valid) {
      return {
        errors: [
          {
            field: 'username',
            message: 'invalid credentials',
          },
          {
            field: 'password',
            message: 'invalid credentials',
          },
        ],
      };
    }

    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        // first we destroy the cookie, even if we are not able to destroy the session
        res.clearCookie(COOKIE_NAME, {
          sameSite: COOKIE_OPTIONS.sameSite,
          secure: COOKIE_OPTIONS.secure,
        }); // cookie options have to be the same that were passed when creating the cookie
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }

        resolve(true);
      })
    );
  }
}
