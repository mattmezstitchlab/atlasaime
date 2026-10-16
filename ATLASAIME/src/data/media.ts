import type { Fragment } from '../types';

const px = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200`;

/** Fragments du design d'origine, reliés à de vraies sources (sites GitHub, médias Pexels). */
export const MEDIA_FRAGMENTS: Fragment[] = [
  {
    id: 'm:lecteur-audio',
    kind: 'audio',
    name: 'Lecteur audio',
    subtitle: 'sillage-soundtrack.vercel.app · iframe · recadré',
    source: 'media',
    url: 'https://sillage-soundtrack.vercel.app',
    repo: 'SILLAGE',
    headline: 'Sillage — La bande-son de votre histoire',
    starred: true,
  },
  {
    id: 'm:timeline-1972',
    kind: 'timeline',
    name: 'Timeline 1972',
    subtitle: 'github/AIME-TIMELINE · zone 342×186',
    source: 'media',
    repo: 'AIME-TIMELINE',
  },
  {
    id: 'm:calendrier',
    kind: 'calendar',
    name: 'Calendrier',
    subtitle: 'dispoo-app.vercel.app · aperçu statique',
    source: 'media',
    url: 'https://dispoo-app.vercel.app',
    repo: 'dispoo-app',
  },
  { id: 'm:hero-svg', kind: 'svg', name: 'Hero.svg', subtitle: 'upload · vectoriel · 1,2 Mo', source: 'media' },
  {
    id: 'm:teaser-mp4',
    kind: 'video',
    name: 'Teaser.mp4',
    subtitle: 'cdn/medias · vidéo · 00:10',
    source: 'media',
    url: 'https://videos.pexels.com/video-files/35323752/14966147_3840_2160_24fps.mp4',
    poster:
      'https://images.pexels.com/videos/35323752/falling-groom-get-ready-perfume-whit-shoes-35323752.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200',
    credit: 'Naresh Babu · Pexels',
  },
  { id: 'm:scene-glb', kind: 'model3d', name: 'Scene.glb', subtitle: 'upload · glTF · 3D', source: 'media' },
  {
    id: 'm:audioplayer-tsx',
    kind: 'code',
    name: 'AudioPlayer.tsx',
    subtitle: 'github/atlas-ui · code réutilisable',
    source: 'media',
    badge: 'CODE',
    starred: true,
  },
  { id: 'm:dossier-pdf', kind: 'pdf', name: 'Dossier.pdf', subtitle: 'upload · 12 pages', source: 'media' },

  // Photographies réelles (Pexels) — univers broderie & mariage
  { id: 'm:aiguille', kind: 'image', name: 'Aiguille & fil.jpg', subtitle: 'pexels · macro · 6240 px', source: 'media', url: px(40175101), credit: 'Washington Gama · Pexels' },
  { id: 'm:broderie-main', kind: 'image', name: 'Broderie main.jpg', subtitle: 'pexels · motifs traditionnels', source: 'media', url: px(5313213), credit: 'Benjamin White · Pexels' },
  { id: 'm:alliances', kind: 'image', name: 'Alliances.jpg', subtitle: 'pexels · or & émeraude', source: 'media', url: px(38781489), credit: 'Karl Forterre · Pexels' },
  { id: 'm:escarpins', kind: 'image', name: 'Escarpins N&B.jpg', subtitle: 'pexels · noir & blanc', source: 'media', url: px(32496675), credit: 'NUDE Nahum · Pexels' },
  { id: 'm:fil-lumiere', kind: 'image', name: 'Fil, lumière.jpg', subtitle: 'pexels · lumière naturelle', source: 'media', url: px(30285188), credit: 'Arturo A · Pexels' },
  { id: 'm:broderie-couleur', kind: 'image', name: 'Broderie colorée.jpg', subtitle: 'pexels · fils jaunes & bleus', source: 'media', url: px(9314608), credit: 'lia works · Pexels' },
  { id: 'm:chas', kind: 'image', name: 'Chas.jpg', subtitle: 'pexels · précision', source: 'media', url: px(5452905), credit: 'Rocco Stoppoloni · Pexels' },
];

export const MEDIA_MAP = new Map(MEDIA_FRAGMENTS.map((f) => [f.id, f]));
