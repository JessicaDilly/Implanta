// Roda TOOLS: com mouse abre ao passar por cima e fecha ao sair (a não ser que esteja fixada);
// no toque, o centro abre e fecha. Os ícones crescem perto do cursor, como o Dock do macOS.
const WHEEL_KEY = 'creativmap.roda.fixa';
const wheel = $('wheel'), wheelTools = Array.from(wheel.querySelectorAll('[data-tool]'));
const temHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
let wheelPinned;
try { wheelPinned = JSON.parse(localStorage.getItem(WHEEL_KEY)); } catch (e) { wheelPinned = null; }
if (wheelPinned === null) wheelPinned = !temHover;
function setWheel(open) { wheel.classList.toggle('min', !open); if (!open) dockReset(); }
function syncPin() { $('wheel-pin').classList.toggle('on', wheelPinned); $('wheel-pin').title = wheelPinned ? 'Soltar a roda (fecha ao tirar o mouse)' : 'Fixar a roda aberta'; }
function dockReset() { wheelTools.forEach(b => { b.style.setProperty('--s', 1); b.style.zIndex = ''; }); }
setWheel(wheelPinned); syncPin();
$('wheel-pin').onclick = () => {
  wheelPinned = !wheelPinned; syncPin();
  try { localStorage.setItem(WHEEL_KEY, JSON.stringify(wheelPinned)); } catch (e) {}
  msg(wheelPinned ? 'Roda fixada aberta.' : 'A roda agora fecha quando o mouse sai.');
};
wheel.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') setWheel(true); });
wheel.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { if (!wheelPinned) setWheel(false); else dockReset(); } });
wheel.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse' || wheel.classList.contains('min')) return;
  wheelTools.forEach(b => {
    const r = b.getBoundingClientRect(), d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
    const s = 1 + 0.5 * Math.max(0, 1 - d / 75) ** 1.6;
    b.style.setProperty('--s', s.toFixed(3)); b.style.zIndex = s > 1.05 ? 2 : '';
  });
});
$('wheel-center').onclick = () => {
  if (tool) { closePop(); return; }
  if (wheel.classList.contains('min')) setWheel(true);
  else if (!temHover) setWheel(false);
};

map.on('click', e => {
  if (Date.now() - lastHit < 400 || tool === 'pincel') return;
  if (TERR.prof === 'pick') { profileClick(e.latlng); return; }
  if (tool === 'lote' && mode === 'vertices') { addVertex(e.latlng); return; }
  if (tool === 'medir') { addMeasure(e.latlng); return; }
  if (tool === 'caminhos') { camPonto(e.latlng); return; }
  if (!$('lotcard').hidden) { ltHide(); return; }
  if (tool) closePop();
  if (sel) select(null);
});
document.querySelectorAll('[data-mode]').forEach(b => {
  b.onclick = () => {
    mode = b.dataset.mode;
    document.querySelectorAll('[data-mode]').forEach(x => x.classList.toggle('on', x === b));
    $('box-medidas').hidden = mode !== 'medidas';
    $('box-vertices').hidden = mode !== 'vertices';
    if (mode === 'vertices') msg('Toque no mapa para marcar os vértices do lote.');
  };
});
$('btn-buscar').onclick = buscar;
$('endereco').addEventListener('keydown', e => { if (e.key === 'Enter') buscar(); });
$('btn-desfazer').onclick = () => { vertices.pop(); drawTmp(); };
$('btn-fechar').onclick = () => {
  if (vertices.length < 3) { msg('Marque pelo menos 3 vértices.'); return; }
  const ring = vertices.map(([la, ln]) => [ln, la]); ring.push(ring[0]);
  vertices = []; tmpLayer.clearLayers(); msg('Lote criado. Agora confira os recuos logo abaixo.'); setLot(ring);
  document.querySelector('[data-mode="medidas"]').click(); // sai do modo de marcar pontos
};
$('btn-criar-medidas').onclick = () => {
  const t = num('l-testada'), p = num('l-prof');
  if (t <= 0 || p <= 0) { msg('Informe a testada e a profundidade.'); return; }
  const c = map.getCenter(); msg('Lote criado. Agora confira os recuos logo abaixo.');
  setLot(rotRing(c.lat, c.lng, t, p, num('l-rot')));
};
['recuo', 'recuo-f'].forEach(id => { $(id).addEventListener('input', refreshLot); $(id).addEventListener('change', () => commit()); });
$('btn-limpar').onclick = () => {
  if (!confirm('Limpar o lote e todos os blocos do estudo? Dá para voltar com Desfazer.')) return;
  select(null); blockLayer.clearLayers(); blocks = []; lot = null; vertices = []; tmpLayer.clearLayers();
  sketchLayer.clearLayers(); strokes = []; setPin(null, true); caminhos = []; drawCaminhos();
  refreshLot(); commit(); msg('Estudo limpo.');
};
