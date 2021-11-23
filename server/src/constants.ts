import { CookieOptions } from 'express-session';
export const __prod__ = process.env.NODE_ENV === 'production';
export const COOKIE_NAME = 'qid';
export const COOKIE_OPTIONS = {
  maxAge: 1000 * 60 * 60 * 24 * 365,
  httpOnly: true, // so user cant access cookie from the frontend
  sameSite: 'lax', // 'lax' csrf, set to none in dev env so cookie can be sent to Apollo Studio
  secure: __prod__, // __prod__ cookie only works in https
} as CookieOptions;
