  // ---------- Drive ----------
  // A separate top-level page (own sidebar, own body) alongside Workspace and
  // Chatbot. หน้าหลัก aggregates across every drive (personal + ไดร์งาน's
  // per-project folders, built dynamically from ALL_PROJECTS + ความรู้องค์กรณ์);
  // ไดร์งาน itself has no data of its own — it's just ALL_PROJECTS rendered as
  // folders. ดูล่าสุด / ถังขยะ are static mockups per the design brief (no real
  // history/trash tracking in this prototype).
  const driveSidebar = document.getElementById('driveSidebar');
  const drivePage = document.getElementById('drivePage');

  // ----- grid / list view toggle (toolbar buttons, applies to every listing) -----
  let DRV_VIEW_MODE = 'grid';
  function driveGridModeClass() { return DRV_VIEW_MODE === 'list' ? 'is-list' : ''; }

  const DRV_ICONS = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"/>',
    myDrive: '<path d="M4 15h16"/><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="17.5" r="0.6" fill="currentColor" stroke="none"/><circle cx="11" cy="17.5" r="0.6" fill="currentColor" stroke="none"/>',
    workDrive: '<path d="M3 7a2 2 0 0 1 2-2h3l2 2h9a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>',
    org: '<path d="M4 21V6a1 1 0 0 1 1-1h6v16"/><path d="M15 21V10a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v11"/><line x1="8" y1="8" x2="8" y2="8.01"/><line x1="8" y1="12" x2="8" y2="12.01"/><line x1="8" y1="16" x2="8" y2="16.01"/><line x1="18" y1="13" x2="18" y2="13.01"/><line x1="18" y1="17" x2="18" y2="17.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    plusSm: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    chevDown: '<polyline points="6 9 12 15 18 9"/>',
    more: '<circle cx="5" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
    bookmark: '<path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" fill="currentColor" stroke="none"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>',
    list: '<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    txt: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/>',
    pdf: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15v3M9 15h1a1.2 1.2 0 0 0 0-2.4H9v2.4z"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>'
  };
  // Folder glyphs from Figma (node 226:8675 / 226:8680): plain folder vs.
  // shared folder (people badge). `folder.shared` picks which one renders.
  const DRV_FOLDER_GLYPH = {
    normal: 'assets/icons/folder-normal.svg',
    shared: 'assets/icons/folder-shared.svg'
  };
  const DRV_FILE_TYPES = {
    txt: { icon: DRV_ICONS.txt, color: 'var(--status-blue)' },
    pdf: { icon: DRV_ICONS.pdf, color: 'var(--accent-coral)' },
    default: { icon: DRV_ICONS.file, color: 'var(--grey4)' }
  };

  function driveFile(id, name, opts) {
    opts = opts || {};
    const ext = (name.split('.').pop() || '').toLowerCase();
    return { id, name, type: ext, bookmarked: !!opts.bookmarked, date: opts.date || new Date(TODAY_REF) };
  }

  let DRV_PERSONAL_FILES = [
    driveFile('pf1', 'How to use.txt', { bookmarked: true }),
    driveFile('pf2', 'Cookie and Policy.pdf', { bookmarked: true }),
    driveFile('pf3', 'How to use.txt', { date: addDays(TODAY_REF, -2) }),
    driveFile('pf4', 'Cookie and Policy.pdf', { date: addDays(TODAY_REF, -3) })
  ];
  let DRV_PERSONAL_FOLDERS = [
    { id: 'p-personal', name: 'ส่วนตัว', bookmarked: false, files: DRV_PERSONAL_FILES },
    { id: 'p-test', name: 'ทดสอบ', bookmarked: true, files: [] }
  ];
  const DRV_ORG_FOLDERS = [
    { id: 'ok-policy', name: 'นโยบายบริษัท', shared: true, files: [] },
    { id: 'ok-sop', name: 'SOP', shared: true, files: [] },
    { id: 'ok-forms', name: 'แบบฟอร์ม', shared: true, files: [] },
    { id: 'ok-base', name: 'ข้อมูลพื้นฐานบริษัท', shared: true, files: [] }
  ];

  function ensureProjectDriveFiles(project) {
    if (!project.driveFiles) {
      project.driveFiles = [
        driveFile(project.keyPrefix + '-d1', 'How to use.txt', { date: addDays(TODAY_REF, -1) }),
        driveFile(project.keyPrefix + '-d2', 'Cookie and Policy.pdf', { date: addDays(TODAY_REF, -4) })
      ];
    }
    return project.driveFiles;
  }

  function driveAllFolders() {
    return [...DRV_PERSONAL_FOLDERS, ...DRV_ORG_FOLDERS];
  }
  function driveAllFiles() {
    let files = DRV_PERSONAL_FILES.slice();
    ALL_PROJECTS.forEach(p => { files = files.concat(ensureProjectDriveFiles(p)); });
    return files;
  }

  function driveProjectIconHtml(project) {
    const src = (typeof psExtractImageSrc === 'function') ? psExtractImageSrc(project) : null;
    if (src) return `<img src="${src}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${DRV_ICONS.workDrive}</svg>`;
  }

  // ----- folder / file cards (193x193, shared by every listing page) -----
  function driveFolderCardHtml(folder, opts) {
    opts = opts || {};
    return `
      <div class="drv-card" data-drive-folder="${folder.id}">
        <div class="drv-card-thumb drv-folder-thumb">
          ${opts.iconHtml || `<img class="drv-folder-glyph" src="${folder.shared ? DRV_FOLDER_GLYPH.shared : DRV_FOLDER_GLYPH.normal}" alt="">`}
          ${folder.bookmarked ? `<span class="drv-bookmark"><svg width="16" height="16" viewBox="0 0 24 24">${DRV_ICONS.bookmark}</svg></span>` : ''}
        </div>
        <div class="drv-card-foot">
          <span class="drv-card-name">${opts.avatarHtml || ''}${folder.name}</span>
          <button class="drv-card-more" data-stub="1" aria-label="เพิ่มเติม">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${DRV_ICONS.more}</svg>
          </button>
        </div>
      </div>`;
  }

  function driveFileCardHtml(file) {
    const meta = DRV_FILE_TYPES[file.type] || DRV_FILE_TYPES.default;
    return `
      <div class="drv-card" data-drive-file="${file.id}">
        <div class="drv-card-thumb" style="background:rgba(255,255,255,0.06);">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="${meta.color}" stroke-width="1.3">${meta.icon}</svg>
          ${file.bookmarked ? `<span class="drv-bookmark"><svg width="16" height="16" viewBox="0 0 24 24">${DRV_ICONS.bookmark}</svg></span>` : ''}
        </div>
        <div class="drv-card-foot">
          <span class="drv-card-name">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${meta.color}" stroke-width="1.8" style="flex-shrink:0;">${meta.icon}</svg>
            ${file.name}
          </span>
          <button class="drv-card-more" data-stub="1" aria-label="เพิ่มเติม">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${DRV_ICONS.more}</svg>
          </button>
        </div>
      </div>`;
  }

  function driveSectionHtml(title, bodyHtml) {
    return `
      <div class="drv-section">
        <div class="drv-section-head">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" style="transform:rotate(0deg);">${DRV_ICONS.chevDown}</svg>
          <span>${title}</span>
        </div>
        <div class="drv-grid ${driveGridModeClass()}">${bodyHtml}</div>
      </div>`;
  }

  // ----- sidebar -----
  let DRV_OPEN = { personal: true, work: true, org: true };

  function driveSidebarHtml(active) {
    const projectRows = ALL_PROJECTS.map(p => `
      <div class="drv-nav-sub ${active.section === 'work' && active.projectKey === p.keyPrefix ? 'active' : ''}" data-drive-project="${p.keyPrefix}">
        <span class="drv-nav-avatar">${driveProjectIconHtml(p)}</span>
        <span class="label">${p.name}</span>
      </div>`).join('');

    return `
      <div class="sidebar-top">
        <div class="brand-row">
          <div class="brand"><img class="brand-logo" src="${BRAND_LOGO}" alt="PHAK Second Brain"></div>
          <button class="icon-btn" id="driveSidebarToggle" aria-label="พับ/ขยายเมนู">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="9" y1="4" x2="9" y2="20"/></svg>
          </button>
        </div>

        <button class="drv-nav-home ${active.section === 'home' ? 'active' : ''}" data-drive-nav="home">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${DRV_ICONS.home}</svg>
          <span class="label">หน้าแรก</span>
        </button>

        <div class="drv-nav-group">
          <div class="drv-nav-header" data-drive-toggle="personal">
            <div class="left">
              <svg class="drv-nav-chev ${DRV_OPEN.personal ? 'open' : ''}" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">${DRV_ICONS.chevDown}</svg>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${DRV_ICONS.myDrive}</svg>
              <span class="label">ไดร์ของฉัน</span>
            </div>
            <button class="icon-btn" style="width:16px;height:16px;" data-stub="1" aria-label="เพิ่ม" onclick="event.stopPropagation()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${DRV_ICONS.plusSm}</svg>
            </button>
          </div>
          ${DRV_OPEN.personal ? `<div class="drv-nav-sub ${active.section === 'personal' ? 'active' : ''}" data-drive-nav="personal">
              <span class="drv-nav-avatar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${DRV_ICONS.folder}</svg></span>
              <span class="label">ส่วนตัว</span>
            </div>` : ''}
        </div>

        <div class="drv-nav-group">
          <div class="drv-nav-header ${active.section === 'work' && !active.projectKey ? 'active' : ''}" data-drive-toggle="work" data-drive-nav="work">
            <div class="left">
              <svg class="drv-nav-chev ${DRV_OPEN.work ? 'open' : ''}" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">${DRV_ICONS.chevDown}</svg>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${DRV_ICONS.workDrive}</svg>
              <span class="label">ไดร์งาน</span>
            </div>
            <button class="icon-btn" style="width:16px;height:16px;" data-stub="1" aria-label="เพิ่ม" onclick="event.stopPropagation()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${DRV_ICONS.plusSm}</svg>
            </button>
          </div>
          ${DRV_OPEN.work ? `<div class="drv-nav-subs">${projectRows}</div>` : ''}
        </div>

        <div class="drv-nav-group">
          <div class="drv-nav-header ${active.section === 'org' ? 'active' : ''}" data-drive-toggle="org" data-drive-nav="org">
            <div class="left">
              <svg class="drv-nav-chev ${DRV_OPEN.org ? 'open' : ''}" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">${DRV_ICONS.chevDown}</svg>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${DRV_ICONS.org}</svg>
              <span class="label">ความรู้องค์กรณ์</span>
            </div>
          </div>
          ${DRV_OPEN.org ? `<div class="drv-nav-subs">${DRV_ORG_FOLDERS.map(f => `
              <div class="drv-nav-sub ${active.section === 'org' && active.folderId === f.id ? 'active' : ''}" data-drive-org-folder="${f.id}">
                <span class="drv-nav-avatar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${DRV_ICONS.folder}</svg></span>
                <span class="label">${f.name}</span>
              </div>`).join('')}</div>` : ''}
        </div>

        <div class="drv-nav-footer-links">
          <div class="drv-nav-sub ${active.section === 'recent' ? 'active' : ''}" data-drive-nav="recent">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${DRV_ICONS.clock}</svg>
            <span class="label">ดูล่าสุด</span>
          </div>
          <div class="drv-nav-sub ${active.section === 'trash' ? 'active' : ''}" data-drive-nav="trash">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${DRV_ICONS.trash}</svg>
            <span class="label">ถังขยะ</span>
          </div>
          <span class="drv-storage">ใช้ไป 10.0 GB</span>
        </div>
      </div>

      <div class="sidebar-footer">
        <div class="divider"></div>
        <div class="user-row">
          <div class="user-avatar"></div>
          <div class="user-info">
            <span class="name">${CURRENT_USER.name}</span>
            <span class="email">${CURRENT_USER.email}</span>
          </div>
        </div>
      </div>`;
  }

  function renderDriveSidebar(active) {
    driveSidebar.innerHTML = driveSidebarHtml(active);
    document.getElementById('driveSidebarToggle').addEventListener('click', () => driveSidebar.classList.toggle('collapsed'));

    // Chevron: expand/collapse only, never navigates.
    driveSidebar.querySelectorAll('.drv-nav-chev').forEach(chev => {
      chev.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = e.target.closest('[data-drive-toggle]').dataset.driveToggle;
        DRV_OPEN[key] = !DRV_OPEN[key];
        renderDriveSidebar(active);
      });
    });
    // Header row (outside the chevron/add button): navigates to that section
    // and makes sure it's expanded.
    const headerNav = { personal: openDrivePersonal, work: openDriveWork, org: openDriveOrgKnowledge };
    driveSidebar.querySelectorAll('[data-drive-toggle]').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-stub]') || e.target.closest('.drv-nav-chev')) return;
        DRV_OPEN[el.dataset.driveToggle] = true;
        headerNav[el.dataset.driveToggle]();
      });
    });

    driveSidebar.querySelector('[data-drive-nav="home"]').addEventListener('click', () => openDriveHome());
    const personalRow = driveSidebar.querySelector('[data-drive-nav="personal"]');
    if (personalRow) personalRow.addEventListener('click', () => openDrivePersonal());
    driveSidebar.querySelectorAll('[data-drive-project]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const p = ALL_PROJECTS.find(pr => pr.keyPrefix === el.dataset.driveProject);
        if (p) openDriveProject(p);
      });
    });
    driveSidebar.querySelectorAll('[data-drive-org-folder]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const f = DRV_ORG_FOLDERS.find(x => x.id === el.dataset.driveOrgFolder);
        if (f) openDriveOrgFolder(f);
      });
    });
    driveSidebar.querySelector('[data-drive-nav="recent"]').addEventListener('click', () => openDriveRecent());
    driveSidebar.querySelector('[data-drive-nav="trash"]').addEventListener('click', () => openDriveTrash());
  }

  let DRV_LAST_ACTIVE = { section: 'home' };
  function renderDriveSidebarIfOpen() {
    if (driveSidebar.style.display !== 'none') renderDriveSidebar(DRV_LAST_ACTIVE);
  }

  function ensureDriveSidebar() {
    sidebar.style.display = 'none';
    chatSidebar.style.display = 'none';
    driveSidebar.style.display = 'flex';
  }

  // ----- shared compact search bar (every non-home page) -----
  function driveTopSearchHtml() {
    return `
      <div class="drv-topsearch">
        <div class="prompt-bar" style="max-width:716px;">
          <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <div class="prompt-field">
            <input class="prompt-input" type="text" placeholder="ค้นหาบางอย่าง?" style="background:transparent;border:none;outline:none;color:var(--white);font-family:inherit;flex:1;" />
            <button class="chip" data-stub="1">ค้นหาไฟล์ล่าสุด ?</button>
            <button class="chip" data-stub="1">สรุปงานล่าสุดให้หน่อย ?</button>
          </div>
        </div>
      </div>`;
  }

  function driveToolbarHtml(title, count, opts) {
    opts = opts || {};
    return `
      <div class="drv-toolbar">
        <div class="drv-toolbar-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${opts.icon || DRV_ICONS.folder}</svg>
          ${opts.crumbLabel ? `<span class="drv-crumb-parent" data-drive-crumb="${opts.crumbKey}">${opts.crumbLabel}</span><span class="drv-crumb-sep">&gt;</span>` : ''}
          <span class="ttl">${title}</span>
          <span class="cnt">(${count} รายการ)</span>
        </div>
        <div class="drv-toolbar-actions">
          <div class="drv-filter-chips">
            <button class="drv-filter-chip" data-stub="1">จากงาน <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">${DRV_ICONS.chevDown}</svg></button>
            <button class="drv-filter-chip" data-stub="1">จากผู้คน <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">${DRV_ICONS.chevDown}</svg></button>
            <button class="drv-filter-chip" data-stub="1">ตามประเภท <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">${DRV_ICONS.chevDown}</svg></button>
          </div>
          <div class="drv-divider-v"></div>
          <div class="drv-view-toggle">
            <button class="drv-view-btn ${DRV_VIEW_MODE === 'list' ? 'active' : ''}" data-drive-view="list" aria-label="มุมมองลิสต์"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${DRV_ICONS.list}</svg></button>
            <button class="drv-view-btn ${DRV_VIEW_MODE === 'grid' ? 'active' : ''}" data-drive-view="grid" aria-label="มุมมองกริด"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${DRV_ICONS.grid}</svg></button>
          </div>
          ${opts.readOnly ? '' : `<button class="drv-add-btn" data-stub="1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${DRV_ICONS.plusSm}</svg>
            เพิ่ม
          </button>`}
        </div>
      </div>`;
  }

  function driveEmptyHtml(msg) {
    return `<div class="drv-empty">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${DRV_ICONS.folder}</svg>
      <span>${msg}</span>
    </div>`;
  }

  function driveShellHtml(bodyHtml) {
    return `
      <div class="navbar">
        <div class="navbar-tabs">
          <button class="tab" id="driveChatbotTab">Chatbot</button>
          <button class="tab" id="driveWorkspaceTab">Workspace</button>
          <button class="tab active" data-stub="1">Drive</button>
        </div>
        <button class="notif-btn" aria-label="การแจ้งเตือน" data-stub="1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
        </button>
      </div>
      <div class="drv-glow-bg"></div>
      ${bodyHtml}`;
  }

  const DRV_CRUMB_NAV = { personal: openDrivePersonal, work: openDriveWork, org: openDriveOrgKnowledge };
  function bindDriveShell(project) {
    document.getElementById('driveChatbotTab').addEventListener('click', openChatbotPage);
    document.getElementById('driveWorkspaceTab').addEventListener('click', showWorkspacePage);
    drivePage.querySelectorAll('[data-stub]').forEach(el => {
      el.addEventListener('click', () => showToast('ฟีเจอร์นี้ยังไม่พร้อมใช้งานใน prototype นี้'));
    });
    drivePage.querySelectorAll('[data-drive-crumb]').forEach(el => {
      el.addEventListener('click', () => {
        const fn = DRV_CRUMB_NAV[el.dataset.driveCrumb];
        if (fn) fn();
      });
    });
    drivePage.querySelectorAll('[data-drive-view]').forEach(el => {
      el.addEventListener('click', () => {
        const mode = el.dataset.driveView;
        if (mode === DRV_VIEW_MODE) return;
        DRV_VIEW_MODE = mode;
        driveRerenderCurrent();
      });
    });
  }

  // Re-renders whatever Drive page is currently open, e.g. after switching
  // grid/list view mode.
  function driveRerenderCurrent() {
    const a = DRV_LAST_ACTIVE;
    if (a.section === 'personal') return a.folderId ? openDrivePersonalFolder(DRV_PERSONAL_FOLDERS.find(f => f.id === a.folderId)) : openDrivePersonal();
    if (a.section === 'work') return a.projectKey ? openDriveProject(ALL_PROJECTS.find(p => p.keyPrefix === a.projectKey)) : openDriveWork();
    if (a.section === 'org') return a.folderId ? openDriveOrgFolder(DRV_ORG_FOLDERS.find(f => f.id === a.folderId)) : openDriveOrgKnowledge();
    if (a.section === 'recent') return openDriveRecent();
    if (a.section === 'trash') return openDriveTrash();
    return openDriveHome();
  }

  function bindDriveCards(wrap, onOpenFolder) {
    wrap.querySelectorAll('[data-drive-folder]').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-stub]')) return;
        if (onOpenFolder) onOpenFolder(el.dataset.driveFolder);
      });
    });
    wrap.querySelectorAll('[data-drive-file]').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-stub]')) return;
        showToast('ฟีเจอร์นี้ยังไม่พร้อมใช้งานใน prototype นี้');
      });
    });
  }

  // ----- หน้าหลัก -----
  function openDriveHome() {
    ensureDriveSidebar();
    workspacePage.style.display = 'none';
    dashboardPage.style.display = 'none';
    document.getElementById('chatbotPage').style.display = 'none';
    drivePage.style.display = 'block';
    CURRENT_VIEW = null;
    DRV_LAST_ACTIVE = { section: 'home' };

    const bookmarkedFolders = driveAllFolders().filter(f => f.bookmarked);
    const bookmarkedFiles = driveAllFiles().filter(f => f.bookmarked);
    const recentFiles = driveAllFiles().sort((a, b) => b.date - a.date).slice(0, 6);

    drivePage.innerHTML = driveShellHtml(`
      <div class="drv-hero">
        <div class="chat-greeting" style="font-size:40px;">ค้นหา &amp; วิจัยข้อมูลของคุณ</div>
        <div class="prompt-bar" id="driveHeroBar">
          <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <div class="prompt-field">
            <input class="prompt-input" type="text" placeholder="ค้นหาบางอย่าง?" style="background:transparent;border:none;outline:none;color:var(--white);font-family:inherit;flex:1;" />
            <button class="chip" data-stub="1">ค้นหาไฟล์ล่าสุด ?</button>
            <button class="chip" data-stub="1">สรุปงานล่าสุดให้หน่อย ?</button>
          </div>
        </div>
      </div>
      <div class="drv-sections">
        ${driveSectionHtml('โฟลเดอร์สำคัญ', bookmarkedFolders.length ? bookmarkedFolders.map(f => driveFolderCardHtml(f)).join('') : '')}
        ${!bookmarkedFolders.length ? driveEmptyHtml('ยังไม่มีโฟลเดอร์ที่ Bookmark') : ''}
        ${driveSectionHtml('ไฟล์สำคัญ', bookmarkedFiles.length ? bookmarkedFiles.map(driveFileCardHtml).join('') : '')}
        ${!bookmarkedFiles.length ? driveEmptyHtml('ยังไม่มีไฟล์ที่ Bookmark') : ''}
        ${driveSectionHtml('ล่าสุด', recentFiles.map(driveFileCardHtml).join(''))}
      </div>
    `);

    renderDriveSidebar(DRV_LAST_ACTIVE);
    bindDriveShell();
    bindDriveCards(drivePage, (folderId) => {
      const folder = driveAllFolders().find(f => f.id === folderId);
      if (folder && DRV_ORG_FOLDERS.includes(folder)) return openDriveOrgFolder(folder);
      openDrivePersonal();
    });
  }

  // ----- ไดร์ของฉัน -----
  function openDrivePersonal() {
    ensureDriveSidebar();
    workspacePage.style.display = 'none';
    dashboardPage.style.display = 'none';
    document.getElementById('chatbotPage').style.display = 'none';
    drivePage.style.display = 'block';
    CURRENT_VIEW = null;
    DRV_LAST_ACTIVE = { section: 'personal' };

    drivePage.innerHTML = driveShellHtml(`
      ${driveTopSearchHtml()}
      <div class="drv-listing">
        ${driveToolbarHtml('ไดร์ของฉัน', DRV_PERSONAL_FOLDERS.length, { icon: DRV_ICONS.myDrive })}
        <div class="drv-grid ${driveGridModeClass()}">
          ${DRV_PERSONAL_FOLDERS.map(f => driveFolderCardHtml(f)).join('')}
        </div>
      </div>
    `);

    renderDriveSidebar(DRV_LAST_ACTIVE);
    bindDriveShell();
    bindDriveCards(drivePage, (folderId) => {
      const folder = DRV_PERSONAL_FOLDERS.find(f => f.id === folderId);
      if (folder) openDrivePersonalFolder(folder);
    });
  }

  function openDrivePersonalFolder(folder) {
    ensureDriveSidebar();
    workspacePage.style.display = 'none';
    dashboardPage.style.display = 'none';
    document.getElementById('chatbotPage').style.display = 'none';
    drivePage.style.display = 'block';
    CURRENT_VIEW = null;
    DRV_LAST_ACTIVE = { section: 'personal', folderId: folder.id };

    drivePage.innerHTML = driveShellHtml(`
      ${driveTopSearchHtml()}
      <div class="drv-listing">
        ${driveToolbarHtml(folder.name, folder.files.length, { icon: DRV_ICONS.myDrive, crumbLabel: 'ไดร์ของฉัน', crumbKey: 'personal' })}
        <div class="drv-grid ${driveGridModeClass()}">${folder.files.map(driveFileCardHtml).join('')}</div>
        ${!folder.files.length ? driveEmptyHtml('ยังไม่มีไฟล์ในโฟลเดอร์นี้') : ''}
      </div>
    `);

    renderDriveSidebar(DRV_LAST_ACTIVE);
    bindDriveShell();
    bindDriveCards(drivePage, () => showToast('ฟีเจอร์นี้ยังไม่พร้อมใช้งานใน prototype นี้'));
  }

  // ----- ไดร์งาน (root: one folder per joined project) -----
  function openDriveWork() {
    ensureDriveSidebar();
    workspacePage.style.display = 'none';
    dashboardPage.style.display = 'none';
    document.getElementById('chatbotPage').style.display = 'none';
    drivePage.style.display = 'block';
    CURRENT_VIEW = null;
    DRV_LAST_ACTIVE = { section: 'work' };

    drivePage.innerHTML = driveShellHtml(`
      ${driveTopSearchHtml()}
      <div class="drv-listing">
        ${driveToolbarHtml('ไดร์งาน', ALL_PROJECTS.length, { icon: DRV_ICONS.workDrive })}
        <div class="drv-grid ${driveGridModeClass()}">
          ${ALL_PROJECTS.map(p => driveFolderCardHtml({ id: p.keyPrefix, name: p.name, bookmarked: false, shared: true }, { avatarHtml: `<span class="drv-card-avatar">${driveProjectIconHtml(p)}</span>` })).join('')}
        </div>
        ${!ALL_PROJECTS.length ? driveEmptyHtml('ยังไม่มีโปรเจคที่เข้าร่วม') : ''}
      </div>
    `);

    renderDriveSidebar(DRV_LAST_ACTIVE);
    bindDriveShell();
    bindDriveCards(drivePage, (key) => {
      const p = ALL_PROJECTS.find(pr => pr.keyPrefix === key);
      if (p) openDriveProject(p);
    });
  }

  function openDriveProject(project) {
    ensureDriveSidebar();
    workspacePage.style.display = 'none';
    dashboardPage.style.display = 'none';
    document.getElementById('chatbotPage').style.display = 'none';
    drivePage.style.display = 'block';
    CURRENT_VIEW = null;
    DRV_LAST_ACTIVE = { section: 'work', projectKey: project.keyPrefix };

    const files = ensureProjectDriveFiles(project);
    drivePage.innerHTML = driveShellHtml(`
      ${driveTopSearchHtml()}
      <div class="drv-listing">
        ${driveToolbarHtml(project.name, files.length, { icon: DRV_ICONS.workDrive, crumbLabel: 'ไดร์งาน', crumbKey: 'work' })}
        <div class="drv-grid ${driveGridModeClass()}">${files.map(driveFileCardHtml).join('')}</div>
        ${!files.length ? driveEmptyHtml('ยังไม่มีไฟล์ในโปรเจคนี้') : ''}
      </div>
    `);

    renderDriveSidebar(DRV_LAST_ACTIVE);
    bindDriveShell();
    bindDriveCards(drivePage, () => showToast('ฟีเจอร์นี้ยังไม่พร้อมใช้งานใน prototype นี้'));
  }

  // ----- ความรู้องค์กรณ์ (read-only: no "+เพิ่ม" button) -----
  function openDriveOrgKnowledge() {
    ensureDriveSidebar();
    workspacePage.style.display = 'none';
    dashboardPage.style.display = 'none';
    document.getElementById('chatbotPage').style.display = 'none';
    drivePage.style.display = 'block';
    CURRENT_VIEW = null;
    DRV_LAST_ACTIVE = { section: 'org' };

    drivePage.innerHTML = driveShellHtml(`
      ${driveTopSearchHtml()}
      <div class="drv-listing">
        ${driveToolbarHtml('ความรู้องค์กรณ์', DRV_ORG_FOLDERS.length, { icon: DRV_ICONS.org, readOnly: true })}
        <div class="drv-grid ${driveGridModeClass()}">${DRV_ORG_FOLDERS.map(f => driveFolderCardHtml(f)).join('')}</div>
      </div>
    `);

    renderDriveSidebar(DRV_LAST_ACTIVE);
    bindDriveShell();
    bindDriveCards(drivePage, (folderId) => {
      const f = DRV_ORG_FOLDERS.find(x => x.id === folderId);
      if (f) openDriveOrgFolder(f);
    });
  }

  function openDriveOrgFolder(folder) {
    ensureDriveSidebar();
    workspacePage.style.display = 'none';
    dashboardPage.style.display = 'none';
    document.getElementById('chatbotPage').style.display = 'none';
    drivePage.style.display = 'block';
    CURRENT_VIEW = null;
    DRV_LAST_ACTIVE = { section: 'org', folderId: folder.id };

    drivePage.innerHTML = driveShellHtml(`
      ${driveTopSearchHtml()}
      <div class="drv-listing">
        ${driveToolbarHtml(folder.name, folder.files.length, { icon: DRV_ICONS.org, readOnly: true, crumbLabel: 'ความรู้องค์กรณ์', crumbKey: 'org' })}
        <div class="drv-grid ${driveGridModeClass()}">${folder.files.map(driveFileCardHtml).join('')}</div>
        ${!folder.files.length ? driveEmptyHtml('ยังไม่มีไฟล์ในหมวดนี้') : ''}
      </div>
    `);

    renderDriveSidebar(DRV_LAST_ACTIVE);
    bindDriveShell();
    bindDriveCards(drivePage, () => {});
  }

  // ----- ดูล่าสุด / ถังขยะ — mockups only per the design brief -----
  function openDriveRecent() {
    ensureDriveSidebar();
    workspacePage.style.display = 'none';
    dashboardPage.style.display = 'none';
    document.getElementById('chatbotPage').style.display = 'none';
    drivePage.style.display = 'block';
    CURRENT_VIEW = null;
    DRV_LAST_ACTIVE = { section: 'recent' };

    const recentFiles = driveAllFiles().sort((a, b) => b.date - a.date).slice(0, 10);
    drivePage.innerHTML = driveShellHtml(`
      ${driveTopSearchHtml()}
      <div class="drv-listing">
        ${driveToolbarHtml('ดูล่าสุด', recentFiles.length, { icon: DRV_ICONS.clock, readOnly: true })}
        <div class="drv-grid ${driveGridModeClass()}">${recentFiles.map(driveFileCardHtml).join('')}</div>
      </div>
    `);

    renderDriveSidebar(DRV_LAST_ACTIVE);
    bindDriveShell();
    bindDriveCards(drivePage, () => showToast('ฟีเจอร์นี้ยังไม่พร้อมใช้งานใน prototype นี้'));
  }

  function openDriveTrash() {
    ensureDriveSidebar();
    workspacePage.style.display = 'none';
    dashboardPage.style.display = 'none';
    document.getElementById('chatbotPage').style.display = 'none';
    drivePage.style.display = 'block';
    CURRENT_VIEW = null;
    DRV_LAST_ACTIVE = { section: 'trash' };

    drivePage.innerHTML = driveShellHtml(`
      ${driveTopSearchHtml()}
      <div class="drv-listing">
        ${driveToolbarHtml('ถังขยะ', 0, { icon: DRV_ICONS.trash, readOnly: true })}
        <div class="drv-grid ${driveGridModeClass()}"></div>
        ${driveEmptyHtml('ถังขยะว่างเปล่า')}
      </div>
    `);

    renderDriveSidebar(DRV_LAST_ACTIVE);
    bindDriveShell();
  }
