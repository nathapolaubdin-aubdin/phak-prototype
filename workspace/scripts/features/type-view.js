  // ---------- Type view (มุมมองประเภท) ----------
  // Reuses the same task model (CURRENT_KAN_PROJECT.tasks), the same card
  // renderer (buildKanCard) and the same lookup helpers as the board / list /
  // timeline / calendar views, so edits made anywhere stay in sync.
  function typeViewToolbarHtml() {
    return `
      ${buildKanToolbar('typ')}`;
  }

  function openTypeView(project) {
    CURRENT_VIEW = 'type';
    CURRENT_KAN_PROJECT = project;
    if (!project.tasks) project.tasks = [];
    workspacePage.style.display = 'none';
    dashboardPage.style.display = 'flex';
    dashboardPage.style.flexDirection = 'column';
    dashboardPage.style.flex = '1';
    dashboardPage.style.position = '';

    dashboardPage.innerHTML = renderPageHeader(project, 'type') + typeViewToolbarHtml() + `
      <div class="typ-wrap" id="typWrap"></div>
    `;

    bindPageHeader(project);
    renderTypeView();
    document.getElementById('typAddTagBtn').addEventListener('click', openAddTagModal);
    document.getElementById('typToolbarAddTask').addEventListener('click', () => openTaskModal(project, KAN_STATUSES[0].key));
    dashboardPage.querySelectorAll('[data-stub]').forEach(el => {
      el.addEventListener('click', () => showToast('ฟีเจอร์นี้ยังไม่พร้อมใช้งานใน prototype นี้'));
    });
  }

  function renderTypeView() {
    const wrap = document.getElementById('typWrap');
    if (!wrap) return;
    const tasks = CURRENT_KAN_PROJECT.tasks || [];

    const groupsHtml = TAG_TYPES.map(tag => {
      const groupTasks = tasks.filter(t => t.tagKey === tag.key);
      const body = groupTasks.length
        ? `<div class="typ-grid" data-drop-tag="${tag.key}">${groupTasks.map(t => buildKanCard(t)).join('')}</div>`
        : `<div class="typ-empty" data-drop-tag="${tag.key}">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
             ยังไม่มีงาน
           </div>`;
      // Section header takes the tag's colour: a soft tint fill (like Figma),
      // with the chip, icon and count in the solid tag colour.
      const headerBg = mixHex(tag.color, '#ffffff', 0.88);
      const headerInk = mixHex(tag.color, '#000000', 0.25);
      return `
        <div class="typ-group" data-tag="${tag.key}">
          <div class="typ-group-header" style="background:${headerBg}; border-bottom:1px solid ${hexA(tag.color, 0.3)};">
            <span class="typ-tag-chip" style="background:var(--white); color:${tag.color}; border:0.5px solid ${tag.color};">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${tag.icon}</svg>
              ${tag.label}
            </span>
            <span class="typ-count" data-count-for="${tag.key}" style="color:${headerInk};">${groupTasks.length}</span>
          </div>
          ${body}
          <div class="typ-group-footer">
            <button class="typ-add-task-btn" data-add-task-tag="${tag.key}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              เพิ่มงาน
            </button>
          </div>
        </div>`;
    }).join('');

    wrap.innerHTML = groupsHtml + `
      <div class="typ-add-type-row">
        <button class="typ-add-type-btn" id="typAddTypeBtn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          เพิ่มประเภท
        </button>
      </div>`;

    bindTypeDragDrop();
    document.getElementById('typAddTypeBtn').addEventListener('click', openAddTagModal);
    wrap.querySelectorAll('[data-add-task-tag]').forEach(el => {
      el.addEventListener('click', () => openTaskModal(CURRENT_KAN_PROJECT, KAN_STATUSES[0].key, null, 1, el.dataset.addTaskTag));
    });
  }

  function bindTypeDragDrop() {
    const wrap = document.getElementById('typWrap');
    if (!wrap) return;
    let draggedKey = null;
    let justDragged = false;
    const dropZones = wrap.querySelectorAll('[data-drop-tag]');

    wrap.querySelectorAll('.kan-card').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        draggedKey = card.dataset.taskKey;
        card.classList.add('dragging');
        justDragged = true;
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', draggedKey); } catch (err) {}
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        dropZones.forEach(z => z.classList.remove('drag-over'));
        setTimeout(() => { justDragged = false; }, 50);
      });
      card.addEventListener('click', () => {
        if (justDragged) return;
        const task = CURRENT_KAN_PROJECT.tasks.find(t => t.key === card.dataset.taskKey);
        if (task) openTaskDetail(CURRENT_KAN_PROJECT, task, 1);
      });
    });

    dropZones.forEach(zone => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        zone.classList.add('drag-over');
      });
      zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        const newTag = zone.dataset.dropTag;
        const key = draggedKey || e.dataTransfer.getData('text/plain');
        const task = CURRENT_KAN_PROJECT.tasks.find(t => t.key === key);
        if (task && task.tagKey !== newTag) {
          task.tagKey = newTag;
          renderTypeView();
          showToast(`ย้าย ${key} ไปประเภท "${getTag(newTag).label}" แล้ว`);
        }
        draggedKey = null;
      });
    });
  }

