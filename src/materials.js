const DEMO_KEY = 'bcn-ckr-demo-materials';
const MOVEMENT_KEY = 'bcn-ckr-demo-material-movements';
const sampleMaterials = [
  { id: 'mat-1', sku: 'MAT-001', name: 'กระดาษถ่ายเอกสาร A4', category: 'วัสดุสำนักงาน', unit: 'รีม', quantity: 18, minimum_quantity: 10, location: 'ห้องคลังวัสดุ', description: '' },
  { id: 'mat-2', sku: 'MAT-002', name: 'หมึกพิมพ์เลเซอร์', category: 'วัสดุคอมพิวเตอร์', unit: 'ตลับ', quantity: 3, minimum_quantity: 5, location: 'ห้องคลังวัสดุ', description: '' },
  { id: 'mat-3', sku: 'MAT-003', name: 'สาย HDMI 2 เมตร', category: 'อุปกรณ์โสตทัศนูปกรณ์', unit: 'เส้น', quantity: 0, minimum_quantity: 2, location: 'ตู้เก็บอุปกรณ์ IT', description: '' },
];
let materials = [];
let movements = [];
let query = '';
let category = 'ทั้งหมด';
let activeContext;

function readLocal(key, fallback) {
  try { const value = JSON.parse(localStorage.getItem(key)); return Array.isArray(value) ? value : fallback; }
  catch { return fallback; }
}
function safePath(value) {
  return String(value || '').normalize('NFKC').trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 80) || 'material';
}
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file); });
}
async function loadMaterialImages(context) {
  if (!context.supabase) return;
  const images = [...document.querySelectorAll('.material-thumb[data-image-path]')];
  await Promise.all(images.map(async image => {
    const { data, error } = await context.supabase.storage.from('inventory-material-images').createSignedUrl(image.dataset.imagePath, 1800);
    if (!error && data?.signedUrl && image.isConnected) image.src = data.signedUrl;
  }));
}
function saveLocal() {
  localStorage.setItem(DEMO_KEY, JSON.stringify(materials));
  localStorage.setItem(MOVEMENT_KEY, JSON.stringify(movements));
}
const amount = value => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 3 }).format(Number(value) || 0);
const stamp = value => value ? new Date(value).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const canManage = ({ supabase, userRole }) => !supabase || ['super_admin', 'asset_manager'].includes(userRole);
const lowStock = item => Number(item.quantity) <= Number(item.minimum_quantity);
const categoryNames = () => [...new Set([...materials.map(item => item.category).filter(Boolean), ...(activeContext?.catalogs?.material_categories || [])])].sort((a, b) => a.localeCompare(b, 'th'));

async function fetchMaterials(context) {
  const { supabase, session } = context;
  if (!supabase || !session?.user) {
    materials = readLocal(DEMO_KEY, [...sampleMaterials]);
    movements = readLocal(MOVEMENT_KEY, [
      { id: 'mv-1', material_id: 'mat-2', transaction_type: 'issue', quantity: 2, recipient: 'งานธุรการ', created_at: new Date().toISOString() },
      { id: 'mv-2', material_id: 'mat-1', transaction_type: 'receive', quantity: 20, recipient: 'ยอดตั้งต้น', created_at: new Date().toISOString() },
    ]);
    if (!localStorage.getItem(DEMO_KEY)) saveLocal();
    return null;
  }
  const [materialResult, movementResult] = await Promise.all([
    supabase.from('inventory_materials').select('*').order('name'),
    supabase.from('inventory_movements').select('*').order('created_at', { ascending: false }).limit(12),
  ]);
  if (materialResult.error) return materialResult.error;
  materials = materialResult.data || [];
  movements = movementResult.error ? [] : movementResult.data || [];
  return movementResult.error;
}

