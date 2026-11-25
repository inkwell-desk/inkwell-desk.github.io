/* Inkwell — app shell: trays, desk, library, routing, themes, shortcuts, easter eggs */
(function () {
  'use strict';
  var IW = window.IW = window.IW || {};
  var U = IW.util, E = IW.engine, P = IW.paper, X = IW.exporter, DB = IW.db;
  var A = IW.app = {};
  function el(id) { return U.byId(id); }

  var DEFAULT_SIZES = { fountain: 5, italic: 14, dip: 7, brush: 16, marker: 10, pencil: 4 };
  A.pen = { tool: 'fountain', color: '#1d2b4f', size: 5, sizes: JSON.parse(JSON.stringify(DEFAULT_SIZES)), smooth: 0.3, nib: 40, bleed: 0.5, pressure: 'auto', penOnly: false };
  var desk = null, deskDoc = null, view = 'desk', zoom = 1, deskPrefs = { paper: 'cotton', ruling: 'none' };
  var JOKES = [
    'Our pens never run dry. Your excuses might.',
    'Calligraphy: the art of making one letter take twenty minutes.',
    'Undo is just an eraser with better PR.',
    'Ink is simply water that has made a commitment.',
    'We tried writing a joke about paper. It was tearable.',
    'No fountain pens were harmed in the making of this desk.'
  ];

  /* ---------- shared SVG gradients for the pen icons ---------- */
  function injectDefs() {
    var d = document.createElement('div');
    d.setAttribute('aria-hidden', 'true');
    d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    d.innerHTML = '<svg width="0" height="0"><defs>' +
      '<linearGradient id="pgBrass" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#f7e3a6"/><stop offset=".5" stop-color="#c9a24a"/><stop offset="1" stop-color="#7a5a1e"/></linearGradient>' +
      '<linearGradient id="pgSteel" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#f2f4f7"/><stop offset=".5" stop-color="#9aa3ad"/><stop offset="1" stop-color="#4b525a"/></linearGradient>' +
      '<linearGradient id="pgLacq" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#3a59a8"/><stop offset=".45" stop-color="#14224f"/><stop offset="1" stop-color="#070d22"/></linearGradient>' +
      '<linearGradient id="pgOx" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#a5464a"/><stop offset=".5" stop-color="#5e1a1e"/><stop offset="1" stop-color="#2a0a0c"/></linearGradient>' +
      '<linearGradient id="pgWood" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#d9a36a"/><stop offset=".5" stop-color="#8a5228"/><stop offset="1" stop-color="#4a2a12"/></linearGradient>' +
      '</defs></svg>';
    document.body.appendChild(d);
  }

  function penSVG(tool, ink) {
    var s = '<svg viewBox="0 0 120 28" class="pen-svg" aria-hidden="true">';
    switch (tool) {
      case 'fountain':
        s += '<path d="M3 14 L24 8.5 L30 8.5 L30 19.5 L24 19.5 Z" fill="url(#pgBrass)"/><path d="M6 14 L24 14" stroke="#5a3f12" stroke-width=".8"/><circle cx="22" cy="14" r="1.3" fill="#5a3f12"/>' +
          '<rect x="30" y="8" width="16" height="12" rx="2" fill="#111"/><rect x="46" y="6" width="58" height="16" rx="6" fill="url(#pgLacq)"/>' +
          '<rect x="50" y="11" width="9" height="6" rx="2" fill="' + ink + '" opacity=".95"/><rect x="62" y="6" width="4" height="16" fill="url(#pgBrass)"/>' +
          '<rect x="70" y="3" width="34" height="3" rx="1.5" fill="url(#pgBrass)"/><rect x="102" y="7" width="15" height="14" rx="6" fill="url(#pgLacq)"/>';
        break;
      case 'italic':
        s += '<path d="M3 9 L3 19 L24 20 L30 20 L30 8 L24 8 Z" fill="url(#pgBrass)"/><path d="M8 14 L26 14" stroke="#5a3f12" stroke-width=".8"/>' +
          '<rect x="30" y="7.5" width="12" height="13" fill="url(#pgSteel)"/><path d="M42 7 L112 8.5 Q118 14 112 19.5 L42 21 Z" fill="url(#pgOx)"/>' +
          '<path d="M46 9.5 L108 10.5" stroke="#fff" stroke-opacity=".25" stroke-width="1.2"/>';
        break;
      case 'dip':
        s += '<path d="M2 14 L18 10.5 L22 10.5 L22 17.5 L18 17.5 Z" fill="url(#pgSteel)"/><path d="M4 14 L18 14" stroke="#333" stroke-width=".6"/>' +
          '<rect x="22" y="10" width="12" height="8" rx="1" fill="url(#pgBrass)"/><path d="M34 9.5 L110 11 Q117 14 110 17 L34 18.5 Z" fill="url(#pgWood)"/>' +
          '<path d="M40 11.5 L104 12.3" stroke="#fff" stroke-opacity=".2" stroke-width="1"/>';
        break;
      case 'brush':
        s += '<path d="M1 14 Q12 6 30 8.5 L30 19.5 Q12 22 1 14 Z" fill="' + ink + '"/><path d="M6 13 Q16 10 28 11" stroke="#fff" stroke-opacity=".18" fill="none"/>' +
          '<rect x="30" y="8" width="7" height="12" rx="1" fill="url(#pgBrass)"/><rect x="37" y="9" width="79" height="10" rx="5" fill="#cfae74"/>' +
          '<path d="M64 9 V19 M92 9 V19" stroke="#8a6a36" stroke-width="1.6"/><path d="M40 11 H112" stroke="#fff" stroke-opacity=".3" stroke-width="1"/>';
        break;
      case 'marker':
        s += '<path d="M3 11 L14 9.5 L14 18.5 L3 17 Z" fill="' + ink + '"/><rect x="14" y="7" width="70" height="14" rx="4" fill="#ece6d8"/>' +
          '<rect x="22" y="11" width="40" height="6" rx="1" fill="' + ink + '" opacity=".25"/><rect x="84" y="6" width="32" height="16" rx="5" fill="' + ink + '"/>' +
          '<path d="M18 9 H80" stroke="#fff" stroke-opacity=".6" stroke-width="1.2"/>';
        break;
      case 'pencil':
        s += '<path d="M2 14 L10 12 L10 16 Z" fill="#2f2f33"/><path d="M10 12 L26 7 L26 21 L10 16 Z" fill="#e8c897"/>' +
          '<rect x="26" y="7" width="76" height="14" fill="#e3a823"/><path d="M26 11.5 H102 M26 16.5 H102" stroke="#b97f12" stroke-width="1"/>' +
          '<rect x="102" y="7" width="7" height="14" fill="url(#pgSteel)"/><rect x="109" y="7" width="9" height="14" rx="3" fill="#e88a8a"/>';
        break;
      case 'eraser':
        s += '<g transform="rotate(-6 60 14)"><rect x="28" y="6" width="64" height="16" rx="3" fill="#f0b7b0"/><rect x="28" y="6" width="24" height="16" rx="3" fill="#3b5fa8"/><path d="M30 9 H90" stroke="#fff" stroke-opacity=".45"/></g>';
        break;
      default:
        s += '<g transform="translate(47,0)"><path d="M6 24 C2 20 2 15 4 13 L6 14 L6 6 a2 2 0 0 1 4 0 L10 12 L10 4 a2 2 0 0 1 4 0 L14 12 L14 5 a2 2 0 0 1 4 0 L18 13 L18 8 a2 2 0 0 1 4 0 L22 18 C22 23 19 27 14 27 L10 27 C8 27 7 26 6 24 Z" fill="#ead7b6" stroke="#5a3f12" stroke-width="1"/></g>';
    }
    return s + '</svg>';
  }
  function bottleSVG(c) {
    return '<svg viewBox="0 0 32 40" aria-hidden="true"><path d="M10 6h12v5l4 4v19a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V15l4-4z" fill="rgba(255,255,255,.14)" stroke="url(#pgBrass)" stroke-width="1.2"/>' +
      '<path class="ink-lvl" d="M7 21 Q16 18 25 21 V34 a3 3 0 0 1-3 3 H10 a3 3 0 0 1-3-3Z" fill="' + c + '"/><rect x="9.5" y="1.5" width="13" height="5.5" rx="1.5" fill="url(#pgBrass)"/>' +
      '<path d="M10 17 v14" stroke="#fff" stroke-opacity=".4" stroke-width="1.5" stroke-linecap="round"/></svg>';
  }

  /* ---------- the pen tray (built twice: desk + journal, kept in sync) ---------- */
  var trays = [];
  function buildTray(host, compact) {
    var h = '<div class="tray-sec"><h3 class="tray-h">Instruments</h3><div class="pen-rack" role="radiogroup" aria-label="Writing instrument">';
    E.ORDER.forEach(function (t, i) {
      h += '<button type="button" class="pen-btn" role="radio" aria-checked="false" data-tool="' + t + '" title="' + U.esc(E.TOOLS[t].label + ' (' + (i + 1) + ')') + '">' +
        penSVG(t, A.pen.color) + '<span class="pen-name">' + U.esc(E.TOOLS[t].label) + '</span><kbd>' + (i + 1) + '</kbd></button>';
    });
    h += '</div></div><div class="tray-sec"><h3 class="tray-h">Inks</h3><div class="ink-row" role="radiogroup" aria-label="Ink colour">';
    E.INKS.forEach(function (k) {
      h += '<button type="button" class="ink-btn" role="radio" aria-checked="false" data-ink="' + k.c + '" title="' + U.esc(k.name) + '" aria-label="' + U.esc(k.name) + ' ink">' + bottleSVG(k.c) + '</button>';
    });
    h += '<label class="ink-custom-wrap" title="Mix your own ink"><span class="sr-only">Custom ink colour</span><input type="color" class="ink-custom" value="#1d2b4f"></label></div></div>' +
      '<div class="tray-sec sliders">' +
      '<label class="field"><span>Nib size <output class="o-size"></output></span><input type="range" class="r-size" min="1" max="40" step="0.5"></label>' +
      '<label class="field"><span>Steadiness <output class="o-smooth"></output></span><input type="range" class="r-smooth" min="0" max="0.85" step="0.05"></label>' +
      '<label class="field f-nib"><span>Nib angle <output class="o-nib"></output></span><input type="range" class="r-nib" min="0" max="90" step="1"></label>' +
      '<label class="field f-bleed"><span>Ink flow &amp; bleed <output class="o-bleed"></output></span><input type="range" class="r-bleed" min="0" max="1" step="0.05"></label>' +
      (compact ? '' : '<label class="field"><span>Pressure source</span><select class="s-pressure brass-select small"><option value="auto">Auto (stylus, else speed)</option><option value="velocity">Speed only</option><option value="fixed">Fixed (no pressure)</option></select></label>') +
      '<label class="check"><input type="checkbox" class="c-penonly"> <span>Stylus only (palm rejection)</span></label>' +
      '</div><p class="tool-hint" aria-live="polite"></p>';
    host.innerHTML = h;
    host.addEventListener('click', function (e) {
      var b = e.target.closest('[data-tool]');
      if (b) { setTool(b.getAttribute('data-tool')); return; }
      var k = e.target.closest('[data-ink]');
      if (k) { A.pen.color = k.getAttribute('data-ink'); syncTrays(); savePen(); if (IW.audio) IW.audio.click(); }
    });
    host.addEventListener('input', function (e) {
      var t = e.target, c = t.className || '';
      if (c.indexOf('r-size') >= 0) { A.pen.size = +t.value; if (A.pen.sizes[A.pen.tool] != null) A.pen.sizes[A.pen.tool] = A.pen.size; }
      else if (c.indexOf('r-smooth') >= 0) A.pen.smooth = +t.value;
      else if (c.indexOf('r-nib') >= 0) A.pen.nib = +t.value;
      else if (c.indexOf('r-bleed') >= 0) A.pen.bleed = +t.value;
      else if (c.indexOf('ink-custom') >= 0) A.pen.color = t.value;
      else return;
      syncTrays(t); savePen();
    });
    host.addEventListener('change', function (e) {
      var t = e.target, c = t.className || '';
      if (c.indexOf('s-pressure') >= 0) A.pen.pressure = t.value;
      else if (c.indexOf('c-penonly') >= 0) A.pen.penOnly = t.checked;
      else return;
      syncTrays(t); savePen();
    });
    host.addEventListener('keydown', function (e) {
      var b = e.target.closest('[role="radio"]');
      if (!b || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
      var group = U.$$('[role="radio"]', b.parentNode), i = group.indexOf(b);
      var n = group[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : group.length - 1)) % group.length];
      e.preventDefault(); n.focus(); n.click();
    });
    trays.push(host);
  }
  function syncTrays(src) {
    var p = A.pen;
    trays.forEach(function (host) {
      U.$$('.pen-btn', host).forEach(function (b) {
        var on = b.getAttribute('data-tool') === p.tool;
        b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1;
      });
      var anyInk = false;
      U.$$('.ink-btn', host).forEach(function (b) {
        var on = b.getAttribute('data-ink').toLowerCase() === String(p.color).toLowerCase();
        anyInk = anyInk || on;
        b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1;
      });
      if (!anyInk) { var first = U.$('.ink-btn', host); if (first) first.tabIndex = 0; }
      function setv(sel, v) { var i = U.$(sel, host); if (i && i !== src) { if (i.type === 'checkbox') i.checked = !!v; else i.value = v; } }
      setv('.r-size', p.size); setv('.r-smooth', p.smooth); setv('.r-nib', p.nib); setv('.r-bleed', p.bleed);
      setv('.s-pressure', p.pressure); setv('.c-penonly', p.penOnly);
      if (/^#[0-9a-f]{6}$/i.test(p.color)) setv('.ink-custom', p.color);
      var o;
      if ((o = U.$('.o-size', host))) o.textContent = p.size;
      if ((o = U.$('.o-smooth', host))) o.textContent = Math.round(p.smooth * 100) + '%';
      if ((o = U.$('.o-nib', host))) o.textContent = p.nib + '°';
      if ((o = U.$('.o-bleed', host))) o.textContent = Math.round(p.bleed * 100) + '%';
      var fn = U.$('.f-nib', host); if (fn) fn.hidden = p.tool !== 'italic';
      var fb = U.$('.f-bleed', host); if (fb) fb.hidden = !(p.tool in { fountain: 1, italic: 1, dip: 1, brush: 1 });
      var hint = U.$('.tool-hint', host); if (hint) hint.textContent = E.TOOLS[p.tool].hint;
      U.$$('.pen-btn[data-tool="brush"] path:first-child, .pen-btn[data-tool="marker"] path:first-child', host).forEach(function (pp) { pp.setAttribute('fill', p.color); });
      host.style.setProperty('--ink', p.color);
    });
    document.body.setAttribute('data-tool', p.tool);
  }
  function setTool(t) {
    if (!E.TOOLS[t]) return;
    A.pen.tool = t;
    if (A.pen.sizes[t] != null) A.pen.size = A.pen.sizes[t];
    syncTrays(); savePen();
    if (IW.audio) IW.audio.click();
  }
  var savePen = U.debounce(function () { DB.kvSet('pen', A.pen); }, 400);

  /* ---------- save indicator & gauge ---------- */
  function setSave(state, doc) {
    var s = el('saveState'); if (!s) return;
    s.className = 'save-state ' + state;
    var t = U.$('.save-text', s);
    if (state === 'saving') t.textContent = 'Blotting…';
    else if (state === 'err') t.textContent = 'Save failed — export to be safe';
    else if (DB.mode === 'memory') t.textContent = 'Memory only — export to keep';
    else t.textContent = 'Saved' + (doc && doc.strokes ? ' · ' + doc.strokes.length + ' stroke' + (doc.strokes.length === 1 ? '' : 's') : '');
  }
  A.persist = function (doc) {
    doc._saved = true;
    setSave('saving');
    DB.saveSoon(doc, function (err) { setSave(err ? 'err' : 'saved', doc); });
  };
  var gaugeRaf = 0, gv = null;
  A.gauge = function (p, tx, ty, type) {
    gv = [p, tx, ty, type];
    if (gaugeRaf) return;
    gaugeRaf = requestAnimationFrame(function () {
      gaugeRaf = 0;
      var n = el('gaugeNeedle'), l = el('gaugeLabel'), tl = el('gaugeTilt');
      if (!n || !gv) return;
      n.setAttribute('transform', 'rotate(' + Math.round(-80 + gv[0] * 160) + ' 40 42)');
      var tm = Math.round(Math.min(60, Math.sqrt(gv[1] * gv[1] + gv[2] * gv[2])));
      if (tl) tl.setAttribute('transform', 'rotate(' + Math.round(Math.atan2(gv[2], gv[1]) * 180 / Math.PI) + ' 68 10)');
      l.textContent = 'pressure ' + gv[0].toFixed(2) + (gv[3] === 'pen' ? ' · tilt ' + tm + '° · stylus' : ' · ' + (gv[3] || 'mouse') + ' (speed)');
    });
  };
  var palmT = 0;
  A.palm = function () {
    if (Date.now() - palmT < 6000) return;
    palmT = Date.now();
    U.toast('Stylus-only mode is on — fingers are politely ignored. Your palm says thanks.');
  };

  /* ---------- playback toggle (shared) ---------- */
  A.togglePlay = function (ic, btn) {
    if (!ic || !ic.doc) return;
    if (ic.playing) { ic.stopPlay(); return; }
    if (!ic.doc.strokes.length) { U.toast('Nothing to replay yet — write something first. I’ll wait.'); return; }
    var lbl = U.$('.lbl', btn);
    btn.classList.add('on'); btn.setAttribute('aria-pressed', 'true'); if (lbl) lbl.textContent = 'Stop';
    ic.play({
      speed: +el('deskSpeed').value || 2,
      onEnd: function (complete) {
        btn.classList.remove('on'); btn.setAttribute('aria-pressed', 'false'); if (lbl) lbl.textContent = 'Watch me write';
        if (complete) U.toast('Fin. Take a bow — or replay it at 8×. Very motivational.');
      }
    });
  };
  A.setCurrentJournal = function () { /* hook for future use */ };

  /* ---------- desk ---------- */
  function newSheetDoc() {
    return { id: U.uid('sheet'), type: 'sheet', title: 'Untitled sheet', paper: deskPrefs.paper, ruling: deskPrefs.ruling, W: 1000, H: 1300, seed: (U.seed() % 100000) + 1, strokes: [], created: Date.now(), updated: Date.now() };
  }
  function setDeskDoc(doc) {
    deskDoc = doc;
    if (!doc.strokes) doc.strokes = [];
    desk.setDoc(doc);
    el('deskTitle').value = doc.title || 'Untitled sheet';
    el('deskPaper').value = doc.paper;
    el('deskRuling').value = doc.ruling || 'none';
    el('paperDesc').textContent = P.get(doc.paper).desc;
    deskUI();
    DB.kvSet('lastSheet', doc.id);
  }
  A.openSheet = setDeskDoc;
  function deskUI() {
    var n = deskDoc ? deskDoc.strokes.length : 0;
    el('deskCount').textContent = n + ' stroke' + (n === 1 ? '' : 's');
    el('deskEmpty').classList.toggle('gone', n > 0);
  }
  function initDesk() {
    desk = new E.InkCanvas(el('deskSheet'), {
      W: 1000, H: 1300,
      getPen: function () { return A.pen; },
      scroller: el('deskScroller'),
      onChange: function (doc) { A.persist(doc); deskUI(); },
      onPointer: A.gauge,
      onPalm: A.palm,
      onStart: function () { el('deskEmpty').classList.add('gone'); }
    });
    el('deskPaper').innerHTML = P.ids.map(function (id) { return '<option value="' + id + '">' + U.esc(P.get(id).name) + '</option>'; }).join('');
    el('deskTitle').addEventListener('input', U.debounce(function (e) {
      if (!deskDoc) return;
      deskDoc.title = (e.target.value || '').trim().slice(0, 80) || 'Untitled sheet';
      A.persist(deskDoc);
    }, 400));
    el('deskPaper').addEventListener('change', function (e) {
      deskDoc.paper = deskPrefs.paper = e.target.value;
      el('paperDesc').textContent = P.get(deskDoc.paper).desc;
      desk.drawPaper(); desk.redraw();
      if (deskDoc._saved) A.persist(deskDoc);
      DB.kvSet('deskPrefs', deskPrefs);
      if (IW.audio) IW.audio.rustle();
      var s = el('deskSheet'); s.classList.remove('swap'); void s.offsetWidth; s.classList.add('swap');
    });
    el('deskRuling').addEventListener('change', function (e) {
      deskDoc.ruling = deskPrefs.ruling = e.target.value;
      desk.drawPaper();
      if (deskDoc._saved) A.persist(deskDoc);
      DB.kvSet('deskPrefs', deskPrefs);
    });
    el('deskNew').addEventListener('click', function () {
      setDeskDoc(newSheetDoc());
      if (IW.audio) IW.audio.rustle();
      U.toast('A fresh sheet. Smells like possibility (and a little like cotton).');
    });
    el('deskUndo').addEventListener('click', function () { if (!desk.undo()) U.toast('Nothing to undo. Your past is spotless.'); });
    el('deskRedo').addEventListener('click', function () { if (!desk.redo()) U.toast('Nothing to redo. The future is unwritten.'); });
    el('deskClear').addEventListener('click', function () {
      if (!deskDoc.strokes.length) { U.toast('Already blank. Impressively blank.'); return; }
      U.confirm('Clear the whole sheet? (Undo can bring it back while this page is open.)', 'Clear it').then(function (ok) {
        if (ok) { desk.clear(); deskUI(); }
      });
    });
    el('deskPlay').addEventListener('click', function () { A.togglePlay(desk, el('deskPlay')); });
    el('deskZoom').addEventListener('click', function () {
      zoom = zoom === 1 ? 1.5 : zoom === 1.5 ? 2 : 1;
      el('deskSheet').style.setProperty('--z', zoom);
      el('deskZoom').textContent = zoom + '×';
      el('deskScroller').classList.toggle('zoomed', zoom > 1);
      if (zoom > 1) U.toast('Zoomed ' + zoom + '×. Use the Hand tool (8) to pan around.');
    });
    var menu = el('deskExportMenu'), mb = el('deskExportBtn');
    function closeMenu() { menu.hidden = true; mb.setAttribute('aria-expanded', 'false'); }
    A.closeMenu = closeMenu;
    mb.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = menu.hidden;
      menu.hidden = !open; mb.setAttribute('aria-expanded', String(open));
      if (open) { var f = U.$('button', menu); if (f) f.focus(); }
    });
    document.addEventListener('click', function (e) { if (!menu.hidden && !menu.contains(e.target)) closeMenu(); });
    el('exPng').addEventListener('click', function () {
      closeMenu();
      X.downloadPNG(deskDoc).then(function () { U.toast('PNG saved at 2×. Crisp enough to frame.'); }).catch(function () { U.toast('Could not create the PNG on this device.', 'err'); });
    });
    el('exSvg').addEventListener('click', function () { closeMenu(); X.downloadSVG(deskDoc); U.toast('SVG saved — every stroke is a real vector path.'); });
    el('exInk').addEventListener('click', function () { closeMenu(); X.downloadInkwell([deskDoc], deskDoc.title); U.toast('.inkwell saved. It replays anywhere Inkwell lives.'); });
    el('deskImport').addEventListener('click', function () { el('importFile').click(); });
  }

  /* ---------- import ---------- */
  function importFile(file) {
    if (!file) return;
    if (file.size > 40 * 1024 * 1024) { U.toast('That file is heavier than a leather-bound atlas. Max 40 MB.', 'err'); return; }
    var r = new FileReader();
    r.onload = function () {
      var res;
      try { res = X.parse(String(r.result)); } catch (e) { U.toast('That doesn’t look like an .inkwell file. (We checked twice.)', 'err'); return; }
      if (!res.docs.length) { U.toast('The file was empty. Like a fresh notebook, but sadder.'); return; }
      var chain = Promise.resolve(), firstSheet = null, count = 0;
      res.docs.forEach(function (d) {
        chain = chain.then(function () { return DB.get(d.id); }).then(function (ex) {
          if (ex) {
            if (d.type === 'journal' && !((ex.strokes && ex.strokes.length) || ex.note)) { /* overwrite empty day */ }
            else { d.id = U.uid('sheet'); d.type = 'sheet'; delete d.date; d.title = (d.title || 'Page') + ' (imported)'; }
          }
          d._saved = true; count++;
          if (!firstSheet && d.type === 'sheet') firstSheet = d;
          return DB.put(d);
        });
      });
      chain.then(function () {
        U.toast('Imported ' + count + ' page' + (count === 1 ? '' : 's') + '. Welcome home, little vectors.');
        if (firstSheet && view === 'desk') setDeskDoc(firstSheet);
        if (view === 'library') renderLibrary();
        refreshJournalEntries();
      }).catch(function () { U.toast('Import hit a snag while saving.', 'err'); });
    };
    r.onerror = function () { U.toast('Could not read that file.', 'err'); };
    r.readAsText(file);
  }

  /* ---------- library ---------- */
  var libDocs = [];
  function hasContent(d) { return !!((d.strokes && d.strokes.length) || (d.note && d.note.trim())); }
  function renderLibrary() {
    return DB.all().then(function (all) {
      libDocs = all.filter(function (d) { return d && (d.type === 'sheet' || d.type === 'journal') && (hasContent(d) || d._saved); });
      libDocs.sort(function (a, b) { return (b.updated || 0) - (a.updated || 0); });
      drawLibrary();
    });
  }
  function drawLibrary() {
    var q = (el('libSearch').value || '').toLowerCase().trim(), f = el('libFilter').value;
    var list = libDocs.filter(function (d) { return (f === 'all' || d.type === f) && (!q || String(d.title || '').toLowerCase().indexOf(q) >= 0); });
    var grid = el('libGrid');
    el('libEmpty').hidden = list.length > 0;
    if (!list.length && libDocs.length) {
      el('libEmpty').hidden = true;
      grid.innerHTML = '<p class="lib-none">No pages match “' + U.esc(q) + '”. Perhaps it was written in invisible ink.</p>';
      return;
    }
    grid.innerHTML = list.map(function (d) {
      var n = (d.strokes || []).length;
      return '<article class="lib-card" role="listitem" data-id="' + U.esc(d.id) + '">' +
        '<div class="thumb"><canvas width="10" height="13" aria-hidden="true"></canvas><span class="badge ' + d.type + '">' + (d.type === 'journal' ? 'Journal' : 'Sheet') + '</span>' + (d.sealed ? '<span class="badge sealed">Sealed</span>' : '') + '</div>' +
        '<h3 class="lib-title">' + U.esc(d.title || 'Untitled') + '</h3>' +
        '<p class="meta">' + n + ' stroke' + (n === 1 ? '' : 's') + ' · ' + U.esc(P.get(d.paper).name) + ' · ' + U.esc(U.fmtWhen(d.updated)) + '</p>' +
        '<div class="lib-actions">' +
        '<button class="brass-btn small" data-act="open" data-id="' + U.esc(d.id) + '">Open</button>' +
        '<button class="brass-btn small" data-act="play" data-id="' + U.esc(d.id) + '">▶ Replay</button>' +
        '<button class="brass-btn small" data-act="dup" data-id="' + U.esc(d.id) + '">Duplicate</button>' +
        '<button class="brass-btn small" data-act="export" data-id="' + U.esc(d.id) + '">Export</button>' +
        '<button class="brass-btn small danger" data-act="del" data-id="' + U.esc(d.id) + '" aria-label="Delete ' + U.esc(d.title || 'page') + '">Delete</button>' +
        '</div></article>';
    }).join('');
    var cards = U.$$('.lib-card', grid), i = 0, token = ++thumbToken;
    (function next() {
      if (token !== thumbToken || i >= cards.length) return;
      var card = cards[i++], d = findDoc(card.getAttribute('data-id')), cv = U.$('canvas', card);
      if (d && cv) {
        var w = Math.round(Math.min(320, card.clientWidth || 240) * U.dpr());
        cv.width = w; cv.height = Math.round(w * (d.H || 1300) / (d.W || 1000));
        try { E.renderDocTo(cv, d, true, true); } catch (e) { /* skip broken thumb */ }
      }
      setTimeout(next, 16);
    })();
  }
  var thumbToken = 0;
  function findDoc(id) { for (var i = 0; i < libDocs.length; i++) if (libDocs[i].id === id) return libDocs[i]; return null; }
  function openDoc(d, andPlay) {
    if (d.type === 'journal' && d.date) {
      location.hash = '#journal';
      IW.journal.open(d.date).then(function () {
        if (andPlay) setTimeout(function () { A.togglePlay(IW.journal.canvas(), el('jPlay')); }, 450);
      });
    } else {
      setDeskDoc(d);
      location.hash = '#desk';
      if (andPlay) setTimeout(function () { A.togglePlay(desk, el('deskPlay')); }, 450);
    }
  }
  function initLibrary() {
    el('libSearch').addEventListener('input', U.debounce(drawLibrary, 150));
    el('libFilter').addEventListener('change', drawLibrary);
    el('libNew').addEventListener('click', function () { setDeskDoc(newSheetDoc()); location.hash = '#desk'; });
    el('libImport').addEventListener('click', function () { el('importFile').click(); });
    el('libExportAll').addEventListener('click', function () {
      DB.all().then(function (all) {
        var docs = all.filter(function (d) { return d && (d.type === 'sheet' || d.type === 'journal') && hasContent(d); });
        if (!docs.length) { U.toast('Nothing to export yet. The drawer echoes.'); return; }
        X.downloadInkwell(docs, 'inkwell-library-' + U.dateKey());
        U.toast('Exported ' + docs.length + ' page' + (docs.length === 1 ? '' : 's') + ' as one .inkwell file.');
      });
    });
    el('libGrid').addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var d = findDoc(b.getAttribute('data-id')); if (!d) return;
      var act = b.getAttribute('data-act');
      if (act === 'open') openDoc(d, false);
      else if (act === 'play') openDoc(d, true);
      else if (act === 'export') X.downloadInkwell([d], d.title);
      else if (act === 'dup') {
        var c = JSON.parse(JSON.stringify(d));
        c.id = U.uid('sheet'); c.type = 'sheet'; delete c.date; c.sealed = false;
        c.title = ('Copy of ' + (d.title || 'page')).slice(0, 80); c.created = Date.now();
        A.persist(c);
        setTimeout(renderLibrary, 250);
        U.toast('Duplicated. Now there are two of them. Be careful.');
      } else if (act === 'del') {
        U.confirm('Delete “' + (d.title || 'this page') + '” forever? There is no wastepaper basket to rummage through.', 'Delete').then(function (ok) {
          if (!ok) return;
          DB.del(d.id).then(function () {
            if (deskDoc && deskDoc.id === d.id) setDeskDoc(newSheetDoc());
            var jd = IW.journal.current();
            if (jd && jd.id === d.id) IW.journal.open(jd.date);
            refreshJournalEntries();
            renderLibrary();
            U.toast('Deleted. It is now a very abstract artwork.');
          });
        });
      }
    });
  }

  function refreshJournalEntries() {
    return DB.all().then(function (all) {
      var m = {};
      all.forEach(function (d) { if (d && d.type === 'journal' && d.date && hasContent(d)) m[d.date] = true; });
      A.journalEntries = m;
      if (IW.journal && IW.journal.setEntries) IW.journal.setEntries(m);
      return m;
    });
  }

  /* ---------- routing ---------- */
  var VIEWS = ['desk', 'lessons', 'journal', 'library', 'about'];
  function show(v) {
    if (VIEWS.indexOf(v) < 0) v = 'desk';
    var prev = view;
    view = v;
    VIEWS.forEach(function (n) {
      var s = el('view-' + n);
      if (s) { s.hidden = n !== v; if (n === v && prev !== v) { s.classList.remove('enter'); void s.offsetWidth; s.classList.add('enter'); } }
    });
    U.$$('[data-nav]').forEach(function (a) {
      if (a.getAttribute('data-nav') === v) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    closeNav();
    if (v !== 'lessons' && IW.lessons) IW.lessons.stop();
    if (v === 'library') renderLibrary();
    if (v === 'journal' && !IW.journal.current()) IW.journal.open(U.dateKey());
    setTimeout(function () {
      if (v === 'desk' && desk) desk.resize();
      if (v === 'lessons') IW.lessons.resize();
      if (v === 'journal') IW.journal.resize();
    }, 30);
    if (prev !== v && IW.audio) IW.audio.rustle();
  }
  function route() { show((location.hash || '#desk').slice(1)); }
  function closeNav() {
    var t = el('navToggle');
    t.setAttribute('aria-expanded', 'false'); t.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('nav-open');
  }

  /* ---------- themes & sound ---------- */
  var THEME_COLORS = { midnight: '#0b1430', ivory: '#efe6d2', oxblood: '#2a0f12', sumi: '#121214' };
  function applyTheme(t) {
    if (!THEME_COLORS[t]) t = 'midnight';
    document.body.setAttribute('data-theme', t);
    el('themeSel').value = t;
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', THEME_COLORS[t]);
    try { localStorage.setItem('iw-theme', t); } catch (e) { /* ignore */ }
  }
  function setSound(on) {
    IW.audio.on = !!on;
    var b = el('soundBtn');
    b.setAttribute('aria-pressed', String(!!on));
    b.title = on ? 'Sound is on — nib scratches, stamps & seals' : 'Sound is off — click to hear the nib';
    b.classList.toggle('on', !!on);
    if (on) { IW.audio.ensure(); IW.audio.click(); }
  }

  /* ---------- keyboard ---------- */
  function activeCanvas() { return view === 'desk' ? desk : view === 'journal' ? IW.journal.canvas() : null; }
  var eggBuf = '';
  function onKey(e) {
    var t = e.target, tag = (t && t.tagName) || '';
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(tag) || (t && t.isContentEditable);
    if (e.key === 'Escape') {
      if (A.closeMenu) A.closeMenu();
      IW.journal.disarm();
      var c0 = activeCanvas(); if (c0 && c0.playing) c0.stopPlay();
      closeNav();
      return;
    }
    if (typing) return;
    var ic = activeCanvas(), mod = e.ctrlKey || e.metaKey;
    if (mod && (e.key === 'z' || e.key === 'Z')) {
      if (ic && !ic.readOnly) { e.preventDefault(); if (e.shiftKey) ic.redo(); else ic.undo(); if (ic === desk) deskUI(); }
      return;
    }
    if (mod && (e.key === 'y' || e.key === 'Y')) { if (ic && !ic.readOnly) { e.preventDefault(); ic.redo(); if (ic === desk) deskUI(); } return; }
    if (mod || e.altKey) return;
    if (/^[1-8]$/.test(e.key) && (view === 'desk' || view === 'journal')) { setTool(E.ORDER[+e.key - 1]); return; }
    if (e.key === '[' || e.key === ']') {
      A.pen.size = U.clamp(A.pen.size + (e.key === ']' ? 1 : -1), 1, 40);
      if (A.pen.sizes[A.pen.tool] != null) A.pen.sizes[A.pen.tool] = A.pen.size;
      syncTrays(); savePen(); return;
    }
    if ((e.key === 'p' || e.key === 'P') && ic) { A.togglePlay(ic, view === 'desk' ? el('deskPlay') : el('jPlay')); }
    if (e.key.length === 1) {
      eggBuf = (eggBuf + e.key.toLowerCase()).slice(-4);
      if (eggBuf === 'meow') { eggBuf = ''; catWalk(); }
    }
  }

  /* ---------- easter eggs ---------- */
  function catWalk() {
    var layer = el('pawLayer');
    layer.innerHTML = '';
    var reduce = U.reducedMotion();
    for (var i = 0; i < 12; i++) {
      var p = document.createElement('span');
      p.className = 'paw' + (i % 2 ? ' r' : '');
      p.style.left = (6 + i * 7.6) + '%';
      p.style.top = (70 - i * 4.2 + (i % 2 ? 4 : 0)) + '%';
      p.style.animationDelay = (reduce ? 0 : i * 0.16) + 's';
      layer.appendChild(p);
    }
    layer.classList.add('go');
    if (IW.audio && IW.audio.on) { IW.audio.tone(880, 0.25, 'triangle', 0.08); IW.audio.tone(660, 0.35, 'triangle', 0.07, 0.18); }
    setTimeout(function () { layer.classList.remove('go'); layer.innerHTML = ''; }, 4200);
    DB.kvSet('paw', true);
    IW.journal.unlockPaw();
    U.toast('The desk cat walked across your work and approved. New stamp unlocked in the journal drawer. 🐾');
  }
  var brandClicks = [];
  function brandEgg() {
    var now = Date.now();
    brandClicks = brandClicks.filter(function (t) { return now - t < 2500; });
    brandClicks.push(now);
    if (brandClicks.length >= 5) {
      brandClicks = [];
      var s = el('inkSpill');
      s.classList.remove('go'); void s.offsetWidth; s.classList.add('go');
      if (IW.audio && IW.audio.on) IW.audio.squish();
      U.toast('You knocked over the inkwell. Classic. Don’t worry — digital ink, zero carpets harmed.');
    }
  }

  function intro() {
    var it = el('intro');
    if (!it) return;
    var seen = false;
    try { seen = sessionStorage.getItem('iw-intro') === '1'; sessionStorage.setItem('iw-intro', '1'); } catch (e) { /* ignore */ }
    if (seen || U.reducedMotion()) { it.remove(); return; }
    function done() { if (!it.parentNode) return; it.classList.add('done'); setTimeout(function () { it.remove(); }, 700); }
    it.addEventListener('click', done);
    setTimeout(done, 2300);
  }

  /* ---------- boot ---------- */
  function boot() {
    injectDefs();
    var t0 = 'midnight';
    try { t0 = localStorage.getItem('iw-theme') || 'midnight'; } catch (e) { /* ignore */ }
    applyTheme(t0);
    intro();
    buildTray(el('deskTrayHost'), false);
    buildTray(el('journalTrayHost'), true);
    syncTrays();
    initDesk();
    initLibrary();

    if (window.innerWidth < 900) { el('deskTrayWrap').open = false; el('journalTrayWrap').open = false; }
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
      el('deskHint').textContent = 'Tip: pick the Hand tool to scroll; a stylus gives real pressure & tilt.';
    }

    el('themeSel').addEventListener('change', function (e) { applyTheme(e.target.value); DB.kvSet('theme', e.target.value); if (IW.audio) IW.audio.click(); });
    el('soundBtn').addEventListener('click', function () { setSound(!IW.audio.on); DB.kvSet('sound', IW.audio.on); });
    el('navToggle').addEventListener('click', function () {
      var open = el('navToggle').getAttribute('aria-expanded') !== 'true';
      el('navToggle').setAttribute('aria-expanded', String(open));
      el('navToggle').setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('nav-open', open);
    });
    el('brand').addEventListener('click', brandEgg);
    el('importFile').addEventListener('change', function (e) { importFile(e.target.files && e.target.files[0]); e.target.value = ''; });
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', function (e) { if (IW.audio.on && e.target.closest && e.target.closest('.brass-btn')) IW.audio.click(); });
    window.addEventListener('hashchange', route);

    var ji = 0;
    setInterval(function () { var f = el('footJoke'); if (f) { ji = (ji + 1) % JOKES.length; f.textContent = JOKES[ji]; } }, 14000);

    Promise.all([
      DB.open(),
      DB.kvGet('pen', null), DB.kvGet('theme', null), DB.kvGet('sound', false),
      DB.kvGet('deskPrefs', null), DB.kvGet('lastSheet', null), DB.kvGet('scores', {}),
      DB.kvGet('paw', false), DB.kvGet('jPaper', 'cotton'), refreshJournalEntries()
    ]).then(function (r) {
      var pen = r[1];
      if (pen && typeof pen === 'object') {
        for (var k in A.pen) if (pen[k] != null && k !== 'sizes') A.pen[k] = pen[k];
        if (pen.sizes) for (var s in DEFAULT_SIZES) if (+pen.sizes[s] > 0) A.pen.sizes[s] = +pen.sizes[s];
        if (!E.TOOLS[A.pen.tool]) A.pen.tool = 'fountain';
      }
      syncTrays();
      if (r[2]) applyTheme(r[2]);
      if (r[3]) { /* sound stays off until a fresh gesture (autoplay rules); remember the preference visually */ el('soundBtn').classList.add('remembered'); }
      if (r[4]) { deskPrefs.paper = P.TYPES[r[4].paper] ? r[4].paper : 'cotton'; deskPrefs.ruling = r[4].ruling || 'none'; }
      IW.lessons.init(r[6]);
      IW.journal.init({ paper: P.TYPES[r[8]] ? r[8] : 'cotton', paw: !!r[7], entries: r[9] });
      var lastId = r[5];
      return (lastId ? DB.get(lastId) : Promise.resolve(null)).then(function (d) {
        setDeskDoc(d && d.type === 'sheet' ? d : newSheetDoc());
        route();
        setSave('saved', null);
        if (DB.mode === 'memory') U.toast('This browser is not letting us use IndexedDB (private mode?). Pages live in memory — export to keep them.', 'err');
      });
    }).catch(function (err) {
      if (window.console) console.warn('Inkwell boot fallback', err);
      try { IW.lessons.init({}); } catch (e) { /* ignore */ }
      try { IW.journal.init({}); } catch (e) { /* ignore */ }
      setDeskDoc(newSheetDoc());
      route();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
