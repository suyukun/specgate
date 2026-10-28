<!-- template_version: 1 -->

# 开工门槛稿 —— 记一笔支出并展示列表（完整样例）

> 这是一份**填好的样例**，不是空白模板。项目（「口袋账本」）、负责人（「小鹿」）与下面全部输出都是虚构。对照 `gate-doc.template.md` 阅读，看「填好的样子」。真实工作请复制空白模板——绝不是本文件。

> Project: 口袋账本 · Batch: expense-entry · Owner: 小鹿 · Created: 2026-10-20

## 从这里开始

| 问题 | 回答 |
| --- | --- |
| 这是什么？ | 一份填好的开工门槛稿：口袋账本（个人记账应用）的第一个真实批次。L 级、with-owner 模式、七步收口全过。 |
| 该注意什么？ | 好答案有多短。A1 只有一句。B2 三条决策。决策台账五张卡：四张已决、一张作废。收口贴的是真实证据，含一条回填任务。 |
| 下一步？ | 复制 `gate-doc.template.md` 开始你自己的批次。空白模板解释每个字段；本样例只展示填好的样子。 |

### 文档状态

> Status: converged
> <!-- 允许值只在模板中定义一次：draft | converged | archived -->

phase: converging
> <!-- 允许值只在模板中定义一次：sizing | drafting | ready | converging -->

## 第 0 步 —— 给批次定级

- 本批级别：**L**
- 理由：新数据 schema＋存储模块＋两个新 UI 组件，且结果在将给首批测试用户演示的路径上。
- 从 L 降级：不适用。

不是 S 批：改动跨三个模块、六个文件。不是 M 批：它引入项目第一个持久化数据模型。

## 派发之前 —— 三查（2026-10-21 派发前全过）

1. 卡片已清：下面的决策台账派发前 `NC-OPEN` 行为零（记录值：0）。
2. 基线真实：D1 命令在 2026-10-21、任何活开工之前跑过；输出贴在 D1。
3. 活在清单上：派发的一切都在 C1 表里。有一个缺口（存储配额提示）来得晚——报告了小鹿，她把它停到看板上，而不是塞进本批。

## A. 需求

- [x] **A1 —— 一句话主张。**
  给一个想知道钱花到哪去的普通人：口袋账本几秒记一笔支出，随时看到流水列表——不用电子表格也能看清一周的花销。

- [x] **A2 —— 用户故事。**
  - P1 —— 作为用户，我添加一笔支出（金额、类别、日期、备注），不用重复输入就保存成功。
  - P1 —— 作为用户，我看到最近支出和本周合计，不再凭感觉花钱。
  - P2 —— 作为用户，我编辑一条记录，改错字不用删了重填。
  - P3 —— 作为用户，我把一个月导出成 CSV，在别处留档。
  P1 闭环独立成立：只有添加＋列表就已经有用，P2/P3 缺席不影响。

- [x] **A3 —— 验收判据。**
  - AC-1: 当我以金额 12.50、类别「餐饮」、日期 2026-10-21 提交录入表单时，系统必须保存该条并在一秒内把它显示在列表顶部。（检查：`src/app.test.tsx — "adds an entry and shows it"`）
  - AC-2: 当列表持有本周的条目时，系统必须在列表头部把合计显示为「本周：<合计>」。（检查：`src/app.test.tsx — "weekly total sums current-week entries"`）
  - AC-3: 当我以空金额提交表单时，系统必须保持表单打开、不保存任何内容，并在字段旁显示「请输入金额」。（检查：`src/app.test.tsx — "rejects empty amount"`）
  - AC-4: 当我提交金额 12.345 时，系统必须以「最多两位小数」拒绝且不保存。（检查：`src/app.test.tsx — "rejects three-decimal amount"`）
  - AC-5: 当我快速连点两次提交时，系统必须恰好保存一条。（检查：`src/app.test.tsx — "double submit stores one entry"`）
  - AC-6: 当存储不可用（隐私浏览模式）时，系统必须显示「存储不可用——条目不会被保存」，而不是白屏。（检查：`src/app.test.tsx — "storage failure banner"`）
  - AC-7: 当一条支出被保存时，其金额必须以整数分（1250）保存，绝不以浮点数。（检查：`src/storage.test.ts — "stores cents"`）

