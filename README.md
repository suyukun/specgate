# specgate

**You bring the idea. The rules do the decomposing. An ordinary agent raises the building.**

Skyscrapers are not built by genius bricklayers alone. Ordinary crews build them from blueprints: a spec before work starts, decisions on record, an inspection before handover. specgate gives AI coding agents that paperwork. Five plain markdown documents. They grow with your project. The process carries the building — not the talent of one model.

[中文版](README.zh-CN.md)

## DONE WHEN — the 30-second install test

Ask your agent to run `specgate --version` (or run it yourself):

```bash
specgate --version
```

**DONE WHEN: the command prints one version line.** That is the whole install test. No config. No login. No network.

Want a second look? Ask your agent to run `specgate start` in any git repository. Three questions print. Then one exact next command prints. If you can read that command, onboarding works.

## The shortest path — three steps

> Every command in this README is ask-first. Your agent asks you before running anything. You approve. It runs. Nothing runs on its own.

1. **Install.** Ask your agent to run `npm i -D @smashupcn/specgate`. Then verify with `specgate --version` — one version line means installed.
2. **Route.** In your git repository, ask your agent to run `specgate start`. Answer three questions. It prints one exact next command. Run it together. A new project takes about 10 minutes with your agent — mostly conversation time: the kit drafts `AGENTS.md` with you, not for you.
3. **Check.** Ask your agent to run `specgate check`. Expect `PASS <name> (stage S0)`: `AGENTS.md` at the root, the gate-doc template in `docs/plans/`, the ADR index in `docs/adr/`. Your repository now carries its own rulebook.

Letting an agent install this for you? Hand it [INSTALL.md](INSTALL.md). It is written for the agent, with the same ask-first rules.

## Five documents, added by signals — not on a schedule

Start with two documents at S0. The rest arrive when the project sends hard signals you can see.

| Stage | Signals you can see | Add | What it prevents |
| --- | --- | --- | --- |
| **S0 — exploring** | An idea and a skeleton. Nothing runs end to end yet. | ① Gate doc (spec) in `docs/plans/` ② Decision log (ADR) in `docs/adr/` | Building the wrong thing. Forgetting why you chose something. |
| **S1 — main flow works** | One command runs the main flow end to end on real data. | ③ Task board ④ Architecture doc | To-dos scattered across chats. Architecture nobody can recall. |
| **S2 — real usage** | Real users give feedback. You iterate on requests. | ⑤ Design spec | Two sources of truth fighting over UI or interfaces. |
| **S3 — released** | Public release, external users, compatibility promises. | Nothing new — existing gates get stricter. | Regressions reaching your users. |

Stage lives in one marker line under the title of `AGENTS.md`. A stage move is an explicit event, decided on signals — never on feelings.

## What the kit asserts — four capabilities

### 1. ADR records — the whole pipeline, rules on paper (machine-checked in v0.2)

A decision does not stay "in the chat". It becomes a numbered file in `docs/adr/`, indexed, and linked where it is used. Closing a `#decision` board card requires an `adr:` reference (or a one-line exemption). M and L batches must cite an ADR to converge. `feat` / `fix` / `perf` / `refactor` commits carry `ADR-NNNN` in the message, or a `no-adr:` reason. The check enforces these hooks mechanically in v0.2; today they are template and process rules. Default rules, zero config, plain markdown, any agent tool.

### 2. Governance assertions — process that does not rely on self-discipline

`specgate check` reads your files and asserts the rules: stage marker versus installed documents, zero open decision cards before dispatch, acceptance criteria in checkable form, task board installed. All findings print at once, in check-item order. Each failure carries where it was found, what was expected, and the exact fix command (where / expected / fix). One line wires the check into CI — added only when you ask.

### 3. Decision cards — decisions become multiple choice

When a spec is unclear, your agent writes a numbered card: one question in two lines, options a/b/c, one recommendation. You reply "1a 2b 3 default" — or "default" once, to accept every recommendation in the batch. Cards live in one ledger with three states. Solo mode answers its own cards with the recommended default; you override only where you truly disagree.

