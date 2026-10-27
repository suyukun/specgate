// check.mjs — `specgate check`: stage-aware governance audit.
// Ported from governance-stage-check.sh (the authoritative bash source) with
// plugin semantics per 裁决表 v2: findings are WARN by default (exit 0);
// --strict turns them into FAIL (exit 1). All paths parameterized; CRLF/BOM
// in AGENTS.md tolerated. Zero dependencies.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { UsageError, parseArgs, toPosix } from './util.mjs';

const BOOL_FLAGS = ['strict', 'help'];

const HELP = `specgate check — audit project docs against the AGENTS.md stage marker

Usage:
  specgate check [dir] [options]

Stage marker: the first "<!-- stage: X -->" comment in AGENTS.md.
Allowed: S0 | S1 | S2 | S3 | exempt | frozen | merged:PNN (docs live with the
target project — SKIP).

Per-stage requirements (five-doc kit):
  S0        ADR index docs/adr/README.md (advisory at S0)
  S1 S2 S3  docs/plans container · ADR index · task board (backlog/ dir or
            docs/BACKLOG.md) · architecture current state (docs/architecture/
            or docs/architecture.md, or an "Architecture (current)" / 架构现状
            section in AGENTS.md)
  S2 S3     design spec (root DESIGN.md or a non-empty docs/design/) unless
            "<!-- design: exempt -->" appears in AGENTS.md

Options:
  --strict                    Findings fail the run (exit 1). Default: WARN, exit 0.
  --docs-dir <dir>            Docs root (default: docs)
  --agents-file <file>        Default: AGENTS.md
  --plans-subdir <name>       Default: plans
  --adr-subdir <name>         Default: adr
  --architecture-subdir <n>   Default: architecture
  --design-subdir <name>      Default: design
  --design-file <file>        Root design doc alternative (default: DESIGN.md)
  --board-file <file>         Board markdown inside docs-dir (default: BACKLOG.md)
  --backlog-dir <dir>         Board directory at repo root (default: backlog)
  -h, --help                  Show this help

Exit codes: 0 = PASS / WARN / SKIP · 1 = FAIL (--strict with findings) · 2 = usage error.
The five-doc model, stage signals, and each document's role: see AGENTS.md in
the target project (created by "specgate init").`;

const STAGE_RE = /<!--\s*stage:\s*([A-Za-z0-9:.-]+)\s*-->/;
const VALID_STAGE = /^(S[0-3]|exempt|frozen|merged:[A-Za-z0-9.-]+)$/;

