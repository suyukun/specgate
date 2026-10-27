#!/usr/bin/env node
// cli.mjs — specgate entrypoint. Zero runtime dependencies; Node >= 18.
import { runInit } from './init.mjs';
import { runCheck } from './check.mjs';
import { runStart } from './start.mjs';
import { runHandoff } from './handoff.mjs';
import { UsageError, VERSION } from './util.mjs';

const HELP = [
  'specgate ' + VERSION + ' — stage-aware governance for repositories AI agents work in',
  '',
  'Usage:',
  '  specgate start [dir] [options]    Route your first run: read-only precheck, 3 questions, 1 next command',
  '  specgate init [dir] [options]     Scaffold AGENTS.md + stage docs (add-only; never modifies)',
  '  specgate check [dir] [options]    Audit docs against the AGENTS.md stage marker',
  '  specgate handoff [dir] [--init]   Cross-session handoff: skeleton + routing (rose-handoff skill)',
  '  specgate version                  Print version',
  '',
  'Each command prints detailed help with -h / --help.',
  'Exit codes: 0 ok (check: PASS/WARN/SKIP) | 1 check FAIL under --strict, or start precondition | 2 usage error.',
].join('\n');

const cmd = process.argv[2];
const rest = process.argv.slice(3);

let code = 0;
try {
  if (cmd === 'start') {
    code = await runStart(rest);
  } else if (cmd === 'init') {
    code = await runInit(rest);
  } else if (cmd === 'check') {
    code = runCheck(rest);
  } else if (cmd === 'handoff') {
    code = await runHandoff(rest);
  } else if (cmd === 'version' || cmd === '--version' || cmd === '-v') {
    // One version line, exactly as the README DONE WHEN / INSTALL.md show it.
    console.log('specgate ' + VERSION);
  } else if (cmd === undefined || cmd === 'help' || cmd === '--help' || cmd === '-h') {
    console.log(HELP);
  } else {
    console.error('unknown command: ' + cmd);
    console.error(HELP);
    code = 2;
  }
} catch (err) {
  if (err instanceof UsageError) {
    console.error('error: ' + err.message);
    code = 2;
  } else {
    throw err;
  }
}
process.exit(code);
