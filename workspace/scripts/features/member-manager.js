  // ---------- Member manager (จัดการสมาชิก) ----------
  // Unlike statuses/types/roles, membership is genuinely per-project (project.members), so this opens against
  // whichever project's board the gear button was clicked from, not a shared global list.
  // "Dynamic with tasks": counted live from that project's real task assignees (task.avatars), so it moves the
  // moment someone is added/removed via the "มอบหมายให้" picker elsewhere — never a stored/stale number.
  function mmTaskCount(project, name) {
    return (project.tasks || []).filter(t => t.avatars && t.avatars.includes(name)).length;
  }

  function openMemberManager(project, opts = {}) {
    if (!project || document.getElementById('mmOverlay')) return;
    const draft = (project.members || []).map(m => ({ ...m }));
    const initialSig = JSON.stringify(draft);
    let confirmDeleteIdx = null;

    const isDirty = () => JSON.stringify(draft) !== initialSig;

    const overlay = document.createElement('div');
    overlay.className = 'sm-overlay';
    overlay.id = 'mmOverlay';
    overlay.innerHTML = `
      <div class="sm-modal" role="dialog" aria-modal="true" aria-labelledby="mmTitle" tabindex="-1">
        <div class="sm-topbar">
          <img src="${PROJ_MENU_ICONS.team}" alt="">
          <span class="sm-title" id="mmTitle">จัดการสมาชิก</span>
        </div>
        <div class="sm-body">
          <p class="sm-label">สมาชิก</p>
          <div class="search-wrap">
            <input class="mm-search-input" id="mmSearchInput" type="text" placeholder="กรอกอีเมล ชื่อพนักงาน หรือ กลุ่ม" autocomplete="off">
            <div class="member-suggestions" id="mmSuggestions"></div>
          </div>
          <p class="sm-label" style="margin-top:8px;">รายชื่อสมาชิกในโปรเจค “${smEsc(project.name || '')}”</p>
          <div class="sm-list" id="mmList"></div>
        </div>
        <div class="sm-footer">
          <button type="button" class="sm-cancel" id="mmCancel">ยกเลิก</button>
          <span class="sm-err" id="mmErr" role="alert"></span>
          <button type="button" class="sm-save" id="mmSave">บันทึก</button>
        </div>
      </div>`;
    (document.querySelector('.app') || document.body).appendChild(overlay);

    const modal = overlay.querySelector('.sm-modal');
    const list = overlay.querySelector('#mmList');
    const saveBtn = overlay.querySelector('#mmSave');
    const searchInput = overlay.querySelector('#mmSearchInput');
    const suggBox = overlay.querySelector('#mmSuggestions');

    // The project creator/Owner isn't stored in project.members (same convention "สร้างโปรเจคใหม่" already uses) —
    // shown as a fixed first row here too, not editable or removable from this screen.
    function ownerRowHtml() {
      const n = mmTaskCount(project, CURRENT_USER.name);
      return `
        <div class="mm-row">
          <div class="mm-avatar" style="background:linear-gradient(135deg,#F55A48,#F5B948);">${avatarInitials(CURRENT_USER.name)}</div>
          <div class="mm-info"><span class="mm-name">${smEsc(CURRENT_USER.name)}</span><span class="mm-sub">${smEsc(CURRENT_USER.email)}</span></div>
          <span class="mm-task-count"><b>${n}</b> งาน</span>
          <span class="mm-owner-label">Owner</span>
        </div>`;
    }
    function memberRowHtml(m, i) {
      if (confirmDeleteIdx === i) {
        return `
          <div class="mm-row mm-row-confirm" data-idx="${i}">
            <div class="sm-confirm-text">นำ “${smEsc(m.name)}” ออกจากโปรเจคใช่ไหม?</div>
            <button type="button" class="sm-btn-danger" data-role="confirm-del">ลบสมาชิก</button>
            <button type="button" class="sm-btn-ghost" data-role="cancel-del">ยกเลิก</button>
          </div>`;
      }
      const isTeam = m.type === 'team';
      const avatar = isTeam
        ? `<div class="mm-avatar" style="background:${tmAsColor(m)}"><img src="${PROJ_MENU_ICONS.team}" alt=""></div>`
        : `<div class="mm-avatar" style="background:${tmAsColor(tmAssigneeEntry(m.name))}">${avatarInitials(m.name)}</div>`;
      const sub = isTeam ? `${m.count || 0} คน` : (tmAssigneeEntry(m.name).email || '');
      const n = mmTaskCount(project, m.name);
      const roles = rmAssignableRoles();
      const roleKnown = roles.some(r => r.label === m.role);
      return `
        <div class="mm-row" data-idx="${i}">
          ${avatar}
          <div class="mm-info"><span class="mm-name">${smEsc(m.name)}</span><span class="mm-sub">${smEsc(sub)}</span></div>
          <span class="mm-task-count"><b>${n}</b> งาน</span>
          <select class="mm-role-select" data-role="role" aria-label="บทบาทของ ${smEsc(m.name)}">
            ${!roleKnown && m.role ? `<option value="${smEsc(m.role)}" selected>${smEsc(m.role)}</option>` : ''}
            ${roles.map(r => `<option value="${smEsc(r.label)}" ${r.label === m.role ? 'selected' : ''}>${smEsc(r.label)}</option>`).join('')}
          </select>
          <button type="button" class="mm-del" data-role="del" aria-label="ลบ ${smEsc(m.name)} ออกจากโปรเจค"><img src="${PROJ_MENU_ICONS.trash}" alt=""></button>
        </div>`;
    }
    function render() {
      list.innerHTML = ownerRowHtml() + (draft.length
        ? draft.map(memberRowHtml).join('')
        : `<p class="mm-empty">ยังไม่มีสมาชิกอื่นในโปรเจคนี้</p>`);
      saveBtn.disabled = !isDirty();
    }

    list.addEventListener('click', (e) => {
      const row = e.target.closest('.mm-row[data-idx]');
      if (!row) return;
      const i = +row.dataset.idx;
      if (e.target.closest('[data-role="del"]')) { confirmDeleteIdx = i; render(); return; }
      if (e.target.closest('[data-role="confirm-del"]')) { draft.splice(i, 1); confirmDeleteIdx = null; render(); return; }
      if (e.target.closest('[data-role="cancel-del"]')) { confirmDeleteIdx = null; render(); return; }
    });
    list.addEventListener('change', (e) => {
      const sel = e.target.closest('[data-role="role"]');
      if (!sel) return;
      const row = e.target.closest('.mm-row[data-idx]');
      draft[+row.dataset.idx].role = sel.value;
      saveBtn.disabled = !isDirty();
    });

    // Search + suggestions, same component/behaviour as the "สมาชิก" step in the "สร้างโปรเจคใหม่" modal: type to filter
    // DIRECTORY, click a row to add (already-added names and the Owner are excluded from the results).
    function suggestionsHtml(query) {
      const q = query.trim().toLowerCase();
      const already = new Set([CURRENT_USER.name, ...draft.map(m => m.name)]);
      let results = DIRECTORY.filter(d => !already.has(d.name));
      if (q) results = results.filter(d => d.name.toLowerCase().includes(q) || (d.email && d.email.toLowerCase().includes(q)));
      if (!results.length) return `<div class="sugg-empty">ไม่พบชื่อ อีเมล หรือกลุ่มที่ตรงกัน</div>`;
      return results.slice(0, 8).map(d => d.type === 'team'
        ? `<div class="sugg-row" data-name="${smEsc(d.name)}">
            <div class="sugg-avatar team"><img src="${PROJ_MENU_ICONS.team}" alt=""></div>
            <div class="sugg-text"><span class="sname">${smEsc(d.name)}</span><span class="ssub">กลุ่ม · ${d.count} คน</span></div>
          </div>`
        : `<div class="sugg-row" data-name="${smEsc(d.name)}">
            <div class="sugg-avatar">${avatarInitials(d.name)}</div>
            <div class="sugg-text"><span class="sname">${smEsc(d.name)}</span><span class="ssub">${smEsc(d.email || '')}</span></div>
          </div>`
      ).join('');
    }
    function renderSuggestions() {
      suggBox.innerHTML = suggestionsHtml(searchInput.value);
      suggBox.classList.add('open');
    }
    searchInput.addEventListener('focus', renderSuggestions);
    searchInput.addEventListener('input', renderSuggestions);
    suggBox.addEventListener('click', (e) => {
      const row = e.target.closest('.sugg-row');
      if (!row) return;
      const entry = DIRECTORY.find(d => d.name === row.dataset.name);
      if (!entry) return;
      draft.push(entry.type === 'team'
        ? { type: 'team', name: entry.name, count: entry.count, role: rmDefaultRoleLabel() }
        : { name: entry.name, role: rmDefaultRoleLabel() });
      searchInput.value = '';
      suggBox.classList.remove('open');
      render();
    });
    function onOutsideClick(e) { if (!e.target.closest('.search-wrap')) suggBox.classList.remove('open'); }
    document.addEventListener('click', onOutsideClick);

    function close() {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onOutsideClick);
      overlay.remove();
      if (opts.returnFocusTo && opts.returnFocusTo.isConnected) opts.returnFocusTo.focus();
    }
    function onKey(e) {
      if (e.key !== 'Escape') return;
      if (suggBox.classList.contains('open')) { suggBox.classList.remove('open'); return; }
      if (confirmDeleteIdx !== null) { confirmDeleteIdx = null; render(); return; }
      if (!isDirty()) close();
    }
    function save() {
      if (saveBtn.disabled) return;
      project.members = draft;
      close();
      refreshCurrentView();
      showToast('บันทึกสมาชิกแล้ว');
    }
    overlay.querySelector('#mmCancel').addEventListener('click', close);
    saveBtn.addEventListener('click', save);
    overlay.addEventListener('mousedown', (e) => { if (e.target === overlay && !isDirty()) close(); });
    document.addEventListener('keydown', onKey);

    render();
    modal.focus();
  }

  let taskModalStack = [];

