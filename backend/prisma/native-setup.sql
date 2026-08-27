CREATE DATABASE IF NOT EXISTS outbox;

CREATE USER IF NOT EXISTS 'outboxuser'@'localhost' IDENTIFIED WITH caching_sha2_password BY 'outboxpass';
ALTER USER 'outboxuser'@'localhost' IDENTIFIED WITH caching_sha2_password BY 'outboxpass';
GRANT ALL PRIVILEGES ON outbox.* TO 'outboxuser'@'localhost';
FLUSH PRIVILEGES;
