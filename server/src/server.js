import { AppDataSource } from './config/dataSource.js'
import { migrate } from './config/migrate.js'
import { bootstrapAdmin } from './config/bootstrapAdmin.js'
import { app } from './app.js'

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET doit être défini (chaîne aléatoire longue, ex : `openssl rand -hex 32`).')
  process.exit(1)
}

const PORT = process.env.PORT || 3001
const MAX_RETRIES = Number(process.env.DB_CONNECT_RETRIES) || 10
const RETRY_DELAY_MS = Number(process.env.DB_CONNECT_RETRY_DELAY_MS) || 3000

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function connectWithRetry(attempt = 1) {
  try {
    await AppDataSource.initialize()
  } catch (err) {
    if (attempt >= MAX_RETRIES) {
      console.error('Impossible de se connecter à la base de données :', err.message)
      process.exit(1)
    }
    console.warn(
      `Base de données indisponible (tentative ${attempt}/${MAX_RETRIES}), nouvel essai dans ${RETRY_DELAY_MS}ms...`,
    )
    await wait(RETRY_DELAY_MS)
    return connectWithRetry(attempt + 1)
  }
}

await connectWithRetry()
await migrate()
await bootstrapAdmin()

app.listen(PORT, () => {
  console.log(`API disponible sur http://localhost:${PORT}`)
})
