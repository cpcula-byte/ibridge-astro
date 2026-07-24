import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://ibridge.info",

  output: "static",

  i18n: {
    locales: [
      "zh-tw",
      "en",
    ],

    defaultLocale: "zh-tw",

    routing: {
      prefixDefaultLocale: false,
    },
  },
});