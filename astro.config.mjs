import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://ibridge.info",

  output: "static",

  trailingSlash: "never",

  i18n: {
    locales: ["zh-tw", "en"],

    defaultLocale: "zh-tw",

    routing: {
      prefixDefaultLocale: false,
    },
  },

  build: {
    format: "directory",
  },
});