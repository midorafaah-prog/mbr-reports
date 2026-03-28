// ================================================================
// GAMIFICATION — POINTS, BADGES, STREAKS
// ================================================================
const BADGES_DEF = [
  { id:'first_report',  icon:'🌟', name:'البداية',       desc:'أنشأت أول تقرير',          req: r=>r>=1 },
  { id:'five_reports',  icon:'🏅', name:'نشيط',          desc:'أنشأت 5 تقارير',           req: r=>r>=5 },
  { id:'ten_reports',   icon:'🥈', name:'محترف',         desc:'أنشأت 10 تقارير',          req: r=>r>=10 },
  { id:'fifty_reports', icon:'🏆', name:'خبير التقارير', desc:'أنشأت 50 تقريراً',         req: r=>r>=50 },
  { id:'ai_user',       icon:'🤖', name:'صديق الذكاء',   desc:'استخدمت AI أكثر من 10 مرات', req: (r,p,ai)=>ai>=10 },
  { id:'fast_report',   icon:'⚡', name:'السرعة',        desc:'استخدمت تقرير 60 ثانية',   req: (r,p,ai,q)=>q>=1 },
  { id:'dept_template', icon:'📋', name:'منظّم',         desc:'استخدمت قوالب الأقسام',    req: (r,p,ai,q,t)=>t>=1 },
  { id:'points_100',    icon:'💎', name:'متميز',         desc:'جمعت 100 نقطة',            req: (r,p)=>p>=100 },
  { id:'points_500',    icon:'👑', name:'نجم المؤسسة',  desc:'جمعت 500 نقطة',            req: (r,p)=>p>=500 },
];

function getGamData() {
  const pfx = window._userPrefix || 'mbrcst_';
  return JSON.parse(localStorage.getItem(pfx+'gamification') || '{"points":0,"reports":0,"aiUses":0,"quickUses":0,"templateUses":0,"badges":[],"lastActivity":null,"streak":0}');
}
function saveGamData(d) {
  const pfx = window._userPrefix || 'mbrcst_';
  localStorage.setItem(pfx+'gamification', JSON.stringify(d));
}

function awardPoints(action, pts) {
  const d = getGamData();
  d.points = (d.points||0) + pts;
  if (action==='report_created') d.reports = (d.reports||0)+1;
  if (action==='ai_used') d.aiUses = (d.aiUses||0)+1;
  if (action==='quick_report') { d.quickUses = (d.quickUses||0)+1; d.reports = (d.reports||0)+1; }
  if (action==='template_used') d.templateUses = (d.templateUses||0)+1;

  // Check new badges
  const earned = [];
  BADGES_DEF.forEach(b => {
    if (!d.badges.includes(b.id) && b.req(d.reports||0, d.points||0, d.aiUses||0, d.quickUses||0, d.templateUses||0)) {
      d.badges.push(b.id);
      earned.push(b);
    }
  });
  saveGamData(d);
  updateGamUI();

  // Show badge toast
  earned.forEach(b => {
    setTimeout(() => showBadgeToast(b), 500);
  });
}

