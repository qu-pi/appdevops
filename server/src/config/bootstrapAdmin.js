import * as UserModel from '../models/userModel.js'

// Guarantees an admin account exists, from ADMIN_EMAIL / ADMIN_PASSWORD.
// Creates it on first boot, or promotes an existing account with that email.
// The password is only used at creation: changing ADMIN_PASSWORD later does
// not overwrite the stored one.
export async function bootstrapAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env
  if (!ADMIN_EMAIL) return

  const existing = await UserModel.findByEmailWithPassword(ADMIN_EMAIL)
  if (existing) {
    if (existing.role !== UserModel.Role.ADMIN) {
      await UserModel.setRole(existing.id, UserModel.Role.ADMIN)
      console.log(`Compte ${existing.email} promu administrateur.`)
    }
    return
  }

  if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
    console.warn('ADMIN_EMAIL défini mais ADMIN_PASSWORD absent ou trop court (8 caractères min.) : admin non créé.')
    return
  }

  await UserModel.create({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: UserModel.Role.ADMIN })
  console.log(`Compte administrateur ${UserModel.normalizeEmail(ADMIN_EMAIL)} créé.`)
}
