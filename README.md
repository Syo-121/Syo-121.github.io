# Syo-121.github.io

Syo の個人サイトのリポジトリ。[Hugo](https://gohugo.io/) で作り、GitHub Pages（https://syo-121.github.io/）で公開する。

## 必要なもの

- Node.js 22（`.node-version`）
- `npm install` で Hugo と Pagefind が入る。版は `package.json` と `package-lock.json` で固定している（勝手に上がらない）
  - Hugo: `hugo-extended` 0.166.0
  - Pagefind（検索）: `pagefind` 1.5.2

## コマンド

| コマンド | 用途 |
|---|---|
| `npm install` | 最初に1回。Hugo と Pagefind を入れる |
| `npm run dev` | 書きながら確認する（http://localhost:1313/）。保存すると自動で反映。リポジトリの外の下書き（下記）も出る。**検索は動かない** |
| `npm run preview` | 公開と同じ手順でビルドし、検索も含めて確認する（下書きも出る）。表示された URL を開く |
| `npm run build` | 公開用のビルド（`public/` に出る） |

## 記事の書き方

公開前の原稿は**リポジトリの外** `../../_下書き/記事/<スラッグ>/index.md` に書き、画像も同じフォルダに置く。
`npm run dev` と `npm run preview` のときだけ、このフォルダが `content/posts/` に重ねて読み込まれる（`config/development/hugo.toml`・`config/preview/hugo.toml`）。
公開のビルド（`npm run build`・GitHub Actions）はこの設定を読まないので、下書きは公開されない。
公開するときに、`index.md` と画像を `content/posts/<スラッグ>/` へ移す。
同じフォルダの書き散らし用 `メモ.md` は移さない（Hugo は記事の束の中の別の `.md` をページにしないので表示にも出ない。`.gitignore` でも外してある）。

```yaml
---
title: "タイトル"
slug: "example-slug"        # 必須。URL の名前（英小文字・数字・ハイフン）。公開後は変えない
published: 2026-09-27       # 必須。公開日
updated: 2026-10-10         # 任意。更新したときだけ書く
tags: ["技術", "ESP32"]     # 必須。種類のタグ（技術 / 参加記 / 思想 / その他）を1つ必ず入れる
description: "要約"         # 必須。一覧・SNS のカード・フィードに出る
image: "main.jpg"           # 任意。一覧のサムネイルと SNS のカード画像。記事のフォルダに置いた画像の名前
                            #   書かないときは本文の最初の画像。それも無ければアイコンが出る
recommended: true           # 任意。トップの「おすすめ記事」に出す
draft: true                 # 任意。true の間は公開されない（ページもフィードも作られない）
---
```

- ⚠ このリポジトリは公開なので、`draft: true` の記事もファイルは GitHub で読める。人に見せたくない原稿はリポジトリの外（`_下書き/`）で書く
- 公開したくないファイルは `.gitignore` に足す。ただし、一度コミットしたものは履歴から読める

## このサイト独自の記法

普通の Markdown 以外に使っている書き方。ツールを乗り換えるときは、ここに挙げたものを変換する。

| 要素 | 書き方 | 実装 |
|---|---|---|
| 注意書き | `> [!NOTE]`（補足）・`> [!WARNING]`（警告）。ほかに `TIP`・`IMPORTANT`・`CAUTION` | GitHub・Obsidian と同じ形。`layouts/_markup/render-blockquote.html` |
| 画像のサイズ | `![説明](photo.jpg?width=400)` | `layouts/_markup/render-image.html` |
| 数式 | 文中は `$...$`、独立した行は `$$...$$`。`$` を文字として書くときは `\$` | ビルド時に KaTeX で変換。`layouts/_markup/render-passthrough.html` |
| X の投稿 | `{{< x-post url="https://x.com/ユーザー/status/ID" >}}` | ショートコード。`layouts/_shortcodes/x-post.html` |
| Docswell のスライド | `{{< docswell url="https://www.docswell.com/s/ユーザー/ID-名前" >}}` | ショートコード。`layouts/_shortcodes/docswell.html` |
| 図（Mermaid） | コードブロックの言語を `mermaid` にする | 表示時にブラウザで図にする。`layouts/_markup/render-codeblock-mermaid.html` |
| 改行 | 1行の改行がそのまま改行になる（Zenn と同じ） | `hugo.toml` の `hardWraps`。普通の Markdown では空行を入れないと改行にならない |

## URL の形

ツールを変えても、この形を作り直せば古いリンクが切れない。

| ページ | URL |
|---|---|
| トップ | `/` |
| 記事一覧 | `/posts/` |
| 記事 | `/posts/<スラッグ>/`（先頭情報の `slug` で決まる。ファイルの場所やタイトルには左右されない） |
| タグ一覧 | `/tags/` |
| タグ別一覧 | `/tags/<タグ>/`（日本語のタグは日本語のまま） |
| 自己紹介 | `/about/`（活動・実績は `/about/#works`） |
| 検索 | `/search/` |
| フィード | `/feed.xml` |

## そのほかのファイル

| ファイル | 中身 |
|---|---|
| `hugo.toml` | サイト名・X と GitHub のアカウント・トップの件数・解析のトークンなど |
| `content/_index.md` | トップの短い自己紹介 |
| `content/about.md` | 自己紹介ページの本文 |
| `data/works.yaml` | 活動・実績の一覧。自己紹介ページに出る（書き方はファイルの先頭に書いてある） |
| `assets/images/card.png` | SNS のカードの共通画像 |
| `assets/css/main.css` | 見た目（先頭の `--w-page` / `--w-text` で幅を変えられる） |
| `layouts/_partials/post-item.html` | 一覧のカード1件（サムネイル付き） |
| `layouts/_partials/related.html` | 記事の下に出す他の記事 |

## 使っている外部サービス

| サービス | 用途 | 止まったら |
|---|---|---|
| GitHub Pages / GitHub Actions | 公開 | サイトが見られなくなる |
| Cloudflare Web Analytics | 閲覧数（`hugo.toml` の `cloudflareAnalyticsToken`。空なら読み込まない） | 閲覧数が取れないだけ |
| X | 投稿の埋め込み・感想を送るリンク | 埋め込みがリンクだけの表示になる |
| Docswell | スライドの埋め込み | 埋め込みが表示されない（下のリンクは残る） |
| jsDelivr | 数式のある記事だけ KaTeX の CSS、図のある記事だけ Mermaid（12.0.0）を読む | 数式の見た目が崩れる／図がコードのまま表示される |

## 公開

`main` に push すると、GitHub Actions（`.github/workflows/deploy.yml`）がビルドして GitHub Pages に出す。手作業のアップロードはない。反映まで数分かかる。

- push は毎回、本人の OK を取ってから（Claude Code の `.claude/settings.json` で `git push` は確認つき）
- Actions の画面から手動でも実行できる（`workflow_dispatch`）

### 最初に1回だけ必要な設定

1. リポジトリを公開にする（GitHub Free では、公開リポジトリだけが Pages を使える）
2. Settings > Pages > Build and deployment > Source を **GitHub Actions** にする
3. コミットのメールアドレスを GitHub の noreply アドレスにする
   - GitHub の Settings > Emails で「Keep my email addresses private」を有効にし、表示される `xxxxxxx+ユーザー名@users.noreply.github.com` を控える
   - このリポジトリで `git config user.email "<その noreply アドレス>"`

### 独自ドメインへ移すときは

1. ドメインを取る前に、登録者情報に住所・電話番号が出ないことを確かめる（出さないのが決めごと）
2. Settings > Pages > Custom domain にドメインを入れ、DNS 側に GitHub Pages のレコードを設定する
3. `hugo.toml` の `baseURL` を新しいドメインに変える
4. 古い URL（`https://syo-121.github.io/posts/<スラッグ>/`）を開き、新しいドメインの同じパスに転送されることを確かめる。記事のパスを変えなければ、古いリンクは切れない

## よくある故障の直し方

| 症状 | 見るところ・直し方 |
|---|---|
| Actions が赤くなる | Actions のログを開く。`npm ci` で止まるときは、手元で `npm install` して `package-lock.json` をコミットし直す |
| 公開はされたが内容が古い | Actions が最後まで緑か確認する。緑ならブラウザの再読み込み（キャッシュ） |
| 検索の結果が出ない | `npm run dev` では索引が作られない。`npm run preview` か公開サイトで確かめる。公開サイトで出ないときは、Actions のログで pagefind が走っているか見る |
| 図（Mermaid）が出ない | 図はブラウザで描いている。ブラウザのコンソールにエラーが出ていないか見る。記法の誤りなら図の場所にエラーが出る |
| 数式が崩れる | Hugo が使う KaTeX の版と、`layouts/page.html` で読む KaTeX の CSS の版を合わせる（今は 0.18.4） |
| 画像が出ない | ビルドのときに「画像が見つかりません」と警告が出ていないか見る。画像は記事と同じフォルダに置く |
| ビルドで「deprecated」と出る | Hugo の版を上げたときに出る。メッセージのとおりに `hugo.toml` を直す |
| 版を上げたい | `npm install hugo-extended@<版> pagefind@<版> --save-exact` のあと `npm run preview` で確かめてからコミットする |
| 一覧のサムネイルが変な絵になる | 記事の先頭情報に `image: "<ファイル名>"` を書く。書かないと本文の最初の画像が使われる。画像が1枚も無い記事はアイコンが出る |
| PC で左右が空きすぎる・詰まりすぎる | `assets/css/main.css` の `--w-page`（ページ全体の幅・既定 72rem）と `--w-text`（記事本文の幅・既定 46rem）を変える。本文の幅は「1行 35〜40 字」が目安（4-H） |
| スマホで横にはみ出す | ⚠ `assets/css/main.css` の `body` を grid や flex にしないこと。幅の属性を持つ画像や埋め込みの iframe が「縮められない最小幅」として効き、ページ全体が横に広がる（2026-09-16 に実測で確認。CSS にも注意書きあり）。二段組み・カード並べの grid は 48rem 以上の画面だけに効かせている |
