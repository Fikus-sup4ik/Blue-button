;(function (root) {
  'use strict'; var BB = root.BlueButton;
  BB.runtime = BB.runtime || {};
  BB.bootstrap = function () {
    if (root.blue_button_ready) return;
    var lampa = root.Lampa;
    if (!lampa || !lampa.Component || !lampa.Activity || !lampa.Manifest || !lampa.Reguest || !lampa.Player) return;
    root.blue_button_ready = true;
    var bridge = new BB.LampaBridge(lampa);
    BB.runtime.bridge = bridge;
    BB.runtime.manager = new BB.SearchManager({adapters:[new BB.LampacAdapter({lampa:lampa, origin:BB.Settings.getOrigin(lampa)})]});
    bridge.addComponent(BB.COMPONENT, function (activity) { return new BB.ResultsComponent(activity); });
    bridge.registerCardAction(function (card) { bridge.openResults(card); });
    BB.Settings.register(lampa);
    BB.Diagnostics.add('info', 'Blue-button initialized', {version:BB.VERSION});
  };
  function start() { if (root.appready) BB.bootstrap(); else if (root.Lampa && root.Lampa.Listener && root.Lampa.Listener.follow) root.Lampa.Listener.follow('app', function (e) { if (e && e.type === 'ready') BB.bootstrap(); }); else { var tries = 0, timer = setInterval(function () { tries++; BB.bootstrap(); if (root.blue_button_ready || tries >= 40) clearInterval(timer); }, 250); } }
  start();
}(typeof window !== 'undefined' ? window : globalThis));
