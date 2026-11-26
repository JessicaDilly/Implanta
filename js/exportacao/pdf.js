// ---------- PDF no padrão da marca Implanta ----------
// One: prancha única com leitura simples. Pro: relatório completo (prancha, índices, terreno e terraplenagem, insolação).
const PDFC = {red: [200, 32, 47], redD: [184, 28, 43], ink: [43, 43, 43], mut: [112, 112, 112], warm: [231, 229, 225], warm2: [244, 242, 238], line: [220, 216, 210], ok: [46, 125, 50], bad: [211, 47, 47], na: [176, 184, 192]};
function pdfLogo(doc, x, y, s) { // ícone da opção C, simplificado
  const k = s / 512;
  doc.setFillColor(...PDFC.red); doc.roundedRect(x, y, s, s, 104 * k, 104 * k, 'F');
  doc.setFillColor(255, 255, 255); doc.roundedRect(x + 110 * k, y + 196 * k, 292 * k, 262 * k, 10 * k, 10 * k, 'F');
  doc.setFillColor(208, 42, 53); doc.rect(x + 214 * k, y + 246 * k, 84 * k, 170 * k, 'F');
  doc.setDrawColor(255, 255, 255); doc.setLineWidth(20 * k); doc.circle(x + 256 * k, y + 118 * k, 44 * k, 'S');
  doc.line(x + 256 * k, y + 118 * k, x + 256 * k, y + 80 * k); doc.setLineWidth(.2);
}
function pdfWord(doc, x, y, size) {
  doc.setFont('helvetica', 'bold'); doc.setFontSize(size);
  doc.setTextColor(...PDFC.ink); doc.text('im', x, y); const w = doc.getTextWidth('im');
  doc.setTextColor(...PDFC.red); doc.text('planta', x + w, y);
}
function pdfFrame(doc, P, titulo, sub) {
  const {W, H, M} = P;
  doc.setFillColor(...PDFC.warm2); doc.rect(0, 0, W, 24, 'F');
  pdfLogo(doc, M, 5, 14); pdfWord(doc, M + 17, 15.5, 20);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(...PDFC.ink); doc.text(titulo, W - M, 11.5, {align: 'right'});
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...PDFC.mut); doc.text(sub, W - M, 18, {align: 'right'});
  doc.setFillColor(...PDFC.red); doc.rect(0, 24, W, 1.2, 'F');
  // rodapé
  doc.setDrawColor(...PDFC.line); doc.setLineWidth(.3); doc.line(M, H - 11, W - M, H - 11);
  doc.setFontSize(7.5); doc.setTextColor(...PDFC.mut);
  doc.text('implanta · estudos de implantação', M, H - 6.5);
  doc.text('Estudo preliminar. Recuos, índices e terreno devem ser conferidos na legislação municipal e em levantamento topográfico.', W / 2, H - 6.5, {align: 'center'});
}
function pdfPageNums(doc, P) {
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setFontSize(7.5); doc.setTextColor(...PDFC.mut); doc.text(`página ${i} de ${n}`, P.W - P.M, P.H - 6.5, {align: 'right'}); }
}
function pdfSec(doc, x, y, w, t) {
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(...PDFC.red); doc.text(t.toUpperCase(), x, y);
  doc.setDrawColor(...PDFC.red); doc.setLineWidth(.5); doc.line(x, y + 1.8, x + w, y + 1.8); doc.setLineWidth(.2);
  return y + 7.5;
}
// tabela simples com faixas alternadas; cols = larguras; al = alinhamentos
function pdfTable(doc, x, y, cols, rows, opt = {}) {
  const rh = opt.rh || 6.2, fs = opt.fs || 8.8, al = opt.al || cols.map((_, i) => i ? 'right' : 'left'), w = cols.reduce((a, v) => a + v, 0);
  rows.forEach((r, ri) => {
    const head = opt.head && ri === 0;
    if (head) { doc.setFillColor(...PDFC.ink); doc.rect(x, y - rh + 1.6, w, rh, 'F'); }
    else if (ri % 2 === (opt.head ? 1 : 0)) { doc.setFillColor(...PDFC.warm2); doc.rect(x, y - rh + 1.6, w, rh, 'F'); }
    let cx = x;
    r.forEach((cell, ci) => {
      const c = typeof cell === 'object' && cell ? cell : {t: String(cell ?? '')};
      doc.setFont('helvetica', head || c.b ? 'bold' : 'normal'); doc.setFontSize(head ? fs - .4 : fs);
      doc.setTextColor(...(head ? [255, 255, 255] : c.c || PDFC.ink));
      if (c.dot) { doc.setFillColor(...c.dot); doc.circle(cx + 2.2, y - 1.3, 1.3, 'F'); }
      const tx = al[ci] === 'right' ? cx + cols[ci] - 1.5 : cx + (c.dot ? 5.5 : 1.5);
      doc.text(doc.splitTextToSize(c.t, cols[ci] - 3)[0] || '', tx, y, {align: al[ci] === 'right' ? 'right' : 'left'});
      cx += cols[ci];
    });
    y += rh;
  });
  return y + 2;
}
function pdfPara(doc, x, y, w, t, fs = 9, cor = PDFC.ink) {
  doc.setFont('helvetica', 'normal'); doc.setFontSize(fs); doc.setTextColor(...cor);
  const ls = doc.splitTextToSize(t, w); doc.text(ls, x, y); return y + ls.length * fs * .42 + 1.5;
}
// Diagrama solar (vista de cima): trajetória do sol na data escolhida e nos solstícios
function pdfSunChart(doc, cx, cy, r, c) {
  doc.setDrawColor(...PDFC.line); doc.setLineWidth(.3);
  [0, 30, 60].forEach(a => doc.circle(cx, cy, r * (90 - a) / 90, 'S'));
  doc.line(cx - r, cy, cx + r, cy); doc.line(cx, cy - r, cx, cy + r);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...PDFC.red); doc.text('N', cx, cy - r - 2, {align: 'center'});
  doc.setTextColor(...PDFC.mut); doc.text('S', cx, cy + r + 4.5, {align: 'center'}); doc.text('L', cx + r + 2.5, cy + 1.2); doc.text('O', cx - r - 5, cy + 1.2);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.text('30°', cx + 1, cy - r * 60 / 90 - .8); doc.text('60°', cx + 1, cy - r * 30 / 90 - .8);
  const P = q => { const rr = r * (90 - q.alt) / 90, a = q.az * Math.PI / 180; return [cx + rr * Math.sin(a), cy - rr * Math.cos(a)]; };
  const curva = (date, cor, dash) => {
    const pts = []; for (let m = 0; m <= 1440; m += 10) { const s = sunPos(new Date(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(m / 60), m % 60), c.lat, c.lng); if (s.alt > 0) pts.push(P(s)); }
    doc.setDrawColor(...cor); doc.setLineWidth(dash ? .4 : .9); if (dash) doc.setLineDashPattern([1.2, 1], 0);
    for (let i = 1; i < pts.length; i++) doc.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
    doc.setLineDashPattern([], 0); doc.setLineWidth(.2);
  };
  const y0 = solDate(0).getFullYear();
  curva(new Date(y0, 5, 21), [120, 144, 156], true); curva(new Date(y0, 11, 21), [239, 108, 0], true);
  curva(solDate(0), PDFC.red, false);
  for (let h = 6; h <= 18; h += 2) { const s = sunPos(solDate(h * 60), c.lat, c.lng); if (s.alt > 0) { const p = P(s); doc.setFillColor(...PDFC.red); doc.circle(p[0], p[1], .8, 'F'); doc.setFontSize(6.5); doc.setTextColor(...PDFC.ink); doc.text(h + 'h', p[0] + 1.2, p[1] - 1); } }
  const s = sunPos(solDate(), c.lat, c.lng); if (s.alt > 0) { const p = P(s); doc.setFillColor(255, 202, 40); doc.setDrawColor(...PDFC.ink); doc.circle(p[0], p[1], 2, 'FD'); }
  doc.setFontSize(7); doc.setTextColor(...PDFC.mut);
  doc.text('— dia escolhido   - - inverno (21/06)   - - verão (21/12)', cx, cy + r + 10, {align: 'center'});
}
// Dados de insolação (mesmo cálculo da barra de insolação), para o PDF
function sunReport() {
  const c = solCenter(), s = sunPos(solDate(), c.lat, c.lng), day = dayScan(c);
  const shadows = sombreadores().map(b => ({b, sh: shadowOf(b, s)})).filter(x => x.sh);
  const els = blocks.filter(b => b.kind !== 'arvore').map(b => {
    let v = 0;
    if (s.alt > 0) {
      const bf = polyFeat(b.ring), outras = unir(shadows.filter(x => x.b !== b).map(x => x.sh).concat(blocks.filter(o => o !== b).map(o => shadowTela(o, s))));
      let sa = 0; if (outras) { try { const it = turf.intersect(bf, outras); sa = it ? turf.area(it) : 0; } catch (e) {} }
      v = 1 - Math.min(1, sa / turf.area(bf));
    }
    return {b, v, horas: heatStats && heatStats.courts[b.id]};
  });
  const quadras = blocks.filter(b => TYPES[b.kind].court).map(q => {
    const brg = (((90 - q.angle) % 180) + 180) % 180, dev = Math.min(brg, 180 - brg), glare = [];
    day.pts.forEach(p => {
      const dA = Math.min(...[brg, brg + 180].map(x => { const d0 = Math.abs(((p.az - x) % 360 + 360) % 360); return Math.min(d0, 360 - d0); }));
      const on = p.alt > 0 && p.alt < 20 && dA < 25, last = glare[glare.length - 1];
      if (on) { if (last && last[1] === p.m - 5) last[1] = p.m; else glare.push([p.m, p.m]); }
    });
    return {q, brg, dev, glare};
  });
  return {c, s, day, els, quadras};
}
// Cartões de números-chave (rótulo pequeno em cima, valor grande embaixo)
function pdfCards(doc, x, y, w, cards, cols) {
  const n = cols || cards.length, gap = 3, cw = (w - gap * (n - 1)) / n, ch = 17;
  cards.forEach((c, i) => {
    const cx = x + (i % n) * (cw + gap), cy = y + Math.floor(i / n) * (ch + gap);
    doc.setFillColor(...PDFC.warm2); doc.roundedRect(cx, cy, cw, ch, 2, 2, 'F');
    doc.setFillColor(...(c[3] || PDFC.red)); doc.rect(cx, cy + 2, .9, ch - 4, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...PDFC.mut); doc.text(String(c[0]).toUpperCase(), cx + 3.5, cy + 5.5);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12.5); doc.setTextColor(...(c[3] || PDFC.ink)); doc.text(String(c[1]), cx + 3.5, cy + 12.3);
    if (c[2]) { doc.setFont('helvetica', 'normal'); doc.setFontSize(6.8); doc.setTextColor(...PDFC.mut); doc.text(String(c[2]), cx + cw - 2.5, cy + 12.3, {align: 'right'}); }
  });
  return y + Math.ceil(cards.length / n) * (ch + gap) + 3;
}
// Gráfico de um perfil do terreno no PDF
function pdfPerfil(doc, x, y, w, h, P, R) {
  const [la, lb] = P.letras.split(''), cor = hexRgb(P.cor);
  doc.setFillColor(...cor); doc.circle(x + 1.6, y - 1.2, 1.6, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...PDFC.ink); doc.text(`Perfil ${la}–${lb}`, x + 5, y);
  const x0 = x + 15, x1 = x + w - 2, y0 = y + 5, y1 = y + h - 13;
  const zs = R.nat.concat(R.prj).map(p => p[1]); let lo = Math.min(...zs), hi = Math.max(...zs); const pad = Math.max(.5, (hi - lo) * .12); lo -= pad; hi += pad;
  const ex = ((y1 - y0) / (hi - lo)) / ((x1 - x0) / R.D);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...PDFC.mut); doc.text(`${fmt(R.D)} m` + (ex > 1.15 ? ` · escala vertical ${fmt(ex)}x` : ' · escalas iguais') + (P.auto ? ' · automático' : ''), x + w, y, {align: 'right'});
  const X = d => x0 + d / R.D * (x1 - x0), Y = z => y1 - (z - lo) / (hi - lo) * (y1 - y0);
  doc.setDrawColor(...PDFC.line); doc.setLineWidth(.2); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...PDFC.mut);
  const ez = [.5, 1, 2, 5, 10, 20, 50, 100].find(s => (hi - lo) / s <= 6) || 200;
  for (let z = Math.ceil(lo / ez) * ez; z <= hi; z += ez) { doc.line(x0, Y(z), x1, Y(z)); doc.text(fmt(z), x0 - 1.5, Y(z) + 1, {align: 'right'}); }
  const ed = [5, 10, 20, 25, 50, 100, 200].find(s => R.D / s <= 8) || 500;
  for (let d = 0; d <= R.D + .01; d += ed) { doc.line(X(d), y1, X(d), y1 + 1.2); doc.text(fmt(d), X(d), y1 + 4, {align: 'center'}); }
  // solo (natural) preenchido
  const pts = R.nat.map(p => [X(p[0]), Y(p[1])]).concat([[x1, y1], [x0, y1]]);
  doc.setFillColor(222, 211, 200); doc.lines(pts.slice(1).map((p, i) => [p[0] - pts[i][0], p[1] - pts[i][1]]), pts[0][0], pts[0][1], [1, 1], 'F', true);
  const linha = (arr, rgb, lw, dash) => { doc.setDrawColor(...rgb); doc.setLineWidth(lw); if (dash) doc.setLineDashPattern(dash, 0); for (let i = 1; i < arr.length; i++) doc.line(X(arr[i - 1][0]), Y(arr[i - 1][1]), X(arr[i][0]), Y(arr[i][1])); doc.setLineDashPattern([], 0); doc.setLineWidth(.2); };
  linha(R.nat, [109, 76, 65], .55);
  if (R.mudou) linha(R.prj, PDFC.red, .6, [1.4, .8]);
  doc.setDrawColor(...PDFC.ink); doc.setLineDashPattern([.6, .6], 0);
  R.divisas.forEach(d => { doc.line(X(d), y0, X(d), y1); doc.setFontSize(6); doc.setTextColor(...PDFC.ink); doc.text('divisa', X(d) + .8, y1 - 1.5); });
  doc.setLineDashPattern([], 0);
  doc.setDrawColor(...PDFC.ink); doc.setLineWidth(.3); doc.rect(x0, y0, x1 - x0, y1 - y0); doc.setLineWidth(.2);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...cor); doc.text(la, x0 + 1.2, y0 + 3.5); doc.text(lb, x1 - 1.2, y0 + 3.5, {align: 'right'});

  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...PDFC.ink);
  doc.text(`Desnível ${la} a ${lb}: ${fmt(R.desn)} m · inclinação média ${fmt(Math.abs(R.desn) / R.D * 100)}% · trecho mais íngreme ${fmt(R.smax)}%`, x, y + h - 5);
  doc.setTextColor(...PDFC.red); doc.text(R.mudou ? `Com o projeto: corte de até ${fmt(R.corte)} m e aterro de até ${fmt(R.aterro)} m` : 'O projeto não altera o terreno neste corte.', x, y + h - 1);
}
// Planta-chave dos perfis: lote, elementos e linhas dos cortes
function pdfMapaPerfis(doc, x, y, w, h, perfis) {
  const pts = lot.ring.slice(); perfis.forEach(P => { pts.push([P.A.lng, P.A.lat], [P.B.lng, P.B.lat]); });
  const lat0 = pts[0][1], kx = R * Math.cos(lat0 * Math.PI / 180), loc = p => [(p[0] - pts[0][0]) * kx, (p[1] - lat0) * R];
  const L2 = pts.map(loc), xs = L2.map(p => p[0]), ys = L2.map(p => p[1]), mx = Math.min(...xs), Mx = Math.max(...xs), my = Math.min(...ys), My = Math.max(...ys);
  const s = Math.min((w - 10) / (Mx - mx || 1), (h - 10) / (My - my || 1)), ox = x + (w - (Mx - mx) * s) / 2, oy = y + (h - (My - my) * s) / 2;
  const T = p => { const q = loc(p); return [ox + (q[0] - mx) * s, oy + (My - q[1]) * s]; };
  const poly = (ring, style) => { const q = ring.map(T); doc.lines(q.slice(1).map((p, i) => [p[0] - q[i][0], p[1] - q[i][1]]), q[0][0], q[0][1], [1, 1], style, true); };
  doc.setFillColor(...PDFC.warm2); doc.roundedRect(x, y, w, h, 2, 2, 'F');
  doc.setFillColor(255, 255, 255); doc.setDrawColor(...PDFC.ink); doc.setLineWidth(.5); poly(lot.ring, 'FD'); doc.setLineWidth(.2);
  doc.setFillColor(205, 200, 192); doc.setDrawColor(150, 144, 136);
  blocks.filter(b => b.kind !== 'arvore').forEach(b => poly(b.ring, 'FD'));
  perfis.forEach(P => {
    const a = T([P.A.lng, P.A.lat]), b = T([P.B.lng, P.B.lat]), cor = hexRgb(P.cor), [la, lb] = P.letras.split('');
    doc.setDrawColor(...cor); doc.setLineWidth(.7); doc.setLineDashPattern([1.5, 1], 0); doc.line(a[0], a[1], b[0], b[1]); doc.setLineDashPattern([], 0); doc.setLineWidth(.2);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...cor);
    [[la, a], [lb, b]].forEach(([t, p]) => { doc.setFillColor(255, 255, 255); doc.circle(p[0], p[1], 2.4, 'F'); doc.text(t, p[0], p[1] + 1.1, {align: 'center'}); });
  });
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...PDFC.red); doc.text('N', x + w - 4, y + 6, {align: 'right'});
}
async function exportPdf() {
  if (!window.jspdf) { msg('O gerador de PDF não carregou. Verifique a conexão e recarregue a página.'); return; }
  msg('Gerando o PDF…');
  const sel0 = sel; if (sel) select(null);
  const pro = modo === 'pro';
  if (lot && pro) { try { await terrCompute(); } catch (e) {} }
  let {cv, R0} = await mapCanvas(true), img, semSat = false;
  try { img = cv.toDataURL('image/jpeg', 0.92); }
  catch (e) { ({cv, R0} = await mapCanvas(false)); img = cv.toDataURL('image/jpeg', 0.92); semSat = true; }
  const {jsPDF} = window.jspdf, doc = new jsPDF({orientation: 'landscape', unit: 'mm', format: 'a3'});
  const P = {W: 420, H: 297, M: 14};
  const d = JSON.parse(snapshot()), m = computeMetrics(d, buildable || null); try { m.terr = terrSummary(); } catch (e) { m.terr = null; }
  const ck = checks(m, zp), SR = sunReport();
  const local = pinAt && pinAt.label ? pinAt.label.split(',').slice(0, 3).join(',') : '';
  const opc = opts.length > 1 ? opts[oi].name + ' · ' : '';
  const sub = opc + (local ? local + ' · ' : '') + new Date().toLocaleDateString('pt-BR');
  const pct = v => m.lotA ? (v / m.lotA * 100).toFixed(1).replace('.', ',') + '%' : '—';
  // ---- Página 1: prancha de implantação ----
  pdfFrame(doc, P, pro ? '1 · Implantação' : 'Estudo de implantação', sub);
  const side = 112, top = 32, boxW = P.W - 2 * P.M - side - 8, boxH = P.H - top - 16;
  const k = Math.min(boxW / R0.width, boxH / R0.height), iw = R0.width * k, ih = R0.height * k, ix = P.M, iy = top;
  doc.addImage(img, 'JPEG', ix, iy, iw, ih);
  doc.setDrawColor(...PDFC.ink); doc.setLineWidth(.4); doc.rect(ix, iy, iw, ih); doc.setLineWidth(.2);
  // norte (no padrão da marca: círculo com traço)
  const nx = ix + iw - 13, ny = iy + 14;
  doc.setFillColor(255, 255, 255); doc.circle(nx, ny, 8.5, 'F');
  doc.setDrawColor(...PDFC.red); doc.setLineWidth(1.1); doc.circle(nx, ny, 5.2, 'S'); doc.line(nx, ny, nx, ny - 8); doc.setLineWidth(.2);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...PDFC.red); doc.text('N', nx, ny + 7.6, {align: 'center'});
  // escala gráfica
  const mPerMm = mpp() / k, nice = [5, 10, 20, 25, 50, 100, 200, 500].find(v => v / mPerMm >= 25) || 500, bl = nice / mPerMm, sx = ix + 8, sy = iy + ih - 9;
  doc.setFillColor(255, 255, 255); doc.roundedRect(sx - 4, sy - 7.5, bl + 52, 12, 2, 2, 'F');
  doc.setFillColor(...PDFC.ink); doc.rect(sx, sy, bl / 2, 1.6, 'F'); doc.setDrawColor(...PDFC.ink); doc.rect(sx + bl / 2, sy, bl / 2, 1.6);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...PDFC.ink);
  doc.text('0', sx, sy - 1.5, {align: 'center'}); doc.text(nice + ' m', sx + bl, sy - 1.5, {align: 'center'});
  doc.text('1:' + (Math.round(mPerMm * 1000 / 50) * 50).toLocaleString('pt-BR') + ' (A3)', sx + bl + 4, sy + 1.6);
  // coluna da direita: números-chave, quadro de áreas, elementos
  const nOk = ck.filter(c => c.st === 'ok').length, nBad = ck.filter(c => c.st === 'bad').length;
  let x = P.W - P.M - side, y = top + 4;
  y = pdfSec(doc, x, y, side, 'Resumo');
  y = pdfCards(doc, x, y, side, [
    ['Área do lote', fmt(m.lotA) + ' m²'], ['Taxa de ocupação', pct(m.proj)],
    ['Coef. aproveitamento', m.ca.toFixed(2).replace('.', ',')], ['Área livre', pct(m.livre)],
    ['Vagas', String(m.vagas)], ['Situação', m.fora || nBad ? 'Atenção' : 'Conforme', m.fora ? m.fora + ' fora do recuo' : nBad ? nBad + ' alerta(s)' : '', m.fora || nBad ? PDFC.bad : PDFC.ok]], 2);
  y = pdfSec(doc, x, y + 1, side, 'Quadro de áreas');
  y = pdfTable(doc, x, y, [62, 50], [
    ['Área do lote', {t: fmt(m.lotA) + ' m²', b: 1}], ['Área edificável (após recuos)', fmt(m.edA) + ' m²'],
    ['Recuos: frente / demais', fmt(num('recuo-f')) + ' / ' + fmt(num('recuo')) + ' m'],
    ['Edificações (projeção)', fmt(m.proj) + ' m² · ' + pct(m.proj)], ['Quadras com escape', fmt(m.quadraA) + ' m² · ' + pct(m.quadraA)],
    ['Estacionamento', m.vagas + ' vagas · ' + fmt(m.vagaA) + ' m²'], ['Caminhos', fmt(m.camA || 0) + ' m² · ' + pct(m.camA || 0)],
    ['Área livre', {t: fmt(m.livre) + ' m² · ' + pct(m.livre), b: 1}]]);
  y = pdfSec(doc, x, y + 1, side, 'Elementos');
  const elRows = blocks.filter(b => b.kind !== 'arvore').slice(0, pro ? 10 : 12).map(b => [{t: b.name, c: b.ok ? PDFC.ink : PDFC.bad}, fmt(b.w) + ' × ' + fmt(b.h) + ' m']);
  const nArv = blocks.filter(b => b.kind === 'arvore').length;
  if (nArv) elRows.push([nArv + (nArv > 1 ? ' árvores' : ' árvore'), '']);
  y = pdfTable(doc, x, y, [72, 40], elRows.length ? elRows : [['Nenhum elemento', '']]);
  if (blocks.some(b => !b.ok)) y = pdfPara(doc, x, y, side, 'Em vermelho: elementos fora da área edificável (recuos).', 7.5, PDFC.bad);
  if (!pro) { // leitura simples do modo One
    y = pdfSec(doc, x, y + 2, side, 'Leitura do estudo');
    const al = [];
    if (m.fora) al.push(`${m.fora} elemento(s) passam do recuo.`);
    m.quadras.filter(q => q.dev > 25).forEach(q => al.push(`${q.name}: comprimento fora do eixo norte–sul (sol baixo na linha de jogo).`));
    y = pdfPara(doc, x, y, side, al.length ? al.join(' ') : 'Tudo dentro do lote e dos recuos; quadras bem orientadas em relação ao sol.', 9);
    if (m.terr) y = pdfPara(doc, x, y + 1, side, terrPlain(m.terr).replace(/<br>/g, ' ').replace(/<[^>]+>/g, ''), 9);
    y = pdfSec(doc, x, Math.max(y + 2, P.H - 52), side, 'Insolação');
    pdfPara(doc, x, y, side, `${solDate().toLocaleDateString('pt-BR')} às ${hhmm(+$('sol-hora').value)}: sol a ${Math.round(SR.s.az)}° (${rumo(SR.s.az)}), altura ${Math.round(Math.max(0, SR.s.alt))}°.` +
      (SR.day.rise ? ` Nascer ${hhmm(SR.day.rise.m)} e pôr do sol ${hhmm(SR.day.set.m)}.` : ''), 8.5);
  }
  // perfis do relatório: os desenhados no painel Terreno ou, se não houver, dois automáticos
  const perfisPdf = pro && lot ? (TERR.perfis.length ? TERR.perfis : perfisAuto()) : [];
  const SUM = pro ? [['1', 'Implantação', 'planta, resumo e quadro de áreas'], ['2', 'Índices e conformidade', 'índices urbanísticos, checagem da zona e elementos'],
    ['3', 'Terreno e terraplenagem', 'relevo, plataformas, taludes e volumes'], ['4', 'Perfis do terreno', perfisPdf.length + ' corte(s) com o terreno natural e o projeto'], ['5', 'Insolação', 'trajetória do sol, quadras e sol sobre os elementos'], ['6', 'Orçamento estimado', 'faixa de investimento, etapas e ajustes possíveis']] : [];
  if (pro) { // sumário no pé da coluna
    let ys = Math.max(y + 3, P.H - 68);
    ys = pdfSec(doc, x, ys, side, 'Neste relatório');
    SUM.forEach(([n, t, d]) => {
      doc.setFillColor(...PDFC.red); doc.circle(x + 2.2, ys - 1.2, 2.2, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(255, 255, 255); doc.text(n, x + 2.2, ys, {align: 'center'});
      doc.setTextColor(...PDFC.ink); doc.setFontSize(8.5); doc.text(t, x + 6.5, ys); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.2); doc.setTextColor(...PDFC.mut); doc.text(d, x + 6.5, ys + 3.4);
      ys += 8;
    });
  }
  doc.setFontSize(7); doc.setTextColor(...PDFC.mut);
  doc.text((semSat ? 'Imagem de satélite indisponível neste PDF.' : 'Imagem: ' + ({sat: 'Esri, Maxar, Earthstar Geographics', osm: '© OpenStreetMap', mbsat: '© Mapbox © OpenStreetMap', mbstr: '© Mapbox © OpenStreetMap', paper: 'fundo papel'}[bg] || '')), x, P.H - 14);

  if (pro) {
    const colW = (P.W - 2 * P.M - 16) / 2, xb0 = P.M + colW + 16, fullW = P.W - 2 * P.M;
    let xa = P.M, ya, xb = xb0, yb;
    // ---- 2. Índices e conformidade ----
    doc.addPage('a3', 'landscape'); pdfFrame(doc, P, '2 · Índices e conformidade', sub);
    ya = pdfCards(doc, P.M, top + 2, fullW, [
      ['Taxa de ocupação', pct(m.proj), zp.to != null ? 'limite ' + zp.to + '%' : ''], ['Coef. de aproveitamento', m.ca.toFixed(2).replace('.', ','), zp.ca != null ? 'limite ' + String(zp.ca).replace('.', ',') : ''],
      ['Área permeável (estim.)', pct(m.livre), zp.perm != null ? 'mínimo ' + zp.perm + '%' : ''], ['Altura máxima', fmt(m.hmax) + ' m', zp.alt != null ? 'limite ' + zp.alt + ' m' : ''],
      ['Checagem da zona', nOk + ' ok · ' + nBad + ' alerta(s)', '', nBad ? PDFC.bad : PDFC.ok]]);
    yb = ya;
    ya = pdfSec(doc, xa, ya + 2, colW, 'Índices urbanísticos');
    ya = pdfTable(doc, xa, ya, [colW - 50, 50], [['Índice', 'Valor'],
      ['Área do lote', fmt(m.lotA) + ' m²'], ['Perímetro', fmt(m.perim) + ' m'], ['Frente para a rua', fmt(m.testada) + ' m'],
      ['Área edificável (após recuos)', fmt(m.edA) + ' m²'], ['Projeção das edificações', fmt(m.proj) + ' m²'],
      ['Taxa de ocupação', pct(m.proj)], ['Área construída', fmt(m.constr) + ' m²'],
      ['Coeficiente de aproveitamento', m.ca.toFixed(2).replace('.', ',')], ['Área permeável (estimada)', pct(m.livre)],
      ['Altura máxima', fmt(m.hmax) + ' m'], ['Vagas', String(m.vagas)]], {head: 1});
    ya = pdfSec(doc, xa, ya + 4, colW, 'Checagem da zona' + (lot && lot.zone ? ' (' + lot.zone + ')' : ''));
    ya = pdfTable(doc, xa, ya, [colW - 70, 70], [['Item', 'Situação']].concat(ck.map(c => [{t: c.label, dot: PDFC[c.st]}, {t: c.st === 'na' ? 'sem limite informado' : c.txt, c: c.st === 'bad' ? PDFC.bad : PDFC.ink}])), {head: 1});
    ya = pdfPara(doc, xa, ya, colW, `Limites usados: taxa de ocupação ${zp.to ?? '—'}% · coeficiente ${zp.ca ?? '—'} · permeabilidade ${zp.perm ?? '—'}% · altura ${zp.alt ?? '—'} m. Campos sem valor não são verificados.`, 8, PDFC.mut);
    yb = pdfSec(doc, xb, yb + 2, colW, 'Elementos do estudo');
    const er = [['Elemento', 'Medidas', 'Pav.', 'Altura', 'Situação']].concat(blocks.slice(0, 22).map(b => [b.name, b.kind === 'arvore' ? 'Ø ' + fmt(b.w) + ' m' : fmt(b.w) + ' × ' + fmt(b.h) + ' m', PAV_KINDS[b.kind] ? String(pavOf(b)) : '—', altOf(b) ? fmt(altOf(b)) + ' m' : '—', {t: b.ok ? 'ok' : 'fora do recuo', c: b.ok ? PDFC.ok : PDFC.bad}]));
    yb = pdfTable(doc, xb, yb, [colW - 112, 40, 18, 24, 30], er, {head: 1, al: ['left', 'right', 'right', 'right', 'right']});
    if (blocks.length > 22) yb = pdfPara(doc, xb, yb, colW, `+ ${blocks.length - 22} elementos não listados.`, 8, PDFC.mut);
    if (opts.length > 1) {
      saveOpt();
      yb = pdfSec(doc, xb, yb + 4, colW, 'Comparação das opções');
      const ms = opts.map(o => ({o, m: computeMetrics(JSON.parse(o.s))})), cw = (colW - 60) / ms.length;
      yb = pdfTable(doc, xb, yb, [60, ...ms.map(() => cw)], [['', ...ms.map(x2 => x2.o.name)],
        ['Taxa de ocupação', ...ms.map(x2 => pctS(x2.m.to))], ['Coef. de aproveitamento', ...ms.map(x2 => x2.m.ca.toFixed(2).replace('.', ','))],
        ['Quadras', ...ms.map(x2 => String(x2.m.quadras.length))], ['Vagas', ...ms.map(x2 => String(x2.m.vagas))],
        ['Área livre', ...ms.map(x2 => pctS(x2.m.perm))], ['Fora do recuo', ...ms.map(x2 => String(x2.m.fora))]], {head: 1});
    }
    // ---- 3. Terreno e terraplenagem ----
    doc.addPage('a3', 'landscape'); pdfFrame(doc, P, '3 · Terreno e terraplenagem', sub);
    if (!m.terr) pdfPara(doc, P.M, top + 6, colW, lot ? 'Não foi possível carregar a elevação do terreno (verifique a conexão).' : 'Desenhe o lote para analisar o terreno.', 10);
    else {
      const s = m.terr;
      ya = pdfCards(doc, P.M, top + 2, fullW, [
        ['Cotas do lote', fmt(s.zmin) + ' a ' + fmt(s.zmax) + ' m'], ['Desnível', fmt(s.zmax - s.zmin) + ' m'], ['Declividade média', fmt(s.decMed) + '%'],
        ['Corte total', fmt(s.corte) + ' m³', '', [109, 76, 65]], ['Aterro total', fmt(s.aterro) + ' m³', '', [21, 101, 192]], ['Saldo', fmt(s.corte - s.aterro) + ' m³', s.corte >= s.aterro ? 'sobra terra' : 'falta terra']]);
      yb = ya; xa = P.M;
      ya = pdfSec(doc, xa, ya + 2, colW, 'Relevo do lote');
      ya = pdfTable(doc, xa, ya, [colW - 50, 50], [['Item', 'Valor'],
        ['Cotas do lote', fmt(s.zmin) + ' a ' + fmt(s.zmax) + ' m'], ['Desnível', fmt(s.zmax - s.zmin) + ' m'],
        ['Declividade média', fmt(s.decMed) + '%'], ['Declividade máxima', fmt(s.decMax) + '%'], ['Área acima de 30%', pctS(s.pct30)]], {head: 1});
      ya = pdfSec(doc, xa, ya + 4, colW, 'Leitura');
      ya = pdfPara(doc, xa, ya, colW, terrPlain(s).replace(/<br>/g, ' ').replace(/<[^>]+>/g, ''), 9.5);
      const al = [];
      if (s.decMed >= 30) al.push('Declividade média acima de 30%: parcelamento com condições especiais (Lei 6.766/79).');
      s.plats.filter(q => Math.max(q.p.hc, q.p.ha) > 3).forEach(q => al.push(`${q.bk.name}: diferença de até ${fmt(Math.max(q.p.hc, q.p.ha))} m; prever muro de arrimo ou talude.`));
      (s.taludeFora || []).forEach(n => al.push(`${n}: o talude passa da divisa do lote.`));
      if (al.length) { ya = pdfSec(doc, xa, ya + 3, colW, 'Alertas'); al.forEach(a => { ya = pdfPara(doc, xa, ya, colW, '• ' + a, 9, PDFC.bad); }); }
      yb = pdfSec(doc, xb, yb + 2, colW, 'Plataformas e taludes');
      const pr = [['Plataforma', 'Cota', 'Corte', 'Aterro', 'Talude', 'Corte tal.', 'Aterro tal.']].concat(s.plats.map(({bk, p, t}) => [bk.name, fmt(p.cota) + (p.auto ? '*' : ''), fmt(p.corte) + ' m³', fmt(p.aterro) + ' m³', t && t.larg ? fmt(t.larg) + ' m' : '—', t ? fmt(t.vc) + ' m³' : '—', t ? fmt(t.va) + ' m³' : '—']));
      pr.push([{t: 'Total', b: 1}, '', {t: fmt(s.corte) + ' m³', b: 1}, {t: fmt(s.aterro) + ' m³', b: 1}, '', '', '']);
      yb = pdfTable(doc, xb, yb, [colW - 136, 22, 22, 22, 20, 25, 25], pr, {head: 1, al: ['left', 'right', 'right', 'right', 'right', 'right', 'right']});
      yb = pdfPara(doc, xb, yb, colW, `Os totais incluem os taludes. * cota igual à média do terreno sob a plataforma. Taludes: corte ${String(TAL.rc).replace('.', ',')}:1 e aterro ${String(TAL.ra).replace('.', ',')}:1 (H:V). Os cortes do terreno estão na página 4.`, 8.5, PDFC.mut);
      yb = pdfPara(doc, xb, yb + 2, colW, 'Elevação: AWS Terrain Tiles (modelo global, cerca de 30 m de resolução). Valores para triagem de viabilidade; para projeto e orçamento, use levantamento topográfico.', 8, PDFC.mut);
    }
    // ---- 4. Perfis do terreno ----
    doc.addPage('a3', 'landscape'); pdfFrame(doc, P, '4 · Perfis do terreno', sub);
    if (!perfisPdf.length) pdfPara(doc, P.M, top + 6, colW, 'Desenhe o lote para gerar os perfis do terreno.', 10);
    else {
      const mod = terrModel(), dados = [];
      for (const Pf of perfisPdf) { const Rr = await perfilDados(Pf, mod); if (Rr) dados.push([Pf, Rr]); }
      const mapW = 105;
      let ym = pdfSec(doc, P.M, top + 4, mapW, 'Planta-chave');
      pdfMapaPerfis(doc, P.M, ym, mapW, 105, perfisPdf);
      ym = pdfSec(doc, P.M, ym + 113, mapW, 'Como ler');
      ym = pdfPara(doc, P.M, ym, mapW, 'Marrom: terreno natural. Vermelho tracejado: terreno com o projeto (plataformas na cota escolhida e taludes de corte e aterro). Linhas pontilhadas: divisas do lote cortadas pelo perfil.', 8.5);
      ym = pdfPara(doc, P.M, ym + 1, mapW, TERR.perfis.length ? 'Perfis desenhados no painel Terreno.' : 'Nenhum perfil foi desenhado no painel Terreno; o relatório traz um corte longitudinal (A–B) e um transversal (C–D) pelo centro do lote.', 8, PDFC.mut);
      const gx = P.M + mapW + 12, gw = P.W - P.M - gx, cols = dados.length > 2 ? 2 : 1, cw2 = (gw - (cols - 1) * 10) / cols;
      const rowsPerPage = 3, chH = (P.H - top - 20) / Math.min(rowsPerPage, Math.ceil(dados.length / cols)) - 6;
      dados.forEach(([Pf, Rr], i) => {
        const pi = Math.floor(i / (cols * rowsPerPage)), k = i % (cols * rowsPerPage);
        if (k === 0 && pi > 0) { doc.addPage('a3', 'landscape'); pdfFrame(doc, P, '4 · Perfis do terreno (continuação)', sub); }
        const cx = gx + (k % cols) * (cw2 + 10), cy = top + 8 + Math.floor(k / cols) * (Math.min(chH, 85) + 8);
        pdfPerfil(doc, cx, cy, cw2, Math.min(chH, 85), Pf, Rr);
      });
    }
    // ---- 5. Insolação ----
    doc.addPage('a3', 'landscape'); pdfFrame(doc, P, '5 · Insolação', sub);
    const luz = SR.day.rise ? SR.day.set.m - SR.day.rise.m : 0;
    const top5 = pdfCards(doc, P.M, top + 2, P.W - 2 * P.M, [['Dia do estudo', solDate().toLocaleDateString('pt-BR')], ['Nascer do sol', SR.day.rise ? hhmm(SR.day.rise.m) : '—', SR.day.rise ? rumo(SR.day.rise.az) : ''], ['Pôr do sol', SR.day.set ? hhmm(SR.day.set.m) : '—', SR.day.set ? rumo(SR.day.set.az) : ''], ['Luz do dia', Math.floor(luz / 60) + 'h' + String(luz % 60).padStart(2, '0')], ['Sol às ' + hhmm(+$('sol-hora').value), SR.s.alt > 0 ? Math.round(SR.s.alt) + '° de altura' : 'abaixo do horizonte', SR.s.alt > 0 ? rumo(SR.s.az) : '']]);
    xa = P.M; ya = top5 + 2;
    ya = pdfSec(doc, xa, ya, 150, 'Trajetória do sol');
    pdfSunChart(doc, xa + 75, ya + 68, 58, SR.c);
    ya = pdfPara(doc, xa, ya + 145, 150, `Dia escolhido: ${solDate().toLocaleDateString('pt-BR')}. ` + (SR.day.rise ? `Nascer às ${hhmm(SR.day.rise.m)} a ${Math.round(SR.day.rise.az)}° (${rumo(SR.day.rise.az)}); pôr do sol às ${hhmm(SR.day.set.m)} a ${Math.round(SR.day.set.az)}° (${rumo(SR.day.set.az)}); ${Math.floor((SR.day.set.m - SR.day.rise.m) / 60)}h${String((SR.day.set.m - SR.day.rise.m) % 60).padStart(2, '0')} de luz.` : '') + ' Referência: norte verdadeiro.', 9);
    xb = P.M + 170; yb = top5 + 2; const wb = P.W - P.M - xb;
    yb = pdfSec(doc, xb, yb, wb, 'Orientação das quadras');
    if (SR.quadras.length) yb = pdfTable(doc, xb, yb, [wb - 190, 36, 34, 120], [['Quadra', 'Eixo (N)', 'Desvio N–S', 'Sol baixo na linha de jogo']].concat(SR.quadras.map(q => [q.q.name, Math.round(q.brg) + '° / ' + Math.round((q.brg + 180) % 360) + '°',
      {t: Math.round(q.dev) + '° · ' + (q.dev <= 15 ? 'ótima' : q.dev <= 25 ? 'aceitável' : 'desfavorável'), c: q.dev <= 15 ? PDFC.ok : q.dev <= 25 ? [178, 106, 0] : PDFC.bad},
      q.glare.length ? q.glare.map(([a, b]) => hhmm(a) + '–' + hhmm(b + 5)).join(', ') : 'nenhum nesta data'])), {head: 1, al: ['left', 'right', 'right', 'left']});
    else yb = pdfPara(doc, xb, yb, wb, 'Nenhuma quadra no estudo.', 9);
    yb = pdfPara(doc, xb, yb, wb, 'Recomendação usual para tênis e padel ao ar livre: eixo maior na direção norte–sul, com desvio de até 15° a 20°.', 8.5, PDFC.mut);
    yb = pdfSec(doc, xb, yb + 4, wb, `Sol sobre os elementos às ${hhmm(+$('sol-hora').value)}`);
    yb = pdfTable(doc, xb, yb, [wb - 90, 45, 45], [['Elemento', 'Iluminado agora', heatStats ? 'Horas de sol no dia' : '']].concat(SR.els.map(e => [e.b.name, SR.s.alt > 0 ? Math.round(e.v * 100) + '%' : 'noite', e.horas != null ? fmt(e.horas) + ' h' : ''])), {head: 1});
    yb = pdfPara(doc, xb, yb, wb, 'Sombras calculadas com as alturas dos elementos do estudo (edificações, árvores, alambrados e vidros)' + (VIZ.on && VIZ.list.length ? ` e de ${VIZ.list.length} edificações vizinhas do OpenStreetMap.` : '. Edificações vizinhas não entraram no cálculo.'), 8, PDFC.mut);
    pdfOrcamento(doc, P, sub, top);
  }
  pdfPageNums(doc, P);
  doc.save(pro ? 'implanta-relatorio.pdf' : 'implanta-estudo.pdf');
  if (sel0 && blocks.includes(sel0)) select(sel0);
  msg(pro ? `Relatório completo gerado (${doc.getNumberOfPages()} páginas).` : 'PDF gerado.'); marcaGuia('pdf');
}
$('exp-pdf').onclick = exportPdf;
$('exp-orc').onclick = () => openTool('orcamento');
