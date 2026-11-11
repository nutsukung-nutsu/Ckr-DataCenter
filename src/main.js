import { createClient } from '@supabase/supabase-js';
import { createIcons, icons } from 'lucide';
import { renderMaterialsPage } from './materials.js';
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
const defaultCatalogs = {
  asset_categories: ['คอมพิวเตอร์', 'ไฟฟ้าและวิทยุ', 'โฆษณาและเผยแพร่', 'อื่น ๆ'], asset_statuses: ['พร้อมใช้งาน', 'กำลังใช้งาน', 'เครื่องสำรอง', 'ซ่อมบำรุง', 'รอแทงจำหน่าย', 'แทงจำหน่าย', 'ใกล้ครบอายุ'], locations: [], departments: [], buildings: [], floors: [], assignees: [],
  material_categories: ['วัสดุสำนักงาน', 'วัสดุคอมพิวเตอร์', 'อุปกรณ์โสตทัศนูปกรณ์', 'วัสดุทำความสะอาด'],
  ink_types: ['หมึกอิงค์เจ็ท', 'หมึกเลเซอร์ (Toner)', 'ดรัม/ชุดสร้างภาพ', 'ตลับหมึก'], material_units: ['ชิ้น', 'กล่อง', 'ตลับ', 'ขวด', 'รีม', 'ม้วน', 'ชุด', 'เส้น']
};
let systemOptions = loadDemoSystemOptions();
let catalogs = deriveCatalogs(systemOptions);
let assetCategories = catalogs.asset_categories;
let activeNav = 'ภาพรวม';
let searchTerm = '';
let categoryFilter = 'ทั้งหมด';
let statusFilter = 'ทั้งหมด';
let view = 'dashboard';
let animateMenuChange = false;
let sidebarCollapsed = localStorage.getItem('bcn-ckr-sidebar-collapsed') === 'true';
let registryMenuExpanded = localStorage.getItem('bcn-ckr-registry-menu-expanded') !== 'false';
let settingsTab = localStorage.getItem('bcn-ckr-settings-tab') || 'assets';
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
function loadDemoSystemOptions() {
  try {
    const saved = JSON.parse(localStorage.getItem('bcn-ckr-system-options') || 'null');
    if (Array.isArray(saved)) {
      const present = new Set(saved.map(option => option.option_type));
      return [...saved, ...Object.entries(defaultCatalogs).filter(([type]) => !present.has(type)).flatMap(([option_type, values]) => values.map((value, sort_order) => ({ id: `default-${option_type}-${sort_order}`, option_type, value, is_active: true, sort_order })))];
    }
  } catch { /* use defaults */ }
  return Object.entries(defaultCatalogs).flatMap(([option_type, values]) => values.map((value, sort_order) => ({ id: `default-${option_type}-${sort_order}`, option_type, value, is_active: true, sort_order })));
}
function deriveCatalogs(options) {
  return Object.fromEntries(Object.keys(defaultCatalogs).map(type => [type, options.filter(option => option.option_type === type && option.is_active !== false).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map(option => option.value)]));
}
function normalizeAssetCategory(value) { return String(value || '').trim().replace(/^ครุภัณฑ์\s*/, '').trim(); }
function applySystemOptions() {
  catalogs = deriveCatalogs(systemOptions); assetCategories = [...new Set(catalogs.asset_categories.map(normalizeAssetCategory).filter(Boolean))];
  if (typeof statusMetrics !== 'undefined') {
    const templates = defaultStatusMetrics;
    statusMetrics = catalogs.asset_statuses.map((name, index) => {
      const template = templates.find(item => item.name === name || item.matches.includes(name));
      return template ? { ...template, name, matches: [...new Set([name, ...template.matches])] } : { name, icon: 'circle-dot', tone: ['blue', 'mint', 'amber', 'violet'][index % 4], matches: [name] };
    });
  }
}
function saveDemoSystemOptions() { if (!supabase) localStorage.setItem('bcn-ckr-system-options', JSON.stringify(systemOptions)); }
async function refreshSystemOptionType(type) {
  if (!supabase || !session?.user) return true;
  const { data, error } = await supabase.from('system_options').select('*').eq('option_type', type).order('sort_order').order('value');
  if (error) { toast(`ตรวจสอบรายการ${catalogGroups.find(group => group[0] === type)?.[1] || ''}ไม่ได้: ${error.message}`, true); return false; }
  systemOptions = [...systemOptions.filter(option => option.option_type !== type), ...(data || [])];
  applySystemOptions();
  return true;
}
async function loadSystemOptions() {
  if (!supabase || !session?.user) { systemOptions = loadDemoSystemOptions(); applySystemOptions(); return; }
  const { data, error } = await supabase.from('system_options').select('*').order('option_type').order('sort_order').order('value');
  if (error) { toast(`โหลดค่าตั้งค่าไม่ได้: ${error.message}`, true); return; }
  systemOptions = data || []; applySystemOptions();
}
const catalogGroups = [
  ['asset_categories', 'ประเภทครุภัณฑ์', 'ใช้แบ่งหมวดในทะเบียนและสรุปภาพรวม'], ['asset_statuses', 'สถานะครุภัณฑ์', 'ตัวเลือกสถานะที่ใช้ในทะเบียนและสรุปภาพรวม'], ['locations', 'สถานที่ใช้งาน/จัดเก็บ', 'เช่น ห้องปฏิบัติการหรือห้องทำงาน'],
  ['departments', 'หน่วยงาน', 'หน่วยงานเจ้าของหรือรับผิดชอบครุภัณฑ์'], ['buildings', 'อาคาร', 'ชื่ออาคารภายในวิทยาลัย'], ['floors', 'ชั้น', 'ชั้นหรือระดับของอาคาร'],
  ['assignees', 'ผู้รับผิดชอบ', 'รายชื่อผู้ดูแลครุภัณฑ์'], ['material_categories', 'ประเภทวัสดุ', 'หมวดหมู่สำหรับคลังวัสดุ'],
  ['ink_types', 'ประเภทของหมึก', 'เช่น หมึกอิงค์เจ็ท หมึกเลเซอร์ หรือดรัม'], ['material_units', 'หน่วยนับวัสดุ', 'เช่น ชิ้น กล่อง ตลับ หรือรีม']
];
function canManageSettings() { return !supabase || userRole === 'super_admin'; }
function canImportAssignees() { return !supabase || ['super_admin', 'asset_manager'].includes(userRole); }
function canImportCatalog(type) { return type === 'assignees' ? canImportAssignees() : canManageSettings(); }
async function addSystemOption(type, rawValue, departmentId = null, assigneeType = '') {
  const value = String(rawValue || '').trim().replace(/\s+/g, ' ');
  if (!canManageSettings()) return toast('เฉพาะ Super Admin แก้ไขรายการตั้งค่าได้', true);
  if (!value || value.length > 100) return toast('กรอกชื่อรายการไม่เกิน 100 ตัวอักษร', true);
  if (!await refreshSystemOptionType(type)) return;
  const existing = systemOptions.find(option => option.option_type === type && option.value.toLocaleLowerCase() === value.toLocaleLowerCase());
  if (existing?.is_active !== false) {
    renderApp(); return toast('มีรายการนี้อยู่แล้ว · รายการปัจจุบันแสดงอยู่ในหน้านี้', true);
  }
  if (existing) {
    if (supabase && session?.user) { const { error } = await supabase.from('system_options').update({ is_active: true }).eq('id', existing.id); if (error) return toast(`เปิดใช้รายการไม่ได้: ${error.message}`, true); }
    existing.is_active = true;
  } else {
    const record = { option_type: type, value, is_active: true, sort_order: Math.max(-1, ...systemOptions.filter(option => option.option_type === type).map(option => Number(option.sort_order) || 0)) + 1, ...(type === 'assignees' ? { ...(departmentId ? { department_id: departmentId } : {}), ...(assigneeType ? { assignee_type: assigneeType } : {}) } : {}) };
    if (supabase && session?.user) {
      const { data, error } = await supabase.from('system_options').upsert({ ...record, created_by: session.user.id }, { onConflict: 'option_type,value' }).select().single();
      if (error) {
        if (error.code === '23505') { await loadSystemOptions(); renderApp(); return toast('มีรายการนี้อยู่แล้ว · อัปเดตรายการจากฐานข้อมูลแล้ว', true); }
        return toast(`เพิ่มรายการไม่ได้: ${error.message}`, true);
      }
      systemOptions.push(data);
    }
    else systemOptions.push({ ...record, id: `local-${type}-${Date.now()}` });
  }
  saveDemoSystemOptions(); applySystemOptions(); renderApp(); toast('เพิ่มรายการตั้งค่าแล้ว');
}
const catalogCsvTypes = new Set(['locations', 'departments', 'buildings', 'floors', 'assignees']);
const serviceHealth = { cloudflare: null, github: null, supabase: null, checkedAt: null };
async function checkServiceHealth() {
  const checks = [
    ['cloudflare', 'https://www.cloudflarestatus.com/api/v2/status.json'],
    ['github', 'https://www.githubstatus.com/api/v2/status.json']
  ];
  await Promise.all(checks.map(async ([name, url]) => {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000), cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      serviceHealth[name] = { ok: data.status?.indicator === 'none', label: data.status?.description || 'ไม่ทราบสถานะ' };
    } catch (error) { serviceHealth[name] = { ok: false, label: error.name === 'TimeoutError' ? 'หมดเวลาตรวจสอบ' : 'เชื่อมต่อไม่ได้' }; }
  }));
  if (!supabase || !session?.user) serviceHealth.supabase = { ok: false, label: isConfigured ? 'ยังไม่ได้เข้าสู่ระบบ' : 'ยังไม่ได้ตั้งค่า' };
  else {
    try {
      const { error } = await supabase.from('system_options').select('id').limit(1);
      serviceHealth.supabase = error ? { ok: false, label: error.message } : { ok: true, label: 'เชื่อมต่อฐานข้อมูลได้' };
    } catch { serviceHealth.supabase = { ok: false, label: 'เชื่อมต่อไม่ได้' }; }
  }
  serviceHealth.checkedAt = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}
