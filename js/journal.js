/* Inkwell — daily journal with prompts, stamps and wax seals */
(function () {
  'use strict';
  var IW = window.IW = window.IW || {};
  var U = IW.util, E = IW.engine, S = IW.stamps;
  var J = IW.journal = {};

  var PROMPTS = [
    'What made you smile today, even a little?',
    'Describe your desk right now as if it were a museum exhibit.',
    'Write a letter to yourself one year from today.',
    'Three small things you are grateful for — the smaller, the better.',
    'A word you love the sound of. Write it beautifully, five times.',
    'If today had a colour of ink, what would it be — and why?',
    'Something you learned recently that surprised you.',
    'Describe a smell that takes you straight back to childhood.',
    'What would you tell yourself on a rough morning?',
    'Write down a kindness someone showed you.',
    'A tiny goal for tomorrow that is almost too easy.',
    'Describe the sky the last time you looked up.',
    'What are you overthinking? Write it down, then let the page hold it.',
    'Review the best thing you ate this week like a very serious food critic.',
    'A song that fits your mood, and one line about why.',
    'Who would you like to thank, and for what?',
    'Write a six-word story about today.',
    'Something you are looking forward to.',
    'If your pen could talk, what would it complain about?',
    'A place you would like to visit, and the first thing you would do there.',
    'Something you did today that past-you would be proud of.',
    'Write your name in your most elaborate hand. Flourishes encouraged.',
    'What does a perfect slow Sunday look like?',
    'A habit you would like to keep, and one you would happily retire.',
    'Describe a friend using only three objects.',
    'What did you notice today that others might have missed?',
    'Write a short note to someone you miss.',
    'The most useful mistake you have made.',
    'Five words that describe this season.',
    'If today were a chapter title, what would it be?',
    'What made you laugh recently?',
    'Draw — yes, draw — the view from where you are sitting.',
    'Write yourself a compliment. No take-backs.',
    'One thing you would like to learn this month.',
    'A memory that involves rain.',
    'What is taking up too much room in your head right now?',
    'Describe your ideal writing desk, down to the paperweight.',
    'Write a thank-you note to your hands.'
  ];
  var MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  var ic = null, doc = null, key = U.dateKey(), armed = null, sealColor = S.SEAL_COLORS[0].c, entries = {}, paperPref = 'cotton', pawOK = false, loadToken = 0;
  function el(id) { return U.byId(id); }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function hasContent(d) { return !!(d && ((d.strokes && d.strokes.length) || (d.note && d.note.trim()))); }

  function newEntry(k) {
    var pi = hash(k) % PROMPTS.length;
    return {
      id: 'journal-' + k, type: 'journal', date: k,
      title: 'Journal · ' + U.fmtDate(k, { day: 'numeric', month: 'short', year: 'numeric' }),
      header: U.fmtDate(k), subheader: PROMPTS[pi], prompt: pi,
      paper: paperPref, ruling: 'journal', W: 1000, H: 1300, seed: hash(k) % 100000 + 1,
      note: '', sealed: false, strokes: [], created: Date.now(), updated: Date.now()
    };
  }

  function save() {
    if (!doc) return;
    if (!hasContent(doc) && !doc._saved) return;
    doc._saved = true;
    entries[doc.date] = hasContent(doc);
    IW.app.persist(doc);
    renderCal();
  }

  function renderStatus() {
    el('jDate').textContent = U.fmtDate(key);
    var today = U.dateKey();
    var s = doc && doc.sealed ? 'sealed with wax' : hasContent(doc) ? (doc.strokes.length + ' stroke' + (doc.strokes.length === 1 ? '' : 's') + ' · autosaved') : key === today ? 'a fresh page' : key > today ? 'a note to future you' : 'an unwritten day';
    el('jStatus').textContent = s;
    el('jPrompt').textContent = doc ? PROMPTS[doc.prompt % PROMPTS.length] : '';
    el('sealedBanner').hidden = !(doc && doc.sealed);
    el('sealPage').disabled = !!(doc && doc.sealed);
    if (ic) ic.readOnly = !!(doc && doc.sealed);
    el('jNote').value = doc ? doc.note || '' : '';
    el('jNote').disabled = !!(doc && doc.sealed);
    el('jPaper').value = doc ? doc.paper : 'cotton';
  }

  function loadDay(k) {
    key = k;
    var tok = ++loadToken;
    disarm();
    return IW.db.get('journal-' + k).then(function (d) {
      if (tok !== loadToken) return;
      doc = d || newEntry(k);
      if (d) doc._saved = true;
      if (!doc.strokes) doc.strokes = [];
      ic.setDoc(doc);
      renderStatus(); renderCal();
      IW.app.setCurrentJournal(doc);
    });
  }
  J.open = function (k) { if (!ic) return Promise.resolve(); return loadDay(k || U.dateKey()); };
  J.setEntries = function (m) { entries = m || {}; renderCal(); };
  J.current = function () { return doc; };
  J.canvas = function () { return ic; };

  function shiftDay(n) {
    var d = U.parseKey(key); d.setDate(d.getDate() + n);
    if (IW.audio) IW.audio.rustle();
    var sh = el('journalSheet');
    sh.classList.remove('turn-l', 'turn-r'); void sh.offsetWidth; sh.classList.add(n > 0 ? 'turn-l' : 'turn-r');
    loadDay(U.dateKey(d));
  }

  /* ---------- calendar ---------- */
  function renderCal() {
    var d = U.parseKey(key), y = d.getFullYear(), m = d.getMonth();
    var first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate();
    var offset = (first.getDay() + 6) % 7, today = U.dateKey();
    var h = '<div class="cal-title">' + U.esc(U.fmtDate(first, { month: 'long', year: 'numeric' })) + '</div><div class="cal-grid">';
    ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach(function (w) { h += '<span class="cal-wd" aria-hidden="true">' + w + '</span>'; });
    for (var i = 0; i < offset; i++) h += '<span></span>';
    for (var dd = 1; dd <= days; dd++) {
      var k = y + '-' + U.pad(m + 1) + '-' + U.pad(dd);
      var cls = 'cal-d' + (entries[k] ? ' has' : '') + (k === today ? ' today' : '') + (k === key ? ' on' : '');
      h += '<button class="' + cls + '" data-k="' + k + '" aria-label="' + U.esc(U.fmtDate(k)) + (entries[k] ? ', has an entry' : '') + '">' + dd + '</button>';
    }
    el('jCal').innerHTML = h + '</div>';
  }

  /* ---------- stamps ---------- */
  function renderStampTray() {
    var tray = el('stampTray');
    tray.innerHTML = '';
    Object.keys(S.KINDS).forEach(function (kind) {
      var K = S.KINDS[kind];
      if (K.secret && !pawOK) return;
      var b = document.createElement('button');
      b.className = 'stamp-btn'; b.type = 'button';
      b.setAttribute('data-kind', kind);
      b.setAttribute('aria-pressed', 'false');
      b.title = K.label;
      b.setAttribute('aria-label', 'Stamp: ' + K.label);
      var col = kind === 'seal' ? sealColor : K.color;
      b.appendChild(S.preview(kind, col, kind === 'seal' ? letter() : kind === 'postmark' ? postText() : '', 58));
      var cap = document.createElement('span'); cap.textContent = K.label; b.appendChild(cap);
      tray.appendChild(b);
    });
  }
  function renderSealColors() {
    el('sealColors').innerHTML = S.SEAL_COLORS.map(function (c) {
      return '<button class="seal-swatch' + (c.c === sealColor ? ' on' : '') + '" role="radio" aria-checked="' + (c.c === sealColor) + '" data-c="' + c.c + '" style="--sw:' + c.c + '" title="' + U.esc(c.name) + '" aria-label="' + U.esc(c.name) + ' wax"></button>';
    }).join('');
  }
  function letter() { var v = (el('sealLetter').value || 'I').trim(); return (v || 'I').slice(0, 1).toUpperCase(); }
  function postText() { var d = U.parseKey(key); return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }

  function arm(kind) {
    if (doc && doc.sealed) { U.toast('This page is sealed. Break the seal first — dramatically.'); return; }
    armed = armed === kind ? null : kind;
    U.$$('.stamp-btn', el('stampTray')).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-kind') === armed)); });
    el('journalSheet').classList.toggle('stamp-armed', !!armed);
    if (armed) U.toast('Tap the page to stamp “' + S.KINDS[armed].label + '”. Esc to cancel.');
  }
  function disarm() {
    armed = null;
    var sh = el('journalSheet'); if (sh) sh.classList.remove('stamp-armed');
    U.$$('.stamp-btn').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
  }
  J.disarm = function () { var was = !!armed; disarm(); return was; };

  function makeStamp(kind, x, y) {
    var K = S.KINDS[kind];
    return {
      tool: 'stamp', kind: kind, x: U.r1(x), y: U.r1(y), s: kind === 'seal' ? 1 : 0.95,
      rot: U.r2((Math.random() - 0.5) * 0.36), color: kind === 'seal' ? sealColor : K.color,
      text: kind === 'seal' ? letter() : kind === 'postmark' ? postText() : '',
      seed: U.seed(), at: Date.now()
    };
  }
  function thud(kind) {
    if (IW.audio) { if (kind === 'seal') IW.audio.squish(); else IW.audio.thunk(); }
    var sh = el('journalSheet');
    sh.classList.remove('thud'); void sh.offsetWidth; sh.classList.add('thud');
    if (navigator.vibrate) { try { navigator.vibrate(12); } catch (e) { /* ignore */ } }
  }
  function onTap(x, y) {
    if (!armed || (doc && doc.sealed)) return false;
    var kind = armed;
    ic.addItem(makeStamp(kind, x, y));
    thud(kind);
    disarm();
    return true;
  }

  function sealPage() {
    if (!doc || doc.sealed) return;
    var it = makeStamp('seal', 830, 1170);
    it.rot = -0.12;
    ic.addItem(it);
    doc.sealed = true;
    thud('seal');
    save(); renderStatus();
    U.toast('Sealed. Your secrets are now officially Very Important.');
  }
  function breakSeal() {
    U.confirm('Break the wax seal and reopen this page? (The crack stays — that is how wax works.)', 'Break it').then(function (ok) {
      if (!ok) return;
      for (var i = doc.strokes.length - 1; i >= 0; i--) {
        var s = doc.strokes[i];
        if (s.tool === 'stamp' && s.kind === 'seal' && !s.broken) { s.broken = true; break; }
      }
      doc.sealed = false;
      ic.redraw(); save(); renderStatus();
      if (IW.audio) IW.audio.thunk();
      U.toast('Crack! The page is open again.');
    });
  }

  J.unlockPaw = function () { pawOK = true; renderStampTray(); };

  J.init = function (opts) {
    paperPref = opts.paper || 'cotton';
    pawOK = !!opts.paw;
    entries = opts.entries || {};
    ic = new E.InkCanvas(el('journalSheet'), {
      W: 1000, H: 1300,
      getPen: function () { return IW.app.pen; },
      scroller: el('journalSheet').parentNode,
      onTap: onTap,
      onChange: function () { save(); renderStatus(); },
      onPointer: IW.app.gauge,
      onPalm: IW.app.palm,
      onBlocked: function () { U.toast('Sealed with wax! Break the seal to write more.'); }
    });
    el('jPaper').innerHTML = IW.paper.ids.map(function (id) { return '<option value="' + id + '">' + U.esc(IW.paper.get(id).name) + '</option>'; }).join('');
    renderSealColors(); renderStampTray();

    el('jPrev').addEventListener('click', function () { shiftDay(-1); });
    el('jNext').addEventListener('click', function () { shiftDay(1); });
    el('jToday').addEventListener('click', function () { loadDay(U.dateKey()); });
    el('jShuffle').addEventListener('click', function () {
      if (!doc) return;
      if (doc.sealed) { U.toast('Sealed pages keep their prompts. Rules of wax.'); return; }
      doc.prompt = (doc.prompt + 1 + Math.floor(Math.random() * (PROMPTS.length - 1))) % PROMPTS.length;
      doc.subheader = PROMPTS[doc.prompt];
      ic.drawPaper(); save(); renderStatus();
      var p = el('jPrompt'); p.classList.remove('flip'); void p.offsetWidth; p.classList.add('flip');
    });
    el('jCal').addEventListener('click', function (e) { var b = e.target.closest('[data-k]'); if (b) loadDay(b.getAttribute('data-k')); });
    el('stampTray').addEventListener('click', function (e) { var b = e.target.closest('[data-kind]'); if (b) arm(b.getAttribute('data-kind')); });
    el('sealColors').addEventListener('click', function (e) {
      var b = e.target.closest('[data-c]'); if (!b) return;
      sealColor = b.getAttribute('data-c'); renderSealColors(); renderStampTray();
      if (IW.audio) IW.audio.click();
    });
    el('sealLetter').addEventListener('input', U.debounce(renderStampTray, 200));
    el('sealPage').addEventListener('click', sealPage);
    el('breakSeal').addEventListener('click', breakSeal);
    el('jNote').addEventListener('input', U.debounce(function (e) { if (!doc || doc.sealed) return; doc.note = e.target.value.slice(0, 8000); save(); renderStatus(); }, 400));
    el('jPaper').addEventListener('change', function (e) {
      if (!doc) return;
      doc.paper = e.target.value; paperPref = doc.paper;
      IW.db.kvSet('jPaper', paperPref);
      ic.drawPaper(); ic.redraw(); save();
      if (IW.audio) IW.audio.rustle();
    });
    el('jUndo').addEventListener('click', function () { if (!ic.readOnly && !ic.undo()) U.toast('Nothing to undo. Your past is spotless.'); });
    el('jRedo').addEventListener('click', function () { if (!ic.readOnly && !ic.redo()) U.toast('Nothing to redo.'); });
    el('jPlay').addEventListener('click', function () { IW.app.togglePlay(ic, el('jPlay')); });
    el('jPng').addEventListener('click', function () {
      if (!doc) return;
      IW.exporter.downloadPNG(doc).then(function () { U.toast('PNG saved. Frame it. Or don’t. We’re a desk, not your mum.'); })
        .catch(function () { U.toast('Could not create the PNG on this device.', 'err'); });
    });
  };
  J.resize = function () { if (ic) ic.resize(); };
})();