export function runCheck(argv) {
  argv = argv.map((a) => (a === '-h' ? '--help' : a));
  const { flags, positionals } = parseArgs(argv, BOOL_FLAGS);
  if (flags.help) { console.log(HELP); return 0; }
  if (positionals.length > 1) throw new UsageError('unexpected extra argument: ' + positionals[1] + ' (usage: specgate check [dir] [options])');
  const dir = resolve(positionals[0] ?? '.');
  if (!existsSync(dir)) throw new UsageError('project directory not found: ' + dir);
  const dirArg = positionals[0];
  const name = basename(dir) || dir;

  const docsDir = flags['docs-dir'] ?? 'docs';
  const agentsRel = flags['agents-file'] ?? 'AGENTS.md';
  const plansRel = join(docsDir, flags['plans-subdir'] ?? 'plans');
  const adrSub = flags['adr-subdir'] ?? 'adr';
  const adrIndexRel = join(docsDir, adrSub, 'README.md');
  const archRel = join(docsDir, flags['architecture-subdir'] ?? 'architecture');
  const designDirRel = join(docsDir, flags['design-subdir'] ?? 'design');
  const designFileRel = flags['design-file'] ?? 'DESIGN.md';
  const boardFileRel = join(docsDir, flags['board-file'] ?? 'BACKLOG.md');
  const backlogDirRel = flags['backlog-dir'] ?? 'backlog';

  const has = (rel) => existsSync(join(dir, rel));
  const initCmd = (s) => 'specgate init' + (dirArg ? ' ' + dirArg : '') + ' --stage ' + s;

  const findings = [];
  const push = (title, where, expected, fix) => findings.push({ title, where, expected, fix });

  const agentsPath = join(dir, agentsRel);
  let agentsText = null;
  if (existsSync(agentsPath)) {
    agentsText = readFileSync(agentsPath, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  } else {
    push(
      'AGENTS.md not found (no stage source)',
      toPosix(agentsRel) + ' — not found in ' + dir,
      'an adopted AGENTS.md whose header carries a stage marker, e.g. "<!-- stage: S0 -->"',
      initCmd('S0') + '   # or restore the file from git'
    );
  }

  // Strip inline code spans before marker detection: the shipped template
  // quotes "<!-- design: exempt -->" (and marker syntax) in prose inside
  // backticks — a quoted mention must never count as a real marker.
  const plainText = agentsText === null ? null : agentsText.replace(/`[^`\n]*`/g, '');
  let stage = null;
  if (plainText !== null) {
    const m = plainText.match(STAGE_RE);
    stage = m ? m[1] : null;
    if (stage === null) {
      push(
        'no stage marker in ' + toPosix(agentsRel),
        toPosix(agentsRel) + ' — no "<!-- stage: ... -->" comment found',
        'a line "<!-- stage: S0 -->" directly under the title (allowed: S0|S1|S2|S3|exempt|frozen|merged:PNN)',
        'edit ' + toPosix(agentsRel) + ': add "<!-- stage: S0 -->" under the title — stage lives only there'
      );
    } else if (!VALID_STAGE.test(stage)) {
      push(
        'invalid stage value "' + stage + '"',
        toPosix(agentsRel) + ' — marker parses as "' + stage + '"',
        'one of: S0 | S1 | S2 | S3 | exempt | frozen | merged:PNN',
        'edit ' + toPosix(agentsRel) + ': fix the stage marker value'
      );
      stage = 'INVALID';
    }
  }

  if (stage === 'exempt' || stage === 'frozen') {
    console.log('SKIP ' + name + ' | ' + stage);
    return 0;
  }
  if (typeof stage === 'string' && stage.startsWith('merged:')) {
    console.log('SKIP ' + name + ' | ' + stage + ' (docs live with the target project)');
    return 0;
  }

  if (stage === 'S0') {
    if (!has(adrIndexRel)) {
      push(
        'ADR index missing (advisory at S0 — create before the first dispatch)',
        toPosix(adrIndexRel) + ' — not found',
        'a decision-log index, e.g. a table "| ADR | Decision | Status |" with one row per ' + toPosix(join(docsDir, adrSub)) + '/NNNN-<slug>.md',
        initCmd('S0') + '   # manual: mkdir -p ' + toPosix(join(docsDir, adrSub)) + ' && edit ' + toPosix(adrIndexRel)
      );
    }
  } else if (stage === 'S1' || stage === 'S2' || stage === 'S3') {
    if (!has(plansRel)) {
      push(
        'Spec container missing (stage ' + stage + ')',
        toPosix(plansRel) + '/ — not found',
        'a ' + toPosix(plansRel) + '/ directory holding the gate-doc template and one gate doc per batch',
        initCmd(stage) + '   # manual: mkdir -p ' + toPosix(plansRel)
      );
    }
    if (!has(adrIndexRel)) {
      push(
        'ADR index missing (stage ' + stage + ')',
        toPosix(adrIndexRel) + ' — not found',
        'a decision-log index, e.g. a table "| ADR | Decision | Status |" with one row per ' + toPosix(join(docsDir, adrSub)) + '/NNNN-<slug>.md',
        initCmd(stage) + '   # manual: mkdir -p ' + toPosix(join(docsDir, adrSub)) + ' && edit ' + toPosix(adrIndexRel)
      );
    }
    if (!has(backlogDirRel) && !has(boardFileRel)) {
      push(
        'Task board missing (stage ' + stage + ')',
        toPosix(backlogDirRel) + '/ (dir) and ' + toPosix(boardFileRel) + ' (file) — neither found',
        'either a backlog/ directory (backlog.md CLI, pinned 1.55.3) or a plain ' + toPosix(boardFileRel) + ' table (| ID | Title | Type | Priority | Status | Acceptance |)',
        initCmd(stage) + '   # or, with the owner consent: npm i -D backlog.md@1.55.3'
      );
    }
    const archSectionOk = agentsText !== null && (agentsText.includes('架构现状') || agentsText.includes('Architecture (current)'));
    if (!has(archRel) && !has(archRel + '.md') && !archSectionOk) {
      push(
        'Architecture current state missing (stage ' + stage + ')',
        toPosix(archRel) + '/ , ' + toPosix(archRel) + '.md , and an "Architecture (current)" section in ' + toPosix(agentsRel) + ' — none found',
        toPosix(archRel) + '/current.md describing how the system is wired right now (updated at every converge step 7)',
        initCmd(stage) + '   # or add an "## Architecture (current)" section to ' + toPosix(agentsRel)
      );
    }
    if (stage === 'S2' || stage === 'S3') {
      const designExempt = plainText !== null && plainText.includes('<!-- design: exempt -->');
      let designDirHas = false;
      try {
        designDirHas = existsSync(join(dir, designDirRel)) && readdirSync(join(dir, designDirRel)).length > 0;
      } catch { designDirHas = false; }
      if (!designExempt && !has(designFileRel) && !designDirHas) {
        push(
          'Design spec missing (stage ' + stage + ')',
          toPosix(designFileRel) + ' (root) and ' + toPosix(designDirRel) + '/ (non-empty) — neither found; no "<!-- design: exempt -->" marker in ' + toPosix(agentsRel),
          'docs/design/DESIGN.md owning UI tokens / interface schemas — or, for a no-UI project, the marker "<!-- design: exempt -->" next to the stage marker',
          'create ' + toPosix(join(designDirRel, 'DESIGN.md')) + '   # or add "<!-- design: exempt -->" to ' + toPosix(agentsRel) + " (owner's call)"
        );
      }
    }
  }

  // ---- report: every finding = where + expected + fix ----
  if (findings.length > 0) {
    console.log('specgate check — ' + dir + (stage ? ' (stage ' + stage + ')' : ''));
    findings.forEach((f, i) => {
      console.log('');
      console.log('[' + (i + 1) + '/' + findings.length + '] ' + f.title);
      console.log('  where    : ' + f.where);
      console.log('  expected : ' + f.expected);
      console.log('  fix      : ' + f.fix);
    });
    console.log('');
  }
  const stageLabel = stage ?? '-';
  if (findings.length === 0) {
    console.log('PASS ' + name + ' | ' + stageLabel);
    return 0;
  }
  if (flags.strict) {
    console.log('FAIL ' + name + ' | ' + stageLabel + ' | ' + findings.length + ' finding(s) — --strict');
    return 1;
  }
  console.log('WARN ' + name + ' | ' + stageLabel + ' | ' + findings.length + ' finding(s) — default mode; rerun with --strict to fail');
  return 0;
}
