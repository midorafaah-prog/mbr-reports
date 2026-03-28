// ================================================================
// FACILITIES & SAFETY MANAGEMENT MODULE
// ================================================================

const FSM_DATA = {
  maintenanceTypes: ['ميكانيكي','كهربائي','تكييف وتهوية','سباكة','نجارة','اتصالات','حريق وإنذار','أمن وكاميرات','نظافة','تشجير'],
  buildings: ['المبنى الرئيسي','المبنى A','المبنى B','المبنى C','المستودع','موقف السيارات','المسجد','المطبخ','قاعة الاجتماعات','المنطقة الخارجية'],
  priorities: [{val:'عاجل',color:'#ef4444'},{val:'عالي',color:'#f59e0b'},{val:'متوسط',color:'#3b82f6'},{val:'منخفض',color:'#6b7280'}],
  incidentTypes: ['حريق / دخان','اقتحام / دخول غير مصرح','حادث عمل','سرقة','تخريب ممتلكات','عطل طارئ','حادث مروري داخلي','إخلاء طارئ','بلاغ مشبوه','غير ذلك']
};

function getPfx() { return (window._userPrefix || 'mbrcst_') + 'fsm_'; }
function getFSM(key) { return JSON.parse(localStorage.getItem(getPfx()+key) || '[]'); }
function saveFSM(key, val) { localStorage.setItem(getPfx()+key, JSON.stringify(val)); }

