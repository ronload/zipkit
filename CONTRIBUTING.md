# 貢獻指南

感謝你有興趣參與 Zipkit 的開發！以下說明如何開始。

## 環境需求

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 10+

## 開始開發

```bash
# Fork 並 clone 專案
git clone https://github.com/<your-username>/zipkit.git
cd zipkit

# 安裝依賴
pnpm install

# 啟動開發伺服器
pnpm dev
```

## 開發流程

1. 從 `main` 分支建立新分支，分支名稱應簡潔描述變更內容
2. 進行修改
3. 確認通過檢查：
   ```bash
   pnpm lint
   pnpm format:check
   pnpm build
   ```
4. 提交變更並推送至你的 fork
5. 建立 Pull Request

## Commit 規範

本專案使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>(<scope>): <description>
```

常用 type：

| Type       | 說明                   |
| ---------- | ---------------------- |
| `feat`     | 新功能                 |
| `fix`      | 修復問題               |
| `refactor` | 重構（不影響功能）     |
| `style`    | 格式調整（不影響邏輯） |
| `build`    | 建置系統或依賴變更     |
| `ci`       | CI 設定變更            |
| `docs`     | 文件更新               |

## Pull Request 規範

- 標題簡潔明確，使用 Conventional Commits 格式
- 說明變更的目的與做法
- 確保 CI 檢查全部通過

## 程式碼風格

- TypeScript strict mode
- ESLint + Prettier 自動格式化
- 提交前請執行 `pnpm lint` 和 `pnpm format:check`

## 回報問題

如果發現 bug 或有功能建議，歡迎透過 [Issues](https://github.com/ronload/zipkit/issues) 回報。
