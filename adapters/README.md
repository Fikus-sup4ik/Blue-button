# Source adapters

Adapters are isolated from the Lampa UI/bridge. The first planned adapter is `lampac.js`; it is not implemented.

Contract proposal: explicit Lampac origin + known media metadata in, typed `ok | empty | error | cancelled` outcome out. The first slice covers documented events/lifeevents discovery, provider HTML, and validated direct `method:"play"` entries only. It does not claim support for every Lampac provider. See [src/adapters/README.md](../src/adapters/README.md) and [API_DOCUMENTATION.md](../API_DOCUMENTATION.md) for the evidence and limits.
