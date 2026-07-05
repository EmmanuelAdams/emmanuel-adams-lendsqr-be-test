import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export interface AuthTokenPayload {
  sub: string;
}

export class TokenService {
  sign(userId: string): string {
    const options = { expiresIn: env.jwt.expiresIn } as jwt.SignOptions;
    return jwt.sign({ sub: userId }, env.jwt.secret, options);
  }

  verify(token: string): AuthTokenPayload {
    return jwt.verify(token, env.jwt.secret) as AuthTokenPayload;
  }
}
