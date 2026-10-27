<!-- template_version: 1 -->

# Gate Doc — Record and list an expense (worked example)

> This is a **worked example**, not a blank template. The project ("PocketLedger"), the owner ("Alex"), and all outputs below are fictional. Read it next to `gate-doc.template.md` to see what "filled in" looks like. Copy the blank template for real work — never this file.

> Project: PocketLedger · Batch: expense-entry · Owner: Alex · Created: 2026-10-20

## Start here

| Question | Answer |
| --- | --- |
| What is this? | A filled-in gate doc: the first real batch of PocketLedger, a personal expense tracker. Level L, with-owner mode, all seven converge steps passed. |
| What should I notice? | How short good answers are. A1 is one sentence. B2 has three decisions. The decision ledger has five cards, four resolved and one retired. Converge has real evidence pasted in, including one backfilled task. |
| Where next? | Copy `gate-doc.template.md` for your own batch. The blank form explains every field; this example only shows them filled. |

### Document status

> Status: converged
> <!-- allowed values, defined only in the template: draft | converged | archived -->

phase: converging
> <!-- allowed values, defined only in the template: sizing | drafting | ready | converging -->

## Step 0 — Size the batch

- This batch is level: **L**
- Reason: new data schema + storage module + two new UI components, and the result sits on the demo path we will show to the first test users.
- Downgrade from L: n/a.

Not an S batch: the change touches six files across three modules. Not an M batch: it introduces the project's first persistent data model.

## Before you dispatch — three checks (all passed before dispatch on 2026-10-21)

1. Cards clear: the decision ledger below had zero `NC-OPEN` rows (recorded count: 0) before dispatch.
2. Baseline real: D1 commands ran on 2026-10-21 before any work started; output pasted in D1.
3. Task on the list: everything dispatched appeared in the C1 table. One gap surfaced late (storage quota hint) — reported to Alex, who parked it on the board instead of adding it to this batch.

## A. Requirements

- [x] **A1 — One-sentence proposition.**
  For one person who wants to know where their money goes, PocketLedger records an expense in seconds and shows the running list, so a week of spending is visible without a spreadsheet.

- [x] **A2 — User stories.**
  - P1 — As a user, I add an expense (amount, category, date, note) so that it is saved without typing twice.
  - P1 — As a user, I see my recent expenses with this week's total, so I can stop spending blindly.
  - P2 — As a user, I edit an entry, so I can fix a typo without deleting it.
  - P3 — As a user, I export a month as CSV, so I can keep records elsewhere.
  P1 loop stands alone: add + list is useful with zero P2/P3.

- [x] **A3 — Acceptance criteria.**
  - AC-1: When I submit the entry form with amount 12.50, category "Food", and date 2026-10-21, the system must store the entry and show it at the top of the list within one second. (check: `src/app.test.tsx — "adds an entry and shows it"`)
  - AC-2: When the list holds entries from the current week, the system must show their sum as "This week: <total>" in the list header. (check: `src/app.test.tsx — "weekly total sums current-week entries"`)
  - AC-3: When I submit the form with an empty amount, the system must keep the form open, store nothing, and show "Amount is required" next to the field. (check: `src/app.test.tsx — "rejects empty amount"`)
  - AC-4: When I submit amount 12.345, the system must reject it with "Use at most two decimals" and store nothing. (check: `src/app.test.tsx — "rejects three-decimal amount"`)
  - AC-5: When I click Submit twice quickly, the system must store exactly one entry. (check: `src/app.test.tsx — "double submit stores one entry"`)
  - AC-6: When storage is unavailable (private-browsing mode), the system must show "Storage unavailable — entries will not be saved" instead of a blank screen. (check: `src/app.test.tsx — "storage failure banner"`)
  - AC-7: When an entry is stored, its amount must be kept as an integer number of cents (1250), never a float. (check: `src/storage.test.ts — "stores cents"`)

