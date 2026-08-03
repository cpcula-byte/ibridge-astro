#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# iBridge Education
# Bilingual Curriculum Catalogue Upgrade
# 繁中／英文課程目錄、教育研究與教育資源分類更新
#
# Scope:
# - Replaces only Programmes, Research and Resources pages.
# - Creates one shared bilingual curriculum catalogue.
# - Removes the previous technology-specific course category
#   from these three sections.
# - Preserves homepage images, logo, header, footer and global.css.
# ============================================================

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"

if [ -z "$ROOT" ]; then
  echo "錯誤：目前位置不是 Git 專案。"
  echo "Error: the current directory is not inside a Git repository."
  echo "請先執行：cd ~/Desktop/ibridge-astro"
  exit 1
fi

cd "$ROOT"

if [ ! -f package.json ] || [ ! -d src ] || [ ! -d public ]; then
  echo "錯誤：找不到完整的 Astro 專案結構。"
  echo "Error: package.json, src, or public is missing."
  exit 1
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR=".ibridge-backups/curriculum-catalogue-$STAMP"
mkdir -p "$BACKUP_DIR"

TARGETS=(
  "src/data/courseCatalog.ts"
  "src/components/CurriculumHub.astro"
  "src/styles/curriculum-hub.css"
  "public/scripts/course-resource-filter.js"
  "src/pages/programmes/index.astro"
  "src/pages/en/programmes/index.astro"
  "src/pages/research/index.astro"
  "src/pages/en/research/index.astro"
  "src/pages/resources/index.astro"
  "src/pages/en/resources/index.astro"
  "src/pages/programmes.astro"
  "src/pages/en/programmes.astro"
  "src/pages/research.astro"
  "src/pages/en/research.astro"
  "src/pages/resources.astro"
  "src/pages/en/resources.astro"
  "src/components/ResourceLibrary.astro"
  "src/data/resourceLibrary.ts"
  "src/styles/resource-library.css"
  "public/scripts/resource-library.js"
)

backup_targets() {
  local target
  for target in "${TARGETS[@]}"; do
    if [ -e "$target" ]; then
      mkdir -p "$BACKUP_DIR/$(dirname "$target")"
      cp -R "$target" "$BACKUP_DIR/$target"
    fi
  done
}

restore_targets() {
  local target
  for target in "${TARGETS[@]}"; do
    rm -rf "$target"
    if [ -e "$BACKUP_DIR/$target" ]; then
      mkdir -p "$(dirname "$target")"
      cp -R "$BACKUP_DIR/$target" "$target"
    fi
  done
}

echo "專案位置 / Project: $ROOT"
echo "備份位置 / Backup: $BACKUP_DIR"
backup_targets

mkdir -p \
  src/data \
  src/components \
  src/styles \
  public/scripts \
  src/pages/programmes \
  src/pages/en/programmes \
  src/pages/research \
  src/pages/en/research \
  src/pages/resources \
  src/pages/en/resources

# Remove duplicate single-file routes before creating index routes.
rm -f \
  src/pages/programmes.astro \
  src/pages/en/programmes.astro \
  src/pages/research.astro \
  src/pages/en/research.astro \
  src/pages/resources.astro \
  src/pages/en/resources.astro

# Remove files used by the previous resource-only catalogue.
rm -f \
  src/components/ResourceLibrary.astro \
  src/data/resourceLibrary.ts \
  src/styles/resource-library.css \
  public/scripts/resource-library.js


# ============================================================
# src/data/courseCatalog.ts
# ============================================================

cat > src/data/courseCatalog.ts <<'IBRIDGE_FILE_1_EOF'
export type SiteLanguage = "zh" | "en";
export type CatalogueMode = "programmes" | "research" | "resources";

export type CourseFamilyId =
  | "ib-myp"
  | "ib-dp"
  | "dp-core-writing"
  | "exam-preparation";

export type CourseSubject =
  | "Mathematics"
  | "English"
  | "Biology"
  | "Psychology"
  | "DP Core"
  | "Examinations";

export interface CourseFamily {
  id: CourseFamilyId;
  titleZh: string;
  titleEn: string;
  descriptionZh: string;
  descriptionEn: string;
}

export interface CourseTrack {
  id: string;
  family: CourseFamilyId;
  subject: CourseSubject;
  code: string;
  titleZh: string;
  titleEn: string;
  levelZh: string;
  levelEn: string;
  descriptionZh: string;
  descriptionEn: string;
  focusZh: string[];
  focusEn: string[];
  outcomesZh: string[];
  outcomesEn: string[];
  resourceTypesZh: string[];
  resourceTypesEn: string[];
  keywordsZh: string[];
  keywordsEn: string[];
}

export interface ResearchStrand {
  id: string;
  number: string;
  titleZh: string;
  titleEn: string;
  descriptionZh: string;
  descriptionEn: string;
  questionsZh: string[];
  questionsEn: string[];
  trackIds: string[];
}

export const courseFamilies: CourseFamily[] = [
  {
    id: "ib-myp",
    titleZh: "IB MYP 課程",
    titleEn: "IB MYP Programmes",
    descriptionZh:
      "依據 MYP 課程架構、概念導向學習、探究、ATL 技能、形成性評量與總結性評量，建立跨年級連貫課程。",
    descriptionEn:
      "Coherent programmes built around the MYP framework, concept-based learning, inquiry, ATL skills, formative assessment and summative assessment.",
  },
  {
    id: "ib-dp",
    titleZh: "IB DP 學科課程",
    titleEn: "IB DP Subject Programmes",
    descriptionZh:
      "支援學科知識、概念理解、內部評量、外部評量、學術寫作與考試準備。",
    descriptionEn:
      "Support for disciplinary knowledge, conceptual understanding, internal assessment, external assessment, academic writing and examination preparation.",
  },
  {
    id: "dp-core-writing",
    titleZh: "DP 核心與學術寫作",
    titleEn: "DP Core and Academic Writing",
    descriptionZh:
      "發展知識探究、獨立研究、論證、引用、反思與長篇學術寫作能力。",
    descriptionEn:
      "Development of knowledge inquiry, independent research, argument, citation, reflection and extended academic writing.",
  },
  {
    id: "exam-preparation",
    titleZh: "國際檢定與升學準備",
    titleEn: "International Test Preparation",
    descriptionZh:
      "針對不同考試版本與學生目標，整合語言能力、題型策略、時間管理與模擬評量。",
    descriptionEn:
      "Version-specific preparation integrating language development, task strategy, time management and diagnostic practice.",
  },
];

