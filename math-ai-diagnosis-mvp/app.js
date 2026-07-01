const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const STORAGE_KEY = "math_diagnosis_records_v2";

const samples = {
  function: {
    title: "一次函数参数混淆",
    grade: "八年级",
    module: "auto",
    difficulty: "基础",
    problem: "已知一次函数 y=kx+b 的图像经过点 (0,2) 和 (3,8)，求这个一次函数的解析式。",
    process: "因为经过 (0,2)，所以 k=2。又经过 (3,8)，代入得到 8=3b+2，所以 b=2。最后得到 y=3x+2。",
    studentAnswer: "y=3x+2",
    correctAnswer: "y=2x+2",
    goal: "我不知道为什么不能把 2 当成 k。"
  },
  equation: {
    title: "一元一次方程符号错误",
    grade: "七年级",
    module: "auto",
    difficulty: "基础",
    problem: "解方程：3(x-2)+4=2x+5。",
    process: "去括号得 3x-6+4=2x+5，所以 3x-10=2x+5，移项得到 x=15。",
    studentAnswer: "x=15",
    correctAnswer: "x=7",
    goal: "我想知道去括号以后哪里算错了。"
  },
  geometry: {
    title: "勾股定理公式误用",
    grade: "八年级",
    module: "auto",
    difficulty: "基础",
    problem: "在直角三角形 ABC 中，∠C=90°，AC=6，BC=8，求斜边 AB 的长度。",
    process: "根据勾股定理，AB=AC+BC=6+8=14。",
    studentAnswer: "14",
    correctAnswer: "10",
    goal: "我想知道勾股定理公式怎么用。"
  },
  inequality: {
    title: "不等式实际范围",
    grade: "七年级",
    module: "auto",
    difficulty: "进阶",
    problem: "某文具店笔记本每本 4 元，小明最多有 25 元，买了 3 支 2 元的笔后，还能买多少本笔记本？",
    process: "设可以买 x 本，4x+6<25，所以 x<4.75，答案是 x<4.75。",
    studentAnswer: "x<4.75",
    correctAnswer: "最多 4 本",
    goal: "我不知道为什么不能写小数。"
  },
  quadratic: {
    title: "二次函数顶点",
    grade: "九年级",
    module: "auto",
    difficulty: "进阶",
    problem: "求二次函数 y=x²-4x+3 的顶点坐标。",
    process: "我直接看出 b=-4，所以顶点横坐标是 -4，代入得到 y=35。",
    studentAnswer: "(-4,35)",
    correctAnswer: "(2,-1)",
    goal: "我不清楚顶点坐标公式怎么用。"
  },
  probability: {
    title: "概率分母选错",
    grade: "九年级",
    module: "auto",
    difficulty: "基础",
    problem: "袋中有 3 个红球和 2 个蓝球，随机摸出 1 个球，摸到红球的概率是多少？",
    process: "红球有 3 个，所以摸到红球的概率是 1/3。",
    studentAnswer: "1/3",
    correctAnswer: "3/5",
    goal: "为什么不是从红球里面选一个？"
  },
  score: {
    title: "得分应用题建模",
    grade: "七年级",
    module: "auto",
    difficulty: "基础",
    problem: "一次小测有 12 道题，每题答对得 4 分，答错或不答得 0 分。小华得了 32 分，问他答对了多少道题？",
    process: "设答对了 x 道，因为一共有 12 道题，所以 12x=32，解得 x=2.67。",
    studentAnswer: "2.67 道",
    correctAnswer: "8 道",
    goal: "为什么不能用总题数乘 x？"
  }
};

