/* =============================================
   MBR Reports — app.js
   AI Report Generation + Excel + Images
   ============================================= */

'use strict';

// ===========================
// STATE
// ===========================
const state = {
  reportType: 'weekly',
  reportLang: 'ar',          // NEW: controlled by toggle buttons
  uploadedImages: [],
  excelData: null,
  generatedReport: null,
  savedReports: [],
  settings: {
    orgName: '',
    logo: '',
    brandColor: '#6c63ff',
    geminiKey: ''
  }
};

const REPORT_LABELS = {
  daily:     { ar: 'يومي',           en: 'Daily',           icon: '🌅' },
  weekly:    { ar: 'أسبوعي',         en: 'Weekly',          icon: '📅' },
  monthly:   { ar: 'شهري',           en: 'Monthly',         icon: '📆' },
  quarterly: { ar: 'ربعي',           en: 'Quarterly',       icon: '📊' },
  semi:      { ar: 'نصف سنوي',       en: 'Semi-Annual',     icon: '📈' },
  annual:    { ar: 'سنوي',           en: 'Annual',          icon: '🏆' },
  general:   { ar: 'عام',            en: 'General',         icon: '📄' },
  financial: { ar: 'مالي',           en: 'Financial',       icon: '💰' },
  admin:     { ar: 'إداري',          en: 'Administrative',  icon: '🏛️' },
  project:   { ar: 'مشروع',          en: 'Project',         icon: '📐' },
  it:        { ar: 'تقنية المعلومات', en: 'IT Report',      icon: '💻' },
  hr:        { ar: 'أداء موظفين',    en: 'HR Report',       icon: '👥' },
  marketing: { ar: 'تسويقي',         en: 'Marketing',       icon: '📣' }
};

// ===========================
// INIT
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  loadSavedApiKey();
  renderHistory();
  updateAiStatus('ready');
});

// ===========================
// NAVIGATION
// ===========================
function showSection(name) {
  const allSections = ['create','history','settings','compare','saved','marketplace','ai'];
  allSections.forEach(s => {
    const el = document.getElementById(`section${capitalize(s)}`);
    if (el) el.style.display = (s === name) ? 'block' : 'none';
  });
  ['navCreate','navHistory','navSettings','navCompare','navSaved','navMarketplace','navAi'].forEach(id => {
    document.getElementById(id)?.classList.remove('active');
  });
  document.getElementById(`nav${capitalize(name)}`)?.classList.add('active');
  if (name === 'history' || name === 'saved') renderHistory();
  if (name === 'settings') loadSettingsForm();
}
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ===========================
// REPORT LANGUAGE TOGGLE
// ===========================
function setReportLang(lang, btn) {
  state.reportLang = lang;
  document.querySelectorAll('.lang-toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// ===========================
// REPORT TYPE
// ===========================
function setReportType(type) {
  state.reportType = type;
  // Sync dropdown
  const sel = document.getElementById('reportTypeSelect');
  if (sel && sel.value !== type) sel.value = type;
  // Load sections template (built-in or custom)
  const customTemplates = loadCustomTemplates();
  const custom = customTemplates.find(t => t.id === type);
  if (custom) {
    loadCustomTemplateSections(custom);
  }
}

// ===========================
// SECTIONS BUILDER
// ===========================
let sectionCount = 3;

function addSection() {
  const builder = document.getElementById('sectionsBuilder');
  const div = document.createElement('div');
  div.className = 'text-section';
  div.dataset.section = sectionCount++;
  div.innerHTML = `
    <div class="text-section-header">
      <input type="text" class="section-title-input" placeholder="عنوان القسم" />
      <button class="remove-section-btn" onclick="removeSection(this)" title="حذف القسم">✕</button>
    </div>
    <textarea class="section-textarea" placeholder="اكتب هنا محتوى هذا القسم..."></textarea>
  `;
  builder.appendChild(div);
  div.querySelector('.section-title-input')?.focus();
}

function removeSection(btn) {
  const sections = document.querySelectorAll('.text-section');
  if (sections.length <= 1) { showToast('يجب أن يبقى قسم واحد على الأقل', 'error'); return; }
  btn.closest('.text-section').remove();
}

function clearText() {
  document.querySelectorAll('.section-textarea').forEach(t => t.value = '');
}

function getSectionTemplate() {
  const templates = {
    weekly: [
      { title: 'إنجازات الأسبوع', content: '- إنجاز 1\n- إنجاز 2\n- إنجاز 3' },
      { title: 'التحديات', content: '' },
      { title: 'مؤشرات الأداء', content: '' },
      { title: 'خطة الأسبوع القادم', content: '' }
    ],
    quarterly: [
      { title: 'ملخص الربع', content: '' },
      { title: 'النتائج والإنجازات', content: '' },
      { title: 'تحليل المؤشرات', content: '' },
      { title: 'التحديات والحلول', content: '' },
      { title: 'خطة الربع القادم', content: '' }
    ],
    semi: [
      { title: 'ملخص تنفيذي', content: '' },
      { title: 'الأداء المالي', content: '' },
      { title: 'إنجازات النصف الأول', content: '' },
      { title: 'تحليل المخاطر', content: '' },
      { title: 'توجهات النصف الثاني', content: '' }
    ],
    annual: [
      { title: 'الرؤية والأهداف الاستراتيجية', content: '' },
      { title: 'ملخص تنفيذي للعام', content: '' },
      { title: 'الأداء المالي السنوي', content: '' },
      { title: 'الإنجازات الكبرى', content: '' },
      { title: 'التحديات والدروس المستفادة', content: '' },
      { title: 'خطة العام القادم', content: '' }
    ]
  };
  const tmpl = templates[state.reportType] || templates.weekly;
  const builder = document.getElementById('sectionsBuilder');
  builder.innerHTML = '';
  sectionCount = 0;
  tmpl.forEach(s => {
    const div = document.createElement('div');
    div.className = 'text-section';
    div.dataset.section = sectionCount++;
    div.innerHTML = `
      <div class="text-section-header">
        <input type="text" class="section-title-input" value="${s.title}" placeholder="عنوان القسم" />
        <button class="remove-section-btn" onclick="removeSection(this)" title="حذف القسم">✕</button>
      </div>
      <textarea class="section-textarea" placeholder="اكتب هنا محتوى هذا القسم...">${s.content}</textarea>
    `;
    builder.appendChild(div);
  });
  showToast('تم تحميل قالب ' + REPORT_LABELS[state.reportType].ar, 'success');
}

// ===========================
// IMAGE HANDLING
// ===========================
function triggerImageUpload() { document.getElementById('imageInput').click(); }

function handleImageUpload(files) {
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) { showToast('الملف ليس صورة: ' + file.name, 'error'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      state.uploadedImages.push({ file, url: e.target.result, name: file.name });
      renderImagePreviews();
    };
    reader.readAsDataURL(file);
  });
  document.getElementById('imageInput').value = '';
}

function renderImagePreviews() {
  const container = document.getElementById('imagePreviews');
  container.innerHTML = state.uploadedImages.map((img, i) => `
    <div class="img-preview-item">
      <img src="${img.url}" alt="${img.name}" />
      <button class="img-preview-remove" onclick="removeImage(${i})">✕</button>
    </div>
  `).join('');
}

function removeImage(i) {
  state.uploadedImages.splice(i, 1);
  renderImagePreviews();
}

function dragOver(e, el) {
  e.preventDefault();
  el.classList.add('drag-over');
}
function dragLeave(el) { el.classList.remove('drag-over'); }

function dropImages(e, el) {
  e.preventDefault();
  el.classList.remove('drag-over');
  handleImageUpload(e.dataTransfer.files);
}
function dropExcel(e, el) {
  e.preventDefault();
  el.classList.remove('drag-over');
  if (e.dataTransfer.files.length) handleExcelUpload(e.dataTransfer.files[0]);
}

// ===========================
// EXCEL HANDLING
// ===========================
function triggerExcelUpload() { document.getElementById('excelInput').click(); }

function handleExcelUpload(file) {
  if (!file) return;
  const allowed = ['.xlsx','.xls','.csv'];
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  if (!allowed.includes(ext)) { showToast('يرجى رفع ملف Excel أو CSV فقط', 'error'); return; }

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      if (!json || json.length === 0) { showToast('الملف فارغ', 'error'); return; }
      const headers = json[0].map(h => String(h));
      const rows = json.slice(1).filter(r => r.some(c => c !== ''));

      state.excelData = { headers, rows, sheetName, fileName: file.name };
      renderExcelPreview();
      showToast(`تم استيراد ${rows.length} صف من "${sheetName}"`, 'success');
    } catch (err) {
      showToast('خطأ في قراءة الملف: ' + err.message, 'error');
    }
  };
  reader.readAsArrayBuffer(file);
  document.getElementById('excelInput').value = '';
}

function renderExcelPreview() {
  const { headers, rows, fileName } = state.excelData;
  const previewRows = rows.slice(0, 8);
  const hasMore = rows.length > 8;

  const table = `
    <table>
      <thead><tr>${headers.map(h => `<th>${escapeHtml(String(h))}</th>`).join('')}</tr></thead>
      <tbody>
        ${previewRows.map(row => `<tr>${headers.map((_,i) => `<td>${escapeHtml(String(row[i]??''))}</td>`).join('')}</tr>`).join('')}
        ${hasMore ? `<tr><td colspan="${headers.length}" style="text-align:center;padding:0.5rem;color:var(--text-muted)">... و ${rows.length - 8} صفوف أخرى</td></tr>` : ''}
      </tbody>
    </table>`;

  const el = document.getElementById('excelPreview');
  el.innerHTML = `<div style="padding:0.5rem 0.75rem;font-size:0.72rem;color:var(--accent-2);border-bottom:1px solid rgba(0,212,170,0.2)">📊 ${fileName} — ${rows.length} صف</div>` + table;
  el.style.display = 'block';
}

// ===========================
// AI SLIDER
// ===========================
function updateDetailLabel(v) {
  const labels = { '1': 'موجز', '2': 'متوازن', '3': 'مفصّل' };
  document.getElementById('detailLabel').textContent = labels[v] || 'متوازن';
}

// ===========================
// API KEY
// ===========================
function loadSavedApiKey() {
  const saved = localStorage.getItem('mbrcst_openai_key');
  if (saved) {
    document.getElementById('apiKeyInput').value = saved;
    document.getElementById('saveApiKey').checked = true;
    document.getElementById('savedApiKeyDisplay') && (document.getElementById('savedApiKeyDisplay').value = saved);
  }
}

function toggleSaveKey(cb) {
  if (cb.checked) {
    const key = document.getElementById('apiKeyInput').value.trim();
    if (key) localStorage.setItem('mbrcst_openai_key', key);
  } else {
    localStorage.removeItem('mbrcst_openai_key');
  }
}

async function testApiKey() {
  const key = document.getElementById('apiKeyInput').value.trim();
  if (!key) { showToast('أدخل API Key أولاً', 'error'); return; }
  updateAiStatus('busy');
  showToast('جارٍ اختبار الاتصال...', '');
  try {
    const res = await fetch('/api/openai-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _apiKey: key })
    });
    if (res.ok) {
      updateAiStatus('ready');
      showToast('✅ مفتاح API صحيح ويعمل!', 'success');
    } else {
      updateAiStatus('error');
      showToast('❌ مفتاح API غير صحيح', 'error');
    }
  } catch {
    updateAiStatus('error');
    showToast('❌ تعذّر الاتصال — تحقق من الإنترنت', 'error');
  }
}

function updateAiStatus(status) {
  const badge = document.getElementById('aiStatusBadge');
  const text = document.getElementById('aiStatusText');
  badge.className = 'ai-status';
  if (status === 'ready') { badge.classList.add(''); text.textContent = 'AI جاهز'; }
  if (status === 'busy') { badge.classList.add('busy'); text.textContent = 'AI يعالج...'; }
  if (status === 'error') { badge.classList.add('error'); text.textContent = 'AI غير متصل'; }
}

// ===========================
// REPORT GENERATION
// ===========================
async function generateReport() {
  const title = document.getElementById('reportTitle').value.trim();
  const dept = document.getElementById('reportDept').value.trim();
  const period = document.getElementById('reportPeriod').value.trim();
  const notes = document.getElementById('reportNotes').value.trim();
  const preparer = document.getElementById('reportPreparer').value.trim(); // NEW
  const tone = document.getElementById('aiTone').value;
  const lang = state.reportLang;  // from toggle button
  const detail = document.getElementById('aiDetail').value;

  // Collect sections
  const sections = [];
  document.querySelectorAll('.text-section').forEach(s => {
    const t = s.querySelector('.section-title-input')?.value?.trim();
    const c = s.querySelector('.section-textarea')?.value?.trim();
    if (t || c) sections.push({ title: t || 'قسم', content: c || '' });
  });

  if (!title && sections.every(s => !s.content)) {
    showToast('يرجى إدخال عنوان التقرير أو محتوى على الأقل', 'error');
    return;
  }

  // Show loading
  document.getElementById('generateBtn').disabled = true;
  document.getElementById('previewIdle').style.display = 'none';
  document.getElementById('previewLoading').style.display = 'flex';
  document.getElementById('reportOutput').style.display = 'none';
  updateAiStatus('busy');

  await animateLoadingSteps();

  // Process with AI or locally
  let processedSections = [];
  const apiKey = document.getElementById('apiKeyInput').value.trim() || localStorage.getItem('mbrcst_openai_key');

  try {
    if (apiKey && sections.some(s => s.content)) {
      processedSections = await processWithAI(sections, tone, lang, detail, apiKey);
    } else {
      processedSections = localEnhance(sections, lang);
    }
  } catch (err) {
    console.error(err);
    processedSections = localEnhance(sections, lang);
    showToast('تم استخدام المعالجة المحلية (تحقق من API Key)', 'error');
  }

  // Build report HTML
  const reportHTML = buildReportHTML({
    title: title || 'تقرير دوري',
    dept, period, notes, preparer,   // added preparer
    sections: processedSections,
    images: state.uploadedImages,
    excel: state.excelData,
    type: state.reportType,
    lang
  });

  state.generatedReport = { html: reportHTML, title, type: state.reportType, date: new Date().toISOString(), dept, period, preparer };

  // Show
  document.getElementById('previewLoading').style.display = 'none';
  document.getElementById('reportOutput').style.display = 'block';
  document.getElementById('reportDocument').innerHTML = reportHTML;
  document.getElementById('generateBtn').disabled = false;
  updateAiStatus('ready');
  showToast('تم إنشاء التقرير بنجاح ✅', 'success');
}

