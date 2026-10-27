<!-- template_version: 1 -->

# Gate Doc — <batch name>

> Project: {{PROJECT_NAME}} · Batch: <batch-name> · Owner: {{OWNER}} · Created: {{DATE}}
>
> Copy this template to `docs/plans/gate-<batch-name>_v1.md`, then fill it in. Replace every `{{...}}` and every `<...>`. Keep empty sections visible — an empty section is information too.

## Start here

| Question | Answer |
| --- | --- |
| What is this? | A short spec you fill in before coding starts on one batch of work. About 10 minutes for an M batch — and it pays for itself the first time something does not come back wrong. |
| Why bother? | It prevents the four expensive failures: building the wrong thing, building extra things, not knowing whether it works, and fix-loops that get worse with each round. The table at the end maps every section to the failure it removes. |
| Who fills it in? | You and your agent together. The agent drafts; {{OWNER}} decides. Working solo? You decide — see "Decision cards". |
| What is the smallest start? | An S batch needs one declaration line in Step 0 and nothing else. An M batch fills sections A and D. Only an L batch fills everything. |
| Where next? | Step 0 → A → B → C → D. Blocked on a question? Log a decision card. All cards resolved and baseline recorded? Dispatch. Work done? Walk the seven converge steps. New to the whole kit? The orientation table in AGENTS.md explains the five documents and the two-doc S0 start. |

### Document status — the only status fields in this file

```markdown
> Status: draft

phase: sizing
```

- Allowed `Status` values, defined only here: `draft` → `converged` → `archived`. While work is under way, `Status` stays `draft`. When all seven converge steps pass, set it to `converged`. When a newer gate doc version replaces this one, set it to `archived`.
- Allowed `phase` values, defined only here: `sizing` → `drafting` → `ready` → `converging`. They record where you are: sizing the batch, filling the form, cards clear and baseline recorded and work dispatched, converge steps under way.
- Update these two lines in place; do not add status fields anywhere else. Decision card states live only in the decision ledger below.

### Glossary

| Term | Meaning |
| --- | --- |
| batch | One unit of dispatched work. One gate doc per batch. |
| level (S/M/L) | The size class picked in Step 0. It decides how much of this form to fill. |
| decision card (needs-clarification card) | A numbered multiple-choice question for {{OWNER}} when something in the spec is unclear. Its three states are defined once, in the decision ledger below. |
| acceptance criteria (AC) | Numbered, testable statements in EARS form — "When <condition>, the system must <observable behavior>." Rulebook in section A. |
| baseline | The output of the acceptance commands, recorded **before** work starts. Proves what was already broken. |
| dispatch | Sending a task to an agent or a person with everything needed to start. |
| converge | The seven-step closure checklist. A batch is done when its gate doc converges — not when it looks done. |
| backfill | Unfinished items are written back into the task table as new tasks. Nothing is declared done verbally. |
| stop-loss | After two failed rounds on the same task, stop patching. Fix the spec, then redispatch. |
| {{OWNER}} | The decision-maker. In solo use, that is you. |

## The kickoff gate (one hard rule, and why it pays)

Every open decision card is a hole in this spec. Coding into a hole wastes a round — yours or your agent's. So this kit has exactly one hard rule at the gate:

**No coding work is dispatched while this gate doc contains an `NC-OPEN` decision card.**

Before dispatch, ask the user before running this check (any text-search tool works; the count is what matters):

`grep -c "NC-OPEN" docs/plans/gate-<batch-name>_v1.md` — the answer must be 0.

## Step 0 — Size the batch (pick one, and say which)

Sizing honestly is the cheapest quality control in this kit. A quiet downgrade from L to M is how scope gets cut without anyone deciding to cut it — so a downgrade needs a written reason.

| Level | It fits when | You fill |
| --- | --- | --- |
| **S — small** | One file, fewer than 50 changed lines, no new dependencies, and you can state the acceptance in one sentence. | One declaration line (below). Nothing else. |
| **M — medium** | One feature inside one module. | Sections A and D. |
| **L — large** | Cross-module work, a new direction, a data-schema change, or anything on a demo path. | Everything: A, B, C, D. |

- This batch is level: ___
- If downgraded from L, the reason is: ___

**S-batch declaration** — fill this line and skip the rest of the template:

> This is an S batch. The change: ___ . Acceptance: ___ . Checked on {{DATE}}.

## Before you dispatch — three checks

One minute, three catches. These stop the three most expensive dispatch mistakes.

1. **Cards are clear.** No `NC-OPEN` rows in the decision ledger (check above).
2. **Baseline is real.** The D1 acceptance commands already ran once, *before* work started, and their output is pasted in D1. A baseline recorded after delivery proves nothing.
3. **The task is on the list.** Everything about to be dispatched appears in the C1 task table. Found a gap? Report it to {{OWNER}} and let them decide before it is dispatched. A surprise found after dispatch costs double.

