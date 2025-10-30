// declare global {
//   namespace Express {
//     interface Request {
//       tokenExpired?: boolean;
//       user?: TJwtPayload;
//     }
//   }
// }

import { NextFunction, Request, Response } from 'express-serve-static-core';
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
export function authenticate<TJwtPayload>(options: TAuthenticateOptions) {
  return function (req: Request, res: Response, next: NextFunction) {
    const authToken = options.mode === 'cookie' ? req.cookies[options.tokenCookieName] : req.headers[options.headerName];

    if (!authToken || typeof authToken !== 'string') {
      return res.status(401).json({ error: 'Auth token not found' });
    }

    const { status, payload } = validateToken<TJwtPayload>(authToken, options.secret);

    if (status === 'EXPIRED') {
      if (options.mode === 'cookie') {
        res.clearCookie(options.tokenCookieName);
      }
      return res.status(401).json({ error: 'Auth token expired' });
    }

    if (status === 'INVALID') {
      if (options.mode === 'cookie') {
        res.clearCookie(options.tokenCookieName);
      }
      return res.status(401).json({ error: 'Invalid auth token' });
    }

    // req.user = payload as TJwtPayload;
    (req as Request & { user?: TJwtPayload }).user = payload;
    next();
  }
}