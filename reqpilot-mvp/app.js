const samples = {
  police: {
    label: "公安警情复盘",
    type: "会议纪要",
    goal: "需求摘要 + PRD 草稿",
    text:
      "市公安局希望建设警情复盘与案事件分析平台，覆盖 110 警情记录、处警回传、现场图片与复盘材料。当前问题是警情记录分散在多个系统，复盘会议需要人工整理材料，领导关注重点人员、重点事件、响应时效和处置合规性。项目目标是在一个统一界面中实现警情摘要生成、责任链梳理、时间线还原、风险标签提示，并支持导出汇报材料。客户希望首期在指挥中心试点，要求两个月内看到可演示版本，并能支持后续与视频系统和内部知识库打通。"
  },
  fire: {
    label: "消防巡检项目",
    type: "现场记录",
    goal: "项目推进方案",
    text:
      "消防支队计划推进重点单位巡检数字化项目，材料包括巡检记录、隐患整改台账和季度总结。当前巡检记录格式不统一，隐患问题描述口径不一致，导致项目汇报周期长、整改闭环难跟踪。客户重点关注隐患分类、整改责任人、超期预警和季度汇报自动生成，要求系统能支持现场人员快速录入、后台自动汇总，并为领导输出项目推进周报和月报。"
  },
  gov: {
    label: "政企招标材料",
    type: "招标书",
    goal: "客户汇报提纲",
    text:
      "某区政务服务中心拟采购智能咨询与材料辅助生成系统，面向窗口人员和后台项目管理人员，主要服务企业办事咨询、材料审核提示和常见问题解答。现阶段人工培训成本高，新人理解流程慢，政策文件更新频繁。招标文件要求供应商提供政策知识问答、材料清单生成、事项办理路径推荐、后台知识维护和服务数据统计能力，同时希望方案能体现可扩展性、部署安全性和后续运营支撑。"
  }
};

const STORAGE_KEY = "reqpilot-workspace-draft-v2";
const API_KEY_STORAGE_KEY = "reqpilot-deepseek-api-key";
const API_KEY_REMEMBER_KEY = "reqpilot-deepseek-api-remember";
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

const MODEL_PRESETS = {
  flash: {
    label: "DeepSeek V4 Flash",
    apiModel: "deepseek-chat",
    hint: "默认使用低成本模式，适合快速拆解需求、生成 PRD 初稿和汇报提纲。",
    modeNote: "低成本默认模式",
    readinessBonus: 0,
    modelLines: [
      "主模型：DeepSeek V4 Flash，用于默认需求拆解与草稿生成",
      "优势：调用成本低、响应更快，适合高频演示与初版验证",
      "适用环节：PRD 初稿、汇报提纲、结构化摘要",
      "建议策略：首轮全部走 Flash，复杂文档再切换到更强模式"
    ]
  },
  pro: {
    label: "DeepSeek V4 Pro",
    apiModel: "deepseek-reasoner",
    hint: "高质量模式更适合复杂长文档、正式方案整理和关键汇报材料生成。",
    modeNote: "高质量分析模式",
    readinessBonus: 6,
    modelLines: [
      "主模型：DeepSeek V4 Pro，用于复杂需求理解与高质量输出",
      "优势：长文档理解更稳，结构化输出更完整",
      "适用环节：正式 PRD、关键汇报稿、复杂招标材料",
      "建议策略：仅在复杂场景或高质量模式下启用"
    ]
  }
};

const state = {
  activeTab: "analysis",
  currentSample: "police",
  lastResult: null,
  modelMode: "flash"
};

