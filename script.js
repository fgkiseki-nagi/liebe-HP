/* リーベクリニック 公式サイト 共通スクリプト
   役割は3つだけ（本文はすべてHTMLに直書き。JSに依存しない）
   1. ハンバーガーメニューの開閉（Escキー / メニュー内リンククリックで閉じる）
   2. スクロール時のヘッダー影
   3. 画像が読み込めなかったときのフォールバック表示 */
(function () {
  'use strict';

  /* ---- 1. ハンバーガーメニュー ---- */
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('siteNav');

  function setMenu(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    var label = toggle.querySelector('.visually-hidden');
    if (label) label.textContent = open ? 'メニューを閉じる' : 'メニューを開く';
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', function (e) {
      var link = e.target.closest ? e.target.closest('a') : null;
      if (link && window.matchMedia('(max-width: 1023px)').matches) setMenu(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' && e.key !== 'Esc') return;
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      setMenu(false);
      toggle.focus();
    });
  }

  /* ---- 2. ヘッダーの影 ---- */
  var header = document.getElementById('siteHeader');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-stuck', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- 3. 画像フォールバック（写真が無くてもレイアウトを崩さない） ---- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-photo] img'), function (img) {
    var mark = function () {
      var wrap = img.closest('[data-photo]');
      if (wrap) wrap.classList.add('is-missing');
    };
    if (img.complete && img.naturalWidth === 0) mark();
    img.addEventListener('error', mark);
  });

  /* ---- 4. ヘッダーナビの現在ページ表示 ---- */
  try {
    var here = location.pathname.replace(/index\.html$/, '');
    Array.prototype.forEach.call(document.querySelectorAll('#siteNav a[href]'), function (a) {
      var target = a.pathname.replace(/index\.html$/, '');
      if (target === here) a.setAttribute('aria-current', 'page');
    });
  } catch (e) { /* noop */ }
})();
