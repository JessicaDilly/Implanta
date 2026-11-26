// ---------- Camadas do mapa 3D (MapLibre): fontes e ordem das camadas ----------
// Satélite, relevo (protocolo implanta://, em relevo.js), prédios do OpenFreeMap e a geometria do estudo
// (studyGeoJSON, em modelo-do-estudo.js). As quadras em Three.js entram por cima como camada própria (quadras-three.js).
function estilo3D(c) {
  return {
    version: 8,
    sky: {'sky-color': '#8fbbe6', 'horizon-color': '#e6eef4', 'fog-color': '#e2e9ee', 'sky-horizon-blend': .7, 'horizon-fog-blend': .8, 'fog-ground-blend': .9, 'atmosphere-blend': 0},
    sources: {
      sat: {type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, maxzoom: 19, attribution: 'Esri, Maxar, Earthstar Geographics'},
      dem: {type: 'raster-dem', tiles: ['implanta://{z}/{x}/{y}?v=0'], encoding: 'terrarium', tileSize: 256, maxzoom: 17, attribution: 'AWS Terrain Tiles'},
      ofm: {type: 'vector', url: 'https://tiles.openfreemap.org/planet', attribution: '© OpenStreetMap, OpenFreeMap'},
      estudo: {type: 'geojson', data: studyGeoJSON()},
      sombras: {type: 'geojson', data: {type: 'FeatureCollection', features: []}}
    },
    layers: [
      {id: 'sat', type: 'raster', source: 'sat'},
      {id: 'predios', type: 'fill-extrusion', source: 'ofm', 'source-layer': 'building', minzoom: 14, filter: filtroPredios(c),
       paint: {'fill-extrusion-color': '#d8d3cb', 'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 6], 'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0], 'fill-extrusion-opacity': .82}},
      {id: 'terreno', type: 'fill', source: 'estudo', filter: ['==', ['get', 't'], 'terreno'], layout: {visibility: 'none'}, paint: {'fill-color': '#7c9a5c'}},
      {id: 'piso', type: 'fill', source: 'estudo', filter: ['==', ['get', 't'], 'piso'], paint: {'fill-color': ['get', 'col'], 'fill-opacity': .96}},
      {id: 'grao', type: 'fill', source: 'estudo', filter: ['==', ['get', 't'], 'entorno'], layout: {visibility: 'none'}, paint: {'fill-pattern': 'grao', 'fill-opacity': .5}},
      {id: 'linhas', type: 'line', source: 'estudo', filter: ['==', ['get', 't'], 'linha'], paint: {'line-color': ['get', 'col'], 'line-width': ['interpolate', ['linear'], ['zoom'], 16, .6, 20, 2.2]}},
      {id: 'sombra', type: 'fill', source: 'sombras', paint: {'fill-color': '#08121c', 'fill-opacity': ['get', 'op']}},
      {id: 'lote', type: 'line', source: 'estudo', filter: ['==', ['get', 't'], 'lote'], paint: {'line-color': '#ffeb3b', 'line-width': 3}},
      {id: 'recuo', type: 'line', source: 'estudo', filter: ['==', ['get', 't'], 'recuo'], paint: {'line-color': '#ffffff', 'line-width': 1.5, 'line-dasharray': [3, 3]}},
      {id: 'ext', type: 'fill-extrusion', source: 'estudo', filter: ['==', ['get', 't'], 'ext'],
       paint: {'fill-extrusion-color': ['get', 'col'], 'fill-extrusion-height': ['get', 'top'], 'fill-extrusion-base': ['get', 'base'], 'fill-extrusion-opacity': 1, 'fill-extrusion-vertical-gradient': true}},
      {id: 'vidro', type: 'fill-extrusion', source: 'estudo', filter: ['==', ['get', 't'], 'vidro'],
       paint: {'fill-extrusion-color': ['get', 'col'], 'fill-extrusion-height': ['get', 'top'], 'fill-extrusion-base': ['get', 'base'], 'fill-extrusion-opacity': .38}}
    ],
    terrain: {source: 'dem', exaggeration: 1}
  };
}
