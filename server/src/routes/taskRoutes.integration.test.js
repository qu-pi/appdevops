// Integration test: exercises the real Express app against a real MySQL
// database, matching the engine used in production. Requires the ephemeral
// test database from ../../docker-compose.test.yml to be running:
//
//   docker compose -f docker-compose.test.yml up -d --wait
//   npm --prefix server run test:integration
//   docker compose -f docker-compose.test.yml down -v
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { AppDataSource } from '../config/dataSource.js'
import * as UserModel from '../models/userModel.js'
import { app } from '../app.js'

process.env.JWT_SECRET ??= 'integration-test-secret'

beforeAll(async () => {
  await AppDataSource.initialize()
})

afterAll(async () => {
  await AppDataSource.destroy()
})

beforeEach(async () => {
  // DELETE rather than TRUNCATE: tasks.user_id has a foreign key on users.
  await AppDataSource.query('DELETE FROM tasks')
  await AppDataSource.query('DELETE FROM users')
})

async function registerUser(email = 'alice@example.com', password = 'password123') {
  const res = await request(app).post('/api/auth/register').send({ email, password }).expect(201)
  return { token: res.body.token, user: res.body.user }
}

async function registerAdmin(email = 'admin@example.com') {
  const session = await registerUser(email)
  await UserModel.setRole(session.user.id, UserModel.Role.ADMIN)
  return session
}

const auth = (token) => ({ Authorization: `Bearer ${token}` })

describe('Auth API (integration)', () => {
  it('registers, logs in and returns the current user', async () => {
    const { user } = await registerUser('Bob@Example.com')
    expect(user).toMatchObject({ email: 'bob@example.com', role: 'user' })
    expect(user).not.toHaveProperty('passwordHash')

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@example.com', password: 'password123' })
      .expect(200)

    const me = await request(app).get('/api/auth/me').set(auth(login.body.token)).expect(200)
    expect(me.body.id).toBe(user.id)
  })

  it('refuses a duplicate email and a wrong password', async () => {
    await registerUser()
    await request(app).post('/api/auth/register').send({ email: 'alice@example.com', password: 'password123' }).expect(409)
    await request(app).post('/api/auth/login').send({ email: 'alice@example.com', password: 'wrong-pass' }).expect(401)
  })
})

describe('Task API (integration)', () => {
  it('requires authentication', async () => {
    await request(app).get('/api/tasks').expect(401)
    await request(app).post('/api/tasks').send({ title: 'Nope' }).expect(401)
  })

  it('creates a task and lists it back', async () => {
    const { token } = await registerUser()
    const created = await request(app)
      .post('/api/tasks')
      .set(auth(token))
      .send({ title: 'Write tests', priority: 'high' })
      .expect(201)

    expect(created.body).toMatchObject({ title: 'Write tests', priority: 'high', completed: false })

    const list = await request(app).get('/api/tasks').set(auth(token)).expect(200)
    expect(list.body).toHaveLength(1)
    expect(list.body[0].id).toBe(created.body.id)
  })

  it('rejects a task without a title', async () => {
    const { token } = await registerUser()
    await request(app).post('/api/tasks').set(auth(token)).send({}).expect(400)
  })

  it('updates and deletes a task', async () => {
    const { token } = await registerUser()
    const created = await request(app).post('/api/tasks').set(auth(token)).send({ title: 'Temp task' }).expect(201)

    const updated = await request(app)
      .patch(`/api/tasks/${created.body.id}`)
      .set(auth(token))
      .send({ completed: true })
      .expect(200)
    expect(updated.body.completed).toBe(true)

    await request(app).delete(`/api/tasks/${created.body.id}`).set(auth(token)).expect(204)

    const list = await request(app).get('/api/tasks').set(auth(token)).expect(200)
    expect(list.body).toHaveLength(0)
  })

  it('returns 404 when updating a task that does not exist', async () => {
    const { token } = await registerUser()
    await request(app)
      .patch('/api/tasks/00000000-0000-0000-0000-000000000000')
      .set(auth(token))
      .send({ completed: true })
      .expect(404)
  })

  it('keeps each user\'s tasks private', async () => {
    const alice = await registerUser('alice@example.com')
    const bob = await registerUser('bob@example.com')
    const task = await request(app).post('/api/tasks').set(auth(alice.token)).send({ title: 'Alice only' }).expect(201)

    const bobList = await request(app).get('/api/tasks').set(auth(bob.token)).expect(200)
    expect(bobList.body).toHaveLength(0)

    await request(app).patch(`/api/tasks/${task.body.id}`).set(auth(bob.token)).send({ completed: true }).expect(404)
    await request(app).delete(`/api/tasks/${task.body.id}`).set(auth(bob.token)).expect(204)
    await request(app).delete('/api/tasks/all').set(auth(bob.token)).expect(204)

    const aliceList = await request(app).get('/api/tasks').set(auth(alice.token)).expect(200)
    expect(aliceList.body).toHaveLength(1)
    expect(aliceList.body[0].completed).toBe(false)
  })

  it('clears only completed tasks', async () => {
    const { token } = await registerUser()
    const done = await request(app).post('/api/tasks').set(auth(token)).send({ title: 'Done' }).expect(201)
    await request(app).post('/api/tasks').set(auth(token)).send({ title: 'Pending' }).expect(201)
    await request(app).patch(`/api/tasks/${done.body.id}`).set(auth(token)).send({ completed: true }).expect(200)

    await request(app).delete('/api/tasks/completed').set(auth(token)).expect(204)

    const list = await request(app).get('/api/tasks').set(auth(token)).expect(200)
    expect(list.body).toHaveLength(1)
    expect(list.body[0].title).toBe('Pending')
  })

  it('clears all tasks regardless of status', async () => {
    const { token } = await registerUser()
    await request(app).post('/api/tasks').set(auth(token)).send({ title: 'Done' }).expect(201)
    await request(app).post('/api/tasks').set(auth(token)).send({ title: 'Pending' }).expect(201)

    await request(app).delete('/api/tasks/all').set(auth(token)).expect(204)

    const list = await request(app).get('/api/tasks').set(auth(token)).expect(200)
    expect(list.body).toHaveLength(0)
  })
})

