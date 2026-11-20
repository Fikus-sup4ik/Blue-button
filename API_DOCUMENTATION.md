# API_DOCUMENTATION.md — Blue-button / аудит ANDRPROD DD 4.0.1

## Источники и границы утверждений

Аудирован файл Andrprod-test-v4.0.1.js, 2 059 строк, SHA-256 2BA22C4C96A94A1B30D15F5A67E1F28FB1390662ABA9521ABAE54847DA18A332. Номера ниже относятся к приложенному файлу.

Статусы:

- **Найдено в исходнике** — вызов/URL/формат явно присутствует в JS.
- **Контракт предполагается кодом** — парсер принимает такую форму, но реальный серверный ответ не приложен.
- **НЕ ПРОВЕРЕНО В LAMPA/НА СЕРВЕРЕ** — исходник не доказывает, что метод существует, его сигнатура корректна или вызов проходит на целевой версии/платформе.

Файл не содержит захваченных сетевых транскриптов или исходников Lampa/Lampac. Ниже нет подтверждённого фактического ответа реального сервера. Образцы JSON — схема, выведенная из ветвлений парсера, и не должны использоваться как фикстуры реального API.

## 1. Обнаружение установленных источников

**Место:** 315–340, 870–949.

Входной список берётся из:

- Lampa.Storage.get('plugins', []) — строки URL или объекты с url/src, name/title, status (887–905);
- Lampa.Manifest.plugins, только если это Array (891–894).

Сопоставление выполняется по подстрокам URL/name с whitelist (315–332); blacklist исключает не-видеоплагины (307–313). Список профилей есть в ARCHITECTURE.md. Это эвристика обнаружения, а не API каждого названного плагина.

## 2. Lampac-like network protocol

### 2.1 Проверка/обнаружение balancers

**Место:** 358–439, 561–643.

