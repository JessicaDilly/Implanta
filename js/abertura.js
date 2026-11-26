// Abertura: roda assim que o HTML dela chega, enquanto o resto do app carrega. Aparece na primeira abertura da aba; toque ou tecla pula.
(function () {
  var sp = document.getElementById('splash'); if (!sp) return;
  var seen = false; try { seen = sessionStorage.getItem('implanta.abertura') === '1'; sessionStorage.setItem('implanta.abertura', '1'); } catch (e) {}
  if (seen) { sp.parentNode.removeChild(sp); return; }
  var st = sp.querySelector('.ip-stage');
  function fit() { var k = Math.min(innerWidth / 1280, innerHeight / 720); st.style.transform = 'scale(' + k + ') translate(-640px, -360px)'; }
  function end() { if (sp.classList.contains('out')) return; sp.classList.add('out'); setTimeout(function () { if (sp.parentNode) sp.parentNode.removeChild(sp); }, 700); }
  fit(); addEventListener('resize', fit);
  sp.classList.add('go');
  sp.addEventListener('click', end); addEventListener('keydown', end, {once: true});
  setTimeout(end, matchMedia('(prefers-reduced-motion: reduce)').matches ? 800 : 6500);
})();
