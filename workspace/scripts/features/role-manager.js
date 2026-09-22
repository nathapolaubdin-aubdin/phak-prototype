  // ---------- Role manager (จัดการบทบาทสมาชิก) ----------
  // Owner/Manager/Staff are the 3 base roles (can't be deleted); more can be added. Owner is also "locked":
  // its name, description, colour and permissions can't be edited, matching "เจ้าของทำได้ทุกอย่างเสมอ" from the earlier analysis.
  const RM_PERM_GROUPS = [
    { title: 'งาน', perms: [
      { key: 'tasks.own', label: 'สร้าง/แก้ไขงานของตัวเอง', desc: 'รวมถึงงานที่ถูกมอบหมายให้ตัวเอง' },
      { key: 'tasks.others', label: 'แก้ไข/ลบงานของผู้อื่น', desc: 'งานที่ตัวเองไม่ได้สร้างหรือไม่ถูกมอบหมาย' },
      { key: 'tasks.assign', label: 'มอบหมายงานให้ผู้อื่น' }
    ]},
    { title: 'โครงสร้างบอร์ด', perms: [
      { key: 'board.status', label: 'จัดการสถานะ' },
      { key: 'board.type', label: 'จัดการประเภท' },
      { key: 'board.priority', label: 'จัดการความสำคัญ' }
    ]},
    { title: 'สมาชิก', perms: [
      { key: 'members.invite', label: 'เชิญสมาชิกใหม่เข้าโปรเจค' },
      { key: 'members.remove', label: 'ลบสมาชิกออกจากโปรเจค' },
      { key: 'members.roles', label: 'จัดการบทบาทสมาชิก', desc: 'เปิดหน้าต่างนี้และแก้ไขสิทธิ์' }
    ]},
    { title: 'โปรเจค', perms: [
      { key: 'project.edit', label: 'แก้ไขข้อมูลโปรเจค', desc: 'ชื่อ, ไอคอน' },
      { key: 'project.archive', label: 'ย้ายไป “โปรเจคที่ไม่ Active”' },
      { key: 'project.delete', label: 'ลบโปรเจคถาวร' }
    ]}
  ];
  const RM_ALL_ON = Object.fromEntries(RM_PERM_GROUPS.flatMap(g => g.perms).map(p => [p.key, true]));
  const RM_STAFF_PERMS = () => Object.fromEntries(Object.keys(RM_ALL_ON).map(k => [k, k === 'tasks.own']));
  const RM_NAME_MAX = 24;
  const RM_DESC_MAX = 60;
  // Default matrix: Owner = everything · Manager = everything except deleting the project ·
  // Staff = only their own tasks. Edited copies are kept here (shared across projects, like KAN_STATUSES/TAG_TYPES).
  let ROLES = [
    { key: 'owner', label: 'Owner', desc: 'เจ้าของโปรเจค', color: '#911EF2', locked: true, perms: { ...RM_ALL_ON } },
    { key: 'manager', label: 'Manager', desc: 'หัวหน้างาน', color: '#378ADD', locked: false, perms: { ...RM_ALL_ON, 'project.delete': false } },
    { key: 'staff', label: 'Staff', desc: 'พนักงาน', color: '#606060', locked: false, perms: RM_STAFF_PERMS() }
  ];
  // Roles a member can actually be assigned to from "จัดการสมาชิก" (excludes the locked Owner role — there's no
  // "transfer ownership" flow here, so granting it through a plain role dropdown would be too easy to do by accident).
  function rmAssignableRoles() { return ROLES.filter(r => !r.locked); }
  function rmDefaultRoleLabel() { const r = rmAssignableRoles()[0]; return r ? r.label : ((ROLES[0] || {}).label || ''); }
  // project.members[].role only ever stores a role's *label* as a plain string (set at project-creation time, or from
  // "จัดการสมาชิก"), not a stable key. Counting/migrating on delete has to match against that label, snapshotted at
  // the moment the manager opens so an in-progress rename here doesn't change who counts as "currently holding" a
  // role. ROLES itself is shared across every project (like KAN_STATUSES/TAG_TYPES) — but who *holds* a role is not,
  // so this counts (and, on delete, migrates) only within the one project the manager was opened from.
  function rmMemberCount(project, label) {
    if (!project || !label) return 0;
    const norm = label.trim().toLowerCase();
    return (project.members || []).filter(m => (m.role || '').trim().toLowerCase() === norm).length;
  }

  function openRoleManager(project, opts = {}) {
    if (!project || document.getElementById('rmOverlay')) return;
    const draft = ROLES.map(r => ({ ...r, perms: { ...r.perms } }));
    const initialSig = JSON.stringify(draft);
    const committedLabels = Object.fromEntries(ROLES.map(r => [r.key, r.label]));
    const removed = {};   // deleted role key -> destination role key (real members are migrated only on Save, like status/type)
    let selected = (draft.find(r => r.key === 'manager') || draft[0]).key;   // Owner is locked; land on a role you'd actually come here to change.
    let confirmDeleteKey = null;
    let seq = 0;

    const byKey = k => draft.find(r => r.key === k);
    const resolve = k => { let guard = 0; while (removed[k] && guard++ < 50) k = removed[k]; return k; };
    const pendingCount = role => {
      let n = rmMemberCount(project, committedLabels[role.key] ?? role.label);
      Object.keys(removed).forEach(rk => { if (resolve(rk) === role.key) n += rmMemberCount(project, committedLabels[rk]); });
      return n;
    };
    const nameError = r => {
      const v = r.label.trim();
      if (!v) return 'กรุณาตั้งชื่อบทบาทให้ครบทุกบทบาท';
      if (draft.some(o => o !== r && o.label.trim().toLowerCase() === v.toLowerCase())) return `ชื่อ “${v}” ถูกใช้แล้ว`;
      return '';
    };

    const overlay = document.createElement('div');
    overlay.className = 'rm-overlay';
    overlay.id = 'rmOverlay';
    overlay.innerHTML = `
      <div class="rm-modal" role="dialog" aria-modal="true" aria-labelledby="rmTitle" tabindex="-1">
        <div class="rm-topbar">
          <img src="${PROJ_MENU_ICONS.team}" alt="">
          <span class="rm-title" id="rmTitle">จัดการบทบาทสมาชิก</span>
        </div>
        <div class="rm-body">
          <div class="rm-roles-col">
            <div class="rm-roles" id="rmRoles" role="listbox" aria-label="บทบาท"></div>
            <button type="button" class="rm-add-role" id="rmAddRole">+ เพิ่มบทบาท</button>
          </div>
          <div class="rm-perms" id="rmPerms"></div>
        </div>
        <p class="rm-note">ตัวอย่างการตั้งค่าสิทธิ์ต่อบทบาท — ในต้นแบบนี้การเปิด/ปิดที่นี่ยังไม่ไปจำกัดปุ่มหรือเมนูอื่นจริง เป็นแค่หน้าจัดการเพื่อสาธิตรูปแบบ · ชื่อ สี และสิทธิ์ของบทบาทใช้ร่วมกันทุกโปรเจค แต่จำนวนคนนับเฉพาะสมาชิกในโปรเจคนี้</p>
        <div class="rm-footer">
          <button type="button" class="rm-cancel" id="rmCancel">ยกเลิก</button>
          <span class="rm-err" id="rmErr" role="alert"></span>
          <button type="button" class="rm-save" id="rmSave">บันทึก</button>
        </div>
      </div>`;
    (document.querySelector('.app') || document.body).appendChild(overlay);

    const modal = overlay.querySelector('.rm-modal');
    const rolesWrap = overlay.querySelector('#rmRoles');
    const permsWrap = overlay.querySelector('#rmPerms');
    const errEl = overlay.querySelector('#rmErr');
    const saveBtn = overlay.querySelector('#rmSave');
    const isDirty = () => JSON.stringify(draft) !== initialSig;

    function renderRoles() {
      rolesWrap.innerHTML = draft.map(r => `
        <button type="button" class="rm-role-btn${r.key === selected ? ' active' : ''}${nameError(r) ? ' invalid' : ''}" data-role="${r.key}" role="option" aria-selected="${r.key === selected}">
          <span class="rm-role-dot" style="background:${r.color}">${smEsc((r.label.trim()[0] || '?').toUpperCase())}</span>
          <span class="rm-role-text"><span class="rm-role-name">${smEsc(r.label || 'บทบาทใหม่')}</span><span class="rm-role-sub">${smEsc(r.desc)}</span></span>
        </button>`).join('');
    }
    // The slot at the bottom of the edit block: Owner's locked note, a "can't delete the last non-Owner role"
    // note, the plain delete link, or — once clicked — a confirm step (with a destination picker if real members
    // currently hold this role, exactly like deleting a status/type that tasks are using).
    function dangerZoneHtml(role, locked) {
      if (locked) return `<p class="rm-locked-hint">Owner เป็นค่าคงที่ — แก้ชื่อ รายละเอียด สี และสิทธิ์ไม่ได้</p>`;
      const confirming = confirmDeleteKey === role.key;
      if (!confirming && draft.filter(r => !r.locked).length <= 1) {
        return `<p class="rm-locked-hint">ต้องมีอย่างน้อย 1 บทบาทนอกเหนือจาก Owner เสมอ จึงลบบทบาทนี้ไม่ได้</p>`;
      }
      const n = pendingCount(role);
      if (!confirming) {
        return `
          <div class="rm-del-row">
            <span class="rm-del-count"><b>${n}</b> <span>คนอยู่ในบทบาทนี้</span></span>
            <button type="button" class="rm-del-role" id="rmDelRole"><span>ลบบทบาทนี้</span><img src="${PROJ_MENU_ICONS.trash}" alt=""></button>
          </div>`;
      }
      if (n === 0) {
        return `
          <div class="rm-del-confirm">
            <div class="sm-confirm-text">ลบบทบาท “${smEsc(role.label)}” ใช่ไหม — ตอนนี้ไม่มีใครอยู่ในบทบาทนี้</div>
            <button type="button" class="sm-btn-danger" id="rmConfirmDel">ลบบทบาท</button>
            <button type="button" class="sm-btn-ghost" id="rmCancelDel">ยกเลิก</button>
          </div>`;
      }
      const others = draft.filter(r => r !== role && !r.locked);
      return `
        <div class="rm-del-confirm">
          <div class="sm-confirm-text">มี <b>${n}</b> คนอยู่ในบทบาท “${smEsc(role.label)}” ย้ายไปที่
            <select class="sm-select" id="rmDestSelect" aria-label="บทบาทปลายทาง">
              ${others.map(o => `<option value="${o.key}">${smEsc(o.label || 'บทบาทใหม่')}</option>`).join('')}
            </select>
          </div>
          <button type="button" class="sm-btn-danger" id="rmConfirmDel">ลบบทบาท</button>
          <button type="button" class="sm-btn-ghost" id="rmCancelDel">ยกเลิก</button>
        </div>`;
    }
    function editHeadHtml(role) {
      const locked = role.locked;
      return `
        <div class="rm-edit">
          <div class="rm-edit-field">
            <label class="rm-edit-label" for="rmNameInput">ชื่อบทบาท</label>
            <input class="rm-edit-name" id="rmNameInput" type="text" maxlength="${RM_NAME_MAX}" value="${smEsc(role.label)}" placeholder="เช่น Designer" ${locked ? 'disabled' : ''}>
          </div>
          <div class="rm-edit-field">
            <div class="rm-edit-label-row">
              <label class="rm-edit-label" for="rmDescInput">รายละเอียด (ไม่บังคับ)</label>
              <span class="rm-edit-count" id="rmDescCount">${role.desc.length}/${RM_DESC_MAX}</span>
            </div>
            <input class="rm-edit-desc" id="rmDescInput" type="text" maxlength="${RM_DESC_MAX}" value="${smEsc(role.desc)}" placeholder="บทบาทนี้คืออะไร" ${locked ? 'disabled' : ''}>
          </div>
          <div class="rm-edit-field">
            <span class="rm-edit-label">สี</span>
            <div class="rm-edit-colors" id="rmColors">
              ${SM_COLORS.map(c => `<button type="button" class="rm-color-swatch${c === role.color ? ' sel' : ''}" data-color="${c}" style="background:${c}" aria-label="สี ${c}" ${locked ? 'disabled' : ''}></button>`).join('')}
              <label class="rm-color-swatch rm-color-custom" title="กำหนดสีเอง">+<input type="color" value="${role.color}" id="rmColorCustom" ${locked ? 'disabled' : ''}></label>
            </div>
          </div>
          ${dangerZoneHtml(role, locked)}
        </div>`;
    }
    function permsListHtml(role) {
      return RM_PERM_GROUPS.map(g => `
        <div class="rm-perm-group">
          <p class="rm-perm-group-title">${smEsc(g.title)}</p>
          <div class="rm-perm-list">
            ${g.perms.map(p => {
              const on = role.perms[p.key];
              return `
              <div class="rm-perm-row">
                <div><div class="rm-perm-label">${smEsc(p.label)}</div>${p.desc ? `<div class="rm-perm-desc">${smEsc(p.desc)}</div>` : ''}</div>
                <button type="button" class="rm-switch${on ? ' on' : ''}${role.locked ? ' locked' : ''}" data-perm="${p.key}" role="switch" aria-checked="${on}" aria-label="${smEsc(p.label)}" ${role.locked ? 'disabled title="เจ้าของมีสิทธิ์ทุกอย่างเสมอ"' : ''}><span class="knob"></span></button>
              </div>`;
            }).join('')}
          </div>
        </div>`).join('');
    }
    function renderPerms() {
      const role = byKey(selected);
      permsWrap.innerHTML = editHeadHtml(role) + permsListHtml(role);
    }
    function syncFooter() {
      const err = draft.map(nameError).find(Boolean) || '';
      errEl.textContent = err;
      saveBtn.disabled = !!err || !isDirty();
    }
    function sync() { renderRoles(); renderPerms(); syncFooter(); }

    rolesWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('.rm-role-btn');
      if (!btn || btn.dataset.role === selected) return;
      selected = btn.dataset.role;
      confirmDeleteKey = null;
      sync();
    });

    // Typing in the name/description fields only redraws the left list (so focus in these fields never drops).
    permsWrap.addEventListener('input', (e) => {
      const role = byKey(selected);
      if (e.target.id === 'rmNameInput') role.label = e.target.value;
      else if (e.target.id === 'rmDescInput') {
        role.desc = e.target.value;
        overlay.querySelector('#rmDescCount').textContent = `${role.desc.length}/${RM_DESC_MAX}`;
      } else if (e.target.id === 'rmColorCustom') {
        role.color = e.target.value;
        overlay.querySelectorAll('#rmColors .rm-color-swatch[data-color]').forEach(b => b.classList.toggle('sel', b.dataset.color === role.color));
      } else return;
      renderRoles();
      syncFooter();
    });
    permsWrap.addEventListener('click', (e) => {
      const role = byKey(selected);
      const sw = e.target.closest('.rm-switch');
      if (sw) {
        if (sw.disabled) return;
        role.perms[sw.dataset.perm] = !role.perms[sw.dataset.perm];
        sync();
        return;
      }
      const colorBtn = e.target.closest('.rm-color-swatch[data-color]');
      if (colorBtn) { role.color = colorBtn.dataset.color; renderRoles(); renderPerms(); syncFooter(); return; }
      function deleteSelected(destKey) {
        if (destKey) removed[role.key] = destKey;
        const i = draft.indexOf(role);
        draft.splice(i, 1);
        confirmDeleteKey = null;
        selected = (draft[i] || draft[i - 1] || draft[0]).key;
        sync();
      }
      if (e.target.closest('#rmDelRole')) { confirmDeleteKey = role.key; renderPerms(); syncFooter(); return; }
      if (e.target.closest('#rmConfirmDel')) {
        const dest = overlay.querySelector('#rmDestSelect');   // absent when nobody holds this role — nothing to migrate
        deleteSelected(dest ? dest.value : null);
        return;
      }
      if (e.target.closest('#rmCancelDel')) { confirmDeleteKey = null; renderPerms(); syncFooter(); return; }
    });

    function addRole() {
      const color = SM_COLORS[draft.length % SM_COLORS.length];
      const role = {
        key: 'role_' + Date.now().toString(36) + (seq++), label: '', desc: '', color, locked: false,
        perms: RM_STAFF_PERMS()
      };
      draft.push(role);
      selected = role.key;
      confirmDeleteKey = null;
      sync();
      const inp = overlay.querySelector('#rmNameInput');
      if (inp) inp.focus();
    }
    overlay.querySelector('#rmAddRole').addEventListener('click', addRole);

    function close() {
      document.removeEventListener('keydown', onKey);
      overlay.remove();
      if (opts.returnFocusTo && opts.returnFocusTo.isConnected) opts.returnFocusTo.focus();
    }
    function onKey(e) {
      if (e.key !== 'Escape') return;
      if (confirmDeleteKey) { confirmDeleteKey = null; renderPerms(); syncFooter(); return; }
      if (!isDirty()) close();
    }
    function save() {
      if (saveBtn.disabled) return;
      // Keep this project's real members in sync: migrate holders of a deleted role to its chosen destination
      // (chasing multi-hop chains, same as KAN_STATUSES/TAG_TYPES), AND carry forward a plain rename (no delete
      // involved) — both matched and rewritten by label, since that's what project.members stores. Scoped to this
      // project only — other projects' members keep whatever role string they already had.
      (project.members || []).forEach(m => {
        const cur = (m.role || '').trim().toLowerCase();
        const entry = Object.entries(committedLabels).find(([, l]) => l.trim().toLowerCase() === cur);
        if (!entry) return;
        const finalRole = draft.find(r => r.key === resolve(entry[0]));
        if (finalRole && finalRole.label !== m.role) m.role = finalRole.label;
      });
      ROLES = draft.map(r => ({ ...r, label: r.label.trim(), desc: r.desc.trim() }));
      close();
      showToast('บันทึกบทบาทแล้ว');
    }
    overlay.querySelector('#rmCancel').addEventListener('click', close);
    saveBtn.addEventListener('click', save);
    overlay.addEventListener('mousedown', (e) => { if (e.target === overlay && !isDirty()) close(); });
    document.addEventListener('keydown', onKey);

    sync();
    modal.focus();
  }

