import { chromium } from "playwright";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const SITE_ORIGIN = "https://ibridge.info";
const SITEMAP_URL = `${SITE_ORIGIN}/sitemap.xml`;
const OUTPUT_DIRECTORY = path.resolve(process.cwd(), "responsive-audit");
const SCREENSHOT_DIRECTORY = path.join(OUTPUT_DIRECTORY, "screenshots");
const REPORT_PATH = path.join(OUTPUT_DIRECTORY, "responsive-report.html");
const JSON_REPORT_PATH = path.join(OUTPUT_DIRECTORY, "responsive-report.json");
const REQUEST_TIMEOUT_MS = 30000;

const VIEWPORTS = [
  { id: "desktop", labelZh: "桌面版", labelEn: "Desktop", width: 1440, height: 1000, isMobile: false, hasTouch: false },
  { id: "tablet", labelZh: "平板版", labelEn: "Tablet", width: 820, height: 1180, isMobile: false, hasTouch: true },
  { id: "mobile", labelZh: "手機版", labelEn: "Mobile", width: 390, height: 844, isMobile: true, hasTouch: true },
];

const colours = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  grey: "\x1b[90m",
};

const auditResults = {
  startedAt: new Date().toISOString(),
  finishedAt: "",
  website: SITE_ORIGIN,
  pagesExpected: 0,
  pageViewportChecks: 0,
  screenshotsCreated: 0,
  errors: [],
  warnings: [],
  pages: [],
};

function colour(text, code) {
  return `${code}${text}${colours.reset}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function decodeXml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

function normaliseUrl(input) {
  const url = new URL(input, SITE_ORIGIN);
  url.hash = "";

  if (
    url.origin === SITE_ORIGIN &&
    url.pathname !== "/" &&
    !url.pathname.includes(".") &&
    !url.pathname.endsWith("/")
  ) {
    url.pathname = `${url.pathname}/`;
  }

  return url.href;
}

function createPageSlug(pageUrl) {
  const pathname = new URL(pageUrl).pathname;

  if (pathname === "/") return "zh-home";
  if (pathname === "/en/") return "en-home";

  return pathname
    .replace(/^\/|\/$/g, "")
    .replaceAll("/", "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .toLowerCase();
}

function addIssue(type, pageUrl, viewport, messageZh, messageEn) {
  const issue = { type, pageUrl, viewport, messageZh, messageEn };

  if (type === "error") {
    auditResults.errors.push(issue);
    console.log(colour(`✘ ${messageZh} / ${messageEn}`, colours.red));
  } else {
    auditResults.warnings.push(issue);
    console.log(colour(`▲ ${messageZh} / ${messageEn}`, colours.yellow));
  }
}

function addPass(messageZh, messageEn) {
  console.log(colour(`✓ ${messageZh} / ${messageEn}`, colours.green));
}

async function fetchSitemapUrls() {
  console.log(colour("\n1. 讀取 Sitemap / Reading sitemap", colours.bold));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${SITEMAP_URL}?audit=${Date.now()}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/xml,text/xml,*/*",
        "Cache-Control": "no-cache",
        "User-Agent": "iBridge-Responsive-Audit/2.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Sitemap HTTP ${response.status}`);
    }

    const xml = await response.text();
    const urls = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
      .map((match) => normaliseUrl(decodeXml(match[1].trim())));

    const uniqueUrls = [...new Set(urls)];

    if (uniqueUrls.length === 0) {
      throw new Error("Sitemap 中沒有找到網址 / No URLs found in sitemap.");
    }

    auditResults.pagesExpected = uniqueUrls.length;
    addPass(`找到 ${uniqueUrls.length} 個頁面`, `Found ${uniqueUrls.length} pages`);

    return uniqueUrls;
  } finally {
    clearTimeout(timeout);
  }
}

async function prepareOutputDirectory() {
  await rm(OUTPUT_DIRECTORY, { recursive: true, force: true });
  await mkdir(SCREENSHOT_DIRECTORY, { recursive: true });
}

