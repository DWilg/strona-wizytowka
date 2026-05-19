'use strict';

// ─────────────────────────────────────────────────────
//  KONFIGURACJA EMAILJS
//  Uzupełnij poniższe wartości po założeniu konta na emailjs.com
//  Instrukcja krok po kroku poniżej w komentarzach
// ─────────────────────────────────────────────────────

const EMAILJS_PUBLIC_KEY    = 'N3tcahgAQt4LRFqwF';      // Konto → API Keys → Public Key
const EMAILJS_SERVICE_ID    = 'service_dqgkcqk';      // Email Services → Service ID
const EMAILJS_TEMPLATE_OWNER  = 'template_p344dtf';     // Email Templates → Template ID (Twój mail)
const EMAILJS_TEMPLATE_CLIENT = 'template_d9g39ev';    // Email Templates → Template ID (mail klienta)

// Twój adres e-mail (właściciel firmy) – tu będą przychodziły wszystkie zapytania
const TWOJ_EMAIL = 'wilguckidariusz6@gmail.com';

// ─────────────────────────────────────────────────────
//  KONFIGURACJA WHATSAPP (CallMeBot – darmowe)
//  1. Wyślij na WhatsApp +34 644 68 40 60: "I allow callmebot to send me messages"
//  2. Dostaniesz API key w odpowiedzi – wklej poniżej
// ─────────────────────────────────────────────────────
const WHATSAPP_NUMER  = 'TWOJ_NUMER';   // Twój numer z kierunkowym, bez +, np. 48123456789
const WHATSAPP_APIKEY = 'TWOJ_APIKEY';  // API key od CallMeBot, np. 1234567
const WHATSAPP_WLACZONE = false;        // Zmień na true po uzupełnieniu danych powyżej

// Inicjalizacja EmailJS (uruchamia się raz przy ładowaniu strony)
emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

// ─────────────────────────────────────────────────────
//  TABELA CZYNNOŚCI I STAWEK (robocizna, zł/m² lub zł/szt.)
//  Stawki odzwierciedlają realia rynkowe dla Podkarpacia
//  Tutaj możesz łatwo edytować wszystkie ceny
// ─────────────────────────────────────────────────────

const CENY = {
  // ── DEMONTAŻ ──
  DEM_PLYTKI:        18,   // zł/m²  – skuwanie starych płytek
  DEM_TYNKI:         15,   // zł/m²  – skuwanie tynków / gładzi
  DEM_CERAMIKA:      120,  // zł/szt – demontaż ceramiki sanitarnej
  DEM_GRUNTOWANIE:   5,    // zł/m²  – gruntowanie
  GRUZ_WYWOZ:        600,  // zł/ryczałt – wynoszenie + utylizacja

  // ── PŁYTKI / FLIZOWANIE ──
  PLYTKI_STANDARD:   90,   // zł/m²  – format 30x30 do 60x60
  PLYTKI_WIELKI:     130,  // zł/m²  – wielki format ≥120x60
  PLYTKI_MOZAIKA:    150,  // zł/m²  – mozaika, cegiełki
  HYDROIZOLACJA:     25,   // zł/m²  – płynna folia + taśmy
  JOLLY:             18,   // zł/mb  – szlifowanie narożnika 45°
  FUGA_CEMENT:       8,    // zł/m²  – fugowanie cementowe (m² płytek)
  FUGA_EPOX:         22,   // zł/m²  – fugowanie epoksydowe
  STELAZ_WC:         450,  // zł/szt – montaż + zabudowa stelażu
  ODPLYW:            320,  // zł/szt – odpływ liniowy / brodzik
  BIALY_MONTAZ:      280,  // zł/szt – biały montaż (wanna/kabina/umywalka/bateria)

  // ── ŚCIANY I SUFITY ──
  TYNKOWANIE:        45,   // zł/m²  – tynkowanie maszynowe/ręczne
  GK:                55,   // zł/m²  – sufit podwieszany / ścianka GK
  GLADZIE_STANDARD:  30,   // zł/m²  – gładź gipsowa (2 warstwy + szlifowanie)
  GLADZIE_BEZPYL:    40,   // zł/m²  – gładź bezpyłowa
  MALOWANIE:         18,   // zł/m²  – malowanie 2 warstwy
  PANELE:            28,   // zł/m²  – układanie paneli + listwy przyścienne

  // ── INSTALACJE ──
  EL_GNIAZDKO:       180,  // zł/szt – przeniesienie gniazdka
  EL_WLACZNIK:       150,  // zł/szt – przeniesienie włącznika
  EL_SWIATLO:        200,  // zł/szt – punkt świetlny
  HYD_WODA:          350,  // zł/szt – podejście pod wodę
  HYD_KANAL:         400,  // zł/szt – podejście kanalizacyjne
};

// Bufor na górną granicę wyceny (15%)
const BUFOR_GORNY = 1.15;

// ─────────────────────────────────────────────────────
//  STAN APLIKACJI
// ─────────────────────────────────────────────────────

let currentStep = 1;
const TOTAL_STEPS = 6;

const KROK_NAZWY = [
  '',
  'Lokalizacja i dane',
  'Prace demontażowe',
  'Łazienka i płytki',
  'Ściany i sufity',
  'Instalacje',
  'Wycena i kontakt'
];

