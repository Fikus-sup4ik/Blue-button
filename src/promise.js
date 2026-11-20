;(function (root) {
  'use strict';
  if (root.Promise) return;
  function MiniPromise(executor) {
    var self = this; self.state = 'pending'; self.value = undefined; self.handlers = [];
    function settle(state, value) { if (self.state !== 'pending') return; self.state = state; self.value = value; drain(); }
    function drain() { if (self.state === 'pending') return; setTimeout(function () { var handlers = self.handlers.slice(); self.handlers = []; handlers.forEach(function (h) { var cb = self.state === 'fulfilled' ? h.ok : h.fail; if (!cb) return (self.state === 'fulfilled' ? h.resolve : h.reject)(self.value); try { h.resolve(cb(self.value)); } catch (e) { h.reject(e); } }); }, 0); }
    function resolve(value) { if (value === self) return settle('rejected', new TypeError('Promise cycle')); if (value && typeof value.then === 'function') return value.then(resolve, reject); settle('fulfilled', value); }
    function reject(error) { settle('rejected', error); }
    self.then = function (ok, fail) { return new MiniPromise(function (resolveNext, rejectNext) { self.handlers.push({ok:ok, fail:fail, resolve:resolveNext, reject:rejectNext}); drain(); }); };
    self.catch = function (fail) { return self.then(null, fail); };
    try { executor(resolve, reject); } catch (e) { reject(e); }
  }
  MiniPromise.resolve = function (value) { return new MiniPromise(function (resolve) { resolve(value); }); };
  MiniPromise.reject = function (value) { return new MiniPromise(function (resolve, reject) { reject(value); }); };
  MiniPromise.all = function (list) { return new MiniPromise(function (resolve, reject) { var out = [], left = list.length; if (!left) return resolve(out); list.forEach(function (item, i) { MiniPromise.resolve(item).then(function (value) { out[i] = value; if (!--left) resolve(out); }, reject); }); }); };
  MiniPromise.race = function (list) { return new MiniPromise(function (resolve, reject) { list.forEach(function (item) { MiniPromise.resolve(item).then(resolve, reject); }); }); };
  root.Promise = MiniPromise;
}(typeof window !== 'undefined' ? window : globalThis));
