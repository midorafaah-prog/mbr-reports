// ================================================================
// TEAM BOARD — SHARE & VIEW TEAM REPORTS
// ================================================================
function showTeamBoard() {
  const existing = document.getElementById('teamBoardOverlay');
  if (existing) { existing.remove(); return; }
  const overlay = document.createElement('div');
  overlay.id = 'teamBoardOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.77);backdrop-filter:blur(9px);z-index:9400;display:flex;align-items:center;justify-content:center;padding:1rem';

  const pfx = window._userPrefix || 'mbrcst_';
  const teamReports = JSON.parse(localStorage.getItem(pfx+'team_reports') || '[]');

  overlay.innerHTML = `
    <div style="background:#0f0f1a;border:1px solid rgba(108,99,255,0.25);border-radius:20px;width:min(760px,98vw);max-height:85vh;overflow-y:auto;padding:2rem;direction:rtl">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
        <div>
          <h2 style="color:#f0f0f8;font-size:1.3rem;font-weight:900;margin:0">👥 لوحة الفريق</h2>
          <p style="color:#7878a0;font-size:0.8rem;margin:0.3rem 0 0">شارك تقريرك مع مديرك — اعرض تقارير الفريق</p>
        </div>
        <button onclick="document.getElementById('teamBoardOverlay').remove()" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#7878a0;padding:0.4rem 0.8rem;border-radius:8px;cursor:pointer">✕</button>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem">
        <div style="background:rgba(108,99,255,0.07);border:1px solid rgba(108,99,255,0.2);border-radius:14px;padding:1.2rem">
          <div style="color:#c4bfff;font-weight:700;font-size:0.9rem;margin-bottom:0.8rem">📤 مشاركة تقريرك</div>
          <p style="color:#7878a0;font-size:0.78rem;line-height:1.6;margin:0 0 0.8rem">أنشئ تقريرك من صفحة "إنشاء" ثم اضغط لتصديره كرمز مشاركة</p>
          <button onclick="exportReportToTeam()" style="background:linear-gradient(135deg,#6c63ff,#5a52f0);border:none;color:white;padding:0.6rem 1rem;border-radius:9px;cursor:pointer;font-size:0.82rem;font-weight:700;width:100%">📤 تصدير التقرير الحالي للفريق</button>
        </div>
        <div style="background:rgba(0,212,170,0.07);border:1px solid rgba(0,212,170,0.2);border-radius:14px;padding:1.2rem">
          <div style="color:#00d4aa;font-weight:700;font-size:0.9rem;margin-bottom:0.8rem">📥 استيراد تقرير زميل</div>
          <textarea id="teamImportCode" rows="3" placeholder="الصق كود التقرير هنا..." style="width:100%;background:rgba(0,212,170,0.05);border:1px solid rgba(0,212,170,0.2);color:#f0f0f8;padding:0.5rem;border-radius:8px;font-size:0.75rem;direction:rtl;resize:none;box-sizing:border-box;font-family:monospace"></textarea>
          <button onclick="importTeamReport()" style="background:rgba(0,212,170,0.15);border:1px solid rgba(0,212,170,0.3);color:#00d4aa;padding:0.5rem 1rem;border-radius:9px;cursor:pointer;font-size:0.82rem;font-weight:700;width:100%;margin-top:0.4rem">📥 استيراد</button>
        </div>
      </div>

      <div>
        <div style="color:#f0f0f8;font-weight:700;font-size:0.9rem;margin-bottom:0.8rem">📋 تقارير الفريق المشتركة (${teamReports.length})</div>
        ${teamReports.length === 0 ? `<div style="text-align:center;color:#555570;padding:2rem;background:rgba(255,255,255,0.02);border-radius:12px;border:1px dashed rgba(255,255,255,0.07)">
          <div style="font-size:2rem;margin-bottom:0.5rem">👥</div>
          <p style="margin:0;font-size:0.85rem">لا توجد تقارير مشتركة بعد<br>استورد تقارير زملائك من كودهم</p>
        </div>` : teamReports.map((r,i) => `
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:1rem;margin-bottom:0.6rem">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div>
                <div style="color:#f0f0f8;font-weight:700;font-size:0.88rem">${r.title || 'تقرير بدون عنوان'}</div>
                <div style="color:#7878a0;font-size:0.75rem;margin-top:0.2rem">${r.author || 'موظف'} — ${r.dept || ''} — ${r.date || ''}</div>
              </div>
              <button onclick="removeTeamReport(${i})" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);color:#ef4444;padding:0.2rem 0.5rem;border-radius:6px;cursor:pointer;font-size:0.7rem">حذف</button>
            </div>
            ${r.achievements ? `<div style="margin-top:0.6rem;background:rgba(0,212,170,0.05);border-right:2px solid rgba(0,212,170,0.3);padding:0.5rem 0.7rem;border-radius:0 8px 8px 0;color:#c0c0d8;font-size:0.78rem;white-space:pre-wrap">${r.achievements.substring(0,200)}${r.achievements.length>200?'...':''}</div>` : ''}
          </div>
        `).join('')}
      </div>

      ${teamReports.length >= 2 ? `
      <button onclick="generateTeamSummary()" style="margin-top:1rem;background:linear-gradient(135deg,#a855f7,#6c63ff);border:none;color:white;padding:0.7rem;border-radius:12px;cursor:pointer;font-size:0.9rem;font-weight:700;width:100%">
        🤖 توليد ملخص الفريق بالذكاء الاصطناعي
      </button>
      <div id="teamSummaryResult" style="display:none;margin-top:0.8rem;padding:1rem;background:rgba(168,85,247,0.06);border:1px solid rgba(168,85,247,0.2);border-radius:12px;color:#e0e0f0;font-size:0.85rem;line-height:1.7;direction:rtl;white-space:pre-wrap"></div>
      ` : ''}
    </div>
  `;
  overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

