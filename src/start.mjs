// start.mjs — `specgate start`: the single entry. Read-only routing.
// Precheck (5 items) -> three questions (defaults from the precheck; enter
// accepts) -> one exact next command in the fixed Route:/Next:/After: format
// (onboarding.md section 1). start NEVER writes to disk — not a single byte.
// Non-interactive runs (no TTY) accept the precheck defaults; the three
// answer flags route without a terminal. Zero dependencies.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import readline from 'node:readline/promises';
import { UsageError, parseArgs, PKG_ROOT } from './util.mjs';

const BOOL_FLAGS = ['help'];

const HELP = `specgate start — the single entry: route your first run

Usage:
  specgate start [dir] [options]

Read-only. start writes nothing — it prechecks the repository, asks three
questions (defaults pre-filled from the precheck; enter accepts them), then
prints one exact next command in the fixed three-line format:

  Route: <A|B|check> · mode: <solo|with-owner>
  Next:  <one exact command>
  After: <what you should see when it worked>

Precheck (5 items, all read-only):
  1. git repository (git rev-parse)      4. agent tool dirs (.cursor/, .github/,
  2. existing AGENTS.md (stage, OWNER)      .windsurf/, .windsurfrules)
  3. docs structure (docs/plans/,          5. empty vs populated repository
     docs/adr/, backlog/)

Options:
  --repo-state <greenfield|existing>  Answer Q1 without asking
  --decisions   <solo|with-owner>     Answer Q2 without asking
  --intent      <setup|fill|check>    Answer Q3 without asking
  -h, --help                          Show this help

Routing: A greenfield -> specgate init --stage S0 · B existing repo -> specgate
init --adopt · fill missing docs -> specgate init · check -> specgate check.
The rose-bootstrap skill is the optional deep-dive behind Routes A/B.
Non-interactive runs (no TTY) accept the precheck defaults.`;

const SKILL_PATH = join(PKG_ROOT, 'skills', 'rose-bootstrap', 'SKILL.md').split(sep).join('/');

// Files that say nothing about "is there code here yet". Everything else
// (src/, lib/, a Makefile, random files) counts as existing content.
const NON_CODE_ENTRIES = new Set([
  '.git', '.DS_Store', 'AGENTS.md', 'docs', 'handoffs', '.specgate-manifest.json',
  '.cursor', '.github', '.windsurf', '.windsurfrules', '.gitignore', 'node_modules',
  'README.md', 'README.zh-CN.md', 'README-CN.md', 'LICENSE', 'LICENSES', 'NOTICE',
]);

function isGitRepo(dir) {
  try {
    const r = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return r.status === 0 && r.stdout && r.stdout.trim() === 'true';
  } catch {
    return false;
  }
}

