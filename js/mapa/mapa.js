// ---------- Mapa ----------
const map = L.map('map', {zoomControl: false}).setView([-15.7801, -47.9292], 18);
L.control.zoom({position: 'bottomright'}).addTo(map);
const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 21, maxNativeZoom: 19, crossOrigin: true,
  attribution: 'Imagens: Esri, Maxar, Earthstar Geographics, GIS User Community'
}).addTo(map);
// Fundo "papel" quadriculado, como a prancheta do Concepts
const Paper = L.GridLayer.extend({
  createTile() {
    const c = document.createElement('canvas'), s = this.getTileSize();
    c.width = s.x; c.height = s.y;
    const g = c.getContext('2d');
    g.fillStyle = '#fbfaf7'; g.fillRect(0, 0, s.x, s.y);
    g.strokeStyle = 'rgba(60,90,130,.10)'; g.lineWidth = 1;
    for (let i = 0; i < s.x; i += 32) {
      g.beginPath(); g.moveTo(i + .5, 0); g.lineTo(i + .5, s.y); g.stroke();
      g.beginPath(); g.moveTo(0, i + .5); g.lineTo(s.x, i + .5); g.stroke();
    }
    g.strokeStyle = 'rgba(60,90,130,.22)'; g.strokeRect(.5, .5, s.x, s.y);
    return c;
  }
});
const paper = new Paper({maxZoom: 22});
let bg = 'sat';
map.createPane('blocks').style.zIndex = 420;
const outPane = map.createPane('outlines'); outPane.style.zIndex = 450; outPane.style.pointerEvents = 'none';
const lotLayer = L.layerGroup().addTo(map);
const recLayer = L.layerGroup().addTo(map);
const blockLayer = L.layerGroup().addTo(map);
const tmpLayer = L.layerGroup().addTo(map);
const measureLayer = L.layerGroup().addTo(map);
const vis = {lote: true, recuo: true, quadra: true, edif: true, planta: true, vaga: true, arvore: true, medidas: true, desenho: true, sol: true, terreno: true};
map.createPane('sketch').style.zIndex = 460;
const sketchLayer = L.layerGroup().addTo(map);
let strokes = [];
