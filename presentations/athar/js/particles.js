/* particles.js — سحابة نقاط WebGL واحدة خلف كل الصفحات، تتحول من شكل لشكل.
   الكاميرا: النقطة p (في إحداثيات الشكل، تقريبًا بين −1 و1) تُدوَّر حول Y بزاوية rot
   ثم تُمال حول X بزاوية tilt، ثم تُكبَّر بـ scale وتُبعد z−=3.2.
   الإسقاط: x_ndc = p.x * f / (−z) / aspect + offX ، y_ndc = p.y * f / (−z) + offY ، حيث f = 2.4.
   لتثبيت نص فوق نقطة: احسبي نفس المعادلة ثم حوّلي ndc إلى بكسل (×960+960 ، −×540+540). */
(function () {
  // light by default: touch devices (iPad) get fewer points; ?full forces the dense cloud
  var TOUCH = ('ontouchstart' in window) || navigator.maxTouchPoints > 1;
  var FULL = /[?&]full\b/.test(location.search);
  var N = FULL ? 14000 : Deck.lite ? 3000 : TOUCH ? 4000 : 6000;
  var S = window.PS = {
    a: 0, b: 0, mix: 1, x: -0.45, y: 0, scale: 1, rot: 0, spin: 0.12, tilt: 0.25, sway: 0.08,
    burst: 0, fall: 0, lock: 0, noise: 0.012, size: 1, op: 0, swirl: 0.6,
    r1: 1, g1: 0.75, b1: 0.35, r2: 1, g2: 0.9, b2: 0.65
  };
  var names = ['dust', 'people', 'crash', 'question', 'phone', 'network', 'rise', 'shield', 'road', 'pin', 'reports', 'merge', 'loop', 'eye', 'city', 'check'];
  Deck.shape = function (n) { var i = names.indexOf(n); if (i < 0) throw new Error('shape ' + n); return i; };

  /* deterministic random */
  var seed = 7; function R() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function gauss() { return (R() + R() + R() - 1.5) / 1.5; }
  var TAU = Math.PI * 2;

  /* --- shape builders: each returns Float32Array(N*3) --- */
  function make(parts) { // parts: [[weight, fn(out,i)], ...]
    var arr = new Float32Array(N * 3), tot = 0, i, k;
    parts.forEach(function (p) { tot += p[0]; });
    var idx = 0;
    for (k = 0; k < parts.length; k++) {
      var cnt = k === parts.length - 1 ? N - idx : Math.round(N * parts[k][0] / tot);
      for (i = 0; i < cnt; i++, idx++) { var v = parts[k][1](); arr[idx * 3] = v[0]; arr[idx * 3 + 1] = v[1]; arr[idx * 3 + 2] = v[2]; }
    }
    // shuffle so morph delays spread over all parts
    for (i = N - 1; i > 0; i--) { var j = Math.floor(R() * (i + 1)); for (k = 0; k < 3; k++) { var t = arr[i * 3 + k]; arr[i * 3 + k] = arr[j * 3 + k]; arr[j * 3 + k] = t; } }
    return arr;
  }
  function tube(fn, r) { return function () { var t = R(), p = fn(t), a = R() * TAU, rr = r * Math.sqrt(R()); return [p[0] + Math.cos(a) * rr, p[1] + Math.sin(a) * rr * 0.6, p[2] + Math.sin(a) * rr]; }; }
  function line(a, b, r) { return tube(function (t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }, r); }
  function cup(cx, sc) {
    sc = sc || 1; cx = cx || 0;
    var T = function (p) { return [cx + p[0] * sc, p[1] * sc, p[2] * sc]; };
    return [
      [5, function () { var y = -0.35 + R() * 0.7, r = 0.3 + 0.1 * (y + 0.35) / 0.7, a = R() * TAU; return T([Math.cos(a) * r, y, Math.sin(a) * r]); }],
      [1, function () { var a = R() * TAU, r = 0.3 * Math.sqrt(R()); return T([Math.cos(a) * r, -0.35, Math.sin(a) * r]); }],
      [2, function () { var a = R() * TAU, r = 0.25 + 0.4 * Math.sqrt(R()); return T([Math.cos(a) * r, -0.42 + (r - 0.25) * 0.12, Math.sin(a) * r]); }],
      [1.2, function () { var a = -Math.PI / 2 + R() * Math.PI, rr = 0.03 * Math.sqrt(R()), b = R() * TAU; var R0 = 0.15 + Math.cos(b) * rr; return T([0.38 + Math.cos(a) * R0, Math.sin(a) * R0 * 1.1, Math.sin(b) * rr]); }],
      [1.3, function () { var s = Math.floor(R() * 3), t = R(); return T([-0.15 + s * 0.15 + Math.sin(t * 9 + s) * 0.05, 0.45 + t * 0.55, gauss() * 0.02]); }]
    ];
  }
  var B = {};
  B.dust = make([[1, function () { return [gauss() * 2.2, gauss() * 1.3, gauss() * 1.2]; }]]);
  B.cup = make(cup(0, 1.25));
  B.cups2 = make(cup(-0.5, 0.85).concat(cup(0.55, 0.85)));
  B.tag = make([
    [4, function () { var x = -0.7 + R() * 1.25, y = (R() - 0.5) * 0.7; if (x > 0.3) { var lim = 0.35 * (1 - (x - 0.3) / 0.25); if (Math.abs(y) > lim) y = y * lim / 0.35; } return [x, y, (R() - 0.5) * 0.04]; }],
    [1, function () { var a = R() * TAU; return [0.33 + Math.cos(a) * 0.07, Math.sin(a) * 0.07, 0]; }],
    [1.5, tube(function (t) { return [-0.3 + t * 0.4, -0.25 + t * 0.5, 0.05]; }, 0.025)],
    [1, function () { var a = R() * TAU, s = R() < 0.5 ? -1 : 1; return [(s < 0 ? -0.28 : 0.08) + Math.cos(a) * 0.07, (s < 0 ? 0.18 : -0.18) + Math.sin(a) * 0.07, 0.05]; }]
  ]);
  function person(cx) {
    return [
      [1, function () { var u = R() * 2 - 1, a = R() * TAU, s = Math.sqrt(1 - u * u); return [cx + s * Math.cos(a) * 0.13, 0.42 + u * 0.13, s * Math.sin(a) * 0.13]; }],
      [3, function () { var y = R(), r = 0.12 + 0.18 * y, a = R() * TAU; return [cx + Math.cos(a) * r, 0.22 - y * 0.85, Math.sin(a) * r * 0.7]; }]
    ];
  }
  B.people = make(person(-0.6).concat(person(0)).concat(person(0.6)));
  B.crash = make([
    [6, function () { var x = gauss() * 1.1, h = Math.pow(R(), 3) * 0.35 * Math.max(0, 1 - Math.abs(x) / 1.6); return [x, -0.85 + h, gauss() * 0.5]; }],
    [1, function () { return [gauss() * 0.9, -0.6 + R() * 1.2, gauss() * 0.4]; }]
  ]);
  B.question = make([
    [5, tube(function (t) { var a = Math.PI * 1.05 - t * Math.PI * 1.55; return [Math.cos(a) * 0.4, 0.35 + Math.sin(a) * 0.4, 0]; }, 0.07)],
    [1.5, line([0, 0.0, 0], [0, -0.3, 0], 0.07)],
    [1, function () { var u = R() * 2 - 1, a = R() * TAU, s = Math.sqrt(1 - u * u), r = 0.09; return [s * Math.cos(a) * r, -0.6 + u * r, s * Math.sin(a) * r]; }]
  ]);
  function pan(cx) { return function () { var a = R() * TAU, r = Math.sqrt(R()) * 0.32; return [cx + Math.cos(a) * r, -0.15 + r * r * 0.9, Math.sin(a) * r]; }; }
  B.balance = make([
    [2, line([0, -0.75, 0], [0, 0.55, 0], 0.035)],
    [1.5, function () { var a = R() * TAU, r = Math.sqrt(R()) * 0.4; return [Math.cos(a) * r, -0.78, Math.sin(a) * r]; }],
    [2, line([-0.8, 0.55, 0], [0.8, 0.55, 0], 0.03)],
    [1, line([-0.8, 0.55, 0], [-0.8, -0.05, 0], 0.01)], [1, line([0.8, 0.55, 0], [0.8, -0.05, 0], 0.01)],
    [2, pan(-0.8)], [2, pan(0.8)],
    [0.6, function () { var u = R() * 2 - 1, a = R() * TAU, s = Math.sqrt(1 - u * u), r = 0.07; return [s * Math.cos(a) * r, 0.62 + u * r, s * Math.sin(a) * r]; }]
  ]);
  B.phone = make([
    [4, function () { var t = R() * 4, w = 0.55, h = 1.05, x, y; if (t < 1) { x = -w + t * 2 * w; y = h; } else if (t < 2) { x = w; y = h - (t - 1) * 2 * h; } else if (t < 3) { x = w - (t - 2) * 2 * w; y = -h; } else { x = -w; y = -h + (t - 3) * 2 * h; } return [x + gauss() * 0.01, y + gauss() * 0.01, gauss() * 0.03]; }],
    [3, function () { var c = Math.floor(R() * 3); return [-0.42 + R() * 0.84, 0.55 - c * 0.5 + (R() - 0.5) * 0.3, 0.02]; }],
    [0.6, function () { return [(R() - 0.5) * 0.3, -0.95, 0]; }]
  ]);
  var nodes = []; for (var q = 0; q < 22; q++) nodes.push([gauss() * 0.9, gauss() * 0.6, gauss() * 0.5]);
  var edges = []; nodes.forEach(function (a, i) { var best = nodes.map(function (b, j) { return [Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]), j]; }).sort(function (x, y) { return x[0] - y[0]; }); edges.push([i, best[1][1]]); edges.push([i, best[2][1]]); });
  B.network = make([
    [2, function () { var n = nodes[Math.floor(R() * nodes.length)], r = 0.05; return [n[0] + gauss() * r, n[1] + gauss() * r, n[2] + gauss() * r]; }],
    [3, function () { var e = edges[Math.floor(R() * edges.length)], a = nodes[e[0]], b = nodes[e[1]], t = R(); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }]
  ]);
  B.rise = make([
    [6, function () { var k = Math.floor(R() * 6), x = -0.85 + k * 0.32, h = 0.25 + k * 0.25; return [x + (R() - 0.5) * 0.2, -0.75 + R() * h, (R() - 0.5) * 0.2]; }],
    [1.5, tube(function (t) { return [-0.9 + t * 1.8, -0.4 + t * 1.3 + Math.sin(t * 6) * 0.04, 0.2]; }, 0.02)]
  ]);
  B.shield = make([
    [4, function () { var a = R() * TAU, u = R(); var x = Math.sin(a) * 0.6, y = 0.55 - (1 - Math.cos(a)) * 0.0; var t = R(); return [(R() - 0.5) * 1.1 * (1 - t * 0.6), 0.6 - t * 1.3 + (t > 0.95 ? 0 : 0), gauss() * 0.02]; }],
    [2, tube(function (t) { return [-0.25 + t * 0.15 + (t > 1 ? 0 : 0), -0.05 - t * 0.2, 0.08]; }, 0.03)],
    [2, tube(function (t) { return [-0.1 + t * 0.45, -0.25 + t * 0.45, 0.08]; }, 0.03)]
  ]);

  /* ===== أشكال «أثر» ===== */
  // شارع بحفرة في المنتصف: سطح مستوٍ + خطوط المسار + حافة الحفرة وقاعها
  B.road = make([
    [6, function () { var x = (R() - 0.5) * 2.6, z = (R() - 0.5) * 0.9; var d = Math.hypot(x, z * 1.6); if (d < 0.26) { x *= 1.6; } return [x, -0.35, z]; }],
    [1, function () { var k = Math.floor(R() * 6), x = -1.15 + k * 0.45 + R() * 0.22; return [x, -0.34, (R() - 0.5) * 0.03]; }],
    [1.6, function () { var a = R() * TAU, r = 0.26 + gauss() * 0.02; return [Math.cos(a) * r, -0.35 + gauss() * 0.015, Math.sin(a) * r / 1.6]; }],
    [1.2, function () { var a = R() * TAU, r = Math.sqrt(R()) * 0.24, dep = 0.16 * (1 - r * r / 0.06); return [Math.cos(a) * r, -0.35 - dep, Math.sin(a) * r / 1.6]; }]
  ]);
  // دبوس خريطة: قطرة (سطح دوراني) + حلقة على الأرض
  function pinAt(cx, cy, sc) {
    return function () {
      var t = R(), a = R() * TAU, y, r;
      if (t < 0.55) { var u = t / 0.55, th = u * Math.PI; y = Math.cos(th) * 0.32 + 0.35; r = Math.sin(th) * 0.32; if (u > 0.5) r = Math.max(r, 0); }
      else { var v = (t - 0.55) / 0.45; y = 0.35 - 0.0 - v * 0.75; r = 0.32 * (1 - v) * Math.sqrt(1 - v * 0.2); }
      return [cx + Math.cos(a) * r * sc, cy + y * sc, Math.sin(a) * r * sc];
    };
  }
  B.pin = make([
    [6, pinAt(0, 0.05, 1)],
    [1, function () { var a = R() * TAU, r = 0.15 * Math.sqrt(R()); return [Math.cos(a) * r, 0.4 + gauss() * 0.01, Math.sin(a) * r + 0.33]; }],
    [2, function () { var a = R() * TAU, r = 0.45 + gauss() * 0.03; return [Math.cos(a) * r, -0.72, Math.sin(a) * r * 0.5]; }]
  ]);
  // بلاغات متفرقة لنفس المكان: خمسة دبابيس صغيرة متناثرة
  var RP = [[-0.75, 0.25], [-0.3, -0.35], [0.15, 0.4], [0.55, -0.2], [0.85, 0.35]];
  B.reports = make(RP.map(function (c) { return [1, pinAt(c[0], c[1], 0.42)]; }));
  // ذاكرة الموقع: نواة واحدة تتجمع إليها الخيوط من البلاغات
  B.merge = make([
    [3, function () { var u = R() * 2 - 1, a = R() * TAU, s = Math.sqrt(1 - u * u), r = 0.22 * Math.cbrt(R()); return [s * Math.cos(a) * r, u * r, s * Math.sin(a) * r]; }],
    [3, function () { var c = RP[Math.floor(R() * RP.length)], t = Math.pow(R(), 0.8); return [c[0] * 1.15 * (1 - t), c[1] * 1.6 * (1 - t), gauss() * 0.02]; }],
    [1, function () { var c = RP[Math.floor(R() * RP.length)], r = 0.05; return [c[0] * 1.15 + gauss() * r, c[1] * 1.6 + gauss() * r, gauss() * r]; }]
  ]);
  // دورة العودة: حلقة (طارة) مع رأس سهم
  B.loop = make([
    [6, function () { var u = R() * TAU * 0.86, v = R() * TAU, R0 = 0.62, r = 0.06; return [(R0 + r * Math.cos(v)) * Math.cos(u), (R0 + r * Math.cos(v)) * Math.sin(u), r * Math.sin(v)]; }],
    [1.4, function () { var e = TAU * 0.86, t = R(), w = (1 - t) * 0.16 * (R() * 2 - 1); var bx = 0.62 * Math.cos(e), by = 0.62 * Math.sin(e); var tx = -Math.sin(e), ty = Math.cos(e); return [bx + tx * t * 0.28 + Math.cos(e) * w, by + ty * t * 0.28 + Math.sin(e) * w, gauss() * 0.02]; }],
    [1, function () { var a = R() * TAU, r = 0.12 * Math.sqrt(R()); return [Math.cos(a) * r, Math.sin(a) * r, 0]; }]
  ]);
  // عين المجتمع: لوزة + قزحية
  B.eye = make([
    [3, function () { var x = (R() * 2 - 1) * 0.95, h = 0.42 * (1 - x * x / 0.9025), s = R() < 0.5 ? 1 : -1; return [x, s * h + gauss() * 0.012, gauss() * 0.02]; }],
    [3, function () { var a = R() * TAU, r = 0.18 + R() * 0.12; return [Math.cos(a) * r, Math.sin(a) * r, 0.02]; }],
    [1, function () { var a = R() * TAU, r = 0.08 * Math.sqrt(R()); return [Math.cos(a) * r, Math.sin(a) * r, 0.03]; }]
  ]);
  // مدينة: كتل بارتفاعات مختلفة على شبكة شوارع
  var BL = []; for (var bi = 0; bi < 7; bi++) for (var bj = 0; bj < 4; bj++) BL.push([-1.05 + bi * 0.35, -0.5 + bj * 0.33, 0.12 + Math.pow(R(), 1.6) * 0.7]);
  B.city = make([
    [6, function () { var b = BL[Math.floor(R() * BL.length)], f = Math.floor(R() * 4), u = R() - 0.5, h = R() * b[2], w = 0.12; var x = b[0], z = b[1]; if (f === 0) x += w; else if (f === 1) x -= w; else if (f === 2) z += w; else z -= w; if (f < 2) z += u * 2 * w; else x += u * 2 * w; return [x, -0.55 + h, z]; }],
    [1.2, function () { var b = BL[Math.floor(R() * BL.length)], w = 0.12; return [b[0] + (R() - 0.5) * 2 * w, -0.55 + b[2], b[1] + (R() - 0.5) * 2 * w]; }],
    [1, function () { return [(R() - 0.5) * 2.6, -0.56, (R() - 0.5) * 1.5]; }]
  ]);
  // تحقق: دائرة + علامة صح
  B.check = make([
    [4, function () { var a = R() * TAU, r = 0.7 + gauss() * 0.025; return [Math.cos(a) * r, Math.sin(a) * r, gauss() * 0.03]; }],
    [1.3, line([-0.36, 0.0, 0], [-0.1, -0.28, 0], 0.045)],
    [2.2, line([-0.1, -0.28, 0], [0.4, 0.32, 0], 0.045)]
  ]);
  var SH = names.map(function (n) { return B[n]; });

  /* per-particle randoms */
  var dly = new Float32Array(N), rr = new Float32Array(N), ph = new Float32Array(N), dir = new Float32Array(N * 3);
  for (var i = 0; i < N; i++) { dly[i] = R(); rr[i] = R(); ph[i] = R() * TAU; var u = R() * 2 - 1, a = R() * TAU, s = Math.sqrt(1 - u * u); dir[i * 3] = s * Math.cos(a); dir[i * 3 + 1] = u; dir[i * 3 + 2] = s * Math.sin(a); }

  /* --- WebGL --- */
  var cv = document.getElementById('gl'), gl = cv.getContext('webgl', { antialias: false, premultipliedAlpha: false, alpha: true });
  if (!gl) { Deck.noGL = true; return; }
  var dpr = FULL ? Math.min(window.devicePixelRatio || 1, 1.5) : 1;
  var RES = FULL ? 0.75 : 0.6;
  cv.width = 1920 * dpr * RES; cv.height = 1080 * dpr * RES;
  var vs = 'attribute vec3 p;attribute float c;uniform float rot,tilt,sc,asp,ox,oy,sz;varying float vc;varying float vd;' +
    'void main(){float cr=cos(rot),sr=sin(rot);vec3 q=vec3(p.x*cr+p.z*sr,p.y,-p.x*sr+p.z*cr);float ct=cos(tilt),st=sin(tilt);q=vec3(q.x,q.y*ct-q.z*st,q.y*st+q.z*ct);q*=sc;float z=q.z-3.2;' +
    'gl_Position=vec4(q.x*2.4/(-z)/asp+ox,q.y*2.4/(-z)+oy,0.0,1.0);gl_PointSize=sz*(6.0/(-z));vc=c;vd=clamp((-z-2.0)/2.5,0.0,1.0);}';
  var fs = 'precision mediump float;uniform vec3 c1,c2;uniform float op;varying float vc;varying float vd;void main(){vec2 d=gl_PointCoord-0.5;float r=length(d);if(r>0.5)discard;float a=smoothstep(0.5,0.0,r);a*=a;gl_FragColor=vec4(mix(c1,c2,vc),a*op*(1.0-vd*0.55));}';
  function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(o)); return o; }
  var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr); gl.useProgram(pr);
  var pos = new Float32Array(N * 3), pb = gl.createBuffer(), cb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cb); gl.bufferData(gl.ARRAY_BUFFER, rr, gl.STATIC_DRAW);
  var lc = gl.getAttribLocation(pr, 'c'); gl.enableVertexAttribArray(lc); gl.vertexAttribPointer(lc, 1, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, pb); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW);
  var lp = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 3, gl.FLOAT, false, 0, 0);
  var U = {}; ['rot', 'tilt', 'sc', 'asp', 'ox', 'oy', 'sz', 'c1', 'c2', 'op'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

  var t0 = performance.now(), last = t0, ang = 0;
  function frame() {
    var now = performance.now(), t = (now - t0) / 1000;
    ang += Math.min(0.1, (now - last) / 1000) * S.spin; last = now;
    if (Deck.mode === 'thumb') { t = 10; ang = 1.2; }
    var aw = ((ang + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    var A = SH[S.a | 0], Bb = SH[S.b | 0], m = S.mix, sw = S.swirl, bu = S.burst, fa = S.fall, nz = S.noise;
    for (var i = 0; i < N; i++) {
      var k = (m - dly[i] * 0.45) / 0.55; k = k < 0 ? 0 : k > 1 ? 1 : k; k = k * k * (3 - 2 * k);
      var i3 = i * 3, x = A[i3] + (Bb[i3] - A[i3]) * k, y = A[i3 + 1] + (Bb[i3 + 1] - A[i3 + 1]) * k, z = A[i3 + 2] + (Bb[i3 + 2] - A[i3 + 2]) * k;
      var w = Math.sin(k * Math.PI) * sw;
      if (w) { var ca = Math.cos(w * 2.5 * (rr[i] - 0.5) * 2), sa = Math.sin(w * 2.5 * (rr[i] - 0.5) * 2), nx = x * ca - z * sa; z = x * sa + z * ca; x = nx; y += w * 0.15 * dir[i3 + 1]; }
      if (bu) { var bb = bu * (0.4 + rr[i]); x += dir[i3] * bb; y += dir[i3 + 1] * bb; z += dir[i3 + 2] * bb; }
      if (fa) { y -= fa * (0.4 + dly[i]) * 1.2; if (y < -0.95) y = -0.95 - (y + 0.95) * 0.03; x += dir[i3] * fa * 0.25; }
      var ph0 = ph[i] + t * 0.8; x += Math.sin(ph0) * nz; y += Math.cos(ph0 * 1.3) * nz; z += Math.sin(ph0 * 0.7) * nz;
      pos[i3] = x; pos[i3 + 1] = y; pos[i3 + 2] = z;
    }
    gl.viewport(0, 0, cv.width, cv.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER, pb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, pos);
    gl.uniform1f(U.rot, S.rot + aw * (1 - S.lock)); gl.uniform1f(U.tilt, S.tilt + Math.sin(t * 0.4) * S.sway);
    gl.uniform1f(U.sc, S.scale); gl.uniform1f(U.asp, 1920 / 1080); gl.uniform1f(U.ox, S.x); gl.uniform1f(U.oy, S.y);
    gl.uniform1f(U.sz, S.size * 2.6 * dpr * (RES / 0.75) * (N < 6000 ? 1.25 : 1)); gl.uniform3f(U.c1, S.r1, S.g1, S.b1); gl.uniform3f(U.c2, S.r2, S.g2, S.b2); gl.uniform1f(U.op, S.op);
    gl.drawArrays(gl.POINTS, 0, N);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
