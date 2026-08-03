#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# iBridge Education — Header Icon Logo Centering Fix
# iBridge Education — 網站左上角 Icon Logo 置中修正
#
# Purpose / 用途
# - Keeps the approved logo image unchanged.
# - 不更換、不重新產生已核准的 Logo 圖檔。
# - Centres the logo horizontally and vertically inside its frame.
# - 將 Logo 在外框中水平與垂直置中。
# - Applies to both Traditional Chinese and English pages because
#   both languages use the shared Header.astro component.
# - 繁中與英文共用 Header.astro，因此兩個語言版本會同步生效。
# - Does not replace global.css, homepage images, navigation text,
#   Footer, or other pages.
# - 不取代 global.css、首頁圖片、導覽文字、Footer 或其他頁面。
# ============================================================

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"

if [ -z "$ROOT" ]; then
  echo "錯誤：目前位置不是 Git 專案。"
  echo "Error: the current directory is not inside a Git repository."
  echo "請先執行 / Run first: cd ~/Desktop/ibridge-astro"
  exit 1
fi

cd "$ROOT"

HEADER_FILE="src/components/Header.astro"
STYLE_FILE="src/styles/header-logo-centering.css"
IMPORT_LINE='import "../styles/header-logo-centering.css";'

if [ ! -f "package.json" ] || [ ! -d "src" ]; then
  echo "錯誤：找不到完整的 Astro 專案。"
  echo "Error: package.json or src directory is missing."
  exit 1
fi

if [ ! -f "$HEADER_FILE" ]; then
  echo "錯誤：找不到 $HEADER_FILE"
  echo "Error: $HEADER_FILE was not found."
  exit 1
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR=".ibridge-backups/header-logo-centering-$STAMP"
mkdir -p "$BACKUP_DIR/src/components" "$BACKUP_DIR/src/styles"

cp "$HEADER_FILE" "$BACKUP_DIR/$HEADER_FILE"
if [ -f "$STYLE_FILE" ]; then
  cp "$STYLE_FILE" "$BACKUP_DIR/$STYLE_FILE"
fi

restore_backup() {
  echo "正在還原原始檔案 / Restoring original files..."
  cp "$BACKUP_DIR/$HEADER_FILE" "$HEADER_FILE"

  if [ -f "$BACKUP_DIR/$STYLE_FILE" ]; then
    cp "$BACKUP_DIR/$STYLE_FILE" "$STYLE_FILE"
  else
    rm -f "$STYLE_FILE"
  fi
}

trap 'echo "執行中發生錯誤 / An error occurred."; restore_backup' ERR

mkdir -p src/styles

# ============================================================
# Dedicated complete stylesheet
# 專用完整樣式檔
# ============================================================
cat > "$STYLE_FILE" <<'CSS_EOF'
/* ==========================================================
   iBridge Education — Header Icon Logo Centering
   iBridge Education — 網站左上角 Icon Logo 置中

   This file only affects the header logo image and the element
   immediately containing it. It does not alter the approved image,
   navigation, homepage hero images, or page content.

   本檔案只修正 Header Logo 圖片及其直接外框，不變更已核准圖片、
   導覽、首頁主視覺或其他頁面內容。
   ========================================================== */

:root {
  /* Keep these at 0px for true mathematical centring.
     如需日後進行極小幅度的視覺微調，只需調整這兩個變數。 */
  --ibridge-logo-optical-x: 0px;
  --ibridge-logo-optical-y: 0px;
}

/* Centre common logo-mark wrappers used by the shared header. */
header :where(
  .brand-mark,
  .brand-icon,
  .logo-mark,
  .logo-icon,
  .site-logo-mark,
  .site-logo-icon,
  .header-logo-mark,
  .header-logo-icon,
  [class*="brand"][class*="mark"],
  [class*="brand"][class*="icon"],
  [class*="logo"][class*="mark"],
  [class*="logo"][class*="icon"]
) {
  display: inline-grid !important;
  place-items: center !important;
  align-content: center !important;
  justify-content: center !important;
  line-height: 0 !important;
  text-align: center !important;
}

/*
   The installer adds .ibridge-header-logo to the actual logo <img>.
   :has() then centres whichever wrapper directly contains that image,
   without relying on the old class name.
*/
header :where(a, div, span, figure, picture):has(> img.ibridge-header-logo),
header :where(a, div, span, figure, picture):has(> picture > img.ibridge-header-logo) {
  display: inline-grid !important;
  place-items: center !important;
  align-content: center !important;
  justify-content: center !important;
  line-height: 0 !important;
  text-align: center !important;
}

/* The image itself is centred inside the available frame. */
header img.ibridge-header-logo {
  display: block !important;
  position: static !important;
  inset: auto !important;
  float: none !important;

  margin-top: auto !important;
  margin-right: auto !important;
  margin-bottom: auto !important;
  margin-left: auto !important;

  padding: 0 !important;
  object-fit: contain !important;
  object-position: 50% 50% !important;
  vertical-align: middle !important;

  translate: var(--ibridge-logo-optical-x) var(--ibridge-logo-optical-y) !important;
  transform: none !important;
  transform-origin: center center !important;

  align-self: center !important;
  justify-self: center !important;
  flex: 0 0 auto !important;
}

/* If the logo is inside a <picture>, centre the picture as well. */
header picture:has(> img.ibridge-header-logo) {
  display: inline-grid !important;
  place-items: center !important;
  line-height: 0 !important;
  margin: 0 auto !important;
}

