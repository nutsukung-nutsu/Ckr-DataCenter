import { createClient } from '@supabase/supabase-js';
import { createIcons, icons } from 'lucide';
import './style.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isConfigured = Boolean(supabaseUrl && supabaseKey && !supabaseUrl.includes('YOUR_PROJECT') && !supabaseKey.includes('YOUR_'));
const supabase = isConfigured ? createClient(supabaseUrl, supabaseKey) : null;
const demoAssets = [
  { id: 'a1', asset_code: 'IT-2568-001', name: 'เครื่องคอมพิวเตอร์สำนักงาน', category: 'คอมพิวเตอร์', brand: 'Dell OptiPlex 7010', serial_number: 'DL-OP7010-8821', location: 'ห้องปฏิบัติการคอมพิวเตอร์', department: 'งานเทคโนโลยีสารสนเทศ', status: 'ใช้งานปกติ', purchase_date: '2025-02-14', price: 28900 },
  { id: 'a2', asset_code: 'IT-2568-002', name: 'เครื่องคอมพิวเตอร์สำนักงาน', category: 'คอมพิวเตอร์', brand: 'HP ProDesk 400 G9', serial_number: 'HP-PD400-1342', location: 'ห้องธุรการ', department: 'งานบริหารและพัฒนาทรัพยากรบุคคล', status: 'ใช้งานปกติ', purchase_date: '2025-01-28', price: 26400 },
  { id: 'a3', asset_code: 'IT-2567-018', name: 'เครื่องพิมพ์เลเซอร์ขาวดำ', category: 'อุปกรณ์ต่อพ่วง', brand: 'Brother HL-L2375DW', serial_number: 'BR-L2375-7123', location: 'ห้องงานการเงิน', department: 'งานการเงินและบัญชี', status: 'รอซ่อม', purchase_date: '2024-08-05', price: 6200 },
  { id: 'a4', asset_code: 'IT-2567-011', name: 'จอภาพ LED 24 นิ้ว', category: 'อุปกรณ์ต่อพ่วง', brand: 'Dell P2422H', serial_number: 'DL-P2422-9918', location: 'ห้องเรียน 302', department: 'งานการศึกษา', status: 'ใช้งานปกติ', purchase_date: '2024-06-19', price: 5900 },
  { id: 'a5', asset_code: 'IT-2566-007', name: 'เครื่องสำรองไฟ 1000VA', category: 'อุปกรณ์เครือข่าย', brand: 'APC BX1100LI-MS', serial_number: 'APC-BX11-0201', location: 'ห้อง Server', department: 'งานเทคโนโลยีสารสนเทศ', status: 'ส่งซ่อม', purchase_date: '2023-11-12', price: 4850 },
  { id: 'a6', asset_code: 'IT-2566-003', name: 'เครื่องฉายภาพโปรเจคเตอร์', category: 'อุปกรณ์ต่อพ่วง', brand: 'Epson EB-FH52', serial_number: 'EP-FH52-4491', location: 'ห้องประชุมศรีจักรี', department: 'งานบริหาร', status: 'ใกล้ครบอายุ', purchase_date: '2023-04-21', price: 32900 },
];
let assets = loadDemoAssets();
let session = null;
let userRole = null;
let activeNav = 'ภาพรวม';
let searchTerm = '';
let categoryFilter = 'ทั้งหมด';
let statusFilter = 'ทั้งหมด';
let view = 'dashboard';
let sidebarCollapsed = localStorage.getItem('bcn-ckr-sidebar-collapsed') === 'true';
const icon = (name, size = 18) => `<i data-lucide="${name}" width="${size}" height="${size}"></i>`;
const money = value => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(Number(value) || 0);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const dateThai = value => value ? new Date(value).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '—';

function renderIcons() {
  createIcons({ icons });
}

function loadDemoAssets() {
  try { return JSON.parse(localStorage.getItem('bcn-ckr-demo-assets') || localStorage.getItem('bcjr-demo-assets')) || [...demoAssets]; }
  catch { return [...demoAssets]; }
}
function saveDemoAssets() {
  if (!supabase) localStorage.setItem('bcn-ckr-demo-assets', JSON.stringify(assets));
}

