var fs = require('fs');
var path = require('path');
var vm = require('vm');
var root = path.resolve(__dirname, '..');
var context = { console: console, setTimeout: setTimeout, clearTimeout: clearTimeout };
context.globalThis = context;
context.window = context;
context.BlueButton = undefined;
vm.createContext(context);
[
  'src/core.js', 'src/promise.js', 'src/diagnostics.js', 'src/title-resolver.js', 'src/normalizer.js',
  'src/cache-manager.js', 'adapters/adapter-base.js', 'adapters/lampac.js', 'src/search-manager.js', 'src/lampa-bridge.js', 'src/components/results.js', 'src/components/diagnostics.js', 'src/settings.js'
].forEach(function (file) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
});
var BB = context.BlueButton;
context.appready = true;
context.Lampa = {Component:{items:{},add:function (name, fn) { this.items[name] = fn; },get:function (name) { return this.items[name]; }},Activity:{push:function () {}},Manifest:{},Reguest:function () {},Player:{play:function () {}},SettingsApi:{addComponent:function () {},addParam:function () {}},Storage:{field:function () { return ''; },get:function () { return ''; },set:function () {}}};
context.Lampa.Reguest.prototype.timeout = function () {};
context.Lampa.Reguest.prototype.silent = function () {};
context.Lampa.Reguest.prototype.native = function () {};
context.Lampa.Reguest.prototype.clear = function () {};
vm.runInContext(fs.readFileSync(path.join(root, 'src/bootstrap.js'), 'utf8'), context, { filename: 'src/bootstrap.js' });
var passed = 0, pending = [];
function test(name, fn) { try { var value = fn(); if (value && typeof value.then === 'function') { pending.push(value.then(function () { passed++; console.log('PASS ' + name); }, function (e) { console.error('FAIL ' + name + ': ' + e.message); process.exitCode = 1; })); } else { passed++; console.log('PASS ' + name); } } catch (e) { console.error('FAIL ' + name + ': ' + e.message); process.exitCode = 1; } }
function equal(actual, expected, message) { if (actual !== expected) throw new Error(message || actual + ' !== ' + expected); }
test('resolves movie metadata', function () { var m = BB.TitleResolver.resolve({title:'Interstellar',original_title:'Interstellar',release_date:'2014-11-05',id:157336,media_type:'movie'}); equal(m.year, 2014); equal(m.serial, 0); equal(m.tmdbId, 157336); });
test('resolves tv metadata', function () { var m = BB.TitleResolver.resolve({name:'Series',original_name:'Series',first_air_date:'2020-01-01',id:5,media_type:'tv'}); equal(m.serial, 1); equal(m.mediaType, 'tv'); });
test('does not infer tv from name alone', function () { var m = BB.TitleResolver.resolve({name:'A title',id:6}); equal(m.mediaType, 'movie'); });
test('normalizes only direct play URL', function () { var r = BB.Normalizer.fromLampac({method:'play',url:'https://media.example/a.m3u8',title:'A',quality:'1080p'}, {name:'P'}); equal(r.available, true); equal(r.quality, '1080p'); });
test('rejects unsafe playback URL', function () { equal(BB.Normalizer.fromLampac({method:'play',url:'javascript:alert(1)'}, {}), null); });
test('parses synthetic life events', function () { var f = JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/lampac-lifeevents.synthetic.json'),'utf8')); equal(BB.Lampac.parseLifeEvents(f).online.length, 1); });
test('extracts data-json HTML without executing it', function () { var h = fs.readFileSync(path.join(root,'tests/fixtures/lampac-provider-html.synthetic.html'),'utf8'); var r = BB.Lampac.parseProviderHtml(h); equal(r.length, 1); equal(r[0].method, 'play'); });
test('builds encoded events query', function () { var u = BB.Lampac.buildEventsUrl('https://lampac.example/', {title:'A & B',originalTitle:'Оригинал',year:2020,tmdbId:3,serial:0}); equal(u.indexOf('title=A%20%26%20B') > -1, true); equal(u.indexOf('life=true') > -1, true); });
test('deduplicates exact stream metadata but keeps quality variants', function () { var list = BB.Normalizer.deduplicate([{url:'https://x.example/a',quality:'1080p'},{url:'https://x.example/a',quality:'1080p'},{url:'https://x.example/a',quality:'720p'},{url:'https://x.example/b'}]); equal(list.length, 3); });
test('cache key separates serial episodes', function () { var c = new BB.Cache(1000); equal(c.key({mediaType:'tv',tmdbId:1,season:1,episode:1}) === c.key({mediaType:'tv',tmdbId:1,season:1,episode:2}), false); });
test('Lampac adapter handles direct-play provider result', function () { var calls = []; var transport = { getJson:function (url) { calls.push(url); return Promise.resolve(calls.length === 1 ? {memkey:'key'} : {ready:true,online:[{name:'P',url:'https://p.example/lite/p',show:true}]}); }, getText:function () { return Promise.resolve('<div data-json=\'{"method":"play","url":"https://m.example/a.m3u8","quality":"720p"}\'></div>'); }, cancel:function () {} }; var a = new BB.LampacAdapter({origin:'https://lampac.example',transport:transport,maxPolls:1}); return a.search({title:'A',serial:0}).then(function (out) { equal(out.status,'ok'); equal(out.items.length,1); }); });
test('continues lifeevents until ready and uses full online count for seen', function () { var urls = [], transport = { getJson:function (url) { urls.push(url); if (urls.length === 1) return Promise.resolve({memkey:'key'}); if (urls.length === 2) return Promise.resolve({ready:false,online:[{name:'P1',url:'https://p1.example/a',show:true}]}); return Promise.resolve({ready:true,online:[{name:'P1',url:'https://p1.example/a',show:true},{name:'P2',url:'https://p2.example/a',show:true}]}); }, getText:function (url) { return Promise.resolve('<div data-json=\'{"method":"play","url":"https://m.example/' + (url.indexOf('p2') > -1 ? 'b' : 'a') + '.m3u8"}\'></div>'); }, cancel:function () {} }; var a = new BB.LampacAdapter({origin:'https://lampac.example',transport:transport,maxPolls:4,pollDelay:0}); return a.search({title:'A',serial:0}).then(function (out) { equal(out.items.length,2); equal(urls.length,3); equal(urls[2].indexOf('seen=1') > -1, true); }); });
test('cancel resolves search and clears transport', function () { var cancelled = false, transport = { getJson:function () { return new Promise(function () {}); }, cancel:function () { cancelled = true; } }; var a = new BB.LampacAdapter({origin:'https://lampac.example',transport:transport}); var p = a.search({title:'A',serial:0}); a.cancel(); return p.then(function (out) { equal(out.status,'cancelled'); equal(cancelled,true); }); });
test('old SearchManager run cannot replace new run', function () { var firstResolve, calls = 0, adapter = {id:'fake', search:function () { calls++; if (calls === 1) return new Promise(function (resolve) { firstResolve = resolve; }); return Promise.resolve({status:'ok',items:[{url:'https://new.example/a',quality:'1080p'}]}); }, cancel:function () {} }; var manager = new BB.SearchManager({adapters:[adapter]}); var old = manager.search({title:'old'}); var current = manager.search({title:'new'}); firstResolve({status:'ok',items:[{url:'https://old.example/a'}]}); return Promise.all([old,current]).then(function (out) { equal(out[0].status,'cancelled'); equal(out[1].items[0].url,'https://new.example/a'); }); });
test('bootstrap records missing API and does not set ready', function () { context.blue_button_ready = false; context.blue_button_initializing = false; context.Lampa = {}; equal(BB.bootstrap(), false); equal(!!context.blue_button_ready, false); equal(BB.Diagnostics.stages.lampa_detection.status, 'error'); context.Lampa = {Component:{items:{},add:function (name, fn) { this.items[name] = fn; },get:function (name) { return this.items[name]; }},Activity:{push:function () {}},Manifest:{},Reguest:function () {},Player:{play:function () {}},SettingsApi:{addComponent:function () {},addParam:function () {}},Storage:{field:function () { return ''; },get:function () { return ''; },set:function () {}}}; context.Lampa.Reguest.prototype.timeout = function () {}; context.Lampa.Reguest.prototype.silent = function () {}; context.Lampa.Reguest.prototype.native = function () {}; context.Lampa.Reguest.prototype.clear = function () {}; equal(BB.bootstrap(), true); equal(context.blue_button_ready, true); });
Promise.all(pending).then(function () { if (!process.exitCode) console.log('All ' + passed + ' tests passed.'); });