describe('Admin API (integration)', () => {
  it('is forbidden to regular users', async () => {
    const { token } = await registerUser()
    await request(app).get('/api/admin/users').set(auth(token)).expect(403)
    await request(app).get('/api/admin/stats').set(auth(token)).expect(403)
  })

  it('lists users, tasks and stats across all accounts', async () => {
    const admin = await registerAdmin()
    const alice = await registerUser('alice@example.com')
    const done = await request(app).post('/api/tasks').set(auth(alice.token)).send({ title: 'A1' }).expect(201)
    await request(app).post('/api/tasks').set(auth(alice.token)).send({ title: 'A2' }).expect(201)
    await request(app).patch(`/api/tasks/${done.body.id}`).set(auth(alice.token)).send({ completed: true }).expect(200)

    const stats = await request(app).get('/api/admin/stats').set(auth(admin.token)).expect(200)
    expect(stats.body).toEqual({ users: 2, admins: 1, tasks: 2, completedTasks: 1, activeTasks: 1 })

    const users = await request(app).get('/api/admin/users').set(auth(admin.token)).expect(200)
    expect(users.body.find((u) => u.email === 'alice@example.com')).toMatchObject({ taskCount: 2, completedCount: 1 })

    const tasks = await request(app).get('/api/admin/tasks').set(auth(admin.token)).expect(200)
    expect(tasks.body).toHaveLength(2)
    expect(tasks.body.every((t) => t.ownerEmail === 'alice@example.com')).toBe(true)
  })

  it('deletes another user with their tasks, but not itself', async () => {
    const admin = await registerAdmin()
    const alice = await registerUser('alice@example.com')
    await request(app).post('/api/tasks').set(auth(alice.token)).send({ title: 'A1' }).expect(201)

    await request(app).delete(`/api/admin/users/${admin.user.id}`).set(auth(admin.token)).expect(400)
    await request(app).delete(`/api/admin/users/${alice.user.id}`).set(auth(admin.token)).expect(204)

    const tasks = await request(app).get('/api/admin/tasks').set(auth(admin.token)).expect(200)
    expect(tasks.body).toHaveLength(0)

    // The deleted user's still-unexpired token no longer works.
    await request(app).get('/api/tasks').set(auth(alice.token)).expect(401)
  })

  it('deletes any user\'s task', async () => {
    const admin = await registerAdmin()
    const alice = await registerUser('alice@example.com')
    const task = await request(app).post('/api/tasks').set(auth(alice.token)).send({ title: 'A1' }).expect(201)

    await request(app).delete(`/api/admin/tasks/${task.body.id}`).set(auth(admin.token)).expect(204)

    const list = await request(app).get('/api/tasks').set(auth(alice.token)).expect(200)
    expect(list.body).toHaveLength(0)
  })
})
