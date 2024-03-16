# create databases
CREATE DATABASE IF NOT EXISTS `backend`;
CREATE DATABASE IF NOT EXISTS `federation`;

# create root user and grant rights
CREATE USER 'backend'@'%' IDENTIFIED WITH caching_sha2_password BY 'backend';
CREATE USER 'federation'@'%' IDENTIFIED WITH caching_sha2_password BY 'federation';
GRANT ALL PRIVILEGES ON backend.* TO 'backend'@'%';
GRANT ALL PRIVILEGES ON federation.* TO 'federation'@'%';

