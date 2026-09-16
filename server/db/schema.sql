CREATE DATABASE IF NOT EXISTS taskmanager
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE taskmanager;

CREATE TABLE IF NOT EXISTS tasks (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  description VARCHAR(500) NOT NULL DEFAULT '',
  due_date DATE NULL,
  priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  category VARCHAR(40) NOT NULL DEFAULT '',
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tasks_completed (completed),
  INDEX idx_tasks_due_date (due_date)
);
