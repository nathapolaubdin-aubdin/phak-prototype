  // ---------- Project settings modal (จัดการชื่อ/รูปปกของโปรเจค) ----------
  // Reuses the same .modal-overlay/.modal-box/.modal-form/.modal-icon component
  // as the "สร้างโปรเจคใหม่" modal, but as its own DOM/ids so the create-project
  // wizard's state machine is never touched.
  const psOverlay = document.getElementById('projectSettingsOverlay');
  const psIcon = document.getElementById('psIcon');
  const psIconDefault = document.getElementById('psIconDefault');
  const psImageInput = document.getElementById('psImageInput');
  const psRemoveCover = document.getElementById('psRemoveCover');
  const psNameInput = document.getElementById('psNameInput');
  const psNameError = document.getElementById('psNameError');

  let psActiveProject = null;
  let psPendingImageFile = null;
  let psPendingRemoved = false;
  let psPendingImageUrl = null;

  function psExtractImageSrc(project) {
    if (project.imageUrl) return project.imageUrl;
    if (project.avatarContent) {
      const tmp = document.createElement('div');
      tmp.innerHTML = project.avatarContent;
      const img = tmp.querySelector('img');
      if (img) return img.src;
    }
    return null;
  }

  function psAvatarContentHtml(project, src) {
    if (src) return `<img src="${src}" style="width:100%;height:100%;object-fit:cover;" alt="${project.name}" />`;
    const initial = (project.name || '?').trim().charAt(0).toUpperCase() || '?';
    return `<span style="font-size:22px; font-weight:700;">${initial}</span>`;
  }

  function psSidebarIconHtml(src, name) {
    if (src) return `<img src="${src}" alt="${name}" />`;
    return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="7" width="18" height="13" rx="2"/></svg>';
  }

  function openProjectSettings(project) {
    psActiveProject = project;
    psPendingImageFile = null;
    psPendingRemoved = false;
    psPendingImageUrl = null;

    psNameInput.value = project.name || '';
    psNameError.classList.remove('show');

    psIcon.querySelectorAll('img').forEach(el => el.remove());
    const src = psExtractImageSrc(project);
    if (src) {
      const img = document.createElement('img');
      img.src = src;
      img.alt = 'รูปโปรเจค';
      psIcon.insertBefore(img, psIcon.firstChild);
      psIconDefault.style.display = 'none';
      psRemoveCover.style.display = '';
    } else {
      psIconDefault.style.display = '';
      psRemoveCover.style.display = 'none';
    }

    psOverlay.classList.add('open');
    psNameInput.focus();
  }

  function closeProjectSettings() {
    psOverlay.classList.remove('open');
    psImageInput.value = '';
    psActiveProject = null;
    psPendingImageFile = null;
    psPendingRemoved = false;
    psPendingImageUrl = null;
  }

  function psShowPreview(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('รองรับเฉพาะไฟล์รูปภาพเท่านั้น');
      return;
    }
    if (psPendingImageUrl) URL.revokeObjectURL(psPendingImageUrl);
    psPendingImageUrl = URL.createObjectURL(file);
    psPendingImageFile = file;
    psPendingRemoved = false;
    psIcon.querySelectorAll('img').forEach(el => el.remove());
    const img = document.createElement('img');
    img.src = psPendingImageUrl;
    img.alt = 'รูปโปรเจค';
    psIcon.insertBefore(img, psIcon.firstChild);
    psIconDefault.style.display = 'none';
    psRemoveCover.style.display = '';
  }

  psIcon.addEventListener('click', () => psImageInput.click());
  psImageInput.addEventListener('change', () => {
    if (psImageInput.files && psImageInput.files[0]) psShowPreview(psImageInput.files[0]);
  });
  ['dragenter', 'dragover'].forEach(evt => {
    psIcon.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); psIcon.classList.add('drag-over'); });
  });
  ['dragleave', 'dragend'].forEach(evt => {
    psIcon.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); psIcon.classList.remove('drag-over'); });
  });
  psIcon.addEventListener('drop', (e) => {
    e.preventDefault(); e.stopPropagation();
    psIcon.classList.remove('drag-over');
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) psShowPreview(file);
  });

  psRemoveCover.addEventListener('click', () => {
    if (psPendingImageUrl) { URL.revokeObjectURL(psPendingImageUrl); psPendingImageUrl = null; }
    psPendingImageFile = null;
    psPendingRemoved = true;
    psImageInput.value = '';
    psIcon.querySelectorAll('img').forEach(el => el.remove());
    psIconDefault.style.display = '';
    psRemoveCover.style.display = 'none';
  });

  psNameInput.addEventListener('input', () => psNameError.classList.remove('show'));

  document.getElementById('psCancel').addEventListener('click', closeProjectSettings);
  psOverlay.addEventListener('click', (e) => { if (e.target === psOverlay) closeProjectSettings(); });

  document.getElementById('psSave').addEventListener('click', () => {
    const project = psActiveProject;
    if (!project) return;
    const name = psNameInput.value.trim();
    if (!name) { psNameError.classList.add('show'); return; }

    project.name = name;

    const imageChanged = psPendingImageFile || psPendingRemoved;
    if (imageChanged) {
      const newSrc = psPendingImageFile ? psPendingImageUrl : null;
      if ('imageUrl' in project) {
        project.imageUrl = newSrc;
      } else {
        project.avatarBg = project.avatarBg || 'linear-gradient(135deg, #F55A48, #911EF2)';
        project.avatarContent = psAvatarContentHtml(project, newSrc);
      }
    }

    const currentSrc = psExtractImageSrc(project);

    if (project.sidebarEl) {
      const labelEl = project.sidebarEl.querySelector('.label');
      if (labelEl) labelEl.textContent = name;
      const iconEl = project.sidebarEl.querySelector('.project-icon');
      if (iconEl) iconEl.innerHTML = psSidebarIconHtml(currentSrc, name);
    }

    if (project.cardEl) {
      const pnameEl = project.cardEl.querySelector('.pname');
      if (pnameEl) pnameEl.textContent = name;
      const avatarEl = project.cardEl.querySelector('.proj-avatar');
      if (avatarEl && imageChanged) {
        avatarEl.style.background = project.avatarBg || '';
        avatarEl.innerHTML = psAvatarContentHtml(project, currentSrc);
      }
    }

    // refreshCurrentView() redraws only the board/list/etc. body, not the page
    // header (which prints the project name) — re-open the current view fully
    // so the header picks up the new name/avatar too.
    if (CURRENT_KAN_PROJECT === project) {
      if (CURRENT_VIEW === 'board') openKanban(project);
      else if (CURRENT_VIEW === 'list') openListView(project);
      else if (CURRENT_VIEW === 'time') openTimelineView(project);
      else if (CURRENT_VIEW === 'calendar') openCalendarView(project);
      else if (CURRENT_VIEW === 'type') openTypeView(project);
      else if (CURRENT_VIEW === 'dashboard') openDashboard(project);
    }

    closeProjectSettings();
    showToast('บันทึกการตั้งค่าโปรเจคแล้ว');
  });
