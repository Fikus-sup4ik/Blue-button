# Adapters

## First adapter: Lampac

Planned interface (contract proposal, not implemented):

- `id: "lampac"`, `search(context, signalOrCancelHandle) -> Promise<SearchOutcome>`.
- Context has only known fields: `title` required; optional `originalTitle`, `year`, `mediaType`, `source`, `tmdbId`, `imdbId`, `kinopoiskId`, `serial`, `season`, `episode`. Unknown values stay absent.
- Configuration supplies an explicit Lampac origin and optional auth settings. Credentials must not be bundled or logged.
- Adapter sequence: metadata-bearing `/lite/events?...&life=true` → read `memkey` → bounded long-poll `/lifeevents` → select visible source → fetch provider HTML as text → parse known `.videos__item` / `data-json` entries.
- Outcome distinguishes `ok`, `empty`, `error`, `cancelled`; never fabricates a stream.
- First scope accepts only concrete `method:"play"` entries with a validated URL. `call`, `link`, RCH and series navigation remain unsupported.

Primary protocol references and the caveat that documentation examples are not live captures are in [API_DOCUMENTATION.md](../../API_DOCUMENTATION.md). Exact Lampa Reguest signatures are also recorded there. This proposal must be reviewed before coding.
