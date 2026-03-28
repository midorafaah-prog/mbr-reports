// ================================================================
// DEPARTMENT TEMPLATES SYSTEM
// ================================================================
const DEPT_TEMPLATES = {
  hr: {
    name: '👥 الموارد البشرية', color: '#6c63ff',
    templates: [
      { name: 'تقرير أسبوعي HR', type: 'weekly', data: {
        title: 'تقرير الأسبوع — قسم الموارد البشرية',
        achievements: 'مراجعة {{X}} طلبات توظيف\nإتمام {{Y}} مقابلات عمل\nتوقيع {{Z}} عقود جديدة',
        challenges: 'نقص الكوادر في قسم ___\nتأخر في إجراءات التحقق',
        next_plan: 'متابعة طلبات التوظيف المعلقة\nإطلاق برنامج التدريب الشهري'
      }},
      { name: 'تقرير شهري HR', type: 'monthly', data: {
        title: 'التقرير الشهري — قسم الموارد البشرية',
        achievements: 'معدل الاحتفاظ بالموظفين: {{X}}%\nموظفين جدد: {{Y}}\nساعات تدريب: {{Z}} ساعة',
        challenges: 'ارتفاع معدل الدوران في القسم ___',
        next_plan: 'تحديث سياسة الأداء الربعية'
      }}
    ]
  },
  finance: {
    name: '💰 المالية', color: '#10b981',
    templates: [
      { name: 'تقرير مالي أسبوعي', type: 'weekly', data: {
        title: 'التقرير المالي الأسبوعي',
        achievements: 'إجمالي الإيرادات: {{X}} ريال\nالمصروفات: {{Y}} ريال\nصافي الربح: {{Z}} ريال',
        challenges: 'فاتورة معلقة بقيمة ___',
        next_plan: 'تحصيل المستحقات المتأخرة\nمراجعة ميزانية الربع القادم'
      }},
      { name: 'تقرير ميزانية شهري', type: 'monthly', data: {
        title: 'تقرير الميزانية الشهرية',
        achievements: 'نسبة تنفيذ الميزانية: {{X}}%\nوفر فعلي: {{Y}} ريال',
        challenges: 'تجاوز ميزانية قسم ___ بنسبة {{Z}}%',
        next_plan: 'مراجعة بنود الصرف وترشيد التكاليف'
      }}
    ]
  },
  it: {
    name: '💻 تقنية المعلومات', color: '#0ea5e9',
    templates: [
      { name: 'تقرير IT أسبوعي', type: 'weekly', data: {
        title: 'التقرير التقني الأسبوعي — قسم IT',
        achievements: 'تذاكر مُنجزة: {{X}} من أصل {{Y}}\nوقت التشغيل: {{Z}}%\nتحديثات نُنفّذت: ___',
        challenges: 'عطل في خادم ___ مدة {{X}} ساعة',
        next_plan: 'ترحيل خادم ___ للبنية الجديدة\nتحديث بروتوكولات الأمن'
      }},
      { name: 'تقرير الأمن السيبراني', type: 'monthly', data: {
        title: 'تقرير الأمن السيبراني الشهري',
        achievements: 'صفر اختراقات أمنية\nتم نسخ {{X}} خادم احتياطياً',
        challenges: 'محاولات اختراق: {{Y}} محاولة مسدودة',
        next_plan: 'تدريب الموظفين على الوعي الأمني'
      }}
    ]
  },
  operations: {
    name: '⚙️ العمليات', color: '#f59e0b',
    templates: [
      { name: 'تقرير عمليات أسبوعي', type: 'weekly', data: {
        title: 'تقرير العمليات الأسبوعي',
        achievements: 'إنتاجية الفريق: {{X}}%\nمهام مكتملة: {{Y}}\nمعدل الجودة: {{Z}}%',
        challenges: 'تأخر في تسليم مشروع ___',
        next_plan: 'مراجعة خط الإنتاج يوم ___ \nاجتماع متابعة المشاريع'
      }}
    ]
  },
  sales: {
    name: '📈 المبيعات', color: '#a855f7',
    templates: [
      { name: 'تقرير مبيعات أسبوعي', type: 'weekly', data: {
        title: 'تقرير المبيعات الأسبوعي',
        achievements: 'مبيعات الأسبوع: {{X}} ريال ({{Y}}% من الهدف)\nعملاء جدد: {{Z}}\nعروض مُقدّمة: ___',
        challenges: 'عميل رئيسي ___ تأخر في القرار',
        next_plan: 'متابعة {{X}} عرض معلق\nزيارة ميدانية للعملاء المحتملين'
      }},
      { name: 'تقرير مبيعات شهري', type: 'monthly', data: {
        title: 'تقرير المبيعات الشهري',
        achievements: 'إجمالي المبيعات: {{X}} ريال\nنمو مقارنة بالشهر السابق: {{Y}}%\nأعلى منتج مبيعاً: ___',
        challenges: 'انخفاض مبيعات منطقة ___',
        next_plan: 'حملة ترويجية للمنتج ___ في الربع القادم'
      }}
    ]
  },
  admin: {
    name: '📋 الإدارية', color: '#ef4444',
    templates: [
      { name: 'تقرير إداري أسبوعي', type: 'weekly', data: {
        title: 'التقرير الإداري الأسبوعي',
        achievements: 'اجتماعات منعقدة: {{X}}\nقرارات اتُّخذت: {{Y}}\nمراسلات صادرة: {{Z}}',
        challenges: 'تأخر في قرار اعتماد مشروع ___',
        next_plan: 'متابعة القرارات المُعلّقة\nإعداد تقرير مجلس الإدارة'
      }}
    ]
  }
};

