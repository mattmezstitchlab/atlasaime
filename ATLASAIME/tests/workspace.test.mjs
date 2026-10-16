import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = readFileSync(new URL('../src/data/workspace.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext } });
const { parseAmount, isWorkspace, emptyWorkspace, workspaceTotals } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
test('montants exacts en centimes et validation des entrées', () => {
  assert.equal(parseAmount('12,30'), 1230);
  assert.equal(parseAmount('0.29'), 29);
  for (const input of ['', '-1', 'NaN', '1.001', '1e3', '1000000001']) assert.equal(parseAmount(input), null);
});
test('tâches et budget partagent les totaux ; terminer et supprimer recalculent', () => {
  const data = { limit: 10000, items: [{ id: 'a', label: 'Lieu', cents: 3000, done: false }, { id: 'b', label: 'Musique', cents: 2000, done: true }] };
  assert.deepEqual(workspaceTotals(data), { planned: 5000, completed: 2000, remaining: 5000 });
  data.items[0].done = true;
  assert.equal(workspaceTotals(data).completed, 5000);
  data.items.splice(0, 1);
  assert.equal(workspaceTotals(data).remaining, 8000);
  data.limit = 100;
  assert.equal(workspaceTotals(data).remaining, -1900);
});
test('stockage vide ou corrompu et aller-retour JSON', () => {
  assert.equal(isWorkspace(emptyWorkspace()), true);
  for (const data of [null, {}, { limit: -1, items: [] }, { limit: 0, items: [{ cents: '12' }] }]) assert.equal(isWorkspace(data), false);
  assert.equal(isWorkspace(JSON.parse(JSON.stringify(emptyWorkspace()))), true);
});