function readAgents(dir) {
  const p = join(dir, 'AGENTS.md');
  if (!existsSync(p)) return { exists: false, stage: null, owner: null };
  let text;
  try {
    text = readFileSync(p, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/`[^`\n]*`/g, '');
  } catch {
    return { exists: true, stage: null, owner: null };
  }
  const stage = (text.match(/<!--\s*stage:\s*([A-Za-z0-9:.-]+)\s*-->/) || [])[1] ?? null;
  // Owner: the header line "> Project: X · Owner: <name> · ...", else the table
  // row "| <name> | The person who decides" (AGENTS.template.md shapes).
  let owner = (text.match(/^>\s*Project:[^\n]*?\u00b7\s*Owner:\s*([^\u00b7\n]+?)\s*(?:\u00b7|\n|$)/m) || [])[1] ?? null;
  if (!owner) owner = (text.match(/\|\s*([^|\n]+?)\s*\|\s*The person who decides/) || [])[1] ?? null;
  return { exists: true, stage, owner };
}

function docsForStageMissing(dir, stage) {
  const has = (rel) => existsSync(join(dir, rel));
  const missing = [];
  if (!has(join('docs', 'plans', 'gate-doc.template.md'))) missing.push('gate-doc template');
  if (!has(join('docs', 'adr', 'README.md'))) missing.push('ADR index');
  if (stage !== 'S0') {
    if (!has(join('docs', 'BACKLOG.md')) && !has('backlog')) missing.push('task board');
    if (!has(join('docs', 'architecture', 'current.md'))) missing.push('architecture doc');
  }
  return missing;
}

function detectAgentTools(dir) {
  const found = [];
  for (const [mark, label] of [['.cursor', '.cursor/'], ['.github', '.github/'], ['.windsurfrules', '.windsurfrules'], ['.windsurf', '.windsurf/']]) {
    if (existsSync(join(dir, mark))) found.push(label);
  }
  return found;
}

function repoHasCode(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return true; // unreadable: assume the safer "existing" default
  }
  return entries.some((e) => !NON_CODE_ENTRIES.has(e));
}

function parseRepoState(s) {
  const v = s.trim().toLowerCase();
  if (['1', 'a', 'new', 'greenfield', 'brand-new', 'fresh'].includes(v)) return 'greenfield';
  if (['2', 'b', 'existing', 'code', 'adopt'].includes(v)) return 'existing';
  return null;
}
function parseDecisions(s) {
  const v = s.trim().toLowerCase();
  if (['1', 'solo', 'me'].includes(v)) return 'solo';
  if (['2', 'owner', 'with-owner', 'with owner'].includes(v)) return 'with-owner';
  return null;
}
function parseIntent(s) {
  const v = s.trim().toLowerCase();
  if (['1', 'setup', 'governance', 'bootstrap'].includes(v)) return 'setup';
  if (['2', 'fill', 'missing'].includes(v)) return 'fill';
  if (['3', 'check', 'audit'].includes(v)) return 'check';
  return null;
}

async function askThree(questions) {
  // questions: [{n, options, defaultN, parse}] — TTY only; enter accepts default.
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answers = [];
  try {
    for (const q of questions) {
      let done = false;
      for (let attempt = 0; attempt < 3 && !done; attempt++) {
        const a = await rl.question('Q' + q.n + ' answer [' + q.defaultN + ']: ');
        if (a.trim() === '') { answers.push(q.defaultN); done = true; break; }
        const v = q.parse(a);
        if (v !== null) { answers.push(v); done = true; } else if (attempt === 2) {
          answers.push(q.defaultN);
        } else {
          console.log('  (not understood — answer ' + q.options + ', or press enter for ' + q.defaultN + ')');
        }
      }
    }
  } finally {
    rl.close();
  }
  return answers;
}

export async function runStart(argv) {
  argv = argv.map((a) => (a === '-h' ? '--help' : a));
  const { flags, positionals } = parseArgs(argv, BOOL_FLAGS);
  if (flags.help) { console.log(HELP); return 0; }
  if (positionals.length > 1) throw new UsageError('unexpected extra argument: ' + positionals[1] + ' (usage: specgate start [dir] [options])');
  const dir = resolve(positionals[0] ?? '.');
  if (!existsSync(dir)) throw new UsageError('target directory not found: ' + dir);
  const dirArg = positionals[0];
  const dirDisplay = dirArg ?? '.';

  // ---- precheck: five read-only probes ----
  if (!isGitRepo(dir)) {
    // Error sample 1 (onboarding.md section 4): precondition failure, no Q&A.
    console.log('\u2717 ' + dirDisplay + ' [precondition] Not a git repository. Rollback needs version control.');
    console.log('  Wrong:   bootstrap in an un-initialized directory');
    console.log('  Correct: git init && git commit --allow-empty -m "chore: init"');
    console.log('  Next:    ask the user, then: specgate start');
    console.log('No files were changed.');
    return 1;
  }

  const agents = readAgents(dir);
  const has = (rel) => existsSync(join(dir, rel));
  const docsBits = [
    has(join('docs', 'plans')) ? 'docs/plans/ ok' : 'docs/plans/ missing',
    has(join('docs', 'adr')) ? 'docs/adr/ ok' : 'docs/adr/ missing',
    has('backlog') || has(join('docs', 'BACKLOG.md')) ? 'task board ok' : 'task board missing',
  ];
  const tools = detectAgentTools(dir);
  const emptyRepo = !repoHasCode(dir);

  // ---- defaults derived from the precheck ----
  const d1 = emptyRepo && !agents.exists ? 'greenfield' : 'existing';
  const d2 = agents.owner !== null && agents.owner !== 'me' ? 'with-owner' : 'solo';
  const missingForStage = agents.exists && /^S[0-3]$/.test(agents.stage ?? '') ? docsForStageMissing(dir, agents.stage) : [];
  const d3 = !agents.exists ? 'setup' : missingForStage.length > 0 ? 'fill' : 'check';

  const opts = { '1': '1) brand-new project  2) existing code, add governance', '2': '1) solo — I decide  2) with-owner — another decision-maker', '3': '1) set up governance  2) fill missing docs  3) check only' };
  const questions = [
    { n: 1, label: 'Q1 repository state', options: opts['1'], defaultN: d1, parse: parseRepoState },
    { n: 2, label: 'Q2 decision mode', options: opts['2'], defaultN: d2, parse: parseDecisions },
    { n: 3, label: 'Q3 this run', options: opts['3'], defaultN: d3, parse: parseIntent },
  ];

  // ---- print the precheck + the three questions ----
  console.log('specgate start — ' + dir + '  (read-only: nothing is written)');
  console.log('');
  console.log('Precheck:');
  console.log('  git repository    : yes');
  console.log('  AGENTS.md         : ' + (agents.exists
    ? 'found (stage ' + (agents.stage ?? 'none') + ', owner ' + (agents.owner ?? 'unknown') + ') — never modified by the kit'
    : 'not found'));
  console.log('  docs structure    : ' + docsBits.join(' · '));
  console.log('  agent tools       : ' + (tools.length ? tools.join(' ') + ' — init will offer pointer files (ask-first)' : 'none of .cursor/ .github/ .windsurf/ .windsurfrules'));
  console.log('  repository content: ' + (emptyRepo ? 'empty — greenfield' : 'has files — existing code'));
  console.log('');
  console.log('Three questions (enter accepts the default):');
  for (const q of questions) console.log(q.label + ' — ' + q.options + '  [default: ' + q.defaultN + ']');

  // ---- collect answers: flag > interactive answer > precheck default ----
  let a1 = d1, a2 = d2, a3 = d3;
  const interactive = process.stdin.isTTY && process.stdout.isTTY;
  const flagged = { 1: !!flags['repo-state'], 2: !!flags['decisions'], 3: !!flags['intent'] };
  if (flags['repo-state']) {
    const v = parseRepoState(flags['repo-state']);
    if (v === null) throw new UsageError('invalid --repo-state ' + JSON.stringify(flags['repo-state']) + ' (expected greenfield | existing)');
    a1 = v;
  }
  if (flags.decisions) {
    const v = parseDecisions(flags.decisions);
    if (v === null) throw new UsageError('invalid --decisions ' + JSON.stringify(flags.decisions) + ' (expected solo | with-owner)');
    a2 = v;
  }
  if (flags.intent) {
    const v = parseIntent(flags.intent);
    if (v === null) throw new UsageError('invalid --intent ' + JSON.stringify(flags.intent) + ' (expected setup | fill | check)');
    a3 = v;
  }
  if (interactive) {
    const toAsk = [], idx = [];
    questions.forEach((q, i) => { if (!flagged[String(i + 1)]) { toAsk.push(q); idx.push(i); } });
    if (toAsk.length > 0) {
      console.log('');
      let ans;
      try {
        ans = await askThree(toAsk);
      } catch (e) {
        // Ctrl+D (EOF) / an aborted readline must not dump a stack trace.
        if (e && (e.name === 'AbortError' || e.code === 'ABORT_ERR')) {
          console.log('No answers given. No files were changed.');
          return 0;
        }
        throw e;
      }
      const merged = [a1, a2, a3];
      idx.forEach((i, k) => { merged[i] = ans[k]; });
      a1 = merged[0]; a2 = merged[1]; a3 = merged[2];
    }
  } else {
    const skipped = questions.filter((_, i) => !flagged[String(i + 1)]).map((q) => q.label.slice(0, 2));
    if (skipped.length) console.log('(non-interactive run: ' + skipped.join(', ') + ' answered with the defaults above — rerun in a terminal or pass --repo-state/--decisions/--intent)');
  }

  // "fill" needs an AGENTS.md to fill around; fall back to setup (say so).
  let fillFallback = false;
  if (a3 === 'fill' && !agents.exists) { a3 = 'setup'; fillFallback = true; }

  // ---- route (onboarding.md section 2, minus the deleted --fill command) ----
  const name = basename(dir) || dir;
  const suffix = dirArg ? ' ' + dirArg : '';
  let route, next, after;
  if (a3 === 'check') {
    route = 'check';
    next = 'specgate check' + suffix;
    after = agents.stage
      ? '"PASS ' + name + ' (stage ' + agents.stage + ')" — or every finding with where/expected/fix; check never writes files'
      : 'findings with where/expected/fix (AGENTS.md missing is finding #1); check never writes files';
  } else if (a3 === 'fill') {
    route = 'B';
    next = 'specgate init' + suffix + (a2 === 'solo' ? ' --owner me' : '') + '   # stage ' + agents.stage + ' read from your AGENTS.md; installs only what is missing (add-only)';
    after = '"PASS ' + name + ' (stage ' + agents.stage + ')" — the missing docs (' + missingForStage.join(', ') + ') now exist; existing files untouched';
  } else if (a1 === 'greenfield') {
    route = 'A';
    next = 'specgate init' + suffix + ' --stage S0' + (a2 === 'solo' ? ' --owner me' : '') + '   # one command: scaffolds AGENTS.md + the two S0 docs (add-only, ~1 minute)';
    after = 'AGENTS.md at the root with <!-- stage: S0 --> and no {{placeholders}} — "specgate check' + suffix + '" prints "PASS ' + name + ' (stage S0)"';
  } else {
    route = 'B';
    next = 'specgate init --adopt' + suffix + (a2 === 'solo' ? ' --owner me' : '');
    after = 'git status shows only new files (yours untouched) — "specgate check' + suffix + '" prints "PASS ' + name + ' (stage ' + (agents.stage ?? 'S0') + ')" or lists what waits for your ruling';
  }

  console.log('');
  console.log('Route: ' + route + ' \u00b7 mode: ' + a2);
  console.log('Next:  ' + next);
  console.log('After: ' + after);
  if (route === 'A') console.log('Optional deep-dive: rose-bootstrap skill' + (a2 === 'solo' ? ' (solo mode)' : '') + ' — ' + SKILL_PATH + '  (agent walkthrough: 5 questions, drafts AGENTS.md with you; ~10 minutes)');
  if (route === 'B') console.log('Optional deep-dive: rose-bootstrap skill (adopt path) — ' + SKILL_PATH);
  if (fillFallback) console.log('(note: no AGENTS.md found — "fill missing docs" needs one; routed to set up governance instead)');
  console.log('Ask-first: run the Next command only after you approve what it does. Nothing was written — start is read-only.');
  return 0;
}
