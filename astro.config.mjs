import { defineConfig } from "astro/config";

import siteSearchIndex from "./scripts/search-index.mjs";

export default defineConfig({
  vite: { server: { allowedHosts: ["terminal.local"] } },
  integrations: [siteSearchIndex()],
  site: "https://ibridge.info",
  output: "static",
  trailingSlash: "always",
  build: {
    format: "directory"
  }
});
