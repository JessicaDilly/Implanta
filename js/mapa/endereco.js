// ---------- Pin no endereço encontrado ----------
const pinLayer = L.layerGroup().addTo(map);
let pinAt = null;
const PIN_SVG = '<svg viewBox="0 0 34 44"><path d="M17 1C8.2 1 1 8 1 16.6 1 28.4 17 43 17 43s16-14.6 16-26.4C33 8 25.8 1 17 1z" fill="#e53935" stroke="#fff" stroke-width="2"/><circle cx="17" cy="16.5" r="6" fill="#fff"/></svg>';
function setPin(p, silent) {
  pinLayer.clearLayers(); pinAt = p || null;
  if (pinAt) {
    const m = L.marker([pinAt.lat, pinAt.lng], {zIndexOffset: 500, icon: L.divIcon({className: 'pin', html: PIN_SVG, iconSize: [34, 44], iconAnchor: [17, 43], popupAnchor: [0, -38]})}).addTo(pinLayer);
    const box = document.createElement('div'); box.className = 'pin-pop';
    const t = document.createElement('b'); t.textContent = pinAt.label || 'Endereço pesquisado';
    const del = document.createElement('button'); del.className = 'btn'; del.textContent = 'Remover pin';
    del.onclick = () => { setPin(null); };
    box.append(t, del);
    m.bindPopup(box, {maxWidth: 260});
    m.on('click', () => { lastHit = Date.now(); });
  }
  if (!silent) commit();
}

// ---------- Busca de endereço (OpenStreetMap / Nominatim) ----------
async function buscar() {
  const q = $('endereco').value.trim(); if (!q) return;
  msg('Buscando endereço…');
  try {
    const r = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(q));
    const j = await r.json();
    if (j.length) {
      map.setView([+j[0].lat, +j[0].lon], 19); closePop();
      setPin({lat: +j[0].lat, lng: +j[0].lon, label: j[0].display_name || q});
      msg('Endereço encontrado e marcado com o pin. Agora crie o lote.');
    }
    else msg('Endereço não encontrado. Tente incluir a cidade.');
  } catch (e) { msg('A busca falhou. Verifique a conexão.'); }
}
