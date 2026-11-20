;(function (root) {
  'use strict'; var BB = root.BlueButton;
  BB.DiagnosticsComponent = function () { this.el = null; };
  BB.DiagnosticsComponent.prototype.create = function () { this.render(); return this.el; };
  BB.DiagnosticsComponent.prototype.start = function () {};
  BB.DiagnosticsComponent.prototype.stop = function () {};
  BB.DiagnosticsComponent.prototype.destroy = function () { if (this.el && this.el.remove) this.el.remove(); this.el = null; };
  BB.DiagnosticsComponent.prototype.render = function () { var self = this, snapshot = BB.Diagnostics.snapshot(), html = '<div class="activity"><div class="activity__body"><div class="simple-button selector">Blue-button ' + BB.utils.escapeHtml(snapshot.version) + '</div>'; Object.keys(snapshot.stages).forEach(function (name) { var stage = snapshot.stages[name], error = stage.error ? ' — ' + stage.error.message : ''; html += '<div class="simple-button">' + BB.utils.escapeHtml(name + ': ' + stage.status + error) + '</div>'; }); snapshot.entries.forEach(function (entry) { html += '<div class="simple-button">' + BB.utils.escapeHtml(entry.level + ': ' + entry.message + (entry.data && entry.data.stage ? ' [' + entry.data.stage + ']' : '')) + '</div>'; }); html += '</div></div>'; if (root.$) { this.el = root.$(html); this.el.on('hover:enter', function () { self.render(); }); } return this.el; };
}(typeof window !== 'undefined' ? window : globalThis));
