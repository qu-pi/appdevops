import * as UserModel from '../models/userModel.js'
import * as TaskModel from '../models/taskModel.js'

export async function stats(req, res, next) {
  try {
    const [users, tasks] = await Promise.all([UserModel.countStats(), TaskModel.countStats()])
    res.json({
      users: users.total,
      admins: users.admins,
      tasks: tasks.total,
      completedTasks: tasks.completed,
      activeTasks: tasks.total - tasks.completed,
    })
  } catch (err) {
    next(err)
  }
}

export async function listUsers(req, res, next) {
  try {
    res.json(await UserModel.findAllWithTaskCounts())
  } catch (err) {
    next(err)
  }
}

export async function removeUser(req, res, next) {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte.' })
    }
    if (!(await UserModel.findById(req.params.id))) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' })
    }

    await UserModel.remove(req.params.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

export async function listTasks(req, res, next) {
  try {
    res.json(await TaskModel.findAllWithOwner())
  } catch (err) {
    next(err)
  }
}

export async function removeTask(req, res, next) {
  try {
    await TaskModel.removeAny(req.params.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}
