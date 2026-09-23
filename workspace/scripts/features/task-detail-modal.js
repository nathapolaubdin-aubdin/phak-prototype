  function openTaskDetail(project, task, level) {
    level = level || 1;
    const overlay = document.getElementById('taskModalOverlay');

    const statusOptsHtml = buildStatusOptsHtml(task.status);

    function tagSwatchHtml(t) {
      return `<span class="swatch" style="background:${hexA(t.color,0.15)}; color:${t.color}; border:0.5px solid ${t.color};">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${t.icon}</svg>
        ${t.label}
      </span>`;
    }
    function tagListHtml() {
      return TAG_TYPES.map(t => `<div class="tm-dd-opt" data-key="${t.key}">${tagSwatchHtml(t)}</div>`).join('') + TM_TAG_MANAGE_HTML();
    }
    function priSwatchHtml(p) {
      return `<span class="plain">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${p.color}" stroke-width="2.4">${p.icon}</svg>
        ${p.label}
      </span>`;
    }
    const chevSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';

    const tagDdHtml = `
      <div class="tm-dd" id="tmTagDd">
        <button class="tm-dd-btn" type="button">
          <span class="tm-dd-value">${tagSwatchHtml(getTag(task.tagKey))}</span>
          ${chevSvg}
        </button>
        <div class="tm-dd-list">
          ${tagListHtml()}
        </div>
      </div>`;
    const priDdHtml = `
      <div class="tm-dd" id="tmPriDd">
        <button class="tm-dd-btn" type="button">
          <span class="tm-dd-value">${priSwatchHtml(getPriority(task.priorityKey))}</span>
          ${chevSvg}
        </button>
        <div class="tm-dd-list">
          ${PRIORITY_LEVELS.map(p => `<div class="tm-dd-opt" data-key="${p.key}">${priSwatchHtml(p)}</div>`).join('')}
        </div>
      </div>`;

    let parentTask = task.parentKey ? getTaskByKey(task.parentKey) : null;
    const parentStatusOf = () => (parentTask || {}).status;
    const subtasksNow = () => project.tasks.filter(t => t.parentKey === task.key);

    function subtaskRowHtml(st_task) {
      const st = getStatus(st_task.status);
      return `
        <div class="tm-subtask-item" data-subtask-key="${st_task.key}" style="background:${st.cardBg || 'rgba(255,255,255,0.05)'}; color:${st.color};">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${st.icon}</svg>
          <span class="ttl">${smEsc(st_task.title)}</span>
          <span class="key">${st_task.key}</span>
        </div>`;
    }
    // Sub-task header (progress) + rows; drawn again by renderSubtasks() whenever tasks change.
    function subtasksHtml() {
      const subs = subtasksNow();
      if (!subs.length) return '';
      const done = subs.filter(t => isDoneStatus(t.status)).length;
      return `
            <div class="tm-subtasks-head">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>
              <span class="lbl">งานย่อย</span>
              <div class="tm-subtasks-track"><div class="tm-subtasks-fill" style="width:${done / subs.length * 100}%;"></div></div>
              <span class="tm-subtasks-frac">${done}/${subs.length}</span>
            </div>
            <div id="tmSubtaskList">${subs.map(subtaskRowHtml).join('')}</div>`;
    }

    if (!task.commentList) task.commentList = [];

    const modalNode = document.createElement('div');
    modalNode.className = 'task-modal';
    modalNode.innerHTML = `
        <div class="tm-topbar">
          <span class="tm-title tm-breadcrumb" id="tmCrumb">${tmCrumbHtml(!!parentTask)}</span>
          <div class="tm-topbar-actions">
            <button class="tm-ai-btn" id="tmAiBtn">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6.12885 2.05958C6.82864 0.404564 9.1752 0.404676 9.87509 2.05958L11.038 4.8097C11.0674 4.87921 11.1228 4.93454 11.1923 4.96399L13.9424 6.1269C15.5976 6.82666 15.5976 9.17337 13.9424 9.87314L11.1923 11.036C11.1228 11.0655 11.0674 11.1208 11.038 11.1903L9.87509 13.9405C9.17532 15.5957 6.82862 15.5957 6.12885 13.9405L4.96595 11.1903C4.93649 11.1209 4.88116 11.0654 4.81165 11.036L2.06153 9.87314C0.406626 9.17324 0.406519 6.82668 2.06153 6.1269L4.81165 4.96399C4.88125 4.93457 4.93652 4.8793 4.96595 4.8097L6.12885 2.05958Z"/></svg>
              สรุปงาน
            </button>
            <button class="tm-icon-btn" id="tmShareBtn" aria-label="แชร์">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="10.5" x2="15.4" y2="6.5"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/></svg>
            </button>
            <button class="tm-icon-btn" id="tmMoreBtn" data-task-more-menu aria-haspopup="menu" aria-expanded="false" aria-label="เพิ่มเติม">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/></svg>
            </button>
            <button class="tm-icon-btn" id="tmExpandBtn" aria-label="ขยาย">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
            </button>
            <button class="tm-icon-btn" id="tmCloseBtn" aria-label="ปิด">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div class="tm-body">
          <div class="tm-left">
            <div id="tmParentBanner" style="display:contents">${tmParentBannerHtml(parentTask, parentStatusOf())}</div>
            <div class="tm-name-row">
              <span id="tmKeyWrap" style="display:contents">${tmKeyWrapHtml(parentTask, parentStatusOf(), task.key, task.status)}</span>
              <input class="tm-name-input" id="tmNameInput" type="text" value="${task.title}" autocomplete="off" />
              <div class="tm-project-pill">
                <span class="av">${project.imageUrl ? `<img src="${project.imageUrl}" alt="" />` : ''}</span>
                ${project.name}
              </div>
            </div>

            <span class="tm-label">รายละเอียดงาน</span>
            <div class="tm-editor-wrap">
              <div class="tm-toolbar">
                <div class="tm-toolbar-row">
                  <button class="tm-tb-btn" data-cmd="undo" title="ย้อนกลับ">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
                  </button>
                  <button class="tm-tb-btn" data-cmd="redo" title="ทำซ้ำ">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>
                  </button>
                  <div class="tm-tb-divider"></div>
                  <button class="tm-tb-btn" data-cmd="bold" title="ตัวหนา"><b>B</b></button>
                  <button class="tm-tb-btn" data-cmd="italic" title="ตัวเอียง"><i>I</i></button>
                  <button class="tm-tb-btn" data-cmd="underline" title="ขีดเส้นใต้"><u>U</u></button>
                  <div class="tm-tb-divider"></div>
                  <button class="tm-tb-btn" data-cmd="insertUnorderedList" title="รายการ">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>
                  </button>
                </div>
              </div>
              <div class="tm-editor" id="tmEditor" contenteditable="true">${task.desc.map(d => `<div>${d}</div>`).join('')}</div>
            </div>

            <div id="tmSubtasksWrap" style="display:contents">${subtasksHtml()}</div>
            <button class="tm-add-subtask-link" id="tmAddSubtaskLink" style="${tmTaskDepth(task) < 5 ? '' : 'display:none'}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              สร้างงานย่อย
            </button>
          </div>

          <div class="tm-right">
            <div class="tm-field">
              <div style="display:flex; align-items:center; justify-content:space-between;">
                <span class="tm-label">สถานะงาน</span>
                <button class="tm-icon-btn" style="width:20px;height:20px;" data-status-menu aria-haspopup="menu" aria-expanded="false" aria-label="ตัวเลือกสถานะ">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/></svg>
                </button>
              </div>
              <div class="tm-status-group" id="tmStatusGroup">${statusOptsHtml}</div>
            </div>

            <div class="tm-field-row" id="tmParentRow">
              <span class="tm-label">งานหลัก</span>
              <div class="tm-pd" id="tmParentField">${tmParentFieldHtml(parentTask, parentStatusOf(), false)}</div>
            </div>

            <div class="tm-field-row">
              <span class="tm-label">ประเภทงาน</span>
              ${tagDdHtml}
            </div>

            <div class="tm-field-row">
              <span class="tm-label">ความสำคัญ</span>
              ${priDdHtml}
            </div>

            <div class="tm-field-row">
              <span class="tm-label">เริ่มวันที่</span>
              <span class="tm-date-view">${task.startDate ? formatThaiDate(task.startDate) : '-'}</span>
            </div>

            <div class="tm-field-row">
              <span class="tm-label">กำหนดส่ง</span>
              <span class="tm-date-view">${task.dueDate ? formatThaiDate(task.dueDate) : task.date}</span>
            </div>

            <div class="tm-field-row">
              <span class="tm-label">มอบหมายให้</span>
              <div style="display:flex; align-items:center; flex-wrap:wrap; gap:6px;" id="tmAssignees">${tmAssigneesHtml(task.avatars)}</div>
            </div>

            <div class="tm-field-row">
              <span class="tm-label">ผู้สร้าง</span>
              <div class="tm-avatar">${avatarInitials(CURRENT_USER.name)}</div>
            </div>

            <div class="tm-field" style="margin-top:8px;">
              <div class="tm-tabs">
                <button class="tm-tab-btn active" data-tab="comment">คอมเม้น</button>
                <button class="tm-tab-btn" data-tab="history">ประวัติ</button>
              </div>
              <div id="tmCommentList" class="tm-comment-list">
                ${task.commentList.map(c => `<div class="tm-comment-entry"><div class="tm-avatar">${avatarInitials(CURRENT_USER.name)}</div><div class="bubble"><div class="who">${CURRENT_USER.name}</div>${c}</div></div>`).join('')}
              </div>
              <div class="tm-comment-row">
                <div class="tm-avatar">${avatarInitials(CURRENT_USER.name)}</div>
                <textarea class="tm-comment-input" id="tmCommentInput" placeholder="เพิ่มรายละเอียด"></textarea>
              </div>
            </div>
          </div>
        </div>

        <div class="tm-footer">
          <span></span>
          <button class="tm-submit ready" id="tmSubmitBtn">ปิด</button>
        </div>
    `;

    if (taskModalStack.length > 0) {
      taskModalStack[taskModalStack.length - 1].style.display = 'none';
    }
    modalNode._tmTask = task;
    overlay.appendChild(modalNode);
    taskModalStack.push(modalNode);
    overlay.classList.add('open');

    let selectedStatus = task.status;
    let selectedTagKey = task.tagKey;
    let selectedPriKey = task.priorityKey;

    // Statuses edited from the ⋯ menu (manager modal): resync everything in this modal that shows a status.
    function onStatusesSaved(e) {
      if (!modalNode.isConnected) { document.removeEventListener('statuses-saved', onStatusesSaved); return; }
      selectedStatus = e.detail.resolve(selectedStatus);
      if (!KAN_STATUSES.some(s => s.key === selectedStatus)) selectedStatus = KAN_STATUSES[0].key;
      modalNode.querySelector('#tmStatusGroup').innerHTML = buildStatusOptsHtml(selectedStatus);
      const kb = modalNode.querySelector('#tmKeyBadge');
      if (kb) kb.style.cssText = keyBadgeStyle(selectedStatus);
      refreshParentUi();
      renderSubtasks();
    }
    document.addEventListener('statuses-saved', onStatusesSaved);
    const nameInput = modalNode.querySelector('#tmNameInput');
    const editor = modalNode.querySelector('#tmEditor');
    const assigneesWrap = modalNode.querySelector('#tmAssignees');

    // ----- parent task (งานหลัก): pick / change / clear from the right column -----
    // Not allowed as a parent: this task, its own sub-tasks (would make a loop), and anything that would push the
    // deepest of this task's sub-tasks past the 5-level limit.
    function descendantKeys() {
      const out = new Set();
      const walk = k => project.tasks.forEach(t => { if (t.parentKey === k && !out.has(t.key)) { out.add(t.key); walk(t.key); } });
      walk(task.key);
      return out;
    }
    function subtreeHeight(k) {
      return 1 + Math.max(0, ...project.tasks.filter(t => t.parentKey === k).map(t => subtreeHeight(t.key)));
    }
    function parentCandidates() {
      const bad = descendantKeys();
      bad.add(task.key);
      const h = subtreeHeight(task.key);
      return project.tasks.filter(t => !bad.has(t.key) && tmTaskDepth(t) + h <= 5);
    }
    function refreshParentUi() {
      modalNode.querySelector('#tmCrumb').innerHTML = tmCrumbHtml(!!parentTask);
      modalNode.querySelector('#tmParentBanner').innerHTML = tmParentBannerHtml(parentTask, parentStatusOf());
      modalNode.querySelector('#tmKeyWrap').innerHTML = tmKeyWrapHtml(parentTask, parentStatusOf(), task.key, selectedStatus);
      modalNode.querySelector('#tmParentField').innerHTML = tmParentFieldHtml(parentTask, parentStatusOf(), false);
      const link = modalNode.querySelector('#tmAddSubtaskLink');
      if (link) link.style.display = tmTaskDepth(task) < 5 ? '' : 'none';
    }
    tmWireParentPicker(modalNode, () => tmParentOptionsHtml(parentTask, parentCandidates()), (t) => {
      parentTask = t;
      task.parentKey = t ? t.key : null;   // tmTaskDepth (link visibility) reads this
      refreshParentUi();
      commitChanges();
    });

    function commitChanges() {
      task.title = nameInput.value.trim() || task.title;
      const rawText = editor.innerText.trim();
      task.desc = rawText ? rawText.split('\n').filter(l => l.trim()) : task.desc;
      task.status = selectedStatus;
      task.tagKey = selectedTagKey;
      task.priorityKey = selectedPriKey;
      task.parentKey = parentTask ? parentTask.key : null;
      refreshCurrentView();
      notifyTasksChanged();
    }

    function wireDropdown(id, onPick) {
      const dd = modalNode.querySelector('#' + id);
      const btn = dd.querySelector('.tm-dd-btn');
      const list = dd.querySelector('.tm-dd-list');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        modalNode.querySelectorAll('.tm-dd-list').forEach(l => { if (l !== list) l.classList.remove('open'); });
        list.classList.toggle('open');
      });
      list.addEventListener('click', (e) => {
        const opt = e.target.closest('.tm-dd-opt');
        if (!opt) return;
        onPick(opt.dataset.key);
        dd.querySelector('.tm-dd-value').innerHTML = opt.innerHTML;
        list.classList.remove('open');
        commitChanges();
      });
    }
    wireDropdown('tmTagDd', k => { selectedTagKey = k; });
    wireDropdown('tmPriDd', k => { selectedPriKey = k; });

    // "จัดการประเภท" row at the end of the type list opens the manager on top of this modal.
    modalNode.querySelector('#tmTagDd .tm-dd-list').addEventListener('click', (e) => {
      if (!e.target.closest('.tm-dd-manage')) return;
      e.stopPropagation();
      modalNode.querySelectorAll('.tm-dd-list').forEach(l => l.classList.remove('open'));
      openTypeManager({ returnFocusTo: modalNode.querySelector('#tmTagDd .tm-dd-btn') });
    });
    // Types edited in the manager: remap the picked type (to where its tasks were moved) and redraw the dropdown.
    function onTypesSaved(e) {
      if (!modalNode.isConnected) { document.removeEventListener('types-saved', onTypesSaved); return; }
      selectedTagKey = e.detail.resolve(selectedTagKey);
      if (!TAG_TYPES.some(t => t.key === selectedTagKey)) selectedTagKey = TAG_TYPES[0].key;
      const dd = modalNode.querySelector('#tmTagDd');
      dd.querySelector('.tm-dd-value').innerHTML = tagSwatchHtml(getTag(selectedTagKey));
      dd.querySelector('.tm-dd-list').innerHTML = tagListHtml();
    }
    document.addEventListener('types-saved', onTypesSaved);
    modalNode.addEventListener('click', () => {
      modalNode.querySelectorAll('.tm-dd-list').forEach(l => l.classList.remove('open'));
    });

    modalNode.querySelector('#tmStatusGroup').addEventListener('click', (e) => {
      const btn = e.target.closest('.tm-status-opt');
      if (!btn) return;
      selectedStatus = btn.dataset.status;
      modalNode.querySelectorAll('.tm-status-opt').forEach(b => {
        b.classList.remove('active');
        b.style.background = '';
      });
      btn.classList.add('active');
      btn.style.background = getStatus(selectedStatus).color;
      const kb = modalNode.querySelector('#tmKeyBadge');
      if (kb) kb.style.cssText = keyBadgeStyle(selectedStatus);
      commitChanges();
    });

    modalNode.querySelectorAll('.tm-tb-btn[data-cmd]').forEach(btn => {
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        document.execCommand(btn.dataset.cmd, false, null);
        editor.focus();
      });
    });
    editor.addEventListener('blur', commitChanges);
    nameInput.addEventListener('blur', commitChanges);

    tmWireAssignees(assigneesWrap, task.avatars, refreshCurrentView);

    function renderSubtasks() { modalNode.querySelector('#tmSubtasksWrap').innerHTML = subtasksHtml(); }
    modalNode.querySelector('#tmSubtasksWrap').addEventListener('click', (e) => {
      const row = e.target.closest('.tm-subtask-item');
      if (!row) return;
      const sub = getTaskByKey(row.dataset.subtaskKey);
      if (sub) openTaskDetail(project, sub, level + 1);
    });
    // Another modal changed a task (e.g. moved or edited one of this task's sub-tasks): redraw the list and progress.
    function onTasksChanged() {
      if (!modalNode.isConnected) { document.removeEventListener('tasks-changed', onTasksChanged); return; }
      renderSubtasks();
    }
    document.addEventListener('tasks-changed', onTasksChanged);

    const addSubtaskLink = modalNode.querySelector('#tmAddSubtaskLink');
    if (addSubtaskLink) {
      addSubtaskLink.addEventListener('click', () => {
        openTaskModal(project, task.status, { key: task.key, title: task.title }, tmTaskDepth(task) + 1);
      });
    }

    modalNode.querySelectorAll('.tm-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modalNode.querySelectorAll('.tm-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (btn.dataset.tab === 'history') showToast('ยังไม่มีประวัติการเปลี่ยนแปลง');
      });
    });

    const commentInput = modalNode.querySelector('#tmCommentInput');
    commentInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const text = commentInput.value.trim();
        if (!text) return;
        task.commentList.push(text);
        const list = modalNode.querySelector('#tmCommentList');
        const entry = document.createElement('div');
        entry.className = 'tm-comment-entry';
        entry.innerHTML = `<div class="tm-avatar">${avatarInitials(CURRENT_USER.name)}</div><div class="bubble"><div class="who">${CURRENT_USER.name}</div>${text}</div>`;
        list.appendChild(entry);
        commentInput.value = '';
      }
    });

    modalNode.querySelector('#tmCloseBtn').addEventListener('click', () => { commitChanges(); closeTopTaskModal(); });
    modalNode.querySelector('#tmSubmitBtn').addEventListener('click', () => { commitChanges(); closeTopTaskModal(); });
    ['tmAiBtn', 'tmShareBtn', 'tmExpandBtn'].forEach(id => {
      const el = modalNode.querySelector('#' + id);
      if (el) el.addEventListener('click', () => showToast('ฟีเจอร์นี้ยังไม่พร้อมใช้งานใน prototype นี้'));
    });
    modalNode.querySelectorAll('[data-tmstub]').forEach(el => {
      el.addEventListener('click', () => showToast('ฟีเจอร์นี้ยังไม่พร้อมใช้งานใน prototype นี้'));
    });
  }

