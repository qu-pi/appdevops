import { randomUUID } from 'node:crypto'
import { AppDataSource } from '../config/dataSource.js'
import { User } from '../entities/User.js'
import { hashPassword } from '../utils/password.js'

const userRepository = AppDataSource.getRepository(User)

export const Role = { USER: 'user', ADMIN: 'admin' }

export function toUserDTO(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  }
}

export function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase()
}

// Returns the raw entity (with passwordHash) — only for auth checks, never
// send it to the client as-is.
export async function findByEmailWithPassword(email) {
  return userRepository.findOneBy({ email: normalizeEmail(email) })
}

export async function findById(id) {
  const user = await userRepository.findOneBy({ id })
  return user ? toUserDTO(user) : null
}

export async function create({ email, password, role = Role.USER }) {
  const user = userRepository.create({
    id: randomUUID(),
    email: normalizeEmail(email),
    passwordHash: await hashPassword(password),
    role,
  })
  await userRepository.save(user)
  return findById(user.id)
}

export async function setRole(id, role) {
  await userRepository.update({ id }, { role })
  return findById(id)
}

export async function findAllWithTaskCounts() {
  const rows = await AppDataSource.query(`
    SELECT u.id, u.email, u.role, u.created_at AS createdAt,
           COUNT(t.id) AS taskCount, COALESCE(SUM(t.completed), 0) AS completedCount
    FROM users u LEFT JOIN tasks t ON t.user_id = u.id
    GROUP BY u.id, u.email, u.role, u.created_at
    ORDER BY u.created_at DESC
  `)
  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role,
    createdAt: new Date(row.createdAt).toISOString(),
    taskCount: Number(row.taskCount),
    completedCount: Number(row.completedCount),
  }))
}

export async function remove(id) {
  // Tasks go with it through the ON DELETE CASCADE foreign key.
  await userRepository.delete({ id })
}

export async function countStats() {
  const [row] = await AppDataSource.query(
    "SELECT COUNT(*) AS total, COALESCE(SUM(role = 'admin'), 0) AS admins FROM users",
  )
  return { total: Number(row.total), admins: Number(row.admins) }
}
