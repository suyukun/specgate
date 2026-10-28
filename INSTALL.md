# INSTALL — instructions for the installing agent

> This file is written for the AI agent that installs this package. A person can follow it too. It ships inside the package on purpose: point your agent at it.

## OBJECTIVE

Install specgate into the user's environment and prove it works. Change nothing that already exists.

## DONE WHEN

1. `specgate --version` prints one version line.
2. In the user's git repository, `specgate start` prints its three routing questions and one exact next command.
3. The final report (five lines, fixed format below) is delivered to the user.

Install-verified is not bootstrapped. Creating `AGENTS.md` starts only if the user says yes, as a separate step.

## Rules — read once, obey all

1. **Ask first.** Ask the user before every command in this file and before every file change. Batch one step into one shell call, so the user approves once per step.
2. **Never delete or overwrite.** An existing file stays exactly as it is. If a step would touch one, stop and report instead.
3. **One install method.** Dev dependency, global, or npx. Ask which one. Install exactly one.
4. **Already installed? Keep it.** Report the found version. Offer `npm update specgate` — ask before running that too.
5. **No writes to user-global state.** Do not edit shell rc files, editor configs, or agent rules/memory files to "make it work". Suggest the line; the user writes it, or approves it explicitly.
6. **Report failures as failures.** Do not bypass checks, pin odd versions, or retry in a loop to force success. A failing check is a valid result to report.
7. **Stay in this file.** Run only the commands written here. Do not clone repositories. Do not build from source. Do not run the package's test suite.
8. **Offline after download.** Beyond the npm download itself, installation and checks need no network. The tool makes no network calls.

## TODO

- [ ] 0. Preconditions checked (git repo, Node present, agent tool known)
- [ ] 1. Install method chosen by the user
- [ ] 2. Installed
- [ ] 3. `specgate --version` verified
- [ ] 4. `specgate start` routed in the user's repo
- [ ] 5. Optional wiring approved and done (or skipped)
- [ ] 6. Five-line final report delivered

## Step 0 — Preconditions

- **Target is a git repository.** Run `git rev-parse --is-inside-work-tree` (read-only). Not a repo? Ask once whether to `git init` — the rollback story needs version control. If the user declines, verify the install outside a repo with `--version` only, and say so in the report.
- **Node.js present?** Run `node --version`. Expected: 18 or later. Missing? Ask once, with the exact fix in hand (the official installer, or `nvm install --lts`). If declined, stop and report. Do not install Node silently.
- **Which agent tool does the user run?** Cursor, GitHub Copilot, or Windsurf? Note it for step 5 — a one-line pointer file may help. Tools that read `AGENTS.md` natively need nothing.

## Step 1 — Choose one install method (ask; recommend the default)

| Method | Command (ask before running) | Fits when |
| --- | --- | --- |
| Dev dependency (recommended) | `npm i -D @smashupcn/specgate` | One project. The usual case. |
| Global | `npm i -g specgate` | Many small repos on one machine. |
| No install | `npx @smashupcn/specgate@latest <command>` | Trying it out first. |

Before installing, run `specgate --version` once. If it already prints a version, something is installed: keep it, report the version, and offer the update path (rule 4).

## Step 2 — Install

Run the chosen command in one shell call, after approval. Dev dependency installs run in the target repository; global installs run anywhere.

If it fails:

- `npm: command not found` → Node/npm missing → back to step 0.
- `EACCES` permission error → report it. Do not run chmod or sudo on your own. Suggest a fix; let the user choose.
- Network timeout → report. Ask whether to retry once. One retry maximum.

## Step 3 — Verify

`specgate --version` — expected: one line, like `specgate 0.1.0`.

Fails with "command not found"? For dev-dependency installs, try `npx @smashupcn/specgate --version`. Still failing: report honestly. Do not create aliases, shims, or PATH edits yourself (rule 5).

## Step 4 — Route check (the real run)

With the user, in their repository: `specgate start`.

Expected: three questions print, then one exact next command prints.

Discipline at this step: read the questions to the user. Do not answer them on the user's behalf. The user picks. Then run the printed next command only after the user approves it.

Bootstrap — creating `AGENTS.md` and the two S0 documents — follows the printed route. It is a conversation with the user — mostly conversation time — roughly 10 minutes at S0. Start it only when the user says go. If an `AGENTS.md` already exists, do not touch it; the route is `specgate init --adopt`, which lists conflicts for the user to decide.

## Step 5 — Optional wiring (each behind its own explicit yes)

- **Pointer file** (Cursor / Copilot / Windsurf): one line in the tool's rules file pointing at `AGENTS.md`. Offer it only after `AGENTS.md` exists. Ask. Create exactly one line. Edit nothing else in that file.
- **CI line**: offer only if the user asks about CI. One line runs the check. Ask before touching any CI file.

## Step 6 — Final report (exactly five lines)

```text
1. Installed: <method>, <version>
2. Verified: --version ok; start routed in <repo path>
3. Changed files: <list, or "none">
4. Next: <the exact next command for the user>
5. Notes: <failures verbatim, or "none">
```

At install time, line 3 normally reads "none". Bootstrap adds files later, under its own approvals.

## Troubleshooting

| Symptom | Likely cause | Do this |
| --- | --- | --- |
| `command not found` after a dev-dependency install | Local binary not on PATH | Use `npx @smashupcn/specgate --version`. Report the fact. Do not edit PATH files. |
| `specgate start` exits with "not a git repository" | Precondition | Ask about `git init` once. |
| Version prints, questions print, user is unsure | Normal | Stop. Read the questions out. Wait. |
| npm `EACCES` | Permissions | Report; suggest the user's own fix; no sudo. |
| An `AGENTS.md` already exists | Adopt path | Do not touch it. Route to `specgate init --adopt`; conflicts get listed for the user. |

## Execute now

Re-read Rules. Start at TODO 0. Ask before the first command.
