-- Ensure we're creating the database if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'rentals_db') THEN
        CREATE DATABASE rentals_db;
    END IF;
END
$$;

-- Connect to the rentals_db database
\c rentals_db

-- Drop existing tables if they exist
DROP TABLE IF EXISTS homes;
DROP TABLE IF EXISTS addresses;

-- Create Addresses Table
CREATE TABLE addresses (
    id SERIAL PRIMARY KEY,
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'USA'
);

-- Create Homes Table with foreign key to addresses
CREATE TABLE homes (
    id SERIAL PRIMARY KEY,
    address_id INTEGER REFERENCES addresses(id),
    square_feet INTEGER NOT NULL,
    bedrooms INTEGER NOT NULL,
    fullbath INTEGER NOT NULL,
    halfbath INTEGER NOT NULL,
    garage_spaces INTEGER NOT NULL
);

-- Insert Test Data for Addresses
INSERT INTO addresses (street_address, city, state, zip_code) VALUES
('123 Main St', 'Anytown', 'CA', '12345'),
('456 Oak Rd', 'Somewhere', 'NY', '67890'),
('789 Pine Lane', 'Elsewhere', 'TX', '54321'),
('321 Maple Ave', 'Nowhere', 'FL', '98765');

-- Insert Test Data for Homes (referencing addresses)
INSERT INTO homes (address_id, square_feet, bedrooms, fullbath, halfbath, garage_spaces) VALUES
(1, 2500, 4, 2, 1, 2),
(2, 1800, 3, 2, 0, 1),
(3, 3200, 5, 3, 1, 3),
(4, 1500, 2, 1, 1, 1);
