// ---------- Chão da caminhada ----------
// A foto de satélite tem uns 30 cm por pixel: vista a 1,60 m do chão vira um borrão. Na caminhada o lote ganha um chão
// limpo (gramado) e, até 150 m em volta, uma textura de grão por cima do satélite dá definição ao que está perto.
function graoChao() {
  const n = 512, d = new Uint8ClampedArray(n * n * 4);
  // ruído suave que se repete nas bordas, em dois tamanhos de mancha (manchas grandes deixariam a repetição visível)
  const ruido = m => {
    const g = Float32Array.from({length: m * m}, () => Math.random() * 2 - 1);
    return (x, y) => { const fx = x * m / n, fy = y * m / n, x0 = Math.floor(fx) % m, y0 = Math.floor(fy) % m, x1 = (x0 + 1) % m, y1 = (y0 + 1) % m, tx = fx - Math.floor(fx), ty = fy - Math.floor(fy);
      return (g[y0 * m + x0] * (1 - tx) + g[y0 * m + x1] * tx) * (1 - ty) + (g[y1 * m + x0] * (1 - tx) + g[y1 * m + x1] * tx) * ty; };
  };
  const fino = ruido(512), medio = ruido(170);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const v = Math.max(-1, Math.min(1, fino(x, y) * .7 + medio(x, y) * .55)), i = (y * n + x) * 4;
    d[i] = d[i + 1] = d[i + 2] = v > 0 ? 255 : 0; d[i + 3] = Math.abs(v) * 150; // pontos claros e escuros, meio transparentes
  }
  return {width: n, height: n, data: d};
}
function chao3D() {
  if (!map3d || !map3d.getLayer('terreno')) return;
  const v = WALK.on && CAM3D.chao ? 'visible' : 'none';
  map3d.setLayoutProperty('terreno', 'visibility', v); map3d.setLayoutProperty('grao', 'visibility', v);
}
