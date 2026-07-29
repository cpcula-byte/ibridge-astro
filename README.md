# iBridge Education — Approved Bilingual Hero Images — 2026-07-29 Complete Bilingual Fix

## 繁體中文

這個資料夾是一套可直接取代現有 Astro 網站的完整雙語版本，修正兩個主要問題：

1. **首頁仍顯示舊圖片**：首頁改用全新檔名 `hero-20260729-v3.svg`，不覆蓋舊圖片，因此瀏覽器與 Cloudflare 不會把舊檔誤認為新檔。
2. **部分文字顏色太淺**：內文改為 400 字重，主要文字使用 `#202833`，次要文字使用 `#44515F`；深色區塊使用白色與 `#FFF3DF`。

### 主要檔案

- `src/pages/`：繁中頁面
- `src/pages/en/`：英文頁面
- `src/styles/global.css`：全站配色、字體、響應式與無障礙設定
- `public/images/home/hero-20260729-v3.svg`：新版首頁插圖
- `public/_headers`：Cloudflare Pages 快取與安全標頭
- `public/sitemap.xml`：網站地圖

### 安裝與本機檢查

```bash
npm install
npm run check
npm run build
npm run preview
```

### 部署至 Cloudflare Pages

- Build command：`npm run build`
- Build output directory：`dist`
- Node.js：建議 20 或更新版本

將本資料夾內容提交至目前連接 Cloudflare Pages 的 GitHub repository。部署完成後，只需要在 Cloudflare 執行一次 **Purge Everything**，讓 HTML 立即更新。新版 SVG 已使用新檔名，之後可長期快取。

### 部署後檢查

1. 開啟繁中首頁與英文首頁。
2. 確認圖片網址包含：`hero-20260729-v3.svg?v=20260729-1`
3. 在無痕視窗與手機重新測試。
4. 確認繁中與英文導覽、聯絡頁與政策頁可開啟。
5. 檢查 Cloudflare 最新 deployment 對應正確的 Git commit。

### 注意

本套件刻意不包含任何自訂字型檔，改用系統字型堆疊，避免缺字、載入失敗、授權與文字過細問題。

---

## English

This folder is a complete bilingual Astro replacement that addresses two primary issues:

1. **The homepage still displays the previous image**: the homepage now uses the new filename `hero-20260729-v3.svg`. It does not overwrite the earlier asset, preventing browsers and Cloudflare from treating old and new files as the same resource.
2. **Some text is too light**: body copy now uses weight 400, with `#202833` for primary text and `#44515F` for secondary text. Dark sections use white and `#FFF3DF`.

### Main files

- `src/pages/`: Traditional Chinese pages
- `src/pages/en/`: English pages
- `src/styles/global.css`: site-wide colour, typography, responsive and accessibility rules
- `public/images/home/hero-20260729-v3.svg`: replacement homepage artwork
- `public/_headers`: Cloudflare Pages cache and security headers
- `public/sitemap.xml`: sitemap

### Install and verify locally

```bash
npm install
npm run check
npm run build
npm run preview
```

### Deploy to Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `dist`
- Node.js: version 20 or later is recommended

Commit this folder to the GitHub repository connected to Cloudflare Pages. After deployment, run **Purge Everything** once so the updated HTML is retrieved immediately. The versioned SVG can then remain under long-term immutable caching.

### Post-deployment checks

1. Open the Traditional Chinese and English homepages.
2. Confirm the image URL contains `hero-20260729-v3.svg?v=20260729-1`.
3. Retest in a private window and on a phone.
4. Confirm both language routes, contact pages and policy pages open correctly.
5. Confirm the latest Cloudflare deployment corresponds to the correct Git commit.

### Note

No custom font files are included. The site uses a system font stack to avoid missing glyphs, failed font loading, licensing issues and excessively thin text.
