import { AppDataSource } from './dataSource.js'

// Idempotent upgrade for databases created before user accounts existed
// (db/schema.sql only runs on an empty data volume, so preprod/prod never
// see its changes). Safe to run on every boot. Tasks created before this
// migration keep a NULL owner: only admins can see and delete them.
export async function migrate() {
  await AppDataSource.query(`
    CREATE TABLE IF NOT EXISTS users (
      id CHAR(36) PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE INDEX idx_users_email (email)
    )
  `)

  const [{ count }] = await AppDataSource.query(`
    SELECT COUNT(*) AS count FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks' AND COLUMN_NAME = 'user_id'
  `)

  if (Number(count) === 0) {
    await AppDataSource.query(`
      ALTER TABLE tasks
        ADD COLUMN user_id CHAR(36) NULL AFTER id,
        ADD INDEX idx_tasks_user_id (user_id),
        ADD CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    `)
    console.log('Migration : colonne tasks.user_id ajoutée.')
  }
}
