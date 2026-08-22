/* リーベクリニック 公式サイト 共通スクリプト
   本文と主要な導線は JavaScript が無効でも利用できるよう、HTML に記載します。
   1. モバイルナビゲーションの開閉・フォーカス管理
   2. スクロール時のヘッダー影
   3. 画像が読み込めなかったときのフォールバック表示
   4. ヘッダーナビの現在ページ表示 */
(function () {
  'use strict';

  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('siteNav');
  var header = document.getElementById('siteHeader');
  var mobileQuery = window.matchMedia('(max-width: 1199px)');
  var bodyOverflow = null;

  function isMobile() {
    return mobileQuery.matches;
  }

  function setScrollLock(locked) {
    if (locked) {
      if (bodyOverflow === null) bodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return;
    }

    if (bodyOverflow !== null) {
      document.body.style.overflow = bodyOverflow;
      bodyOverflow = null;
    }
  }

  function setMenu(open, options) {
    if (!toggle || !nav) return;
    if (open && !isMobile()) return;

    var wasOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    setScrollLock(open && isMobile());

    var label = toggle.querySelector('.visually-hidden');
    if (label) label.textContent = open ? 'メニューを閉じる' : 'メニューを開く';

    if (open && !wasOpen) {
      var firstLink = nav.querySelector('a[href]');
      if (firstLink) firstLink.focus();
    }

    if (!open && wasOpen && options && options.restoreFocus) toggle.focus();
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true', { restoreFocus: true });
    });

    nav.addEventListener('click', function (event) {
      var link = event.target.closest ? event.target.closest('a') : null;
      if (link && isMobile()) setMenu(false);
    });

    document.addEventListener('pointerdown', function (event) {
      if (!isMobile() || toggle.getAttribute('aria-expanded') !== 'true') return;
      if (header && !header.contains(event.target)) setMenu(false, { restoreFocus: true });
    });

    document.addEventListener('keydown', function (event) {
      if ((event.key !== 'Escape' && event.key !== 'Esc') || toggle.getAttribute('aria-expanded') !== 'true') return;
      setMenu(false, { restoreFocus: true });
    });

    function resetOnDesktop() {
      if (!isMobile()) setMenu(false);
    }

    if (mobileQuery.addEventListener) mobileQuery.addEventListener('change', resetOnDesktop);
    else mobileQuery.addListener(resetOnDesktop);
    resetOnDesktop();
  }

  /* ヘッダーの影 */
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-stuck', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* 画像フォールバック（写真が無くてもレイアウトを崩さない） */
  Array.prototype.forEach.call(document.querySelectorAll('[data-photo] img'), function (img) {
    var mark = function () {
      var wrap = img.closest('[data-photo]');
      if (wrap) wrap.classList.add('is-missing');
    };
    if (img.complete && img.naturalWidth === 0) mark();
    img.addEventListener('error', mark);
  });

  /* ヘッダーナビの現在ページ表示（子ページは親セクションを表示） */
  try {
    var here = location.pathname.replace(/index\.html$/, '');
    var links = document.querySelectorAll('#siteNav a[href]');
    var currentLink = null;
    var parentLink = null;

    Array.prototype.forEach.call(links, function (link) {
      var target = link.pathname.replace(/index\.html$/, '');
      link.removeAttribute('aria-current');
      if (target === here) currentLink = link;
      if (!parentLink && target !== '/' && here.indexOf(target) === 0) parentLink = link;
    });

    (currentLink || parentLink || {}).setAttribute && (currentLink || parentLink).setAttribute('aria-current', 'page');
  } catch (error) { /* Navigation remains usable if URL parsing is unavailable. */ }
})();
