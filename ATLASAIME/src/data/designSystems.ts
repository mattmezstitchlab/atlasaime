/** Design systems relevés le 16 oct. 2026.
 *  « documenté » = page ou variables CSS lues.
 *  « extrait » = couleurs trouvées dans le CSS publié, sans spécimen complet.
 *  « absent » = aucun site, donc aucun système visible. */

export type SystemStatus = 'documente' | 'extrait' | 'absent' | 'production';

export interface Swatch {
  name: string;
  hex: string;
  role: string;
}

export interface TypeFace {
  role: string;
  name: string;
  sample: string;
}

export interface DesignSystem {
  id: string;
  name: string;
  project: string;
  url?: string;
  repo?: string;
  status: SystemStatus;
  summary: string;
  verified: string;
  fonts: TypeFace[];
  colors: Swatch[];
  spacing: number[];
  radius: string;
  components: string[];
}

export const DOCUMENTED_SYSTEMS: DesignSystem[] = [
  {
    id: 'lemondeaime',
    name: 'LE MONDE AIME®',
    project: 'lemondeaimedesignsystem',
    repo: 'lemondeaimedesignsystem',
    url: 'https://lemondeaimedesignsystem.vercel.app',
    status: 'documente',
    summary: 'Fondations, univers (mariage, studio, musique) et composants. Référence de la refonte Matt Mez Sax.',
    verified: 'Page publiée lue le 16 oct. 2026, confirmée par design-system.css.',
    fonts: [
      { role: 'Titres', name: 'Manrope', sample: 'Le digital, l’émotion, sur mesure.' },
      { role: 'Texte', name: 'DM Sans', sample: 'Une expérience cohérente et durable.' },
    ],
    colors: [
      { name: 'Bleu pétrole', hex: '#164C70', role: 'Principal' },
      { name: 'Turquoise', hex: '#12B5B4', role: 'Accent' },
      { name: 'Écume', hex: '#B0E4D0', role: 'Univers' },
      { name: 'Focus', hex: '#127E83', role: 'Focus' },
      { name: 'Encre', hex: '#161616', role: 'Texte fort' },
      { name: 'Gris texte', hex: '#62666B', role: 'Secondaire' },
      { name: 'Sable', hex: '#F7F8F8', role: 'Fond' },
      { name: 'Filet', hex: '#E5E7EB', role: 'Bordure' },
      { name: 'Erreur', hex: '#96392E', role: 'Alerte' },
    ],
    spacing: [4, 8, 16, 24, 48],
    radius: '12 px cartes · 24 px assistant · boutons 44 px',
    components: ['Bouton', 'Chip', 'Champ', 'Carte', 'Assistant', 'Hero vidéo', 'Carrousel'],
  },
  {
    id: 'base44-mattmezsax',
    name: 'Matt Mez Sax · production',
    project: 'Base44',
    url: 'https://mattmezsax.base44.app',
    status: 'production',
    summary: 'Le site de devis est en ligne. Il reprend les tokens --aime-* du design system. L’iframe est refusée par le site.',
    verified: 'CSS publié lu le 16 oct. 2026. X-Frame-Options: DENY. Polices chargées : Manrope, DM Sans, Space Grotesk, Inter.',
    fonts: [
      { role: 'Titres', name: 'Manrope', sample: 'Prestations musicales' },
      { role: 'Texte', name: 'DM Sans', sample: 'Demande de devis en ligne.' },
      { role: 'Aussi chargées', name: 'Space Grotesk · Inter', sample: 'Présentes, non confirmées à l’écran.' },
    ],
    colors: [
      { name: 'Encre', hex: '#161616', role: '--aime-ink' },
      { name: 'Pétrole', hex: '#164C70', role: '--aime-petrol' },
      { name: 'Turquoise', hex: '#12B5B4', role: '--aime-turquoise' },
      { name: 'Écume', hex: '#B0E4D0', role: '--aime-seafoam' },
      { name: 'Focus', hex: '#127E83', role: '--aime-focus' },
      { name: 'Copie', hex: '#62666B', role: '--aime-copy' },
      { name: 'Sable', hex: '#F7F8F8', role: '--aime-surface-subtle' },
      { name: 'Erreur', hex: '#96392E', role: '--aime-erreur' },
    ],
    spacing: [4, 8, 16, 24, 48],
    radius: '0,5 rem de base (Tailwind) · tokens AIME par-dessus',
    components: ['Page devis', 'Vérification de date', 'Formulaire'],
  },
  {
    id: 'atlas',
    name: 'ATLAS',
    project: 'Cet espace',
    status: 'documente',
    summary: 'Le système de ce compositeur : noir, papier, une sérif pour les titres, une monospace pour les mesures.',
    verified: 'Tokens de l’interface actuelle.',
    fonts: [
      { role: 'Interface', name: 'Inter', sample: 'Composition · Mémoire active' },
      { role: 'Titres', name: 'Instrument Serif', sample: 'Composez une page.' },
      { role: 'Mesures', name: 'JetBrains Mono', sample: '342 × 186 · 86 %' },
    ],
    colors: [
      { name: 'Encre', hex: '#111827', role: 'Texte' },
      { name: 'Noir', hex: '#000000', role: 'Action' },
      { name: 'Papier', hex: '#FAFBFC', role: 'Fond' },
      { name: 'Filet', hex: '#E5E7EB', role: 'Bordure' },
      { name: 'Gris', hex: '#6B7280', role: 'Secondaire' },
      { name: 'Point', hex: '#D4D4D8', role: 'Grille' },
    ],
    spacing: [4, 8, 12, 16, 24],
    radius: '14 px cellules · 16 px cartes · pilules pour les statuts',
    components: ['Cellule', 'Inspecteur', 'Bibliothèque', 'Recadrage', 'Graphe'],
  },
  {
    id: 'sillage',
    name: 'Sillage',
    project: 'SILLAGE',
    repo: 'SILLAGE',
    url: 'https://sillage-soundtrack.vercel.app',
    status: 'extrait',
    summary: 'Bande-son. Palette chaude et un vert d’eau, titrage Outfit.',
    verified: 'Couleurs et police extraites du CSS publié.',
    fonts: [{ role: 'Titres', name: 'Outfit', sample: 'La bande-son de votre histoire' }],
    colors: [
      { name: 'Encre chaude', hex: '#4A443A', role: 'Texte' },
      { name: 'Lagon', hex: '#14B8A6', role: 'Accent' },
      { name: 'Blanc', hex: '#FFFFFF', role: 'Fond' },
    ],
    spacing: [8, 16, 24],
    radius: 'non documenté',
    components: ['Lecteur', 'Piste', 'Couverture'],
  },
  {
    id: 'dispoo',
    name: 'Dispoo',
    project: 'dispoo-app',
    repo: 'dispoo-app',
    url: 'https://dispoo-app.vercel.app',
    status: 'extrait',
    summary: 'Outil de créneaux. Rouge signal, or, papier chaud.',
    verified: 'Couleurs extraites du CSS publié.',
    fonts: [{ role: 'Interface', name: 'Sans système', sample: 'Le créneau où tout le monde est là' }],
    colors: [
      { name: 'Rouge', hex: '#C8102E', role: 'Action' },
      { name: 'Or', hex: '#D9A441', role: 'Accent' },
      { name: 'Papier', hex: '#ECEAE7', role: 'Surface' },
      { name: 'Blush', hex: '#FFF7F8', role: 'Fond teinté' },
    ],
    spacing: [8, 16, 24],
    radius: 'non documenté',
    components: ['Créneau', 'Vote', 'Lien de partage'],
  },
  {
    id: 'radiopink',
    name: 'Radio Pink',
    project: 'radiopink',
    repo: 'radiopink',
    url: 'https://radiopink.vercel.app',
    status: 'extrait',
    summary: 'Radio de mariage. Rose vif, nuit, touches cyan et ambre.',
    verified: 'Couleurs extraites du HTML publié. Feuille CSS séparée non trouvée.',
    fonts: [{ role: 'Interface', name: 'Non déclarée', sample: 'Mon Mariage · Radio FM' }],
    colors: [
      { name: 'Rose', hex: '#FF4F9A', role: 'Marque' },
      { name: 'Nuit', hex: '#23252D', role: 'Fond' },
      { name: 'Alerte', hex: '#FF3B30', role: 'Signal' },
      { name: 'Cyan', hex: '#7AD7FF', role: 'Accent' },
      { name: 'Ambre', hex: '#FFC46B', role: 'Accent' },
    ],
    spacing: [8, 16],
    radius: 'non documenté',
    components: ['Lecteur FM', 'Piste'],
  },
  {
    id: 'brodez',
    name: 'BRODEZ',
    project: 'BRODEZ',
    repo: 'BRODEZ',
    url: 'https://brodez-topaz.vercel.app',
    status: 'extrait',
    summary: 'Atelier de broderie. Lin, fil rose, Inter.',
    verified: 'Couleurs et police extraites du CSS publié.',
    fonts: [{ role: 'Interface', name: 'Inter', sample: 'Embroidery Studio' }],
    colors: [
      { name: 'Fil', hex: '#FF1688', role: 'Accent' },
      { name: 'Lin', hex: '#F4F1EC', role: 'Fond' },
      { name: 'Fil gris', hex: '#D7D1C8', role: 'Bordure' },
      { name: 'Encre', hex: '#111111', role: 'Texte' },
    ],
    spacing: [8, 16, 24],
    radius: 'non documenté',
    components: ['Motif', 'Carte atelier'],
  },
  {
    id: 'composer',
    name: 'AIME Composer',
    project: 'AIME-COMPOSER',
    repo: 'AIME-COMPOSER',
    url: 'https://aime-composer.vercel.app',
    status: 'extrait',
    summary: 'Moteur de composition. Nuit, bleu, vert, ambre. Variables --aime-font-*.',
    verified: 'Couleurs extraites du CSS publié.',
    fonts: [{ role: 'Interface', name: 'Variable --aime-font-sans', sample: 'Composer, relier, publier' }],
    colors: [
      { name: 'Nuit', hex: '#08080A', role: 'Fond' },
      { name: 'Bleu', hex: '#0A84FF', role: 'Accent' },
      { name: 'Vert', hex: '#149461', role: 'Succès' },
      { name: 'Ambre', hex: '#B57208', role: 'Alerte' },
      { name: 'Pierre', hex: '#C9C8C4', role: 'Texte' },
    ],
    spacing: [8, 16, 24],
    radius: 'non documenté',
    components: ['Piste', 'Nœud', 'Transport'],
  },
];

