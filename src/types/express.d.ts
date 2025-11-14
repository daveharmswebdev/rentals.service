import 'express-session';
import { UserProfile } from '../interfaces/user.interface';

declare module 'express-session' {
  interface SessionData {
    passport?: {
      user?: UserProfile;
    };
  }
}

declare global {
  namespace Express {
    interface User extends UserProfile {}
  }
}

export {};
