;(function (root) {
  'use strict'; var BB = root.BlueButton;
  var Lampac = BB.Lampac = {};
  Lampac.buildEventsUrl = function (origin, media) { return BB.utils.query(BB.utils.joinUrl(origin, 'lite/events'), { id: media.tmdbId || undefined, tmdb_id: media.tmdbId || undefined, imdb_id: media.imdbId || undefined, kinopoisk_id: media.kinopoiskId || undefined, title: media.title, original_title: media.originalTitle || undefined, year: media.year || undefined, source: media.source || 'tmdb', serial: media.serial ? 1 : 0, season: media.season || undefined, episode: media.episode || undefined, life: 'true' }); };
  Lampac.buildLifeUrl = function (origin, memkey, seen, media) { return BB.utils.query(BB.utils.joinUrl(origin, 'lifeevents'), { memkey: memkey, seen: seen, id: media.tmdbId || undefined, imdb_id: media.imdbId || undefined, kinopoisk_id: media.kinopoiskId || undefined, serial: media.serial ? 1 : 0 }); };
  Lampac.parseJson = function (value) { if (typeof value === 'object' && value) return value; try { return JSON.parse(value); } catch (e) { return null; } };
  Lampac.parseLifeEvents = function (value) { var json = Lampac.parseJson(value) || {}; var online = Array.isArray(json.online) ? json.online.filter(function (p) { return p && BB.utils.isHttpUrl(p.url); }) : []; return { ready: !!json.ready, head: !!json.head, pending: Array.isArray(json.pending) ? json.pending : [], online: online, onlineCount: Array.isArray(json.online) ? json.online.length : 0, visible: online.filter(function (p) { return p.show !== false; }) }; };
  Lampac.parseProviderHtml = function (html) { var output = [], text = String(html || ''); var re = /data-json\s*=\s*(['"])([\s\S]*?)\1/gi, m, seen = {}; while ((m = re.exec(text))) { var encoded = m[2].replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&'); var item = Lampac.parseJson(encoded); if (item && item.method === 'play' && BB.utils.isHttpUrl(item.url) && !seen[item.url]) { seen[item.url] = true; output.push(item); } } return output; };
  function LampaTransport(lampa) { this.lampa = lampa; this.requests = []; }
  LampaTransport.prototype.getJson = function (url, timeout) { return this.request(url, false, timeout); };
  LampaTransport.prototype.getText = function (url, timeout) { return this.request(url, true, timeout); };
  LampaTransport.prototype.request = function (url, text, timeout) { var self = this; return new Promise(function (resolve, reject) { if (!self.lampa || !self.lampa.Reguest) return reject(new Error('Lampa.Reguest is unavailable')); var done = false, req = new self.lampa.Reguest(); self.requests.push(req); var finish = function (fn, value) { var index; if (done) return; done = true; index = self.requests.indexOf(req); if (index > -1) self.requests.splice(index, 1); try { req.clear(); } catch (ignore) {} fn(value); }; try { if (req.timeout) req.timeout(timeout); (text ? req.native : req.silent).call(req, url, function (data) { finish(resolve, data); }, function (err) { finish(reject, err || new Error('Network request failed')); }, false, text ? {dataType:'text'} : undefined); } catch (e) { finish(reject, e); } }); };
  LampaTransport.prototype.cancel = function () { this.requests.forEach(function (r) { try { r.clear(); } catch (ignore) {} }); this.requests = []; };
  BB.LampacAdapter = function (options) { options = options || {}; BB.AdapterBase.call(this, 'lampac', 'Lampac'); this.origin = options.origin || ''; this.timeout = options.timeout || 15000; this.maxPolls = options.maxPolls || 20; this.maxDuration = options.maxDuration || 15000; this.pollDelay = options.pollDelay || 600; this.lampa = options.lampa || root.Lampa; this.storage = options.storage || (this.lampa && this.lampa.Storage); this.transport = options.transport || new LampaTransport(this.lampa); this.cancelled = false; this.generation = 0; this.cancelResolve = null; };
  BB.LampacAdapter.prototype = Object.create(BB.AdapterBase.prototype);
  BB.LampacAdapter.prototype.constructor = BB.LampacAdapter;
  BB.LampacAdapter.prototype.cancel = function () { this.cancelled = true; this.generation += 1; if (this.waitTimer) { clearTimeout(this.waitTimer); this.waitTimer = null; } if (this.cancelResolve) { this.cancelResolve({status:'cancelled',items:[]}); this.cancelResolve = null; } if (this.transport.cancel) this.transport.cancel(); };
  BB.LampacAdapter.prototype.wait = function () { var self = this; return new Promise(function (resolve) { self.waitTimer = setTimeout(function () { self.waitTimer = null; resolve(!self.cancelled); }, self.pollDelay); }); };
  BB.LampacAdapter.prototype.accountUrl = function (url) { var storage = this.storage, params = {}; if (!storage || !storage.get) return url; params.account_email = storage.get('account_email', ''); params.uid = storage.get('lampac_unic_id', ''); params.nws_id = storage.get('lampac_nws_id', ''); return BB.utils.query(url, params); };
  BB.LampacAdapter.prototype.search = function (media) {
    var self = this, seen = 0, found = [], started = BB.utils.now(), discoveryFlow, cancelFlow, generation = ++self.generation;
    self.cancelled = false;
    if (!BB.utils.isHttpUrl(self.origin)) return Promise.reject(new Error('Lampac origin is not configured'));
    cancelFlow = new Promise(function (resolve) { self.cancelResolve = resolve; });
    discoveryFlow = new Promise(function (resolve, reject) {
      self.transport.getJson(self.accountUrl(Lampac.buildEventsUrl(self.origin, media)), self.timeout).then(function (reply) {
        try {
          var start = Lampac.parseJson(reply) || {};
          if (!start.memkey) throw new Error('Lampac did not return memkey');
          function poll(count) {
            if (self.cancelled || generation !== self.generation) return resolve({status:'cancelled',items:[]});
            if (count >= self.maxPolls || BB.utils.now() - started >= self.maxDuration) return resolve({status: found.length ? 'discovered' : 'empty', providers: found, items:[]});
            return self.transport.getJson(self.accountUrl(Lampac.buildLifeUrl(self.origin, start.memkey, seen, media)), self.timeout).then(function (event) {
              var state = Lampac.parseLifeEvents(event); seen = state.onlineCount;
              state.visible.forEach(function (provider) { if (!found.some(function (x) { return x.url === provider.url; })) found.push(provider); });
              if (state.ready) return resolve({status: found.length ? 'discovered' : 'empty', providers: found, items:[]});
              return self.wait().then(function (go) { return go ? poll(count + 1) : resolve({status:'cancelled',items:[]}); });
            }, reject);
          }
          poll(0);
        } catch (e) { reject(e); }
      }, reject);
    });
    return Promise.race([discoveryFlow, cancelFlow]).then(function (discovery) {
      if (discovery.status !== 'discovered' || self.cancelled || generation !== self.generation) return {status:'cancelled',items:[]};
      var providers = discovery.providers || [];
      return Promise.race([Promise.all(providers.map(function (provider) {
        return self.transport.getText(self.accountUrl(provider.url), self.timeout).then(function (html) { return Lampac.parseProviderHtml(html).map(function (entry) { return BB.Normalizer.fromLampac(entry, provider); }).filter(Boolean); }, function (error) { BB.Diagnostics.add('warn', 'Lampac provider request failed', {provider: provider.name, error: String(error)}); return []; });
      })).then(function (lists) { var flat = []; lists.forEach(function (list) { flat = flat.concat(list); }); return {status: flat.length ? 'ok' : 'empty', items: BB.Normalizer.deduplicate(flat), providers: providers}; }), cancelFlow]);
    }).then(function (result) { self.cancelResolve = null; return result; });
  };
}(typeof window !== 'undefined' ? window : globalThis));