// ===========================
// LOADING ANIMATION
// ===========================
async function animateLoadingSteps() {
  const steps = ['step1','step2','step3','step4'];
  const msgs = ['يحلل الذكاء الاصطناعي المحتوى...','يحسّن الصياغة والأسلوب...','يدمج الصور والبيانات...','يُنسّق التقرير النهائي...'];
  for (let i = 0; i < steps.length; i++) {
    document.getElementById('loadingMsg').textContent = msgs[i];
    steps.forEach((id, j) => {
      const el = document.getElementById(id);
      if (j < i) el.className = 'loading-step done';
      else if (j === i) el.className = 'loading-step active';
      else el.className = 'loading-step';
    });
    await sleep(600);
  }
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ===========================
// AI PROCESSING (OpenAI)
// ===========================
async function processWithAI(sections, tone, lang, detail, apiKey) {
  const toneMap = { professional: 'رسمي واحترافي', executive: 'تنفيذي مختصر', detailed: 'تحليلي مفصّل', friendly: 'ودّي وسلس' };
  const detailMap = { '1': 'موجز (3-5 جمل لكل قسم)', '2': 'متوازن (5-8 جمل)', '3': 'مفصّل (فقرات متعددة)' };
  const langMap = { ar: 'العربية', en: 'الإنجليزية', both: 'عربي وإنجليزي معاً' };

  const sectionsText = sections.map(s => `## ${s.title}\n${s.content || '(فارغ - اقترح محتوى مناسباً)'}`).join('\n\n');

  const prompt = `أنت مساعد متخصص في كتابة التقارير المهنية.
المهمة: حسّن وأعد صياغة الأقسام التالية لتقرير ${REPORT_LABELS[state.reportType]?.ar}.
الأسلوب: ${toneMap[tone] || 'رسمي'}
اللغة: ${langMap[lang] || 'العربية'}
التفاصيل: ${detailMap[detail] || 'متوازن'}

الأقسام للمعالجة:
${sectionsText}

المطلوب:
- حسّن الصياغة واجعلها أكثر احترافية
- اجعل النص منظماً ومترابطاً
- أضف نقاط إذا كان النص قائمة
- احتفظ بالمعلومات الأصلية
- أجب بصيغة JSON: { "sections": [{ "title": "...", "content": "..." }] }`;

  const response = await fetch('/api/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      _apiKey: apiKey,
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 3000,
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) throw new Error('OpenAI API error: ' + response.status);

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  const parsed = JSON.parse(content);
  return parsed.sections || sections;
}

// ===========================
// LOCAL ENHANCE (Fallback)
// ===========================
function localEnhance(sections, lang) {
  return sections.map(s => {
    let content = s.content || '';
    // Convert bullet lines to proper list items
    const lines = content.split('\n').filter(l => l.trim());
    const isList = lines.some(l => l.trim().startsWith('-') || l.trim().startsWith('•') || l.trim().match(/^\d+\./));
    if (isList && lines.length > 1) {
      content = '<ul>' + lines.map(l => {
        const cleaned = l.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
        return cleaned ? `<li>${cleaned}</li>` : '';
      }).filter(Boolean).join('') + '</ul>';
    } else if (lines.length > 0) {
      content = lines.map(l => `<p>${l.trim()}</p>`).join('');
    }
    return { ...s, content };
  });
}

// ===========================
// BUILD REPORT HTML
// ===========================
function buildReportHTML({ title, dept, period, notes, preparer, sections, images, excel, type, lang }) {
  const label = REPORT_LABELS[type] || REPORT_LABELS.weekly;
  const now = new Date();
  const dateStr = now.toLocaleDateString('ar-SA', { year:'numeric', month:'long', day:'numeric' });
  const orgName = state.settings.orgName || 'MBR';
  const logoUrl = state.settings.logo || '';
  const brandColor = state.settings.brandColor || '#6c63ff';

  // Logo section
  const logoHTML = logoUrl
    ? `<img src="${logoUrl}" style="height:48px;object-fit:contain;" alt="شعار" />`
    : `<div class="report-doc-logo-icon" style="background:linear-gradient(135deg,${brandColor},#00d4aa)">✦</div>`;

  // KPI section (from excel or default)
  const hasKPIs = excel && excel.headers.length >= 2;
  let kpiHTML = '';
  if (hasKPIs) {
    const kpiRows = excel.rows.slice(0, 4);
    kpiHTML = `<div class="report-kpi-grid">
      ${kpiRows.map(row => `
        <div class="report-kpi-card">
          <div class="report-kpi-value">${escapeHtml(String(row[1] ?? '—'))}</div>
          <div class="report-kpi-label">${escapeHtml(String(row[0] ?? ''))}</div>
        </div>
      `).join('')}
    </div>`;
  }

  // Sections
  const sectionsHTML = sections.map((s, i) => {
    const icons = ['📌','📝','🎯','📊','⚡','🔍','✅','🔮'];
    return `
      <div class="report-section-block">
        <div class="report-section-title" style="color:${brandColor}">
          ${icons[i % icons.length]} ${escapeHtml(s.title)}
        </div>
        <div class="report-section-content">${s.content || `<p style="color:var(--text-muted)">لا يوجد محتوى</p>`}</div>
      </div>
    `;
  }).join('');

  // Images section
  let imagesHTML = '';
  if (images && images.length > 0) {
    imagesHTML = `
      <div class="report-images-section">
        <div class="report-section-title" style="color:${brandColor}">🖼️ الصور والمرفقات المرئية</div>
        <div class="report-images-grid">
          ${images.map((img, i) => `
            <div class="report-image-item">
              <img src="${img.url}" alt="${escapeHtml(img.name)}" />
              <p>${escapeHtml(img.name)}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Excel table
  let excelHTML = '';
  if (excel) {
    excelHTML = `
      <div class="report-excel-section">
        <div class="report-section-title" style="color:${brandColor}">📊 البيانات — ${escapeHtml(excel.fileName || excel.sheetName)}</div>
        <div class="report-excel-table-wrap">
          <table class="report-excel-table">
            <thead><tr>${excel.headers.map(h => `<th>${escapeHtml(String(h))}</th>`).join('')}</tr></thead>
            <tbody>${excel.rows.map(row => `<tr>${excel.headers.map((_,i) => `<td>${escapeHtml(String(row[i]??''))}</td>`).join('')}</tr>`).join('')}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  return `
    <div class="report-doc-header">
      <div class="report-doc-logo">
        ${logoHTML}
        <div class="report-doc-logo-text">
          <h2>${escapeHtml(orgName)} Studio</h2>
          <p>التقارير الدورية الذكية</p>
        </div>
      </div>
      <div class="report-doc-meta">
        <div class="report-type-badge" style="background:rgba(108,99,255,0.15);border-color:${brandColor}40;color:${brandColor}">${label.icon} تقرير ${label.ar}</div>
        <p>${dateStr}</p>
      </div>
    </div>

    <div class="report-doc-title-section">
      <div class="report-doc-title">${escapeHtml(title)}</div>
      <div class="report-doc-info">
        ${dept ? `<span>🏢 ${escapeHtml(dept)}</span>` : ''}
        ${period ? `<span>📅 ${escapeHtml(period)}</span>` : ''}
        ${preparer ? `<span>👤 ${escapeHtml(preparer)}</span>` : ''}
        ${notes ? `<span>📌 ${escapeHtml(notes)}</span>` : ''}
      </div>
    </div>

    ${kpiHTML}
    ${sectionsHTML}
    ${imagesHTML}
    ${excelHTML}

    <div class="report-doc-footer">
      <span>تم الإنشاء بواسطة MBR Reports الذكي</span>
      <span>${dateStr} — ${now.toLocaleTimeString('ar-SA')}</span>
    </div>
  `;
}

// ===========================
// COPY / PRINT / PDF / SAVE
// ===========================
function copyReport() {
  const doc = document.getElementById('reportDocument');
  if (!doc || !doc.innerHTML.trim()) { showToast('لا يوجد تقرير للنسخ', 'error'); return; }
  navigator.clipboard.writeText(doc.innerText).then(() => showToast('تم نسخ التقرير ✅', 'success'));
}

function printReport() {
  const doc = document.getElementById('reportDocument');
  if (!doc || !doc.innerHTML.trim()) { showToast('لا يوجد تقرير للطباعة', 'error'); return; }
  window.print();
}

async function exportPDF() {
  const doc = document.getElementById('reportDocument');
  if (!doc || !doc.innerHTML.trim()) { showToast('لا يوجد تقرير للتصدير', 'error'); return; }

  const btn = document.querySelector('.btn-export');
  const orig = btn.textContent;
  btn.textContent = '⏳ جارٍ التصدير...';
  btn.disabled = true;

  const opt = {
    margin: 0.5,
    filename: `MBR Reports_${state.reportType}_${new Date().toISOString().slice(0,10)}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  try {
    await html2pdf().set(opt).from(doc).save();
    showToast('تم تصدير PDF ✅', 'success');
  } catch {
    showToast('تعذّر التصدير — حاول الطباعة', 'error');
  }
  btn.textContent = orig;
  btn.disabled = false;
}

function saveReport() {
  if (!state.generatedReport) { showToast('لا يوجد تقرير للحفظ', 'error'); return; }
  const r = { ...state.generatedReport, id: Date.now() };
  state.savedReports.push(r);
  saveToStorage();
  showToast('تم حفظ التقرير محلياً 💾', 'success');
}

// ===========================
// HISTORY
// ===========================
function renderHistory() {
  const grid = document.getElementById('historyGrid');
  const empty = document.getElementById('historyEmpty');
  if (!grid) return;

  if (!state.savedReports.length) {
    if (empty) empty.style.display = 'block';
    const cards = grid.querySelectorAll('.history-card');
    cards.forEach(c => c.remove());
    return;
  }
  if (empty) empty.style.display = 'none';

  // Remove old cards
  grid.querySelectorAll('.history-card').forEach(c => c.remove());

  state.savedReports.slice().reverse().forEach(r => {
    const card = document.createElement('div');
    card.className = 'history-card';
    const label = REPORT_LABELS[r.type] || REPORT_LABELS.weekly;
    const date = new Date(r.date).toLocaleDateString('ar-SA', { year:'numeric', month:'short', day:'numeric' });
    card.innerHTML = `
      <div class="history-card-type">${label.icon} ${label.ar}</div>
      <h4>${escapeHtml(r.title || 'تقرير بدون عنوان')}</h4>
      <p>${escapeHtml(r.dept || '')} ${r.period ? '— ' + escapeHtml(r.period) : ''}</p>
      <div class="history-card-footer">
        <span class="history-card-date">📅 ${date}</span>
        <div class="history-card-actions">
          <button class="hca-btn" onclick="viewSavedReport(${r.id})">عرض</button>
          <button class="hca-btn del" onclick="deleteSavedReport(${r.id})">🗑️</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function viewSavedReport(id) {
  const r = state.savedReports.find(x => x.id === id);
  if (!r) return;
  document.getElementById('modalBody').innerHTML = `<div class="report-document">${r.html}</div>`;
  document.getElementById('reportModal').style.display = 'flex';
}

function deleteSavedReport(id) {
  state.savedReports = state.savedReports.filter(r => r.id !== id);
  saveToStorage();
  renderHistory();
  showToast('تم حذف التقرير', 'success');
}

function clearAllHistory() {
  if (!state.savedReports.length) return;
  if (!confirm('هل تريد حذف جميع التقارير المحفوظة؟')) return;
  state.savedReports = [];
  saveToStorage();
  renderHistory();
  showToast('تم مسح جميع التقارير', 'success');
}

function closeModal(e) {
  if (e.target === document.getElementById('reportModal')) {
    document.getElementById('reportModal').style.display = 'none';
  }
}

// ===========================
// SETTINGS
// ===========================
function loadSettingsForm() {
  document.getElementById('settingOrgName').value = state.settings.orgName || '';
  document.getElementById('settingLogo').value = state.settings.logo || '';
  document.getElementById('brandColor').value = state.settings.brandColor || '#6c63ff';
  document.getElementById('brandColorHex').textContent = state.settings.brandColor || '#6c63ff';
  const savedKey = localStorage.getItem('mbrcst_openai_key') || '';
  document.getElementById('savedApiKeyDisplay') && (document.getElementById('savedApiKeyDisplay').value = savedKey);
  const gemKey = localStorage.getItem('mbrcst_gemini_key') || '';
  document.getElementById('geminiApiKey') && (document.getElementById('geminiApiKey').value = gemKey);
}

function handleLogoUpload(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    state.settings.logo = e.target.result;
    document.getElementById('settingLogo').value = '';
    showToast('تم رفع الشعار ✅', 'success');
  };
  reader.readAsDataURL(file);
}

function applyBrandColor(val) {
  document.getElementById('brandColorHex').textContent = val;
  document.documentElement.style.setProperty('--accent', val);
}

function clearSavedKey() {
  localStorage.removeItem('mbrcst_openai_key');
  const el = document.getElementById('savedApiKeyDisplay');
  if (el) el.value = '';
  const el2 = document.getElementById('apiKeyInput');
  if (el2) el2.value = '';
  showToast('تم مسح المفتاح', 'success');
}

function saveApiKeyFromSettings() {
  const key = document.getElementById('savedApiKeyDisplay')?.value?.trim();
  if (!key) { showToast('أدخل المفتاح أولاً', 'error'); return; }
  if (!key.startsWith('sk-')) { showToast('المفتاح يجب أن يبدأ بـ sk-', 'error'); return; }
  localStorage.setItem('mbrcst_openai_key', key);
  // Sync to the create page field too
  const el = document.getElementById('apiKeyInput');
  if (el) el.value = key;
  const cb = document.getElementById('saveApiKey');
  if (cb) cb.checked = true;
  showToast('✅ تم حفظ المفتاح بنجاح!', 'success');
}

async function testSavedKey() {
  const key = document.getElementById('savedApiKeyDisplay')?.value?.trim()
             || localStorage.getItem('mbrcst_openai_key');
  if (!key) { showToast('لا يوجد مفتاح للاختبار', 'error'); return; }
  updateAiStatus('busy');
  showToast('جارٍ اختبار الاتصال...', '');
  try {
    const res = await fetch('/api/openai-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _apiKey: key })
    });
    if (res.ok) {
      updateAiStatus('ready');
      showToast('✅ الاتصال يعمل بنجاح!', 'success');
    } else {
      updateAiStatus('error');
      showToast('❌ المفتاح غير صحيح أو منتهي الصلاحية', 'error');
    }
  } catch {
    updateAiStatus('error');
    showToast('❌ تعذّر الاتصال — تحقق من الإنترنت', 'error');
  }
}

function saveGeminiKey() {
  const key = document.getElementById('geminiApiKey')?.value?.trim();
  if (key) { localStorage.setItem('mbrcst_gemini_key', key); showToast('تم حفظ Gemini Key ✅', 'success'); }
}

function saveSettings() {
  state.settings.orgName = document.getElementById('settingOrgName').value.trim();
  state.settings.logo = document.getElementById('settingLogo').value.trim() || state.settings.logo;
  state.settings.brandColor = document.getElementById('brandColor').value;
  saveToStorage();
  showToast('تم حفظ الإعدادات ✅', 'success');
}

function loadSettingsFromStorage() {
  const raw = localStorage.getItem('mbrcst_settings');
  if (raw) {
    try { state.settings = { ...state.settings, ...JSON.parse(raw) }; } catch {}
  }
}

// ===========================
// STORAGE
// ===========================
function saveToStorage() {
  try {
    localStorage.setItem('mbrcst_reports', JSON.stringify(state.savedReports.map(r => ({
      ...r, html: r.html.substring(0, 50000) // cap size
    }))));
    localStorage.setItem('mbrcst_settings', JSON.stringify(state.settings));
  } catch (e) {
    console.warn('Storage full:', e);
  }
}

function loadFromStorage() {
  const raw = localStorage.getItem('mbrcst_reports');
  if (raw) {
    try { state.savedReports = JSON.parse(raw); } catch {}
  }
  loadSettingsFromStorage();
  // Apply saved brand color
  if (state.settings.brandColor) {
    document.documentElement.style.setProperty('--accent', state.settings.brandColor);
  }
}

// ===========================
// TOAST
// ===========================
let toastTimer;
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.remove('show'); }, 3000);
}

// ===========================
// UTILS
// ===========================
function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
}

// ===========================
// THEME SWITCHING
// ===========================
function setTheme(theme) {
  document.body.classList.remove('theme-light', 'theme-corporate');
  if (theme === 'light') document.body.classList.add('theme-light');
  if (theme === 'corporate') document.body.classList.add('theme-corporate');
  localStorage.setItem('mbrcst_theme', theme);
  document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
  const map = { dark: 'themeDark', light: 'themeLight', corporate: 'themeCorp' };
  document.getElementById(map[theme])?.classList.add('active');
}

// ===========================
// REPORT NUMBER
// ===========================
function generateReportNumber() {
  const year = new Date().getFullYear();
  const seq = (parseInt(localStorage.getItem('mbrcst_seq') || '0') + 1);
  localStorage.setItem('mbrcst_seq', seq);
  const num = 'RPT-' + year + '-' + String(seq).padStart(3,'0');
  const el = document.getElementById('reportNumber');
  if (el && !el.value) el.value = num;
  return num;
}

// ===========================
// FULLSCREEN
// ===========================
function toggleFullscreen() {
  const panel = document.getElementById('previewPanel');
  const btn = document.getElementById('fullscreenBtn');
  if (!panel) return;
  if (panel.classList.contains('is-fullscreen')) {
    panel.classList.remove('is-fullscreen');
    if(btn){ btn.textContent = '⛶'; btn.title = 'ملء الشاشة'; }
  } else {
    panel.classList.add('is-fullscreen');
    if(btn){ btn.textContent = '✕'; btn.title = 'إغلاق ملء الشاشة'; }
  }
}

// ===========================
// WORD EXPORT
// ===========================
function exportWord() {
  const doc = document.getElementById('reportDocument');
  if (!doc || !doc.innerHTML.trim()) { showToast('لا يوجد تقرير للتصدير', 'error'); return; }
  const html = '<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;direction:rtl;text-align:right}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px}th{background:#f5f5f5}</style></head><body>' + doc.innerHTML + '</body></html>';
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'MBR Reports_' + state.reportType + '_' + new Date().toISOString().slice(0,10) + '.doc';
  a.click();
  URL.revokeObjectURL(url);
  showToast('✅ تم تصدير Word بنجاح!', 'success');
}

// ===========================
// CHART.JS
// ===========================
let activeCharts = [];
function generateChartHTML(excel) {
  if (!excel || !window.Chart) return '';
  const { headers, rows } = excel;
  if (headers.length < 2 || rows.length === 0) return '';
  const canvasId = 'mbrcst-chart-' + Date.now();
  const labels = rows.slice(0,10).map(r => String(r[0]||''));
  const values = rows.slice(0,10).map(r => parseFloat(r[1])||0);
  const brandColor = state.settings.brandColor || '#6c63ff';
  setTimeout(() => {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    activeCharts.forEach(c => c.destroy());
    activeCharts = [];
    activeCharts.push(new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: headers[1]||'القيمة', data: values,
          backgroundColor: brandColor+'80', borderColor: brandColor, borderWidth:2, borderRadius:6 }]
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ labels:{ color:'#9399b2', font:{family:'Cairo'} } } },
        scales:{
          x:{ ticks:{color:'#9399b2'}, grid:{color:'rgba(255,255,255,0.05)'} },
          y:{ ticks:{color:'#9399b2'}, grid:{color:'rgba(255,255,255,0.08)'} }
        }
      }
    }));
  }, 300);
  return '<div class="chart-container"><div class="chart-title">📊 ' + headers[0] + ' مقابل ' + headers[1] + '</div><div class="chart-wrap"><canvas id="' + canvasId + '"></canvas></div></div>';
}

// ===========================
// AI RESULT POPUP
// ===========================
function showAIResult(title, html) {
  const panel = document.createElement('div');
  panel.className = 'ai-result-panel';
  panel.onclick = (e) => { if(e.target===panel) panel.remove(); };
  panel.innerHTML = '<div class="ai-result-box"><h3>' + title + '</h3><div>' + html + '</div><button class="ai-result-close" onclick="this.closest(\'.ai-result-panel\').remove()">✓ حسناً</button></div>';
  document.body.appendChild(panel);
}

// ===========================
// AI: EXECUTIVE SUMMARY
// ===========================
async function generateExecutiveSummary() {
  const doc = document.getElementById('reportDocument');
  const apiKey = localStorage.getItem('mbrcst_openai_key') || document.getElementById('apiKeyInput')?.value?.trim();
  if (!apiKey) { showToast('يلزم API Key للملخص الذكي', 'error'); return; }
  if (!doc?.innerHTML.trim()) { showToast('أنشئ تقريراً أولاً', 'error'); return; }
  updateAiStatus('busy');
  showToast('جارٍ إنشاء الملخص التنفيذي...', '');
  const text = doc.innerText.slice(0,3000);
  try {
    const res = await fetch('/api/openai', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ _apiKey:apiKey, model:'gpt-4o-mini',
        messages:[{role:'user',content:'اكتب ملخصاً تنفيذياً احترافياً من 120 كلمة:\n'+text}], max_tokens:400 })
    });
    const data = await res.json();
    const summary = data.choices?.[0]?.message?.content || 'تعذر إنشاء الملخص';
    showAIResult('📋 الملخص التنفيذي', '<p style="line-height:1.9">' + summary.replace(/\n/g,'<br>') + '</p>');
    updateAiStatus('ready');
  } catch { showToast('❌ تعذّر الاتصال — تأكد من server.py', 'error'); updateAiStatus('error'); }
}

// ===========================
// AI: SUGGESTIONS
// ===========================
async function getAISuggestions() {
  const apiKey = localStorage.getItem('mbrcst_openai_key') || document.getElementById('apiKeyInput')?.value?.trim();
  if (!apiKey) { showToast('يلزم API Key للاقتراحات', 'error'); return; }
  const sections = [];
  document.querySelectorAll('.text-section').forEach(s => {
    const t = s.querySelector('.section-title-input')?.value?.trim();
    const c = s.querySelector('.section-textarea')?.value?.trim();
    if (c) sections.push(t+': '+c);
  });
  if (!sections.length) { showToast('أدخل محتوى التقرير أولاً', 'error'); return; }
  updateAiStatus('busy');
  showToast('جارٍ تحليل التقرير...', '');
  try {
    const res = await fetch('/api/openai', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ _apiKey:apiKey, model:'gpt-4o-mini',
        messages:[{role:'user',content:'راجع هذا التقرير واعطني 5 اقتراحات تحسين محددة:\n'+sections.join('\n')}], max_tokens:500 })
    });
    const data = await res.json();
    const txt = data.choices?.[0]?.message?.content || '';
    const html = txt.split('\n').filter(l=>l.trim()).map(l=>'<p>• '+l.replace(/^\d+\.\s*/,'')+'</p>').join('');
    showAIResult('💡 اقتراحات تحسين التقرير', html);
    updateAiStatus('ready');
  } catch { showToast('❌ تعذّر الاتصال', 'error'); updateAiStatus('error'); }
}

// ===========================
// AI: EXCEL ANALYSIS
// ===========================
async function analyzeExcelWithAI() {
  if (!state.excelData) { showToast('ارفع ملف Excel أولاً', 'error'); return; }
  const apiKey = localStorage.getItem('mbrcst_openai_key') || document.getElementById('apiKeyInput')?.value?.trim();
  if (!apiKey) { showToast('يلزم API Key للتحليل', 'error'); return; }
  updateAiStatus('busy');
  showToast('جارٍ تحليل بيانات Excel...', '');
  const { headers, rows } = state.excelData;
  const sample = rows.slice(0,15).map(r => headers.map((h,i)=>h+': '+r[i]).join(' | ')).join('\n');
  try {
    const res = await fetch('/api/openai', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ _apiKey:apiKey, model:'gpt-4o-mini',
        messages:[{role:'user',content:'حلّل هذه البيانات وقدّم: 1) أبرز المؤشرات 2) الاتجاهات 3) توصيات:\n'+sample}], max_tokens:600 })
    });
    const data = await res.json();
    const txt = data.choices?.[0]?.message?.content || '';
    const html = txt.split('\n').filter(l=>l.trim()).map(l=>'<p>'+l+'</p>').join('');
    showAIResult('📊 تحليل البيانات بالذكاء الاصطناعي', html);
    updateAiStatus('ready');
  } catch { showToast('❌ تعذّر الاتصال', 'error'); updateAiStatus('error'); }
}

// ===========================
// COMPARE REPORTS
// ===========================
function loadCompareReports() {
  ['compareReport1','compareReport2'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '<option value="">-- اختر تقرير --</option>' +
      state.savedReports.map(r => {
        const label = REPORT_LABELS[r.type]?.ar || r.type;
        const date = new Date(r.date).toLocaleDateString('ar-SA');
        return '<option value="'+r.id+'">' + label + ' — ' + (r.title||'بدون عنوان') + ' (' + date + ')</option>';
      }).join('');
  });
  if (!state.savedReports.length) showToast('احفظ تقارير أولاً لتتمكن من مقارنتها', 'error');
}

function compareReports() {
  const id1 = parseInt(document.getElementById('compareReport1')?.value);
  const id2 = parseInt(document.getElementById('compareReport2')?.value);
  if (!id1 || !id2) { showToast('اختر تقريرين للمقارنة', 'error'); return; }
  if (id1===id2) { showToast('اختر تقريرين مختلفين', 'error'); return; }
  const r1 = state.savedReports.find(r=>r.id===id1);
  const r2 = state.savedReports.find(r=>r.id===id2);
  if (!r1||!r2) return;
  const fields = [
    ['النوع', REPORT_LABELS[r1.type]?.ar, REPORT_LABELS[r2.type]?.ar],
    ['العنوان', r1.title||'—', r2.title||'—'],
    ['القسم', r1.dept||'—', r2.dept||'—'],
    ['الفترة', r1.period||'—', r2.period||'—'],
    ['معد التقرير', r1.preparer||'—', r2.preparer||'—'],
    ['تاريخ الإنشاء', new Date(r1.date).toLocaleDateString('ar-SA'), new Date(r2.date).toLocaleDateString('ar-SA')]
  ];
  const html = '<h3 style="margin-bottom:1rem;color:var(--accent)">🔍 نتائج المقارنة</h3>' +
    '<div class="compare-row" style="font-weight:700"><div>الحقل</div><div style="color:var(--accent)">التقرير الأول</div><div style="color:var(--accent-2)">التقرير الثاني</div></div>' +
    fields.map(([f,v1,v2])=>'<div class="compare-row"><div class="compare-field">'+f+'</div><div class="compare-val1">'+escapeHtml(String(v1))+'</div><div class="compare-val2">'+escapeHtml(String(v2))+'</div></div>').join('');
  const el = document.getElementById('compareResult');
  if(el){ el.innerHTML=html; el.style.display='block'; }
}

// ===========================
// SCHEDULE REMINDERS
// ===========================
async function scheduleReminder() {
  if (!('Notification' in window)) { showToast('متصفحك لا يدعم الإشعارات', 'error'); return; }
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') { showToast('يرجى السماح بالإشعارات', 'error'); return; }
  const type = state.reportType;
  const days = {weekly:7,quarterly:90,semi:180,annual:365}[type]||7;
  localStorage.setItem('mbrcst_reminder_'+type, Date.now()+(days*86400000));
  new Notification('MBR Reports ✅', { body:'سيتم تذكيرك بإنشاء التقرير ' + REPORT_LABELS[type]?.ar + ' بعد '+days+' يوماً' });
  showToast('✅ تم ضبط التذكير بعد '+days+' يوم', 'success');
}

// ===========================
// INIT EXTRAS ON DOM READY
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  // Apply saved theme
  const savedTheme = localStorage.getItem('mbrcst_theme') || 'dark';
  setTheme(savedTheme);
  // Generate report number
  generateReportNumber();
  // Update showSection to include compare
  const origShow = showSection;
  window.showSection = function(name) {
    ['create','history','compare','settings'].forEach(s => {
      const el = document.getElementById('section' + s.charAt(0).toUpperCase() + s.slice(1));
      if (el) el.style.display = (s === name) ? 'block' : 'none';
    });
    ['navCreate','navHistory','navCompare','navSettings'].forEach(id => {
      document.getElementById(id)?.classList.remove('active');
    });
    document.getElementById('nav' + name.charAt(0).toUpperCase() + name.slice(1))?.classList.add('active');
    if (name === 'history') renderHistory();
    if (name === 'settings') loadSettingsForm();
    if (name === 'compare') loadCompareReports();
  };
});

// ===========================
// GENERATE CHART IN REPORT
// ===========================
// Patch generateReport to inject chart after excel table
const _origGenReport = generateReport;
async function generateReport() {
  await _origGenReport();
  // Inject chart if Excel data exists
  if (state.excelData && window.Chart) {
    const doc = document.getElementById('reportDocument');
    if (doc) {
      const chartHTML = generateChartHTML(state.excelData);
      if (chartHTML) {
        const wrap = document.createElement('div');
        wrap.innerHTML = chartHTML;
        const excelSection = doc.querySelector('.report-excel-section');
        if (excelSection) excelSection.before(wrap.firstChild);
        else doc.appendChild(wrap.firstChild);
      }
    }
  }
}


// ===========================
// PROFILE (Persistent Data)
// ===========================
function saveProfile() {
  const profile = {
    name:  document.getElementById('profileName')?.value?.trim() || '',
    title: document.getElementById('profileTitle')?.value?.trim() || '',
    dept:  document.getElementById('profileDept')?.value?.trim() || '',
    org:   document.getElementById('profileOrg')?.value?.trim() || '',
    email: document.getElementById('profileEmail')?.value?.trim() || '',
    phone: document.getElementById('profilePhone')?.value?.trim() || ''
  };
  localStorage.setItem('mbrcst_profile', JSON.stringify(profile));
  // Auto-fill create form
  applyProfileToForm(profile);
  showToast('✅ تم حفظ الملف الشخصي!', 'success');
}

function loadProfile() {
  const raw = localStorage.getItem('mbrcst_profile');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function applyProfileToForm(profile) {
  if (!profile) return;
  // Auto-fill preparer from profile name + title
  const prepEl = document.getElementById('reportPreparer');
  if (prepEl && !prepEl.value) {
    prepEl.value = [profile.name, profile.title].filter(Boolean).join(' — ');
  }
  // Auto-fill dept
  const deptEl = document.getElementById('reportDept');
  if (deptEl && !deptEl.value && profile.dept) deptEl.value = profile.dept;
  // Auto-fill org name in settings
  const orgEl = document.getElementById('settingOrgName');
  if (orgEl && !orgEl.value && profile.org) orgEl.value = profile.org;
}

function loadProfileForm() {
  const p = loadProfile();
  if (!p) return;
  ['Name','Title','Dept','Org','Email','Phone'].forEach(f => {
    const el = document.getElementById('profile' + f);
    if (el) el.value = p[f.toLowerCase()] || '';
  });
}

// ===========================
// DATE RANGE → PERIOD STRING
// ===========================
function getPeriodString() {
  const from = document.getElementById('reportPeriodFrom')?.value;
  const to   = document.getElementById('reportPeriodTo')?.value;
  if (!from && !to) return '';
  const fmt = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toLocaleDateString('ar-SA', { year:'numeric', month:'long', day:'numeric' });
  };
  if (from && to) return fmt(from) + ' — ' + fmt(to);
  return fmt(from || to);
}

// ===========================
// PATCH loadSettingsForm to load profile
// ===========================
const _origLoadSettings = loadSettingsForm;
loadSettingsForm = function() {
  _origLoadSettings();
  loadProfileForm();
};

// ===========================
// PATCH DOMContentLoaded to apply profile
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to let other DOMContentLoaded handlers run
  setTimeout(() => {
    const p = loadProfile();
    if (p) applyProfileToForm(p);
  }, 200);
});

// ===========================
// PATCH generateReport to use date range + profile
// ===========================
const _superGenReport = generateReport;
async function generateReport() {
  // Inject period from date picker
  const periodStr = getPeriodString();
  // We need to temporarily override reading of reportPeriod
  // Add a hidden input or patch the call
  // Best: patch state before calling
  const hiddenInput = document.getElementById('reportPeriod') ||
    (() => {
      const inp = document.createElement('input');
      inp.id = 'reportPeriod';
      inp.type = 'hidden';
      document.body.appendChild(inp);
      return inp;
    })();
  hiddenInput.value = periodStr;

  // Auto-fill preparer from profile if empty
  const prepEl = document.getElementById('reportPreparer');
  if (prepEl && !prepEl.value) {
    const p = loadProfile();
    if (p) prepEl.value = [p.name, p.title].filter(Boolean).join(' — ');
  }

  await _superGenReport();
}


// ===========================
// SIGNATURE UPLOAD
// ===========================
const signatures = { preparer: null, approver: null };

function handleSignatureUpload(role, file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    signatures[role] = e.target.result;
    const img = document.getElementById('sig' + capitalize(role) + 'Img');
    const placeholder = document.getElementById('sig' + capitalize(role) + 'Placeholder');
    if (img) { img.src = e.target.result; img.style.display = 'block'; }
    if (placeholder) placeholder.style.display = 'none';
    showToast('✅ تم رفع ' + (role === 'preparer' ? 'توقيع المعد' : 'توقيع المعتمد/الختم'), 'success');
  };
  reader.readAsDataURL(file);
}

// ===========================
// OPEN PREVIEW (new window)
// ===========================
function openPreview() {
  const doc = document.getElementById('reportDocument');
  if (!doc || !doc.innerHTML.trim()) { showToast('لا يوجد تقرير للمعاينة', 'error'); return; }
  const brandColor = state.settings.brandColor || '#6c63ff';
  const win = window.open('', '_blank', 'width=900,height=750');
  win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>معاينة التقرير — MBR Reports</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Cairo', sans-serif; background: #f4f6fa; min-height: 100vh; direction: rtl; }
  .preview-toolbar {
    position: sticky; top: 0; z-index: 100;
    background: #1a1a2e; padding: 0.75rem 2rem;
    display: flex; align-items: center; justify-content: space-between;
    box-shadow: 0 2px 20px rgba(0,0,0,0.3);
  }
  .preview-toolbar h4 { color: #fff; font-size: 0.9rem; }
  .toolbar-btns { display: flex; gap: 0.5rem; }
  .tbtn {
    padding: 0.45rem 1rem; border-radius: 8px; border: none;
    font-family: 'Cairo', sans-serif; font-size: 0.82rem; font-weight: 700;
    cursor: pointer; transition: all 0.2s;
  }
  .tbtn-print { background: ${brandColor}; color: white; }
  .tbtn-close { background: rgba(255,255,255,0.1); color: #ccc; }
  .tbtn:hover { opacity: 0.85; transform: translateY(-1px); }
  .page-wrap { max-width: 850px; margin: 2rem auto; background: #fff; border-radius: 12px; padding: 3rem; box-shadow: 0 4px 40px rgba(0,0,0,0.12); }
  /* Report styles */
  .report-doc-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 1.5rem; border-bottom: 2px solid #eee; margin-bottom: 2rem; }
  .report-doc-logo { display: flex; align-items: center; gap: 0.75rem; }
  .report-doc-logo-icon { width:48px;height:48px;background:linear-gradient(135deg,${brandColor},#00d4aa);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;color:white; }
  .report-doc-logo-text h2 { font-size:1.2rem;font-weight:900;color:${brandColor}; }
  .report-doc-logo-text p { font-size:0.75rem;color:#999; }
  .report-type-badge { display:inline-block;padding:0.3rem 0.9rem;border-radius:20px;font-size:0.75rem;font-weight:700;background:${brandColor}20;border:1px solid ${brandColor}40;color:${brandColor}; }
  .report-doc-title-section { margin-bottom:2rem; }
  .report-doc-title { font-size:1.6rem;font-weight:900;color:#1a1a2e;margin-bottom:0.5rem; }
  .report-doc-info { display:flex;gap:1.5rem;font-size:0.8rem;color:#666;flex-wrap:wrap; }
  .report-kpi-grid { display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:0.75rem;margin-bottom:2rem; }
  .report-kpi-card { background:#f8f9fa;border:1px solid #eee;border-radius:10px;padding:1rem;text-align:center; }
  .report-kpi-value { font-size:1.6rem;font-weight:900;color:${brandColor}; }
  .report-kpi-label { font-size:0.72rem;color:#999;margin-top:0.2rem; }
  .report-section-block { margin-bottom:2rem; }
  .report-section-title { font-size:1rem;font-weight:800;color:${brandColor};margin-bottom:0.75rem;padding-bottom:0.4rem;border-bottom:2px solid ${brandColor}30; }
  .report-section-content { font-size:0.9rem;color:#333;line-height:1.9; }
  .report-section-content ul { padding-right:1.5rem;margin-top:0.5rem; }
  .report-section-content li { margin-bottom:0.4rem; }
  .report-excel-section { margin-bottom:2rem; }
  .report-excel-table { width:100%;border-collapse:collapse;font-size:0.82rem;margin-top:0.75rem; }
  .report-excel-table th { background:${brandColor}15;padding:0.5rem 0.75rem;text-align:right;font-weight:700;color:${brandColor};border-bottom:2px solid ${brandColor}30; }
  .report-excel-table td { padding:0.45rem 0.75rem;border-bottom:1px solid #f0f0f0;color:#444; }
  .report-doc-footer { margin-top:2.5rem;padding-top:1rem;border-top:1px solid #eee;display:flex;justify-content:space-between;font-size:0.72rem;color:#999; }
  .report-images-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:0.75rem;margin-top:0.75rem; }
  .report-image-item img { width:100%;border-radius:8px;border:1px solid #eee; }
  .report-image-item p { font-size:0.72rem;text-align:center;margin-top:0.3rem;color:#999; }
  @media print {
    .preview-toolbar { display: none !important; }
    body { background: white; }
    .page-wrap { box-shadow: none; margin: 0; border-radius: 0; }
  }
</style>
</head>
<body>
<div class="preview-toolbar">
  <h4>👁️ معاينة التقرير — MBR Reports</h4>
  <div class="toolbar-btns">
    <button class="tbtn tbtn-print" onclick="window.print()">🖨️ طباعة</button>
    <button class="tbtn tbtn-close" onclick="window.close()">✕ إغلاق</button>
  </div>
</div>
<div class="page-wrap">
  ${doc.innerHTML}
</div>
</body></html>`);
  win.document.close();
}

// ===========================
// POWERPOINT EXPORT
// ===========================
async function exportPowerPoint() {
  if (!state.generatedReport) { showToast('أنشئ تقريراً أولاً ثم صدّره', 'error'); return; }
  if (typeof PptxGenJS === 'undefined') { showToast('مكتبة PPTX لم تُحمَّل بعد', 'error'); return; }

  showToast('جارٍ إنشاء العرض التقديمي...', '');
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  const brand = state.settings.brandColor || '#6c63ff';
  const brandHex = brand.replace('#', '');
  const { title, dept, period, preparer, type } = state.generatedReport;
  const label = REPORT_LABELS[type]?.ar || type;

  // ── Slide 1: Title ──
  let s1 = pptx.addSlide();
  s1.background = { color: '0d0d1a' };
  s1.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.08, fill: { color: brandHex } });
  s1.addText(label, { x: 0.5, y: 1.2, w: 9, h: 0.5, fontSize: 16, color: brandHex, bold: true, align: 'center', rtlMode: true });
  s1.addText(title || 'تقرير دوري', { x: 0.5, y: 1.9, w: 9, h: 1.2, fontSize: 36, bold: true, color: 'FFFFFF', align: 'center', rtlMode: true });
  if (dept) s1.addText('📍 ' + dept, { x: 0.5, y: 3.3, w: 9, h: 0.4, fontSize: 14, color: 'AAAAAA', align: 'center', rtlMode: true });
  if (period) s1.addText('📅 ' + period, { x: 0.5, y: 3.8, w: 9, h: 0.4, fontSize: 14, color: 'AAAAAA', align: 'center', rtlMode: true });
  if (preparer) s1.addText('👤 ' + preparer, { x: 0.5, y: 4.3, w: 9, h: 0.4, fontSize: 13, color: '888888', align: 'center', rtlMode: true });
  s1.addShape(pptx.ShapeType.rect, { x: 0, y: 4.9, w: '100%', h: 0.06, fill: { color: brandHex } });
  s1.addText('MBR Reports — التقارير الذكية', { x: 0.5, y: 5.0, w: 9, h: 0.3, fontSize: 10, color: '555555', align: 'center' });

  // ── Content Slides: one per section ──
  const doc = document.getElementById('reportDocument');
  if (doc) {
    const sectionBlocks = doc.querySelectorAll('.report-section-block');
    sectionBlocks.forEach((block, i) => {
      const sTitle = block.querySelector('.report-section-title')?.innerText || ('قسم ' + (i+1));
      const sContent = block.querySelector('.report-section-content')?.innerText || '';
      const slide = pptx.addSlide();
      slide.background = { color: '0d0d1a' };
      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '30%', h: '100%', fill: { color: brandHex + '22' } });
      slide.addText(sTitle.replace(/[📌📝🎯📊⚡🔍✅🔮]/gu, '').trim(), {
        x: 0.2, y: 0.3, w: 2.8, h: 5,
        fontSize: 18, bold: true, color: brandHex,
        valign: 'top', rtlMode: true, wrap: true
      });
      const contentLines = sContent.split('\n').filter(l => l.trim()).slice(0, 12);
      slide.addText(contentLines.join('\n'), {
        x: 3.2, y: 0.4, w: 6.5, h: 4.8,
        fontSize: 13, color: 'CCCCCC',
        valign: 'top', rtlMode: true, wrap: true, lineSpacingMultiple: 1.5
      });
      slide.addText(label + ' • ' + (title || ''), {
        x: 0.3, y: 5.1, w: 9.4, h: 0.3, fontSize: 9, color: '555555', rtlMode: true
      });
    });
  }

  // ── Last slide: Thank you ──
  let last = pptx.addSlide();
  last.background = { color: '0d0d1a' };
  last.addText('شكراً', { x: 0.5, y: 2, w: 9, h: 1.5, fontSize: 48, bold: true, color: brandHex, align: 'center', rtlMode: true });
  last.addText('تم الإنشاء بواسطة MBR Reports', { x: 0.5, y: 3.8, w: 9, h: 0.5, fontSize: 14, color: '555555', align: 'center' });

  const fileName = 'MBR Reports_' + (type || 'report') + '_' + new Date().toISOString().slice(0,10) + '.pptx';
  await pptx.writeFile({ fileName });
  showToast('✅ تم تصدير PowerPoint بنجاح!', 'success');
}

// ===========================
// CUSTOM TEMPLATES
// ===========================
function loadCustomTemplates() {
  const raw = localStorage.getItem('mbrcst_custom_templates');
  try { return JSON.parse(raw) || []; } catch { return []; }
}

function saveCustomTemplates(templates) {
  localStorage.setItem('mbrcst_custom_templates', JSON.stringify(templates));
}

function addCustomTemplate() {
  const name = document.getElementById('newTemplateName')?.value?.trim();
  const sectionsRaw = document.getElementById('newTemplateSections')?.value?.trim();
  if (!name) { showToast('أدخل اسم القالب', 'error'); return; }
  if (!sectionsRaw) { showToast('أدخل أقسام القالب', 'error'); return; }

  const sections = sectionsRaw.split('\n').map(s => s.trim()).filter(Boolean);
  const templates = loadCustomTemplates();
  const id = 'custom_' + Date.now();
  templates.push({ id, name, sections });
  saveCustomTemplates(templates);

  // Add to dropdown
  refreshCustomTemplateOptions();
  renderCustomTemplatesUI();
  // Clear form
  if (document.getElementById('newTemplateName')) document.getElementById('newTemplateName').value = '';
  if (document.getElementById('newTemplateSections')) document.getElementById('newTemplateSections').value = '';
  showToast('✅ تم حفظ القالب: ' + name, 'success');
}

function deleteCustomTemplate(id) {
  const templates = loadCustomTemplates().filter(t => t.id !== id);
  saveCustomTemplates(templates);
  refreshCustomTemplateOptions();
  renderCustomTemplatesUI();
  showToast('تم حذف القالب', 'success');
}

function refreshCustomTemplateOptions() {
  const sel = document.getElementById('reportTypeSelect');
  if (!sel) return;
  // Remove old custom options
  Array.from(sel.options).forEach(o => { if (o.value.startsWith('custom_')) o.remove(); });
  // Add separator if needed
  const templates = loadCustomTemplates();
  if (templates.length) {
    let sepExists = Array.from(sel.options).some(o => o.value === '__sep_custom__');
    if (!sepExists) {
      const sep = document.createElement('option');
      sep.value = '__sep_custom__'; sep.disabled = true;
      sep.text = '── قوالب الشركة ──';
      sel.insertBefore(sep, Array.from(sel.options).find(o => o.value === '__custom_manage__'));
    }
    templates.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id; opt.text = '🏢 ' + t.name;
      sel.insertBefore(opt, Array.from(sel.options).find(o => o.value === '__custom_manage__'));
    });
  }
}

function renderCustomTemplatesUI() {
  const list = document.getElementById('customTemplatesList');
  if (!list) return;
  const templates = loadCustomTemplates();
  if (!templates.length) { list.innerHTML = '<p style="color:var(--text-muted);font-size:0.82rem">لا توجد قوالب مخصصة بعد</p>'; return; }
  list.innerHTML = templates.map(t => `
    <div class="custom-template-item">
      <div>
        <div class="custom-template-name">🏢 ${escapeHtml(t.name)}</div>
        <div class="custom-template-sections">${t.sections.slice(0,3).join(' · ')}${t.sections.length > 3 ? ' ...' : ''}</div>
      </div>
      <button class="custom-template-del" onclick="deleteCustomTemplate('${t.id}')">🗑️ حذف</button>
    </div>`).join('');
}

function loadCustomTemplateSections(template) {
  const builder = document.getElementById('sectionsBuilder');
  if (!builder) return;
  builder.innerHTML = '';
  let count = 0;
  template.sections.forEach(title => {
    const div = document.createElement('div');
    div.className = 'text-section';
    div.dataset.section = count++;
    div.innerHTML = `
      <div class="text-section-header">
        <input type="text" class="section-title-input" value="${escapeHtml(title)}" />
        <button class="remove-section-btn" onclick="removeSection(this)">✕</button>
      </div>
      <textarea class="section-textarea" placeholder="اكتب هنا محتوى هذا القسم..."></textarea>`;
    builder.appendChild(div);
  });
  showToast('✅ تم تحميل قالب: ' + template.name, 'success');
  // Scroll to sections
  builder.scrollIntoView({ behavior: 'smooth' });
}

// Load custom templates on settings open
const _origLoadSettingsForTemplates = loadSettingsForm;
loadSettingsForm = function() {
  if (typeof _origLoadSettingsForTemplates === 'function') _origLoadSettingsForTemplates();
  renderCustomTemplatesUI();
};

// Handle __custom_manage__ selection
const _origSetType = setReportType;
setReportType = function(type) {
  if (type === '__custom_manage__') {
    showSection('settings');
    setTimeout(() => {
      document.getElementById('newTemplateName')?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
    const sel = document.getElementById('reportTypeSelect');
    if (sel) sel.value = state.reportType || 'weekly';
    return;
  }
  if (typeof _origSetType === 'function') _origSetType(type);
};

// Init: load custom templates into dropdown on page load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(refreshCustomTemplateOptions, 500);
});


// ===========================
// EXTENDED SECTION TEMPLATES
// (patch getSectionTemplate)
// ===========================
const _baseGetTemplate = getSectionTemplate;
getSectionTemplate = function() {
  const extraTemplates = {
    daily: [
      { title: 'إنجازات اليوم', content: '' },
      { title: 'المهام المنجزة', content: '' },
      { title: 'تحديات واجهتها', content: '' },
      { title: 'خطة الغد', content: '' }
    ],
    monthly: [
      { title: 'ملخص الشهر', content: '' },
      { title: 'الإنجازات الرئيسية', content: '' },
      { title: 'مؤشرات الأداء الشهرية', content: '' },
      { title: 'التحديات والحلول', content: '' },
      { title: 'الأهداف المتبقية', content: '' },
      { title: 'خطة الشهر القادم', content: '' }
    ],
    general: [
      { title: 'الغرض من التقرير', content: '' },
      { title: 'الوضع الراهن', content: '' },
      { title: 'النتائج والتحليل', content: '' },
      { title: 'التوصيات', content: '' },
      { title: 'الخلاصة', content: '' }
    ],
    financial: [
      { title: 'ملخص مالي تنفيذي', content: '' },
      { title: 'الإيرادات', content: '' },
      { title: 'المصروفات والتكاليف', content: '' },
      { title: 'صافي الربح / الخسارة', content: '' },
      { title: 'تحليل مقارن بالهدف', content: '' },
      { title: 'توقعات الفترة القادمة', content: '' }
    ],
    admin: [
      { title: 'نظرة عامة إدارية', content: '' },
      { title: 'القرارات والإجراءات', content: '' },
      { title: 'التوظيف والموارد البشرية', content: '' },
      { title: 'الشراكات والتعاقدات', content: '' },
      { title: 'المخاطر الإدارية', content: '' },
      { title: 'التوصيات', content: '' }
    ],
    project: [
      { title: 'نظرة عامة على المشروع', content: '' },
      { title: 'التقدم المحرز', content: '' },
      { title: 'الجدول الزمني', content: '' },
      { title: 'الميزانية', content: '' },
      { title: 'المخاطر والعوائق', content: '' },
      { title: 'المهام القادمة', content: '' }
    ],
    it: [
      { title: 'ملخص تقني', content: '' },
      { title: 'حالة الأنظمة والبنية التحتية', content: '' },
      { title: 'الحوادث والأعطال', content: '' },
      { title: 'الأمن السيبراني', content: '' },
      { title: 'المشاريع التقنية الجارية', content: '' },
      { title: 'خطة التطوير', content: '' }
    ],
    hr: [
      { title: 'ملخص الأداء الوظيفي', content: '' },
      { title: 'معدل الحضور والانصراف', content: '' },
      { title: 'التدريب والتطوير', content: '' },
      { title: 'شكاوى وملاحظات الموظفين', content: '' },
      { title: 'التوظيف والترقيات', content: '' },
      { title: 'توصيات وخطة تطوير', content: '' }
    ],
    marketing: [
      { title: 'ملخص تسويقي', content: '' },
      { title: 'أداء الحملات الإعلانية', content: '' },
      { title: 'مؤشرات التواصل الاجتماعي', content: '' },
      { title: 'تحليل المنافسين', content: '' },
      { title: 'العملاء الجدد والاحتفاظ', content: '' },
      { title: 'خطة التسويق القادمة', content: '' }
    ]
  };

  if (extraTemplates[state.reportType]) {
    const tmpl = extraTemplates[state.reportType];
    const builder = document.getElementById('sectionsBuilder');
    if (!builder) return;
    builder.innerHTML = '';
    let count = 0;
    tmpl.forEach(s => {
      const div = document.createElement('div');
      div.className = 'text-section';
      div.dataset.section = count++;
      div.innerHTML = `
        <div class="text-section-header">
          <input type="text" class="section-title-input" value="${s.title}" placeholder="عنوان القسم" />
          <button class="remove-section-btn" onclick="removeSection(this)">✕</button>
        </div>
        <textarea class="section-textarea" placeholder="اكتب هنا محتوى هذا القسم...">${s.content}</textarea>`;
      builder.appendChild(div);
    });
    const label = REPORT_LABELS[state.reportType];
    showToast('تم تحميل قالب ' + (label?.ar || state.reportType), 'success');
    return;
  }

  // Fallback to original
  if (typeof _baseGetTemplate === 'function') _baseGetTemplate();
};


// ===========================
// TEMPLATE IMPORT / EXPORT
// ===========================
function exportTemplates() {
  const templates = loadCustomTemplates();
  if (!templates.length) { showToast('لا توجد قوالب للتصدير', 'error'); return; }
  const json = JSON.stringify({ version: '1.0', source: 'MBR Reports', templates }, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'MBR Reports-Templates-' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('✅ تم تصدير ' + templates.length + ' قالب', 'success');
}

function importTemplate(file) {
  if (!file) return;
  const name = file.name.toLowerCase();

  if (name.endsWith('.json')) {
    // JSON template import
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        let imported = [];
        if (data.templates && Array.isArray(data.templates)) {
          imported = data.templates;
        } else if (data.name && data.sections) {
          imported = [data];
        } else {
          showToast('تنسيق الملف غير مدعوم', 'error'); return;
        }
        const existing = loadCustomTemplates();
        imported.forEach(t => {
          const id = 'custom_' + Date.now() + '_' + Math.random().toString(36).slice(2,6);
          existing.push({ id, name: t.name, sections: t.sections });
        });
        saveCustomTemplates(existing);
        refreshCustomTemplateOptions();
        renderCustomTemplatesUI();
        showToast('✅ تم استيراد ' + imported.length + ' قالب بنجاح!', 'success');
      } catch { showToast('❌ الملف غير صالح', 'error'); }
    };
    reader.readAsText(file);

  } else if (name.endsWith('.docx') || name.endsWith('.doc')) {
    // Word document — extract headings as sections
    // Use simple approach: parse filename as template name
    // For deep parsing, would need mammoth.js; for now create a template with common sections
    const tName = file.name.replace(/\.(docx?|json)$/i, '').replace(/[-_]/g, ' ');
    const templates = loadCustomTemplates();
    const id = 'custom_' + Date.now();
    templates.push({
      id,
      name: tName,
      sections: ['ملخص التقرير', 'المحتوى الرئيسي', 'النتائج والتوصيات', 'الخاتمة']
    });
    saveCustomTemplates(templates);
    refreshCustomTemplateOptions();
    renderCustomTemplatesUI();
    showToast('✅ تم استيراد قالب Word: ' + tName + '\nيمكنك تعديل الأقسام في الإعدادات', 'success');
  } else {
    showToast('الصيغ المدعومة: JSON أو Word (.docx)', 'error');
  }
  // Reset input
  document.getElementById('templateImportFile').value = '';
}


// ===========================
// AUTH SYSTEM (Multi-User)
// ===========================
let currentUser = null;

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'mbrcst_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getUsers() {
  try { return JSON.parse(localStorage.getItem('mbrcst_users') || '{}'); } catch { return {}; }
}

function saveUsers(users) {
  localStorage.setItem('mbrcst_users', JSON.stringify(users));
}

function getCurrentSession() {
  try { return JSON.parse(sessionStorage.getItem('mbrcst_session')); } catch { return null; }
}

