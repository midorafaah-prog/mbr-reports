// ================================================================
// QUICK 60-SECOND REPORT WIZARD
// ================================================================
function showQuick60Report() {
  const existing = document.getElementById('quick60Overlay');
  if (existing) { existing.remove(); return; }

  const overlay = document.createElement('div');
  overlay.id = 'quick60Overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);backdrop-filter:blur(10px);z-index:9100;display:flex;align-items:center;justify-content:center;padding:1rem';

  overlay.innerHTML = `
    <div style="background:#0f0f1a;border:1px solid rgba(108,99,255,0.3);border-radius:20px;width:min(640px,98vw);padding:2rem;direction:rtl;max-height:90vh;overflow-y:auto">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
        <div>
          <h2 style="color:#f0f0f8;font-size:1.3rem;font-weight:900;margin:0">⚡ تقرير في 60 ثانية</h2>
          <p style="color:#7878a0;font-size:0.8rem;margin:0.3rem 0 0">أجب على 3 أسئلة — AI يكمل التقرير</p>
        </div>
        <button onclick="document.getElementById('quick60Overlay').remove()" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#7878a0;padding:0.4rem 0.8rem;border-radius:8px;cursor:pointer">✕</button>
      </div>

      <div style="margin-bottom:1rem">
        <label style="color:#c4bfff;font-size:0.85rem;font-weight:700;display:block;margin-bottom:0.4rem">🏢 اسمك وقسمك</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem">
          <input id="q60Name" placeholder="اسمك" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#f0f0f8;padding:0.6rem 0.8rem;border-radius:9px;font-size:0.85rem;direction:rtl;width:100%;box-sizing:border-box">
          <select id="q60Dept" style="background:#1a1a2e;border:1px solid rgba(255,255,255,0.1);color:#f0f0f8;padding:0.6rem 0.8rem;border-radius:9px;font-size:0.85rem;direction:rtl;width:100%">
            <option value="الموارد البشرية">👥 الموارد البشرية</option>
            <option value="المالية">💰 المالية</option>
            <option value="تقنية المعلومات">💻 تقنية المعلومات</option>
            <option value="العمليات">⚙️ العمليات</option>
            <option value="المبيعات">📈 المبيعات</option>
            <option value="إدارة المرافق">🏢 إدارة المرافق</option>
            <option value="الأمن والسلامة">🛡️ الأمن والسلامة</option>
            <option value="الإدارية">📋 الإدارية</option>
          </select>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:1rem">
        <div>
          <label style="color:#00d4aa;font-size:0.85rem;font-weight:700;display:block;margin-bottom:0.4rem">✅ سؤال 1: ماذا أنجزت هذا الأسبوع؟</label>
          <textarea id="q60Q1" rows="3" placeholder="مثال: أكملت 5 طلبات صيانة، نفّذت تدريب الطوارئ، أتممت صيانة ٣ مواقع..." style="width:100%;background:rgba(0,212,170,0.05);border:1px solid rgba(0,212,170,0.2);color:#f0f0f8;padding:0.7rem;border-radius:9px;font-size:0.85rem;direction:rtl;resize:vertical;box-sizing:border-box;font-family:inherit"></textarea>
          <button onclick="addVoiceInput('q60Q1')" style="margin-top:0.3rem;background:rgba(0,212,170,0.1);border:1px solid rgba(0,212,170,0.2);color:#00d4aa;padding:0.25rem 0.6rem;border-radius:6px;cursor:pointer;font-size:0.75rem">🎤 إدخال صوتي</button>
        </div>

        <div>
          <label style="color:#f59e0b;font-size:0.85rem;font-weight:700;display:block;margin-bottom:0.4rem">⚠️ سؤال 2: ما التحديات أو المشكلات؟</label>
          <textarea id="q60Q2" rows="2" placeholder="مثال: عطل في نظام التكييف، نقص في قطع الغيار..." style="width:100%;background:rgba(245,158,11,0.05);border:1px solid rgba(245,158,11,0.2);color:#f0f0f8;padding:0.7rem;border-radius:9px;font-size:0.85rem;direction:rtl;resize:vertical;box-sizing:border-box;font-family:inherit"></textarea>
          <button onclick="addVoiceInput('q60Q2')" style="margin-top:0.3rem;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.25);color:#f59e0b;padding:0.25rem 0.6rem;border-radius:6px;cursor:pointer;font-size:0.75rem">🎤 إدخال صوتي</button>
        </div>

        <div>
          <label style="color:#a89cff;font-size:0.85rem;font-weight:700;display:block;margin-bottom:0.4rem">📋 سؤال 3: ما خطتك للأسبوع القادم؟</label>
          <textarea id="q60Q3" rows="2" placeholder="مثال: صيانة مبنى B، الفحص الدوري لكاميرات المراقبة..." style="width:100%;background:rgba(108,99,255,0.05);border:1px solid rgba(108,99,255,0.2);color:#f0f0f8;padding:0.7rem;border-radius:9px;font-size:0.85rem;direction:rtl;resize:vertical;box-sizing:border-box;font-family:inherit"></textarea>
          <button onclick="addVoiceInput('q60Q3')" style="margin-top:0.3rem;background:rgba(108,99,255,0.1);border:1px solid rgba(108,99,255,0.25);color:#a89cff;padding:0.25rem 0.6rem;border-radius:6px;cursor:pointer;font-size:0.75rem">🎤 إدخال صوتي</button>
        </div>
      </div>

      <div style="display:flex;gap:0.7rem;margin-top:1.5rem">
        <button onclick="generateQuick60()" style="flex:1;background:linear-gradient(135deg,#6c63ff,#00d4aa);border:none;color:white;padding:0.8rem;border-radius:12px;font-size:1rem;font-weight:800;cursor:pointer">
          🚀 توليد التقرير الكامل بالذكاء الاصطناعي
        </button>
        <button onclick="loadToForm60()" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#c4bfff;padding:0.8rem 1rem;border-radius:12px;cursor:pointer;font-size:0.85rem">
          📝 أدخل يدوياً
        </button>
      </div>

      <div id="quick60Result" style="display:none;margin-top:1.2rem;padding:1rem;background:rgba(0,212,170,0.05);border:1px solid rgba(0,212,170,0.2);border-radius:12px">
        <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem">
          <span style="color:#00d4aa;font-weight:700;font-size:0.85rem">✅ تقريرك جاهز!</span>
          <button onclick="copyQuick60()" style="background:rgba(0,212,170,0.15);border:1px solid rgba(0,212,170,0.3);color:#00d4aa;padding:0.2rem 0.6rem;border-radius:6px;cursor:pointer;font-size:0.75rem">📋 نسخ</button>
        </div>
        <div id="quick60Text" style="color:#e0e0f0;font-size:0.85rem;line-height:1.7;white-space:pre-wrap"></div>
        <button onclick="sendQuick60ToForm()" style="margin-top:0.8rem;background:linear-gradient(135deg,#6c63ff,#5a52f0);border:none;color:white;padding:0.5rem 1rem;border-radius:8px;cursor:pointer;font-size:0.82rem;width:100%">📨 أرسل للنموذج الكامل للتحرير والتصدير</button>
      </div>
    </div>
  `;

  overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

async function generateQuick60() {
  const name = document.getElementById('q60Name').value.trim() || 'الموظف';
  const dept = document.getElementById('q60Dept').value;
  const q1 = document.getElementById('q60Q1').value.trim();
  const q2 = document.getElementById('q60Q2').value.trim();
  const q3 = document.getElementById('q60Q3').value.trim();
  if (!q1) { showToast('أجب على السؤال الأول على الأقل', 'error'); return; }

  const btn = document.querySelector('#quick60Overlay button[onclick="generateQuick60()"]');
  if (btn) { btn.textContent = '⏳ جاري التوليد...'; btn.disabled = true; }

  const apiKey = localStorage.getItem('mbrcst_openai_key');
  if (!apiKey) {
    showToast('أضف OpenAI API Key في الإعدادات', 'error');
    if (btn) { btn.textContent = '🚀 توليد التقرير'; btn.disabled = false; }
    return;
  }

  const today = new Date().toLocaleDateString('ar-SA');
  const prompt = `أنت كاتب تقارير مؤسسية محترف. اكتب تقريراً أسبوعياً احترافياً باللغة العربية لـ ${name} من قسم ${dept} بتاريخ ${today}.
المعلومات:
- الإنجازات: ${q1}
- التحديات: ${q2 || 'لا توجد تحديات جوهرية هذا الأسبوع'}
- خطة الأسبوع القادم: ${q3 || 'متابعة الأعمال الجارية'}

اكتب التقرير بأسلوب مؤسسي رسمي، منظماً بعناوين، مع إبراز الأرقام والإنجازات. التقرير يجب أن يكون من 3-4 فقرات احترافية.`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: {'Content-Type':'application/json','Authorization':'Bearer '+apiKey},
      body: JSON.stringify({ model:'gpt-4o-mini', messages:[{role:'user',content:prompt}], max_tokens:800 })
    });
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || 'حدث خطأ في التوليد';
    document.getElementById('quick60Text').textContent = text;
    document.getElementById('quick60Result').style.display = 'block';
    awardPoints('quick_report', 10);
    showToast('🎉 +10 نقاط! تقريرك جاهز', 'success');
  } catch(e) {
    showToast('خطأ في الاتصال بـ AI', 'error');
  }
  if (btn) { btn.textContent = '🚀 توليد التقرير الكامل'; btn.disabled = false; }
}

