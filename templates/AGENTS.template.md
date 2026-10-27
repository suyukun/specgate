<!-- template_version: 1 -->
<!-- stage: S0 -->

# AGENTS.md — Project Rules for AI Agents

> Project: {{PROJECT_NAME}} · Owner: {{OWNER}} · Created: {{DATE}}

## Start here

| Question | Answer |
| --- | --- |
| What is this file? | The first document AI agents read when they work in this repository. It states what the project is, which commands to use, and what must be asked before acting. Write it once — agents stop re-asking you the same questions. |
| Who is it for? | Anyone who writes code with AI agents. Solo or team. No process background needed. |
| What is the smallest setup? | **Two documents at stage S0: this file plus the gate doc template.** The table below shows when the rest arrive. |
| Where do I go next? | New project: use the `rose-bootstrap` skill. Existing repo: the same skill has an adopt path. First batch of work: copy `docs/plans/gate-doc.template.md` and read its start-here table. |

README is for humans browsing the repo. AGENTS.md is for agents working in it. Many agent tools read AGENTS.md automatically. If yours reads a different file (for example a rules file in its own format), write a one-line pointer to this file there — ask {{OWNER}} before creating it.

### The five governance docs (start with two)

| Stage | Signals you can see | Add | What it prevents |
| --- | --- | --- | --- |
| **S0 — exploring** | An idea and a skeleton. Nothing runs end to end yet. | ① **Gate doc** (spec) in `docs/plans/` ② **Decision log** (ADR) in `docs/adr/` | Building the wrong thing. Forgetting why you chose something. |
| **S1 — main flow works** | One command runs the main flow end to end on real data. | ③ **Task board** (backlog) ④ **Architecture doc** (current state) | To-dos scattered across chats. Architecture nobody can recall. |
| **S2 — real usage** | Real users give feedback. You iterate on requests. | ⑤ **Design spec** | Two sources of truth fighting over UI or interfaces. |
| **S3 — released** | Public release, external users, compatibility promises. | Nothing new — existing gates get stricter. | Regressions reaching your users. |

### Glossary

| Term | Meaning |
| --- | --- |
| gate doc | A short spec written before coding one batch of work. Filled from `docs/plans/gate-doc.template.md`. One gate doc covers one batch. |
| kickoff gate | The rule that no coding work is dispatched while its gate doc still has an open decision card. |
| batch | One unit of dispatched work, sized S / M / L by the gate doc's Step 0. |
| decision card (needs-clarification card) | A numbered multiple-choice question for {{OWNER}} when the spec is unclear. Its three states are defined once, in the gate doc template's decision ledger. |
| acceptance criteria (AC) | Numbered, testable statements in EARS form: "When <condition>, the system must <observable behavior>." The full rulebook lives in the gate doc template. |
| converge | The seven-step closure check after a batch. Done means converged, not "looks done". |
| backfill | Unfinished items are written back into the task table as new tasks. Nothing is declared done verbally. |
| dispatch | Sending a task to an agent or a person with everything needed to start. |
| hard rules | The few rules that never bend. Listed once, in "Hard rules" below. |
| stop-loss | The rework limit: after two failed rounds on the same task, stop patching and fix the spec. |
| ledger | A single table that is the only place some fact lives: the decision log index, the tech-debt ledger, the board. |
| stage (S0–S3) | Project maturity, decided by hard signals. Declared in the `stage` marker under the title of this file — the only place stage lives. |
| {{OWNER}} | The person who decides. In solo use, that is you. |

## Placeholders

- `{{OWNER}}` — the decision-maker. Every "ask first" in this kit points here. Solo? Replace it with "me"; the decision card protocol has a solo mode.
- `{{PROJECT_NAME}}`, `{{DATE}}` — fill in on adoption.
- Replace every `{{...}}`, then delete this section. Plugin upgrades never edit your filled files; the plugin's check only warns when a shipped template is newer than yours.

---

## Project overview

- Name: {{PROJECT_NAME}}
- One-line purpose: <for whom, what problem, what is different once it works>
- Goal and definition of done for the current stage: <fill in>

