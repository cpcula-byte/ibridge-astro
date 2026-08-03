#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# iBridge Education
# 修正實際使用中的繁中／英文頁首 Logo
# ============================================================

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"

if [[ -z "$ROOT" ]]; then
  echo "錯誤：目前不在 Git 專案中。"
  exit 1
fi

cd "$ROOT"

PNG_LOGO="public/images/brand/ibridge-header-logo.png"
WEBP_LOGO="public/images/brand/ibridge-header-logo.webp"
GLOBAL_CSS="src/styles/global.css"

for required in \
  "$PNG_LOGO" \
  "$WEBP_LOGO" \
  "$GLOBAL_CSS"
do
  if [[ ! -s "$required" ]]; then
    echo "錯誤：找不到檔案或檔案為空：$required"
    exit 1
  fi
done

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR=".ibridge-backups/active-header-logo-$STAMP"

mkdir -p "$BACKUP_DIR/src"

if [[ -d "src/components" ]]; then
  cp -R "src/components" "$BACKUP_DIR/src/components"
fi

if [[ -d "src/layouts" ]]; then
  cp -R "src/layouts" "$BACKUP_DIR/src/layouts"
fi

mkdir -p "$BACKUP_DIR/src/styles"
cp "$GLOBAL_CSS" "$BACKUP_DIR/src/styles/global.css"

echo "備份完成：$BACKUP_DIR"

python3 <<'PY'
from pathlib import Path
import re
import sys

search_directories = [
    Path("src/components"),
    Path("src/layouts"),
]

astro_files = []

for directory in search_directories:
    if directory.exists():
        astro_files.extend(directory.rglob("*.astro"))

# 搜尋像以下形式的舊圖示：
# <span class="brand-mark">iB</span>
# <div class="logo-icon">iB</div>
pattern = re.compile(
    r"<(?P<tag>span|div)\b(?P<attrs>[^>]*)>\s*iB\s*</(?P=tag)>",
    re.IGNORECASE | re.DOTALL,
)

replacement = '''<span class="ibridge-active-logo" aria-hidden="true">
  <picture>
    <source
      srcset="/images/brand/ibridge-header-logo.webp?v=20260801-logo-02"
      type="image/webp"
    />
    <img
      src="/images/brand/ibridge-header-logo.png?v=20260801-logo-02"
      alt=""
      width="512"
      height="512"
      loading="eager"
      decoding="async"
    />
  </picture>
</span>'''

changed_files = []
replacement_count = 0

keywords = (
    "brand",
    "logo",
    "mark",
    "icon",
    "identity",
    "emblem",
)

for path in astro_files:
    original = path.read_text(encoding="utf-8")

    def replace_badge(match):
        global replacement_count

        attrs = match.group("attrs").lower()

        # 只替換看起來確實是 Logo／品牌圖示的精確 iB 元素
        if not any(keyword in attrs for keyword in keywords):
            return match.group(0)

        replacement_count += 1
        return replacement

    updated = pattern.sub(replace_badge, original)

    if updated != original:
        path.write_text(updated, encoding="utf-8")
        changed_files.append(path)

if replacement_count == 0:
    print("")
    print("錯誤：沒有找到實際使用中的舊 iB 圖示。")
    print("以下是專案中包含精確 iB 文字的程式位置：")
    print("")

    for path in astro_files:
        content = path.read_text(encoding="utf-8")
        for line_number, line in enumerate(content.splitlines(), start=1):
            if re.search(r">\s*iB\s*<", line, re.IGNORECASE):
                print(f"{path}:{line_number}: {line.strip()}")

    sys.exit(1)

print(f"已替換 {replacement_count} 個舊 iB 圖示。")

for path in changed_files:
    print(f"已更新：{path}")
PY

python3 <<'PY'
from pathlib import Path
import re

css_path = Path("src/styles/global.css")
css = css_path.read_text(encoding="utf-8")

start_marker = "/* IBRIDGE_ACTIVE_HEADER_LOGO_START */"
end_marker = "/* IBRIDGE_ACTIVE_HEADER_LOGO_END */"

# 避免重複加入相同 CSS
existing_block = re.compile(
    re.escape(start_marker)
    + r".*?"
    + re.escape(end_marker),
    re.DOTALL,
)

css = existing_block.sub("", css).rstrip()

logo_css = r'''
/* IBRIDGE_ACTIVE_HEADER_LOGO_START */

/*
 * iBridge Education header logo
 * Shared by Traditional Chinese and English pages.
 */

.ibridge-active-logo {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  display: inline-grid;
  place-items: center;
  overflow: hidden;
  padding: 0;
  margin: 0;
  background: transparent;
  border: 0;
  border-radius: 11px;
  box-shadow: none;
}

.ibridge-active-logo picture,
.ibridge-active-logo img {
  display: block;
  width: 100%;
  height: 100%;
}

.ibridge-active-logo img {
  object-fit: contain;
  object-position: center;
}

/*
 * 防止舊頁首樣式替新 Logo 加上第二層紅色背景、
 * 內距、文字樣式或陰影。
 */
.site-brand .ibridge-active-logo,
.brand .ibridge-active-logo,
.header-brand .ibridge-active-logo,
.navbar-brand .ibridge-active-logo {
  color: transparent;
  background: transparent;
  padding: 0;
  border: 0;
  box-shadow: none;
}

@media (max-width: 600px) {
  .ibridge-active-logo {
    width: 40px;
    height: 40px;
    flex-basis: 40px;
    border-radius: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ibridge-active-logo,
  .ibridge-active-logo img {
    transition: none;
  }
}

/* IBRIDGE_ACTIVE_HEADER_LOGO_END */
'''

css_path.write_text(
    css + "\n\n" + logo_css.strip() + "\n",
    encoding="utf-8",
)

print("已更新：src/styles/global.css")
PY

echo ""
echo "確認實際頁首已引用新 Logo："

grep -RIn \
  --include="*.astro" \
  "ibridge-header-logo" \
  src/components \
  src/layouts 2>/dev/null || true

echo ""
echo "確認舊的精確 iB 圖示是否仍然存在："

OLD_RESULTS="$(
  grep -RInE \
    --include="*.astro" \
    '>[[:space:]]*iB[[:space:]]*<' \
    src/components \
    src/layouts 2>/dev/null || true
)"

if [[ -n "$OLD_RESULTS" ]]; then
  echo "$OLD_RESULTS"
  echo ""
  echo "注意：仍找到其他精確 iB 元素，請先不要部署。"
  exit 1
else
  echo "沒有找到殘留的舊 iB 文字圖示。"
fi

echo ""
echo "執行網站檢查……"
npm run check

echo ""
echo "執行正式建置……"
npm run build

echo ""
echo "=================================================="
echo "修正完成：實際頁首已改用新的圖片 Logo。"
echo "繁中與英文頁面皆使用相同的新 Logo。"
echo "備份位置：$BACKUP_DIR"
echo "=================================================="
echo ""
echo "接下來請執行 Git 部署指令。"
