const SAVE_KEY = 'studio-story-save-v1';
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const uid = () => Math.random().toString(36).slice(2, 9);

export class EventManager {
  constructor() { this.listeners = {}; }
  on(name, fn) { (this.listeners[name] ||= []).push(fn); return () => this.listeners[name] = this.listeners[name].filter(x => x !== fn); }
  emit(name, payload) { (this.listeners[name] || []).forEach(fn => fn(payload)); }
}

const initialState = (company = 'Pixel Pioneers') => ({
  version: 1, company, day: 1, cash: 18000, reputation: 12, fans: 94, rank: 'Bedroom Developer',
  office: { level: 0, desks: 1, capacity: 1, decor: 0 }, employees: [], games: [], project: null,
  research: [], marketing: null, market: { trend: 'Cozy adventures', genre: 'Adventure', heat: 62, share: 1.8 },
  expenses: 0, income: 0, history: [], awards: 0, event: null, bankruptDays: 0, settings: { sound: true }
});

export class SaveManager {
  save(state) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); return true; } catch { return false; } }
  load() { try { const data = JSON.parse(localStorage.getItem(SAVE_KEY)); return data?.version === 1 ? data : null; } catch { return null; } }
  clear() { localStorage.removeItem(SAVE_KEY); }
}

export class CompanyManager {
  constructor(game) { this.game = game; }
  setName(name) { this.game.state.company = name.trim().slice(0, 24) || 'Pixel Pioneers'; this.game.changed(); }
  getLevel() {
    const { cash, reputation, games } = this.game.state;
    if (reputation >= 85 && games.length >= 5) return 'Global Gaming Corporation';
    if (reputation >= 65 && games.length >= 3) return 'AAA Developer';
    if (reputation >= 38 && games.length >= 2) return 'Professional Studio';
    if (reputation >= 20 || games.length >= 1) return 'Indie Studio';
    return 'Bedroom Developer';
  }
  refreshRank() { this.game.state.rank = this.getLevel(); }
}

export class EconomyManager {
  constructor(game) { this.game = game; }
  charge(amount, label = 'Expense') {
    const s = this.game.state; amount = Math.ceil(amount);
    if (s.cash < amount) return false;
    s.cash -= amount; s.expenses += amount; s.history.unshift({ day: s.day, label, amount: -amount }); return true;
  }
  earn(amount, label = 'Revenue') {
    const s = this.game.state; amount = Math.floor(amount); if (amount <= 0) return;
    s.cash += amount; s.income += amount; s.history.unshift({ day: s.day, label, amount }); s.history = s.history.slice(0, 30);
  }
  getDailyPayroll() { return this.game.state.employees.reduce((sum, e) => sum + e.salary, 0); }
}

export class EmployeeManager {
  constructor(game) { this.game = game; }
  hire(role) {
    const s = this.game.state; const cost = role === 'Lead Designer' ? 3500 : role === 'Developer' ? 2600 : 2200;
    if (s.employees.length >= s.office.capacity) return this.game.notify('No desk available. Expand your office first.');
    if (!this.game.economy.charge(cost, 'Recruitment')) return this.game.notify('Not enough cash to hire.');
    const pool = { 'Lead Designer': ['Maya Chen', 'Leo Park', 'Ari Flores'], Developer: ['Noah Reed', 'Sam Okafor', 'Jules Kim'], Artist: ['Ivy Brooks', 'Rin Sato', 'Alex Morgan'] };
    const name = pool[role][Math.floor(Math.random() * pool[role].length)];
    s.employees.push({ id: uid(), name, role, skill: 42 + Math.floor(Math.random() * 35), salary: role === 'Lead Designer' ? 310 : role === 'Developer' ? 240 : 210, happiness: 82, level: 1 });
    this.game.notify(`${name} joined the team!`); this.game.changed();
  }
  train(id) {
    const e = this.game.state.employees.find(x => x.id === id); if (!e) return;
    if (!this.game.economy.charge(850, 'Training')) return this.game.notify('Not enough cash for training.');
    e.skill = clamp(e.skill + 8, 0, 100); e.happiness = clamp(e.happiness + 3, 0, 100); this.game.notify(`${e.name} completed a skills course.`); this.game.changed();
  }
  fire(id) { const i = this.game.state.employees.findIndex(x => x.id === id); if (i < 0) return; const e = this.game.state.employees.splice(i, 1)[0]; this.game.notify(`${e.name} has left the studio.`); this.game.changed(); }
}