async function collectPageMeasurements(page) {
  return page.evaluate(() => {
    const html = document.documentElement;
    const body = document.body;
    const viewportWidth = window.innerWidth;
    const documentWidth = Math.max(html.scrollWidth, body?.scrollWidth ?? 0);

    const isVisible = (element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();

      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number.parseFloat(style.opacity || "1") > 0.01 &&
        rect.width > 0 &&
        rect.height > 0 &&
        element.getAttribute("hidden") === null &&
        element.getAttribute("aria-hidden") !== "true"
      );
    };

    const isInsideClosedRegion = (element) => {
      return Boolean(
        element.closest(
          '[hidden], [aria-hidden="true"], [data-state="closed"], [data-open="false"], .is-closed, .menu-closed, .nav-closed',
        ),
      );
    };

    const brokenImages = [...document.querySelectorAll("img")]
      .filter((image) => isVisible(image) && image.complete && image.naturalWidth === 0)
      .map((image) => ({
        src: image.currentSrc || image.src || "",
        alt: image.alt || "",
      }));

    const overflowingElements = [...document.querySelectorAll("body *")]
      .filter((element) => {
        if (!isVisible(element) || isInsideClosedRegion(element)) return false;

        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        if (
          style.position === "fixed" ||
          style.position === "absolute" ||
          style.position === "sticky"
        ) {
          return false;
        }

        return rect.right > viewportWidth + 4 || rect.left < -4;
      })
      .slice(0, 15)
      .map((element) => {
        const rect = element.getBoundingClientRect();

        return {
          tag: element.tagName.toLowerCase(),
          className: typeof element.className === "string" ? element.className : "",
          text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 90) ?? "",
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      });

    const overflowingNavigation = [
      ...document.querySelectorAll("header a, header button, nav a, nav button"),
    ]
      .filter((element) => {
        if (!isVisible(element) || isInsideClosedRegion(element)) return false;

        const rect = element.getBoundingClientRect();
        return rect.right > viewportWidth + 4 || rect.left < -4;
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();

        return {
          text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 60) ?? "",
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      });

    const firstHeading = document.querySelector("h1");

    return {
      title: document.title,
      language: html.lang || "",
      viewportWidth,
      documentWidth,
      horizontalOverflow: Math.max(0, documentWidth - viewportWidth),
      pageHeight: Math.max(html.scrollHeight, body?.scrollHeight ?? 0),
      hasHeader: Boolean(document.querySelector("header")),
      hasMain: Boolean(document.querySelector("main")),
      hasFooter: Boolean(document.querySelector("footer")),
      hasH1: Boolean(firstHeading),
      h1Text: firstHeading?.textContent?.trim().replace(/\s+/g, " ").slice(0, 150) ?? "",
      brokenImages,
      overflowingElements,
      overflowingNavigation,
    };
  });
}

function shouldIgnoreFailedRequest(url, reason) {
  const ignoredPatterns = [
    "/cdn-cgi/",
    "favicon.ico",
    "google-analytics.com",
    "googletagmanager.com",
    "doubleclick.net",
    "fonts.googleapis.com",
    "fonts.gstatic.com",
  ];

  return (
    ignoredPatterns.some((pattern) => url.includes(pattern)) ||
    reason.includes("ERR_ABORTED") ||
    reason.includes("NS_BINDING_ABORTED")
  );
}

