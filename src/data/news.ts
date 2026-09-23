/**
 * Source: docs/Images and texte for actus et exploit.txt — posts already
 * published by the association, mirrored on Cloudinary. Real content, not
 * placeholder copy. Until the `news` table (Phase 3) exists and an admin
 * content editor is built, this is the static source of truth for the
 * public site.
 */
export interface NewsPost {
  slug: string
  title: string
  excerpt: string
  body: string
  images: string[]
}

export const NEWS_POSTS: NewsPost[] = [
  {
    slug: 'marovoay-fora-zaza-faobe-salon-etudiants',
    title: "Marovoay : circoncision collective et Salon des Étudiants",
    excerpt:
      "288 enfants circoncis et 122 futurs bacheliers accompagnés : deux événements majeurs organisés par SAMBO dans le district de Marovoay, avec le soutien de nombreux partenaires.",
    body: `L'Association S.A.M.BO (Sata sy Andrin'ny Mpianatr'i Boeny), sous la direction du Président Kiki Idriss et de son équipe, a brillamment organisé au district de Marovoay, région Boeny, deux événements majeurs :

👉 La circoncision collective des enfants (Fora Zaza Faobe)
👉 Le Salon des Étudiants

Ces manifestations se sont déroulées avec la collaboration des médecins, des autorités locales, ainsi que de nombreuses personnalités notables.

Les habitants ont exprimé leur joie et leur gratitude, ayant constaté une véritable réduction des charges financières. En effet, 288 garçons ont été circoncis lors de l'événement, le plus âgé ayant 26 ans, le plus jeune 3 ans.

De leur côté, 122 futurs nouveaux bacheliers et leurs parents ont assisté avec enthousiasme au Salon des Étudiants, se sentant pleinement soutenus, encouragés et rassurés quant à leur avenir dans l'enseignement supérieur.

Nos plus vifs remerciements vont à tous nos soutiens et partenaires, aînés de l'association, alliés au niveau provincial de Mahajanga, et à toute l'équipe de l'hôpital de Marovoay qui a participé activement.

Ensemble, pour Marovoay.
Association S.A.M.BO`,
    images: [
      'https://res.cloudinary.com/j9i1lkuc/image/upload/v1790173684/pst-0004-1.jpg',
      'https://res.cloudinary.com/j9i1lkuc/image/upload/v1790173685/pst-0004-2.jpg',
      'https://res.cloudinary.com/j9i1lkuc/image/upload/v1790173686/pst-0004-3.jpg',
    ],
  },
  {
    slug: 'tournoi-football-juniors-fizamami',
    title: 'Tournoi de football des juniors du FI.ZA.MA.MI',
    excerpt:
      "Une journée placée sous le signe du sport, de la jeunesse et du vivre-ensemble. Retour sur un tournoi disputé avec sérieux, fair-play et solidarité entre les équipes.",
    body: `Le tournoi de football des juniors du FI.ZA.MA.MI, qui s'est tenu dimanche dernier, s'est achevé de la plus belle des manières, couronnant une journée placée sous le signe du sport, de la jeunesse et du vivre-ensemble. Bien plus qu'une simple succession de rencontres, cette compétition a véritablement constitué un moment fort, où l'on a pu mesurer l'intensité des matchs, la combativité des équipes et, surtout, l'esprit de solidarité qui n'a cessé d'animer les participants.

Le tournoi a tenu toutes ses promesses, tant par la qualité du jeu affiché que par l'ambiance fraternelle qui l'a entouré. Les équipes se sont affrontées avec sérieux, détermination et respect, offrant des rencontres disputées, pleines d'émotion et de fair-play.

Résultats :
Sofia 2 – 1 Betsiboka
Melaky 3 – 2 Boeny

Il convient de saluer non seulement les vainqueurs, mais aussi toutes les équipes participantes, les encadreurs, les organisateurs et les supporters qui ont contribué à la réussite de cet événement.`,
    images: [
      'https://res.cloudinary.com/j9i1lkuc/image/upload/v1790174355/pst-0006-1.jpg',
      'https://res.cloudinary.com/j9i1lkuc/image/upload/v1790174356/pst-0006-2.jpg',
      'https://res.cloudinary.com/j9i1lkuc/image/upload/v1790174356/pst-0006-3.jpg',
      'https://res.cloudinary.com/j9i1lkuc/image/upload/v1790174358/pst-0006-4.jpg',
      'https://res.cloudinary.com/j9i1lkuc/image/upload/v1790174360/pst-0006-5.jpg',
      'https://res.cloudinary.com/j9i1lkuc/image/upload/v1790174363/pst-0006-6.jpg',
    ],
  },
  {
    slug: 'soutien-etudiants-musulmans',
    title: 'Un geste de solidarité pour les étudiants musulmans',
    excerpt:
      "Les étudiants musulmans en difficulté ont reçu une aide de l'association en ce mois sacré, avec le soutien du Pr CHAMINAH Loullah.",
    body: `Les étudiants musulmans en difficulté ont bénéficié d'une aide hier. Nous remercions infiniment le Pr CHAMINAH Loullah, car ils sont heureux et soulagés de leurs difficultés en ce mois sacré. Merci, Professeur.`,
    images: ['https://res.cloudinary.com/j9i1lkuc/image/upload/v1790173864/pst-0005-1.jpg'],
  },
  {
    slug: 'felicitations-president-commissaire-divisionnaire',
    title: 'Félicitations à notre Président, élevé au grade de Commissaire divisionnaire',
    excerpt:
      "L'association adresse ses plus sincères félicitations à son Président pour cette distinction qui consacre un parcours exemplaire au service de l'État.",
    body: `Monsieur le Président,

Nous, le Fikambanan'ny Mpianatra SAMBO (Sata sy Andrin'ny Mpianatr'i Boeny), avons l'honneur de vous adresser nos plus sincères félicitations à l'occasion de votre élévation au grade de Commissaire divisionnaire.

Cette distinction consacre un parcours exemplaire, marqué par l'engagement, la compétence et le dévouement au service de l'État. À juste titre, le fruit était mûr, et cette promotion en constitue l'aboutissement naturel.

Nous sommes heureux de pouvoir partager cette joie avec vous et de vous exprimer notre profond respect.`,
    images: ['https://res.cloudinary.com/j9i1lkuc/image/upload/v1790173392/pst-0003-1.jpg'],
  },
  {
    slug: 'anniversaire-secretaire-general',
    title: 'Joyeux anniversaire à notre Secrétaire Général',
    excerpt:
      "L'association adresse ses vœux les plus chaleureux à son Secrétaire Général : santé, réussite et prospérité.",
    body: `C'est avec une grande joie que nous vous adressons nos sincères salutations, Monsieur le Secrétaire Général de SAMBO, à l'occasion de votre anniversaire. 🎂🎉

Nous vous souhaitons santé, réussite et prospérité dans toutes vos responsabilités.`,
    images: ['https://res.cloudinary.com/j9i1lkuc/image/upload/v1790173249/pst-0002-1.jpg'],
  },
  {
    slug: 'hommage-maman-sixe',
    title: 'Hommage à Maman n’y Name Sixe',
    excerpt:
      "L'association exprime sa tristesse suite au décès d'une personne proche qui a longtemps soutenu et défendu SAMBO.",
    body: `🕊️ COMMUNIQUÉ DE GRANDE TRISTESSE

Au nom de l'Association SAMBO (Santa sy Andriny ny Mpianatra Boeny), nous exprimons notre immense tristesse suite au décès de Maman n'y Name Sixe, artiste.

Elle était une personne proche, l'une de celles qui ont soutenu et défendu le SAMBO. Nous n'oublierons ni sa bonté, ni son amour, ni tout le bien qu'elle a laissé en souvenir.

Repose en paix, Maman Sixe. 🕊️🤍

Nous adressons nos sincères condoléances et souhaitons un plein réconfort à la famille, aux proches et amis, ainsi qu'à toutes les personnes éprouvées par ce deuil.

SAMBO — Santa sy Andriny ny Mpianatra Boeny

Une veillée se tient au domicile d'Ambohipo.`,
    images: ['https://res.cloudinary.com/j9i1lkuc/image/upload/v1790173095/pst-0001-1.jpg'],
  },
]
