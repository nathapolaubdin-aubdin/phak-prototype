  function closeTopTaskModal() {
    const overlay = document.getElementById('taskModalOverlay');
    const node = taskModalStack.pop();
    if (node && node.parentNode) node.parentNode.removeChild(node);
    if (taskModalStack.length > 0) {
      taskModalStack[taskModalStack.length - 1].style.display = '';
    } else {
      overlay.classList.remove('open');
    }
  }

  function openTaskModal(project, statusKey, parentInfo, level, presetTagKey, markBacklog) {
    level = level || 1;
    const overlay = document.getElementById('taskModalOverlay');
    if (project._taskCounter === undefined) project._taskCounter = project.tasks.length;
    project._taskCounter++;
    const newKey = `${project.keyPrefix || 'TOD'}-${project._taskCounter}`;
    const st = getStatus(statusKey);

    const statusOptsHtml = buildStatusOptsHtml(statusKey);

    let selectedTagKey = (presetTagKey && getTag(presetTagKey).key) || TAG_TYPES[0].key;
    let selectedPriKey = 'medium';
    let selectedStatus = statusKey;

    // ----- parent task (งานหลัก) -----
    // Preset by a "สร้างงานย่อย" button (then fixed), or picked from the dropdown in the right column: choosing a parent
    // turns this modal into a sub-task form in place (title, banner, key breadcrumb, button), clearing it turns it back.
    let parent = parentInfo ? { key: parentInfo.key, title: parentInfo.title } : null;
    const parentLocked = !!parentInfo;
    const parentStatus = () => ((parent && getTaskByKey(parent.key)) || {}).status || statusKey;
    const taskDepth = tmTaskDepth;
    const curLevel = () => (parent && !parentLocked) ? taskDepth(getTaskByKey(parent.key)) + 1 : level;
    const crumbHtml = () => tmCrumbHtml(!!parent);
    const parentBannerHtml = () => tmParentBannerHtml(parent, parentStatus());
    const keyWrapHtml = () => tmKeyWrapHtml(parent, parentStatus(), newKey, selectedStatus);
    const parentFieldInnerHtml = () => tmParentFieldHtml(parent, parentStatus(), parentLocked);
    // Any task of this project can be a parent as long as the new task stays within the 5-level limit.
    const parentListHtml = () => tmParentOptionsHtml(parent, project.tasks.filter(t => taskDepth(t) < 5));
    function refreshParentUi() {
      modalNode.querySelector('#tmCrumb').innerHTML = crumbHtml();
      modalNode.querySelector('#tmParentBanner').innerHTML = parentBannerHtml();
      modalNode.querySelector('#tmKeyWrap').innerHTML = keyWrapHtml();
      modalNode.querySelector('#tmParentField').innerHTML = parentFieldInnerHtml();
      modalNode.querySelector('#tmSubmitBtn').textContent = parent ? 'สร้างงานย่อย' : 'สร้างงาน';
      modalNode.querySelector('#tmSubtaskRow').style.display = curLevel() < 5 ? '' : 'none';
    }

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
          <span class="tm-dd-value">${tagSwatchHtml(getTag(selectedTagKey))}</span>
          ${chevSvg}
        </button>
        <div class="tm-dd-list">
          ${tagListHtml()}
        </div>
      </div>`;
    const priDdHtml = `
      <div class="tm-dd" id="tmPriDd">
        <button class="tm-dd-btn" type="button">
          <span class="tm-dd-value">${priSwatchHtml(getPriority(selectedPriKey))}</span>
          ${chevSvg}
        </button>
        <div class="tm-dd-list">
          ${PRIORITY_LEVELS.map(p => `<div class="tm-dd-opt" data-key="${p.key}">${priSwatchHtml(p)}</div>`).join('')}
        </div>
      </div>`;

    const today = new Date();
    const due = new Date(); due.setDate(due.getDate() + 6);
    const fmt = d => d.toISOString().slice(0, 10);

    const modalNode = document.createElement('div');
    modalNode.className = 'task-modal';
    modalNode.innerHTML = `
        <div class="tm-topbar">
          <span class="tm-title tm-breadcrumb" id="tmCrumb">${crumbHtml()}</span>
          <div class="tm-topbar-actions">
            <button class="tm-ai-btn" id="tmAiBtn">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6.12885 2.05958C6.82864 0.404564 9.1752 0.404676 9.87509 2.05958L11.038 4.8097C11.0674 4.87921 11.1228 4.93454 11.1923 4.96399L13.9424 6.1269C15.5976 6.82666 15.5976 9.17337 13.9424 9.87314L11.1923 11.036C11.1228 11.0655 11.0674 11.1208 11.038 11.1903L9.87509 13.9405C9.17532 15.5957 6.82862 15.5957 6.12885 13.9405L4.96595 11.1903C4.93649 11.1209 4.88116 11.0654 4.81165 11.036L2.06153 9.87314C0.406626 9.17324 0.406519 6.82668 2.06153 6.1269L4.81165 4.96399C4.88125 4.93457 4.93652 4.8793 4.96595 4.8097L6.12885 2.05958Z"/></svg>
              วิเคราะห์และสร้างงานอัตโนมัติ
            </button>
            <button class="tm-icon-btn" id="tmShareBtn" aria-label="แชร์">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="10.5" x2="15.4" y2="6.5"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/></svg>
            </button>
            <button class="tm-icon-btn" id="tmMoreBtn" aria-label="เพิ่มเติม">
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
            <div id="tmParentBanner" style="display:contents">${parentBannerHtml()}</div>
            <div class="tm-name-row">
              <span id="tmKeyWrap" style="display:contents">${keyWrapHtml()}</span>
              <input class="tm-name-input" id="tmNameInput" type="text" placeholder="ชื่องานใหม่" autocomplete="off" />
              <div class="tm-project-pill">
                <span class="av">${project.imageUrl ? `<img src="${project.imageUrl}" alt="" />` : ''}</span>
                ${project.name}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
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
                  <select class="tm-tb-select" id="tmFontSelect">
                    <option>Arial</option><option>Sukhumvit Set</option><option>Noto Sans Thai</option><option>Georgia</option>
                  </select>
                  <select class="tm-tb-select" id="tmBlockSelect">
                    <option>Paragraph</option><option>Heading 1</option><option>Heading 2</option><option>Heading 3</option>
                  </select>
                  <div class="tm-tb-divider"></div>
                  <button class="tm-tb-btn" data-fontsize="down">−</button>
                  <span style="font-size:11px; min-width:20px; text-align:center;" id="tmFontSize">14</span>
                  <button class="tm-tb-btn" data-fontsize="up">+</button>
                </div>
                <div class="tm-toolbar-row">
                  <button class="tm-tb-btn" data-cmd="bold" title="ตัวหนา"><b>B</b></button>
                  <button class="tm-tb-btn" data-cmd="italic" title="ตัวเอียง"><i>I</i></button>
                  <button class="tm-tb-btn" data-cmd="underline" title="ขีดเส้นใต้"><u>U</u></button>
                  <button class="tm-tb-btn" data-cmd="strikeThrough" title="ขีดฆ่า"><s>S</s></button>
                  <input class="tm-tb-color" type="color" id="tmBgColor" value="#2563eb" title="สีพื้นหลัง" />
                  <input class="tm-tb-color" type="color" id="tmTextColor" value="#000000" title="สีตัวอักษร" />
                  <div class="tm-tb-divider"></div>
                  <button class="tm-tb-btn" data-cmd="insertUnorderedList" title="รายการ">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>
                  </button>
                  <button class="tm-tb-btn" data-cmd="insertOrderedList" title="รายการตัวเลข">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4M4 10h2M4 14h2v2H4v2h2"/></svg>
                  </button>
                  <div class="tm-tb-divider"></div>
                  <button class="tm-tb-btn" data-cmd="justifyLeft" title="ชิดซ้าย">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="14" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
                  </button>
                  <button class="tm-tb-btn" data-cmd="justifyCenter" title="กึ่งกลาง">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="3" y1="6" x2="21" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="5" y1="18" x2="19" y2="18"/></svg>
                  </button>
                  <button class="tm-tb-btn" data-cmd="justifyRight" title="ชิดขวา">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="3" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
                  </button>
                  <button class="tm-tb-btn" data-cmd="justifyFull" title="ชิดขอบ">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                  </button>
                </div>
              </div>
              <div class="tm-editor" id="tmEditor" contenteditable="true" data-placeholder="กรอกรายละเอียด"></div>
            </div>

            <div class="tm-subtask-row" id="tmSubtaskRow" style="${curLevel() < 5 ? '' : 'display:none'}">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>
              <button class="tm-subtask-btn" id="tmSubtaskBtn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                สร้างงานย่อย
              </button>
            </div>
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
              <div class="tm-pd" id="tmParentField">${parentFieldInnerHtml()}</div>
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
              <div class="tm-date-row">
                <input class="tm-date-input" type="date" id="tmStartDate" value="${fmt(today)}" />
              </div>
            </div>

            <div class="tm-field-row">
              <span class="tm-label">กำหนดส่ง</span>
              <div class="tm-date-row">
                <input class="tm-date-input" type="date" id="tmDueDate" value="${fmt(due)}" />
              </div>
            </div>

            <div class="tm-field-row">
              <span class="tm-label">มอบหมายให้</span>
              <div style="display:flex; align-items:center; flex-wrap:wrap; gap:6px;" id="tmAssignees">${tmAssigneesHtml([])}</div>
            </div>

            <div class="tm-field-row">
              <span class="tm-label">ผู้สร้าง</span>
              <div class="tm-avatar">${avatarInitials(CURRENT_USER.name)}</div>
            </div>
          </div>
        </div>

        <div class="tm-footer">
          <button class="tm-cancel" id="tmCancelBtn">ยกเลิก</button>
          <button class="tm-submit" id="tmSubmitBtn" disabled>${parent ? 'สร้างงานย่อย' : 'สร้างงาน'}</button>
        </div>
    `;

    if (taskModalStack.length > 0) {
      taskModalStack[taskModalStack.length - 1].style.display = 'none';
    }
    overlay.appendChild(modalNode);
    taskModalStack.push(modalNode);
    overlay.classList.add('open');

    // Statuses edited from the ⋯ menu (manager modal): the picked status may have been renamed, recoloured or
    // deleted — remap it (to where its tasks were moved) and redraw the status buttons in place, keeping the form.
    function onStatusesSaved(e) {
      if (!modalNode.isConnected) { document.removeEventListener('statuses-saved', onStatusesSaved); return; }
      selectedStatus = e.detail.resolve(selectedStatus);
      if (!KAN_STATUSES.some(s => s.key === selectedStatus)) selectedStatus = KAN_STATUSES[0].key;
      modalNode.querySelector('#tmStatusGroup').innerHTML = buildStatusOptsHtml(selectedStatus);
      const kb = modalNode.querySelector('#tmKeyBadge');
      if (kb) kb.style.cssText = keyBadgeStyle(selectedStatus);
      refreshParentUi();
    }
    document.addEventListener('statuses-saved', onStatusesSaved);
    const nameInput = modalNode.querySelector('#tmNameInput');
    const submitBtn = modalNode.querySelector('#tmSubmitBtn');
    const editor = modalNode.querySelector('#tmEditor');
    const assigneesWrap = modalNode.querySelector('#tmAssignees');
    const chosenAssignees = [];

    nameInput.focus();
    nameInput.addEventListener('input', () => {
      submitBtn.disabled = !nameInput.value.trim();
    });

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

    // ----- parent task picker -----
    tmWireParentPicker(modalNode, parentListHtml, (t) => {
      parent = t ? { key: t.key, title: t.title } : null;
      refreshParentUi();
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
    });

    modalNode.querySelectorAll('.tm-tb-btn[data-cmd]').forEach(btn => {
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        document.execCommand(btn.dataset.cmd, false, null);
        editor.focus();
      });
    });
    modalNode.querySelector('#tmTextColor').addEventListener('input', (e) => {
      document.execCommand('foreColor', false, e.target.value);
      editor.focus();
    });
    modalNode.querySelector('#tmBgColor').addEventListener('input', (e) => {
      document.execCommand('hiliteColor', false, e.target.value);
      editor.focus();
    });
    modalNode.querySelector('#tmFontSelect').addEventListener('change', (e) => {
      document.execCommand('fontName', false, e.target.value);
      editor.focus();
    });
    modalNode.querySelector('#tmBlockSelect').addEventListener('change', (e) => {
      const map = { 'Paragraph': 'p', 'Heading 1': 'h1', 'Heading 2': 'h2', 'Heading 3': 'h3' };
      document.execCommand('formatBlock', false, map[e.target.value] || 'p');
      editor.focus();
    });
    let fontPx = 14;
    modalNode.querySelectorAll('.tm-tb-btn[data-fontsize]').forEach(btn => {
      btn.addEventListener('click', () => {
        fontPx = Math.max(10, Math.min(32, fontPx + (btn.dataset.fontsize === 'up' ? 2 : -2)));
        modalNode.querySelector('#tmFontSize').textContent = fontPx;
        editor.style.fontSize = fontPx + 'px';
      });
    });

    tmWireAssignees(assigneesWrap, chosenAssignees);

    modalNode.querySelector('#tmCloseBtn').addEventListener('click', closeTopTaskModal);
    modalNode.querySelector('#tmCancelBtn').addEventListener('click', closeTopTaskModal);

    ['tmAiBtn', 'tmShareBtn', 'tmMoreBtn', 'tmExpandBtn'].forEach(id => {
      const el = modalNode.querySelector('#' + id);
      if (el) el.addEventListener('click', () => showToast('ฟีเจอร์นี้ยังไม่พร้อมใช้งานใน prototype นี้'));
    });
    const subtaskBtn = modalNode.querySelector('#tmSubtaskBtn');
    if (subtaskBtn) {
      subtaskBtn.addEventListener('click', () => {
        const parentTitle = nameInput.value.trim() || newKey;
        openTaskModal(project, selectedStatus, { key: newKey, title: parentTitle }, curLevel() + 1);
      });
    }
    modalNode.querySelectorAll('[data-tmstub]').forEach(el => {
      el.addEventListener('click', () => showToast('ฟีเจอร์นี้ยังไม่พร้อมใช้งานใน prototype นี้'));
    });

    submitBtn.addEventListener('click', () => {
      const name = nameInput.value.trim();
      if (!name) return;
      const rawText = editor.innerText.trim();
      const descLines = rawText ? rawText.split('\n').filter(l => l.trim()) : ['(ไม่มีรายละเอียด)'];
      const dueVal = modalNode.querySelector('#tmDueDate').value;
      const startVal = modalNode.querySelector('#tmStartDate').value;
      const d = dueVal ? new Date(dueVal) : new Date();
      const sD = startVal ? new Date(startVal) : new Date();

      project.tasks.push({
        title: name,
        key: newKey,
        status: selectedStatus,
        tagKey: selectedTagKey,
        priorityKey: selectedPriKey,
        date: formatThaiDate(d),
        startDate: sD, dueDate: d,
        desc: descLines,
        progress: null,
        progressLabel: '',
        avatars: chosenAssignees,
        extraCount: 0,
        comments: null,
        parentKey: parent ? parent.key : null,
        backlog: !!markBacklog
      });

      closeTopTaskModal();
      refreshCurrentView();
      notifyTasksChanged();
      showToast(markBacklog ? `เพิ่มงาน ${newKey} ลงงานค้างแล้ว` : `สร้างงาน ${newKey} สำเร็จ`);
    });
  }


