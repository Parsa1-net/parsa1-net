const $ = s => document.querySelector(s);
const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const LV = { easy: ['آسان', 10], mid: ['متوسط', 20], adv: ['پیشرفته', 35], pro: ['حرفه‌ای', 50] };
const EX = RAW.map((r, i) => ({ id: i + 1, lv: r[0], title: r[1], desc: r[2], sig: r[3], tests: r[4].split('|') }));
const FREE = `# محیط آزاد: هر کدی که می‌خواهی اجرا کن (Ctrl+Enter)
import math
from collections import Counter

student = {"name": "Parsa", "scores": [18, 20, 17]}
for s in student["scores"]:
    print("نمره:", s)

while True:
    break
print(Counter("mountain"), math.sqrt(144))
`;

/* ───────── رنگ‌آمیزی کد ───────── */
const K1 = new Set(['import', 'from', 'as']);
const K2 = new Set(['for', 'while']);
const K3 = new Set('def class return if elif else try except finally with lambda in not and or is pass break continue yield raise global nonlocal del assert async await None True False'.split(' '));
const RE = /(#.*)|("""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|[rRbBfFuU]{0,2}"(?:\\.|[^"\\\n])*"?|[rRbBfFuU]{0,2}'(?:\\.|[^'\\\n])*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)|([()\[\]])|([{}])|([\s\S])/g;
function highlight(src) {
  return src.replace(RE, (m, c, s, n, id, br, cb) => {
    const e = esc(m);
    if (c) return `<i class=c>${e}</i>`;
    if (s) return `<i class=s>${e}</i>`;
    if (n) return `<i class=n>${e}</i>`;
    if (id) {
      if (id === 'print') return `<i class=p>${e}</i>`;
      if (K1.has(id)) return `<i class=k1>${e}</i>`;
      if (K2.has(id)) return `<i class=k2>${e}</i>`;
      if (K3.has(id)) return `<i class=k3>${e}</i>`;
      return e;
    }
    if (br) return `<i class=b>${e}</i>`;
    if (cb) return `<i class=d>${e}</i>`;
    return e;
  });
}

/* ───────── ذخیره‌سازی کاربران (مرورگر) ───────── */
const DB = { get users() { return JSON.parse(localStorage.pp_users || '{}'); }, save(u) { localStorage.pp_users = JSON.stringify(u); } };
let me = localStorage.pp_session || null;
if (me && !DB.users[me]) me = null;
const pts = u => Object.values(u.solved).reduce((a, b) => a + b, 0);
const mem = {};
function patch(fn) { if (!me) return; const u = DB.users; fn(u[me]); DB.save(u); }
async function sha(s) {
  if (crypto.subtle) return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(b => b.toString(16).padStart(2, '0')).join('');
  return btoa(unescape(encodeURIComponent(s)));
}

/* ───────── حالت برنامه ───────── */
let cur = EX[0], filter = 'all';
const starter = e => e ? `def ${e.sig}:\n    # کد خود را اینجا بنویسید\n    pass\n` : FREE;
const getDraft = id => (me ? DB.users[me].drafts[id] : mem[id]);
function setDraft(id, v) { if (me) patch(u => u.drafts[id] = v); else mem[id] = v; }

function renderFilters() {
  $('#filters').innerHTML = [['all', 'همه']].concat(Object.entries(LV).map(([k, v]) => [k, v[0]]))
    .map(([k, t]) => `<button class="${filter === k ? 'on' : ''}" data-f="${k}">${t}</button>`).join('');
}
function renderList() {
  const solved = me ? DB.users[me].solved : {};
  $('#list').innerHTML = `<li data-id="0" class="${cur === null ? 'sel' : ''}"><span>محیط آزاد</span><em class="lv free">پلی‌گراند</em></li>` +
    EX.filter(e => filter === 'all' || e.lv === filter).map(e =>
      `<li data-id="${e.id}" class="${cur && cur.id === e.id ? 'sel' : ''}"><span>${solved[e.id] ? '✓ ' : ''}${e.title}</span><em class="lv ${e.lv}">${LV[e.lv][0]}</em></li>`).join('');
}
function renderProblem() {
  if (!cur) { $('#problem').innerHTML = `<h2>محیط آزاد</h2><p>هر کد پایتونی بنویس و اجرا کن. کتابخانه‌های استاندارد، numpy، pandas و بسیاری از بسته‌های دیگر پشتیبانی می‌شوند. برای <code>input()</code> مقدارها را در کادر «ورودی» بنویس (هر خط یک مقدار).</p>`; return; }
  const solved = me && DB.users[me].solved[cur.id];
  $('#problem').innerHTML = `<h2>${cur.id}. ${cur.title} <em class="lv ${cur.lv}">${LV[cur.lv][0]} · ${LV[cur.lv][1]} امتیاز</em>${solved ? '<em class="lv done">حل شده ✓</em>' : ''}</h2>
  <p>${cur.desc}</p><p>تابع: <code>${cur.sig}</code></p>
  <div class="ex">${cur.tests.slice(0, 2).map(t => `<code>${esc(t)}</code>`).join('')}</div>`;
}
function select(id) {
  if (cur !== undefined) setDraft(cur ? cur.id : 0, $('#code').value);
  cur = id ? EX[id - 1] : null;
  $('#code').value = getDraft(cur ? cur.id : 0) ?? starter(cur);
  $('#out').innerHTML = '';
  renderList(); renderProblem(); paint();
  document.body.classList.remove('menu');
}
function refresh() {
  const u = me && DB.users[me];
  $('#score').textContent = u ? pts(u) : 0;
  $('#userBtn').textContent = u ? '👤 ' + me : 'ورود / ثبت‌نام';
  renderFilters(); renderList(); renderProblem();
}

/* ───────── ادیتور ───────── */
const ta = $('#code');
function paint() {
  $('#hl').innerHTML = highlight(ta.value) + '\n';
  $('#gutter').innerHTML = ta.value.split('\n').map((_, i) => i + 1).join('<br>');
  sync();
}
function sync() { $('#hl').scrollTop = ta.scrollTop; $('#hl').scrollLeft = ta.scrollLeft; $('#gutter').scrollTop = ta.scrollTop; }
ta.addEventListener('input', () => { paint(); clearTimeout(ta.t); ta.t = setTimeout(() => setDraft(cur ? cur.id : 0, ta.value), 400); });
ta.addEventListener('scroll', sync);
ta.addEventListener('keydown', e => {
  const a = ta.selectionStart, b = ta.selectionEnd, v = ta.value;
  const put = (t, caret) => { ta.setRangeText(t, a, b, 'end'); if (caret != null) ta.selectionStart = ta.selectionEnd = caret; paint(); };
  if (e.key === 'Tab') { e.preventDefault(); put('    '); }
  else if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); $('#run').click(); }
  else if (e.key === 'Enter') {
    e.preventDefault();
    const line = v.slice(v.lastIndexOf('\n', a - 1) + 1, a);
    const ind = line.match(/^ */)[0] + (/:\s*$/.test(line) ? '    ' : '');
    put('\n' + ind);
  } else if ({ '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" }[e.key] && a === b) {
    e.preventDefault(); put(e.key + { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" }[e.key], a + 1);
  }
});

/* ───────── اجرا ───────── */
let W, ready = false, pending = null;
const status = t => $('#status').textContent = t;
function busy(b) { $('#run').disabled = $('#test').disabled = b; $('#stop').disabled = !b; }
function boot() {
  ready = false; busy(true); $('#stop').disabled = true; status('در حال بارگذاری مفسر پایتون… (بار اول چند ثانیه طول می‌کشد)');
  W = new Worker('js/worker.js');
  W.onmessage = ({ data: d }) => {
    if (d.type === 'ready') { ready = true; busy(false); status('پایتون آماده است ✓'); }
    else if (d.type === 'status') status(d.text);
    else if (d.type === 'done') { busy(false); status('پایان اجرا'); pending && pending(d); pending = null; }
  };
  W.onerror = () => status('خطا در بارگذاری مفسر؛ اتصال اینترنت را بررسی کن.');
}
function exec(mode) {
  if (!ready) return Promise.resolve(null);
  busy(true); setDraft(cur ? cur.id : 0, ta.value);
  return new Promise(r => { pending = r; W.postMessage({ mode, code: ta.value, stdin: $('#stdin').value, tests: cur ? cur.tests : [] }); });
}
const show = d => $('#out').innerHTML = esc(d.out || '') + (d.err ? `<span class="err">${esc(d.err)}</span>` : '');

$('#run').onclick = async () => { const d = await exec('run'); if (d) show(d); };
$('#stop').onclick = () => { W.terminate(); pending && pending({ out: '', err: 'اجرا متوقف شد.' }); show({ err: 'اجرا متوقف شد.' }); boot(); };
$('#reset').onclick = () => { if (confirm('کد به حالت اولیه برگردد؟')) { ta.value = starter(cur); setDraft(cur ? cur.id : 0, ta.value); paint(); } };
$('#test').onclick = async () => {
  if (!cur) return show({ err: 'برای ثبت امتیاز یکی از تمرین‌ها را انتخاب کن.' });
  if (!me) { authUI('login'); return; }
  const d = await exec('test'); if (!d) return;
  if (!d.results) return show(d);
  const ok = d.results.filter(r => r[1]).length, all = d.results.length;
  let h = (d.out ? esc(d.out) + '\n' : '') + d.results.map(([t, o, i]) => o ? `<span class="ok">✔ ${esc(t)}</span>` : `<span class="err">✘ ${esc(t)}${i ? '   ← نتیجه‌ی تو: ' + esc(i) : ''}</span>`).join('\n');
  if (ok === all) {
    const u = DB.users[me];
    if (!u.solved[cur.id]) { patch(x => x.solved[cur.id] = LV[cur.lv][1]); h += `\n\n<span class="ok">🎉 همه‌ی تست‌ها درست بود! +${LV[cur.lv][1]} امتیاز</span>`; }
    else h += `\n\n<span class="ok">✔ درست است (امتیاز این تمرین قبلاً ثبت شده).</span>`;
    refresh();
  } else h += `\n\n${ok} از ${all} تست درست بود.`;
  $('#out').innerHTML = h;
};

/* ───────── پنل کاربری ───────── */
function modal(h) { const m = $('#modal'); m.innerHTML = `<div class="box"><button class="x" onclick="closeM()">×</button>${h}</div>`; m.hidden = false; }
function closeM() { $('#modal').hidden = true; }
function authUI(mode) {
  const L = mode === 'login';
  modal(`<h3>${L ? 'ورود به پنل کاربری' : 'ساخت پنل کاربری'}</h3>
  <input id="au" dir="ltr" placeholder="نام کاربری (انگلیسی)" autocomplete="username"><input id="ap" dir="ltr" type="password" placeholder="رمز عبور (حداقل ۴ کاراکتر)" autocomplete="${L ? 'current' : 'new'}-password">
  <p id="am" class="err"></p><button class="btn go" onclick="auth('${mode}')">${L ? 'ورود' : 'ساخت حساب'}</button>
  <p class="sw">${L ? 'حساب نداری؟ <a href="#" onclick="authUI(\'signup\');return false">ثبت‌نام</a>' : 'حساب داری؟ <a href="#" onclick="authUI(\'login\');return false">ورود</a>'}</p>`);
}
async function auth(mode) {
  const n = $('#au').value.trim().toLowerCase(), p = $('#ap').value, err = t => $('#am').textContent = t;
  if (!/^[a-z0-9_]{3,20}$/.test(n)) return err('نام کاربری: ۳ تا ۲۰ حرف انگلیسی، عدد یا _');
  if (p.length < 4) return err('رمز عبور باید حداقل ۴ کاراکتر باشد.');
  const h = await sha(n + ':' + p), us = DB.users;
  if (mode === 'signup') { if (us[n]) return err('این نام کاربری قبلاً گرفته شده.'); us[n] = { h, at: Date.now(), solved: {}, drafts: {} }; DB.save(us); }
  else if (!us[n] || us[n].h !== h) return err('نام کاربری یا رمز عبور اشتباه است.');
  me = n; localStorage.pp_session = n; closeM(); select(cur ? cur.id : 0); refresh();
}
function panel() {
  const u = DB.users[me], total = pts(u), n = Object.keys(u.solved).length;
  const rank = total < 100 ? 'مبتدی' : total < 400 ? 'تمرین‌کار' : total < 800 ? 'ماهر' : 'حرفه‌ای';
  const bars = Object.entries(LV).map(([k, v]) => {
    const all = EX.filter(e => e.lv === k), d = all.filter(e => u.solved[e.id]).length;
    return `<div class="bar2"><span>${v[0]}</span><div><b class="${k}" style="width:${d / all.length * 100}%"></b></div><small>${d}/${all.length}</small></div>`;
  }).join('');
  const board = Object.entries(DB.users).map(([k, x]) => [k, pts(x)]).sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([k, s], i) => `<li class="${k === me ? 'me' : ''}"><span>${i + 1}. ${k}</span><b>${s}</b></li>`).join('');
  modal(`<h3>پنل کاربری ${me}</h3><p class="big"><b>${total}</b> امتیاز · ${n} از ${EX.length} تمرین · رتبه: ${rank}</p>${bars}
  <h4>جدول امتیازها (این مرورگر)</h4><ol class="board">${board}</ol>
  <div class="row"><button class="btn" onclick="logout()">خروج</button><button class="btn" onclick="resetP()">پاک‌کردن پیشرفت</button></div>`);
}
function logout() { setDraft(cur ? cur.id : 0, ta.value); me = null; localStorage.removeItem('pp_session'); closeM(); select(cur ? cur.id : 0); refresh(); }
function resetP() { if (confirm('همه‌ی امتیازها و کدهای ذخیره‌شده پاک شود؟')) { patch(u => { u.solved = {}; u.drafts = {}; }); closeM(); select(cur ? cur.id : 0); refresh(); } }

/* ───────── رویدادها ───────── */
$('#userBtn').onclick = () => me ? panel() : authUI('login');
$('#modal').onclick = e => { if (e.target.id === 'modal') closeM(); };
$('#filters').onclick = e => { if (e.target.dataset.f) { filter = e.target.dataset.f; renderFilters(); renderList(); } };
$('#list').onclick = e => { const li = e.target.closest('li'); if (li) select(+li.dataset.id); };
$('#menuBtn').onclick = () => document.body.classList.toggle('menu');

cur = EX[0]; ta.value = getDraft(cur.id) ?? starter(cur);
refresh(); paint(); boot();