// ── MAIN PANEL ──────────────────────────────────────────────────
function showFacilitiesPanel() {
  const ex = document.getElementById('fsmOverlay'); if(ex){ex.remove();return;}
  const overlay = document.createElement('div');
  overlay.id = 'fsmOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);backdrop-filter:blur(10px);z-index:9500;display:flex;align-items:flex-start;justify-content:center;padding:0.5rem;overflow-y:auto';

  const reqs = getFSM('maintenance');
  const incidents = getFSM('incidents');
  const inspections = getFSM('inspections');
  const pendingReqs = reqs.filter(r=>r.status==='معلّق').length;
  const criticalInc = incidents.filter(i=>i.severity==='حرج'||i.severity==='عالي').length;

  overlay.innerHTML = `
  <div style="background:#0a0a1a;border:1px solid rgba(245,158,11,0.2);border-radius:20px;width:min(980px,99vw);margin:0.5rem auto;direction:rtl;overflow:hidden">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a1000,#0f0f1a);padding:1.5rem 2rem;border-bottom:1px solid rgba(245,158,11,0.15);display:flex;justify-content:space-between;align-items:center">
      <div>
        <h2 style="color:#f0f0f8;font-size:1.3rem;font-weight:900;margin:0;display:flex;align-items:center;gap:0.5rem">
          <span style="font-size:1.5rem">🏢</span> إدارة المرافق والأمن والسلامة
        </h2>
        <p style="color:#7878a0;font-size:0.78rem;margin:0.3rem 0 0">نظام متكامل لإدارة طلبات الصيانة والحوادث والتفتيش</p>
      </div>
      <button onclick="document.getElementById('fsmOverlay').remove()" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#7878a0;padding:0.4rem 0.9rem;border-radius:8px;cursor:pointer;font-size:1rem">✕</button>
    </div>

    <!-- Stats Bar -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-bottom:1px solid rgba(255,255,255,0.06)">
      ${[
        {icon:'🔧',val:reqs.length,label:'طلبات الصيانة',color:'#6c63ff',bg:'rgba(108,99,255,0.07)'},
        {icon:'⚠️',val:pendingReqs,label:'طلبات معلّقة',color:'#f59e0b',bg:'rgba(245,158,11,0.07)'},
        {icon:'🚨',val:incidents.length,label:'حوادث مسجّلة',color:'#ef4444',bg:'rgba(239,68,68,0.07)'},
        {icon:'📋',val:inspections.length,label:'جولات تفتيش',color:'#00d4aa',bg:'rgba(0,212,170,0.07)'},
      ].map(s=>`
        <div style="background:${s.bg};padding:1rem;text-align:center;border-left:1px solid rgba(255,255,255,0.05)">
          <div style="font-size:1.3rem">${s.icon}</div>
          <div style="color:${s.color};font-size:1.6rem;font-weight:900">${s.val}</div>
          <div style="color:#7878a0;font-size:0.72rem">${s.label}</div>
        </div>`).join('')}
    </div>

    <!-- Tab Nav -->
    <div style="display:flex;background:rgba(0,0,0,0.3);border-bottom:1px solid rgba(255,255,255,0.06)">
      ${[
        {id:'fsm_tab_maint',label:'🔧 طلبات الصيانة',fn:'fsmShowTab("maint")'},
        {id:'fsm_tab_incident',label:'🚨 الحوادث والبلاغات',fn:'fsmShowTab("incident")'},
        {id:'fsm_tab_inspect',label:'🔍 جولات التفتيش',fn:'fsmShowTab("inspect")'},
        {id:'fsm_tab_report',label:'📊 التقرير الذكي',fn:'fsmShowTab("report")'},
      ].map((t,i)=>`
        <button id="${t.id}" onclick="${t.fn}" style="flex:1;padding:0.8rem;background:${i===0?'rgba(108,99,255,0.12)':'transparent'};border:none;border-bottom:2px solid ${i===0?'#6c63ff':'transparent'};color:${i===0?'#c4bfff':'#7878a0'};font-size:0.78rem;font-weight:700;cursor:pointer;transition:all 0.2s;font-family:inherit">${t.label}</button>
      `).join('')}
    </div>

    <!-- Tab Content -->
    <div id="fsmTabContent" style="padding:1.5rem">
      ${buildMaintenanceTab()}
    </div>

  </div>`;
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

function fsmShowTab(tab) {
  // Update tab styles
  ['maint','incident','inspect','report'].forEach(t=>{
    const btn = document.getElementById('fsm_tab_'+t);
    if(!btn) return;
    const active = t===tab;
    btn.style.background = active?'rgba(108,99,255,0.12)':'transparent';
    btn.style.borderBottom = active?'2px solid #6c63ff':'2px solid transparent';
    btn.style.color = active?'#c4bfff':'#7878a0';
  });
  const content = document.getElementById('fsmTabContent');
  if(!content) return;
  if(tab==='maint') content.innerHTML = buildMaintenanceTab();
  else if(tab==='incident') content.innerHTML = buildIncidentTab();
  else if(tab==='inspect') content.innerHTML = buildInspectTab();
  else if(tab==='report') { content.innerHTML = buildReportTab(); }
}

// ── MAINTENANCE TAB ──────────────────────────────────────────────
function buildMaintenanceTab() {
  const reqs = getFSM('maintenance');
  return `
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem">
    <!-- Form -->
    <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:1.2rem">
      <div style="color:#c4bfff;font-weight:800;font-size:0.9rem;margin-bottom:1rem">➕ طلب صيانة جديد</div>
      <div style="display:flex;flex-direction:column;gap:0.6rem">
        <select id="fsm_m_building" style="${fsmSelectStyle()}">
          ${FSM_DATA.buildings.map(b=>`<option>${b}</option>`).join('')}
        </select>
        <select id="fsm_m_type" style="${fsmSelectStyle()}">
          ${FSM_DATA.maintenanceTypes.map(t=>`<option>${t}</option>`).join('')}
        </select>
        <textarea id="fsm_m_desc" rows="3" placeholder="وصف المشكلة بالتفصيل..." style="${fsmTextareaStyle()}"></textarea>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem">
          <select id="fsm_m_priority" style="${fsmSelectStyle()}">
            ${FSM_DATA.priorities.map(p=>`<option value="${p.val}">${p.val}</option>`).join('')}
          </select>
          <input id="fsm_m_requester" placeholder="اسم مقدم الطلب" style="${fsmInputStyle()}">
        </div>
        <button onclick="fsmAddMaintenance()" style="${fsmBtnStyle('#6c63ff')}">🔧 تسجيل طلب الصيانة</button>
      </div>
    </div>

    <!-- List -->
    <div>
      <div style="color:#f0f0f8;font-weight:800;font-size:0.9rem;margin-bottom:0.8rem">📋 الطلبات المسجّلة (${reqs.length})</div>
      <div style="display:flex;flex-direction:column;gap:0.5rem;max-height:420px;overflow-y:auto">
        ${reqs.length===0?`<div style="text-align:center;color:#555570;padding:2rem;background:rgba(255,255,255,0.02);border-radius:10px;border:1px dashed rgba(255,255,255,0.06)"><div style="font-size:2rem">🔧</div><p style="margin:0.5rem 0 0;font-size:0.82rem">لا توجد طلبات بعد</p></div>`:
        reqs.slice().reverse().map((r,i)=>`
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:0.8rem">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.3rem">
              <div>
                <span style="font-weight:700;color:#f0f0f8;font-size:0.85rem">${r.building} — ${r.type}</span>
                <span style="margin-right:0.5rem;background:${FSM_DATA.priorities.find(p=>p.val===r.priority)?.color||'#6b7280'}22;color:${FSM_DATA.priorities.find(p=>p.val===r.priority)?.color||'#6b7280'};padding:0.1rem 0.4rem;border-radius:5px;font-size:0.68rem;font-weight:700">${r.priority}</span>
              </div>
              <button onclick="fsmToggleStatus(${reqs.length-1-i},'maintenance')" title="تغيير الحالة" style="background:${r.status==='مكتمل'?'rgba(0,212,170,0.12)':'rgba(108,99,255,0.12)'};border:1px solid ${r.status==='مكتمل'?'rgba(0,212,170,0.25)':'rgba(108,99,255,0.25)'};color:${r.status==='مكتمل'?'#00d4aa':'#a89cff'};padding:0.2rem 0.5rem;border-radius:6px;cursor:pointer;font-size:0.7rem">${r.status}</button>
            </div>
            <div style="color:#9090b0;font-size:0.78rem">${r.desc}</div>
            <div style="color:#555570;font-size:0.7rem;margin-top:0.3rem">${r.requester} — ${r.date}</div>
          </div>`).join('')}
      </div>
    </div>
  </div>`;
}

function fsmAddMaintenance() {
  const building=document.getElementById('fsm_m_building').value;
  const type=document.getElementById('fsm_m_type').value;
  const desc=document.getElementById('fsm_m_desc').value.trim();
  const priority=document.getElementById('fsm_m_priority').value;
  const requester=document.getElementById('fsm_m_requester').value.trim()||'—';
  if(!desc){showToast('أدخل وصف المشكلة','error');return;}
  const arr=getFSM('maintenance');
  arr.push({building,type,desc,priority,requester,status:'معلّق',date:new Date().toLocaleDateString('ar-SA')});
  saveFSM('maintenance',arr);
  showToast('✅ تم تسجيل طلب الصيانة','success');
  awardPoints('maintenance_req',2);
  fsmShowTab('maint');
}

// ── INCIDENT TAB ─────────────────────────────────────────────────
function buildIncidentTab() {
  const incidents=getFSM('incidents');
  return `
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem">
    <div style="background:rgba(239,68,68,0.04);border:1px solid rgba(239,68,68,0.15);border-radius:14px;padding:1.2rem">
      <div style="color:#fca5a5;font-weight:800;font-size:0.9rem;margin-bottom:1rem">🚨 تسجيل حادثة / بلاغ جديد</div>
      <div style="display:flex;flex-direction:column;gap:0.6rem">
        <select id="fsm_i_type" style="${fsmSelectStyle()}">
          ${FSM_DATA.incidentTypes.map(t=>`<option>${t}</option>`).join('')}
        </select>
        <select id="fsm_i_building" style="${fsmSelectStyle()}">
          ${FSM_DATA.buildings.map(b=>`<option>${b}</option>`).join('')}
        </select>
        <textarea id="fsm_i_desc" rows="3" placeholder="وصف الحادثة بالتفصيل — الوقت والمكان والأشخاص المعنيين..." style="${fsmTextareaStyle()}"></textarea>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem">
          <select id="fsm_i_severity" style="${fsmSelectStyle()}">
            ${['حرج 🔴','عالي 🟠','متوسط 🟡','منخفض 🟢'].map(s=>`<option>${s}</option>`).join('')}
          </select>
          <input id="fsm_i_reporter" placeholder="اسم المُبلِّغ" style="${fsmInputStyle()}">
        </div>
        <textarea id="fsm_i_action" rows="2" placeholder="الإجراء المتخذ فوراً..." style="${fsmTextareaStyle()}"></textarea>
        <button onclick="fsmAddIncident()" style="${fsmBtnStyle('#ef4444')}">🚨 تسجيل الحادثة</button>
      </div>
    </div>
    <div>
      <div style="color:#f0f0f8;font-weight:800;font-size:0.9rem;margin-bottom:0.8rem">📋 الحوادث المسجّلة (${incidents.length})</div>
      <div style="display:flex;flex-direction:column;gap:0.5rem;max-height:420px;overflow-y:auto">
        ${incidents.length===0?`<div style="text-align:center;color:#555570;padding:2rem;background:rgba(255,255,255,0.02);border-radius:10px;border:1px dashed rgba(255,255,255,0.06)"><div style="font-size:2rem">🚨</div><p style="margin:0.5rem 0 0;font-size:0.82rem">لا توجد حوادث مسجّلة</p></div>`:
        incidents.slice().reverse().map((inc,i)=>`
          <div style="background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.12);border-radius:10px;padding:0.8rem">
            <div style="display:flex;justify-content:space-between;margin-bottom:0.3rem">
              <span style="font-weight:700;color:#fca5a5;font-size:0.85rem">${inc.type}</span>
              <span style="color:#ef4444;font-size:0.72rem">${inc.severity}</span>
            </div>
            <div style="color:#c0c0d8;font-size:0.78rem">${inc.building} — ${inc.desc?.substring(0,100)}${inc.desc?.length>100?'...':''}</div>
            ${inc.action?`<div style="background:rgba(0,212,170,0.06);border-right:2px solid rgba(0,212,170,0.3);padding:0.3rem 0.5rem;margin-top:0.4rem;border-radius:0 6px 6px 0;color:#9090b0;font-size:0.75rem">الإجراء: ${inc.action}</div>`:''}
            <div style="color:#555570;font-size:0.7rem;margin-top:0.3rem">${inc.reporter} — ${inc.date}</div>
          </div>`).join('')}
      </div>
    </div>
  </div>`;
}

function fsmAddIncident() {
  const type=document.getElementById('fsm_i_type').value;
  const building=document.getElementById('fsm_i_building').value;
  const desc=document.getElementById('fsm_i_desc').value.trim();
  const severity=document.getElementById('fsm_i_severity').value;
  const reporter=document.getElementById('fsm_i_reporter').value.trim()||'—';
  const action=document.getElementById('fsm_i_action').value.trim();
  if(!desc){showToast('أدخل وصف الحادثة','error');return;}
  const arr=getFSM('incidents');
  arr.push({type,building,desc,severity,reporter,action,date:new Date().toLocaleString('ar-SA')});
  saveFSM('incidents',arr);
  showToast('✅ تم تسجيل الحادثة','success');
  fsmShowTab('incident');
}

// ── INSPECTION TAB ───────────────────────────────────────────────
function buildInspectTab() {
  const inspections=getFSM('inspections');
  const checklistItems = ['أجهزة الإطفاء','مخارج الطوارئ','كاميرات المراقبة','الإضاءة الاحتياطية','لوحات الكهرباء','مضخات الحريق','أجهزة الإنذار','مسالك الإخلاء','خزانات المياه','مولدات الطاقة'];
  return `
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem">
    <div style="background:rgba(0,212,170,0.04);border:1px solid rgba(0,212,170,0.15);border-radius:14px;padding:1.2rem">
      <div style="color:#6ee7b7;font-weight:800;font-size:0.9rem;margin-bottom:1rem">🔍 تسجيل جولة تفتيشية</div>
      <div style="display:flex;flex-direction:column;gap:0.6rem">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem">
          <select id="fsm_ins_building" style="${fsmSelectStyle()}">${FSM_DATA.buildings.map(b=>`<option>${b}</option>`).join('')}</select>
          <input id="fsm_ins_inspector" placeholder="اسم المفتش" style="${fsmInputStyle()}">
        </div>
        <div style="color:#7878a0;font-size:0.78rem;font-weight:600;margin-top:0.3rem">قائمة التحقق (✓ حسن الحال / ✗ يحتاج متابعة):</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.3rem">
          ${checklistItems.map(item=>`
            <label style="display:flex;align-items:center;gap:0.4rem;color:#c0c0d8;font-size:0.78rem;cursor:pointer;background:rgba(255,255,255,0.02);padding:0.35rem 0.5rem;border-radius:7px;border:1px solid rgba(255,255,255,0.06)">
              <input type="checkbox" class="fsm_checklist" value="${item}" style="accent-color:#00d4aa"> ${item}
            </label>`).join('')}
        </div>
        <textarea id="fsm_ins_notes" rows="2" placeholder="ملاحظات إضافية..." style="${fsmTextareaStyle()}"></textarea>
        <button onclick="fsmAddInspection()" style="${fsmBtnStyle('#00d4aa')}">🔍 تسجيل الجولة</button>
      </div>
    </div>
    <div>
      <div style="color:#f0f0f8;font-weight:800;font-size:0.9rem;margin-bottom:0.8rem">📋 الجولات المسجّلة (${inspections.length})</div>
      <div style="display:flex;flex-direction:column;gap:0.5rem;max-height:420px;overflow-y:auto">
        ${inspections.length===0?`<div style="text-align:center;color:#555570;padding:2rem;background:rgba(255,255,255,0.02);border-radius:10px;border:1px dashed rgba(255,255,255,0.06)"><div style="font-size:2rem">🔍</div><p style="margin:0.5rem 0 0;font-size:0.82rem">لا توجد جولات مسجّلة</p></div>`:
        inspections.slice().reverse().map(ins=>`
          <div style="background:rgba(0,212,170,0.04);border:1px solid rgba(0,212,170,0.12);border-radius:10px;padding:0.8rem">
            <div style="display:flex;justify-content:space-between;margin-bottom:0.3rem">
              <span style="font-weight:700;color:#6ee7b7;font-size:0.85rem">${ins.building}</span>
              <span style="color:#555570;font-size:0.7rem">${ins.date}</span>
            </div>
            <div style="color:#9090b0;font-size:0.75rem">المفتش: ${ins.inspector}</div>
            <div style="display:flex;flex-wrap:wrap;gap:0.25rem;margin-top:0.4rem">
              ${(ins.passed||[]).map(p=>`<span style="background:rgba(0,212,170,0.1);color:#00d4aa;padding:0.1rem 0.35rem;border-radius:5px;font-size:0.65rem">✓ ${p}</span>`).join('')}
              ${(ins.failed||[]).map(f=>`<span style="background:rgba(239,68,68,0.1);color:#ef4444;padding:0.1rem 0.35rem;border-radius:5px;font-size:0.65rem">✗ ${f}</span>`).join('')}
            </div>
            ${ins.notes?`<div style="color:#7878a0;font-size:0.74rem;margin-top:0.4rem">${ins.notes}</div>`:''}
          </div>`).join('')}
      </div>
    </div>
  </div>`;
}

function fsmAddInspection() {
  const building=document.getElementById('fsm_ins_building').value;
  const inspector=document.getElementById('fsm_ins_inspector').value.trim()||'—';
  const notes=document.getElementById('fsm_ins_notes').value.trim();
  const checks=document.querySelectorAll('.fsm_checklist');
  const passed=[],failed=[];
  checks.forEach(c=>{ if(c.checked) passed.push(c.value); else failed.push(c.value); });
  const arr=getFSM('inspections');
  arr.push({building,inspector,passed,failed,notes,date:new Date().toLocaleDateString('ar-SA')});
  saveFSM('inspections',arr);
  showToast('✅ تم تسجيل الجولة التفتيشية','success');
  awardPoints('inspection',5);
  fsmShowTab('inspect');
}

// ── SMART REPORT TAB ─────────────────────────────────────────────
function buildReportTab() {
  const reqs=getFSM('maintenance');
  const incidents=getFSM('incidents');
  const inspections=getFSM('inspections');
  const pending=reqs.filter(r=>r.status==='معلّق');
  const done=reqs.filter(r=>r.status==='مكتمل');
  const urgent=reqs.filter(r=>r.priority==='عاجل');
  return `
  <div style="display:flex;flex-direction:column;gap:1rem">
    <!-- Quick Stats -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.8rem">
      <div style="background:rgba(108,99,255,0.07);border:1px solid rgba(108,99,255,0.2);border-radius:12px;padding:1rem;text-align:center">
        <div style="font-size:1.5rem;font-weight:900;color:#a89cff">${reqs.length}</div>
        <div style="color:#7878a0;font-size:0.78rem">إجمالي طلبات الصيانة</div>
        <div style="color:#6c63ff;font-size:0.72rem;margin-top:0.2rem">✓ مكتمل: ${done.length} | ⏳ معلّق: ${pending.length}</div>
      </div>
      <div style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15);border-radius:12px;padding:1rem;text-align:center">
        <div style="font-size:1.5rem;font-weight:900;color:#fca5a5">${incidents.length}</div>
        <div style="color:#7878a0;font-size:0.78rem">حوادث مسجّلة</div>
        <div style="color:#ef4444;font-size:0.72rem;margin-top:0.2rem">عاجلة: ${urgent.length}</div>
      </div>
      <div style="background:rgba(0,212,170,0.06);border:1px solid rgba(0,212,170,0.15);border-radius:12px;padding:1rem;text-align:center">
        <div style="font-size:1.5rem;font-weight:900;color:#6ee7b7">${inspections.length}</div>
        <div style="color:#7878a0;font-size:0.78rem">جولات تفتيش</div>
        <div style="color:#00d4aa;font-size:0.72rem;margin-top:0.2rem">آخر جولة: ${inspections[inspections.length-1]?.date||'—'}</div>
      </div>
    </div>

    <div style="display:flex;gap:0.8rem">
      <button onclick="fsmGenerateAIReport()" style="${fsmBtnStyle('#6c63ff')} flex:1">
        🤖 توليد تقرير ذكي شامل بالذكاء الاصطناعي
      </button>
      <button onclick="fsmCopyReport()" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#c4bfff;padding:0.7rem 1rem;border-radius:10px;cursor:pointer;font-size:0.82rem">
        📋 نسخ للنموذج
      </button>
    </div>

    <div id="fsmAIResult" style="display:none;background:rgba(108,99,255,0.05);border:1px solid rgba(108,99,255,0.2);border-radius:12px;padding:1.2rem;color:#e0e0f0;font-size:0.85rem;line-height:1.8;white-space:pre-wrap;direction:rtl;max-height:400px;overflow-y:auto"></div>
  </div>`;
}

async function fsmGenerateAIReport() {
  const apiKey=localStorage.getItem('mbrcst_openai_key');
  if(!apiKey){showToast('أضف OpenAI API Key في الإعدادات','error');return;}
  const reqs=getFSM('maintenance');
  const incidents=getFSM('incidents');
  const inspections=getFSM('inspections');
  const btn=document.querySelector('#fsmTabContent button[onclick="fsmGenerateAIReport()"]');
  if(btn){btn.textContent='⏳ جاري التوليد...';btn.disabled=true;}
  const today=new Date().toLocaleDateString('ar-SA');
  const prompt=`أنت مدير مرافق محترف. اكتب تقريراً مؤسسياً شاملاً باللغة العربية لتاريخ ${today} بناءً على البيانات التالية:

طلبات الصيانة (${reqs.length} طلب):
${reqs.slice(-5).map(r=>`- ${r.building} | ${r.type} | ${r.priority} | ${r.status}`).join('\n')||'لا توجد'}

الحوادث المسجّلة (${incidents.length} حادثة):
${incidents.slice(-3).map(i=>`- ${i.type} في ${i.building} | الخطورة: ${i.severity}`).join('\n')||'لا توجد'}

جولات التفتيش (${inspections.length} جولة):
${inspections.slice(-2).map(i=>`- ${i.building} | ✓ سليم: ${(i.passed||[]).length} | ✗ يحتاج متابعة: ${(i.failed||[]).length}`).join('\n')||'لا توجد'}

اكتب تقريراً يشمل: ملخصاً تنفيذياً، حالة المرافق، الإنجازات، التحديات، التوصيات. أسلوب رسمي مؤسسي.`;

  try{
    const res=await fetch('https://api.openai.com/v1/chat/completions',{
      method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},
      body:JSON.stringify({model:'gpt-4o-mini',messages:[{role:'user',content:prompt}],max_tokens:900})
    });
    const data=await res.json();
    const result=document.getElementById('fsmAIResult');
    if(result){result.textContent=data.choices?.[0]?.message?.content||'حدث خطأ';result.style.display='block';}
    awardPoints('ai_used',2);
  }catch(e){showToast('خطأ في الاتصال','error');}
  if(btn){btn.textContent='🤖 توليد تقرير ذكي شامل';btn.disabled=false;}
}

