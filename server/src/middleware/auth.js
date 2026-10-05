import * as UserModel from '../models/userModel.js'
import { verifyToken } from '../utils/token.js'

// Re-reads the user on every request so a deleted account loses access
// immediately, instead of keeping it until its token expires.
export async function requireAuth(req, res, next) {
  try {
    const header = req.get('Authorization') || ''
    const [scheme, token] = header.split(' ')
    const userId = scheme === 'Bearer' && token ? verifyToken(token) : null
    const user = userId ? await UserModel.findById(userId) : null

    if (!user) return res.status(401).json({ error: 'Authentification requise.' })

    req.user = user
    next()
  } catch (err) {
    next(err)
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== UserModel.Role.ADMIN) {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs.' })
  }
  next()
}
