import { spawn } from "node:child_process";
import process from "node:process";

const SITE_ORIGIN = "https://ibridge.info";
const REQUEST_TIMEOUT_MS = 30000;

const KEY_URLS = [
  `${SITE_ORIGIN}/`,
  `${SITE_ORIGIN}/en/`,
  `${SITE_ORIGIN}/about/`,
  `${SITE_ORIGIN}/en/about/`,
  `${SITE_ORIGIN}/services/`,
  `${SITE_ORIGIN}/en/services/`,
  `${SITE_ORIGIN}/programmes/`,
  `${SITE_ORIGIN}/en/programmes/`,
  `${SITE_ORIGIN}/research/`,
  `${SITE_ORIGIN}/en/research/`,
  `${SITE_ORIGIN}/resources/`,
  `${SITE_ORIGIN}/en/resources/`,
  `${SITE_ORIGIN}/contact/`,
  `${SITE_ORIGIN}/en/contact/`,
  `${SITE_ORIGIN}/privacy/`,
  `${SITE_ORIGIN}/en/privacy/`,
  `${SITE_ORIGIN}/terms/`,
  `${SITE_ORIGIN}/en/terms/`,
  `${SITE_ORIGIN}/accessibility/`,
  `${SITE_ORIGIN}/en/accessibility/`,
  `${SITE_ORIGIN}/sitemap.xml`,
  `${SITE_ORIGIN}/robots.txt`,
];

const colours = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  grey: "\x1b[90m",
};

const results = {
  steps: [],
  urlChecks: [],
  warnings: [],
  errors: [],
};

function colour(text, code) {
  return `${code}${text}${colours.reset}`;
}

function printSection(titleZh, titleEn) {
  console.log(
    colour(
      `\n========================================\n${titleZh}\n${titleEn}\n========================================`,
      colours.bold,
    ),
  );
}

function addPass(messageZh, messageEn) {
  console.log(colour(`✓ ${messageZh} / ${messageEn}`, colours.green));
}

function addWarning(messageZh, messageEn) {
  results.warnings.push({ messageZh, messageEn });
  console.log(colour(`▲ ${messageZh} / ${messageEn}`, colours.yellow));
}

function addError(messageZh, messageEn) {
  results.errors.push({ messageZh, messageEn });
  console.log(colour(`✘ ${messageZh} / ${messageEn}`, colours.red));
}

