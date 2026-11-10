'use strict';
/* Jaarbudget — volledig offline. Geen enkele netwerkverbinding: alle gegevens
   blijven in de opslag van deze app op dit toestel. */
(function () {

/* ───────────── basis ───────────── */
const KEY = 'jaarbudget.v2';
const MON = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
const MONF = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
const WD = ['zo','ma','di','wo','do','vr','za'];
const LTYPES = [['inkomen','Inkomen'],['vast','Vaste lasten'],['sparen','Naar spaarrekening'],['overboeking','Overboeking']];
const nf0 = new Intl.NumberFormat('nl-NL', {style:'currency', currency:'EUR', maximumFractionDigits:0, minimumFractionDigits:0});
const nf2 = new Intl.NumberFormat('nl-NL', {style:'currency', currency:'EUR', minimumFractionDigits:2, maximumFractionDigits:2});
const eur = v => nf0.format(Math.round(v) || 0);
const eur2 = v => nf2.format(v || 0);
const eurS = v => (Math.round(v) > 0 ? '+' : '') + eur(v);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const sum = a => a.reduce((x, y) => x + (+y || 0), 0);
const r2 = v => Math.round(v * 100) / 100;
const z12 = () => Array(12).fill(0);
const stdev = a => { if (a.length < 2) return 0; const m = sum(a) / a.length; return Math.sqrt(sum(a.map(x => (x - m) ** 2)) / (a.length - 1)); };
const numIn = v => String(Math.round((+v || 0) * 100) / 100).replace('.', ',');

const D = (y, m, d) => new Date(y, m, d, 12);
const iso = dt => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
const fromIso = s => { const [a, b, c] = String(s).split('-').map(Number); return D(a, b - 1, c); };
const today = () => { const n = new Date(); return D(n.getFullYear(), n.getMonth(), n.getDate()); };
const addDays = (dt, n) => D(dt.getFullYear(), dt.getMonth(), dt.getDate() + n);
const dayDiff = (a, b) => Math.round((b - a) / 864e5);
const dShort = dt => `${dt.getDate()} ${MON[dt.getMonth()]}`;
const dLong = dt => `${WD[dt.getDay()]} ${dt.getDate()} ${MON[dt.getMonth()]}`;

/* ───────────── opslag ───────────── */
const KAS = { id: 'kas', name: 'Kasverschil', doel: 0, grens: 0, acct: 'spaar', vrij: false, sys: 'kas' };
function defaultState() {
  return {
    version: 2,
    settings: { year: today().getFullYear(), payday: 15, startSavings: 0, interest: 2 },
    lines: [],   // inkomen / vast / sparen / overboeking, bedrag per maand
    dyme: [],    // budgetten die via Dyme worden bijgehouden: doel/grens per maand
    pots: [ { id: 'gez', name: 'Gezamenlijke rekening (extra)', doel: 0, grens: 0, acct: 'spaar', vrij: false },
            { id: 'cap', name: 'Belegging/Capex', doel: 0, grens: 0, acct: 'spaar', vrij: false }, { ...KAS } ],
    extraInc: [],  // overige inkomsten: { id, k (maand 0–11), name, amt }
    moves: [], tx: [], catMap: {}, lastImport: null, demo: false
  };
}
function normalize(s) {
  const d = defaultState();
  const o = Object.assign(d, s, { settings: Object.assign(d.settings, s.settings) });
  if (!o.pots.some(p => p.sys === 'kas')) o.pots.push({ ...KAS });
  if (!Array.isArray(o.extraInc)) o.extraInc = [];
  return o;
}
function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) return normalize(JSON.parse(raw)); } catch (e) {}
  try { localStorage.removeItem('jaarbudget.v1'); } catch (e) {}
  return defaultState();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Opslaan mislukt — maak een back-up'); } }
let S = load();
const ui = { tab: 'dash', budMode: 'periode', sel: null, planMonth: null };

/* ───────────── salarisdag: 15e, of de werkdag ervoor (weekend/feestdag) ───────────── */
function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
    l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
    mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1;
  return D(y, mo - 1, da);
}
const holCache = {};
function holidays(y) {
  if (holCache[y]) return holCache[y];
  const e = easter(y), kd = D(y, 3, 27);
  const list = [['Nieuwjaarsdag', D(y, 0, 1)], ['Goede Vrijdag', addDays(e, -2)], ['Eerste paasdag', e], ['Tweede paasdag', addDays(e, 1)],
    ['Koningsdag', kd.getDay() === 0 ? D(y, 3, 26) : kd], ['Hemelvaartsdag', addDays(e, 39)], ['Eerste pinksterdag', addDays(e, 49)],
    ['Tweede pinksterdag', addDays(e, 50)], ['Eerste kerstdag', D(y, 11, 25)], ['Tweede kerstdag', D(y, 11, 26)]];
  if (y % 5 === 0) list.push(['Bevrijdingsdag', D(y, 4, 5)]);
  const map = new Map(list.map(([n, d]) => [iso(d), n]));
  return holCache[y] = map;
}
const isWorkday = dt => dt.getDay() !== 0 && dt.getDay() !== 6 && !holidays(dt.getFullYear()).has(iso(dt));
function payday(y, m) {
  const last = new Date(y, m + 1, 0).getDate();
  let dt = D(y, m, Math.min(Math.max(1, +S.settings.payday || 15), last));
  while (!isWorkday(dt)) dt = addDays(dt, -1);
  return dt;
}
function periods(y) {
  const P = [];
  for (let m = 0; m < 12; m++) {
    const s = payday(y, m), e = addDays(m === 11 ? payday(y + 1, 0) : payday(y, m + 1), -1);
    P.push({ k: m, start: s, end: e, days: dayDiff(s, e) + 1 });
  }
  return P;
}
function periodOf(P, dt) {
  for (const p of P) if (dt >= p.start && dt <= p.end) return p.k;
  return dt < P[0].start ? -1 : 12;
}

/* ───────────── plan ───────────── */
function plan() {
  const t = { inkomen: z12(), vast: z12(), sparen: z12(), overboeking: z12(), dd: z12(), dg: z12() };
  for (const l of S.lines) if (!l.rest) for (let k = 0; k < 12; k++) t[l.type][k] += +l.m[k] || 0;
  t.extra = z12(); for (const e of S.extraInc) if (e.k >= 0 && e.k < 12) { t.extra[e.k] += +e.amt || 0; t.inkomen[e.k] += +e.amt || 0; }
  for (const d of S.dyme) for (let k = 0; k < 12; k++) { t.dd[k] += +d.doel[k] || 0; t.dg[k] += +d.grens[k] || 0; }
  const vp = S.pots.filter(p => p.vrij);
  t.potDoel = sum(vp.map(p => p.doel)); t.potGrens = sum(vp.map(p => +p.grens || +p.doel));
  // Restpost (bijv. 'Vrij'): krijgt automatisch wat overblijft na vaste posten en het budget voor de vrije ruimte
  t.budgetM = t.dd.map(v => v + t.potDoel / 12);
  t.restM = z12(); t.restLine = S.lines.find(l => l.rest && l.type === 'sparen') || null;
  if (t.restLine) for (let k = 0; k < 12; k++) { t.restM[k] = r2(t.inkomen[k] - t.vast[k] - t.sparen[k] - t.overboeking[k] - t.budgetM[k]); t.sparen[k] += t.restM[k]; }
  t.vrij = t.inkomen.map((v, k) => v - t.vast[k] - t.sparen[k] - t.overboeking[k]);       // vrije ruimte per maand
  t.lopDoel = sum(vp.filter(p => p.acct === 'lopend').map(p => p.doel));
  t.jaarDoel = sum(t.dd) + t.potDoel; t.jaarGrens = sum(t.dg) + t.potGrens;
  return t;
}

function aggregate(P) {
  const ids = new Set(S.dyme.map(d => d.id)), sp = P.map(() => ({})), unmapped = {};
  let first = null;
  for (const t of S.tx) {
    const k = periodOf(P, fromIso(t.date)); if (k < 0 || k > 11) continue;
    const id = S.catMap[t.cat]; if (id === '__ignore') continue;
    if (!id || !ids.has(id)) { unmapped[t.cat] = (unmapped[t.cat] || 0) + t.amt; continue; }
    sp[k][id] = (sp[k][id] || 0) + t.amt;
    if (first === null || k < first) first = k;
  }
  return { sp, first, unmapped };
}

/* ───────────── rekenmodel ───────────── */
function model() {
  const y = +S.settings.year, P = periods(y), T = today(), pl = plan();
  const cur = periodOf(P, T), inYear = cur >= 0 && cur < 12;
  const frac = inYear ? (dayDiff(P[cur].start, T) + 1) / P[cur].days : (cur > 11 ? 1 : 0);
  const elapsed = cur < 0 ? 0 : cur > 11 ? 12 : cur + frac;
  const { sp, first, unmapped } = aggregate(P);
  const hasData = first !== null && first <= Math.min(cur, 11);

  // 1. Dyme-budgetten: gewogen gemiddelde (recent zwaarder), naar het doel getrokken bij weinig data
  const lineF = {};
  for (const d of S.dyme) {
    const obs = []; if (hasData) for (let k = first; k < Math.min(cur, 12); k++) obs.push(sp[k][d.id] || 0);
    let L = null; for (const x of obs) L = L === null ? x : 0.35 * x + 0.65 * L;
    const n = obs.length, w = n / (n + 2), avgDoel = sum(d.doel) / 12;
    lineF[d.id] = { n, w, L, f: k => n ? w * L + (1 - w) * (+d.doel[k] || 0) : (+d.doel[k] || 0), sd: Math.max(n >= 2 ? stdev(obs) : 0, 0.15 * avgDoel) };
  }
  const dyAct = P.map((_, k) => sum(S.dyme.map(d => sp[k][d.id] || 0)));
  const dyExp = z12(), kind = Array(12).fill(''); let sd2 = 0;
  for (let k = 0; k < 12; k++) {
    if (k < cur) { if (hasData && k >= first) { kind[k] = 'actual'; dyExp[k] = dyAct[k]; } else { kind[k] = 'assumed'; dyExp[k] = pl.dd[k]; } }
    else if (k === cur && hasData) {
      kind[k] = 'current';
      for (const d of S.dyme) { const s = sp[k][d.id] || 0, F = lineF[d.id]; dyExp[k] += Math.max(s, s + F.f(k) * (1 - frac)); sd2 += (F.sd * (1 - frac)) ** 2; }
    } else { kind[k] = 'forecast'; for (const d of S.dyme) { dyExp[k] += lineF[d.id].f(k); sd2 += lineF[d.id].sd ** 2; } }
  }

  // 2. Mutaties
  const yS = D(y, 0, 1), yE = D(y, 11, 31), clampK = dt => Math.max(0, Math.min(11, periodOf(P, dt)));
  const opn = z12(), spaarUitg = z12(), lopUitg = z12(), kas = z12(), potSpent = {}, potVrijK = z12();
  let firstVrijMove = null;
  for (const m of S.moves) {
    const dt = fromIso(m.date); if (dt < yS || dt > yE) continue;
    const k = clampK(dt);
    if (m.kind === 'opname') opn[k] += m.amt;
    else if (m.kind === 'kas') { kas[k] += m.amt; potSpent.kas = (potSpent.kas || 0) + m.amt; }
    else {
      const p = S.pots.find(x => x.id === m.pot); if (!p) continue;
      potSpent[p.id] = (potSpent[p.id] || 0) + m.amt;
      (p.acct === 'lopend' ? lopUitg : spaarUitg)[k] += m.amt;
      if (p.vrij) { potVrijK[k] += m.amt; if (firstVrijMove === null || k < firstVrijMove) firstVrijMove = k; }
    }
  }
  const lastKas = S.moves.filter(m => m.kind === 'kas' && fromIso(m.date) >= yS && fromIso(m.date) <= yE).sort((a, b) => b.date.localeCompare(a.date))[0] || null;
  const kasThisPeriod = inYear && S.moves.some(m => m.kind === 'kas' && fromIso(m.date) >= P[cur].start && fromIso(m.date) <= P[cur].end);

  // 3. Jaarbudgetten. Vrije-ruimte-posten: half 'wat er nog in het budget zit', half 'je tempo tot nu toe'
  //    (zodra een kwart van het jaar voorbij is). Aparte spaarposten met een budget (zoals Huis) in december.
  const wts = P.map((_, k) => k < Math.max(cur, 0) ? 0 : k === cur ? (1 - frac) : 1), totW = sum(wts), ef = elapsed / 12;
  const predLop = z12(), predSpaar = z12(), potRem = {}, vrijRem = {};
  if (cur <= 11) for (const p of S.pots) {
    if (p.sys === 'kas') continue;
    const spent = potSpent[p.id] || 0, budRem = Math.max(0, (+p.doel || 0) - spent);
    if (!p.vrij) { if (+p.doel > 0) { potRem[p.id] = budRem; (p.acct === 'lopend' ? predLop : predSpaar)[11] += budRem; } continue; }
    const pace = ef >= 0.25 ? (spent / ef) * (1 - ef) : null;
    vrijRem[p.id] = pace === null ? budRem : 0.5 * budRem + 0.5 * pace; potRem[p.id] = budRem;
  }

  // 3b. Extra controle met je gemiddelde vrije uitgaven per maand (Dyme + jaarbudgetten samen).
  //     Wijkt dat gemiddelde af van de optelsom per budget, dan schuift de prognose die kant op.
  const useFrom = [first, firstVrijMove].filter(v => v !== null);
  const fu = useFrom.length ? Math.min(...useFrom) : null, avgK = [];
  if (fu !== null) for (let k = fu; k < Math.min(cur, 12); k++) avgK.push(dyAct[k] + potVrijK[k]);
  const nAvg = avgK.length, avgTot = nAvg ? sum(avgK) / nAvg : null;
  const avgDy = nAvg ? sum(avgK.map((_, i) => dyAct[fu + i])) / nAvg : null, avgPot = nAvg ? avgTot - avgDy : null;
  let bottomUp = sum(Object.values(vrijRem));
  for (let k = Math.max(cur, 0); k < 12; k++) bottomUp += dyExp[k] - (k === cur ? dyAct[k] : 0);
  const topDown = nAvg ? avgTot * totW : null, wAvg = nAvg ? 0.5 * nAvg / (nAvg + 4) : 0;
  const scale = (nAvg && bottomUp > 0 && cur <= 11) ? (wAvg * topDown + (1 - wAvg) * bottomUp) / bottomUp : 1;
  if (scale !== 1) for (let k = Math.max(cur, 0); k < 12; k++) dyExp[k] = k === cur ? dyAct[k] + (dyExp[k] - dyAct[k]) * scale : dyExp[k] * scale;
  for (const p of S.pots) if (vrijRem[p.id] && totW > 0) {
    const rem = vrijRem[p.id] * scale;
    for (let k = 0; k < 12; k++) if (wts[k]) (p.acct === 'lopend' ? predLop : predSpaar)[k] += rem * wts[k] / totW;
  }

  // 4. Lopende rekening: per periode vrije ruimte − Dyme − uitgaven van lopende rekening.
  //    Overschot blijft staan als buffer; een tekort wordt van de spaarrekening opgenomen.
  const predOpn = z12(), result = z12(); let buf = 0;
  for (let k = 0; k < 12; k++) {
    const lop = k < cur ? lopUitg[k] : k === cur ? lopUitg[k] + predLop[k] : predLop[k];
    result[k] = pl.vrij[k] - dyExp[k] - lop;
    if (k < Math.max(cur, 0)) continue;
    buf += result[k] + (k === cur ? opn[k] : 0);
    if (buf < 0) { predOpn[k] = -buf; buf = 0; }
  }
  const ingEnd = cur > 11 ? 0 : buf;

  // 5. Spaarrekening: startsaldo is na de storting van januari; daarna storting op elke salarisdag, rente per maand.
  const r = (+S.settings.interest || 0) / 100 / 12, start = +S.settings.startSavings || 0;
  let bal = start, rente = 0, balA = start, renteA = 0;
  const fcPath = [start], periodStart = z12();   // saldo na elke periode; saldo op elke salarisdag (na storting)
  for (let k = 0; k < 12; k++) {
    const dep = k > 0 ? pl.sparen[k] : 0;
    const act = opn[k] + spaarUitg[k] - kas[k];
    const fut = k >= Math.max(cur, 0) ? predOpn[k] + predSpaar[k] : 0;
    periodStart[k] = bal + dep;
    bal += dep - act - fut; const i = bal * r; rente += i; bal += i; fcPath.push(bal);
    if (k < cur) { balA += dep - act; const ia = balA * r; renteA += ia; balA += ia; }
    else if (k === cur) balA += dep - act;
  }
  const eind = bal, savingsNow = cur < 0 ? start : balA;
  // plan: geen tekorten, jaarbudgetten precies op doel
  let pb = start, prente = 0, ping = 0; const planPath = [start];
  for (let k = 0; k < 12; k++) {
    let out = 0; for (const p of S.pots) if (+p.doel > 0 && p.acct === 'spaar' && !p.sys) out += p.vrij ? p.doel / 12 : (k === 11 ? +p.doel : 0);
    pb += (k > 0 ? pl.sparen[k] : 0) - out; const i = pb * r; prente += i; pb += i; planPath.push(pb);
    ping += pl.vrij[k] - pl.dd[k] - pl.lopDoel / 12;
  }
  const band = cur > 11 ? 0 : 1.28 * Math.sqrt(sd2);
  // Prognose begin boekjaar: wordt vastgezet bij de eerste salarisdag (relatief t.o.v. startsaldo,
  // zodat het later invullen van het exacte startsaldo de lijn netjes meeschuift)
  if (cur >= 0 && (S.lines.length || S.dyme.length) && (!S.baseline || S.baseline.year !== y)) { S.baseline = { year: y, rel: planPath.map(v => r2(v - start)) }; save(); }
  const basePath = S.baseline && S.baseline.year === y ? S.baseline.rel.map(v => v + start) : planPath;

  // 6. Vrije ruimte over het jaar
  const dyYtd = {}; for (const d of S.dyme) { let s = 0; for (let k = 0; k <= Math.min(cur, 11); k++) s += sp[k]?.[d.id] || 0; dyYtd[d.id] = s; }
  const vrijExp = sum(dyExp) + sum(S.pots.filter(p => p.vrij).map(p => (potSpent[p.id] || 0) + (vrijRem[p.id] || 0) * scale));

  return { y, P, T, cur, inYear, frac, elapsed, pl, sp, first, hasData, unmapped, lineF, dyAct, dyExp, kind, opn, spaarUitg, lopUitg, kas,
    potSpent, potRem, predOpn, predLop, predSpaar, result, ingEnd, start, eind, savingsNow, rente, renteA, planEind: pb, planRente: prente,
    planIng: ping, band, dyYtd, vrijExp, lastKas, kasThisPeriod, deposits: sum(pl.sparen.slice(1)),
    nAvg, avgTot, avgDy, avgPot, scale, topDown, bottomUp, vrijRem, fcPath, planPath, basePath, periodStart, potVrijK };
}

