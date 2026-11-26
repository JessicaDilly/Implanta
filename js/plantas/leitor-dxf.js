// ---------- Leitor de DXF: converte a planta em desenho humanizado ----------
const PLANS = {}, BUILTIN = [];
function dxfToPlan(text) {
  const raw = text.split(/\r?\n/), G = [];
  for (let i = 0; i + 1 < raw.length; i += 2) G.push([parseInt(raw[i], 10), raw[i + 1].trim()]);
  let sec = null, cur = null, curBlock = null, target = null, insunits = 0, hdrVar = '';
  const layers = {}, blocks = {}, ents = [], tables = [];
  const gv = (e, c) => { for (const [k, v] of e.g) if (k === c) return v; return undefined; };
  const gn = (e, c, d = 0) => { const v = gv(e, c); return v === undefined ? d : parseFloat(v); };
  const flush = () => {
    if (cur && cur.type === 'BLOCK' && curBlock) { curBlock.name = gv(cur, 2) || ''; curBlock.base = [gn(cur, 10), gn(cur, 20)]; }
    else if (cur && target) target.push(cur);
    cur = null;
  };
  for (const [c, v] of G) {
    if (c === 0) {
      flush();
      if (v === 'SECTION') { sec = 'pending'; target = null; continue; }
      if (v === 'ENDSEC') { sec = null; target = null; continue; }
      if (sec === 'BLOCKS' && v === 'BLOCK') { curBlock = {name: '', base: [0, 0], ents: []}; cur = {type: 'BLOCK', g: []}; target = null; continue; }
      if (sec === 'BLOCKS' && v === 'ENDBLK') { if (curBlock) blocks[curBlock.name] = curBlock; curBlock = null; target = null; continue; }
      cur = {type: v, g: []};
      target = sec === 'ENTITIES' ? ents : (sec === 'BLOCKS' && curBlock) ? curBlock.ents : sec === 'TABLES' ? tables : null;
      continue;
    }
    if (sec === 'pending' && c === 2) { sec = v; continue; }
    if (sec === 'HEADER') { if (c === 9) hdrVar = v; else if (hdrVar === '$INSUNITS' && c === 70) insunits = parseInt(v, 10); continue; }
    if (cur) cur.g.push([c, v]);
  }
  flush();
  tables.forEach(t => { if (t.type === 'LAYER') layers[gv(t, 2)] = {color: gn(t, 62, 7), flags: gn(t, 70, 0)}; });
  const hidden = name => {
    const l = layers[name];
    if (l && (l.color < 0 || (l.flags & 1))) return true;
    return /COTA|DIM|DEFPOINTS|ESPECIFICA|VIEWPORT|CARIMBO|NORTE|HACHURA ?CORTE/i.test(name);
  };
  const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
                         m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
  const ap = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  const FLIP = [-1, 0, 0, 1, 0, 0];
  const STEP = Math.PI / 18;
  const arcPts = (cx, cy, r, a0, a1) => {
    const n = Math.max(4, Math.ceil(Math.abs(a1 - a0) / STEP)), out = [];
    for (let i = 0; i <= n; i++) { const t = a0 + (a1 - a0) * i / n; out.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); }
    return out;
  };
  const bulgePts = (p, q, b) => {
    if (!b) return [q];
    const th = 4 * Math.atan(b), dx = q[0] - p[0], dy = q[1] - p[1], ch = Math.hypot(dx, dy);
    if (ch < 1e-12) return [q];
    const r = ch / (2 * Math.sin(th / 2)), hd = r * Math.cos(th / 2);
    const cx = (p[0] + q[0]) / 2 - dy / ch * hd, cy = (p[1] + q[1]) / 2 + dx / ch * hd;
    const a0 = Math.atan2(p[1] - cy, p[0] - cx);
    return arcPts(cx, cy, Math.abs(r), a0, a0 + th).slice(1);
  };
  const vsToPts = (vs, closed) => {
    if (!vs.length) return [];
    const pts = [[vs[0].x, vs[0].y]], n = vs.length;
    for (let i = 0; i < (closed ? n : n - 1); i++) { const a = vs[i], b = vs[(i + 1) % n]; pts.push(...bulgePts([a.x, a.y], [b.x, b.y], a.b)); }
    return pts;
  };
  function parseHatch(e) {
    const g = e.g; let i = g.findIndex(([k]) => k === 91);
    if (i < 0) return [];
    const nLoops = parseInt(g[i][1], 10); i++;
    const next = code => { while (i < g.length && g[i][0] !== code) i++; const v = i < g.length ? parseFloat(g[i][1]) : 0; i++; return v; };
    const peek = code => i < g.length && g[i][0] === code;
    const loops = [];
    for (let L = 0; L < nLoops && i < g.length; L++) {
      const flag = next(92);
      if (flag & 2) {
        const hasB = next(72); next(73); const nv = next(93), vs = [];
        for (let k = 0; k < nv; k++) { const x = next(10), y = next(20); let b = 0; if (hasB && peek(42)) { b = parseFloat(g[i][1]); i++; } vs.push({x, y, b}); }
        loops.push(vsToPts(vs, true));
      } else {
        const ne = next(93), pts = [];
        for (let k = 0; k < ne; k++) {
          const t = next(72);
          if (t === 1) { const x1 = next(10), y1 = next(20), x2 = next(11), y2 = next(21); if (!pts.length) pts.push([x1, y1]); pts.push([x2, y2]); }
          else if (t === 2) {
            const cx = next(10), cy = next(20), r = next(40), a0 = next(50) * Math.PI / 180, a1 = next(51) * Math.PI / 180, ccw = next(73);
            if (ccw) { let e1 = a1; while (e1 <= a0) e1 += 2 * Math.PI; pts.push(...arcPts(cx, cy, r, a0, e1)); }
            else { let s0 = -a0, s1 = -a1; while (s1 >= s0) s1 -= 2 * Math.PI; pts.push(...arcPts(cx, cy, r, s0, s1)); }
          } else if (t === 3) {
            const cx = next(10), cy = next(20), mx = next(11), my = next(21), ra = next(40);
            let a0 = next(50) * Math.PI / 180, a1 = next(51) * Math.PI / 180; const ccw = next(73);
            if (!ccw) { a0 = -a0; a1 = -a1; while (a1 >= a0) a1 -= 2 * Math.PI; } else while (a1 <= a0) a1 += 2 * Math.PI;
            const n = Math.max(6, Math.ceil(Math.abs(a1 - a0) / STEP));
            for (let q = 0; q <= n; q++) { const tt = a0 + (a1 - a0) * q / n; pts.push([cx + mx * Math.cos(tt) - ra * my * Math.sin(tt), cy + my * Math.cos(tt) + ra * mx * Math.sin(tt)]); }
          } else if (t === 4) {
            next(94); const rat = next(73); next(74); const nk = next(95), nc = next(96);
            for (let q = 0; q < nk; q++) next(40);
            for (let q = 0; q < nc; q++) { const x = next(10), y = next(20); if (rat && peek(42)) i++; pts.push([x, y]); }
            if (peek(97)) { const nf = parseInt(g[i][1], 10); i++; for (let q = 0; q < nf; q++) { next(11); next(21); } }
          }
        }
        loops.push(pts);
      }
      if (peek(97)) { const ns = parseInt(g[i][1], 10); i++; for (let q = 0; q < ns; q++) if (peek(330)) i++; }
    }
    return loops;
  }
  const prims = [], texts = [];
  const add = (layer, rings, closed, fill, m, extra) => {
    const rr = rings.filter(r => r.length > 1).map(r => r.map(p => ap(m, p[0], p[1])));
    if (rr.length) prims.push({layer, rings: rr, closed, fill, ...(extra || {})});
  };
  const clean = s => s.replace(/\\P/g, ' ').replace(/\\[A-Za-z][^;\\{}]*;/g, '').replace(/\\[LlOoKk~]/g, '').replace(/[{}]/g, '')
                      .replace(/%%[cC]/g, 'Ø').replace(/%%[dD]/g, '°').replace(/%%[pP]/g, '±').replace(/\s+/g, ' ').trim();
  const mRot = m => Math.atan2(m[1], m[0]) * 180 / Math.PI, mScale = m => Math.hypot(m[0], m[1]);
  function walk(list, m, parentLayer, depth) {
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      if (gn(e, 67) === 1) continue; // espaço do papel
      let layer = gv(e, 8) || '0';
      if (layer === '0' && parentLayer) layer = parentLayer;
      if (hidden(layer)) continue;
      const ocs = gn(e, 230, 1) < 0 ? mul(m, FLIP) : m;
      switch (e.type) {
        case 'LINE': add(layer, [[[gn(e, 10), gn(e, 20)], [gn(e, 11), gn(e, 21)]]], false, false, m); break;
        case 'LWPOLYLINE': {
          const vs = []; let v = null;
          for (const [k, val] of e.g) { if (k === 10) { v = {x: parseFloat(val), y: 0, b: 0}; vs.push(v); } else if (k === 20 && v) v.y = parseFloat(val); else if (k === 42 && v) v.b = parseFloat(val); }
          const closed = (gn(e, 70) & 1) === 1;
          add(layer, [vsToPts(vs, closed)], closed, false, ocs); break;
        }
        case 'POLYLINE': {
          const flags = gn(e, 70), vs = []; let j = i + 1;
          while (j < list.length && list[j].type === 'VERTEX') { const q = list[j]; vs.push({x: gn(q, 10), y: gn(q, 20), b: gn(q, 42)}); j++; }
          if (j < list.length && list[j].type === 'SEQEND') j++;
          i = j - 1;
          if (!(flags & 80)) add(layer, [vsToPts(vs, (flags & 1) === 1)], (flags & 1) === 1, false, ocs);
          break;
        }
        case 'ARC': {
          const a0 = gn(e, 50) * Math.PI / 180; let a1 = gn(e, 51) * Math.PI / 180; while (a1 <= a0) a1 += 2 * Math.PI;
          add(layer, [arcPts(gn(e, 10), gn(e, 20), gn(e, 40), a0, a1)], false, false, ocs); break;
        }
        case 'CIRCLE': add(layer, [arcPts(gn(e, 10), gn(e, 20), gn(e, 40), 0, 2 * Math.PI)], true, false, ocs); break;
        case 'ELLIPSE': {
          const cx = gn(e, 10), cy = gn(e, 20), mx = gn(e, 11), my = gn(e, 21), ra = gn(e, 40, 1);
          const t0 = gn(e, 41, 0); let t1 = gn(e, 42, 2 * Math.PI); while (t1 <= t0) t1 += 2 * Math.PI;
          const n = Math.max(8, Math.ceil((t1 - t0) / STEP)), pts = [];
          for (let k = 0; k <= n; k++) { const t = t0 + (t1 - t0) * k / n; pts.push([cx + mx * Math.cos(t) - ra * my * Math.sin(t), cy + my * Math.cos(t) + ra * mx * Math.sin(t)]); }
          add(layer, [pts], Math.abs(t1 - t0 - 2 * Math.PI) < 1e-6, false, m); break;
        }
        case 'SPLINE': {
          const fit = [], ctl = []; let px = null;
          for (const [k, val] of e.g) {
            if (k === 10 || k === 11) px = [k, parseFloat(val)];
            else if ((k === 20 || k === 21) && px) { (px[0] === 11 ? fit : ctl).push([px[1], parseFloat(val)]); px = null; }
          }
          add(layer, [fit.length > 1 ? fit : ctl], (gn(e, 70) & 1) === 1, false, m); break;
        }
        case 'SOLID': case 'TRACE': case '3DFACE':
          add(layer, [[[gn(e, 10), gn(e, 20)], [gn(e, 11), gn(e, 21)], [gn(e, 13), gn(e, 23)], [gn(e, 12), gn(e, 22)]]], true, true, e.type === '3DFACE' ? m : ocs); break;
        case 'HATCH': add(layer, parseHatch(e), true, true, ocs, {pat: (gv(e, 2) || '').toUpperCase(), solid: gn(e, 70) === 1 || /SOLID/i.test(gv(e, 2) || '')}); break;
        case 'TEXT': {
          const s = clean(gv(e, 1) || ''); if (!s) break;
          const hj = gn(e, 72), vj = gn(e, 73), al = hj || vj;
          const p = ap(ocs, al ? gn(e, 11) : gn(e, 10), al ? gn(e, 21) : gn(e, 20));
          texts.push({layer, s, x: p[0], y: p[1], h: gn(e, 40, 0.2) * mScale(ocs), rot: gn(e, 50) + mRot(ocs),
                      anchor: ['start', 'middle', 'end', 'middle', 'middle', 'start'][hj] || 'start',
                      base: hj === 4 || vj === 2 ? 'middle' : vj === 3 ? 'hanging' : 'alphabetic'});
          break;
        }
        case 'MTEXT': {
          let s = ''; for (const [k, val] of e.g) if (k === 3) s += val;
          s = clean(s + (gv(e, 1) || '')); if (!s) break;
          const at = gn(e, 71, 1), p = ap(m, gn(e, 10), gn(e, 20));
          let rot = gv(e, 50) !== undefined ? gn(e, 50) : Math.atan2(gn(e, 21, 0), gn(e, 11, 1)) * 180 / Math.PI;
          texts.push({layer, s, x: p[0], y: p[1], h: gn(e, 40, 0.2) * mScale(m), rot: rot + mRot(m),
                      anchor: ['start', 'middle', 'end'][(at - 1) % 3], base: ['hanging', 'middle', 'alphabetic'][Math.floor((at - 1) / 3)]});
          break;
        }
        case 'INSERT': {
          if (depth > 8) break;
          const blk = blocks[gv(e, 2)]; if (!blk) break;
          const sx = gn(e, 41, 1), sy = gn(e, 42, 1), r = gn(e, 50) * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
          const local = [c * sx, s * sx, -s * sy, c * sy, gn(e, 10), gn(e, 20)];
          walk(blk.ents, mul(mul(ocs, local), [1, 0, 0, 1, -blk.base[0], -blk.base[1]]), layer, depth + 1);
          break;
        }
      }
    }
  }
  walk(ents, [1, 0, 0, 1, 0, 0], null, 0);
  if (!prims.length) return null;

  // Contorno da edificação: limites das paredes, descartando pontos soltos longe do desenho
  const wallRe = /CINZA|PARED|ALVEN|P0[1-6]/i;
  let base = prims.filter(p => wallRe.test(p.layer));
  if (base.length < 3) base = prims;
  const xs = [], ys = [];
  base.forEach(p => p.rings.forEach(r => r.forEach(q => { xs.push(q[0]); ys.push(q[1]); })));
  // Usa os limites das paredes; só descarta pontos soltos quando o desenho é grande demais para ser uma edificação
  const lim = arr => {
    const s = arr.slice().sort((a, b) => a - b), full = [s[0], s[s.length - 1]];
    const lo = s[Math.floor(s.length * 0.02)], hi = s[Math.ceil(s.length * 0.98) - 1], R = (hi - lo) || 1;
    if (full[1] - full[0] <= 4 * R) return full;
    const k = s.filter(v => v >= lo - R && v <= hi + R);
    return [k[0], k[k.length - 1]];
  };
  const [x0, x1] = lim(xs), [y0, y1] = lim(ys);
  let wU = x1 - x0;
  const k = wU <= 300 ? 1 : insunits === 4 && wU / 1000 >= 2 ? 0.001 : insunits === 5 ? 0.01 : wU > 10000 ? 0.001 : 0.01;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, mg = 0.6 / k;
  const inBox = p => p.rings.some(r => r.some(q => q[0] >= x0 - mg && q[0] <= x1 + mg && q[1] >= y0 - mg && q[1] <= y1 + mg));
  const W = (x1 - x0) * k, H = (y1 - y0) * k;
  const X = x => ((x - cx) * k).toFixed(3), Y = y => (-(y - cy) * k).toFixed(3);
  const d = p => p.rings.map(r => 'M' + r.map(q => X(q[0]) + ' ' + Y(q[1])).join('L') + (p.closed ? 'Z' : '')).join('');

  // Estilo humanizado por camada
  const furn = L => /M[ÓO]VE/.test(L) ? '#e3c9a3' : /LOU[CÇ]/.test(L) ? '#ffffff' : /METAI/.test(L) ? '#e3e8ec' : /PEDRA|GRANITO|BANCADA/.test(L) ? '#d8d1c4' : /EQUIP/.test(L) ? '#e6eaee' : null;
  function st(p) {
    const L = p.layer.toUpperCase();
    if (p.fill) {
      const pat = p.pat || '';
      // hachuras de padrão viram acabamento de piso; só a hachura sólida cinza é parede ou pilar
      if (/NET|ANGLE|GRID|BOX/.test(pat)) return {z: 0.5, fill: '#dfe7ec'};
      if (/SAND|CONC/.test(pat)) return {z: 0.5, fill: '#dcd8d0'};
      if (/HONEY|BRICK|HEX/.test(pat)) return {z: 0.5, fill: '#e7e0d3'};
      if (p.solid === false) return {z: 0.5, fill: '#e3ddd1'};
      if (/CINZA ESC|PARED|ALVEN/.test(L)) return {z: 3, fill: '#34373a'};
      if (/CINZA/.test(L)) return {z: 1, fill: '#9ea3a8'};
      if (/VIDRO|ESQUADRIA/.test(L)) return {z: 1, fill: '#cfe3ee'};
      const f = furn(L); if (f) return {z: 2, fill: f === '#ffffff' ? '#f4f6f8' : f};
      return {z: 1, fill: '#b9ad9a', op: 0.45};
    }
    let s;
    if (/PROJE/.test(L)) s = {z: 4, stroke: '#7d858c', w: 0.8, dash: '0.25 0.15'};
    else if (/MOBILI|EQUIP|LOU[CÇ]|METAI/.test(L)) s = {z: 4, stroke: '#6f655a', w: 0.7, fill: p.closed ? furn(L) : null};
    else if (/ESQUADRIA|VISTA|CURVA/.test(L)) s = {z: 4, stroke: '#4f6f86', w: 0.7};
    else if (/P01/.test(L)) s = {z: 5, stroke: '#1f2225', w: 1.6};
    else if (/P02/.test(L)) s = {z: 5, stroke: '#2a2d30', w: 1.2};
    else if (/P03/.test(L)) s = {z: 5, stroke: '#3a3e42', w: 0.9};
    else if (/P05|P06/.test(L)) s = {z: 4, stroke: '#5f666d', w: 0.6};
    else s = {z: 4, stroke: '#4a5056', w: 0.8};
    return s;
  }
  const groups = {};
  prims.filter(inBox).forEach(p => {
    const s = st(p);
    const key = [s.z, s.fill || '', s.op || '', s.stroke || '', s.w || '', s.dash || ''].join('|');
    (groups[key] = groups[key] || {s, ds: []}).ds.push(d(p));
  });
  let out = `<rect x="${(-W / 2).toFixed(3)}" y="${(-H / 2).toFixed(3)}" width="${W.toFixed(3)}" height="${H.toFixed(3)}" fill="#f2ece2"/>`;
  Object.values(groups).sort((a, b) => a.s.z - b.s.z).forEach(({s, ds}) => {
    const fillAttr = s.fill ? `fill="${s.fill}"${s.op ? ` fill-opacity="${s.op}"` : ''} fill-rule="evenodd"` : 'fill="none"';
    const strokeAttr = s.stroke ? ` class="nss" stroke="${s.stroke}" stroke-width="${s.w}" stroke-linejoin="round" stroke-linecap="round"${s.dash ? ` stroke-dasharray="${s.dash}"` : ''}` : '';
    out += `<path ${fillAttr}${strokeAttr} d="${ds.join('')}"/>`;
  });
  texts.filter(t => t.x >= x0 - mg && t.x <= x1 + mg && t.y >= y0 - mg && t.y <= y1 + mg).forEach(t => {
    const big = /TX-03|AMBIENTE|NOME/i.test(t.layer), fs = Math.max(0.12, t.h * k);
    const tx = X(t.x), ty = Y(t.y);
    out += `<text x="${tx}" y="${ty}" font-size="${fs.toFixed(3)}" text-anchor="${t.anchor}" dominant-baseline="${t.base}"` +
      (Math.abs(t.rot) > 0.5 ? ` transform="rotate(${(-t.rot).toFixed(2)} ${tx} ${ty})"` : '') +
      ` fill="${big ? '#2f3438' : '#5a6168'}" font-weight="${big ? 600 : 400}" font-family="system-ui,sans-serif"` +
      ` stroke="#f2ece2" stroke-width="${(fs * 0.18).toFixed(3)}" paint-order="stroke">${esc(t.s)}</text>`;
  });
  return {inner: out, w: Math.round(W * 100) / 100, h: Math.round(H * 100) / 100};
}