Для URL найденного плагина вычисляется origin по regex ^(https?://[^/?#]+) (349–353), затем отправляется:

~~~http
GET <origin>/lite/events?life=true
~~~

Вызов в коде: new Lampa.Reguest(), net.timeout(timeoutMs), net.silent(url, success, error, false, {dataType:'text'}); guard timeout равен настройке + 250 ms, в guard вызывается net.clear() (561–600). Значение timeout по умолчанию 6000 ms; getter разрешает 2000–20000 ms (180–184), UI предлагает 3000/6000/9000/12000 (1860–1864).

**Это точная реализация в файле, а не подтверждённый публичный контракт Lampa.** Reguest написано именно так в исходнике.

Парсер ответа принимает JSON-строку или объект и ищет массивы в корне либо в полях channels, results, online, balancers, data, life.online, life.balancers, life.channels (602–643). У элемента ожидает URL из url|href|host, метку из name|title|balanser, ID из balanser|id|name; игнорирует show:false и disabled:true; URL дедуплицирует без завершающих slash, lower-case.

**Схематический пример, выведенный из парсера (НЕ захваченный ответ):**

~~~json
{
  "life": {
    "balancers": [
      {"id": "example", "name": "Example", "url": "https://host.example/path"}
    ]
  }
}
~~~

### 2.2 Поисковый запрос

**Место:** 645–681.

Для каждого balancer URL собирается GET query. Если URL уже содержит ?, продолжение идёт с &, иначе с ?. Код добавляет:

| Параметр | Источник |
|---|---|
| rjson=true | константа |
| title | текущий query variant, encodeURIComponent |
| original_title | mediaMeta.originalTitle, если непусто |
| year | год, если известен |
| imdb_id | IMDb ID, если известен |
| kinopoisk_id | KP ID, если известен |
| id | card ID (также записан как tmdbId) |
| uid | mediaMeta.uid, если задан; TitleResolver в этом файле его не назначает |
| serial | 1 для series, иначе 0 |
| season, episode | только если truthy; TitleResolver их из карточки не копирует |

Шаблон кода: <bal.url>?rjson=true&title=...&original_title=...&year=...&imdb_id=...&kinopoisk_id=...&id=...&uid=...&serial=0|1&season=...&episode=... (не все опциональные поля будут присутствовать). Точный путь после host берётся из balancer-ответа; фиксированного search endpoint в файле нет.

Код пробует не более трёх queryVariants и делает ограниченный повтор того же URL один раз при ошибке, если включён retry (645–680). Но при первом варианте, давшем результаты, callback завершается; варианты названия не объединяются.

### 2.3 Формы результата, которые умеет разбирать код

**Место:** 686–805.

JSON parser принимает корневой массив или объект с массивом data (724–727). Каждый item читает:

- playback URL из url|file|stream;
- качество из object quality map либо maxquality|quality_label|string quality;
- дополнительные поля: title, year, translate|voice, lang|language, format|rip, subtitles|cc, hdr, dv|dolby_vision, season|s, episode|e (733–745, 773–805).

При объекте quality каждая пара quality→URL становится отдельным вариантом. HTML fallback ищет элементы с class содержащим videos__item, атрибут data-json, затем пробует JSON с массивом / data / results / единичным объектом (692–721).

**Схема для объяснения парсера, НЕ реальный ответ:**

~~~json
[
  {
    "title": "Example release",
    "year": "2020",
    "url": "https://media.example/video.m3u8",
    "quality": {"1080p": "https://media.example/1080.m3u8"},
    "translate": "Русский дубляж",
    "lang": "ru",
    "format": "WEB-DL",
    "subtitles": "ru",
    "season": 1,
    "episode": 2
  }
]
~~~

В данном примере quality map создаст отдельный вариант, используя значение map как stream URL, а ключ как quality label. Синтетический host .example подчёркивает, что это не проверенный endpoint или поток.

Нормализованный объект содержит pluginId, pluginName, sourceName, matchedTitle, year, qualityNum, qualityLabel, hdr, dv, voice, langCode, langLabel, format, subtitles, hasSubtitles, season, episode, streamUrl, qualityMap, canPlay, latency (773–805).

## 3. Нативные плагины и custom adapters

**Нативное делегирование:** 446–479. Программные searchMovie/searchSeries отвечают unsupported, getStreams сообщает unsupported. При выборе результата вызывается CardIntegration.launchPluginLiveButton(pluginId), которая ищет DOM элементы карточки по class/text hints и вызывает событие hover:enter (1326–1383). Это не извлекает результаты нативного источника и зависит от DOM/лейблов.

**Публичный JavaScript facade:** 1964–1976, только при успешной инициализации:

- window.ANDRPROD_API.version
- registerAdapter(adapter), getAdapters()
- search(card, method, scope, force, callbacks)
- cancelSearch()
- filterResults(list)
- checkAllSources(onEach, onDone)
- getDiagnostics()
- storage

Это глобальный объект в окне страницы, не HTTP API.

Внешний adapter wrapper (486–559) ожидает id, optional name/url/description, методы getSourceInfo(), isAvailable(cb) или check(cb), searchMovie/searchSeries/search(...), getStreams, play/open. ВАЖНО: фактический вызов поиска — fn(mediaMeta, mediaMeta.queryVariants, callback) (538–550); переданный opts не передаётся, хотя wrapper передаёт opts в invokeCustomSearch. Callback интерпретируется как (err, list).

## 4. Вызовы Lampa, обнаруженные в коде

Все позиции — source evidence only; совместимость не проверена.

| Вызов/поверхность | Места | Зачем используется |
|---|---:|---|
| Lampa.Storage.get/set | 147–232; 887 | Настройки и список установленных plugins. |
| Lampa.TMDB.image('t/p/w300' + poster_path) | 247–256 | URL постера, если доступен. |
| Lampa.Reguest, timeout/silent/clear | 561–600 | GET, response/error callbacks, таймаут/отмена. |
| Lampa.Player.play({url,title,quality,subtitles}) | 847–865 | Запуск прямого потока; fallback к live-кнопке. |
| Lampa.Listener.follow('full', callback) и ('app', callback) | 1265–1280, 2047–2055 | Обнаружение завершённого full-card и app ready. Проверка типа complite (написано так в исходнике). |
| Lampa.Activity.push({...}), backward() | 1307–1317, 1363–1378, 1618–1628 | Открытие компонентов и возврат для нажатия source button. |
| Lampa.Component.add(name, constructor) | 2007–2017 | Регистрация hub/search components. |
| Lampa.SettingsApi.addComponent/addParam | 1804–1879 | Настройки, actions и diagnostics. |
| Lampa.Select.show({...}) | 1476–1486, 1721–1744 | Scope и source actions. |
| Lampa.Scroll({...}) | 1395, 1633 | Прокрутка UI. |
| Lampa.Controller.add/toggle/collectionSet/collectionFocus | 1577–1602, 1683–1687, 1781–1793 | Пульт, список и фокус. |
| Lampa.Noty.show(text) | 1352, 1374, 1661–1668, 1736 | Уведомления. |
| Lampa.Manifest.plugins = {...} | 1981–1995 | Установка plugin manifest (см. замечание ниже). |

window.$/jQuery также требуется при старте (1997–2002); используется для поиска DOM, создания HTML, событий и CSS injection.

## 5. Проверенные факты vs не проверено

**Подтверждено непосредственно содержимым JS:** названные функции, подстроки endpoints/query, callback signatures в коде, parser field names, whitelist и flow указанной версии файла.

**Не подтверждено:** наличие этих интерфейсов в конкретной Lampa, корректность событий/сигнатур, реальная схема /lite/events и balancer responses, CORS/auth, существование/доступность source servers, player payload compatibility, фактическая работа на Android/TV/Tizen/webOS. Примеры выше — схема parser inputs, не ответ реального источника.


## 6. Найденные дефекты и зоны риска исходника

Это findings статического чтения, не результаты runtime-тестов:

- **Manifest inconsistency (1981–1995 vs 891–894):** registerManifest присваивает Lampa.Manifest.plugins одиночный объект, а сканер добавляет эти данные только если значение — Array. Возможно затирание ожидаемого списка plugins. Проверить контракт Lampa и порядок вызовов.
- **Metadata неполна (258–275):** TitleResolver не переносит season, episode или uid, хотя query builder умеет их добавлять (661–664). Для serial поиска параметры обычно пусты.
- **Неиспользуемый best mode:** настройки принимают auto/manual/best (173–179), но create() запускает поиск для любого значения кроме manual (1404–1410); в файле нет реализации BestChoiceEngine, несмотря на заголовочный комментарий строки 16.
- **Неполный voice filter:** настройка multi зарегистрирована, но FilterEngine проверяет только dub и orig (1017–1022).
- **Неиспользуемый hideUnavailable:** getter и настройка присутствуют (198, 1846), но вызов getter не найден.
- **Custom adapter argument mismatch (486–559):** search вызывается как fn(mediaMeta, queryVariants, callback), opts теряется; контракт должен быть однозначно исправлен.
- **Variants short-circuit (645–680):** дальнейшие title variants запрашиваются только когда предыдущий дал пустой список; совпадения не агрегируются.
- **Cache key collisions (1057–1073):** ключ не включает год/season/episode; возможны неверные совпадения кэша для одноимённых релизов и серий.
- **Stale handles (1076–1095, 575–581):** completed net handles/timers не удаляются из tracking arrays до следующей отмены, что может удерживать ссылки/очищать старые handles позднее.
- **Potentially hanging health checks (1233–1253):** для custom adapters нет внешнего timeout вокруг isAvailable callback.
- **Misleading native integration fallback (358–439, 446–479):** kind lampac_or_native создаётся Lampac adapter, хотя текст reason обещает делегирование; failure path возвращает error/unsupported, но не вызывает native-button adapter.
- **Premature success for async delegation (1326–1378):** после Activity.backward() функция возвращает true до нахождения и активации кнопки.
- **Fragile content parsing and UI bridge (692–721, 1326–1383):** HTML regex и DOM class/text hints зависят от точной разметки и локализации.
- **Static support labels (403–415):** supported/integrationLevel задаются без доказательства успешного endpoint check и могут переоценивать уровень интеграции.
- **Input safety (1422–1425, 847–865):** poster вставляется в inline style; playback URL напрямую передаётся в Player.play. Нужна проверка схемы/экранирование.
- **Filter meaning mismatch:** sort speed сравнивает latency результата (latency записан одинаковым для вариантов одного ответа адаптера), поэтому порядок может не отражать скорость отдельных stream URLs.

Исправления следует делать отдельно после подтверждения контрактов Lampa и зафиксированных fixtures: исправить несоответствия metadata/adapters/cache/lifecycle, явно моделировать best selection и voice multi, валидировать URL/HTML, а native fallback показывать как действие, не как найденный playback result.
