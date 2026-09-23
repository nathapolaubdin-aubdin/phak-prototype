  function openCalendarView(project) {
    CURRENT_KAN_PROJECT = project;
    CURRENT_VIEW = 'calendar';
    if (!project.tasks) project.tasks = [];
    workspacePage.style.display = 'none';
    dashboardPage.style.display = 'flex';
    dashboardPage.style.flexDirection = 'column';
    dashboardPage.style.flex = '1';
    dashboardPage.style.position = '';

    dashboardPage.innerHTML = renderPageHeader(project, 'calendar') + `
      ${buildKanToolbar('cal')}

      <div class="cal-wrap" id="calWrap"></div>
    `;

    bindPageHeader(project);
    renderCalendarView();
    document.getElementById('calAddTagBtn').addEventListener('click', openAddTagModal);
    document.getElementById('calToolbarAddTask').addEventListener('click', () => openTaskModal(project, KAN_STATUSES[0].key));
    dashboardPage.querySelectorAll('[data-stub]').forEach(el => {
      el.addEventListener('click', () => showToast('ฟีเจอร์นี้ยังไม่พร้อมใช้งานใน prototype นี้'));
    });
  }

  function calAssignLanes(tasks) {
    const sorted = tasks.slice().sort((a, b) => (a.startDate || TODAY_REF) - (b.startDate || TODAY_REF));
    const laneEnds = [];
    const laneOf = new Map();
    sorted.forEach(t => {
      const s = t.startDate || TODAY_REF;
      const e = t.dueDate || TODAY_REF;
      let placed = false;
      for (let i = 0; i < laneEnds.length; i++) {
        if (laneEnds[i] < s) { laneEnds[i] = e; laneOf.set(t.key, i); placed = true; break; }
      }
      if (!placed) { laneEnds.push(e); laneOf.set(t.key, laneEnds.length - 1); }
    });
    return laneOf;
  }

  function renderCalendarView() {
    const wrap = document.getElementById('calWrap');
    if (!wrap) return;
    const project = CURRENT_KAN_PROJECT;
    const thDayNames = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
    const thMonthsFull = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

    const monthStart = new Date(CAL_MONTH_CURSOR);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    // grid start: Monday on/before monthStart
    const startWeekday = (monthStart.getDay() + 6) % 7; // 0=Mon
    const gridStart = addDays(monthStart, -startWeekday);
    const endWeekday = (monthEnd.getDay() + 6) % 7;
    const gridEnd = addDays(monthEnd, 6 - endWeekday);
    const totalDays = Math.round((gridEnd - gridStart) / 86400000) + 1;
    const numWeeks = totalDays / 7;

    const VISIBLE_LANES = 3;
    const allTasks = project.tasks.filter(t => t.startDate && t.dueDate && !CAL_STATUS_FILTER.has(t.status) && !t.backlog);
    const activeStatusCount = KAN_STATUSES.length - CAL_STATUS_FILTER.size;
    const laneOf = calAssignLanes(allTasks);

    function tasksActiveOn(day) {
      return allTasks.filter(t => t.startDate <= day && t.dueDate >= day);
    }

    let weeksHtml = '';
    for (let w = 0; w < numWeeks; w++) {
      const weekStart = addDays(gridStart, w * 7);
      const weekEnd = addDays(weekStart, 6);

      // day cells
      let dayCellsHtml = '';
      for (let d = 0; d < 7; d++) {
        const day = addDays(weekStart, d);
        const isToday = day.getTime() === TODAY_REF.getTime();
        dayCellsHtml += `<div class="cal-day-cell ${isToday ? 'today' : ''}"><span class="cal-day-num">${day.getDate()}</span></div>`;
      }

      // bars for tasks intersecting this week
      const weekTasks = allTasks.filter(t => t.startDate <= weekEnd && t.dueDate >= weekStart);
      let barsHtml = '';
      for (let lane = 0; lane < VISIBLE_LANES; lane++) {
        const laneTasks = weekTasks.filter(t => laneOf.get(t.key) === lane);
        if (laneTasks.length === 0) continue;
        laneTasks.forEach(t => {
          const st = getStatus(t.status);
          const segStart = t.startDate > weekStart ? t.startDate : weekStart;
          const segEnd = t.dueDate < weekEnd ? t.dueDate : weekEnd;
          const colStart = Math.round((segStart - weekStart) / 86400000);
          const colSpan = Math.round((segEnd - segStart) / 86400000) + 1;
          const leftPct = (colStart / 7) * 100;
          const widthPct = (colSpan / 7) * 100;
          const roundLeft = segStart.getTime() === t.startDate.getTime();
          const roundRight = segEnd.getTime() === t.dueDate.getTime();
          barsHtml += `
            <div class="cal-bar-row" style="position:absolute; top:${lane * 18}px; left:0; right:0;">
              <div class="cal-bar" data-task-key="${t.key}" style="left:${leftPct}%; width:${widthPct}%; background:${st.color};
                border-radius: ${roundLeft ? '4px' : '0'} ${roundRight ? '4px' : '0'} ${roundRight ? '4px' : '0'} ${roundLeft ? '4px' : '0'};">
                ${roundLeft ? `<span class="k" style="border-color:currentColor;">${t.key}</span><span class="t">${t.title}</span>` : ''}
              </div>
            </div>`;
        });
      }

      // overflow counts per day (lanes beyond VISIBLE_LANES)
      const overflowCounts = [];
      for (let d = 0; d < 7; d++) {
        const day = addDays(weekStart, d);
        const active = tasksActiveOn(day);
        const extra = active.filter(t => laneOf.get(t.key) >= VISIBLE_LANES).length;
        overflowCounts.push(extra);
      }
      for (let d = 0; d < 7; d++) {
        if (overflowCounts[d] > 0) {
          const day = addDays(weekStart, d);
          const leftPct = (d / 7) * 100;
          const widthPct = (1 / 7) * 100;
          barsHtml += `
            <div class="cal-more-row" style="position:absolute; top:${VISIBLE_LANES * 18}px; left:0; right:0;">
              <div class="cal-more-label" data-day="${day.toISOString()}" style="left:${leftPct}%; width:${widthPct}%; text-align:center;">${overflowCounts[d]} เพิ่มเติม</div>
            </div>`;
        }
      }

      weeksHtml += `
        <div class="cal-week-row">
          ${dayCellsHtml}
          <div class="cal-bars-layer" style="left:0; right:0; top:32px; bottom:4px; position:absolute;">${barsHtml}</div>
        </div>`;
    }

    const weekdayRowHtml = thDayNames.map(n => `<div class="cal-weekday-cell">${n}</div>`).join('');

    wrap.innerHTML = `
      <div class="cal-nav">
        <button class="cal-nav-btn" id="calPrevBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="cal-nav-label">${thMonthsFull[monthStart.getMonth()]} ${monthStart.getFullYear() + 543}</span>
        <button class="cal-nav-btn" id="calNextBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
      <div class="cal-weekday-row">${weekdayRowHtml}</div>
      <div class="cal-body">${weeksHtml}</div>
      <div class="cal-footer">
        <button class="view-footer-add-btn" id="calFooterAddTask">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          เพิ่มงานใหม่
        </button>
        <button class="cal-status-toggle ${CAL_STATUS_MENU_OPEN ? 'open' : ''}" id="calStatusToggle">
          <span class="cal-status-frac">${activeStatusCount}/${KAN_STATUSES.length}</span>
          สถาณะงาน
          <svg class="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
          <div class="cal-status-menu ${CAL_STATUS_MENU_OPEN ? 'open' : ''}" id="calStatusMenu">
            <label class="cal-status-opt all">
              <input type="checkbox" id="calStatusAll" ${CAL_STATUS_FILTER.size === 0 ? 'checked' : ''} />
              เลือกทั้งหมด
            </label>
            ${KAN_STATUSES.map(s => `
              <label class="cal-status-opt">
                <input type="checkbox" data-status-key="${s.key}" ${CAL_STATUS_FILTER.has(s.key) ? '' : 'checked'} style="accent-color:${s.color};" />
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${s.color}" stroke-width="2">${s.icon}</svg>
                <span style="color:${s.color};">${s.label}</span>
              </label>
            `).join('')}
          </div>
        </button>
      </div>
    `;

    document.getElementById('calPrevBtn').addEventListener('click', () => {
      CAL_MONTH_CURSOR = new Date(CAL_MONTH_CURSOR.getFullYear(), CAL_MONTH_CURSOR.getMonth() - 1, 1);
      renderCalendarView();
    });
    document.getElementById('calNextBtn').addEventListener('click', () => {
      CAL_MONTH_CURSOR = new Date(CAL_MONTH_CURSOR.getFullYear(), CAL_MONTH_CURSOR.getMonth() + 1, 1);
      renderCalendarView();
    });
    wrap.querySelectorAll('.cal-bar[data-task-key]').forEach(bar => {
      bar.addEventListener('click', () => {
        const task = getTaskByKey(bar.dataset.taskKey);
        if (task) openTaskDetail(project, task, 1);
      });
    });

    wrap.querySelectorAll('.cal-more-label').forEach(label => {
      label.addEventListener('click', (e) => {
        e.stopPropagation();
        const existing = wrap.querySelector('.cal-day-popup');
        if (existing) existing.remove();

        const day = new Date(label.dataset.day);
        const dayTasks = tasksActiveOn(day);
        const thDayNamesShort = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
        const isToday = day.getTime() === TODAY_REF.getTime();

        const popup = document.createElement('div');
        popup.className = 'cal-day-popup';
        popup.innerHTML = `
          <div class="cal-day-popup-head">
            <span class="dn">${thDayNamesShort[day.getDay()]}</span>
            <span class="dd" style="${isToday ? 'border:2px solid var(--accent-coral);' : ''}">${day.getDate()}</span>
          </div>
          <div class="cal-day-popup-list">
            ${dayTasks.map(t => {
              const st = getStatus(t.status);
              return `
                <div class="cal-day-popup-row" data-task-key="${t.key}" style="background:${st.color};">
                  <span class="k" style="background:${st.cardBg}; border-color:${st.color}; color:${st.color};">${t.key}</span>
                  <span class="t">${t.title}</span>
                </div>`;
            }).join('')}
          </div>
        `;

        const labelRect = label.getBoundingClientRect();
        const wrapRect = wrap.getBoundingClientRect();
        let top = labelRect.top - wrapRect.top - 8;
        let left = labelRect.left - wrapRect.left;
        if (left + 271 > wrapRect.width) left = wrapRect.width - 271 - 8;
        if (left < 8) left = 8;
        popup.style.top = top + 'px';
        popup.style.left = left + 'px';
        popup.style.transform = 'translateY(-100%)';

        wrap.appendChild(popup);
        popup.addEventListener('click', (e) => e.stopPropagation());
        popup.querySelectorAll('.cal-day-popup-row').forEach(row => {
          row.addEventListener('click', () => {
            const task = getTaskByKey(row.dataset.taskKey);
            if (task) openTaskDetail(project, task, 1);
          });
        });
        document.addEventListener('click', function closePopupOnce() {
          popup.remove();
        }, { once: true });
      });
    });

    document.getElementById('calFooterAddTask').addEventListener('click', () => openTaskModal(project, KAN_STATUSES[0].key));

    const statusToggle = document.getElementById('calStatusToggle');
    const statusMenu = document.getElementById('calStatusMenu');
    statusToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      CAL_STATUS_MENU_OPEN = !CAL_STATUS_MENU_OPEN;
      statusToggle.classList.toggle('open', CAL_STATUS_MENU_OPEN);
      statusMenu.classList.toggle('open', CAL_STATUS_MENU_OPEN);
    });
    statusMenu.addEventListener('click', (e) => e.stopPropagation());
    document.getElementById('calStatusAll').addEventListener('change', (e) => {
      CAL_STATUS_FILTER.clear();
      if (!e.target.checked) KAN_STATUSES.forEach(s => CAL_STATUS_FILTER.add(s.key));
      renderCalendarView();
    });
    statusMenu.querySelectorAll('input[data-status-key]').forEach(cb => {
      cb.addEventListener('change', () => {
        const key = cb.dataset.statusKey;
        if (cb.checked) CAL_STATUS_FILTER.delete(key); else CAL_STATUS_FILTER.add(key);
        renderCalendarView();
      });
    });
    document.addEventListener('click', function closeCalMenuOnce() {
      CAL_STATUS_MENU_OPEN = false;
      statusMenu.classList.remove('open');
      statusToggle.classList.remove('open');
    }, { once: true });
    wrap.querySelectorAll('[data-stub]').forEach(el => {
      el.addEventListener('click', () => showToast('ฟีเจอร์นี้ยังไม่พร้อมใช้งานใน prototype นี้'));
    });
  }

  const CHAT_FAVORITES = [
    'ขอบเขนทำใช้จ่ายเศรษฐศาสตร์ดำเนินการ...',
    'ขอบเขนทำใช้จ่ายเศรษฐศาสตร์ดำเนินการ...'
  ];

  const CHAT_RECENTS = [
    'ขอบเขนทำใช้จ่ายเศรษฐศาสตร์ดำเนินการ...',
    'ขอบเขนทำใช้จ่ายเศรษฐศาสตร์ดำเนินการขยาย',
    'ขอบเขนทำใช้จ่ายเศรษฐศาสตร์ดำเนินการขยาย',
    'ขอบเขนทำใช้จ่ายเศรษฐศาสตร์ดำเนินการขยาย'
  ];

  const CHAT_TOOLS = [
    { key: 'presentation', label: 'Presentation', icon: '<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="12" x2="16" y2="12"/>' },
    { key: 'document', label: 'Document', icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>' },
    { key: 'spreadsheet', label: 'Spreadsheet', icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>' },
    { key: 'mindmap', label: 'Mind Map', icon: '<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><line x1="12" y1="7.5" x2="6.5" y2="17"/><line x1="12" y1="7.5" x2="17.5" y2="17"/>' },
    { key: 'infographic', label: 'Infographic', icon: '<circle cx="12" cy="12" r="9"/><path d="M12 3v9l6.36 6.36"/>' },
    { key: 'quiz', label: 'Quiz', icon: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5"/><line x1="12" y1="16.5" x2="12" y2="16.6"/>' },
    { key: 'photo', label: 'Photo', icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-4 4-3-3-6 6"/>' },
    { key: 'video', label: 'Video', icon: '<rect x="2" y="5" width="15" height="14" rx="2"/><polygon points="22 8 17 12 22 16 22 8"/>' },
    { key: 'audio', label: 'Audio', icon: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>' }
  ];

