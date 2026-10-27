#!/usr/bin/env node
// smoke.mjs — black-box smoke tests: run the real CLI via child_process and
// assert exit codes and on-disk effects. No framework, zero dependencies.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CLI = fileURLToPath(new URL('../src/cli.mjs', import.meta.url));
const PKG = fileURLToPath(new URL('..', import.meta.url));
const GATE_TPL = readFileSync(join(PKG, 'templates', 'gate-doc.template.md'), 'utf8');

const root = mkdtempSync(join(tmpdir(), 'specgate-smoke-'));
let passed = 0;
let failed = 0;

function run(args) {
  return spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', cwd: root });
}
function ok(name, cond, detail) {
  if (cond) { passed++; console.log('  ok   ' + name); }
  else { failed++; console.log('  FAIL ' + name + (detail ? ' — ' + String(detail).slice(0, 400) : '')); }
}

console.log('smoke root: ' + root);

// ---- T1: empty-dir init at S0 ----
console.log('T1 empty-dir init --stage S0');
{
  const t = join(root, 't1');
  mkdirSync(t);
  const r = run(['init', t, '--stage', 'S0', '--owner', 'Alex', '--project-name', 'Demo', '--date', '2026-10-27']);
  ok('T1 exit 0', r.status === 0, r.stderr);
  ok('T1 AGENTS.md created', existsSync(join(t, 'AGENTS.md')));
  const agents = readFileSync(join(t, 'AGENTS.md'), 'utf8');
  ok('T1 no {{OWNER}}/{{PROJECT_NAME}}/{{DATE}} left', !/\{\{(OWNER|PROJECT_NAME|DATE)\}\}/.test(agents));
  ok('T1 owner/date substituted', agents.includes('Alex') && agents.includes('2026-10-27'));
  ok('T1 stage marker S0', agents.includes('<!-- stage: S0 -->'));
  ok('T1 gate-doc template is a pure byte copy', readFileSync(join(t, 'docs', 'plans', 'gate-doc.template.md'), 'utf8') === GATE_TPL);
  ok('T1 ADR index created', existsSync(join(t, 'docs', 'adr', 'README.md')));
  ok('T1 S1 docs NOT installed at S0', !existsSync(join(t, 'docs', 'BACKLOG.md')) && !existsSync(join(t, 'docs', 'architecture')));
  const m = JSON.parse(readFileSync(join(t, '.specgate-manifest.json'), 'utf8'));
  ok('T1 manifest lists 3 files with sha256', Object.keys(m.files).length === 3 && /^[0-9a-f]{64}$/.test(m.files['AGENTS.md'].sha256));
  ok('T1 manifest keys are posix paths', m.files['docs/plans/gate-doc.template.md'] !== undefined);
  ok('T1 plan printed before write', /Files to write \(4\):/.test(r.stdout) && r.stdout.indexOf('Files to write') < r.stdout.indexOf('Done:'));
}

// ---- T2: rerun is idempotent and add-only ----
console.log('T2 rerun init (add-only, idempotent)');
{
  const t = join(root, 't1');
  const before = readFileSync(join(t, 'AGENTS.md'), 'utf8');
  const r = run(['init', t, '--stage', 'S0', '--owner', 'Mallory', '--project-name', 'Evil']);
  ok('T2 exit 0', r.status === 0, r.stderr);
  ok('T2 AGENTS.md untouched', readFileSync(join(t, 'AGENTS.md'), 'utf8') === before);
  ok('T2 conflicts listed as untouched', /exists, untouched/.test(r.stdout) && r.stdout.includes('AGENTS.md'));
  ok('T2 only manifest rewritten', /Files to write \(1\):/.test(r.stdout));
}

