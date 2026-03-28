// ================================================================
// INFOGRAPHIC / VISUAL SUMMARY CARD GENERATOR
// ================================================================
async function generateInfographic() {
  const title = document.getElementById('reportTitle')?.value || 'التقرير الأسبوعي';
  const achievements = document.getElementById('achievements')?.value || '';
  const challenges = document.getElementById('challenges')?.value || '';
  const plan = document.getElementById('futurePlan')?.value || '';
  const period = document.getElementById('reportPeriod')?.value || 'أسبوعي';
  const today = new Date().toLocaleDateString('ar-SA');

  // Extract bullet points
  const achLines = achievements.split('\n').filter(l=>l.trim()).slice(0,5);
  const chalLines = challenges.split('\n').filter(l=>l.trim()).slice(0,3);
  const planLines = plan.split('\n').filter(l=>l.trim()).slice(0,3);

  const existing = document.getElementById('infographicOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'infographicOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);backdrop-filter:blur(10px);z-index:9300;display:flex;align-items:center;justify-content:center;padding:1rem;overflow-y:auto';

  const card = document.createElement('div');
  card.id = 'infographicCard';
  card.style.cssText = 'background:linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 50%,#0d0d1f 100%);border:1px solid rgba(108,99,255,0.3);border-radius:20px;width:min(620px,98vw);padding:2.5rem;direction:rtl;font-family:"IBM Plex Sans Arabic",sans-serif;position:relative';

  card.innerHTML = `
    <div style="position:absolute;top:0;right:0;bottom:0;left:0;border-radius:20px;overflow:hidden;pointer-events:none">
      <div style="position:absolute;top:-50px;right:-50px;width:200px;height:200px;background:radial-gradient(circle,rgba(108,99,255,0.15),transparent);border-radius:50%"></div>
      <div style="position:absolute;bottom:-50px;left:-50px;width:200px;height:200px;background:radial-gradient(circle,rgba(0,212,170,0.12),transparent);border-radius:50%"></div>
    </div>

    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem;position:relative">
      <div>
        <div style="background:linear-gradient(135deg,#6c63ff,#00d4aa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:0.8rem;font-weight:700;letter-spacing:1px">MBR REPORTS</div>
        <h2 style="color:#f0f0f8;font-size:1.2rem;font-weight:900;margin:0.3rem 0 0;line-height:1.4">${title}</h2>
        <div style="color:#7878a0;font-size:0.78rem;margin-top:0.3rem">📅 ${today} — تقرير ${period}</div>
      </div>
      <div style="background:linear-gradient(135deg,#6c63ff22,#00d4aa22);border:1px solid rgba(108,99,255,0.3);border-radius:12px;padding:0.5rem 0.8rem;text-align:center">
        <div style="font-size:1.5rem">📊</div>
        <div style="color:#a89cff;font-size:0.65rem;font-weight:700">ملخص بصري</div>
      </div>
    </div>

    ${achLines.length ? `
    <div style="margin-bottom:1.2rem;position:relative">
      <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.7rem">
        <div style="width:3px;height:20px;background:linear-gradient(#00d4aa,#6c63ff);border-radius:2px"></div>
        <span style="color:#00d4aa;font-weight:800;font-size:0.85rem">✅ الإنجازات</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:0.35rem">
        ${achLines.map(l=>`<div style="display:flex;align-items:flex-start;gap:0.5rem;background:rgba(0,212,170,0.06);border-right:2px solid rgba(0,212,170,0.4);padding:0.4rem 0.7rem;border-radius:0 8px 8px 0">
          <span style="color:#00d4aa;flex-shrink:0;margin-top:1px">›</span>
          <span style="color:#d0d0e8;font-size:0.82rem;line-height:1.5">${l.replace(/^[•\-\*]\s*/,'')}</span>
        </div>`).join('')}
      </div>
    </div>` : ''}

    ${chalLines.length ? `
    <div style="margin-bottom:1.2rem;position:relative">
      <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.7rem">
        <div style="width:3px;height:20px;background:linear-gradient(#f59e0b,#ef4444);border-radius:2px"></div>
        <span style="color:#f59e0b;font-weight:800;font-size:0.85rem">⚠️ التحديات</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:0.35rem">
        ${chalLines.map(l=>`<div style="display:flex;align-items:flex-start;gap:0.5rem;background:rgba(245,158,11,0.06);border-right:2px solid rgba(245,158,11,0.4);padding:0.4rem 0.7rem;border-radius:0 8px 8px 0">
          <span style="color:#f59e0b;flex-shrink:0;margin-top:1px">›</span>
          <span style="color:#d0d0e8;font-size:0.82rem;line-height:1.5">${l.replace(/^[•\-\*]\s*/,'')}</span>
        </div>`).join('')}
      </div>
    </div>` : ''}

    ${planLines.length ? `
    <div style="position:relative">
      <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.7rem">
        <div style="width:3px;height:20px;background:linear-gradient(#a855f7,#6c63ff);border-radius:2px"></div>
        <span style="color:#a89cff;font-weight:800;font-size:0.85rem">📋 الخطة القادمة</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:0.35rem">
        ${planLines.map(l=>`<div style="display:flex;align-items:flex-start;gap:0.5rem;background:rgba(108,99,255,0.06);border-right:2px solid rgba(108,99,255,0.4);padding:0.4rem 0.7rem;border-radius:0 8px 8px 0">
          <span style="color:#a89cff;flex-shrink:0;margin-top:1px">›</span>
          <span style="color:#d0d0e8;font-size:0.82rem;line-height:1.5">${l.replace(/^[•\-\*]\s*/,'')}</span>
        </div>`).join('')}
      </div>
    </div>` : ''}

    <div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between;align-items:center">
      <span style="color:#555570;font-size:0.7rem">Generated by MBR Reports AI</span>
      <div style="display:flex;gap:0.3rem">
        <div style="width:6px;height:6px;background:#6c63ff;border-radius:50%"></div>
        <div style="width:6px;height:6px;background:#00d4aa;border-radius:50%"></div>
        <div style="width:6px;height:6px;background:#a855f7;border-radius:50%"></div>
      </div>
    </div>
  `;

  const controls = document.createElement('div');
  controls.style.cssText = 'display:flex;gap:0.6rem;margin-top:1rem;justify-content:center;flex-wrap:wrap';
  controls.innerHTML = `
    <button onclick="downloadInfographic()" style="background:linear-gradient(135deg,#6c63ff,#00d4aa);border:none;color:white;padding:0.7rem 1.5rem;border-radius:12px;cursor:pointer;font-size:0.9rem;font-weight:700">📥 حفظ كصورة</button>
    <button onclick="copyInfographicText()" style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);color:#c4bfff;padding:0.7rem 1.2rem;border-radius:12px;cursor:pointer;font-size:0.85rem">📋 نسخ النص</button>
    <button onclick="document.getElementById('infographicOverlay').remove()" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#7878a0;padding:0.7rem 1rem;border-radius:12px;cursor:pointer;font-size:0.85rem">✕ إغلاق</button>
  `;

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center';
  wrapper.appendChild(card);
  wrapper.appendChild(controls);
  overlay.appendChild(wrapper);
  overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

async function downloadInfographic() {
  const card = document.getElementById('infographicCard');
  if (!card) return;
  if (typeof html2canvas === 'undefined') {
    showToast('جاري التحميل...', 'info');
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    s.onload = () => captureCard(card);
    document.head.appendChild(s);
  } else captureCard(card);
}

function captureCard(card) {
  html2canvas(card, { scale:2, useCORS:true, backgroundColor:'#0f0f1a' }).then(canvas => {
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'تقرير_ملخص_' + new Date().toLocaleDateString('ar-SA').replace(/\//g,'-') + '.png';
    a.click();
    showToast('✅ تم حفظ الإنفوجرافيك', 'success');
  });
}

function copyInfographicText() {
  const title = document.getElementById('reportTitle')?.value || '';
  const ach = document.getElementById('achievements')?.value || '';
  const chal = document.getElementById('challenges')?.value || '';
  const plan = document.getElementById('futurePlan')?.value || '';
  const text = `${title}\n\nالإنجازات:\n${ach}\n\nالتحديات:\n${chal}\n\nخطة الأسبوع القادم:\n${plan}`;
  navigator.clipboard.writeText(text).then(() => showToast('✅ تم النسخ', 'success'));
}

window.generateInfographic = generateInfographic;
window.downloadInfographic = downloadInfographic;
window.copyInfographicText = copyInfographicText;
