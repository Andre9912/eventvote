/* EventVote — app.js: UI, router, views, wizard, sheets */
"use strict";

/* ---------- utils ---------- */
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[m],
  );
const fmtD = (d) => {
  if (!d) return "дата уточняется";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
  }).format(new Date(d + "T12:00:00"));
};
const fmtT = (iso) =>
  new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
const initials = (n) =>
  (
    String(n || "?")
      .trim()
      .split(/\s+/)
      .map((x) => x[0])
      .slice(0, 2)
      .join("") || "?"
  ).toUpperCase();
const money = (n) => new Intl.NumberFormat("ru-RU").format(n) + " ₽";

const ICONS = {
  home: "M3 11 12 3l9 8v8a2 2 0 0 1-2 2h-4v-6h-6v6H5a2 2 0 0 1-2-2z",
  events:
    "M7 3v2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2V3h-2v2H9V3Zm12 6v10H5V9Z",
  rooms:
    "M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 10c4 0 8 2 8 5v3H4v-3c0-3 4-5 8-5Z",
  vote: "M12 2 4 6v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V6Zm-1.6 13.4-3-3 1.4-1.4 1.6 1.6 4.2-4.2 1.4 1.4Z",
  user: "M12 3a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 11c4.4 0 8 2.2 8 5v2H4v-2c0-2.8 3.6-5 8-5Z",
  gear: "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm9.9 4-.1 1.6 2 1.5-2 3.4-2.3-1a8 8 0 0 1-1.4.8L17.7 21h-3.8l-.4-2.7a8 8 0 0 1-1.4-.8l-2.3 1-2-3.4 2-1.5L9.7 12l.1-1.6-2-1.5 2-3.4 2.3 1a8 8 0 0 1 1.4-.8L13.9 3h3.8l.4 2.7a8 8 0 0 1 1.4.8l2.3-1 2 3.4-2 1.5Z",
  bell: "M12 3a6 6 0 0 0-6 6v3.3L4 16v1h16v-1l-2-3.7V9a6 6 0 0 0-6-6Zm-2.5 15h5a2.5 2.5 0 0 1-5 0Z",
  search:
    "M10.5 3a7.5 7.5 0 1 0 4.7 13.3l4.7 4.7 1.4-1.4-4.7-4.7A7.5 7.5 0 0 0 10.5 3Zm0 2a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z",
  pin: "M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7Zm0 4.5A2.5 2.5 0 1 0 12 11a2.5 2.5 0 0 0 0-4.5Z",
  link: "M10 6h3v2h-3a4 4 0 0 0 0 8h3v2h-3a6 6 0 0 1 0-12Zm4 0h3a6 6 0 0 1 0 12h-3v-2h3a4 4 0 0 0 0-8h-3ZM8 11h8v2H8Z",
  plus: "M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6Z",
  check: "M9.5 16.2 5.8 12.5l-1.4 1.4 5.1 5.1 10-10-1.4-1.4Z",
  chat: "M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H8l-4 4V5a1 1 0 0 1 0-1Z",
  clock:
    "M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm1 5h-2v6l4.5 2.7 1-1.7-3.5-2Z",
  back: "M14.7 6.3 13.3 4.9 6.4 12l6.9 7.1 1.4-1.4L9.2 12Z",
  share: "M14 5V2l8 7-8 7V12c-5 0-8.5 1.6-11 5 1-5 4-10 11-12Z",
  users:
    "M8 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm8 1a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM8 13c3.3 0 7 1.7 7 4v3H1v-3c0-2.3 3.7-4 7-4Zm8 0c.9 0 1.8.1 2.6.3 1.7.7 2.4 1.7 2.4 3.2V19h-4v-2.2c0-1.5-.6-2.7-2-3.8Z",
  spark:
    "M12 2l1.9 5.7L20 9.6l-5 3.9 1.4 6L12 15.8 7.6 19.5 9 13.5 4 9.6l6.1-1.9Z",
  trash: "M9 3h6l1 2h4v2H4V5h4Zm-3 6h12l-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2Z",
};
const icon = (n, s) =>
  `<svg class="ic" ${s ? `style="width:${s}px;height:${s}px"` : ""} viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[n] || ICONS.spark}"/></svg>`;

function qr(text) {
  try {
    const q = qrcode(0, "M");
    q.addData(text);
    q.make();
    const n = q.getModuleCount();
    let d = "";
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) if (q.isDark(y, x)) d += `M${x} ${y}h1v1h-1z`;
    return `<svg viewBox="-1 -1 ${n + 2} ${n + 2}" style="image-rendering:pixelated"><rect x="-1" y="-1" width="${n + 2}" height="${n + 2}" fill="#fff"/><path d="${d}"/></svg>`;
  } catch (e) {
    return "";
  }
}

/* ---------- router state ---------- */
let route = { page: "landing", id: null, tab: "overview" };
let wiz = null; // wizard draft

function go(page, id, tab) {
  route = { page, id: id || null, tab: tab || "overview" };
  render();
  window.scrollTo({ top: 0 });
}

/* ---------- toasts / sheets ---------- */
function toast(text, ok) {
  const t = document.createElement("div");
  t.className = "toast" + (ok ? " ok" : "");
  t.textContent = text;
  $("#toasts").appendChild(t);
  setTimeout(() => {
    t.style.opacity = "0";
    t.style.transition = "opacity .25s";
    setTimeout(() => t.remove(), 260);
  }, 2400);
}

function sheet(html, opts = {}) {
  const ov = $("#overlay");
  ov.innerHTML = `<div class="scrim" data-close></div><div class="dialog" role="dialog" aria-modal="true">${opts.noX ? "" : '<button class="x" data-close aria-label="Закрыть">✕</button>'}${html}</div>`;
  requestAnimationFrame(() => {
    ov.querySelector(".scrim").classList.add("show");
    ov.querySelector(".dialog").classList.add("show");
  });
  ov.querySelectorAll("[data-close]").forEach(
    (el) => (el.onclick = closeSheet),
  );
}
function closeSheet() {
  const ov = $("#overlay"),
    d = ov.querySelector(".dialog"),
    s = ov.querySelector(".scrim");
  if (!d) return;
  d.classList.remove("show");
  if (s) s.classList.remove("show");
  setTimeout(() => {
    ov.innerHTML = "";
  }, 200);
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeSheet();
});

function confirmSheet(title, text, okLabel, fn) {
  sheet(`<h2>${esc(title)}</h2><p class="sub">${esc(text)}</p>
    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button class="btn btn-ghost" data-close>Отмена</button>
      <button class="btn btn-danger" id="cfOk">${esc(okLabel)}</button></div>`);
  $("#cfOk").onclick = () => {
    closeSheet();
    fn();
  };
}

/* ---------- theme / network ---------- */
function applyTheme() {
  const t =
    DB.state.theme ||
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.dataset.theme = t;
}
addEventListener("online", () => ($("#netbar").hidden = true));
addEventListener("offline", () => ($("#netbar").hidden = false));

