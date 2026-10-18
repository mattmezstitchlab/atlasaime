import { collectionOf, COLLECTIONS, screenshotUrl, type RepoSnapshot } from './repos';

export type RepoPreview = { url: string; label: string; description: string };
const escapeXml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]!);

/** Illustrative wireframe only: never inferred to be a screenshot or a working feature. */
export function mockRepoPreview(repo: RepoSnapshot): RepoPreview {
  const domain = collectionOf(repo);
  const label = COLLECTIONS.find((c) => c.id === domain)?.label ?? 'Projet';
  const accent = domain === 'mariage' ? '#b37963' : domain === 'son' ? '#7559a7' : domain === 'design' ? '#127e83' : '#326ca0';
  const title = escapeXml((repo.siteTitle || repo.name).slice(0, 42));
  const caption = escapeXml((repo.siteDescription || repo.description || `Projet · ${label}`).slice(0, 84));
  let content: string;
  if (domain === 'design') {
    content = `<text x="55" y="238" font-size="38">Aa Bb Cc</text>${['#172b3a', accent, '#c4dcd7', '#e9e4dc'].map((color, i) => `<rect x="${55 + i * 105}" y="265" width="88" height="60" rx="12" fill="${color}"/>`).join('')}<rect x="55" y="350" width="160" height="38" rx="10" fill="${accent}"/><rect x="235" y="350" width="160" height="38" rx="10" fill="#e2e8ed"/>`;
  } else if (domain === 'outils') {
    content = `<rect x="55" y="210" width="125" height="202" rx="12" fill="#e8edf2"/>${[0, 1, 2].map((i) => `<rect x="205" y="${210 + i * 70}" width="430" height="55" rx="12" fill="#fff" stroke="#dce3e9"/><circle cx="230" cy="${237 + i * 70}" r="8" fill="${accent}"/><path d="M255 ${232 + i * 70}h170m-170 12h240" stroke="#cbd5df" stroke-width="5"/>`).join('')}`;
  } else if (domain === 'son') {
    content = `<rect x="55" y="210" width="175" height="190" rx="16" fill="${accent}"/><circle cx="142" cy="305" r="55" fill="#fff" opacity=".18"/><circle cx="142" cy="305" r="12" fill="#fff"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<rect x="${270 + i * 37}" y="${280 - (i % 3) * 18}" width="17" height="${40 + (i % 3) * 36}" rx="7" fill="${accent}" opacity=".65"/>`).join('')}<path d="M270 370h350" stroke="#dce3e9" stroke-width="8"/>`;
  } else {
    content = `<rect x="55" y="210" width="320" height="188" rx="16" fill="${accent}" opacity=".15"/><circle cx="275" cy="258" r="24" fill="${accent}" opacity=".22"/><path d="M70 378l90-100 70 65 50-40 75 75" fill="${accent}" opacity=".28"/>${[0, 1, 2].map((i) => `<rect x="405" y="${210 + i * 65}" width="230" height="50" rx="10" fill="#fff" stroke="#dce3e9"/>`).join('')}`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 460"><rect width="700" height="460" fill="#f3f5f7"/><g font-family="Arial,sans-serif" fill="#172b3a"><rect x="25" y="25" width="650" height="410" rx="20" fill="#fafbfc" stroke="#dce3e9"/><circle cx="48" cy="47" r="4" fill="${accent}"/><path d="M62 47h80m355 0h45m20 0h45" stroke="#cbd5df" stroke-width="5"/><text x="55" y="108" font-size="12" fill="${accent}">${escapeXml(label.toUpperCase())} · PISTE VISUELLE</text><text x="55" y="151" font-size="27" font-weight="bold">${title}</text><text x="55" y="180" font-size="12">${caption}</text>${content}<rect x="360" y="28" width="305" height="28" rx="8" fill="#172b3a"/><text x="372" y="47" font-size="12" fill="#fff">Maquette — non fonctionnelle</text></g></svg>`;
  return { url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, label: 'Maquette — non fonctionnelle', description: 'Illustration basée sur la catégorie et les métadonnées, pas sur le rendu du code.' };
}

export function repoPreview(repo: RepoSnapshot): RepoPreview {
  if (repo.homepage && (repo.embed === 'live' || repo.embed === 'blocked')) {
    return { url: screenshotUrl(repo.homepage), label: 'Capture du site · service externe', description: 'Image fournie par le service de captures ; elle peut être ancienne ou indisponible.' };
  }
  // OG metadata is an existing visual, not evidence of a rendered application.
  if (/^https:\/\//i.test(repo.ogImage)) return { url: repo.ogImage, label: 'Visuel du projet', description: 'Image déclarée dans les métadonnées, pas une capture vérifiée.' };
  return mockRepoPreview(repo);
}

/** Keep fallback selection pure so failures and changed sources can be tested. */
export function resolveRepoPreview(repo: RepoSnapshot, failedUrl: string | null): RepoPreview {
  const initial = repoPreview(repo);
  return failedUrl === initial.url ? mockRepoPreview(repo) : initial;
}
