# 修正內容 / Changes

## 繁體中文

1. 將使用者提供並核准的繁中圖片加入：
   `public/images/home/hero-zh-2026.png`
2. 將使用者提供並核准的英文圖片加入：
   `public/images/home/hero-en-2026.png`
3. 繁中首頁只載入繁中圖片；英文首頁只載入英文圖片。
4. 圖片路徑加入新版本參數 `20260729-approved-01`，避免瀏覽器或 Cloudflare 顯示舊圖片。
5. HTML 圖片尺寸改為正確的 `1672 × 941`。
6. CSS 長寬比改為 `1672 / 941`，完整顯示圖片而不裁切。
7. 保留全站高對比文字設定：主要文字 `#18212B`、次要文字 `#34414D`、一般字重 `400`。
8. 靜態檢查程式會確認兩張圖片確實存在，並確認首頁使用正確路徑。

## English

1. Added the approved Traditional Chinese image at:
   `public/images/home/hero-zh-2026.png`
2. Added the approved English image at:
   `public/images/home/hero-en-2026.png`
3. The Traditional Chinese homepage loads only the Chinese image; the English homepage loads only the English image.
4. Added the new cache version `20260729-approved-01` to prevent browsers or Cloudflare from displaying an older image.
5. Updated the HTML image dimensions to the correct `1672 × 941`.
6. Updated the CSS aspect ratio to `1672 / 941`, displaying the complete image without cropping.
7. Retained the high-contrast site typography: primary text `#18212B`, secondary text `#34414D`, and normal font weight `400`.
8. The static validation script confirms that both image files exist and that each homepage uses the correct path.