// ---- T3/T4/T5: check PASS → WARN → FAIL (--strict) ----
console.log('T3 check PASS at S0');
{
  const t = join(root, 't1');
  const r = run(['check', t]);
  ok('T3 exit 0 + PASS (stage S0) format', r.status === 0 && /PASS t1 \(stage S0\)/.test(r.stdout), r.stdout);
}
console.log('T4 check WARN (ADR index removed)');
{
  const t = join(root, 't1');
  rmSync(join(t, 'docs', 'adr'), { recursive: true, force: true });
  const w = run(['check', t]);
  ok('T4 exit 0 + WARN (stage S0) format', w.status === 0 && /WARN t1 \(stage S0\) — 1 finding/.test(w.stdout), w.stdout);
  ok('T4 three-part finding', /where    :/.test(w.stdout) && /expected :/.test(w.stdout) && /fix      :/.test(w.stdout));
  ok('T4 fix suggests init', /specgate init .* --stage S0/.test(w.stdout));
}
console.log('T5 check FAIL under --strict');
{
  const t = join(root, 't1');
  const s = run(['check', t, '--strict']);
  ok('T5 exit 1 + FAIL (stage S0) format', s.status === 1 && /FAIL t1 \(stage S0\)/.test(s.stdout), s.stdout);
}

// ---- T6: adopt on an oddly-shaped repo (docs/decisions instead of docs/adr) ----
console.log('T6 adopt — docs/decisions layout, own AGENTS.md, own board');
{
  const t = join(root, 't6-adopt');
  mkdirSync(join(t, 'docs', 'decisions'), { recursive: true });
  writeFileSync(join(t, 'AGENTS.md'), '# My house rules\n\n<!-- stage: S1 -->\n\nKeep mine.\n');
  writeFileSync(join(t, 'docs', 'decisions', '0001-db.md'), '# ADR-0001: use a db\n');
  writeFileSync(join(t, 'docs', 'BACKLOG.md'), '# My board\n');
  const beforeAgents = readFileSync(join(t, 'AGENTS.md'), 'utf8');
  const r = run(['init', t, '--adopt', '--owner', 'Alex']);
  ok('T6 exit 0', r.status === 0, r.stderr);
  ok('T6 own AGENTS.md untouched', readFileSync(join(t, 'AGENTS.md'), 'utf8') === beforeAgents);
  ok('T6 own board untouched', readFileSync(join(t, 'docs', 'BACKLOG.md'), 'utf8') === '# My board\n');
  ok('T6 untouched list names AGENTS.md', /AGENTS\.md\s+—\s+exists, untouched/.test(r.stdout));
  ok('T6 added ADR index + plans + architecture', existsSync(join(t, 'docs', 'adr', 'README.md')) && existsSync(join(t, 'docs', 'plans', 'gate-doc.template.md')) && existsSync(join(t, 'docs', 'architecture', 'current.md')));
  const c1 = run(['check', t, '--strict']);
  ok('T6 canonical check PASS at S1', c1.status === 0 && /PASS t6-adopt \(stage S1\)/.test(c1.stdout), c1.stdout);
  const c2 = run(['check', t, '--adr-subdir', 'decisions', '--strict']);
  ok('T6 parameterized --adr-subdir decisions finds missing README', c2.status === 1 && /docs\/decisions\/README\.md/.test(c2.stdout), c2.stdout);
}

// ---- T7: S1 install passes out of the box ----
console.log('T7 init --stage S1 → check PASS');
{
  const t = join(root, 't7-s1');
  mkdirSync(t);
  const r = run(['init', t, '--stage', 'S1', '--owner', 'Alex', '--project-name', 'Demo']);
  ok('T7 exit 0', r.status === 0, r.stderr);
  ok('T7 stage marker S1', readFileSync(join(t, 'AGENTS.md'), 'utf8').includes('<!-- stage: S1 -->'));
  ok('T7 board + architecture installed', existsSync(join(t, 'docs', 'BACKLOG.md')) && existsSync(join(t, 'docs', 'architecture', 'current.md')));
  const c = run(['check', t]);
  ok('T7 check PASS at S1', c.status === 0 && /PASS t7-s1 \(stage S1\)/.test(c.stdout), c.stdout);
}

// ---- T8: S2 design requirement ----
console.log('T8 S2 design: missing → WARN; exempt marker / root DESIGN.md → PASS');
{
  const t = join(root, 't7-s1');
  const s1agents = readFileSync(join(t, 'AGENTS.md'), 'utf8');
  const s2agents = s1agents.replace('<!-- stage: S1 -->', '<!-- stage: S2 -->');
  writeFileSync(join(t, 'AGENTS.md'), s2agents);
  const w = run(['check', t]);
  ok('T8 S2 missing design → WARN exit 0', w.status === 0 && /Design spec missing/.test(w.stdout), w.stdout);
  writeFileSync(join(t, 'AGENTS.md'), s2agents + '\n<!-- design: exempt -->\n');
  const e = run(['check', t]);
  ok('T8 design: exempt → PASS', e.status === 0 && /PASS t7-s1 \(stage S2\)/.test(e.stdout), e.stdout);
  writeFileSync(join(t, 'DESIGN.md'), '# Design\n');
  writeFileSync(join(t, 'AGENTS.md'), s2agents);
  const d = run(['check', t, '--strict']);
  ok('T8 root DESIGN.md alternative → strict PASS', d.status === 0 && /PASS t7-s1 \(stage S2\)/.test(d.stdout), d.stdout);
}

