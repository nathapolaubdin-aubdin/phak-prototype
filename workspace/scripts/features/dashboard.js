  function showWorkspacePage() {
    CURRENT_VIEW = null;
    dashboardPage.style.display = 'none';
    dashboardPage.innerHTML = '';
    const cbp = document.getElementById('chatbotPage');
    if (cbp) { cbp.style.display = 'none'; cbp.innerHTML = ''; }
    if (chatSidebar) chatSidebar.style.display = 'none';
    sidebar.style.display = '';
    workspacePage.style.display = '';
    workspacePage.querySelectorAll('.navbar-tabs .tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === 'workspace');
    });
  }

  function buildHeatmapCells(active) {
    let html = '';
    const totalCols = 48;
    const activeCols = 12; // last ~3 months get real activity
    const quietLevel = 0.08;
    const levels = [0.25, 0.25, 0.5, 0.5, 0.75, 1];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < totalCols; col++) {
        let lvl = quietLevel;
        if (active && col >= totalCols - activeCols) {
          const recency = (col - (totalCols - activeCols)) / activeCols;
          const isWeekday = row < 5;
          const chance = (isWeekday ? 0.75 : 0.35) * (0.4 + recency);
          if (Math.random() < chance) {
            lvl = levels[Math.floor(Math.random() * levels.length)];
          }
        }
        html += `<div class="heat-cell" style="background:rgba(145,30,242,${lvl})"></div>`;
      }
    }
    return html;
  }

  function buildDonut(segments) {
    let acc = 0;
    const stops = segments.map(s => {
      const start = acc;
      acc += s.pct;
      return `${s.color} ${start}% ${acc}%`;
    }).join(', ');
    return `background: conic-gradient(${stops});`;
  }

  // Live project overview derived from the project's real tasks, grouped by the
  // same KAN_STATUSES the board / list / type views use.
  function computeProjectStats(project) {
    const tasks = project.tasks || [];
    const total = tasks.length;
    const stats = KAN_STATUSES.map(st => {
      const count = tasks.filter(t => t.status === st.key).length;
      const pct = total ? (count / total) * 100 : 0;
      return { key: st.key, label: st.label, color: st.color, count, pct, pctText: `${pct.toFixed(2)}%` };
    });
    return { total, stats };
  }

  // Mock notification feed for the dashboard, derived from the project's real
  // tasks — so projects with no tasks (Prolog, a freshly created project) show
  // the empty state, and Thai IOD gets a populated list.
  function dashNotifHtml(project) {
    const tasks = project.tasks || [];
    if (!tasks.length) {
      return `<div class="dash-empty-mini" style="padding:24px 0;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
        <span>ยังไม่มีแจ้งเตือน</span>
      </div>`;
    }
    const actors = ['Somchai Jaidee', 'Suda Srisuk', 'ทีมพัฒนา', CURRENT_USER.name];
    const times = ['5 นาทีที่แล้ว', '1 ชม.ที่แล้ว', '3 ชม.ที่แล้ว', 'เมื่อวานนี้', '2 วันที่แล้ว', '5 วันที่แล้ว'];
    const commentIco = '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>';
    const rows = tasks.slice(0, 6).map((t, i) => {
      const actor = actors[i % actors.length];
      const st = getStatus(t.status);
      const kind = i % 5;
      let ico, color, body;
      if (kind === 0) {
        color = '#911EF2';
        ico = '<circle cx="9" cy="7" r="3.2"/><path d="M2.5 21c0-3.5 3-5.5 6.5-5.5 1.4 0 2.7.3 3.8.8"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/>';
        body = `<b>${actor}</b> มอบหมายงาน <span class="k">${t.key}</span> ให้คุณ`;
      } else if (kind === 1) {
        color = '#378ADD'; ico = commentIco;
        body = `<b>${actor}</b> คอมเมนต์ในงาน <span class="k">${t.key}</span> ${t.title}`;
      } else if (kind === 2) {
        color = st.color; ico = st.icon;
        body = `<b>${actor}</b> เปลี่ยนสถานะ <span class="k">${t.key}</span> เป็น <span style="color:${st.color}; font-weight:600;">${st.label}</span>`;
      } else if (kind === 3) {
        color = '#F55A48';
        ico = '<circle cx="12" cy="13" r="8"/><polyline points="12 9 12 13 15 15"/><line x1="5" y1="3" x2="2" y2="6"/><line x1="19" y1="3" x2="22" y2="6"/>';
        body = `งาน <span class="k">${t.key}</span> ใกล้ถึงกำหนดส่ง · ${t.date}`;
      } else {
        color = '#A7A7A7';
        ico = '<circle cx="12" cy="12" r="4"/><path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1"/>';
        body = `<b>${actor}</b> กล่าวถึงคุณในความคิดเห็นของ <span class="k">${t.key}</span>`;
      }
      const unread = i < 3;
      return `
        <div class="dash-notif-row ${unread ? 'unread' : ''}" data-notif-key="${t.key}">
          <span class="dash-notif-ico" style="background:${hexA(color, 0.15)}; color:${color};">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${ico}</svg>
          </span>
          <span class="dash-notif-body">${body}<span class="dash-notif-time">${times[i % times.length]}</span></span>
        </div>`;
    }).join('');
    return `<div class="dash-notif-list" id="dashNotifList">${rows}</div>`;
  }

  function memberRowHtml(m) {
    if (m.type === 'team') {
      return `
        <div class="dash-member-row">
          <div class="m-avatar team"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="9" cy="7" r="3"/><path d="M2 21c0-3.5 3-5.5 7-5.5s7 2 7 5.5"/><circle cx="17" cy="7" r="2.6"/><path d="M23 21c0-2.8-2.2-4.6-5-5.2"/></svg></div>
          <div class="m-info"><span class="mname">${m.name}</span><span class="mrole">กลุ่ม · ${m.count} คน · ${m.role}</span></div>
        </div>`;
    }
    return `
      <div class="dash-member-row">
        <div class="m-avatar">${initials(m.name)}</div>
        <div class="m-info"><span class="mname">${m.name}</span><span class="mrole">${m.role}</span></div>
      </div>`;
  }

  function renderPageHeaderTop(project) {
    return `
      <div class="navbar">
        <div class="navbar-tabs">
          <button class="tab" id="pageChatbotTab">Chatbot</button>
          <button class="tab" id="pageWorkspaceTab">Workspace</button>
          <button class="tab" data-stub="1">Drive</button>
        </div>
        <button class="notif-btn" aria-label="การแจ้งเตือน" data-stub="1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
        </button>
      </div>

      <div class="kan-header-row">
        <button class="gate-back-btn" id="pageBackBtn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="15 18 9 12 15 6"/></svg>
          กลับ
        </button>
        <div class="prompt-wrap" style="flex:1; padding-top:0;">
          <div class="prompt-bar">
            <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <div class="prompt-field">
              <input class="prompt-input" type="text" placeholder="ถามฉันเกี่ยวกับโปรเจคนี้" />
              <button class="chip" data-stub="1">งานที่ต้องทำวันนี้ ?</button>
              <button class="chip" data-stub="1">ส่งงานให้หน่อย ?</button>
            </div>
            <div class="prompt-actions">
              <button class="thinking-pill" data-stub="1"><span>Thinking</span></button>
              <button class="send-btn" data-stub="1" aria-label="ส่ง">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="kan-title-row">
        <svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        <span class="title">${project.name}</span>
      </div>
    `;
  }

  function renderViewTabsRow(activeTab) {
    const tabs = [
      { key: 'dashboard', label: 'แดชบอร์ด', icon: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="4" rx="1.5"/><rect x="14" y="11" width="7" height="10" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>' },
      { key: 'board', label: 'มุมมองบอร์ด', icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><line x1="9" y1="4" x2="9" y2="20"/><line x1="15" y1="4" x2="15" y2="20"/>' },
      { key: 'list', label: 'มุมมองลิส', icon: '<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>' },
      { key: 'time', label: 'มุมมองเวลา', icon: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/>' },
      { key: 'calendar', label: 'มุมมองปฏิทิน', icon: '<rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/>' },
      { key: 'type', label: 'มุมมองประเภท', icon: '<path d="M20 12 12 20l-8-8V4h8z"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none"/>' }
    ];
    const IMPLEMENTED = ['dashboard', 'board', 'list', 'time', 'calendar', 'type'];
    const tabsHtml = tabs.map(t => `
      <button class="view-tab ${t.key === activeTab ? 'active' : ''}" id="pageTab_${t.key}" ${(t.key === activeTab || IMPLEMENTED.includes(t.key)) ? '' : 'data-stub="1"'}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${t.icon}</svg>
        ${t.label}
      </button>
    `).join('');
    return `
      <div class="dash-navbar" style="height:auto; padding: 16px 24px 0;">
        ${tabsHtml}
        <div class="spacer"></div>
        <button class="view-tab" data-stub="1"><img src="assets/icons/backlog.svg" width="16" height="16" alt="" />งานค้าง</button>
      </div>
    `;
  }

  function renderPageHeader(project, activeTab) {
    return renderPageHeaderTop(project) + renderViewTabsRow(activeTab);
  }

  function bindPageHeader(project) {
    document.getElementById('pageBackBtn').addEventListener('click', showWorkspacePage);
    document.getElementById('pageWorkspaceTab').addEventListener('click', showWorkspacePage);
    const cbTab = document.getElementById('pageChatbotTab');
    if (cbTab) cbTab.addEventListener('click', openChatbotPage);
    const dashTab = document.getElementById('pageTab_dashboard');
    if (dashTab) dashTab.addEventListener('click', () => openDashboard(project));
    const boardTab = document.getElementById('pageTab_board');
    if (boardTab) boardTab.addEventListener('click', () => openKanban(project));
    const listTab = document.getElementById('pageTab_list');
    if (listTab) listTab.addEventListener('click', () => openListView(project));
    const timeTab = document.getElementById('pageTab_time');
    if (timeTab) timeTab.addEventListener('click', () => openTimelineView(project));
    const calTab = document.getElementById('pageTab_calendar');
    if (calTab) calTab.addEventListener('click', () => openCalendarView(project));
    const typeTab = document.getElementById('pageTab_type');
    if (typeTab) typeTab.addEventListener('click', () => openTypeView(project));
  }

  function openDashboard(project) {
    CURRENT_VIEW = 'dashboard';
    CURRENT_KAN_PROJECT = project;
    if (!project.tasks) project.tasks = [];
    workspacePage.style.display = 'none';
    dashboardPage.style.display = 'flex';
    dashboardPage.style.flexDirection = 'column';
    dashboardPage.style.flex = '1';

    const { total: dashTotal, stats: dashStats } = computeProjectStats(project);
    const donutSegs = dashStats.filter(s => s.pct > 0).map(s => ({ pct: s.pct, color: s.color }));
    if (donutSegs.length === 0) donutSegs.push({ pct: 100, color: '#3a3a3a' });
    const donutStyle = buildDonut(donutSegs);
    const donutLegendHtml = dashStats.map(s => `
      <div class="donut-legend-row"><span class="dot" style="background:${s.color}"></span><span class="lbl">${s.label} :</span><span class="pct">${s.pctText}</span><span class="cnt">| ${s.count}</span></div>
    `).join('');

    const dashTasks = project.tasks || [];
    if (DASH_DAY_PROJECT !== project) {
      DASH_DAY_PROJECT = project;
      DASH_SELECTED_DAY = new Date(TODAY_REF);
      DASH_CAL_OPEN = false;
    }
    const memberRows = [
      { name: CURRENT_USER.name, role: 'Owner' },
      ...project.members
    ].map(m => m.type === 'team' ? memberRowHtml(m) : memberRowHtml({ name: m.name, role: m.role || 'Owner' })).join('');

    dashboardPage.innerHTML = renderPageHeader(project, 'dashboard') + `
      <div class="dash-content">
        <div class="dash-top-row">
          <div class="dash-card" style="flex: 8; min-height: 280px;">
            <div class="dash-card-header">
              <span class="dash-card-title">ภาพรวมการทำงาน <span class="muted">— 1 ปีย้อนหลัง</span></span>
              <button class="dash-ai-btn" data-stub="1">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6.12885 2.05958C6.82864 0.404564 9.1752 0.404676 9.87509 2.05958L11.038 4.8097C11.0674 4.87921 11.1228 4.93454 11.1923 4.96399L13.9424 6.1269C15.5976 6.82666 15.5976 9.17337 13.9424 9.87314L11.1923 11.036C11.1228 11.0655 11.0674 11.1208 11.038 11.1903L9.87509 13.9405C9.17532 15.5957 6.82862 15.5957 6.12885 13.9405L4.96595 11.1903C4.93649 11.1209 4.88116 11.0654 4.81165 11.036L2.06153 9.87314C0.406626 9.17324 0.406519 6.82668 2.06153 6.1269L4.81165 4.96399C4.88125 4.93457 4.93652 4.8793 4.96595 4.8097L6.12885 2.05958Z" fill="currentColor"/></svg>
                AI สรุปให้
              </button>
            </div>
            <div class="heat-stats">
              <span>รวม <b>${project.heatActivities.toLocaleString()}</b> กิจกรรม · <b>${dashTasks.length.toLocaleString()}</b> งาน · <b>${dashTasks.filter(t => t.parentKey).length.toLocaleString()}</b> งานย่อย</span>
              <span>วันนี้ <b>${project.heatToday}</b> รายการ</span>
              <span>สัปดาห์นี้ <b>${project.heatWeek}</b> รายการ</span>
              <span>เดือนนี้ <b>${project.heatMonth}</b> รายการ</span>
            </div>
            <div class="heatmap-grid">${buildHeatmapCells(project.heatActive)}</div>
            <div class="heat-legend">
              น้อย
              <div class="sq" style="background:rgba(145,30,242,0.08)"></div>
              <div class="sq" style="background:rgba(145,30,242,0.25)"></div>
              <div class="sq" style="background:rgba(145,30,242,0.5)"></div>
              <div class="sq" style="background:rgba(145,30,242,0.75)"></div>
              <div class="sq" style="background:rgba(145,30,242,1)"></div>
              มาก
            </div>
            ${project.streak > 0 ? `<div class="streak-badge">🔥 คุณทำงานต่อเนื่อง ${project.streak} วัน · สถิติสูงสุด ${project.bestStreak} วัน</div>` : ''}
          </div>
          <div class="dash-card" style="flex: 2; min-height: 280px;">
            <div class="dash-card-header">
              <span class="dash-card-title">ภาพรวมโปรเจค</span>
              <button class="dash-ai-btn" data-stub="1">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6.12885 2.05958C6.82864 0.404564 9.1752 0.404676 9.87509 2.05958L11.038 4.8097C11.0674 4.87921 11.1228 4.93454 11.1923 4.96399L13.9424 6.1269C15.5976 6.82666 15.5976 9.17337 13.9424 9.87314L11.1923 11.036C11.1228 11.0655 11.0674 11.1208 11.038 11.1903L9.87509 13.9405C9.17532 15.5957 6.82862 15.5957 6.12885 13.9405L4.96595 11.1903C4.93649 11.1209 4.88116 11.0654 4.81165 11.036L2.06153 9.87314C0.406626 9.17324 0.406519 6.82668 2.06153 6.1269L4.81165 4.96399C4.88125 4.93457 4.93652 4.8793 4.96595 4.8097L6.12885 2.05958Z" fill="currentColor"/></svg>
                AI สรุปให้
              </button>
            </div>
            <div class="donut-row">
              <div class="donut-legend">${donutLegendHtml}</div>
              <div class="donut-chart" style="${donutStyle}">
                <div class="hole"><span class="n">${dashTotal}</span><span class="l">งานทั้งหมด</span></div>
              </div>
            </div>
          </div>
        </div>

        <div class="dash-bottom-row">
          <div class="dash-card" id="dashDayCard" style="flex: 5; height: 680px; display:flex; flex-direction:column; position:relative;"></div>

          <div style="flex: 3; display:flex; flex-direction:column; gap:12px;">
            <div class="dash-card" style="flex:1; min-height: 328px; display:flex; flex-direction:column;">
              <div class="dash-card-header">
                <span class="dash-card-title">แจ้งเตือน${dashTasks.length ? ` <span class="muted">— ${Math.min(3, dashTasks.length)} ใหม่</span>` : ''}</span>
                ${dashTasks.length ? '<button class="btn-secondary" id="dashNotifReadAll" style="border:0.5px solid rgba(255,255,255,0.2);">อ่านทั้งหมด</button>' : ''}
              </div>
              ${dashNotifHtml(project)}
            </div>
            <div class="dash-card" style="flex:1; min-height: 328px;">
              <div class="dash-card-header"><span class="dash-card-title">ไดร์</span></div>
              <div class="drive-row" data-stub="1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="6 9 12 15 18 9"/></svg>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="9 12 11 14 15 10"/></svg>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                <span style="flex:1;">ไดร์งาน</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </div>
              <div class="drive-row" data-stub="1" style="padding-left:24px; opacity:0.85;">
                <span style="width:12px;"></span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="9 12 11 14 15 10"/></svg>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                <span style="flex:1;">${project.folderName}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </div>
            </div>
          </div>

          <div class="dash-card" style="flex: 2; min-height: 680px; display:flex; flex-direction:column;">
            <div style="flex:1;">${memberRows}</div>
            <button class="btn-secondary" data-stub="1" style="align-self:center; border:0.5px solid rgba(255,255,255,0.2); margin-top:8px;">จัดการ</button>
          </div>
        </div>
      </div>
    `;

    bindPageHeader(project);
    renderDashDayCard(project);
    dashboardPage.querySelectorAll('.dash-notif-row').forEach(row => {
      row.addEventListener('click', () => {
        const t = (project.tasks || []).find(x => x.key === row.dataset.notifKey);
        if (t) openTaskDetail(project, t, 1);
      });
    });
    const notifReadAll = document.getElementById('dashNotifReadAll');
    if (notifReadAll) notifReadAll.addEventListener('click', () => {
      const notifCard = notifReadAll.closest('.dash-card');
      notifCard.querySelectorAll('.dash-notif-row.unread').forEach(r => r.classList.remove('unread'));
      const badge = notifCard.querySelector('.dash-card-title .muted');
      if (badge) badge.remove();
      notifReadAll.remove();
      showToast('ทำเครื่องหมายว่าอ่านทั้งหมดแล้ว');
    });
    dashboardPage.querySelectorAll('[data-stub]').forEach(el => {
      el.addEventListener('click', () => showToast('ฟีเจอร์นี้ยังไม่พร้อมใช้งานใน prototype นี้'));
    });
  }

  // ---- Dashboard "งานทั้งหมด" — day view driven by the project's real tasks ----
  // Single source of truth: DASH_SELECTED_DAY. The 7-day strip is always derived
  // (selected day centred). ‹ › step ±1 day; the month label opens a date picker.
  let DASH_DAY_PROJECT = null;
  let DASH_SELECTED_DAY = null;
  let DASH_CAL_OPEN = false;      // date-picker popover visible
  let DASH_CAL_CURSOR = null;     // month shown inside the popover

  const DASH_TH_DAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
  const DASH_TH_WDAYS_MON = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'];
  const DASH_TH_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  function dashDayNum(d) { return d ? d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate() : 0; }
  function dashTasksOnDay(project, day) {
    const target = dashDayNum(day);
    return (project.tasks || []).filter(t => {
      const s = dashDayNum(t.startDate || t.dueDate);
      const e = dashDayNum(t.dueDate || t.startDate);
      if (!s && !e) return false;
      return (s || e) <= target && target <= (e || s);
    });
  }

  function dashCalGridHtml(project) {
    const cur = DASH_CAL_CURSOR;
    const monthStart = new Date(cur.getFullYear(), cur.getMonth(), 1);
    const startWeekday = (monthStart.getDay() + 6) % 7; // Monday = 0
    const gridStart = addDays(monthStart, -startWeekday);
    let cells = '';
    for (let i = 0; i < 42; i++) {
      const d = addDays(gridStart, i);
      const out = d.getMonth() !== cur.getMonth();
      const isToday = dashDayNum(d) === dashDayNum(TODAY_REF);
      const isSel = dashDayNum(d) === dashDayNum(DASH_SELECTED_DAY);
      const has = dashTasksOnDay(project, d).length > 0;
      cells += `<button class="dash-cal-cell ${out ? 'out' : ''} ${isToday ? 'today' : ''} ${isSel ? 'sel' : ''}" data-cal-day="${d.getFullYear()}-${d.getMonth()}-${d.getDate()}">${d.getDate()}${has ? '<span class="d"></span>' : ''}</button>`;
    }
    return cells;
  }

  function renderDashDayCard(project) {
    const card = document.getElementById('dashDayCard');
    if (!card) return;
    const weekStart = addDays(DASH_SELECTED_DAY, -3); // strip centres the selection
    const dayTasks = dashTasksOnDay(project, DASH_SELECTED_DAY);

    const dayPills = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(weekStart, i);
      const sel = dashDayNum(d) === dashDayNum(DASH_SELECTED_DAY);
      const isToday = dashDayNum(d) === dashDayNum(TODAY_REF);
      const has = dashTasksOnDay(project, d).length > 0;
      return `
        <button class="dash-day ${sel ? 'sel' : ''} ${isToday ? 'today' : ''}" data-day-offset="${i}">
          <span class="dn">${DASH_TH_DAYS[d.getDay()]}</span>
          <span class="dd">${String(d.getDate()).padStart(2, '0')}</span>
          ${has ? '<span class="dot"></span>' : ''}
        </button>`;
    }).join('');

    const isTodaySel = dashDayNum(DASH_SELECTED_DAY) === dashDayNum(TODAY_REF);
    const listHtml = dayTasks.length
      ? dayTasks.map(t => buildKanCard(t)).join('')
      : `<div class="dash-empty-mini">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 7h16l-1.5 12a2 2 0 0 1-2 1.8H7.5a2 2 0 0 1-2-1.8L4 7z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/></svg>
           <span>${isTodaySel ? 'ไม่มีงานที่ต้องทำในวันนี้' : 'ไม่มีงานในวันที่เลือก'}</span>
         </div>`;

    const calPopHtml = DASH_CAL_OPEN ? `
      <div class="dash-cal-backdrop" id="dashCalBackdrop"></div>
      <div class="dash-cal-pop" id="dashCalPop">
        <div class="dash-cal-head">
          <button class="dash-cal-nav" data-cal-nav="-1" aria-label="เดือนก่อนหน้า">‹</button>
          <span>${DASH_TH_MONTHS[DASH_CAL_CURSOR.getMonth()]} ${DASH_CAL_CURSOR.getFullYear()}</span>
          <button class="dash-cal-nav" data-cal-nav="1" aria-label="เดือนถัดไป">›</button>
        </div>
        <div class="dash-cal-wdays">${DASH_TH_WDAYS_MON.map(w => `<span>${w}</span>`).join('')}</div>
        <div class="dash-cal-grid">${dashCalGridHtml(project)}</div>
        <div class="dash-cal-foot"><button class="dash-cal-today" id="dashCalToday">วันนี้</button></div>
      </div>` : '';

    card.innerHTML = `
      <div class="dash-daynav">
        <button class="dash-daynav-arrow" data-nav="-1" aria-label="วันก่อนหน้า">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button class="dash-daynav-label ${DASH_CAL_OPEN ? 'open' : ''}" id="dashMonthBtn">
          ${DASH_TH_MONTHS[DASH_SELECTED_DAY.getMonth()]} ${DASH_SELECTED_DAY.getFullYear()}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <button class="dash-daynav-arrow" data-nav="1" aria-label="วันถัดไป">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
      <div class="dash-daybar">${dayPills}</div>
      <div class="dash-day-tasks" id="dashDayTasks">${listHtml}</div>
      <div class="dash-day-foot">
        <button class="cal-add-btn" id="dashAddTaskBtn" style="margin:0;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          เพิ่มงานใหม่
        </button>
        <button class="btn-secondary" id="dashViewAllBtn" style="border:0.5px solid rgba(255,255,255,0.2);">ดูทั้งหมด</button>
      </div>
      ${calPopHtml}
    `;

    card.querySelectorAll('.dash-daynav-arrow').forEach(btn => {
      btn.addEventListener('click', () => {
        DASH_SELECTED_DAY = addDays(DASH_SELECTED_DAY, parseInt(btn.dataset.nav, 10));
        renderDashDayCard(project);
      });
    });
    card.querySelectorAll('.dash-day').forEach(btn => {
      btn.addEventListener('click', () => {
        DASH_SELECTED_DAY = addDays(weekStart, parseInt(btn.dataset.dayOffset, 10));
        renderDashDayCard(project);
      });
    });
    card.querySelector('#dashMonthBtn').addEventListener('click', () => {
      if (DASH_CAL_OPEN) { DASH_CAL_OPEN = false; renderDashDayCard(project); return; }
      DASH_CAL_OPEN = true;
      DASH_CAL_CURSOR = new Date(DASH_SELECTED_DAY.getFullYear(), DASH_SELECTED_DAY.getMonth(), 1);
      renderDashDayCard(project);
    });
    if (DASH_CAL_OPEN) {
      card.querySelector('#dashCalBackdrop').addEventListener('click', () => { DASH_CAL_OPEN = false; renderDashDayCard(project); });
      card.querySelectorAll('.dash-cal-nav').forEach(b => b.addEventListener('click', () => {
        DASH_CAL_CURSOR = new Date(DASH_CAL_CURSOR.getFullYear(), DASH_CAL_CURSOR.getMonth() + parseInt(b.dataset.calNav, 10), 1);
        renderDashDayCard(project);
      }));
      card.querySelectorAll('.dash-cal-cell').forEach(c => c.addEventListener('click', () => {
        const [y, m, dd] = c.dataset.calDay.split('-').map(Number);
        DASH_SELECTED_DAY = new Date(y, m, dd);
        DASH_CAL_OPEN = false;
        renderDashDayCard(project);
      }));
      card.querySelector('#dashCalToday').addEventListener('click', () => {
        DASH_SELECTED_DAY = new Date(TODAY_REF);
        DASH_CAL_OPEN = false;
        renderDashDayCard(project);
      });
    }
    card.querySelectorAll('#dashDayTasks .kan-card').forEach(el => {
      el.addEventListener('click', () => {
        const t = (project.tasks || []).find(x => x.key === el.dataset.taskKey);
        if (t) openTaskDetail(project, t, 1);
      });
    });
    card.querySelector('#dashAddTaskBtn').addEventListener('click', () => openTaskModal(project, KAN_STATUSES[0].key));
    card.querySelector('#dashViewAllBtn').addEventListener('click', () => openKanban(project));
  }

