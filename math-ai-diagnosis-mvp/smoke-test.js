const fs = require("fs");

const ids = [
  "totalDiagnoses",
  "topErrorType",
  "lastReview",
  "diagnose",
  "grade",
  "module",
  "problem",
  "process",
  "studentAnswer",
  "correctAnswer",
  "goal",
  "readinessText",
  "readinessBar",
  "clearBtn",
  "diagnoseBtn",
  "checkPracticeBtn",
  "copyReportBtn",
  "downloadReportBtn",
  "saveAgainBtn",
  "clearHistoryBtn",
  "emptyState",
  "diagnosis",
  "statusPill",
  "knowledgePoint",
  "moduleResult",
  "answerStatus",
  "errorTags",
  "oneLine",
  "diagnosisSummary",
  "errorLocation",
  "levelList",
  "planList",
  "strategyList",
  "practiceQuestion",
  "practiceAnswer",
  "practiceFeedback",
  "exampleGrid",
  "historyList"
];

const elements = {};

function makeElement(id) {
  return {
    id,
    value: "",
    textContent: "",
    innerHTML: "",
    className: "",
    dataset: {},
    style: {},
    addEventListener() {},
    appendChild() {},
    click() {},
    remove() {},
    closest() {
      return null;
    },
    scrollIntoView() {},
    classList: {
      add() {},
      remove() {}
    }
  };
}

ids.forEach((id) => {
  elements[id] = makeElement(id);
});

elements.grade.value = "八年级";
elements.module.value = "auto";

const storage = {};

global.localStorage = {
  getItem(key) {
    return storage[key] || null;
  },
  setItem(key, value) {
    storage[key] = value;
  }
};

global.URL = {
  createObjectURL() {
    return "blob:report";
  },
  revokeObjectURL() {}
};

global.Blob = function Blob(parts, options) {
  return { parts, options };
};

global.document = {
  body: {
    addEventListener() {},
    appendChild() {}
  },
  createElement() {
    return makeElement("created");
  },
  querySelector(selector) {
    if (selector.startsWith("#")) return elements[selector.slice(1)];
    if (selector === "#diagnose") return makeElement("diagnose");
    return null;
  },
  querySelectorAll(selector) {
    if (selector !== "[data-sample]") return [];
    return Object.keys({
      function: true,
      equation: true,
      geometry: true,
      inequality: true,
      quadratic: true,
      probability: true
    }).map((name) => ({
      dataset: { sample: name },
      addEventListener() {}
    }));
  }
};

global.navigator = {
  clipboard: {
    writeText: async () => {}
  }
};

global.alert = (message) => {
  throw new Error(message);
};

const appCode = fs.readFileSync("app.js", "utf8");
eval(appCode);

loadSample("function");

if (elements.knowledgePoint.textContent !== "一次函数图像与解析式") {
  throw new Error(`Knowledge render failed: ${elements.knowledgePoint.textContent}`);
}

if (!elements.errorTags.innerHTML.includes("概念没想清楚")) {
  throw new Error(`Tag render failed: ${elements.errorTags.innerHTML}`);
}

if (!elements.planList.innerHTML.includes("三天后")) {
  throw new Error("Plan render failed.");
}

if (!elements.practiceQuestion.textContent.includes("一次函数")) {
  throw new Error("Practice render failed.");
}

elements.practiceAnswer.value = "y=3x+1";
checkPractice();

if (!elements.practiceFeedback.textContent.includes("答对了")) {
  throw new Error(`Practice check failed: ${elements.practiceFeedback.textContent}`);
}

const report = buildReport(createDiagnosisFromInput());
if (!report.includes("错题复盘报告") || !report.includes("一次函数图像与解析式")) {
  throw new Error("Report generation failed.");
}

elements.problem.value =
  "某班一次数学测验共有 20 道选择题，每题答对得 5 分，答错或不答得 0 分。小明这次测验得了 75 分，问他答对了多少道题？";
elements.process.value = "设小明答对了 x 道题。因为每题 5 分，所以 20x=75。解得 x=3.75。";
elements.studentAnswer.value = "3.75 道";
elements.correctAnswer.value = "15 道";
elements.goal.value = "为什么不能用 20x=75？为什么答案不能是小数？";

const scoreDiagnosis = createDiagnosisFromInput();
if (scoreDiagnosis.knowledge.id !== "score-equation") {
  throw new Error(`Score word problem was not detected: ${scoreDiagnosis.knowledge.id}`);
}

const scoreLocation = buildLocation(scoreDiagnosis.knowledge, scoreDiagnosis.tags, scoreDiagnosis);
if (!scoreLocation.includes("5x=75") || !scoreLocation.includes("总题数")) {
  throw new Error(`Score diagnosis did not use the new problem context: ${scoreLocation}`);
}

console.log("Smoke test passed.");
