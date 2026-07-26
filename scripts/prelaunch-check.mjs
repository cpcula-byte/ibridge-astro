const SITE_ORIGIN = "https://ibridge.info";
const SITEMAP_URL = `${SITE_ORIGIN}/sitemap.xml`;

const REQUEST_TIMEOUT_MS = 15000;
const USER_AGENT = "iBridge-Prelaunch-Audit/1.0";

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
  pagesChecked: 0,
  linksChecked: 0,
  errors: [],
  warnings: [],
  passed: [],
};

function colour(text, colourCode) {
  return `${colourCode}${text}${colours.reset}`;
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
    !url.pathname.endsWith(".xml") &&
    !url.pathname.includes(".") &&
    !url.pathname.endsWith("/")
  ) {
    url.pathname = `${url.pathname}/`;
  }

  return url.href;
}

function isInternalHttpUrl(input) {
  try {
    const url = new URL(input, SITE_ORIGIN);

    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.origin === SITE_ORIGIN
    );
  } catch {
    return false;
  }
}

function extractAttribute(tag, attributeName) {
  const expression = new RegExp(
    `${attributeName}\\s*=\\s*["']([^"']+)["']`,
    "i",
  );

  const match = tag.match(expression);

  return match?.[1]?.trim() ?? "";
}

function extractFirst(html, expression) {
  const match = html.match(expression);

  return match?.[1]?.trim() ?? "";
}

function extractMetaContent(html, selectorExpression) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const tag of tags) {
    if (!selectorExpression.test(tag)) {
      continue;
    }

    return extractAttribute(tag, "content");
  }

  return "";
}

function extractLinkHref(html, relation, hreflang = "") {
  const tags = html.match(/<link\b[^>]*>/gi) ?? [];

  for (const tag of tags) {
    const rel = extractAttribute(tag, "rel").toLowerCase();

    if (rel !== relation.toLowerCase()) {
      continue;
    }

    if (hreflang) {
      const language = extractAttribute(tag, "hreflang").toLowerCase();

      if (language !== hreflang.toLowerCase()) {
        continue;
      }
    }

    return extractAttribute(tag, "href");
  }

  return "";
}

function extractInternalLinks(html, pageUrl) {
  const links = new Set();
  const anchorTags = html.match(/<a\b[^>]*>/gi) ?? [];

  for (const tag of anchorTags) {
    const href = extractAttribute(tag, "href");

    if (
      !href ||
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("javascript:")
    ) {
      continue;
    }

    if (!isInternalHttpUrl(href)) {
      continue;
    }

    try {
      links.add(normaliseUrl(new URL(href, pageUrl).href));
    } catch {
      results.warnings.push({
        page: pageUrl,
        message: `無法解析內部連結 / Unable to parse internal link: ${href}`,
      });
    }
  }

  return [...links];
}

function addError(page, message) {
  results.errors.push({
    page,
    message,
  });

  console.log(
    `${colour("✘", colours.red)} ${message}`,
  );
}

function addWarning(page, message) {
  results.warnings.push({
    page,
    message,
  });

  console.log(
    `${colour("▲", colours.yellow)} ${message}`,
  );
}

