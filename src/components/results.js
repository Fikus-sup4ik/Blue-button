;(function (root) {
  'use strict'; var BB = root.BlueButton;
  BB.ResultsComponent = function (activity) { this.activity = activity; this.bridge = BB.runtime.bridge; this.manager = BB.runtime.manager; this.card = activity.movie || {}; this.destroyed = false; };
  BB.ResultsComponent.prototype.create = function () { this.renderLoading(); this.run(); };
  BB.ResultsComponent.prototype.start = function () {};
  BB.ResultsComponent.prototype.stop = function () {};
  BB.ResultsComponent.prototype.destroy = function () { this.destroyed = true; this.manager.cancel(); };
  BB.ResultsComponent.prototype.render = function () { return this.el; };
  BB.ResultsComponent.prototype.renderLoading = function () { if (!root.$) return; this.el = root.$('<div class="activity"><div class="activity__body"><div class="simple-button selector focused">BLUE-BUTTON: поиск…</div></div></div>'); };
  BB.ResultsComponent.prototype.run = function () { var self = this, media = BB.TitleResolver.resolve(this.card); this.manager.search(media).then(function (result) { if (self.destroyed) return; self.renderResult(result); }, function (error) { if (!self.destroyed) self.renderError(error); }); };
  BB.ResultsComponent.prototype.renderError = function () { if (this.el) this.el.find('.activity__body').html('<div class="simple-button selector">Ошибка поиска. См. диагностику.</div>'); };
  BB.ResultsComponent.prototype.renderResult = function (result) { var self = this; if (!this.el) return; if (result.status === 'empty') { this.el.find('.activity__body').html('<div class="simple-button selector">Ничего не найдено</div>'); return; } if (result.status === 'cancelled') return; var html = '<div class="simple-button selector">BLUE-BUTTON</div>'; result.items.forEach(function (item, index) { html += '<div class="simple-button selector blue-button-result" data-index="' + index + '">' + BB.utils.escapeHtml([item.quality, item.type, item.translation, item.provider].filter(Boolean).join(' / ') || item.title || item.provider) + '</div>'; }); this.el.find('.activity__body').html(html); this.el.find('.blue-button-result').on('hover:enter click', function () { var item = result.items[Number(root.$(this).attr('data-index'))]; try { self.bridge.play(item); } catch (e) { self.bridge.notify('Не удалось запустить результат'); BB.Diagnostics.add('error', 'Playback failed', {error:String(e)}); } }); };
}(typeof window !== 'undefined' ? window : globalThis));
