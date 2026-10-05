import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../models/userModel.js', () => ({
  Role: { USER: 'user', ADMIN: 'admin' },
  findById: vi.fn(),
}))

import * as UserModel from '../models/userModel.js'
import { signToken } from '../utils/token.js'
import { requireAdmin, requireAuth } from './auth.js'

process.env.JWT_SECRET = 'unit-test-secret'

function mockReq(authorization) {
  return { get: (name) => (name === 'Authorization' ? authorization : undefined) }
}

function mockRes() {
  const res = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  return res
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('requireAuth', () => {
  it('rejects a request without a token', async () => {
    const res = mockRes()
    const next = vi.fn()
    await requireAuth(mockReq(undefined), res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('rejects a forged token', async () => {
    const res = mockRes()
    await requireAuth(mockReq('Bearer not.a.real.token'), res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('rejects a valid token whose user no longer exists', async () => {
    UserModel.findById.mockResolvedValue(null)
    const res = mockRes()
    await requireAuth(mockReq(`Bearer ${signToken({ id: 'deleted' })}`), res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('attaches the user and continues for a valid token', async () => {
    const user = { id: 'u1', role: 'user' }
    UserModel.findById.mockResolvedValue(user)
    const req = mockReq(`Bearer ${signToken(user)}`)
    const next = vi.fn()
    await requireAuth(req, mockRes(), next)

    expect(req.user).toEqual(user)
    expect(next).toHaveBeenCalledWith()
  })
})

describe('requireAdmin', () => {
  it('rejects a regular user', () => {
    const res = mockRes()
    const next = vi.fn()
    requireAdmin({ user: { role: 'user' } }, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('lets an admin through', () => {
    const next = vi.fn()
    requireAdmin({ user: { role: 'admin' } }, mockRes(), next)

    expect(next).toHaveBeenCalled()
  })
})
