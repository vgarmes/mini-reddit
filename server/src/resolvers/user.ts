import { Resolver, Mutation, Arg, Ctx, Query } from 'type-graphql';
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

@Resolver()
export class UserResolver {
  @Mutation(() => UserResponse)
  async changePassword(
    @Arg('token') token: string,
    @Arg('newPassword') newPassword: PasswordInput,
    @Ctx() { redis, em, req }: MyContext
  ): Promise<UserResponse> {
    const validationErrors = await validate(newPassword);

    if (validationErrors.length > 0) {
      return {
        errors: mapValidationErrors(validationErrors),
      };
    }

    const userId = await redis.get(FORGET_PASSWORD_PREFIX + token);
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

    const user = await em.findOne(User, { id: parseInt(userId) });

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

    user.password = await argon2.hash(newPassword.password);
    em.persistAndFlush(user);

    // log in user after changing password
    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg('email') email: string,
    @Ctx() { em, redis }: MyContext
  ) {
    const user = await em.findOne(User, { email });
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

    `<a href="http://localhost:3000/change-password/${token}">reset password</a>`;
    await sendEmail(email, '');
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
