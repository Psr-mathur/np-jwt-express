import jwt from 'jsonwebtoken';



/**
 * Generates a JSON Web Token (JWT) based on the given payload and options.
 * The resulting token is signed with the given secret.
 * @param payload - the payload to be signed into the token
 * @param options - the options for generating the token
 * @returns the generated token
 */
export function generateTokens(payload: object, options: jwt.SignOptions & { secret: string }) {
  const token = jwt.sign(payload, options.secret, options);
  return token;
}

export type TValidateToken<TJwtPayload> = {
  status: 'VALID',
  payload: TJwtPayload,
} | {
  status: 'EXPIRED',
  payload: null,
} | {
  status: 'INVALID',
  payload: null,
};

/**
 * Validates a given JSON Web Token (JWT) against the given secret.
 * Returns an object with a status property set to either 'VALID', 'EXPIRED', or 'INVALID'.
 * If the status is 'VALID', the returned object will also contain a payload property set to the decoded payload of the token.
 * If the status is 'EXPIRED', the returned object will have a payload property set to null.
 * If the status is 'INVALID', the returned object will have a payload property set to null.
 * @param - the token to be validated
 * @param - the secret to validate the token against
 * @returns an object with a status property and an optional payload property
 */
export function validateToken<TJwtPayload>(token: string, secret: string): TValidateToken<TJwtPayload> {
  try {
    const decodedPayload = jwt.verify(token, secret);
    return {
      status: 'VALID',
      payload: decodedPayload as TJwtPayload,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return {
        status: 'EXPIRED',
        payload: null,
      };
    }
    return {
      status: 'INVALID',
      payload: null,
    };
  }
}