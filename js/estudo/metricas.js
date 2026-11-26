// ---------- Métricas, checagem da zona e opções (Fase A) ----------
// Parâmetros da zona: vazio = sem limite informado
const ZP0 = {to: null, ca: null, perm: null, alt: null};
var zp = {...ZP0};
let mTab = 'lote';
const pctS = v => (v * 100).toFixed(1).replace('.', ',') + '%';
const courtDev = angle => { const brg = (((90 - angle) % 180) + 180) % 180; return Math.min(brg, 180 - brg); };
// Métricas de um estudo (dados no formato do snapshot); buildableF opcional evita recalcular os recuos
function computeMetrics(d, buildableF) {
  const m = {lotA: 0, edA: 0, perim: 0, testada: 0, proj: 0, constr: 0, hmax: 0, quadras: [], quadraA: 0, vagas: 0, vagaA: 0, fora: 0, blocos: d.blocks.length};
  let lotF = null, bF = buildableF;
  if (d.lot) {
    lotF = polyFeat(d.lot); m.lotA = turf.area(lotF);
    const fr = d.fronts || [0];
    for (let i = 0; i < d.lot.length - 1; i++) {
      const l = turf.distance(d.lot[i], d.lot[i + 1], {units: 'meters'}); m.perim += l; if (fr.includes(i)) m.testada += l;
    }
    if (bF === undefined) bF = computeBuildable(d.lot, fr, parseFloat(d.recuoF ?? d.recuo) || 0, parseFloat(d.recuo) || 0);
    m.edA = bF ? turf.area(bF) : 0;
  }
  const big = bF ? largestPoly(bF) : null;
  d.blocks.forEach(o => {
    const t = TYPES[o.kind]; if (!t) return;
    const a = o.w * o.h, ring = rotRing(o.lat, o.lng, o.w, o.h, o.angle);
    let ok = true;
    if (t.fit) { try { ok = !!big && turf.booleanWithin(polyFeat(ring), big); } catch (e) { ok = false; } }
    if (!ok) m.fora++;
    if (t.sum === 'edif') { m.proj += a; m.constr += a * (PAV_KINDS[o.kind] ? (o.pav || 1) : 1); }
    if (t.sum === 'quadra') { m.quadraA += a; m.quadras.push({name: o.name, kind: o.kind, a, dev: courtDev(o.angle), ok}); }
    if (t.sum === 'vaga') { m.vagaA += a; m.vagas += vagasOf(o); }
    const h = o.alt ?? ALT_DEF[o.kind] ?? 0; if (t.sum === 'edif' && h > m.hmax) m.hmax = h;
  });
  m.camA = 0; (d.caminhos || []).forEach(c => { try { m.camA += turf.length(turf.lineString(c.pts.map(p => [p[1], p[0]])), {units: 'meters'}) * c.w; } catch (e) {} });
  m.livre = m.lotA - m.proj - m.quadraA - m.vagaA - m.camA;
  m.to = m.lotA ? m.proj / m.lotA : 0; m.ca = m.lotA ? m.constr / m.lotA : 0; m.perm = m.lotA ? m.livre / m.lotA : 0;
  return m;
}
// Semáforo: ok (verde), falha (vermelho), sem limite (cinza)
function checks(m, z) {
  const c = (label, val, lim, ok, txt) => ({label, st: lim == null || lim === '' ? 'na' : ok ? 'ok' : 'bad', txt});
  const n = v => v == null || v === '' ? null : +v;
  return [
    c('Taxa de ocupação', m.to, n(z.to), m.to * 100 <= n(z.to) + 1e-9, `${pctS(m.to)}${n(z.to) != null ? ' de ' + fmt(n(z.to)) + '% máx.' : ''}`),
    c('Coeficiente de aproveitamento', m.ca, n(z.ca), m.ca <= n(z.ca) + 1e-9, `${m.ca.toFixed(2).replace('.', ',')}${n(z.ca) != null ? ' de ' + String(n(z.ca)).replace('.', ',') + ' máx.' : ''}`),
    c('Área permeável (estimada)', m.perm, n(z.perm), m.perm * 100 >= n(z.perm) - 1e-9, `${pctS(m.perm)}${n(z.perm) != null ? ' de ' + fmt(n(z.perm)) + '% mín.' : ''}`),
    c('Altura máxima', m.hmax, n(z.alt), m.hmax <= n(z.alt) + 1e-9, `${fmt(m.hmax)} m${n(z.alt) != null ? ' de ' + fmt(n(z.alt)) + ' m máx.' : ''}`),
    {label: 'Blocos dentro dos recuos', st: !m.blocos ? 'na' : m.fora ? 'bad' : 'ok', txt: m.fora ? `${m.fora} fora` : m.blocos ? 'todos' : '—'},
    {label: 'Quadras no eixo norte–sul', st: !m.quadras.length ? 'na' : m.quadras.every(q => q.dev <= 25) ? 'ok' : 'bad',
     txt: m.quadras.length ? m.quadras.filter(q => q.dev <= 25).length + ' de ' + m.quadras.length : '—'},
    ...(m.terr ? [{label: 'Terreno', st: m.terr.decMed < 30 && m.terr.hMax <= 3 && !(m.terr.taludeFora || []).length ? 'ok' : 'bad',
      txt: 'decl. ' + fmt(m.terr.decMed) + '%' + (m.terr.plats.length ? ' · até ' + fmt(m.terr.hMax) + ' m' : '')}] : [])
  ];
}
const DOT = {ok: '#2e7d32', bad: '#d32f2f', na: '#b0b8c0'};
function renderMetrics() {
  const d = JSON.parse(snapshot()), m = computeMetrics(d, buildable || null);
  try { m.terr = terrSummary(); } catch (e) { m.terr = null; }
  if (modo === 'one') { renderSimple(m); return; }
  const ck = checks(m, zp);
  const nOk = ck.filter(x => x.st === 'ok').length, nBad = ck.filter(x => x.st === 'bad').length;
  const hud = $('hud');
  // não redesenha enquanto a pessoa digita nos campos da zona
  if (hud.contains(document.activeElement) && document.activeElement.tagName === 'INPUT') {
    const s = hud.querySelector('.m-sum'); if (s) s.innerHTML = sumHtml(); return;
  }
  function sumHtml() {
    return `<span class="m-dot" style="background:${DOT.ok}"></span>${nOk} ok` + (nBad ? ` <span class="m-dot" style="background:${DOT.bad}"></span><b style="color:var(--bad)">${nBad} alerta${nBad > 1 ? 's' : ''}</b>` : '');
  }
  const head = `<div class="m-head"><div><div class="big">${lot ? 'Lote ' + fmt(m.lotA) + ' m²' : 'Nenhum lote ainda'}</div>` +
    (lot ? `<div class="m-sum">${sumHtml()}</div>` : '') + `</div><button class="m-tog" title="${hudOpen ? 'Recolher' : 'Ver métricas'}">${hudOpen ? '▴' : '▾'}</button></div>`;
  if (!hudOpen) {
    hud.innerHTML = head + (lot ? `<div class="m-line">Ocupação ${pctS(m.to)} · Livre ${pctS(m.lotA ? m.livre / m.lotA : 0)}</div>` : '') +
      (m.fora ? `<div class="alert">${m.fora} bloco${m.fora > 1 ? 's' : ''} fora do recuo</div>` : '');
    return;
  }
  const TABS = [['lote', 'Lote'], ['edif', 'Edificações'], ['quadras', 'Quadras'], ['vagas', 'Vagas'], ['zona', 'Zona'], ['terreno', 'Terreno']];
  const row = (k, v) => `<tr><td>${k}</td><td>${v}</td></tr>`, pl = v => m.lotA ? ' · ' + pctS(v / m.lotA) : '';
  let body = '';
  if (mTab === 'lote') body = '<table>' + row('Área do lote', fmt(m.lotA) + ' m²') + row('Área edificável (após recuos)', fmt(m.edA) + ' m²') +
    row('Perímetro', fmt(m.perim) + ' m') + row('Frente para a rua', fmt(m.testada) + ' m') +
    row('Recuos: frente / demais', fmt(num('recuo-f')) + ' / ' + fmt(num('recuo')) + ' m') +
    row('Área livre', fmt(m.livre) + ' m²' + pl(m.livre)) + '</table>';
  if (mTab === 'edif') body = '<table>' + row('Projeção (taxa de ocupação)', fmt(m.proj) + ' m²' + pl(m.proj)) +
    row('Área construída', fmt(m.constr) + ' m²') + row('Coeficiente de aproveitamento', m.ca.toFixed(2).replace('.', ',')) +
    row('Altura máxima', fmt(m.hmax) + ' m') + '</table>' +
    '<p class="hint">Área construída = projeção × pavimentos. Ajuste “Pav.” e “Alt.” na barra de cada bloco.</p>';
  if (mTab === 'quadras') body = (m.quadras.length ? '<table>' + m.quadras.map(q => row(esc(q.name) + (q.ok ? '' : ' <span class="alert">fora do recuo</span>'),
    `desvio ${Math.round(q.dev)}° <span class="m-dot" style="background:${q.dev <= 15 ? DOT.ok : q.dev <= 25 ? '#b26a00' : DOT.bad}"></span>`)).join('') +
    row('Área das quadras com escape', fmt(m.quadraA) + ' m²' + pl(m.quadraA)) + '</table>' : '<p class="hint">Nenhuma quadra no estudo.</p>') +
    '<p class="hint">Desvio do eixo maior em relação ao norte–sul verdadeiro: até 15° ótimo, até 25° aceitável.</p>' +
    (solOn && solCourtsHtml ? '<div class="m-zone" style="margin-top:8px"><b>Insolação no dia escolhido</b></div>' + solCourtsHtml : '<p class="hint">Abra a Insolação (☀ na barra de baixo) para ver o sol baixo no eixo de jogo e a sombra sobre cada quadra.</p>');
  if (mTab === 'vagas') body = '<table>' + row('Vagas', String(m.vagas)) + row('Área de estacionamento', fmt(m.vagaA) + ' m²' + pl(m.vagaA)) + '</table>' +
    '<p class="hint">O bloco Estacionamento (Biblioteca) monta fileiras de vagas de 2,5 × 5 m com corredor de 6 m. Ajuste L e C e as vagas se recalculam.</p>';
  if (mTab === 'zona') body = `<div class="m-zone">${lot && lot.zone ? 'Zona do lote: <b>' + esc(lot.zone) + '</b>' : 'Parâmetros do lote'}</div>` +
    `<div class="g2"><label>Taxa de ocupação máx. (%)<input type="number" data-zp="to" step="1" min="0" value="${zp.to ?? ''}"></label>` +
    `<label>Coef. de aproveitamento máx.<input type="number" data-zp="ca" step="0.1" min="0" value="${zp.ca ?? ''}"></label>` +
    `<label>Permeabilidade mín. (%)<input type="number" data-zp="perm" step="1" min="0" value="${zp.perm ?? ''}"></label>` +
    `<label>Altura máx. (m)<input type="number" data-zp="alt" step="0.5" min="0" value="${zp.alt ?? ''}"></label></div>` +
    '<p class="hint">Campos vazios ficam sem limite (cinza). Confira os valores na lei de uso e ocupação do município. Em BH, o coeficiente básico do Plano Diretor (Lei 11.181/2019) é 1,0.</p>';
  if (mTab === 'terreno') {
    const s = m.terr;
    if (!s) body = '<p class="hint">' + (lot ? 'Abra o menu Terreno (ícone de montanha no topo) para carregar a elevação do lote.' : 'Crie o lote para analisar o terreno.') + '</p>';
    else {
      body = '<table>' + row('Cotas do lote', fmt(s.zmin) + ' a ' + fmt(s.zmax) + ' m') + row('Desnível', fmt(s.zmax - s.zmin) + ' m') +
        row('Declividade média / máxima', fmt(s.decMed) + '% / ' + fmt(s.decMax) + '%') + row('Área acima de 30%', pctS(s.pct30)) +
        s.plats.map(({bk, p, t}) => row(esc(bk.name) + ` <small>(cota ${fmt(p.cota)}${p.auto ? ', média' : ''}${t && t.larg ? ', talude até ' + fmt(t.larg) + ' m' : ''})</small>`,
          `<span style="color:#e53935">▲ ${fmt(p.corte)}</span> · <span style="color:#1e88e5">▼ ${fmt(p.aterro)}</span> m³`)).join('') +
        (s.plats.length ? row('Total corte / aterro', fmt(s.corte) + ' / ' + fmt(s.aterro) + ' m³') + row('Saldo (corte − aterro)', fmt(s.corte - s.aterro) + ' m³') : '') + '</table>';
      const al = [];
      if (s.decMed >= 30) al.push('Declividade média acima de 30%: o parcelamento exige condições especiais (Lei 6.766/79) e a implantação tende a ser cara.');
      else if (s.pct30 > 0.25) al.push('Mais de um quarto do lote tem declividade acima de 30%.');
      s.plats.filter(x => Math.max(x.p.hc, x.p.ha) > 3).forEach(x => al.push(`${esc(x.bk.name)}: ${x.p.hc > x.p.ha ? 'corte' : 'aterro'} de até ${fmt(Math.max(x.p.hc, x.p.ha))} m, exige muro de arrimo ou talude.`));
      (s.taludeFora || []).forEach(n => al.push(`${esc(n)}: o talude passa da divisa do lote. Reduza a diferença de cota, use muro de arrimo ou afaste a plataforma.`));
      body += al.length ? al.map(a => `<div class="alert" style="font-size:12.5px;margin:4px 0">⚠ ${a}</div>`).join('') : '<p class="hint" style="color:#2e7d32">Sem alertas de terreno.</p>';
      body += '<p class="hint">Volumes estimados com o modelo global de elevação (~30 m). Para projeto, use levantamento topográfico.</p>';
    }
  }
  hud.innerHTML = head +
    '<div class="m-checks">' + ck.map(x => `<div class="m-ck"><span class="m-dot" style="background:${DOT[x.st]}"></span><span>${x.label}</span><b>${x.txt}</b></div>`).join('') + '</div>' +
    '<div class="m-tabs">' + TABS.map(([k, t]) => `<button data-mt="${k}" class="${k === mTab ? 'on' : ''}">${t}</button>`).join('') + '</div>' +
    `<div class="m-body">${body}</div>`;
}
$('hud').addEventListener('click', e => {
  const t = e.target.closest('[data-mt]');
  if (t) { mTab = t.dataset.mt; renderMetrics(); return; }
  if (e.target.closest('.m-head')) { hudOpen = !hudOpen; renderMetrics(); }
});
$('hud').addEventListener('input', e => {
  const k = e.target.dataset.zp; if (!k) return;
  const v = e.target.value.trim(); zp[k] = v === '' ? null : parseFloat(v.replace(',', '.'));
  renderMetrics();
});
$('hud').addEventListener('change', e => { if (e.target.dataset.zp) { commit(); e.target.blur(); renderMetrics(); } });
