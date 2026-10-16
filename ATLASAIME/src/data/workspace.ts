export interface WorkItem { id: string; label: string; cents: number; done: boolean }
export interface WorkspaceData { limit: number; items: WorkItem[] }
export const emptyWorkspace = (): WorkspaceData => ({ limit: 0, items: [] });
export function parseAmount(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const cents = Math.round(Number(normalized) * 100);
  return Number.isSafeInteger(cents) && cents <= 100000000000 ? cents : null;
}
export function isWorkspace(value: unknown): value is WorkspaceData {
  if (!value || typeof value !== 'object') return false;
  const data = value as WorkspaceData;
  return Number.isSafeInteger(data.limit) && data.limit >= 0 && Array.isArray(data.items) && data.items.every((item) =>
    item && typeof item.id === 'string' && typeof item.label === 'string' && Number.isSafeInteger(item.cents) && item.cents >= 0 && typeof item.done === 'boolean');
}
export function workspaceTotals(data: WorkspaceData) {
  const planned = data.items.reduce((sum, item) => sum + item.cents, 0);
  const completed = data.items.filter((item) => item.done).reduce((sum, item) => sum + item.cents, 0);
  return { planned, completed, remaining: data.limit - planned };
}
