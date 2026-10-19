/* theme switcher — classic blue / halloween */
(function () {
  var STORAGE_KEY = 'fbrp_theme';
  var LOGOS = {
    default: 'FBRP.png',
    halloween: 'FBRP-Halloween.png'
  };

  /* halloween side decorations — pumpkins & ghosts peeking from the edges */
  var SVG_PUMPKIN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 96">' +
    '<defs><radialGradient id="pg" cx="0.5" cy="0.32" r="0.95">' +
    '<stop offset="0" stop-color="#ffb45c"/><stop offset="0.5" stop-color="#f5881a"/><stop offset="1" stop-color="#b84e04"/>' +
    '</radialGradient></defs>' +
    '<path d="M47 16c-1-7 2-11 8-13 3 2 2 6-1 8 4-2 9-2 10 2-6 2-11 5-13 11z" fill="#6f9a3e"/>' +
    '<path d="M44 18c3-4 9-4 12 0l-2 6h-8z" fill="#5c3a1e"/>' +
    '<ellipse cx="50" cy="56" rx="43" ry="33" fill="url(#pg)"/>' +
    '<ellipse cx="50" cy="56" rx="22" ry="33" fill="none" stroke="#8f3d03" stroke-opacity="0.4" stroke-width="2.5"/>' +
    '<ellipse cx="50" cy="56" rx="38" ry="33" fill="none" stroke="#8f3d03" stroke-opacity="0.3" stroke-width="2"/>' +
    '<path d="M33 48l9 13H24z" fill="#2a1503"/>' +
    '<path d="M67 48l9 13H58z" fill="#2a1503"/>' +
    '<path d="M50 56l5 7h-10z" fill="#2a1503"/>' +
    '<path d="M28 68q22 16 44 0l-5 9-6-4-6 7-6-7-6 4z" fill="#2a1503"/>' +
    '<path d="M28 68q22 16 44 0" fill="none" stroke="#ffcf7a" stroke-opacity="0.5" stroke-width="1.5"/>' +
    '</svg>';
  var SVG_GHOST = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 110">' +
    '<defs><linearGradient id="gg" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#ffffff"/><stop offset="0.7" stop-color="#f1ead8"/><stop offset="1" stop-color="#ddd2b8"/>' +
    '</linearGradient></defs>' +
    '<path d="M42 6C21 6 10 25 10 45v58l9-10 8 10 8-10 7 10 8-10 8 10 7-9 9 9V45C76 25 63 6 42 6z" fill="url(#gg)"/>' +
    '<path d="M42 6C21 6 10 25 10 45v8C15 30 26 14 42 14s27 16 32 39v-8C76 25 63 6 42 6z" fill="#ffffff" opacity="0.55"/>' +
    '<ellipse cx="30" cy="44" rx="4.6" ry="7.5" fill="#1a1408" transform="rotate(-14 30 44)"/>' +
    '<ellipse cx="54" cy="44" rx="4.6" ry="7.5" fill="#1a1408" transform="rotate(14 54 44)"/>' +
    '<ellipse cx="42" cy="62" rx="7" ry="10.5" fill="#1a1408"/>' +
    '<ellipse cx="42" cy="66" rx="3.4" ry="4.5" fill="#c9402e"/>' +
    '<ellipse cx="21" cy="55" rx="5" ry="3" fill="#ffb27a" opacity="0.55"/>' +
    '<ellipse cx="63" cy="55" rx="5" ry="3" fill="#ffb27a" opacity="0.55"/>' +
    '</svg>';

  function svgUri(svg) {
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
  }

  var deco = document.createElement('div');
  deco.id = 'halloweenDeco';
  deco.innerHTML =
    '<div class="deco-item deco-pumpkin-l"></div>' +
    '<div class="deco-item deco-ghost-r"></div>' +
    '<div class="deco-item deco-ghost-l"></div>' +
    '<div class="deco-item deco-pumpkin-r"></div>';
  document.body.appendChild(deco);

  function setDeco(name) {
    deco.classList.toggle('on', name === 'halloween');
    if (name === 'halloween') {
      deco.querySelector('.deco-pumpkin-l').style.backgroundImage = svgUri(SVG_PUMPKIN);
      deco.querySelector('.deco-pumpkin-r').style.backgroundImage = svgUri(SVG_PUMPKIN);
      deco.querySelector('.deco-ghost-r').style.backgroundImage = svgUri(SVG_GHOST);
      deco.querySelector('.deco-ghost-l').style.backgroundImage = svgUri(SVG_GHOST);
    }
  }

  /* build floating button + picker modal */
  var fab = document.createElement('button');
  fab.className = 'theme-fab';
  fab.setAttribute('aria-label', 'Change theme');
  fab.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2a10 10 0 0 0 0 20 1.7 1.7 0 0 0 1.2-2.8 1.7 1.7 0 0 1 1.3-2.7H17a5 5 0 0 0 5-5c0-5-4.6-9.5-10-9.5z"/></svg>';
  document.body.appendChild(fab);

  var modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'none';
  modal.innerHTML =
    '<div class="gate-card" style="max-width: 420px;">' +
      '<h1>Choose Theme</h1>' +
      '<p>Applies to the whole site and is remembered on this device.</p>' +
      '<button class="theme-opt" data-theme="default">' +
        '<img src="FBRP.png" alt="Classic logo" data-no-swap>' +
        '<div><b>Classic Blue</b><span>Default FBRP look</span></div>' +
        '<span class="badge">Active</span>' +
      '</button>' +
      '<button class="theme-opt" data-theme="halloween">' +
        '<img src="FBRP-Halloween.png" alt="Halloween logo" data-no-swap>' +
        '<div><b>Halloween</b><span>Pumpkins, moonlight and orange</span></div>' +
        '<span class="badge">Active</span>' +
      '</button>' +
      '<a class="gate-back" href="#" id="themeClose">Close</a>' +
    '</div>';
  document.body.appendChild(modal);

  function current() {
    var t = null;
    try { t = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    return LOGOS[t] ? t : 'default';
  }

  function apply(name) {
    if (name === 'default') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', name);
    }
    setDeco(name);
    var logo = LOGOS[name];
    document.querySelectorAll('img').forEach(function (img) {
      if (img.hasAttribute('data-no-swap')) { return; }
      if (/FBRP(-Halloween)?\.png(\?.*)?$/.test(img.getAttribute('src') || '')) {
        img.setAttribute('src', logo);
      }
    });
    modal.querySelectorAll('.theme-opt').forEach(function (opt) {
      var badge = opt.querySelector('.badge');
      if (badge) { badge.style.display = opt.getAttribute('data-theme') === name ? '' : 'none'; }
      opt.classList.toggle('active', opt.getAttribute('data-theme') === name);
    });
  }

  fab.addEventListener('click', function () {
    modal.style.display = 'flex';
  });
  modal.addEventListener('click', function (e) {
    if (e.target === modal) { modal.style.display = 'none'; }
  });
  modal.querySelector('#themeClose').addEventListener('click', function (e) {
    e.preventDefault();
    modal.style.display = 'none';
  });
  modal.querySelectorAll('.theme-opt').forEach(function (opt) {
    opt.addEventListener('click', function () {
      var name = opt.getAttribute('data-theme');
      try { localStorage.setItem(STORAGE_KEY, name); } catch (e) {}
      apply(name);
    });
  });

  apply(current());
})();
