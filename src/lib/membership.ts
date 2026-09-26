import type { AccessLevel, MembershipCategory, ValidationStatus } from '@/types'

export const CATEGORY_LABELS: Record<MembershipCategory, string> = {
  membre_standard: 'Membre standard',
  membre_bureau: 'Membre de bureau',
  sojabe: 'Sojabe',
  partenaire: 'Partenaire',
  sponsor: 'Sponsor',
}

export const VALIDATION_STATUS_LABELS: Record<ValidationStatus, string> = {
  en_attente: 'En attente de validation',
  valide: 'Validé',
  refuse: 'Refusé',
  suspendu: 'Suspendu',
}

export const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  membre: 'Membre',
  responsable: 'Responsable',
  administrateur: 'Administrateur',
}

export function categoryLabel(category: string) {
  return CATEGORY_LABELS[category as MembershipCategory] ?? category
}