export const courseTracks: CourseTrack[] = [
  {
    id: "math-myp",
    family: "ib-myp",
    subject: "Mathematics",
    code: "MYP Mathematics",
    titleZh: "MYP 數學",
    titleEn: "MYP Mathematics",
    levelZh: "MYP 1–5",
    levelEn: "MYP Years 1–5",
    descriptionZh:
      "以技能、概念、推理與真實情境應用為核心，建立從基礎運算到代數、幾何、統計與探究的垂直銜接。",
    descriptionEn:
      "A vertically aligned pathway from core skills to algebra, geometry, statistics, reasoning and real-world investigation.",
    focusZh: ["數學技能與公式脈絡", "概念理解與問題解決", "Criterion A–D 評量準備"],
    focusEn: ["Skills and formula progression", "Conceptual reasoning and problem solving", "Criterion A–D assessment preparation"],
    outcomesZh: ["更穩定的計算與代數能力", "能清楚解釋方法與推理", "能完成探究及真實情境任務"],
    outcomesEn: ["Stronger calculation and algebra", "Clear mathematical reasoning", "Confidence with investigations and real-life tasks"],
    resourceTypesZh: ["課程地圖", "單元計畫", "技能練習", "探究任務", "評量與評分規準"],
    resourceTypesEn: ["Curriculum maps", "Unit plans", "Skills practice", "Investigations", "Assessments and rubrics"],
    keywordsZh: ["數學", "MYP", "代數", "幾何", "統計", "探究"],
    keywordsEn: ["mathematics", "MYP", "algebra", "geometry", "statistics", "investigation"],
  },
  {
    id: "english-myp-ela",
    family: "ib-myp",
    subject: "English",
    code: "MYP English Language Acquisition",
    titleZh: "MYP 英語習得（ELA）",
    titleEn: "MYP English Language Acquisition",
    levelZh: "Emergent／Capable／Proficient",
    levelEn: "Emergent / Capable / Proficient",
    descriptionZh:
      "依學生語言階段發展閱讀、寫作、聆聽、口說、文法、字彙及跨文化溝通能力。",
    descriptionEn:
      "Phase-responsive development of reading, writing, listening, speaking, grammar, vocabulary and intercultural communication.",
    focusZh: ["語言階段與垂直進程", "四項語言技能整合", "文本類型與溝通任務"],
    focusEn: ["Phase-based progression", "Integrated language skills", "Text types and communication tasks"],
    outcomesZh: ["提升英語理解與表達", "建立準確且自然的語言使用", "準備進入更高階 MYP 與 DP 課程"],
    outcomesEn: ["Improved comprehension and expression", "More accurate and natural language use", "Readiness for advanced MYP and DP study"],
    resourceTypesZh: ["分階段課程", "閱讀與聆聽文本", "口說任務", "寫作任務", "文法與字彙練習"],
    resourceTypesEn: ["Phase-based curricula", "Reading and listening texts", "Speaking tasks", "Writing tasks", "Grammar and vocabulary practice"],
    keywordsZh: ["英語習得", "ELA", "MYP", "閱讀", "寫作", "口說", "聆聽"],
    keywordsEn: ["English Language Acquisition", "ELA", "MYP", "reading", "writing", "speaking", "listening"],
  },
  {
    id: "english-myp-ll",
    family: "ib-myp",
    subject: "English",
    code: "MYP Language and Literature",
    titleZh: "MYP 英語語言與文學（LL）",
    titleEn: "MYP English Language and Literature",
    levelZh: "MYP 1–5",
    levelEn: "MYP Years 1–5",
    descriptionZh:
      "透過文學與非文學文本發展分析、詮釋、比較、創作、口語表達與媒體素養。",
    descriptionEn:
      "Literary and non-literary study developing analysis, interpretation, comparison, creative production, oral communication and media literacy.",
    focusZh: ["文學與非文學文本分析", "作者選擇與讀者效果", "分析寫作與創意表達"],
    focusEn: ["Literary and non-literary analysis", "Authorial choices and audience effects", "Analytical and creative communication"],
    outcomesZh: ["能以證據支持詮釋", "能分析語言與結構選擇", "能完成多種文本類型"],
    outcomesEn: ["Evidence-based interpretation", "Analysis of language and structure", "Control of varied text types"],
    resourceTypesZh: ["小說單元", "文本選集", "分析框架", "口說活動", "評量與示例"],
    resourceTypesEn: ["Novel units", "Text collections", "Analysis frameworks", "Oral activities", "Assessments and exemplars"],
    keywordsZh: ["語言與文學", "LL", "MYP", "文學", "文本分析", "媒體"],
    keywordsEn: ["Language and Literature", "LL", "MYP", "literature", "text analysis", "media"],
  },
  {
    id: "biology-myp",
    family: "ib-myp",
    subject: "Biology",
    code: "MYP Biology",
    titleZh: "MYP 生物",
    titleEn: "MYP Biology",
    levelZh: "MYP 1–5",
    levelEn: "MYP Years 1–5",
    descriptionZh:
      "結合生命科學概念、科學探究、資料分析、實驗設計與科學溝通。",
    descriptionEn:
      "Life-science concepts integrated with scientific inquiry, data analysis, experimental design and scientific communication.",
    focusZh: ["細胞、系統、遺傳、生態與演化", "實驗設計與變因控制", "Criterion A–D 科學評量"],
    focusEn: ["Cells, systems, genetics, ecology and evolution", "Experimental design and variable control", "Criterion A–D science assessment"],
    outcomesZh: ["建立連貫的生物概念", "能設計並評估科學探究", "能分析資料並形成結論"],
    outcomesEn: ["Coherent biological understanding", "Ability to design and evaluate inquiries", "Data analysis and evidence-based conclusions"],
    resourceTypesZh: ["概念閱讀", "實驗活動", "資料分析", "研究任務", "評量與評分規準"],
    resourceTypesEn: ["Concept readings", "Laboratory activities", "Data analysis", "Research tasks", "Assessments and rubrics"],
    keywordsZh: ["生物", "MYP", "科學", "實驗", "資料分析", "生態"],
    keywordsEn: ["biology", "MYP", "science", "experiment", "data analysis", "ecology"],
  },
  {
    id: "math-dp",
    family: "ib-dp",
    subject: "Mathematics",
    code: "DP Mathematics",
    titleZh: "DP 數學",
    titleEn: "DP Mathematics",
    levelZh: "DP 1–2",
    levelEn: "DP Years 1–2",
    descriptionZh:
      "依學生課程與程度支援函數、代數、微積分、統計、機率、數學建模與內部評量。",
    descriptionEn:
      "Support across functions, algebra, calculus, statistics, probability, modelling and the mathematics internal assessment.",
    focusZh: ["核心概念與計算技巧", "多步驟問題與考試策略", "數學探索與內部評量"],
    focusEn: ["Core concepts and techniques", "Multi-step problems and examination strategy", "Mathematical exploration and internal assessment"],
    outcomesZh: ["提升題目辨識與解題效率", "能連結概念、表示與方法", "完成具清楚論證的數學探究"],
    outcomesEn: ["Efficient problem recognition and solution", "Connections among concepts, representations and methods", "A clearly reasoned mathematical exploration"],
    resourceTypesZh: ["主題講義", "題型練習", "計算機技能", "模擬試題", "IA 指導"],
    resourceTypesEn: ["Topic notes", "Problem sets", "Calculator skills", "Mock examinations", "IA guidance"],
    keywordsZh: ["數學", "DP", "微積分", "統計", "機率", "IA"],
    keywordsEn: ["mathematics", "DP", "calculus", "statistics", "probability", "IA"],
  },
  {
    id: "english-dp-a",
    family: "ib-dp",
    subject: "English",
    code: "DP English A",
    titleZh: "DP English A",
    titleEn: "DP English A",
    levelZh: "DP 1–2",
    levelEn: "DP Years 1–2",
    descriptionZh:
      "發展文學與非文學文本分析、比較、全球議題、個人口試及考試論文寫作。",
    descriptionEn:
      "Literary and non-literary analysis, comparison, global issues, the individual oral and examination essay writing.",
    focusZh: ["文本細讀與作者選擇", "全球議題與跨文本連結", "IO、Paper 1 與 Paper 2"],
    focusEn: ["Close reading and authorial choices", "Global issues and intertextual connections", "IO, Paper 1 and Paper 2"],
    outcomesZh: ["建立精準且有層次的分析", "能以證據支持比較論點", "提升口試與限時寫作表現"],
    outcomesEn: ["Precise and layered analysis", "Evidence-based comparative argument", "Improved oral and timed-writing performance"],
    resourceTypesZh: ["文本分析工具", "全球議題規劃", "IO 指導", "Paper 1 練習", "Paper 2 論文"],
    resourceTypesEn: ["Text-analysis tools", "Global-issue planning", "IO guidance", "Paper 1 practice", "Paper 2 essays"],
    keywordsZh: ["English A", "DP", "文學", "文本分析", "IO", "Paper 1", "Paper 2"],
    keywordsEn: ["English A", "DP", "literature", "text analysis", "IO", "Paper 1", "Paper 2"],
  },
  {
    id: "english-dp-b",
    family: "ib-dp",
    subject: "English",
    code: "DP English B",
    titleZh: "DP English B",
    titleEn: "DP English B",
    levelZh: "DP 1–2",
    levelEn: "DP Years 1–2",
    descriptionZh:
      "整合主題式語言學習、閱讀、聆聽、口說、寫作、文本類型與跨文化理解。",
    descriptionEn:
      "Theme-based language learning integrating reading, listening, speaking, writing, text types and intercultural understanding.",
    focusZh: ["五大主題與核心語言", "文本類型、語域與受眾", "口試與考試任務"],
    focusEn: ["Five themes and core language", "Text type, register and audience", "Oral and examination tasks"],
    outcomesZh: ["提升流暢度與準確度", "能依目的使用合適文本類型", "提升閱讀、聆聽與口試表現"],
    outcomesEn: ["Greater fluency and accuracy", "Purposeful control of text types", "Improved reading, listening and oral performance"],
    resourceTypesZh: ["主題單元", "閱讀與聆聽練習", "文本類型指南", "口試題庫", "模擬試題"],
    resourceTypesEn: ["Thematic units", "Reading and listening practice", "Text-type guides", "Oral prompts", "Mock examinations"],
    keywordsZh: ["English B", "DP", "閱讀", "聆聽", "口試", "文本類型"],
    keywordsEn: ["English B", "DP", "reading", "listening", "oral", "text types"],
  },
  {
    id: "biology-dp",
    family: "ib-dp",
    subject: "Biology",
    code: "DP Biology",
    titleZh: "DP 生物",
    titleEn: "DP Biology",
    levelZh: "DP 1–2",
    levelEn: "DP Years 1–2",
    descriptionZh:
      "支援生物概念、資料分析、實驗技能、科學論證、內部評量與考試準備。",
    descriptionEn:
      "Support for biological concepts, data analysis, practical skills, scientific argument, internal assessment and examinations.",
    focusZh: ["分子、細胞、系統、遺傳、生態與演化", "實驗設計與資料處理", "IA 與考試作答"],
    focusEn: ["Molecules, cells, systems, genetics, ecology and evolution", "Experimental design and data processing", "IA and examination responses"],
    outcomesZh: ["建立跨主題概念連結", "能處理圖表、數據與實驗誤差", "提升科學解釋與評估能力"],
    outcomesEn: ["Connections across biological themes", "Confident handling of graphs, data and uncertainty", "Stronger scientific explanation and evaluation"],
    resourceTypesZh: ["概念筆記", "資料題", "實驗技能", "IA 指導", "考試練習"],
    resourceTypesEn: ["Concept notes", "Data-based questions", "Practical skills", "IA guidance", "Examination practice"],
    keywordsZh: ["生物", "DP", "IA", "實驗", "資料題", "遺傳", "生態"],
    keywordsEn: ["biology", "DP", "IA", "experiment", "data-based questions", "genetics", "ecology"],
  },
  {
    id: "psychology-dp",
    family: "ib-dp",
    subject: "Psychology",
    code: "DP Psychology",
    titleZh: "DP 心理學",
    titleEn: "DP Psychology",
    levelZh: "DP 1–2",
    levelEn: "DP Years 1–2",
    descriptionZh:
      "建立生物、認知與社會文化取向的概念理解、研究方法、研究評估與考試論述。",
    descriptionEn:
      "Conceptual understanding across biological, cognitive and sociocultural approaches, research methods, study evaluation and examination argument.",
    focusZh: ["核心理論與關鍵研究", "研究方法與倫理", "SAQ、ERQ 與高階評估"],
    focusEn: ["Core theories and key studies", "Research methods and ethics", "SAQ, ERQ and higher-order evaluation"],
    outcomesZh: ["能準確運用研究支持論點", "能評估方法與理論", "建立清楚、聚焦的考試結構"],
    outcomesEn: ["Accurate use of research evidence", "Evaluation of methods and theory", "Clear and focused examination structure"],
    resourceTypesZh: ["理論整理", "研究摘要", "研究方法練習", "SAQ／ERQ 規劃", "模擬試題"],
    resourceTypesEn: ["Theory summaries", "Study summaries", "Research-method practice", "SAQ/ERQ planning", "Mock examinations"],
    keywordsZh: ["心理學", "DP", "研究方法", "SAQ", "ERQ", "倫理"],
    keywordsEn: ["psychology", "DP", "research methods", "SAQ", "ERQ", "ethics"],
  },
  {
    id: "theory-of-knowledge",
    family: "dp-core-writing",
    subject: "DP Core",
    code: "Theory of Knowledge",
    titleZh: "知識論（TOK）",
    titleEn: "Theory of Knowledge",
    levelZh: "DP 1–2",
    levelEn: "DP Years 1–2",
    descriptionZh:
      "透過知識問題、證據、觀點、方法、價值與倫理，發展反思與論證能力。",
    descriptionEn:
      "Reflective inquiry through knowledge questions, evidence, perspectives, methods, values and ethics.",
    focusZh: ["知識框架與知識問題", "論點、反論點與例證", "TOK Exhibition 與 Essay"],
    focusEn: ["Knowledge framework and knowledge questions", "Claims, counterclaims and examples", "TOK Exhibition and Essay"],
    outcomesZh: ["能提出可探究的知識問題", "能比較不同觀點與方法", "完成清楚且具反思性的評量"],
    outcomesEn: ["Formulation of meaningful knowledge questions", "Comparison of perspectives and methods", "Clear and reflective assessment work"],
    resourceTypesZh: ["課程單元", "討論任務", "展覽指導", "論文規劃", "評分與回饋工具"],
    resourceTypesEn: ["Course units", "Discussion tasks", "Exhibition guidance", "Essay planning", "Marking and feedback tools"],
    keywordsZh: ["TOK", "知識論", "展覽", "論文", "知識問題", "觀點"],
    keywordsEn: ["TOK", "Theory of Knowledge", "exhibition", "essay", "knowledge questions", "perspectives"],
  },
  {
    id: "extended-essay",
    family: "dp-core-writing",
    subject: "DP Core",
    code: "Extended Essay",
    titleZh: "延伸論文（Extended Essay）",
    titleEn: "Extended Essay",
    levelZh: "DP 核心",
    levelEn: "DP Core",
    descriptionZh:
      "支援研究問題、文獻搜尋、方法選擇、學術誠信、長篇論證、引用與反思。",
    descriptionEn:
      "Support for research questions, source selection, methodology, academic integrity, extended argument, citation and reflection.",
    focusZh: ["可行且聚焦的研究問題", "研究方法與來源品質", "結構、引用與反思歷程"],
    focusEn: ["A feasible and focused research question", "Methodology and source quality", "Structure, citation and reflection"],
    outcomesZh: ["建立可管理的研究計畫", "以證據支持連貫論證", "完成符合規範的獨立研究"],
    outcomesEn: ["A manageable research plan", "Coherent evidence-based argument", "Independent research meeting formal requirements"],
    resourceTypesZh: ["選題工具", "研究問題檢核", "來源評估", "章節規劃", "引用與反思指南"],
    resourceTypesEn: ["Topic-selection tools", "Research-question checks", "Source evaluation", "Section planning", "Citation and reflection guides"],
    keywordsZh: ["Extended Essay", "EE", "延伸論文", "研究", "引用", "學術誠信"],
    keywordsEn: ["Extended Essay", "EE", "research", "citation", "academic integrity"],
  },
  {
    id: "english-writing",
    family: "dp-core-writing",
    subject: "English",
    code: "English Writing",
    titleZh: "英文寫作",
    titleEn: "English Writing",
    levelZh: "中學至大學預備",
    levelEn: "Secondary to pre-university",
    descriptionZh:
      "從句子、段落、文本結構到論證、分析、研究寫作與編修，建立可持續的英文寫作能力。",
    descriptionEn:
      "A sustained progression from sentences and paragraphs to text structure, argument, analysis, research writing and revision.",
    focusZh: ["句法、段落與篇章組織", "敘事、說明、分析與論證", "規劃、回饋、修訂與編輯"],
    focusEn: ["Sentence, paragraph and whole-text organisation", "Narrative, explanatory, analytical and argumentative writing", "Planning, feedback, revision and editing"],
    outcomesZh: ["提升寫作清楚度與連貫性", "能依受眾與目的調整語言", "建立獨立規劃與修訂習慣"],
    outcomesEn: ["Clearer and more coherent writing", "Language adapted to audience and purpose", "Independent planning and revision habits"],
    resourceTypesZh: ["寫作課程", "段落框架", "文本類型指南", "範文分析", "回饋與修訂工具"],
    resourceTypesEn: ["Writing curricula", "Paragraph frameworks", "Text-type guides", "Model analysis", "Feedback and revision tools"],
    keywordsZh: ["英文寫作", "段落", "論證", "學術寫作", "修訂"],
    keywordsEn: ["English writing", "paragraph", "argument", "academic writing", "revision"],
  },
  {
    id: "ielts-general",
    family: "exam-preparation",
    subject: "Examinations",
    code: "IELTS General Training",
    titleZh: "IELTS 一般訓練組",
    titleEn: "IELTS General Training",
    levelZh: "依目標分數規劃",
    levelEn: "Target-band preparation",
    descriptionZh:
      "針對一般訓練組閱讀、寫作、聆聽與口說，建立題型策略、語言能力與時間管理。",
    descriptionEn:
      "Targeted preparation for General Training reading, writing, listening and speaking with task strategy and time management.",
    focusZh: ["General Reading 題型", "Writing Task 1 信件與 Task 2", "聆聽、口說與模擬測驗"],
    focusEn: ["General Reading task types", "Writing Task 1 letters and Task 2", "Listening, speaking and mock testing"],
    outcomesZh: ["熟悉考試流程與評分標準", "提升寫作任務完成度", "建立穩定的應試節奏"],
    outcomesEn: ["Familiarity with format and criteria", "Stronger task fulfilment in writing", "Consistent test-taking routines"],
    resourceTypesZh: ["診斷測驗", "題型練習", "寫作範例", "口說題庫", "模擬試題"],
    resourceTypesEn: ["Diagnostic tests", "Task practice", "Writing models", "Speaking prompts", "Mock examinations"],
    keywordsZh: ["IELTS", "一般訓練組", "General", "寫作", "口說", "聆聽"],
    keywordsEn: ["IELTS", "General Training", "writing", "speaking", "listening"],
  },
  {
    id: "ielts-academic",
    family: "exam-preparation",
    subject: "Examinations",
    code: "IELTS Academic",
    titleZh: "IELTS 學術組",
    titleEn: "IELTS Academic",
    levelZh: "依目標分數規劃",
    levelEn: "Target-band preparation",
    descriptionZh:
      "針對學術組閱讀、圖表寫作、論說文、聆聽與口說，結合語言提升與評分標準。",
    descriptionEn:
      "Academic reading, visual-data writing, essays, listening and speaking integrated with language development and band criteria.",
    focusZh: ["Academic Reading 題型", "Writing Task 1 圖表與 Task 2", "Band descriptors 與模擬測驗"],
    focusEn: ["Academic Reading task types", "Writing Task 1 visual data and Task 2", "Band descriptors and mock testing"],
    outcomesZh: ["提升學術閱讀速度與準確度", "能清楚描述資料並發展論證", "掌握口說與寫作評分要求"],
    outcomesEn: ["Faster and more accurate academic reading", "Clear data description and argument development", "Control of speaking and writing criteria"],
    resourceTypesZh: ["診斷測驗", "閱讀題組", "圖表寫作", "論說文練習", "完整模擬試題"],
    resourceTypesEn: ["Diagnostic tests", "Reading sets", "Visual-data writing", "Essay practice", "Full mock examinations"],
    keywordsZh: ["IELTS", "學術組", "Academic", "圖表", "論說文", "Band"],
    keywordsEn: ["IELTS", "Academic", "visual data", "essay", "band score"],
  },
  {
    id: "sat",
    family: "exam-preparation",
    subject: "Examinations",
    code: "SAT",
    titleZh: "SAT",
    titleEn: "SAT",
    levelZh: "大學入學準備",
    levelEn: "University admission preparation",
    descriptionZh:
      "整合 Reading and Writing 與 Math 的概念、題型、數位測驗策略、時間管理與模擬評量。",
    descriptionEn:
      "Integrated preparation for Reading and Writing and Math, including digital-test strategy, timing and diagnostic practice.",
    focusZh: ["Reading and Writing 題型", "Math 概念與解題", "數位測驗與時間策略"],
    focusEn: ["Reading and Writing task types", "Math concepts and problem solving", "Digital testing and timing strategy"],
    outcomesZh: ["辨識高頻題型與錯誤模式", "提升閱讀推論與文法判斷", "提升數學解題效率與準確度"],
    outcomesEn: ["Recognition of common task and error patterns", "Improved inference and language conventions", "More efficient and accurate mathematics performance"],
    resourceTypesZh: ["診斷測驗", "閱讀與文法題組", "數學題組", "策略筆記", "數位模擬測驗"],
    resourceTypesEn: ["Diagnostic tests", "Reading and language sets", "Math sets", "Strategy notes", "Digital mock tests"],
    keywordsZh: ["SAT", "Reading and Writing", "Math", "數位測驗", "升學"],
    keywordsEn: ["SAT", "Reading and Writing", "Math", "digital test", "admission"],
  },
  {
    id: "toefl-itp",
    family: "exam-preparation",
    subject: "Examinations",
    code: "TOEFL ITP",
    titleZh: "TOEFL ITP",
    titleEn: "TOEFL ITP",
    levelZh: "校內與機構測驗準備",
    levelEn: "Institutional-test preparation",
    descriptionZh:
      "針對 Listening Comprehension、Structure and Written Expression、Reading Comprehension 建立能力與策略。",
    descriptionEn:
      "Preparation for Listening Comprehension, Structure and Written Expression, and Reading Comprehension.",
    focusZh: ["聆聽理解", "文法結構與錯誤辨識", "學術閱讀與時間管理"],
    focusEn: ["Listening comprehension", "Structure and error recognition", "Academic reading and timing"],
    outcomesZh: ["掌握紙筆型測驗結構", "提升文法辨識速度", "建立有效閱讀與聆聽策略"],
    outcomesEn: ["Control of the paper-based test format", "Faster grammar recognition", "Effective reading and listening strategies"],
    resourceTypesZh: ["分項診斷", "文法題組", "聆聽練習", "閱讀題組", "完整模擬測驗"],
    resourceTypesEn: ["Section diagnostics", "Structure practice", "Listening practice", "Reading sets", "Full mock tests"],
    keywordsZh: ["TOEFL ITP", "聆聽", "文法", "閱讀", "紙筆測驗"],
    keywordsEn: ["TOEFL ITP", "listening", "structure", "reading", "paper-based"],
  },
  {
    id: "toefl-ibt",
    family: "exam-preparation",
    subject: "Examinations",
    code: "TOEFL iBT",
    titleZh: "TOEFL iBT",
    titleEn: "TOEFL iBT",
    levelZh: "學術英語與留學準備",
    levelEn: "Academic English and study-abroad preparation",
    descriptionZh:
      "針對閱讀、聆聽、口說、寫作與整合題型，建立學術英語能力與電腦測驗策略。",
    descriptionEn:
      "Academic-English and computer-based preparation across reading, listening, speaking, writing and integrated tasks.",
    focusZh: ["學術閱讀與筆記", "整合口說與寫作", "時間管理與電腦測驗流程"],
    focusEn: ["Academic reading and note-taking", "Integrated speaking and writing", "Timing and computer-based test routines"],
    outcomesZh: ["整合不同來源資訊", "提升口說組織與寫作準確度", "建立完整測驗節奏"],
    outcomesEn: ["Integration of information across sources", "Better organised speaking and accurate writing", "Consistent full-test performance"],
    resourceTypesZh: ["診斷測驗", "整合題型練習", "口說模板", "寫作回饋", "完整模擬測驗"],
    resourceTypesEn: ["Diagnostic tests", "Integrated-task practice", "Speaking frameworks", "Writing feedback", "Full mock tests"],
    keywordsZh: ["TOEFL iBT", "學術英語", "整合題", "口說", "寫作"],
    keywordsEn: ["TOEFL iBT", "academic English", "integrated tasks", "speaking", "writing"],
  },
];

