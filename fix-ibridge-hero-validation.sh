#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# iBridge Education
# 修正首頁圖片路徑、Resource Library CSS 與 sitemap
# ============================================================

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"

if [[ -z "$ROOT" ]]; then
  echo "錯誤：目前不在 Git 專案中。"
  exit 1
fi

cd "$ROOT"

if [[ ! -f "package.json" || ! -d "src/pages" || ! -d "public" ]]; then
  echo "錯誤：目前位置不是 iBridge Astro 專案。"
  exit 1
fi

ZH_PAGE="src/pages/index.astro"
EN_PAGE="src/pages/en/index.astro"
IMAGE_DIR="public/images/home"
RESOURCE_CSS="public/styles/ibridge-resource-library.css"
SITEMAP="public/sitemap.xml"

NEW_ZH_PNG="$IMAGE_DIR/hero-zh-2026-08.png"
NEW_EN_PNG="$IMAGE_DIR/hero-en-2026-08.png"
NEW_ZH_WEBP="$IMAGE_DIR/hero-zh-2026-08.webp"
NEW_EN_WEBP="$IMAGE_DIR/hero-en-2026-08.webp"

APPROVED_ZH_PNG="$IMAGE_DIR/hero-zh-2026.png"
APPROVED_EN_PNG="$IMAGE_DIR/hero-en-2026.png"
APPROVED_ZH_WEBP="$IMAGE_DIR/hero-zh-2026.webp"
APPROVED_EN_WEBP="$IMAGE_DIR/hero-en-2026.webp"

for required in \
  "$ZH_PAGE" \
  "$EN_PAGE" \
  "$NEW_ZH_PNG" \
  "$NEW_EN_PNG" \
  "$NEW_ZH_WEBP" \
  "$NEW_EN_WEBP"
do
  if [[ ! -f "$required" ]]; then
    echo "錯誤：找不到必要檔案：$required"
    echo "請勿繼續部署。"
    exit 1
  fi
done

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR=".ibridge-backups/hero-validation-fix-$STAMP"

mkdir -p \
  "$BACKUP_DIR/src/pages/en" \
  "$BACKUP_DIR/public/images/home" \
  "$BACKUP_DIR/public/styles" \
  "$IMAGE_DIR" \
  "public/styles"

cp "$ZH_PAGE" "$BACKUP_DIR/src/pages/index.astro"
cp "$EN_PAGE" "$BACKUP_DIR/src/pages/en/index.astro"

for file in \
  "$RESOURCE_CSS" \
  "$SITEMAP" \
  "$APPROVED_ZH_PNG" \
  "$APPROVED_EN_PNG" \
  "$APPROVED_ZH_WEBP" \
  "$APPROVED_EN_WEBP"
do
  if [[ -f "$file" ]]; then
    mkdir -p "$BACKUP_DIR/$(dirname "$file")"
    cp "$file" "$BACKUP_DIR/$file"
  fi
done

echo "備份完成：$BACKUP_DIR"

# ------------------------------------------------------------
# 保留新圖片內容，但改用網站檢查程式核准的檔名
# ------------------------------------------------------------

cp "$NEW_ZH_PNG"  "$APPROVED_ZH_PNG"
cp "$NEW_EN_PNG"  "$APPROVED_EN_PNG"
cp "$NEW_ZH_WEBP" "$APPROVED_ZH_WEBP"
cp "$NEW_EN_WEBP" "$APPROVED_EN_WEBP"

echo "已建立核准檔名的繁中及英文圖片。"

# ------------------------------------------------------------
# 更新繁中及英文首頁
# ------------------------------------------------------------

python3 <<'PY'
from pathlib import Path
import re

CACHE_KEY = "20260729-approved-01"

pages = [
    {
        "path": Path("src/pages/index.astro"),
        "webp": f"/images/home/hero-zh-2026.webp?v={CACHE_KEY}",
        "png": f"/images/home/hero-zh-2026.png?v={CACHE_KEY}",
        "alt": "iBridge Education：連結學習，啟發未來。",
    },
    {
        "path": Path("src/pages/en/index.astro"),
        "webp": f"/images/home/hero-en-2026.webp?v={CACHE_KEY}",
        "png": f"/images/home/hero-en-2026.png?v={CACHE_KEY}",
        "alt": "iBridge Education: Connecting Learning, Inspiring Futures.",
    },
]