const elements = {
  analysisCards: document.getElementById("analysis-cards"),
  apiKeyInput: document.getElementById("api-key-input"),
  briefOutput: document.getElementById("brief-output"),
  clearApiKeyBtn: document.getElementById("clear-api-key-btn"),
  copyCurrentBtn: document.getElementById("copy-current-btn"),
  currentModelLabel: document.getElementById("current-model-label"),
  currentSampleLabel: document.getElementById("current-sample-label"),
  docCharCount: document.getElementById("doc-char-count"),
  documentInput: document.getElementById("document-input"),
  docType: document.getElementById("doc-type"),
  draftStatus: document.getElementById("draft-status"),
  evidencePanel: document.getElementById("evidence-panel"),
  exportMdBtn: document.getElementById("export-md-btn"),
  fileInput: document.getElementById("file-input"),
  goalType: document.getElementById("goal-type"),
  metricList: document.getElementById("metric-list"),
  modelHint: document.getElementById("model-hint"),
  modelList: document.getElementById("model-list"),
  modelMode: document.getElementById("model-mode"),
  northStar: document.getElementById("north-star"),
  prdOutput: document.getElementById("prd-output"),
  readinessScore: document.getElementById("readiness-score"),
  rememberApiKey: document.getElementById("remember-api-key"),
  resourceList: document.getElementById("resource-list"),
  restoreDraftBtn: document.getElementById("restore-draft-btn"),
  saveDraftBtn: document.getElementById("save-draft-btn"),
  summarySubtitle: document.getElementById("summary-subtitle"),
  summaryTitle: document.getElementById("summary-title"),
  toast: document.getElementById("toast")
};

function showToast(message) {
  if (!elements.toast) return;
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 2200);
}

function formatNumber(value) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

function updateDocStats() {
  const text = elements.documentInput.value.trim();
  elements.docCharCount.textContent = formatNumber(text.length);
}

function updateDraftStatus(text) {
  elements.draftStatus.textContent = text;
}

function getCurrentPreset() {
  return MODEL_PRESETS[state.modelMode] || MODEL_PRESETS.flash;
}

function updateModelLabel() {
  const preset = getCurrentPreset();
  elements.currentModelLabel.textContent = preset.label;
  elements.modelHint.textContent = preset.hint;
}

function updateSampleLabel() {
  const sample = samples[state.currentSample];
  elements.currentSampleLabel.textContent = sample ? sample.label : "自定义输入";
}

function persistApiKeyPreference() {
  if (elements.rememberApiKey.checked) {
    localStorage.setItem(API_KEY_STORAGE_KEY, elements.apiKeyInput.value.trim());
    localStorage.setItem(API_KEY_REMEMBER_KEY, "true");
    return;
  }

  localStorage.removeItem(API_KEY_STORAGE_KEY);
  localStorage.removeItem(API_KEY_REMEMBER_KEY);
}

function loadSavedApiKey() {
  const remembered = localStorage.getItem(API_KEY_REMEMBER_KEY) === "true";
  elements.rememberApiKey.checked = remembered;
  if (remembered) {
    elements.apiKeyInput.value = localStorage.getItem(API_KEY_STORAGE_KEY) || "";
  }
}

function clearApiKey() {
  elements.apiKeyInput.value = "";
  elements.rememberApiKey.checked = false;
  localStorage.removeItem(API_KEY_STORAGE_KEY);
  localStorage.removeItem(API_KEY_REMEMBER_KEY);
  showToast("已清除本地保存的 API Key");
}

function pickRoles(text) {
  if (text.includes("公安") || text.includes("警情")) {
    return ["指挥中心负责人", "警情复盘人员", "一线处警民警"];
  }
  if (text.includes("消防") || text.includes("巡检")) {
    return ["消防巡检负责人", "现场巡检人员", "支队管理者"];
  }
  return ["窗口工作人员", "项目管理人员", "企业办事人员"];
}

function pickPains(text) {
  const pains = [];
  if (text.includes("分散")) pains.push("材料分散在多个系统，人工收集和归档成本高");
  if (text.includes("不统一")) pains.push("记录口径不统一，后续汇报难以标准化");
  if (text.includes("培训") || text.includes("新人")) pains.push("新人理解业务流程慢，培训周期偏长");
  if (text.includes("更新频繁")) pains.push("政策或规则更新快，知识维护成本高");
  if (text.includes("汇报")) pains.push("阶段汇报依赖手工整理，交付效率低");
  if (!pains.length) pains.push("行业材料复杂且非结构化，需求理解周期长");
  return pains;
}

function pickFeatures(text) {
  const features = [
    "行业材料上传与正文解析",
    "结构化需求拆解卡片",
    "PRD 草稿生成",
    "客户汇报提纲导出"
  ];

  if (text.includes("时间线") || text.includes("复盘")) features.push("事件时间线自动还原");
  if (text.includes("风险") || text.includes("隐患")) features.push("风险与隐患标签提示");
  if (text.includes("知识库") || text.includes("政策")) features.push("知识库检索与依据引用");
  if (text.includes("周报") || text.includes("月报") || text.includes("统计")) features.push("周报与月报自动生成");
  return features;
}

