;(function (root) {
  'use strict'; var BB = root.BlueButton;
  BB.LampaBridge = function (lampa) { this.lampa = lampa || root.Lampa; };
  BB.LampaBridge.prototype.ready = function () { return !!(this.lampa && this.lampa.Component && this.lampa.Activity && this.lampa.Manifest); };
  BB.LampaBridge.prototype.notify = function (text) { if (this.lampa && this.lampa.Noty && this.lampa.Noty.show) this.lampa.Noty.show(text); };
  /* Lampa's card menu only admits entries with type, name, onContextMenu and
     onContextLauch (the misspelling is part of Lampa's public contract). */
  BB.LampaBridge.prototype.registerManifestAction = function (title, handler) { var lampa = this.lampa; if (!lampa || !lampa.Manifest) throw new Error('Lampa.Manifest is unavailable'); lampa.Manifest.plugins = { type:'video', name:title, description:'Поиск доступных потоков через Blue-button', onContextMenu:function () { return true; }, onContextLauch:function (card) { handler(card); } }; return true; };
  BB.LampaBridge.prototype.registerCardAction = function (handler) { return this.registerManifestAction('BLUE-BUTTON', handler); };
  BB.LampaBridge.prototype.registerInlineCardButton = function (handler) {
    var lampa = this.lampa, self = this;
    if (!lampa || !lampa.Listener || !lampa.Listener.follow) throw new Error('Lampa.Listener.follow is unavailable');
    if (BB.runtime.inlineButtonRegistered) return true;
    BB.runtime.inlineButtonRegistered = true;
    lampa.Listener.follow('full', function (event) {
      try {
        if (!event || event.type !== 'complite' || !event.object || !event.object.activity || !event.object.activity.render) return;
        var activity = event.object.activity;
        var view = activity.render();
        if (!view || !view.find || view.find('.blue-button-inline').length) return;
        var card = event.data && event.data.movie ? event.data.movie : (event.object.data && event.object.data.movie ? event.object.data.movie : null);
        var button = root.$ ? root.$('<div class="full-start__button selector blue-button-inline" data-subtitle="Blue-button" style="color:#2f80ed"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 4h16v4H4zM4 10h10v4H4zM4 16h16v4H4z"/></svg><span>BLUE-BUTTON</span></div>') : null;
        if (!button) throw new Error('jQuery is unavailable for card button');
        button.on('hover:enter click', function () { handler(card || (event.object.data && event.object.data.movie) || {}); });
        var anchor = view.find('.view--torrent').first();
        if (anchor.length) anchor.after(button);
        else view.find('.buttons--container').first().append(button);
      } catch (error) {
        if (BB.Diagnostics && BB.Diagnostics.error) BB.Diagnostics.error('inline_card_button', error);
      }
    });
    return true;
  };
  BB.LampaBridge.prototype.registerDiagnosticsMenuFallback = function (handler) { if (!root.$) throw new Error('Lampa menu fallback requires jQuery'); var button = root.$('<li class="menu__item selector"><div class="menu__text">Диагностика Blue-button</div></li>'); button.on('hover:enter', handler); var list = root.$('.menu .menu__list').eq(0); if (!list.length) throw new Error('Lampa main menu is unavailable'); list.append(button); return true; };
  BB.LampaBridge.prototype.addComponent = function (name, factory) { if (this.lampa.Component && this.lampa.Component.get && this.lampa.Component.get(name)) return; if (!this.lampa.Component || !this.lampa.Component.add) throw new Error('Lampa.Component.add is unavailable'); this.lampa.Component.add(name, factory); };
  BB.LampaBridge.prototype.openResults = function (card, adapterIds) { this.lampa.Activity.push({url:'', title:card && (card.title || card.name) || 'BLUE-BUTTON', component:BB.COMPONENT, page:1, movie:card, adapterIds:adapterIds}); };
  BB.LampaBridge.prototype.openSourceMenu = function (card) { this.lampa.Activity.push({url:'', title:'BLUE-BUTTON: источники', component:BB.SOURCE_COMPONENT, page:1, movie:card}); };
  BB.LampaBridge.prototype.play = function (item) { if (!item || !item.available || item.playMethod !== 'play' || !BB.utils.isHttpUrl(item.url)) throw new Error('Unsupported playback result'); this.lampa.Player.play({url:item.url, title:item.title || '', quality:item.qualityMap || item.quality || '', subtitles:item.subtitles || null, season:item.season || null, episode:item.episode || null}); };
}(typeof window !== 'undefined' ? window : globalThis));
