import { EntitySchema } from 'typeorm'

export const Task = new EntitySchema({
  name: 'Task',
  tableName: 'tasks',
  columns: {
    id: {
      type: 'char',
      length: 36,
      primary: true,
    },
    title: {
      type: 'varchar',
      length: 120,
    },
    description: {
      type: 'varchar',
      length: 500,
      default: '',
    },
    dueDate: {
      name: 'due_date',
      type: 'date',
      nullable: true,
    },
    priority: {
      type: 'enum',
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    category: {
      type: 'varchar',
      length: 40,
      default: '',
    },
    completed: {
      type: 'boolean',
      default: false,
    },
    createdAt: {
      name: 'created_at',
      type: 'datetime',
      createDate: true,
    },
  },
  indices: [
    { name: 'idx_tasks_completed', columns: ['completed'] },
    { name: 'idx_tasks_due_date', columns: ['dueDate'] },
  ],
})
