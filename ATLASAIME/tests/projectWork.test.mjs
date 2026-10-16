import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = readFileSync(new URL('../src/data/projectWork.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext } });
const { evidenceUrl, canSetStatus, parseRecords, estimateSale } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
test('validation exige une preuve HTTPS sans identifiants', () => {
  for (const url of ['', 'javascript:alert(1)', 'http://example.com', 'https://user:pass@example.com']) { assert.equal(evidenceUrl(url), null); assert.equal(canSetStatus('validated', url), false); }
  assert.equal(canSetStatus('validated', 'https://example.com/pr/1'), true);
  assert.equal(canSetStatus('prepared', ''), true);
});
test('restauration refuse les statuts invalides et données corrompues', () => {
  const record = { id: '1', subject: 'atlas', kind: 'reparer', title: 'Réparer', createdAt: 1, updatedAt: 1, status: 'prepared', evidence: '' };
  assert.deepEqual(parseRecords([record, null, { ...record, status: 'validated' }, { ...record, status: 'invented' }]), [record]);
  assert.deepEqual(parseRecords({}), []);
});
test('scénario de vente exige revenus, hypothèses, source et droits', () => {
  const s = { revenue: 10000, multipleLow: 1.5, multipleHigh: 3, assumptions: 'Multiples choisis pour le scénario', evidence: 'https://example.com/source', rights: true };
  assert.deepEqual(estimateSale(s), { low: 15000, high: 30000 });
  for (const change of [{revenue: 0}, {revenue: -1}, {revenue: Infinity}, {rights: false}, {evidence: ''}, {assumptions: ''}, {multipleHigh: 1}]) assert.equal(estimateSale({...s, ...change}), null);
});
