/* Rekaforma storefront, shared behaviour: catalogue, cart, drawer, small interactions.
   No framework, no build step. Prices are in sen (RM 15.00 = 1500). The server
   (functions/api/checkout.js) holds its own copy of the prices and never trusts these. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var RF = window.RF = window.RF || {};
  RF.CATALOG = {
    'flower-sun': { flower: 'sun', name: 'Flower Clicker, Sunflower', short: 'Sunflower', price: 1500, tint: '#dcd6cb', dot: '#f2b61c', line: 'Yellow petals, brown seed head, green band' },
    'flower-sak': { flower: 'sak', name: 'Flower Clicker, Sakura', short: 'Sakura', price: 1500, tint: '#dcd6cb', dot: '#f4b6c8', line: 'Blush petals, deep pink centre, white band' },
    'flower-dai': { flower: 'dai', name: 'Flower Clicker, Daisy', short: 'Daisy', price: 1500, tint: '#dcd6cb', dot: '#f4f1e8', line: 'White petals, yellow centre, green band' }
  };
  /* display copies of shop-config.json; the server recalculates delivery itself */
  RF.FREE_OVER = 4500;
  RF.SHIP = { west: 700, east: 1500, eastOver: 800 };
  RF.idFor = function (f) { return 'flower-' + f; };
  RF.img = function (id, view) { return 'assets/img/flower/' + RF.CATALOG[id].flower + '_' + (view || 'top') + '.webp'; };
  RF.rm = function (sen) { return 'RM' + (sen / 100).toFixed(sen % 100 ? 2 : 0); };

  /* storage that survives private mode */
  function load(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /* ---------- cart ---------- */
  var cart = (load('rf-cart') || []).filter(function (l) { return RF.CATALOG[l.id] && l.qty > 0; });
  var listeners = [];
  RF.cart = {
    items: function () { return cart.slice(); },
    count: function () { return cart.reduce(function (n, l) { return n + l.qty; }, 0); },
    subtotal: function () { return cart.reduce(function (s, l) { return s + l.qty * RF.CATALOG[l.id].price; }, 0); },
    add: function (id, qty) {
      var l = cart.find(function (x) { return x.id === id; });
      if (l) l.qty = Math.min(50, l.qty + qty); else cart.push({ id: id, qty: qty });
      commit();
    },
    set: function (id, qty) {
      cart = qty > 0 ? cart.map(function (l) { return l.id === id ? { id: id, qty: Math.min(50, qty) } : l; }) : cart.filter(function (l) { return l.id !== id; });
      commit();
    },
    clear: function () { cart = []; commit(); },
    on: function (fn) { listeners.push(fn); }
  };
  function commit() { save('rf-cart', cart); paint(); listeners.forEach(function (fn) { fn(); }); }

  /* ---------- drawer ---------- */
  var drawer, scrim, body, foot;
  function buildDrawer() {
    scrim = document.createElement('div'); scrim.className = 'scrim';
    drawer = document.createElement('aside'); drawer.className = 'drawer'; drawer.setAttribute('aria-label', 'Your bag'); drawer.setAttribute('aria-hidden', 'true');
    drawer.innerHTML =
      '<div class="drawer-head"><h2>Your bag</h2>' +
      '<button class="icon-btn" type="button" data-close aria-label="Close bag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
      '<div class="drawer-body"></div><div class="drawer-foot"></div>';
    document.body.appendChild(scrim); document.body.appendChild(drawer);
    body = $('.drawer-body', drawer); foot = $('.drawer-foot', drawer);
    scrim.addEventListener('click', RF.closeBag);
    $('[data-close]', drawer).addEventListener('click', RF.closeBag);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && drawer.classList.contains('on')) RF.closeBag(); });
  }
  RF.lineHTML = function (l, editable) {
    var p = RF.CATALOG[l.id];
    return '<div class="line" style="--tint:' + p.tint + '">' +
      '<img src="' + RF.img(l.id) + '" alt="" width="76" height="76">' +
      '<div><h3>' + p.name + '</h3><div class="unit">' + RF.rm(p.price) + '</div></div>' +
      '<div class="end"><span class="amt">' + RF.rm(p.price * l.qty) + '</span>' +
      (editable
        ? '<span class="stepper"><button type="button" data-dec="' + l.id + '" aria-label="One fewer ' + p.short + '">−</button><output>' + l.qty + '</output><button type="button" data-inc="' + l.id + '" aria-label="One more ' + p.short + '">+</button></span>'
        : '<span class="unit">× ' + l.qty + '</span>') +
      '</div></div>';
  };
  function renderDrawer() {
    if (!drawer) return;
    var items = RF.cart.items();
    if (!items.length) {
      body.innerHTML = '<div class="empty"><p>Your bag is empty.</p><a class="link" href="product.html">Shop Series 01</a></div>';
      foot.innerHTML = '';
      return;
    }
    body.innerHTML = items.map(function (l) { return RF.lineHTML(l, true); }).join('');
    var sub = RF.cart.subtotal(), left = RF.FREE_OVER - sub, pct = Math.min(100, Math.round(sub / RF.FREE_OVER * 100));
    foot.innerHTML =
      '<div class="progress" role="status"><p>' + (left > 0 ? 'Add <b>' + RF.rm(left) + '</b> more for free delivery in Peninsular Malaysia.' : 'Free delivery in Peninsular Malaysia. RM8 to Sabah, Sarawak and Labuan.') + '</p>' +
      '<span class="bar" aria-hidden="true"><i style="width:' + pct + '%"></i></span></div>' +
      '<dl class="totals"><dt>Subtotal</dt><dd>' + RF.rm(sub) + '</dd><dt class="small">Delivery</dt><dd class="small">' + (left > 0 ? 'From ' + RF.rm(RF.SHIP.west) + ', at checkout' : 'Free or RM8, at checkout') + '</dd></dl>' +
      '<a class="btn block" href="checkout.html">Checkout · ' + RF.rm(RF.cart.subtotal()) + '</a>' +
      '<div class="pays" aria-label="Payment methods"><span>FPX</span><span>Visa</span><span>Mastercard</span><span>GrabPay</span></div>';
    if (sub < RF.FREE_OVER) {
      var ups = Object.keys(RF.CATALOG).filter(function (id) { return !items.some(function (l) { return l.id === id; }); });
      if (ups.length) body.insertAdjacentHTML('beforeend', '<div class="upsell"><span class="label">Complete the set</span>' + ups.map(function (id) {
        var p = RF.CATALOG[id];
        return '<button type="button" class="up" data-inc-new="' + id + '"><img src="' + RF.img(id) + '" alt=""><span>' + p.short + '<br><small>' + RF.rm(p.price) + '</small></span><b aria-hidden="true">+</b><span class="sr">Add ' + p.name + '</span></button>';
      }).join('') + '</div>');
    }
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-inc],[data-dec],[data-open-bag],[data-inc-new]');
    if (!t) return;
    if (t.hasAttribute('data-inc-new')) { RF.cart.add(t.dataset.incNew, 1); return; }
    if (t.hasAttribute('data-open-bag')) { e.preventDefault(); RF.openBag(); return; }
    var id = t.dataset.inc || t.dataset.dec, l = cart.find(function (x) { return x.id === id; });
    if (l) RF.cart.set(id, l.qty + (t.dataset.inc ? 1 : -1));
  });
  var lastFocus;
  RF.openBag = function () {
    if (!drawer) buildDrawer();
    renderDrawer(); lastFocus = document.activeElement;
    scrim.classList.add('on'); drawer.classList.add('on'); drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { $('[data-close]', drawer).focus(); }, 50);
  };
  RF.closeBag = function () {
    scrim.classList.remove('on'); drawer.classList.remove('on'); drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  };

  function paint() {
    var n = RF.cart.count();
    $$('.bag-count').forEach(function (el) { el.textContent = n; el.dataset.n = n; });
    renderDrawer();
  }
  paint();

  RF.addToBag = function (id, qty) {
    RF.cart.add(id, qty);
    RF.openBag();
  };

  /* ---------- toast ---------- */
  var toastEl, toastT;
  RF.toast = function (msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('on'); clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('on'); }, 2800);
  };

  /* ---------- mechanical click, synthesised ---------- */
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

  /* ---------- header ---------- */
  var header = $('.header');
  if (header) {
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }
  var menuBtn = $('.menu-btn'), nav = $('.nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () { menuBtn.setAttribute('aria-expanded', nav.classList.toggle('open')); });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', false); }); });
  }

  /* ---------- quick add buttons on cards ---------- */
  $$('[data-add]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); RF.addToBag(b.dataset.add, 1); });
  });

  /* ---------- waitlist (front end only until an email tool is chosen) ---------- */
  $$('form[data-waitlist]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = $('.form-note', f.parentNode), input = $('input', f);
      if (!input.value || input.validity.typeMismatch) { note.textContent = 'That email does not look right. Check it and try again.'; input.focus(); return; }
      note.textContent = 'You are on the list. We will email you once, on launch day.';
      input.value = '';
    });
  });

  var yr = $('[data-year]'); if (yr) yr.textContent = new Date().getFullYear();
  RF.still = still;
})();
