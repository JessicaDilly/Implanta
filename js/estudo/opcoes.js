// ---------- Opções A/B/C do mesmo estudo ----------
let opts = [{name: 'Opção A', s: null}], oi = 0;
const optLetter = i => String.fromCharCode(65 + (i % 26));
function renderOpts() {
  const box = $('opts'); box.innerHTML = '';
  opts.forEach((o, i) => {
    const b = document.createElement('button'); b.className = 'opt' + (i === oi ? ' on' : ''); b.textContent = o.name;
    b.title = i === oi ? 'Toque de novo para renomear' : 'Abrir ' + o.name;
    b.onclick = () => { if (i === oi) renameOpt(); else switchOpt(i); };
    if (i === oi && opts.length > 1) {
      const x = document.createElement('span'); x.className = 'opt-x'; x.textContent = '×'; x.title = 'Excluir esta opção';
      x.onclick = e => { e.stopPropagation(); deleteOpt(); }; b.appendChild(x);
    }
    box.appendChild(b);
  });
  const add = document.createElement('button'); add.className = 'opt add'; add.textContent = '+'; add.title = 'Nova opção (copia a atual)'; add.onclick = addOpt; box.appendChild(add);
  const cmp = document.createElement('button'); cmp.className = 'opt cmp'; cmp.textContent = '⇄ Comparar'; cmp.onclick = showCompare;
  if (opts.length < 2) cmp.disabled = true;
  box.appendChild(cmp);
}
function saveOpt() { opts[oi].s = cur; }
function switchOpt(i) {
  saveOpt(); oi = i; cur = opts[i].s; hist = []; fut = [];
  restore(cur); autosave(); syncUndo(); renderOpts(); msg(opts[i].name);
}
function addOpt() {
  saveOpt();
  const used = new Set(opts.map(o => o.name)); let k = opts.length, nm;
  do { nm = 'Opção ' + optLetter(k++); } while (used.has(nm));
  opts.push({name: nm, s: cur}); oi = opts.length - 1; hist = []; fut = [];
  autosave(); syncUndo(); renderOpts(); msg(nm + ' criada a partir da anterior. Mude o que quiser e compare.');
}
function renameOpt() {
  const nm = prompt('Nome da opção:', opts[oi].name);
  if (nm && nm.trim()) { opts[oi].name = nm.trim().slice(0, 30); autosave(); renderOpts(); }
}
function deleteOpt() {
  if (opts.length < 2 || !confirm('Excluir "' + opts[oi].name + '"? Isso não pode ser desfeito.')) return;
  opts.splice(oi, 1); oi = Math.max(0, oi - 1); cur = opts[oi].s; hist = []; fut = [];
  restore(cur); autosave(); syncUndo(); renderOpts();
}
function showCompare() {
  saveOpt();
  const ms = opts.map(o => { const d = JSON.parse(o.s); return {o, m: computeMetrics(d), z: {...ZP0, ...(d.zp || {})}}; });
  const R = [
    ['Área do lote', x => fmt(x.m.lotA) + ' m²'],
    ['Área edificável', x => fmt(x.m.edA) + ' m²'],
    ['Taxa de ocupação', x => pctS(x.m.to)],
    ['Coef. de aproveitamento', x => x.m.ca.toFixed(2).replace('.', ',')],
    ['Área construída', x => fmt(x.m.constr) + ' m²'],
    ['Quadras', x => x.m.quadras.length + (x.m.quadras.length ? ' (' + fmt(x.m.quadraA) + ' m²)' : '')],
    ['Vagas', x => String(x.m.vagas)],
    ['Área livre / permeável', x => fmt(x.m.livre) + ' m² · ' + pctS(x.m.perm)],
    ['Blocos fora do recuo', x => String(x.m.fora)]
  ];
  let h = '<div class="cmp-head"><b>Comparar opções</b><button class="xbtn" id="cmp-x">×</button></div><div class="cmp-wrap"><table class="cmp"><thead><tr><th></th>' +
    ms.map((x, i) => `<th class="${i === oi ? 'on' : ''}">${esc(x.o.name)}</th>`).join('') + '</tr></thead><tbody>' +
    R.map(([k, f]) => '<tr><td>' + k + '</td>' + ms.map(x => '<td>' + f(x) + '</td>').join('') + '</tr>').join('') +
    '<tr><td>Checagem da zona</td>' + ms.map(x => { const ck = checks(x.m, x.z); return '<td>' + ck.map(c => `<span class="m-dot" title="${c.label}: ${c.txt}" style="background:${DOT[c.st]}"></span>`).join('') + '</td>'; }).join('') + '</tr>' +
    '<tr><td></td>' + ms.map((x, i) => `<td><button class="btn" data-open="${i}">${i === oi ? 'Aberta' : 'Abrir'}</button></td>`).join('') + '</tr>' +
    '</tbody></table></div>';
  const c = $('cmpbox'); c.innerHTML = h; c.hidden = false;
  $('cmp-x').onclick = () => { c.hidden = true; };
  c.querySelectorAll('[data-open]').forEach(b => b.onclick = () => { c.hidden = true; const i = +b.dataset.open; if (i !== oi) switchOpt(i); });
}