function showBadgeToast(badge) {
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:5rem;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#6c63ff,#00d4aa);color:white;padding:0.8rem 1.5rem;border-radius:14px;font-size:0.9rem;font-weight:700;z-index:99999;text-align:center;animation:slideUp 0.3s ease;direction:rtl;box-shadow:0 8px 30px rgba(108,99,255,0.4)';
  t.innerHTML = `<div style="font-size:1.5rem">${badge.icon}</div><div>شارة جديدة: ${badge.name}!</div><div style="font-size:0.75rem;opacity:0.85">${badge.desc}</div>`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

function updateGamUI() {
  const d = getGamData();
  const el = document.getElementById('gamPointsBadge');
  if (el) el.textContent = '⭐ '+d.points;
}

function showGamPanel() {
  const d = getGamData();
  const existing = document.getElementById('gamPanelOverlay');
  if (existing) { existing.remove(); return; }
  
  const overlay = document.createElement('div');
  overlay.id = 'gamPanelOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);z-index:9200;display:flex;align-items:center;justify-content:center;padding:1rem';
  
  const earnedBadges = BADGES_DEF.filter(b => d.badges.includes(b.id));
  const lockedBadges = BADGES_DEF.filter(b => !d.badges.includes(b.id));
  const level = d.points < 50 ? {name:'مبتدئ 🌱', next:50} : d.points < 200 ? {name:'محترف ⭐', next:200} : d.points < 500 ? {name:'خبير 💎', next:500} : {name:'نجم المؤسسة 👑', next:null};
  const pct = level.next ? Math.min(100, Math.round(d.points/level.next*100)) : 100;

  overlay.innerHTML = `
    <div style="background:#0f0f1a;border:1px solid rgba(108,99,255,0.25);border-radius:20px;width:min(700px,98vw);max-height:85vh;overflow-y:auto;padding:2rem;direction:rtl">
      <div style="display:flex;justify-content:space-between;margin-bottom:1.5rem">
        <h2 style="color:#f0f0f8;font-size:1.3rem;font-weight:900;margin:0">🏆 إنجازاتي وتقدمي</h2>
        <button onclick="document.getElementById('gamPanelOverlay').remove()" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#7878a0;padding:0.4rem 0.8rem;border-radius:8px;cursor:pointer">✕</button>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.8rem;margin-bottom:1.5rem">
        <div style="background:rgba(108,99,255,0.1);border:1px solid rgba(108,99,255,0.2);border-radius:12px;padding:1rem;text-align:center">
          <div style="font-size:1.8rem;font-weight:900;color:#a89cff">${d.points||0}</div>
          <div style="color:#7878a0;font-size:0.75rem">النقاط الكلية</div>
        </div>
        <div style="background:rgba(0,212,170,0.1);border:1px solid rgba(0,212,170,0.2);border-radius:12px;padding:1rem;text-align:center">
          <div style="font-size:1.8rem;font-weight:900;color:#00d4aa">${d.reports||0}</div>
          <div style="color:#7878a0;font-size:0.75rem">تقارير أنشأتها</div>
        </div>
        <div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2);border-radius:12px;padding:1rem;text-align:center">
          <div style="font-size:1.8rem;font-weight:900;color:#f59e0b">${d.badges?.length||0}</div>
          <div style="color:#7878a0;font-size:0.75rem">شارات مكتسبة</div>
        </div>
      </div>

      <div style="margin-bottom:1.5rem">
        <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem">
          <span style="color:#c4bfff;font-size:0.85rem;font-weight:700">المستوى: ${level.name}</span>
          <span style="color:#7878a0;font-size:0.75rem">${d.points||0}${level.next ? ' / '+level.next : ' (أعلى مستوى)'} نقطة</span>
        </div>
        <div style="height:8px;background:rgba(255,255,255,0.07);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#6c63ff,#00d4aa);border-radius:4px;transition:width 0.5s"></div>
        </div>
      </div>

      ${earnedBadges.length ? `<div style="margin-bottom:1rem"><div style="color:#00d4aa;font-weight:700;font-size:0.85rem;margin-bottom:0.7rem">✅ شاراتك المكتسبة (${earnedBadges.length})</div>
      <div style="display:flex;flex-wrap:wrap;gap:0.5rem">
        ${earnedBadges.map(b=>`<div style="background:rgba(0,212,170,0.08);border:1px solid rgba(0,212,170,0.2);border-radius:10px;padding:0.5rem 0.8rem;font-size:0.8rem;color:#e0e0f0">${b.icon} ${b.name}</div>`).join('')}
      </div></div>` : ''}

      ${lockedBadges.length ? `<div><div style="color:#7878a0;font-weight:700;font-size:0.85rem;margin-bottom:0.7rem">🔒 شارات قيد الفتح</div>
      <div style="display:flex;flex-wrap:wrap;gap:0.5rem">
        ${lockedBadges.map(b=>`<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:0.5rem 0.8rem;font-size:0.8rem;color:#555570" title="${b.desc}">🔒 ${b.name}</div>`).join('')}
      </div></div>` : ''}

      <div style="margin-top:1.5rem;padding:1rem;background:rgba(108,99,255,0.06);border:1px solid rgba(108,99,255,0.15);border-radius:12px">
        <div style="color:#a89cff;font-size:0.8rem;font-weight:700;margin-bottom:0.5rem">💡 كيف تكسب نقاطاً أكثر؟</div>
        <div style="color:#7878a0;font-size:0.77rem;line-height:1.7">
          📝 إنشاء تقرير → 10 نقاط | ⚡ تقرير 60 ثانية → 10 نقاط | 📋 استخدام قالب → 3 نقاط | 🤖 أدوات AI → 2 نقطة
        </div>
      </div>
    </div>
  `;
  overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

window.awardPoints = awardPoints;
window.showGamPanel = showGamPanel;
window.getGamData = getGamData;

// Init gamification UI on load
document.addEventListener('DOMContentLoaded', () => {
  updateGamUI();
});
