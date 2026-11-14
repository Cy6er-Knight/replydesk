/*
 * ReplyDesk
 * Answer the same student emails in seconds: pick a student, pick a template, open a draft.
 *
 * Everything runs in the browser. There is no server, no login and no database.
 * Data is saved in localStorage, and drafts open in Outlook through a normal link
 * (mailto: or Outlook on the web), so no Microsoft permissions are needed.
 *
 * Sections:
 *   1. Defaults           8. Templates page
 *   2. Small helpers      9. Draft builder
 *   3. Storage + state   10. Scheduled drafts and reminders
 *   4. Theme             11. History
 *   5. Router            12. Settings and backups
 *   6. Toasts, dialogs   13. Quick search (Ctrl K)
 *   7. Students page     14. Dashboard
 *                        15. Install as an app (PWA) and startup
 *
 * Made by Abdur Rahman Ansar. MIT License.
 */
(() => {
  'use strict';

  /* =================================================================== 1. Defaults */

  const APP_VERSION = '1.1.0';

  // The built-in categories and templates. This is the same data as templates.json.
  // It's copied in here so the app still works when index.html is opened straight
  // from a folder, where browsers don't let pages read other local files.
  const DEFAULT_DATA = {
    "version": 1,
    "categories": [
      "Grade Updates",
      "Test Corrections",
      "Missing Work",
      "Retakes",
      "Parent Communication",
      "Attendance",
      "General Responses"
    ],
    "templates": [
      {
        "id": "grade-update",
        "category": "Grade Updates",
        "title": "Grades updated",
        "audience": "student",
        "subject": "Grades updated in Infinite Campus",
        "body": "Your grades have been updated and synced to Infinite Campus. Please allow approximately one hour for changes to appear.",
        "favorite": true
      },
      {
        "id": "assignment-graded",
        "category": "Grade Updates",
        "title": "Assignment graded",
        "audience": "student",
        "subject": "{{assignmentName}} has been graded",
        "body": "I finished grading {{assignmentName}}, and your score is now in Infinite Campus. Let me know if you have any questions about it.",
        "favorite": false
      },
      {
        "id": "grade-question",
        "category": "Grade Updates",
        "title": "Looking into your grade",
        "audience": "student",
        "subject": "Re: Your grade in {{course}}",
        "body": "Thanks for asking about your grade. I'll take a look and get back to you by {{date}}. In the meantime, you can see the score for each assignment in Infinite Campus.",
        "favorite": false
      },
      {
        "id": "correction-dates",
        "category": "Test Corrections",
        "title": "Test correction dates",
        "audience": "student",
        "subject": "Test corrections: {{startDate}} to {{endDate}}",
        "body": "Test corrections begin on {{startDate}} and end on {{endDate}}. Please come during that time to improve your grade.",
        "favorite": true
      },
      {
        "id": "correction-how",
        "category": "Test Corrections",
        "title": "How test corrections work",
        "audience": "student",
        "subject": "How test corrections work",
        "body": "To do test corrections, come to my room during the correction window and bring your test. For each question you missed, explain the mistake and show the correct work. Corrections need to be finished by {{endDate}}.",
        "favorite": false
      },
      {
        "id": "missing-work",
        "category": "Missing Work",
        "title": "Missing work reminder",
        "audience": "student",
        "subject": "Missing work in {{course}}",
        "body": "Please submit any missing assignments before the deadline listed in Infinite Campus.",
        "favorite": true
      },
      {
        "id": "missing-assignment",
        "category": "Missing Work",
        "title": "Missing a specific assignment",
        "audience": "student",
        "subject": "Missing: {{assignmentName}}",
        "body": "I don't have {{assignmentName}} from you yet. Please turn it in by {{date}} so you can get credit for it. If you already turned it in, reply to this email and let me know where.",
        "favorite": false
      },
      {
        "id": "late-work",
        "category": "Missing Work",
        "title": "Late work received",
        "audience": "student",
        "subject": "Re: Late assignment",
        "body": "Thank you for submitting your assignment. I will review it and update the grade as soon as possible.",
        "favorite": true
      },
      {
        "id": "retake-approved",
        "category": "Retakes",
        "title": "Retake approved",
        "audience": "student",
        "subject": "Retake for {{assignmentName}}",
        "body": "Yes, you can retake {{assignmentName}}. The retake is on {{date}}. Please review your notes and your corrected test before then.",
        "favorite": false
      },
      {
        "id": "retake-policy",
        "category": "Retakes",
        "title": "Retake policy",
        "audience": "student",
        "subject": "Re: Retakes",
        "body": "Retakes are available once you finish your test corrections. When your corrections are done, email me and we'll set up a time for the retake. Your higher score is the one that counts.",
        "favorite": false
      },
      {
        "id": "parent-update",
        "category": "Parent Communication",
        "title": "Missing work update for parents",
        "audience": "parent",
        "subject": "Update on {{studentName}} in {{course}}",
        "body": "I'm reaching out with a quick update on {{studentName}} in {{course}}. {{studentName}} is currently missing {{assignmentName}}. Turning it in by {{date}} would really help their grade. Please let me know if you have any questions.",
        "favorite": false
      },
      {
        "id": "parent-thanks",
        "category": "Parent Communication",
        "title": "Thanks for reaching out",
        "audience": "parent",
        "subject": "Re: {{studentName}}",
        "body": "Thank you for reaching out about {{studentName}}. I'm looking into it and will get back to you by {{date}}.",
        "favorite": false
      },
      {
        "id": "parent-meeting",
        "category": "Parent Communication",
        "title": "Conference request",
        "audience": "parent",
        "subject": "Meeting about {{studentName}}",
        "body": "I'd like to set up a time to talk about how {{studentName}} is doing in {{course}}. Would {{date}} work for a quick call or meeting? If not, just send me a few times that work for you.",
        "favorite": false
      },
      {
        "id": "absent-work",
        "category": "Attendance",
        "title": "Work missed while absent",
        "audience": "student",
        "subject": "What you missed on {{date}}",
        "body": "Sorry you were out on {{date}}. The notes and assignments from that day are posted online. Please make up the missed work within a few days, and come see me if anything doesn't make sense.",
        "favorite": false
      },
      {
        "id": "attendance-check",
        "category": "Attendance",
        "title": "Checking in on absences",
        "audience": "parent",
        "subject": "Checking in on {{studentName}}",
        "body": "I noticed {{studentName}} has missed a few classes recently, most recently on {{date}}. I wanted to check in and make sure everything is okay, and to let you know I'm happy to help them catch up.",
        "favorite": false
      },
      {
        "id": "received",
        "category": "General Responses",
        "title": "Got it, thanks",
        "audience": "student",
        "subject": "Re: Your email",
        "body": "Thanks for your email! I got it and will get back to you soon.",
        "favorite": false
      },
      {
        "id": "come-see-me",
        "category": "General Responses",
        "title": "Come see me",
        "audience": "student",
        "subject": "Re: Your question",
        "body": "Great question. It's easier to explain in person, so please stop by my room before or after school and I'll walk you through it.",
        "favorite": false
      },
      {
        "id": "extension",
        "category": "General Responses",
        "title": "Extension approved",
        "audience": "student",
        "subject": "Extension for {{assignmentName}}",
        "body": "You can have an extension on {{assignmentName}}. Your new due date is {{date}}.",
        "favorite": false
      }
    ]
  };

  // The sample roster (same as sample_students.csv), for the "Try the sample roster" button.
  const SAMPLE_CSV = "Name,Email,Parent Email,Course\nJohn Smith,johnsmith@students.example.org,smith.family@example.com,Biology - Period 2\nSarah Lee,sarahlee@students.example.org,mlee@example.com,Biology - Period 2\nAlex Brown,alexbrown@students.example.org,,Biology - Period 2\nPriya Patel,priyapatel@students.example.org,patel.home@example.com,Biology - Period 3\nMarcus Johnson,marcusjohnson@students.example.org,dj.johnson@example.com,Biology - Period 3\nEmily Chen,emilychen@students.example.org,chen.parents@example.com,Biology - Period 3\n\"Garcia, Diego\",diegogarcia@students.example.org,lgarcia@example.com,AP Biology - Period 5\nOlivia Williams,oliviawilliams@students.example.org,,AP Biology - Period 5\nNoah Kim,noahkim@students.example.org,kim.family@example.com,AP Biology - Period 5\nAisha Rahman,aisharahman@students.example.org,rahman.home@example.com,AP Biology - Period 5\nLiam O'Connor,liamoconnor@students.example.org,oconnors@example.com,Biology - Period 6\nSofia Rossi,sofiarossi@students.example.org,,Biology - Period 6\n";

  const DEFAULT_SETTINGS = {
    teacherName: '',
    defaultCourse: '',
    greetingStudent: 'Hi {{firstName}},',
    greetingParent: 'Hello,',
    signoff: 'Best,',
    signature: '{{teacherName}}',
    openWith: 'outlookWeb', // 'mailto' | 'outlookWeb' | 'gmail'
    // Students with no email on file ("name only"). 'name' puts their name in the To box so Outlook
    // looks up the address; 'blank' leaves To empty and copies the name so it can be pasted in.
    nameOnlyTo: 'name',
    theme: 'system', // 'system' | 'light' | 'dark'
    notify: false,
    setupHidden: false,
  };

  // Every placeholder ReplyDesk knows about. Anything else in {{double braces}}
  // still works: it just gets a plain text box (or a date picker if it ends in "Date").
  const PLACEHOLDERS = {
    studentName: { label: 'Student name', type: 'text', auto: true },
    firstName: { label: 'First name', type: 'text', auto: true },
    teacherName: { label: 'Your name', type: 'text', auto: true },
    date: { label: 'Date', type: 'date' },
    startDate: { label: 'Start date', type: 'date' },
    endDate: { label: 'End date', type: 'date' },
    assignmentName: { label: 'Assignment', type: 'text', hint: 'Unit 3 Test' },
    course: { label: 'Course', type: 'text' },
  };

  const MINUTES_SAVED_PER_EMAIL = 2; // used for the "time saved" estimate on the dashboard
  const MAILTO_SAFE_LENGTH = 1900; // some versions of Outlook cut off longer mailto links
  const HISTORY_LIMIT = 200;

  /* =================================================================== 2. Small helpers */

  const $ = (id) => document.getElementById(id);
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  /** Escapes text so it's safe to put inside HTML. Every bit of user data goes through this. */
  const esc = (value) =>
    String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const icon = (name, cls = '') => `<svg class="${cls}"><use href="#i-${name}"/></svg>`;

  function debounce(fn, wait) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  }

  /** Splits a search box value into lowercase words; every word has to match. */
  const words = (query) => query.toLowerCase().split(/\s+/).filter(Boolean);
  const matchesAll = (haystack, terms) => terms.every((t) => haystack.includes(t));

  const isEmail = (value) => /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(value);
  const splitEmails = (value) => String(value || '').split(/[;,\s]+/).map((e) => e.trim()).filter(Boolean);

  /**
   * Splits a To or CC box into recipients. Unlike splitEmails, a name like "John Smith" stays in one
   * piece, because name-only students go to Outlook as a name and Outlook finds the address.
   */
  const splitRecipients = (value) =>
    String(value || '')
      .split(/[;,]+/)
      .flatMap((part) => (part.includes('@') ? part.split(/\s+/) : [part.replace(/\s+/g, ' ')]))
      .map((e) => e.trim())
      .filter(Boolean);

  /** The grey line under a student's name: their email, or a note that Outlook will find it. */
  const studentSub = (s) => (s.email ? s.email : 'Name only, Outlook finds the email') + (s.course ? ' · ' + s.course : '');

  /** Same person? Matches by email when both have one, otherwise by name. */
  const sameStudent = (a, b) =>
    a.email && b.email ? a.email === b.email : a.name.toLowerCase() === b.name.toLowerCase() && (!a.course || !b.course || a.course === b.course);

  const firstNameOf = (name) => String(name || '').trim().split(/\s+/)[0] || '';
  const initials = (name) =>
    String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

  /** Gives each student a steady avatar color based on their name. */
  function avatarColor(name) {
    const colors = ['#0a84ff', '#30b0c7', '#34c759', '#ff9f0a', '#ff375f', '#af52de', '#5e5ce6', '#a2845e'];
    let hash = 0;
    for (const ch of String(name)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    return colors[hash % colors.length];
  }

  /* ---- dates */

  /** Today as YYYY-MM-DD in local time (not UTC, so it never shows tomorrow late at night). */
  function isoDate(date = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function addDays(iso, days) {
    const [y, m, d] = iso.split('-').map(Number);
    return isoDate(new Date(y, m - 1, d + days));
  }

  /** "2026-10-05" → "October 5, 2026" */
  function longDate(iso) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return '';
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  /** "3 min ago", "in 2 hours", "Yesterday", ... */
  function relativeTime(ms) {
    const diff = ms - Date.now();
    const abs = Math.abs(diff);
    const minute = 60e3, hour = 60 * minute, day = 24 * hour;
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    if (abs < minute) return diff < 0 ? 'just now' : 'in a moment';
    if (abs < hour) return rtf.format(Math.round(diff / minute), 'minute');
    if (abs < day) return rtf.format(Math.round(diff / hour), 'hour');
    if (abs < 7 * day) return rtf.format(Math.round(diff / day), 'day');
    return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function clockTime(ms) {
    return new Date(ms).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  /* ---- files */

  function downloadFile(name, text, type) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = Object.assign(document.createElement('a'), { href: url, download: name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /** Opens the hidden file picker and resolves with the chosen file's text. */
  function pickFile(input) {
    return new Promise((resolve) => {
      input.value = '';
      input.onchange = () => {
        const file = input.files[0];
        if (!file) return resolve(null);
        file.text().then((text) => resolve({ name: file.name, text }));
      };
      input.click();
    });
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Older or locked-down browsers: fall back to a hidden text box.
      const box = Object.assign(document.createElement('textarea'), { value: text });
      box.style.cssText = 'position:fixed;opacity:0;top:0';
      document.body.append(box);
      box.select();
      const ok = document.execCommand('copy');
      box.remove();
      return ok;
    }
  }

  /* =================================================================== 3. Storage + state */

  const PREFIX = 'replydesk.';
  let storageWarned = false;

  /** A small wrapper around localStorage that never throws. */
  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
        return true;
      } catch {
        if (!storageWarned) {
          storageWarned = true;
          toast("Couldn't save. This browser's storage is full or turned off.", { kind: 'error', duration: 8000 });
        }
        return false;
      }
    },
    clearAll() {
      try {
        Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).forEach((k) => localStorage.removeItem(k));
      } catch { /* nothing to clear */ }
    },
  };

  /** Fills in any missing fields on a template, so old or imported data always has the same shape. */
  function normalizeTemplate(t, builtIn = false) {
    return {
      id: String(t.id || uid()),
      title: String(t.title || 'Untitled template').trim(),
      category: String(t.category || 'General Responses').trim(),
      audience: t.audience === 'parent' ? 'parent' : 'student',
      subject: String(t.subject || ''),
      body: String(t.body || ''),
      favorite: !!t.favorite,
      greeting: t.greeting !== false,
      builtIn: t.builtIn ?? builtIn,
      uses: Number(t.uses) || 0,
      lastUsed: t.lastUsed || null,
      updatedAt: t.updatedAt || Date.now(),
    };
  }

  function normalizeStudent(s) {
    return {
      id: String(s.id || uid()),
      name: String(s.name || '').trim(),
      email: String(s.email || '').trim().toLowerCase(),
      parentEmail: splitEmails(s.parentEmail).join(', ').toLowerCase(),
      course: String(s.course || '').trim(),
    };
  }

  // Everything the app knows lives in this one object, and each piece is saved under its own key.
  const state = {
    settings: { ...DEFAULT_SETTINGS, ...store.get('settings', {}) },
    students: store.get('students', []).map(normalizeStudent),
    templates: null, // filled in by loadTemplates()
    categories: store.get('categories', null),
    history: store.get('history', []),
    scheduled: store.get('scheduled', []),
    route: 'dashboard',
  };

  const save = {
    settings: () => store.set('settings', state.settings),
    students: () => store.set('students', state.students),
    templates: () => store.set('templates', state.templates) && store.set('categories', state.categories),
    history: () => store.set('history', state.history),
    scheduled: () => store.set('scheduled', state.scheduled),
  };

  /**
   * First run: start from the default templates. On GitHub Pages we read templates.json,
   * so editing that file changes the defaults. Opened from a folder, we use the copy above.
   */
  async function loadTemplates() {
    const saved = store.get('templates', null);
    if (Array.isArray(saved)) {
      state.templates = saved.map((t) => normalizeTemplate(t));
      if (!Array.isArray(state.categories)) state.categories = [...DEFAULT_DATA.categories];
      return;
    }
    let data = DEFAULT_DATA;
    if (location.protocol.startsWith('http')) {
      try {
        const res = await fetch('templates.json', { cache: 'no-cache' });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.templates)) data = json;
        }
      } catch { /* offline or blocked: use the built-in copy */ }
    }
    state.templates = data.templates.map((t) => normalizeTemplate(t, true));
    state.categories = [...(data.categories || DEFAULT_DATA.categories)];
    save.templates();
  }

  const studentById = (id) => state.students.find((s) => s.id === id) || null;
  const templateById = (id) => state.templates.find((t) => t.id === id) || null;

  /** Category list in a steady order: the saved order first, then any new ones templates use. */
  function allCategories() {
    const list = [...(state.categories || [])];
    for (const t of state.templates) if (!list.includes(t.category)) list.push(t.category);
    return list;
  }

  /* =================================================================== 4. Theme */

  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function applyTheme() {
    const choice = state.settings.theme;
    const root = document.documentElement;
    if (choice === 'light' || choice === 'dark') root.dataset.theme = choice;
    else delete root.dataset.theme;
    const dark = choice === 'dark' || (choice === 'system' && darkQuery.matches);
    root.dataset.mode = dark ? 'dark' : 'light';
    for (const b of document.querySelectorAll('[data-theme-choice]')) {
      b.setAttribute('aria-checked', String(b.dataset.themeChoice === choice));
    }
  }

  /** The moon/sun button: flip to whichever mode isn't showing right now. */
  function toggleTheme() {
    state.settings.theme = document.documentElement.dataset.mode === 'dark' ? 'light' : 'dark';
    save.settings();
    applyTheme();
  }

  darkQuery.addEventListener?.('change', applyTheme);

  /* =================================================================== 5. Router */

  // Pages live at #/dashboard, #/students and so on, so the back button works
  // and it all runs the same from a folder or from GitHub Pages.
  const ROUTES = ['dashboard', 'students', 'templates', 'builder', 'scheduled', 'settings'];
  const views = {}; // each page registers { show(params) } below

  function currentRoute() {
    const [path, query] = location.hash.replace(/^#\/?/, '').split('?');
    return { route: ROUTES.includes(path) ? path : 'dashboard', params: new URLSearchParams(query || '') };
  }

  function go(route, params) {
    const hash = '#/' + route + (params ? '?' + new URLSearchParams(params) : '');
    if (location.hash === hash) renderRoute();
    else location.hash = hash;
  }

  function renderRoute() {
    const { route, params } = currentRoute();
    const changed = state.route !== route;
    state.route = route;
    for (const r of ROUTES) $('view-' + r).hidden = r !== route;
    for (const link of document.querySelectorAll('.nav-item')) {
      if (link.dataset.route === route) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    $('pageTitle').textContent = $('view-' + route).dataset.title;
    document.title = titlePrefix() + ($('view-' + route).dataset.title + ' · ReplyDesk');
    views[route].show(params, changed);
    if (changed) window.scrollTo(0, 0);
  }

  /** Re-draws the page you're on after data changes (the builder updates itself). */
  function refresh() {
    updateBadges();
    if (state.route !== 'builder') views[state.route].show(currentRoute().params, false);
  }

  /* =================================================================== 6. Toasts, dialogs */

  /**
   * Shows a little message at the bottom of the screen.
   * actions: [{ label, run }]. sticky toasts stay until someone clicks.
   */
  function toast(message, { sub = '', actions = [], duration = 3500, sticky = false, kind = '', iconName = '' } = {}) {
    const el = document.createElement('div');
    el.className = 'toast' + (kind ? ' ' + kind : '');
    el.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    el.innerHTML =
      (iconName ? icon(iconName) : '') +
      `<span class="toast-text"><span>${esc(message)}</span>${sub ? `<small>${esc(sub)}</small>` : ''}</span>`;
    const close = () => {
      if (!el.isConnected) return;
      el.classList.add('leaving');
      setTimeout(() => el.remove(), 180);
    };
    for (const action of actions) {
      const b = Object.assign(document.createElement('button'), { type: 'button', textContent: action.label });
      b.onclick = () => {
        close();
        action.run();
      };
      el.append(b);
    }
    if (sticky) {
      const x = Object.assign(document.createElement('button'), { type: 'button', className: 'toast-close', innerHTML: icon('x') });
      x.setAttribute('aria-label', 'Dismiss');
      x.onclick = close;
      el.append(x);
    } else {
      setTimeout(close, actions.length ? Math.max(duration, 6000) : duration);
    }
    $('toasts').append(el);
    // Keep at most 4 on screen.
    const all = $('toasts').children;
    if (all.length > 4) all[0].remove();
    return { close };
  }

  /** A yes/no question in a real dialog. Resolves true or false. */
  function confirmBox({ title, text = '', ok = 'OK', danger = false }) {
    const dialog = $('confirmDialog');
    $('confirmTitle').textContent = title;
    $('confirmText').textContent = text;
    $('confirmText').hidden = !text;
    $('confirmOk').textContent = ok;
    $('confirmOk').className = 'button ' + (danger ? 'danger' : 'primary');
    dialog.returnValue = '';
    dialog.showModal();
    $('confirmOk').focus();
    return new Promise((resolve) => {
      dialog.addEventListener('close', () => resolve(dialog.returnValue === 'ok'), { once: true });
    });
  }

  /* =================================================================== Placeholders and email text */

  const PH = /\{\{\s*([A-Za-z][\w]*)\s*\}\}/g;

  /** All the {{placeholders}} in some text, in the order they first appear. */
  function placeholdersIn(...texts) {
    const found = [];
    for (const text of texts) for (const m of String(text || '').matchAll(PH)) if (!found.includes(m[1])) found.push(m[1]);
    return found;
  }

  /** Info about a placeholder, including ones a teacher made up, like {{labName}} or {{dueDate}}. */
  function placeholderInfo(key) {
    if (PLACEHOLDERS[key]) return PLACEHOLDERS[key];
    const label = key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
    return { label, type: /date$/i.test(key) ? 'date' : 'text' };
  }

  /** Swaps {{placeholders}} for values. Anything without a value stays as {{it}} so it's easy to spot. */
  function fill(text, values) {
    return String(text || '').replace(PH, (whole, key) => {
      const v = values[key];
      return v == null || v === '' ? whole : v;
    });
  }

  /** Template text as HTML, with each {{placeholder}} shown as a little blue chip. */
  function withChips(text) {
    return esc(text).replace(PH, (_, key) => `<span class="ph">${esc(placeholderInfo(key).label)}</span>`);
  }

  /** The full email text for a template: greeting, the template itself, sign-off and signature. */
  function composeBody(template, audience) {
    const s = state.settings;
    const parts = [];
    if (template.greeting) {
      const greeting = (audience === 'student' ? s.greetingStudent : s.greetingParent).trim();
      if (greeting) parts.push(greeting);
    }
    parts.push(template.body.trim());
    if (template.greeting) {
      const closing = [s.signoff.trim(), s.signature.trim()].filter(Boolean).join('\n');
      if (closing) parts.push(closing);
    }
    return parts.join('\n\n');
  }

  /**
   * Builds the link that opens a ready-to-send draft.
   * mailto: opens the computer's email app (Outlook). The web options open a compose window in a new tab.
   * None of these need any Microsoft or Google permissions: they're just links.
   */
  function draftLink(how, { to, cc, subject, body }) {
    const toList = splitRecipients(to);
    const ccList = splitRecipients(cc);
    const enc = (v) => encodeURIComponent(v);
    if (how === 'outlookWeb') {
      const q = toList.length ? [`to=${enc(toList.join(';'))}`] : [];
      if (ccList.length) q.push(`cc=${enc(ccList.join(';'))}`);
      q.push(`subject=${enc(subject)}`, `body=${enc(body)}`);
      return 'https://outlook.office.com/mail/deeplink/compose?' + q.join('&');
    }
    if (how === 'gmail') {
      const q = ['view=cm', 'fs=1'];
      if (toList.length) q.push(`to=${enc(toList.join(','))}`);
      if (ccList.length) q.push(`cc=${enc(ccList.join(','))}`);
      q.push(`su=${enc(subject)}`, `body=${enc(body)}`);
      return 'https://mail.google.com/mail/?' + q.join('&');
    }
    const q = [];
    if (ccList.length) q.push(`cc=${ccList.map(enc).join(',')}`);
    q.push(`subject=${enc(subject)}`, `body=${enc(body.replace(/\r?\n/g, '\r\n'))}`);
    return 'mailto:' + toList.map((e) => enc(e).replace(/%40/g, '@')).join(',') + '?' + q.join('&');
  }

  const openLabel = () =>
    ({ mailto: 'Open Outlook Draft', outlookWeb: 'Open Outlook Draft', gmail: 'Open Gmail Draft' })[state.settings.openWith] || 'Open Outlook Draft';

  /* =================================================================== 7. Students page */

  const roster = {
    sort: { key: 'name', dir: 1 },
    selected: new Set(),
    editingId: null,
    pendingImport: null,

    show() {
      const terms = words($('studentSearch').value);
      const list = state.students
        .filter((s) => matchesAll(`${s.name} ${s.email} ${s.parentEmail} ${s.course}`.toLowerCase(), terms))
        .sort((a, b) => roster.sort.dir * (a[roster.sort.key] || '').localeCompare(b[roster.sort.key] || '', undefined, { sensitivity: 'base' }));

      // Forget selections for students that no longer exist.
      for (const id of [...roster.selected]) if (!studentById(id)) roster.selected.delete(id);

      const empty = state.students.length === 0;
      $('rosterEmpty').hidden = !empty;
      $('rosterCard').hidden = empty;
      $('exportRosterButton').disabled = empty;

      $('rosterBody').innerHTML =
        list
          .map(
            (s) => `
        <tr class="${roster.selected.has(s.id) ? 'selected' : ''}">
          <td class="col-check"><input type="checkbox" data-select="${esc(s.id)}" ${roster.selected.has(s.id) ? 'checked' : ''} aria-label="Select ${esc(s.name)}"></td>
          <td><span class="student-name"><span class="avatar" style="background:${avatarColor(s.name)}">${esc(initials(s.name))}</span><span>${esc(s.name)}<span class="name-email">${s.email ? esc(s.email) : 'Name only'}</span></span></span></td>
          <td class="email hide-phone">${s.email ? esc(s.email) : '<span class="muted" title="No email on file. When you write to them, Outlook looks up the address from the name.">Name only</span>'}</td>
          <td class="email hide-narrow">${esc(s.parentEmail) || '<span class="muted">–</span>'}</td>
          <td class="hide-narrow">${s.course ? `<span class="tag">${esc(s.course)}</span>` : ''}</td>
          <td class="col-actions">
            <button class="mini-button" type="button" data-action="email-student" data-id="${esc(s.id)}" title="Write an email">${icon('compose')}</button>
            <button class="mini-button" type="button" data-action="edit-student" data-id="${esc(s.id)}" title="Edit">${icon('edit')}</button>
            <button class="mini-button danger" type="button" data-action="delete-student" data-id="${esc(s.id)}" title="Remove">${icon('trash')}</button>
          </td>
        </tr>`
          )
          .join('') || `<tr><td colspan="6" class="list-empty">No students match “${esc($('studentSearch').value)}”.</td></tr>`;

      const courses = new Set(state.students.map((s) => s.course).filter(Boolean));
      $('rosterFoot').textContent =
        `${list.length === state.students.length ? '' : `Showing ${list.length} of `}${state.students.length} student${state.students.length === 1 ? '' : 's'}` +
        (courses.size ? ` · ${courses.size} course${courses.size === 1 ? '' : 's'}` : '');

      for (const b of document.querySelectorAll('.sort-button')) {
        b.dataset.dir = b.dataset.sort === roster.sort.key ? (roster.sort.dir === 1 ? 'asc' : 'desc') : '';
      }
      const visibleIds = list.map((s) => s.id);
      const selectedVisible = visibleIds.filter((id) => roster.selected.has(id)).length;
      $('studentSelectAll').checked = visibleIds.length > 0 && selectedVisible === visibleIds.length;
      $('studentSelectAll').indeterminate = selectedVisible > 0 && selectedVisible < visibleIds.length;
      $('studentSelectionBar').hidden = roster.selected.size === 0;
      $('studentSelectionCount').textContent = `${roster.selected.size} selected`;
      roster.visibleIds = visibleIds;
    },

    openEditor(id = null) {
      roster.editingId = id;
      const s = id ? studentById(id) : { name: '', email: '', parentEmail: '', course: '' };
      const form = $('studentForm');
      form.name.value = s.name;
      form.email.value = s.email;
      form.parentEmail.value = s.parentEmail;
      form.course.value = s.course;
      $('studentDialogTitle').textContent = id ? 'Edit student' : 'Add student';
      $('studentError').hidden = true;
      $('courseList').innerHTML = [...new Set(state.students.map((x) => x.course).filter(Boolean))].map((c) => `<option value="${esc(c)}">`).join('');
      $('studentDialog').showModal();
    },

    saveEditor() {
      const form = $('studentForm');
      const data = normalizeStudent({ name: form.name.value, email: form.email.value, parentEmail: form.parentEmail.value, course: form.course.value });
      const error = (msg) => {
        $('studentError').textContent = msg;
        $('studentError').hidden = false;
        return false;
      };
      if (!data.name) return error('Add a name.');
      // Email is optional: without one, Outlook looks the student up by name.
      if (data.email && !isEmail(data.email)) return error("That email doesn't look right. Leave it empty if you don't have it.");
      const badParent = splitEmails(data.parentEmail).find((e) => !isEmail(e));
      if (badParent) return error(`“${badParent}” doesn't look like an email.`);
      const duplicate = data.email && state.students.find((s) => s.email === data.email && s.id !== roster.editingId);
      if (duplicate) return error(`${duplicate.name} already uses that email.`);

      if (roster.editingId) Object.assign(studentById(roster.editingId), { ...data, id: roster.editingId });
      else state.students.push(data);
      save.students();
      toast(roster.editingId ? 'Student updated' : `Added ${data.name}`, { iconName: 'check' });
      refresh();
      return true;
    },

    async remove(ids) {
      const names = ids.map((id) => studentById(id)?.name).filter(Boolean);
      const ok = await confirmBox({
        title: ids.length === 1 ? `Remove ${names[0]}?` : `Remove ${ids.length} students?`,
        text: 'They’ll be taken off your roster. Emails you already sent stay in your history.',
        ok: 'Remove',
        danger: true,
      });
      if (!ok) return;
      const removed = state.students.filter((s) => ids.includes(s.id));
      state.students = state.students.filter((s) => !ids.includes(s.id));
      ids.forEach((id) => roster.selected.delete(id));
      save.students();
      refresh();
      toast(ids.length === 1 ? `Removed ${names[0]}` : `Removed ${ids.length} students`, {
        actions: [{ label: 'Undo', run: () => { state.students.push(...removed); save.students(); refresh(); } }],
      });
    },

    /* ---- CSV */

    /** Reads CSV text into rows. Handles quotes, commas inside quotes, and Excel's hidden BOM. */
    parseCSV(text) {
      text = text.replace(/^﻿/, '');
      const firstLine = text.split(/\r?\n/, 1)[0];
      // Copied straight out of a spreadsheet, columns are split by tabs. Otherwise pick whichever is most common.
      const delimiter = firstLine.includes('\t') ? '\t' : [';', ','].reduce((best, d) => (firstLine.split(d).length > firstLine.split(best).length ? d : best), ',');
      const rows = [];
      let row = [], cell = '', quoted = false;
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (quoted) {
          if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
          else if (c === '"') quoted = false;
          else cell += c;
        } else if (c === '"') quoted = true;
        else if (c === delimiter) { row.push(cell); cell = ''; }
        else if (c === '\n' || c === '\r') {
          if (c === '\r' && text[i + 1] === '\n') i++;
          row.push(cell); rows.push(row); row = []; cell = '';
        } else cell += c;
      }
      if (cell || row.length) { row.push(cell); rows.push(row); }
      return rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some(Boolean));
    },

    /** Turns CSV rows into students. Works with lots of column names ("Student Email", "Guardian Email", ...). */
    rosterFromCSV(text) {
      const rows = roster.parseCSV(text);
      const key = (h) => h.toLowerCase().replace(/[^a-z0-9]/g, '');
      const NAMES = {
        name: ['name', 'studentname', 'student', 'fullname', 'studentfullname'],
        first: ['firstname', 'first', 'givenname', 'studentfirstname', 'preferredname'],
        last: ['lastname', 'last', 'surname', 'familyname', 'studentlastname'],
        email: ['email', 'studentemail', 'emailaddress', 'mail', 'schoolemail', 'studentemailaddress'],
        parentEmail: ['parentemail', 'guardianemail', 'parentguardianemail', 'parent', 'guardian', 'parentsemail', 'contactemail', 'parentemailaddress', 'parentemails'],
        course: ['course', 'class', 'period', 'section', 'coursename', 'classname', 'courseperiod', 'courseandperiod'],
      };
      const header = (rows[0] || []).map(key);
      const col = {};
      for (const [field, names] of Object.entries(NAMES)) {
        const i = header.findIndex((h) => names.includes(h));
        if (i >= 0) col[field] = i;
      }
      let body = rows.slice(1);
      const hasHeader = Object.keys(col).length > 0;
      if (!hasHeader) {
        // No header row. If the second column holds emails, read it as Name, Email, Parent Email, Course.
        // Otherwise it's a plain list of names: name first, course second if there is one.
        if (rows[0] && isEmail(rows[0][1] || '')) Object.assign(col, { name: 0, email: 1, parentEmail: 2, course: 3 });
        else Object.assign(col, { name: 0, course: 1 });
        body = rows;
      } else if (col.name == null && col.first == null && col.last == null && col.email == null) {
        return { error: 'Couldn’t find a Name column. The first row should have headers like Name and Email.' };
      }

      const students = [], skipped = [], seen = new Set();
      body.forEach((r, i) => {
        const get = (f) => (col[f] != null ? r[col[f]] || '' : '');
        let name = get('name') || [get('first'), get('last')].filter(Boolean).join(' ');
        // Rosters often come as "Smith, John". Flip it to "John Smith".
        const flipped = name.match(/^([^,]+),\s*([^,]+)$/);
        if (flipped) name = `${flipped[2]} ${flipped[1]}`;
        name = name.replace(/\s+/g, ' ').trim();
        const email = get('email').toLowerCase();
        const line = i + (body === rows ? 1 : 2);
        // A missing email is fine (the student becomes "name only"). A broken one gets skipped so it can be fixed.
        if (email && !isEmail(email)) return skipped.push({ line, reason: `“${email}” isn’t an email` });
        if (!email && !name) return skipped.push({ line, reason: 'no name' });
        const key = email || `${name.toLowerCase()}|${get('course').toLowerCase()}`;
        if (seen.has(key)) return skipped.push({ line, reason: `${email || name} is listed twice` });
        seen.add(key);
        students.push(normalizeStudent({ name: name || email.split('@')[0], email, parentEmail: get('parentEmail'), course: get('course') }));
      });
      const columns = Object.keys(col).filter((f) => body.some((r) => r[col[f]]));
      return { students, skipped, columns };
    },

    /**
     * Reads a pasted list. A list copied from a spreadsheet or Infinite Campus (tab separated) or a CSV
     * goes through the normal reader. A plain list with no emails is one student per line, so
     * "Smith, John" stays one name instead of getting split at the comma.
     */
    rosterFromPaste(text) {
      text = String(text || '').trim();
      if (!text) return { error: 'Paste a list of students first.' };
      if (text.includes('\t') || text.includes('@')) return roster.rosterFromCSV(text);
      const HEADER = /^(student\s*)?(full\s*)?names?$/i;
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !HEADER.test(l));
      const csv = 'Name\n' + lines.map((l) => `"${l.replace(/"/g, '""')}"`).join('\n');
      return roster.rosterFromCSV(csv);
    },

    openPaste() {
      $('pasteText').value = '';
      $('pasteError').hidden = true;
      $('pasteDialog').showModal();
      $('pasteText').focus();
    },

    /** "Next" in the paste box: show the same preview a CSV file gets. */
    submitPaste() {
      const result = roster.rosterFromPaste($('pasteText').value);
      if (result.error || !result.students.length) {
        $('pasteError').textContent = result.error || 'Couldn’t find any students in that.';
        $('pasteError').hidden = false;
        return false;
      }
      $('pasteDialog').close();
      roster.showImport('your pasted list', result);
      return true;
    },

    /** Shows the import preview for a CSV file. */
    previewImport(name, text) {
      const result = roster.rosterFromCSV(text);
      if (result.error) return toast(result.error, { kind: 'error', duration: 7000 });
      roster.showImport(name, result);
    },

    showImport(name, result) {
      if (!result.students.length) return toast('No students found in that.', { kind: 'error', sub: result.skipped.length ? `${result.skipped.length} rows were skipped.` : '' });
      roster.pendingImport = result.students;
      const extra = [];
      if (result.columns.includes('parentEmail')) extra.push('parent emails');
      if (result.columns.includes('course')) extra.push('courses');
      const nameOnly = result.students.filter((s) => !s.email).length;
      $('importSummary').innerHTML =
        `<b>${result.students.length} student${result.students.length === 1 ? '' : 's'}</b> found in ${esc(name)}` +
        (extra.length ? `, with ${extra.join(' and ')}` : '') +
        '.' +
        (result.skipped.length
          ? ` Skipped ${result.skipped.length}: ${result.skipped.slice(0, 3).map((s) => `row ${s.line} (${esc(s.reason)})`).join(', ')}${result.skipped.length > 3 ? '…' : ''}.`
          : '') +
        (nameOnly
          ? ` <br><b>${nameOnly === result.students.length ? 'None of them have' : `${nameOnly} don’t have`} an email</b>, and that’s fine: when you write to them, their name goes in Outlook’s To box and Outlook finds the address.`
          : '');
      const preview = result.students.slice(0, 6);
      $('importPreview').innerHTML =
        '<thead><tr><th>Name</th><th>Email</th><th>Parent email</th><th>Course</th></tr></thead><tbody>' +
        preview.map((s) => `<tr><td>${esc(s.name)}</td><td>${s.email ? esc(s.email) : '<span class="muted">Name only</span>'}</td><td>${esc(s.parentEmail)}</td><td>${esc(s.course)}</td></tr>`).join('') +
        (result.students.length > preview.length ? `<tr><td colspan="4" class="muted">…and ${result.students.length - preview.length} more</td></tr>` : '') +
        '</tbody>';
      $('importForm').mode.value = state.students.length ? 'merge' : 'replace';
      $('importDialog').showModal();
    },

    applyImport(mode) {
      const incoming = roster.pendingImport || [];
      let added = 0, updated = 0;
      const find = (s) => state.students.find((x) => sameStudent(x, s));
      if (mode === 'replace') {
        // Keep each student's old id when they match, so history still links up.
        state.students = incoming.map((s) => ({ ...s, id: find(s)?.id || s.id }));
        added = incoming.length;
      } else {
        for (const s of incoming) {
          const existing = find(s);
          if (existing) {
            // Fill in what the new list has, but never erase an email or parent email we already know.
            Object.assign(existing, { name: s.name, email: s.email || existing.email, parentEmail: s.parentEmail || existing.parentEmail, course: s.course || existing.course });
            updated++;
          } else {
            state.students.push(s);
            added++;
          }
        }
      }
      roster.pendingImport = null;
      save.students();
      go('students');
      refresh();
      toast(mode === 'replace' ? `Roster replaced: ${added} students` : `Added ${added}, updated ${updated}`, { iconName: 'check' });
    },

    exportCSV() {
      // A cell starting with = + - @ could run as a formula in Excel, so those get a ' in front.
      const cell = (v) => {
        let s = String(v ?? '');
        if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const lines = [['Name', 'Email', 'Parent Email', 'Course'], ...state.students.map((s) => [s.name, s.email, s.parentEmail, s.course])];
      downloadFile(`roster-${isoDate()}.csv`, lines.map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n', 'text/csv');
    },

    async importFromPicker() {
      const file = await pickFile($('csvFile'));
      if (file) roster.previewImport(file.name, file.text);
    },
  };
  views.students = roster;

  /* =================================================================== 8. Templates page */

  const templatesPage = {
    filter: 'all',
    editingId: null,
    lastField: null, // the subject or body box, whichever was used last, for inserting placeholders

    show(params) {
      if (params?.get('filter')) templatesPage.filter = params.get('filter');
      const terms = words($('templateSearch').value);
      const cats = allCategories();
      const count = (fn) => state.templates.filter(fn).length;

      // Filter chips: All, Favorites, Recent, then one per category.
      const filters = [
        ['all', 'All', state.templates.length],
        ['favorites', 'Favorites', count((t) => t.favorite)],
        ['recent', 'Recently used', count((t) => t.lastUsed)],
        ...cats.map((c) => [c, c, count((t) => t.category === c)]),
      ];
      if (!filters.some(([id]) => id === templatesPage.filter)) templatesPage.filter = 'all';
      $('templateFilters').innerHTML = filters
        .map(([id, label, n]) => `<button class="chip" type="button" role="tab" data-filter="${esc(id)}" aria-selected="${id === templatesPage.filter}">${id === 'favorites' ? icon('star') : ''}${esc(label)} <span class="count">${n}</span></button>`)
        .join('');

      let list = state.templates.filter((t) => matchesAll(`${t.title} ${t.category} ${t.subject} ${t.body}`.toLowerCase(), terms));
      const f = templatesPage.filter;
      if (f === 'favorites') list = list.filter((t) => t.favorite);
      else if (f === 'recent') list = list.filter((t) => t.lastUsed).sort((a, b) => b.lastUsed - a.lastUsed);
      else if (f !== 'all') list = list.filter((t) => t.category === f);

      // "All" with no search shows a section per category. Everything else is one grid.
      let groups;
      if (f === 'all' && !terms.length) {
        groups = cats.map((c) => [c, list.filter((t) => t.category === c)]).filter(([, items]) => items.length);
      } else {
        groups = [[terms.length ? `${list.length} result${list.length === 1 ? '' : 's'}` : '', list]];
      }
      $('templatesEmpty').hidden = list.length > 0;
      $('templateGroups').innerHTML = list.length
        ? groups
            .map(
              ([title, items]) => `
        <section class="template-group">
          ${title ? `<h3 class="group-title">${esc(title)}</h3>` : ''}
          <div class="template-grid">${items.map(templatesPage.card).join('')}</div>
        </section>`
            )
            .join('')
        : '';
    },

    card(t) {
      return `
        <article class="card template-card">
          <div class="top">
            <h4>${esc(t.title)}</h4>
            <button class="star-button" type="button" data-action="fav-template" data-id="${esc(t.id)}" aria-pressed="${t.favorite}" title="${t.favorite ? 'Unfavorite' : 'Favorite'}">${icon('star')}</button>
          </div>
          <div><span class="tag">${esc(t.category)}</span>${t.audience === 'parent' ? ' <span class="tag blue">Parents</span>' : ''}</div>
          ${t.subject ? `<div class="subject">${withChips(t.subject)}</div>` : ''}
          <div class="snippet">${withChips(t.body)}</div>
          <div class="bottom">
            <span class="uses">${t.uses ? `Used ${t.uses} time${t.uses === 1 ? '' : 's'}` : 'Not used yet'}</span>
            <button class="mini-button" type="button" data-action="edit-template" data-id="${esc(t.id)}" title="Edit">${icon('edit')}</button>
            <button class="mini-button" type="button" data-action="dup-template" data-id="${esc(t.id)}" title="Duplicate">${icon('duplicate')}</button>
            <button class="mini-button danger" type="button" data-action="delete-template" data-id="${esc(t.id)}" title="Delete">${icon('trash')}</button>
            <button class="button small primary" type="button" data-action="use-template" data-id="${esc(t.id)}">Use</button>
          </div>
        </article>`;
    },

    toggleFavorite(id) {
      const t = templateById(id);
      if (!t) return;
      t.favorite = !t.favorite;
      save.templates();
      refresh();
      if (state.route === 'builder') builder.render();
    },

    /* ---- editor */

    openEditor(id = null, preset = {}) {
      templatesPage.editingId = id;
      const t = id ? templateById(id) : normalizeTemplate({ title: '', category: preset.category || allCategories()[0], body: '', ...preset });
      const form = $('templateForm');
      $('templateDialogTitle').textContent = id ? 'Edit template' : 'New template';
      $('templateCategory').innerHTML =
        allCategories().map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('') + '<option value="__new">New category…</option>';
      form.title.value = t.title;
      form.category.value = t.category;
      form.audience.value = t.audience;
      form.subject.value = t.subject;
      form.body.value = t.body;
      form.greeting.checked = t.greeting;
      form.favorite.checked = t.favorite;
      form.newCategory.value = '';
      $('newCategoryField').hidden = true;
      $('templateError').hidden = true;
      templatesPage.lastField = form.body;
      $('placeholderBar').innerHTML =
        '<span class="muted small">Insert:</span>' +
        Object.keys(PLACEHOLDERS).map((k) => `<button type="button" data-insert="${k}">${esc(PLACEHOLDERS[k].label)}</button>`).join('');
      templatesPage.preview();
      $('templateDialog').showModal();
      form.title.focus();
    },

    /** The live preview in the editor, filled in with example values. */
    preview() {
      const form = $('templateForm');
      const sample = state.students[0];
      const name = sample?.name || 'John Smith';
      const today = isoDate();
      const values = {
        studentName: name,
        firstName: firstNameOf(name),
        teacherName: state.settings.teacherName || 'Ms. Johnson',
        date: longDate(today),
        startDate: longDate(today),
        endDate: longDate(addDays(today, 7)),
        assignmentName: 'Unit 3 Test',
        course: sample?.course || state.settings.defaultCourse || 'Biology',
      };
      const draft = normalizeTemplate({ body: form.body.value || ' ', greeting: form.greeting.checked });
      const audience = form.audience.value;
      $('templatePreviewSubject').innerHTML = withChips(fill(form.subject.value, values)) || '<span class="muted">No subject</span>';
      $('templatePreviewBody').innerHTML = withChips(fill(composeBody(draft, audience), values));
    },

    saveEditor() {
      const form = $('templateForm');
      let category = form.category.value;
      if (category === '__new') category = form.newCategory.value.trim();
      const error = (msg) => {
        $('templateError').textContent = msg;
        $('templateError').hidden = false;
        return false;
      };
      if (!form.title.value.trim()) return error('Give the template a name.');
      if (!form.body.value.trim()) return error('Write the message.');
      if (!category) return error('Name the new category.');
      if (!state.categories.includes(category)) state.categories.push(category);

      const fields = {
        title: form.title.value.trim(),
        category,
        audience: form.audience.value,
        subject: form.subject.value.trim(),
        body: form.body.value.trim(),
        greeting: form.greeting.checked,
        favorite: form.favorite.checked,
        updatedAt: Date.now(),
      };
      if (templatesPage.editingId) Object.assign(templateById(templatesPage.editingId), fields);
      else state.templates.unshift(normalizeTemplate({ ...fields, id: uid() }));
      save.templates();
      toast(templatesPage.editingId ? 'Template saved' : 'Template created', { iconName: 'check' });
      refresh();
      if (state.route === 'builder') builder.render();
      return true;
    },

    duplicate(id) {
      const t = templateById(id);
      const copy = normalizeTemplate({ ...clone(t), id: uid(), title: `${t.title} (copy)`, builtIn: false, uses: 0, lastUsed: null, favorite: false });
      state.templates.splice(state.templates.indexOf(t) + 1, 0, copy);
      save.templates();
      refresh();
      templatesPage.openEditor(copy.id);
    },

    async remove(id) {
      const t = templateById(id);
      const ok = await confirmBox({
        title: `Delete “${t.title}”?`,
        text: t.builtIn ? 'You can bring the default templates back any time from Settings.' : 'This can’t be undone after you leave this page.',
        ok: 'Delete',
        danger: true,
      });
      if (!ok) return;
      const index = state.templates.indexOf(t);
      state.templates.splice(index, 1);
      save.templates();
      if (builder.draft.templateId === id) builder.clearTemplate();
      refresh();
      toast('Template deleted', { actions: [{ label: 'Undo', run: () => { state.templates.splice(index, 0, t); save.templates(); refresh(); } }] });
    },

    /** Puts a {{placeholder}} wherever the cursor was in the subject or message box. */
    insertPlaceholder(key) {
      const field = templatesPage.lastField || $('templateBody');
      const text = `{{${key}}}`;
      const start = field.selectionStart ?? field.value.length;
      const end = field.selectionEnd ?? field.value.length;
      field.setRangeText(text, start, end, 'end');
      field.focus();
      templatesPage.preview();
    },
  };
  views.templates = templatesPage;

  /* =================================================================== 9. Draft builder */

  const blankDraft = () => ({
    studentId: null,
    recipient: 'student', // 'student' | 'parent' | 'both'
    templateId: null,
    fields: {}, // values typed into the Details step, keyed by placeholder
    to: '',
    cc: '',
    subject: '',
    body: '',
    edited: false, // true once the teacher types in the subject or body themselves
    toEdited: false, // true once the teacher types in the To box themselves
  });

  const builder = {
    draft: { ...blankDraft(), ...store.get('draft', {}) },

    show(params, changed) {
      // Links like #/builder?student=ID or ?template=ID pre-fill the builder.
      if (params?.get('student')) builder.setStudent(params.get('student'), { silent: true });
      if (params?.get('template')) builder.setTemplate(params.get('template'), { silent: true });
      if (params?.toString()) history.replaceState(null, '', '#/builder');
      builder.render();
      if (changed) builder.focusNext();
    },

    /** Puts the cursor in the next empty step: student, then template, then the first blank detail. */
    focusNext() {
      const d = builder.draft;
      setTimeout(() => {
        if (!d.studentId && !d.to) $('studentPick').focus();
        else if (!d.templateId && !d.body) $('templatePick').focus();
        else {
          const blank = [...document.querySelectorAll('#placeholderFields input')].find((i) => !i.value);
          (blank || $('openDraftButton')).focus();
        }
      }, 30);
    },

    student: () => studentById(builder.draft.studentId),
    template: () => templateById(builder.draft.templateId),

    /** Who the email is written to, for picking the right greeting. */
    audience() {
      return builder.draft.recipient === 'student' ? 'student' : 'parent';
    },

    /** Values for every placeholder, from the student, your settings and the Details step. */
    values() {
      const d = builder.draft;
      const s = builder.student();
      const name = s ? s.name : d.fields.studentName || '';
      const values = {};
      for (const [key, value] of Object.entries(d.fields)) values[key] = placeholderInfo(key).type === 'date' ? longDate(value) : value;
      Object.assign(values, {
        studentName: name,
        firstName: firstNameOf(name),
        teacherName: state.settings.teacherName || d.fields.teacherName || '',
        course: d.fields.course || s?.course || state.settings.defaultCourse || '',
      });
      return values;
    },

    recipientsFor(student, recipient) {
      if (!student) return '';
      const list = [];
      // No email on file? Use the name. Outlook looks it up (or it's left blank, depending on Settings).
      if (recipient !== 'parent') {
        if (student.email) list.push(student.email);
        else if (state.settings.nameOnlyTo !== 'blank') list.push(student.name);
      }
      if (recipient !== 'student' && student.parentEmail) list.push(...splitEmails(student.parentEmail));
      return list.join(', ');
    },

    /* ---- choosing things */

    setStudent(id, { silent } = {}) {
      const d = builder.draft;
      const s = studentById(id);
      if (!s) return;
      d.studentId = id;
      d.toEdited = false;
      if (!s.parentEmail) d.recipient = 'student';
      else if (builder.template()?.audience === 'parent') d.recipient = 'parent';
      d.to = builder.recipientsFor(s, d.recipient);
      builder.regenerate();
      if (!silent) {
        builder.render();
        builder.focusNext();
      }
    },

    setTemplate(id, { silent } = {}) {
      const d = builder.draft;
      const t = templateById(id);
      if (!t) return;
      d.templateId = id;
      d.edited = false;
      // Parent templates go to the parent, if we have their email.
      const s = builder.student();
      if (s) {
        d.recipient = t.audience === 'parent' && s.parentEmail ? 'parent' : 'student';
        if (!d.toEdited) d.to = builder.recipientsFor(s, d.recipient);
      }
      builder.regenerate();
      if (!silent) {
        builder.render();
        builder.focusNext();
      }
    },

    setRecipient(recipient) {
      const d = builder.draft;
      d.recipient = recipient;
      d.toEdited = false;
      d.to = builder.recipientsFor(builder.student(), recipient);
      builder.regenerate();
      builder.render();
    },

    clearStudent() {
      Object.assign(builder.draft, { studentId: null, to: '', toEdited: false, recipient: 'student' });
      builder.regenerate();
      builder.render();
      $('studentPick').focus();
    },

    clearTemplate() {
      Object.assign(builder.draft, { templateId: null, edited: false });
      builder.render();
      $('templatePick').focus();
    },

    /** Rewrites the subject and body from the template, unless the teacher has edited them. */
    regenerate() {
      const d = builder.draft;
      const t = builder.template();
      if (!t || d.edited) return;
      const values = builder.values();
      d.subject = fill(t.subject, values);
      d.body = fill(composeBody(t, builder.audience()), values);
    },

    /* ---- drawing the page */

    render() {
      const d = builder.draft;
      const s = builder.student();
      const t = builder.template();

      // Step 1: student
      $('studentCombo').hidden = !!s;
      $('pickedStudent').hidden = !s;
      if (s) {
        $('pickedStudent').innerHTML = `
          <span class="avatar" style="background:${avatarColor(s.name)}">${esc(initials(s.name))}</span>
          <span class="row-main"><span class="row-title">${esc(s.name)}</span><span class="row-sub">${esc(studentSub(s))}</span></span>
          <button class="mini-button" type="button" data-action="clear-student" title="Choose someone else">${icon('x')}</button>`;
      } else if (studentCombo) studentCombo.close();
      $('recipientSeg').hidden = !s;
      for (const b of $('recipientSeg').children) {
        b.setAttribute('aria-checked', String(b.dataset.to === d.recipient));
        b.disabled = b.dataset.to !== 'student' && !s?.parentEmail;
        b.title = b.disabled ? 'No parent email on file' : '';
      }

      // A parent template, but no parent email on file: say where it's going instead.
      const noParent = s && t?.audience === 'parent' && !s.parentEmail;
      $('recipientNote').hidden = !noParent;
      if (noParent) $('recipientNote').textContent = `There's no parent email for ${s.name}, so this goes to the student. Add one on the Students page.`;

      // Step 2: template
      $('templateCombo').hidden = !!t;
      $('pickedTemplate').hidden = !t;
      if (t) {
        $('pickedTemplate').innerHTML = `
          <span class="row-icon">${icon('templates')}</span>
          <span class="row-main"><span class="row-title">${esc(t.title)}</span><span class="row-sub">${esc(t.category)}</span></span>
          <button class="mini-button" type="button" data-action="clear-template" title="Choose a different template">${icon('x')}</button>`;
      }
      const favorites = state.templates.filter((x) => x.favorite).slice(0, 6);
      $('builderQuickTemplates').hidden = !!t || !favorites.length;
      $('builderQuickTemplates').innerHTML = favorites
        .map((x) => `<button class="chip" type="button" data-action="pick-template" data-id="${esc(x.id)}">${icon('star')}${esc(x.title)}</button>`)
        .join('');

      // Step 3: details
      builder.renderFields();

      // The email
      $('draftTo').value = d.to;
      $('draftCc').value = d.cc;
      $('draftSubject').value = d.subject;
      if ($('draftBody').value !== d.body) $('draftBody').value = d.body;
      $('openDraftLabel').textContent = openLabel();
      builder.updateStatus();
    },

    /** One input for each blank the template needs: date pickers for dates, text boxes for the rest. */
    renderFields() {
      const d = builder.draft;
      const t = builder.template();
      const keys = t
        ? placeholdersIn(t.subject, composeBody(t, builder.audience())).filter((k) => {
            if (k === 'studentName' || k === 'firstName') return !builder.student();
            if (k === 'teacherName') return !state.settings.teacherName;
            return true;
          })
        : [];
      $('detailsStep').hidden = keys.length === 0;
      const s = builder.student();
      $('placeholderFields').innerHTML = keys
        .map((key) => {
          const info = placeholderInfo(key);
          const value = d.fields[key] || '';
          const id = 'ph-' + key;
          if (info.type === 'date') {
            const min = key === 'endDate' && d.fields.startDate ? ` min="${esc(d.fields.startDate)}"` : '';
            return `
              <label class="field" for="${id}"><span>${esc(info.label)}</span>
                <input type="date" id="${id}" data-key="${esc(key)}" value="${esc(value)}"${min}>
                <span class="chips date-chips">
                  <button class="chip" type="button" data-date="${esc(key)}" data-offset="0">Today</button>
                  <button class="chip" type="button" data-date="${esc(key)}" data-offset="1">Tomorrow</button>
                  <button class="chip" type="button" data-date="${esc(key)}" data-offset="7">In a week</button>
                </span>
              </label>`;
          }
          let hint = info.hint || '';
          if (key === 'course') hint = s?.course || state.settings.defaultCourse || 'Biology';
          const note = key === 'teacherName' ? '<small>Save it once in Settings so you never type it again.</small>' : '';
          return `
            <label class="field ${key === 'assignmentName' ? 'full' : ''}" for="${id}"><span>${esc(info.label)}</span>
              <input type="text" id="${id}" data-key="${esc(key)}" value="${esc(value)}" placeholder="${esc(hint)}">${note}
            </label>`;
        })
        .join('');
    },

    /** Blanks left, character count, the edited note, and the autosave. */
    updateStatus() {
      const d = builder.draft;
      const left = placeholdersIn(d.subject, d.body);
      $('blanksNote').hidden = left.length === 0;
      $('blanksNote').textContent = left.length ? `${left.length} blank${left.length === 1 ? '' : 's'} left: ${left.map((k) => placeholderInfo(k).label).join(', ')}` : '';
      for (const input of document.querySelectorAll('#placeholderFields input')) {
        input.closest('.field').classList.toggle('missing', left.includes(input.dataset.key));
      }
      const chars = d.body.length;
      const wordCount = (d.body.match(/\S+/g) || []).length;
      const linkLength = draftLink('mailto', d).length;
      const tooLong = state.settings.openWith === 'mailto' && linkLength > MAILTO_SAFE_LENGTH;
      $('charCounter').textContent = `${chars} character${chars === 1 ? '' : 's'} · ${wordCount} word${wordCount === 1 ? '' : 's'}` + (tooLong ? ' · Long for Outlook. Use Copy if it gets cut off.' : '');
      $('charCounter').classList.toggle('warn', tooLong);
      $('editedNote').hidden = !(d.edited && builder.template());
      builder.autosave();
    },

    autosave: debounce(() => {
      store.set('draft', builder.draft);
      const note = $('autosaveNote');
      note.textContent = 'Autosaved';
      note.style.opacity = 1;
    }, 300),

    /** The email as it stands, for history and reminders. */
    snapshot() {
      const d = builder.draft;
      return {
        ...clone(d),
        studentName: builder.student()?.name || '',
        templateTitle: builder.template()?.title || '',
      };
    },

    load(snapshot) {
      builder.draft = { ...blankDraft(), ...clone(snapshot) };
      delete builder.draft.studentName;
      delete builder.draft.templateTitle;
      // If the student was removed since, keep the email address that was typed.
      if (builder.draft.studentId && !builder.student()) builder.draft.studentId = null;
      if (builder.draft.templateId && !builder.template()) builder.draft.templateId = null;
      go('builder');
      builder.render();
    },

    reset({ undo = true } = {}) {
      const before = clone(builder.draft);
      builder.draft = blankDraft();
      builder.render();
      const hadSomething = before.body.trim() || before.to.trim();
      if (undo && hadSomething) toast('Started a new email', { actions: [{ label: 'Undo', run: () => builder.load(before) }] });
    },

    /** Keeps the template and details, swaps in the next student. Great for sending the same reply to a bunch of kids. */
    nextStudent() {
      Object.assign(builder.draft, { studentId: null, to: '', toEdited: false, edited: false });
      go('builder');
      builder.regenerate();
      builder.render();
      $('studentPick').focus();
    },

    /* ---- sending */

    validate() {
      const d = builder.draft;
      const to = splitRecipients(d.to);
      // A name-only student with "leave To empty" turned on is allowed through with no To.
      const blankOnPurpose = !to.length && builder.student() && !builder.student().email && d.recipient !== 'parent';
      if (!to.length && !blankOnPurpose) {
        toast('Pick a student or type an email address first.', { kind: 'error' });
        $(d.studentId ? 'draftTo' : 'studentPick').focus();
        return false;
      }
      // Anything with an @ has to be a real address. Anything without one is a name for Outlook to look up.
      const bad = [...to, ...splitRecipients(d.cc)].find((e) => e.includes('@') && !isEmail(e));
      if (bad) {
        toast(`“${bad}” doesn’t look like an email address.`, { kind: 'error' });
        return false;
      }
      return true;
    },

    async openDraft() {
      if (!builder.validate()) return;
      const d = builder.draft;
      const left = placeholdersIn(d.subject, d.body);
      if (left.length) {
        const ok = await confirmBox({
          title: `${left.length} blank${left.length === 1 ? '' : 's'} not filled in`,
          text: `The email still says ${left.map((k) => `{{${k}}}`).join(', ')}. Open it anyway?`,
          ok: 'Open anyway',
        });
        if (!ok) return;
      }
      const how = state.settings.openWith;
      const link = draftLink(how, d);
      // Name-only student with To left empty: copy their name so it's one paste away in Outlook.
      const s = builder.student();
      const pasteName = s && !s.email && !splitRecipients(d.to).length;
      if (pasteName) copyText(s.name);
      if (how === 'mailto') {
        if (link.length > MAILTO_SAFE_LENGTH) toast('This one is long. If Outlook cuts it off, use Copy and paste it in.', { duration: 6000 });
        window.location.href = link;
      } else {
        window.open(link, '_blank', 'noopener');
      }
      builder.recordSent(how, { pasteName });
    },

    recordSent(how, { pasteName = false } = {}) {
      const snap = builder.snapshot();
      historyLog.add(snap, how);
      const t = builder.template();
      if (t) {
        t.uses += 1;
        t.lastUsed = Date.now();
        save.templates();
      }
      updateBadges();
      const name = snap.studentName || splitRecipients(snap.to)[0];
      const actions = [];
      if (t) actions.push({ label: 'Same reply, next student', run: builder.nextStudent });
      actions.push({ label: 'Follow up…', run: () => scheduler.openDialog({ kind: 'followup', studentId: snap.studentId, draft: null, title: `Follow up with ${name}` }) });
      if (how === 'mailto') {
        actions.push({ label: 'Outlook didn’t open?', run: builder.mailtoHelp });
      }
      const nameOnly = !pasteName && builder.student() && !builder.student().email && snap.recipient !== 'parent';
      const sub = pasteName
        ? `Their name is copied. Click To in Outlook, press Ctrl V (⌘V on a Mac), and pick ${name}.`
        : nameOnly
          ? `If Outlook doesn’t turn ${name} into an address, click their name in To and pick them from the list.`
          : how === 'mailto' ? 'Press Send in Outlook.' : 'It opened in a new tab.';
      toast(`Draft opened for ${name}`, { sub, actions, iconName: 'send', duration: pasteName || nameOnly ? 12000 : 9000 });
    },

    async mailtoHelp() {
      const ok = await confirmBox({
        title: 'Use Outlook on the web instead?',
        text: 'If Outlook isn’t set as this computer’s email app, mailto links don’t open anything. Outlook on the web works on any computer where you can sign in to your school email.',
        ok: 'Switch to Outlook on the web',
      });
      if (!ok) return;
      state.settings.openWith = 'outlookWeb';
      save.settings();
      builder.render();
      window.open(draftLink('outlookWeb', builder.draft), '_blank', 'noopener');
    },

    async copy() {
      const d = builder.draft;
      if (!d.body.trim()) return toast('Nothing to copy yet.');
      const ok = await copyText(d.body);
      toast(ok ? 'Copied the email text' : 'Couldn’t copy. Select the text and press Ctrl C.', { iconName: ok ? 'copy' : '', kind: ok ? '' : 'error' });
    },
  };
  views.builder = builder;

  /* ---- searchable dropdowns (used for picking students and templates) */

  /**
   * Makes a text box into a searchable list.
   * search(query) returns [{ group: 'Title' }] headings and [{ id, html }] options.
   */
  function combo({ input, list, search, onPick }) {
    let options = [];
    let active = -1;

    function draw() {
      const items = search(input.value.trim());
      options = items.filter((i) => !i.group);
      active = options.length ? 0 : -1;
      let n = -1;
      list.innerHTML =
        items
          .map((item) => {
            if (item.group) return `<li class="option-group" role="presentation">${esc(item.group)}</li>`;
            n++;
            return `<li class="option" role="option" id="${list.id}-${n}" data-index="${n}" aria-selected="${n === active}">${item.html}</li>`;
          })
          .join('') || '<li class="option-empty">No matches</li>';
      input.setAttribute('aria-activedescendant', active >= 0 ? `${list.id}-${active}` : '');
    }

    function highlight(index) {
      active = index;
      for (const li of list.querySelectorAll('.option')) li.setAttribute('aria-selected', String(Number(li.dataset.index) === active));
      const el = list.querySelector(`[data-index="${active}"]`);
      el?.scrollIntoView({ block: 'nearest' });
      input.setAttribute('aria-activedescendant', el ? el.id : '');
    }

    function open() {
      draw();
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    }

    function close() {
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
    }

    function pick(index) {
      const option = options[index];
      if (!option) return;
      input.value = '';
      close();
      onPick(option.id);
    }

    input.addEventListener('focus', open);
    input.addEventListener('input', open);
    input.addEventListener('blur', () => setTimeout(close, 120));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (list.hidden) open(); else highlight(Math.min(active + 1, options.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); highlight(Math.max(active - 1, 0)); }
      else if (e.key === 'Enter') { e.preventDefault(); pick(active); }
      else if (e.key === 'Escape') { close(); }
    });
    list.addEventListener('mousedown', (e) => e.preventDefault()); // keep focus in the box
    list.addEventListener('click', (e) => {
      const li = e.target.closest('.option');
      if (li) pick(Number(li.dataset.index));
    });
    list.addEventListener('mousemove', (e) => {
      const li = e.target.closest('.option');
      if (li && Number(li.dataset.index) !== active) highlight(Number(li.dataset.index));
    });
    return { open, close };
  }

  function studentOptionHtml(s) {
    return `<span class="avatar" style="background:${avatarColor(s.name)}">${esc(initials(s.name))}</span>
      <span class="option-main"><span class="option-title">${esc(s.name)}</span><span class="option-sub">${esc(studentSub(s))}</span></span>`;
  }

  function templateOptionHtml(t) {
    return `<span class="option-main"><span class="option-title">${esc(t.title)}</span><span class="option-sub">${esc(t.body)}</span></span>
      ${t.favorite ? icon('star', 'star-icon') : ''}<span class="tag">${esc(t.category)}</span>`;
  }

  /** Students matching a search, best matches first (names that start with what you typed). */
  function searchStudents(query, limit = 60) {
    const terms = words(query);
    const q = query.toLowerCase();
    return state.students
      .filter((s) => matchesAll(`${s.name} ${s.email} ${s.course}`.toLowerCase(), terms))
      .sort((a, b) => {
        const rank = (s) => (s.name.toLowerCase().startsWith(q) ? 0 : s.name.toLowerCase().includes(' ' + q) ? 1 : 2);
        return rank(a) - rank(b) || a.name.localeCompare(b.name);
      })
      .slice(0, limit);
  }

  function searchTemplates(query) {
    const terms = words(query);
    return state.templates
      .filter((t) => matchesAll(`${t.title} ${t.category} ${t.subject} ${t.body}`.toLowerCase(), terms))
      .sort((a, b) => {
        const titleHit = (t) => (terms.every((w) => t.title.toLowerCase().includes(w)) ? 0 : 1);
        return titleHit(a) - titleHit(b) || b.favorite - a.favorite || (b.lastUsed || 0) - (a.lastUsed || 0) || a.title.localeCompare(b.title);
      });
  }

  let studentCombo = null;
  let templateCombo = null;

  function setUpBuilder() {
    studentCombo = combo({
      input: $('studentPick'),
      list: $('studentPickList'),
      search: (q) => {
        if (!state.students.length) return [{ group: 'No students yet. Import a roster on the Students page.' }];
        const found = searchStudents(q);
        return found.map((s) => ({ id: s.id, html: studentOptionHtml(s) }));
      },
      onPick: (id) => builder.setStudent(id),
    });

    templateCombo = combo({
      input: $('templatePick'),
      list: $('templatePickList'),
      search: (q) => {
        if (q) return searchTemplates(q).map((t) => ({ id: t.id, html: templateOptionHtml(t) }));
        // Nothing typed: favorites, then recently used, then everything by category.
        const out = [];
        const favorites = state.templates.filter((t) => t.favorite);
        const recent = state.templates.filter((t) => t.lastUsed && !t.favorite).sort((a, b) => b.lastUsed - a.lastUsed).slice(0, 4);
        if (favorites.length) out.push({ group: 'Favorites' }, ...favorites.map((t) => ({ id: t.id, html: templateOptionHtml(t) })));
        if (recent.length) out.push({ group: 'Recently used' }, ...recent.map((t) => ({ id: t.id, html: templateOptionHtml(t) })));
        const shown = new Set([...favorites, ...recent]);
        for (const c of allCategories()) {
          const items = state.templates.filter((t) => t.category === c && !shown.has(t));
          if (items.length) out.push({ group: c }, ...items.map((t) => ({ id: t.id, html: templateOptionHtml(t) })));
        }
        return out;
      },
      onPick: (id) => builder.setTemplate(id),
    });

    // Typing in the Details step
    $('placeholderFields').addEventListener('input', (e) => {
      const key = e.target.dataset.key;
      if (!key) return;
      builder.draft.fields[key] = e.target.value;
      if (key === 'startDate') {
        const end = $('ph-endDate');
        if (end) end.min = e.target.value;
      }
      builder.regenerate();
      $('draftSubject').value = builder.draft.subject;
      $('draftBody').value = builder.draft.body;
      builder.updateStatus();
    });

    // Today / Tomorrow / In a week buttons under date fields
    $('placeholderFields').addEventListener('click', (e) => {
      const chip = e.target.closest('[data-date]');
      if (!chip) return;
      e.preventDefault();
      const key = chip.dataset.date;
      const base = key === 'endDate' && builder.draft.fields.startDate ? builder.draft.fields.startDate : isoDate();
      const offset = Number(chip.dataset.offset);
      const input = $('ph-' + key);
      input.value = key === 'endDate' && builder.draft.fields.startDate && offset === 0 ? isoDate() : addDays(base, offset);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Typing in the email itself
    const onEmailInput = (field) => (e) => {
      const d = builder.draft;
      d[field] = e.target.value;
      if (field === 'subject' || field === 'body') d.edited = true;
      if (field === 'to') d.toEdited = true;
      builder.updateStatus();
    };
    $('draftTo').addEventListener('input', onEmailInput('to'));
    $('draftCc').addEventListener('input', onEmailInput('cc'));
    $('draftSubject').addEventListener('input', onEmailInput('subject'));
    $('draftBody').addEventListener('input', onEmailInput('body'));

    $('recipientSeg').addEventListener('click', (e) => {
      const b = e.target.closest('[data-to]');
      if (b && !b.disabled) builder.setRecipient(b.dataset.to);
    });
    $('resetDraft').onclick = () => {
      builder.draft.edited = false;
      builder.regenerate();
      builder.render();
    };
    $('openDraftButton').onclick = builder.openDraft;
    $('copyBodyButton').onclick = builder.copy;
    $('clearDraftButton').onclick = () => builder.reset();
    $('laterButton').onclick = () => {
      if (!builder.draft.body.trim() && !builder.draft.to.trim()) {
        return scheduler.openDialog({ kind: 'reminder' });
      }
      const snap = builder.snapshot();
      scheduler.openDialog({
        kind: 'reminder',
        draft: snap,
        studentId: snap.studentId,
        title: snap.studentName ? `Email ${snap.studentName}${snap.templateTitle ? ': ' + snap.templateTitle : ''}` : snap.subject || 'Finish this email',
      });
    };
  }

  /* =================================================================== 10. Scheduled drafts and reminders */

  /*
   * A scheduled item looks like:
   *   { id, kind: 'reminder' | 'followup' | 'draft', title, studentId, dueAt, status, draft, createdAt }
   * status: 'scheduled' (waiting), 'due' (time's up, shown in the bell), 'saved' (a draft with no time), 'done'.
   * Browsers can't run anything while the page is closed, so reminders fire while ReplyDesk
   * is open, and anything that came due while it was closed shows up the next time it opens.
   */
  const scheduler = {
    tab: 'upcoming',
    dialogOptions: null,
    when: null,

    show(params) {
      if (params?.get('tab')) scheduler.tab = params.get('tab');
      for (const b of $('scheduledTabs').children) b.setAttribute('aria-selected', String(b.dataset.tab === scheduler.tab));
      $('scheduledCallout').hidden = scheduler.tab !== 'upcoming';
      $('scheduledList').innerHTML = scheduler.listHtml(scheduler.tab);
    },

    upcoming() {
      return state.scheduled
        .filter((i) => i.status === 'scheduled' || i.status === 'due')
        .sort((a, b) => (a.status === 'due' ? 0 : 1) - (b.status === 'due' ? 0 : 1) || a.dueAt - b.dueAt);
    },

    due: () => state.scheduled.filter((i) => i.status === 'due'),

    listHtml(tab) {
      if (tab === 'history') return historyLog.listHtml();
      if (tab === 'saved') {
        const saved = state.scheduled.filter((i) => i.status === 'saved').sort((a, b) => b.createdAt - a.createdAt);
        return saved.map(scheduler.rowHtml).join('') || '<div class="list-empty">No saved drafts. In the Draft Builder, click Later, then Save draft.</div>';
      }
      const upcoming = scheduler.upcoming();
      const done = state.scheduled.filter((i) => i.status === 'done' && i.kind !== 'draft').sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0)).slice(0, 8);
      let html = upcoming.map(scheduler.rowHtml).join('') || '<div class="list-empty">Nothing scheduled. Use Later in the Draft Builder, or New reminder above.</div>';
      if (done.length) html += `<div class="option-group" style="padding-top:18px">Done</div>` + done.map(scheduler.rowHtml).join('');
      return html;
    },

    rowHtml(item) {
      const kindName = { reminder: 'Reminder', followup: 'Follow-up', draft: 'Saved draft' }[item.kind];
      const student = studentById(item.studentId)?.name || item.draft?.studentName || '';
      let when = '';
      if (item.status === 'due') when = '<span class="tag orange">Due now</span>';
      else if (item.status === 'scheduled') when = `<span title="${esc(clockTime(item.dueAt))}">${esc(relativeTime(item.dueAt))}</span>`;
      else if (item.status === 'saved') when = `Saved ${esc(relativeTime(item.createdAt))}`;
      else when = `Done ${esc(relativeTime(item.doneAt || item.createdAt))}`;
      const iconName = item.status === 'due' ? 'bell' : item.status === 'done' ? 'check' : item.kind === 'draft' ? 'compose' : 'clock';
      const canOpen = item.draft || item.studentId;
      const sub = [kindName, student, when].filter(Boolean).join(' · ');
      return `
        <div class="row ${item.status === 'due' ? 'is-due' : ''}">
          <span class="row-icon ${item.status === 'due' ? 'due' : item.status === 'done' ? 'done' : ''}">${icon(iconName)}</span>
          <span class="row-main"><span class="row-title">${esc(item.title)}</span><span class="row-sub">${sub}</span></span>
          <span class="row-actions">
            ${canOpen && item.status !== 'done' ? `<button class="button small primary" type="button" data-action="open-item" data-id="${esc(item.id)}">Open</button>` : ''}
            ${item.status === 'due' || item.status === 'scheduled' ? `<button class="mini-button" type="button" data-action="snooze-item" data-id="${esc(item.id)}" title="Snooze 15 minutes">${icon('snooze')}</button>` : ''}
            ${item.status !== 'done' ? `<button class="mini-button" type="button" data-action="done-item" data-id="${esc(item.id)}" title="Mark done">${icon('check')}</button>` : ''}
            <button class="mini-button danger" type="button" data-action="delete-item" data-id="${esc(item.id)}" title="Delete">${icon('trash')}</button>
          </span>
        </div>`;
    },

    /* ---- the schedule dialog */

    whenOptions(kind) {
      const at = (h, m = 0, daysAhead = 1) => {
        const d = new Date();
        d.setDate(d.getDate() + daysAhead);
        d.setHours(h, m, 0, 0);
        return d.getTime();
      };
      if (kind === 'followup') {
        return [
          ['Tomorrow', () => at(8)],
          ['In 3 days', () => at(8, 0, 3)],
          ['Next week', () => at(8, 0, 7)],
          ['Pick a time', null],
        ];
      }
      return [
        ['15 minutes', () => Date.now() + 15 * 60e3],
        ['1 hour', () => Date.now() + 60 * 60e3],
        ['Tomorrow 8 AM', () => at(8)],
        ['Pick a time', null],
      ];
    },

    openDialog({ kind = 'reminder', draft = null, studentId = null, title = '' } = {}) {
      scheduler.dialogOptions = { draft, studentId };
      const form = $('scheduleForm');
      form.title.value = title;
      form.student.value = studentById(studentId)?.name || '';
      $('studentNameList').innerHTML = state.students.map((s) => `<option value="${esc(s.name)}">`).join('');
      $('attachedNote').hidden = !draft;
      if (draft) $('attachedNote').innerHTML = `${icon('mail')} Saving this email with it: <b>${esc(draft.subject || '(no subject)')}</b>${draft.to ? ` to ${esc(draft.to)}` : ''}`;
      $('kindSeg').querySelector('[data-kind="draft"]').hidden = !draft;
      scheduler.setKind(kind);
      $('scheduleDialog').showModal();
      form.title.focus();
    },

    setKind(kind) {
      scheduler.kind = kind;
      for (const b of $('kindSeg').children) b.setAttribute('aria-checked', String(b.dataset.kind === kind));
      $('kindHelp').textContent = {
        reminder: 'ReplyDesk will remind you to come back to this.',
        followup: 'Check back with a student later, like if they said they’d turn something in.',
        draft: 'Keep this email for later without a reminder.',
      }[kind];
      $('whenField').hidden = kind === 'draft';
      $('scheduleStudentField').hidden = kind === 'draft' || !!scheduler.dialogOptions?.draft;
      $('scheduleTitle').textContent = { reminder: 'Remind me later', followup: 'Schedule a follow-up', draft: 'Save draft' }[kind];
      $('scheduleSave').textContent = kind === 'draft' ? 'Save draft' : 'Schedule';
      const options = scheduler.whenOptions(kind);
      $('whenChips').innerHTML = options.map(([label], i) => `<button class="chip" type="button" data-when="${i}">${esc(label)}</button>`).join('');
      scheduler.pickWhen(0);
    },

    pickWhen(index) {
      scheduler.when = index;
      for (const c of $('whenChips').children) c.classList.toggle('on', Number(c.dataset.when) === index);
      const custom = scheduler.whenOptions(scheduler.kind)[index][1] === null;
      $('whenCustom').hidden = !custom;
      if (custom) {
        const soon = new Date(Date.now() + 60 * 60e3);
        soon.setMinutes(0, 0, 0);
        const local = new Date(soon.getTime() - soon.getTimezoneOffset() * 60e3).toISOString().slice(0, 16);
        $('whenCustom').min = new Date(Date.now() - new Date().getTimezoneOffset() * 60e3).toISOString().slice(0, 16);
        if (!$('whenCustom').value) $('whenCustom').value = local;
        $('whenCustom').focus();
      }
    },

    saveDialog() {
      const form = $('scheduleForm');
      const kind = scheduler.kind;
      const { draft } = scheduler.dialogOptions || {};
      let studentId = scheduler.dialogOptions?.studentId || null;
      const typed = form.student.value.trim().toLowerCase();
      if (!draft && typed) studentId = state.students.find((s) => s.name.toLowerCase() === typed)?.id || studentId;
      if (!draft && !typed) studentId = null;

      let dueAt = null;
      if (kind !== 'draft') {
        const getter = scheduler.whenOptions(kind)[scheduler.when][1];
        dueAt = getter ? getter() : new Date($('whenCustom').value).getTime();
        if (!dueAt || Number.isNaN(dueAt)) {
          toast('Pick a date and time.', { kind: 'error' });
          return false;
        }
      }
      const name = studentById(studentId)?.name;
      const item = {
        id: uid(),
        kind,
        title: form.title.value.trim() || (kind === 'followup' && name ? `Follow up with ${name}` : draft?.subject || 'Reminder'),
        studentId,
        dueAt,
        status: kind === 'draft' ? 'saved' : 'scheduled',
        draft: draft || null,
        createdAt: Date.now(),
      };
      state.scheduled.push(item);
      save.scheduled();
      refresh();
      toast(kind === 'draft' ? 'Draft saved' : `Reminder set for ${clockTime(dueAt)}`, {
        iconName: 'check',
        actions: [{ label: 'View', run: () => go('scheduled', { tab: kind === 'draft' ? 'saved' : 'upcoming' }) }],
      });
      return true;
    },

    /* ---- acting on items */

    find: (id) => state.scheduled.find((i) => i.id === id),

    open(id) {
      const item = scheduler.find(id);
      if (!item) return;
      if (item.status === 'due' || item.status === 'scheduled') scheduler.markDone(id, { quiet: true });
      if (item.draft) builder.load(item.draft);
      else if (item.studentId) {
        builder.draft = blankDraft();
        builder.setStudent(item.studentId, { silent: true });
        go('builder');
        builder.render();
        builder.focusNext();
      }
      if (item.kind === 'draft') {
        // A saved draft is used up once it's opened again.
        state.scheduled = state.scheduled.filter((i) => i.id !== id);
        save.scheduled();
        updateBadges();
      }
    },

    snooze(id, minutes = 15) {
      const item = scheduler.find(id);
      if (!item) return;
      Object.assign(item, { status: 'scheduled', dueAt: Date.now() + minutes * 60e3 });
      save.scheduled();
      refresh();
      toast(`Snoozed until ${new Date(item.dueAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`);
    },

    markDone(id, { quiet } = {}) {
      const item = scheduler.find(id);
      if (!item) return;
      Object.assign(item, { status: 'done', doneAt: Date.now() });
      // Only keep the last 50 finished reminders.
      const done = state.scheduled.filter((i) => i.status === 'done').sort((a, b) => b.doneAt - a.doneAt);
      if (done.length > 50) state.scheduled = state.scheduled.filter((i) => !done.slice(50).includes(i));
      save.scheduled();
      refresh();
      if (!quiet) toast('Marked done', { iconName: 'check' });
    },

    remove(id) {
      const item = scheduler.find(id);
      state.scheduled = state.scheduled.filter((i) => i.id !== id);
      save.scheduled();
      refresh();
      toast('Deleted', { actions: [{ label: 'Undo', run: () => { state.scheduled.push(item); save.scheduled(); refresh(); } }] });
    },

    /* ---- the clock: checks for reminders that are due */

    tick(firstRun = false) {
      const now = Date.now();
      const fired = [];
      for (const item of state.scheduled) {
        if (item.status === 'scheduled' && item.dueAt <= now) {
          item.status = 'due';
          item.firedAt = now;
          fired.push(item);
        }
      }
      if (fired.length) {
        save.scheduled();
        if (firstRun && fired.length > 1) {
          toast(`${fired.length} reminders came due while ReplyDesk was closed`, {
            sticky: true,
            iconName: 'bell',
            actions: [{ label: 'View', run: () => go('scheduled') }],
          });
        } else {
          fired.forEach((item) => scheduler.announce(item, now - item.dueAt > 2 * 60e3));
        }
        refresh();
      } else if (state.route === 'scheduled' || state.route === 'dashboard') {
        refresh(); // keeps "in 5 minutes" up to date
      }
    },

    /** Shows a due reminder inside the app, and as a browser notification if that's turned on. */
    announce(item, missed) {
      const student = studentById(item.studentId)?.name || item.draft?.studentName || '';
      const actions = [];
      if (item.draft || item.studentId) actions.push({ label: 'Open', run: () => scheduler.open(item.id) });
      actions.push({ label: 'Snooze', run: () => scheduler.snooze(item.id) }, { label: 'Done', run: () => scheduler.markDone(item.id) });
      toast(item.title, {
        sub: missed ? `Was due ${relativeTime(item.dueAt)}${student ? ' · ' + student : ''}` : student || 'Reminder',
        sticky: true,
        actions,
        kind: 'reminder',
        iconName: 'bell',
      });
      scheduler.notify(item, student);
    },

    async notify(item, student) {
      if (!state.settings.notify || !('Notification' in window) || Notification.permission !== 'granted') return;
      const options = { body: student || 'Reminder from ReplyDesk', tag: item.id, icon: 'icons/icon-192.png' };
      try {
        const reg = navigator.serviceWorker && (await navigator.serviceWorker.getRegistration());
        if (reg) return reg.showNotification(item.title, options);
        const n = new Notification(item.title, options);
        n.onclick = () => {
          window.focus();
          go('scheduled');
          n.close();
        };
      } catch { /* notifications blocked by the browser or school policy: the in-app toast still shows */ }
    },
  };
  views.scheduled = scheduler;

  /** Red badges on the bell and the sidebar, and a (1) in the tab title. */
  function updateBadges() {
    const due = scheduler.due().length;
    for (const id of ['bellBadge', 'navBadge']) {
      $(id).hidden = due === 0;
      $(id).textContent = due;
    }
    const upcoming = scheduler.upcoming();
    $('bellList').innerHTML = upcoming.slice(0, 6).map(scheduler.rowHtml).join('') || '<div class="list-empty">No reminders. You’re all caught up.</div>';
    document.title = titlePrefix() + ($('view-' + state.route)?.dataset.title || 'Dashboard') + ' · ReplyDesk';
  }

  const titlePrefix = () => {
    const due = state.scheduled.filter((i) => i.status === 'due').length;
    return due ? `(${due}) ` : '';
  };

  /* =================================================================== 11. History */

  const historyLog = {
    add(snapshot, how) {
      state.history.unshift({
        id: uid(),
        at: Date.now(),
        how,
        studentId: snapshot.studentId,
        studentName: snapshot.studentName,
        templateId: snapshot.templateId,
        templateTitle: snapshot.templateTitle,
        recipient: snapshot.recipient,
        fields: snapshot.fields,
        to: snapshot.to,
        cc: snapshot.cc,
        subject: snapshot.subject,
        body: snapshot.body,
      });
      state.history.length = Math.min(state.history.length, HISTORY_LIMIT);
      save.history();
    },

    rowHtml(h, compact = false) {
      const who = h.studentName || splitEmails(h.to)[0] || 'No recipient';
      return `
        <div class="row ${compact ? 'clickable' : ''}" ${compact ? `data-action="reopen-history" data-id="${esc(h.id)}"` : ''}>
          <span class="row-icon">${icon('send')}</span>
          <span class="row-main">
            <span class="row-title">${esc(h.subject || '(no subject)')}</span>
            <span class="row-sub">${esc(who)} · ${esc(relativeTime(h.at))}${h.templateTitle ? ' · ' + esc(h.templateTitle) : ''}</span>
          </span>
          ${compact ? '' : `<span class="row-actions">
            <button class="button small" type="button" data-action="reopen-history" data-id="${esc(h.id)}">Open again</button>
            <button class="mini-button" type="button" data-action="copy-history" data-id="${esc(h.id)}" title="Copy text">${icon('copy')}</button>
            <button class="mini-button danger" type="button" data-action="delete-history" data-id="${esc(h.id)}" title="Delete">${icon('trash')}</button>
          </span>`}
        </div>`;
    },

    listHtml() {
      if (!state.history.length) return '<div class="list-empty">Emails you open from ReplyDesk show up here.</div>';
      return (
        `<div class="row"><span class="row-main muted small">Last ${state.history.length} draft${state.history.length === 1 ? '' : 's'}</span>
          <button class="button small ghost" type="button" data-action="clear-history">Clear history</button></div>` +
        state.history.map((h) => historyLog.rowHtml(h)).join('')
      );
    },

    reopen(id) {
      const h = state.history.find((x) => x.id === id);
      if (!h) return;
      builder.load({ ...blankDraft(), ...h, edited: true, toEdited: true });
      toast('Opened a copy of that email', { sub: 'Change anything you need, then open the draft again.' });
    },
  };

  /* =================================================================== 12. Settings and backups */

  const settingsPage = {
    show() {
      const form = $('settingsForm');
      for (const key of ['teacherName', 'defaultCourse', 'greetingStudent', 'greetingParent', 'signoff', 'signature']) {
        if (document.activeElement !== form[key]) form[key].value = state.settings[key];
      }
      form.openWith.value = state.settings.openWith;
      form.nameOnlyTo.value = state.settings.nameOnlyTo;
      applyTheme();
      settingsPage.notifyStatus();
      $('appVersion').textContent = 'v' + APP_VERSION;
    },

    // Every keystroke updates the setting right away; only the saving waits a moment.
    onInput(e) {
      const { name, value } = e.target;
      if (!(name in DEFAULT_SETTINGS) || name === 'openWith' || name === 'nameOnlyTo') return;
      state.settings[name] = value;
      settingsPage.saveSoon();
    },

    saveSoon: debounce(() => save.settings(), 250),

    notifyStatus() {
      const status = $('notifyStatus');
      const button = $('notifyButton');
      if (!('Notification' in window)) {
        button.disabled = true;
        status.textContent = 'This browser doesn’t support notifications. Reminders still show inside ReplyDesk.';
        return;
      }
      const p = Notification.permission;
      button.disabled = p === 'denied';
      button.innerHTML = icon('bell') + (state.settings.notify && p === 'granted' ? 'Turn off notifications' : 'Turn on notifications');
      status.textContent =
        p === 'denied'
          ? ' Notifications are blocked for this page (sometimes by school settings). Reminders still show inside ReplyDesk.'
          : state.settings.notify && p === 'granted'
            ? ' On. You’ll get a pop-up when a reminder is due.'
            : '';
    },

    async toggleNotifications() {
      if (state.settings.notify && Notification.permission === 'granted') {
        state.settings.notify = false;
      } else {
        const result = await Notification.requestPermission();
        state.settings.notify = result === 'granted';
      }
      save.settings();
      settingsPage.notifyStatus();
    },

    exportBackup() {
      const data = {
        app: 'ReplyDesk',
        version: APP_VERSION,
        exportedAt: new Date().toISOString(),
        settings: state.settings,
        students: state.students,
        templates: state.templates,
        categories: state.categories,
        history: state.history,
        scheduled: state.scheduled,
      };
      downloadFile(`replydesk-backup-${isoDate()}.json`, JSON.stringify(data, null, 2), 'application/json');
      toast('Backup downloaded', { sub: 'It has your roster in it, so keep it somewhere private.' });
    },

    async importBackup() {
      const file = await pickFile($('jsonFile'));
      if (!file) return;
      let data;
      try {
        data = JSON.parse(file.text);
      } catch {
        return toast('That file isn’t valid JSON.', { kind: 'error' });
      }
      if (data.app !== 'ReplyDesk' || !Array.isArray(data.templates)) {
        return toast('That doesn’t look like a ReplyDesk backup.', { kind: 'error', sub: 'To add templates, use Import templates.json.' });
      }
      const ok = await confirmBox({
        title: 'Replace everything with this backup?',
        text: `It has ${data.students?.length || 0} students and ${data.templates.length} templates. What's in ReplyDesk now will be replaced.`,
        ok: 'Replace',
        danger: true,
      });
      if (!ok) return;
      state.settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
      state.students = (data.students || []).map(normalizeStudent);
      state.templates = data.templates.map((t) => normalizeTemplate(t));
      state.categories = Array.isArray(data.categories) ? data.categories : [...DEFAULT_DATA.categories];
      state.history = Array.isArray(data.history) ? data.history : [];
      state.scheduled = Array.isArray(data.scheduled) ? data.scheduled : [];
      Object.values(save).forEach((fn) => fn());
      applyTheme();
      refresh();
      toast('Backup restored', { iconName: 'check' });
    },

    /** Adds templates from a templates.json file (same format as the one in the repo). */
    async importTemplates() {
      const file = await pickFile($('jsonFile'));
      if (!file) return;
      let data;
      try {
        data = JSON.parse(file.text);
      } catch {
        return toast('That file isn’t valid JSON.', { kind: 'error' });
      }
      const list = Array.isArray(data) ? data : data.templates;
      if (!Array.isArray(list) || !list.length) return toast('No templates found in that file.', { kind: 'error' });
      let added = 0, updated = 0;
      for (const raw of list) {
        if (!raw || !raw.body) continue;
        const t = normalizeTemplate(raw);
        const existing = templateById(t.id);
        if (existing) {
          Object.assign(existing, { ...t, uses: existing.uses, lastUsed: existing.lastUsed });
          updated++;
        } else {
          state.templates.push(t);
          added++;
        }
      }
      for (const c of data.categories || []) if (!state.categories.includes(c)) state.categories.push(c);
      save.templates();
      refresh();
      toast(`Added ${added} template${added === 1 ? '' : 's'}${updated ? `, updated ${updated}` : ''}`, { iconName: 'check' });
    },

    /** Brings back any default templates that were deleted. Your own templates aren't touched. */
    restoreTemplates() {
      const missing = DEFAULT_DATA.templates.filter((t) => !templateById(t.id));
      for (const c of DEFAULT_DATA.categories) if (!state.categories.includes(c)) state.categories.push(c);
      state.templates.push(...missing.map((t) => normalizeTemplate(t, true)));
      save.templates();
      refresh();
      toast(missing.length ? `Brought back ${missing.length} template${missing.length === 1 ? '' : 's'}` : 'All the default templates are already here');
    },

    async clearAll() {
      const ok = await confirmBox({
        title: 'Clear all ReplyDesk data?',
        text: 'Your roster, templates, drafts, reminders and settings will be deleted from this browser. Export a backup first if you want to keep them.',
        ok: 'Clear everything',
        danger: true,
      });
      if (!ok) return;
      store.clearAll();
      location.hash = '#/dashboard';
      location.reload();
    },
  };
  views.settings = settingsPage;

  /* =================================================================== 13. Quick search (Ctrl K) */

  const palette = {
    results: [],
    active: 0,

    open() {
      $('paletteInput').value = '';
      palette.draw();
      $('palette').showModal();
      $('paletteInput').focus();
    },

    commands() {
      return [
        { title: 'New email', sub: 'Draft Builder', iconName: 'compose', run: () => { builder.reset({ undo: true }); go('builder'); } },
        { title: 'Import roster CSV', sub: 'Students', iconName: 'upload', run: () => { go('students'); roster.importFromPicker(); } },
        { title: 'Add a student', sub: 'Students', iconName: 'plus', run: () => { go('students'); roster.openEditor(); } },
        { title: 'New template', sub: 'Templates', iconName: 'templates', run: () => { go('templates'); templatesPage.openEditor(); } },
        { title: 'New reminder', sub: 'Scheduled Drafts', iconName: 'clock', run: () => scheduler.openDialog() },
        { title: 'Toggle dark mode', sub: 'Appearance', iconName: 'moon', run: toggleTheme },
        ...ROUTES.map((r) => ({ title: $('view-' + r).dataset.title, sub: 'Go to page', iconName: 'chevron', run: () => go(r) })),
      ];
    },

    draw() {
      const q = $('paletteInput').value.trim();
      const terms = words(q);
      const groups = [];
      if (terms.length) {
        const students = searchStudents(q, 6).map((s) => ({
          html: studentOptionHtml(s),
          run: () => {
            builder.setStudent(s.id, { silent: true });
            go('builder');
            builder.render();
            builder.focusNext();
          },
        }));
        const templates = searchTemplates(q).slice(0, 6).map((t) => ({
          html: `<span class="option-icon">${icon('templates')}</span>` + templateOptionHtml(t),
          run: () => {
            builder.setTemplate(t.id, { silent: true });
            go('builder');
            builder.render();
            builder.focusNext();
          },
        }));
        if (students.length) groups.push(['Write to a student', students]);
        if (templates.length) groups.push(['Use a template', templates]);
      }
      const commands = palette
        .commands()
        .filter((c) => matchesAll(`${c.title} ${c.sub}`.toLowerCase(), terms))
        .slice(0, terms.length ? 4 : 12)
        .map((c) => ({
          html: `<span class="option-icon">${icon(c.iconName)}</span><span class="option-main"><span class="option-title">${esc(c.title)}</span><span class="option-sub">${esc(c.sub)}</span></span>`,
          run: c.run,
        }));
      if (commands.length) groups.push([terms.length ? 'Actions' : 'Jump to', commands]);

      palette.results = groups.flatMap(([, items]) => items);
      palette.active = 0;
      let n = -1;
      $('paletteList').innerHTML =
        groups
          .map(([title, items]) =>
            `<li class="option-group" role="presentation">${esc(title)}</li>` +
            items.map((item) => { n++; return `<li class="option" role="option" data-index="${n}" aria-selected="${n === 0}">${item.html}</li>`; }).join('')
          )
          .join('') || `<li class="option-empty">Nothing found for “${esc(q)}”.</li>`;
    },

    move(delta) {
      if (!palette.results.length) return;
      palette.active = (palette.active + delta + palette.results.length) % palette.results.length;
      for (const li of $('paletteList').querySelectorAll('.option')) {
        const on = Number(li.dataset.index) === palette.active;
        li.setAttribute('aria-selected', String(on));
        if (on) li.scrollIntoView({ block: 'nearest' });
      }
    },

    run(index = palette.active) {
      const item = palette.results[index];
      if (!item) return;
      $('palette').close();
      item.run();
    },
  };

  /* =================================================================== 14. Dashboard */

  const dashboard = {
    show() {
      const hour = new Date().getHours();
      const part = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      const name = state.settings.teacherName.trim();
      $('greeting').textContent = name ? `${part}, ${name}` : part;
      $('todayLine').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

      dashboard.setup();
      dashboard.stats();

      const favorites = state.templates.filter((t) => t.favorite).slice(0, 8);
      $('dashFavorites').innerHTML =
        favorites
          .map((t) => `<button class="quick-card" type="button" data-action="use-template" data-id="${esc(t.id)}"><b>${esc(t.title)}</b><span>${esc(t.category)}</span></button>`)
          .join('') || '<div class="list-empty">Star a template to pin it here.</div>';

      const recent = state.templates.filter((t) => t.lastUsed).sort((a, b) => b.lastUsed - a.lastUsed).slice(0, 5);
      $('dashRecentTemplates').innerHTML =
        recent
          .map(
            (t) => `<div class="row clickable" data-action="use-template" data-id="${esc(t.id)}">
              <span class="row-icon">${icon('templates')}</span>
              <span class="row-main"><span class="row-title">${esc(t.title)}</span><span class="row-sub">Used ${esc(relativeTime(t.lastUsed))} · ${t.uses} total</span></span>
              ${icon('chevron')}
            </div>`
          )
          .join('') || '<div class="list-empty">Templates you use show up here.</div>';

      const upcoming = scheduler.upcoming().slice(0, 4);
      $('dashReminders').innerHTML = upcoming.map(scheduler.rowHtml).join('') || '<div class="list-empty">No reminders coming up.</div>';

      $('dashHistory').innerHTML = state.history.slice(0, 5).map((h) => historyLog.rowHtml(h, true)).join('') || '<div class="list-empty">No drafts yet. Your first one takes about ten seconds.</div>';
    },

    stats() {
      const weekAgo = Date.now() - 7 * 24 * 3600e3;
      const thisWeek = state.history.filter((h) => h.at >= weekAgo).length;
      const minutes = state.history.length * MINUTES_SAVED_PER_EMAIL;
      const saved = minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
      const courses = new Set(state.students.map((s) => s.course).filter(Boolean)).size;
      const due = scheduler.due().length;
      const upcoming = scheduler.upcoming().length;
      const stat = (iconName, label, value, note) =>
        `<div class="card stat"><div class="stat-label">${icon(iconName)}${esc(label)}</div><div class="stat-value">${esc(value)}</div><div class="stat-note">${esc(note)}</div></div>`;
      $('stats').innerHTML =
        stat('send', 'Drafts this week', thisWeek, `${state.history.length} all time`) +
        stat('bolt', 'Time saved', saved, `About ${MINUTES_SAVED_PER_EMAIL} min per email (estimate)`) +
        stat('students', 'Students', state.students.length, courses ? `${courses} course${courses === 1 ? '' : 's'}` : 'Import a roster to start') +
        stat('clock', 'Reminders', upcoming, due ? `${due} due now` : 'Nothing due right now');
    },

    /** The little "get set up" checklist for first-time users. */
    setup() {
      const steps = [
        { done: !!state.settings.teacherName.trim(), text: 'Add your name for email signatures', label: 'Settings', href: '#/settings' },
        { done: state.students.length > 0, text: 'Import your student roster (CSV)', label: 'Import', href: '#/students' },
        { done: state.history.length > 0, text: 'Open your first Outlook draft', label: 'Try it', href: '#/builder' },
      ];
      const doneCount = steps.filter((s) => s.done).length;
      const show = !state.settings.setupHidden && doneCount < steps.length;
      $('setupCard').hidden = !show;
      if (!show) return;
      $('setupProgress').innerHTML = `${doneCount} of ${steps.length} done · <button class="link-button" type="button" data-action="hide-setup">Hide</button>`;
      $('setupList').innerHTML = steps
        .map(
          (s) => `<li class="${s.done ? 'done' : ''}">
            <span class="tick">${s.done ? icon('check') : ''}</span><span>${esc(s.text)}</span>
            ${s.done ? '' : `<a class="button small" href="${s.href}">${esc(s.label)}</a>`}
          </li>`
        )
        .join('');
    },
  };
  views.dashboard = dashboard;

  /* =================================================================== Clicks, keys and form wiring */

  /** One click handler for every button with a data-action, wherever it is on the page. */
  const actions = {
    'use-template': (el) => {
      builder.setTemplate(el.dataset.id, { silent: true });
      go('builder');
      builder.render();
      builder.focusNext();
    },
    'pick-template': (el) => builder.setTemplate(el.dataset.id),
    'fav-template': (el) => templatesPage.toggleFavorite(el.dataset.id),
    'edit-template': (el) => templatesPage.openEditor(el.dataset.id),
    'dup-template': (el) => templatesPage.duplicate(el.dataset.id),
    'delete-template': (el) => templatesPage.remove(el.dataset.id),
    'email-student': (el) => {
      builder.setStudent(el.dataset.id, { silent: true });
      go('builder');
      builder.render();
      builder.focusNext();
    },
    'edit-student': (el) => roster.openEditor(el.dataset.id),
    'delete-student': (el) => roster.remove([el.dataset.id]),
    'import-roster': () => roster.importFromPicker(),
    'paste-roster': () => roster.openPaste(),
    'load-sample': () => roster.previewImport('the sample roster', SAMPLE_CSV),
    'clear-student': () => builder.clearStudent(),
    'clear-template': () => builder.clearTemplate(),
    'open-item': (el) => { closeBell(); scheduler.open(el.dataset.id); },
    'snooze-item': (el) => scheduler.snooze(el.dataset.id),
    'done-item': (el) => scheduler.markDone(el.dataset.id),
    'delete-item': (el) => scheduler.remove(el.dataset.id),
    'reopen-history': (el) => historyLog.reopen(el.dataset.id),
    'copy-history': async (el) => {
      const h = state.history.find((x) => x.id === el.dataset.id);
      if (h && (await copyText(h.body))) toast('Copied', { iconName: 'copy' });
    },
    'delete-history': (el) => {
      state.history = state.history.filter((h) => h.id !== el.dataset.id);
      save.history();
      refresh();
    },
    'clear-history': async () => {
      if (!(await confirmBox({ title: 'Clear your draft history?', text: 'Your templates and roster stay. The time-saved count starts over.', ok: 'Clear', danger: true }))) return;
      state.history = [];
      save.history();
      refresh();
    },
    'hide-setup': () => {
      state.settings.setupHidden = true;
      save.settings();
      refresh();
    },
  };

  function closeBell() {
    $('bellPopover').hidden = true;
    $('bellButton').setAttribute('aria-expanded', 'false');
  }

  function wireEvents() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (target && actions[target.dataset.action]) {
        e.preventDefault();
        actions[target.dataset.action](target, e);
      }
      // "New email" buttons start fresh.
      const fresh = e.target.closest('[data-new-email]');
      if (fresh) {
        e.preventDefault();
        builder.reset();
        go('builder');
        builder.focusNext();
      }
      if (!e.target.closest('.bell-wrap')) closeBell();
    });

    window.addEventListener('hashchange', renderRoute);

    // Top bar
    $('themeToggle').onclick = toggleTheme;
    $('searchTrigger').onclick = palette.open;
    $('bellButton').onclick = () => {
      const open = $('bellPopover').hidden;
      $('bellPopover').hidden = !open;
      $('bellButton').setAttribute('aria-expanded', String(open));
    };
    $('bellAll').onclick = closeBell;

    // Students page
    $('studentSearch').addEventListener('input', () => roster.show());
    $('addStudentButton').onclick = () => roster.openEditor();
    $('importRosterButton').onclick = roster.importFromPicker;
    $('pasteRosterButton').onclick = roster.openPaste;
    $('pasteForm').addEventListener('submit', (e) => {
      if (e.submitter?.value === 'next') {
        e.preventDefault();
        roster.submitPaste();
      }
    });
    $('exportRosterButton').onclick = roster.exportCSV;
    $('studentSelectNone').onclick = () => { roster.selected.clear(); roster.show(); };
    $('studentDeleteSelected').onclick = () => roster.remove([...roster.selected]);
    $('studentSelectAll').onchange = (e) => {
      for (const id of roster.visibleIds || []) e.target.checked ? roster.selected.add(id) : roster.selected.delete(id);
      roster.show();
    };
    $('rosterBody').addEventListener('change', (e) => {
      const id = e.target.dataset.select;
      if (!id) return;
      e.target.checked ? roster.selected.add(id) : roster.selected.delete(id);
      roster.show();
    });
    for (const b of document.querySelectorAll('.sort-button')) {
      b.onclick = () => {
        roster.sort = { key: b.dataset.sort, dir: roster.sort.key === b.dataset.sort ? -roster.sort.dir : 1 };
        roster.show();
      };
    }
    $('studentDialog').addEventListener('close', () => {});
    $('studentForm').addEventListener('submit', (e) => {
      if (e.submitter?.value === 'save' && !roster.saveEditor()) e.preventDefault();
    });
    $('importForm').addEventListener('submit', (e) => {
      if (e.submitter?.value === 'import') roster.applyImport($('importForm').mode.value);
    });

    // Drag a CSV anywhere onto the window to import it.
    let dragDepth = 0;
    const hasFiles = (e) => [...(e.dataTransfer?.types || [])].includes('Files');
    window.addEventListener('dragenter', (e) => { if (hasFiles(e)) { dragDepth++; $('dropOverlay').hidden = false; } });
    window.addEventListener('dragleave', (e) => { if (hasFiles(e) && --dragDepth <= 0) { dragDepth = 0; $('dropOverlay').hidden = true; } });
    window.addEventListener('dragover', (e) => { if (hasFiles(e)) e.preventDefault(); });
    window.addEventListener('drop', async (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth = 0;
      $('dropOverlay').hidden = true;
      const file = e.dataTransfer.files[0];
      if (!file) return;
      if (!/\.(csv|txt|tsv)$/i.test(file.name)) return toast('Drop a .csv file to import a roster.', { kind: 'error' });
      go('students');
      roster.previewImport(file.name, await file.text());
    });

    // Templates page
    $('templateSearch').addEventListener('input', () => templatesPage.show());
    $('newTemplateButton').onclick = () => templatesPage.openEditor(null, templatesPage.filter !== 'all' && allCategories().includes(templatesPage.filter) ? { category: templatesPage.filter } : {});
    $('templateFilters').addEventListener('click', (e) => {
      const chip = e.target.closest('[data-filter]');
      if (!chip) return;
      templatesPage.filter = chip.dataset.filter;
      templatesPage.show();
    });
    const tForm = $('templateForm');
    tForm.addEventListener('input', templatesPage.preview);
    tForm.addEventListener('change', (e) => {
      if (e.target.name === 'category') {
        $('newCategoryField').hidden = e.target.value !== '__new';
        if (e.target.value === '__new') tForm.newCategory.focus();
      }
      templatesPage.preview();
    });
    for (const field of [tForm.subject, tForm.body]) field.addEventListener('focus', () => (templatesPage.lastField = field));
    $('placeholderBar').addEventListener('click', (e) => {
      const b = e.target.closest('[data-insert]');
      if (b) templatesPage.insertPlaceholder(b.dataset.insert);
    });
    tForm.addEventListener('submit', (e) => {
      if (e.submitter?.value === 'save' && !templatesPage.saveEditor()) e.preventDefault();
    });

    // Scheduled drafts
    $('scheduledTabs').addEventListener('click', (e) => {
      const b = e.target.closest('[data-tab]');
      if (b) go('scheduled', { tab: b.dataset.tab });
    });
    $('newReminderButton').onclick = () => scheduler.openDialog({ kind: 'reminder' });
    $('kindSeg').addEventListener('click', (e) => {
      const b = e.target.closest('[data-kind]');
      if (b) scheduler.setKind(b.dataset.kind);
    });
    $('whenChips').addEventListener('click', (e) => {
      const b = e.target.closest('[data-when]');
      if (b) scheduler.pickWhen(Number(b.dataset.when));
    });
    $('scheduleForm').addEventListener('submit', (e) => {
      if (e.submitter?.value === 'save' && !scheduler.saveDialog()) e.preventDefault();
    });

    // Settings
    $('settingsForm').addEventListener('input', settingsPage.onInput);
    $('settingsForm').addEventListener('submit', (e) => e.preventDefault());
    $('settingsForm').addEventListener('change', (e) => {
      if (e.target.name === 'openWith' || e.target.name === 'nameOnlyTo') {
        state.settings[e.target.name] = e.target.value;
        save.settings();
        toast('Saved', { iconName: 'check', duration: 1500 });
      }
    });
    $('themeSeg').addEventListener('click', (e) => {
      const b = e.target.closest('[data-theme-choice]');
      if (!b) return;
      state.settings.theme = b.dataset.themeChoice;
      save.settings();
      applyTheme();
    });
    $('notifyButton').onclick = settingsPage.toggleNotifications;
    $('exportBackup').onclick = settingsPage.exportBackup;
    $('importBackup').onclick = settingsPage.importBackup;
    $('importTemplates').onclick = settingsPage.importTemplates;
    $('restoreTemplates').onclick = settingsPage.restoreTemplates;
    $('clearAll').onclick = settingsPage.clearAll;

    // Quick search
    $('paletteInput').addEventListener('input', palette.draw);
    $('paletteInput').addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); palette.move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); palette.move(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); palette.run(); }
    });
    $('paletteList').addEventListener('click', (e) => {
      const li = e.target.closest('.option');
      if (li) palette.run(Number(li.dataset.index));
    });
    $('palette').addEventListener('click', (e) => { if (e.target === $('palette')) $('palette').close(); });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      const mod = e.metaKey || e.ctrlKey;
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if ($('palette').open) $('palette').close();
        else palette.open();
      } else if (e.key === '/' && !typing && !document.querySelector('dialog[open]')) {
        e.preventDefault();
        palette.open();
      } else if (mod && e.key === 'Enter' && state.route === 'builder' && !document.querySelector('dialog[open]')) {
        e.preventDefault();
        builder.openDraft();
      } else if (e.key === 'Escape') {
        closeBell();
      }
    });

    // Reminders: check every 15 seconds, and right away when you come back to the tab.
    setInterval(() => scheduler.tick(), 15e3);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduler.tick(); });

    // Another tab of ReplyDesk changed something: pick it up.
    window.addEventListener('storage', (e) => {
      if (!e.key?.startsWith(PREFIX) || e.key === PREFIX + 'draft') return;
      const key = e.key.slice(PREFIX.length);
      if (key === 'settings') state.settings = { ...DEFAULT_SETTINGS, ...store.get('settings', {}) };
      else if (key === 'students') state.students = store.get('students', []).map(normalizeStudent);
      else if (key === 'templates') state.templates = store.get('templates', []).map((t) => normalizeTemplate(t));
      else if (key === 'categories') state.categories = store.get('categories', []);
      else if (key in state) state[key] = store.get(key, []);
      applyTheme();
      refresh();
    });
  }

  /* =================================================================== 15. Install as an app (PWA) and startup */

  /**
   * On GitHub Pages (or any https site), ReplyDesk can be installed like an app:
   * Chrome/Edge show an install button, and it opens in its own window from the desktop or taskbar.
   * Opened from a folder (file://), browsers don't allow that, so this part just stays quiet.
   */
  function setUpInstall() {
    if (!location.protocol.startsWith('http')) return;
    const manifest = Object.assign(document.createElement('link'), { rel: 'manifest', href: 'manifest.webmanifest' });
    document.head.append(manifest);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => { /* not allowed here: the app still works */ });
    }
    let promptEvent = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      promptEvent = e;
      $('installButton').hidden = false;
    });
    $('installButton').onclick = async () => {
      if (!promptEvent) return;
      promptEvent.prompt();
      await promptEvent.userChoice;
      promptEvent = null;
      $('installButton').hidden = true;
    };
    window.addEventListener('appinstalled', () => {
      $('installButton').hidden = true;
      toast('ReplyDesk is installed. Look for it on your desktop or in your apps.', { iconName: 'check' });
    });
  }

  async function start() {
    await loadTemplates();
    applyTheme();
    $('searchKbd').textContent = isMac ? '⌘ K' : 'Ctrl K';
    $('sendKbd').textContent = isMac ? '⌘' : 'Ctrl';
    // A saved draft might point at a student or template that's gone.
    if (builder.draft.studentId && !builder.student()) builder.draft.studentId = null;
    if (builder.draft.templateId && !builder.template()) builder.draft.templateId = null;
    setUpBuilder();
    wireEvents();
    setUpInstall();
    renderRoute();
    updateBadges();
    scheduler.tick(true);
  }

  start();

  // Handy for poking around in the browser console.
  window.ReplyDesk = { state, version: APP_VERSION, draftLink };
})();
