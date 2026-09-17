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
import { Task } from '../entities/Task.js'
import { app } from '../app.js'

beforeAll(async () => {
  await AppDataSource.initialize()
})

afterAll(async () => {
  await AppDataSource.destroy()
})

beforeEach(async () => {
  await AppDataSource.getRepository(Task).clear()
})

describe('Task API (integration)', () => {
  it('creates a task and lists it back', async () => {
    const created = await request(app)
      .post('/api/tasks')
      .send({ title: 'Write tests', priority: 'high' })
      .expect(201)

    expect(created.body).toMatchObject({ title: 'Write tests', priority: 'high', completed: false })

    const list = await request(app).get('/api/tasks').expect(200)
    expect(list.body).toHaveLength(1)
    expect(list.body[0].id).toBe(created.body.id)
  })

  it('rejects a task without a title', async () => {
    await request(app).post('/api/tasks').send({}).expect(400)
  })

  it('updates and deletes a task', async () => {
    const created = await request(app).post('/api/tasks').send({ title: 'Temp task' }).expect(201)

    const updated = await request(app)
      .patch(`/api/tasks/${created.body.id}`)
      .send({ completed: true })
      .expect(200)
    expect(updated.body.completed).toBe(true)

    await request(app).delete(`/api/tasks/${created.body.id}`).expect(204)

    const list = await request(app).get('/api/tasks').expect(200)
    expect(list.body).toHaveLength(0)
  })

  it('returns 404 when updating a task that does not exist', async () => {
    await request(app).patch('/api/tasks/00000000-0000-0000-0000-000000000000').send({ completed: true }).expect(404)
  })

  it('clears only completed tasks', async () => {
    const done = await request(app).post('/api/tasks').send({ title: 'Done' }).expect(201)
    await request(app).post('/api/tasks').send({ title: 'Pending' }).expect(201)
    await request(app).patch(`/api/tasks/${done.body.id}`).send({ completed: true }).expect(200)

    await request(app).delete('/api/tasks/completed').expect(204)

    const list = await request(app).get('/api/tasks').expect(200)
    expect(list.body).toHaveLength(1)
    expect(list.body[0].title).toBe('Pending')
  })
})
