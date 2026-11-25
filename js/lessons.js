/* Inkwell — guided lessons: ghost tracing, master demos and stroke scoring */
(function () {
  'use strict';
  var IW = window.IW = window.IW || {};
  var U = IW.util, E = IW.engine;
  var L = IW.lessons = {};

  var W = 1000, H = 760, BOX = { x: 220, y: 100, s: 560 };

  var COURSES = [
    {
      id: 'italic', name: 'Latin italic', sub: 'Broad edge · ~40° nib · 5° slant', paper: 'cotton', guide: 'italic', ghost: '#8a9cc9',
      pen: { tool: 'italic', size: 24, nib: 40, color: '#1d2b4f' },
      notes: '<p><strong>Italic</strong> grew out of the humanist scripts of Renaissance Italy. Hold a broad-edge nib at a steady angle of roughly 40–45° and never twist it — the thick and thin strokes appear on their own. Letters lean gently (about 5°) and the arches spring out of the stem partway up, which gives italic its springy, triangular-ish counters.</p><p class="muted small">Tip: speed is the enemy of italic. Think “slow tea”, not “espresso”.</p>',
      glyphs: [
        { ch: 'i', name: 'i — the first stem', tip: 'One confident downstroke with a small exit flick, then the dot.', strokes: [{ d: 'M 50 40 L 48 66 Q 47.5 71 53 69' }, { d: 'M 51 29 L 50.5 32' }] },
        { ch: 'l', name: 'l — the tall stem', tip: 'Start at the ascender line; keep the nib angle as you travel down.', strokes: [{ d: 'M 53 10 L 48 66 Q 47.5 71 53 69' }] },
        { ch: 'n', name: 'n — stem and arch', tip: 'Go back up inside the stem, then branch out into the arch.', strokes: [{ d: 'M 41 40 L 38 70' }, { d: 'M 39 57 Q 45 40 54 40 Q 60 41 59 48 L 57 66 Q 57 71 62 69' }] },
        { ch: 'm', name: 'm — two arches', tip: 'Both arches the same width. Twins, not cousins.', strokes: [{ d: 'M 28 40 L 25 70' }, { d: 'M 26 57 Q 31 40 39 40 Q 45 41 44 48 L 42 70' }, { d: 'M 43 57 Q 48 40 56 40 Q 62 41 61 48 L 59 66 Q 59 71 64 69' }] },
        { ch: 'a', name: 'a — the bowl', tip: 'Bowl first, travelling left over the top; then the stem.', strokes: [{ d: 'M 60 43 Q 54 39 47 41 Q 39 46 38 60 Q 38 70 45 69 Q 52 66 58 52' }, { d: 'M 60 40 L 57 66 Q 57 71 62 69' }] },
        { ch: 'o', name: 'o — the oval', tip: 'Counter-clockwise from the top. Aim for an egg, not a ball.', strokes: [{ d: 'M 52 40 Q 40 41 38 58 Q 38 70 48 70 Q 59 69 60 52 Q 61 40 52 40' }] },
        { ch: 'u', name: 'u — the inverted arch', tip: 'Down, round the bottom, up; then the stem on the right.', strokes: [{ d: 'M 41 40 L 39 62 Q 39 70 46 69 Q 54 67 58 52' }, { d: 'M 60 40 L 57 66 Q 57 71 62 69' }] },
        { ch: 'h', name: 'h — ascender and arch', tip: 'Like n, but the stem starts at the ascender line.', strokes: [{ d: 'M 45 10 L 38 70' }, { d: 'M 39 57 Q 45 40 54 40 Q 60 41 59 48 L 57 66 Q 57 71 62 69' }] }
      ]
    },
    {
      id: 'copperplate', name: 'Copperplate', sub: 'Pointed flex nib · 55° slant', paper: 'parchment', guide: 'copperplate', ghost: '#a08a6a',
      pen: { tool: 'dip', size: 8, color: '#3b2a1a' },
      notes: '<p><strong>Copperplate</strong> (English roundhand) is written with a pointed, flexible nib on a steep slant of about 55°. Press on the <em>downstrokes</em> so the tines open into a shade; float on the <em>upstrokes</em> for hairlines. With a mouse, slow down to swell and speed up to thin.</p><p class="muted small">Many right-handed writers use an oblique holder to reach that slant without contorting the wrist.</p>',
      glyphs: [
        { ch: '⁄', name: 'Hairline upstroke', tip: 'No pressure at all. Let the nib glide like gossip.', strokes: [{ d: 'M 30 70 Q 48 64 60 40' }] },
        { ch: '∕', name: 'Shaded downstroke', tip: 'Even pressure from top to bottom along the 55° slant.', strokes: [{ d: 'M 60 40 L 39 70' }] },
        { ch: 'u', name: 'Under-turn', tip: 'Shade down, release at the turn, hairline back up.', strokes: [{ d: 'M 58 40 L 45 60 Q 40 70 48 69 Q 58 64 70 40' }] },
        { ch: 'n', name: 'Over-turn', tip: 'Hairline up and over, then shade on the way down.', strokes: [{ d: 'M 34 70 Q 46 44 56 40 Q 63 39 60 47 L 47 70' }] },
        { ch: '∿', name: 'Compound curve', tip: 'Over-turn and under-turn joined. Shade only the middle.', strokes: [{ d: 'M 34 70 Q 45 44 55 40 Q 62 39 59 47 L 50 62 Q 46 70 54 69 Q 63 64 74 40' }] },
        { ch: 'o', name: 'Oval', tip: 'Counter-clockwise; the shade sits on the left side.', strokes: [{ d: 'M 62 42 Q 55 37 48 41 Q 38 50 37 63 Q 37 72 45 70 Q 55 66 61 52 Q 65 41 58 40' }] },
        { ch: 'ℓ', name: 'Ascending loop', tip: 'Hairline up to the ascender, loop, then shade down.', strokes: [{ d: 'M 28 70 Q 48 52 64 24 Q 71 9 63 10 Q 56 13 51 30 L 40 70' }] },
        { ch: 'ʃ', name: 'Descending loop', tip: 'Shade down below the baseline, loop left, hairline up.', strokes: [{ d: 'M 60 40 L 45 90 Q 41 99 35 96 Q 32 90 42 80 Q 52 72 66 68' }] }
      ]
    },
    {
      id: 'devanagari', name: 'Devanagari strokes', sub: 'Headline · stem · first letters', paper: 'cotton', guide: 'devanagari', ghost: '#c49a7c',
      pen: { tool: 'fountain', size: 9, color: '#6b2316' },
      notes: '<p><strong>Devanagari</strong> is used for Hindi, Marathi, Nepali, Sanskrit and many other languages. Most letters hang from a horizontal headline called the <em>shirorekha</em>, and many have a vertical stem on the right. A common way to learn is to write the letter body first and draw the shirorekha last, joining letters into words.</p><p class="muted small">These shapes are simplified practice guides — a primer or teacher remains the gold standard.</p>',
      glyphs: [
        { ch: '—', name: 'Shirorekha (headline)', tip: 'Left to right, level and steady — a washing line for letters.', strokes: [{ d: 'M 18 30 L 82 30' }] },
        { ch: '।', name: 'Vertical stem', tip: 'Straight down from the headline. Calm and upright.', strokes: [{ d: 'M 60 30 L 60 82' }] },
        { ch: 'ग', name: 'ग (ga)', tip: 'Left part, then the stem, then the headline across the top.', strokes: [{ d: 'M 40 30 L 40 62 Q 40 70 33 68' }, { d: 'M 62 30 L 62 82' }, { d: 'M 26 30 L 74 30' }] },
        { ch: 'प', name: 'प (pa)', tip: 'Down and curve across to meet the stem; stem; headline.', strokes: [{ d: 'M 36 30 Q 32 52 42 57 Q 52 60 62 52' }, { d: 'M 62 30 L 62 82' }, { d: 'M 26 30 L 74 30' }] },
        { ch: 'म', name: 'म (ma)', tip: 'Small loop, travel across to the stem; stem; headline.', strokes: [{ d: 'M 40 30 Q 30 38 35 45 Q 41 50 43 42 Q 42 54 52 55 L 62 55' }, { d: 'M 62 30 L 62 82' }, { d: 'M 26 30 L 74 30' }] },
        { ch: '०', name: '० (digit zero)', tip: 'One round stroke. India gave the world zero — draw it proudly.', strokes: [{ d: 'M 50 34 Q 30 36 32 56 Q 35 76 52 74 Q 69 71 68 52 Q 66 34 50 34' }] }
      ]
    },
    {
      id: 'japanese', name: 'Japanese brush', sub: 'Shodō basics · horizontal, vertical, sweeps', paper: 'washi', guide: 'japanese', ghost: '#9a9a9a',
      pen: { tool: 'brush', size: 22, color: '#16161b' },
      notes: '<p><strong>Shodō</strong> (書道, “the way of writing”). Horizontals rise very slightly to the right, verticals fall straight, and the left- and right-falling sweeps give characters their movement. General order: top before bottom, left before right, and a horizontal usually comes before the vertical that crosses it (as in 十).</p><p>The character <strong>永</strong> (ei, “eternity”) is traditionally used to teach the eight basic stroke types — the <em>Eight Principles of Yong</em> (永字八法, eiji happō).</p>',
      glyphs: [
        { ch: '一', name: '一 (ichi, one)', tip: 'Press in, travel, pause and press out. One stroke, one breath.', strokes: [{ d: 'M 20 52 L 80 47', end: 'press' }] },
        { ch: '二', name: '二 (ni, two)', tip: 'The top line is shorter than the bottom one.', strokes: [{ d: 'M 32 36 L 68 33', end: 'press' }, { d: 'M 18 68 L 82 64', end: 'press' }] },
        { ch: '三', name: '三 (san, three)', tip: 'Middle shortest, bottom longest.', strokes: [{ d: 'M 28 26 L 72 23', end: 'press' }, { d: 'M 34 50 L 66 48', end: 'press' }, { d: 'M 18 76 L 82 72', end: 'press' }] },
        { ch: '十', name: '十 (jū, ten)', tip: 'Horizontal first, then the vertical that crosses it.', strokes: [{ d: 'M 18 46 L 82 42', end: 'press' }, { d: 'M 50 14 L 50 90', end: 'taper' }] },
        { ch: '人', name: '人 (hito, person)', tip: 'Left-falling sweep, then the right-falling stroke.', strokes: [{ d: 'M 50 14 Q 48 56 16 86', end: 'taper' }, { d: 'M 49 46 Q 60 72 86 86', end: 'press' }] },
        { ch: '大', name: '大 (dai, big)', tip: 'Horizontal, left-falling, then right-falling.', strokes: [{ d: 'M 18 40 L 82 36', end: 'press' }, { d: 'M 50 12 Q 50 60 16 88', end: 'taper' }, { d: 'M 52 48 Q 64 74 86 88', end: 'press' }] },
        { ch: '永', name: '永 (ei, eternity)', tip: 'Five strokes: dot, horizontal-turn-vertical with hook, the left part, then the two sweeps on the right.', strokes: [{ d: 'M 46 8 L 53 17', end: 'press' }, { d: 'M 33 28 L 55 26 L 53 86 L 44 79', end: 'hook' }, { d: 'M 22 44 L 41 42 Q 34 62 14 76', end: 'taper' }, { d: 'M 78 32 Q 70 43 58 50', end: 'taper' }, { d: 'M 58 50 Q 70 70 88 84', end: 'press' }] }
      ]
    }
  ];
  L.COURSES = COURSES;

  /* ---------- geometry ---------- */
  function parsePath(d) {
    var tok = d.trim().split(/[\s,]+/), i = 0, cmd = null, pts = [], cx = 0, cy = 0, j, t, it;
    while (i < tok.length) {
      if (/^[MLQC]$/.test(tok[i])) { cmd = tok[i]; i++; continue; }
      if (cmd === 'M') { cx = +tok[i]; cy = +tok[i + 1]; i += 2; pts.push([cx, cy]); }
      else if (cmd === 'L') {
        var x = +tok[i], y = +tok[i + 1]; i += 2;
        var n = Math.max(1, Math.ceil(Math.hypot(x - cx, y - cy)));
        for (j = 1; j <= n; j++) pts.push([cx + (x - cx) * j / n, cy + (y - cy) * j / n]);
        cx = x; cy = y;
      } else if (cmd === 'Q') {
        var qx = +tok[i], qy = +tok[i + 1], ex = +tok[i + 2], ey = +tok[i + 3]; i += 4;
        for (j = 1; j <= 16; j++) { t = j / 16; it = 1 - t; pts.push([it * it * cx + 2 * it * t * qx + t * t * ex, it * it * cy + 2 * it * t * qy + t * t * ey]); }
        cx = ex; cy = ey;
      } else if (cmd === 'C') {
        var ax = +tok[i], ay = +tok[i + 1], bx = +tok[i + 2], by = +tok[i + 3], fx = +tok[i + 4], fy = +tok[i + 5]; i += 6;
        for (j = 1; j <= 20; j++) {
          t = j / 20; it = 1 - t;
          pts.push([it * it * it * cx + 3 * it * it * t * ax + 3 * it * t * t * bx + t * t * t * fx, it * it * it * cy + 3 * it * it * t * ay + 3 * it * t * t * by + t * t * t * fy]);
        }
        cx = fx; cy = fy;
      } else i++;
    }
    return pts;
  }
  function plen(p) { var s = 0; for (var i = 1; i < p.length; i++) s += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return s; }
  function resample(p, n) {
    if (!p.length) return [];
    if (p.length === 1) { var o = []; for (var q = 0; q < n; q++) o.push(p[0]); return o; }
    var total = plen(p), step = total / (n - 1), out = [p[0]], acc = 0, i = 1, prev = p[0];
    if (total < 1e-6) return resample([p[0]], n);
    while (i < p.length && out.length < n) {
      var cur = p[i], d = Math.hypot(cur[0] - prev[0], cur[1] - prev[1]);
      if (acc + d >= step && d > 0) {
        var t = (step - acc) / d, np = [prev[0] + (cur[0] - prev[0]) * t, prev[1] + (cur[1] - prev[1]) * t];
        out.push(np); prev = np; acc = 0;
      } else { acc += d; prev = cur; i++; }
    }
    while (out.length < n) out.push(p[p.length - 1]);
    return out;
  }
  function meanDist(a, b, rev) {
    var s = 0, n = a.length;
    for (var i = 0; i < n; i++) { var q = rev ? b[n - 1 - i] : b[i]; s += Math.hypot(a[i][0] - q[0], a[i][1] - q[1]); }
    return s / n;
  }
  function centroid(p) { var x = 0, y = 0; p.forEach(function (q) { x += q[0]; y += q[1]; }); return [x / p.length, y / p.length]; }

  function score(user, guide) {
    var gl = plen(guide);
    if (!user.length) return { score: 0, reversed: false };
    if (gl < 10) {
      var a = centroid(user), b = centroid(guide), d0 = Math.hypot(a[0] - b[0], a[1] - b[1]);
      return { score: Math.round(100 * Math.exp(-Math.pow(d0 / 8, 2))), reversed: false };
    }
    var Uu = resample(user, 32), G = resample(guide, 32);
    var dF = meanDist(Uu, G, false), dR = meanDist(Uu, G, true);
    var s = 100 * Math.exp(-Math.pow(dF / 9, 2));
    var ratio = plen(user) / gl;
    if (ratio < 0.6 || ratio > 1.6) s *= 0.8;
    var reversed = dR < dF * 0.6;
    if (reversed) s *= 0.5;
    return { score: Math.round(s), reversed: reversed };
  }

  function toDoc(q) { return [BOX.x + q[0] * BOX.s / 100, BOX.y + q[1] * BOX.s / 100]; }
  function toGlyph(q) { return [(q[0] - BOX.x) / BOX.s * 100, (q[1] - BOX.y) / BOX.s * 100]; }

  /* fake a master's stroke: path + pressure profile + timing */
  function simulate(course, gs, pen, color, alpha, idx) {
    var poly = resample(gs.poly, Math.max(8, Math.round(plen(gs.poly) * 1.2)));
    var n = poly.length, pts = [], t = 0, p = 0.6, i;
    for (i = 0; i < n; i++) {
      var q = toDoc(poly[i]), f = i / (n - 1);
      if (i) t += Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]) / 0.45;
      var tool = pen.tool;
      if (tool === 'dip') {
        var nx = poly[Math.min(n - 1, i + 1)], pv = poly[Math.max(0, i - 1)];
        var target = (nx[1] - pv[1]) > 0.15 ? 0.9 : 0.06;
        p = i ? p + (target - p) * 0.35 : target;
      } else if (tool === 'brush') {
        if (f < 0.1) p = 0.95 - f * 2.5;
        else if (gs.end === 'taper' && f > 0.6) p = 0.7 - (f - 0.6) / 0.4 * 0.6;
        else if (gs.end === 'hook' && f > 0.85) p = 0.7 - (f - 0.85) / 0.15 * 0.55;
        else if (gs.end === 'press' && f > 0.85) p = 0.7 + (f - 0.85) / 0.15 * 0.25;
        else p = 0.7;
      } else if (tool === 'italic') p = 0.6;
      else p = 0.5;
      pts.push([U.r1(q[0]), U.r1(q[1]), U.r2(U.clamp(p, 0, 1)), Math.round(t), 0, 0]);
    }
    var st = { tool: pen.tool, color: color, size: pen.size, seed: 1000 + idx * 17, at: idx * 10000, bleed: 0.35, alpha: alpha, pts: pts };
    if (pen.tool === 'italic') st.nib = pen.nib == null ? 40 : pen.nib;
    return st;
  }

  /* ---------- state & UI ---------- */
  var st = { c: 0, g: 0, k: 0, results: [], done: false, ghost: true, best: {}, override: 'default' };
  var ic = null, doc = null;
  var SIZES = { italic: 24, dip: 8, brush: 22, fountain: 9, pencil: 7 };

  function course() { return COURSES[st.c]; }
  function glyph() { return course().glyphs[st.g]; }
  function pen() {
    var c = course();
    if (st.override === 'default') return c.pen;
    return { tool: st.override, size: SIZES[st.override] || 10, nib: 40, color: c.pen.color, bleed: 0.4 };
  }
  function prepGlyph(g) { if (!g._p) g.strokes.forEach(function (s) { s.poly = parsePath(s.d); }); g._p = true; }
  function gid() { return course().id + ':' + st.g; }
  function stars(sc) { return sc >= 85 ? 3 : sc >= 70 ? 2 : sc >= 50 ? 1 : 0; }
  function starStr(n) { return '★★★'.slice(0, n) + '☆☆☆'.slice(0, 3 - n); }

  function drawRuling(x) {
    var c = course(), k = BOX.s / 100;
    x.save();
    x.strokeStyle = 'rgba(70,90,150,.28)'; x.lineWidth = 1.2;
    function hl(y, dash) { x.setLineDash(dash || []); x.beginPath(); x.moveTo(60, BOX.y + y * k); x.lineTo(W - 60, BOX.y + y * k); x.stroke(); }
    if (c.guide === 'italic' || c.guide === 'copperplate') {
      hl(70); hl(40); hl(10, [8, 8]); hl(95, [8, 8]);
      x.setLineDash([]); x.globalAlpha = 0.45;
      var ang = (c.guide === 'copperplate' ? 55 : 85) * Math.PI / 180, dx = (85 * k) / Math.tan(ang);
      for (var sx = 90; sx < W - 60 - dx; sx += c.guide === 'copperplate' ? 50 : 80) {
        x.beginPath(); x.moveTo(sx, BOX.y + 95 * k); x.lineTo(sx + dx, BOX.y + 10 * k); x.stroke();
      }
    } else if (c.guide === 'devanagari') {
      x.strokeStyle = 'rgba(150,70,40,.3)';
      hl(30, [10, 6]); hl(82); hl(56, [3, 9]);
    } else {
      x.strokeStyle = 'rgba(160,40,30,.32)'; x.lineWidth = 2;
      x.strokeRect(BOX.x + 4 * k, BOX.y + 4 * k, 92 * k, 92 * k);
      x.setLineDash([10, 10]); x.lineWidth = 1.2;
      x.beginPath(); x.moveTo(BOX.x + 50 * k, BOX.y + 4 * k); x.lineTo(BOX.x + 50 * k, BOX.y + 96 * k);
      x.moveTo(BOX.x + 4 * k, BOX.y + 50 * k); x.lineTo(BOX.x + 96 * k, BOX.y + 50 * k); x.stroke();
    }
    x.restore();
  }

  function arrowHead(x, a, b, size) {
    var ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    x.beginPath();
    x.moveTo(b[0], b[1]);
    x.lineTo(b[0] - Math.cos(ang - 0.45) * size, b[1] - Math.sin(ang - 0.45) * size);
    x.lineTo(b[0] - Math.cos(ang + 0.45) * size, b[1] - Math.sin(ang + 0.45) * size);
    x.closePath(); x.fill();
  }

  function drawGuide() {
    if (!ic || !ic.cw) return;
    ic.clearLayer('guide');
    var x = ic.guide, c = course(), g = glyph(), pn = pen();
    drawRuling(x);
    prepGlyph(g);
    var ab = IW.paper.get(c.paper).absorb;
    g.strokes.forEach(function (s, i) {
      if (st.ghost && !(i < st.k && st.results[i])) E.renderStroke(x, simulate(c, s, pn, c.ghost, i === st.k ? 0.42 : 0.24, i), ab);
    });
    if (st.done) return;
    var cur = g.strokes[st.k];
    if (!cur) return;
    var dp = cur.poly.map(toDoc);
    if (st.ghost && dp.length > 1) {
      x.save();
      x.strokeStyle = 'rgba(201,162,74,.95)'; x.fillStyle = 'rgba(201,162,74,.95)';
      x.lineWidth = 2; x.setLineDash([7, 7]); x.lineCap = 'round';
      x.beginPath(); dp.forEach(function (q, i) { if (i) x.lineTo(q[0], q[1]); else x.moveTo(q[0], q[1]); }); x.stroke();
      x.setLineDash([]);
      arrowHead(x, dp[Math.max(0, dp.length - 4)], dp[dp.length - 1], 16);
      x.restore();
    }
    x.save();
    x.fillStyle = '#c9a24a'; x.strokeStyle = '#5a3f12'; x.lineWidth = 2;
    x.beginPath(); x.arc(dp[0][0], dp[0][1], 15, 0, 6.2832); x.fill(); x.stroke();
    x.fillStyle = '#1a1206'; x.font = 'bold 17px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(String(st.k + 1), dp[0][0], dp[0][1] + 1);
    x.restore();
  }

  function el(id) { return U.byId(id); }

  function renderTabs() {
    el('courseTabs').innerHTML = COURSES.map(function (c, i) {
      return '<button role="tab" class="course-tab' + (i === st.c ? ' on' : '') + '" aria-selected="' + (i === st.c) + '" data-c="' + i + '"><span class="ct-name">' + U.esc(c.name) + '</span><small>' + U.esc(c.sub) + '</small></button>';
    }).join('');
  }
  function renderGlyphs() {
    var c = course();
    el('glyphList').innerHTML = c.glyphs.map(function (g, i) {
      var b = st.best[c.id + ':' + i];
      return '<button role="listitem" class="glyph-chip' + (i === st.g ? ' on' : '') + '" data-g="' + i + '" aria-label="' + U.esc(g.name) + (b != null ? ', best ' + b : '') + '"><span class="gc-ch">' + U.esc(g.ch) + '</span><span class="gc-st">' + (b != null ? starStr(stars(b)) : '·') + '</span></button>';
    }).join('');
  }
  function renderHead() {
    var c = course(), g = glyph();
    el('lessonTitle').textContent = g.name;
    el('lessonStep').textContent = st.done ? 'Complete — ' + g.strokes.length + ' stroke' + (g.strokes.length > 1 ? 's' : '') + '.' : 'Stroke ' + (st.k + 1) + ' of ' + g.strokes.length + ' · ' + g.tip;
    el('lessonNotes').innerHTML = '<h3>' + U.esc(c.name) + '</h3>' + c.notes;
    var gb = el('lsGhost');
    gb.textContent = st.ghost ? 'Ghost: on' : 'Ghost: memory';
    gb.setAttribute('aria-pressed', String(st.ghost));
  }
  function renderScore(msg) {
    var g = glyph();
    el('scoreBars').innerHTML = g.strokes.map(function (s, i) {
      var r = st.results[i], v = r ? r.score : 0;
      return '<div class="sbar' + (i === st.k && !st.done ? ' cur' : '') + '" title="Stroke ' + (i + 1) + '"><i style="height:' + v + '%"></i><span>' + (r ? v : i + 1) + '</span></div>';
    }).join('');
    var done = st.results.filter(Boolean);
    var avg = done.length ? Math.round(done.reduce(function (a, r) { return a + r.score; }, 0) / done.length) : null;
    el('scoreTotal').textContent = avg == null ? '—' : String(avg);
    var n = st.done && avg != null ? stars(avg) : 0;
    el('scoreStars').textContent = starStr(n);
    el('scoreStars').setAttribute('aria-label', n + ' of 3 stars');
    if (msg) el('scoreMsg').textContent = msg;
  }

  function resetAttempt(msg) {
    st.k = 0; st.results = []; st.done = false;
    if (doc) { doc.strokes = []; doc.paper = course().paper; }
    if (ic) { ic.stopPlay(true); ic.setDoc(doc); }
    renderHead(); renderScore(msg || 'Trace stroke 1. The little brass dot shows where to start.'); drawGuide();
  }
  function selectCourse(i) { st.c = i; st.g = 0; renderTabs(); renderGlyphs(); resetAttempt(); }
  function selectGlyph(i) {
    var n = course().glyphs.length;
    st.g = (i + n) % n; renderGlyphs(); resetAttempt();
    if (IW.audio) IW.audio.rustle();
  }

  function praise(s) {
    if (s >= 92) return 'Exquisite. The ghost is jealous.';
    if (s >= 80) return 'Lovely. A medieval scribe would nod approvingly.';
    if (s >= 65) return 'Getting there — hug the ghost a little closer.';
    if (s >= 45) return 'A bold interpretation. Try tracing the ghost.';
    return 'Abstract expressionism! Now let’s try the lesson one.';
  }

  function onStroke(d, s) {
    if (!s || s.tool === 'stamp' || st.done) return;
    var g = glyph();
    var user = s.pts.map(function (q) { return toGlyph(q); });
    var res = score(user, g.strokes[st.k].poly), note = '';
    for (var j = st.k + 1; j < g.strokes.length; j++) {
      var alt = score(user, g.strokes[j].poly);
      if (alt.score > 60 && alt.score > res.score + 25) { note = ' That looks like stroke ' + (j + 1) + ' — follow the numbers.'; res.score = Math.round(res.score * 0.7); break; }
    }
    if (res.reversed) note = ' Right shape, wrong direction — start at the brass dot.';
    st.results[st.k] = res;
    st.k++;
    if (st.k >= g.strokes.length) {
      st.done = true;
      var avg = Math.round(st.results.reduce(function (a, r) { return a + r.score; }, 0) / st.results.length);
      var key = gid(), prev = st.best[key];
      var nb = prev == null || avg > prev;
      if (nb) { st.best[key] = avg; IW.db.kvSet('scores', st.best); }
      if (IW.audio) IW.audio.chime(stars(avg));
      renderGlyphs();
      renderHead();
      renderScore(praise(avg) + note + (nb && prev != null ? ' New personal best!' : '') + ' Tap “Again” or “Next”.');
      var sp = el('scorePanel');
      sp.classList.remove('pop'); void sp.offsetWidth; sp.classList.add('pop');
    } else {
      renderHead();
      renderScore('Stroke ' + st.k + ': ' + res.score + '. ' + praise(res.score) + note);
    }
    drawGuide();
  }

  L.demo = function () {
    if (!ic) return;
    var c = course(), g = glyph(), pn = pen();
    prepGlyph(g);
    var items = g.strokes.map(function (s, i) { return simulate(c, s, pn, pn.color, 1, i); });
    var btn = el('lsDemo');
    btn.disabled = true;
    ic.play({
      items: items, speed: 1.2,
      onEnd: function () { btn.disabled = false; ic.redraw(); }
    });
    el('scoreMsg').textContent = 'Watch closely: start point, direction, and where the pressure goes.';
  };

  L.init = function (best) {
    st.best = best || {};
    doc = { id: 'lesson', type: 'lesson', W: W, H: H, paper: course().paper, ruling: 'none', seed: 21, strokes: [] };
    ic = new E.InkCanvas(el('lessonSheet'), {
      W: W, H: H,
      getPen: pen,
      onResize: function () { drawGuide(); },
      onChange: onStroke,
      beforeStroke: function () {
        if (st.done) { U.toast('Tap “Again” to try once more — or admire your work a little longer.'); return false; }
        return true;
      }
    });
    ic.setDoc(doc);
    renderTabs(); renderGlyphs(); renderHead(); renderScore(); drawGuide();

    el('courseTabs').addEventListener('click', function (e) {
      var b = e.target.closest('[data-c]'); if (b) selectCourse(+b.getAttribute('data-c'));
    });
    el('courseTabs').addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var n = COURSES.length, i = (st.c + (e.key === 'ArrowRight' ? 1 : n - 1)) % n;
      selectCourse(i);
      var b = el('courseTabs').querySelector('[data-c="' + i + '"]'); if (b) b.focus();
    });
    el('glyphList').addEventListener('click', function (e) {
      var b = e.target.closest('[data-g]'); if (b) selectGlyph(+b.getAttribute('data-g'));
    });
    el('lsPrev').addEventListener('click', function () { selectGlyph(st.g - 1); });
    el('lsNext').addEventListener('click', function () { selectGlyph(st.g + 1); });
    el('lsRetry').addEventListener('click', function () { resetAttempt('Fresh page. The ghost believes in you.'); });
    el('lsDemo').addEventListener('click', L.demo);
    el('lsGhost').addEventListener('click', function () {
      st.ghost = !st.ghost; renderHead(); drawGuide();
      U.toast(st.ghost ? 'Ghost returns, dragging its chains politely.' : 'Memory mode: only the start dots remain. No pressure. (Well — some pressure.)');
    });
    el('lessonPen').addEventListener('change', function (e) { st.override = e.target.value; drawGuide(); });
  };
  L.resize = function () { if (ic) ic.resize(); };
  L.stop = function () { if (ic) ic.stopPlay(true); };
  /* exposed for tests */
  L._score = score; L._parse = parsePath;
})();
