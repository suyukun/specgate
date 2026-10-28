#!/usr/bin/env node
// claims.mjs — machine-checkable gate for all 51 rows of
// docs/plans/首发承诺面_20261028.md, dispositioned by
// docs/plans/承诺面处置批复_20261027.md. Release gate G1 evidence.
//
// Black-box style (same as test/smoke.mjs): spawn the real CLI through
// child_process and assert exit codes / output; grep the shipped product docs
// for deleted or demoted wording. No framework, zero dependencies.
//
// Classes (from the disposition 批复):
//   IMPL   实现            — the promise is live: its verification command passes.
//   DELETE 删承诺标 v0.2    — old wording has 0 hits in the product docs AND the
//                           deleted capability still does not work (a deleted
//                           promise that runs would be an undocumented feature).
//   DEMOTE 降级文案         — new wording present where the promise lives, old
//                           wording 0 hits; measurable numbers still hold.
//   MANUAL 不可机判（人工走查）— asserts only what IS statically checkable
//                           (wording present / old wording gone / no half-wired
//                           checker in src); the walkthrough itself stays human.
//
// The denominator is fixed at 51. Do not redefine it. Exit 0 = all PASS.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG = fileURLToPath(new URL('..', import.meta.url));
const CLI = join(PKG, 'src', 'cli.mjs');
const NODE = process.execPath;
const root = mkdtempSync(join(tmpdir(), 'specgate-claims-'));
const TOTAL = 51; // fixed denominator — never redefine

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
let seq = 0;
let passed = 0;
let failed = 0;

function run(args, cwd) {
  return spawnSync(NODE, [CLI, ...(args || [])], { encoding: 'utf8', cwd: cwd || root });
}
function sh(cmdLine, cwd) {
  // Cross-platform: shell:true resolves the platform shell (cmd.exe on win32,
  // /bin/sh elsewhere). The command lines used here (&& chains, double quotes)
  // are compatible with both.
  return spawnSync(cmdLine, { encoding: 'utf8', cwd: cwd || PKG, shell: true });
}
function read(rel) {
  return readFileSync(join(PKG, rel), 'utf8');
}
/** Case-insensitive literal count over a file scope. */
function countIn(literal, files) {
  const needle = literal.toLowerCase();
  let n = 0;
  for (const f of files) {
    const t = read(f).toLowerCase();
    let i = 0;
    while ((i = t.indexOf(needle, i)) !== -1) { n++; i += needle.length; }
  }
  return n;
}
function docCount(literal, files) { return countIn(literal, files || PRIMARY); }
function srcHas(literal) { return SRC_FILES.some((f) => read(f).toLowerCase().includes(literal.toLowerCase())); }
function eq(actual, expected, label) {
  return { ok: actual === expected, detail: label + ': expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual) };
}
function ge(actual, expected, label) {
  return { ok: actual >= expected, detail: label + ': expected >= ' + expected + ', got ' + actual };
}
function le(actual, expected, label) {
  return { ok: actual <= expected, detail: label + ': expected <= ' + expected + ', got ' + actual + ' (over budget — rerun on an idle machine before blaming the code)' };
}
function match(re, text, label) {
  return { ok: re.test(String(text)), detail: label + ': regex not matched — got ' + JSON.stringify(String(text).slice(0, 240)) };
}
function absent(re, text, label) {
  return { ok: !re.test(String(text)), detail: label + ': regex unexpectedly matched' };
}
function present(literal, files, label) {
  const n = countIn(literal, files);
  return { ok: n > 0, detail: label + ': ' + JSON.stringify(literal) + ' -> ' + n + ' hit(s) in [' + files.join(', ') + '] — expected >0' };
}
function gone(literal, files, label) {
  const n = countIn(literal, files);
  return { ok: n === 0, detail: label + ': ' + JSON.stringify(literal) + ' -> ' + n + ' hit(s) in [' + files.join(', ') + '] — expected 0' };
}
function first(...rs) { for (const r of rs) if (!r.ok) return r; return rs[rs.length - 1]; }
function claim(id, klass, note, fn) {
  seq++;
  let res;
  try { res = fn(); } catch (e) { res = { ok: false, detail: 'threw: ' + ((e && e.message) || String(e)) }; }
  if (res.ok) { passed++; console.log('[' + seq + '/' + TOTAL + '] PASS ' + id + ' (' + klass + ') — ' + note); }
  else { failed++; console.log('[' + seq + '/' + TOTAL + '] FAIL ' + id + ' (' + klass + ') — ' + note + (res.detail ? ' | ' + res.detail : '')); }
}

// ---------------------------------------------------------------------------
// scopes
// ---------------------------------------------------------------------------
// Product docs = what ships and what a reader trusts. The two plan tables under
// docs/plans/ are audit records — they QUOTE the old wording to justify its
// removal — so they are excluded from every grep gate, as is this repo's own
// AGENTS.md. Deleted-flag greps include CHANGELOG ("Removed" entries name them
// on purpose), so those gates use scopes that deliberately exclude CHANGELOG.
const PRIMARY = ['README.md', 'README.zh-CN.md', 'INSTALL.md', 'onboarding.md'];
const TEMPLATES = ['templates/AGENTS.template.md', 'templates/gate-doc.template.md', 'templates/gate-doc.example.md'];
const SKILLS = ['skills/rose-bootstrap/SKILL.md', 'skills/rose-handoff/SKILL.md'];
const NO_CHANGELOG = [...PRIMARY, ...TEMPLATES, ...SKILLS, 'SECURITY.md', 'CONTRIBUTING.md', 'THIRD_PARTY_NOTICES.md', '.github/ISSUE_TEMPLATE/bug.md', '.github/ISSUE_TEMPLATE/feature.md'];
const RELEASE_DOCS = [...NO_CHANGELOG, 'CHANGELOG.md'];
const SRC_FILES = ['src/cli.mjs', 'src/init.mjs', 'src/check.mjs', 'src/start.mjs', 'src/handoff.mjs', 'src/util.mjs'];

// ---------------------------------------------------------------------------
// fixtures
// ---------------------------------------------------------------------------
function gitRepo(name, seedFiles) {
  const t = join(root, name);
  mkdirSync(t, { recursive: true });
  sh('git init -q && git config user.name "GridName" && git config user.email grid@example.invalid', t);
  for (const [rel, text] of Object.entries(seedFiles || {})) {
    const abs = join(t, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, text);
  }
  sh('git add -A && git commit -q -m base', t);
  return t;
}
function freshInit(name, extraArgs) {
  const t = join(root, name);
  mkdirSync(t, { recursive: true });
  const r = run(['init', t, '--owner', 'me'].concat(extraArgs || []));
  if (r.status !== 0) throw new Error('fixture init failed: ' + (r.stderr || r.stdout).slice(0, 200));
  return { dir: t, init: r };
}
function agentsOf(dir) { return readFileSync(join(dir, 'AGENTS.md'), 'utf8'); }
function treeHash(dir) {
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) { if (e.name !== '.git') walk(p); }
      else out.push(p + ':' + createHash('sha256').update(readFileSync(p)).digest('hex'));
    }
  };
  walk(dir);
  return out.sort().join('\n');
}
function modifiedLines(repoDir) {
  const st = sh('git status --porcelain', repoDir).stdout || '';
  return st.split('\n').filter((l) => l.startsWith(' M')).length;
}
/** Structured npm pack --dry-run listing (JSON is stable across npm output styles). */
function packListing() {
  // Cross-platform npm invocation: prefer the npm-cli.js that runs us (npm_execpath),
  // else fall back to `npm` on PATH (shell needed on win32 where npm is npm.cmd).
  const cli = process.env.npm_execpath || null;
  const p = cli
    ? spawnSync(process.execPath, [cli, 'pack', '--dry-run', '--ignore-scripts', '--json'], { encoding: 'utf8', cwd: PKG, timeout: 180000 })
    : spawnSync('npm', ['pack', '--dry-run', '--ignore-scripts', '--json'], { encoding: 'utf8', cwd: PKG, timeout: 180000, shell: process.platform === 'win32' });
  if (p.status !== 0) return { status: p.status, paths: [], entry: null };
  const raw = String(p.stdout || '');
  const start = raw.indexOf('[');
  try {
    const j = JSON.parse(raw.slice(start));
    const entry = Array.isArray(j) ? j[0] : null;
    return { status: 0, paths: ((entry && entry.files) || []).map((f) => f.path), entry };
  } catch {
    return { status: p.status, paths: [], entry: null };
  }
}