## Tech stack and layout

- Language, framework, key dependencies — be specific (for example "React 18 + TypeScript + Vite + Tailwind"): <fill in>
- Directory layout notes (which folder holds what): <fill in>

## Commands

Real commands of this project, with full flags. Agents: ask {{OWNER}} before running any command in this list the first time in a session.

- Install dependencies: <fill in>
- Run focused tests: <fill in, for example `npm test -- src/app.test.ts`>
- Lint: <fill in>
- Type-check: <fill in>
- Build: <fill in>
- Start (dev): <fill in>

## Coding standards

- Communicate in this project's working language; keep code, commands, and identifiers in English.
- Prefer a mature open-source solution over a hand-rolled one. Verify it is reachable from your environment before adopting it.
- Data is immutable where practical: updates return new objects instead of mutating.
- Small files: 200–400 lines is comfortable, 800 is the ceiling. Functions under 50 lines. Nesting no deeper than 4 levels. No magic values — named constants or config.
- Charts and reports compute from the same source as the detail rows. Never hand-type the same number into two places.
- Style is shown, not described. Paste one real snippet below that demonstrates this project's style.

```ts
// paste a short, real snippet from this project
```

## Hard rules

Three rules that never bend. The gate doc's B4 check repeats them before every L batch — repetition is how they hold.

1. **Minimal implementation.** Build exactly what the current spec asks for. No speculative abstraction, configuration, or error handling. If 50 lines solve it, 50 lines ship. Test: "would a senior engineer call this over-engineered?" If yes, simplify.
2. **Surgical changes.** Change only the lines your task requires. Every changed line must trace to a task or an acceptance criterion. Found unrelated dead code? Mention it; do not delete it unless asked. Clean up only what your own change orphaned (unused imports, variables, functions). Follow the style of the file you are in.
3. **Ask first.** Deleting files or data, changing a database schema, changing a public API, adding a dependency, releasing publicly — each needs {{OWNER}}'s explicit yes before it happens.

### Boundaries — three tiers

- ✅ **Always**: understand and reproduce before changing; after changing, run the relevant checks and report the results honestly.
- ⚠️ **Ask first**: everything in hard rule 3.
- 🚫 **Never**: commit secrets or credentials; push straight to the main branch; comment out an error to make a build pass; invent verification results.

### Security

- Secrets, tokens, and passwords never enter code or docs — environment variables or a secret manager only.
- Validate all user input. Parameterize SQL. Escape HTML output. Error messages must not leak sensitive data.
- Found a security problem? Stop, report it to {{OWNER}}, continue only after a decision.

## Working with agents

Agents do better work when a task arrives complete. A good dispatch note removes the guesswork.

- Dispatch notes for multi-file or risky tasks always contain: goal / files to touch / approach / how to verify / what not to touch.
- Multi-step work is planned as steps with checks: "1. <step> → verify: <check>. 2. <step> → verify: <check>."
- Point agents at the exact section of a document. Never ask them to read a whole spec when one table is meant.
- Optional role profiles: if this project keeps role notes (for example `docs/roles/<role>.md`), append "read <role file> before starting" to dispatch notes. Skip when the file does not exist or the task is trivial.

## Stages S0–S3

Every rule has a cost. At S0 a full CI pipeline is pure overhead; at S3 it is your night's sleep. The stage declaration picks the right amount of process for right now — and it saves you from both "no process" and "process theater".

### What each stage means

- **S0 — make it run.** The core idea works once, end to end. Smoke-test the core invariant; the core-algorithm test is the spec. No separate review. No CI (local lint and type-check only).
- **S1 — make it right.** Main flow green end to end with key-path tests. High-risk changes (architecture, data model, write loops, permissions) get an immediate independent review. Optional minimal CI.
- **S2 — make it survive use.** Unit and integration regressions. Coverage measured on core modules. Integration review before release candidates. CI runs the regression suite.
- **S3 — make it ship.** Full regression, coverage thresholds, an independent final review before release. Full CI with release gates.

