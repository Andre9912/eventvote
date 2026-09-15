/* EventVote — data layer (store.js)
   localStorage persistence + BroadcastChannel realtime between tabs/devices.
   Когда появится backend — заменяется только этот слой. */
'use strict';

const EV_KEY = 'eventvote_db_v2';
const bus = ('BroadcastChannel' in window) ? new BroadcastChannel('eventvote') : null;

const DB = {
  state: null,
  listeners: [],

  uid() {
    return (crypto.randomUUID ? crypto.randomUUID() : 'id' + Math.random().toString(36).slice(2) + Date.now());
  },

  code() {
    const a = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let c = '';
    for (let i = 0; i < 6; i++) c += a[Math.floor(Math.random() * a.length)];
    return c;
  },

  iso(d) { return d ? new Date(d + 'T12:00:00').toISOString() : null; },
  todayISO() { return new Date().toISOString(); },

  seed() {
    return {
      version: 1,
      me: null,
      profiles: [],
      theme: null,
      onboarded: false,
      events: [],
      rooms: [],
      notifications: []
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(EV_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && s.version === 1) { s.profiles = Array.isArray(s.profiles) ? s.profiles : []; this.state = s; return; }
      }
    } catch (e) { /* corrupted -> reseed */ }
    this.state = this.seed();
    this.persist();
  },

  persist() {
    try { localStorage.setItem(EV_KEY, JSON.stringify(this.state)); } catch (e) {}
    if (bus) bus.postMessage({ type: 'sync' });
    this.emit();
  },

  onChange(fn) { this.listeners.push(fn); },
  emit() { this.listeners.forEach(fn => fn(this.state)); },

  // ---------- queries ----------
  events() { return this.state.events; },
  event(id) { return this.state.events.find(e => e.id === id); },
  eventByCode(code) {
    const c = String(code || '').trim().toUpperCase();
    return this.state.events.find(e => e.code === c && e.visibility !== 'public');
  },
  roomByCode(code) {
    const c = String(code || '').trim().toUpperCase();
    return this.state.rooms.find(r => r.code === c);
  },
  myName() { return (this.state.me && this.state.me.name) || 'Гость'; },
  normalizeUsername(v) { return String(v || '').trim().toLowerCase().replace(/^@+/, ''); },
  usernameAvailable(username) {
    const u = this.normalizeUsername(username);
    if (u.length < 3) return false;
    const me = this.state.me?.id;
    return !this.state.profiles.some(p => p.username === u && p.id !== me);
  },
  createProfile(name, username) {
    const u = this.normalizeUsername(username);
    const existing = this.state.profiles.find(p => p.username === u);
    if (existing) { this.state.me = existing; this.markOnboarded(); return existing; }
    const profile = { id: this.uid(), name: String(name).trim(), username: u };
    this.state.profiles.push(profile); this.state.me = profile; this.markOnboarded(); this.persist(); return profile;
  },

  upcoming() {
    const today = new Date().toISOString().slice(0, 10);
    return [...this.state.events].filter(e => e.date && e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  },

  openQuestions() {
    const out = [];
    for (const e of this.state.events) for (const q of e.questions) if (!q.closed) out.push({ e, q });
    return out;
  },

  // ---------- mutations ----------
  createEvent(data) {
    const e = {
      id: this.uid(), name: data.name, desc: data.desc || '', date: data.date || '', time: data.time || '',
      place: data.place || '', placeTbd: !!data.placeTbd, code: data.visibility === 'public' ? '' : (data.code || this.code()), owner: this.myName(),
      visibility: data.visibility || 'private',
      members: [{ id: this.uid(), name: this.myName(), color: 1, self: true }],
      questions: (data.questions || []).map(q => ({
        id: this.uid(), text: q.text, type: q.multi ? 'multi' : 'single', closed: false, anonymous: false,
        deadline: q.deadline || '', options: (q.options || []).filter(Boolean).map(t => ({ id: this.uid(), text: t, emoji: q.emoji || '▫️', votes: [] }))
      })),
      messages: [{ id: this.uid(), sys: true, text: 'Мероприятие создано', time: this.todayISO() }],
      tasks: [], expenses: [],
      activity: [{ id: this.uid(), icon: 'check', text: this.myName() + ' создал(а) мероприятие', time: this.todayISO() }],
      createdAt: this.todayISO(), status: 'open'
    };
    this.state.events.unshift(e);
    this.persist();
    return e;
  },

  joinByCode(code) {
    const e = this.eventByCode(code);
    if (!e) return null;
    if (!e.members.some(m => m.name === this.myName())) {
      e.members.push({ id: this.uid(), name: this.myName(), color: (e.members.length % 6) + 1, self: true });
      e.activity.unshift({ id: this.uid(), icon: 'users', text: this.myName() + ' присоединился(ась) к мероприятию', time: this.todayISO() });
      e.messages.push({ id: this.uid(), sys: true, text: this.myName() + ' присоединился(ась)', time: this.todayISO() });
      this.persist();
    }
    return e;
  },

  joinRoomByCode(code) {
    const r = this.roomByCode(code);
    if (!r) return null;
    r.members = Math.max(1, Number(r.members || 0));
    if (!r._members) r._members = [];
    const me = this.myName();
    if (!r._members.includes(me)) { r._members.push(me); r.members = r._members.length; this.persist(); }
    return r;
  },

  vote(eventId, questionId, optionIds) {
    const e = this.event(eventId); if (!e) return;
    const q = e.questions.find(q => q.id === questionId); if (!q || q.closed) return;
    const me = this.myName();
    // server-authoritative principle: сначала снимаем все мои голоса в этом вопросе
    for (const o of q.options) o.votes = o.votes.filter(v => v !== me);
    const picks = Array.isArray(optionIds) ? optionIds : [optionIds];
    for (const pid of picks) {
      const o = q.options.find(o => o.id === pid);
      if (o) o.votes.push(me);
    }
    e.activity.unshift({ id: this.uid(), icon: 'vote', text: me + ' проголосовал(а) в «' + q.text + '»', time: this.todayISO() });
    this.state.notifications.unshift({ id: this.uid(), icon: 'vote', text: 'Ваш голос сохранён: «' + q.text + '»', time: this.todayISO(), read: false });
    this.persist();
  },

  myVote(q) {
    const me = this.myName();
    return q.options.filter(o => o.votes.includes(me)).map(o => o.id);
  },

  voted(q) { return this.myVote(q).length > 0; },

  closeQuestion(eventId, questionId) {
    const e = this.event(eventId); if (!e) return;
    const q = e.questions.find(q => q.id === questionId); if (!q) return;
    q.closed = true;
    const win = [...q.options].sort((a, b) => b.votes.length - a.votes.length)[0];
    if (win) e.activity.unshift({ id: this.uid(), icon: 'check', text: 'решение «' + q.text + '» принято: ' + win.text.toLowerCase(), time: this.todayISO() });
    e.messages.push({ id: this.uid(), sys: true, text: 'Голосование «' + q.text + '» завершено' + (win ? ' — выбрано: ' + win.text : ''), time: this.todayISO() });
    this.persist();
    return win;
  },

  reopenQuestion(eventId, questionId) {
    const e = this.event(eventId); if (!e) return;
    const q = e.questions.find(q => q.id === questionId); if (!q) return;
    q.closed = false;
    this.persist();
  },

  addQuestion(eventId, q) {
    const e = this.event(eventId); if (!e) return;
    e.questions.push({
      id: this.uid(), text: q.text, type: q.multi ? 'multi' : 'single', closed: false, anonymous: !!q.anonymous,
      deadline: q.deadline || '', options: q.options.filter(Boolean).map(t => ({ id: this.uid(), text: t, emoji: q.emoji || '▫️', votes: [] }))
    });
    e.activity.unshift({ id: this.uid(), icon: 'vote', text: 'создан вопрос «' + q.text + '»', time: this.todayISO() });
    this.persist();
  },

  addMessage(eventId, text) {
    const e = this.event(eventId); if (!e) return;
    const msg = { id: this.uid(), author: this.myName(), color: 1, text: String(text).slice(0, 1000), time: this.todayISO() };
    e.messages.push(msg);
    this.persist();
    return msg;
  },

  addTask(eventId, text, assignee) {
    const e = this.event(eventId); if (!e) return;
    e.tasks.push({ id: this.uid(), text: String(text).slice(0, 200), done: false, assignee: assignee || '' });
    this.persist();
  },

  toggleTask(eventId, taskId) {
    const e = this.event(eventId); if (!e) return;
    const t = e.tasks.find(t => t.id === taskId); if (t) { t.done = !t.done; this.persist(); }
  },

  addExpense(eventId, title, amount, payer) {
    const e = this.event(eventId); if (!e) return;
    e.expenses.push({ id: this.uid(), title: String(title).slice(0, 120), amount: Math.max(0, Number(amount) || 0), payer: payer || this.myName() });
    this.persist();
  },

  addMember(eventId, name) {
    const e = this.event(eventId); if (!e || !name) return;
    if (e.members.some(m => m.name === name)) return;
    e.members.push({ id: this.uid(), name, color: (e.members.length % 6) + 1 });
    e.activity.unshift({ id: this.uid(), icon: 'users', text: name + ' присоединился(ась)', time: this.todayISO() });
    this.persist();
  },

  deleteEvent(id) {
    this.state.events = this.state.events.filter(e => e.id !== id);
    this.persist();
  },

  createRoom(name, desc) {
    const r = { id: this.uid(), name, desc: desc || '', code: this.code(), members: 1, events: 0, createdAt: this.todayISO() };
    this.state.rooms.push(r);
    this.persist();
    return r;
  },

  setMe(me) { this.state.me = me; this.persist(); },
  setTheme(t) { this.state.theme = t; this.persist(); },
  markOnboarded() { this.state.onboarded = true; this.persist(); },
  markAllRead() { this.state.notifications.forEach(n => n.read = true); this.persist(); },
  resetAll() { localStorage.removeItem(EV_KEY); this.load(); }
};

DB.load();
if (bus) bus.onmessage = () => DB.emit();

/* realtime-симуляция живой комнаты: лёгкий «печатает…» из демо-имён */
const Live = {
  typingCb: null,
  timer: null,
  start(eventId) {
    this.stop();
    const names = ['Назар', 'Максим', 'Ира', 'Артём'];
    this.timer = setInterval(() => {
      if (Math.random() < 0.16 && this.typingCb) {
        const n = names[Math.floor(Math.random() * names.length)];
        this.typingCb(n);
        setTimeout(() => this.typingCb && this.typingCb(null), 2600);
      }
    }, 5000);
  },
  stop() { if (this.timer) clearInterval(this.timer); this.timer = null; }
};
