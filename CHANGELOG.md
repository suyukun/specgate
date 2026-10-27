# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

<!-- Keep a Changelog sections stay empty until there is something to record. -->

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [0.1.0] - 2026-10-28

First public release of specgate: stage-aware governance for repositories AI agents
work in. Everything the kit creates is plain markdown that stays in your repository.

### Added

- **Five-document governance kit.** A gate doc (spec) template in `docs/plans/`, an ADR
  decision log in `docs/adr/`, a task board, an architecture doc, and a design spec —
  installed by stage signal (S0 → S3), not on a schedule. See "Five documents, added by
  signals" in the README.
- **`AGENTS.md` scaffold.** Generated from `templates/AGENTS.template.md` with you, not
  for you; carries the single stage marker line the check reads.
- **`specgate init` command.** Add-only scaffolding: it never modifies an existing file.
  Collisions are listed as `exists, untouched` for you to decide. `--adopt` brings an
  existing repository under the kit without rewriting its own `AGENTS.md`, board, or
  decision directory. Agent pointer files (Cursor, GitHub Copilot, Windsurf) are only
  written after you approve them — ask-first, or explicitly with `--yes`.
- **`specgate check` command.** Governance assertions against the stage marker, printing
  all findings at once, each as a `where` / `expected` / `fix` triple with a copyable
  next command. Statuses: PASS / WARN / FAIL / SKIP. Exit codes: `0` ok (check:
  PASS/WARN/SKIP), `1` check FAIL under `--strict`, `2` usage error. Parameterization:
  `--docs-dir`, `--adr-subdir`. CRLF-tolerant. Writes nothing.
- **Two agent skills.** `skills/rose-bootstrap/SKILL.md` (scaffold the governance docs for
  new and existing repositories) and `skills/rose-handoff/SKILL.md` (write a handoff when
  a session ends, read it when the next begins, under `handoffs/`).
- **Worked example batch.** `templates/gate-doc.example.md` ships a fully filled batch —
  decision cards answered, converge steps passed — for reference only.
- **Agent-facing install guide.** `INSTALL.md`, written for the installing agent under the
  same ask-first rules.
- **Zero runtime dependencies.** Node.js >= 18, no network calls beyond the npm download.

### Known issues

<!-- PLACEHOLDER — TO BE POPULATED AFTER EMPIRICAL VERIFICATION (tonight's test run). -->
<!-- Record at most 5 entries. Each entry uses exactly these three fields:
     - Symptom        what the user sees
     - Trigger        the condition that reproduces it
     - Workaround     how to get around it
     Delete this comment block once real entries are filled in. Do not invent issues here. -->

_No issues recorded yet. This section is filled from empirical verification results and
lists at most five entries, each with Symptom / Trigger / Workaround._

[Unreleased]: https://github.com/OWNER/specgate/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/OWNER/specgate/releases/tag/v0.1.0
