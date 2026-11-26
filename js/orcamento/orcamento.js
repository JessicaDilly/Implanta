// ---------- Orçamento no Implanta: dados do estudo → simulador ----------
const UF_NOMES = {'acre': 'AC', 'alagoas': 'AL', 'amapá': 'AP', 'amazonas': 'AM', 'bahia': 'BA', 'ceará': 'CE', 'distrito federal': 'DF', 'espírito santo': 'ES', 'goiás': 'GO', 'maranhão': 'MA', 'mato grosso': 'MT', 'mato grosso do sul': 'MS', 'minas gerais': 'MG', 'pará': 'PA', 'paraíba': 'PB', 'paraná': 'PR', 'pernambuco': 'PE', 'piauí': 'PI', 'rio de janeiro': 'RJ', 'rio grande do norte': 'RN', 'rio grande do sul': 'RS', 'rondônia': 'RO', 'roraima': 'RR', 'santa catarina': 'SC', 'são paulo': 'SP', 'sergipe': 'SE', 'tocantins': 'TO'};
const PADROES_ORC = {Standard: 'container 20 pés', Plus: 'container 40 pés', Premium: 'alvenaria ou steel frame'};
var ORCU = {disp: 0, cob: false}; // escolhas do usuário; os demais campos só entram aqui quando ele altera o valor do estudo
function ufDoEndereco() {
  const partes = (pinAt && pinAt.label ? pinAt.label : '').toLowerCase().split(',').map(s => s.trim());
  for (const p of partes) if (UF_NOMES[p]) return UF_NOMES[p];
  for (const p of partes) { const m = p.match(/^([a-z]{2})$/i); if (m && Object.values(UF_NOMES).includes(m[1].toUpperCase())) return m[1].toUpperCase(); }
  return null;
}
// Padrão da edificação pelas plantas do estudo: START (container 20 pés) e STANDARD (START + escritório) = Standard; PLUS = Plus; edificação em alvenaria = Premium.
// Com plantas de padrões diferentes vale o mais alto. A área construída vem da área de cada planta (DXF) × pavimentos.
function padDoEstudo() {
  if (blocks.some(b => b.kind === 'edif')) return 'Premium';
  const nome = b => ((BUILTIN.find(x => x.src && x.src === b.src) || {}).name || b.name || '').toUpperCase();
  const pads = blocks.filter(b => b.kind === 'dxf' || b.kind === 'planta').map(b => /PLUS/.test(nome(b)) ? 'Plus' : /START|STANDARD/.test(nome(b)) ? 'Standard' : null).filter(Boolean);
  return pads.includes('Plus') ? 'Plus' : pads.includes('Standard') ? 'Standard' : 'Plus';
}
// Lê o estudo e devolve os parâmetros do simulador (automáticos) e de onde veio cada um
function orcAuto() {
  const m = computeMetrics(JSON.parse(snapshot()), buildable || null);
  let terr = null; try { terr = terrSummary(); } catch (e) {}
  const tenis = blocks.filter(b => b.kind === 'rapida' || b.kind === 'saibro' || b.kind === 'quadra');
  const rap = tenis.filter(b => b.kind !== 'saibro').length;
  const decl = terr ? Math.round(terr.decMed * 10) / 10 : null;
  return {
    quad: tenis.length, piso: rap > tenis.length - rap ? 'rapido' : 'saibro', inf: blocks.some(b => b.kind === 'infantil'),
    pad: padDoEstudo(), area: Math.round(m.constr), lote: Math.round(m.lotA),
    uf: ufDoEndereco() || 'MG', ufAuto: !!ufDoEndereco(), decl, desn: decl != null && decl >= 10, terrOk: !!terr
  };
}
function orcParams() {
  const A = orcAuto(), v = k => ORCU[k] !== undefined ? ORCU[k] : A[k];
  return {A, p: {disp: ORCU.disp || 0, quad: Math.max(1, v('quad') || 1), pad: v('pad'), piso: v('piso'), uf: v('uf'), lote: v('lote') || 0, area: v('area') || 0,
    inf: !!v('inf'), cob: !!ORCU.cob, desn: !!v('desn'), decl: v('decl') || 10}};
}
const orcMi = v => 'R$ ' + (v / 1e6).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' mi';
const orcR$ = v => v.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL', maximumFractionDigits: 0});
const orcK = v => v >= 1e6 ? (v / 1e6).toLocaleString('pt-BR', {maximumFractionDigits: 2}) + ' mi' : Math.round(v / 1000).toLocaleString('pt-BR') + ' mil';
function orcFaixaK(a, b) { return Math.round(a / 1000) === Math.round(b / 1000) ? 'R$ ' + orcK(a) : 'R$ ' + orcK(a) + ' a ' + orcK(b); }
function orcFaixa(a, b) { return Math.round(a / 1000) === Math.round(b / 1000) ? orcR$(a) : orcR$(a) + ' a ' + orcR$(b); }
// Ajustes que aproximam (ou expandem) o projeto, recalculados como no painel
function orcAjustes(p, R) {
  const alts = [], pads = ['Standard', 'Plus', 'Premium'], ip = pads.indexOf(p.pad);
  if (p.quad > 1) alts.push(['Uma quadra a menos', {quad: p.quad - 1}]);
  if (p.cob) alts.push([p.quad > 1 ? 'Quadras sem cobertura' : 'Quadra sem cobertura', {cob: false}]);
  if (p.inf) alts.push(['Sem quadra infantil', {inf: false}]);
  if (ip > 0) alts.push(['Edificação ' + pads[ip - 1] + ' (' + PADROES_ORC[pads[ip - 1]] + ')', {pad: pads[ip - 1]}]);
  if (p.piso === 'rapido') alts.push(['Quadra de saibro no lugar do piso rápido', {piso: 'saibro'}]);
  alts.push(['Uma quadra a mais (expansão)', {quad: p.quad + 1}]);
  return alts.map(([t, mud]) => { const N = ORC.calcular(Object.assign({}, p, mud)); return {t, N, d: N.central - R.central, cabe: !p.disp ? null : N.hi <= p.disp ? 'cabe' : N.lo <= p.disp ? 'cabe com ajustes' : 'não cabe'}; });
}
function orcVeredito(p, R) {
  if (!p.disp) return null;
  if (R.hi <= p.disp) return {cls: 'ok', t: 'Cabe no investimento', d: `Mesmo no topo da faixa (${orcMi(R.hi)}), sobra ${orcMi(p.disp - R.hi)}.`};
  if (R.lo <= p.disp) return {cls: 'meia', t: 'Cabe com ajustes', d: `O disponível (${orcMi(p.disp)}) fica dentro da faixa estimada. Veja os ajustes para ganhar margem.`};
  return {cls: 'bad', t: 'Não cabe hoje', d: `Faltam pelo menos ${orcMi(R.lo - p.disp)} para o piso da faixa.`};
}
function renderOrc() {
  const box = $('orc-corpo'); if (!box) return;
  const {A, p} = orcParams(), R = ORC.calcular(p), V = orcVeredito(p, R);
  const auto = k => ORCU[k] === undefined ? '<span class="orc-auto" title="Valor lido do estudo">do estudo</span>' : '<button class="orc-auto mud" data-reset="' + k + '" title="Voltar ao valor do estudo">alterado ↺</button>';
  const sel = (k, ops) => `<select data-k="${k}">${ops.map(([v, t]) => `<option value="${v}"${String(p[k]) === String(v) ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  const ufs = Object.keys(ORC.REF.ufRegiao).sort();
  let h = '';
  h += '<div class="psec"><div class="psec-h"><span class="psec-n">1</span>Dados do estudo</div><table class="orc-t">' +
    `<tr><td>Quadras de tênis</td><td><input type="number" data-k="quad" min="1" step="1" value="${p.quad}"></td><td>${auto('quad')}</td></tr>` +
    `<tr><td>Piso da quadra</td><td>${sel('piso', [['saibro', 'Saibro'], ['rapido', 'Piso rápido']])}</td><td>${auto('piso')}</td></tr>` +
    `<tr><td>Quadra infantil</td><td>${sel('inf', [['false', 'Não'], ['true', 'Sim']])}</td><td>${auto('inf')}</td></tr>` +
    `<tr><td>Padrão da edificação</td><td>${sel('pad', Object.entries(PADROES_ORC).map(([k, t]) => [k, k + ' · ' + t]))}</td><td>${auto('pad')}</td></tr>` +
    `<tr><td>Área construída (m²)</td><td><input type="number" data-k="area" min="0" step="1" value="${p.area || ''}" placeholder="padrão ${p.pad === 'Premium' ? 117 : 113} m²"></td><td>${auto('area')}</td></tr>` +
    `<tr><td>Lote (m²)</td><td><input type="number" data-k="lote" min="0" step="10" value="${p.lote}"></td><td>${auto('lote')}</td></tr>` +
    `<tr><td>Desnível acentuado</td><td>${sel('desn', [['false', 'Não'], ['true', 'Sim']])}</td><td>${auto('desn')}</td></tr>` +
    (p.desn ? `<tr><td>Declive (%)</td><td><input type="number" data-k="decl" min="0" step="0.5" value="${p.decl}"></td><td>${auto('decl')}</td></tr>` : '') +
    `<tr><td>UF da obra</td><td>${sel('uf', ufs.map(u => [u, u]))}</td><td>${auto('uf')}</td></tr></table>` +
    (A.quad ? '' : '<p class="hint" style="color:var(--bad)">O estudo não tem quadra de tênis; o simulador considera no mínimo 1.</p>') +
    (A.ufAuto ? '' : '<p class="hint">UF não encontrada no endereço; usando MG. Busque o endereço ou escolha a UF.</p>') +
    (A.terrOk ? '' : '<p class="hint">Declividade ainda não calculada: abra o painel Terreno para ler o relevo.</p>') + '</div>';
  h += '<div class="psec"><div class="psec-h"><span class="psec-n">2</span>Investimento</div>' +
    `<label>Valor disponível para investir (R$)<input type="number" id="orc-disp" min="0" step="10000" value="${ORCU.disp || ''}" placeholder="opcional"></label>` +
    `<label class="lay"><span>Quadra adulta coberta (cobertura metálica)</span><input type="checkbox" id="orc-cob"${ORCU.cob ? ' checked' : ''}></label></div>`;
  h += '<div class="psec"><div class="psec-h"><span class="psec-n">3</span>Resultado</div>' +
    `<div class="orc-total"><small>Total estimado (com BDI)</small><b>${orcMi(R.central)}</b><span>faixa ${orcMi(R.lo)} a ${orcMi(R.hi)} · obra de ${fmt(R.c.meses)} meses</span></div>` +
    (V ? `<div class="orc-v ${V.cls}"><b>${V.t}.</b> ${V.d}</div>` : '') +
    '<table class="orc-t orc-comp"><tr><th>Etapa</th><th>Valor final</th><th>%</th></tr>' +
    R.etapas.map(x => `<tr title="${esc(x.ref || '')}"><td>${esc(x.nome.charAt(0) + x.nome.slice(1).toLowerCase())}</td><td>${orcFaixa(x.finMin, x.finMax)}</td><td>${fmt(((x.finMin + x.finMax) / 2) / R.central * 100)}%</td></tr>`).join('') +
    `<tr class="tot"><td>Total</td><td>${orcFaixa(R.lo, R.hi)}</td><td>100%</td></tr></table>` +
    '<div class="psec-h" style="margin-top:10px">Ajustes possíveis</div>' +
    orcAjustes(p, R).map(a => `<div class="orc-aj"><span>${a.t}<small>${orcMi(a.N.central)}</small></span><b class="${a.d < 0 ? 'eco' : 'acr'}">${a.d < 0 ? '−' : '+'}${orcMi(Math.abs(a.d))}${a.cabe ? ' · ' + a.cabe : ''}</b></div>`).join('') +
    `<p class="hint">Base: BP 09_2026 item a item, calibrada por ${ORC.nForn} orçamentos de fornecedores, corrigida por SINAPI (${p.uf}, fator ${fmt(R.fBP)}) e INCC. BDI de ${fmt(R.bdi * 100)}% sobre o custo direto, exceto container, projetos e acessórios.` +
    (R.notas.length ? ' ' + esc(R.notas.join(' · ')) + '.' : '') + ' Simulação de ordem de grandeza, a mesma do painel de arquitetura, mas sem os parâmetros e fornecedores do banco do painel. Não substitui o estudo orçamentário.</p></div>';
  box.innerHTML = h;
  box.querySelectorAll('[data-k]').forEach(el => el.onchange = () => {
    const k = el.dataset.k; let v = el.value;
    if (['quad', 'area', 'lote', 'decl'].includes(k)) v = +v; else if (v === 'true' || v === 'false') v = v === 'true';
    ORCU[k] = v; renderOrc();
  });
  box.querySelectorAll('[data-reset]').forEach(b => b.onclick = () => { delete ORCU[b.dataset.reset]; renderOrc(); });
  $('orc-disp').onchange = () => { ORCU.disp = +$('orc-disp').value || 0; renderOrc(); };
  $('orc-cob').onchange = () => { ORCU.cob = $('orc-cob').checked; renderOrc(); };
}
let orcT = null;
function orcRefresh() { if (tool !== 'orcamento') return; clearTimeout(orcT); orcT = setTimeout(renderOrc, 250); }
// Página do orçamento no relatório Pro
function pdfOrcamento(doc, P, sub, top) {
  const {A, p} = orcParams(), R = ORC.calcular(p), V = orcVeredito(p, R), fullW = P.W - 2 * P.M, colW = (fullW - 16) / 2;
  doc.addPage('a3', 'landscape'); pdfFrame(doc, P, '6 · Orçamento estimado', sub);
  let y = pdfCards(doc, P.M, top + 2, fullW, [
    ['Total estimado (com BDI)', orcMi(R.central)], ['Faixa', orcMi(R.lo) + ' a ' + orcMi(R.hi)],
    ['Prazo de obra', fmt(R.c.meses) + ' meses'], ['BDI', fmt(R.bdi * 100) + '%', 'sobre o custo direto'],
    V ? ['Valor disponível', orcMi(p.disp), V.t, V.cls === 'ok' ? PDFC.ok : V.cls === 'bad' ? PDFC.bad : [178, 106, 0]] : ['Valor disponível', 'não informado']]);
  let ya = pdfSec(doc, P.M, y + 2, colW, 'Parâmetros usados');
  const o = k => ORCU[k] === undefined ? 'do estudo' : 'informado';
  ya = pdfTable(doc, P.M, ya, [colW - 90, 60, 30], [['Parâmetro', 'Valor', 'Origem'],
    ['Quadras de tênis', String(p.quad), o('quad')], ['Piso da quadra', p.piso === 'rapido' ? 'piso rápido' : 'saibro', o('piso')],
    ['Quadra adulta coberta', p.cob ? 'sim' : 'não', 'informado'], ['Quadra infantil', p.inf ? 'sim' : 'não', o('inf')],
    ['Padrão da edificação', p.pad + ' (' + PADROES_ORC[p.pad] + ')', o('pad')], ['Área construída', fmt(R.c.area) + ' m²', p.area ? o('area') : 'padrão'],
    ['Lote', fmt(R.c.lote) + ' m²', o('lote')], ['Desnível acentuado', p.desn ? 'sim, ' + fmt(p.decl) + '%' : 'não', o('desn')], ['UF da obra', p.uf + ' · ' + R.reg, o('uf')]],
    {head: 1, al: ['left', 'right', 'right']});
  ya = pdfSec(doc, P.M, ya + 4, colW, 'Ajustes possíveis');
  ya = pdfTable(doc, P.M, ya, [colW - 80, 40, 40], [['Ajuste', 'Novo total', 'Diferença']].concat(orcAjustes(p, R).map(a => [a.t + (a.cabe ? ' (' + a.cabe + ')' : ''), orcMi(a.N.central), {t: (a.d < 0 ? '-' : '+') + orcMi(Math.abs(a.d)), c: a.d < 0 ? PDFC.ok : PDFC.bad}])), {head: 1});
  const xb = P.M + colW + 16;
  let yb = pdfSec(doc, xb, y + 2, colW, 'Composição por etapa');
  yb = pdfTable(doc, xb, yb, [colW - 96, 40, 40, 16], [['Etapa', 'Custo direto', 'Valor final', '%']].concat(R.etapas.map(x => [x.nome.charAt(0) + x.nome.slice(1).toLowerCase(), orcFaixaK(x.min, x.max), {t: orcFaixaK(x.finMin, x.finMax), b: 1}, fmt(((x.finMin + x.finMax) / 2) / R.central * 100) + '%']))
    .concat([[{t: 'Total', b: 1}, orcFaixaK(R.diretoMin, R.diretoMax), {t: orcFaixaK(R.lo, R.hi), b: 1}, '100%']]), {head: 1, fs: 8, al: ['left', 'right', 'right', 'right']});
  yb = pdfPara(doc, xb, yb + 2, colW, `Base: BP 09_2026 (planilha Investimento Inicial 2026) item a item, calibrada por ${ORC.nForn} orçamentos de fornecedores. Itens SINAPI/SETOP corrigidos de MG jul/2025 para ${p.uf} (fator ${fmt(R.fBP)}); itens calibrados de SP jul/2026 para ${p.uf} (fator ${fmt(R.fFN)}). BDI de ${fmt(R.bdi * 100)}% sobre o custo direto, exceto container, projetos e acessórios.` +
    (R.notas.length ? ' ' + R.notas.join('; ') + '.' : '') + ' Simulação de ordem de grandeza, calculada como no painel de arquitetura com os valores-padrão do simulador. Não substitui o estudo orçamentário.', 8, PDFC.mut);
}