async function auditPageAtViewport({ browser, pageUrl, viewport }) {
  auditResults.pageViewportChecks += 1;

  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    screen: { width: viewport.width, height: viewport.height },
    isMobile: viewport.isMobile,
    hasTouch: viewport.hasTouch,
    deviceScaleFactor: 1,
    locale: pageUrl.includes("/en/") ? "en-US" : "zh-TW",
    serviceWorkers: "block",
  });

  const page = await context.newPage();
  const browserErrors = [];
  const failedRequests = [];

  page.on("pageerror", (error) => browserErrors.push(error.message));

  page.on("requestfailed", (request) => {
    const failure = request.failure();
    const url = request.url();
    const reason = failure?.errorText || "Unknown request error";

    if (url.startsWith("data:") || shouldIgnoreFailedRequest(url, reason)) {
      return;
    }

    failedRequests.push({ url, reason });
  });

  const result = {
    viewport,
    status: 0,
    finalUrl: pageUrl,
    screenshot: "",
    measurements: null,
    browserErrors,
    failedRequests,
  };

  console.log(
    colour(
      `\n${viewport.labelZh} / ${viewport.labelEn}: ${viewport.width} × ${viewport.height}`,
      colours.cyan,
    ),
  );

  try {
    const response = await page.goto(
      `${pageUrl}${pageUrl.includes("?") ? "&" : "?"}responsive-audit=${Date.now()}`,
      {
        waitUntil: "networkidle",
        timeout: REQUEST_TIMEOUT_MS,
      },
    );

    result.status = response?.status() ?? 0;
    result.finalUrl = page.url();

    if (!response || result.status >= 400) {
      addIssue(
        "error",
        pageUrl,
        viewport.id,
        `頁面回傳 HTTP ${result.status || "未知"}`,
        `Page returned HTTP ${result.status || "unknown"}`,
      );
    } else {
      addPass(`HTTP 狀態 ${result.status}`, `HTTP status ${result.status}`);
    }

    await page.waitForTimeout(400);
    result.measurements = await collectPageMeasurements(page);

    const screenshotFileName = `${createPageSlug(pageUrl)}-${viewport.id}.png`;
    const screenshotPath = path.join(SCREENSHOT_DIRECTORY, screenshotFileName);

    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
      animations: "disabled",
    });

    result.screenshot = path.relative(OUTPUT_DIRECTORY, screenshotPath);
    auditResults.screenshotsCreated += 1;

    addPass("完整頁面截圖已建立", "Full-page screenshot created");

    const measurements = result.measurements;

    if (!measurements.hasHeader) {
      addIssue("error", pageUrl, viewport.id, "找不到 Header", "Header was not found");
    }

    if (!measurements.hasMain) {
      addIssue("error", pageUrl, viewport.id, "找不到 Main 主要內容", "Main content was not found");
    }

    if (!measurements.hasFooter) {
      addIssue("error", pageUrl, viewport.id, "找不到 Footer", "Footer was not found");
    }

    if (!measurements.hasH1) {
      addIssue("error", pageUrl, viewport.id, "頁面缺少 H1 標題", "Page is missing an H1 heading");
    }

    if (measurements.horizontalOverflow > 4) {
      addIssue(
        "error",
        pageUrl,
        viewport.id,
        `頁面出現 ${measurements.horizontalOverflow}px 水平溢出`,
        `Page has ${measurements.horizontalOverflow}px of horizontal overflow`,
      );
    } else {
      addPass("沒有水平捲動溢出", "No horizontal overflow");
    }

    if (measurements.overflowingNavigation.length > 0) {
      addIssue(
        "warning",
        pageUrl,
        viewport.id,
        "可見導覽元素接近或超出畫面邊界，請查看截圖",
        "Visible navigation elements approach or exceed the viewport edge; review the screenshot",
      );
    }

    if (measurements.brokenImages.length > 0) {
      addIssue(
        "error",
        pageUrl,
        viewport.id,
        `找到 ${measurements.brokenImages.length} 張載入失敗的圖片`,
        `Found ${measurements.brokenImages.length} broken images`,
      );
    } else {
      addPass("圖片載入正常", "Images loaded correctly");
    }

    if (browserErrors.length > 0) {
      addIssue(
        "error",
        pageUrl,
        viewport.id,
        `找到 ${browserErrors.length} 個 JavaScript 錯誤`,
        `Found ${browserErrors.length} JavaScript errors`,
      );
    }

    if (failedRequests.length > 0) {
      addIssue(
        "warning",
        pageUrl,
        viewport.id,
        `有 ${failedRequests.length} 個重要網路請求失敗`,
        `${failedRequests.length} important network requests failed`,
      );
    }

    if (
      measurements.overflowingElements.length > 0 &&
      measurements.horizontalOverflow <= 4
    ) {
      addIssue(
        "warning",
        pageUrl,
        viewport.id,
        "部分可見內容接近或超出畫面邊界，請查看截圖",
        "Some visible elements approach or exceed the viewport edge; review the screenshot",
      );
    }
  } catch (error) {
    addIssue(
      "error",
      pageUrl,
      viewport.id,
      `頁面檢查失敗：${error.message}`,
      `Page audit failed: ${error.message}`,
    );
  } finally {
    await context.close();
  }

  return result;
}