function checkAuth() {
  // Auto-login on localhost for admin
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const adminEmail = 'moh.rafaah@gmail.com';
    const users = getUsers();
    if (!users[adminEmail] || !users[adminEmail].hash || users[adminEmail].firstTime) {
      users[adminEmail] = { hash: 'local_admin', fullName: 'الادمن', role: 'admin', created: Date.now() };
      saveUsers(users);
    }
    sessionStorage.setItem('mbrcst_session', JSON.stringify({ username: adminEmail, loginAt: Date.now() }));
    loginSuccess(adminEmail, 'الادمن');
    return;
  }
  const session = getCurrentSession();
  if (session && session.username) {
    const users = getUsers();
    if (users[session.username]) {
      loginSuccess(session.username, users[session.username].fullName);
      return;
    }
  }
  const overlay = document.getElementById('loginOverlay');
  if (overlay) overlay.style.display = 'flex';
}

async function doAuth() {
  const username = document.getElementById('authUsername')?.value?.trim();
  const password = document.getElementById('authPassword')?.value;
  const isRegister = document.getElementById('tabRegister')?.classList.contains('active');
  const errorEl = document.getElementById('authError');

  if (!username || !password) {
    showAuthError('يرجى إدخال اسم المستخدم وكلمة المرور');
    return;
  }
  if (password.length < 4) {
    showAuthError('كلمة المرور يجب أن تكون 4 أحرف على الأقل');
    return;
  }

  const btn = document.getElementById('authBtn');
  btn.disabled = true;
  btn.querySelector('#authBtnText').textContent = '...جارٍ التحقق';

  const hash = await hashPassword(password);
  const users = getUsers();

  if (isRegister) {
    const fullName = document.getElementById('authFullName')?.value?.trim() || username;
    if (users[username]) {
      showAuthError('اسم المستخدم موجود مسبقاً');
      btn.disabled = false;
      btn.querySelector('#authBtnText').textContent = 'إنشاء الحساب';
      return;
    }
    users[username] = { hash, fullName, created: Date.now() };
    saveUsers(users);
    sessionStorage.setItem('mbrcst_session', JSON.stringify({ username, loginAt: Date.now() }));
    loginSuccess(username, fullName);
  } else {
    if (!users[username]) {
      showAuthError('اسم المستخدم غير موجود — أنشئ حساباً جديداً');
      btn.disabled = false;
      btn.querySelector('#authBtnText').textContent = 'تسجيل الدخول';
      return;
    }
    if (users[username].hash !== hash) {
      showAuthError('كلمة المرور غير صحيحة');
      btn.disabled = false;
      btn.querySelector('#authBtnText').textContent = 'تسجيل الدخول';
      return;
    }
    sessionStorage.setItem('mbrcst_session', JSON.stringify({ username, loginAt: Date.now() }));
    loginSuccess(username, users[username].fullName);
  }
  btn.disabled = false;
}

function loginSuccess(username, fullName) {
  currentUser = { username, fullName };
  // Scope localStorage keys to this user
  window._userPrefix = 'mbrcst_' + username + '_';
  // Hide login overlay
  const overlay = document.getElementById('loginOverlay');
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.5s';
    setTimeout(() => { overlay.style.display = 'none'; }, 500);
  }
  // Show user badge
  const badge = document.getElementById('userBadge');
  const nameEl = document.getElementById('userNameBadge');
  if (badge) badge.style.display = 'flex';
  if (nameEl) nameEl.textContent = fullName || username;
  // Load user-scoped profile
  const savedTheme = localStorage.getItem('mbrcst_' + username + '_theme') || 'dark';
  setTheme(savedTheme);
  generateReportNumber();
}

function doLogout() {
  sessionStorage.removeItem('mbrcst_session');
  currentUser = null;
  // Show login overlay
  const overlay = document.getElementById('loginOverlay');
  if (overlay) {
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
    // Reset form
    document.getElementById('authUsername').value = '';
    document.getElementById('authPassword').value = '';
    document.getElementById('authError').style.display = 'none';
    switchAuthTab('login');
  }
  // Hide user badge
  document.getElementById('userBadge').style.display = 'none';
}

function showAuthError(msg) {
  const el = document.getElementById('authError');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function switchAuthTab(tab) {
  // Show forgot password only on login tab
  const forgotRow = document.getElementById('forgotLinkRow');
  if (forgotRow) forgotRow.style.display = (tab === 'login') ? 'block' : 'none';
  const isLogin = tab === 'login';
  document.getElementById('tabLogin')?.classList.toggle('active', isLogin);
  document.getElementById('tabRegister')?.classList.toggle('active', !isLogin);
  document.getElementById('fullNameGroup').style.display = isLogin ? 'none' : 'block';
  document.getElementById('authBtnIcon').textContent = isLogin ? '🔐' : '✨';
  document.getElementById('authBtnText').textContent = isLogin ? 'تسجيل الدخول' : 'إنشاء الحساب';
  document.getElementById('authError').style.display = 'none';
}

// Run auth check on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
});


// ===========================
// ADMIN SYSTEM
// ===========================
const ADMIN_EMAILS = ['moh.rafaah@gmail.com'];

function isAdmin(email) {
  return ADMIN_EMAILS.includes((email || '').toLowerCase());
}

// Pre-register admin account on first load if not exists
(function preRegisterAdmin() {
  const users = getUsers();
  // Create placeholder admin entry (no password — admin must register first)
  if (!users['moh.rafaah@gmail.com']) {
    // Don't pre-set a password; admin must register via "حساب جديد"
    // Just mark the slot so we know this email = admin role
    users['moh.rafaah@gmail.com'] = {
      hash: null,
      fullName: 'المدير — Admin',
      role: 'admin',
      created: Date.now(),
      firstTime: true
    };
    saveUsers(users);
  }
})();

// Patch loginSuccess to show admin badge
const _baseLoginSuccess = loginSuccess;
loginSuccess = function(username, fullName) {
  _baseLoginSuccess(username, fullName);
  // Show admin crown if admin
  if (isAdmin(username)) {
    const crown = document.getElementById('adminCrown');
    if (crown) crown.style.display = 'inline';
    // Set user avatar to crown
    const avatar = document.getElementById('userAvatar');
    if (avatar) avatar.textContent = '👑';
  }
};

// Patch doAuth to handle firstTime admin (no password set yet → allow register)
const _baseDoAuth = doAuth;
doAuth = async function() {
  const username = document.getElementById('authUsername')?.value?.trim().toLowerCase();
  const isRegister = document.getElementById('tabRegister')?.classList.contains('active');
  const users = getUsers();

  // If admin first-time login → redirect to register
  if (!isRegister && isAdmin(username) && users[username]?.firstTime) {
    document.getElementById('authError').style.display = 'none';
    showAuthError('👋 مرحباً Admin — سجّل أولاً لضبط كلمة المرور');
    switchAuthTab('register');
    // Pre-fill full name
    const fullNameEl = document.getElementById('authFullName');
    if (fullNameEl) fullNameEl.value = 'الادمن';
    return;
  }

  // Normalize email to lowercase before auth
  const emailEl = document.getElementById('authUsername');
  if (emailEl) emailEl.value = username;

  await _baseDoAuth();
};

// Patch doAuth base to handle admin first-time registration
const _doAuthOrig = doAuth;
doAuth = async function() {
  const username = document.getElementById('authUsername')?.value?.trim().toLowerCase();
  const isRegister = document.getElementById('tabRegister')?.classList.contains('active');
  const users = getUsers();

  if (isRegister && isAdmin(username) && users[username]?.firstTime) {
    // Clear firstTime flag so normal flow continues
    delete users[username].firstTime;
    delete users[username].hash;
    saveUsers(users);
  }
  await _doAuthOrig();
};


// ===========================
// GOOGLE SIGN-IN
// ===========================
function getGoogleClientId() {
  return localStorage.getItem('mbrcst_google_client_id') || '';
}

function signInWithGoogle() {
  const clientId = getGoogleClientId();
  if (!clientId) {
    showGoogleSetupModal();
    return;
  }
  // Wait for GIS to load if not ready
  if (typeof google === 'undefined' || !google.accounts) {
    showToast('⏳ جاري تحميل Google Sign-In...', 'success');
    let tries = 0;
    const wait = setInterval(() => {
      tries++;
      if (typeof google !== 'undefined' && google.accounts) {
        clearInterval(wait); signInWithGoogle();
      } else if (tries > 10) {
        clearInterval(wait);
        showAuthError('❌ تعذّر تحميل Google. حاول مرة أخرى.');
      }
    }, 500);
    return;
  }
  // Direct OAuth Token flow — most reliable, opens popup immediately
  try {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'email profile openid',
      prompt: 'select_account',
      callback: async (tokenResponse) => {
        if (tokenResponse.error) {
          showAuthError('❌ تم إلغاء تسجيل الدخول');
          return;
        }
        try {
          const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: 'Bearer ' + tokenResponse.access_token }
          });
          const user = await res.json();
          if (!user.email) { showAuthError('❌ لم نحصل على بيانات المستخدم'); return; }
          handleGoogleUserInfo(user.email, user.name || user.email, user.picture);
        } catch(e) { showAuthError('❌ خطأ في الاتصال بـ Google'); }
      }
    });
    tokenClient.requestAccessToken({ prompt: 'select_account' });
  } catch(e) {
    showAuthError('❌ خطأ: ' + e.message);
  }
  // Dummy block to balance braces
}

function handleGoogleUserInfo(email, name, picture) {
  const users = getUsers();
  if (!users[email]) {
    users[email] = {
      hash: 'google_sso_' + email,
      fullName: name,
      role: isAdmin(email) ? 'admin' : 'user',
      provider: 'google',
      avatar: picture || null,
      created: Date.now()
    };
    saveUsers(users);
  }
  sessionStorage.setItem('mbrcst_session', JSON.stringify({ username: email, loginAt: Date.now() }));
  loginSuccess(email, name);
  showToast('✅ تم الدخول بحساب Google', 'success');
}

function showGoogleSetupModal() {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:99999;display:flex;align-items:center;justify-content:center;direction:rtl;font-family:Tajawal,sans-serif';
  modal.innerHTML = `
    <div style="background:#12121e;border:1px solid rgba(108,99,255,0.4);border-radius:20px;padding:2rem;max-width:480px;width:95%;">
      <h3 style="color:#fff;margin:0 0 1rem;font-size:1.1rem">⚙️ ربط حساب Google</h3>
      <p style="color:#a0a0c0;font-size:0.82rem;line-height:1.6;margin-bottom:1rem">
        للدخول بـ Google تحتاج إنشاء OAuth Client ID مجاناً من Google Cloud Console:
      </p>
      <ol style="color:#a0a0c0;font-size:0.8rem;line-height:2;padding-right:1.2rem">
        <li>افتح <a href="https://console.cloud.google.com/apis/credentials" target="_blank" style="color:#6c63ff">console.cloud.google.com</a></li>
        <li>أنشئ مشروع جديد ← Credentials ← Create OAuth 2.0 Client</li>
        <li>النوع: <strong style="color:#fff">Web application</strong></li>
        <li>Authorized JavaScript origins: <code style="color:#00d4aa;background:rgba(0,212,170,0.1);padding:2px 6px;border-radius:4px">https://mbr-reports.vercel.app</code></li>
        <li>الصق الـ Client ID هنا:</li>
      </ol>
      <input type="text" id="quickGoogleClientId" placeholder="123456789-xxxx.apps.googleusercontent.com" style="width:100%;background:rgba(255,255,255,0.08);border:1px solid rgba(108,99,255,0.3);border-radius:8px;padding:0.7rem;color:#fff;font-size:0.82rem;margin:0.5rem 0 1rem;box-sizing:border-box;direction:ltr">
      <div style="display:flex;gap:0.5rem">
        <button onclick="saveQuickGoogleId()" style="flex:1;background:linear-gradient(135deg,#6c63ff,#00d4aa);border:none;border-radius:10px;color:white;font-weight:700;padding:0.7rem;cursor:pointer;font-family:Tajawal,sans-serif">💾 حفظ والمتابعة</button>
        <button onclick="this.closest('[style]').remove()" style="background:rgba(255,255,255,0.08);border:1px solid var(--border);border-radius:10px;color:#888;padding:0.7rem 1rem;cursor:pointer;font-family:Tajawal,sans-serif">إلغاء</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function saveQuickGoogleId() {
  const id = document.getElementById('quickGoogleClientId')?.value?.trim();
  if (!id || !id.includes('.apps.googleusercontent.com')) {
    alert('Client ID غير صحيح');
    return;
  }
  localStorage.setItem('mbrcst_google_client_id', id);
  document.querySelector('[id="quickGoogleClientId"]')?.closest('[style*="fixed"]')?.remove();
  showToast('✅ تم حفظ Google Client ID', 'success');
  setTimeout(() => signInWithGoogle(), 500);
}

// Google One Tap callback
async function handleGoogleCredential(response) {
  if (!response.credential) return;
  // Decode JWT (base64 decode the payload part)
  const base64 = response.credential.split('.')[1];
  const payload = JSON.parse(atob(base64.replace(/-/g,'+').replace(/_/,'/')));
  const email = payload.email || '';
  const name = payload.name || email;
  const users = getUsers();
  if (!users[email]) {
    users[email] = {
      hash: 'google_sso_' + payload.sub,
      fullName: name,
      role: isAdmin(email) ? 'admin' : 'user',
      provider: 'google',
      avatar: payload.picture || null,
      created: Date.now()
    };
    saveUsers(users);
  }
  sessionStorage.setItem('mbrcst_session', JSON.stringify({ username: email, loginAt: Date.now() }));
  loginSuccess(email, name);
}

function initGoogleOneTap() {
  const clientId = getGoogleClientId();
  if (!clientId || typeof google === 'undefined') return;
  const container = document.getElementById('g_id_onload');
  if (container) container.setAttribute('data-client_id', clientId);
  google.accounts.id.initialize({
    client_id: clientId,
    callback: handleGoogleCredential,
    auto_select: false,
    cancel_on_tap_outside: true
  });
  google.accounts.id.prompt();
}

// ===========================
// APPLE SIGN-IN
// ===========================
function getAppleClientId() {
  return localStorage.getItem('mbrcst_apple_client_id') || '';
}

function signInWithApple() {
  const clientId = getAppleClientId();
  if (!clientId) {
    showAppleSetupModal();
    return;
  }
  if (typeof AppleID === 'undefined') {
    showAuthError('❌ Apple Sign-In يعمل فقط على mbr-reports.vercel.app');
    return;
  }
  AppleID.auth.init({
    clientId,
    scope: 'name email',
    redirectURI: window.location.origin,
    usePopup: true
  });
  AppleID.auth.signIn()
    .then(data => {
      const token = data.authorization?.id_token;
      const payload = token ? JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))) : {};
      const email = payload.email || data.user?.email || '';
      const name = [data.user?.name?.firstName, data.user?.name?.lastName].filter(Boolean).join(' ') || email.split('@')[0];
      if (!email) { showAuthError('لم نتمكن من الحصول على البريد الإلكتروني'); return; }
      handleGoogleUserInfo(email, name, null);
      showToast('✅ تم الدخول بحساب Apple', 'success');
    })
    .catch(() => showAuthError('❌ تم إلغاء تسجيل الدخول بـ Apple'));
}

function showAppleSetupModal() {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:99999;display:flex;align-items:center;justify-content:center;direction:rtl;font-family:Tajawal,sans-serif';
  modal.innerHTML = `
    <div style="background:#12121e;border:1px solid rgba(255,255,255,0.15);border-radius:20px;padding:2rem;max-width:480px;width:95%;">
      <h3 style="color:#fff;margin:0 0 1rem;font-size:1.1rem">🍎 ربط حساب Apple</h3>
      <p style="color:#a0a0c0;font-size:0.82rem;line-height:1.6">
        تسجيل الدخول بـ Apple يتطلب:
      </p>
      <ul style="color:#a0a0c0;font-size:0.8rem;line-height:2;padding-right:1.2rem">
        <li>حساب Apple Developer (99$ سنوياً)</li>
        <li>تسجيل Service ID في Apple Developer Console</li>
        <li>إضافة النطاق: <code style="color:#00d4aa">mbr-reports.vercel.app</code></li>
      </ul>
      <p style="color:#f59e0b;font-size:0.78rem;padding:0.7rem;background:rgba(245,158,11,0.08);border-radius:8px;margin-top:0.5rem">
        💡 نوصي باستخدام <strong>تسجيل الدخول بـ Google</strong> كبديل مجاني وأسهل
      </p>
      <div style="display:flex;gap:0.5rem;margin-top:1rem">
        <button onclick="this.closest('[style]').remove();signInWithGoogle()" style="flex:1;background:linear-gradient(135deg,#6c63ff,#00d4aa);border:none;border-radius:10px;color:white;font-weight:700;padding:0.7rem;cursor:pointer;font-family:Tajawal,sans-serif">🔵 الدخول بـ Google بدلاً</button>
        <button onclick="this.closest('[style]').remove()" style="background:rgba(255,255,255,0.08);border:1px solid var(--border);border-radius:10px;color:#888;padding:0.7rem 1rem;cursor:pointer;font-family:Tajawal,sans-serif">إغلاق</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}


// Save OAuth Client IDs
function saveGoogleClientId() {
  const id = document.getElementById('googleClientId')?.value?.trim();
  if (!id) { showToast('أدخل Google Client ID', 'error'); return; }
  localStorage.setItem('mbrcst_google_client_id', id);
  // Update the g_id_onload container
  const container = document.getElementById('g_id_onload');
  if (container) container.setAttribute('data-client_id', id);
  showToast('✅ تم حفظ Google Client ID', 'success');
}

function saveAppleClientId() {
  const id = document.getElementById('appleClientId')?.value?.trim();
  if (!id) { showToast('أدخل Apple Service ID', 'error'); return; }
  localStorage.setItem('mbrcst_apple_client_id', id);
  showToast('✅ تم حفظ Apple Service ID', 'success');
}

// Load OAuth IDs in settings
const _loadSettingsWithOAuth = loadSettingsForm;
loadSettingsForm = function() {
  if (typeof _loadSettingsWithOAuth === 'function') _loadSettingsWithOAuth();
  const gEl = document.getElementById('googleClientId');
  const aEl = document.getElementById('appleClientId');
  if (gEl) gEl.value = getGoogleClientId();
  if (aEl) aEl.value = getAppleClientId();
};


// ===========================
// DEV BYPASS — LOCALHOST ADMIN
// ===========================
(function devBypass() {
  if (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) return;
  
  // Add bypass button after DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const overlay = document.getElementById('loginOverlay');
      if (!overlay || overlay.style.display === 'none') return;

      const bypassBtn = document.createElement('button');
      bypassBtn.textContent = '👑 دخول مباشر كـ Admin';
      bypassBtn.style.cssText = `
        position: absolute; bottom: 1.5rem; left: 50%; transform: translateX(-50%);
        background: linear-gradient(135deg, #6c63ff, #00d4aa);
        border: none; border-radius: 10px; color: white;
        padding: 0.6rem 1.5rem; font-family: inherit; font-weight: 700;
        font-size: 0.82rem; cursor: pointer; white-space: nowrap;
        box-shadow: 0 4px 20px rgba(108,99,255,0.4); z-index: 10;
      `;
      bypassBtn.onclick = function() {
        const adminEmail = 'moh.rafaah@gmail.com';
        const users = getUsers();
        // Create admin account if not exists
        if (!users[adminEmail] || users[adminEmail].firstTime) {
          users[adminEmail] = {
            hash: 'bypass_admin_local',
            fullName: 'الادمن',
            role: 'admin',
            created: Date.now()
          };
          saveUsers(users);
        }
        sessionStorage.setItem('mbrcst_session', JSON.stringify({ 
          username: adminEmail, loginAt: Date.now() 
        }));
        loginSuccess(adminEmail, 'الادمن');
      };

      const card = overlay.querySelector('.login-card');
      if (card) {
        card.style.position = 'relative';
        card.appendChild(bypassBtn);
      }
    }, 300);
  });
})();

// ============================================================
// AI TOOLBOX — 14 FEATURES
// ============================================================

// Core AI caller — directly calls OpenAI API
async function callAI(userPrompt, systemPrompt = 'أنت مساعد ذكي متخصص في كتابة التقارير والتحليل بالعربية.', options = {}) {
  const apiKey = localStorage.getItem('mbrcst_openai_key') || localStorage.getItem('openai_api_key');
  if (!apiKey) {
    showToast('❌ أضف OpenAI API Key في الإعدادات', 'error');
    return null;
  }
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: options.model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7
      })
    });
    if (!res.ok) {
      const err = await res.json();
      showToast(`❌ OpenAI Error: ${err.error?.message || res.status}`, 'error');
      return null;
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (err) {
    showToast('❌ خطأ في الاتصال بـ OpenAI', 'error');
    return null;
  }
}

// Helper — show loading in result div
function aiShowLoading(resultId) {
  const el = document.getElementById(resultId);
  if (!el) return;
  el.style.display = 'block';
  el.innerHTML = '<div class="ai-loading"><div class="ai-dot"></div><div class="ai-dot"></div><div class="ai-dot"></div></div>';
}

// Helper — show result text
function aiShowResult(resultId, text, withCopyBtn = true) {
  const el = document.getElementById(resultId);
  if (!el) return;
  el.style.display = 'block';
  el.innerHTML = `<div style="white-space:pre-wrap">${text}</div>
    ${withCopyBtn ? `<button class="ai-copy-btn" onclick="navigator.clipboard.writeText(${JSON.stringify(text)});showToast('✅ نُسخ','success')">📋 نسخ النص</button>` : ''}`;
}

// Helper — get current report content
function getCurrentReportText() {
  const sections = document.querySelectorAll('.section-item textarea,.preview-content,[contenteditable]');
  let text = '';
  sections.forEach(el => { text += (el.value || el.innerText || '') + '\n\n'; });
  if (!text.trim()) {
    // Try getting preview content
    const preview = document.getElementById('reportPreview') || document.getElementById('previewContent');
    if (preview) text = preview.innerText || preview.textContent;
  }
  return text.trim() || 'لا يوجد محتوى تقرير حالياً';
}

// Helper — check API key and update bar
function checkAiKeyBar() {
  const key = localStorage.getItem('mbrcst_openai_key') || localStorage.getItem('openai_api_key');
  const bar = document.getElementById('aiKeyBar');
  if (!bar) return;
  if (key) {
    bar.className = 'ai-key-bar ok';
    bar.innerHTML = '✅ OpenAI API Key متصل وجاهز — جميع أدوات AI فعالة';
  }
}

// ===== 1. AUTO-WRITE =====
async function aiAutoWrite() {
  const points = document.getElementById('autoWriteInput')?.value?.trim();
  const section = document.getElementById('autoWriteSection')?.value;
  if (!points) { showToast('أدخل النقاط أولاً', 'error'); return; }
  aiShowLoading('autoWriteResult');
  const prompt = `اكتب محتوى احترافياً لقسم "${section}" في تقرير رسمي بناءً على هذه النقاط:
${points}

المطلوب: فقرات متكاملة بأسلوب رسمي مهني، 150-250 كلمة، باللغة العربية الفصحى.`;
  const result = await callAI(prompt);
  if (result) aiShowResult('autoWriteResult', result);
}

// ===== 2. SMART SUMMARY =====
async function aiSmartSummary() {
  const len = document.querySelector('input[name="summaryLen"]:checked')?.value || 'متوسط';
  const reportText = getCurrentReportText();
  aiShowLoading('summaryResult');
  const prompt = `اكتب ملخصاً تنفيذياً ${len === 'قصير' ? 'في 3 أسطر' : len === 'متوسط' ? 'في فقرة واحدة (80-100 كلمة)' : 'تفصيلياً (150-200 كلمة)'} للتقرير التالي:

${reportText}

الملخص يجب أن يكون: احترافي، يبرز أهم النقاط والنتائج، بصيغة تنفيذية.`;
  const result = await callAI(prompt);
  if (result) aiShowResult('summaryResult', result);
}

// ===== 3. TONE ADJUSTER =====
function selectTone(btn, tone) {
  document.querySelectorAll('.ai-tone-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('selectedTone').value = tone;
}

async function aiAdjustTone() {
  const tone = document.getElementById('selectedTone')?.value || 'رسمي ومهني';
  const reportText = getCurrentReportText();
  aiShowLoading('toneResult');
  const prompt = `أعد كتابة هذا التقرير بأسلوب "${tone}". اجعل المحتوى مناسباً تماماً لهذا الأسلوب مع الحفاظ على المعلومات الأصلية:

${reportText.substring(0, 2000)}`;
  const result = await callAI(prompt, 'أنت خبير في تحرير التقارير وتعديل الأسلوب الكتابي.', { maxTokens: 1500 });
  if (result) aiShowResult('toneResult', result);
}

// ===== 4. REPORT CRITIC =====
async function aiCriticize() {
  const checks = {
    grammar: document.getElementById('criticGrammar')?.checked,
    structure: document.getElementById('criticStructure')?.checked,
    content: document.getElementById('criticContent')?.checked,
    impact: document.getElementById('criticImpact')?.checked
  };
  const aspects = Object.entries(checks).filter(([,v]) => v).map(([k]) => ({
    grammar: 'الأسلوب اللغوي والصياغة',
    structure: 'الهيكل والتنظيم',
    content: 'جودة المحتوى والمعلومات',
    impact: 'الأثر والإقناع'
  }[k])).join('، ');

  const reportText = getCurrentReportText();
  aiShowLoading('criticResult');
  const prompt = `راجع هذا التقرير وقدّم تقييماً نقدياً احترافياً يشمل:
${aspects}

قدّم 5 اقتراحات تحسين محددة وقابلة للتطبيق.

التقرير:
${reportText.substring(0, 2000)}

الصياغة: نقاط مرقمة، محددة ومباشرة.`;
  const result = await callAI(prompt, 'أنت ناقد تقارير محترف تقدم نقداً بنّاءً ودقيقاً.');
  if (result) aiShowResult('criticResult', result);
}

// ===== 5. MULTI-LANGUAGE =====
function selectLang(btn, lang) {
  document.querySelectorAll('.ai-lang-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('selectedLang').value = lang;
}

async function aiTranslate() {
  const lang = document.getElementById('selectedLang')?.value || 'English';
  const reportText = getCurrentReportText();
  aiShowLoading('translateResult');
  const prompt = `ترجم هذا التقرير إلى ${lang} بأسلوب احترافي رسمي مناسب للتقارير الرسمية:

${reportText.substring(0, 2500)}`;
  const result = await callAI(prompt, `You are a professional translator specializing in formal business and government reports. Translate to ${lang} with formal register.`, { maxTokens: 2000 });
  if (result) aiShowResult('translateResult', result);
}

// ===== 6. DATA NARRATOR =====
async function aiNarrateData() {
  const data = document.getElementById('narratorInput')?.value?.trim();
  if (!data) { showToast('أدخل الأرقام أولاً', 'error'); return; }
  aiShowLoading('narratorResult');
  const prompt = `اشرح هذه البيانات والأرقام بلغة طبيعية مفهومة لمدير تنفيذي:

${data}

المطلوب:
- شرح ما تعنيه الأرقام
- أبرز الاتجاهات والملاحظات
- ماذا يعني هذا للمؤسسة؟
الأسلوب: واضح ومهني، 100-150 كلمة.`;
  const result = await callAI(prompt);
  if (result) aiShowResult('narratorResult', result);
}

// ===== 7 (was Chart Insights — merged with narrator) =====

// ===== 8. ANOMALY DETECTION =====
async function aiDetectAnomalies() {
  const data = document.getElementById('anomalyInput')?.value?.trim();
  if (!data) { showToast('أدخل البيانات أولاً', 'error'); return; }
  aiShowLoading('anomalyResult');
  const prompt = `حلّل هذه البيانات واكتشف الشذوذ والانحرافات غير الطبيعية:

${data}

المطلوب:
1. حدد الأرقام الشاذة إن وجدت
2. ما النسبة المئوية للانحراف؟
3. ما الأسباب المحتملة؟
4. ما التوصية؟
الأسلوب: دقيق ومنظم.`;
  const result = await callAI(prompt, 'أنت محلل بيانات متخصص في كشف الشذوذ والانحرافات الإحصائية.');
  if (result) aiShowResult('anomalyResult', result);
}

// ===== 9. FORECAST =====
async function aiForecast() {
  const data = document.getElementById('forecastInput')?.value?.trim();
  const period = document.getElementById('forecastPeriods')?.value || 'تنبؤ الربع القادم';
  if (!data) { showToast('أدخل البيانات أولاً', 'error'); return; }
  aiShowLoading('forecastResult');
  const prompt = `بناءً على هذه البيانات التاريخية:

${data}

قدّم ${period} مع:
1. الرقم المتوقع مع نطاق ثقة
2. الاتجاه العام (صاعد/هابط/ثابت)
3. العوامل المؤثرة في التوقع
4. مستوى الثقة في التنبؤ %
الأسلوب: تحليلي دقيق.`;
  const result = await callAI(prompt, 'أنت محلل مالي متخصص في التنبؤ والتحليل الإحصائي.');
  if (result) aiShowResult('forecastResult', result);
}

// ===== 10. KPI TRACKER =====
let kpis = JSON.parse(localStorage.getItem('mbrcst_kpis') || '[]');

function renderKPIs() {
  const list = document.getElementById('kpiList');
  if (!list) return;
  if (!kpis.length) { list.innerHTML = '<p style="color:var(--text-muted);font-size:0.75rem;text-align:center;padding:0.5rem">لا توجد مؤشرات بعد</p>'; return; }
  list.innerHTML = kpis.map((k, i) => {
    const pct = Math.min(Math.round((k.actual / k.target) * 100), 150);
    const color = pct >= 100 ? '#10b981' : pct >= 75 ? '#f59e0b' : '#f43f5e';
    return `<div class="kpi-item">
      <span class="kpi-item-name">${k.name}</span>
      <div class="kpi-progress"><div class="kpi-progress-bar" style="width:${Math.min(pct,100)}%;background:${color}"></div></div>
      <span class="kpi-pct" style="color:${color}">${pct}%</span>
      <button onclick="removeKPI(${i})" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.8rem">✕</button>
    </div>`;
  }).join('');
}

function addKPI() {
  const name = document.getElementById('kpiName')?.value?.trim();
  const target = parseFloat(document.getElementById('kpiTarget')?.value);
  const actual = parseFloat(document.getElementById('kpiActual')?.value);
  if (!name || isNaN(target) || isNaN(actual)) { showToast('أدخل جميع بيانات المؤشر', 'error'); return; }
  kpis.push({ name, target, actual });
  localStorage.setItem('mbrcst_kpis', JSON.stringify(kpis));
  renderKPIs();
  ['kpiName','kpiTarget','kpiActual'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  showToast('✅ تمت إضافة المؤشر', 'success');
}

function removeKPI(i) { kpis.splice(i,1); localStorage.setItem('mbrcst_kpis', JSON.stringify(kpis)); renderKPIs(); }

async function aiAnalyzeKPIs() {
  if (!kpis.length) { showToast('أضف مؤشرات أولاً', 'error'); return; }
  aiShowLoading('kpiResult');
  const kpiText = kpis.map(k => `${k.name}: الهدف ${k.target}، الفعلي ${k.actual} (${Math.round(k.actual/k.target*100)}%)`).join('\n');
  const result = await callAI(`حلّل هذه المؤشرات وقدّم تقييماً شاملاً:\n\n${kpiText}\n\nالمطلوب:\n1. تقييم الأداء العام\n2. أبرز المؤشرات الجيدة والمتأخرة\n3. 3 توصيات لتحسين الأداء\n4. درجة الأداء الكلي من 10`);
  if (result) { renderKPIs(); aiShowResult('kpiResult', result); }
}

// ===== 11. VOICE INPUT =====
let recognition = null;

function startVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { showToast('❌ المتصفح لا يدعم التعرف على الصوت', 'error'); return; }
  recognition = new SR();
  recognition.lang = 'ar-SA';
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.onresult = (e) => {
    let transcript = Array.from(e.results).map(r => r[0].transcript).join('');
    const el = document.getElementById('voiceTranscript');
    if (el) { el.style.display = 'block'; el.innerHTML = transcript + '<button class="ai-copy-btn" onclick=\'navigator.clipboard.writeText(this.previousSibling.data||this.parentElement.innerText.replace(this.innerText,""))\'>📋 نسخ</button>'; }
  };
  recognition.start();
  document.getElementById('voiceVisualizer')?.classList.add('active');
  document.getElementById('voiceStartBtn').style.display = 'none';
  document.getElementById('voiceStopBtn').style.display = 'block';
  showToast('🎙️ بدأ التسجيل...', 'success');
}

function stopVoice() {
  recognition?.stop();
  document.getElementById('voiceVisualizer')?.classList.remove('active');
  document.getElementById('voiceStartBtn').style.display = 'block';
  document.getElementById('voiceStopBtn').style.display = 'none';
  showToast('⏹️ انتهى التسجيل', 'success');
}

// ===== 12. AUTO SCHEDULE =====
function setupSchedule() {
  const freq = document.getElementById('scheduleFreq')?.value;
  const day = document.getElementById('scheduleDay')?.value;
  const time = document.getElementById('scheduleTime')?.value;
  const schedule = { freq, day, time, active: true, created: Date.now() };
  localStorage.setItem('mbrcst_schedule', JSON.stringify(schedule));
  // Request notification permission
  if ('Notification' in window) {
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') {
        new Notification('MBR Reports ⏰', {
          body: `تم تفعيل الجدولة: ${freq} — ${day} الساعة ${time}`,
          icon: '📊'
        });
      }
    });
  }
  aiShowResult('scheduleResult', `✅ تم تفعيل الجدولة:\n• التكرار: ${freq}\n• اليوم: ${day}\n• الوقت: ${time}\n\nسيتم إرسال تذكير عند موعد التقرير. تأكد من السماح بالإشعارات.`, false);
  showToast('✅ تم تفعيل الجدولة', 'success');
}

// ===== 13. SMART TEMPLATES =====
async function aiLearnFromHistory() {
  const history = JSON.parse(localStorage.getItem('mbrcst_history') || '[]');
  if (!history.length) { showToast('لا توجد تقارير سابقة بعد', 'error'); return; }

  aiShowLoading('smartTplResult');
  const sampleReports = history.slice(0, 5).map(r => r.content || r.title || '').join('\n---\n');
  const result = await callAI(`بناءً على هذه التقارير السابقة، استخرج:
1. النمط الكتابي المتكرر
2. العبارات الأكثر استخداماً
3. هيكل التقرير المفضل
4. 5 جمل جاهزة للاستخدام في التقارير القادمة

التقارير:
${sampleReports.substring(0, 2000)}`);

  if (result) {
    aiShowResult('smartTplResult', result);
    // Save as learned templates
    const tpls = result.split('\n').filter(l => l.trim()).slice(0, 5);
    localStorage.setItem('mbrcst_smart_templates', JSON.stringify(tpls));
    renderSmartTemplates();
  }
}

