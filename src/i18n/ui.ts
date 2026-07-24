export const languages = {
  "zh-tw": "繁體中文",
  en: "English",
} as const;

export type Locale = keyof typeof languages;

export const defaultLocale: Locale = "zh-tw";

export const ui = {
  "zh-tw": {
    "nav.home": "首頁",
    "nav.about": "關於我們",
    "nav.services": "服務",
    "nav.research": "研究",
    "nav.resources": "資源",
    "nav.contact": "聯絡我們",
    "nav.consultation": "預約諮詢",

    "footer.website": "網站",
    "footer.resources": "資源",
    "footer.contact": "聯絡方式",
    "footer.programmes": "課程與方案",
    "footer.rights": "保留所有權利",
    "footer.location": "台灣・提供國際合作",

    "language.label": "語言",
    "language.zh": "繁中",
    "language.en": "EN",
  },

  en: {
    "nav.home": "Home",
    "nav.about": "About",
    "nav.services": "Services",
    "nav.research": "Research",
    "nav.resources": "Resources",
    "nav.contact": "Contact",
    "nav.consultation": "Book a Consultation",

    "footer.website": "Website",
    "footer.resources": "Resources",
    "footer.contact": "Contact",
    "footer.programmes": "Programmes",
    "footer.rights": "All rights reserved",
    "footer.location": "Based in Taiwan · International collaboration",

    "language.label": "Language",
    "language.zh": "繁中",
    "language.en": "EN",
  },
} as const;

export function useTranslations(locale: Locale) {
  return function translate(key: keyof (typeof ui)["zh-tw"]) {
    return ui[locale][key] ?? ui[defaultLocale][key];
  };
}