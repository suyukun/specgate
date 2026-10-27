# specgate 初次上手走查报告（初中级开发者视角）

> 走查人设定：会写代码、偶尔让 AI 帮忙、没有自己的开发方法论、第一次接触这个工具。
> 只读了 `/tmp/sg-e2e/pkg/` 内的 README、INSTALL、模板、技能文件；没有看源码，没有联网，没有访问 pkg 以外的任何项目文档。
> 安装方式：按任务要求用 `node /tmp/sg-e2e/pkg/dist/cli.mjs <命令>` 代替全局安装（下文简写为 `$SG <命令>`）。
> 实操仓库：`/tmp/sg-e2e/ferment-tracker`（git 空仓），虚构项目「Ferment — 酸种酵头喂养记录 CLI」。
> 时间口径：T+ 是我执行命令的墙钟（从 20:40:40 起算），读文档和犹豫的时间穿插其中；折算成人类体感约 12–15 分钟（估算，非精确）。没到 30 分钟；走到第 6 个卡点停止，这基本也是文档引导路径的尽头。

---

## 一、时间线流水账

| 时间 | 命令 / 动作 | 结果 | 心情一句话 |
| --- | --- | --- | --- |
| T+0.0 | 读 `README.md`、`INSTALL.md`、`package.json` | 读完。知道有 `start` / `check` / `handoff` / `init`，S0 只要两份文档，版本 0.1.0 | 文案很会卖，「30 秒安装测试」让我愿意试一下 |
| T+0.4 | `node --version`；`$SG --version` | `v24.21.0`；`specgate 0.1.0`，exit 0 | 第一关过了，有点信心 |
| T+0.5 | `git init`；`$SG start`（stdin 关闭，非交互） | 三问自动取了默认值；打印 `Route: A · mode: solo`；`Next: rose-bootstrap skill (solo mode) — /private/tmp/sg-e2e/pkg/skills/rose-bootstrap/SKILL.md`；`Ask-first: the command above...` | 等等，下一步是……一个 .md 文件？「上面的命令」在哪？ |
| T+0.7 | `$SG --help`；`$SG init --help` | 发现 `init` 能「Scaffold AGENTS.md + stage docs」，一条命令搞定 | 原来有捷径，可 `start` 为什么不告诉我 |
| T+0.8–1.1 | 读 `skills/rose-bootstrap/SKILL.md`、`templates/AGENTS.template.md`（326 行）、`gate-doc.template.md`（224 行）、`gate-doc.example.md` | 读完了，信息量很大；skill 让我「Copy, do not invent」 | 像同时读产品说明书、员工手册和考试大纲，有点喘 |
| T+1.2 | 手工 `cp` AGENTS 模板、gate-doc 模板；从 AGENTS 模板 Appendix A 抠出 ADR 模板；建 `docs/adr/README.md`；替换十几处 `{{...}}`，补 overview/stack/commands | 文件建齐；但「真实命令」「真实代码片段」在空仓里没有，只能写 `not set up yet` / `No project code exists yet` | 手工抄模板没问题，抄完不知道算不算「填好」 |
| T+1.6 | 按 skill step 4 建 `docs/adr/adr-template.md` + 空索引 | 成功 | 这一步文档说得清楚，顺利 |
| T+1.8 | `$SG check` | `PASS ferment-tracker (stage S0)`，exit 0 | 松了口气，至少 check 认可 |
| T+2.2 | `node --test test/feed.test.js`；`node --test test/status.test.js`（D1 baseline） | 两个都 exit 1，`Could not find ...`；单独 `node --test` 报 0 tests | 空仓的「baseline」就是文件不存在，这算 baseline 吗？ |
| T+2.4 | 写第一份 gate doc `docs/plans/gate-feed-command_v1.md`（M 规模，A + D，两张卡 NC-OPEN） | 写完，自我感觉良好 | 第一次觉得「开工前先写清楚」是有用的 |
| T+2.6 | `$SG check` | `WARN`：`5 NC-OPEN decision cards`，行 23/27/38/98/99；提示「resolve before dispatch」 | 我只写了 2 张卡，哪来的 5 张？ |
| T+2.75 | 把两张卡都改成 `NC-RESOLVED`，再 `$SG check` / `check --strict` | 仍报 `2 NC-OPEN decision cards`（行 23/27）；`--strict` 直接 `FAIL`，exit 1 | 按它说的做了，为什么还不过？开始怀疑自己 |
| T+2.9 | `grep -c "NC-OPEN"` + `grep -n` | 结果是 2；命中的是模板正文「contains an `NC-OPEN` decision card」和那行 `grep -c` 命令本身 | 原来它把模板自己的话也算进去了，这不是坑人吗 |
| T+3.1 | 改写模板正文那两句（不再出现 `NC-OPEN` 字面量），再 `check --strict` | `PASS`，exit 0 | 过了，但我是改规则书才过的，心里不舒服 |
| T+3.2 | `$SG handoff --help`；`$SG handoff` | 正常，明确写着 read-only、writes nothing，给出三段式骨架 | 这个命令清楚，印象分回来一点 |
| T+3.3 | `$SG handoff --init --topic first-batch` | 写了 1 个文件 `handoffs/handoff-2026-10-27-first-batch.md`；提示「add the entry to handoffs/INDEX.md」 | 又让我更新一个不存在的东西 |
| T+3.5 | 另起空仓 `/tmp/sg-e2e/init-demo`，`$SG init`；`$SG check` | 4 个文件，直接 `PASS`；但 AGENTS.md 里还有 9 个 `<fill in>`，也没生成 `docs/adr/adr-template.md` | 一条命令就完了，那我前面手工复制图什么 |
| T+3.8 | 伪终端跑 `start`，在 Q1 按 Ctrl+D | 未捕获的 `AbortError: Aborted with Ctrl+D` + Node 堆栈 | 按 Ctrl+D 直接崩，虽然不影响主流程，但很吓人 |
| T+3.9 | 伪终端跑 `start`，依次输入 1/1/1 | 三问正常，仍然打印 `Next: ...SKILL.md`，仍说 `the command above` | 确认了：它就是不给一条能敲的命令 |
| T+4.0 | 收尾：`find` + `git status` + `check` | 仓库 6 个文件，全部 untracked（没 commit）；`PASS` | 东西是齐的，但流程里有两三处让我不信任 |