function showTemplatesPanel() {
  const existing = document.getElementById('templatesPanelOverlay');
  if (existing) { existing.remove(); return; }
  
  const overlay = document.createElement('div');
  overlay.id = 'templatesPanelOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);z-index:9000;display:flex;align-items:center;justify-content:center;padding:1rem';
  
  const panel = document.createElement('div');
  panel.style.cssText = 'background:#0f0f1a;border:1px solid rgba(108,99,255,0.2);border-radius:20px;width:min(900px,98vw);max-height:85vh;overflow-y:auto;padding:2rem;direction:rtl';
  
  let html = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
      <div>
        <h2 style="color:#f0f0f8;font-size:1.4rem;font-weight:900;margin:0">📋 قوالب الأقسام الجاهزة</h2>
        <p style="color:#7878a0;font-size:0.85rem;margin:0.3rem 0 0">اختر قسمك وابدأ التقرير في 30 ثانية</p>
      </div>
      <button onclick="document.getElementById('templatesPanelOverlay').remove()" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#7878a0;padding:0.4rem 0.8rem;border-radius:8px;cursor:pointer;font-size:1rem">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem">
  `;
  
  for (const [key, dept] of Object.entries(DEPT_TEMPLATES)) {
    html += `
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:1.2rem;cursor:pointer;transition:all 0.2s" 
           onmouseenter="this.style.borderColor='${dept.color}55';this.style.background='rgba('+hexToRgb('${dept.color}')+',0.06)'"
           onmouseleave="this.style.borderColor='rgba(255,255,255,0.08)';this.style.background='rgba(255,255,255,0.03)'">
        <div style="font-size:1.5rem;margin-bottom:0.5rem">${dept.name.split(' ')[0]}</div>
        <div style="color:#f0f0f8;font-weight:700;margin-bottom:0.8rem;font-size:0.95rem">${dept.name.substring(dept.name.indexOf(' ')+1)}</div>
        <div style="display:flex;flex-direction:column;gap:0.4rem">
          ${dept.templates.map(t => `
            <button onclick="loadDeptTemplate('${key}','${dept.templates.indexOf(t)}')" 
              style="text-align:right;background:rgba(${hexToRgb(dept.color)},0.12);border:1px solid rgba(${hexToRgb(dept.color)},0.25);color:#ddd;padding:0.4rem 0.7rem;border-radius:8px;cursor:pointer;font-size:0.78rem;transition:all 0.15s"
              onmouseenter="this.style.background='rgba(${hexToRgb(dept.color)},0.25)'"
              onmouseleave="this.style.background='rgba(${hexToRgb(dept.color)},0.12)'">
              📄 ${t.name}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }
  html += `</div>`;
  panel.innerHTML = html;
  overlay.appendChild(panel);
  overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return r+','+g+','+b;
}

function loadDeptTemplate(deptKey, tplIndex) {
  const dept = DEPT_TEMPLATES[deptKey];
  if (!dept) return;
  const tpl = dept.templates[parseInt(tplIndex)];
  if (!tpl) return;
  
  // Load into create form
  const titleEl = document.getElementById('reportTitle');
  const achEl = document.getElementById('achievements');
  const chalEl = document.getElementById('challenges');
  const planEl = document.getElementById('futurePlan');
  
  if (titleEl) titleEl.value = tpl.data.title;
  if (achEl) achEl.value = tpl.data.achievements;
  if (chalEl) chalEl.value = tpl.data.challenges;
  if (planEl) planEl.value = tpl.data.next_plan;
  
  // Set period type
  const periodSel = document.getElementById('reportPeriod') || document.querySelector('[name="period"]');
  if (periodSel && tpl.type) periodSel.value = tpl.type;

  document.getElementById('templatesPanelOverlay')?.remove();
  showSection('create');
  showToast('✅ تم تحميل القالب — عدّل الأرقام واضغط توليد!', 'success');
  awardPoints('template_used', 3);
}

window.showTemplatesPanel = showTemplatesPanel;
window.loadDeptTemplate = loadDeptTemplate;

// === أقسام إدارة المرافق والأمن والسلامة ===
DEPT_TEMPLATES.facilities = {
  name: '🏢 إدارة المرافق', color: '#f59e0b',
  templates: [
    { name: 'تقرير المرافق الأسبوعي', type: 'weekly', data: {
      title: 'تقرير إدارة المرافق الأسبوعي',
      achievements: 'طلبات صيانة مُنجزة: {{X}} من أصل {{Y}}\nمباني خضعت للفحص الدوري: {{Z}}\nساعات تشغيل المرافق: {{A}} ساعة\nتوفير في استهلاك الطاقة: {{B}}%',
      challenges: 'عطل في نظام التكييف بالمبنى ___\nتأخر في توريد قطع غيار ___\nطلبات صيانة معلقة: {{X}} طلب',
      next_plan: 'الفحص الدوري لمبنى ___\nتجديد عقد صيانة ___ مع مزود الخدمة\nمتابعة طلبات الصيانة المعلقة'
    }},
    { name: 'تقرير الصيانة الشهري', type: 'monthly', data: {
      title: 'التقرير الشهري — إدارة المرافق والصيانة',
      achievements: 'إجمالي طلبات الصيانة المستلمة: {{X}}\nنسبة الإنجاز في الوقت المحدد: {{Y}}%\nمتوسط وقت الاستجابة: {{Z}} ساعة\nتكلفة الصيانة الشهرية: {{A}} ريال',
      challenges: 'أجهزة تحتاج استبدال: {{X}} جهاز\nعقود مرافق منتهية الصلاحية: ___',
      next_plan: 'جدولة الصيانة الوقائية الربعية\nتحديث سجلات المرافق والمعدات\nمراجعة عقود الخدمات الخارجية'
    }},
    { name: 'تقرير استهلاك الطاقة', type: 'monthly', data: {
      title: 'تقرير استهلاك الطاقة والمياه الشهري',
      achievements: 'استهلاك الكهرباء: {{X}} كيلوواط (تغير {{Y}}% عن الشهر الماضي)\nاستهلاك المياه: {{Z}} متر مكعب\nتوفير محقق: {{A}} ريال',
      challenges: 'ارتفاع الاستهلاك في المبنى ___ بنسبة {{X}}%',
      next_plan: 'تركيب أجهزة استشعار للإضاءة الذكية\nمراجعة أوقات تشغيل المكيفات'
    }}
  ]
};

DEPT_TEMPLATES.safety = {
  name: '🛡️ الأمن والسلامة', color: '#ef4444',
  templates: [
    { name: 'تقرير الأمن الأسبوعي', type: 'weekly', data: {
      title: 'تقرير الأمن والسلامة الأسبوعي',
      achievements: 'جولات أمنية مُنفّذة: {{X}} جولة\nحوادث مُسجّلة: {{Y}} حادثة ({{Z}} منها مُعالجة)\nكاميرات مراقبة تعمل: {{A}}%\nعدد الزوار المسجلين: {{B}} زائر',
      challenges: 'كاميرا معطلة في موقع ___\nبلاغ أمني عن ___ في تاريخ ___',
      next_plan: 'تدريب على إجراءات الطوارئ يوم ___\nصيانة دورية لأجهزة الإنذار\nمراجعة بطاقات الدخول المنتهية'
    }},
    { name: 'تقرير السلامة المهنية', type: 'monthly', data: {
      title: 'تقرير السلامة المهنية الشهري',
      achievements: 'أيام بدون حوادث: {{X}} يوم متتالي\nتدريبات سلامة مُنفّذة: {{Y}} تدريب\nعدد المُدرَّبين: {{Z}} موظف\nفحوصات معدات السلامة: {{A}}',
      challenges: 'حادث طفيف في موقع ___ بتاريخ ___\nمعدات إطفاء تحتاج صيانة: {{X}} جهاز',
      next_plan: 'تدريب إخلاء الطوارئ الربعي\nتجديد شهادات السلامة المهنية\nمراجعة خطة الأزمات وخطوط الإخلاء'
    }},
    { name: 'تقرير الحوادث والمخالفات', type: 'weekly', data: {
      title: 'تقرير الحوادث والمخالفات الأمنية',
      achievements: 'مخالفات مُعالجة: {{X}}\nبلاغات تمت معالجتها: {{Y}} بلاغ\nزمن الاستجابة للطوارئ: {{Z}} دقيقة',
      challenges: 'مخالفة دخول غير مصرح به في ___\nجهاز إنذار حريق يحتاج معايرة في ___',
      next_plan: 'تحديث إجراءات الاستجابة للطوارئ\nمراجعة بروتوكول التحقيق في الحوادث'
    }}
  ]
};

