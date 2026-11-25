/* Inkwell — IndexedDB vault for stroke vectors (with in-memory fallback) */
(function () {
  'use strict';
  var IW = window.IW = window.IW || {};
  var DB = IW.db = { mode: 'idb' };
  var dbp = null;
  var mem = { docs: {}, kv: {} };

  function clone(o) { return o === undefined ? undefined : JSON.parse(JSON.stringify(o)); }

  DB.open = function () {
    if (dbp) return dbp;
    dbp = new Promise(function (resolve) {
      var done = false;
      function fallback() { if (done) return; done = true; DB.mode = 'memory'; resolve(null); }
      try {
        if (!window.indexedDB) { fallback(); return; }
        var r = indexedDB.open('inkwell', 1);
        r.onupgradeneeded = function () {
          var d = r.result;
          if (!d.objectStoreNames.contains('docs')) d.createObjectStore('docs', { keyPath: 'id' });
          if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv');
        };
        r.onsuccess = function () { if (done) { try { r.result.close(); } catch (e) { /* */ } return; } done = true; resolve(r.result); };
        r.onerror = fallback;
        r.onblocked = fallback;
        setTimeout(fallback, 5000);
      } catch (e) { fallback(); }
    });
    return dbp;
  };

  function run(store, mode, fn) {
    return DB.open().then(function (db) {
      if (!db) {
        var r0 = fn(null);
        return (r0 && typeof r0 === 'object' && 'result' in r0) ? r0.result : undefined;
      }
      return new Promise(function (resolve, reject) {
        var tx, req;
        try {
          tx = db.transaction(store, mode);
          req = fn(tx.objectStore(store));
        } catch (e) { reject(e); return; }
        tx.oncomplete = function () { resolve(req ? req.result : undefined); };
        tx.onerror = function () { reject(tx.error); };
        tx.onabort = function () { reject(tx.error || new Error('aborted')); };
      });
    });
  }

  DB.put = function (doc) {
    return run('docs', 'readwrite', function (s) {
      if (!s) { mem.docs[doc.id] = clone(doc); return null; }
      return s.put(doc);
    });
  };
  DB.get = function (id) {
    return run('docs', 'readonly', function (s) {
      if (!s) return { result: clone(mem.docs[id]) };
      return s.get(id);
    });
  };
  DB.all = function () {
    return run('docs', 'readonly', function (s) {
      if (!s) return { result: Object.keys(mem.docs).map(function (k) { return clone(mem.docs[k]); }) };
      return s.getAll();
    }).then(function (r) { return r || []; });
  };
  DB.del = function (id) {
    return run('docs', 'readwrite', function (s) {
      if (!s) { delete mem.docs[id]; return null; }
      return s.delete(id);
    });
  };
  DB.kvGet = function (k, dflt) {
    return run('kv', 'readonly', function (s) {
      if (!s) return { result: clone(mem.kv[k]) };
      return s.get(k);
    }).then(function (v) { return v === undefined ? dflt : v; }).catch(function () { return dflt; });
  };
  DB.kvSet = function (k, v) {
    return run('kv', 'readwrite', function (s) {
      if (!s) { mem.kv[k] = clone(v); return null; }
      return s.put(v, k);
    }).catch(function () { /* non-fatal */ });
  };

  /* Autosave queue: one write in flight, the latest state of each doc wins */
  var pending = {}, busy = false;
  DB.saveSoon = function (doc, cb) {
    doc.updated = Date.now();
    pending[doc.id] = { doc: doc, cb: cb };
    pump();
  };
  function pump() {
    if (busy) return;
    var ids = Object.keys(pending);
    if (!ids.length) return;
    var job = pending[ids[0]]; delete pending[ids[0]];
    busy = true;
    DB.put(job.doc).then(function () {
      busy = false; if (job.cb) job.cb(null); pump();
    }).catch(function (e) {
      busy = false; if (job.cb) job.cb(e || new Error('save failed')); pump();
    });
  }
})();
