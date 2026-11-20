# Source adapters

Adapters are isolated from the Lampa UI/bridge. `lampac.js` is the only enabled adapter in 0.1.4.

Contract proposal: explicit Lampac origin + known media metadata in, typed `ok | empty | error | cancelled` outcome out. The first slice covers documented events/lifeevents discovery, provider HTML, and validated direct `method:"play"` entries only. It does not claim support for every Lampac provider. See [src/adapters/README.md](../src/adapters/README.md) and [API_DOCUMENTATION.md](../API_DOCUMENTATION.md) for the evidence and limits.

`bwa.js`, `gbay.js` and `alpac.js` are explicit disabled adapters. They fail closed with a diagnostic error until a primary client/API contract, auth mechanism, result parser and real playback are independently verified. They never fabricate URLs or fixtures.
