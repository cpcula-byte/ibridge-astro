#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# iBridge Education
# 保留原本 Header 樣式，只替換紅框內的 iB 圖示
# ============================================================

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"

if [[ -z "$ROOT" ]]; then
  echo "錯誤：目前不在 Git 專案中。"
  exit 1
fi

cd "$ROOT"

GOOD_COMMIT="3308b8d"
LAYOUT_FILE="src/layouts/BaseLayout.astro"
GLOBAL_CSS="src/styles/global.css"
PNG_LOGO="public/images/brand/ibridge-header-logo.png"
WEBP_LOGO="public/images/brand/ibridge-header-logo.webp"

for required in \
  "$LAYOUT_FILE" \
  "$GLOBAL_CSS" \
  "$PNG_LOGO" \
  "$WEBP_LOGO"
do
  if [[ ! -s "$required" ]]; then
    echo "錯誤：找不到檔案或檔案為空：$required"
    exit 1
  fi
done

if ! git cat-file -e "${GOOD_COMMIT}^{commit}" 2>/dev/null; then
  echo "錯誤：找不到正常版本 commit：$GOOD_COMMIT"
  exit 1
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR=".ibridge-backups/safe-header-logo-$STAMP"

mkdir -p \
  "$BACKUP_DIR/src/layouts" \
  "$BACKUP_DIR/src/styles"

cp "$LAYOUT_FILE" "$BACKUP_DIR/src/layouts/BaseLayout.astro"
cp "$GLOBAL_CSS" "$BACKUP_DIR/src/styles/global.css"

echo "備份完成：$BACKUP_DIR"

# ------------------------------------------------------------
# 恢復修改 Logo 前的正常版型及完整 CSS
# ------------------------------------------------------------

git restore \
  --source="$GOOD_COMMIT" \
  -- "$LAYOUT_FILE" "$GLOBAL_CSS"

echo "已恢復正常版本："
echo "- $LAYOUT_FILE"
echo "- $GLOBAL_CSS"

# ------------------------------------------------------------
# 只替換品牌紅框中的 iB 文字
# 保留原本 class、尺寸、導覽列與所有網站樣式
# ------------------------------------------------------------

python3 <<'PY'
from pathlib import Path
import re
import sys

path = Path("src/layouts/BaseLayout.astro")
content = path.read_text(encoding="utf-8")

brand_anchor_pattern = re.compile(
    r'(<a\b[^>]*class=["\'][^"\']*\bbrand\b[^"\']*["\'][^>]*>)'
    r'(.*?)'
    r'(</a>)',
    re.IGNORECASE | re.DOTALL,
)

anchor_match = brand_anchor_pattern.search(content)

if not anchor_match:
    print("錯誤：找不到 BaseLayout.astro 中的品牌連結 <a class=\"brand\">。")
    sys.exit(1)

brand_content = anchor_match.group(2)

old_mark_pattern = re.compile(
    r'(<span\b[^>]*>)\s*iB\s*(</span>)',
    re.IGNORECASE | re.DOTALL,
)

old_mark_match = old_mark_pattern.search(brand_content)

if not old_mark_match:
    print("錯誤：在品牌連結中找不到原本的 iB 紅框圖示。")
    print("為避免修改錯誤位置，程式已停止。")
    sys.exit(1)

new_logo_content = r'''<picture
          style="display:block;width:100%;height:100%;"
        >
          <source
            srcset="/images/brand/ibridge-header-logo.webp?v=20260801-logo-03"
            type="image/webp"
          />
          <img
            src="/images/brand/ibridge-header-logo.png?v=20260801-logo-03"
            alt=""
            width="512"
            height="512"
            loading="eager"
            decoding="async"
            style="display:block;width:100%;height:100%;object-fit:contain;object-position:center;"
          />
        </picture>'''

updated_brand_content = old_mark_pattern.sub(
    lambda match: (
        match.group(1)
        + "\n        "
        + new_logo_content
        + "\n      "
        + match.group(2)
    ),
    brand_content,
    count=1,
)

updated_content = (
    content[:anchor_match.start()]
    + anchor_match.group(1)
    + updated_brand_content
    + anchor_match.group(3)
    + content[anchor_match.end():]
)

path.write_text(updated_content, encoding="utf-8")

print("已安全替換 BaseLayout.astro 中的左上角 Logo。")
print("原本的 span class、Header 尺寸及導覽列結構均已保留。")
PY

echo ""
echo "確認 BaseLayout 使用新 Logo："

grep -n -A 18 -B 5 \
  "ibridge-header-logo" \
  "$LAYOUT_FILE"

echo ""
echo "確認不再使用容易破壞樣式的 class："

if grep -q 'class="ibridge-active-logo"' "$LAYOUT_FILE"; then
  echo "錯誤：BaseLayout 中仍存在 ibridge-active-logo。"
  exit 1
else
  echo "正常：已保留網站原本的 Logo class。"
fi

echo ""
echo "執行網站檢查……"
npm run check

echo ""
echo "執行正式建置……"
npm run build

echo ""
echo "檢視本次實際修改："
git diff --stat
git diff -- "$LAYOUT_FILE" "$GLOBAL_CSS"

echo ""
echo "=================================================="
echo "修正完成：網站原本樣式已保留，新 Logo 已放入原紅框位置。"
echo "繁中與英文頁面共用相同 Logo。"
echo "備份位置：$BACKUP_DIR"
echo "=================================================="
