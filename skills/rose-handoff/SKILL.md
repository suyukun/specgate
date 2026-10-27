---
name: rose-handoff
description: Write and read cross-session handoff documents so work survives switching AI tools, windows, or sessions. Covers writing a handoff when a session ends or rotates ("handoff", "wrap up this session", "rotate session", "new window", "switch to another agent/tool") and resuming from one ("continue from last time", "where were we", "resume this project", "new session, keep going"). Not for archiving files or handing work to a teammate. Everything is plain markdown inside the project repository.
---

# rose-handoff — cross-session handoff

## Why this exists

Agents forget. Context windows close, tools get switched, sessions rotate. Files do not forget. A handoff document turns "start over" into "five minutes to full speed" — this is the structured handoff artifact that lets any agent, in any tool, pick the work back up.

| Question | Answer |
| --- | --- |
| When to write one? | A session ends or rotates; a switch of tool or window is coming; a long workflow pauses. |
| When to read one? | A new session starts on a project that has one — "continue from last time" is the signal. |
| Where do they live? | `handoffs/` inside the project repository. Project-scoped on purpose: clone the repo, and the memory travels with it. |
| What this skill never does | Archive files, hand work to a teammate, or auto-dispatch tasks from a handoff. |

## Two things that are NOT handoff (do not mix them)

1. **In-session compaction.** Most agent tools compress long sessions on their own. That is the engine's job. A handoff is a fresh, cross-session document — write it even if compaction just ran.
2. **Team hand-over.** "Archive this" or "hand this to a colleague" is a different task; do not trigger this skill for it.

## Part A — writing a handoff (session is ending)

### A1. Confirm scope

Everything here is project-scoped: `handoffs/` in this repository. No project directory? Ask the user where this work belongs before writing.

### A2. Write the document

Path: `handoffs/handoff-YYYY-MM-DD-<topic>.md`. The date is **today** — the day the rotation happens, never the date of an older handoff.

Two hard rules:
- Every rotation writes a new handoff dated today, even if it only points at an older one. An old file posing as the latest handoff is how the next session reads stale facts.
- Same day, second handoff? Keep one file per topic; note the time inside the index entry, not in file names.

Format — three header fields plus seven sections:

```markdown
# Handoff: <topic> (YYYY-MM-DD)

Project: {{PROJECT_NAME}}
Purpose: <end of day | window rotation | switching tool>
Continue: <the first sentence the next session should act on — the most important line>

## 1. Current focus
<one sentence: what this session was doing>

## 2. Findings and decisions
<bullet points, each with a file path or code reference>

## 3. Settled decisions (do not reopen)
<converged conclusions, short>

## 4. Next steps (waiting for {{OWNER}} — do not start alone)
<[ready to dispatch] / [needs decision] / [not doing]; no self-started sub-agents>

## 5. Key files and commands
<what the next session reaches for first>

## 6. Environment snapshot (optional)
<running services and ports · background jobs · uncommitted changes · which model/tool this session used>
```

Writing style: conclusions first; no filler phrases; paths, commands, error strings, and numbers copied exactly; quotes are not paraphrased.

### A3. Verify what you wrote

Read the file back and check the three header fields exist and the file is non-empty. "I wrote it" without a read-back is the one known failure mode of this protocol — the read-back is what catches it.

### A4. Upgrade durable items first

Before finishing: does anything in this handoff belong in a more durable home — an ADR, the stage declaration, the task board? If yes, write it there now (that is where its mechanism lives) and keep only a pointer in the handoff.

### A5. Update the index (a handoff without this is a lost handoff)

`handoffs/INDEX.md` — newest handoff at the top, older ones under "History":

```markdown
## Latest handoff

### 1. <topic> (start here)
- Date: YYYY-MM-DD (time of day, if several that day)
- File: handoff-YYYY-MM-DD-<topic>.md
- One line: <what this session delivered or concluded>
- Continue: <the first sentence for the next session>

## History

- [<topic>](handoff-YYYY-MM-DD-<topic>.md) — YYYY-MM-DD
```

Then a one-minute consistency check, run manually or offered to the user as a command (ask before running): every file in `handoffs/` appears in the index, every index entry points to an existing file, and the newest handoff is the one at the top.

### A6. Tell the user the opening line

Reply with: the handoff path, that the index is updated, and the exact first sentence for the new session — for example: "Continue <topic>; read handoffs/handoff-2026-10-27-<topic>.md first."

## Part B — reading a handoff (new session is starting)

### B1. Find the index

Read `handoffs/INDEX.md` in the project. No index? List `handoffs/` and take the newest `handoff-*.md`.

### B2. Read the latest handoff — then stop

Read the file the index points at. Then apply the stop rule: **no globbing the whole directory, no digging through git history, no reading long documents the handoff does not reference.** Target: everything above done in about 6–10 tool calls. Over that budget means over-exploration — stop and report what you have.

### B3. Stage check (when AGENTS.md declares one)

If AGENTS.md carries a stage marker, check the project against its stage signals (still holds / should move up / main flow broke) and fold the verdict into your report.

### B4. Report, then wait

Say back: where things stand (the `Continue` line), the stage verdict, and **two or three concrete options** for what to do next. The user picks. Never auto-dispatch sub-agents or start new work from a handoff alone — a handoff is memory, not authorization.

## Part C — long workflows with many sessions

For work that spans many sessions (multi-page delivery, month-long reports), each session also opens and closes cleanly — on top of parts A and B:

- **Open (start of session):** read the project index or outline → the problem ledger → the task/page status list → recent commits. Pick one incremental task. Two failure modes this prevents: trying to do everything in one session, and declaring victory at the first sign of progress.
- **Close (end of session):** progress and conclusions saved to the status files → status list refreshed → anything that must survive (rulings, number conventions, open questions) written to a file in the same session. Anything left only in the conversation is lost to compaction and rotation.

## Anti-patterns

1. Triggering on "archive" — confirm the user means session rotation, not file archiving.
2. Writing the handoff and skipping the index — the next session will not find it.
3. Reusing an old handoff's date — stale facts, guaranteed.
4. Skipping the read-back — the one recorded failure of this protocol.
5. A handoff without the header fields — the next session cannot even start.
6. Verbose, filler-phrase handoffs — conclusions first, always.
7. Auto-dispatching from "next steps" — those steps wait for {{OWNER}}.
8. Over-exploration on read — the stop rule in B2 exists because this was a real time sink.
9. Forgetting durable upgrades — decisions buried in a handoff instead of living in an ADR or the board.

## Level-3 references

- `templates/AGENTS.template.md` — stage signals (for B3) and the decision log format (for A4)
- `templates/gate-doc.example.md` — converge step 6 shows a real handoff line in context