function status(s, d, g) { if (s <= d + 0.005) return 'ok'; if (s <= (g || d) + 0.005) return 'warn'; return 'over'; }
const STATUS_TXT = { ok: 'op koers', warn: 'boven doel', over: 'boven grens' };

/* ───────────── weergave-onderdelen ───────────── */
function bar(spent, doel, grens, pace, st) {
  const max = Math.max(grens || doel || 1, spent, pace || 0) * 1.08;
  const pct = v => Math.max(0, Math.min(100, v / max * 100)).toFixed(2);
  st = st || status(spent, doel, grens);
  return `<div class="bar ${st}"><div class="fill" style="width:${pct(spent)}%"></div>` +
    (doel ? `<i class="tick doel" style="left:${pct(doel)}%"></i>` : '') +
    (grens && grens > doel ? `<i class="tick grens" style="left:${pct(grens)}%"></i>` : '') +
    (pace != null ? `<i class="tick pace" style="left:${pct(pace)}%"></i>` : '') + `</div>`;
}
function budgetRow(name, spent, doel, grens, opts = {}) {
  const st = opts.st || status(spent, doel, grens);
  return `<div class="bl"${opts.act ? ` data-act="${opts.act}" data-id="${opts.id}"` : ''}><div class="top-r"><span class="name">${esc(name)}${opts.tag ? `<span class="tag">${opts.tag}</span>` : ''}<span class="chip ${st}">${STATUS_TXT[st]}</span></span><span class="amt">${eur(spent)}</span></div>
    ${bar(spent, doel, grens, opts.pace, st)}
    <div class="meta"><span>doel ${eur(doel)} · grens ${eur(grens)}</span><span class="${doel - spent >= 0 ? '' : 'neg'}">${doel - spent >= 0 ? 'nog ' + eur(doel - spent) : eur(spent - doel) + ' over doel'}</span></div></div>`;
}
const shortK = v => v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 0 : 1).replace('.', ',') + 'k' : String(Math.round(v));
function niceStep(raw) { const p = 10 ** Math.floor(Math.log10(raw || 1)); const n = raw / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }

function chart(m) {
  const W = 340, H = 176, pl = 30, pr = 4, pt = 8, pb = 20, iw = W - pl - pr, ih = H - pt - pb;
  const max = Math.max(...m.pl.dg, ...m.pl.dd, ...m.dyExp, 50) * 1.1;
  const y = v => pt + ih - (v / max) * ih, bw = iw / 12, step = niceStep(max / 3);
  let s = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Uitgaven maandbudgetten per maand">` +
    `<defs><pattern id="hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="4" class="hatch-bg"/><line x1="0" y1="0" x2="0" y2="4" class="hatch-ln"/></pattern></defs>`;
  for (let v = 0; v < max; v += step) s += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${pl - 4}" y="${y(v) + 3}" class="axis" text-anchor="end">${shortK(v)}</text>`;
  for (let k = 0; k < 12; k++) {
    const x = pl + k * bw, bx = x + bw * .17, w = bw * .66, kd = m.kind[k], tot = m.dyExp[k], dd = m.pl.dd[k], dg = m.pl.dg[k];
    const h = v => Math.max(0, ih + pt - y(v));
    if (ui.sel === k) s += `<rect x="${x + 1}" y="${pt}" width="${bw - 2}" height="${ih}" rx="5" class="selbg"/>`;
    if (kd === 'actual') s += `<rect x="${bx}" y="${y(tot)}" width="${w}" height="${h(tot)}" rx="3" class="b-${status(tot, dd, dg)}"/>`;
    else if (kd === 'assumed') s += `<rect x="${bx}" y="${y(tot)}" width="${w}" height="${h(tot)}" rx="3" class="b-ass"/>`;
    else if (kd === 'current') {
      const a = m.dyAct[k];
      s += `<rect x="${bx}" y="${y(tot)}" width="${w}" height="${Math.max(0, y(a) - y(tot))}" rx="3" class="b-fc"/>`;
      s += `<rect x="${bx}" y="${y(a)}" width="${w}" height="${h(a)}" rx="3" class="b-${status(a, dd, dg)}"/>`;
    } else s += `<rect x="${bx + .5}" y="${y(tot)}" width="${w - 1}" height="${h(tot)}" rx="3" class="b-fc"/>`;
    s += `<line x1="${x + 2}" x2="${x + bw - 2}" y1="${y(dd)}" y2="${y(dd)}" class="t-doel"/>`;
    if (dg > dd) s += `<line x1="${x + 2}" x2="${x + bw - 2}" y1="${y(dg)}" y2="${y(dg)}" class="t-grens"/>`;
    s += `<text x="${x + bw / 2}" y="${H - 5}" class="mon${ui.sel === k || (ui.sel === null && k === m.cur) ? ' sel' : ''}" text-anchor="middle">${MON[k]}</text>`;
    s += `<rect x="${x}" y="0" width="${bw}" height="${H}" class="hit" data-act="chart-sel" data-k="${k}"/>`;
  }
  return s + `</svg>`;
}
function chartDetail(m) {
  const k = ui.sel ?? (m.inYear ? m.cur : null); if (k === null) return '';
  const kd = m.kind[k], p = m.P[k];
  const head = `<div class="row"><b>${MONF[k]} <span class="sub">· ${dShort(p.start)} – ${dShort(p.end)}</span></b></div>`;
  if (kd === 'assumed') return `<div class="chart-detail">${head}<div class="sub">Geen Dyme-gegevens — aangenomen als maandbudget (${eur(m.pl.dd[k])}).</div></div>`;
  const rows = S.dyme.map(d => { const a = m.sp[k][d.id] || 0, v = kd === 'forecast' ? m.lineF[d.id].f(k) : a; return { n: d.name, v, st: status(v, +d.doel[k], +d.grens[k]) }; }).sort((a, b) => b.v - a.v);
  return `<div class="chart-detail">${head}` +
    `<div class="kv"><span>${kd === 'actual' ? 'Uitgegeven' : kd === 'current' ? 'Tot nu toe' : 'Verwacht'}</span><b>${eur(kd === 'current' ? m.dyAct[k] : m.dyExp[k])}</b></div>` +
    (kd === 'current' ? `<div class="kv"><span>Verwacht tot volgende salaris</span><b>${eur(m.dyExp[k])}</b></div>` : '') +
    `<div class="kv"><span>Doel · grens</span><b>${eur(m.pl.dd[k])} · ${eur(m.pl.dg[k])}</b></div>` +
    `<div class="divider"></div>` +
    rows.map(r => `<div class="kv"><span>${esc(r.n)}</span><b class="${r.st === 'over' ? 'neg' : r.st === 'warn' ? 'wrn' : ''}">${eur(r.v)}</b></div>`).join('') + `</div>`;
}

