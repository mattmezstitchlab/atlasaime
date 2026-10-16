import type { RepoSnapshot } from './repos';
import type { LayoutId, ProjectTypeId, SupportId } from '../types';

export interface AgentProfile {
  id: string;
  name: string;
  specialty: string;
  category: 'architecture' | 'relation' | 'creation' | 'temps' | 'design' | 'preuve';
  repo: string;
  source: string;
  note: string;
  keywords: string[];
}

// These are locally orchestrated specialties grounded in public documentation,
// not connected agents or independent models.
export const AGENTS: AgentProfile[] = [
  {
    id: 'noema', name: 'NOEMA', specialty: 'Sens, consentement & gouvernance', category: 'preuve',
    repo: 'AIME-COMPOSER', source: 'ARCHITECTURE/NOEMA-CONSTITUTION-V1.md',
    note: 'Constitution proposée, non un agent en production. « NOEMA propose. L’humain valide. »',
    keywords: ['projet', 'app', 'application', 'plateforme', 'ia', 'agent', 'aime', 'mémoire', 'memoire'],
  },
  {
    id: 'composer', name: 'Composer', specialty: 'Mise en page & assemblage', category: 'architecture',
    repo: 'AIME-COMPOSER', source: 'AUDIT/COMPOSITION-ENGINE-01.md',
    note: 'Spécialité dérivée du moteur de composition documenté.',
    keywords: ['page', 'site', 'app', 'application', 'portfolio', 'composer', 'moteur', 'grille', 'builder', 'tableau'],
  },
  {
    id: 'ux-architect', name: 'Architecte UX', specialty: 'Parcours, clarté & questions manquantes', category: 'architecture',
    repo: 'AIME-COMPOSER', source: 'AUDIT/PROJECT-VIEWER-SPEC.md',
    note: 'Hiérarchie d’inspection et contrats de composition documentés.',
    keywords: ['ux', 'parcours', 'expérience', 'experience', 'navigation', 'public', 'utilisateur', 'formulaire', 'étape', 'etape'],
  },
  {
    id: 'art-director', name: 'Direction artistique', specialty: 'Identité, rythme & cohérence visuelle', category: 'design',
    repo: 'lemondeaimedesignsystem', source: 'DESIGN_SYSTEM.md',
    note: 'Palette, typographie et composants lus dans le design system publié.',
    keywords: ['direction', 'artistique', 'design', 'identité', 'identite', 'visuel', 'couleur', 'style', 'ambiance', 'marque'],
  },
  {
    id: 'principal-developer', name: 'Développeur principal', specialty: 'Architecture, code & faisabilité', category: 'architecture',
    repo: 'AIME-COMPOSER', source: 'AUDIT/CODE-ATLAS-01.md',
    note: 'Spécialité d’analyse inspirée des audits publics ; aucune modification de dépôt n’est exécutée.',
    keywords: ['code', 'architecture', 'développeur', 'developpeur', 'responsive', 'données', 'donnees', 'api', 'technique'],
  },
  {
    id: 'pointzero', name: 'POINTZERO', specialty: 'Univers & studios', category: 'creation',
    repo: 'POINTZERO', source: 'docs/AIME-ARCHITECTURE-MERE-AUDIT.md',
    note: 'Architecture publique : univers, studios et moteurs sont distincts.',
    keywords: ['atelier', 'studio', 'univers', 'broderie', 'création', 'creation', 'artistique', 'design'],
  },
  {
    id: 'relia', name: 'RELIA', specialty: 'Relations & provenance', category: 'relation',
    repo: 'RELIA', source: 'AUDIT_TIMELINE.md',
    note: 'Les liens entre personnes, lieux et moments gardent leurs sources.',
    keywords: ['relation', 'réseau', 'reseau', 'personne', 'famille', 'invité', 'invite', 'mariage', 'carte'],
  },
  {
    id: 'sillage', name: 'SILLAGE', specialty: 'Son & musique', category: 'creation',
    repo: 'SILLAGE', source: '.agents/memory/MEMORY.md',
    note: 'Mémoire publique du projet sonore, pas accès à une mémoire privée.',
    keywords: ['musique', 'son', 'sax', 'audio', 'radio', 'playlist', 'bande-son', 'vidéo', 'video'],
  },
  {
    id: 'timeline', name: 'Timeline', specialty: 'Chronologie & mémoire', category: 'temps',
    repo: 'byaime-one-page', source: '.agents/memory/public-profile-timeline.md',
    note: 'Projection publique des moments, avec accord et provenance.',
    keywords: ['timeline', 'temps', 'chronologie', 'histoire', 'événement', 'evenement', 'archive', 'souvenir'],
  },
  {
    id: 'atelier', name: 'Design Atelier', specialty: 'Identité & composants', category: 'design',
    repo: 'lemondeaimedesignsystem', source: 'DESIGN_SYSTEM.md',
    note: 'Référence documentée : couleurs, typographie et composants.',
    keywords: ['design', 'identité', 'identite', 'interface', 'ui', 'couleur', 'visuel', 'site', 'page'],
  },
  {
    id: 'archive', name: 'AIME Archive', specialty: 'Documents & preuves', category: 'preuve',
    repo: 'AIME-ARCHIVE', source: 'AGENTS.md',
    note: 'Consignes publiques du dépôt Base44, aucune connexion au backend privé.',
    keywords: ['document', 'manifeste', 'audit', 'archive', 'preuve', 'mémoire', 'memoire', 'dossier'],
  },
];

