/**
 * Source: docs/universite-antananarivo-etablissements-mentions-parcours.md
 * (recherche du 23/09/2026 — à vérifier auprès de chaque scolarité, les
 * habilitations du MESupReS changent chaque année).
 */
export interface Establishment {
  name: string
  sigle?: string
  mentions: string[]
}

export const UNIVERSITY_ESTABLISHMENTS: Establishment[] = [
  {
    name: 'Faculté de Droit et des Sciences Politiques',
    sigle: 'FDSP',
    mentions: ['Droit', 'Sciences Politiques', "Sciences et Techniques de l'Information et de la Communication"],
  },
  {
    name: "Faculté d'Économie, de Gestion et de Sociologie",
    sigle: 'EGS',
    mentions: ['Économie', 'Gestion', 'Sociologie'],
  },
  {
    name: 'Faculté des Lettres et Sciences Humaines',
    sigle: 'FLSH',
    mentions: [
      'Anthropologie',
      'Communication, Médias, Médiation, Innovation et Développement Local',
      'Communication, Médiation, Médias et Organisation',
      'Études Anglophones',
      'Études Françaises et Francophones',
      'Études Germaniques',
      'Études Malgaches',
      'Études Plurilingues et Interculturelles',
      'Géographie',
      'Histoire',
      'Langues Étrangères',
      'Philosophie',
      'Psychologie Sociale et Interculturelle (PSI)',
      'Sciences, Savoirs et Sociétés en Développement',
      'Science du Tourisme',
    ],
  },
  {
    name: 'Faculté de Médecine',
    mentions: [
      'Médecine Humaine',
      'Pharmacie',
      'Médecine Vétérinaire',
      'Sciences Paramédicales — Anesthésie',
      'Sciences Paramédicales — Électroradiologie',
      'Sciences Paramédicales — Ergothérapie',
      'Sciences Paramédicales — Maïeutique',
      'Sciences Paramédicales — Massokinésithérapie',
      'Sciences Paramédicales — Sciences Infirmières',
      "Sciences Paramédicales — Technique d'Appareillage Orthopédique",
      'Sciences Paramédicales — Technique de Laboratoire',
    ],
  },
  {
    name: 'Faculté des Sciences',
    mentions: [
      'Anthropobiologie et Développement Durable',
      'Bassins Sédimentaires, Évolution, Conservation (BEC)',
      'Biochimie Fondamentale et Appliquée (BFA)',
      'Biologie et Écologie Végétales (BEV)',
      'Chimie',
      'Électronique',
      'Entomologie',
      'Mathématiques et Informatique',
      'Physiologie Animale, Pharmacologie et Cosmétologie (PPC)',
      'Physique et Applications',
      'Procédés et Écologie Industrielle (PEI)',
      'Sciences de la Terre et de l’Environnement (STE)',
      'Zoologie et Biodiversité Animale (ZBA)',
    ],
  },
  {
    name: 'École Normale Supérieure',
    sigle: 'ENS',
    mentions: [
      "Administration de l'Éducation (ADMED)",
      "EAD-HGEC — Histoire, Géographie et Éducation à la Citoyenneté",
      'EAD-SEM — Sciences Expérimentales et Mathématiques',
      'EAD-APSA — Activités Physiques, Sportives et Artistiques',
      'EAD Langues et Philosophie',
    ],
  },
  {
    name: "École Supérieure Polytechnique d'Antananarivo",
    sigle: 'ESPA',
    mentions: [
      'Bâtiment et Travaux Publics (BTP)',
      'Hydraulique',
      'Urbanisme, Architecture et Génie Civil',
      'Géologie',
      'Mines et Pétrole',
      'Télécommunication',
      'Électronique',
      'Génie Électrique',
      'Génie Mécanique et Industriel',
      'Sciences et Ingénierie des Matériaux (SIM)',
      'Ingénierie des Systèmes Avancés (ISA)',
      'Génie Chimique et Procédés',
      'Industries Agroalimentaires',
      'Génie Rural',
      'Information Géographique et Aménagement du Territoire (IGAT)',
      'Météorologie',
    ],
  },
  {
    name: 'École Supérieure des Sciences Agronomiques',
    sigle: 'ESSA',
    mentions: [
      'Sciences Agronomiques et Environnementales',
      'Agriculture Tropicale pour le Développement Durable',
      'Agro-Management',
      'Foresterie et Environnement',
      'Industries Agro-Alimentaires',
      'Agroécologie, Biodiversité et Changement climatique',
      'Sciences Animales',
    ],
  },
  {
    name: "Institut d'Enseignement Supérieur d'Antsirabe Vakinankaratra",
    sigle: 'IESAV',
    mentions: [
      'Agronomie et Agroalimentaire / Agro-Management',
      'Communication',
      'Électronique',
      'Environnement',
      'Génie Civil',
      'Génie Industriel',
      'Génie Minier',
      'Génie Rural',
      'Gestion / Sciences de Gestion',
      "Sciences et Techniques de l'Information et de la Communication",
      'Sciences et Ingénierie des Matériaux',
      'Télécommunications',
    ],
  },
  {
    name: "Institut d'Enseignement Supérieur de Soavinandriana Itasy",
    sigle: 'IESSI',
    mentions: [
      'Agro-Écologie',
      'Bâtiments et Travaux Publics',
      'Communication (Éco-Tourisme, Territoriale, Médias et Organisation)',
      'Eau et Environnement / Gestion de l’Environnement',
      'Énergie Renouvelable',
      'Génie Minier / Mines et Environnement',
      'Génie Rural',
      'Gestion / Gestion et Valorisation des Ressources Naturelles',
      'Informatique',
      'Mécanisation Agricole',
      'Télécommunication',
      'Tourisme',
      'Transformation Agroalimentaire',
    ],
  },
]

export const STUDY_LEVELS = ['L1', 'L2', 'L3', 'M1', 'M2', 'Doctorat'] as const
