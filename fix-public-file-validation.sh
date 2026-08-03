#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# iBridge Education
# 修正 public 資料夾檔案被 static-check 誤判的問題
# ============================================================

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"

if [[ -z "$ROOT" ]]; then
  echo "錯誤：目前不在 Git 專案中。"
  exit 1
fi

cd "$ROOT"

REQUIRED_FILES=(
  "package.json"
  "scripts/static-check.mjs"
  "public/styles/ibridge-resource-library.css"
  "public/sitemap.xml"
  "src/pages/index.astro"
  "src/pages/en/index.astro"
  "public/images/home/hero-zh-2026.png"
  "public/images/home/hero-en-2026.png"
  "public/images/home/hero-zh-2026.webp"
  "public/images/home/hero-en-2026.webp"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [[ ! -s "$file" ]]; then
    echo "錯誤：找不到檔案或檔案為空：$file"
    exit 1
  fi
done

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR=".ibridge-backups/public-validation-fix-$STAMP"

mkdir -p "$BACKUP_DIR/scripts"

cp package.json "$BACKUP_DIR/package.json"

if [[ -f "scripts/static-check-public-aware.mjs" ]]; then
  cp \
    "scripts/static-check-public-aware.mjs" \
    "$BACKUP_DIR/scripts/static-check-public-aware.mjs"
fi

echo "備份完成：$BACKUP_DIR"

# ------------------------------------------------------------
# 建立保留原檢查功能的包裝器
# ------------------------------------------------------------

cat > scripts/static-check-public-aware.mjs <<'JS'
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
JS

# ------------------------------------------------------------
# 更新 package.json 的 check 指令
# ------------------------------------------------------------

python3 <<'PY'
import json
from pathlib import Path

package_path = Path("package.json")
package_data = json.loads(package_path.read_text(encoding="utf-8"))

scripts = package_data.setdefault("scripts", {})
scripts["check"] = "node scripts/static-check-public-aware.mjs"

package_path.write_text(
    json.dumps(
        package_data,
        ensure_ascii=False,
        indent=2,
    ) + "\n",
    encoding="utf-8",
)

print("已更新 package.json 的 check 指令。")
PY

echo ""
echo "確認首頁使用的新圖片："

grep -nE \
  'hero-(zh|en)-2026\.(png|webp)' \
  src/pages/index.astro \
  src/pages/en/index.astro

echo ""
echo "確認 public 檔案："

ls -lh \
  public/styles/ibridge-resource-library.css \
  public/sitemap.xml

echo ""
echo "執行修正後的網站檢查……"

npm run check

echo ""
echo "執行 Astro 正式建置……"

npm run build

echo ""
echo "================================================"
echo "修正完成：網站檢查與正式建置均已通過。"
echo "備份位置：$BACKUP_DIR"
echo "================================================"
echo ""
echo "接下來可以執行 Git 部署指令。"