export class OfficeManager {
  constructor(game) { this.game = game; }
  expand() {
    const s = this.game.state, price = [12000, 38000, 95000][s.office.level] || 250000;
    if (!this.game.economy.charge(price, 'Office expansion')) return this.game.notify('Not enough cash for an expansion.');
    s.office.level++; s.office.capacity += 3; s.office.desks += 3;
    this.game.notify(`Office expanded! ${s.office.capacity} desks are ready.`); this.game.changed();
  }
  decorate() { const price = 2400 + this.game.state.office.decor * 1600; if (!this.game.economy.charge(price, 'Studio upgrade')) return this.game.notify('Not enough cash.'); this.game.state.office.decor++; this.game.state.reputation = clamp(this.game.state.reputation + 2, 0, 100); this.game.notify('A little more studio magic. Reputation +2.'); this.game.changed(); }
}

export class GameDevelopmentManager {
  constructor(game) { this.game = game; }
  start({ title, genre, platform, size, graphics, features }) {
    const s = this.game.state; if (s.project) return this.game.notify('Finish your current project first.');
    const sizes = { Small: { cost: 2200, days: 7, points: 90 }, Medium: { cost: 6200, days: 16, points: 190 }, Large: { cost: 15000, days: 31, points: 340 } };
    const g = sizes[size]; const cost = g.cost + graphics * 900 + features.length * 700;
    if (!this.game.economy.charge(cost, 'Project kickoff')) return this.game.notify('Not enough cash for this project. Try a smaller game.');
    s.project = { id: uid(), title: title.trim().slice(0, 28) || 'Untitled Project', genre, platform, size, graphics, features, total: g.days, remaining: g.days, points: g.points, spent: cost, progress: 0 };
    this.game.notify(`${s.project.title} entered production.`); this.game.changed();
  }
  workDay() {
    const p = this.game.state.project; if (!p) return;
    const team = this.game.state.employees.reduce((n, e) => n + e.skill * (e.happiness / 100), 0);
    const speed = 1 + team / 180 + p.graphics * .08;
    p.remaining -= speed; p.progress = clamp(100 * (1 - p.remaining / p.total), 0, 100);
    if (p.remaining <= 0) this.complete();
  }
  complete() {
    const s = this.game.state, p = s.project;
    const skill = s.employees.reduce((n, e) => n + e.skill, 0);
    const quality = clamp(Math.round(42 + p.points / 11 + p.graphics * 3 + skill / 12 + p.features.length * 2 + Math.random() * 12), 28, 99);
    const review = clamp(Math.round(quality / 10 + (Math.random() * 1.2 - .6)), 1, 10);
    const game = { id: p.id, title: p.title, genre: p.genre, platform: p.platform, quality, review, sales: 0, dailySales: Math.round(100 + quality * 6), age: 0, size: p.size };
    s.games.unshift(game); s.project = null; s.reputation = clamp(s.reputation + Math.max(2, Math.floor((review - 5) * 2)), 0, 100);
    s.fans += Math.round(quality * 3); this.game.company.refreshRank();
    this.game.notify(`${game.title} is out! Critics scored it ${review}/10.`); this.game.events.emit('release', game); this.game.changed();
  }
}

export class MarketManager {
  constructor(game) { this.game = game; }
  tick() {
    const s = this.game.state;
    s.market.heat = clamp(s.market.heat + (Math.random() * 6 - 2.8), 18, 98);
    if (s.day % 21 === 0) { const genres = ['Cozy adventures', 'Strategy games', 'Roguelikes', 'Life sims', 'Puzzle games']; s.market.trend = genres[Math.floor(Math.random() * genres.length)]; s.market.genre = s.market.trend.split(' ')[0]; this.game.notify(`Market trend shift: ${s.market.trend} are trending.`); }
    for (const g of s.games) {
      const trend = g.genre.toLowerCase() === s.market.genre.toLowerCase() ? 1.45 : .8;
      const marketing = s.marketing?.days > 0 ? 1.35 : 1;
      const demand = Math.max(0, Math.round(g.dailySales * trend * marketing * (.78 + Math.random() * .45) * (1 - g.age / 150)));
      g.sales += demand; this.game.economy.earn(demand * (g.platform === 'Mobile' ? 3 : 7), `${g.title} sales`); g.age++;
    }
    s.market.share = clamp(1.8 + s.reputation * .11 + s.games.length * 1.4, .4, 48);
  }
  rivals() { return [{ name: 'Moonbyte Interactive', genre: 'Adventure', score: 9.2, share: '24%' }, { name: 'Northstar Games', genre: 'Strategy', score: 8.7, share: '19%' }, { name: 'Tiny Comet Studio', genre: 'Puzzle', score: 8.4, share: '12%' }, { name: this.game.state.company, genre: 'Independent', score: (5 + this.game.state.reputation / 20).toFixed(1), share: `${this.game.state.market.share.toFixed(1)}%`, you: true }]; }
}