- [x] **A4 —— 边界情形。**
  - 空金额 → 必须报错提示、保留已填数据（AC-3）。
  - 三位小数金额 → 必须拒绝、不保存（AC-4）。
  - 重复提交 → 必须恰好保存一条（AC-5）。
  - 存储写入失败 → 必须告警，不崩溃（AC-6）。

- [x] **A5 —— 非目标。**
  不做编辑（P2）、不做 CSV 导出（P3）、不做多币种、不做云同步、不做图表、不做类别管理（暂固定八个类别）。小鹿 2026-10-21 已同意。

## B. 设计

- [x] **B1 —— 技术上下文。**
  React 18 + TypeScript + Vite，无状态库。新增或修改文件：`src/types/expense.ts`、`src/storage.ts`、`src/components/EntryForm.tsx`、`src/components/EntryList.tsx`、`src/App.tsx`，加测试。数据存浏览器 localStorage，藏在存储模块后面。不许动的依赖边界：不加任何新运行时依赖。测试：组件测试已在位。

- [x] **B2 —— 关键决策。**（3 条，上限 5；每条收口时各成一条 ADR）
  1. 存储 = localStorage 加 JSON 信封，不用 IndexedDB。理由：几百条记录、无需查询；IndexedDB 的异步复杂度目前撑不起。被否：IndexedDB（更重、用不上）、后端（非目标）。→ ADR-0001
  2. 金额 = 端到端整数分，绝不用浮点。理由：浮点会算坏合计；整数分精确，边界处再格式化。被否：浮点加四舍五入（静默漂移）。→ ADR-0002
  3. v1 不上状态库。理由：两个组件一个共享列表，`useState` 放 App 里足够。被否：现在就上 store，等出现第二个视图再加。→ ADR-0003

- [x] **B3 —— 接口与数据契约。**（写成代码）

```ts
// src/types/expense.ts
export type Expense = {
  id: string;            // crypto.randomUUID()
  amountCents: number;   // 整数，恒 > 0
  category: Category;    // CATEGORIES 之一
  date: string;          // "YYYY-MM-DD"
  note: string;          // <= 80 字符，可为 ""
};

// src/storage.ts
export function loadExpenses(): Expense[];          // 解析失败 -> []
export function saveExpense(e: Expense): void;      // 抛 StorageError
```

- [x] **B4 —— 基线自检。**
  - [x] 最小实现：没有设置页、没有货币选择器、没有存储抽象层——B1 的三个模块就是全部改动。
  - [x] 精准改动：每处计划改动都对得上一条 C1 任务；其余未碰。
  - [x] 先问清单：无删除、无 schema 变更、无公共 API、无新依赖、无发布——清单上没有一项适用。

## C. 计划

- [x] **C1 —— 任务表。**

| 任务 | 文件 | 完成检查 |
| --- | --- | --- |
| TASK-101（覆盖 AC-7）——地基：类型＋存储模块 | `src/types/expense.ts`、`src/storage.ts`、`src/storage.test.ts` | 存储测试全绿；`stores cents` 通过 |
| TASK-102（覆盖 AC-1、AC-3、AC-4、AC-5）——录入表单 | `src/components/EntryForm.tsx` | 表单测试全绿 |
| TASK-103（覆盖 AC-1、AC-2）——列表＋本周合计 | `src/components/EntryList.tsx` | 列表测试全绿 |
| TASK-104（覆盖 AC-1、AC-6）——接线 App、存储失败横幅 | `src/App.tsx`、`src/app.test.tsx` | app 测试全绿 |

- [x] **C2 —— 地基任务在前。** TASK-101 解锁 102–104（`Expense` 类型与存储 API）。它的「解锁什么」：全部。
- [x] **C3 —— 并行标记。** TASK-101 之后 TASK-102 `[P]` 与 TASK-103 `[P]`；TASK-104 串行收尾。同时在飞上限：2——在 4 以内。
- [x] **C4 —— 时间盒与止损。** 预期轮数：101 一轮，102 两轮（表单校验），103、104 各一轮。止损写进两份派发单：「同一任务失败两轮 → 停，修规格，禁止第三轮盲修。」

## D. 验收

- [x] **D1 —— 验收命令与基线。**（2026-10-21 录制，开工之前）
  - 命令：`npm run lint` · `npm run typecheck` · `npm test -- src/storage.test.ts src/app.test.tsx`
  - 基线：lint 干净 · typecheck 干净 · 测试 3 过 0 挂（既有冒烟测试）。