### 4. EARS acceptance criteria — "done" is checkable by anyone

Every requirement reads `When <condition>, the system must <observable behavior>` and names the test or command that checks it. The check verifies the form and flags vague words with a correction. A fully worked batch — cards answered, all seven converge steps passed — ships in [templates/gate-doc.example.md](templates/gate-doc.example.md).

**Also included — cross-session handoff.** The `rose-handoff` skill writes one document when a session ends and reads it when the next begins, under `handoffs/`. Switching tools or windows costs an estimated five minutes, not a lost session — shaped by two months of daily use on real project work.

## Support matrix — no silent failure after install

| Agent tool | Reads `AGENTS.md` automatically? | What the kit does |
| --- | --- | --- |
| Claude Code | Yes | Nothing to wire. |
| Codex CLI | Yes | Nothing to wire. |
| Gemini CLI | Yes | Nothing to wire. |
| Cursor | No — reads `.cursor/rules/` | `specgate init` offers a one-line pointer file. It asks before creating it. |
| GitHub Copilot | No — reads `.github/copilot-instructions.md` | Same one-line pointer, ask-first. |
| Windsurf | No — reads `.windsurf/rules/` | Same one-line pointer, ask-first. |
| Anything else | If it reads its own rules file | Write one line pointing at `AGENTS.md`. Ask first. |

Tools change how they read rules. This matrix was verified against documentation at release time (2026-10). `init` suggests the pointer file and, with your approval, creates it; the check's verification that pointers exist and point at `AGENTS.md` arrives in v0.2 — it cannot verify how a third-party tool behaves.

## Why it is safe to try

- **Everything is plain markdown in your repository.** No database. No server. No proprietary format. Your git history is the audit trail.
- **`git revert` is a clean exit.** The kit only adds files; it never edits yours. Delete the added files — or revert the commits — and the repository is exactly as before. No hidden state lives outside the repository: clone the repo, reinstall the kit, everything is back.
- **Offline after install.** The kit makes no network calls. Cold `init` copies its templates in well under a second (local-copy measurement, no network, excluding the npm download). Every check runs locally.
- **`init` never modifies an existing file.** Adopting an existing repository is add-only. Collisions are listed for you to decide — never resolved by the tool. Upgrades never edit your filled files either; the check only warns when a shipped template is newer than yours.

## Known limitations

- **One writer at a time.** A board card is held by one worker at a time. v1 has no cross-machine lock. Before two agents take the same card, you coordinate — the kit does not stop them on its own.
- **No team panel in v1.** The board is markdown files plus a CLI. No dashboard. No web view. Nothing shared beyond the repository.
- **The check is advisory until you wire it.** It prints PASS / WARN / FAIL and writes nothing. Wiring it into pre-commit or CI is one line — done only when you ask for it.

## Two layers — how deep you go is your choice

**Layer 1 — three actions.** What most sessions need, and nothing more.

| Command | What it does |
| --- | --- |
| `specgate start` | The single entry. Three questions, one exact next command. |
| `specgate check` | Governance assertions. All findings at once, each with a fix example. |
| `specgate handoff` | Cross-session handoff, written or read (`rose-handoff`). |

**Layer 2 — the full documents.** Read on demand, in this order:

1. `templates/AGENTS.template.md` — the project rules template
2. `templates/gate-doc.template.md` — the batch spec rulebook
3. `templates/gate-doc.example.md` — a fully filled batch
4. `skills/rose-bootstrap/SKILL.md` and `skills/rose-handoff/SKILL.md` — the flows your agent follows

Templates ship in English by default. `specgate init --lang zh` installs the Chinese set from `templates/zh/` (`specgate check --lang zh` compares against it), and `specgate check` scans `开工门槛-*.md` gate docs alongside `gate-*.md`.

---

*specgate is an open-source governance kit for AI coding agents. Everything it creates stays in your repository.*
