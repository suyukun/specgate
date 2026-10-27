# onboarding 设计文档 —— `specgate start` 单入口

> 状态：设计稿 v1（2026-10-27）。配套文件：同目录 `README.md` / `README.zh-CN.md` / `INSTALL.md`。
> 口径来源：`docs/research/精品插件方法论调研_20261027.md`（Q2 onboarding＝一个可验证判据＋一条最短路径；Q4 技巧 1/3/4 必落地）；`docs/plans/裁决表-五件套插件_v2.md`（卖点四件、信任卖点、已知限制、性能口径）。
> 命名注记：包名与命令前缀当前用工作名 `specgate`（npm 可用）。最终命名批复后，对 `specgate` 字符串做全局替换即可，名字已集中出现；技能名 `rose-bootstrap` / `rose-handoff` 是已定稿产物，不随包名变化。本文全部「单入口」均指 `specgate start`。

## 0. 设计原则（方法论落地）

| 原则 | 落地点 |
| --- | --- |
| Onboarding＝一个可验证判据＋一条最短路径；不做功能导览 | 每条路径一个 DONE WHEN；`start` 只打印一条下一步命令 |
| 单入口路由：命令再多，对外只暴露一个入口 | 第 1 层只有 start / check / handoff 三个动作；直接命令 `profile full` 显式解锁 |
| 错误三段式：定位→正例→下一步命令；一次列全；失败不写文件 | 第 4 节规范＋5 个样例 |
| 第一次验证在 30 秒内完成 | 安装验收＝`specgate --version` 打印一行版本号 |
| ask-first 是全程纪律 | README 全部命令 ask-first 句式；INSTALL.md Rules 第 1 条 |

## 1. `specgate start` 的行为定义

### 1.1 只读预检（先看后问）

进入仓库先做只读探测。能自动回答的问题，不问用户：

| 探测项 | 手段 | 影响 |
| --- | --- | --- |
| 是否 git 仓库 | `git rev-parse --is-inside-work-tree` | 否 → 错误样例 1，不进入问答 |
| 是否已有 AGENTS.md | 文件存在性 | 有 → Q3 默认「只查」；且永不修改该文件 |
| docs/ 结构 | `docs/plans/`、`docs/adr/`、`backlog/` 存在性 | 缺什么，空态文案直说 |
| stage 标记 | 读 AGENTS.md 标题下的标记行 | 有 S1+ 标记但缺件 → 路由到「补缺件」 |
| 决策者 | AGENTS.md 的 OWNER 字段 | OWNER=me → Q2 默认 solo |

### 1.2 三问（每题两行以内、带推荐默认、回车即默认）

- **Q1 仓库状态**：全新项目 / 已有代码要补治理？（探测到代码而无 AGENTS.md → 默认后者）
- **Q2 决策方式**：solo（我一人拍板）/ with-owner（另有决策人）？（OWNER=me → 默认 solo）
- **Q3 本次意图**：搭治理 / 补缺件 / 只查不合规？（无 AGENTS.md → 默认搭治理；有 → 默认只查）

不问第四个问题。需要更多信息的部分交给后续技能对话（`rose-bootstrap` 的 5 问）——`start` 只负责路由。

### 1.3 输出（固定格式）

```text
Route: <A|B> · mode: <solo|with-owner>
Next:  <一条确切命令，含参数>
After: <执行后应看到的一行预期>   ← 该路径 DONE WHEN 的预告
```

三问的答案只驱动路由，不落盘。落盘的是后续技能产出的文档（AGENTS.md、gate doc、ADR）。

## 2. 三路径路由逻辑与 DONE WHEN

### 路径 A —— 新用户（greenfield）

- 路由条件：Q1＝全新项目。
- 打印命令：进入 `rose-bootstrap` 技能流程（5 问 → 起草 AGENTS.md → 安装 S0 两件）。
- 时间预期如实告知：约 10 分钟。是与用户协作起草，不是脚本秒级完成。
- **DONE WHEN（A）**：仓库根存在 `AGENTS.md` 且无 `{{占位符}}`；标题下有 `<!-- stage: S0 -->`；`docs/plans/gate-doc.template.md` 与 `docs/adr/README.md` 存在；`specgate check` 输出 `PASS (stage S0)`。

### 路径 B —— 存量仓库（adopt）

- 路由条件：Q1＝已有代码。
- 打印命令：`specgate init --adopt`（add-only）。
- 关键规则：已有 AGENTS.md 不覆盖 → 产出合并提案（缺哪些节、哪些规则冲突）逐行由人拍板；旧 to-do 原地不动，到 S1 上板时再统一登记并冻结旧清单。
- **DONE WHEN（B）**：`git status` 只有新增、无修改；冲突清单（如有）已交用户逐条裁决；`specgate check` 输出 `PASS (stage S0)`，或明确列出未决冲突项——后者不算失败，算「等待裁决」的诚实状态。

### 路径 C —— solo 模式

