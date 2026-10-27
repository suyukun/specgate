# specgate

**你出想法。规则来拆解。普通 agent 也能盖起大楼。**

高楼从来不是靠天才瓦工一个人砌出来的。普通施工队照着图纸就能盖：开工前有规格、过程有决策记录、交工前有验收。specgate 给 AI 编码 agent 的就是这套图纸——五份纯 markdown 文档，随项目成长。靠流程，不靠天才。

[English](README.md)

## DONE WHEN——30 秒安装验收

让你的 agent 跑一下 `specgate --version`（自己跑也行）：

```bash
specgate --version
```

**DONE WHEN：命令打印出一行版本号。** 这就是全部的安装验收——不配置、不登录、不联网。

想再看一眼？在任意 git 仓库里，让你的 agent 跑 `specgate start`。它会打印三个问题，再打印一条确切的下一步命令。你能读懂那条命令，onboarding 就是通的。

## 最短路径——三步

> 本 README 中所有命令一律 ask-first：agent 先问你，你批准，它才执行。没有任何命令会自己跑。

1. **安装。** 让 agent 跑 `npm i -D specgate`，再用 `specgate --version` 验收——一行版本号＝装好。
2. **路由。** 在你的 git 仓库里，让 agent 跑 `specgate start`。回答三个问题，它会打印一条确切的下一步命令。跟着一起跑完——新项目与 agent 协作全程约 10 分钟，其中大部分是对话时间：AGENTS.md 是和你一起起草的，不是替你写完的。
3. **检查。** 让 agent 跑 `specgate check`。预期输出 `PASS <name> (stage S0)`：仓库根有 `AGENTS.md`，`docs/plans/` 有 gate doc 模板，`docs/adr/` 有决策索引。从此这个仓库自带规则书。

想让 agent 代装？把 [INSTALL.md](INSTALL.md) 交给它——那是写给 agent 的操作说明，同样遵守 ask-first。

## 五件套——按信号添加，不按日程

S0 先装两件。其余文档在项目发出「看得见的信号」后逐件到位。

| 阶段 | 看得见的信号 | 新增 | 防住什么 |
| --- | --- | --- | --- |
| **S0——探索期** | 只有一个想法和骨架，还没有端到端跑通的东西。 | ① Gate doc（规格）在 `docs/plans/` ② 决策日志（ADR）在 `docs/adr/` | 做错东西；忘了当初为什么这么选。 |
| **S1——主流程通了** | 一条命令能在真实数据上端到端跑通主流程。 | ③ 任务看板 ④ 架构文档 | 待办散落在各聊天里；架构没人记得。 |
| **S2——真实使用** | 有真实用户反馈，按请求迭代。 | ⑤ 设计规格 | 两个「事实源」为界面或接口打架。 |
| **S3——已发布** | 公开发布、外部用户、兼容承诺。 | 不加新件——已有门禁收紧。 | 回归问题 reach 到你的用户。 |

阶段只活在 `AGENTS.md` 标题下的一行标记里。升阶是显式事件，凭信号判断——从不凭感觉。

## 四个能力点——默认值、零配置、跨工具

### 1. ADR 决策记录——全流程规则先行（机判校验 v0.2 提供）

决策不停留在聊天记录里。它成为 `docs/adr/` 下的编号文件、进索引，并在使用处被挂钩：关闭 `#decision` 看板卡必须有 `adr:` 引用（或一行豁免说明）；M/L 批 converge 必须引用 ADR；`feat` / `fix` / `perf` / `refactor` 提交信息带 `ADR-NNNN`，或写 `no-adr:` 原因。这些挂钩的机判校验由 check 在 v0.2 提供；现阶段是模板与流程约束。规则全是默认值：零配置、纯 markdown、任意 agent 工具通用。

### 2. 治理断言——制度不靠自觉

`specgate check` 读你的文件并断言规则：阶段标记与已装文档一致；派发前决策卡零未决；验收判据可机判；任务看板已安装。所有发现一次列全，按检查项顺序排列。每条失败都带问题定位、预期样子、确切的修正命令（where / expected / fix）。一行接入 CI——而且只在你要求时才接。

### 3. 决策卡（decision card）——决策变成选择题

