export type Role = 'admin' | 'membre_bureau' | 'membre_actif' | 'membre_senior'

export const ROLES = {
  ADMIN: 'admin',
  MEMBRE_BUREAU: 'membre_bureau',
  MEMBRE_ACTIF: 'membre_actif',
  MEMBRE_SENIOR: 'membre_senior',
} as const

/**
 * Returns true if the user role has Bureau or Admin privileges.
 * Accepts legacy role aliases ('bureau', 'pole_lead') for smooth backwards compatibility.
 */
export function isBureauOrAdmin(role?: string | null): boolean {
  if (!role) return false
  return role === 'admin' || role === 'membre_bureau' || role === 'bureau' || role === 'pole_lead'
}

/**
 * Returns true if the user role is an Admin.
 */
export function isAdmin(role?: string | null): boolean {
  return role === 'admin'
}

/**
 * Returns a user-friendly label for any role or member status.
 */
export function getRoleLabel(role?: string | null, statutMembre?: string | null): string {
  const normRole = role?.toLowerCase()
  const normStatut = statutMembre?.toLowerCase()

  if (normRole === 'admin') return 'Administrateur'
  if (normRole === 'membre_bureau' || normRole === 'bureau' || normRole === 'pole_lead') return 'Membre du Bureau'
  if (normRole === 'membre_senior' || normRole === 'senior' || normRole === 'senior_member' || normStatut === 'senior') return 'Membre Senior'
  if (normStatut === 'alumni') return 'Alumni'

  return 'Membre Actif'
}

