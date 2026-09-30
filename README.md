# Critical Fail Shared

Critical Fail Shared is Foundry VTT Module for The Critical Fail Server D&amp;D games. Inside the module contains various compedium packs for use for games run in the Azure Realms campaign setting. Games run with this module assume the PF1 Game System.

Spheres content in this module is Open Game Content:

- **Spheres of Guile Talents** — skill spheres from Artifice through Vocation, as Pathfinder skill talents for `pf1spheres`. Icons match the [Spheres Wiki](https://taylorturnerit.github.io/spheres-wiki/).
- **Spheres Feats** — Power, Might, Guile, and Champions feats, including Dual Sphere feats.
- **Spheres Items** — marvelous items, implements, spell engines, compounds, weapons, armor, and the other equipment catalogs from the [Spheres of Power Wiki](https://spheresofpower.wikidot.com/start).
- **Tech, Tinker, and Occultism** — those three spheres' talents. Occultism grants bonus skill ranks from its base sphere.
- **Spheres Classes** — champion, operative, practitioner, and prestige classes (Dragoon, the Guile operatives, Technician, Aeronaut Captain, and the rest of the 1.4.2 list) with their class features linked on each class.

Rebuild with `node tools/build-guile-talents.mjs`, `node tools/build-sphere-feats.mjs`, `node tools/build-sphere-items.mjs`, and `node tools/build-expansion-142.mjs`. Those scripts load `classic-level` from `F:\Code\Foundry Code`.
