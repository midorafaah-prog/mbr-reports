// ================================================================
// VOICE INPUT (Web Speech API)
// ================================================================
function addVoiceInput(targetId) {
  if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
    showToast('متصفحك لا يدعم الإدخال الصوتي — استخدم Chrome', 'error'); return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new SR();
  rec.lang = 'ar-SA';
  rec.continuous = false;
  rec.interimResults = false;

  const el = document.getElementById(targetId);
  if (!el) return;

  const btn = el.parentElement?.querySelector('button[onclick*="addVoiceInput"]');
  const origText = btn ? btn.textContent : '';
  if (btn) { btn.textContent = '🔴 جاري التسجيل...'; btn.style.background = 'rgba(239,68,68,0.2)'; }

  rec.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    el.value = (el.value ? el.value + '\n' : '') + transcript;
    if (btn) { btn.textContent = origText; btn.style.background = ''; }
    showToast('✅ تم التسجيل الصوتي', 'success');
  };
  rec.onerror = () => {
    if (btn) { btn.textContent = origText; btn.style.background = ''; }
    showToast('لم يتم التعرف على الكلام — حاول مجدداً', 'error');
  };
  rec.onend = () => {
    if (btn) { btn.textContent = origText; btn.style.background = ''; }
  };
  try { rec.start(); } catch(e) { showToast('تعذّر تشغيل الميكروفون', 'error'); }
}

// Add voice button to all major textareas in create form
function injectVoiceButtons() {
  const targets = ['achievements','challenges','futurePlan','extraNotes','reportTitle'];
  targets.forEach(id => {
    const el = document.getElementById(id);
    if (!el || el.dataset.voiceAdded) return;
    el.dataset.voiceAdded = 'true';
    const voiceBtn = document.createElement('button');
    voiceBtn.type = 'button';
    voiceBtn.onclick = () => addVoiceInput(id);
    voiceBtn.style.cssText = 'margin-top:0.25rem;background:rgba(108,99,255,0.1);border:1px solid rgba(108,99,255,0.25);color:#a89cff;padding:0.2rem 0.6rem;border-radius:6px;cursor:pointer;font-size:0.72rem;display:inline-flex;align-items:center;gap:0.3rem';
    voiceBtn.innerHTML = '🎤 تحدث';
    el.insertAdjacentElement('afterend', voiceBtn);
  });
}

setTimeout(injectVoiceButtons, 1500);

// ================================================================
// PUSH NOTIFICATIONS — WEEKLY REMINDER
// ================================================================
async function requestPushPermission() {
  if (!('Notification' in window)) { showToast('متصفحك لا يدعم الإشعارات', 'error'); return; }
  const perm = await Notification.requestPermission();
  if (perm === 'granted') {
    showToast('✅ سيتم تذكيرك كل أسبوع بتقريرك', 'success');
    localStorage.setItem('mbrcst_push_enabled', 'true');
    scheduleWeeklyCheck();
    showPushSettingsBtn();
  } else {
    showToast('لم يتم السماح بالإشعارات', 'error');
  }
}

function scheduleWeeklyCheck() {
  // Check every hour if it's Sunday at 9am to send notification
  if (localStorage.getItem('mbrcst_push_enabled') !== 'true') return;
  const now = new Date();
  if (now.getDay() === 0 && now.getHours() === 9) {
    const lastNotif = localStorage.getItem('mbrcst_last_notif');
    const today = now.toDateString();
    if (lastNotif !== today) {
      new Notification('⏰ حان وقت تقريرك الأسبوعي!', {
        body: 'افتح MBR Reports وأنشئ تقريرك في أقل من دقيقة 🚀',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png'
      });
      localStorage.setItem('mbrcst_last_notif', today);
    }
  }
}

function showPushSettingsBtn() {
  const existing = document.getElementById('pushSettingsRow');
  if (existing) return;
  const settingsArea = document.getElementById('settingsSection') || document.querySelector('.settings-section');
  if (!settingsArea) return;
  const row = document.createElement('div');
  row.id = 'pushSettingsRow';
  row.style.cssText = 'display:flex;align-items:center;gap:0.7rem;padding:0.8rem;background:rgba(0,212,170,0.06);border:1px solid rgba(0,212,170,0.2);border-radius:10px;margin:0.5rem 0;direction:rtl';
  row.innerHTML = `<span style="font-size:1.2rem">🔔</span><span style="color:#e0e0f0;font-size:0.85rem;flex:1">التذكير الأسبوعي مفعّل — كل أحد ٩ صباحاً</span><button onclick="disablePush()" style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:#ef4444;padding:0.25rem 0.6rem;border-radius:6px;cursor:pointer;font-size:0.75rem">إلغاء</button>`;
  settingsArea.prepend(row);
}

function disablePush() {
  localStorage.removeItem('mbrcst_push_enabled');
  document.getElementById('pushSettingsRow')?.remove();
  showToast('تم إلغاء التذكير الأسبوعي', 'success');
}

// Add push button to settings section on load
function injectPushButton() {
  if (document.getElementById('pushEnableBtn')) return;
  const settingsSection = document.getElementById('sectionSettings') || document.querySelector('[data-section="settings"]');
  if (!settingsSection) return;
  const alreadyEnabled = localStorage.getItem('mbrcst_push_enabled') === 'true';
  const btn = document.createElement('button');
  btn.id = 'pushEnableBtn';
  btn.onclick = alreadyEnabled ? disablePush : requestPushPermission;
  btn.style.cssText = 'display:flex;align-items:center;gap:0.5rem;background:rgba(0,212,170,0.08);border:1px solid rgba(0,212,170,0.25);color:#00d4aa;padding:0.7rem 1.2rem;border-radius:10px;cursor:pointer;font-size:0.85rem;font-weight:700;margin:0.5rem 0;direction:rtl';
  btn.innerHTML = alreadyEnabled ? '🔔 التذكير الأسبوعي مفعّل — إلغاء' : '🔔 تفعيل تذكير تقرير الأسبوع';
  settingsSection.prepend(btn);
  if (alreadyEnabled) scheduleWeeklyCheck();
}

setTimeout(injectPushButton, 2000);
setInterval(scheduleWeeklyCheck, 3600000);

window.addVoiceInput = addVoiceInput;
window.requestPushPermission = requestPushPermission;
window.disablePush = disablePush;