// ─────────────────────────────────────────────────────
//  HELPERS: radio/checkbox/format wybieranie
// ─────────────────────────────────────────────────────

function selectRadio(el) {
  const group = el.dataset.group;
  const val   = el.dataset.val;

  // Odznacz wszystkie w grupie
  document.querySelectorAll(`[data-group="${group}"]`).forEach(e => {
    e.classList.remove('selected');
    e.querySelectorAll('.radio-dot').forEach(d => d.style.borderColor = '');
    e.querySelectorAll('.inner-dot').forEach(d => d.classList.add('hidden'));
  });

  // Zaznacz wybrany
  el.classList.add('selected');
  el.querySelectorAll('.radio-dot').forEach(d => d.style.borderColor = '#FAA808');
  el.querySelectorAll('.inner-dot').forEach(d => d.classList.remove('hidden'));

  // Zapisz wartość do hidden inputa
  const hiddenId = {
    stan:        'stanInwestycji',
    gruz:        'gruzWywoz',
    fuga:        'fugaTyp',
    gladzie_typ: 'gladzieTyp',
    termin:      'termin'
  }[group];
  if (hiddenId) document.getElementById(hiddenId).value = val;

  // Specjalna logika: stan inwestycji zmienia widoczność kroku 2
  if (group === 'stan') handleStanChange(val);
}

function selectFormat(el) {
  document.querySelectorAll('.format-card').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('formatPlytki').value = el.dataset.val;
}

// ─────────────────────────────────────────────────────
//  LOGIKA STANU INWESTYCJI
// ─────────────────────────────────────────────────────

function handleStanChange(val) {
  const infoDew = document.getElementById('infoDeweloper');
  if (val === 'deweloperski') {
    infoDew.classList.remove('hidden');
  } else {
    infoDew.classList.add('hidden');
  }
}

// ─────────────────────────────────────────────────────
//  PASEK POSTĘPU
// ─────────────────────────────────────────────────────

function updateProgress(step) {
  const pct = (step / TOTAL_STEPS) * 100;
  document.getElementById('progressBar').style.width = pct + '%';
  document.getElementById('currentStepLabel').textContent = step;
  document.getElementById('stepNameLabel').textContent = KROK_NAZWY[step] || 'Wycena';

  // Kropki
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const dot = document.querySelector(`#dot${i} div`);
    if (dot) {
      if (i < step)       { dot.style.background = '#22c55e'; dot.className = 'w-3 h-3 rounded-full'; }
      else if (i === step){ dot.style.background = '#FAA808'; dot.className = 'w-3 h-3 rounded-full'; }
      else                { dot.style.background = ''; dot.className = 'w-3 h-3 rounded-full bg-gray-700'; }
    }
  }
}

// ─────────────────────────────────────────────────────
//  NAWIGACJA KROKÓW
// ─────────────────────────────────────────────────────

function showStep(n) {
  for (let i = 1; i <= 7; i++) {
    const s = document.getElementById('step' + i);
    if (s) s.classList.add('hidden');
  }
  const target = document.getElementById('step' + n);
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('fade-in');
    // scroll to top of step
    setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }
  currentStep = n;
  if (n <= TOTAL_STEPS) updateProgress(n);
}

function nextStep(from) {
  if (!validateStep(from)) return;

  // Przed krokiem 6 oblicz wycenę
  if (from === 5) {
    buildSummary();
  }
  showStep(from + 1);
}

function prevStep(from) {
  showStep(from - 1);
}

// ─────────────────────────────────────────────────────
//  WALIDACJA
// ─────────────────────────────────────────────────────

// Pola numeryczne dla każdego kroku
const NUM_FIELDS = {
  2: ['demPlytki', 'demTynki', 'demCeramika', 'demGruntowanie'],
  3: ['plPodloga', 'plSciany', 'hydro', 'jolly', 'stelaz', 'odplyw', 'bialyMontaz'],
  4: ['tynkowanie', 'gk', 'gladzie', 'malowanie', 'panele'],
  5: ['elGniazdko', 'elWlacznik', 'elSwiatlo', 'hydWoda', 'hydKanal'],
};

// Pokaż komunikat błędu w pasku pod krokiem
function showErr(errId, msgs) {
  const el = document.getElementById(errId);
  if (!el) return;
  el.textContent = '';
  const values = Array.isArray(msgs) ? msgs : [msgs];
  values.forEach(msg => {
    const span = document.createElement('span');
    span.className = 'block';
    span.textContent = `⚠ ${msg}`;
    el.appendChild(span);
  });
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 7000);
}

// Podświetl pole na czerwono + shake + auto-kasowanie po naprawie
function markError(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('inp-error', 'shake');
  el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
  const clear = () => { el.classList.remove('inp-error'); el.removeEventListener('change', clear); };
  el.addEventListener('input',  clear, { once: true });
  el.addEventListener('change', clear, { once: true });
}

// Podświetl "radio-pill" grupę na czerwono
function markRadioError(group) {
  document.querySelectorAll(`[data-group="${group}"]`).forEach(el => {
    el.style.borderColor = '#ef4444';
    el.style.boxShadow   = '0 0 0 3px rgba(239,68,68,0.18)';
    el.addEventListener('click', () => {
      document.querySelectorAll(`[data-group="${group}"]`).forEach(e => {
        e.style.borderColor = '';
        e.style.boxShadow   = '';
      });
    }, { once: true });
  });
}