function lineChart(m) {
  const W = 340, H = 190, pl = 38, pr = 8, pt = 10, pb = 20, iw = W - pl - pr, ih = H - pt - pb;
  const n = m.cur < 0 ? -1 : m.cur > 11 ? 12 : m.cur;
  const nowX = m.cur < 0 ? 0 : m.cur > 11 ? 12 : m.cur + m.frac;
  const real = m.fcPath.slice(0, Math.max(0, n) + 1).map((v, i) => [i, v]);
  if (m.inYear) real.push([nowX, m.savingsNow]);
  const fc = m.cur > 11 ? [] : [[nowX, m.inYear ? m.savingsNow : m.start], ...m.fcPath.map((v, i) => [i, v]).filter(([i]) => i > nowX)];
  const all = [...m.basePath, ...m.fcPath, m.savingsNow];
  let lo = Math.min(...all), hi = Math.max(...all); const pad = (hi - lo) * 0.12 || 500; lo -= pad; hi += pad;
  const step = niceStep((hi - lo) / 3); lo = Math.floor(lo / step) * step;
  const x = i => pl + i / 12 * iw, y = v => pt + ih - (v - lo) / (hi - lo) * ih;
  const path = pts => pts.map(([i, v], j) => (j ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ');
  let s = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Verloop spaarrekening">`;
  for (let v = lo; v <= hi; v += step) s += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${pl - 4}" y="${y(v) + 3}" class="axis" text-anchor="end">${shortK(v)}</text>`;
  for (let k = 0; k < 12; k += 1) s += `<text x="${x(k + 0.5)}" y="${H - 5}" class="mon${k === m.cur ? ' sel' : ''}" text-anchor="middle">${MON[k][0].toUpperCase()}</text>`;
  if (m.inYear) s += `<line x1="${x(nowX)}" x2="${x(nowX)}" y1="${pt}" y2="${pt + ih}" class="today"/>`;
  s += `<path d="${path(m.basePath.map((v, i) => [i, v]))}" class="ln-base"/>`;
  if (fc.length > 1) s += `<path d="${path(fc)}" class="ln-fc"/>`;
  if (real.length > 1) s += `<path d="${path(real)}" class="ln-real"/>`;
  const last = real.length ? real[real.length - 1] : [0, m.start];
  s += `<circle cx="${x(last[0])}" cy="${y(last[1])}" r="3.5" class="dot-real"/>`;
  s += `<circle cx="${x(12)}" cy="${y(m.eind)}" r="3" class="dot-fc"/>`;
  return s + `</svg>`;
}
const ICON = {
  out: '<svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  tag: '<svg viewBox="0 0 24 24"><path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/></svg>',
  imp: '<svg viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
  chk: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
  home: '<svg viewBox="0 0 24 24"><path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/></svg>'
};
function reminderHtml(m) {
  // vanaf 1 dag vóór de salarisdag: Dyme inlezen en saldo invoeren, tot beide gedaan zijn
  const nxt = m.inYear ? addDays(m.P[m.cur].end, 1) : m.cur < 0 ? m.P[0].start : null;
  let trig = null;
  if (nxt && m.T >= addDays(nxt, -1)) trig = addDays(nxt, -1);
  else if (m.inYear) trig = addDays(m.P[m.cur].start, -1);
  if (!trig) return '';
  const t = iso(trig), dymeDone = S.lastImport && S.lastImport >= t;
  const saldoDone = S.moves.some(x => x.kind === 'kas' && x.date >= t);
  if (dymeDone && saldoDone) return '';
  const when = nxt && dayDiff(m.T, nxt) === 1 ? 'Morgen salaris' : 'Salaris ontvangen';
  return `<div class="card callout"><b>${when} — maand afsluiten</b><div class="sub" style="margin-bottom:10px">Lees je Dyme-export in en controleer het saldo van je spaarrekening.</div>
    <div class="two-btn" style="margin:0">
      <button class="btn${dymeDone ? ' done' : ' primary'}" data-act="pick-dyme">${dymeDone ? '✓ Dyme ingelezen' : 'Dyme-export inlezen'}</button>
      <button class="btn${saldoDone ? ' done' : ' primary'}" data-act="sheet-saldo">${saldoDone ? '✓ Saldo ingevoerd' : 'Saldo invoeren'}</button></div></div>`;
}
function actionsHtml(withImport) {
  return `<div class="actions">
    <button class="act" data-act="sheet-opname"><span class="ic">${ICON.out}</span><b>Geld opnemen<small>van spaarrekening</small></b></button>
    <button class="act" data-act="sheet-uitgave"><span class="ic">${ICON.tag}</span><b>Losse uitgave<small>jaarbudget of spaarpost</small></b></button>
    ${withImport ? `<button class="act wide" data-act="pick-dyme"><span class="ic">${ICON.imp}</span><b>Dyme-export inlezen<small>${S.lastImport ? 'Laatst: ' + dLong(fromIso(S.lastImport)) + ' · ' + S.tx.length + ' transacties' : 'Nog niets ingelezen'}</small></b></button>` : ''}
  </div>`;
}
function header(title, eyebrow) {
  return `<header class="top"><div><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1></div></header>` +
    (S.demo ? `<div class="banner"><span>Je bekijkt demogegevens.</span><button data-act="wipe">Wissen</button></div>` : '');
}
const vrijPots = () => S.pots.filter(p => p.vrij);
const spaarPosts = () => S.pots.filter(p => !p.vrij);

/* ───────────── schermen ───────────── */
function renderDash(m) {
  let h = header('Overzicht', `Boekjaar ${m.y}`);
  if (!S.lines.length && !S.dyme.length) {
    return h + `<div class="card prose"><p><b>Welkom.</b> Lees je jaarbudget in, of bekijk de app eerst met demogegevens.</p>
      <button class="btn primary" data-act="pick-budget">Budget inlezen</button>
      <button class="btn" data-act="budget-template">Sjabloon downloaden</button>
      <button class="btn" data-act="demo">Demo bekijken</button></div>`;
  }
  h += reminderHtml(m) + actionsHtml(false);
  // periode
  if (m.inYear) {
    const p = m.P[m.cur], nxt = addDays(p.end, 1), daysTo = dayDiff(m.T, nxt);
    const spent = m.dyAct[m.cur], doel = m.pl.dd[m.cur], grens = m.pl.dg[m.cur], left = doel - spent;
    h += `<div class="card">
      <div class="period-head"><div><div class="lbl">Deze periode · maandbudgetten</div><div style="font-weight:600">${dShort(p.start)} – ${dShort(p.end)}</div></div>
        <div class="countdown"><b>${daysTo}</b><span>${daysTo === 1 ? 'dag' : 'dagen'} tot<br>salaris</span></div></div>
      <div class="spent-line"><span class="mid money">${eur(spent)}</span><span class="sub">van ${eur(doel)} · grens ${eur(grens)}</span></div>
      ${bar(spent, doel, grens, doel * m.frac)}
      <div class="sub" style="margin-top:10px">${left >= 0 ? `Nog <b class="pos">${eur(left)}</b> tot je doel · ca. ${eur(left / Math.max(1, daysTo))} per dag`
        : spent <= grens ? `<b class="wrn">${eur(-left)}</b> boven doel · nog ${eur(grens - spent)} tot je grens` : `<b class="neg">${eur(spent - grens)}</b> boven je grens`}</div>
      <div class="hint" style="margin:8px 0 0">Volgend salaris: ${dLong(nxt)}${!m.hasData ? ' · nog geen Dyme-gegevens' : ''}</div></div>`;
  } else {
    const nxt = m.cur < 0 ? m.P[0].start : payday(m.y + 1, 0), d = dayDiff(m.T, nxt);
    h += `<div class="card"><div class="lbl">${m.cur < 0 ? `Boekjaar ${m.y} begint` : `Boekjaar ${m.y} is afgelopen`}</div><div class="mid">${dLong(nxt)}</div><div class="sub">${m.cur < 0 ? `Eerste salaris over ${d} dagen` : 'Start een nieuw boekjaar via Instellingen'}</div></div>`;
  }
  // prognose
  const diff = m.eind - m.planEind;
  h += `<div class="card">
    <div class="row"><div class="lbl">Prognose spaarrekening 31 december</div><button class="link" data-act="info-prognose">Hoe?</button></div>
    <div class="big" style="margin:6px 0 2px">${eur(m.eind)}</div>
    <div class="sub">${m.band > 1 ? `Waarschijnlijk tussen ${eur(m.eind - m.band)} en ${eur(m.eind + m.band)}` : 'Op basis van je budget'}</div>
    <div class="divider"></div>
    <div class="kv"><span>Nu op spaarrekening</span><b>${eur(m.savingsNow)}</b></div>
    <div class="kv"><span>Volgens plan</span><b>${eur(m.planEind)}</b></div>
    <div class="kv"><span>Verschil met plan</span><b class="${diff >= 0 ? 'pos' : 'neg'}">${eurS(diff)}</b></div>
    <div class="kv"><span>Verwacht over op lopende rekening</span><b>${eur(m.ingEnd)}</b></div>
    ${m.nAvg ? `<div class="kv"><span>Gem. vrije uitgaven per maand</span><b class="${m.avgTot > sum(m.pl.budgetM) / 12 + 0.5 ? 'neg' : 'pos'}">${eur(m.avgTot)} <small class="sub">/ ${eur(sum(m.pl.budgetM) / 12)}</small></b></div>` : ''}</div>`;
  h += `<div class="card"><div class="row"><div class="lbl">Uitgaven maandbudgetten per maand</div><span class="sub" style="font-size:12px">tik op een maand</span></div>
    ${chart(m)}<div class="legend"><span><i class="l-act"></i>werkelijk</span><span><i class="l-fc"></i>verwacht</span><span><i class="l-doel"></i>doel</span><span><i class="l-grens"></i>grens</span></div>${chartDetail(m)}</div>`;
  h += jaarBudgetsHtml(m, true);
  return h;
}

function jaarBudgetsHtml(m, compact) {
  const pace = m.elapsed / 12;
  let h = `<h2>Jaarbudgetten ${m.y}</h2>`;
  const pct = Math.round(pace * 100);
  h += `<div class="card year-prog"><div class="row"><span class="lbl">Jaar verstreken</span><b>${pct}%</b></div>
    <div class="bar"><div class="fill prog" style="width:${pct}%"></div></div>
    <div class="meta"><span>${dShort(m.P[0].start)}</span><span>${m.inYear ? 'vandaag ' + dShort(m.T) : ''}</span><span>31 dec</span></div>
    <div class="legend" style="margin-top:8px"><span><i class="l-pace"></i>zo ver is het jaar — vergelijk met de balk</span></div></div>`;
  h += `<div class="card tight">` + S.dyme.map(d => {
    const doel = sum(d.doel), grens = sum(d.grens), s = m.dyYtd[d.id] || 0;
    return budgetRow(d.name, s, doel, grens, { pace: doel * pace, st: status(s, doel * pace, grens * pace), tag: 'maand', act: compact ? null : 'edit-dyme', id: d.id });
  }).join('') + vrijPots().map(p => budgetRow(p.name, m.potSpent[p.id] || 0, +p.doel, +p.grens || +p.doel, { pace: (+p.doel) * pace, act: compact ? null : 'edit-pot', id: p.id })).join('') + `</div>`;
  const others = spaarPosts();
  if (others.length) h += `<h2>Overige uitgaven spaarrekening ${m.y}</h2><div class="card tight">` + others.map(p => {
    const s = m.potSpent[p.id] || 0;
    return `<button class="list-btn${compact ? ' plain' : ''}" ${compact ? '' : `data-act="edit-pot" data-id="${p.id}"`}><span>${esc(p.name)}</span><span class="r ${p.sys === 'kas' ? (s >= 0 ? 'pos' : 'neg') : ''}">${p.sys === 'kas' ? eurS(s) : eur(s)}${+p.doel ? ` <small class="sub">/ ${eur(p.doel)}</small>` : ''}</span></button>`;
  }).join('') + `</div>`;
  return h;
}

function renderBudget(m) {
  let h = header('Budgetten', `Boekjaar ${m.y}`);
  if (!S.lines.length && !S.dyme.length) return h + `<div class="card empty">Nog geen budget. Lees er een in via Instellingen.</div>`;
  const mode = ui.budMode;
  h += `<div class="seg"><button data-act="budmode" data-mode="periode" class="${mode === 'periode' ? 'on' : ''}">Deze periode</button><button data-act="budmode" data-mode="jaar" class="${mode === 'jaar' ? 'on' : ''}">Dit jaar</button></div>`;
  const um = Object.entries(m.unmapped).filter(([, v]) => Math.abs(v) > 0.5);
  if (um.length) h += `<div class="banner"><span>${um.length} Dyme-categorie${um.length > 1 ? 'ën' : ''} nog niet gekoppeld (${eur(sum(um.map(x => x[1])))}).</span><button data-act="sheet-catmap">Koppelen</button></div>`;

  if (mode === 'periode') {
    const k = Math.min(Math.max(m.cur, 0), 11), p = m.P[k];
    const startS = m.periodStart[k], opn = m.opn[k], uit = m.spaarUitg[k];
    const ruimte = m.pl.vrij[k] - m.pl.dd[k], jb = m.potVrijK[k], besch = ruimte - jb - opn;
    const perPot = S.pots.filter(x => x.acct === 'spaar' && !x.sys).map(x => [x.name, sum(S.moves.filter(mv => mv.kind === 'uitgave' && mv.pot === x.id && fromIso(mv.date) >= p.start && fromIso(mv.date) <= p.end).map(mv => mv.amt))]).filter(x => x[1]);
    const nk = k + 1, nDate = nk < 12 ? m.P[nk].start : payday(m.y + 1, 0), dep = m.cur < 0 ? m.pl.sparen[0] : nk < 12 ? m.pl.sparen[nk] : m.pl.sparen[0];
    const saldoNu = startS - opn - uit + (m.kas[k] || 0), naStorting = m.cur < 0 ? m.start : saldoNu + dep;
    h += `<div class="card"><div class="lbl">Vrije ruimte beschikbaar · ${dShort(p.start)} – ${dShort(p.end)}</div>
      <div class="big ${besch >= 0 ? 'pos' : 'neg'}" style="margin:6px 0 8px">${eurS(besch)}</div>
      <div class="kv"><span>Vrije ruimte deze periode</span><b>${eur(m.pl.vrij[k])}</b></div>
      <div class="kv"><span>Maandbudgetten (in Dyme)</span><b>−${eur(m.pl.dd[k])}</b></div>
      <div class="kv"><span>Jaarbudgetten uitgegeven</span><b>−${eur(jb)}</b></div>
      <div class="kv"><span>Extra opgenomen</span><b>−${eur(opn)}</b></div>
      <div class="divider"></div>
      <div class="kv"><span>Storting ${MONF[nDate.getMonth()]} <small class="sub">(${dLong(nDate)})</small></span><b class="pos">+${eur(dep)}</b></div>
      <div class="kv total"><span>Saldo spaarrekening na storting</span><b>${eur(naStorting)}</b></div>
      <p class="hint" style="margin:8px 0 0">Plus: je hebt nog ruimte voor jaarbudgetten. Min: je hebt deze periode meer uitgegeven dan je vrije ruimte.</p></div>`;
    h += `<div class="card"><div class="lbl">Spaarrekening deze periode</div>
      <div class="sub" style="margin-bottom:6px">Begint opnieuw bij elke salarisdag</div>
      <div class="kv"><span>Startsaldo spaarrekening <small class="sub">(${dShort(p.start)}, na storting)</small></span><b>${eur(startS)}</b></div>
      <div class="kv"><span>Extra opgenomen van spaarrekening</span><b class="${opn ? 'neg' : ''}">−${eur(opn)}</b></div>
      <div class="kv"><span>Extra uitgaven spaarrekening</span><b>−${eur(uit)}</b></div>
      ${perPot.map(([n, v]) => `<div class="kv sub-kv"><span>${esc(n)}</span><span>${eur(v)}</span></div>`).join('')}
      ${m.kas[k] ? `<div class="kv"><span>Kasverschil</span><b>${eurS(m.kas[k])}</b></div>` : ''}
      <div class="kv total"><span>Saldo spaarrekening nu</span><b>${eur(saldoNu)}</b></div></div>`;
  } else {
    const st = status(m.vrijExp, m.pl.jaarDoel, m.pl.jaarGrens);
    h += `<div class="card"><div class="row"><div class="lbl">Prognose vrije ruimte ${m.y}</div><span class="chip ${st}">${STATUS_TXT[st]}</span></div>
      <div class="big" style="margin:6px 0 8px">${eur(m.vrijExp)}</div>
      ${bar(m.vrijExp, m.pl.jaarDoel, m.pl.jaarGrens, null, st)}
      <div class="meta" style="display:flex;justify-content:space-between;font-size:13px;color:var(--muted);margin-top:8px"><span>doel ${eur(m.pl.jaarDoel)} · grens ${eur(m.pl.jaarGrens)}</span><span>${eurS(m.pl.jaarDoel - m.vrijExp)}</span></div></div>`;
    if (m.nAvg) {
      const bud = sum(m.pl.budgetM) / 12, bdy = sum(m.pl.dd) / 12, bpot = m.pl.potDoel / 12;
      const kvA = (n, a, b) => `<div class="kv"><span>${n}</span><b class="${a > b + 0.5 ? 'neg' : ''}">${eur(a)} <small class="sub">/ ${eur(b)}</small></b></div>`;
      h += `<div class="card"><div class="lbl" style="margin-bottom:4px">Gemiddeld per maand · ${m.nAvg} ${m.nAvg === 1 ? 'periode' : 'perioden'}</div>
        ${kvA('Maandbudgetten', m.avgDy, bdy)}${kvA('Jaarbudgetten', m.avgPot, bpot)}<div class="kv total"><span>Vrije uitgaven</span><b class="${m.avgTot > bud + 0.5 ? 'neg' : 'pos'}">${eur(m.avgTot)} <small class="sub">/ ${eur(bud)}</small></b></div>
        <p class="hint" style="margin:8px 0 0">Bij dit gemiddelde kom je dit jaar uit op ${eur(sum(m.dyAct.slice(0, Math.min(m.cur, 11) + 1)) + sum(S.pots.filter(p => p.vrij).map(p => m.potSpent[p.id] || 0)) + m.topDown)}. De prognose weegt dit ${m.scale > 1.005 ? 'mee en ligt daardoor hoger' : m.scale < 0.995 ? 'mee en ligt daardoor lager' : 'mee'}.</p></div>`;
    }
    h += jaarBudgetsHtml(m, false);
    h += `<div class="two-btn"><button class="btn" data-act="edit-dyme" data-id="">Maandbudget toevoegen</button><button class="btn" data-act="edit-pot" data-id="">Jaarbudget toevoegen</button></div>`;
  }

  // Maandplan
  const pm = ui.planMonth ?? Math.min(Math.max(m.cur, 0), 11), pl = m.pl;
  const rows = (t, sign) => S.lines.filter(l => l.type === t).map(l => `<button class="list-btn sub-row" data-act="edit-line" data-id="${l.id}"><span>${esc(l.name)}${l.rest ? '<span class="tag">rest</span>' : ''}</span><span class="r${l.rest && pl.restM[pm] < 0 ? ' neg' : ''}">${sign}${eur(l.rest ? pl.restM[pm] : l.m[pm])}</span></button>`).join('');
  const grp = (t, label) => S.lines.some(l => l.type === t) ? `<div class="list-btn plain grp"><span>${label}</span><span class="r">−${eur(pl[t][pm])}</span></div>` + rows(t, '') : '';
  const ex = S.extraInc.filter(e => e.k === pm);
  const uitTot = pl.vast[pm] + pl.overboeking[pm] + pl.sparen[pm];
  const onder = pl.vrij[pm] - pl.dd[pm] - pl.lopDoel / 12;
  h += `<h2>Maandplan</h2><div class="month-chips">${MON.map((n, i) => `<button data-act="plan-month" data-k="${i}" class="${i === pm ? 'on' : ''}">${n}</button>`).join('')}</div>
    <div class="section-head in"><span>Inkomsten ${MONF[pm]}</span><b>+${eur(pl.inkomen[pm])}</b></div>
    <div class="card tight">${rows('inkomen', '')}
      <div class="list-btn plain grp"><span>Overige inkomsten</span><span class="r">${eur(pl.extra[pm])}</span></div>
      ${ex.map(e => `<button class="list-btn sub-row" data-act="edit-extra" data-id="${e.id}"><span>${esc(e.name)}</span><span class="r">${eur(e.amt)}</span></button>`).join('')}
      <button class="list-btn sub-row add-row" data-act="edit-extra" data-id=""><span>+ Overige inkomsten toevoegen</span><span class="r"></span></button></div>
    <div class="section-head out"><span>Uitgaven ${MONF[pm]}</span><b>−${eur(uitTot)}</b></div>
    <div class="card tight">${grp('vast', 'Vaste lasten')}${grp('overboeking', 'Overboekingen')}${grp('sparen', 'Naar spaarrekening')}</div>
    <div class="section-head"><span>Vrije ruimte ${MONF[pm]}</span><b>${eur(pl.vrij[pm])}</b></div>
    <div class="card tight">
    <div class="list-btn plain sub-row" style="border-top:0"><span>Maandbudgetten (doel · grens)</span><span class="r">${eur(pl.dd[pm])} · ${eur(pl.dg[pm])}</span></div>
    ${pl.lopDoel ? `<div class="list-btn plain sub-row"><span>Jaarbudgetten lopende rekening (÷12)</span><span class="r">${eur(pl.lopDoel / 12)}</span></div>` : ''}
    <div class="list-btn plain grp"><span>Blijft op lopende rekening</span><span class="r ${onder >= 0 ? 'pos' : 'neg'}">${eurS(onder)}</span></div></div>
    <p class="hint">Tik op een post om de bedragen per maand aan te passen.</p>
    <button class="btn" data-act="edit-line" data-id="">Post toevoegen</button>`;
  return h;
}

function renderSpaar(m) {
  let h = header('Spaarrekening', `Boekjaar ${m.y}`);
  const k0 = Math.min(Math.max(m.cur, 0), 11), lastPay = m.P[k0].start, since = m.savingsNow - m.periodStart[k0];
  h += `<div class="card"><div class="lbl">Saldo per laatste salarisdag · ${dLong(lastPay)}</div>
    <div class="big" style="margin:6px 0 4px">${eur(m.cur < 0 ? m.start : m.periodStart[k0])}</div>
    <div class="sub" style="margin-bottom:10px">Inclusief storting${m.inYear && Math.abs(since) >= 0.5 ? ` · sindsdien ${eurS(since)} → nu ${eur(m.savingsNow)}` : ''}${m.lastKas ? ` · laatst ingevoerd ${dShort(fromIso(m.lastKas.date))}` : ''}</div>
    <button class="btn primary" data-act="sheet-saldo">Saldo spaarrekening invoeren</button></div>`;
  h += `<div class="card"><div class="row"><div class="lbl">Verloop spaarrekening ${m.y}</div><span class="sub" style="font-size:12px">${eur(m.eind)} verwacht</span></div>
    ${lineChart(m)}
    <div class="legend"><span><i class="l-base"></i>prognose begin jaar</span><span><i class="l-real"></i>werkelijk</span><span><i class="l-fcl"></i>prognose</span></div></div>`;
  h += `<div class="card"><div class="lbl" style="margin-bottom:4px">Prognose 31 december</div>
    <div class="kv"><span>Startsaldo (na storting jan)</span><b>${eur(m.start)}</b></div>
    <div class="kv"><span>Stortingen feb–dec</span><b>+${eur(m.deposits)}</b></div>
    <div class="kv"><span>Rente (${String(S.settings.interest).replace('.', ',')}%)</span><b>+${eur(m.rente)}</b></div>
    <div class="kv"><span>Opgenomen</span><b>−${eur(sum(m.opn))}</b></div>
    <div class="kv"><span>Verwacht nog op te nemen</span><b>−${eur(sum(m.predOpn))}</b></div>
    <div class="kv"><span>Uitgaven van spaarrekening</span><b>−${eur(sum(m.spaarUitg))}</b></div>
    <div class="kv"><span>Verwacht nog uit jaarbudgetten</span><b>−${eur(sum(m.predSpaar))}</b></div>
    <div class="kv"><span>Kasverschil</span><b>${eurS(sum(m.kas))}</b></div>
    <div class="kv total"><span>Prognose</span><b>${eur(m.eind)}</b></div></div>`;
  h += actionsHtml(false);
  const transfer = spaarPosts().filter(p => +p.doel > 0 && !p.sys);
  if (transfer.length) h += `<div class="card tight">` + transfer.map(p => `<button class="list-btn" data-act="sheet-uitgave" data-pot="${p.id}"><span>${esc(p.name)} overmaken</span><span class="r">${m.potRem[p.id] ? 'nog ' + eur(m.potRem[p.id]) : 'gedaan'}</span></button>`).join('') + `</div>`;
  h += `<h2>Uitgegeven dit jaar</h2><div class="card tight">` + S.pots.filter(p => p.acct === 'spaar').map(p => {
    const s = m.potSpent[p.id] || 0;
    return `<button class="list-btn" data-act="edit-pot" data-id="${p.id}"><span>${esc(p.name)}</span><span class="r ${p.sys === 'kas' ? (s >= 0 ? 'pos' : 'neg') : ''}">${p.sys === 'kas' ? eurS(s) : eur(s)}${+p.doel ? ` / ${eur(p.doel)}` : ''}</span></button>`;
  }).join('') + `</div>`;
  const mv = S.moves.filter(x => fromIso(x.date).getFullYear() === m.y).sort((a, b) => b.date.localeCompare(a.date));
  h += `<h2>Mutaties ${m.y}</h2><div class="card tight">` + (mv.length ? mv.map(x => {
    const p = S.pots.find(c => c.id === x.pot);
    const title = x.kind === 'opname' ? 'Opname naar lopende rekening' : x.kind === 'kas' ? (x.saldo != null ? 'Saldo ingevoerd' : 'Kasverschil') : (p?.name || 'Uitgave');
    const sub = x.kind === 'kas' ? (x.saldo != null ? eur2(x.saldo) + ' · kasverschil' : 'kasverschil') : x.kind === 'uitgave' && p?.acct === 'lopend' ? 'van lopende rekening' : '';
    const amt = x.kind === 'kas' ? (x.amt >= 0 ? '+' : '−') + eur2(Math.abs(x.amt)) : '−' + eur2(x.amt);
    return `<div class="mv" data-act="del-move" data-id="${x.id}"><span class="dot ${x.kind === 'opname' ? 'o' : x.kind === 'kas' ? 'k' : 'u'}">${x.kind === 'opname' ? '↑' : x.kind === 'kas' ? '=' : esc((p?.name || '?')[0])}</span>
      <span class="t"><b>${esc(title)}</b><span>${dLong(fromIso(x.date))}${sub ? ' · ' + sub : ''}${x.note ? ' · ' + esc(x.note) : ''}</span></span><span class="a">${amt}</span></div>`;
  }).join('') : `<div class="empty">Nog geen mutaties</div>`) + `</div>`;
  return h;
}

function renderInstel(m) {
  const st = S.settings, P = m.P;
  let h = header('Instellingen', 'Jaarbudget');
  h += `<h2>Boekjaar</h2>
    <div class="fld-row"><label class="fld"><span>Boekjaar</span><input type="number" inputmode="numeric" data-set="year" value="${st.year}"></label>
    <label class="fld"><span>Salaris op dag</span><input type="number" inputmode="numeric" min="1" max="28" data-set="payday" value="${st.payday}"></label></div>
    <label class="fld"><span>Saldo spaarrekening na storting januari</span><input inputmode="decimal" data-set="startSavings" value="${numIn(st.startSavings)}"></label>
    <label class="fld"><span>Rente spaarrekening (% per jaar)</span><input inputmode="decimal" data-set="interest" value="${numIn(st.interest)}"></label>
    <p class="hint">Het startsaldo mag een schatting zijn; vul het exacte bedrag in zodra je het weet. Valt de salarisdag in het weekend of op een feestdag, dan geldt de werkdag ervoor.</p>
    <div class="card tight"><div class="list-btn plain grp"><span>Salarisdagen ${m.y}</span><span class="r"></span></div>
      <div class="paydays">${P.map(p => `<span class="${p.start.getDate() !== +st.payday ? 'moved' : ''}">${dLong(p.start)}</span>`).join('')}</div></div>
    <div class="card tight"><button class="list-btn" data-act="rebase"><span>Prognose begin jaar opnieuw vastzetten</span><span class="r"></span></button>
    <button class="list-btn" data-act="new-year"><span>Nieuw boekjaar starten</span><span class="r">${st.year + 1}</span></button></div>`;
  h += `<h2>Budget</h2><div class="card tight">
    <button class="list-btn" data-act="pick-budget"><span>Budget inlezen (CSV/Excel)</span><span class="r"></span></button>
    <button class="list-btn" data-act="budget-template"><span>Sjabloon downloaden</span><span class="r"></span></button>
    <button class="list-btn" data-act="budget-export"><span>Huidig budget exporteren</span><span class="r"></span></button></div>`;
  h += `<h2>Dyme</h2><div class="card tight">
    <button class="list-btn" data-act="pick-dyme"><span>Export inlezen</span><span class="r">${S.tx.length}</span></button>
    <button class="list-btn" data-act="sheet-catmap"><span>Categorieën koppelen</span><span class="r">${Object.keys(dymeCats()).length}</span></button>
    <button class="list-btn danger" data-act="clear-tx"><span>Transacties wissen</span><span class="r"></span></button></div>`;
  h += `<h2>Back-up</h2><div class="card tight">
    <button class="list-btn" data-act="backup"><span>Back-up maken</span><span class="r"></span></button>
    <button class="list-btn" data-act="pick-backup"><span>Back-up terugzetten</span><span class="r"></span></button></div>
    <p class="hint">Je gegevens staan alleen in deze app op dit toestel. Verwijder je de app van je beginscherm, dan zijn ze weg — maak dus af en toe een back-up (bijvoorbeeld naar iCloud Drive).</p>`;
  h += `<h2>Privacy</h2><div class="card prose"><p>Deze app maakt <b>geen internetverbinding</b>. Een ingebouwde beveiligingsregel blokkeert elk netwerkverkeer; er is geen server en geen account.</p>
    <button class="btn" data-act="info-prognose">Hoe werkt de prognose?</button></div>`;
  h += `<h2>Gegevens</h2><div class="card tight">
    <button class="list-btn" data-act="demo"><span>Demogegevens laden</span><span class="r"></span></button>
    <button class="list-btn danger" data-act="wipe"><span>Alles wissen</span><span class="r"></span></button></div>`;
  return h;
}

function render() {
  const m = model();
  $('#main').innerHTML = ui.tab === 'budget' ? renderBudget(m) : ui.tab === 'spaar' ? renderSpaar(m) : ui.tab === 'instel' ? renderInstel(m) : renderDash(m);
  $$('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === ui.tab));
}

/* ───────────── sheets ───────────── */
function openSheet(title, body, opts = {}) {
  $('#sheet-root').innerHTML = `<div class="backdrop" data-act="close-sheet"></div><div class="sheet" role="dialog" aria-label="${esc(title)}"><div class="grab"></div>
    <div class="sheet-head"><h3>${esc(title)}</h3><button data-act="close-sheet">${opts.closeLabel || 'Sluit'}</button></div><div id="sheet-body">${body}</div></div>`;
  const f = $('#sheet-root [autofocus]'); if (f) setTimeout(() => f.focus(), 250);
}
function closeSheet() { $('#sheet-root').innerHTML = ''; }

let movePot = null;
function potHint(p) { return p ? (p.acct === 'lopend' ? 'Betaald van je lopende rekening' : 'Gaat van je spaarrekening af') + (p.vrij ? ' · telt mee in je vrije ruimte' : '') : ''; }
function sheetMove(kind, potId) {
  const pots = S.pots.filter(p => !p.sys);
  if (kind === 'uitgave') { movePot = potId || (pots.some(p => p.id === movePot) ? movePot : pots[0]?.id); }
  const p = S.pots.find(x => x.id === movePot), m = model();
  const pre = kind === 'uitgave' && potId && p && !p.vrij && m.potRem[p.id] ? numIn(m.potRem[p.id]) : '';
  openSheet(kind === 'opname' ? 'Geld opnemen' : 'Losse uitgave', `
    <p class="hint">${kind === 'opname' ? 'Je hebt geld van je spaarrekening naar je lopende rekening overgemaakt omdat je niet uitkwam.' : 'Kies het budget of de spaarpost.'}</p>
    ${kind === 'uitgave' ? `<div class="chips">${pots.map(c => `<button data-act="pick-pot" data-id="${c.id}" class="${c.id === movePot ? 'on' : ''}">${esc(c.name)}</button>`).join('')}</div><p class="hint" id="pot-hint">${potHint(p)}</p>` : ''}
    <label class="fld"><span>Bedrag</span><input id="f-amt" class="amount" inputmode="decimal" placeholder="€ 0" value="${pre}" autofocus></label>
    <label class="fld"><span>Datum</span><input id="f-date" type="date" value="${iso(today())}"></label>
    <label class="fld"><span>Notitie</span><input id="f-note" placeholder="optioneel" maxlength="80"></label>
    <button class="btn primary" data-act="save-move" data-kind="${kind}">Opslaan</button>`);
}
function sheetSaldo() {
  const m = model();
  openSheet('Saldo spaarrekening', `
    <p class="hint">Vul het saldo in dat je nu in Trade Republic ziet. Het verschil met het berekende saldo wordt geboekt als <b>Kasverschil</b>, en de prognose rekent vanaf het echte saldo verder.</p>
    <div class="card tight"><div class="kv"><span>Berekend saldo</span><b>${eur2(m.savingsNow)}</b></div></div>
    <label class="fld"><span>Werkelijk saldo</span><input id="f-saldo" class="amount" inputmode="decimal" placeholder="€ 0" autofocus></label>
    <p class="hint" id="kas-preview"></p>
    <button class="btn primary" data-act="save-saldo">Opslaan</button>`);
}

function rangeTool(g, label) {
  const from = Math.min(Math.max(ui.planMonth ?? model().cur, 0), 11);
  const opt = sel => MON.map((n, i) => `<option value="${i}"${i === sel ? ' selected' : ''}>${n}</option>`).join('');
  return `<div class="range-tool"><span class="lbl">${label}</span><div class="rt-row">
    <input inputmode="decimal" id="rt-amt-${g}" placeholder="€ bedrag"><select id="rt-from-${g}">${opt(from)}</select><span>t/m</span><select id="rt-to-${g}">${opt(11)}</select>
    <button class="pill-btn" data-act="range-apply" data-grid="${g}">Zet</button></div></div>`;
}
function monthGrid(prefix, vals) {
  return `<div class="month-grid">${MON.map((n, i) => `<label><span>${n}</span><input inputmode="decimal" data-grid="${prefix}" data-k="${i}" value="${numIn(vals[i])}"></label>`).join('')}</div>`;
}
function sheetLine(id) {
  const l = S.lines.find(x => x.id === id) || { id: '', type: 'vast', name: '', m: z12() };
  openSheet(id ? l.name : 'Nieuwe post', `
    <label class="fld"><span>Naam</span><input id="l-name" value="${esc(l.name)}" maxlength="60"></label>
    <label class="fld"><span>Soort</span><select id="l-type">${LTYPES.map(([v, t]) => `<option value="${v}"${l.type === v ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
    <label class="fld"><span>Bedrag</span><select id="l-rest"><option value="0"${!l.rest ? ' selected' : ''}>Vaste bedragen per maand</option><option value="1"${l.rest ? ' selected' : ''}>Restpost: wat overblijft (alleen bij sparen)</option></select></label>
    ${l.rest ? `<p class="hint">Dit bedrag rekent de app elke maand zelf uit: inkomen − vaste lasten − overboekingen − overig sparen − budget vrije ruimte. Pas je een budget aan, dan verandert deze storting mee.</p>
    <div class="month-grid">${MON.map((n, i) => `<label><span>${n}</span><input disabled value="${numIn(plan().restM[i])}"></label>`).join('')}</div>` : `
    ${rangeTool('m', 'Bedrag voor meerdere maanden')}
    <div class="row" style="margin:12px 4px 8px"><span class="lbl">Bedrag per maand</span><span class="sub" style="font-size:13px">jaar <b id="grid-total-m">${eur(sum(l.m))}</b></span></div>
    ${monthGrid('m', l.m)}`}
    <button class="btn primary" data-act="save-line" data-id="${l.id}">Opslaan</button>
    ${id ? `<button class="btn danger" data-act="del-line" data-id="${l.id}">Verwijderen</button>` : ''}`);
}
function sheetDyme(id) {
  const d = S.dyme.find(x => x.id === id) || { id: '', name: '', doel: z12(), grens: z12() };
  const cats = Object.entries(S.catMap).filter(([, v]) => v === d.id).map(([c]) => c);
  openSheet(id ? d.name : 'Nieuw maandbudget', `
    <label class="fld"><span>Naam</span><input id="d-name" value="${esc(d.name)}" maxlength="60"></label>
    <div class="fld-row"><label class="fld"><span>Doel per jaar</span><input id="d-doel-j" inputmode="decimal" value="${numIn(sum(d.doel))}"></label>
    <label class="fld"><span>Grens per jaar</span><input id="d-grens-j" inputmode="decimal" value="${numIn(sum(d.grens))}"></label></div>
    <button class="btn" data-act="dyme-spread">Gelijk over 12 maanden verdelen</button>
    <div style="height:12px"></div>
    ${rangeTool('doel', 'Doel voor meerdere maanden')}${rangeTool('grens', 'Grens voor meerdere maanden')}
    <div class="row" style="margin:12px 4px 8px"><span class="lbl">Doel per maand</span><span class="sub" style="font-size:13px">jaar <b id="grid-total-doel">${eur(sum(d.doel))}</b></span></div>${monthGrid('doel', d.doel)}
    <div class="row" style="margin:12px 4px 8px"><span class="lbl">Grens per maand</span><span class="sub" style="font-size:13px">jaar <b id="grid-total-grens">${eur(sum(d.grens))}</b></span></div>${monthGrid('grens', d.grens)}
    <p class="hint">Dyme-categorieën: ${cats.length ? cats.map(esc).join(', ') : 'nog geen'} (aanpassen via Instellingen → Categorieën koppelen).</p>
    <button class="btn primary" data-act="save-dyme" data-id="${d.id}">Opslaan</button>
    ${id ? `<button class="btn danger" data-act="del-dyme" data-id="${d.id}">Verwijderen</button>` : ''}`);
}
function sheetPot(id) {
  const p = S.pots.find(x => x.id === id) || { id: '', name: '', doel: 0, grens: 0, acct: 'spaar', vrij: true };
  const kas = p.sys === 'kas';
  openSheet(id ? p.name : 'Nieuw jaarbudget', `
    <label class="fld"><span>Naam</span><input id="p-name" value="${esc(p.name)}" maxlength="40"${kas ? ' disabled' : ''}></label>
    ${kas ? `<p class="hint">Kasverschil ontstaat vanzelf wanneer je het echte saldo van je spaarrekening invoert.</p>` : `
    <div class="fld-row"><label class="fld"><span>Doel per jaar</span><input id="p-doel" inputmode="decimal" value="${+p.doel ? numIn(p.doel) : ''}"></label>
    <label class="fld"><span>Grens per jaar</span><input id="p-grens" inputmode="decimal" value="${+p.grens ? numIn(p.grens) : ''}"></label></div>
    <label class="fld"><span>Betaald van</span><select id="p-acct"><option value="spaar"${p.acct === 'spaar' ? ' selected' : ''}>Spaarrekening</option><option value="lopend"${p.acct === 'lopend' ? ' selected' : ''}>Lopende rekening</option></select></label>
    <label class="fld"><span>Hoort bij vrije ruimte</span><select id="p-vrij"><option value="1"${p.vrij ? ' selected' : ''}>Ja — jaarbudget binnen je € per maand</option><option value="0"${!p.vrij ? ' selected' : ''}>Nee — aparte spaarpost</option></select></label>
    <p class="hint">Met een doel telt het resterende bedrag mee in de prognose: verspreid over het jaar bij de vrije ruimte, in december bij een aparte spaarpost (zoals Huis). Laat leeg om alleen bij te houden.</p>
    <button class="btn primary" data-act="save-pot" data-id="${p.id}">Opslaan</button>
    ${id ? `<button class="btn danger" data-act="del-pot" data-id="${p.id}">Verwijderen</button>` : ''}`}`);
}

function sheetExtra(id) {
  const e = S.extraInc.find(x => x.id === id) || { id: '', k: ui.planMonth ?? Math.min(Math.max(model().cur, 0), 11), name: '', amt: '' };
  openSheet(id ? 'Overige inkomsten' : 'Overige inkomsten toevoegen', `
    <label class="fld"><span>Omschrijving</span><input id="e-name" value="${esc(e.name)}" placeholder="bijv. teruggave belasting" maxlength="60"></label>
    <div class="fld-row"><label class="fld"><span>Maand</span><select id="e-k">${MONF.map((n, i) => `<option value="${i}"${i === e.k ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
    <label class="fld"><span>Bedrag (netto)</span><input id="e-amt" inputmode="decimal" value="${e.amt === '' ? '' : numIn(e.amt)}" placeholder="€ 0"></label></div>
    <p class="hint">Telt mee als inkomen in die maand. Via de restpost gaat het automatisch naar je spaarrekening.</p>
    <button class="btn primary" data-act="save-extra" data-id="${e.id}">Opslaan</button>
    ${id ? `<button class="btn danger" data-act="del-extra" data-id="${e.id}">Verwijderen</button>` : ''}`);
}
function dymeCats() { const c = {}; for (const t of S.tx) { c[t.cat] = c[t.cat] || { n: 0, amt: 0, sup: t.sup }; c[t.cat].n++; c[t.cat].amt += t.amt; } return c; }
function mapOptions(sel) {
  return `<option value=""${!sel ? ' selected' : ''}>— Kies —</option><option value="__ignore"${sel === '__ignore' ? ' selected' : ''}>Negeren</option>` +
    S.dyme.map(d => `<option value="${d.id}"${sel === d.id ? ' selected' : ''}>${esc(d.name)}</option>`).join('');
}
function sheetCatmap() {
  const cats = Object.entries(dymeCats()).sort((a, b) => b[1].amt - a[1].amt);
  openSheet('Dyme-categorieën', `<p class="hint">Koppel elke Dyme-categorie aan een maandbudget. Kies ‘Negeren’ voor inkomsten, overboekingen of uitgaven die je in de app als jaarbudget bijhoudt (zoals vakantie).</p>` +
    (cats.length ? cats.map(([c, v]) => `<div class="map-row"><span class="c">${esc(c)}<small>${v.sup && v.sup !== c ? esc(v.sup) + ' · ' : ''}${v.n}× · ${eur(v.amt)}</small></span><select data-map="${esc(c)}">${mapOptions(S.catMap[c])}</select></div>`).join('')
      : '<div class="empty">Nog geen transacties ingelezen.</div>') +
    `<button class="btn primary" data-act="save-catmap">Opslaan</button>`, { closeLabel: 'Annuleer' });
}
function sheetInfo() {
  openSheet('Hoe werkt de prognose?', `<div class="prose">
    <p><b>1. Maandbudgetten (Dyme).</b> Per budget kijkt de app naar je uitgaven in de afgelopen perioden; recente maanden tellen zwaarder. Met weinig data wordt de voorspelling naar je doel getrokken, met meer data vertrouwt de app op je eigen patroon. In de lopende periode telt wat je al uitgaf plus de verwachting tot je volgende salaris.</p>
    <p><b>2. Jaarbudgetten.</b> Voor bijv. vakantie of Vinci kijkt de app half naar wat er nog in het budget zit en half naar je tempo tot nu toe (zodra een kwart van het jaar voorbij is). Aparte spaarposten met een budget (zoals Huis) verwacht de app in december.</p>
    <p><b>3. Gemiddelde als controle.</b> Daarnaast berekent de app je gemiddelde vrije uitgaven per maand (Dyme en jaarbudgetten samen) en trekt dat door naar het einde van het jaar. Wijkt dat af van de optelsom per budget, dan schuift de prognose die kant op — hoe meer maanden data, hoe zwaarder (tot maximaal de helft).</p>
    <p><b>4. Lopende rekening.</b> Per periode: vrije ruimte − Dyme − jaarbudgetten die je van je lopende rekening betaalt. Een overschot blijft op je lopende rekening staan en vangt latere tekorten op. Wordt het saldo negatief, dan rekent de app met een opname van je spaarrekening.</p>
    <p><b>5. Spaarrekening 31 december</b> = startsaldo + stortingen + rente − opnames − uitgaven van de spaarrekening ± kasverschil (gedaan en verwacht).</p>
    <p><b>6. Saldo invoeren.</b> Na elk salaris kun je het echte saldo invoeren; het verschil wordt Kasverschil en de prognose rekent vanaf het echte saldo verder.</p>
    <p><b>Bandbreedte.</b> Op basis van hoe sterk je uitgaven aan maandbudgetten schommelen (ca. 80% zekerheid).</p></div>`);
}
function confirmSheet(title, text, act) {
  openSheet(title, `<p class="hint" style="font-size:15px">${esc(text)}</p><button class="btn danger" data-act="${act}">Bevestigen</button><button class="btn" data-act="close-sheet">Annuleren</button>`);
}

/* ───────────── bestanden lezen ───────────── */
function parseCSV(text) {
  text = text.replace(/^﻿/, '');
  const first = text.split(/\r?\n/).find(l => l.trim()) || '';
  const cnt = c => first.split(c).length - 1;
  const d = [';', ',', '\t'].reduce((a, c) => cnt(c) > cnt(a) ? c : a, ';');
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === d) { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
    else f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  return rows.filter(r => r.some(x => String(x).trim() !== ''));
}
async function readXlsx(buf, wantTx) {
  const u8 = new Uint8Array(buf), dv = new DataView(buf), dec = new TextDecoder();
  let e = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 70000); i--) if (dv.getUint32(i, true) === 0x06054b50) { e = i; break; }
  if (e < 0) throw new Error('Geen geldig Excel-bestand');
  const n = dv.getUint16(e + 10, true); let off = dv.getUint32(e + 16, true); const files = {};
  for (let i = 0; i < n; i++) {
    if (dv.getUint32(off, true) !== 0x02014b50) break;
    const meth = dv.getUint16(off + 10, true), csz = dv.getUint32(off + 20, true), nl = dv.getUint16(off + 28, true),
      xl = dv.getUint16(off + 30, true), cl = dv.getUint16(off + 32, true), lo = dv.getUint32(off + 42, true);
    files[dec.decode(u8.subarray(off + 46, off + 46 + nl))] = { meth, csz, lo };
    off += 46 + nl + xl + cl;
  }
  const get = async name => {
    const f = files[name]; if (!f) return null;
    const st = f.lo + 30 + dv.getUint16(f.lo + 26, true) + dv.getUint16(f.lo + 28, true);
    const data = u8.subarray(st, st + f.csz);
    if (f.meth === 0) return dec.decode(data);
    return dec.decode(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
  };
  const xml = s => new DOMParser().parseFromString(s, 'application/xml');
  const tags = (el, t) => [...el.getElementsByTagNameNS('*', t)];
  const ss = []; const sst = await get('xl/sharedStrings.xml');
  if (sst) for (const si of tags(xml(sst), 'si')) ss.push(tags(si, 't').map(x => x.textContent).join(''));
  const sheets = Object.keys(files).filter(k => /^xl\/worksheets\/[^/]+\.xml$/.test(k)).sort((a, b) => (parseInt(a.replace(/\D/g, '')) || 0) - (parseInt(b.replace(/\D/g, '')) || 0));
  if (!sheets.length) throw new Error('Geen werkblad gevonden');
  let best = null;
  for (const sh of sheets) {
    const rows = await sheetRows(sh), hdr = (rows[0] || []).map(x => String(x).toLowerCase());
    if (!best) best = rows;
    if (hdr.some(h => /datum|date/.test(h)) && hdr.some(h => /bedrag|amount/.test(h))) { if (wantTx) return rows; }
    if (!wantTx && hdr.some(h => /soort|type/.test(h))) return rows;
  }
  return best;
  async function sheetRows(sheet) {
  const rows = [];
  for (const r of tags(xml(await get(sheet)), 'row')) {
    const row = [];
    for (const c of tags(r, 'c')) {
      const mm = (c.getAttribute('r') || '').match(/^[A-Z]+/); let col = -1;
      if (mm) { col = 0; for (const ch of mm[0]) col = col * 26 + ch.charCodeAt(0) - 64; col--; }
      const t = c.getAttribute('t'), ve = tags(c, 'v')[0]; let v;
      if (t === 's') v = ss[+(ve?.textContent)] ?? '';
      else if (t === 'inlineStr') v = tags(c, 't').map(x => x.textContent).join('');
      else if (t === 'str' || t === 'e' || t === 'b') v = ve?.textContent ?? '';
      else v = ve ? Number(ve.textContent) : '';
      row[col >= 0 ? col : row.length] = v;
    }
    for (let i = 0; i < row.length; i++) if (row[i] === undefined) row[i] = '';
    rows.push(row);
  }
  return rows.filter(r => r.some(x => String(x).trim() !== ''));
  }
}
async function readTable(file, wantTx) {
  const buf = await file.arrayBuffer(), u8 = new Uint8Array(buf);
  if (u8[0] === 0x50 && u8[1] === 0x4b) return readXlsx(buf, wantTx);
  let text = new TextDecoder('utf-8').decode(buf);
  if (text.includes('�')) text = new TextDecoder('windows-1252').decode(buf);
  return parseCSV(text);
}
function parseNum(v) {
  if (typeof v === 'number') return v;
  let s = String(v ?? '').trim().replace(/[€\s ]/g, '').replace(/^EUR/i, '').replace(/EUR$/i, '');
  if (!s) return NaN;
  let neg = false;
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
  if (/-$/.test(s)) { neg = true; s = s.slice(0, -1); }
  const lc = s.lastIndexOf(','), ld = s.lastIndexOf('.');
  if (lc > -1 && ld > -1) s = lc > ld ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  else if (lc > -1) s = (s.match(/,/g).length > 1) ? s.replace(/,/g, '') : s.replace(',', '.');
  else if (ld > -1 && ((s.match(/\./g).length > 1) || /^[-+]?\d{1,3}\.\d{3}$/.test(s))) s = s.replace(/\./g, '');
  const n = parseFloat(s);
  return isNaN(n) ? NaN : (neg ? -Math.abs(n) : n);
}
const MONNL = { jan: 0, feb: 1, mrt: 2, maa: 2, mar: 2, apr: 3, mei: 4, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, okt: 9, oct: 9, nov: 10, dec: 11 };
function mkDate(y, m, d) { if (m < 0 || m > 11 || d < 1 || d > 31) return null; const dt = D(y, m, d); return dt.getMonth() === m ? dt : null; }
function parseDate(v) {
  if (typeof v === 'number' && v > 20000 && v < 80000) { const dt = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 864e5); return D(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()); }
  const s = String(v ?? '').trim(); let m;
  if ((m = s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/))) return mkDate(+m[1], +m[2] - 1, +m[3]);
  if ((m = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})/))) { let y = +m[3]; if (y < 100) y += 2000; return mkDate(y, +m[2] - 1, +m[1]); }
  if ((m = s.match(/^(\d{4})(\d{2})(\d{2})$/))) return mkDate(+m[1], +m[2] - 1, +m[3]);
  if ((m = s.match(/^(\d{1,2})\s+([a-z]{3})[a-z.]*\s+(\d{4})/i))) { const mo = MONNL[m[2].toLowerCase()]; if (mo != null) return mkDate(+m[3], mo, +m[1]); }
  return null;
}
const guessCol = (hdr, re) => hdr.findIndex(h => re.test(String(h).toLowerCase().trim()));

