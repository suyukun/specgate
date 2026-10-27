# specgate v0.1.0 发布就绪 · 独立复验报告（readiness gate G1–G5）

- **复验人**：独立复验子代理（新会话，未参与 specgate 任何开发、未见过开发过程笔记）
- **复验对象**：本仓 `/Users/suyukun/Projects/Rose/opensource/pkg`，HEAD = `b6f43cf`（docs: G2 evidence archive）
- **复验方式**：逐条亲手执行命令，只采信本次会话里的真实输出；不接受"据说已过"。凡未验证的，明确写"未验证"。
- **环境**：macOS (darwin, Apple Silicon) · Node `v24.21.0` · npm `11.19.0` · 系统时间 `2026-10-27T21:22 +0800` 起
- **复验窗口**：2026-10-27 21:21 → 21:45 (+08:00)
- **结论**：**G1–G5 全部 PASS（其中 2 项带非阻断观察，见第五节）**；readiness = **就绪，可进入"待 Jack 三批"**

---

## 一、结论速览

| 门 | 项目 | 判定 | 一句话证据 |
| --- | --- | --- | --- |
| G1 | 承诺 = 实现 | **PASS** | `node test/claims.mjs` → `51/51 passed, 0 failed`，exit 0 |
| G2 | 两遍实证物证 | **PASS** | G2a 6 个卡点 5 修（`116fdfb`）+ 2 披露（CHANGELOG known issues #1/#2），逐条复现；G2b init→实现→converge 三连齐 |
| G3 | 发布件 | **PASS** | MIT 全文+版权行；CC0 `sha256=a2010f34…`；CHANGELOG `[0.1.0]` + known issues 恰好 3 条；四份政策文件要素齐 |
| G4 | 打包端到端 | **PASS** | `npm pack` 25 件 → 临时目录安装 → `--version`/`init`/`check` 全绿；隐私扫描 0 命中 |
| G5 | 发布机制 | **PASS** | `private` 未设；`npm view specgate` 404；`npm whoami` ENEEDAUTH（如实记录）；git status 0 行 |
| 附加 | smoke + 双语 README | **PASS** | smoke `159 passed, 0 failed`；zh/en 4 处改动段落语义同步 |

**总判：readiness 就绪。** 无 FAIL 项。发布前有 2 条非阻断偏差与 3 条 P3 打磨建议（第五节），均不影响门禁判定。

---

## 二、G1 承诺 = 实现

命令（仓根执行）：

```console
$ node test/claims.mjs
[1/51] PASS C-01 (IMPL) — --version prints exactly one version line in the documented prefixed format, exit 0
[2/51] PASS C-02 (IMPL) — start single entry: three questions + one exact next command, exit 0
[3/51] PASS C-03 (IMPL) — check prints PASS/WARN/FAIL: default WARN exit 0, --strict FAIL exit 1, usage error exit 2
...
[49/51] PASS F-10 (IMPL) — known limitations disclosed truthfully: single writer / no cross-machine lock / no team panel / advisory check
[50/51] PASS F-11 (IMPL) — install != bootstrapped: the packed tarball ships no AGENTS.md and no docs/ tree
[51/51] PASS F-12 (IMPL) — every command advertised in the READMEs runs with the documented exit behavior

51/51 passed, 0 failed  — all 51 claims green
claims-exit=0
```

- 输出 53 行（1 行头部 + 51 条断言 + 1 行汇总），断言条数与 51 条承诺严格对应，无 skip、无 TODO 占位。
- 复验跑了两遍（首次与打包后各一次），结果一致：**51/51 PASS，exit 0**。
- **判定：PASS** ✅

---

## 三、G2 两遍实证物证

### G2a 用户走查：`docs/evidence/user-walkthrough-G2a_20261027.md`（119 行，已入库）

文件存在且是真实的"初中级开发者视角"走查：时间线流水账（T+0.0→T+4.0）、6 条卡点（每条含位置/现象/猜测原因/期望帮助）、三判断、产物清单。**不是总结稿，是过程稿** —— 这项最重要，因为是"卡点能否被复现"的前提。

卡点处置可追溯性：我按"阻断级 = git log 有对应 commit；非阻断 = CHANGELOG known issues"逐条核对，并**亲手复现了每一条的当前行为**。