export class ResearchManager {
  constructor(game) { this.game = game; }
  unlock(key) {
    const item = RESEARCH.find(x => x.id === key); if (!item || this.game.state.research.includes(key)) return;
    if (item.requires && !this.game.state.research.includes(item.requires)) return this.game.notify('Research the prerequisite first.');
    if (!this.game.economy.charge(item.cost, 'Research')) return this.game.notify('Not enough cash for research.');
    this.game.state.research.push(key); this.game.notify(`${item.name} unlocked!`); this.game.changed();
  }
}

export class MarketingManager {
  constructor(game) { this.game = game; }
  launch(type) {
    const options = { Social: { cost: 900, days: 7, fans: 60 }, Influencer: { cost: 3200, days: 12, fans: 260 }, Trailer: { cost: 6500, days: 16, fans: 520 } };
    const m = options[type]; if (this.game.state.marketing?.days > 0) return this.game.notify('A campaign is already running.');
    if (!this.game.economy.charge(m.cost, `${type} campaign`)) return this.game.notify('Not enough cash for this campaign.');
    this.game.state.marketing = { type, days: m.days }; this.game.state.fans += m.fans; this.game.notify(`${type} campaign is live!`); this.game.changed();
  }
}

export class EventManagerSystem {
  constructor(game) { this.game = game; }
  maybe() {
    const s = this.game.state; if (s.day % 9 !== 0 || Math.random() > .55) return;
    const event = Math.random();
    if (event < .35) { const prize = 1800 + Math.floor(Math.random() * 3200); this.game.economy.earn(prize, 'Convention prize'); s.reputation = clamp(s.reputation + 4, 0, 100); this.game.notify(`Convention spotlight! You won $${prize.toLocaleString()} and reputation.`); }
    else if (event < .7) { const bill = 900 + Math.floor(Math.random() * 1800); if (!this.game.economy.charge(bill, 'Unexpected repair')) this.game.notify('Unexpected equipment repair! Your cash is running low.'); else this.game.notify(`Unexpected equipment repair: $${bill.toLocaleString()}.`); }
    else { s.fans += 180; s.reputation = clamp(s.reputation + 2, 0, 100); this.game.notify('A creator featured your studio. Your community is growing!'); }
  }
}

export const RESEARCH = [
  { id: 'engine', name: 'Studio Engine 2.0', desc: 'Better tools make every project more ambitious.', icon: '✳', cost: 5200 },
  { id: 'visuals', name: 'Next-gen visuals', desc: 'Raise the ceiling on visual quality.', icon: '◈', cost: 8200, requires: 'engine' },
  { id: 'online', name: 'Online services', desc: 'Build connected worlds and live features.', icon: '⌁', cost: 12000, requires: 'engine' },
  { id: 'console', name: 'Console publishing', desc: 'Take your games to living-room platforms.', icon: '▣', cost: 19000, requires: 'visuals' },
  { id: 'vr', name: 'Spatial computing', desc: 'Explore a brand-new dimension of play.', icon: '◎', cost: 28000, requires: 'online' }
];

export class GameManager {
  constructor() {
    this.events = new EventManager(); this.saveManager = new SaveManager();
    this.state = this.saveManager.load() || initialState();
    this.company = new CompanyManager(this); this.economy = new EconomyManager(this); this.employees = new EmployeeManager(this); this.office = new OfficeManager(this); this.development = new GameDevelopmentManager(this); this.market = new MarketManager(this); this.research = new ResearchManager(this); this.marketing = new MarketingManager(this); this.eventSystem = new EventManagerSystem(this);
    this.onChange = () => {}; this.onToast = () => {};
  }
  changed() { this.company.refreshRank(); this.saveManager.save(this.state); this.onChange(); }
  notify(text) { this.onToast(text); }
  advance(days = 1) {
    for (let i = 0; i < days; i++) {
      const s = this.state; s.day++;
      const payroll = this.economy.getDailyPayroll(); const rent = 45 + s.office.level * 125;
      if (payroll + rent > 0) {
        if (!this.economy.charge(payroll + rent, 'Payroll & rent')) { s.cash = Math.max(0, s.cash - 100); s.bankruptDays++; if (s.bankruptDays === 3) this.notify('Cash is tight. Release a game or downsize to recover.'); }
        else s.bankruptDays = 0;
      }
      this.development.workDay(); this.market.tick();
      if (s.marketing?.days > 0 && --s.marketing.days === 0) { s.marketing = null; this.notify('Campaign wrapped up. Thanks for the buzz!'); }
      this.eventSystem.maybe();
      s.employees.forEach(e => { e.happiness = clamp(e.happiness + (s.cash > 5000 ? .4 : -1), 35, 100); });
    }
    this.changed();
  }
  newGame(name) { this.saveManager.clear(); this.state = initialState(name); this.changed(); }
  manualSave() { this.saveManager.save(this.state); this.notify('Progress saved on this device.'); }
}
