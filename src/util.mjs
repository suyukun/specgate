// util.mjs — shared helpers. Zero runtime dependencies (node: builtins only).
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PKG_ROOT = fileURLToPath(new URL('..', import.meta.url));
export const TEMPLATES_DIR = join(PKG_ROOT, 'templates');

export const VERSION = (() => {
  try {
    return JSON.parse(readFileSync(join(PKG_ROOT, 'package.json'), 'utf8')).version || '0.0.0';
  } catch {
    return '0.0.0';
  }
})();

export class UsageError extends Error {}

export function sha256Hex(data) {
  return createHash('sha256').update(data).digest('hex');
}

/** Read a shipped template by file name (exact bytes as utf8 text).
 * lang 'zh' reads the Chinese set under templates/zh/; anything else (and
 * omitted) reads templates/ — byte-identical to the pre-lang behavior. */
export function templateText(name, lang) {
  const dir = lang === 'zh' ? join(TEMPLATES_DIR, 'zh') : TEMPLATES_DIR;
  const p = join(dir, name);
  if (!existsSync(p)) throw new UsageError('package template missing: ' + (lang === 'zh' ? 'zh/' : '') + name + ' (broken install?)');
  return readFileSync(p, 'utf8');
}

/**
 * Minimal flag parser: --flag value | --flag=value | standalone boolean flags.
 * Everything else (including single-dash tokens) becomes a positional.
 */
export function parseArgs(argv, booleanFlags) {
  const bool = new Set(booleanFlags || []);
  const flags = Object.create(null);
  const positionals = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') {
      for (let j = i + 1; j < argv.length; j++) positionals.push(argv[j]);
      break;
    }
    if (a.length > 2 && a.startsWith('--')) {
      let name = a.slice(2);
      let value;
      const eq = name.indexOf('=');
      if (eq !== -1) {
        value = name.slice(eq + 1);
        name = name.slice(0, eq);
      }
      if (bool.has(name)) {
        flags[name] = true;
        continue;
      }
      if (value === undefined) {
        if (i + 1 >= argv.length) throw new UsageError('missing value for --' + name);
        value = argv[++i];
      }
      flags[name] = value;
    } else {
      positionals.push(a);
    }
  }
  return { flags, positionals };
}

/** Normalize a relative path to forward slashes (manifest keys, printed paths). */
export function toPosix(p) {
  return p.split('\\').join('/');
}

/**
 * The display project name: the substituted "> Project: X · ..." header of an
 * adopted AGENTS.md beats the directory name (walkthrough aside: check/handoff
 * printed "ferment-tracker" for a project named "Ferment"). Null when the file
 * has no header or the value is still an unsubstituted {{PROJECT_NAME}}.
 */
export function projectNameFromAgents(agentsText) {
  if (typeof agentsText !== 'string') return null;
  const m = agentsText.match(/^>\s*Project:\s*([^\n\u00b7]+?)\s*(?:\u00b7|\n|$)/m);
  const v = m ? m[1].trim() : null;
  if (!v || v.includes('{{')) return null;
  return v;
}
