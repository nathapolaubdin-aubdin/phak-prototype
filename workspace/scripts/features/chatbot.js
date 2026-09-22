  function openChatbotPage() {
    ensureNormalSidebar();
    sidebar.style.display = 'none';
    chatSidebar.style.display = 'flex';
    workspacePage.style.display = 'none';
    dashboardPage.style.display = 'none';
    dashboardPage.innerHTML = '';
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
        <div style="display:flex; flex-direction:column; gap:16px; width:100%;">
          <div class="chat-recents-head">
            <span>Favorite</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:8px; width:100%;">
            ${CHAT_FAVORITES.map(t => `
              <button class="chat-recent-item">
                <span>${t}</span>
                <svg class="more-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="opacity:1; transform:rotate(45deg);"><line x1="12" y1="17" x2="12" y2="22"/><path d="M9 3h6l-1 6 3.5 2.5V13H6.5v-1.5L10 9z"/></svg>
              </button>
            `).join('')}
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:16px; width:100%;">
          <div class="chat-recents-head">
            <span>Recents</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--grey3)" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <div style="display:flex; flex-direction:column; gap:8px; width:100%;">
            ${CHAT_RECENTS.map((t, i) => `
              <button class="chat-recent-item" data-recent-idx="${i}" style="${i === 0 ? 'background:#1e1e1e; color:var(--white);' : ''}">
                <span>${t}</span>
                <svg class="more-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/></svg>
              </button>
            `).join('')}
          </div>
        </div>
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
          <button class="tab" data-stub="1">Drive</button>
        </div>
        <button class="notif-btn" aria-label="การแจ้งเตือน" data-stub="1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
        </button>
      </div>
      <div class="chat-glow-bg"></div>
      <div class="chat-main">
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
      </div>
    `;

    document.getElementById('chatSidebarToggle').addEventListener('click', () => {
      chatSidebar.classList.toggle('collapsed');
    });
    document.getElementById('chatWorkspaceTab').addEventListener('click', showWorkspacePage);
    document.getElementById('chatNewBtn').addEventListener('click', () => showToast('เริ่มแชทใหม่ (จำลอง)'));
    document.querySelectorAll('.chat-recent-item').forEach(btn => {
      btn.addEventListener('click', () => showToast('ฟีเจอร์นี้ยังไม่พร้อมใช้งานใน prototype นี้'));
    });
    const chatInput = document.getElementById('chatMainInput');
    document.querySelectorAll('.chat-chip').forEach(chip => {
      chip.addEventListener('click', () => { chatInput.value = chip.dataset.fill; chatInput.focus(); });
    });
    document.getElementById('chatSendBtn').addEventListener('click', () => {
      if (!chatInput.value.trim()) { chatInput.focus(); return; }
      showToast('ส่งข้อความแล้ว (จำลอง — ยังไม่ต่อ AI จริง)');
      chatInput.value = '';
    });
    chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('chatSendBtn').click(); });
    const toolsHead = document.getElementById('chatToolsHead');
    const toolsGrid = document.getElementById('chatToolsGrid');
    toolsHead.addEventListener('click', () => {
      toolsHead.classList.toggle('collapsed');
      toolsGrid.classList.toggle('collapsed');
    });
    document.querySelectorAll('.chat-tool-card').forEach(card => {
      card.addEventListener('click', () => showToast('ฟีเจอร์นี้ยังไม่พร้อมใช้งานใน prototype นี้'));
    });
    document.getElementById('chatbotPage').querySelectorAll('[data-stub]').forEach(el => {
      el.addEventListener('click', () => showToast('ฟีเจอร์นี้ยังไม่พร้อมใช้งานใน prototype นี้'));
    });
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