// ---- T9: skip states, hard findings, CRLF tolerance ----
console.log('T9 exempt / frozen / merged:P12 / no marker / invalid / CRLF / usage');
{
  const mk = (name, marker) => {
    const t = join(root, name);
    mkdirSync(t, { recursive: true });
    const body = '# P\n\n' + (marker ? marker + '\n' : '') + 'rules\n';
    writeFileSync(join(t, 'AGENTS.md'), body.replace(/\n/g, '\r\n')); // CRLF on purpose
    return t;
  };
  const e1 = run(['check', mk('t9-exempt', '<!-- stage: exempt -->')]);
  ok('T9 exempt → SKIP exit 0 (CRLF tolerated)', e1.status === 0 && /SKIP t9-exempt \(stage exempt\)/.test(e1.stdout), e1.stdout);
  const e2 = run(['check', mk('t9-frozen', '<!-- stage: frozen -->')]);
  ok('T9 frozen → SKIP exit 0', e2.status === 0 && /SKIP t9-frozen \(stage frozen\)/.test(e2.stdout), e2.stdout);
  const e3 = run(['check', mk('t9-merged', '<!-- stage: merged:P12 -->')]);
  ok('T9 merged:P12 → SKIP exit 0', e3.status === 0 && /SKIP t9-merged \(stage merged:P12\)/.test(e3.stdout), e3.stdout);
  const e4 = run(['check', mk('t9-nostage', null)]);
  ok('T9 no marker → WARN exit 0 (default)', e4.status === 0 && /no stage marker/.test(e4.stdout), e4.stdout);
  ok('T9 no marker --strict → exit 1', run(['check', join(root, 't9-nostage'), '--strict']).status === 1);
  const e5 = run(['check', mk('t9-bad', '<!-- stage: S9 -->')]);
  ok('T9 invalid stage value named', e5.status === 0 && /invalid stage value "S9"/.test(e5.stdout), e5.stdout);
  const e6 = run(['check', join(root, 'does-not-exist')]);
  ok('T9 missing dir → exit 2 usage error', e6.status === 2, 'status=' + e6.status);
}

// ---- T10: agent pointer shims (ask-first, --yes) ----
console.log('T10 agent pointer shims (ask-first, --yes)');
{
  const t = join(root, 't10');
  mkdirSync(join(t, '.cursor'), { recursive: true });
  mkdirSync(join(t, '.github'), { recursive: true });
  writeFileSync(join(t, '.github', 'copilot-instructions.md'), 'my own copilot rules\n');
  const r1 = run(['init', t, '--owner', 'Alex']);
  ok('T10 exit 0 without --yes', r1.status === 0, r1.stderr);
  ok('T10 cursor pointer suggested, not written', /Suggested agent pointer files/.test(r1.stdout) && /\.cursor\/rules\/agents\.mdc/.test(r1.stdout) && !existsSync(join(t, '.cursor', 'rules', 'agents.mdc')));
  ok('T10 copilot target taken → untouched note', /copilot-instructions\.md\s+—\s+exists, untouched/.test(r1.stdout));
  const r2 = run(['init', t, '--owner', 'Alex', '--yes']);
  ok('T10 --yes writes cursor pointer', r2.status === 0 && existsSync(join(t, '.cursor', 'rules', 'agents.mdc')));
  const m = JSON.parse(readFileSync(join(t, '.specgate-manifest.json'), 'utf8'));
  ok('T10 manifest includes shim entry', m.files['.cursor/rules/agents.mdc'] !== undefined);
  ok('T10 copilot file still untouched', readFileSync(join(t, '.github', 'copilot-instructions.md'), 'utf8') === 'my own copilot rules\n');
}

