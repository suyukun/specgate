---
name: rose-bootstrap
description: Set up project governance for a repository that AI agents work in. Creates AGENTS.md from the kit template, sizes the project stage (S0-S3), and installs the two S0 documents (gate doc template + decision log), then grows the set to five documents as the project sends stage signals. Use when the user says "start a new project", "new project", "bootstrap this repo", "set up project rules", "create AGENTS.md", "adopt this existing repo", "set up the governance docs", "kickoff gate", "which docs do I need", or asks how to begin using the five governance docs. Works for new and existing repositories, solo and team.
---

# rose-bootstrap — scaffold the governance docs

## What this skill does

| Question | Answer |
| --- | --- |
| What happens? | The project gets AGENTS.md plus the two S0 documents. The user reviews everything before anything is dispatched. Takes about 10 minutes at S0. |
| What is never touched? | Source code, one line of it. Everything created is a new markdown file. |
| How do I roll back? | All products are plain markdown. Undo the file creation (or `git revert`) and the project is exactly as before. |
| Who decides? | {{OWNER}} — in solo use, the user. Nothing is dispatched before their review. |

Progressive disclosure: this file holds the flow; the templates hold the content. Read a template when you reach its step — do not preload all of them.

## Preconditions (check before starting)

- A git repository (`git init` done or planned). No git yet? Ask the user first; everything here assumes version control for rollback.
- An agent tool that reads AGENTS.md, or a pointer file in that tool's own format (see step 6).
- For stage S1 only: Node.js (the task board tool is an npm package). S0 needs nothing beyond git and a text editor.

## Flow A — new project (greenfield)

### 1. Understand the project first (5 questions, then stop asking)

Ask, in one message: What is the project (one sentence)? What does "done" look like for the first milestone? What language and framework? Is there existing material to carry over? Who decides when something is unclear — just you, or a team?

Solo user? {{OWNER}} is the user. Note it; the gate doc's decision cards run in solo mode later.

### 2. Draft AGENTS.md

Copy `templates/AGENTS.template.md` (shipped with this plugin) to the repository root as `AGENTS.md`. Fill in `{{PROJECT_NAME}}`, `{{OWNER}}`, `{{DATE}}`, the overview, the real stack, and the real commands. Leave the rest as is for now — do not rewrite sections you do not understand yet. Never ship a file with placeholders left in.

Show the draft to the user. Revise until approved. This file is the project's constitution; it is written with the owner, not for them.

### 3. Size the stage — honestly

Use the hard signals from the template's "Stages" section, not feelings. Default for a fresh repo: **S0**. Say the signals out loud and let the user confirm: "Nothing runs end to end yet → S0. We install two documents now; the rest arrive when the project signals."

### 4. Install the two S0 documents

Copy, do not invent:

- `templates/gate-doc.template.md` → `docs/plans/gate-doc.template.md`
- The ADR template (template's Appendix A) → `docs/adr/adr-template.md`, plus an index `docs/adr/README.md` with an empty list.

Set the stage marker in AGENTS.md right under the title: `<!-- stage: S0 -->`.

### 5. Point at the worked example (recommended)

Mention `templates/gate-doc.example.md`: a fully filled first batch (fictional project, decision cards answered, all seven converge steps passed). First-time users fill their first gate doc twice as fast with it next to them.

### 6. Wire the agent tool if needed

Does the user's tool read AGENTS.md automatically? Done. If it reads its own rules file instead (per-tool formats differ), offer to write a one-line pointer file in that tool's format that points to AGENTS.md. Ask the user before creating any file — and before running any command in this skill, always.

### 7. Verify, then hand off

Ask the user before running the plugin's governance check; expect PASS for S0 when: AGENTS.md adopted with no placeholders, stage marker present, both S0 documents in place, ADR index created. Report the result honestly, including WARN items.

Then point to the first real work: copy the gate doc template for the first batch, size it in Step 0, and log decision cards as they come. Dispatch happens only after the user approves the gate doc.

## Flow B — existing repository (adopt)

The user already has code, maybe an AGENTS.md or a to-do list. The rule that makes adoption safe: **add only, never modify.**

1. Inventory what exists: AGENTS.md, README, ADRs, any spec or to-do files, board directories.
2. If an AGENTS.md exists: do not overwrite it. Produce a merge proposal — which sections of the template are missing, which existing rules conflict — and let the user decide line by line.
3. Install the S0 documents as in Flow A step 4 (they are new files; collisions are listed, never resolved by you).
4. Existing to-dos: stay where they are this session. When the board arrives at S1, they are registered as cards in one batch and the old list gets a frozen pointer — the template's Appendix B describes this.
5. Stage by signals: an existing repo with a working main flow is often already S1. Check the signals with the user before choosing the marker.

## Stage upgrades (later sessions)

When the user reports a stage signal, walk the upgrade with them:

- **→ S1** (one command runs the main flow end to end): offer the task board (template Appendix B; ask before running its commands) and the architecture current-state document (start as a section in AGENTS.md).
- **→ S2** (real feedback): offer the design spec. No UI and no shared contracts? Mark `<!-- design: exempt -->` with the user's agreement instead.
- **→ S3** (public release): no new documents — stricter gates and full CI, per the template.

Update the stage marker, record the move as an ADR, and re-ask before running the governance check.

## Upgrades and uninstall

- Plugin upgrades never edit files inside the user's project. The check only warns when a shipped template is newer than an installed one; the user merges at their own pace.
- Uninstall = delete the created markdown files (or revert the commits). There is no hidden state outside the repository: cloning the repo plus reinstalling the plugin restores everything.

## Anti-patterns

- Dispatching any task before the user approved AGENTS.md and the first gate doc is clean.
- Copying the template "for completeness" — S0 means S0: two documents.
- Filling placeholders with guesses. Unknown value? Ask.
- Running commands (install, init, checks) without asking first.
- Rewriting template sections during bootstrap. Customize later, against real friction.

## Level-3 references (load on demand)

- `templates/AGENTS.template.md` — the project rules template (step 2)
- `templates/gate-doc.template.md` — the gate doc template (step 4)
- `templates/gate-doc.example.md` — the worked example (step 5)
