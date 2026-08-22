import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(toolsDir, '..');
const partialsDir = path.join(rootDir, 'partials');
const config = JSON.parse(fs.readFileSync(path.join(rootDir, 'site.config.json'), 'utf8'));
const baseUrl = config.baseUrl.endsWith('/') ? config.baseUrl : `${config.baseUrl}/`;
const initialIndexSource = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const currentBaseUrl = initialIndexSource.match(/<link rel="canonical" href="([^"]+)">/)?.[1];

if (!currentBaseUrl) throw new Error('index.html: canonical URL was not found');

const partialNames = ['header', 'cta', 'notice', 'footer', 'mobile-bar'];
const partials = Object.fromEntries(
  partialNames.map((name) => [name, fs.readFileSync(path.join(partialsDir, `${name}.html`), 'utf8').trim()]),
);

const eyebrowLabels = new Map([
  ['404 Not found', 'ページが見つかりません'],
  ['About us', '当院について'],
  ['Access', 'アクセス'],
  ['Aiseikai Group', '愛清会グループ'],
  ['Area pages', '地域別のご案内'],
  ['Articles', '記事一覧'],
  ['Asahikawa', '旭川市'],
  ['By profession', '職種別のご案内'],
  ['Category', 'テーマから探す'],
  ['Column', 'コラム'],
  ['Contact', 'お問い合わせ'],
  ['Cost', '費用'],
  ['Coverage', '対応範囲'],
  ['Distance &amp; zone', '距離と訪問範囲'],
  ['Documents', '必要書類'],
  ['End of life care', '看取り・ACP'],
  ['Facility types', '対応する施設'],
  ['FAQ', 'よくあるご質問'],
  ['FAQ for facilities', '施設のよくあるご質問'],
  ['Five steps', '探し方の5段階'],
  ['For care facilities', '施設・法人の方へ'],
  ['For care managers &amp; medical partners', '医療・介護関係者の方へ'],
  ['Four points', '確認のポイント'],
  ['Guide', '関連ページ'],
  ['Hokkaido', '北海道'],
  ['Home medical care', '訪問診療'],
  ['How to refer', 'ご紹介の流れ'],
  ['How to start', 'ご利用の流れ'],
  ['How we decide', '訪問可否の判断'],
  ['In-facility care', '施設内の診療'],
  ['Issues', 'よくある課題'],
  ['Kamikawa &amp; Douhoku', '上川・道北'],
  ['Municipalities', '市町村別'],
  ['Nayoro', '名寄市'],
  ['Nearby towns', '周辺地域'],
  ['Night &amp; emergency', '夜間・緊急時'],
  ['Online care', 'オンライン診療'],
  ['Privacy policy', '個人情報保護方針'],
  ['Q&amp;A 1', '対象・条件'],
  ['Q&amp;A 2', '費用・保険'],
  ['Q&amp;A 3', '診療内容・頻度'],
  ['Q&amp;A 4', '夜間・休日・急変'],
  ['Q&amp;A 5', '看取り'],
  ['Q&amp;A 6', '施設・連携'],
  ['Q&amp;A 7', '対応エリア'],
  ['Q&amp;A 8', 'オンライン診療'],
  ['Schedule', '訪問スケジュール'],
  ['Service area', '対応エリア'],
  ['Three phases', '導入の3段階'],
  ['Winter', '冬の訪問'],
]);

function walkHtml(dir, relative = '') {
  const ignored = new Set(['.git', 'liebeHP', 'references', 'partials', 'tools']);
  const files = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const absolute = path.join(dir, entry.name);
    const nextRelative = path.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...walkHtml(absolute, nextRelative));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(nextRelative);
  }

  return files.sort();
}

function rootFor(relativePath) {
  if (relativePath === '404.html') return baseUrl;
  const directory = path.dirname(relativePath);
  if (directory === '.') return './';
  return '../'.repeat(directory.split(path.sep).length);
}