| 卡点 | 类型 | 处置 | 追溯证据（我执行的验证） |
| --- | --- | --- | --- |
| 1 `start` 的下一步是 skill 路径、不是命令 | 阻断 | 已修 `116fdfb` | 复现：`start` 现打印 `Next: specgate init --stage S0 --owner me`（可直接敲），skill 降级为 `Optional deep-dive` |
| 2 `check` 把模板正文 `NC-OPEN` 字样当未决卡 | 阻断 | 已修 `116fdfb` | 复现：模板正文仍含 5 处 `NC-OPEN` 字面量，我造 2 张真卡 → `[1/1] 2 NC-OPEN decision cards`（只数决策表行）；改 `NC-RESOLVED` 后 `PASS`，`--strict` exit 0 |
| 3 M 规模只填 A+D，但 pre-dispatch 要求 C1 表 | 非阻断 | CHANGELOG known issues #1 | 复现：模板 L63「M → Sections A and D」与 L79「everything … appears in the C1 task table」仍矛盾（未修，与披露一致） |
| 4 手工抄模板 vs `init`；`init` 缺 ADR 模板 | 阻断 | 已修 `116fdfb` | 复现：`init` 现写 5 个文件，含 `docs/adr/adr-template.md` |
| 5 空仓 AGENTS.md 占位符仍 PASS | 非阻断 | CHANGELOG known issues #2 | 复现：`init` 后 AGENTS.md 有 8 个 `<fill in>`，`check --strict` 仍 `PASS`（未修，与披露一致） |
| 6 `handoff --init` 让改不存在的 INDEX.md | 阻断 | 已修 `116fdfb` | 复现：`handoff --init` 现写 2 个文件，含表头的 `handoffs/INDEX.md` |
| 附带：Ctrl+D 抛 `AbortError` 堆栈 | 阻断（首印象） | 已修 `116fdfb` | 复现：真 pty 发 `^D` → `Q1 answer [greenfield]: No answers given. No files were changed.`，无堆栈，exit 0 |

判定口径：6 条卡点中 **5 条（含唯一"附带但阻断级"的 Ctrl+D）在 `116fdfb` 有对应 commit 且行为已复现修复**，**2 条非阻断逐字落在 CHANGELOG known issues #1/#2**。无孤儿卡点、无"改了但没记录"、无"记录了但没改"。

### G2b 真实批次：`docs/evidence/realbatch-G2b-gitlog_20261027.txt`（4 行）

```text
7ac2ce4 docs: gate v1 converged (7 steps, TASK-4 backfilled) + handoff per specgate
139ef4b feat: md-toc TASK-1..3 per gate doc v1 (AC-1..4)
360fffb chore: specgate init S0
converge: 12/12 smoke, TOC self-demo, NC 3/3, handoff INDEX, TASK-4 backfilled
```

三连齐全：`360fffb` chore: init → `139ef4b` feat: 实现（AC-1..4）→ `7ac2ce4` docs: converge（7 steps + TASK-4 backfill）。git log 的新→旧顺序写在文件里，读序正确。

**证据强度观察（非阻断）**：这是 4 行摘录，无时间戳、无作者、无仓库标识；第 4 行 `converge: 12/12 smoke…` 是人工汇总行而非 commit，且排在旧 commit 之下。作为"批次真实发生过"的**自证**成立（三连 + converge 明细），但**不可从文件外部独立复核**——建议后续批次改成 `git log --pretty=format:'%h|%ad|%an|%s' --date=iso` 原样落盘。

- **判定：G2 PASS** ✅（G2a 处置链 100% 可追溯；G2b 三连完整，附 1 条证据强度建议）

---

## 四、G3 发布件

### 4.1 LICENSE（MIT 全文 + 版权行）

```text
MIT License

Copyright (c) 2026 specgate contributors

Permission is hereby granted, free of charge, ... (标准 MIT 正文，含
"THE SOFTWARE IS PROVIDED "AS IS"" 免责段与 "substantial portions of the Software" 条款)
```
→ 标准 MIT 全文 + 版权行 `Copyright (c) 2026 specgate contributors`。**PASS**

### 4.2 LICENSES/CC0-1.0.txt