/** Palettes seulement — pas un spécimen complet. */
export const EXTRACTED_PALETTES: { repo: string; colors: string[]; font?: string }[] = [
  { repo: 'AIMEPROJET', colors: ['#0071E3', '#F5F5F7', '#86868B', '#777780'] },
  { repo: 'POINTZERO', colors: ['#111114', '#0A84FF', '#30D158', '#FFFFFF'] },
  { repo: 'AIME-METAMORPHOSE', colors: ['#222222', '#777777', '#DDDDDD', '#FFFFFF'], font: 'Georgia' },
  { repo: 'AIMELEMONDEAIME', colors: ['#111110', '#F5F5F4', '#F9F9F8'] },
  { repo: 'RELIA', colors: ['#101828', '#0A84FF', '#64B5FF', '#F2F2F7'], font: 'Georgia' },
  { repo: 'ColorCard', colors: ['#20202C', '#1E1E2C', '#CCCCCC', '#000000'] },
  { repo: 'MONMARIAGE', colors: ['#FF2E9A', '#FF7AB8', '#050506', '#FFFFFF'] },
  { repo: 'WORLDWEDDING', colors: ['#FF2B8A', '#F7F5EF', '#181818'] },
  { repo: 'SYSTEMATLAS', colors: ['#E91E8C', '#0A0A0B', '#F5F5F7', '#4A4A55'] },
  { repo: 'UNIVERSALBRODERIE', colors: ['#FFFEFA', '#E9E7DF', '#92988F', '#F6F3EC'] },
  { repo: 'MINISITEWEDDING', colors: ['#05060C', '#0B0C12', '#0C0E18', '#FFFFFF'] },
  { repo: 'byaime-one-page', colors: ['#171410', '#08080A', '#B42318', '#FFFFFF'] },
];

export const systemForRepo = (repo: string) =>
  DOCUMENTED_SYSTEMS.find((s) => s.repo === repo || s.project === repo);

export const paletteForRepo = (repo: string) => EXTRACTED_PALETTES.find((p) => p.repo === repo);