- 路由条件：Q2＝solo。注意：C 是横跨 A/B 的模式开关，不是第三种仓库状态。
- 生效点：AGENTS.md 的 OWNER 写 `me`；决策卡自答自（推荐默认直接生效）；D3 验收演示默认 `scripted`（录档），不再是 `with-owner`。
- **DONE WHEN（C）**：AGENTS.md 的 OWNER=me；第一份 gate doc 的 decision ledger 中卡片为 `NC-RESOLVED`（自答）或 `NC-N/A`；D3 模式标注 `scripted`；`specgate check` PASS。

### 路由矩阵

| Q1 | Q2 | Q3 | 打印的命令 |
| --- | --- | --- | --- |
| 全新 | solo | 搭治理 | `rose-bootstrap`（solo 模式） |
| 全新 | with-owner | 搭治理 | `rose-bootstrap` |
| 存量 | 任意 | 搭治理 | `specgate init --adopt` |
| 存量 | 任意 | 补缺件 | `specgate init --adopt --fill` |
| 任意 | 任意 | 只查 | `specgate check`（不改任何文件） |

## 3. 空态微文案（三状态三句话，每句只有一个动作）

| 状态 | 文案（产品文案为英文） | 唯一动作 |
| --- | --- | --- |
| 空仓库 | `No governance files yet. AGENTS.md is the first one.` | run `specgate start` |
| 有 AGENTS.md 缺件 | `AGENTS.md found. Missing: ADR index, gate-doc template.` | run `specgate init --fill` |
| 有冲突 | `2 rule conflicts found.` | run `specgate check --conflicts` |

## 4. 错误提示三段式 —— 规范与 5 个样例

**规范**：每条错误＝定位（`文件:行 [规则]`）→ 反例 / 正例各一行 → `Next:` 下一步命令；一次列全、按文件行序；校验失败时一个文件都不写，末行固定打印 `No files were changed.`。

**样例 1 · 不是 git 仓库**（预检失败，新用户最高频）

```text
✗ . [precondition] Not a git repository. Rollback needs version control.
  Wrong:   bootstrap in an un-initialized directory
  Correct: git init && git commit --allow-empty -m "chore: init"
  Next:    ask the user, then: specgate start
No files were changed.
```

**样例 2 · AGENTS.md 占位符未替换**

```text
✗ AGENTS.md:6 [adopt] Placeholder {{OWNER}} not replaced.
  Wrong:   | {{OWNER}} | the decision-maker |
  Correct: | me | the decision-maker (solo) |
  Next:    grep -n "{{" AGENTS.md  → replace all, then: specgate check
No files were changed.
```

**样例 3 · 派发前有未决决策卡**（kickoff gate）

```text
✗ docs/plans/gate-expense_v1.md:18 [kickoff] 2 NC-OPEN cards — no coding dispatch.
  Correct: | NC-1 | currency? | a | NC-RESOLVED: 1a — single currency; multi parked on the board |
  Next:    send cards as one batch; reply "1a 2 default"; then: specgate check
No files were changed.
```

**样例 4 · 验收判据不合 EARS 句式**

```text
✗ docs/plans/gate-search_v1.md:31 [ac] AC-3 uses vague word "reasonably" — not checkable.
  Wrong:   The search must be reasonably fast.
  Correct: AC-3: When the user submits a query, the system must return results within 2s.
           (check: src/search.test.ts "latency")
  Next:    rewrite all flagged ACs, then: specgate check   ← fix the full list at once
No files were changed.
```

**样例 5 · converge 缺 ADR 引用**

```text
✗ docs/plans/gate-payment_v1.md:88 [adr] L batch converging without an adr: reference.
  Wrong:   (converge section carries no ADR line)
  Correct: B2 decision 1 → docs/adr/0001-storage.md; commit "feat: payment (ADR-0001)"
  Next:    write the ADR + its index entry, then: specgate check
No files were changed.
```

样例选择依据：样例 1 是预检失败；样例 2–5 覆盖 `check` 的四个断言族（adopt 完整性 / kickoff 卡清零 / AC 句式 / ADR 挂钩），是新用户最可能踩到的第一批失败。垫片（指针文件缺失）不进错误样例：它由 README 支持矩阵与 `init` 的 offer 流程兜住，不是 `check` 的失败项。

## 5. 与 README / INSTALL 的接口

- README 的 DONE WHEN（`--version` 一行版本 / `start` 响应）＝安装验收，对应 `INSTALL.md` 的 DONE WHEN；本文件第 2 节的路径 DONE WHEN＝路由后的目标态。
- `start` 打印的命令永远 ask-first：由宿主 agent 向用户复述并获批准后执行；`INSTALL.md` Step 4 对此有同样的纪律条款。
- 空态文案（第 3 节）与错误样例（第 4 节）共同保证「跑不通时也知道下一步敲什么」——这是方法论判断初中级用户去留的临界点。

## 6. 性能与验证口径（按裁决表）

- `init` 冷启动 ≤3s：纯 node 拷贝口径（本地模板复制；不含网络、不含 npm install 耗时）。
- backlog（看板）命令性能另行实测后补充；v1 文档不对其承诺。
- 装好后全程离线可用（已写入 README 信任卖点）。
- 本设计稿所有 DONE WHEN 均为「可执行命令＋预期输出」，不引入「感觉成功」这一档。