/* Dyme-import */
let IMP = null;
async function onDymeFile(file) {
  try {
    const rows = await readTable(file, true);
    if (rows.length < 2) return toast('Bestand is leeg');
    const hdr = rows[0].map(x => String(x));
    IMP = { rows, hdr, sign: 'neg', map: {
      date: Math.max(0, guessCol(hdr, /datum|date/)), amt: guessCol(hdr, /^bedrag|^amount|waarde|value/), cat: guessCol(hdr, /^categor|^category/) >= 0 ? guessCol(hdr, /^categor|^category/) : guessCol(hdr, /categor/),
      sup: guessCol(hdr, /super|hoofd/),
      desc: guessCol(hdr, /tegenpartij naam|^naam|^name|merchant/) >= 0 ? guessCol(hdr, /tegenpartij naam|^naam|^name|merchant/) : guessCol(hdr, /omschrijving|beschrijving|description|tegenpartij|titel|title/) } };
    if (IMP.map.amt < 0) IMP.map.amt = Math.min(1, hdr.length - 1);
    sheetDymeMap();
  } catch (err) { toast('Kon bestand niet lezen: ' + err.message); }
}
function colSelect(key, allowNone) {
  return `<select data-impmap="${key}">${allowNone ? `<option value="-1"${IMP.map[key] < 0 ? ' selected' : ''}>— geen —</option>` : ''}` +
    IMP.hdr.map((h, i) => `<option value="${i}"${IMP.map[key] === i ? ' selected' : ''}>${esc(h || 'Kolom ' + (i + 1))}</option>`).join('') + `</select>`;
}
function rowsToTx() {
  const out = [], errs = [];
  for (const r of IMP.rows.slice(1)) {
    const dt = parseDate(r[IMP.map.date]), a = parseNum(r[IMP.map.amt]);
    if (!dt || isNaN(a)) { errs.push(r); continue; }
    const cat = (IMP.map.cat >= 0 ? String(r[IMP.map.cat] ?? '').trim() : '') || '(geen categorie)';
    const desc = IMP.map.desc >= 0 ? String(r[IMP.map.desc] ?? '').trim().slice(0, 120) : '';
    const sup = IMP.map.sup >= 0 ? String(r[IMP.map.sup] ?? '').trim() : '';
    out.push({ date: iso(dt), amt: r2(IMP.sign === 'neg' ? -a : Math.abs(a)), cat, desc, ...(sup ? { sup } : {}) });
  }
  return { out, errs };
}
function sheetDymeMap() {
  const { out, errs } = rowsToTx(), pv = out.slice(0, 4);
  openSheet('Dyme-export inlezen', `
    <p class="hint">${IMP.rows.length - 1} regels gevonden. Controleer welke kolom wat is.</p>
    <div class="map-row"><span class="c">Datum</span>${colSelect('date')}</div>
    <div class="map-row"><span class="c">Bedrag</span>${colSelect('amt')}</div>
    <div class="map-row"><span class="c">Categorie</span>${colSelect('cat', true)}</div>
    <div class="map-row"><span class="c">Omschrijving</span>${colSelect('desc', true)}</div>
    <div class="map-row"><span class="c">Hoofdcategorie</span>${colSelect('sup', true)}</div>
    <div class="map-row"><span class="c">Uitgaven zijn</span><select data-impsign="1"><option value="neg"${IMP.sign === 'neg' ? ' selected' : ''}>negatief (−)</option><option value="abs"${IMP.sign === 'abs' ? ' selected' : ''}>alle bedragen</option></select></div>
    <div class="preview"><table>${pv.map(t => `<tr><td>${t.date}</td><td>${esc(t.cat)}</td><td>${esc(t.desc.slice(0, 22))}</td><td style="text-align:right">${eur2(t.amt)}</td></tr>`).join('') || '<tr><td>Nog geen geldige regels — pas de kolommen aan.</td></tr>'}</table></div>
    <p class="hint">${out.length} geldig${errs.length ? ` · ${errs.length} overgeslagen (geen datum of bedrag)` : ''}. Positieve bedragen in een gekoppelde categorie tellen als terugbetaling.</p>
    <button class="btn primary" data-act="imp-next"${out.length ? '' : ' disabled'}>Verder</button>`, { closeLabel: 'Annuleer' });
}
const normName = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
function autoMap(cat, net) {
  const c = normName(cat);
  for (const d of S.dyme) if ((d.cats || []).some(x => normName(x) === c)) return d.id;
  const hit = S.dyme.find(d => normName(d.name) === c) || S.dyme.find(d => c && (normName(d.name).includes(c) || c.includes(normName(d.name))));
  if (hit) return hit.id;
  return net < 0 ? '__ignore' : '';
}
function sheetDymeCats() {
  const { out } = rowsToTx(); IMP.tx = out;
  const cats = {};
  for (const t of out) { cats[t.cat] = cats[t.cat] || { n: 0, amt: 0, sup: t.sup }; cats[t.cat].n++; cats[t.cat].amt += t.amt; }
  const ids = new Set(S.dyme.map(d => d.id));
  const todo = Object.entries(cats).filter(([c]) => !(S.catMap[c] === '__ignore' || ids.has(S.catMap[c])));
  if (!todo.length) return doImport({});
  openSheet('Nieuwe categorieën', `<p class="hint">Deze Dyme-categorieën ken ik nog niet. Koppel ze aan een maandbudget; dit wordt onthouden.</p>` +
    todo.sort((a, b) => b[1].amt - a[1].amt).map(([c, v]) => `<div class="map-row"><span class="c">${esc(c)}<small>${v.sup && v.sup !== c ? esc(v.sup) + ' · ' : ''}${v.n}× · ${eur(v.amt)}</small></span><select data-map="${esc(c)}">${mapOptions(autoMap(c, v.amt))}</select></div>`).join('') +
    `<button class="btn primary" data-act="imp-do">Importeren</button>`, { closeLabel: 'Annuleer' });
}
function doImport(newMap) {
  Object.assign(S.catMap, newMap);
  const key = t => `${t.date}|${t.amt}|${t.cat}|${t.desc}`;
  const have = {}; for (const t of S.tx) { const k = key(t); have[k] = (have[k] || 0) + 1; }
  const seen = {}; let add = 0, dup = 0;
  for (const t of IMP.tx) { const k = key(t); seen[k] = (seen[k] || 0) + 1; if (seen[k] > (have[k] || 0)) { S.tx.push({ ...t, id: uid() }); add++; } else dup++; }
  S.lastImport = iso(today());
  save(); IMP = null; closeSheet(); render();
  toast(`${add} nieuwe transacties${dup ? ` · ${dup} al aanwezig` : ''}`);
}

