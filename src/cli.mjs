#!/usr/bin/env node
// cli.mjs — specgate entrypoint. Zero runtime dependencies; Node >= 18.
import { runInit } from './init.mjs';
import { runCheck } from './check.mjs';
import { UsageError, VERSION } from './util.mjs';

const HELP = [
  'specgate ' + VERSION + ' — stage-aware governance for repositories AI agents work in',
  '',
  'Usage:',
  '  specgate init [dir] [options]     Scaffold AGENTS.md + stage docs (add-only; never modifies)',
  '  specgate check [dir] [options]    Audit docs against the AGENTS.md stage marker',
  '  specgate version                  Print version',
  '',
  'Each command prints detailed help with -h / --help.',
  'Exit codes: 0 ok (check: PASS/WARN/SKIP) | 1 check FAIL under --strict | 2 usage error.',
].join('\n');

const cmd = process.argv[2];
const rest = process.argv.slice(3);

let code = 0;
try {
  if (cmd === 'init') {
    code = await runInit(rest);
  } else if (cmd === 'check') {
    code = runCheck(rest);
  } else if (cmd === 'version' || cmd === '--version' || cmd === '-v') {
    console.log(VERSION);
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
