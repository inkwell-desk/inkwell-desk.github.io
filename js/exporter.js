/* Inkwell — exports (PNG, SVG, .inkwell) and safe import */
(function () {
  'use strict';
  var IW = window.IW = window.IW || {};
  var U = IW.util, P = IW.paper, E = IW.engine;
  var X = IW.exporter = {};

  X.png = function (doc) {
    var W = doc.W || 1000, H = doc.H || 1300;
    var cw = Math.min(U.lowPower ? 1600 : 2400, W * 2), cv = document.createElement('canvas');
    cv.width = cw; cv.height = Math.round(cw * H / W);
    E.renderDocTo(cv, doc, true, false);
    return new Promise(function (resolve) {
      if (cv.toBlob) cv.toBlob(function (b) { resolve(b); }, 'image/png');
      else {
        var bin = atob(cv.toDataURL('image/png').split(',')[1]), arr = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        resolve(new Blob([arr], { type: 'image/png' }));
      }
    });
  };
  X.downloadPNG = function (doc) {
    return X.png(doc).then(function (b) {
      if (!b) throw new Error('png');
      U.download(b, U.slug(doc.title) + '.png');
    });
  };

  /* ---------- SVG: strokes become filled outline paths ---------- */
  function samples(st) {
    var pts = st.pts, out = [];
    if (!pts || !pts.length) return out;
    function P0(i) { return { x: pts[i][0], y: pts[i][1], p: pts[i][2] }; }
    function mid(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, p: (a.p + b.p) / 2 }; }
    function add(a, c, b) {
      var L = Math.hypot(c.x - a.x, c.y - a.y) + Math.hypot(b.x - c.x, b.y - c.y);
      var m = Math.max(1, Math.ceil(L / 1.6));
      for (var j = 1; j <= m; j++) {
        var t = j / m, it = 1 - t;
        out.push({ x: it * it * a.x + 2 * it * t * c.x + t * t * b.x, y: it * it * a.y + 2 * it * t * c.y + t * t * b.y, p: a.p + (b.p - a.p) * t });
      }
    }
    out.push(P0(0));
    for (var i = 1; i < pts.length; i++) {
      var a = i >= 2 ? mid(P0(i - 2), P0(i - 1)) : P0(i - 1);
      add(a, P0(i - 1), mid(P0(i - 1), P0(i)));
    }
    if (pts.length > 1) { var l = P0(pts.length - 1), s = mid(P0(pts.length - 2), l); add(s, mid(s, l), l); }
    return out;
  }
  function f(v) { return Math.round(v * 10) / 10; }

  function strokeSVG(st) {
    var sm = samples(st);
    if (!sm.length) return '';
    var col = st.color, i;
    if (st.tool === 'marker' || st.tool === 'pencil') {
      var w = st.tool === 'marker' ? st.size * 1.5 : st.size * 0.75;
      var d = 'M' + sm.map(function (q) { return f(q.x) + ' ' + f(q.y); }).join(' L');
      if (sm.length === 1) d += ' l0.1 0.1';
      return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + f(w) + '" stroke-linecap="round" stroke-linejoin="round" opacity="' + (st.tool === 'marker' ? 0.55 : 0.6) + '"' + (st.tool === 'marker' ? ' style="mix-blend-mode:multiply"' : ' filter="url(#pencil)"') + '/>';
    }
    var L = [], R = [], nib = st.tool === 'italic';
    var na = (st.nib == null ? 40 : st.nib) * Math.PI / 180;
    for (i = 0; i < sm.length; i++) {
      var q = sm[i], hw = E.width(st, q.p, 0) / 2, nx, ny;
      if (nib) { nx = Math.cos(na) * hw; ny = -Math.sin(na) * hw; }
      else {
        var a = sm[Math.max(0, i - 1)], b = sm[Math.min(sm.length - 1, i + 1)];
        var dx = b.x - a.x, dy = b.y - a.y, dl = Math.hypot(dx, dy) || 1;
        nx = -dy / dl * hw; ny = dx / dl * hw;
      }
      L.push(f(q.x + nx) + ' ' + f(q.y + ny));
      R.push(f(q.x - nx) + ' ' + f(q.y - ny));
    }
    var out = '<path d="M' + L.join(' L') + ' L' + R.reverse().join(' L') + ' Z" fill="' + col + '"/>';
    if (!nib) {
      var s0 = sm[0], s1 = sm[sm.length - 1];
      out += '<circle cx="' + f(s0.x) + '" cy="' + f(s0.y) + '" r="' + f(E.width(st, s0.p, 0) / 2) + '" fill="' + col + '"/>';
      out += '<circle cx="' + f(s1.x) + '" cy="' + f(s1.y) + '" r="' + f(E.width(st, s1.p, 0) / 2) + '" fill="' + col + '"/>';
    }
    return out;
  }

  X.svg = function (doc) {
    var W = doc.W || 1000, H = doc.H || 1300, T = P.get(doc.paper);
    var parts = ['<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '">',
      '<title>' + U.esc(doc.title || 'Inkwell page') + '</title>',
      '<defs><filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0.25  0 0 0 0 0.2  0 0 0 0 0.12  0 0 0 .5 0"/></filter>',
      '<filter id="pencil"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" result="n"/><feComposite in="SourceGraphic" in2="n" operator="in"/></filter></defs>',
      '<rect width="100%" height="100%" fill="' + T.base + '"/>',
      '<rect width="100%" height="100%" filter="url(#grain)" opacity=".35"/>'];
    if (doc.header) parts.push('<text x="108" y="118" font-family="Palatino Linotype, Palatino, Georgia, serif" font-style="italic" font-size="34" fill="rgba(40,45,80,.75)">' + U.esc(doc.header) + '</text>');
    var items = doc.strokes || [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.tool === 'stamp') {
        var r = IW.stamps.raster(it, 2);
        parts.push('<image x="' + f(r.x) + '" y="' + f(r.y) + '" width="' + f(r.w) + '" height="' + f(r.w) + '" href="' + r.url + '" xlink:href="' + r.url + '"/>');
      } else parts.push(strokeSVG(it));
    }
    parts.push('</svg>');
    return parts.join('\n');
  };
  X.downloadSVG = function (doc) {
    U.download(new Blob([X.svg(doc)], { type: 'image/svg+xml' }), U.slug(doc.title) + '.svg');
  };

  /* ---------- .inkwell JSON ---------- */
  X.pack = function (docs, extra) {
    return JSON.stringify({ format: 'inkwell', version: 1, app: 'Inkwell', exported: new Date().toISOString(), docs: docs, extra: extra || {} });
  };
  X.downloadInkwell = function (docs, name, extra) {
    U.download(new Blob([X.pack(docs, extra)], { type: 'application/json' }), U.slug(name) + '.inkwell');
  };

  function num(v, d) { v = +v; return isFinite(v) ? v : d; }
  function color(c, d) { return typeof c === 'string' && /^#[0-9a-f]{3,8}$/i.test(c) ? c : d; }
  var RULINGS = { none: 1, lines: 1, italic: 1, copperplate: 1, grid: 1, dots: 1, journal: 1 };

  X.sanitize = function (d) {
    if (!d || typeof d !== 'object' || !Array.isArray(d.strokes)) return null;
    var o = {
      id: typeof d.id === 'string' && d.id ? d.id.slice(0, 80) : U.uid('sheet'),
      type: d.type === 'journal' ? 'journal' : 'sheet',
      title: String(d.title || 'Imported page').slice(0, 80),
      paper: P.TYPES[d.paper] ? d.paper : 'cotton',
      ruling: RULINGS[d.ruling] ? d.ruling : 'none',
      W: U.clamp(num(d.W, 1000), 200, 4000), H: U.clamp(num(d.H, 1300), 200, 5000),
      seed: (num(d.seed, 7) >>> 0) || 7,
      created: num(d.created, Date.now()), updated: num(d.updated, Date.now()),
      strokes: []
    };
    if (o.type === 'journal') {
      o.date = /^\d{4}-\d{2}-\d{2}$/.test(d.date) ? d.date : null;
      if (!o.date) o.type = 'sheet';
      o.header = String(d.header || '').slice(0, 80);
      o.subheader = String(d.subheader || '').slice(0, 160);
      o.prompt = num(d.prompt, 0) | 0;
      o.note = String(d.note || '').slice(0, 8000);
      o.sealed = !!d.sealed;
    }
    var n = 0;
    for (var i = 0; i < d.strokes.length && n < 20000; i++) {
      var s = d.strokes[i];
      if (!s || typeof s !== 'object') continue;
      if (s.tool === 'stamp') {
        if (!IW.stamps.KINDS[s.kind]) continue;
        o.strokes.push({ tool: 'stamp', kind: s.kind, x: num(s.x, 0), y: num(s.y, 0), s: U.clamp(num(s.s, 1), 0.2, 4), rot: num(s.rot, 0),
          color: color(s.color, '#9e1b22'), text: String(s.text || '').slice(0, 24), seed: (num(s.seed, 5) >>> 0) || 5, at: num(s.at, 0), broken: !!s.broken });
        n++; continue;
      }
      if (!E.DRAW[s.tool] || !Array.isArray(s.pts)) continue;
      var pts = [];
      for (var j = 0; j < s.pts.length && j < 20000; j++) {
        var q = s.pts[j];
        if (!Array.isArray(q) || q.length < 2) continue;
        var x = num(q[0], NaN), y = num(q[1], NaN);
        if (!isFinite(x) || !isFinite(y)) continue;
        pts.push([x, y, U.clamp(num(q[2], 0.5), 0, 1), Math.max(0, num(q[3], j * 8)), num(q[4], 0), num(q[5], 0)]);
      }
      if (!pts.length) continue;
      var st = { tool: s.tool, color: color(s.color, '#1d2b4f'), size: U.clamp(num(s.size, 6), 0.5, 80), seed: (num(s.seed, 1) >>> 0) || 1, at: num(s.at, 0), pts: pts };
      if (s.tool === 'italic') st.nib = U.clamp(num(s.nib, 40), -90, 90);
      if (s.bleed != null) st.bleed = U.clamp(num(s.bleed, 0.5), 0, 1);
      o.strokes.push(st); n++;
    }
    return o;
  };

  X.parse = function (text) {
    var data = JSON.parse(text);
    if (!data || data.format !== 'inkwell' || !Array.isArray(data.docs)) throw new Error('Not an .inkwell file');
    var docs = [];
    data.docs.forEach(function (d) { var s = X.sanitize(d); if (s) docs.push(s); });
    return { docs: docs, extra: data.extra || {} };
  };
})();
