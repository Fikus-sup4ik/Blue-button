;(function (root) {
  'use strict'; var BB = root.BlueButton;
  BB.AlpacAdapter = function () { BB.AdapterBase.call(this, 'alpac', 'Alpac Online'); };
  BB.AlpacAdapter.prototype = Object.create(BB.AdapterBase.prototype);
  BB.AlpacAdapter.prototype.search = function () { return Promise.reject(new Error('Alpac adapter is not enabled: source URL/API response is not verified')); };
}(typeof window !== 'undefined' ? window : globalThis));
