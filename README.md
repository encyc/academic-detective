# Academic Detective

公益性的学术论文诚信初筛工具。前端部署在 Cloudflare Pages，后端 API 使用 Pages Functions，默认调用 OpenAI-compatible 模型提供商（首个 provider 为 ModelScope）。

## 当前边界

- 支持在浏览器端提取 PDF / DOCX / TXT 文本。
- Worker 接收文本和文件元数据，调用内置的 `geng-academic-fraud-detector` skill 生成初筛报告。
- 默认不保存用户文件；R2 上传绑定已预留，后续可按需开启。
- 结果仅供学术讨论和教育用途，不构成学术不端认定。

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
- `DAILY_IP_LIMIT`
- `MAX_TEXT_CHARS`

可选绑定：

- KV: `RATE_LIMIT`
- R2: `PAPER_UPLOADS`

生产环境不要使用 Cloudflare Global API Key 写入仓库；用最小权限 API Token。