export interface Brief {
  prompt: string;
  typeId: ProjectTypeId;
  layoutId: LayoutId;
  supportId: SupportId;
  selectedAgents: AgentProfile[];
  selectedRepos: string[];
  missing: { id: string; label: string; question: string }[];
  rationale: string;
  audience: string;
  primaryAction: string;
  visualDirection: 'rose' | 'fuchsia' | 'sombre' | 'editorial' | 'sobre';
  requestedScope: string;
}

const ruleSet: { re: RegExp; type: ProjectTypeId; layout: LayoutId; support?: SupportId; names: string[]; why: string }[] = [
  { re: /mariage|invité|invite|cérémonie|ceremonie|rsvp|événement|evenement/i, type: 'event', layout: 'timeline', names: ['MONMARIAGE','RIPPLECIRCLE','dispoo-app','radiopink'], why: 'Événement : une chronologie et des outils déjà publiés.' },
  { re: /musique|sax|audio|radio|playlist|bande.son/i, type: 'moodboard', layout: 'filmstrip', names: ['SILLAGE','radiopink','RIPPLECIRCLE'], why: 'Musique : un lecteur et ses références sonores.' },
  { re: /broder|stitch|motif|textile/i, type: 'moodboard', layout: 'masonry', names: ['BRODEZ','UNIVERSALBRODERIE','POINTZERO'], why: 'Broderie : des visuels et ateliers déjà existants.' },
  { re: /design.system|composant|token|identité|identite/i, type: 'docs', layout: 'sidebar', names: ['lemondeaimedesignsystem','ColorCard','DesignSystem'], why: 'Design system : documentation, palette et composants.' },
  { re: /archive|mémoire|memoire|chronolog|timeline|histoire/i, type: 'archive', layout: 'infinite', names: ['AIME-ARCHIVE','RELIA','AIME-TIMELINE','POINTZERO'], why: 'Mémoire : une grille extensible avec des sources datées.' },
  { re: /présentation|presentation|pitch|diapo/i, type: 'presentation', layout: 'slides', names: ['POINTZERO','AIMEEVENT','AIMEPROJET'], why: 'Présentation : séquence 16:9 et projets phares.' },
  { re: /portfolio|galerie|showcase/i, type: 'portfolio', layout: 'bento', names: ['POINTZERO','ColorCard','SILLAGE','RELIA'], why: 'Portfolio : une vedette et des projets autour.' },
  { re: /landing|accueil|vitrine|association|site web|site internet/i, type: 'landing', layout: 'hero-grid', names: ['byaime-one-page','AIMELEMONDEAIME','POINTZERO'], why: 'Accueil : promesse, preuve et appel à l’action.' },
  { re: /application|\bapp\b|outil|moteur|plateforme|dashboard|tableau de bord/i, type: 'app', layout: 'sidebar', names: ['AIMEPROJET','POINTZERO','AIME-COMPOSER','RELIA'], why: 'Application : navigation, espace de travail et actions correspondent au besoin décrit.' },
  { re: /boutique|e.commerce|eshop|produit|vente en ligne|restaurant|menu|livraison/i, type: 'landing', layout: 'hero-grid', names: [], why: 'Site marchand : présenter l’offre, son usage et le prochain geste. Aucun dépôt marchand correspondant n’a été identifié.' },
  { re: /communauté|communaute|membre|réseau social|reseau social|forum|entraide|équipe|equipe/i, type: 'landing', layout: 'bento', names: ['RELIA','RIPPLECIRCLE','POINTZERO','AIMEPROJET'], why: 'Communauté : profils, liens et activités réelles de vos membres.' },
  { re: /cours|formation|apprendre|école|ecole|élève|eleve|apprenant|pédagog|pedagog/i, type: 'docs', layout: 'sidebar', names: [], why: 'Parcours pédagogique : une navigation claire entre modules et ressources. Aucun LMS correspondant n’a été vérifié.' },
  { re: /voyage|itinéraire|itineraire|destination|séjour|sejour|tourisme/i, type: 'event', layout: 'timeline', names: [], why: 'Parcours de voyage : étapes, lieux et moments dans une chronologie. Aucun projet touristique correspondant n’a été vérifié.' },
  { re: /budget|planification|gestion/i, type: 'app', layout: 'sidebar', names: ['AIMEPROJET','POINTZERO','AIME-COMPOSER','budgely'], why: 'Application : espaces, parcours et modules pertinents.' },
];

