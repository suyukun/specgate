// build.mjs — copy src/*.mjs to dist/ so the bin path stays stable.
// Pure copy, zero dependencies, deterministic output.
import { copyFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const src = fileURLToPath(new URL('../src', import.meta.url));
const dist = fileURLToPath(new URL('../dist', import.meta.url));

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
for (const f of readdirSync(src)) {
  if (f.endsWith('.mjs')) copyFileSync(join(src, f), join(dist, f));
}
console.log('dist/: ' + readdirSync(dist).sort().join(', '));