// ---- T11: --docs-dir parameterization ----
console.log('T11 custom docs root (--docs-dir governance)');
{
  const t = join(root, 't11');
  mkdirSync(join(t, 'governance', 'adr'), { recursive: true });
  mkdirSync(join(t, 'governance', 'plans'));
  writeFileSync(join(t, 'AGENTS.md'), '# P\n\n<!-- stage: S0 -->\n');
  writeFileSync(join(t, 'governance', 'adr', 'README.md'), '# Decision Log\n');
  const c = run(['check', t, '--docs-dir', 'governance', '--strict']);
  ok('T11 PASS with custom docs root', c.status === 0 && /PASS t11 \(stage S0\)/.test(c.stdout), c.stdout);
  const c2 = run(['check', t, '--strict']);
  ok('T11 default docs root → finding', c2.status === 1 && /docs\/adr\/README\.md/.test(c2.stdout), c2.stdout);
}

// ---- T12: --version format (C-01: one line, "specgate <version>") ----
console.log('T12 --version / -v / version format');
{
  const expect = 'specgate 0.1.0';
  const r1 = run(['--version']);
  ok('T12 --version exit 0', r1.status === 0, r1.stderr);
  ok('T12 --version prints "specgate 0.1.0"', r1.stdout.trim() === expect, r1.stdout);
  ok('T12 --version is exactly one line', r1.stdout.trim().split('\n').length === 1, r1.stdout);
  const r2 = run(['-v']);
  ok('T12 -v matches', r2.status === 0 && r2.stdout.trim() === expect, r2.stdout);
  const r3 = run(['version']);
  ok('T12 version subcommand matches', r3.status === 0 && r3.stdout.trim() === expect, r3.stdout);
  const h = run([]);
  ok('T12 top help lists start/handoff', /specgate start /.test(h.stdout) && /specgate handoff /.test(h.stdout), h.stdout);
}

