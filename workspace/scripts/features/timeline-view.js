  function openTimelineView(project) {
    CURRENT_VIEW = 'time';
    CURRENT_KAN_PROJECT = project;
    if (!project.tasks) project.tasks = [];
    workspacePage.style.display = 'none';
    dashboardPage.style.display = 'flex';
    dashboardPage.style.flexDirection = 'column';
    dashboardPage.style.flex = '1';
    dashboardPage.style.position = '';

    dashboardPage.innerHTML = renderPageHeader(project, 'time') + `
      ${buildKanToolbar('tl')}

      <div class="tl-wrap" id="tlWrap"></div>
    `;

    bindPageHeader(project);
    renderTimeline();
    document.getElementById('tlAddTagBtn').addEventListener('click', openAddTagModal);
    document.getElementById('tlToolbarAddTask').addEventListener('click', () => openTaskModal(project, KAN_STATUSES[0].key));
    dashboardPage.querySelectorAll('[data-stub]').forEach(el => {
      el.addEventListener('click', () => showToast('ฟีเจอร์นี้ยังไม่พร้อมใช้งานใน prototype นี้'));
    });
  }

  function renderTimeline() {
    const wrap = document.getElementById('tlWrap');
    if (!wrap) return;
    const project = CURRENT_KAN_PROJECT;
    const topLevel = project.tasks.filter(t => !t.parentKey);
    const dayW = TL_DAY_WIDTH[TL_ZOOM];

    const rangeStart = addDays(TODAY_REF, -TL_RANGE_BEFORE);
    const totalDays = TL_RANGE_BEFORE + TL_RANGE_AFTER;
    const thMonthsShort = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const thDayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

    // month header groups
    let monthCellsHtml = '';
    let d = new Date(rangeStart);
    let curMonthKey = null, curMonthStart = 0, curMonthDays = 0, monthSegs = [];
    for (let i = 0; i <= totalDays; i++) {
      const mk = d.getFullYear() + '-' + d.getMonth();
      if (mk !== curMonthKey) {
        if (curMonthKey !== null) monthSegs.push({ key: curMonthKey, start: curMonthStart, days: curMonthDays });
        curMonthKey = mk; curMonthStart = i; curMonthDays = 0;
      }
      curMonthDays++;
      d = addDays(rangeStart, i + 1);
    }
    monthSegs.push({ key: curMonthKey, start: curMonthStart, days: curMonthDays });
    monthCellsHtml = monthSegs.map(seg => {
      const md = addDays(rangeStart, seg.start);
      return `<div class="tl-month-cell" style="width:${seg.days * dayW}px;">${thMonthsShort[md.getMonth()]}</div>`;
    }).join('');

    let dayCellsHtml = '';
    let gridCellsHtml = '';
    for (let i = 0; i < totalDays; i++) {
      const dd = addDays(rangeStart, i);
      const isWeekend = dd.getDay() === 0 || dd.getDay() === 6;
      dayCellsHtml += `<div class="tl-day-cell ${isWeekend ? 'weekend' : ''}" style="width:${dayW}px;">${dd.getDate()}</div>`;
      gridCellsHtml += `<div class="tl-grid-cell ${isWeekend ? 'weekend' : ''}" style="width:${dayW}px;"></div>`;
    }

    const todayOffsetDays = Math.round((TODAY_REF - rangeStart) / 86400000);
    const todayX = todayOffsetDays * dayW + dayW / 2;

    function statusColor(st) { return st.key === 'todo' ? '#6E6E6E' : st.color; }

    function leftRowsHtml(list, depth) {
      let html = '';
      list.forEach(task => {
        const st = getStatus(task.status);
        const children = project.tasks.filter(t => t.parentKey === task.key);
        const hasChildren = children.length > 0;
        const isOpen = LST_EXPANDED.has(task.key);
        html += `
          <div class="tl-left-row" data-task-key="${task.key}">
            <div class="tl-taskname" style="padding-left:${12 + depth * 20}px;">
              ${hasChildren ? `<button class="lst-expand-btn ${isOpen ? 'open' : ''}" data-expand-key="${task.key}" style="color:var(--grey4);">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>` : `<span class="lst-expand-spacer"></span>`}
              <span class="lst-key" style="border-color:${st.color}; color:${st.color}; font-size:8px;">${task.key}</span>
              <span class="lst-title" style="font-size:12px;">${task.title}</span>
            </div>
            <div class="lst-cell" style="padding:0 8px;">
              <span class="lst-status-pill" style="background:${st.cardBg}; color:${st.color}; font-size:10px; height:20px; padding:0 8px;">${st.label}</span>
            </div>
          </div>`;
        if (hasChildren && isOpen) html += leftRowsHtml(sortTasksBy(children, LST_SORT.key, LST_SORT.dir), depth + 1);
      });
      return html;
    }

    function ganttRowsHtml(list, depth) {
      let html = '';
      list.forEach(task => {
        const st = getStatus(task.status);
        const children = project.tasks.filter(t => t.parentKey === task.key);
        const hasChildren = children.length > 0;
        const isOpen = LST_EXPANDED.has(task.key);
        const sD = task.startDate || TODAY_REF;
        const eD = task.dueDate || TODAY_REF;
        const startOff = Math.max(0, Math.round((sD - rangeStart) / 86400000));
        const endOff = Math.max(startOff + 1, Math.round((eD - rangeStart) / 86400000) + 1);
        const barLeft = startOff * dayW;
        const barWidth = Math.max(dayW, (endOff - startOff) * dayW);
        html += `
          <div class="tl-grid-row" data-task-key="${task.key}">
            <div class="tl-grid-bg">${gridCellsHtml}</div>
            <div class="tl-bar" data-bar-key="${task.key}" style="left:${barLeft}px; width:${barWidth}px; background:${statusColor(st)};" title="${task.title}">${task.title}</div>
          </div>`;
        if (hasChildren && isOpen) html += ganttRowsHtml(sortTasksBy(children, LST_SORT.key, LST_SORT.dir), depth + 1);
      });
      return html;
    }

    const sortedTop = sortTasksBy(topLevel, LST_SORT.key, LST_SORT.dir);

    wrap.innerHTML = `
      <div class="tl-body">
        <div class="tl-left">
          <div class="tl-left-head">
            <div style="padding-left:12px;">TASK NAME</div>
            <div style="padding-left:8px;">Status</div>
          </div>
          <div class="tl-left-body" id="tlLeftBody">${sortedTop.length ? leftRowsHtml(sortedTop, 0) : `<div class="lst-empty" style="height:100%;">ยังไม่มีงานในโปรเจคนี้</div>`}</div>
        </div>
        <div class="tl-right" id="tlRight">
          <div class="tl-datehead" style="width:${totalDays * dayW}px;">
            <div class="tl-month-row">${monthCellsHtml}</div>
            <div class="tl-day-row">${dayCellsHtml}</div>
          </div>
          <div id="tlGanttBody" style="position:relative; width:${totalDays * dayW}px;">
            ${sortedTop.length ? ganttRowsHtml(sortedTop, 0) : ''}
            <div class="tl-today-line" style="left:${todayX}px;"><div class="tl-today-dot" style="left:0;"></div></div>
          </div>
        </div>
      </div>
      <div class="tl-footer">
        <button class="view-footer-add-btn" id="tlFooterAddTask">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          เพิ่มงานใหม่
        </button>
        <div style="display:flex; align-items:center; gap:16px;">
          <button class="tl-today-btn" id="tlTodayBtn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>
            วันปัจจุบัน
          </button>
          <div class="tl-zoom-group">
            ${TL_ZOOM_LABELS.map(z => `<button class="tl-zoom-btn ${TL_ZOOM === z.key ? 'active' : ''}" data-zoom="${z.key}">${z.label}</button>`).join('')}
          </div>
        </div>
      </div>
    `;

    // sync vertical scroll between left rows and gantt rows
    const leftBody = document.getElementById('tlLeftBody');
    const rightPane = document.getElementById('tlRight');
    let syncing = false;
    leftBody.addEventListener('scroll', () => {
      if (syncing) return; syncing = true;
      rightPane.scrollTop = leftBody.scrollTop;
      syncing = false;
    });
    rightPane.addEventListener('scroll', () => {
      if (syncing) return; syncing = true;
      leftBody.scrollTop = rightPane.scrollTop;
      syncing = false;
    });

    wrap.querySelectorAll('[data-expand-key]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = btn.dataset.expandKey;
        if (LST_EXPANDED.has(key)) LST_EXPANDED.delete(key); else LST_EXPANDED.add(key);
        renderTimeline();
      });
    });
    wrap.querySelectorAll('.tl-left-row, .tl-bar').forEach(el => {
      el.addEventListener('click', () => {
        const task = getTaskByKey(el.dataset.taskKey || el.dataset.barKey);
        if (task) openTaskDetail(project, task, 1);
      });
    });
    document.getElementById('tlFooterAddTask').addEventListener('click', () => openTaskModal(project, KAN_STATUSES[0].key));
    document.getElementById('tlTodayBtn').addEventListener('click', () => {
      rightPane.scrollLeft = Math.max(0, todayX - rightPane.clientWidth / 2);
    });
    wrap.querySelectorAll('.tl-zoom-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        TL_ZOOM = btn.dataset.zoom;
        renderTimeline();
      });
    });

    // initial scroll to today
    setTimeout(() => { rightPane.scrollLeft = Math.max(0, todayX - rightPane.clientWidth / 2); }, 0);
  }

  let CAL_MONTH_CURSOR = new Date(TODAY_REF.getFullYear(), TODAY_REF.getMonth(), 1);
  const CAL_STATUS_FILTER = new Set(); // statuses hidden from view
  let CAL_STATUS_MENU_OPEN = false;

