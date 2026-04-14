# Zipkit

台灣地址英譯與 3+3 郵遞區號查詢工具。

輸入中文地址，即時取得 UPU 格式英譯地址與六碼郵遞區號。純前端運作，所有資料皆為預先產生的靜態 JSON，無需後端 API。

## 功能

- 縣市、鄉鎮市區、路街逐級選擇
- 巷、弄、號、樓、室明細輸入
- 即時產出英譯地址（UPU 格式）
- 六碼郵遞區號（3+3）查詢
- 一鍵複製結果

## 技術棧

- [Next.js](https://nextjs.org/) 16 (App Router)
- [React](https://react.dev/) 19
- [Tailwind CSS](https://tailwindcss.com/) 4
- [shadcn/ui](https://ui.shadcn.com/)
- [TypeScript](https://www.typescriptlang.org/) 5
- [pnpm](https://pnpm.io/) 套件管理

## 快速開始

```bash
# 安裝依賴
pnpm install

# 啟動開發伺服器
pnpm dev
```

瀏覽器開啟 `http://localhost:3000` 即可使用。

## 指令

| 指令          | 說明                        |
| ------------- | --------------------------- |
| `pnpm dev`    | 啟動開發伺服器              |
| `pnpm build`  | 正式環境建置                |
| `pnpm lint`   | 執行 ESLint 檢查            |
| `pnpm format` | 格式化程式碼                |
| `pnpm etl`    | 從原始資料重新產生靜態 JSON |

## 專案結構

```
src/
  app/          # Next.js App Router 頁面
  components/   # UI 元件
  hooks/        # React hooks（地址狀態管理）
  lib/          # 工具函式（郵遞區號比對、資料載入）
scripts/
  etl.ts        # ETL 資料轉換腳本
  raw/          # 原始郵政資料（不納入版本控制）
public/
  data/         # 預先產生的靜態 JSON
```

## 資料來源

本專案使用以下第三方開源資料：

- **地址中英對照** -- [donma/TaiwanAddressCityAreaRoadChineseEnglishJSON](https://github.com/donma/TaiwanAddressCityAreaRoadChineseEnglishJSON)
  提供台灣縣市、鄉鎮市區、路街的中英文對照資料（`CityCountyData.json`、`AllData.json`）。
- **3+3 郵遞區號範圍** -- [中華郵政 3+3 郵遞區號查詢](https://www.post.gov.tw/post/internet/Download/index.jsp?ID=2292)
  提供各地址區段對應的六碼郵遞區號範圍資料（`rall1.txt`）。

## 授權

本專案採用 [MIT License](LICENSE) 授權。