function fsmCopyReport() {
  const reqs=getFSM('maintenance');
  const incidents=getFSM('incidents');
  const inspections=getFSM('inspections');
  const pending=reqs.filter(r=>r.status==='معلّق');
  const done=reqs.filter(r=>r.status==='مكتمل');
  const today=new Date().toLocaleDateString('ar-SA');
  const text=`تقرير إدارة المرافق والأمن والسلامة
التاريخ: ${today}

📊 ملخص الأنشطة:
- إجمالي طلبات الصيانة: ${reqs.length} (مكتمل: ${done.length} | معلّق: ${pending.length})
- الحوادث المسجّلة: ${incidents.length}
- جولات التفتيش: ${inspections.length}

🔧 طلبات الصيانة المعلّقة:
${pending.map(r=>`• ${r.building} — ${r.type} (${r.priority}): ${r.desc}`).join('\n')||'لا توجد طلبات معلّقة'}

🚨 آخر الحوادث:
${incidents.slice(-3).map(i=>`• ${i.type} في ${i.building} — ${i.date}`).join('\n')||'لا توجد حوادث'}

🔍 آخر جولة تفتيش:
${inspections.length?`${inspections[inspections.length-1].building} — ${inspections[inspections.length-1].date}`:'لم تُنفَّذ جولات بعد'}`;

  const achEl=document.getElementById('achievements');
  if(achEl){
    achEl.value=text;
    const titleEl=document.getElementById('reportTitle');
    if(titleEl)titleEl.value=`تقرير إدارة المرافق والأمن والسلامة — ${today}`;
    document.getElementById('fsmOverlay').remove();
    showSection('create');
    showToast('✅ تم نقل البيانات لنموذج التقرير','success');
  } else {
    navigator.clipboard.writeText(text).then(()=>showToast('✅ تم النسخ','success'));
  }
}

