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
    docx: { icon: DRV_ICONS.txt, color: '#2B7BE4' },
    xlsx: { icon: DRV_ICONS.txt, color: '#1E8E3E' },
    pptx: { icon: DRV_ICONS.txt, color: '#E8710A' },
    image: { icon: DRV_ICONS.file, color: '#25A767' },
    default: { icon: DRV_ICONS.file, color: 'var(--grey4)' }
  };

  function driveFile(id, name, opts) {
    opts = opts || {};
    const ext = (name.split('.').pop() || '').toLowerCase();
    const type = ({ doc: 'docx', jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image' })[ext] || ext;
    return { id, name, type, bookmarked: !!opts.bookmarked, date: opts.date || new Date(TODAY_REF), previewUrl: opts.previewUrl || null, note: opts.note || null, linked: !!opts.linked };
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
  // Files added directly to the ไดร์ของฉัน root (not inside a folder).
  let DRV_PERSONAL_ROOT_FILES = [];
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

  // ไดร์งาน folders are the projects themselves; bookmark state lives on the project.
  function driveProjectFolder(p) {
    return { id: p.keyPrefix, name: p.name, shared: true, bookmarked: !!p.driveBookmarked, _project: p };
  }
  function driveAllFolders() {
    return [...DRV_PERSONAL_FOLDERS, ...DRV_ORG_FOLDERS, ...ALL_PROJECTS.map(driveProjectFolder)];
  }
  function driveAllFiles() {
    let files = DRV_PERSONAL_FILES.concat(DRV_PERSONAL_ROOT_FILES);
    ALL_PROJECTS.forEach(p => { files = files.concat(ensureProjectDriveFiles(p)); });
    return files;
  }

  function driveProjectIconHtml(project) {
    const src = (typeof psExtractImageSrc === 'function') ? psExtractImageSrc(project) : null;
    if (src) return `<img src="${src}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${DRV_ICONS.workDrive}</svg>`;
  }

  // ----- bookmark (hover the card -> outline icon; click toggles, feeds หน้าหลัก) -----
  function driveBookmarkBtnHtml(kind, item) {
    const on = !!item.bookmarked;
    return `<button class="drv-bookmark ${on ? 'on' : ''}" data-drive-bookmark="${kind}" data-id="${item.id}" aria-label="${on ? 'เอา Bookmark ออก' : 'Bookmark'}"><svg width="18" height="18" viewBox="0 0 24 24">${DRV_ICONS.bookmark}</svg></button>`;
  }

  function driveToggleBookmark(kind, id) {
    let label;
    if (kind === 'file') {
      const f = driveAllFiles().find(x => x.id === id);
      if (!f) return;
      f.bookmarked = !f.bookmarked;
      label = f.bookmarked ? 'เพิ่มไฟล์ใน "ไฟล์สำคัญ" แล้ว' : 'เอาไฟล์ออกจาก "ไฟล์สำคัญ" แล้ว';
    } else {
      const f = driveAllFolders().find(x => x.id === id);
      if (!f) return;
      if (f._project) f._project.driveBookmarked = !f._project.driveBookmarked;
      else f.bookmarked = !f.bookmarked;
      const on = f._project ? f._project.driveBookmarked : f.bookmarked;
      label = on ? 'เพิ่มโฟลเดอร์ใน "โฟลเดอร์สำคัญ" แล้ว' : 'เอาโฟลเดอร์ออกจาก "โฟลเดอร์สำคัญ" แล้ว';
    }
    const scroller = document.querySelector('main.main');
    const top = scroller ? scroller.scrollTop : 0;
    driveRerenderCurrent();
    if (scroller) scroller.scrollTop = top;
    showToast(label);
  }

  // ----- folder / file cards (193x193, shared by every listing page) -----
  function driveFolderCardHtml(folder, opts) {
    opts = opts || {};
    return `
      <div class="drv-card" data-drive-folder="${folder.id}">
        <div class="drv-card-thumb drv-folder-thumb">
          ${opts.iconHtml || `<img class="drv-folder-glyph" src="${folder.shared ? DRV_FOLDER_GLYPH.shared : DRV_FOLDER_GLYPH.normal}" alt="">`}
          ${driveBookmarkBtnHtml('folder', folder)}
        </div>
        <div class="drv-card-foot">
          <span class="drv-card-name">${opts.avatarHtml || (folder._project ? `<span class="drv-card-avatar">${driveProjectIconHtml(folder._project)}</span>` : '')}${folder.name}</span>
          <button class="drv-card-more" data-stub="1" aria-label="เพิ่มเติม">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${DRV_ICONS.more}</svg>
          </button>
        </div>
      </div>`;
  }

  // Mock page preview shown as the file thumbnail (same content for every file).
  const DRV_DOC_MOCK = `<div class="drv-doc" aria-hidden="true">
      <div class="d-title">Lorem ipsum</div>
      <div class="d-lead">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc ac faucibus odio.</div>
      <p>Vestibulum neque massa, scelerisque sit amet ligula eu, congue molestie mi. Praesent ut varius sem. Nullam at porttitor arcu, nec lacinia nisi. Ut ac dolor vitae odio interdum condimentum. <b>Vivamus dapibus sodales ex, vitae malesuada ipsum cursus convallis. Maecenas sed egestas nulla, ac condimentum orci.</b> Mauris diam felis, vulputate ac suscipit et, iaculis non est. Curabitur semper arcu ac ligula semper, nec luctus nisl blandit. Integer lacinia ante ac libero lobortis imperdiet. <i>Nullam mollis convallis ipsum, ac accumsan nunc vehicula vitae.</i> Nulla eget justo in felis tristique fringilla. Morbi sit amet tortor quis risus auctor condimentum. Morbi in ullamcorper elit. Nulla iaculis tellus sit amet mauris tempus fringilla.</p>
      <p>Maecenas mauris lectus, lobortis et purus mattis, blandit dictum tellus.</p>
      <ul>
        <li><b>Maecenas non lorem quis tellus placerat varius.</b></li>
        <li><i>Nulla facilisi.</i></li>
        <li><u>Aenean congue fringilla justo ut aliquam.</u></li>
        <li>Mauris id ex erat. Nunc vulputate neque vitae justo facilisis, non condimentum ante sagittis.</li>
      </ul>
    </div>`;

  function driveDocPreviewHtml(file) {
    if (file.previewUrl) return `<img class="drv-file-photo" src="${file.previewUrl}" alt="">`;
    if (file.note) return `<div class="drv-doc" aria-hidden="true">${file.note.title ? `<div class="d-title">${file.note.title}</div>` : ''}<p>${file.note.body}</p></div>`;
    return DRV_DOC_MOCK;
  }

  function driveFileCardHtml(file) {
    const meta = DRV_FILE_TYPES[file.type] || DRV_FILE_TYPES.default;
    return `
      <div class="drv-card" data-drive-file="${file.id}">
        <div class="drv-card-thumb drv-file-thumb">
          ${driveDocPreviewHtml(file)}
          ${file.previewUrl ? '' : `<svg class="drv-file-bigicon" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="${meta.color}" stroke-width="1.3">${meta.icon}</svg>`}
          ${driveBookmarkBtnHtml('file', file)}
        </div>
        <div class="drv-card-foot">
          <span class="drv-card-name">
            <svg width="16" height="16" viewBox="0 0 16 16" style="flex-shrink:0;"><path d="M4 1.5h5.5L13 5v9a.5.5 0 0 1-.5.5h-8.5A1.5 1.5 0 0 1 2.5 13V3A1.5 1.5 0 0 1 4 1.5z" fill="${meta.color}"/><path d="M5 8.2h6M5 10.2h6M5 12.2h4" stroke="#fff" stroke-width="1" stroke-linecap="round"/></svg>
            ${file.linked ? '<img src="assets/icons/menu-gdrive.svg" width="12" height="12" alt="" title="เชื่อมโยงจาก Google Drive" style="flex-shrink:0;">' : ''}${file.name}
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
          <div class="drv-nav-header ${active.section === 'personal' && !active.folderId ? 'active' : ''}" data-drive-toggle="personal">
            <div class="left">
              <svg class="drv-nav-chev ${DRV_OPEN.personal ? 'open' : ''}" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">${DRV_ICONS.chevDown}</svg>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${DRV_ICONS.myDrive}</svg>
              <span class="label">ไดร์ของฉัน</span>
            </div>
            <button class="icon-btn" style="width:16px;height:16px;" data-drive-add-folder="1" aria-label="สร้างโฟลเดอร์ใหม่" onclick="event.stopPropagation()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${DRV_ICONS.plusSm}</svg>
            </button>
          </div>
          ${DRV_OPEN.personal ? `<div class="drv-nav-subs">${DRV_PERSONAL_FOLDERS.map(f => `
              <div class="drv-nav-sub ${active.section === 'personal' && active.folderId === f.id ? 'active' : ''}" data-drive-personal-folder="${f.id}">
                <span class="drv-nav-avatar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${DRV_ICONS.folder}</svg></span>
                <span class="label">${f.name}</span>
              </div>`).join('')}</div>` : ''}
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
    driveSidebar.querySelectorAll('[data-drive-add-folder]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        openNewFolderModal();
      });
    });
    driveSidebar.querySelectorAll('[data-drive-personal-folder]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const f = DRV_PERSONAL_FOLDERS.find(x => x.id === el.dataset.drivePersonalFolder);
        if (f) openDrivePersonalFolder(f);
      });
    });
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
          ${opts.readOnly ? '' : `<button class="drv-add-btn" ${opts.addMenu ? `data-drive-add-menu="${opts.addMenu}"` : 'data-stub="1"'}>
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
    closeDriveAddMenu();
    drivePage.querySelectorAll('[data-drive-add-menu]').forEach(el => {
      el.addEventListener('click', (e) => { e.stopPropagation(); toggleDriveAddMenu(el); });
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
    wrap.querySelectorAll('[data-drive-bookmark]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        driveToggleBookmark(btn.dataset.driveBookmark, btn.dataset.id);
      });
    });
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
      if (!folder) return;
      if (folder._project) return openDriveProject(folder._project);
      if (DRV_ORG_FOLDERS.includes(folder)) return openDriveOrgFolder(folder);
      openDrivePersonalFolder(folder);
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
        ${driveToolbarHtml('ไดร์ของฉัน', DRV_PERSONAL_FOLDERS.length + DRV_PERSONAL_ROOT_FILES.length, { icon: DRV_ICONS.myDrive, addMenu: 'root' })}
        <div class="drv-grid ${driveGridModeClass()}">
          ${DRV_PERSONAL_FOLDERS.map(f => driveFolderCardHtml(f)).join('')}
          ${DRV_PERSONAL_ROOT_FILES.map(driveFileCardHtml).join('')}
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
        ${driveToolbarHtml(folder.name, folder.files.length, { icon: DRV_ICONS.myDrive, crumbLabel: 'ไดร์ของฉัน', crumbKey: 'personal', addMenu: 'folder' })}
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
          ${ALL_PROJECTS.map(p => driveFolderCardHtml(driveProjectFolder(p))).join('')}
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

  // ----- สร้างโฟลเดอร์ใหม่ (ไดร์ของฉัน) -----
  const newFolderOverlay = document.getElementById('newFolderOverlay');
  const newFolderInput = document.getElementById('newFolderInput');
  const newFolderError = document.getElementById('newFolderError');

  function openNewFolderModal() {
    newFolderInput.value = '';
    newFolderError.classList.remove('show');
    newFolderOverlay.classList.add('open');
    newFolderInput.focus();
  }
  function closeNewFolderModal() { newFolderOverlay.classList.remove('open'); }

  function submitNewFolder() {
    // Names are interpolated into innerHTML across Drive, so store them HTML-escaped.
    const name = newFolderInput.value.trim().replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    if (!name) { newFolderError.textContent = 'กรอกชื่อโฟลเดอร์ก่อนนะ'; newFolderError.classList.add('show'); return; }
    if (DRV_PERSONAL_FOLDERS.some(f => f.name === name)) { newFolderError.textContent = 'มีโฟลเดอร์ชื่อนี้อยู่แล้ว'; newFolderError.classList.add('show'); return; }
    DRV_PERSONAL_FOLDERS.push({ id: 'p-' + Date.now(), name, bookmarked: false, files: [] });
    DRV_OPEN.personal = true;
    closeNewFolderModal();
    showToast('สร้างโฟลเดอร์ "' + newFolderInput.value.trim() + '" แล้ว');
    openDrivePersonal();
  }

  newFolderInput.addEventListener('input', () => newFolderError.classList.remove('show'));
  newFolderInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitNewFolder(); });
  document.getElementById('newFolderCancel').addEventListener('click', closeNewFolderModal);
  document.getElementById('newFolderConfirm').addEventListener('click', submitNewFolder);
  newFolderOverlay.addEventListener('mousedown', (e) => { if (e.target === newFolderOverlay) closeNewFolderModal(); });

  // ----- เมนู "+ เพิ่ม" (Figma node 510:144749) -----
  // Only "สร้างโฟลเดอร์ใหม่" is functional; the rest are prototype stubs.
  const DRV_ADD_ITEMS = [
    { icon: 'menu-upload', label: 'Upload Files or Photo', action: 'upload' },
    { icon: 'menu-link', label: 'ลิงก์เว็บ', action: 'link' },
    { icon: 'menu-note', label: 'โน๊ต', action: 'note' },
    { icon: 'menu-youtube', label: 'YouTube', action: 'youtube' },
    { icon: 'menu-gdrive', label: 'Add from Google Drive', action: 'gdrive' },
    { icon: 'menu-research', label: 'Advance Research', hint: '(More Token)', action: 'research' },
    { icon: 'menu-websearch', label: 'Web Search', action: 'web' }
  ];

  const driveAddMenu = document.createElement('div');
  driveAddMenu.className = 'drv-addmenu';
  document.body.appendChild(driveAddMenu);

  function closeDriveAddMenu() { driveAddMenu.classList.remove('open'); }

  // mode 'root' also offers folder creation; inside a folder it is omitted (no nested folders).
  function toggleDriveAddMenu(btn) {
    if (driveAddMenu.classList.contains('open')) { closeDriveAddMenu(); return; }
    const canCreateFolder = btn.dataset.driveAddMenu === 'root';
    driveAddMenu.innerHTML = `
      <div class="drv-addmenu-group">${DRV_ADD_ITEMS.map(it => `
        <button class="drv-addmenu-item" data-add-action="${it.action || 'stub'}">
          <img src="assets/icons/${it.icon}.svg" width="16" height="16" alt="">
          <span>${it.label}</span>${it.hint ? `<span class="hint">${it.hint}</span>` : ''}
        </button>`).join('')}
      </div>
      ${canCreateFolder ? `
      <img src="assets/icons/menu-line.svg" width="160" height="1" alt="">
      <button class="drv-addmenu-item drv-addmenu-folder" data-add-action="folder">
        <img src="assets/icons/menu-folder.svg" width="16" height="16" alt="">
        <span>สร้างโฟลเดอร์ใหม่</span>
      </button>` : ''}`;
    driveAddMenu.querySelectorAll('[data-add-action]').forEach(el => {
      el.addEventListener('click', () => {
        closeDriveAddMenu();
        const act = el.dataset.addAction;
        if (act === 'folder') openNewFolderModal();
        else if (act === 'upload') driveUploadInput.click();
        else if (act === 'link' || act === 'youtube' || act === 'note') openDriveAddModal(act);
        else if (act === 'gdrive') openGoogleDriveModal();
        else if (act === 'research' || act === 'web') openAiPanel(act);
        else showToast('ฟีเจอร์นี้ยังไม่พร้อมใช้งานใน prototype นี้');
      });
    });
    const r = btn.getBoundingClientRect();
    driveAddMenu.style.top = (r.bottom + 8) + 'px';
    driveAddMenu.style.right = (window.innerWidth - r.right) + 'px';
    driveAddMenu.classList.add('open');
  }

  document.addEventListener('mousedown', (e) => {
    if (driveAddMenu.classList.contains('open') && !driveAddMenu.contains(e.target) && !e.target.closest('[data-drive-add-menu]')) closeDriveAddMenu();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDriveAddMenu(); });
  window.addEventListener('resize', closeDriveAddMenu);

  // ----- เพิ่มไฟล์เข้าไดร์ของฉัน: อัปโหลด / ลิงก์เว็บ / โน๊ต / YouTube -----
  let DRV_ADD_SEQ = 0;

  function driveEsc(str) {
    return str.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // New files go into the folder currently open, or the ไดร์ของฉัน root.
  function driveAddTargetFiles() {
    // Called from the AI panel on other pages too: outside Drive, save to the root.
    if (drivePage.style.display === 'none') return DRV_PERSONAL_ROOT_FILES;
    const a = DRV_LAST_ACTIVE;
    if (a.section === 'personal' && a.folderId) {
      const f = DRV_PERSONAL_FOLDERS.find(x => x.id === a.folderId);
      if (f) return f.files;
    }
    return DRV_PERSONAL_ROOT_FILES;
  }

  function driveAddFile(name, opts) {
    opts = opts || {};
    opts.date = new Date(new Date(TODAY_REF).getTime() + 1000 * (++DRV_ADD_SEQ));
    const file = driveFile('u-' + Date.now() + '-' + DRV_ADD_SEQ, name, opts);
    driveAddTargetFiles().unshift(file);
    return file;
  }

  function driveRefreshKeepScroll() {
    const scroller = document.querySelector('main.main');
    const top = scroller ? scroller.scrollTop : 0;
    driveRerenderCurrent();
    if (scroller) scroller.scrollTop = top;
  }

  // 1. Upload from the computer (native file picker)
  const driveUploadInput = document.createElement('input');
  driveUploadInput.type = 'file';
  driveUploadInput.multiple = true;
  driveUploadInput.style.display = 'none';
  document.body.appendChild(driveUploadInput);
  driveUploadInput.addEventListener('change', () => {
    const files = Array.from(driveUploadInput.files || []);
    files.forEach(f => {
      const isImage = /^image\//.test(f.type);
      driveAddFile(driveEsc(f.name), { previewUrl: isImage ? URL.createObjectURL(f) : null });
    });
    driveUploadInput.value = '';
    if (!files.length) return;
    driveRefreshKeepScroll();
    showToast(files.length === 1 ? 'อัปโหลด "' + files[0].name + '" แล้ว' : 'อัปโหลด ' + files.length + ' ไฟล์แล้ว');
  });

  // 2-4. Link / YouTube / Note modals (Figma 510:143408, 510:143830, 510:144185)
  const DRV_ADD_MODALS = {
    link: { icon: 'modal-link', title: 'ลิงก์เว็บ' },
    youtube: { icon: 'menu-youtube', title: 'YouTube' },
    note: { icon: 'modal-note', title: 'โน๊ต' }
  };

  const driveAddOverlay = document.createElement('div');
  driveAddOverlay.className = 'drv-modal-overlay';
  document.body.appendChild(driveAddOverlay);
  let driveAddBusy = false;
  let driveAddTimer = null;

  function closeDriveAddModal() {
    clearInterval(driveAddTimer);
    driveAddBusy = false;
    driveAddOverlay.classList.remove('open');
    driveAddOverlay.innerHTML = '';
  }

  function openDriveAddModal(kind) {
    const m = DRV_ADD_MODALS[kind];
    const body = kind === 'note' ? `
        <div class="drv-modal-field">
          <label for="drvAddTitle">หัวข้อ (ไม่บังคับ)</label>
          <input id="drvAddTitle" type="text" placeholder="เช่น บันทึกประชุม" autocomplete="off">
        </div>
        <div class="drv-modal-field">
          <label for="drvAddBody">เนื้อหา</label>
          <textarea id="drvAddBody" placeholder="โปรดระบุรายละเอียด"></textarea>
        </div>` : `
        <div class="drv-modal-field">
          <label for="drvAddUrl">${kind === 'youtube' ? 'แนบลิงก์ Youtube' : 'แนบลิงก์'}</label>
          <input id="drvAddUrl" type="text" placeholder="${kind === 'youtube' ? 'Youtube URL' : 'https://...'}" autocomplete="off">
        </div>`;
    driveAddOverlay.innerHTML = `
      <div class="drv-modal" role="dialog" aria-label="${m.title}">
        <div class="drv-modal-head"><img src="assets/icons/${m.icon}.svg" width="16" height="16" alt=""><span>${m.title}</span></div>
        <div class="drv-modal-body">${body}<div class="drv-modal-error" id="drvAddError"></div></div>
        <div class="drv-modal-actions">
          <button class="drv-modal-cancel" id="drvAddCancel">ยกเลิก</button>
          <button class="drv-modal-ok" id="drvAddOk">ตกลง</button>
        </div>
      </div>`;
    driveAddOverlay.classList.add('open');
    const first = driveAddOverlay.querySelector('input');
    first.focus();
    const err = document.getElementById('drvAddError');
    const ok = document.getElementById('drvAddOk');
    // ตกลง stays disabled until there is something to submit.
    const fields = Array.from(driveAddOverlay.querySelectorAll('input,textarea'));
    const syncOk = () => { ok.disabled = !fields.some(el => el.value.trim()); };
    syncOk();
    fields.forEach(el => el.addEventListener('input', () => { err.textContent = ''; syncOk(); }));
    document.getElementById('drvAddCancel').addEventListener('click', closeDriveAddModal);
    ok.addEventListener('click', () => submitDriveAddModal(kind));
    driveAddOverlay.querySelectorAll('input').forEach(el => el.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !ok.disabled) submitDriveAddModal(kind); }));
  }

  function driveYoutubeId(url) {
    const m = url.match(/^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i);
    return m ? m[1] : null;
  }

  function submitDriveAddModal(kind) {
    if (driveAddBusy) return;
    const err = document.getElementById('drvAddError');
    if (kind === 'note') {
      const title = document.getElementById('drvAddTitle').value.trim();
      const text = document.getElementById('drvAddBody').value.trim();
      if (!title && !text) return;
      const name = (title || text.split('\n')[0]).slice(0, 40).trim();
      driveAddFile(driveEsc(name) + '.txt', { note: { title: driveEsc(title), body: driveEsc(text).replace(/\n/g, '<br>') } });
      closeDriveAddModal();
      driveRefreshKeepScroll();
      showToast('สร้างโน๊ต "' + name + '" แล้ว');
      return;
    }
    const url = document.getElementById('drvAddUrl').value.trim();
    let fileName;
    let progressText;
    if (kind === 'youtube') {
      const id = driveYoutubeId(url);
      if (!id) { err.textContent = 'ลิงก์ YouTube ไม่ถูกต้อง'; return; }
      fileName = 'สรุปวิดีโอ YouTube - ' + id + '.docx';
      progressText = 'AI กำลังสรุปวิดีโอ';
    } else {
      let host;
      try {
        const u = new URL(url);
        if (!/^https?:$/.test(u.protocol) || !u.hostname.includes('.')) throw new Error('bad');
        host = u.hostname.replace(/^www\./, '');
      } catch (e) { err.textContent = 'กรอกลิงก์ให้ถูกต้อง (เริ่มด้วย https://)'; return; }
      fileName = 'สรุปเว็บไซต์ - ' + host + '.docx';
      progressText = 'AI กำลังอ่านเว็บไซต์และสรุป';
    }
    // Swap the form for a progress view, then drop in a mock Word file.
    driveAddBusy = true;
    const modal = driveAddOverlay.querySelector('.drv-modal');
    modal.querySelector('.drv-modal-body').innerHTML = `
      <div class="drv-progress">
        <div class="drv-spinner"></div>
        <div class="drv-progress-text">${progressText}<span class="drv-dots"></span></div>
        <div class="drv-progress-sub">${driveEsc(url)}</div>
        <div class="drv-progress-track"><div class="drv-progress-fill" id="drvProgressFill"></div></div>
      </div>`;
    modal.querySelector('.drv-modal-actions').style.display = 'none';
    const fill = document.getElementById('drvProgressFill');
    let pct = 0;
    driveAddTimer = setInterval(() => {
      pct += 2;
      fill.style.width = Math.min(pct, 100) + '%';
      if (pct >= 100) {
        clearInterval(driveAddTimer);
        setTimeout(() => {
          if (!driveAddBusy) return;
          driveAddFile(driveEsc(fileName));
          closeDriveAddModal();
          driveRefreshKeepScroll();
          showToast('สรุปเสร็จแล้ว — เพิ่มไฟล์ "' + fileName + '" แล้ว');
        }, 250);
      }
    }, 50);
  }

  driveAddOverlay.addEventListener('mousedown', (e) => { if (e.target === driveAddOverlay && !driveAddBusy) closeDriveAddModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && driveAddOverlay.classList.contains('open') && !driveAddBusy) closeDriveAddModal(); });

  // ----- Add from Google Drive (Figma 510:144943 = Google Picker "Open files") -----
  // Mock Google Drive: pick files across tabs (or upload into Drive via the Upload tab),
  // then choose to import a copy (default) or keep a live link.
  const DRV_GD_TABS = ['My Drive', 'Shared with Me', 'Starred', 'Recent', 'Upload'];
  const gd = (id, name, kind, owner, modified, extra) => Object.assign({ id, name, kind, owner, modified }, extra || {});
  const DRV_GD_FOLDERS = [
    gd('gd-f1', 'งานลูกค้า', 'folder', 'me', 'Aug 6, 2026', { children: [
      gd('gd-f1-1', 'ข้อเสนอโครงการ Thai IOD', 'doc', 'me', 'Aug 5, 2026'),
      gd('gd-f1-2', 'สัญญาบริการ.pdf', 'pdf', 'me', 'Jul 30, 2026'),
      gd('gd-f1-3', 'ตารางเวลาโครงการ', 'sheet', 'me', 'Jul 28, 2026')
    ] }),
    gd('gd-f2', 'บันทึกประชุม', 'folder', 'me', 'Aug 10, 2026', { children: [
      gd('gd-f2-1', 'ประชุมทีม 10 ส.ค.', 'doc', 'me', 'Aug 10, 2026'),
      gd('gd-f2-2', 'ประชุมลูกค้า Prolog', 'doc', 'me', 'Aug 3, 2026')
    ] })
  ];
  const DRV_GD_MYDRIVE = DRV_GD_FOLDERS.concat([
    gd('gd-1', 'แผนการตลาด Q3', 'doc', 'me', 'Aug 9, 2026', { starred: true }),
    gd('gd-2', 'งบประมาณ 2569', 'sheet', 'me', 'Aug 8, 2026'),
    gd('gd-3', 'Company Profile 2026', 'slide', 'me', 'Aug 1, 2026'),
    gd('gd-4', 'คู่มือพนักงาน.pdf', 'pdf', 'me', 'Jul 20, 2026', { starred: true }),
    gd('gd-5', 'โลโก้บริษัท.png', 'image', 'me', 'Jun 15, 2026')
  ]);
  const DRV_GD_SHARED = [
    gd('gd-s1', 'นโยบายความปลอดภัยข้อมูล', 'doc', 'ฝ่าย IT', 'Aug 7, 2026'),
    gd('gd-s2', 'รายชื่อผู้ติดต่อ', 'sheet', 'ฝ่ายขาย', 'Aug 2, 2026'),
    gd('gd-s3', 'Roadmap ผลิตภัณฑ์', 'slide', 'ฝ่ายผลิตภัณฑ์', 'Jul 25, 2026')
  ];
  const gdAll = () => {
    const flat = [];
    (function walk(list) { list.forEach(i => { flat.push(i); if (i.children) walk(i.children); }); })(DRV_GD_MYDRIVE.concat(DRV_GD_SHARED));
    return flat;
  };

  const GD_KIND = {
    folder: { color: '#5f6368', ext: '' },
    doc: { color: '#4285f4', ext: '.docx' },
    sheet: { color: '#0f9d58', ext: '.xlsx' },
    slide: { color: '#f4b400', ext: '.pptx' },
    pdf: { color: '#ea4335', ext: '' },
    image: { color: '#d93025', ext: '' },
    file: { color: '#5f6368', ext: '' }
  };
  function gdIconHtml(kind) {
    const c = GD_KIND[kind].color;
    if (kind === 'folder') return `<svg width="20" height="20" viewBox="0 0 24 24" fill="${c}"><path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"/></svg>`;
    return `<svg width="20" height="20" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2.5" fill="${c}"/><path d="M8 9h8M8 13h8M8 17h5" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>`;
  }
  const gdFileName = (it) => it.name + GD_KIND[it.kind].ext;

  const driveGdOverlay = document.createElement('div');
  driveGdOverlay.className = 'drv-modal-overlay';
  document.body.appendChild(driveGdOverlay);
  const gdUploadInput = document.createElement('input');
  gdUploadInput.type = 'file'; gdUploadInput.multiple = true; gdUploadInput.style.display = 'none';
  document.body.appendChild(gdUploadInput);

  let gdTab = 'My Drive';
  let gdFolder = null;
  let gdSel = new Set();
  let gdBusy = false;
  let gdTimer = null;
  let gdUploadSeq = 0;

  function closeGoogleDriveModal() {
    clearInterval(gdTimer);
    gdBusy = false;
    driveGdOverlay.classList.remove('open');
    driveGdOverlay.innerHTML = '';
  }

  function openGoogleDriveModal() {
    gdTab = 'My Drive'; gdFolder = null; gdSel = new Set();
    driveGdOverlay.classList.add('open');
    gdRenderPicker();
  }

  function gdTabItems() {
    if (gdTab === 'My Drive') return gdFolder ? gdFolder.children : DRV_GD_MYDRIVE;
    if (gdTab === 'Shared with Me') return DRV_GD_SHARED;
    if (gdTab === 'Starred') return gdAll().filter(i => i.starred);
    return gdAll().filter(i => i.kind !== 'folder').sort((a, b) => new Date(b.modified) - new Date(a.modified)).slice(0, 6);
  }

  function gdRenderPicker() {
    const items = gdTab === 'Upload' ? [] : gdTabItems();
    const body = gdTab === 'Upload' ? `
      <div class="drv-gp-drop" id="gdDrop">
        <div class="drv-gp-drop-title">Drag a file here</div>
        <div class="drv-gp-drop-sub">Or, if you prefer...</div>
        <button class="drv-gp-btn primary" id="gdPickDevice">Select a file from your device</button>
      </div>` : `
      ${gdTab === 'My Drive' && gdFolder ? `<div class="drv-gp-crumb"><span data-gp-up>My Drive</span><span class="sep">›</span><b>${driveEsc(gdFolder.name)}</b></div>` : ''}
      <div class="drv-gp-list">
        <div class="drv-gp-row head"><span></span><span>Name</span><span>Owner</span><span>Last modified</span></div>
        ${items.length ? items.map(i => `
        <div class="drv-gp-row ${gdSel.has(i.id) ? 'sel' : ''}" data-gp-item="${i.id}">
          <span class="chk">${i.kind === 'folder' ? '' : `<span class="box">${gdSel.has(i.id) ? '✓' : ''}</span>`}</span>
          <span class="nm">${gdIconHtml(i.kind)}<span>${driveEsc(i.name)}</span></span>
          <span class="mut">${driveEsc(i.owner)}</span>
          <span class="mut">${driveEsc(i.modified)}</span>
        </div>`).join('') : '<div class="drv-gp-empty">No files here</div>'}
      </div>`;
    driveGdOverlay.innerHTML = `
      <div class="drv-gp" role="dialog" aria-label="Open files">
        <div class="drv-gp-head">
          <div class="drv-gp-title">Open files</div>
          <div class="drv-gp-tabs">${DRV_GD_TABS.map(t => `<button class="drv-gp-tab ${t === gdTab ? 'active' : ''}" data-gp-tab="${t}">${t}</button>`).join('')}</div>
        </div>
        <div class="drv-gp-body">${body}</div>
        <div class="drv-gp-foot">
          <button class="drv-gp-btn primary" id="gdOpen" ${gdSel.size ? '' : 'disabled'}>Open</button>
          <button class="drv-gp-btn" id="gdCancel">Cancel</button>
        </div>
      </div>`;

    driveGdOverlay.querySelectorAll('[data-gp-tab]').forEach(b => b.addEventListener('click', () => {
      gdTab = b.dataset.gpTab; gdFolder = null; gdRenderPicker();
    }));
    const up = driveGdOverlay.querySelector('[data-gp-up]');
    if (up) up.addEventListener('click', () => { gdFolder = null; gdRenderPicker(); });
    driveGdOverlay.querySelectorAll('[data-gp-item]').forEach(row => row.addEventListener('click', () => {
      const it = gdAll().find(x => x.id === row.dataset.gpItem);
      if (!it) return;
      if (it.kind === 'folder') { gdFolder = it; gdRenderPicker(); return; }
      if (gdSel.has(it.id)) gdSel.delete(it.id); else gdSel.add(it.id);
      gdRenderPicker();
    }));
    document.getElementById('gdCancel').addEventListener('click', closeGoogleDriveModal);
    document.getElementById('gdOpen').addEventListener('click', gdRenderConfirm);
    if (gdTab === 'Upload') {
      document.getElementById('gdPickDevice').addEventListener('click', () => gdUploadInput.click());
      const drop = document.getElementById('gdDrop');
      drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
      drop.addEventListener('dragleave', () => drop.classList.remove('over'));
      drop.addEventListener('drop', (e) => { e.preventDefault(); gdHandleUpload(Array.from(e.dataTransfer.files || [])); });
    }
  }

  // Uploading here puts the file into (mock) Google Drive, selected and ready to open.
  function gdHandleUpload(files) {
    if (!files.length) return;
    files.forEach(f => {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      const kind = /^image\//.test(f.type) ? 'image' : ext === 'pdf' ? 'pdf' : 'file';
      const it = gd('gd-up-' + Date.now() + '-' + (++gdUploadSeq), f.name, kind, 'me', 'Just now', { file: f });
      DRV_GD_MYDRIVE.unshift(it);
      gdSel.add(it.id);
    });
    gdTab = 'My Drive'; gdFolder = null;
    gdRenderPicker();
  }
  gdUploadInput.addEventListener('change', () => { gdHandleUpload(Array.from(gdUploadInput.files || [])); gdUploadInput.value = ''; });

  // Step 2: import a copy (default, recommended) or keep a live link.
  function gdRenderConfirm() {
    const items = gdAll().filter(i => gdSel.has(i.id));
    if (!items.length) return;
    const chips = items.slice(0, 3).map(i => `<span class="drv-gd-chip">${gdIconHtml(i.kind)}<span>${driveEsc(gdFileName(i))}</span></span>`).join('')
      + (items.length > 3 ? `<span class="drv-gd-more">+${items.length - 3} ไฟล์</span>` : '');
    driveGdOverlay.innerHTML = `
      <div class="drv-modal" role="dialog" aria-label="Add from Google Drive">
        <div class="drv-modal-head"><img src="assets/icons/menu-gdrive.svg" width="16" height="16" alt=""><span>Add from Google Drive</span></div>
        <div class="drv-modal-body">
          <div class="drv-gd-chips">${chips}</div>
          <label class="drv-gd-opt"><input type="radio" name="gdMode" value="copy" checked>
            <span><b>นำเข้าสำเนา <em>แนะนำ</em></b><small>คัดลอกไฟล์เข้าไดร์ของฉัน AI อ่านเนื้อหาได้เสถียร แต่จะไม่อัปเดตตามต้นฉบับ</small></span></label>
          <label class="drv-gd-opt"><input type="radio" name="gdMode" value="link">
            <span><b>เชื่อมโยงไฟล์</b><small>คงไฟล์ไว้ใน Google Drive และอัปเดตตามต้นฉบับ แต่ต้องมีสิทธิ์เข้าถึงตลอด</small></span></label>
        </div>
        <div class="drv-modal-actions">
          <button class="drv-modal-cancel" id="gdConfirmCancel">ยกเลิก</button>
          <button class="drv-modal-ok" id="gdConfirmOk">ตกลง</button>
        </div>
      </div>`;
    document.getElementById('gdConfirmCancel').addEventListener('click', closeGoogleDriveModal);
    document.getElementById('gdConfirmOk').addEventListener('click', () => {
      const mode = driveGdOverlay.querySelector('input[name="gdMode"]:checked').value;
      gdImport(items, mode);
    });
  }

  function gdImport(items, mode) {
    gdBusy = true;
    const isLink = mode === 'link';
    const modal = driveGdOverlay.querySelector('.drv-modal');
    modal.querySelector('.drv-modal-body').innerHTML = `
      <div class="drv-progress">
        <div class="drv-spinner"></div>
        <div class="drv-progress-text">${isLink ? 'กำลังเชื่อมโยงไฟล์จาก Google Drive' : 'กำลังนำเข้าไฟล์จาก Google Drive'}<span class="drv-dots"></span></div>
        <div class="drv-progress-sub">${items.length} ไฟล์</div>
        <div class="drv-progress-track"><div class="drv-progress-fill" id="gdProgressFill"></div></div>
      </div>`;
    modal.querySelector('.drv-modal-actions').style.display = 'none';
    const fill = document.getElementById('gdProgressFill');
    let pct = 0;
    gdTimer = setInterval(() => {
      pct += 3;
      fill.style.width = Math.min(pct, 100) + '%';
      if (pct < 100) return;
      clearInterval(gdTimer);
      setTimeout(() => {
        if (!gdBusy) return;
        items.forEach(i => driveAddFile(driveEsc(gdFileName(i)), {
          linked: isLink,
          previewUrl: i.file && i.kind === 'image' ? URL.createObjectURL(i.file) : null
        }));
        closeGoogleDriveModal();
        driveRefreshKeepScroll();
        showToast((isLink ? 'เชื่อมโยง ' : 'นำเข้า ') + items.length + ' ไฟล์จาก Google Drive แล้ว');
      }, 250);
    }, 50);
  }

  driveGdOverlay.addEventListener('mousedown', (e) => { if (e.target === driveGdOverlay && !gdBusy) closeGoogleDriveModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && driveGdOverlay.classList.contains('open') && !gdBusy) closeGoogleDriveModal(); });
