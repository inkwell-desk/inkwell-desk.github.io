/* Inkwell — rubber stamps and wax seals (drawn procedurally, stored as vectors) */
(function () {
  'use strict';
  var IW = window.IW = window.IW || {};
  var U = IW.util;
  var S = IW.stamps = {};
  var TAU = 6.283185;
  var MONO = '"Courier New", Courier, "Liberation Mono", monospace';
  var SERIF = '"Bodoni MT", Didot, "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';

  S.KINDS = {
    seal: { label: 'Wax seal', color: '#9e1b22' },
    approved: { label: 'Well written', color: '#c23b22' },
    postmark: { label: 'Postmark (today)', color: '#1d2b4f' },
    star: { label: 'Gold star', color: '#b8892b' },
    moon: { label: 'Moon & stars', color: '#1f4fb3' },
    leaf: { label: 'Pressed leaf', color: '#12705a' },
    draft: { label: 'Draft No. 1', color: '#5a2a6e' },
    feelings: { label: 'Filed under: feelings', color: '#c23b22' },
    paw: { label: 'Approved by the Cat', color: '#16161b', secret: true }
  };
  S.SEAL_COLORS = [
    { id: 'crimson', name: 'Crimson', c: '#9e1b22' },
    { id: 'navy', name: 'Midnight navy', c: '#1e2f63' },
    { id: 'brass', name: 'Brass gold', c: '#b8862b' },
    { id: 'forest', name: 'Forest', c: '#25513a' },
    { id: 'obsidian', name: 'Obsidian', c: '#26262b' },
    { id: 'rose', name: 'Dusty rose', c: '#b45a72' }
  ];

  var cache = {}, cacheKeys = [];
  function remember(key, c) {
    cache[key] = c; cacheKeys.push(key);
    if (cacheKeys.length > 60) delete cache[cacheKeys.shift()];
  }

  /* ---------- rubber stamp designs, drawn in a 140×140 box centred on 0,0 ---------- */
  function txt(x, s, font, y, maxW) {
    x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(s, 0, y, maxW || 130);
  }
  function rrect(x, a, b, w, h, r) {
    x.beginPath();
    x.moveTo(a + r, b); x.lineTo(a + w - r, b); x.quadraticCurveTo(a + w, b, a + w, b + r);
    x.lineTo(a + w, b + h - r); x.quadraticCurveTo(a + w, b + h, a + w - r, b + h);
    x.lineTo(a + r, b + h); x.quadraticCurveTo(a, b + h, a, b + h - r);
    x.lineTo(a, b + r); x.quadraticCurveTo(a, b, a + r, b); x.closePath();
  }
  function starPath(x, R, r) {
    x.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R;
      if (i) x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else x.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    x.closePath();
  }
  var DESIGNS = {
    approved: function (x) {
      x.lineWidth = 5; rrect(x, -64, -36, 128, 72, 8); x.stroke();
      x.lineWidth = 1.6; rrect(x, -56, -28, 112, 56, 5); x.stroke();
      txt(x, 'WELL', 'bold 26px ' + MONO, -9);
      txt(x, 'WRITTEN', 'bold 19px ' + MONO, 14);
    },
    draft: function (x) {
      x.lineWidth = 4; x.strokeRect(-62, -30, 124, 60);
      txt(x, 'DRAFT', 'bold 32px ' + MONO, -4);
      txt(x, 'No. 1 · PLEASE IGNORE', 'bold 8.5px ' + MONO, 20);
    },
    feelings: function (x) {
      x.lineWidth = 3.5; rrect(x, -66, -30, 132, 60, 14); x.stroke();
      txt(x, 'FILED UNDER', 'bold 11px ' + MONO, -13);
      txt(x, 'FEELINGS', 'bold 24px ' + MONO, 9);
    },
    postmark: function (x, it) {
      x.save(); x.translate(-18, 0);
      x.lineWidth = 4; x.beginPath(); x.arc(0, 0, 47, 0, TAU); x.stroke();
      x.lineWidth = 1.4; x.beginPath(); x.arc(0, 0, 38, 0, TAU); x.stroke();
      var label = 'INKWELL POST · DESK OFFICE ·';
      x.font = 'bold 8px ' + MONO; x.textAlign = 'center'; x.textBaseline = 'middle';
      for (var i = 0; i < label.length; i++) {
        var a = -Math.PI * 0.95 + i * (Math.PI * 1.9 / label.length);
        x.save(); x.rotate(a + Math.PI / 2); x.fillText(label[i], 0, -42.5); x.restore();
      }
      txt(x, it.text || 'TODAY', 'bold 12px ' + MONO, 0, 70);
      x.restore();
      x.lineWidth = 2.6;
      for (var w = 0; w < 5; w++) {
        x.beginPath();
        for (var px = 28; px <= 68; px += 2) {
          var py = -26 + w * 13 + Math.sin(px * 0.25) * 3.2;
          if (px === 28) x.moveTo(px, py); else x.lineTo(px, py);
        }
        x.stroke();
      }
    },
    star: function (x) {
      starPath(x, 56, 23); x.fill();
      x.globalCompositeOperation = 'destination-out';
      x.lineWidth = 2.4; x.save(); x.scale(0.72, 0.72); starPath(x, 56, 23); x.restore(); x.stroke();
      x.globalCompositeOperation = 'source-over';
    },
    moon: function (x) {
      x.beginPath(); x.arc(-6, 4, 44, 0, TAU); x.fill();
      x.globalCompositeOperation = 'destination-out';
      x.beginPath(); x.arc(12, -8, 38, 0, TAU); x.fill();
      x.globalCompositeOperation = 'source-over';
      [[40, -40, 8], [52, 14, 6], [26, 44, 5]].forEach(function (s) {
        x.beginPath();
        for (var i = 0; i < 8; i++) {
          var a = i * Math.PI / 4, r = i % 2 ? s[2] * 0.3 : s[2];
          var px = s[0] + Math.cos(a) * r, py = s[1] + Math.sin(a) * r;
          if (i) x.lineTo(px, py); else x.moveTo(px, py);
        }
        x.closePath(); x.fill();
      });
    },
    leaf: function (x) {
      x.save(); x.rotate(0.5);
      x.beginPath(); x.moveTo(0, 58); x.quadraticCurveTo(-50, 4, 0, -62); x.quadraticCurveTo(50, 4, 0, 58); x.fill();
      x.lineWidth = 3; x.beginPath(); x.moveTo(0, 58); x.lineTo(0, 68); x.stroke();
      x.globalCompositeOperation = 'destination-out';
      x.lineWidth = 2.2; x.beginPath(); x.moveTo(0, 54); x.lineTo(0, -54); x.stroke();
      x.lineWidth = 1.4;
      for (var i = -40; i < 44; i += 13) {
        x.beginPath(); x.moveTo(0, i + 8); x.quadraticCurveTo(-12, i + 2, -20, i - 6); x.stroke();
        x.beginPath(); x.moveTo(0, i + 8); x.quadraticCurveTo(12, i + 2, 20, i - 6); x.stroke();
      }
      x.globalCompositeOperation = 'source-over';
      x.restore();
    },
    paw: function (x) {
      x.beginPath(); x.ellipse(0, 10, 26, 21, 0, 0, TAU); x.fill();
      [[-31, -16, -0.4], [-11, -34, -0.15], [11, -34, 0.15], [31, -16, 0.4]].forEach(function (t) {
        x.beginPath(); x.ellipse(t[0], t[1], 10, 13, t[2], 0, TAU); x.fill();
      });
      txt(x, 'APPROVED BY THE CAT', 'bold 9px ' + MONO, 50);
    }
  };

  function rubber(ctx, it, k) {
    var s = it.s || 1, px = Math.max(16, Math.min(900, Math.ceil(140 * s * k)));
    var key = [it.kind, it.color, it.text || '', it.seed, px].join('|');
    var c = cache[key];
    if (!c) {
      c = document.createElement('canvas'); c.width = c.height = px;
      var x = c.getContext('2d');
      x.setTransform(px / 140, 0, 0, px / 140, px / 2, px / 2);
      x.fillStyle = x.strokeStyle = it.color || '#c23b22';
      x.lineJoin = 'round'; x.lineCap = 'round';
      (DESIGNS[it.kind] || DESIGNS.approved)(x, it);
      /* distress: rubber never inks perfectly */
      var rnd = U.rng(it.seed || 3);
      x.globalCompositeOperation = 'destination-out';
      for (var i = 0; i < 320; i++) {
        x.globalAlpha = 0.4 + rnd() * 0.6;
        x.beginPath(); x.arc(rnd() * 140 - 70, rnd() * 140 - 70, 0.3 + rnd() * 1.5, 0, TAU); x.fill();
      }
      for (i = 0; i < 3; i++) {
        var gx = rnd() * 120 - 60, gy = rnd() * 120 - 60, gr = 14 + rnd() * 22;
        var g = x.createRadialGradient(gx, gy, 0, gx, gy, gr);
        g.addColorStop(0, 'rgba(0,0,0,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        x.globalAlpha = 1; x.fillStyle = g; x.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
      }
      remember(key, c);
    }
    ctx.save();
    ctx.translate(it.x, it.y); ctx.rotate(it.rot || 0);
    ctx.globalAlpha = 0.88;
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(c, -70 * s, -70 * s, 140 * s, 140 * s);
    ctx.restore();
  }

  /* ---------- wax seal ---------- */
  function seal(ctx, it, k) {
    var s = it.s || 1, r = 58 * s, col = it.color || '#9e1b22', rnd = U.rng(it.seed || 9);
    ctx.save();
    ctx.translate(it.x, it.y); ctx.rotate(it.rot || 0);
    var n = 30, pts = [];
    for (var i = 0; i < n; i++) {
      var a = i / n * TAU, rr = r * (1 + (rnd() - 0.5) * 0.12 + (i % 6 === 0 ? rnd() * 0.16 : 0));
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    ctx.beginPath();
    for (i = 0; i < n; i++) {
      var p0 = pts[i], p1 = pts[(i + 1) % n], mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
      if (!i) ctx.moveTo(mx, my); else ctx.quadraticCurveTo(p0[0], p0[1], mx, my);
    }
    ctx.quadraticCurveTo(pts[0][0], pts[0][1], (pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2);
    ctx.closePath();
    ctx.shadowColor = 'rgba(0,0,0,.38)'; ctx.shadowBlur = 7 * k; ctx.shadowOffsetY = 3 * k;
    var g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.05, 0, 0, r * 1.15);
    g.addColorStop(0, U.shade(col, 0.38)); g.addColorStop(0.45, col); g.addColorStop(1, U.shade(col, -0.45));
    ctx.fillStyle = g; ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    /* pressed recess */
    var ri = r * 0.7;
    g = ctx.createRadialGradient(r * 0.15, r * 0.2, ri * 0.1, 0, 0, ri);
    g.addColorStop(0, U.shade(col, 0.12)); g.addColorStop(1, U.shade(col, -0.3));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, ri, 0, TAU); ctx.fill();
    ctx.lineWidth = r * 0.06; ctx.strokeStyle = U.shade(col, -0.5);
    ctx.beginPath(); ctx.arc(0, 0, ri, Math.PI * 0.85, Math.PI * 1.9); ctx.stroke();
    ctx.strokeStyle = U.shade(col, 0.45); ctx.lineWidth = r * 0.035;
    ctx.beginPath(); ctx.arc(0, 0, ri + r * 0.02, -0.1, Math.PI * 0.8); ctx.stroke();
    /* beaded rim */
    ctx.fillStyle = U.shade(col, -0.35);
    for (i = 0; i < 28; i++) {
      var ba = i / 28 * TAU;
      ctx.beginPath(); ctx.arc(Math.cos(ba) * ri * 0.86, Math.sin(ba) * ri * 0.86, r * 0.028, 0, TAU); ctx.fill();
    }
    /* monogram */
    var L = (it.text || 'I').slice(0, 1).toUpperCase();
    ctx.font = 'bold ' + (r * 0.78) + 'px ' + SERIF;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = U.shade(col, -0.55); ctx.fillText(L, r * 0.035, r * 0.07);
    ctx.fillStyle = U.shade(col, 0.5); ctx.fillText(L, -r * 0.025, r * 0.01);
    ctx.fillStyle = U.shade(col, 0.05); ctx.fillText(L, 0, r * 0.04);
    /* gloss */
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    ctx.beginPath(); ctx.ellipse(-r * 0.4, -r * 0.5, r * 0.28, r * 0.12, -0.6, 0, TAU); ctx.fill();
    if (it.broken) {
      ctx.strokeStyle = U.shade(col, -0.7); ctx.lineWidth = r * 0.05; ctx.lineJoin = 'miter';
      ctx.beginPath(); ctx.moveTo(-r * 1.02, -r * 0.2);
      var cx = -r * 1.02;
      while (cx < r) { cx += r * 0.22; ctx.lineTo(cx, (rnd() - 0.5) * r * 0.35); }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = r * 0.015; ctx.stroke();
    }
    ctx.restore();
  }

  S.draw = function (ctx, it, k) {
    if (it.kind === 'seal') seal(ctx, it, k || 1);
    else rubber(ctx, it, k || 1);
  };

  /* rasterise one stamp (used to embed stamps inside SVG exports) */
  S.raster = function (it, ppu) {
    var s = it.s || 1, box = 190 * s, px = Math.ceil(box * ppu);
    var c = document.createElement('canvas'); c.width = c.height = px;
    var x = c.getContext('2d');
    x.setTransform(ppu, 0, 0, ppu, px / 2 - it.x * ppu, px / 2 - it.y * ppu);
    S.draw(x, it, ppu);
    return { url: c.toDataURL('image/png'), x: it.x - box / 2, y: it.y - box / 2, w: box };
  };

  /* small preview tile for the stamp drawer */
  S.preview = function (kind, color, text, px) {
    var c = document.createElement('canvas');
    var d = Math.min(2, window.devicePixelRatio || 1);
    c.width = c.height = Math.round(px * d);
    c.style.width = c.style.height = px + 'px';
    var x = c.getContext('2d'), ppu = c.width / 150;
    x.setTransform(ppu, 0, 0, ppu, c.width / 2, c.height / 2);
    S.draw(x, { tool: 'stamp', kind: kind, x: 0, y: 0, s: 1, rot: 0, color: color, text: text, seed: 11 }, ppu);
    return c;
  };
})();