```console
$ shasum -a 256 LICENSES/CC0-1.0.txt
a2010f343487d3f7618affe54f789f5487602331c0a8d03f49e9a7c547cf0499  LICENSES/CC0-1.0.txt
$ wc -l LICENSES/CC0-1.0.txt
     121
$ head -3 LICENSES/CC0-1.0.txt
Creative Commons Legal Code

CC0 1.0 Universal
```
→ 文件存在，`sha256` 以 `a2010f` 开头（与要求一致），正文 121 行 CC0 1.0 Universal 官方文本。**PASS**

### 4.3 CHANGELOG

```text
## [0.1.0] - 2026-10-28
### Added …（11 条，五文档套件 / AGENTS.md scaffold / init / check / 两个 skill / 样例 / INSTALL / 零运行时依赖）
### Known issues
- **M-batch wording contradiction.** … template fix lands in v0.2.
- **Placeholders are advisory.** … a checker lands in v0.2.
- **init owner prompt on Ctrl+D.** … fix lands in v0.2.
```
`awk '/### Known issues/,0' CHANGELOG.md | grep -c '^- **'` → **3**。
→ `[0.1.0]` 段存在（Keep a Changelog + SemVer 声明在头部），known issues **恰好 3 条**。**PASS**
（已知偏差：第 3 条"Ctrl+D 崩"我已复现不出来，见第五节 O-2。）

### 4.4 SECURITY / CONTRIBUTING / issue 模板 / THIRD_PARTY_NOTICES

| 文件 | 要求的核心要素 | 实测 |
| --- | --- | --- |
| `SECURITY.md`（65 行） | 渠道 + 时限 | 渠道：**GitHub Security Advisories**（"Security → Report a vulnerability"，明确要求勿开公开 issue）+ 邮箱兜底；时限：**首次响应 72 小时内**，明确"is acknowledgment, not necessarily a fix"；另含 in/out of scope 与注入面（模板被当指令执行）四道缓解，复现要求（做了什么/期望 vs 实际/Node 版本/平台/最小复现） |
| `CONTRIBUTING.md`（53 行） | 本地跑测 + PR 判据 | `npm test`（= `node test/smoke.mjs`）说明到位；6 条 PR 判据：claims 全绿、不新增未实现的承诺、add-only、ask-first、一个 PR 一件事、CHANGELOG 条目；含 CI 要求（零 `dependencies`、`prepack` 保 src/dist 一致、离线） |
| `.github/ISSUE_TEMPLATE/bug.md` | 复现字段 | Steps to reproduce（编号步骤，带真实命令）、Expected output、**Actual output 要求贴退出码**、Environment（specgate 版本/Node/平台/agent 工具/是否 git 仓）、"Did the kit change your files?"（要求附 `git status --porcelain`） |
| `.github/ISSUE_TEMPLATE/feature.md` | 场景化 + 边界 | Use case（讲故事不写功能名）、Current workaround、Proposed change（最小版本）、"Why it belongs in this kit"（对齐零依赖/离线/add-only/ask-first）、Out of scope（对齐 README known limitations） |
| `THIRD_PARTY_NOTICES.md`（2021 B） | 零依赖声明 | 首行即 **"Zero runtime dependencies. This package declares no `dependencies`."** + 无第三方代码分发 + 归属边界表（src/dist=MIT，templates/skills/docs=CC0）+ 上游 provenance 台账（当前 `(none yet)`）+ 维护规则（新增依赖须抄许可证到 `LICENSES/<id>.txt` 并 pin 版本） |

交叉验证：`package.json` 的 `dependencies`/`devDependencies` 均为 `{}`，与 NOTICES 的零依赖声明一致。

- **判定：G3 PASS** ✅（附 1 条 P1 打磨：SECURITY.md 内 `security@TODO` 占位邮箱，文件自己标注了 "replace with the published security address before release" — 见第五节 O-1）

---

## 五、G4 打包端到端

全程在临时目录执行，不污染仓库：

```console
$ TMP=$(mktemp -d /tmp/sg-verify-XXXXXX)   # → /tmp/sg-verify-RTvwmR
$ npm pack --pack-destination "$TMP"
npm notice shasum: e97d3b5ea537284fc6d2288b3b37ff420bbb4779
npm notice total files: 25
specgate-0.1.0.tgz            # 60,229 bytes
$ shasum -a 256 specgate-0.1.0.tgz
9dca70add6d5ee9071e48f33374d0c6f3d095f32fa4f61f6e957f07521a22829
```