function fsmToggleStatus(idx,type) {
  const arr=getFSM(type);
  if(arr[idx]){arr[idx].status=arr[idx].status==='معلّق'?'مكتمل':'معلّق'; saveFSM(type,arr);}
  fsmShowTab('maint');
}

// Style helpers
function fsmSelectStyle(){return 'background:#1a1a2e;border:1px solid rgba(255,255,255,0.1);color:#f0f0f8;padding:0.6rem 0.8rem;border-radius:9px;font-size:0.82rem;direction:rtl;width:100%;box-sizing:border-box;font-family:inherit';}
function fsmInputStyle(){return 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:#f0f0f8;padding:0.6rem 0.8rem;border-radius:9px;font-size:0.82rem;direction:rtl;width:100%;box-sizing:border-box;font-family:inherit';}
function fsmTextareaStyle(){return 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:#f0f0f8;padding:0.6rem 0.8rem;border-radius:9px;font-size:0.82rem;direction:rtl;width:100%;box-sizing:border-box;resize:vertical;font-family:inherit';}
function fsmBtnStyle(c){return `background:linear-gradient(135deg,${c},${c}cc);border:none;color:white;padding:0.7rem;border-radius:10px;cursor:pointer;font-size:0.88rem;font-weight:700;width:100%;font-family:inherit;`;}

window.showFacilitiesPanel = showFacilitiesPanel;
window.fsmShowTab = fsmShowTab;
window.fsmAddMaintenance = fsmAddMaintenance;
window.fsmAddIncident = fsmAddIncident;
window.fsmAddInspection = fsmAddInspection;
window.fsmGenerateAIReport = fsmGenerateAIReport;
window.fsmCopyReport = fsmCopyReport;
window.fsmToggleStatus = fsmToggleStatus;
