-- Migration Rollback: Remove PostgreSQL session store table
-- Purpose: Rollback session table creation (revert to Redis)
-- Created: 2025-11-14
-- Database: rentals_db

-- Drop the session table and its index
-- WARNING: This will delete all active sessions (users will be logged out)
DROP INDEX IF EXISTS "IDX_session_expire";
DROP TABLE IF EXISTS "session";
