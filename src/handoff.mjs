// handoff.mjs — `specgate handoff`: minimal cross-session handoff routing.
// No arguments: print the write/read routing + the handoff skeleton (the
// three-part scope contract What / Not in this handoff / Out of scope, shape
// taken from skills/rose-handoff/SKILL.md) and point at the full skill.
// --init: create today's skeleton in handoffs/ — ask-first discipline: the
// exact file and its content are printed, THEN it is written; an existing
// file is never modified (add-only, same rule as init). Zero dependencies.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { UsageError, parseArgs, toPosix, PKG_ROOT } from './util.mjs';

const BOOL_FLAGS = ['init', 'help'];

const SKILL_PATH = join(PKG_ROOT, 'skills', 'rose-handoff', 'SKILL.md');

const HELP = `specgate handoff — cross-session handoff, written or read (rose-handoff)

Usage:
  specgate handoff [dir] [options]

No arguments: prints the routing (write when a session ends, read when the
next one starts), the handoff skeleton — the three-part scope contract
What / Not in this handoff / Out of scope — and points at the full skill.
Reads only; writes nothing.

Options:
  --init               Create today's handoff skeleton in handoffs/ (ask-first:
                       the exact file and content are printed, then written; an
                       existing file is never modified)
  --topic <name>       File slug: handoff-YYYY-MM-DD-<topic>.md (default: session)
  --date <YYYY-MM-DD>  Default: today (local time)
  -h, --help           Show this help

After writing: update handoffs/INDEX.md (newest on top) and read the file
back — the full five-minute flows live in the shipped rose-handoff skill.`;

function todayLocal() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

function skeleton(topic, date, project) {
  return `# Handoff: ${topic} (${date})

Project: ${project}
Purpose: <end of day | window rotation | switching tool>
Continue: <the one sentence the next session should act on first — the most important line>

## What — in this handoff

### 1. Current focus
<one sentence: what this session was doing>

### 2. Findings and decisions
- <bullet points, each with a file path or code reference>

### 3. Settled decisions (do not reopen)
<converged conclusions, short>

### 4. Next steps (waiting for the owner — do not start alone)
- [ready to dispatch] <…>
- [needs decision] <…>
- [not doing] <…>

### 5. Key files and commands
<what the next session reaches for first>

### 6. Environment snapshot (optional)
<running services and ports · background jobs · uncommitted changes · which model/tool this session used>

## Not in this handoff — stays with the original session
<what you deliberately did not include; anything not listed here belongs to the previous session>

## Out of scope — a handoff never does this
- Archive files or hand work to a teammate
- Auto-dispatch tasks from "next steps" — they wait for the owner

<!-- created by specgate handoff --init; this file is yours to edit by hand -->
`;
}

function printRoutingAndSkeleton() {
  console.log('specgate handoff — cross-session handoff (routes to the rose-handoff skill)');
  console.log('');
  console.log('Writing a handoff (a session ends or rotates) -> handoffs/handoff-YYYY-MM-DD-<topic>.md, dated today');
  console.log('Reading a handoff (a new session starts)    -> handoffs/INDEX.md first; or the newest handoff-*.md; then stop');
  console.log('');
  console.log('Handoff skeleton — the three-part scope contract:');
  console.log('');
  console.log('  # Handoff: <topic> (YYYY-MM-DD)');
  console.log('  Project: <name> · Purpose: <end of day | window rotation | switching tool>');
  console.log('  Continue: <the one sentence the next session acts on first>');
  console.log('');
  console.log('  ## What — in this handoff');
  console.log('  1. Current focus · 2. Findings and decisions (each with a file path) ·');
  console.log('  3. Settled decisions (do not reopen) · 4. Next steps ([ready to dispatch] /');
  console.log('  [needs decision] / [not doing] — waiting for the owner) · 5. Key files and');
  console.log('  commands · 6. Environment snapshot (optional)');
  console.log('');
  console.log('  ## Not in this handoff — stays with the original session');
  console.log('  <what you deliberately did not include — scope creeps in when this section is empty>');
  console.log('');
  console.log('  ## Out of scope — a handoff never does this');
  console.log('  archive files · hand work to a teammate · auto-dispatch tasks from "next steps"');
  console.log('');
  console.log('Rules that make a handoff findable: date the file today (never reuse an old');
  console.log('date), update handoffs/INDEX.md with the newest on top, and read the file');
  console.log('back after writing it.');
  console.log('');
  console.log('Skeleton file: specgate handoff --init  (prints the file, then creates it in handoffs/)');
  console.log('Full flows:    ' + SKILL_PATH);
}

export async function runHandoff(argv) {
  argv = argv.map((a) => (a === '-h' ? '--help' : a));
  const { flags, positionals } = parseArgs(argv, BOOL_FLAGS);
  if (flags.help) { console.log(HELP); return 0; }
  if (positionals.length > 1) throw new UsageError('unexpected extra argument: ' + positionals[1] + ' (usage: specgate handoff [dir] [options])');
  const dir = resolve(positionals[0] ?? '.');
  if (!existsSync(dir)) throw new UsageError('target directory not found: ' + dir);

  if (!flags.init) {
    printRoutingAndSkeleton();
    return 0;
  }

  const topic = String(flags.topic ?? 'session').trim() || 'session';
  if (!/^[A-Za-z0-9._-]+$/.test(topic)) throw new UsageError('invalid --topic ' + JSON.stringify(topic) + ' (letters, digits, dot, dash, underscore only — it becomes a file name)');
  const date = flags.date ?? todayLocal();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new UsageError('invalid --date ' + JSON.stringify(date) + ' (expected YYYY-MM-DD)');
  const rel = join('handoffs', 'handoff-' + date + '-' + topic + '.md');
  const abs = join(dir, rel);
  const text = skeleton(topic, date, basename(dir) || dir);

  // ask-first: print the exact file and content BEFORE anything is written.
  console.log('specgate handoff --init — ' + dir);
  console.log('');
  if (existsSync(abs)) {
    console.log('Already exist — NOT touched (handoff never modifies existing files; you decide):');
    console.log('  = ' + toPosix(rel) + '  — exists, untouched');
    console.log('');
    console.log('Pick a different --topic, or edit the file by hand (it is yours).');
    console.log('Next: fill the <...> slots, update handoffs/INDEX.md (newest on top), and read the file back.');
    console.log('Full flow: ' + SKILL_PATH);
    return 0;
  }
  console.log('Files to write (1):');
  console.log('  + ' + toPosix(rel) + '  — handoff skeleton: three-part scope contract (What / Not in this handoff / Out of scope)');
  console.log('');
  console.log('Content:');
  for (const line of text.split('\n')) console.log('  | ' + line);

  mkdirSync(dirname(abs), { recursive: true });
  try {
    writeFileSync(abs, text);
  } catch (e) {
    throw new UsageError('cannot write ' + toPosix(rel) + ': ' + (e && e.code ? e.code : String(e)));
  }

  console.log('');
  console.log('Done: 1 written.');
  console.log('Next: 1) fill the <...> slots  2) add the entry to handoffs/INDEX.md (newest on top)  3) read the file back — "I wrote it" without a read-back is the known failure mode');
  console.log('Full flow: ' + SKILL_PATH);
  return 0;
}
