;(function (root) {
  'use strict'; var BB = root.BlueButton;
  BB.Cache = function (ttl) { this.ttl = ttl || 120000; this.items = {}; };
  BB.Cache.prototype.key = function (m) { return [m.mediaType, m.tmdbId || '', m.imdbId || '', m.title || '', m.year || '', m.season || '', m.episode || ''].join('|'); };
  BB.Cache.prototype.get = function (m) { var x = this.items[this.key(m)]; return x && x.expires > BB.utils.now() ? x.value : null; };
  BB.Cache.prototype.set = function (m, value) { this.items[this.key(m)] = {expires: BB.utils.now() + this.ttl, value: value}; };
  BB.Cache.prototype.clear = function () { this.items = {}; };
}(typeof window !== 'undefined' ? window : globalThis));