## A. Requirements

Goal: after reading A, {{OWNER}} can say the goal back in one sentence — and nothing in it is fuzzy.

- [ ] **A1 — One-sentence proposition.** For whom, which problem, and what is different once it works.
  Done when: {{OWNER}} repeats it in one sentence, with no follow-up questions.
- [ ] **A2 — User stories.** At most 5, ordered P1 / P2 / P3. Each story is testable and deliverable on its own.
  Done when: dropping every P2 and P3 still leaves a working P1 loop.
- [ ] **A3 — Acceptance criteria.** One or more numbered AC per story, in EARS form. Rulebook below.
  Done when: you can name the test or command that checks each AC.
- [ ] **A4 — Boundary cases.** At least 3: empty input, a failure path, an out-of-permission attempt, a duplicate submission, or similar for this feature.
  Done when: each case has a definite "the system must …" answer — not "we'll see".
- [ ] **A5 — Non-goals.** What this batch deliberately does not do, listed explicitly.
  Done when: {{OWNER}} has agreed. Delivering a non-goal is grounds for returning the work.

### How to write AC — the only rulebook for this kit

AGENTS.md and the skills point here; they do not repeat these rules.

1. Number every AC and use the EARS pattern:
   `AC-1: When <condition>, the system must <observable behavior>.`
2. For every AC, write the name of the test or command that checks it. Cannot name one? The requirement is not thought through — log a decision card and revisit A2/A3.
3. Keep vague words out of requirements: *reasonable, appropriate, timely, obvious, asap, as needed, friendly, optimize, improve, support, consider, some*. If one is truly needed, end the line with `<!-- ok -->`. (The word list itself and quoted text are exempt — they are data, not requirements.)
4. Non-goals (A5) are explicit — silence is not a non-goal.
5. Every C1 task line carries its coverage: `TASK-101 (covers AC-1, AC-3)`. This makes coverage checkable by machine.

## B. Design (L only; M may skip)

Goal: decide only the parts that would force rework if left vague. Do not design the whole system here.

- [ ] **B1 — Technical context.** Which files and modules change, which dependencies must not shift, where data lives, how this gets tested.
  Done when: you can roughly predict the shape of the changed-file list.
- [ ] **B2 — Key decisions.** At most 5, each with its reason and the rejected alternative. These are seeds for the decision log (`docs/adr/`).
  Done when: each can say why the rejected option lost.
- [ ] **B3 — Interface and data contracts.** Schema, API shapes, table definitions — written as code (TypeScript types, Pydantic models, DDL), not prose.
  Done when: another module could import them today.
- [ ] **B4 — Baseline self-check.** The three hard rules from AGENTS.md, checked honestly before dispatch:
  - [ ] *Minimal implementation*: build only what A asks for — no speculative abstraction, config, or error handling. If 50 lines work, 50 lines ship. Test: "would a senior engineer call this over-engineered?" If yes, simplify.
  - [ ] *Surgical changes*: touch only the lines this batch's tasks require; every changed line traces to a task or an AC. Out-of-scope improvements go to the board, not into this diff.
  - [ ] *Ask-first list*: deleting files or data, changing a database schema, changing a public API, adding a dependency, releasing publicly — each needs {{OWNER}}'s explicit yes before it happens.
  Done when: the three boxes are honestly checked and any "no" has become a decision card.

## C. Plan

Goal: an agent can pick up any task from the table alone — no follow-up questions needed.

- [ ] **C1 — Task table.** Tasks grouped by user story. Every task lists exact file paths, its own completion check, and its coverage: `TASK-101 (covers AC-1, AC-3)`.
  Done when: dispatch needs no extra explanation.
- [ ] **C2 — Foundational tasks first.** Routing shells, skeleton registries, shared types — enablers form their own group at the top.
  Done when: each carries an "unlocks what" note.
- [ ] **C3 — Parallel marks.** Tasks that can run side by side carry `[P]`; serial dependencies are written out. Keep at most 4 tasks in flight at once — a safe default that matches most agents' concurrency limits and keeps review possible.
  Done when: the plan fits inside that limit.
- [ ] **C4 — Timebox and stop-loss.** Expected rounds per task, plus the stop-loss written into every dispatch note so the worker sees it: **if the same task comes back twice, stop. Fix the spec (section B) before any third attempt.**

## D. Acceptance

Goal: "done" is checkable by anyone, without trusting anyone's memory.

- [ ] **D1 — Acceptance commands and baseline.** The incremental checks for this batch: focused tests, lint, type-check. Ask the user before running them the first time, and paste the output here before any work starts. Workers run only these incremental checks — the full suite runs at stage-end converge, where it belongs.
  - Commands: <list them>
  - Baseline (paste): <output>
