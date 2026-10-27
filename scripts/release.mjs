#!/usr/bin/env node
// release.mjs — 发布执行脚本（G7）。前置条件：Jack 已在对话中给出明示批复文本。
// 用法：node scripts/release.mjs --jack-approved --tarball-sha <sha256>
// 步骤：pack → sha 核对 → publish（npmjs registry）→ npm view 确认 → 干净环境公网 npx 验证 → 失败提示 deprecate（预写文案）。
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const REG = 'https://registry.npmjs.org';
const args = new Set(process.argv.slice(2));
if (!args.has('--jack-approved')) { console.error('REFUSED: publish requires Jack explicit approval (goal hard gate G6/G7).'); process.exit(2); }
const want = [...args].find(a => a.startsWith('--tarball-sha='))?.split('=')[1];
const run = (c, o = {}) => execSync(c, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], ...o });
rmSync('/tmp/specgate-0.1.0.tgz', { force: true });
run('npm pack --pack-destination /tmp');
const sha = createHash('sha256').update(readFileSync('/tmp/specgate-0.1.0.tgz')).digest('hex');
console.log('tarball sha256:', sha);
if (want && want !== sha) { console.error('SHA MISMATCH vs approved — aborting.'); process.exit(1); }
run('npm publish /tmp/specgate-0.1.0.tgz --registry ' + REG, { stdio: 'inherit' });
const v = JSON.parse(run('npm view specgate@0.1.0 --json --registry ' + REG));
console.log('published:', v.name, v.version, '| dist.tarball:', v.dist.tarball);
const t = mkdtempSync(join(tmpdir(), 'sgpub-'));
try {
  const out = run('npx --yes specgate@0.1.0 --version', { cwd: t, env: { ...process.env, npm_config_registry: REG, npm_config_cache: t } });
  console.log('public npx verify:', out.trim());
  if (out.trim() !== 'specgate 0.1.0') throw new Error('version mismatch');
  console.log('RELEASE VERIFIED (G7 green).');
} catch (e) {
  console.error('PUBLIC VERIFY FAILED — rollback:');
  console.error('  npm deprecate specgate@0.1.0 "broken install, use 0.1.1" --registry ' + REG);
  process.exit(1);
}