// Napraw puste / ujemne pola numeryczne (auto-korekta do 0)
function sanitizeNumFields(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const v = parseFloat(el.value);
    if (isNaN(v) || el.value === '') { el.value = 0; return; }
    if (v < 0) el.value = 0;
  });
}

function validateStep(step) {
  const errId = 'err' + step;
  const errors = [];

  // ── Krok 1: lokalizacja i stan ──
  if (step === 1) {
    const lok  = document.getElementById('lokalizacja').value;
    const stan = document.getElementById('stanInwestycji').value;
    if (!lok)  { markError('lokalizacja'); errors.push('Wybierz miejscowość.'); }
    if (!stan) { markRadioError('stan');   errors.push('Wybierz stan inwestycji (deweloperski lub rynek wtórny).'); }
  }

  // ── Kroki 2–5: pola numeryczne – brak ujemnych ──
  if (NUM_FIELDS[step]) {
    sanitizeNumFields(NUM_FIELDS[step]);   // auto-fix pustych → 0
    NUM_FIELDS[step].forEach(id => {
      const val = parseFloat(document.getElementById(id).value);
      if (isNaN(val) || val < 0) {
        markError(id);
        errors.push(`Pole nie może być ujemne (${id}).`);
        document.getElementById(id).value = 0;
      }
    });
  }

  // ── Krok 3: format płytek i fuga (jeśli są m²) ──
  if (step === 3) {
    const plPod  = parseFloat(document.getElementById('plPodloga').value) || 0;
    const plSc   = parseFloat(document.getElementById('plSciany').value)  || 0;
    const format = document.getElementById('formatPlytki').value;
    const fuga   = document.getElementById('fugaTyp').value;

    if (plPod + plSc > 0) {
      if (!format) { markRadioError('format-dummy'); errors.push('Wybierz format płytek – masz wpisane m² płytek.'); document.querySelectorAll('.format-card').forEach(e => { e.style.borderColor='#ef4444'; setTimeout(()=>e.style.borderColor='',6000); }); }
      if (!fuga)   { markRadioError('fuga');          errors.push('Wybierz rodzaj fugi.'); }
    }
  }

  if (errors.length) { showErr(errId, errors); return false; }
  return true;
}

// ── Walidacja formularza kontaktowego (krok 6) ──
function validateContact() {
  const errors = [];
  const imie   = document.getElementById('kontaktImie').value.trim();
  const tel    = document.getElementById('kontaktTel').value.trim();
  const email  = document.getElementById('kontaktEmail').value.trim();
  const termin = document.getElementById('termin').value;
  const rodo   = document.getElementById('rodo').checked;

  if (!imie) {
    markError('kontaktImie');
    errors.push('Podaj imię i nazwisko.');
  } else if (imie.length < 3) {
    markError('kontaktImie');
    errors.push('Imię i nazwisko jest za krótkie (min. 3 znaki).');
  } else if (imie.length > 60) {
    markError('kontaktImie');
    errors.push('Imię i nazwisko jest za długie (max. 60 znaków).');
  }

  if (!tel) {
    markError('kontaktTel');
    errors.push('Podaj numer telefonu.');
  } else {
    // Wyciągnij same cyfry (bez +, spacji, myślników, nawiasów)
    const sameCyfry = tel.replace(/[\s\-\(\)\+]/g, '');
    if (!/^\d+$/.test(sameCyfry)) {
      markError('kontaktTel');
      errors.push('Numer telefonu może zawierać tylko cyfry, spacje i znaki: + - ( )');
    } else if (sameCyfry.length < 9) {
      markError('kontaktTel');
      errors.push('Numer telefonu jest za krótki (min. 9 cyfr).');
    } else if (sameCyfry.length > 15) {
      markError('kontaktTel');
      errors.push('Numer telefonu jest za długi (max. 15 cyfr).');
    }
  }

  if (!email) {
    markError('kontaktEmail');
    errors.push('Podaj adres e-mail.');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    markError('kontaktEmail');
    errors.push('Adres e-mail wygląda nieprawidłowo (np. jan@example.com).');
  }

  if (!termin) {
    markRadioError('termin');
    errors.push('Wybierz preferowany termin realizacji.');
  }

  if (!rodo) {
    document.getElementById('rodo').style.outline = '2px solid #ef4444';
    setTimeout(() => document.getElementById('rodo').style.outline = '', 5000);
    errors.push('Zaznacz zgodę na przetwarzanie danych osobowych.');
  }

  if (errors.length) { showErr('err6', errors); return false; }
  return true;
}

// ─────────────────────────────────────────────────────
//  OBLICZENIA WYCENY
// ─────────────────────────────────────────────────────

function get(id) { return parseFloat(document.getElementById(id).value) || 0; }
function getStr(id) { return document.getElementById(id).value || ''; }