function exportReportToTeam() {
  const pfx = window._userPrefix || 'mbrcst_';
  const userData = JSON.parse(localStorage.getItem(pfx+'profile') || '{}');
  const report = {
    title: document.getElementById('reportTitle')?.value || 'تقرير',
    author: userData.name || userData.username || 'موظف',
    dept: document.getElementById('q60Dept')?.value || '',
    date: new Date().toLocaleDateString('ar-SA'),
    achievements: document.getElementById('achievements')?.value || '',
    challenges: document.getElementById('challenges')?.value || '',
    plan: document.getElementById('futurePlan')?.value || ''
  };
  const code = btoa(encodeURIComponent(JSON.stringify(report)));
  navigator.clipboard.writeText(code).then(() => {
    showToast('✅ تم نسخ كود التقرير — أرسله لمديرك', 'success');
  });
}

function importTeamReport() {
  const pfx = window._userPrefix || 'mbrcst_';
  const code = document.getElementById('teamImportCode')?.value?.trim();
  if (!code) { showToast('الصق كود التقرير أولاً', 'error'); return; }
  try {
    const report = JSON.parse(decodeURIComponent(atob(code)));
    const arr = JSON.parse(localStorage.getItem(pfx+'team_reports') || '[]');
    arr.unshift(report);
    localStorage.setItem(pfx+'team_reports', JSON.stringify(arr.slice(0,20)));
    showToast('✅ تم استيراد تقرير '+report.author, 'success');
    document.getElementById('teamBoardOverlay').remove();
    showTeamBoard();
  } catch(e) { showToast('كود غير صحيح', 'error'); }
}

function removeTeamReport(idx) {
  const pfx = window._userPrefix || 'mbrcst_';
  const arr = JSON.parse(localStorage.getItem(pfx+'team_reports') || '[]');
  arr.splice(idx, 1);
  localStorage.setItem(pfx+'team_reports', JSON.stringify(arr));
  document.getElementById('teamBoardOverlay').remove();
  showTeamBoard();
}

async function generateTeamSummary() {
  const pfx = window._userPrefix || 'mbrcst_';
  const reports = JSON.parse(localStorage.getItem(pfx+'team_reports') || '[]');
  const apiKey = localStorage.getItem('mbrcst_openai_key');
  if (!apiKey) { showToast('أضف OpenAI API Key في الإعدادات', 'error'); return; }
  const reportsText = reports.map(r=>`${r.author} (${r.dept}): إنجازات: ${r.achievements} | تحديات: ${r.challenges}`).join('\n\n');
  const btn = document.querySelector('#teamBoardOverlay button[onclick="generateTeamSummary()"]');
  if (btn) { btn.textContent = '⏳ جاري التلخيص...'; btn.disabled=true; }
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},
      body:JSON.stringify({model:'gpt-4o-mini',messages:[{role:'user',content:`أنت مساعد إداري. لخّص تقارير الفريق التالية في تقرير موحد للإدارة باللغة العربية:\n\n${reportsText}\n\nاصنع ملخصاً احترافياً يشمل: أبرز إنجازات الفريق، التحديات المشتركة، التوصيات.`}],max_tokens:600})
    });
    const data = await res.json();
    const result = document.getElementById('teamSummaryResult');
    if (result) { result.textContent = data.choices?.[0]?.message?.content || 'خطأ'; result.style.display='block'; }
  } catch(e) { showToast('خطأ في الاتصال', 'error'); }
  if (btn) { btn.textContent='🤖 توليد ملخص الفريق'; btn.disabled=false; }
}

window.showTeamBoard = showTeamBoard;
window.exportReportToTeam = exportReportToTeam;
window.importTeamReport = importTeamReport;
window.removeTeamReport = removeTeamReport;
window.generateTeamSummary = generateTeamSummary;