/* ---------- shell ---------- */
const NAV = [
  ["home", "Главная", "home"],
  ["events", "Мероприятия", "events"],
  ["rooms", "Комнаты", "rooms"],
  ["questions", "Вопросы", "vote"],
  ["profile", "Профиль", "user"],
  ["settings", "Настройки", "gear"],
];
function shell(inner) {
  const me = DB.myName();
  return `<div class="shell">
    <aside class="sidebar">
      <div class="brand"><img src="assets/logo.png" alt=""><b>event<i>vote</i></b></div>
      <nav class="nav">${NAV.map(([k, l, i]) => `<button class="${route.page === k ? "on" : ""}" data-go="${k}">${icon(i)}${l}</button>`).join("")}</nav>
      <div class="side-foot">
        <button class="account-mini" data-go="profile"><span class="ava a1">${esc(initials(me))}</span><span class="grow"><b>${esc(me)}</b><small>@${esc(DB.state.me?.username || "guest")}</small></span></button>
        <button class="settings-mini" data-go="settings" aria-label="Настройки">${icon("gear", 18)}</button>
      </div>
    </aside>
    <div class="main">
      <div class="topbar">
        <button class="topbar-brand" data-go="home"><img src="assets/logo.png" alt="EventVote"><b>event<i>vote</i></b></button>
        <span style="flex:1"></span>
        <button class="btn btn-outline btn-sm" data-act="join">${icon("link", 15)} По коду</button>
        <button class="btn btn-primary btn-sm" data-act="create">${icon("plus", 15)} Создать</button>
      </div>
      <div class="content">${inner}</div>
    </div>
    <nav class="bottomnav">${[
      ["home", "Главная", "home"],
      ["events", "События", "events"],
      ["create", "", "plus"],
      ["questions", "Вопросы", "vote"],
      ["profile", "Профиль", "user"],
    ]
      .map(([k, l, i]) =>
        k === "create"
          ? `<button data-act="create" aria-label="Создать" style="color:var(--accent)">${icon("plus", 24)}</button>`
          : `<button class="${route.page === k ? "on" : ""}" data-go="${k}">${icon(i)}${l}</button>`,
      )
      .join("")}</nav>
  </div>`;
}

/* ---------- shared bits ---------- */
function evProgress(e) {
  const total = e.questions.length;
  const done = e.questions.filter((q) => q.closed).length;
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
}
function evCard(e, i) {
  const p = evProgress(e);
  const allDone = p.total > 0 && p.done === p.total;
  return `<button class="card ev-card" data-go="event" data-id="${e.id}" style="animation-delay:${i * 0.05}s">
    <div class="ev-top">
      <span class="pill">${icon("events")}${fmtD(e.date)}${e.time ? " · " + esc(e.time) : ""}</span>
      ${allDone ? '<span class="pill pill-green">решение принято</span>' : p.total ? `<span class="pill pill-amber">${p.done}/${p.total} решено</span>` : '<span class="pill">черновик</span>'}
    </div>
    <div class="ev-body">
      <h3>${esc(e.name)}</h3>
      <div class="ev-meta">
        <span>${icon("pin")}${e.placeTbd ? "место решается" : esc(e.place || "место не указано")}</span>
        <span>${icon("users")}${e.members.length}</span>
      </div>
      <div class="ev-foot">
        <div class="progress"><i style="width:${p.pct}%"></i></div>
        <span class="progress-txt">${p.pct}%</span>
        <span class="ava-stack">${e.members
          .slice(0, 4)
          .map(
            (m) =>
              `<span class="ava a${m.color}">${esc(initials(m.name))}</span>`,
          )
          .join(
            "",
          )}${e.members.length > 4 ? `<span class="ava more">+${e.members.length - 4}</span>` : ""}</span>
      </div>
    </div>
  </button>`;
}
function qBars(q) {
  const total = q.options.reduce((s, o) => s + o.votes.length, 0);
  return `<div class="q-bars">${[...q.options]
    .sort((a, b) => b.votes.length - a.votes.length)
    .map((o) => {
      const pct = total ? Math.round((o.votes.length / total) * 100) : 0;
      return `<div class="q-bar"><span>${o.emoji} ${esc(o.text)}</span><span class="pct">${o.votes.length} · ${pct}%</span><div class="progress"><i style="width:${pct}%"></i></div></div>`;
    })
    .join("")}</div>`;
}
function qCard(e, q, i) {
  const total = q.options.reduce((s, o) => s + o.votes.length, 0);
  const mine = DB.myVote(q);
  const multi = q.type === "multi";
  return `<div class="card q-card q-card-live" style="animation-delay:${i * 0.05}s">
    <div class="q-head"><div><h3>${esc(q.text)}</h3><p class="tiny">${esc(e.name)}${q.deadline ? " · до " + fmtD(q.deadline) : ""}</p></div>
      ${q.closed ? '<span class="pill pill-green">завершено</span>' : mine.length ? '<span class="pill pill-accent">голос сохранён</span>' : '<span class="pill pill-amber">нужен голос</span>'}</div>
    ${q.closed ? qBars(q) : `<div class="q-live-options">${q.options.map((o) => `<button class="vote-opt ${mine.includes(o.id) ? "picked" : ""}" data-act="vote" data-id="${e.id}" data-q="${q.id}" data-o="${o.id}"><span class="emoji">${o.emoji}</span><span class="vote-label">${esc(o.text)}</span><span class="cnt">${o.votes.length}</span>${mine.includes(o.id) ? icon("check", 16) : ""}</button>`).join("")}</div>`}
    <div class="q-card-foot"><span>${multi ? "можно выбрать несколько" : "выберите один вариант"} · ${total} ${total === 1 ? "голос" : "голосов"}</span><button class="link" data-go="event" data-id="${e.id}" data-tab="questions">открыть мероприятие →</button></div>
  </div>`;
}

function empty(ic, title, sub, cta) {
  return `<div class="empty">${icon(ic)}<b>${esc(title)}</b><span class="small">${esc(sub)}</span>${cta ? `<div style="margin-top:14px">${cta}</div>` : ""}</div>`;
}

/* ---------- landing ---------- */
function viewLanding() {
  return `<div class="landing-v2">
    <header class="landing-header">
      <div class="brand land-brand"><img src="assets/logo.png" alt=""><b>event<i>vote</i></b></div>
      <button class="btn btn-outline btn-sm" data-act="login">Войти</button>
    </header>
    <main class="landing-main">
      <section class="auth-hero">
        <div class="auth-hero-mark"><img src="assets/logo.png" alt=""></div>
        
        <h1>Решения, которые <br>принимаются <span>вместе.</span></h1>
        <p>Создайте мероприятие, пригласите друзей по коду, предложите варианты — и EventVote зафиксирует общее решение. Без бесконечных чатов.</p>
        
        <button class="btn btn-outline btn-sm" data-act="login">Войти</button>
        
      </section>
      <section class="landing-flow">
        <div><span>01</span><b>профиль</b><small>уникальный никнейм</small></div>
        <div><span>02</span><b>мероприятие</b><small>создайте или войдите по коду</small></div>
        <div><span>03</span><b>решение</b><small>голосуйте и договоритесь</small></div>
      </section>
    </main>
  </div>`;
}

