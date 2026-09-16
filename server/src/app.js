import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import taskRoutes from './routes/taskRoutes.js'

export const app = express()

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))
app.use('/api/tasks', taskRoutes)

app.use((req, res) => {
  res.status(404).json({ error: 'Route introuvable.' })
})

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Erreur serveur.' })
})