### 5.1 tar 清单 = 25 件，5 个关键项齐

```text
package/LICENSE
package/LICENSES/CC0-1.0.txt        ← CC0 ✅
package/INSTALL.md                  ← INSTALL ✅
package/CHANGELOG.md                ← CHANGELOG ✅
package/THIRD_PARTY_NOTICES.md      ← NOTICES ✅
package/README.zh-CN.md             ← zh-CN ✅
package/README.md
package/package.json
package/templates/{AGENTS.template.md, gate-doc.template.md, gate-doc.example.md}
package/skills/{rose-bootstrap,rose-handoff}/SKILL.md
package/src/*.mjs (6)  package/dist/*.mjs (6)
# 合计 25 行，与 npm notice total files: 25 一致
```
说明：`.github/ISSUE_TEMPLATE/*.md` 与 `docs/` 不在包内 —— 前者是 GitHub 侧资产、后者是"安装 ≠ 引导完成"（F-11）的刻意设计；已用 `tar -tzf | grep -E 'AGENTS\.md$|^package/docs/'` 验证包内**没有**AGENTS.md、也没有 docs/ 树。**PASS**

### 5.2 临时目录安装 → 实跑

```console
$ cd "$TMP/inst" && npm install "$TMP/specgate-0.1.0.tgz" --no-audit --no-fund
added 1 package in 113ms
$ ls node_modules/.bin/    → specgate -> ../specgate/dist/cli.mjs
$ npx --yes specgate --version
specgate 0.1.0        (exit 0)

$ cd proj && git init -q . && npx --yes specgate init . --stage S0 --owner You --project-name Demo
Files to write (5):
  + AGENTS.md  + docs/plans/gate-doc.template.md  + docs/adr/README.md
  + docs/adr/adr-template.md  + .specgate-manifest.json
Done: 5 written, 0 skipped (untouched).          (init-exit=0)

$ npx --yes specgate check . --strict
PASS Demo (stage S0)                              (check-exit=0)
$ find . | sort → AGENTS.md, docs/adr/{README.md,adr-template.md},
                  docs/plans/gate-doc.template.md, .specgate-manifest.json
```
退出码实测：缺失目录 `check /tmp/…` → exit **2**；未知参数 `check . --bogus` → exit **2**（与 CHANGELOG 声明的 usage error = 2 一致）。

**一个必须说清的口径**：`npx --yes specgate …` 只在**装有该包的目录**内解析到本地 bin；在空目录里跑会去 registry 拉包 → 404（因为还没发布，见 G5）。这不是包缺陷，但"用户第一次怎么用"的真实路径是 `npm i -D specgate` 后 `npx specgate …`。我最初在一个未安装的目录里跑，得到 404 + 无文件生成，改到 `inst/` 下重跑才全绿 —— 记录在此以免后来的复验者踩同一个坑。

### 5.3 隐私扫描：0 命中

```console
$ tar -xzf specgate-0.1.0.tgz -C "$TMP/x"
$ grep -rIlE 'suyukun|苏玉坤|/Users/|smashup' "$TMP/x"                  → 0 文件
$ grep -rIlE 'suyukun|苏玉坤|/Users/|smashup' "$TMP/inst/node_modules"  → 0 文件
```
零命中，覆盖包内全部 25 个文件（含 6 个 src、6 个 dist、3 个模板、2 个 skill）。

配套验证（重要，避免误报）：`init` 跑到 `owner "苏玉坤" (git config user.name)` —— 这是**运行时读取本机 git 身份**的既定行为（F-06），不是包内容泄漏；同理它打印的绝对路径来自安装位置。包字节里没有个人路径/姓名。

### 5.4 打包可复现

`npm pack` 会触发 `prepack`（`node scripts/build.mjs`）重建 `dist/`；打完后 `git status --porcelain` **仍为 0 行**（`dist/` 已 gitignore），说明构建产物与源码一致、打包无副作用。

- **判定：G4 PASS** ✅

---

## 六、G5 发布机制