const knowledgeRules = [
  {
    id: "linear-function",
    module: "函数",
    point: "一次函数图像与解析式",
    keywords: ["一次函数", "y=kx+b", "k", "b", "斜率", "截距", "图像", "坐标", "经过点", "解析式"]
  },
  {
    id: "quadratic-function",
    module: "函数",
    point: "二次函数图像与性质",
    keywords: ["二次函数", "抛物线", "顶点", "对称轴", "开口", "y=x²", "y=ax", "最值"]
  },
  {
    id: "score-equation",
    module: "方程与不等式",
    point: "方程应用题：得分与数量关系",
    keywords: ["每题", "得分", "答对", "答错", "不答", "选择题", "测验", "总分", "多少道题", "道题"]
  },
  {
    id: "equation",
    module: "方程与不等式",
    point: "一元一次方程的化简与求解",
    keywords: ["方程", "解方程", "移项", "等式", "去括号", "合并同类项", "x="]
  },
  {
    id: "inequality",
    module: "方程与不等式",
    point: "不等式与实际问题",
    keywords: ["不等式", "大于", "小于", "不超过", "最多", "至少", "范围", "解集"]
  },
  {
    id: "pythagorean",
    module: "几何",
    point: "勾股定理及其应用",
    keywords: ["勾股", "直角三角形", "斜边", "直角边", "平方和", "90°", "90度"]
  },
  {
    id: "similarity",
    module: "几何",
    point: "相似三角形的判定与性质",
    keywords: ["相似", "对应边", "对应角", "比例", "三角形"]
  },
  {
    id: "probability",
    module: "概率统计",
    point: "概率与等可能事件",
    keywords: ["概率", "频率", "随机", "可能性", "红球", "蓝球", "样本"]
  },
  {
    id: "statistics",
    module: "概率统计",
    point: "统计量与数据分析",
    keywords: ["平均数", "中位数", "众数", "方差", "统计图", "数据"]
  }
];

const tagMeta = {
  concept: { label: "概念没想清楚", className: "concept" },
  formula: { label: "公式用错了", className: "formula" },
  calculation: { label: "计算或符号出错", className: "calculation" },
  logic: { label: "步骤跳得太快", className: "logic" },
  reading: { label: "题目条件漏看", className: "default" },
  visual: { label: "图形关系看错", className: "default" },
  expression: { label: "步骤写得不完整", className: "default" }
};

const practiceBank = {
  "linear-function": {
    question: "已知一次函数 y=kx+b 经过点 (0,1) 和 (2,7)，求函数解析式。",
    answer: "y=3x+1",
    hint: "先用 (0,1) 得到 b，再代入 (2,7) 求 k。"
  },
  "quadratic-function": {
    question: "求二次函数 y=x²-6x+5 的顶点坐标。",
    answer: "(3,-4)",
    hint: "配方得到 y=(x-3)²-4。"
  },
  "score-equation": {
    question: "一次小测有 15 道题，每题答对得 6 分，答错或不答得 0 分。小李得了 72 分，他答对了多少道题？",
    answer: "12",
    hint: "设答对 x 道，应列 6x=72，而不是 15x=72。"
  },
  equation: {
    question: "解方程：2(x+3)-5=x+4。",
    answer: "x=3",
    hint: "先去括号，再合并同类项。"
  },
  inequality: {
    question: "小明有 30 元，买了 8 元饮料后，还想买每本 5 元的本子，最多可以买几本？",
    answer: "4",
    hint: "5x+8≤30，且本数必须是整数。"
  },
  pythagorean: {
    question: "直角三角形两条直角边分别为 5 和 12，求斜边长度。",
    answer: "13",
    hint: "斜边平方等于两直角边平方和。"
  },
  similarity: {
    question: "若两个三角形相似，对应边之比为 2:3，其中小三角形一边为 6，则大三角形对应边是多少？",
    answer: "9",
    hint: "对应边按同一比例放大。"
  },
  probability: {
    question: "袋中有 4 个白球和 6 个黑球，随机摸出 1 个球，摸到白球的概率是多少？",
    answer: "2/5",
    hint: "概率=目标结果数/所有等可能结果数。"
  },
  statistics: {
    question: "数据 2、3、3、4、8 的中位数是多少？",
    answer: "3",
    hint: "先排序，再找最中间的数。"
  },
  default: {
    question: "用自己的话解释这道题考查的核心知识点，并重新写一遍关键步骤。",
    answer: "步骤完整且理由清楚",
    hint: "重点看条件、公式、代入和结论是否对应。"
  }
};

let currentDiagnosis = null;
let diagnosisHistory = loadHistory();

