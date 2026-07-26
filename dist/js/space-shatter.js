(function () {
  'use strict';

  var CLICK_TARGET = 7;
  var CLICK_WINDOW_MS = 3000;
  var MIN_TAP_GAP_MS = 35;
  var CRACK_END = 0.4;
  var SHATTER_END = 2.2;
  var DRIFT_END = 3.5;
  var RECALL_END = 5.0;
  var REBUILD_END = 5.8;

  var clickTimes = [];
  var lastTapAt = -Infinity;
  var isAnimating = false;
  var rafId = 0;
  var starfieldRaf = 0;
  var parallaxRaf = 0;
  var parallaxEnabled = false;
  var mouseNx = 0;
  var mouseNy = 0;
  var parallaxX = 0;
  var parallaxY = 0;

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function init() {
    var photo = document.querySelector('.page__photo');
    if (!photo) return;

    photo.setAttribute('draggable', 'false');
    initStarfield();
    initParallax();

    // pointerdown: надёжнее click на мобильных при быстрых тапах
    photo.addEventListener('pointerdown', onPhotoPointerDown, { passive: true });
  }

  function onPhotoPointerDown(e) {
    if (isAnimating || prefersReducedMotion()) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.isPrimary === false) return;

    var now = performance.now();
    // Отсекаем дубли одного физического нажатия, но не редкие тапы пользователя
    if (now - lastTapAt < MIN_TAP_GAP_MS) return;
    lastTapAt = now;

    clickTimes.push(now);
    clickTimes = clickTimes.filter(function (t) {
      return now - t <= CLICK_WINDOW_MS;
    });

    if (clickTimes.length >= CLICK_TARGET) {
      clickTimes = [];
      startShatter();
    }
  }

  function initStarfield() {
    var canvas = document.createElement('canvas');
    canvas.className = 'starfield';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(canvas, document.body.firstChild);

    var stars = [];
    var i;
    for (i = 0; i < 140; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        r: rand(0.35, 2.0),
        tw: rand(0, Math.PI * 2),
        speed: rand(0.6, 2.2),
        depth: rand(0.25, 1)
      });
    }

    var reduced = prefersReducedMotion();

    function draw(now) {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = window.innerWidth;
      var h = window.innerHeight;
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
      }

      var ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      var t = now * 0.001;
      // Stars drift with mouse — farther stars move less, nearer more.
      var shiftX = parallaxX * 22;
      var shiftY = parallaxY * 16;

      stars.forEach(function (star) {
        var tw = reduced
          ? 0.55
          : 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * star.speed + star.tw));
        var sx = star.x * w + shiftX * star.depth;
        var sy = star.y * h + shiftY * star.depth;
        // Soft wrap so stars don't leave empty edges while drifting.
        sx = ((sx % w) + w) % w;
        sy = ((sy % h) + h) % h;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(230, 240, 255, ' + (tw * (0.35 + star.depth * 0.45)) + ')';
        ctx.arc(sx, sy, star.r, 0, Math.PI * 2);
        ctx.fill();
      });

      starfieldRaf = requestAnimationFrame(draw);
    }

    starfieldRaf = requestAnimationFrame(draw);
  }

  function initParallax() {
    if (prefersReducedMotion()) return;

    var page = document.querySelector('.page');
    var stage = document.querySelector('.page__stage');
    var root = document.documentElement;
    if (!page || !stage) return;

    var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    function setPointerFromClient(clientX, clientY) {
      var w = window.innerWidth || 1;
      var h = window.innerHeight || 1;
      mouseNx = (clientX / w - 0.5) * 2;
      mouseNy = (clientY / h - 0.5) * 2;
    }

    window.addEventListener('mousemove', function (e) {
      setPointerFromClient(e.clientX, e.clientY);
    });

    window.addEventListener('touchmove', function (e) {
      if (!e.touches || !e.touches.length) return;
      setPointerFromClient(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    document.documentElement.addEventListener('mouseleave', function () {
      mouseNx = 0;
      mouseNy = 0;
    });

    window.addEventListener('touchend', function () {
      mouseNx = 0;
      mouseNy = 0;
    }, { passive: true });

    // 3D-наклон только у .page__stage (не у ссылок) — на таче мешает попадать по аватарке
    window.setTimeout(function () {
      parallaxEnabled = true;
      if (canHover) stage.classList.add('page--parallax');
    }, 1200);

    function tick() {
      parallaxX = lerp(parallaxX, mouseNx, 0.08);
      parallaxY = lerp(parallaxY, mouseNy, 0.08);

      if (parallaxEnabled && !isAnimating && canHover) {
        root.style.setProperty('--pointer-x', parallaxX.toFixed(4));
        root.style.setProperty('--pointer-y', parallaxY.toFixed(4));
      } else if (canHover) {
        root.style.setProperty('--pointer-x', '0');
        root.style.setProperty('--pointer-y', '0');
      }

      // Звёзды двигаются и на мобильном (через parallaxX/Y), без наклона блока
      parallaxRaf = requestAnimationFrame(tick);
    }

    parallaxRaf = requestAnimationFrame(tick);
  }

  function resetParallaxTransforms() {
    parallaxX = 0;
    parallaxY = 0;
    mouseNx = 0;
    mouseNy = 0;
    document.documentElement.style.setProperty('--pointer-x', '0');
    document.documentElement.style.setProperty('--pointer-y', '0');
  }

  function startShatter() {
    if (isAnimating) return;
    isAnimating = true;
    resetParallaxTransforms();

    var page = document.querySelector('.page');
    if (!page) {
      isAnimating = false;
      return;
    }

    // Сбрасываем наклон до замера позиций — иначе осколки «уедут»
    var stage = document.querySelector('.page__stage');
    if (stage) stage.classList.remove('page--parallax');
    void page.offsetWidth;

    var targets = [
      document.querySelector('.page__photo'),
      document.querySelector('.page__name'),
      document.querySelector('.page__role'),
      document.querySelector('.page__email')
    ].filter(Boolean);

    targets.forEach(function (el) {
      el.style.removeProperty('--tap-progress');
    });

    var captures = targets.map(captureElement);
    page.classList.add('page--shattering');

    var root = document.createElement('div');
    root.className = 'shatter-root';
    root.setAttribute('aria-hidden', 'true');

    var canvas = document.createElement('canvas');
    canvas.className = 'shatter-canvas';
    root.appendChild(canvas);

    var shardsLayer = document.createElement('div');
    shardsLayer.className = 'shatter-shards';
    root.appendChild(shardsLayer);

    document.body.appendChild(root);

    var shards = [];
    captures.forEach(function (cap) {
      if (cap.kind === 'image') {
        createPhotoShards(cap, shardsLayer).forEach(function (s) {
          shards.push(s);
        });
      } else {
        createTextShards(cap, shardsLayer).forEach(function (s) {
          shards.push(s);
        });
      }
    });

    var particles = createParticles(canvas);
    var start = performance.now();
    var flash = 1;
    var rebuildStarted = false;

    function frame(now) {
      var t = (now - start) / 1000;

      if (t >= REBUILD_END) {
        teardown(root, page, targets);
        return;
      }

      if (!rebuildStarted && t >= RECALL_END) {
        rebuildStarted = true;
        page.classList.remove('page--shattering');
        page.classList.add('page--rebuilding');
        targets.forEach(function (el, i) {
          var delays = [0.05, 0.12, 0.2, 0.28];
          el.style.opacity = '0';
          el.style.transform = 'none';
          requestAnimationFrame(function () {
            el.style.transition = 'opacity 0.55s ease ' + delays[i] + 's';
            el.style.opacity = '1';
          });
        });
      }

      resizeCanvas(canvas);
      updateShards(shards, t, particles.mobile);
      renderParticles(canvas, particles, t, flash);
      flash = Math.max(0, flash - 0.035);

      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);
  }

  function captureElement(el) {
    var rect = el.getBoundingClientRect();
    var styles = window.getComputedStyle(el);
    var kind = el.tagName === 'IMG' ? 'image' : 'text';

    return {
      el: el,
      kind: kind,
      rect: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      },
      src: kind === 'image' ? el.currentSrc || el.src : null,
      text: kind === 'text' ? el.textContent : null,
      styles: {
        font: styles.font,
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        letterSpacing: styles.letterSpacing,
        textTransform: styles.textTransform,
        color: styles.color,
        lineHeight: styles.lineHeight,
        textAlign: styles.textAlign,
        borderBottom: styles.borderBottom,
        textDecoration: styles.textDecoration
      }
    };
  }

  function polygonClip(points) {
    return 'polygon(' + points.map(function (p) {
      return (p[0] * 100).toFixed(2) + '% ' + (p[1] * 100).toFixed(2) + '%';
    }).join(', ') + ')';
  }

  function createPhotoShards(cap, layer) {
    var layouts = [
      [[0, 0], [0.38, 0], [0.28, 0.42], [0, 0.35]],
      [[0.38, 0], [0.72, 0], [0.78, 0.32], [0.42, 0.28], [0.28, 0.42]],
      [[0.72, 0], [1, 0], [1, 0.38], [0.78, 0.32]],
      [[0, 0.35], [0.28, 0.42], [0.22, 0.72], [0, 0.68]],
      [[0.28, 0.42], [0.42, 0.28], [0.62, 0.45], [0.48, 0.7], [0.22, 0.72]],
      [[0.42, 0.28], [0.78, 0.32], [0.85, 0.58], [0.62, 0.45]],
      [[0.78, 0.32], [1, 0.38], [1, 0.7], [0.85, 0.58]],
      [[0, 0.68], [0.22, 0.72], [0.3, 1], [0, 1]],
      [[0.22, 0.72], [0.48, 0.7], [0.55, 1], [0.3, 1]],
      [[0.48, 0.7], [0.62, 0.45], [0.85, 0.58], [0.78, 1], [0.55, 1]],
      [[0.85, 0.58], [1, 0.7], [1, 1], [0.78, 1]],
      [[0.18, 0.18], [0.35, 0.12], [0.4, 0.35], [0.2, 0.4]],
      [[0.55, 0.55], [0.72, 0.48], [0.75, 0.72], [0.52, 0.75]],
      [[0.05, 0.5], [0.2, 0.45], [0.18, 0.62], [0.02, 0.6]]
    ];

    var cx = cap.rect.left + cap.rect.width / 2;
    var cy = cap.rect.top + cap.rect.height / 2;
    var result = [];

    layouts.forEach(function (poly, i) {
      var node = document.createElement('div');
      node.className = 'shatter-shard shatter-shard--photo';
      node.style.width = cap.rect.width + 'px';
      node.style.height = cap.rect.height + 'px';
      node.style.left = cap.rect.left + 'px';
      node.style.top = cap.rect.top + 'px';
      node.style.backgroundImage = 'url("' + cap.src + '")';
      node.style.backgroundSize = 'cover';
      node.style.backgroundPosition = 'center 20%';
      node.style.clipPath = polygonClip(poly);
      node.style.webkitClipPath = polygonClip(poly);
      layer.appendChild(node);

      var angle = (i / layouts.length) * Math.PI * 2 + rand(-0.35, 0.35);
      var speed = rand(180, 520);
      var delay = rand(0, 0.18);

      result.push({
        el: node,
        ox: cap.rect.left,
        oy: cap.rect.top,
        x: cap.rect.left,
        y: cap.rect.top,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - rand(40, 160),
        rot: 0,
        vr: rand(-420, 420),
        delay: delay,
        scale: 1
      });
    });

    // suppress unused warning pattern for cx/cy used conceptually
    void cx;
    void cy;
    return result;
  }

  function createTextShards(cap, layer) {
    var strips = cap.rect.height < 28 ? 2 : 3;
    var result = [];
    var h = cap.rect.height / strips;

    for (var i = 0; i < strips; i++) {
      var wrap = document.createElement('div');
      wrap.className = 'shatter-shard shatter-shard--text';
      wrap.style.left = cap.rect.left + 'px';
      wrap.style.top = (cap.rect.top + i * h) + 'px';
      wrap.style.width = cap.rect.width + 'px';
      wrap.style.height = Math.ceil(h + 1) + 'px';
      wrap.style.overflow = 'hidden';

      var inner = document.createElement('div');
      inner.className = 'shatter-shard__inner';
      inner.textContent = cap.text;
      inner.style.width = cap.rect.width + 'px';
      inner.style.height = cap.rect.height + 'px';
      inner.style.marginTop = (-i * h) + 'px';
      inner.style.font = cap.styles.font;
      inner.style.fontSize = cap.styles.fontSize;
      inner.style.fontWeight = cap.styles.fontWeight;
      inner.style.letterSpacing = cap.styles.letterSpacing;
      inner.style.textTransform = cap.styles.textTransform;
      inner.style.color = cap.styles.color;
      inner.style.lineHeight = cap.styles.lineHeight;
      inner.style.textAlign = 'center';
      wrap.appendChild(inner);
      layer.appendChild(wrap);

      var side = i % 2 === 0 ? -1 : 1;
      var angle = side * rand(0.4, 1.2) + rand(-0.4, 0.4);
      var speed = rand(140, 380);

      result.push({
        el: wrap,
        ox: cap.rect.left,
        oy: cap.rect.top + i * h,
        x: cap.rect.left,
        y: cap.rect.top + i * h,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - rand(20, 120),
        rot: 0,
        vr: rand(-260, 260),
        delay: 0.05 + i * 0.04,
        scale: 1
      });
    }

    return result;
  }

  function updateShards(shards, t, mobile) {
    shards.forEach(function (s) {
      var local = Math.max(0, t - s.delay);
      var x = s.ox;
      var y = s.oy;
      var rot = 0;
      var scale = 1;
      var opacity = 1;

      if (local < CRACK_END) {
        var crackT = local / CRACK_END;
        var jitter = (1 - crackT) * 3.2;
        var jx = Math.sin(local * 90 + s.vr) * jitter;
        var jy = Math.cos(local * 70 + s.vx) * jitter;
        x = s.ox + jx;
        y = s.oy + jy;
        rot = Math.sin(local * 40 + s.vr) * 4 * crackT;
        opacity = 1;
      } else if (local < SHATTER_END) {
        var st = (local - CRACK_END) / (SHATTER_END - CRACK_END);
        var ease = easeOutCubic(st);
        var dt = (SHATTER_END - CRACK_END) * ease;
        x = s.ox + s.vx * dt * 0.55;
        y = s.oy + s.vy * dt * 0.55 + 90 * ease * ease;
        rot = s.vr * ease * 0.55;
        scale = lerp(1, 0.92, ease);
      } else if (local < DRIFT_END) {
        var driftBase = easeOutCubic(1);
        var dt2 = (SHATTER_END - CRACK_END) * driftBase;
        var driftT = (local - SHATTER_END) / (DRIFT_END - SHATTER_END);
        x = s.ox + s.vx * dt2 * 0.55 + s.vx * 0.08 * driftT;
        y = s.oy + s.vy * dt2 * 0.55 + 90 + s.vy * 0.05 * driftT + 18 * driftT;
        rot = s.vr * 0.55 + s.vr * 0.12 * driftT;
        scale = 0.92;
      } else if (local < RECALL_END) {
        var driftBase2 = easeOutCubic(1);
        var dt3 = (SHATTER_END - CRACK_END) * driftBase2;
        var farX = s.ox + s.vx * dt3 * 0.55 + s.vx * 0.08;
        var farY = s.oy + s.vy * dt3 * 0.55 + 90 + s.vy * 0.05 + 18;
        var farRot = s.vr * 0.55 + s.vr * 0.12;
        var rt = easeInOutCubic((local - DRIFT_END) / (RECALL_END - DRIFT_END));
        x = lerp(farX, s.ox, rt);
        y = lerp(farY, s.oy, rt);
        rot = lerp(farRot, 0, rt);
        scale = lerp(0.92, 1, rt);
      } else {
        x = s.ox;
        y = s.oy;
        rot = 0;
        scale = 1;
        var fade = clamp((local - RECALL_END) / (REBUILD_END - RECALL_END), 0, 1);
        opacity = 1 - fade;
      }

      s.el.style.transform =
        'translate3d(' + x + 'px,' + y + 'px,0) rotate(' + rot + 'deg) scale(' + scale + ')';
      s.el.style.left = '0';
      s.el.style.top = '0';
      s.el.style.opacity = String(opacity);

      if (!mobile && local > CRACK_END && local < DRIFT_END) {
        var blurT = local < SHATTER_END
          ? (local - CRACK_END) / (SHATTER_END - CRACK_END)
          : 1 - (local - SHATTER_END) / (DRIFT_END - SHATTER_END);
        s.el.style.filter = 'blur(' + (blurT * 1.8).toFixed(2) + 'px)';
      } else {
        s.el.style.filter = '';
      }
    });
  }

  function createParticles(canvas) {
    resizeCanvas(canvas);
    var stars = [];
    var dust = [];
    var sparks = [];
    var i;
    var mobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 700;
    var starCount = mobile ? 90 : 160;
    var dustCount = mobile ? 50 : 90;
    var sparkCount = mobile ? 24 : 40;

    for (i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        r: rand(0.4, 2.2),
        tw: rand(0, Math.PI * 2),
        speed: rand(0.8, 2.4)
      });
    }

    for (i = 0; i < dustCount; i++) {
      var ang = rand(0, Math.PI * 2);
      var sp = rand(80, 480);
      dust.push({
        x: 0.5,
        y: 0.45,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        life: rand(0.6, 1.8),
        age: 0,
        size: rand(1, 3.5),
        hue: rand(90, 160)
      });
    }

    for (i = 0; i < sparkCount; i++) {
      var a2 = rand(0, Math.PI * 2);
      sparks.push({
        x: 0.5,
        y: 0.45,
        vx: Math.cos(a2) * rand(200, 700),
        vy: Math.sin(a2) * rand(200, 700),
        life: rand(0.25, 0.7),
        age: 0,
        len: rand(8, 22)
      });
    }

    return { stars: stars, dust: dust, sparks: sparks, mobile: mobile };
  }

  function resizeCanvas(canvas) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth;
    var h = window.innerHeight;
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
    }
  }

  function renderParticles(canvas, particles, t, flash) {
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.width / dpr;
    var h = canvas.height / dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    var veil = 0.55;
    if (t < CRACK_END) {
      veil = lerp(0.15, 0.7, t / CRACK_END);
    } else if (t > RECALL_END) {
      veil = lerp(0.55, 0, (t - RECALL_END) / (REBUILD_END - RECALL_END));
    }

    var g = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
    g.addColorStop(0, 'rgba(40, 55, 70, ' + (veil * 0.85) + ')');
    g.addColorStop(0.45, 'rgba(12, 18, 28, ' + veil + ')');
    g.addColorStop(1, 'rgba(4, 6, 10, ' + Math.min(0.92, veil + 0.2) + ')');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    if (flash > 0.01) {
      ctx.fillStyle = 'rgba(200, 230, 255, ' + (flash * 0.55) + ')';
      ctx.fillRect(0, 0, w, h);
    }

    var recallPull = 0;
    if (t > DRIFT_END && t < RECALL_END) {
      recallPull = (t - DRIFT_END) / (RECALL_END - DRIFT_END);
    } else if (t >= RECALL_END) {
      recallPull = 1;
    }

    particles.stars.forEach(function (star) {
      var tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * star.speed + star.tw));
      var sx = star.x * w;
      var sy = star.y * h;
      if (recallPull > 0) {
        sx = lerp(sx, w * 0.5, recallPull * 0.25);
        sy = lerp(sy, h * 0.45, recallPull * 0.25);
      }
      ctx.beginPath();
      ctx.fillStyle = 'rgba(230, 240, 255, ' + (tw * (1 - recallPull * 0.4)) + ')';
      ctx.arc(sx, sy, star.r, 0, Math.PI * 2);
      ctx.fill();
    });

    var dt = 1 / 60;
    particles.dust.forEach(function (p) {
      if (t < 0.05) return;
      p.age += dt;
      var lifeT = clamp(p.age / p.life, 0, 1);
      if (lifeT >= 1 && t < DRIFT_END) {
        p.age = 0;
        p.x = 0.5 + rand(-0.05, 0.05);
        p.y = 0.45 + rand(-0.05, 0.05);
        var ang = rand(0, Math.PI * 2);
        var sp = rand(40, 220);
        p.vx = Math.cos(ang) * sp;
        p.vy = Math.sin(ang) * sp;
        lifeT = 0;
      }

      var px = p.x * w + p.vx * Math.min(p.age, p.life) * (t < RECALL_END ? 1 : 0.2);
      var py = p.y * h + p.vy * Math.min(p.age, p.life) * (t < RECALL_END ? 1 : 0.2);

      if (recallPull > 0) {
        px = lerp(px, w * 0.5, recallPull);
        py = lerp(py, h * 0.45, recallPull);
      }

      var alpha = (1 - lifeT) * (t > RECALL_END ? 1 - (t - RECALL_END) / 0.8 : 1);
      if (alpha <= 0) return;
      ctx.beginPath();
      ctx.fillStyle = 'hsla(' + p.hue + ', 40%, 70%, ' + (alpha * 0.75) + ')';
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    if (t < 1.2) {
      particles.sparks.forEach(function (sp) {
        sp.age += dt;
        var lifeT = clamp(sp.age / sp.life, 0, 1);
        if (lifeT >= 1) return;
        var px = w * 0.5 + sp.vx * sp.age;
        var py = h * 0.45 + sp.vy * sp.age;
        var alpha = 1 - lifeT;
        ctx.strokeStyle = 'rgba(180, 220, 255, ' + (alpha * 0.9) + ')';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - sp.vx * 0.02, py - sp.vy * 0.02);
        ctx.stroke();
      });
    }
  }

  function teardown(root, page, targets) {
    cancelAnimationFrame(rafId);
    rafId = 0;

    if (root && root.parentNode) {
      root.parentNode.removeChild(root);
    }

    page.classList.remove('page--shattering');
    page.classList.add('page--rebuilding');

    window.setTimeout(function () {
      targets.forEach(function (el) {
        el.style.transition = '';
        el.style.opacity = '';
        el.style.transform = '';
      });
      page.classList.remove('page--rebuilding');
      page.classList.add('page--settled');
      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        var stageEl = document.querySelector('.page__stage');
        if (stageEl) stageEl.classList.add('page--parallax');
      }
      isAnimating = false;
    }, 700);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
