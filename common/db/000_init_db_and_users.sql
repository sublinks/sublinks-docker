-- create databases
CREATE DATABASE backend;
CREATE DATABASE federation;

-- create users and grant rights in postgres
CREATE ROLE backend WITH LOGIN PASSWORD 'backend';
CREATE ROLE federation WITH LOGIN PASSWORD 'federation';
GRANT ALL PRIVILEGES ON DATABASE backend TO backend;
GRANT ALL PRIVILEGES ON DATABASE federation TO federation;

