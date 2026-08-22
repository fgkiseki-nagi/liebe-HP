# リーベクリニック 公式サイト（liebe-HP）運用メモ

公開URL: https://fgkiseki-nagi.github.io/liebe-HP/ （GitHub Pages／配信ブランチ `codex/publish-liebe-clinic`）
ビルドツール不要の静的サイト（HTML / CSS / 最小限のJS）。

## 構成（26ページ）
```
/                         トップ
/about/  /group/          院長紹介・理念／愛清会グループ
/home-care/               訪問診療とは（ハブ）
  /flow/ /fee/ /online/ /end-of-life/
/facilities/  /partners/  施設の方へ／ケアマネ・医療機関の方へ
/area/                    対応エリア（ハブ）
  /asahikawa/ /nayoro/ /kamikawa-douhoku/ /hokkaido/
/faq/  /column/(6記事)  /access/  /contact/  /privacy/  404.html
robots.txt  sitemap.xml  llms.txt  .nojekyll
assets/img（写真）assets/icons（SVGアイコン）assets/og-default.jpg
```

## 公開手順
1. 変更をコミットし、`codex/publish-liebe-clinic` へ push（GitHub Pages がこのブランチから配信）。
2. 数分後に https://fgkiseki-nagi.github.io/liebe-HP/ と 404 ページ（存在しないURL）を確認。
3. 初回公開後: Google Search Console（URLプレフィックス `https://fgkiseki-nagi.github.io/liebe-HP/`）を登録 → `sitemap.xml` 送信 → 主要ページのインデックス登録リクエスト。Bing Webmaster Tools にも登録。

## よくある更新
- **院長写真を載せる**: `assets/img/doctor-yamazaki.jpg`（縦長 720×960 推奨）を置き、`index.html` と `about/index.html` 内のコメント「院長写真の差し替え手順」に従って1行を切り替える。
- **最終更新日**: 各ページの監修ブロック（`.byline`）の日付と JSON-LD の `dateModified`、`sitemap.xml` の `lastmod` を更新。
- **受付時間・駐車場・交通費・文書料・オンライン診療のシステム名／料金**: 現在は未確定のため「お電話でご確認ください」等の表記。確定したら `access/` `contact/` `home-care/fee/` `home-care/online/` `faq/` `llms.txt` を更新。
- **対応エリアの変更**: `area/` 配下4ページの表と `index.html` のエリア表、JSON-LD の `areaServed` をそろえて更新。
- **コラム追加**: 既存記事（例 `column/yakan-kyuhen/index.html`）を複製して書き換え、`column/index.html` のカード、`sitemap.xml`、`llms.txt` に追記。

## カスタムドメインへ移行するとき
1. リポジトリ直下に `CNAME`（例 `liebe-clinic.jp`）を置き、DNS を設定。
2. 絶対URLを一括置換:
   ```bash
   grep -rl 'fgkiseki-nagi.github.io/liebe-HP' . --include='*.html' --include='*.xml' --include='*.txt' | xargs sed -i '' 's|https://fgkiseki-nagi.github.io/liebe-HP|https://新ドメイン|g'
   ```
3. Search Console に新ドメインのプロパティを追加し、sitemap を再送信。

## 表現ルール（医療広告ガイドライン）
- 比較優良（No.1・他院より）、誇大・保証（必ず・絶対・最高・安心をお約束）、患者の体験談、ビフォーアフターは掲載しない。
- 「24時間対応」と単独で書かない。必ず「夜間・休日は電話でご相談いただけるオンコール体制（主治医への直通をお約束するものではありません。緊急時は119番を優先）」を併記。
- 費用の金額を載せる場合は「◯年◯月時点の目安／負担割合・訪問回数・療養場所により変動／診療報酬改定で変わる」を併記。

## 写真のライセンス
`assets/img` の写真は Pexels License / Unsplash License（商用可・クレジット不要）。一覧は `assets/CREDITS.md`。人物写真は「※写真はイメージです」を添える。

## 公開後にやること（SEO）
- Googleビジネスプロフィールの整備（NAP をサイトと1文字も違わず統一、サービス提供地域、写真、投稿）。
- 旭川市医師会・グループ各法人サイト・厚労省 医療情報ネット・地域包括支援センター等からのリンク／掲載。
- 月1本のコラム追加、FAQ の追記、冬季前（10月）の冬季訪問体制の更新。
