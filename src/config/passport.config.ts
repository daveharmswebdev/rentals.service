import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { authConfig } from '../config/auth.config';
import { UserProfile } from '../interfaces/user.interface';
import logger from '../utils/logger';

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: authConfig.google.clientId,
      clientSecret: authConfig.google.clientSecret,
      callbackURL: authConfig.google.callbackURL,
      scope: ['profile', 'email'],
    },
    (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
      // Here you could save the user to a database
      // For now, we'll just pass the profile info to the session
      const user: UserProfile = {
        id: profile.id,
        email: profile.emails?.[0]?.value || '',
        displayName: profile.displayName,
        firstName: profile.name?.givenName,
        lastName: profile.name?.familyName,
        photo: profile.photos?.[0]?.value,
      };

      logger.info('User authenticated via Google', {
        userId: user.id,
        email: user.email,
      });

      return done(null, user);
    }
  )
);

// Serialize user to session
passport.serializeUser((user: any, done) => {
  done(null, user);
});

// Deserialize user from session
passport.deserializeUser((user: any, done) => {
  done(null, user);
});

export default passport;
