import { randomUUID } from 'node:crypto'
import { AppDataSource } from '../config/dataSource.js'
import { Task } from '../entities/Task.js'

const taskRepository = AppDataSource.getRepository(Task)

const UPDATABLE_FIELDS = ['title', 'description', 'dueDate', 'priority', 'category', 'completed']

function toTaskDTO(task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate ? formatDate(task.dueDate) : '',
    priority: task.priority,
    category: task.category,
    completed: Boolean(task.completed),
    createdAt: task.createdAt.toISOString(),
  }
}

function formatDate(value) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10)
}

// Every user-facing query is scoped by userId, so a user can never read or
// change another user's task even by guessing its id.

export async function findAllByUser(userId) {
  const tasks = await taskRepository.find({ where: { userId }, order: { createdAt: 'DESC' } })
  return tasks.map(toTaskDTO)
}

export async function findOwned(id, userId) {
  const task = await taskRepository.findOneBy({ id, userId })
  return task ? toTaskDTO(task) : null
}

export async function create(userId, { title, description = '', dueDate = '', priority = 'medium', category = '' }) {
  const task = taskRepository.create({
    id: randomUUID(),
    userId,
    title: title.trim(),
    description: description.trim(),
    dueDate: dueDate || null,
    priority,
    category: category.trim(),
    completed: false,
  })
  await taskRepository.save(task)
  return findOwned(task.id, userId)
}

export async function update(id, userId, changes) {
  const patch = {}
  for (const field of UPDATABLE_FIELDS) {
    if (changes[field] === undefined) continue
    patch[field] = field === 'dueDate' ? changes[field] || null : changes[field]
  }

  if (Object.keys(patch).length > 0) {
    await taskRepository.update({ id, userId }, patch)
  }
  return findOwned(id, userId)
}

export async function remove(id, userId) {
  await taskRepository.delete({ id, userId })
}

export async function removeCompleted(userId) {
  await taskRepository.delete({ userId, completed: true })
}

export async function removeAll(userId) {
  await taskRepository.delete({ userId })
}

// --- Admin (unscoped) -------------------------------------------------------

export async function findAllWithOwner() {
  const rows = await AppDataSource.query(`
    SELECT t.id, t.title, t.priority, t.completed, DATE_FORMAT(t.due_date, '%Y-%m-%d') AS dueDate, t.created_at AS createdAt,
           t.user_id AS userId, u.email AS ownerEmail
    FROM tasks t LEFT JOIN users u ON u.id = t.user_id
    ORDER BY t.created_at DESC
  `)
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    priority: row.priority,
    completed: Boolean(row.completed),
    dueDate: row.dueDate || '',
    createdAt: new Date(row.createdAt).toISOString(),
    userId: row.userId,
    ownerEmail: row.ownerEmail,
  }))
}

export async function removeAny(id) {
  await taskRepository.delete({ id })
}

export async function countStats() {
  const [row] = await AppDataSource.query(
    'SELECT COUNT(*) AS total, COALESCE(SUM(completed), 0) AS completed FROM tasks',
  )
  return { total: Number(row.total), completed: Number(row.completed) }
}