function buildSummary() {
  const items = [];   // { label, qty, unit, cena, total }
  let totalMin = 0;

  const plPod   = get('plPodloga');
  const plSc    = get('plSciany');
  const format  = getStr('formatPlytki');
  const fuga    = getStr('fugaTyp');
  const glTyp   = getStr('gladzieTyp') || 'standard';

  // Stawka za płytki zależna od formatu
  const stawkaPlytki = format === 'wielki' ? CENY.PLYTKI_WIELKI
                     : format === 'mozaika' ? CENY.PLYTKI_MOZAIKA
                     : CENY.PLYTKI_STANDARD;

  // Stawka za gładź
  const stawkaGladz = glTyp === 'bezpylowe' ? CENY.GLADZIE_BEZPYL : CENY.GLADZIE_STANDARD;

  // ─ DEMONTAŻ ─
  addItem(items, 'Demontaż starych płytek',         get('demPlytki'),    'm²',  CENY.DEM_PLYTKI);
  addItem(items, 'Skuwanie tynków / gładzi',        get('demTynki'),     'm²',  CENY.DEM_TYNKI);
  addItem(items, 'Demontaż ceramiki sanitarnej',    get('demCeramika'),  'szt', CENY.DEM_CERAMIKA);
  addItem(items, 'Gruntowanie powierzchni',         get('demGruntowanie'),'m²', CENY.DEM_GRUNTOWANIE);
  if (getStr('gruzWywoz') === 'tak') {
    addItem(items, 'Wynoszenie i utylizacja gruzu', 1, 'ryczałt', CENY.GRUZ_WYWOZ);
  }

  // ─ ŁAZIENKA ─
  const formatLabel = format === 'wielki' ? 'wielki format' : format === 'mozaika' ? 'mozaika/cegiełki' : 'standard';
  addItem(items, `Płytki podłogowe (${formatLabel})`, plPod, 'm²', stawkaPlytki);
  addItem(items, `Płytki ścienne (${formatLabel})`,   plSc,  'm²', stawkaPlytki);

  const totalPlytki = plPod + plSc;
  if (totalPlytki > 0) {
    addItem(items, fuga === 'epoksydowa' ? 'Fugowanie epoksydowe' : 'Fugowanie cementowe',
            totalPlytki, 'm²', fuga === 'epoksydowa' ? CENY.FUGA_EPOX : CENY.FUGA_CEMENT);
  }

  addItem(items, 'Hydroizolacja (folia+taśmy)',  get('hydro'),       'm²',  CENY.HYDROIZOLACJA);
  addItem(items, 'Szlifowanie narożników 45°',   get('jolly'),       'mb',  CENY.JOLLY);
  addItem(items, 'Stelaż WC (montaż+zabudowa)',  get('stelaz'),      'szt', CENY.STELAZ_WC);
  addItem(items, 'Odpływ liniowy / brodzik',     get('odplyw'),      'szt', CENY.ODPLYW);
  addItem(items, 'Biały montaż',                 get('bialyMontaz'), 'szt', CENY.BIALY_MONTAZ);

  // ─ ŚCIANY / SUFITY ─
  addItem(items, 'Tynkowanie / prostowanie ścian', get('tynkowanie'), 'm²', CENY.TYNKOWANIE);
  addItem(items, 'Płyty GK (sufit/ścianki)',       get('gk'),         'm²', CENY.GK);
  addItem(items, `Gładzie gipsowe (${glTyp})`,     get('gladzie'),    'm²', stawkaGladz);
  addItem(items, 'Malowanie (2 warstwy)',           get('malowanie'),  'm²', CENY.MALOWANIE);
  addItem(items, 'Panele podłogowe + listwy',       get('panele'),     'm²', CENY.PANELE);

  // ─ INSTALACJE ─
  addItem(items, 'Przeniesienie gniazdka el.',   get('elGniazdko'), 'szt', CENY.EL_GNIAZDKO);
  addItem(items, 'Przeniesienie włącznika el.',  get('elWlacznik'), 'szt', CENY.EL_WLACZNIK);
  addItem(items, 'Punkt świetlny',               get('elSwiatlo'),  'szt', CENY.EL_SWIATLO);
  addItem(items, 'Podejście hydrauliczne – woda', get('hydWoda'),   'szt', CENY.HYD_WODA);
  addItem(items, 'Podejście kanalizacyjne',       get('hydKanal'),  'szt', CENY.HYD_KANAL);

  // Suma
  totalMin = items.reduce((s, i) => s + i.total, 0);

  // Renderuj listę
  renderSummaryList(items);

  // Wyświetl wycenę
  const min = Math.round(totalMin / 100) * 100;
  const max = Math.round(totalMin * BUFOR_GORNY / 100) * 100;
  const mid = Math.round((min + max) / 2 / 100) * 100;

  document.getElementById('wycenaMin').textContent    = formatPLN(min);
  document.getElementById('wycenaMax').textContent    = formatPLN(max);
  document.getElementById('wycenaGlowna').textContent = formatPLN(min) + ' – ' + formatPLN(max) + ' zł';
}

function addItem(arr, label, qty, unit, cena) {
  if (qty <= 0) return;
  arr.push({ label, qty, unit, cena, total: qty * cena });
}

function formatPLN(n) {
  return n.toLocaleString('pl-PL');
}