Philosophy: first make it work, then right, then fast. Three proportional laws: test density follows code stability; review frequency follows change risk; CI strength follows project maturity.

### Hard signals — you are in a stage when ALL hold

| Stage | Signals |
| --- | --- |
| S0 | The repo builds. A skeleton or experiment runs. No end-to-end main flow yet. |
| S1 | One command runs the main flow end to end (data → processing → result). Key-path tests green. Real data involved. |
| S2 | Real users or scenarios produce feedback. Requirements iterate. Release candidates exist. |
| S3 | Public release. External users. Compatibility promised. |

Signals, not feelings and not calendar percentages.

### Stage moves are explicit events

Signals hold → someone proposes the move → {{OWNER}} decides → the `stage` marker under this file's title is updated. That marker line is the single place stage lives.

### Anti-regression

At each stage end or milestone, re-check the signals. If the main flow broke, drop back to the previous stage's rules. Stages move forward only — except a deliberate rebuild back to prototype.

### Tech-debt ledger

Shortcuts taken at S0 (missing tests, no CI, skipped standards) go into `docs/tech-debt.md` as they happen, and are paid at the next stage move. This is what stops a project from living at S0 forever.

### Review rules — all stages

1. Risk-driven: high-impact changes get reviewed when they land, not "at the end of the stage".
2. Release gate: anything released or finalized gets one independent review first.
3. Reviews target risk-change diffs and milestone converges — not the whole codebase on repeat.

### CI timing

No CI while exploring. Light CI (lint plus key-path tests) once the main flow is stable. Full regression CI at release time.

### Test discipline

When a test fails, fix the implementation, not the test — unless the test itself is wrong. Never write tests just to hit a coverage number.

## Kickoff gates (gate docs)

One gate doc per batch of work, filled from `docs/plans/gate-doc.template.md` before any coding dispatch. Why: the four expensive failures — wrong thing built, extra things built, results nobody can verify, fix-loops that get worse — all start at the spec, and the gate doc is where they are caught cheaply.

- S/M/L sizing, decision cards, the seven converge steps, the stop-loss, and the acceptance-criteria rulebook all live in the gate doc template. That file is the single authority; this section only binds this project to it.
- The kickoff gate: while a gate doc contains any open (`NC-OPEN`) decision card, no coding work is dispatched from it.
- Converge: a batch counts as delivered only when its gate doc passes all seven converge steps. Unfinished items are backfilled into the task table — nothing is "done" by verbal declaration.
- Rework stop-loss: two failed rounds on the same task stops patching. Fix the spec, then redispatch. A third blind patch is banned.
- Acceptance modes: S and M batches may close with a scripted demo plus archived results, sampled afterwards by {{OWNER}}. L batches and anything shown to outsiders get a personal walkthrough.
- Machine checks: the plugin's governance check asserts card states, AC form, and ADR references in new gate docs. Ask {{OWNER}} before running it or wiring it into pre-commit or CI.

## Three layers of gates

Scripts are cheap and tireless but literal. Reviews catch meaning but cost attention. Some calls only a human can make. Each layer does only what it is good at.

1. **Hard gates — deterministic, blocking.** Assertions run by the plugin's check: stage marker versus installed docs, zero open cards before dispatch, AC form, ADR references at converge and on code commits, board health. Output is PASS / WARN / FAIL. Wire into pre-commit or CI only after asking {{OWNER}}.
2. **Soft gates — semantic, advisory.** A review pass over specs and diffs reporting six findings: duplicates, ambiguity, underspecification, conflicts with project rules, coverage gaps, cross-document contradictions. It reports; it never blocks.
3. **Human gates.** {{OWNER}} scopes batches, rules on decision cards, and accepts demos. Solo mode: all three are you.

## Task board — from S1

One place for everything not done yet. When to-dos live in chats, they resurface as surprises.