export const researchStrands: ResearchStrand[] = [
  {
    id: "curriculum-coherence",
    number: "01",
    titleZh: "課程連貫性、垂直銜接與評量品質",
    titleEn: "Curriculum Coherence, Vertical Alignment and Assessment Quality",
    descriptionZh:
      "檢視 MYP 與 DP 課程是否具備清楚的技能進程、概念發展、課程銜接與可信評量。",
    descriptionEn:
      "Examine whether MYP and DP curricula provide coherent skills progression, conceptual development, programme transition and credible assessment.",
    questionsZh: ["技能是否逐年增加複雜度？", "教學目標、活動與評量是否一致？", "MYP 是否有效準備學生進入 DP？"],
    questionsEn: ["Do skills increase in complexity over time?", "Are objectives, learning and assessment aligned?", "Does MYP prepare learners effectively for DP?"],
    trackIds: ["math-myp", "english-myp-ela", "english-myp-ll", "biology-myp", "math-dp", "english-dp-a", "english-dp-b", "biology-dp", "psychology-dp"],
  },
  {
    id: "language-literacy",
    number: "02",
    titleZh: "語言習得、文本理解與寫作發展",
    titleEn: "Language Acquisition, Textual Understanding and Writing Development",
    descriptionZh:
      "研究學生如何從語言基礎進展到分析、論證、學術寫作與高階英語表達。",
    descriptionEn:
      "Study progression from language foundations to analysis, argument, academic writing and advanced English communication.",
    questionsZh: ["不同語言階段需要哪些支持？", "回饋如何促進寫作修訂？", "文本類型教學如何提升遷移能力？"],
    questionsEn: ["What support is needed at different language stages?", "How does feedback improve revision?", "How does text-type instruction support transfer?"],
    trackIds: ["english-myp-ela", "english-myp-ll", "english-dp-a", "english-dp-b", "english-writing", "ielts-general", "ielts-academic", "toefl-itp", "toefl-ibt"],
  },
  {
    id: "mathematical-reasoning",
    number: "03",
    titleZh: "數學推理、問題解決與評量表現",
    titleEn: "Mathematical Reasoning, Problem Solving and Assessment Performance",
    descriptionZh:
      "探討技能熟練、概念理解、表示方式、數學溝通與考試策略如何共同影響學習。",
    descriptionEn:
      "Explore how fluency, conceptual understanding, representation, mathematical communication and test strategy interact.",
    questionsZh: ["學生在哪些步驟產生系統性錯誤？", "如何平衡技能練習與概念探究？", "限時測驗如何影響解題表現？"],
    questionsEn: ["Where do systematic errors occur?", "How should fluency and inquiry be balanced?", "How does timed testing affect problem solving?"],
    trackIds: ["math-myp", "math-dp", "sat"],
  },
  {
    id: "science-psychology",
    number: "04",
    titleZh: "科學探究、資料素養與心理學論證",
    titleEn: "Scientific Inquiry, Data Literacy and Psychological Argument",
    descriptionZh:
      "關注實驗設計、資料分析、研究方法、科學解釋及心理學研究的教學與評量。",
    descriptionEn:
      "Focus on experimental design, data analysis, research methods, scientific explanation and the use of psychological research.",
    questionsZh: ["學生能否控制變因並評估限制？", "如何提升圖表與資料解讀？", "研究證據如何支持而非取代理論論證？"],
    questionsEn: ["Can learners control variables and evaluate limitations?", "How can graph and data interpretation improve?", "How should research evidence support theoretical argument?"],
    trackIds: ["biology-myp", "biology-dp", "psychology-dp"],
  },
  {
    id: "knowledge-research",
    number: "05",
    titleZh: "知識探究、獨立研究與學術誠信",
    titleEn: "Knowledge Inquiry, Independent Research and Academic Integrity",
    descriptionZh:
      "探討學生如何形成問題、選擇證據、評估來源、建立論證並進行負責任的研究寫作。",
    descriptionEn:
      "Examine how learners formulate questions, select evidence, evaluate sources, build arguments and conduct responsible academic writing.",
    questionsZh: ["什麼使研究問題可行且有價值？", "學生如何評估證據品質？", "反思如何改善研究決策？"],
    questionsEn: ["What makes a research question feasible and worthwhile?", "How do learners evaluate evidence quality?", "How does reflection improve research decisions?"],
    trackIds: ["theory-of-knowledge", "extended-essay", "english-writing", "english-dp-a", "english-dp-b"],
  },
  {
    id: "test-readiness",
    number: "06",
    titleZh: "語言檢定、升學測驗與診斷性評量",
    titleEn: "Language Testing, Admission Assessment and Diagnostic Evaluation",
    descriptionZh:
      "研究診斷、題型策略、模擬測驗、回饋與能力發展如何影響國際檢定及升學準備。",
    descriptionEn:
      "Study how diagnosis, task strategy, mock testing, feedback and underlying skill development affect international-test preparation.",
    questionsZh: ["分數瓶頸來自能力還是策略？", "模擬測驗應如何轉化為教學計畫？", "如何避免只教技巧而忽略長期能力？"],
    questionsEn: ["Do score plateaus reflect skill or strategy?", "How should mock-test evidence guide instruction?", "How can preparation avoid teaching tactics without durable learning?"],
    trackIds: ["ielts-general", "ielts-academic", "sat", "toefl-itp", "toefl-ibt"],
  },
];