> 补充：我全程没有 commit。文档只在 converge（七步全过）时才要求提交，而我没有进入写代码/交付阶段，所以停在「gate doc 已写、未 dispatch」。

---

## 二、卡点清单（共 6 条）

### 卡点 1 — `start` 的「下一步」不是命令，而是一个 skill 文件路径

- **位置**：README「The shortest path」第 2 步；`specgate start` 输出最后三行；`skills/rose-bootstrap/SKILL.md` 全文。
- **现象**：`start` 三问答完，打印 `Next: rose-bootstrap skill (solo mode) — /private/tmp/sg-e2e/pkg/skills/rose-bootstrap/SKILL.md`，紧接着写 `Ask-first: the command above runs only after you approve it`。但上面没有命令，只有一个 `.md` 路径。我不知道下一步该敲什么；如果我的 agent 不支持 skill，这个路径等于让我自己读 103 行、再手工复制模板。README 承诺的「one exact next command」没有出现。
- **我猜的原因**：路由把「给 agent 的 skill 文档」当成「给用户的命令」来打印；真正能一条命令完成脚手架的 `specgate init` 没有出现在 route 里（我是后来翻 `--help` 才看到）。
- **我想要的帮助**：`start` 直接打印可执行命令（例如 `node .../dist/cli.mjs init`），或者明确写「把下面这个文件交给你的 agent，并对它说：按这个执行」；把 `the command above` 改成 `the step above`。

### 卡点 2 — `check` 把模板正文里的 `NC-OPEN` 字样当成未决卡，按提示改也清不掉

