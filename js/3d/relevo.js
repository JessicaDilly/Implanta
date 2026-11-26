// ---------- Relevo do 3D remodelado pelo projeto (protocolo próprio de tiles de elevação) ----------
let demVer = 0;
const terrariumDecode = d => { const f = new Float32Array(256 * 256); for (let i = 0; i < f.length; i++) f[i] = d[i * 4] * 256 + d[i * 4 + 1] + d[i * 4 + 2] / 256 - 32768; return f; };
async function demTileF(z, x, y) {
  const r = await fetch(DEM.url(z, x, y)); if (!r.ok) throw new Error('dem');
  const bmp = await createImageBitmap(await r.blob()), c = new OffscreenCanvas(256, 256), g = c.getContext('2d');
  g.drawImage(bmp, 0, 0); return terrariumDecode(g.getImageData(0, 0, 256, 256).data);
}
function registraDem3D() {
  if (registraDem3D.ok || !window.maplibregl) return; registraDem3D.ok = true;
  maplibregl.addProtocol('implanta', async params => {
    const [z, x, y] = params.url.replace('implanta://', '').split('?')[0].split('/').map(Number);
    const zz = Math.min(z, 15), k = 1 << (z - zz), px = Math.floor(x / k), py = Math.floor(y / k);
    const F = await demTileF(zz, px, py);
    const mod = terrModel(), out = new Float32Array(256 * 256);
    const n = 256 * (1 << z), lng0 = x * 256, lat0 = y * 256;
    const tileBB = L.latLngBounds([[latDe(lat0 + 256, n), (lng0 / n) * 360 - 180], [latDe(lat0, n), ((lng0 + 256) / n) * 360 - 180]]);
    const usa = mod && mod.bb.intersects(tileBB);
    for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) {
      // reamostra o tile z15 (bilinear) quando o zoom é maior
      const sx = ((x - px * k) * 256 + i + .5) / k - .5, sy = ((y - py * k) * 256 + j + .5) / k - .5;
      const ix = Math.max(0, Math.min(254, Math.floor(sx))), iy = Math.max(0, Math.min(254, Math.floor(sy))), fx = Math.min(1, Math.max(0, sx - ix)), fy = Math.min(1, Math.max(0, sy - iy));
      let zv = F[iy * 256 + ix] * (1 - fx) * (1 - fy) + F[iy * 256 + ix + 1] * fx * (1 - fy) + F[(iy + 1) * 256 + ix] * (1 - fx) * fy + F[(iy + 1) * 256 + ix + 1] * fx * fy;
      if (usa) { const lat = latDe(lat0 + j + .5, n), lng = ((lng0 + i + .5) / n) * 360 - 180; if (mod.bb.contains([lat, lng])) zv = mod.z(lat, lng, zv); }
      out[j * 256 + i] = zv;
    }
    const c = new OffscreenCanvas(256, 256), g = c.getContext('2d'), img = g.createImageData(256, 256);
    for (let p = 0; p < out.length; p++) { const v = out[p] + 32768, R0 = Math.floor(v / 256), G0 = Math.floor(v) % 256, B0 = Math.floor((v - Math.floor(v)) * 256); img.data[p * 4] = R0; img.data[p * 4 + 1] = G0; img.data[p * 4 + 2] = B0; img.data[p * 4 + 3] = 255; }
    g.putImageData(img, 0, 0);
    return {data: await (await c.convertToBlob({type: 'image/png'})).arrayBuffer()};
  });
}
function latDe(yPix, n) { const t = Math.PI * (1 - 2 * yPix / n); return Math.atan(Math.sinh(t)) * 180 / Math.PI; }
function atualizaDem3D() {
  if (!map3d || !map3d.getSource('dem') || !map3d.getSource('dem').setTiles) return;
  map3d.getSource('dem').setTiles([`implanta://{z}/{x}/{y}?v=${++demVer}`]);
}