- [x] **A4 — Boundary cases.**
  - Empty amount → must reject with a message, keep form data (AC-3).
  - Three-decimal amount → must reject, store nothing (AC-4).
  - Double submit → must store exactly one entry (AC-5).
  - Storage write fails → must warn, not crash (AC-6).

- [x] **A5 — Non-goals.**
  No editing (P2), no CSV export (P3), no multi-currency, no cloud sync, no charts, no categories management (fixed list of eight for now). Alex agreed 2026-10-21.

## B. Design

- [x] **B1 — Technical context.**
  React 18 + TypeScript + Vite, no state library. Files to add or change: `src/types/expense.ts`, `src/storage.ts`, `src/components/EntryForm.tsx`, `src/components/EntryList.tsx`, `src/App.tsx`, plus tests. Data lives in browser localStorage behind the storage module. Dependency that must not shift: no new runtime dependencies. Testing: component tests already in place.

- [x] **B2 — Key decisions.** (3 of at most 5; each became an ADR at converge)
  1. Storage = localStorage with a JSON envelope, not IndexedDB. Reason: hundreds of entries, no queries needed; IndexedDB adds async complexity we cannot yet justify. Rejected: IndexedDB (heavier, unneeded), a backend (non-goal). → ADR-0001
  2. Money = integer cents end to end, never floats. Reason: floats corrupt sums; cents are exact and format at the edges. Rejected: float with rounding (silent drift). → ADR-0002
  3. No state library in v1. Reason: two components and one shared list; `useState` in App is enough. Rejected: a store now, added when a second view appears. → ADR-0003

- [x] **B3 — Interface and data contracts.** (as code)

```ts
// src/types/expense.ts
export type Expense = {
  id: string;            // crypto.randomUUID()
  amountCents: number;   // integer, always > 0
  category: Category;    // one of CATEGORIES
  date: string;          // "YYYY-MM-DD"
  note: string;          // <= 80 chars, may be ""
};

// src/storage.ts
export function loadExpenses(): Expense[];          // parse errors -> []
export function saveExpense(e: Expense): void;      // throws StorageError
```

- [x] **B4 — Baseline self-check.**
  - [x] Minimal implementation: no settings screen, no currency picker, no abstraction over storage — the three modules in B1 are the whole change.
  - [x] Surgical changes: every planned change maps to a C1 task; nothing else touched.
  - [x] Ask-first list: no deletions, no schema change, no public API, no new dependency, no release — nothing on the list applies.

## C. Plan

- [x] **C1 — Task table.**

| Task | Files | Completion check |
| --- | --- | --- |
| TASK-101 (covers AC-7) — foundational: type + storage module | `src/types/expense.ts`, `src/storage.ts`, `src/storage.test.ts` | storage tests green; `stores cents` passes |
| TASK-102 (covers AC-1, AC-3, AC-4, AC-5) — entry form | `src/components/EntryForm.tsx` | form tests green |
| TASK-103 (covers AC-1, AC-2) — entry list + weekly total | `src/components/EntryList.tsx` | list tests green |
| TASK-104 (covers AC-1, AC-6) — wire App, storage-failure banner | `src/App.tsx`, `src/app.test.tsx` | app tests green |

- [x] **C2 — Foundational tasks first.** TASK-101 unlocks 102–104 (the `Expense` type and storage API). Its "unlocks what": everything.
- [x] **C3 — Parallel marks.** TASK-102 `[P]` and TASK-103 `[P]` after TASK-101; TASK-104 serial last. Max in flight: 2 — inside the limit of 4.
- [x] **C4 — Timebox and stop-loss.** Expected: 1 round for 101, 2 for 102 (form validation), 1 each for 103–104. Stop-loss written into both dispatch notes: "same task fails twice → stop, spec gets fixed, no third patch."

## D. Acceptance

- [x] **D1 — Acceptance commands and baseline.** (recorded 2026-10-21, before work started)
  - Commands: `npm run lint` · `npm run typecheck` · `npm test -- src/storage.test.ts src/app.test.tsx`
  - Baseline: lint clean · typecheck clean · tests 3 passed, 0 failed (pre-existing smoke tests).
