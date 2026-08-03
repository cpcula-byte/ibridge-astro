#!/usr/bin/env bash
set -Eeuo pipefail

# ============================================================
# iBridge Education — Header Logo Visual Centring Fix
# iBridge Education — 頁首 Logo 視覺置中修正
#
# This installer fixes the artwork inside the logo image,
# not only the position of the <img> element.
# 本程式同時修正圖檔內部圖案與 <img> 元素的置中。
# ============================================================

PROJECT_DIR="${PROJECT_DIR:-$HOME/Desktop/ibridge-astro}"
HEADER_FILE="$PROJECT_DIR/src/components/Header.astro"
STYLE_FILE="$PROJECT_DIR/src/styles/header-logo-centering.css"
LOGO_FILE="$PROJECT_DIR/public/images/brand/ibridge-icon-centered.svg"
BACKUP_ROOT="$PROJECT_DIR/.ibridge-backups"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="$BACKUP_ROOT/logo-visual-centering-$STAMP"

say() {
  printf '%s\n' "$*"
}

fail() {
  printf '\n錯誤 / ERROR: %s\n' "$*" >&2
  exit 1
}

restore_backup() {
  say ""
  say "建置失敗，正在還原 / Build failed; restoring backup..."

  if [[ -f "$BACKUP_DIR/Header.astro" ]]; then
    cp "$BACKUP_DIR/Header.astro" "$HEADER_FILE"
  fi

  if [[ -f "$BACKUP_DIR/header-logo-centering.css" ]]; then
    mkdir -p "$(dirname "$STYLE_FILE")"
    cp "$BACKUP_DIR/header-logo-centering.css" "$STYLE_FILE"
  else
    rm -f "$STYLE_FILE"
  fi

  if [[ -f "$BACKUP_DIR/ibridge-icon-centered.svg" ]]; then
    mkdir -p "$(dirname "$LOGO_FILE")"
    cp "$BACKUP_DIR/ibridge-icon-centered.svg" "$LOGO_FILE"
  else
    rm -f "$LOGO_FILE"
  fi

  say "已還原 / Restored."
}

[[ -d "$PROJECT_DIR" ]] || fail "找不到專案資料夾：$PROJECT_DIR"
[[ -f "$PROJECT_DIR/package.json" ]] || fail "找不到 package.json：$PROJECT_DIR"
[[ -f "$HEADER_FILE" ]] || fail "找不到 Header.astro：$HEADER_FILE"

cd "$PROJECT_DIR"

mkdir -p "$BACKUP_DIR"
cp "$HEADER_FILE" "$BACKUP_DIR/Header.astro"

if [[ -f "$STYLE_FILE" ]]; then
  cp "$STYLE_FILE" "$BACKUP_DIR/header-logo-centering.css"
fi

if [[ -f "$LOGO_FILE" ]]; then
  cp "$LOGO_FILE" "$BACKUP_DIR/ibridge-icon-centered.svg"
fi

mkdir -p "$(dirname "$STYLE_FILE")" "$(dirname "$LOGO_FILE")"

cat > "$LOGO_FILE" <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-labelledby="title desc">
  <title id="title">iBridge Education icon</title>
  <desc id="desc">A centred cream iB monogram and gold open-book symbol on a crimson rounded square.</desc>

  <rect x="16" y="16" width="480" height="480" rx="138" fill="#972B34"/>
  <rect x="76" y="82" width="360" height="350" rx="92" fill="#841E2C"/>

  <text
    x="256"
    y="298"
    text-anchor="middle"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="194"
    font-weight="700"
    letter-spacing="-12"
    fill="#FDF7E1"
  >iB</text>

  <g fill="none" stroke="#C99A2E" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
    <path d="M164 348 C198 334 225 337 256 358 C287 337 314 334 348 348"/>
    <path d="M164 348 L164 367 C198 352 225 355 256 376"/>
    <path d="M348 348 L348 367 C314 352 287 355 256 376"/>
    <path d="M256 358 L256 376"/>
  </g>
