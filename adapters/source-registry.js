;(function (root) {
  'use strict'; var BB = root.BlueButton;
  BB.Sources = {
    list: function () {
      return [
        {id:'lampac', name:'Lampac', status:'verified', enabled:true},
        {id:'bwa', name:'BWA Online', status:'unverified', enabled:false, reason:'Публичный клиент обфусцирован; контракт поиска и авторизации не подтверждён'},
        {id:'gbay', name:'Gbay', status:'unverified', enabled:false, reason:'Подтверждённый Lampa-клиент/API не найден'},
        {id:'alpac', name:'Alpac Online', status:'unverified', enabled:false, reason:'URL установленного источника и ответ API не подтверждены'}
      ];
    },
    create: function (lampa, origin) {
      var result = [];
      result.push(new BB.LampacAdapter({lampa:lampa, origin:origin}));
      return result;
    }
  };
}(typeof window !== 'undefined' ? window : globalThis));