function serviceHealthHtml() {
  const providers = [['cloudflare', 'Cloudflare'], ['github', 'GitHub'], ['supabase', 'Supabase']];
  return `<section class="panel service-health"><div class="catalog-card-heading"><div><h3>สถานะการเชื่อมต่อ</h3><p>ตรวจสุขภาพบริการที่ระบบใช้งาน</p></div><button type="button" class="button secondary" id="check-services">${icon('rotate-cw', 15)} ตรวจสอบอีกครั้ง</button></div><div class="service-health-grid">${providers.map(([key, label]) => { const status = serviceHealth[key]; return `<div class="service-health-item ${status ? status.ok ? 'healthy' : 'unhealthy' : 'pending'}"><span class="health-dot"></span><div><strong>${label}</strong><small>${escapeHtml(status?.label || 'ยังไม่ได้ตรวจสอบ')}</small></div><b>${status ? status.ok ? 'ปกติ' : 'ขัดข้อง' : 'รอตรวจ'}</b></div>`; }).join('')}</div><small class="health-checked">${serviceHealth.checkedAt ? `ตรวจล่าสุด ${serviceHealth.checkedAt} น.` : 'สถานะ Cloudflare/GitHub อ้างอิงหน้า platform status สาธารณะ'}</small></section>`;
}
function parseCatalogCsv(text) {
  const rows = []; let row = [], cell = '', quoted = false;
  const source = String(text || '').replace(/^\uFEFF/, '');
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') { cell += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(cell); cell = ''; }
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[index + 1] === '\n') index += 1;
      row.push(cell); if (row.some(value => value.trim())) rows.push(row);
      row = []; cell = '';
    } else cell += char;
  }
  row.push(cell); if (row.some(value => value.trim())) rows.push(row);
  return rows;
}
function catalogCsvRows(text, type) {
  const rows = parseCatalogCsv(text);
  if (!rows.length) return { entries: [], invalidCount: 0, duplicateCount: 0, missingColumns: false };
  const normalizeHeader = value => value.trim().toLocaleLowerCase().replace(/[\s_-]/g, '');
  const headers = rows[0].map(normalizeHeader);
  const findColumn = aliases => headers.findIndex(value => aliases.includes(value));
  const seen = new Set(), entries = [];
  let invalidCount = 0, duplicateCount = 0;
  let dataRows, valueColumn = 0, departmentColumn = -1, typeColumn = -1;
  if (type === 'assignees') {
    valueColumn = findColumn(['ชื่อผู้รับผิดชอบ', 'ผู้รับผิดชอบ', 'assignee', 'name', 'value']);
    departmentColumn = findColumn(['หน่วยงาน', 'department', 'unit']);
    typeColumn = findColumn(['ประเภท', 'ตำแหน่ง', 'ประเภทผู้รับผิดชอบ', 'assigneetype', 'position', 'title']);
    if (valueColumn < 0 || departmentColumn < 0) return { entries, invalidCount, duplicateCount, missingColumns: true };
    dataRows = rows.slice(1);
  } else {
    const recognized = new Set(['value', 'name', 'รายการ', 'ชื่อ', 'ชื่อรายการ', 'สถานที่', 'สถานที่ใช้งาน/จัดเก็บ', 'หน่วยงาน', 'อาคาร', 'ชั้น', 'floor']);
    const column = headers.findIndex(value => recognized.has(value));
    dataRows = column >= 0 ? rows.slice(1) : rows;
    valueColumn = column >= 0 ? column : 0;
  }
  for (const item of dataRows) {
    const value = String(item[valueColumn] || '').trim().replace(/\s+/g, ' ');
    if (!value || value.length > 100) { if (value) invalidCount += 1; continue; }
    const normalized = value.toLocaleLowerCase();
    if (seen.has(normalized)) { duplicateCount += 1; continue; }
    let departmentId = null, assigneeType = '';
    if (type === 'assignees') {
      const departmentName = String(item[departmentColumn] || '').trim();
      const department = systemOptions.find(option => option.option_type === 'departments' && option.is_active !== false && option.value.toLocaleLowerCase() === departmentName.toLocaleLowerCase());
      if (!department) { invalidCount += 1; continue; }
      departmentId = department.id;
      assigneeType = typeColumn >= 0 ? String(item[typeColumn] || '').trim().replace(/\s+/g, ' ').slice(0, 100) : '';
    }
    seen.add(normalized); entries.push({ value, departmentId, assigneeType });
  }
  return { entries, invalidCount, duplicateCount, missingColumns: false };
}
function downloadCatalogCsvTemplate(type) {
  if (!catalogCsvTypes.has(type)) return;
  const csv = type === 'assignees' ? '\ufeffหน่วยงาน,ชื่อผู้รับผิดชอบ,ประเภท\r\n' : `\ufeff${type === 'departments' ? 'หน่วยงาน' : type === 'floors' ? 'ชั้น' : 'value'}\r\n`;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: `CKR-${type}-template.csv` });
  link.click(); URL.revokeObjectURL(url); toast('ดาวน์โหลดแบบฟอร์ม CSV แล้ว');
}
async function importCatalogCsv(type, file) {
  if (!catalogCsvTypes.has(type) || !file || !canImportCatalog(type)) return;
  if (file.size > 2 * 1024 * 1024) return toast('ไฟล์ CSV ต้องมีขนาดไม่เกิน 2 MB', true);
  if (!await refreshSystemOptionType(type)) return;
  const { entries, invalidCount, duplicateCount, missingColumns } = catalogCsvRows(await file.text(), type);
  if (missingColumns) return toast('ใช้แบบฟอร์มผู้รับผิดชอบ CSV ซึ่งมีคอลัมน์ หน่วยงาน, ชื่อผู้รับผิดชอบ และประเภท', true);
  if (!entries.length) return toast(type === 'assignees' ? 'ไม่พบผู้รับผิดชอบที่นำเข้าได้ · ตรวจสอบชื่อหน่วยงานในไฟล์ให้ตรงกับตั้งค่าระบบ' : 'ไม่พบรายการที่นำเข้าได้ · ใช้คอลัมน์ value หรือชื่อรายการ', true);
  const existingByValue = new Map(systemOptions.filter(option => option.option_type === type).map(option => [option.value.toLocaleLowerCase(), option]));
  let alreadyActiveCount = 0;
  const pending = [], toReactivate = [];
  for (const entry of entries) {
    const { value } = entry;
    const existing = existingByValue.get(value.toLocaleLowerCase());
    if (existing?.is_active !== false && existing) {
      if (type === 'assignees' && (String(existing.department_id || '') !== String(entry.departmentId || '') || (existing.assignee_type || '') !== entry.assigneeType)) pending.push({ ...entry, existing });
      else alreadyActiveCount += 1;
    } else if (existing) toReactivate.push({ ...entry, existing });
    else pending.push(entry);
  }
  if (!pending.length && !toReactivate.length) {
    renderApp(); return toast(`รายการในไฟล์มีอยู่แล้ว ${alreadyActiveCount} รายการ · อัปเดตหน้าจอแล้ว`, true);
  }
  const nextOrder = Math.max(-1, ...systemOptions.filter(option => option.option_type === type).map(option => Number(option.sort_order) || 0)) + 1;
  const records = [...toReactivate.map(entry => ({ option_type: type, value: entry.value, is_active: true, sort_order: entry.existing.sort_order, ...(type === 'assignees' ? { department_id: entry.departmentId, assignee_type: entry.assigneeType || null } : {}) })), ...pending.map((entry, index) => ({ option_type: type, value: entry.value, is_active: true, sort_order: entry.existing?.sort_order ?? nextOrder + index, ...(type === 'assignees' ? { department_id: entry.departmentId, assignee_type: entry.assigneeType || null } : {}), ...(session?.user?.id ? { created_by: session.user.id } : {}) }))];
  let imported = 0, reactivated = 0;
  if (supabase && session?.user) {
    const inactiveValues = new Set(systemOptions.filter(option => option.option_type === type && option.is_active === false).map(option => option.value.toLocaleLowerCase()));
    for (let offset = 0; offset < records.length; offset += 500) {
      const { data, error } = await supabase.from('system_options').upsert(records.slice(offset, offset + 500), { onConflict: 'option_type,value' }).select();
      if (error) return toast(`นำเข้า CSV ไม่สำเร็จ: ${error.message}`, true);
      for (const item of data || []) {
        const index = systemOptions.findIndex(existing => existing.option_type === item.option_type && existing.value === item.value);
        if (index >= 0) { const wasInactive = systemOptions[index].is_active === false; systemOptions[index] = item; if (wasInactive) reactivated += 1; }
        else { systemOptions.push(item); imported += 1; }
      }
    }
  } else {
    for (const record of records) {
      const existingIndex = systemOptions.findIndex(option => option.option_type === type && option.value.toLocaleLowerCase() === record.value.toLocaleLowerCase());
      if (existingIndex >= 0) {
        const wasInactive = systemOptions[existingIndex].is_active === false;
        Object.assign(systemOptions[existingIndex], record);
        if (wasInactive) reactivated += 1;
      } else { systemOptions.push({ ...record, id: `local-${type}-${Date.now()}-${imported}` }); imported += 1; }
    }
  }
  saveDemoSystemOptions(); applySystemOptions(); renderApp();
  const skipped = alreadyActiveCount + invalidCount + duplicateCount;
  toast(`นำเข้าแล้ว ${imported} รายการ${reactivated ? ` · เปิดใช้อีกครั้ง ${reactivated}` : ''}${skipped ? ` · ข้าม ${skipped}` : ''}`);
}
async function deleteSystemOption(id) {

  const option = systemOptions.find(item => String(item.id) === String(id));
  if (!option || !canManageSettings()) return;
  if (!confirm(`ยืนยันลบรายการ “${option.value}” หรือไม่?`)) return;
  if (supabase && session?.user) {
    const { error } = await supabase.from('system_options').delete().eq('id', id);
    if (error) {
      if (error.code === '23503') return toast('ลบไม่ได้ เนื่องจากมีข้อมูลครุภัณฑ์อ้างอิงสถานะนี้อยู่', true);
      return toast(`ลบรายการไม่ได้: ${error.message}`, true);
    }
  }
  systemOptions = systemOptions.filter(item => String(item.id) !== String(id));
  saveDemoSystemOptions(); applySystemOptions(); renderApp(); toast('ลบรายการตั้งค่าแล้ว');
}
async function editSystemOption(id, rawValue, rawAssigneeType) {
  const option = systemOptions.find(item => String(item.id) === String(id));
  const value = String(rawValue || '').trim().replace(/\s+/g, ' ');
  const assigneeType = option?.option_type === 'assignees' ? String(rawAssigneeType || '').trim().replace(/\s+/g, ' ').slice(0, 100) : option?.assignee_type;
  if (!option || !canManageSettings()) return;
  if (!value || value.length > 100) return toast('กรอกชื่อรายการไม่เกิน 100 ตัวอักษร', true);
  if (systemOptions.some(item => item.id !== option.id && item.option_type === option.option_type && item.value.toLocaleLowerCase() === value.toLocaleLowerCase())) return toast('มีรายการชื่อนี้อยู่แล้ว', true);
  if (supabase && session?.user) {
    const { error } = await supabase.from('system_options').update({ value, ...(option.option_type === 'assignees' ? { assignee_type: assigneeType || null } : {}) }).eq('id', id);
    if (error) return toast(`แก้ไขรายการไม่ได้: ${error.message}`, true);
  }
  const previousValue = option.value;
  if (option.option_type === 'asset_statuses') {
    assets = assets.map(asset => asset.status === previousValue ? { ...asset, status: value } : asset);
    saveDemoAssets();
  }
  option.value = value; if (option.option_type === 'assignees') option.assignee_type = assigneeType || null; saveDemoSystemOptions(); applySystemOptions(); renderApp(); toast('แก้ไขรายการตั้งค่าแล้ว');
}
async function renderSettings(content) {
  const canEdit = canManageSettings();

  const tabGroups = {
    assets: { label: 'ครุภัณฑ์', icon: 'boxes', description: 'ประเภทและสถานะที่ใช้ในทะเบียนครุภัณฑ์', types: ['asset_categories', 'asset_statuses'] },
    places: { label: 'สถานที่และหน่วยงาน', icon: 'map-pin', description: 'กำหนดผู้รับผิดชอบภายในหน่วยงาน พร้อมสถานที่ อาคาร และชั้น', types: ['departments', 'locations', 'buildings', 'floors'] },
    materials: { label: 'คลังวัสดุ', icon: 'warehouse', description: 'หมวดวัสดุ ประเภทหมึก และหน่วยนับ', types: ['material_categories', 'ink_types', 'material_units'] }
  };
  if (!tabGroups[settingsTab]) settingsTab = 'assets';
  const cardHtml = type => {
    const [, title, description] = catalogGroups.find(group => group[0] === type);
    const options = systemOptions.filter(option => option.option_type === type);
    const optionRow = option => `<div class="catalog-option ${option.is_active === false ? 'inactive' : ''}" data-catalog-row="${escapeHtml(option.id)}"><span class="catalog-option-value">${escapeHtml(option.value)}${type === 'assignees' && option.assignee_type ? `<small class="assignee-type-tag">${escapeHtml(option.assignee_type)}</small>` : ''}</span>${canEdit ? `<div class="catalog-option-actions"><button type="button" class="catalog-edit" data-option-id="${escapeHtml(option.id)}">แก้ไข</button><button type="button" class="catalog-delete" data-option-id="${escapeHtml(option.id)}" aria-label="ลบ ${escapeHtml(option.value)}">ลบ</button></div>` : ''}</div>`;
    if (type === 'departments') {
      const assigneeOptions = systemOptions.filter(option => option.option_type === 'assignees');
      const departments = options.map(department => {
        const people = assigneeOptions.filter(option => String(option.department_id || '') === String(department.id));
        return `<div class="department-inline-card">${optionRow(department)}<details class="department-assignee-group"><summary><span>จัดการ/เพิ่มผู้รับผิดชอบ</span><small>${people.filter(person => person.is_active !== false).length} คน</small></summary>${canEdit ? `<form class="department-assignee-form" data-department-id="${escapeHtml(department.id)}"><input name="value" maxlength="100" placeholder="ชื่อผู้รับผิดชอบ เช่น ชื่อ นามสกุล" aria-label="ชื่อผู้รับผิดชอบใน ${escapeHtml(department.value)}" required/><input name="assigneeType" maxlength="100" placeholder="ประเภท/ตำแหน่ง เช่น นักวิชาการคอมพิวเตอร์" aria-label="ประเภทหรือตำแหน่งผู้รับผิดชอบ"/><button type="submit" class="button primary">เพิ่ม</button></form>` : ''}<div class="catalog-option-list">${people.map(person => `<div class="catalog-option ${person.is_active === false ? 'inactive' : ''}" data-catalog-row="${escapeHtml(person.id)}"><span class="catalog-option-value">${escapeHtml(person.value)}${person.assignee_type ? `<small class="assignee-type-tag">${escapeHtml(person.assignee_type)}</small>` : ''}</span>${canEdit ? `<div class="catalog-option-actions"><button type="button" class="catalog-edit" data-option-id="${escapeHtml(person.id)}">แก้ไข</button><button type="button" class="catalog-delete" data-option-id="${escapeHtml(person.id)}" aria-label="ลบ ${escapeHtml(person.value)}">ลบ</button></div>` : ''}</div>`).join('') || '<span class="catalog-empty">ยังไม่มีผู้รับผิดชอบในหน่วยงานนี้</span>'}</div></details></div>`;
      }).join('');
      return `<article class="panel catalog-card"><div class="catalog-card-heading"><div><h3>${title}</h3><p>เพิ่มชื่อและประเภทผู้รับผิดชอบได้ใต้หน่วยงานนั้นโดยตรง</p></div><span class="catalog-count">${options.filter(option => option.is_active !== false).length} หน่วยงาน</span></div>${canEdit ? `<form class="catalog-add-form" data-option-type="${type}"><input name="value" maxlength="100" placeholder="เพิ่ม${title}" aria-label="เพิ่ม${title}" /><button type="submit" class="button primary">เพิ่ม</button></form>` : ''}${canImportCatalog('assignees') ? `<section class="assignee-csv-tools"><div><strong>ผู้รับผิดชอบ</strong><small>นำเข้ารายชื่อพร้อมหน่วยงานและประเภท/ตำแหน่ง</small></div><div class="catalog-import-tools"><button type="button" class="catalog-import-button" data-import-type="assignees">${icon('file-up', 15)} นำเข้า CSV</button><button type="button" class="catalog-template-button" data-template-type="assignees">${icon('file-down', 15)} แบบฟอร์ม CSV</button><input type="file" accept=".csv,text/csv" data-catalog-file="assignees" hidden /></div></section>` : ''}${canEdit ? `<div class="catalog-import-tools department-assignee-import"><span>นำเข้าไฟล์รายชื่อหน่วยงาน</span><button type="button" class="catalog-import-button" data-import-type="departments">${icon('file-up', 15)} นำเข้าหน่วยงาน CSV</button><button type="button" class="catalog-template-button" data-template-type="departments">${icon('file-down', 15)} แบบฟอร์มหน่วยงาน</button><input type="file" accept=".csv,text/csv" data-catalog-file="departments" hidden /></div>` : ''}<div class="department-inline-list">${departments || '<span class="catalog-empty">ยังไม่มีหน่วยงาน · เพิ่มหน่วยงานด้านบน</span>'}</div></article>`;
    }
    return `<article class="panel catalog-card"><div class="catalog-card-heading"><div><h3>${title}</h3><p>${description}</p></div><span class="catalog-count">${options.filter(option => option.is_active !== false).length} รายการ</span></div>${canEdit ? `<form class="catalog-add-form" data-option-type="${type}"><input name="value" maxlength="100" placeholder="เพิ่ม${title}" aria-label="เพิ่ม${title}" /><button type="submit" class="button primary">เพิ่ม</button></form>` : ''}${catalogCsvTypes.has(type) && canImportCatalog(type) ? `<div class="catalog-import-tools"><button type="button" class="catalog-import-button" data-import-type="${type}">${icon('file-up', 15)} นำเข้า CSV</button><button type="button" class="catalog-template-button" data-template-type="${type}">${icon('file-down', 15)} แบบฟอร์ม CSV</button><input type="file" accept=".csv,text/csv" data-catalog-file="${type}" hidden /></div>` : ''}<div class="catalog-option-list">${options.map(optionRow).join('') || '<span class="catalog-empty">ยังไม่มีรายการ · เพิ่มรายการด้านบน</span>'}</div></article>`;
  };
  content.innerHTML = `<div class="page-heading"><div><span class="section-kicker">SYSTEM CONFIGURATION</span><h1>ตั้งค่าระบบ</h1><p>จัดการตัวเลือกทะเบียนครุภัณฑ์และคลังวัสดุ แยกตามหมวดเพื่อค้นหาได้ง่าย</p></div><button class="button secondary" id="refresh-system-options">${icon('rotate-cw', 15)} รีเฟรช</button></div>${serviceHealthHtml()}${!canEdit ? `<div class="settings-readonly">${canImportAssignees() ? 'สิทธิ์ผู้จัดการครุภัณฑ์ · นำเข้า CSV รายชื่อผู้รับผิดชอบได้' : 'สิทธิ์ผู้ดูข้อมูล · ติดต่อ Super Admin หากต้องการแก้ไขรายการ'}</div>` : ''}<nav class="settings-tabs" role="tablist" aria-label="หมวดตั้งค่าระบบ">${Object.entries(tabGroups).map(([key, tab]) => `<button type="button" role="tab" aria-selected="${settingsTab === key}" class="settings-tab ${settingsTab === key ? 'active' : ''}" data-settings-tab="${key}">${icon(tab.icon, 17)}<span>${tab.label}</span><small>${tab.types.reduce((sum, type) => sum + systemOptions.filter(option => option.option_type === type && option.is_active !== false).length, 0)}</small></button>`).join('')}</nav><section class="settings-tab-intro"><div><strong>${tabGroups[settingsTab].label}</strong><span>${tabGroups[settingsTab].description}</span></div></section><section class="settings-grid">${tabGroups[settingsTab].types.map(cardHtml).join('')}</section><p class="settings-footnote">การลบจะนำรายการออกจากตัวเลือกใหม่ ข้อมูลครุภัณฑ์และวัสดุเดิมยังคงอยู่ · รายการที่มีข้อมูลอ้างอิงจะลบไม่ได้</p>`;
  content.querySelector('#check-services').addEventListener('click', async event => { const button = event.currentTarget; button.disabled = true; button.textContent = 'กำลังตรวจสอบ…'; await checkServiceHealth(); renderApp(); });
  if (!serviceHealth.checkedAt) { checkServiceHealth().then(() => { if (view === 'settings') renderApp(); }); }
  content.querySelectorAll('[data-settings-tab]').forEach(button => button.addEventListener('click', () => { settingsTab = button.dataset.settingsTab; localStorage.setItem('bcn-ckr-settings-tab', settingsTab); renderApp(); }));
  content.querySelector('#refresh-system-options').addEventListener('click', async () => { await loadSystemOptions(); renderApp(); toast('อัปเดตรายการตั้งค่าแล้ว'); });
  content.querySelectorAll('.catalog-add-form').forEach(form => form.addEventListener('submit', async event => { event.preventDefault(); await addSystemOption(form.dataset.optionType, new FormData(form).get('value')); }));
  content.querySelectorAll('.department-assignee-form').forEach(form => form.addEventListener('submit', async event => { event.preventDefault(); const fields = new FormData(form); await addSystemOption('assignees', fields.get('value'), form.dataset.departmentId, fields.get('assigneeType')); }));
  content.querySelectorAll('.catalog-import-button').forEach(button => button.addEventListener('click', () => content.querySelector(`[data-catalog-file="${button.dataset.importType}"]`)?.click()));
  content.querySelectorAll('.catalog-template-button').forEach(button => button.addEventListener('click', () => downloadCatalogCsvTemplate(button.dataset.templateType)));
  content.querySelectorAll('[data-catalog-file]').forEach(input => input.addEventListener('change', async () => { const file = input.files?.[0]; input.value = ''; if (file) await importCatalogCsv(input.dataset.catalogFile, file); }));
  content.querySelectorAll('.catalog-delete').forEach(button => button.addEventListener('click', () => deleteSystemOption(button.dataset.optionId)));
  content.querySelectorAll('.catalog-edit').forEach(button => button.addEventListener('click', () => {
    const option = systemOptions.find(item => String(item.id) === button.dataset.optionId), row = button.closest('.catalog-option'); if (!option || !row) return;
    row.innerHTML = `<form class="catalog-edit-form"><input name="value" maxlength="100" value="${escapeHtml(option.value)}" aria-label="แก้ไข${escapeHtml(option.value)}" />${option.option_type === 'assignees' ? `<input name="assigneeType" maxlength="100" value="${escapeHtml(option.assignee_type || '')}" aria-label="แก้ไขประเภทผู้รับผิดชอบ" placeholder="ประเภท/ตำแหน่ง" />` : ''}<button type="submit" class="catalog-save">บันทึก</button><button type="button" class="catalog-cancel">ยกเลิก</button></form>`;
    const form = row.querySelector('form'); form.elements.value.focus(); form.addEventListener('submit', event => { event.preventDefault(); editSystemOption(option.id, form.elements.value.value, form.elements.assigneeType?.value); });
    row.querySelector('.catalog-cancel').addEventListener('click', () => renderApp());
  }));
  renderIcons();
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
    <div class="app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}"><aside class="sidebar"><div class="brand-lockup"><div class="brand-mark"><img class="sidebar-logo" src="/ckr-logo.jpg" alt="ตราวิทยาลัยพยาบาลบรมราชชนนี จักรีรัช" /></div><div class="brand-copy"><strong>คลังข้อมูลครุภัณฑ์</strong><small>CKR DATA CENTER</small></div><button class="sidebar-toggle" id="sidebar-toggle" type="button" aria-label="${sidebarCollapsed ? 'ขยายแถบเมนู' : 'ย่อแถบเมนู'}" title="${sidebarCollapsed ? 'ขยายแถบเมนู' : 'ย่อแถบเมนู'}">${icon(sidebarCollapsed ? 'panel-left-open' : 'panel-left-close', 17)}</button></div><div class="nav-label">เมนูหลัก</div><nav class="nav-list"><button data-view="dashboard" class="nav-item ${view === 'dashboard' ? 'active' : ''}">${icon('layout-dashboard')}<span>ภาพรวม</span></button><div class="nav-tree-group"><button data-view="assets" class="nav-item nav-parent ${view === 'assets' ? 'active' : ''}">${icon('package-search')}<span>ทะเบียนครุภัณฑ์</span><span class="nav-count">${assets.length}</span></button><button id="registry-menu-toggle" class="nav-tree-toggle" type="button" aria-label="${registryMenuExpanded ? 'ย่อเมนูย่อยทะเบียนครุภัณฑ์' : 'ขยายเมนูย่อยทะเบียนครุภัณฑ์'}" aria-expanded="${registryMenuExpanded}" aria-controls="registry-submenu">${icon(registryMenuExpanded ? 'chevron-down' : 'chevron-right', 15)}</button></div><div id="registry-submenu" class="nav-subtree ${registryMenuExpanded ? '' : 'collapsed'}" aria-label="ทะเบียนครุภัณฑ์แยกตามหมวดหมู่">${assetCategories.map(category => `<button data-category="${escapeHtml(category)}" class="nav-subitem ${view === 'assets' && categoryFilter === category ? 'active' : ''}" title="ครุภัณฑ์${escapeHtml(category)}"><span class="nav-subicon">${icon(categoryIcon(category), 16)}</span><span>ครุภัณฑ์${escapeHtml(category)}</span><small>${assets.filter(asset => asset.category === category).length}</small></button>`).join('')}</div><button data-view="materials" class="nav-item ${view === 'materials' ? 'active' : ''}">${icon('warehouse')}<span>คลังวัสดุ</span><span class="nav-pip"></span></button><button data-view="reports" class="nav-item ${view === 'reports' ? 'active' : ''}">${icon('chart-no-axes-combined')}<span>รายงาน</span></button></nav><div class="nav-label nav-label-spaced">จัดการข้อมูล</div><nav class="nav-list"><button data-view="locations" class="nav-item">${icon('map-pin')}<span>สถานที่จัดเก็บ</span></button><button data-view="people" class="nav-item">${icon('users-round')}<span>ผู้รับผิดชอบ</span></button><button data-view="settings" class="nav-item ${view === 'settings' ? 'active' : ''}">${icon('settings-2')}<span>ตั้งค่าระบบ</span></button>${userRole === 'super_admin' ? `<button data-view="users" class="nav-item ${view === 'users' ? 'active' : ''}">${icon('shield-user')}<span>กำหนดสิทธิ์ผู้ใช้</span></button>` : ''}</nav></aside>
    <main class="main-panel"><header class="topbar"><div class="crumbs"><span>ภาพรวม</span>${icon('chevron-right', 14)}<strong>${escapeHtml(activeNav)}</strong></div><div class="top-actions"><button class="icon-button" id="notifications" aria-label="การแจ้งเตือน">${icon('bell', 18)}<span class="notification-dot"></span></button><div class="top-divider"></div><button class="top-user" id="logout-button" title="ออกจากระบบ" aria-label="ออกจากระบบ ${escapeHtml(name)}"><div class="avatar small">${escapeHtml(firstChar)}</div><span>${escapeHtml(name)}</span>${icon('log-out', 15)}</button></div></header><div class="content" id="content"></div></main></div>`;
  document.querySelectorAll('.nav-item').forEach(button => { button.title = button.querySelector('span')?.textContent || ''; button.addEventListener('click', () => { if (button.classList.contains('nav-parent')) { registryMenuExpanded = !registryMenuExpanded; localStorage.setItem('bcn-ckr-registry-menu-expanded', String(registryMenuExpanded)); renderApp(); return; } const nextView = button.dataset.view; animateMenuChange = view !== nextView; view = nextView; activeNav = button.querySelector('span').textContent; if (view === 'assets') categoryFilter = 'ทั้งหมด'; if (view === 'dashboard') categoryFilter = 'ทั้งหมด'; renderApp(); }); });
  document.querySelector('#registry-menu-toggle').addEventListener('click', () => { registryMenuExpanded = !registryMenuExpanded; localStorage.setItem('bcn-ckr-registry-menu-expanded', String(registryMenuExpanded)); renderApp(); });
  document.querySelectorAll('.nav-subitem').forEach(button => button.addEventListener('click', () => { animateMenuChange = view !== 'assets' || categoryFilter !== button.dataset.category; view = 'assets'; categoryFilter = button.dataset.category; activeNav = 'ทะเบียนครุภัณฑ์ · ครุภัณฑ์' + categoryFilter; renderApp(); }));
  document.querySelector('#logout-button').addEventListener('click', signOut);
  document.querySelector('#sidebar-toggle').addEventListener('click', () => { sidebarCollapsed = !sidebarCollapsed; localStorage.setItem('bcn-ckr-sidebar-collapsed', String(sidebarCollapsed)); renderApp(); });
  document.querySelector('#notifications').addEventListener('click', () => toast('ไม่มีการแจ้งเตือนใหม่'));
  renderContent();
  if (animateMenuChange) {
    const content = document.querySelector('#content');
    content.classList.remove('menu-enter'); void content.offsetWidth; content.classList.add('menu-enter');
    content.addEventListener('animationend', () => content.classList.remove('menu-enter'), { once: true });
    animateMenuChange = false;
  }
  renderIcons();
}

function statusClass(status) { return ['ใช้งานปกติ', 'กำลังใช้งาน', 'พร้อมใช้งาน', 'เครื่องสำรอง'].includes(status) ? 'good' : ['รอซ่อม', 'ส่งซ่อม', 'ซ่อมบำรุง', 'รอแทงจำหน่าย', 'รอจำหน่าย'].includes(status) ? 'warning' : ['ใกล้ครบอายุ'].includes(status) ? 'purple' : 'muted'; }
function categoryIcon(category) { const normalized = normalizeAssetCategory(category); return ['คอมพิวเตอร์'].includes(normalized) ? 'monitor' : ['ไฟฟ้าและวิทยุ'].includes(normalized) ? 'plug-zap' : ['โฆษณาและเผยแพร่'].includes(normalized) ? 'presentation' : normalized === 'อุปกรณ์เครือข่าย' ? 'router' : normalized === 'ซอฟต์แวร์' ? 'app-window' : 'printer'; }
const defaultStatusMetrics = [
  { name: 'พร้อมใช้งาน', icon: 'badge-check', tone: 'mint', matches: ['พร้อมใช้งาน'] },
  { name: 'กำลังใช้งาน', icon: 'monitor-check', tone: 'blue', matches: ['กำลังใช้งาน', 'ใช้งานปกติ'] },
  { name: 'เครื่องสำรอง', icon: 'package-check', tone: 'violet', matches: ['เครื่องสำรอง'] },
  { name: 'ซ่อมบำรุง', icon: 'wrench', tone: 'amber', matches: ['ซ่อมบำรุง', 'รอซ่อม', 'ส่งซ่อม'] },
  { name: 'รอแทงจำหน่าย', icon: 'clock-3', tone: 'orange', matches: ['รอแทงจำหน่าย', 'รอจำหน่าย'] },
  { name: 'แทงจำหน่าย', icon: 'archive', tone: 'slate', matches: ['แทงจำหน่าย', 'จำหน่ายแล้ว'] },
];
let statusMetrics = defaultStatusMetrics;
function statusCount(metric) { return assets.filter(asset => metric.matches.includes(asset.status)).length; }
function categoryCount(name) { return assets.filter(asset => normalizeAssetCategory(asset.category) === normalizeAssetCategory(name)).length; }
function datalistOptions(id, values) { return `<datalist id="${id}">${(values || []).map(value => `<option value="${escapeHtml(value)}"></option>`).join('')}</datalist>`; }
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
  return `<section class="analytics-grid premium-dashboard-charts" aria-label="กราฟสรุปข้อมูล"><article class="panel chart-panel"><div class="panel-heading"><div><h3>สัดส่วนตามหมวดหมู่</h3><p>Premium Pie Chart · ${categoryTotal} รายการ</p></div><span class="chart-kicker">CATEGORY</span></div><div class="pie-layout"><div class="pie-chart" style="background:${categoryTotal ? `conic-gradient(${pieStops.join(',')})` : '#e4eef0'}"><span>${categoryTotal}</span></div><div class="pie-legend">${categories.map((item, index) => `<div class="pie-legend-row"><i class="chart-color-${index % 4}"></i><span>${escapeHtml(item.name)}</span><strong>${item.count}</strong></div>`).join('')}</div></div></article><article class="panel chart-panel"><div class="panel-heading"><div><h3>สถานะการใช้งาน</h3><p>Premium Bar Chart · จำนวนตามสถานะ</p></div><span class="chart-kicker">STATUS</span></div><div class="horizontal-bars">${barRows(statusMetrics.map(metric => ({ name: metric.name, count: statusCount(metric) })), Math.max(1, ...statusMetrics.map(statusCount)))}</div></article><article class="panel chart-panel"><div class="panel-heading"><div><h3>สรุปตามปีงบประมาณ</h3><p>นับจากวันที่จัดซื้อ · 1 ต.ค. ถึง 30 ก.ย.</p></div><span class="chart-kicker">FISCAL YEAR</span></div><div class="fiscal-chart">${fiscalYears.length ? fiscalYears.map((item, index) => `<div class="fiscal-column"><span class="fiscal-count">${item.count}</span><div class="fiscal-track"><i class="chart-color-${index % 4}" style="height:${Math.max(item.count ? 6 : 0, item.count / Math.max(1, ...fiscalYears.map(year => year.count)) * 100)}%"></i></div><span class="fiscal-label">${item.label.replace('ปีงบประมาณ ', '')}</span></div>`).join('') : '<div class="chart-empty">ยังไม่มีวันที่จัดซื้อสำหรับสรุป</div>'}</div></article><article class="panel chart-panel"><div class="panel-heading"><div><h3>ข้อมูลแต่ละอาคาร</h3><p>Premium Bar Chart · แยกจากสถานที่จัดเก็บ</p></div><span class="chart-kicker">BUILDING</span></div><div class="horizontal-bars">${barRows(buildings, Math.max(1, ...buildings.map(item => item.count)))}</div></article></section>`;
}

function renderContent() {
  const content = document.querySelector('#content');
  if (view === 'users') { renderUserAccess(content); return; }
  if (view === 'settings') { renderSettings(content); return; }
  if (view === 'materials') { renderMaterialsPage({ content, supabase, session, userRole, catalogs, icon, renderIcons, toast, escapeHtml }); return; }
  if (view !== 'dashboard' && view !== 'assets') { content.innerHTML = `<div class="page-heading"><div><span class="section-kicker">WORKSPACE</span><h1>${escapeHtml(activeNav)}</h1><p>ส่วนนี้เตรียมไว้สำหรับการจัดการ${escapeHtml(activeNav)}ในขั้นถัดไป</p></div></div><div class="empty-module">${icon('layers-3', 28)}<strong>กำลังเตรียมพื้นที่ทำงาน</strong><span>ข้อมูลทะเบียนครุภัณฑ์และภาพรวมพร้อมใช้งานแล้ว</span><button class="button secondary" id="go-assets">ไปที่ทะเบียนครุภัณฑ์ ${icon('arrow-right', 15)}</button></div>`; document.querySelector('#go-assets').addEventListener('click', () => { view = 'assets'; activeNav = 'ทะเบียนครุภัณฑ์'; renderApp(); }); renderIcons(); return; }
  const scopedAssets = view === 'assets' && categoryFilter !== 'ทั้งหมด' ? assets.filter(asset => normalizeAssetCategory(asset.category) === normalizeAssetCategory(categoryFilter)) : assets;
  const total = scopedAssets.length;
  const scopedStatusCount = metric => scopedAssets.filter(asset => metric.matches.includes(asset.status)).length;
  const scopedCategoryCount = category => scopedAssets.filter(asset => normalizeAssetCategory(asset.category) === normalizeAssetCategory(category)).length;
  const statusCards = statusMetrics.map(metric => `<article class="metric-card premium-status-card status-${metric.tone}"><div class="metric-top"><span>${metric.name}</span><div class="metric-icon ${metric.tone}">${icon(metric.icon, 19)}</div></div><div class="metric-value">${scopedStatusCount(metric)}<small>รายการ</small></div><div class="metric-foot"><span>${metric.name === 'พร้อมใช้งาน' ? 'ไม่นับรวมแทงจำหน่ายแล้ว' : metric.name === 'แทงจำหน่าย' ? 'จำหน่ายออกแล้ว' : 'สถานะปัจจุบัน'}</span></div></article>`).join('');
  const pageTitle = view === 'dashboard' ? 'ภาพรวมครุภัณฑ์' : categoryFilter === 'ทั้งหมด' ? 'ทะเบียนครุภัณฑ์' : `ทะเบียนครุภัณฑ์ · ครุภัณฑ์${escapeHtml(normalizeAssetCategory(categoryFilter))}`;
  content.innerHTML = `<div class="page-heading"><div><h1>${pageTitle}</h1><p>ติดตามสถานะครุภัณฑ์ของวิทยาลัยพยาบาลบรมราชชนนี จักรีรัชได้ในภาพเดียว</p></div>${view === 'assets' ? `<div class="heading-actions">${canManageAssets() ? `<button id="import-assets" class="button secondary">${icon('file-up', 16)} นำเข้า CSV</button><button id="asset-csv-template" class="button secondary">${icon('file-down', 16)} แบบฟอร์ม CSV</button>` : ''}<button id="export-button" class="button secondary">${icon('download', 16)} ส่งออกรายงาน</button>${canManageAssets() ? `<button id="add-asset" class="button primary">${icon('plus', 17)} เพิ่มครุภัณฑ์</button><input id="asset-import-file" type="file" accept=".csv,text/csv" hidden />` : ''}</div>` : ''}</div>
  ${view === 'dashboard' ? `<section class="welcome-banner"><div class="welcome-text"><div class="welcome-tag">${icon('sparkles', 14)} YOUR ASSET COMMAND CENTER</div><h2>ทุกสินทรัพย์ <span>พร้อมจัดการ</span></h2><p>ภาพรวมข้อมูลครุภัณฑ์งานเทคโนโลยีสารสนเทศ ประจำวิทยาลัย</p><button id="view-all" class="welcome-link">ดูทะเบียนครุภัณฑ์ทั้งหมด ${icon('arrow-right', 15)}</button></div><div class="banner-visual"><div class="visual-orbit orbit-one"></div><div class="visual-orbit orbit-two"></div><div class="visual-core">${icon('boxes', 34)}</div><div class="float-chip chip-a">${icon('monitor', 15)} ${total} รายการ</div><div class="float-chip chip-b">${icon('shield-check', 15)} พร้อมใช้งาน</div><div class="visual-sparkle sparkle-a">✳</div><div class="visual-sparkle sparkle-b">✦</div></div></section>` : ''}
  <section class="metric-grid category-metrics ${view === 'dashboard' ? 'dashboard-premium-category' : ''} ${categoryFilter === 'ทั้งหมด' ? '' : 'category-summary-single'}" aria-label="สถิติตามประเภทครุภัณฑ์"><article class="metric-card ${categoryFilter === 'ทั้งหมด' ? '' : 'premium-total-card'}"><div class="metric-top"><span>${categoryFilter === 'ทั้งหมด' ? 'ครุภัณฑ์ทั้งหมด' : `ครุภัณฑ์${escapeHtml(normalizeAssetCategory(categoryFilter))}`}</span><div class="metric-icon violet">${icon('boxes', 19)}</div></div><div class="metric-value">${total}<small>รายการ</small></div><div class="metric-foot"><span>${categoryFilter === 'ทั้งหมด' ? 'ทุกประเภท' : 'จำนวนครุภัณฑ์ในหมวดนี้'}</span></div></article>${categoryFilter === 'ทั้งหมด' ? assetCategories.map((category, index) => `<article class="metric-card"><div class="metric-top"><span>ครุภัณฑ์${escapeHtml(normalizeAssetCategory(category))}</span><div class="metric-icon ${['blue', 'amber', 'mint', 'violet'][index % 4]}">${icon(categoryIcon(category), 19)}</div></div><div class="metric-value">${scopedCategoryCount(category)}<small>รายการ</small></div><div class="metric-foot"><span>${total ? Math.round(scopedCategoryCount(category) / total * 100) : 0}% ของครุภัณฑ์ทั้งหมด</span></div></article>`).join('') : statusCards}</section>
  ${categoryFilter === 'ทั้งหมด' ? `<section class="metric-grid status-metrics ${view === 'dashboard' ? 'dashboard-premium-status' : ''}" aria-label="สถิติตามสถานะครุภัณฑ์">${statusCards}</section>` : ''}
  ${view === 'dashboard' ? renderDashboardCharts() : ''}
  <section class="panel asset-panel"><div class="asset-panel-head"><div><h3>${view === 'dashboard' ? 'รายการครุภัณฑ์ทั้งหมด' : categoryFilter === 'ทั้งหมด' ? 'รายการครุภัณฑ์' : `รายการครุภัณฑ์${escapeHtml(normalizeAssetCategory(categoryFilter))}`}</h3><p>ทะเบียนครุภัณฑ์งานเทคโนโลยีสารสนเทศ</p></div><button class="view-all" id="view-all-assets">ดูทั้งหมด ${icon('arrow-right', 14)}</button></div><div class="table-toolbar"><div class="search-box">${icon('search', 16)}<input id="asset-search" placeholder="ค้นหาชื่อ, รหัสครุภัณฑ์..." value="${escapeHtml(searchTerm)}"/><kbd>⌘ K</kbd></div><div class="filters"><select id="category-filter"><option value="ทั้งหมด">ทั้งหมด</option>${[...new Set([...assetCategories, ...assets.map(a => normalizeAssetCategory(a.category))])].map(c => `<option value="${escapeHtml(c)}" ${normalizeAssetCategory(categoryFilter) === c ? 'selected' : ''}>ครุภัณฑ์${escapeHtml(c)}</option>`).join('')}</select><select id="status-filter"><option>ทั้งหมด</option>${[...new Set(assets.map(a => a.status))].map(s => `<option ${statusFilter === s ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('')}</select><button class="filter-button" id="refresh-button">${icon('rotate-cw', 15)} รีเฟรช</button></div></div><div class="table-scroll"><table><thead><tr><th>รหัส / รายการ</th><th>หมวดหมู่</th><th>สถานที่จัดเก็บ</th><th>ผู้รับผิดชอบ</th><th>สถานะ</th><th>ราคาจัดซื้อ</th><th></th></tr></thead><tbody id="asset-rows">${tableRows()}</tbody></table></div><div class="table-bottom"><span>แสดง <strong id="row-count">${filteredAssets().length}</strong> จาก ${total} รายการ</span><div class="pagination"><button disabled>${icon('chevron-left', 15)}</button><button class="current-page">1</button><button disabled>2</button><button disabled>3</button><span>…</span><button disabled>12</button><button disabled>${icon('chevron-right', 15)}</button></div></div></section><footer class="app-footer"><span class="app-legal">© 2026 วิทยาลัยพยาบาลบรมราชชนนี จักรีรัช · คณะพยาบาลศาสตร์ สถาบันพระบรมราชชนก</span><span>BCN CKR IT ASSET SYSTEM <i class="footer-dot"></i> v0.1.0</span></footer>`;
  document.querySelector('#add-asset')?.addEventListener('click', openAssetModal);
  document.querySelector('#export-button')?.addEventListener('click', exportCsv);
  document.querySelector('#asset-csv-template')?.addEventListener('click', downloadAssetCsvTemplate);
  document.querySelector('#import-assets')?.addEventListener('click', () => document.querySelector('#asset-import-file')?.click());
  document.querySelector('#asset-import-file')?.addEventListener('change', async event => { const file = event.target.files?.[0]; if (file) await importAssetsCsv(file); event.target.value = ''; });
  document.querySelector('#view-all')?.addEventListener('click', () => { view = 'assets'; categoryFilter = 'ทั้งหมด'; activeNav = 'ทะเบียนครุภัณฑ์'; renderApp(); });
  document.querySelector('#view-all-assets').addEventListener('click', () => { view = 'assets'; categoryFilter = 'ทั้งหมด'; activeNav = 'ทะเบียนครุภัณฑ์'; renderApp(); });
  document.querySelector('#asset-search').addEventListener('input', e => { searchTerm = e.target.value; updateRows(); });
  document.querySelector('#category-filter').addEventListener('change', e => { categoryFilter = e.target.value; if (view === 'assets') { activeNav = categoryFilter === 'ทั้งหมด' ? 'ทะเบียนครุภัณฑ์' : `ทะเบียนครุภัณฑ์ · ครุภัณฑ์${categoryFilter}`; renderApp(); } else updateRows(); });
  document.querySelector('#status-filter').addEventListener('change', e => { statusFilter = e.target.value; updateRows(); });
  document.querySelector('#refresh-button').addEventListener('click', async () => { await loadAssets(); renderContent(); toast('อัปเดตข้อมูลแล้ว'); });
  document.querySelector('#asset-rows').addEventListener('click', e => { const button = e.target.closest('[data-delete]'); if (button) deleteAsset(button.dataset.delete); });
  renderIcons(); loadAssetThumbnails();
}

function categorySummary() { return assetCategories.map(name => ({ name, count: categoryCount(name) })); }
function filteredAssets() { return assets.filter(a => (!searchTerm || `${a.asset_code} ${a.name} ${a.brand} ${a.serial_number}`.toLowerCase().includes(searchTerm.toLowerCase())) && (categoryFilter === 'ทั้งหมด' || normalizeAssetCategory(a.category) === normalizeAssetCategory(categoryFilter)) && (statusFilter === 'ทั้งหมด' || a.status === statusFilter)); }

async function loadAssetThumbnails() {
  if (!supabase) return;
  const images = [...document.querySelectorAll('.asset-thumb[data-image-path]')];
  await Promise.all(images.map(async image => {
    const { data, error } = await supabase.storage.from('it-asset-images').createSignedUrl(image.dataset.imagePath, 1800);
    if (!error && data?.signedUrl && image.isConnected) image.src = data.signedUrl;
  }));
}

function primaryAssetImage(asset) { return Array.isArray(asset.image_paths) && asset.image_paths.length ? asset.image_paths[0] : asset.image_path; }
function tableRows() { const rows = filteredAssets().slice(0, view === 'dashboard' ? 5 : 100); if (!rows.length) return `<tr><td colspan="7"><div class="table-empty">${icon('search-x', 21)}<span>ไม่พบรายการที่ตรงกับการค้นหา</span></div></td></tr>`; return rows.map(a => { const imagePath = primaryAssetImage(a); return `<tr><td><div class="asset-name-cell"><div class="asset-type-icon ${categoryIcon(a.category) === 'monitor' ? 'icon-purple' : categoryIcon(a.category) === 'router' ? 'icon-blue' : 'icon-orange'}">${imagePath ? `<img class="asset-thumb" data-image-path="${escapeHtml(imagePath)}" alt="${escapeHtml(a.name)}" />` : icon(categoryIcon(a.category), 17)}</div><div><strong>${escapeHtml(a.name)}</strong><span>${escapeHtml(a.asset_code)} <i>·</i> ${escapeHtml(a.brand || 'ไม่ระบุยี่ห้อ')}</span></div></div></td><td><span class="category-chip">ครุภัณฑ์${escapeHtml(normalizeAssetCategory(a.category))}</span></td><td><span class="location-cell">${icon('map-pin', 13)} ${escapeHtml([a.building, a.floor, a.location].filter(Boolean).join(' · ') || '—')}</span></td><td><span class="owner-cell"><span class="owner-avatar">${escapeHtml((a.assignee || a.department || 'IT')[0])}</span>${escapeHtml(a.assignee || a.department || 'งาน IT')}</span></td><td><span class="status-pill ${statusClass(a.status)}"><i></i>${escapeHtml(a.status)}</span></td><td class="price-cell">${money(a.price)}</td><td>${userRole === 'super_admin' || !supabase ? `<button class="row-more" data-delete="${escapeHtml(a.id)}" title="ลบรายการ">${icon('ellipsis', 17)}</button>` : ''}</td></tr>`; }).join(''); }
function updateRows() { document.querySelector('#asset-rows').innerHTML = tableRows(); document.querySelector('#row-count').textContent = filteredAssets().length; renderIcons(); loadAssetThumbnails(); }

function cleanPathPart(value) { return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').trim().replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || 'item'; }
function thaiFiscalYear(dateValue) {
  if (!dateValue) return '';
  const date = new Date(dateValue + 'T00:00:00');
  return Number.isNaN(date.getTime()) ? '' : date.getFullYear() + 543 + (date.getMonth() >= 9 ? 1 : 0);
}
function openAssetModal() {
  const modal = document.createElement('div'); modal.className = 'modal-backdrop';
  const fieldLabel = (_name, text) => '<label class="field-label">' + text + '</label>';
  const selectOptions = (values, placeholder) => '<option value="">' + placeholder + '</option>' + (values || []).map(item => '<option value="' + escapeHtml(item) + '">' + escapeHtml(item) + '</option>').join('');
  const categories = selectOptions(assetCategories, 'เลือกประเภทครุภัณฑ์');
  const statuses = selectOptions(statusMetrics.map(item => item.name), 'เลือกสถานะ');
  const locations = selectOptions(catalogs.locations, catalogs.locations.length ? 'เลือกสถานที่' : 'เพิ่มสถานที่ในตั้งค่าระบบ');
  const departments = selectOptions(catalogs.departments, catalogs.departments.length ? 'เลือกหน่วยงาน' : 'เพิ่มหน่วยงานในตั้งค่าระบบ');
  const floors = selectOptions(catalogs.floors, catalogs.floors.length ? 'เลือกชั้น' : 'เพิ่มชั้นในตั้งค่าระบบ');
  const buildings = selectOptions(catalogs.buildings, catalogs.buildings.length ? 'เลือกอาคาร' : 'เพิ่มอาคารในตั้งค่าระบบ');
  const assignees = selectOptions([], 'เลือกหน่วยงานก่อน');
  modal.innerHTML = '<section class="asset-modal"><div class="modal-head"><div><span class="section-kicker">ASSET REGISTRY</span><h2>เพิ่มครุภัณฑ์ใหม่</h2></div><button class="icon-button" id="close-modal" aria-label="ปิด">×</button></div>' +
    '<form id="asset-form"><div class="form-grid">' +
    '<div class="field">' + fieldLabel('barcode', 'เลขครุภัณฑ์', 'blue') + '<input name="asset_code" placeholder="เช่น 7440-001-001/1" /></div>' +
    '<div class="field">' + fieldLabel('package', 'ชื่อผลิตภัณฑ์', 'violet') + '<input name="name" placeholder="ชื่อผลิตภัณฑ์" /></div>' +
    '<div class="field">' + fieldLabel('tags', 'ประเภท', 'amber') + '<select name="category">' + categories + '</select></div>' +
    '<div class="field">' + fieldLabel('calendar-days', 'วันที่ได้รับ', 'blue') + '<input name="received_date" type="date" /></div>' +
    '<div class="field">' + fieldLabel('calendar-range', 'ปีงบประมาณ', 'violet') + '<input name="fiscal_year" type="number" min="2500" max="3000" placeholder="เช่น 2569" /></div>' +
    '<div class="field">' + fieldLabel('map-pin', 'สถานที่', 'mint') + '<select name="location">' + locations + '</select></div>' +
    '<div class="field">' + fieldLabel('landmark', 'หน่วยงาน', 'teal') + '<select name="department">' + departments + '</select></div>' +
    '<div class="field">' + fieldLabel('layers', 'ชั้น', 'blue') + '<select name="floor">' + floors + '</select></div>' +
    '<div class="field">' + fieldLabel('building', 'อาคาร', 'amber') + '<select name="building">' + buildings + '</select></div>' +
    '<div class="field assignee-picker-field">' + fieldLabel('user-round', 'ผู้รับผิดชอบ (อยู่ภายใต้หน่วยงาน)', 'violet') + '<select name="assignee" disabled>' + assignees + '</select><input name="assigneeSearch" type="search" placeholder="เลือกหน่วยงานก่อนค้นหารายชื่อ" aria-label="ค้นหารายชื่อผู้รับผิดชอบ" autocomplete="off" disabled /><small class="assignee-picker-hint">ตั้งชื่อและประเภทได้ที่ ตั้งค่าระบบ → สถานที่และหน่วยงาน → ขยายหน่วยงานที่ต้องการ</small></div>' +
    '<div class="field">' + fieldLabel('shield-check', 'สถานะ', 'mint') + '<select name="status">' + statuses + '</select></div>' +
    '<div class="field image-field">' + fieldLabel('image', 'ภาพอุปกรณ์ (สูงสุด 2 ภาพ)') + '<div class="image-actions"><button type="button" class="image-action image-action-camera" id="take-asset-photo">ถ่ายรูปใหม่</button><button type="button" class="image-action" id="choose-asset-image">เลือกจากเครื่อง</button></div><input id="asset-image" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden /><input id="asset-camera" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden /><div id="asset-image-preview" class="asset-image-preview" tabindex="0"><span>วางรูปภาพด้วย Ctrl+V หรือเลือกรูป JPG, PNG, WebP ไม่เกิน 10 MB</span></div><small>เลือกรูปได้ 1–2 ภาพ · จัดเก็บแยกตามหมวดหมู่และเลขครุภัณฑ์</small></div>' +
    '</div><details class="optional-asset-details"><summary>ข้อมูลเพิ่มเติม</summary><div class="form-grid">' +
    '<div class="field">' + fieldLabel('tag', 'ยี่ห้อ / รุ่น', 'blue') + '<input name="brand" placeholder="ระบุยี่ห้อและรุ่น" /></div>' +
    '<div class="field">' + fieldLabel('hard-drive', 'หมายเลขเครื่อง (S/N)', 'teal') + '<input name="serial_number" placeholder="Serial number" /></div>' +
    '</div></details><div class="modal-actions"><button type="button" class="button secondary" id="cancel-modal">ยกเลิก</button><button type="submit" class="button primary" id="save-asset">บันทึกครุภัณฑ์</button></div></form></section>';
  document.body.append(modal); renderIcons();
  const form = modal.querySelector('#asset-form'), imageInput = modal.querySelector('#asset-image'), cameraInput = modal.querySelector('#asset-camera');
  let departmentAssignees = [];
  const renderAssigneeOptions = (preserveSelection = false) => {
    const select = form.elements.assignee, search = form.elements.assigneeSearch;
    const previous = preserveSelection ? select.value : '';
    const query = search.value.trim().toLocaleLowerCase();
    const matches = departmentAssignees.filter(option => option.value.toLocaleLowerCase().includes(query));
    select.innerHTML = selectOptions(matches.map(option => option.value), departmentAssignees.length ? (matches.length ? 'เลือกผู้รับผิดชอบ' : 'ไม่พบรายชื่อที่ค้นหา') : 'ไม่พบรายชื่อในหน่วยงานนี้');
    select.disabled = !departmentAssignees.length;
    if (previous && matches.some(option => option.value === previous)) select.value = previous;
    const hint = form.querySelector('.assignee-picker-hint');
    hint.textContent = departmentAssignees.length ? `พบ ${departmentAssignees.length} รายชื่อในหน่วยงานนี้` : 'ยังไม่มีรายชื่อผู้รับผิดชอบในหน่วยงานนี้';
  };
  const updateAssigneeOptions = () => {
    const department = systemOptions.find(option => option.option_type === 'departments' && option.value === form.elements.department.value);
    departmentAssignees = systemOptions.filter(option => option.option_type === 'assignees' && option.is_active !== false && department && String(option.department_id || '') === String(department.id));
    form.elements.assigneeSearch.value = '';
    form.elements.assigneeSearch.disabled = !department;
    renderAssigneeOptions();
  };
  form.elements.department.addEventListener('change', updateAssigneeOptions);
  form.elements.assigneeSearch.addEventListener('input', () => renderAssigneeOptions(true));
  const preview = modal.querySelector('#asset-image-preview'), saveButton = modal.querySelector('#save-asset');
  const selectedImages = [null, null];
  const previewUrls = new Map();
  const chooseImage = modal.querySelector('#choose-asset-image'), takePhoto = modal.querySelector('#take-asset-photo');
  chooseImage.onclick = () => imageInput.click(); takePhoto.onclick = () => cameraInput.click();
  const renderImagePreview = () => {
    preview.innerHTML = selectedImages.map((file, index) => {
      if (!file) return '';
      if (!previewUrls.has(file)) previewUrls.set(file, URL.createObjectURL(file));
      return '<div class="asset-image-item"><img alt="ภาพครุภัณฑ์ ' + (index + 1) + '" src="' + previewUrls.get(file) + '" /><button type="button" class="asset-image-remove" data-remove-image="' + index + '" aria-label="นำภาพออก">×</button></div>';
    }).join('') || '<span>วางรูปภาพด้วย Ctrl+V หรือเลือกรูป JPG, PNG, WebP ไม่เกิน 10 MB</span>';
  };
  const setImage = file => {
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) { toast('กรุณาเลือกภาพ JPG, PNG หรือ WebP ขนาดไม่เกิน 10 MB', true); return; }
    const emptySlot = selectedImages.findIndex(image => !image);
    if (emptySlot < 0) { toast('เพิ่มภาพได้สูงสุด 2 ภาพ · กด × บนภาพเพื่อเปลี่ยน', true); return; }
    selectedImages[emptySlot] = file; renderImagePreview();
  };
  imageInput.addEventListener('change', () => { Array.from(imageInput.files || []).forEach(setImage); imageInput.value = ''; });
  cameraInput.addEventListener('change', () => setImage(cameraInput.files?.[0]));
  preview.addEventListener('click', event => { const remove = event.target.closest('[data-remove-image]'); if (!remove) return; const index = Number(remove.dataset.removeImage), file = selectedImages[index]; selectedImages[index] = null; if (file && previewUrls.has(file)) { URL.revokeObjectURL(previewUrls.get(file)); previewUrls.delete(file); } renderImagePreview(); });
  modal.addEventListener('paste', event => { const imageItem = Array.from(event.clipboardData?.items || []).find(item => item.type.startsWith('image/')); const file = imageItem?.getAsFile(); if (file) { event.preventDefault(); setImage(file); } });
  form.elements.received_date.addEventListener('change', () => { form.elements.fiscal_year.value = thaiFiscalYear(form.elements.received_date.value); });
  const close = () => { for (const url of previewUrls.values()) URL.revokeObjectURL(url); previewUrls.clear(); modal.remove(); }; modal.querySelector('#close-modal').onclick = close; modal.querySelector('#cancel-modal').onclick = close;
  modal.onclick = event => { if (event.target === modal) close(); };
  form.onsubmit = async event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form));
    const files = selectedImages.map((file, index) => file ? { file, index } : null).filter(Boolean);
    const record = { asset_code: String(values.asset_code || '').trim() || null, name: String(values.name || '').trim() || null, category: values.category || 'อื่น ๆ',
      received_date: values.received_date || null, purchase_date: values.received_date || null, fiscal_year: Number(values.fiscal_year) || null,
      location: String(values.location || '').trim() || null, department: String(values.department || '').trim() || null, floor: String(values.floor || '').trim() || null,
      building: String(values.building || '').trim() || null, assignee: String(values.assignee || '').trim() || null, status: values.status || 'พร้อมใช้งาน',
      brand: String(values.brand || '').trim() || null, serial_number: String(values.serial_number || '').trim() || null,
      price: Number(values.price) || 0, image_path: null, image_paths: [] };
    saveButton.disabled = true; saveButton.textContent = 'กำลังบันทึก…';
    const uploadedPaths = [];
    if (supabase && session?.user && record.asset_code) {
      const { data: existingAsset, error: duplicateCheckError } = await supabase.from('it_assets').select('id').eq('asset_code', record.asset_code).maybeSingle();
      if (duplicateCheckError) { toast('ตรวจสอบเลขครุภัณฑ์ไม่สำเร็จ: ' + duplicateCheckError.message, true); saveButton.disabled = false; saveButton.textContent = 'บันทึกครุภัณฑ์'; return; }
      if (existingAsset) { toast('เลขครุภัณฑ์นี้มีในระบบแล้ว กรุณาตรวจสอบก่อนบันทึก', true); saveButton.disabled = false; saveButton.textContent = 'บันทึกครุภัณฑ์'; return; }
    }
    if (files.length && supabase && session?.user) {
      const categoryFolder = ({ 'คอมพิวเตอร์': 'computer', 'ไฟฟ้าและวิทยุ': 'electrical-radio', 'โฆษณาและเผยแพร่': 'advertising-media' })[record.category] || 'other';
      const assetPart = cleanPathPart(record.asset_code || '');
      const stableAssetPart = assetPart === 'item' ? 'asset-' + crypto.randomUUID() : assetPart;
      for (const { file, index } of files) {
        const productPart = cleanPathPart(record.name || 'equipment');
        const path = `${categoryFolder}/${stableAssetPart}-${productPart}-${index + 1}.img`;
        const { error: uploadError } = await supabase.storage.from('it-asset-images').upload(path, file, { contentType: file.type, upsert: true });
        if (uploadError) {
          toast(`อัปโหลดภาพไม่สำเร็จ (${file.name}): ${uploadError.message}`, true); saveButton.disabled = false; saveButton.textContent = 'บันทึกครุภัณฑ์'; return;
        }
        uploadedPaths[index] = path;
      }
      record.image_paths = uploadedPaths.filter(Boolean);
      record.image_path = record.image_paths[0] || null;
    }
    if (supabase && session?.user) {
      const { data, error } = await supabase.from('it_assets').insert({ ...record, created_by: session.user.id }).select().single();
      if (error) { toast('บันทึกไม่สำเร็จ: ' + error.message, true); saveButton.disabled = false; saveButton.textContent = 'บันทึกครุภัณฑ์'; return; }
      assets.unshift(data);
    } else { if (files.length) toast('โหมดตัวอย่างไม่สามารถจัดเก็บภาพถาวรได้', true); assets.unshift({ ...record, id: 'local-' + Date.now() }); }
    close(); renderContent(); renderIcons(); toast('เพิ่มครุภัณฑ์เรียบร้อย');
  };
}
async function deleteAsset(id) { if (userRole !== 'super_admin' && supabase) return toast('เฉพาะ Super Admin ลบครุภัณฑ์ได้', true); const target = assets.find(a => String(a.id) === String(id)); if (!target || !confirm(`ยืนยันลบ “${target.name}” (${target.asset_code}) หรือไม่?`)) return; if (supabase && session?.user) { const { error } = await supabase.from('it_assets').delete().eq('id', id); if (error) return toast(`ลบไม่สำเร็จ: ${error.message}`, true); } assets = assets.filter(a => String(a.id) !== String(id)); renderContent(); renderIcons(); toast('ลบรายการแล้ว'); }

