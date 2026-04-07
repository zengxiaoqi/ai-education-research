# AI 教育资料研究中心 / Web MVP

这是一个围绕 AI 教育场景持续研究与产品化验证的项目。

当前仓库不只是资料收集，还已经包含一个可运行的 **Web MVP**，用于验证教师端 / 学生端 / AI 诊断 / 教师复核的最小闭环。

## 当前目标

- 收集 AI 教育相关资料、论文、产品与想法
- 沉淀成结构化文档
- 持续推进 AI 教育 Web MVP，验证关键产品闭环

## 当前已包含内容

- `docs/` - 研究文档、演示脚本、优先级文档
- `ideas/` - APP 创意想法
- `research/` - 深度研究报告
- `apps/web/` - AI Education Research Web MVP

## Web MVP 当前能力

- teacher / student demo 登录
- 教师建班
- 教师创建作业
- 学生查看任务并提交作答
- 系统生成 diagnosis
- 根据规则稳定分流：
  - 自动反馈
  - 进入教师 review queue
- 教师完成 review task（confirmed / revised / rejected）

## 关键文档

- 演示脚本：`docs/demo-script.md`
- P0 优先级：`docs/p0-priorities.md`

## 运行与验证

当前验证以 `apps/web` 为主，已确认：
- `npm run lint` ✅
- `npm run build` ✅

## 备注

- 当前 Next 16 对 `middleware` 有废弃提示，后续建议迁移到 `proxy`
- 当前仓库仍会持续保留 research / ideas 相关内容，Web MVP 是其中的产品化落地方向之一

---
Powered by OpenClaw 🤖