async function auditAllPages({ browser, pageUrls }) {
  console.log(
    colour(
      "\n2. 響應式頁面檢查 / Responsive page checks",
      colours.bold,
    ),
  );

  for (const pageUrl of pageUrls) {
    console.log(
      colour(
        `\n========================================\n檢查頁面 / Checking page:\n${pageUrl}`,
        colours.bold,
      ),
    );

    const pageResult = {
      pageUrl,
      language: new URL(pageUrl).pathname.startsWith("/en/") ? "en" : "zh-Hant",
      viewports: [],
    };

    for (const viewport of VIEWPORTS) {
      pageResult.viewports.push(
        await auditPageAtViewport({ browser, pageUrl, viewport }),
      );
    }

    auditResults.pages.push(pageResult);
  }
}

function createIssueRows(issues) {
  if (issues.length === 0) {
    return '<tr><td colspan="4" class="empty-cell">無 / None</td></tr>';
  }

  return issues
    .map(
      (issue) => `
        <tr>
          <td>${escapeHtml(issue.pageUrl)}</td>
          <td>${escapeHtml(issue.viewport)}</td>
          <td>${escapeHtml(issue.messageZh)}</td>
          <td>${escapeHtml(issue.messageEn)}</td>
        </tr>
      `,
    )
    .join("");
}

function createScreenshotCards() {
  return auditResults.pages
    .map((pageResult) => {
      const cards = pageResult.viewports
        .map((result) => {
          const measurements = result.measurements;
          const screenshotPath = result.screenshot
            ? result.screenshot.split(path.sep).join("/")
            : "";

          return `
            <article class="viewport-card">
              <div class="viewport-header">
                <div>
                  <h3>${escapeHtml(result.viewport.labelZh)} / ${escapeHtml(result.viewport.labelEn)}</h3>
                  <p>${result.viewport.width} × ${result.viewport.height}</p>
                </div>
                <span class="${
                  result.status >= 200 && result.status < 400
                    ? "status-pass"
                    : "status-error"
                }">
                  HTTP ${escapeHtml(result.status)}
                </span>
              </div>

              ${
                screenshotPath
                  ? `
                    <a href="${escapeHtml(screenshotPath)}" target="_blank" rel="noopener noreferrer">
                      <img
                        src="${escapeHtml(screenshotPath)}"
                        alt="${escapeHtml(`${pageResult.pageUrl} ${result.viewport.labelEn} screenshot`)}"
                        loading="lazy"
                      />
                    </a>
                  `
                  : '<div class="missing-screenshot">沒有截圖 / No screenshot</div>'
              }

              <dl>
                <div>
                  <dt>頁面寬度 / Document width</dt>
                  <dd>${escapeHtml(measurements?.documentWidth ?? "N/A")}px</dd>
                </div>
                <div>
                  <dt>頁面高度 / Page height</dt>
                  <dd>${escapeHtml(measurements?.pageHeight ?? "N/A")}px</dd>
                </div>
                <div>
                  <dt>水平溢出 / Overflow</dt>
                  <dd>${escapeHtml(measurements?.horizontalOverflow ?? "N/A")}px</dd>
                </div>
                <div>
                  <dt>H1</dt>
                  <dd>${escapeHtml(measurements?.h1Text || "Missing")}</dd>
                </div>
              </dl>
            </article>
          `;
        })
        .join("");

      return `
        <section class="page-section">
          <h2>${escapeHtml(pageResult.pageUrl)}</h2>
          <div class="viewport-grid">${cards}</div>
        </section>
      `;
    })
    .join("");
}