function renderSummaryList(items) {
  const container = document.getElementById('summaryList');

  if (items.length === 0) {
    container.innerHTML = '<p class="p-4 text-gray-500 text-sm text-center">Brak wybranych prac – wróć i uzupełnij formularz.</p>';
    return;
  }

  const kategorieMap = {
    'Demontaż': ['Demontaż starych płytek','Skuwanie tynków / gładzi','Demontaż ceramiki sanitarnej','Gruntowanie powierzchni','Wynoszenie i utylizacja gruzu'],
  };

  // Definiuj kolory sekcji
  const sectionColors = {
    'Prace demontażowe': 'text-red-400',
    'Łazienka i flizowanie': 'text-blue-400',
    'Ściany, sufity, wykończenie': 'text-green-400',
    'Instalacje': 'text-yellow-400',
  };

  // Grupuj items
  function getSekcja(label) {
    if (['Demontaż starych płytek','Skuwanie tynków / gładzi','Demontaż ceramiki sanitarnej','Gruntowanie powierzchni','Wynoszenie i utylizacja gruzu'].includes(label)) return 'Prace demontażowe';
    if (['Płytki podłogowe (standard)','Płytki ścienne (standard)','Płytki podłogowe (wielki format)','Płytki ścienne (wielki format)','Płytki podłogowe (mozaika/cegiełki)','Płytki ścienne (mozaika/cegiełki)','Fugowanie cementowe','Fugowanie epoksydowe','Hydroizolacja (folia+taśmy)','Szlifowanie narożników 45°','Stelaż WC (montaż+zabudowa)','Odpływ liniowy / brodzik','Biały montaż'].some(k => label.startsWith(k.split('(')[0].trim()))) return 'Łazienka i flizowanie';
    if (['Tynkowanie','Płyty GK','Gładzie','Malowanie','Panele'].some(k => label.startsWith(k))) return 'Ściany, sufity, wykończenie';
    return 'Instalacje';
  }

  const groups = {};
  items.forEach(item => {
    const s = getSekcja(item.label);
    if (!groups[s]) groups[s] = [];
    groups[s].push(item);
  });

  container.textContent = '';
  Object.entries(groups).forEach(([sekcja, list]) => {
    const color = sectionColors[sekcja] || 'text-[#FAA808]';
    const sectionWrapper = document.createElement('div');
    sectionWrapper.className = 'border-b border-gray-800 last:border-0';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'px-4 py-2 bg-gray-900/80';
    const title = document.createElement('p');
    title.className = `text-xs font-bold uppercase tracking-wide ${color}`;
    title.textContent = sekcja;
    titleWrap.appendChild(title);
    sectionWrapper.appendChild(titleWrap);

    list.forEach(item => {
      const row = document.createElement('div');
      row.className = 'summary-row flex items-center justify-between px-4 py-2.5 text-sm';

      const left = document.createElement('div');
      const label = document.createElement('span');
      label.className = 'text-gray-200';
      label.textContent = item.label;
      const meta = document.createElement('span');
      meta.className = 'text-gray-500 ml-2 text-xs';
      meta.textContent = `${item.qty} ${item.unit} × ${formatPLN(item.cena)} zł`;
      left.appendChild(label);
      left.appendChild(meta);

      const totalCell = document.createElement('span');
      totalCell.className = 'font-semibold text-white whitespace-nowrap ml-4';
      totalCell.textContent = `${formatPLN(item.total)} zł`;

      row.appendChild(left);
      row.appendChild(totalCell);
      sectionWrapper.appendChild(row);
    });

    const sekcjaSum = list.reduce((s, i) => s + i.total, 0);
    const sumRow = document.createElement('div');
    sumRow.className = 'flex justify-between px-4 py-2 bg-gray-900/40 border-t border-gray-800/50';
    const sumLabel = document.createElement('span');
    sumLabel.className = 'text-xs text-gray-500';
    sumLabel.textContent = 'Suma sekcji';
    const sumValue = document.createElement('span');
    sumValue.className = 'text-xs font-bold text-gray-300';
    sumValue.textContent = `${formatPLN(sekcjaSum)} zł`;
    sumRow.appendChild(sumLabel);
    sumRow.appendChild(sumValue);
    sectionWrapper.appendChild(sumRow);

    container.appendChild(sectionWrapper);
  });

  // Wiersz łączny
  const total = items.reduce((s, i) => s + i.total, 0);
  const totalRow = document.createElement('div');
  totalRow.className = 'flex justify-between px-4 py-3 border-t';
  totalRow.style.background = 'rgba(250,168,8,0.1)';
  totalRow.style.borderColor = 'rgba(250,168,8,0.3)';
  const totalLabel = document.createElement('span');
  totalLabel.className = 'text-sm font-bold text-white';
  totalLabel.textContent = 'Razem (baza)';
  const totalValue = document.createElement('span');
  totalValue.className = 'text-sm font-black';
  totalValue.style.color = '#FAA808';
  totalValue.textContent = `${formatPLN(total)} zł`;
  totalRow.appendChild(totalLabel);
  totalRow.appendChild(totalValue);
  container.appendChild(totalRow);
}

// ─────────────────────────────────────────────────────
//  BUDOWANIE RAPORTU TEKSTOWEGO (do treści maila)
// ─────────────────────────────────────────────────────