- The board under `backlog/` is the single registry of pending work. Discoveries, requests, and decisions land on the board as cards — registered, not fixed in passing. Scope is drawn at each batch's kickoff.
- A card is a task-level spec: title (verb + object, one line) / type / priority / description (symptom and where seen) / acceptance criteria filled in before the card enters a batch.
- **Single-writer rule**: one card is held by one worker at a time; the dispatch note names the card ID. Status changes go through the board's CLI, never by hand-editing files.
- Urgent hotfix: fix first, register the card right after.
- Tooling: the `backlog.md` npm package (pinned 1.55.3) in CLI mode. Optional — a plain `docs/BACKLOG.md` works for quiet projects. Adoption notes and known traps: Appendix B.
- Machine gate at S1+: the board's own health check passes, and this file has this "Task board" section.

## Decision log (ADR) — from S0

Three months later, "why did we do it this way?" should have an answer that is not a guess.

### Record a decision when any of these happen — on the spot, not at the end

1. Direction, architecture, or data model.
2. Process or team rules.
3. Technology choice or a new dependency.
4. A public interface or a source of truth changes.
5. A decision reverses or overrides an earlier one.

Do not record: ideas discussed but never decided, and anything {{OWNER}} explicitly marks out — but for those, leave one line in the index saying so.

### Where and how

- Files: `docs/adr/NNNN-<slug>.md` — four digits, unique within this project. Index: `docs/adr/README.md`. At session start, read the latest handoff plus the three newest index entries.
- Five sections plus a status header: Background / Options / Decision / Rationale / Consequences. One decision per ADR, short.
- Status values — defined once, used everywhere: `proposed` · `accepted` · `superseded by ADR-NNNN` · `withdrawn`.
- Old ADRs are never rewritten. A new decision supersedes via the status line and a pointer.
- Template: Appendix A.

### Registration hooks — machine-checked

- Closing a `#decision` board card requires an `adr: ADR-NNNN` reference, or an explicit `adr-exempt: <one-line reason>` marker.
- An M or L gate doc must reference an ADR at converge, or carry the same exemption marker.
- Code commits (`feat` / `fix` / `perf` / `refactor`) carry `ADR-NNNN` in the message, or `no-adr: <one-line reason>`. Docs, chore, and test commits are exempt. This closes the hole where a hotfix skips the gate doc and the decision goes unrecorded.

## Design spec — from S2

Add when the project has a UI, or when two or more modules share an interface contract. What counts as a contract? If changing it would force you to touch two modules at once, it is one — a shared type, an API, an event format.

- Authority for UI tokens and schemas lives in `docs/design/DESIGN.md`. Prose around them is the human-readable mirror; when they disagree, the tokens win.
- Which drawer holds a decision? Two questions: (a) does it bind a concrete UI or interface contract? → design spec. (b) is it about module layout, data flow, deployment, or evolution? → architecture doc. Both apply → one ADR decides the single owner; the other file keeps a pointer.
- Same change, same commit: a change that edits the authority also edits the design spec and its checks.
- A design spec must be referenced by a gate doc's task table or a converge. An unreferenced design doc is dead weight. No UI ever? Mark `<!-- design: exempt -->` next to the stage marker.

## Architecture doc — from S1

Two documents under `docs/architecture/`:

- **Current state** — how the system is wired right now. Updated in the same commit as any batch that changes modules, entry points, or data flows (converge step 7). May start as an "Architecture (current)" section in this file and move to its own directory at S2.
- **Blueprint** — the target state being grown toward. Direction changes here require an ADR.

## Git workflow

- Commit messages in English, conventional style: `feat` / `fix` / `refactor` / `docs` / `test` / `chore` / `perf` / `ci`.
- One logical change per commit. Check the staged set before committing — this prevents accidents when several agents share one repository.

## Acceptance and delivery

- Delivery means a real artifact that runs, plus its real output. Blocked? Say so honestly and offer an alternative. Never invent results.
- Checking amount by stage: S0 — core invariant green plus lint and type-check; the full suite and build run at stage end or milestone converge. S1 and up — test, lint, and build all green before anything is called done.

---

## Appendix A — ADR template

Copy to `docs/adr/NNNN-<slug>.md`.