/* Budget-import. Kolommen: Soort; Categorie; Rekening; Doel; Grens; jan … dec; Dyme-categorieën */
function typeFromText(s) {
  s = String(s).toLowerCase().trim();
  if (/overig|extra/.test(s) && /inkom/.test(s)) return 'extra';
  if (/inkom|salaris|loon|bonus/.test(s)) return 'inkomen';
  if (/negeer|negeren/.test(s)) return 'ignore';
  if (/dyme|variab|maandbudget/.test(s)) return 'dyme';
  if (/jaarbudget/.test(s)) return 'pot-vrij';
  if (/spaarpost|spaarrek|losse/.test(s)) return 'pot-spaar';
  if (/^sparen.*rest|restpost/.test(s)) return 'sparen-rest';
  if (/^sparen|spaarplan/.test(s)) return 'sparen';
  if (/overb/.test(s)) return 'overboeking';
  if (/vast/.test(s)) return 'vast';
  return null;
}
async function onBudgetFile(file) {
  try {
    const rows = await readTable(file), hdr = rows[0].map(x => String(x));
    const c = { soort: guessCol(hdr, /^soort|^type/), naam: guessCol(hdr, /categor|naam|^post/), rek: guessCol(hdr, /rekening|account/),
      doel: guessCol(hdr, /^doel|richtlijn|^budget|^bedrag/), grens: guessCol(hdr, /grens|max|limiet/), dyme: guessCol(hdr, /dyme/),
      mon: MON.map(n => guessCol(hdr, new RegExp('^' + n))) };
    if (c.soort < 0 || c.naam < 0) return toast('Kolommen Soort en Categorie niet gevonden — gebruik het sjabloon');
    const lines = [], dyme = [], pots = [], extra = [], ignore = [], skip = [];
    const val = (r, i) => i >= 0 ? parseNum(r[i]) : NaN;
    for (const r of rows.slice(1)) {
      const t = typeFromText(r[c.soort]), name = String(r[c.naam] ?? '').trim();
      if (!t || !name) { if (name) skip.push(name); continue; }
      const doel = val(r, c.doel), grens = val(r, c.grens), months = c.mon.map(i => val(r, i));
      const hasMonths = months.some(v => !isNaN(v));
      if (t === 'ignore') {
        if (c.dyme >= 0) ignore.push(...String(r[c.dyme] ?? '').split('|').map(x => x.trim()).filter(Boolean));
      } else if (t === 'extra') {
        months.forEach((v, k) => { if (!isNaN(v) && v) extra.push({ id: uid(), k, name, amt: Math.abs(v) }); });
      } else if (t === 'dyme') {
        const dJ = isNaN(doel) ? 0 : Math.abs(doel), gJ = isNaN(grens) ? dJ : Math.abs(grens);
        const dM = hasMonths ? months.map(v => isNaN(v) ? 0 : Math.abs(v)) : Array(12).fill(dJ / 12);
        const sc = sum(dM) ? gJ / sum(dM) : 1;
        dyme.push({ id: uid(), name, doel: dM, grens: dM.map(v => v * sc),
          cats: c.dyme >= 0 ? String(r[c.dyme] ?? '').split(/[|]/).map(x => x.trim()).filter(Boolean) : [] });
      } else if (t.startsWith('pot')) {
        const rek = String(c.rek >= 0 ? r[c.rek] : '').toLowerCase();
        const acct = /spaar/.test(rek) ? 'spaar' : /lopend|betaal|^ing$/.test(rek.trim()) ? 'lopend' : (t === 'pot-vrij' ? 'lopend' : 'spaar');
        const dJ = isNaN(doel) ? 0 : Math.abs(doel);
        pots.push({ id: uid(), name, doel: dJ, grens: isNaN(grens) ? dJ : Math.abs(grens), acct, vrij: t === 'pot-vrij' });
      } else {
        const m = hasMonths ? months.map(v => isNaN(v) ? 0 : Math.abs(v)) : Array(12).fill(isNaN(doel) ? 0 : Math.abs(doel));
        lines.push(t === 'sparen-rest' ? { id: uid(), type: 'sparen', rest: !lines.some(x => x.rest), name, m: z12() } : { id: uid(), type: t, name, m });
      }
    }
    if (!lines.length && !dyme.length) return toast('Geen budgetregels gevonden');
    IMP = { budget: { lines, dyme, pots, extra, ignore } };
    const t = { inkomen: z12(), vast: z12(), sparen: z12(), overboeking: z12() };
    for (const l of lines) for (let k = 0; k < 12; k++) t[l.type][k] += l.m[k];
    for (const e of extra) t.inkomen[e.k] += e.amt;
    const vrijPotDoel = sum(pots.filter(p => p.vrij).map(p => p.doel)), dymeDoel = sum(dyme.map(d => sum(d.doel)));
    const hasRest = lines.some(l => l.rest);
    if (hasRest) for (let k = 0; k < 12; k++) t.sparen[k] += t.inkomen[k] - t.vast[k] - t.sparen[k] - t.overboeking[k] - (sum(dyme.map(d => d.doel[k])) + vrijPotDoel / 12);
    const vrij = t.inkomen.map((v, k) => v - t.vast[k] - t.sparen[k] - t.overboeking[k]);
    const suggestY = today().getMonth() >= 9 ? today().getFullYear() + 1 : today().getFullYear();
    openSheet('Budget inlezen', `<div class="card tight">
      <div class="kv"><span>Inkomen${extra.length ? ` (incl. ${extra.length}× overige inkomsten)` : ''}</span><b>${eur(sum(t.inkomen))}</b></div>
      <div class="kv"><span>Vaste lasten</span><b>${eur(sum(t.vast))}</b></div>
      <div class="kv"><span>Overboekingen</span><b>${eur(sum(t.overboeking))}</b></div>
      <div class="kv"><span>Naar spaarrekening${hasRest ? ' (incl. restpost)' : ''}</span><b>${eur(sum(t.sparen))}</b></div>
      <div class="kv total"><span>Vrije ruimte</span><b>${eur(sum(vrij))}</b></div>
      <div class="kv"><span>Maandbudgetten (${dyme.length})</span><b>${eur(dymeDoel)}</b></div>
      <div class="kv"><span>Jaarbudgetten (${pots.filter(p => p.vrij).length})</span><b>${eur(vrijPotDoel)}</b></div>
      ${ignore.length ? `<div class="kv"><span>Dyme-categorieën negeren</span><b>${ignore.length}</b></div>` : ''}
      <div class="kv"><span>Spaarposten (${pots.filter(p => !p.vrij).length})</span><b>${eur(sum(pots.filter(p => !p.vrij).map(p => p.doel)))}</b></div></div>
      ${Math.abs(sum(vrij) - dymeDoel - vrijPotDoel) > 1 ? `<p class="hint wrn">Let op: vrije ruimte en budgetten verschillen ${eurS(sum(vrij) - dymeDoel - vrijPotDoel)}.</p>` : ''}
      ${skip.length ? `<p class="hint">Overgeslagen: ${skip.map(esc).join(', ')}</p>` : ''}
      <label class="fld"><span>Boekjaar</span><input id="b-year" type="number" inputmode="numeric" value="${suggestY}"></label>
      <p class="hint">Je huidige budget wordt vervangen. Dyme-transacties, koppelingen en mutaties blijven bewaard.</p>
      <button class="btn primary" data-act="budget-do">Budget inlezen</button>`, { closeLabel: 'Annuleer' });
  } catch (err) { toast('Kon bestand niet lezen: ' + err.message); }
}
function budgetCsv(rowsIn) {
  const head = ['Soort', 'Categorie', 'Rekening', 'Doel', 'Grens', ...MON, 'Dyme-categorieën'];
  const f = v => v === '' || v == null ? '' : String(Math.round(v * 100) / 100).replace('.', ',');
  return '﻿' + [head, ...rowsIn].map(r => r.map(x => typeof x === 'number' ? f(x) : String(x ?? '')).join(';')).join('\r\n') + '\r\n';
}
function exportBudgetRows() {
  const T = { inkomen: 'Inkomen', vast: 'Vast', sparen: 'Sparen', overboeking: 'Overboeking' };
  return [...S.lines.map(l => l.rest ? ['Sparen (rest)', l.name, '', '', '', ...Array(12).fill(''), ''] : [T[l.type], l.name, '', '', '', ...l.m, '']),
    ...S.dyme.map(d => ['Dyme', d.name, '', sum(d.doel), sum(d.grens), ...d.doel, Object.entries(S.catMap).filter(([, v]) => v === d.id).map(([c]) => c).join('|')]),
    ...(Object.values(S.catMap).includes('__ignore') ? [['Negeren', 'Dyme-categorieën die niet meetellen', '', '', '', ...Array(12).fill(''), Object.entries(S.catMap).filter(([, v]) => v === '__ignore').map(([c]) => c).join('|')]] : []),
    ...S.extraInc.map(e => ['Overige inkomsten', e.name, '', '', '', ...MON.map((_, k) => k === e.k ? e.amt : ''), '']),
    ...S.pots.filter(p => !p.sys).map(p => [p.vrij ? 'Jaarbudget' : 'Spaarpost', p.name, p.acct === 'lopend' ? 'Lopende rekening' : 'Spaarrekening', +p.doel || '', +p.grens || '', ...Array(12).fill(''), ''])];
}
function templateCsv() {
  const e = Array(12).fill('');
  return budgetCsv([
    ['Inkomen', 'Salaris', '', '', '', ...Array(12).fill(3200), ''],
    ['Inkomen', 'Bonussen', '', '', '', '', '', '', '', 2000, '', '', '', '', '', '', '', ''],
    ['Overige inkomsten', 'Teruggave belasting', '', '', '', '', '', '', '', '', '', 450, '', '', '', '', '', ''],
    ['Vast', 'Zorgverzekering', '', 150, '', ...e, ''],
    ['Overboeking', 'Gezamenlijke rekening', '', 1100, '', ...e, ''],
    ['Overboeking', 'Beleggen', '', 300, '', ...e, ''],
    ['Sparen (rest)', 'Spaarrekening', '', '', '', ...e, ''],
    ['Dyme', 'Uit eten en drinken', '', 2000, 2800, ...e, 'Uit eten|Bar'],
    ['Dyme', 'Kleding en schoenen', '', 900, 1200, ...e, 'Kleding'],
    ['Jaarbudget', 'Vakantie en reizen', 'Spaarrekening', 2400, 3300, ...e, ''],
    ['Jaarbudget', 'Kapper', 'Lopende rekening', 300, 300, ...e, ''],
    ['Spaarpost', 'Gezamenlijke rekening (extra)', 'Spaarrekening', '', '', ...e, ''],
    ['Spaarpost', 'Huis', 'Spaarrekening', 5000, '', ...e, '']]);
}

