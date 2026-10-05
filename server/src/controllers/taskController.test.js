import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../models/taskModel.js', () => ({
  create: vi.fn(),
  findOwned: vi.fn(),
  update: vi.fn(),
}))

import * as TaskModel from '../models/taskModel.js'
import { create, update } from './taskController.js'

const user = { id: 'user-1', role: 'user' }

function mockRes() {
  const res = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  return res
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('taskController.create', () => {
  it('rejects a task with a blank title', async () => {
    const req = { user, body: { title: '   ' } }
    const res = mockRes()

    await create(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(400)
    expect(TaskModel.create).not.toHaveBeenCalled()
  })

  it('rejects an invalid priority', async () => {
    const req = { user, body: { title: 'Write tests', priority: 'urgent' } }
    const res = mockRes()

    await create(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(400)
    expect(TaskModel.create).not.toHaveBeenCalled()
  })

  it('creates a task when the payload is valid', async () => {
    TaskModel.create.mockResolvedValue({ id: '1', title: 'Write tests' })
    const req = { user, body: { title: 'Write tests', priority: 'high' } }
    const res = mockRes()

    await create(req, res, vi.fn())

    expect(TaskModel.create).toHaveBeenCalledWith('user-1', req.body)
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({ id: '1', title: 'Write tests' })
  })

  it('forwards unexpected errors to the error middleware', async () => {
    const boom = new Error('boom')
    TaskModel.create.mockRejectedValue(boom)
    const req = { user, body: { title: 'Write tests' } }
    const res = mockRes()
    const next = vi.fn()

    await create(req, res, next)

    expect(next).toHaveBeenCalledWith(boom)
  })
})

describe('taskController.update', () => {
  it('returns 404 when the task does not exist or belongs to someone else', async () => {
    TaskModel.findOwned.mockResolvedValue(null)
    const req = { user, params: { id: 'missing' }, body: {} }
    const res = mockRes()

    await update(req, res, vi.fn())

    expect(TaskModel.findOwned).toHaveBeenCalledWith('missing', 'user-1')
    expect(res.status).toHaveBeenCalledWith(404)
    expect(TaskModel.update).not.toHaveBeenCalled()
  })

  it('rejects an invalid priority on update', async () => {
    TaskModel.findOwned.mockResolvedValue({ id: '1' })
    const req = { user, params: { id: '1' }, body: { priority: 'urgent' } }
    const res = mockRes()

    await update(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(400)
    expect(TaskModel.update).not.toHaveBeenCalled()
  })
})