function renderSmartTemplates() {
  const tpls = JSON.parse(localStorage.getItem('mbrcst_smart_templates') || '[]');
  const list = document.getElementById('smartTplList');
  if (!list) return;
  if (!tpls.length) { list.innerHTML = ''; return; }
  list.innerHTML = tpls.slice(0, 5).map(t =>
    `<div class="ai-tpl-item" onclick="navigator.clipboard.writeText(${JSON.stringify(t)});showToast('✅ نُسخ','success')">${t.substring(0, 60)}...</div>`
  ).join('');
}

async function aiSuggestContent() {
  const reportType = document.getElementById('reportTypeSelect')?.value || 'weekly';
  aiShowLoading('smartTplResult');
  const tpls = JSON.parse(localStorage.getItem('mbrcst_smart_templates') || '[]');
  const profile = JSON.parse(localStorage.getItem('mbrcst_profile') || '{}');

  const result = await callAI(`اقترح محتوى جاهزاً لتقرير ${reportType === 'weekly' ? 'أسبوعي' : 'شهري'} لـ ${profile.department || 'القسم'}.
قدّم:
1. جملة افتتاحية احترافية
2. 3 عبارات للإنجازات
3. 3 عبارات للتحديات
4. جملة ختامية موجزة
${tpls.length ? '\nالنمط المفضل من التقارير السابقة:\n' + tpls.slice(0,3).join('\n') : ''}`);

  if (result) aiShowResult('smartTplResult', result);
}

// Init on section show
const _origShowSection = showSection;
showSection = function(name) {
  _origShowSection(name);
  if (name === 'ai') {
    checkAiKeyBar();
    renderKPIs();
    renderSmartTemplates();
    // Scroll to AI section
    setTimeout(() => {
      const el = document.getElementById('sectionAi');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else document.querySelector('.main-wrap')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  } else {
    // Scroll to top for other sections
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  }
};


// ===== AI TOOLBOX OVERLAY CONTROLLER =====
(function() {
  // Override the navAi button to use overlay instead of showSection
  document.addEventListener('DOMContentLoaded', function() {
    const navAiBtn = document.getElementById('navAi');
    if (navAiBtn) {
      // Remove old onclick
      navAiBtn.removeAttribute('onclick');
      navAiBtn.addEventListener('click', function(e) {
        e.preventDefault();
        toggleAiOverlay();
      });
    }
  });
})();

function toggleAiOverlay() {
  const overlay = document.getElementById('sectionAi');
  if (!overlay) return;

  const isOpen = overlay.classList.contains('active-overlay');

  if (isOpen) {
    overlay.classList.remove('active-overlay');
    overlay.style.display = 'none';
    // Deactivate nav button
    document.getElementById('navAi')?.classList.remove('active');
  } else {
    overlay.classList.add('active-overlay');
    overlay.style.display = 'block';
    // Activate nav button
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('navAi')?.classList.add('active');
    // Run init functions
    checkAiKeyBar();
    renderKPIs();
    renderSmartTemplates();
    // Scroll overlay to top
    overlay.scrollTop = 0;
  }
}


// ============================================================
// FEATURE 1: EXCEL AI
// ============================================================
let excelData = null;

function handleExcelFile(input) {
  const file = input.files[0];
  if (!file) return;
  document.getElementById('excelFileName').textContent = file.name;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
      excelData = json;
      // Preview first 5 rows
      const preview = document.getElementById('excelPreview');
      preview.style.display = 'block';
      preview.innerHTML = '<table style="width:100%;border-collapse:collapse">' +
        json.slice(0, 6).map((row, i) =>
          `<tr style="background:${i===0?'rgba(108,99,255,0.2)':'transparent'}">${
            row.map(cell => `<td style="padding:2px 6px;border:1px solid rgba(255,255,255,0.07);white-space:nowrap">${cell||''}</td>`).join('')
          }</tr>`
        ).join('') + '</table>';
      showToast('✅ تم قراءة الملف: ' + json.length + ' صف', 'success');
    } catch(err) {
      showToast('❌ خطأ في قراءة الملف', 'error');
    }
  };
  reader.readAsArrayBuffer(file);
}

async function aiExcelToReport() {
  if (!excelData || !excelData.length) { showToast('ارفع ملف Excel أولاً', 'error'); return; }
  aiShowLoading('excelResult');
  // Format data for prompt
  const headers = excelData[0] || [];
  const rows = excelData.slice(1, 20); // max 20 rows
  const dataStr = headers.join(' | ') + '\n' +
    rows.map(r => r.join(' | ')).join('\n');

  const prompt = `لديك هذه البيانات من ملف Excel:

${dataStr}

المطلوب: اكتب تقريراً تحليلياً احترافياً يشمل:
1. ملخص تنفيذي للبيانات
2. أبرز النتائج والاتجاهات
3. المقارنات المهمة بين الأرقام
4. التوصيات المبنية على البيانات
5. الخلاصة

الأسلوب: رسمي، مهني، باللغة العربية.`;

  const result = await callAI(prompt, 'أنت محلل بيانات ومحرر تقارير احترافي.', { maxTokens: 2000 });
  if (result) {
    aiShowResult('excelResult', result);
    showToast('✅ تم إنشاء التقرير من Excel!', 'success');
    // Track AI usage
    const usage = parseInt(localStorage.getItem('mbrcst_ai_usage') || '0') + 1;
    localStorage.setItem('mbrcst_ai_usage', usage);
  }
}

// ============================================================
// FEATURE 2: AI CHATBOT
// ============================================================
let chatHistory = [];

function toggleChatbot() {
  const panel = document.getElementById('chatbotPanel');
  const icon = document.getElementById('chatBubbleIcon');
  if (panel.style.display === 'none') {
    panel.style.display = 'flex';
    icon.textContent = '✕';
    document.getElementById('chatInput')?.focus();
  } else {
    panel.style.display = 'none';
    icon.textContent = '💬';
  }
}

async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const msg = input?.value?.trim();
  if (!msg) return;
  input.value = '';

  // Add user message
  addChatMsg(msg, 'user');
  chatHistory.push({ role: 'user', content: msg });

  // Add loading
  const loadingEl = addChatMsg('...', 'bot loading');

  // Get report context
  const reportContext = getCurrentReportText();
  const systemPrompt = `أنت مساعد ذكي متخصص في MBR Reports. ${reportContext !== 'لا يوجد محتوى تقرير حالياً' ? `السياق الحالي للتقرير:\n${reportContext.substring(0, 1000)}` : ''}\n\nكن مختصراً ومفيداً. أجب بالعربية.`;

  const apiKey = localStorage.getItem('mbrcst_openai_key') || localStorage.getItem('openai_api_key');
  if (!apiKey) {
    loadingEl.remove();
    addChatMsg('❌ أضف OpenAI API Key في الإعدادات أولاً', 'bot');
    return;
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...chatHistory.slice(-6)
        ],
        max_tokens: 500
      })
    });
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || 'عذراً، لم أفهم. حاول مجدداً.';
    loadingEl.textContent = reply;
    loadingEl.className = 'chat-msg bot';
    chatHistory.push({ role: 'assistant', content: reply });
  } catch {
    loadingEl.textContent = '❌ خطأ في الاتصال';
    loadingEl.className = 'chat-msg bot';
  }
}

function addChatMsg(text, cls) {
  const msgs = document.getElementById('chatMessages');
  const el = document.createElement('div');
  el.className = 'chat-msg ' + cls;
  el.textContent = text;
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
  return el;
}

// ============================================================
// FEATURE 3: DASHBOARD
// ============================================================
let dashCharts = {};

function showDashboard() {
  const overlay = document.getElementById('dashboardOverlay');
  overlay.style.display = 'block';
  // Deactivate other nav
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('navDashboard')?.classList.add('active');
  setTimeout(renderDashboard, 100);
}

function closeDashboard() {
  document.getElementById('dashboardOverlay').style.display = 'none';
  document.getElementById('navDashboard')?.classList.remove('active');
}

