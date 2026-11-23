/* Rekaforma storefront, shared behaviour. No framework, no build step. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.RF = window.RF || {};
  RF.FLOWERS = {
    sun: { name: 'Sunflower', tint: '#f4e3a6', dot: '#f2b61c', line: 'Yellow petals, brown seed head, green band' },
    sak: { name: 'Sakura', tint: '#f5d9df', dot: '#f2a9bf', line: 'Blush petals, deep pink centre, white band' },
    dai: { name: 'Daisy', tint: '#e1e6d6', dot: '#efece3', line: 'White petals, yellow button, green band' }
  };

  /* storage that survives private mode */
  function store(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; }
  }

  /* header */
  var header = $('.header');
  if (header) {
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }
  var menuBtn = $('.menu-btn'), nav = $('.nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open);
    });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', false); }); });
  }

  /* bag */
  var bagN = parseInt(store('rf-bag') || '0', 10) || 0;
  function paintBag() { $$('.bag-count').forEach(function (el) { el.textContent = bagN; el.dataset.n = bagN; }); }
  paintBag();
  RF.addToBag = function (n, label, img, tint) {
    bagN += n; store('rf-bag', String(bagN)); paintBag();
    RF.toast('Added to bag: ' + label, img, tint);
  };

  /* toast */
  var toastEl, toastT;
  RF.toast = function (msg, img, tint) {
    if (!toastEl) {
      toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = '';
    if (img) { var i = document.createElement('img'); i.src = img; i.alt = ''; if (tint) i.style.background = tint; toastEl.appendChild(i); }
    var s = document.createElement('span'); s.textContent = msg; toastEl.appendChild(s);
    toastEl.classList.add('on'); clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('on'); }, 2600);
  };

  /* reveal on scroll */
  if ('IntersectionObserver' in window && !still) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  } else { $$('.reveal').forEach(function (el) { el.classList.add('in'); }); }

  /* mechanical click, synthesised so there is no audio file to load */
  var actx = null;
  RF.click = function (down) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var len = Math.floor(actx.sampleRate * 0.028), buf = actx.createBuffer(1, len, actx.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
      var src = actx.createBufferSource(); src.buffer = buf;
      var f = actx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = down ? 3300 : 2400; f.Q.value = 1.1;
      var g = actx.createGain(); g.gain.value = down ? 0.9 : 0.45;
      src.connect(f); f.connect(g); g.connect(actx.destination); src.start();
    } catch (e) {}
  };

  /* waitlist forms (front end only for now) */
  $$('form[data-waitlist]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = $('.form-note', f.parentNode), input = $('input', f);
      if (!input.value || input.validity.typeMismatch) { note.textContent = 'That email does not look right.'; input.focus(); return; }
      note.textContent = 'You are on the list. We will email you once, on launch day.';
      input.value = '';
    });
  });

  var yr = $('[data-year]'); if (yr) yr.textContent = new Date().getFullYear();
})();
