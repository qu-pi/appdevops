import { Router } from 'express'
import * as TaskController from '../controllers/taskController.js'

const router = Router()

router.get('/', TaskController.list)
router.post('/', TaskController.create)
router.delete('/completed', TaskController.removeCompleted)
router.patch('/:id', TaskController.update)
router.delete('/:id', TaskController.remove)

export default router