function pickRisks(text) {
  const risks = [
    "行业材料格式差异较大，结构化抽取稳定性需要验证",
    "复杂场景下仍可能出现需求遗漏或表述泛化"
  ];

  if (text.includes("两个月")) risks.push("交付周期较紧，首期范围必须严格控制");
  if (text.includes("安全") || text.includes("内部")) risks.push("涉及内部材料，需要补充权限和部署安全设计");
  return risks;
}

function pickQuestions(text) {
  const questions = [
    "首期优先服务哪类角色？",
    "客户更看重汇报效率还是需求准确率？",
    "哪些输出模板可以作为验收标准？"
  ];

  if (text.includes("知识库")) questions.push("历史知识库是否可接入，更新由谁负责？");
  if (text.includes("试点")) questions.push("试点部门的验收指标和样本量分别是什么？");
  return questions;
}

function pickEvidence(text) {
  return text
    .split(/[。！？\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4)
    .map((item, index) => ({
      label: `依据 ${index + 1}`,
      text: item
    }));
}

function calculateReadiness(roles, pains, features, questions) {
  const base = 55 + roles.length * 4 + pains.length * 3 + Math.min(features.length, 6) * 2 + Math.min(questions.length, 4);
  return Math.min(base + getCurrentPreset().readinessBonus, 96);
}

function buildFallbackAnalysis(text) {
  const roles = pickRoles(text);
  const pains = pickPains(text);
  const features = pickFeatures(text);
  const risks = pickRisks(text);
  const questions = pickQuestions(text);
  const evidence = pickEvidence(text);
  const preset = getCurrentPreset();
  const readiness = calculateReadiness(roles, pains, features, questions);
  const northStar = text.includes("汇报")
    ? "上传文档后导出可用汇报材料的完成率"
    : "上传文档后导出可用方案的完成率";

  return {
    headline: `面向 ${roles[0]} 的行业文档工作台`,
    subtitle: `当前使用 ${preset.label} 的本地演示分析模式，可先验证交互流程与输出结构。`,
    readiness,
    cards: [
      { title: "目标用户", badge: "User", items: roles },
      { title: "核心痛点", badge: "Pain", items: pains },
      { title: "MVP 功能", badge: "Feature", items: features },
      { title: "待确认问题", badge: "Question", items: questions },
      { title: "交付风险", badge: "Risk", items: risks },
      {
        title: "建议验证指标",
        badge: "Metric",
        items: [northStar, "人工修改率", "导出完成率", "平均处理时长"]
      }
    ],
    evidence,
    prd: [
      "# ReqPilot PRD 草稿",
      "",
      "## 1. 产品背景",
      `当前材料以「${elements.docType.value}」为主，存在信息分散、口径不统一、人工整理耗时长的问题。团队希望通过 AI 将材料快速转成结构化需求与方案输出。`,
      "",
      "## 2. 目标用户",
      ...roles.map((item) => `- ${item}`),
      "",
      "## 3. 核心痛点",
      ...pains.map((item) => `- ${item}`),
      "",
      "## 4. MVP 功能范围",
      ...features.slice(0, 5).map((item) => `- ${item}`),
      "",
      "## 5. 成功指标",
      `- 北极星指标：${northStar}`,
      "- 输出文档人工修改率低于 40%",
      "- 平均处理时长控制在 15 分钟以内",
      `- 当前模型策略：${preset.label}，${preset.modeNote}`,
      "",
      "## 6. 风险与边界",
      ...risks.map((item) => `- ${item}`)
    ].join("\n"),
    brief: [
      "# 客户汇报提纲",
      "",
      "## 一句话方案",
      "通过一个面向行业材料的 AI 工作台，把“读材料、拆需求、出文档、做汇报”标准化。",
      "",
      "## 业务现状",
      `- 当前材料主要来自 ${elements.docType.value}，整理和汇报效率较低`,
      "",
      "## MVP 价值",
      "- 缩短从读材料到出方案的时间",
      "- 降低跨角色沟通成本",
      "- 提高项目汇报和复盘效率",
      `- 当前生成模式：${preset.label}`,
      "",
      "## 首期能力",
      ...features.slice(0, 4).map((item) => `- ${item}`),
      "",
      "## 后续迭代",
      "- 接入知识库与历史模板",
      "- 增加多轮澄清问答",
      "- 增加导出与协同能力"
    ].join("\n"),
    metrics: [northStar, "PRD 导出率", "汇报提纲导出率", "人工修改率", "二次使用率"],
    resources: [
      "前端 / 全栈 1 人：工作台、上传、编辑、导出",
      "AI 工程 1 人：解析、Prompt、评测",
      "产品 1 人：需求定义、交互、指标设计",
      "MVP 期优先做文本解析与结构化输出"
    ],
    models: [
      ...preset.modelLines,
      "OCR：PaddleOCR，用于扫描件或图片型材料",
      "工作流：LangGraph / Dify / 轻量自建流程",
      "当前为本地演示回退模式"
    ]
  };
}

function renderCards(cards) {
  elements.analysisCards.innerHTML = cards
    .map((card) => {
      const items = card.items.map((item) => `<li>${item}</li>`).join("");
      return `
        <article class="result-card">
          <header>
            <strong>${card.title}</strong>
            <span>${card.badge}</span>
          </header>
          <ul>${items}</ul>
        </article>
      `;
    })
    .join("");
}

function renderEvidence(items) {
  elements.evidencePanel.innerHTML = items
    .map((item) => {
      return `
        <article class="evidence-card">
          <span>${item.label}</span>
          <p>${item.text}</p>
        </article>
      `;
    })
    .join("");
}

function renderList(target, items) {
  target.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
}

function applyResult(result) {
  state.lastResult = result;
  elements.summaryTitle.textContent = result.headline;
  elements.summarySubtitle.textContent = result.subtitle;
  elements.readinessScore.textContent = `${result.readiness}%`;
  elements.northStar.textContent = result.metrics[0];
  elements.prdOutput.textContent = result.prd;
  elements.briefOutput.textContent = result.brief;
  renderCards(result.cards);
  renderEvidence(result.evidence);
  renderList(elements.metricList, result.metrics);
  renderList(elements.resourceList, result.resources);
  renderList(elements.modelList, result.models);
}

function parseJsonFromText(text) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw error;
  }
}

