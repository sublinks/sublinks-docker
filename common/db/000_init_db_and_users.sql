-- create databases
CREATE SCHEMA backend;
CREATE SCHEMA federation;

-- create users and grant rights in postgres
CREATE ROLE backend WITH LOGIN PASSWORD 'backend';
CREATE ROLE federation WITH LOGIN PASSWORD 'federation';
GRANT ALL ON SCHEMA backend TO backend;
GRANT ALL ON SCHEMA federation TO federation;


-- set default schema for users
ALTER USER backend SET search_path TO backend;
ALTER USER federation SET search_path TO federation;
