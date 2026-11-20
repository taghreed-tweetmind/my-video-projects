/* engine.js — محرك العرض: النبضات (beats)، التنقل، اللمس، الأدوات.
   العرض كله خط زمني GSAP واحد متوقف. كل «نبضة» = نقطة توقف تنتظر نقرة. */
(function () {
  var Q = new URLSearchParams(location.search);
  var MODE = Q.get('mode') || '';           // mirror | preview | thumb | ''
  var EMBED = MODE === 'mirror' || MODE === 'preview';
  var LITE = Q.has('lite') || EMBED || MODE === 'thumb';
  var Deck = window.Deck = { mode: MODE, lite: LITE, embed: EMBED, extras: [], slots: {} };
  var tl, beats = [], scenes = [], cur = 0, moving = null, watchers = [];
  var stage, black = null;

  /* ---------- scale stage ---------- */
  function fit() {
    var s = Math.min(innerWidth / 1920, innerHeight / 1080);
    stage.style.transform = 'scale(' + s + ')';
  }

  /* ---------- watchers: redraw code-drawn things when state changes ---------- */
  Deck.watch = function (obj, fn) { watchers.push({ o: obj, f: fn, k: '' }); };
  function tickWatchers() {
    for (var i = 0; i < watchers.length; i++) {
      var w = watchers[i], k = '';
      for (var p in w.o) k += w.o[p] + '|';
      if (k !== w.k) { w.k = k; w.f(w.o); }
    }
  }

  /* ---------- text helpers (Arabic: words only, never letters) ---------- */
  var AR = /[؀-ۿ]/;
  Deck.split = function (el) {
    if (el._split) return el._split;
    var out = [];
    (function walk(n) {
      [].slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var parts = c.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var s = document.createElement('span'); s.className = 'w'; s.style.display = 'inline-block'; s.textContent = p;
            frag.appendChild(s); out.push(s);
          });
          n.replaceChild(frag, c);
        } else if (c.nodeType === 1 && !c.classList.contains('nosplit')) walk(c);
        else if (c.nodeType === 1) out.push(c);
      });
    })(el);
    el._split = out; return out;
  };
  Deck.counter = function (el, fmt) {
    var o = { v: 0 };
    Deck.watch(o, function () { el.textContent = fmt(o.v); });
    return o;
  };
  Deck.fmt = function (n) { var r = Math.round(n); return (r < 0 ? '−' : '') + Math.abs(r).toLocaleString('en-US'); };

  /* ---------- builder ---------- */
  Deck.start = function (build) {
    stage = document.getElementById('stage');
    if (EMBED) document.body.classList.add('embed');
    if (MODE === 'thumb') document.body.classList.add('thumb');
    fit(); addEventListener('resize', fit);
    tl = gsap.timeline({ paused: true });
    Deck.tl = tl;
    beats.push({ name: 'البداية', notes: 'شاشة هادئة. انقري للبدء.', time: 0, scene: 0 });
    scenes.push({ title: 'البداية', first: 0 });
    var B = {
      tl: tl,
      t: function () { return tl.duration(); },
      scene: function (title) { scenes.push({ title: title, first: beats.length }); return scenes.length - 1; },
      beat: function (name, notes) {
        if (tl.duration() <= (beats[beats.length - 1].time + 0.001)) tl.to({}, { duration: 0.05 });
        beats.push({ name: name, notes: notes || '', time: tl.duration(), scene: scenes.length - 1 });
      }
    };
    build(B);
    Deck.extras.forEach(function (f) { f(B); });
    Deck.beats = beats; Deck.scenes = scenes;
    whenReady(function () {
      var h = /b=(\d+)/.exec(location.hash), i = h ? Math.min(+h[1], beats.length - 1) : 0;
      jump(i, true);
      document.getElementById('loader').style.display = 'none';
      gsap.ticker.add(tickWatchers);
      post();
    });
  };

  function whenReady(cb) {
    var done = false, go = function () { if (!done) { done = true; cb(); } };
    var fontP = document.fonts ? Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 5000); })]) : Promise.resolve();
    var imgs = [].slice.call(document.images).filter(function (i) { return !i.complete; });
    var imgP = Promise.race([Promise.all(imgs.map(function (i) { return new Promise(function (r) { i.onload = i.onerror = r; }); })), new Promise(function (r) { setTimeout(r, 8000); })]);
    Promise.all([fontP, imgP]).then(go, go);
  }

  /* ---------- navigation ---------- */
  function setHash() { if (!EMBED && MODE !== 'thumb') history.replaceState(null, '', '#b=' + cur); }
  function ui() {
    var sc = beats[cur].scene, pn = document.getElementById('pageNo');
    pn.textContent = sc ? sc + ' / ' + (scenes.length - 1) : '';
    document.getElementById('progress').style.width = (cur / (beats.length - 1) * 100) + '%';
    setHash(); post();
  }
  function finish() { if (moving) { moving.kill(); moving = null; tl.time(beats[cur].time); } }
  function go(i, dir) {
    tl.pause();
    var from = tl.time(), to = beats[i].time, d = Math.abs(to - from) / (dir > 0 ? 1 : 1.8);
    cur = i; ui();
    moving = gsap.to(tl, { time: to, duration: Math.max(d, 0.01), ease: 'none', onComplete: function () { moving = null; } });
  }
  function jump(i, silent) {
    finish(); cur = Math.max(0, Math.min(beats.length - 1, i));
    if (silent) { tl.time(beats[cur].time); ui(); return; }
    var f = document.getElementById('flash');
    gsap.timeline().to(f, { opacity: 1, duration: 0.15 }).add(function () { tl.time(beats[cur].time); ui(); }).to(f, { opacity: 0, duration: 0.3 });
  }
  Deck.next = function () {
    if (unblank()) return;
    if (moving) { finish(); }
    if (cur < beats.length - 1) go(cur + 1, 1);
  };
  Deck.back = function () {
    if (unblank()) return;
    if (moving) { finish(); }
    if (cur > 0) go(cur - 1, -1);
  };
  Deck.jump = function (i) { if (Math.abs(i - cur) <= 1 && !moving) { i > cur ? Deck.next() : i < cur ? Deck.back() : 0; } else jump(i); };
  Deck.cur = function () { return cur; };

  /* ---------- black / white ---------- */
  function blank(color) {
    var c = document.getElementById('curtain');
    if (black === color) { unblank(); return; }
    black = color; c.style.background = color === 'w' ? '#fff' : '#000'; c.classList.add('on'); post();
  }
  function unblank() { if (!black) return false; black = null; document.getElementById('curtain').classList.remove('on'); post(); return true; }
  Deck.blank = blank;

  /* ---------- overlays ---------- */
  function toggle(id, on) { var e = document.getElementById(id); var s = on === undefined ? !e.classList.contains('on') : on; e.classList.toggle('on', s); return s; }
  function closeAll() { ['help', 'overview'].forEach(function (i) { toggle(i, false); }); toggle('menu', false); }
  var sel = 0;
  function buildOverview() {
    var o = document.getElementById('overview'), T = window.THUMBS || {}, h = '<h2>نظرة عامة — اختاري نقرة للانتقال إليها</h2>';
    scenes.forEach(function (s, si) {
      var bs = []; beats.forEach(function (b, bi) { if (b.scene === si) bs.push(bi); });
      h += '<div class="ovg"><h3>' + (si ? si + ' · ' : '') + s.title + ' — ' + bs.length + ' نقرة</h3><div class="ovrow">';
      bs.forEach(function (bi) {
        var b = beats[bi], src = T[b.name];
        h += '<div class="th' + (bi === cur ? ' cur' : '') + (bi === sel ? ' sel' : '') + '" data-b="' + bi + '">' + (src ? '<img src="assets/thumbs/' + src + '">' : '<div class="ph">' + b.name + '<br>(لا لقطة — شغّلي tools/make-thumbnails)</div>') + '<div class="nm">' + bi + ' · ' + b.name + '</div></div>';
      });
      h += '</div></div>';
    });
    o.innerHTML = h;
  }
  function openOverview() { sel = cur; buildOverview(); toggle('overview', true); var c = document.querySelector('.th.cur'); if (c) c.scrollIntoView({ block: 'center' }); }

  /* ---------- presenter link ---------- */
  var pres = null;
  function post() {
    var msg = { type: 'rshd-state', i: cur, total: beats.length, page: beats[cur].scene, pages: scenes.length - 1, title: scenes[beats[cur].scene].title, name: beats[cur].name, notes: beats[cur].notes, next: beats[cur + 1] ? beats[cur + 1].name : '— النهاية —', black: !!black };
    try { if (pres && !pres.closed) pres.postMessage(msg, '*'); } catch (e) {}
    try { if (window.opener && MODE === '') window.opener.postMessage(msg, '*'); } catch (e) {}
  }
  addEventListener('message', function (e) {
    var d = e.data || {};
    if (d.type === 'rshd-hello') { pres = e.source; post(); }
    if (d.type === 'rshd-cmd') { if (d.cmd === 'next') Deck.next(); else if (d.cmd === 'back') Deck.back(); else if (d.cmd === 'black') blank('b'); }
    if (d.type === 'rshd-go' && EMBED) { var t = MODE === 'preview' ? Math.min(d.i + 1, beats.length - 1) : d.i; if (MODE === 'mirror' && t === cur + 1) Deck.next(); else if (t !== cur) jump(t, true); }
  });
  Deck.presenter = function () { pres = window.open('presenter.html', 'rshd-presenter', 'width=1400,height=860'); };

  /* ---------- keyboard ---------- */
  var digits = '', keyLog = document.getElementById('keys');
  function log(k, what) { if (keyLog.style.display === 'block') keyLog.textContent = k + ' → ' + what; }
  addEventListener('keydown', function (e) {
    if (EMBED || e.ctrlKey || e.altKey || e.metaKey) return;
    var k = e.key, did = 'غير مربوط';
    var ovOn = document.getElementById('overview').classList.contains('on');
    if (ovOn) {
      if (k === 'ArrowLeft' || k === 'ArrowDown' || k === 'PageDown') { sel = Math.min(beats.length - 1, sel + 1); buildOverview(); }
      else if (k === 'ArrowRight' || k === 'ArrowUp' || k === 'PageUp') { sel = Math.max(0, sel - 1); buildOverview(); }
      else if (k === 'Enter' || k === ' ') { toggle('overview', false); jump(sel); }
      else if (k === 'Escape' || k === 'g' || k === 'o') toggle('overview', false);
      e.preventDefault(); return;
    }
    if (/^[0-9]$/.test(k)) { digits += k; did = 'رقم ' + digits; }
    else if (k === 'Enter' && digits) { var p = +digits; digits = ''; if (scenes[p]) jump(firstBeatOf(p)); did = 'انتقال لصفحة ' + p; }
    else if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'n', 'N', 'Enter'].indexOf(k) > -1) { Deck.next(); did = 'التالي'; }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].indexOf(k) > -1) { Deck.back(); did = 'السابق'; }
    else if (k === 'f' || k === 'F' || k === 'F5') { fullscreen(); did = 'ملء الشاشة'; }
    else if (k === 'b' || k === 'B' || k === '.') { blank('b'); did = 'شاشة سوداء'; }
    else if (k === 'w' || k === 'W' || k === ',') { blank('w'); did = 'شاشة بيضاء'; }
    else if (k === 'p' || k === 'P') { Deck.presenter(); did = 'عرض المقدّم'; }
    else if (k === 'g' || k === 'G' || k === 'o' || k === 'O') { openOverview(); did = 'نظرة عامة'; }
    else if (k === 'Home') { jump(0); did = 'البداية'; }
    else if (k === 'End') { jump(beats.length - 1); did = 'النهاية'; }
    else if (k === 'h' || k === 'H' || k === '?') { toggle('help'); did = 'مساعدة'; }
    else if (k === 'd' || k === 'D') { keyLog.style.display = keyLog.style.display === 'block' ? 'none' : 'block'; did = 'فاحص المفاتيح'; }
    else if (k === 'l' || k === 'L') { var pg = document.getElementById('progress'); pg.style.display = pg.style.display === 'block' ? 'none' : 'block'; did = 'خط التقدم'; }
    else if (k === 'Escape') { closeAll(); did = 'إغلاق'; }
    else { log(k, did); return; }
    log(k, did); e.preventDefault();
  });
  function firstBeatOf(p) { for (var i = 0; i < beats.length; i++) if (beats[i].scene === p) return i; return 0; }
  Deck.firstBeatOf = firstBeatOf;
  function fullscreen() {
    var d = document, el = d.documentElement;
    if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    else if (el.requestFullscreen) el.requestFullscreen().catch(function () {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  }

  /* ---------- touch / mouse (iPad: tap = next, right edge = back, swipe) ---------- */
  var down = null;
  function inUI(t) { return t.closest && t.closest('#menuBtn,#menu,.ov,a,.qr'); }
  addEventListener('contextmenu', function (e) { e.preventDefault(); });
  addEventListener('pointerdown', function (e) { if (EMBED || inUI(e.target)) return; down = { x: e.clientX, y: e.clientY, t: Date.now(), b: e.button }; });
  addEventListener('pointerup', function (e) {
    if (EMBED || !down || inUI(e.target)) { down = null; return; }
    var dx = e.clientX - down.x, dy = e.clientY - down.y, dt = Date.now() - down.t, b = down.b; down = null;
    if (document.getElementById('curtain').classList.contains('on')) { unblank(); return; }
    if (b === 2) { Deck.back(); return; }
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) { dx > 0 ? Deck.next() : Deck.back(); return; } // RTL: سحب لليمين = التالي
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20 && dt < 700) { e.clientX > innerWidth * 0.86 ? Deck.back() : Deck.next(); }
  });
  /* hide pointer after 2s idle */
  var idleT; addEventListener('mousemove', function () { document.body.classList.remove('idle'); clearTimeout(idleT); idleT = setTimeout(function () { document.body.classList.add('idle'); }, 2000); });

  /* ---------- menu (for iPad) ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    var mb = document.getElementById('menuBtn'), m = document.getElementById('menu');
    mb.addEventListener('click', function () { toggle('menu'); });
    m.addEventListener('click', function (e) {
      var a = e.target.dataset.act; if (!a) return; toggle('menu', false);
      if (a === 'fs') fullscreen(); if (a === 'ov') openOverview(); if (a === 'help') toggle('help', true);
      if (a === 'black') blank('b'); if (a === 'home') jump(0); if (a === 'pres') Deck.presenter();
      if (a === 'back') Deck.back();
    });
    document.getElementById('overview').addEventListener('click', function (e) { var t = e.target.closest('.th'); if (t) { toggle('overview', false); jump(+t.dataset.b); } else toggle('overview', false); });
    document.getElementById('help').addEventListener('click', function () { toggle('help', false); });
  });
})();