function buildDeepSeekPrompt(text) {
  return [
    "你是一个行业文档理解与方案生成助手，需要把输入材料整理成结构化 JSON。",
    "请严格输出 JSON，不要输出任何额外解释。",
    "JSON schema:",
    JSON.stringify({
      headline: "string",
      subtitle: "string",
      readiness: 88,
      cards: [{ title: "string", badge: "User", items: ["string"] }],
      evidence: [{ label: "依据 1", text: "string" }],
      prd: "markdown string",
      brief: "markdown string",
      metrics: ["string"],
      resources: ["string"],
      models: ["string"]
    }),
    "",
    `材料类型：${elements.docType.value}`,
    `输出目标：${elements.goalType.value}`,
    `当前模型策略：${getCurrentPreset().label}`,
    "",
    "请特别关注：目标用户、核心痛点、功能建议、风险点、待确认问题、PRD 草稿、汇报提纲。",
    "",
    "行业材料：",
    text
  ].join("\n");
}

async function requestDeepSeekAnalysis(text, apiKey) {
  const preset = getCurrentPreset();
  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: preset.apiModel,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "你是一名擅长需求分析、PRD 整理和行业方案生成的 AI 产品助手，请严格输出 JSON。"
        },
        {
          role: "user",
          content: buildDeepSeekPrompt(text)
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek 请求失败：${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("DeepSeek 返回内容为空");
  }

  const parsed = parseJsonFromText(content);
  return {
    headline: parsed.headline || "已完成分析",
    subtitle: parsed.subtitle || `当前由 ${preset.label} 生成`,
    readiness: Number(parsed.readiness) || 82,
    cards: Array.isArray(parsed.cards) ? parsed.cards : [],
    evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
    prd: parsed.prd || "",
    brief: parsed.brief || "",
    metrics: Array.isArray(parsed.metrics) ? parsed.metrics : [],
    resources: Array.isArray(parsed.resources) ? parsed.resources : [],
    models: Array.isArray(parsed.models) ? parsed.models : []
  };
}

