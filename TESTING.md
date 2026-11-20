# TESTING.md — Blue-button

## Статус

На 2026-11-20 исходный файл ANDRPROD DD 4.0.1 прочитан полностью и проанализирован статически. Это не является тестом плагина. Реальные тесты в Lampa и на серверах Lampac не выполнялись; ни исходный ANDRPROD, ни будущий Blue-button не объявляются работающими.

Источник статического аудита: Andrprod-test-v4.0.1.js, 2 059 строк, SHA-256 2BA22C4C96A94A1B30D15F5A67E1F28FB1390662ABA9521ABAE54847DA18A332. API и ссылки на строки см. API_DOCUMENTATION.md.

## Аудиторские проверки

- Просмотрен файл от начала до конца, включая bootstrap, adapters, сетевой код, parsers, карточку, UI, settings и public facade.
- Найден запрос к /lite/events?life=true и поисковый query к URL из balancer payload; реальный запрос/ответ не записывался.
- Найдены обращения к Lampa.Storage, Reguest, Listener, Activity, Component, SettingsApi, Select, Scroll, Controller, Noty, TMDB.image и Player.play; интерфейсы в живой Lampa не проверялись.
- Файлы Blue-button и ANDRPROD не менялись; исходный прикреплённый JS не изменялся и не копировался в репозиторий.

## Тесты перед реализацией

1. **Lampa plugin bootstrap:** загрузить плагин на каждой заявленной версии; проверить раннее/позднее появление Lampa и jQuery, app-ready listener, повторную установку, manifest и регистрацию обоих components.
2. **Manifest side effects:** проверить, что присваивание Lampa.Manifest.plugins не затирает список плагинов и что сканирование выполняется ожидаемым образом.
3. **Карточка:** movie и series, разные варианты card event payload, событие full/complite, ровно одна кнопка, repeat opening/closing и cleanup обработчика.
4. **Метаданные:** title/name, original_title/original_name, release/air date, movie/tv, IDs, poster_path/img; отдельно выяснить, откуда должны поступать season/episode/uid.
5. **Network bridge:** доступность Lampa.Reguest, точная сигнатура silent/timeout/clear, HTTP status/error, timeout и отмена на реальных платформах; проверить GET без CORS/auth assumptions.
6. **Lampac discovery:** на тестовом сервере зафиксировать реальный обезличенный ответ /lite/events?life=true, форма balancer URL, disabled/show flags и dedup; сравнить с parser expectations.
7. **Lampac search:** записать полный URL и реальный ответ для фильма/сериала; проверить каждый optional query param, percent encoding, URL с уже имеющимся query/fragment, отсутствие параметров; проверить movie/series, season/episode, IDs.
8. **Search variants/retry:** проверить, что разные title variants могут найти релизы; воспроизвести ошибку, пустой ответ и timeout; убедиться, что retry не дублирует результат и не опрашивает лишнее.
9. **Parser:** реальные JSON root arrays, data arrays и HTML videos__item/data-json; malformed JSON, unsupported shapes, encoded quotes/ampersands, multiple qualities, broken URLs и unknown fields.
10. **Parallelism/cancel/cache:** несколько быстрых/медленных adapters, ошибка одного, закрытие экрана, новый поиск, cancel, завершение всех callbacks; проверить TTL и cache key для одинаковых названий/ID, годов и разных серий.
11. **Dedup/filter/sort:** одинаковый stream URL из источников, разные качества/озвучки, сезон/серия; language edge cases, min/max unknown quality, multi voice, hideUnavailable, latency sorting.
12. **Playback:** проверить реальную сигнатуру Lampa.Player.play, stream protocol, quality map/subtitles; проверить возврат к native source button когда прямой play недоступен, отсутствие найденной кнопки и задержку рендера карточки.
13. **Native delegation:** проверить DOM selectors, localized label/class hints и hover:enter для каждого поддерживаемого plugin; при неуспехе не показывать успех.
14. **Settings/UI:** SettingsApi schema, select/trigger defaults, toggle sources/priorities, focus/scroll/back on remote, mouse/keyboard, scroll.destroy and event listener cleanup.
15. **Security:** HTML escaping, untrusted poster URL style insertion, external plugin names/classes, secret-free logs, scheme/host validation before playback.

## Известные проверки, которые сейчас не проходят по доказательствам

Нет приложенных captured fixtures и нет тестов/раннера в текущем репозитории. Схемы в API_DOCUMENTATION.md выведены из парсера и годятся только как тестовые синтетические примеры, не как факт о сервере. Синтаксическая проверка или DOM mocks не заменят живой тест Lampa.

## Критерий принятия первого вертикального среза

В реальной Lampa зафиксировать версию/устройство и пройти: карточка → единственная кнопка → запрос к реально доступному тестовому source → настоящий результат → выбор → фактическое воспроизведение; затем возврат, повторный поиск, cancel и закрытие без зависших callbacks/listeners. В отчёте записать шаги/результаты и redacted request/response. До этого статус: **интеграция не проверена**.