function buildReportText() {
  const linie = [];
  const sep   = '─────────────────────────────────';

  linie.push('KALKULATOR WYCENY REMONTU – POWIAT PRZEMYSKI');
  linie.push('Data zapytania: ' + new Date().toLocaleString('pl-PL'));
  linie.push(sep);

  // Dane podstawowe
  linie.push('DANE PODSTAWOWE');
  linie.push('Miejscowość: '       + (getStr('lokalizacja') || '—'));
  linie.push('Stan inwestycji: '   + (getStr('stanInwestycji') === 'deweloperski' ? 'Stan deweloperski / surowy' : 'Rynek wtórny (remont)'));
  const pow = get('powierzchniaCalk');
  if (pow > 0) linie.push('Powierzchnia: ' + pow + ' m²');
  linie.push(sep);

  // Helper: dodaj wiersz tylko gdy qty > 0
  const row = (label, qty, unit, cena) => {
    if (qty <= 0) return;
    linie.push(`  • ${label}: ${qty} ${unit} × ${formatPLN(cena)} zł = ${formatPLN(qty * cena)} zł`);
  };

  // Demontaż
  const demPlytki  = get('demPlytki');
  const demTynki   = get('demTynki');
  const demCer     = get('demCeramika');
  const demGrunt   = get('demGruntowanie');
  const gruz       = getStr('gruzWywoz');
  if (demPlytki + demTynki + demCer + demGrunt > 0 || gruz === 'tak') {
    linie.push('PRACE DEMONTAŻOWE');
    row('Demontaż starych płytek', demPlytki, 'm²', CENY.DEM_PLYTKI);
    row('Skuwanie tynków / gładzi', demTynki, 'm²', CENY.DEM_TYNKI);
    row('Demontaż ceramiki sanitarnej', demCer, 'szt', CENY.DEM_CERAMIKA);
    row('Gruntowanie powierzchni', demGrunt, 'm²', CENY.DEM_GRUNTOWANIE);
    if (gruz === 'tak') linie.push(`  • Wynoszenie i utylizacja gruzu: ryczałt = ${formatPLN(CENY.GRUZ_WYWOZ)} zł`);
    linie.push(sep);
  }

  // Łazienka
  const plPod  = get('plPodloga');
  const plSc   = get('plSciany');
  const format = getStr('formatPlytki');
  const fuga   = getStr('fugaTyp');
  const stawkaPlytki = format === 'wielki' ? CENY.PLYTKI_WIELKI : format === 'mozaika' ? CENY.PLYTKI_MOZAIKA : CENY.PLYTKI_STANDARD;
  const formatLabel  = format === 'wielki' ? 'wielki format' : format === 'mozaika' ? 'mozaika/cegiełki' : 'standard';

  const lazSum = plPod + plSc + get('hydro') + get('jolly') + get('stelaz') + get('odplyw') + get('bialyMontaz');
  if (lazSum > 0) {
    linie.push('ŁAZIENKA I PRACE PŁYTKARSKIE');
    row(`Płytki podłogowe (${formatLabel})`, plPod, 'm²', stawkaPlytki);
    row(`Płytki ścienne (${formatLabel})`,   plSc,  'm²', stawkaPlytki);
    const totalPl = plPod + plSc;
    if (totalPl > 0) row(fuga === 'epoksydowa' ? 'Fugowanie epoksydowe' : 'Fugowanie cementowe', totalPl, 'm²', fuga === 'epoksydowa' ? CENY.FUGA_EPOX : CENY.FUGA_CEMENT);
    row('Hydroizolacja (folia + taśmy)', get('hydro'), 'm²', CENY.HYDROIZOLACJA);
    row('Szlifowanie narożników 45° (jolly)', get('jolly'), 'mb', CENY.JOLLY);
    row('Stelaż WC (montaż + zabudowa)', get('stelaz'), 'szt', CENY.STELAZ_WC);
    row('Odpływ liniowy / brodzik', get('odplyw'), 'szt', CENY.ODPLYW);
    row('Biały montaż', get('bialyMontaz'), 'szt', CENY.BIALY_MONTAZ);
    linie.push(sep);
  }

  // Ściany / sufity
  const glTyp     = getStr('gladzieTyp') || 'standard';
  const stawkaGl  = glTyp === 'bezpylowe' ? CENY.GLADZIE_BEZPYL : CENY.GLADZIE_STANDARD;
  const scSum = get('tynkowanie') + get('gk') + get('gladzie') + get('malowanie') + get('panele');
  if (scSum > 0) {
    linie.push('ŚCIANY, SUFITY I WYKOŃCZENIE');
    row('Tynkowanie / prostowanie ścian', get('tynkowanie'), 'm²', CENY.TYNKOWANIE);
    row('Płyty GK (sufit / ścianki)', get('gk'), 'm²', CENY.GK);
    row(`Gładzie gipsowe (${glTyp})`, get('gladzie'), 'm²', stawkaGl);
    row('Malowanie (2 warstwy)', get('malowanie'), 'm²', CENY.MALOWANIE);
    row('Panele podłogowe + listwy', get('panele'), 'm²', CENY.PANELE);
    linie.push(sep);
  }

  // Instalacje
  const instSum = get('elGniazdko') + get('elWlacznik') + get('elSwiatlo') + get('hydWoda') + get('hydKanal');
  if (instSum > 0) {
    linie.push('INSTALACJE');
    row('Przeniesienie gniazdka el.', get('elGniazdko'), 'szt', CENY.EL_GNIAZDKO);
    row('Przeniesienie włącznika el.', get('elWlacznik'), 'szt', CENY.EL_WLACZNIK);
    row('Punkt świetlny', get('elSwiatlo'), 'szt', CENY.EL_SWIATLO);
    row('Podejście hydrauliczne – woda', get('hydWoda'), 'szt', CENY.HYD_WODA);
    row('Podejście kanalizacyjne', get('hydKanal'), 'szt', CENY.HYD_KANAL);
    linie.push(sep);
  }

  // Uwagi
  const uwagi = getStr('uwagi');
  if (uwagi) {
    linie.push('DODATKOWE UWAGI KLIENTA');
    linie.push(uwagi);
    linie.push(sep);
  }

  // Wycena
  linie.push('SZACUNKOWA WYCENA ROBOCIZNY');
  linie.push(document.getElementById('wycenaGlowna').textContent);
  linie.push('(bez kosztów materiałów, zakres od–do)');
  linie.push(sep);
  linie.push('Wycena ma charakter szacunkowy. Ostateczny kosztorys');
  linie.push('po bezpłatnych oględzinach i pomiarach na obiekcie.');

  return linie.join('\n');
}

