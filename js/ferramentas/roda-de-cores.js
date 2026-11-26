// ---------- Roda de cores do pincel ----------
(function rodaDeCores() {
  const cv = $('cwheel'), g = cv.getContext('2d'), N = cv.width, r = N / 2;
  let hue = 0, sat = 0, lum = 50;
  const hsl2hex = (h, s, l) => { s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return '#' + [f(0), f(8), f(4)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join(''); };
  function desenha() {
    const img = g.createImageData(N, N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const dx = x - r, dy = y - r, d = Math.hypot(dx, dy); if (d > r) continue;
      const c = hsl2hex((Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360, d / r * 100, lum), k = (y * N + x) * 4;
      img.data[k] = parseInt(c.slice(1, 3), 16); img.data[k + 1] = parseInt(c.slice(3, 5), 16); img.data[k + 2] = parseInt(c.slice(5, 7), 16); img.data[k + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    const a = hue * Math.PI / 180, px = r + Math.cos(a) * sat / 100 * r, py = r + Math.sin(a) * sat / 100 * r;
    g.lineWidth = 3; g.strokeStyle = '#fff'; g.beginPath(); g.arc(px, py, 7, 0, 7); g.stroke(); g.lineWidth = 1.5; g.strokeStyle = '#000'; g.stroke();
  }
  function usa(cor, recente) {
    bcolor = cor; $('cw-prev').style.background = cor; $('cw-hex').value = cor;
    document.querySelectorAll('#swatches .sw').forEach(x => x.classList.toggle('on', x.title === cor));
    if (recente && ![...$('swatches').querySelectorAll('.sw')].some(x => x.title === cor)) { // guarda nas cores recentes
      const b = document.createElement('button'); b.className = 'sw on'; b.style.background = cor; b.title = cor;
      b.onclick = () => usa(cor); $('swatches').prepend(b);
      const sws = $('swatches').querySelectorAll('.sw'); if (sws.length > 14) sws[sws.length - 1].remove();
    }
  }
  const pega = e => { const R0 = cv.getBoundingClientRect(), x = (e.clientX - R0.left) / R0.width * N - r, y = (e.clientY - R0.top) / R0.height * N - r;
    hue = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360; sat = Math.min(100, Math.hypot(x, y) / r * 100); desenha(); usa(hsl2hex(hue, sat, lum)); };
  let arrasta = false;
  cv.addEventListener('pointerdown', e => { arrasta = true; cv.setPointerCapture(e.pointerId); pega(e); });
  cv.addEventListener('pointermove', e => { if (arrasta) pega(e); });
  cv.addEventListener('pointerup', () => { arrasta = false; usa(bcolor, true); });
  $('cw-l').oninput = () => { lum = +$('cw-l').value; desenha(); usa(hsl2hex(hue, sat, lum)); };
  $('cw-hex').onchange = () => { const v = $('cw-hex').value.trim(); if (/^#[0-9a-f]{6}$/i.test(v)) usa(v.toLowerCase(), true); };
  desenha(); usa(bcolor);
})();
