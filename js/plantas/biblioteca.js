// ---------- Biblioteca e importação de plantas ----------
const LIB_KEY = 'implantacao.biblioteca.v1';
let plantas = [];
try { plantas = JSON.parse(localStorage.getItem(LIB_KEY) || '[]'); } catch (e) { plantas = []; }
function savePlantas() { try { localStorage.setItem(LIB_KEY, JSON.stringify(plantas)); return true; } catch (e) { return false; } }
function renderLib() {
  const lib = $('lib'); lib.innerHTML = '';
  Object.values(CATS).forEach(C => {
    const h = document.createElement('h3'); h.className = 'lib-h'; h.textContent = C.titulo; lib.appendChild(h);
    const g = document.createElement('div'); g.className = 'lib'; lib.appendChild(g);
    ordenado(C.itens()).forEach(({it, n}, k) => {
      const d = tile(it, n, k === 0 && n > 0);
      d.onclick = () => { inserir(it); closePop(); };
      if (it.user) {
        const x = document.createElement('button'); x.className = 'x'; x.textContent = '×'; x.title = 'Remover da biblioteca';
        x.onclick = e => { e.stopPropagation(); if (confirm('Remover "' + it.name + '" da biblioteca?')) { plantas.splice(it.idx, 1); savePlantas(); renderLib(); } };
        d.appendChild(x);
      }
      g.appendChild(d);
    });
  });
}
function readImage(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onerror = rej;
    fr.onload = () => {
      const url = fr.result, img = new Image();
      img.onerror = rej;
      img.onload = () => {
        const w = img.naturalWidth || 1000, h = img.naturalHeight || 1000;
        if (file.type !== 'image/svg+xml' && Math.max(w, h) > 2000) { // reduz imagens grandes para caber no navegador
          const k = 2000 / Math.max(w, h), cv = document.createElement('canvas');
          cv.width = Math.round(w * k); cv.height = Math.round(h * k);
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
          res({url: cv.toDataURL(file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png', 0.9), w, h});
        } else res({url, w, h});
      };
      img.src = url;
    };
    fr.readAsDataURL(file);
  });
}
$('pl-add').onclick = async () => {
  const f = $('pl-file').files[0];
  if (!f) { msg('Escolha o arquivo da planta.'); return; }
  const name0 = $('pl-nome').value.trim() || f.name.replace(/\.[^.]+$/, '');
  if (/\.dxf$/i.test(f.name)) {
    let r = null;
    try { r = dxfToPlan(await f.text()); } catch (e) { r = null; }
    if (!r) { msg('Não foi possível ler o DXF. Salve no AutoCAD como DXF 2018 ou anterior e tente de novo.'); return; }
    const id = 'u' + Date.now();
    PLANS[id] = {inner: r.inner, w0: r.w, h0: r.h};
    plantas.push({kind: 'dxf', id, name: name0, w: r.w, h: r.h, w0: r.w, h0: r.h, inner: r.inner});
    const ok = savePlantas(); renderLib();
    msg((ok ? 'Planta adicionada: ' : 'Planta adicionada só nesta sessão (arquivo grande demais para salvar): ') + fmt(r.w) + ' × ' + fmt(r.h) + ' m.');
    ['pl-file', 'pl-nome', 'pl-w', 'pl-h'].forEach(id2 => { $(id2).value = ''; });
    return;
  }
  const w = num('pl-w');
  if (w <= 0) { msg('Informe a largura real em metros.'); return; }
  let img;
  try { img = await readImage(f); } catch (e) { msg('Não foi possível ler a imagem.'); return; }
  let h = num('pl-h'); if (h <= 0) h = Math.round(w * img.h / img.w * 100) / 100;
  plantas.push({name: name0, w, h, src: img.url});
  const ok = savePlantas(); renderLib();
  msg(ok ? 'Planta adicionada à biblioteca.' : 'Planta adicionada só nesta sessão: o arquivo é grande demais para ficar salvo no navegador.');
  ['pl-file', 'pl-nome', 'pl-w', 'pl-h'].forEach(id => { $(id).value = ''; });
};