</svg>
SVG

cat > "$STYLE_FILE" <<'CSS'
/*
 * iBridge Education — header logo visual centring
 * 繁中與英文網站共用 / Shared by Traditional Chinese and English routes
 */

:root {
  --ibridge-header-logo-size: 88px;
}

header :where(a, div, span, figure, picture):has(> img.site-brand-logo) {
  display: grid !important;
  place-items: center !important;
  align-content: center !important;
  justify-content: center !important;
  flex: 0 0 auto !important;
  line-height: 0 !important;
  text-align: center !important;
  margin-block: 0 !important;
  padding-block: 0 !important;
}

header img.site-brand-logo {
  display: block !important;
  position: static !important;
  inset: auto !important;
  float: none !important;

  width: var(--ibridge-header-logo-size) !important;
  height: var(--ibridge-header-logo-size) !important;
  min-width: var(--ibridge-header-logo-size) !important;
  min-height: var(--ibridge-header-logo-size) !important;
  max-width: var(--ibridge-header-logo-size) !important;
  max-height: var(--ibridge-header-logo-size) !important;

  margin: 0 auto !important;
  padding: 0 !important;
  border: 0 !important;

  object-fit: contain !important;
  object-position: 50% 50% !important;
  vertical-align: middle !important;

  align-self: center !important;
  justify-self: center !important;

  translate: none !important;
  transform: none !important;
  transform-origin: 50% 50% !important;
}

header :where(a, div, span):has(img.site-brand-logo) {
  align-items: center !important;
}

@media (max-width: 900px) {
  :root {
    --ibridge-header-logo-size: 76px;
  }
}

@media (max-width: 640px) {
  :root {
    --ibridge-header-logo-size: 68px;
  }
}

@media (prefers-reduced-motion: reduce) {
  header img.site-brand-logo {
    transition: none !important;
    animation: none !important;
  }
}
CSS

python3 - "$HEADER_FILE" <<'PY'
from pathlib import Path
import re
import sys

header_path = Path(sys.argv[1])
text = header_path.read_text(encoding="utf-8")

IMPORT_LINE = 'import "../styles/header-logo-centering.css";'
NEW_SRC = '/images/brand/ibridge-icon-centered.svg?v=20260801-visual-center-1'

# Remove older duplicate imports, regardless of quote style or semicolon.
text = re.sub(
    r'^[ \t]*import[ \t]+[\'"][^\'"]*header-logo-centering\.css[\'"];?[ \t]*\n?',
    '',
    text,
    flags=re.MULTILINE,
)

# Add the stylesheet to Astro frontmatter.
frontmatter = re.match(r'^\s*---\s*\n', text)
if not frontmatter:
    raise SystemExit("Header.astro 沒有有效的 Astro frontmatter / Missing Astro frontmatter.")

insert_at = frontmatter.end()
text = text[:insert_at] + IMPORT_LINE + "\n" + text[insert_at:]

# Find all normal img tags.
matches = list(re.finditer(r'<img\b[^>]*>', text, flags=re.IGNORECASE | re.DOTALL))
if not matches:
    raise SystemExit("Header.astro 中找不到 <img> / No <img> found in Header.astro.")

def score(tag: str) -> int:
    t = tag.lower()
    value = 0
    for word, weight in (
        ("logo", 20),
        ("brand", 16),
        ("ibridge", 14),
        ("icon", 10),
        ("header", 6),
    ):
        if word in t:
            value += weight
    if "hero" in t:
        value -= 30
    return value

selected = max(matches, key=lambda m: score(m.group(0)))
tag = selected.group(0)

# The Header component normally contains only the brand image. Refuse to
# continue when every candidate looks unrelated, to avoid touching a hero.
if score(tag) < 1 and len(matches) > 1:
    raise SystemExit(
        "無法安全判斷哪一張是 Logo；未修改 Header / "
        "Could not safely identify the logo; Header was not modified."
    )

