/* Portafolio · Better Goal Software
   GSAP + ScrollTrigger + SplitText para las animaciones, Lenis para el scroll suave
   y Three.js para la red neuronal del inicio. Sin movimiento si el sistema lo pide. */
(function () {
  'use strict';
  var root = document.documentElement;
  var hasGsap = window.gsap && window.ScrollTrigger;
  var motion = root.classList.contains('motion') && hasGsap;
  if (!motion) root.classList.remove('motion');
  window.__siteReady = true;

  var desktop = window.matchMedia('(min-width: 1021px)');
  var wide = window.matchMedia('(min-width: 721px)');
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------- Menú de idiomas ---------- */
  var lang = document.querySelector('.lang');
  if (lang) {
    var langBtn = lang.querySelector('.lang-btn');
    langBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = lang.classList.toggle('open');
      langBtn.setAttribute('aria-expanded', open);
    });
    document.addEventListener('click', function () { lang.classList.remove('open'); langBtn.setAttribute('aria-expanded', 'false'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') lang.classList.remove('open'); });
  }

  /* ---------- Red neuronal 3D (Three.js) ---------- */
  initNeural();

  /* ---------- Navegación: barra de progreso, ocultar al bajar, enlace activo ---------- */
  var nav = document.querySelector('.nav');
  var bar = document.querySelector('.progress span');
  var lastY = 0;
  function onScroll(y) {
    var max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    if (nav && !(lang && lang.classList.contains('open'))) nav.classList.toggle('hide', y > lastY && y > 400);
    lastY = y;
  }
  var links = [].slice.call(document.querySelectorAll('.nav-links a'));
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(function (a) { var s = document.querySelector(a.getAttribute('href')); if (s) io.observe(s); });
  }

  if (!motion) {
    addEventListener('scroll', function () { onScroll(scrollY); }, { passive: true });
    document.querySelectorAll('.count').forEach(function (el) { el.textContent = el.dataset.to; });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);

  /* ---------- Scroll suave (Lenis) ---------- */
  var lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', function (e) { ScrollTrigger.update(); onScroll(e.scroll); });
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        var target = id === '#top' ? 0 : document.querySelector(id);
        if (target === null) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: id === '#top' ? 0 : -20, duration: 1.4 });
      });
    });
  } else {
    addEventListener('scroll', function () { onScroll(scrollY); }, { passive: true });
  }

  /* ---------- Títulos: líneas que suben desde una máscara ---------- */
  function splitLines(el) {
    if (!window.SplitText) return [el];
    var s = new SplitText(el, { type: 'lines', linesClass: 'line' });
    s.lines.forEach(function (line) {
      var mask = document.createElement('div');
      mask.className = 'line-mask';
      line.parentNode.insertBefore(mask, line);
      mask.appendChild(line);
    });
    return s.lines;
  }

  var heroTitle = document.querySelector('.hero-title');
  var heroLines = splitLines(heroTitle);
  gsap.set('.hero .reveal-up', { y: 24 });
  var intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  intro
    .from('.nav', { y: -40, opacity: 0, duration: 1, clearProps: 'transform,opacity' }, 0)
    .to('.hero .eyebrow', { opacity: 1, y: 0, duration: .9 }, .15)
    .from(heroLines, { yPercent: 110, rotate: 2, duration: 1.3, stagger: .09 }, .25)
    .to('.hero-sub', { opacity: 1, y: 0, duration: 1 }, .7)
    .to('.hero-cta', { opacity: 1, y: 0, duration: 1 }, .85)
    .from('.stat', { y: 40, opacity: 0, duration: 1, stagger: .08 }, .95)
    .add(countUp, 1.05);

  function countUp() {
    document.querySelectorAll('.count').forEach(function (el) {
      var o = { v: 0 };
      gsap.to(o, { v: +el.dataset.to, duration: 2, ease: 'power3.out', onUpdate: function () { el.textContent = Math.round(o.v); } });
    });
  }

  // El inicio se aleja al bajar.
  gsap.to('.hero-inner', { yPercent: -18, opacity: .2, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  document.querySelectorAll('.split:not(.hero-title)').forEach(function (el) {
    var lines = splitLines(el);
    gsap.from(lines, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: .08,
      scrollTrigger: { trigger: el, start: 'top 85%' } });
  });

  /* ---------- Apariciones sueltas ---------- */
  gsap.utils.toArray('.reveal-up').filter(function (el) { return !el.closest('.hero'); }).forEach(function (el) {
    gsap.fromTo(el, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
  ScrollTrigger.batch('.reveal-card', {
    start: 'top 90%',
    onEnter: function (els) {
      gsap.fromTo(els, { y: 50, opacity: 0, scale: .97 }, { y: 0, opacity: 1, scale: 1, duration: 1, ease: 'power3.out', stagger: .08, overwrite: true });
    }
  });

  /* ---------- Manifiesto: las palabras se encienden con el scroll ---------- */
  var manifesto = document.querySelector('.manifesto');
  if (manifesto && window.SplitText) {
    var ms = new SplitText(manifesto, { type: 'words', wordsClass: 'word' });
    gsap.to(ms.words, { opacity: 1, stagger: .05, ease: 'none',
      scrollTrigger: { trigger: manifesto, start: 'top 80%', end: 'bottom 45%', scrub: true } });
  }

  /* ---------- Consola de IA: las líneas se escriben en orden ---------- */
  var termLines = gsap.utils.toArray('.term-body .tl');
  gsap.set(termLines, { opacity: 0, x: -10 });
  ScrollTrigger.create({ trigger: '.terminal', start: 'top 75%', once: true, onEnter: function () {
    gsap.to(termLines, { opacity: 1, x: 0, duration: .5, ease: 'power2.out', stagger: .45 });
  } });
  gsap.to('.orbit', { rotate: 90, ease: 'none', scrollTrigger: { trigger: '#ia', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* ---------- Banca: el diagrama se dibuja por pasos ---------- */
  var steps = gsap.utils.toArray('.bank-steps li');
  var wires = gsap.utils.toArray('.wire');
  wires.forEach(function (p) { var L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
  function setStep(i) { steps.forEach(function (s, k) { s.classList.toggle('is-active', k === i); }); }

  function bankTimeline(withSteps) {
    var tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
    var groups = [['.n1', '.w1'], ['.n2', '.w2'], ['.n3', '.w3'], ['.n4', null], ['.n5', '.w5']];
    groups.forEach(function (g, i) {
      var at = i;
      if (withSteps) tl.call(setStep, [i], at);
      tl.from(g[0], { opacity: 0, y: 14, duration: .5, stagger: .08 }, at);
      if (g[1]) tl.to(g[1], { strokeDashoffset: 0, duration: .7, stagger: .05 }, at + .1);
    });
    tl.to('.packet', { keyframes: [
      { attr: { cx: 260, cy: 185 }, duration: 1 }, { attr: { cx: 260, cy: 285 }, duration: 1 },
      { attr: { cx: 140, cy: 405 }, duration: 1 }, { attr: { cx: 140, cy: 405 }, duration: 1 },
      { attr: { cx: 260, cy: 515 }, duration: 1 }] , ease: 'none' }, 0);
    return tl;
  }

  var mm = gsap.matchMedia();
  mm.add('(min-width: 1021px)', function () {
    var tl = bankTimeline(true);
    tl.call(setStep, [4], 5.2);
    ScrollTrigger.create({ trigger: '.bank-pin', start: 'top top', end: '+=220%', pin: true, scrub: .6, animation: tl,
      onLeaveBack: function () { setStep(0); } });
  });
  mm.add('(max-width: 1020px)', function () {
    steps.forEach(function (s) { s.classList.add('is-active'); });
    var tl = bankTimeline(false); tl.pause();
    ScrollTrigger.create({ trigger: '.bank-diagram', start: 'top 75%', once: true, onEnter: function () { tl.duration(3.5).play(); } });
  });

  /* ---------- Trayectoria: desplazamiento horizontal fijado ---------- */
  mm.add('(min-width: 721px)', function () {
    var track = document.querySelector('.tl-track');
    var dist = function () { return track.scrollWidth - innerWidth; };
    var move = gsap.to(track, { x: function () { return -dist(); }, ease: 'none',
      scrollTrigger: { trigger: '.section-timeline', start: 'top top', end: function () { return '+=' + dist(); },
        pin: true, scrub: .8, invalidateOnRefresh: true } });
    gsap.fromTo('.tl-line span', { scaleX: 0 }, { scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: '.section-timeline', start: 'top top', end: function () { return '+=' + dist(); }, scrub: true } });
    gsap.utils.toArray('.tl-item').forEach(function (item) {
      gsap.from(item, { y: 60, opacity: 0, rotate: 1.5, duration: .8, ease: 'power3.out',
        scrollTrigger: { trigger: item, containerAnimation: move, start: 'left 92%' } });
    });
  });
  mm.add('(max-width: 720px)', function () {
    gsap.fromTo('.tl-line span', { scaleY: 0 }, { scaleY: 1, ease: 'none',
      scrollTrigger: { trigger: '.tl-track', start: 'top 70%', end: 'bottom 70%', scrub: true } });
    gsap.utils.toArray('.tl-item').forEach(function (item) {
      gsap.from(item, { x: 30, opacity: 0, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: item, start: 'top 88%' } });
    });
  });

  /* ---------- Detalles con el puntero: brillo, botones magnéticos, inclinación ---------- */
  if (finePointer) {
    var cursor = document.querySelector('.cursor');
    var cx = gsap.quickTo(cursor, 'x', { duration: .6, ease: 'power3' });
    var cy = gsap.quickTo(cursor, 'y', { duration: .6, ease: 'power3' });
    addEventListener('pointermove', function (e) { cx(e.clientX); cy(e.clientY); }, { passive: true });

    document.querySelectorAll('.magnetic').forEach(function (b) {
      var mx = gsap.quickTo(b, 'x', { duration: .5, ease: 'elastic.out(1,.4)' });
      var my = gsap.quickTo(b, 'y', { duration: .5, ease: 'elastic.out(1,.4)' });
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * .3); my((e.clientY - r.top - r.height / 2) * .4);
      });
      b.addEventListener('pointerleave', function () { mx(0); my(0); });
    });

    document.querySelectorAll('.tilt').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        c.style.setProperty('--mx', px * 100 + '%'); c.style.setProperty('--my', py * 100 + '%');
        gsap.to(c, { rotateY: (px - .5) * 8, rotateX: (.5 - py) * 8, transformPerspective: 900, duration: .4, ease: 'power2.out' });
      });
      c.addEventListener('pointerleave', function () { gsap.to(c, { rotateX: 0, rotateY: 0, duration: .7, ease: 'power3.out' }); });
    });
  }

  addEventListener('load', function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });

  /* ======================================================================= */
  function initNeural() {
    var canvas = document.getElementById('neural');
    if (!canvas || !window.THREE) return;
    var renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); } catch (e) { return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(50, 1, .1, 100);
    camera.position.z = 7.5;
    var group = new THREE.Group();
    scene.add(group);

    var small = innerWidth < 720;
    var N = small ? 150 : 280, R = 2.4;
    var pts = [], pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    var c1 = new THREE.Color('#22d3ee'), c2 = new THREE.Color('#a78bfa'), c3 = new THREE.Color('#f0abfc');
    for (var i = 0; i < N; i++) {
      // Esfera de Fibonacci con un poco de ruido: parece una red orgánica.
      var y = 1 - (i / (N - 1)) * 2, rad = Math.sqrt(1 - y * y), th = i * 2.399963;
      var jitter = 1 + (Math.random() - .5) * .18;
      var v = new THREE.Vector3(Math.cos(th) * rad * R * jitter, y * R * jitter, Math.sin(th) * rad * R * jitter);
      pts.push(v); pos.set([v.x, v.y, v.z], i * 3);
      var c = (y > 0 ? c1.clone().lerp(c2, 1 - y) : c2.clone().lerp(c3, -y));
      col.set([c.r, c.g, c.b], i * 3);
    }
    var sprite = (function () {
      var cv = document.createElement('canvas'); cv.width = cv.height = 64;
      var g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(cv);
    })();
    var pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pg.setAttribute('color', new THREE.BufferAttribute(col, 3));
    group.add(new THREE.Points(pg, new THREE.PointsMaterial({ size: .11, map: sprite, vertexColors: true, transparent: true,
      depthWrite: false, blending: THREE.AdditiveBlending })));

    var lp = [], lc = [], maxD = R * (small ? .5 : .4);
    for (var a = 0; a < N; a++) for (var b = a + 1; b < N; b++) {
      if (pts[a].distanceTo(pts[b]) < maxD) {
        lp.push(pts[a].x, pts[a].y, pts[a].z, pts[b].x, pts[b].y, pts[b].z);
        lc.push(col[a * 3], col[a * 3 + 1], col[a * 3 + 2], col[b * 3], col[b * 3 + 1], col[b * 3 + 2]);
      }
    }
    var lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    lg.setAttribute('color', new THREE.Float32BufferAttribute(lc, 3));
    var lineMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: .22, blending: THREE.AdditiveBlending, depthWrite: false });
    group.add(new THREE.LineSegments(lg, lineMat));

    // Pulsos que viajan por las conexiones: la "información" fluyendo.
    var P = small ? 14 : 28, pulses = [], ppos = new Float32Array(P * 3);
    var segs = lp.length / 6;
    for (var k = 0; k < P; k++) pulses.push({ s: (Math.random() * segs) | 0, t: Math.random(), v: .4 + Math.random() * .8 });
    var pulseGeo = new THREE.BufferGeometry();
    pulseGeo.setAttribute('position', new THREE.BufferAttribute(ppos, 3));
    group.add(new THREE.Points(pulseGeo, new THREE.PointsMaterial({ size: .16, map: sprite, color: '#e0fbff', transparent: true,
      depthWrite: false, blending: THREE.AdditiveBlending })));

    // Anillo exterior
    var ring = new THREE.Mesh(new THREE.TorusGeometry(R * 1.35, .006, 8, 160),
      new THREE.MeshBasicMaterial({ color: '#a78bfa', transparent: true, opacity: .35 }));
    ring.rotation.x = 1.2; group.add(ring);

    function layout() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
      group.position.x = w > 1020 ? 2.6 : 0;
      group.position.y = w > 1020 ? .1 : 1.2;
      lineMat.opacity = w > 1020 ? .22 : .14;
    }
    layout(); addEventListener('resize', layout);

    var tx = 0, ty = 0, visible = true, still = !root.classList.contains('motion');
    addEventListener('pointermove', function (e) { tx = (e.clientX / innerWidth - .5); ty = (e.clientY / innerHeight - .5); }, { passive: true });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) loop(); }).observe(canvas);

    var last = performance.now(), running = false;
    function loop() {
      if (running) return; running = true;
      requestAnimationFrame(function tick(now) {
        var dt = Math.min((now - last) / 1000, .05); last = now;
        if (!still) {
          group.rotation.y += dt * .08;
          group.rotation.x += ((ty * .4) - group.rotation.x) * .04;
          group.rotation.z += ((tx * -.2) - group.rotation.z) * .04;
          ring.rotation.z += dt * .1;
          var sc = Math.min(scrollY / innerHeight, 1);
          camera.position.z = 7.5 + sc * 3;
          for (var k = 0; k < P; k++) {
            var p = pulses[k]; p.t += dt * p.v;
            if (p.t > 1) { p.t = 0; p.s = (Math.random() * segs) | 0; }
            var o = p.s * 6;
            ppos[k * 3] = lp[o] + (lp[o + 3] - lp[o]) * p.t;
            ppos[k * 3 + 1] = lp[o + 1] + (lp[o + 4] - lp[o + 1]) * p.t;
            ppos[k * 3 + 2] = lp[o + 2] + (lp[o + 5] - lp[o + 2]) * p.t;
          }
          pulseGeo.attributes.position.needsUpdate = true;
        }
        renderer.render(scene, camera);
        if (visible && !still) requestAnimationFrame(tick); else running = false;
      });
    }
    loop();
  }
})();
