# Academic Detective

公益性的学术论文诚信初筛工具。前端部署在 Cloudflare Pages，后端 API 使用 Pages Functions，默认调用 OpenAI-compatible 模型提供商（首个 provider 为 ModelScope）。

## 当前边界

- 支持在浏览器端提取 PDF / DOCX / TXT 文本。
- Worker 接收文本和文件元数据，调用内置的 `geng-academic-fraud-detector` skill 生成初筛报告。
- 前端按 ModelScope / OpenCode Zen 分组选择模型，并展示当前 IP 的本站每日剩余分析次数。
- 默认不保存用户文件；R2 上传绑定已预留，后续可按需开启。
- 结果仅供学术讨论和教育用途，不构成学术不端认定。

## 模型额度说明

ModelScope 和 OpenCode Zen 当前接入的是 OpenAI-compatible chat completions 接口。ModelScope 可通过 `/v1/models` 列出模型，OpenCode Zen 可直接调用指定免费模型；二者都没有在当前接入路径中提供“按模型剩余调用次数”的标准字段。因此页面展示的是本站 KV 限流中的当前 IP 每日剩余次数，所有模型共享该次数。

## 致谢

本项目的学术打假分析框架受到 [wooly99/geng-academic-fraud-detector](https://github.com/wooly99/geng-academic-fraud-detector) 的启发，并向「耿同学讲故事」所代表的学术监督精神致敬🫡。这个项目希望延续那种有证据、有公心、讲逻辑、不搞人身攻击的方式，把学术诚信初筛做成更低门槛的公益工具。

## 本地开发

```bash
npm install
cp .dev.vars.example .dev.vars
npm run dev
```

只调试静态前端时用 `npm run dev`。需要连 Pages Functions 时：

```bash
npm run build
npm run pages:dev
```

## Cloudflare 配置

在 Cloudflare Pages 项目中配置环境变量：

- `MODELSCOPE_API_KEY`
- `MODELSCOPE_BASE_URL`
- `MODELSCOPE_MODEL`
- `OPENCODE_ZEN_API_KEY`
- `DEFAULT_PROVIDER_ID`
- `DAILY_IP_LIMIT`
- `MAX_TEXT_CHARS`

可选绑定：

- KV: `RATE_LIMIT`
- R2: `PAPER_UPLOADS`

生产环境不要使用 Cloudflare Global API Key 写入仓库；用最小权限 API Token。
