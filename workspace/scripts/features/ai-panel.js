// ---------- AI panel (right dock) ----------
// One dock for every page. Content depends on the page:
//  - Drive / Workspace: a chat with the AI (same chats as the Chatbot page, via ChatStore)
//  - Chatbot page: the Result (artifact) viewer, since the conversation is already the page itself
(function () {
  const app = document.querySelector('.app');
  const icon = (n) => `assets/icons/${n}.svg`;
  const S = window.ChatStore;
  const U = window.ChatUI;
  const esc = (s) => driveEsc(String(s));

  let isOpen = false;
  let view = 'chat'; // 'chat' | 'artifact' (artifact only used off the Chatbot page)
  let pendingDraft = ''; // text typed in a search bar that should land in the panel's input

  // Top-level page: the search bars only exist on 'workspace' and 'drive'.
  const vis = (id) => { const el = document.getElementById(id); return !!el && el.style.display !== 'none'; };
  const topPage = () => vis('chatbotPage') ? 'chatbot' : vis('drivePage') ? 'drive' : 'workspace';
  let lastTop = 'workspace';

  // While the chat is open beside Drive/Workspace it IS the search, so those page search bars hide (CSS keys off ai-chat-open).
  function applyState() {
    app.classList.toggle('ai-open', isOpen);
    app.classList.toggle('ai-chat-open', isOpen && topPage() !== 'chatbot');
  }

  // Anything already typed into a visible search bar moves into the panel instead of being lost.
  function takeBarDraft() {
    const inputs = document.querySelectorAll('#workspacePage .prompt-input, #dashboardPage .prompt-input, #drivePage .prompt-input');
    for (const i of inputs) {
      if (i.offsetParent !== null && i.value.trim()) { pendingDraft = i.value; i.value = ''; return; }
    }
  }

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

  function setOpen(v) {
    if (v && !isOpen) takeBarDraft();
    isOpen = v;
    applyState();
    if (v) render();
  }

  // The artifact to show: the selected one if it still exists, else the newest of the active chat.
  function currentArtifactId() {
    if (S.viewArtifactId && S.artifact(S.viewArtifactId)) return S.viewArtifactId;
    const c = S.active();
    const list = c ? S.artifactsOf(c.id) : [];
    return list.length ? list[0].id : null;
  }

  // ----- rendering -----
  function closeBtn() {
    return `<button class="ai-icon-btn" id="aiClose" aria-label="ปิด AI panel"><img src="${icon('ai-sidebar')}" width="24" height="24" alt=""></button>`;
  }

  function resultHtml() {
    return `
      <div class="ai-head">${closeBtn()}<span class="ai-head-title">ผลลัพธ์</span></div>
      <div class="ai-viewer">${U.viewerHtml(currentArtifactId())}</div>`;
  }

  function artifactHtml() {
    return `
      <div class="ai-head">${closeBtn()}<button class="ai-expand" id="aiBack"><span>← กลับแชท</span></button></div>
      <div class="ai-viewer">${U.viewerHtml(currentArtifactId())}</div>`;
  }

  function chatHtml() {
    const c = S.active();
    const mode = S.mode();
    const M = S.MODES;
    return `
      <div class="ai-head">
        ${closeBtn()}
        <button class="ai-expand" id="aiExpand"><span>ขยายแชท</span><span class="ai-scale"><img src="${icon('ai-scale')}" alt=""></span></button>
      </div>
      <div class="ai-session">
        <div class="ai-session-ico"><img src="${icon('ai-chat')}" width="16" height="16" alt=""></div>
        <button class="ai-session-pill" id="aiSessionPill"><span>${esc(c ? c.title : S.NEW_TITLE)}</span><img src="${icon('ai-arrow')}" width="8" height="16" alt="" style="transform:rotate(90deg)"></button>
        <div class="ai-pop ai-session-pop" id="aiSessionPop" hidden></div>
      </div>
      <div class="ai-msgs" id="aiMsgs">${U.messagesHtml(c, mode)}</div>
      <div class="ai-input">
        <textarea id="aiInput" rows="2" placeholder="${M[mode].placeholder}"></textarea>
        <div class="ai-input-row">
          <div class="ai-input-left">
            <button class="ai-icon-btn sm" data-stub-ai aria-label="แนบไฟล์"><img src="${icon('ai-plus')}" width="16" height="16" alt=""></button>
            <button class="ai-icon-btn sm" id="aiModeBtn" aria-label="เครื่องมือ AI"><span class="ai-toolico"><img src="${icon('ai-tool')}" alt=""></span></button>
            <button class="ai-icon-btn sm" data-stub-ai aria-label="ใช้งานล่าสุด"><img src="${icon('ai-used')}" width="20" height="20" alt=""></button>
            <button class="ai-mode-chip" id="aiModeChip">${M[mode].short}</button>
          </div>
          <div class="ai-input-right">
            <button class="ai-model" data-stub-ai><span>Thinking</span><img src="${icon('ai-arrow')}" width="8" height="16" alt="" style="transform:rotate(90deg)"></button>
            <button class="ai-send" id="aiSend" aria-label="ส่ง" ${c && c.busy ? 'disabled' : ''}><img src="${icon('ai-send')}" width="34" height="34" alt=""></button>
          </div>
        </div>
        <div class="ai-pop ai-mode-pop" id="aiModePop" hidden></div>
      </div>`;
  }

  function render() {
    if (!isOpen) return;
    const onChat = U.isVisible('chatbotPage');
    const prevInput = document.getElementById('aiInput');
    const draft = pendingDraft || (prevInput ? prevInput.value : '');
    pendingDraft = '';
    dock.innerHTML = onChat ? resultHtml() : (view === 'artifact' ? artifactHtml() : chatHtml());
    document.getElementById('aiClose').addEventListener('click', () => setOpen(false));
    if (onChat || view === 'artifact') {
      U.bindViewer(dock);
      const back = document.getElementById('aiBack');
      if (back) back.addEventListener('click', () => { view = 'chat'; render(); });
      return;
    }
    bindChat(draft);
  }

  function bindChat(draft) {
    document.getElementById('aiExpand').addEventListener('click', () => { S.holdNext = true; setOpen(false); openChatbotPage(); });
    dock.querySelectorAll('[data-stub-ai]').forEach(el => el.addEventListener('click', () => showToast('ฟีเจอร์นี้ยังไม่พร้อมใช้งานใน prototype นี้')));

    const input = document.getElementById('aiInput');
    if (draft) input.value = draft;
    const send = () => {
      const t = input.value.trim();
      if (!t) { input.focus(); return; }
      const c = S.active();
      if (c && c.busy) return;
      input.value = '';
      S.send(t);
    };
    document.getElementById('aiSend').addEventListener('click', send);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });

    const msgs = document.getElementById('aiMsgs');
    U.bindMessages(msgs);
    msgs.scrollTop = msgs.scrollHeight;

    const sessionPop = document.getElementById('aiSessionPop');
    const modePop = document.getElementById('aiModePop');
    const closePops = () => { sessionPop.hidden = true; modePop.hidden = true; };
    document.getElementById('aiSessionPill').addEventListener('click', (e) => {
      e.stopPropagation();
      const wasHidden = sessionPop.hidden;
      closePops();
      if (!wasHidden) return;
      const active = S.activeId;
      const chats = S.chats.slice().sort((a, b) => b.createdAt - a.createdAt);
      sessionPop.innerHTML = `<button class="ai-pop-item" data-new="1">＋ ${S.NEW_TITLE}</button>` + chats.map(x =>
        `<div class="ai-pop-row ${x.id === active ? 'on' : ''}"><button class="ai-pop-item" data-sid="${x.id}"><span>${esc(x.title)}</span><em>${S.MODES[x.mode].short}</em></button><button class="ai-pop-del" data-del="${x.id}" aria-label="ลบแชท">✕</button></div>`).join('');
      sessionPop.hidden = false;
      sessionPop.querySelectorAll('[data-sid]').forEach(b => b.addEventListener('click', () => S.open(b.dataset.sid)));
      sessionPop.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', (ev) => { ev.stopPropagation(); closePops(); U.deleteDialog(b.dataset.del); }));
      sessionPop.querySelector('[data-new]').addEventListener('click', () => S.newBlank());
    });
    const openModePop = (e) => {
      e.stopPropagation();
      const wasHidden = modePop.hidden;
      closePops();
      if (!wasHidden) return;
      const cur = S.mode();
      modePop.innerHTML = Object.keys(S.MODES).map(k =>
        `<button class="ai-pop-item ${k === cur ? 'on' : ''}" data-mode="${k}"><span>${S.MODES[k].label}</span>${S.MODES[k].hint ? `<em>${S.MODES[k].hint}</em>` : ''}</button>`).join('');
      modePop.hidden = false;
      modePop.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => S.setMode(b.dataset.mode)));
    };
    document.getElementById('aiModeBtn').addEventListener('click', openModePop);
    document.getElementById('aiModeChip').addEventListener('click', openModePop);
    dock.addEventListener('click', (e) => { if (!e.target.closest('.ai-pop')) closePops(); }, { once: true });
  }

  // Public entry: Drive "+ เพิ่ม" menu opens the chat with a mode preselected.
  window.openAiPanel = function (mode) {
    view = 'chat';
    if (mode && S.MODES[mode]) S.setMode(mode);
    if (!isOpen) { takeBarDraft(); isOpen = true; applyState(); }
    render();
    const inp = document.getElementById('aiInput');
    if (inp) inp.focus();
  };

  // ----- search bars on Workspace / Project / Drive send into this chat -----
  function sendFromBar(text) {
    const c = S.active();
    view = 'chat';
    if (!isOpen) { isOpen = true; applyState(); }
    if (c && c.busy) {
      pendingDraft = text;
      render();
      showToast('AI กำลังตอบอยู่ — ส่งต่อได้เมื่อตอบเสร็จ');
      return;
    }
    S.send(text); // continues the active chat (or starts one) and re-renders the panel
    const inp = document.getElementById('aiInput');
    if (inp) inp.focus();
  }

  const inPageBar = (el) => {
    const bar = el && el.closest && el.closest('.prompt-bar');
    return bar && bar.closest('#workspacePage, #dashboardPage, #drivePage') ? bar : null;
  };
  const submitBar = (bar) => {
    const inp = bar.querySelector('.prompt-input');
    const t = inp.value.trim();
    if (!t) { inp.focus(); return; }
    inp.value = '';
    sendFromBar(t);
  };
  // Capture phase so the old placeholder handlers (toast / fill-only chips) never run.
  document.addEventListener('click', (e) => {
    const bar = inPageBar(e.target);
    if (!bar) return;
    const chip = e.target.closest('.chip');
    if (chip) { e.stopPropagation(); sendFromBar((chip.dataset.fill || chip.textContent).trim()); return; }
    if (e.target.closest('.send-btn')) { e.stopPropagation(); submitBar(bar); }
  }, true);
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.isComposing || e.shiftKey) return;
    const bar = e.target.classList && e.target.classList.contains('prompt-input') ? inPageBar(e.target) : null;
    if (bar) { e.stopPropagation(); e.preventDefault(); submitBar(bar); }
  }, true);

  // ----- store events -----
  S.subscribe((evt) => {
    const onChat = U.isVisible('chatbotPage');
    if (evt === 'artifact' && onChat && !isOpen) { isOpen = true; applyState(); }
    if (evt === 'open-artifact') {
      if (!onChat) view = 'artifact';
      if (!isOpen) { isOpen = true; applyState(); }
    }
    if (evt === 'active') view = 'chat';
    render();
  });

  toggle.addEventListener('click', () => setOpen(true));

  // Changing top-level page (Chatbot / Workspace / Drive) starts a fresh chat (the old one stays in history),
  // and the panel closes when leaving or entering the Chatbot page, where its role differs (Result vs chat).
  const pageObserver = new MutationObserver(() => {
    const now = topPage();
    if (now !== lastTop) {
      const from = lastTop;
      lastTop = now;
      if (S.holdNext) S.holdNext = false; else S.newBlank();
      if (isOpen && (from === 'chatbot' || now === 'chatbot')) isOpen = false;
      view = 'chat';
    }
    applyState();
    if (isOpen) render();
  });
  ['workspacePage', 'dashboardPage', 'chatbotPage', 'drivePage'].forEach(id => {
    const el = document.getElementById(id);
    if (el) pageObserver.observe(el, { attributes: true, attributeFilter: ['style'] });
  });
})();