function runCommand({ nameZh, nameEn, command, args }) {
  return new Promise((resolve) => {
    printSection(nameZh, nameEn);

    const child = spawn(command, args, {
      stdio: "inherit",
      shell: false,
      env: process.env,
    });

    child.on("error", (error) => {
      addError(
        `${nameZh}無法執行：${error.message}`,
        `${nameEn} could not run: ${error.message}`,
      );

      results.steps.push({
        nameZh,
        nameEn,
        success: false,
        exitCode: null,
      });

      resolve(false);
    });

    child.on("close", (exitCode) => {
      const success = exitCode === 0;

      results.steps.push({
        nameZh,
        nameEn,
        success,
        exitCode,
      });

      if (success) {
        addPass(`${nameZh}完成`, `${nameEn} completed`);
      } else {
        addError(
          `${nameZh}失敗，退出代碼：${exitCode}`,
          `${nameEn} failed with exit code ${exitCode}`,
        );
      }

      resolve(success);
    });
  });
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "Cache-Control": "no-cache",
        "User-Agent": "iBridge-Launch-Check/1.0",
        ...(options.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function checkUrl(url) {
  try {
    const separator = url.includes("?") ? "&" : "?";
    const requestUrl = `${url}${separator}launch-check=${Date.now()}`;

    let response = await fetchWithTimeout(requestUrl, {
      method: "HEAD",
    });

    if (response.status === 403 || response.status === 405) {
      response = await fetchWithTimeout(requestUrl, {
        method: "GET",
      });
    }

    const ok = response.status >= 200 && response.status < 400;

    results.urlChecks.push({
      url,
      status: response.status,
      finalUrl: response.url,
      ok,
    });

    if (ok) {
      addPass(
        `網址正常：${url}（HTTP ${response.status}）`,
        `URL is healthy: ${url} (HTTP ${response.status})`,
      );
    } else {
      addError(
        `網址異常：${url}（HTTP ${response.status}）`,
        `URL failed: ${url} (HTTP ${response.status})`,
      );
    }
  } catch (error) {
    results.urlChecks.push({
      url,
      status: 0,
      finalUrl: url,
      ok: false,
      error: error.message,
    });

    addError(
      `網址檢查失敗：${url}（${error.message}）`,
      `URL check failed: ${url} (${error.message})`,
    );
  }
}

async function checkAllUrls() {
  printSection("正式網站網址檢查", "Production URL Checks");

  for (const url of KEY_URLS) {
    await checkUrl(url);
  }
}

function printSummary() {
  printSection(
    "iBridge Education 正式上線總檢查結果",
    "iBridge Education Final Launch Check",
  );

  const successfulSteps = results.steps.filter((step) => step.success).length;
  const successfulUrls = results.urlChecks.filter((item) => item.ok).length;

  console.log(`步驟 / Steps: ${successfulSteps}/${results.steps.length}`);
  console.log(`網址 / URLs: ${successfulUrls}/${results.urlChecks.length}`);

  console.log(
    colour(
      `警告 / Warnings: ${results.warnings.length}`,
      results.warnings.length > 0 ? colours.yellow : colours.green,
    ),
  );

  console.log(
    colour(
      `錯誤 / Errors: ${results.errors.length}`,
      results.errors.length > 0 ? colours.red : colours.green,
    ),
  );

  if (results.errors.length === 0) {
    console.log(
      colour(
        "\n正式上線檢查通過：未發現阻止網站公開的錯誤。",
        colours.green,
      ),
    );

    console.log(
      colour(
        "Launch check passed: no launch-blocking errors were found.",
        colours.green,
      ),
    );
  } else {
    console.log(
      colour(
        "\n正式上線檢查未通過：請先修正上述錯誤。",
        colours.red,
      ),
    );

    console.log(
      colour(
        "Launch check failed: correct the errors above before public launch.",
        colours.red,
      ),
    );

    process.exitCode = 1;
  }
}

async function main() {
  console.log(colour("\niBridge Education 正式上線總檢查", colours.bold));
  console.log(colour("iBridge Education Final Launch Check", colours.bold));

  const buildPassed = await runCommand({
    nameZh: "Astro 正式建置",
    nameEn: "Astro Production Build",
    command: "npm",
    args: ["run", "build"],
  });

  if (!buildPassed) {
    printSummary();
    return;
  }

  const prelaunchPassed = await runCommand({
    nameZh: "SEO 與結構檢查",
    nameEn: "SEO and Structure Audit",
    command: "node",
    args: ["scripts/prelaunch-check.mjs"],
  });

  if (!prelaunchPassed) {
    addWarning(
      "SEO 與結構檢查未通過，仍會繼續執行其餘檢查。",
      "SEO and structure audit failed; remaining checks will continue.",
    );
  }

  const responsivePassed = await runCommand({
    nameZh: "響應式網站檢查",
    nameEn: "Responsive Website Audit",
    command: "node",
    args: ["scripts/responsive-check.mjs"],
  });

  if (!responsivePassed) {
    addWarning(
      "響應式檢查未通過，仍會繼續執行其餘檢查。",
      "Responsive audit failed; remaining checks will continue.",
    );
  }

  const interactionPassed = await runCommand({
    nameZh: "網站互動檢查",
    nameEn: "Website Interaction Audit",
    command: "node",
    args: ["scripts/interaction-check.mjs"],
  });

  if (!interactionPassed) {
    addWarning(
      "互動檢查未通過，仍會繼續執行正式網址檢查。",
      "Interaction audit failed; production URL checks will continue.",
    );
  }

  await checkAllUrls();
  printSummary();
}

main().catch((error) => {
  addError(
    `正式上線總檢查失敗：${error.message}`,
    `Final launch check failed: ${error.message}`,
  );

  printSummary();
});