async function analyzeCurrentDocument(silent = false) {
  const text = elements.documentInput.value.trim();
  if (!text) {
    showToast("请先填入行业材料，再开始分析");
    return;
  }

  updateDocStats();
  updateModelLabel();

  const apiKey = elements.apiKeyInput.value.trim();
  if (apiKey) {
    try {
      if (!silent) showToast("正在调用 DeepSeek 分析...");
      persistApiKeyPreference();
      const result = await requestDeepSeekAnalysis(text, apiKey);
      applyResult(result);
      updateDraftStatus("未保存");
      if (!silent) showToast(`已使用 ${getCurrentPreset().label} 完成分析`);
      return;
    } catch (error) {
      console.error(error);
      showToast("DeepSeek 调用失败，已回退到本地演示分析");
    }
  }

  const fallback = buildFallbackAnalysis(text);
  applyResult(fallback);
  updateDraftStatus("未保存");
  if (!silent && !apiKey) {
    showToast("未填写 API Key，已使用本地演示分析");
  }
}

function saveDraft(silent = false) {
  const payload = {
    activeTab: state.activeTab,
    brief: elements.briefOutput.textContent,
    docType: elements.docType.value,
    document: elements.documentInput.value,
    goalType: elements.goalType.value,
    modelMode: state.modelMode,
    prd: elements.prdOutput.textContent,
    sample: state.currentSample,
    savedAt: new Date().toISOString()
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  updateDraftStatus("已保存");
  if (!silent) showToast("草稿已保存到本地");
}

async function restoreDraft() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    showToast("当前没有可恢复的草稿");
    return;
  }

  try {
    const payload = JSON.parse(raw);
    elements.docType.value = payload.docType || "会议纪要";
    elements.goalType.value = payload.goalType || "需求摘要 + PRD 草稿";
    state.modelMode = payload.modelMode || "flash";
    elements.modelMode.value = state.modelMode;
    elements.documentInput.value = payload.document || "";
    elements.prdOutput.textContent = payload.prd || "";
    elements.briefOutput.textContent = payload.brief || "";
    state.currentSample = payload.sample || "custom";
    state.activeTab = payload.activeTab || "analysis";

    updateSampleLabel();
    updateModelLabel();
    updateDocStats();
    setTab(state.activeTab);
    updateDraftStatus("已恢复");

    if (elements.documentInput.value.trim()) {
      await analyzeCurrentDocument(true);
    }

    showToast("草稿已恢复");
  } catch (error) {
    console.error(error);
    showToast("草稿恢复失败，请重新保存");
  }
}

function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function copyCurrentTabContent() {
  let content = "";

  if (state.activeTab === "analysis") {
    const title = elements.summaryTitle.textContent || "需求拆解";
    const cards = [...elements.analysisCards.querySelectorAll(".result-card")].map((card) => card.innerText.trim());
    content = [title, ...cards].join("\n\n");
  } else if (state.activeTab === "prd") {
    content = elements.prdOutput.textContent;
  } else if (state.activeTab === "brief") {
    content = elements.briefOutput.textContent;
  } else {
    const metrics = [...elements.metricList.querySelectorAll("li")].map((item) => `- ${item.textContent}`);
    const resources = [...elements.resourceList.querySelectorAll("li")].map((item) => `- ${item.textContent}`);
    const models = [...elements.modelList.querySelectorAll("li")].map((item) => `- ${item.textContent}`);
    content = [
      `北极星指标：${elements.northStar.textContent}`,
      `模型模式：${elements.currentModelLabel.textContent}`,
      "",
      "核心业务指标",
      ...metrics,
      "",
      "资源计划",
      ...resources,
      "",
      "模型选型",
      ...models
    ].join("\n");
  }

  await navigator.clipboard.writeText(content);
  showToast("当前内容已复制");
}

function exportMarkdown() {
  const title = elements.summaryTitle.textContent || "ReqPilot 输出";
  const sections = [...elements.analysisCards.querySelectorAll(".result-card")].map((card) => {
    const heading = card.querySelector("strong")?.textContent || "结果";
    const items = [...card.querySelectorAll("li")].map((item) => `- ${item.textContent}`).join("\n");
    return `### ${heading}\n${items}`;
  });

  const content = [
    `# ${title}`,
    "",
    "## 输入信息",
    `- 材料类型：${elements.docType.value}`,
    `- 输出目标：${elements.goalType.value}`,
    `- 模型模式：${elements.currentModelLabel.textContent}`,
    "",
    "## 需求拆解",
    ...sections,
    "",
    "## PRD 草稿",
    elements.prdOutput.textContent,
    "",
    "## 汇报提纲",
    elements.briefOutput.textContent
  ].join("\n");

  downloadTextFile("reqpilot-output.md", content);
  showToast("Markdown 已导出");
}

