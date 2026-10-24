/* Border Runner 2.0 — 404 mini-game */
(function () {
  var canvas = document.getElementById('borderGame');
  if (!canvas) return;

  /* when the canvas lives in a hidden overlay (easter egg), run only while open */
  var host = canvas.closest ? canvas.closest('.game-overlay') : null;
  function isActive() { return !host || host.classList.contains('open'); }

  var ctx = canvas.getContext('2d');
  var W = canvas.width;
  var H = canvas.height;
  var GROUND = H - 42;

  var state = 'idle'; /* idle | run | over */
  var score = 0;
  var best = parseInt(localStorage.getItem('fbrp_border_best') || '0', 10);
  var newBest = false;
  var speed = 4.4;
  var frame = 0;
  var legPhase = 0;

  var player = { x: 60, w: 26, h: 36, y: GROUND, vy: 0, jump: -11, grounded: true };

  var walls = [];
  var coins = [];
  var particles = [];
  var popups = [];
  var helis = [];
  var nextWallAt = 0;
  var distSinceWall = 0;

  /* scenery */
  var clouds = [];
  var towers = [];
  var hills = [];
  var i;
  for (i = 0; i < 4; i++) clouds.push({ x: Math.random() * W, y: 16 + Math.random() * 50, s: 0.25 + Math.random() * 0.5 });
  for (i = 0; i < 3; i++) towers.push({ x: Math.random() * W * 1.5, h: 46 + Math.random() * 22 });
  for (i = 0; i < 6; i++) hills.push({ x: i * 120 + Math.random() * 40, w: 130 + Math.random() * 90, h: 26 + Math.random() * 30 });

  /* sound (WebAudio, created on first user gesture) */
  var AC = null;
  function sound(freq, dur, type, vol, delay) {
    try {
      if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === 'suspended') AC.resume();
      var t = AC.currentTime + (delay || 0);
      var o = AC.createOscillator();
      var g = AC.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol || 0.035, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(AC.destination);
      o.start(t);
      o.stop(t + dur);
    } catch (e) {}
  }

  function theme() {
    var cs = getComputedStyle(document.documentElement);
    return {
      bg: cs.getPropertyValue('--bg-2').trim() || '#0c0e16',
      blue: cs.getPropertyValue('--blue-bright').trim() || '#3d63ff',
      text: cs.getPropertyValue('--text').trim() || '#e8eaf2',
      muted: cs.getPropertyValue('--muted').trim() || '#9aa1b5',
      line: cs.getPropertyValue('--line').trim() || 'rgba(255,255,255,0.08)'
    };
  }

  function reset() {
    state = 'run';
    score = 0;
    newBest = false;
    speed = 4.4;
    walls = [];
    coins = [];
    particles = [];
    popups = [];
    helis = [];
    distSinceWall = 0;
    nextWallAt = W * 0.55;
    player.y = GROUND;
    player.vy = 0;
    player.grounded = true;
    sound(520, 0.07, 'square', 0.03);
    sound(780, 0.09, 'square', 0.03, 0.08);
  }

  function dust(x, y, n) {
    for (var k = 0; k < n; k++) {
      particles.push({
        x: x + Math.random() * 14,
        y: y - Math.random() * 4,
        vx: -1 - Math.random() * 2,
        vy: -0.5 - Math.random() * 1.5,
        life: 18 + Math.random() * 14
      });
    }
  }

  function jump() {
    if (state !== 'run') { reset(); return; }
    if (player.grounded) {
      player.vy = player.jump;
      player.grounded = false;
      dust(player.x + 4, GROUND, 6);
      sound(300, 0.09, 'square', 0.03);
    }
  }

  canvas.addEventListener('mousedown', jump);
  canvas.addEventListener('touchstart', function (e) { e.preventDefault(); jump(); }, { passive: false });
  document.addEventListener('keydown', function (e) {
    if (!isActive()) return;
    if (e.code !== 'Space' && e.code !== 'ArrowUp') return;
    e.preventDefault();
    jump();
  });

  /* obstacle types: low | tall | gate | double */
  var justSpawnedDouble = false;
  function spawnWall() {
    var r = Math.random();
    var base = { x: W + 24, passed: false };
    justSpawnedDouble = false;
    if (r < 0.42) {
      walls.push(Object.assign(base, { type: 'low', w: 16 + Math.random() * 10, h: 24 + Math.random() * 10 }));
    } else if (r < 0.68) {
      walls.push(Object.assign(base, { type: 'tall', w: 16 + Math.random() * 8, h: 44 + Math.random() * 12 }));
    } else if (r < 0.9) {
      walls.push(Object.assign(base, { type: 'gate', w: 42 + Math.random() * 16, h: 30 + Math.random() * 8 }));
    } else {
      /* double — gap scales with speed so you can always land between jumps */
      var w1 = 16;
      var gap = 130 + speed * 22;
      walls.push({ type: 'low', x: W + 24, w: w1, h: 26, passed: false });
      walls.push({ type: 'low', x: W + 24 + w1 + gap, w: w1, h: 30, passed: false });
      justSpawnedDouble = true;
    }
  }

  function spawnCoins() {
    /* visa arc above the next obstacle */
    if (Math.random() > 0.45 || !walls.length) return;
    var anchor = walls[walls.length - 1];
    var peak = anchor.h + 56;
    for (var k = 0; k < 5; k++) {
      var t = k / 4;
      coins.push({
        x: anchor.x - 26 + t * (anchor.w + 52),
        y: GROUND - peak + Math.pow(t - 0.5, 2) * 2 * peak * 0.55,
        r: 6,
        taken: false,
        spin: Math.random() * Math.PI
      });
    }
  }

  function hitPlayer(w) {
    var px = player.x + 4, pw = player.w - 8;
    var py = player.y - player.h + 4, ph = player.h - 8;
    return px < w.x + w.w - 2 && px + pw > w.x + 2 &&
           py + ph > GROUND - w.h + 2 && py < GROUND;
  }

  function die() {
    state = 'over';
    dust(player.x + player.w / 2, GROUND, 14);
    sound(160, 0.25, 'sawtooth', 0.05);
    sound(90, 0.3, 'sawtooth', 0.05, 0.1);
    if (score > best) {
      best = score;
      newBest = true;
      localStorage.setItem('fbrp_border_best', String(best));
    }
  }

  function heliY(h) {
    return h.y + Math.sin(frame * 0.08 + h.phase) * 5;
  }

  function hitHeli(h) {
    var pcx = player.x + player.w / 2;
    var pcy = player.y - player.h / 2;
    return Math.abs(h.x - pcx) < 20 + player.w / 2 - 4 &&
           Math.abs(heliY(h) - pcy) < 10 + player.h / 2 - 4;
  }

  function drawTower(t, c) {
    var x = t.x;
    ctx.fillStyle = 'rgba(255,255,255,0.045)';
    ctx.fillRect(x, GROUND - t.h, 10, t.h);                    /* legs */
    ctx.fillRect(x - 6, GROUND - t.h - 16, 22, 16);            /* cabin */
    ctx.fillStyle = c.blue;
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(frame * 0.05 + x);
    ctx.fillRect(x + 1, GROUND - t.h - 13, 3, 3);              /* beacon */
    ctx.globalAlpha = 1;
  }

  function drawWall(w, c) {
    ctx.fillStyle = '#d8dbe6';
    ctx.fillRect(w.x, GROUND - w.h, w.w, w.h);
    ctx.fillStyle = c.blue;
    var stripe = 8;
    for (var y = GROUND - w.h + 3; y < GROUND - 4; y += stripe * 2) {
      ctx.fillRect(w.x + 2, y, w.w - 4, stripe);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(w.x + w.w - 3, GROUND - w.h, 3, w.h);
    if (w.type === 'gate') {                                   /* hazard light on gates */
      ctx.fillStyle = (frame % 40 < 20) ? '#ff5a5a' : 'rgba(255,90,90,0.25)';
      ctx.beginPath();
      ctx.arc(w.x + w.w / 2, GROUND - w.h - 5, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawCoin(cn, c) {
    var squash = Math.abs(Math.cos(cn.spin));
    ctx.save();
    ctx.translate(cn.x, cn.y);
    ctx.scale(Math.max(0.25, squash), 1);
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(0, 0, cn.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.font = 'bold 8px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('V', 0, 3);
    ctx.restore();
    ctx.textAlign = 'left';
  }

  function drawHeli(h, c) {
    ctx.save();
    ctx.translate(h.x, heliY(h));

    /* tail + fin (behind, pointing right — heli flies left) */
    ctx.fillStyle = '#39415c';
    ctx.fillRect(18, -3, 18, 5);
    ctx.fillRect(34, -9, 4, 12);

    /* body */
    ctx.fillStyle = '#4a5578';
    ctx.fillRect(-20, -9, 40, 17);
    /* glass — nose faces left */
    ctx.fillStyle = c.blue;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(-17, -7, 11, 9);
    ctx.globalAlpha = 1;
    /* stripe */
    ctx.fillStyle = '#d8dbe6';
    ctx.fillRect(-20, 1, 40, 3);

    /* skids */
    ctx.strokeStyle = '#9aa1b5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-12, 13); ctx.lineTo(12, 13);
    ctx.moveTo(-8, 8); ctx.lineTo(-8, 13);
    ctx.moveTo(8, 8); ctx.lineTo(8, 13);
    ctx.stroke();

    /* main rotor — foreshortened spin */
    var rl = 26 * Math.abs(Math.cos(frame * 0.55 + h.phase));
    ctx.strokeStyle = 'rgba(230,234,245,0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-rl, -12);
    ctx.lineTo(rl, -12);
    ctx.stroke();
    ctx.fillStyle = '#9aa1b5';
    ctx.fillRect(-2, -13, 4, 3);

    /* tail rotor */
    var tl = 7 * Math.abs(Math.sin(frame * 0.55 + h.phase));
    ctx.beginPath();
    ctx.moveTo(37, -tl);
    ctx.lineTo(37, tl);
    ctx.stroke();

    /* beacon — alternating red / blue */
    ctx.fillStyle = (frame % 30 < 15) ? '#ff5a5a' : c.blue;
    ctx.beginPath();
    ctx.arc(0, -10, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawPlayer(c) {
    var tilt = player.grounded ? 0 : (player.vy < 0 ? -0.12 : 0.1);
    ctx.save();
    ctx.translate(player.x + player.w / 2, player.y - player.h / 2);
    ctx.rotate(tilt);

    /* legs */
    ctx.fillStyle = c.blue;
    if (player.grounded) {
      var l = Math.sin(legPhase) * 7;
      ctx.fillRect(-10, player.h / 2 - 10 + Math.max(0, l) * 0.4, 8, 10 + Math.min(0, l));
      ctx.fillRect(2, player.h / 2 - 10 + Math.max(0, -l) * 0.4, 8, 10 + Math.min(0, -l));
    } else {
      ctx.fillRect(-10, player.h / 2 - 12, 8, 8);
      ctx.fillRect(2, player.h / 2 - 8, 8, 12);
    }

    /* body */
    ctx.fillStyle = c.blue;
    ctx.fillRect(-player.w / 2, -player.h / 2, player.w, player.h - 10);
    /* visor */
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(-player.w / 2 + 6, -player.h / 2 + 7, player.w - 12, 8);
    /* chest stripe */
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(-player.w / 2, 2, player.w, 4);

    ctx.restore();
  }

  function tick() {
    if (!isActive()) { requestAnimationFrame(tick); return; }
    var c = theme();
    ctx.clearRect(0, 0, W, H);

    /* sky */
    ctx.fillStyle = c.bg;
    ctx.fillRect(0, 0, W, H);

    /* moon */
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.beginPath(); ctx.arc(W - 70, 44, 26, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath(); ctx.arc(W - 70, 44, 18, 0, Math.PI * 2); ctx.fill();

    /* clouds */
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    clouds.forEach(function (cl) {
      cl.x -= (state === 'run' ? speed : 1.2) * cl.s;
      if (cl.x < -50) cl.x = W + 50;
      ctx.beginPath();
      ctx.ellipse(cl.x, cl.y, 26, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    /* hills (slow parallax) */
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    hills.forEach(function (hl) {
      hl.x -= (state === 'run' ? speed : 1.2) * 0.15;
      if (hl.x + hl.w < 0) { hl.x = W + Math.random() * 60; hl.h = 26 + Math.random() * 30; }
      ctx.beginPath();
      ctx.moveTo(hl.x, GROUND);
      ctx.quadraticCurveTo(hl.x + hl.w / 2, GROUND - hl.h * 2, hl.x + hl.w, GROUND);
      ctx.fill();
    });

    /* guard towers (mid parallax) */
    towers.forEach(function (t) {
      t.x -= (state === 'run' ? speed : 1.2) * 0.45;
      if (t.x < -40) { t.x = W + Math.random() * 200; t.h = 46 + Math.random() * 22; }
      drawTower(t, c);
    });

    /* ground */
    ctx.strokeStyle = c.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND + 1);
    ctx.lineTo(W, GROUND + 1);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    var offset = state === 'run' ? (frame * speed) % 44 : (frame * 1.2) % 44;
    for (var gx = -offset; gx < W; gx += 44) {
      ctx.fillRect(gx, GROUND + 10, 20, 2);
    }

    if (state === 'run') {
      frame++;
      speed = Math.min(10, speed + 0.0012);

      /* player physics */
      var wasGrounded = player.grounded;
      player.vy += 0.55;
      player.y += player.vy;
      if (player.y > GROUND) {
        player.y = GROUND;
        player.vy = 0;
        if (!wasGrounded) dust(player.x + 4, GROUND, 4);
        player.grounded = true;
      }
      if (player.grounded) legPhase += speed * 0.16;

      /* spawn */
      distSinceWall += speed;
      nextWallAt -= speed;
      if (nextWallAt <= 0) {
        spawnWall();
        spawnCoins();
        /* long empty stretch? send in the choppers */
        if (distSinceWall > 380) {
          var n = distSinceWall > 640 ? 2 : 1;
          for (var hs = 0; hs < n; hs++) {
            helis.push({ x: W + 60 + hs * 340, y: 44 + Math.random() * 42, phase: Math.random() * 6.28 });
          }
        }
        distSinceWall = 0;
        /* spacing: never shorter than a full jump arc, extra room after a double */
        nextWallAt = Math.max(speed * 46, 260 + Math.random() * 220);
        if (justSpawnedDouble) nextWallAt += 160;
      }

      /* move world */
      walls.forEach(function (w) { w.x -= speed; });
      helis.forEach(function (h) { h.x -= speed + 1.6; });
      helis = helis.filter(function (h) { return h.x > -70; });
      coins.forEach(function (cn) { cn.x -= speed; cn.spin += 0.09; });
      particles.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.life--; });
      popups.forEach(function (p) { p.y -= 0.7; p.life--; });

      /* score + cleanup */
      walls = walls.filter(function (w) {
        if (w.x + w.w < player.x && !w.passed) { w.passed = true; score += 1; }
        return w.x + w.w > -14;
      });
      coins = coins.filter(function (cn) {
        if (!cn.taken &&
            Math.abs(cn.x - (player.x + player.w / 2)) < cn.r + player.w / 2 &&
            Math.abs(cn.y - (player.y - player.h / 2)) < cn.r + player.h / 2) {
          cn.taken = true;
          score += 5;
          popups.push({ x: cn.x, y: cn.y - 10, text: '+5', life: 40 });
          sound(880, 0.06, 'sine', 0.04);
          sound(1320, 0.08, 'sine', 0.04, 0.05);
        }
        return !cn.taken && cn.x > -14;
      });
      particles = particles.filter(function (p) { return p.life > 0; });
      popups = popups.filter(function (p) { return p.life > 0; });

      /* collision */
      for (var wi = 0; wi < walls.length; wi++) {
        if (hitPlayer(walls[wi])) { die(); break; }
      }
      if (state === 'run') {
        for (var hi = 0; hi < helis.length; hi++) {
          if (hitHeli(helis[hi])) { die(); break; }
        }
      }
    } else {
      frame++;
    }

    /* particles */
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    particles.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, p.life / 30);
      ctx.fillRect(p.x, p.y, 3, 3);
    });
    ctx.globalAlpha = 1;

    drawPlayer(c);
    helis.forEach(function (h) { drawHeli(h, c); });
    coins.forEach(function (cn) { drawCoin(cn, c); });
    walls.forEach(function (w) { drawWall(w, c); });

    /* popups */
    ctx.font = 'bold 13px Consolas, monospace';
    popups.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, p.life / 40);
      ctx.fillStyle = '#ffd166';
      ctx.fillText(p.text, p.x, p.y);
    });
    ctx.globalAlpha = 1;

    /* HUD */
    ctx.fillStyle = c.text;
    ctx.font = 'bold 15px Consolas, monospace';
    ctx.fillText('SCORE ' + score, 12, 24);
    ctx.fillStyle = c.muted;
    ctx.font = '12px Consolas, monospace';
    ctx.fillText('BEST ' + best, 12, 42);

    if (state === 'idle') {
      ctx.fillStyle = c.text;
      ctx.font = 'bold 20px Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BORDER RUNNER', W / 2, H / 2 - 18);
      ctx.fillStyle = c.muted;
      ctx.font = '13px Consolas, monospace';
      ctx.fillText('Jump the walls — grab the visas', W / 2, H / 2 + 6);
      ctx.fillText('Click or press Space to start', W / 2, H / 2 + 26);
      ctx.textAlign = 'left';
    } else if (state === 'over') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.fillStyle = c.text;
      ctx.font = 'bold 19px Consolas, monospace';
      ctx.fillText('CAUGHT AT THE BORDER', W / 2, H / 2 - 22);
      if (newBest) {
        ctx.fillStyle = '#ffd166';
        ctx.font = 'bold 14px Consolas, monospace';
        ctx.fillText('NEW BEST!', W / 2, H / 2 + 2);
      }
      ctx.fillStyle = c.muted;
      ctx.font = '13px Consolas, monospace';
      ctx.fillText('Score ' + score + (newBest ? '' : '  ·  Best ' + best), W / 2, H / 2 + 22);
      ctx.fillText('Click or press Space to run again', W / 2, H / 2 + 42);
      ctx.textAlign = 'left';
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
