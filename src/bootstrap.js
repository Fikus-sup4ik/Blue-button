;(function (root) {
  'use strict'; var BB = root.BlueButton;
  BB.runtime = BB.runtime || {};
  function failure(stage, error) { BB.Diagnostics.stage(stage, 'error', error); try { if (root.Lampa && root.Lampa.SettingsApi && BB.Settings) BB.Settings.register(root.Lampa); } catch (recoveryError) { BB.Diagnostics.error('diagnostic_recovery', recoveryError); } root.blue_button_initializing = false; root.blue_button_ready = false; return false; }
  function requireApi(value, name) { if (!value || !value[name]) throw new Error(name + ' is unavailable'); }
  BB.bootstrap = function () {
    var lampa, bridge, currentStage = 'lampa_detection';
    if (root.blue_button_ready) return true;
    if (root.blue_button_initializing) return false;
    root.blue_button_initializing = true;
    try {
      currentStage = 'lampa_detection'; BB.Diagnostics.stage(currentStage, 'running');
      lampa = root.Lampa;
      requireApi(lampa, 'Component'); requireApi(lampa, 'Activity'); requireApi(lampa, 'Manifest');
      BB.Diagnostics.stage('lampa_detection', 'ok');
      currentStage = 'lampa_api_contract'; BB.Diagnostics.stage(currentStage, 'running');
      requireApi(lampa, 'Reguest'); requireApi(lampa, 'Player'); requireApi(lampa.Component, 'add'); requireApi(lampa.Activity, 'push');
      if (!root.Promise) throw new Error('Promise is unavailable and compatibility fallback failed');
      BB.Diagnostics.stage('lampa_api_contract', 'ok');
      bridge = new BB.LampaBridge(lampa); BB.runtime.bridge = bridge;
      currentStage = 'component_registration'; BB.Diagnostics.stage(currentStage, 'running');
      bridge.addComponent(BB.DIAGNOSTICS_COMPONENT, function () { return new BB.DiagnosticsComponent(); });
      bridge.addComponent(BB.COMPONENT, function (activity) { return new BB.ResultsComponent(activity); });
      BB.Diagnostics.stage('component_registration', 'ok');
      currentStage = 'manifest_registration'; BB.Diagnostics.stage(currentStage, 'running');
      if (!bridge.registerCardAction(function (card) { bridge.openResults(card); })) throw new Error('Lampa.Manifest.plugins registration failed');
      BB.Diagnostics.stage('manifest_registration', 'ok');
      currentStage = 'settings_registration'; BB.Diagnostics.stage(currentStage, 'running');
      BB.Settings.register(lampa);
      BB.Diagnostics.stage('settings_registration', 'ok');
      currentStage = 'startup'; BB.Diagnostics.stage(currentStage, 'running');
      BB.runtime.manager = new BB.SearchManager({adapters:[new BB.LampacAdapter({lampa:lampa, origin:BB.Settings.getOrigin(lampa)})]});
      BB.Diagnostics.add('info', 'Blue-button initialized', {version:BB.VERSION});
      BB.Diagnostics.stage('startup', 'ok');
      root.blue_button_ready = true;
      root.blue_button_initializing = false;
      return true;
    } catch (error) { return failure(currentStage, error); }
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
