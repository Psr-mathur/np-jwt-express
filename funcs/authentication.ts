// declare global {
//   namespace Express {
//     interface Request {
//       tokenExpired?: boolean;
//       user?: TJwtPayload;
//     }
//   }
// }

import { Request, RequestHandler } from 'express';
import { validateToken } from './token';

export type TAuthenticateOptions = {
  mode: 'cookie',
  tokenCookieName: string,
  secret: string
} | {
  mode: 'header',
  headerName: string,
  secret: string
}

/**
 * Authenticates the given request using the provided options.
 * @param options - options for authenticating the request
 * @returns a middleware function that authenticates the request and sets the user property on the request object if the authentication is successful
 */
export function authenticate<TJwtPayload>(options: TAuthenticateOptions): RequestHandler {
  return function (req, res, next) {
    const authToken = options.mode === 'cookie' ? req.cookies?.[options.tokenCookieName] : req.headers?.[options.headerName?.toLowerCase()];

    if (!authToken || typeof authToken !== 'string') {
      res.status(401).json({ error: 'Auth token not found' });
      return;
    }

    const { status, payload } = validateToken<TJwtPayload>(authToken, options.secret);

    if (status === 'EXPIRED') {
      if (options.mode === 'cookie') {
        res.clearCookie(options.tokenCookieName);
      }
      res.status(401).json({ error: 'Auth token expired' });
      return;
    }

    if (status === 'INVALID') {
      if (options.mode === 'cookie') {
        res.clearCookie(options.tokenCookieName);
      }
      res.status(401).json({ error: 'Invalid auth token' });
      return;
    }

    // req.user = payload as TJwtPayload;
    (req as Request & { user?: TJwtPayload }).user = payload;
    next();
  }
}