/* ───────────── downloaden / delen ───────────── */
async function saveFile(name, text, type) {
  const file = new File([text], name, { type });
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file] }); return; } }
  catch (e) { if (e.name === 'AbortError') return; }
  const url = URL.createObjectURL(file), a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* ───────────── demo (fictieve gegevens) ───────────── */
function demo() {
  const T = today(), y = T.getFullYear();
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  S = defaultState(); S.demo = true; S.settings.year = y; S.settings.startSavings = 7000;
  const L = (type, name, m) => ({ id: uid(), type, name, m: Array.isArray(m) ? m : Array(12).fill(m) });
  S.lines = [L('inkomen', 'Salaris', 3300), L('inkomen', 'Bonussen', [0, 0, 0, 0, 1900, 0, 0, 0, 0, 0, 0, 0]),
    L('vast', 'Zorgverzekering', 150), L('vast', 'Abonnementen', 60), L('vast', 'Auto', 120),
    L('overboeking', 'Gezamenlijke rekening', 1100), L('overboeking', 'Beleggen', 300),
    L('sparen', 'Spaarrekening', [850, 850, 850, 850, 2750, 850, 850, 850, 850, 850, 850, 850]), L('sparen', 'Huis', 300)];
  const Dm = (name, dJ, gJ, cats) => ({ id: uid(), name, doel: Array(12).fill(r2(dJ / 12)), grens: Array(12).fill(r2(gJ / 12)), cats });
  S.dyme = [Dm('Uit eten en drinken', 2000, 2800, ['Uit eten', 'Bar & café']), Dm('Vrije tijd', 800, 1150, ['Vrije tijd']), Dm('Kleding en schoenen', 700, 1000, ['Kleding']),
    Dm('Overig', 600, 850, ['Overig']), Dm('Cadeaus en verjaardagen', 600, 850, ['Cadeaus'])];
  for (const d of S.dyme) for (const c of d.cats) S.catMap[c] = d.id;
  S.catMap['Inkomen'] = '__ignore';
  S.pots = [{ id: uid(), name: 'Vakantie en reizen', doel: 1500, grens: 2200, acct: 'spaar', vrij: true },
    { id: uid(), name: 'Kapper', doel: 300, grens: 300, acct: 'lopend', vrij: true },
    { id: uid(), name: 'Huisdier', doel: 400, grens: 400, acct: 'lopend', vrij: true },
    { id: 'gez', name: 'Gezamenlijke rekening (extra)', doel: 0, grens: 0, acct: 'spaar', vrij: false },
    { id: 'cap', name: 'Belegging/Capex', doel: 0, grens: 0, acct: 'spaar', vrij: false },
    { id: uid(), name: 'Huis', doel: 3600, grens: 3600, acct: 'spaar', vrij: false }, { ...KAS }];
  const shops = { 'Uit eten': ['Restaurant De Kade', 'Lunchroom Lot'], 'Bar & café': ['Café De Zwaan'], 'Vrije tijd': ['Pathé', 'Museum'], 'Kleding': ['COS', 'Uniqlo'], 'Overig': ['HEMA', 'Action'], 'Cadeaus': ['Boekhandel', 'Bijenkorf'] };
  const P = periods(y), cur = periodOf(P, T);
  for (let k = 0; k <= Math.min(cur, 11); k++) {
    const p = P[k], last = k === cur ? T : p.end, span = dayDiff(p.start, last) + 1, mood = 0.8 + rnd() * 0.6;
    for (const d of S.dyme) {
      const tot = d.doel[k] * mood * (0.6 + rnd() * 0.8) * (span / p.days), n = 2 + Math.floor(rnd() * 5);
      for (let i = 0; i < n; i++) { const c = d.cats[Math.floor(rnd() * d.cats.length)]; S.tx.push({ id: uid(), date: iso(addDays(p.start, Math.floor(rnd() * span))), amt: r2(tot / n * (0.5 + rnd())), cat: c, desc: shops[c][Math.floor(rnd() * shops[c].length)] }); }
    }
  }
  const pot = n => S.pots.find(p => p.name === n).id;
  const mv = (kind, mo, d, amt, potN, note) => { const dt = D(y, mo, d); if (dt <= T) S.moves.push({ id: uid(), kind, date: iso(dt), amt, pot: potN ? pot(potN) : undefined, note: note || '' }); };
  mv('uitgave', 4, 20, 640, 'Vakantie en reizen', 'Weekend weg'); mv('uitgave', 7, 2, 980, 'Vakantie en reizen', 'Zomervakantie');
  for (let k = 1; k < 12; k += 2) mv('uitgave', k, 20, 50, 'Kapper'); for (let k = 0; k < 12; k++) mv('uitgave', k, 3, 33, 'Huisdier');
  mv('uitgave', 2, 10, 450, 'Belegging/Capex', 'Nieuwe fiets'); mv('opname', 6, 10, 250); mv('opname', 8, 12, 150);
  const k0 = Math.max(1, Math.min(cur - 1, 11)); if (cur > 1) S.moves.push({ id: uid(), kind: 'kas', date: iso(P[k0].start), amt: -23.4, note: '' });
  S.lastImport = iso(T);
}

