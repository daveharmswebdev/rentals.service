-- UP Migration: Add receipts table
-- Description: Create receipts table to track maintenance expenses for homes
-- Rollback: Run add_receipts_table_down.sql to remove this table
-- Date: 2025-11-14
--
-- This migration:
-- - Creates receipt_type enum (service, store)
-- - Creates receipts table with audit fields
-- - Adds indexes for performance
-- - Creates auto-update trigger for updated_at
-- - Includes sample test data

-- Drop existing receipts table if it exists
DROP TABLE IF EXISTS receipts;

-- Create type enum for receipt type
DO $$ BEGIN
    CREATE TYPE receipt_type AS ENUM ('service', 'store');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Receipts Table
CREATE TABLE receipts (
    id SERIAL PRIMARY KEY,
    home_id INTEGER NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    type receipt_type NOT NULL,
    vendor_name VARCHAR(255) NOT NULL,
    paid_date DATE NOT NULL,
    description TEXT,
    category VARCHAR(100),
    receipt_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Create indexes for better query performance
CREATE INDEX idx_receipts_home_id ON receipts(home_id);
CREATE INDEX idx_receipts_paid_date ON receipts(paid_date);
CREATE INDEX idx_receipts_type ON receipts(type);
CREATE INDEX idx_receipts_category ON receipts(category);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before update
CREATE TRIGGER update_receipts_updated_at
    BEFORE UPDATE ON receipts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO receipts (home_id, total, type, vendor_name, paid_date, description, category, created_by) VALUES
(1, 350.00, 'service', 'ABC HVAC Services', '2025-01-15', 'Annual AC maintenance and filter replacement', 'HVAC', 'admin@example.com'),
(1, 125.50, 'store', 'Home Depot', '2025-02-03', 'Door hardware and locks', 'Hardware', 'admin@example.com'),
(2, 500.00, 'service', 'ProPlumb Plumbing', '2025-01-22', 'Fixed leaking pipe in bathroom', 'Plumbing', 'admin@example.com'),
(2, 75.25, 'store', 'Lowes', '2025-02-10', 'Paint and supplies for bedroom', 'Painting', 'admin@example.com'),
(3, 1200.00, 'service', 'ElectricPro', '2025-01-30', 'Electrical panel upgrade', 'Electrical', 'admin@example.com'),
(4, 45.00, 'store', 'Ace Hardware', '2025-02-01', 'Light bulbs and fuses', 'Electrical', 'admin@example.com');

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON receipts TO postgres;
-- GRANT ALL PRIVILEGES ON SEQUENCE receipts_id_seq TO postgres;

-- Comments for documentation
COMMENT ON TABLE receipts IS 'Stores maintenance and purchase receipts for rental properties';
COMMENT ON COLUMN receipts.home_id IS 'Foreign key reference to the homes table';
COMMENT ON COLUMN receipts.total IS 'Total amount on the receipt';
COMMENT ON COLUMN receipts.type IS 'Type of receipt: service (for services) or store (for goods)';
COMMENT ON COLUMN receipts.vendor_name IS 'Name of the vendor/store/service provider';
COMMENT ON COLUMN receipts.paid_date IS 'Date when the receipt was paid';
COMMENT ON COLUMN receipts.description IS 'Optional description of what was purchased or serviced';
COMMENT ON COLUMN receipts.category IS 'Optional category for organizing receipts (e.g., HVAC, Plumbing, Electrical)';
COMMENT ON COLUMN receipts.receipt_url IS 'Optional URL to digital copy of the receipt';
