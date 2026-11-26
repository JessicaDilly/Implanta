// ---------- Camadas e fundo ----------
const LAYER_NAMES = {lote: 'Lote', recuo: 'Área edificável (recuos)', quadra: 'Quadras', edif: 'Edificações',
                     planta: 'Plantas das edificações', vaga: 'Vagas', arvore: 'Árvores', medidas: 'Medidas', desenho: 'Desenhos (pincel)', sol: 'Estudo solar (sol e sombras)', terreno: 'Terreno (declividade, curvas, corte/aterro)'};
function renderLayers() {
  const box = $('layers'); box.innerHTML = '';
  Object.keys(LAYER_NAMES).forEach(k => {
    const row = document.createElement('label'); row.className = 'lay';
    const sp = document.createElement('span'); sp.textContent = LAYER_NAMES[k];
    const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = vis[k];
    cb.onchange = () => { vis[k] = cb.checked; applyVis(); };
    row.append(sp, cb); box.appendChild(row);
  });
}
function applyVis() {
  [[lotLayer, 'lote'], [recLayer, 'recuo'], [measureLayer, 'medidas'], [sketchLayer, 'desenho']].forEach(([lyr, k]) => {
    if (vis[k]) lyr.addTo(map); else map.removeLayer(lyr);
  });
  syncSolLayers(); syncTerrLayers();
  if (sel && !vis[sel.kind]) select(null); else updateAll();
}