export const getFamily = (id: CourseFamilyId) =>
  courseFamilies.find((family) => family.id === id);

export const getTrack = (id: string) =>
  courseTracks.find((track) => track.id === id);

IBRIDGE_FILE_1_EOF

# ============================================================
# src/components/CurriculumHub.astro
# ============================================================

cat > src/components/CurriculumHub.astro <<'IBRIDGE_FILE_2_EOF'
---
import {
  courseFamilies,
  courseTracks,
  getTrack,
  researchStrands,
  type CatalogueMode,
  type SiteLanguage,
} from "../data/courseCatalog";

interface Props {
  lang?: SiteLanguage;
  mode: CatalogueMode;
}

const { lang = "zh", mode } = Astro.props;
const isEnglish = lang === "en";
const text = (zh: string, en: string) => (isEnglish ? en : zh);

const programmeCopy = {
  eyebrow: text("課程方案", "Programmes"),
  title: text(
    "從 MYP、DP 到國際檢定，建立清楚且可持續的學習路徑。",
    "Build clear, sustainable learning pathways from MYP and DP to international examinations.",
  ),
  intro: text(
    "課程依學生年級、能力、目標與可用時間調整。每一項方案都連結內容知識、技能進程、評量證據與後續改善。",
    "Each programme is adapted to learner stage, current performance, goals and available time. Content, skills progression, assessment evidence and improvement are planned together.",
  ),
  sectionEyebrow: text("完整課程目錄", "Complete programme catalogue"),
  sectionTitle: text(
    "四大課程群組，十七條明確學習路徑。",
    "Four programme families and seventeen clearly defined pathways.",
  ),
  focus: text("學習重點", "Learning focus"),
  outcomes: text("預期成果", "Expected outcomes"),
  modelEyebrow: text("實施方式", "Delivery models"),
  modelTitle: text(
    "依學生、教師或學校需求調整合作深度。",
    "Adapt the depth of support to learners, educators or schools.",
  ),
};

const researchCopy = {
  eyebrow: text("教育研究", "Educational Research"),
  title: text(
    "以課程、學習證據與評量資料支持持續改進。",
    "Use curriculum, learning evidence and assessment data to support continuous improvement.",
  ),
  intro: text(
    "研究方向直接對應目前提供的 MYP、DP、DP 核心、學術寫作與國際檢定課程，不另設與課程無關的研究類別。",
    "Research strands correspond directly to the MYP, DP, DP Core, academic-writing and international-test programmes currently offered.",
  ),
  sectionEyebrow: text("研究分類", "Research strands"),
  sectionTitle: text(
    "六個可直接連結教學與課程改善的研究方向。",
    "Six research strands directly connected to teaching and curriculum improvement.",
  ),
  questions: text("核心研究問題", "Core research questions"),
  related: text("相關課程", "Related programmes"),
  processEyebrow: text("研究流程", "Research process"),
  processTitle: text(
    "從問題界定到可執行的改進建議。",
    "From a clearly defined problem to actionable improvement.",
  ),
};

