import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)
const KEY_LENGTH = 64

// Stored as "scrypt$<salt hex>$<hash hex>" so the algorithm can evolve later.
export async function hashPassword(password) {
  const salt = randomBytes(16)
  const hash = await scryptAsync(password, salt, KEY_LENGTH)
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`
}

export async function verifyPassword(password, stored) {
  const [algo, saltHex, hashHex] = String(stored).split('$')
  if (algo !== 'scrypt' || !saltHex || !hashHex) return false

  const expected = Buffer.from(hashHex, 'hex')
  const actual = await scryptAsync(password, Buffer.from(saltHex, 'hex'), expected.length)
  return timingSafeEqual(actual, expected)
}

// Hash computed once so logins for unknown emails take as long as real
// ones, instead of revealing which emails have an account.
const DUMMY_HASH = hashPassword('dummy-password-for-timing')

export async function burnPasswordCheck(password) {
  await verifyPassword(password, await DUMMY_HASH)
  return false
}
