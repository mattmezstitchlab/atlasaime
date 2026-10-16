import type { RepoSnapshot } from './repos';
import { githubRepoUrl } from './repos';

/* ------------------------------------------------------------------ */
/* Reste à faire par projet — tiré de documents publics lus dans les   */
/* dépôts. Chaque bloc cite sa source ; rien n'est deviné.             */
/* ------------------------------------------------------------------ */

export interface RemainingWork {
  repo: string;
  source: string;
  sourceLabel: string;
  verified: string;
  items: string[];
  broken?: string[];
}

export const REMAINING_WORK: RemainingWork[] = [
  {
    repo: 'POINTZERO',
    source: 'docs/AIME-ARCHITECTURE-MERE-AUDIT.md',
    sourceLabel: 'Audit d’architecture mère (15 oct. 2026)',
    verified: 'Section « Limitations à traiter plus tard » et recette avant publication.',
    items: [
      'Fusionner la PR #38 (empilée sur #37 et #36) après validation du propriétaire',
      'Recette : npm run verify, preview Vercel du SHA exact, test des 7 familles de routes sur iPhone, iPad et bureau',
      'Créer un vrai versionnement éditorial serveur (historique, sources, documents privés/publics)',
      'Relier Univers, Studios et moteurs en multi-utilisateur',
      'Ajouter une administration pour chaque champ des 13 fiches Studios',
      'Générer des métadonnées OpenGraph par route (SSR ou statique)',
    ],
  },
  {
    repo: 'AIME-COMPOSER',
    source: 'AUDIT/PROJECT-VIEWER-SPEC.md',
    sourceLabel: 'Spécification du Project Viewer',
    verified: 'Section « Merge gate for PR #4 » et phase suivante.',
    items: [
      'Faire charger le Project Viewer sur la preview Vercel',
      'Représenter les 64 entrées de l’inventaire de façon cohérente, sans placeholder présenté comme réel',
      'Garder les niveaux de preuve visibles (CONFIRMED, DOCUMENTED, CONCEPT, NOT_AUDITED)',
      'Extraire réellement les dépôts : routes et pages, puis sections, médias, primitives',
      'Passer la constitution NOEMA du statut PROPOSÉ à une gouvernance implémentée (consentement, provenance, audit, réversibilité)',
    ],
  },
  {
    repo: 'RELIA',
    source: 'pull/12',
    sourceLabel: 'PR #12 · Phase YouTube (pilote Matt Mez Sax)',
    verified: 'Section « Restant » de la PR publique.',
    items: [
      'Fournir l’URL de chaîne @mattmezsax et une clé YouTube Data API dans un environnement autorisé',
      'Exécuter tools/sync-youtube.mjs --check puis la synchronisation de l’identité relia:person:matt-mez-sax',
      'Committer le catalogue src/data/youtube/ et relier la fiche locale à la chronologie',
    ],
  },
  {
    repo: 'lemondeaimedesignsystem',
    source: 'index.html',
    sourceLabel: 'Page publiée · sections Audit et Matrice',
    verified: 'Audit du 9 oct. 2026 bloqué par l’accès au site ; le site mattmezsax.base44.app répond désormais (16 oct. 2026).',
    items: [
      'Reprendre l’audit : header, hero vidéo, assistant, INSTANTS, formulaires, primitives Lucide, éditeurs et espace client sont « non vérifiés »',
      'Relever les tokens réels de l’application (:root, thèmes, Space Grotesk / Inter) et les comparer au design system',
      'Isoler les styles sous une racine Landing dédiée ; ne pas importer la feuille entière dans Matt Mez Admin',
      'Porter par famille après accord : boutons / champs / cartes, puis navigation et médias, assistant en dernier',
      'Choisir les médias définitifs et vérifier les droits (photos Unsplash provisoires)',
    ],
    broken: ['Le site de production refuse l’iframe (X-Frame-Options: DENY) : la visionneuse ne peut montrer qu’une capture'],
  },
  {
    repo: 'byaime-one-page',
    source: '.agents/memory/MEMORY.md',
    sourceLabel: 'Mémoires publiques de l’agent',
    verified: '23 notes de mémoire publiées ; elles décrivent des décisions, pas une liste de tâches.',
    items: [
      'Vérifier les parcours : RSVP (réémission de jeton), communications d’événement, sessions Clerk en E2E',
      'Confirmer la projection « une seule page publique » et les redirections de /monde',
      'Tester la cartographie MapLibre avec localisations vérifiées uniquement',
      'Valider l’apparence inclusive (Sombre / Clair) et le langage intergénérationnel sur toutes les vues',
    ],
  },
  {
    repo: 'SILLAGE',
    source: '.agents/memory/MEMORY.md',
    sourceLabel: 'Mémoires publiques de l’agent',
    verified: 'Deux notes : chemins de délégation design, erreurs de liens privés.',
    items: [
      'Confirmer le répertoire de sortie réel après chaque build délégué',
      'Remplacer immédiatement le contenu privé en cache quand une autorisation est refusée',
      'Valider les droits des médias et la lecture collaborative avant publication',
    ],
  },
  {
    repo: 'AIME-ARCHIVE',
    source: 'AGENTS.md',
    sourceLabel: 'Consignes d’agent du dépôt Base44',
    verified: 'Fichier public ; le backend Base44 n’est pas accessible depuis ATLAS.',
    items: [
      'Lancer les vérifications de package.json avant toute modification',
      'Réutiliser le client SDK existant et le plugin Vite plutôt que de nouvelles intégrations',
      'Auditer les entités (AuditEvent) et permissions avant toute réutilisation des archives',
    ],
  },
  {
    repo: 'RIPPLECIRCLE',
    source: 'docs/00-baseline-audit.md',
    sourceLabel: 'Audit de base',
    verified: 'Document présent dans le dépôt ; contenu détaillé à relire.',
    items: ['Valider les interactions tactiles du cadran sur mobile', 'Brancher des données d’événement réelles et sourcées'],
  },
];

