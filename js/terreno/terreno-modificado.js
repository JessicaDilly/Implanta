// ---------- Terreno modificado pelo projeto (plataformas + taludes) ----------
// Usado nos perfis (linha "projeto") e no relevo do 3D. Para cada plataforma: dentro dela, cota da plataforma;
// fora, o talude sobe (corte) ou desce (aterro) a partir da borda até encontrar o terreno natural.
function terrModel() {
  const G = TERR.grid; if (!G) return null;
  const plats = blocks.filter(b => PLAT_KINDS[b.kind]).map(b => { const p = platformOf(b, G); return p ? {b, cota: p.cota, W: b.w / 2, H: b.h / 2} : null; }).filter(Boolean);
  if (!plats.length) return null;
  const bb = L.latLngBounds(plats.flatMap(q => q.b.ring.map(p => [p[1], p[0]]))).pad(1.2);
  return {
    bb,
    z: (lat, lng, z0) => {
      let z = z0;
      for (const q of plats) {
        const [u, v] = toLocal(q.b, {lat, lng}), dx = Math.max(0, Math.abs(u) - q.W), dy = Math.max(0, Math.abs(v) - q.H), d = Math.hypot(dx, dy);
        if (d === 0) { z = q.cota; continue; }
        if (!TAL.on) continue;
        if (z0 > q.cota) z = Math.min(z, q.cota + d / TAL.rc); // corte: o talude sobe até o terreno
        else if (z0 < q.cota) z = Math.max(z, q.cota - d / TAL.ra); // aterro: o talude desce até o terreno
      }
      return z;
    }
  };
}
