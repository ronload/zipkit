# @zipkit/core

台灣地址英譯與 3+3 郵遞區號查詢的核心邏輯，無框架依賴。

此套件是 [Zipkit](https://github.com/ronload/zipkit) 的領域核心，提供 UPU 格式地址英譯、六碼郵遞區號（3+3）特異性比對，以及共用型別。純函式、無副作用，可用於任何 JavaScript / TypeScript 環境。

ESM-only。以 [tsdown](https://tsdown.dev/) 建置，輸出 ESM 與型別宣告。

## 安裝

```bash
pnpm add @zipkit/core
```

## API

### `formatEnglishAddress(city, district, road, detail): string`

將中文地址格式化為 UPU 標準英譯地址。輸出順序為 `[Room], [Floor], No. [Number], [Alley], [Lane], [Road], [District], [City] [Zip], Taiwan (R.O.C.)`。

```ts
import { formatEnglishAddress } from "@zipkit/core";

formatEnglishAddress(
  { name: "臺北市", en: "Taipei City", districts: [] },
  { name: "中正區", en: "Zhongzheng Dist.", zip3: "100" },
  { name: "忠孝東路一段", en: "Sec. 1, Zhongxiao E. Rd." },
  { lane: "", alley: "", number: "5之1", floor: "3", room: "" },
);
// => "3F., No. 5-1, Sec. 1, Zhongxiao E. Rd., Zhongzheng Dist., Taipei City 100, Taiwan (R.O.C.)"
```

### `lookupZip6(ranges, roadName, lane, alley, number, numberSub, floor): string | null`

以特異性評分比對地址與郵遞區號範圍規則，回傳六碼郵遞區號；無對應時回傳 `null`。條件越多（巷段、弄段、門牌範圍、單雙號、樓層）的規則優先採用。`ranges` 為該行政區的範圍規則陣列（由資料來源載入）。

```ts
import { lookupZip6 } from "@zipkit/core";

// ranges: ZipRange[]（該行政區的範圍規則）
const zip6 = lookupZip6(ranges, "忠孝東路一段", 0, 0, 5, 1, 3);
// => "100002" 或 null
```

### `parseNumber(input): { number: number; sub: number }`

解析含「之」記法的門牌號字串。

```ts
import { parseNumber } from "@zipkit/core";

parseNumber("5之1"); // => { number: 5, sub: 1 }
parseNumber("33"); // => { number: 33, sub: 0 }
```

## 型別

匯出 `City`、`District`、`Road`、`ZipRange`、`AddressDetail` 五個領域型別，皆可作為 `import type` 引入。

```ts
import type {
  City,
  District,
  Road,
  ZipRange,
  AddressDetail,
} from "@zipkit/core";
```

## 授權

[MIT](./LICENSE)
