;(function (root) {
  'use strict'; var BB = root.BlueButton;
  BB.runtime = BB.runtime || {};
  function failure(stage, error) { BB.Diagnostics.stage(stage, 'error', error); try { if (root.Lampa && root.Lampa.SettingsApi && BB.Settings) BB.Settings.register(root.Lampa); } catch (recoveryError) { BB.Diagnostics.error('diagnostic_recovery', recoveryError); } root.blue_button_initializing = false; root.blue_button_ready = false; return false; }
  function requireApi(value, name) { if (!value || !value[name]) throw new Error(name + ' is unavailable'); }
  function stage(name, fn, required) { BB.Diagnostics.stage(name, 'running'); try { var result = fn(); BB.Diagnostics.stage(name, 'ok'); return result === undefined ? true : result; } catch (error) { BB.Diagnostics.stage(name, 'error', error); if (required) throw error; return false; } }
  BB.bootstrap = function () {
    var lampa, bridge;
    if (root.blue_button_ready) return true;
    if (root.blue_button_initializing) return false;
    root.blue_button_initializing = true;
    try {
      stage('lampa_detection', function () { lampa = root.Lampa; requireApi(lampa, 'Component'); requireApi(lampa, 'Activity'); requireApi(lampa.Component, 'add'); requireApi(lampa.Activity, 'push'); BB.Diagnostics.setApis({Lampa:!!lampa, Component:!!(lampa && lampa.Component), ComponentAdd:!!(lampa && lampa.Component && lampa.Component.add), Activity:!!(lampa && lampa.Activity), ActivityPush:!!(lampa && lampa.Activity && lampa.Activity.push), Manifest:!!(lampa && lampa.Manifest), SettingsApi:!!(lampa && lampa.SettingsApi), Reguest:!!(lampa && lampa.Reguest), Player:!!(lampa && lampa.Player), Promise:!!root.Promise}); }, true);
      bridge = new BB.LampaBridge(lampa); BB.runtime.bridge = bridge;
      stage('diagnostic_component_registration', function () { bridge.addComponent(BB.DIAGNOSTICS_COMPONENT, function () { return new BB.DiagnosticsComponent(); }); }, true);
      stage('lampa_api_contract', function () { requireApi(lampa, 'Reguest'); requireApi(lampa, 'Player'); if (!root.Promise) throw new Error('Promise is unavailable and compatibility fallback failed'); }, true);
      stage('component_registration', function () { if (BB.SOURCE_COMPONENT && BB.SourceMenuComponent) bridge.addComponent(BB.SOURCE_COMPONENT, function (activity) { return new BB.SourceMenuComponent(activity); }); bridge.addComponent(BB.COMPONENT, function (activity) { return new BB.ResultsComponent(activity); }); }, true);
      stage('manifest_registration', function () { bridge.registerCardAction(function (card) { if (BB.SOURCE_COMPONENT && BB.SourceMenuComponent) bridge.openSourceMenu(card); else bridge.openResults(card); }); }, true);
      stage('settings_registration', function () { if (!lampa.SettingsApi || !lampa.SettingsApi.addParam) throw new Error('Lampa.SettingsApi.addParam is unavailable'); BB.Settings.register(lampa); }, false);
      stage('startup', function () { var sources = BB.Sources || {create:function () { return [new BB.LampacAdapter({lampa:lampa, origin:BB.Settings.getOrigin(lampa)})]; }, list:function () { return [{id:'lampac',name:'Lampac',status:'verified',enabled:true}]; }}; BB.runtime.manager = new BB.SearchManager({adapters:sources.create(lampa, BB.Settings.getOrigin(lampa))}); BB.Diagnostics.add('info', 'Blue-button initialized', {version:BB.VERSION, sources:sources.list()}); }, true);
      root.blue_button_ready = true;
      root.blue_button_initializing = false;
      return true;
    } catch (error) { return failure('bootstrap', error); }
  };
  function start() {
    try {
      BB.Diagnostics.stage('app_readiness', 'waiting');
      if (root.appready) { BB.Diagnostics.stage('app_readiness', 'ok'); return BB.bootstrap(); }
      if (root.Lampa && root.Lampa.Listener && root.Lampa.Listener.follow) { root.Lampa.Listener.follow('app', function (event) { try { if (event && event.type === 'ready') { BB.Diagnostics.stage('app_readiness', 'ok'); BB.bootstrap(); } } catch (error) { failure('app_readiness', error); } }); return; }
      throw new Error('window.appready is false and Lampa.Listener.follow is unavailable');
    } catch (error) { failure('app_readiness', error); }
  }
  start();
}(typeof window !== 'undefined' ? window : globalThis));
