// ---------- Painel do terreno e redesenho depois de cada mudança ----------
function renderTerrPanel() {
  const s = terrSummary(), el = $('terr-plat'); if (!el) return;
  if (!s) { el.innerHTML = lot ? '<p class="hint">Escolha um modo acima para carregar a elevação do lote.</p>' : '<p class="hint">Crie o lote para analisar o terreno.</p>'; return; }
  el.innerHTML = '<table class="ztab">' + s.plats.map(({bk, p, t}) => `<tr><td>${esc(bk.name)}</td><td>cota ${fmt(p.cota)}${p.auto ? ' (média)' : ''}</td><td><span style="color:#e53935">▲${fmt(p.corte)}</span> <span style="color:#1e88e5">▼${fmt(p.aterro)}</span> m³</td></tr>` + (t && (t.vc + t.va) > .5 ? `<tr><td colspan="2" style="color:var(--muted)">talude até ${fmt(t.larg)} m${t.fora ? ' <b style="color:var(--bad)">sai do lote</b>' : ''}</td><td><span style="color:#e53935">▲${fmt(t.vc)}</span> <span style="color:#1e88e5">▼${fmt(t.va)}</span> m³</td></tr>` : '')).join('') + '</table>' +
    (s.plats.length ? '' : '<p class="hint">Insira quadras ou edificações para calcular as plataformas.</p>');
}
// Redesenha o terreno e o 3D pouco depois de cada mudança (sem pesar durante o arraste)
let terrT = null;
function terrRefresh() {
  clearTimeout(terrT);
  terrT = setTimeout(async () => {
    try {
      if (TERR.mode !== 'padrao' || TERR.curvas) await drawTerrain(); else drawTaludes();
      if (tool === 'terreno') renderTerrPanel();
      if (map3d && !$('map3d').hidden) { map3d.getSource('estudo').setData(studyGeoJSON()); atualizaDem3D(); }
      if (TERR.perfis.length && tool === 'terreno') renderPerfis();
      if (mTab === 'terreno' && hudOpen) renderMetrics();
    } catch (e) {}
  }, 350);
}
