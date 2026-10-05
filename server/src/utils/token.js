import jwt from 'jsonwebtoken'

const TOKEN_TTL = process.env.JWT_EXPIRES_IN || '7d'

function getSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET n\'est pas défini.')
  return secret
}

export function signToken(user) {
  return jwt.sign({ sub: user.id }, getSecret(), { expiresIn: TOKEN_TTL })
}

// Returns the user id, or null if the token is missing, forged or expired.
export function verifyToken(token) {
  try {
    return jwt.verify(token, getSecret()).sub ?? null
  } catch {
    return null
  }
}
