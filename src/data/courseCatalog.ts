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

