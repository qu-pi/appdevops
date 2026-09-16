import { randomUUID } from 'node:crypto'
import { pool } from '../config/db.js'

const COLUMN_BY_FIELD = {
  title: 'title',
  description: 'description',
  dueDate: 'due_date',
  priority: 'priority',
  category: 'category',
  completed: 'completed',
}

function rowToTask(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date ? formatDate(row.due_date) : '',
    priority: row.priority,
    category: row.category,
    completed: Boolean(row.completed),
    createdAt: row.created_at.toISOString(),
  }
}

function formatDate(value) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10)
}

export async function findAll() {
  const [rows] = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC')
  return rows.map(rowToTask)
}

export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id])
  return rows[0] ? rowToTask(rows[0]) : null
}

export async function create({ title, description = '', dueDate = '', priority = 'medium', category = '' }) {
  const id = randomUUID()
  await pool.query(
    `INSERT INTO tasks (id, title, description, due_date, priority, category, completed)
     VALUES (?, ?, ?, ?, ?, ?, FALSE)`,
    [id, title.trim(), description.trim(), dueDate || null, priority, category.trim()]
  )
  return findById(id)
}

export async function update(id, changes) {
  const fields = []
  const values = []

  for (const [field, column] of Object.entries(COLUMN_BY_FIELD)) {
    if (changes[field] === undefined) continue
    fields.push(`${column} = ?`)
    values.push(field === 'dueDate' ? changes[field] || null : changes[field])
  }

  if (fields.length === 0) return findById(id)

  values.push(id)
  await pool.query(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, values)
  return findById(id)
}

export async function remove(id) {
  await pool.query('DELETE FROM tasks WHERE id = ?', [id])
}

export async function removeCompleted() {
  await pool.query('DELETE FROM tasks WHERE completed = TRUE')
}