```console
$ node -e "…package.json…"
private = undefined
name = specgate  version = 0.1.0  license = MIT
dependencies = {}  devDependencies = {}

$ npm view specgate --registry=https://registry.npmjs.org
npm error code E404
npm error 404 Not Found - GET https://registry.npmjs.org/specgate - Not found
view-exit=1                        ← 包名可用（但"法律上未被占用"仅指 registry 查询层面）

$ npm whoami
npm error code ENEEDAUTH
npm error need auth This command requires you to be logged in.
whoami-exit=1                      ← 如预期：本机未登录 npm

$ npm config get registry
https://registry.npmmirror.com/

$ git status --porcelain
(status-lines=0)
$ git log --oneline -1
b6f43cf docs: G2 evidence archive (walkthrough + realbatch timeline)
```

| 检查项 | 期望 | 实测 | 判定 |
| --- | --- | --- | --- |
| `package.json` 无 `private: true` | 未设置 | `undefined` | ✅ |
| 包名可用 | 404 | `404 Not Found … GET https://registry.npmjs.org/specgate` | ✅ |
| 本机 npm 认证 | 预期 ENEEDAUTH | `ENEEDAUTH / need auth` | ✅（**待 Jack 明早登录**） |
| git 仓干净 | 0 行 | 0 行（本报告提交前） | ✅ |

**必须提前告诉 Jack 的两件事**（本机现状，非缺陷）：
1. 本机 `registry` 指向 `https://registry.npmmirror.com/`。发布时要显式走官方源：`npm publish --registry=https://registry.npmjs.org`，否则会往镜像发（会被拒），或出现"以为发了实际没发"。登录同理：`npm login --registry=https://registry.npmjs.org`。
2. `npm view` 的 404 只证明"官方 registry 当前没有同名包"，不证明商标/名称使用权没问题（这部分是 Jack 的判断）。

- **判定：G5 PASS** ✅

---

## 七、附加项

### 7.1 smoke 全量

```console
$ node test/smoke.mjs
smoke root: /var/folders/…/T/specgate-smoke-gre84X
T1 empty-dir init --stage S0
  ok   T1 exit 0
  ok   T1 AGENTS.md created
  ok   T1 no {{OWNER}}/{{PROJECT_NAME}}/{{DATE}} left
  …
  ok   T20 INDEX untouched once it exists (add-only)
  ok   T20 skeleton uses the AGENTS.md project name

159 passed, 0 failed  — all green
smoke-exit=0
```
→ 黑盒冒烟 159 条全绿（真跑 CLI、断言 exit code 与磁盘效果）。**PASS**

### 7.2 中文/英文 README 抽查（4 处改动段落，任选 3 处已超）

| 段落 | en | zh | 同步 |
| --- | --- | --- | --- |
| N-02 十分钟引导 | `about 10 minutes with your agent — mostly conversation time`（L26） | `约 10 分钟，其中大部分是对话时间`（L26） | ✅ 口径一致（都限定为对话时间） |
| N-03 冷启动 init | `well under a second (local-copy measurement, no network, excluding the npm download)`（L82） | `远少于一秒（well under a second；本地拷贝口径、不含 npm 下载）`（L82） | ✅ 连测量口径都同步保留 |
| N-05 背书软化 | `shaped by two months of daily use on real project work`（L62） | `shaped by 真实项目两个月的每日使用`（L62） | ✅ 语义同步（但中英混排，见 O-3） |
| N-06 支持矩阵收口 | `verified against documentation at release time (2026-10)`（L76） | `本矩阵于发布时对照各家官方文档核验（2026-10）`（L76） | ✅ 限定语同步 |

claims 里 N-06 的断言也是双语各匹配一条（`verified against documentation at release time` / `对照各家官方文档核验`）——文案同步有机器兜底，这点做得好。

---

## 八、偏差与建议清单（如实记录，本次不修）

