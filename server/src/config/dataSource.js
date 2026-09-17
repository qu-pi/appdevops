import 'reflect-metadata'
import dotenv from 'dotenv'
import { DataSource } from 'typeorm'
import { Task } from '../entities/Task.js'

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'taskmanager',
  entities: [Task],
  synchronize: false,
})
