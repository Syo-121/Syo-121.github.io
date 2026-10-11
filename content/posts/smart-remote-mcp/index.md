---
title: "ESP32で作った自作スマートリモコンをAIで制御する \n【HTTP API + Local MCP】"
slug: "smart-remote-mcp"
published: 2026-10-11   # 公開する日に直す
tags: ["技術","Claude Code","AI","MCPサーバー","HTTP","HTTP API","ESP32","HomeKit","Arduino","電子工作","IoT"]          # 種類を1つ．ほかのタグは後ろに足す
series: "自作スマートリモコン"   # シリーズ名（D-055）。同じ名前の記事が目次に並ぶ
image: ""               # 一覧のサムネイル兼 SNS カード．同じフォルダの画像名（例: main.jpg）
description: "過去に作ったスマートリモコンをMCPサーバーとHTTP API経由でAIから操作できるように機能を追加しました．"         # 要約．全角60〜100字．一覧・SNS・フィード・検索に出る
aiFigures: true        # 図に生成AIを使ったら true
cardTitle: "ESP32で作った|自作スマートリモコンを|AIで制御する"           # タイトル入りのカードの改行位置を「|」で指定．1行は全角15字まで
---

## はじめに
過去に作った[iOSのホームアプリから操作できるスマートリモコン](https://syo-121.github.io/posts/homekit-smart-remote/)の続きです．

今回はパソコンからも操作できるように，HTTP APIを用いてESP32と通信できるようにしたうえで，AIを介して制御できるようにMCPサーバーを自作してローカルで動かしてみました．
MCPサーバーが何をするものかという知識は元々ありましたが，理解を深めるためには実際に作ってみるのがいいだろうってのがモチベーションです．

実際にコードを書いたのはもちろんClaude Codeですが，要求要件を定義したり設計を確定させていったりするなかでかなり理解は深まりました．

（実際にAIからエアコンや照明を制御したくなるケースなんてほとんどないとは思うので実用性はないかも知れません笑）

## 全体構成
全体の構成としては以下の通りです．

![](architecture.svg)

AIはローカルのMCPサーバーを通してESP32のHTTP APIを呼びます．iOSのホームアプリはこれまで通りHomeKitでESP32につながるので，既存の機能を流用したまま機能追加することができます．ハードウェアの構成も一切変えていません．他にも方式の候補はありましたが以下のように比較してHTTP APIを使った方式に落ち着きました．

| 方式 | 利点 | 欠点 |
| --- | --- | --- |
| USB シリアル | コードの変更がほぼ不要 | パソコンと常に USB でつなぐ必要がある |
| MQTT | Home Assistant などとつなぎやすい | ブローカーを動かすサーバーが別に必要 |
| Home Assistant 経由 | 機器が増えてもまとめて管理できる | HomeSpan を直接使うには Apple のホームとのペアリングを外す必要がある |
| ESP32 に直接 MCP サーバーを載せる | パソコン側に何もいらない | HomeSpan と同時に動かすには重い．ツールの説明を直すたびに書き込み直しが必要 |
| HTTP API + ローカルMCP | ブラウザ・`curl`・AIからも使える | 認証を自分で用意する必要がある |

## ESP32 側：HTTP API

HomeSpan と同じスケッチの中で，Arduino付属の `WebServer` を 8080 番ポートで動かしています．80 番ポートは HomeSpan が HomeKit の通信に使っているので，それとは分けました．コードは `main/http_api.ino` という別のファイルにまとめています．

| エンドポイント | パラメータ | 内容 |
| --- | --- | --- |
| `GET /status` | なし | エアコンと照明の状態，機種一覧，照明ボタン一覧を JSON で返す |
| `POST /ac` | `power` / `mode` / `temp` / `model` | 指定した項目だけ変えて，赤外線を送る |
| `POST /light` | `power=on` / `off` | 点灯（普段）か消灯を送る |
| `POST /light/button` | `button=full` / `night` / `brighter` / `darker` / `sleep30` | 照明リモコンのボタンを 1 回押す |

```
curl -X POST -H "Authorization: Bearer <トークン>" "http://smartrc.local:8080/ac?power=on&mode=cool&temp=26"
```
後からMCPサーバー経由でAIが触ることを考慮して，以下の点を考慮してClaude Codeに実装してもらいました．

- 『いまオフだからオンにする』ではなく『オンにする』と言えば済む形にした（何度呼んでも同じ結果になる）
- エラーをわかりやすい理由つきで返す
- `GET /status`で最後に送った命令から状態を推定できるように（純正リモコン等で操作していると状態はずれる）

### HomeKit との状態同期

HTTP から操作したときは，HomeSpan の `setVal()` で HomeKit 側の値も更新します．こうしないと，AI でエアコンをつけてもホームアプリはオフのままになってしまいます．

```cpp
// HTTP APIなどHomeKit以外から操作する時用（HomeKit側の表示も更新する）
void setState(int pwr, int mode, float coolTemp, float heatTemp) {
  active->setVal(pwr);
  targetState->setVal(mode);
  coolingThresh->setVal(coolTemp);
  heatingThresh->setVal(heatTemp);
  apply(pwr, mode, coolTemp, heatTemp);  // 赤外線を送信して現在状態を更新
}
```

HomeKit からの操作で呼ばれる `update()` も，同じ `apply()` を呼ぶように整理しました．どちらから操作しても，同じ処理で赤外線が送られます．

### 認証と起動のタイミング

- 全リクエストに `Authorization: Bearer <トークン>` を必須にしました．トークンは `secrets.h` に書き，`.gitignore` で公開リポジトリから外しています．
- `secrets.h` がないときは，`__has_include` で検出して API を起動しないようにしています．
- `WebServer` は Wi-Fi につながってからでないと起動できません．そこで，HomeSpan の `setWifiCallback()` で起動しています．
- ホスト名は `setHostNameSuffix("")` で `smartrc.local` に固定しました．

## パソコン側：ローカル MCP サーバー

MCP サーバーは，Python の公式 SDK（`mcp` 2.3）と `httpx` で書きました．本体は 100 行ほどで，やっているのは HTTP API を呼ぶことだけです．AI アプリとは標準入出力（stdio）でやり取りします．（「全灯」「おやすみ30」などの名称は純正リモコンのボタン名称をそのまま使用しています）

| ツール | 内容 |
| --- | --- |
| `get_status` | 状態，機種一覧，照明ボタン一覧を取得 |
| `set_ac` | エアコンの運転・モード・温度・機種を変更（指定した項目だけ） |
| `set_light` | 照明の点灯（普段）・消灯 |
| `press_light_button` | 全灯・常夜灯・明るい・暗い・おやすみ30 を 1 回押す |

ツールは関数を書いてデコレータを付けるだけで作れます．引数の型と docstring がそのまま AI への「使い方の説明」になるのがポイントです．

```python
from mcp.server.mcpserver import MCPServer

mcp = MCPServer("smartrc")

@mcp.tool()
def press_light_button(
    button: Literal["full", "night", "brighter", "darker", "sleep30"],
) -> dict:
    """照明リモコンのボタンを1回押す．

    Args:
        button:
            "full"     全灯（最大の明るさ）
            "night"    常夜灯
            "brighter" 1段階明るくする（押すたびに効くので必要な回数だけ呼ぶ）
            "darker"   1段階暗くする（同上）
            "sleep30"  おやすみ30（30分後に消灯）
    """
    return _request("POST", "/light/button", {"button": button})
```

- `Literal` で取りうる値を限定しておくと，存在しないボタン名は ESP32 に届く前に MCP 側で弾かれます．
- トークンと URL は環境変数 `SMARTRC_TOKEN` と `SMARTRC_URL` から読みます．AI には見えません．
- 実機がなくても確かめられるように，ESP32 の代わりに同じ応答を返す模擬サーバーを立てて，先に全ツールの動作を確認しました．

## 登録と動作確認

Claude Code への登録は，コマンド 1 本です．`-s user` を付けると，どのフォルダで Claude Code を開いても使えます．

```
claude mcp add -s user smartrc -e SMARTRC_TOKEN=<トークン> -e SMARTRC_URL=http://smartrc.local:8080 -- <mcpフォルダ>\.venv\Scripts\python.exe <mcpフォルダ>\smartrc_mcp.py
```

`claude mcp list` で「✔ Connected」と出れば登録できています．Claude Code を再起動すると，新しいツールが使えるようになります．

実際に頼んだ例は次のとおりです．

| 頼んだこと | AI が呼んだツール |
| --- | --- |
| エアコンと照明の状態を教えて | `get_status` |
| 照明を常夜灯にして | `press_light_button(button="night")` |
| 冷房26度でエアコンをつけて | `set_ac(power="on", mode="cool", temperature=26)` |

## 躓いた点

| 症状 | 原因 | 対処 |
| --- | --- | --- |
| `No module named 'mcp.server.fastmcp'` | `mcp` 2.x で `FastMCP` が `MCPServer` に名前変更されていた | `from mcp.server.mcpserver import MCPServer` に書き換える．古い記事のコードは 1.x 向けなので注意 |
| `'LightSendVariant' has not been declared` | Arduino IDE が関数の宣言を自動生成するとき，`enum` の定義より前に置いてしまう | 関数の引数を `int` にする |
| HomeKit と HTTP API のポートがぶつかる | HomeSpan が 80 番ポートを使っている | HTTP API は 8080 番にする |
| 照明が反応しない | 赤外線 LED の照射角が狭く，照明の受光部に届いていなかった | LED を照明に向ける．診断用に，シリアルから信号を送る `@L` コマンドを作った |

## 外出先から使うには

Claude CodeのRemote Controlを使えば今のままでも外出先から操作できますが，Remote Controlに頼らず直接操作するのであればTailscaleなどVPNを使って操作する方法が考えられます．ESP32で Tailscale を動かす方法も最近出てきたらしいですが，基本ESP32 自体は tailnet に参加できません．外出先のパソコンから使うには，次の準備が必要です．

1. 自宅で常時起動している機器を，Tailscale のサブネットルーターにする．
2. ルーターの設定で ESP32 の IP アドレスを固定する．
3. 外からは `smartrc.local` が使えないので，`SMARTRC_URL` に IP アドレスを指定する．

実際に試してはないですが，理論上はできるはずです．トークンの認証の仕組みが甘かったりするので外に出すなら色々と考え直す必要はありそうですが...

## おわりに

ESP32 に HTTP API を足し，パソコン側に小さな MCP サーバーを置くだけで，自作リモコンを AI から操作できるようになりました．HTTP API は AI 専用ではないので，スクリプトや他のツールからも使えます．ハードよりの人間なので，HTTP APIやMCPサーバーなど高レイヤーな領域について実際に実装することで理解を深めることができました．

実はMCPサーバーを使って他にやりたいことがあってその下準備でもありました．そちらについても目処がついたら記事にしたいと思います．

ソースコードは [GitHub](https://github.com/Syo-121/SmartRemoteController-with-ESP32-and-Homekit) にあります．

