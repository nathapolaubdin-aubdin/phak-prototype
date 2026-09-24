// ---------- AI panel (right dock) ----------
// One panel shared by every page (Chatbot / Workspace / Drive). Two modes:
// Web Search (quick answer + doc) and Advance Research (plan -> long run -> report).
// AI is mocked. Generated docs are saved into ไดร์ของฉัน via drive.js's driveAddFile.
(function () {
  const app = document.querySelector('.app');
  const icon = (n) => `assets/icons/${n}.svg`;

  const MODES = {
    web: { label: 'Web Search', short: 'Web Search', placeholder: 'ถามหรือสั่งงานได้เลย' },
    research: { label: 'Advance Research', short: 'Research', hint: '(More Token)', placeholder: 'ระบุหัวข้อที่ต้องการค้นคว้า' }
  };
  const GREETING = {
    research: [
      'คุณต้องการสร้างผลวิจัยเชิงลึก หรือค้นหาข้อมูลเชิงลึกเรื่องอะไร เช่น แนวโน้มการตลาด, วิเคราะห์ผลสำรวจจากหลายที่มา',
      '**โหมดนี้จะใช้เวลาและทรัพยากรณ์ในการค้นหามากขึ้น'
    ],
    web: ['ให้ฉันช่วยหาข้อมูลและจัดทำเอกสารทั่วไป เช่น เปรียบเทียบราคาสินค้าจาก 2 เว็บไซต์ หรือแบบฟอร์มงานราชการ ฯลฯ']
  };
  const RESEARCH_STEPS = ['ค้นหาแหล่งข้อมูลจากหลายที่มา', 'อ่านและคัดกรองเนื้อหา', 'วิเคราะห์และเปรียบเทียบข้อมูล', 'เรียบเรียงเป็นรายงาน'];
  const NEW_TITLE = 'แชทใหม่';

  let isOpen = false;
  let seq = 0;
  let sessions = [];
  let cur = null;
  let timers = [];

  function newSession(mode, title, messages) {
    const s = { id: 's' + (++seq), mode, title: title || NEW_TITLE, messages: messages || [], busy: false };
    if (!messages) s.messages.push({ type: 'text', role: 'ai', paras: GREETING[mode].slice() });
    sessions.unshift(s);
    return s;
  }

  // Two past chats so the switcher has something to show.
  newSession('web', 'เปรียบเทียบราคา Notebook', [
    { type: 'text', role: 'user', paras: ['เปรียบเทียบราคา Notebook 2 เว็บไซต์'] },
    { type: 'text', role: 'ai', paras: ['เปรียบเทียบเสร็จแล้ว (ข้อมูลจำลอง) — เว็บไซต์ A ถูกกว่าเฉลี่ย 8%'] }
  ]);
  cur = newSession('research', 'Analyst Salary');

  // ----- DOM -----
  const toggle = document.createElement('button');
  toggle.className = 'ai-toggle';
  toggle.setAttribute('aria-label', 'เปิด AI panel');
  toggle.innerHTML = `<img src="${icon('ai-sidebar')}" width="24" height="24" alt="">`;
  app.appendChild(toggle);

  const dock = document.createElement('aside');
  dock.className = 'ai-dock';
  dock.setAttribute('aria-label', 'AI panel');
  app.appendChild(dock);

  const isVisible = (id) => { const el = document.getElementById(id); return !!el && el.style.display !== 'none'; };

  function setOpen(v) {
    isOpen = v;
    app.classList.toggle('ai-open', v);
    if (v) render();
  }

  // ----- rendering -----
  function actionsHtml(idx) {
    return `<div class="ai-actions">
      <button data-ai-act="copy" data-i="${idx}" aria-label="คัดลอก"><img src="${icon('ai-copy')}" width="11" height="11" alt=""></button>
      <button data-ai-act="like" data-i="${idx}" aria-label="ถูกใจ"><img src="${icon('ai-like')}" width="11" height="11" alt=""></button>
      <button data-ai-act="dislike" data-i="${idx}" aria-label="ไม่ถูกใจ"><img src="${icon('ai-like')}" width="11" height="11" alt="" style="transform:rotate(180deg)"></button>
      <button data-ai-act="retry" data-i="${idx}" aria-label="สร้างใหม่"><img src="${icon('ai-retry')}" width="16" height="16" alt="" style="transform:rotate(180deg)"></button>
    </div>`;
  }

  function stepIcon(state) {
    if (state === 'done') return '<span class="ai-step-ico done">✓</span>';
    if (state === 'run') return '<span class="ai-step-ico run"></span>';
    return '<span class="ai-step-ico"></span>';
  }

  function messageHtml(m, i, s) {
    if (m.type === 'text') {
      const body = m.paras.map(p => `<p>${driveEsc(p)}</p>`).join('');
      if (m.role === 'user') return `<div class="ai-msg user"><div class="ai-bubble">${body}</div></div>`;
      const src = m.sources ? `<div class="ai-sources"><span>แหล่งอ้างอิง (จำลอง)</span>${m.sources.map(x => `<div class="ai-source"><b>${driveEsc(x.host)}</b>${driveEsc(x.title)}</div>`).join('')}</div>` : '';
      return `<div class="ai-msg"><div class="ai-text">${body}</div>${src}${actionsHtml(i)}</div>`;
    }
    if (m.type === 'typing') return `<div class="ai-msg"><div class="ai-text ai-typing">${driveEsc(m.label)}<span class="drv-dots"></span></div></div>`;
    if (m.type === 'plan') {
      const stepState = (k) => m.state === 'done' ? 'done' : m.state === 'running' ? (k < m.step ? 'done' : k === m.step ? 'run' : '') : '';
      const steps = RESEARCH_STEPS.map((t, k) => `<li class="ai-step ${stepState(k)}">${stepIcon(stepState(k))}<span>${t}</span></li>`).join('');
      let foot = '';
      if (m.state === 'pending') foot = `<div class="ai-plan-btns"><button class="ai-btn ghost" data-ai-act="plan-cancel" data-i="${i}">ยกเลิก</button><button class="ai-btn" data-ai-act="plan-start" data-i="${i}">เริ่มค้นคว้า</button></div>`;
      if (m.state === 'running') foot = `<div class="ai-track"><div class="ai-fill" style="width:${Math.round(((m.step + 0.5) / RESEARCH_STEPS.length) * 100)}%"></div></div><div class="ai-plan-btns"><button class="ai-btn ghost" data-ai-act="plan-stop" data-i="${i}">หยุด</button></div>`;
      const head = m.state === 'pending' ? 'แผนการค้นคว้า' : m.state === 'running' ? 'กำลังค้นคว้า' : m.state === 'done' ? 'ค้นคว้าเสร็จแล้ว' : 'ยกเลิกแล้ว';
      return `<div class="ai-msg"><div class="ai-card"><div class="ai-card-title">${head}: “${driveEsc(m.topic)}”</div><ul class="ai-steps">${steps}</ul>${foot}</div></div>`;
    }
    if (m.type === 'file') {
      return `<div class="ai-msg"><div class="ai-card ai-file">
        <svg width="20" height="20" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2.5" fill="#2B7BE4"/><path d="M8 9h8M8 13h8M8 17h5" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>
        <span class="ai-file-name">${driveEsc(m.name)}</span>
        ${m.saved ? '<span class="ai-saved">บันทึกแล้ว ✓</span>' : `<button class="ai-btn sm" data-ai-act="save" data-i="${i}">บันทึกลงไดร์</button>`}
      </div></div>`;
    }
    return '';
  }

  function render() {
    if (!isOpen) return;
    const s = cur;
    const showExpand = !isVisible('chatbotPage');
    const prevInput = document.getElementById('aiInput');
    const draft = prevInput ? prevInput.value : '';
    dock.innerHTML = `
      <div class="ai-head">
        <button class="ai-icon-btn" id="aiClose" aria-label="ปิด AI panel"><img src="${icon('ai-sidebar')}" width="24" height="24" alt=""></button>
        ${showExpand ? `<button class="ai-expand" id="aiExpand"><span>ขยายแชท</span><span class="ai-scale"><img src="${icon('ai-scale')}" alt=""></span></button>` : ''}
      </div>
      <div class="ai-session">
        <div class="ai-session-ico"><img src="${icon('ai-chat')}" width="16" height="16" alt=""></div>
        <button class="ai-session-pill" id="aiSessionPill"><span>${driveEsc(s.title)}</span><img src="${icon('ai-arrow')}" width="8" height="16" alt="" style="transform:rotate(90deg)"></button>
        <div class="ai-pop ai-session-pop" id="aiSessionPop" hidden></div>
      </div>
      <div class="ai-msgs" id="aiMsgs">${s.messages.map((m, i) => messageHtml(m, i, s)).join('')}</div>
      <div class="ai-input">
        <textarea id="aiInput" rows="2" placeholder="${MODES[s.mode].placeholder}"></textarea>
        <div class="ai-input-row">
          <div class="ai-input-left">
            <button class="ai-icon-btn sm" data-stub-ai aria-label="แนบไฟล์"><img src="${icon('ai-plus')}" width="16" height="16" alt=""></button>
            <button class="ai-icon-btn sm" id="aiModeBtn" aria-label="เครื่องมือ AI"><span class="ai-toolico"><img src="${icon('ai-tool')}" alt=""></span></button>
            <button class="ai-icon-btn sm" data-stub-ai aria-label="ใช้งานล่าสุด"><img src="${icon('ai-used')}" width="20" height="20" alt=""></button>
            <button class="ai-mode-chip" id="aiModeChip">${MODES[s.mode].short}</button>
          </div>
          <div class="ai-input-right">
            <button class="ai-model" data-stub-ai><span>Thinking</span><img src="${icon('ai-arrow')}" width="8" height="16" alt="" style="transform:rotate(90deg)"></button>
            <button class="ai-send" id="aiSend" aria-label="ส่ง" ${s.busy ? 'disabled' : ''}><img src="${icon('ai-send')}" width="34" height="34" alt=""></button>
          </div>
        </div>
        <div class="ai-pop ai-mode-pop" id="aiModePop" hidden></div>
      </div>`;
    bind();
    if (draft) document.getElementById('aiInput').value = draft;
    const msgs = document.getElementById('aiMsgs');
    msgs.scrollTop = msgs.scrollHeight;
  }

  function bind() {
    document.getElementById('aiClose').addEventListener('click', () => setOpen(false));
    const exp = document.getElementById('aiExpand');
    if (exp) exp.addEventListener('click', () => { setOpen(false); openChatbotPage(); });
    dock.querySelectorAll('[data-stub-ai]').forEach(el => el.addEventListener('click', () => showToast('ฟีเจอร์นี้ยังไม่พร้อมใช้งานใน prototype นี้')));

    const input = document.getElementById('aiInput');
    const send = () => {
      const t = input.value.trim();
      if (!t) { input.focus(); return; }
      if (cur.busy) return;
      input.value = '';
      handleSend(t);
    };
    document.getElementById('aiSend').addEventListener('click', send);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });

    const sessionPop = document.getElementById('aiSessionPop');
    const modePop = document.getElementById('aiModePop');
    const closePops = () => { sessionPop.hidden = true; modePop.hidden = true; };
    document.getElementById('aiSessionPill').addEventListener('click', (e) => {
      e.stopPropagation();
      const wasHidden = sessionPop.hidden;
      closePops();
      if (!wasHidden) return;
      sessionPop.innerHTML = `<button class="ai-pop-item" data-new="1">＋ ${NEW_TITLE}</button>` + sessions.map(x =>
        `<button class="ai-pop-item ${x.id === cur.id ? 'on' : ''}" data-sid="${x.id}"><span>${driveEsc(x.title)}</span><em>${MODES[x.mode].short}</em></button>`).join('');
      sessionPop.hidden = false;
      sessionPop.querySelectorAll('[data-sid]').forEach(b => b.addEventListener('click', () => { cur = sessions.find(x => x.id === b.dataset.sid); render(); }));
      sessionPop.querySelector('[data-new]').addEventListener('click', () => { cur = newSession(cur.mode); render(); });
    });
    const openModePop = (e) => {
      e.stopPropagation();
      const wasHidden = modePop.hidden;
      closePops();
      if (!wasHidden) return;
      modePop.innerHTML = Object.keys(MODES).map(k =>
        `<button class="ai-pop-item ${k === cur.mode ? 'on' : ''}" data-mode="${k}"><span>${MODES[k].label}</span>${MODES[k].hint ? `<em>${MODES[k].hint}</em>` : ''}</button>`).join('');
      modePop.hidden = false;
      modePop.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
    };
    document.getElementById('aiModeBtn').addEventListener('click', openModePop);
    document.getElementById('aiModeChip').addEventListener('click', openModePop);
    dock.addEventListener('click', (e) => { if (!e.target.closest('.ai-pop')) closePops(); }, { once: true });

    dock.querySelectorAll('[data-ai-act]').forEach(b => b.addEventListener('click', () => onAction(b.dataset.aiAct, +b.dataset.i, b)));
  }

  // ----- modes / sessions -----
  function hasUserMsg(s) { return s.messages.some(m => m.role === 'user'); }

  function setMode(mode) {
    if (mode === cur.mode) { render(); return; }
    if (hasUserMsg(cur)) cur = newSession(mode);
    else { cur.mode = mode; cur.messages = [{ type: 'text', role: 'ai', paras: GREETING[mode].slice() }]; }
    render();
  }

  // Public entry: called from Drive "+ เพิ่ม" menu (and usable from any page).
  window.openAiPanel = function (mode) {
    if (mode && MODES[mode]) {
      if (!isOpen) { isOpen = true; app.classList.add('ai-open'); }
      setMode(mode);
    } else setOpen(true);
    const inp = document.getElementById('aiInput');
    if (inp) inp.focus();
  };

  // ----- conversation -----
  function push(m) { cur.messages.push(m); return m; }
  function later(fn, ms) { const t = setTimeout(fn, ms); timers.push(t); return t; }

  function handleSend(text) {
    push({ type: 'text', role: 'user', paras: [text] });
    if (cur.title === NEW_TITLE || cur.title === 'Analyst Salary' && cur.messages.length <= 2) cur.title = text.length > 24 ? text.slice(0, 24) + '…' : text;
    reply(text);
  }

  function reply(text) {
    const s = cur;
    s.busy = true;
    const typing = push({ type: 'typing', label: s.mode === 'web' ? 'กำลังค้นหาข้อมูลบนเว็บ' : 'กำลังวางแผนการค้นคว้า' });
    render();
    later(() => {
      s.messages = s.messages.filter(m => m !== typing);
      s.busy = false;
      if (s.mode === 'web') {
        s.messages.push({
          type: 'text', role: 'ai',
          paras: [
            `ค้นหาเรื่อง “${text}” แล้ว สรุปได้ดังนี้ (ข้อมูลจำลองสำหรับ prototype)`,
            '• ประเด็นหลักที่พบซ้ำในหลายแหล่งข้อมูล',
            '• ตัวเลขและข้อมูลเปรียบเทียบเบื้องต้น',
            '• ข้อควรระวังและแนวทางที่แนะนำ'
          ],
          sources: [
            { host: 'example.com', title: 'ภาพรวมและข้อมูลอ้างอิงหลัก' },
            { host: 'news.example.org', title: 'บทวิเคราะห์ล่าสุด' },
            { host: 'gov.example.th', title: 'ข้อมูลทางการ' }
          ]
        });
        s.messages.push({ type: 'file', name: 'สรุป - ' + text.slice(0, 30) + '.docx', title: 'สรุป: ' + text, body: `ผลการค้นหาเรื่อง ${text}\n\n• ประเด็นหลักที่พบซ้ำในหลายแหล่งข้อมูล\n• ตัวเลขและข้อมูลเปรียบเทียบเบื้องต้น\n• ข้อควรระวังและแนวทางที่แนะนำ`, saved: false });
      } else {
        s.messages.push({ type: 'text', role: 'ai', paras: [`เข้าใจแล้ว ฉันวางแผนการค้นคว้าเรื่อง “${text}” ไว้ดังนี้ ยืนยันเพื่อเริ่มได้เลย`] });
        s.messages.push({ type: 'plan', topic: text, state: 'pending', step: 0 });
      }
      if (cur === s) render();
    }, 1100);
  }

  function runResearch(plan) {
    const s = cur;
    plan.state = 'running'; plan.step = 0; s.busy = true;
    render();
    const tick = () => {
      if (plan.state !== 'running') return;
      plan.step++;
      if (plan.step >= RESEARCH_STEPS.length) {
        plan.state = 'done'; s.busy = false;
        s.messages.push({
          type: 'text', role: 'ai',
          paras: [`ค้นคว้าเรื่อง “${plan.topic}” เสร็จแล้ว จาก 12 แหล่งข้อมูล (จำลอง)`, '• ภาพรวมและแนวโน้มสำคัญ', '• การเปรียบเทียบข้อมูลจากหลายที่มา', '• ข้อเสนอแนะและประเด็นที่ควรติดตามต่อ']
        });
        s.messages.push({ type: 'file', name: 'รายงานวิจัย - ' + plan.topic.slice(0, 30) + '.docx', title: 'รายงานวิจัย: ' + plan.topic, body: `รายงานวิจัยเรื่อง ${plan.topic}\n\n• ภาพรวมและแนวโน้มสำคัญ\n• การเปรียบเทียบข้อมูลจากหลายที่มา\n• ข้อเสนอแนะและประเด็นที่ควรติดตามต่อ`, saved: false });
      } else later(tick, 1400);
      if (cur === s) render();
    };
    later(tick, 1400);
  }

  function onAction(act, i, btn) {
    const m = cur.messages[i];
    if (act === 'copy') {
      const text = (m.paras || []).join('\n');
      if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
      showToast('คัดลอกข้อความแล้ว');
    } else if (act === 'like' || act === 'dislike') {
      btn.classList.toggle('on');
    } else if (act === 'retry') {
      const lastUser = cur.messages.map(x => x.role).lastIndexOf('user');
      if (lastUser < 0) { showToast('ยังไม่มีคำถามให้สร้างคำตอบใหม่'); return; }
      const text = cur.messages[lastUser].paras[0];
      cur.messages = cur.messages.slice(0, lastUser + 1);
      reply(text);
    } else if (act === 'plan-start') runResearch(m);
    else if (act === 'plan-cancel' || act === 'plan-stop') {
      m.state = 'cancelled'; cur.busy = false; render();
    } else if (act === 'save') saveFile(m);
  }

  function saveFile(m) {
    // Only files created from the currently open personal folder go there; otherwise the ไดร์ของฉัน root.
    driveAddFile(driveEsc(m.name), { note: { title: driveEsc(m.title), body: driveEsc(m.body).replace(/\n/g, '<br>') } });
    m.saved = true;
    if (isVisible('drivePage')) driveRefreshKeepScroll();
    render();
    showToast('บันทึก "' + m.name + '" ลงไดร์ของฉันแล้ว');
  }

  toggle.addEventListener('click', () => setOpen(true));

  // Re-render on page changes so page-dependent bits (ขยายแชท is hidden on the Chatbot page) stay right.
  const chatPage = document.getElementById('chatbotPage');
  if (chatPage) new MutationObserver(() => { if (isOpen) render(); }).observe(chatPage, { attributes: true, attributeFilter: ['style'] });
})();
