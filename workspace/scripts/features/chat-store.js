// ---------- Chat store, mock AI engine, and shared chat UI helpers ----------
// One store for the whole app: the right AI panel (Drive/Workspace) and the Chatbot
// page read the same chats, so history, pins and deletes are always in sync.
// Artifacts (Presentation / Document / Spreadsheet / Mind Map) are per-user DRAFTS
// that live with their chat and are invisible to Drive until the user saves them as a
// real file. Deleting a chat permanently deletes its drafts (no trash).
// All AI output is mocked and everything is in-memory.
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

  // Artifact types the "เครื่องมือ" cards can produce.
  const TYPES = {
    presentation: { label: 'Presentation', ext: 'PPT', file: 'pptx', icon: 'art-presentation', w: 42, h: 61 },
    document: { label: 'Document', ext: 'DOCX', file: 'docx', icon: null, w: 36, h: 52 },
    spreadsheet: { label: 'Spreadsheet', ext: 'XLSX', file: 'xlsx', icon: 'art-spreadsheet', w: 31.63, h: 50 },
    mindmap: { label: 'Mind Map', ext: 'MM', file: 'mm', icon: 'art-mindmap', w: 48, h: 50 }
  };

  const S = window.ChatStore = { chats: [], artifacts: [], activeId: null, blankMode: 'web', blankTool: null, viewArtifactId: null, holdNext: false, MODES, GREETING, STEPS, TYPES, NEW_TITLE };
  const listeners = [];
  let cseq = 0, aseq = 0;

  S.subscribe = (fn) => listeners.push(fn);
  const emit = (evt, data) => listeners.forEach(fn => fn(evt, data));
  S.emit = emit;
  const trunc = (t, n) => t.length > n ? t.slice(0, n) + '…' : t;

  S.active = () => S.chats.find(c => c.id === S.activeId) || null;
  S.chat = (id) => S.chats.find(c => c.id === id) || null;
  S.artifact = (id) => S.artifacts.find(a => a.id === id) || null;
  S.artifactsOf = (chatId) => S.artifacts.filter(a => a.chatId === chatId).sort((a, b) => b.createdAt - a.createdAt);
  S.unsavedOf = (chatId) => S.artifactsOf(chatId).filter(a => !a.saved);
  S.mode = () => (S.active() || { mode: S.blankMode }).mode;
  S.tool = () => (S.active() ? S.active().tool : S.blankTool) || null;

  // ----- chats -----
  S.newBlank = () => { S.activeId = null; S.blankTool = null; S.viewArtifactId = null; emit('active'); };
  S.open = (id) => { S.activeId = id; const arts = S.artifactsOf(id); S.viewArtifactId = arts.length ? arts[0].id : null; emit('active'); };
  S.togglePin = (id) => { const c = S.chat(id); if (c) { c.favorite = !c.favorite; emit('list'); } };
  S.rename = (id, title) => { const c = S.chat(id); if (c && title.trim()) { c.title = title.trim(); emit('list'); } };

  S.setMode = (mode) => {
    const c = S.active();
    if (!c) S.blankMode = mode;
    else if (c.messages.some(m => m.role === 'user')) { S.blankMode = mode; S.blankTool = null; S.activeId = null; S.viewArtifactId = null; }
    else c.mode = mode;
    emit('mode');
  };

  // Pick what to create (Presentation / Document / ...) before sending; only on a blank chat.
  S.setTool = (tool) => {
    if (S.active()) { S.activeId = null; S.viewArtifactId = null; }
    S.blankTool = tool;
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

  function makeChat(title, mode, fav, ageMin, tool) {
    return { id: 'c' + (++cseq), title, mode, tool: tool || null, favorite: !!fav, messages: [], busy: false, createdAt: Date.now() - (ageMin || 0) * 60000 };
  }

  // ----- mock artifact content -----
  function genContent(type, topic) {
    const t = trunc(topic, 30);
    if (type === 'presentation') {
      const slides = [
        { kind: 'title', title: topic, sub: 'สรุปผลการค้นหาและแผนสำหรับการตัดสินใจ', src: 'ข้อมูลจำลองสำหรับ prototype' },
        { title: 'ภาพรวม', bullets: ['ที่มาและวัตถุประสงค์', 'ขอบเขตของข้อมูลที่ตรวจสอบ', 'ข้อสรุปสำคัญโดยย่อ'] },
        { title: 'ประเด็นสำคัญ', bullets: ['แนวโน้มหลักที่พบซ้ำในหลายแหล่ง', 'ปัจจัยที่ส่งผลต่อผลลัพธ์', 'ความเสี่ยงที่ควรติดตาม'] },
        { title: 'ตัวเลขเปรียบเทียบ', bullets: ['ตัวเลือก A: เหมาะกับงานทั่วไป', 'ตัวเลือก B: ประหยัดกว่าเฉลี่ย 8%', 'ตัวเลือก C: เหมาะกับงานขนาดใหญ่'] },
        { title: 'ข้อเสนอแนะ', bullets: ['เริ่มจากตัวเลือกที่คุ้มค่าที่สุด', 'ทดลองกับกลุ่มเล็กก่อนขยาย', 'ทบทวนผลทุกไตรมาส'] },
        { title: 'แหล่งอ้างอิง (จำลอง)', bullets: ['example.com', 'news.example.org', 'gov.example.th'] }
      ];
      return { name: 'นำเสนอ - ' + t + '.pptx', short: 'สรุป: ' + t, title: topic, data: { slides },
        body: slides.map((s, i) => (s.kind === 'title' ? s.title + '\n' + s.sub : s.title + '\n' + s.bullets.map(b => '• ' + b).join('\n'))).join('\n\n') };
    }
    if (type === 'spreadsheet') {
      const cols = ['รายการ', 'ตัวเลือก A', 'ตัวเลือก B', 'หมายเหตุ'];
      const rows = [['ราคา (บาท)', '25,900', '23,900', 'B ถูกกว่า 8%'], ['รับประกัน (ปี)', '2', '2', 'เท่ากัน'], ['จัดส่ง (วัน)', '3', '5', 'A เร็วกว่า'], ['คะแนนรีวิว', '4.6', '4.4', 'จากผู้ใช้จริง'], ['สต็อก', 'มี', 'จำกัด', 'ตรวจสอบก่อนสั่ง']];
      return { name: 'ตาราง - ' + t + '.xlsx', short: 'สรุป: ' + t, title: topic, data: { cols, rows },
        body: cols.join('\t') + '\n' + rows.map(r => r.join('\t')).join('\n') };
    }
    if (type === 'mindmap') {
      const branches = [
        { label: 'ภาพรวม', kids: ['ที่มา', 'ขอบเขต'] }, { label: 'ประเด็นหลัก', kids: ['แนวโน้ม', 'ปัจจัย'] },
        { label: 'ข้อมูลเปรียบเทียบ', kids: ['ตัวเลือก A', 'ตัวเลือก B'] }, { label: 'ความเสี่ยง', kids: ['ต้นทุน', 'เวลา'] }, { label: 'ข้อเสนอแนะ', kids: ['ระยะสั้น', 'ระยะยาว'] }
      ];
      return { name: 'Mind Map - ' + t + '.mm', short: 'สรุป: ' + t, title: topic, data: { center: topic, branches },
        body: topic + '\n\n' + branches.map(b => '• ' + b.label + ': ' + b.kids.join(', ')).join('\n') };
    }
    const body = `ผลการค้นหาเรื่อง ${topic}\n\n• ประเด็นหลักที่พบซ้ำในหลายแหล่งข้อมูล\n• ตัวเลขและข้อมูลเปรียบเทียบเบื้องต้น\n• ข้อควรระวังและแนวทางที่แนะนำ`;
    return { name: 'สรุป - ' + t + '.docx', short: 'สรุป: ' + t, title: 'สรุป: ' + topic, data: null, body };
  }

  function makeArtifact(chat, type, topic, ageMin, over) {
    const g = Object.assign(genContent(type, topic), over || {});
    const a = { id: 'a' + (++aseq), chatId: chat.id, type, name: g.name, short: g.short, title: g.title, body: g.body, data: g.data, saved: false, dest: null, createdAt: Date.now() - (ageMin || 0) * 60000 };
    S.artifacts.unshift(a);
    return a;
  }

  // ----- conversation engine (mock) -----
  S.send = (text) => {
    let c = S.active();
    if (!c) {
      c = makeChat(trunc(text, 24), S.blankMode, false, 0, S.blankTool);
      S.chats.unshift(c);
      S.activeId = c.id;
      S.blankTool = null;
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
        const a = makeArtifact(c, c.tool || 'document', text);
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
        const type = c.tool || 'document';
        const a = makeArtifact(c, type, plan.topic, 0, type === 'document' ? { name: 'รายงานวิจัย - ' + trunc(plan.topic, 30) + '.docx', short: 'รายงานวิจัย: ' + trunc(plan.topic, 24), title: 'รายงานวิจัย: ' + plan.topic, body: `รายงานวิจัยเรื่อง ${plan.topic}\n\n• ภาพรวมและแนวโน้มสำคัญ\n• การเปรียบเทียบข้อมูลจากหลายที่มา\n• ข้อเสนอแนะและประเด็นที่ควรติดตามต่อ` } : null);
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

  // ----- seed data: chats that already produced artifacts, like the Figma modal -----
  const seed = (title, fav, ageMin, arts) => {
    const c = makeChat(title, 'web', fav, ageMin);
    c.messages.push({ type: 'text', role: 'user', paras: [title] });
    c.messages.push({ type: 'text', role: 'ai', paras: [`นี่คือคำตอบตัวอย่างสำหรับ “${title}” (ข้อมูลจำลองสำหรับ prototype)`, '• ประเด็นสำคัญข้อที่ 1', '• ประเด็นสำคัญข้อที่ 2'] });
    (arts || []).forEach(([type, topic, name]) => {
      const a = makeArtifact(c, type, topic, ageMin, name ? { short: name } : null);
      c.messages.push({ type: 'artifact', artifactId: a.id });
    });
    S.chats.push(c);
  };
  seed('สรุปยอดขายไตรมาส 2', true, 1500);
  seed('ร่างสัญญาจ้างงาน', false, 3000);
  seed('แผนการตลาดรถ EV', false, 15, [['presentation', 'ภาพรวมตลาดรถ EV', 'สรุปผลการค้นหา'], ['presentation', 'คู่แข่งและราคารถ EV', 'คู่แข่งและราคา'], ['presentation', 'แผนกลยุทธ์การตลาด EV', 'แผนกลยุทธ์']]);
  seed('เปรียบเทียบราคา Notebook', false, 120, [['spreadsheet', 'เปรียบเทียบราคา Notebook', 'สรุปผลการค้นหา']]);
  seed('Analyst Salary', false, 1440, [['mindmap', 'Analyst Salary', 'สรุปผลการค้นหา']]);
  seed('ข้อกำหนด PDPA ที่ต้องรู้', false, 3600);
  seed('สรุปประชุมทีมการตลาด', false, 14400);
  seed('แนวทางประเมินผลพนักงาน', false, 36000);
  seed('ร่างประกาศนโยบายลางาน', false, 86400);
  seed('เปรียบเทียบผู้ให้บริการคลาวด์', false, 288000);

  // ================= shared UI =================
  const esc = (s) => driveEsc(String(s));
  const ICON = (n) => `assets/icons/${n}.svg`;
  const DOC_SVG = '<svg width="20" height="20" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2.5" fill="#2B7BE4"/><path d="M8 9h8M8 13h8M8 17h5" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>';
  const DOC_LINE = '<svg width="36" height="52" viewBox="0 0 36 52" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><path d="M4 2h20l8 8v40H4z"/><path d="M24 2v8h8"/><path d="M10 22h16M10 29h16M10 36h11"/></svg>';

  const U = window.ChatUI = {};
  const isVisible = (id) => { const el = document.getElementById(id); return !!el && el.style.display !== 'none'; };
  U.isVisible = isVisible;
  const typeLabel = (a) => `${TYPES[a.type].label} | .${TYPES[a.type].ext}`;
  const typeIconHtml = (a) => {
    const T = TYPES[a.type];
    return T.icon ? `<img src="${ICON(T.icon)}" style="width:${T.w}px;height:${T.h}px" alt="">` : DOC_LINE;
  };

  U.relTime = (ts) => {
    const m = Math.max(0, Math.round((Date.now() - ts) / 60000));
    if (m < 1) return 'เมื่อสักครู่';
    if (m < 60) return m + ' นาทีที่แล้ว';
    const h = Math.round(m / 60);
    if (h < 24) return h + ' ชั่วโมงที่แล้ว';
    return Math.round(h / 24) + ' วัน';
  };

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
    if (a.section === 'work' && a.folderId) {
      const f = DRV_WORK_FOLDERS.find(x => x.id === a.folderId);
      if (f) return { dest: { type: 'work', id: f.id }, label: 'โฟลเดอร์นี้' };
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
      <div class="ai-artcard-status"><span class="ai-type">${typeLabel(a)}</span> ${status}</div>
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
      else if (act === 'open-art') U.openViewer(b.dataset.art);
      else if (act === 'save-art') U.saveDialog([b.dataset.art]);
      else if (act === 'quick-save') {
        const ctx = U.driveContext();
        if (ctx) { S.saveArtifact(b.dataset.art, ctx.dest); if (isVisible('drivePage')) driveRefreshKeepScroll(); showToast('บันทึกลง' + ctx.label + 'แล้ว'); }
      }
    }));
  };

  // ----- compact artifact preview (right Result panel) -----
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
    const tabsHtml = tabs.length > 1 ? `<div class="art-tabs">${tabs.map(t => `<button class="art-tab ${t.id === a.id ? 'on' : ''}" data-art-tab="${t.id}">${esc(t.short)}</button>`).join('')}</div>` : '';
    const status = a.saved ? `<span class="ai-saved">บันทึกแล้ว · ${esc(a.dest)}</span>` : '<span class="ai-draft">ร่าง · ยังไม่ได้บันทึกที่ใด (จะหายไปเมื่อลบแชท)</span>';
    return `${tabsHtml}
      <div class="art-meta"><span class="art-name">${esc(a.name)}</span><span class="ai-type">${typeLabel(a)}</span>${status}</div>
      <div class="art-page"><h1>${esc(a.title)}</h1>${bodyHtml(a.type === 'presentation' ? a.data.slides.slice(1).map(s => s.title + '\n' + s.bullets.map(b => '• ' + b).join('\n')).join('\n') : a.body.split('\n').slice(a.type === 'document' ? 2 : 0).join('\n'))}</div>
      <div class="art-foot">
        <button class="ai-btn alt" data-art-act="full" data-art="${a.id}">เปิดเต็มจอ</button>
        ${a.saved ? '' : `<button class="ai-btn" data-art-act="save" data-art="${a.id}">บันทึกลงไดร์…</button>`}
      </div>`;
  };

  U.bindViewer = (root) => {
    root.querySelectorAll('[data-art-tab]').forEach(b => b.addEventListener('click', () => { S.viewArtifactId = b.dataset.artTab; emit('view'); }));
    root.querySelectorAll('[data-art-act]').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.artAct === 'full') U.openViewer(b.dataset.art);
      else U.saveDialog([b.dataset.art]);
    }));
  };

  // ----- full-screen artifact viewer (Figma "Present") -----
  const viewer = document.createElement('div');
  viewer.className = 'av';
  document.body.appendChild(viewer);
  const av = { id: null, slide: 0 };

  function closeViewer() { viewer.classList.remove('open'); viewer.innerHTML = ''; av.id = null; }

  function slideHtml(s) {
    if (s.kind === 'title') return `<div class="sl sl-title"><div class="sl-box"><h1>${esc(s.title)}</h1><p class="sl-sub">${esc(s.sub)}</p><p class="sl-src">${esc(s.src)}</p></div></div>`;
    return `<div class="sl"><h2>${esc(s.title)}</h2><ul>${s.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul><span class="sl-tag">PHAK</span></div>`;
  }

  function mindmapHtml(d) {
    const cx = 450, cy = 280, R1 = 175, R2 = 285;
    const ang = [-90, -18, 54, 126, 198];
    let lines = '', nodes = `<div class="mm-node center" style="left:${cx}px;top:${cy}px">${esc(d.center)}</div>`;
    d.branches.forEach((b, i) => {
      const a = ang[i % ang.length] * Math.PI / 180;
      const bx = cx + R1 * Math.cos(a), by = cy + R1 * Math.sin(a);
      lines += `<line x1="${cx}" y1="${cy}" x2="${bx}" y2="${by}"/>`;
      nodes += `<div class="mm-node branch" style="left:${bx}px;top:${by}px">${esc(b.label)}</div>`;
      b.kids.forEach((k, j) => {
        const a2 = a + (j ? 0.32 : -0.32);
        const kx = cx + R2 * Math.cos(a2), ky = cy + R2 * Math.sin(a2);
        lines += `<line x1="${bx}" y1="${by}" x2="${kx}" y2="${ky}"/>`;
        nodes += `<div class="mm-node kid" style="left:${kx}px;top:${ky}px">${esc(k)}</div>`;
      });
    });
    return `<div class="av-mm"><svg width="900" height="560" viewBox="0 0 900 560">${lines}</svg>${nodes}</div>`;
  }

  function renderViewer() {
    const a = S.artifact(av.id);
    if (!a) { closeViewer(); return; }
    const status = a.saved ? `<span class="ai-saved">บันทึกแล้ว · ${esc(a.dest)}</span>` : '<span class="ai-draft">ร่าง · ยังไม่ได้บันทึกที่ใด</span>';
    let stage;
    if (a.type === 'presentation') {
      const slides = a.data.slides;
      stage = `<div class="av-slide">${slideHtml(slides[av.slide])}</div>`;
    } else if (a.type === 'spreadsheet') {
      stage = `<div class="av-sheet"><table><thead><tr>${a.data.cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${a.data.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    } else if (a.type === 'mindmap') stage = mindmapHtml(a.data);
    else stage = `<div class="av-doc"><h1>${esc(a.title)}</h1>${bodyHtml(a.body.split('\n').slice(2).join('\n'))}</div>`;

    let pager = '';
    if (a.type === 'presentation') {
      const n = a.data.slides.length;
      pager = `<div class="av-pager"><button class="av-arrow prev" data-av-step="-1" aria-label="ก่อนหน้า"></button><div class="av-track">${
        Array.from({ length: n }, (_, i) => i === av.slide ? '<span class="av-seg"></span>' : `<button class="av-dot" data-av-go="${i}" aria-label="สไลด์ ${i + 1}"></button>`).join('')
      }</div><button class="av-arrow next" data-av-step="1" aria-label="ถัดไป"></button></div>`;
    }
    viewer.innerHTML = `
      <div class="av-top">
        <div class="av-title"><span class="nm">${esc(a.name)}</span><span class="ai-type">${typeLabel(a)}</span>${status}</div>
        <div class="av-actions">
          ${a.saved ? '' : '<button class="ai-btn sm" id="avSave">บันทึกลงไดร์…</button>'}
          <button class="ai-btn sm alt" id="avDownload">ดาวน์โหลด</button>
          <button class="av-close" id="avClose" aria-label="ปิด">✕</button>
        </div>
      </div>
      <div class="av-stage">${stage}</div>${pager}`;
    document.getElementById('avClose').addEventListener('click', closeViewer);
    document.getElementById('avDownload').addEventListener('click', () => showToast('ดาวน์โหลด (จำลอง — ยังไม่ต่อระบบจริง)'));
    const save = document.getElementById('avSave');
    if (save) save.addEventListener('click', () => U.saveDialog([a.id], renderViewer));
    viewer.querySelectorAll('[data-av-step]').forEach(b => b.addEventListener('click', () => stepSlide(+b.dataset.avStep)));
    viewer.querySelectorAll('[data-av-go]').forEach(b => b.addEventListener('click', () => { av.slide = +b.dataset.avGo; renderViewer(); }));
  }

  function stepSlide(d) {
    const a = S.artifact(av.id);
    if (!a || a.type !== 'presentation') return;
    const n = a.data.slides.length;
    av.slide = Math.max(0, Math.min(n - 1, av.slide + d));
    renderViewer();
  }

  U.openViewer = (id) => { av.id = id; av.slide = 0; viewer.classList.add('open'); renderViewer(); };
  U.isViewerOpen = () => viewer.classList.contains('open');
  document.addEventListener('keydown', (e) => {
    if (!viewer.classList.contains('open')) return;
    if (e.key === 'Escape') closeViewer();
    else if (e.key === 'ArrowRight') stepSlide(1);
    else if (e.key === 'ArrowLeft') stepSlide(-1);
  });
  // keep the viewer honest if the artifact/chat is deleted or saved elsewhere
  S.subscribe(() => { if (viewer.classList.contains('open')) renderViewer(); });

  // ----- "แชททั้งหมด" modal: every chat that has artifacts (Figma 547:100145) -----
  const am = document.createElement('div');
  am.className = 'am-overlay';
  document.body.appendChild(am);
  const amState = { q: '', asc: false, search: false };

  function closeAm() { am.classList.remove('open'); am.innerHTML = ''; }

  function renderAm() {
    let groups = S.chats.map(c => ({ c, arts: S.artifactsOf(c.id) })).filter(g => g.arts.length);
    const q = amState.q.trim().toLowerCase();
    if (q) groups = groups.filter(g => g.c.title.toLowerCase().includes(q) || g.arts.some(a => (a.short + a.name).toLowerCase().includes(q)));
    groups.forEach(g => { g.t = Math.max(...g.arts.map(a => a.createdAt)); });
    groups.sort((a, b) => amState.asc ? a.t - b.t : b.t - a.t);
    am.innerHTML = `
      <div class="am" role="dialog" aria-label="แชททั้งหมด">
        <div class="am-inner">
          <div class="am-head">
            <h2>แชททั้งหมด</h2>
            <div class="am-tools">
              ${amState.search ? `<input class="am-search" id="amQ" type="text" placeholder="ค้นหาแชทหรือผลงาน" value="${esc(amState.q)}">` : ''}
              <button class="am-ico" id="amSearchBtn" aria-label="ค้นหา"><img src="${ICON('art-search')}" width="16" height="16" alt=""></button>
              <button class="am-ico ${amState.asc ? 'flip' : ''}" id="amSort" aria-label="เรียงลำดับ"><img src="${ICON('art-sort')}" width="24" height="24" alt=""></button>
              <button class="am-new" id="amNew"><img src="${ICON('art-chat')}" width="16" height="16" alt=""><span>New</span></button>
            </div>
          </div>
          ${groups.length ? groups.map(g => `
            <div class="am-group">
              <button class="am-chat" data-am-chat="${g.c.id}"><span class="t">${esc(g.c.title)}</span><span class="time">${U.relTime(g.t)}</span></button>
              <div class="am-list">${g.arts.map(a => `
                <button class="am-card" data-am-art="${a.id}">
                  <span class="am-icon">${typeIconHtml(a)}</span>
                  <span class="am-txt"><span class="nm"><span>${esc(a.short)}</span><img src="${ICON('art-play')}" width="16" height="16" alt="" style="transform:rotate(90deg)"></span><span class="sub">${typeLabel(a)}</span></span>
                </button>`).join('')}</div>
            </div>`).join('') : `<div class="am-empty">${q ? 'ไม่พบผลลัพธ์' : 'ยังไม่มีผลงานในแชทใด<br><small>เอกสารที่ AI สร้างจะเก็บเป็นร่างที่นี่ จนกว่าจะบันทึกลงไดร์</small>'}</div>`}
        </div>
      </div>`;
    document.getElementById('amSearchBtn').addEventListener('click', () => { amState.search = !amState.search; if (!amState.search) amState.q = ''; renderAm(); const i = document.getElementById('amQ'); if (i) i.focus(); });
    const qi = document.getElementById('amQ');
    if (qi) qi.addEventListener('input', () => { amState.q = qi.value; const pos = qi.selectionStart; renderAm(); const n = document.getElementById('amQ'); n.focus(); n.setSelectionRange(pos, pos); });
    document.getElementById('amSort').addEventListener('click', () => { amState.asc = !amState.asc; renderAm(); });
    document.getElementById('amNew').addEventListener('click', () => { closeAm(); S.newBlank(); if (!isVisible('chatbotPage')) { S.holdNext = true; openChatbotPage(); } });
    am.querySelectorAll('[data-am-chat]').forEach(b => b.addEventListener('click', () => { closeAm(); S.open(b.dataset.amChat); if (!isVisible('chatbotPage')) openChatbotPage(); }));
    am.querySelectorAll('[data-am-art]').forEach(b => b.addEventListener('click', () => { closeAm(); U.openViewer(b.dataset.amArt); }));
  }

  U.artifactsModal = () => { amState.q = ''; amState.search = false; am.classList.add('open'); renderAm(); };
  am.addEventListener('mousedown', (e) => { if (e.target === am) closeAm(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && am.classList.contains('open') && !viewer.classList.contains('open')) closeAm(); });
  S.subscribe(() => { if (am.classList.contains('open')) renderAm(); });

  // ----- "แชททั้งหมด" modal opened from Recents: every chat with time, sort, search, and a ⋮ menu (Figma 547:93885) -----
  const TH_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  // <1h minutes, <1d hours, up to 7 days "N วันที่แล้ว", older = Thai Buddhist-era date.
  U.chatTime = (ts) => {
    const m = Math.max(0, Math.round((Date.now() - ts) / 60000));
    if (m < 1) return 'เมื่อสักครู่';
    if (m < 60) return m + ' นาทีที่แล้ว';
    const h = Math.round(m / 60);
    if (h < 24) return h + ' ชั่วโมงที่แล้ว';
    const d = Math.floor(h / 24);
    if (d <= 7) return d + ' วันที่แล้ว';
    const dt = new Date(ts);
    return dt.getDate() + ' ' + TH_MONTHS[dt.getMonth()] + ' ' + (dt.getFullYear() + 543);
  };

  const cm = document.createElement('div');
  cm.className = 'am-overlay';
  document.body.appendChild(cm);
  const cmState = { q: '', asc: false, search: false };

  function closeCm() { cm.classList.remove('open'); cm.innerHTML = ''; document.querySelectorAll('.chat-menu.cm-pop').forEach(m => m.remove()); }

  // Small floating menu next to an anchor; closes on any outside click.
  function cmPop(anchor, html, cls, onPick) {
    document.querySelectorAll('.chat-menu.cm-pop').forEach(m => m.remove());
    const menu = document.createElement('div');
    menu.className = 'chat-menu cm-pop ' + (cls || '');
    menu.innerHTML = html;
    document.body.appendChild(menu);
    const r = anchor.getBoundingClientRect();
    menu.style.top = (r.bottom + 4) + 'px';
    menu.style.left = Math.max(8, Math.min(window.innerWidth - menu.offsetWidth - 8, r.right - menu.offsetWidth)) + 'px';
    const close = () => { menu.remove(); document.removeEventListener('mousedown', outside, true); };
    const outside = (e) => { if (!menu.contains(e.target)) close(); };
    setTimeout(() => document.addEventListener('mousedown', outside, true), 0);
    menu.querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', () => { close(); onPick(b.dataset.pick); }));
  }

  function renderCm() {
    const q = cmState.q.trim().toLowerCase();
    let chats = S.chats.filter(c => !q || c.title.toLowerCase().includes(q));
    chats = chats.sort((a, b) => cmState.asc ? a.createdAt - b.createdAt : b.createdAt - a.createdAt);
    cm.innerHTML = `
      <div class="am" role="dialog" aria-label="แชททั้งหมด">
        <div class="am-inner">
          <div class="am-head">
            <h2>แชททั้งหมด</h2>
            <div class="am-tools">
              ${cmState.search ? `<input class="am-search" id="cmQ" type="text" placeholder="ค้นหาแชท" value="${esc(cmState.q)}">` : ''}
              <button class="am-ico" id="cmSearchBtn" aria-label="ค้นหา"><img src="${ICON('art-search')}" width="16" height="16" alt=""></button>
              <button class="am-ico" id="cmSort" aria-label="เรียงลำดับ"><img src="${ICON('art-sort')}" width="24" height="24" alt=""></button>
              <button class="am-new" id="cmNew"><img src="${ICON('art-chat')}" width="16" height="16" alt=""><span>New</span></button>
            </div>
          </div>
          <div class="cm-list">
            ${chats.length ? chats.map(c => `
              <div class="cm-row ${c.id === S.activeId ? 'active' : ''}" data-cm-chat="${c.id}" role="button" tabindex="0">
                <span class="t">${esc(c.title)}</span>
                <span class="time">${U.chatTime(c.createdAt)}</span>
                <img class="more" data-cm-more="${c.id}" src="${ICON('art-more')}" width="16" height="16" alt="เพิ่มเติม">
              </div>`).join('') : `<div class="am-empty">${q ? 'ไม่พบแชท' : 'ยังไม่มีแชท'}</div>`}
          </div>
        </div>
      </div>`;
    document.getElementById('cmSearchBtn').addEventListener('click', () => { cmState.search = !cmState.search; if (!cmState.search) cmState.q = ''; renderCm(); const i = document.getElementById('cmQ'); if (i) i.focus(); });
    const qi = document.getElementById('cmQ');
    if (qi) qi.addEventListener('input', () => { cmState.q = qi.value; const pos = qi.selectionStart; renderCm(); const n = document.getElementById('cmQ'); n.focus(); n.setSelectionRange(pos, pos); });
    document.getElementById('cmSort').addEventListener('click', (e) => {
      cmPop(e.currentTarget, `<button data-pick="desc" class="${cmState.asc ? '' : 'on'}">ใหม่สุด</button><button data-pick="asc" class="${cmState.asc ? 'on' : ''}">เก่าสุด</button>`, 'cm-sort', (k) => { cmState.asc = k === 'asc'; renderCm(); });
    });
    document.getElementById('cmNew').addEventListener('click', () => { closeCm(); S.newBlank(); if (!isVisible('chatbotPage')) { S.holdNext = true; openChatbotPage(); } });
    cm.querySelectorAll('[data-cm-chat]').forEach(row => row.addEventListener('click', (e) => {
      if (e.target.closest('[data-cm-more]')) return;
      closeCm(); S.open(row.dataset.cmChat); if (!isVisible('chatbotPage')) { S.holdNext = true; openChatbotPage(); }
    }));
    cm.querySelectorAll('[data-cm-more]').forEach(ico => ico.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = ico.dataset.cmMore;
      const c = S.chat(id);
      cmPop(ico,
        `<button data-pick="fav"><img src="${ICON('art-pin-fill')}" width="16" height="16" alt=""><span>${c.favorite ? 'Unfavorite' : 'Favorite'}</span></button>
         <button data-pick="rename"><img src="${ICON('art-edit')}" width="16" height="16" alt=""><span>Rename</span></button>
         <hr>
         <button data-pick="del" class="danger"><img src="${ICON('art-trash')}" width="16" height="16" alt=""><span>Delete</span></button>`,
        '', (pick) => {
          if (pick === 'fav') S.togglePin(id);
          else if (pick === 'rename') U.renameDialog(id);
          else U.deleteDialog(id);
        });
    }));
  }

  U.chatsModal = () => { cmState.q = ''; cmState.search = false; cmState.asc = false; cm.classList.add('open'); renderCm(); };
  cm.addEventListener('mousedown', (e) => { if (e.target === cm) closeCm(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && cm.classList.contains('open') && !document.querySelector('.chat-menu.cm-pop') && !overlayOpen()) closeCm(); });
  S.subscribe(() => { if (cm.classList.contains('open')) renderCm(); });
  const overlayOpen = () => { const o = document.querySelector('.drv-modal-overlay.open'); return !!o; };

  // ----- dialogs -----
  const overlay = document.createElement('div');
  overlay.className = 'drv-modal-overlay';
  overlay.style.zIndex = '400';
  document.body.appendChild(overlay);
  const closeOverlay = () => { overlay.classList.remove('open'); overlay.innerHTML = ''; };
  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) closeOverlay(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.classList.contains('open')) closeOverlay(); });

  U.renameDialog = (chatId) => {
    const c = S.chat(chatId);
    if (!c) return;
    overlay.innerHTML = `
      <div class="drv-modal" role="dialog" aria-label="เปลี่ยนชื่อแชท">
        <div class="drv-modal-head"><img src="${ICON('art-edit')}" width="16" height="16" alt=""><span>Rename</span></div>
        <div class="drv-modal-body"><div class="drv-modal-field"><label for="rnInput">ชื่อแชท</label><input id="rnInput" type="text" value="${esc(c.title)}" autocomplete="off"></div></div>
        <div class="drv-modal-actions"><button class="drv-modal-cancel" id="rnCancel">ยกเลิก</button><button class="drv-modal-ok" id="rnOk">ตกลง</button></div>
      </div>`;
    overlay.classList.add('open');
    const inp = document.getElementById('rnInput');
    inp.focus(); inp.select();
    const ok = document.getElementById('rnOk');
    const sync = () => { ok.disabled = !inp.value.trim(); };
    sync();
    inp.addEventListener('input', sync);
    const submit = () => { if (ok.disabled) return; S.rename(chatId, inp.value); closeOverlay(); };
    ok.addEventListener('click', submit);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
    document.getElementById('rnCancel').addEventListener('click', closeOverlay);
  };

  // Pick where to save one or more drafts as real Drive files.
  U.saveDialog = (ids, after) => {
    const arts = ids.map(S.artifact).filter(a => a && !a.saved);
    if (!arts.length) return;
    const ctx = U.driveContext();
    const opts = [{ dest: { type: 'root' }, label: 'ไดร์ของฉัน', sub: false }]
      .concat(DRV_PERSONAL_FOLDERS.map(f => ({ dest: { type: 'folder', id: f.id }, label: 'ไดร์ของฉัน / ' + f.name, sub: true })))
      .concat(DRV_WORK_FOLDERS.map(f => ({ dest: { type: 'work', id: f.id }, label: 'ไดร์งาน / ' + f.name, sub: false })));
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
