#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# iBridge Education
# 從正常備份恢復網站樣式，只更換左上角紅框內的 Logo
# ============================================================

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"

if [[ -z "$ROOT" ]]; then
  echo "錯誤：目前不在 Git 專案中。"
  exit 1
fi

cd "$ROOT"

LAYOUT_FILE="src/layouts/BaseLayout.astro"
GLOBAL_CSS="src/styles/global.css"

PNG_LOGO="public/images/brand/ibridge-header-logo.png"
WEBP_LOGO="public/images/brand/ibridge-header-logo.webp"

# 尋找前一次修改前建立的正常備份
SOURCE_BACKUP="$(
  ls -dt .ibridge-backups/active-header-logo-* 2>/dev/null |
  head -n 1 || true
)"

if [[ -z "$SOURCE_BACKUP" ]]; then
  echo "錯誤：找不到 active-header-logo 正常備份。"
  exit 1
fi

BACKUP_LAYOUT="$SOURCE_BACKUP/src/layouts/BaseLayout.astro"
BACKUP_CSS="$SOURCE_BACKUP/src/styles/global.css"

for required in \
  "$LAYOUT_FILE" \
  "$GLOBAL_CSS" \
  "$PNG_LOGO" \
  "$WEBP_LOGO" \
  "$BACKUP_LAYOUT" \
  "$BACKUP_CSS"
do
  if [[ ! -s "$required" ]]; then
    echo "錯誤：找不到檔案或檔案為空：$required"
    exit 1
  fi
done

STAMP="$(date +%Y%m%d-%H%M%S)"
SAFETY_BACKUP=".ibridge-backups/final-header-logo-fix-$STAMP"

mkdir -p \
  "$SAFETY_BACKUP/src/layouts" \
  "$SAFETY_BACKUP/src/styles"

cp "$LAYOUT_FILE" \
  "$SAFETY_BACKUP/src/layouts/BaseLayout.astro"

cp "$GLOBAL_CSS" \
  "$SAFETY_BACKUP/src/styles/global.css"

echo "目前版本已備份至：$SAFETY_BACKUP"
echo "使用正常備份：$SOURCE_BACKUP"

# ------------------------------------------------------------
# 先完整恢復修改 Logo 前的 BaseLayout 與 global.css
# ------------------------------------------------------------

cp "$BACKUP_LAYOUT" "$LAYOUT_FILE"
cp "$BACKUP_CSS" "$GLOBAL_CSS"

echo "已恢復正常網站版型與 CSS。"

# ------------------------------------------------------------
# 只替換原品牌連結內的 iB 文字
# 保留原 span class、Header、導覽列與全部 CSS
# ------------------------------------------------------------

python3 <<'PY'
from pathlib import Path
import re
import sys

layout_path = Path("src/layouts/BaseLayout.astro")
content = layout_path.read_text(encoding="utf-8")

brand_anchor_pattern = re.compile(
    r'(<a\b[^>]*class=["\'][^"\']*\bbrand\b[^"\']*["\'][^>]*>)'
    r'(.*?)'
    r'(</a>)',
    re.IGNORECASE | re.DOTALL,
)

brand_match = brand_anchor_pattern.search(content)

if not brand_match:
    print('錯誤：找不到 <a class="brand"> 品牌連結。')
    sys.exit(1)

brand_inner = brand_match.group(2)

old_logo_pattern = re.compile(
    r'(<span\b[^>]*>)\s*iB\s*(</span>)',
    re.IGNORECASE | re.DOTALL,
)

old_logo_match = old_logo_pattern.search(brand_inner)

if not old_logo_match:
    print("錯誤：在品牌連結中找不到原本的 iB 文字圖示。")
    print("為避免誤改其他內容，程式已停止。")
    sys.exit(1)

picture_markup = r'''<picture
          style="display:block;width:100%;height:100%;"
        >
          <source
            srcset="/images/brand/ibridge-header-logo.webp?v=20260801-final-logo-01"
            type="image/webp"
          />
          <img
            src="/images/brand/ibridge-header-logo.png?v=20260801-final-logo-01"
            alt=""
            width="512"
            height="512"
            loading="eager"
            decoding="async"
            style="display:block;width:100%;height:100%;object-fit:cover;object-position:center;border-radius:inherit;"
          />
        </picture>'''

new_brand_inner = old_logo_pattern.sub(
    lambda match: (
        match.group(1)
        + "\n        "
        + picture_markup
        + "\n      "
        + match.group(2)
    ),
    brand_inner,
    count=1,
)

updated = (
    content[:brand_match.start()]
    + brand_match.group(1)
    + new_brand_inner
    + brand_match.group(3)
    + content[brand_match.end():]
)

layout_path.write_text(updated, encoding="utf-8")

print("已替換左上角紅框內的 iB 圖示。")
print("原本的 span class 與 Header 結構均已保留。")
PY

echo ""
echo "確認 BaseLayout 中的新 Logo："

grep -n -A 18 -B 5 \
  "ibridge-header-logo" \
  "$LAYOUT_FILE"

echo ""
echo "確認沒有殘留錯誤 class："

if grep -q 'class="ibridge-active-logo"' "$LAYOUT_FILE"; then
  echo "錯誤：仍存在 ibridge-active-logo，停止建置。"
  exit 1
else
  echo "正常：未使用 ibridge-active-logo。"
fi

echo ""
echo "檢查程式碼格式……"
git diff --check

echo ""
echo "執行網站靜態檢查……"
npm run check

echo ""
echo "執行正式建置……"
npm run build

echo ""
echo "本次修改內容："
git diff --stat

echo ""
echo "=================================================="
echo "完成：網站原樣式已恢復，新 Logo 已放入原紅框位置。"
echo "繁中與英文頁面會共用相同的新 Logo。"
echo "安全備份：$SAFETY_BACKUP"
echo "=================================================="
