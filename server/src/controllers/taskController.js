import * as TaskModel from '../models/taskModel.js'

const ALLOWED_PRIORITIES = new Set(['low', 'medium', 'high'])

export async function list(req, res, next) {
  try {
    res.json(await TaskModel.findAll())
  } catch (err) {
    next(err)
  }
}

export async function create(req, res, next) {
  try {
    const { title, priority } = req.body

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Le titre est requis.' })
    }
    if (priority && !ALLOWED_PRIORITIES.has(priority)) {
      return res.status(400).json({ error: 'Priorité invalide.' })
    }

    const task = await TaskModel.create(req.body)
    res.status(201).json(task)
  } catch (err) {
    next(err)
  }
}

export async function update(req, res, next) {
  try {
    const existing = await TaskModel.findById(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Tâche introuvable.' })

    if (req.body.priority && !ALLOWED_PRIORITIES.has(req.body.priority)) {
      return res.status(400).json({ error: 'Priorité invalide.' })
    }

    res.json(await TaskModel.update(req.params.id, req.body))
  } catch (err) {
    next(err)
  }
}

export async function remove(req, res, next) {
  try {
    await TaskModel.remove(req.params.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

export async function removeCompleted(req, res, next) {
  try {
    await TaskModel.removeCompleted()
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

export async function removeAll(req, res, next) {
  try {
    await TaskModel.removeAll()
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}
