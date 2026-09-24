/* Generado automaticamente. No editar a mano. */
(function () {
  var v = {};
  Object.keys(v).forEach(function (id) {
    document.querySelectorAll('[data-slot="' + id + '"]').forEach(function (el) {
      var d = v[id], e = document.createElement('video');
      e.src = 'assets/' + d.archivo;
      e.autoplay = e.loop = e.muted = e.playsInline = true;
      e.setAttribute('playsinline', '');
      e.setAttribute('aria-hidden', 'true');
      e.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;'
        + 'object-fit:' + d.ajuste + ';object-position:' + d.pos + ';';
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.style.overflow = 'hidden';
      el.appendChild(e);
    });
  });
})();
