(function () {
  var toggle = document.getElementById('navToggle');
  var links = document.querySelector('.nav-links');
  toggle.addEventListener('click', function () {
    var open = links.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  links.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      links.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
})();

/* easter egg — type "border" or click the hero logo 5 times */
(function () {
  var overlay = null;
  var cooldownUntil = 0;
  var buffer = '';
  var logoClicks = 0;
  var logoTimer = null;

  function buildOverlay() {
    if (overlay) { return overlay; }
    overlay = document.createElement('div');
    overlay.id = 'borderEgg';
    overlay.innerHTML =
      '<div class="egg-scan"></div>' +
      '<div class="egg-box">' +
        '<div class="egg-alert">UNAUTHORIZED BORDER CROSSING DETECTED</div>' +
        '<div class="egg-logo"><img src="FBRP.png" alt="FBRP"></div>' +
        '<div class="egg-sub">Just kidding — <b>Border Pass granted.</b></div>' +
        '<div class="egg-stamp">FBRPTOP</div>' +
        '<div class="egg-hint">Click anywhere to close</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function () {
      overlay.classList.remove('show');
    });
    return overlay;
  }

  function trigger() {
    if (Date.now() < cooldownUntil) { return; }
    cooldownUntil = Date.now() + 30000;
    buildOverlay().classList.add('show');
  }

  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') { return; }
    if (e.key.length !== 1) { return; }
    buffer = (buffer + e.key.toLowerCase()).slice(-10);
    if (buffer.endsWith('border')) {
      buffer = '';
      trigger();
    }
  });

  var heroLogo = document.querySelector('.hero img.logo-big');
  if (heroLogo) {
    heroLogo.style.cursor = 'pointer';
    heroLogo.addEventListener('click', function () {
      logoClicks++;
      clearTimeout(logoTimer);
      logoTimer = setTimeout(function () { logoClicks = 0; }, 2000);
      if (logoClicks >= 5) {
        logoClicks = 0;
        trigger();
      }
    });
  }
})();

/* gallery carousel */
(function () {
  var track = document.getElementById('carTrack');
  var slides = track.children.length;
  var dotsWrap = document.getElementById('carDots');
  var index = 0;

  for (var i = 0; i < slides; i++) {
    var dot = document.createElement('button');
    dot.className = 'car-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', 'Go to screenshot ' + (i + 1));
    (function (n) {
      dot.addEventListener('click', function () { goTo(n); });
    })(i);
    dotsWrap.appendChild(dot);
  }

  function goTo(n) {
    index = (n + slides) % slides;
    track.style.transform = 'translateX(-' + (index * 100) + '%)';
    var dots = dotsWrap.children;
    for (var i = 0; i < dots.length; i++) {
      dots[i].classList.toggle('active', i === index);
    }
  }

  document.getElementById('carPrev').addEventListener('click', function () { goTo(index - 1); });
  document.getElementById('carNext').addEventListener('click', function () { goTo(index + 1); });

  document.addEventListener('keydown', function (e) {
    var gallery = document.getElementById('gallery');
    var rect = gallery.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      if (e.key === 'ArrowLeft') { goTo(index - 1); }
      if (e.key === 'ArrowRight') { goTo(index + 1); }
    }
  });
})();

document.getElementById('copyCode').addEventListener('click', function () {
  const el = this;
  const done = () => {
    const old = el.textContent;
    el.textContent = 'Copied!';
    setTimeout(() => { el.textContent = old; }, 1500);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText('RBPPP').then(done).catch(done);
  } else {
    const ta = document.createElement('textarea');
    ta.value = 'RBPPP';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    done();
  }
});
