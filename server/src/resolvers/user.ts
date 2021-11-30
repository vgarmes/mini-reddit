import {
  Resolver,
  Mutation,
  Arg,
  Ctx,
  Query,
  FieldResolver,
  Root,
} from 'type-graphql';
import { MyContext } from '../types';
import {
  PasswordInput,
  UsernamePasswordInput,
  UserResponse,
} from './user-types';
import { User } from '../entities/User';
import argon2 from 'argon2';
import {
  COOKIE_OPTIONS,
  COOKIE_NAME,
  FORGET_PASSWORD_PREFIX,
} from '../constants';
import { validate } from 'class-validator';
import { sendEmail } from '../utils/sendEmail';
import { v4 } from 'uuid';
import { mapValidationErrors } from '../utils/mapValidationErrors';

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    if (req.session.userId === user.id) {
      // this is the current user and it's ok to show them their own email
      return user.email;
    }
    // current user wants to see someone else's email
    return '';
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg('token') token: string,
    @Arg('newPassword') newPassword: PasswordInput,
    @Ctx() { redis, req }: MyContext
  ): Promise<UserResponse> {
    const validationErrors = await validate(newPassword);

    if (validationErrors.length > 0) {
      return {
        errors: mapValidationErrors(validationErrors),
      };
    }
    const key = FORGET_PASSWORD_PREFIX + token;
    const userId = await redis.get(key);
    if (!userId) {
      return {
        errors: [
          {
            field: 'token',
            message: 'token expired',
          },
        ],
      };
    }

    const userIdNum = parseInt(userId);
    const user = await User.findOne(userIdNum);

    if (!user) {
      return {
        errors: [
          {
            field: 'token',
            message: 'user no longer exists',
          },
        ],
      };
    }

    await User.update(
      { id: userIdNum },
      { password: await argon2.hash(newPassword.password) }
    );

    await redis.del(key);

    // log in user after changing password
    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg('email') email: string,
    @Ctx() { redis }: MyContext
  ) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return true; // for security reasons we don't return to the client info on whether the user exists or not
    }

    const token = v4();

    await redis.set(
      FORGET_PASSWORD_PREFIX + token,
      user.id,
      'ex',
      1000 * 60 * 60 * 24 // 1 day of expiration
    );

    const htmlContent = `<a href="http://localhost:3000/change-password/${token}">reset password</a>`;
    await sendEmail(email, htmlContent);
    return true;
  }

  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: MyContext) {
    if (!req.session.userId) {
      return null;
    }
    return User.findOne(req.session.userId);
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const validationErrors = await validate(options);

    if (validationErrors.length > 0) {
      return {
        errors: mapValidationErrors(validationErrors),
      };
    }

    const hashedPassword = await argon2.hash(options.password);

    const user = User.create({
      username: options.username,
      email: options.email,
      password: hashedPassword,
    });

    try {
      await user.save();
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
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const user = await User.findOne(
      usernameOrEmail.includes('@')
        ? { where: { email: usernameOrEmail } }
        : { where: { username: usernameOrEmail } }
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
