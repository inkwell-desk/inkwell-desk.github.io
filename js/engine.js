/* Inkwell — the pen engine.
   Strokes are vectors: [x, y, pressure, t(ms), tiltX, tiltY]. Rendering is deterministic
   (seeded per stroke), so live drawing, full redraws and "watch me write" playback match exactly. */
(function () {
  'use strict';
  var IW = window.IW = window.IW || {};
  var U = IW.util, P = IW.paper;
  var E = IW.engine = {};
  var TAU = 6.283185;

  E.TOOLS = {
    fountain: { label: 'Fountain pen', hint: 'Smooth and steady, gently pressure-sensitive.' },
    italic: { label: 'Italic nib', hint: 'Broad edge held at a fixed angle — thick and thin for free.' },
    dip: { label: 'Dip pen', hint: 'Pointed flex nib. Press for swells, float for hairlines.' },
    brush: { label: 'Sumi brush', hint: 'Loads ink, runs dry, leaves character. Tilt a stylus to splay it.' },
    marker: { label: 'Marker', hint: 'Translucent and layered — overlaps get deeper.' },
    pencil: { label: 'Pencil', hint: 'Graphite that catches the paper tooth. Tilt to shade.' },
    eraser: { label: 'Stroke eraser', hint: 'Removes whole strokes. Vectors forgive everything.' },
    hand: { label: 'Hand', hint: 'Pan the page when zoomed — or scroll without leaving a mark.' }
  };
  E.ORDER = ['fountain', 'italic', 'dip', 'brush', 'marker', 'pencil', 'eraser', 'hand'];
  E.DRAW = { fountain: 1, italic: 1, dip: 1, brush: 1, marker: 1, pencil: 1 };

  E.INKS = [
    { id: 'blueblack', name: 'Iron-gall blue-black', c: '#1d2b4f' },
    { id: 'sapphire', name: 'Sapphire', c: '#1f4fb3' },
    { id: 'sumi', name: 'Sumi black', c: '#16161b' },
    { id: 'sepia', name: 'Sepia', c: '#6b4423' },
    { id: 'vermilion', name: 'Vermilion', c: '#c23b22' },
    { id: 'emerald', name: 'Emerald', c: '#12705a' },
    { id: 'aubergine', name: 'Aubergine', c: '#5a2a6e' },
    { id: 'brass', name: 'Brass gold', c: '#b8892b' },
    { id: 'white', name: 'Gel white', c: '#f7f1e3' }
  ];

  function tiltMag(tx, ty) { return Math.min(60, Math.sqrt(tx * tx + ty * ty)); }

  function width(st, p, tm) {
    var s = st.size || 6;
    switch (st.tool) {
      case 'dip': return s * (0.1 + 1.7 * Math.pow(p, 1.6));
      case 'brush': return s * (0.16 + 1.55 * Math.pow(p, 1.15));
      case 'marker': return s * 1.5;
      case 'pencil': return s * (0.45 + 0.5 * p) * (1 + tm / 40);
      case 'italic': return s * (0.95 + 0.12 * p);
      default: return s * (0.7 + 0.45 * p);
    }
  }
  E.width = width;

  /* ---------- pencil grain ---------- */
  var grains = {};
  function grain(color) {
    if (grains[color]) return grains[color];
    var n = 48, c = document.createElement('canvas');
    c.width = c.height = n;
    var x = c.getContext('2d'), img = x.createImageData(n, n), d = img.data, rgb = U.hexToRgb(color);
    var rnd = U.rng(424242);
    for (var i = 0; i < n * n; i++) {
      var r = rnd(), k = i * 4;
      d[k] = rgb[0]; d[k + 1] = rgb[1]; d[k + 2] = rgb[2];
      d[k + 3] = r > 0.3 ? Math.round((r - 0.3) / 0.7 * 255) : 0;
    }
    x.putImageData(img, 0, 0);
    grains[color] = c;
    return c;
  }

  /* ---------- render state ---------- */
  E.begin = function (st) {
    var rnd = U.rng(st.seed || 1);
    var S = { rnd: rnd, len: 0, acc: 0, n: 0, lx: null, ly: null, dx: 1, dy: 0, alpha: st.alpha || 1, br: [], pat: null };
    for (var i = 0; i < 9; i++) S.br.push(rnd());
    return S;
  };
  function pt(a) { return { x: a[0], y: a[1], p: a[2], tx: a[4] || 0, ty: a[5] || 0 }; }
  function mid(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, p: (a.p + b.p) / 2, tx: (a.tx + b.tx) / 2, ty: (a.ty + b.ty) / 2 }; }

  E.seg = function (ctx, st, S, i, absorb) {
    var pts = st.pts;
    var P0 = pt(pts[i - 1]), P1 = pt(pts[i]);
    var a = i >= 2 ? mid(pt(pts[i - 2]), P0) : P0;
    curve(ctx, st, S, a, P0, mid(P0, P1), absorb);
  };
  E.tail = function (ctx, st, S, absorb) {
    var pts = st.pts, n = pts ? pts.length : 0;
    if (!n) return;
    var last = pt(pts[n - 1]);
    if (n === 1) { emit(ctx, st, S, last.x, last.y, Math.max(last.p, 0.55), last.tx, last.ty, absorb); emit(ctx, st, S, last.x + 0.3, last.y + 0.3, last.p, last.tx, last.ty, absorb); return; }
    var a = mid(pt(pts[n - 2]), last);
    curve(ctx, st, S, a, mid(a, last), last, absorb);
  };
  E.renderStroke = function (ctx, st, absorb) {
    if (!st.pts || !st.pts.length) return;
    var S = E.begin(st);
    for (var i = 1; i < st.pts.length; i++) E.seg(ctx, st, S, i, absorb);
    E.tail(ctx, st, S, absorb);
  };

  function curve(ctx, st, S, a, c, b, absorb) {
    var L = Math.sqrt((c.x - a.x) * (c.x - a.x) + (c.y - a.y) * (c.y - a.y)) + Math.sqrt((b.x - c.x) * (b.x - c.x) + (b.y - c.y) * (b.y - c.y));
    if (L < 0.001) { if (S.lx === null) emit(ctx, st, S, a.x, a.y, a.p, a.tx, a.ty, absorb); return; }
    var wmin = Math.min(width(st, a.p, tiltMag(a.tx, a.ty)), width(st, b.p, tiltMag(b.tx, b.ty)));
    var step = st.tool === 'italic' ? 0.8 : U.clamp(wmin * 0.3, 0.2, 1.2);
    var m = Math.max(1, Math.ceil(L / step));
    for (var j = 1; j <= m; j++) {
      var t = j / m, it = 1 - t;
      emit(ctx, st, S,
        it * it * a.x + 2 * it * t * c.x + t * t * b.x,
        it * it * a.y + 2 * it * t * c.y + t * t * b.y,
        a.p + (b.p - a.p) * t, a.tx + (b.tx - a.tx) * t, a.ty + (b.ty - a.ty) * t, absorb);
    }
  }

  function emit(ctx, st, S, x, y, p, tx, ty, absorb) {
    if (S.lx === null) {
      S.lx = x; S.ly = y;
      if (st.tool === 'italic') quad(ctx, st, S, x - 0.2, y - 0.2, x, y, p, absorb);
      else dab(ctx, st, S, x, y, p, tx, ty, width(st, p, tiltMag(tx, ty)), absorb);
      return;
    }
    var dx = x - S.lx, dy = y - S.ly, d = Math.sqrt(dx * dx + dy * dy);
    if (d < 1e-4) return;
    S.len += d;
    if (st.tool === 'italic') { quad(ctx, st, S, S.lx, S.ly, x, y, p, absorb); S.lx = x; S.ly = y; return; }
    var w = width(st, p, tiltMag(tx, ty));
    var sp = Math.max(0.18, w * (st.tool === 'pencil' ? 0.3 : 0.22));
    S.acc += d;
    S.dx = dx / d; S.dy = dy / d;
    if (S.acc >= sp) { S.acc = 0; dab(ctx, st, S, x, y, p, tx, ty, w, absorb); }
    S.lx = x; S.ly = y;
  }

  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }

  function dab(ctx, st, S, x, y, p, tx, ty, w, absorb) {
    var r = w / 2, rnd = S.rnd, tool = st.tool;
    var bleed = (st.bleed == null ? 0.5 : st.bleed) * (absorb == null ? 0.5 : absorb);
    S.n++;
    if (tool === 'pencil') {
      if (!S.pat) S.pat = ctx.createPattern(grain(st.color), 'repeat') || st.color;
      ctx.fillStyle = S.pat;
      ctx.globalAlpha = S.alpha * (0.16 + 0.42 * p);
      circle(ctx, x, y, Math.max(0.3, r));
      ctx.globalAlpha = 1;
      return;
    }
    ctx.fillStyle = st.color;
    if (tool === 'brush') {
      var load = U.clamp(1 - S.len / ((st.size || 10) * 110), 0.12, 1);
      var tm = tiltMag(tx, ty), ang, ratio;
      if (tm > 4) { ang = Math.atan2(ty, tx); ratio = 1 + tm / 40; } else { ang = Math.atan2(S.dy, S.dx); ratio = 1.18; }
      var dry = load < 0.6 ? (0.6 - load) / 0.48 : 0;
      ctx.globalAlpha = S.alpha;
      if (dry <= 0.02) {
        ctx.beginPath();
        if (ctx.ellipse) ctx.ellipse(x, y, Math.max(0.2, r * ratio), Math.max(0.2, r), ang, 0, TAU);
        else ctx.arc(x, y, r, 0, TAU);
        ctx.fill();
      } else {
        var nx = -S.dy, ny = S.dx, nb = S.br.length, brr = Math.max(0.25, r / nb * 1.4);
        for (var b = 0; b < nb; b++) {
          if (rnd() < dry * (0.35 + S.br[b] * 0.9)) continue;
          var o = (b / (nb - 1) - 0.5) * 2 * r;
          circle(ctx, x + nx * o, y + ny * o, brr);
        }
      }
      if (bleed > 0.05 && rnd() < 0.5 * bleed) {
        ctx.globalAlpha = S.alpha * 0.06 * load;
        circle(ctx, x + (rnd() - 0.5) * r, y + (rnd() - 0.5) * r, r * (1.1 + bleed * 0.9 * rnd()));
      }
      ctx.globalAlpha = 1;
      return;
    }
    /* fountain, dip, marker */
    ctx.globalAlpha = S.alpha;
    var rr = r;
    if (tool === 'dip' && S.n < 5) rr = r * 1.25 + 0.3; /* ink pools where the nib lands */
    circle(ctx, x, y, Math.max(0.12, rr));
    if (tool !== 'marker' && bleed > 0.05 && rnd() < 0.42 * bleed) {
      ctx.globalAlpha = S.alpha * (0.05 + 0.07 * rnd());
      var j = r * 0.5;
      circle(ctx, x + (rnd() - 0.5) * j, y + (rnd() - 0.5) * j, r + 0.35 + bleed * (0.4 + rnd() * 1.6));
    }
    ctx.globalAlpha = 1;
  }

  /* broad-edge nib: sweep a line segment held at a fixed angle */
  function quad(ctx, st, S, x0, y0, x1, y1, p, absorb) {
    var w = width(st, p, 0) / 2, a = (st.nib == null ? 40 : st.nib) * Math.PI / 180;
    var nx = Math.cos(a) * w, ny = -Math.sin(a) * w;
    ctx.globalAlpha = S.alpha;
    ctx.fillStyle = st.color; ctx.strokeStyle = st.color; ctx.lineWidth = 0.45; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x0 + nx, y0 + ny); ctx.lineTo(x1 + nx, y1 + ny); ctx.lineTo(x1 - nx, y1 - ny); ctx.lineTo(x0 - nx, y0 - ny);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    var bleed = (st.bleed == null ? 0.5 : st.bleed) * (absorb == null ? 0.5 : absorb);
    if (bleed > 0.05 && S.rnd() < 0.22 * bleed) {
      var f = S.rnd() * 2 - 1;
      ctx.globalAlpha = S.alpha * 0.07;
      circle(ctx, x1 + nx * f, y1 + ny * f, 0.6 + bleed * 1.6 * S.rnd());
    }
    ctx.globalAlpha = 1;
    S.n++;
  }

  E.bbox = function (st) {
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, pts = st.pts || [];
    for (var i = 0; i < pts.length; i++) {
      var q = pts[i];
      if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0];
      if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1];
    }
    var m = (st.size || 6) * 2 + 6;
    return [x0 - m, y0 - m, x1 + m, y1 + m];
  };

  /* translucent marker: drawn opaque on a scratch layer, then laid down once with multiply */
  E.compositeMarker = function (dst, src, st, k) {
    var b = E.bbox(st), cw = src.canvas.width, ch = src.canvas.height;
    var x0 = U.clamp(Math.floor(b[0] * k), 0, cw), y0 = U.clamp(Math.floor(b[1] * k), 0, ch);
    var x1 = U.clamp(Math.ceil(b[2] * k), 0, cw), y1 = U.clamp(Math.ceil(b[3] * k), 0, ch);
    var w = x1 - x0, h = y1 - y0;
    dst.save(); dst.setTransform(1, 0, 0, 1, 0, 0);
    if (w > 0 && h > 0) {
      dst.globalAlpha = 0.55 * (st.alpha || 1);
      dst.globalCompositeOperation = 'multiply';
      dst.drawImage(src.canvas, x0, y0, w, h, x0, y0, w, h);
    }
    dst.restore();
    src.save(); src.setTransform(1, 0, 0, 1, 0, 0); src.clearRect(0, 0, cw, ch); src.restore();
  };

  E.renderItems = function (ctx, items, k, absorb, tmp) {
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.tool === 'stamp') { if (IW.stamps) IW.stamps.draw(ctx, it, k); continue; }
      if (it.tool === 'marker') {
        if (!tmp) {
          var tc = document.createElement('canvas');
          tc.width = ctx.canvas.width; tc.height = ctx.canvas.height;
          tmp = tc.getContext('2d');
        }
        tmp.setTransform(k, 0, 0, k, 0, 0);
        E.renderStroke(tmp, it, absorb);
        E.compositeMarker(ctx, tmp, it, k);
        continue;
      }
      E.renderStroke(ctx, it, absorb);
    }
  };

  /* Render a whole document onto any canvas (exports, thumbnails) */
  E.renderDocTo = function (cv, doc, withPaper, lite) {
    var W = doc.W || 1000, H = doc.H || 1300, ctx = cv.getContext('2d'), k = cv.width / W;
    if (withPaper) P.draw(ctx, cv.width, cv.height, W, H, doc.paper, doc.ruling, { seed: doc.seed, lite: lite, header: doc.header, subheader: doc.subheader });
    else { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); }
    ctx.setTransform(k, 0, 0, k, 0, 0);
    E.renderItems(ctx, doc.strokes || [], k, P.get(doc.paper).absorb, null);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return cv;
  };

  function hitItem(it, x, y, r) {
    if (it.tool === 'stamp') {
      var rr = 60 * (it.s || 1) * 0.8;
      return (it.x - x) * (it.x - x) + (it.y - y) * (it.y - y) < rr * rr;
    }
    var b = E.bbox(it);
    if (x < b[0] - r || x > b[2] + r || y < b[1] - r || y > b[3] + r) return false;
    var lim = r + (it.size || 6) * 0.7, lim2 = lim * lim, pts = it.pts;
    for (var i = 0; i < pts.length; i++) {
      var dx = pts[i][0] - x, dy = pts[i][1] - y;
      if (dx * dx + dy * dy < lim2) return true;
    }
    return false;
  }

  /* ============ InkCanvas: a stack of canvases that you can write on ============ */
  function InkCanvas(host, o) {
    var self = this;
    this.host = host; this.o = o || {};
    this.W = this.o.W || 1000; this.H = this.o.H || 1300;
    this.doc = null; this.undoStack = []; this.redoStack = [];
    this.cur = null; this.readOnly = false; this.playing = null;
    this.cw = 0; this.ch = 0; this.k = 1;
    this.cv = {};
    ['paper', 'guide', 'ink', 'live'].forEach(function (n) {
      var c = document.createElement('canvas');
      c.className = 'layer layer-' + n;
      c.setAttribute('aria-hidden', 'true');
      host.appendChild(c);
      self.cv[n] = c;
      self[n] = c.getContext('2d');
    });
    this.nib = document.createElement('div');
    this.nib.className = 'nib-cursor';
    this.nib.hidden = true;
    this.nib.setAttribute('aria-hidden', 'true');
    host.appendChild(this.nib);
    var L = this.cv.live;
    L.addEventListener('pointerdown', function (e) { self.down(e); });
    L.addEventListener('pointermove', function (e) { self.move(e); });
    L.addEventListener('pointerup', function (e) { self.up(e); });
    L.addEventListener('pointercancel', function (e) { self.up(e); });
    L.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    L.addEventListener('touchstart', function (e) { if (e.cancelable) e.preventDefault(); }, { passive: false });
    if (window.ResizeObserver) {
      this.ro = new ResizeObserver(function () { self.resize(); });
      this.ro.observe(host);
    }
    window.addEventListener('resize', U.debounce(function () { self.resize(); }, 120));
    this.resize();
  }
  E.InkCanvas = InkCanvas;
  var IC = InkCanvas.prototype;

  IC.absorb = function () { return P.get(this.doc ? this.doc.paper : 'cotton').absorb; };

  IC.resize = function () {
    var r = this.host.getBoundingClientRect();
    if (r.width < 10) return;
    this.host.style.height = (r.width * this.H / this.W) + 'px';
    var maxW = U.lowPower ? 1500 : 2400;
    var cw = Math.min(maxW, Math.round(r.width * U.dpr())), ch = Math.round(cw * this.H / this.W);
    if (cw === this.cw && ch === this.ch) return;
    this.cw = cw; this.ch = ch; this.k = cw / this.W;
    for (var n in this.cv) { this.cv[n].width = cw; this.cv[n].height = ch; }
    if (!this.tmpC) this.tmpC = document.createElement('canvas');
    this.tmpC.width = cw; this.tmpC.height = ch;
    this.tmp = this.tmpC.getContext('2d');
    this.drawPaper();
    this.redraw();
    if (this.o.onResize) this.o.onResize(this);
  };

  IC.setDoc = function (doc) {
    this.stopPlay(true);
    this.doc = doc; this.undoStack = []; this.redoStack = []; this.cur = null;
    this.drawPaper(); this.redraw();
  };
  IC.drawPaper = function () {
    if (!this.doc || !this.cw) return;
    P.draw(this.paper, this.cw, this.ch, this.W, this.H, this.doc.paper, this.doc.ruling, { seed: this.doc.seed, header: this.doc.header, subheader: this.doc.subheader });
  };
  IC.clearLayer = function (name) {
    var c = this[name];
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, this.cw, this.ch);
    c.setTransform(this.k, 0, 0, this.k, 0, 0);
  };
  IC.redraw = function () {
    if (!this.cw) return;
    this.clearLayer('ink'); this.clearLayer('live');
    if (this.tmp) this.tmp.setTransform(this.k, 0, 0, this.k, 0, 0);
    if (this.doc) E.renderItems(this.ink, this.doc.strokes, this.k, this.absorb(), this.tmp);
  };

  IC.pos = function (e) {
    var r = this.rect || this.cv.live.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * this.W, y: (e.clientY - r.top) / r.height * this.H };
  };
  IC.capture = function (e) { try { this.cv.live.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } };

  IC.down = function (e) {
    if (!this.doc) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (this.cur || this.erasing || this.panning) return;
    if (this.playing) this.stopPlay();
    var pen = this.o.getPen ? this.o.getPen() : { tool: 'fountain', color: '#1d2b4f', size: 6 };
    if (pen.penOnly && e.pointerType === 'touch' && pen.tool !== 'hand') {
      if (this.o.onPalm) this.o.onPalm();
      return;
    }
    if (e.cancelable) e.preventDefault();
    this.rect = this.cv.live.getBoundingClientRect();
    var pos = this.pos(e);
    if (pen.tool === 'hand') {
      this.panning = { id: e.pointerId, x: e.clientX, y: e.clientY };
      this.capture(e); return;
    }
    if (this.o.onTap && this.o.onTap(pos.x, pos.y, e)) return;
    if (this.readOnly) { if (this.o.onBlocked) this.o.onBlocked(); return; }
    if (this.o.beforeStroke && this.o.beforeStroke() === false) return;
    if (pen.tool === 'eraser') {
      this.erasing = { id: e.pointerId, items: [] };
      this.capture(e); this.eraseAt(pos); return;
    }
    if (!E.DRAW[pen.tool]) return;
    var st = { tool: pen.tool, color: pen.color, size: pen.size, seed: U.seed(), at: Date.now(), pts: [] };
    if (pen.tool === 'italic') st.nib = pen.nib == null ? 40 : pen.nib;
    if (pen.tool !== 'marker' && pen.tool !== 'pencil') st.bleed = pen.bleed == null ? 0.5 : pen.bleed;
    this.cur = st; this.S = E.begin(st); this.pid = e.pointerId;
    this.t0 = e.timeStamp || performance.now(); this.sp = 0.55;
    this.target = st.tool === 'marker' ? this.live : this.ink;
    this.cv.live.classList.toggle('marker-live', st.tool === 'marker');
    this.push(e, pos, pen, true);
    this.capture(e);
    if (IW.audio) IW.audio.scratchStart(st.tool);
    if (this.o.onStart) this.o.onStart();
  };

  IC.push = function (ev, pos, pen, first) {
    var smooth = U.clamp(pen.smooth || 0, 0, 0.92);
    if (first) { this.sx = pos.x; this.sy = pos.y; }
    else { this.sx += (pos.x - this.sx) * (1 - smooth); this.sy += (pos.y - this.sy) * (1 - smooth); }
    var x = this.sx, y = this.sy;
    var t = (ev.timeStamp || performance.now()) - this.t0;
    if (!(t >= 0)) t = 0;
    var pts = this.cur.pts, last = pts[pts.length - 1];
    var d = last ? Math.sqrt((x - last[0]) * (x - last[0]) + (y - last[1]) * (y - last[1])) : 0;
    if (!first && d < 0.4) return;
    if (last && t < last[3]) t = last[3];
    var upp = this.rect && this.rect.width ? this.W / this.rect.width : 1.4;
    var dt = Math.max(1, t - (last ? last[3] : 0)), v = d / dt / upp, p;
    var mode = pen.pressure || 'auto';
    if (mode === 'fixed') p = 0.6;
    else if (ev.pointerType === 'pen' && mode !== 'velocity') p = ev.pressure > 0 ? ev.pressure : 0.5;
    else {
      var target = U.clamp(1 - v / 1.6, 0.08, 1);
      if (!first) this.sp += (target - this.sp) * 0.22;
      p = this.sp;
    }
    var tx = ev.tiltX || 0, ty = ev.tiltY || 0;
    if (!tx && !ty && ev.pointerType === 'pen' && typeof ev.altitudeAngle === 'number' && ev.altitudeAngle < 1.5) {
      var tm = 90 - ev.altitudeAngle * 180 / Math.PI, az = ev.azimuthAngle || 0;
      tx = Math.cos(az) * tm; ty = Math.sin(az) * tm;
    }
    pts.push([U.r1(x), U.r1(y), U.r2(U.clamp(p, 0, 1)), Math.round(t), Math.round(tx), Math.round(ty)]);
    var n = pts.length;
    if (n >= 2) E.seg(this.target, this.cur, this.S, n - 1, this.absorb());
    if (this.o.onPointer) this.o.onPointer(p, tx, ty, ev.pointerType);
    if (IW.audio) IW.audio.scratchMove(v);
  };

  IC.move = function (e) {
    if (this.panning && e.pointerId === this.panning.id) {
      var dx = e.clientX - this.panning.x, dy = e.clientY - this.panning.y;
      this.panning.x = e.clientX; this.panning.y = e.clientY;
      var sc = this.o.scroller;
      if (sc && (sc.scrollHeight > sc.clientHeight + 2 || sc.scrollWidth > sc.clientWidth + 2)) { sc.scrollLeft -= dx; sc.scrollTop -= dy; }
      else window.scrollBy(0, -dy);
      this.rect = null;
      return;
    }
    if (this.erasing && e.pointerId === this.erasing.id) { this.eraseAt(this.pos(e)); return; }
    if (!this.cur || e.pointerId !== this.pid) return;
    if (e.cancelable) e.preventDefault();
    var pen = this.o.getPen();
    var list = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
    if (!list || !list.length) list = [e];
    for (var i = 0; i < list.length; i++) this.push(list[i], this.pos(list[i]), pen, false);
  };

  IC.up = function (e) {
    if (this.panning && e.pointerId === this.panning.id) { this.panning = null; return; }
    if (this.erasing && e.pointerId === this.erasing.id) {
      var er = this.erasing; this.erasing = null;
      if (er.items.length) { this.undoStack.push({ op: 'erase', items: er.items }); this.redoStack = []; this.changed(); }
      return;
    }
    if (!this.cur || e.pointerId !== this.pid) return;
    var st = this.cur; this.cur = null; this.rect = null;
    E.tail(this.target, st, this.S, this.absorb());
    if (st.tool === 'marker') { E.compositeMarker(this.ink, this.live, st, this.k); this.cv.live.classList.remove('marker-live'); }
    this.doc.strokes.push(st);
    this.undoStack.push({ op: 'add', item: st }); this.redoStack = [];
    if (IW.audio) IW.audio.scratchEnd();
    this.changed(st);
  };

  IC.changed = function (st) { if (this.o.onChange) this.o.onChange(this.doc, st); };

  IC.eraseAt = function (pos) {
    var items = this.doc.strokes, hit = false;
    for (var i = items.length - 1; i >= 0; i--) {
      if (hitItem(items[i], pos.x, pos.y, 9)) {
        this.erasing.items.push({ i: i, item: items[i] });
        items.splice(i, 1); hit = true;
      }
    }
    if (hit) { this.redraw(); if (IW.audio) IW.audio.rustle(); }
  };

  IC.undo = function () {
    var op = this.undoStack.pop(), s = this.doc && this.doc.strokes;
    if (!op || !s) return false;
    var j;
    if (op.op === 'add') { var i = s.lastIndexOf(op.item); if (i >= 0) s.splice(i, 1); }
    else if (op.op === 'erase') { for (j = op.items.length - 1; j >= 0; j--) s.splice(op.items[j].i, 0, op.items[j].item); }
    else if (op.op === 'clear') { this.doc.strokes = op.items.slice(); }
    this.redoStack.push(op); this.redraw(); this.changed(); return true;
  };
  IC.redo = function () {
    var op = this.redoStack.pop(), s = this.doc && this.doc.strokes;
    if (!op || !s) return false;
    var j;
    if (op.op === 'add') s.push(op.item);
    else if (op.op === 'erase') { for (j = 0; j < op.items.length; j++) s.splice(op.items[j].i, 1); }
    else if (op.op === 'clear') this.doc.strokes = [];
    this.undoStack.push(op); this.redraw(); this.changed(); return true;
  };
  IC.clear = function () {
    if (!this.doc || !this.doc.strokes.length) return false;
    this.undoStack.push({ op: 'clear', items: this.doc.strokes.slice() }); this.redoStack = [];
    this.doc.strokes = []; this.redraw(); this.changed(); return true;
  };
  IC.addItem = function (it) {
    this.doc.strokes.push(it);
    if (it.tool === 'stamp') IW.stamps.draw(this.ink, it, this.k);
    else E.renderStroke(this.ink, it, this.absorb());
    this.undoStack.push({ op: 'add', item: it }); this.redoStack = [];
    this.changed(it);
  };

  /* ---------- "watch me write" playback ---------- */
  IC.play = function (o) {
    o = o || {};
    this.stopPlay(true);
    var items = o.items || (this.doc && this.doc.strokes) || [];
    if (!items.length) return false;
    var tl = [], T = 0, prevEnd = null;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var dur = it.tool === 'stamp' ? 260 : Math.max(20, (it.pts && it.pts.length) ? it.pts[it.pts.length - 1][3] : 0);
      var gap = prevEnd === null ? 160 : (it.at && prevEnd ? U.clamp(it.at - prevEnd, 90, 650) : 220);
      var start = T + gap;
      tl.push({ it: it, start: start, dur: dur });
      T = start + dur;
      prevEnd = it.at ? it.at + dur : null;
    }
    if (!o.keep) { this.clearLayer('ink'); }
    this.clearLayer('live');
    var self = this;
    var PL = this.playing = { tl: tl, T: T, idx: 0, S: null, done: 0, speed: o.speed || 2, t0: performance.now(), o: o, target: null };
    this.nib.hidden = false;
    this.host.classList.add('is-playing');
    function frame() {
      if (self.playing !== PL) return;
      self.stepPlay(PL);
      if (PL.idx >= tl.length) { self.finishPlay(PL, true); return; }
      PL.raf = requestAnimationFrame(frame);
    }
    PL.raf = requestAnimationFrame(frame);
    return true;
  };
  IC.stepPlay = function (PL) {
    var now = (performance.now() - PL.t0) * PL.speed, ab = this.absorb(), lastPt = null;
    while (PL.idx < PL.tl.length) {
      var e = PL.tl[PL.idx];
      if (now < e.start) break;
      var it = e.it;
      if (it.tool === 'stamp') {
        IW.stamps.draw(this.ink, it, this.k);
        if (IW.audio) { if (it.kind === 'seal') IW.audio.squish(); else IW.audio.thunk(); }
        lastPt = [it.x, it.y]; PL.idx++; continue;
      }
      var pts = it.pts || [];
      if (!pts.length) { PL.idx++; continue; }
      if (!PL.S) {
        PL.S = E.begin(it); PL.done = 0;
        PL.target = it.tool === 'marker' ? this.live : this.ink;
        this.cv.live.classList.toggle('marker-live', it.tool === 'marker');
      }
      var local = now - e.start;
      while (PL.done < pts.length && pts[PL.done][3] <= local) {
        if (PL.done >= 1) E.seg(PL.target, it, PL.S, PL.done, ab);
        PL.done++;
      }
      if (PL.done > 0) lastPt = pts[PL.done - 1];
      if (PL.done >= pts.length) {
        E.tail(PL.target, it, PL.S, ab);
        if (it.tool === 'marker') { E.compositeMarker(this.ink, this.live, it, this.k); this.cv.live.classList.remove('marker-live'); }
        PL.S = null; PL.idx++; continue;
      }
      break;
    }
    if (lastPt) this.moveNib(lastPt[0], lastPt[1]);
    if (PL.o.onProgress) PL.o.onProgress(PL.T ? Math.min(1, now / PL.T) : 1);
  };
  IC.moveNib = function (x, y) {
    this.nib.style.left = (x / this.W * 100) + '%';
    this.nib.style.top = (y / this.H * 100) + '%';
  };
  IC.finishPlay = function (PL, complete) {
    if (PL.raf) cancelAnimationFrame(PL.raf);
    if (this.playing === PL) this.playing = null;
    this.nib.hidden = true;
    this.host.classList.remove('is-playing');
    this.cv.live.classList.remove('marker-live');
    if (!PL.o.items) this.redraw();
    if (PL.o.onEnd) PL.o.onEnd(!!complete);
  };
  IC.stopPlay = function (silent) {
    var PL = this.playing;
    if (!PL) return;
    this.clearLayer('live');
    if (silent) PL.o.onEnd = PL.o.onEnd || null;
    this.finishPlay(PL, false);
  };
})();