def add_attribute(tag_text: str, attribute: str) -> str:
    """Insert an HTML attribute before > or /> without breaking self-closing tags."""
    self_closing = bool(re.search(r'/\s*>\s*$', tag_text))
    body = re.sub(r'\s*/?>\s*$', '', tag_text)
    ending = ' />' if self_closing else '>'
    return f'{body} {attribute}{ending}'

# Replace src. Handles quoted HTML src values and common Astro expressions.
if re.search(r'\bsrc\s*=', tag, flags=re.IGNORECASE):
    tag = re.sub(
        r'\bsrc\s*=\s*(?:["\'][^"\']*["\']|\{[^{}]*\})',
        f'src="{NEW_SRC}"',
        tag,
        count=1,
        flags=re.IGNORECASE | re.DOTALL,
    )
else:
    tag = add_attribute(tag, f'src="{NEW_SRC}"')

# Add or extend class.
class_match = re.search(r'\bclass\s*=\s*(["\'])(.*?)\1', tag, flags=re.IGNORECASE | re.DOTALL)
if class_match:
    classes = class_match.group(2).split()
    if "site-brand-logo" not in classes:
        classes.append("site-brand-logo")
    replacement = f'class={class_match.group(1)}{" ".join(classes)}{class_match.group(1)}'
    tag = tag[:class_match.start()] + replacement + tag[class_match.end():]
else:
    tag = add_attribute(tag, 'class="site-brand-logo"')

# Add explicit intrinsic dimensions when absent.
if not re.search(r'\bwidth\s*=', tag, flags=re.IGNORECASE):
    tag = add_attribute(tag, 'width="88"')
if not re.search(r'\bheight\s*=', tag, flags=re.IGNORECASE):
    tag = add_attribute(tag, 'height="88"')

# Add a stable diagnostic marker.
if not re.search(r'\bdata-ibridge-logo\s*=', tag, flags=re.IGNORECASE):
    tag = add_attribute(tag, 'data-ibridge-logo="visual-centred"')

text = text[:selected.start()] + tag + text[selected.end():]
header_path.write_text(text, encoding="utf-8")

print("Updated:", header_path)
print("Logo tag:", tag)
PY

say ""
say "正在檢查修改 / Checking changes..."

grep -q 'site-brand-logo' "$HEADER_FILE" \
  || { restore_backup; fail "Header 未加入 site-brand-logo class"; }

grep -q 'ibridge-icon-centered.svg' "$HEADER_FILE" \
  || { restore_backup; fail "Header 未使用新的置中 Logo"; }

grep -q 'header-logo-centering.css' "$HEADER_FILE" \
  || { restore_backup; fail "Header 未匯入置中 CSS"; }

if npm run 2>/dev/null | grep -qE '(^|[[:space:]])check($|[[:space:]])'; then
  say ""
  say "執行 Astro check..."
  if ! npm run check; then
    restore_backup
    fail "npm run check 失敗"
  fi
fi

say ""
say "執行 production build..."
if ! npm run build; then
  restore_backup
  fail "npm run build 失敗"
fi

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git add "$HEADER_FILE" "$STYLE_FILE" "$LOGO_FILE"

  if ! git diff --cached --quiet; then
    git commit -m "Fix header logo visual centring"

    if git remote get-url origin >/dev/null 2>&1; then
      git push origin HEAD
    fi
  else
    say "沒有新的 Git 變更 / No new Git changes."
  fi
fi

say ""
say "============================================================"
say "完成 / COMPLETE"
say "============================================================"
say "已修正 / Updated:"
say "  $HEADER_FILE"
say "  $STYLE_FILE"
say "  $LOGO_FILE"
say ""
say "繁中 / Traditional Chinese:"
say "  https://ibridge.info/"
say "英文 / English:"
say "  https://ibridge.info/en/"
say ""
say "Safari 強制重新整理 / Hard refresh:"
say "  Command + Shift + R"