const resourceCopy = {
  eyebrow: text("教育資源", "Educational Resources"),
  title: text(
    "依課程群組、學科與學習階段整理教材。",
    "Organise materials by programme family, subject and learning stage.",
  ),
  intro: text(
    "資源目錄完整對應目前提供的十七條課程路徑。尚未正式上架的教材會清楚標示，不建立無效下載連結。",
    "The directory mirrors all seventeen programme pathways. Materials not yet published are clearly identified, with no inactive download links.",
  ),
  searchLabel: text("搜尋課程或資源", "Search programmes or resources"),
  searchPlaceholder: text(
    "例如：MYP 數學、TOK、IELTS、寫作",
    "For example: MYP Mathematics, TOK, IELTS, writing",
  ),
  familyLabel: text("課程群組", "Programme family"),
  familyAll: text("全部群組", "All families"),
  subjectLabel: text("學科或類型", "Subject or type"),
  subjectAll: text("全部學科", "All subjects"),
  clear: text("清除篩選", "Clear filters"),
  results: text("項資源分類", "resource categories"),
  resourceTypes: text("規劃中的資源", "Planned resources"),
  status: text("分類已建立・資源分階段上線", "Category established · resources published progressively"),
  noResultsTitle: text("找不到符合條件的分類", "No matching category"),
  noResultsText: text(
    "請調整搜尋文字或清除篩選條件。",
    "Change the search terms or clear the filters.",
  ),
};

const deliveryModels = [
  {
    number: "01",
    titleZh: "個別課程與學習診斷",
    titleEn: "Individual Tuition and Learning Diagnosis",
    descriptionZh:
      "先確認學生目前能力、目標與主要困難，再建立可追蹤的課程進度與作業回饋。",
    descriptionEn:
      "Identify current performance, goals and priority needs before building a trackable learning and feedback plan.",
  },
  {
    number: "02",
    titleZh: "小組課程與考試準備",
    titleEn: "Small-group Courses and Test Preparation",
    descriptionZh:
      "以共同目標、分層任務、模擬評量與針對性回饋支持穩定進步。",
    descriptionEn:
      "Use shared goals, differentiated tasks, mock assessment and targeted feedback to support consistent progress.",
  },
  {
    number: "03",
    titleZh: "學校課程規劃與垂直銜接",
    titleEn: "School Curriculum Planning and Vertical Alignment",
    descriptionZh:
      "建立年級進程、單元架構、共同評量、教師資源與 MYP 至 DP 的銜接。",
    descriptionEn:
      "Develop year-level progression, unit architecture, common assessment, educator resources and MYP-to-DP alignment.",
  },
  {
    number: "04",
    titleZh: "教材開發與專業學習",
    titleEn: "Resource Development and Professional Learning",
    descriptionZh:
      "依課程需求共同開發教材、評量工具、教師指南與實施工作坊。",
    descriptionEn:
      "Co-develop teaching materials, assessment tools, educator guidance and implementation workshops.",
  },
];

const researchProcess = [
  {
    number: "01",
    titleZh: "界定問題與成功標準",
    titleEn: "Define the Problem and Success Criteria",
    descriptionZh: "確認學習者、課程脈絡、現有證據與預期改變。",
    descriptionEn: "Clarify learners, curriculum context, existing evidence and intended change.",
  },
  {
    number: "02",
    titleZh: "選擇適切資料與方法",
    titleEn: "Select Appropriate Evidence and Methods",
    descriptionZh: "依問題選擇量化、質性、文件分析或混合方法。",
    descriptionEn: "Choose quantitative, qualitative, document-analysis or mixed methods according to the question.",
  },
  {
    number: "03",
    titleZh: "分析學習與評量證據",
    titleEn: "Analyse Learning and Assessment Evidence",
    descriptionZh: "辨識表現模式、實施限制、差異與可能解釋。",
    descriptionEn: "Identify performance patterns, implementation constraints, differences and plausible explanations.",
  },
  {
    number: "04",
    titleZh: "轉化為課程改善",
    titleEn: "Translate Findings into Curriculum Improvement",
    descriptionZh: "形成可執行建議、修訂教材並安排後續評估。",
    descriptionEn: "Develop actionable recommendations, revise materials and plan follow-up evaluation.",
  },
];

const subjectOptions = [
  { value: "Mathematics", zh: "數學", en: "Mathematics" },
  { value: "English", zh: "英語與寫作", en: "English and Writing" },
  { value: "Biology", zh: "生物", en: "Biology" },
  { value: "Psychology", zh: "心理學", en: "Psychology" },
  { value: "DP Core", zh: "DP 核心", en: "DP Core" },
  { value: "Examinations", zh: "國際檢定", en: "Examinations" },
];
---

<div
  class={`curriculum-hub curriculum-hub--${mode}`}
  data-resource-directory={mode === "resources" ? "true" : undefined}
  data-language={lang}