- **位置**：`templates/gate-doc.template.md` 的 kickoff gate 段（「contains an `NC-OPEN` decision card」+ `grep -c "NC-OPEN"` 命令）；`specgate check` 输出。
- **现象**：gate doc 里我只写了 2 张卡，`check` 报 **5 张** `NC-OPEN`（行 23/27/38/98/99；98/99 才是决策表的 2 行，另外 3 处不是卡：2 处是模板正文，1 处是我写的状态句）。把 2 张卡都改成 `NC-RESOLVED`、按提示 rerun 后，仍报 **2 张**（行 23/27），`--strict` 直接 `FAIL`。只有把模板自带的「contains an `NC-OPEN` decision card」和 `grep -c "NC-OPEN"` 两句改写掉，才 `PASS`。更矛盾的是：模板自己要求 `grep -c "NC-OPEN"` 的结果为 0，可这两句就在文件里，结果永远 ≥2。
- **我猜的原因**：`check` 用全文出现次数统计，而不是匹配决策表里状态列为 `NC-OPEN` 的行；模板正文又自引用这个关键字，形成死循环。
- **我想要的帮助**：`check` 只统计决策表行（`| NC-... | ... | NC-OPEN |`）；模板正文别出现关键字字面量；报数时说清是「卡片数」还是「出现次数」。

### 卡点 3 — M 规模只填 A 和 D，但 dispatch 前检查又要求 C1 任务表

- **位置**：`gate-doc.template.md` 的 Step 0 表（M: Sections A and D）；同一文件「Before you dispatch — three checks」第 3 条（C1 task table）。
- **现象**：我按 M 填完 A、D，C 段写 `Skipped — M batch`；结果第 3 条无法满足：「Everything about to be dispatched appears in the C1 task table」，可 M 根本不用填 C。我不知道该补 C1，还是当这条不存在。
- **我猜的原因**：尺寸表与 pre-dispatch 检查来自不同版本的规则，没有对齐。
- **我想要的帮助**：明确 M 是否必须 C1；若必须，把 Step 0 表改成 `A + C1 + D`；若不必，把第 3 条限定为 L 批次。

### 卡点 4 — 手工复制模板 vs 一条命令 `init`，文档没接上；`init` 还少一个 ADR 模板

- **位置**：README 第 2 步；`rose-bootstrap` skill step 4；`specgate init` 输出。
- **现象**：按 skill 我手工 copy 了 AGENTS 模板、gate-doc 模板、从 Appendix A 抠出 ADR 模板、建索引，替换十几处占位符；后来发现 `specgate init` 一条命令就生成 4 个文件并直接 `PASS`。但 `init` 不生成 `docs/adr/adr-template.md`（skill 要求有），而且 `start` 完全不提它。
- **我猜的原因**：npm CLI 和 agent skill 是两条并行入口，文档各写各的，没有互相指路。
- **我想要的帮助**：skill step 4 加一句「或直接运行 `specgate init`」；`init` 补上 `adr-template.md`；`start` 的路由里提一下 init。

### 卡点 5 — 空仓的 AGENTS.md 要求「真实命令 / 真实代码片段」，但空仓没有

- **位置**：`AGENTS.template.md` 的 Commands / Coding standards 段；skill step 2「Never ship a file with placeholders left in」。
- **现象**：新仓没有 install / test / lint 命令，也没有代码可贴。我只能写 `npm install (no dependencies yet)`、`not set up yet`、`No project code exists yet` 这类占位；不知道这算不算「填好」。`init` 生成的 AGENTS.md 也留着 9 个 `<fill in>`，`check` 却照样 `PASS`——机器也不检查。
- **我猜的原因**：模板默认面向已有项目；空仓（greenfield S0）场景没有给默认文案，也没有说明可以留到第一批代码后再填。
- **我想要的帮助**：模板里给空仓的合法写法（例如 `not set up yet — add at S1`），或 skill 明说空仓可以先留空；`check` 对未填的 `<fill in>` 给 `WARN`，而不是静默 `PASS`。

