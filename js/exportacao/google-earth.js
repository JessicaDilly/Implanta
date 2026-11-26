// ---------- Google Earth ----------
$('exp-earth').onclick = () => {
  const c = lot ? turf.centroid(lot.feat).geometry.coordinates : [map.getCenter().lng, map.getCenter().lat];
  const dist = lot ? Math.max(250, Math.sqrt(turf.area(lot.feat)) * 6) : 600;
  window.open(`https://earth.google.com/web/@${c[1].toFixed(6)},${c[0].toFixed(6)},0a,${Math.round(dist)}d,35y,0h,0t,0r`, '_blank', 'noopener');
  if (lot) { baixar('implantacao.kml', kml(), 'application/vnd.google-earth.kml+xml'); msg('KML baixado. No Google Earth: Projetos → Novo projeto → Importar arquivo KML.'); }
  else msg('Abri o Google Earth no local do mapa. Crie o lote para baixar também o KML do estudo.');
};
