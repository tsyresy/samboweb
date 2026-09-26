import type { MembershipCategory } from '@/types'

export const CATEGORY_LABELS: Record<MembershipCategory, string> = {
  membre_standard: 'Membre standard',
  membre_bureau: 'Membre de bureau',
  sojabe: 'Sojabe',
  partenaire: 'Partenaire',
  sponsor: 'Sponsor',
}

export function categoryLabel(category: string) {
  return CATEGORY_LABELS[category as MembershipCategory] ?? category
}
