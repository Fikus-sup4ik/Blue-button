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
  'src/core.js', 'src/diagnostics.js', 'src/title-resolver.js', 'src/normalizer.js',
  'src/cache-manager.js', 'adapters/adapter-base.js', 'adapters/lampac.js', 'src/search-manager.js'
].forEach(function (file) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
});
var BB = context.BlueButton;
var passed = 0, pending = [];
function test(name, fn) { try { var value = fn(); if (value && typeof value.then === 'function') { pending.push(value.then(function () { passed++; console.log('PASS ' + name); }, function (e) { console.error('FAIL ' + name + ': ' + e.message); process.exitCode = 1; })); } else { passed++; console.log('PASS ' + name); } } catch (e) { console.error('FAIL ' + name + ': ' + e.message); process.exitCode = 1; } }
function equal(actual, expected, message) { if (actual !== expected) throw new Error(message || actual + ' !== ' + expected); }
test('resolves movie metadata', function () { var m = BB.TitleResolver.resolve({title:'Interstellar',original_title:'Interstellar',release_date:'2014-11-05',id:157336,media_type:'movie'}); equal(m.year, 2014); equal(m.serial, 0); equal(m.tmdbId, 157336); });
test('resolves tv metadata', function () { var m = BB.TitleResolver.resolve({name:'Series',original_name:'Series',first_air_date:'2020-01-01',id:5,media_type:'tv'}); equal(m.serial, 1); equal(m.mediaType, 'tv'); });
test('normalizes only direct play URL', function () { var r = BB.Normalizer.fromLampac({method:'play',url:'https://media.example/a.m3u8',title:'A',quality:'1080p'}, {name:'P'}); equal(r.available, true); equal(r.quality, '1080p'); });
test('rejects unsafe playback URL', function () { equal(BB.Normalizer.fromLampac({method:'play',url:'javascript:alert(1)'}, {}), null); });
test('parses synthetic life events', function () { var f = JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/lampac-lifeevents.synthetic.json'),'utf8')); equal(BB.Lampac.parseLifeEvents(f).online.length, 1); });
test('extracts data-json HTML without executing it', function () { var h = fs.readFileSync(path.join(root,'tests/fixtures/lampac-provider-html.synthetic.html'),'utf8'); var r = BB.Lampac.parseProviderHtml(h); equal(r.length, 1); equal(r[0].method, 'play'); });
test('builds encoded events query', function () { var u = BB.Lampac.buildEventsUrl('https://lampac.example/', {title:'A & B',originalTitle:'Оригинал',year:2020,tmdbId:3,serial:0}); equal(u.indexOf('title=A%20%26%20B') > -1, true); equal(u.indexOf('life=true') > -1, true); });
test('deduplicates by actual stream URL', function () { var list = BB.Normalizer.deduplicate([{url:'https://x.example/a'},{url:'https://x.example/a'},{url:'https://x.example/b'}]); equal(list.length, 2); });
test('cache key separates serial episodes', function () { var c = new BB.Cache(1000); equal(c.key({mediaType:'tv',tmdbId:1,season:1,episode:1}) === c.key({mediaType:'tv',tmdbId:1,season:1,episode:2}), false); });
test('Lampac adapter handles direct-play provider result', function () { var calls = []; var transport = { getJson:function (url) { calls.push(url); return Promise.resolve(calls.length === 1 ? {memkey:'key'} : {ready:true,online:[{name:'P',url:'https://p.example/lite/p',show:true}]}); }, getText:function () { return Promise.resolve('<div data-json=\'{"method":"play","url":"https://m.example/a.m3u8","quality":"720p"}\'></div>'); }, cancel:function () {} }; var a = new BB.LampacAdapter({origin:'https://lampac.example',transport:transport,maxPolls:1}); return a.search({title:'A',serial:0}).then(function (out) { equal(out.status,'ok'); equal(out.items.length,1); }); });
Promise.all(pending).then(function () { if (!process.exitCode) console.log('All ' + passed + ' tests passed.'); });
