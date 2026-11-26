// ---------- Utilidades usadas em todo o app ----------
const $ = id => document.getElementById(id);
const num = id => parseFloat($(id).value) || 0;
const fmt = v => v.toLocaleString('pt-BR', {maximumFractionDigits: 1});
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
let toastT;
function msg(t) {
  const el = $('toast');
  if (!t) { el.style.opacity = 0; return; }
  el.textContent = t; el.style.opacity = 1;
  clearTimeout(toastT); toastT = setTimeout(() => { el.style.opacity = 0; }, 3800);
}
const R = 111320; // metros por grau de latitude (aprox.)