/* ---------- home ---------- */
function viewHome() {
  const up = DB.upcoming();
  const oq = DB.openQuestions().filter((x) => !DB.voted(x.q));
  const feed = DB.events()
    .flatMap((e) => e.activity.map((a) => ({ ...a, ev: e.name })))
    .slice(0, 6);
  const notif = DB.state.notifications.filter((n) => !n.read).length;
  return shell(`
    <div class="greet">
      <h1>Привет, ${esc(DB.myName().split(" ")[0])} ${notif ? `<span class="pill pill-accent">${notif} новых</span>` : ""}</h1>
      <p>Что планируем?</p>
      <div class="greet-actions">
        <button class="btn btn-primary home-create" data-act="create">${icon("plus")} Создать мероприятие</button>
        <button class="btn btn-outline" data-act="join">${icon("link")} Присоединиться по коду</button>
      </div>
    </div>

    <div class="sec" style="margin-top:34px">
      <div class="sec-head"><h2>Ближайшие мероприятия</h2><button class="link" data-go="events">Все →</button></div>
      ${
        up.length
          ? `<div class="grid-cards">${up.slice(0, 3).map(evCard).join("")}</div>`
          : empty(
              "events",
              "Пока ничего не запланировано",
              "Создайте первое мероприятие — это займёт минуту",
              `<button class="btn btn-primary btn-sm empty-create" data-act="create">Создать</button>`,
            )
      }
    </div>

    <div class="sec">
      <div class="sec-head"><h2>Нужно решить</h2>${oq.length ? `<span class="pill pill-amber">${oq.length} ждут голоса</span>` : ""}</div>
      ${
        oq.length
          ? `<div class="grid-cards">${oq
              .slice(0, 4)
              .map((x, i) => qCard(x.e, x.q, i))
              .join("")}</div>`
          : empty(
              "check",
              "Все решения приняты",
              "Когда появятся новые вопросы — они будут здесь",
            )
      }
    </div>

    <div class="sec">
      <div class="sec-head"><h2>Последние события</h2></div>
      <div class="card card-p feed">${
        feed.length
          ? feed
              .map(
                (a) => `
        <div class="feed-item"><span class="dot">${icon(a.icon)}</span><div><p>${esc(a.text)}</p><small>${esc(a.ev)} · ${fmtT(a.time)}</small></div></div>`,
              )
              .join("")
          : '<p class="muted small">Пока тихо — активность появится после первых действий</p>'
      }</div>
    </div>`);
}

/* ---------- events list ---------- */
function viewEvents() {
  const evs = [...DB.events()].sort((a, b) =>
    (a.date || "9999").localeCompare(b.date || "9999"),
  );
  return shell(`
    <div class="greet"><h1>Мои мероприятия</h1><p>${evs.length} ${evs.length === 1 ? "мероприятие" : "мероприятий(я)"}</p></div>
    ${
      evs.length
        ? `<div class="grid-cards">${evs.map(evCard).join("")}</div>`
        : empty(
            "events",
            "Нет мероприятий",
            "Создайте своё первое или присоединитесь по коду",
            `<button class="btn btn-primary" data-act="create">Создать</button>`,
          )
    }`);
}

/* ---------- questions page ---------- */
function viewQuestions() {
  const all = DB.events().flatMap((e) => e.questions.map((q) => ({ e, q })));
  return shell(`
    <div class="greet"><h1>Вопросы</h1><p>${all.filter((x) => !x.q.closed).length} открытых · ${all.filter((x) => x.q.closed).length} решённых</p></div>
    ${
      all.length
        ? `<div class="grid-cards">${all.map((x, i) => qCard(x.e, x.q, i)).join("")}</div>`
        : empty(
            "vote",
            "Пока нет вопросов",
            "Добавьте вопросы при создании мероприятия",
          )
    }`);
}

/* ---------- rooms ---------- */
function viewRooms() {
  return shell(`
    <div class="greet"><h1>Комнаты</h1><p>Постоянные пространства для своей компании</p></div>
    <div class="grid-cards">
      ${DB.state.rooms
        .map(
          (r, i) => `
        <div class="card card-p" style="animation:rise .35s ease ${i * 0.05}s both">
          <div class="q-head"><h3>${esc(r.name)}</h3><span class="pill pill-accent">${esc(r.code)}</span></div>
          <p class="small muted" style="margin:6px 0 14px">${esc(r.desc || "")}</p>
          <div class="ev-meta"><span>${icon("users")}${r.members} участников</span><span>${icon("events")}${r.events} мероприятия</span></div>
          <div style="display:flex;gap:8px;margin-top:14px">
            <button class="btn btn-outline btn-sm" data-act="copy-code" data-code="${esc(r.code)}">${icon("link", 14)} Копировать код</button>
            <button class="btn btn-ghost btn-sm" data-act="room-qr" data-code="${esc(r.code)}" data-name="${esc(r.name)}">QR</button>
          </div>
        </div>`,
        )
        .join("")}
      <button class="card card-p" data-act="new-room" style="border-style:dashed;text-align:center;color:var(--text-2);display:grid;place-items:center;min-height:150px">
        <span>${icon("plus", 26)}<br><b>Новая комната</b></span>
      </button>
    </div>`);
}