function ctaFor(relativePath) {
  const section = relativePath === 'index.html' ? 'home' : relativePath.split(path.sep)[0];
  const variants = {
    home: {
      ctaEyebrow: 'はじめてのご相談',
      ctaHeading: '訪問診療を検討されている方へ',
      ctaBody: '通院の難しさ、ご住所、現在の治療やお薬についてお聞きし、次に必要な準備をご案内します。相談の段階で利用を決めていただく必要はありません。',
      ctaLabel: 'はじめてのご相談',
      ctaLinkHref: 'home-care/flow/',
      ctaLinkLabel: 'ご利用までの流れ',
    },
    'home-care': {
      ctaEyebrow: '訪問診療のご相談',
      ctaHeading: '訪問診療を検討されている方へ',
      ctaBody: '通院の難しさ、ご住所、現在の治療やお薬についてお聞きし、訪問診療が合うかどうかと次の準備をご案内します。',
      ctaLabel: '訪問診療のご相談',
      ctaLinkHref: 'home-care/flow/',
      ctaLinkLabel: 'ご利用までの流れ',
    },
    area: {
      ctaEyebrow: '対応エリアの確認',
      ctaHeading: '訪問できる地域か、ご住所から確認します',
      ctaBody: '同じ市町村でも、病状、訪問頻度、道路状況、診療体制によって判断が変わります。町名まで分かるご住所と現在の状況をお知らせください。',
      ctaLabel: '対応エリアのご相談',
      ctaLinkHref: 'area/',
      ctaLinkLabel: '対応エリア一覧',
    },
    facilities: {
      ctaEyebrow: '施設・法人の方へ',
      ctaHeading: '施設での診療体制づくりをご相談ください',
      ctaBody: '入居者さまの状況、現在の協力医療機関、施設内の連絡体制を伺い、導入までの進め方を一緒に整理します。',
      ctaLabel: '施設・法人のご相談',
      ctaLinkHref: 'facilities/',
      ctaLinkLabel: '施設向けのご案内',
    },
    partners: {
      ctaEyebrow: '医療・介護関係者の方へ',
      ctaHeading: '退院支援・在宅療養の連携をご相談ください',
      ctaBody: '患者さまの病状、退院予定、必要な処置、地域の支援体制を共有いただき、受け入れ可否と連携方法をご案内します。',
      ctaLabel: '医療・介護関係者のご相談',
      ctaLinkHref: 'partners/',
      ctaLinkLabel: '連携の進め方',
    },
    column: {
      ctaEyebrow: '記事を読んでお困りの方へ',
      ctaHeading: 'ご家族だけで抱えず、状況をお聞かせください',
      ctaBody: '記事の内容は一般的な目安です。実際の症状や療養環境に合わせた判断は、医師や関係職種と相談しながら進めます。',
      ctaLabel: '訪問診療のご相談',
      ctaLinkHref: 'contact/',
      ctaLinkLabel: '相談窓口を見る',
    },
    contact: {
      ctaEyebrow: 'お問い合わせ',
      ctaHeading: 'ご相談内容をお聞かせください',
      ctaBody: 'ご住所、現在の病状、通院が難しい理由、入院中の場合は退院予定日を分かる範囲でお伝えください。',
      ctaLabel: 'お問い合わせ窓口',
      ctaLinkHref: 'contact/',
      ctaLinkLabel: '連絡先と相談時の準備',
    },
    default: {
      ctaEyebrow: 'ご相談窓口',
      ctaHeading: 'ご相談内容をお聞かせください',
      ctaBody: 'ご住所と現在の状況を伺い、当院で対応できるか、次にどこへ相談するとよいかを個別にご案内します。',
      ctaLabel: 'お問い合わせ・ご相談',
      ctaLinkHref: 'contact/',
      ctaLinkLabel: '相談窓口を見る',
    },
  };

  return variants[section] || variants.default;
}

function render(template, values) {
  return template.replace(/\{\{([a-zA-Z]+)\}\}/g, (match, key) => {
    if (!(key in values)) throw new Error(`Template value ${key} is not defined`);
    return values[key];
  });
}

function replaceRequired(source, pattern, replacement, label, relativePath) {
  if (!pattern.test(source)) throw new Error(`${relativePath}: shared ${label} block was not found`);
  pattern.lastIndex = 0;
  return source.replace(pattern, replacement);
}

