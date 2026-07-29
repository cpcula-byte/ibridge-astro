export type ResourceStatus = "available" | "coming-soon";
export type ResourceLanguage = "zh" | "en" | "bilingual";

export interface ResourceItem {
  id: string;
  category: "MYP" | "DP" | "TOK" | "ELA" | "AI" | "WELL";
  subject: string;
  titleZh: string;
  titleEn: string;
  summaryZh: string;
  summaryEn: string;
  levelZh: string;
  levelEn: string;
  resourceTypeZh: string;
  resourceTypeEn: string;
  language: ResourceLanguage;
  format: string;
  pages: number | null;
  updated: string;
  fileSize: string;
  status: ResourceStatus;
  downloadUrl: string;
  featured?: boolean;
}

/*
新增正式資源的方法：
1. 將 PDF 放進 public/downloads/，例如：
   public/downloads/myp/myp-writing-unit-01.pdf

2. 將 status 改成 "available"

3. 將 downloadUrl 設為：
   "/downloads/myp/myp-writing-unit-01.pdf"

4. 填入 format、pages、updated、fileSize 等檔案資訊。
*/

export const resources: ResourceItem[] = [
  {
    id: "myp-curriculum-planning",
    category: "MYP",
    subject: "Curriculum Planning",
    titleZh: "MYP 課程規劃與單元設計資源",
    titleEn: "MYP Curriculum and Unit Planning Resources",
    summaryZh:
      "包含課程架構、探究設計、評量規劃、語言支持與垂直銜接資源。",
    summaryEn:
      "Curriculum architecture, inquiry design, assessment planning, language support and vertical alignment.",
    levelZh: "MYP 1–5",
    levelEn: "MYP Years 1–5",
    resourceTypeZh: "課程與單元規劃",
    resourceTypeEn: "Curriculum and unit planning",
    language: "bilingual",
    format: "PDF",
    pages: null,
    updated: "2026-07-29",
    fileSize: "—",
    status: "coming-soon",
    downloadUrl: "",
    featured: true,
  },
  {
    id: "dp-academic-assessment",
    category: "DP",
    subject: "Assessment",
    titleZh: "DP 學科知識與評量準備資源",
    titleEn: "DP Subject Knowledge and Assessment Resources",
    summaryZh:
      "支援學科知識、概念理解、學術寫作、內部評量與考試準備。",
    summaryEn:
      "Support for disciplinary knowledge, conceptual understanding, academic writing and assessment preparation.",
    levelZh: "DP 1–2",
    levelEn: "DP Years 1–2",
    resourceTypeZh: "學習與評量",
    resourceTypeEn: "Learning and assessment",
    language: "bilingual",
    format: "PDF",
    pages: null,
    updated: "2026-07-29",
    fileSize: "—",
    status: "coming-soon",
    downloadUrl: "",
    featured: true,
  },
  {
    id: "tok-evidence-perspectives",
    category: "TOK",
    subject: "Theory of Knowledge",
    titleZh: "TOK 證據、觀點、方法與倫理資源",
    titleEn: "TOK Evidence, Perspectives, Methods and Ethics",
    summaryZh:
      "以知識問題、證據、觀點、方法與倫理為核心的學習活動與教師工具。",
    summaryEn:
      "Learning experiences and teacher tools centred on knowledge questions, evidence, perspectives, methods and ethics.",
    levelZh: "DP TOK",
    levelEn: "DP TOK",
    resourceTypeZh: "課堂活動與評量",
    resourceTypeEn: "Classroom activities and assessment",
    language: "bilingual",
    format: "PDF",
    pages: null,
    updated: "2026-07-29",
    fileSize: "—",
    status: "coming-soon",
    downloadUrl: "",
  },
  {
    id: "ela-language-writing",
    category: "ELA",
    subject: "English Language Acquisition",
    titleZh: "英語與學術寫作資源",
    titleEn: "English and Academic Writing Resources",
    summaryZh:
      "涵蓋不同程度的閱讀、寫作、口說、聽力、文法與學術語言發展。",
    summaryEn:
      "Reading, writing, speaking, listening, grammar and academic-language development across proficiency levels.",
    levelZh: "A1–B2／MYP 1–5",
    levelEn: "A1–B2 / MYP Years 1–5",
    resourceTypeZh: "學生學習材料",
    resourceTypeEn: "Student learning materials",
    language: "bilingual",
    format: "PDF",
    pages: null,
    updated: "2026-07-29",
    fileSize: "—",
    status: "coming-soon",
    downloadUrl: "",
    featured: true,
  },
  {
    id: "ai-education",
    category: "AI",
    subject: "Artificial Intelligence",
    titleZh: "人工智慧教育應用資源",
    titleEn: "Artificial Intelligence in Education Resources",
    summaryZh:
      "聚焦安全、倫理、學習目的、教師專業判斷與課堂中的適切使用。",
    summaryEn:
      "Resources focused on safety, ethics, learning purposes, teacher judgement and appropriate classroom use.",
    levelZh: "教師與學校",
    levelEn: "Educators and schools",
    resourceTypeZh: "指南與專業學習",
    resourceTypeEn: "Guides and professional learning",
    language: "bilingual",
    format: "PDF",
    pages: null,
    updated: "2026-07-29",
    fileSize: "—",
    status: "coming-soon",
    downloadUrl: "",
  },
  {
    id: "well-learning-resilience",
    category: "WELL",
    subject: "Learning and Wellbeing",
    titleZh: "學習、自我調節與韌性資源",
    titleEn: "Learning, Self-Regulation and Resilience Resources",
    summaryZh:
      "連結自我調節、反思、動機、學習習慣、心理韌性與學生福祉。",
    summaryEn:
      "Practical resources connecting self-regulation, reflection, motivation, learning habits, resilience and wellbeing.",
    levelZh: "學生與教師",
    levelEn: "Students and educators",
    resourceTypeZh: "反思與學習工具",
    resourceTypeEn: "Reflection and learning tools",
    language: "bilingual",
    format: "PDF",
    pages: null,
    updated: "2026-07-29",
    fileSize: "—",
    status: "coming-soon",
    downloadUrl: "",
  },
];

export const categoryLabels = {
  MYP: {
    zh: "MYP 課程資源",
    en: "MYP Resources",
  },
  DP: {
    zh: "DP 課程資源",
    en: "DP Resources",
  },
  TOK: {
    zh: "知識論",
    en: "Theory of Knowledge",
  },
  ELA: {
    zh: "英語與學術寫作",
    en: "English and Academic Writing",
  },
  AI: {
    zh: "人工智慧教育應用",
    en: "AI in Education",
  },
  WELL: {
    zh: "學習與韌性",
    en: "Learning and Resilience",
  },
} as const;
