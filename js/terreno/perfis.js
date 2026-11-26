// ---------- Perfis do terreno (vários, com o terreno natural e o projeto) ----------
TERR.perfis = [];
const PERFIL_CORES = ['#ff6d00', '#8e24aa', '#00897b', '#3949ab', '#c0ca33', '#6d4c41'];
function startProfile() { TERR.profPts = []; TERR.prof = 'pick'; msg('Toque no ponto inicial e depois no ponto final do perfil.'); }
async function profileClick(latlng) {
  TERR.profPts.push(latlng);
  if (TERR.profPts.length === 1) { L.circleMarker(latlng, {radius: 5, color: '#fff', fillColor: '#ff6d00', fillOpacity: 1, weight: 2}).addTo(profLayer); return; }
  TERR.prof = null;
  const [A, B] = TERR.profPts, i = TERR.perfis.length;
  TERR.perfis.push({A, B, cor: PERFIL_CORES[i % PERFIL_CORES.length], letras: String.fromCharCode(65 + 2 * (i % 13)) + String.fromCharCode(66 + 2 * (i % 13))});
  await renderPerfis();
}
// Amostra um perfil: terreno natural, terreno com o projeto e onde a linha cruza a divisa do lote
async function perfilDados(P, mod) {
  const {A, B} = P, elev = await demFor(L.latLngBounds([A, B]).pad(0.1)); if (!elev) return null;
  const N = 120, D = map.distance(A, B), nat = [], prj = [];
  for (let k = 0; k <= N; k++) {
    const t = k / N, lat = A.lat + (B.lat - A.lat) * t, lng = A.lng + (B.lng - A.lng) * t, z = elev(lat, lng);
    nat.push([t * D, z]); prj.push([t * D, mod ? mod.z(lat, lng, z) : z]);
  }
  let smax = 0; for (let k = 1; k < nat.length; k++) smax = Math.max(smax, Math.abs(nat[k][1] - nat[k - 1][1]) / (nat[k][0] - nat[k - 1][0]) * 100);
  let divisas = [];
  if (lot) try { divisas = turf.lineIntersect(turf.lineString([[A.lng, A.lat], [B.lng, B.lat]]), turf.lineString(lot.ring)).features.map(f => map.distance(A, L.latLng(f.geometry.coordinates[1], f.geometry.coordinates[0]))).sort((a, b) => a - b); } catch (e) {}
  const mudou = !!mod && prj.some((p, k) => Math.abs(p[1] - nat[k][1]) > .05);
  let corte = 0, aterro = 0; prj.forEach((p, k) => { const dz = p[1] - nat[k][1]; if (dz > 0) aterro = Math.max(aterro, dz); else corte = Math.max(corte, -dz); });
  return {D, N, nat, prj, smax, divisas, mudou, corte, aterro, desn: nat[N][1] - nat[0][1]};
}
// Dois perfis automáticos (longitudinal e transversal pelo centro do lote), usados no relatório quando não há perfis desenhados
function perfisAuto() {
  if (!lot) return [];
  const c = turf.centroid(lot.feat).geometry.coordinates, r = lot.ring;
  let best = 0, ang = 0;
  for (let i = 0; i < r.length - 1; i++) { const d = turf.distance(r[i], r[i + 1], {units: 'meters'}); if (d > best) { best = d; ang = turf.bearing(r[i], r[i + 1]); } }
  const diag = Math.sqrt(turf.area(lot.feat)) * 2 + 40;
  return [[ang, '#ff6d00', 'AB'], [ang + 90, '#8e24aa', 'CD']].map(([b, cor, letras]) => {
    const p1 = turf.destination(c, diag, b, {units: 'meters'}), p2 = turf.destination(c, diag, b + 180, {units: 'meters'});
    let pts = turf.lineIntersect(turf.lineString([p2.geometry.coordinates, p1.geometry.coordinates]), turf.lineString(r)).features.map(f => f.geometry.coordinates);
    if (pts.length < 2) return null;
    pts.sort((u, v) => turf.distance(p2, u) - turf.distance(p2, v));
    const a = turf.destination(pts[0], 8, b + 180, {units: 'meters'}).geometry.coordinates, z = turf.destination(pts[pts.length - 1], 8, b, {units: 'meters'}).geometry.coordinates;
    return {A: L.latLng(a[1], a[0]), B: L.latLng(z[1], z[0]), cor, letras, auto: true};
  }).filter(Boolean);
}
async function renderPerfis() {
  profLayer.clearLayers();
  const box = $('terr-prof'); if (!box) return;
  if (!TERR.perfis.length) { box.innerHTML = ''; return; }
  if (lot) { try { await terrCompute(); } catch (e) {} }
  const mod = terrModel();
  let html = '';
  for (let i = 0; i < TERR.perfis.length; i++) {
    const P = TERR.perfis[i], {A, B, cor} = P, [la, lb] = P.letras.split('');
    L.polyline([A, B], {color: cor, weight: 3, dashArray: '6 4'}).addTo(profLayer);
    [[la, A], [lb, B]].forEach(([t, p]) => L.marker(p, {interactive: false, icon: L.divIcon({className: 'sun-lbl', html: `<span style="background:${cor};padding:1px 5px;border-radius:5px">${t}</span>`, iconSize: [22, 16], iconAnchor: [11, 22]})}).addTo(profLayer));
    const R = await perfilDados(P, mod); if (!R) continue;
    const {D, N, nat, prj, smax, mudou} = R;
    const zs = nat.concat(prj).map(p => p[1]), lo = Math.min(...zs), hi = Math.max(...zs), rng = Math.max(1, hi - lo);
    const Wd = 300, Hd = 120, X = d => 30 + d / D * (Wd - 40), Y = v => 10 + (1 - (v - lo) / rng) * (Hd - 30);
    const path = pts => pts.map((p, k) => (k ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join(' ');
    html += `<div class="perfil"><div class="perfil-h"><span class="dot" style="background:${cor}"></span><b>Perfil ${la}–${lb}</b><small>${fmt(D)} m</small><button class="xbtn" data-del="${i}" title="Apagar perfil">×</button></div>` +
      `<svg viewBox="0 0 ${Wd} ${Hd}" class="prof"><path d="${path(nat)} L${X(D)} ${Hd - 20} L${X(0)} ${Hd - 20}Z" fill="#a1887f" fill-opacity=".35"/><path d="${path(nat)}" fill="none" stroke="#6d4c41" stroke-width="2"/>` +
      R.divisas.map(d => `<line x1="${X(d)}" y1="8" x2="${X(d)}" y2="${Hd - 20}" stroke="#2b2b2b" stroke-width=".8" stroke-dasharray="2 2"/>`).join('') +
      (mudou ? `<path d="${path(prj)}" fill="none" stroke="#C8202F" stroke-width="2.2" stroke-dasharray="5 3"/>` : '') +
      `<text x="2" y="${Y(hi) + 4}">${fmt(hi)}</text><text x="2" y="${Y(lo) + 4}">${fmt(lo)}</text><text x="${X(0)}" y="${Hd - 6}">${la}</text><text x="${X(D) - 4}" y="${Hd - 6}">${lb}</text></svg>` +
      `<p class="hint">Desnível ${la}→${lb}: <b>${fmt(R.desn)} m</b> · inclinação média <b>${fmt(Math.abs(R.desn) / D * 100)}%</b> · trecho mais íngreme <b>${fmt(smax)}%</b>` +
      '<br><span style="color:#6d4c41">━ terreno natural</span>' + (mudou ? ' · <span style="color:#C8202F">┅ com o projeto</span>' : '') + (R.divisas.length ? ' · ┆ divisa do lote' : '') + '</p></div>';
  }
  box.innerHTML = html + '<p class="hint">Os perfis também vão para o relatório PDF (modo Pro).</p>';
  box.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { TERR.perfis.splice(+b.dataset.del, 1); renderPerfis(); });
}