const spritePath = path.join(rootDir, 'assets', 'icons', 'sprite.svg');
if (!fs.existsSync(spritePath)) {
  const sprite = initialIndexSource.match(/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" style="display:none"[^>]*><defs>([\s\S]*?)<\/defs><\/svg>/);
  if (!sprite) throw new Error('index.html: inline icon sprite was not found');
  fs.writeFileSync(
    spritePath,
    `<svg xmlns="http://www.w3.org/2000/svg"><defs>\n${sprite[1].trim()}\n</defs></svg>\n`,
  );
}

const files = walkHtml(rootDir);
let updated = 0;

for (const relativePath of files) {
  const absolutePath = path.join(rootDir, relativePath);
  const root = rootFor(relativePath);
  const values = { root, ...ctaFor(relativePath) };
  const original = fs.readFileSync(absolutePath, 'utf8');
  let html = original;

  if (currentBaseUrl !== baseUrl) html = html.split(currentBaseUrl).join(baseUrl);
  html = html.replace(
    '<!-- ===== パンくず（トップページでは丸ごと削除する） ===== -->',
    html.includes('class="breadcrumb"') ? '<!-- ===== パンくず ===== -->' : '',
  );
  html = html.replace(
    /<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2\?family=Zen\+Maru\+Gothic:wght@500;700&(?:amp;)?display=swap" media="print" onload="this\.media='all'">\n<noscript><link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2\?family=Zen\+Maru\+Gothic:wght@500;700&(?:amp;)?display=swap"><\/noscript>/,
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700&amp;display=swap">',
  );
  html = html.replace(/<p class="eyebrow">([^<]+)<\/p>/g, (match, label) => (
    eyebrowLabels.has(label) ? `<p class="eyebrow">${eyebrowLabels.get(label)}</p>` : match
  ));
  html = html.replace(
    /<!-- ===== アイコンスプライト[\s\S]*?<\/defs><\/svg>/,
    '<!-- 共通アイコンは assets/icons/sprite.svg を参照 -->',
  );
  html = replaceRequired(
    html,
    /<!-- ===== (?:共通)?ヘッダー[^>]*-->[\s\S]*?<\/header>/,
    render(partials.header, values),
    'header',
    relativePath,
  );
  html = replaceRequired(
    html,
    /<!-- ===== ページ末尾CTA帯[^>]*-->[\s\S]*?(?=<!-- ===== (?:フッター上の固定注記|夜間・緊急時の共通案内))/,
    `${render(partials.cta, values)}\n\n`,
    'CTA',
    relativePath,
  );
  html = replaceRequired(
    html,
    /<!-- ===== (?:フッター上の固定注記|夜間・緊急時の共通案内)[^>]*-->[\s\S]*?(?=<!-- ===== (?:共通)?フッター)/,
    `${render(partials.notice, values)}\n\n`,
    'on-call notice',
    relativePath,
  );
  html = replaceRequired(
    html,
    /<!-- ===== (?:共通)?フッター[^>]*-->[\s\S]*?<\/footer>/,
    render(partials.footer, values),
    'footer',
    relativePath,
  );
  html = replaceRequired(
    html,
    /<!-- ===== モバイル固定(?:電話|相談)バー[^>]*-->[\s\S]*?<\/nav>/,
    render(partials['mobile-bar'], values),
    'mobile bar',
    relativePath,
  );
  html = html.replace(
    /<use href="(?:[^"]*sprite\.svg)?#(i-[^"]+)"\/>/g,
    `<use href="${root}assets/icons/sprite.svg#$1"/>`,
  );

  if (html !== original) {
    fs.writeFileSync(absolutePath, html);
    updated += 1;
  }
}

const urlManagedFiles = ['README.md', 'robots.txt', 'sitemap.xml', 'llms.txt', 'assets/CREDITS.md'];
let urlFilesUpdated = 0;

if (currentBaseUrl !== baseUrl) {
  for (const relativePath of urlManagedFiles) {
    const absolutePath = path.join(rootDir, relativePath);
    const original = fs.readFileSync(absolutePath, 'utf8');
    const content = original.split(currentBaseUrl).join(baseUrl);
    if (content === original) continue;
    fs.writeFileSync(absolutePath, content);
    urlFilesUpdated += 1;
  }
}

console.log(`Synced shared components in ${updated} of ${files.length} HTML files; updated ${urlFilesUpdated} URL-managed file(s).`);