// ─────────────────────────────────────────────────────
//  SUBMIT FORMULARZA – wysyłka przez EmailJS
// ─────────────────────────────────────────────────────

async function submitForm() {
  // Walidacja pól kontaktowych przed wysyłką
  if (!validateContact()) return;

  const imie  = document.getElementById('kontaktImie').value.trim();
  const tel   = document.getElementById('kontaktTel').value.trim();
  const email = document.getElementById('kontaktEmail').value.trim();
  const termin = document.getElementById('termin').value;

  // Zablokuj przycisk i pokaż loader
  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.innerHTML = `<svg class="animate-spin w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24">
    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>Wysyłanie...`;

  const terminLabel = {
    jak_najszybciej: 'Jak najszybciej',
    zima: 'Zima', wiosna: 'Wiosna', lato: 'Lato', jesien: 'Jesień'
  }[termin] || termin;

  const stanLabel = getStr('stanInwestycji') === 'deweloperski'
    ? 'Stan deweloperski / surowy'
    : 'Rynek wtórny (remont)';

  const raport = buildReportText();

  // Wspólne zmienne dla obu szablonów
  const templateVars = {
    client_name:    imie,
    client_phone:   tel,
    client_email:   email || '(nie podano)',
    lokalizacja:    getStr('lokalizacja'),
    stan:           stanLabel,
    termin:         terminLabel,
    wycena:         document.getElementById('wycenaGlowna').textContent,
    wycena_min:     document.getElementById('wycenaMin').textContent + ' zł',
    wycena_max:     document.getElementById('wycenaMax').textContent + ' zł',
    raport:         raport,
    uwagi:          getStr('uwagi') || '(brak)',
    data:           new Date().toLocaleString('pl-PL'),
    owner_email:    TWOJ_EMAIL,
    reply_to:       email || tel,
  };

  try {
    // 1️⃣ Mail do właściciela firmy (pełny raport)
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_OWNER, {
      ...templateVars,
      to_email: TWOJ_EMAIL,
    });

    // 2️⃣ Mail do klienta (tylko jeśli podał e-mail)
    if (email) {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_CLIENT, {
        ...templateVars,
        to_email: email,
      });
    }

    // 3️⃣ WhatsApp do właściciela (CallMeBot) – działa gdy WHATSAPP_WLACZONE = true
    if (WHATSAPP_WLACZONE) {
      await wyslijWhatsApp(imie, tel, email, termin, templateVars);
    }

    showStep(7);

  } catch (err) {
    console.error('EmailJS error:', err);
    // Jeśli klucze nie są jeszcze ustawione – i tak pokaż potwierdzenie (tryb demo)
    if (EMAILJS_PUBLIC_KEY === 'N3tcahgAQt4LRFqwF') {
      console.warn('EmailJS nie jest skonfigurowany – tryb demo, formularz zaliczony lokalnie.');
      showStep(7);
    } else {
      btn.disabled = false;
      btn.innerHTML = `<svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
        Wyślij zapytanie i rezerwuj pomiar`;
      showErr('err6', `Błąd wysyłki: ${err.text || err.message || 'sprawdź konfigurację EmailJS'}. Zadzwoń do nas bezpośrednio.`);
    }
  }
}

