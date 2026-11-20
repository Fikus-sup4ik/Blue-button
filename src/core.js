;(function (root) {
  'use strict';
  var BB = root.BlueButton = root.BlueButton || {};
  BB.VERSION = '0.1.5';
  BB.NAME = 'Blue-button';
  BB.COMPONENT = 'blue_button_results';
  BB.DIAGNOSTICS_COMPONENT = 'blue_button_diagnostics';
  if (root.blue_button_version !== BB.VERSION) { root.blue_button_ready = false; root.blue_button_initializing = false; root.blue_button_version = BB.VERSION; }
  BB.utils = {
    trim: function (value) { return typeof value === 'string' ? value.replace(/^\s+|\s+$/g, '') : ''; },
    once: function (fn) { var called = false; return function () { if (called) return; called = true; return fn.apply(null, arguments); }; },
    escapeHtml: function (value) { return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); },
    isHttpUrl: function (value) { return /^https?:\/\//i.test(String(value || '')); },
    joinUrl: function (origin, pathname) { return String(origin || '').replace(/\/+$/, '') + '/' + String(pathname || '').replace(/^\/+/, ''); },
    query: function (base, params) { var out = []; Object.keys(params || {}).forEach(function (key) { var v = params[key]; if (v !== undefined && v !== null && v !== '') out.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(v))); }); return base + (base.indexOf('?') === -1 ? '?' : '&') + out.join('&'); },
    now: function () { return new Date().getTime(); }
  };
}(typeof window !== 'undefined' ? window : globalThis));
