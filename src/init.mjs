// init.mjs — `specgate init`: scaffold the governance docs.
// Contract: ADD-ONLY. A file that already exists is never modified — it is
// listed as "exists, untouched" for a human to decide. Shipped templates are
// pure copies; AGENTS.md gets only {{OWNER}}/{{PROJECT_NAME}}/{{DATE}} plus the
// stage-marker substitution. Zero dependencies. Windows-safe: path.join
// everywhere, manifest keys normalized to forward slashes.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import readline from 'node:readline/promises';
import { UsageError, VERSION, parseArgs, sha256Hex, templateText, toPosix, PKG_ROOT } from './util.mjs';

const BOOL_FLAGS = ['adopt', 'yes', 'help'];
const STAGES = new Set(['S0', 'S1', 'S2', 'S3']);
const MANIFEST_FILE = '.specgate-manifest.json';

const HELP = `specgate init — scaffold governance docs (add-only; existing files are never touched)

Usage:
  specgate init [dir] [options]

Options:
  --stage <S0|S1|S2|S3>   What to install. Default: the stage marker of an existing
                          AGENTS.md when present, else S0 (explicit flag wins).
                          S0  : AGENTS.md + gate-doc template (docs/plans/) + ADR index
                                (docs/adr/README.md) — the two S0 documents.
                          S1+ : the S0 set + plain task board (docs/BACKLOG.md) +
                                architecture current-state doc (docs/architecture/current.md).
                          S2/S3 install the S1 set; the design spec stays yours to add
                                (or mark <!-- design: exempt -->) — "specgate check" guides.
  --adopt                 Existing-repository mode: identical add-only rule, plus a
                          merge hint for your pre-existing AGENTS.md.
  --owner <name>          Decision-maker. Resolution order: flag > git config user.name >
                          interactive ask > "me" (solo fallback for non-interactive runs).
  --project-name <name>   Default: target directory name.
  --date <YYYY-MM-DD>     Default: today (local time).
  --docs-dir <dir>        Docs root (default: docs).
  --yes                   Write the suggested agent pointer files without asking.
  -h, --help              Show this help.

Agent pointer files (ask-first): when .cursor/, .github/, or .windsurfrules exist,
init suggests one-line pointers to AGENTS.md (.cursor/rules/agents.mdc,
.github/copilot-instructions.md, .windsurf/rules/agents.md). Suggested content is
printed; nothing is written unless --yes is passed.

Uninstall: every file init created is listed with its sha256 in
.specgate-manifest.json — delete those files (or git revert) and you are clean.`;

const ADR_INDEX = `# Decision Log (ADR)

One decision per file: NNNN-<slug>.md (four digits, unique in this project).
Format: "Appendix A — ADR template" in AGENTS.md. Status values: proposed |
accepted | superseded by ADR-NNNN | withdrawn. Old ADRs are never rewritten —
a newer decision supersedes via the status line and a pointer.

| ADR | Decision | Status |
| --- | --- | --- |
| — | *(nothing recorded yet)* | — |

<!-- created by specgate; this file is yours to edit by hand -->`;

const BOARD_MD = `# Task Board

The single registry of pending work — to-dos that live in chats resurface as
surprises. Cards land here registered, not fixed in passing. One card, one
writer at a time. Urgent hotfix: fix first, register the card right after.

| ID | Title (verb + object) | Type | Priority | Status | Acceptance |
| --- | --- | --- | --- | --- | --- |
| — | *(empty board)* | | | | |

Acceptance criteria are filled in before a card enters a batch.

Once volume grows, prefer the backlog.md CLI (npm, pinned 1.55.3, keeps the
board as plain markdown under backlog/) — this file is the quiet-project
fallback. Ask the owner before installing anything.

<!-- created by specgate; this file is yours to edit by hand -->`;

const ARCH_CURRENT = `# Architecture (current)

How the system is wired right now. Updated in the same commit as any batch that
changes modules, entry points, or data flows (gate doc converge step 7).

- Entry points: <fill in>
- Modules and data flow: <fill in>
- Key dependencies: <fill in>
- Deployment shape: <fill in>

A blueprint (target state) becomes its own document once it diverges from
current state; direction changes require an ADR.

<!-- created by specgate; this file is yours to edit by hand -->`;

const SHIM_CURSOR = `---
description: Project rules pointer (created by specgate)
alwaysApply: true
---

Read AGENTS.md at the repository root and follow it for all work in this repo.`;

const SHIM_MD = `Read AGENTS.md at the repository root and follow it for all work in this repo.
(pointer created by specgate — edit or delete freely)`;