/* ---------- event detail ---------- */
function viewEvent() {
  const e = DB.event(route.id);
  if (!e)
    return shell(
      empty(
        "events",
        "Мероприятие не найдено",
        "Возможно, оно было удалено",
        `<button class="btn btn-primary" data-go="events">К списку</button>`,
      ),
    );
  const p = evProgress(e);
  const tabs = [
    ["overview", "Обзор"],
    ["questions", `Вопросы · ${e.questions.length}`],
    ["chat", `Обсуждение · ${e.messages.length}`],
    ["members", `Участники · ${e.members.length}`],
    ["tasks", "Задачи"],
    ["money", "Расходы"],
  ];
  const open = e.questions.filter((q) => !q.closed);
  const decided = e.questions.filter((q) => q.closed);
  const winner = (q) =>
    [...q.options].sort((a, b) => b.votes.length - a.votes.length)[0];
  const lastWin = decided.length ? winner(decided[decided.length - 1]) : null;
  const lastQ = decided[decided.length - 1];

  let body = "";
  if (route.tab === "overview") {
    body = `
      ${
        lastWin
          ? `<div class="decision"><span class="pill pill-green">${icon("check")} решение принято</span>
        <h2>${lastQ ? esc(lastQ.text) + ": " : ""}${esc(lastWin.text)}</h2>
        <p class="muted small" style="margin:8px 0 0">${esc(fmtD(e.date))}${e.time ? " · " + esc(e.time) : ""} · ${e.placeTbd ? "место уточняется" : esc(e.place)}</p></div>`
          : ""
      }
      <div class="card card-p" style="margin-top:16px">
        <div class="q-head"><h3>Прогресс решений</h3><b>${p.done} из ${p.total}</b></div>
        <div class="progress" style="margin:14px 0 6px;height:8px"><i style="width:${p.pct}%"></i></div>
        <p class="tiny">${p.total ? (p.done === p.total ? "Всё решено — осталось собраться 🎉" : "Осталось проголосовать по " + (p.total - p.done) + " вопросам") : "Добавьте первый вопрос, чтобы начать решать"}</p>
      </div>
      <div class="sec" style="margin-top:26px">
        <div class="sec-head"><h2>Активные вопросы</h2><button class="link" data-tab-jump="questions">Все →</button></div>
        ${
          open.length
            ? `<div class="grid-cards">${open.map((q, i) => qCard(e, q, i)).join("")}</div>`
            : empty(
                "check",
                "Нет открытых вопросов",
                "Всё решено или вопросы ещё не добавлены",
              )
        }
      </div>
      <div class="sec"><div class="sec-head"><h2>Участники</h2><button class="link" data-tab-jump="members">Все →</button></div>
        <div class="card card-p" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
          ${e.members.map((m) => `<span class="ava a${m.color}" title="${esc(m.name)}">${esc(initials(m.name))}</span>`).join("")}
          <button class="btn btn-outline btn-sm" data-act="invite" data-id="${e.id}">${icon("plus", 14)} Пригласить</button>
        </div></div>`;
  }
  if (route.tab === "questions") {
    const focusQ = route.q ? e.questions.find((q) => q.id === route.q) : null;
    body = `
      <div class="sec-head"><h2>Вопросы и голосования</h2><button class="btn btn-primary btn-sm" data-act="add-q" data-id="${e.id}">${icon("plus", 14)} Добавить вопрос</button></div>
      ${focusQ ? votePanel(e, focusQ) : ""}
      <div class="grid-cards" style="margin-top:${focusQ ? "20px" : "0"}">
        ${e.questions.map((q, i) => qCard(e, q, i)).join("") || empty("vote", "Вопросов пока нет", "Добавьте первый — что нужно решить?")}
      </div>`;
  }
  if (route.tab === "chat") {
    body = `<div class="card card-p chat" style="height:min(66vh,640px)">
      <div class="chat-log" id="chatLog">
        ${e.messages
          .map((m) =>
            m.sys
              ? `<div class="msg sys"><p>${esc(m.text)}</p></div>`
              : `<div class="msg"><span class="ava a${m.color || 1}">${esc(initials(m.author))}</span>
              <div style="min-width:0"><div class="who"><b>${esc(m.author)}</b><time>${fmtT(m.time)}</time></div><p>${esc(m.text)}</p></div></div>`,
          )
          .join("")}
      </div>
      <div class="typing" id="typing"></div>
      <form class="chat-form" data-form="msg" data-id="${e.id}">
        <input id="msgIn" maxlength="1000" placeholder="Написать сообщение…" autocomplete="off" required>
        <button class="btn btn-primary" type="submit">${icon("chat", 16)}</button>
      </form></div>`;
  }
  if (route.tab === "members") {
    body = `<div class="sec-head"><h2>Участники</h2><button class="btn btn-outline btn-sm" data-act="add-member" data-id="${e.id}">${icon("plus", 14)} Добавить</button></div>
      <div class="card card-p">
        ${e.members
          .map(
            (
              m,
            ) => `<div class="set-row"><div style="display:flex;align-items:center;gap:12px">
          <span class="ava a${m.color}">${esc(initials(m.name))}</span>
          <div><b>${esc(m.name)}</b>${m.name === e.owner ? "<small>организатор</small>" : m.self ? "<small>это вы</small>" : ""}</div></div>
          ${m.name !== e.owner && !m.self ? `<button class="btn btn-ghost btn-sm" data-act="rm-member" data-id="${e.id}" data-name="${esc(m.name)}">Убрать</button>` : ""}
        </div>`,
          )
          .join("")}
      </div>`;
  }
  if (route.tab === "tasks") {
    body = `<div class="sec-head"><h2>Задачи</h2><button class="btn btn-outline btn-sm" data-act="add-task" data-id="${e.id}">${icon("plus", 14)} Добавить</button></div>
      <div class="card card-p">
        ${
          e.tasks
            .map(
              (
                t,
              ) => `<button class="task ${t.done ? "done" : ""}" data-act="task" data-id="${e.id}" data-t="${t.id}" style="width:100%;text-align:left">
          <span class="box">${t.done ? icon("check", 13) : ""}</span><span>${esc(t.text)}</span><small>${esc(t.assignee || "")}</small></button>`,
            )
            .join("") ||
          empty(
            "check",
            "Задач нет",
            "Например: купить билеты, забронировать стол",
          )
        }
      </div>`;
  }
  if (route.tab === "money") {
    const total = e.expenses.reduce((s, x) => s + x.amount, 0);
    body = `<div class="sec-head"><h2>Расходы</h2><button class="btn btn-outline btn-sm" data-act="add-exp" data-id="${e.id}">${icon("plus", 14)} Добавить</button></div>
      <div class="card card-p">
        ${
          e.expenses
            .map(
              (x) =>
                `<div class="exp-row"><span>${esc(x.title)} <small class="tiny">· ${esc(x.payer)}</small></span><b>${money(x.amount)}</b></div>`,
            )
            .join("") ||
          empty(
            "spark",
            "Расходов нет",
            "Записывайте траты, чтобы потом честно разделить",
          )
        }
        ${
          total
            ? `<div class="exp-row" style="border-top:1px solid var(--line);font-weight:750"><span>Итого</span><b>${money(total)}</b></div>
        <div class="exp-row"><span class="muted">На человека (${e.members.length})</span><b>${money(Math.round(total / Math.max(1, e.members.length)))}</b></div>`
            : ""
        }
      </div>`;
  }

  return shell(`
    <div class="ev-hero">
      <button class="crumb" data-go="events">${icon("back", 14)} Мероприятия</button>
      <div class="q-head"><h1>${esc(e.name)}</h1>
        ${p.total && p.done === p.total ? '<span class="pill pill-green">решение принято</span>' : '<span class="pill pill-accent">в работе</span>'}</div>
      ${e.desc ? `<p class="muted" style="margin:6px 0 0">${esc(e.desc)}</p>` : ""}
      <div class="meta">
        <span>${icon("events")}${fmtD(e.date)}${e.time ? " · " + esc(e.time) : ""}</span>
        <span>${icon("pin")}${e.placeTbd ? "место решается голосованием" : esc(e.place || "место не указано")}</span>
        <span>${icon("link")}код <b class="kbd-code" style="padding:3px 8px;font-size:12px">${esc(e.code)}</b></span>
      </div>
      <div class="row2">
        <span class="ava-stack">${e.members
          .slice(0, 6)
          .map(
            (m) =>
              `<span class="ava a${m.color}" title="${esc(m.name)}">${esc(initials(m.name))}</span>`,
          )
          .join(
            "",
          )}${e.members.length > 6 ? `<span class="ava more">+${e.members.length - 6}</span>` : ""}</span>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-outline btn-sm" data-act="invite" data-id="${e.id}">${icon("users", 15)} Пригласить</button>
          <button class="btn btn-outline btn-sm" data-act="share" data-id="${e.id}">${icon("share", 15)} Поделиться</button>
          <button class="btn btn-ghost btn-sm" data-act="ev-settings" data-id="${e.id}">${icon("gear", 15)}</button>
        </div>
      </div>
    </div>
    <div class="tabs">${tabs.map(([k, l]) => `<button class="${route.tab === k ? "on" : ""}" data-tab="${k}">${l}</button>`).join("")}</div>
    ${body}`);
}

function votePanel(e, q) {
  const total = q.options.reduce((s, o) => s + o.votes.length, 0);
  const mine = DB.myVote(q);
  const isMulti = q.type === "multi";
  const me = DB.myName();
  const notVoted = e.members.filter(
    (m) => !q.options.some((o) => o.votes.includes(m.name)),
  );
  if (q.closed) {
    const win = [...q.options].sort(
      (a, b) => b.votes.length - a.votes.length,
    )[0];
    return `<div class="card card-p">
      <div class="q-head"><h3>${esc(q.text)}</h3><span class="pill pill-green">голосование завершено</span></div>
      ${
        win
          ? `<div class="decision" style="margin-top:14px"><span class="pill pill-green">${icon("check")} итог</span><h2>${win.emoji} ${esc(win.text)}</h2>
        <p class="muted small" style="margin:6px 0 0">${win.votes.length} из ${total} голосов</p></div>`
          : ""
      }
      ${qBars(q)}
      ${
        !q.anonymous
          ? `<p class="tiny" style="margin-top:12px">Кто за что: ${q.options
              .map((o) =>
                o.votes.length
                  ? `${esc(o.text)} — ${o.votes.map(esc).join(", ")}`
                  : "",
              )
              .filter(Boolean)
              .join(" · ")}</p>`
          : '<p class="tiny" style="margin-top:12px">анонимное голосование — выборы участников скрыты</p>'
      }
      <div style="margin-top:12px"><button class="btn btn-ghost btn-sm" data-act="reopen" data-id="${e.id}" data-q="${q.id}">Открыть заново</button></div>
    </div>`;
  }
  return `<div class="card card-p" style="border-color:var(--accent-line)">
    <div class="q-head"><h3>${esc(q.text)}</h3>${mine.length ? '<span class="pill pill-accent">твой голос сохранён</span>' : '<span class="pill pill-amber">проголосовать</span>'}</div>
    <p class="tiny" style="margin:4px 0 14px">${isMulti ? "можно выбрать несколько вариантов" : "выбери один вариант"}${q.deadline ? " · до " + fmtD(q.deadline) : ""} · ${total} голосов${q.anonymous ? " · анонимно" : ""}</p>
    ${q.options
      .map(
        (
          o,
        ) => `<button class="vote-opt ${mine.includes(o.id) ? "picked" : ""}" data-act="vote" data-id="${e.id}" data-q="${q.id}" data-o="${o.id}">
      <span class="emoji">${o.emoji}</span>${esc(o.text)}<span class="cnt">${o.votes.length}</span></button>`,
      )
      .join("")}
    ${isMulti ? `<button class="btn btn-primary btn-block" data-act="vote-done" data-id="${e.id}" data-q="${q.id}">${icon("check", 15)} Сохранить голос</button>` : ""}
    ${qBars(q)}
    <p class="tiny" style="margin-top:10px">не проголосовали: ${notVoted.length ? notVoted.map((m) => esc(m.name)).join(", ") : "все проголосовали 🎉"}</p>
    <div style="display:flex;gap:8px;margin-top:14px">
      <button class="btn btn-outline btn-sm" data-act="close-q" data-id="${e.id}" data-q="${q.id}">${icon("check", 14)} Завершить голосование</button>
    </div>
  </div>`;
}

