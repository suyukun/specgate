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

/** Read a shipped template by file name (exact bytes as utf8 text). */
export function templateText(name) {
  const p = join(TEMPLATES_DIR, name);
  if (!existsSync(p)) throw new UsageError('package template missing: ' + name + ' (broken install?)');
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
