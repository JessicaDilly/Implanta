function solBar(c, s, day) {
  // faixa de horas com as cores do céu, como no ShadowMap
  const stops = day.pts.filter(p => p.m % 15 === 0).map(p => `${skyColor(p.alt)} ${(p.m / 1440 * 100).toFixed(2)}%`);
  $('sol-hora').style.background = `linear-gradient(90deg,${stops.join(',')})`;
  const now = +$('sol-hora').value, pct = m => (m / 1440 * 100).toFixed(2) + '%';
  $('sb-marks').innerHTML = (day.rise ? `<span style="left:${pct(day.rise.m)}">↑ ${hhmm(day.rise.m)}</span><span style="left:${pct(day.set.m)}">↓ ${hhmm(day.set.m)}</span>` : '') +
    `<span class="now" style="left:${pct(now)}">${hhmm(now)}</span>`;
  const d0 = solDate(0), doy = Math.round((d0 - new Date(d0.getFullYear(), 0, 1)) / 864e5);
  document.querySelectorAll('#solbar [data-md]').forEach(b => { const [mo, dd] = b.dataset.md.split('-').map(Number); b.classList.toggle('on', d0.getMonth() === mo - 1 && d0.getDate() === dd); });
  const luz = day.rise ? day.set.m - day.rise.m : 0, fmtAz = a => `<b>${Math.round(a)}°</b> ${rumo(a)}`;
  let h = (s.alt > 0 ? `<span>☀ Azimute ${fmtAz(s.az)} · altura <b>${Math.round(s.alt)}°</b></span>` : '<span>☾ Sol abaixo do horizonte</span>') +
    (day.rise ? `<span>Nascer <b>${hhmm(day.rise.m)}</b> a ${fmtAz(day.rise.az)} · Pôr <b>${hhmm(day.set.m)}</b> a ${fmtAz(day.set.az)}</span><span>Luz do dia <b>${Math.floor(luz / 60)}h${String(luz % 60).padStart(2, '0')}</b></span>` : '');
  if ($('sb-heat').checked && heatStats) {
    const grad = [0, .25, .5, .75, 1].map(t => `rgb(${heatColor(t).join(',')})`).join(',');
    h += `<span class="sb-legend">0 h <i style="background:linear-gradient(90deg,${grad})"></i> ${fmt(heatStats.maxH)} h de sol direto · média no lote <b>${fmt(heatStats.mean)} h</b></span>`;
  }
  $('sb-info').innerHTML = h;
}
// Etiqueta de sol em cada elemento: % iluminado na hora escolhida, ou horas de sol no dia (modo Horas de sol)
function sunTags(s, shadows, heat) {
  blocks.forEach(b => {
    if (b.kind === 'arvore' || !vis[visKey(b.kind)]) return;
    let txt, v;
    if (heat) {
      if (!heatStats || heatStats.courts[b.id] === undefined) return;
      v = heatStats.courts[b.id] / Math.max(1, heatStats.maxH); txt = '☀ ' + fmt(heatStats.courts[b.id]) + ' h';
    } else {
      if (s.alt <= 0) { v = 0; txt = '☾ noite'; }
      else {
        const bf = polyFeat(b.ring), ba = turf.area(bf), outras = unir(shadows.filter(x => x.b !== b).map(x => x.sh).concat(blocks.filter(o => o !== b).map(o => shadowTela(o, s))));
        let sa = 0; if (outras) { try { const it = turf.intersect(bf, outras); sa = it ? turf.area(it) : 0; } catch (e) {} }
        v = 1 - Math.min(1, sa / ba); txt = '☀ ' + Math.round(v * 100) + '%';
      }
    }
    const cls = v >= .75 ? 'sol' : v >= .35 ? 'meia' : 'sombra';
    L.marker([b.lat, b.lng], {pane: 'sun', interactive: false, keyboard: false,
      icon: L.divIcon({className: 'sun-tag ' + cls, html: txt, iconSize: [64, 20], iconAnchor: [32, 10]})}).addTo(sunLayer);
  });
}
function drawSun() {
  sunLayer.clearLayers(); shadowLayer.clearLayers();
  if (!solOn) return;
  const c = solCenter(), s = sunPos(solDate(), c.lat, c.lng), day = dayScan(c), heat = $('sb-heat').checked;
  let R0 = 40;
  if (lot) R0 = Math.max(25, 1.15 * Math.max(...lot.ring.map(p => map.distance([c.lat, c.lng], [p[1], p[0]]))));
  const proj = q => { const r = R0 * (90 - Math.max(0, q.alt)) / 90, a = q.az * Math.PI / 180; return offLL(c, r * Math.sin(a), r * Math.cos(a)); };
  const horiz = az => { const a = az * Math.PI / 180; return offLL(c, R0 * Math.sin(a), R0 * Math.cos(a)); };
  const st = {pane: 'sun', interactive: false, fill: false};
  L.circle([c.lat, c.lng], {...st, radius: R0, color: '#fff', weight: 1.5, opacity: .85, dashArray: '4 6'}).addTo(sunLayer);
  [30, 60].forEach(a => L.circle([c.lat, c.lng], {...st, radius: R0 * (90 - a) / 90, color: '#fff', weight: 1, opacity: .3}).addTo(sunLayer));
  L.polyline([[c.lat, c.lng], offLL(c, 0, R0 * 1.12)], {...st, color: '#ff5252', weight: 3}).addTo(sunLayer);
  sunLabel(offLL(c, 0, R0 * 1.24), 'N', 'n').addTo(sunLayer);
  [['L', R0 * 1.12, 0], ['S', 0, -R0 * 1.12], ['O', -R0 * 1.12, 0]].forEach(([t, x, y]) => sunLabel(offLL(c, x, y), t).addTo(sunLayer));
  // direções do nascer e do pôr do sol, como no ShadowMap
  if (day.rise) {
    L.polyline([[c.lat, c.lng], horiz(day.rise.az)], {...st, color: '#ffa726', weight: 3, opacity: .95}).addTo(sunLayer);
    L.polyline([[c.lat, c.lng], horiz(day.set.az)], {...st, color: '#ef5350', weight: 3, opacity: .95}).addTo(sunLayer);
  }
  const vis0 = day.pts.filter(p => p.alt > 0);
  if (vis0.length) L.polyline(vis0.map(proj), {...st, color: '#ffca28', weight: 3.5, opacity: .95}).addTo(sunLayer);
  vis0.filter(p => p.m % 60 === 0).forEach(p => {
    L.circleMarker(proj(p), {pane: 'sun', interactive: false, radius: 3, color: '#ffca28', fillColor: '#ffca28', fillOpacity: 1, weight: 1}).addTo(sunLayer);
    sunLabel(proj({alt: p.alt - 6, az: p.az}), String(p.m / 60) + 'h', 'h').addTo(sunLayer);
  });
  if (s.alt > 0) {
    const sp = proj(s);
    L.polyline([[c.lat, c.lng], sp], {...st, color: '#ffd54f', weight: 2, dashArray: '2 6'}).addTo(sunLayer);
    L.circleMarker(sp, {pane: 'sun', interactive: false, radius: 10, color: '#fff', weight: 2, fillColor: '#ffd54f', fillOpacity: 1}).addTo(sunLayer);
  }
  // sombras da hora escolhida, ou o mapa de horas de sol do dia
  const shadows = [];
  sombreadores().forEach(b => { const sh = shadowOf(b, s); if (sh) shadows.push({b, sh}); });
  if (!heat) {
    heatLayer.clearLayers(); heatKey = ''; heatStats = null;
    // sombras unidas (sem escurecer em dobro), com borda suave pelo desfoque do painel
    const forte = unir(shadows.map(x => x.sh)), leve = unir(blocks.map(b => shadowTela(b, s)));
    if (leve) L.geoJSON(leve, {pane: 'shadows', interactive: false, style: {stroke: false, fillColor: '#08121c', fillOpacity: .2}}).addTo(shadowLayer);
    if (forte) L.geoJSON(forte, {pane: 'shadows', interactive: false, style: {stroke: false, fillColor: '#08121c', fillOpacity: .5}}).addTo(shadowLayer);
    sync3DSol(leve, forte);
  } else {
    sync3DSol(null, null);
    const k = heatSignature();
    if (k !== heatKey) { heatKey = k; clearTimeout(heatT); heatT = setTimeout(() => { computeHeat(); drawSun(); }, 200); }
  }
  solBar(c, s, day);
  sunTags(s, shadows, heat);
  // análise das quadras (painel Mapa e sol)
  const fmtAz = a => Math.round(a) + '° (' + rumo(a) + ')';
  let html = '';
  const courts = blocks.filter(b => TYPES[b.kind].court && vis.quadra);
  if (!courts.length) html += '<p class="hint">Insira uma quadra para avaliar a orientação e a insolação.</p>';
  courts.forEach(q => {
    const brg = (((90 - q.angle) % 180) + 180) % 180, dev = Math.min(brg, 180 - brg);
    const cls = dev <= 15 ? 'ok' : dev <= 25 ? 'mid' : 'bad', txt = dev <= 15 ? 'ótima' : dev <= 25 ? 'aceitável' : 'desfavorável';
    const glare = [];
    day.pts.forEach(p => {
      const dA = Math.min(...[brg, brg + 180].map(x => { const d0 = Math.abs(((p.az - x) % 360 + 360) % 360); return Math.min(d0, 360 - d0); }));
      const on = p.alt > 0 && p.alt < 20 && dA < 25, last = glare[glare.length - 1];
      if (on) { if (last && last[1] === p.m - 5) last[1] = p.m; else glare.push([p.m, p.m]); }
    });
    let sombra = '';
    if (s.alt > 0) {
      const qf = polyFeat(q.ring), qa = turf.area(qf);
      let un = null;
      shadows.filter(x => x.b !== q).forEach(x => { try { un = un ? turf.union(un, x.sh) : x.sh; } catch (e) {} });
      let ia = 0; if (un) { try { const it = turf.intersect(qf, un); ia = it ? turf.area(it) : 0; } catch (e) {} }
      sombra = `<br>Sombra sobre a quadra às ${hhmm(+$('sol-hora').value)}: <b>${Math.round(ia / qa * 100)}%</b>`;
    }
    const hs = heat && heatStats && heatStats.courts[q.id] !== undefined ? `<br>Sol direto no dia: <b>${fmt(heatStats.courts[q.id])} h</b> em média` : '';
    html += `<div class="sol-card"><b>${esc(q.name)}</b>: eixo a ${Math.round(brg)}° / ${Math.round((brg + 180) % 360)}° do norte verdadeiro<br>` +
      `Desvio do eixo norte–sul: ${Math.round(dev)}° · orientação <span class="${cls}">${txt}</span>` +
      (glare.length ? `<br>Sol baixo no eixo de jogo: ${glare.map(([a, b]) => hhmm(a) + '–' + hhmm(b + 5)).join(', ')}` : '<br>Sem sol baixo alinhado ao eixo nesta data') +
      sombra + hs + '</div>';
  });
  if (courts.length) html += '<p class="hint">Recomendação usual para tênis e padel ao ar livre: eixo maior na direção norte–sul, com desvio de até 15° a 20°, para o sol nascente e poente não ficar na linha de visão dos jogadores.</p>';
  solCourtsHtml = html;
  if (hudOpen && mTab === 'quadras') renderMetrics();
}
function setSol(on) {
  solOn = on;
  if (on) vis.sol = true;
  $('solbar').hidden = !on; document.body.classList.toggle('sol', on); $('cb-sol').classList.toggle('on-sol', on);
  syncSolLayers(); syncTerrLayers();
  if (on) { drawSun(); marcaGuia('sol'); carregaVizinhos(); } else { stopPlay(); solCourtsHtml = ''; map.removeLayer(vizLayer); sync3DSol(null, null); }
  if ($('v3d-sol')) $('v3d-sol').classList.toggle('on-sol', on);
}
function stopPlay() { clearInterval(solTimer); solTimer = null; $('sb-play').textContent = '▶'; }
function setSolDate(d) {
  const p2 = n => String(n).padStart(2, '0');
  $('sol-data').value = `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`; drawSun();
}
(function initSol() {
  const now = new Date();
  setSolDate(now);
  $('sol-hora').value = Math.round((now.getHours() * 60 + now.getMinutes()) / 5) * 5;
  $('sb-x').onclick = () => setSol(false);
  $('sol-data').onchange = drawSun;
  $('sol-hora').oninput = drawSun;
  $('sb-heat').onchange = drawSun;
  $('sb-viz').onchange = () => { VIZ.on = $('sb-viz').checked; if (VIZ.on) carregaVizinhos(); else { drawVizinhos(); drawSun(); if (map3d && !$('map3d').hidden) { map3d.getSource('estudo').setData(studyGeoJSON()); atualizaPredios3D(); } } };
  document.querySelectorAll('#solbar [data-md]').forEach(b => b.onclick = () => {
    const [mo, d] = b.dataset.md.split('-').map(Number); setSolDate(new Date(solDate(0).getFullYear(), mo - 1, d));
  });
  $('sb-play').onclick = () => {
    if (solTimer) { stopPlay(); return; }
    $('sb-play').textContent = '❚❚';
    solTimer = setInterval(() => {
      const day = dayScan(solCenter()); if (!day.rise) { stopPlay(); return; }
      let m = +$('sol-hora').value + 5;
      if (m > day.set.m || m < day.rise.m - 30) m = Math.floor((day.rise.m - 20) / 5) * 5;
      $('sol-hora').value = m; drawSun();
    }, 60);
  };
})();
