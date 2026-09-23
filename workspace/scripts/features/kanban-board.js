  function isDoneStatus(key) { return KAN_STATUSES.length > 0 && KAN_STATUSES[KAN_STATUSES.length - 1].key === key; }

  const PRIORITY_LEVELS = [
    { key: 'urgent', label: 'Urgent', color: '#F5443A', icon: '<polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/>' },
    { key: 'high', label: 'High', color: '#F0883E', icon: '<polyline points="18 15 12 9 6 15"/>' },
    { key: 'medium', label: 'Medium', color: '#F0C93E', icon: '<line x1="6" y1="12" x2="18" y2="12"/>' },
    { key: 'low', label: 'Low', color: '#5981EC', icon: '<polyline points="6 9 12 15 18 9"/>' },
    { key: 'verylow', label: 'Very Low', color: '#A7A7A7', icon: '<polyline points="7 6 12 11 17 6"/><polyline points="7 13 12 18 17 13"/>' }
  ];
  function getPriority(key) { return PRIORITY_LEVELS.find(p => p.key === key) || PRIORITY_LEVELS[2]; }

  let TAG_TYPES = [
    { key: 'feature', label: 'Feature', color: '#25A767', icon: '<path d="M13 2 3 14h7l-1 8 11-14h-7z"/>' },
    { key: 'bug', label: 'Bug', color: '#F5443A', icon: '<circle cx="12" cy="14" r="6"/><path d="M12 8V5M9 5h6M5 12H2M22 12h-3M6 6l-2-2M18 6l2-2M8 18l-2 2M16 18l2 2"/>' },
    { key: 'spike', label: 'Spike', color: '#911EF2', icon: '<path d="M9 2v6l-5 10a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3L15 8V2"/>' },
    { key: 'doc', label: 'Doc', color: '#378ADD', icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>' },
    { key: 'adr', label: 'ADR', color: '#16A0A0', icon: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>' },
    { key: 'chore', label: 'Chore', color: '#A7A7A7', icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>' }
  ];
  function getTag(key) { return TAG_TYPES.find(t => t.key === key) || TAG_TYPES[0]; }
  function getTaskByKey(key) { return (CURRENT_KAN_PROJECT.tasks || []).find(t => t.key === key); }

  // Task-key badges are tinted with the colour of that task's status
  // (รอเริ่ม = เทา, กำลังทำ = ฟ้า, รอตรวจ = ม่วง, เสร็จสิ้น = เขียว) so the key
  // reads the same across the board card, the detail modal and the create modal.
  function keyBadgeStyle(statusKey) {
    const c = getStatus(statusKey).color;
    return `border-color:${c}; color:${c};`;
  }

  function buildKanCard(cfg) {
    const avatarColors = ['#F55A48', '#5981EC', '#911EF2', '#F5C518', '#25A767'];
    const avatarsHtml = cfg.avatars.map((n, i) => `<div class="a" style="background:${avatarColors[i % avatarColors.length]}">${avatarInitials(n)}</div>`).join('')
      + (cfg.extraCount ? `<div class="a more">${cfg.extraCount}+</div>` : '');
    const st = getStatus(cfg.status);
    const tag = getTag(cfg.tagKey);
    const pri = getPriority(cfg.priorityKey);
    return `
      <div class="kan-card" draggable="true" data-status="${st.key}" data-task-key="${cfg.key}">
        <div class="kan-card-header" style="background:${st.cardBg}; color:${st.color};">
          <span class="kan-card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;">${st.icon}</svg>
            <span>${cfg.title}</span>
          </span>
          <span class="kan-card-key">${cfg.key}</span>
        </div>
        ${cfg.parentKey && getTaskByKey(cfg.parentKey) ? (() => {
          const parent = getTaskByKey(cfg.parentKey);
          return `
        <div class="kan-parent-row">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>
          <div class="kan-parent-pill">
            <span class="lbl">จากงานหลัก</span>
            <span class="sep">:</span>
            <span class="ttl">${parent.title}</span>
            <span class="key" style="${keyBadgeStyle(parent.status)}">${parent.key}</span>
          </div>
        </div>`;
        })() : ''}
        <div class="kan-card-body">
          <div class="kan-tag-row">
            <span class="kan-tag" style="background:${hexA(tag.color, 0.15)}; color:${tag.color}; border:0.5px solid ${tag.color};">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${tag.icon}</svg>
              ${tag.label}
            </span>
            <span class="kan-tag priority">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${pri.color}" stroke-width="2.4">${pri.icon}</svg>
              ${pri.label}
            </span>
            <span class="kan-tag date">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="vertical-align:-1px;"><rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ${cfg.date}
            </span>
          </div>
          <ul class="kan-card-desc">
            ${cfg.desc.map(d => `<li>${d}</li>`).join('')}
          </ul>
          ${cfg.progress != null ? `
            <div class="kan-progress-row">
              <span style="font-size:11px; color:var(--grey4);">งานย่อย</span>
              <div class="kan-progress-track"><div class="kan-progress-fill" style="width:${cfg.progress}%; background:${st.color};"></div></div>
              <span class="kan-progress-label">${cfg.progressLabel}</span>
            </div>` : ''}
          <div class="kan-card-footer">
            ${(cfg.avatars.length === 0 && !cfg.extraCount) ? `
            <div class="kan-add-member-btn" title="เพิ่มผู้รับผิดชอบ">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#911EF2" stroke-width="2"><circle cx="9" cy="7" r="3"/><path d="M2 21c0-3.5 3-5.5 7-5.5s7 2 7 5.5"/></svg>
              <span>+</span>
            </div>` : `<div class="kan-avatar-stack">${avatarsHtml}</div>`}
            ${cfg.comments ? `<div class="kan-comment-count">
              <span class="ico"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span>
              ${cfg.comments}
            </div>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  const TODAY_REF = new Date(2026, 7, 11); // Aug 11, 2026 — matches the fictional "today" used elsewhere in this prototype
  function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
  function formatThaiDate(d) {
    const thMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${d.getDate()} ${thMonths[d.getMonth()]} ${String(d.getFullYear() + 543).slice(-2)}`;
  }

  function generateMockTasks(keyPrefix) {
    const descPool = [
      'Lorem ipsum dolor sit amet consectetur.',
      'Pellentesque luctus augue felis tortor.',
      'Pellentesque tristique egestas in porttitor turpis tempus commodo facilisi.',
      'Non congue luctus dui mauris volutpat egestas.',
      'Venenatis purus pellentesque ut sed hendrerit ut phasellus venenatis.'
    ];
    const spec = [
      { status: 'todo', n: 2 },
      { status: 'progress', n: 1 },
      { status: 'review', n: 3 },
      { status: 'done', n: 4 },
      { status: 'todo', n: 2, backlog: true }
    ];
    const memberPool = [
      { avatars: [], extraCount: 0 },
      { avatars: ['Somchai Jaidee'], extraCount: 0 },
      { avatars: ['นายเอ นามสมมุติ', 'Somchai Jaidee'], extraCount: 0 },
      { avatars: ['นายเอ นามสมมุติ', 'Somchai Jaidee', 'Suda Srisuk'], extraCount: 0 },
      { avatars: ['นายเอ นามสมมุติ', 'Somchai Jaidee'], extraCount: 8 },
      { avatars: [], extraCount: 0 }
    ];
    const tasks = [];
    let idx = 1;
    spec.forEach(s => {
      for (let i = 0; i < s.n; i++) {
        const members = memberPool[(idx - 1) % memberPool.length];
        let startDate, dueDate;
        if (s.status === 'todo') { startDate = addDays(TODAY_REF, 4 + idx * 3); dueDate = addDays(startDate, 5); }
        else if (s.status === 'progress') { startDate = addDays(TODAY_REF, -10); dueDate = addDays(TODAY_REF, 12); }
        else if (s.status === 'review') { startDate = addDays(TODAY_REF, 1 + i * 2); dueDate = addDays(startDate, 6 - i); }
        else { startDate = addDays(TODAY_REF, -22 + i * 3); dueDate = addDays(startDate, 7); }
        tasks.push({
          title: 'สินค้าและบริการเสริภาพหมาก้าเปิดใช้แนน้ำ',
          key: `${keyPrefix}-${idx}`,
          status: s.status,
          tagKey: TAG_TYPES[idx % TAG_TYPES.length].key,
          priorityKey: PRIORITY_LEVELS[idx % PRIORITY_LEVELS.length].key,
          date: formatThaiDate(dueDate),
          startDate, dueDate,
          desc: descPool.slice(0, 2 + (i % 3)),
          progress: i % 2 === 0 ? null : (30 + i * 15) % 100,
          progressLabel: i % 2 === 0 ? '' : `${1 + (i % 2)}/2`,
          avatars: members.avatars,
          extraCount: members.extraCount,
          comments: i % 3 === 0 ? 1 : null,
          parentKey: (s.status === 'todo' && i === 1 && !s.backlog) ? `${keyPrefix}-5` : null,
          backlog: !!s.backlog
        });
        idx++;
      }
    });
    return tasks;
  }

  THAI_IOD_PROJECT.keyPrefix = 'TOD';
  THAI_IOD_PROJECT.tasks = generateMockTasks('TOD');
  // Mock members for "จัดการสมาชิก": role is stored as today's role *label* (matching the "สร้างโปรเจคใหม่" flow's
  // convention), resolved dynamically against the live ROLES list wherever it's shown/counted/reassigned — not a
  // fixed reference — so renaming/deleting a role there is reflected here automatically. Names are picked to overlap
  // with generateMockTasks()'s avatars, so task counts below are real, not just placeholders.
  THAI_IOD_PROJECT.members.push(
    { name: 'Suda Srisuk', role: 'Manager' },
    { name: 'Somchai Jaidee', role: 'Staff' },
    { name: 'Kanya Boonmee', role: 'Staff' },
    { name: 'Nathapol Aubdin', role: 'Staff' },
    { type: 'team', name: 'Designer Team', role: 'Staff', count: 8 }
  );
  PROLOG_PROJECT.keyPrefix = 'PRO';
  PROLOG_PROJECT.tasks = [];
  PROLOG_PROJECT.members.push({ name: 'Test', role: 'Staff' });
  YLG_PROJECT.keyPrefix = 'YLG';
  YLG_PROJECT.tasks = [];

  let CURRENT_KAN_PROJECT = null;
  let CURRENT_VIEW = null; // 'board' | 'list' | 'time'
  function refreshCurrentView() {
    if (CURRENT_VIEW === 'board') renderKanBoard();
    else if (CURRENT_VIEW === 'list') renderListTable();
    else if (CURRENT_VIEW === 'time') renderTimeline();
    else if (CURRENT_VIEW === 'calendar') renderCalendarView();
    else if (CURRENT_VIEW === 'type') renderTypeView();
    else if (CURRENT_VIEW === 'backlog') renderBacklogView();
    else if (CURRENT_VIEW === 'dashboard' && CURRENT_KAN_PROJECT) openDashboard(CURRENT_KAN_PROJECT);
  }

  function openKanban(project) {
    CURRENT_VIEW = 'board';
    CURRENT_KAN_PROJECT = project;
    if (!project.tasks) project.tasks = [];
    workspacePage.style.display = 'none';
    dashboardPage.style.display = 'flex';
    dashboardPage.style.flexDirection = 'column';
    dashboardPage.style.flex = '1';
    dashboardPage.style.position = '';

    dashboardPage.innerHTML = renderPageHeader(project, 'board') + `
      ${buildKanToolbar('kan')}

      <div class="kan-board" id="kanBoard"></div>
    `;

    bindPageHeader(project);
    renderKanBoard();
    document.getElementById('kanAddTagBtn').addEventListener('click', openAddTagModal);
    document.getElementById('kanToolbarAddTask').addEventListener('click', () => openTaskModal(project, KAN_STATUSES[0].key));
    dashboardPage.querySelectorAll('[data-stub]').forEach(el => {
      el.addEventListener('click', () => showToast('ฟีเจอร์นี้ยังไม่พร้อมใช้งานใน prototype นี้'));
    });
  }

  const KAN_GAP_PLUS = 'data:image/svg+xml;base64,PHN2ZyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiBvdmVyZmxvdz0idmlzaWJsZSIgc3R5bGU9ImRpc3BsYXk6IGJsb2NrOyIgd2lkdGg9IjE0IiBoZWlnaHQ9IjE0IiB2aWV3Qm94PSIwIDAgMTQgMTQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxnIGlkPSJwaDpwbHVzLWJvbGQiPgo8cGF0aCBpZD0iVmVjdG9yIiBkPSJNMTIuNDY4OCA3QzEyLjQ2ODggNy4xNzQwNSAxMi4zOTk2IDcuMzQwOTcgMTIuMjc2NSA3LjQ2NDA0QzEyLjE1MzUgNy41ODcxMSAxMS45ODY1IDcuNjU2MjUgMTEuODEyNSA3LjY1NjI1SDcuNjU2MjVWMTEuODEyNUM3LjY1NjI1IDExLjk4NjUgNy41ODcxMSAxMi4xNTM1IDcuNDY0MDQgMTIuMjc2NUM3LjM0MDk3IDEyLjM5OTYgNy4xNzQwNSAxMi40Njg4IDcgMTIuNDY4OEM2LjgyNTk1IDEyLjQ2ODggNi42NTkwMyAxMi4zOTk2IDYuNTM1OTYgMTIuMjc2NUM2LjQxMjg5IDEyLjE1MzUgNi4zNDM3NSAxMS45ODY1IDYuMzQzNzUgMTEuODEyNVY3LjY1NjI1SDIuMTg3NUMyLjAxMzQ1IDcuNjU2MjUgMS44NDY1MyA3LjU4NzExIDEuNzIzNDYgNy40NjQwNEMxLjYwMDM5IDcuMzQwOTcgMS41MzEyNSA3LjE3NDA1IDEuNTMxMjUgN0MxLjUzMTI1IDYuODI1OTUgMS42MDAzOSA2LjY1OTAzIDEuNzIzNDYgNi41MzU5NkMxLjg0NjUzIDYuNDEyODkgMi4wMTM0NSA2LjM0Mzc1IDIuMTg3NSA2LjM0Mzc1SDYuMzQzNzVWMi4xODc1QzYuMzQzNzUgMi4wMTM0NSA2LjQxMjg5IDEuODQ2NTMgNi41MzU5NiAxLjcyMzQ2QzYuNjU5MDMgMS42MDAzOSA2LjgyNTk1IDEuNTMxMjUgNyAxLjUzMTI1QzcuMTc0MDUgMS41MzEyNSA3LjM0MDk3IDEuNjAwMzkgNy40NjQwNCAxLjcyMzQ2QzcuNTg3MTEgMS44NDY1MyA3LjY1NjI1IDIuMDEzNDUgNy42NTYyNSAyLjE4NzVWNi4zNDM3NUgxMS44MTI1QzExLjk4NjUgNi4zNDM3NSAxMi4xNTM1IDYuNDEyODkgMTIuMjc2NSA2LjUzNTk2QzEyLjM5OTYgNi42NTkwMyAxMi40Njg4IDYuODI1OTUgMTIuNDY4OCA3WiIgZmlsbD0iIzkxMUVGMiIvPgo8L2c+Cjwvc3ZnPgo=';
  function kanGapHtml(i) {
    const a = KAN_STATUSES[i - 1].label, b = KAN_STATUSES[i].label;
    return `<div class="kan-gap" data-insert-at="${i}" role="button" tabindex="0" aria-label="เพิ่มสถานะระหว่าง ${smEsc(a)} และ ${smEsc(b)}" title="เพิ่มสถานะ"><span class="kan-gap-line"></span><span class="kan-gap-btn"><img src="${KAN_GAP_PLUS}" alt=""></span></div>`;
  }

  function renderKanBoard() {
    const board = document.getElementById('kanBoard');
    if (!board) return;

    const columnsHtml = KAN_STATUSES.map((st, i) => `${i > 0 ? kanGapHtml(i) : ''}
      <div class="kan-column" data-status="${st.key}">
        <div class="kan-col-header" style="background:${st.color}; color:var(--white);">
          <span class="left">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${st.icon}</svg>
            ${st.label}
          </span>
          <span class="count" data-count-for="${st.key}">${CURRENT_KAN_PROJECT.tasks.filter(t => t.status === st.key && !t.backlog).length}</span>
        </div>
        <div class="kan-col-body" data-drop="${st.key}">
          ${CURRENT_KAN_PROJECT.tasks.filter(t => t.status === st.key && !t.backlog).map(t => buildKanCard(t)).join('')}
        </div>
        <div class="kan-col-footer">
          <button class="kan-add-task-btn" data-add-task="${st.key}">+ เพิ่มงาน</button>
        </div>
      </div>
    `).join('');

    board.innerHTML = columnsHtml + `
      <div class="kan-add-col">
        <button class="kan-add-col-btn" id="kanAddStatusBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          เพิ่มสถานะ
        </button>
      </div>
    `;

    bindKanDragDrop();
    document.getElementById('kanAddStatusBtn').addEventListener('click', openAddStatusModal);
    // hover bar between two columns: the new status is inserted at that position (between the two neighbours)
    board.querySelectorAll('.kan-gap').forEach(gap => {
      const add = () => openStatusManager({ addNew: true, insertAt: +gap.dataset.insertAt, returnFocusTo: gap });
      gap.addEventListener('click', add);
      gap.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); add(); } });
      gap.addEventListener('mousemove', (e) => {           // the round button follows the pointer up and down the bar
        const r = gap.getBoundingClientRect();
        gap.style.setProperty('--y', Math.max(9, Math.min(r.height - 9, e.clientY - r.top)) + 'px');
      });
    });
    board.querySelectorAll('[data-add-task]').forEach(el => {
      el.addEventListener('click', () => openTaskModal(CURRENT_KAN_PROJECT, el.dataset.addTask));
    });
    board.querySelectorAll('[data-stub]').forEach(el => {
      el.addEventListener('click', () => showToast('ฟีเจอร์นี้ยังไม่พร้อมใช้งานใน prototype นี้'));
    });
  }

  function bindKanDragDrop() {
    const board = document.getElementById('kanBoard');
    let draggedKey = null;
    let justDragged = false;

    board.querySelectorAll('.kan-card').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        draggedKey = card.querySelector('.kan-card-key').textContent.trim();
        card.classList.add('dragging');
        justDragged = true;
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', draggedKey); } catch (err) {}
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        board.querySelectorAll('.kan-col-body').forEach(b => b.classList.remove('drag-over'));
        setTimeout(() => { justDragged = false; }, 50);
      });
      card.addEventListener('click', () => {
        if (justDragged) return;
        const task = CURRENT_KAN_PROJECT.tasks.find(t => t.key === card.dataset.taskKey);
        if (task) openTaskDetail(CURRENT_KAN_PROJECT, task, 1);
      });
    });

    board.querySelectorAll('.kan-col-body').forEach(body => {
      body.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        body.classList.add('drag-over');
      });
      body.addEventListener('dragleave', () => body.classList.remove('drag-over'));
      body.addEventListener('drop', (e) => {
        e.preventDefault();
        body.classList.remove('drag-over');
        const newStatus = body.dataset.drop;
        const key = draggedKey || e.dataTransfer.getData('text/plain');
        const task = CURRENT_KAN_PROJECT.tasks.find(t => t.key === key);
        if (task && task.status !== newStatus) {
          task.status = newStatus;
          renderKanBoard();
          showToast(`ย้าย ${key} ไปสถานะ "${getStatus(newStatus).label}" แล้ว`);
        }
        draggedKey = null;
      });
    });
  }

