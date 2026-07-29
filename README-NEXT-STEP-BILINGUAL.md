# iBridge Education — 核准首頁圖片完整修正版
# iBridge Education — Approved Homepage Images Complete Fix

## 繁體中文

本專案已直接包含使用者核准的兩張首頁圖片：

- `public/images/home/hero-zh-2026.png`：繁體中文首頁
- `public/images/home/hero-en-2026.png`：英文首頁

首頁使用的固定路徑：

- 繁中：`/images/home/hero-zh-2026.png?v=20260729-approved-01`
- 英文：`/images/home/hero-en-2026.png?v=20260729-approved-01`

圖片實際尺寸為 `1672 × 941`。CSS 使用相同長寬比，不會再把圖片上下或左右裁切。

### 覆蓋專案

將本資料夾內的所有檔案複製到：

```text
~/Desktop/ibridge-astro
```

Finder 詢問時，對同名資料夾使用「合併」，對同名檔案使用「取代」。

### Terminal 指令

```bash
cd ~/Desktop/ibridge-astro

npm run check
npm run build

git add .
git commit -m "Use approved bilingual homepage images"
git push
```

Cloudflare Pages 完成部署後，清除一次快取：

```text
Cloudflare → Caching → Configuration → Purge Everything
```

最後檢查：

- `https://ibridge.info/`
- `https://ibridge.info/en/`

---

## English

This project directly includes the two approved homepage images:

- `public/images/home/hero-zh-2026.png`: Traditional Chinese homepage
- `public/images/home/hero-en-2026.png`: English homepage

Fixed homepage paths:

- Traditional Chinese: `/images/home/hero-zh-2026.png?v=20260729-approved-01`
- English: `/images/home/hero-en-2026.png?v=20260729-approved-01`

The actual image size is `1672 × 941`. The CSS uses the same aspect ratio, preventing unintended cropping.

### Replace the project files

Copy every file from this folder into:

```text
~/Desktop/ibridge-astro
```

When Finder asks, choose **Merge** for folders and **Replace** for files with the same names.

### Terminal commands

```bash
cd ~/Desktop/ibridge-astro

npm run check
npm run build

git add .
git commit -m "Use approved bilingual homepage images"
git push
```

After Cloudflare Pages finishes deployment, purge the cache once:

```text
Cloudflare → Caching → Configuration → Purge Everything
```

Check both pages:

- `https://ibridge.info/`
- `https://ibridge.info/en/`
