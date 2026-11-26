// ---------- Catálogo por categoria (barra de baixo e Biblioteca), com as mais usadas primeiro ----------
const USO_KEY = 'implanta.uso';
let uso = {}; try { uso = JSON.parse(localStorage.getItem(USO_KEY) || '{}'); } catch (e) { uso = {}; }
const usoKey = it => it.kind + ':' + (it.src || '');
function contaUso(it) { const k = usoKey(it); uso[k] = (uso[k] || 0) + 1; try { localStorage.setItem(USO_KEY, JSON.stringify(uso)); } catch (e) {} }
const CATS = {
  quadras: {titulo: 'Quadras', itens: () => [{kind: 'rapida'}, {kind: 'saibro'}, {kind: 'padel'}, {kind: 'infantil'}]},
  edif: {titulo: 'Edificações', itens: () => [{kind: 'edif'}, ...BUILTIN,
    ...plantas.map((p, i) => p.kind === 'dxf' ? {...p, src: p.id, idx: i, user: true} : {...p, kind: 'planta', idx: i, user: true})]},
  estac: {titulo: 'Estacionamento', itens: () => [{kind: 'vaga', label: 'Uma vaga'}, {kind: 'estac', label: 'Conjunto de vagas'}]},
  arvore: {titulo: 'Árvores e vegetação', itens: () => Object.entries(TREES).map(([k, t]) => ({kind: 'arvore', src: k, w: t.d, h: t.d, alt: t.alt, label: t.name}))}
};
function itemLabel(it) {
  const t = TYPES[it.kind], w = it.w ?? t.w, h = it.h ?? t.h;
  const nome = it.label || it.name || t.label;
  return {nome, med: it.kind === 'arvore' ? 'Ø ' + fmt(w) + ' m' : it.kind === 'estac' ? parkLayout(w, h).count + ' vagas · ' + fmt(w) + ' × ' + fmt(h) + ' m' : fmt(w) + ' × ' + fmt(h) + ' m', w, h};
}
function ordenado(itens) { return itens.map((it, i) => ({it, i, n: uso[usoKey(it)] || 0})).sort((a, b) => b.n - a.n || a.i - b.i); }
function inserir(it) { if (tool) closePop(); addBlock(it); contaUso(it); fechaCbMenu(); msg('Pronto: ' + itemLabel(it).nome + ' no centro do mapa. Arraste para mover, puxe os lados para esticar e use a seta azul para girar.'); }
function tile(it, n, maisUsada) {
  const L0 = itemLabel(it), d = document.createElement('div'); d.className = 'it';
  d.innerHTML = thumb(it.kind, L0.w, L0.h, it.src) + `<div class="nm"></div><div class="md"></div>` + (maisUsada ? '<span class="mu">mais usada</span>' : '');
  d.querySelector('.nm').textContent = L0.nome; d.querySelector('.md').textContent = L0.med;
  d.onclick = () => inserir(it);
  return d;
}
function abreCbMenu(cat, btn) {
  const m = $('cbmenu');
  if (!m.hidden && m.dataset.cat === cat) { fechaCbMenu(); return; }
  const C = CATS[cat], lista = ordenado(C.itens());
  m.innerHTML = `<div class="cbm-hd"><b>${C.titulo}</b><button class="xbtn" aria-label="Fechar">×</button></div><div class="lib cbm-lib"></div>` +
    '<button class="btn cbm-all">Ver a biblioteca completa</button>';
  const box = m.querySelector('.cbm-lib');
  lista.forEach(({it, n}, k) => box.appendChild(tile(it, n, k === 0 && n > 0)));
  m.querySelector('.xbtn').onclick = fechaCbMenu;
  m.querySelector('.cbm-all').onclick = () => { fechaCbMenu(); openTool('biblioteca'); };
  m.dataset.cat = cat; m.hidden = false;
  document.querySelectorAll('#createbar [data-cat]').forEach(b => b.classList.toggle('on', b === btn));
  const r = btn.getBoundingClientRect(), w = m.offsetWidth;
  m.style.left = Math.max(12, Math.min(innerWidth - w - 12, r.left + r.width / 2 - w / 2)) + 'px';
}
function fechaCbMenu() { $('cbmenu').hidden = true; document.querySelectorAll('#createbar [data-cat]').forEach(b => b.classList.remove('on')); }
document.querySelectorAll('#createbar [data-cat]').forEach(b => { b.onclick = e => { e.stopPropagation(); if (tool) closePop(); abreCbMenu(b.dataset.cat, b); }; });
document.addEventListener('pointerdown', e => { if (!$('cbmenu').hidden && !e.target.closest('#cbmenu') && !e.target.closest('#createbar [data-cat]')) fechaCbMenu(); });
addEventListener('keydown', e => { if (e.key === 'Escape') fechaCbMenu(); });
$('cb-del').onclick = () => { if (sel) removeBlock(sel); else msg('Selecione um bloco para excluir.'); };
// Terreno e vista 3D (essas funções ficam em arquivos carregados depois deste: por isso são chamadas dentro de () => …)
document.querySelectorAll('#terr-modes [data-tm]').forEach(b => { b.onclick = () => setTerrMode(b.dataset.tm); });
$('terr-curvas').onchange = async () => { TERR.curvas = $('terr-curvas').checked; syncTerrLayers(); await drawTerrain(); };
$('terr-prof-btn').onclick = () => startProfile();
$('tal-on').onchange = () => { TAL.on = $('tal-on').checked; drawTaludes(); renderTerrPanel(); renderMetrics(); terrRefresh(); };
['tal-rc', 'tal-ra'].forEach(id => $(id).onchange = () => { TAL.rc = Math.max(.25, num('tal-rc')); TAL.ra = Math.max(.25, num('tal-ra')); drawTaludes(); renderTerrPanel(); renderMetrics(); });
$('btn-3d').onclick = () => open3D(); $('cb-3d').onclick = () => open3D();
$('cb-sol').onclick = $('btn-sol').onclick = () => { if (tool) closePop(); setSol(!solOn); };
$('terr-3d').onclick = () => { closePop(); open3D(); };
$('v3d-close').onclick = () => close3D();
