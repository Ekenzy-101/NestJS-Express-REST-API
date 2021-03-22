import { CookieOptions } from 'express';

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  maxAge: 1000 * 60 * 60 * 24,
};
