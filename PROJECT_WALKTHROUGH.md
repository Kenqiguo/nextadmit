# NextAdmit 项目讲解：求职展示第一版

## 1. 用一句话解释项目

NextAdmit 是面向美国大学转学申请者、尤其国际学生的前端原型，把申请背景与录取结果完整展示，并提供大学目录，帮助读者理解结果背后的背景。

- 在线演示：https://kenqiguo.github.io/nextadmit/
- 代码仓库：https://github.com/Kenqiguo/nextadmit
- 已实现的是浏览器本地原型。8 个内置案例是虚构示例；没有共享数据库、账号或已验证的真实用户规模。
- 大学目录有 207 条记录，这表示数据集大小，不是用户数。排名固定为 2026 版，费用为 2023–24 历史预算。

## 2. 主要文件各自负责什么

| 文件 | 作用 | 建议先看哪里 |
| --- | --- | --- |
| `dist/index.html` | 页面骨架、筛选框、投稿表单、脚本加载顺序 | `filters`、`share-form`、底部 script |
| `dist/app.js` | 8 个示例、读取本地数据、筛选、表单验证与保存 | `records()`、`filtered()`、submit 监听器 |
| `dist/profile-order.js` | 把申请学期与提交日期转换成可比较的值 | `applicationTermValue()`、`submissionTime()`、`sortProfiles()` |
| `dist/community.js` | 完整展开案例、英语字段切换、大学目录与详情 | `fullProfile()`、`syncEnglish()`、`renderUniversities()` |
| `dist/story.js` | Our Story 页面、导航补充、排序菜单 | `existingRoute` 和新的 `route()` |
| `dist/style.css` | 最初的样式 | 表单、按钮、基础布局 |
| `dist/community.css` | 阅读优先布局和响应式覆盖样式 | `.profile-row`、`.uni-row`、媒体查询 |
| `dist/universities.json` | 已处理好的大学静态数据 | 一条记录的 rank、city、cost 等字段 |
| `server.cjs` | 使用 Node 内置模块提供本地 HTTP 文件服务 | `http.createServer()`；它不保存投稿 |
| `package.json`、`START-WINDOWS.cmd` | 本地启动入口 | `npm.cmd start` 最终执行 `node server.cjs` |
| `.github/workflows/pages.yml` | 在 GitHub Actions 中发布 dist 到 Pages | 上传产物的 `path: dist` |
| `DATA_SOURCES.md` | 排名、IPEDS 数据来源及费用计算口径 | 年份、原始下载链接、变量定义 |
| `README.md` | 面向访客的英文项目说明 | 功能、限制、运行与演示链接 |

加载顺序是 `profile-order.js → app.js → community.js → story.js`。后面的文件覆盖部分 `render()` 和 `route()`，所以不能只读 app.js 就判断最终页面。现有结构能运行，但以后维护时需要注意重复监听器与函数覆盖；本轮没有重构。

## 3. 筛选是怎么实现的

`records()` 把浏览器本地记录与内置样例合在一起。`filtered()` 读取筛选框和搜索框，再用数组的 `filter()` 逐步保留匹配记录。

1. 学期、专业、原学校类型、学生背景按选中值匹配。
2. GPA 范围包含下界、不含上界。例如 3.50–3.79 使用 `gpa >= 3.5 && gpa < 3.8`。
3. 搜索文字去除两端空格并转小写，以便不区分大小写。
4. 选择录取状态时，用 `decisions.some()` 检查是否存在符合条件的决定。大学名称与状态要在同一条决定里匹配；专业或原学校也可作为搜索内容。
5. GPA 高低排序在 `filtered()` 中处理；时间排序随后交给 `sortProfiles()`。

输入框的 `input` 事件和下拉框的 `change` 事件触发重新渲染。`community.js` 的 `render()` 将筛选、排序后的记录交给 `fullProfile()`，形成完整展开的 HTML。搜索目前不包含昵称。

大学目录有自己的筛选逻辑：`renderUniversities()` 按英文名称、中文别名、城市或州搜索，并按排名区间和公私立类型过滤。数据通过 `fetch('universities.json')` 从本站静态文件读取，没有在请求学校数据库。

## 4. 两种时间排序为什么不同

“Application term” 是申请的学期；“Recently submitted” 是在本网站保存记录的时间。今天提交 Fall 2025 的案例，不会让它变成 Fall 2026 的申请。

`applicationTermValue()` 把年份乘以 10，再加季节序号：Winter=0、Spring=1、Summer=2、Fall=3。

```text
Fall 2025   → 20253
Spring 2026 → 20261
Fall 2026   → 20263
```

降序得到最近申请学期，升序得到最早申请学期。当前表单只提供部分学期选项。

`submissionTime()` 优先解析 `createdAt`；没有有效日期时，尝试读取旧 `local-时间戳` ID。两者都没有则返回 null。`sortProfiles()` 将未知日期排在已知日期后面，不给内置样例编造提交时间；它通过 `[...profiles]` 复制数组再做时间排序。

## 5. 投稿如何保存，为什么刷新后仍存在

流程是：填写表单 → 浏览器原生校验 → JavaScript 业务校验 → 创建记录 → 写入 localStorage → 重画结果页。

