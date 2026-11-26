// ---------- Mapas base: Satélite (Esri), OpenStreetMap, Mapbox (com token próprio) e Papel ----------
const MB_KEY = 'creativmap.mapbox.token';
// Token público (pk.) do Mapbox da conta do Implanta. Tokens pk. são feitos para ficar no código do site;
// restrinja o uso ao endereço do site no painel do Mapbox (Access tokens → URL restrictions).
const MB_TOKEN = 'pk.eyJ1IjoiamVzc2ljYWRpbGx5IiwiYSI6ImNtd3BrOTVwaDAwNnkyeW9jejBzdXhlZ24ifQ.sRTRivSusI1BOgBQODXrCw';
let mbToken = MB_TOKEN; try { mbToken = localStorage.getItem(MB_KEY) || MB_TOKEN; } catch (e) {}
const BG_NAMES = {sat: 'Satélite', osm: 'Mapa', paper: 'Papel', mbsat: 'Mapbox', mbstr: 'Mapbox'};
const bgLayers = {sat, paper};
function bgLayer(v) {
  if (bgLayers[v]) return bgLayers[v];
  if (v === 'osm') bgLayers.osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 21, maxNativeZoom: 19, crossOrigin: true,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'});
  if (v === 'mbsat' || v === 'mbstr') {
    if (!mbToken) return null;
    const style = v === 'mbsat' ? 'satellite-streets-v12' : 'streets-v12';
    bgLayers[v] = L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/${style}/tiles/512/{z}/{x}/{y}@2x?access_token=${encodeURIComponent(mbToken)}`, {
      tileSize: 512, zoomOffset: -1, maxZoom: 22, maxNativeZoom: 21, crossOrigin: true,
      attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'});
  }
  return bgLayers[v] || null;
}
$('sat-op').addEventListener('input', () => { const l = bgLayers[bg]; if (l && l.setOpacity) l.setOpacity(num('sat-op') / 100); });
function setBg(v) {
  const nl = bgLayer(v); if (!nl || v === bg) { renderFundo(); return; }
  const ol = bgLayers[bg]; if (ol) map.removeLayer(ol);
  bg = v; nl.addTo(map); nl.bringToBack(); if (nl.setOpacity) nl.setOpacity(num('sat-op') / 100);
  $('fundo-lbl').textContent = BG_NAMES[bg];
  $('map').classList.toggle('paper', bg === 'paper');
  try { localStorage.setItem('creativmap.mapa', bg); } catch (e) {}
  renderFundo(); refreshLot();
}
function renderFundo() {
  document.querySelectorAll('#bg-seg [data-bg]').forEach(b => b.classList.toggle('on', b.dataset.bg === bg));
}
document.querySelectorAll('#bg-seg [data-bg]').forEach(b => { b.onclick = () => setBg(b.dataset.bg); });
