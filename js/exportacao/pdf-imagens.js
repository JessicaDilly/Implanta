// ---------- Exportação em PDF (prancha A3) ----------
function svgToImage(svg, r) {
  return new Promise(res => {
    const c = svg.cloneNode(true);
    c.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    c.setAttribute('width', r.width); c.setAttribute('height', r.height);
    c.removeAttribute('style'); c.removeAttribute('class');
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(c)], {type: 'image/svg+xml'}));
    const im = new Image();
    im.onload = () => { res(im); URL.revokeObjectURL(url); };
    im.onerror = () => { res(null); URL.revokeObjectURL(url); };
    im.src = url;
  });
}
async function mapCanvas(withTiles) {
  const R0 = mc.getBoundingClientRect(), S = 2, cv = document.createElement('canvas');
  cv.width = Math.round(R0.width * S); cv.height = Math.round(R0.height * S);
  const g = cv.getContext('2d'); g.scale(S, S);
  g.fillStyle = bg === 'paper' ? '#fbfaf7' : '#3a4046'; g.fillRect(0, 0, R0.width, R0.height);
  if (withTiles) mc.querySelectorAll('.leaflet-tile-pane .leaflet-tile').forEach(t => {
    const r = t.getBoundingClientRect(), op = parseFloat(getComputedStyle(t.closest('.leaflet-layer')).opacity) || 1;
    g.globalAlpha = op;
    try { g.drawImage(t, r.left - R0.left, r.top - R0.top, r.width, r.height); } catch (e) {}
    g.globalAlpha = 1;
  });
  // mapa de horas de sol (imagem) entra antes das camadas vetoriais
  for (const im of ['terrain', 'terrtop', ...(solVisible() ? ['shadows'] : [])].flatMap(p => Array.from(map.getPane(p).querySelectorAll('img')))) {
    const r = im.getBoundingClientRect(); g.globalAlpha = parseFloat(im.style.opacity) || .78; g.imageSmoothingEnabled = false;
    try { g.drawImage(im, r.left - R0.left, r.top - R0.top, r.width, r.height); } catch (e) {}
    g.globalAlpha = 1; g.imageSmoothingEnabled = true;
  }
  for (const p of ['overlayPane', 'lotes', 'blocks', 'shadows', 'outlines', 'contours', 'sun', 'sketch']) {
    for (const s of Array.from(map.getPane(p).children).filter(el => el.tagName.toLowerCase() === 'svg')) {
      if (s.style.display === 'none') continue;
      const r = s.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
      const im = await svgToImage(s, r);
      if (im) g.drawImage(im, r.left - R0.left, r.top - R0.top, r.width, r.height);
    }
  }
  mc.querySelectorAll('.cota').forEach(el => {
    const r = el.getBoundingClientRect(), x = r.left - R0.left, y = r.top - R0.top;
    g.fillStyle = '#ff9800'; g.fillRect(x, y, r.width, r.height);
    g.fillStyle = '#fff'; g.font = '600 12px system-ui,sans-serif'; g.textBaseline = 'middle'; g.fillText(el.textContent, x + 6, y + r.height / 2);
  });
  return {cv, R0};
}
