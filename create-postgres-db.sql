-- SQL Script to Create Zenpay Database
-- Run this as PostgreSQL superuser (postgres)

-- Create user
CREATE USER zenpay_user WITH PASSWORD 'change_this_password';

-- Create database
CREATE DATABASE zenpay_db WITH OWNER zenpay_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE zenpay_db TO zenpay_user;

-- Connect to the database
\c zenpay_db

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO zenpay_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO zenpay_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO zenpay_user;

-- Verify setup
SELECT current_database();
SELECT current_user;

-- List databases
\l

-- Success message
SELECT 'Database setup complete!' AS status;