function collectFormData() {
  // Zbiera wszystkie dane formularza do jednego obiektu (np. do wysłania przez API)
  return {
    lokalizacja:   getStr('lokalizacja'),
    stan:          getStr('stanInwestycji'),
    powierzchnia:  get('powierzchniaCalk'),
    dem:           { plytki: get('demPlytki'), tynki: get('demTynki'), ceramika: get('demCeramika'), gruntowanie: get('demGruntowanie'), gruz: getStr('gruzWywoz') },
    lazienka:      { plPodloga: get('plPodloga'), plSciany: get('plSciany'), format: getStr('formatPlytki'), hydro: get('hydro'), jolly: get('jolly'), fuga: getStr('fugaTyp'), stelaz: get('stelaz'), odplyw: get('odplyw'), bialyMontaz: get('bialyMontaz') },
    sciany:        { tynkowanie: get('tynkowanie'), gk: get('gk'), gladzie: get('gladzie'), gladzieTyp: getStr('gladzieTyp'), malowanie: get('malowanie'), panele: get('panele') },
    instalacje:    { elGniazdko: get('elGniazdko'), elWlacznik: get('elWlacznik'), elSwiatlo: get('elSwiatlo'), hydWoda: get('hydWoda'), hydKanal: get('hydKanal') },
    uwagi:         getStr('uwagi'),
    kontakt:       { imie: document.getElementById('kontaktImie').value, tel: document.getElementById('kontaktTel').value, email: document.getElementById('kontaktEmail').value, termin: getStr('termin') },
    wycena:        document.getElementById('wycenaGlowna').textContent,
  };
}

// ─────────────────────────────────────────────────────
//  RESET
// ─────────────────────────────────────────────────────

function resetForm() {
  // Resetuj wszystkie inputy
  document.querySelectorAll('input[type="number"]').forEach(i => i.value = 0);
  document.querySelectorAll('input[type="text"], input[type="tel"], input[type="email"]').forEach(i => i.value = '');
  document.querySelectorAll('textarea').forEach(t => t.value = '');
  document.querySelectorAll('select').forEach(s => s.selectedIndex = 0);
  document.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
  document.querySelectorAll('[data-group]').forEach(e => {
    e.classList.remove('selected');
    e.querySelectorAll('.inner-dot').forEach(d => d.classList.add('hidden'));
    e.querySelectorAll('.radio-dot').forEach(d => d.style.borderColor = '');
  });
  document.querySelectorAll('.format-card').forEach(e => e.classList.remove('selected'));
  document.querySelectorAll('input[type="hidden"]').forEach(i => {
    if (i.id === 'gruzWywoz') i.value = 'nie';
    else if (i.id === 'gladzieTyp') i.value = 'standard';
    else i.value = '';
  });
  document.getElementById('alertLokalizacja').classList.add('hidden');
  document.getElementById('infoDeweloper').classList.add('hidden');

  // Reset przycisku wysyłki do stanu początkowego
  const btn = document.getElementById('submitBtn');
  btn.disabled = false;
  btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
  </svg>Wyślij zapytanie i rezerwuj pomiar`;

  // Wyczyść wszystkie podświetlenia błędów
  document.querySelectorAll('.inp-error').forEach(el => el.classList.remove('inp-error'));
  document.querySelectorAll('[id^="err"]').forEach(el => el.classList.add('hidden'));

  showStep(1);
}

// ─────────────────────────────────────────────────────
//  WHATSAPP – wysyłka powiadomienia (CallMeBot)
// ─────────────────────────────────────────────────────

async function wyslijWhatsApp(imie, tel, email, termin, vars) {
  const terminLabel = {
    jak_najszybciej: 'Jak najszybciej',
    zima: 'Zima', wiosna: 'Wiosna', lato: 'Lato', jesien: 'Jesien'
  }[termin] || termin;

  // Wiadomość – krótka, czytelna na telefonie
  const tresc = [
    '🔔 *NOWE ZAPYTANIE O WYCENĘ*',
    '─────────────────────',
    `👤 *Klient:* ${imie}`,
    `📞 *Telefon:* ${tel}`,
    `📧 *E-mail:* ${email || '(brak)'}`,
    `📍 *Lokalizacja:* ${vars.lokalizacja}`,
    `🏠 *Stan:* ${vars.stan}`,
    `📅 *Termin:* ${terminLabel}`,
    '─────────────────────',
    `💰 *Wycena:* ${vars.wycena}`,
    '─────────────────────',
    '✅ Pełny raport przyszedł na maila.'
  ].join('%0A');  // %0A = nowa linia w URL

  const url = `https://api.callmebot.com/whatsapp.php?phone=${WHATSAPP_NUMER}&text=${tresc}&apikey=${WHATSAPP_APIKEY}`;

  // no-cors bo CallMeBot nie wysyła nagłówków CORS – wystarczy że request dotrze
  await fetch(url, { method: 'GET', mode: 'no-cors' });
}

// ─────────────────────────────────────────────────────
//  INICJALIZACJA
// ─────────────────────────────────────────────────────

// Domyślna opcja gruz = nie
document.querySelector('[data-group="gruz"][data-val="nie"]').classList.add('selected');

// Domyślna opcja gładź = standard
document.addEventListener('DOMContentLoaded', () => {
  const stdGladz = document.querySelector('[data-group="gladzie_typ"][data-val="standard"]');
  if (stdGladz) stdGladz.classList.add('selected');
});

// Obsługa alertu lokalizacji
document.getElementById('lokalizacja').addEventListener('change', function() {
  const alert = document.getElementById('alertLokalizacja');
  if (this.value === 'INNE') {
    alert.classList.remove('hidden');
  } else {
    alert.classList.add('hidden');
  }
});

// Init – pokaż krok 1
showStep(1);
