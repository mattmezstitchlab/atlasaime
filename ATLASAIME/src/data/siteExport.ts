import type { Project } from '../types';
export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
export function exportNativeSite(project: Project): string {
  if (!project.customFragments.some((f) => f.nativeModule === 'tasks-budget')) throw new Error('Export autonome réservé au site natif Tâches + Budget.');
  const sections = project.cells.map((cell) => project.customFragments.find((f) => f.id === cell.fragmentId)).filter((f) => f && !f.nativeModule && f.text).map((f) => `<section><h2>${escapeHtml(f!.text!.title)}</h2><p>${escapeHtml(f!.text!.body || '')}</p></section>`).join('');
  return `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(project.name)}</title>
<style>body{font:16px system-ui;max-width:900px;margin:40px auto;padding:20px;background:#faf9f8;color:#171717}section{padding:24px;background:white;margin:16px 0;border-radius:16px}input,button{font:inherit;padding:8px;margin:4px;max-width:90%}button{cursor:pointer}li{margin:12px 0}p{line-height:1.6;white-space:pre-wrap}label{display:block}</style>
<h1>${escapeHtml(project.name)}</h1><p>Site autonome · modules ATLAS natifs. Données locales à cet appareil, aucun serveur, compte ou paiement connecté. Ne contient aucune donnée métier de votre session ATLAS.</p>
<section><h2>Tâches et budget</h2><label>Budget total (€)<input id="limit" type="number" min="0" step="0.01" value="0"></label><p id="totals" aria-live="polite"></p>
<form id="add"><label>Tâche<input id="label" required maxlength="200"></label><label>Coût prévu (€)<input id="cost" required type="number" min="0" step="0.01" value="0"></label><button>Ajouter</button></form><ul id="items"></ul><button id="export" type="button">Exporter les données JSON</button><p id="message" role="alert"></p></section>${sections}
<script>
const key=${JSON.stringify(`atlas:standalone:${project.id}`).replace(/</g, '\\u003c')};
const el=id=>document.getElementById(id);let data={limit:0,items:[]};
try{const s=JSON.parse(localStorage.getItem(key));if(s&&Number.isSafeInteger(s.limit)&&s.limit>=0&&Array.isArray(s.items)&&s.items.every(i=>i&&typeof i.id==='string'&&typeof i.label==='string'&&Number.isSafeInteger(i.cents)&&i.cents>=0&&typeof i.done==='boolean'))data=s;}catch{}
const money=n=>(n/100).toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
const cents=v=>{if(!/^\\d+(?:[.,]\\d{1,2})?$/.test(v))return null;const n=Math.round(Number(v.replace(',','.'))*100);return Number.isSafeInteger(n)&&n<=100000000000?n:null};
function save(){try{localStorage.setItem(key,JSON.stringify(data));el('message').textContent='';}catch{el('message').textContent='Stockage indisponible : exportez vos données avant de fermer.';}render();}
function render(){el('limit').value=data.limit/100;const total=data.items.reduce((s,i)=>s+i.cents,0);const done=data.items.filter(i=>i.done).reduce((s,i)=>s+i.cents,0);el('totals').textContent='Prévu : '+money(total)+' · Terminé : '+money(done)+' · Disponible : '+money(data.limit-total);el('items').replaceChildren();for(const item of data.items){const li=document.createElement('li'),check=document.createElement('input'),text=document.createElement('span'),remove=document.createElement('button');check.type='checkbox';check.checked=item.done;check.setAttribute('aria-label','Terminer '+item.label);check.onchange=()=>{item.done=check.checked;save()};text.textContent=item.label+' · '+money(item.cents);if(item.done)text.style.textDecoration='line-through';remove.textContent='Supprimer';remove.onclick=()=>{data.items=data.items.filter(i=>i.id!==item.id);save()};li.append(check,text,remove);el('items').append(li);}}
el('limit').onchange=e=>{const n=cents(e.target.value);if(n!==null){data.limit=n;save()}else{el('message').textContent='Budget invalide.';render()}};
el('add').onsubmit=e=>{e.preventDefault();const n=cents(el('cost').value),label=el('label').value.trim();if(n===null||!label){el('message').textContent='Tâche ou coût invalide.';return}data.items.push({id:String(Date.now())+Math.random(),label,cents:n,done:false});el('label').value='';el('cost').value='0';save()};
el('export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='taches-budget.json';a.click();URL.revokeObjectURL(url)};render();
</script></html>`;
}
export function downloadNativeSite(project: Project) {
  const url = URL.createObjectURL(new Blob([exportNativeSite(project)], { type: 'text/html;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'mon-site.html'; link.click(); URL.revokeObjectURL(url);
}