function renderLogin() {
  document.querySelector('#app').innerHTML = `
    <main class="login-shell login-centered">
      <section class="login-art">
        <div class="art-glow"></div><div class="brand-lockup light"><div class="brand-mark">${icon('boxes', 23)}</div><div><strong>BCN CKR<span> / IT ASSETS</span></strong><small>ASSET MANAGEMENT SYSTEM</small></div></div>
        <div class="art-copy"><div class="eyebrow"><span class="pulse-dot"></span> DIGITAL CAMPUS · 2025</div><h1>จัดการครุภัณฑ์<br/><em>อย่างเป็นระบบ</em></h1><p>ติดตาม ดูแล และวางแผนสินทรัพย์ด้านเทคโนโลยี<br/>ของวิทยาลัยได้ในที่เดียว</p><div class="art-stats"><div><strong>360°</strong><span>มองเห็นภาพรวม</span></div><i></i><div><strong>Real-time</strong><span>ข้อมูลเป็นปัจจุบัน</span></div></div></div>
        <div class="art-bottom"><span>วิทยาลัยพยาบาลบรมราชชนนี จักรีรัช</span><span>EST. 1995</span></div>
      </section>
      <section class="login-panel"><div class="login-card"><div class="login-emblem-ring"><img src="/ckr-logo.jpg" alt="ตราวิทยาลัยพยาบาลบรมราชชนนี จักรีรัช" /></div><div class="login-school-name">คลังข้อมูลครุภัณฑ์งานเทคโนโลยีสารสนเทศ<br/>วิทยาลัยพยาบาลบรมราชชนนี จักรีรัช</div><p class="login-subtitle">กรุณาเข้าสู่ระบบด้วยบัญชีของวิทยาลัย</p><form id="login-form"><label for="email">อีเมล</label><div class="input-wrap">${icon('mail', 17)}<input id="email" type="email" placeholder="name@ckr.ac.th" autocomplete="username" required /></div><label for="password">รหัสผ่าน</label><div class="input-wrap">${icon('lock-keyhole', 17)}<input id="password" type="password" placeholder="กรอกรหัสผ่าน" autocomplete="current-password" required /><button class="show-password" type="button" aria-label="แสดงรหัสผ่าน">${icon('eye', 17)}</button></div><div class="form-options"><label class="check-label"><input type="checkbox"/><span>จดจำฉัน</span></label><a href="#" id="forgot-link">ลืมรหัสผ่าน?</a></div><button class="button primary login-submit" type="submit">เข้าสู่ระบบ ${icon('arrow-right', 17)}</button><div id="login-notice" class="notice hidden"></div></form><div class="login-footer"><span class="login-legal">© 2026 วิทยาลัยพยาบาลบรมราชชนนี จักรีรัช<br/>คณะพยาบาลศาสตร์ สถาบันพระบรมราชชนก</span></div></div></section>
    </main>`;
  document.querySelector('#login-form').addEventListener('submit', handleLogin);
  document.querySelector('.show-password').addEventListener('click', () => { const input = document.querySelector('#password'); input.type = input.type === 'password' ? 'text' : 'password'; });
  document.querySelector('#forgot-link').addEventListener('click', async e => { e.preventDefault(); const email = document.querySelector('#email').value; if (!email || !supabase) return notifyLogin('กรอกอีเมลที่ลงทะเบียนไว้ และตรวจสอบการตั้งค่า Supabase', true); const { error } = await supabase.auth.resetPasswordForEmail(email); notifyLogin(error ? error.message : 'ส่งลิงก์ตั้งรหัสผ่านใหม่ไปยังอีเมลแล้ว', Boolean(error)); });
  renderIcons();
}

function notifyLogin(message, isError = false) { const box = document.querySelector('#login-notice'); if (!box) return; box.textContent = message; box.className = `notice ${isError ? 'error' : 'success'}`; }

