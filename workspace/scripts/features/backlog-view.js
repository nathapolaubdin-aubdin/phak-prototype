  // ---------- Backlog view (งานค้าง) ----------
  // A holding pool for tasks that haven't been pulled onto the active board yet.
  // Tasks with `backlog: true` are excluded from the board/list/timeline/calendar/
  // type views (see the `!t.backlog` filters there) and only appear here, as a flat
  // grid of the same buildKanCard component the type view uses — not grouped by
  // type, per the design brief. Each card gets a "ดึงเข้าบอร์ด" (pull onto board)
  // action that clears the flag and drops it back into the normal views.
  function backlogViewToolbarHtml() {
    return `${buildKanToolbar('bl')}`;
  }

  function openBacklogView(project) {
    CURRENT_VIEW = 'backlog';
    CURRENT_KAN_PROJECT = project;
    if (!project.tasks) project.tasks = [];
    workspacePage.style.display = 'none';
    dashboardPage.style.display = 'flex';
    dashboardPage.style.flexDirection = 'column';
    dashboardPage.style.flex = '1';
    dashboardPage.style.position = '';

    dashboardPage.innerHTML = renderPageHeader(project, 'backlog') + backlogViewToolbarHtml() + `
      <div class="typ-wrap" id="blWrap"></div>
    `;

    bindPageHeader(project);
    renderBacklogView();
    document.getElementById('blToolbarAddTask').addEventListener('click', () => openTaskModal(project, KAN_STATUSES[0].key, null, 1, null, true));
    dashboardPage.querySelectorAll('[data-stub]').forEach(el => {
      el.addEventListener('click', () => showToast('ฟีเจอร์นี้ยังไม่พร้อมใช้งานใน prototype นี้'));
    });
  }

  function renderBacklogView() {
    const wrap = document.getElementById('blWrap');
    if (!wrap) return;
    const tasks = (CURRENT_KAN_PROJECT.tasks || []).filter(t => t.backlog);

    wrap.innerHTML = tasks.length
      ? `<div class="typ-grid">${tasks.map(t => `
          <div class="bl-card-wrap">
            ${buildKanCard(t)}
            <button class="bl-pull-btn" data-pull-key="${t.key}" title="ดึงเข้าบอร์ด">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>
              ดึงเข้าบอร์ด
            </button>
          </div>`).join('')}</div>`
      : `<div class="typ-empty">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 12 12 20l-8-8V4h8z"/></svg>
          ยังไม่มีงานค้าง — งานที่ยังไม่พร้อมดึงเข้าบอร์ดจะมาอยู่ที่นี่
        </div>`;

    wrap.querySelectorAll('.kan-card').forEach(card => {
      card.addEventListener('click', () => {
        const task = CURRENT_KAN_PROJECT.tasks.find(t => t.key === card.dataset.taskKey);
        if (task) openTaskDetail(CURRENT_KAN_PROJECT, task, 1);
      });
    });

    wrap.querySelectorAll('.bl-pull-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const task = CURRENT_KAN_PROJECT.tasks.find(t => t.key === btn.dataset.pullKey);
        if (!task) return;
        task.backlog = false;
        renderBacklogView();
        notifyTasksChanged();
        showToast(`ดึงงาน ${task.key} เข้าบอร์ดแล้ว`);
      });
    });
  }
