import { REPO_SNAPSHOT, collectionOf } from './repos';

// Editorial copy grounded in the public snapshot; never a claim of verified functionality.
const concepts: Record<string, string> = {
  POINTZERO: 'Un point de départ commun pour apprendre, créer, comprendre et transmettre. Le concept explore la continuité entre plusieurs studios plutôt que la multiplication d’outils isolés.',
  SILLAGE: 'Donner une place au son dans le récit d’une histoire : une bande-son comme fil conducteur entre souvenirs, atmosphères et moments.',
  RELIA: 'Rendre visibles les liens documentés entre personnes, œuvres, lieux et institutions, en conservant les sources, les dates et les limites de chaque relation.',
  RIPPLECIRCLE: 'Faire d’un événement un cercle vivant : personnes, moments, programme et musique réunis dans une interface circulaire.',
  MONMARIAGE: 'Réunir une journée de mariage au même endroit. Une exploration de la manière de rendre le déroulé d’un événement plus lisible et partagé.',
  BRODEZ: 'Un studio de broderie numérique : explorer la rencontre entre travail textile, création visuelle et interface.',
  UNIVERSALBRODERIE: 'Un atelier consacré à la broderie, à ses gestes et à ses possibilités créatives. Une piste de dialogue entre matière et outils numériques.',
  radiopink: 'Une radio dans l’univers du mariage : une piste pour donner une identité sonore à l’événement et accompagner ses moments.',
  ColorCard: 'Explorer des cartes universelles personnalisables, avec des yeux interactifs. Un registre visuel qui joue avec l’identité et la présence.',
  'dispoo-app': 'Trouver un moment commun sans multiplier les échanges : proposer des créneaux, partager un lien et recueillir les votes des invités.',
  AIMEPROJET: 'Un espace pour rapprocher informations, créations et kits de préparation. Le concept cherche à rendre les liens entre projets plus faciles à retrouver.',
  lemondeaimedesignsystem: 'Construire un langage visuel commun : fondations et composants pour faire évoluer progressivement les interfaces sans perdre leur cohérence.',
};
const featured = ['POINTZERO','SILLAGE','RELIA','RIPPLECIRCLE','MONMARIAGE','BRODEZ','ColorCard','dispoo-app'];
export const PORTFOLIO_PROJECTS = REPO_SNAPSHOT.filter(r => r.size > 0).map(repo => ({
  repo,
  domain: collectionOf(repo),
  concept: concepts[repo.name] || (repo.siteDescription.length > 20 ? repo.siteDescription : '') || (repo.description.length > 20 ? repo.description : '') || (repo.siteTitle ? `Exploration présentée dans le dépôt sous le titre « ${repo.siteTitle} ». Le concept détaillé reste à documenter.` : 'Projet exploratoire : le concept détaillé reste à documenter dans les sources publiques.'),
  featured: featured.includes(repo.name),
})).sort((a,b) => {
  const ai = featured.indexOf(a.repo.name), bi = featured.indexOf(b.repo.name);
  return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi) || a.repo.name.localeCompare(b.repo.name);
});
