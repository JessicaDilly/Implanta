// ---------- Exportação ----------
function baixar(nome, texto, tipo) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([texto], {type: tipo}));
  a.download = nome; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
function kml() {
  const pm = (name, ring, style) => `<Placemark><name>${esc(name)}</name><styleUrl>#${style}</styleUrl><Polygon><outerBoundaryIs><LinearRing><coordinates>` +
    ring.map(p => p[0].toFixed(8) + ',' + p[1].toFixed(8) + ',0').join(' ') + '</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>\n';
  const st = (id, line, fill) => `<Style id="${id}"><LineStyle><color>${line}</color><width>2</width></LineStyle><PolyStyle>${fill ? '<color>' + fill + '</color>' : '<fill>0</fill>'}</PolyStyle></Style>\n`;
  let out = st('lote', 'ff3bebff', null) + st('recuo', 'ffffffff', null) + st('escape', 'ff4e7d3f', '804e7d3f') +
            st('jogo', 'ffffffff', 'c09e5f2d') + st('edif', 'ff3a55a9', 'c05075cf') + st('vaga', 'ff645f5a', 'c0645f5a');
  out += pm('Lote', lot.ring, 'lote');
  polysOf(buildable).forEach((r, i) => { out += pm('Área edificável ' + (i + 1), r, 'recuo'); });
  const kcol = (hex, a) => a + hex.slice(5, 7) + hex.slice(3, 5) + hex.slice(1, 3);
  strokes.forEach((s, i) => {
    out += `<Placemark><name>Croqui ${i + 1}</name><Style><LineStyle><color>${kcol(s.color, Math.round(s.op * 255).toString(16).padStart(2, '0'))}</color><width>3</width></LineStyle></Style>` +
      `<LineString><tessellate>1</tessellate><coordinates>${s.pts.map(p => p[1].toFixed(8) + ',' + p[0].toFixed(8) + ',0').join(' ')}</coordinates></LineString></Placemark>\n`;
  });
  blocks.forEach(b => {
    if (TYPES[b.kind].court) {
      out += pm(b.name + ' (escape)', b.ring, 'escape');
      out += pm(b.name + ' (jogo)', rotRing(b.lat, b.lng, playOf(b.kind).w, playOf(b.kind).h, b.angle), 'jogo');
    } else if (b.kind === 'arvore') {
      out += `<Placemark><name>${esc(b.name)}</name><Point><coordinates>${b.lng.toFixed(8)},${b.lat.toFixed(8)},0</coordinates></Point></Placemark>\n`;
    } else out += pm(b.name + (b.kind === 'estac' ? ' (' + vagasOf(b) + ' vagas)' : ''), b.ring, b.kind === 'vaga' || b.kind === 'estac' ? 'vaga' : 'edif');
  });
  return '<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>Implanta · estudo de implantação</name>\n' + out + '</Document></kml>\n';
}
function dxf() {
  const [ox, oy] = turf.centroid(lot.feat).geometry.coordinates;
  const kx = R * Math.cos(oy * Math.PI / 180);
  const X = lng => ((lng - ox) * kx).toFixed(3), Y = lat => ((lat - oy) * R).toFixed(3);
  const ents = [];
  const pl = (layer, ring) => {
    const pts = ring.slice(0, -1);
    ents.push('0\nLWPOLYLINE\n8\n' + layer + '\n90\n' + pts.length + '\n70\n1');
    pts.forEach(p => ents.push('10\n' + X(p[0]) + '\n20\n' + Y(p[1])));
  };
  pl('LOTE', lot.ring);
  caminhos.forEach(c => {
    ents.push(['0', 'LWPOLYLINE', '8', c.tipo === 'carro' ? 'CAMINHO_CARRO' : 'CAMINHO_PEDESTRE', '90', c.pts.length, '70', '0', '43', c.w.toFixed(2)].join('\n'));
    c.pts.forEach(p => ents.push('10\n' + X(p[1]) + '\n20\n' + Y(p[0])));
  });
  polysOf(buildable).forEach(r => pl('AREA_EDIFICAVEL', r));
  blocks.forEach(b => {
    if (TYPES[b.kind].court) { pl('QUADRA_ESCAPE', b.ring); pl('QUADRA_JOGO', rotRing(b.lat, b.lng, playOf(b.kind).w, playOf(b.kind).h, b.angle)); }
    else if (b.kind === 'arvore') ents.push('0\nCIRCLE\n8\nARVORES\n10\n' + X(b.lng) + '\n20\n' + Y(b.lat) + '\n40\n' + (b.w / 2).toFixed(3));
    else pl({edif: 'EDIFICACAO', vaga: 'VAGAS', estac: 'ESTACIONAMENTO', planta: 'PLANTAS', dxf: 'PLANTAS'}[b.kind], b.ring);
  });
  strokes.forEach(s => {
    ents.push('0\nLWPOLYLINE\n8\nCROQUI\n90\n' + s.pts.length + '\n70\n0');
    s.pts.forEach(p => ents.push('10\n' + X(p[1]) + '\n20\n' + Y(p[0])));
  });
  return '0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n6\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n' + ents.join('\n') + '\n0\nENDSEC\n0\nEOF\n';
}