/* Keep exactly the same centring behaviour on phones and tablets. */
@media (max-width: 900px) {
  header img.ibridge-header-logo {
    margin: auto !important;
    object-position: 50% 50% !important;
    align-self: center !important;
    justify-self: center !important;
  }
}

/* Respect reduced-motion settings and prevent inherited logo movement. */
@media (prefers-reduced-motion: reduce) {
  header img.ibridge-header-logo {
    transition: none !important;
    animation: none !important;
  }
}
CSS_EOF

# ============================================================
# Add one stable class to the real header logo image.
# 將穩定 class 加入真正的 Header Logo 圖片。
# ============================================================
python3 <<'PY'
from pathlib import Path
import re
import sys

path = Path("src/components/Header.astro")
text = path.read_text(encoding="utf-8")
original = text

# Find all img tags. Prefer a tag whose attributes identify it as the
# iBridge logo/icon. If none is explicitly labelled, use the first image
# in Header.astro because a header normally contains the brand image first.
img_pattern = re.compile(r"<img\b[^>]*>", re.IGNORECASE | re.DOTALL)
tags = list(img_pattern.finditer(text))

if not tags:
    print("錯誤：Header.astro 內找不到 <img> 標籤。")
    print("Error: no <img> tag was found in Header.astro.")
    sys.exit(1)

preferred = None
identifier = re.compile(r"ibridge|logo|brand|icon", re.IGNORECASE)
for match in tags:
    if identifier.search(match.group(0)):
        preferred = match
        break

if preferred is None:
    preferred = tags[0]

tag = preferred.group(0)

if "ibridge-header-logo" not in tag:
    class_match = re.search(r"\bclass\s*=\s*([\"'])(.*?)\1", tag, re.IGNORECASE | re.DOTALL)

    if class_match:
        quote = class_match.group(1)
        classes = class_match.group(2).strip()
        new_classes = f"{classes} ibridge-header-logo".strip()
        new_class_attr = f"class={quote}{new_classes}{quote}"
        tag = tag[:class_match.start()] + new_class_attr + tag[class_match.end():]
    else:
        # Insert immediately after <img so it works with static and Astro attributes.
        tag = re.sub(
            r"<img\b",
            '<img class="ibridge-header-logo"',
            tag,
            count=1,
            flags=re.IGNORECASE,
        )

    text = text[:preferred.start()] + tag + text[preferred.end():]

if text != original:
    path.write_text(text, encoding="utf-8")
    print("已標記 Header Logo 圖片 / Header logo image marked.")
else:
    print("Header Logo 已有置中 class / Header logo class already present.")
PY

# ============================================================
# Import the dedicated stylesheet inside Astro frontmatter.
# 在 Astro frontmatter 匯入專用樣式檔。
# ============================================================
python3 <<'PY'
from pathlib import Path
import sys

path = Path("src/components/Header.astro")
text = path.read_text(encoding="utf-8")
import_line = 'import "../styles/header-logo-centering.css";'

if import_line in text:
    print("置中樣式已匯入 / Centering stylesheet already imported.")
    sys.exit(0)

if not text.startswith("---"):
    print("錯誤：Header.astro 缺少 Astro frontmatter。")
    print("Error: Header.astro does not begin with Astro frontmatter.")
    sys.exit(1)

first_line_end = text.find("\n")
if first_line_end == -1:
    print("錯誤：Header.astro 格式不完整。")
    print("Error: Header.astro is incomplete.")
    sys.exit(1)

updated = text[: first_line_end + 1] + import_line + "\n" + text[first_line_end + 1 :]
path.write_text(updated, encoding="utf-8")
print("已匯入置中樣式 / Centering stylesheet imported.")
PY

# Basic checks / 基本檢查
grep -q 'ibridge-header-logo' "$HEADER_FILE"
grep -q 'header-logo-centering.css' "$HEADER_FILE"
grep -q 'place-items: center' "$STYLE_FILE"

# Build validation / 建置驗證
echo "開始執行 Astro 建置檢查 / Starting Astro build validation..."

if npm run | grep -qE '^  check| check'; then
  npm run check
fi

npm run build

# The build succeeded, so disable automatic restoration.
trap - ERR

# Commit and push only when Git detects changes.
if git diff --quiet && git diff --cached --quiet; then
  echo "沒有新的變更需要提交 / No new changes to commit."
else
  git add "$HEADER_FILE" "$STYLE_FILE"
  git commit -m "Center bilingual header icon logo"
  git push origin HEAD
fi

echo ""
echo "============================================================"
echo "完成 / COMPLETE"
echo "============================================================"
echo ""
echo "已修正 / Updated:"
echo "  - 繁中 Header Logo 水平與垂直置中"
echo "  - Traditional Chinese header logo centred horizontally and vertically"
echo "  - 英文 Header Logo 水平與垂直置中"
echo "  - English header logo centred horizontally and vertically"
echo ""
echo "未修改 / Not changed:"
echo "  - Logo 圖檔 / Logo image file"
echo "  - 首頁圖片 / Homepage images"
echo "  - 導覽文字 / Navigation text"
echo "  - Footer"
echo "  - src/styles/global.css"
echo "  - 其他頁面 / Other pages"
echo ""
echo "備份位置 / Backup: $BACKUP_DIR"
echo "Cloudflare Pages 會在 GitHub push 後自動部署。"
echo "Cloudflare Pages will deploy automatically after the GitHub push."