规格不清时，agent 写一张编号卡片：一个问题两行以内、a/b/c 选项、一条推荐默认。你回复「1a 2b 3 default」——或只回一次「default」，整批接受推荐。卡片活在唯一台账里，只有三个状态。solo 模式自答自：推荐默认直接生效，你只在真正不同意时改。

### 4. EARS 验收判据——「完成」谁都能验

每条需求都写成 `When <condition>, the system must <observable behavior>`，并写明用哪个测试或命令来验。check 校验句式，对模糊词给出修正。一份完整填好的样例批——决策卡已答、七步 converge 全过——随包附带：[templates/gate-doc.example.md](templates/gate-doc.example.md)。

**随包还有——跨会话交接（handoff）。** `rose-handoff` 技能在会话结束时写一份交接文档，新会话开始时读它，文件在 `handoffs/`。换工具、换窗口的成本估算约五分钟，而不是丢掉一个会话——这一流程 shaped by 真实项目两个月的每日使用。

## 支持矩阵——装完不静默失败

| Agent 工具 | 自动读 `AGENTS.md`？ | 本套件做什么 |
| --- | --- | --- |
| Claude Code | 是 | 无需接线。 |
| Codex CLI | 是 | 无需接线。 |
| Gemini CLI | 是 | 无需接线。 |
| Cursor | 否——读 `.cursor/rules/` | `specgate init` 主动提供一行指针文件；创建前先问你。 |
| GitHub Copilot | 否——读 `.github/copilot-instructions.md` | 同样的一行指针，ask-first。 |
| Windsurf | 否——读 `.windsurf/rules/` | 同样的一行指针，ask-first。 |
| 其他工具 | 若它读自己的规则文件 | 写一行指向 `AGENTS.md`。先问再写。 |

工具读取规则的方式常变。本矩阵于发布时对照各家官方文档核验（2026-10）。`init` 会建议指针文件并经你批准后创建；check 对「指针文件存在且指向 `AGENTS.md`」的校验 v0.2 提供——它也无法核验第三方工具自身的行为。

## 为什么可以放心试

- **一切产物都是你仓库里的纯 markdown。** 没有数据库、没有服务端、没有私有格式。git 历史就是审计记录。
- **`git revert` 即净退出。** 本套件只增文件，从不改你的文件。删掉新增文件——或 revert 对应提交——仓库与从前一模一样。仓库之外没有任何隐藏状态：克隆仓库＋重装套件，一切复原。
- **装后离线可用。** 套件不发起任何网络请求。冷启动 `init` 拷贝模板用时远少于一秒（well under a second；本地拷贝口径、不含 npm 下载）。所有检查本地运行。
- **`init` 永不改已有文件。** 存量仓库接入只增不改：冲突逐条列出、由你拍板——绝不由工具代决。升级也从不改你填过的文件；模板有新版时 check 只提示。

## 已知限制

- **单写者。** 一张看板卡同一时间只归一个工人。v1 没有跨机器锁。两个 agent 要拿同一张卡之前，由你来协调——套件自己拦不住。
- **v1 没有团队面板。** 看板就是 markdown 文件加 CLI。没有仪表盘、没有 web 视图、没有仓库之外的共享状态。
- **check 接线前只是建议。** 它打印 PASS / WARN / FAIL，不写任何文件。接入 pre-commit 或 CI 只需一行——且只在你要求时做。

## 两层披露——走多深由你定

**第 1 层——3 个高频动作。** 绝大多数会话只需要这些，再无其他。

| 命令 | 作用 |
| --- | --- |
| `specgate start` | 唯一入口。三个问题，一条确切的下一步命令。 |
| `specgate check` | 治理断言。所有发现一次列全，每条带修正示例。 |
| `specgate handoff` | 跨会话交接，写或读（`rose-handoff`）。 |

**第 2 层——完整文档链。** 按需、按序读：

1. `templates/AGENTS.template.md`——项目规则模板
2. `templates/gate-doc.template.md`——gate doc 规则书
3. `templates/gate-doc.example.md`——一份填好的完整样例
4. `skills/rose-bootstrap/SKILL.md` 与 `skills/rose-handoff/SKILL.md`——agent 遵循的流程

---

*specgate 是面向 AI 编码 agent 的开源治理套件。它创建的一切都留在你的仓库里。*