>
  <section class="curriculum-hero" aria-labelledby={`${mode}-page-title`}>
    <div class="curriculum-container curriculum-hero__inner">
      <p class="curriculum-eyebrow">
        {mode === "programmes"
          ? programmeCopy.eyebrow
          : mode === "research"
            ? researchCopy.eyebrow
            : resourceCopy.eyebrow}
      </p>
      <h1 id={`${mode}-page-title`}>
        {mode === "programmes"
          ? programmeCopy.title
          : mode === "research"
            ? researchCopy.title
            : resourceCopy.title}
      </h1>
      <p class="curriculum-hero__intro">
        {mode === "programmes"
          ? programmeCopy.intro
          : mode === "research"
            ? researchCopy.intro
            : resourceCopy.intro}
      </p>

      <div class="curriculum-stat-grid" aria-label={text("課程摘要", "Programme summary")}>
        <div class="curriculum-stat">
          <strong>{courseFamilies.length}</strong>
          <span>{text("課程群組", "programme families")}</span>
        </div>
        <div class="curriculum-stat">
          <strong>{courseTracks.length}</strong>
          <span>{text("明確課程路徑", "defined pathways")}</span>
        </div>
        <div class="curriculum-stat">
          <strong>2</strong>
          <span>{text("網站語言", "site languages")}</span>
        </div>
      </div>
    </div>
  </section>

  {
    mode === "programmes" && (
      <>
        <section class="curriculum-section" aria-labelledby="programme-catalogue-title">
          <div class="curriculum-container">
            <header class="curriculum-section-heading">
              <p class="curriculum-eyebrow">{programmeCopy.sectionEyebrow}</p>
              <h2 id="programme-catalogue-title">{programmeCopy.sectionTitle}</h2>
            </header>

            <nav class="curriculum-anchor-nav" aria-label={text("課程群組導覽", "Programme-family navigation")}>
              {courseFamilies.map((family) => (
                <a href={`#${family.id}`}>
                  {text(family.titleZh, family.titleEn)}
                </a>
              ))}
            </nav>

            <div class="curriculum-family-list">
              {courseFamilies.map((family) => {
                const tracks = courseTracks.filter((track) => track.family === family.id);

                return (
                  <section class="curriculum-family" id={family.id} aria-labelledby={`${family.id}-title`}>
                    <div class="curriculum-family__heading">
                      <p class="curriculum-family__count">
                        {String(courseFamilies.indexOf(family) + 1).padStart(2, "0")}
                      </p>
                      <div>
                        <h3 id={`${family.id}-title`}>
                          {text(family.titleZh, family.titleEn)}
                        </h3>
                        <p>{text(family.descriptionZh, family.descriptionEn)}</p>
                      </div>
                    </div>

                    <div class="curriculum-card-grid">
                      {tracks.map((track) => (
                        <article class="curriculum-card">
                          <div class="curriculum-card__topline">
                            <span class="curriculum-code">{track.code}</span>
                            <span class="curriculum-level">
                              {text(track.levelZh, track.levelEn)}
                            </span>
                          </div>
                          <h4>{text(track.titleZh, track.titleEn)}</h4>
                          <p class="curriculum-card__description">
                            {text(track.descriptionZh, track.descriptionEn)}
                          </p>

                          <div class="curriculum-card__details">
                            <div>
                              <h5>{programmeCopy.focus}</h5>
                              <ul>
                                {(isEnglish ? track.focusEn : track.focusZh).map((item) => (
                                  <li>{item}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h5>{programmeCopy.outcomes}</h5>
                              <ul>
                                {(isEnglish ? track.outcomesEn : track.outcomesZh).map((item) => (
                                  <li>{item}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </section>

        <section class="curriculum-section curriculum-section--muted" aria-labelledby="delivery-model-title">
          <div class="curriculum-container">
            <header class="curriculum-section-heading">
              <p class="curriculum-eyebrow">{programmeCopy.modelEyebrow}</p>
              <h2 id="delivery-model-title">{programmeCopy.modelTitle}</h2>
            </header>

            <div class="curriculum-process-grid">
              {deliveryModels.map((model) => (
                <article class="curriculum-process-card">
                  <span>{model.number}</span>
                  <h3>{text(model.titleZh, model.titleEn)}</h3>
                  <p>{text(model.descriptionZh, model.descriptionEn)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </>
    )
  }

  {
    mode === "research" && (
      <>
        <section class="curriculum-section" aria-labelledby="research-strands-title">
          <div class="curriculum-container">
            <header class="curriculum-section-heading">
              <p class="curriculum-eyebrow">{researchCopy.sectionEyebrow}</p>
              <h2 id="research-strands-title">{researchCopy.sectionTitle}</h2>
            </header>

            <div class="research-strand-list">
              {researchStrands.map((strand) => (
                <article class="research-strand">
                  <div class="research-strand__number" aria-hidden="true">
                    {strand.number}
                  </div>
                  <div class="research-strand__body">
                    <h3>{text(strand.titleZh, strand.titleEn)}</h3>
                    <p class="research-strand__description">
                      {text(strand.descriptionZh, strand.descriptionEn)}
                    </p>

                    <div class="research-strand__columns">
                      <div>
                        <h4>{researchCopy.questions}</h4>
                        <ul>
                          {(isEnglish ? strand.questionsEn : strand.questionsZh).map((question) => (
                            <li>{question}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4>{researchCopy.related}</h4>
                        <div class="curriculum-tag-list">
                          {strand.trackIds.map((trackId) => {
                            const track = getTrack(trackId);
                            return track ? (
                              <span>{text(track.titleZh, track.titleEn)}</span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section class="curriculum-section curriculum-section--muted" aria-labelledby="research-process-title">
          <div class="curriculum-container">
            <header class="curriculum-section-heading">
              <p class="curriculum-eyebrow">{researchCopy.processEyebrow}</p>
              <h2 id="research-process-title">{researchCopy.processTitle}</h2>
            </header>

            <div class="curriculum-process-grid">
              {researchProcess.map((step) => (
                <article class="curriculum-process-card">
                  <span>{step.number}</span>
                  <h3>{text(step.titleZh, step.titleEn)}</h3>
                  <p>{text(step.descriptionZh, step.descriptionEn)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </>
    )
  }

  {
    mode === "resources" && (
      <section class="curriculum-section" aria-labelledby="resource-directory-title">
        <div class="curriculum-container">
          <header class="curriculum-section-heading">
            <p class="curriculum-eyebrow">{text("資源目錄", "Resource directory")}</p>
            <h2 id="resource-directory-title">
              {text(
                "搜尋目前課程架構下的教材分類。",
                "Search the resource categories within the current programme structure.",
              )}
            </h2>
          </header>

          <form class="resource-filter-panel" data-resource-filter-form>
            <div class="resource-filter-grid">
              <label class="resource-field resource-field--search">
                <span>{resourceCopy.searchLabel}</span>
                <input
                  type="search"
                  name="q"
                  placeholder={resourceCopy.searchPlaceholder}
                  autocomplete="off"
                  data-resource-search
                />
              </label>

              <label class="resource-field">
                <span>{resourceCopy.familyLabel}</span>
                <select name="family" data-resource-family>
                  <option value="">{resourceCopy.familyAll}</option>
                  {courseFamilies.map((family) => (
                    <option value={family.id}>
                      {text(family.titleZh, family.titleEn)}
                    </option>
                  ))}
                </select>
              </label>

              <label class="resource-field">
                <span>{resourceCopy.subjectLabel}</span>
                <select name="subject" data-resource-subject>
                  <option value="">{resourceCopy.subjectAll}</option>
                  {subjectOptions.map((option) => (
                    <option value={option.value}>
                      {text(option.zh, option.en)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div class="resource-filter-footer">
              <p aria-live="polite" data-resource-count>
                {courseTracks.length} {resourceCopy.results}
              </p>
              <button type="reset" data-resource-reset>
                {resourceCopy.clear}
              </button>
            </div>
          </form>

          <div class="resource-directory-grid" data-resource-grid>
            {courseTracks.map((track) => {
              const family = courseFamilies.find((item) => item.id === track.family);
              const searchText = [
                track.code,
                track.titleZh,
                track.titleEn,
                track.levelZh,
                track.levelEn,
                track.descriptionZh,
                track.descriptionEn,
                ...track.keywordsZh,
                ...track.keywordsEn,
                ...track.resourceTypesZh,
                ...track.resourceTypesEn,
              ].join(" ");

              return (
                <article
                  class="resource-directory-card"
                  data-resource-card
                  data-family={track.family}
                  data-subject={track.subject}
                  data-search={searchText}
                >
                  <div class="resource-directory-card__topline">
                    <span>{family ? text(family.titleZh, family.titleEn) : ""}</span>
                    <span>{text(track.levelZh, track.levelEn)}</span>
                  </div>
                  <h3>{text(track.titleZh, track.titleEn)}</h3>
                  <p>{text(track.descriptionZh, track.descriptionEn)}</p>

                  <div class="resource-directory-card__types">
                    <h4>{resourceCopy.resourceTypes}</h4>
                    <ul>
                      {(isEnglish ? track.resourceTypesEn : track.resourceTypesZh).map((item) => (
                        <li>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <p class="resource-directory-card__status">
                    {resourceCopy.status}
                  </p>
                </article>
              );
            })}
          </div>

          <div class="resource-empty-state" hidden data-resource-empty>
            <h3>{resourceCopy.noResultsTitle}</h3>
            <p>{resourceCopy.noResultsText}</p>
          </div>
        </div>
      </section>
    )
  }

  <script is:inline src="/scripts/course-resource-filter.js"></script>
</div>

IBRIDGE_FILE_2_EOF

# ============================================================
# src/styles/curriculum-hub.css
# ============================================================

cat > src/styles/curriculum-hub.css <<'IBRIDGE_FILE_3_EOF'
.curriculum-hub {
  --curriculum-primary: var(--color-primary, #a51c30);
  --curriculum-primary-dark: var(--color-primary-dark, #7b1422);
  --curriculum-background: var(--color-background, #f7f1e3);
  --curriculum-surface: var(--color-surface, #faf7f0);
  --curriculum-text: var(--color-text, #1f2933);
  --curriculum-secondary: var(--color-secondary, #315c6b);
  --curriculum-border: var(--color-border, #e4d7c5);
  --curriculum-accent: var(--color-accent, #c48a2c);
  --curriculum-white: #ffffff;
  --curriculum-shadow: 0 18px 44px rgba(31, 41, 51, 0.08);
  color: var(--curriculum-text);
  background: var(--curriculum-background);
}

.curriculum-hub *,
.curriculum-hub *::before,
.curriculum-hub *::after {
  box-sizing: border-box;
}

.curriculum-container {
  width: min(100% - 40px, 1180px);
  margin-inline: auto;
}

.curriculum-hero {
  position: relative;
  overflow: hidden;
  padding: clamp(76px, 9vw, 124px) 0 clamp(66px, 8vw, 108px);
  color: var(--curriculum-white);
  background:
    radial-gradient(circle at 82% 18%, rgba(196, 138, 44, 0.24), transparent 30%),
    linear-gradient(135deg, var(--curriculum-primary-dark), var(--curriculum-primary) 58%, #8b2032);
}

.curriculum-hero::after {
  position: absolute;
  right: -90px;
  bottom: -160px;
  width: 360px;
  height: 360px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 50%;
  content: "";
}

.curriculum-hero__inner {
  position: relative;
  z-index: 1;
}

.curriculum-eyebrow {
  margin: 0 0 14px;
  color: var(--curriculum-accent);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.curriculum-hero .curriculum-eyebrow {
  color: #f5cf84;
}

.curriculum-hero h1 {
  max-width: 930px;
  margin: 0;
  color: inherit;
  font-size: clamp(2.45rem, 6vw, 5.35rem);
  line-height: 1.03;
  letter-spacing: -0.045em;
  text-wrap: balance;
}

.curriculum-hero__intro {
  max-width: 790px;
  margin: 26px 0 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: clamp(1.02rem, 1.8vw, 1.22rem);
  line-height: 1.85;
}

.curriculum-stat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  max-width: 760px;
  margin-top: 42px;
}

.curriculum-stat {
  display: flex;
  min-height: 112px;
  padding: 19px 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  flex-direction: column;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
}

.curriculum-stat strong {
  color: var(--curriculum-white);
  font-size: 2rem;
  line-height: 1;
}

.curriculum-stat span {
  margin-top: 9px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.9rem;
  line-height: 1.45;
}

.curriculum-section {
  padding: clamp(72px, 9vw, 118px) 0;
}

.curriculum-section--muted {
  border-block: 1px solid var(--curriculum-border);
  background: rgba(250, 247, 240, 0.76);
}

.curriculum-section-heading {
  max-width: 850px;
  margin-bottom: 34px;
}

.curriculum-section-heading h2 {
  margin: 0;
  color: var(--curriculum-text);
  font-size: clamp(2rem, 4vw, 3.55rem);
  line-height: 1.13;
  letter-spacing: -0.035em;
  text-wrap: balance;
}

.curriculum-anchor-nav {
  display: flex;
  gap: 10px;
  margin: 0 0 52px;
  flex-wrap: wrap;
}

.curriculum-anchor-nav a {
  display: inline-flex;
  min-height: 44px;
  padding: 10px 15px;
  border: 1px solid var(--curriculum-border);
  border-radius: 999px;
  align-items: center;
  color: var(--curriculum-primary-dark);
  background: var(--curriculum-surface);
  font-size: 0.91rem;
  font-weight: 750;
  text-decoration: none;
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.curriculum-anchor-nav a:hover {
  border-color: var(--curriculum-primary);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(31, 41, 51, 0.08);
}

.curriculum-anchor-nav a:focus-visible,
.resource-filter-panel input:focus-visible,
.resource-filter-panel select:focus-visible,
.resource-filter-panel button:focus-visible {
  outline: 3px solid rgba(49, 92, 107, 0.35);
  outline-offset: 3px;
}

.curriculum-family-list {
  display: grid;
  gap: 76px;
}

.curriculum-family {
  scroll-margin-top: 112px;
}

.curriculum-family__heading {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  gap: 22px;
  max-width: 930px;
  margin-bottom: 28px;
  align-items: start;
}

.curriculum-family__count {
  margin: 0;
  color: var(--curriculum-primary);
  font-size: 1.2rem;
  font-weight: 850;
  letter-spacing: 0.06em;
}

.curriculum-family__heading h3 {
  margin: 0;
  color: var(--curriculum-text);
  font-size: clamp(1.55rem, 3vw, 2.45rem);
  line-height: 1.18;
  letter-spacing: -0.025em;
}

.curriculum-family__heading p:not(.curriculum-family__count) {
  max-width: 760px;
  margin: 12px 0 0;
  color: var(--curriculum-secondary);
  line-height: 1.75;
}

.curriculum-card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.curriculum-card {
  min-width: 0;
  padding: 28px;
  border: 1px solid var(--curriculum-border);
  border-radius: 22px;
  background: var(--curriculum-surface);
  box-shadow: var(--curriculum-shadow);
}

.curriculum-card__topline,
.resource-directory-card__topline {
  display: flex;
  gap: 12px;
  margin-bottom: 18px;
  align-items: flex-start;
  justify-content: space-between;
}

.curriculum-code {
  color: var(--curriculum-primary);
  font-size: 0.76rem;
  font-weight: 850;
  letter-spacing: 0.055em;
  text-transform: uppercase;
}

.curriculum-level {
  padding: 5px 9px;
  border-radius: 999px;
  color: var(--curriculum-secondary);
  background: rgba(49, 92, 107, 0.1);
  font-size: 0.76rem;
  font-weight: 750;
  text-align: right;
}

.curriculum-card h4,
.resource-directory-card h3,
.research-strand h3,
.curriculum-process-card h3 {
  margin: 0;
  color: var(--curriculum-text);
  line-height: 1.25;
}

.curriculum-card h4 {
  font-size: 1.45rem;
}

.curriculum-card__description {
  margin: 13px 0 0;
  color: var(--curriculum-secondary);
  line-height: 1.72;
}

.curriculum-card__details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 24px;
  padding-top: 22px;
  border-top: 1px solid var(--curriculum-border);
}

.curriculum-card__details h5,
.research-strand__columns h4,
.resource-directory-card__types h4 {
  margin: 0 0 10px;
  color: var(--curriculum-primary-dark);
  font-size: 0.82rem;
  font-weight: 850;
  letter-spacing: 0.045em;
  text-transform: uppercase;
}

.curriculum-card ul,
.research-strand ul,
.resource-directory-card ul {
  margin: 0;
  padding-left: 1.16rem;
}

.curriculum-card li,
.research-strand li,
.resource-directory-card li {
  margin: 7px 0;
  color: var(--curriculum-text);
  line-height: 1.55;
}

.curriculum-process-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.curriculum-process-card {
  min-height: 248px;
  padding: 25px;
  border: 1px solid var(--curriculum-border);
  border-radius: 20px;
  background: var(--curriculum-white);
}

.curriculum-process-card > span {
  display: inline-flex;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  color: var(--curriculum-white);
  background: var(--curriculum-primary);
  font-size: 0.82rem;
  font-weight: 850;
}

.curriculum-process-card h3 {
  margin-top: 25px;
  font-size: 1.22rem;
}

.curriculum-process-card p {
  margin: 12px 0 0;
  color: var(--curriculum-secondary);
  line-height: 1.68;
}

.research-strand-list {
  display: grid;
  gap: 20px;
}

.research-strand {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  gap: 26px;
  padding: 30px;
  border: 1px solid var(--curriculum-border);
  border-radius: 22px;
  background: var(--curriculum-surface);
  box-shadow: var(--curriculum-shadow);
}

.research-strand__number {
  color: var(--curriculum-primary);
  font-size: 1.28rem;
  font-weight: 850;
  letter-spacing: 0.08em;
}

.research-strand h3 {
  font-size: clamp(1.45rem, 2.5vw, 2rem);
}

.research-strand__description {
  max-width: 850px;
  margin: 12px 0 0;
  color: var(--curriculum-secondary);
  line-height: 1.75;
}

.research-strand__columns {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
  gap: 28px;
  margin-top: 25px;
  padding-top: 23px;
  border-top: 1px solid var(--curriculum-border);
}

.curriculum-tag-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.curriculum-tag-list span {
  display: inline-flex;
  padding: 7px 10px;
  border: 1px solid rgba(165, 28, 48, 0.2);
  border-radius: 999px;
  color: var(--curriculum-primary-dark);
  background: rgba(165, 28, 48, 0.07);
  font-size: 0.78rem;
  font-weight: 720;
  line-height: 1.3;
}

.resource-filter-panel {
  margin-bottom: 34px;
  padding: 24px;
  border: 1px solid var(--curriculum-border);
  border-radius: 22px;
  background: var(--curriculum-surface);
  box-shadow: var(--curriculum-shadow);
}

.resource-filter-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) repeat(2, minmax(190px, 0.7fr));
  gap: 16px;
}

.resource-field {
  display: grid;
  gap: 8px;
}

.resource-field > span {
  color: var(--curriculum-text);
  font-size: 0.84rem;
  font-weight: 780;
}

.resource-field input,
.resource-field select {
  width: 100%;
  min-height: 48px;
  padding: 10px 13px;
  border: 1px solid #cbbba7;
  border-radius: 12px;
  color: var(--curriculum-text);
  background: var(--curriculum-white);
  font: inherit;
}

.resource-field input::placeholder {
  color: #66737c;
  opacity: 1;
}

.resource-filter-footer {
  display: flex;
  gap: 18px;
  margin-top: 18px;
  align-items: center;
  justify-content: space-between;
}

.resource-filter-footer p {
  margin: 0;
  color: var(--curriculum-secondary);
  font-weight: 720;
}

.resource-filter-footer button {
  min-height: 42px;
  padding: 9px 14px;
  border: 1px solid var(--curriculum-primary);
  border-radius: 10px;
  color: var(--curriculum-primary-dark);
  background: transparent;
  font: inherit;
  font-weight: 760;
  cursor: pointer;
}

.resource-filter-footer button:hover {
  color: var(--curriculum-white);
  background: var(--curriculum-primary);
}

.resource-directory-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.resource-directory-card {
  display: flex;
  min-width: 0;
  padding: 24px;
  border: 1px solid var(--curriculum-border);
  border-radius: 20px;
  flex-direction: column;
  background: var(--curriculum-surface);
  box-shadow: 0 12px 32px rgba(31, 41, 51, 0.06);
}

.resource-directory-card[hidden] {
  display: none;
}

.resource-directory-card__topline span:first-child {
  color: var(--curriculum-primary);
  font-size: 0.75rem;
  font-weight: 820;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.resource-directory-card__topline span:last-child {
  color: var(--curriculum-secondary);
  font-size: 0.76rem;
  font-weight: 720;
  text-align: right;
}

.resource-directory-card h3 {
  font-size: 1.31rem;
}

.resource-directory-card > p {
  margin: 12px 0 0;
  color: var(--curriculum-secondary);
  line-height: 1.66;
}

.resource-directory-card__types {
  margin-top: 22px;
  padding-top: 19px;
  border-top: 1px solid var(--curriculum-border);
}

.resource-directory-card__status {
  margin-top: auto !important;
  padding-top: 20px;
  color: var(--curriculum-primary-dark) !important;
  font-size: 0.82rem;
  font-weight: 760;
}

.resource-empty-state {
  margin-top: 26px;
  padding: 40px 24px;
  border: 1px dashed #bba58b;
  border-radius: 18px;
  text-align: center;
  background: rgba(250, 247, 240, 0.68);
}

.resource-empty-state[hidden] {
  display: none;
}

.resource-empty-state h3 {
  margin: 0;
  color: var(--curriculum-text);
}

.resource-empty-state p {
  margin: 10px 0 0;
  color: var(--curriculum-secondary);
}

@media (max-width: 980px) {
  .curriculum-card-grid,
  .resource-directory-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .curriculum-process-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .resource-filter-grid {
    grid-template-columns: 1fr 1fr;
  }

  .resource-field--search {
    grid-column: 1 / -1;
  }
}

@media (max-width: 720px) {
  .curriculum-container {
    width: min(100% - 30px, 1180px);
  }

  .curriculum-hero {
    padding: 72px 0 66px;
  }

  .curriculum-hero h1 {
    font-size: clamp(2.35rem, 12vw, 3.7rem);
  }

  .curriculum-stat-grid,
  .curriculum-card-grid,
  .curriculum-card__details,
  .curriculum-process-grid,
  .research-strand__columns,
  .resource-filter-grid,
  .resource-directory-grid {
    grid-template-columns: 1fr;
  }

  .curriculum-stat-grid {
    max-width: 100%;
  }

  .curriculum-family__heading,
  .research-strand {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .curriculum-family__count,
  .research-strand__number {
    font-size: 0.92rem;
  }

  .curriculum-card,
  .research-strand,
  .resource-directory-card,
  .resource-filter-panel {
    padding: 21px;
    border-radius: 18px;
  }

  .resource-field--search {
    grid-column: auto;
  }

  .resource-filter-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .resource-filter-footer button {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .curriculum-anchor-nav a {
    transition: none;
  }

  .curriculum-anchor-nav a:hover {
    transform: none;
  }
}

IBRIDGE_FILE_3_EOF

# ============================================================
# public/scripts/course-resource-filter.js
# ============================================================

cat > public/scripts/course-resource-filter.js <<'IBRIDGE_FILE_4_EOF'
(() => {
  "use strict";

  const normalise = (value) =>
    String(value ?? "")
      .normalize("NFKC")
      .trim()
      .toLocaleLowerCase();

  const initialiseDirectory = (root) => {
    const form = root.querySelector("[data-resource-filter-form]");
    const search = root.querySelector("[data-resource-search]");
    const family = root.querySelector("[data-resource-family]");
    const subject = root.querySelector("[data-resource-subject]");
    const reset = root.querySelector("[data-resource-reset]");
    const count = root.querySelector("[data-resource-count]");
    const empty = root.querySelector("[data-resource-empty]");
    const cards = Array.from(root.querySelectorAll("[data-resource-card]"));

    if (
      !(form instanceof HTMLFormElement) ||
      !(search instanceof HTMLInputElement) ||
      !(family instanceof HTMLSelectElement) ||
      !(subject instanceof HTMLSelectElement) ||
      !(count instanceof HTMLElement) ||
      !(empty instanceof HTMLElement)
    ) {
      return;
    }

    const language = root.dataset.language === "en" ? "en" : "zh";
    let timer = 0;

    const updateUrl = () => {
      const url = new URL(window.location.href);
      const values = {
        q: search.value.trim(),
        family: family.value,
        subject: subject.value,
      };

      Object.entries(values).forEach(([key, value]) => {
        if (value) {
          url.searchParams.set(key, value);
        } else {
          url.searchParams.delete(key);
        }
      });

      window.history.replaceState({}, "", url);
    };

    const update = () => {
      const query = normalise(search.value);
      const selectedFamily = family.value;
      const selectedSubject = subject.value;

      let visible = 0;

      cards.forEach((card) => {
        const matchesQuery =
          !query || normalise(card.dataset.search).includes(query);
        const matchesFamily =
          !selectedFamily || card.dataset.family === selectedFamily;
        const matchesSubject =
          !selectedSubject || card.dataset.subject === selectedSubject;
        const shouldShow = matchesQuery && matchesFamily && matchesSubject;

        card.hidden = !shouldShow;

        if (shouldShow) {
          visible += 1;
        }
      });

      count.textContent =
        language === "en"
          ? `${visible} ${visible === 1 ? "resource category" : "resource categories"}`
          : `${visible} 項資源分類`;

      empty.hidden = visible !== 0;
      updateUrl();
    };

    const restore = () => {
      const params = new URLSearchParams(window.location.search);
      search.value = params.get("q") ?? "";
      family.value = params.get("family") ?? "";
      subject.value = params.get("subject") ?? "";
    };

    search.addEventListener("input", () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(update, 120);
    });

    family.addEventListener("change", update);
    subject.addEventListener("change", update);

    form.addEventListener("reset", () => {
      window.setTimeout(update, 0);
    });

    reset?.addEventListener("click", () => {
      search.focus();
    });

    restore();
    update();
  };

  const start = () => {
    document
      .querySelectorAll("[data-resource-directory]")
      .forEach(initialiseDirectory);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();

IBRIDGE_FILE_4_EOF

# ============================================================
# src/pages/programmes/index.astro
# ============================================================

cat > src/pages/programmes/index.astro <<'IBRIDGE_FILE_5_EOF'
---
import BaseLayout from "../../layouts/BaseLayout.astro";
import CurriculumHub from "../../components/CurriculumHub.astro";
import "../../styles/curriculum-hub.css";
---

<BaseLayout
  title="課程方案"
  description="iBridge Education 的 MYP、DP、DP 核心、英文寫作、IELTS、SAT 與 TOEFL 課程方案。"
  locale="zh-tw"
  zhPath="/programmes/"
  enPath="/en/programmes/"
  pageType="WebPage"
  breadcrumbs={[
    { name: "首頁", path: "/" },
    { name: "課程方案", path: "/programmes/" },
  ]}
>
  <CurriculumHub lang="zh" mode="programmes" />
</BaseLayout>

IBRIDGE_FILE_5_EOF

# ============================================================
# src/pages/en/programmes/index.astro
# ============================================================

cat > src/pages/en/programmes/index.astro <<'IBRIDGE_FILE_6_EOF'
---
import BaseLayout from "../../../layouts/BaseLayout.astro";
import CurriculumHub from "../../../components/CurriculumHub.astro";
import "../../../styles/curriculum-hub.css";
---

<BaseLayout
  title="Programmes"
  description="iBridge Education programmes for MYP, DP, the DP Core, English writing, IELTS, SAT and TOEFL."
  locale="en"
  zhPath="/programmes/"
  enPath="/en/programmes/"
  pageType="WebPage"
  breadcrumbs={[
    { name: "Home", path: "/en/" },
    { name: "Programmes", path: "/en/programmes/" },
  ]}
>
  <CurriculumHub lang="en" mode="programmes" />
</BaseLayout>

IBRIDGE_FILE_6_EOF

# ============================================================
# src/pages/research/index.astro
# ============================================================

cat > src/pages/research/index.astro <<'IBRIDGE_FILE_7_EOF'
---
import BaseLayout from "../../layouts/BaseLayout.astro";
import CurriculumHub from "../../components/CurriculumHub.astro";
import "../../styles/curriculum-hub.css";
---

<BaseLayout
  title="教育研究"
  description="連結 MYP、DP、DP 核心、學術寫作與國際檢定課程的教育研究方向、研究問題與改善流程。"
  locale="zh-tw"
  zhPath="/research/"
  enPath="/en/research/"
  pageType="WebPage"
  breadcrumbs={[
    { name: "首頁", path: "/" },
    { name: "教育研究", path: "/research/" },
  ]}
>
  <CurriculumHub lang="zh" mode="research" />
</BaseLayout>

IBRIDGE_FILE_7_EOF

# ============================================================
# src/pages/en/research/index.astro
# ============================================================

cat > src/pages/en/research/index.astro <<'IBRIDGE_FILE_8_EOF'
---
import BaseLayout from "../../../layouts/BaseLayout.astro";
import CurriculumHub from "../../../components/CurriculumHub.astro";
import "../../../styles/curriculum-hub.css";
---

<BaseLayout
  title="Educational Research"
  description="Educational research strands, questions and improvement processes connected to MYP, DP, the DP Core, academic writing and international tests."
  locale="en"
  zhPath="/research/"
  enPath="/en/research/"
  pageType="WebPage"
  breadcrumbs={[
    { name: "Home", path: "/en/" },
    { name: "Educational Research", path: "/en/research/" },
  ]}
>
  <CurriculumHub lang="en" mode="research" />
</BaseLayout>

IBRIDGE_FILE_8_EOF

# ============================================================
# src/pages/resources/index.astro
# ============================================================

cat > src/pages/resources/index.astro <<'IBRIDGE_FILE_9_EOF'
---
import BaseLayout from "../../layouts/BaseLayout.astro";
import CurriculumHub from "../../components/CurriculumHub.astro";
import "../../styles/curriculum-hub.css";
---

<BaseLayout
  title="教育資源"
  description="依 MYP、DP、DP 核心、英文寫作、IELTS、SAT 與 TOEFL 分類搜尋 iBridge Education 教育資源。"
  locale="zh-tw"
  zhPath="/resources/"
  enPath="/en/resources/"
  pageType="WebPage"
  breadcrumbs={[
    { name: "首頁", path: "/" },
    { name: "教育資源", path: "/resources/" },
  ]}
>
  <CurriculumHub lang="zh" mode="resources" />
</BaseLayout>

IBRIDGE_FILE_9_EOF

# ============================================================
# src/pages/en/resources/index.astro
# ============================================================

cat > src/pages/en/resources/index.astro <<'IBRIDGE_FILE_10_EOF'
---
import BaseLayout from "../../../layouts/BaseLayout.astro";
import CurriculumHub from "../../../components/CurriculumHub.astro";
import "../../../styles/curriculum-hub.css";
---

<BaseLayout
  title="Educational Resources"
  description="Search iBridge Education resources by MYP, DP, the DP Core, English writing, IELTS, SAT and TOEFL."
  locale="en"
  zhPath="/resources/"
  enPath="/en/resources/"
  pageType="WebPage"
  breadcrumbs={[
    { name: "Home", path: "/en/" },
    { name: "Educational Resources", path: "/en/resources/" },
  ]}
>
  <CurriculumHub lang="en" mode="resources" />
</BaseLayout>

IBRIDGE_FILE_10_EOF

# ============================================================
# VALIDATION
# ============================================================

echo ""
echo "檢查資源搜尋程式 / Checking resource search script..."
node --check public/scripts/course-resource-filter.js

echo ""
echo "檢查指定三區是否仍有舊分類文字 / Checking the three updated sections..."
if grep -R -n -E \
  'Artificial Intelligence in Education|AI in Education|人工智慧教育應用|人工智慧教育' \
  src/pages/programmes \
  src/pages/en/programmes \
  src/pages/research \
  src/pages/en/research \
  src/pages/resources \
  src/pages/en/resources \
  src/components/CurriculumHub.astro \
  src/data/courseCatalog.ts; then
  echo "錯誤：指定頁面仍存在舊分類文字。"
  echo "Error: a removed category is still present in the updated files."
  restore_targets
  exit 1
fi

echo ""
echo "執行 Astro 檢查 / Running Astro checks..."
if npm run | grep -qE '(^|[[:space:]])check($|[[:space:]])'; then
  npm run check
else
  echo "package.json 未設定 check 指令，略過 npm run check。"
  echo "No check script found; skipping npm run check."
fi

echo ""
echo "執行正式建置 / Running production build..."
if ! npm run build; then
  echo ""
  echo "建置失敗，正在還原本次修改。"
  echo "Build failed. Restoring the files changed by this installer."
  restore_targets
  echo "已還原。請保留終端機完整錯誤訊息。"
  echo "Restored. Keep the complete terminal error output for diagnosis."
  exit 1
fi

# ============================================================
# GIT COMMIT AND PUSH
# ============================================================

for target in "${TARGETS[@]}"; do
  if [ -e "$target" ] || git ls-files --error-unmatch "$target" >/dev/null 2>&1; then
    git add -A -- "$target"
  fi
done

if git diff --cached --quiet; then
  echo ""
  echo "沒有新的變更需要提交。"
  echo "No new changes to commit."
else
  git commit -m "Rebuild bilingual curriculum research and resource sections"
  git push
fi

echo ""
echo "============================================================"
echo "完成 / COMPLETE"
echo "============================================================"
echo "已更新 / Updated:"
echo "  https://ibridge.info/programmes/"
echo "  https://ibridge.info/en/programmes/"
echo "  https://ibridge.info/research/"
echo "  https://ibridge.info/en/research/"
echo "  https://ibridge.info/resources/"
echo "  https://ibridge.info/en/resources/"
echo ""
echo "課程結構 / Programme structure:"
echo "  1. IB MYP"
echo "  2. IB DP"
echo "  3. DP Core and Academic Writing"
echo "  4. International Test Preparation"
echo ""
echo "未修改首頁圖片、Logo、Header、Footer 或 global.css。"
echo "Homepage images, logo, header, footer and global.css were not changed."
echo ""
echo "Cloudflare Pages 會在 GitHub push 後自動部署。"
echo "Cloudflare Pages will deploy automatically after the GitHub push."
echo "============================================================"
