import { t } from '../utils/i18n.js'
import { request } from './api.js'

export class AdminService {
  stats = null
  users = []
  tasks = []

  async load() {
    const [stats, users, tasks] = await Promise.all([
      request('/admin/stats', {}, t('errAdminLoad')),
      request('/admin/users', {}, t('errAdminLoad')),
      request('/admin/tasks', {}, t('errAdminLoad')),
    ])
    Object.assign(this, { stats, users, tasks })
  }

  async removeUser(id) {
    await request(`/admin/users/${id}`, { method: 'DELETE' }, t('errAdminDeleteUser'))
    await this.load()
  }

  async removeTask(id) {
    await request(`/admin/tasks/${id}`, { method: 'DELETE' }, t('errDelete'))
    await this.load()
  }
}
