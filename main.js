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
