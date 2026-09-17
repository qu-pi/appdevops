import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TaskService } from './taskService.js'

function jsonResponse(body, status = 200) {
  return { ok: status < 400, status, json: async () => body }
}

describe('TaskService', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads tasks and notifies subscribers', async () => {
    const tasks = [{ id: '1', title: 'Task 1' }]
    global.fetch.mockResolvedValue(jsonResponse(tasks))

    const service = new TaskService()
    const listener = vi.fn()
    service.subscribe(listener)

    await service.load()

    expect(service.getAll()).toEqual(tasks)
    expect(listener).toHaveBeenCalledWith(tasks)
  })

  it('adds a task then reloads the list', async () => {
    global.fetch
      .mockResolvedValueOnce(jsonResponse({ id: '1' }, 201))
      .mockResolvedValueOnce(jsonResponse([{ id: '1', title: 'New task' }]))

    const service = new TaskService()
    await service.add({ title: 'New task' })

    expect(global.fetch).toHaveBeenCalledTimes(2)
    expect(service.getAll()).toEqual([{ id: '1', title: 'New task' }])
  })

  it('throws the server error message when a request fails', async () => {
    global.fetch.mockResolvedValue(jsonResponse({ error: 'Le titre est requis.' }, 400))

    const service = new TaskService()

    await expect(service.add({ title: '' })).rejects.toThrow('Le titre est requis.')
  })
})
