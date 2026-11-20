;(function (root) {
  'use strict'; var BB = root.BlueButton;
  BB.AdapterBase = function (id, name) { this.id = id; this.name = name; };
  BB.AdapterBase.prototype.search = function () { throw new Error('Adapter search is not implemented'); };
  BB.AdapterBase.prototype.cancel = function () {};
}(typeof window !== 'undefined' ? window : globalThis));
