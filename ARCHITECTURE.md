# ARCHITECTURE.md — Blue-button

## Статус аудита

Дата: 2026-11-20. Основной изученный источник: приложенный файл `Andrprod-test-v4.0.1.js`, 2 059 строк, SHA-256 `2BA22C4C96A94A1B30D15F5A67E1F28FB1390662ABA9521ABAE54847DA18A332`. Файл прочитан полностью. Номера строк ниже относятся к этому файлу.

**Важно:** ниже описана архитектура, реализованная в исходнике. Наличие вызовов и функций в тексте не подтверждает, что они работают с актуальной Lampa или серверами. API/ответы, которые нельзя проверить только по этому JS-файлу, помечены как непроверенные в [API_DOCUMENTATION.md](API_DOCUMENTATION.md). Старый файл не переносился в Blue-button.

## Карта архитектуры ANDRPROD DD 4.0.1

Файл — самовызывающаяся функция с `'use strict'`, без импортов и внешней модульной сборки (строки 1–2). Внутренние модули — объекты и функции в замыкании. Заявленная ES5-совместимость и список платформ находятся в комментарии строк 5–6; отдельные платформенные тесты в файле не приводятся.

### Карта потока

```text
bootstrap / startPlugin
  ├─ Manifest, Component.add, CSS
  ├─ SourceRegistry.resetAndScan
  │    ├─ Lampa.Storage['plugins'] + Lampa.Manifest.plugins
  │    ├─ substring whitelist / blacklist
  │    ├─ Lampac-like adapter -> /lite/events -> balancer search
  │    └─ native delegation adapter -> live button in card
  ├─ CardIntegration: Listener.follow('full') -> prepend search button
  └─ SettingsIntegration: SettingsApi

Кнопка карточки -> Activity.push(search component)
  -> UnifiedSearchEngine
      -> TitleResolver -> Adapter.searchMovie/searchSeries in parallel
      -> SearchCache / retries / per-source statuses
      -> parse + normalize -> exact-signature dedup
      -> FilterEngine -> render list
  -> adapter.play -> Player.play or trigger native source button
```

Стрелки описывают кодовые вызовы, не результат теста.

### Модули и связи

| Модуль / диапазон строк | Назначение и связи |
|---|---|
| Constants/bootstrap guard (24–30) | Глобальный guard `window.andrprod_dd_ready`, ID/name/version компонентов. |
| `Diagnostics` (35–91) | Состояние загрузки, последние поиски/проверки, до 50 ошибок; собирает статус через `SourceRegistry` и `StorageManager`. |
| `BrandIcons` (96–123) | Генерирует SVG логотип и мини-иконку. |
| `StorageManager` (128–232) | Обёртка над `Lampa.Storage.get/set`; режим, timeout, retry, языки, качество, озвучка, enabled sources, priorities. Используется реестром, поиском, фильтрами и настройками. |
| `TitleResolver` (237–302) | Получает поля из объекта карточки, определяет movie/series, год, ID, постер, рейтинг, сезоны и query variants. Не делает отдельный TMDB/IMDb/KP HTTP-запрос. |
| Whitelist/blacklist (307–340) | Сопоставляет плагины по подстрокам имени/URL; запрещает категории, похожие на UI, torrent, metadata и т. п. |
| `AdapterFactory` (348–559) | Создаёт Lampac-like адаптер, адаптер делегирования нативной кнопке и wrapper для стороннего JS-адаптера. Контракт: `getSourceInfo`, `isAvailable`, `searchMovie`, `searchSeries`, `getStreams`, `play`. |
| Network/probe and Lampac parser (561–865) | `probeEndpoint` использует `new Lampa.Reguest()`, `timeout`, `silent`, `clear`; парсит candidate balancers и ответы JSON/HTML; нормализует варианты; `launchPlaybackSafe` зовёт `Lampa.Player.play` или делегирует исходной кнопке. |
| `SourceRegistry` (870–978) | Собирает встроенные и custom adapters, читает список плагинов из Lampa storage/manifest, распознаёт allowlist и сортирует по priority/name. |
| `FilterEngine` (983–1052) | Фильтры языков, min/max качества, часть voice preferences, сортировка по source priority/quality/latency/name. |
| `SearchCache` (1057–1074) | In-memory cache с TTL 300 000 ms. Ключ: mediaType + tmdbId/title + scope. |
| `UnifiedSearchEngine` (1076–1255) | Отмена активных сетевых объектов/таймеров, параллельный поиск, callbacks `onUpdate/onComplete`, per-source status, retry через adapter, signature-based dedup, health checks. |
| `CardIntegration` (1260–1384) | Слушает событие `full/complite`, берёт card/movie, добавляет кнопку в DOM, открывает search Activity. Для закрытых источников ищет их live-кнопку по тексту/class и имитирует `hover:enter`. |
| `AndrprodSearchComponent` (1389–1613) | Экран поиска: auto/manual запуск, обновление/отмена, выбор scope, карточки результатов, per-source statuses, controller/scroll; destroy отменяет текущий поиск. |
| `HubLauncher` + `AndrprodHubComponent` (1618–1799) | UI источников и диагностики, включение/выключение, priority, health-check, навигация. |
| `SettingsIntegration` (1804–1879) | Регистрирует компонент и параметры в `Lampa.SettingsApi`; открывает Hub/Diagnostics. |
| Utilities/styles (1884–1961) | escaping, IDs, labels, CSS; inject CSS через jQuery. |
| `window.ANDRPROD_API` (1963–1976) | Публичный JS facade для регистрации adapters, поиска, фильтрации, health-check, diagnostics и storage. |
| Manifest/start/bootstrap (1981–2059) | Заполняет `Lampa.Manifest.plugins`, регистрирует компоненты, сканирует источники, ставит hooks; ждёт Lampa/jQuery до 10 секунд (40 × 250 ms), затем ждёт `app/ready` если нет `window.appready`. |

