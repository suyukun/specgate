#!/usr/bin/env node
// smoke.mjs — black-box smoke tests: run the real CLI via child_process and
// assert exit codes and on-disk effects. No framework, zero dependencies.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
  ok('T3 exit 0 + PASS', r.status === 0 && /PASS t1 \| S0/.test(r.stdout), r.stdout);
}
console.log('T4 check WARN (ADR index removed)');
{
  const t = join(root, 't1');
  rmSync(join(t, 'docs', 'adr'), { recursive: true, force: true });
  const w = run(['check', t]);
  ok('T4 exit 0 + WARN', w.status === 0 && /WARN t1 \| S0 \| 1 finding/.test(w.stdout), w.stdout);
  ok('T4 three-part finding', /where    :/.test(w.stdout) && /expected :/.test(w.stdout) && /fix      :/.test(w.stdout));
  ok('T4 fix suggests init', /specgate init .* --stage S0/.test(w.stdout));
}
console.log('T5 check FAIL under --strict');
{
  const t = join(root, 't1');
  const s = run(['check', t, '--strict']);
  ok('T5 exit 1 + FAIL', s.status === 1 && /FAIL t1 \| S0/.test(s.stdout), s.stdout);
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
  ok('T6 canonical check PASS at S1', c1.status === 0 && /PASS t6-adopt \| S1/.test(c1.stdout), c1.stdout);
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
  ok('T7 check PASS at S1', c.status === 0 && /PASS t7-s1 \| S1/.test(c.stdout), c.stdout);
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
  ok('T8 design: exempt → PASS', e.status === 0 && /PASS t7-s1 \| S2/.test(e.stdout), e.stdout);
  writeFileSync(join(t, 'DESIGN.md'), '# Design\n');
  writeFileSync(join(t, 'AGENTS.md'), s2agents);
  const d = run(['check', t, '--strict']);
  ok('T8 root DESIGN.md alternative → strict PASS', d.status === 0 && /PASS t7-s1 \| S2/.test(d.stdout), d.stdout);
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
  ok('T9 exempt → SKIP exit 0 (CRLF tolerated)', e1.status === 0 && /SKIP t9-exempt \| exempt/.test(e1.stdout), e1.stdout);
  const e2 = run(['check', mk('t9-frozen', '<!-- stage: frozen -->')]);
  ok('T9 frozen → SKIP exit 0', e2.status === 0 && /SKIP t9-frozen \| frozen/.test(e2.stdout), e2.stdout);
  const e3 = run(['check', mk('t9-merged', '<!-- stage: merged:P12 -->')]);
  ok('T9 merged:P12 → SKIP exit 0', e3.status === 0 && /SKIP t9-merged \| merged:P12/.test(e3.stdout), e3.stdout);
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
  ok('T11 PASS with custom docs root', c.status === 0 && /PASS t11 \| S0/.test(c.stdout), c.stdout);
  const c2 = run(['check', t, '--strict']);
  ok('T11 default docs root → finding', c2.status === 1 && /docs\/adr\/README\.md/.test(c2.stdout), c2.stdout);
}

// ---- summary ----
rmSync(root, { recursive: true, force: true });
console.log('');
console.log(passed + ' passed, ' + failed + ' failed' + (failed ? '  — FIX BEFORE SHIPPING' : '  — all green'));
process.exit(failed ? 1 : 0);
