# Source layout

Planned first prototype modules; no runtime code has been implemented yet:

- `bootstrap.js` — readiness and one-time startup.
- `lampa-bridge.js` — narrow wrappers for documented Lampa integration points.
- `card-integration.js` — card context action and activity navigation.
- `components/results.js` — search/result states and selection UI.
- `normalizer.js` — validate and normalize provider entries.
- `player-bridge.js` — hand a selected result to the Lampa player.
Source adapters live in the top-level `adapters/` directory; see its README for the Lampac contract.

The implementation waits for review of the API contract and this layout.