export const remainingFor = (repo: string) => REMAINING_WORK.find((r) => r.repo === repo);

export function defaultRemaining(r: RepoSnapshot): string[] {
  const items: string[] = [];
  if (r.embed === 'offline') items.push(`Republier ${r.homepage?.replace('https://', '') ?? 'le site'} (404 constaté) ou retirer l’URL du dépôt`);
  if (r.embed === 'blocked') items.push('Autoriser l’intégration (frame-ancestors) ou fournir des captures officielles');
  if (!r.description && !r.siteDescription) items.push('Écrire une description et documenter les parcours principaux');
  if (r.embed === 'none' && r.size > 0) items.push('Publier un prototype accessible pour vérifier les fonctions');
  items.push('Valider l’accessibilité et les fonctions avec des utilisateurs réels');
  return items;
}

/* ------------------------------------------------------------------ */
/* Candidats à la fusion — fondés sur la liste des « organes » de la    */
/* constitution NOEMA et sur les correspondances observées.            */
/* ------------------------------------------------------------------ */

export type FusionKind = 'moteur' | 'module' | 'plateforme' | 'systeme';

export interface FusionCandidate {
  id: string;
  name: string;
  kind: FusionKind;
  thesis: string;
  members: string[];
  gain: string;
  prerequisites: string[];
  source: { repo: string; path: string; label: string };
}

