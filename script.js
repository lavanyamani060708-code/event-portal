/* Tarang '26 Event Portal: behaviour
   Data lives in plain arrays below. Every section is rendered from them with DOM methods,
   so updating an event or an announcement re-renders the page without a reload. */
(function () {
  'use strict';

  /* ---------- helpers ---------- */
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function h(tag, props) {
    var node = document.createElement(tag);
    props = props || {};
    Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v === false || v == null) return;
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k.indexOf('on') === 0) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) {
      var kids = [].concat(arguments[i]);
      kids.forEach(function (kid) {
        if (kid == null || kid === false) return;
        node.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
      });
    }
    return node;
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function reducedMotion() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

  function fmtTime(t) {
    var parts = t.split(':'), hr = +parts[0], mn = parts[1];
    var ap = hr >= 12 ? 'PM' : 'AM';
    return (hr % 12 || 12) + ':' + mn + ' ' + ap;
  }
  function toMin(t) { var p = t.split(':'); return +p[0] * 60 + +p[1]; }
  function fromMin(m) { return pad(Math.floor(m / 60) % 24) + ':' + pad(m % 60); }

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function parseDay(key) { var p = key.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function dayNum(key) { return parseDay(key).getDate(); }
  function monthName(key) { return MONTHS[parseDay(key).getMonth()]; }
  function dayLabel(key) { var d = parseDay(key); return WEEKDAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()]; }

  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };

  /* ---------- images ---------- */
  // Each event has an illustration at images/<event id>.svg. Replace a file with a photo
  // (same name, or edit imgSrc) to use real pictures. The hosted preview injects TARANG_IMAGES instead.
  var IMG = window.TARANG_IMAGES || {};
  function imgSrc(id) { return IMG[id] || 'images/' + id + '.svg'; }
  var IMG_ALT = {
    'hack-the-wave': 'Three teammates coding on laptops side by side',
    'chess-blitz': 'Chess board with a blitz clock',
    'paper-pitch': 'A student presenting charts to a judging panel',
    'raga-rhythm': 'Microphone and tanpura on a spotlit stage',
    'futsal': 'Futsal court from above with two teams',
    'robo-race': 'A small robot on a race track near a checkered flag',
    'cloud-basics': 'A cloud connected to a laptop and servers',
    'nritya-nite': 'A classical dancer in a spotlight',
    'uiux-studio': 'App screens, a wireframe and colour swatches on a desk',
    'street-play': 'Performers on stage in front of tiered seating'
  };

  /* ---------- data ---------- */
  var FEST_START = new Date('2026-11-12T09:00:00+05:30');
  var DAYS = ['2026-11-12', '2026-11-13', '2026-11-14'];
  var CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Workshop'];

  var events = [
    { id: 'hack-the-wave', name: 'Hack the Wave', cat: 'Technical', date: '2026-11-12', start: '09:30', end: '16:30', venue: 'CS Block, Lab 2', capacity: 60, taken: 44, featured: true,
      desc: 'A seven-hour team hackathon. Build a working prototype for a campus problem and demo it to the judges.' },
    { id: 'chess-blitz', name: 'Chess Blitz', cat: 'Sports', date: '2026-11-12', start: '10:00', end: '13:00', venue: 'Indoor Games Hall', capacity: 48, taken: 20, featured: false,
      desc: 'Swiss-system blitz with five-minute clocks. Bring your own pieces if you prefer them; boards are provided.' },
    { id: 'paper-pitch', name: 'Paper Pitch', cat: 'Technical', date: '2026-11-12', start: '14:00', end: '16:30', venue: 'Seminar Hall 1', capacity: 30, taken: 12, featured: false,
      desc: 'Present your research or project paper in eight minutes, then answer questions from a faculty panel.' },
    { id: 'raga-rhythm', name: 'Raga Rhythm', cat: 'Cultural', date: '2026-11-12', start: '17:00', end: '19:30', venue: 'Open Air Theatre', capacity: 40, taken: 31, featured: true,
      desc: 'Solo and duet singing in any Indian language. Karaoke tracks and live accompaniment are both allowed.' },
    { id: 'futsal', name: 'Inter-Department Futsal', cat: 'Sports', date: '2026-11-13', start: '08:00', end: '12:00', venue: 'Sports Ground, Court B', capacity: 96, taken: 78, featured: false,
      desc: 'Five-a-side knockout matches of two ten-minute halves. Each department can field two squads.' },
    { id: 'robo-race', name: 'Robo Race', cat: 'Technical', date: '2026-11-13', start: '11:00', end: '15:00', venue: 'Workshop Arena', capacity: 36, taken: 28, featured: true,
      desc: 'Line-following bots race through a timed obstacle track. Teams of up to four; bring your own robot.' },
    { id: 'cloud-basics', name: 'Cloud in an Afternoon', cat: 'Workshop', date: '2026-11-13', start: '14:00', end: '16:00', venue: 'Seminar Hall 2', capacity: 80, taken: 35, featured: false,
      desc: 'Deploy a small web app to a cloud platform from scratch. Bring a laptop; free accounts are set up on the spot.' },
    { id: 'nritya-nite', name: 'Nritya Nite', cat: 'Cultural', date: '2026-11-13', start: '18:00', end: '20:30', venue: 'Main Auditorium', capacity: 60, taken: 38, featured: false,
      desc: 'Classical, folk and contemporary dance. Solo acts run five minutes and group acts up to eight.' },
    { id: 'uiux-studio', name: 'UI/UX Design Studio', cat: 'Workshop', date: '2026-11-14', start: '09:30', end: '12:30', venue: 'Design Studio, Block C', capacity: 40, taken: 40, featured: false,
      desc: 'Redesign a real campus app screen in three hours, from sketch to clickable prototype, with mentor feedback.' },
    { id: 'street-play', name: 'Street Play Showdown', cat: 'Cultural', date: '2026-11-14', start: '10:30', end: '13:00', venue: 'Amphitheatre', capacity: 120, taken: 55, featured: false,
      desc: 'Fifteen-minute street plays on a social theme, announced on the morning. No amplification, no props bigger than a stool.' }
  ];

  var extras = [
    { date: '2026-11-12', start: '09:00', end: '09:45', name: 'Inauguration and keynote', venue: 'Main Auditorium', cat: 'Festival' },
    { date: '2026-11-13', start: '13:00', end: '14:00', name: 'Lunch break and food court', venue: 'Central Lawn', cat: 'Festival' },
    { date: '2026-11-14', start: '17:00', end: '18:30', name: 'Valedictory and prize distribution', venue: 'Main Auditorium', cat: 'Festival' }
  ];

  var announcements = [
    { id: 1, tag: 'Registration', title: 'Early registration closes on 5 November', text: 'Register before the deadline to collect a printed pass at the help desk instead of queueing on the day.', date: '28 Sep' },
    { id: 2, tag: 'Travel', title: 'Free shuttle on all three days', text: 'Shuttles run every 20 minutes from 8:00 AM between the bus stand and the main gate.', date: '26 Sep' },
    { id: 3, tag: 'Rules', title: 'Carry your college ID card', text: 'Entry to every event venue needs a valid ID. Visiting students can show a bonafide letter.', date: '24 Sep' }
  ];
  var nextAnnId = 4;

  var registrations = store.get('tarang26.registrations') || [];
  var state = { cat: 'All', day: 'all', scheduleDay: DAYS[0] };

  function catSlug(c) { return 'cat-' + c.toLowerCase(); }
  function byId(id) { return events.filter(function (e) { return e.id === id; })[0]; }
  function seatsLeft(e) {
    var mine = registrations.filter(function (r) { return r.eventId === e.id; }).length;
    return Math.max(0, e.capacity - e.taken - mine);
  }
  function sortByTime(a, b) { return a.date.localeCompare(b.date) || a.start.localeCompare(b.start); }

  /* ---------- navigation ---------- */
  var nav = $('#siteNav');
  var navToggle = $('#navToggle');

  function setMenu(open) {
    nav.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  navToggle.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); navToggle.focus(); } });

  function goTo(id) {
    var target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  }
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[data-nav]');
    if (!link) return;
    e.preventDefault();
    setMenu(false);
    goTo(link.getAttribute('href').slice(1));
  });

  var sections = ['home', 'events', 'schedule', 'gallery', 'registration', 'contact'];
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        $$('.site-nav a').forEach(function (a) {
          var on = a.getAttribute('href') === '#' + en.target.id;
          a.classList.toggle('active', on);
          if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    sections.forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------- theme ---------- */
  var root = document.documentElement;
  var savedTheme = store.get('tarang26.theme');
  if (savedTheme === 'light' || savedTheme === 'dark') root.setAttribute('data-theme', savedTheme);
  $('#themeBtn').addEventListener('click', function () {
    var current = root.getAttribute('data-theme');
    if (!current) current = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    var next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    store.set('tarang26.theme', next);
  });

  /* ---------- countdown ---------- */
  function tick() {
    var ms = FEST_START.getTime() - Date.now();
    var label = $('.cd-label');
    if (ms <= 0) {
      label.textContent = 'The festival is on';
      ['cdDays', 'cdHours', 'cdMins', 'cdSecs'].forEach(function (id) { $('#' + id).textContent = '00'; });
      return;
    }
    var s = Math.floor(ms / 1000);
    $('#cdDays').textContent = pad(Math.floor(s / 86400));
    $('#cdHours').textContent = pad(Math.floor((s % 86400) / 3600));
    $('#cdMins').textContent = pad(Math.floor((s % 3600) / 60));
    $('#cdSecs').textContent = pad(s % 60);
  }
  tick();
  setInterval(tick, 1000);

  /* ---------- announcements ---------- */
  function renderAnnouncements() {
    var list = $('#annList');
    clear(list);
    if (!announcements.length) {
      list.append(h('li', { class: 'empty', text: 'No announcements right now.' }));
      return;
    }
    announcements.slice(0, 6).forEach(function (a) {
      list.append(h('li', { class: 'ann' },
        h('div', { class: 'ann-meta' }, h('span', { text: a.tag }), h('span', { text: a.date })),
        h('h3', { text: a.title }),
        h('p', { text: a.text }),
        h('button', { class: 'ann-x', type: 'button', 'aria-label': 'Dismiss: ' + a.title, text: '×', onclick: function () {
          announcements = announcements.filter(function (x) { return x.id !== a.id; });
          renderAnnouncements();
        } })
      ));
    });
  }

  function addAnnouncement(tag, title, text) {
    var d = new Date();
    announcements.unshift({ id: nextAnnId++, tag: tag, title: title, text: text, date: d.getDate() + ' ' + MONTHS[d.getMonth()] });
    renderAnnouncements();
  }

  /* ---------- featured ---------- */
  function renderFeatured() {
    var list = $('#featuredList');
    clear(list);
    events.filter(function (e) { return e.featured; }).sort(sortByTime).forEach(function (e) {
      list.append(h('li', { class: 'feat' },
        h('img', { class: 'feat-img', src: imgSrc(e.id), alt: '', width: '96', height: '64', loading: 'lazy' }),
        h('div', {},
          h('h3', { text: e.name }),
          h('p', { text: dayLabel(e.date) + ' · ' + fmtTime(e.start) + ' · ' + e.venue })
        ),
        registerButton(e, 'Register')
      ));
    });
  }

  function datebox(key) {
    return h('div', { class: 'datebox', 'aria-hidden': 'true' }, h('b', { text: dayNum(key) }), h('span', { text: monthName(key) }));
  }

  function registerButton(e, label) {
    var full = seatsLeft(e) === 0;
    return h('button', {
      class: 'btn btn-primary btn-sm', type: 'button', disabled: full,
      'aria-label': (full ? 'Full: ' : label + ' for ') + e.name,
      text: full ? 'Full' : label,
      onclick: function () { chooseEvent(e.id); }
    });
  }

  function chooseEvent(id) {
    $('#r-event').value = id;
    clearError($('#r-event'));
    goTo('registration');
    window.setTimeout(function () { $('#r-name').focus({ preventScroll: true }); }, reducedMotion() ? 0 : 500);
  }

  /* ---------- events ---------- */
  function renderFilters() {
    var chips = $('#catChips');
    clear(chips);
    ['All'].concat(CATEGORIES).forEach(function (c) {
      chips.append(h('button', {
        class: 'chip', type: 'button', 'aria-pressed': String(state.cat === c), text: c,
        onclick: function () { state.cat = c; renderFilters(); renderEvents(); }
      }));
    });
    var sel = $('#dayFilter');
    clear(sel);
    sel.append(h('option', { value: 'all', text: 'All days' }));
    DAYS.forEach(function (d) { sel.append(h('option', { value: d, text: dayLabel(d) })); });
    sel.value = state.day;
  }

  function renderEvents() {
    var grid = $('#eventGrid');
    clear(grid);
    var list = events.filter(function (e) {
      return (state.cat === 'All' || e.cat === state.cat) && (state.day === 'all' || e.date === state.day);
    }).sort(sortByTime);

    $('#resultCount').textContent = list.length === 1 ? '1 event shown' : list.length + ' events shown';

    if (!list.length) {
      grid.append(h('p', { class: 'empty', text: 'No events match this filter. Try another category or day.' }));
      return;
    }

    list.forEach(function (e) {
      var left = seatsLeft(e);
      var seatText = left === 0 ? 'Full' : left + ' of ' + e.capacity + ' left';
      var seatClass = left === 0 ? 'seats-out' : left <= 10 ? 'seats-low' : '';
      grid.append(h('article', { class: 'event-card' },
        h('div', { class: 'ec-media' },
          h('img', { src: imgSrc(e.id), alt: IMG_ALT[e.id] || e.name, width: '800', height: '500', loading: 'lazy' }),
          h('div', { class: 'ec-top' }, datebox(e.date), h('span', { class: 'tag ' + catSlug(e.cat), text: e.cat }))
        ),
        h('div', { class: 'ec-body' },
          h('h3', { text: e.name }),
          h('p', { class: 'desc', text: e.desc }),
          h('dl', { class: 'meta' },
            h('div', {}, h('dt', { text: 'Date' }), h('dd', { text: dayLabel(e.date) })),
            h('div', {}, h('dt', { text: 'Time' }), h('dd', { text: fmtTime(e.start) + ' to ' + fmtTime(e.end) })),
            h('div', {}, h('dt', { text: 'Venue' }), h('dd', { text: e.venue })),
            h('div', {}, h('dt', { text: 'Seats' }), h('dd', { class: seatClass, text: seatText }))
          ),
          registerButton(e, 'Register')
        )
      ));
    });
  }

  $('#dayFilter').addEventListener('change', function (e) { state.day = e.target.value; renderEvents(); });

  /* ---------- schedule ---------- */
  function renderSchedule() {
    var tabs = $('#dayTabs');
    clear(tabs);
    DAYS.forEach(function (d, i) {
      var selected = state.scheduleDay === d;
      tabs.append(h('button', {
        class: 'tab', type: 'button', role: 'tab', id: 'tab-' + i, 'aria-selected': String(selected),
        'aria-controls': 'schedulePanel', tabindex: selected ? '0' : '-1', text: dayLabel(d),
        onclick: function () { state.scheduleDay = d; renderSchedule(); },
        onkeydown: function (ev) {
          var idx = DAYS.indexOf(state.scheduleDay), n = DAYS.length;
          if (ev.key === 'ArrowRight') idx = (idx + 1) % n;
          else if (ev.key === 'ArrowLeft') idx = (idx - 1 + n) % n;
          else return;
          ev.preventDefault();
          state.scheduleDay = DAYS[idx];
          renderSchedule();
          $('#tab-' + idx).focus();
        }
      }));
    });
    $('#schedulePanel').setAttribute('aria-labelledby', 'tab-' + DAYS.indexOf(state.scheduleDay));
    $('#scheduleCaption').textContent = 'Schedule for ' + dayLabel(state.scheduleDay);

    var rows = events.map(function (e) { return { date: e.date, start: e.start, end: e.end, name: e.name, venue: e.venue, cat: e.cat }; })
      .concat(extras)
      .filter(function (r) { return r.date === state.scheduleDay; })
      .sort(sortByTime);

    var body = $('#scheduleBody');
    clear(body);
    rows.forEach(function (r) {
      body.append(h('tr', { class: r.cat === 'Festival' ? 'is-fest' : '' },
        h('td', { text: fmtTime(r.start) + ' to ' + fmtTime(r.end) }),
        h('td', { text: r.name }),
        h('td', { text: r.venue }),
        h('td', {}, h('span', { class: 'tag ' + catSlug(r.cat), text: r.cat }))
      ));
    });
  }

  /* ---------- gallery ---------- */
  var GALLERY = [
    { id: 'hack-the-wave', title: 'Hackathon floor, Tarang \u201925', span: 'g-wide' },
    { id: 'raga-rhythm', title: 'An evening of music', span: 'g-tall' },
    { id: 'futsal', title: 'Futsal quarter-final' },
    { id: 'uiux-studio', title: 'Design studio session' },
    { id: 'nritya-nite', title: 'Nritya Nite finale', span: 'g-wide' },
    { id: 'robo-race', title: 'Robo Race track test' },
    { id: 'chess-blitz', title: 'Chess final board' },
    { id: 'cloud-basics', title: 'Cloud lab walkthrough' },
    { id: 'street-play', title: 'Street play at the amphitheatre', span: 'g-wide' },
    { id: 'paper-pitch', title: 'Paper Pitch judging' }
  ];

  var lightbox = null, lbIndex = 0, lbOpener = null;

  function renderGallery() {
    var grid = $('#galleryGrid');
    clear(grid);
    GALLERY.forEach(function (g, i) {
      g.src = imgSrc(g.id);
      g.alt = IMG_ALT[g.id] || g.title;
      grid.append(h('button', {
        class: 'g-item ' + (g.span || ''), type: 'button', 'aria-label': 'View larger: ' + g.title,
        onclick: function (ev) { openLightbox(i, ev.currentTarget); }
      },
        h('img', { src: g.src, alt: g.alt, loading: 'lazy' }),
        h('span', { class: 'cap', text: g.title })
      ));
    });
  }

  function showLightbox() {
    var g = GALLERY[lbIndex];
    $('img', lightbox).src = g.src;
    $('img', lightbox).alt = g.alt;
    $('figcaption', lightbox).textContent = g.title + ' · ' + (lbIndex + 1) + ' of ' + GALLERY.length;
  }

  function openLightbox(i, opener) {
    lbIndex = i; lbOpener = opener;
    lightbox = h('div', { class: 'lightbox', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Photo viewer' },
      h('button', { class: 'lb-btn lb-close', type: 'button', 'aria-label': 'Close viewer', text: '×', onclick: closeLightbox }),
      h('button', { class: 'lb-btn lb-prev', type: 'button', 'aria-label': 'Previous photo', text: '‹', onclick: function (e) { e.stopPropagation(); stepLightbox(-1); } }),
      h('figure', {}, h('img', { alt: '' }), h('figcaption')),
      h('button', { class: 'lb-btn lb-next', type: 'button', 'aria-label': 'Next photo', text: '›', onclick: function (e) { e.stopPropagation(); stepLightbox(1); } })
    );
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
    document.body.append(lightbox);
    document.addEventListener('keydown', lightboxKeys);
    showLightbox();
    $('.lb-close', lightbox).focus();
  }
  function stepLightbox(d) { lbIndex = (lbIndex + d + GALLERY.length) % GALLERY.length; showLightbox(); }
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.remove(); lightbox = null;
    document.removeEventListener('keydown', lightboxKeys);
    if (lbOpener) lbOpener.focus();
  }
  function lightboxKeys(e) {
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowRight') stepLightbox(1);
    else if (e.key === 'ArrowLeft') stepLightbox(-1);
  }

  /* ---------- validation helpers ---------- */
  function errEl(field) { return $('#err-' + field.id); }
  function setError(field, msg) {
    field.setAttribute('aria-invalid', 'true');
    var out = errEl(field);
    if (out) { out.textContent = msg; field.setAttribute('aria-describedby', out.id); }
  }
  function clearError(field) {
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
    var out = errEl(field);
    if (out) out.textContent = '';
  }
  function check(field, rule) {
    var msg = rule(field.type === 'checkbox' ? field.checked : field.value.trim());
    if (msg) { setError(field, msg); return false; }
    clearError(field);
    return true;
  }
  function liveValidate(form, rules) {
    Object.keys(rules).forEach(function (id) {
      var f = $('#' + id, form);
      var evt = (f.tagName === 'SELECT' || f.type === 'checkbox') ? 'change' : 'blur';
      f.addEventListener(evt, function () { check(f, rules[id]); });
      f.addEventListener('input', function () { if (f.getAttribute('aria-invalid') === 'true') check(f, rules[id]); });
    });
  }
  function runAll(form, rules) {
    var bad = [];
    Object.keys(rules).forEach(function (id) {
      var f = $('#' + id, form);
      if (!check(f, rules[id])) bad.push(f);
    });
    return bad;
  }

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var NAME_RE = /^[A-Za-z][A-Za-z .'\-]{2,59}$/;
  var MOBILE_RE = /^[6-9]\d{9}$/;

  var nameRule = function (v) { return !v ? 'Enter your full name.' : !NAME_RE.test(v) ? 'Use letters, spaces and . \' - only, at least 3 characters.' : ''; };
  var emailRule = function (v) { return !v ? 'Enter your email address.' : !EMAIL_RE.test(v) ? 'Enter an email like name@college.edu.' : ''; };

  /* ---------- registration ---------- */
  function fillEventSelects() {
    var sel = $('#r-event'), prev = sel.value;
    clear(sel);
    sel.append(h('option', { value: '', text: 'Select an event' }));
    events.slice().sort(sortByTime).forEach(function (e) {
      var full = seatsLeft(e) === 0;
      sel.append(h('option', { value: e.id, disabled: full, text: e.name + ' · ' + dayLabel(e.date) + (full ? ' (full)' : '') }));
    });
    sel.value = prev;

    var u = $('#u-event'), uprev = u.value;
    clear(u);
    events.slice().sort(sortByTime).forEach(function (e) { u.append(h('option', { value: e.id, text: e.name })); });
    if (uprev) u.value = uprev;
    prefillUpdate();
  }

  var regRules = {
    'r-name': nameRule,
    'r-email': emailRule,
    'r-mobile': function (v) { return !v ? 'Enter your mobile number.' : !MOBILE_RE.test(v) ? 'Enter 10 digits starting with 6, 7, 8 or 9.' : ''; },
    'r-dept': function (v) { return v ? '' : 'Choose your department.'; },
    'r-year': function (v) { return v ? '' : 'Choose your year of study.'; },
    'r-event': function (v) {
      if (!v) return 'Choose an event.';
      var e = byId(v);
      return e && seatsLeft(e) === 0 ? 'This event is full. Choose another.' : '';
    },
    'r-terms': function (v) { return v ? '' : 'Please confirm to continue.'; }
  };

  var regForm = $('#regForm');
  liveValidate(regForm, regRules);
  $('#r-mobile').addEventListener('input', function (e) { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10); });

  regForm.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var summary = $('#regSummary'), success = $('#regSuccess');
    success.hidden = true;
    var bad = runAll(regForm, regRules);

    var email = $('#r-email').value.trim().toLowerCase(), evId = $('#r-event').value;
    if (!bad.length && registrations.some(function (r) { return r.email === email && r.eventId === evId; })) {
      setError($('#r-event'), 'You have already registered for this event with this email.');
      bad.push($('#r-event'));
    }

    if (bad.length) {
      summary.hidden = false;
      summary.textContent = bad.length === 1 ? 'One field needs your attention.' : bad.length + ' fields need your attention.';
      bad[0].focus();
      return;
    }
    summary.hidden = true;

    var e = byId(evId);
    var reg = {
      id: 'TRG26-' + (1000 + registrations.length + 1),
      name: $('#r-name').value.trim(),
      email: email,
      mobile: $('#r-mobile').value.trim(),
      dept: $('#r-dept').value,
      year: $('#r-year').value,
      eventId: evId
    };
    registrations.push(reg);
    store.set('tarang26.registrations', registrations);

    clear(success);
    success.append(
      h('h3', { text: 'You are registered, ' + reg.name.split(' ')[0] + '.' }),
      h('p', { text: 'Show this reference at the help desk. A confirmation would be sent to ' + reg.email + ' once the portal is connected to a mail service.' }),
      h('p', { class: 'ticket' }, 'Reference: ' + reg.id, h('br'), e.name + ' · ' + dayLabel(e.date), h('br'), fmtTime(e.start) + ' · ' + e.venue)
    );
    success.hidden = false;
    regForm.reset();
    $$('[aria-invalid]', regForm).forEach(clearError);
    refreshAll();
    success.focus();
    success.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'nearest' });
  });

  regForm.addEventListener('reset', function () {
    window.setTimeout(function () {
      $$('[aria-invalid]', regForm).forEach(clearError);
      $('#regSummary').hidden = true;
    }, 0);
  });

  function renderMine() {
    var list = $('#myRegs');
    clear(list);
    if (!registrations.length) {
      list.append(h('li', { class: 'mine-empty', text: 'Nothing yet. Events you register for will be listed here.' }));
      return;
    }
    registrations.slice().reverse().forEach(function (r) {
      var e = byId(r.eventId);
      list.append(h('li', {}, h('b', { text: e ? e.name : r.eventId }), h('span', { text: r.id + (e ? ' · ' + dayLabel(e.date) : '') })));
    });
  }

  /* ---------- organiser tools ---------- */
  var annRules = {
    'a-title': function (v) { return !v ? 'Enter a headline.' : v.length < 5 ? 'Make the headline at least 5 characters.' : ''; },
    'a-text': function (v) { return !v ? 'Add a few details.' : v.length < 10 ? 'Add at least 10 characters of detail.' : ''; }
  };
  var annForm = $('#annForm');
  liveValidate(annForm, annRules);
  annForm.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var bad = runAll(annForm, annRules);
    if (bad.length) { bad[0].focus(); return; }
    addAnnouncement('Update', $('#a-title').value.trim(), $('#a-text').value.trim());
    annForm.reset();
  });

  function prefillUpdate() {
    var e = byId($('#u-event').value);
    if (!e) return;
    $('#u-venue').value = e.venue;
    $('#u-start').value = e.start;
    clearError($('#u-venue')); clearError($('#u-start'));
  }
  $('#u-event').addEventListener('change', prefillUpdate);

  var updRules = {
    'u-venue': function (v) { return v.length < 3 ? 'Enter a venue of at least 3 characters.' : ''; },
    'u-start': function (v) { return /^\d{2}:\d{2}$/.test(v) ? '' : 'Pick a start time.'; }
  };
  var updForm = $('#evUpdateForm');
  liveValidate(updForm, updRules);
  updForm.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var bad = runAll(updForm, updRules);
    if (bad.length) { bad[0].focus(); return; }
    var e = byId($('#u-event').value);
    var venue = $('#u-venue').value.trim(), start = $('#u-start').value;
    var changes = [];
    if (venue !== e.venue) changes.push('moved to ' + venue);
    if (start !== e.start) {
      var span = toMin(e.end) - toMin(e.start);
      e.start = start;
      e.end = fromMin(toMin(start) + span);
      changes.push('now starts at ' + fmtTime(start));
    }
    if (!changes.length) return;
    e.venue = venue;
    addAnnouncement('Schedule', e.name + ' updated', e.name + ' is ' + changes.join(' and ') + '.');
    refreshAll();
  });

  /* ---------- contact ---------- */
  var contactRules = {
    'c-name': nameRule,
    'c-email': emailRule,
    'c-topic': function (v) { return v ? '' : 'Choose a topic.'; },
    'c-message': function (v) { return !v ? 'Write your message.' : v.length < 15 ? 'Add a little more detail (at least 15 characters).' : ''; }
  };
  var contactForm = $('#contactForm');
  liveValidate(contactForm, contactRules);
  contactForm.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var box = $('#contactSuccess');
    box.hidden = true;
    var bad = runAll(contactForm, contactRules);
    if (bad.length) { bad[0].focus(); return; }
    var name = $('#c-name').value.trim().split(' ')[0];
    clear(box);
    box.append(
      h('h3', { text: 'Thanks, ' + name + '.' }),
      h('p', { text: 'Your message about “' + $('#c-topic').value.toLowerCase() + '” is ready for the festival desk. Once a mail service is connected, replies go to ' + $('#c-email').value.trim() + '.' })
    );
    box.hidden = false;
    contactForm.reset();
    box.focus();
  });

  /* ---------- boot ---------- */
  function refreshAll() {
    renderFeatured();
    renderEvents();
    renderSchedule();
    fillEventSelects();
    renderMine();
  }

  renderFilters();
  renderAnnouncements();
  renderGallery();
  refreshAll();
})();
