export interface AuthConfig {
  google: {
    clientId: string;
    clientSecret: string;
    callbackURL: string;
  };
  session: {
    secret: string;
    maxAge: number;
  };
}

export const authConfig: AuthConfig = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'https://api.gatherhubs.com/auth/google/callback',
  },
  session: {
    secret: process.env.SESSION_SECRET || 'your-session-secret-change-this',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
};

// Validate required environment variables
export function validateAuthConfig(): void {
  const missing: string[] = [];

  if (!authConfig.google.clientId) {
    missing.push('GOOGLE_CLIENT_ID');
  }
  if (!authConfig.google.clientSecret) {
    missing.push('GOOGLE_CLIENT_SECRET');
  }
  if (!authConfig.session.secret || authConfig.session.secret === 'your-session-secret-change-this') {
    missing.push('SESSION_SECRET');
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required authentication environment variables: ${missing.join(', ')}\n` +
      'Please set these variables before starting the server.'
    );
  }
}