| # | 级别 | 偏差 | 证据 | 建议 |
| --- | --- | --- | --- | --- |
| O-1 | **P1（发布前）** | `SECURITY.md` L47 邮箱兜底写成 `security@TODO`，文件自己标注 "replace with the published security address before release"。渠道主体（GitHub Security Advisories）+ 72h 时限都成立，故不判 G3 FAIL；但一个 P1 占位符出现在公开安全政策里很难看，且志愿者真去发信会 bounce | `SECURITY.md:47` | 发布前二选一：换真实邮箱，或删掉邮箱行只留 GitHub Advisories（更推荐，避免长期维护无效邮箱） |
| O-2 | P2（如实性） | CHANGELOG known issues #3 声称"init 的 owner 提问在 Ctrl+D 时抛堆栈"，**当前复现不出来**：真 pty 发 `^D` 后，init 回退到 `git config user.name` 并正常写完 5 个文件；`init < /dev/null` 同样正常。属**过披露**（不是虚假承诺，危害方向相反），但 known issues 的准确性是可信度的一部分 | 我执行的 pty 测试输出（见第三节表格末行 + 附 A） | 发布前一条 `sed` 即可：删掉该条或改成"已在 116fdfb 修复"。若不改，用户按图索骥会找不到现场 |
| O-3 | P3（双语打磨） | `README.zh-CN.md:62` 中文句子中间留了英文短语：`这一流程 shaped by 真实项目两个月的每日使用` | L62 | 改成"这一流程来自真实项目两个月的每日使用" |
| O-4 | P3（证据强度） | G2b 物证是 4 行手抄摘录，无时间戳/作者/仓库标识，第 4 行 converge 汇总是人工行 | 见第三节 G2b | 下批次用 `git log --pretty=format:'%h|%ad|%an|%s' --date=iso` 原样落盘 |
| O-5 | P3（诚实边界） | G4 里"npx --yes specgate"在无安装目录会 404（因为未发布）；这不是缺陷，但复验/演示脚本要写清前提 | 见 5.2 | 演示脚本统一先 `npm i -D specgate` |

**没有任何 FAIL 项。**

---

## 九、总判 + 待 Jack 三批

**readiness：就绪。** G1–G5 全 PASS，附加全绿；剩余动作全是"人拍板/人登录"，不是工程返工。

### 待 Jack 三批（发布前必须由 Jack 本人做的三件事）

1. **许可证确认** —— `LICENSE` 是 MIT、版权行 `Copyright (c) 2026 specgate contributors`（未写个人名）；`templates/`+`skills/`+`docs/` 按 CC0-1.0 释出（`LICENSES/CC0-1.0.txt`，sha256 `a2010f34…`）。请 Jack 确认：① 版权主体用 "specgate contributors" 是否合意；② 是否同意内容层 CC0（等于放弃模板/文档的署名权，惠及用户但不可撤回）。
2. **中文 README 过目** —— `README.zh-CN.md`（8208 B）与英文版逐段对齐，我抽查 4 段语义同步；但 L62 有中英混排（O-3），且语气是否合 Jack 口味只有 Jack 能判。顺带过目 `onboarding.md`、`INSTALL.md`。
3. **发布许可 + npm 登录 + GitHub 仓创建** —— ① 明确"可以发"；② `npm login --registry=https://registry.npmjs.org`（本机当前 ENEEDAUTH，且默认源是 npmmirror，务必带 `--registry`）；③ 建 GitHub 仓库并推 `b6f43cf`+本报告，仓库建好后 `.github/ISSUE_TEMPLATE/` 才生效、`SECURITY.md` 的 Advisories 渠道才可用。

> 建议顺序：先做 O-1（SECURITY 占位）与 O-2（已知问题准确性）两个 5 分钟小改 → 再三批。这两条不改也能发，但会留在首发版里被第一批用户看到。

---

## 附 A：复验方法与可复核性

- **临时目录**（复验结束后保留，便于 Jack 抽查）：`/tmp/sg-verify-RTvwmR/`（`specgate-0.1.0.tgz`、`list.txt`、`x/` 解包、`inst/` 安装、`proj/` init+check 现场）。
- **隐私扫描正则**：`suyukun|苏玉坤|/Users/|smashup`，`grep -rIl` 只列命中文件；对包解包目录与 `node_modules` 各扫一遍。
- **Ctrl+D 复现方法**：`pty.fork()` + `os.write(fd, b'\x04')` 真终端输入（不是 `< /dev/null` 的 EOF 近似），分别测 `start` 与 `init`。
- **NC-OPEN 回归方法**：把一个含 2 行 `NC-OPEN` 决策表的 gate doc 放进 `docs/plans/`，模板正文保持 5 处字面量不动，看 check 报几张卡。
- **本次未覆盖（如实说明，不当作已验）**：真实 `npm publish`、GitHub 仓创建与 CI 实际触发、`init --adopt` 在真实存量仓的表现、多平台（仅 macOS/Node 24 实跑，`engines` 声明 >=18 未在 18 上验证）、第三方 agent 工具对指针文件的真实行为（README 自己也只声明"verified against documentation"）。
