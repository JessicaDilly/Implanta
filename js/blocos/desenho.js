// ---------- Desenho humanizado (coordenadas locais em metros, y para baixo) ----------
function svgContent(kind, w, h, uid, name, src) {
  const x0 = -w / 2, y0 = -h / 2;
  const shadow = d => ''; // sem sombra decorativa atrás dos blocos (confundia com a sombra do sol)
  if (kind === 'estac') {
    const P = parkLayout(w, h), ox = x0 + (w - P.perRow * VAGA.w) / 2;
    let s = `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#4a4f55"/><g class="nss" stroke="#f4f4f4" stroke-width="1.2" fill="none">`;
    P.rows.forEach(ry => {
      const y1 = y0 + ry;
      for (let i = 0; i <= P.perRow; i++) s += `<line x1="${ox + i * VAGA.w}" y1="${y1}" x2="${ox + i * VAGA.w}" y2="${y1 + VAGA.h}"/>`;
    });
    s += `</g><g class="nss" stroke="#ffd54f" stroke-width="1.2" stroke-dasharray="6 6">`;
    P.aisles.forEach(ay => { s += `<line x1="${x0 + 0.5}" y1="${y0 + ay + VAGA.corredor / 2}" x2="${-x0 - 0.5}" y2="${y0 + ay + VAGA.corredor / 2}"/>`; });
    s += `</g>`;
    const fs = Math.max(1, Math.min(2.4, w / 9));
    const ty = P.aisles.length ? y0 + P.aisles[0] + VAGA.corredor / 2 + fs * 0.35 : fs * 0.35;
    return s + `<text x="0" y="${ty}" font-size="${fs}" text-anchor="middle" fill="#fff" font-family="system-ui,sans-serif" font-weight="700" stroke="#4a4f55" stroke-width="${fs * 0.15}" paint-order="stroke">${P.count} vagas</text>`;
  }
  if (kind === 'infantil') {
    // quadra infantil (mini tênis): área de jogo 14 × 6,4 m centrada, linhas de saque a 3 m da rede
    const cw = Math.min(7, w / 2 - .5), ch = Math.min(3.2, h / 2 - .4), sv = Math.min(3, cw - .5), ln = (a, b, c, d) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}"/>`;
    return `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#5b9b4a"/><rect x="${-cw}" y="${-ch}" width="${2 * cw}" height="${2 * ch}" fill="#ef7d3c"/>` +
      `<g class="nss" stroke="#fff" stroke-width="1.3" fill="none"><rect x="${-cw}" y="${-ch}" width="${2 * cw}" height="${2 * ch}"/>` + ln(-sv, -ch, -sv, ch) + ln(sv, -ch, sv, ch) + ln(-sv, 0, sv, 0) + `</g>` +
      `<line class="nss" x1="0" y1="${-ch - .4}" x2="0" y2="${ch + .4}" stroke="#1b1b1b" stroke-width="2.2"/>`;
  }
  if (kind === 'padel') {
    // eixo maior em x; linhas de saque a 6,95 m da rede; fundos de vidro e laterais com 2 m de vidro + tela
    const cw = 10, ch = 5, sv = 6.95, ln = (a, b, c, d) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}"/>`;
    return `${shadow(0.3)}<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#33414d"/>` +
      `<rect x="${-cw}" y="${-ch}" width="${2 * cw}" height="${2 * ch}" fill="#2a6db5"/>` +
      `<g class="nss" stroke="#ffffff" stroke-width="1.3" fill="none">` + ln(-sv, -ch, -sv, ch) + ln(sv, -ch, sv, ch) + ln(-sv - 0.2, 0, sv + 0.2, 0) + `</g>` +
      `<g fill="none" stroke-linecap="square">` +
      `<path d="M${-cw} ${-ch} V${ch} M${cw} ${-ch} V${ch} M${-cw} ${-ch} H${-cw + 2} M${-cw} ${ch} H${-cw + 2} M${cw} ${-ch} H${cw - 2} M${cw} ${ch} H${cw - 2}" stroke="#d8f0ff" stroke-width="0.32" opacity=".95"/>` +
      `<path d="M${-cw + 2} ${-ch} H${cw - 2} M${-cw + 2} ${ch} H${cw - 2}" stroke="#9fb3c4" stroke-width="0.22" stroke-dasharray="0.35 0.2"/></g>` +
      `<line class="nss" x1="0" y1="${-ch - 0.2}" x2="0" y2="${ch + 0.2}" stroke="#1b1b1b" stroke-width="2.5"/>` +
      `<circle cx="0" cy="${-ch - 0.2}" r="0.14" fill="#1b1b1b"/><circle cx="0" cy="${ch + 0.2}" r="0.14" fill="#1b1b1b"/>`;
  }
  if (COURT_COLORS[kind]) {
    const C = COURT_COLORS[kind];
    const cw = PLAY.w / 2, ch = PLAY.h / 2, sh = 8.23 / 2, sv = 6.40, ns = ch + 0.914;
    const ln = (a, b, c, d) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}"/>`;
    return `${shadow(0.4)}<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="${C.escape}"/>` +
      `<rect x="${-cw}" y="${-ch}" width="${2 * cw}" height="${2 * ch}" fill="${C.court}"/>` +
      `<g class="nss" stroke="${C.line}" stroke-width="1.3" fill="none"><rect x="${-cw}" y="${-ch}" width="${2 * cw}" height="${2 * ch}"/>` +
      ln(-cw, -sh, cw, -sh) + ln(-cw, sh, cw, sh) + ln(-sv, -sh, -sv, sh) + ln(sv, -sh, sv, sh) + ln(-sv, 0, sv, 0) +
      ln(-cw, 0, -cw + 0.3, 0) + ln(cw, 0, cw - 0.3, 0) + `</g>` +
      `<line class="nss" x1="0" y1="${-ns}" x2="0" y2="${ns}" stroke="#1b1b1b" stroke-width="2.5"/>` +
      `<circle cx="0" cy="${-ns}" r="0.15" fill="#1b1b1b"/><circle cx="0" cy="${ns}" r="0.15" fill="#1b1b1b"/>`;
  }
  if (kind === 'edif') {
    // laje com platibanda e telhado embutido de telha metálica (duas águas baixas, calhas junto à platibanda)
    const p = Math.min(0.2, Math.min(w, h) * 0.04), ix = x0 + p, iy = y0 + p, iw = w - 2 * p, ih = h - 2 * p, lng = w >= h, cal = Math.min(0.35, Math.min(iw, ih) * 0.05);
    const sp = Math.max(1, (lng ? iw : ih) / 80); // nervuras da telha (a cada 1 m, no sentido da queda)
    let rib = '';
    for (let t = sp; t < (lng ? iw : ih) - 0.01; t += sp) rib += lng ? `<line x1="${ix + t}" y1="${iy + cal}" x2="${ix + t}" y2="${-iy - cal}"/>` : `<line x1="${ix + cal}" y1="${iy + t}" x2="${-ix - cal}" y2="${iy + t}"/>`;
    const meia = lng ? [[ix, iy, iw, ih / 2, '#d3d8dc'], [ix, 0, iw, ih / 2, '#aeb5bb']] : [[ix, iy, iw / 2, ih, '#d3d8dc'], [0, iy, iw / 2, ih, '#aeb5bb']];
    const calhas = lng ? `<rect x="${ix}" y="${iy}" width="${iw}" height="${cal}"/><rect x="${ix}" y="${-iy - cal}" width="${iw}" height="${cal}"/>` : `<rect x="${ix}" y="${iy}" width="${cal}" height="${ih}"/><rect x="${-ix - cal}" y="${iy}" width="${cal}" height="${ih}"/>`;
    const fs = Math.max(0.8, Math.min(w, h) * 0.13);
    return shadow(0.7) + `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#e6e0d6"/>` +
      meia.map(([a, b2, c, d, col]) => `<rect x="${a}" y="${b2}" width="${c}" height="${d}" fill="${col}"/>`).join('') +
      `<g fill="#8d949b">${calhas}</g><g class="nss" stroke="#8e969d" stroke-width="0.6" stroke-opacity=".8">${rib}</g>` +
      `<g class="nss" fill="none" stroke="#5f666c" stroke-width="1">${lng ? `<line x1="${ix}" y1="0" x2="${-ix}" y2="0"/>` : `<line x1="0" y1="${iy}" x2="0" y2="${-iy}"/>`}<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" stroke-width="0.7"/></g>` +
      `<g class="nss" fill="none" stroke="#6b6258"><rect x="${x0}" y="${y0}" width="${w}" height="${h}" stroke-width="1.4"/></g>` +
      (name ? `<text x="0" y="${fs * 0.35}" font-size="${fs}" text-anchor="middle" fill="#fff" stroke="rgba(0,0,0,.55)" stroke-width="${fs * 0.12}" paint-order="stroke" font-family="system-ui,sans-serif" font-weight="600">${esc(name)}</text>` : '');
  }
  if (kind === 'vaga') {
    const cw = Math.min(1.8, w * 0.75), chh = Math.min(4.3, h * 0.86), cy = -chh / 2;
    return `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#5a5f64"/>` +
      `<g class="nss" stroke="#f5f5f5" stroke-width="1.5"><line x1="${x0}" y1="${y0}" x2="${x0}" y2="${-y0}"/><line x1="${-x0}" y1="${y0}" x2="${-x0}" y2="${-y0}"/></g>` +
      `<rect x="${-cw / 2 + 0.25}" y="${cy + 0.25}" width="${cw}" height="${chh}" rx="0.45" fill="rgba(0,0,0,.35)"/>` +
      `<rect class="nss" x="${-cw / 2}" y="${cy}" width="${cw}" height="${chh}" rx="0.45" fill="#dfe5ea" stroke="#6c7680" stroke-width="1"/>` +
      `<rect x="${-cw / 2 + 0.15}" y="${cy + chh * 0.22}" width="${cw - 0.3}" height="${chh * 0.2}" rx="0.2" fill="#2f3b47"/>` +
      `<rect x="${-cw / 2 + 0.18}" y="${cy + chh * 0.72}" width="${cw - 0.36}" height="${chh * 0.13}" rx="0.15" fill="#2f3b47"/>`;
  }
  if (kind === 'arvore') return treeSvg(src || 'frondosa', Math.min(w, h) / 2, uid);
  if (kind === 'dxf') {
    const p = PLANS[src];
    if (!p) return `<rect class="nss" x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#eceff1" stroke="#90a4ae" stroke-width="1"/>`;
    return shadow(0.5) + `<g transform="scale(${w / p.w0} ${h / p.h0})">${p.inner}</g>`;
  }
  // planta importada (imagem)
  return shadow(0.5) + `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#fff"/>` +
    `<image href="${src}" x="${x0}" y="${y0}" width="${w}" height="${h}" preserveAspectRatio="none"/>` +
    `<rect class="nss" x="${x0}" y="${y0}" width="${w}" height="${h}" fill="none" stroke="#333" stroke-width="1"/>`;
}
