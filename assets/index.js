'use strict';

// ── EMAILJS ──────────────────────────────────────────
// ► Skopiuj te same klucze co w kalkulator-remont.html
const SITE_PUBLIC_KEY  = 'N3tcahgAQt4LRFqwF';
const SITE_SERVICE_ID  = 'service_dqgkcqk';
// ► Nowy szablon dla "Oddzwoń" – utwórz w EmailJS jako template_kontakt
//   Zmienne: {{client_name}}, {{client_phone}}, {{temat}}, {{message}}, {{data}}
const SITE_TPL_CALLBACK = 'template_p344dtf';
const SITE_OWNER_EMAIL  = 'wilguckidariusz6@gmail.com';

emailjs.init({ publicKey: SITE_PUBLIC_KEY });

// ── NAVBAR ───────────────────────────────────────────
const navbar     = document.getElementById('navbar');
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
  const bt = document.getElementById('back-top');
  if (window.scrollY > 400) { bt.style.opacity = '1'; bt.style.pointerEvents = 'auto'; }
  else                       { bt.style.opacity = '0'; bt.style.pointerEvents = 'none'; }
}, { passive: true });

hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
function closeMenu() { mobileMenu.classList.remove('open'); }

// ── ACTIVE NAV na scroll ─────────────────────────────
const navObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      const a = document.querySelector(`.nav-link[href="#${e.target.id}"]`);
      if (a) a.classList.add('active');
    }
  });
}, { threshold: 0.4 });
document.querySelectorAll('section[id]').forEach(s => navObs.observe(s));

// ── REVEAL ANIMATIONS ────────────────────────────────
const revObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revObs.unobserve(e.target); } });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => revObs.observe(el));

// ── COUNTER ANIMATION ────────────────────────────────
const cntObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, target = +el.dataset.target, dur = 1400;
    let cur = 0;
    const t = setInterval(() => { cur++; el.textContent = cur; if (cur >= target) { clearInterval(t); el.textContent = target; }}, dur / target);
    cntObs.unobserve(el);
  });
}, { threshold: 0.5 });
document.querySelectorAll('.counter').forEach(el => cntObs.observe(el));

// ── GALERIA FILTROWANIE ──────────────────────────────
function filterGallery(cat) {
  document.querySelectorAll('.gallery-filter').forEach(btn => {
    const on = btn.dataset.filter === cat;
    btn.style.borderColor = on ? '#FAA808' : '';
    btn.style.color = on ? '#FAA808' : '';
    btn.classList.toggle('border-gray-700', !on);
    btn.classList.toggle('text-gray-400', !on);
  });
  document.querySelectorAll('.gallery-item').forEach(item => {
    item.style.display = (cat === 'all' || item.dataset.cat === cat) ? '' : 'none';
  });
}

// ── LIGHTBOX ─────────────────────────────────────────
function openLightbox(src, cap) {
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox-caption').textContent = cap;
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

// ── FORMULARZ ODDZWONIENIE ───────────────────────────
async function sendCallback() {
  const imie  = document.getElementById('cb-imie').value.trim();
  const tel   = document.getElementById('cb-tel').value.trim();
  const temat = document.getElementById('cb-temat').value;
  const msg   = document.getElementById('cb-msg').value.trim();
  const rodo  = document.getElementById('cb-rodo').checked;
  const errEl = document.getElementById('cb-err');
  const okEl  = document.getElementById('cb-ok');

  const errors = [];
  ['cb-imie','cb-tel'].forEach(id => document.getElementById(id).classList.remove('inp-error'));

  if (!imie || imie.length < 3) { document.getElementById('cb-imie').classList.add('inp-error'); errors.push('Podaj imię i nazwisko (min. 3 znaki).'); }

  const cyfry = tel.replace(/[\s\-\(\)\+]/g, '');
  if (!cyfry || !/^\d+$/.test(cyfry) || cyfry.length < 9) { document.getElementById('cb-tel').classList.add('inp-error'); errors.push('Podaj prawidłowy numer telefonu (min. 9 cyfr).'); }

  if (!rodo) errors.push('Zaznacz zgodę na przetwarzanie danych.');

  if (errors.length) { errEl.textContent = errors.join(' '); errEl.classList.remove('hidden'); okEl.classList.add('hidden'); return; }
  errEl.classList.add('hidden');

  const btn = document.getElementById('cb-btn');
  btn.disabled = true;
  btn.innerHTML = '<svg class="animate-spin w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>Wysyłanie...';

  try {
    await emailjs.send(SITE_SERVICE_ID, SITE_TPL_CALLBACK, {
      to_email: SITE_OWNER_EMAIL, client_name: imie, client_phone: tel,
      temat: temat || 'Nie wybrano', message: msg || '(brak)', data: new Date().toLocaleString('pl-PL'),
    });
    okEl.classList.remove('hidden');
    ['cb-imie','cb-tel','cb-msg'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('cb-temat').selectedIndex = 0;
    document.getElementById('cb-rodo').checked = false;
  } catch (err) {
    console.error(err);
    if (SITE_PUBLIC_KEY === 'TWOJ_PUBLIC_KEY') {
      okEl.classList.remove('hidden');
      ['cb-imie','cb-tel','cb-msg'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('cb-temat').selectedIndex = 0;
      document.getElementById('cb-rodo').checked = false;
    } else {
      errEl.textContent = 'Błąd wysyłki. Zadzwoń do nas bezpośrednio.';
      errEl.classList.remove('hidden');
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg> Poproś o oddzwonienie';
  }
}

// ── CALENDLY POPUP ───────────────────────────────────
const CALENDLY_URL = 'https://calendly.com/wilguckidariusz6/30min';
function openCalendly() {
  if (typeof Calendly !== 'undefined') {
    Calendly.initPopupWidget({ url: CALENDLY_URL });
  } else {
    window.open(CALENDLY_URL, '_blank');
  }
}