### Источники и стратегия адаптации

- Реальный программный поиск в коде создан только для класса `lampac_protocol` через обнаруженный URL плагина и endpoint `/lite/events?life=true`, затем запрос к URL из balancer-объекта (строки 358–439, 645–680).
- `lampac_or_native` также пробует этот endpoint, но при неподдерживаемом API по факту не переходит к native delegation из search flow; в коде делегирование заложено в описании, но адаптер остаётся LampacAdapter. Это требует исправления/проверки.
- Остальные whitelist-плагины получают native delegation adapter: поиск и получение потоков возвращают unsupported; воспроизведение пытается открыть исходную кнопку в карточке (446–479).
- Сторонний custom adapter регистрируется через `window.ANDRPROD_API.registerAdapter`, затем оборачивается (486–559, 951–957).
- Список whitelist показывает намерение распознавать Lampac, BWA, UAFlix, UAFilm, Line Prime, Online Mod, Alpaca, Lumio, Showy, HDRezka, KinoPub, Filmix, Kodik, Ashdi, Eneyida и UAKino (315–332). Это не доказательство совместимости каждого источника.

## Что переносить в Blue-button

Безопасно переносить как концепции и после самостоятельной реализации:

1. Чёткий внутренний контракт адаптера и раздельные adapters по источнику.
2. Выделенные title/meta normalizer, source registry, search coordinator, filters и diagnostics.
3. Частичные статусы поиска, изоляцию ошибок источника, ограниченные timeout/retry, in-memory cache с полноценным ключом.
4. Раздельный режим: подтверждённый API адаптер vs явное «открыть источник»; не имитировать успешное получение результата для закрытого плагина.
5. Фильтрацию/дедупликацию, только после тестов на fixtures и с сохранением вариантов.
6. Небольшие UI-паттерны навигации, если актуальные Lampa API и целевые платформы подтвердят их.

Не переносить код целиком, поиск DOM-кнопок по строковым подсказкам, предположения о response schema, whitelist как доказательство API, direct player вызов без проверки, а также функции, лишь заявленные комментариями.

## Приоритетный план нового проекта

