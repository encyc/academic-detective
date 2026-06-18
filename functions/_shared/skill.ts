interface Skill {
  name: string;
  description: string;
  filePath: string;
  content: string;
}

const fraudDetectorSkill: Skill = {
  name: "geng-academic-fraud-detector",
  description:
    "学术论文打假检测器。分析学术论文，检测数据造假、图片复用/拼接、Western blot 操纵、统计异常等学术不端风险。",
  filePath: "/skills/geng-academic-fraud-detector/SKILL.md",
  content: `# 耿同学 Skill：学术论文打假检测器

你是一个学术论文诚信检测助手。请用严谨、克制、可复核的方式审视论文，识别可能存在的数据造假、图片操纵、统计异常、方法矛盾等学术不端风险。

检测维度：
1. 图片复用：figure/subfigure、Western blot、凝胶电泳图、显微镜图、流式细胞图是否存在复用、旋转、翻转、裁剪。
2. 数据造假：末位数字分布、标准差/标准误、重复实验一致性、均值和样本量是否自洽。
3. 图片拼接：泳道分界线、背景灰度、曝光突变、不同压缩质量区域。
4. 统计异常：p-hacking、样本量与效应量、统计方法适配性、选择性报告。
5. 产出异常：实验时间线、方法描述复用、短期异常产出。
6. 引用与方法学异常：方法内部矛盾、引用是否支持观点、试剂设备、伦理审批、时间线冲突。

输出必须包含：论文信息、综合评定、详细发现、证据、不确定性、建议后续行动、免责声明。

限制：
- 不做人身攻击，只分析论文内容。
- 区分疏忽、排版错误和系统性问题。
- 对无法确定的内容明确写“无法判断”。
- 本报告仅供学术讨论和教育用途，不能作为最终指控依据。`,
};

export function buildFraudDetectionPrompt(params: {
  fileName: string;
  mimeType: string;
  extractedText: string;
  userMessage?: string;
}): string {
  const instructions = [
    "请调用该 skill 的分析框架，对用户提供的论文文本进行学术诚信初筛。",
    "当前系统只接收浏览器端提取出的文本，无法进行像素级图片取证；涉及图片复用或拼接时，请标注为“需要专业图像工具进一步验证”。",
    `文件名：${params.fileName}`,
    `文件类型：${params.mimeType || "unknown"}`,
    params.userMessage ? `用户补充要求：${params.userMessage}` : "",
    "论文提取文本如下：",
    params.extractedText,
  ]
    .filter(Boolean)
    .join("\n\n");

  return formatSkillInvocation(fraudDetectorSkill, instructions);
}

function formatSkillInvocation(skill: Skill, additionalInstructions: string): string {
  return [
    `Use the following skill: ${skill.name}`,
    `Description: ${skill.description}`,
    `Skill file: ${skill.filePath}`,
    "",
    "<skill_instructions>",
    skill.content,
    "</skill_instructions>",
    "",
    "<task>",
    additionalInstructions,
    "</task>",
  ].join("\n");
}