// ===========================================================================
// C — 命令类 (12)
// ===========================================================================

claim('C-01', 'IMPL', '--version prints exactly one version line in the documented prefixed format, exit 0', () => {
  const r = run(['--version']);
  return first(
    eq(r.status, 0, 'exit --version'),
    eq((String(r.stdout).match(/\n/g) || []).length, 1, 'exactly one line'),
    match(/^specgate \d+\.\d+\.\d+$/m, r.stdout, 'format matches INSTALL.md Step 3 example'),
    eq(r.stdout, run(['-v']).stdout, '-v equals --version'),
    eq(r.stdout, run(['version']).stdout, 'version equals --version'),
  );
});

claim('C-02', 'IMPL', 'start single entry: three questions + one exact next command, exit 0', () => {
  const g = gitRepo('c02-git');
  const r = run(['start', g]);
  return first(
    eq(r.status, 0, 'exit start in a git repo'),
    match(/^Q1 repository state/m, r.stdout, 'Q1 printed'),
    match(/^Q2 decision mode/m, r.stdout, 'Q2 printed'),
    match(/^Q3 this run/m, r.stdout, 'Q3 printed'),
    eq((String(r.stdout).match(/^Next:  \S/m) || []).length, 1, 'exactly one Next: command'),
    match(/^Precheck:/m, r.stdout, 'precheck block printed'),
  );
});

claim('C-03', 'IMPL', 'check prints PASS/WARN/FAIL: default WARN exit 0, --strict FAIL exit 1, usage error exit 2', () => {
  const t = join(root, 'c03-s1');
  mkdirSync(t);
  writeFileSync(join(t, 'AGENTS.md'), '# P\n\n<!-- stage: S1 -->\n');
  const w = run(['check', t]);
  const s = run(['check', t, '--strict']);
  const u = run(['check', join(root, 'c03-no-such-dir')]);
  const pr = run(['check', freshInit('c03-pass').dir]);
  return first(
    eq(w.status, 0, 'default exit (WARN)'),
    match(/^WARN c03-s1 \(stage S1\) — \d+ finding\(s\)/m, w.stdout, 'WARN header + finding count'),
    eq(s.status, 1, '--strict exit'),
    match(/^FAIL c03-s1 \(stage S1\)/m, s.stdout, 'FAIL header under --strict'),
    eq(u.status, 2, 'usage-error exit'),
    eq(pr.status, 0, 'PASS exit'),
    match(/^PASS c03-pass \(stage S0\)$/, String(pr.stdout).trim(), 'PASS header'),
  );
});

claim('C-04', 'DEMOTE', 'documented PASS literal aligned to the real format; the old bare "(stage S0)" literal is gone from the docs', () => {
  const p = freshInit('c04');
  const r = run(['check', p.dir]);
  return first(
    match(/^PASS c04 \(stage S0\)$/, String(r.stdout).trim(), 'actual output == documented shape'),
    present('PASS <name> (stage S0)', PRIMARY, 'demoted literal in place'),
    gone('PASS (stage S0)', PRIMARY, 'old bracket-only literal removed from docs'),
  );
});

claim('C-05', 'IMPL', 'init detects a .windsurf/ directory and offers the Windsurf pointer ask-first', () => {
  const t = join(root, 'c05-windsurf');
  mkdirSync(join(t, '.windsurf', 'rules'), { recursive: true });
  const r = run(['init', t, '--owner', 'me']);
  return first(
    eq(r.status, 0, 'exit init'),
    match(/\? \.windsurf\/rules\/agents\.md\s+\(detected \.windsurf\/\)/, r.stdout, 'windsurf suggestion line'),
    eq(existsSync(join(t, '.windsurf', 'rules', 'agents.md')), false, 'nothing written without --yes'),
  );
});

