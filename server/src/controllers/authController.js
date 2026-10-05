import * as UserModel from '../models/userModel.js'
import { burnPasswordCheck, verifyPassword } from '../utils/password.js'
import { signToken } from '../utils/token.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 128

function validateCredentials({ email, password }) {
  const normalized = UserModel.normalizeEmail(email)
  if (!EMAIL_PATTERN.test(normalized) || normalized.length > 255) return 'Adresse email invalide.'
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`
  }
  if (password.length > MAX_PASSWORD_LENGTH) return 'Mot de passe trop long.'
  return null
}

export async function register(req, res, next) {
  try {
    const error = validateCredentials(req.body)
    if (error) return res.status(400).json({ error })

    if (await UserModel.findByEmailWithPassword(req.body.email)) {
      return res.status(409).json({ error: 'Un compte existe déjà avec cet email.' })
    }

    const user = await UserModel.create({ email: req.body.email, password: req.body.password })
    res.status(201).json({ token: signToken(user), user })
  } catch (err) {
    // Two simultaneous sign-ups with the same email: the unique index wins.
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Un compte existe déjà avec cet email.' })
    }
    next(err)
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body
    if (!email || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email et mot de passe requis.' })
    }

    const user = await UserModel.findByEmailWithPassword(email)
    const valid = user ? await verifyPassword(password, user.passwordHash) : await burnPasswordCheck(password)
    if (!valid) return res.status(401).json({ error: 'Email ou mot de passe incorrect.' })

    const dto = UserModel.toUserDTO(user)
    res.json({ token: signToken(dto), user: dto })
  } catch (err) {
    next(err)
  }
}

export function me(req, res) {
  res.json(req.user)
}
