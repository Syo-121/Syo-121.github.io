---
title: "記法の見本（下書き）"
slug: "elements-sample"
published: 2026-09-16
updated: 2026-09-16
tags: ["その他", "テスト"]
description: "S-12〜S-17 の表示を確かめるための見本。draft のまま公開しない"
draft: true
---

表示を確かめるための見本です。`draft: true` なので公開用のビルドには入りません（`npm run dev -- -D` で見られます）。

## コード

```js
const veryLongLine = "この行はとても長いので、コードの枠の中で横にスクロールするはずです。ページ全体がはみ出さないことを確かめます。0123456789abcdefghijklmnopqrstuvwxyz";
console.log(veryLongLine);
```

## 表

| 項目 | 内容 |
|---|---|
| 見本 | 表として出る |
| 金額の書き方 | \$100 のようにドル記号を文字として書く |

## 注意書き

> [!NOTE]
> 補足の例です。

> [!WARNING]
> 警告の例です。

## 数式

文中の数式 $E = mc^2$ と、独立した行の数式:

$$
\int_0^1 x^2 \, dx = \frac{1}{3}
$$

## 画像

![見本の画像](sample.svg?width=200)

## 埋め込み

{{< x-post url="https://x.com/_syo_syo_syo_/status/1956266148900823490" >}}

{{< docswell url="https://www.docswell.com/s/Syo-121/K13MYR-seccamp2025-x4-syo" >}}