claim('C-06', 'IMPL', 'init --adopt is add-only: AGENTS.md listed untouched, zero modified lines, diff hint printed', () => {
  const t = gitRepo('c06-adopt', { 'AGENTS.md': '# Mine\n\n<!-- stage: S1 -->\n' });
  const before = agentsOf(t);
  const r = run(['init', t, '--adopt', '--owner', 'me']);
  return first(
    eq(r.status, 0, 'exit adopt'),
    match(/AGENTS\.md\s+—\s+exists, untouched/, r.stdout, 'untouched list names AGENTS.md'),
    eq(modifiedLines(t), 0, 'git modified-file lines'),
    eq(agentsOf(t), before, 'AGENTS.md bytes unchanged'),
    match(/diff "/, r.stdout, 'prints the diff command hint'),
  );
});

claim('C-07', 'DELETE', 'init --fill deleted for v0.1: still exits 2 and "--fill" has 0 hits across all product docs', () => {
  const r = run(['init', '--fill']);
  return first(
    eq(r.status, 2, 'exit init --fill'),
    gone('--fill', NO_CHANGELOG, '--fill wording removed everywhere it would be a live promise'),
    gone('run specgate init --fill', PRIMARY, 'empty-state hint rewritten to live commands'),
  );
});

claim('C-08', 'DELETE', 'check --conflicts deleted for v0.2: still exits 2 and "--conflicts" has 0 hits across all product docs', () => {
  const r = run(['check', '--conflicts']);
  return first(
    eq(r.status, 2, 'exit check --conflicts'),
    gone('--conflicts', NO_CHANGELOG, '--conflicts wording removed everywhere'),
  );
});

claim('C-09', 'IMPL', 'handoff prints the write/read routing and points at rose-handoff, exit 0', () => {
  const r = run(['handoff']);
  return first(
    eq(r.status, 0, 'exit handoff'),
    present('rose-handoff', ['src/handoff.mjs'], 'routes to the skill'),
    match(/Writing a handoff/, r.stdout, 'write branch routed'),
    match(/Reading a handoff/, r.stdout, 'read branch routed'),
  );
});

claim('C-10', 'DELETE', 'profile/adr/spec/design/board/migrate deleted for v0.2: none returns 0, and no README advertises them', () => {
  const codes = {};
  for (const c of ['profile', 'adr', 'spec', 'design', 'board', 'migrate']) codes[c] = run([c]).status;
  const wrong = Object.entries(codes).filter(([, v]) => v !== 2).map(([k, v]) => k + '=' + v);
  return first(
    eq(wrong.length, 0, 'all six deleted commands exit 2 (' + wrong.join(',') + ')'),
    gone('profile full', PRIMARY, 'profile full wording removed'),
    absent(/specgate (profile|adr|spec|design|board|migrate)\b/, read('README.md') + read('README.zh-CN.md'), 'no deleted command advertised in the READMEs'),
  );
});

claim('C-11', 'IMPL', 'publish-ready: private flag gone, bin wired, npm pack ships the documented surface (registry availability stays a release-time manual step)', () => {
  const pkg = JSON.parse(read('package.json'));
  const pack = packListing();
  const has = (rel) => pack.paths.includes(rel);
  return first(
    eq(pkg.private, undefined, 'private flag removed from package.json'),
    eq(pkg.bin && pkg.bin.specgate, 'dist/cli.mjs', 'bin.specgate -> dist/cli.mjs'),
    eq(pack.status, 0, 'npm pack --dry-run exit'),
    eq(has('CHANGELOG.md'), true, 'changelog packed'),
    eq(has('THIRD_PARTY_NOTICES.md'), true, 'notices packed'),
    eq(has('LICENSES/CC0-1.0.txt'), true, 'CC0 license text packed'),
    eq(has('README.zh-CN.md'), true, 'zh README packed'),
    eq(has('INSTALL.md'), true, 'install guide packed'),
    eq(has('dist/cli.mjs'), true, 'bin target packed'),
  );
});

claim('C-12', 'IMPL', 'gate template carries the NC-OPEN demo rows so the dispatch grep works (grep -c NC-OPEN == 5)', () => {
  const n = (read('templates/gate-doc.template.md').match(/NC-OPEN/g) || []).length;
  return eq(n, 5, 'NC-OPEN occurrences in templates/gate-doc.template.md');
});

// ===========================================================================
// A — 断言类 (17)
// ===========================================================================

claim('A-01', 'IMPL', 'assertion 1 — stage marker vs installed docs: S1 missing board fails --strict naming the finding', () => {
  const t = join(root, 'a01');
  mkdirSync(join(t, 'docs', 'plans'), { recursive: true });
  mkdirSync(join(t, 'docs', 'adr'), { recursive: true });
  writeFileSync(join(t, 'docs', 'adr', 'README.md'), '# idx\n');
  mkdirSync(join(t, 'docs', 'architecture'), { recursive: true });
  writeFileSync(join(t, 'docs', 'architecture', 'current.md'), '# cur\n');
  writeFileSync(join(t, 'AGENTS.md'), '# P\n\n<!-- stage: S1 -->\n');
  const r = run(['check', t, '--strict']);
  return first(
    eq(r.status, 1, 'strict exit'),
    match(/Task board missing \(stage S1\)/, r.stdout, 'finding title'),
  );
});

claim('A-02', 'IMPL', 'assertion 2 — kickoff: NC-OPEN cards fail --strict, name card count + kickoff, shipped copies excluded', () => {
  const t = join(root, 'a02');
  mkdirSync(join(t, 'docs', 'plans'), { recursive: true });
  writeFileSync(join(t, 'AGENTS.md'), '# P\n\n<!-- stage: S0 -->\n');
  writeFileSync(join(t, 'docs', 'plans', 'gate-x_v1.md'), '# Gate\n\n| NC-1 | a? | a | NC-OPEN |\n| NC-2 | b? | a | NC-OPEN |\n');
  const w = run(['check', t]);
  const s = run(['check', t, '--strict']);
  const copy = join(root, 'a02-copy');
  mkdirSync(join(copy, 'docs', 'plans'), { recursive: true });
  writeFileSync(join(copy, 'AGENTS.md'), '# P\n\n<!-- stage: S0 -->\n');
  mkdirSync(join(copy, 'docs', 'adr'), { recursive: true });
  writeFileSync(join(copy, 'docs', 'adr', 'README.md'), 'x');
  writeFileSync(join(copy, 'docs', 'plans', 'gate-doc.template.md'), read('templates/gate-doc.template.md'));
  const c = run(['check', copy]);
  return first(
    eq(w.status, 0, 'default WARN exit'),
    eq(s.status, 1, 'strict exit'),
    match(/2 NC-OPEN decision cards .*kickoff/, s.stdout, 'finding names card count + kickoff'),
    match(/^PASS a02-copy \(stage S0\)$/, String(c.stdout).trim(), 'shipped template copy excluded'),
    eq(srcHas('NC-OPEN'), true, 'check consumes NC-OPEN'),
  );
});

claim('A-03', 'MANUAL', 'EARS/vague-word machine check NOT shipped in v0.1: no half-wired checker in src; onboarding sample 4 sits under the v0.2 target-style banner', () => {
  const t = join(root, 'a03');
  mkdirSync(join(t, 'docs', 'plans'), { recursive: true });
  mkdirSync(join(t, 'docs', 'adr'), { recursive: true });
  writeFileSync(join(t, 'docs', 'adr', 'README.md'), 'x');
  writeFileSync(join(t, 'AGENTS.md'), '# P\n\n<!-- stage: S0 -->\n');
  writeFileSync(join(t, 'docs', 'plans', 'gate-search_v1.md'), 'AC-1: The search must be reasonably fast.\n');
  const r = run(['check', t, '--strict']);
  return first(
    eq(r.status, 0, 'vague AC alone is not failed (machine check deferred to v0.2)'),
    eq(srcHas('reasonably') || srcHas('vague'), false, 'no vague-word checker lurking in src/'),
    match(/规范（v0\.2 目标样式）[\s\S]*样例 4 · 验收判据不合 EARS 句式/, read('onboarding.md'), 'sample 4 under the v0.2 target-style banner'),
  );
});

claim('A-04', 'DELETE', 'ADR three-hook machine check deleted for v0.2: READMEs say mechanical only in v0.2; check.mjs has no hook logic', () => {
  return first(
    present('The check enforces these hooks mechanically in v0.2', ['README.md'], 'en deferral sentence'),
    present('这些挂钩的机判校验由 check 在 v0.2 提供', ['README.zh-CN.md'], 'zh deferral sentence'),
    present('(machine-checked in v0.2)', ['README.md'], 'en section heading tagged'),
    present('（机判校验 v0.2 提供）', ['README.zh-CN.md'], 'zh section heading tagged'),
    eq(/ADR-|no-adr|adr-exempt/.test(readFileSync(join(PKG, 'src', 'check.mjs'), 'utf8')) ? 1 : 0, 0, 'no ADR-hook checker in check.mjs'),
  );
});

claim('A-05', 'DEMOTE', 'board health → task board installed: old wording 0 hits in the primary docs, new wording in place, HELP agrees', () => {
  return first(
    gone('board health', PRIMARY, 'old board-health claim removed from README/onboarding/INSTALL'),
    present('task board installed', ['README.md'], 'en demoted wording'),
    present('任务看板已安装', ['README.zh-CN.md'], 'zh demoted wording'),
    match(/task board/i, run(['check', '--help']).stdout, 'check HELP speaks of the task board'),
  );
});

claim('A-06', 'DEMOTE', 'findings print at once in check-item order: S3 fixture yields 5 findings in one run; wording says check-item, not file:line', () => {
  const t = join(root, 'a06-s3');
  mkdirSync(t);
  writeFileSync(join(t, 'AGENTS.md'), '# P\n\n<!-- stage: S3 -->\n');
  const r = run(['check', t]);
  const n = (String(r.stdout).match(/^\[\d+\/\d+\]/gm) || []).length;
  return first(
    ge(n, 4, 'findings listed in one run'),
    eq(n, 5, 'S3 with no docs yields exactly the five rules'),
    present('in check-item order', ['README.md'], 'en demoted wording'),
    present('按检查项顺序排列', ['README.zh-CN.md', 'onboarding.md'], 'zh demoted wording'),
    gone('按文件行序', PRIMARY, 'old file-line-order claim removed'),
  );
});

claim('A-07', 'DEMOTE', 'three-part errors: README describes the implemented where/expected/fix; Wrong/Correct + "No files were changed." labeled v0.2 target design', () => {
  const t = join(root, 'a07');
  mkdirSync(t);
  writeFileSync(join(t, 'AGENTS.md'), '# P\n\n<!-- stage: S1 -->\n');
  const r = run(['check', t]);
  return first(
    match(/where    :/, r.stdout, 'where segment printed'),
    match(/expected :/, r.stdout, 'expected segment printed'),
    match(/fix      :/, r.stdout, 'fix segment printed'),
    present('where / expected / fix', ['README.md', 'README.zh-CN.md'], 'README wording aligned to implementation'),
    match(/规范（v0\.2 目标样式）/, read('onboarding.md'), 'samples banner marked v0.2 target'),
    match(/v0\.1 实际行为/, read('onboarding.md'), 'actual-behaviour paragraph present'),
  );
});

claim('A-08', 'DELETE', 'pointer existence verification deleted for v0.2: READMEs say it arrives in v0.2 and check emits no pointer finding', () => {
  const t = join(root, 'a08-cursor-dir');
  mkdirSync(join(t, '.cursor', 'rules'), { recursive: true });
  writeFileSync(join(t, 'AGENTS.md'), '# P\n\n<!-- stage: S0 -->\n');
  const r = run(['check', t]);
  return first(
    present('arrives in v0.2', ['README.md'], 'en deferral'),
    present('校验 v0.2 提供', ['README.zh-CN.md'], 'zh deferral'),
    absent(/pointer/i, r.stdout, 'no pointer finding in check output'),
    eq(/pointer|cursor|copilot|windsurf/i.test(readFileSync(join(PKG, 'src', 'check.mjs'), 'utf8')) ? 1 : 0, 0, 'no pointer logic in check.mjs'),
  );
});

claim('A-09', 'IMPL', 'template_version stale assertion: behind → WARN naming both versions, FAIL --strict; ahead → no nagging', () => {
  const { dir: t } = freshInit('a09');
  const clean = run(['check', t]);
  writeFileSync(join(t, 'AGENTS.md'), agentsOf(t).replace('<!-- template_version: 1 -->', '<!-- template_version: 0 -->'));
  const w = run(['check', t]);
  const s = run(['check', t, '--strict']);
  writeFileSync(join(t, 'AGENTS.md'), agentsOf(t).replace('<!-- template_version: 0 -->', '<!-- template_version: 9 -->'));
  const ahead = run(['check', t]);
  return first(
    match(/^PASS a09 \(stage S0\)$/m, clean.stdout, 'fresh init not flagged'),
    eq(w.status, 0, 'behind → WARN exit 0'),
    match(/template_version stale .*\(0 < 1\)/, w.stdout, 'finding names both versions'),
    eq(s.status, 1, 'behind → FAIL under --strict'),
    match(/^PASS a09 \(stage S0\)$/m, ahead.stdout, 'ahead of shipped → not stale'),
  );
});

claim('A-10', 'IMPL', 'check prints PASS/WARN/FAIL and writes nothing: whole-tree sha256 identical before and after', () => {
  const { dir: t } = freshInit('a10');
  const before = treeHash(t);
  run(['check', t]);
  run(['check', t, '--strict']);
  return eq(treeHash(t), before, 'tree hash unchanged');
});

claim('A-11', 'IMPL', 'fully offline: no network APIs in src/, zero runtime deps, init+check succeed with a stripped environment', () => {
  const netRe = /\bfetch\s*\(|https?:\/\/|net\.connect|createConnection|\bdns\b|XMLHttpRequest|WebSocket/;
  const offenders = SRC_FILES.filter((f) => netRe.test(read(f)));
  const pkg = JSON.parse(read('package.json'));
  const t = join(root, 'a11-offline');
  mkdirSync(t);
  const env = { PATH: '/usr/local/bin:/usr/bin:/bin', HOME: root };
  const i = spawnSync(NODE, [CLI, 'init', t, '--owner', 'me'], { encoding: 'utf8', cwd: t, env });
  const c = spawnSync(NODE, [CLI, 'check', t], { encoding: 'utf8', cwd: t, env });
  return first(
    eq(offenders.length, 0, 'src files with network-call patterns (' + offenders.join(',') + ')'),
    eq(Object.keys(pkg.dependencies || {}).length, 0, 'runtime dependencies'),
    eq(i.status, 0, 'init exit with stripped env'),
    eq(c.status, 0, 'check exit with stripped env'),
  );
});

claim('A-12', 'IMPL', 'init never modifies existing files: adopt leaves every pre-existing file byte-identical', () => {
  const t = gitRepo('a12', {
    'AGENTS.md': '# Mine\n\n<!-- stage: S1 -->\n',
    'docs/BACKLOG.md': '# My board\n',
    'docs/decisions/0001-db.md': '# ADR-0001: use a db\n',
  });
  const before = {
    agents: agentsOf(t),
    board: readFileSync(join(t, 'docs', 'BACKLOG.md'), 'utf8'),
    adr: readFileSync(join(t, 'docs', 'decisions', '0001-db.md'), 'utf8'),
  };
  const r = run(['init', t, '--adopt', '--owner', 'me']);
  return first(
    eq(r.status, 0, 'exit adopt'),
    eq(modifiedLines(t), 0, 'git modified lines'),
    eq(agentsOf(t), before.agents, 'AGENTS.md bytes intact'),
    eq(readFileSync(join(t, 'docs', 'BACKLOG.md'), 'utf8'), before.board, 'own board bytes intact'),
    eq(readFileSync(join(t, 'docs', 'decisions', '0001-db.md'), 'utf8'), before.adr, 'own ADR dir bytes intact'),
  );
});

claim('A-13', 'IMPL', 'uninstall story: manifest lists exactly the files init created, each with sha256 and posix keys (count never hardcoded in the docs)', () => {
  const { dir: t } = freshInit('a13');
  const m = JSON.parse(readFileSync(join(t, '.specgate-manifest.json'), 'utf8'));
  const keys = Object.keys(m.files);
  // Everything on disk except the manifest itself must be listed — no hidden state.
  const onDisk = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else onDisk.push(p.slice(t.length + 1).split(sep).join('/'));
    }
  };
  walk(t);
  const untracked = onDisk.filter((p) => p !== '.specgate-manifest.json' && !keys.includes(p));
  return first(
    eq(untracked.length, 0, 'created files missing from the manifest (' + untracked.join(',') + ')'),
    ge(keys.length, 3, 'manifest lists the S0 kit'),
    eq(keys.every((k) => /^[0-9a-f]{64}$/.test(m.files[k].sha256 || '')), true, 'sha256 recorded for every listed file'),
    eq(keys.every((k) => !k.includes('\\') && !k.startsWith('/')), true, 'keys are relative posix paths'),
    eq(docCount('3 files', PRIMARY), 0, 'no hardcoded file count in the docs'),
  );
});

