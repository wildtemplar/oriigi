/* =====================================================================
   ori · igi — ordering logic
   Vanilla port of the Claude Design prototype (support.js / DCLogic).
   ===================================================================== */
(function () {
  'use strict';

  /* ----------------------------- data ----------------------------- */
  const DISHES = [
    { name: 'Jollof Rice',  cat: 'Rice',        price: 3500, img: 'assets/dish-jollof-rice.png',  orb: ['#F0A85A', '#D2542A', '#8E2C16'] },
    { name: 'Fried Rice',   cat: 'Rice',        price: 3500, img: 'assets/dish-fried-rice.png',   orb: ['#E8D08A', '#B7A24A', '#6E6A2A'] },
    { name: 'Ofada Rice',   cat: 'Rice',        price: 3000, img: 'assets/dish-ofada-rice.png',   orb: ['#FBF3E4', '#E7D8B8', '#C9B78C'] },
    { name: 'Pounded Yam',  cat: 'Swallow',     price: 3100, img: 'assets/dish-pounded-yam.png',  orb: ['#F6E6B0', '#E4C878', '#B99A44'] },
    { name: 'Eba',          cat: 'Swallow',     price: 3100, img: 'assets/dish-eba.png',          orb: ['#F2C766', '#D89A34', '#9E6A1E'] },
    { name: 'Amala',        cat: 'Swallow',     price: 3100, img: 'assets/dish-amala.png',        orb: ['#8A6A54', '#5E4634', '#38271C'] },
    { name: 'Small Chops',  cat: 'Small Chops', price: 3500, img: 'assets/dish-small-chops.png',  orb: ['#F0C070', '#D18A3A', '#8E561E'] },
  ];
  const CATS = ['Rice', 'Swallow', 'Small Chops'];
  const CAT_START = { 'Rice': 0, 'Swallow': 3, 'Small Chops': 6 };
  const ACCENT_BY_CAT = { 'Rice': '#C06A2E', 'Swallow': '#7E2430', 'Small Chops': '#8C3A5A' };
  const KICKER = ['◐ RICE', '◐ SWALLOW', '☾ SMALL CHOPS'];
  const FAQS = [
    { q: 'How far ahead should I book?', a: 'Three days for orders under 60 guests, seven days for weddings and corporate volumes. Rush orders are sometimes possible, so call us and we will try.' },
    { q: 'Do you deliver and set up?', a: 'Yes. Delivery covers Lagos and environs, and we can bring warmers, chafing dishes, servers and full setup for an added fee, quoted with your estimate.' },
    { q: 'Can you cater dietary needs?', a: 'We flag vegetarian, low-heat and no-shellfish options across the menu, and can build a fully custom spread for allergies on request.' },
    { q: 'What is the minimum order?', a: 'The minimum order is 20 plates, or the equivalent across the menu.' },
  ];

  const REGION = 2000;
  const FEATURED_INDEX = 3;
  const N = DISHES.length;
  const DELIVERY_RATE = 0.15;
  const SERVICE_RATE = 0.40;

  /* =====================================================================
     BUSINESS CONTACT  —  EDIT THIS ONE LINE
     Put ori · igi's real number here in international format: country code
     first, digits only, no "+", no spaces or dashes.
     e.g. Nigerian line 0803 221 8890  ->  '2348032218890'
     Used by "Make a call", "Chat on WhatsApp" and the booking message.
     ===================================================================== */
  const BUSINESS_PHONE = '2347073965446';           // +234 707 396 5446
  const TEL_HREF = 'tel:+' + BUSINESS_PHONE;
  const WA_BASE  = 'https://wa.me/' + BUSINESS_PHONE;
  const waLink = (text) => WA_BASE + (text ? '?text=' + encodeURIComponent(text) : '');

  /* =====================================================================
     GOOGLE SHEET LOGGING  —  PASTE YOUR APPS SCRIPT URL HERE
     Deploy the script in google-apps-script/Code.gs as a Web App, then paste
     its ".../exec" URL below. Leave '' to disable logging (nothing breaks).
     See google-apps-script/SETUP.md for the click-by-click steps.
     ===================================================================== */
  const SHEETS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxpJEujZNoewJBqJxHXjb59WwJyCWwSFIdhi_bygv96dH4jj0ooratYIErUVQMqZaov/exec';

  const naira = (n) => '₦' + n.toLocaleString('en-NG');

  /* --------------------------- app state -------------------------- */
  const state = {
    p: 0,
    menuOpen: false,
    basketOpen: false,
    basket: [],          // { name, price, guests }
    bulkGuests: 20,
    openFaq: 0,
    serviceIncluded: false,
    booked: false,
    bookedViaWhatsApp: false,
    contact: { name: '', phone: '', address: '', email: '' },
  };

  /* ----------------------------- dom ------------------------------ */
  const $ = (id) => document.getElementById(id);
  const screen      = $('screen');
  const heroGlow    = $('heroGlow');
  const progressBar = $('progressBar');
  const kicker      = $('kicker');
  const heroGhost   = $('heroGhost');
  const idxCounter  = $('idxCounter');
  const scrollHint  = $('scrollHint');
  const arcLayer    = $('arcLayer');
  const plateStage  = $('plateStage');
  const tabsEl      = $('tabs');
  const jumpMenu    = $('jumpMenu');
  const jumpItems   = $('jumpItems');
  const cartBtn     = $('cartBtn');
  const basketPanel = $('basketPanel');
  const basketBody  = $('basketBody');
  const calcRoot    = $('calcRoot');
  const faqRoot     = $('faqRoot');

  /* --------- build static-ish structure once (arc + plate + tabs) --- */
  const arcNodes = DISHES.map((d, i) => {
    const el = document.createElement('div');
    el.className = 'arc-card';
    el.dataset.i = i;
    const med = document.createElement('div');
    med.className = 'arc-med';
    med.style.background = 'radial-gradient(circle at 34% 28%, ' + d.orb[0] + ' 0%, ' + d.orb[1] + ' 48%, ' + d.orb[2] + ' 100%)';
    const name = document.createElement('div');
    name.className = 'arc-name';
    name.textContent = d.name;
    const price = document.createElement('div');
    price.className = 'arc-price';
    price.textContent = naira(d.price) + ' / plate';
    el.append(med, name, price);
    el.addEventListener('click', () => jumpToIndex(i));
    arcLayer.appendChild(el);
    return el;
  });

  const plateNodes = DISHES.map((d, i) => {
    const layer = document.createElement('div');
    layer.className = 'plate-layer';
    const inner = d.img
      ? '<img src="' + d.img + '" alt="' + d.name + '">'
      : '<div class="plate-ph"><div class="orb" style="background:radial-gradient(circle at 34% 28%,' + d.orb[0] + ',' + d.orb[1] + ' 48%,' + d.orb[2] + ')"></div><div class="txt">' + d.name + '</div></div>';
    layer.innerHTML =
      '<div class="plate-card">' +
        '<div class="plate-img">' + inner + '</div>' +
        '<div class="plate-meta">' +
          '<div>' +
            '<div class="plate-name">' + d.name + '</div>' +
            '<div class="plate-price">' + naira(d.price) + ' / plate</div>' +
          '</div>' +
          '<button class="plate-add" type="button" title="Add to basket" data-name="' + d.name + '" data-price="' + d.price + '">+</button>' +
        '</div>' +
      '</div>';
    layer.querySelector('.plate-add').addEventListener('click', (e) => {
      addToOrder(e.currentTarget.dataset.name, +e.currentTarget.dataset.price);
    });
    plateStage.appendChild(layer);
    return layer;
  });

  CATS.forEach((c) => {
    const t = document.createElement('div');
    t.className = 'tab';
    t.dataset.cat = c;
    t.textContent = c;
    t.addEventListener('click', () => jumpToCat(c));
    tabsEl.appendChild(t);

    const mi = document.createElement('div');
    mi.className = 'jump-item';
    mi.dataset.cat = c;
    mi.textContent = c;
    mi.addEventListener('click', () => { jumpToCat(c); state.menuOpen = false; jumpMenu.classList.remove('is-open'); });
    jumpItems.appendChild(mi);
  });
  const tabNodes = Array.from(tabsEl.children);
  const jumpNodes = Array.from(jumpItems.children);

  /* --------------------------- hero render ------------------------ */
  let lastIdx = -1;
  function renderHero() {
    const p = state.p;
    const AF = p * (N - 1);
    const idx = Math.min(N - 1, Math.max(0, Math.round(AF)));
    const active = DISHES[idx];
    const cat = active.cat;

    // arc cards
    for (let i = 0; i < N; i++) {
      const off = i - AF, a = Math.abs(off);
      const scale = Math.max(0.5, 1 - a * 0.16);
      const x = off * 300, y = 40 + off * off * 44, rot = off * 8;
      const opacity = a < 2.3 ? 1 : Math.max(0, 3.3 - a);
      const el = arcNodes[i];
      el.style.transform =
        'translate(-50%,-50%) translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + rot.toFixed(1) + 'deg) scale(' + scale.toFixed(3) + ')';
      el.style.opacity = opacity.toFixed(3);
      el.style.zIndex = Math.round(10 - a * 2);
    }

    // plate crossfade
    if (idx !== lastIdx) {
      plateNodes.forEach((l, i) => l.classList.toggle('is-active', i === idx));
      lastIdx = idx;

      const catIdx = CATS.indexOf(cat);
      kicker.innerHTML = KICKER[catIdx];
      heroGhost.textContent = 'Choose your ' + cat.toLowerCase();
      idxCounter.textContent = String(idx + 1).padStart(2, '0') + ' / 0' + N;
      heroGlow.style.backgroundColor = ACCENT_BY_CAT[cat];
      heroGlow.style.opacity = '0.28';
      tabNodes.forEach((t) => t.classList.toggle('is-active', t.dataset.cat === cat));
      jumpNodes.forEach((t) => t.classList.toggle('is-active', t.dataset.cat === cat));
    }

    progressBar.style.width = (p * 100).toFixed(2) + '%';
    scrollHint.style.opacity = Math.max(0, 1 - p * 6).toFixed(3);
  }

  /* --------------------------- scrolling -------------------------- */
  let raf = null;
  screen.addEventListener('scroll', () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = null;
      const p = Math.max(0, Math.min(1, screen.scrollTop / REGION));
      if (Math.abs(p - state.p) > 0.0012) { state.p = p; renderHero(); }
    });
  }, { passive: true });

  function jumpToIndex(i) {
    screen.scrollTo({ top: (i / (N - 1)) * REGION, behavior: 'smooth' });
  }
  function jumpToCat(c) { jumpToIndex(CAT_START[c]); }

  /* ----------------------------- basket --------------------------- */
  function addToOrder(name, price) {
    const idx = state.basket.findIndex((b) => b.name === name);
    if (idx >= 0) state.basket[idx].guests += 20;
    else state.basket.push({ name, price, guests: 20 });
    state.basketOpen = true;
    renderBasket();
    renderCalc();
  }
  function removeItem(name) {
    state.basket = state.basket.filter((b) => b.name !== name);
    renderBasket(); renderCalc();
  }
  function incGuests(name) {
    const b = state.basket.find((x) => x.name === name);
    if (b) { b.guests += 10; renderBasket(); renderCalc(); }
  }
  function decGuests(name) {
    const b = state.basket.find((x) => x.name === name);
    if (b) { b.guests = Math.max(20, b.guests - 10); renderBasket(); renderCalc(); }
  }

  function totals() {
    const has = state.basket.length > 0;
    const subtotal = state.basket.reduce((s, b) => s + b.price * b.guests, 0);
    const delivery = has ? Math.round(subtotal * DELIVERY_RATE) : 0;
    const base = subtotal + delivery;
    const service = state.serviceIncluded ? Math.round(base * SERVICE_RATE) : 0;
    const est = has ? base + service : 0;
    return { has, subtotal, delivery, service, est };
  }

  /* --------------------------- basket panel ----------------------- */
  function renderBasket() {
    cartBtn.textContent = 'BASKET · ' + state.basket.length;
    basketPanel.classList.toggle('is-open', state.basketOpen);

    if (!state.basket.length) {
      basketBody.innerHTML = '<div class="basket-empty">No dishes yet — tap + on any dish to add it.</div>';
      return;
    }
    basketBody.innerHTML = state.basket.map((b) =>
      '<div class="basket-row">' +
        '<div class="top">' +
          '<div class="name">' + b.name + '</div>' +
          '<button class="x-btn" data-act="rm" data-name="' + b.name + '">✕</button>' +
        '</div>' +
        '<div class="qty" style="justify-content:space-between">' +
          '<div class="qty">' +
            '<button class="qbtn" data-act="dec" data-name="' + b.name + '">–</button>' +
            '<span class="qval">' + b.guests + ' guests</span>' +
            '<button class="qbtn" data-act="inc" data-name="' + b.name + '">+</button>' +
          '</div>' +
          '<div class="line-total">' + naira(b.price * b.guests) + '</div>' +
        '</div>' +
      '</div>'
    ).join('') +
    '<div class="basket-foot"><button class="basket-book" data-act="book" type="button">Make a Booking</button></div>';
  }
  basketBody.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act]'); if (!t) return;
    const name = t.dataset.name;
    if (t.dataset.act === 'rm') removeItem(name);
    if (t.dataset.act === 'inc') incGuests(name);
    if (t.dataset.act === 'dec') decGuests(name);
    if (t.dataset.act === 'book') goToEstimate();
  });
  cartBtn.addEventListener('click', () => {
    state.basketOpen = !state.basketOpen;
    basketPanel.classList.toggle('is-open', state.basketOpen);
  });

  // Basket "Make a Booking" → close the basket and jump to the Volume Estimate
  // section (the calculator already reflects the same basket, so it's pre-filled).
  function goToEstimate() {
    state.basketOpen = false;
    basketPanel.classList.remove('is-open');
    const est = document.getElementById('estimate');
    if (est) est.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ------------------------ volume calculator --------------------- */
  function renderCalc() {
    const c = state.contact;
    const { has, subtotal, delivery, service, est } = totals();

    if (state.booked) {
      // adaptive confirmation copy
      let bodyText;
      if (c.name.trim()) {
        bodyText = 'Thanks ' + esc(c.name) + ', we\'ve received your order' +
          (c.phone.trim() ? ' and will reach out at ' + esc(c.phone) : '') +
          (c.address.trim() ? ' to confirm delivery to ' + esc(c.address) : '') + '.';
      } else {
        bodyText = 'We\'ve received your order and will confirm the details with you shortly.';
      }
      if (state.bookedViaWhatsApp) bodyText += ' We\'ve also opened WhatsApp so you can send us a message directly.';

      // only offer a WhatsApp copy if they booked WITHOUT it (avoids a duplicate log)
      const waCopyBtn = state.bookedViaWhatsApp ? '' :
        '<a class="btn btn-cream" href="' + waLink(buildOrderMessage()) + '" target="_blank" rel="noopener">Send a copy on WhatsApp</a>';

      calcRoot.innerHTML =
        '<div class="booked">' +
          '<h3>Booking received ✓</h3>' +
          '<p>' + bodyText + '</p>' +
          '<div class="sum-lbl">ORDER SUMMARY</div>' +
          state.basket.map((b) => '<div class="sum-line"><span>' + b.name + ' — ' + b.guests + ' guests</span><span>' + naira(b.price * b.guests) + '</span></div>').join('') +
          '<div class="sum-total"><span>Total</span><span>' + naira(est) + '</span></div>' +
          '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
            waCopyBtn +
            '<button class="btn" id="resetBtn" style="background:transparent;color:var(--cream-text);border:1px solid rgba(255,255,255,.28)" type="button">Start a new order</button>' +
          '</div>' +
        '</div>';
      $('resetBtn').addEventListener('click', () => {
        state.booked = false; state.bookedViaWhatsApp = false; state.basket = []; state.serviceIncluded = false;
        state.contact = { name: '', phone: '', address: '', email: '' };
        renderBasket(); renderCalc();
      });
      return;
    }

    const orderBlock = has
      ? state.basket.map((b) =>
          '<div class="order-row">' +
            '<div><div class="oname">' + b.name + '</div><div class="oeach">' + naira(b.price) + ' / plate</div></div>' +
            '<div class="dqty">' +
              '<button class="dqbtn" data-act="dec" data-name="' + b.name + '">–</button>' +
              '<span class="dqval">' + b.guests + ' guests</span>' +
              '<button class="dqbtn" data-act="inc" data-name="' + b.name + '">+</button>' +
            '</div>' +
            '<div class="oline">' + naira(b.price * b.guests) + '</div>' +
            '<button class="orm" data-act="rm" data-name="' + b.name + '">✕</button>' +
          '</div>'
        ).join('') +
        '<div class="bulk-row">' +
          '<input type="range" min="20" max="1000" step="10" value="' + state.bulkGuests + '" id="bulkRange">' +
          '<span class="bulk-lbl">' + state.bulkGuests + ' guests each</span>' +
          '<button class="btn btn-cream" id="applyBulk" style="height:38px;padding:0 18px;font-size:11px" type="button">Apply to all</button>' +
        '</div>' +
        '<label class="service-toggle">' +
          '<input type="checkbox" id="serviceChk"' + (state.serviceIncluded ? ' checked' : '') + '>' +
          '<span>Add full service — crockery, waiters &amp; servers</span>' +
        '</label>'
      : '<div class="order-empty">No dishes in your order yet. Tap the + on any dish above to add it — each starts at a 20-guest minimum.</div>';

    calcRoot.innerHTML =
      '<div class="calc">' +
        '<div class="calc-main">' +
          '<div class="calc-title">Your order</div>' +
          orderBlock +
        '</div>' +
        '<div class="calc-side">' +
          '<div class="summary">' +
            '<div class="line"><span>Subtotal</span><span>' + naira(subtotal) + '</span></div>' +
            '<div class="line"><span>Delivery &amp; setup</span><span>' + naira(delivery) + '</span></div>' +
            '<div class="line"><span>Service</span><span>' + naira(service) + '</span></div>' +
            '<div class="total"><span>Total</span><span>' + naira(est) + '</span></div>' +
          '</div>' +
          '<div class="contact-block">' +
            '<div class="contact-lbl">CONTACT DETAILS</div>' +
            '<input data-field="name" placeholder="Full name" value="' + esc(c.name) + '">' +
            '<input data-field="phone" placeholder="Telephone number" value="' + esc(c.phone) + '">' +
            '<input data-field="address" placeholder="Delivery address" value="' + esc(c.address) + '">' +
            '<input data-field="email" placeholder="Email" value="' + esc(c.email) + '">' +
          '</div>' +
          '<button class="book-btn" id="bookBtn"' + (bookingReady() ? '' : ' disabled') + ' type="button">Make a Booking</button>' +
          '<div class="contact-actions">' +
            '<a href="' + TEL_HREF + '">Make a call</a>' +
            (has
              ? '<button type="button" id="waSendBtn">WhatsApp order</button>'
              : '<a href="' + waLink("Hello ori · igi, I'd like to ask about your catering.") + '" target="_blank" rel="noopener">Chat on WhatsApp</a>') +
          '</div>' +
        '</div>' +
      '</div>';

    // wire the freshly-rendered controls
    calcRoot.querySelectorAll('[data-act]').forEach((t) => {
      t.addEventListener('click', () => {
        const name = t.dataset.name;
        if (t.dataset.act === 'rm') removeItem(name);
        if (t.dataset.act === 'inc') incGuests(name);
        if (t.dataset.act === 'dec') decGuests(name);
      });
    });
    const bulkRange = $('bulkRange');
    if (bulkRange) {
      bulkRange.addEventListener('input', (e) => {
        state.bulkGuests = +e.target.value;
        e.target.nextElementSibling.textContent = state.bulkGuests + ' guests each';
      });
    }
    const applyBulk = $('applyBulk');
    if (applyBulk) applyBulk.addEventListener('click', () => {
      state.basket.forEach((b) => { b.guests = state.bulkGuests; });
      renderBasket(); renderCalc();
    });
    const serviceChk = $('serviceChk');
    if (serviceChk) serviceChk.addEventListener('change', () => {
      state.serviceIncluded = serviceChk.checked; renderCalc();
    });
    calcRoot.querySelectorAll('[data-field]').forEach((inp) => {
      inp.addEventListener('input', (e) => {
        state.contact[e.target.dataset.field] = e.target.value;
        const bb = $('bookBtn'); if (bb) bb.disabled = !bookingReady();
      });
    });
    const bookBtn = $('bookBtn');
    if (bookBtn) bookBtn.addEventListener('click', () => submitBooking(false));
    const waSendBtn = $('waSendBtn');
    if (waSendBtn) waSendBtn.addEventListener('click', () => submitBooking(true));
  }

  // Single path for finalising an order.
  //   viaWhatsApp = false → "Make a Booking": save to Sheets, show confirmation.
  //   viaWhatsApp = true  → "Send order on WhatsApp": save to Sheets AND open WhatsApp.
  // Either way the order is stored in Google Sheets.
  function submitBooking(viaWhatsApp) {
    if (!state.basket.length) return;                 // need at least one dish
    if (!viaWhatsApp && !bookingReady()) return;      // a full booking needs complete contact details
    logBookingToSheet(buildBookingPayload());          // always store the order
    if (viaWhatsApp) window.open(waLink(buildOrderMessage()), '_blank', 'noopener');
    state.booked = true;
    state.bookedViaWhatsApp = viaWhatsApp;
    renderCalc();
    calcRoot.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Full-detail snapshot of the order for the Google Sheet.
  function buildBookingPayload() {
    const c = state.contact;
    const t = totals();
    return {
      name: c.name, phone: c.phone, email: c.email, address: c.address,
      items: state.basket.map((b) => ({ name: b.name, guests: b.guests, priceEach: b.price, lineTotal: b.price * b.guests })),
      orderSummary: state.basket.map((b) => b.name + ' x' + b.guests + ' guests').join('; '),
      guestsTotal: state.basket.reduce((s, b) => s + b.guests, 0),
      subtotal: t.subtotal,
      delivery: t.delivery,
      serviceIncluded: state.serviceIncluded,
      serviceFee: t.service,
      total: t.est,
    };
  }

  // Fire-and-forget POST to the Apps Script Web App. 'no-cors' + text/plain keeps
  // it a "simple request" (no CORS preflight); the row still lands in the Sheet.
  function logBookingToSheet(payload) {
    if (!SHEETS_WEBAPP_URL) return;
    try {
      fetch(SHEETS_WEBAPP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      }).catch(function () {});
    } catch (e) { /* never block the booking on a logging failure */ }
  }

  // Compose the WhatsApp booking message from the current order + contact.
  function buildOrderMessage() {
    const c = state.contact;
    const { subtotal, delivery, service, est } = totals();
    const lines = [];
    lines.push('Hello ori · igi, I would like to book catering.');
    lines.push('');
    lines.push('ORDER');
    state.basket.forEach((b) => {
      lines.push('• ' + b.name + ' — ' + b.guests + ' guests — ' + naira(b.price * b.guests));
    });
    lines.push('');
    lines.push('Subtotal: ' + naira(subtotal));
    lines.push('Delivery & setup: ' + naira(delivery));
    if (state.serviceIncluded) lines.push('Full service: ' + naira(service));
    lines.push('Total: ' + naira(est));
    lines.push('');
    lines.push('CONTACT');
    lines.push('Name: ' + c.name);
    lines.push('Phone: ' + c.phone);
    lines.push('Address: ' + c.address);
    lines.push('Email: ' + c.email);
    return lines.join('\n');
  }

  function bookingReady() {
    const c = state.contact;
    return state.basket.length > 0 && c.name.trim() && c.phone.trim() && c.address.trim() && c.email.trim();
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  }

  /* ------------------------------ FAQ ----------------------------- */
  function renderFaq() {
    faqRoot.innerHTML = FAQS.map((f, i) =>
      '<div class="faq-row' + (state.openFaq === i ? ' is-open' : '') + '" data-i="' + i + '">' +
        '<div class="faq-q"><div class="q">' + f.q + '</div><span class="faq-icon">+</span></div>' +
        '<div class="faq-a"><div class="inner">' + f.a + '</div></div>' +
      '</div>'
    ).join('');
    faqRoot.querySelectorAll('.faq-row').forEach((row) => {
      row.addEventListener('click', () => {
        const i = +row.dataset.i;
        state.openFaq = state.openFaq === i ? -1 : i;
        renderFaq();
      });
    });
  }

  /* -------------------------- nav toggles ------------------------- */
  $('jumpCaret').addEventListener('click', () => {
    state.menuOpen = !state.menuOpen;
    jumpMenu.classList.toggle('is-open', state.menuOpen);
  });
  $('fullMenuLink').addEventListener('click', () => jumpToCat('Rice'));
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.tabwrap')) { state.menuOpen = false; jumpMenu.classList.remove('is-open'); }
    if (!e.target.closest('.cart-wrap')) { state.basketOpen = false; basketPanel.classList.remove('is-open'); }
  });
  $('quoteForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.textContent = 'Sent ✓';
    setTimeout(() => { btn.textContent = 'Send'; e.target.reset(); }, 2200);
  });

  /* ----------------------------- boot ----------------------------- */
  renderBasket();
  renderCalc();
  renderFaq();
  renderHero();
  // land on the featured dish (Pounded Yam) like the prototype
  screen.scrollTop = (FEATURED_INDEX / (N - 1)) * REGION;
  state.p = Math.max(0, Math.min(1, screen.scrollTop / REGION));
  renderHero();
})();
