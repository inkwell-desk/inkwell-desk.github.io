/* Inkwell — procedural papers: cotton, washi, parchment, kraft (+ rulings) */
(function () {
  'use strict';
  var IW = window.IW = window.IW || {};
  var U = IW.util;
  var P = IW.paper = {};

  P.TYPES = {
    cotton: { name: 'Cotton rag', base: '#f3eee1', absorb: 0.6, grain: [70, 60, 40, 0.07], rule: 'rgba(52,78,150,.22)', margin: 'rgba(190,70,60,.35)', fiber: 'rgba(120,105,80,.09)',
      desc: 'Soft and toothy. Drinks ink politely, feathers a little.' },
    washi: { name: 'Washi (kozo)', base: '#f6f1e4', absorb: 1.0, grain: [90, 80, 60, 0.045], rule: 'rgba(160,60,40,.2)', margin: 'rgba(160,60,40,.3)', fiber: 'rgba(255,255,255,.55)',
      desc: 'Long mulberry fibres. Bleeds beautifully — brushes adore it.' },
    parchment: { name: 'Parchment', base: '#ead6ab', absorb: 0.15, grain: [110, 70, 30, 0.08], rule: 'rgba(100,60,25,.26)', margin: 'rgba(130,40,30,.3)', fiber: 'rgba(120,80,40,.08)',
      desc: 'Crisp hairlines, almost no bleed, centuries of attitude.' },
    kraft: { name: 'Kraft', base: '#b98c5d', absorb: 0.45, grain: [50, 30, 12, 0.15], rule: 'rgba(255,244,222,.33)', margin: 'rgba(255,244,222,.45)', fiber: 'rgba(235,205,165,.28)',
      desc: 'Brown-paper-package energy. Try the gel white ink.' }
  };
  P.ids = Object.keys(P.TYPES);
  P.get = function (id) { return P.TYPES[id] || P.TYPES.cotton; };

  var tiles = {};
  function tile(id) {
    if (tiles[id]) return tiles[id];
    var T = P.get(id), n = 128;
    var c = document.createElement('canvas'); c.width = c.height = n;
    var x = c.getContext('2d'), img = x.createImageData(n, n), d = img.data;
    var rnd = U.rng(id.length * 7919 + 13);
    for (var i = 0; i < n * n; i++) {
      var r = rnd(), k = i * 4;
      if (r > 0.985) { d[k] = 255; d[k + 1] = 252; d[k + 2] = 240; d[k + 3] = 70; }
      else { d[k] = T.grain[0]; d[k + 1] = T.grain[1]; d[k + 2] = T.grain[2]; d[k + 3] = Math.round(255 * T.grain[3] * r * r * 1.6); }
    }
    x.putImageData(img, 0, 0);
    tiles[id] = c;
    return c;
  }

  function fiber(ctx, rnd, W, H, minL, maxL, lw, color) {
    var x = rnd() * W, y = rnd() * H, a = rnd() * Math.PI * 2, L = minL + rnd() * (maxL - minL);
    var bend = (rnd() - 0.5) * L * 0.6;
    var ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L;
    var mx = (x + ex) / 2 - Math.sin(a) * bend, my = (y + ey) / 2 + Math.cos(a) * bend;
    ctx.strokeStyle = color; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(mx, my, ex, ey); ctx.stroke();
  }

  /* Draw a full paper sheet. ctx is a canvas of cw×ch pixels representing W×H logical units. */
  P.draw = function (ctx, cw, ch, W, H, id, ruling, opts) {
    opts = opts || {};
    var T = P.get(id), k = cw / W;
    var rnd = U.rng((opts.seed || 7) + id.length * 101);
    var lite = opts.lite || U.lowPower;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = T.base;
    ctx.fillRect(0, 0, cw, ch);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.lineCap = 'round';
    var i, g;
    if (id === 'parchment') {
      for (i = 0; i < (lite ? 18 : 46); i++) {
        var px = rnd() * W, py = rnd() * H, pr = 40 + rnd() * 220;
        g = ctx.createRadialGradient(px, py, 0, px, py, pr);
        g.addColorStop(0, 'rgba(150,100,40,' + (0.03 + rnd() * 0.06) + ')');
        g.addColorStop(1, 'rgba(150,100,40,0)');
        ctx.fillStyle = g; ctx.fillRect(px - pr, py - pr, pr * 2, pr * 2);
      }
      for (i = 0; i < 14; i++) {
        ctx.fillStyle = 'rgba(110,70,30,' + (0.08 + rnd() * 0.12) + ')';
        ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, 0.6 + rnd() * 2.2, 0, 7); ctx.fill();
      }
    } else if (id === 'washi') {
      var nf = lite ? 260 : 700;
      for (i = 0; i < nf; i++) fiber(ctx, rnd, W, H, 30, 170, 0.25 + rnd() * 0.8, rnd() < 0.7 ? T.fiber : 'rgba(175,150,105,.13)');
      for (i = 0; i < 40; i++) {
        ctx.fillStyle = 'rgba(95,70,40,' + (0.12 + rnd() * 0.2) + ')';
        ctx.beginPath(); ctx.ellipse(rnd() * W, rnd() * H, 0.6 + rnd() * 2.5, 0.3 + rnd() * 0.8, rnd() * 3, 0, 7); ctx.fill();
      }
    } else if (id === 'kraft') {
      for (i = 0; i < (lite ? 200 : 520); i++) fiber(ctx, rnd, W, H, 6, 34, 0.3 + rnd() * 0.6, rnd() < 0.6 ? T.fiber : 'rgba(80,50,20,.18)');
      for (i = 0; i < (lite ? 500 : 1500); i++) {
        ctx.fillStyle = rnd() < 0.75 ? 'rgba(60,35,14,' + (0.12 + rnd() * 0.3) + ')' : 'rgba(250,230,200,.35)';
        ctx.fillRect(rnd() * W, rnd() * H, 0.5 + rnd() * 1.4, 0.5 + rnd() * 1.4);
      }
    } else {
      for (i = 0; i < (lite ? 90 : 240); i++) fiber(ctx, rnd, W, H, 4, 22, 0.25 + rnd() * 0.4, T.fiber);
    }
    /* fine grain, device-pixel crisp */
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var pat = ctx.createPattern(tile(id), 'repeat');
    if (pat) { ctx.fillStyle = pat; ctx.fillRect(0, 0, cw, ch); }
    /* soft desk-lamp falloff */
    g = ctx.createRadialGradient(cw * 0.3, ch * 0.2, 0, cw * 0.5, ch * 0.5, Math.max(cw, ch) * 0.85);
    g.addColorStop(0, 'rgba(255,250,235,.10)');
    g.addColorStop(0.7, 'rgba(0,0,0,0)');
    g.addColorStop(1, id === 'parchment' ? 'rgba(110,60,15,.30)' : 'rgba(40,30,20,.10)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    if (ruling && ruling !== 'none') P.ruling(ctx, W, H, ruling, T, opts);
    if (opts.header) {
      ctx.fillStyle = id === 'kraft' ? 'rgba(255,246,228,.85)' : 'rgba(40,45,80,.75)';
      ctx.font = 'italic 34px "Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Georgia,serif';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(opts.header, 108, 118);
      if (opts.subheader) {
        ctx.font = '18px "Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif';
        ctx.globalAlpha = 0.7;
        ctx.fillText(opts.subheader, 110, 150);
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
  };

  P.ruling = function (ctx, W, H, ruling, T, opts) {
    ctx.save();
    ctx.strokeStyle = T.rule;
    ctx.fillStyle = T.rule;
    ctx.lineWidth = 1;
    var y, x, i;
    if (ruling === 'lines' || ruling === 'journal') {
      var top = ruling === 'journal' ? 200 : 120;
      for (y = top; y < H - 50; y += 54) { ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(W - 40, y); ctx.stroke(); }
      ctx.strokeStyle = T.margin; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(92, 30); ctx.lineTo(92, H - 30); ctx.stroke();
    } else if (ruling === 'italic' || ruling === 'copperplate') {
      var cp = ruling === 'copperplate';
      var row = cp ? 150 : 160, xh = cp ? 34 : 40;
      for (y = 90; y + row * 0.7 < H; y += row) {
        var base = y + row * 0.62;
        ctx.lineWidth = 1.2; ctx.globalAlpha = 1;
        line(ctx, 40, base, W - 40, base);
        ctx.lineWidth = 0.8; line(ctx, 40, base - xh, W - 40, base - xh);
        ctx.globalAlpha = 0.5; ctx.setLineDash([6, 6]);
        line(ctx, 40, base - xh * 2.1, W - 40, base - xh * 2.1);
        line(ctx, 40, base + xh * 1.1, W - 40, base + xh * 1.1);
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.28;
        var ang = cp ? 55 : 85, dx = (xh * 2.1 + xh * 1.1) / Math.tan(ang * Math.PI / 180);
        for (x = 60; x < W - 40 - dx; x += cp ? 46 : 70) line(ctx, x, base + xh * 1.1, x + dx, base - xh * 2.1);
        ctx.globalAlpha = 1;
      }
    } else if (ruling === 'grid') {
      for (x = 20; x < W; x += 40) line(ctx, x, 0, x, H);
      for (y = 10; y < H; y += 40) line(ctx, 0, y, W, y);
    } else if (ruling === 'dots') {
      for (x = 30; x < W; x += 40) for (y = 30; y < H; y += 40) { ctx.beginPath(); ctx.arc(x, y, 1.4, 0, 7); ctx.fill(); }
    }
    ctx.restore();
  };
  function line(ctx, a, b, c, d) { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); }
})();
