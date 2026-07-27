import { chromium } from "playwright";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const SITE_ORIGIN = "https://ibridge.info";
const SITEMAP_URL = `${SITE_ORIGIN}/sitemap.xml`;
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mrenyjjk";
const REQUEST_TIMEOUT_MS = 30000;

const OUTPUT_DIRECTORY = path.resolve(
  process.cwd(),
  "interaction-audit",
);

const REPORT_PATH = path.join(
  OUTPUT_DIRECTORY,
  "interaction-report.html",
);

const JSON_REPORT_PATH = path.join(
  OUTPUT_DIRECTORY,
  "interaction-report.json",
);

const VIEWPORTS = {
  desktop: {
    width: 1440,
    height: 1000,
    isMobile: false,
    hasTouch: false,
  },
  mobile: {
    width: 390,
    height: 844,
    isMobile: true,
    hasTouch: true,
  },
};

const colours = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  grey: "\x1b[90m",
};

const results = {
  startedAt: new Date().toISOString(),
  finishedAt: "",
  website: SITE_ORIGIN,
  pagesChecked: 0,
  mobileMenusChecked: 0,
  languageSwitchesChecked: 0,
  formsChecked: 0,
  downloadLinksChecked: 0,
  errors: [],
  warnings: [],
  passes: [],
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

function isEnglishUrl(pageUrl) {
  return new URL(pageUrl).pathname.startsWith("/en/");
}

function expectedAlternateUrl(pageUrl) {
  const url = new URL(pageUrl);
  const pathname = url.pathname;

  if (pathname === "/") {
    return `${SITE_ORIGIN}/en/`;
  }

  if (pathname === "/en/") {
    return `${SITE_ORIGIN}/`;
  }

  if (pathname.startsWith("/en/")) {
    return normaliseUrl(
      `${SITE_ORIGIN}${pathname.replace(/^\/en/, "")}`,
    );
  }

  return normaliseUrl(
    `${SITE_ORIGIN}/en${pathname}`,
  );
}

function addPass(pageUrl, messageZh, messageEn) {
  const item = {
    type: "pass",
    pageUrl,
    messageZh,
    messageEn,
  };

  results.passes.push(item);

  console.log(
    colour(
      `✓ ${messageZh} / ${messageEn}`,
      colours.green,
    ),
  );
}

function addWarning(pageUrl, messageZh, messageEn) {
  const item = {
    type: "warning",
    pageUrl,
    messageZh,
    messageEn,
  };

  results.warnings.push(item);

  console.log(
    colour(
      `▲ ${messageZh} / ${messageEn}`,
      colours.yellow,
    ),
  );
}

function addError(pageUrl, messageZh, messageEn) {
  const item = {
    type: "error",
    pageUrl,
    messageZh,
    messageEn,
  };

  results.errors.push(item);

  console.log(
    colour(
      `✘ ${messageZh} / ${messageEn}`,
      colours.red,
    ),
  );
}

async function fetchWithTimeout(
  url,
  {
    method = "GET",
    redirect = "follow",
  } = {},
) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      method,
      redirect,
      signal: controller.signal,
      headers: {
        "User-Agent": "iBridge-Interaction-Audit/1.0",
        "Cache-Control": "no-cache",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function loadSitemapUrls() {
  console.log(
    colour(
      "\n1. 讀取 Sitemap / Reading sitemap",
      colours.bold,
    ),
  );

  const response = await fetchWithTimeout(
    `${SITEMAP_URL}?interaction-audit=${Date.now()}`,
  );

  if (!response.ok) {
    throw new Error(
      `Sitemap HTTP ${response.status}`,
    );
  }

  const xml = await response.text();

  const urls = [
    ...xml.matchAll(
      /<loc>\s*([^<]+?)\s*<\/loc>/gi,
    ),
  ].map((match) => {
    return normaliseUrl(
      decodeXml(match[1].trim()),
    );
  });

  const uniqueUrls = [...new Set(urls)];

  if (uniqueUrls.length === 0) {
    throw new Error(
      "Sitemap 中沒有找到網址 / No URLs found in sitemap.",
    );
  }

  addPass(
    SITEMAP_URL,
    `找到 ${uniqueUrls.length} 個頁面`,
    `Found ${uniqueUrls.length} pages`,
  );

  return uniqueUrls;
}

async function prepareOutputDirectory() {
  await rm(OUTPUT_DIRECTORY, {
    recursive: true,
    force: true,
  });

  await mkdir(OUTPUT_DIRECTORY, {
    recursive: true,
  });
}

async function checkHttpUrl(url) {
  let response;

  try {
    response = await fetchWithTimeout(url, {
      method: "HEAD",
    });

    if (
      response.status === 403 ||
      response.status === 405
    ) {
      response = await fetchWithTimeout(url, {
        method: "GET",
      });
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      message: error.message,
    };
  }

  return {
    ok:
      response.status >= 200 &&
      response.status < 400,
    status: response.status,
    message: "",
  };
}

async function checkLanguageSwitch({
  page,
  pageUrl,
}) {
  results.languageSwitchesChecked += 1;

  const expectedUrl =
    expectedAlternateUrl(pageUrl);

  const switchResult = await page.evaluate(
    ({ expected, englishPage }) => {
      const anchors = [
        ...document.querySelectorAll("a[href]"),
      ];

      const candidates = anchors
        .map((anchor) => {
          const href = anchor.href;
          const text =
            anchor.textContent
              ?.trim()
              .replace(/\s+/g, " ") ?? "";

          const hreflang =
            anchor.getAttribute("hreflang") ?? "";

          const ariaLabel =
            anchor.getAttribute("aria-label") ?? "";

          return {
            href,
            text,
            hreflang,
            ariaLabel,
          };
        })
        .filter((item) => {
          const combined =
            `${item.text} ${item.hreflang} ${item.ariaLabel}`
              .toLowerCase();

          return (
            item.href === expected ||
            combined.includes("english") ||
            combined.includes("繁體中文") ||
            combined.includes("中文") ||
            combined.includes("language") ||
            combined.includes("語言") ||
            (
              englishPage &&
              item.href === "https://ibridge.info/"
            ) ||
            (
              !englishPage &&
              item.href === "https://ibridge.info/en/"
            )
          );
        });

      return candidates;
    },
    {
      expected: expectedUrl,
      englishPage: isEnglishUrl(pageUrl),
    },
  );

  const exactMatch =
    switchResult.find((item) => {
      return normaliseUrl(item.href) ===
        normaliseUrl(expectedUrl);
    });

  if (!exactMatch) {
    addError(
      pageUrl,
      `找不到正確的語言切換連結：${expectedUrl}`,
      `Correct language switch link was not found: ${expectedUrl}`,
    );

    return;
  }

  const httpResult =
    await checkHttpUrl(expectedUrl);

  if (!httpResult.ok) {
    addError(
      pageUrl,
      `語言切換網址回傳 HTTP ${httpResult.status}`,
      `Language switch URL returned HTTP ${httpResult.status}`,
    );

    return;
  }

  addPass(
    pageUrl,
    "繁中／英文語言切換連結正常",
    "Chinese/English language switch is valid",
  );
}

async function checkMobileMenu({
  browser,
  pageUrl,
}) {
  results.mobileMenusChecked += 1;

  const context =
    await browser.newContext({
      viewport: {
        width: VIEWPORTS.mobile.width,
        height: VIEWPORTS.mobile.height,
      },
      screen: {
        width: VIEWPORTS.mobile.width,
        height: VIEWPORTS.mobile.height,
      },
      isMobile: true,
      hasTouch: true,
      locale:
        isEnglishUrl(pageUrl)
          ? "en-US"
          : "zh-TW",
      serviceWorkers: "block",
    });

  const page = await context.newPage();

  try {
    const response = await page.goto(
      `${pageUrl}${
        pageUrl.includes("?") ? "&" : "?"
      }menu-audit=${Date.now()}`,
      {
        waitUntil: "networkidle",
        timeout: REQUEST_TIMEOUT_MS,
      },
    );

    if (!response || response.status() >= 400) {
      addError(
        pageUrl,
        "手機版頁面無法開啟",
        "Mobile page could not be opened",
      );

      return;
    }

    const menuButton = page.locator(
      [
        'button[aria-controls][aria-expanded]',
        'button[aria-label*="menu" i]',
        'button[aria-label*="選單"]',
        'button[aria-label*="導覽"]',
        ".menu-toggle",
        ".nav-toggle",
        ".mobile-menu-toggle",
      ].join(", "),
    ).first();

    if (
      await menuButton.count() === 0
    ) {
      addWarning(
        pageUrl,
        "找不到手機選單按鈕；請人工確認導覽方式",
        "Mobile menu button was not found; review navigation manually",
      );

      return;
    }

    const visible =
      await menuButton.isVisible();

    if (!visible) {
      addError(
        pageUrl,
        "手機選單按鈕存在，但不可見",
        "Mobile menu button exists but is not visible",
      );

      return;
    }

    const beforeExpanded =
      await menuButton.getAttribute(
        "aria-expanded",
      );

    await menuButton.click();

    await page.waitForTimeout(250);

    const afterExpanded =
      await menuButton.getAttribute(
        "aria-expanded",
      );

    const visibleNavLinks =
      await page.locator(
        "header nav a:visible, header [role='navigation'] a:visible",
      ).count();

    if (
      afterExpanded === "true" ||
      visibleNavLinks > 1
    ) {
      addPass(
        pageUrl,
        "手機選單可以正常開啟",
        "Mobile menu opens correctly",
      );
    } else {
      addError(
        pageUrl,
        "點擊後手機選單未正確開啟",
        "Mobile menu did not open correctly after clicking",
      );
    }

    await menuButton.click();

    await page.waitForTimeout(200);

    const finalExpanded =
      await menuButton.getAttribute(
        "aria-expanded",
      );

    if (
      beforeExpanded === "false" &&
      finalExpanded !== "false"
    ) {
      addWarning(
        pageUrl,
        "手機選單可能未正確關閉",
        "Mobile menu may not close correctly",
      );
    } else {
      addPass(
        pageUrl,
        "手機選單可以正常關閉",
        "Mobile menu closes correctly",
      );
    }
  } catch (error) {
    addError(
      pageUrl,
      `手機選單檢查失敗：${error.message}`,
      `Mobile menu audit failed: ${error.message}`,
    );
  } finally {
    await context.close();
  }
}

async function checkContactForm({
  page,
  pageUrl,
}) {
  const form = page.locator(
    `form[action="${FORMSPREE_ENDPOINT}"]`,
  ).first();

  if (await form.count() === 0) {
    addError(
      pageUrl,
      "找不到正確的 Formspree 聯絡表單",
      "Correct Formspree contact form was not found",
    );

    return;
  }

  results.formsChecked += 1;

  const formData =
    await form.evaluate((element) => {
      const fields = [
        ...element.querySelectorAll(
          "input, select, textarea",
        ),
      ].map((field) => {
        return {
          tag:
            field.tagName.toLowerCase(),
          type:
            field.getAttribute("type") ?? "",
          name:
            field.getAttribute("name") ?? "",
          required:
            field.hasAttribute("required"),
        };
      });

      return {
        action: element.action,
        method:
          element.method.toLowerCase(),
        fields,
      };
    });

  if (
    normaliseUrl(formData.action) !==
    normaliseUrl(FORMSPREE_ENDPOINT)
  ) {
    addError(
      pageUrl,
      "Formspree 表單網址不正確",
      "Formspree form endpoint is incorrect",
    );
  } else {
    addPass(
      pageUrl,
      "Formspree 表單網址正確",
      "Formspree form endpoint is correct",
    );
  }

  if (formData.method !== "post") {
    addError(
      pageUrl,
      "聯絡表單 method 必須是 POST",
      "Contact form method must be POST",
    );
  } else {
    addPass(
      pageUrl,
      "聯絡表單使用 POST",
      "Contact form uses POST",
    );
  }

  const requiredTypes = {
    email: formData.fields.some(
      (field) => {
        return (
          field.type === "email" &&
          field.required
        );
      },
    ),
    message: formData.fields.some(
      (field) => {
        return (
          field.tag === "textarea" &&
          field.required
        );
      },
    ),
    consent: formData.fields.some(
      (field) => {
        return (
          field.type === "checkbox" &&
          field.required
        );
      },
    ),
  };

  for (const [key, present] of Object.entries(
    requiredTypes,
  )) {
    if (!present) {
      addError(
        pageUrl,
        `缺少必要欄位：${key}`,
        `Required field is missing: ${key}`,
      );
    }
  }

  if (
    Object.values(requiredTypes).every(
      Boolean,
    )
  ) {
    addPass(
      pageUrl,
      "電子郵件、訊息與隱私權同意皆為必填",
      "Email, message and privacy consent are required",
    );
  }
}

async function checkDownloadLinks({
  page,
  pageUrl,
}) {
  const links = await page.evaluate(() => {
    return [
      ...document.querySelectorAll("a[href]"),
    ]
      .map((anchor) => {
        return {
          href: anchor.href,
          text:
            anchor.textContent
              ?.trim()
              .replace(/\s+/g, " ") ?? "",
          download:
            anchor.hasAttribute("download"),
        };
      })
      .filter((item) => {
        const combined =
          `${item.text} ${item.href}`
            .toLowerCase();

        return (
          item.download ||
          combined.includes("download") ||
          combined.includes("下載") ||
          /\.(pdf|docx|pptx|xlsx|zip)$/i.test(
            new URL(item.href).pathname,
          )
        );
      });
  });

  for (const link of links) {
    results.downloadLinksChecked += 1;

    if (
      link.href.endsWith("#") ||
      link.href === pageUrl
    ) {
      addError(
        pageUrl,
        `下載連結沒有有效目的地：${link.text || link.href}`,
        `Download link has no valid destination: ${link.text || link.href}`,
      );

      continue;
    }

    const result =
      await checkHttpUrl(link.href);

    if (!result.ok) {
      addError(
        pageUrl,
        `下載連結回傳 HTTP ${result.status}：${link.href}`,
        `Download link returned HTTP ${result.status}: ${link.href}`,
      );
    } else {
      addPass(
        pageUrl,
        `下載連結正常：${link.text || link.href}`,
        `Download link is valid: ${link.text || link.href}`,
      );
    }
  }
}

async function auditPage({
  browser,
  pageUrl,
}) {
  results.pagesChecked += 1;

  console.log(
    colour(
      `\n檢查頁面 / Checking page:\n${pageUrl}`,
      colours.cyan,
    ),
  );

  const context =
    await browser.newContext({
      viewport: {
        width: VIEWPORTS.desktop.width,
        height: VIEWPORTS.desktop.height,
      },
      locale:
        isEnglishUrl(pageUrl)
          ? "en-US"
          : "zh-TW",
      serviceWorkers: "block",
    });

  const page = await context.newPage();

  const pageResult = {
    pageUrl,
    checks: [],
  };

  try {
    const response = await page.goto(
      `${pageUrl}${
        pageUrl.includes("?") ? "&" : "?"
      }interaction-audit=${Date.now()}`,
      {
        waitUntil: "networkidle",
        timeout: REQUEST_TIMEOUT_MS,
      },
    );

    if (!response || response.status() >= 400) {
      addError(
        pageUrl,
        `頁面回傳 HTTP ${response?.status() ?? "未知"}`,
        `Page returned HTTP ${response?.status() ?? "unknown"}`,
      );

      return pageResult;
    }

    addPass(
      pageUrl,
      `頁面回傳 HTTP ${response.status()}`,
      `Page returned HTTP ${response.status()}`,
    );

    await checkLanguageSwitch({
      page,
      pageUrl,
    });

    await checkDownloadLinks({
      page,
      pageUrl,
    });

    const pathname =
      new URL(pageUrl).pathname;

    if (
      pathname === "/contact/" ||
      pathname === "/en/contact/"
    ) {
      await checkContactForm({
        page,
        pageUrl,
      });
    }
  } catch (error) {
    addError(
      pageUrl,
      `頁面互動檢查失敗：${error.message}`,
      `Page interaction audit failed: ${error.message}`,
    );
  } finally {
    await context.close();
  }

  await checkMobileMenu({
    browser,
    pageUrl,
  });

  return pageResult;
}

function issueRows(items) {
  if (items.length === 0) {
    return `
      <tr>
        <td colspan="3" class="empty-cell">
          無 / None
        </td>
      </tr>
    `;
  }

  return items
    .map((item) => {
      return `
        <tr>
          <td>${escapeHtml(item.pageUrl)}</td>
          <td>${escapeHtml(item.messageZh)}</td>
          <td>${escapeHtml(item.messageEn)}</td>
        </tr>
      `;
    })
    .join("");
}

function createHtmlReport() {
  return `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1"
    />
    <title>
      iBridge Education Interaction Audit
    </title>

    <style>
      :root {
        font-family:
          "Helvetica Neue",
          Helvetica,
          Arial,
          "PingFang TC",
          sans-serif;
        color: #1f2933;
        background: #f7f1e3;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
      }

      .container {
        width: min(1280px, calc(100% - 40px));
        margin: 0 auto;
      }

      .hero {
        padding: 70px 0;
        color: #ffffff;
        background: #7b1422;
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
        grid-template-columns:
          repeat(5, minmax(0, 1fr));
        gap: 16px;
        padding: 40px 0;
      }

      .summary article,
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

      .summary strong {
        font-size: 2rem;
      }

      .errors {
        color: #a51c30;
      }

      .warnings {
        color: #8c5d0a;
      }

      section.report-section {
        padding: 20px 0 45px;
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

      th {
        background: #efe4d2;
      }

      .empty-cell {
        text-align: center;
      }

      footer {
        padding: 40px 0;
        color: #ffffff;
        background: #1f2933;
      }

      @media (max-width: 900px) {
        .summary {
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 560px) {
        .container {
          width: min(100% - 24px, 1280px);
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

        <h1>
          網站互動檢查
          <br />
          Website Interaction Audit
        </h1>
      </div>
    </header>

    <main class="container">
      <section class="summary">
        <article>
          <span>頁面 / Pages</span>
          <strong>${results.pagesChecked}</strong>
        </article>

        <article>
          <span>手機選單 / Mobile menus</span>
          <strong>${results.mobileMenusChecked}</strong>
        </article>

        <article>
          <span>語言切換 / Language switches</span>
          <strong>${results.languageSwitchesChecked}</strong>
        </article>

        <article>
          <span>警告 / Warnings</span>
          <strong class="warnings">
            ${results.warnings.length}
          </strong>
        </article>

        <article>
          <span>錯誤 / Errors</span>
          <strong class="errors">
            ${results.errors.length}
          </strong>
        </article>
      </section>

      <section class="report-section">
        <h2>錯誤 / Errors</h2>

        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>頁面 / Page</th>
                <th>繁中</th>
                <th>English</th>
              </tr>
            </thead>

            <tbody>
              ${issueRows(results.errors)}
            </tbody>
          </table>
        </div>
      </section>

      <section class="report-section">
        <h2>警告 / Warnings</h2>

        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>頁面 / Page</th>
                <th>繁中</th>
                <th>English</th>
              </tr>
            </thead>

            <tbody>
              ${issueRows(results.warnings)}
            </tbody>
          </table>
        </div>
      </section>
    </main>

    <footer>
      <div class="container">
        <p>
          Generated:
          ${escapeHtml(results.finishedAt)}
        </p>
      </div>
    </footer>
  </body>
</html>`;
}

async function saveReports() {
  results.finishedAt =
    new Date().toISOString();

  await writeFile(
    JSON_REPORT_PATH,
    JSON.stringify(
      results,
      null,
      2,
    ),
    "utf8",
  );

  await writeFile(
    REPORT_PATH,
    createHtmlReport(),
    "utf8",
  );
}

function printSummary() {
  console.log(
    colour(
      "\n========================================",
      colours.grey,
    ),
  );

  console.log(
    colour(
      "iBridge Education 網站互動檢查結果",
      colours.bold,
    ),
  );

  console.log(
    colour(
      "iBridge Education Interaction Audit",
      colours.bold,
    ),
  );

  console.log(
    colour(
      "========================================",
      colours.grey,
    ),
  );

  console.log(
    `頁面 / Pages: ${results.pagesChecked}`,
  );

  console.log(
    `手機選單 / Mobile menus: ${results.mobileMenusChecked}`,
  );

  console.log(
    `語言切換 / Language switches: ${results.languageSwitchesChecked}`,
  );

  console.log(
    `表單 / Forms: ${results.formsChecked}`,
  );

  console.log(
    `下載連結 / Download links: ${results.downloadLinksChecked}`,
  );

  console.log(
    colour(
      `警告 / Warnings: ${results.warnings.length}`,
      results.warnings.length > 0
        ? colours.yellow
        : colours.green,
    ),
  );

  console.log(
    colour(
      `錯誤 / Errors: ${results.errors.length}`,
      results.errors.length > 0
        ? colours.red
        : colours.green,
    ),
  );

  console.log(
    `\nHTML 報告 / HTML report:\n${REPORT_PATH}`,
  );

  console.log(
    `\nJSON 報告 / JSON report:\n${JSON_REPORT_PATH}`,
  );

  if (results.errors.length === 0) {
    console.log(
      colour(
        "\n檢查完成：未發現阻止網站上線的互動錯誤。",
        colours.green,
      ),
    );

    console.log(
      colour(
        "Audit complete: no launch-blocking interaction errors were found.",
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
      "\niBridge Education 網站互動檢查",
      colours.bold,
    ),
  );

  console.log(
    colour(
      "iBridge Education Website Interaction Audit",
      colours.bold,
    ),
  );

  await prepareOutputDirectory();

  const pageUrls =
    await loadSitemapUrls();

  const browser =
    await chromium.launch({
      headless: true,
    });

  try {
    for (const pageUrl of pageUrls) {
      results.pages.push(
        await auditPage({
          browser,
          pageUrl,
        }),
      );
    }
  } finally {
    await browser.close();
  }

  await saveReports();
  printSummary();
}

main().catch((error) => {
  console.error(
    colour(
      "\n網站互動檢查失敗 / Interaction audit failed",
      colours.red,
    ),
  );

  console.error(error);
  process.exitCode = 1;
});