function normalize(value) {
  return String(value || "")
    .replace(/\s+/g, "")
    .replace(/[。；，,;]/g, "")
    .replace(/：/g, ":")
    .toLowerCase();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function countKeywordHits(text, keywords) {
  return keywords.reduce((count, keyword) => count + (text.includes(keyword.toLowerCase()) ? 1 : 0), 0);
}

function detectKnowledge(problem, process, selectedModule) {
  const combined = `${problem} ${process}`.toLowerCase();
  const ranked = knowledgeRules
    .map((rule) => ({
      ...rule,
      score: countKeywordHits(combined, rule.keywords)
    }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0] && ranked[0].score > 0 ? ranked[0] : null;

  if (selectedModule !== "auto") {
    const moduleRule = ranked.find((rule) => rule.module === selectedModule && rule.score > 0);
    return moduleRule || {
      id: "default",
      module: selectedModule,
      point: `${selectedModule}综合题`,
      score: 1
    };
  }

  return best || {
    id: "default",
    module: "还需要更多信息",
    point: "综合数学问题",
    score: 0
  };
}

function compareAnswers(studentAnswer, correctAnswer) {
  if (!correctAnswer.trim()) {
    return {
      known: false,
      status: "还没填写正确答案",
      matched: null
    };
  }

  const student = normalize(studentAnswer);
  const correct = normalize(correctAnswer);
  const matched = student === correct;

  return {
    known: true,
    status: matched ? "和正确答案一致" : "和正确答案不一致",
    matched
  };
}

function includesAny(text, words) {
  return words.some((word) => text.includes(word));
}

function extractScoreContext(problem) {
  const text = String(problem || "");
  const perScore = text.match(/每题[^0-9]*(\d+)\s*分/)?.[1];
  const totalScore =
    text.match(/(?:得了|得分为|得分是|总分为|总分是|总分)\s*(\d+)\s*分/)?.[1] ||
    text.match(/(?:测验|考试|小测)[^。；，,]*?得\s*(\d+)\s*分/)?.[1];
  const totalQuestions = text.match(/(?:共|共有|有)\s*(\d+)\s*道/)?.[1] || text.match(/(\d+)\s*道(?:选择题|题)/)?.[1];
  return { perScore, totalScore, totalQuestions };
}

function formatScoreEquation(context) {
  const details = extractScoreContext(context?.problem);
  if (details.perScore && details.totalScore) {
    return `${details.perScore}x=${details.totalScore}`;
  }
  return "每题得分 × 答对题数 = 总得分";
}

function detectErrorTags({ knowledge, process, problem, answerComparison, studentAnswer }) {
  const processText = normalize(process);
  const problemText = normalize(problem);
  const answerText = normalize(studentAnswer);
  const tags = new Set();

  if (!process.trim() || process.trim().length < 18) {
    tags.add("expression");
    tags.add("logic");
  }

  if (answerComparison.known && !answerComparison.matched) {
    tags.add("calculation");
  }

  if (knowledge.id === "linear-function") {
    const confusesKB =
      includesAny(processText, ["k=2", "b=3", "8=3b+2", "k是截距", "b是斜率"]) ||
      (processText.includes("经过(0") && processText.includes("k="));
    if (confusesKB) tags.add("concept");
    if (!processText.includes("代入") && !processText.includes("坐标")) tags.add("logic");
  }

  if (knowledge.id === "quadratic-function") {
    if (!includesAny(processText, ["配方", "顶点", "对称轴", "-b/2a"])) tags.add("concept");
  }

  if (knowledge.id === "equation") {
    if (includesAny(processText, ["3x-10", "移项变号", "等式两边"])) tags.add("calculation");
    if (!includesAny(processText, ["去括号", "合并", "移项", "等式"])) tags.add("logic");
  }

  if (knowledge.id === "score-equation") {
    const details = extractScoreContext(problem);
    if (details.totalQuestions && processText.includes(`${details.totalQuestions}x`)) {
      tags.add("concept");
    }
    if (answerText.includes(".") || processText.includes(".")) {
      tags.add("reading");
    }
    if (!includesAny(processText, ["设", "x", "答对"])) {
      tags.add("logic");
    }
  }

  if (knowledge.id === "inequality") {
    if (!includesAny(processText, ["整数", "最多", "至少", "范围", "实际"])) tags.add("reading");
    if (!includesAny(processText, ["≤", "<=", "不超过", "最多"])) tags.add("formula");
  }

  if (knowledge.id === "pythagorean") {
    if (includesAny(processText, ["ab=ac+bc", "斜边=直角边", "6+8", "5+12"])) {
      tags.add("formula");
      tags.add("concept");
    }
    if (!includesAny(processText, ["平方", "²", "^2"])) tags.add("formula");
  }

  if (knowledge.id === "probability") {
    if (!includesAny(processText, ["总数", "所有", "一共", "5", "10"])) tags.add("concept");
  }

  if (knowledge.module === "几何" && !includesAny(processText, ["角", "边", "图", "辅助线", "对应"])) {
    tags.add("visual");
  }

  if (includesAny(problemText, ["至少", "不超过", "最多", "最大", "最小", "范围", "单位", "实际意义"])) {
    if (!includesAny(processText, ["范围", "单位", "实际", "至少", "最多", "不超过", "整数"])) {
      tags.add("reading");
    }
  }

  if (tags.size === 0) {
    tags.add(answerComparison.known && answerComparison.matched ? "logic" : "concept");
  }

  return Array.from(tags);
}

function buildLocation(knowledge, tags, context = {}) {
  if (tags.includes("expression")) {
    return "你写下来的步骤还不够完整，所以我只能先判断大方向。建议补上列式、代入、化简这几步，这样能更准确地找到卡点。";
  }

  if (knowledge.id === "linear-function") {
    return "你大概率是在确定 k、b 的时候混淆了。一次函数 y=kx+b 里，b 是 x=0 时的 y 值；k 表示 x 每增加 1，y 跟着变化多少。不能把点的纵坐标直接当成 k。";
  }

  if (knowledge.id === "quadratic-function") {
    return "你大概率把二次函数顶点公式或配方法用错了。顶点横坐标不是直接取 b，而是先看 -b/(2a)，再代回求纵坐标。";
  }

  if (knowledge.id === "equation") {
    return "你大概率是在去括号或合并同类项时把符号算错了。方程每一步都要保持等式两边平衡，常数项尤其要单独检查。";
  }

  if (knowledge.id === "score-equation") {
    const equation = formatScoreEquation(context);
    const details = extractScoreContext(context.problem);
    const totalText = details.totalQuestions ? `题目里的 ${details.totalQuestions} 道是“总题数”，不是每答对一道增加的分数。` : "";
    return `你主要错在方程建模：如果设 x 为答对题数，应该用“每题得分 × 答对题数 = 总得分”，也就是 ${equation}。${totalText}另外，答对题数必须是整数，不能出现 3.75 道这样的答案。`;
  }

  if (knowledge.id === "inequality") {
    return "你已经能列出不等关系，但最后没有回到实际问题。像“买几本”这类答案必须是整数，还要符合“最多”“至少”等限制。";
  }

  if (knowledge.id === "pythagorean") {
    return "你把斜边当成两条直角边直接相加了。勾股定理比较的是平方关系：斜边²=直角边²+直角边²。";
  }

  if (knowledge.id === "probability") {
    return "你把目标数量和总数量混在一起了。概率的分母应该是所有等可能结果的总数，不是只看红球或目标情况。";
  }

  if (tags.includes("reading")) {
    return "你可能漏看了题目里的限制条件，比如范围、单位、实际意义等。最终答案要回到题目要求里检查。";
  }

  return "你主要卡在“知道知识点”到“能写出正确步骤”的连接处。建议逐行检查：用了哪个条件、套了哪个关系、推出了什么结论。";
}

function buildLevels(knowledge, tags, context = {}) {
  const scoreEquation = formatScoreEquation(context);
  const base = {
    "linear-function": [
      ["先记住本质", "y=kx+b 中，b 是图像和 y 轴的交点；k 是变化速度，也就是 x 每增加 1，y 增加多少。"],
      ["这道题怎么做", "点 (0,2) 说明 b=2。再把 (3,8) 代入 y=kx+2，得到 8=3k+2，所以 k=2。答案是 y=2x+2。"],
      ["下次怎么判断", "看到“经过两个点求解析式”，先找有没有 x=0 的点，再代入另一个点求剩下的未知数。"]
    ],
    "quadratic-function": [
      ["先记住本质", "二次函数顶点表示图像最高或最低的位置。求顶点可以用配方法，也可以用 x=-b/(2a)。"],
      ["这道题怎么做", "y=x²-4x+3=(x-2)²-1，所以顶点是 (2,-1)。"],
      ["下次怎么判断", "不要直接把 b 当成横坐标。先求对称轴，再代回原式求 y。"]
    ],
    equation: [
      ["先记住本质", "解方程就是让等式两边一直保持平衡。你可以移项、化简，但左右两边的关系不能被破坏。"],
      ["这道题怎么做", "3(x-2)+4 应该化成 3x-6+4，也就是 3x-2，不是 3x-10。后面再移项求出 x=7。"],
      ["下次怎么判断", "去括号后先把常数项合并完，再移项。不要一边去括号一边移项，容易把符号弄乱。"]
    ],
    "score-equation": [
      ["先记住本质", "这类题的未知数通常是“答对了几道”。总题数只是上限或背景条件，不是乘在 x 前面的得分。"],
      ["这道题怎么做", `设 x 为答对题数，应列“每题得分 × x = 总得分”，即 ${scoreEquation}。解出 x 后，还要确认它是整数且不超过总题数。`],
      ["下次怎么判断", "看到“每题多少分、共得多少分、问答对几道”，先找每答对一道贡献多少分，再用总得分除以每题得分。"]
    ],
    inequality: [
      ["先记住本质", "不等式应用题最后要回到实际情境。能不能取小数、要不要取整数，取决于题目问的是什么。"],
      ["这道题怎么做", "买本子的数量必须是整数。x<4.75 表示最多只能买 4 本。"],
      ["下次怎么判断", "列完不等式后问自己：这个未知数在现实里能不能是小数？答案有没有符合“最多”“至少”？"]
    ],
    pythagorean: [
      ["先记住本质", "勾股定理不是边长相加，而是平方相加。只在直角三角形里使用。"],
      ["这道题怎么做", "AB²=AC²+BC²=6²+8²=36+64=100，所以 AB=10。"],
      ["下次怎么判断", "先找斜边，再写平方关系，最后开方。不要直接把两条边加起来。"]
    ],
    probability: [
      ["先记住本质", "概率=目标结果数÷所有等可能结果数。分母永远看总情况，不只看目标情况。"],
      ["这道题怎么做", "红球 3 个，球一共 5 个，所以摸到红球的概率是 3/5。"],
      ["下次怎么判断", "先数所有可能结果，再数目标结果，最后写成分数并约分。"]
    ],
    default: [
      ["先记住本质", `${knowledge.point} 的关键是把题目条件转成对应的数学关系。`],
      ["这道题怎么做", "把每一步写成“题目条件 -> 用到的公式或性质 -> 得到的结论”，错误会更容易暴露。"],
      ["下次怎么判断", "做完以后把答案代回题目，看是否满足所有条件。"]
    ]
  };

  const levels = base[knowledge.id] || base.default;

  if (tags.includes("reading")) {
    levels.push(["额外提醒", "写最终答案前，再检查有没有漏掉单位、范围或题目要求的实际意义。"]);
  }

  return levels;
}

function buildStrategies(knowledge, tags) {
  const strategies = [
    "先把已知条件圈出来，再决定用哪个知识点。",
    "每一步只做一件事，别把代入、化简、移项混在一起。",
    "做完后把答案代回原题检查一遍。"
  ];

  if (knowledge.module === "函数") {
    strategies.unshift("函数题先把表达式、坐标点和图像关系对应起来。");
  }

  if (knowledge.module === "几何") {
    strategies.unshift("几何题先确认图形关系，尤其要分清直角边、斜边、对应边。");
  }

  if (knowledge.module === "概率统计") {
    strategies.unshift("概率统计题先分清“目标数量”和“总数量”。");
  }

  if (knowledge.id === "score-equation") {
    strategies.unshift("得分应用题先分清“总题数、每题分值、总得分”，不要把总题数当成每题分值。");
    strategies.push("如果未知数表示“几道题、几个人、几本书”，最终答案通常要是整数。");
  }

  if (tags.includes("calculation")) {
    strategies.push("把容易出错的符号和常数项单独圈出来复查。");
  }

  return strategies;
}

function buildPlan(knowledge, tags) {
  const tagText = tags.map((tag) => tagMeta[tag]?.label || tag).join("、");
  return [
    {
      day: "今天",
      task: `重做原题，重点盯住“${tagText}”。先遮住答案，独立写出完整步骤。`
    },
    {
      day: "明天",
      task: `找 2 道 ${knowledge.point} 的同类题，只练关键步骤，不急着刷难题。`
    },
    {
      day: "三天后",
      task: "回到错题本复盘：能不能一眼说出错因，并用自己的话讲清楚本质。"
    }
  ];
}

function buildPrompt({ grade, moduleValue, problem, process, studentAnswer, correctAnswer, goal }) {
  return `你是一名初中数学错题诊断助手，请用学生能听懂的话分析错因。

年级：${grade}
知识模块：${moduleValue === "auto" ? "请自动识别" : moduleValue}
题目：${problem}
学生做法：${process}
学生答案：${studentAnswer || "未填写"}
正确答案：${correctAnswer || "未提供"}
学生最想弄懂的问题：${goal || "未填写"}

输出结构：
1. 这道题主要卡在哪里
2. 可能的错因标签
3. 具体错在哪一步
4. 用学生能懂的话重新讲一遍
5. 下次遇到这类题该怎么做
6. 给一道同类巩固题`;
}

function calculateDepth(knowledge, tags, answerComparison, process) {
  let score = 50;
  if (knowledge.id !== "default") score += 20;
  if (answerComparison.known) score += 15;
  if (process.trim().length > 40) score += 10;
  if (tags.includes("expression")) score -= 15;
  return Math.max(35, Math.min(95, score));
}

function createDiagnosisFromInput() {
  const grade = $("#grade").value;
  const moduleValue = $("#module").value;
  const problem = $("#problem").value.trim();
  const process = $("#process").value.trim();
  const studentAnswer = $("#studentAnswer").value.trim();
  const correctAnswer = $("#correctAnswer").value.trim();
  const goal = $("#goal").value.trim();

  if (!problem || !process) {
    alert("请先填写题目和你的做法。");
    return null;
  }

  const knowledge = detectKnowledge(problem, process, moduleValue);
  const answerComparison = compareAnswers(studentAnswer, correctAnswer);
  const tags = detectErrorTags({ knowledge, process, problem, answerComparison, studentAnswer, correctAnswer });
  const levels = buildLevels(knowledge, tags, { problem, process, studentAnswer, correctAnswer, goal });
  const strategies = buildStrategies(knowledge, tags);
  const plan = buildPlan(knowledge, tags);
  const practice = practiceBank[knowledge.id] || practiceBank.default;
  const depth = calculateDepth(knowledge, tags, answerComparison, process);
  const prompt = buildPrompt({ grade, moduleValue, problem, process, studentAnswer, correctAnswer, goal });

  return {
    id: `record-${Date.now()}`,
    createdAt: new Date().toISOString(),
    grade,
    moduleValue,
    problem,
    process,
    studentAnswer,
    correctAnswer,
    goal,
    knowledge,
    answerComparison,
    tags,
    levels,
    strategies,
    plan,
    practice,
    depth,
    prompt
  };
}

function diagnose() {
  const result = createDiagnosisFromInput();
  if (!result) return;
  currentDiagnosis = result;
  renderDiagnosis(currentDiagnosis);
  saveRecord(currentDiagnosis);
  renderHistory();
  renderStats();
}

function renderDiagnosis(result) {
  $("#emptyState").classList.add("hidden");
  $("#diagnosis").classList.remove("hidden");
  $("#statusPill").textContent = `分析完成 ${result.depth}%`;

  $("#knowledgePoint").textContent = result.knowledge.point;
  $("#moduleResult").textContent = result.knowledge.module;
  $("#answerStatus").textContent = result.answerComparison.status;

  $("#errorTags").innerHTML = result.tags
    .map((tag) => {
      const meta = tagMeta[tag] || { label: tag, className: "default" };
      return `<span class="tag ${meta.className}">${meta.label}</span>`;
    })
    .join("");

  const primaryTag = tagMeta[result.tags[0]]?.label || "知识点还不稳定";
  $("#oneLine").textContent = primaryTag;
  $("#diagnosisSummary").textContent = `这道题考查 ${result.knowledge.point}。建议先修正“${primaryTag}”，再做同类题确认是否掌握。`;
  $("#errorLocation").textContent = buildLocation(result.knowledge, result.tags, result);

  $("#levelList").innerHTML = result.levels
    .map(([title, content]) => `<div class="level-item"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(content)}</span></div>`)
    .join("");

  $("#planList").innerHTML = result.plan
    .map((item) => `<div class="plan-item"><strong>${escapeHtml(item.day)}</strong><span>${escapeHtml(item.task)}</span></div>`)
    .join("");

  $("#strategyList").innerHTML = result.strategies.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  $("#practiceQuestion").textContent = result.practice.question;
  $("#practiceAnswer").value = "";
  $("#practiceFeedback").textContent = `小提示：${result.practice.hint}`;
  $("#practiceFeedback").className = "practice-feedback";
}

function buildReport(result) {
  if (!result) return "";
  const tags = result.tags.map((tag) => tagMeta[tag]?.label || tag).join("、");
  const levels = result.levels.map(([title, content]) => `- ${title}：${content}`).join("\n");
  const plan = result.plan.map((item) => `- ${item.day}：${item.task}`).join("\n");
  const strategies = result.strategies.map((item) => `- ${item}`).join("\n");

  return `错题复盘报告

年级：${result.grade}
知识点：${result.knowledge.point}
题目类型：${result.knowledge.module}
答案对比：${result.answerComparison.status}
主要错因：${tags}

题目：
${result.problem}

我的做法：
${result.process}

具体错在哪里：
${buildLocation(result.knowledge, result.tags, result)}

怎么重新学会：
${levels}

3 天复习计划：
${plan}

下次遇到这类题：
${strategies}

同类巩固题：
${result.practice.question}
提示：${result.practice.hint}`;
}

function checkPractice() {
  if (!currentDiagnosis) {
    $("#practiceFeedback").textContent = "先完成一次错题分析，再检查同类题。";
    $("#practiceFeedback").className = "practice-feedback needs-work";
    return;
  }

  const user = normalize($("#practiceAnswer").value);
  const expected = normalize(currentDiagnosis.practice.answer);

  if (!user) {
    $("#practiceFeedback").textContent = "先写一个答案，再检查自己有没有掌握。";
    $("#practiceFeedback").className = "practice-feedback needs-work";
    return;
  }

  if (user === expected) {
    $("#practiceFeedback").textContent = "答对了。说明你已经能把刚才的方法用到同类题上。";
    $("#practiceFeedback").className = "practice-feedback good";
  } else {
    $("#practiceFeedback").textContent = `还差一点。先别急着看答案，回到这条提示再试一次：${currentDiagnosis.practice.hint}`;
    $("#practiceFeedback").className = "practice-feedback needs-work";
  }
}

async function copyReport() {
  if (!currentDiagnosis) return;
  const report = buildReport(currentDiagnosis);
  try {
    await navigator.clipboard.writeText(report);
    showTemporaryText("#copyReportBtn", "已复制");
  } catch {
    alert("浏览器不允许直接复制，可以下载报告保存。");
  }
}

function downloadReport() {
  if (!currentDiagnosis) return;
  const report = buildReport(currentDiagnosis);
  const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `错题复盘-${currentDiagnosis.knowledge.point}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function showTemporaryText(selector, text) {
  const button = $(selector);
  const original = button.textContent;
  button.textContent = text;
  setTimeout(() => {
    button.textContent = original;
  }, 1200);
}

function loadSample(name) {
  const sample = samples[name];
  if (!sample) return;

  $("#grade").value = sample.grade;
  $("#module").value = sample.module;
  $("#problem").value = sample.problem;
  $("#process").value = sample.process;
  $("#studentAnswer").value = sample.studentAnswer;
  $("#correctAnswer").value = sample.correctAnswer;
  $("#goal").value = sample.goal;
  updateReadiness();
  diagnose();
  document.querySelector("#diagnose").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderExamples() {
  const grid = $("#exampleGrid");
  grid.innerHTML = Object.entries(samples)
    .map(
      ([key, sample]) => `
        <article class="example-card">
          <span>${escapeHtml(sample.grade)} · ${escapeHtml(sample.difficulty)}</span>
          <h3>${escapeHtml(sample.title)}</h3>
          <p>${escapeHtml(sample.problem)}</p>
          <button class="secondary-button" type="button" data-sample="${key}">填入这道题</button>
        </article>
      `
    )
    .join("");
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function persistHistory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(diagnosisHistory.slice(0, 12)));
}

function saveRecord(result) {
  diagnosisHistory = [result, ...diagnosisHistory.filter((item) => item.id !== result.id)].slice(0, 12);
  persistHistory();
}

function renderHistory() {
  const list = $("#historyList");
  if (!diagnosisHistory.length) {
    list.innerHTML = '<div class="history-item empty-record"><strong>还没有记录</strong><span>完成一次分析后，会在这里看到最近复盘过的知识点。</span></div>';
    return;
  }

  list.innerHTML = diagnosisHistory
    .map((item) => {
      const date = new Date(item.createdAt).toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
      const tags = item.tags.map((tag) => tagMeta[tag]?.label || tag).slice(0, 2).join(" / ");
      return `
        <article class="history-item">
          <strong>${escapeHtml(item.knowledge.point)}</strong>
          <span>${date} · ${escapeHtml(item.answerComparison.status)}</span>
          <span>${escapeHtml(tags)}</span>
          <button class="text-button" type="button" data-record="${escapeHtml(item.id)}">查看这次复盘</button>
        </article>
      `;
    })
    .join("");
}

function restoreRecord(id) {
  const record = diagnosisHistory.find((item) => item.id === id);
  if (!record) return;
  currentDiagnosis = record;
  renderDiagnosis(record);
  $("#grade").value = record.grade;
  $("#module").value = record.moduleValue;
  $("#problem").value = record.problem;
  $("#process").value = record.process;
  $("#studentAnswer").value = record.studentAnswer;
  $("#correctAnswer").value = record.correctAnswer;
  $("#goal").value = record.goal;
  updateReadiness();
  document.querySelector("#diagnose").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderStats() {
  $("#totalDiagnoses").textContent = String(diagnosisHistory.length);
  if (!diagnosisHistory.length) {
    $("#topErrorType").textContent = "暂无";
    $("#lastReview").textContent = "未开始";
    return;
  }

  const counts = {};
  diagnosisHistory.flatMap((item) => item.tags).forEach((tag) => {
    const label = tagMeta[tag]?.label || tag;
    counts[label] = (counts[label] || 0) + 1;
  });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "暂无";
  $("#topErrorType").textContent = top;
  $("#lastReview").textContent = new Date(diagnosisHistory[0].createdAt).toLocaleDateString("zh-CN");
}

function clearForm() {
  ["problem", "process", "studentAnswer", "correctAnswer", "goal"].forEach((id) => {
    $(`#${id}`).value = "";
  });
  $("#module").value = "auto";
  $("#grade").value = "八年级";
  $("#diagnosis").classList.add("hidden");
  $("#emptyState").classList.remove("hidden");
  $("#statusPill").textContent = "等待输入";
  currentDiagnosis = null;
  updateReadiness();
}