1. Использовать этот файл как reference и сохранить карту подтверждений; сначала получить/зафиксировать версию Lampa и проверяемые API её plugin/component/player/network слоёв.
2. Верифицировать `/lite/events` и balancer protocol на безопасном тестовом сервере: реальные запрос/ответ, авторизация, CORS, content types, movie/series/playback.
3. Спроектировать один адаптер для проверенного источника; остальные источники оставить unsupported/manual entry, пока нет контрактов.
4. Сделать минимальный card → button → search result → player vertical slice; тестировать в реальной Lampa на заявленных устройствах.
5. Затем добавлять фильтры, cache, settings и дополнительные adapters. Каждый этап — отдельный небольшой commit и обновление API/TESTING документации.

См. [API_DOCUMENTATION.md](API_DOCUMENTATION.md) — места в исходнике и точный статус проверки; [TESTING.md](TESTING.md) — список реальных проверок.

## Первый прототип: технический фундамент (2026-11-20)

## Реализованная архитектура 0.1.0

`src/core.js` содержит общие безопасные операции; `title-resolver`, `normalizer`, `cache-manager`, `diagnostics` и `search-manager` не зависят от UI. `adapters/lampac.js` изолирует сетевой протокол. `lampa-bridge` — единственное место для Manifest, Activity, Component, Noty и Player. `components/results` создаёт экран и передаёт только выбранный normalized result в bridge. `bootstrap` связывает модули и защищает от повторной инициализации флагом `window.blue_button_ready`.

Сборщик `scripts/build.js` соединяет эти ES5-файлы в `dist/blue-button.js` без внешних runtime-зависимостей. Promise используется для управления асинхронным поиском и должен быть проверен на целевых старых WebView до объявления совместимости.

Это план минимального вертикального среза, не утверждение о готовом коде. Карточное действие будет регистрироваться документированным `Lampa.Manifest.plugins` context action; официальный setter добавляет manifest entry. Прежнее сомнение об «перезаписи массива» снимается ниже в API документации.

Минимальные будущие модули:

- `src/bootstrap.js`: ждать готовности Lampa и запускать регистрацию один раз.
- `src/lampa-bridge.js`: тонкий слой над подтверждёнными Manifest, Component, Activity, Reguest и Player surfaces.
- `src/card-integration.js`: получить card context из manifest action и передать его в Activity.
- `src/components/results.js`: состояния поиска, список результатов и выбор.
- `adapters/lampac.js` (top-level): metadata events, memkey/poll, provider HTML, извлечение известных play-элементов.
- `src/normalizer.js`: внутренняя схема подтверждённых результатов и URL validation.
- `src/player-bridge.js`: передача выбранного прямого URL в документированный Player API.
- `tests/`: unit fixtures и проверки независимых от Lampa функций.
- `dist/`: пока только README; готовой сборки нет.

### Вертикальный сценарий и границы

Карточка (Manifest action) → Activity/component с карточкой → Lampac `/lite/events` с metadata и `life=true` → получить `memkey` → опрашивать `/lifeevents` с поисковым контекстом и growing `seen` → выбрать элемент `online` с `show:true` → запросить provider URL как text → разобрать известные Lampac HTML `.videos__item` / `.videos__button[data-json]` → показать только подтверждённые `method: play` → передать URL/title/quality/subtitles в Player.play.

В первом срезе не поддерживать `call`, вложенные `link`, RCH, сериал-иерархии, voice buttons или прочие источники. Документные примеры Lampac — shape references, не captured responses; реальные ответы пока не снимались.

Порядок реализации после review: unit tests URL builder/parser → bootstrap и manifest action → экран результатов → Lampac lifecycle/cancel → provider parser → выбор → Player.play → живой acceptance run. Совместимость и работоспособность до этого не заявляются.

См. [API_DOCUMENTATION.md](API_DOCUMENTATION.md), [TESTING.md](TESTING.md). Первичные источники зафиксированы по commit `94d274e76b06ee0c1b5d4b52c1cc47805e9d5496`.


Примечание к раскладке: для первого прототипа каталоги верхнего уровня — `src/`, `adapters/`, `tests/`, `dist/`; ранний общий эскиз `src/adapters/` в аудиторском разделе не является выбранной раскладкой и superseded этой схемой.