function exportCsv() { const headers = ['เลขครุภัณฑ์', 'ชื่อผลิตภัณฑ์', 'ประเภท', 'วันที่ได้รับ', 'ปีงบประมาณ', 'สถานที่', 'หน่วยงาน', 'ชั้น', 'อาคาร', 'ผู้รับผิดชอบ', 'สถานะ', 'ภาพอุปกรณ์', 'ยี่ห้อ / รุ่น', 'หมายเลขเครื่อง', 'ราคา']; const rows = filteredAssets().map(a => [a.asset_code, a.name, a.category, a.received_date || a.purchase_date, a.fiscal_year || thaiFiscalYear(a.received_date || a.purchase_date), a.location, a.department, a.floor, a.building, a.assignee, a.status, a.image_path, a.brand, a.serial_number, a.price]); const csv = '\ufeff' + [headers, ...rows].map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n'); const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })), download: `BCN CKR-IT-assets-${new Date().toISOString().slice(0,10)}.csv` }); a.click(); URL.revokeObjectURL(a.href); toast('ส่งออกรายงาน CSV แล้ว'); }

const assetCsvHeaders = ['เลขครุภัณฑ์', 'ชื่อผลิตภัณฑ์', 'ประเภท', 'วันที่ได้รับ', 'ปีงบประมาณ', 'สถานที่', 'หน่วยงาน', 'ชั้น', 'อาคาร', 'ผู้รับผิดชอบ', 'สถานะ', 'ภาพอุปกรณ์', 'ยี่ห้อ / รุ่น', 'หมายเลขเครื่อง', 'ราคา'];
function csvCell(value) { return `"${String(value ?? '').replaceAll('"', '""')}"`; }
function downloadAssetCsvTemplate() {
  const example = ['7440-001-001/1', 'เครื่องคอมพิวเตอร์ตัวอย่าง', 'คอมพิวเตอร์', '2026-10-01', '2569', 'ห้องปฏิบัติการ', 'งานเทคโนโลยีสารสนเทศ', '2', 'อาคาร 1', 'ชื่อผู้รับผิดชอบ', 'พร้อมใช้งาน', '', 'ยี่ห้อ / รุ่น', 'SERIAL-001', '25000'];
  const csv = '\ufeff' + [assetCsvHeaders, example].map(row => row.map(csvCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: 'CKR-assets-template.csv' });
  link.click(); URL.revokeObjectURL(url);
}
function parseCsv(text) {
  const delimiter = (text.split(/\r?\n/, 1)[0].match(/;/g) || []).length > (text.split(/\r?\n/, 1)[0].match(/,/g) || []).length ? ';' : ',';
  const rows = []; let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted && char === '"' && text[i + 1] === '"') { cell += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (!quoted && char === delimiter) { row.push(cell.trim()); cell = ''; }
    else if (!quoted && (char === '\n' || char === '\r')) { if (char === '\r' && text[i + 1] === '\n') i++; row.push(cell.trim()); if (row.some(value => value !== '')) rows.push(row); row = []; cell = ''; }
    else cell += char;
  }
  row.push(cell.trim()); if (row.some(value => value !== '')) rows.push(row);
  return rows;
}
function normalizeCsvHeader(value) { return String(value ?? '').replace(/^\ufeff/, '').trim().toLowerCase().replace(/[\s_\-/()]+/g, ''); }
function parseCsvDate(value) {
  if (!value) return null;
  const text = String(value).trim();
  let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  let iso;
  if (match) { const year = Number(match[1]) > 2400 ? Number(match[1]) - 543 : Number(match[1]); iso = `${year}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`; }
  else {
    match = text.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
    if (!match) return null;
    let year = Number(match[3]); if (year > 2400) year -= 543;
    iso = `${year}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
  }
  const parsed = new Date(`${iso}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === iso ? iso : null;
}
async function importAssetsCsv(file) {
  if (!canManageAssets()) return toast('บัญชีนี้ไม่มีสิทธิ์นำเข้าครุภัณฑ์', true);
  try {
    const rows = parseCsv((await file.text()).replace(/^\ufeff/, ''));
    if (rows.length < 2) return toast('ไม่พบแถวข้อมูลในไฟล์ CSV', true);
    const headers = rows[0].map(normalizeCsvHeader);
    const aliases = {
      asset_code: ['เลขครุภัณฑ์', 'รหัสครุภัณฑ์', 'assetcode', 'code'], name: ['ชื่อผลิตภัณฑ์', 'ชื่อครุภัณฑ์', 'ชื่อ', 'name', 'productname'],
      category: ['ประเภท', 'หมวดหมู่', 'category', 'type'], received_date: ['วันที่ได้รับ', 'วันที่จัดซื้อ', 'receiveddate', 'purchasedate', 'date'],
      fiscal_year: ['ปีงบประมาณ', 'fiscalyear'], location: ['สถานที่', 'สถานที่จัดเก็บ', 'location'], department: ['หน่วยงาน', 'department', 'unit'],
      floor: ['ชั้น', 'floor'], building: ['อาคาร', 'building'], assignee: ['ผู้รับผิดชอบ', 'assignee', 'responsible'], status: ['สถานะ', 'status'],
      image_path: ['ภาพอุปกรณ์', 'รูปภาพ', 'imagepath'], brand: ['ยี่ห้อรุ่น', 'ยี่ห้อ', 'รุ่น', 'brand', 'model'], serial_number: ['หมายเลขเครื่อง', 'serialnumber', 'serial'], price: ['ราคา', 'ราคาจัดซื้อ', 'price'], details: ['รายละเอียด', 'เพิ่มเติม', 'details', 'notes']
    };
    const indexes = Object.fromEntries(Object.entries(aliases).map(([key, names]) => [key, headers.findIndex(header => names.some(name => normalizeCsvHeader(name) === header))]));
    if (indexes.name < 0) return toast('ไม่พบคอลัมน์ “ชื่อผลิตภัณฑ์” ในหัวตาราง', true);
    const knownStatuses = new Set(statusMetrics.flatMap(metric => metric.matches));
    const currentCodes = new Set(assets.map(asset => String(asset.asset_code || '').trim().toLowerCase()).filter(Boolean));
    const batchCodes = new Set(); const pending = []; let skipped = 0;
    for (const cells of rows.slice(1)) {
      const value = key => indexes[key] >= 0 ? String(cells[indexes[key]] ?? '').trim() : '';
      const name = value('name'); const assetCode = value('asset_code');
      if (!name || (assetCode && (currentCodes.has(assetCode.toLowerCase()) || batchCodes.has(assetCode.toLowerCase())))) { skipped++; continue; }
      if (assetCode) batchCodes.add(assetCode.toLowerCase());
      const date = parseCsvDate(value('received_date'));
      const priceText = value('price').replace(/[฿,\s]/g, '');
      const price = priceText ? Number(priceText) : 0;
      const fiscalYearText = value('fiscal_year');
      const fiscalYear = fiscalYearText ? Number(fiscalYearText.replace(/[^0-9]/g, '')) : date ? Number(thaiFiscalYear(date)) : null;
      const statusText = value('status');
      if (value('received_date') && !date || priceText && (!Number.isFinite(price) || price < 0) || fiscalYearText && !Number.isFinite(fiscalYear) || statusText && !knownStatuses.has(statusText)) { skipped++; if (assetCode) batchCodes.delete(assetCode.toLowerCase()); continue; }
      pending.push({ asset_code: assetCode || null, name, category: value('category') || 'อื่น ๆ', received_date: date, purchase_date: date, fiscal_year: fiscalYear, location: value('location') || null, department: value('department') || null, floor: value('floor') || null, building: value('building') || null, assignee: value('assignee') || null, status: statusText || 'พร้อมใช้งาน', image_path: value('image_path') || null, brand: value('brand') || null, serial_number: value('serial_number') || null, price: Number.isFinite(price) ? price : 0, notes: value('details') || null });
    }
    if (!pending.length) return toast(`ไม่มีรายการใหม่ให้นำเข้า · ข้าม ${skipped} แถว`, true);
    if (supabase && session?.user) {
      const records = pending.map(record => ({ ...record, created_by: session.user.id }));
      const { data, error } = await supabase.from('it_assets').insert(records).select();
      if (error) return toast(`นำเข้าไม่สำเร็จ: ${error.message}`, true);
      assets = [...(data || []), ...assets];
    } else {
      assets = [...pending.map((record, index) => ({ ...record, id: `local-import-${Date.now()}-${index}` })), ...assets];
      saveDemoAssets();
    }
    renderContent(); renderIcons(); toast(`นำเข้าสำเร็จ ${pending.length} รายการ · ข้าม ${skipped} แถว`);
  } catch (error) { toast(`อ่านไฟล์ CSV ไม่สำเร็จ: ${error.message}`, true); }
}

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
  if (!session) { assets = loadDemoAssets(); systemOptions = loadDemoSystemOptions(); applySystemOptions(); view = 'dashboard'; renderLogin(); return; }
  const { data, error } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).single();
  if (error || !data) { await supabase.auth.signOut(); session = null; renderLogin(); notifyLogin('บัญชีนี้ยังไม่ได้รับสิทธิ์เข้าระบบ โปรดติดต่อ Super Admin', true); return; }
  userRole = data.role; await Promise.all([loadAssets(), loadSystemOptions()]); renderApp();
}

async function loadAssets() { if (!supabase || !session?.user) return; const { data, error } = await supabase.from('it_assets').select('*').order('created_at', { ascending: false }).limit(500); if (!error && data) assets = data; else if (error) toast(`โหลดข้อมูลไม่ได้: ${error.message}`, true); }
async function signOut() { if (supabase) await supabase.auth.signOut(); session = null; userRole = null; assets = loadDemoAssets(); systemOptions = loadDemoSystemOptions(); applySystemOptions(); view = 'dashboard'; renderLogin(); }
let toastTimer; function toast(message, error = false) { let el = document.querySelector('.toast'); if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.append(el); } el.className = `toast ${error ? 'toast-error' : ''}`; el.innerHTML = `${icon(error ? 'circle-alert' : 'circle-check', 17)}<span>${escapeHtml(message)}</span>`; renderIcons(); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.remove(), 3000); }

async function boot() { if (supabase) { const { data: { session: savedSession } } = await supabase.auth.getSession(); supabase.auth.onAuthStateChange((_event, nextSession) => { setTimeout(() => initializeSession(nextSession), 0); }); if (savedSession) { await initializeSession(savedSession); return; } } renderLogin(); }
boot();
