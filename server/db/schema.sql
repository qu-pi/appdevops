CREATE DATABASE IF NOT EXISTS taskmanager
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE taskmanager;

-- Fresh databases only: existing ones are upgraded at server boot by
-- server/src/config/migrate.js, which must stay in sync with this file.
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE INDEX idx_users_email (email)
);

CREATE TABLE IF NOT EXISTS tasks (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NULL,
  title VARCHAR(120) NOT NULL,
  description VARCHAR(500) NOT NULL DEFAULT '',
  due_date DATE NULL,
  priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  category VARCHAR(40) NOT NULL DEFAULT '',
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tasks_completed (completed),
  INDEX idx_tasks_due_date (due_date),
  INDEX idx_tasks_user_id (user_id),
  CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