function renderDashboard() {
  const history = JSON.parse(localStorage.getItem('mbrcst_history') || '[]');
  const aiUsage = parseInt(localStorage.getItem('mbrcst_ai_usage') || '0');

  // Stats
  document.getElementById('statTotalReports').textContent = history.length;
  document.getElementById('statAiUsage').textContent = aiUsage;

  // This month
  const thisMonth = history.filter(r => {
    if (!r.date) return false;
    const d = new Date(r.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  document.getElementById('statThisMonth').textContent = thisMonth;
  document.getElementById('statAvgTime').textContent = history.length ? '~3 دقيقة' : '-';

  // Chart 1: By type
  const typeCounts = {};
  const typeLabels = { daily:'يومي',weekly:'أسبوعي',monthly:'شهري',quarterly:'ربعي',annual:'سنوي',general:'عام' };
  history.forEach(r => {
    const t = r.type || 'general';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  if (!Object.keys(typeCounts).length) { typeCounts['weekly'] = 3; typeCounts['monthly'] = 2; typeCounts['annual'] = 1; }

  const ctx1 = document.getElementById('chartByType')?.getContext('2d');
  if (ctx1) {
    if (dashCharts.type) dashCharts.type.destroy();
    dashCharts.type = new Chart(ctx1, {
      type: 'doughnut',
      data: {
        labels: Object.keys(typeCounts).map(k => typeLabels[k] || k),
        datasets: [{ data: Object.values(typeCounts), backgroundColor: ['#6c63ff','#00d4aa','#f59e0b','#ef4444','#10b981','#0ea5e9'], borderWidth: 0 }]
      },
      options: { responsive: true, plugins: { legend: { labels: { color: '#a0a0c0', font: { family: 'Tajawal' } } } } }
    });
  }

  // Chart 2: Activity last 7 days
  const days = Array.from({length:7}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate()-6+i);
    return d.toLocaleDateString('ar-SA', {weekday:'short'});
  });
  const dayCounts = days.map((_, i) => Math.floor(Math.random() * 4)); // demo data

  const ctx2 = document.getElementById('chartActivity')?.getContext('2d');
  if (ctx2) {
    if (dashCharts.activity) dashCharts.activity.destroy();
    dashCharts.activity = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: days,
        datasets: [{
          label: 'تقارير',
          data: dayCounts,
          backgroundColor: 'rgba(108,99,255,0.6)',
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#a0a0c0' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#a0a0c0', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
  }

  // Recent reports
  const recentEl = document.getElementById('dashRecentList');
  if (recentEl) {
    if (!history.length) {
      recentEl.innerHTML = '<div style="color:var(--text-muted);font-size:0.8rem;text-align:center;padding:1rem">لا توجد تقارير محفوظة بعد</div>';
    } else {
      recentEl.innerHTML = history.slice(0,8).map(r => `
        <div class="dash-recent-item">
          <span class="dash-recent-icon">📄</span>
          <span class="dash-recent-title">${r.title || r.type || 'تقرير'}</span>
          <span class="dash-recent-date">${r.date ? new Date(r.date).toLocaleDateString('ar-SA') : ''}</span>
        </div>
      `).join('');
    }
  }
}

// ============================================================
// FEATURE 4: SEND EMAIL
// ============================================================
async function sendReportByEmail() {
  const to = document.getElementById('emailTo')?.value?.trim();
  const subject = document.getElementById('emailSubject')?.value?.trim() || 'تقرير MBR Reports';
  const statusEl = document.getElementById('emailStatus');

  if (!to) { showToast('أدخل البريد الإلكتروني أولاً', 'error'); return; }

  const reportContent = getCurrentReportText();

  // Use mailto as primary (works offline)
  const body = encodeURIComponent(`${subject}\n\n${reportContent.substring(0, 2000)}\n\n--\nأُرسل من MBR Reports`);
  const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${body}`;

  statusEl.style.display = 'block';
  statusEl.innerHTML = '<a href="' + mailtoLink + '" style="color:var(--accent)" target="_blank">📧 افتح تطبيق البريد لإرسال التقرير ← اضغط هنا</a>';

  // Also copy content to clipboard as backup
  try {
    await navigator.clipboard.writeText(reportContent);
    showToast('✅ تم نسخ التقرير — افتح بريدك للإرسال', 'success');
  } catch {
    showToast('📧 افتح الرابط لإرسال التقرير', 'success');
  }
}


// ============================================================
// PWA: Service Worker + Install Prompt
// ============================================================
let deferredPWAPrompt = null;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.log('SW error:', err));
  });
}

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPWAPrompt = e;
  // Show banner after 3 seconds
  setTimeout(() => {
    const banner = document.getElementById('pwaInstallBanner');
    if (banner && !localStorage.getItem('pwa_installed')) banner.style.display = 'flex';
  }, 3000);
});

function installPWA() {
  if (!deferredPWAPrompt) return;
  deferredPWAPrompt.prompt();
  deferredPWAPrompt.userChoice.then(choice => {
    if (choice.outcome === 'accepted') {
      localStorage.setItem('pwa_installed', '1');
      document.getElementById('pwaInstallBanner').style.display = 'none';
      showToast('✅ تم تثبيت MBR Reports على جهازك!', 'success');
    }
    deferredPWAPrompt = null;
  });
}

window.addEventListener('appinstalled', () => {
  localStorage.setItem('pwa_installed', '1');
  showToast('🎉 تم تثبيت التطبيق!', 'success');
});

// ============================================================
// SHARE REPORT FEATURE
// ============================================================
let currentShareUrl = '';

function openShareModal() {
  document.getElementById('shareModal').style.display = 'flex';
  document.getElementById('shareLinkInput').value = '';
  document.getElementById('shareQR').style.display = 'none';
}

function closeShare() {
  document.getElementById('shareModal').style.display = 'none';
}

function generateShareLink() {
  const reportText = getCurrentReportText();
  if (!reportText || reportText === 'لا يوجد محتوى تقرير حالياً') {
    showToast('❌ لا يوجد تقرير لمشاركته. أنشئ تقريراً أولاً.', 'error');
    return;
  }
  // Encode report in URL (base64)
  const reportData = {
    title: document.getElementById('reportTitle')?.value || 'تقرير MBR Reports',
    type: document.getElementById('reportTypeSelect')?.value || 'general',
    content: reportText.substring(0, 3000),
    date: new Date().toISOString(),
    author: currentUser?.fullName || 'MBR Reports'
  };
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(reportData))));
  const shareId = Date.now().toString(36);
  // Save to localStorage so viewer can access
  const key = 'mbrcst_share_' + shareId;
  localStorage.setItem(key, JSON.stringify(reportData));

  const baseUrl = window.location.origin || 'https://mbr-reports.vercel.app';
  currentShareUrl = `${baseUrl}/?share=${shareId}`;
  document.getElementById('shareLinkInput').value = currentShareUrl;

  // Generate QR code link
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentShareUrl)}`;
  const qrDiv = document.getElementById('shareQR');
  qrDiv.style.display = 'block';
  qrDiv.innerHTML = `<img src="${qrUrl}" style="border-radius:8px;border:4px solid rgba(108,99,255,0.2)" loading="lazy"><br><small style="color:var(--text-muted);font-size:0.72rem">امسح الـ QR لفتح التقرير</small>`;
  showToast('✅ تم إنشاء رابط المشاركة', 'success');
}

function copyShareLink() {
  const val = document.getElementById('shareLinkInput')?.value;
  if (!val) { showToast('أنشئ الرابط أولاً', 'error'); return; }
  navigator.clipboard.writeText(val).then(() => showToast('✅ تم نسخ الرابط', 'success'));
}

function shareViaWhatsApp() {
  if (!currentShareUrl) { generateShareLink(); return; }
  const msg = encodeURIComponent(`شاهد تقريري على MBR Reports: ${currentShareUrl}`);
  window.open(`https://wa.me/?text=${msg}`, '_blank');
}

function shareViaEmail() {
  if (!currentShareUrl) { generateShareLink(); return; }
  const subject = encodeURIComponent('تقرير من MBR Reports');
  const body = encodeURIComponent(`مرحباً،\n\nيمكنك مشاهدة التقرير من خلال الرابط التالي:\n${currentShareUrl}\n\n--\nأُرسل من MBR Reports`);
  window.open(`mailto:?subject=${subject}&body=${body}`);
}

function shareViaCopy() { copyShareLink(); }

// Check if opened via share link
(function checkSharedReport() {
  const params = new URLSearchParams(window.location.search);
  const shareId = params.get('share');
  if (!shareId) return;
  const key = 'mbrcst_share_' + shareId;
  const data = localStorage.getItem(key);
  if (data) {
    const report = JSON.parse(data);
    // Show shared report view
    setTimeout(() => {
      showSharedReportView(report);
    }, 800);
  }
})();

function showSharedReportView(report) {
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;inset:0;background:#0e0e1a;z-index:99999;overflow:auto;padding:2rem;direction:rtl;font-family:Tajawal,sans-serif';
  div.innerHTML = `
    <div style="max-width:800px;margin:0 auto">
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:2rem">
        <span style="font-size:2rem">📊</span>
        <div>
          <h1 style="color:#fff;font-size:1.4rem;margin:0">${report.title}</h1>
          <div style="color:#a0a0c0;font-size:0.8rem">${report.author} • ${new Date(report.date).toLocaleDateString('ar-SA')}</div>
        </div>
        <a href="/" style="margin-right:auto;background:linear-gradient(135deg,#6c63ff,#00d4aa);color:white;text-decoration:none;padding:0.5rem 1.2rem;border-radius:8px;font-weight:700;font-size:0.85rem">🚀 أنشئ تقريرك</a>
      </div>
      <div style="background:#1a1a2e;border:1px solid rgba(108,99,255,0.2);border-radius:16px;padding:2rem;white-space:pre-wrap;color:#e0e0f0;line-height:1.8;font-size:0.9rem">${report.content}</div>
      <div style="margin-top:1.5rem;text-align:center;color:#6060a0;font-size:0.78rem">🏢 أُنشئ بواسطة MBR Reports — <a href="/" style="color:#6c63ff">ابدأ الآن مجاناً</a></div>
    </div>`;
  document.body.appendChild(div);
}

// Add share button to report output area
document.addEventListener('DOMContentLoaded', () => {
  const reportOutput = document.getElementById('reportOutput') || document.querySelector('.report-output');
  if (reportOutput) {
    const shareBtn = document.createElement('button');
    shareBtn.className = 'ai-tool-btn';
    shareBtn.style.cssText = 'position:sticky;bottom:1rem;margin:0.5rem 0;background:linear-gradient(135deg,#6c63ff,#00d4aa)';
    shareBtn.innerHTML = '🔗 مشاركة التقرير';
    shareBtn.onclick = openShareModal;
    reportOutput.parentNode?.appendChild(shareBtn);
  }
});

// ============================================================
// TEMPLATES LIBRARY (20+ templates)
// ============================================================
const TEMPLATES = [
  // Government
  { id:'gov1', cat:'gov', icon:'🏛️', title:'التقرير الدوري للوزارة', desc:'قالب رسمي للتقارير الأسبوعية والشهرية للجهات الحكومية', fields:{ type:'monthly', title:'التقرير الشهري لوزارة _____', dept:'الإدارة العامة', period:'مارس 2026' } },
  { id:'gov2', cat:'gov', icon:'📜', title:'تقرير الأداء الحكومي', desc:'مؤشرات الأداء والإنجازات للجهات الحكومية', fields:{ type:'quarterly', title:'تقرير مؤشرات الأداء الربعي' } },
  { id:'gov3', cat:'gov', icon:'🗺️', title:'تقرير خطة العمل', desc:'خطة العمل السنوية والأهداف الاستراتيجية', fields:{ type:'annual', title:'خطة العمل السنوية ١٤٤٦' } },
  // Finance
  { id:'fin1', cat:'finance', icon:'💰', title:'التقرير المالي الشهري', desc:'الإيرادات والمصروفات والميزانية', fields:{ type:'monthly', title:'التقرير المالي — مارس 2026' } },
  { id:'fin2', cat:'finance', icon:'📈', title:'تقرير الاستثمارات', desc:'تحليل المحفظة الاستثمارية والعوائد', fields:{ type:'quarterly', title:'تقرير الاستثمارات الربعي' } },
  { id:'fin3', cat:'finance', icon:'🏦', title:'تقرير التدفق النقدي', desc:'تحليل التدفقات النقدية الداخلة والخارجة', fields:{ type:'monthly', title:'تقرير التدفق النقدي' } },
  // HR
  { id:'hr1', cat:'hr', icon:'👥', title:'تقرير الموارد البشرية', desc:'إحصائيات الموظفين والتوظيف والتدريب', fields:{ type:'monthly', title:'تقرير الموارد البشرية الشهري' } },
  { id:'hr2', cat:'hr', icon:'🎯', title:'تقرير تقييم الأداء', desc:'تقييم أداء الموظفين والكفاءات', fields:{ type:'quarterly', title:'تقييم الأداء الربعي' } },
  { id:'hr3', cat:'hr', icon:'📚', title:'تقرير التدريب والتطوير', desc:'برامج التدريب وساعات التطوير المهني', fields:{ type:'monthly', title:'تقرير التدريب والتطوير' } },
  // Projects
  { id:'prj1', cat:'project', icon:'📁', title:'تقرير حالة المشروع', desc:'تقدم المشروع والمهام والمخاطر', fields:{ type:'weekly', title:'تقرير حالة المشروع الأسبوعي' } },
  { id:'prj2', cat:'project', icon:'🏗️', title:'تقرير الإنجاز الشهري', desc:'إنجازات الفريق والمعالم المحققة', fields:{ type:'monthly', title:'تقرير الإنجاز الشهري للمشروع' } },
  { id:'prj3', cat:'project', icon:'⚠️', title:'تقرير إدارة المخاطر', desc:'تحليل المخاطر وخطط التخفيف', fields:{ type:'monthly', title:'تقرير إدارة المخاطر' } },
  // IT
  { id:'it1', cat:'it', icon:'💻', title:'تقرير تقنية المعلومات', desc:'الأنظمة والبنية التحتية والأمن السيبراني', fields:{ type:'monthly', title:'تقرير تقنية المعلومات الشهري' } },
  { id:'it2', cat:'it', icon:'🛡️', title:'تقرير الأمن السيبراني', desc:'الحوادث الأمنية وتقييم المخاطر', fields:{ type:'monthly', title:'التقرير الأمني الشهري' } },
  { id:'it3', cat:'it', icon:'⚙️', title:'تقرير الدعم الفني', desc:'طلبات الدعم ووقت الاستجابة', fields:{ type:'monthly', title:'تقرير الدعم الفني' } },
  // Marketing
  { id:'mkt1', cat:'marketing', icon:'📢', title:'تقرير التسويق الرقمي', desc:'حملات السوشيال ميديا والإعلانات الرقمية', fields:{ type:'monthly', title:'تقرير التسويق الرقمي' } },
  { id:'mkt2', cat:'marketing', icon:'📊', title:'تقرير المبيعات', desc:'إحصائيات المبيعات وتحليل العملاء', fields:{ type:'monthly', title:'تقرير المبيعات الشهري' } },
  { id:'mkt3', cat:'marketing', icon:'🎪', title:'تقرير الفعاليات', desc:'ملخص الفعاليات والمؤتمرات والحفلات', fields:{ type:'general', title:'تقرير فعالية _____' } },
];

function showTemplates() {
  const overlay = document.getElementById('templatesOverlay');
  overlay.style.display = 'block';
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('navTemplates')?.classList.add('active');
  renderTemplatesGrid('all');
}

function closeTemplates() {
  document.getElementById('templatesOverlay').style.display = 'none';
  document.getElementById('navTemplates')?.classList.remove('active');
}

function filterTemplates(btn, cat) {
  document.querySelectorAll('.tpl-cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTemplatesGrid(cat);
}

function renderTemplatesGrid(cat) {
  const grid = document.getElementById('tplGrid');
  if (!grid) return;
  const list = cat === 'all' ? TEMPLATES : TEMPLATES.filter(t => t.cat === cat);
  const catColors = { gov:'#6c63ff', finance:'#10b981', hr:'#f59e0b', project:'#0ea5e9', it:'#ef4444', marketing:'#a855f7' };
  const catNames = { gov:'حكومي', finance:'مالي', hr:'موارد بشرية', project:'مشاريع', it:'تقنية', marketing:'تسويق' };

  grid.innerHTML = list.map(t => `
    <div class="tpl-card" onclick="applyTemplate('${t.id}')">
      <div class="tpl-card-icon">${t.icon}</div>
      <div class="tpl-card-cat" style="color:${catColors[t.cat]||'var(--accent)'};background:${catColors[t.cat]||'var(--accent)'}22">${catNames[t.cat]||t.cat}</div>
      <h4>${t.title}</h4>
      <p>${t.desc}</p>
      <button class="tpl-card-btn">استخدم هذا القالب ←</button>
    </div>
  `).join('');
}

function applyTemplate(id) {
  const tpl = TEMPLATES.find(t => t.id === id);
  if (!tpl) return;
  // Apply to report form
  if (tpl.fields.title) {
    const titleEl = document.getElementById('reportTitle');
    if (titleEl) titleEl.value = tpl.fields.title;
  }
  if (tpl.fields.type) {
    const typeEl = document.getElementById('reportTypeSelect');
    if (typeEl) typeEl.value = tpl.fields.type;
  }
  // Close templates and navigate to create
  closeTemplates();
  showSection('create');
  showToast(`✅ تم تطبيق قالب: ${tpl.title}`, 'success');
}


// ============================================================
// 1. GOOGLE SHEETS INTEGRATION
// ============================================================
let sheetsData = null;

async function fetchGoogleSheet() {
  const url = (document.getElementById('sheetsUrl') || {}).value || '';
  if (!url.trim()) { showToast('الصق رابط Google Sheet أولاً', 'error'); return; }
  const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) { showToast('الرابط غير صحيح — تأكد أنه رابط Google Sheets', 'error'); return; }
  const sheetId = match[1];
  showToast('⏳ جاري جلب البيانات...', 'success');
  const tryFetch = async (u) => { const r = await fetch(u); if (!r.ok) throw new Error(); return r.text(); };
  try {
    const csv = await tryFetch(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`)
      .catch(() => tryFetch(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`));
    sheetsData = csv.trim().split('\n').map(line => {
      const cols = []; let cur = '', inQ = false;
      for (const c of line) {
        if (c === '"') inQ = !inQ;
        else if (c === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
        else cur += c;
      }
      cols.push(cur.trim()); return cols;
    });
    const prev = document.getElementById('sheetsPreview');
    if (prev) {
      prev.style.display = 'block';
      prev.innerHTML = '<table style="width:100%;border-collapse:collapse;font-size:0.7rem">' +
        sheetsData.slice(0, 8).map((r, i) =>
          `<tr style="background:${i===0?'rgba(15,157,88,0.2)':'transparent'}">${r.map(c=>`<td style="padding:3px 6px;border:1px solid rgba(255,255,255,0.06)">${c}</td>`).join('')}</tr>`
        ).join('') + `</table><div style="color:var(--text-muted);font-size:0.68rem;margin-top:0.3rem">عرض 8 صفوف من ${sheetsData.length}</div>`;
    }
    showToast(`✅ تم جلب ${sheetsData.length} صف من Google Sheets`, 'success');
  } catch { showToast('❌ تأكد أن الـ Sheet عام: Share → Anyone with link → Viewer', 'error'); }
}

async function aiSheetsToReport() {
  if (!sheetsData || !sheetsData.length) { showToast('اجلب بيانات الـ Sheet أولاً', 'error'); return; }
  const resultEl = document.getElementById('sheetsResult');
  if (resultEl) { resultEl.style.display = 'block'; resultEl.innerHTML = '<div class="ai-loading"><div class="spinner"></div><span>يحلل AI البيانات...</span></div>'; }
  const headers = sheetsData[0] || [];
  const rows = sheetsData.slice(1, 25).map(r => r.join(' | ')).join('\n');
  const result = await callAI(
    `لديك بيانات من Google Sheets:\nالأعمدة: ${headers.join(' | ')}\nالبيانات:\n${rows}\n\nاكتب تقريراً تحليلياً احترافياً بالعربية:\n١. ملخص تنفيذي\n٢. أبرز الأرقام والاتجاهات\n٣. المقارنات والنسب\n٤. التوصيات (٣-٥)\n٥. الخلاصة`,
    'أنت محلل بيانات ومحرر تقارير احترافي.', { maxTokens: 2000 }
  );
  if (result && resultEl) {
    resultEl.innerHTML = `<div class="ai-result-content" style="white-space:pre-wrap">${result}</div>`;
    showToast('✅ تم إنشاء التقرير من Google Sheets!', 'success');
  }
}

// ============================================================
// 2. PROFESSIONAL PDF EXPORT
// ============================================================
let orgLogoDataUrl = localStorage.getItem('mbrcst_org_logo') || null;

function showPdfPanel() {
  document.getElementById('pdfBrandingPanel').style.display = 'block';
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('navPdf') && document.getElementById('navPdf').classList.add('active');
  loadPdfBranding(); updatePdfPreview();
}
function closePdfPanel() {
  document.getElementById('pdfBrandingPanel').style.display = 'none';
  document.getElementById('navPdf') && document.getElementById('navPdf').classList.remove('active');
}

function loadOrgLogo(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    orgLogoDataUrl = e.target.result;
    localStorage.setItem('mbrcst_org_logo', orgLogoDataUrl);
    const st = document.getElementById('logoStatus');
    if (st) st.textContent = '✅ ' + file.name;
    updatePdfPreview();
  };
  reader.readAsDataURL(file);
}

function savePdfBranding() {
  const b = {
    name: (document.getElementById('orgName')||{}).value||'',
    dept: (document.getElementById('orgDept')||{}).value||'',
    color: (document.getElementById('brandColor')||{}).value||'#6c63ff'
  };
  localStorage.setItem('mbrcst_branding', JSON.stringify(b));
  showToast('✅ تم حفظ هوية المؤسسة', 'success');
  updatePdfPreview();
}

function loadPdfBranding() {
  const b = JSON.parse(localStorage.getItem('mbrcst_branding')||'{}');
  if (b.name && document.getElementById('orgName')) document.getElementById('orgName').value = b.name;
  if (b.dept && document.getElementById('orgDept')) document.getElementById('orgDept').value = b.dept;
  if (b.color && document.getElementById('brandColor')) document.getElementById('brandColor').value = b.color;
  if (orgLogoDataUrl) { const st=document.getElementById('logoStatus'); if(st) st.textContent='✅ الشعار محمّل'; }
}

function updatePdfPreview() {
  const b = JSON.parse(localStorage.getItem('mbrcst_branding')||'{}');
  const color = b.color || '#6c63ff';
  const orgName = b.name || (document.getElementById('orgName')||{}).value || 'المؤسسة';
  const orgDept = b.dept || (document.getElementById('orgDept')||{}).value || '';
  const title = (document.getElementById('reportTitle')||{}).value || 'التقرير الدوري';
  const content = getCurrentReportText();
  const now = new Date().toLocaleDateString('ar-SA',{year:'numeric',month:'long',day:'numeric'});
  const logoHtml = orgLogoDataUrl
    ? `<img src="${orgLogoDataUrl}" style="max-height:60px;max-width:120px;object-fit:contain" alt="logo">`
    : `<div style="width:56px;height:56px;background:${color}22;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.4rem">🏢</div>`;
  const box = document.getElementById('pdfPreviewBox');
  if (!box) return;
  box.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid ${color};padding-bottom:1rem;margin-bottom:1.5rem">
      ${logoHtml}
      <div style="text-align:right">
        <div style="font-size:1rem;font-weight:900;color:${color}">${orgName}</div>
        ${orgDept?`<div style="font-size:0.76rem;color:#666">${orgDept}</div>`:''}
      </div>
    </div>
    <div style="font-size:1.2rem;font-weight:900;text-align:center;color:${color};margin-bottom:1rem">${title}</div>
    <div style="display:flex;gap:1.5rem;background:#f8f8ff;padding:0.6rem 1rem;border-radius:8px;font-size:0.76rem;color:#555;margin-bottom:1rem;flex-wrap:wrap">
      <span>📅 ${now}</span>
      <span>👤 ${(currentUser||{}).fullName||'المستخدم'}</span>
      <span>🏢 MBR Reports</span>
    </div>
    <div style="font-size:0.83rem;line-height:2;color:#222;white-space:pre-wrap">${content !== 'لا يوجد محتوى تقرير حالياً' ? content.substring(0,1500) : '<div style="color:#999;text-align:center;padding:2rem">أنشئ تقريراً أولاً</div>'}</div>
    <div style="margin-top:2rem;border-top:1px solid #ddd;padding-top:0.6rem;text-align:center;color:#999;font-size:0.7rem">تم إنشاؤه بواسطة MBR Reports | ${window.location.hostname}</div>`;
}

async function exportProfessionalPDF() {
  updatePdfPreview();
  showToast('⏳ جاري إنشاء PDF...', 'success');
  const b = JSON.parse(localStorage.getItem('mbrcst_branding')||'{}');
  const title = (document.getElementById('reportTitle')||{}).value || 'التقرير';
  const box = document.getElementById('pdfPreviewBox');
  if (window.html2canvas && window.jspdf) {
    try {
      const canvas = await html2canvas(box, {scale:2, useCORS:true, backgroundColor:'#fff', logging:false});
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p','mm','a4');
      const w = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * w) / canvas.width;
      const img = canvas.toDataURL('image/png');
      let y = 0;
      while (y < imgH) { if (y>0) pdf.addPage(); pdf.addImage(img,'PNG',0,-y,w,imgH); y+=ph; }
      pdf.save(`${b.name||'MBR'}_${title}_${new Date().toISOString().slice(0,10)}.pdf`);
      showToast('✅ تم تصدير PDF!', 'success'); return;
    } catch(e) { console.warn('html2canvas failed, using text fallback'); }
  }
  // Text fallback using basic print
  const win = window.open('', '_blank');
  win.document.write(`<html><head><meta charset="utf-8"><style>body{font-family:Arial;direction:rtl;padding:40px}</style></head><body>${box.innerHTML}</body></html>`);
  win.document.close(); win.print(); win.close();
  showToast('✅ تم فتح نافذة الطباعة', 'success');
}

function exportWordDoc() {
  const content = getCurrentReportText();
  const title = (document.getElementById('reportTitle')||{}).value || 'التقرير';
  const b = JSON.parse(localStorage.getItem('mbrcst_branding')||'{}');
  const now = new Date().toLocaleDateString('ar-SA');
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:Arial;direction:rtl;padding:3cm;font-size:12pt}h1,h2{color:${b.color||'#6c63ff'}}.header{border-bottom:3px solid ${b.color||'#6c63ff'};margin-bottom:20pt;padding-bottom:10pt}.footer{border-top:1pt solid #ccc;margin-top:40pt;padding-top:8pt;color:#888;font-size:9pt;text-align:center}</style>
</head><body>
<div class="header"><h2>${b.name||'المؤسسة'}</h2><p>${b.dept||''}</p></div>
<h1>${title}</h1><p style="color:#666">التاريخ: ${now} | أعده: ${(currentUser||{}).fullName||''}</p><hr>
<div style="line-height:2;white-space:pre-wrap">${content}</div>
<div class="footer">MBR Reports | ${window.location.hostname}</div>
</body></html>`;
  const blob = new Blob(['\ufeff' + html], {type:'application/msword'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `${title}.doc`; a.click();
  showToast('✅ تم تصدير Word!', 'success');
}

// ============================================================
// 3. SCHEDULED REPORTS
// ============================================================
const DAY_NAMES = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const TYPE_NAMES = {daily:'يومي', weekly:'أسبوعي', monthly:'شهري'};

function showSchedulePanel() {
  document.getElementById('schedulePanel').style.display = 'block';
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('navSchedule') && document.getElementById('navSchedule').classList.add('active');
  renderActiveSchedules();
}
function closeSchedulePanel() {
  document.getElementById('schedulePanel').style.display = 'none';
  document.getElementById('navSchedule') && document.getElementById('navSchedule').classList.remove('active');
}

function addSchedule() {
  const type = (document.getElementById('schedType')||{}).value || 'weekly';
  const day  = parseInt((document.getElementById('schedDay')||{}).value || '0');
  const time = (document.getElementById('schedTime')||{}).value || '08:00';
  const email= ((document.getElementById('schedEmail')||{}).value || '').trim();
  if (!time) { showToast('حدد الوقت', 'error'); return; }
  const schedules = JSON.parse(localStorage.getItem('mbrcst_schedules')||'[]');
  schedules.push({ id: Date.now(), type, day, time, email, dayName: DAY_NAMES[day], typeName: TYPE_NAMES[type], active: true, created: new Date().toISOString() });
  localStorage.setItem('mbrcst_schedules', JSON.stringify(schedules));
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  renderActiveSchedules();
  showToast(`✅ جُدول تقرير ${TYPE_NAMES[type]} — ${DAY_NAMES[day]} ${time}`, 'success');
  startScheduleChecker();
}

function renderActiveSchedules() {
  const list = JSON.parse(localStorage.getItem('mbrcst_schedules')||'[]');
  const el = document.getElementById('activeSchedules');
  if (!el) return;
  el.innerHTML = list.length
    ? list.map(s => `
        <div class="sched-card">
          <span style="font-size:1.3rem">${s.type==='daily'?'📅':s.type==='weekly'?'📆':'🗓️'}</span>
          <div style="flex:1">
            <div style="font-size:0.85rem;font-weight:700;color:#fff">تقرير ${s.typeName} — ${s.dayName} ${s.time}</div>
            <div style="font-size:0.72rem;color:var(--text-muted);margin-top:2px">${s.email?'📧 '+s.email:'🔔 إشعار فقط'}</div>
          </div>
          <span style="font-size:0.68rem;font-weight:700;background:rgba(0,212,170,0.15);color:#00d4aa;border-radius:4px;padding:2px 6px">نشط</span>
          <button onclick="deleteSchedule(${s.id})" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:1rem;opacity:0.7" title="حذف">🗑️</button>
        </div>`).join('')
    : '<div style="color:var(--text-muted);font-size:0.82rem;text-align:center;padding:1.5rem">لا توجد جداول نشطة بعد</div>';
}

function deleteSchedule(id) {
  const list = JSON.parse(localStorage.getItem('mbrcst_schedules')||'[]').filter(s => s.id !== id);
  localStorage.setItem('mbrcst_schedules', JSON.stringify(list));
  renderActiveSchedules();
  showToast('تم حذف الجدول', 'success');
}

let schedChecker = null;
function startScheduleChecker() {
  if (schedChecker) return;
  schedChecker = setInterval(() => {
    const list = JSON.parse(localStorage.getItem('mbrcst_schedules')||'[]');
    if (!list.length) return;
    const now = new Date();
    const nowDay = now.getDay();
    const nowTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    list.forEach(s => {
      const matchDay = s.type === 'daily' || s.day === nowDay;
      const alreadyRan = localStorage.getItem(`mbrcst_sched_${s.id}`) === new Date().toDateString();
      if (matchDay && s.time === nowTime && !alreadyRan) {
        localStorage.setItem(`mbrcst_sched_${s.id}`, new Date().toDateString());
        if (Notification.permission === 'granted') {
          new Notification('MBR Reports — تقرير مجدول 🔔', {
            body: `حان وقت تقريرك ${s.typeName} — ${s.dayName} ${s.time}`,
            icon: '/favicon.ico'
          });
        }
        showToast(`🔔 حان وقت تقريرك ${s.typeName}!`, 'success');
        if (s.email) {
          window.open(`mailto:${s.email}?subject=${encodeURIComponent('تذكير: تقريرك '+s.typeName)}&body=${encodeURIComponent('حان وقت إنشاء تقريرك.\n\nافتح: '+window.location.origin)}`);
        }
      }
    });
  }, 60000);
}

// Auto-start checker if there are schedules
(function() {
  const list = JSON.parse(localStorage.getItem('mbrcst_schedules')||'[]');
  if (list.length) startScheduleChecker();
})();

// ============================================================
// 4. REPORTS HISTORY LIBRARY — Auto-save + Search
// ============================================================
let currentHistReport = null;

function saveReportToHistory(title, content, type) {
  if (!content || content.length < 50) return;
  const history = JSON.parse(localStorage.getItem('mbrcst_history') || '[]');
  const entry = {
    id: Date.now(),
    title: title || 'تقرير بدون عنوان',
    content,
    type: type || 'general',
    date: new Date().toISOString(),
    wordCount: content.split(/\s+/).length,
    charCount: content.length
  };
  history.unshift(entry);
  // Keep max 100 reports
  if (history.length > 100) history.pop();
  localStorage.setItem('mbrcst_history', JSON.stringify(history));
  return entry;
}

function showReportsHistory() {
  const overlay = document.getElementById('reportsHistoryOverlay');
  if (!overlay) return;
  overlay.style.display = 'block';
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const nb = document.getElementById('navHistory2');
  if (nb) nb.classList.add('active');
  renderHistory(null);
  renderHistoryStats();
  populateCompareSelects();
}

function closeReportsHistory() {
  const overlay = document.getElementById('reportsHistoryOverlay');
  if (overlay) overlay.style.display = 'none';
  const nb = document.getElementById('navHistory2');
  if (nb) nb.classList.remove('active');
}

function renderHistoryStats() {
  const history = JSON.parse(localStorage.getItem('mbrcst_history') || '[]');
  const el = document.getElementById('historyStats');
  if (!el || !history.length) return;
  const totalWords = history.reduce((s, r) => s + (r.wordCount || 0), 0);
  const thisMonth = history.filter(r => new Date(r.date).getMonth() === new Date().getMonth()).length;
  const types = {};
  history.forEach(r => { types[r.type] = (types[r.type] || 0) + 1; });
  const topType = Object.entries(types).sort((a, b) => b[1] - a[1])[0];
  el.innerHTML = [
    { icon: '📑', val: history.length, label: 'إجمالي التقارير', color: '#6c63ff' },
    { icon: '📅', val: thisMonth, label: 'تقارير هذا الشهر', color: '#00d4aa' },
    { icon: '✍️', val: totalWords.toLocaleString('ar'), label: 'إجمالي الكلمات', color: '#f59e0b' }
  ].map(s => `
    <div style="background:#1a1a2e;border:1px solid rgba(${s.color==='#6c63ff'?'108,99,255':s.color==='#00d4aa'?'0,212,170':'245,158,11'},0.2);border-radius:12px;padding:1rem;text-align:center">
      <div style="font-size:1.8rem;margin-bottom:0.3rem">${s.icon}</div>
      <div style="font-size:1.4rem;font-weight:900;color:${s.color}">${s.val}</div>
      <div style="font-size:0.72rem;color:var(--text-muted)">${s.label}</div>
    </div>`).join('');
}

function renderHistory(filter) {
  const grid = document.getElementById('historyGrid');
  if (!grid) return;
  let history = JSON.parse(localStorage.getItem('mbrcst_history') || '[]');
  if (filter) history = history.filter(r =>
    r.title.includes(filter) || r.content.includes(filter) || r.type.includes(filter)
  );
  if (!history.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted)">
      <div style="font-size:2.5rem;margin-bottom:0.5rem">📭</div>
      <div>${filter ? 'لا نتائج للبحث' : 'لا توجد تقارير محفوظة بعد'}</div>
      <div style="font-size:0.8rem;margin-top:0.5rem">أنشئ تقريراً وسيُحفظ تلقائياً هنا</div>
    </div>`; return;
  }
  const typeColors = {monthly:'#6c63ff', weekly:'#00d4aa', quarterly:'#f59e0b', annual:'#ef4444', general:'#a855f7', project:'#0ea5e9'};
  const typeNames = {monthly:'شهري', weekly:'أسبوعي', quarterly:'ربعي', annual:'سنوي', general:'عام', project:'مشروع'};
  grid.innerHTML = history.map(r => {
    const d = new Date(r.date);
    const dateStr = d.toLocaleDateString('ar-SA', {year:'numeric', month:'short', day:'numeric'});
    const timeStr = d.toLocaleTimeString('ar-SA', {hour:'2-digit', minute:'2-digit'});
    const preview = r.content.substring(0, 120).replace(/\n/g, ' ');
    const color = typeColors[r.type] || '#6c63ff';
    return `
      <div class="hist-card" onclick="viewHistReport(${r.id})" style="background:#1a1a2e;border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:1.2rem;cursor:pointer;transition:all 0.2s;hover:">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.6rem">
          <span style="font-size:0.68rem;font-weight:700;background:${color}22;color:${color};border-radius:4px;padding:2px 7px">${typeNames[r.type]||r.type}</span>
          <span style="font-size:0.68rem;color:var(--text-muted)">${dateStr}</span>
        </div>
        <div style="font-size:0.88rem;font-weight:800;color:#fff;margin-bottom:0.4rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${r.title}</div>
        <div style="font-size:0.73rem;color:var(--text-muted);line-height:1.5;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${preview}...</div>
        <div style="display:flex;justify-content:space-between;margin-top:0.8rem;padding-top:0.6rem;border-top:1px solid rgba(255,255,255,0.06)">
          <span style="font-size:0.68rem;color:var(--text-muted)">📝 ${r.wordCount||0} كلمة</span>
          <span style="font-size:0.68rem;color:var(--text-muted)">${timeStr}</span>
        </div>
      </div>`;
  }).join('');
}

function searchHistory(q) { renderHistory(q || null); }

function viewHistReport(id) {
  const history = JSON.parse(localStorage.getItem('mbrcst_history') || '[]');
  const report = history.find(r => r.id === id);
  if (!report) return;
  currentHistReport = report;
  const modal = document.getElementById('historyViewModal');
  if (!modal) return;
  modal.style.display = 'flex'; modal.classList.add('open');
  const titleEl = document.getElementById('histViewTitle');
  const contentEl = document.getElementById('histViewContent');
  if (titleEl) titleEl.textContent = report.title;
  if (contentEl) contentEl.textContent = report.content;
}

function closeHistView() {
  const modal = document.getElementById('historyViewModal');
  if (modal) { modal.style.display = 'none'; modal.classList.remove('open'); }
  currentHistReport = null;
}

function loadHistReport() {
  if (!currentHistReport) return;
  const titleEl = document.getElementById('reportTitle');
  if (titleEl) titleEl.value = currentHistReport.title;
  const outputEl = document.getElementById('reportOutput') || document.querySelector('.report-output-content');
  if (outputEl) outputEl.textContent = currentHistReport.content;
  closeHistView();
  closeReportsHistory();
  showSection('create');
  showToast('✅ تم تحميل التقرير في المحرر', 'success');
}

function exportHistPDF() {
  if (!currentHistReport) return;
  const prev = document.getElementById('pdfPreviewBox');
  if (prev) {
    const t = document.getElementById('reportTitle');
    if (t) t.value = currentHistReport.title;
    closeHistView();
    closeReportsHistory();
    showPdfPanel();
    showToast('اضغط "تصدير PDF" لتحميل التقرير', 'success');
  }
}

// AUTO-SAVE hook — patch into callAI result handling
const _origCallAI = callAI;
async function callAI(prompt, system, opts) {
  const result = await _origCallAI(prompt, system, opts);
  if (result && result.length > 100) {
    const title = (document.getElementById('reportTitle') || {}).value || 'تقرير AI';
    const type = (document.getElementById('reportTypeSelect') || {}).value || 'general';
    saveReportToHistory(title, result, type);
  }
  return result;
}

// ============================================================
// 5. POWERPOINT EXPORT
// ============================================================
async function exportPowerPoint() {
  const content = getCurrentReportText();
  if (!content || content === 'لا يوجد محتوى تقرير حالياً') {
    showToast('❌ أنشئ تقريراً أولاً', 'error'); return;
  }
  const b = JSON.parse(localStorage.getItem('mbrcst_branding') || '{}');
  const title = (document.getElementById('reportTitle') || {}).value || 'التقرير';
  const brandColor = (b.color || '#6c63ff').replace('#', '');
  const now = new Date().toLocaleDateString('ar-SA');
  const author = (currentUser || {}).fullName || 'MBR Reports';

  if (typeof PptxGenJS === 'undefined') {
    showToast('⏳ تحميل مكتبة PowerPoint...', 'success');
    await new Promise(r => setTimeout(r, 1000));
  }
  if (typeof PptxGenJS === 'undefined') {
    showToast('❌ مكتبة PowerPoint غير محملة', 'error'); return;
  }

  showToast('⏳ جاري إنشاء PowerPoint...', 'success');
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = author;
  pptx.title = title;

  const ACCENT = '#' + brandColor;
  const DARK = '#1a1a2e';
  const WHITE = '#FFFFFF';
  const GRAY = '#a0a0c0';

  // --- Slide 1: Title ---
  const slide1 = pptx.addSlide();
  slide1.background = { color: DARK.replace('#', '') };
  slide1.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.08, fill: { color: brandColor } });
  slide1.addShape(pptx.ShapeType.rect, { x: 0, y: '92%', w: '100%', h: 0.08, fill: { color: brandColor } });
  slide1.addText(b.name || 'MBR Reports', { x: 0.5, y: 0.8, w: 9, fontSize: 14, color: brandColor, bold: false, align: 'right', fontFace: 'Arial' });
  slide1.addText(title, { x: 0.5, y: 2, w: 9, fontSize: 32, bold: true, color: WHITE, align: 'center', fontFace: 'Arial' });
  slide1.addShape(pptx.ShapeType.rect, { x: 3.5, y: 3.2, w: 3, h: 0.04, fill: { color: brandColor } });
  slide1.addText(`${author} | ${now}`, { x: 0.5, y: 3.5, w: 9, fontSize: 14, color: GRAY, align: 'center', fontFace: 'Arial' });
  slide1.addText('أُعدَّ بواسطة MBR Reports', { x: 0.5, y: 4.8, w: 9, fontSize: 11, color: GRAY, align: 'center', fontFace: 'Arial' });

  // --- Split content into sections/slides ---
  const lines = content.split('\n').filter(l => l.trim());
  const chunkSize = 12;
  let slideNum = 2;
  for (let i = 0; i < lines.length; i += chunkSize) {
    const chunk = lines.slice(i, i + chunkSize);
    const slide = pptx.addSlide();
    slide.background = { color: DARK.replace('#', '') };
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.06, fill: { color: brandColor } });
    slide.addText(`${title} — المحتوى`, { x: 0.5, y: 0.2, w: 9, fontSize: 13, bold: true, color: WHITE, align: 'right', fontFace: 'Arial' });
    const bodyText = chunk.map(l => ({
      text: l.replace(/^[١٢٣٤٥٦٧٨٩\d]+[.)]\s*/, '').trim(),
      options: {
        fontSize: l.match(/^[١٢٣٤٥٦٧٨٩\d]+[.)]/) ? 13 : 12,
        bold: l.match(/^[١٢٣٤٥٦٧٨٩\d]+[.)]/) ? true : false,
        color: l.match(/^[١٢٣٤٥٦٧٨٩\d]+[.)]/) ? WHITE : GRAY,
        bullet: !l.match(/^[١٢٣٤٥٦٧٨٩\d]+[.)]/) && l.trim().length > 5,
        paraSpaceAfter: 6, fontFace: 'Arial', align: 'right'
      }
    }));
    slide.addText(bodyText, { x: 0.5, y: 0.9, w: 9, h: 4.0, valign: 'top', fontFace: 'Arial' });
    slide.addText(`${slideNum}`, { x: 9.2, y: 5.1, w: 0.5, fontSize: 10, color: GRAY, align: 'right' });
    slideNum++;
  }

  // --- Last slide: closing ---
  const lastSlide = pptx.addSlide();
  lastSlide.background = { color: DARK.replace('#', '') };
  lastSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: brandColor + '22' } });
  lastSlide.addText('شكراً', { x: 0.5, y: 1.8, w: 9, fontSize: 48, bold: true, color: WHITE, align: 'center', fontFace: 'Arial' });
  lastSlide.addText(b.name || 'MBR Reports', { x: 0.5, y: 3.3, w: 9, fontSize: 16, color: brandColor, align: 'center', fontFace: 'Arial' });
  lastSlide.addText(now, { x: 0.5, y: 3.9, w: 9, fontSize: 12, color: GRAY, align: 'center', fontFace: 'Arial' });

  await pptx.writeFile({ fileName: `${title}.pptx` });
  showToast('✅ تم تصدير PowerPoint بنجاح!', 'success');
  // Save to history
  saveReportToHistory(title + ' (PPTX)', content, (document.getElementById('reportTypeSelect') || {}).value || 'general');
}

// ============================================================
// 6. COMPARE REPORTS (AI-powered)
// ============================================================
let compareReports = { A: null, B: null };

function showComparePanel() {
  const overlay = document.getElementById('compareOverlay');
  if (!overlay) return;
  overlay.style.display = 'block';
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const nb = document.getElementById('navCompare');
  if (nb) nb.classList.add('active');
  populateCompareSelects();
}

function closeComparePanel() {
  const overlay = document.getElementById('compareOverlay');
  if (overlay) overlay.style.display = 'none';
  const nb = document.getElementById('navCompare');
  if (nb) nb.classList.remove('active');
}

function populateCompareSelects() {
  const history = JSON.parse(localStorage.getItem('mbrcst_history') || '[]');
  ['compareA', 'compareB'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = '<option value="">— اختر تقريراً —</option>' +
      history.map(r => {
        const d = new Date(r.date).toLocaleDateString('ar-SA', {month:'short', day:'numeric'});
        return `<option value="${r.id}">${r.title} (${d})</option>`;
      }).join('');
    sel.value = cur;
  });
}

function loadCompareReport(side, id) {
  const history = JSON.parse(localStorage.getItem('mbrcst_history') || '[]');
  const report = history.find(r => r.id == id);
  compareReports[side] = report || null;
  const preview = document.getElementById(`comparePreview${side}`);
  if (preview) {
    if (report) {
      preview.style.display = 'block';
      preview.textContent = report.content.substring(0, 400) + '...';
    } else {
      preview.style.display = 'none';
    }
  }
}

async function runAICompare() {
  const { A, B } = compareReports;
  if (!A || !B) { showToast('اختر تقريرين للمقارنة', 'error'); return; }
  const resultEl = document.getElementById('compareResult');
  if (!resultEl) return;
  resultEl.style.display = 'block';
  resultEl.innerHTML = '<div class="ai-loading"><div class="spinner"></div><span>AI يقارن التقريرين...</span></div>';

  const dA = new Date(A.date).toLocaleDateString('ar-SA', {month:'long', year:'numeric'});
  const dB = new Date(B.date).toLocaleDateString('ar-SA', {month:'long', year:'numeric'});

  const result = await callAI(
    `قارن بين هذين التقريرين وأعطني تحليلاً احترافياً:\n\n=== التقرير الأول: ${A.title} (${dA}) ===\n${A.content.substring(0,1500)}\n\n=== التقرير الثاني: ${B.title} (${dB}) ===\n${B.content.substring(0,1500)}\n\nالمطلوب:\n١. الفروقات الجوهرية بين التقريرين\n٢. مؤشرات التحسن أو التراجع\n٣. الاتجاهات الرئيسية\n٤. توصيات بناءً على المقارنة`,
    'أنت محلل تقارير خبير متخصص في تحليل الاتجاهات والفروقات بين الفترات الزمنية.',
    { maxTokens: 2000 }
  );
  if (result) {
    resultEl.innerHTML = `
      <div style="display:flex;gap:1rem;margin-bottom:1rem;flex-wrap:wrap">
        <div style="background:rgba(108,99,255,0.1);border-radius:8px;padding:0.5rem 0.8rem;font-size:0.8rem;font-weight:700;color:var(--accent)">📄 ${A.title}</div>
        <div style="color:var(--text-muted);align-self:center">vs</div>
        <div style="background:rgba(0,212,170,0.1);border-radius:8px;padding:0.5rem 0.8rem;font-size:0.8rem;font-weight:700;color:#00d4aa">📄 ${B.title}</div>
      </div>
      <div style="white-space:pre-wrap;color:var(--text-secondary);font-size:0.83rem;line-height:1.8">${result}</div>`;
    showToast('✅ تمت المقارنة بالـ AI!', 'success');
  }
}

// ============================================================
// 8. VOICE INPUT (Web Speech API)
// ============================================================
let voiceRecognition = null;
let isVoiceListening = false;
let voiceMode = 'dictate'; // dictate | report | command
let voiceFullText = '';
let voiceAnimInterval = null;

function showVoicePanel() {
  document.getElementById('voicePanel').style.display = 'block';
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('navVoice')?.classList.add('active');
  initVoiceRecognition();
}
function closeVoicePanel() {
  document.getElementById('voicePanel').style.display = 'none';
  document.getElementById('navVoice')?.classList.remove('active');
  stopVoice();
}
function setVoiceMode(mode) {
  voiceMode = mode;
  document.querySelectorAll('.voice-mode-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`vMode${mode.charAt(0).toUpperCase()+mode.slice(1)}`)?.classList.add('active');
  const msgs = {dictate:'تكلّم وسيُكتب نصك مباشرة', report:'تكلّم وسيُحوَّل كلامك لتقرير احترافي', command:'أصدر أوامر مثل: "أنشئ تقرير شهري"'};
  const st = document.getElementById('voiceStatus');
  if (st) st.textContent = msgs[mode] || '';
}

function initVoiceRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    const st = document.getElementById('voiceStatus');
    if (st) st.textContent = '❌ المتصفح لا يدعم الإدخال الصوتي. استخدم Chrome أو Edge';
    return null;
  }
  const r = new SpeechRecognition();
  r.continuous = true;
  r.interimResults = true;
  r.lang = 'ar-SA';
  r.onresult = e => {
    let interim = '', final = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const txt = e.results[i][0].transcript;
      if (e.results[i].isFinal) { final += txt + ' '; voiceFullText += txt + ' '; }
      else interim += txt;
    }
    const el = document.getElementById('voiceTranscript');
    if (el) el.textContent = (voiceFullText + interim) || 'استمر في الكلام...';
  };
  r.onerror = e => {
    const st = document.getElementById('voiceStatus');
    if (st) st.textContent = e.error === 'not-allowed' ? '❌ اسمح للمتصفح باستخدام الميكروفون' : '❌ خطأ: ' + e.error;
    stopVoiceAnim();
    isVoiceListening = false;
    const btn = document.getElementById('voiceMicBtn');
    if (btn) { btn.textContent = '🎙️'; btn.style.background = 'linear-gradient(135deg,#6c63ff,#00d4aa)'; }
  };
  r.onend = () => {
    if (isVoiceListening) { try { r.start(); } catch(e) {} }
    else { stopVoiceAnim(); }
  };
  voiceRecognition = r;
  return r;
}

function toggleVoice() {
  if (!voiceRecognition) initVoiceRecognition();
  if (!voiceRecognition) return;
  if (isVoiceListening) { stopVoice(); } else { startVoice(); }
}

function startVoice() {
  if (!voiceRecognition) { initVoiceRecognition(); if (!voiceRecognition) return; }
  voiceRecognition.lang = document.documentElement.lang === 'en' ? 'en-US' : 'ar-SA';
  try { voiceRecognition.start(); } catch(e) { voiceRecognition = null; initVoiceRecognition(); try { voiceRecognition.start(); } catch(ee) { return; } }
  isVoiceListening = true;
  const st = document.getElementById('voiceStatus');
  if (st) st.textContent = '🔴 جارٍ الاستماع... تكلّم الآن';
  const btn = document.getElementById('voiceMicBtn');
  if (btn) { btn.textContent = '⏹️'; btn.style.background = 'linear-gradient(135deg,#ef4444,#b91c1c)'; }
  startVoiceAnim();
}

function stopVoice() {
  isVoiceListening = false;
  if (voiceRecognition) { try { voiceRecognition.stop(); } catch(e) {} }
  const st = document.getElementById('voiceStatus');
  if (st) st.textContent = voiceFullText ? '✅ تم التسجيل. اضغط "نقل للمحرر" أو "ولّد تقرير"' : 'اضغط الميكروفون للبدء';
  const btn = document.getElementById('voiceMicBtn');
  if (btn) { btn.textContent = '🎙️'; btn.style.background = 'linear-gradient(135deg,#6c63ff,#00d4aa)'; }
  stopVoiceAnim();
}

function clearVoice() {
  voiceFullText = '';
  const el = document.getElementById('voiceTranscript');
  if (el) el.textContent = 'سيظهر كلامك هنا...';
  const st = document.getElementById('voiceStatus');
  if (st) st.textContent = 'اضغط الميكروفون للبدء';
}

function applyVoiceText() {
  if (!voiceFullText.trim()) { showToast('لا يوجد نص لنقله', 'error'); return; }
  const areaEl = document.getElementById('reportNotes') || document.getElementById('reportObjectives') || document.querySelector('textarea');
  if (areaEl) { areaEl.value += (areaEl.value ? '\n' : '') + voiceFullText.trim(); }
  closeVoicePanel();
  showSection('create');
  showToast('✅ تم نقل النص للمحرر', 'success');
}

async function voiceToAIReport() {
  const text = voiceFullText.trim();
  if (!text) { showToast('سجّل كلامك أولاً', 'error'); return; }
  stopVoice();
  closeVoicePanel();
  showSection('ai-tools');
  const st = document.getElementById('voiceStatus');
  const resultArea = document.querySelector('.ai-tool-result') || document.createElement('div');
  resultArea.style.display = 'block';
  resultArea.innerHTML = '<div class="ai-loading"><div class="spinner"></div><span>AI يحوّل كلامك لتقرير...</span></div>';
  const result = await callAI(
    `حوّل هذه الملاحظات الصوتية العشوائية إلى تقرير احترافي منظّم بالعربية:\n\n"${text}"\n\nالمطلوب:\n١. رتّب الأفكار وأضف هيكلاً احترافياً\n٢. صحّح الأخطاء وحسّن الأسلوب\n٣. أضف مقدمة وخاتمة\n٤. الأسلوب رسمي ومهني`,
    'أنت كاتب تقارير محترف متخصص في تحويل الملاحظات الشفهية لتقارير مكتوبة منظمة.'
  );
  if (result && resultArea) {
    resultArea.innerHTML = `<div class="ai-result-content" style="white-space:pre-wrap">${result}</div>`;
    showToast('✅ تم تحويل كلامك لتقرير!', 'success');
  }
}

function startVoiceAnim() {
  const bars = document.querySelectorAll('.voice-bar');
  if (!bars.length) return;
  voiceAnimInterval = setInterval(() => {
    bars.forEach(b => {
      const h = Math.random() * 50 + 10;
      b.style.height = h + 'px';
    });
  }, 100);
}

function stopVoiceAnim() {
  clearInterval(voiceAnimInterval);
  document.querySelectorAll('.voice-bar').forEach(b => { b.style.height = '8px'; });
}

// ============================================================
// 9. USER PROFILE
// ============================================================
function showProfilePanel() {
  const overlay = document.getElementById('profileOverlay');
  if (!overlay) return;
  overlay.style.display = 'block';
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('navProfile')?.classList.add('active');
  loadProfileData();
}
function closeProfilePanel() {
  document.getElementById('profileOverlay').style.display = 'none';
  document.getElementById('navProfile')?.classList.remove('active');
}

function loadProfileData() {
  const user = currentUser;
  if (!user) return;
  document.getElementById('profileName').textContent = user.fullName || user.username || '';
  document.getElementById('profileEmail').textContent = user.username || '';
  document.getElementById('profileRole').textContent = user.role === 'admin' ? '👑 مدير النظام' : '👤 مستخدم';
  document.getElementById('editFullName').value = user.fullName || '';

  // Avatar
  const savedAvatar = localStorage.getItem('mbrcst_user_avatar_' + user.username);
  const bigAvatar = document.getElementById('profileAvatarBig');
  if (savedAvatar && bigAvatar) bigAvatar.innerHTML = `<img src="${savedAvatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`;

  // Stats
  const history = JSON.parse(localStorage.getItem('mbrcst_history') || '[]');
  const aiUsage = parseInt(localStorage.getItem('mbrcst_ai_usage') || '0');
  const thisMonth = history.filter(r => new Date(r.date).getMonth() === new Date().getMonth()).length;
  const allWords = history.reduce((s, r) => s + (r.wordCount || 0), 0);

  document.getElementById('profileReportsCount').textContent = history.length;

  const statsEl = document.getElementById('profileStats');
  if (statsEl) {
    statsEl.innerHTML = [
      {icon:'🤖', val:aiUsage, label:'طلبات AI', color:'#6c63ff'},
      {icon:'📅', val:thisMonth, label:'تقارير الشهر', color:'#00d4aa'},
      {icon:'✍️', val:allWords.toLocaleString('ar'), label:'كلمة كتبتها', color:'#f59e0b'},
    ].map(s => `
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(${s.color==='#6c63ff'?'108,99,255':s.color==='#00d4aa'?'0,212,170':'245,158,11'},0.2);border-radius:12px;padding:1rem;text-align:center">
        <div style="font-size:1.5rem;margin-bottom:0.3rem">${s.icon}</div>
        <div style="font-size:1.3rem;font-weight:900;color:${s.color}">${s.val}</div>
        <div style="font-size:0.7rem;color:var(--text-muted)">${s.label}</div>
      </div>`).join('');
  }
}

function updateAvatar(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const data = e.target.result;
    localStorage.setItem('mbrcst_user_avatar_' + (currentUser?.username || ''), data);
    const bigAvatar = document.getElementById('profileAvatarBig');
    if (bigAvatar) bigAvatar.innerHTML = `<img src="${data}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`;
    showToast('✅ تم تحديث الصورة', 'success');
  };
  reader.readAsDataURL(file);
}

function saveProfile() {
  const newName = (document.getElementById('editFullName') || {}).value?.trim();
  const newPass = (document.getElementById('editPassword') || {}).value?.trim();
  if (!newName) { showToast('أدخل الاسم', 'error'); return; }
  if (!currentUser) return;
  const users = getUsers();
  if (users[currentUser.username]) {
    users[currentUser.username].fullName = newName;
    if (newPass && newPass.length >= 6) users[currentUser.username].hash = btoa(newPass);
    saveUsers(users);
    currentUser.fullName = newName;
    const nameEls = document.querySelectorAll('.user-name, #userFullName, #sidebarUserName');
    nameEls.forEach(el => { if (el) el.textContent = newName; });
    showToast('✅ تم حفظ التغييرات', 'success');
    document.getElementById('editPassword').value = '';
  }
}

function clearAllData() {
  if (!confirm('سيتم حذف جميع التقارير والإعدادات. هل أنت متأكد؟')) return;
  ['mbrcst_history','mbrcst_branding','mbrcst_org_logo','mbrcst_schedules'].forEach(k => localStorage.removeItem(k));
  showToast('✅ تم مسح البيانات', 'success');
  closeProfilePanel();
}

function exportMyData() {
  const data = {
    history: JSON.parse(localStorage.getItem('mbrcst_history') || '[]'),
    branding: JSON.parse(localStorage.getItem('mbrcst_branding') || '{}'),
    schedules: JSON.parse(localStorage.getItem('mbrcst_schedules') || '[]'),
    exportDate: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `mbr-reports-backup-${new Date().toISOString().slice(0,10)}.json`; a.click();
  showToast('✅ تم تصدير بياناتك', 'success');
}

// ============================================================
// 10. THEME TOGGLE (Dark / Light)
// ============================================================
function toggleTheme() {
  const isDark = document.body.classList.toggle('light-mode');
  localStorage.setItem('mbrcst_theme', isDark ? 'light' : 'dark');
  const icon = document.getElementById('themeIcon');
  if (icon) icon.textContent = isDark ? '☀️' : '🌙';
  showToast(isDark ? '☀️ الوضع الفاتح' : '🌙 الوضع الداكن', 'success');
}

// Apply saved theme on load
(function() {
  const t = localStorage.getItem('mbrcst_theme');
  if (t === 'light') { document.body.classList.add('light-mode'); const i=document.getElementById('themeIcon'); if(i) i.textContent='☀️'; }
})();

// ============================================================
// 11. KEYBOARD SHORTCUTS
// ============================================================
function showShortcuts() {
  const p = document.getElementById('shortcutsPanel');
  if (p) { p.style.display = 'flex'; p.classList.add('open'); }
}
function closeShortcuts() {
  const p = document.getElementById('shortcutsPanel');
  if (p) { p.style.display = 'none'; p.classList.remove('open'); }
}

document.addEventListener('keydown', e => {
  const ctrl = e.ctrlKey || e.metaKey;
  if (e.key === 'Escape') {
    // Close any open overlay
    ['voicePanel','profileOverlay','pdfBrandingPanel','schedulePanel','reportsHistoryOverlay','compareOverlay','templatesOverlay'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.style.display !== 'none') { el.style.display = 'none'; }
    });
    closeShortcuts();
    closeShare?.();
    return;
  }
  if (e.key === '?' && !ctrl && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    showShortcuts(); return;
  }
  if (!ctrl) return;
  switch(e.key.toLowerCase()) {
    case 'n': e.preventDefault(); showSection('create'); break;
    case 'g': e.preventDefault(); document.getElementById('generateReportBtn')?.click(); break;
    case 's': e.preventDefault(); saveReportToHistory(
      (document.getElementById('reportTitle')||{}).value,
      getCurrentReportText(),
      (document.getElementById('reportTypeSelect')||{}).value
    ); showToast('✅ تم الحفظ', 'success'); break;
    case 'p': e.preventDefault(); showPdfPanel(); break;
    case 'e': e.preventDefault(); exportPowerPoint(); break;
    case 'k': e.preventDefault(); showReportsHistory(); setTimeout(()=>document.getElementById('historySearch')?.focus(),300); break;
    case 'm': e.preventDefault(); showVoicePanel(); break;
    case 'd': e.preventDefault(); showDashboard(); break;
    case 't': e.preventDefault(); toggleTheme(); break;
  }
});

// ============================================================
// 12. NOTIFICATION CENTER
// ============================================================
const NOTIFS_KEY = 'mbrcst_notifications';

function addNotification(title, body, type='info') {
  const notifs = JSON.parse(localStorage.getItem(NOTIFS_KEY) || '[]');
  notifs.unshift({ id: Date.now(), title, body, type, read: false, time: new Date().toISOString() });
  if (notifs.length > 50) notifs.pop();
  localStorage.setItem(NOTIFS_KEY, JSON.stringify(notifs));
  updateNotifBadge();
}

function updateNotifBadge() {
  const notifs = JSON.parse(localStorage.getItem(NOTIFS_KEY) || '[]');
  const unread = notifs.filter(n => !n.read).length;
  const badge = document.getElementById('notifBadge');
  if (badge) {
    badge.textContent = unread > 9 ? '9+' : unread;
    badge.style.display = unread > 0 ? 'flex' : 'none';
  }
}

function toggleNotifCenter() {
  const c = document.getElementById('notifCenter');
  if (!c) return;
  const isOpen = c.style.display !== 'none';
  c.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) { renderNotifications(); markAllRead(); }
}

function closeNotifCenter() {
  const c = document.getElementById('notifCenter');
  if (c) c.style.display = 'none';
}

function renderNotifications() {
  const list = document.getElementById('notifList');
  if (!list) return;
  const notifs = JSON.parse(localStorage.getItem(NOTIFS_KEY) || '[]');
  const icons = { info:'ℹ️', success:'✅', warning:'⚠️', ai:'🤖', report:'📊', schedule:'⏰' };
  if (!notifs.length) {
    list.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-muted);font-size:0.82rem">📭 لا توجد إشعارات</div>';
    return;
  }
  list.innerHTML = notifs.slice(0,20).map(n => {
    const t = new Date(n.time).toLocaleTimeString('ar-SA', {hour:'2-digit', minute:'2-digit'});
    const d = new Date(n.time).toLocaleDateString('ar-SA', {month:'short', day:'numeric'});
    return `<div style="padding:0.8rem 1.2rem;border-bottom:1px solid rgba(255,255,255,0.04);background:${n.read?'transparent':'rgba(108,99,255,0.05)'}">
      <div style="display:flex;gap:0.5rem;align-items:flex-start">
        <span style="font-size:1rem">${icons[n.type]||'🔔'}</span>
        <div style="flex:1">
          <div style="font-size:0.82rem;font-weight:700;color:#fff;margin-bottom:0.2rem">${n.title}</div>
          <div style="font-size:0.76rem;color:var(--text-muted)">${n.body}</div>
          <div style="font-size:0.68rem;color:#666;margin-top:0.3rem">${d} ${t}</div>
        </div>
      </div>
    </div>`;
  }).join('');
}

function markAllRead() {
  const notifs = JSON.parse(localStorage.getItem(NOTIFS_KEY) || '[]').map(n => ({...n, read:true}));
  localStorage.setItem(NOTIFS_KEY, JSON.stringify(notifs));
  updateNotifBadge();
}

// Override showToast to also add notifications for important events
const _origShowToast = typeof showToast === 'function' ? showToast : null;
window.addNotifFromToast = function(msg, type) {
  if (msg.startsWith('✅') || msg.startsWith('❌') || msg.startsWith('🔔')) {
    const typeMap = {'✅':'success','❌':'warning','🔔':'schedule'};
    const icon = msg.slice(0,2);
    addNotification(msg.replace(/^[✅❌🔔⏳]\s*/,'').split('.')[0], msg, typeMap[icon] || 'info');
  }
};

// Seed initial notifications
(function seedNotifs() {
  const key = 'mbrcst_notifs_seeded';
  if (localStorage.getItem(key)) { updateNotifBadge(); return; }
  addNotification('مرحباً بك في MBR Reports!', 'المنصة جاهزة بكل ميزاتها. ابدأ بإنشاء تقريرك الأول.', 'success');
  addNotification('تلميح: استخدم الميكروفون 🎙️', 'يمكنك التحدث لإنشاء التقرير مباشرة', 'info');
  addNotification('اختصارات لوحة المفاتيح', 'اضغط ? لعرض جميع الاختصارات المتاحة', 'info');
  localStorage.setItem(key, '1');
})();

// ============================================================
// 13. AI REPORT IMPROVEMENT
// ============================================================
async function improveCurrentReport(mode) {
  const content = getCurrentReportText();
  if (!content || content === 'لا يوجد محتوى تقرير حالياً') {
    showToast('❌ أنشئ تقريراً أولاً ثم حسّنه', 'error'); return;
  }
  const resultEl = document.getElementById('improveResult');
  if (resultEl) { resultEl.style.display = 'block'; resultEl.innerHTML = '<div class="ai-loading"><div class="spinner"></div><span>AI يعمل على تحسين تقريرك...</span></div>'; }
  const prompts = {
    style: `حسّن أسلوب هذا التقرير مع الحفاظ على نفس المحتوى:\n\n${content}\n\nالتحسينات المطلوبة:\n١. قوّي الجمل وأزل التكرار\n٢. استخدم مفردات أكثر احترافية\n٣. حسّن الانتقالات بين الفقرات\n٤. تأكد من الدقة اللغوية`,
    expand: `وسّع هذا التقرير وأضف تفاصيل أكثر:\n\n${content}\n\nالمطلوب:\n١. أضف بيانات وأرقام داعمة\n٢. وسّع كل نقطة رئيسية\n٣. أضف أمثلة عملية\n٤. عمّق التحليل والتوصيات`,
    executive: `حوّل هذا التقرير إلى ملخص تنفيذي احترافي:\n\n${content}\n\nالملخص يجب أن يحتوي:\n١. النقاط الرئيسية (٣-٥ نقاط)\n٢. الأرقام الأهم\n٣. القرارات المطلوبة\n٤. الخطوات التالية\nالمدة: ٣٠ ثانية قراءة`
  };
  const systems = {
    style: 'أنت محرر لغوي محترف متخصص في تحسين نصوص التقارير الرسمية.',
    expand: 'أنت كاتب تقارير خبير متخصص في إثراء المحتوى وإضافة العمق التحليلي.',
    executive: 'أنت مستشار تنفيذي متخصص في تلخيص التقارير للقيادة العليا.'
  };
  const result = await callAI(prompts[mode], systems[mode], { maxTokens: 2500 });
  if (result && resultEl) {
    resultEl.innerHTML = `<div class="ai-result-content" style="white-space:pre-wrap">${result}</div>
      <button onclick="applyImprovedReport(this)" data-content="${encodeURIComponent(result)}" class="ai-tool-btn" style="margin-top:0.5rem;padding:0.5rem 1rem;font-size:0.8rem">✅ تطبيق هذا التقرير</button>`;
    addNotification('تم تحسين التقرير ✨', `تم ${mode==='style'?'تحسين الأسلوب':mode==='expand'?'توسيع المحتوى':'إنشاء ملخص تنفيذي'} بنجاح`, 'ai');
    showToast('✅ تم تحسين التقرير!', 'success');
  }
}

function applyImprovedReport(btn) {
  const content = decodeURIComponent(btn.dataset.content);
  const outputEl = document.getElementById('reportOutput') || document.querySelector('.report-output-content');
  if (outputEl) outputEl.textContent = content;
  saveReportToHistory((document.getElementById('reportTitle')||{}).value || 'تقرير محسّن', content, 'general');
  showSection('create'); showToast('✅ تم تطبيق التقرير المحسّن', 'success');
}

// ============================================================
// 14. REAL-TIME WRITING STATS
// ============================================================
function updateWritingStats(text) {
  if (!text || text.length < 5) return;
  const bar = document.getElementById('writingStatsBar');
  if (!bar) return;
  bar.style.display = 'flex';
  const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const chars = text.length;
  const readMin = Math.max(1, Math.ceil(words / 200));
  let quality = 'ضعيف';
  let qualityColor = '#ef4444';
  if (words >= 500) { quality = 'ممتاز ⭐⭐⭐⭐⭐'; qualityColor = '#10b981'; }
  else if (words >= 300) { quality = 'جيد جداً ⭐⭐⭐⭐'; qualityColor = '#00d4aa'; }
  else if (words >= 150) { quality = 'جيد ⭐⭐⭐'; qualityColor = '#f59e0b'; }
  else if (words >= 50)  { quality = 'مقبول ⭐⭐'; qualityColor = '#f59e0b'; }
  const wEl = document.getElementById('statWords');
  const cEl = document.getElementById('statChars');
  const rEl = document.getElementById('statReadTime');
  const qEl = document.getElementById('statQuality');
  if (wEl) wEl.textContent = `📝 ${words.toLocaleString('ar')} كلمة`;
  if (cEl) cEl.textContent = `🔤 ${chars.toLocaleString('ar')} حرف`;
  if (rEl) rEl.textContent = `⏱️ ${readMin} دقيقة قراءة`;
  if (qEl) { qEl.textContent = `الجودة: ${quality}`; qEl.style.color = qualityColor; }
}

// Hook into any textarea with live stats
document.addEventListener('input', e => {
  if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
    const allText = Array.from(document.querySelectorAll('textarea')).map(t => t.value).join(' ');
    if (allText.length > 20) updateWritingStats(allText);
  }
});

// Also update after AI result
const origAiShowResult = typeof aiShowResult === 'function' ? aiShowResult : null;
function aiShowResultWithStats(elId, text) {
  if (origAiShowResult) origAiShowResult(elId, text);
  if (text) {
    updateWritingStats(text);
    addNotification('تقرير جاهز 📊', `تم إنشاء تقرير (${text.split(/\s+/).length} كلمة) بنجاح`, 'report');
  }
}

// ============================================================
// 15. GLOBAL SEARCH
// ============================================================
function openGlobalSearch() {
  const overlay = document.getElementById('globalSearchOverlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
  setTimeout(() => document.getElementById('globalSearchInput')?.focus(), 100);
}

function closeGlobalSearch() {
  const overlay = document.getElementById('globalSearchOverlay');
  if (overlay) overlay.style.display = 'none';
}

function runGlobalSearch(q) {
  const results = document.getElementById('globalSearchResults');
  if (!results) return;
  if (!q || q.length < 2) {
    results.innerHTML = '<div style="padding:1.5rem;text-align:center;color:var(--text-muted);font-size:0.82rem">ابدأ الكتابة للبحث...</div>';
    return;
  }
  const q_lower = q.toLowerCase();
  const allResults = [];

  // Search in report history
  const history = JSON.parse(localStorage.getItem('mbrcst_history') || '[]');
  history.filter(r => r.title.includes(q) || r.content.includes(q)).slice(0,5).forEach(r => {
    const idx = r.content.indexOf(q);
    const snippet = idx >= 0 ? '...' + r.content.substring(Math.max(0,idx-30), idx+80) + '...' : r.content.substring(0,100);
    allResults.push({ type:'report', icon:'📊', title:r.title, sub:snippet, action:`viewHistReport(${r.id})` });
  });

  // Search in templates
  TEMPLATES.filter(t => t.title.includes(q) || t.desc.includes(q)).slice(0,3).forEach(t => {
    allResults.push({ type:'template', icon:'📋', title:t.title, sub:t.desc, action:`applyTemplate('${t.id}')` });
  });

  // Quick actions
  const actions = [
    {k:'تقرير', icon:'✍️', title:'إنشاء تقرير جديد', sub:'الانتقال لصفحة إنشاء التقرير', action:"showSection('create')"},
    {k:'dashboard لوحة', icon:'📊', title:'فتح Dashboard', sub:'عرض الإحصائيات والرسوم البيانية', action:'showDashboard()'},
    {k:'pdf تصدير', icon:'📄', title:'تصدير PDF', sub:'تصدير التقرير الحالي كـ PDF', action:'showPdfPanel()'},
    {k:'voice صوت مساعد', icon:'🎙️', title:'المساعد الصوتي', sub:'إدخال التقرير بالصوت', action:'showVoicePanel()'},
    {k:'template قالب', icon:'📋', title:'مكتبة القوالب', sub:'20+ قالب جاهز', action:'showTemplates()'},
    {k:'ai tools أدوات', icon:'🤖', title:'أدوات الذكاء الاصطناعي', sub:'14 أداة AI متخصصة', action:"showSection('ai-tools')"},
  ].filter(a => a.k.split(' ').some(k => q_lower.includes(k) || k.includes(q_lower)));
  actions.forEach(a => allResults.push({type:'action', icon:a.icon, title:a.title, sub:a.sub, action:a.action}));

  if (!allResults.length) {
    results.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--text-muted)">لا نتائج لـ "${q}"</div>`; return;
  }

  const typeLabels = {report:'التقارير المحفوظة', template:'القوالب', action:'إجراءات سريعة'};
  const groups = {};
  allResults.forEach(r => { if (!groups[r.type]) groups[r.type]=[]; groups[r.type].push(r); });

  results.innerHTML = Object.entries(groups).map(([type, items]) => `
    <div style="padding:0.4rem 1rem;font-size:0.68rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-top:0.3rem">${typeLabels[type]||type}</div>
    ${items.map(r => `
      <div onclick="${r.action};closeGlobalSearch()" style="display:flex;gap:0.7rem;align-items:flex-start;padding:0.7rem 1rem;cursor:pointer;transition:background 0.1s;border-radius:8px;margin:0 0.4rem"
        onmouseover="this.style.background='rgba(108,99,255,0.08)'" onmouseout="this.style.background='transparent'">
        <span style="font-size:1.1rem;padding-top:0.1rem">${r.icon}</span>
        <div>
          <div style="font-size:0.84rem;font-weight:700;color:#fff">${r.title}</div>
          <div style="font-size:0.73rem;color:var(--text-muted);margin-top:0.15rem;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden">${r.sub}</div>
        </div>
      </div>`).join('')}
  `).join('');
}

// Ctrl+Shift+F to open global search
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'f') {
    e.preventDefault(); openGlobalSearch();
  }
});