async function loadSample(name) {
  const sample = samples[name];
  if (!sample) return;

  state.currentSample = name;
  elements.docType.value = sample.type;
  elements.goalType.value = sample.goal;
  elements.documentInput.value = sample.text;
  updateSampleLabel();
  updateDocStats();
  await analyzeCurrentDocument(true);
  updateDraftStatus("样例已加载");
  showToast(`已加载样例：${sample.label}`);
}

function setTab(tabName) {
  state.activeTab = tabName;
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.tab === tabName);
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("is-active", panel.id === `tab-${tabName}`);
  });
}

function handleFileInput(file) {
  if (!file) return;

  if (file.name.endsWith(".txt") || file.name.endsWith(".md")) {
    file.text().then((content) => {
      elements.documentInput.value = content;
      state.currentSample = "custom";
      updateSampleLabel();
      updateDocStats();
      updateDraftStatus("未保存");
      showToast(`已读取文件：${file.name}`);
    });
    return;
  }

  elements.documentInput.value =
    `文件名：${file.name}\n\n` +
    "当前 MVP 仅自动读取文本类文件。若为 PDF / Word，请先复制主要内容到这里再继续分析。";
  state.currentSample = "custom";
  updateSampleLabel();
  updateDocStats();
  updateDraftStatus("未保存");
  showToast(`已接收文件：${file.name}`);
}

function bindEvents() {
  document.getElementById("analyze-btn").addEventListener("click", () => analyzeCurrentDocument());
  document.getElementById("fill-demo").addEventListener("click", () => {
    loadSample(state.currentSample === "custom" ? "police" : state.currentSample);
  });
  document.getElementById("clear-btn").addEventListener("click", () => {
    elements.documentInput.value = "";
    updateDocStats();
    state.currentSample = "custom";
    updateSampleLabel();
    updateDraftStatus("未保存");
    showToast("输入内容已清空");
  });

  elements.saveDraftBtn.addEventListener("click", () => saveDraft());
  elements.restoreDraftBtn.addEventListener("click", restoreDraft);
  elements.copyCurrentBtn.addEventListener("click", copyCurrentTabContent);
  elements.exportMdBtn.addEventListener("click", exportMarkdown);
  elements.clearApiKeyBtn.addEventListener("click", clearApiKey);

  elements.documentInput.addEventListener("input", () => {
    updateDocStats();
    updateDraftStatus("编辑中");
  });

  elements.modelMode.addEventListener("change", async () => {
    state.modelMode = elements.modelMode.value;
    updateModelLabel();
    updateDraftStatus("未保存");
    if (elements.documentInput.value.trim()) {
      await analyzeCurrentDocument(true);
      showToast(`已切换到 ${getCurrentPreset().label}`);
    }
  });

  elements.apiKeyInput.addEventListener("input", () => {
    updateDraftStatus("编辑中");
    if (elements.rememberApiKey.checked) persistApiKeyPreference();
  });

  elements.rememberApiKey.addEventListener("change", persistApiKeyPreference);

  elements.fileInput.addEventListener("change", (event) => {
    handleFileInput(event.target.files && event.target.files[0]);
  });

  document.querySelectorAll(".sample-btn").forEach((button) => {
    button.addEventListener("click", () => loadSample(button.dataset.sample));
  });

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => setTab(tab.dataset.tab));
  });

  elements.prdOutput.addEventListener("input", () => updateDraftStatus("编辑中"));
  elements.briefOutput.addEventListener("input", () => updateDraftStatus("编辑中"));

  window.addEventListener("beforeunload", () => {
    if (
      elements.documentInput.value.trim() ||
      elements.prdOutput.textContent.trim() ||
      elements.briefOutput.textContent.trim()
    ) {
      saveDraft(true);
    }
  });
}

function init() {
  if (!elements.documentInput) return;
  bindEvents();
  loadSavedApiKey();
  elements.modelMode.value = state.modelMode;
  updateModelLabel();
  updateSampleLabel();
  updateDocStats();
  updateDraftStatus("未保存");
  loadSample("police");
}

init();
