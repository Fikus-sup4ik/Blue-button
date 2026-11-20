;(function (root) {
  'use strict'; var BB = root.BlueButton;
  BB.LampaBridge = function (lampa) { this.lampa = lampa || root.Lampa; };
  BB.LampaBridge.prototype.ready = function () { return !!(this.lampa && this.lampa.Component && this.lampa.Activity && this.lampa.Manifest); };
  BB.LampaBridge.prototype.notify = function (text) { if (this.lampa && this.lampa.Noty && this.lampa.Noty.show) this.lampa.Noty.show(text); };
  BB.LampaBridge.prototype.registerCardAction = function (handler) { var lampa = this.lampa; if (!lampa || !lampa.Manifest) return false; lampa.Manifest.plugins = { type:'video', onContextMenu:function () { return {title:'BLUE-BUTTON'}; }, onContextLauch:function (card) { handler(card); } }; return true; };
  BB.LampaBridge.prototype.addComponent = function (name, factory) { if (this.lampa.Component.get && this.lampa.Component.get(name)) return; this.lampa.Component.add(name, factory); };
  BB.LampaBridge.prototype.openResults = function (card) { this.lampa.Activity.push({url:'', title:card && (card.title || card.name) || 'BLUE-BUTTON', component:BB.COMPONENT, page:1, movie:card}); };
  BB.LampaBridge.prototype.play = function (item) { if (!item || !item.available || item.playMethod !== 'play' || !BB.utils.isHttpUrl(item.url)) throw new Error('Unsupported playback result'); this.lampa.Player.play({url:item.url, title:item.title || '', quality:item.qualityMap || item.quality || '', subtitles:item.subtitles || null, season:item.season || null, episode:item.episode || null}); };
}(typeof window !== 'undefined' ? window : globalThis));
