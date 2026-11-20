;(function (root) {
  'use strict'; var BB = root.BlueButton;
  BB.Settings = { key:'blue_button_lampac_origin', getOrigin:function (lampa) { return lampa && lampa.Storage && lampa.Storage.get ? lampa.Storage.get(this.key, '') : ''; }, register:function (lampa) { if (!lampa || !lampa.SettingsApi || !lampa.SettingsApi.addParam) return; lampa.SettingsApi.addParam({component:'blue_button', param:{name:BB.Settings.key, type:'input', values:'', default:''}, field:{name:'Lampac URL', description:'Адрес вашего сервера Lampac, например https://example.org'}}); } };
}(typeof window !== 'undefined' ? window : globalThis));