- HTML 的 `required`、数字范围和步长负责必填项与 GPA 等输入约束。
- `syncEnglish()` 只在选择报告考试成绩时显示并启用考试字段，同时设置 required；母语者无需填成绩。国际/本土身份不决定母语。
- submit 监听器阻止默认提交，用 `FormData` 读取有 name 的字段；大学决定从每一行 input/select 单独收集。
- 业务校验检查去空格后的姓名/学校是否为空、大学是否重复、最终去向是否对应 Admitted 的大学。大学重复比较不区分大小写。
- 新记录包含数字 GPA、`local-` 加时间戳的 ID、ISO 格式 `createdAt` 和决定数组。

核心保存逻辑：

```js
localStorage.setItem('transferbridge-v1', JSON.stringify([r, ...local]));
local.unshift(r);
```

localStorage 保存的是字符串，所以要 `JSON.stringify()`。先写入存储成功，再更新内存数组；保存失败会显示错误。页面刷新会清空 JavaScript 内存，却通常不会清空 localStorage。启动代码再次 `getItem()`、`JSON.parse()`，进行基础结构检查后，把记录加入显示列表。

存储按网址的 origin（协议、域名、端口）隔离，也受浏览器配置文件隔离。localhost 和公开 Pages 地址的数据不同；别人的浏览器不会读到你的投稿。清除网站数据会丢失记录，无痕会话结束后通常也不会保留。`transferbridge-v1` 是旧品牌的兼容键名，直接改名会让旧数据无法被当前读取逻辑找到。

这不是服务器数据库；GitHub Pages 只提供静态文件。代码对显示字符串使用 `esc()` 转义，但这不等于完整安全审计；若将来做公开投稿后台，还需要服务端验证和审核机制。

## 6. 一个真实 bug：录取状态与专业搜索组合失效

证据来自本次接手过程的实际复现与修复记录。修复在首次 Git 提交前完成，因此仓库中的首次提交已经包含修复，没有单独的修复提交可引用。

**复现：** 在未添加本地案例的初始数据中，选择 Decision = Admitted，再搜索 Computer Science。应出现两条计算机专业案例，旧版本却显示零条。

**原因：** `dist/app.js` 的 `filtered()` 在启用录取状态条件时，只用搜索文字匹配大学名称，没有检查案例的专业和原学校。

修改前的搜索条件：

```js
!query || d[0].toLowerCase().includes(query)
```

修改后的搜索条件：

```js
!query || [r.origin, r.major, d[0]].join(' ').toLowerCase().includes(query)
```

外层仍要求 `d[1]` 等于选中的录取状态，因此 UCLA + Admitted 不会误收 UCLA 被拒、但被另一所学校录取的案例。

**实际验证：** 修复后 Computer Science + Admitted 得到两条内置案例；当时测试浏览器还有一条本地虚构记录，所以页面总计三条。UCLA + Admitted 只显示 WestCoastBound。随后通过独立 Node 检查再次验证专业组合查询及同一学校的状态匹配。

面试时可以解释参与排查和验证的过程，明确 AI 协助定位与修改，不要说这条修复提高了某个没有测量过的性能指标。

## 7. 面试可能问的 5 个问题

### 1. 这个项目解决什么问题，你做了什么？

录取结果需要 GPA、学校与活动等背景才能被理解。我定义目标用户、完整展开的阅读布局及表单需求，用 AI 协助实现原型，并亲自验证了提交后刷新保存。当前示例是虚构的，尚未验证真实社区需求或增长。

### 2. 为什么使用原生 JavaScript，而没有 React？

这个版本是规模有限的静态原型，原生 DOM 和浏览器 API 已能实现所需交互，也无需安装依赖。代价是当前渲染与路由存在跨文件覆盖；若复杂度增加，应先整理模块和状态流，再评估是否引入框架。

### 3. 为什么刷新后还在，换设备却看不到？

保存的是浏览器持久存储 localStorage，而不是普通内存变量。刷新会重新读取；不同浏览器或设备没有共享存储。未来跨设备共享需要后台 API、数据库、身份与隐私设计，这些目前没有实现。

### 4. 如何证明筛选和排序正确？

用明确的输入和预期输出检查：例如 Computer Science + Admitted 的匹配案例；UCLA + Admitted 必须对应 UCLA 的决定；Fall 2026 应晚于 Spring 2026；未知提交日期排后。已做代表性浏览器和代码检查，不应声称有完整自动测试套件或覆盖率。

### 5. 数据可靠吗？AI 在其中做了什么？

大学数据是带来源和年份的静态快照：2026 排名转载、2024 IPEDS 元数据、2023–24 历史预算。不能当成最新或国际转学生报价。AI 协助代码生成、调试和数据处理；我负责需求和产品选择，并验证了关键操作。应能现场解释筛选、排序、验证与存储，而不只展示生成结果。

## 8. 你需要亲自理解的三个重点

1. **数据流：** 指着代码讲清从表单到 JSON、localStorage，再到刷新读取的全过程。
2. **筛选与排序：** 解释 `.filter()` 与 `.some()` 的区别，以及申请学期和提交日期的区别；现场复现组合搜索。
3. **项目边界与贡献：** 清楚区分公开网站、共享数据库和浏览器本地存储；说明数据年份、虚构案例和 AI 协助范围。

练习：用一个虚构案例操作一次保存与刷新，再用自己的话解释以上三点。英文简历与介绍见 `CAREER_MATERIALS.md`。