/* ---------- profile / settings ---------- */
function viewProfile() {
  const me = DB.myName();
  const mine = DB.events().filter((e) => e.owner === me);
  return shell(`
    <div class="greet"><h1>Профиль</h1></div>
    <div class="card card-p" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
      <span class="ava a1" style="width:64px;height:64px;font-size:22px;border-radius:18px">${esc(initials(me))}</span>
      <div class="grow" style="flex:1;min-width:180px"><h2>${esc(me)}</h2><p class="muted small" style="margin:2px 0 0">@${esc(DB.state.me?.username || "guest")}</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-outline btn-sm" data-act="edit-profile">Редактировать</button><button class="btn btn-danger btn-sm" data-act="logout">Выйти</button></div>
    </div>
    <div class="stat-grid" style="margin-top:16px">
      <div class="stat"><b>${DB.events().length}</b><small>мероприятий</small></div>
      <div class="stat"><b>${mine.length}</b><small>создано мной</small></div>
      <div class="stat"><b>${
        DB.events()
          .flatMap((e) => e.questions)
          .filter((q) => q.options.some((o) => o.votes.includes(me))).length
      }</b><small>голосов отдано</small></div>
    </div>
    <div class="sec" style="margin-top:26px"><div class="sec-head"><h2>Созданные мной</h2></div>
      ${mine.length ? `<div class="grid-cards">${mine.map(evCard).join("")}</div>` : empty("events", "Пока ничего не создали", "Попробуйте — это быстро")}</div>`);
}

function viewSettings() {
  const s = DB.state;
  const dark = document.documentElement.dataset.theme === "dark";
  return shell(`
    <div class="greet"><h1>Настройки</h1></div>
    <div class="card card-p">
      <div class="set-row"><div><b>Аккаунт</b><small>${s.me ? esc(s.me.name) : "локальный гость — данные только на этом устройстве"}</small></div>
        ${s.me ? `<button class="btn btn-ghost btn-sm" data-act="logout">Выйти</button>` : `<button class="btn btn-primary btn-sm" data-act="login">Войти</button>`}</div>
      <div class="set-row"><div><b>Тёмная тема</b><small>переключается мгновенно и сохраняется</small></div>
        <button class="switch ${dark ? "on" : ""}" data-act="theme" aria-label="Тема"><i></i></button></div>
      <div class="set-row"><div><b>Уведомления</b><small>о голосах и новых участниках</small></div>
        <button class="switch on" data-act="noop" aria-label="Уведомления"><i></i></button></div>
      <div class="set-row"><div><b>Экспорт данных</b><small>скачать всё в JSON</small></div>
        <button class="btn btn-outline btn-sm" data-act="export">Скачать</button></div>
      <div class="set-row"><div><b>Импорт данных</b><small>восстановить из JSON</small></div>
        <button class="btn btn-outline btn-sm" data-act="import">Загрузить</button></div>
      <div class="set-row"><div><b>Сбросить всё</b><small>удалить все данные и начать заново</small></div>
        <button class="btn btn-danger btn-sm" data-act="reset">Сбросить</button></div>
    </div>
    <p class="tiny" style="margin-top:14px">EventVote v1 · данные хранятся локально и синхронизируются между вкладками · серверная версия с аккаунтами — в дорожной карте</p>`);
}

/* ---------- wizard: create event ---------- */
function startWizard() {
  wiz = {
    step: 1,
    name: "",
    desc: "",
    date: "",
    time: "",
    place: "",
    placeTbd: false,
    questions: [],
    visibility: "private",
  };
  go("create");
}
const TPL = [
  ["🗓 Дата", false],
  ["🕐 Время", false],
  ["📍 Место", false],
  ["💰 Бюджет", false],
  ["🎯 Формат", false],
  ["🎒 Что взять", true],
];

