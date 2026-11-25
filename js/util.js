/* Inkwell — utilities, toasts & synthesized desk sounds */
(function () {
  'use strict';
  var IW = window.IW = window.IW || {};
  var U = IW.util = {};

  U.$ = function (s, r) { return (r || document).querySelector(s); };
  U.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  U.byId = function (id) { return document.getElementById(id); };
  U.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  U.lerp = function (a, b, t) { return a + (b - a) * t; };
  U.r1 = function (v) { return Math.round(v * 10) / 10; };
  U.r2 = function (v) { return Math.round(v * 100) / 100; };

  /* mulberry32 — deterministic, so every replay of a stroke looks identical */
  U.rng = function (seed) {
    var s = (seed >>> 0) || 1;
    return function () {
      s = (s + 0x6D2B79F5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  U.seed = function () { return (Math.random() * 4294967295) >>> 0; };
  U.uid = function (p) { return p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); };
  U.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  U.reducedMotion = function () {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  };
  U.dpr = function () { return Math.min(2, window.devicePixelRatio || 1); };
  U.lowPower = (function () {
    var c = navigator.hardwareConcurrency || 4;
    var m = navigator.deviceMemory || 4;
    return c <= 2 || m <= 2;
  })();
  U.debounce = function (fn, ms) {
    var t = 0;
    return function () { var a = arguments, self = this; clearTimeout(t); t = setTimeout(function () { fn.apply(self, a); }, ms); };
  };
  U.pad = function (n) { return (n < 10 ? '0' : '') + n; };
  U.dateKey = function (d) { d = d || new Date(); return d.getFullYear() + '-' + U.pad(d.getMonth() + 1) + '-' + U.pad(d.getDate()); };
  U.parseKey = function (k) { var p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
  U.fmtDate = function (k, opt) {
    var d = typeof k === 'string' ? U.parseKey(k) : k;
    try { return d.toLocaleDateString(undefined, opt || { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
    catch (e) { return d.toDateString(); }
  };
  U.fmtWhen = function (ts) {
    if (!ts) return '';
    var d = new Date(ts);
    try { return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }); }
    catch (e) { return d.toLocaleString(); }
  };
  U.slug = function (s) { return (String(s || 'inkwell').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'inkwell').slice(0, 60); };
  U.download = function (blob, name) {
    var a = document.createElement('a');
    var url = URL.createObjectURL(blob);
    a.href = url; a.download = name; a.rel = 'noopener';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
  };
  U.hexToRgb = function (h) {
    h = String(h || '#000').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16) || 0;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  U.shade = function (hex, amt) {
    var c = U.hexToRgb(hex);
    var f = function (v) { return U.clamp(Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt)), 0, 255); };
    return 'rgb(' + f(c[0]) + ',' + f(c[1]) + ',' + f(c[2]) + ')';
  };
  U.rgba = function (hex, a) { var c = U.hexToRgb(hex); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; };

  /* ---------- toast ---------- */
  var toastT = 0;
  U.toast = function (msg, kind) {
    var el = U.byId('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'toast show' + (kind ? ' ' + kind : '');
    clearTimeout(toastT);
    toastT = setTimeout(function () { el.className = 'toast'; }, 3400);
  };

  /* ---------- confirm modal ---------- */
  U.confirm = function (msg, okLabel) {
    return new Promise(function (resolve) {
      var m = U.byId('confirmModal'), ok = U.byId('confirmOk'), no = U.byId('confirmCancel');
      if (!m) { resolve(window.confirm(msg)); return; }
      U.byId('confirmMsg').textContent = msg;
      ok.textContent = okLabel || 'Yes, do it';
      var prev = document.activeElement;
      m.hidden = false;
      setTimeout(function () { no.focus(); }, 30);
      function done(v) {
        m.hidden = true;
        ok.removeEventListener('click', y); no.removeEventListener('click', n);
        m.removeEventListener('keydown', k); m.removeEventListener('click', bg);
        if (prev && prev.focus) prev.focus();
        resolve(v);
      }
      function y() { done(true); }
      function n() { done(false); }
      function k(e) { if (e.key === 'Escape') { e.stopPropagation(); done(false); } }
      function bg(e) { if (e.target === m) done(false); }
      ok.addEventListener('click', y); no.addEventListener('click', n);
      m.addEventListener('keydown', k); m.addEventListener('click', bg);
    });
  };

  /* ---------- Web Audio: every sound is synthesized ---------- */
  var A = IW.audio = { on: false, ctx: null };
  var noiseBuf = null, scratch = null;

  A.ensure = function () {
    if (!A.on) return null;
    if (!A.ctx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      try { A.ctx = new C(); } catch (e) { return null; }
      A.master = A.ctx.createGain();
      A.master.gain.value = 0.55;
      A.master.connect(A.ctx.destination);
    }
    if (A.ctx.state === 'suspended') { try { A.ctx.resume(); } catch (e) { /* ignore */ } }
    return A.ctx;
  };
  function noise() {
    var c = A.ctx;
    if (!noiseBuf) {
      noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    var s = c.createBufferSource();
    s.buffer = noiseBuf;
    return s;
  }
  function env(g, t, a, peak, dec) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }
  A.tone = function (freq, dur, type, vol, delay) {
    var c = A.ensure(); if (!c) return;
    var t = c.currentTime + (delay || 0);
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    env(g, t, 0.008, vol || 0.2, dur);
    o.connect(g); g.connect(A.master);
    o.start(t); o.stop(t + dur + 0.05);
  };
  /* brass click — for buttons */
  A.click = function () {
    var c = A.ensure(); if (!c) return;
    A.tone(2400, 0.04, 'triangle', 0.06);
    A.tone(1200, 0.06, 'sine', 0.05, 0.004);
  };
  /* rubber stamp thunk */
  A.thunk = function () {
    var c = A.ensure(); if (!c) return;
    var t = c.currentTime;
    var o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(160, t);
    o.frequency.exponentialRampToValueAtTime(55, t + 0.16);
    env(g, t, 0.004, 0.45, 0.18);
    o.connect(g); g.connect(A.master); o.start(t); o.stop(t + 0.25);
    var n = noise(), f = c.createBiquadFilter(), g2 = c.createGain();
    f.type = 'lowpass'; f.frequency.value = 900;
    env(g2, t, 0.002, 0.25, 0.08);
    n.connect(f); f.connect(g2); g2.connect(A.master); n.start(t); n.stop(t + 0.15);
  };
  /* warm wax being pressed: sizzle + soft squish */
  A.squish = function () {
    var c = A.ensure(); if (!c) return;
    var t = c.currentTime;
    var n = noise(), f = c.createBiquadFilter(), g = c.createGain();
    f.type = 'bandpass'; f.Q.value = 0.7;
    f.frequency.setValueAtTime(5000, t);
    f.frequency.exponentialRampToValueAtTime(600, t + 0.6);
    env(g, t, 0.02, 0.18, 0.6);
    n.connect(f); f.connect(g); g.connect(A.master); n.start(t); n.stop(t + 0.7);
    A.tone(110, 0.25, 'sine', 0.3, 0.08);
  };
  /* page rustle */
  A.rustle = function () {
    var c = A.ensure(); if (!c) return;
    var t = c.currentTime;
    var n = noise(), f = c.createBiquadFilter(), g = c.createGain();
    f.type = 'bandpass'; f.frequency.value = 2800; f.Q.value = 0.5;
    g.gain.setValueAtTime(0.0001, t);
    for (var i = 0; i < 6; i++) g.gain.linearRampToValueAtTime(0.05 + Math.random() * 0.12, t + 0.04 + i * 0.05);
    g.gain.linearRampToValueAtTime(0.0001, t + 0.42);
    n.connect(f); f.connect(g); g.connect(A.master); n.start(t); n.stop(t + 0.45);
  };
  /* little bell chord for good scores */
  A.chime = function (stars) {
    var notes = [523.25, 659.25, 783.99, 1046.5];
    var n = U.clamp((stars || 1) + 1, 2, 4);
    for (var i = 0; i < n; i++) {
      A.tone(notes[i], 1.1, 'sine', 0.12, i * 0.09);
      A.tone(notes[i] * 2.01, 0.5, 'sine', 0.03, i * 0.09);
    }
  };
  /* continuous nib-on-paper scratch */
  var SCR = { fountain: [4200, 2.2, 0.05], italic: [3300, 1.6, 0.06], dip: [5200, 3, 0.05], brush: [1100, 0.6, 0.05], marker: [1700, 0.9, 0.07], pencil: [2600, 0.8, 0.11] };
  A.scratchStart = function (tool) {
    var c = A.ensure(); if (!c) return;
    A.scratchEnd();
    var cfg = SCR[tool] || SCR.fountain;
    var n = noise(); n.loop = true;
    var f = c.createBiquadFilter(), g = c.createGain();
    f.type = 'bandpass'; f.frequency.value = cfg[0]; f.Q.value = cfg[1];
    g.gain.value = 0.0001;
    n.connect(f); f.connect(g); g.connect(A.master);
    n.start();
    scratch = { n: n, g: g, f: f, base: cfg[2], fr: cfg[0] };
  };
  A.scratchMove = function (speed) {
    if (!scratch || !A.ctx) return;
    var v = U.clamp(speed, 0, 3);
    var t = A.ctx.currentTime;
    scratch.g.gain.setTargetAtTime(scratch.base * Math.min(1, v * 0.9) + 0.0001, t, 0.03);
    scratch.f.frequency.setTargetAtTime(scratch.fr * (0.8 + v * 0.15), t, 0.05);
  };
  A.scratchEnd = function () {
    if (!scratch || !A.ctx) { scratch = null; return; }
    var s = scratch; scratch = null;
    try {
      s.g.gain.setTargetAtTime(0.0001, A.ctx.currentTime, 0.04);
      s.n.stop(A.ctx.currentTime + 0.2);
    } catch (e) { /* ignore */ }
  };
})();