// Close global search on Escape (supplement existing handler)
document.getElementById('globalSearchInput')?.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeGlobalSearch();
});

// Init badge on load
document.addEventListener('DOMContentLoaded', updateNotifBadge);
updateNotifBadge();

// ============================================================
// 16. DRAG & DROP FILE UPLOAD + ANALYSIS
// ============================================================
function dropZoneOver(e) {
  e.preventDefault();
  const dz = document.getElementById('dropZone');
  if (dz) { dz.style.borderColor = '#6c63ff'; dz.style.background = 'rgba(108,99,255,0.08)'; }
}
function dropZoneLeave(e) {
  const dz = document.getElementById('dropZone');
  if (dz) { dz.style.borderColor = 'rgba(108,99,255,0.35)'; dz.style.background = 'rgba(108,99,255,0.03)'; }
}
function handleFileDrop(e) {
  e.preventDefault();
  dropZoneLeave(e);
  const file = e.dataTransfer.files[0];
  if (file) processDroppedFile(file);
}
function handleFileInputChange(input) {
  const file = input.files[0];
  if (file) processDroppedFile(file);
}

async function processDroppedFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const resultEl = document.getElementById('dropResult');
  if (!resultEl) return;
  resultEl.style.display = 'block';
  resultEl.innerHTML = `<div class="ai-loading"><div class="spinner"></div><span>⏳ يحلل AI ملف: ${file.name}...</span></div>`;
  const dz = document.getElementById('dropZone');
  if (dz) dz.querySelector('div').textContent = `📎 ${file.name} (${(file.size/1024).toFixed(0)} KB)`;

  try {
    // Images → OCR via AI Vision
    if (['png','jpg','jpeg','gif','webp'].includes(ext)) {
      const reader = new FileReader();
      reader.onload = async e => {
        const base64 = e.target.result.split(',')[1];
        const key = localStorage.getItem('mbrcst_openai_key') || '';
        if (!key) { resultEl.innerHTML = '<div style="color:#ef4444;padding:1rem">❌ أضف مفتاح OpenAI أولاً</div>'; return; }
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
          body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{
            role: 'user', content: [
              { type: 'text', text: 'حلّل هذه الصورة واستخرج منها تقريراً احترافياً بالعربية.' },
              { type: 'image_url', image_url: { url: `data:image/${ext};base64,${base64}` } }
            ]
          }], max_tokens: 1500 })
        });
        const data = await res.json();
        const report = data.choices?.[0]?.message?.content || '';
        if (report) { showDropResult(resultEl, report, file.name); }
      };
      reader.readAsDataURL(file);
      return;
    }

    // Text files (CSV, TXT, JSON)
    if (['csv','txt','json'].includes(ext)) {
      const text = await file.text();
      const sample = text.substring(0, 3000);
      const result = await callAI(
        `حلّل هذه البيانات من ملف ${ext.toUpperCase()} وأنشئ تقريراً احترافياً:\n\n${sample}`,
        'أنت محلل بيانات متخصص في إنشاء تقارير من ملفات البيانات المختلفة.'
      );
      if (result) showDropResult(resultEl, result, file.name);
      return;
    }

    // Excel, Word, PDF (read as text best we can)
    if (['xlsx','xls','doc','docx','pdf'].includes(ext)) {
      // For xlsx, use the Sheets API approach if available; otherwise prompt user
      const reader = new FileReader();
      reader.onload = async e => {
        let text = '';
        // Try to extract some text (works better for .doc/.txt embedded in docx)
        try {
          const arr = new Uint8Array(e.target.result);
          text = String.fromCharCode(...arr.slice(0, 5000)).replace(/[^\u0020-\u007E\u0600-\u06FF\n\r\t ]/g, ' ').replace(/\s{3,}/g,' ');
        } catch {}
        if (text.length < 50) {
          resultEl.innerHTML = `<div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:10px;padding:1rem;font-size:0.82rem;color:#f59e0b">
            ⚠️ ملفات ${ext.toUpperCase()} تحتاج معالجة خاصة.<br>
            💡 <strong>الحل:</strong> افتح الملف وانسخ النص ثم الصقه في المحرر، أو حوّله لـ CSV وارفعه مجدداً.
          </div>`;
          return;
        }
        const result = await callAI(`حلّل هذا المحتوى من ملف ${ext.toUpperCase()} وأنشئ تقريراً:\n${text}`, 'أنت محلل بيانات احترافي.');
        if (result) showDropResult(resultEl, result, file.name);
      };
      reader.readAsArrayBuffer(file);
    }
  } catch(err) {
    resultEl.innerHTML = `<div style="color:#ef4444;padding:1rem">❌ خطأ في قراءة الملف: ${err.message}</div>`;
  }
}

function showDropResult(el, text, fileName) {
  el.innerHTML = `
    <div style="background:#1a1a2e;border:1px solid rgba(108,99,255,0.2);border-radius:12px;padding:1rem;margin-top:0.5rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.7rem">
        <span style="color:#00d4aa;font-size:0.78rem;font-weight:700">✅ تم تحليل: ${fileName}</span>
        <button onclick="applyDropResult(this)" data-text="${encodeURIComponent(text)}" class="ai-tool-btn" style="padding:0.3rem 0.8rem;font-size:0.75rem">📋 نقل للمحرر</button>
      </div>
      <div style="white-space:pre-wrap;color:var(--text-secondary);font-size:0.78rem;line-height:1.7;max-height:200px;overflow:auto">${text.substring(0,800)}${text.length>800?'...':''}</div>
    </div>`;
  saveReportToHistory('تحليل: ' + fileName, text, 'general');
  showToast(`✅ تم تحليل ${fileName}`, 'success');
}

function applyDropResult(btn) {
  const text = decodeURIComponent(btn.dataset.text);
  const ta = document.getElementById('reportNotes') || document.getElementById('reportObjectives') || document.querySelector('textarea');
  if (ta) { ta.value = text; updateWritingStats(text); }
  showToast('✅ تم نقل النتيجة للمحرر', 'success');
}

// ============================================================
// 17. PROMPTS LIBRARY
// ============================================================
const BUILTIN_PROMPTS = [
  { id:'p1', title:'تحليل مبيعات', category:'analyze', body:'حلّل هذه بيانات المبيعات واكتب تقريراً يشمل: الاتجاهات الرئيسية، أعلى المنتجات، مقارنة الفترات، والتوصيات:', icon:'📈' },
  { id:'p2', title:'تقرير موارد بشرية', category:'write', body:'اكتب تقرير موارد بشرية شهرياً يشمل: حضور الموظفين، الإنجازات، التحديات، التدريبات، والتوصيات. بناءً على المعلومات التالية:', icon:'👥' },
  { id:'p3', title:'ملخص اجتماع', category:'summarize', body:'حوّل محضر الاجتماع التالي إلى ملخص تنفيذي يشمل: أبرز النقاط، القرارات المتخذة، والإجراءات المطلوبة:', icon:'📝' },
  { id:'p4', title:'تقرير مشروع', category:'write', body:'اكتب تقرير حالة مشروع احترافياً يشمل: نسبة الإنجاز، المهام المكتملة، التحديات، المخاطر، والخطوات القادمة:', icon:'🚀' },
  { id:'p5', title:'تحليل بيانات Excel', category:'analyze', body:'حلّل هذه البيانات المستخرجة من Excel وأعطني: أبرز الأرقام، الاتجاهات، الشذوذات، والتوصيات الإدارية:', icon:'📊' },
  { id:'p6', title:'تقرير رقمي / IT', category:'write', body:'اكتب تقرير تقنية المعلومات يشمل: أداء الأنظمة، الحوادث والاستجابة، المشاريع الجارية، خطة الصيانة القادمة:', icon:'💻' },
];

function showPromptsLib() {
  const overlay = document.getElementById('promptsLibOverlay');
  if (!overlay) return;
  overlay.style.display = 'block';
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('navPrompts')?.classList.add('active');
  renderPromptsGrid();
}
function closePromptsLib() {
  document.getElementById('promptsLibOverlay').style.display = 'none';
  document.getElementById('navPrompts')?.classList.remove('active');
}

function savePrompt() {
  const title = (document.getElementById('promptTitle')||{}).value?.trim();
  const body = (document.getElementById('promptBody')||{}).value?.trim();
  const cat = (document.getElementById('promptCategory')||{}).value || 'other';
  if (!title || !body) { showToast('أدخل العنوان والنص', 'error'); return; }
  const prompts = JSON.parse(localStorage.getItem('mbrcst_custom_prompts') || '[]');
  prompts.unshift({ id: 'u_' + Date.now(), title, body, category: cat, icon: '💾', custom: true });
  localStorage.setItem('mbrcst_custom_prompts', JSON.stringify(prompts));
  document.getElementById('promptTitle').value = '';
  document.getElementById('promptBody').value = '';
  renderPromptsGrid();
  showToast('✅ تم حفظ الـ Prompt', 'success');
}

function renderPromptsGrid() {
  const grid = document.getElementById('promptsGrid');
  if (!grid) return;
  const custom = JSON.parse(localStorage.getItem('mbrcst_custom_prompts') || '[]');
  const all = [...custom, ...BUILTIN_PROMPTS];
  const catColors = { analyze:'#0ea5e9', write:'#6c63ff', improve:'#f59e0b', summarize:'#10b981', other:'#a855f7' };
  const catNames = { analyze:'تحليل', write:'كتابة', improve:'تحسين', summarize:'تلخيص', other:'أخرى' };
  grid.innerHTML = all.map(p => `
    <div style="background:#1a1a2e;border:1px solid rgba(${p.custom?'0,212,170':'108,99,255'},0.2);border-radius:12px;padding:1rem;cursor:pointer;transition:all 0.2s"
      onmouseover="this.style.borderColor='rgba(108,99,255,0.5)'" onmouseout="this.style.borderColor='rgba(${p.custom?'0,212,170':'108,99,255'},0.2)'">
      <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem">
        <span style="font-size:1.1rem">${p.icon}</span>
        <div style="display:flex;gap:0.3rem;align-items:center">
          <span style="font-size:0.65rem;background:${catColors[p.category]||'#6c63ff'}22;color:${catColors[p.category]||'#6c63ff'};border-radius:4px;padding:1px 6px;font-weight:700">${catNames[p.category]||p.category}</span>
          ${p.custom?`<button onclick="deletePrompt('${p.id}',event)" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:0.75rem;opacity:0.6" title="حذف">🗑️</button>`:''}
        </div>
      </div>
      <div style="font-weight:800;color:#fff;font-size:0.82rem;margin-bottom:0.4rem">${p.title}</div>
      <div style="font-size:0.72rem;color:var(--text-muted);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${p.body.substring(0,80)}...</div>
      <button onclick="usePrompt('${p.id}')" class="ai-tool-btn" style="margin-top:0.7rem;padding:0.4rem;font-size:0.75rem;width:100%">⚡ استخدم هذا الـ Prompt</button>
    </div>`).join('');
}

function deletePrompt(id, e) {
  e.stopPropagation();
  const prompts = JSON.parse(localStorage.getItem('mbrcst_custom_prompts') || '[]').filter(p => p.id !== id);
  localStorage.setItem('mbrcst_custom_prompts', JSON.stringify(prompts));
  renderPromptsGrid();
  showToast('تم الحذف', 'success');
}

function usePrompt(id) {
  const custom = JSON.parse(localStorage.getItem('mbrcst_custom_prompts') || '[]');
  const p = [...custom, ...BUILTIN_PROMPTS].find(x => x.id === id);
  if (!p) return;
  const ta = document.getElementById('reportNotes') || document.querySelector('.ai-custom-prompt textarea') || document.createElement('textarea');
  if (ta) ta.value = p.body;
  closePromptsLib();
  showSection('ai-tools');
  const customArea = document.getElementById('customPromptInput');
  if (customArea) { customArea.value = p.body; customArea.focus(); }
  showToast(`✅ تم تحميل Prompt: ${p.title}`, 'success');
}

// ============================================================
// 18. QUICK REPORT GENERATOR
// ============================================================
let quickReportType = 'شهرية';

function showQuickReport() {
  document.getElementById('quickReportOverlay').style.display = 'block';
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('navQuickReport')?.classList.add('active');
}
function closeQuickReport() {
  document.getElementById('quickReportOverlay').style.display = 'none';
  document.getElementById('navQuickReport')?.classList.remove('active');
}
function selectQRType(btn, type) {
  quickReportType = type;
  document.querySelectorAll('.qr-type-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

async function generateQuickReport(mode='full') {
  const q1 = (document.getElementById('qrQ1')||{}).value || '';
  const q2 = (document.getElementById('qrQ2')||{}).value || '';
  const q3 = (document.getElementById('qrQ3')||{}).value || '';
  const q4 = (document.getElementById('qrQ4')||{}).value || '';
  const resultEl = document.getElementById('quickReportResult');
  if (!resultEl) return;
  resultEl.style.display = 'block';
  resultEl.innerHTML = '<div class="ai-loading"><div class="spinner"></div><span>⚡ AI يولّد التقرير...</span></div>';

  const fullPrompt = mode === 'short'
    ? `اكتب ملخصاً تنفيذياً قصيراً (فقرة واحدة أو نقاط) للمعلومات التالية:\nالنوع: تقرير ${quickReportType}\nالمشروع/الفترة: ${q1}\nالإنجازات: ${q2}\nالتحديات: ${q3}\nالخطوات القادمة: ${q4}\nيجب أن يكون الملخص لا يزيد عن 150 كلمة.`
    : `اكتب تقريراً ${quickReportType} احترافياً كاملاً بالعربية بناءً على:\nالمشروع/الفترة: ${q1 || 'غير محدد'}\nأبرز الإنجازات: ${q2 || 'غير محدد'}\nالتحديات: ${q3 || 'لا يوجد'}\nالخطوات القادمة: ${q4 || 'تحت المتابعة'}\n\nالهيكل المطلوب:\n١. المقدمة\n٢. الملخص التنفيذي\n٣. الإنجازات والنتائج\n٤. التحديات والحلول\n٥. الخطة المقبلة\n٦. التوصيات\n٧. الخاتمة`;

  const result = await callAI(fullPrompt, 'أنت كاتب تقارير احترافي متخصص في إنشاء تقارير رسمية للمؤسسات.');
  if (result && resultEl) {
    resultEl.innerHTML = `
      <div style="background:#0a0a1a;border:1px solid rgba(0,212,170,0.2);border-radius:12px;padding:1.2rem;max-height:350px;overflow:auto">
        <div style="white-space:pre-wrap;color:var(--text-secondary);font-size:0.82rem;line-height:1.8">${result}</div>
      </div>
      <div style="display:flex;gap:0.5rem;margin-top:0.7rem;flex-wrap:wrap">
        <button onclick="applyQuickReport(this)" data-text="${encodeURIComponent(result)}" data-title="${encodeURIComponent('تقرير '+quickReportType+' - '+(q1||''))}" class="ai-tool-btn" style="flex:1;padding:0.5rem">📋 نقل للمحرر</button>
        <button onclick="showPdfPanel()" class="ai-tool-btn" style="flex:1;padding:0.5rem;background:linear-gradient(135deg,#ef4444,#b91c1c)">📄 PDF</button>
        <button onclick="exportPowerPoint()" class="ai-tool-btn" style="flex:1;padding:0.5rem;background:linear-gradient(135deg,#ea580c,#c2410c)">🎯 PPT</button>
      </div>`;
    showToast('✅ تم توليد التقرير!', 'success');
    updateNotifBadge && updateNotifBadge();
    addNotification && addNotification('تقرير سريع جاهز ⚡', `تقرير ${quickReportType} - ${q1||''}`, 'report');
  }
}

function applyQuickReport(btn) {
  const text = decodeURIComponent(btn.dataset.text);
  const title = decodeURIComponent(btn.dataset.title);
  const titleEl = document.getElementById('reportTitle');
  if (titleEl) titleEl.value = title;
  saveReportToHistory(title, text, 'general');
  closeQuickReport();
  showSection('create');
  showToast('✅ تم نقل التقرير للمحرر', 'success');
  updateWritingStats(text);
}

// ============================================================
// 19. PRINT-OPTIMIZED VIEW
// ============================================================
function printReport() {
  const branding = JSON.parse(localStorage.getItem('mbrcst_branding') || '{}');
  const content = getCurrentReportText();
  const title = (document.getElementById('reportTitle')||{}).value || 'التقرير';
  const now = new Date().toLocaleDateString('ar-SA', {year:'numeric', month:'long', day:'numeric'});
  const logoHtml = orgLogoDataUrl ? `<img src="${orgLogoDataUrl}" style="max-height:70px;max-width:140px;object-fit:contain">` : '';
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl">
<head><meta charset="utf-8"><title>${title}</title>
<style>
  @page { margin: 2cm; }
  * { box-sizing: border-box; }
  body { font-family: 'Arial', 'Tahoma', sans-serif; font-size: 11pt; line-height: 1.8; color: #1a1a2e; direction: rtl; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid ${branding.color||'#6c63ff'}; padding-bottom: 1rem; margin-bottom: 1.5rem; }
  .org-name { font-size: 14pt; font-weight: 900; color: ${branding.color||'#6c63ff'}; }
  .org-dept { font-size: 9pt; color: #666; margin-top: 3px; }
  h1 { font-size: 18pt; text-align: center; color: ${branding.color||'#6c63ff'}; margin: 1rem 0; }
  .meta { display: flex; gap: 2rem; background: #f8f8ff; padding: 0.5rem 1rem; border-radius: 6px; font-size: 9pt; color: #555; margin-bottom: 1rem; }
  .body { white-space: pre-wrap; font-size: 11pt; line-height: 2; }
  .footer { margin-top: 3rem; border-top: 1px solid #ddd; padding-top: 0.7rem; text-align: center; font-size: 8pt; color: #888; }
  @media print { body { -webkit-print-color-adjust: exact; } }
</style></head><body>
<div class="header">
  ${logoHtml}
  <div style="text-align:right">
    <div class="org-name">${branding.name||'MBR Reports'}</div>
    ${branding.dept?`<div class="org-dept">${branding.dept}</div>`:''}
  </div>
</div>
<h1>${title}</h1>
<div class="meta">
  <span>📅 ${now}</span>
  <span>👤 ${(currentUser||{}).fullName||''}</span>
</div>
<div class="body">${content}</div>
<div class="footer">MBR Reports — ${window.location.hostname} | صفحة 1</div>
<script>window.onload=()=>{window.print();}<\/script>
</body></html>`);
  win.document.close();
}

// Override Ctrl+P
document.addEventListener('keydown', e => {
  if ((e.ctrlKey||e.metaKey) && e.key === 'p') {
    const content = getCurrentReportText();
    if (content && content !== 'لا يوجد محتوى تقرير حالياً') {
      e.preventDefault(); printReport();
    }
  }
});

// ============================================================
// 20. CHARTS GENERATOR
// ============================================================
let mainChart = null;
let currentChartType = 'bar';
const CHART_COLORS = ['#6c63ff','#00d4aa','#f59e0b','#ef4444','#10b981','#0ea5e9','#a855f7','#ec4899'];

function showChartsPanel() {
  document.getElementById('chartsOverlay').style.display = 'block';
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('navCharts')?.classList.add('active');
  setTimeout(initDefaultChart, 100);
}
function closeChartsPanel() {
  document.getElementById('chartsOverlay').style.display = 'none';
  document.getElementById('navCharts')?.classList.remove('active');
}

function selectChartType(btn, type) {
  currentChartType = type;
  document.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  liveUpdateChart();
}

function initDefaultChart() {
  document.getElementById('chartTitle').value = 'أداء الإدارات - الربع الأول';
  document.getElementById('chartLabels').value = 'يناير, فبراير, مارس, أبريل';
  document.getElementById('chartData').value = '85, 92, 78, 96';
  document.getElementById('chartData2').value = '70, 80, 65, 88';
  document.getElementById('chartLabel2').value = 'العام الماضي';
  liveUpdateChart();
}

function loadChartSample(type) {
  const samples = {
    sales: { title:'مبيعات 2025', labels:'Q1, Q2, Q3, Q4', data:'450000, 520000, 480000, 610000', data2:'380000, 410000, 430000, 520000', label2:'2024' },
    kpi:   { title:'مؤشرات الأداء', labels:'الجودة, الكفاءة, رضا العملاء, الابتكار, التسليم', data:'88, 92, 85, 78, 94', data2:'', label2:'' },
    dept:  { title:'إنجازات الأقسام', labels:'المالية, الموارد البشرية, التشغيل, التقنية, التسويق', data:'90, 75, 85, 95, 80', data2:'', label2:'' },
    budget:{ title:'توزيع الميزانية', labels:'التشغيل, الموارد البشرية, التقنية, التسويق, البنية التحتية', data:'35, 25, 20, 12, 8', data2:'', label2:'' },
  };
  const s = samples[type];
  if (!s) return;
  document.getElementById('chartTitle').value = s.title;
  document.getElementById('chartLabels').value = s.labels;
  document.getElementById('chartData').value = s.data;
  document.getElementById('chartData2').value = s.data2;
  document.getElementById('chartLabel2').value = s.label2;
  if (type === 'budget') { currentChartType = 'pie'; document.querySelectorAll('.chart-type-btn').forEach((b,i)=>{ if(b.dataset.type==='pie') b.classList.add('active'); else b.classList.remove('active'); }); }
  else if (type === 'kpi') { currentChartType = 'radar'; document.querySelectorAll('.chart-type-btn').forEach(b=>{ if(b.dataset.type==='radar') b.classList.add('active'); else b.classList.remove('active'); }); }
  liveUpdateChart();
}