// ---- T13: specgate start (C-02/A-15/A-16: precheck + 3 questions + Route/Next/After, read-only) ----
console.log('T13 specgate start — precheck, routing, read-only');
{
  const walk = (t) => {
    const out = [];
    const rec = (d, pre) => {
      for (const e of readdirSync(d, { withFileTypes: true })) {
        if (e.name === '.git') continue;
        const rel = (pre ? pre + '/' : '') + e.name;
        out.push(rel);
        if (e.isDirectory()) rec(join(d, e.name), rel);
      }
    };
    rec(t, '');
    return out.sort().join('\n');
  };
  const ginit = (t) => spawnSync('git', ['init', '-q', t], { encoding: 'utf8' });

  // a) non-git dir -> precondition block (error sample 1), exit 1, nothing written
  const n1 = join(root, 't13-nogit');
  mkdirSync(n1);
  const a = run(['start', n1]);
  ok('T13 non-git exit 1', a.status === 1, 'status=' + a.status);
  ok('T13 non-git precondition block', /\[precondition\] Not a git repository/.test(a.stdout) && /Rollback needs version control/.test(a.stdout), a.stdout);
  ok('T13 non-git Wrong/Correct/Next lines', /Wrong:/.test(a.stdout) && /Correct: git init/.test(a.stdout) && /Next:    ask the user, then: specgate start/.test(a.stdout), a.stdout);
  ok('T13 non-git ends with No files were changed.', a.stdout.trim().endsWith('No files were changed.'), a.stdout);
  ok('T13 non-git no Route block', !/\nRoute: /.test(a.stdout), a.stdout);
  ok('T13 non-git wrote nothing', readdirSync(n1).length === 0, readdirSync(n1).join(','));

  // b) empty git repo -> Route A (greenfield), 3-line format, read-only
  const b1 = join(root, 't13-green');
  ginit(b1);
  const before = walk(b1);
  const b = run(['start', b1]);
  ok('T13 greenfield exit 0', b.status === 0, b.stderr);
  ok('T13 precheck prints git/AGENTS.md/tools/content rows', /git repository    : yes/.test(b.stdout) && /AGENTS\.md         : not found/.test(b.stdout) && /agent tools/.test(b.stdout) && /empty — greenfield/.test(b.stdout), b.stdout);
  ok('T13 three questions print with defaults', /Q1 repository state .*\[default: greenfield\]/.test(b.stdout) && /Q2 decision mode .*\[default: solo\]/.test(b.stdout) && /Q3 this run .*\[default: setup\]/.test(b.stdout), b.stdout);
  const routeLines = b.stdout.split('\n').filter((l) => /^(Route:|Next:  |After:)/.test(l));
  ok('T13 exactly Route/Next/After three lines', routeLines.length === 3, JSON.stringify(routeLines));
  ok('T13 Route A solo', /^Route: A · mode: solo$/.test(routeLines[0]), routeLines[0]);
  ok('T13 Next points at rose-bootstrap skill', /rose-bootstrap .*SKILL\.md/.test(routeLines[1]), routeLines[1]);
  ok('T13 After previews PASS (stage S0)', /PASS t13-green \(stage S0\)/.test(routeLines[2]), routeLines[2]);
  ok('T13 non-interactive defaults note', /non-interactive run/.test(b.stdout), b.stdout);
  ok('T13 read-only: no file changed', walk(b1) === before, walk(b1));

  // c) existing code, no AGENTS.md -> Route B / init --adopt
  const c1 = join(root, 't13-adopt');
  mkdirSync(join(c1, 'src'), { recursive: true });
  writeFileSync(join(c1, 'src', 'app.js'), 'console.log(1)\n');
  ginit(c1);
  const c = run(['start', c1]);
  ok('T13 existing-code exit 0', c.status === 0, c.stderr);
  ok('T13 Q1 default existing', /\[default: existing\]/.test(c.stdout), c.stdout);
  ok('T13 Route B + init --adopt', /^Route: B · mode: solo$/m.test(c.stdout) && /Next:  specgate init --adopt .*t13-adopt/.test(c.stdout), c.stdout);

  // d) governed repo (init S0, owner me) -> default intent check
  const d1 = join(root, 't13-check');
  mkdirSync(d1);
  ginit(d1);
  run(['init', d1, '--stage', 'S0', '--owner', 'me']);
  const d = run(['start', d1]);
  ok('T13 governed repo exit 0', d.status === 0, d.stderr);
  ok('T13 Q3 default check', /Q3 this run .*\[default: check\]/.test(d.stdout), d.stdout);
  ok('T13 Route check + Next specgate check', /^Route: check · mode: solo$/m.test(d.stdout) && /Next:  specgate check .*t13-check/.test(d.stdout), d.stdout);
  ok('T13 AGENTS.md row shows stage + owner + never modified', /AGENTS\.md         : found \(stage S0, owner me\) — never modified/.test(d.stdout), d.stdout);

  // e) S1 marker with missing docs -> default fill
  const e1d = join(root, 't13-fill');
  mkdirSync(e1d);
  ginit(e1d);
  writeFileSync(join(e1d, 'AGENTS.md'), '# P\n\n<!-- stage: S1 -->\n');
  const e = run(['start', e1d]);
  ok('T13 S1-missing-docs default fill', /Q3 this run .*\[default: fill\]/.test(e.stdout), e.stdout);
  ok('T13 fill Next = specgate init (stage from marker)', /^Route: B · mode: solo$/m.test(e.stdout) && /Next:  specgate init .*t13-fill /.test(e.stdout) && /stage S1 read from your AGENTS\.md/.test(e.stdout), e.stdout);

  // f) flags override defaults without a TTY
  const f = run(['start', b1, '--intent', 'check']);
  ok('T13 --intent check overrides default', f.status === 0 && /^Route: check · mode: solo$/m.test(f.stdout), f.stdout);
  const f2 = run(['start', b1, '--repo-state', 'existing', '--intent', 'setup']);
  ok('T13 --repo-state existing routes B', f2.status === 0 && /Next:  specgate init --adopt .*t13-green/.test(f2.stdout), f2.stdout);
  const f3 = run(['start', b1, '--decisions', 'with-owner', '--intent', 'setup']);
  ok('T13 --decisions with-owner mode', f3.status === 0 && /^Route: A · mode: with-owner$/m.test(f3.stdout), f3.stdout);
  const f4 = run(['start', b1, '--intent', 'bogus']);
  ok('T13 bad --intent value exit 2', f4.status === 2, 'status=' + f4.status);
  const f5 = run(['start', join(root, 'no-such-dir')]);
  ok('T13 missing dir exit 2', f5.status === 2, 'status=' + f5.status);

  // g) OWNER != me -> with-owner default
  const g1 = join(root, 't13-owner');
  mkdirSync(g1);
  ginit(g1);
  writeFileSync(join(g1, 'AGENTS.md'), '# P\n\n<!-- stage: S0 -->\n\n> Project: Demo · Owner: Alex · Created: 2026-10-27\n');
  const g = run(['start', g1]);
  ok('T13 owner Alex -> with-owner default', /\[default: with-owner\]/.test(g.stdout) && /owner Alex\)/.test(g.stdout), g.stdout);

  // h) agent-tool detection in precheck (.windsurf/ directory)
  const h1 = join(root, 't13-tools');
  mkdirSync(join(h1, '.windsurf', 'rules'), { recursive: true });
  ginit(h1);
  const h = run(['start', h1]);
  ok('T13 precheck detects .windsurf/', /agent tools       : \.windsurf\/ — init will offer pointer files \(ask-first\)/.test(h.stdout), h.stdout);
  ok('T13 tools run still read-only', !existsSync(join(h1, '.windsurf', 'rules', 'agents.md')), 'shim written');
}

