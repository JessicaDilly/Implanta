// ---------- Tipos de bloco: quadras, edificações, vagas, árvores e plantas ----------
const PLAY = {w: 23.77, h: 10.97};
const TYPES = {
  rapida: {label: 'Quadra rápida', w: 36, h: 18, fit: true, sum: 'quadra', court: true, vis: 'quadra'},
  saibro: {label: 'Quadra de saibro', w: 36, h: 18, fit: true, sum: 'quadra', court: true, vis: 'quadra'},
  quadra: {label: 'Quadra rápida', w: 36, h: 18, fit: true, sum: 'quadra', court: true, vis: 'quadra'}, // estudos antigos
  // Padel (FIP): área de jogo 20 × 10 m fechada por vidro e tela; o bloco inclui a faixa da estrutura e da circulação
  infantil: {label: 'Quadra infantil', w: 16, h: 8, fit: true, sum: 'quadra', court: true, vis: 'quadra', play: {w: 14, h: 6.4}, min: {w: 12, h: 6}, max: {w: 20, h: 10}},
  padel:  {label: 'Quadra de padel', w: 21, h: 11, fit: true, sum: 'quadra', court: true, vis: 'quadra',
           play: {w: 20, h: 10}, min: {w: 20, h: 10}, max: {w: 25, h: 15}},
  edif:   {label: 'Edificação', w: 12, h: 8, fit: true, sum: 'edif'},
  vaga:   {label: 'Vaga', w: 2.5, h: 5, fit: true, sum: 'vaga'},
  // Estacionamento paramétrico: fileiras de vagas 2,5 × 5 m com corredor de 6 m, ao longo do comprimento L
  estac:  {label: 'Estacionamento', w: 25, h: 16, fit: true, sum: 'vaga', vis: 'vaga'},
  arvore: {label: 'Árvore', w: 6, h: 6, fit: false, sum: null},
  planta: {label: 'Planta', fit: true, sum: 'edif'},
  dxf:    {label: 'Planta', fit: true, sum: 'edif', vis: 'planta'}
};
const COURT_MIN = {w: 32, h: 16}, COURT_MAX = {w: 36, h: 18};
// Altura padrão (m) usada nas sombras do estudo solar; editável no bloco
const ALT_DEF = {edif: 6, planta: 3.5, dxf: 3.5, arvore: 8};
const altOf = b => b.alt ?? ALT_DEF[b.kind] ?? 0;
const COURT_COLORS = {
  rapida: {escape: '#8f979e', court: '#2d5f9e', line: '#ffffff'},
  quadra: {escape: '#8f979e', court: '#2d5f9e', line: '#ffffff'},
  saibro: {escape: '#a9532f', court: '#c0653c', line: '#fbf3ea'}
};
const visKey = k => (TYPES[k] && TYPES[k].vis) || k;
const playOf = k => TYPES[k].play || PLAY;
// Fileiras do estacionamento: módulos de 16 m (fileira + corredor + fileira); sobra de 11 m vira fileira simples
const VAGA = {w: 2.5, h: 5, corredor: 6};
function parkLayout(w, h) {
  const rows = [], aisles = [];
  let y = 0;
  while (h - y >= 2 * VAGA.h + VAGA.corredor - 1e-6) { rows.push(y); aisles.push(y + VAGA.h); rows.push(y + VAGA.h + VAGA.corredor); y += 2 * VAGA.h + VAGA.corredor; }
  if (h - y >= VAGA.h + VAGA.corredor - 1e-6) { rows.push(y); aisles.push(y + VAGA.h); y += VAGA.h + VAGA.corredor; }
  else if (!rows.length && h >= VAGA.h) rows.push(0);
  const perRow = Math.floor(w / VAGA.w + 1e-6);
  return {rows, aisles, perRow, count: rows.length * perRow};
}
const vagasOf = b => b.kind === 'vaga' ? 1 : b.kind === 'estac' ? parkLayout(b.w, b.h).count : 0;
// Pavimentos (para o coeficiente de aproveitamento)
const PAV_KINDS = {edif: 1, planta: 1, dxf: 1};
const pavOf = b => PAV_KINDS[b.kind] ? (b.pav || 1) : 0;
const courtMin = k => TYPES[k].min || COURT_MIN, courtMax = k => TYPES[k].max || COURT_MAX;