function updateReadiness() {
  const fields = ["problem", "process", "studentAnswer", "correctAnswer", "goal"];
  const filled = fields.filter((id) => $(`#${id}`).value.trim()).length;
  const percent = Math.round((filled / fields.length) * 100);
  $("#readinessBar").style.width = `${percent}%`;
  if (percent === 0) {
    $("#readinessText").textContent = "还没有开始";
  } else if (percent < 60) {
    $("#readinessText").textContent = "可以先写题目和做法";
  } else if (percent < 100) {
    $("#readinessText").textContent = "已经可以分析";
  } else {
    $("#readinessText").textContent = "信息很完整";
  }
}

function bindEvents() {
  $("#diagnoseBtn").addEventListener("click", diagnose);
  $("#clearBtn").addEventListener("click", clearForm);
  $("#checkPracticeBtn").addEventListener("click", checkPractice);
  $("#copyReportBtn").addEventListener("click", copyReport);
  $("#downloadReportBtn").addEventListener("click", downloadReport);
  $("#saveAgainBtn").addEventListener("click", () => {
    if (!currentDiagnosis) return;
    saveRecord(currentDiagnosis);
    renderHistory();
    renderStats();
    showTemporaryText("#saveAgainBtn", "已保存");
  });
  $("#clearHistoryBtn").addEventListener("click", () => {
    diagnosisHistory = [];
    persistHistory();
    renderHistory();
    renderStats();
  });

  ["problem", "process", "studentAnswer", "correctAnswer", "goal"].forEach((id) => {
    $(`#${id}`).addEventListener("input", updateReadiness);
  });

  document.body.addEventListener("click", (event) => {
    const sampleButton = event.target.closest("[data-sample]");
    if (sampleButton) {
      loadSample(sampleButton.dataset.sample);
      return;
    }

    const recordButton = event.target.closest("[data-record]");
    if (recordButton) {
      restoreRecord(recordButton.dataset.record);
    }
  });
}

renderExamples();
bindEvents();
renderHistory();
renderStats();
updateReadiness();