- [x] **D2 —— 审查 diff，不是听故事。** 收口时已填 diff 对照表（见下）。
- [x] **D3 —— 演示路径。** 模式：**with-owner**（L 批，将给测试用户演示）。
  1. 请小鹿启动开发服务器，打开应用。
  2. 输入 12.50、选「餐饮」、日期保持今天、备注「午饭」→ 提交。
  3. 条目出现在列表顶部；「本周:」合计增加了 12.50。
  4. 清空金额 → 提交 → 「请输入金额」，没有保存任何东西。
  5. 刷新页面 → 条目还在。
- [x] **D4 —— 一句话完成定义。** AC-1 至 AC-7 全部由 D1 命令验证通过，且小鹿亲自走完演示——别的都不算。

## 决策卡（needs-clarification 协议）

模式：**with-owner**。卡片 2026-10-21 一批发给小鹿；小鹿回复「1a 2a 3b 4 default; 5 n/a」。

### 决策台账

| # | 问题 | 推荐 | 状态 |
| --- | --- | --- | --- |
| NC-1 | v1 货币怎么处理？ a) 单一货币，按浏览器区域设置 b) 每笔带货币代码 | a | NC-RESOLVED: 1a——单一货币取区域设置；多币种停到看板 |
| NC-2 | 条目存在哪？ a) localStorage JSON 信封 b) IndexedDB | a | NC-RESOLVED: 2a——localStorage（ADR-0001） |
| NC-3 | 金额怎么存？ a) 浮点加显示时四舍五入 b) 整数分 | b | NC-RESOLVED: 3b——整数分（ADR-0002） |
| NC-4 | 日期字段默认什么？ a) 今天，可改 b) 空，必填 | a | NC-RESOLVED: default——今天，可改 |
| NC-5 | 列表要不要常驻显示离线/低存储警告？ | n/a | NC-N/A——移出范围；看板卡 BOARD-14 接着 |

## 收口 —— 七步（2026-10-22 全过）

1. **基线绿。** lint 干净 · typecheck 干净 · 聚焦测试 14 过 0 挂。基线里的 3 条既有测试仍过——无回归。
2. **diff 对齐。**

   | 改动文件 | 覆盖的任务 / AC | 在范围内？ |
   | --- | --- | --- |
   | `src/types/expense.ts` | TASK-101、AC-7 | 是 |
   | `src/storage.ts` ＋测试 | TASK-101、AC-7 | 是 |
   | `src/components/EntryForm.tsx` | TASK-102、AC-1/3/4/5 | 是 |
   | `src/components/EntryList.tsx` | TASK-103、AC-1/2 | 是 |
   | `src/App.tsx` ＋ `src/app.test.tsx` | TASK-104、AC-1/6 | 是 |

   无范围外改动。审查时发现一个没做完的边角——未来日期条目进入本周合计的怪癖。回填为 **TASK-105（覆盖 AC-2）：本周合计排除未来日期条目；完成检查：`weekly total ignores future entries` 测试绿。**没有口头豁免，也没有丢弃。

3. **演示走通。** 小鹿 2026-10-22 走完五步演示；全部与所写一致（第 4 步提示语为「请输入金额」）。
4. **卡片全清。** 四张 `NC-RESOLVED`、一张 `NC-N/A`；`NC-OPEN` 为零。
5. **状态与提交。** 上方 Status 已改为 `converged`。交付提交 `f3a9c21`——信息："feat: record and list expenses (docs/plans/gate-expense-entry_v1.md)"。
6. **交接行。** 同一提交追加进 `handoffs/handoff-2026-10-22-expense-entry.md`：「批次 expense-entry 收口：添加＋列表＋本周合计上线；TASK-105（未来日期合计）已回填；下一批大概是 edit-entry（P2）。」
7. **架构现状。** `docs/architecture/current.md` 同一提交更新：App 现在渲染 EntryForm＋EntryList；两者都走 `src/storage.ts`（localStorage，按 ADR-0001 的 JSON 信封）；金额按 ADR-0002 用整数分。

## 运行时条款

未触发：没有任何任务进入第二轮返工；止损没有触发。TASK-105 是审查时发现的，在任何返工之前。