export async function renderMaterialsPage(context) {
  activeContext = context;
  const { content, icon, renderIcons, toast } = context;
  content.innerHTML = '<div class="materials-loading">กำลังโหลดคลังวัสดุ…</div>';
  const movementError = await fetchMaterials(context);
  if (!content.isConnected) return;
  if (movementError) toast(`โหลดประวัติรับเข้า–เบิกจ่ายไม่ได้: ${movementError.message}`, true);
  renderPage();

  function renderPage() {
    if (!content.isConnected) return;
    const visible = materials.filter(item => (category === 'ทั้งหมด' || item.category === category)
      && (!query || `${item.sku} ${item.name} ${item.category} ${item.ink_type || ''} ${item.location || ''}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())));
    const alerts = materials.filter(lowStock).sort((a, b) => Number(a.quantity) - Number(b.quantity));
    const units = materials.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const emptyRow = '<tr><td colspan="7"><div class="table-empty">ยังไม่มีรายการวัสดุที่ตรงกับเงื่อนไข</div></td></tr>';
    const rows = visible.map(item => {
      const isLow = lowStock(item);
      const stockClass = Number(item.quantity) === 0 ? 'out' : isLow ? 'low' : 'good';
      const thumbnail = item.image_data
        ? `<img class="material-thumb" src="${context.escapeHtml(item.image_data)}" alt="ภาพ${context.escapeHtml(item.name)}" />`
        : item.image_path
          ? `<img class="material-thumb" data-image-path="${context.escapeHtml(item.image_path)}" alt="ภาพ${context.escapeHtml(item.name)}" />`
          : icon('package', 17);
      return `<tr><td><div class="material-name-cell"><span class="material-row-icon">${thumbnail}</span><div><strong>${context.escapeHtml(item.name)}</strong><small>${context.escapeHtml(item.sku || 'ไม่มีรหัส')}</small></div></div></td><td><span class="category-chip">${context.escapeHtml(item.category)}</span>${item.ink_type ? `<small class="material-subtype">${context.escapeHtml(item.ink_type)}</small>` : ''}</td><td><strong class="material-stock ${stockClass}">${amount(item.quantity)} <small>${context.escapeHtml(item.unit)}</small></strong><span class="material-minimum">ขั้นต่ำ ${amount(item.minimum_quantity)} ${context.escapeHtml(item.unit)}</span></td><td>${context.escapeHtml(item.location || '—')}</td><td><span class="stock-badge ${stockClass}">${Number(item.quantity) === 0 ? 'หมด' : isLow ? 'ใกล้หมด' : 'ปกติ'}</span></td><td>${stamp(item.updated_at || item.created_at)}</td><td><div class="material-row-actions">${canManage(context) ? `<button class="stock-action receive" data-movement="receive" data-id="${context.escapeHtml(item.id)}" title="รับวัสดุเข้า">${icon('plus', 15)} รับเข้า</button><button class="stock-action issue" data-movement="issue" data-id="${context.escapeHtml(item.id)}" title="เบิกวัสดุ">${icon('arrow-up-right', 15)} เบิก</button>` : '<span class="muted-note">ดูข้อมูล</span>'}</div></td></tr>`;
    }).join('');
    const movementRows = movements.slice(0, 8).map(move => {
      const item = materials.find(row => String(row.id) === String(move.material_id));
      const incoming = move.transaction_type === 'receive';
      return `<div class="movement-row"><span class="movement-icon ${incoming ? 'incoming' : 'outgoing'}">${icon(incoming ? 'arrow-down-left' : 'arrow-up-right', 16)}</span><div class="movement-copy"><strong>${context.escapeHtml(item?.name || 'วัสดุที่ถูกบันทึก')}</strong><small>${context.escapeHtml(incoming ? 'รับเข้า' : 'เบิกจ่าย')} · ${context.escapeHtml(move.recipient || move.reference || 'ไม่ระบุผู้เบิก/เอกสาร')}</small></div><div class="movement-amount ${incoming ? 'incoming' : 'outgoing'}">${incoming ? '+' : '−'}${amount(move.quantity)}<small>${context.escapeHtml(item?.unit || '')}</small></div></div>`;
    }).join('');
    const alertContent = alerts.length ? alerts.slice(0, 5).map(item => `<div class="low-alert-row"><span class="alert-mark">${icon(Number(item.quantity) === 0 ? 'circle-x' : 'triangle-alert', 16)}</span><span><strong>${context.escapeHtml(item.name)}</strong><small>${context.escapeHtml(item.category)} · คงเหลือ ${amount(item.quantity)} ${context.escapeHtml(item.unit)} (ขั้นต่ำ ${amount(item.minimum_quantity)})</small></span><b>${Number(item.quantity) === 0 ? 'หมด' : 'ใกล้หมด'}</b></div>`).join('') : `<div class="stock-all-good">${icon('circle-check', 17)} วัสดุทุกหมวดมีจำนวนเพียงพอตามเกณฑ์ขั้นต่ำ</div>`;
    content.innerHTML = `<div class="page-heading materials-heading"><div><span class="section-kicker">MATERIALS CONTROL</span><h1>คลังวัสดุ</h1><p>จัดเก็บ แบ่งหมวดหมู่ รับเข้า และติดตามการเบิกจ่ายวัสดุ</p></div><div class="heading-actions">${canManage(context) ? `<button class="button secondary" id="import-materials">${icon('file-up', 16)} นำเข้า CSV</button><button class="button primary" id="add-material">${icon('plus', 17)} เพิ่มวัสดุ</button>` : ''}<input id="materials-file" type="file" accept=".csv,text/csv" hidden /></div></div>
      <section class="materials-stats" aria-label="สรุปคลังวัสดุ"><article class="material-stat total">${icon('boxes', 19)}<span>รายการวัสดุ</span><strong>${materials.length}<small>รายการ</small></strong><em>แยกตามหมวดหมู่</em></article><article class="material-stat units">${icon('layers-3', 19)}<span>จำนวนคงเหลือรวม</span><strong>${amount(units)}<small>หน่วย</small></strong><em>รวมทุกประเภทวัสดุ</em></article><article class="material-stat warning">${icon('triangle-alert', 19)}<span>รายการใกล้หมด</span><strong>${alerts.filter(item => Number(item.quantity) > 0).length}<small>รายการ</small></strong><em>ถึงหรือต่ำกว่าเกณฑ์ขั้นต่ำ</em></article><article class="material-stat danger">${icon('package-x', 19)}<span>รายการหมด</span><strong>${alerts.filter(item => Number(item.quantity) === 0).length}<small>รายการ</small></strong><em>ควรจัดซื้อเพิ่มเติม</em></article></section>
      <section class="panel stock-alert-panel"><div class="panel-heading"><div><h3>แจ้งเตือนวัสดุใกล้หมดหรือเหลือน้อย</h3><p>อ้างอิงจากจำนวนขั้นต่ำที่กำหนดในแต่ละรายการ</p></div><span class="alert-count ${alerts.length ? 'has-alerts' : ''}">${alerts.length} รายการ</span></div><div class="low-alert-list">${alertContent}</div></section>
      <section class="panel materials-table-panel"><div class="asset-panel-head"><div><h3>รายการวัสดุ</h3><p>ค้นหาและจัดการจำนวนคงเหลือในคลัง</p></div><div class="materials-tools"><button id="download-template" class="button secondary">${icon('download', 15)} แบบฟอร์ม CSV</button><button id="export-materials" class="button secondary">${icon('file-down', 15)} ส่งออก</button></div></div><div class="table-toolbar"><label class="search-box">${icon('search', 16)}<input id="material-search" placeholder="ค้นหารหัส ชื่อ หรือหมวดหมู่…" value="${context.escapeHtml(query)}" /></label><div class="filters"><select id="material-category"><option value="ทั้งหมด">ทุกหมวดหมู่</option>${categoryNames().map(name => `<option ${category === name ? 'selected' : ''}>${context.escapeHtml(name)}</option>`).join('')}</select><button class="filter-button" id="refresh-materials">${icon('rotate-cw', 15)} รีเฟรช</button></div></div><div class="table-scroll"><table class="materials-table"><thead><tr><th>วัสดุ / รหัส</th><th>หมวดหมู่</th><th>คงเหลือ / ขั้นต่ำ</th><th>สถานที่จัดเก็บ</th><th>สถานะ</th><th>ปรับปรุงล่าสุด</th><th>จัดการ</th></tr></thead><tbody>${rows || emptyRow}</tbody></table></div><div class="table-bottom"><span>แสดง <strong>${visible.length}</strong> จาก ${materials.length} รายการ</span><span class="materials-permission">${canManage(context) ? 'สิทธิ์จัดการคลังวัสดุ' : 'สิทธิ์ดูข้อมูล'}</span></div></section>
      <section class="panel movement-panel"><div class="panel-heading"><div><h3>ประวัติรับเข้าและเบิกจ่าย</h3><p>รายการเคลื่อนไหวล่าสุด</p></div><span class="chart-kicker">MOVEMENTS</span></div><div class="movement-list">${movementRows || '<div class="chart-empty">ยังไม่มีประวัติรับเข้า–เบิกจ่าย</div>'}</div></section>
      <footer class="app-footer"><span class="app-legal">© 2026 วิทยาลัยพยาบาลบรมราชชนนี จักรีรัช · คณะพยาบาลศาสตร์ สถาบันพระบรมราชชนก</span><span>CKR DATA CENTER</span></footer>`;
    renderIcons();
    bindPageEvents();
    loadMaterialImages(context);
  }

  function bindPageEvents() {
    const file = content.querySelector('#materials-file');
    content.querySelector('#import-materials')?.addEventListener('click', () => file.click());
    file?.addEventListener('change', async () => { const selected = file.files?.[0]; if (selected) await importCsv(selected); file.value = ''; });
    content.querySelector('#add-material')?.addEventListener('click', () => openMaterialForm());
    content.querySelector('#download-template').addEventListener('click', downloadTemplate);
    content.querySelector('#export-materials').addEventListener('click', exportMaterials);
    content.querySelector('#material-search').addEventListener('input', event => { const cursor = event.target.selectionStart; query = event.target.value; renderPage(); const input = content.querySelector('#material-search'); input?.focus(); if (input && cursor !== null) input.setSelectionRange(cursor, cursor); });
    content.querySelector('#material-category').addEventListener('change', event => { category = event.target.value; renderPage(); });
    content.querySelector('#refresh-materials').addEventListener('click', async () => { const error = await fetchMaterials(context); renderPage(); toast(error ? `โหลดข้อมูลบางส่วนไม่ได้: ${error.message}` : 'อัปเดตคลังวัสดุแล้ว', Boolean(error)); });
    content.querySelectorAll('[data-movement]').forEach(button => button.addEventListener('click', () => openMovementForm(button.dataset.id, button.dataset.movement)));
  }

  function openMaterialForm(seed = {}) {
    const modal = document.createElement('div'); modal.className = 'modal-backdrop';
    modal.innerHTML = `<section class="asset-modal materials-modal"><div class="modal-head"><div><span class="section-kicker">MATERIALS REGISTRY</span><h2>เพิ่มวัสดุเข้าคลัง</h2></div><button class="icon-button" data-close aria-label="ปิด">${icon('x', 19)}</button></div><form><div class="form-grid"><div class="field"><label>รหัสวัสดุ</label><input name="sku" value="${context.escapeHtml(seed.sku || '')}" placeholder="เช่น MAT-001" /></div><div class="field"><label>ชื่อวัสดุ <b>*</b></label><input name="name" value="${context.escapeHtml(seed.name || '')}" required placeholder="ชื่อวัสดุหรืออุปกรณ์" /></div><div class="field"><label>หมวดหมู่ <b>*</b></label><input name="category" list="material-category-options" value="${context.escapeHtml(seed.category || '')}" required placeholder="เช่น วัสดุสำนักงาน" /><datalist id="material-category-options">${categoryNames().map(name => `<option value="${context.escapeHtml(name)}"></option>`).join('')}</datalist></div><div class="field"><label>ประเภทของหมึก</label><input name="ink_type" list="ink-type-options" value="${context.escapeHtml(seed.ink_type || '')}" placeholder="เลือกเมื่อเป็นหมึกหรือวัสดุพิมพ์" /><datalist id="ink-type-options">${(context.catalogs?.ink_types || []).map(name => `<option value="${context.escapeHtml(name)}"></option>`).join('')}</datalist></div><div class="field"><label>หน่วยนับ <b>*</b></label><input name="unit" list="material-unit-options" value="${context.escapeHtml(seed.unit || 'ชิ้น')}" required placeholder="ชิ้น, กล่อง, รีม" /><datalist id="material-unit-options">${(context.catalogs?.material_units || []).map(name => `<option value="${context.escapeHtml(name)}"></option>`).join('')}</datalist></div><div class="field"><label>จำนวนรับเข้าเริ่มต้น</label><input name="initial_quantity" type="number" min="0" step="0.001" value="${seed.initial_quantity ?? 0}" /></div><div class="field"><label>แจ้งเตือนเมื่อเหลือน้อยกว่า</label><input name="minimum_quantity" type="number" min="0" step="0.001" value="${seed.minimum_quantity ?? 0}" /></div><div class="field"><label>สถานที่จัดเก็บ</label><input name="location" list="material-location-options" value="${context.escapeHtml(seed.location || '')}" placeholder="เช่น ห้องคลังวัสดุ / ชั้นวาง A" /><datalist id="material-location-options">${(context.catalogs?.locations || []).map(name => `<option value="${context.escapeHtml(name)}"></option>`).join('')}</datalist></div><div class="field"><label>รายละเอียด</label><input name="description" value="${context.escapeHtml(seed.description || '')}" placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)" /></div><div class="field material-image-field"><label><span class="field-icon teal">${icon('image', 14)}</span>ภาพวัสดุ</label><div class="image-actions"><button type="button" class="image-action image-action-camera" id="take-material-photo">${icon('camera', 16)} ถ่ายรูปใหม่</button><button type="button" class="image-action" id="choose-material-image">${icon('images', 16)} เลือกจากเครื่อง</button></div><input id="material-image" type="file" accept="image/jpeg,image/png,image/webp" hidden /><input id="material-camera" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden /><div id="material-image-preview" class="asset-image-preview material-image-preview" tabindex="0"><span>${icon('clipboard', 15)} วางรูปด้วย Ctrl+V หรือเลือกรูป JPG, PNG, WebP ไม่เกิน 10 MB</span></div><small>จัดเก็บภาพไว้ในโฟลเดอร์ตามหมวดหมู่ของวัสดุ</small></div></div><div class="modal-actions"><button type="button" class="button secondary" data-close>ยกเลิก</button><button type="submit" class="button primary">${icon('plus', 16)} บันทึกวัสดุ</button></div></form></section>`;
    document.body.append(modal); renderIcons();
    const imageInput = modal.querySelector('#material-image'); const cameraInput = modal.querySelector('#material-camera');
    const imagePreview = modal.querySelector('#material-image-preview'); let imageFile = null; let imagePreviewUrl = null;
    const close = () => { modal.remove(); if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl); imagePreviewUrl = null; };
    const setImage = file => {
      if (!file) return;
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) return toast('เลือกรูป JPG, PNG หรือ WebP ขนาดไม่เกิน 10 MB', true);
      if (!context.supabase && file.size > 2 * 1024 * 1024) return toast('โหมดตัวอย่างรองรับภาพไม่เกิน 2 MB · เชื่อมต่อ Supabase เพื่อใช้ภาพขนาดไม่เกิน 10 MB', true);
      imageFile = file; if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      imagePreviewUrl = URL.createObjectURL(file); imagePreview.innerHTML = `<img alt="ตัวอย่างภาพวัสดุ" src="${imagePreviewUrl}" /><button type="button" class="material-image-remove" aria-label="นำภาพออก">${icon('x', 15)}</button>`;
      renderIcons(); imagePreview.querySelector('.material-image-remove').addEventListener('click', () => { imageFile = null; URL.revokeObjectURL(imagePreviewUrl); imagePreviewUrl = null; imagePreview.innerHTML = `<span>${icon('clipboard', 15)} วางรูปด้วย Ctrl+V หรือเลือกรูป JPG, PNG, WebP ไม่เกิน 10 MB</span>`; renderIcons(); });
    };
    modal.querySelector('#choose-material-image').onclick = () => imageInput.click(); modal.querySelector('#take-material-photo').onclick = () => cameraInput.click();
    imageInput.addEventListener('change', () => setImage(imageInput.files?.[0])); cameraInput.addEventListener('change', () => setImage(cameraInput.files?.[0]));
    modal.addEventListener('paste', event => { const item = Array.from(event.clipboardData?.items || []).find(entry => entry.type.startsWith('image/')); const image = item?.getAsFile(); if (image) { event.preventDefault(); setImage(image); } });
    modal.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', close));
    modal.addEventListener('click', event => { if (event.target === modal) close(); });
    modal.querySelector('form').addEventListener('submit', async event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget));
      const material = { sku: String(data.sku || '').trim() || `MAT-${Date.now()}`, name: String(data.name || '').trim(), category: String(data.category || '').trim(), ink_type: String(data.ink_type || '').trim() || null, unit: String(data.unit || '').trim(), quantity: 0, minimum_quantity: Number(data.minimum_quantity) || 0, location: String(data.location || '').trim() || null, description: String(data.description || '').trim() || null };
      const startQty = Number(data.initial_quantity) || 0;
      let startMovementFailed = false;
      const submit = event.currentTarget.querySelector('[type=submit]'); submit.disabled = true; submit.textContent = 'กำลังบันทึก…';
      let imagePath = null; let localImage = null;
      if (context.supabase && context.session?.user) {
        if (imageFile) {
          const extension = imageFile.type === 'image/jpeg' ? 'jpg' : imageFile.type === 'image/png' ? 'png' : 'webp';
          imagePath = `${safePath(material.category)}/${safePath(material.sku)}-${safePath(material.name)}-${Date.now()}.${extension}`;
          const { error: uploadError } = await context.supabase.storage.from('inventory-material-images').upload(imagePath, imageFile, { contentType: imageFile.type, upsert: false });
          if (uploadError) { submit.disabled = false; submit.innerHTML = `${icon('plus', 16)} บันทึกวัสดุ`; renderIcons(); return toast(`อัปโหลดภาพไม่สำเร็จ: ${uploadError.message}`, true); }
        }
        const { quantity: _initialStock, ...newMaterial } = material;
        const { data: created, error } = await context.supabase.from('inventory_materials').insert({ ...newMaterial, image_path: imagePath, created_by: context.session.user.id }).select().single();
        if (error) { if (imagePath) await context.supabase.storage.from('inventory-material-images').remove([imagePath]); submit.disabled = false; submit.innerHTML = `${icon('plus', 16)} บันทึกวัสดุ`; renderIcons(); return toast(`บันทึกวัสดุไม่สำเร็จ: ${error.message}`, true); }
        if (startQty > 0) {
          const { error: moveError } = await context.supabase.rpc('record_inventory_movement', { p_material_id: created.id, p_type: 'receive', p_quantity: startQty, p_recipient: 'ยอดรับเข้าตั้งต้น', p_reference: null, p_note: 'เพิ่มวัสดุเข้าคลังครั้งแรก' });
          if (moveError) { startMovementFailed = true; toast(`สร้างวัสดุแล้ว แต่บันทึกยอดรับเข้าตั้งต้นไม่สำเร็จ: ${moveError.message}`, true); }
        }
      } else {
        if (imageFile) localImage = await fileToDataUrl(imageFile);
        const local = { ...material, image_data: localImage, id: `mat-${Date.now()}`, quantity: startQty, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        materials.unshift(local);
        if (startQty > 0) addLocalMovement(local, 'receive', startQty, 'ยอดรับเข้าตั้งต้น');
        saveLocal();
      }
      close(); await refreshAndRender(); if (!startMovementFailed) toast('บันทึกวัสดุเข้าคลังแล้ว');
    });
  }

  function openMovementForm(id, type) {
    const item = materials.find(row => String(row.id) === String(id)); if (!item) return;
    const receive = type === 'receive'; const modal = document.createElement('div'); modal.className = 'modal-backdrop';
    modal.innerHTML = `<section class="asset-modal materials-modal transaction-modal"><div class="modal-head"><div><span class="section-kicker">STOCK MOVEMENT</span><h2>${receive ? 'รับวัสดุเข้าคลัง' : 'เบิกวัสดุออก'}</h2><p>${context.escapeHtml(item.name)} · คงเหลือ ${amount(item.quantity)} ${context.escapeHtml(item.unit)}</p></div><button class="icon-button" data-close aria-label="ปิด">${icon('x', 19)}</button></div><form><div class="form-grid"><div class="field"><label>จำนวน ${receive ? 'รับเข้า' : 'เบิกจ่าย'} <b>*</b></label><input name="quantity" type="number" min="0.001" step="0.001" max="${receive ? '' : Number(item.quantity)}" required autofocus /></div><div class="field"><label>${receive ? 'ผู้ส่งมอบ / เอกสารอ้างอิง' : 'ผู้เบิก / หน่วยงาน'} <b>*</b></label><input name="recipient" required placeholder="ชื่อบุคคลหรือหน่วยงาน" /></div><div class="field"><label>เลขที่เอกสารอ้างอิง</label><input name="reference" placeholder="ใบรับ / ใบเบิก (ถ้ามี)" /></div><div class="field"><label>หมายเหตุ</label><input name="note" placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)" /></div></div><div class="modal-actions"><button type="button" class="button secondary" data-close>ยกเลิก</button><button type="submit" class="button ${receive ? 'primary' : 'stock-submit-issue'}">${icon(receive ? 'arrow-down-left' : 'arrow-up-right', 16)} ${receive ? 'ยืนยันรับเข้า' : 'ยืนยันการเบิก'}</button></div></form></section>`;
    document.body.append(modal); renderIcons();
    modal.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => modal.remove()));
    modal.addEventListener('click', event => { if (event.target === modal) modal.remove(); });
    modal.querySelector('form').addEventListener('submit', async event => {
      event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); const qty = Number(data.quantity);
      if (!Number.isFinite(qty) || qty <= 0) return toast('ระบุจำนวนให้ถูกต้อง', true);
      if (!receive && qty > Number(item.quantity)) return toast(`จำนวนคงเหลือมีเพียง ${amount(item.quantity)} ${item.unit}`, true);
      const nextQuantity = Number(item.quantity) + (receive ? qty : -qty);
      const submit = event.currentTarget.querySelector('[type=submit]'); submit.disabled = true; submit.textContent = 'กำลังบันทึก…';
      if (context.supabase && context.session?.user) {
        const { error } = await context.supabase.rpc('record_inventory_movement', { p_material_id: item.id, p_type: type, p_quantity: qty, p_recipient: data.recipient, p_reference: data.reference || null, p_note: data.note || null });
        if (error) { submit.disabled = false; submit.textContent = receive ? 'ยืนยันรับเข้า' : 'ยืนยันการเบิก'; return toast(`บันทึก${receive ? 'รับเข้า' : 'เบิกจ่าย'}ไม่สำเร็จ: ${error.message}`, true); }
      } else {
        item.quantity = Number(item.quantity) + (receive ? qty : -qty); item.updated_at = new Date().toISOString();
        addLocalMovement(item, type, qty, data.recipient, data.reference, data.note); saveLocal();
      }
      const warning = !receive && nextQuantity <= Number(item.minimum_quantity);
      modal.remove(); await refreshAndRender(); toast(warning && !receive ? `เบิกจ่ายสำเร็จ · ${item.name} เหลือน้อยกว่าเกณฑ์ขั้นต่ำ` : `${receive ? 'รับเข้า' : 'เบิกจ่าย'}วัสดุเรียบร้อย`);
    });
  }

  async function refreshAndRender() { const error = await fetchMaterials(context); if (error) toast(error.message, true); renderPage(); }

  function addLocalMovement(item, type, quantity, recipient, reference = '', note = '') {
    movements.unshift({ id: `move-${Date.now()}-${Math.random()}`, material_id: item.id, transaction_type: type, quantity, recipient, reference, note, created_at: new Date().toISOString() });
  }

  async function importCsv(file) {
    const text = (await file.text()).replace(/^\uFEFF/, ''); const rows = parseCsv(text);
    if (rows.length < 2) return toast('ไฟล์ CSV ไม่มีรายการข้อมูล', true);
    const headers = rows.shift().map(header => header.trim().toLocaleLowerCase());
    const get = (row, ...names) => { const index = headers.findIndex(header => names.includes(header)); return index < 0 ? '' : row[index]?.trim() || ''; };
    let imported = 0; let failed = 0;
    for (const row of rows) {
      const name = get(row, 'ชื่อวัสดุ', 'ชื่อ', 'name'); const categoryName = get(row, 'หมวดหมู่', 'ประเภท', 'category');
      const unit = get(row, 'หน่วย', 'หน่วยนับ', 'unit');
      if (!name || !categoryName || !unit) { failed++; continue; }
      const sku = get(row, 'รหัสวัสดุ', 'รหัส', 'sku') || `MAT-${Date.now()}-${imported}`;
      const qty = Number(get(row, 'จำนวนรับเข้า', 'รับเข้า', 'quantity')) || 0;
      const min = Number(get(row, 'จำนวนขั้นต่ำ', 'ขั้นต่ำ', 'minimum_quantity')) || 0;
      const record = { sku, name, category: categoryName, ink_type: get(row, 'ประเภทหมึก', 'ชนิดหมึก', 'ink_type') || null, unit, minimum_quantity: min, location: get(row, 'สถานที่จัดเก็บ', 'สถานที่', 'location') || null, description: get(row, 'รายละเอียด', 'description') || null };
      if (context.supabase && context.session?.user) {
        const { data: existing } = await context.supabase.from('inventory_materials').select('id').eq('sku', sku).maybeSingle();
        const result = existing
          ? await context.supabase.from('inventory_materials').update(record).eq('id', existing.id).select().single()
          : await context.supabase.from('inventory_materials').insert({ ...record, created_by: context.session.user.id }).select().single();
        if (result.error) { failed++; continue; }
        if (qty > 0) {
          const { error } = await context.supabase.rpc('record_inventory_movement', { p_material_id: result.data.id, p_type: 'receive', p_quantity: qty, p_recipient: 'นำเข้าจากไฟล์ CSV', p_reference: file.name, p_note: 'นำเข้ารายการคลังวัสดุ' });
          if (error) { failed++; continue; }
        }
      } else {
        let existing = materials.find(item => item.sku === sku);
        if (existing) Object.assign(existing, record);
        else { existing = { ...record, id: `mat-${Date.now()}-${imported}`, quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }; materials.push(existing); }
        if (qty > 0) { existing.quantity = Number(existing.quantity) + qty; addLocalMovement(existing, 'receive', qty, 'นำเข้าจากไฟล์ CSV', file.name); }
      }
      imported++;
    }
    if (!context.supabase) saveLocal();
    await refreshAndRender();
    toast(`นำเข้าสำเร็จ ${imported} รายการ${failed ? ` · ข้าม/ผิดพลาด ${failed} รายการ` : ''}`, failed > 0);
  }
}