function addPass(message) {
  results.passed.push(message);

  console.log(
    `${colour("✓", colours.green)} ${message}`,
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
        "User-Agent": USER_AGENT,
        Accept:
          method === "GET"
            ? "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
            : "*/*",
        "Cache-Control": "no-cache",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function loadSitemap() {
  console.log(
    colour(
      "\n1. Sitemap 檢查 / Sitemap check",
      colours.bold,
    ),
  );

  let response;

  try {
    response = await fetchWithTimeout(
      `${SITEMAP_URL}?audit=${Date.now()}`,
    );
  } catch (error) {
    throw new Error(
      `無法讀取 Sitemap / Unable to fetch sitemap: ${error.message}`,
    );
  }

  if (!response.ok) {
    throw new Error(
      `Sitemap 回傳 ${response.status} / Sitemap returned ${response.status}`,
    );
  }

  const contentType =
    response.headers.get("content-type") ?? "";

  if (
    !contentType.includes("application/xml") &&
    !contentType.includes("text/xml")
  ) {
    addWarning(
      SITEMAP_URL,
      `Sitemap Content-Type 為 ${contentType || "未知"} / Unexpected sitemap Content-Type`,
    );
  } else {
    addPass(
      `Sitemap Content-Type 正確 / Valid sitemap Content-Type: ${contentType}`,
    );
  }

  const xml = await response.text();

  const locations = [
    ...xml.matchAll(
      /<loc>\s*([^<]+?)\s*<\/loc>/gi,
    ),
  ].map((match) => normaliseUrl(decodeXml(match[1])));

  const uniqueLocations = [...new Set(locations)];

  if (uniqueLocations.length === 0) {
    throw new Error(
      "Sitemap 中沒有網址 / No URLs were found in the sitemap.",
    );
  }

  addPass(
    `找到 ${uniqueLocations.length} 個網址 / Found ${uniqueLocations.length} URLs`,
  );

  return uniqueLocations;
}

function checkPageMetadata(pageUrl, html) {
  const expectedLanguage = new URL(pageUrl).pathname.startsWith(
    "/en/",
  )
    ? "en"
    : "zh-Hant";

  const htmlTag =
    html.match(/<html\b[^>]*>/i)?.[0] ?? "";

  const actualLanguage = extractAttribute(
    htmlTag,
    "lang",
  );

  if (!actualLanguage) {
    addError(
      pageUrl,
      "缺少 html lang / Missing html lang attribute",
    );
  } else if (
    actualLanguage.toLowerCase() !==
    expectedLanguage.toLowerCase()
  ) {
    addError(
      pageUrl,
      `語言標記錯誤：預期 ${expectedLanguage}，目前為 ${actualLanguage} / Incorrect language attribute`,
    );
  } else {
    addPass(
      `語言標記正確 / Correct language: ${actualLanguage}`,
    );
  }

  const title = extractFirst(
    html,
    /<title[^>]*>([\s\S]*?)<\/title>/i,
  );

  if (!title) {
    addError(
      pageUrl,
      "缺少頁面標題 / Missing page title",
    );
  } else if (title.length < 10) {
    addWarning(
      pageUrl,
      `頁面標題可能過短 / Page title may be too short: "${title}"`,
    );
  } else if (title.length > 70) {
    addWarning(
      pageUrl,
      `頁面標題可能過長 / Page title may be too long (${title.length} characters)`,
    );
  } else {
    addPass(`頁面標題存在 / Page title found`);
  }

  const description = extractMetaContent(
    html,
    /name\s*=\s*["']description["']/i,
  );

  if (!description) {
    addError(
      pageUrl,
      "缺少 meta description / Missing meta description",
    );
  } else if (description.length < 50) {
    addWarning(
      pageUrl,
      `Meta description 可能過短 / Description may be too short (${description.length} characters)`,
    );
  } else if (description.length > 180) {
    addWarning(
      pageUrl,
      `Meta description 可能過長 / Description may be too long (${description.length} characters)`,
    );
  } else {
    addPass(
      `Meta description 存在 / Meta description found`,
    );
  }

  const canonical = extractLinkHref(
    html,
    "canonical",
  );

  if (!canonical) {
    addError(
      pageUrl,
      "缺少 canonical / Missing canonical URL",
    );
  } else {
    const expectedCanonical = normaliseUrl(pageUrl);
    const actualCanonical = normaliseUrl(canonical);

    if (actualCanonical !== expectedCanonical) {
      addError(
        pageUrl,
        `Canonical 不一致 / Canonical mismatch: ${actualCanonical}`,
      );
    } else {
      addPass(
        "Canonical 正確 / Canonical URL is correct",
      );
    }
  }

  const zhAlternate = extractLinkHref(
    html,
    "alternate",
    "zh-Hant",
  );

  const enAlternate = extractLinkHref(
    html,
    "alternate",
    "en",
  );

  const defaultAlternate = extractLinkHref(
    html,
    "alternate",
    "x-default",
  );

  if (!zhAlternate) {
    addError(
      pageUrl,
      "缺少 zh-Hant hreflang / Missing zh-Hant alternate",
    );
  }

  if (!enAlternate) {
    addError(
      pageUrl,
      "缺少 en hreflang / Missing English alternate",
    );
  }

  if (!defaultAlternate) {
    addError(
      pageUrl,
      "缺少 x-default hreflang / Missing x-default alternate",
    );
  }

  if (
    zhAlternate &&
    enAlternate &&
    defaultAlternate
  ) {
    addPass(
      "雙語 hreflang 完整 / Bilingual hreflang tags found",
    );
  }

  const robots = extractMetaContent(
    html,
    /name\s*=\s*["']robots["']/i,
  );

  if (!robots) {
    addWarning(
      pageUrl,
      "缺少 robots meta / Missing robots meta tag",
    );
  } else if (
    robots.toLowerCase().includes("noindex")
  ) {
    addError(
      pageUrl,
      `頁面被設定為 noindex / Page is set to noindex: ${robots}`,
    );
  } else {
    addPass(
      `頁面允許索引 / Page is indexable: ${robots}`,
    );
  }

  const ogTitle = extractMetaContent(
    html,
    /property\s*=\s*["']og:title["']/i,
  );

  const ogDescription = extractMetaContent(
    html,
    /property\s*=\s*["']og:description["']/i,
  );

  const ogImage = extractMetaContent(
    html,
    /property\s*=\s*["']og:image["']/i,
  );

  if (!ogTitle) {
    addWarning(
      pageUrl,
      "缺少 og:title / Missing Open Graph title",
    );
  }

  if (!ogDescription) {
    addWarning(
      pageUrl,
      "缺少 og:description / Missing Open Graph description",
    );
  }

  if (!ogImage) {
    addWarning(
      pageUrl,
      "缺少 og:image / Missing Open Graph image",
    );
  }

  if (
    ogTitle &&
    ogDescription &&
    ogImage
  ) {
    addPass(
      "Open Graph 資料完整 / Open Graph metadata found",
    );
  }

  const mainElementExists =
    /<main\b[^>]*id\s*=\s*["']main-content["'][^>]*>/i.test(
      html,
    );

  if (!mainElementExists) {
    addWarning(
      pageUrl,
      "缺少 id=\"main-content\" 的主要內容區 / Missing main-content landmark",
    );
  } else {
    addPass(
      "主要內容區存在 / Main content landmark found",
    );
  }

  const skipLinkExists =
    /href\s*=\s*["']#main-content["']/i.test(
      html,
    );

  if (!skipLinkExists) {
    addWarning(
      pageUrl,
      "缺少跳至主要內容連結 / Missing skip link",
    );
  } else {
    addPass(
      "跳至主要內容連結存在 / Skip link found",
    );
  }
}

async function checkPage(pageUrl) {
  results.pagesChecked += 1;

  console.log(
    colour(
      `\n檢查頁面 / Checking page:\n${pageUrl}`,
      colours.cyan,
    ),
  );

  let response;

  try {
    response = await fetchWithTimeout(
      `${pageUrl}${
        pageUrl.includes("?") ? "&" : "?"
      }audit=${Date.now()}`,
    );
  } catch (error) {
    addError(
      pageUrl,
      `頁面讀取失敗 / Page request failed: ${error.message}`,
    );

    return [];
  }

  if (!response.ok) {
    addError(
      pageUrl,
      `HTTP 狀態錯誤 / HTTP error: ${response.status}`,
    );

    return [];
  }

  addPass(
    `HTTP 狀態正確 / HTTP status: ${response.status}`,
  );

  const contentType =
    response.headers.get("content-type") ?? "";

  if (!contentType.includes("text/html")) {
    addWarning(
      pageUrl,
      `頁面 Content-Type 不是 text/html / Unexpected Content-Type: ${contentType}`,
    );
  }

  const html = await response.text();

  checkPageMetadata(pageUrl, html);

  return extractInternalLinks(html, pageUrl);
}

async function checkInternalLink(linkUrl) {
  results.linksChecked += 1;

  let response;

  try {
    response = await fetchWithTimeout(linkUrl, {
      method: "HEAD",
    });

    if (
      response.status === 405 ||
      response.status === 403
    ) {
      response = await fetchWithTimeout(linkUrl, {
        method: "GET",
      });
    }
  } catch (error) {
    addError(
      linkUrl,
      `內部連結無法讀取 / Internal link request failed: ${error.message}`,
    );

    return;
  }

  if (response.status >= 400) {
    addError(
      linkUrl,
      `內部連結失效 / Broken internal link: HTTP ${response.status}`,
    );
  }
}

function printDetailedIssues(title, issues, colourCode) {
  if (issues.length === 0) {
    return;
  }

  console.log(
    colour(`\n${title}`, colourCode),
  );

  for (const issue of issues) {
    console.log(`\n${issue.page}`);
    console.log(`  ${issue.message}`);
  }
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
      "iBridge Education 上架前檢查結果",
      colours.bold,
    ),
  );

  console.log(
    colour(
      "iBridge Education Pre-launch Audit",
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
    `已檢查頁面 / Pages checked: ${results.pagesChecked}`,
  );

  console.log(
    `已檢查內部連結 / Internal links checked: ${results.linksChecked}`,
  );

  console.log(
    colour(
      `通過項目 / Passed checks: ${results.passed.length}`,
      colours.green,
    ),
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

  printDetailedIssues(
    "警告詳情 / Warning details",
    results.warnings,
    colours.yellow,
  );

  printDetailedIssues(
    "錯誤詳情 / Error details",
    results.errors,
    colours.red,
  );

  if (results.errors.length === 0) {
    console.log(
      colour(
        "\n檢查完成：未發現阻止網站上線的錯誤。",
        colours.green,
      ),
    );

    console.log(
      colour(
        "Audit complete: no launch-blocking errors were found.",
        colours.green,
      ),
    );
  } else {
    console.log(
      colour(
        "\n檢查完成：請先修正以上錯誤，再正式宣布網站上線。",
        colours.red,
      ),
    );

    console.log(
      colour(
        "Audit complete: correct the errors above before launch.",
        colours.red,
      ),
    );
  }
}

async function main() {
  console.log(
    colour(
      "\niBridge Education 全站上架前檢查",
      colours.bold,
    ),
  );

  console.log(
    colour(
      "iBridge Education Full Pre-launch Audit",
      colours.bold,
    ),
  );

  console.log(`網站 / Website: ${SITE_ORIGIN}`);

  const sitemapUrls = await loadSitemap();
  const collectedInternalLinks = new Set();

  console.log(
    colour(
      "\n2. 雙語頁面檢查 / Bilingual page checks",
      colours.bold,
    ),
  );

  for (const pageUrl of sitemapUrls) {
    const links = await checkPage(pageUrl);

    for (const link of links) {
      collectedInternalLinks.add(link);
    }
  }

  console.log(
    colour(
      "\n3. 內部連結檢查 / Internal link checks",
      colours.bold,
    ),
  );

  const linksToCheck = [
    ...collectedInternalLinks,
  ].filter((link) => {
    const pathname = new URL(link).pathname;

    return (
      !pathname.startsWith("/cdn-cgi/") &&
      !pathname.endsWith(".xml")
    );
  });

  for (const linkUrl of linksToCheck) {
    await checkInternalLink(linkUrl);
  }

  printSummary();

  if (results.errors.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(
    colour(
      "\n檢查工具發生嚴重錯誤 / Audit failed:",
      colours.red,
    ),
  );

  console.error(error);

  process.exitCode = 1;
});