function viewCreate() {
  const w = wiz;
  const steps = `<div class="wiz-steps">${[1, 2, 3, 4, 5].map((i) => `<i class="${w.step >= i ? "done" : ""}"></i>`).join("")}</div>`;
  let body = "";
  if (w.step === 1)
    body = `
    <h1>Что планируем?</h1><p class="sub">Название и дата — остальное можно решить голосованием</p>
    <div class="fld">Название<input id="wName" maxlength="60" placeholder="Поездка в Москву" value="${esc(w.name)}" autofocus></div>
    <div class="fld">Описание <span class="tiny">(необязательно)</span><textarea id="wDesc" rows="2" maxlength="300" placeholder="Пара слов о плане">${esc(w.desc)}</textarea></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="fld">Дата<input id="wDate" type="date" value="${esc(w.date)}"></div>
      <div class="fld">Время<input id="wTime" type="time" value="${esc(w.time)}"></div>
    </div>`;
  if (w.step === 2)
    body = `
    <h1>Где?</h1><p class="sub">Место можно указать сейчас или решить вместе с участниками</p>
    <div class="fld">Место<input id="wPlace" maxlength="80" placeholder="Кофейня на Набережной" value="${esc(w.place)}" ${w.placeTbd ? "disabled" : ""}></div>
    <div class="tpl-chips" style="border:0;padding:0"><button class="${w.placeTbd ? "on" : ""}" data-act="w-tbd" type="button">ещё не решили — проголосуем</button></div>`;
  if (w.step === 3)
    body = `
    <h1>Что нужно решить?</h1><p class="sub">Добавьте вопросы — участники проголосуют</p>
    <div class="tpl-chips">${TPL.map(([t, m], i) => `<button type="button" data-act="w-tpl" data-i="${i}">${t}</button>`).join("")}</div>
    ${w.questions
      .map(
        (
          q,
          i,
        ) => `<div class="q-draft"><span><b>${esc(q.text)}</b><br><span class="tiny">${q.options.filter(Boolean).join(" · ") || "варианты не добавлены"}${q.multi ? " · несколько вариантов" : ""}</span></span>
      <button data-act="w-rmq" data-i="${i}" aria-label="Удалить">${icon("trash", 15)}</button></div>`,
      )
      .join("")}
    <div class="fld">Свой вопрос<input id="wQ" maxlength="100" placeholder="Куда пойдём в субботу?"></div>
    <div id="wOpts">
      <div class="opt-row"><input class="wOpt" maxlength="60" placeholder="Вариант 1"></div>
      <div class="opt-row"><input class="wOpt" maxlength="60" placeholder="Вариант 2"></div>
    </div>
    <button class="btn btn-ghost btn-sm" data-act="w-addopt" type="button">${icon("plus", 14)} ещё вариант</button>
    <div style="margin-top:12px"><button class="btn btn-outline btn-block" data-act="w-addq" type="button">${icon("plus", 14)} Добавить вопрос</button></div>`;
  if (w.step === 4) {
    const code = DB.code();
    wiz.pendingCode = code;
    const link =
      location.origin === "null" || location.protocol === "file:"
        ? "eventvote.app/join/" + code
        : location.origin + location.pathname + "#join/" + code;
    wiz.pendingLink = link;
    body = `
    <h1>Кого пригласить?</h1><p class="sub">Передайте друзьям код или покажите QR — они присоединятся сами</p>
    <div class="card card-p" style="text-align:center">
      <p class="tiny">код комнаты</p>
      <p class="kbd-code" style="font-size:24px;display:inline-block;margin:4px 0 10px">${code}</p>
      <div class="qr-wrap">${qr(link)}</div>
      <p class="tiny" style="word-break:break-all">${esc(link)}</p>
      <button class="btn btn-outline btn-sm" data-act="copy" data-copy="${esc(link)}" style="margin-top:8px">${icon("link", 14)} Копировать ссылку</button>
    </div>
    <div class="fld" style="margin-top:16px">Доступность
      <select id="wVis"><option value="private" ${w.visibility === "private" ? "selected" : ""}>Частное — вход по коду/QR</option><option value="public" ${w.visibility === "public" ? "selected" : ""}>Публичное — найдут по поиску</option></select></div>`;
  }
  if (w.step === 5)
    body = `
    <h1>Готово ✨</h1><p class="sub">Проверьте — и запускаем</p>
    <div class="card card-p summary">
      <div class="row"><span class="muted">Название</span><b>${esc(w.name)}</b></div>
      <div class="row"><span class="muted">Когда</span><b>${fmtD(w.date)}${w.time ? " · " + esc(w.time) : ""}</b></div>
      <div class="row"><span class="muted">Где</span><b>${w.placeTbd ? "решим голосованием" : esc(w.place || "—")}</b></div>
      <div class="row"><span class="muted">Вопросы</span><b>${w.questions.length ? w.questions.map((q) => esc(q.text)).join("<br>") : "нет — добавите позже"}</b></div>
      <div class="row"><span class="muted">Код входа</span><b class="kbd-code">${esc(w.pendingCode || "")}</b></div>
      <div class="row"><span class="muted">Доступ</span><b>${w.visibility === "public" ? "публичное" : "частное"}</b></div>
    </div>`;
  return shell(`<div class="wiz" style="padding-top:26px">${steps}${body}
    <div class="wiz-nav">
      ${w.step > 1 ? `<button class="btn btn-ghost" data-act="w-back">${icon("back", 15)} Назад</button>` : `<button class="btn btn-ghost" data-go="home">Отмена</button>`}
      <span style="flex:1"></span>
      ${
        w.step < 5
          ? `<button class="btn btn-primary" data-act="w-next">${w.step === 4 ? "К итогу" : "Дальше"} →</button>`
          : `<button class="btn btn-primary" data-act="w-finish">${icon("check", 15)} Создать мероприятие</button>`
      }
    </div></div>`);
}

/* ---------- render root ---------- */
function render() {
  const pages = {
    landing: viewLanding,
    home: viewHome,
    events: viewEvents,
    rooms: viewRooms,
    questions: viewQuestions,
    profile: viewProfile,
    settings: viewSettings,
    create: viewCreate,
    event: viewEvent,
  };
  const page =
    !DB.state.me && !DB.state.onboarded
      ? "landing"
      : route.page === "landing" && (DB.state.me || DB.state.onboarded)
        ? "home"
        : route.page;
  const fn = pages[page] || viewHome;
  if (route.page !== page) route.page = page;
  $("#root").innerHTML = fn();
  if (page === "event" && route.tab === "chat") {
    const log = $("#chatLog");
    if (log) log.scrollTop = log.scrollHeight;
    Live.typingCb = (n) => {
      const t = $("#typing");
      if (t) t.textContent = n ? n + " печатает…" : "";
    };
    Live.start(route.id);
  } else Live.stop();
  // focus vote question
  if (page === "event" && route.tab === "questions" && route.q) {
    /* panel rendered on top */
  }
}

/* ---------- sheets content ---------- */
function sheetJoin() {
  sheet(`<h2>Присоединиться по коду</h2><p class="sub">Введите 6-значный код из приглашения или отсканируйте QR друга</p>
    <form data-form="join"><div class="fld">Код<input id="joinCode" maxlength="6" placeholder="EVT7KQ" style="text-transform:uppercase;letter-spacing:5px;font-size:20px;text-align:center;font-weight:700" autocomplete="off" required></div>
    <button class="btn btn-primary btn-block">Найти мероприятие</button></form>
    <div id="joinResult"></div>`);
}
function sheetLogin() {
  const me = DB.state.me || {};
  sheet(`<div class="auth-modal">
    <div class="auth-modal-icon">${icon("user", 22)}</div>
    <div class="auth-modal-head"><h2>${me.name ? "Профиль EventVote" : "Создать профиль"}</h2><p class="sub">Никнейм нужен, чтобы участники всегда понимали, кто есть кто. Два одинаковых никнейма невозможны.</p></div>
    <form data-form="login">
      <div class="fld"><span>Как вас называть</span><input id="lName" maxlength="40" placeholder="Андре" value="${esc(me.name || "")}" required autocomplete="name"></div>
      <div class="fld"><span>Уникальный никнейм</span><div class="username-input"><b>@</b><input id="lUser" maxlength="24" placeholder="andre" value="${esc(me.username || "")}" required autocomplete="username" spellcheck="false"></div><small id="usernameHint" class="field-hint">3–24 символа: латиница, цифры, _ или -</small></div>
      <button class="btn btn-primary btn-block" id="loginSubmit">Продолжить в EventVote</button>
    </form>
  </div>`);
  const input = $("#lUser"),
    hint = $("#usernameHint"),
    btn = $("#loginSubmit");
  const check = () => {
    const u = input.value.trim().replace(/^@+/, "").toLowerCase();
    const valid = /^[a-z0-9_-]{3,24}$/.test(u);
    const available = valid && DB.usernameAvailable(u);
    hint.textContent = !valid
      ? "3–24 символа: латиница, цифры, _ или -"
      : available
        ? "никнейм свободен"
        : "этот никнейм уже используется на этом устройстве";
    hint.className = "field-hint " + (available ? "good" : "bad");
    btn.disabled = !available || !$("#lName").value.trim();
  };
  input.addEventListener("input", check);
  $("#lName").addEventListener("input", check);
  check();
}

function sheetInvite(e) {
  const link =
    (location.protocol === "file:"
      ? "eventvote.app"
      : location.origin + location.pathname) +
    "#join/" +
    e.code;
  sheet(`<h2>Пригласить в «${esc(e.name)}»</h2><p class="sub">Код, QR или ссылка — как удобнее</p>
    <div style="text-align:center"><p class="kbd-code" style="font-size:22px;display:inline-block">${esc(e.code)}</p></div>
    <div class="qr-wrap">${qr(link)}</div>
    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
      <button class="btn btn-outline btn-sm" data-act="copy" data-copy="${esc(e.code)}">Копировать код</button>
      <button class="btn btn-primary btn-sm" data-act="copy" data-copy="${esc(link)}">${icon("link", 14)} Копировать ссылку</button>
    </div>`);
}
function sheetAddQ(e) {
  sheet(`<h2>Новый вопрос</h2><p class="sub">Участники увидят его сразу</p>
    <form data-form="addq" data-id="${e.id}">
      <div class="fld">Вопрос<input id="aqText" maxlength="100" placeholder="Куда пойдём?" required></div>
      <div class="fld">Варианты (каждый с новой строки)<textarea id="aqOpts" rows="3" maxlength="400" placeholder="Боулинг&#10;Кино&#10;Ресторан" required></textarea></div>
      <label class="fld" style="display:flex;align-items:center;gap:8px;flex-direction:row"><input id="aqMulti" type="checkbox" style="width:auto"> можно выбрать несколько</label>
      <label class="fld" style="display:flex;align-items:center;gap:8px;flex-direction:row"><input id="aqAnon" type="checkbox" style="width:auto"> анонимно (скрыть, кто как голосовал)</label>
      <button class="btn btn-primary btn-block">Добавить вопрос</button></form>`);
}

