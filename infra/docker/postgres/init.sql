-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Optional: create a read-only role for reporting later
-- CREATE ROLE logistics_readonly WITH LOGIN PASSWORD 'readonly_pass';
-- GRANT CONNECT ON DATABASE logistics TO logistics_readonly;
