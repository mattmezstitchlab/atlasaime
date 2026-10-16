export type WorkStatus = 'prepared' | 'in-progress' | 'review' | 'validated';
export interface WorkRecord {
  id: string; subject: string; kind: string; title: string; createdAt: number;
  status: WorkStatus; evidence: string; updatedAt: number;
}
export function evidenceUrl(value: string): string | null {
  try { const url = new URL(value.trim()); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; }
  catch { return null; }
}
export function canSetStatus(status: WorkStatus, evidence: string): boolean {
  return status !== 'validated' || !!evidenceUrl(evidence);
}
export function parseRecords(value: unknown): WorkRecord[] {
  if (!Array.isArray(value)) return [];
  return value.filter((r): r is WorkRecord => !!r && typeof r === 'object' && typeof r.id === 'string' && typeof r.subject === 'string' && typeof r.title === 'string' && typeof r.kind === 'string' && Number.isFinite(r.createdAt) && Number.isFinite(r.updatedAt) && ['prepared', 'in-progress', 'review', 'validated'].includes(r.status) && typeof r.evidence === 'string' && canSetStatus(r.status, r.evidence));
}
export const WORK_KEY = 'atlas:work:v1';
export function loadWork(): WorkRecord[] {
  try { return parseRecords(JSON.parse(localStorage.getItem(WORK_KEY) || '[]')); } catch { return []; }
}
export interface SaleScenario { revenue: number; multipleLow: number; multipleHigh: number; assumptions: string; evidence: string; rights: boolean }
export function estimateSale(scenario: SaleScenario): { low: number; high: number } | null {
  if (!scenario.rights || !scenario.assumptions.trim() || !evidenceUrl(scenario.evidence) || ![scenario.revenue, scenario.multipleLow, scenario.multipleHigh].every(Number.isFinite) || scenario.revenue <= 0 || scenario.multipleLow <= 0 || scenario.multipleHigh < scenario.multipleLow) return null;
  const low = scenario.revenue * scenario.multipleLow;
  const high = scenario.revenue * scenario.multipleHigh;
  return Number.isFinite(low) && Number.isFinite(high) ? { low: Math.round(low), high: Math.round(high) } : null;
}
