-- DOWN Migration: Remove receipts table and related objects
-- Description: Rolls back changes from add_receipts_table_up.sql
-- Forward Migration: Run add_receipts_table_up.sql to recreate this table
-- Date: 2025-11-14
--
-- ⚠️  WARNING: This will permanently delete all receipt data!
-- ⚠️  Make sure to backup data before running this rollback
--
-- This rollback:
-- - Drops update_receipts_updated_at trigger
-- - Drops receipts table (and all associated indexes)
-- - Drops update_updated_at_column() function
-- - Drops receipt_type enum

-- Drop the trigger (will be automatically dropped with the table, but explicit for clarity)
DROP TRIGGER IF EXISTS update_receipts_updated_at ON receipts;

-- Drop the table (CASCADE will drop dependent objects like triggers)
-- This also automatically drops all indexes on the table
DROP TABLE IF EXISTS receipts CASCADE;

-- Drop the function used for updating timestamps
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop the enum type
DROP TYPE IF EXISTS receipt_type CASCADE;

-- Verification query (optional - uncomment to verify cleanup)
-- SELECT
--   tablename
-- FROM pg_tables
-- WHERE schemaname = 'public' AND tablename = 'receipts';
--
-- SELECT
--   typname
-- FROM pg_type
-- WHERE typname = 'receipt_type';