### 卡点 6 — `handoff --init` 让更新 `INDEX.md`，但 INDEX.md 不存在

- **位置**：`specgate handoff --init` 的输出「Next: ... add the entry to handoffs/INDEX.md」；handoff skeleton 的读法「`handoffs/INDEX.md` first」。
- **现象**：`--init` 只写了 `handoffs/handoff-2026-10-27-first-batch.md`，随后让我把条目加到 `handoffs/INDEX.md`；仓库里没有这个文件，也没给格式。可读 handoff 的入口偏偏又是「INDEX.md first」。
- **我猜的原因**：`--init` 只负责生成 skeleton，不负责生成/维护索引；文档默认索引已存在。
- **我想要的帮助**：`--init` 同时生成 `INDEX.md` 的表头（或打印一行可直接粘贴的索引行）；读 handoff 时若索引缺失，提示「读最新的 `handoff-*.md`」而不是先指 INDEX。

### 附带观察（不计入 6 条）

- 在第一个问题按 Ctrl+D（EOF），进程抛未捕获的 `AbortError: Aborted with Ctrl+D` 和 Node 堆栈，而不是友好退出。边缘操作，但第一印象不好。
- `check` / `handoff` 用目录名 `ferment-tracker` 当项目名，而不是 AGENTS.md 里的 `Ferment`。不影响功能，但看着不专业。
- `init` 生成的 AGENTS.md 留着 9 个 `<fill in>` 仍 `PASS`，说明 `PASS` 只代表「文件在、stage 标记在」，不代表「内容填好」。README 的措辞容易让人误解为后者。

---

## 三、三判断

### ① 前 10 分钟我会不会放弃？为什么？

**不会在前 10 分钟放弃，但会在第 8–12 分钟动摇。** 前 3 分钟很顺：`--version` 一条线、`start` 三个问题、`check` 直接 `PASS`，正反馈很足。真正想关掉窗口是在写完第一份 gate doc、跑 `check` 的那一刻：我只写了 2 张未决卡，它说有 5 张；我按它说的全改成 resolved，它还说有 2 张，`--strict` 直接 FAIL。如果旁边没人告诉我「这是误报，改模板正文就好」，我大概率会认定「这工具坏了」，然后把 check 从流程里删掉——而这恰好是它最核心的卖点。

### ② 这个工具我最可能用在什么地方？

**一个人用 Claude Code / Codex 写的小项目**：需要一个能直接抄的 `AGENTS.md`（项目规则、命令、边界），外加一份「开工前先把 spec 写清楚」的 gate doc 模板。尤其是那种「每次开新会话都要重新解释一遍项目规矩」的场景。不会用在团队协作/看板（v1 自己说了没有多人锁、没有面板），也不会用在只想快速 demo 的一次性脚本。

### ③ 我愿不愿意推荐给同事？一句话理由

**愿意，但只推荐给已经在用 AI 写代码、且愿意读文档的同事——它值钱的是那套 markdown 规则和 gate doc 结构，不是 CLI 的顺滑度；我会先提醒他 `check` 的 `NC-OPEN` 会误报，别被吓到。**

---

## 附：本次实际产生的文件

仓库 `/tmp/sg-e2e/ferment-tracker`（未 commit，全部 untracked）：

- `AGENTS.md` — 从模板填充（Ferment，owner me，S0）
- `docs/plans/gate-doc.template.md` — 模板原样复制
- `docs/plans/gate-feed-command_v1.md` — 第一份 gate doc（M 规模，A + D，2 张卡已 resolved）
- `docs/adr/README.md` — 空索引
- `docs/adr/adr-template.md` — 从 AGENTS 模板 Appendix A 抠出
- `handoffs/handoff-2026-10-27-first-batch.md` — `handoff --init` 生成的骨架（未填，未建 INDEX.md）

对照仓库 `/tmp/sg-e2e/init-demo`（仅用于对比 `specgate init`）：`AGENTS.md`、`docs/plans/gate-doc.template.md`、`docs/adr/README.md`、`.specgate-manifest.json`。
