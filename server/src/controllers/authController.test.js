import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../models/userModel.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    Role: actual.Role,
    normalizeEmail: actual.normalizeEmail,
    toUserDTO: actual.toUserDTO,
    findByEmailWithPassword: vi.fn(),
    create: vi.fn(),
  }
})

import * as UserModel from '../models/userModel.js'
import { hashPassword } from '../utils/password.js'
import { verifyToken } from '../utils/token.js'
import { login, register } from './authController.js'

process.env.JWT_SECRET = 'unit-test-secret'

function mockRes() {
  const res = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  return res
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('authController.register', () => {
  it('rejects an invalid email', async () => {
    const res = mockRes()
    await register({ body: { email: 'not-an-email', password: 'longenough' } }, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(400)
    expect(UserModel.create).not.toHaveBeenCalled()
  })

  it('rejects a password shorter than 8 characters', async () => {
    const res = mockRes()
    await register({ body: { email: 'a@b.co', password: 'short' } }, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(400)
    expect(UserModel.create).not.toHaveBeenCalled()
  })

  it('rejects an email that is already taken', async () => {
    UserModel.findByEmailWithPassword.mockResolvedValue({ id: 'u1' })
    const res = mockRes()
    await register({ body: { email: 'a@b.co', password: 'longenough' } }, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(409)
  })

  it('creates the user and returns a token for it', async () => {
    UserModel.findByEmailWithPassword.mockResolvedValue(null)
    UserModel.create.mockResolvedValue({ id: 'u1', email: 'a@b.co', role: 'user' })
    const res = mockRes()
    await register({ body: { email: 'A@B.co', password: 'longenough' } }, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(201)
    const { token, user } = res.json.mock.calls[0][0]
    expect(user.id).toBe('u1')
    expect(verifyToken(token)).toBe('u1')
  })
})

describe('authController.login', () => {
  const stored = { id: 'u1', email: 'a@b.co', role: 'user', createdAt: new Date() }

  it('rejects a wrong password', async () => {
    UserModel.findByEmailWithPassword.mockResolvedValue({ ...stored, passwordHash: await hashPassword('right-password') })
    const res = mockRes()
    await login({ body: { email: 'a@b.co', password: 'wrong-password' } }, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('rejects an unknown email with the same error', async () => {
    UserModel.findByEmailWithPassword.mockResolvedValue(null)
    const res = mockRes()
    await login({ body: { email: 'nobody@b.co', password: 'whatever1' } }, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('returns a token without leaking the password hash', async () => {
    UserModel.findByEmailWithPassword.mockResolvedValue({ ...stored, passwordHash: await hashPassword('right-password') })
    const res = mockRes()
    await login({ body: { email: 'a@b.co', password: 'right-password' } }, res, vi.fn())

    const { token, user } = res.json.mock.calls[0][0]
    expect(verifyToken(token)).toBe('u1')
    expect(user).not.toHaveProperty('passwordHash')
  })
})