function createHtmlReport() {
  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>iBridge Education Responsive Audit</title>
  <style>
    :root {
      color-scheme: light;
      font-family: "Helvetica Neue", Helvetica, Arial, "PingFang TC", sans-serif;
      background: #f7f1e3;
      color: #1f2933;
    }

    * { box-sizing: border-box; }
    body { margin: 0; }
    a { color: inherit; }

    .container {
      width: min(1400px, calc(100% - 40px));
      margin: 0 auto;
    }

    .hero {
      padding: 70px 0;
      background: #7b1422;
      color: #ffffff;
    }

    .hero p {
      margin: 0 0 12px;
      color: #f2c66d;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    .hero h1 {
      margin: 0;
      font-size: clamp(2.4rem, 6vw, 5rem);
      line-height: 1;
    }

    .summary {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 16px;
      padding: 40px 0;
    }

    .summary article,
    .viewport-card,
    .table-wrapper {
      border: 1px solid #e4d7c5;
      background: #faf7f0;
    }

    .summary article {
      padding: 24px;
      border-radius: 16px;
    }

    .summary span {
      display: block;
      margin-bottom: 8px;
      color: #315c6b;
      font-size: 0.76rem;
      font-weight: 700;
    }

    .summary strong { font-size: 2rem; }
    .status-pass { color: #176b42; }
    .status-warning { color: #8c5d0a; }
    .status-error { color: #a51c30; }

    .issues {
      padding: 20px 0 50px;
    }

    .issues h2,
    .page-section > h2 {
      margin: 0 0 20px;
    }

    .table-wrapper {
      overflow-x: auto;
      border-radius: 16px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th,
    td {
      padding: 15px;
      border-bottom: 1px solid #e4d7c5;
      text-align: left;
      vertical-align: top;
    }

    th { background: #efe4d2; }
    .empty-cell { text-align: center; }

    .page-section {
      padding: 45px 0;
      border-top: 1px solid #e4d7c5;
    }

    .viewport-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 22px;
    }

    .viewport-card {
      overflow: hidden;
      border-radius: 18px;
    }

    .viewport-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 15px;
      padding: 20px;
    }

    .viewport-header h3,
    .viewport-header p {
      margin: 0;
    }

    .viewport-header p {
      margin-top: 5px;
      color: #52606d;
    }

    .viewport-header > span {
      font-size: 0.8rem;
      font-weight: 700;
    }

    .viewport-card img {
      display: block;
      width: 100%;
      max-height: 640px;
      border-top: 1px solid #e4d7c5;
      border-bottom: 1px solid #e4d7c5;
      object-fit: cover;
      object-position: top;
    }

    .viewport-card dl {
      display: grid;
      gap: 12px;
      margin: 0;
      padding: 20px;
    }

    .viewport-card dl div {
      display: grid;
      gap: 4px;
    }

    .viewport-card dt {
      color: #315c6b;
      font-size: 0.74rem;
      font-weight: 700;
    }

    .viewport-card dd {
      margin: 0;
      overflow-wrap: anywhere;
    }

    .missing-screenshot {
      padding: 60px 20px;
      text-align: center;
    }

    footer {
      padding: 40px 0;
      background: #1f2933;
      color: #ffffff;
    }

    @media (max-width: 1000px) {
      .summary {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .viewport-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 600px) {
      .container {
        width: min(100% - 24px, 1400px);
      }

      .summary {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>

<body>
  <header class="hero">
    <div class="container">
      <p>iBridge Education</p>
      <h1>響應式網站檢查<br />Responsive Website Audit</h1>
    </div>
  </header>

  <main class="container">
    <section class="summary">
      <article><span>頁面 / Pages</span><strong>${auditResults.pagesExpected}</strong></article>
      <article><span>畫面檢查 / Viewport checks</span><strong>${auditResults.pageViewportChecks}</strong></article>
      <article><span>截圖 / Screenshots</span><strong>${auditResults.screenshotsCreated}</strong></article>
      <article><span>警告 / Warnings</span><strong class="status-warning">${auditResults.warnings.length}</strong></article>
      <article><span>錯誤 / Errors</span><strong class="status-error">${auditResults.errors.length}</strong></article>
    </section>

    <section class="issues">
      <h2>錯誤 / Errors</h2>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>頁面 / Page</th>
              <th>尺寸 / Viewport</th>
              <th>繁中</th>
              <th>English</th>
            </tr>
          </thead>
          <tbody>${createIssueRows(auditResults.errors)}</tbody>
        </table>
      </div>
    </section>

    <section class="issues">
      <h2>警告 / Warnings</h2>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>頁面 / Page</th>
              <th>尺寸 / Viewport</th>
              <th>繁中</th>
              <th>English</th>
            </tr>
          </thead>
          <tbody>${createIssueRows(auditResults.warnings)}</tbody>
        </table>
      </div>
    </section>

    ${createScreenshotCards()}
  </main>

  <footer>
    <div class="container">
      <p>Generated: ${escapeHtml(auditResults.finishedAt)}</p>
    </div>
  </footer>
</body>
</html>`;
}

async function saveReports() {
  auditResults.finishedAt = new Date().toISOString();

  await writeFile(
    JSON_REPORT_PATH,
    JSON.stringify(auditResults, null, 2),
    "utf8",
  );

  await writeFile(
    REPORT_PATH,
    createHtmlReport(),
    "utf8",
  );
}

function printSummary() {
  console.log(colour("\n========================================", colours.grey));
  console.log(colour("iBridge Education 響應式檢查結果", colours.bold));
  console.log(colour("iBridge Education Responsive Audit", colours.bold));
  console.log(colour("========================================", colours.grey));

  console.log(`頁面 / Pages: ${auditResults.pagesExpected}`);
  console.log(`畫面檢查 / Viewport checks: ${auditResults.pageViewportChecks}`);
  console.log(`截圖 / Screenshots: ${auditResults.screenshotsCreated}`);

  console.log(
    colour(
      `警告 / Warnings: ${auditResults.warnings.length}`,
      auditResults.warnings.length > 0 ? colours.yellow : colours.green,
    ),
  );

  console.log(
    colour(
      `錯誤 / Errors: ${auditResults.errors.length}`,
      auditResults.errors.length > 0 ? colours.red : colours.green,
    ),
  );

  console.log(`\nHTML 報告 / HTML report:\n${REPORT_PATH}`);
  console.log(`\nJSON 報告 / JSON report:\n${JSON_REPORT_PATH}`);

  if (auditResults.errors.length === 0) {
    console.log(
      colour(
        "\n檢查完成：未發現阻止網站上線的響應式錯誤。",
        colours.green,
      ),
    );

    console.log(
      colour(
        "Audit complete: no launch-blocking responsive errors were found.",
        colours.green,
      ),
    );
  } else {
    console.log(
      colour(
        "\n檢查完成：請查看報告並修正錯誤。",
        colours.red,
      ),
    );

    console.log(
      colour(
        "Audit complete: review the report and correct the errors.",
        colours.red,
      ),
    );

    process.exitCode = 1;
  }
}

async function main() {
  console.log(
    colour(
      "\niBridge Education 響應式網站檢查",
      colours.bold,
    ),
  );

  console.log(
    colour(
      "iBridge Education Responsive Website Audit",
      colours.bold,
    ),
  );

  await prepareOutputDirectory();
  const pageUrls = await fetchSitemapUrls();

  const browser = await chromium.launch({ headless: true });

  try {
    await auditAllPages({ browser, pageUrls });
  } finally {
    await browser.close();
  }

  await saveReports();
  printSummary();
}

main().catch((error) => {
  console.error(
    colour(
      "\n響應式檢查失敗 / Responsive audit failed",
      colours.red,
    ),
  );

  console.error(error);
  process.exitCode = 1;
});
