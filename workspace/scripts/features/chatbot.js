  function openChatbotPage() {
    ensureNormalSidebar();
    sidebar.style.display = 'none';
    chatSidebar.style.display = 'flex';
    workspacePage.style.display = 'none';
    dashboardPage.style.display = 'none';
    dashboardPage.innerHTML = '';
    const drvp = document.getElementById('drivePage');
    if (drvp) { drvp.style.display = 'none'; drvp.innerHTML = ''; }
    document.getElementById('chatbotPage').style.display = 'flex';
    CURRENT_VIEW = null;

    chatSidebar.innerHTML = `
      <div class="sidebar-top">
        <div class="brand-row">
          <div class="brand">
            <img class="brand-logo" src="${BRAND_LOGO}" alt="PHAK Second Brain">
          </div>
          <button class="icon-btn" id="chatSidebarToggle" aria-label="พับ/ขยายเมนู">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="9" y1="4" x2="9" y2="20"/></svg>
          </button>
        </div>
        <button class="chat-newbtn" id="chatNewBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          New Chat
        </button>
        <div id="chatSideTabs" class="chat-side-tabs"></div>
        <div id="chatSideBody" style="display:flex; flex-direction:column; gap:16px; width:100%;"></div>
      </div>
      <div class="sidebar-footer">
        <div class="divider"></div>
        <div class="user-row">
          <div class="user-avatar"></div>
          <div class="user-info">
            <span class="name">${CURRENT_USER.name} (CEO)</span>
            <span class="email">${CURRENT_USER.email}</span>
          </div>
        </div>
      </div>
    `;

    document.getElementById('chatbotPage').innerHTML = `
      <div class="navbar">
        <div class="navbar-tabs">
          <button class="tab active" id="chatNavTab">Chatbot</button>
          <button class="tab" id="chatWorkspaceTab">Workspace</button>
          <button class="tab" id="chatDriveTab">Drive</button>
        </div>
        <button class="notif-btn" aria-label="การแจ้งเตือน" data-stub="1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
        </button>
      </div>
      <div class="chat-glow-bg"></div>
      <div class="chat-main" id="chatMain"></div>
    `;

    document.getElementById('chatSidebarToggle').addEventListener('click', () => {
      chatSidebar.classList.toggle('collapsed');
    });
    document.getElementById('chatWorkspaceTab').addEventListener('click', showWorkspacePage);
    document.getElementById('chatDriveTab').addEventListener('click', openDriveHome);
    document.getElementById('chatNewBtn').addEventListener('click', () => ChatStore.newBlank());
    document.getElementById('chatbotPage').querySelectorAll('[data-stub]').forEach(el => {
      el.addEventListener('click', () => showToast('ฟีเจอร์นี้ยังไม่พร้อมใช้งานใน prototype นี้'));
    });
    renderChatSidebar();
    renderChatMain();
  }

  // ----- Chatbot page: sidebar (chats | drafts), landing and conversation views -----
  let chatSideTab = 'chats';
  const chatByNewest = (a, b) => b.createdAt - a.createdAt;
  const chatPageVisible = () => document.getElementById('chatbotPage').style.display !== 'none' && chatSidebar.style.display !== 'none';
  const chatDocSvg = '<svg width="18" height="18" viewBox="0 0 24 24" style="flex-shrink:0"><rect x="4" y="2" width="16" height="20" rx="2.5" fill="#2B7BE4"/><path d="M8 9h8M8 13h8M8 17h5" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>';
  const chatMoreSvg = (id) => `<svg class="more-ico" data-chat-more="${id}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/></svg>`;

  // Small floating menu next to an anchor element; closes on any outside click.
  function chatPopMenu(anchor, itemsHtml, onPick) {
    document.querySelectorAll('.chat-menu').forEach(m => m.remove());
    const menu = document.createElement('div');
    menu.className = 'chat-menu';
    menu.innerHTML = itemsHtml;
    document.body.appendChild(menu);
    const r = anchor.getBoundingClientRect();
    const w = 200;
    menu.style.top = (r.bottom + 4) + 'px';
    menu.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left)) + 'px';
    const close = () => { menu.remove(); document.removeEventListener('mousedown', outside, true); };
    const outside = (e) => { if (!menu.contains(e.target)) close(); };
    setTimeout(() => document.addEventListener('mousedown', outside, true), 0);
    menu.querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', () => { close(); onPick(b.dataset.pick); }));
  }

  let chatRecentsOpen = true;
  let chatSideSearch = false;
  let chatSideQuery = '';

  function renderChatSidebar() {
    const tabs = document.getElementById('chatSideTabs');
    const body = document.getElementById('chatSideBody');
    if (!tabs || !body) return;
    tabs.innerHTML = '';
    const S = ChatStore;
    const ic = (n, w) => `<img src="assets/icons/${n}.svg" width="${w || 16}" height="${w || 16}" alt="">`;
    const item = (c, pinned) => {
      const unsaved = S.unsavedOf(c.id).length;
      return `<div class="chat-recent-item ${c.id === S.activeId ? 'active' : ''} ${pinned ? 'pinned' : ''}" data-chat="${c.id}" role="button" tabindex="0">
        <span>${driveEsc(c.title)}</span>${unsaved ? '<i class="chat-unsaved" title="มีผลงานร่างที่ยังไม่ได้บันทึก"></i>' : ''}
        ${pinned ? `<img class="pin" src="assets/icons/art-pin.svg" width="16" height="16" alt="">` : ''}<img class="more" data-chat-more="${c.id}" src="assets/icons/art-more.svg" width="16" height="16" alt="">
      </div>`;
    };
    const q = chatSideQuery.trim().toLowerCase();
    const match = (c) => !q || c.title.toLowerCase().includes(q);
    const pinned = S.chats.filter(c => c.favorite && match(c)).sort(chatByNewest);
    const recents = S.chats.filter(c => !c.favorite && match(c)).sort(chatByNewest);
    body.innerHTML = `
      <button class="chat-sec-link" id="chatArtRow"><b>Artifact</b>${ic('art-arrow-right')}</button>
      <div class="chat-sec">
        <div class="chat-sec-head"><b>Pinned</b></div>
        <div class="chat-sec-list">${pinned.length ? pinned.map(c => item(c, true)).join('') : '<div class="chat-side-empty">ยังไม่มีแชทที่ปักหมุด</div>'}</div>
      </div>
      <div class="chat-sec">
        <div class="chat-sec-head">
          <button class="chat-sec-link inline" id="chatRecentsToggle"><b>Recents</b>${ic('art-arrow-right')}</button>
          <button class="chat-sec-ico" id="chatSideSearchBtn" aria-label="ค้นหาแชท">${ic('art-search')}</button>
        </div>
        ${chatSideSearch ? `<input class="chat-side-search" id="chatSideQ" type="text" placeholder="ค้นหาแชท" value="${driveEsc(chatSideQuery)}">` : ''}
        ${chatRecentsOpen ? `<div class="chat-sec-list">${recents.length ? recents.map(c => item(c, false)).join('') : '<div class="chat-side-empty">ไม่พบแชท</div>'}</div>` : ''}
      </div>`;

    document.getElementById('chatArtRow').addEventListener('click', () => ChatUI.artifactsModal());
    document.getElementById('chatRecentsToggle').addEventListener('click', () => { chatRecentsOpen = !chatRecentsOpen; renderChatSidebar(); });
    document.getElementById('chatSideSearchBtn').addEventListener('click', () => {
      chatSideSearch = !chatSideSearch; if (!chatSideSearch) chatSideQuery = '';
      renderChatSidebar();
      const qi = document.getElementById('chatSideQ'); if (qi) qi.focus();
    });
    const qi = document.getElementById('chatSideQ');
    if (qi) qi.addEventListener('input', () => {
      chatSideQuery = qi.value; const pos = qi.selectionStart;
      renderChatSidebar();
      const n = document.getElementById('chatSideQ'); n.focus(); n.setSelectionRange(pos, pos);
    });
    body.querySelectorAll('[data-chat]').forEach(el => el.addEventListener('click', (e) => {
      if (e.target.closest('[data-chat-more]')) return;
      ChatStore.open(el.dataset.chat);
    }));
    body.querySelectorAll('[data-chat-more]').forEach(ico => ico.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = ico.dataset.chatMore;
      const c = ChatStore.chat(id);
      chatPopMenu(ico,
        `<button data-pick="fav">${ic('art-pin-fill')}<span>${c.favorite ? 'Unfavorite' : 'Favorite'}</span></button>
         <button data-pick="rename">${ic('art-edit')}<span>Rename</span></button>
         <hr>
         <button data-pick="del" class="danger">${ic('art-trash')}<span>Delete</span></button>`,
        (pick) => {
          if (pick === 'fav') ChatStore.togglePin(id);
          else if (pick === 'rename') ChatUI.renameDialog(id);
          else ChatUIDelete(id);
        });
    }));
  }
  const ChatUIDelete = (id) => ChatUI.deleteDialog(id);

  function chatModeChipHtml(mode) {
    const tool = ChatStore.tool();
    return `<button class="chat-mode-chip" data-chat-mode>${ChatStore.MODES[mode].short}${tool ? ' · ' + ChatStore.TYPES[tool].label : ''}</button>`;
  }
  function chatBindModePicker(root) {
    root.querySelectorAll('[data-chat-mode],[data-chat-tool]').forEach(btn => btn.addEventListener('click', () => {
      const S = ChatStore;
      const cur = S.mode();
      chatPopMenu(btn, Object.keys(S.MODES).map(k => `<button data-pick="${k}" class="${k === cur ? 'on' : ''}">${S.MODES[k].label}${S.MODES[k].hint ? ' <em>' + S.MODES[k].hint + '</em>' : ''}</button>`).join(''), (k) => S.setMode(k));
    }));
  }

  function renderChatMain() {
    const main = document.getElementById('chatMain');
    if (!main) return;
    const S = ChatStore;
    const prev = document.getElementById('chatMainInput') || document.getElementById('chatConvInput');
    const draft = prev ? prev.value : '';
    const c = S.active();
    if (!c) {
      main.className = 'chat-main';
      main.innerHTML = chatLandingInner();
      const iconRow = main.querySelector('.chat-prompt-left-icons');
      const toolBtn = iconRow.querySelector('[aria-label="เครื่องมือ AI"]');
      toolBtn.removeAttribute('data-stub');
      toolBtn.setAttribute('data-chat-tool', '1');
      iconRow.insertAdjacentHTML('beforeend', chatModeChipHtml(S.blankMode));
      const chatInput = document.getElementById('chatMainInput');
      if (draft) chatInput.value = draft;
      main.querySelectorAll('.chat-chip').forEach(chip => {
        chip.addEventListener('click', () => { chatInput.value = chip.dataset.fill; chatInput.focus(); });
      });
      const send = () => { const t = chatInput.value.trim(); if (!t) { chatInput.focus(); return; } chatInput.value = ''; S.send(t); };
      document.getElementById('chatSendBtn').addEventListener('click', send);
      chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
      const toolsHead = document.getElementById('chatToolsHead');
      const toolsGrid = document.getElementById('chatToolsGrid');
      toolsHead.addEventListener('click', () => { toolsHead.classList.toggle('collapsed'); toolsGrid.classList.toggle('collapsed'); });
      const curTool = S.tool();
      if (curTool) chatInput.placeholder = 'ระบุหัวข้อสำหรับ ' + S.TYPES[curTool].label;
      main.querySelectorAll('.chat-tool-card').forEach(card => {
        if (card.dataset.tool === curTool) card.classList.add('sel');
        card.addEventListener('click', () => {
          const key = card.dataset.tool;
          if (!S.TYPES[key]) { showToast('เครื่องมือนี้ยังไม่รองรับใน prototype นี้'); return; }
          S.setTool(key === S.tool() ? null : key);
          const inp = document.getElementById('chatMainInput'); if (inp) inp.focus();
        });
      });
      main.querySelectorAll('[data-stub]').forEach(el => el.addEventListener('click', () => showToast('ฟีเจอร์นี้ยังไม่พร้อมใช้งานใน prototype นี้')));
      chatBindModePicker(main);
      return;
    }
    main.className = 'chat-main conv';
    main.innerHTML = `
      <div class="chat-conv-title">${driveEsc(c.title)}</div>
      <div class="chat-conv-msgs" id="chatConvMsgs">${ChatUI.messagesHtml(c, c.mode)}</div>
      <div class="chat-prompt-box conv">
        <input class="chat-prompt-placeholder" id="chatConvInput" type="text" placeholder="${ChatStore.MODES[c.mode].placeholder}" style="background:transparent;border:none;outline:none;color:var(--white);font-family:inherit;width:100%;">
        <div class="chat-prompt-bottom">
          <div class="chat-prompt-left-icons">
            <button class="chat-icon-btn-plain" data-stub="1" aria-label="แนบไฟล์"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>
            <button class="chat-icon-btn-plain" data-chat-tool="1" aria-label="เครื่องมือ AI"><svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l1.6 4.4L14 7l-4.4 1.6L8 13l-1.6-4.4L2 7l4.4-1.6z"/></svg></button>
            ${chatModeChipHtml(c.mode)}
          </div>
          <div class="chat-prompt-right">
            <button class="chat-model-pill" data-stub="1"><span class="lbl">Model</span> Thinking</button>
            <button class="chat-send-btn" id="chatSendBtn" aria-label="ส่ง" ${c.busy ? 'disabled' : ''}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg></button>
          </div>
        </div>
      </div>`;
    const input = document.getElementById('chatConvInput');
    if (draft) input.value = draft;
    const send = () => { const t = input.value.trim(); if (!t) { input.focus(); return; } if (c.busy) return; input.value = ''; S.send(t); };
    document.getElementById('chatSendBtn').addEventListener('click', send);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
    main.querySelectorAll('[data-stub]').forEach(el => el.addEventListener('click', () => showToast('ฟีเจอร์นี้ยังไม่พร้อมใช้งานใน prototype นี้')));
    chatBindModePicker(main);
    const msgs = document.getElementById('chatConvMsgs');
    ChatUI.bindMessages(msgs);
    msgs.scrollTop = msgs.scrollHeight;
  }

  ChatStore.subscribe((evt) => {
    if (!chatPageVisible()) return;
    renderChatSidebar();
    if (evt !== 'view' && evt !== 'open-artifact') renderChatMain();
  });

  function chatLandingInner() {
    return `
        <div class="chat-greeting">What can I help with, ${CURRENT_USER.name.split(' ')[0]} ?</div>
        <div class="chat-prompt-box">
          <div class="chat-prompt-top">
            <input class="chat-prompt-placeholder" id="chatMainInput" type="text" placeholder="สอบถามได้ทุกอย่างขององค์กรณ์คุณ" style="background:transparent; border:none; outline:none; width:100%; font-family:inherit;" />
            <div class="chat-chip-row">
              <button class="chat-chip" data-fill="วันนี้ฉันต้องทำงานอะไร ?">วันนี้ฉันต้องทำงานอะไร ?</button>
              <button class="chat-chip" data-fill="ดูตารางงานของฉัน ?">ดูตารางงานของฉัน ?</button>
              <button class="chat-chip" data-fill="ดูงานล่าสุดที่ทำไป ?">ดูงานล่าสุดที่ทำไป ?</button>
            </div>
          </div>
          <div class="chat-prompt-bottom">
            <div class="chat-prompt-left-icons">
              <button class="chat-icon-btn-plain" data-stub="1" aria-label="แนบไฟล์">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
              <button class="chat-icon-btn-plain" data-stub="1" aria-label="เครื่องมือ AI">
                <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M6.12885 2.05958C6.82864 0.404564 9.1752 0.404676 9.87509 2.05958L11.038 4.8097C11.0674 4.87921 11.1228 4.93454 11.1923 4.96399L13.9424 6.1269C15.5976 6.82666 15.5976 9.17337 13.9424 9.87314L11.1923 11.036C11.1228 11.0655 11.0674 11.1208 11.038 11.1903L9.87509 13.9405C9.17532 15.5957 6.82862 15.5957 6.12885 13.9405L4.96595 11.1903C4.93649 11.1209 4.88116 11.0654 4.81165 11.036L2.06153 9.87314C0.406626 9.17324 0.406519 6.82668 2.06153 6.1269L4.81165 4.96399C4.88125 4.93457 4.93652 4.8793 4.96595 4.8097L6.12885 2.05958Z"/></svg>
              </button>
              <button class="chat-icon-btn-plain" data-stub="1" aria-label="ใช้งานล่าสุด">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              </button>
            </div>
            <div class="chat-prompt-right">
              <button class="chat-model-pill" data-stub="1">
                <span class="lbl">Model</span>
                Thinking
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <button class="chat-icon-btn-plain" data-stub="1" aria-label="พูด">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>
              </button>
              <button class="chat-send-btn" id="chatSendBtn" aria-label="ส่ง">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>
              </button>
            </div>
          </div>
        </div>

        <div class="chat-tools-wrap">
          <div class="chat-tools-head" id="chatToolsHead">
            <div class="left">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6.12885 2.05958C6.82864 0.404564 9.1752 0.404676 9.87509 2.05958L11.038 4.8097C11.0674 4.87921 11.1228 4.93454 11.1923 4.96399L13.9424 6.1269C15.5976 6.82666 15.5976 9.17337 13.9424 9.87314L11.1923 11.036C11.1228 11.0655 11.0674 11.1208 11.038 11.1903L9.87509 13.9405C9.17532 15.5957 6.82862 15.5957 6.12885 13.9405L4.96595 11.1903C4.93649 11.1209 4.88116 11.0654 4.81165 11.036L2.06153 9.87314C0.406626 9.17324 0.406519 6.82668 2.06153 6.1269L4.81165 4.96399C4.88125 4.93457 4.93652 4.8793 4.96595 4.8097L6.12885 2.05958Z"/></svg>
              เครื่องมือ?
            </div>
            <svg class="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
          </div>
          <div class="chat-tools-grid" id="chatToolsGrid">
            ${CHAT_TOOLS.map(t => `
              <button class="chat-tool-card" data-tool="${t.key}">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3">${t.icon}</svg>
                <span>${t.label}</span>
              </button>
            `).join('')}
          </div>
        </div>
    `;
  }


  function openInviteGate(project) {
    workspacePage.style.display = 'none';
    dashboardPage.style.display = 'flex';
    dashboardPage.style.flexDirection = 'column';
    dashboardPage.style.flex = '1';
    dashboardPage.style.position = 'relative';

    const donutSegs = project.stats.filter(s => s.pct > 0).map(s => ({ pct: s.pct, color: s.color }));
    if (donutSegs.length === 0) donutSegs.push({ pct: 100, color: '#3a3a3a' });
    const donutStyle = buildDonut(donutSegs);

    dashboardPage.innerHTML = renderPageHeaderTop(project) + `
      <div class="gate-blur-wrap">
        ${renderViewTabsRow('dashboard')}
        <div class="dash-content">
          <div class="dash-top-row">
            <div class="dash-card" style="flex: 8; min-height: 280px;">
              <div class="dash-card-header"><span class="dash-card-title">ภาพรวมการทำงาน <span class="muted">— 1 ปีย้อนหลัง</span></span></div>
              <div class="heat-stats">
                <span>รวม <b>0</b> กิจกรรม · ~<b>0</b> งาน · ~<b>0</b> การ์ด</span>
              </div>
              <div class="heatmap-grid">${buildHeatmapCells(false)}</div>
            </div>
            <div class="dash-card" style="flex: 2; min-height: 280px;">
              <div class="dash-card-header"><span class="dash-card-title">ภาพรวมโปรเจค</span></div>
              <div class="donut-row">
                <div class="donut-chart" style="${donutStyle}"><div class="hole"><span class="n">${project.total}</span><span class="l">งานทั้งหมด</span></div></div>
              </div>
            </div>
          </div>
          <div class="dash-bottom-row">
            <div class="dash-card" style="flex: 5; min-height: 340px;"></div>
            <div class="dash-card" style="flex: 3; min-height: 340px;"></div>
            <div class="dash-card" style="flex: 2; min-height: 340px;"></div>
          </div>
        </div>
      </div>

      <div class="gate-invite-overlay">
        <div class="msg">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/></svg>
          คุณถูกเชิญเข้าร่วมโปรเจกต์
        </div>
        <div class="proj-invite-actions">
          <button class="proj-invite-decline" data-stub="1">ปฎิเสธ</button>
          <button class="proj-invite-join" data-stub="1">เข้าร่วม</button>
        </div>
      </div>
    `;

    bindPageHeader(project);
    dashboardPage.querySelectorAll('[data-stub]').forEach(el => {
      el.addEventListener('click', () => showToast('ฟีเจอร์นี้ยังไม่พร้อมใช้งานใน prototype นี้'));
    });
  }
