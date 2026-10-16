import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = readFileSync(new URL('../src/data/siteExport.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext } });
const { exportNativeSite } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
test('export autonome sans dépendances externes et échappement des textes', () => {
  const project = { id: '</script><script>alert(1)</script>', name: '<img src=x onerror=alert(1)>', cells: [{ fragmentId: 'text' }], customFragments: [{ id: 'native', nativeModule: 'tasks-budget' }, { id: 'text', text: { title: '<script>alert(1)</script>', body: '& texte' } }] };
  const html = exportNativeSite(project);
  assert.ok(!html.includes('<img src=x'));
  assert.equal((html.match(/<script>/g) || []).length, 1);
  assert.ok(!html.includes('<iframe'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('localStorage'));
  const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
  assert.doesNotThrow(() => new Function(script));
});
test('export refuse les compositions sans module natif', () => { assert.throws(() => exportNativeSite({customFragments: []})); });
