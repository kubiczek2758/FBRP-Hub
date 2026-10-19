/* theme switcher — classic blue / halloween 2026 */
(function () {
  var STORAGE_KEY = 'fbrp_theme';
  var LOGOS = {
    default: 'FBRP.png',
    halloween: 'FBRP-Halloween.png'
  };

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
