import { allKnownFragments } from './catalog';
import type { Project } from '../types';
import { LAYOUT_MAP, SUPPORT_MAP } from './layouts';
import { PROJECT_TYPE_MAP } from './templates';

export const MAX_BACKUP_BYTES = 40 * 1024 * 1024;
const object = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
const finite = (x: unknown) => typeof x === 'number' && Number.isFinite(x);
const rect = (x: unknown) => object(x) && ['x','y','w','h'].every(k => finite(x[k])) && Number(x.w) > 0 && Number(x.h) > 0;
const text = (x: unknown) => object(x) && typeof x.title === 'string' && ['body','eyebrow'].every(k => x[k] === undefined || typeof x[k] === 'string');
function settings(x: unknown): boolean {
  return object(x) && [390,820,1440].includes(Number(x.viewport)) && ['scale','opacity','radius','duration','delay'].every(k => finite(x[k])) &&
    (x.crop === null || rect(x.crop)) && ['adapter','remplir','original'].includes(String(x.fit)) && ['live','capture'].includes(String(x.preview)) &&
    ['hideOverflow','border'].every(k => typeof x[k] === 'boolean') && ['aucune','douce','forte'].includes(String(x.shadow)) &&
    ['aucune','fade','slide','zoom'].includes(String(x.animation)) && ['aucun','zoom','lift'].includes(String(x.hover)) &&
    object(x.locks) && ['position','size','content','crop','interaction'].every(k => typeof (x.locks as Record<string, unknown>)[k] === 'boolean');
}
const safeUrl = (x: unknown) => x === undefined || (typeof x === 'string' && /^(https?:|blob:|data:(image\/|video\/|audio\/|application\/pdf[;,]))/i.test(x));
export function isProject(value: unknown): value is Project {
  if (!object(value)) return false;
  const p = value;
  return typeof p.id === 'string' && typeof p.name === 'string' &&
    typeof p.layoutId === 'string' && Object.prototype.hasOwnProperty.call(LAYOUT_MAP, p.layoutId) &&
    typeof p.supportId === 'string' && Object.prototype.hasOwnProperty.call(SUPPORT_MAP, p.supportId) &&
    typeof p.typeId === 'string' && Object.prototype.hasOwnProperty.call(PROJECT_TYPE_MAP, p.typeId) &&
    ['grille', 'libre'].includes(String(p.arrangement)) && finite(p.createdAt) && finite(p.updatedAt) &&
    object(p.theme) && ['blanc','papier','points','noir'].includes(String(p.theme.background)) && finite(p.theme.gap) && finite(p.theme.padding) &&
    Array.isArray(p.cells) && p.cells.length <= 10000 && p.cells.every(c => object(c) && typeof c.id === 'string' && (c.fragmentId === null || typeof c.fragmentId === 'string') && settings(c.settings) && (c.rect === undefined || rect(c.rect))) &&
    Array.isArray(p.customFragments) && p.customFragments.length <= 10000 && p.customFragments.every(f => object(f) && typeof f.id === 'string' && typeof f.name === 'string' &&
      ['site','repo','audio','video','image','svg','model3d','code','pdf','calendar','timeline','text'].includes(String(f.kind)) &&
      safeUrl(f.url) && safeUrl(f.poster) && safeUrl(f.fallbackPoster) && (f.text === undefined || text(f.text)));
}

export function exportBackup(projects: Project[]): string {
  const library = new Map(allKnownFragments().map(f => [f.id, f]));
  projects = projects.map(p => {
    const custom = new Map(p.customFragments.map(f => [f.id, f]));
    for (const c of p.cells) {
      const id = c.fragmentId;
      if (!id || custom.has(id)) continue;
      const f = library.get(id);
      if (f) custom.set(id, f);
      else if (!/^(gh:|m:)/.test(id)) throw new Error('Un fragment est introuvable. Remplacez-le avant de créer une sauvegarde complète.');
    }
    return { ...p, customFragments: [...custom.values()] };
  });
  // Existing blob URLs cannot be made portable by serializing the string.
  if (projects.some(p => p.customFragments.some(f => [f.url, f.poster].some(u => u?.startsWith('blob:'))))) {
    throw new Error('Un ancien fichier temporaire est présent. Réimportez-le avant de créer une sauvegarde portable.');
  }
  const json = JSON.stringify({ format: 'atlas.backup', version: 1, projects }, null, 2);
  if (new TextEncoder().encode(json).length > MAX_BACKUP_BYTES) throw new Error('Sauvegarde trop volumineuse. Exportez les compositions individuellement (40 Mo maximum).');
  return json;
}
export function parseBackup(text: string): Project[] {
  if (new TextEncoder().encode(text).length > MAX_BACKUP_BYTES) throw new Error('Sauvegarde trop volumineuse (40 Mo maximum).');
  const data: unknown = JSON.parse(text);
  if (!object(data) || data.format !== 'atlas.backup' || data.version !== 1 || !Array.isArray(data.projects) || !data.projects.every(isProject)) throw new Error('Sauvegarde invalide ou version non prise en charge.');
  if (new Set(data.projects.map(p => p.id)).size !== data.projects.length) throw new Error('Identifiants en double dans la sauvegarde.');
  if (data.projects.some(p => p.customFragments.some(f => [f.url, f.poster].some(u => u?.startsWith('blob:'))))) throw new Error('La sauvegarde contient des fichiers temporaires non restaurables.');
  return data.projects;
}
export function downloadBackup(projects: Project[]) {
  const url = URL.createObjectURL(new Blob([exportBackup(projects)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = 'atlas-sauvegarde.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