claim('A-14', 'IMPL', 'ask-first in the CLI: plan printed before any write, suggested pointers NOT written without --yes, written with --yes', () => {
  const t = join(root, 'a14');
  mkdirSync(join(t, '.cursor'), { recursive: true });
  const r = run(['init', t, '--owner', 'me']);
  const plannedFirst = r.stdout.includes('Files to write') && r.stdout.indexOf('Files to write') < r.stdout.indexOf('Done:');
  return first(
    eq(plannedFirst, true, 'plan printed before completion line'),
    match(/Suggested agent pointer files \(ask-first — NOT written/, r.stdout, 'pointer block marked NOT written'),
    match(/\? \.cursor\/rules\/agents\.mdc\s+\(detected \.cursor\/\)/, r.stdout, 'cursor pointer suggested'),
    eq(existsSync(join(t, '.cursor', 'rules', 'agents.mdc')), false, 'pointer absent without --yes'),
    eq(run(['init', t, '--owner', 'me', '--yes']).status, 0, 'exit --yes run'),
    eq(existsSync(join(t, '.cursor', 'rules', 'agents.mdc')), true, 'pointer written with --yes'),
  );
});

claim('A-15', 'IMPL', 'start precheck runs five read-only probes; a non-git directory gets the precondition sample and exit != 0', () => {
  const ng = join(root, 'a15-nogit');
  mkdirSync(ng);
  const bad = run(['start', ng]);
  const good = run(['start', gitRepo('a15-git')]);
  const items = ['git repository', 'AGENTS.md', 'docs structure', 'agent tools', 'repository content'];
  return first(
    eq(bad.status, 1, 'non-git exit != 0'),
    match(/Not a git repository\. Rollback needs version control\./, bad.stdout, 'error sample 1 wording'),
    eq(items.every((k) => String(good.stdout).includes(k)), true, 'five precheck items printed'),
  );
});

claim('A-16', 'IMPL', 'start prints the fixed three-line Route:/Next:/After: block', () => {
  const r = run(['start', gitRepo('a16-git')]);
  return first(
    eq((String(r.stdout).match(/^(Route:|Next:  |After:)/gm) || []).length, 3, 'route block lines'),
    eq(r.status, 0, 'exit start'),
  );
});

claim('A-17', 'DELETE', 'three empty-state microcopy lines deleted for v0.2 (section labeled design target); the CLI does not fake-print them', () => {
  const t = join(root, 'a17-empty');
  mkdirSync(t);
  const r = run(['check', t]);
  return first(
    present('本节为设计稿目标，v0.1 不交付', ['onboarding.md'], 'section 3 labeled v0.2 design target'),
    absent(/No governance files yet/, r.stdout, 'microcopy not emitted by check'),
    absent(/rule conflicts found/, r.stdout, 'conflict microcopy not emitted by check'),
    eq(srcHas('No governance files yet'), false, 'microcopy not hardwired into src'),
  );
});

// ===========================================================================
// N — 数字类 (10)
// ===========================================================================

claim('N-01', 'IMPL', 'first verification inside 30 seconds: --version measured (best of 3) plus a start routing, combined under budget', () => {
  let best = Infinity;
  for (let k = 0; k < 3; k++) {
    const s = Date.now();
    const r = run(['--version']);
    if (r.status !== 0) return eq(r.status, 0, '--version exit');
    best = Math.min(best, Date.now() - s);
  }
  const s2 = Date.now();
  const st = run(['start', gitRepo('n01-git')]);
  const startMs = Date.now() - s2;
  return first(
    le(best, 3000, '--version ms (best of 3)'),
    eq(st.status, 0, 'start exit'),
    le(best + startMs, 30000, '--version + start combined ms'),
  );
});

claim('N-02', 'DEMOTE', '10-minute bootstrap qualified as mostly conversation time in en + zh', () => {
  return first(
    present('mostly conversation time', ['README.md', 'INSTALL.md'], 'en qualifier in place'),
    present('大部分是对话时间', ['README.zh-CN.md', 'onboarding.md'], 'zh qualifier in place'),
    present('about 10 minutes', ['README.md'], 'time kept alongside the qualifier'),
  );
});

claim('N-03', 'DEMOTE', 'cold init under a second: demoted wording in place, old <=3s wording gone, measured init < 1000ms (best of 3)', () => {
  let best = Infinity;
  for (let k = 0; k < 3; k++) {
    const t = join(root, 'n03-' + k);
    mkdirSync(t);
    const s = Date.now();
    const r = run(['init', t, '--owner', 'me']);
    if (r.status !== 0) return eq(r.status, 0, 'init exit');
    best = Math.min(best, Date.now() - s);
  }
  return first(
    present('well under a second', ['README.md', 'README.zh-CN.md', 'onboarding.md'], 'demoted wording'),
    gone('<=3s', PRIMARY, 'old ascii <=3s wording removed'),
    gone('≤3s', PRIMARY, 'old unicode <=3s wording removed'),
    gone('约 3 秒', PRIMARY, 'old "about 3 seconds" wording removed'),
    le(best, 1000, 'init ms (best of 3)'),
  );
});

claim('N-04', 'DEMOTE', 'five-minute handoff cost marked estimated in en + zh', () => {
  return first(
    present('an estimated five minutes', ['README.md'], 'en estimated marker'),
    present('估算约五分钟', ['README.zh-CN.md'], 'zh estimated marker'),
  );
});

claim('N-05', 'DEMOTE', 'endorsement softened: proven / 已验证 gone from the primary docs, shaped-by-two-months wording in place', () => {
  return first(
    present('shaped by two months of daily use', ['README.md'], 'new endorsement'),
    present('这套流程源自真实项目两个月的每日使用', ['README.zh-CN.md'], 'zh new endorsement'),
    gone('proven', PRIMARY, 'old "proven" endorsement removed from README/INSTALL/onboarding'),
    gone('已验证', PRIMARY, 'old 已验证 endorsement removed from the primary docs'),
  );
});

claim('N-06', 'DEMOTE', 'support matrix scoped to documentation: verified against documentation at release time in place, unqualified variant gone from primary docs', () => {
  return first(
    present('verified against documentation at release time', ['README.md'], 'en scoped wording'),
    present('对照各家官方文档核验', ['README.zh-CN.md'], 'zh scoped wording'),
    gone('verified at release time', PRIMARY, 'unqualified variant removed from README/INSTALL/onboarding'),
  );
});

claim('N-07', 'IMPL', 'smoke suite green and reproducible: node test/smoke.mjs exits 0 with N passed / 0 failed; no hardcoded count in the docs', () => {
  const s = spawnSync(NODE, [join(PKG, 'test/smoke.mjs')], { encoding: 'utf8', cwd: PKG, timeout: 600000 });
  const tail = String(s.stdout || '').trim().split('\n').pop() || '';
  const m = tail.match(/^(\d+) passed, (\d+) failed/);
  return first(
    eq(s.status, 0, 'smoke exit'),
    eq(m !== null && Number(m[2]) === 0, true, 'zero failures — tail "' + tail + '"'),
    eq(docCount('49 passed', PRIMARY), 0, 'no hardcoded smoke count in the docs'),
  );
});

claim('N-08', 'DEMOTE', 'template budgets stay document-level in v0.1: At most limits present (>=3), enforcement tagged v0.2', () => {
  const n = (read('templates/gate-doc.template.md').match(/At most/g) || []).length;
  return first(
    ge(n, 3, 'At most occurrences in the gate template'),
    present('(machine-checked in v0.2)', ['README.md'], 'en enforcement deferred'),
    present('（机判校验 v0.2 提供）', ['README.zh-CN.md'], 'zh enforcement deferred'),
  );
});

claim('N-09', 'MANUAL', 'D3 five-minute demo is illustrative template content (human walkthrough item; static presence asserted here only)', () => {
  return present('about five minutes', ['templates/gate-doc.template.md'], 'demo budget kept as template guidance');
});

claim('N-10', 'DELETE', 'third-party backlog.md pins carry verify-before-adopting discipline; availability itself is a network/manual check', () => {
  return first(
    present('Verify it is reachable from your environment before adopting it.', ['templates/AGENTS.template.md'], 'availability caveat present'),
    present('open-source npm tool', ['templates/AGENTS.template.md'], 'third-party framing present'),
    present('Ask {{OWNER}} before running any command in this appendix', ['templates/AGENTS.template.md'], 'appendix B gated by ask-first'),
  );
});

// ===========================================================================
// F — 字段/行为类 (12)
// ===========================================================================

claim('F-01', 'IMPL', 'template_version header shipped in all three templates and consumed by check (warn-only upgrade semantics)', () => {
  const hits = TEMPLATES.filter((f) => /^<!-- template_version: \d+ -->/.test(read(f).split('\n')[0]));
  return first(
    eq(hits.length, 3, 'templates carrying the header on line 1'),
    eq(srcHas('template_version'), true, 'src consumes template_version'),
    present('upgrades warn only — specgate never edits your file', ['src/check.mjs'], 'warn-only semantics in the stale fix text'),
  );
});

claim('F-02', 'MANUAL', 'Status/phase legal values defined once in the template and echoed by the example; phase machine check deferred (semantic walkthrough stays human)', () => {
  const tpl = read('templates/gate-doc.template.md');
  const ex = read('templates/gate-doc.example.md');
  return first(
    match(/Allowed `Status` values, defined only here: `draft` → `converged` → `archived`/, tpl, 'Status allowed values defined in the template'),
    match(/Allowed `phase` values, defined only here: `sizing` → `drafting` → `ready` → `converging`/, tpl, 'phase allowed values defined in the template'),
    match(/allowed values, defined only in the template: draft \| converged \| archived/, ex, 'example echoes the Status source of truth'),
    match(/allowed values, defined only in the template: sizing \| drafting \| ready \| converging/, ex, 'example echoes the phase source of truth'),
    eq(srcHas('converging'), false, 'no half-wired phase checker in src'),
  );
});

claim('F-03', 'IMPL', 'decision-card three states defined in the template; the NC-OPEN machine assertion is live (see A-02)', () => {
  const tpl = read('templates/gate-doc.template.md');
  return first(
    eq(/NC-OPEN/.test(tpl) && /NC-RESOLVED/.test(tpl) && /NC-N\/A/.test(tpl), true, 'three states coexist in the template'),
    present('NC-RESOLVED', ['templates/gate-doc.template.md'], 'resolved state defined'),
    eq(srcHas('NC-OPEN'), true, 'NC-OPEN consumed by check'),
  );
});

claim('F-04', 'DELETE', 'ADR numbering/index rules stay as process constraints; the machine hooks are deleted for v0.2 (generated index header verified, no hook checker)', () => {
  const { dir: t } = freshInit('f04');
  const idx = readFileSync(join(t, 'docs', 'adr', 'README.md'), 'utf8');
  return first(
    eq(idx.includes('| ADR | Decision | Status |'), true, 'generated ADR index carries the table header'),
    present('The check enforces these hooks mechanically in v0.2', ['README.md'], 'hook machine check deferred in en'),
    eq(/no-adr|adr-exempt/.test(readFileSync(join(PKG, 'src', 'check.mjs'), 'utf8')) ? 1 : 0, 0, 'no mechanical hook checker in check.mjs'),
  );
});

claim('F-05', 'IMPL', 'manifest records created files with sha256 + bytes and the uninstall hint points at it', () => {
  const { dir: t } = freshInit('f05');
  const m = JSON.parse(readFileSync(join(t, '.specgate-manifest.json'), 'utf8'));
  const e = m.files['AGENTS.md'];
  const buf = readFileSync(join(t, 'AGENTS.md'));
  const hint = run(['init', t, '--owner', 'me']).stdout;
  return first(
    eq(e.sha256, createHash('sha256').update(buf).digest('hex'), 'recorded sha256 equals the file digest'),
    eq(e.bytes, buf.length, 'recorded bytes equal the file size'),
    match(/^Uninstall: delete the files listed in \.specgate-manifest\.json/m, hint, 'uninstall hint printed by init'),
  );
});

claim('F-06', 'IMPL', 'OWNER resolution chain: explicit --owner wins and is shown as the source; otherwise git config user.name is used and displayed', () => {
  const g = gitRepo('f06-git');
  const r = run(['init', g]);
  const t2 = join(root, 'f06-flag');
  mkdirSync(t2);
  const r2 = run(['init', t2, '--owner', 'FlagOwner']);
  return first(
    eq(r.status, 0, 'exit init (no flag)'),
    match(/owner "GridName" \(git config user\.name\)/, r.stdout, 'git-config source displayed'),
    eq(agentsOf(g).includes('GridName'), true, 'owner substituted into AGENTS.md'),
    match(/owner "FlagOwner" \(--owner\)/, r2.stdout, 'flag wins and is displayed as the source'),
  );
});

claim('F-07', 'IMPL', 'stage marker is the single source; an invalid value is named in a finding', () => {
  const t = join(root, 'f07-invalid');
  mkdirSync(t);
  writeFileSync(join(t, 'AGENTS.md'), '# P\n\n<!-- stage: S9 -->\n');
  const r = run(['check', t]);
  const ok = run(['check', freshInit('f07-ok').dir]);
  return first(
    match(/invalid stage value "S9"/, r.stdout, 'invalid value named'),
    eq(ok.status, 0, 'valid marker passes'),
  );
});

claim('F-08', 'IMPL', 'SKIP states exempt / frozen / merged:PNN exit 0 with a SKIP line; HELP documents the allowed set', () => {
  const mk = (name, marker) => {
    const t = join(root, name);
    mkdirSync(t);
    writeFileSync(join(t, 'AGENTS.md'), '# P\n\n<!-- stage: ' + marker + ' -->\n');
    return run(['check', t]);
  };
  const a = mk('f08-exempt', 'exempt');
  const b = mk('f08-frozen', 'frozen');
  const c = mk('f08-merged', 'merged:P12');
  const help = run(['check', '--help']).stdout.replace(/\r?\n\s+/g, ' ');
  return first(
    eq(a.status, 0, 'exempt exit'),
    match(/^SKIP f08-exempt \(stage exempt\)$/, String(a.stdout).trim(), 'exempt SKIP line'),
    eq(b.status, 0, 'frozen exit'),
    match(/^SKIP f08-frozen \(stage frozen\)$/, String(b.stdout).trim(), 'frozen SKIP line'),
    eq(c.status, 0, 'merged:PNN exit'),
    match(/SKIP f08-merged \(stage merged:P12\)/, c.stdout, 'merged SKIP line'),
    match(/Allowed: S0 \| S1 \| S2 \| S3 \| exempt \| frozen \| merged:PNN/, help, 'HELP lists the exemption states'),
  );
});

claim('F-09', 'IMPL', 'the kit grows by stage: init --stage S1 installs the task board and the architecture doc', () => {
  const t = join(root, 'f09-s1');
  mkdirSync(t);
  const r = run(['init', t, '--stage', 'S1', '--owner', 'me']);
  return first(
    eq(r.status, 0, 'exit init S1'),
    eq(existsSync(join(t, 'AGENTS.md')), true, 'AGENTS.md created'),
    eq(existsSync(join(t, 'docs', 'BACKLOG.md')), true, 'task board installed'),
    eq(existsSync(join(t, 'docs', 'architecture', 'current.md')), true, 'architecture current state installed'),
  );
});

claim('F-10', 'IMPL', 'known limitations disclosed truthfully: single writer / no cross-machine lock / no team panel / advisory check — each consistent with behavior', () => {
  const t = join(root, 'f10-limit');
  mkdirSync(t);
  writeFileSync(join(t, 'AGENTS.md'), '# P\n\n<!-- stage: S1 -->\n');
  const before = treeHash(t);
  run(['check', t]);
  return first(
    present('One writer at a time', ['README.md'], 'single-writer limitation stated'),
    present('no cross-machine lock', ['README.md'], 'lock gap stated'),
    present('No team panel in v1', ['README.md'], 'no dashboard stated'),
    present('The check is advisory until you wire it', ['README.md'], 'advisory nature stated'),
    eq(treeHash(t), before, 'check really writes nothing (limitation #3 holds)'),
  );
});

claim('F-11', 'IMPL', 'install != bootstrapped: the packed tarball ships no AGENTS.md and no docs/ tree — those arrive only when init runs', () => {
  const pack = packListing();
  return first(
    eq(pack.status, 0, 'npm pack --dry-run exit'),
    ge(pack.paths.length, 20, 'pack listing parsed (' + pack.paths.length + ' entries)'),
    eq(pack.paths.some((l) => /(^|\/)AGENTS\.md$/.test(l)), false, 'no AGENTS.md in the package'),
    eq(pack.paths.some((l) => /^docs\//.test(l)), false, 'no docs/ tree in the package'),
    present('Install-verified is not bootstrapped', ['INSTALL.md'], 'wording present'),
  );
});

claim('F-12', 'IMPL', 'every command advertised in the READMEs runs with the documented exit behavior (the ask-first promise rests on this)', () => {
  mkdirSync(join(root, 'f12-init-target'), { recursive: true });
  const invocations = [
    { args: ['--version'], want: 0 },
    { args: ['start'], want: 0, dir: gitRepo('f12-git') },
    { args: ['check'], want: 0, dir: freshInit('f12-check').dir },
    { args: ['init'], want: 0, dir: join(root, 'f12-init-target') },
    { args: ['handoff'], want: 0 },
  ];
  for (const v of invocations) {
    const r = run(v.args, v.dir);
    if (r.status !== v.want) return eq(r.status, v.want, 'specgate ' + v.args.join(' ') + ' exit');
  }
  const advertised = (read('README.md') + read('README.zh-CN.md')).match(/(?<![A-Za-z-])specgate (start|check|init|handoff|--version|profile|adr|spec|design|board|migrate)(?![A-Za-z0-9-])/g) || [];
  const banned = advertised.filter((s) => / (profile|adr|spec|design|board|migrate)$/.test(s));
  return first(
    eq(banned.length, 0, 'deleted commands still advertised (' + banned.join(',') + ')'),
    ge(new Set(advertised).size, 5, 'the five live commands are all advertised'),
  );
});

// ---------------------------------------------------------------------------
// summary
// ---------------------------------------------------------------------------
rmSync(root, { recursive: true, force: true });
console.log('');
if (seq !== TOTAL) {
  console.log('BROKEN GATE: executed ' + seq + ' claims, the table defines ' + TOTAL + ' — the denominator is fixed');
  process.exit(1);
}
console.log(passed + '/' + TOTAL + ' passed, ' + failed + ' failed' + (failed ? '  — FIX BEFORE SHIPPING (G1 blocked)' : '  — all 51 claims green'));
process.exit(failed ? 1 : 0);
