;(function (root) {
  'use strict'; var BB = root.BlueButton;
  BB.Diagnostics = { entries: [], add: function (level, message, data) { this.entries.push({time: BB.utils.now(), level: level, message: message, data: data || null}); if (this.entries.length > 100) this.entries.shift(); }, list: function () { return this.entries.slice(); }, clear: function () { this.entries = []; } };
}(typeof window !== 'undefined' ? window : globalThis));
