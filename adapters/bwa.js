;(function (root) {
  'use strict'; var BB = root.BlueButton;
  BB.BwaAdapter = function () { BB.AdapterBase.call(this, 'bwa', 'BWA Online'); };
  BB.BwaAdapter.prototype = Object.create(BB.AdapterBase.prototype);
  BB.BwaAdapter.prototype.search = function () { return Promise.reject(new Error('BWA adapter is not enabled: public client protocol is not verified')); };
}(typeof window !== 'undefined' ? window : globalThis));