async function handleLogin(event) {
  event.preventDefault();
  const submit = document.querySelector('.login-submit'); submit.disabled = true; submit.innerHTML = 'กำลังเข้าสู่ระบบ…';
  if (!supabase) { notifyLogin('ยังไม่ได้ตั้งค่า Supabase · กำลังเปิดหน้าตัวอย่าง', false); setTimeout(() => { session = { user: { email: document.querySelector('#email').value || 'demo@ckr.ac.th' } }; renderApp(); }, 450); return; }
  const { data, error } = await supabase.auth.signInWithPassword({ email: document.querySelector('#email').value, password: document.querySelector('#password').value });
  if (error) { notifyLogin(error.message === 'Invalid login credentials' ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' : error.message, true); submit.disabled = false; submit.innerHTML = `เข้าสู่ระบบ ${icon('arrow-right', 17)}`; renderIcons(); return; }
  await initializeSession(data.session);
}

function renderApp() {
  const name = session?.user?.email?.split('@')[0] || 'ผู้ดูแลระบบ';
  const firstChar = (name[0] || 'ผ').toUpperCase();
  document.querySelector('#app').innerHTML = `
    <div class="app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}"><aside class="sidebar"><div class="brand-lockup"><div class="brand-mark">${icon('boxes', 22)}</div><div class="brand-copy"><strong>BCN CKR<span> / IT ASSETS</span></strong><small>ASSET MANAGEMENT</small></div><button class="sidebar-toggle" id="sidebar-toggle" type="button" aria-label="${sidebarCollapsed ? 'ขยายแถบเมนู' : 'ย่อแถบเมนู'}" title="${sidebarCollapsed ? 'ขยายแถบเมนู' : 'ย่อแถบเมนู'}">${icon(sidebarCollapsed ? 'panel-left-open' : 'panel-left-close', 17)}</button></div><div class="nav-label">เมนูหลัก</div><nav class="nav-list"><button data-view="dashboard" class="nav-item ${view === 'dashboard' ? 'active' : ''}">${icon('layout-dashboard')}<span>ภาพรวม</span></button><button data-view="assets" class="nav-item ${view === 'assets' ? 'active' : ''}">${icon('package-search')}<span>ทะเบียนครุภัณฑ์</span><span class="nav-count">${assets.length}</span></button><button data-view="maintenance" class="nav-item ${view === 'maintenance' ? 'active' : ''}">${icon('wrench')}<span>งานซ่อมบำรุง</span><span class="nav-pip"></span></button><button data-view="reports" class="nav-item ${view === 'reports' ? 'active' : ''}">${icon('chart-no-axes-combined')}<span>รายงาน</span></button></nav><div class="nav-label nav-label-spaced">จัดการข้อมูล</div><nav class="nav-list"><button data-view="locations" class="nav-item">${icon('map-pin')}<span>สถานที่จัดเก็บ</span></button><button data-view="people" class="nav-item">${icon('users-round')}<span>ผู้รับผิดชอบ</span></button><button data-view="settings" class="nav-item">${icon('settings-2')}<span>ตั้งค่าระบบ</span></button>${userRole === 'super_admin' ? `<button data-view="users" class="nav-item ${view === 'users' ? 'active' : ''}">${icon('shield-user')}<span>กำหนดสิทธิ์ผู้ใช้</span></button>` : ''}</nav></aside>
    <main class="main-panel"><header class="topbar"><div class="crumbs"><span>Workspace</span>${icon('chevron-right', 14)}<strong>${escapeHtml(activeNav)}</strong></div><div class="top-actions"><div class="sync-status"><span class="sync-indicator"></span>${isConfigured ? 'เชื่อมต่อแล้ว' : 'โหมดตัวอย่าง'}</div><button class="icon-button" id="notifications" aria-label="การแจ้งเตือน">${icon('bell', 18)}<span class="notification-dot"></span></button><div class="top-divider"></div><button class="top-user" id="logout-button" title="ออกจากระบบ" aria-label="ออกจากระบบ ${escapeHtml(name)}"><div class="avatar small">${escapeHtml(firstChar)}</div><span>${escapeHtml(name)}</span>${icon('log-out', 15)}</button></div></header><div class="content" id="content"></div></main></div>`;
  document.querySelectorAll('.nav-item').forEach(button => { button.title = button.querySelector('span')?.textContent || ''; button.addEventListener('click', () => { view = button.dataset.view; activeNav = button.querySelector('span').textContent; renderApp(); }); });
  document.querySelector('#logout-button').addEventListener('click', signOut);
  document.querySelector('#sidebar-toggle').addEventListener('click', () => { sidebarCollapsed = !sidebarCollapsed; localStorage.setItem('bcn-ckr-sidebar-collapsed', String(sidebarCollapsed)); renderApp(); });
  document.querySelector('#notifications').addEventListener('click', () => toast('ไม่มีการแจ้งเตือนใหม่'));
  renderContent(); renderIcons();
}

function statusClass(status) { return ['ใช้งานปกติ', 'กำลังใช้งาน', 'พร้อมใช้งาน', 'เครื่องสำรอง'].includes(status) ? 'good' : ['รอซ่อม', 'ส่งซ่อม', 'ซ่อมบำรุง', 'รอแทงจำหน่าย', 'รอจำหน่าย'].includes(status) ? 'warning' : ['ใกล้ครบอายุ'].includes(status) ? 'purple' : 'muted'; }
function categoryIcon(category) { return ['คอมพิวเตอร์'].includes(category) ? 'monitor' : ['ไฟฟ้าและวิทยุ'].includes(category) ? 'plug-zap' : ['โฆษณาและเผยแพร่'].includes(category) ? 'presentation' : category === 'อุปกรณ์เครือข่าย' ? 'router' : category === 'ซอฟต์แวร์' ? 'app-window' : 'printer'; }
const assetCategories = ['คอมพิวเตอร์', 'ไฟฟ้าและวิทยุ', 'โฆษณาและเผยแพร่', 'อื่น ๆ'];
const statusMetrics = [
  { name: 'พร้อมใช้งาน', icon: 'badge-check', tone: 'mint', matches: ['พร้อมใช้งาน'] },
  { name: 'กำลังใช้งาน', icon: 'monitor-check', tone: 'blue', matches: ['กำลังใช้งาน', 'ใช้งานปกติ'] },
  { name: 'เครื่องสำรอง', icon: 'package-check', tone: 'violet', matches: ['เครื่องสำรอง'] },
  { name: 'ซ่อมบำรุง', icon: 'wrench', tone: 'amber', matches: ['ซ่อมบำรุง', 'รอซ่อม', 'ส่งซ่อม'] },
  { name: 'รอแทงจำหน่าย', icon: 'clock-3', tone: 'orange', matches: ['รอแทงจำหน่าย', 'รอจำหน่าย'] },
  { name: 'แทงจำหน่าย', icon: 'archive', tone: 'slate', matches: ['แทงจำหน่าย', 'จำหน่ายแล้ว'] },
];
function statusCount(metric) { return assets.filter(asset => metric.matches.includes(asset.status)).length; }
function categoryCount(name) { return assets.filter(asset => asset.category === name).length; }
function fiscalYear(asset) {
  if (Number(asset.fiscal_year)) return Number(asset.fiscal_year);
  const received = asset.received_date || asset.purchase_date;
  if (!received) return null;
  const date = new Date(`${received}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.getFullYear() + 543 + (date.getMonth() >= 9 ? 1 : 0);
}
function fiscalYearSummary() {
  const counts = new Map();
  assets.forEach(asset => { const year = fiscalYear(asset); if (year) counts.set(year, (counts.get(year) || 0) + 1); });
  if (!counts.size) return [];
  const last = Math.max(...counts.keys());
  return Array.from({ length: 5 }, (_, index) => last - 4 + index).map(year => ({ year, label: `ปีงบประมาณ ${year}`, count: counts.get(year) || 0 }));
}
function buildingName(location) {
  const value = String(location || '').trim();
  if (!value) return 'ไม่ระบุอาคาร';
  const building = value.match(/(?:อาคาร|ตึก)\s*([A-Za-z0-9ก-๙]+)/i);
  return building ? `อาคาร ${building[1]}` : value.split(/[|,/]/)[0].trim();
}
function buildingSummary() {
  const counts = new Map();
  assets.forEach(asset => { const name = asset.building?.trim() || buildingName(asset.location); counts.set(name, (counts.get(name) || 0) + 1); });
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6);
}
function renderDashboardCharts() {
  const colors = ['#1596b2', '#35b77d', '#83c9b4', '#edb452'];
  const categories = categorySummary();
  const categoryTotal = categories.reduce((sum, item) => sum + item.count, 0);
  let angle = 0;
  const pieStops = categories.map((item, index) => {
    const start = angle;
    angle += categoryTotal ? item.count / categoryTotal * 360 : 0;
    return `${colors[index % colors.length]} ${start}deg ${angle}deg`;
  });
  const fiscalYears = fiscalYearSummary();
  const buildings = buildingSummary();
  const barRows = (items, max) => items.length ? items.map((item, index) => `<div class="chart-bar-row"><div class="chart-bar-label"><span>${escapeHtml(item.name || item.label)}</span><strong>${item.count}</strong></div><div class="chart-bar-track"><i class="chart-color-${index % 4}" style="width:${max ? Math.max(item.count ? 3 : 0, item.count / max * 100) : 0}%"></i></div></div>`).join('') : '<div class="chart-empty">ยังไม่มีข้อมูลสำหรับสรุป</div>';
  return `<section class="analytics-grid" aria-label="กราฟสรุปข้อมูล"><article class="panel chart-panel"><div class="panel-heading"><div><h3>สัดส่วนตามหมวดหมู่</h3><p>Premium Pie Chart · ${categoryTotal} รายการ</p></div><span class="chart-kicker">CATEGORY</span></div><div class="pie-layout"><div class="pie-chart" style="background:${categoryTotal ? `conic-gradient(${pieStops.join(',')})` : '#e4eef0'}"></div><div class="pie-legend">${categories.map((item, index) => `<div class="pie-legend-row"><i class="chart-color-${index % 4}"></i><span>${escapeHtml(item.name)}</span><strong>${item.count}</strong></div>`).join('')}</div></div></article><article class="panel chart-panel"><div class="panel-heading"><div><h3>สถานะการใช้งาน</h3><p>Premium Bar Chart · จำนวนตามสถานะ</p></div><span class="chart-kicker">STATUS</span></div><div class="horizontal-bars">${barRows(statusMetrics.map(metric => ({ name: metric.name, count: statusCount(metric) })), Math.max(1, ...statusMetrics.map(statusCount)))}</div></article><article class="panel chart-panel"><div class="panel-heading"><div><h3>สรุปตามปีงบประมาณ</h3><p>นับจากวันที่จัดซื้อ · 1 ต.ค. ถึง 30 ก.ย.</p></div><span class="chart-kicker">FISCAL YEAR</span></div><div class="fiscal-chart">${fiscalYears.length ? fiscalYears.map((item, index) => `<div class="fiscal-column"><span class="fiscal-count">${item.count}</span><div class="fiscal-track"><i class="chart-color-${index % 4}" style="height:${Math.max(item.count ? 6 : 0, item.count / Math.max(1, ...fiscalYears.map(year => year.count)) * 100)}%"></i></div><span class="fiscal-label">${item.label.replace('ปีงบประมาณ ', '')}</span></div>`).join('') : '<div class="chart-empty">ยังไม่มีวันที่จัดซื้อสำหรับสรุป</div>'}</div></article><article class="panel chart-panel"><div class="panel-heading"><div><h3>ข้อมูลแต่ละอาคาร</h3><p>Premium Bar Chart · แยกจากสถานที่จัดเก็บ</p></div><span class="chart-kicker">BUILDING</span></div><div class="horizontal-bars">${barRows(buildings, Math.max(1, ...buildings.map(item => item.count)))}</div></article></section>`;
}

function renderContent() {
  const content = document.querySelector('#content');
  if (view === 'users') { renderUserAccess(content); return; }
  if (view !== 'dashboard' && view !== 'assets') { content.innerHTML = `<div class="page-heading"><div><span class="section-kicker">WORKSPACE</span><h1>${escapeHtml(activeNav)}</h1><p>ส่วนนี้เตรียมไว้สำหรับการจัดการ${escapeHtml(activeNav)}ในขั้นถัดไป</p></div></div><div class="empty-module">${icon(view === 'maintenance' ? 'wrench' : 'layers-3', 28)}<strong>กำลังเตรียมพื้นที่ทำงาน</strong><span>ข้อมูลทะเบียนครุภัณฑ์และภาพรวมพร้อมใช้งานแล้ว</span><button class="button secondary" id="go-assets">ไปที่ทะเบียนครุภัณฑ์ ${icon('arrow-right', 15)}</button></div>`; document.querySelector('#go-assets').addEventListener('click', () => { view = 'assets'; activeNav = 'ทะเบียนครุภัณฑ์'; renderApp(); }); renderIcons(); return; }
  const total = assets.length;
  const activeTotal = total - statusCount(statusMetrics[5]);
  const inUse = statusCount(statusMetrics[1]);
  const repair = statusCount(statusMetrics[3]);
  const value = assets.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  content.innerHTML = `<div class="page-heading"><div><span class="section-kicker">TUESDAY, 10 NOVEMBER 2026 · ASSET OVERVIEW</span><h1>${view === 'dashboard' ? 'ภาพรวมครุภัณฑ์' : 'ทะเบียนครุภัณฑ์'}</h1><p>ติดตามสถานะและมูลค่าครุภัณฑ์ของวิทยาลัยได้ในภาพเดียว</p></div><div class="heading-actions"><button id="export-button" class="button secondary">${icon('download', 16)} ส่งออกรายงาน</button>${canManageAssets() ? `<button id="add-asset" class="button primary">${icon('plus', 17)} เพิ่มครุภัณฑ์</button>` : ''}</div></div>
  ${view === 'dashboard' ? `<section class="welcome-banner"><div class="welcome-text"><div class="welcome-tag">${icon('sparkles', 14)} YOUR ASSET COMMAND CENTER</div><h2>ทุกสินทรัพย์ <span>พร้อมจัดการ</span></h2><p>ภาพรวมข้อมูลครุภัณฑ์งานเทคโนโลยีสารสนเทศ ประจำวิทยาลัย</p><button id="view-all" class="welcome-link">ดูทะเบียนครุภัณฑ์ทั้งหมด ${icon('arrow-right', 15)}</button></div><div class="banner-visual"><div class="visual-orbit orbit-one"></div><div class="visual-orbit orbit-two"></div><div class="visual-core">${icon('boxes', 34)}</div><div class="float-chip chip-a">${icon('monitor', 15)} ${total} รายการ</div><div class="float-chip chip-b">${icon('shield-check', 15)} พร้อมใช้งาน</div><div class="visual-sparkle sparkle-a">✳</div><div class="visual-sparkle sparkle-b">✦</div></div></section>` : ''}
  <section class="metric-grid category-metrics" aria-label="สถิติตามประเภทครุภัณฑ์"><article class="metric-card"><div class="metric-top"><span>ครุภัณฑ์ทั้งหมด</span><div class="metric-icon violet">${icon('boxes', 19)}</div></div><div class="metric-value">${total}<small>รายการ</small></div><div class="metric-foot"><span>ทุกประเภท</span></div></article>${assetCategories.slice(0, 3).map((category, index) => `<article class="metric-card"><div class="metric-top"><span>ครุภัณฑ์${category}</span><div class="metric-icon ${['blue', 'amber', 'mint'][index]}">${icon(index === 0 ? 'monitor' : index === 1 ? 'plug-zap' : 'presentation', 19)}</div></div><div class="metric-value">${categoryCount(category)}<small>รายการ</small></div><div class="metric-foot"><span>${total ? Math.round(categoryCount(category) / total * 100) : 0}% ของครุภัณฑ์ทั้งหมด</span></div></article>`).join('')}</section>
  <section class="metric-grid status-metrics" aria-label="สถิติตามสถานะครุภัณฑ์">${statusMetrics.map(metric => `<article class="metric-card"><div class="metric-top"><span>${metric.name}</span><div class="metric-icon ${metric.tone}">${icon(metric.icon, 19)}</div></div><div class="metric-value">${statusCount(metric)}<small>รายการ</small></div><div class="metric-foot"><span>${metric.name === 'พร้อมใช้งาน' ? 'ไม่นับรวมแทงจำหน่ายแล้ว' : metric.name === 'แทงจำหน่าย' ? 'จำหน่ายออกแล้ว' : 'สถานะปัจจุบัน'}</span></div></article>`).join('')}</section>
  ${view === 'dashboard' ? renderDashboardCharts() : ''}
  <section class="panel asset-panel"><div class="asset-panel-head"><div><h3>${view === 'dashboard' ? 'ครุภัณฑ์ล่าสุด' : 'รายการครุภัณฑ์'}</h3><p>ทะเบียนครุภัณฑ์งานเทคโนโลยีสารสนเทศ</p></div><button class="view-all" id="view-all-assets">ดูทั้งหมด ${icon('arrow-right', 14)}</button></div><div class="table-toolbar"><div class="search-box">${icon('search', 16)}<input id="asset-search" placeholder="ค้นหาชื่อ, รหัสครุภัณฑ์..." value="${escapeHtml(searchTerm)}"/><kbd>⌘ K</kbd></div><div class="filters"><select id="category-filter"><option>ทั้งหมด</option>${[...new Set(assets.map(a => a.category))].map(c => `<option ${categoryFilter === c ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('')}</select><select id="status-filter"><option>ทั้งหมด</option>${[...new Set(assets.map(a => a.status))].map(s => `<option ${statusFilter === s ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('')}</select><button class="filter-button" id="refresh-button">${icon('rotate-cw', 15)} รีเฟรช</button></div></div><div class="table-scroll"><table><thead><tr><th>รหัส / รายการ</th><th>หมวดหมู่</th><th>สถานที่จัดเก็บ</th><th>ผู้รับผิดชอบ</th><th>สถานะ</th><th>ราคาจัดซื้อ</th><th></th></tr></thead><tbody id="asset-rows">${tableRows()}</tbody></table></div><div class="table-bottom"><span>แสดง <strong id="row-count">${filteredAssets().length}</strong> จาก ${assets.length} รายการ</span><div class="pagination"><button disabled>${icon('chevron-left', 15)}</button><button class="current-page">1</button><button disabled>2</button><button disabled>3</button><span>…</span><button disabled>12</button><button disabled>${icon('chevron-right', 15)}</button></div></div></section><footer class="app-footer"><span class="app-legal">© 2026 วิทยาลัยพยาบาลบรมราชชนนี จักรีรัช · คณะพยาบาลศาสตร์ สถาบันพระบรมราชชนก</span><span>BCN CKR IT ASSET SYSTEM <i class="footer-dot"></i> v0.1.0</span></footer>`;
  document.querySelector('#add-asset')?.addEventListener('click', openAssetModal);
  document.querySelector('#export-button').addEventListener('click', exportCsv);
  document.querySelector('#view-all')?.addEventListener('click', () => { view = 'assets'; activeNav = 'ทะเบียนครุภัณฑ์'; renderApp(); });
  document.querySelector('#view-all-assets').addEventListener('click', () => { view = 'assets'; activeNav = 'ทะเบียนครุภัณฑ์'; renderApp(); });
  document.querySelector('#asset-search').addEventListener('input', e => { searchTerm = e.target.value; updateRows(); });
  document.querySelector('#category-filter').addEventListener('change', e => { categoryFilter = e.target.value; updateRows(); });
  document.querySelector('#status-filter').addEventListener('change', e => { statusFilter = e.target.value; updateRows(); });
  document.querySelector('#refresh-button').addEventListener('click', async () => { await loadAssets(); renderContent(); toast('อัปเดตข้อมูลแล้ว'); });
  document.querySelector('#asset-rows').addEventListener('click', e => { const button = e.target.closest('[data-delete]'); if (button) deleteAsset(button.dataset.delete); });
  renderIcons(); loadAssetThumbnails();
}

function categorySummary() { return assetCategories.map(name => ({ name, count: categoryCount(name) })); }
function filteredAssets() { return assets.filter(a => (!searchTerm || `${a.asset_code} ${a.name} ${a.brand} ${a.serial_number}`.toLowerCase().includes(searchTerm.toLowerCase())) && (categoryFilter === 'ทั้งหมด' || a.category === categoryFilter) && (statusFilter === 'ทั้งหมด' || a.status === statusFilter)); }

async function loadAssetThumbnails() {
  if (!supabase) return;
  const images = [...document.querySelectorAll('.asset-thumb[data-image-path]')];
  await Promise.all(images.map(async image => {
    const { data, error } = await supabase.storage.from('it-asset-images').createSignedUrl(image.dataset.imagePath, 1800);
    if (!error && data?.signedUrl && image.isConnected) image.src = data.signedUrl;
  }));
}

function tableRows() { const rows = filteredAssets().slice(0, view === 'dashboard' ? 5 : 100); if (!rows.length) return `<tr><td colspan="7"><div class="table-empty">${icon('search-x', 21)}<span>ไม่พบรายการที่ตรงกับการค้นหา</span></div></td></tr>`; return rows.map(a => `<tr><td><div class="asset-name-cell"><div class="asset-type-icon ${categoryIcon(a.category) === 'monitor' ? 'icon-purple' : categoryIcon(a.category) === 'router' ? 'icon-blue' : 'icon-orange'}">${a.image_path ? `<img class="asset-thumb" data-image-path="${escapeHtml(a.image_path)}" alt="${escapeHtml(a.name)}" />` : icon(categoryIcon(a.category), 17)}</div><div><strong>${escapeHtml(a.name)}</strong><span>${escapeHtml(a.asset_code)} <i>·</i> ${escapeHtml(a.brand || 'ไม่ระบุยี่ห้อ')}</span></div></div></td><td><span class="category-chip">${escapeHtml(a.category)}</span></td><td><span class="location-cell">${icon('map-pin', 13)} ${escapeHtml([a.building, a.floor, a.location].filter(Boolean).join(' · ') || '—')}</span></td><td><span class="owner-cell"><span class="owner-avatar">${escapeHtml((a.assignee || a.department || 'IT')[0])}</span>${escapeHtml(a.assignee || a.department || 'งาน IT')}</span></td><td><span class="status-pill ${statusClass(a.status)}"><i></i>${escapeHtml(a.status)}</span></td><td class="price-cell">${money(a.price)}</td><td>${userRole === 'super_admin' || !supabase ? `<button class="row-more" data-delete="${escapeHtml(a.id)}" title="ลบรายการ">${icon('ellipsis', 17)}</button>` : ''}</td></tr>`).join(''); }
function updateRows() { document.querySelector('#asset-rows').innerHTML = tableRows(); document.querySelector('#row-count').textContent = filteredAssets().length; renderIcons(); loadAssetThumbnails(); }

function cleanPathPart(value) { return String(value || '').normalize('NFKC').trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 90) || 'item'; }
function thaiFiscalYear(dateValue) {
  if (!dateValue) return '';
  const date = new Date(dateValue + 'T00:00:00');
  return Number.isNaN(date.getTime()) ? '' : date.getFullYear() + 543 + (date.getMonth() >= 9 ? 1 : 0);
}
function openAssetModal() {
  const modal = document.createElement('div'); modal.className = 'modal-backdrop';
  const categories = assetCategories.map(item => '<option>' + escapeHtml(item) + '</option>').join('');
  const statuses = statusMetrics.map(item => '<option>' + escapeHtml(item.name) + '</option>').join('');
  modal.innerHTML = '<section class="asset-modal"><div class="modal-head"><div><span class="section-kicker">ASSET REGISTRY</span><h2>เพิ่มครุภัณฑ์ใหม่</h2></div><button class="icon-button" id="close-modal">' + icon('x', 19) + '</button></div>' +
    '<form id="asset-form"><div class="form-grid">' +
    '<div class="field"><label>เลขครุภัณฑ์ <span>*</span></label><input name="asset_code" placeholder="เช่น IT-2569-001" required /></div>' +
    '<div class="field"><label>ชื่อผลิตภัณฑ์ <span>*</span></label><input name="name" placeholder="ชื่อผลิตภัณฑ์" required /></div>' +
    '<div class="field"><label>ประเภท <span>*</span></label><select name="category" required>' + categories + '</select></div>' +
    '<div class="field"><label>วันที่ได้รับ <span>*</span></label><input name="received_date" type="date" required /></div>' +
    '<div class="field"><label>ปีงบประมาณ <span>*</span></label><input name="fiscal_year" type="number" min="2500" max="3000" placeholder="เช่น 2569" required /></div>' +
    '<div class="field"><label>สถานที่ <span>*</span></label><input name="location" placeholder="เช่น ห้องปฏิบัติการ" required /></div>' +
    '<div class="field"><label>หน่วยงาน <span>*</span></label><input name="department" placeholder="หน่วยงานที่รับผิดชอบ" required /></div>' +
    '<div class="field"><label>ชั้น <span>*</span></label><input name="floor" placeholder="เช่น ชั้น 2" required /></div>' +
    '<div class="field"><label>อาคาร <span>*</span></label><input name="building" placeholder="เช่น อาคาร 1" required /></div>' +
    '<div class="field"><label>ผู้รับผิดชอบ <span>*</span></label><input name="assignee" placeholder="ชื่อผู้รับผิดชอบ" required /></div>' +
    '<div class="field"><label>สถานะ <span>*</span></label><select name="status" required>' + statuses + '</select></div>' +
    '<div class="field image-field"><label>ภาพอุปกรณ์</label><input id="asset-image" type="file" accept="image/jpeg,image/png,image/webp" /><div id="asset-image-preview" class="asset-image-preview"><span>เลือกรูป JPG, PNG หรือ WebP ขนาดไม่เกิน 10 MB</span></div><small>จัดเก็บแยกโฟลเดอร์ตามประเภท และตั้งชื่อด้วยเลขครุภัณฑ์กับผลิตภัณฑ์</small></div>' +
    '</div><details class="optional-asset-details"><summary>ข้อมูลเพิ่มเติม</summary><div class="form-grid">' +
    '<div class="field"><label>ยี่ห้อ / รุ่น</label><input name="brand" placeholder="ระบุยี่ห้อและรุ่น" /></div>' +
    '<div class="field"><label>หมายเลขเครื่อง (S/N)</label><input name="serial_number" placeholder="Serial number" /></div>' +
    '<div class="field"><label>ราคาจัดซื้อ (บาท)</label><input name="price" type="number" min="0" step="0.01" placeholder="0.00" /></div>' +
    '</div></details><div class="modal-actions"><button type="button" class="button secondary" id="cancel-modal">ยกเลิก</button><button type="submit" class="button primary" id="save-asset">' + icon('plus', 16) + ' บันทึกครุภัณฑ์</button></div></form></section>';
  document.body.append(modal); renderIcons();
  const form = modal.querySelector('#asset-form'), imageInput = modal.querySelector('#asset-image');
  const preview = modal.querySelector('#asset-image-preview'), saveButton = modal.querySelector('#save-asset');
  imageInput.addEventListener('change', () => {
    const file = imageInput.files?.[0];
    if (!file) { preview.innerHTML = '<span>เลือกรูป JPG, PNG หรือ WebP ขนาดไม่เกิน 10 MB</span>'; return; }
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) { imageInput.value = ''; preview.innerHTML = '<span>ไฟล์ไม่ถูกต้อง หรือมีขนาดเกิน 10 MB</span>'; return; }
    const reader = new FileReader(); reader.onload = () => { preview.innerHTML = '<img alt="ตัวอย่างภาพครุภัณฑ์" src="' + reader.result + '" />'; }; reader.readAsDataURL(file);
  });
  form.elements.received_date.addEventListener('change', () => { form.elements.fiscal_year.value = thaiFiscalYear(form.elements.received_date.value); });
  const close = () => modal.remove(); modal.querySelector('#close-modal').onclick = close; modal.querySelector('#cancel-modal').onclick = close;
  modal.onclick = event => { if (event.target === modal) close(); };
  form.onsubmit = async event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form)), file = imageInput.files?.[0] || null;
    const record = { asset_code: String(values.asset_code).trim(), name: String(values.name).trim(), category: values.category,
      received_date: values.received_date || null, purchase_date: values.received_date || null, fiscal_year: Number(values.fiscal_year) || null,
      location: String(values.location).trim(), department: String(values.department).trim(), floor: String(values.floor).trim(),
      building: String(values.building).trim(), assignee: String(values.assignee).trim(), status: values.status,
      brand: String(values.brand || '').trim() || null, serial_number: String(values.serial_number || '').trim() || null,
      price: Number(values.price) || 0, image_path: null };
    saveButton.disabled = true; saveButton.textContent = 'กำลังบันทึก…';
    let path = null;
    if (file && supabase && session?.user) {
      const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
      path = cleanPathPart(record.category) + '/' + cleanPathPart(record.asset_code) + '-' + cleanPathPart(record.name) + '.' + ext;
      const { error: uploadError } = await supabase.storage.from('it-asset-images').upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) { toast('อัปโหลดภาพไม่สำเร็จ: ' + uploadError.message, true); saveButton.disabled = false; saveButton.innerHTML = icon('plus', 16) + ' บันทึกครุภัณฑ์'; renderIcons(); return; }
      record.image_path = path;
    }
    if (supabase && session?.user) {
      const { data, error } = await supabase.from('it_assets').insert({ ...record, created_by: session.user.id }).select().single();
      if (error) { if (path) await supabase.storage.from('it-asset-images').remove([path]); toast('บันทึกไม่สำเร็จ: ' + error.message, true); saveButton.disabled = false; saveButton.innerHTML = icon('plus', 16) + ' บันทึกครุภัณฑ์'; renderIcons(); return; }
      assets.unshift(data);
    } else { if (file) toast('โหมดตัวอย่างไม่สามารถจัดเก็บภาพถาวรได้', true); assets.unshift({ ...record, id: 'local-' + Date.now() }); }
    close(); renderContent(); renderIcons(); toast('เพิ่มครุภัณฑ์เรียบร้อย');
  };
}
async function deleteAsset(id) { if (userRole !== 'super_admin' && supabase) return toast('เฉพาะ Super Admin ลบครุภัณฑ์ได้', true); const target = assets.find(a => String(a.id) === String(id)); if (!target || !confirm(`ยืนยันลบ “${target.name}” (${target.asset_code}) หรือไม่?`)) return; if (supabase && session?.user) { const { error } = await supabase.from('it_assets').delete().eq('id', id); if (error) return toast(`ลบไม่สำเร็จ: ${error.message}`, true); } assets = assets.filter(a => String(a.id) !== String(id)); renderContent(); renderIcons(); toast('ลบรายการแล้ว'); }

function exportCsv() { const headers = ['เลขครุภัณฑ์', 'ชื่อผลิตภัณฑ์', 'ประเภท', 'วันที่ได้รับ', 'ปีงบประมาณ', 'สถานที่', 'หน่วยงาน', 'ชั้น', 'อาคาร', 'ผู้รับผิดชอบ', 'สถานะ', 'ภาพอุปกรณ์', 'ยี่ห้อ / รุ่น', 'หมายเลขเครื่อง', 'ราคา']; const rows = filteredAssets().map(a => [a.asset_code, a.name, a.category, a.received_date || a.purchase_date, a.fiscal_year || thaiFiscalYear(a.received_date || a.purchase_date), a.location, a.department, a.floor, a.building, a.assignee, a.status, a.image_path, a.brand, a.serial_number, a.price]); const csv = '\ufeff' + [headers, ...rows].map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n'); const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })), download: `BCN CKR-IT-assets-${new Date().toISOString().slice(0,10)}.csv` }); a.click(); URL.revokeObjectURL(a.href); toast('ส่งออกรายงาน CSV แล้ว'); }

function canManageAssets() { return !supabase || ['super_admin', 'asset_manager'].includes(userRole); }
function roleLabel(role) { return ({ super_admin: 'Super Admin', asset_manager: 'ผู้บันทึกครุภัณฑ์', viewer: 'ผู้ดูข้อมูล' })[role] || 'ยังไม่กำหนดสิทธิ์'; }

async function renderUserAccess(content) {
  if (userRole !== 'super_admin') { view = 'dashboard'; renderApp(); return; }
  const projectId = supabaseUrl.match(/^https:\/\/([^.]+)/)?.[1];
  const inviteUrl = projectId ? `https://supabase.com/dashboard/project/${projectId}/auth/users` : 'https://supabase.com/dashboard';
  content.innerHTML = `<div class="page-heading"><div><span class="section-kicker">ACCESS CONTROL</span><h1>กำหนดสิทธิ์ผู้ใช้งาน</h1><p>กำหนดบทบาทตามหน้าที่ของบุคลากรในระบบ</p></div><a class="button primary" href="${inviteUrl}" target="_blank" rel="noopener noreferrer">${icon('user-plus',16)} เพิ่มบัญชีผู้ใช้</a></div><section class="panel asset-panel"><div class="asset-panel-head"><div><h3>บัญชีผู้ใช้งาน</h3><p>บัญชีใหม่ต้องสร้างใน Supabase Authentication ก่อน แล้วจึงกำหนดบทบาทที่นี่</p></div><button class="button secondary" id="refresh-users">${icon('rotate-cw',15)} รีเฟรช</button></div><div class="table-scroll"><table><thead><tr><th>อีเมล</th><th>สิทธิ์ปัจจุบัน</th><th>อัปเดตสิทธิ์</th></tr></thead><tbody id="user-rows"><tr><td colspan="3">กำลังโหลดบัญชี…</td></tr></tbody></table></div></section>`;
  const refresh = async () => {
    const rows = document.querySelector('#user-rows'); if (!rows) return;
    const { data, error } = await supabase.from('user_roles').select('user_id,email,role').order('email');
    if (error) { rows.innerHTML = `<tr><td colspan="3">โหลดบัญชีไม่สำเร็จ: ${escapeHtml(error.message)}</td></tr>`; return; }
    rows.innerHTML = (data || []).map(user => `<tr><td>${escapeHtml(user.email)}</td><td><span class="category-chip">${escapeHtml(roleLabel(user.role))}</span></td><td><select class="role-select" data-user-id="${escapeHtml(user.user_id)}" ${user.user_id === session.user.id ? 'disabled title="ไม่สามารถเปลี่ยนสิทธิ์บัญชีที่กำลังใช้งาน"' : ''}><option value="viewer" ${user.role === 'viewer' ? 'selected' : ''}>ผู้ดูข้อมูล</option><option value="asset_manager" ${user.role === 'asset_manager' ? 'selected' : ''}>ผู้บันทึกครุภัณฑ์</option><option value="super_admin" ${user.role === 'super_admin' ? 'selected' : ''}>Super Admin</option></select></td></tr>`).join('') || '<tr><td colspan="3">ยังไม่มีบัญชีในระบบ</td></tr>';
    rows.querySelectorAll('.role-select').forEach(select => select.addEventListener('change', async event => { const { error: updateError } = await supabase.from('user_roles').update({ role: event.target.value, assigned_by: session.user.id, updated_at: new Date().toISOString() }).eq('user_id', event.target.dataset.userId); if (updateError) { toast(`เปลี่ยนสิทธิ์ไม่สำเร็จ: ${updateError.message}`, true); await refresh(); } else toast('บันทึกสิทธิ์ผู้ใช้แล้ว'); }));
    renderIcons();
  };
  document.querySelector('#refresh-users').addEventListener('click', refresh); await refresh(); renderIcons();
}

async function initializeSession(nextSession) {
  session = nextSession; userRole = null;
  if (!session) { assets = loadDemoAssets(); view = 'dashboard'; renderLogin(); return; }
  const { data, error } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).single();
  if (error || !data) { await supabase.auth.signOut(); session = null; renderLogin(); notifyLogin('บัญชีนี้ยังไม่ได้รับสิทธิ์เข้าระบบ โปรดติดต่อ Super Admin', true); return; }
  userRole = data.role; await loadAssets(); renderApp();
}

async function loadAssets() { if (!supabase || !session?.user) return; const { data, error } = await supabase.from('it_assets').select('*').order('created_at', { ascending: false }).limit(500); if (!error && data) assets = data; else if (error) toast(`โหลดข้อมูลไม่ได้: ${error.message}`, true); }
async function signOut() { if (supabase) await supabase.auth.signOut(); session = null; userRole = null; assets = loadDemoAssets(); view = 'dashboard'; renderLogin(); }
let toastTimer; function toast(message, error = false) { let el = document.querySelector('.toast'); if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.append(el); } el.className = `toast ${error ? 'toast-error' : ''}`; el.innerHTML = `${icon(error ? 'circle-alert' : 'circle-check', 17)}<span>${escapeHtml(message)}</span>`; renderIcons(); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.remove(), 3000); }

async function boot() { if (supabase) { const { data: { session: savedSession } } = await supabase.auth.getSession(); supabase.auth.onAuthStateChange((_event, nextSession) => { setTimeout(() => initializeSession(nextSession), 0); }); if (savedSession) { await initializeSession(savedSession); return; } } renderLogin(); }
boot();
