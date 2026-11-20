;(function (root) {
  'use strict'; var BB = root.BlueButton;
  BB.SOURCE_COMPONENT = 'blue_button_sources';
  BB.SourceMenuComponent = function (activity) { this.activity = activity; this.bridge = BB.runtime.bridge; this.card = activity.movie || {}; this.selected = {lampac:true}; this.el = null; };
  BB.SourceMenuComponent.prototype.create = function () { this.render(); return this.el; };
  BB.SourceMenuComponent.prototype.start = function () {};
  BB.SourceMenuComponent.prototype.stop = function () {};
  BB.SourceMenuComponent.prototype.destroy = function () { if (this.el) this.el.find('.blue-button-source, .blue-button-start').off('hover:enter click'); };
  BB.SourceMenuComponent.prototype.render = function () {
    var self = this, sources = BB.Sources.list(), html = '<div class="activity"><div class="activity__body"><div class="simple-button selector focused">Выберите источники</div>';
    sources.forEach(function (source) { var checked = self.selected[source.id] ? ' checked' : ''; var suffix = source.status === 'verified' ? '' : ' — недоступен: ' + source.reason; html += '<div class="simple-button selector blue-button-source" data-source="' + source.id + '">' + (checked ? '[x] ' : '[ ] ') + BB.utils.escapeHtml(source.name + suffix) + '</div>'; });
    html += '<div class="simple-button selector blue-button-start">Начать поиск</div></div></div>';
    if (!root.$) return null; this.el = root.$(html);
    this.el.find('.blue-button-source').on('hover:enter click', function () { var id = root.$(this).attr('data-source'), source = sources.filter(function (item) { return item.id === id; })[0]; if (!source || !source.enabled) return; self.selected[id] = !self.selected[id]; self.render(); });
    this.el.find('.blue-button-start').on('hover:enter click', function () { self.bridge.openResults(self.card, Object.keys(self.selected).filter(function (id) { return self.selected[id]; })); });
    return this.el;
  };
}(typeof window !== 'undefined' ? window : globalThis));