pattern = re.compile(
    r'^[ \t]*<picture\s+class=["\']visual-hero-picture["\']>.*?</picture>',
    re.MULTILINE | re.DOTALL,
)

for item in pages:
    path = item["path"]

    content = path.read_text(encoding="utf-8")

    replacement = f'''      <picture class="visual-hero-picture">
        <source
          srcset="{item["webp"]}"
          type="image/webp"
        />
        <img
          src="{item["png"]}"
          alt="{item["alt"]}"
          width="1672"
          height="941"
          loading="eager"
          fetchpriority="high"
          decoding="async"
        />
      </picture>'''

    updated, count = pattern.subn(replacement, content, count=1)

    if count != 1:
        raise SystemExit(
            f"錯誤：無法在 {path} 找到唯一的 visual-hero-picture 區塊。"
        )

    path.write_text(updated, encoding="utf-8")
    print(f"已更新：{path}")
PY

# ------------------------------------------------------------
# 恢復 Resource Library CSS
# ------------------------------------------------------------

restore_from_git() {
  local file="$1"

  if [[ -s "$file" ]]; then
    echo "檔案已存在：$file"
    return 0
  fi

  if git cat-file -e "HEAD:$file" 2>/dev/null; then
    mkdir -p "$(dirname "$file")"
    git show "HEAD:$file" > "$file"
    echo "已從 Git 恢復：$file"
    return 0
  fi

  return 1
}

if ! restore_from_git "$RESOURCE_CSS"; then
  echo ""
  echo "錯誤：無法恢復 $RESOURCE_CSS"
  echo "這個檔案不在目前 Git HEAD 中。"
  echo "為避免破壞教育資源頁，本程式不會建立空白 CSS。"
  exit 1
fi

# ------------------------------------------------------------
# 恢復 sitemap.xml
# ------------------------------------------------------------

if ! restore_from_git "$SITEMAP"; then
  cat > "$SITEMAP" <<'XML'
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://ibridge.info/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>

  <url>
    <loc>https://ibridge.info/en/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>

  <url>
    <loc>https://ibridge.info/about/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>https://ibridge.info/en/about/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>https://ibridge.info/services/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>https://ibridge.info/en/services/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>https://ibridge.info/programmes/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>https://ibridge.info/en/programmes/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>https://ibridge.info/research/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <url>
    <loc>https://ibridge.info/en/research/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <url>
    <loc>https://ibridge.info/resources/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <url>
    <loc>https://ibridge.info/en/resources/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <url>
    <loc>https://ibridge.info/contact/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>

  <url>
    <loc>https://ibridge.info/en/contact/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>
XML

  echo "已重新建立：$SITEMAP"
fi

echo ""
echo "目前首頁圖片網址："

grep -nE \
  'hero-(zh|en)-2026\.(png|webp)' \
  "$ZH_PAGE" \
  "$EN_PAGE"

echo ""
echo "執行網站靜態檢查……"
npm run check

echo ""
echo "執行正式建置……"
npm run build

echo ""
echo "============================================"
echo "修正完成，網站檢查與建置均已通過。"
echo "備份位置：$BACKUP_DIR"
echo "============================================"
echo ""
echo "下一步部署指令："
echo ""
echo "git add src/pages/index.astro \\"
echo "  src/pages/en/index.astro \\"
echo "  public/images/home/hero-zh-2026.png \\"
echo "  public/images/home/hero-en-2026.png \\"
echo "  public/images/home/hero-zh-2026.webp \\"
echo "  public/images/home/hero-en-2026.webp \\"
echo "  public/styles/ibridge-resource-library.css \\"
echo "  public/sitemap.xml"
echo ""
echo 'git commit -m "Replace bilingual homepage hero images"'
echo "git push"