export function analyzeBrief(prompt: string, repos: RepoSnapshot[]): Brief {
  const text = prompt.trim();
  const lower = text.toLocaleLowerCase('fr-FR');
  const matchedRules = ruleSet.filter((r) => r.re.test(lower));
  const productMode = /\b(application|app|application web|app web|outil numérique|outil numerique|plateforme|dashboard|tableau de bord)\b/i.test(lower);
  const requestedPortfolio = /\bportfolio\b|galerie de projets/i.test(lower);
  const explicitAppRule = productMode && !requestedPortfolio ? ruleSet.find((r) => r.type === 'app') : undefined;
  const rule = explicitAppRule ?? matchedRules[0] ?? ruleSet[ruleSet.length - 1];
  const selectedAgents = AGENTS.filter((a) => a.keywords.some((word) => lower.includes(word)));
  for (const id of ['composer', 'ux-architect', 'art-director', 'principal-developer', 'noema']) {
    const agent = AGENTS.find((a) => a.id === id);
    if (agent && !selectedAgents.some((a) => a.id === id)) selectedAgents.push(agent);
  }

  const missing: Brief['missing'] = [];
  if (!/pour (?:les|des|un|une|mon|mes)|destin[ée]|public|client|famill|invité|invite|utilisateur|association|couple/i.test(text))
    missing.push({ id: 'audience', label: 'Public cible', question: 'Pour qui est cette application ?' });
  if (!/permet|doit|fonction|réserv|reserv|rsvp|playlist|agenda|disponibil|calendrier|paiement|commande|gér|ger|suiv|cré|cre|affich|partag|inscri|organis|écout|ecout|vot|enregistr|consult|cherch|compos/i.test(text))
    missing.push({ id: 'function', label: 'Fonction prioritaire', question: 'Quelle est l’action principale à accomplir ?' });
  if (!/mobile|téléphone|telephone|desktop|ordinateur|tablette|a4|impression|web|site|page/i.test(text))
    missing.push({ id: 'support', label: 'Support', question: 'D’abord mobile, bureau ou les deux ?' });
  if (!/rose|fuchsia|noir|blanc|sobre|coloré|colore|clair|sombre|design|style|couleur|identité|identite|marque/i.test(text))
    missing.push({ id: 'style', label: 'Direction visuelle', question: 'Quelle ambiance ou quelle identité visuelle ?' });
  if (!/publ|en ligne|privé|prive|connexion|compte|sans compte|auth|interne|prototype/i.test(text))
    missing.push({ id: 'scope', label: 'Accès & publication', question: 'Prototype, site public ou application privée ?' });

  const stop = new Set(['pour','avec','dans','une','des','les','qui','que','mon','mes','site','application','app','page','projet','faire','créer','creer','veut','voudrais','permet','doit','aussi','depuis','tout','tous','cela','cette','être','etre','sur','par','aux','est','sont','ses','son','leur','leurs']);
  const terms = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(/[a-z0-9]{3,}/g) ?? [];
  const relevant = repos.map((r) => {
    const corpus = `${r.name} ${r.siteTitle} ${r.siteDescription} ${r.description}`.toLocaleLowerCase('fr-FR').normalize('NFD').replace(/[\u0300-\u036f]/g, ' ');
    const score = terms.reduce((sum, word) => sum + (!stop.has(word) && corpus.includes(word) ? (word.length > 5 ? 2 : 1) : 0), 0);
    return { r, score };
  }).filter((x) => x.score > 0).sort((a,b) => b.score - a.score || b.r.pushedAt.localeCompare(a.r.pushedAt)).map((x) => x.r.name);
  const selectedRepos = [...new Set([...rule.names, ...matchedRules.filter((r) => r !== rule).flatMap((r) => r.names), ...relevant])].filter((name) => repos.some((r) => r.name === name)).slice(0, 10);
  const supportId: SupportId = /mobile|téléphone|telephone/i.test(text) ? 'mobile' : /a4|impression/i.test(text) ? 'a4' : rule.support ?? 'desktop';
  const visualDirection: Brief['visualDirection'] = /sombre|noir|dark/i.test(lower) ? 'sombre' : /rose/i.test(lower) ? 'rose' : /fuchsia|magenta/i.test(lower) ? 'fuchsia' : /éditorial|editorial|élégant|elegant|raffiné|raffine/i.test(lower) ? 'editorial' : 'sobre';
  const forQueMatch = text.match(/pour que\s+((?:les?|des?|mon|mes)\s+[\p{L}\p{N}-]+)\s+(.+?)(?=[,.!?]|$)/iu);
  const audienceMatch = text.match(/(?:pour\s+(?!que\b)|destiné à|destinée à|pensé pour|pensée pour)\s+([^,.!?]{3,70}?)(?=\s+(?:qui\s+(?:permet|peut|gère|gere|organise|souhaite|aide|offre|propose)|avec|afin de)|[,!?]|$)/i);
  const actionMatch = text.match(/(?:permet(?:tre)? de|afin de|doit pouvoir|sert à|aide à|qui propose|qui inclut|avec|incluant|comprenant|je (?:veux|voudrais|souhaite)\s+(?:pouvoir\s+)?|on peut)\s+([^,.!?]{3,90})/i);
  const audience = forQueMatch?.[1]?.trim() ?? audienceMatch?.[1]?.trim() ?? (missing.some((m) => m.id === 'audience') ? '' : 'les personnes concernées');
  const primaryAction = forQueMatch?.[2]?.trim() ?? actionMatch?.[1]?.trim() ?? '';
  const requestedScope = /priv[ée]|interne|compte|connexion/i.test(lower) ? 'privé' : /public|en ligne|site web/i.test(lower) ? 'public' : 'prototype à valider';
  return {
    prompt: text, typeId: rule.type, layoutId: rule.layout, supportId,
    selectedAgents: [...new Map(selectedAgents.map((a) => [a.id, a])).values()],
    selectedRepos,
    missing, rationale: rule.why, audience, primaryAction, visualDirection, requestedScope,
  };
}

export const WELCOME_MESSAGE = 'Il est temps de rejoindre AIME :)';