export const FUSIONS: FusionCandidate[] = [
  {
    id: 'moteur-composition',
    name: 'Moteur de composition',
    kind: 'moteur',
    thesis: 'Composer, Métamorphose, SystemAtlas et ATLAS décrivent le même geste : prendre des fragments sourcés et les recomposer.',
    members: ['AIME-COMPOSER', 'AIME-METAMORPHOSE', 'SYSTEMATLAS', 'AIMEPROJET'],
    gain: 'Un seul moteur de sections, médias et preuves, réutilisé par tous les sites au lieu de quatre implémentations.',
    prerequisites: ['Appliquer le contrat « Composer » : manifeste de composition qui référence les sources sans les copier', 'Extraire routes, sections et médias des dépôts (phase prévue après la PR #4)', 'Décider du dépôt hôte et des conventions de nommage'],
    source: { repo: 'AIME-COMPOSER', path: 'AUDIT/PROJECT-VIEWER-SPEC.md', label: 'Composer contract' },
  },
  {
    id: 'systeme-nerveux-temporel',
    name: 'Système nerveux temporel',
    kind: 'systeme',
    thesis: 'RELIA, AIME-TIMELINE et la timeline des profils byaime structurent tous le temps à partir de moments sourcés.',
    members: ['RELIA', 'AIME-TIMELINE', 'byaime-one-page', 'RIPPLECIRCLE'],
    gain: 'Une « Universal Timeline » unique : mêmes moments, lus en frise, en cadran ou en profil public.',
    prerequisites: ['Aligner le modèle de Moment (source, date, provenance, consentement)', 'Terminer la phase YouTube de RELIA (catalogue public @mattmezsax)', 'Choisir le fournisseur de temps commun décrit dans « world-heartbeat »'],
    source: { repo: 'AIME-COMPOSER', path: 'ARCHITECTURE/NOEMA-CONSTITUTION-V1.md', label: 'Organes : Timeline · Universal Timeline' },
  },
  {
    id: 'plateforme-mariage',
    name: 'Plateforme mariage',
    kind: 'plateforme',
    thesis: 'Dispoo (créneaux), MONMARIAGE (journée), MINISITEWEDDING (VOWS) et RIPPLECIRCLE (programme) couvrent le même événement par morceaux.',
    members: ['dispoo-app', 'MONMARIAGE', 'MINISITEWEDDING', 'RIPPLECIRCLE', 'radiopink', 'WEDDINGCITY'],
    gain: 'Un parcours continu : disponibilités → programme → vœux → musique, avec une seule identité et un seul RSVP.',
    prerequisites: ['Unifier l’identité des invités et le cycle de vie des liens RSVP (mémoire « rsvp-link-lifecycle »)', 'Choisir un design system unique pour l’univers Mariage', 'Décider quels sites restent autonomes (WEDDINGCITY est hors ligne)'],
    source: { repo: 'byaime-one-page', path: '.agents/memory/rsvp-link-lifecycle.md', label: 'Cycle de vie des liens RSVP' },
  },
  {
    id: 'moteur-sonore',
    name: 'Moteur sonore',
    kind: 'moteur',
    thesis: 'SILLAGE, Radio Pink et la chaîne @mattmezsax portent la même matière : la musique comme mémoire d’un moment.',
    members: ['SILLAGE', 'radiopink', 'bande-originale', 'AIME-COMPOSER'],
    gain: 'Un lecteur et un catalogue partagés (droits, lecture, playlist) pour tous les univers au lieu de lecteurs séparés.',
    prerequisites: ['Clarifier les droits des médias et des fournisseurs (mémoire « relational-sound-timeline »)', 'Importer le catalogue YouTube public comme source', 'Garder la lecture sonore sur action utilisateur uniquement'],
    source: { repo: 'byaime-one-page', path: '.agents/memory/relational-sound-timeline.md', label: 'Timeline sonore relationnelle' },
  },
  {
    id: 'design-system-unifie',
    name: 'Design system unifié',
    kind: 'systeme',
    thesis: 'Le Monde Aime (documenté), DesignSystem (évolution chromatique) et ColorCard (registre) décrivent la même identité en trois endroits.',
    members: ['lemondeaimedesignsystem', 'DesignSystem', 'ColorCard', 'POINTZERO'],
    gain: 'Des tokens uniques (couleurs, typographie, rayons, états) consommés par les sites, Base44 compris.',
    prerequisites: ['Relever les tokens réels de mattmezsax.base44.app et les comparer', 'Isoler les styles sous une racine dédiée (pas de :root global)', 'Porter par famille : boutons, champs, cartes, puis navigation et médias'],
    source: { repo: 'lemondeaimedesignsystem', path: 'DESIGN_SYSTEM.md', label: 'Design system Le Monde Aime' },
  },
  {
    id: 'bureau-archive',
    name: 'Bureau & archive',
    kind: 'module',
    thesis: 'AIME-ARCHIVE, aime-desktop et AIMEDESK veulent tous classer, trier et retrouver.',
    members: ['AIME-ARCHIVE', 'aime-desktop', 'AIMEDESK', 'BIBLIOTHEQUESUPERMAGAZINE'],
    gain: 'Un seul bureau : ingestion (Desktop), monde et contraintes (Archive), bibliothèque (magazines) avec provenance commune.',
    prerequisites: ['Auditer les entités et permissions de l’archive Base44', 'Définir la mémoire gouvernée : VOIR · CORRIGER · SUPPRIMER · PARTAGER · RÉVOQUER', 'Décider du stockage (Base44 ou autre) avant toute migration'],
    source: { repo: 'AIME-COMPOSER', path: 'ARCHITECTURE/NOEMA-CONSTITUTION-V1.md', label: 'Organes : Desktop · Archive · Media Library' },
  },
  {
    id: 'noyau-aime',
    name: 'Noyau AIME',
    kind: 'plateforme',
    thesis: 'POINTZERO (marque mère), AIMEPROJET (studio), byaime-one-page (plateforme) et Le Monde Aime (association) se recouvrent sur l’accueil, l’identité et les univers.',
    members: ['POINTZERO', 'AIMEPROJET', 'byaime-one-page', 'AIMELEMONDEAIME', 'AIMEEVENT'],
    gain: 'Une architecture mère unique : /, /univers, /studios, /vision, avec les autres projets comme studios ou moteurs.',
    prerequisites: ['Valider la hiérarchie introduite par la PR #38 de POINTZERO', 'Séparer clairement Univers, Studios et moteurs dans chaque dépôt', 'Conserver les anciens liens et la navigation Atelier'],
    source: { repo: 'POINTZERO', path: 'docs/AIME-ARCHITECTURE-MERE-AUDIT.md', label: 'Hiérarchie introduite' },
  },
  {
    id: 'atelier-broderie',
    name: 'Atelier de broderie',
    kind: 'module',
    thesis: 'BRODEZ, UNIVERSALBRODERIE, stitch3D et le studio Broderie de POINTZERO partagent motifs, DMC et patrons.',
    members: ['BRODEZ', 'UNIVERSALBRODERIE', 'stitch3D', 'BRODEZVOTREMARIAGE', 'POINTZERO'],
    gain: 'Un moteur de motifs commun (import, DMC, patrons sauvegardés) servi par plusieurs vitrines.',
    prerequisites: ['Documenter les motifs, sources et droits', 'Reprendre les moteurs de broderie de POINTZERO sans nouveau schéma de données', 'Décider des vitrines à conserver (deux dépôts sont vides)'],
    source: { repo: 'POINTZERO', path: 'docs/AUDIT-ARCHITECTURE-BRODERIE.md', label: 'Audit architecture broderie' },
  },
];