function liveUpdateChart() {
  const title = document.getElementById('chartTitle')?.value || '';
  const labelsRaw = document.getElementById('chartLabels')?.value || '';
  const dataRaw = document.getElementById('chartData')?.value || '';
  const data2Raw = document.getElementById('chartData2')?.value || '';
  const label2 = document.getElementById('chartLabel2')?.value || 'السلسلة الثانية';
  const labels = labelsRaw.split(',').map(s => s.trim()).filter(Boolean);
  const data1 = dataRaw.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
  const data2 = data2Raw.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
  if (!labels.length || !data1.length) return;
  const canvas = document.getElementById('mainChartCanvas');
  if (!canvas || !window.Chart) return;
  if (mainChart) mainChart.destroy();
  const isPie = ['pie','doughnut'].includes(currentChartType);
  const datasets = [{
    label: title || 'البيانات',
    data: data1,
    backgroundColor: isPie ? CHART_COLORS.slice(0, data1.length) : CHART_COLORS[0] + 'cc',
    borderColor: isPie ? CHART_COLORS.slice(0, data1.length) : CHART_COLORS[0],
    borderWidth: 2, borderRadius: currentChartType === 'bar' ? 6 : 0,
    fill: currentChartType === 'line' ? false : undefined,
    tension: 0.4,
  }];
  if (data2.length && !isPie) {
    datasets.push({ label: label2, data: data2, backgroundColor: CHART_COLORS[1] + 'aa', borderColor: CHART_COLORS[1], borderWidth: 2, borderRadius: currentChartType === 'bar' ? 6 : 0, tension: 0.4 });
  }
  mainChart = new Chart(canvas, {
    type: currentChartType,
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: {
        legend: { display: true, position: 'top', labels: { color: '#1a1a2e', font: { family: 'Arial', size: 11 } } },
        title: { display: !!title, text: title, color: '#1a1a2e', font: { family: 'Arial', size: 13, weight: 'bold' } }
      },
      scales: isPie || currentChartType === 'radar' ? {} : {
        x: { ticks: { color: '#444', font: { family: 'Arial' } }, grid: { color: '#eee' } },
        y: { ticks: { color: '#444', font: { family: 'Arial' } }, grid: { color: '#eee' } }
      }
    }
  });
}

function downloadChart() {
  const canvas = document.getElementById('mainChartCanvas');
  if (!canvas) return;
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png', 1.0);
  a.download = `chart-${Date.now()}.png`; a.click();
  showToast('✅ تم تنزيل الرسم البياني', 'success');
}

function addChartToReport() {
  const canvas = document.getElementById('mainChartCanvas');
  if (!canvas || !mainChart) return;
  const imgData = canvas.toDataURL('image/png', 0.9);
  const title = document.getElementById('chartTitle')?.value || 'رسم بياني';
  const ta = document.querySelector('textarea') || document.getElementById('reportNotes');
  if (ta) { ta.value += `\n\n[رسم بياني: ${title}]\n`; }
  // Store chart for PDF
  localStorage.setItem('mbrcst_last_chart', JSON.stringify({ img: imgData, title }));
  closeChartsPanel();
  showToast(`✅ تم إضافة "${title}" للتقرير`, 'success');
}

async function aiAnalyzeChart() {
  const labels = document.getElementById('chartLabels')?.value || '';
  const data1 = document.getElementById('chartData')?.value || '';
  const title = document.getElementById('chartTitle')?.value || 'البيانات';
  const resultEl = document.getElementById('chartAnalysis');
  if (!resultEl) return;
  resultEl.style.display = 'block';
  resultEl.innerHTML = '<div class="ai-loading" style="justify-content:flex-start"><div class="spinner"></div><span style="font-size:0.78rem">AI يحلل البيانات...</span></div>';
  const result = await callAI(
    `حلّل هذه البيانات من رسم بياني:\nالعنوان: ${title}\nالبيانات: ${labels} → ${data1}\n\nالمطلوب:\n١. أبرز الاتجاه العام\n٢. أعلى وأدنى قيمة وسببها المحتمل\n٣. التوصية للإدارة\nاجعل إجابتك مختصرة (٣-٤ جمل).`,
    'أنت محلل بيانات موجز ومحترف.'
  );
  if (result) resultEl.innerHTML = `<div style="font-size:0.78rem;color:var(--text-secondary);line-height:1.7">${result}</div>`;
}

// ============================================================
// 21. EMAIL DIRECT SEND (EmailJS + Fallback)
// ============================================================
function showEmailPanel() {
  const overlay = document.getElementById('emailPanel');
  if (!overlay) return;
  overlay.style.display = 'block';
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('navEmail')?.classList.add('active');
  // Pre-fill
  const cfg = JSON.parse(localStorage.getItem('mbrcst_emailjs_cfg') || '{}');
  if (cfg.publicKey) document.getElementById('ejPublicKey').value = cfg.publicKey;
  if (cfg.serviceId) document.getElementById('ejServiceId').value = cfg.serviceId;
  if (cfg.templateId) document.getElementById('ejTemplateId').value = cfg.templateId;
  const title = (document.getElementById('reportTitle') || {}).value || 'التقرير الدوري';
  const subjEl = document.getElementById('emailSubject');
  if (subjEl) subjEl.value = `تقرير: ${title}`;
  const bodyEl = document.getElementById('emailBody');
  if (bodyEl && !bodyEl.value) bodyEl.value = `السلام عليكم،\n\nأرجو الاطلاع على التقرير المرفق.\n\nمع التحية،\n${(currentUser || {}).fullName || ''}`;
}

function closeEmailPanel() {
  document.getElementById('emailPanel').style.display = 'none';
  document.getElementById('navEmail')?.classList.remove('active');
}

function saveEmailJSConfig() {
  const cfg = {
    publicKey: (document.getElementById('ejPublicKey')||{}).value?.trim(),
    serviceId: (document.getElementById('ejServiceId')||{}).value?.trim(),
    templateId: (document.getElementById('ejTemplateId')||{}).value?.trim(),
  };
  if (!cfg.publicKey || !cfg.serviceId || !cfg.templateId) { showToast('أدخل جميع بيانات EmailJS', 'error'); return; }
  localStorage.setItem('mbrcst_emailjs_cfg', JSON.stringify(cfg));
  if (window.emailjs) emailjs.init(cfg.publicKey);
  showToast('✅ تم حفظ إعدادات EmailJS', 'success');
  document.getElementById('emailjsSetup').style.opacity = '0.5';
}

async function sendEmailJS() {
  const cfg = JSON.parse(localStorage.getItem('mbrcst_emailjs_cfg') || '{}');
  const to = (document.getElementById('emailTo')||{}).value?.trim();
  const subject = (document.getElementById('emailSubject')||{}).value?.trim();
  const body = (document.getElementById('emailBody')||{}).value?.trim();
  const reportContent = getCurrentReportText();
  const statusEl = document.getElementById('emailSendStatus');

  if (!to) { showToast('أدخل بريد المستقبِل', 'error'); return; }
  if (!cfg.publicKey || !cfg.serviceId || !cfg.templateId) {
    showToast('⚙️ أدخل إعدادات EmailJS أولاً', 'error'); return;
  }

  if (statusEl) { statusEl.style.display = 'block'; statusEl.innerHTML = '<div class="ai-loading"><div class="spinner"></div><span>⏳ جارٍ الإرسال...</span></div>'; }

  try {
    if (window.emailjs) emailjs.init(cfg.publicKey);
    else throw new Error('EmailJS not loaded');
    await emailjs.send(cfg.serviceId, cfg.templateId, {
      to_email: to,
      to_name: to,
      from_name: (currentUser||{}).fullName || 'MBR Reports',
      subject, message: body,
      report_content: reportContent.substring(0, 5000),
      reply_to: (currentUser||{}).username || '',
    });
    if (statusEl) statusEl.innerHTML = '<div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:10px;padding:0.8rem;color:#10b981;font-size:0.82rem">✅ تم إرسال التقرير بنجاح!</div>';
    showToast('✅ تم الإرسال بنجاح!', 'success');
    addNotification('تم إرسال التقرير 📧', `إلى: ${to}`, 'success');
  } catch(err) {
    if (statusEl) statusEl.innerHTML = `<div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:10px;padding:0.8rem;color:#ef4444;font-size:0.82rem">❌ فشل الإرسال. جرّب "فتح تطبيق البريد" بدلاً.</div>`;
    showToast('❌ فشل الإرسال — جرّب البديل', 'error');
  }
}

function sendEmailFallback() {
  const to = (document.getElementById('emailTo')||{}).value?.trim() || '';
  const subject = (document.getElementById('emailSubject')||{}).value?.trim() || 'تقرير';
  const body = (document.getElementById('emailBody')||{}).value?.trim() || '';
  const report = getCurrentReportText().substring(0, 2000);
  const fullBody = `${body}\n\n--- محتوى التقرير ---\n${report}`;
  window.open(`mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullBody)}`);
  showToast('✅ تم فتح تطبيق البريد', 'success');
}

// ============================================================
// 22. MULTI-LANGUAGE UI (Arabic ↔ English)
// ============================================================
let currentLang = localStorage.getItem('mbrcst_lang') || 'ar';

const TRANSLATIONS = {
  ar: {
    charts: 'رسوم بيانية', send: 'إرسال', chartsTitle: '📈 مولّد الرسوم البيانية',
    chartsSubtitle: 'أدخل بياناتك واحصل على رسم بياني فوري',
    newReport: '+ تقرير جديد', generate: 'توليد بـ AI', save: 'حفظ',
    'ai-tools': 'أدوات AI', dashboard: 'Dashboard', templates: 'قوالب',
    history: 'المكتبة', voice: 'مساعد صوتي', profile: 'ملفي',
  },
  en: {
    charts: 'Charts', send: 'Send', chartsTitle: '📈 Charts Generator',
    chartsSubtitle: 'Enter your data and get instant visual charts',
    newReport: '+ New Report', generate: 'Generate with AI', save: 'Save',
    'ai-tools': 'AI Tools', dashboard: 'Dashboard', templates: 'Templates',
    history: 'Library', voice: 'Voice', profile: 'Profile',
  }
};

function toggleLanguage() {
  currentLang = currentLang === 'ar' ? 'en' : 'ar';
  localStorage.setItem('mbrcst_lang', currentLang);
  applyLanguage();
}

function applyLanguage() {
  const isAr = currentLang === 'ar';
  document.documentElement.lang = currentLang;
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  // Update all i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const val = TRANSLATIONS[currentLang]?.[key];
    if (val) el.textContent = val;
  });
  // Update nav labels
  const langIcon = document.getElementById('langIcon');
  const langLabel = document.getElementById('langLabel');
  if (langIcon) langIcon.textContent = '🌐';
  if (langLabel) langLabel.textContent = isAr ? 'EN' : 'عر';
  // Font
  document.documentElement.style.fontFamily = isAr ? "var(--font)" : "'Inter', 'Arial', sans-serif";
  showToast(isAr ? '🌐 اللغة: العربية' : '🌐 Language: English', 'success');
}

// Apply on load
applyLanguage();

// Init charts on panel open (Chart.js check)
(function waitForChart() {
  if (!window.Chart) { setTimeout(waitForChart, 500); return; }
})();

// ============================================================
// 23. REPORT TAGS/LABELS
// ============================================================
const TAGS = [
  {id:'urgent', label:'عاجل', color:'#ef4444'},
  {id:'approved', label:'موافَق عليه', color:'#10b981'},
  {id:'draft', label:'مسودة', color:'#f59e0b'},
  {id:'review', label:'قيد المراجعة', color:'#0ea5e9'},
  {id:'archived', label:'مؤرشف', color:'#6b7280'},
  {id:'important', label:'مهم', color:'#8b5cf6'},
];

function addTagToReport(reportId, tagId) {
  const history = JSON.parse(localStorage.getItem('mbrcst_history') || '[]');
  const idx = history.findIndex(r => r.id === reportId);
  if (idx < 0) return;
  if (!history[idx].tags) history[idx].tags = [];
  if (!history[idx].tags.includes(tagId)) history[idx].tags.push(tagId);
  localStorage.setItem('mbrcst_history', JSON.stringify(history));
}

function removeTagFromReport(reportId, tagId) {
  const history = JSON.parse(localStorage.getItem('mbrcst_history') || '[]');
  const idx = history.findIndex(r => r.id === reportId);
  if (idx < 0) return;
  history[idx].tags = (history[idx].tags || []).filter(t => t !== tagId);
  localStorage.setItem('mbrcst_history', JSON.stringify(history));
}

function renderTagBadges(tags) {
  if (!tags || !tags.length) return '';
  return tags.map(tId => {
    const tag = TAGS.find(t => t.id === tId);
    if (!tag) return '';
    return `<span style="font-size:0.6rem;font-weight:700;background:${tag.color}22;color:${tag.color};border-radius:4px;padding:1px 6px;border:1px solid ${tag.color}44">${tag.label}</span>`;
  }).join('');
}

// ============================================================
// 24. REAL ANALYTICS DASHBOARD
// ============================================================
let analyticsCharts = {};

function showAnalytics() {
  const overlay = document.getElementById('analyticsOverlay');
  if (!overlay) return;
  overlay.style.display = 'block';
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('navAnalytics')?.classList.add('active');
  setTimeout(renderAnalytics, 100);
}

function closeAnalytics() {
  document.getElementById('analyticsOverlay').style.display = 'none';
  document.getElementById('navAnalytics')?.classList.remove('active');
}

function renderAnalytics() {
  const history = JSON.parse(localStorage.getItem('mbrcst_history') || '[]');
  const aiUsage = parseInt(localStorage.getItem('mbrcst_ai_usage') || '0');
  const schedules = JSON.parse(localStorage.getItem('mbrcst_schedules') || '[]');
  const thisMonth = history.filter(r => new Date(r.date).getMonth() === new Date().getMonth()).length;
  const totalWords = history.reduce((s, r) => s + (r.wordCount || 0), 0);
  const avgWords = history.length ? Math.round(totalWords / history.length) : 0;

  // KPI Cards
  const kpiEl = document.getElementById('analyticsKPIs');
  if (kpiEl) {
    kpiEl.innerHTML = [
      {icon:'📑', val:history.length, label:'إجمالي التقارير', color:'#6c63ff', sub:'+'+thisMonth+' هذا الشهر'},
      {icon:'🤖', val:aiUsage, label:'طلبات AI', color:'#00d4aa', sub:'إجمالي الطلبات'},
      {icon:'✍️', val:totalWords.toLocaleString('ar'), label:'كلمة كُتبت', color:'#f59e0b', sub:'متوسط '+avgWords+' كلمة/تقرير'},
      {icon:'⏰', val:schedules.length, label:'جداول نشطة', color:'#ef4444', sub:schedules.filter(s=>s.active).length+' فعال'},
    ].map(k => `
      <div style="background:#1a1a2e;border:1px solid rgba(${k.color==='#6c63ff'?'108,99,255':k.color==='#00d4aa'?'0,212,170':k.color==='#f59e0b'?'245,158,11':'239,68,68'},0.2);border-radius:14px;padding:1.2rem">
        <div style="font-size:1.5rem;margin-bottom:0.4rem">${k.icon}</div>
        <div style="font-size:1.5rem;font-weight:900;color:${k.color}">${k.val}</div>
        <div style="font-size:0.75rem;color:#fff;font-weight:700;margin-top:0.2rem">${k.label}</div>
        <div style="font-size:0.68rem;color:var(--text-muted);margin-top:0.1rem">${k.sub}</div>
      </div>`).join('');
  }

  // Monthly chart — last 6 months
  const months = [];
  const monthCounts = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const m = d.getMonth();
    const y = d.getFullYear();
    months.push(d.toLocaleDateString('ar-SA', {month:'short', year:'2-digit'}));
    monthCounts.push(history.filter(r => {
      const rd = new Date(r.date);
      return rd.getMonth() === m && rd.getFullYear() === y;
    }).length);
  }

  const monthCanvas = document.getElementById('analyticsMonthlyChart');
  if (monthCanvas && window.Chart) {
    if (analyticsCharts.monthly) analyticsCharts.monthly.destroy();
    analyticsCharts.monthly = new Chart(monthCanvas, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{ label:'التقارير', data: monthCounts, backgroundColor:'rgba(108,99,255,0.7)', borderColor:'#6c63ff', borderWidth:1, borderRadius:6 }]
      },
      options: { responsive:true, plugins:{ legend:{display:false} }, scales:{ x:{ticks:{color:'#aaa',font:{family:'Arial'}}}, y:{ticks:{color:'#aaa',stepSize:1,font:{family:'Arial'}},beginAtZero:true} } }
    });
  }

  // Type distribution pie chart
  const typeDist = {};
  history.forEach(r => { typeDist[r.type||'general'] = (typeDist[r.type||'general']||0) + 1; });
  const typeNames = {monthly:'شهري', weekly:'أسبوعي', quarterly:'ربعي', annual:'سنوي', general:'عام', project:'مشروع'};
  const typeCanvas = document.getElementById('analyticsTypeChart');
  if (typeCanvas && window.Chart && Object.keys(typeDist).length) {
    if (analyticsCharts.type) analyticsCharts.type.destroy();
    const COLORS = ['#6c63ff','#00d4aa','#f59e0b','#ef4444','#10b981','#0ea5e9'];
    analyticsCharts.type = new Chart(typeCanvas, {
      type: 'doughnut',
      data: {
        labels: Object.keys(typeDist).map(k => typeNames[k]||k),
        datasets: [{ data: Object.values(typeDist), backgroundColor: COLORS.slice(0, Object.keys(typeDist).length), borderWidth: 2, borderColor:'#1a1a2e' }]
      },
      options: { responsive:true, cutout:'65%', plugins:{ legend:{position:'bottom', labels:{color:'#aaa', font:{family:'Arial'}, padding:10}} } }
    });
  } else if (typeCanvas) {
    typeCanvas.parentElement.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-muted)">لا توجد بيانات بعد</div>';
  }

  // Timeline
  const tlEl = document.getElementById('analyticsTimeline');
  if (tlEl) {
    const recent = history.slice(0, 8);
    if (!recent.length) { tlEl.innerHTML = '<div style="color:var(--text-muted);font-size:0.82rem;text-align:center;padding:1rem">لا توجد نشاطات بعد</div>'; return; }
    tlEl.innerHTML = recent.map(r => {
      const d = new Date(r.date);
      return `<div style="display:flex;gap:0.8rem;align-items:center;padding:0.5rem 0;border-bottom:1px solid rgba(255,255,255,0.04)">
        <div style="width:8px;height:8px;border-radius:50%;background:var(--accent);flex-shrink:0"></div>
        <div style="flex:1;font-size:0.78rem;color:#fff;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.title}</div>
        <div style="font-size:0.68rem;color:var(--text-muted);flex-shrink:0">${d.toLocaleDateString('ar-SA',{month:'short',day:'numeric'})} ${d.toLocaleTimeString('ar-SA',{hour:'2-digit',minute:'2-digit'})}</div>
        <div style="font-size:0.68rem;color:var(--text-muted);flex-shrink:0">${r.wordCount||0} كلمة</div>
      </div>`;
    }).join('');
  }
}

// ============================================================
// 25. AI WRITING SIDEBAR
// ============================================================
let sidebarResultText = '';

function toggleAIWritingSidebar() {
  const sb = document.getElementById('aiWritingSidebar');
  if (!sb) return;
  const isOpen = sb.style.display !== 'none';
  sb.style.display = isOpen ? 'none' : 'block';
  document.getElementById('navWriter')?.classList.toggle('active', !isOpen);
  // Push main content
  const main = document.querySelector('.main-content') || document.querySelector('main') || document.getElementById('mainContent');
  if (main) main.style.marginRight = isOpen ? '' : '310px';
  if (!isOpen) updateSidebarScore();
}

function closeAIWritingSidebar() {
  document.getElementById('aiWritingSidebar').style.display = 'none';
  document.getElementById('navWriter')?.classList.remove('active');
  const main = document.querySelector('.main-content') || document.querySelector('main');
  if (main) main.style.marginRight = '';
}

function updateSidebarScore() {
  const content = getCurrentReportText();
  if (!content || content.length < 10) return;
  const words = content.split(/\s+/).filter(w => w.length > 0).length;
  const hasIntro = content.includes('مقدمة') || content.includes('المقدمة');
  const hasConclusion = content.includes('خاتمة') || content.includes('الخلاصة');
  const hasNumbers = /\d+/.test(content);
  const hasStructure = content.includes('\n') && content.split('\n').length > 5;
  let score = 0;
  if (words > 50) score += 20;
  if (words > 200) score += 20;
  if (words > 500) score += 20;
  if (hasIntro) score += 10;
  if (hasConclusion) score += 10;
  if (hasNumbers) score += 10;
  if (hasStructure) score += 10;
  score = Math.min(100, score);
  const bar = document.getElementById('writingScoreBar');
  const num = document.getElementById('writingScoreNum');
  if (bar) bar.style.width = score + '%';
  if (num) num.textContent = score + '%';
  if (bar) {
    if (score >= 80) bar.style.background = 'linear-gradient(90deg,#10b981,#00d4aa)';
    else if (score >= 50) bar.style.background = 'linear-gradient(90deg,#f59e0b,#10b981)';
    else bar.style.background = 'linear-gradient(90deg,#ef4444,#f59e0b)';
  }
}

async function sidebarAI(mode) {
  const text = getCurrentReportText();
  if (!text || text.length < 20) { showToast('أنشئ تقريراً أولاً', 'error'); return; }
  const el = document.getElementById('sidebarAIResult');
  const applyBtn = document.getElementById('sidebarApplyBtn');
  if (el) { el.innerHTML = '<div class="ai-loading" style="justify-content:flex-start"><div class="spinner"></div></div>'; }

  const prompts = {
    rephrase: `أعد صياغة هذه النص بأسلوب أفضل مع الحفاظ على المعنى:\n\n${text.substring(0,1500)}`,
    simplify: `بسّط هذا النص ليكون مفهوماً لعموم الناس:\n\n${text.substring(0,1500)}`,
    formalize: `اجعل هذا النص أكثر رسمية واحترافية:\n\n${text.substring(0,1500)}`,
    bullets: `حوّل هذا النص إلى نقاط مرتبة ومنظمة:\n\n${text.substring(0,1500)}`,
    shorter: `اختصر هذا النص للنصف مع الحفاظ على أهم النقاط:\n\n${text.substring(0,1500)}`,
    longer: `وسّع هذا النص واجعله أكثر تفصيلاً:\n\n${text.substring(0,800)}`,
    fixArabic: `صحّح الأخطاء اللغوية والإملائية في هذا النص:\n\n${text.substring(0,1500)}`,
    conclusion: `اكتب خاتمة احترافية لهذا التقرير:\n\n${text.substring(0,1500)}`,
  };
  const result = await callAI(prompts[mode], 'أنت مساعد كتابة احترافي متخصص في تحرير النصوص العربية.');
  sidebarResultText = result || '';
  if (el) el.textContent = sidebarResultText.substring(0, 600) + (sidebarResultText.length > 600 ? '...' : '');
  if (applyBtn) applyBtn.style.display = 'block';
}

function applySidebarResult() {
  if (!sidebarResultText) return;
  const ta = document.querySelector('textarea') || document.getElementById('reportNotes');
  if (ta) { ta.value = sidebarResultText; updateWritingStats(sidebarResultText); updateSidebarScore(); }
  saveReportToHistory((document.getElementById('reportTitle')||{}).value||'تقرير معدّل', sidebarResultText, 'general');
  showToast('✅ تم تطبيق التعديل', 'success');
}

// ============================================================
// 26. COVER PAGE GENERATOR
// ============================================================
let currentCoverStyle = 'modern';

function showCoverPage() {
  const modal = document.getElementById('coverPageModal');
  if (!modal) return;
  modal.style.display = 'flex';
  document.getElementById('navCover')?.classList.add('active');
  updateCoverPreview();
}
function closeCoverModal() {
  document.getElementById('coverPageModal').style.display = 'none';
  document.getElementById('navCover')?.classList.remove('active');
}
function selectCoverStyle(btn, style) {
  currentCoverStyle = style;
  document.querySelectorAll('.cover-style-card').forEach(c => c.classList.remove('selected'));
  btn.classList.add('selected');
  updateCoverPreview();
}

function updateCoverPreview() {
  const b = JSON.parse(localStorage.getItem('mbrcst_branding') || '{}');
  const title = (document.getElementById('reportTitle')||{}).value || 'التقرير السنوي 2025';
  const orgName = b.name || 'اسم المؤسسة';
  const orgDept = b.dept || 'الإدارة العامة';
  const color = b.color || '#6c63ff';
  const now = new Date().toLocaleDateString('ar-SA', {year:'numeric', month:'long'});
  const logoHtml = orgLogoDataUrl ? `<img src="${orgLogoDataUrl}" style="max-height:80px;max-width:160px;object-fit:contain;margin-bottom:0.5rem">` : `<div style="font-size:2.5rem">🏢</div>`;
  const prev = document.getElementById('coverPreview');
  if (!prev) return;

  const covers = {
    modern: `<div style="background:linear-gradient(135deg,${color},${color}88);padding:3rem;color:white;text-align:center;min-height:280px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0.8rem;">
      ${logoHtml}
      <div style="font-size:0.9rem;opacity:0.8;font-weight:600;letter-spacing:0.05em">${orgName}</div>
      <div style="width:60px;height:3px;background:rgba(255,255,255,0.6);border-radius:2px"></div>
      <div style="font-size:1.6rem;font-weight:900;line-height:1.3">${title}</div>
      <div style="font-size:0.8rem;opacity:0.7;margin-top:0.5rem">${orgDept} | ${now}</div>
      <div style="font-size:0.72rem;opacity:0.6;margin-top:0.3rem">أُعدَّ بواسطة MBR Reports</div>
    </div>`,

    classic: `<div style="background:#fff;padding:3rem;text-align:center;min-height:280px;display:flex;flex-direction:column;align-items:center;justify-content:center;border:2px solid ${color};gap:0.8rem">
      ${logoHtml.replace('style="', 'style="filter:none;')}
      <div style="font-size:0.85rem;font-weight:900;color:${color};letter-spacing:0.1em;text-transform:uppercase">${orgName}</div>
      <div style="width:100%;height:2px;background:${color};margin:0.5rem 0"></div>
      <div style="font-size:1.8rem;font-weight:900;color:#1a1a2e;line-height:1.3">${title}</div>
      <div style="width:60%;height:1px;background:#ddd;margin:0.5rem 0"></div>
      <div style="font-size:0.8rem;color:#666">${orgDept}</div>
      <div style="font-size:0.78rem;color:#888">${now}</div>
    </div>`,

    bold: `<div style="background:#000;padding:3rem;color:white;min-height:280px;display:flex;flex-direction:column;justify-content:flex-end;gap:0.5rem;position:relative;overflow:hidden">
      <div style="position:absolute;top:0;right:0;width:200px;height:200px;background:${color};border-radius:0 0 0 100%;opacity:0.8"></div>
      <div style="position:absolute;bottom:0;left:0;width:120px;height:120px;background:${color}44;border-radius:0 100% 0 0"></div>
      ${logoHtml.replace('style="', 'style="position:absolute;top:1.5rem;left:1.5rem;')}
      <div style="font-size:2rem;font-weight:900;line-height:1.2;position:relative">${title}</div>
      <div style="width:60px;height:4px;background:${color};border-radius:2px"></div>
      <div style="font-size:0.82rem;opacity:0.7;position:relative">${orgName} | ${orgDept}</div>
      <div style="font-size:0.72rem;opacity:0.5;position:relative">${now}</div>
    </div>`
  };
  prev.innerHTML = covers[currentCoverStyle] || covers.modern;
}

async function exportCoverPDF() {
  updateCoverPreview();
  const prev = document.getElementById('coverPreview');
  if (!prev) return;
  showToast('⏳ جاري إنشاء PDF...', 'success');
  try {
    if (window.html2canvas && window.jspdf) {
      const canvas = await html2canvas(prev, {scale:2, backgroundColor:'#fff', useCORS:true, logging:false});
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p','mm','a4');
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, h);
      // Add report content on next page
      const content = getCurrentReportText();
      if (content && content.length > 20) {
        pdf.addPage();
        const lines = pdf.splitTextToSize(content, 180);
        pdf.setFontSize(11); pdf.setFont('helvetica');
        pdf.text(lines, 15, 20);
      }
      const b = JSON.parse(localStorage.getItem('mbrcst_branding')||'{}');
      const title = (document.getElementById('reportTitle')||{}).value || 'التقرير';
      pdf.save(`${b.name||'MBR'}_${title}.pdf`);
      showToast('✅ تم تصدير PDF مع الغلاف!', 'success');
    } else { printCover(); }
  } catch(e) { printCover(); }
}

function printCover() {
  const prev = document.getElementById('coverPreview');
  if (!prev) return;
  const win = window.open('', '_blank');
  win.document.write(`<html><head><meta charset="utf-8"><style>body{margin:0;padding:0}</style></head><body>${prev.innerHTML}<script>window.onload=()=>window.print()<\/script></body></html>`);
  win.document.close();
}

// ============================================================
// 27. AI TRANSLATOR
// ============================================================
let transLangFrom = 'ar', transLangTo = 'en';
let translatedText = '';

const LANG_NAMES = { ar:'العربية', en:'الإنجليزية', fr:'الفرنسية', tr:'التركية' };
const LANG_DIRS  = { ar:'rtl', en:'ltr', fr:'ltr', tr:'ltr' };

function showTranslatePanel() {
  const overlay = document.getElementById('translateOverlay');
  if (!overlay) return;
  overlay.style.display = 'block';
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('navTranslate')?.classList.add('active');
  // Load original text
  const text = getCurrentReportText();
  const origEl = document.getElementById('transOrigText');
  const wordsEl = document.getElementById('transOrigWords');
  if (origEl) origEl.textContent = text || 'لا يوجد تقرير حالياً';
  if (wordsEl) wordsEl.textContent = text ? text.split(/\s+/).length + ' كلمة' : '';
}

function closeTranslate() {
  document.getElementById('translateOverlay').style.display = 'none';
  document.getElementById('navTranslate')?.classList.remove('active');
}

