;(function (root) {
  'use strict'; var BB = root.BlueButton;
  BB.GbayAdapter = function () { BB.AdapterBase.call(this, 'gbay', 'Gbay'); };
  BB.GbayAdapter.prototype = Object.create(BB.AdapterBase.prototype);
  BB.GbayAdapter.prototype.search = function () { return Promise.reject(new Error('Gbay adapter is not enabled: no verified Lampa client/API')); };
}(typeof window !== 'undefined' ? window : globalThis));
