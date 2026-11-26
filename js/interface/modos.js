// ---------- Modo One (simples e guiado) e modo Pro (completo) ----------
const MODO_KEY = 'implanta.modo', GUIA_KEY = 'implanta.guia';
var modo = 'one'; try { modo = localStorage.getItem(MODO_KEY) || 'one'; } catch (e) {}
var guia = {}; try { guia = JSON.parse(localStorage.getItem(GUIA_KEY) || '{}'); } catch (e) { guia = {}; }
function marcaGuia(k) { if (guia[k]) return; guia[k] = 1; try { localStorage.setItem(GUIA_KEY, JSON.stringify(guia)); } catch (e) {} renderGuide(); }
function setModo(m) {
  modo = m; document.body.classList.toggle('one', m === 'one');
  document.querySelectorAll('#modo [data-modo]').forEach(b => b.classList.toggle('on', b.dataset.modo === m));
  try { localStorage.setItem(MODO_KEY, m); } catch (e) {}
  if (m === 'one') {
    if (tool === 'lotes') closePop();
    if (typeof TERR !== 'undefined' && (TERR.mode === 'elev' || TERR.mode === 'orient')) setTerrMode('decl');
  }
  if (sel) renderCtx();
  renderGuide(); renderMetrics();
}
document.querySelectorAll('#modo [data-modo]').forEach(b => { b.onclick = () => { setModo(b.dataset.modo); msg(b.dataset.modo === 'one' ? 'Modo One: o essencial, com um guia passo a passo.' : 'Modo Pro: todas as ferramentas técnicas.'); }; });
// Guia de passos do modo One
const PASSOS = [
  {k: 'end', t: 'Encontre o endereço', ok: () => !!pinAt || !!lot, go: () => openTool('buscar')},
  {k: 'lote', t: 'Desenhe o lote', ok: () => !!lot, go: () => openTool('lote')},
  {k: 'blocos', t: 'Coloque quadras e construções', ok: () => blocks.length > 0, go: () => { const b = document.querySelector('#createbar [data-cat="quadras"]'); if (b && b.offsetParent) abreCbMenu('quadras', b); else openTool('biblioteca'); }},
  {k: 'sol', t: 'Veja o sol e as sombras', ok: () => !!guia.sol, go: () => setSol(true)},
  {k: 'terreno', t: 'Confira o terreno', ok: () => !!guia.terreno, go: () => openTool('terreno')},
  {k: 'pdf', t: 'Gere o PDF do estudo', ok: () => !!guia.pdf, go: () => openTool('exportar')}
];
var guiaMin = false;
function renderGuide() {
  const g = $('guide'); if (!g) return;
  g.hidden = modo !== 'one' || !!tool || !!guia.fechado;
  if (g.hidden) return;
  const st = PASSOS.map(p => p.ok()), feitos = st.filter(Boolean).length, prox = st.indexOf(false);
  g.classList.toggle('min', guiaMin);
  g.innerHTML = `<div class="g-hd"><b>${feitos === PASSOS.length ? 'Estudo completo! 🎉' : 'Seu estudo em 6 passos'}</b><span class="hint" style="margin:0">${feitos}/${PASSOS.length} ${guiaMin ? '▾' : '▴'}</span></div>` +
    `<div class="g-bar"><i style="width:${feitos / PASSOS.length * 100}%"></i></div><ol>` +
    PASSOS.map((p, i) => `<li data-i="${i}" class="${st[i] ? 'ok' : i === prox ? 'next' : ''}"><span class="n">${st[i] ? '✓' : i + 1}</span><span>${p.t}</span></li>`).join('') + '</ol>' +
    (feitos === PASSOS.length ? '<button class="btn" id="g-close" style="width:100%;margin-top:6px">Fechar o guia</button>' : '');
  g.querySelector('.g-hd').onclick = () => { guiaMin = !guiaMin; renderGuide(); };
  g.querySelectorAll('li').forEach(li => li.onclick = () => PASSOS[+li.dataset.i].go());
  const c = g.querySelector('#g-close'); if (c) c.onclick = () => { guia.fechado = 1; try { localStorage.setItem(GUIA_KEY, JSON.stringify(guia)); } catch (e) {} renderGuide(); };
}
// Leitura do terreno em linguagem simples
function terrPlain(s) {
  if (!s) return '';
  const d = s.decMed, cls = d <= 5 ? ['plano', 'ótimo para quadras e construções'] : d <= 15 ? ['suave', 'bom; pede pequenos acertos'] : d <= 30 ? ['inclinado', 'exige terraplenagem e possivelmente muros de arrimo'] : ['muito inclinado', 'implantação cara; procure orientação técnica'];
  let h = `<b>Terreno ${cls[0]}</b> (inclinação média de ${fmt(d)}%): ${cls[1]}. Desnível de ${fmt(s.zmax - s.zmin)} m dentro do lote.`;
  s.plats.forEach(({bk, p, t}) => { const hm = Math.max(p.hc, p.ha); if (hm > 1) h += `<br>${esc(bk.name)}: para deixar plano, seria preciso ${p.hc >= p.ha ? 'cortar' : 'aterrar'} até <b>${fmt(hm)} m</b>${hm > 3 ? ' (provável muro de arrimo)' : ''}${t && t.larg > .5 ? `, com talude de até ${fmt(t.larg)} m em volta${t.fora ? ', <b style="color:var(--bad)">que passa da divisa do lote</b>' : ''}` : ''}.`; });
  return h;
}
function renderSimple(m) {
  const hud = $('hud');
  if (!lot) { hud.innerHTML = '<div class="simple"><div class="big">Nenhum lote ainda</div><div class="hint">Siga o guia à esquerda: comece pelo endereço.</div></div>'; return; }
  // carrega o terreno do lote uma vez, para a leitura simples
  if (!m.terr && typeof TERR !== 'undefined' && !TERR.busy && TERR.auto !== terrKey(terrArea())) { TERR.auto = terrKey(terrArea()); terrCompute().then(() => renderMetrics()); }
  const nq = m.quadras.length, ne = d => d;
  const al = [];
  if (m.fora) al.push(`${m.fora} ${m.fora > 1 ? 'blocos passaram' : 'bloco passou'} do recuo (contorno vermelho). Arraste para dentro da linha tracejada.`);
  m.quadras.filter(q => q.dev > 25).forEach(q => al.push(`${esc(q.name)} está atravessada em relação ao sol. O ideal é o comprimento no sentido norte–sul.`));
  hud.innerHTML = '<div class="simple">' +
    `<div class="big">Lote de ${fmt(m.lotA)} m²</div>` +
    `<div class="s-row"><span>Área livre</span><b>${fmt(m.livre)} m² · ${pctS(m.lotA ? m.livre / m.lotA : 0)}</b></div>` +
    `<div class="s-row"><span>Quadras</span><b>${nq}</b></div>` +
    `<div class="s-row"><span>Construções</span><b>${fmt(m.proj)} m²</b></div>` +
    `<div class="s-row"><span>Vagas</span><b>${m.vagas}</b></div>` +
    (al.length ? al.map(a => `<div class="s-al">⚠ ${a}</div>`).join('') : m.blocos ? '<div class="s-ok">✓ Tudo dentro do lote e dos recuos</div>' : '') +
    (m.terr ? `<div class="s-terr">${terrPlain(m.terr)}</div>` : '<div class="hint">Lendo o terreno…</div>') +
    '<button class="btn" id="s-pro" style="width:100%;margin-top:8px">Ver detalhes técnicos (modo Pro)</button></div>';
  $('s-pro').onclick = () => setModo('pro');
}
