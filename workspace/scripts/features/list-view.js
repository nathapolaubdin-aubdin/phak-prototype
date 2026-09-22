  function openListView(project) {
    CURRENT_VIEW = 'list';
    CURRENT_KAN_PROJECT = project;
    if (!project.tasks) project.tasks = [];
    workspacePage.style.display = 'none';
    dashboardPage.style.display = 'flex';
    dashboardPage.style.flexDirection = 'column';
    dashboardPage.style.flex = '1';
    dashboardPage.style.position = '';

    dashboardPage.innerHTML = renderPageHeader(project, 'list') + `
      ${buildKanToolbar('lst')}

      <div class="lst-wrap" id="lstWrap"></div>
    `;

    bindPageHeader(project);
    renderListTable();
    document.getElementById('lstAddTagBtn').addEventListener('click', openAddTagModal);
    document.getElementById('lstToolbarAddTask').addEventListener('click', () => openTaskModal(project, KAN_STATUSES[0].key));
    dashboardPage.querySelectorAll('[data-stub]').forEach(el => {
      el.addEventListener('click', () => showToast('ฟีเจอร์นี้ยังไม่พร้อมใช้งานใน prototype นี้'));
    });
  }

  const LST_EXPANDED = new Set();

  const LST_COLUMN_DEFS = {
    taskname: { label: 'TASK NAME', width: 'minmax(280px, 2.2fr)' },
    priority: { label: 'Priority', width: '140px' },
    status: { label: 'Status', width: '140px' },
    duedate: { label: 'Duedate', width: '160px' },
    assignee: { label: 'Assignee', width: '160px' },
    created: { label: 'Created', width: '170px' },
    updated: { label: 'Updated', width: '160px' },
    action: { label: '', width: '56px' }
  };
  let LST_COLUMN_ORDER = ['taskname', 'priority', 'status', 'duedate', 'assignee', 'created', 'updated', 'action'];

  let LST_SORT = { key: null, dir: 'asc' };

  function parseTaskDateValue(str) {
    if (!str) return 0;
    const thMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const parts = str.trim().split(/\s+/);
    if (parts.length < 3) return 0;
    const day = parseInt(parts[0], 10) || 0;
    const mIdx = thMonths.indexOf(parts[1]);
    const year = parseInt(parts[2].replace(/\D/g, ''), 10) || 0;
    return year * 372 + (mIdx === -1 ? 0 : mIdx) * 31 + day;
  }

  function taskSortValue(task, key) {
    switch (key) {
      case 'taskname': return task.title || '';
      case 'priority': return PRIORITY_LEVELS.findIndex(p => p.key === task.priorityKey);
      case 'status': return KAN_STATUSES.findIndex(s => s.key === task.status);
      case 'duedate': case 'created': case 'updated': return parseTaskDateValue(task.date);
      case 'assignee': return (task.avatars && task.avatars[0]) || '\uffff';
      default: return '';
    }
  }

  function sortTasksBy(list, key, dir) {
    if (!key) return list;
    const sorted = list.slice().sort((a, b) => {
      const va = taskSortValue(a, key);
      const vb = taskSortValue(b, key);
      if (typeof va === 'string') return va.localeCompare(vb, 'th');
      return va - vb;
    });
    return dir === 'desc' ? sorted.reverse() : sorted;
  }

  function renderListTable() {
    const wrap = document.getElementById('lstWrap');
    if (!wrap) return;
    const project = CURRENT_KAN_PROJECT;
    let topLevel = project.tasks.filter(t => !t.parentKey);
    topLevel = sortTasksBy(topLevel, LST_SORT.key, LST_SORT.dir);
    const gridTemplate = `48px ${LST_COLUMN_ORDER.map(k => LST_COLUMN_DEFS[k].width).join(' ')}`;

    const sortArrowSvg = (dir) => `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" style="margin-left:4px; flex-shrink:0;">${dir === 'asc' ? '<polyline points="18 15 12 9 6 15"/>' : '<polyline points="6 9 12 15 18 9"/>'}</svg>`;

    const headHtml = `
      <div class="lst-head-row" id="lstHeadRow" style="grid-template-columns:${gridTemplate};">
        <div class="lst-checkbox"><input type="checkbox" disabled /></div>
        ${LST_COLUMN_ORDER.map(k => `<div class="lst-cell lst-head-cell ${LST_SORT.key === k ? 'sorted' : ''}" draggable="true" data-col-key="${k}">
          <span class="lst-head-label" data-sort-key="${k}">${LST_COLUMN_DEFS[k].label}${LST_SORT.key === k ? sortArrowSvg(LST_SORT.dir) : ''}</span>
        </div>`).join('')}
        <div class="lst-unparent-overlay" id="lstUnparentOverlay">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="12 19 5 12 12 5"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          ปล่อยที่นี่เพื่อย้ายออกมาเป็นงานหลัก (ไม่เป็นงานย่อยของใคร)
        </div>
      </div>`;

    function cellHtml(key, ctx) {
      const { task, st, pri, hasChildren, children, doneCount, isOpen, depth, assignee, avatarColors } = ctx;
      switch (key) {
        case 'taskname':
          return `<div class="lst-taskname" data-col="taskname" style="padding-left:${16 + depth * 24}px;">
            ${hasChildren ? `<button class="lst-expand-btn ${isOpen ? 'open' : ''}" data-expand-key="${task.key}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>` : `<span class="lst-expand-spacer"></span>`}
            <span class="lst-key" style="border-color:${st.color}; color:${st.color};">${task.key}</span>
            <span class="lst-title">${task.title}</span>
            ${hasChildren ? `<span class="lst-frac">${doneCount}/${children.length}</span>` : ''}
          </div>`;
        case 'priority':
          return `<div class="lst-cell lst-priority" data-col="priority" style="color:${pri.color};">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${pri.color}" stroke-width="2.4">${pri.icon}</svg>
            ${pri.label}
          </div>`;
        case 'status':
          return `<div class="lst-cell" data-col="status">
            <span class="lst-status-pill" style="background:${st.cardBg}; color:${st.color};">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${st.icon}</svg>
              ${st.label}
            </span>
          </div>`;
        case 'duedate':
        case 'created':
        case 'updated':
          return `<div class="lst-cell" data-col="${key}">${task.date} , 10:00 AM</div>`;
        case 'assignee':
          return `<div class="lst-cell lst-assignee" data-col="assignee">
            ${assignee ? `<div class="a" style="background:${avatarColors[0]}">${avatarInitials(assignee)}</div><span class="nm">${assignee}</span>` : `<span style="color:var(--grey3);">ไม่ระบุ</span>`}
          </div>`;
        case 'action':
          return `<div class="lst-action" data-col="action">
            <button class="lst-more-btn" data-more-key="${task.key}" onclick="event.stopPropagation()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/></svg>
            </button>
          </div>`;
        default:
          return `<div class="lst-cell"></div>`;
      }
    }

    function rowHtml(task, depth) {
      const st = getStatus(task.status);
      const pri = getPriority(task.priorityKey);
      const children = project.tasks.filter(t => t.parentKey === task.key);
      const hasChildren = children.length > 0;
      const isOpen = LST_EXPANDED.has(task.key);
      const doneCount = children.filter(c => isDoneStatus(c.status)).length;
      const avatarColors = ['#F55A48', '#5981EC', '#911EF2', '#F5C518', '#25A767'];
      const assignee = task.avatars && task.avatars[0];
      const ctx = { task, st, pri, hasChildren, children, doneCount, isOpen, depth, assignee, avatarColors };

      let html = `
        <div class="lst-row" draggable="true" data-task-key="${task.key}" style="grid-template-columns:${gridTemplate};">
          <div class="lst-checkbox"><input type="checkbox" onclick="event.stopPropagation()" /></div>
          ${LST_COLUMN_ORDER.map(k => cellHtml(k, ctx)).join('')}
        </div>`;
      if (hasChildren && isOpen) {
        sortTasksBy(children, LST_SORT.key, LST_SORT.dir).forEach(c => { html += rowHtml(c, depth + 1); });
      }
      return html;
    }

    const rowsHtml = topLevel.map(t => rowHtml(t, 0)).join('');
    const bodyHtml = topLevel.length
      ? `<div class="lst-table">${headHtml}${rowsHtml}</div>`
      : `<div class="lst-table">${headHtml}</div><div class="lst-empty">ยังไม่มีงานในโปรเจคนี้</div>`;

    const counts = KAN_STATUSES.map(s => ({ s, n: project.tasks.filter(t => t.status === s.key).length }));

    wrap.innerHTML = bodyHtml + `
      <div class="lst-footer">
        <button class="lst-add-btn" id="lstFooterAddTask">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          เพิ่มงานใหม่
        </button>
        <div class="lst-summary">
          ${counts.map(c => `<span class="lst-summary-pill" style="color:${c.s.color};"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${c.s.icon}</svg>${c.s.label} ${c.n}</span>`).join('')}
          <button class="lst-more-btn" id="lstRefreshBtn" title="รีเฟรช">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </button>
        </div>
      </div>`;

    bindListColumnDrag(wrap);

    wrap.querySelectorAll('.lst-expand-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = btn.dataset.expandKey;
        if (LST_EXPANDED.has(key)) LST_EXPANDED.delete(key); else LST_EXPANDED.add(key);
        renderListTable();
      });
    });
    bindListRowDrag(wrap, project);
    wrap.querySelectorAll('.lst-more-btn[data-more-key]').forEach(btn => {
      btn.addEventListener('click', () => {
        const task = getTaskByKey(btn.dataset.moreKey);
        if (task) openTaskDetail(project, task, 1);
      });
    });
    document.getElementById('lstFooterAddTask').addEventListener('click', () => openTaskModal(project, KAN_STATUSES[0].key));
    document.getElementById('lstRefreshBtn').addEventListener('click', () => { renderListTable(); showToast('รีเฟรชแล้ว'); });
  }

  function bindListColumnDrag(wrap) {
    let draggedKey = null;
    let justDragged = false;
    const headCells = wrap.querySelectorAll('.lst-head-cell');

    function columnCells(key) {
      return wrap.querySelectorAll(`[data-col-key="${key}"], [data-col="${key}"]`);
    }

    wrap.querySelectorAll('.lst-head-label').forEach(label => {
      label.addEventListener('click', (e) => {
        e.stopPropagation();
        if (justDragged) return;
        const key = label.dataset.sortKey;
        if (LST_SORT.key === key) {
          LST_SORT.dir = LST_SORT.dir === 'asc' ? 'desc' : 'asc';
        } else {
          LST_SORT = { key, dir: 'asc' };
        }
        renderListTable();
      });
    });

    headCells.forEach(cell => {
      cell.addEventListener('dragstart', (e) => {
        draggedKey = cell.dataset.colKey;
        justDragged = true;
        cell.classList.add('col-dragging');
        columnCells(draggedKey).forEach(el => el.classList.add('col-drag-source'));
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', draggedKey); } catch (err) {}
      });
      cell.addEventListener('dragend', () => {
        cell.classList.remove('col-dragging');
        wrap.querySelectorAll('.col-drag-source').forEach(el => el.classList.remove('col-drag-source'));
        wrap.querySelectorAll('.col-drag-target-line').forEach(el => el.classList.remove('col-drag-target-line'));
        headCells.forEach(c => c.classList.remove('col-drag-over'));
        setTimeout(() => { justDragged = false; }, 50);
      });
      cell.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (cell.dataset.colKey === draggedKey) return;
        cell.classList.add('col-drag-over');
        wrap.querySelectorAll('.col-drag-target-line').forEach(el => el.classList.remove('col-drag-target-line'));
        columnCells(cell.dataset.colKey).forEach(el => { if (!el.classList.contains('col-drag-source')) el.classList.add('col-drag-target-line'); });
      });
      cell.addEventListener('dragleave', () => {
        cell.classList.remove('col-drag-over');
      });
      cell.addEventListener('drop', (e) => {
        e.preventDefault();
        cell.classList.remove('col-drag-over');
        const targetKey = cell.dataset.colKey;
        if (!draggedKey || draggedKey === targetKey) return;
        const fromIdx = LST_COLUMN_ORDER.indexOf(draggedKey);
        const toIdx = LST_COLUMN_ORDER.indexOf(targetKey);
        if (fromIdx === -1 || toIdx === -1) return;
        LST_COLUMN_ORDER.splice(fromIdx, 1);
        LST_COLUMN_ORDER.splice(toIdx, 0, draggedKey);
        renderListTable();
      });
    });
  }

  function isDescendantOf(project, candidateKey, ancestorKey) {
    let cur = project.tasks.find(t => t.key === candidateKey);
    while (cur && cur.parentKey) {
      if (cur.parentKey === ancestorKey) return true;
      cur = project.tasks.find(t => t.key === cur.parentKey);
    }
    return false;
  }

  function bindListRowDrag(wrap, project) {
    let draggedRowKey = null;
    let justDraggedRow = false;
    const rows = wrap.querySelectorAll('.lst-row');
    const headRow = wrap.querySelector('#lstHeadRow');

    rows.forEach(row => {
      row.addEventListener('click', () => {
        if (justDraggedRow) return;
        const task = getTaskByKey(row.dataset.taskKey);
        if (task) openTaskDetail(project, task, 1);
      });

      row.addEventListener('dragstart', (e) => {
        draggedRowKey = row.dataset.taskKey;
        justDraggedRow = true;
        row.classList.add('row-dragging');
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', draggedRowKey); } catch (err) {}
        if (headRow) headRow.classList.add('unparent-target');
      });
      row.addEventListener('dragend', () => {
        row.classList.remove('row-dragging');
        rows.forEach(r => r.classList.remove('row-drop-target', 'row-drop-invalid'));
        if (headRow) headRow.classList.remove('unparent-target', 'drop-ready');
        setTimeout(() => { justDraggedRow = false; }, 50);
      });
      row.addEventListener('dragover', (e) => {
        if (!draggedRowKey) return;
        e.preventDefault();
        const targetKey = row.dataset.taskKey;
        const invalid = targetKey === draggedRowKey || isDescendantOf(project, targetKey, draggedRowKey);
        e.dataTransfer.dropEffect = invalid ? 'none' : 'move';
        row.classList.toggle('row-drop-target', !invalid);
        row.classList.toggle('row-drop-invalid', invalid);
      });
      row.addEventListener('dragleave', () => {
        row.classList.remove('row-drop-target', 'row-drop-invalid');
      });
      row.addEventListener('drop', (e) => {
        e.preventDefault();
        row.classList.remove('row-drop-target', 'row-drop-invalid');
        const targetKey = row.dataset.taskKey;
        if (!draggedRowKey || targetKey === draggedRowKey) return;
        if (isDescendantOf(project, targetKey, draggedRowKey)) {
          showToast('ย้ายไม่ได้ — ปลายทางเป็นงานย่อยของงานนี้อยู่แล้ว');
          return;
        }
        const draggedTask = getTaskByKey(draggedRowKey);
        const targetTask = getTaskByKey(targetKey);
        if (!draggedTask || !targetTask) return;
        draggedTask.parentKey = targetKey;
        LST_EXPANDED.add(targetKey);
        renderListTable();
        showToast(`ย้าย ${draggedTask.key} ไปเป็นงานย่อยของ ${targetTask.key} แล้ว`);
      });
    });

    if (headRow) {
      headRow.addEventListener('dragover', (e) => {
        if (!draggedRowKey) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        headRow.classList.add('drop-ready');
      });
      headRow.addEventListener('dragleave', () => {
        headRow.classList.remove('drop-ready');
      });
      headRow.addEventListener('drop', (e) => {
        e.preventDefault();
        headRow.classList.remove('drop-ready', 'unparent-target');
        if (!draggedRowKey) return;
        const draggedTask = getTaskByKey(draggedRowKey);
        if (!draggedTask) return;
        if (!draggedTask.parentKey) {
          showToast(`${draggedTask.key} เป็นงานหลักอยู่แล้ว`);
          return;
        }
        draggedTask.parentKey = null;
        renderListTable();
        showToast(`ย้าย ${draggedTask.key} ออกมาเป็นงานหลักแล้ว`);
      });
    }
  }

  let TL_ZOOM = 'month'; // week | month | quarter
  const TL_DAY_WIDTH = { week: 48, month: 24, quarter: 10 };
  const TL_ZOOM_LABELS = [
    { key: 'week', label: 'สัปดาห์' },
    { key: 'month', label: 'เดือน' },
    { key: 'quarter', label: 'ไตรมาส' }
  ];
  const TL_RANGE_BEFORE = 30;
  const TL_RANGE_AFTER = 60;

