# 遊點易思

旅遊團務管理平台 — 結合電子圍籬定位、即時 GPS 點名與 24 小時 AI 隨行助理，讓領隊、團員與家長在旅程的每個階段都能即時掌握狀況。

**Live**: <https://fir-travel-51872.web.app>

## 功能總覽

### 旅程前

- 建立團體、上傳行程與公告，自動產生團員加入 QR Code
- **AI 智慧一鍵排程**：依目的地、天數、風格自動生成完整行程表（Gemini）
- **AI 行前風險評估**：天氣 / 景點人潮 / 團費成本預估（Gemini）

### 旅程中

- 電子圍籬智慧定位：團員即時回報位置，系統自動判斷是否脫離安全範圍
- GPS 快速點名，導遊後台即時看到到齊進度
- 導遊即時公告發布，支援 **AI 草擬**（把零散重點轉成正式公告）
- **AI 突發狀況動態調程**：臨時狀況發生時，一鍵生成應變行程 + 緊急公告草稿
- **AI 多模態景點導覽**：拍照辨識景點，生成語音導覽稿、冷知識與拍照建議
- **24 小時 AI 隨行小幫手**：根據團務即時資料（行程、公告、集合點）回答團員問題
- 團體照片牆，即時共享旅程瞬間
- **家長專屬視角**：加入時選擇要關注的團員（孩子），即時查看孩子的位置與安全狀態
- 導遊後台**即時位置監控**：地圖 + 列表檢視全團即時位置與是否脫離安全區域

### 旅程後

- **AI 一鍵生成回顧影片**：結合團體照片與 AI 回憶錄文字，瀏覽器端即時合成可下載的回顧影片
- 導遊滿意度回饋（星等 + 留言），後台自動彙整平均分數
- 推播新行程通知給團員與家長

## 技術架構

- **前端**：React 19 + Vite + Tailwind CSS，部署於 Firebase Hosting
- **後端**：Firebase Cloud Functions（Node.js 22, 2nd Gen），封裝所有 Gemini AI 呼叫，`GEMINI_API_KEY` 存於 Secret Manager，不外流至前端
- **資料庫**：Cloud Firestore（無 Firebase Auth，`admin_token` 由前端比對，僅適合展示 / 內部使用場景，非正式產品等級的存取控制）
- **地圖**：Google Maps JavaScript API（`@vis.gl/react-google-maps`）
- **AI**：Google Gemini API（`@google/genai`），涵蓋文字生成、多模態（圖片輸入）、結構化 JSON 輸出
- **CI/CD**：GitHub Actions 在推送到 `main` 時自動建置並部署 Hosting + Functions + Firestore Rules（見 `.github/workflows/deploy.yml`）

## 本機開發

```bash
npm install
cp .env.example .env   # 填入 VITE_GOOGLE_MAPS_API_KEY
npm run dev
```

`vite.config.js` 已設定 `/api/gemini` 的開發代理，直接轉發到已部署的 Cloud Function，因此本機開發不需要另外跑 emulator，但也代表本機測試會實際呼叫正式環境的 Firestore 與 Gemini 額度。

## 部署

```bash
npm run build
firebase deploy --only hosting,functions,firestore:rules --project <your-project-id>
```

正常情況下不需要手動部署——推送到 `main` 分支會透過 GitHub Actions 自動完成上述流程。

Cloud Function 的 secrets 需另外設定一次：

```bash
firebase functions:secrets:set GEMINI_API_KEY --project <your-project-id>
```

## 已知限制

- 沒有 Firebase Auth；`admin_token` / 團員身份都只是前端層級的比對，不是伺服器端驗證
- 「推播新行程通知」是站內通知列表，非瀏覽器 Push Notification
- 回顧影片在使用者瀏覽器端即時生成，不會上傳保存，每次「一鍵生成」都是各自即時合成
- 尚未串接金流 / 付費牆（AI 行前評估、家長查看孩子位置等功能目前皆為免費開放）
