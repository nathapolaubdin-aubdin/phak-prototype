  // ---------- List manager modal (จัดการสถาณะ / จัดการประเภท) ----------
  // One modal, two configs (SM_CONFIGS below). Edits are staged on a draft copy and only written to the
  // shared list on "บันทึก", so every view (board / list / timeline / calendar / type) picks the change
  // up from the one list. Deleting an item that tasks use asks where to move those tasks.
  const SM_COLORS = ['#6E6E6E', '#378ADD', '#5B5BD6', '#911EF2', '#E84393', '#F5443A', '#F0883E', '#EFC726', '#25A767', '#16A0A0', '#8B5E3C', '#4B5563'];
  const SM_ICONS = [
    '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/>',
    '<path d="M13 2 3 14h7l-1 8 11-14h-7z"/>',
    '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    '<circle cx="12" cy="12" r="9"/><polyline points="8 12 11 15 16 9"/>',
    '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
    '<circle cx="12" cy="12" r="10"/><line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/>',
    '<circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>',
    '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
    '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
    '<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>',
    '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
    '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
    '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
    '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    '<circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>'
  ];
  const SM_DRAG_ICON = 'data:image/svg+xml;base64,PHN2ZyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiBvdmVyZmxvdz0idmlzaWJsZSIgc3R5bGU9ImRpc3BsYXk6IGJsb2NrOyIgd2lkdGg9IjEyIiBoZWlnaHQ9IjIwIiB2aWV3Qm94PSIwIDAgMTIgMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxnIGlkPSJHcm91cCI+CjxnIGlkPSJVbmlvbiI+CjxwYXRoIGQ9Ik0yIDE2QzMuMTA0NTcgMTYgNCAxNi44OTU0IDQgMThDNCAxOS4xMDQ2IDMuMTA0NTcgMjAgMiAyMEMwLjg5NTQzMSAyMCAwIDE5LjEwNDYgMCAxOEMwIDE2Ljg5NTQgMC44OTU0MzEgMTYgMiAxNloiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xMCAxNkMxMS4xMDQ2IDE2IDEyIDE2Ljg5NTQgMTIgMThDMTIgMTkuMTA0NiAxMS4xMDQ2IDIwIDEwIDIwQzguODk1NDMgMjAgOCAxOS4xMDQ2IDggMThDOCAxNi44OTU0IDguODk1NDMgMTYgMTAgMTZaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMiA4QzMuMTA0NTcgOCA0IDguODk1NDMgNCAxMEM0IDExLjEwNDYgMy4xMDQ1NyAxMiAyIDEyQzAuODk1NDMxIDEyIDAgMTEuMTA0NiAwIDEwQzAgOC44OTU0MyAwLjg5NTQzMSA4IDIgOFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xMCA4QzExLjEwNDYgOCAxMiA4Ljg5NTQzIDEyIDEwQzEyIDExLjEwNDYgMTEuMTA0NiAxMiAxMCAxMkM4Ljg5NTQzIDEyIDggMTEuMTA0NiA4IDEwQzggOC44OTU0MyA4Ljg5NTQzIDggMTAgOFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0yIDBDMy4xMDQ1NyAwIDQgMC44OTU0MyA0IDJDNCAzLjEwNDU3IDMuMTA0NTcgNCAyIDRDMC44OTU0MzEgNCAwIDMuMTA0NTcgMCAyQzAgMC44OTU0MyAwLjg5NTQzMSAwIDIgMFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xMCAwQzExLjEwNDYgMCAxMiAwLjg5NTQzIDEyIDJDMTIgMy4xMDQ1NyAxMS4xMDQ2IDQgMTAgNEM4Ljg5NTQzIDQgOCAzLjEwNDU3IDggMkM4IDAuODk1NDMgOC44OTU0MyAwIDEwIDBaIiBmaWxsPSJ3aGl0ZSIvPgo8L2c+CjwvZz4KPC9zdmc+Cg==';

  function smAllProjects() { return [THAI_IOD_PROJECT, PROLOG_PROJECT, YLG_PROJECT]; }
  function smTaskCount(field, key) {
    let n = 0;
    smAllProjects().forEach(p => (p.tasks || []).forEach(t => { if (t[field] === key) n++; }));
    return n;
  }
  function smEsc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function openListManager(cfg, opts = {}) {
    if (document.getElementById('smOverlay')) return;
    const noun = cfg.noun;
    const draft = cfg.items().map(s => ({ ...s }));
    const removed = {}; // removed status key -> key its tasks move to
    let seq = 0;
    const sig = () => JSON.stringify([draft.map(d => [d.key, d.label, d.color, d.icon]), removed]);
    const initialSig = sig();
    const byId = id => draft.find(d => d.key === id);
    const resolve = k => { let guard = 0; while (removed[k] && guard++ < 50) k = removed[k]; return k; };
    const pendingCount = key => {
      let n = smTaskCount(cfg.field, key);
      Object.keys(removed).forEach(rk => { if (resolve(rk) === key) n += smTaskCount(cfg.field, rk); });
      return n;
    };
    const nameError = d => {
      const v = d.label.trim();
      if (!v) return `กรุณาตั้งชื่อ${noun}ให้ครบทุกรายการ`;
      if (draft.some(o => o !== d && o.label.trim().toLowerCase() === v.toLowerCase())) return `ชื่อ “${v}” ถูกใช้แล้ว`;
      return '';
    };

    const overlay = document.createElement('div');
    overlay.className = 'sm-overlay';
    overlay.id = 'smOverlay';
    overlay.innerHTML = `
      <div class="sm-modal" role="dialog" aria-modal="true" aria-labelledby="smTitle" tabindex="-1">
        <div class="sm-topbar">
          <img src="${PROJ_MENU_ICONS[cfg.headerIcon]}" alt="">
          <span class="sm-title" id="smTitle">${cfg.title}</span>
        </div>
        <div class="sm-body">
          <p class="sm-label">${cfg.orderLabel}</p>
          <div class="sm-list" id="smList"></div>
          <button type="button" class="sm-add" id="smAdd">+ เพิ่ม${noun}</button>
        </div>
        <div class="sm-footer">
          <button type="button" class="sm-cancel" id="smCancel">ยกเลิก</button>
          <span class="sm-err" id="smErr" role="alert"></span>
          <button type="button" class="sm-save" id="smSave">บันทึก</button>
        </div>
      </div>`;
    (document.querySelector('.app') || document.body).appendChild(overlay);

    const modal = overlay.querySelector('.sm-modal');
    const list = overlay.querySelector('#smList');
    const errEl = overlay.querySelector('#smErr');
    const saveBtn = overlay.querySelector('#smSave');
    let pop = null;

    const isDirty = () => sig() !== initialSig;
    function syncFooter() {
      let err = '';
      for (const d of draft) { err = nameError(d); if (err) break; }
      errEl.textContent = err;
      saveBtn.disabled = !!err || !isDirty();
      list.querySelectorAll('.sm-row[data-id]').forEach(row => {
        const d = byId(row.dataset.id);
        if (!d) return;
        const bad = !!d.touched && !!nameError(d);
        row.querySelectorAll('.sm-name, .sm-name-text').forEach(el => el.classList.toggle('invalid', bad));
      });
    }

    function iconSvg(d) {
      return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${d.icon}</svg>`;
    }
    // The name is plain text; clicking it swaps in an inline field (see startEdit / stopEdit).
    function nameCellHtml(d) {
      const bad = d.touched && nameError(d) ? ' invalid' : '';
      if (d.editing) {
        return `<input class="sm-name${bad}" data-role="name" value="${smEsc(d.label)}" maxlength="24" placeholder="ชื่อ${noun}" aria-label="ชื่อ${noun}">`;
      }
      return `<span class="sm-name-text${d.label ? '' : ' placeholder'}${bad}" data-role="name-text" role="button" tabindex="0" title="คลิกเพื่อแก้ไขชื่อ">${smEsc(d.label || `ชื่อ${noun}`)}</span>`;
    }
    function rowHtml(d, i) {
      const n = pendingCount(d.key);
      if (d.confirming) {
        const others = draft.filter(o => o !== d);
        const pref = draft[i + 1] && draft[i + 1] !== d ? draft[i + 1] : draft[i - 1];
        return `
          <div class="sm-row sm-row-confirm" data-id="${d.key}">
            <span class="sm-badge" style="background:${d.color}; cursor:default;">${iconSvg(d)}</span>
            <div class="sm-confirm-text">มี <b>${n}</b> งานใน${noun} “${smEsc(d.label)}” ย้ายงานไปที่
              <select class="sm-select" data-role="dest" aria-label="${noun}ปลายทาง">
                ${others.map(o => `<option value="${o.key}" ${o === pref ? 'selected' : ''}>${smEsc(o.label || `${noun}ใหม่`)}</option>`).join('')}
              </select>
            </div>
            <button type="button" class="sm-btn-danger" data-role="confirm-del">ลบ${noun}</button>
            <button type="button" class="sm-btn-ghost" data-role="cancel-del">ยกเลิก</button>
          </div>`;
      }
      return `
        <div class="sm-row${d.editing ? ' editing' : ''}" data-id="${d.key}">
          <div class="sm-row-main">
            <button type="button" class="sm-handle" data-role="handle" aria-label="จัดลำดับ ลากหรือกดลูกศรขึ้น/ลง" title="ลากเพื่อจัดลำดับ"><span class="sm-grip"><img src="${SM_DRAG_ICON}" alt=""></span></button>
            <button type="button" class="sm-badge" data-role="badge" style="background:${d.color}" aria-label="เปลี่ยนสีและไอคอน" aria-haspopup="dialog">${iconSvg(d)}</button>
            <div class="sm-name-wrap">${nameCellHtml(d)}</div>
          </div>
          <div class="sm-row-side">
            ${i === 0 && cfg.firstHint ? `<span class="sm-tag" title="${cfg.firstHint.title}">${cfg.firstHint.label}</span>` : ''}
            ${i === draft.length - 1 && cfg.lastHint ? `<span class="sm-tag" title="${cfg.lastHint.title}">${cfg.lastHint.label}</span>` : ''}
            <span class="sm-count">${n} งาน</span>
            <button type="button" class="sm-del" data-role="del" ${draft.length <= 1 ? `disabled title="ต้องมีอย่างน้อย 1 ${noun}"` : `aria-label="ลบ${noun}"`}>
              <img src="${PROJ_MENU_ICONS.trash}" alt="">
            </button>
          </div>
        </div>`;
    }
    function renderList() {
      closePop();
      list.innerHTML = draft.map(rowHtml).join('');
      syncFooter();
    }

    // ----- colour + icon popover -----
    function closePop() { if (pop) { pop.remove(); pop = null; } }
    function openPop(d, anchor) {
      closePop();
      pop = document.createElement('div');
      pop.className = 'sm-pop';
      pop.setAttribute('role', 'dialog');
      pop.setAttribute('aria-label', 'เลือกสีและไอคอน');
      pop.innerHTML = `
        <div class="sm-pop-label">สี</div>
        <div class="sm-swatches">
          ${SM_COLORS.map(c => `<button type="button" class="sm-swatch ${c === d.color ? 'sel' : ''}" data-color="${c}" style="background:${c}" aria-label="สี ${c}"></button>`).join('')}
          <label class="sm-swatch sm-swatch-custom" title="กำหนดสีเอง">+<input type="color" value="${d.color}" data-role="custom-color" aria-label="กำหนดสีเอง"></label>
        </div>
        <div class="sm-pop-label">ไอคอน</div>
        <div class="sm-icons">
          ${SM_ICONS.map((ic, idx) => `<button type="button" class="sm-icon-opt ${ic === d.icon ? 'sel' : ''}" data-icon="${idx}" aria-label="ไอคอน ${idx + 1}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${ic}</svg></button>`).join('')}
        </div>`;
      overlay.appendChild(pop);
      const r = anchor.getBoundingClientRect();
      const h = pop.offsetHeight, w = pop.offsetWidth;
      const top = r.bottom + 6 + h > window.innerHeight - 8 ? Math.max(8, r.top - 6 - h) : r.bottom + 6;
      pop.style.top = top + 'px';
      pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)) + 'px';

      const paint = () => {
        const badge = list.querySelector(`.sm-row[data-id="${d.key}"] .sm-badge`);
        if (badge) { badge.style.background = d.color; badge.innerHTML = iconSvg(d); }
        pop.querySelectorAll('.sm-swatch[data-color]').forEach(b => b.classList.toggle('sel', b.dataset.color === d.color));
        pop.querySelectorAll('.sm-icon-opt').forEach(b => b.classList.toggle('sel', SM_ICONS[+b.dataset.icon] === d.icon));
        syncFooter();
      };
      const setColor = c => { d.color = c; if (cfg.deriveCardBg) d.cardBg = mixHex(c, '#ffffff', 0.78); paint(); };
      pop.addEventListener('click', e => {
        const sw = e.target.closest('.sm-swatch[data-color]');
        if (sw) { setColor(sw.dataset.color); return; }
        const ic = e.target.closest('.sm-icon-opt');
        if (ic) { d.icon = SM_ICONS[+ic.dataset.icon]; paint(); }
      });
      pop.querySelector('[data-role="custom-color"]').addEventListener('input', e => setColor(e.target.value));
    }

    // ----- row interactions (delegated) -----
    // Name = plain text until clicked. The swap is done in place (not a full re-render) so a click that lands on
    // another control while the field blurs still reaches it.
    function startEdit(row) {
      const d = byId(row.dataset.id);
      if (!d || d.editing) return;
      d.editing = true;
      d.prevLabel = d.label;
      row.classList.add('editing');
      row.querySelector('.sm-name-wrap').innerHTML = nameCellHtml(d);
      const inp = row.querySelector('.sm-name');
      inp.focus();
      inp.setSelectionRange(inp.value.length, inp.value.length);
    }
    function stopEdit(row) {
      const d = byId(row.dataset.id);
      if (!d || !d.editing) return;
      d.editing = false;
      d.touched = true;
      row.classList.remove('editing');
      row.querySelector('.sm-name-wrap').innerHTML = nameCellHtml(d);
      syncFooter();
    }
    list.addEventListener('input', e => {
      const inp = e.target.closest('[data-role="name"]');
      if (!inp) return;
      const d = byId(inp.closest('.sm-row').dataset.id);
      d.label = inp.value;
      d.touched = true;
      syncFooter();
    });
    list.addEventListener('focusout', e => {
      const inp = e.target.closest('[data-role="name"]');
      if (inp && inp.isConnected) stopEdit(inp.closest('.sm-row'));
    });
    list.addEventListener('click', e => {
      const row = e.target.closest('.sm-row');
      if (!row) return;
      const d = byId(row.dataset.id);
      const role = (e.target.closest('[data-role]') || {}).dataset && e.target.closest('[data-role]').dataset.role;
      if (role === 'name-text') { startEdit(row); return; }
      if (role === 'badge') { openPop(d, e.target.closest('[data-role="badge"]')); return; }
      if (role === 'del') {
        if (draft.length <= 1) return;
        if (pendingCount(d.key) > 0) { d.confirming = true; renderList(); return; }
        draft.splice(draft.indexOf(d), 1);
        renderList();
        return;
      }
      if (role === 'cancel-del') { d.confirming = false; renderList(); return; }
      if (role === 'confirm-del') {
        removed[d.key] = row.querySelector('[data-role="dest"]').value;
        draft.splice(draft.indexOf(d), 1);
        renderList();
      }
    });
    // keyboard reorder: focus the ⋮⋮ handle and press ↑ / ↓
    list.addEventListener('keydown', e => {
      const field = e.target.closest('[data-role="name"]');
      if (field) {
        if (e.key === 'Enter') { e.preventDefault(); field.blur(); }
        else if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation(); // undo the edit only; don't close the whole modal
          const row = field.closest('.sm-row');
          const d = byId(row.dataset.id);
          d.label = d.prevLabel || '';
          if (d.isNew && !d.label) { draft.splice(draft.indexOf(d), 1); renderList(); }
          else stopEdit(row);
        }
        return;
      }
      const txt = e.target.closest('[data-role="name-text"]');
      if (txt && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); startEdit(txt.closest('.sm-row')); return; }
      const handle = e.target.closest('[data-role="handle"]');
      if (!handle || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
      e.preventDefault();
      const d = byId(handle.closest('.sm-row').dataset.id);
      const i = draft.indexOf(d), j = i + (e.key === 'ArrowUp' ? -1 : 1);
      if (j < 0 || j >= draft.length) return;
      draft.splice(i, 1);
      draft.splice(j, 0, d);
      renderList();
      const again = list.querySelector(`.sm-row[data-id="${d.key}"] .sm-handle`);
      if (again) again.focus();
    });
    // drag & drop reorder (only starts from the ⋮⋮ handle so the name field stays selectable)
    let dragRow = null;
    list.addEventListener('mousedown', e => {
      const h = e.target.closest('[data-role="handle"]');
      if (h) h.closest('.sm-row').draggable = true;
    });
    list.addEventListener('mouseup', () => {
      list.querySelectorAll('.sm-row[draggable="true"]').forEach(r => { if (r !== dragRow) r.draggable = false; });
    });
    list.addEventListener('dragstart', e => {
      const row = e.target.closest && e.target.closest('.sm-row');
      if (!row) return;
      dragRow = row;
      row.classList.add('dragging');
      closePop();
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', row.dataset.id);
    });
    list.addEventListener('dragover', e => {
      if (!dragRow) return;
      e.preventDefault();
      const over = e.target.closest('.sm-row');
      if (!over || over === dragRow) return;
      const r = over.getBoundingClientRect();
      list.insertBefore(dragRow, e.clientY > r.top + r.height / 2 ? over.nextSibling : over);
    });
    list.addEventListener('dragend', () => {
      if (!dragRow) return;
      dragRow.draggable = false;
      dragRow.classList.remove('dragging');
      const order = [...list.querySelectorAll('.sm-row')].map(r => r.dataset.id);
      draft.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
      dragRow = null;
      renderList();
    });

    // ----- add / save / close -----
    function addRow(at) {
      const color = '#EFC726';
      const row = {
        key: cfg.keyPrefix + Date.now().toString(36) + (seq++), label: '', prevLabel: '', isNew: true, editing: true,
        color, icon: SM_ICONS[SM_ICONS.length - 1]
      };
      if (cfg.deriveCardBg) { row.cardBg = mixHex(color, '#ffffff', 0.78); row.count = 0; }
      if (Number.isInteger(at)) draft.splice(Math.max(0, Math.min(at, draft.length)), 0, row); else draft.push(row);
      renderList();
      const inp = list.querySelector(`.sm-row[data-id="${row.key}"] .sm-name`);
      if (inp) { inp.focus(); inp.scrollIntoView({ block: 'nearest' }); }
    }
    function onKey(e) {
      if (e.key !== 'Escape') return;
      if (pop) { closePop(); return; }
      if (!isDirty()) close();
    }
    function close() {
      document.removeEventListener('keydown', onKey);
      overlay.remove();
      if (opts.returnFocusTo && opts.returnFocusTo.isConnected) opts.returnFocusTo.focus();
    }
    function save() {
      if (saveBtn.disabled) return;
      const next = draft.map(d => {
        const { confirming, touched, editing, prevLabel, isNew, ...s } = d;
        return { ...s, label: d.label.trim() };
      });
      smAllProjects().forEach(p => (p.tasks || []).forEach(t => { t[cfg.field] = resolve(t[cfg.field]); }));
      const items = cfg.items();
      items.splice(0, items.length, ...next);
      if (cfg.afterSave) cfg.afterSave();
      if (cfg.field === 'status') document.dispatchEvent(new CustomEvent('statuses-saved', { detail: { resolve } }));
      if (cfg.field === 'tagKey') document.dispatchEvent(new CustomEvent('types-saved', { detail: { resolve } }));
      close();
      refreshCurrentView();
      showToast(`บันทึก${noun}แล้ว`);
    }
    overlay.querySelector('#smAdd').addEventListener('click', () => addRow());
    overlay.querySelector('#smCancel').addEventListener('click', close);
    saveBtn.addEventListener('click', save);
    overlay.addEventListener('mousedown', e => {
      if (pop && !pop.contains(e.target) && !e.target.closest('[data-role="badge"]')) closePop();
      if (e.target === overlay && !isDirty()) close();
    });
    document.addEventListener('keydown', onKey);

    renderList();
    if (opts.addNew) addRow(opts.insertAt); else modal.focus();
  }

  const SM_CONFIGS = {
    status: {
      noun: 'สถานะ', title: 'จัดการสถานะ', orderLabel: 'ลำดับสถานะ', headerIcon: 'status', field: 'status', keyPrefix: 'st_', deriveCardBg: true,
      items: () => KAN_STATUSES,
      firstHint: { label: 'เริ่มต้น', title: 'งานใหม่จะเริ่มที่สถานะนี้' },
      lastHint: { label: 'งานเสร็จ', title: 'งานในสถานะนี้นับว่าเสร็จแล้ว (ใช้คำนวณความคืบหน้างานย่อย)' },
      afterSave: () => CAL_STATUS_FILTER.forEach(k => { if (!KAN_STATUSES.some(s => s.key === k)) CAL_STATUS_FILTER.delete(k); })
    },
    type: {
      noun: 'ประเภท', title: 'จัดการประเภท', orderLabel: 'ลำดับประเภท', headerIcon: 'type', field: 'tagKey', keyPrefix: 'tag_', deriveCardBg: false,
      items: () => TAG_TYPES,
      firstHint: { label: 'ค่าเริ่มต้น', title: 'งานใหม่จะใช้ประเภทนี้เป็นค่าเริ่มต้น' },
      lastHint: null
    }
  };
  function openStatusManager(opts) { openListManager(SM_CONFIGS.status, opts); }
  function openTypeManager(opts) { openListManager(SM_CONFIGS.type, opts); }

  // The board's "+ เพิ่มสถานะ" column and the type view's add buttons open the same managers with a fresh row ready to name.
  function openAddStatusModal() { openStatusManager({ addNew: true }); }
  function openAddTagModal() { openTypeManager({ addNew: true }); }

