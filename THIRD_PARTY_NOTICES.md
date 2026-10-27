# Third-Party Notices

## Summary

- **Zero runtime dependencies.** This package declares no `dependencies`. Nothing is fetched,
  bundled, or vendored from third-party code at runtime, and the kit makes no network calls.
- **No third-party code is distributed** in this package.
- **`skills/` and `templates/` are original content of this project**, dedicated to the public
  domain under CC0-1.0 (see `LICENSES/CC0-1.0.txt`). The CLI source is MIT (see `LICENSE`).
- **The task board is an optional external tool.** It is installed by the user, is **not**
  distributed with this package, and is not licensed or warranted by this project. v1 documents
  make no performance claims about it.

## Attribution boundary

| Path | Origin | License |
| --- | --- | --- |
| `src/`, `dist/` | This project | MIT (`LICENSE`) |
| `templates/` | This project, original | CC0-1.0 |
| `skills/rose-bootstrap/`, `skills/rose-handoff/` | This project, original | CC0-1.0 |
| `README.md`, `README.zh-CN.md`, `INSTALL.md`, `onboarding.md`, docs | This project, original | CC0-1.0 |
| Task board tool (user-installed, stage S1) | Upstream project, not redistributed | Upstream terms; see its own package |

License texts shipped in this package: `LICENSE` (MIT), `LICENSES/CC0-1.0.txt` (CC0 1.0
Universal, official text from creativecommons.org).

## Upstream provenance ledger

Reserved for when a dependency or vendored file is introduced. Every row must be filled from
the upstream artifact itself, not from memory. One row per upstream component.

| Component | Version / commit | Upstream URL | Upstream license | License text included? | Where used in this package | Verified on |
| --- | --- | --- | --- | --- | --- | --- |
| _(none yet)_ | | | | | | |

Maintenance rule: before adding anything to this table, copy the exact upstream license text to
`LICENSES/<identifier>.txt`, pin the version or commit, and record the date the notice was
checked against the upstream source. Remove a row when the component leaves the package.
