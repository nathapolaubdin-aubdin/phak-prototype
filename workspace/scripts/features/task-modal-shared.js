  function avatarInitials(name) {
    return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  function hexA(hex, alpha) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // Blend a hex colour toward another hex (t = 0 keeps `hex`, t = 1 becomes `target`).
  function mixHex(hex, target, t) {
    const p = s => { const h = s.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.substring(i, i + 2), 16)); };
    const [r1, g1, b1] = p(hex);
    const [r2, g2, b2] = p(target);
    const m = (a, b) => Math.round(a + (b - a) * t).toString(16).padStart(2, '0');
    return `#${m(r1, r2)}${m(g1, g2)}${m(b1, b2)}`;
  }

  const KAN_STATUSES = [
    { key: 'todo', label: 'รอเริ่ม', color: '#6E6E6E', cardBg: 'transparent', count: 13, icon: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/>' },
    { key: 'progress', label: 'กำลังทำ', color: '#378ADD', cardBg: '#C8D7FF', count: 24, icon: '<path d="M13 2 3 14h7l-1 8 11-14h-7z"/>' },
    { key: 'review', label: 'รอตรวจ', color: '#911EF2', cardBg: '#EDD8FF', count: 96, icon: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>' },
    { key: 'done', label: 'เสร็จสิ้น', color: '#25A767', cardBg: '#E8FFF4', count: 108, icon: '<circle cx="12" cy="12" r="9"/><polyline points="8 12 11 15 16 9"/>' }
  ];

  function getStatus(key) {
    return KAN_STATUSES.find(s => s.key === key) || KAN_STATUSES[0];
  }
  // The last status in the list is the "done" one (drives subtask progress); order is editable in the status manager.
  // Status buttons of the create / edit task modals (also re-used when the status list is edited while a modal is open).
  function buildStatusOptsHtml(activeKey) {
    return KAN_STATUSES.map(s => `
      <button class="tm-status-opt ${s.key === activeKey ? 'active' : ''}" data-status="${s.key}"
        style="${s.key === activeKey ? `background:${s.color};` : ''}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${s.icon}</svg>
        ${s.label}
      </button>
    `).join('');
  }
  // ----- parent task (งานหลัก) pieces shared by the create and edit task modals -----
  function tmTaskDepth(t) { let d = 1, cur = t, guard = 0; while (cur && cur.parentKey && guard++ < 10) { cur = getTaskByKey(cur.parentKey); d++; } return d; }
  function tmTint(statusKey) {
    const s = getStatus(statusKey);
    return { bg: s.cardBg && s.cardBg !== 'transparent' ? s.cardBg : '#D9D9D9', fg: s.color };
  }
  // Any change to a task (edit, re-parent, new sub-task) is announced so every open task modal — including the ones
  // stacked underneath — can redraw what it shows about other tasks (its sub-task list and progress).
  function notifyTasksChanged() { document.dispatchEvent(new CustomEvent('tasks-changed')); }
  // ----- assignee picker ("มอบหมายให้"), shared by the create and edit task modals -----
  const TM_AS_COLORS = ['#F55A48', '#5981EC', '#911EF2', '#F5C518', '#25A767'];
  const TM_AS_TEAM_COLORS = ['#5981EC', '#E5484D', '#25A767', '#F0883E'];
  const tmAsHash = s => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  function tmAssigneeDirectory() { return [{ type: 'person', name: CURRENT_USER.name, email: CURRENT_USER.email }].concat(DIRECTORY); }
  function tmAssigneeEntry(name) { return tmAssigneeDirectory().find(d => d.name === name) || { type: 'person', name }; }
  function tmAsColor(entry) {
    if (entry.type === 'team') return TM_AS_TEAM_COLORS[DIRECTORY.filter(d => d.type === 'team').findIndex(d => d.name === entry.name) % TM_AS_TEAM_COLORS.length] || TM_AS_TEAM_COLORS[0];
    return TM_AS_COLORS[tmAsHash(entry.name) % TM_AS_COLORS.length];
  }
  // 24px chip shown in the modal's assignee row
  function tmAssigneeChipHtml(name) {
    const e = tmAssigneeEntry(name);
    if (e.type === 'team') return `<div class="tm-avatar team" title="${smEsc(name)}" style="background:${tmAsColor(e)}"><img src="${PROJ_MENU_ICONS.team}" alt=""></div>`;
    return `<div class="tm-avatar" title="${smEsc(name)}" style="background:${tmAsColor(e)}">${avatarInitials(name)}</div>`;
  }
  function tmAssigneesHtml(names) {
    return names.map(tmAssigneeChipHtml).join('') +
      `<button type="button" class="tm-avatar-add" id="tmAddAssignee" data-assignee-trigger aria-haspopup="listbox" aria-expanded="false" title="เพิ่มผู้รับผิดชอบ">+</button>`;
  }
  function tmAssigneeMenuHtml(selected) {
    const sel = new Set(selected);
    const check = '<svg class="tm-as-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><polyline points="20 6 9 17 4 12"/></svg>';
    return tmAssigneeDirectory().map(d => {
      const on = sel.has(d.name);
      const dots = d.type === 'team'
        ? `<div class="tm-as-dots">${Array.from({ length: Math.min(d.count || 0, 7) }, (_, i) => `<span style="background:${TM_AS_COLORS[(tmAsHash(d.name) + i) % TM_AS_COLORS.length]}"></span>`).join('')}${d.count > 7 ? `<span class="more">${d.count}+</span>` : ''}</div>`
        : '';
      const av = d.type === 'team'
        ? `<div class="tm-as-av" style="background:${tmAsColor(d)}"><img src="${PROJ_MENU_ICONS.team}" alt=""></div>`
        : `<div class="tm-as-av" style="background:${tmAsColor(d)}">${avatarInitials(d.name)}</div>`;
      return `<div class="tm-as-row${on ? ' sel' : ''}" role="option" aria-selected="${on}" data-name="${smEsc(d.name)}">
        <div class="tm-as-main">${av}<div class="tm-as-text"><span class="tm-as-name">${smEsc(d.name)}</span>${d.type === 'team' ? dots : `<span class="tm-as-mail">${smEsc(d.email || '')}</span>`}</div></div>${on ? check : ''}</div>`;
    }).join('');
  }
  // One floating list shared by every modal: rows toggle an assignee (person or team); it stays open for more picks.
  const tmAssigneeMenu = (function () {
    const el = document.createElement('div');
    el.className = 'tm-as-menu';
    el.setAttribute('role', 'listbox');
    el.hidden = true;
    document.body.appendChild(el);
    let ctx = null;   // { anchor, getSelected, toggle }
    const trigger = () => ctx && ctx.anchor.querySelector('[data-assignee-trigger]');
    function render() { const top = el.scrollTop; el.innerHTML = tmAssigneeMenuHtml(ctx.getSelected()); el.scrollTop = top; }
    function close() {
      if (!ctx) return;
      el.hidden = true;
      const t = trigger();
      if (t) t.setAttribute('aria-expanded', 'false');
      ctx = null;
    }
    function open(c) {
      ctx = c;
      el.hidden = false;
      render();
      const t = trigger();
      if (t) t.setAttribute('aria-expanded', 'true');
      const r = c.anchor.getBoundingClientRect();
      const h = el.offsetHeight, w = el.offsetWidth;
      const below = r.bottom + 8;
      el.style.top = (below + h > window.innerHeight - 8 ? Math.max(8, r.top - 8 - h) : below) + 'px';
      el.style.left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)) + 'px';
    }
    document.addEventListener('click', (e) => {
      if (!ctx) return;
      const row = e.target.closest('.tm-as-row');
      if (row && el.contains(row)) { ctx.toggle(row.dataset.name); if (ctx) render(); return; }
      if (!e.target.closest('[data-assignee-trigger]')) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !ctx) return;
      const t = trigger();
      close();
      if (t) t.focus();
    });
    window.addEventListener('resize', close);
    window.addEventListener('scroll', (e) => { if (ctx && !el.contains(e.target)) close(); }, true);
    return { open, close, isOpenFor: anchor => !!ctx && ctx.anchor === anchor };
  })();
  // Wires the "+" button inside `wrap` (#tmAssignees) to the shared list; `names` is the live array of assignees.
  function tmWireAssignees(wrap, names, onChange) {
    const redraw = () => { wrap.innerHTML = tmAssigneesHtml(names); };
    wrap.addEventListener('click', (e) => {
      if (!e.target.closest('[data-assignee-trigger]')) return;
      if (tmAssigneeMenu.isOpenFor(wrap)) { tmAssigneeMenu.close(); return; }
      tmAssigneeMenu.open({
        anchor: wrap,
        getSelected: () => names,
        toggle: (name) => {
          const i = names.indexOf(name);
          if (i >= 0) names.splice(i, 1); else names.push(name);
          redraw();
          if (onChange) onChange();
        }
      });
    });
  }
  const TM_ARROW_SVG = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';
  function tmCrumbHtml(isSub) {
    return isSub ? `<span class="dim">รายละเอียดงาน</span><span class="dim">›</span><span>รายละเอียดงานย่อย</span>` : `รายละเอียดงาน`;
  }
  function tmParentBannerHtml(parent, parentStatusKey) {
    if (!parent) return '';
    const t = tmTint(parentStatusKey);
    return `
            <div class="kan-parent-row" style="padding:0;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>
              <div class="kan-parent-pill tinted" style="background:${t.bg}; color:${t.fg};">
                <span class="lbl">จากงานหลัก</span>
                <span class="sep">:</span>
                <span class="ttl">${smEsc(parent.title)}</span>
                <span class="key" style="border-color:${t.fg}; color:${t.fg};">${parent.key}</span>
              </div>
            </div>`;
  }
  function tmKeyWrapHtml(parent, parentStatusKey, ownKey, ownStatusKey) {
    const own = `<span class="tm-key-badge" id="tmKeyBadge" style="${keyBadgeStyle(ownStatusKey)}">${ownKey}</span>`;
    if (!parent) return own;
    const t = tmTint(parentStatusKey);
    return `
              <div class="tm-key-breadcrumb">
                <span class="prev" style="background:${t.bg}; border-color:${t.fg}; color:${t.fg};">${parent.key}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                ${own}
              </div>`;
  }
  // Inner html of the .tm-pd wrapper in the "งานหลัก" row; `locked` = plain read-only chip (parent fixed by a button).
  function tmParentFieldHtml(parent, parentStatusKey, locked) {
    if (parent && locked) {
      const t = tmTint(parentStatusKey);
      return `<div class="tm-parent-field" style="background:${t.bg}; color:${t.fg};"><span class="ttl">${smEsc(parent.title)}</span><span class="badge" style="border-color:${t.fg}; color:${t.fg};">${parent.key}</span></div>`;
    }
    if (!parent) {
      return `<button type="button" class="tm-pd-btn" aria-haspopup="listbox"><span>ไม่เลือกงานหลัก</span>${TM_ARROW_SVG}</button><div class="tm-pd-list" role="listbox"></div>`;
    }
    const t = tmTint(parentStatusKey);
    return `<button type="button" class="tm-pd-btn has-parent" style="background:${t.bg}; color:${t.fg};" aria-haspopup="listbox"><span class="tm-pd-chip-ttl">${smEsc(parent.title)}</span><span class="tm-pd-key" style="border-color:${t.fg}; color:${t.fg};">${parent.key}</span>${TM_ARROW_SVG}</button><div class="tm-pd-list" role="listbox"></div>`;
  }
  function tmParentOptionsHtml(parent, candidates) {
    const none = parent ? `<div class="tm-pd-opt tm-pd-none" data-key="" role="option">ไม่เลือกงานหลัก</div>` : '';
    if (!candidates.length) return none + `<div class="tm-pd-empty">ยังไม่มีงานให้เลือก</div>`;
    return none + candidates.map(t => {
      const s = tmTint(t.status);
      return `<div class="tm-pd-opt${parent && parent.key === t.key ? ' sel' : ''}" data-key="${t.key}" role="option"><span class="tm-pd-key" style="background:${s.bg}; border-color:${s.fg}; color:${s.fg};">${t.key}</span><span class="tm-pd-ttl">${smEsc(t.title)}</span></div>`;
    }).join('');
  }
  // Opens/closes the picker in #tmParentField and reports the chosen task (or null for "ไม่เลือกงานหลัก").
  function tmWireParentPicker(modalNode, listHtml, onPick) {
    const field = modalNode.querySelector('#tmParentField');
    modalNode.addEventListener('click', (e) => {          // capture: any click outside the picker closes it
      if (!e.target.closest('.tm-pd')) field.classList.remove('open');
    }, true);
    field.addEventListener('click', (e) => {
      const btn = e.target.closest('.tm-pd-btn');
      if (btn) {
        e.stopPropagation();
        modalNode.querySelectorAll('.tm-dd-list').forEach(l => l.classList.remove('open'));
        if (field.classList.toggle('open')) field.querySelector('.tm-pd-list').innerHTML = listHtml();
        return;
      }
      const opt = e.target.closest('.tm-pd-opt');
      if (!opt) return;
      e.stopPropagation();
      field.classList.remove('open');
      onPick(opt.dataset.key ? getTaskByKey(opt.dataset.key) : null);
    });
  }
  const TM_TAG_MANAGE_HTML = () => `<div class="tm-dd-manage" role="button"><img src="${PROJ_MENU_ICONS.type}" alt="">จัดการประเภท</div>`;
