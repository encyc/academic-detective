# Academic Detective

**Academic Detective** 是一个免费的学术打假 AI 初筛网站。

网站地址：[https://academic-detective.pages.dev](https://academic-detective.pages.dev)

它的目标很简单：让任何人都可以上传一篇论文，得到一份由 AI 辅助生成的学术诚信初筛报告。

这不是一个“AI 自动判定学术造假”的工具。我不希望它变成那样。

它更像是一个低门槛的初筛助手：帮你快速扫一遍论文文本、图表描述、统计方法、结果表述和方法学细节，找出值得进一步人工复核的可疑点。真正的学术不端认定，永远应该交给专业调查和可复核的证据链。

## 为什么做这个项目

很多论文里的异常并不总是藏得很深。

有些问题就摆在图、表、统计结果、方法描述和时间线里，只是普通读者没有足够的训练，也没有足够的时间逐项检查。

尤其是生命科学、医学、生物材料等领域，论文经常包含大量 figure、Western blot、显微图、统计图和补充材料。一个人从头到尾看完已经不容易，更别说系统地检查同一张图是否被复用、数据是否过于整齐、标准差和 p 值是否合理、方法描述和结果是否互相矛盾。

这些事情很适合让 AI 先做一轮粗筛。

不是让 AI 下结论，而是让 AI 帮人节省时间，把值得人继续看的地方标出来。

## 它现在能做什么

Academic Detective 当前支持上传：

- PDF
- DOCX
- TXT

文件会先在浏览器里提取文本。默认情况下，原始论文文件不会被上传到服务器，后端只接收提取出来的文本和文件元数据。

后端会调用大模型，基于内置的学术打假分析框架生成一份 Markdown 报告。报告通常包括：

- 论文基本信息
- 综合风险评定
- 具体可疑点
- 证据描述
- 不确定性说明
- 建议后续行动
- 免责声明

前端支持按 ModelScope / OpenCode Zen 分组选择模型，并展示当前 IP 的本站每日剩余分析次数。目前每个 IP 每天 20 次免费分析额度。

## 它会检查哪些方向

当前内置的分析思路主要包括：

- 图片复用风险：如 figure/subfigure、Western blot、显微图、流式图是否存在复用、旋转、翻转、裁剪等线索。
- 数据异常：如标准差过于整齐、p 值分布可疑、重复实验结果过于完美。
- 统计异常：如小样本得到极显著结果、统计方法和数据类型不匹配、选择性报告。
- 方法学矛盾：如样本量、实验条件、方法描述和结果表格之间互相冲突。
- 产出和时间线异常：如实验周期、投稿时间、试剂设备上市时间之间存在明显不合理之处。

当前版本主要处理文本。涉及真正的图片复用、拼接、像素级取证，仍然需要专业图像工具和人工复核。

## 重要边界

**AI 只能做初筛，不能做最终判定。**

它可能误报。一处图片标注错误，可能是排版疏忽；一组统计结果看起来整齐，也可能来自特殊实验设计。

它也可能漏报。复杂的图像操纵、跨论文图片复用、原始数据异常，很多需要专业工具、人工经验和外部数据库交叉验证。

所以这个项目不是裁判，也不是自动打假神器。

它只是一个入口。一个把检查成本降下来的入口。

## 致谢

本项目的学术打假分析框架受到 [wooly99/geng-academic-fraud-detector](https://github.com/wooly99/geng-academic-fraud-detector) 的启发，并向「耿同学讲故事」所代表的学术监督精神致敬🫡。

我理解的“耿同学精神”，不是简单地喊打喊杀，也不是用情绪替代证据。

它更接近四件事：有勇气提出问题，用证据说话，把复杂问题讲到普通人也能看懂，质疑论文但不搞人身攻击。

这个项目希望延续这种有证据、有公心、讲逻辑、可复核的方式，把学术诚信初筛做成更低门槛的公益工具。

## 欢迎参与

这个项目还很早期，欢迎贡献：

- 可免费调用的大模型 API
- 更适合学术论文分析的 prompt
- PDF / DOCX 提取优化方案
- 图像取证工具链
- PubPeer、Retraction Watch 等公开信息的检索接口
- 更好的限流、防滥用和隐私设计
- 前端 UI 改进

欢迎提 issue 或 pull request。

## 技术实现

- 前端：React + Vite
- 部署：Cloudflare Pages
- 后端：Cloudflare Pages Functions
- 限流：Cloudflare KV
- 模型：OpenAI-compatible providers，目前接入 ModelScope 和 OpenCode Zen
- 文档解析：浏览器端提取 PDF / DOCX / TXT 文本

## 模型额度说明

ModelScope 和 OpenCode Zen 当前接入的是 OpenAI-compatible chat completions 接口。ModelScope 可通过 `/v1/models` 列出模型，OpenCode Zen 可直接调用指定免费模型；二者都没有在当前接入路径中提供“按模型剩余调用次数”的标准字段。

因此页面展示的是本站 KV 限流中的当前 IP 每日剩余次数，所有模型共享该次数。

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
