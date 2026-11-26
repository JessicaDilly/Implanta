// ---------- Árvores humanizadas (vista de cima) ----------
const TREES = {
  frondosa: {name: 'Árvore frondosa', d: 8, alt: 9, c: ['#b5dc7a', '#5f9e3a', '#2e5e1c']},
  ipeAmarelo: {name: 'Ipê amarelo', d: 7, alt: 8, c: ['#fff3a3', '#f2c230', '#b8860b'], flor: '#fff8c4'},
  ipeRoxo: {name: 'Ipê roxo', d: 7, alt: 8, c: ['#f6c6ec', '#c25aa6', '#7b2d6b'], flor: '#fde3f6'},
  palmeira: {name: 'Palmeira', d: 6, alt: 10},
  pinheiro: {name: 'Pinheiro', d: 5, alt: 12},
  arbusto: {name: 'Arbusto', d: 2.5, alt: 1.5, c: ['#c5e1a5', '#7cb342', '#3e6b22']}
};
function treeSvg(t, r, uid) {
  const T = TREES[t] || TREES.frondosa, sh = '';
  const grad = c => `<defs><radialGradient id="${uid}" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="${c[0]}"/><stop offset=".6" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></radialGradient></defs>`;
  const rnd = (k => () => (k = (k * 9301 + 49297) % 233280) / 233280)(t.length * 97 + 13);
  if (t === 'palmeira') {
    let s = `<defs><linearGradient id="${uid}" x1="0" x2="1"><stop offset="0" stop-color="#9ccc65"/><stop offset="1" stop-color="#33691e"/></linearGradient></defs>` + sh;
    for (let k = 0; k < 11; k++) {
      const a = k / 11 * 2 * Math.PI + rnd() * .2, c = Math.cos(a), si = Math.sin(a), L = r * (.85 + rnd() * .15), wd = r * .2;
      const tip = [c * L, si * L], mid = [c * L * .5 - si * wd, si * L * .5 + c * wd], mid2 = [c * L * .5 + si * wd * .6, si * L * .5 - c * wd * .6];
      s += `<path d="M0 0 Q${mid[0]} ${mid[1]} ${tip[0]} ${tip[1]} Q${mid2[0]} ${mid2[1]} 0 0Z" fill="url(#${uid})" stroke="#2e5e1c" stroke-width="${r * .015}"/>` +
        `<path d="M0 0 L${tip[0] * .97} ${tip[1] * .97}" stroke="#dcedc8" stroke-width="${r * .02}" stroke-opacity=".7"/>`;
    }
    return s + `<circle r="${r * .14}" fill="#6d4c41" stroke="#4e342e" stroke-width="${r * .02}"/><circle r="${r * .06}" fill="#a1887f"/>`;
  }
  if (t === 'pinheiro') {
    const star = (R1, R2, n, rot) => { let p = ''; for (let k = 0; k < 2 * n; k++) { const a = k / (2 * n) * 2 * Math.PI + rot, rr = k % 2 ? R2 : R1; p += (k ? 'L' : 'M') + (Math.cos(a) * rr).toFixed(3) + ' ' + (Math.sin(a) * rr).toFixed(3); } return p + 'Z'; };
    return `<defs><radialGradient id="${uid}" cx="45%" cy="40%" r="65%"><stop offset="0" stop-color="#7fb069"/><stop offset=".7" stop-color="#2f6b3a"/><stop offset="1" stop-color="#1b4026"/></radialGradient></defs>` + sh +
      `<path d="${star(r, r * .62, 14, 0)}" fill="url(#${uid})" stroke="#173a22" stroke-width="${r * .02}"/>` +
      `<path d="${star(r * .66, r * .4, 10, .2)}" fill="#3f8a4b" fill-opacity=".9"/>` +
      `<path d="${star(r * .36, r * .2, 7, .5)}" fill="#8cc084"/><circle r="${r * .07}" fill="#c5e1a5"/>`;
  }
  // copas: lóbulos sobrepostos, com brilho e folhas
  let s = grad(T.c) + sh, lobes = '';
  const n = t === 'arbusto' ? 6 : 8;
  for (let k = 0; k < n; k++) {
    const a = k / n * 2 * Math.PI + rnd() * .3, d = r * (.42 + rnd() * .08), rl = r * (.5 + rnd() * .1);
    lobes += `<circle cx="${(Math.cos(a) * d).toFixed(3)}" cy="${(Math.sin(a) * d).toFixed(3)}" r="${rl.toFixed(3)}"/>`;
  }
  s += `<g fill="url(#${uid})" stroke="${T.c[2]}" stroke-width="${r * .025}">${lobes}<circle r="${r * .55}"/></g>`;
  // segunda camada mais clara (volume)
  let hi = '';
  for (let k = 0; k < 5; k++) { const a = k / 5 * 2 * Math.PI + 1, d = r * .28; hi += `<circle cx="${(Math.cos(a) * d - r * .1).toFixed(3)}" cy="${(Math.sin(a) * d - r * .12).toFixed(3)}" r="${(r * .26).toFixed(3)}"/>`; }
  s += `<g fill="${T.c[0]}" fill-opacity=".45">${hi}</g>`;
  // folhas / flores em pontinhos
  let dots = '';
  for (let k = 0; k < (T.flor ? 34 : 18); k++) {
    const a = rnd() * 2 * Math.PI, d = Math.sqrt(rnd()) * r * .88, rr = r * (T.flor ? .055 : .045);
    dots += `<circle cx="${(Math.cos(a) * d).toFixed(3)}" cy="${(Math.sin(a) * d).toFixed(3)}" r="${rr.toFixed(3)}"/>`;
  }
  s += `<g fill="${T.flor || T.c[2]}" fill-opacity="${T.flor ? .95 : .35}">${dots}</g>`;
  return s;
}

function thumb(kind, w, h, src) {
  const p = Math.max(w, h) * 0.08;
  return `<svg viewBox="${-w / 2 - p} ${-h / 2 - p} ${w + 2 * p} ${h + 2 * p}" preserveAspectRatio="xMidYMid meet"><g>${svgContent(kind, w, h, 't' + (uidSeq++), '', src)}</g></svg>`;
}