/* ───────────── acties ───────────── */
const val = id => $(id)?.value ?? '';
const gridVals = g => { const v = z12(); $$(`[data-grid="${g}"]`).forEach(i => { const n = parseNum(i.value); v[+i.dataset.k] = isNaN(n) ? 0 : Math.abs(n); }); return v; };
const ACT = {
  tab: el => { ui.tab = el.dataset.tab; ui.sel = null; closeSheet(); render(); window.scrollTo(0, 0); },
  'close-sheet': () => { closeSheet(); IMP = null; },
  'sheet-opname': () => sheetMove('opname'),
  'sheet-uitgave': el => sheetMove('uitgave', el.dataset.pot),
  'sheet-saldo': () => sheetSaldo(),
  'pick-pot': el => { movePot = el.dataset.id; $$('.chips button').forEach(b => b.classList.toggle('on', b === el)); const h = $('#pot-hint'); if (h) h.textContent = potHint(S.pots.find(p => p.id === movePot)); },
  'save-move': el => {
    const amt = parseNum(val('#f-amt')), date = val('#f-date'), kind = el.dataset.kind;
    if (!(amt > 0)) return toast('Vul een bedrag in'); if (!date) return toast('Vul een datum in');
    S.moves.push({ id: uid(), kind, date, amt: r2(amt), note: val('#f-note').trim(), ...(kind === 'uitgave' ? { pot: movePot } : {}) });
    save(); closeSheet(); render(); toast(kind === 'opname' ? 'Opname opgeslagen' : 'Uitgave opgeslagen');
  },
  'save-saldo': () => {
    const v = parseNum(val('#f-saldo')); if (isNaN(v)) return toast('Vul het saldo in');
    const diff = r2(v - model().savingsNow);
    S.moves.push({ id: uid(), kind: 'kas', date: iso(today()), amt: diff, saldo: r2(v), note: '' });
    save(); closeSheet(); render(); toast(Math.abs(diff) < 0.005 ? 'Saldo klopt precies' : `Kasverschil ${diff > 0 ? '+' : '−'}${eur2(Math.abs(diff))} geboekt`);
  },
  'del-move': el => {
    const x = S.moves.find(m => m.id === el.dataset.id); if (!x) return;
    const p = S.pots.find(c => c.id === x.pot);
    openSheet('Mutatie', `<div class="card tight"><div class="kv"><span>${x.kind === 'opname' ? 'Opname' : x.kind === 'kas' ? 'Kasverschil' : esc(p?.name || '')}</span><b>${eur2(x.amt)}</b></div><div class="kv"><span>Datum</span><b>${dLong(fromIso(x.date))}</b></div>${x.note ? `<div class="kv"><span>Notitie</span><b>${esc(x.note)}</b></div>` : ''}</div>
      <button class="btn danger" data-act="del-move-do" data-id="${x.id}">Verwijderen</button>`);
  },
  'del-move-do': el => { S.moves = S.moves.filter(m => m.id !== el.dataset.id); save(); closeSheet(); render(); toast('Verwijderd'); },
  'chart-sel': el => { const k = +el.dataset.k; ui.sel = ui.sel === k ? null : k; render(); },
  budmode: el => { ui.budMode = el.dataset.mode; render(); },
  'plan-month': el => { ui.planMonth = +el.dataset.k; render(); },
  'edit-line': el => sheetLine(el.dataset.id),
  'range-apply': el => {
    const g = el.dataset.grid, v = parseNum(val('#rt-amt-' + g)); if (isNaN(v)) return toast('Vul een bedrag in');
    let a = +val('#rt-from-' + g), b = +val('#rt-to-' + g); if (a > b) [a, b] = [b, a];
    $$(`[data-grid="${g}"]`).forEach(i => { const k = +i.dataset.k; if (k >= a && k <= b) { i.value = numIn(Math.abs(v)); i.classList.add('flash'); setTimeout(() => i.classList.remove('flash'), 600); } });
    updateGridTotal(g); toast(`${MON[a]} t/m ${MON[b]} aangepast — vergeet niet op te slaan`);
  },
  'grid-fill': el => { const g = $$(`[data-grid="${el.dataset.grid}"]`); g.forEach(i => { i.value = g[0].value; }); updateGridTotal(el.dataset.grid); },
  'save-line': el => {
    const name = val('#l-name').trim(); if (!name) return toast('Vul een naam in');
    const l = S.lines.find(x => x.id === el.dataset.id), type = val('#l-type'), rest = val('#l-rest') === '1' && type === 'sparen';
    const data = { name, type, rest, m: $('[data-grid="m"]') ? gridVals('m') : (l ? l.m : z12()) };
    if (rest) S.lines.forEach(x => { if (x !== l) x.rest = false; });
    if (l) Object.assign(l, data); else S.lines.push({ id: uid(), ...data });
    save(); closeSheet(); render(); toast('Opgeslagen');
  },
  'del-line': el => { S.lines = S.lines.filter(l => l.id !== el.dataset.id); save(); closeSheet(); render(); },
  'edit-dyme': el => sheetDyme(el.dataset.id),
  'edit-extra': el => sheetExtra(el.dataset.id),
  'save-extra': el => {
    const name = val('#e-name').trim() || 'Overige inkomsten', amt = parseNum(val('#e-amt')), k = +val('#e-k');
    if (isNaN(amt)) return toast('Vul een bedrag in');
    const e = S.extraInc.find(x => x.id === el.dataset.id);
    if (e) Object.assign(e, { name, amt: r2(amt), k }); else S.extraInc.push({ id: uid(), name, amt: r2(amt), k });
    ui.planMonth = k; save(); closeSheet(); render(); toast('Opgeslagen');
  },
  'del-extra': el => { S.extraInc = S.extraInc.filter(x => x.id !== el.dataset.id); save(); closeSheet(); render(); },
  'dyme-spread': () => {
    const d = parseNum(val('#d-doel-j')), g = parseNum(val('#d-grens-j'));
    if (!isNaN(d)) $$('[data-grid="doel"]').forEach(i => { i.value = numIn(d / 12); });
    if (!isNaN(g)) $$('[data-grid="grens"]').forEach(i => { i.value = numIn(g / 12); });
    updateGridTotal('doel'); updateGridTotal('grens');
  },
  'save-dyme': el => {
    const name = val('#d-name').trim(); if (!name) return toast('Vul een naam in');
    const doel = gridVals('doel'), grens = gridVals('grens').map((g, k) => Math.max(g, doel[k]));
    const d = S.dyme.find(x => x.id === el.dataset.id);
    if (d) Object.assign(d, { name, doel, grens }); else S.dyme.push({ id: uid(), name, doel, grens, cats: [] });
    save(); closeSheet(); render(); toast('Opgeslagen');
  },
  'del-dyme': el => { S.dyme = S.dyme.filter(d => d.id !== el.dataset.id); save(); closeSheet(); render(); },
  'edit-pot': el => sheetPot(el.dataset.id),
  'save-pot': el => {
    const name = val('#p-name').trim(); if (!name) return toast('Vul een naam in');
    const d = parseNum(val('#p-doel')), g = parseNum(val('#p-grens')), doel = isNaN(d) ? 0 : Math.abs(d);
    const data = { name, doel, grens: isNaN(g) ? doel : Math.max(doel, Math.abs(g)), acct: val('#p-acct'), vrij: val('#p-vrij') === '1' };
    const p = S.pots.find(x => x.id === el.dataset.id);
    if (p) Object.assign(p, data); else S.pots.splice(S.pots.length - 1, 0, { id: uid(), ...data });
    save(); closeSheet(); render(); toast('Opgeslagen');
  },
  'del-pot': el => {
    if (S.moves.some(m => m.pot === el.dataset.id)) return toast('Er staan nog mutaties op deze post');
    S.pots = S.pots.filter(p => p.id !== el.dataset.id); save(); closeSheet(); render();
  },
  'sheet-catmap': () => sheetCatmap(),
  'save-catmap': () => { $$('[data-map]').forEach(s => { if (s.value) S.catMap[s.dataset.map] = s.value; else delete S.catMap[s.dataset.map]; }); save(); closeSheet(); render(); toast('Koppelingen opgeslagen'); },
  'pick-dyme': () => $('#file-dyme').click(),
  'pick-budget': () => $('#file-budget').click(),
  'pick-backup': () => $('#file-backup').click(),
  'imp-next': () => sheetDymeCats(),
  'imp-do': () => { const nm = {}; $$('[data-map]').forEach(s => { if (s.value) nm[s.dataset.map] = s.value; }); doImport(nm); },
  'budget-do': () => {
    const { lines, dyme, pots, extra, ignore } = IMP.budget, yr = parseInt(val('#b-year'), 10);
    if (S.demo) { S = defaultState(); }
    // bestaande ids behouden (op naam), zodat mutaties en Dyme-koppelingen blijven kloppen
    const byName = (arr, n) => arr.find(x => normName(x.name) === normName(n));
    for (const d of dyme) { const ex = byName(S.dyme, d.name); if (ex) d.id = ex.id; }
    const keepPots = S.pots.filter(p => p.sys || S.moves.some(m => m.pot === p.id));
    for (const p of pots) { const ex = byName(S.pots, p.name); if (ex && !ex.sys) p.id = ex.id; }
    for (const p of keepPots) if (!pots.some(x => x.id === p.id)) pots.push(p);
    for (const p of [{ id: 'gez', name: 'Gezamenlijke rekening (extra)' }, { id: 'cap', name: 'Belegging/Capex' }]) if (!pots.some(x => normName(x.name) === normName(p.name))) pots.push({ ...p, doel: 0, grens: 0, acct: 'spaar', vrij: false });
    pots.sort((a, b) => (a.sys ? 1 : 0) - (b.sys ? 1 : 0) || (b.vrij - a.vrij));
    S.lines = lines; S.dyme = dyme; S.pots = pots; S.extraInc = extra || []; S.baseline = null;
    for (const d of dyme) for (const c of d.cats || []) S.catMap[c] = d.id;
    for (const c of ignore || []) S.catMap[c] = '__ignore';
    if (yr > 2000 && yr < 2100) S.settings.year = yr;
    IMP = null; save(); closeSheet(); ui.tab = 'budget'; ui.budMode = 'jaar'; render(); toast('Budget ingelezen');
  },
  'budget-template': () => saveFile('jaarbudget-sjabloon.csv', templateCsv(), 'text/csv'),
  'budget-export': () => saveFile(`jaarbudget-${S.settings.year}.csv`, budgetCsv(exportBudgetRows()), 'text/csv'),
  backup: () => saveFile(`jaarbudget-backup-${iso(today())}.json`, JSON.stringify(S), 'application/json'),
  'info-prognose': () => sheetInfo(),
  demo: () => { if ((S.lines.length || S.dyme.length) && !S.demo) return confirmSheet('Demogegevens laden?', 'Je eigen gegevens worden vervangen. Maak eerst een back-up.', 'demo-do'); ACT['demo-do'](); },
  'demo-do': () => { demo(); save(); closeSheet(); ui.tab = 'dash'; render(); toast('Demo geladen'); },
  wipe: () => confirmSheet('Alles wissen?', S.demo ? 'De demogegevens worden verwijderd.' : 'Al je budgetten, transacties en mutaties worden van dit toestel verwijderd.', 'wipe-do'),
  'wipe-do': () => { S = defaultState(); save(); closeSheet(); ui.tab = 'dash'; render(); toast('Gewist'); },
  'clear-tx': () => confirmSheet('Transacties wissen?', 'Alle ingelezen Dyme-transacties worden verwijderd. Budgetten, koppelingen en mutaties blijven.', 'clear-tx-do'),
  'clear-tx-do': () => { S.tx = []; S.lastImport = null; save(); closeSheet(); render(); toast('Transacties gewist'); },
  rebase: () => confirmSheet('Prognose begin jaar vastzetten?', 'De lijn "prognose begin jaar" in de grafiek wordt vervangen door je huidige plan.', 'rebase-do'),
  'rebase-do': () => { S.baseline = null; model(); save(); closeSheet(); render(); toast('Vastgezet'); },
  'new-year': () => confirmSheet(`Boekjaar ${S.settings.year + 1} starten?`, 'De prognose voor 31 december wordt het voorlopige startsaldo; pas het aan zodra je het echte saldo weet. Je budget blijft staan; lees daarna je nieuwe budget in of pas het aan.', 'new-year-do'),
  'new-year-do': () => { const m = model(); S.settings.startSavings = r2(m.eind + (plan().sparen[0] || 0)); S.settings.year += 1; S.baseline = null; save(); closeSheet(); render(); toast(`Boekjaar ${S.settings.year}`); }
};
function updateGridTotal(g) { const t = $(`#grid-total-${g}`); if (t) t.textContent = eur(sum(gridVals(g))); const j = $(`#d-${g}-j`); if (j && (g === 'doel' || g === 'grens') && document.activeElement !== j) j.value = numIn(sum(gridVals(g))); }

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
  const f = ACT[el.dataset.act]; if (f) { e.preventDefault(); f(el, e); }
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.grid) updateGridTotal(t.dataset.grid);
  if (t.id === 'f-saldo') { const v = parseNum(t.value), p = $('#kas-preview'); if (p) p.textContent = isNaN(v) ? '' : `Kasverschil: ${eurS(v - model().savingsNow)}`; }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.set) {
    const k = t.dataset.set; let v;
    if (k === 'startSavings' || k === 'interest') { v = parseNum(t.value); if (isNaN(v)) v = 0; }
    else { v = parseInt(t.value, 10); if (isNaN(v)) return; if (k === 'payday') v = Math.min(28, Math.max(1, v)); }
    S.settings[k] = v; save(); render(); return;
  }
  if (t.dataset.impmap) { IMP.map[t.dataset.impmap] = +t.value; sheetDymeMap(); return; }
  if (t.dataset.impsign) { IMP.sign = t.value; sheetDymeMap(); return; }
  if (t.id === 'file-dyme' && t.files[0]) { onDymeFile(t.files[0]); t.value = ''; }
  if (t.id === 'file-budget' && t.files[0]) { onBudgetFile(t.files[0]); t.value = ''; }
  if (t.id === 'file-backup' && t.files[0]) {
    t.files[0].text().then(txt => {
      const s = JSON.parse(txt);
      if (!s || s.version !== 2 || !Array.isArray(s.lines)) throw new Error('onbekend formaat');
      S = normalize(s); save(); render(); toast('Back-up teruggezet');
    }).catch(err => toast('Back-up ongeldig: ' + err.message));
    t.value = '';
  }
});

let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }
document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });

render();
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
window.__jb = { parseNum, parseDate, model, periods, payday, plan, get S() { return S; } };
})();