function copyQuick60() {
  const text = document.getElementById('quick60Text').textContent;
  navigator.clipboard.writeText(text).then(() => showToast('✅ تم النسخ', 'success'));
}

function sendQuick60ToForm() {
  const text = document.getElementById('quick60Text').textContent;
  const dept = document.getElementById('q60Dept').value;
  const titleEl = document.getElementById('reportTitle');
  const achEl = document.getElementById('achievements');
  if (titleEl) titleEl.value = `التقرير الأسبوعي — ${dept}`;
  if (achEl) achEl.value = text;
  document.getElementById('quick60Overlay').remove();
  showSection('create');
  showToast('✅ تم نقل التقرير للنموذج الكامل', 'success');
}

function loadToForm60() {
  const dept = document.getElementById('q60Dept').value;
  const q1 = document.getElementById('q60Q1').value;
  const q2 = document.getElementById('q60Q2').value;
  const q3 = document.getElementById('q60Q3').value;
  const titleEl = document.getElementById('reportTitle');
  const achEl = document.getElementById('achievements');
  const chalEl = document.getElementById('challenges');
  const planEl = document.getElementById('futurePlan');
  if (titleEl) titleEl.value = `التقرير الأسبوعي — ${dept}`;
  if (achEl) achEl.value = q1;
  if (chalEl) chalEl.value = q2;
  if (planEl) planEl.value = q3;
  document.getElementById('quick60Overlay').remove();
  showSection('create');
}

window.showQuick60Report = showQuick60Report;
window.generateQuick60 = generateQuick60;
window.copyQuick60 = copyQuick60;
window.sendQuick60ToForm = sendQuick60ToForm;
window.loadToForm60 = loadToForm60;
