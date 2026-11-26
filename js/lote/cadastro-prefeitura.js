// ---------- Lotes do cadastro da prefeitura ----------
map.createPane('lotes').style.zIndex = 410;
const LT = {sets: [], cur: null, idx: -1, layer: L.layerGroup(), sel: -1, ran: false, fmts: [], zcfg: {}, opened: false};
const FMT_COLORS = ['#2e7d32', '#1565c0', '#f2a900', '#8e24aa', '#00838f', '#6d4c41', '#c2185b'];
// bases: as bases de lotes baixadas da pasta dados (js/dados.js); null = não carregou
function ltLoad(bases) {
  bases.forEach(b => { if (b) LT.sets.push({id: b.id, d: b.d, prep: null}); });
  if (!LT.sets.length) { $('lt-vazio').hidden = false; $('lt-box').hidden = true; return; }
  $('lt-reg').innerHTML = LT.sets.map((s, i) => `<option value="${i}">${esc(s.d.nome)}</option>`).join('');
  $('lt-reg').onchange = () => { ltSelect(+$('lt-reg').value); ltFocus(); };
  $('lt-run').onclick = ltRun;
  $('lt-show').onchange = ltDraw;
}
function segDist(p, a, b) {
  const vx = b[0] - a[0], vy = b[1] - a[1], l2 = vx * vx + vy * vy;
  let t = l2 ? ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / l2 : 0; t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - a[0] - t * vx, p[1] - a[1] - t * vy);
}
// Prepara a base: projeção local em metros, zona de cada lote e divisas voltadas para a rua
function ltPrepare(d) {
  let lat0 = 0, lng0 = 0; d.bairro.forEach(p => { lng0 += p[0]; lat0 += p[1]; }); lat0 /= d.bairro.length; lng0 /= d.bairro.length;
  const kx = R * Math.cos(lat0 * Math.PI / 180);
  const toM = p => [(p[0] - lng0) * kx, (p[1] - lat0) * R], toLL = (x, y) => [lng0 + x / kx, lat0 + y / R];
  const zonas = d.zonas.map(([sig, desc, polys]) => ({sig, desc, feat: turf.multiPolygon(polys)}));
  const lots = d.lotes.map(([id, nu, area, nEd, aEd, hMax, ring0]) => {
    const ring = ring0.filter((p, i) => i === 0 || p[0] !== ring0[i - 1][0] || p[1] !== ring0[i - 1][1]);
    if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) ring.push(ring[0].slice());
    const m = ring.map(toM);
    let cx = 0, cy = 0; m.slice(0, -1).forEach(p => { cx += p[0]; cy += p[1]; }); cx /= m.length - 1; cy /= m.length - 1;
    const cLL = toLL(cx, cy);
    const z = zonas.find(z => { try { return turf.booleanPointInPolygon(turf.point(cLL), z.feat); } catch (e) { return false; } });
    return {id, nu, area, nEd, aEd, hMax, ring, m, zone: z ? z.sig : '—', vago: aEd < 15};
  });
  // índice espacial das divisas: divisa sem lote vizinho do outro lado = frente para a rua
  const cell = 10, grid = new Map(), key = (i, j) => i + ',' + j;
  lots.forEach((L0, li) => {
    for (let k = 0; k < L0.m.length - 1; k++) {
      const a = L0.m[k], b = L0.m[k + 1];
      for (let i = Math.floor((Math.min(a[0], b[0]) - 2) / cell); i <= Math.floor((Math.max(a[0], b[0]) + 2) / cell); i++)
        for (let j = Math.floor((Math.min(a[1], b[1]) - 2) / cell); j <= Math.floor((Math.max(a[1], b[1]) + 2) / cell); j++) {
          const kk = key(i, j); if (!grid.has(kk)) grid.set(kk, []); grid.get(kk).push([li, k]);
        }
    }
  });
  lots.forEach((L0, li) => {
    const n = L0.m.length - 1, st = new Array(n).fill(null);
    for (let k = 0; k < n; k++) {
      const a = L0.m[k], b = L0.m[k + 1];
      if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 0.6) continue;
      let shared = 0;
      for (const t of [.2, .5, .8]) {
        const p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
        const cands = grid.get(key(Math.floor(p[0] / cell), Math.floor(p[1] / cell))) || [];
        if (cands.some(([lj, kj]) => lj !== li && segDist(p, lots[lj].m[kj], lots[lj].m[kj + 1]) < 1.5)) shared++;
      }
      st[k] = shared < 2;
    }
    for (let k = 0; k < n; k++) if (st[k] === null) st[k] = st[(k + n - 1) % n] === true; // divisas minúsculas seguem a anterior
    L0.fronts = st.map((v, k) => v ? k : -1).filter(k => k >= 0);
    if (!L0.fronts.length) { let best = 0, bl = 0; for (let k = 0; k < n; k++) { const l = Math.hypot(L0.m[k + 1][0] - L0.m[k][0], L0.m[k + 1][1] - L0.m[k][1]); if (l > bl) { bl = l; best = k; } } L0.fronts = [best]; }
    let per = 0; for (let k = 0; k < n; k++) per += Math.hypot(L0.m[k + 1][0] - L0.m[k][0], L0.m[k + 1][1] - L0.m[k][1]);
    L0.comp = per > 0 ? 4 * Math.PI * L0.area / (per * per) : 0; // 1 = círculo; faixas estreitas ficam perto de 0
    L0.testada = L0.fronts.reduce((s, k) => s + Math.hypot(L0.m[k + 1][0] - L0.m[k][0], L0.m[k + 1][1] - L0.m[k][1]), 0);
  });
  return {lots, zonas, toM, toLL};
}
function ltSelect(i) {
  const S = LT.sets[i]; if (!S.prep) { msg('Preparando a base de lotes…'); S.prep = ltPrepare(S.d); }
  LT.idx = i; LT.cur = S.prep; LT.ran = false; LT.sel = -1;
  $('lt-fonte').textContent = `${S.d.lotes.length.toLocaleString('pt-BR')} lotes. Fonte: ${S.d.fonte}. Baixado em ${S.d.data.split('-').reverse().join('/')}.`;
  // zonas presentes e recuos iniciais
  const cnt = {}; LT.cur.lots.forEach(l => { cnt[l.zone] = (cnt[l.zone] || 0) + 1; });
  LT.zcfg = {};
  Object.keys(cnt).sort().forEach(z => { LT.zcfg[z] = {on: z !== 'PA-1' && z !== '—', f: 3, d: 1.5, n: cnt[z]}; });
  $('lt-zonas').innerHTML = Object.entries(LT.zcfg).map(([z, c]) =>
    `<tr><td><input type="checkbox" data-z="${esc(z)}" data-p="on" ${c.on ? 'checked' : ''}></td><td><b>${esc(z)}</b></td>` +
    `<td><input type="number" step="0.5" min="0" value="${c.f}" data-z="${esc(z)}" data-p="f"></td>` +
    `<td><input type="number" step="0.5" min="0" value="${c.d}" data-z="${esc(z)}" data-p="d"></td><td>${c.n}</td></tr>`).join('');
  $('lt-zonas').onchange = e => { const t = e.target, c = LT.zcfg[t.dataset.z]; if (!c) return; if (t.dataset.p === 'on') c.on = t.checked; else c[t.dataset.p] = Math.max(0, parseFloat(t.value) || 0); };
  // formatos: plantas padrão, plantas importadas e quadra com escape mínimo
  const items = BUILTIN.filter(b => b.kind === 'dxf').concat(plantas.filter(p => p.kind === 'dxf').map(p => ({kind: 'dxf', name: p.name, w: p.w, h: p.h, src: p.id})))
    .sort((a, b) => b.w * b.h - a.w * a.h);
  LT.fmts = items.map((it, k) => ({...it, key: 'f' + k, on: true}));
  LT.fmts.push({kind: 'rapida', name: 'Quadra (escape mínimo)', w: COURT_MIN.w, h: COURT_MIN.h, key: 'court', on: false}, {kind: 'padel', name: 'Quadra de padel', w: 21, h: 11, key: 'padel', on: false});
  LT.fmts.forEach((f, k) => { f.color = FMT_COLORS[k % FMT_COLORS.length]; });
  $('lt-fmts').innerHTML = LT.fmts.map(f => `<label class="fmt-row"><input type="checkbox" data-k="${f.key}" ${f.on ? 'checked' : ''}><span class="dot" style="background:${f.color}"></span>${esc(f.name)} <small style="color:var(--muted)">${fmt(f.w)} × ${fmt(f.h)} m</small></label>`).join('');
  $('lt-fmts').onchange = e => { const f = LT.fmts.find(x => x.key === e.target.dataset.k); if (f) f.on = e.target.checked; };
  $('lt-res').innerHTML = '';
  LT.cur.lots.forEach(l => { delete l.out; delete l.best; l.fits = {}; });
  ltBuildLayer();
}
function ltFocus() {
  const b = LT.sets[LT.idx].d.bairro; map.fitBounds(L.latLngBounds(b.map(p => [p[1], p[0]])), {padding: [20, 20]});
}
function ltStyle(l, i) {
  let s;
  if (!LT.ran) s = {color: '#fff', weight: 1, opacity: .75, fillColor: '#fff', fillOpacity: .06};
  else if (l.out) s = {color: '#fff', weight: .7, opacity: .4, fillOpacity: 0};
  else if (l.best) s = {color: '#fff', weight: 1, opacity: .9, fillColor: l.best.color, fillOpacity: .55};
  else s = {color: '#fff', weight: 1, opacity: .8, fillColor: '#9e9e9e', fillOpacity: .4};
  if (i === LT.sel) s = {...s, color: '#ffeb3b', weight: 3.5, opacity: 1};
  return s;
}
function ltBuildLayer() {
  LT.layer.clearLayers();
  const b = LT.sets[LT.idx].d.bairro;
  L.polyline(b.map(p => [p[1], p[0]]), {pane: 'lotes', interactive: false, color: '#ffeb3b', weight: 2, dashArray: '8 6', opacity: .9}).addTo(LT.layer);
  LT.cur.lots.forEach((l, i) => {
    l.pl = L.polygon(ll(l.ring), {pane: 'lotes', ...ltStyle(l, i)}).addTo(LT.layer);
    l.pl.on('click', () => { lastHit = Date.now(); ltShow(i); });
  });
  ltDraw();
}
function ltDraw() {
  if (!LT.cur) return;
  if ($('lt-show').checked && LT.opened) LT.layer.addTo(map); else map.removeLayer(LT.layer);
  LT.cur.lots.forEach((l, i) => l.pl && l.pl.setStyle(ltStyle(l, i)));
}
function ltOpen() {
  if (!LT.sets.length) return;
  if (LT.idx < 0) ltSelect(0);
  if (!LT.opened) { LT.opened = true; ltFocus(); }
  ltDraw();
}
// Ponto dentro de polígono (anel em metros, sem repetir o primeiro ponto)
function pip(Q, x, y) {
  let ins = false;
  for (let i = 0, j = Q.length - 1; i < Q.length; j = i++) {
    const [xi, yi] = Q[i], [xj, yj] = Q[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}
function rectIn(Q, x0, y0, x1, y1) {
  const xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
  for (const [x, y] of [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [xm, y0], [x1, ym], [xm, y1], [x0, ym], [xm, ym]]) if (!pip(Q, x, y)) return false;
  for (const [x, y] of Q) if (x > x0 + 1e-6 && x < x1 - 1e-6 && y > y0 + 1e-6 && y < y1 - 1e-6) return false;
  return true;
}
function positions(min, slack) {
  if (slack < 1e-6) return [min];
  const step = slack < 2 ? Math.max(0.1, slack / 8) : Math.min(1, Math.max(0.5, slack / 30)), out = [];
  for (let v = 0; v < slack; v += step) out.push(min + v);
  out.push(min + slack);
  const mid = min + slack / 2; return out.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid));
}
// Procura uma posição para o retângulo w × h dentro da área edificável, alinhado às divisas e perto do centro
function fitRect(polys, w, h) {
  for (const P0 of polys) {
    const P = P0.slice(0, -1); if (P.length < 3) continue;
    let A = 0, cx = 0, cy = 0;
    P.forEach((p, i) => { const q = P[(i + 1) % P.length]; A += p[0] * q[1] - q[0] * p[1]; cx += p[0]; cy += p[1]; });
    if (Math.abs(A / 2) < w * h) continue;
    cx /= P.length; cy /= P.length;
    const edges = P.map((p, i) => { const q = P[(i + 1) % P.length]; return {a: Math.atan2(q[1] - p[1], q[0] - p[0]), l: Math.hypot(q[0] - p[0], q[1] - p[1])}; }).sort((a, b) => b.l - a.l);
    const H2 = Math.PI / 2, angs = [];
    for (const e of edges) {
      const a = ((e.a % H2) + H2) % H2;
      if (!angs.some(b => Math.abs(b - a) < .035 || Math.abs(b - a) > H2 - .035)) angs.push(a);
      if (angs.length >= 4) break;
    }
    for (const a of angs) {
      const co = Math.cos(-a), si = Math.sin(-a);
      const Q = P.map(([x, y]) => [(x - cx) * co - (y - cy) * si, (x - cx) * si + (y - cy) * co]);
      const xs0 = Q.map(p => p[0]), ys0 = Q.map(p => p[1]);
      const mnx = Math.min(...xs0), mny = Math.min(...ys0), bw = Math.max(...xs0) - mnx, bh = Math.max(...ys0) - mny;
      for (const [W, H, swap] of [[w, h, 0], [h, w, 1]]) {
        if (W > bw + 1e-6 || H > bh + 1e-6) continue;
        const xs = positions(mnx, bw - W), ys = positions(mny, bh - H);
        for (const x of xs) for (const y of ys) {
          if (!rectIn(Q, x, y, x + W, y + H)) continue;
          const rx = x + W / 2, ry = y + H / 2, c2 = Math.cos(a), s2 = Math.sin(a);
          return {x: rx * c2 - ry * s2 + cx, y: rx * s2 + ry * c2 + cy, ang: (a * 180 / Math.PI + (swap ? 90 : 0)) % 360};
        }
      }
    }
  }
  return null;
}
async function ltRun() {
  if (!LT.cur) return;
  const fm = LT.fmts.filter(f => f.on);
  if (!fm.length) { msg('Marque pelo menos um formato.'); return; }
  const amin = num('lt-amin'), amax = num('lt-amax') || Infinity, soVago = $('lt-vago').checked, S = LT.cur, btn = $('lt-run');
  btn.disabled = true; ltHide();
  const minA = Math.min(...fm.map(f => f.w * f.h));
  for (let i = 0; i < S.lots.length; i++) {
    const l = S.lots[i], zc = LT.zcfg[l.zone];
    l.fits = {}; l.best = null; l.bArea = 0;
    l.out = !zc || !zc.on ? 'zona fora da busca' : (l.area < amin || l.area > amax) ? 'área fora do filtro' : (soVago && !l.vago) ? 'lote edificado' : '';
    if (!l.out) {
      const bld = computeBuildable(l.ring, l.fronts, zc.f, zc.d);
      l.bArea = bld ? turf.area(bld) : 0;
      if (l.bArea >= minA) {
        const polys = polysOf(bld).map(r => r.map(S.toM));
        for (const f of fm) if (f.w * f.h <= l.bArea) { const r = fitRect(polys, f.w + 0.1, f.h + 0.1); if (r) l.fits[f.key] = r; }
      }
      l.best = fm.find(f => l.fits[f.key]) || null;
    }
    if (i % 40 === 39) { btn.textContent = `Analisando ${i + 1} de ${S.lots.length}…`; await new Promise(r => setTimeout(r, 0)); }
  }
  LT.ran = true; btn.disabled = false; btn.textContent = 'Analisar de novo';
  ltDraw(); ltSummary();
}
function ltSummary() {
  const S = LT.cur, ins = S.lots.filter(l => !l.out), fm = LT.fmts.filter(f => f.on);
  const rows = fm.map(f => [f, ins.filter(l => l.best === f).length]);
  let h = `<div class="lt-sum"><span></span><span>Lotes analisados</span><b>${ins.length}</b>` +
    rows.map(([f, n]) => `<span class="dot" style="background:${f.color}"></span><span>Maior que cabe: ${esc(f.name)}</span><b>${n}</b>`).join('') +
    `<span class="dot" style="background:#9e9e9e"></span><span>Não cabe nenhum</span><b>${ins.filter(l => !l.best).length}</b></div>`;
  // ordem: maior formato e, dentro dele, lotes mais compactos (faixas e sobras de terreno vão para o fim)
  const ok = ins.filter(l => l.best).sort((a, b) => fm.indexOf(a.best) - fm.indexOf(b.best) || b.comp - a.comp).slice(0, 60);
  h += '<div class="lt-list">' + ok.map(l => `<button data-i="${S.lots.indexOf(l)}"><span class="dot" style="background:${l.best.color}"></span><span style="flex:1">Lote ${esc(l.nu)}<br><small>${fmt(l.area)} m² · ${esc(l.zone)} · testada ${fmt(l.testada)} m</small></span><small>${esc(l.best.name)}</small></button>`).join('') + '</div>';
  if (ins.filter(l => l.best).length > 60) h += '<p class="hint">Mostrando os 60 primeiros. Todos aparecem coloridos no mapa.</p>';
  $('lt-res').innerHTML = h;
  $('lt-res').querySelectorAll('[data-i]').forEach(b => b.onclick = () => {
    const i = +b.dataset.i; map.fitBounds(L.latLngBounds(ll(S.lots[i].ring)), {padding: [80, 80], maxZoom: 19}); ltShow(i);
  });
}
function ltHide() { $('lotcard').hidden = true; if (LT.sel >= 0 && LT.cur) { const i = LT.sel; LT.sel = -1; const l = LT.cur.lots[i]; l.pl && l.pl.setStyle(ltStyle(l, i)); } }
function ltShow(i) {
  if (sel) select(null);
  if (innerWidth < 700 && tool) closePop(); // no celular a ficha precisa do mapa à vista
  const prev = LT.sel; LT.sel = i;
  [prev, i].forEach(k => { if (k >= 0) { const l = LT.cur.lots[k]; l.pl && l.pl.setStyle(ltStyle(l, k)); } });
  const l = LT.cur.lots[i], zc = LT.zcfg[l.zone], c = $('lotcard');
  const chips = LT.ran && !l.out ? '<div class="chips">' + LT.fmts.filter(f => f.on).map(f => l.fits[f.key]
    ? `<span class="chip on" style="background:${f.color}">✓ ${esc(f.name)}</span>` : `<span class="chip off">${esc(f.name)}</span>`).join('') + '</div>' : '';
  c.innerHTML = `<div class="hd"><div><b>Lote CTM ${esc(l.nu)}</b> <span class="tag">${esc(l.zone)}</span></div><button class="xbtn" id="lc-x" aria-label="Fechar">×</button></div>` +
    `<div class="facts">Área ${fmt(l.area)} m² · frente para a rua ${fmt(l.testada)} m<br>` +
    (l.vago ? 'Sem edificação no cadastro' : `Edificado: ${fmt(l.aEd)} m² em projeção, até ${fmt(l.hMax)} m de altura`) +
    (zc ? `<br>Recuos usados: frente ${fmt(zc.f)} m · demais ${fmt(zc.d)} m` : '') +
    (LT.ran && !l.out ? `<br>Área edificável: ${fmt(l.bArea)} m²` : '') +
    (LT.ran && l.out ? `<br>Fora da busca: ${l.out}` : '') + '</div>' + chips;
  const use = document.createElement('button'); use.className = 'btn primary';
  use.textContent = l.best ? `Usar no estudo com ${l.best.name}` : 'Usar este lote no estudo';
  use.onclick = () => ltUse(i);
  c.appendChild(use); c.hidden = false;
  $('lc-x').onclick = ltHide;
}
function ltUse(i) {
  const S = LT.cur, l = S.lots[i], zc = LT.zcfg[l.zone] || {f: 3, d: 1.5};
  $('recuo-f').value = zc.f; $('recuo').value = zc.d;
  setLot(l.ring.map(p => p.slice()), l.fronts.slice());
  if (l.best && l.fits[l.best.key]) {
    const r = l.fits[l.best.key], [lng, lat] = S.toLL(r.x, r.y), f = l.best;
    addBlock({kind: f.kind, name: f.name, w: f.w, h: f.h, src: f.src, angle: Math.round(((r.ang % 360) + 360) % 360 * 10) / 10}, L.latLng(lat, lng));
  }
  ltHide(); $('lt-show').checked = false; ltDraw(); closePop();
  msg(`Lote ${l.nu} levado para o estudo, com os recuos da zona ${l.zone}. Os lotes voltam em Lotes → Mostrar lotes no mapa.`);
}