// ---- T14: specgate handoff (C-09: template + routing; --init ask-first) ----
console.log('T14 specgate handoff — routing template + --init');
{
  const t = join(root, 't14');
  mkdirSync(t);

  // a) no arguments: routing + three-part template, writes nothing
  const a = run(['handoff', t]);
  ok('T14 no-args exit 0', a.status === 0, a.stderr);
  ok('T14 write/read routing lines', /Writing a handoff .*handoffs\/handoff-YYYY-MM-DD-<topic>\.md/.test(a.stdout) && /Reading a handoff .*handoffs\/INDEX\.md/.test(a.stdout), a.stdout);
  ok('T14 three-part scope contract', /## What — in this handoff/.test(a.stdout) && /## Not in this handoff — stays with the original session/.test(a.stdout) && /## Out of scope — a handoff never does this/.test(a.stdout), a.stdout);
  ok('T14 skeleton carries the six sections', /1\. Current focus/.test(a.stdout) && /2\. Findings and decisions/.test(a.stdout) && /3\. Settled decisions/.test(a.stdout) && /4\. Next steps/.test(a.stdout) && /5\. Key files and/.test(a.stdout) && /6\. Environment snapshot/.test(a.stdout), a.stdout);
  ok('T14 points at rose-handoff skill', /skills\/rose-handoff\/SKILL\.md/.test(a.stdout), a.stdout);
  ok('T14 no-args writes nothing', !existsSync(join(t, 'handoffs')), 'handoffs/ created');

  // b) --init prints then creates (ask-first: print before write)
  const b = run(['handoff', t, '--init', '--topic', 'cli-card', '--date', '2026-10-27']);
  const rel = join('handoffs', 'handoff-2026-10-27-cli-card.md');
  ok('T14 --init exit 0', b.status === 0, b.stderr);
  ok('T14 file plan printed before Done', b.stdout.indexOf('Files to write (1):') !== -1 && b.stdout.indexOf('Files to write (1):') < b.stdout.indexOf('Done: 1 written.'), b.stdout);
  ok('T14 file created', existsSync(join(t, rel)));
  const doc = readFileSync(join(t, rel), 'utf8');
  ok('T14 content has header fields', doc.includes('# Handoff: cli-card (2026-10-27)') && doc.includes('Project: t14') && /Purpose: <end of day \| window rotation \| switching tool>/.test(doc) && /Continue: <the one sentence/.test(doc), doc.slice(0, 200));
  ok('T14 content has What / Not in this handoff / Out of scope', doc.includes('## What — in this handoff') && doc.includes('## Not in this handoff — stays with the original session') && doc.includes('## Out of scope — a handoff never does this'), doc.slice(0, 400));
  ok('T14 index + read-back reminders printed', /handoffs\/INDEX\.md \(newest on top\)/.test(b.stdout) && /read the file back/.test(b.stdout), b.stdout);

  // c) rerun with same topic/date: exists, untouched (byte-identical)
  const before = readFileSync(join(t, rel), 'utf8');
  const c = run(['handoff', t, '--init', '--topic', 'cli-card', '--date', '2026-10-27']);
  ok('T14 rerun exit 0', c.status === 0, c.stderr);
  ok('T14 rerun says exists, untouched', /exists, untouched/.test(c.stdout), c.stdout);
  ok('T14 rerun never modified the file', readFileSync(join(t, rel), 'utf8') === before);

  // d) default topic "session" and today's date
  const d = run(['handoff', t, '--init']);
  ok('T14 default topic/date file created', d.status === 0 && readdirSync(join(t, 'handoffs')).some((f) => /^handoff-\d{4}-\d{2}-\d{2}-session\.md$/.test(f)), d.stdout);

  // e) usage errors
  ok('T14 bad --topic exit 2', run(['handoff', t, '--init', '--topic', 'not a slug']).status === 2);
  ok('T14 bad --date exit 2', run(['handoff', t, '--init', '--date', '20261027']).status === 2);
  ok('T14 extra positional exit 2', run(['handoff', t, 'extra']).status === 2);
  ok('T14 missing dir exit 2', run(['handoff', join(root, 'nope')]).status === 2);
}

// ---- T15: check NC-OPEN assertion (A-02/F-03: kickoff gate) ----
console.log('T15 check NC-OPEN assertion (kickoff gate)');
{
  const t = join(root, 't15');
  mkdirSync(t);
  run(['init', t, '--stage', 'S0', '--owner', 'me']);

  // a) shipped template copy (5 NC-OPEN demo lines) must NOT trigger
  const tplCopy = readFileSync(join(t, 'docs', 'plans', 'gate-doc.template.md'), 'utf8');
  ok('T15 fixture: template copy really contains NC-OPEN', tplCopy.includes('NC-OPEN'), 'fixture broken');
  const a = run(['check', t]);
  ok('T15 template/example copies excluded → PASS', a.status === 0 && /PASS t15 \(stage S0\)/.test(a.stdout), a.stdout);

  // b) a real gate doc with open cards → finding, WARN default, FAIL --strict
  writeFileSync(join(t, 'docs', 'plans', 'gate-expense_v1.md'), '# Gate\n\n| NC-1 | currency? | a | NC-OPEN |\n| NC-2 | scale? | a | NC-OPEN |\n');
  writeFileSync(join(t, 'docs', 'plans', 'gate-notes.example.md'), '| NC-9 | demo? | a | NC-OPEN |\n'); // example copy: excluded
  const b = run(['check', t]);
  ok('T15 NC-OPEN → WARN exit 0', b.status === 0 && /WARN t15 \(stage S0\) — 1 finding/.test(b.stdout), b.stdout);
  ok('T15 finding title: cards + kickoff', /\[1\/1\] 2 NC-OPEN decision cards in docs\/plans\/gate-expense_v1\.md — resolve before dispatch \(kickoff\)/.test(b.stdout), b.stdout);
  ok('T15 where names file:line', /where    : docs\/plans\/gate-expense_v1\.md:3 — "NC-OPEN" on line\(s\) 3, 4/.test(b.stdout), b.stdout);
  ok('T15 fix suggests resolving cards', /send the open cards to the owner as one numbered batch/.test(b.stdout), b.stdout);
  const bs = run(['check', t, '--strict']);
  ok('T15 --strict exit 1', bs.status === 1 && /FAIL t15 \(stage S0\)/.test(bs.stdout), bs.stdout);

  // c) resolved cards do not trigger
  writeFileSync(join(t, 'docs', 'plans', 'gate-expense_v1.md'), '# Gate\n\n| NC-1 | currency? | a | NC-RESOLVED: 1a |\n');
  const c = run(['check', t]);
  ok('T15 NC-RESOLVED → PASS again', c.status === 0 && /PASS t15 \(stage S0\)/.test(c.stdout), c.stdout);
}

// ---- T16: check template_version stale assertion (A-09/F-01) ----
console.log('T16 check template_version stale assertion');
{
  const t = join(root, 't16');
  mkdirSync(t);
  run(['init', t, '--stage', 'S0', '--owner', 'me']);

  // a) fresh init: marker equals shipped → no stale finding
  const a = run(['check', t]);
  ok('T16 fresh init PASS (no stale finding)', a.status === 0 && /PASS t16 \(stage S0\)/.test(a.stdout) && !/template_version/.test(a.stdout), a.stdout);

  // b) behind → stale finding, WARN default, FAIL --strict
  const agents0 = readFileSync(join(t, 'AGENTS.md'), 'utf8').replace('<!-- template_version: 1 -->', '<!-- template_version: 0 -->');
  writeFileSync(join(t, 'AGENTS.md'), agents0);
  const b = run(['check', t]);
  ok('T16 stale → WARN exit 0', b.status === 0 && /WARN t16 \(stage S0\) — 1 finding/.test(b.stdout), b.stdout);
  ok('T16 stale finding names both versions', /\[1\/1\] template_version stale .*\(0 < 1\)/.test(b.stdout) && /vs shipped templates\/AGENTS\.template\.md "<!-- template_version: 1 -->"/.test(b.stdout), b.stdout);
  ok('T16 stale fix suggests diff + bump, never edits', /diff "/.test(b.stdout) && /bump the marker to 1/.test(b.stdout) && /specgate never edits your file/.test(b.stdout), b.stdout);
  ok('T16 stale --strict exit 1', run(['check', t, '--strict']).status === 1);

  // c) ahead of shipped → not stale
  writeFileSync(join(t, 'AGENTS.md'), readFileSync(join(t, 'AGENTS.md'), 'utf8').replace('<!-- template_version: 0 -->', '<!-- template_version: 9 -->'));
  ok('T16 ahead → PASS', run(['check', t]).stdout.includes('PASS t16 (stage S0)'));

  // d) no marker (adopted, hand-written AGENTS.md) → not flagged
  writeFileSync(join(t, 'AGENTS.md'), readFileSync(join(t, 'AGENTS.md'), 'utf8').replace('<!-- template_version: 9 -->\n', ''));
  ok('T16 marker absent → PASS (adopt not nagged)', run(['check', t]).stdout.includes('PASS t16 (stage S0)'));

  // e) CRLF file with stale marker still detected
  writeFileSync(join(t, 'AGENTS.md'), ('<!-- template_version: 0 -->\n' + readFileSync(join(t, 'AGENTS.md'), 'utf8')).replace(/\n/g, '\r\n'));
  const e = run(['check', t]);
  ok('T16 CRLF stale detected', /template_version stale/.test(e.stdout), e.stdout);
}

// ---- T17: Windsurf .windsurf/ directory detection (C-05) ----
console.log('T17 Windsurf .windsurf/ directory shim detection');
{
  const t = join(root, 't17');
  mkdirSync(join(t, '.windsurf', 'rules'), { recursive: true });
  const r1 = run(['init', t, '--owner', 'Alex']);
  ok('T17 .windsurf/ dir detected and suggested', r1.status === 0 && /\? \.windsurf\/rules\/agents\.md  \(detected \.windsurf\/\)/.test(r1.stdout), r1.stdout);
  ok('T17 not written without --yes', !existsSync(join(t, '.windsurf', 'rules', 'agents.md')), 'shim written');
  const r2 = run(['init', t, '--owner', 'Alex', '--yes']);
  ok('T17 --yes writes the pointer', r2.status === 0 && existsSync(join(t, '.windsurf', 'rules', 'agents.md')), r2.stdout);
  const m = JSON.parse(readFileSync(join(t, '.specgate-manifest.json'), 'utf8'));
  ok('T17 manifest lists the windsurf shim', m.files['.windsurf/rules/agents.md'] !== undefined);

  // both .windsurfrules and .windsurf/ → one suggestion, file wins
  const t2 = join(root, 't17b');
  mkdirSync(join(t2, '.windsurf', 'rules'), { recursive: true });
  writeFileSync(join(t2, '.windsurfrules'), 'legacy rules\n');
  const r3 = run(['init', t2, '--owner', 'Alex']);
  const windsurfLines = r3.stdout.split('\n').filter((l) => l.includes('.windsurf/rules/agents.md'));
  ok('T17 both markers → single suggestion (.windsurfrules wins)', r3.status === 0 && windsurfLines.length === 1 && /detected \.windsurfrules/.test(windsurfLines[0]), windsurfLines.join('|'));
}

// ---- summary ----
rmSync(root, { recursive: true, force: true });
console.log('');
console.log(passed + ' passed, ' + failed + ' failed' + (failed ? '  — FIX BEFORE SHIPPING' : '  — all green'));
process.exit(failed ? 1 : 0);