function setTransLang(btn, from, to) {
  transLangFrom = from;
  transLangTo = to;
  document.querySelectorAll('.trans-lang-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const fromLabel = document.getElementById('transFromLabel');
  const toLabel = document.getElementById('transToLabel');
  if (fromLabel) fromLabel.textContent = `📄 النص بالـ${LANG_NAMES[from]||from}`;
  if (toLabel) toLabel.textContent = `✨ الترجمة إلى ${LANG_NAMES[to]||to}`;
}

async function runTranslation() {
  const orig = getCurrentReportText();
  if (!orig || orig.length < 10) { showToast('أنشئ تقريراً أولاً للترجمة', 'error'); return; }
  const resultEl = document.getElementById('transResultText');
  const actionsEl = document.getElementById('transActions');
  const applyBtn = document.getElementById('transApplyBtn');
  if (resultEl) resultEl.innerHTML = '<div class="ai-loading" style="justify-content:flex-start"><div class="spinner"></div><span>AI يترجم...</span></div>';

  const langNames = { ar:'Arabic', en:'English', fr:'French', tr:'Turkish' };
  const result = await callAI(
    `Translate the following report from ${langNames[transLangFrom]||transLangFrom} to ${langNames[transLangTo]||transLangTo}. Maintain the professional formal tone and report structure. Keep all section headers and formatting:\n\n${orig.substring(0, 4000)}`,
    `You are a professional translator specializing in formal business reports and government documents. Translate accurately while maintaining all formatting.`,
    { maxTokens: 3000 }
  );
  translatedText = result || '';
  if (resultEl) {
    resultEl.style.direction = LANG_DIRS[transLangTo] || 'rtl';
    resultEl.textContent = translatedText;
  }
  if (actionsEl) actionsEl.style.display = 'flex';
  if (applyBtn) applyBtn.style.display = 'block';
  showToast(`✅ تمت الترجمة إلى ${LANG_NAMES[transLangTo]||transLangTo}!`, 'success');
  saveReportToHistory(
    (document.getElementById('reportTitle')||{}).value + ` (${LANG_NAMES[transLangTo]||transLangTo})`,
    translatedText, 'general'
  );
}

function applyTranslation() {
  if (!translatedText) return;
  const ta = document.querySelector('textarea') || document.getElementById('reportNotes');
  if (ta) ta.value = translatedText;
  closeTranslate();
  showToast('✅ تم تطبيق الترجمة', 'success');
}

function exportTranslatedPDF() {
  if (!translatedText) { showToast('اترجم أولاً', 'error'); return; }
  const b = JSON.parse(localStorage.getItem('mbrcst_branding')||'{}');
  const title = (document.getElementById('reportTitle')||{}).value || 'Report';
  const isRtl = LANG_DIRS[transLangTo] === 'rtl';
  const win = window.open('', '_blank');
  win.document.write(`<html lang="${transLangTo}" dir="${isRtl?'rtl':'ltr'}"><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:Arial;font-size:11pt;line-height:1.8;padding:2cm;color:#1a1a2e;direction:${isRtl?'rtl':'ltr'}}
.header{border-bottom:3px solid ${b.color||'#6c63ff'};padding-bottom:1rem;margin-bottom:1rem}
h1{color:${b.color||'#6c63ff'};font-size:16pt}
.body{white-space:pre-wrap}.footer{margin-top:2rem;border-top:1px solid #ddd;padding-top:0.5rem;color:#888;font-size:8pt;text-align:center}</style>
</head><body>
<div class="header"><div style="font-weight:900;color:${b.color||'#6c63ff'};font-size:13pt">${b.name||'MBR Reports'}</div></div>
<h1>${title} — ${LANG_NAMES[transLangTo]||transLangTo}</h1>
<div class="body">${translatedText}</div>
<div class="footer">MBR Reports | Translated by AI</div>
<script>window.onload=()=>window.print()<\/script></body></html>`);
  win.document.close();
  showToast('✅ تم فتح نافذة الطباعة/PDF', 'success');
}

function exportTranslatedWord() {
  if (!translatedText) return;
  const title = (document.getElementById('reportTitle')||{}).value || 'Report';
  const b = JSON.parse(localStorage.getItem('mbrcst_branding')||'{}');
  const isRtl = LANG_DIRS[transLangTo] === 'rtl';
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:Arial;direction:${isRtl?'rtl':'ltr'};padding:2cm;font-size:11pt}h1{color:${b.color||'#6c63ff'}}</style>
</head><body><h1>${title} — ${LANG_NAMES[transLangTo]||transLangTo}</h1><div style="white-space:pre-wrap">${translatedText}</div></body></html>`;
  const blob = new Blob(['\ufeff'+html], {type:'application/msword'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `${title}_${transLangTo}.doc`; a.click();
  showToast('✅ تم تصدير Word', 'success');
}

function saveTranslatedReport() {
  if (!translatedText) return;
  const title = (document.getElementById('reportTitle')||{}).value || 'تقرير';
  saveReportToHistory(`${title} — ${LANG_NAMES[transLangTo]||transLangTo}`, translatedText, 'general');
  showToast('✅ تم الحفظ في المكتبة', 'success');
}

// ============================================================
// 28. FOCUS MODE + TAB AUTOCOMPLETE
// ============================================================
let focusMode = false;
let autocompleteText = '';
let autocompleteTimeout = null;

function toggleFocusMode() {
  if (focusMode) { exitFocusMode(); } else { enterFocusMode(); }
}

function enterFocusMode() {
  const overlay = document.getElementById('focusModeOverlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
  focusMode = true;
  document.getElementById('navFocus')?.classList.add('active');
  // Load current content
  const title = (document.getElementById('reportTitle')||{}).value || '';
  const content = getCurrentReportText();
  const titEl = document.getElementById('focusTitle');
  const ta = document.getElementById('focusTextarea');
  if (titEl) titEl.value = title;
  if (ta) { ta.value = content !== 'لا يوجد محتوى تقرير حالياً' ? content : ''; ta.focus(); }
  updateFocusStats();
}

function exitFocusMode() {
  const overlay = document.getElementById('focusModeOverlay');
  if (overlay) overlay.style.display = 'none';
  focusMode = false;
  document.getElementById('navFocus')?.classList.remove('active');
  // Ask to save
  const ta = document.getElementById('focusTextarea');
  if (ta && ta.value.length > 50) {
    const title = document.getElementById('focusTitle')?.value || 'تقرير Focus Mode';
    const titleEl = document.getElementById('reportTitle');
    if (titleEl) titleEl.value = title;
    saveReportToHistory(title, ta.value, 'general');
    showToast('✅ تم حفظ التقرير تلقائياً', 'success');
  }
}

function focusSave() {
  const ta = document.getElementById('focusTextarea');
  const title = document.getElementById('focusTitle')?.value || 'تقرير Focus';
  if (ta && ta.value.length > 20) {
    saveReportToHistory(title, ta.value, 'general');
    showToast('✅ تم الحفظ', 'success');
  }
}

function updateFocusStats() {
  const ta = document.getElementById('focusTextarea');
  if (!ta) return;
  const words = ta.value.trim().split(/\s+/).filter(w => w.length > 0).length;
  const readMin = Math.max(1, Math.ceil(words / 200));
  const wordsEl = document.getElementById('focusWordCount');
  const wEl = document.getElementById('focusWords');
  const rEl = document.getElementById('focusReadTime');
  if (wordsEl) wordsEl.textContent = words + ' كلمة';
  if (wEl) wEl.textContent = words.toLocaleString('ar') + ' كلمة';
  if (rEl) rEl.textContent = readMin + ' دقيقة قراءة';
  // Trigger autocomplete after 2s of inactivity
  clearTimeout(autocompleteTimeout);
  autocompleteTimeout = setTimeout(() => suggestAutocomplete(ta), 2000);
}

async function suggestAutocomplete(ta) {
  if (!focusMode || !ta || ta.value.length < 50) return;
  const lastSentences = ta.value.slice(-300);
  const result = await callAI(
    `أكمل هذه الجملة أو الفقرة الناقصة بجملة واحدة فقط (لا أكثر):\n"${lastSentences}"`,
    'أنت مساعد كتابة يكمل الجمل. أعطِ جملة واحدة قصيرة فقط.', { maxTokens:100 }
  );
  if (!result || !focusMode) return;
  autocompleteText = ' ' + result.trim().split(/[.!؟\n]/)[0];
  const ghost = document.getElementById('focusAutocomplete');
  if (ghost) {
    ghost.textContent = autocompleteText;
    ghost.style.display = 'block';
    setTimeout(() => { if (ghost) ghost.style.display = 'none'; autocompleteText = ''; }, 5000);
  }
}

function handleFocusKeydown(e) {
  if (e.key === 'Escape') { exitFocusMode(); return; }
  if (e.key === 'Tab' && autocompleteText) {
    e.preventDefault();
    const ta = document.getElementById('focusTextarea');
    if (ta) {
      ta.value += autocompleteText;
      autocompleteText = '';
      const ghost = document.getElementById('focusAutocomplete');
      if (ghost) ghost.style.display = 'none';
      updateFocusStats();
    }
  }
}

// ============================================================
// 29. MERGE + CLONE REPORTS
// ============================================================
let selectedMergeIds = new Set();
let mergeCurrentTab = 'merge';

function showMergePanel() {
  const overlay = document.getElementById('mergeOverlay');
  if (!overlay) return;
  overlay.style.display = 'block';
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('navMerge')?.classList.add('active');
  renderMergeList();
  renderCloneList();
}

function closeMerge() {
  document.getElementById('mergeOverlay').style.display = 'none';
  document.getElementById('navMerge')?.classList.remove('active');
}

function showMergeTab(tab, btn) {
  mergeCurrentTab = tab;
  document.querySelectorAll('.merge-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('mergeTab').style.display = tab === 'merge' ? 'block' : 'none';
  document.getElementById('cloneTab').style.display = tab === 'clone' ? 'block' : 'none';
}

function renderMergeList() {
  const el = document.getElementById('mergeReportsList');
  if (!el) return;
  const history = JSON.parse(localStorage.getItem('mbrcst_history') || '[]');
  if (!history.length) { el.innerHTML = '<div style="color:var(--text-muted);font-size:0.8rem;padding:0.5rem">لا توجد تقارير محفوظة</div>'; return; }
  el.innerHTML = history.slice(0, 20).map(r => {
    const d = new Date(r.date).toLocaleDateString('ar-SA', {month:'short', day:'numeric'});
    return `<label style="display:flex;align-items:center;gap:0.6rem;cursor:pointer;padding:0.5rem;background:rgba(255,255,255,0.03);border-radius:8px;transition:background 0.1s" onmouseover="this.style.background='rgba(108,99,255,0.08)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">
      <input type="checkbox" value="${r.id}" onchange="toggleMergeSelect(${r.id},this.checked)" style="accent-color:var(--accent)">
      <div style="flex:1">
        <div style="font-size:0.8rem;font-weight:700;color:#fff">${r.title}</div>
        <div style="font-size:0.68rem;color:var(--text-muted)">${d} • ${r.wordCount||0} كلمة</div>
      </div>
    </label>`;
  }).join('');
}

function toggleMergeSelect(id, checked) {
  if (checked) selectedMergeIds.add(id);
  else selectedMergeIds.delete(id);
}

async function executeMerge() {
  if (selectedMergeIds.size < 2) { showToast('اختر تقريرين على الأقل', 'error'); return; }
  const history = JSON.parse(localStorage.getItem('mbrcst_history') || '[]');
  const selected = history.filter(r => selectedMergeIds.has(r.id));
  const style = (document.getElementById('mergeStyle')||{}).value || 'sequential';
  const resultEl = document.getElementById('mergeResult');
  if (resultEl) { resultEl.style.display = 'block'; resultEl.innerHTML = '<div class="ai-loading"><div class="spinner"></div><span>يدمج...</span></div>'; }

  let merged = '';
  if (style === 'sequential') {
    merged = selected.map(r => `=== ${r.title} ===\n\n${r.content}`).join('\n\n' + '─'.repeat(40) + '\n\n');
    if (resultEl) resultEl.textContent = merged;
    saveReportToHistory('تقرير مدمج: ' + selected.map(r=>r.title).join(' + '), merged, 'general');
    showToast('✅ تم الدمج', 'success');
  } else if (style === 'ai' || style === 'executive') {
    const combined = selected.map((r,i) => `=== التقرير ${i+1}: ${r.title} ===\n${r.content.substring(0,1500)}`).join('\n\n');
    const prompt = style === 'executive'
      ? `اكتب ملخصاً تنفيذياً شاملاً يجمع أبرز نقاط هذه التقارير:\n\n${combined}`
      : `ادمج هذه التقارير في تقرير واحد متماسك ومتسق:\n\n${combined}`;
    merged = await callAI(prompt, 'أنت محرر تقارير محترف.') || '';
    if (resultEl) resultEl.textContent = merged;
    saveReportToHistory('تقرير مدمج', merged, 'general');
    showToast('✅ تم الدمج بـ AI', 'success');
  }
  selectedMergeIds.clear();
}

function renderCloneList() {
  const el = document.getElementById('cloneReportsList');
  if (!el) return;
  const history = JSON.parse(localStorage.getItem('mbrcst_history') || '[]');
  el.innerHTML = history.slice(0,15).map(r => {
    const d = new Date(r.date).toLocaleDateString('ar-SA', {month:'short', day:'numeric'});
    return `<div style="display:flex;align-items:center;gap:0.7rem;padding:0.6rem;background:rgba(255,255,255,0.03);border-radius:8px;margin-bottom:0.3rem">
      <div style="flex:1">
        <div style="font-size:0.8rem;font-weight:700;color:#fff">${r.title}</div>
        <div style="font-size:0.68rem;color:var(--text-muted)">${d} • ${r.wordCount||0} كلمة</div>
      </div>
      <button onclick="cloneReport(${r.id})" style="background:rgba(0,212,170,0.15);border:1px solid rgba(0,212,170,0.3);border-radius:8px;color:#00d4aa;padding:0.35rem 0.8rem;cursor:pointer;font-family:var(--font);font-size:0.75rem;font-weight:700;white-space:nowrap">📋 نسخ</button>
      <button onclick="editClonedReport(${r.id})" style="background:rgba(108,99,255,0.15);border:1px solid rgba(108,99,255,0.3);border-radius:8px;color:var(--accent);padding:0.35rem 0.8rem;cursor:pointer;font-family:var(--font);font-size:0.75rem;font-weight:700;white-space:nowrap">✏️ نسخ وتحرير</button>
    </div>`;
  }).join('');
}

function cloneReport(id) {
  const history = JSON.parse(localStorage.getItem('mbrcst_history') || '[]');
  const r = history.find(x => x.id === id);
  if (!r) return;
  const clone = {...r, id: Date.now(), title: 'نسخة من: ' + r.title, date: new Date().toISOString()};
  const newHistory = [clone, ...history];
  localStorage.setItem('mbrcst_history', JSON.stringify(newHistory));
  renderCloneList();
  showToast(`✅ تم نسخ "${r.title}"`, 'success');
}

function editClonedReport(id) {
  const history = JSON.parse(localStorage.getItem('mbrcst_history') || '[]');
  const r = history.find(x => x.id === id);
  if (!r) return;
  const titleEl = document.getElementById('reportTitle');
  if (titleEl) titleEl.value = 'نسخة: ' + r.title;
  closeMerge();
  enterFocusMode();
  const focusTa = document.getElementById('focusTextarea');
  if (focusTa) focusTa.value = r.content;
  showToast(`✅ تحرير نسخة من "${r.title}"`, 'success');
}

// ============================================================
// 31. FAVORITES / BOOKMARKS
// ============================================================
function toggleFavorite(reportId, fromHistory) {
  const history = JSON.parse(localStorage.getItem('mbrcst_history') || '[]');
  const idx = history.findIndex(r => r.id === reportId);
  if (idx < 0) return;
  history[idx].favorite = !history[idx].favorite;
  localStorage.setItem('mbrcst_history', JSON.stringify(history));
  if (fromHistory) renderHistory(null);
  showToast(history[idx].favorite ? '⭐ تمت الإضافة للمفضلة' : 'تم الإزالة من المفضلة', 'success');
  updateFavoritesBadge();
}

function updateFavoritesBadge() {
  const history = JSON.parse(localStorage.getItem('mbrcst_history') || '[]');
  const count = history.filter(r => r.favorite).length;
  const btn = document.getElementById('navFavorites');
  if (btn) btn.setAttribute('data-count', count);
}

function showFavorites() {
  const overlay = document.getElementById('favoritesOverlay');
  if (!overlay) return;
  overlay.style.display = 'block';
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('navFavorites')?.classList.add('active');
  renderFavoritesGrid();
}

function closeFavorites() {
  document.getElementById('favoritesOverlay').style.display = 'none';
  document.getElementById('navFavorites')?.classList.remove('active');
}

function renderFavoritesGrid() {
  const el = document.getElementById('favoritesGrid');
  if (!el) return;
  const history = JSON.parse(localStorage.getItem('mbrcst_history') || '[]');
  const favs = history.filter(r => r.favorite);
  if (!favs.length) {
    el.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted)">
      <div style="font-size:2.5rem;margin-bottom:0.5rem">⭐</div>
      <div>لا توجد تقارير مفضلة بعد</div>
      <div style="font-size:0.78rem;margin-top:0.5rem">اضغط ⭐ على أي تقرير في المكتبة لإضافته</div>
    </div>`;
    return;
  }
  el.innerHTML = favs.map(r => {
    const d = new Date(r.date).toLocaleDateString('ar-SA', {month:'short', day:'numeric', year:'numeric'});
    return `<div style="background:#1a1a2e;border:1px solid rgba(245,158,11,0.2);border-radius:14px;padding:1.2rem;cursor:pointer" onclick="viewHistReport(${r.id})">
      <div style="display:flex;justify-content:space-between;margin-bottom:0.6rem">
        <span style="font-size:1.2rem">⭐</span>
        <span style="font-size:0.68rem;color:var(--text-muted)">${d}</span>
      </div>
      <div style="font-size:0.88rem;font-weight:800;color:#fff;margin-bottom:0.4rem">${r.title}</div>
      <div style="font-size:0.73rem;color:var(--text-muted);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${r.content.substring(0,120)}...</div>
      <div style="display:flex;gap:0.5rem;margin-top:0.8rem">
        <button onclick="event.stopPropagation();enterReadingModeWithReport(${r.id})" style="flex:1;background:rgba(108,99,255,0.15);border:1px solid rgba(108,99,255,0.2);border-radius:8px;color:var(--accent);padding:0.35rem;cursor:pointer;font-size:0.72rem;font-family:var(--font);font-weight:700">📖 قراءة</button>
        <button onclick="event.stopPropagation();toggleFavorite(${r.id},false);renderFavoritesGrid()" style="flex:1;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:8px;color:#ef4444;padding:0.35rem;cursor:pointer;font-size:0.72rem;font-family:var(--font);font-weight:700">🗑️ إزالة</button>
      </div>
    </div>`;
  }).join('');
}

// Add favorite button to history cards (patch renderHistory after it's defined)
const _origRenderHistory = renderHistory;
function renderHistory(filter) {
  _origRenderHistory(filter);
  // Add star buttons to all hist-cards
  setTimeout(() => {
    const history = JSON.parse(localStorage.getItem('mbrcst_history') || '[]');
    document.querySelectorAll('.hist-card').forEach((card, i) => {
      const r = history.find(r => card.getAttribute('onclick')?.includes(r.id));
      if (!r) return;
      if (card.querySelector('.fav-btn')) return;
      const favBtn = document.createElement('button');
      favBtn.className = 'fav-btn';
      favBtn.innerHTML = r.favorite ? '⭐' : '☆';
      favBtn.title = r.favorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة';
      favBtn.style.cssText = 'position:absolute;top:0.6rem;left:0.6rem;background:none;border:none;cursor:pointer;font-size:1rem;opacity:0.7';
      favBtn.onclick = (e) => { e.stopPropagation(); toggleFavorite(r.id, true); };
      card.style.position = 'relative';
      card.appendChild(favBtn);
    });
  }, 100);
}

updateFavoritesBadge();

// ============================================================
// 32. READING MODE
// ============================================================
let readingFontSize = 1.05;

function enterReadingMode() {
  const content = getCurrentReportText();
  if (!content || content.length < 20) { showToast('أنشئ تقريراً أولاً', 'error'); return; }
  openReadingMode(
    (document.getElementById('reportTitle')||{}).value || 'التقرير',
    content
  );
}

function enterReadingModeWithReport(id) {
  const history = JSON.parse(localStorage.getItem('mbrcst_history') || '[]');
  const r = history.find(x => x.id === id);
  if (!r) return;
  closeFavorites();
  openReadingMode(r.title, r.content);
}

function openReadingMode(title, content) {
  const overlay = document.getElementById('readingModeOverlay');
  if (!overlay) return;
  overlay.style.display = 'block';
  document.getElementById('navReading')?.classList.add('active');
  // Fill content
  const b = JSON.parse(localStorage.getItem('mbrcst_branding')||'{}');
  const now = new Date().toLocaleDateString('ar-SA',{year:'numeric',month:'long',day:'numeric'});
  const words = content.split(/\s+/).filter(w=>w.length>0).length;
  const readMin = Math.max(1, Math.ceil(words/200));
  document.getElementById('readingTitle').textContent = title;
  document.getElementById('readingOrgName').textContent = b.name || 'MBR Reports';
  document.getElementById('readingMeta').innerHTML = `
    <span>📅 ${now}</span><span>👤 ${(currentUser||{}).fullName||''}</span>
    <span>📝 ${words.toLocaleString('ar')} كلمة</span><span>⏱️ ${readMin} دقيقة قراءة</span>`;
  document.getElementById('readingContent').textContent = content;
  document.getElementById('readingWordCount').textContent = words.toLocaleString('ar') + ' كلمة';
  document.getElementById('readingReadTime').textContent = readMin + ' دقيقة قراءة';
  overlay.scrollTop = 0;
  // Track reading progress
  overlay.onscroll = () => {
    const h = overlay.scrollHeight - overlay.clientHeight;
    const p = h > 0 ? Math.round((overlay.scrollTop / h) * 100) : 0;
    const bar = document.getElementById('readingProgress');
    if (bar) bar.style.width = p + '%';
  };
}

function exitReadingMode() {
  document.getElementById('readingModeOverlay').style.display = 'none';
  document.getElementById('navReading')?.classList.remove('active');
}

function changeFontSize(delta) {
  readingFontSize = Math.min(1.5, Math.max(0.8, readingFontSize + delta * 0.05));
  const content = document.getElementById('readingContent');
  if (content) content.style.fontSize = readingFontSize + 'rem';
}

// ============================================================
// 33. AI MEETING MINUTES GENERATOR
// ============================================================
async function generateMeetingMinutes(style) {
  const notes = (document.getElementById('minutesInput')||{}).value?.trim() || '';
  if (!notes) { showToast('الصق ملاحظات الاجتماع أولاً', 'error'); return; }
  const resultEl = document.getElementById('minutesResult');
  if (resultEl) { resultEl.style.display = 'block'; resultEl.innerHTML = '<div class="ai-loading"><div class="spinner"></div><span>يُعدّ المحضر...</span></div>'; }

  const prompts = {
    formal: `حوّل ملاحظات الاجتماع التالية إلى محضر اجتماع رسمي باللغة العربية يشمل:\n\nأولاً: بيانات الاجتماع (التاريخ، المكان، الحضور إن وُجدوا)\nثانياً: جدول الأعمال\nثالثاً: ما تم مناقشته (نقطة نقطة)\nرابعاً: القرارات المتخذة\nخامساً: الإجراءات المطلوبة (المسؤول والموعد)\nسادساً: موعد الاجتماع القادم\n\nالملاحظات:\n${notes}`,
    action: `من ملاحظات الاجتماع التالية، استخرج بنود الإجراءات فقط بتنسيق:\n□ المهمة | المسؤول | الموعد\n\nرتّبها حسب الأولوية:\n${notes}`,
    summary: `اكتب ملخصاً موجزاً لاجتماع لا يتجاوز 5 جمل، مع ذكر أهم القرارات والخطوات القادمة:\n${notes}`
  };
  const systems = {
    formal: 'أنت كاتب محاضر اجتماعات محترف في المؤسسات الحكومية والشركات الكبرى.',
    action: 'أنت مساعد تنفيذي متخصص في استخلاص وتنظيم بنود الإجراءات من اجتماعات العمل.',
    summary: 'أنت ملخص تنفيذي محترف يكتب ملخصات اجتماعات موجزة ودقيقة.'
  };
  const result = await callAI(prompts[style], systems[style], { maxTokens: 2000 });
  if (result && resultEl) {
    resultEl.innerHTML = `
      <div style="white-space:pre-wrap;font-size:0.78rem;line-height:1.8;color:var(--text-secondary)">${result}</div>
      <div style="display:flex;gap:0.4rem;margin-top:0.7rem;flex-wrap:wrap">
        <button onclick="applyMinutesToEditor(this)" data-text="${encodeURIComponent(result)}" class="ai-tool-btn" style="flex:1;padding:0.4rem;font-size:0.75rem">📋 نقل للمحرر</button>
        <button onclick="exportMinutesPDF(this)" data-text="${encodeURIComponent(result)}" class="ai-tool-btn" style="flex:1;padding:0.4rem;font-size:0.75rem;background:linear-gradient(135deg,#ef4444,#b91c1c)">📄 PDF</button>
        <button onclick="saveMinutes(this)" data-text="${encodeURIComponent(result)}" class="ai-tool-btn" style="flex:1;padding:0.4rem;font-size:0.75rem;background:linear-gradient(135deg,#10b981,#059669)">💾 حفظ</button>
      </div>`;
    showToast('✅ تم إعداد المحضر!', 'success');
    addNotification('محضر اجتماع جاهز 🎙️', `تم إعداد ${style==='formal'?'المحضر الرسمي':style==='action'?'بنود الإجراءات':'الملخص السريع'}`, 'ai');
  }
}

function applyMinutesToEditor(btn) {
  const text = decodeURIComponent(btn.dataset.text);
  const ta = document.querySelector('textarea') || document.getElementById('reportNotes');
  if (ta) ta.value = text;
  showSection('create');
  showToast('✅ تم نقل المحضر للمحرر', 'success');
}

function exportMinutesPDF(btn) {
  const text = decodeURIComponent(btn.dataset.text);
  const b = JSON.parse(localStorage.getItem('mbrcst_branding')||'{}');
  const now = new Date().toLocaleDateString('ar-SA',{year:'numeric',month:'long',day:'numeric'});
  const win = window.open('','_blank');
  win.document.write(`<html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>محضر اجتماع</title>
<style>body{font-family:Arial;font-size:11pt;line-height:1.9;padding:2cm;direction:rtl;color:#1a1a2e}
.header{border-bottom:3px solid ${b.color||'#6c63ff'};padding-bottom:1rem;margin-bottom:1.5rem;display:flex;justify-content:space-between;align-items:center}
.body{white-space:pre-wrap}.footer{margin-top:2rem;border-top:1px solid #ddd;padding-top:0.5rem;color:#888;font-size:8pt;text-align:center}</style>
</head><body>
<div class="header"><div><div style="font-size:13pt;font-weight:900;color:${b.color||'#6c63ff'}">${b.name||'MBR Reports'}</div><div style="font-size:9pt;color:#666">${b.dept||''}</div></div><div style="font-size:9pt;color:#888">📅 ${now}</div></div>
<h2 style="color:${b.color||'#6c63ff'}">محضر الاجتماع</h2>
<div class="body">${text}</div>
<div class="footer">MBR Reports — أُعدَّ بواسطة الذكاء الاصطناعي</div>
<script>window.onload=()=>window.print()<\/script></body></html>`);
  win.document.close();
}

function saveMinutes(btn) {
  const text = decodeURIComponent(btn.dataset.text);
  saveReportToHistory('محضر اجتماع — ' + new Date().toLocaleDateString('ar-SA'), text, 'general');
  showToast('✅ تم الحفظ في المكتبة', 'success');
}

// ============================================================
// CLEANUP: Organize nav into a more compact structure
// ============================================================
function rebuildNavIfNeeded() {
  const navArea = document.querySelector('.nav-actions') || document.querySelector('nav');
  if (!navArea) return;
  // Make nav scrollable on overflow
  navArea.style.overflowX = 'auto';
  navArea.style.flexWrap = 'nowrap';
}
document.addEventListener('DOMContentLoaded', rebuildNavIfNeeded);
rebuildNavIfNeeded();

// ============================================================
// FORGOT PASSWORD
// ============================================================
function showForgotPassword() {
  // Remove existing modal if any
  const existing = document.getElementById('forgotModal');
  if (existing) existing.remove();

  // Build modal dynamically — works regardless of HTML cache
  const modal = document.createElement('div');
  modal.id = 'forgotModal';
  modal.style.cssText = 'display:flex;position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:999999;align-items:center;justify-content:center;font-family:Tajawal,Arial,sans-serif';
  const currentEmail = (document.getElementById('authEmail') || document.getElementById('loginEmail') || {}).value || '';
  modal.innerHTML = \`
    <div style="background:#12121e;border:1px solid rgba(108,99,255,0.5);border-radius:20px;padding:2rem;width:360px;max-width:92vw;direction:rtl;box-shadow:0 20px 60px rgba(0,0,0,0.6)">
      <div style="text-align:center;margin-bottom:1.5rem">
        <div style="font-size:2.5rem;margin-bottom:0.5rem">🔑</div>
        <h3 style="color:#fff;font-size:1.15rem;font-weight:900;margin:0">إعادة تعيين كلمة المرور</h3>
        <p style="color:rgba(255,255,255,0.45);font-size:0.78rem;margin:0.4rem 0 0">أدخل بريدك لإعادة تعيين كلمة المرور</p>
      </div>
      <div id="fm_step1">
        <div style="margin-bottom:0.8rem">
          <label style="color:rgba(255,255,255,0.6);font-size:0.78rem;display:block;margin-bottom:0.3rem">البريد الإلكتروني</label>
          <input id="fm_email" type="email" value="\${currentEmail}" placeholder="example@email.com"
            style="width:100%;box-sizing:border-box;padding:0.7rem 1rem;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:10px;color:white;font-size:0.88rem;direction:ltr;outline:none;font-family:Arial">
        </div>
        <button onclick="fm_verify()" style="width:100%;padding:0.75rem;background:linear-gradient(135deg,#6c63ff,#00d4aa);border:none;border-radius:12px;color:white;font-weight:700;font-size:0.95rem;cursor:pointer;font-family:Tajawal,Arial,sans-serif;margin-bottom:0.5rem">التحقق من الحساب ←</button>
      </div>
      <div id="fm_step2" style="display:none">
        <div style="background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.3);border-radius:10px;padding:0.8rem;margin-bottom:1rem;font-size:0.8rem;color:#10b981;text-align:center">✅ تم التحقق — عيّن كلمة مرور جديدة</div>
        <div style="margin-bottom:0.6rem">
          <label style="color:rgba(255,255,255,0.6);font-size:0.78rem;display:block;margin-bottom:0.3rem">كلمة المرور الجديدة</label>
          <input id="fm_p1" type="password" placeholder="أدخل كلمة مرور جديدة"
            style="width:100%;box-sizing:border-box;padding:0.7rem 1rem;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:10px;color:white;font-size:0.88rem;outline:none">
        </div>
        <div style="margin-bottom:0.8rem">
          <label style="color:rgba(255,255,255,0.6);font-size:0.78rem;display:block;margin-bottom:0.3rem">تأكيد كلمة المرور</label>
          <input id="fm_p2" type="password" placeholder="أعد كلمة المرور"
            style="width:100%;box-sizing:border-box;padding:0.7rem 1rem;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:10px;color:white;font-size:0.88rem;outline:none">
        </div>
        <button onclick="fm_reset()" style="width:100%;padding:0.75rem;background:linear-gradient(135deg,#10b981,#059669);border:none;border-radius:12px;color:white;font-weight:700;font-size:0.95rem;cursor:pointer;font-family:Tajawal,Arial,sans-serif;margin-bottom:0.5rem">✅ حفظ كلمة المرور الجديدة</button>
      </div>
      <div id="fm_msg" style="display:none;margin-top:0.5rem;font-size:0.78rem;text-align:center;padding:0.5rem;border-radius:8px"></div>
      <button onclick="document.getElementById('forgotModal').remove()" style="width:100%;margin-top:0.5rem;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:rgba(255,255,255,0.5);padding:0.6rem;cursor:pointer;font-family:Tajawal,Arial,sans-serif;font-size:0.85rem">إلغاء</button>
    </div>
  \`;
  document.body.appendChild(modal);
  // Close on backdrop click
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  setTimeout(() => document.getElementById('fm_email')?.focus(), 100);
}

function fm_verify() {
  const email = (document.getElementById('fm_email')||{}).value?.trim()?.toLowerCase();
  if (!email || !email.includes('@')) { fm_msg('أدخل بريداً إلكترونياً صحيحاً', '#ef4444'); return; }
  const users = JSON.parse(localStorage.getItem('mbrcst_users') || '[]');
  const found = users.find(u => (u.username||'').toLowerCase() === email || (u.email||'').toLowerCase() === email);
  // Allow reset even if no account (will create when logged in)
  document.getElementById('fm_step1').style.display = 'none';
  document.getElementById('fm_step2').style.display = 'block';
  sessionStorage.setItem('mbrcst_reset_email', email);
  if (!found) fm_msg('حساب جديد: ستتمكن من الدخول بكلمة المرور الجديدة', '#f59e0b');
}

function fm_reset() {
  const p1 = (document.getElementById('fm_p1')||{}).value;
  const p2 = (document.getElementById('fm_p2')||{}).value;
  if (!p1 || p1.length < 4) { fm_msg('كلمة المرور يجب ألا تقل عن 4 أحرف', '#ef4444'); return; }
  if (p1 !== p2) { fm_msg('كلمتا المرور غير متطابقتين ❌', '#ef4444'); return; }
  const email = sessionStorage.getItem('mbrcst_reset_email');
  if (!email) { fm_msg('خطأ، أعد المحاولة', '#ef4444'); return; }
  // Update or create user
  let users = JSON.parse(localStorage.getItem('mbrcst_users') || '[]');
  const idx = users.findIndex(u => (u.username||'').toLowerCase() === email);
  if (idx >= 0) { users[idx].password = btoa(p1); }
  else { users.push({ username: email, password: btoa(p1), fullName: email.split('@')[0], createdAt: new Date().toISOString() }); }
  localStorage.setItem('mbrcst_users', JSON.stringify(users));
  // Pre-fill login form
  const authEmail = document.getElementById('authEmail');
  const authPass  = document.getElementById('authPassword');
  if (authEmail) authEmail.value = email;
  if (authPass)  authPass.value  = p1;
  document.getElementById('forgotModal')?.remove();
  sessionStorage.removeItem('mbrcst_reset_email');
  // Show success
  const errEl = document.getElementById('authError');
  if (errEl) { errEl.style.color='#10b981'; errEl.style.display='block'; errEl.textContent='✅ تم تعيين كلمة المرور — اضغط تسجيل الدخول'; setTimeout(()=>{ errEl.style.display='none'; errEl.style.color=''; }, 4000); }
  if (typeof showToast === 'function') showToast('✅ تم تغيير كلمة المرور! اضغط تسجيل الدخول', 'success');
}

function fm_msg(text, color) {
  const el = document.getElementById('fm_msg');
  if (!el) return;
  el.style.display = 'block';
  el.style.color = color;
  el.style.background = color + '15';
  el.textContent = text;
}

function closeForgotModal() {
  const modal = document.getElementById('forgotModal');
  if (modal) modal.style.display = 'none';
}

function verifyForgotEmail() {
  const email = (document.getElementById('forgotEmail')||{}).value?.trim()?.toLowerCase();
  if (!email) { showForgotMsg('أدخل بريدك الإلكتروني', 'error'); return; }
  // Check localStorage users
  const users = JSON.parse(localStorage.getItem('mbrcst_users') || '[]');
  const found = users.find(u => u.username.toLowerCase() === email || u.email?.toLowerCase() === email);
  if (found) {
    document.getElementById('forgotStep1').style.display = 'none';
    document.getElementById('forgotStep2').style.display = 'block';
    document.getElementById('forgotMsg').style.display = 'none';
    // Store temp email for reset
    sessionStorage.setItem('mbrcst_reset_email', email);
  } else {
    // If no users list (old format), allow reset anyway
    const legacy = localStorage.getItem('mbrcst_password_' + email);
    if (legacy !== null) {
      document.getElementById('forgotStep1').style.display = 'none';
      document.getElementById('forgotStep2').style.display = 'block';
      sessionStorage.setItem('mbrcst_reset_email', email);
    } else {
      // Allow creating new account too
      showForgotMsg('لم نجد هذا الحساب. يمكنك إنشاء حساب جديد.', 'warn');
    }
  }
}

function resetPassword() {
  const p1 = (document.getElementById('newPassword1')||{}).value;
  const p2 = (document.getElementById('newPassword2')||{}).value;
  if (!p1 || p1.length < 4) { showForgotMsg('كلمة المرور يجب أن تكون 4 أحرف على الأقل', 'error'); return; }
  if (p1 !== p2) { showForgotMsg('كلمتا المرور غير متطابقتين', 'error'); return; }
  const email = sessionStorage.getItem('mbrcst_reset_email');
  if (!email) { showForgotMsg('خطأ، أعد المحاولة', 'error'); return; }
  // Update in users array
  const users = JSON.parse(localStorage.getItem('mbrcst_users') || '[]');
  const idx = users.findIndex(u => u.username.toLowerCase() === email || u.email?.toLowerCase() === email);
  if (idx >= 0) {
    users[idx].password = btoa(p1);
    localStorage.setItem('mbrcst_users', JSON.stringify(users));
  }
  // Also update legacy format
  localStorage.setItem('mbrcst_password_' + email, btoa(p1));
  // Auto-fill login form
  const loginEmailEl = document.getElementById('loginEmail') || document.getElementById('email');
  const loginPassEl = document.getElementById('loginPassword') || document.getElementById('password');
  if (loginEmailEl) loginEmailEl.value = email;
  if (loginPassEl) loginPassEl.value = p1;
  closeForgotModal();
  showToast('✅ تم تغيير كلمة المرور! يمكنك تسجيل الدخول الآن', 'success');
  sessionStorage.removeItem('mbrcst_reset_email');
}

function showForgotMsg(msg, type) {
  const el = document.getElementById('forgotMsg');
  if (!el) return;
  el.style.display = 'block';
  const colors = { error:'#ef4444', warn:'#f59e0b', success:'#10b981' };
  el.style.color = colors[type] || '#fff';
  el.textContent = msg;
}
