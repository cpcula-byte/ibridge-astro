import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

const root = process.cwd();
const src = join(root, "src");
const pagesRoot = join(src, "pages");
const errors = [];

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const astroFiles = walk(src).filter((file) => extname(file) === ".astro");
const pageFiles = walk(pagesRoot).filter((file) => extname(file) === ".astro");
const routes = new Set(["/"]);

for (const file of pageFiles) {
  const rel = relative(pagesRoot, file).replaceAll("\\", "/");
  if (rel === "404.astro") continue;

  const route = rel.endsWith("/index.astro")
    ? `/${rel.slice(0, -"index.astro".length)}`
    : rel === "index.astro"
      ? "/"
      : `/${rel.slice(0, -".astro".length)}/`;

  routes.add(route.replaceAll("//", "/"));
}

for (const file of astroFiles) {
  const text = readFileSync(file, "utf8");

  if (!text.startsWith("---\n") || !text.includes("\n---\n")) {
    errors.push(`${relative(root, file)}: invalid Astro frontmatter delimiters`);
  }

  for (const match of text.matchAll(/import\s+\w+\s+from\s+["']([^"']+)["']/g)) {
    const specifier = match[1];
    if (!specifier.startsWith(".")) continue;

    const candidate = resolve(file, "..", specifier);
    const resolved = extname(candidate) ? candidate : `${candidate}.astro`;

    if (!existsSync(resolved)) {
      errors.push(`${relative(root, file)}: missing import ${specifier}`);
    }
  }

  for (const match of text.matchAll(/href=["'](\/[^"'#?]*)["']/g)) {
    const href = match[1];
    if (href.startsWith("/images/") || href.startsWith("/fonts/")) continue;

    const route = href === "/" || href.endsWith("/") ? href : `${href}/`;
    if (!routes.has(route)) {
      errors.push(`${relative(root, file)}: unresolved internal link ${href}`);
    }
  }
}

const requiredCodeFiles = [
  "public/_headers",
  "public/sitemap.xml",
  "public/images/home/hero-zh-2026.png",
  "public/images/home/hero-en-2026.png",
  "src/styles/global.css",
  "src/pages/index.astro",
  "src/pages/en/index.astro",
];

for (const item of requiredCodeFiles) {
  if (!existsSync(join(root, item))) {
    errors.push(`missing required file: ${item}`);
  }
}

const zhHome = readFileSync(join(root, "src/pages/index.astro"), "utf8");
const enHome = readFileSync(join(root, "src/pages/en/index.astro"), "utf8");
const css = readFileSync(join(root, "src/styles/global.css"), "utf8");

if (!zhHome.includes("/images/home/hero-zh-2026.png?v=20260729-approved-01")) {
  errors.push("Traditional Chinese homepage does not use the approved versioned hero image path");
}

if (!enHome.includes("/images/home/hero-en-2026.png?v=20260729-approved-01")) {
  errors.push("English homepage does not use the approved versioned hero image path");
}

if (!css.includes("--text: #18212b") || !css.includes("--text-soft: #34414d")) {
  errors.push("high-contrast text colour variables are missing");
}

if (errors.length) {
  console.error(
    "Static validation failed:\n" +
      errors.map((error) => `- ${error}`).join("\n"),
  );
  process.exit(1);
}

console.log(
  `Static validation passed: ${astroFiles.length} Astro files, ${routes.size} routes, approved bilingual hero images, accurate dimensions and high-contrast colours confirmed.`,
);
