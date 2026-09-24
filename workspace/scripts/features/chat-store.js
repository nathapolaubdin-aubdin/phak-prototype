// ---------- Chat store, mock AI engine, and shared chat UI helpers ----------
// One store for the whole app: the right AI panel (Drive/Workspace) and the Chatbot
// page read the same chats, so history, favorites and deletes are always in sync.
// Artifacts are per-user DRAFTS that live with their chat and are invisible to Drive
// until the user saves them as a real file. Deleting a chat permanently deletes its
// drafts (no trash). All AI output is mocked and everything is in-memory.
(function () {
  const NEW_TITLE = 'แชทใหม่';
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
  const STEPS = ['ค้นหาแหล่งข้อมูลจากหลายที่มา', 'อ่านและคัดกรองเนื้อหา', 'วิเคราะห์และเปรียบเทียบข้อมูล', 'เรียบเรียงเป็นรายงาน'];

  const S = window.ChatStore = { chats: [], artifacts: [], activeId: null, blankMode: 'web', viewArtifactId: null, MODES, GREETING, STEPS, NEW_TITLE };
  const listeners = [];
  let cseq = 0, aseq = 0;

  S.subscribe = (fn) => listeners.push(fn);
  const emit = (evt, data) => listeners.forEach(fn => fn(evt, data));
  S.emit = emit;
  const trunc = (t, n) => t.length > n ? t.slice(0, n) + '…' : t;

  S.active = () => S.chats.find(c => c.id === S.activeId) || null;
  S.chat = (id) => S.chats.find(c => c.id === id) || null;
  S.artifact = (id) => S.artifacts.find(a => a.id === id) || null;
  S.artifactsOf = (chatId) => S.artifacts.filter(a => a.chatId === chatId);
  S.unsavedOf = (chatId) => S.artifactsOf(chatId).filter(a => !a.saved);
  S.mode = () => (S.active() || { mode: S.blankMode }).mode;

  // ----- chats -----
  S.newBlank = () => { S.activeId = null; S.viewArtifactId = null; emit('active'); };
  S.open = (id) => { S.activeId = id; const arts = S.artifactsOf(id); S.viewArtifactId = arts.length ? arts[0].id : null; emit('active'); };
  S.toggleFavorite = (id) => { const c = S.chat(id); if (c) { c.favorite = !c.favorite; emit('list'); } };

  S.setMode = (mode) => {
    const c = S.active();
    if (!c) S.blankMode = mode;
    else if (c.messages.some(m => m.role === 'user')) { S.blankMode = mode; S.activeId = null; S.viewArtifactId = null; }
    else c.mode = mode;
    emit('mode');
  };

  // Permanent: the chat and every draft belonging to it are gone (saved Drive files are untouched).
  S.deleteChat = (id) => {
    S.chats = S.chats.filter(c => c.id !== id);
    S.artifacts = S.artifacts.filter(a => a.chatId !== id);
    if (S.activeId === id) S.activeId = null;
    if (S.viewArtifactId && !S.artifact(S.viewArtifactId)) S.viewArtifactId = null;
    emit('active');
  };

  function makeChat(title, mode, fav, ageMin) {
    const c = { id: 'c' + (++cseq), title, mode, favorite: !!fav, messages: [], busy: false, createdAt: Date.now() - (ageMin || 0) * 60000 };
    return c;
  }
  function makeArtifact(chat, name, title, body) {
    const a = { id: 'a' + (++aseq), chatId: chat.id, name, title, body, saved: false, dest: null, createdAt: Date.now() };
    S.artifacts.unshift(a);
    return a;
  }

  // ----- conversation engine (mock) -----
  S.send = (text) => {
    let c = S.active();
    if (!c) {
      c = makeChat(trunc(text, 24), S.blankMode, false, 0);
      S.chats.unshift(c);
      S.activeId = c.id;
      S.viewArtifactId = null;
    }
    if (c.busy) return;
    c.messages.push({ type: 'text', role: 'user', paras: [text] });
    emit('active');
    reply(c, text);
  };

  function reply(c, text) {
    c.busy = true;
    const typing = { type: 'typing', label: c.mode === 'web' ? 'กำลังค้นหาข้อมูลบนเว็บ' : 'กำลังวางแผนการค้นคว้า' };
    c.messages.push(typing);
    emit('messages');
    setTimeout(() => {
      c.messages = c.messages.filter(m => m !== typing);
      c.busy = false;
      if (c.mode === 'web') {
        c.messages.push({
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
        const a = makeArtifact(c, 'สรุป - ' + trunc(text, 30) + '.docx', 'สรุป: ' + text,
          `ผลการค้นหาเรื่อง ${text}\n\n• ประเด็นหลักที่พบซ้ำในหลายแหล่งข้อมูล\n• ตัวเลขและข้อมูลเปรียบเทียบเบื้องต้น\n• ข้อควรระวังและแนวทางที่แนะนำ`);
        c.messages.push({ type: 'artifact', artifactId: a.id });
        S.viewArtifactId = a.id;
        emit('artifact', a);
      } else {
        c.messages.push({ type: 'text', role: 'ai', paras: [`เข้าใจแล้ว ฉันวางแผนการค้นคว้าเรื่อง “${text}” ไว้ดังนี้ ยืนยันเพื่อเริ่มได้เลย`] });
        c.messages.push({ type: 'plan', topic: text, state: 'pending', step: 0 });
        emit('messages');
      }
    }, 1100);
  }

  S.retry = (chatId) => {
    const c = S.chat(chatId);
    if (!c || c.busy) return;
    const idx = c.messages.map(m => m.role).lastIndexOf('user');
    if (idx < 0) return;
    const text = c.messages[idx].paras[0];
    c.messages = c.messages.slice(0, idx + 1);
    reply(c, text);
  };

  S.startPlan = (chatId, msgIdx) => {
    const c = S.chat(chatId);
    const plan = c && c.messages[msgIdx];
    if (!plan || plan.type !== 'plan') return;
    plan.state = 'running'; plan.step = 0; c.busy = true;
    emit('messages');
    const tick = () => {
      if (plan.state !== 'running') return;
      plan.step++;
      if (plan.step >= STEPS.length) {
        plan.state = 'done'; c.busy = false;
        c.messages.push({ type: 'text', role: 'ai', paras: [`ค้นคว้าเรื่อง “${plan.topic}” เสร็จแล้ว จาก 12 แหล่งข้อมูล (จำลอง)`, '• ภาพรวมและแนวโน้มสำคัญ', '• การเปรียบเทียบข้อมูลจากหลายที่มา', '• ข้อเสนอแนะและประเด็นที่ควรติดตามต่อ'] });
        const a = makeArtifact(c, 'รายงานวิจัย - ' + trunc(plan.topic, 30) + '.docx', 'รายงานวิจัย: ' + plan.topic,
          `รายงานวิจัยเรื่อง ${plan.topic}\n\n• ภาพรวมและแนวโน้มสำคัญ\n• การเปรียบเทียบข้อมูลจากหลายที่มา\n• ข้อเสนอแนะและประเด็นที่ควรติดตามต่อ`);
        c.messages.push({ type: 'artifact', artifactId: a.id });
        S.viewArtifactId = a.id;
        emit('artifact', a);
      } else { setTimeout(tick, 1400); emit('messages'); }
    };
    setTimeout(tick, 1400);
  };

  S.stopPlan = (chatId, msgIdx) => {
    const c = S.chat(chatId);
    const plan = c && c.messages[msgIdx];
    if (!plan) return;
    plan.state = 'cancelled'; c.busy = false;
    emit('messages');
  };

  // ----- artifacts (drafts -> real Drive files) -----
  S.openArtifact = (id) => { S.viewArtifactId = id; emit('open-artifact', id); };

  S.saveArtifact = (id, dest) => {
    const a = S.artifact(id);
    if (!a || a.saved) return null;
    const res = driveSaveArtifact(a, dest);
    a.saved = true; a.dest = res.label;
    emit('list');
    return res;
  };

  // ----- seed data (existing sidebar placeholders, now real chats) -----
  const seed = (title, fav, ageMin, draft) => {
    const c = makeChat(title, 'web', fav, ageMin);
    c.messages.push({ type: 'text', role: 'user', paras: [title] });
    c.messages.push({ type: 'text', role: 'ai', paras: [`นี่คือคำตอบตัวอย่างสำหรับ “${title}” (ข้อมูลจำลองสำหรับ prototype)`, '• ประเด็นสำคัญข้อที่ 1', '• ประเด็นสำคัญข้อที่ 2'] });
    if (draft) {
      const a = makeArtifact(c, 'สรุป - ' + title + '.docx', 'สรุป: ' + title, `สรุปเรื่อง ${title}\n\n• ประเด็นสำคัญข้อที่ 1\n• ประเด็นสำคัญข้อที่ 2`);
      c.messages.push({ type: 'artifact', artifactId: a.id });
    }
    S.chats.push(c);
  };
  seed('สรุปยอดขายไตรมาส 2', true, 1500, false);
  seed('ร่างสัญญาจ้างงาน', true, 3000, false);
  seed('แผนการตลาดรถ EV', false, 10, true);
  seed('เปรียบเทียบราคา Notebook', false, 60, false);
  seed('Analyst Salary', false, 300, false);
  seed('ข้อกำหนด PDPA ที่ต้องรู้', false, 1000, false);

  // ================= shared UI =================
  const esc = (s) => driveEsc(String(s));
  const ICON = (n) => `assets/icons/${n}.svg`;
  const DOC_SVG = '<svg width="20" height="20" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2.5" fill="#2B7BE4"/><path d="M8 9h8M8 13h8M8 17h5" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>';

  const U = window.ChatUI = {};
  const isVisible = (id) => { const el = document.getElementById(id); return !!el && el.style.display !== 'none'; };
  U.isVisible = isVisible;

  // Where a "quick save" would land, based on the Drive page currently open (or null).
  U.driveContext = () => {
    if (!isVisible('drivePage')) return null;
    const a = DRV_LAST_ACTIVE;
    if (a.section === 'personal') {
      if (a.folderId) {
        const f = DRV_PERSONAL_FOLDERS.find(x => x.id === a.folderId);
        if (f) return { dest: { type: 'folder', id: f.id }, label: 'โฟลเดอร์นี้' };
      }
      return { dest: { type: 'root' }, label: 'ไดร์ของฉัน' };
    }
    if (a.section === 'work' && a.projectKey) {
      const p = ALL_PROJECTS.find(x => x.keyPrefix === a.projectKey);
      if (p) return { dest: { type: 'project', key: p.keyPrefix }, label: 'โฟลเดอร์นี้' };
    }
    return null;
  };

  function actionsHtml(i) {
    return `<div class="ai-actions">
      <button data-ai-act="copy" data-i="${i}" aria-label="คัดลอก"><img src="${ICON('ai-copy')}" width="11" height="11" alt=""></button>
      <button data-ai-act="like" data-i="${i}" aria-label="ถูกใจ"><img src="${ICON('ai-like')}" width="11" height="11" alt=""></button>
      <button data-ai-act="dislike" data-i="${i}" aria-label="ไม่ถูกใจ"><img src="${ICON('ai-like')}" width="11" height="11" alt="" style="transform:rotate(180deg)"></button>
      <button data-ai-act="retry" data-i="${i}" aria-label="สร้างใหม่"><img src="${ICON('ai-retry')}" width="16" height="16" alt="" style="transform:rotate(180deg)"></button>
    </div>`;
  }

  function stepIcon(state) {
    if (state === 'done') return '<span class="ai-step-ico done">✓</span>';
    if (state === 'run') return '<span class="ai-step-ico run"></span>';
    return '<span class="ai-step-ico"></span>';
  }

  function artifactCardHtml(a, quick) {
    if (!a) return '';
    const status = a.saved ? `<span class="ai-saved">บันทึกแล้ว · ${esc(a.dest)}</span>` : '<span class="ai-draft">ร่าง · ยังไม่ได้บันทึกที่ใด</span>';
    let btns = `<button class="ai-btn sm alt" data-ai-act="open-art" data-art="${a.id}">เปิดดู</button>`;
    if (!a.saved) {
      if (quick) btns += `<button class="ai-btn sm" data-ai-act="quick-save" data-art="${a.id}">บันทึกลง${esc(quick.label)}</button><button class="ai-btn sm alt" data-ai-act="save-art" data-art="${a.id}">เลือกที่เก็บ…</button>`;
      else btns += `<button class="ai-btn sm" data-ai-act="save-art" data-art="${a.id}">บันทึกลงไดร์…</button>`;
    }
    return `<div class="ai-msg"><div class="ai-card">
      <div class="ai-artcard-top">${DOC_SVG}<span class="ai-file-name">${esc(a.name)}</span></div>
      <div class="ai-artcard-status">${status}</div>
      <div class="ai-plan-btns start">${btns}</div>
    </div></div>`;
  }

  // Message list for a chat (or the mode greeting when there is no chat yet).
  U.messagesHtml = (chat, mode) => {
    const quick = U.driveContext();
    if (!chat) return `<div class="ai-msg"><div class="ai-text">${GREETING[mode].map(p => `<p>${esc(p)}</p>`).join('')}</div></div>`;
    return chat.messages.map((m, i) => {
      if (m.type === 'text') {
        const body = m.paras.map(p => `<p>${esc(p)}</p>`).join('');
        if (m.role === 'user') return `<div class="ai-msg user"><div class="ai-bubble">${body}</div></div>`;
        const src = m.sources ? `<div class="ai-sources"><span>แหล่งอ้างอิง (จำลอง)</span>${m.sources.map(x => `<div class="ai-source"><b>${esc(x.host)}</b>${esc(x.title)}</div>`).join('')}</div>` : '';
        return `<div class="ai-msg"><div class="ai-text">${body}</div>${src}${actionsHtml(i)}</div>`;
      }
      if (m.type === 'typing') return `<div class="ai-msg"><div class="ai-text ai-typing">${esc(m.label)}<span class="drv-dots"></span></div></div>`;
      if (m.type === 'artifact') return artifactCardHtml(S.artifact(m.artifactId), quick);
      if (m.type === 'plan') {
        const st = (k) => m.state === 'done' ? 'done' : m.state === 'running' ? (k < m.step ? 'done' : k === m.step ? 'run' : '') : '';
        const steps = STEPS.map((t, k) => `<li class="ai-step ${st(k)}">${stepIcon(st(k))}<span>${t}</span></li>`).join('');
        let foot = '';
        if (m.state === 'pending') foot = `<div class="ai-plan-btns"><button class="ai-btn ghost" data-ai-act="plan-cancel" data-i="${i}">ยกเลิก</button><button class="ai-btn" data-ai-act="plan-start" data-i="${i}">เริ่มค้นคว้า</button></div>`;
        if (m.state === 'running') foot = `<div class="ai-track"><div class="ai-fill" style="width:${Math.round(((m.step + 0.5) / STEPS.length) * 100)}%"></div></div><div class="ai-plan-btns"><button class="ai-btn ghost" data-ai-act="plan-stop" data-i="${i}">หยุด</button></div>`;
        const head = m.state === 'pending' ? 'แผนการค้นคว้า' : m.state === 'running' ? 'กำลังค้นคว้า' : m.state === 'done' ? 'ค้นคว้าเสร็จแล้ว' : 'ยกเลิกแล้ว';
        return `<div class="ai-msg"><div class="ai-card"><div class="ai-card-title">${head}: “${esc(m.topic)}”</div><ul class="ai-steps">${steps}</ul>${foot}</div></div>`;
      }
      return '';
    }).join('');
  };

  // Wire message/artifact buttons inside `root`.
  U.bindMessages = (root) => {
    root.querySelectorAll('[data-ai-act]').forEach(b => b.addEventListener('click', () => {
      const act = b.dataset.aiAct;
      const chat = S.active();
      const m = chat && chat.messages[+b.dataset.i];
      if (act === 'copy') {
        const text = ((m && m.paras) || []).join('\n');
        if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
        showToast('คัดลอกข้อความแล้ว');
      } else if (act === 'like' || act === 'dislike') b.classList.toggle('on');
      else if (act === 'retry') S.retry(chat.id);
      else if (act === 'plan-start') S.startPlan(chat.id, +b.dataset.i);
      else if (act === 'plan-cancel' || act === 'plan-stop') S.stopPlan(chat.id, +b.dataset.i);
      else if (act === 'open-art') S.openArtifact(b.dataset.art);
      else if (act === 'save-art') U.saveDialog([b.dataset.art]);
      else if (act === 'quick-save') {
        const ctx = U.driveContext();
        if (ctx) { S.saveArtifact(b.dataset.art, ctx.dest); if (isVisible('drivePage')) driveRefreshKeepScroll(); showToast('บันทึกลง' + ctx.label + 'แล้ว'); }
      }
    }));
  };

  // ----- artifact viewer (Result panel body) -----
  const bodyHtml = (body) => {
    let html = '', list = [];
    const flush = () => { if (list.length) { html += `<ul>${list.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`; list = []; } };
    body.split('\n').forEach(line => {
      if (/^•\s*/.test(line)) list.push(line.replace(/^•\s*/, ''));
      else { flush(); if (line.trim()) html += `<p>${esc(line)}</p>`; }
    });
    flush();
    return html;
  };

  U.viewerHtml = (artId) => {
    const a = S.artifact(artId);
    if (!a) return '<div class="art-empty">ยังไม่มีผลลัพธ์ในแชทนี้<br><small>เมื่อ AI สร้างเอกสาร จะแสดงที่นี่ในรูปแบบ “ร่าง” ที่ยังไม่ถูกบันทึกลงไดร์</small></div>';
    const tabs = S.artifactsOf(a.chatId);
    const tabsHtml = tabs.length > 1 ? `<div class="art-tabs">${tabs.map(t => `<button class="art-tab ${t.id === a.id ? 'on' : ''}" data-art-tab="${t.id}">${esc(t.name)}</button>`).join('')}</div>` : '';
    const status = a.saved ? `<span class="ai-saved">บันทึกแล้ว · ${esc(a.dest)}</span>` : '<span class="ai-draft">ร่าง · ยังไม่ได้บันทึกที่ใด (จะหายไปเมื่อลบแชท)</span>';
    return `${tabsHtml}
      <div class="art-meta"><span class="art-name">${esc(a.name)}</span>${status}</div>
      <div class="art-page"><h1>${esc(a.title)}</h1>${bodyHtml(a.body)}</div>
      <div class="art-foot">
        <button class="ai-btn alt" data-art-act="download">ดาวน์โหลด</button>
        ${a.saved ? '' : `<button class="ai-btn" data-art-act="save" data-art="${a.id}">บันทึกลงไดร์…</button>`}
      </div>`;
  };

  U.bindViewer = (root) => {
    root.querySelectorAll('[data-art-tab]').forEach(b => b.addEventListener('click', () => { S.viewArtifactId = b.dataset.artTab; emit('view'); }));
    root.querySelectorAll('[data-art-act]').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.artAct === 'download') showToast('ดาวน์โหลด (จำลอง — ยังไม่ต่อระบบจริง)');
      else U.saveDialog([b.dataset.art]);
    }));
  };

  // ----- dialogs -----
  const overlay = document.createElement('div');
  overlay.className = 'drv-modal-overlay';
  overlay.style.zIndex = '360';
  document.body.appendChild(overlay);
  const closeOverlay = () => { overlay.classList.remove('open'); overlay.innerHTML = ''; };
  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) closeOverlay(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.classList.contains('open')) closeOverlay(); });

  // Pick where to save one or more drafts as real Drive files.
  U.saveDialog = (ids, after) => {
    const arts = ids.map(S.artifact).filter(a => a && !a.saved);
    if (!arts.length) return;
    const ctx = U.driveContext();
    const opts = [{ dest: { type: 'root' }, label: 'ไดร์ของฉัน', sub: false }]
      .concat(DRV_PERSONAL_FOLDERS.map(f => ({ dest: { type: 'folder', id: f.id }, label: 'ไดร์ของฉัน / ' + f.name, sub: true })))
      .concat(ALL_PROJECTS.map(p => ({ dest: { type: 'project', key: p.keyPrefix }, label: 'ไดร์งาน / ' + p.name, sub: false })));
    const key = (d) => d.type + ':' + (d.id || d.key || '');
    const defKey = ctx ? key(ctx.dest) : 'root:';
    overlay.innerHTML = `
      <div class="drv-modal" role="dialog" aria-label="บันทึกลงไดร์">
        <div class="drv-modal-head"><img src="${ICON('menu-folder')}" width="16" height="16" alt=""><span>บันทึกลงไดร์</span></div>
        <div class="drv-modal-body">
          <div class="drv-gd-chips">${arts.slice(0, 3).map(a => `<span class="drv-gd-chip">${DOC_SVG}<span>${esc(a.name)}</span></span>`).join('')}${arts.length > 3 ? `<span class="drv-gd-more">+${arts.length - 3} ไฟล์</span>` : ''}</div>
          <div class="sv-list">${opts.map((o, i) => `
            <label class="sv-opt ${o.sub ? 'sub' : ''}"><input type="radio" name="svDest" value="${i}" ${key(o.dest) === defKey ? 'checked' : ''}><span>${esc(o.label)}</span></label>`).join('')}</div>
        </div>
        <div class="drv-modal-actions">
          <button class="drv-modal-cancel" id="svCancel">ยกเลิก</button>
          <button class="drv-modal-ok" id="svOk">บันทึก</button>
        </div>
      </div>`;
    overlay.classList.add('open');
    document.getElementById('svCancel').addEventListener('click', closeOverlay);
    document.getElementById('svOk').addEventListener('click', () => {
      const dest = opts[+overlay.querySelector('input[name="svDest"]:checked').value];
      arts.forEach(a => S.saveArtifact(a.id, dest.dest));
      closeOverlay();
      if (isVisible('drivePage')) driveRefreshKeepScroll();
      showToast('บันทึก ' + arts.length + ' ไฟล์ลง ' + dest.label + ' แล้ว');
      if (after) after();
    });
  };

  // Deleting a chat is permanent, including any drafts that were never saved.
  U.deleteDialog = (chatId) => {
    const c = S.chat(chatId);
    if (!c) return;
    const unsaved = S.unsavedOf(chatId);
    overlay.innerHTML = `
      <div class="drv-modal" role="dialog" aria-label="ลบแชทถาวร">
        <div class="drv-modal-head danger"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><span>ลบแชทนี้ถาวร?</span></div>
        <div class="drv-modal-body">
          <p class="cdel-msg">แชท <b>“${esc(c.title)}”</b> จะถูกลบออกจากระบบทันที การลบนี้เป็นการลบถาวร <b>ไม่สามารถกู้คืนกลับมาได้ไม่ว่ากรณีใดๆ</b></p>
          ${unsaved.length ? `<div class="cdel-warn"><b>มีผลงานร่าง ${unsaved.length} ชิ้นที่ยังไม่ได้บันทึกลงไดร์ และจะหายไปด้วย</b><ul>${unsaved.map(a => `<li>${esc(a.name)}</li>`).join('')}</ul></div>` : ''}
        </div>
        <div class="drv-modal-actions">
          <button class="drv-modal-cancel" id="cdCancel" style="color:#a7a7a7">ยกเลิก</button>
          <div class="cdel-right">
            ${unsaved.length ? '<button class="drv-modal-alt" id="cdSave">บันทึกลงไดร์ก่อน</button>' : ''}
            <button class="drv-modal-danger" id="cdDelete">ลบถาวร</button>
          </div>
        </div>
      </div>`;
    overlay.classList.add('open');
    document.getElementById('cdCancel').addEventListener('click', closeOverlay);
    const save = document.getElementById('cdSave');
    if (save) save.addEventListener('click', () => U.saveDialog(unsaved.map(a => a.id), () => U.deleteDialog(chatId)));
    document.getElementById('cdDelete').addEventListener('click', () => { closeOverlay(); S.deleteChat(chatId); showToast('ลบแชทแล้ว'); });
  };
})();
