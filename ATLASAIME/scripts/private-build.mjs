import { readdir, readFile } from 'node:fs/promises';
// The admin application must never be emitted as a public static artifact.
const publicHtml = await readFile('dist/index.html','utf8');
if (publicHtml.includes('atlas:projects:v2') || publicHtml.includes('Se déconnecter')) throw new Error('Admin code leaked into public entry');
if ((await readdir('dist')).some(name => /\.js$|^assets$|admin/i.test(name))) throw new Error('Unexpected public admin/shared assets; inspect build before deploying');

for (const file of ['dist/index.html','.admin-build/admin.html']) {
  const html = await readFile(file,'utf8');
  if (/from\s*["'][^"']+\.js["']/.test(html)) throw new Error('Build is not self-contained');
}

const privateHtml = await readFile('.admin-build/admin.html','utf8');
if (!privateHtml.includes('atlas:projects:v2')) throw new Error('Private workshop build missing');