- [ ] **D2 — Review the diff, not the story.** At converge, every changed line is mapped against A's items in the converge table. A changed line with no AC or task behind it is out of scope and goes back.
- [ ] **D3 — Demo path.** A script {{OWNER}} can walk in about five minutes: where to click or which command to run, what to look at, what it should show. Two modes — pick per level and say which:
  - **with-owner** (default for L batches and anything shown to outsiders): {{OWNER}} walks it personally.
  - **scripted** (default for S and M, and for solo): a recorded run — steps, commands, expected outputs — archived as the result. {{OWNER}} samples it afterwards.
  Demo steps: <write them here>
- [ ] **D4 — Definition of done, one sentence.** What "green" means for this batch. It must map to A3 item by item, with nothing new invented at delivery time.
  DoD: <one sentence>

## Decision cards (needs-clarification protocol)

While filling A–D you will hit questions you cannot answer alone. Do not guess them into the spec — a guessed answer becomes tomorrow's rework. Log a decision card instead.

A decision card is one row in the ledger below, plus a short message to {{OWNER}} in with-owner mode:

```text
Card 1. Which currency format does the entry form use?
  a) one plain amount; currency picked once in settings
  b) amount + currency code on every entry
  recommend: a
```

### Two modes

| | with-owner mode | solo mode |
| --- | --- | --- |
| Who answers | {{OWNER}} | You, writing the answer into the ledger yourself |
| Card shape | Numbered question (2 lines max), options a/b/c, one recommendation | Same |
| How answers land | Reply like "1a 2b 3 default" — or say "defaults" once to accept every recommendation in the batch | The recommended default takes effect directly; override only where you truly disagree |
| The protection | A question the reader cannot understand is the agent's fault — rewrite it, never make {{OWNER}} guess | Same test, self-applied: if you cannot state the question plainly, the spec is not ready |

### Budget and cadence — both modes

- At most 10 cards per batch, of which at most 4 blocking. Over budget means the spec itself is weak: go back and redraft instead of pushing questions out.
- Send cards in one batch, never one at a time.
- Emergency exception: a hotfix may start first. Backfill its cards and the reason afterwards.

### Decision ledger — the only place card states live

Card states, defined once and used everywhere:

- `NC-OPEN` — no answer yet.
- `NC-RESOLVED: <decision>` — decided, decision written inline.
- `NC-N/A` — question retired (wrong question, or moved out of scope).

| # | Question | Recommendation | State |
| --- | --- | --- | --- |
| NC-1 | <one sentence> | <default proposal> | NC-OPEN |
| NC-2 | | | |
| NC-3 | | | |

## Converge — the seven steps

A batch is delivered when all seven pass. Not before. ("Converge" is borrowed from spec-kit: the spec and reality grow toward each other until they match.)

1. **Baseline green.** The D1 commands all pass, compared against the recorded baseline. No regressions.
2. **Diff mapped.** Every changed line maps to an A-table item — fill the table below. No out-of-scope edits. Anything unfinished goes back into C1 as a new task: backfill, never a verbal "done".
3. **Demo walked.** The D3 demo path runs in the mode picked, and {{OWNER}} (or the archived recording) confirms what it showed.
4. **Cards clear.** Every decision card reads `NC-RESOLVED: ...` or `NC-N/A`.
5. **Status and commit.** Set `Status` above to `converged`. The delivery commit message references this file's path.
6. **Handoff line.** In the same commit, append one line about this batch to the project's latest handoff document under `handoffs/`. Long sessions forget; the file does not.
7. **Architecture current.** Did this batch add or change a module, entry point, or data flow? Update the architecture current-state doc in the same commit. No change — skip.

### Diff ↔ requirement map (fill at converge)

| Changed files | AC / task covered | In scope? |
| --- | --- | --- |
| | | |

## Runtime clauses (after dispatch starts)

- From rework round 2 on: start a fresh session carrying only this gate doc and the failure list. Fix-loops degrade context — the longer they run, the worse they get.
- Stop-loss: the same task failing twice stops patching. Fix the spec (usually section B), then dispatch again. A third blind patch is banned.

## Appendix — why these sections exist (the four rework causes)

Each section removes one known cause of rework. This table is the design rationale; you never need it to use the form.

| Cause | What it looks like | Sections that remove it |
| --- | --- | --- |
| Spec defect | "Done — but not what I wanted." | A + clear cards |
| Execution drift | Extra things built; asked things missing. | B4 + C1 paths + D2 diff map |
| Missing verification | "Done — but is it correct?" | D1 baseline first + converge steps 1–2 |
| Context decay | Every fix makes it worse. | C4 stop-loss + runtime clauses |