```markdown
# ADR-NNNN: <decision in one line> ({{DATE}})

> Status: proposed | accepted | superseded by ADR-NNNN | withdrawn
> Decider: {{OWNER}} | <agent name> (mark self-decided agents)
> Related: TASK-xxx / gate doc path / ADR replaced by this one

## Background
Current state, why decide now, what drives the change.

## Options
1. Option A: ... (pros / cons)
2. Option B: ... (pros / cons)

## Decision
Option X, in one sentence.

## Rationale
Why not the other one.

## Consequences
Positive / cost / risk / how to reverse.

## Enforcement (optional)
Which check or test makes sure this decision is followed.
```

## Appendix B — Task board adoption notes (S1, about 30 minutes)

`backlog.md` is an open-source npm tool that keeps the board as plain markdown files under `backlog/`, with a CLI for creating and moving cards — exactly what the single-writer rule needs. Pinned version: 1.55.3 (same version everywhere in this project).

Ask {{OWNER}} before running any command in this appendix, and run them one at a time:

- Install: `npm i -D backlog.md@1.55.3`
- Initialize: `backlog init <project-name> --integration-mode cli --agent-instructions none --check-branches false --include-remote false --auto-open-browser false`
  Known trap: the project name argument is required — without it the tool opens an interactive prompt that hangs non-interactive sessions.
- Register existing to-dos as cards in one batch; freeze the old list with a one-line note pointing to the board.
- Point any README or index at the board as the single registry.
- Add the board's health check (`backlog doctor`) to tests or CI — ask before wiring.
- Let one full cycle run before customizing; customize against real friction, not imagined friction.

Rollback: the board is plain markdown. Remove the `backlog/` directory and the dev dependency, and the project is back where it was.

## Appendix C — Field notes (add yours; keep each to two lines)

- Running the full test suite during exploration is pure overhead. Full runs belong to stage-end converge.
- Written rules decay. A rule without a machine check will quietly die — if it matters, assert it.
- Long commands need explicit timeouts. Default timeouts truncate minute-long commands into retry loops.
- Parallel agents hit rate limits. Cap how many run at once, back off long, and prefer models inside your existing plan.
- Stage moves on hard signals — one command, real users, a release — never on feelings.

## Appendix D — Running many agents in parallel (optional; skip freely)

Useful once you dispatch several agents at once. Until then, ignore this appendix.

- **Cost ladder.** Prefer models inside your paid plan; self-paid APIs as fallback only. When rate-limited: throttle concurrency → back off and wait → switch model inside the plan → paid provider as last resort.
- **Wall-clock limits.** Long single calls get killed and their output is lost. Split heavy reviews and walks into serial calls under about five minutes each, with slim inputs. On a timeout, split smaller and rerun once — never retry the same oversized call unchanged.
- **Dispatch budgets.** Give each task a soft step budget by type (page work 150 / visual 60 / fix 80 / research 100). At 100% over budget, stop and pick from what exists; at 150%, stop-loss applies. The budget protects wall-clock time and the main session's context.
- **Contract quick-reference.** A dispatch note carries 5–10 lines of cross-file interface signatures, not "read all the files".
- **Visual tasks.** Dispatch image work to models with proven vision, in short sessions — images age badly inside long histories. After two failed visual rounds, switch to DOM measurement probes: screenshots cannot diagnose structure. Geometry and contrast are machine-checked; pure aesthetics get a human final say.

## Appendix E — Adoption checklist (complete per stage)

- [ ] AGENTS.md adopted; every `{{...}}` replaced; stage marker set under the title.
- [ ] S0: `docs/plans/gate-doc.template.md` copied; `docs/adr/README.md` and the ADR template created.
- [ ] S1: board installed (`backlog/` or `docs/BACKLOG.md`); architecture current-state exists (own directory or a section in this file).
- [ ] S2: design spec exists and is referenced by gate docs — or `<!-- design: exempt -->` is marked for a no-UI project.
- [ ] Plugin check reports PASS for your stage — ask {{OWNER}} before running it or wiring it anywhere.
- [ ] One-off or docs-only project? Stage marker reads `exempt`, with {{OWNER}}'s agreement.
