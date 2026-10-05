import { EntitySchema } from 'typeorm'

export const User = new EntitySchema({
  name: 'User',
  tableName: 'users',
  columns: {
    id: {
      type: 'char',
      length: 36,
      primary: true,
    },
    email: {
      type: 'varchar',
      length: 255,
      unique: true,
    },
    passwordHash: {
      name: 'password_hash',
      type: 'varchar',
      length: 255,
    },
    role: {
      type: 'enum',
      enum: ['user', 'admin'],
      default: 'user',
    },
    createdAt: {
      name: 'created_at',
      type: 'datetime',
      createDate: true,
    },
  },
})