export const FUSION_KIND_LABEL: Record<FusionKind, string> = {
  moteur: 'Moteur',
  module: 'Module',
  plateforme: 'Plateforme',
  systeme: 'Système',
};

export interface FusionReadiness {
  live: number;
  code: number;
  offline: number;
  missing: string[];
  score: number;
}

export function fusionReadiness(f: FusionCandidate, repos: RepoSnapshot[]): FusionReadiness {
  const found = f.members.map((name) => repos.find((r) => r.name === name));
  const live = found.filter((r) => r && (r.embed === 'live' || r.embed === 'blocked')).length;
  const code = found.filter((r) => r && r.embed === 'none' && r.size > 0).length;
  const offline = found.filter((r) => r && r.embed === 'offline').length;
  const missing = f.members.filter((_, i) => !found[i] || found[i]!.size === 0);
  const score = Math.round(((live * 2 + code) / (f.members.length * 2)) * 100);
  return { live, code, offline, missing, score };
}

/* ------------------------------------------------------------------ */
/* Signaux : consignes prêtes à être transmises à l'assistant.          */
/* Le bouton ne contacte pas l'assistant ; il compose le message exact  */
/* à coller dans la conversation.                                       */
/* ------------------------------------------------------------------ */

export type SignalKind = 'continuer' | 'reparer' | 'finaliser' | 'fusionner';

export interface Signal {
  id: string;
  kind: SignalKind;
  subject: string;
  title: string;
  body: string;
  createdAt: number;
}

const SIGNALS_KEY = 'atlas:signaux:v1';

