# NextAdmit 共享数据库接入

## 状态

Supabase 项目 nextadmit（nrjloxwmglrqhcnfweib）已创建，数据表、权限和公开配置已完成。公开网站需要发布本次代码之后才会启用。真实表单投稿、待审核隔离、审核后跨会话读取已验证；测试记录已改为 rejected，不再公开展示。
`dist/database-config.js` 留空时仍可运行原来的本地演示。

## 创建与连接

1. 在 https://supabase.com/dashboard 创建免费组织和 `nextadmit` 项目；不要选择收费升级。
2. 数据库密码自己保存。不要把数据库密码、secret key、service_role key 放入网页、GitHub 或聊天。
3. 在项目 SQL Editor 执行 `supabase/migrations/202610260001_shared_profiles.sql` 一次。
   此脚本用于全新项目；包含已部署的 schema 定义，不要在当前项目重复运行。远程迁移记录由 Supabase 管理。
4. 从项目 Connect / API 设置复制 Project URL 和 `sb_publishable_...` 公开密钥。
5. 填入 `dist/database-config.js` 的 `url` 和 `publishableKey`。
   这个密钥本来就用于公开浏览器代码，权限由数据库策略限制。
6. 在 Authentication → Sign In / Providers 开启 Allow anonymous sign-ins。当前项目已开启。
7. 本地启动 `npm.cmd start`，完成下列验证后再发布。

## 投稿与审核

- 投稿前必须同意将内容存储在数据库，并在审核后公开。
- 页面不会自动上传任何原先的 localStorage 记录。旧记录仍只对原浏览器可见。
- 新投稿进入 `public.transfer_profiles`，默认 `status = pending`。
- 在 Supabase Table Editor 检查投稿的 `profile` 内容，再把 `status` 改为 `approved`。
- 另一个浏览器刷新网站或点 **Refresh community profiles**，会看到已审核记录。
- 不合适的投稿改为 `rejected`；撤下已公开投稿也可改为 `rejected`。
- 公开展示的是用户自述，审核不代表验证录取真实性。
- 第一版使用匿名会话身份（不收集邮箱或密码），无可跨设备登录的用户账号和自助编辑/删除。删除请求可由站主通过后台处理，不要承诺跨设备找回投稿。
- 页面最多读取最近 500 条已审核记录，页面已注明此限制。

## 权限与容量

- 访客只可读取已审核内容，不能读取待审核或拒绝的内容，也不能读取投稿人的内部身份 ID。
- 访客不能直接写表、改状态、编辑或删除记录。
- 匿名投稿会话只能调用 `submit_transfer_profile`；公开包装函数以调用者权限运行，受限的内部函数位于不公开的 nextadmit_private schema 并验证 auth.uid()。由数据库校验必填项、GPA、字段长度、学校重复、录取决定和最终去向。
- 创建时间由数据库生成；提交 UUID 支持同一表单失败重试，不重复插入。
- 每个匿名身份 24 小时最多 5 条；全站每分钟最多接收 20 条、24 小时最多 300 条新投稿。匿名身份可以被重新创建，因此这不等于可靠的人类身份验证；攻击者仍可能用尽额度。
- 站主需要持续审核和关注服务用量。流量增长时增加服务器端验证码/身份校验，而不是只在网页里加延迟。
- 若需暂时停止收稿，在 SQL Editor 执行：
  `revoke execute on function public.submit_transfer_profile(uuid,jsonb) from authenticated;`
- 恢复时执行相同语句的 `grant execute ... to authenticated` 版本。

## 验证

1. `node --test tests/shared-store.test.cjs` 检查适配器与错误处理。
2. 用浏览器 A 提交明确标记为虚构的测试资料，应显示等待审核；B 看不到待审核内容。
3. 后台审核后，B 刷新应显示此资料，A 的旧本地记录不应出现于 B。
4. 用公开密钥请求 REST API：查询 pending 应为空；直接 INSERT / UPDATE / DELETE 应被拒绝。
5. RPC 请求包含 `status`、无效 GPA、重复学校、错误最终去向时应失败。
6. 重试同一 UUID 只应出现一行；断网提交应保留表单且不能提示成功。
7. 测试资料保留清楚的虚构标记，测试后改成 rejected，不混入真实投稿。

Official references:
- https://supabase.com/docs/guides/getting-started/api-keys
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/database/functions

## 客户端来源

页面随站点提供 Supabase JS 2.118.0 的官方 UMD 文件，不依赖外部 CDN。版本及依赖锁在 tools/supabase-client/package.json 与 package-lock.json，许可证在 dist/vendor。需要更新时先运行该目录的 npm ci，再从 node_modules/@supabase/supabase-js/dist/umd/supabase.js 复制到带版本号的 vendor 文件，并同步 index.html。匿名会话由官方 SDK 管理，仅提交时创建，读取公开资料无需创建身份。

## 检查记录（2026-10-26）

已通过本地适配器测试、临时 PostgreSQL 权限测试，以及真实 Supabase 的表单写入、审核前隔离、审核后独立访问会话读取、拒绝后隐藏、越权写入拒绝和字段校验。真实数据库性能检查无提醒。安全检查仅有默认 Auth 的泄露密码保护提醒：当前网站使用匿名会话，不提供密码注册/登录；本次没有升级到付费方案。说明：https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection 。手机布局本轮尚未重新验证。
