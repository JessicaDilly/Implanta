// ---------- Início do app: plantas importadas, mapa base e último estudo salvo ----------
plantas.forEach(p => { if (p.kind === 'dxf') PLANS[p.id] = {inner: p.inner, w0: p.w0, h0: p.h0}; });

// Mapa base escolhido da última vez
try { const v = localStorage.getItem('creativmap.mapa'); if (v && v !== 'sat') setBg(v); } catch (e) {}
// Recupera o último estudo salvo neste aparelho
try {
  const d = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
  if (d && d.s) {
    pool = d.pool || []; restore(d.s); cur = d.s;
    if (Array.isArray(d.opts) && d.opts.length) { opts = d.opts; oi = Math.min(d.oi || 0, opts.length - 1); }
    if (lot) map.fitBounds(L.geoJSON(lot.feat).getBounds(), {padding: [60, 60]});
  }
} catch (e) { cur = null; }
if (cur === null) cur = snapshot();
opts[oi].s = cur; renderOpts();
setModo(modo);
syncUndo();
updateAll();
msg(temHover ? "Busque o endereço, crie o lote e insira os blocos pela barra de baixo." : "Use a roda TOOLS: busque o endereço, crie o lote e insira os blocos. Com um bloco selecionado, gire com dois dedos.");

// Plantas padrão (pasta plantas) e bases de lotes (pasta dados), baixadas em js/dados.js. Chegam logo depois
// da abertura: entram no catálogo, e os blocos que já usavam uma planta padrão são redesenhados com ela.
DADOS.plantas.then(lista => {
  lista.forEach(p => {
    if (!p) return;
    try {
      const r = dxfToPlan(p.texto.trim()); if (!r) return;
      const id = 'std:' + p.nome;
      PLANS[id] = {inner: r.inner, w0: r.w, h0: r.h};
      BUILTIN.push({kind: 'dxf', name: p.nome, w: r.w, h: r.h, src: id});
    } catch (e) { console.error('Planta ' + p.nome, e); }
  });
  blocks.forEach(b => { if (b.kind === 'dxf' && PLANS[b.src] && b.src.startsWith('std:')) buildSvg(b); });
});
DADOS.lotes.then(bases => { ltLoad(bases); if (tool === 'lotes') ltOpen(); });
