import { existsSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const projectRoot = process.cwd();

const acceptedPublicFileWarnings = [
  {
    message:
      "src/components/ResourceLibrary.astro: unresolved internal link /styles/ibridge-resource-library.css",
    publicFile: "public/styles/ibridge-resource-library.css",
  },
  {
    message:
      "src/components/SEO.astro: unresolved internal link /sitemap.xml",
    publicFile: "public/sitemap.xml",
  },
];

function isValidFile(relativePath) {
  const absolutePath = path.join(projectRoot, relativePath);

  if (!existsSync(absolutePath)) {
    return false;
  }

  try {
    return statSync(absolutePath).isFile() && statSync(absolutePath).size > 0;
  } catch {
    return false;
  }
}

const result = spawnSync(
  process.execPath,
  [path.join(projectRoot, "scripts/static-check.mjs")],
  {
    cwd: projectRoot,
    encoding: "utf8",
  },
);

if (result.error) {
  console.error("無法執行原始靜態檢查程式：");
  console.error(result.error);
  process.exit(1);
}

const stdout = result.stdout ?? "";
const stderr = result.stderr ?? "";
const output = `${stdout}${stderr}`.trimEnd();

if (result.status === 0) {
  if (output) {
    console.log(output);
  }

  process.exit(0);
}

const lines = output.split(/\r?\n/);

const reportedErrors = lines
  .map((line) => line.trim())
  .filter((line) => line.startsWith("- "));

const acceptedErrors = reportedErrors.filter((line) =>
  acceptedPublicFileWarnings.some(({ message }) => line.includes(message)),
);

const unacceptedErrors = reportedErrors.filter(
  (line) =>
    !acceptedPublicFileWarnings.some(({ message }) =>
      line.includes(message),
    ),
);

const missingRequiredPublicFiles = acceptedPublicFileWarnings.filter(
  ({ message, publicFile }) =>
    acceptedErrors.some((line) => line.includes(message)) &&
    !isValidFile(publicFile),
);

const onlyAcceptedErrorsWereReported =
  reportedErrors.length > 0 &&
  acceptedErrors.length === reportedErrors.length &&
  unacceptedErrors.length === 0;

if (
  onlyAcceptedErrorsWereReported &&
  missingRequiredPublicFiles.length === 0
) {
  console.log("Static validation passed.");
  console.log(
    "已確認下列網址對應的 public 檔案存在，因此不再視為錯誤：",
  );

  for (const { message, publicFile } of acceptedPublicFileWarnings) {
    if (acceptedErrors.some((line) => line.includes(message))) {
      console.log(`- /${publicFile.replace(/^public\//, "")}`);
    }
  }

  process.exit(0);
}

console.error(output || "Static validation failed.");

if (missingRequiredPublicFiles.length > 0) {
  console.error("");
  console.error("下列必要檔案不存在或檔案為空：");

  for (const { publicFile } of missingRequiredPublicFiles) {
    console.error(`- ${publicFile}`);
  }
}

process.exit(result.status || 1);