function parseCsv(text) {
  const result = []; let row = []; let value = ''; let quoted = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') { value += '"'; index++; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(value); value = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) { if (char === '\r' && text[index + 1] === '\n') index++; row.push(value); if (row.some(cell => cell.trim())) result.push(row); row = []; value = ''; }
    else value += char;
  }
  row.push(value); if (row.some(cell => cell.trim())) result.push(row);
  return result;
}

function csvFile(filename, rows) {
  const csv = '\ufeff' + rows.map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n');
  const anchor = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })), download: filename });
  anchor.click(); URL.revokeObjectURL(anchor.href);
}
function downloadTemplate() {
  csvFile('CKR-materials-template.csv', [['รหัสวัสดุ', 'ชื่อวัสดุ', 'หมวดหมู่', 'ประเภทหมึก', 'หน่วย', 'จำนวนรับเข้า', 'จำนวนขั้นต่ำ', 'สถานที่จัดเก็บ', 'รายละเอียด'], ['MAT-001', 'หมึกพิมพ์ตัวอย่าง', 'วัสดุคอมพิวเตอร์', 'หมึกเลเซอร์ (Toner)', 'ตลับ', '20', '5', 'ห้องคลังวัสดุ', '']]);
}
function exportMaterials() {
  csvFile(`CKR-materials-${new Date().toISOString().slice(0, 10)}.csv`, [['รหัสวัสดุ', 'ชื่อวัสดุ', 'หมวดหมู่', 'ประเภทหมึก', 'หน่วย', 'จำนวนคงเหลือ', 'จำนวนขั้นต่ำ', 'สถานที่จัดเก็บ', 'รายละเอียด'], ...materials.map(item => [item.sku, item.name, item.category, item.ink_type, item.unit, item.quantity, item.minimum_quantity, item.location, item.description])]);
}
