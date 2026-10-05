import { Router } from 'express'
import * as AdminController from '../controllers/adminController.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireAdmin)

router.get('/stats', AdminController.stats)
router.get('/users', AdminController.listUsers)
router.delete('/users/:id', AdminController.removeUser)
router.get('/tasks', AdminController.listTasks)
router.delete('/tasks/:id', AdminController.removeTask)

export default router
