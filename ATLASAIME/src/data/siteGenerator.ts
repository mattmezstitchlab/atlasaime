import type { Cell, Project, TextContent } from '../types';
import type { Brief } from './agents';
import type { RepoSnapshot } from './repos';
import { createProject, defaultSettings, makeTextFragment, uid } from './templates';
import { LAYOUT_MAP } from './layouts';

export interface GeneratedSite {
  project: Project;
  assumptions: string[];
  sourcesUsed: string[];
  sections: string[];
}

const trimPrompt = (value: string, max = 68) => {
  const cleaned = value.trim().replace(/^(?:bonjour[, ]*)?(?:je voudrais|j'aimerais|j’aimerais|je veux|crée(?:-moi)?|génère(?:-moi)?|construis(?:-moi)?|fais(?:-moi)?)\s+/i, '');
  const end = cleaned.search(/[.!?\n]/);
  const first = (end > 8 ? cleaned.slice(0, end) : cleaned).replace(/\s+/g, ' ').trim();
  return first.length > max ? `${first.slice(0, max - 1).trim()}…` : first;
};

function generatedSections(brief: Brief): TextContent[] {
  const action = brief.primaryAction || trimPrompt(brief.prompt, 82);
  const publicName = brief.audience || 'votre public';
  const title = brief.typeId === 'event'
    ? action ? `${action.charAt(0).toLocaleUpperCase('fr-FR')}${action.slice(1)}` : 'Le jour J, à votre rythme.'
    : brief.typeId === 'app'
      ? `Un espace pour ${publicName}.`
      : brief.typeId === 'landing'
        ? action ? `Découvrez ${action}.` : trimPrompt(brief.prompt)
        : trimPrompt(brief.prompt);
  const voice: Record<Brief['visualDirection'], string> = {
    rose: 'Rose doux, lumière naturelle et accents chaleureux.',
    fuchsia: 'Fuchsia précis, noir encre et surfaces lumineuses.',
    sombre: 'Nuit profonde, contraste élevé et lumière maîtrisée.',
    editorial: 'Typographie ample, espace généreux et rythme éditorial.',
    sobre: 'Clarté, repères nets et interface apaisée.',
  };
  const first: TextContent = {
    eyebrow: `AIME · ${brief.typeId === 'app' ? 'Application web' : brief.typeId.replace('-', ' ')}`,
    title,
    body: `${brief.prompt} ${brief.rationale}`,
    tone: brief.visualDirection === 'sombre' || brief.visualDirection === 'fuchsia' ? 'sombre' : 'clair',
  };
  const cta: TextContent = {
    eyebrow: 'Prochaine étape',
    title: 'À vous de valider la suite.',
    body: `${brief.requestedScope === 'public' ? 'Préparer les conditions de publication.' : brief.requestedScope === 'privé' ? 'Confirmer les accès et les rôles.' : 'Valider le parcours et les écrans.'} Aucun changement n’est publié automatiquement.`,
    align: 'center',
  };
  const plans: Partial<Record<Brief['typeId'], TextContent[]>> = {
    app: [
      { eyebrow: 'Parcours', title: 'Chaque action à sa place.', body: `L’espace guide ${publicName} pour ${action}. Les accès et les données réelles restent à définir.` },
      { eyebrow: 'Fonctions', title: 'Un premier parcours concret.', body: `La priorité du brief : ${action}. Les projets liés sont des sources de référence, pas des intégrations de backend.` },
      { eyebrow: 'Direction artistique', title: 'Une identité qui sert l’usage.', body: voice[brief.visualDirection] },
    ],
    landing: [
      { eyebrow: 'La promesse', title: 'Une entrée claire, un geste à la fois.', body: `La page présente ${action} à ${publicName}, avec un chemin lisible vers l’action principale.` },
      { eyebrow: 'Ce qui vous distingue', title: 'Des preuves avant les promesses.', body: 'Les projets associés viennent de dépôts GitHub publics et restent des références, pas des témoignages clients.' },
      { eyebrow: 'L’action', title: 'La prochaine étape, sans détour.', body: `Réserver la suite au besoin décrit : ${action}. Aucun formulaire réel n’est branché.` },
    ],
    event: [
      { eyebrow: 'Le programme', title: 'Un moment après l’autre.', body: `Le parcours peut accueillir ${action}, sans inventer de lieux, d’horaires ou de réponses.` },
      { eyebrow: 'Vos invités', title: 'Les informations au bon endroit.', body: `Une expérience pensée pour ${publicName}. La confirmation reste un prototype tant qu’aucun service n’est connecté.` },
      { eyebrow: 'Ambiance', title: 'Une journée qui vous ressemble.', body: voice[brief.visualDirection] },
    ],
    portfolio: [
      { eyebrow: 'Sélection', title: 'Des projets choisis pour cette intention.', body: `Les références visibles répondent à : ${action}. Chaque lien garde sa source.` },
      { eyebrow: 'Démarche', title: 'Du concept à l’expérience.', body: `Un portfolio adressé à ${publicName}, avec une composition ${brief.layoutId}.` },
      { eyebrow: 'Signature', title: 'Une direction qui vous ressemble.', body: voice[brief.visualDirection] },
    ],
    moodboard: [
      { eyebrow: 'L’univers', title: 'La matière avant le décor.', body: `Une sélection visuelle autour de ${action}, pensée pour ${publicName}.` },
      { eyebrow: 'Références', title: 'Des éléments réellement existants.', body: 'Les dépôts et médias sont sourcés ; aucune image générée ni prestation inventée.' },
      { eyebrow: 'Palette', title: 'Une ambiance cohérente.', body: voice[brief.visualDirection] },
    ],
    docs: [
      { eyebrow: 'Repères', title: 'Une navigation pour apprendre.', body: `Organiser les ressources de ${publicName} et rendre ${action} plus accessible.` },
      { eyebrow: 'Contenu', title: 'Des fondations jusqu’aux exemples.', body: 'Les composants de référence sont liés à leurs dépôts sources.' },
      { eyebrow: 'Accessibilité', title: 'Comprendre avant de choisir.', body: voice[brief.visualDirection] },
    ],
    archive: [
      { eyebrow: 'Index', title: 'Retrouver sans perdre la source.', body: `Une archive évolutive pour ${publicName}, consacrée à ${action}.` },
      { eyebrow: 'Mémoire', title: 'Chaque fragment garde son contexte.', body: 'Dates, dépôts et documents publics restent identifiables dans ATLAS.' },
      { eyebrow: 'Évolution', title: 'Enrichir sans effacer.', body: voice[brief.visualDirection] },
    ],
  };
  return [first, ...(plans[brief.typeId] ?? [
    { eyebrow: 'L’intention', title: 'Une expérience pensée pour vous.', body: `Le parcours accompagne ${publicName} pour ${action}. Le brief d’origine reste visible et modifiable dans l’inspecteur.` },
    { eyebrow: 'Direction artistique', title: 'Une identité, pas un habillage générique.', body: voice[brief.visualDirection] },
  ]), cta];
}

export function generateSiteFromBrief(brief: Brief, answers: Record<string, string>, repos: RepoSnapshot[]): GeneratedSite {
  const typeId = brief.typeId;
  const layout = LAYOUT_MAP[brief.layoutId];
  const audience = answers.audience?.trim();
  const primaryAction = answers.function?.trim();
  const visual = answers.style?.trim();
  const sourceIds = brief.selectedRepos
    .filter((name) => repos.some((r) => r.name === name))
    .slice(0, brief.layoutId === 'infinite' ? 9 : layout.slots.length)
    .map((name) => `gh:${name}`);
  const name = trimPrompt(brief.prompt, 44) || 'Nouvelle application';
  const project = createProject({
    name,
    typeId,
    layoutId: brief.layoutId,
    supportId: brief.supportId,
    explicit: sourceIds,
    repos,
  });

  const resolvedBrief: Brief = {
    ...brief,
    audience: audience || brief.audience,
    primaryAction: primaryAction || brief.primaryAction,
    visualDirection: visual ? (/fuchsia|magenta/i.test(visual) ? 'fuchsia' : /rose|poudré|poudre/i.test(visual) ? 'rose' : /sombre|noir/i.test(visual) ? 'sombre' : /éditorial|editorial|élégant|elegant/i.test(visual) ? 'editorial' : 'sobre') : brief.visualDirection,
    requestedScope: answers.scope?.trim() ? (/priv[ée]|interne/i.test(answers.scope) ? 'privé' : /public|en ligne/i.test(answers.scope) ? 'public' : 'prototype à valider') : brief.requestedScope,
  };

  project.name = name;
  const sectionContent = generatedSections(resolvedBrief);
  const sectionFragments = sectionContent.map((content) => makeTextFragment(content));
  const summary = makeTextFragment({
    eyebrow: 'Votre brief · source conservée',
    title: 'Intention originale',
    body: [brief.prompt, audience && `Public : ${audience}`, primaryAction && `Action : ${primaryAction}`, visual && `Style : ${visual}`].filter(Boolean).join(' · '),
  });

  project.customFragments.push(...sectionFragments, summary);
  const textVariant: NonNullable<Cell['settings']['designVariant']> = resolvedBrief.visualDirection === 'sombre' ? 'noir'
    : resolvedBrief.visualDirection === 'fuchsia' ? 'fuchsia'
      : resolvedBrief.visualDirection === 'rose' ? 'rose'
        : resolvedBrief.visualDirection === 'editorial' ? 'editorial' : 'original';
  const referenceCells = project.cells.filter((cell) => cell.fragmentId);
  const sectionCells = sectionFragments.map((f): Cell => ({
    id: uid('cell'),
    fragmentId: f.id,
    settings: { ...defaultSettings('text'), border: false, shadow: 'aucune', designVariant: textVariant },
    label: f.text?.eyebrow,
  }));

  // The semantic sections lead; actual GitHub projects follow as sourced examples.
  project.cells = [...sectionCells, ...referenceCells, {
    id: uid('cell'), fragmentId: summary.id, settings: { ...defaultSettings('text'), border: false, shadow: 'aucune' }, label: 'Brief',
  }];
  if (resolvedBrief.visualDirection === 'sombre') project.theme = { ...project.theme, background: 'noir' };
  const generatedVariant = resolvedBrief.visualDirection === 'sombre' ? 'noir'
    : resolvedBrief.visualDirection === 'fuchsia' ? 'fuchsia'
      : resolvedBrief.visualDirection === 'rose' ? 'rose'
      : resolvedBrief.visualDirection === 'editorial' ? 'editorial' : 'original';
  if (generatedVariant !== 'original') {
    project.cells = project.cells.map((cell) => ({ ...cell, settings: { ...cell.settings, designVariant: generatedVariant } }));
  }

  const assumptions = [
    ...brief.missing.map((m) => `${m.label} : ${answers[m.id]?.trim() || 'hypothèse à valider'}`),
    `Portée : ${resolvedBrief.requestedScope}`,
    `Source(s) intégrée(s) : ${sourceIds.length ? sourceIds.map((id) => id.slice(3)).join(', ') : 'aucun dépôt public correspondant'}`,
    'Prototype de composition : aucun backend, compte utilisateur, paiement, formulaire connecté ou publication automatique.',
  ];

  return {
    project,
    assumptions,
    sourcesUsed: sourceIds,
    sections: sectionFragments.map((f) => f.text?.eyebrow ?? f.name),
  };
}