export function loadSignals(): Signal[] {
  try {
    const raw = localStorage.getItem(SIGNALS_KEY);
    const list = raw ? (JSON.parse(raw) as Signal[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveSignal(signal: Signal): Signal[] {
  const next = [signal, ...loadSignals().filter((s) => s.id !== signal.id)].slice(0, 40);
  try {
    localStorage.setItem(SIGNALS_KEY, JSON.stringify(next));
  } catch {
    /* stockage indisponible */
  }
  return next;
}

export function removeSignal(id: string): Signal[] {
  const next = loadSignals().filter((s) => s.id !== id);
  try {
    localStorage.setItem(SIGNALS_KEY, JSON.stringify(next));
  } catch {
    /* stockage indisponible */
  }
  return next;
}

const lines = (items: string[]) => items.map((i) => `- ${i}`).join('\n');

export function composeProjectSignal(kind: Exclude<SignalKind, 'fusionner'>, r: RepoSnapshot, opts: { remaining: string[]; broken: string[]; source?: string; completion: number; done: string[]; low: number; high: number }): Signal {
  const date = new Date().toLocaleDateString('fr-FR');
  const header = `Projet : ${r.name} (${githubRepoUrl(r.name)})\nSite : ${r.homepage ?? 'aucun'} · statut : ${r.embed}\nSource lue : ${opts.source ?? 'statut GitHub et métadonnées'}\nDate du signal : ${date}`;
  if (kind === 'continuer') {
    return {
      id: `${kind}-${r.name}-${Date.now()}`,
      kind,
      subject: r.name,
      title: `Continuer ${r.name} avec l’IA`,
      createdAt: Date.now(),
      body: `CONSIGNE · CONTINUER\n${header}\n\nPoursuis le développement de ce projet en traitant, dans l’ordre, ce qui reste à faire d’après ses propres documents :\n${lines(opts.remaining)}\n\nRègles : ne modifie que ce dépôt, cite chaque fichier touché, aucune publication automatique, propose une recette de test avant toute fusion.`,
    };
  }
  if (kind === 'reparer') {
    return {
      id: `${kind}-${r.name}-${Date.now()}`,
      kind,
      subject: r.name,
      title: `Réparer ${r.name} avec l’IA`,
      createdAt: Date.now(),
      body: `CONSIGNE · RÉPARER\n${header}\n\nProblèmes constatés :\n${lines(opts.broken.length ? opts.broken : ['Aucun incident constaté depuis ATLAS ; vérifier le déploiement et les erreurs en console'])}\n\nAttendu : diagnostic sourcé (fichiers, commits, en-têtes HTTP), correction minimale, preuve de remise en ligne ou d’accès rétabli, puis mise à jour de l’audit du dépôt.`,
    };
  }
  return {
    id: `${kind}-${r.name}-${Date.now()}`,
    kind,
    subject: r.name,
    title: `Finaliser ${r.name} et mettre à jour l’estimation`,
    createdAt: Date.now(),
    body: `CONSIGNE · FINALISER ET RÉÉVALUER\n${header}\n\nConditions déclarées remplies par le propriétaire :\n${lines(opts.done.length ? opts.done : ['aucune pour l’instant'])}\n\nConditions restantes :\n${lines(opts.remaining)}\n\nAvancement documentaire actuel : ${opts.completion} % · fourchette indicative ${opts.low.toLocaleString('fr-FR')} – ${opts.high.toLocaleString('fr-FR')} € (coût de reconstruction, pas une valeur de marché).\n\nAttendu : vérifier chaque condition déclarée avec une preuve (lien, capture, test), finaliser ce qui manque, puis recalculer l’estimation en expliquant les hypothèses.`,
  };
}

export function composeFusionSignal(f: FusionCandidate, readiness: FusionReadiness, repos: RepoSnapshot[]): Signal {
  const members = f.members.map((name) => {
    const r = repos.find((x) => x.name === name);
    return `- ${name} · ${r ? `${r.embed}${r.homepage ? ` · ${r.homepage}` : ''} · ${r.size} Ko` : 'dépôt introuvable'}`;
  });
  return {
    id: `fusionner-${f.id}-${Date.now()}`,
    kind: 'fusionner',
    subject: f.name,
    title: `Préparer la fusion « ${f.name} »`,
    createdAt: Date.now(),
    body: `CONSIGNE · FUSIONNER\nFusion : ${f.name} (${FUSION_KIND_LABEL[f.kind]})\nThèse : ${f.thesis}\nSource : ${githubRepoUrl(f.source.repo)}/blob/main/${f.source.path} — ${f.source.label}\nMaturité observée : ${readiness.score} % (${readiness.live} en ligne, ${readiness.code} code seul, ${readiness.offline} hors ligne${readiness.missing.length ? `, manquants : ${readiness.missing.join(', ')}` : ''})\n\nMembres :\n${members.join('\n')}\n\nGain attendu : ${f.gain}\n\nPrérequis :\n${lines(f.prerequisites)}\n\nAttendu : lire les dépôts membres, proposer l’architecture cible et le dépôt hôte, lister les modules réutilisables tels quels / à adapter / à abandonner, puis un plan de migration réversible. Aucune fusion n’est exécutée sans validation.`,
  };
}