- [x] **D2 — Review the diff, not the story.** Diff map filled at converge (below).
- [x] **D3 — Demo path.** Mode: **with-owner** (L batch, will be shown to test users).
  1. Ask Alex to run the dev server and open the app.
  2. Type 12.50, pick "Food", leave date as today, note "lunch" → Submit.
  3. Entry appears at the top of the list; "This week:" total increased by 12.50.
  4. Clear the amount → Submit → "Amount is required", nothing stored.
  5. Reload the page → the entry is still there.
- [x] **D4 — Definition of done, one sentence.** AC-1 through AC-7 all pass via the D1 commands, and Alex walked the demo successfully — nothing else counts.

## Decision cards (needs-clarification protocol)

Mode: **with-owner**. Cards sent to Alex as one batch on 2026-10-21; Alex replied "1a 2a 3b 4 default; 5 n/a".

### Decision ledger

| # | Question | Recommendation | State |
| --- | --- | --- | --- |
| NC-1 | Which currency handling in v1? a) one currency, picked from browser locale b) amount + currency code per entry | a | NC-RESOLVED: 1a — single currency from locale; multi-currency parked on the board |
| NC-2 | Where do entries live? a) localStorage JSON envelope b) IndexedDB | a | NC-RESOLVED: 2a — localStorage (ADR-0001) |
| NC-3 | How is money stored? a) float with display rounding b) integer cents | b | NC-RESOLVED: 3b — integer cents (ADR-0002) |
| NC-4 | What does the date field default to? a) today, changeable b) empty, required | a | NC-RESOLVED: default — today, changeable |
| NC-5 | Should the list show an offline/low-storage warning at all times? | n/a | NC-N/A — moved out of scope; board card BOARD-14 holds it |

## Converge — the seven steps (all passed 2026-10-22)

1. **Baseline green.** lint clean · typecheck clean · focused tests: 14 passed, 0 failed. Baseline's 3 pre-existing tests still pass — no regressions.
2. **Diff mapped.**

   | Changed files | AC / task covered | In scope? |
   | --- | --- | --- |
   | `src/types/expense.ts` | TASK-101, AC-7 | yes |
   | `src/storage.ts` + test | TASK-101, AC-7 | yes |
   | `src/components/EntryForm.tsx` | TASK-102, AC-1/3/4/5 | yes |
   | `src/components/EntryList.tsx` | TASK-103, AC-1/2 | yes |
   | `src/App.tsx` + `src/app.test.tsx` | TASK-104, AC-1/6 | yes |

   No out-of-scope edits. One unfinished edge surfaced during review — a weekly-total quirk when an entry is future-dated. Backfilled as **TASK-105 (covers AC-2): exclude future-dated entries from the weekly total; completion check: `weekly total ignores future entries` test green.** Not verbally waived, not dropped.

3. **Demo walked.** Alex ran the five demo steps on 2026-10-22; all behaved as written (step 4 message read "Amount is required").
4. **Cards clear.** Four `NC-RESOLVED`, one `NC-N/A`; zero `NC-OPEN`.
5. **Status and commit.** Status set to `converged` above. Delivery commit `f3a9c21` — message: "feat: record and list expenses (docs/plans/gate-expense-entry_v1.md)".
6. **Handoff line.** Appended to `handoffs/handoff-2026-10-22-expense-entry.md` in the same commit: "Batch expense-entry converged: add + list + weekly total live; TASK-105 (future-date total) backfilled; next batch likely edit-entry (P2)."
7. **Architecture current.** `docs/architecture/current.md` updated in the same commit: App now renders EntryForm + EntryList; both go through `src/storage.ts` (localStorage, JSON envelope per ADR-0001); money is cents per ADR-0002.

## Runtime clauses

Not triggered: no task needed a second rework round; stop-loss never fired. TASK-105 was found at review, before any rework.
