-- Migration: Add PostgreSQL session store table
-- Purpose: Replace Redis session storage with PostgreSQL
-- Created: 2025-11-14
-- Database: rentals_db

-- Create session table for express-session with connect-pg-simple
-- This table stores user sessions for authentication persistence
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

-- Create index on expire column for efficient session cleanup
-- This index is used by the pruning process to delete expired sessions
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

-- Add table comment for documentation
COMMENT ON TABLE "session" IS 'Express session store - stores user authentication sessions';
COMMENT ON COLUMN "session"."sid" IS 'Session ID from cookie';
COMMENT ON COLUMN "session"."sess" IS 'Session data (JSON blob with user info, OAuth data, etc.)';
COMMENT ON COLUMN "session"."expire" IS 'Session expiration timestamp for automatic cleanup';