/* ---------- actions & forms ---------- */
document.addEventListener("click", (e) => {
  const g = e.target.closest("[data-go]");
  if (g) {
    const tab = g.dataset.tab;
    go(g.dataset.go, g.dataset.id, tab);
    if (g.dataset.q) route.q = g.dataset.q;
    else delete route.q;
    return;
  }
  const tj = e.target.closest("[data-tab-jump]");
  if (tj) {
    route.tab = tj.dataset.tabJump;
    render();
    return;
  }
  const tb = e.target.closest("[data-tab]");
  if (tb && tb.closest(".tabs")) {
    route.tab = tb.dataset.tab;
    render();
    return;
  }
  const a = e.target.closest("[data-act]");
  if (!a) return;
  const act = a.dataset.act,
    id = a.dataset.id;
  const ev = id ? DB.event(id) : null;

  switch (act) {
    case "create":
    case "start":
      if (!DB.state.me) {
        sheetLogin();
        break;
      }
      startWizard();
      break;
    case "join":
      if (!DB.state.me) {
        sheetLogin();
        break;
      }
      sheetJoin();
      break;
    case "login":
      sheetLogin();
      break;
    case "logout":
      confirmSheet(
        "Выйти из аккаунта?",
        "Вы останетесь участником мероприятий, но для новых действий нужно будет войти снова.",
        "Выйти",
        () => {
          DB.setMe(null);
          DB.state.onboarded = false;
          DB.persist();
          toast("Вы вышли");
          go("landing");
        },
      );
      break;
    case "theme": {
      const cur =
        document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      DB.setTheme(cur);
      applyTheme();
      render();
      break;
    }
    case "noop":
      toast("Скоро: серверные уведомления");
      break;
    case "copy":
      navigator.clipboard
        ?.writeText(a.dataset.copy || "")
        .then(() => toast("Скопировано", true))
        .catch(() => toast("Не удалось скопировать"));
      break;
    case "copy-code":
      navigator.clipboard
        ?.writeText(a.dataset.code || "")
        .then(() => toast("Код скопирован", true));
      break;
    case "room-qr":
      sheet(
        `<h2>${esc(a.dataset.name)}</h2><p class="sub">Код комнаты: <b class="kbd-code">${esc(a.dataset.code)}</b></p><div class="qr-wrap">${qr((location.protocol === "file:" ? "eventvote.app" : location.origin + location.pathname) + "#join/" + a.dataset.code)}</div>`,
      );
      break;
    case "new-room": {
      sheet(`<h2>Новая комната</h2><p class="sub">Постоянное место для своей компании</p>
        <form data-form="room"><div class="fld">Название<input id="rName" maxlength="50" placeholder="Наша компания" required></div>
        <button class="btn btn-primary btn-block">Создать</button></form>`);
      break;
    }
    case "invite":
      if (ev) sheetInvite(ev);
      break;
    case "share": {
      const link =
        (location.protocol === "file:"
          ? "eventvote.app"
          : location.origin + location.pathname) +
        "#join/" +
        ev.code;
      if (navigator.share)
        navigator
          .share({
            title: ev.name,
            text:
              "Присоединяйся к «" + ev.name + "» в EventVote — код " + ev.code,
            url: link,
          })
          .catch(() => {});
      else {
        navigator.clipboard?.writeText(link);
        toast("Ссылка скопирована", true);
      }
      break;
    }
    case "ev-settings":
      confirmSheet(
        "Удалить мероприятие?",
        "Вопросы, голоса, чат и расходы будут удалены безвозвратно.",
        "Удалить",
        () => {
          DB.deleteEvent(id);
          toast("Мероприятие удалено");
          go("events");
        },
      );
      break;
    case "add-q":
      if (ev) sheetAddQ(ev);
      break;
    case "vote": {
      const q = ev.questions.find((q) => q.id === a.dataset.q);
      if (q.closed) {
        toast("Голосование завершено");
        break;
      }
      if (q.type === "multi") {
        const current = DB.myVote(q);
        const next = current.includes(a.dataset.o)
          ? current.filter((x) => x !== a.dataset.o)
          : [...current, a.dataset.o];
        if (!next.length) {
          toast("Оставьте хотя бы один вариант");
          break;
        }
        DB.vote(id, q.id, next);
        toast("Голос сохранён", true);
        render();
        break;
      }
      DB.vote(id, q.id, a.dataset.o);
      toast("Твой голос сохранён", true);
      render();
      break;
    }
    case "vote-done": {
      const q = ev.questions.find((q) => q.id === a.dataset.q);
      const picks = $$(".vote-opt.picked").map((b) => b.dataset.o);
      if (!picks.length) {
        toast("Выберите хотя бы один вариант");
        break;
      }
      DB.vote(id, q.id, picks);
      toast("Твой голос сохранён", true);
      render();
      break;
    }
    case "close-q": {
      const win = DB.closeQuestion(id, a.dataset.q);
      toast(win ? "Решение: " + win.text : "Голосование закрыто", true);
      render();
      break;
    }
    case "reopen":
      DB.reopenQuestion(id, a.dataset.q);
      toast("Голосование снова открыто");
      render();
      break;
    case "task":
      DB.toggleTask(id, a.dataset.t);
      render();
      break;
    case "add-task":
      sheet(`<h2>Новая задача</h2><form data-form="task" data-id="${id}">
        <div class="fld">Что сделать<input id="tText" maxlength="120" placeholder="Купить билеты" required></div>
        <div class="fld">Кто <span class="tiny">(необязательно)</span><input id="tWho" maxlength="40" placeholder="Имя"></div>
        <button class="btn btn-primary btn-block">Добавить</button></form>`);
      break;
    case "add-exp":
      sheet(`<h2>Новый расход</h2><form data-form="exp" data-id="${id}">
        <div class="fld">За что<input id="xTitle" maxlength="80" placeholder="Предоплата за стол" required></div>
        <div class="fld">Сумма, ₽<input id="xSum" type="number" min="0" max="10000000" placeholder="1800" required></div>
        <button class="btn btn-primary btn-block">Добавить</button></form>`);
      break;
    case "add-member":
      sheet(`<h2>Добавить участника</h2><p class="sub">Или отправьте код: <b class="kbd-code">${esc(ev.code)}</b></p>
        <form data-form="member" data-id="${id}"><div class="fld">Имя<input id="mName" maxlength="40" placeholder="Имя друга" required></div>
        <button class="btn btn-primary btn-block">Добавить</button></form>`);
      break;
    case "rm-member": {
      ev.members = ev.members.filter((m) => m.name !== a.dataset.name);
      DB.persist();
      toast("Участник убран");
      render();
      break;
    }
    case "edit-profile":
      sheetLogin();
      break;
    case "export": {
      const blob = new Blob([JSON.stringify(DB.state, null, 2)], {
        type: "application/json",
      });
      const u = URL.createObjectURL(blob);
      const l = document.createElement("a");
      l.href = u;
      l.download = "eventvote-backup.json";
      l.click();
      setTimeout(() => URL.revokeObjectURL(u), 5000);
      toast("Данные экспортированы", true);
      break;
    }
    case "import": {
      const inp = document.createElement("input");
      inp.type = "file";
      inp.accept = ".json,application/json";
      inp.onchange = () => {
        const f = inp.files?.[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = () => {
          try {
            const d = JSON.parse(r.result);
            if (d.version !== 1) throw 0;
            DB.state = d;
            DB.persist();
            toast("Данные восстановлены", true);
            render();
          } catch {
            toast("Неверный файл");
          }
        };
        r.readAsText(f);
      };
      inp.click();
      break;
    }
    case "reset":
      confirmSheet(
        "Сбросить всё?",
        "Все мероприятия, голоса и настройки будут удалены.",
        "Сбросить",
        () => {
          DB.resetAll();
          applyTheme();
          toast("Начали с чистого листа");
          go("landing");
        },
      );
      break;

    /* wizard */
    case "w-back":
      wiz.step--;
      render();
      break;
    case "w-tbd":
      wiz.placeTbd = !wiz.placeTbd;
      if (wiz.placeTbd) wiz.place = "";
      render();
      break;
    case "w-addopt":
      $("#wOpts").insertAdjacentHTML(
        "beforeend",
        `<div class="opt-row"><input class="wOpt" maxlength="60" placeholder="Вариант ${$$("#wOpts .wOpt").length + 1}"></div>`,
      );
      break;
    case "w-tpl": {
      const [t, multi] = TPL[+a.dataset.i];
      const text = t.slice(2).trim();
      const presets = {
        Место: ["Вариант 1", "Вариант 2"],
        "Что взять": ["Еда", "Напитки", "Игры"],
      };
      wiz.questions.push({
        text: t,
        multi,
        options: presets[text] || ["", ""],
      });
      render();
      break;
    }
    case "w-rmq":
      wiz.questions.splice(+a.dataset.i, 1);
      render();
      break;
    case "w-addq": {
      const txt = $("#wQ").value.trim();
      const opts = $$("#wOpts .wOpt").map((i) => i.value.trim());
      if (!txt) {
        toast("Напишите вопрос");
        break;
      }
      if (opts.filter(Boolean).length < 2) {
        toast("Нужно минимум 2 варианта");
        break;
      }
      wiz.questions.push({ text: txt, options: opts, multi: false });
      render();
      break;
    }
    case "w-next": {
      if (wiz.step === 1) {
        wiz.name = $("#wName").value.trim();
        wiz.desc = $("#wDesc").value.trim();
        wiz.date = $("#wDate").value;
        wiz.time = $("#wTime").value;
        if (!wiz.name) {
          toast("Придумайте название");
          break;
        }
        if (!wiz.date) {
          toast("Выберите дату");
          break;
        }
      }
      if (wiz.step === 2) {
        wiz.place = $("#wPlace")?.value.trim() || wiz.place;
      }
      if (wiz.step === 4) {
        wiz.visibility = $("#wVis").value;
      }
      wiz.step++;
      render();
      break;
    }
    case "w-finish": {
      const e = DB.createEvent({ ...wiz, code: undefined });
      e.code = wiz.pendingCode || e.code;
      e.visibility = wiz.visibility;
      DB.persist();
      wiz = null;
      toast("Мероприятие создано 🎉", true);
      go("event", e.id);
      break;
    }
  }
});

/* forms */
document.addEventListener("submit", (e) => {
  const f = e.target;
  if (!f.dataset.form) return;
  e.preventDefault();
  switch (f.dataset.form) {
    case "join": {
      const code = $("#joinCode").value.trim().toUpperCase();
      const ev = DB.eventByCode(code);
      const room = DB.roomByCode(code);
      const box = $("#joinResult");
      if (!ev && !room) {
        box.innerHTML = `<div class="empty" style="margin-top:14px"><b>Код не найден</b><span class="small">Проверьте код из приглашения</span></div>`;
        break;
      }
      if (ev) {
        box.innerHTML = `<div class="card card-p" style="margin-top:16px;text-align:left">
          <h3>${esc(ev.name)}</h3>
          <p class="small muted" style="margin:4px 0 12px">${esc(ev.owner)} · ${ev.members.length} участников · ${fmtD(ev.date)}</p>
          <button class="btn btn-primary btn-block" id="joinGo">Присоединиться</button></div>`;
        $("#joinGo").onclick = () => {
          DB.joinByCode(ev.code);
          closeSheet();
          toast("Добро пожаловать в «" + ev.name + "»", true);
          go("event", ev.id);
        };
      } else {
        box.innerHTML = `<div class="card card-p" style="margin-top:16px;text-align:left">
          <h3>${esc(room.name)}</h3><p class="small muted" style="margin:4px 0 12px">комната · ${room.members} участников</p>
          <button class="btn btn-primary btn-block" id="joinRoomGo">Войти в комнату</button></div>`;
        $("#joinRoomGo").onclick = () => {
          DB.joinRoomByCode(room.code);
          closeSheet();
          toast("Вы вошли в «" + room.name + "»", true);
          go("rooms");
        };
      }
      break;
    }
    case "login": {
      const name = $("#lName").value.trim(),
        username = $("#lUser").value.trim().replace(/^@+/, "").toLowerCase();
      if (!name || !/^[a-z0-9_-]{3,24}$/.test(username)) {
        toast("Проверьте имя и никнейм");
        break;
      }
      if (!DB.usernameAvailable(username)) {
        toast("Этот никнейм уже используется на этом устройстве");
        break;
      }
      DB.createProfile(name, username);
      closeSheet();
      toast("Профиль готов, " + name + "!", true);
      go("home");
      break;
    }
    case "room": {
      DB.createRoom($("#rName").value.trim());
      closeSheet();
      toast("Комната создана", true);
      render();
      break;
    }
    case "msg": {
      const inp = $("#msgIn");
      const txt = inp.value.trim();
      if (!txt) break;
      DB.addMessage(f.dataset.id, txt);
      inp.value = "";
      render();
      break;
    }
    case "addq": {
      DB.addQuestion(f.dataset.id, {
        text: $("#aqText").value.trim(),
        options: $("#aqOpts")
          .value.split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        multi: $("#aqMulti").checked,
        anonymous: $("#aqAnon").checked,
      });
      closeSheet();
      toast("Вопрос добавлен", true);
      render();
      break;
    }
    case "task":
      DB.addTask(
        f.dataset.id,
        $("#tText").value.trim(),
        $("#tWho").value.trim(),
      );
      closeSheet();
      toast("Задача добавлена", true);
      render();
      break;
    case "exp":
      DB.addExpense(
        f.dataset.id,
        $("#xTitle").value.trim(),
        $("#xSum").value,
        "",
      );
      closeSheet();
      toast("Расход записан", true);
      render();
      break;
    case "member":
      DB.addMember(f.dataset.id, $("#mName").value.trim());
      closeSheet();
      toast("Участник добавлен", true);
      render();
      break;
  }
});

/* ---------- boot ---------- */
(function boot() {
  applyTheme();
  // deep link: #join/CODE
  const m = location.hash.match(/#join\/([A-Z0-9]{6})/i);
  if (m) {
    DB.markOnboarded();
    const ev = DB.eventByCode(m[1]);
    const room = DB.roomByCode(m[1]);
    if (ev) {
      DB.joinByCode(ev.code);
      route = { page: "event", id: ev.id, tab: "overview" };
    } else if (room) {
      DB.joinRoomByCode(room.code);
      route = { page: "rooms", id: null, tab: "overview" };
    }
    history.replaceState(null, "", location.pathname);
  }
  render();
  if ("serviceWorker" in navigator && location.protocol.startsWith("http"))
    navigator.serviceWorker.register("sw.js").catch(() => {});
})();
