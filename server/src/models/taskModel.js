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

export async function findAll() {
  const tasks = await taskRepository.find({ order: { createdAt: 'DESC' } })
  return tasks.map(toTaskDTO)
}

export async function findById(id) {
  const task = await taskRepository.findOneBy({ id })
  return task ? toTaskDTO(task) : null
}

export async function create({ title, description = '', dueDate = '', priority = 'medium', category = '' }) {
  const task = taskRepository.create({
    id: randomUUID(),
    title: title.trim(),
    description: description.trim(),
    dueDate: dueDate || null,
    priority,
    category: category.trim(),
    completed: false,
  })
  await taskRepository.save(task)
  return findById(task.id)
}

export async function update(id, changes) {
  const patch = {}
  for (const field of UPDATABLE_FIELDS) {
    if (changes[field] === undefined) continue
    patch[field] = field === 'dueDate' ? changes[field] || null : changes[field]
  }

  if (Object.keys(patch).length > 0) {
    await taskRepository.update({ id }, patch)
  }
  return findById(id)
}

export async function remove(id) {
  await taskRepository.delete({ id })
}

export async function removeCompleted() {
  await taskRepository.delete({ completed: true })
}