function todayLocal() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

function gitConfigOwner(cwd) {
  for (const args of [['config', 'user.name'], ['config', '--global', 'user.name']]) {
    try {
      const r = spawnSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      if (r.status === 0 && r.stdout && r.stdout.trim()) return r.stdout.trim();
    } catch { /* git absent — fall through */ }
  }
  return null;
}

async function askOwnerInteractive(projectName) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) return null;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question('Owner (decision-maker) for ' + projectName + ' [me]: ');
    return answer.trim() || null;
  } finally {
    rl.close();
  }
}

export async function runInit(argv) {
  argv = argv.map((a) => (a === '-h' ? '--help' : a));
  const { flags, positionals } = parseArgs(argv, BOOL_FLAGS);
  if (flags.help) { console.log(HELP); return 0; }
  if (positionals.length > 1) throw new UsageError('unexpected extra argument: ' + positionals[1] + ' (usage: specgate init [dir] [options])');
  const target = resolve(positionals[0] ?? '.');
  if (!existsSync(target)) throw new UsageError('target directory not found: ' + target);
  const dirArg = positionals[0];

  let stage = flags.stage ?? null;
  let stageSource = '--stage';
  if (stage === null) {
    // Infer from an existing AGENTS.md marker (adopt-friendly): install what the
    // project already declares. Fresh project without a marker -> S0.
    const existingAgents = join(target, 'AGENTS.md');
    if (existsSync(existingAgents)) {
      const t = readFileSync(existingAgents, 'utf8').replace(/\r\n/g, '\n').replace(/`[^`\n]*`/g, '');
      const m = t.match(/<!--\s*stage:\s*([A-Za-z0-9:.-]+)\s*-->/);
      if (m && STAGES.has(m[1])) { stage = m[1]; stageSource = 'existing AGENTS.md marker'; }
    }
  }
  if (stage === null) stage = 'S0';
  if (!STAGES.has(stage)) throw new UsageError('invalid --stage ' + JSON.stringify(stage) + ' (expected S0 | S1 | S2 | S3)');
  const docsDir = flags['docs-dir'] ?? 'docs';
  const date = flags.date ?? todayLocal();
  const projectName = flags['project-name'] ?? basename(target);

  let owner = flags.owner ?? null;
  let ownerSource = '--owner';
  if (!owner) { owner = gitConfigOwner(target); if (owner) ownerSource = 'git config user.name'; }
  if (!owner) { owner = await askOwnerInteractive(projectName); if (owner) ownerSource = 'interactive answer'; }
  if (!owner) { owner = 'me'; ownerSource = 'non-interactive fallback (solo mode)'; }

  // ---- build the plan; nothing touches disk before the plan is printed ----
  const writes = [];
  let agents = templateText('AGENTS.template.md');
  agents = agents.split('{{OWNER}}').join(owner)
    .split('{{PROJECT_NAME}}').join(projectName)
    .split('{{DATE}}').join(date);
  const marker = '<!-- stage: ' + stage + ' -->';
  agents = agents.replace('<!-- stage: S0 -->', marker);
  if (!agents.includes(marker)) throw new UsageError('template drift: stage marker missing from AGENTS.template.md');
  writes.push({ rel: 'AGENTS.md', text: agents, origin: 'templates/AGENTS.template.md — {{OWNER}}/{{PROJECT_NAME}}/{{DATE}} filled, stage marker ' + marker });

  writes.push({ rel: join(docsDir, 'plans', 'gate-doc.template.md'), text: templateText('gate-doc.template.md'), origin: 'templates/gate-doc.template.md — pure copy, no substitution' });
  writes.push({ rel: join(docsDir, 'adr', 'README.md'), text: ADR_INDEX, origin: 'generated — ADR index (S0 doc 2/2)' });

  if (stage !== 'S0') {
    writes.push({ rel: join(docsDir, 'BACKLOG.md'), text: BOARD_MD, origin: 'generated — plain task board (S1 doc 3)' });
    writes.push({ rel: join(docsDir, 'architecture', 'current.md'), text: ARCH_CURRENT, origin: 'generated — architecture current state (S1 doc 4)' });
  }

  // agent pointer shims (ask-first; never overwriting)
  const shimDefs = [];
  if (existsSync(join(target, '.cursor'))) shimDefs.push({ detected: '.cursor/', rel: join('.cursor', 'rules', 'agents.mdc'), text: SHIM_CURSOR });
  if (existsSync(join(target, '.github'))) shimDefs.push({ detected: '.github/', rel: join('.github', 'copilot-instructions.md'), text: SHIM_MD });
  if (existsSync(join(target, '.windsurfrules'))) shimDefs.push({ detected: '.windsurfrules', rel: join('.windsurf', 'rules', 'agents.md'), text: SHIM_MD });
  const shimTaken = [], shimToWrite = [], shimSuggested = [];
  for (const s of shimDefs) {
    if (existsSync(join(target, s.rel))) shimTaken.push(s);
    else if (flags.yes) shimToWrite.push(s);
    else shimSuggested.push(s);
  }

  // classify: existing files are skipped, never modified
  const pending = [], untouched = [];
  for (const w of writes) (existsSync(join(target, w.rel)) ? untouched : pending).push(w);

  // manifest — the only file init rewrites (plugin state, not a user document)
  let manifest = {};
  const manifestPath = join(target, MANIFEST_FILE);
  if (existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    } catch {
      console.log('note: existing ' + MANIFEST_FILE + ' is not valid JSON — recreating it');
      manifest = {};
    }
  }
  manifest.specgate = { version: VERSION, stage, owner, ownerSource, projectName, docsDir, updatedAt: new Date().toISOString() };
  manifest.files = manifest.files && typeof manifest.files === 'object' ? manifest.files : {};
  for (const w of [...pending, ...shimToWrite]) {
    manifest.files[toPosix(w.rel)] = { sha256: sha256Hex(Buffer.from(w.text, 'utf8')), bytes: Buffer.byteLength(w.text) };
  }
  const manifestWrite = { rel: MANIFEST_FILE, text: JSON.stringify(manifest, null, 2) + '\n', origin: 'plugin manifest — created-file ledger for uninstall checks (safe to delete)' };

  // ---- print the plan, then write (discipline: list before any disk write) ----
  console.log('specgate init — ' + target);
  console.log('stage ' + stage + ' (' + stageSource + ') · owner "' + owner + '" (' + ownerSource + ') · project "' + projectName + '" · docs root "' + toPosix(docsDir) + '"');
  console.log('');
  console.log('Files to write (' + (pending.length + shimToWrite.length + 1) + '):');
  for (const w of pending) console.log('  + ' + toPosix(w.rel) + '  — ' + w.origin);
  for (const s of shimToWrite) console.log('  + ' + toPosix(s.rel) + '  — agent pointer (--yes), detected via ' + s.detected);
  console.log('  + ' + MANIFEST_FILE + '  — ' + manifestWrite.origin);
  if (untouched.length || shimTaken.length) {
    console.log('');
    console.log('Already exist — NOT touched (init never modifies existing files; you decide):');
    for (const w of untouched) console.log('  = ' + toPosix(w.rel) + '  — exists, untouched');
    for (const s of shimTaken) console.log('  = ' + toPosix(s.rel) + '  — exists, untouched (pointer target taken; detected via ' + s.detected + ')');
  }
  if (shimSuggested.length) {
    console.log('');
    console.log('Suggested agent pointer files (ask-first — NOT written; rerun with --yes to write):');
    for (const s of shimSuggested) {
      console.log('  ? ' + toPosix(s.rel) + '  (detected ' + s.detected + ')');
      for (const line of s.text.split('\n')) console.log('      | ' + line);
    }
  }
  if (flags.adopt && untouched.length) {
    console.log('');
    console.log('Adopt mode — to merge your AGENTS.md with the shipped template, diff them yourself:');
    console.log('  diff "' + toPosix(join(PKG_ROOT, 'templates', 'AGENTS.template.md')) + '" "' + toPosix('AGENTS.md') + '"');
  }
  console.log('');
  console.log('Tip: a fully worked first gate doc ships with the package: ' + toPosix(join(PKG_ROOT, 'templates', 'gate-doc.example.md')));

  for (const w of [...pending, ...shimToWrite, manifestWrite]) {
    const abs = join(target, w.rel);
    mkdirSync(dirname(abs), { recursive: true });
    try {
      writeFileSync(abs, w.text);
    } catch (e) {
      throw new UsageError('cannot write ' + toPosix(w.rel) + ': ' + (e && e.code ? e.code : String(e)) + ' (is a parent path a file?)');
    }
  }

  console.log('');
  console.log('Done: ' + (pending.length + shimToWrite.length + 1) + ' written, ' + (untouched.length + shimTaken.length) + ' skipped (untouched).');
  console.log('Next: 1) review AGENTS.md and fill the <fill in> slots  2) run: specgate check' + (dirArg ? ' ' + dirArg : ''));
  console.log('Uninstall: delete the files listed in ' + MANIFEST_FILE + ' (sha256 hashes included for verification).');
  return 0;
}
