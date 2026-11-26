// ---------- Régua do pincel (como no Notas do iPhone) ----------
const RG = {on: false, x: 0, y: 0, a: 0, L: 560, H: 64};
function reguaDraw() {
  const el = $('ruler'); el.hidden = !RG.on; if (!RG.on) return;
  el.style.width = RG.L + 'px'; el.style.height = RG.H + 'px';
  el.style.transform = `translate(${RG.x - RG.L / 2}px, ${RG.y - RG.H / 2}px) rotate(${RG.a}deg)`;
  const ang = ((-RG.a % 180) + 180) % 180; $('ruler-ang').textContent = Math.round(ang) + '°';
  const cv = $('ruler-cv'), dpr = devicePixelRatio || 1; cv.width = RG.L * dpr; cv.height = RG.H * dpr;
  const g = cv.getContext('2d'); g.scale(dpr, dpr); g.clearRect(0, 0, RG.L, RG.H);
  // marcações em metros na escala atual do mapa
  const m = mpp(), passo = [0.5, 1, 2, 5, 10, 20, 50, 100].find(s => s / m >= 9) || 200, px = passo / m;
  g.strokeStyle = '#2b2b2b'; g.fillStyle = '#2b2b2b'; g.font = '600 9px Nunito, system-ui, sans-serif'; g.textAlign = 'center';
  for (let i = 0, x = 14; x <= RG.L - 14; i++, x = 14 + i * px) {
    const big = i % 5 === 0, h = big ? 14 : 7;
    g.lineWidth = big ? 1.4 : 1; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.moveTo(x, RG.H); g.lineTo(x, RG.H - h); g.stroke();
    if (big && i) g.fillText(fmt(i * passo) + (i === 5 ? ' m' : ''), x, 25);
  }
}
function reguaToggle(on) {
  RG.on = on ?? !RG.on;
  if (RG.on && !RG.x) { RG.x = innerWidth / 2; RG.y = innerHeight / 2; }
  $('ruler-btn').textContent = RG.on ? '📏 Esconder a régua' : '📏 Mostrar a régua';
  reguaDraw();
}
// Projeta o ponteiro na borda da régua (edge: +1 borda de baixo, -1 de cima; 0 escolhe a mais próxima)
function reguaSnap(e, edge) {
  if (!RG.on) return null;
  const a = RG.a * Math.PI / 180, dx = e.clientX - RG.x, dy = e.clientY - RG.y;
  const u = dx * Math.cos(a) + dy * Math.sin(a), v = -dx * Math.sin(a) + dy * Math.cos(a);
  if (!edge) { if (Math.abs(u) > RG.L / 2 + 10 || Math.abs(Math.abs(v) - RG.H / 2) > 26) return null; edge = v >= 0 ? 1 : -1; }
  const vv = edge * RG.H / 2, sx = RG.x + u * Math.cos(a) - vv * Math.sin(a), sy = RG.y + u * Math.sin(a) + vv * Math.cos(a);
  const r = mc.getBoundingClientRect();
  return {edge, ll: map.containerPointToLatLng([sx - r.left, sy - r.top])};
}
(function reguaEventos() {
  const el = $('ruler'), ptr = new Map(); let base = null;
  const ang = (p, q) => Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI;
  const snap = a => { const s = Math.round(a / 15) * 15; return Math.abs(a - s) <= 2 ? s : a; };
  el.addEventListener('pointerdown', e => {
    e.stopPropagation(); el.setPointerCapture(e.pointerId); ptr.set(e.pointerId, [e.clientX, e.clientY]);
    base = {x: RG.x, y: RG.y, a: RG.a, p: [e.clientX, e.clientY], rot: e.target.id === 'ruler-rot', two: ptr.size === 2 ? [...ptr.values()] : null};
  });
  el.addEventListener('pointermove', e => {
    if (!ptr.has(e.pointerId) || !base) return;
    ptr.set(e.pointerId, [e.clientX, e.clientY]);
    if (ptr.size === 2 && base.two) { // dois dedos: gira e move
      const [p, q] = [...ptr.values()], [p0, q0] = base.two;
      RG.a = snap(base.a + ang(p, q) - ang(p0, q0));
      RG.x = base.x + ((p[0] + q[0]) - (p0[0] + q0[0])) / 2; RG.y = base.y + ((p[1] + q[1]) - (p0[1] + q0[1])) / 2;
    } else if (base.rot) RG.a = snap(ang([RG.x, RG.y], [e.clientX, e.clientY]));
    else { RG.x = base.x + e.clientX - base.p[0]; RG.y = base.y + e.clientY - base.p[1]; }
    reguaDraw();
  });
  const fim = e => { ptr.delete(e.pointerId); base = ptr.size ? {x: RG.x, y: RG.y, a: RG.a, p: [...ptr.values()][0], rot: false, two: null} : null; };
  el.addEventListener('pointerup', fim); el.addEventListener('pointercancel', fim);
  el.addEventListener('wheel', e => { e.preventDefault(); RG.a += e.deltaY > 0 ? 1 : -1; reguaDraw(); }, {passive: false});
  $('ruler-btn').onclick = () => reguaToggle();
  map.on('zoomend', reguaDraw); addEventListener('resize', reguaDraw);
})();
