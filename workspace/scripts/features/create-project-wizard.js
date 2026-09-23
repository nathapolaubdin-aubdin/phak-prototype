  const keyField = document.getElementById('keyField');
  const keyPill = document.getElementById('keyPill');
  const keyDisplay = document.getElementById('keyDisplay');
  const keyEditBtn = document.getElementById('keyEditBtn');
  const modalNext = document.getElementById('modalNext');
  const modalIcon = document.getElementById('modalIcon');
  const projImageInput = document.getElementById('projImageInput');
  let keyManuallyEdited = false;
  let uploadedImageUrl = null;
  let uploadedImageFile = null;
  let uploadedDocs = [];

  function setProjectImage(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('รองรับเฉพาะไฟล์รูปภาพเท่านั้น');
      return;
    }
    if (uploadedImageUrl) URL.revokeObjectURL(uploadedImageUrl);
    uploadedImageUrl = URL.createObjectURL(file);
    uploadedImageFile = file;
    modalIcon.querySelectorAll('img').forEach(el => el.remove());
    const img = document.createElement('img');
    img.src = uploadedImageUrl;
    img.alt = 'รูปโปรเจค';
    modalIcon.insertBefore(img, modalIcon.firstChild);
    document.getElementById('iconDefault').style.display = 'none';
  }

  modalIcon.addEventListener('click', () => projImageInput.click());
  projImageInput.addEventListener('change', () => {
    if (projImageInput.files && projImageInput.files[0]) setProjectImage(projImageInput.files[0]);
  });
  ['dragenter', 'dragover'].forEach(evt => {
    modalIcon.addEventListener(evt, (e) => {
      e.preventDefault(); e.stopPropagation();
      modalIcon.classList.add('drag-over');
    });
  });
  ['dragleave', 'dragend'].forEach(evt => {
    modalIcon.addEventListener(evt, (e) => {
      e.preventDefault(); e.stopPropagation();
      modalIcon.classList.remove('drag-over');
    });
  });
  modalIcon.addEventListener('drop', (e) => {
    e.preventDefault(); e.stopPropagation();
    modalIcon.classList.remove('drag-over');
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) setProjectImage(file);
  });

  function generateKey(name) {
    const words = name.trim().split(/\s+/).filter(Boolean);
    let key;
    if (words.length === 1) {
      key = words[0].slice(0, 3);
    } else {
      key = words.map(w => w[0]).join('').slice(0, 5);
    }
    return key.toUpperCase();
  }

  document.getElementById('newProjectBtn').addEventListener('click', () => {
    modalOverlay.classList.add('open');
    projNameInput.focus();
  });
  document.getElementById('modalCancel').addEventListener('click', closeModal);
  document.getElementById('membersCancel').addEventListener('click', () => {
    stepMembers.style.display = 'none';
    stepProject.style.display = 'flex';
  });
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

  const stepProject = document.getElementById('stepProject');
  const stepMembers = document.getElementById('stepMembers');

  function closeModal() {
    modalOverlay.classList.remove('open');
    projNameInput.value = '';
    projNameError.classList.remove('show');
    keyField.style.display = 'none';
    keyManuallyEdited = false;
    modalNext.classList.remove('ready');
    modalIcon.querySelectorAll('img').forEach(el => el.remove());
    document.getElementById('iconDefault').style.display = '';
    if (uploadedImageUrl) { URL.revokeObjectURL(uploadedImageUrl); uploadedImageUrl = null; }
    uploadedImageFile = null;
    projImageInput.value = '';
    stepProject.style.display = 'flex';
    stepMembers.style.display = 'none';
    document.getElementById('stepFolder').classList.remove('active');
    document.getElementById('stepUpload').classList.remove('active');
    document.getElementById('stepProgress').classList.remove('active');
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('modalSide').style.display = '';
    document.getElementById('folderNameInput').value = '';
    document.getElementById('folderNameInput').placeholder = '';
    document.getElementById('uploadedFilesList').innerHTML = '';
    document.getElementById('docFileInput').value = '';
    uploadedDocs = [];
    document.getElementById('createAuto').disabled = true;
    resetMembers();
  }

  projNameInput.addEventListener('input', () => {
    projNameError.classList.remove('show');
    const name = projNameInput.value.trim();
    if (name) {
      keyField.style.display = 'block';
      modalNext.classList.add('ready');
      if (!keyManuallyEdited) keyPill.textContent = generateKey(name) + '-';
    } else {
      keyField.style.display = 'none';
      modalNext.classList.remove('ready');
    }
  });

  function rebindKeyEdit() {
    const btn = document.getElementById('keyEditBtn');
    const pill = document.getElementById('keyPill');
    btn.onclick = () => {
      const currentVal = pill.textContent.replace(/-$/, '');
      keyDisplay.innerHTML = '';
      const editInput = document.createElement('input');
      editInput.type = 'text';
      editInput.className = 'key-edit-input';
      editInput.value = currentVal;
      editInput.maxLength = 6;
      keyDisplay.appendChild(editInput);
      editInput.focus();
      editInput.select();
      const commit = () => {
        const val = editInput.value.trim() || generateKey(projNameInput.value);
        keyManuallyEdited = true;
        keyDisplay.innerHTML = `<span class="key-pill" id="keyPill">${val.toUpperCase()}-</span><button class="key-edit-btn" id="keyEditBtn" aria-label="แก้ไข Project Key"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>`;
        rebindKeyEdit();
      };
      editInput.addEventListener('blur', commit);
      editInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') editInput.blur(); });
    };
  }

  rebindKeyEdit();

  const BRAND_LOGO = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIzIiBoZWlnaHQ9IjQxIiB2aWV3Qm94PSIwIDAgMTIzIDQxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMTIuODg2NyAyNi43MDQ0QzEzLjQ0MTQgMjYuMjUyNCAxNC40MjA4IDI2LjUyMTQgMTQuNzU2MyAyNy4xMzk5QzE1LjM1MDEgMjguMjM0MSAxNi4xNTQzIDI4LjkxMzUgMTcuNDEwNCAyOS4xNTg2QzE4LjY3ODIgMjkuNDA2MyAxOS45Mzg5IDI4Ljk3OTkgMjEuMjA2NyAyOS4wNjE0QzIyLjYgMjkuMTM2NCAyNC4wNDM2IDI5LjUzMTggMjUuMzE0MyAzMC4wOTY2QzI2LjA4NDYgMzAuNDM5MSAyNi44NjQ3IDMwLjk2NzYgMjcuNTI5IDMxLjQ2OTVDMjkuMTM1OCAzMi42NjAzIDMwLjUwNTMgMzQuMTg1MyAzMS42MjI1IDM1LjgzODFDMzIuMjE0NSAzNi43MzI3IDMzLjYwMzMgMzguODA1NyAzMy41MTA5IDM5Ljk0OThDMzMuNDY0NyA0MC41MjE1IDMyLjUzMDUgNDEuMTUzOSAzMS45MjAxIDQwLjk2NjRDMzEuMTg0MiA0MC43OTkzIDMxLjA0NjcgNDAuMDUyNiAzMC43Mzc1IDM5LjQ4MzFDMzAuNDU4NSAzOC45OTEyIDMwLjIxOTUgMzguMzY3NiAyOS45MDY4IDM3LjkwMTdDMjkuNTU5MSAzNy4zODM4IDI5LjE3NTggMzYuNzY0NCAyOC43OTAxIDM2LjI3ODdDMjYuNzM0MyAzMy42ODk2IDI0LjE0MDIgMzEuNTYzMiAyMC42ODYyIDMxLjQ5OTlMMjAuNjA0NSAzMS40OTg4QzIwLjU0MTUgMzEuNTA3OSAyMC40NzkxIDMxLjUxNDQgMjAuNDE2NyAzMS41MTkyQzIwLjM1NDMgMzEuNTI0MSAyMC4yOTIgMzEuNTI3NCAyMC4yMjkyIDMxLjUzMDNDMjAuMTg3MyAzMS41MzIzIDIwLjE0NTMgMzEuNTM0MiAyMC4xMDI5IDMxLjUzNjNDMTkuOTMzOCAzMS41NDk0IDE5Ljc3NzEgMzEuNTYxNSAxOS42Mjk2IDMxLjU3MjNDMTkuNTU1OSAzMS41Nzc3IDE5LjQ4NDUgMzEuNTgyNyAxOS40MTUgMzEuNTg3NEMxOS4zMTA3IDMxLjU5NDQgMTkuMjEwOCAzMS42MDA0IDE5LjExMzggMzEuNjA1NUMxOC45MiAzMS42MTU2IDE4LjczODEgMzEuNjIxNCAxOC41NTc3IDMxLjYyMTZDMTguMDQ2NiAzMS42MjIgMTcuNTQ3IDMxLjU3NjYgMTYuODE4NyAzMS40NTI3QzE2LjY2NjMgMzEuNDM4NSAxNi40MDg5IDMxLjM3MDQgMTYuMjU0MyAzMS4zMzA4QzE1LjA5NiAzMS4wMzY0IDE0LjA2MDEgMzAuMzg1NyAxMy4yOTM1IDI5LjQ3MTNDMTIuNzQ4MSAyOC44MTU1IDEyLjAzMjMgMjcuNDAwOSAxMi44ODY3IDI2LjcwNDRaIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfNTEzXzIyMjUzNykiLz4KPHBhdGggZD0iTTQyLjAzMyAxMi44MTU0QzQyLjM1MTQgMTIuNzMzNSA0Mi42NjggMTIuODA3IDQyLjk0NTIgMTIuOTcyQzQ0LjE3ODIgMTMuNzA2NSA0NS4zMDAxIDE2LjYyNzQgNDUuNjMzMyAxNy45ODYzQzQ1LjgzMDUgMTguNzkwMiA0NS45MDU1IDE5LjYzMTkgNDUuOTA5NiAyMC40NThDNDUuOTIwNiAyMi43NDIxIDQ1LjM0NTcgMjQuNDAzNCA0NC4xNSAyNi4zNDQyQzQzLjkyNjEgMjYuNzA3NCA0My42NjQgMjcuMDM0MyA0My4zOTIyIDI3LjM2MkM0Mi4xMjU0IDI4Ljg4ODEgNDAuNTM0IDI5Ljk4ODkgMzguNjY4NCAzMC42Njc3QzM4LjI5ODIgMzAuODAyMyAzNy44NzI2IDMwLjk3MTIgMzcuNDg0IDMxLjAzNDFDMzcuNDcxMyAzMS4wMzYxIDM3LjQ1ODMgMzEuMDM1OCAzNy40NDUyIDMxLjAzNjlDMzcuMzUxNSAzMS4wNjY0IDM3LjI1ODIgMzEuMDk0IDM3LjE2NSAzMS4xMkMzNy4xMzY4IDMxLjEyNzggMzcuMTA4NyAzMS4xMzU2IDM3LjA4MDcgMzEuMTQzMUMzNy4wNTA0IDMxLjE1MTIgMzcuMDIwMiAzMS4xNTkyIDM2Ljk4OTkgMzEuMTY2OUMzNi45NTk4IDMxLjE3NDcgMzYuOTI5NiAzMS4xODIzIDM2Ljg5OTQgMzEuMTg5N0MzNi44NjkzIDMxLjE5NzIgMzYuODM5MSAzMS4yMDQ0IDM2LjgwOSAzMS4yMTE1QzM2LjYyNTggMzEuMjU0NyAzNi40NDM1IDMxLjI5MTcgMzYuMjYxOCAzMS4zMjM1QzM2LjIzNDQgMzEuMzI4MyAzNi4yMDcgMzEuMzMzMSAzNi4xNzk2IDMxLjMzNzZDMzYuMTQ5NyAzMS4zNDI2IDM2LjExOTkgMzEuMzQ3NCAzNi4wOTAxIDMxLjM1MjFDMzYuMDYwMyAzMS4zNTY4IDM2LjAzMDUgMzEuMzYxMyAzNi4wMDA4IDMxLjM2NTdDMzUuOTcxIDMxLjM3MDIgMzUuOTQxMiAzMS4zNzQ0IDM1LjkxMTQgMzEuMzc4NkMzNS44NTkzIDMxLjM4NTkgMzUuODA3MSAzMS4zOTI2IDM1Ljc1NTEgMzEuMzk5MUMzNS43NDc3IDMxLjQwMDEgMzUuNzQwNCAzMS40MDEgMzUuNzMzIDMxLjQwMTlDMzUuNjQzOSAzMS40MTI5IDM1LjU1NDkgMzEuNDIyOCAzNS40NjYgMzEuNDMxNkMzNS40MzkyIDMxLjQzNDIgMzUuNDEyMyAzMS40MzY3IDM1LjM4NTYgMzEuNDM5MkMzNC44Nzg5IDMxLjQ4NiAzNC4zNzQ0IDMxLjUwMDggMzMuODY2OCAzMS41MDFDMzMuODA3NCAzMS41MDEgMzMuNzQ4IDMxLjUwMDkgMzMuNjg4NSAzMS41MDA1QzMzLjAzNDMgMzEuNDk2NiAzMi4zNzQgMzEuNDcxOCAzMS42OTY4IDMxLjQ2M0MzMS4xNTIyIDMxLjQyMDkgMzAuNTkyOSAzMS4zMzIgMzAuMDQ5NCAzMS4xODlDMjkuOTcxOCAzMS4xNjg2IDI5Ljg5NDUgMzEuMTQ3MiAyOS44MTc2IDMxLjEyNDVDMjkuNzc5MiAzMS4xMTMyIDI5Ljc0MDggMzEuMTAxNiAyOS43MDI2IDMxLjA4OTdDMjkuNjY0MyAzMS4wNzc4IDI5LjYyNjIgMzEuMDY1NiAyOS41ODgyIDMxLjA1MzFDMjkuNTUwMiAzMS4wNDA3IDI5LjUxMjMgMzEuMDI3OSAyOS40NzQ2IDMxLjAxNDlDMjkuMzk5MSAzMC45ODg5IDI5LjMyNDIgMzAuOTYxNyAyOS4yNDk5IDMwLjkzMzNDMjkuMDA4NSAzMC44NDEgMjguNzczNyAzMC43MzYzIDI4LjU0ODYgMzAuNjE4NEMyOC41MTQgMzAuNjAwMiAyOC40Nzk3IDMwLjU4MTggMjguNDQ1NSAzMC41NjMxQzI4LjM3NzIgMzAuNTI1NiAyOC4zMDk5IDMwLjQ4NjggMjguMjQzNiAzMC40NDY3QzI4LjIyNzEgMzAuNDM2NyAyOC4yMTA1IDMwLjQyNjYgMjguMTk0MSAzMC40MTY0QzI4LjE2MTIgMzAuMzk2MSAyOC4xMjg2IDMwLjM3NTQgMjguMDk2MyAzMC4zNTQ0QzI4LjA2NCAzMC4zMzM0IDI4LjAzMTkgMzAuMzEyMSAyOC4wMDAyIDMwLjI5MDVDMjcuOTIwOCAzMC4yMzY0IDI3Ljg0MzMgMzAuMTgwMiAyNy43Njc3IDMwLjEyMkMyNy43Mzc1IDMwLjA5ODcgMjcuNzA3NiAzMC4wNzUxIDI3LjY3ODEgMzAuMDUxMUMyNy42MDQxIDI5Ljk5MTIgMjcuNTMyMyAyOS45MjkzIDI3LjQ2MjcgMjkuODY1MUMyNy40NDg3IDI5Ljg1MjMgMjcuNDM0OSAyOS44Mzk0IDI3LjQyMTIgMjkuODI2NEMyNy4zMjQ5IDI5LjczNTQgMjcuMjMzMSAyOS42NDAzIDI3LjE0NjMgMjkuNTQwN0MyNy4xMjE1IDI5LjUxMjMgMjcuMDk3MSAyOS40ODM1IDI3LjA3MzEgMjkuNDU0M0MyNy4wMDExIDI5LjM2NjkgMjYuOTMyOSAyOS4yNzYzIDI2Ljg2ODcgMjkuMTgyNEMyNi44NDczIDI5LjE1MTIgMjYuODI2MyAyOS4xMTk1IDI2LjgwNTggMjkuMDg3NUMyNi43MzQgMjguOTc1NCAyNi42Njc5IDI4Ljg1ODggMjYuNjA3OCAyOC43Mzc3QzI2LjU3MzUgMjguNjY4NCAyNi41NDExIDI4LjU5NzcgMjYuNTEwOCAyOC41MjU0QzI2LjQ2NTQgMjguNDE3IDI2LjQyNDcgMjguMzA1MiAyNi4zODkgMjguMTg5OUMyNi4zODMgMjguMTcwNiAyNi4zNzcyIDI4LjE1MTMgMjYuMzcxNSAyOC4xMzE5QzI2LjM2NTkgMjguMTEyNSAyNi4zNjAzIDI4LjA5MyAyNi4zNTQ5IDI4LjA3MzRDMjYuMzQ5NSAyOC4wNTM4IDI2LjM0NDIgMjguMDM0MSAyNi4zMzkxIDI4LjAxNDNDMjYuMzM0IDI3Ljk5NDUgMjYuMzI5IDI3Ljk3NDYgMjYuMzI0MiAyNy45NTQ2QzI2LjMxNDYgMjcuOTE0NiAyNi4zMDU1IDI3Ljg3NDIgMjYuMjk2OSAyNy44MzM0QzI2LjI4ODQgMjcuNzkyNiAyNi4yODA1IDI3Ljc1MTQgMjYuMjczMiAyNy43MDk4QzI2LjI2NTkgMjcuNjY4MiAyNi4yNTkxIDI3LjYyNjIgMjYuMjUzIDI3LjU4MzhDMjYuMjQ5OSAyNy41NjI2IDI2LjI0NzEgMjcuNTQxMyAyNi4yNDQzIDI3LjUyQzI2LjIzNiAyNy40NTU4IDI2LjIyOTIgMjcuMzkwNyAyNi4yMjM3IDI3LjMyNDdDMjYuMjIxOSAyNy4zMDI2IDI2LjIyMDIgMjcuMjgwNSAyNi4yMTg3IDI3LjI1ODNDMjYuMjA1NSAyNi44MDU4IDI2LjI1OSAyNi4zNjQ3IDI2LjM2OTkgMjUuOTQwOUMyNi4zNzU1IDI1LjkxOTcgMjYuMzgxMiAyNS44OTg1IDI2LjM4NyAyNS44Nzc0QzI2LjYzNzkgMjQuOTcgMjcuMTUyMyAyNC4xNDQyIDI3LjgzODMgMjMuNDYwM0MyOS4wNzk1IDIyLjIyMjkgMzEuMDcxNiAyMS4wMDE1IDMyLjg0OTggMjAuODE1NEMzMi45NTg1IDIwLjgwNCAzMy4wNjEyIDIwLjgwOTQgMzMuMTU3MyAyMC44MjkyQzMzLjE3OTUgMjAuODMzOCAzMy4yMDEzIDIwLjgzOTEgMzMuMjIyOCAyMC44NDUxQzMzLjM1MTcgMjAuODgxNCAzMy40Njc4IDIwLjk0NCAzMy41Njk1IDIxLjAyNTlDMzMuNTkyMSAyMS4wNDQxIDMzLjYxNCAyMS4wNjMzIDMzLjYzNTIgMjEuMDgzNEMzMy44MzY0IDIxLjI3MzggMzMuOTcyMiAyMS41NDM4IDM0LjAyODMgMjEuODI5MkMzNC4wMzQyIDIxLjg1OTMgMzQuMDM5MiAyMS44ODk1IDM0LjA0MzMgMjEuOTE5OEMzNC4wNzQzIDIyLjE0NzEgMzQuMDU0NiAyMi4zNzk3IDMzLjk3NzMgMjIuNTg2QzMzLjk2NyAyMi42MTM1IDMzLjk1NTcgMjIuNjQwNSAzMy45NDMzIDIyLjY2N0MzMy45IDIyLjc1OTcgMzMuODQzOSAyMi44NDU4IDMzLjc3NDQgMjIuOTIyQzMzLjUzNzggMjMuMTgxNCAzMy4xNDM0IDIzLjM2MjQgMzIuNzMxMyAyMy41MjA5QzMyLjYyODMgMjMuNTYwNiAzMi41MjQyIDIzLjU5ODggMzIuNDIxMSAyMy42MzY1QzMyLjExMjEgMjMuNzQ5NSAzMS44MTI4IDIzLjg1NzggMzEuNTgyNSAyMy45ODQ3QzMxLjU2NTQgMjMuOTkzMiAzMS41NDgyIDI0LjAwMiAzMS41MzA3IDI0LjAxMDlDMzEuNDk1OSAyNC4wMjg3IDMxLjQ2MDMgMjQuMDQ3MiAzMS40MjQyIDI0LjA2NjVDMzEuMzE1NyAyNC4xMjQ0IDMxLjIwMTYgMjQuMTg5IDMxLjA4NDIgMjQuMjU5NkMzMS4wNDUgMjQuMjgzMSAzMS4wMDU1IDI0LjMwNzMgMzAuOTY1NyAyNC4zMzIxQzMwLjU0NzggMjQuNTkzIDMwLjA5OCAyNC45MjUyIDI5LjcxMSAyNS4zMDIyQzI5LjY3NDEgMjUuMzM4MSAyOS42Mzc5IDI1LjM3NDQgMjkuNjAyMyAyNS40MTExQzI5LjQwNjMgMjUuNjEyOSAyOS4yMyAyNS44MjY0IDI5LjA4NzEgMjYuMDQ3NkMyOS4wNzQxIDI2LjA2NzcgMjkuMDYxNCAyNi4wODc4IDI5LjA0OSAyNi4xMDgxQzI4LjgyNTIgMjYuNDcyMyAyOC42OTQxIDI2Ljg1NjUgMjguNzE1MiAyNy4yNDM4QzI4LjgwOTEgMjguOTU4NyAzMi42MDQgMjkuMTQwMiAzMy43NTc5IDI5LjA5MjFDMzQuNjUwMiAyOS4wNjA1IDM1LjUzNjcgMjguOTMzMyAzNi40MDE4IDI4LjcxMjhDMzcuODg4MyAyOC4zMjMgMzkuNTM1OSAyNy41MzcxIDQwLjYzNzQgMjYuNDYxN0M0MS4yMzIxIDI1Ljg4MTMgNDEuODQ0OSAyNS4yMTY2IDQyLjI2NjMgMjQuNDk4MkM0My4zNTE1IDIyLjY0NSA0My42NDM2IDIwLjQzNDYgNDMuMDc2NCAxOC4zNjQ1QzQyLjg5NjkgMTcuNjk2IDQyLjUzMjcgMTYuOTI2NCA0Mi4yMDQ4IDE2LjMwNjRDNDEuNzc0NCAxNS40OTMxIDQwLjY1MDggMTQuNDU4MSA0MS4yNDQ2IDEzLjQyNTFDNDEuNDE0IDEzLjEyNDEgNDEuNjk4MyAxMi45MDQyIDQyLjAzMyAxMi44MTU0WiIgZmlsbD0idXJsKCNwYWludDFfbGluZWFyXzUxM18yMjI1MzcpIi8+CjxwYXRoIGQ9Ik0zNy42Mjk1IDcuMTAyNEMzOS4yNTQgNi44NDYxOSA0MC43ODAyIDcuOTQ4NDggNDEuMDQyMyA5LjU2NzExQzQxLjMwNDEgMTEuMTg1OCA0MC4yMDMzIDEyLjcxMDYgMzguNTgwMiAxMi45NzY2QzM2Ljk1MDQgMTMuMjQzNyAzNS40MTMgMTIuMTQwNCAzNS4xNDk3IDEwLjUxNDhDMzQuODg2NyA4Ljg4OTE5IDM1Ljk5ODIgNy4zNTk3NCAzNy42Mjk1IDcuMTAyNFoiIGZpbGw9InVybCgjcGFpbnQyX2xpbmVhcl81MTNfMjIyNTM3KSIvPgo8cGF0aCBkPSJNNDUuNDc4MSA4LjQxODY3QzQ2LjU2NjYgOC40MDE1MSA0OC4wNzUgOC4yMDk2MyA0OC4wODUxIDkuNzYxNzhDNDguMDkzNCAxMS4wODA5IDQ2LjgyNDIgMTEuMTM5NCA0NS44MTY0IDExLjE0OTlDNDQuODg1NSAxMS4xNTUxIDQzLjI2NTEgMTEuNDEyNSA0My4yMTQ4IDkuOTczNTFDNDMuMTYxOCA4LjQ1MjE5IDQ0LjMyMzcgOC40NDQ2NSA0NS40NzgxIDguNDE4NjdaIiBmaWxsPSJ1cmwoI3BhaW50M19saW5lYXJfNTEzXzIyMjUzNykiLz4KPHBhdGggZD0iTTQ1LjA2NzMgMi43MTM5OEM0NS43MTQ1IDIuNjc0NzQgNDYuMTg0NiAyLjg3MzUzIDQ2LjQzOTYgMy41MDEzM0M0Ni45Mjg1IDQuNzA0MDggNDUuNjY4OSA1LjMzNzI2IDQ0LjkxMDkgNS45OTM4NkM0NC4zMjA0IDYuNTA1NSA0My43OTM1IDcuMDIyOTcgNDMuMDM4OCA3LjI4ODYxQzQxLjc5NjcgNy4zMjc2NyA0MS4wOTcxIDUuOTAwMzIgNDEuODE2NSA1LjE1NzczQzQyLjM4OTMgNC41NjY3MiA0NC4zNTUzIDIuODUxMDIgNDUuMDY3MyAyLjcxMzk4WiIgZmlsbD0idXJsKCNwYWludDRfbGluZWFyXzUxM18yMjI1MzcpIi8+CjxwYXRoIGQ9Ik0zOS44NzYgMC4wMDA5MTYwMTNDNDAuMTI4MyAtMC4wMDczNDgwOSA0MC4zNjM1IDAuMDM5MzAxNSA0MC41NzU1IDAuMTgxODE1QzQwLjg4MzggMC4zODg4NDcgNDEuMTU2NyAwLjcxMTM2NSA0MS4yMjYzIDEuMDgyNjhDNDEuMzQzOCAxLjcxMzE2IDQwLjc0MDggNC4xMjU0NSA0MC4zODAxIDQuNjM5MDhDNDAuMTY1MyA0Ljk0NDgzIDM5Ljg5MzEgNS4wMzIzNyAzOS41NDU3IDUuMTAxNDZDMzkuMTY2OSA1LjExNTA0IDM4LjgwMzggNS4wNDE3MSAzOC40OTkzIDQuODA0MjVDMzguMjc1NCA0LjYyOTU4IDM4LjE0NTcgNC4zOTgzNCAzOC4xMTQgNC4xMTcyMUMzOC4wMzE3IDMuMzg1MDQgMzguNTk1OSAwLjk4NzUgMzkuMDQ2NCAwLjQzMDIzN0MzOS4yNzU3IDAuMTQ2NTA4IDM5LjUxNzYgMC4wNDA0NDk5IDM5Ljg3NiAwLjAwMDkxNjAxM1oiIGZpbGw9InVybCgjcGFpbnQ1X2xpbmVhcl81MTNfMjIyNTM3KSIvPgo8cGF0aCBkPSJNMTcuMDQzNCAxLjU0MzUyQzIyLjAzMzQgMC42MTE4MTcgMjYuMzIxNiAxLjEyNzc1IDMxLjA1OTIgMi44Nzg0NkMzMS45ODIxIDMuMjE5NDggMzQuNjc4OCA0LjM2MzM0IDM1LjA4NiA1LjIyMTQxQzM1LjI1MDQgNS41Njc0NyAzNS4yMTQ4IDYuMDA3NzUgMzUuMDc4IDYuMzU3ODNDMzQuOTc1OCA2LjYxODcyIDM0Ljc5NDggNi44Mjc4NCAzNC41MzM2IDYuOTM4NDFDMzQuMTQwOSA3LjEwNDYgMzMuNzEyOSA3LjAzNzYxIDMzLjMzMTcgNi44NzU0M0MzMi41ODI3IDYuNTU2NjIgMzEuODY5MyA2LjEzNzU3IDMxLjEzOTIgNS43Nzc2QzMwLjU3MTggNS40OTc2NCAyOS45NDQxIDUuMjU4MTggMjkuMzUzMyA1LjAyNDAxQzI1LjkwNTIgMy42NTc0IDIxLjg3NTggMy40MTQyMiAxOC4yMjYzIDMuOTMyNTRDMTcuNTEwOCA0LjAzNDE2IDE2LjgzODYgNC4yNjQwMiAxNi4xNjQ4IDQuMzczMzJMMTYuMTQ0MiA0LjM4MDUyQzE1LjkyNTUgNC40NTU0NSAxNS42MTQ5IDQuNTIzMDUgMTUuMzgyIDQuNTg5NDVDMTQuOTI1MSA0LjcyMTgxIDE0LjQ3MjYgNC44Njg2NyAxNC4wMjUyIDUuMDI5ODFDMTMuMTY4NSA1LjM0NTY0IDEyLjI3NTUgNS42MjQ0NiAxMS4zMDMgNi4xMjcyNEMxMC4zMDA0IDYuNjQ1NTkgOS43OTU1NyA2Ljk4NjE2IDguOTc5MjUgNy42NDkwOEM4LjE2MjkzIDguMzExOTkgMy41MDExMSAxMi40MDMxIDIuNzMxNjEgMTUuOTg3NUMyLjAyODg1IDE5LjI2MSAzLjM4NjE4IDIyLjk3ODggNy4wMDg1MSAyMy42MzY5QzkuNzY3NTggMjQuMDM5NSAxMi42MTU3IDIyLjg1NDkgMTUuMDgxIDIxLjc0MzhDMTUuOTE2NSAyMS4zNjcyIDE2LjcyMDIgMjAuODM3IDE3LjUxMzQgMjAuMzk5M0MxOC4zNDEzIDE5Ljk0MjMgMTkuMDU3MSAxOS40Mzg5IDE5Ljg0MjIgMTguOTIzMkMyMC4yNzYzIDE4LjYzODEgMjAuNzQ1NCAxOC4yMTQzIDIxLjIwMiAxNy45ODYyQzIyLjQzNDMgMTcuMDY5NyAyMy42NjAyIDE2LjEyOCAyNC45MDMxIDE1LjIyMzdDMjUuMjE4NCAxNC45OTQyIDI1LjY2MjcgMTQuNjA4NCAyNS45NzY5IDE0LjQwOTlMMjYuMDA2OSAxNC4zOTEzQzI3LjIzOTMgMTMuNDk1OSAzMS4zOTkyIDEwLjM1NzMgMzIuODY3OSAxMC41OTE1QzMzLjE4MTIgMTAuNjQ0NiAzMy40NiAxMC44MjE5IDMzLjY0IDExLjA4MzJDMzMuODkwMyAxMS40Mzk5IDMzLjkwMzQgMTEuOTIzNyAzMy44MjY5IDEyLjM0MTVDMzMuNjg5NSAxMy4wOTQ2IDMyLjY0MjUgMTMuMzMyMiAzMi4wNjIgMTMuNjIzMkMzMC45NDkzIDE0LjE4MDYgMjkuODc2IDE0LjgzMDMgMjguODQzNSAxNS41MjIxQzI4LjM3MjMgMTUuODM3NyAyNy45MjQ0IDE2LjIwMTcgMjcuNDMzMSAxNi40ODQ2QzI3LjEzNTkgMTYuNzM2NiAyNi43OTAxIDE3LjAwNTggMjYuNDI5NCAxNy4yNzY4QzI2LjMwOTIgMTcuMzY3MSAyNi4xODczIDE3LjQ1NzYgMjYuMDY1IDE3LjU0NzhDMjUuNTc1OCAxNy45MDg1IDI1LjA4MDMgMTguMjYzNCAyNC42NTgyIDE4LjU3NjNMMjMuMzUzMiAxOS41MzQxQzIzLjEwNDEgMTkuNzE3NCAyMi42MDQ0IDIwLjA5MDkgMjIuMzQwNyAyMC4yMzUxQzIyLjA0ODkgMjAuNDI1MyAyMS43Nzg4IDIwLjY0MDcgMjEuNDkyNSAyMC44MzU2QzE4LjgxMDkgMjIuNjU1NSAxNS45MjY4IDI0LjQ3NzcgMTIuODEzNiAyNS40NDU1QzkuMTE3NjIgMjYuNTk0MyA0LjM5ODEgMjYuNzUxNyAxLjgzNzM0IDIzLjMzMkMwLjgxOTA2NyAyMS45NzIyIDAuMzUxODc3IDIwLjY3MDQgMC4xMDc2OCAxOS4wMTgxQy0wLjUwOTQgMTQuODQyOSAxLjYwMDcxIDEwLjg5NzMgNC41MTg2OCA4LjAzNTQ4QzUuOTk2NTEgNi41Njc0NSA3LjY3NDE4IDUuMzEzOTkgOS41MDI0MSA0LjMxMjAyQzkuODU2MjUgNC4wNTEwMSAxMC4yMzE0IDMuODg3MjcgMTAuNjA5OSAzLjY4NDA0QzEwLjkzMDIgMy41MTIwOCAxMS4yNTEyIDMuMzU2MTEgMTEuNTc0NCAzLjIxMjIyQzExLjY0NjMgMy4xODAyNCAxMS43MTgyIDMuMTQ4ODMgMTEuNzkwNCAzLjExOEMxMi40NzUyIDIuODI1MiAxMy4xNzIyIDIuNTgyNSAxMy44OTc5IDIuMzUzMzdDMTMuOTc0MyAyLjMyOTI2IDE0LjA1MSAyLjMwNTMxIDE0LjEyODEgMi4yODE0NUwxNC4yMTE2IDIuMjQ0MTJDMTUuMDgwNyAxLjg2NTk4IDE2LjEyMiAxLjcxNTU3IDE3LjA0MzQgMS41NDM1MloiIGZpbGw9InVybCgjcGFpbnQ2X2xpbmVhcl81MTNfMjIyNTM3KSIvPgo8cGF0aCBkPSJNNTQuMjM3MiAyMy41MTc1VjUuODI4NDlINjEuMjEwM0M2Mi41NTA4IDUuODI4NDkgNjMuNjkyOCA2LjA4NDcyIDY0LjYzNjQgNi41OTcyQzY1LjU3OTkgNy4xMDM5MSA2Ni4yOTkxIDcuODA5MjkgNjYuNzkzOSA4LjcxMzMxQzY3LjI5NDQgOS42MTE1OCA2Ny41NDQ3IDEwLjY0OCA2Ny41NDQ3IDExLjgyMjdDNjcuNTQ0NyAxMi45OTc0IDY3LjI5MTYgMTQuMDMzOCA2Ni43ODUzIDE0LjkzMjFDNjYuMjc5IDE1LjgzMDQgNjUuNTQ1NCAxNi41MyA2NC41ODQ2IDE3LjAzMDlDNjMuNjI5NiAxNy41MzE5IDYyLjQ3MzEgMTcuNzgyNCA2MS4xMTUzIDE3Ljc4MjRINTYuNjcwOVYxNC43ODUzSDYwLjUxMTJDNjEuMjMwNCAxNC43ODUzIDYxLjgyMyAxNC42NjE1IDYyLjI4OSAxNC40MTM5QzYyLjc2MDggMTQuMTYwNSA2My4xMTE4IDEzLjgxMjEgNjMuMzQxOSAxMy4zNjg4QzYzLjU3NzggMTIuOTE5NiA2My42OTU3IDEyLjQwNDMgNjMuNjk1NyAxMS44MjI3QzYzLjY5NTcgMTEuMjM1NCA2My41Nzc4IDEwLjcyMjkgNjMuMzQxOSAxMC4yODUzQzYzLjExMTggOS44NDE5MSA2Mi43NjA4IDkuNDk5MyA2Mi4yODkgOS4yNTc0NkM2MS44MTcyIDkuMDA5ODYgNjEuMjE4OSA4Ljg4NjA2IDYwLjQ5NCA4Ljg4NjA2SDU3Ljk3NFYyMy41MTc1SDU0LjIzNzJaIiBmaWxsPSJ1cmwoI3BhaW50N19saW5lYXJfNTEzXzIyMjUzNykiLz4KPHBhdGggZD0iTTY5Ljk3MTkgMjMuNTE3NVY1LjgyODQ5SDczLjcwODdWMTMuMTI2OUg4MS4yOTQ1VjUuODI4NDlIODUuMDIyN1YyMy41MTc1SDgxLjI5NDVWMTYuMjEwNEg3My43MDg3VjIzLjUxNzVINjkuOTcxOVoiIGZpbGw9InVybCgjcGFpbnQ4X2xpbmVhcl81MTNfMjIyNTM3KSIvPgo8cGF0aCBkPSJNOTEuMTUwMSAyMy41MTc1SDg3LjE0NTdMOTMuMjQ3MiA1LjgyODQ5SDk4LjA2MjdMMTA0LjE1NiAyMy41MTc1SDEwMC4xNTFMOTUuNzI0IDkuODcwN0g5NS41ODU5TDkxLjE1MDEgMjMuNTE3NVpNOTAuODk5OCAxNi41NjQ1SDEwMC4zNThWMTkuNDgzOUg5MC44OTk4VjE2LjU2NDVaIiBmaWxsPSJ1cmwoI3BhaW50OV9saW5lYXJfNTEzXzIyMjUzNykiLz4KPHBhdGggZD0iTTEwNi4yODMgMjMuNTE3NVY1LjgyODQ5SDExMC4wMlYxMy42Mjc5SDExMC4yNTNMMTE2LjYxMyA1LjgyODQ5SDEyMS4wOTJMMTE0LjUzMyAxMy43NDg4TDEyMS4xNyAyMy41MTc1SDExNi42OTlMMTExLjg1OCAxNi4yNDVMMTEwLjAyIDE4LjQ5MDZWMjMuNTE3NUgxMDYuMjgzWiIgZmlsbD0idXJsKCNwYWludDEwX2xpbmVhcl81MTNfMjIyNTM3KSIvPgo8cGF0aCBkPSJNNTcuMjE2OCAzMy44ODY1QzU3LjE4MDkgMzMuNTY3NyA1Ny4wMzI5IDMzLjMyMDcgNTYuNzcyNiAzMy4xNDU2QzU2LjUxMjQgMzIuOTY4MyA1Ni4xODQ5IDMyLjg3OTYgNTUuNzkwMSAzMi44Nzk2QzU1LjUwNzQgMzIuODc5NiA1NS4yNjI5IDMyLjkyNDUgNTUuMDU2NSAzMy4wMTQzQzU0Ljg1MDEgMzMuMTAxOCA1NC42ODk3IDMzLjIyMzEgNTQuNTc1MyAzMy4zNzhDNTQuNDYzMSAzMy41MzA3IDU0LjQwNzEgMzMuNzA0NyA1NC40MDcxIDMzLjlDNTQuNDA3MSAzNC4wNjM5IDU0LjQ0NTIgMzQuMjA1MyA1NC41MjE1IDM0LjMyNDNDNTQuNiAzNC40NDMzIDU0LjcwMjEgMzQuNTQzMiA1NC44Mjc3IDM0LjYyNDFDNTQuOTU1NiAzNC43MDI2IDU1LjA5MjQgMzQuNzY4OSA1NS4yMzgyIDM0LjgyMjhDNTUuMzg0IDM0Ljg3NDQgNTUuNTI0MiAzNC45MTcxIDU1LjY1ODggMzQuOTUwN0w1Ni4zMzE4IDM1LjEyNTlDNTYuNTUxNyAzNS4xNzk3IDU2Ljc3NzEgMzUuMjUyNyA1Ny4wMDgyIDM1LjM0NDhDNTcuMjM5MiAzNS40MzY4IDU3LjQ1MzUgMzUuNTU4MSA1Ny42NTA5IDM1LjcwODVDNTcuODQ4MyAzNS44NTg5IDU4LjAwNzYgMzYuMDQ1MyA1OC4xMjg3IDM2LjI2NzVDNTguMjUyMSAzNi40ODk4IDU4LjMxMzggMzYuNzU1OSA1OC4zMTM4IDM3LjA2NTdDNTguMzEzOCAzNy40NTYzIDU4LjIxMjggMzcuODAzMiA1OC4wMTA5IDM4LjEwNjNDNTcuODExMyAzOC40MDk0IDU3LjUyMDggMzguNjQ4NSA1Ny4xMzk0IDM4LjgyMzZDNTYuNzYwMyAzOC45OTg4IDU2LjMwMTUgMzkuMDg2MyA1NS43NjMxIDM5LjA4NjNDNTUuMjQ3MiAzOS4wODYzIDU0LjgwMDggMzkuMDA0NCA1NC40MjM5IDM4Ljg0MDVDNTQuMDQ3IDM4LjY3NjYgNTMuNzUyIDM4LjQ0NDIgNTMuNTM4OSAzOC4xNDM0QzUzLjMyNTggMzcuODQwMyA1My4yMDggMzcuNDgxIDUzLjE4NTYgMzcuMDY1N0g1NC4yMjg3QzU0LjI0ODkgMzcuMzE0OSA1NC4zMjk3IDM3LjUyMjYgNTQuNDcxIDM3LjY4ODdDNTQuNjE0NiAzNy44NTI2IDU0Ljc5NzQgMzcuOTc1IDU1LjAxOTUgMzguMDU1OEM1NS4yNDM4IDM4LjEzNDQgNTUuNDg5NSAzOC4xNzM3IDU1Ljc1NjQgMzguMTczN0M1Ni4wNTAzIDM4LjE3MzcgNTYuMzExNiAzOC4xMjc2IDU2LjU0MDQgMzguMDM1NkM1Ni43NzE1IDM3Ljk0MTMgNTYuOTUzMiAzNy44MTExIDU3LjA4NTYgMzcuNjQ0OUM1Ny4yMTc5IDM3LjQ3NjUgNTcuMjg0MSAzNy4yODAxIDU3LjI4NDEgMzcuMDU1NkM1Ny4yODQxIDM2Ljg1MTMgNTcuMjI1OCAzNi42ODQgNTcuMTA5MSAzNi41NTM4QzU2Ljk5NDcgMzYuNDIzNiA1Ni44Mzg4IDM2LjMxNTggNTYuNjQxNCAzNi4yMzA1QzU2LjQ0NjIgMzYuMTQ1MiA1Ni4yMjUzIDM2LjA3IDU1Ljk3ODUgMzYuMDA0OEw1NS4xNjQyIDM1Ljc4MjZDNTQuNjEyMyAzNS42MzIxIDU0LjE3NDkgMzUuNDExIDUzLjg1MTggMzUuMTE5MUM1My41MzExIDM0LjgyNzMgNTMuMzcwNyAzNC40NDExIDUzLjM3MDcgMzMuOTYwNkM1My4zNzA3IDMzLjU2MzIgNTMuNDc4MyAzMy4yMTY0IDUzLjY5MzcgMzIuOTJDNTMuOTA5MSAzMi42MjM2IDU0LjIwMDcgMzIuMzkzNSA1NC41Njg2IDMyLjIyOTZDNTQuOTM2NSAzMi4wNjM1IDU1LjM1MTUgMzEuOTgwNCA1NS44MTM2IDMxLjk4MDRDNTYuMjgwMiAzMS45ODA0IDU2LjY5MTkgMzIuMDYyMyA1Ny4wNDg2IDMyLjIyNjJDNTcuNDA3NSAzMi4zOTAxIDU3LjY5MDEgMzIuNjE1OCA1Ny44OTY1IDMyLjkwMzJDNTguMTAyOSAzMy4xODgzIDU4LjIxMDYgMzMuNTE2MSA1OC4yMTk2IDMzLjg4NjVINTcuMjE2OFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik01OS41NTYzIDM4Ljk3MThWMzIuMDc0N0g2My44NzY5VjMyLjk3MDVINjAuNTk2MVYzNS4wNzJINjMuNjUxNFYzNS45NjQ0SDYwLjU5NjFWMzguMDc2SDYzLjkxNzNWMzguOTcxOEg1OS41NTYzWiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTcwLjk4OTYgMzQuMzE3Nkg2OS45Mzk3QzY5Ljg5OTMgMzQuMDkzMSA2OS44MjQyIDMzLjg5NTUgNjkuNzE0MiAzMy43MjQ5QzY5LjYwNDMgMzMuNTU0MiA2OS40Njk3IDMzLjQwOTQgNjkuMzEwNSAzMy4yOTA0QzY5LjE1MTIgMzMuMTcxNCA2OC45NzI4IDMzLjA4MTYgNjguNzc1NCAzMy4wMjFDNjguNTgwMyAzMi45NjA0IDY4LjM3MjcgMzIuOTMwMSA2OC4xNTI5IDMyLjkzMDFDNjcuNzU1OCAzMi45MzAxIDY3LjQwMDMgMzMuMDMgNjcuMDg2MiAzMy4yMjk4QzY2Ljc3NDQgMzMuNDI5NiA2Ni41Mjc2IDMzLjcyMjYgNjYuMzQ1OSAzNC4xMDg4QzY2LjE2NjUgMzQuNDk1IDY2LjA3NjcgMzQuOTY2NSA2Ni4wNzY3IDM1LjUyMzNDNjYuMDc2NyAzNi4wODQ1IDY2LjE2NjUgMzYuNTU4MyA2Ni4zNDU5IDM2Ljk0NDRDNjYuNTI3NiAzNy4zMzA2IDY2Ljc3NTUgMzcuNjIyNSA2Ny4wODk2IDM3LjgyMDFDNjcuNDAzNiAzOC4wMTc2IDY3Ljc1NyAzOC4xMTY0IDY4LjE0OTUgMzguMTE2NEM2OC4zNjcxIDM4LjExNjQgNjguNTczNSAzOC4wODcyIDY4Ljc2ODcgMzguMDI4OUM2OC45NjYxIDM3Ljk2ODIgNjkuMTQ0NSAzNy44Nzk2IDY5LjMwMzcgMzcuNzYyOEM2OS40NjMgMzcuNjQ2MSA2OS41OTc2IDM3LjUwMzUgNjkuNzA3NSAzNy4zMzUxQzY5LjgxOTcgMzcuMTY0NSA2OS44OTcxIDM2Ljk2OTEgNjkuOTM5NyAzNi43NDkxTDcwLjk4OTYgMzYuNzUyNUM3MC45MzM1IDM3LjA5MTUgNzAuODI0NyAzNy40MDM2IDcwLjY2MzIgMzcuNjg4N0M3MC41MDM5IDM3Ljk3MTYgNzAuMjk4NiAzOC4yMTYzIDcwLjA0NzQgMzguNDIyOUM2OS43OTg0IDM4LjYyNzIgNjkuNTEzNSAzOC43ODU1IDY5LjE5MjcgMzguODk3N0M2OC44NzE5IDM5LjAxIDY4LjUyMTkgMzkuMDY2MSA2OC4xNDI4IDM5LjA2NjFDNjcuNTQ2MSAzOS4wNjYxIDY3LjAxNDQgMzguOTI0NyA2Ni41NDc4IDM4LjY0MThDNjYuMDgxMiAzOC4zNTY3IDY1LjcxMzMgMzcuOTQ5MiA2NS40NDQxIDM3LjQxOTNDNjUuMTc3MiAzNi44ODk0IDY1LjA0MzcgMzYuMjU3NCA2NS4wNDM3IDM1LjUyMzNDNjUuMDQzNyAzNC43ODY4IDY1LjE3ODMgMzQuMTU0OCA2NS40NDc1IDMzLjYyNzJDNjUuNzE2NyAzMy4wOTc0IDY2LjA4NDYgMzIuNjkxIDY2LjU1MTIgMzIuNDA4MUM2Ny4wMTc4IDMyLjEyMyA2Ny41NDgzIDMxLjk4MDQgNjguMTQyOCAzMS45ODA0QzY4LjUwODUgMzEuOTgwNCA2OC44NDk0IDMyLjAzMzEgNjkuMTY1OCAzMi4xMzg3QzY5LjQ4NDMgMzIuMjQyIDY5Ljc3MDMgMzIuMzk0NiA3MC4wMjM4IDMyLjU5NjdDNzAuMjc3MyAzMi43OTY1IDcwLjQ4NzEgMzMuMDQxMiA3MC42NTMxIDMzLjMzMDlDNzAuODE5MSAzMy42MTgyIDcwLjkzMTIgMzMuOTQ3MiA3MC45ODk2IDM0LjMxNzZaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNNzguMjIgMzUuNTIzM0M3OC4yMiAzNi4yNTk3IDc4LjA4NTQgMzYuODkyOCA3Ny44MTYyIDM3LjQyMjdDNzcuNTQ3IDM3Ljk1MDMgNzcuMTc4IDM4LjM1NjcgNzYuNzA5MiAzOC42NDE4Qzc2LjI0MjUgMzguOTI0NyA3NS43MTIgMzkuMDY2MSA3NS4xMTc1IDM5LjA2NjFDNzQuNTIwOCAzOS4wNjYxIDczLjk4OCAzOC45MjQ3IDczLjUxOTIgMzguNjQxOEM3My4wNTI2IDM4LjM1NjcgNzIuNjg0NyAzNy45NDkyIDcyLjQxNTUgMzcuNDE5M0M3Mi4xNDYzIDM2Ljg4OTQgNzIuMDExNyAzNi4yNTc0IDcyLjAxMTcgMzUuNTIzM0M3Mi4wMTE3IDM0Ljc4NjggNzIuMTQ2MyAzNC4xNTQ4IDcyLjQxNTUgMzMuNjI3MkM3Mi42ODQ3IDMzLjA5NzQgNzMuMDUyNiAzMi42OTEgNzMuNTE5MiAzMi40MDgxQzczLjk4OCAzMi4xMjMgNzQuNTIwOCAzMS45ODA0IDc1LjExNzUgMzEuOTgwNEM3NS43MTIgMzEuOTgwNCA3Ni4yNDI1IDMyLjEyMyA3Ni43MDkyIDMyLjQwODFDNzcuMTc4IDMyLjY5MSA3Ny41NDcgMzMuMDk3NCA3Ny44MTYyIDMzLjYyNzJDNzguMDg1NCAzNC4xNTQ4IDc4LjIyIDM0Ljc4NjggNzguMjIgMzUuNTIzM1pNNzcuMTkwMyAzNS41MjMzQzc3LjE5MDMgMzQuOTYyIDc3LjA5OTUgMzQuNDg5NCA3Ni45MTc4IDM0LjEwNTRDNzYuNzM4MyAzMy43MTkzIDc2LjQ5MTUgMzMuNDI3NCA3Ni4xNzc1IDMzLjIyOThDNzUuODY1NyAzMy4wMyA3NS41MTIzIDMyLjkzMDEgNzUuMTE3NSAzMi45MzAxQzc0LjcyMDUgMzIuOTMwMSA3NC4zNjYgMzMuMDMgNzQuMDU0MiAzMy4yMjk4QzczLjc0MjQgMzMuNDI3NCA3My40OTU2IDMzLjcxOTMgNzMuMzEzOSAzNC4xMDU0QzczLjEzNDQgMzQuNDg5NCA3My4wNDQ3IDM0Ljk2MiA3My4wNDQ3IDM1LjUyMzNDNzMuMDQ0NyAzNi4wODQ1IDczLjEzNDQgMzYuNTU4MyA3My4zMTM5IDM2Ljk0NDRDNzMuNDk1NiAzNy4zMjg0IDczLjc0MjQgMzcuNjIwMiA3NC4wNTQyIDM3LjgyMDFDNzQuMzY2IDM4LjAxNzYgNzQuNzIwNSAzOC4xMTY0IDc1LjExNzUgMzguMTE2NEM3NS41MTIzIDM4LjExNjQgNzUuODY1NyAzOC4wMTc2IDc2LjE3NzUgMzcuODIwMUM3Ni40OTE1IDM3LjYyMDIgNzYuNzM4MyAzNy4zMjg0IDc2LjkxNzggMzYuOTQ0NEM3Ny4wOTk1IDM2LjU1ODMgNzcuMTkwMyAzNi4wODQ1IDc3LjE5MDMgMzUuNTIzM1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik04NS4wNzg2IDMyLjA3NDdWMzguOTcxOEg4NC4xMjNMODAuNjIwMSAzMy45MTM1SDgwLjU1NjFWMzguOTcxOEg3OS41MTY0VjMyLjA3NDdIODAuNDc4N0w4My45ODUgMzcuMTM5OEg4NC4wNDlWMzIuMDc0N0g4NS4wNzg2WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTg4LjgyNjQgMzguOTcxOEg4Ni41OTU0VjMyLjA3NDdIODguODk3Qzg5LjU3MjIgMzIuMDc0NyA5MC4xNTIyIDMyLjIxMjggOTAuNjM2NyAzMi40ODg5QzkxLjEyMTMgMzIuNzYyOCA5MS40OTI1IDMzLjE1NjkgOTEuNzUwNSAzMy42NzFDOTIuMDEwNyAzNC4xODI5IDkyLjE0MDggMzQuNzk2OSA5Mi4xNDA4IDM1LjUxMzJDOTIuMTQwOCAzNi4yMzE2IDkyLjAwOTYgMzYuODQ5IDkxLjc0NzEgMzcuMzY1NEM5MS40ODY5IDM3Ljg4MTggOTEuMTEgMzguMjc5MiA5MC42MTY1IDM4LjU1NzZDOTAuMTIzIDM4LjgzMzcgODkuNTI2MyAzOC45NzE4IDg4LjgyNjQgMzguOTcxOFpNODcuNjM1MiAzOC4wNjI1SDg4Ljc2OTFDODkuMjk0MSAzOC4wNjI1IDg5LjczMDQgMzcuOTYzNyA5MC4wNzgxIDM3Ljc2NjJDOTAuNDI1OCAzNy41NjY0IDkwLjY4NjEgMzcuMjc3OSA5MC44NTg4IDM2LjkwMDdDOTEuMDMxNSAzNi41MjEyIDkxLjExNzkgMzYuMDU4NyA5MS4xMTc5IDM1LjUxMzJDOTEuMTE3OSAzNC45NzIxIDkxLjAzMTUgMzQuNTEyOSA5MC44NTg4IDM0LjEzNTdDOTAuNjg4MyAzMy43NTg2IDkwLjQzMzcgMzMuNDcyMyA5MC4wOTQ5IDMzLjI3N0M4OS43NTYyIDMzLjA4MTYgODkuMzM1NiAzMi45ODQgODguODMzMSAzMi45ODRIODcuNjM1MlYzOC4wNjI1WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTk1Ljk0MTUgMzguOTcxOFYzMi4wNzQ3SDk4LjQ2NTNDOTguOTU0MyAzMi4wNzQ3IDk5LjM1OTIgMzIuMTU1NSA5OS42OCAzMi4zMTcyQzEwMC4wMDEgMzIuNDc2NiAxMDAuMjQxIDMyLjY5MzIgMTAwLjQgMzIuOTY3MUMxMDAuNTU5IDMzLjIzODggMTAwLjYzOSAzMy41NDUzIDEwMC42MzkgMzMuODg2NUMxMDAuNjM5IDM0LjE3MzkgMTAwLjU4NiAzNC40MTY0IDEwMC40ODEgMzQuNjE0QzEwMC4zNzUgMzQuODA5MyAxMDAuMjM0IDM0Ljk2NjUgMTAwLjA1NyAzNS4wODU0Qzk5Ljg4MTkgMzUuMjAyMiA5OS42ODkgMzUuMjg3NSA5OS40NzgxIDM1LjM0MTRWMzUuNDA4OEM5OS43MDY5IDM1LjQyIDk5LjkzMDEgMzUuNDk0MSAxMDAuMTQ4IDM1LjYzMUMxMDAuMzY4IDM1Ljc2NTcgMTAwLjU0OSAzNS45NTc3IDEwMC42OTMgMzYuMjA2OUMxMDAuODM2IDM2LjQ1NjEgMTAwLjkwOCAzNi43NTkyIDEwMC45MDggMzcuMTE2MkMxMDAuOTA4IDM3LjQ2ODcgMTAwLjgyNSAzNy43ODUzIDEwMC42NTkgMzguMDY1OUMxMDAuNDk1IDM4LjM0NDMgMTAwLjI0MiAzOC41NjU0IDk5Ljg5ODcgMzguNzI5M0M5OS41NTU1IDM4Ljg5MSA5OS4xMTcgMzguOTcxOCA5OC41ODMgMzguOTcxOEg5NS45NDE1Wk05Ni45ODEzIDM4LjA3OTRIOTguNDgyMUM5OC45ODAxIDM4LjA3OTQgOTkuMzM2OCAzNy45ODI4IDk5LjU1MjEgMzcuNzg5N0M5OS43Njc1IDM3LjU5NjcgOTkuODc1MiAzNy4zNTUzIDk5Ljg3NTIgMzcuMDY1N0M5OS44NzUyIDM2Ljg0NzkgOTkuODIwMiAzNi42NDgxIDk5LjcxMDMgMzYuNDY2MkM5OS42MDA0IDM2LjI4NDQgOTkuNDQzMyAzNi4xMzk2IDk5LjIzOTIgMzYuMDMxOEM5OS4wMzczIDM1LjkyNCA5OC43OTczIDM1Ljg3MDEgOTguNTE5MSAzNS44NzAxSDk2Ljk4MTNWMzguMDc5NFpNOTYuOTgxMyAzNS4wNTg1SDk4LjM3NDRDOTguNjA3NyAzNS4wNTg1IDk4LjgxNzUgMzUuMDEzNiA5OS4wMDM3IDM0LjkyMzhDOTkuMTkyMSAzNC44MzQgOTkuMzQxMyAzNC43MDgzIDk5LjQ1MTIgMzQuNTQ2NkM5OS41NjM0IDM0LjM4MjcgOTkuNjE5NSAzNC4xODk2IDk5LjYxOTUgMzMuOTY3NEM5OS42MTk1IDMzLjY4MjIgOTkuNTE5NiAzMy40NDMxIDk5LjMyIDMzLjI1Qzk5LjEyMDMgMzMuMDU2OSA5OC44MTQxIDMyLjk2MDQgOTguNDAxMyAzMi45NjA0SDk2Ljk4MTNWMzUuMDU4NVoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xMDIuMTQxIDM4Ljk3MThWMzIuMDc0N0gxMDQuNTk4QzEwNS4xMzIgMzIuMDc0NyAxMDUuNTc1IDMyLjE2NjcgMTA1LjkyNyAzMi4zNTA4QzEwNi4yODIgMzIuNTM0OSAxMDYuNTQ2IDMyLjc4OTggMTA2LjcyMSAzMy4xMTUzQzEwNi44OTYgMzMuNDM4NiAxMDYuOTg0IDMzLjgxMjQgMTA2Ljk4NCAzNC4yMzY4QzEwNi45ODQgMzQuNjU4OSAxMDYuODk1IDM1LjAzMDQgMTA2LjcxOCAzNS4zNTE1QzEwNi41NDMgMzUuNjcwMyAxMDYuMjc4IDM1LjkxODQgMTA1LjkyNCAzNi4wOTU4QzEwNS41NzEgMzYuMjczMSAxMDUuMTI4IDM2LjM2MTggMTA0LjU5NSAzNi4zNjE4SDEwMi43MzRWMzUuNDY2SDEwNC41QzEwNC44MzcgMzUuNDY2IDEwNS4xMSAzNS40MTc3IDEwNS4zMjEgMzUuMzIxMkMxMDUuNTM0IDM1LjIyNDYgMTA1LjY5IDM1LjA4NDMgMTA1Ljc4OSAzNC45MDAyQzEwNS44ODggMzQuNzE2MSAxMDUuOTM3IDM0LjQ5NSAxMDUuOTM3IDM0LjIzNjhDMTA1LjkzNyAzMy45NzYzIDEwNS44ODcgMzMuNzUwNyAxMDUuNzg2IDMzLjU1OTlDMTA1LjY4NyAzMy4zNjkgMTA1LjUzMSAzMy4yMjMxIDEwNS4zMTggMzMuMTIyMUMxMDUuMTA3IDMzLjAxODggMTA0LjgzIDMyLjk2NzEgMTA0LjQ4NyAzMi45NjcxSDEwMy4xODFWMzguOTcxOEgxMDIuMTQxWk0xMDUuNTQzIDM1Ljg2TDEwNy4yNDYgMzguOTcxOEgxMDYuMDYyTDEwNC4zOTMgMzUuODZIMTA1LjU0M1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xMDguODMxIDM4Ljk3MThIMTA3LjcyN0wxMTAuMjA3IDMyLjA3NDdIMTExLjQwOUwxMTMuODg5IDM4Ljk3MThIMTEyLjc4NUwxMTAuODM3IDMzLjMyNzVIMTEwLjc4M0wxMDguODMxIDM4Ljk3MThaTTEwOS4wMTYgMzYuMjcwOUgxMTIuNTk2VjM3LjE0NjVIMTA5LjAxNlYzNi4yNzA5WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTExNS45MjMgMzIuMDc0N1YzOC45NzE4SDExNC44ODRWMzIuMDc0N0gxMTUuOTIzWiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTEyMyAzMi4wNzQ3VjM4Ljk3MThIMTIyLjA0NEwxMTguNTQxIDMzLjkxMzVIMTE4LjQ3N1YzOC45NzE4SDExNy40MzhWMzIuMDc0N0gxMTguNEwxMjEuOTA2IDM3LjEzOThIMTIxLjk3VjMyLjA3NDdIMTIzWiIgZmlsbD0id2hpdGUiLz4KPGRlZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwX2xpbmVhcl81MTNfMjIyNTM3IiB4MT0iMCIgeTE9IjIwLjUiIHgyPSI0OC4wODUxIiB5Mj0iMjAuNSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjOTExRUYyIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI0Y1NUE0OCIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MV9saW5lYXJfNTEzXzIyMjUzNyIgeDE9IjAiIHkxPSIyMC41IiB4Mj0iNDguMDg1MSIgeTI9IjIwLjUiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzkxMUVGMiIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNGNTVBNDgiLz4KPC9saW5lYXJHcmFkaWVudD4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDJfbGluZWFyXzUxM18yMjI1MzciIHgxPSIwIiB5MT0iMjAuNSIgeDI9IjQ4LjA4NTEiIHkyPSIyMC41IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiM5MTFFRjIiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjRjU1QTQ4Ii8+CjwvbGluZWFyR3JhZGllbnQ+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQzX2xpbmVhcl81MTNfMjIyNTM3IiB4MT0iMCIgeTE9IjIwLjUiIHgyPSI0OC4wODUxIiB5Mj0iMjAuNSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjOTExRUYyIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI0Y1NUE0OCIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50NF9saW5lYXJfNTEzXzIyMjUzNyIgeDE9IjAiIHkxPSIyMC41IiB4Mj0iNDguMDg1MSIgeTI9IjIwLjUiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzkxMUVGMiIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNGNTVBNDgiLz4KPC9saW5lYXJHcmFkaWVudD4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDVfbGluZWFyXzUxM18yMjI1MzciIHgxPSIwIiB5MT0iMjAuNSIgeDI9IjQ4LjA4NTEiIHkyPSIyMC41IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiM5MTFFRjIiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjRjU1QTQ4Ii8+CjwvbGluZWFyR3JhZGllbnQ+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQ2X2xpbmVhcl81MTNfMjIyNTM3IiB4MT0iMCIgeTE9IjIwLjUiIHgyPSI0OC4wODUxIiB5Mj0iMjAuNSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjOTExRUYyIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI0Y1NUE0OCIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50N19saW5lYXJfNTEzXzIyMjUzNyIgeDE9IjUyLjcwMSIgeTE9IjE0Ljc4MjQiIHgyPSIxMjQuMjQ3IiB5Mj0iMTQuNzgyNCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjRjU1QTQ4Ii8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI0VGQzcyNiIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50OF9saW5lYXJfNTEzXzIyMjUzNyIgeDE9IjUyLjcwMSIgeTE9IjE0Ljc4MjQiIHgyPSIxMjQuMjQ3IiB5Mj0iMTQuNzgyNCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjRjU1QTQ4Ii8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI0VGQzcyNiIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50OV9saW5lYXJfNTEzXzIyMjUzNyIgeDE9IjUyLjcwMSIgeTE9IjE0Ljc4MjQiIHgyPSIxMjQuMjQ3IiB5Mj0iMTQuNzgyNCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjRjU1QTQ4Ii8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI0VGQzcyNiIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MTBfbGluZWFyXzUxM18yMjI1MzciIHgxPSI1Mi43MDEiIHkxPSIxNC43ODI0IiB4Mj0iMTI0LjI0NyIgeTI9IjE0Ljc4MjQiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iI0Y1NUE0OCIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNFRkM3MjYiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K';
  const CURRENT_USER = { name: 'นายเอ นามสมมุติ', email: 'test@digimusketeers.com' };
  const DIRECTORY = [
    { type: 'person', name: 'Nathapol Aubdin', email: 'nathapolaubdin@digimusketeers.com' },
    { type: 'person', name: 'Suda Srisuk', email: 'suda.srisuk@digimusketeers.com' },
    { type: 'person', name: 'Somchai Jaidee', email: 'somchai.jaidee@digimusketeers.com' },
    { type: 'person', name: 'Kanya Boonmee', email: 'kanya.boonmee@digimusketeers.com' },
    { type: 'person', name: 'Test', email: 'test2@digimusketeers.com' },
    { type: 'team', name: 'Designer Team', count: 8 },
    { type: 'team', name: 'Developer Team', count: 8 },
    { type: 'team', name: 'Marketing Team', count: 5 },
  ];
  let selectedMembers = [];

  function resetMembers() {
    selectedMembers = [];
    document.getElementById('memberSearchInput').value = '';
    document.getElementById('memberSuggestions').classList.remove('open');
    renderMemberList();
  }

  function initials(name) {
    return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  function renderMemberList() {
    const list = document.getElementById('memberList');
    list.innerHTML = '';

    const ownerRow = document.createElement('div');
    ownerRow.className = 'member-row';
    ownerRow.innerHTML = `
      <div class="m-avatar">${initials(CURRENT_USER.name)}</div>
      <div class="m-info">
        <span class="mname">${CURRENT_USER.name}</span>
        <span class="msub">${CURRENT_USER.email}</span>
      </div>
      <span class="m-owner-label">Owner</span>
    `;
    list.appendChild(ownerRow);

    selectedMembers.forEach((m, idx) => {
      const row = document.createElement('div');
      row.className = 'member-row';
      if (m.type === 'team') {
        row.innerHTML = `
          <div class="m-avatar team">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="9" cy="7" r="3"/><path d="M2 21c0-3.5 3-5.5 7-5.5s7 2 7 5.5"/><circle cx="17" cy="7" r="2.6"/><path d="M23 21c0-2.8-2.2-4.6-5-5.2"/></svg>
          </div>
          <div class="m-info">
            <span class="mname">${m.name}</span>
            <div class="mini-stack">
              ${'<div class="mini-dot"></div>'.repeat(Math.min(4, m.count))}
              <div class="mini-count">${m.count}+</div>
            </div>
          </div>
          <div class="m-role-wrap">
            <select class="m-role-select" data-idx="${idx}">
              <option ${m.role === 'Staff' ? 'selected' : ''}>Staff</option>
              <option ${m.role === 'Manager' ? 'selected' : ''}>Manager</option>
            </select>
            <button class="m-trash" data-idx="${idx}" aria-label="ลบออก">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
        `;
      } else {
        row.innerHTML = `
          <div class="m-avatar">${initials(m.name)}</div>
          <div class="m-info">
            <span class="mname">${m.name}</span>
            <span class="msub">${m.email}</span>
          </div>
          <div class="m-role-wrap">
            <select class="m-role-select" data-idx="${idx}">
              <option ${m.role === 'Staff' ? 'selected' : ''}>Staff</option>
              <option ${m.role === 'Manager' ? 'selected' : ''}>Manager</option>
            </select>
            <button class="m-trash" data-idx="${idx}" aria-label="ลบออก">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
        `;
      }
      list.appendChild(row);
    });

    list.querySelectorAll('.m-role-select').forEach(sel => {
      sel.addEventListener('change', () => {
        selectedMembers[+sel.dataset.idx].role = sel.value;
      });
    });
    list.querySelectorAll('.m-trash').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedMembers.splice(+btn.dataset.idx, 1);
        renderMemberList();
      });
    });
  }

  const memberSearchInput = document.getElementById('memberSearchInput');
  const memberSuggestions = document.getElementById('memberSuggestions');

  function renderSuggestions(query) {
    const q = query.trim().toLowerCase();
    const already = new Set(selectedMembers.map(m => m.name));
    let results = DIRECTORY.filter(d => !already.has(d.name));
    if (q) {
      results = results.filter(d =>
        d.name.toLowerCase().includes(q) ||
        (d.email && d.email.toLowerCase().includes(q))
      );
    }
    memberSuggestions.innerHTML = '';
    if (results.length === 0) {
      memberSuggestions.innerHTML = '<div class="sugg-empty">ไม่พบชื่อ อีเมล หรือกลุ่มที่ตรงกัน</div>';
    } else {
      results.slice(0, 8).forEach(d => {
        const row = document.createElement('div');
        row.className = 'sugg-row';
        if (d.type === 'team') {
          row.innerHTML = `
            <div class="sugg-avatar team">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="9" cy="7" r="3"/><path d="M2 21c0-3.5 3-5.5 7-5.5s7 2 7 5.5"/><circle cx="17" cy="7" r="2.6"/><path d="M23 21c0-2.8-2.2-4.6-5-5.2"/></svg>
            </div>
            <div class="sugg-text"><span class="sname">${d.name}</span><span class="ssub">กลุ่ม · ${d.count} คน</span></div>
          `;
        } else {
          row.innerHTML = `
            <div class="sugg-avatar">${initials(d.name)}</div>
            <div class="sugg-text"><span class="sname">${d.name}</span><span class="ssub">${d.email}</span></div>
          `;
        }
        row.addEventListener('click', () => {
          selectedMembers.push(d.type === 'team' ? { ...d, role: 'Staff' } : { ...d, role: 'Staff' });
          memberSearchInput.value = '';
          memberSuggestions.classList.remove('open');
          renderMemberList();
        });
        memberSuggestions.appendChild(row);
      });
    }
    memberSuggestions.classList.add('open');
  }

  memberSearchInput.addEventListener('focus', () => renderSuggestions(memberSearchInput.value));
  memberSearchInput.addEventListener('input', () => renderSuggestions(memberSearchInput.value));
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrap')) memberSuggestions.classList.remove('open');
  });

  modalNext.addEventListener('click', () => {
    const name = projNameInput.value.trim();
    if (!name) {
      projNameError.classList.add('show');
      return;
    }
    projNameError.classList.remove('show');
    stepProject.style.display = 'none';
    stepMembers.style.display = 'flex';
    renderMemberList();
  });

  const stepFolder = document.getElementById('stepFolder');
  const stepUpload = document.getElementById('stepUpload');
  const modalSide = document.getElementById('modalSide');
  const folderNameInput = document.getElementById('folderNameInput');
  const dropzone = document.getElementById('dropzone');
  const docFileInput = document.getElementById('docFileInput');
  const uploadedFilesList = document.getElementById('uploadedFilesList');

  document.getElementById('membersCreate').addEventListener('click', () => {
    stepMembers.style.display = 'none';
    modalSide.style.display = 'none';
    folderNameInput.value = '';
    folderNameInput.placeholder = projNameInput.value.trim();
    stepFolder.classList.add('active');
    folderNameInput.focus();
  });

  document.getElementById('folderCancel').addEventListener('click', () => {
    stepFolder.classList.remove('active');
    modalSide.style.display = '';
    stepMembers.style.display = 'flex';
    renderMemberList();
  });
  document.getElementById('uploadCancel').addEventListener('click', () => {
    stepUpload.classList.remove('active');
    stepFolder.classList.add('active');
  });

  document.getElementById('folderNext').addEventListener('click', () => {
    stepFolder.classList.remove('active');
    stepUpload.classList.add('active');
  });

  function updateAutoButtonState() {
    const createAutoBtn = document.getElementById('createAuto');
    createAutoBtn.disabled = uploadedDocs.length === 0;
  }

  function renderUploadedFiles() {
    uploadedFilesList.innerHTML = '';
    uploadedDocs.forEach((file, idx) => {
      const row = document.createElement('div');
      row.className = 'uploaded-file-row';
      row.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <span>${file.name}</span>
        <button data-idx="${idx}" aria-label="ลบไฟล์">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      `;
      uploadedFilesList.appendChild(row);
    });
    uploadedFilesList.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        uploadedDocs.splice(+btn.dataset.idx, 1);
        renderUploadedFiles();
      });
    });
    updateAutoButtonState();
  }

  function addDocs(fileList) {
    Array.from(fileList).forEach(f => uploadedDocs.push(f));
    renderUploadedFiles();
  }

  dropzone.addEventListener('click', () => docFileInput.click());
  docFileInput.addEventListener('change', () => {
    if (docFileInput.files) addDocs(docFileInput.files);
  });
  ['dragenter', 'dragover'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); dropzone.classList.add('drag-over'); });
  });
  ['dragleave', 'dragend'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); dropzone.classList.remove('drag-over'); });
  });
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault(); e.stopPropagation();
    dropzone.classList.remove('drag-over');
    if (e.dataTransfer.files) addDocs(e.dataTransfer.files);
  });

  function finalizeProject(mode) {
    stepUpload.classList.remove('active');
    document.getElementById('stepProgress').classList.add('active');
    document.getElementById('progressLabel').textContent = mode === 'auto' ? 'กำลังวิเคราะห์เอกสาร & สร้าง' : 'กำลังสร้าง';
    const fill = document.getElementById('progressFill');
    fill.style.width = '0%';
    let pct = 0;
    const timer = setInterval(() => {
      pct += 4;
      fill.style.width = Math.min(pct, 100) + '%';
      if (pct >= 100) {
        clearInterval(timer);
        setTimeout(() => completeProjectCreation(mode), 200);
      }
    }, 45);
  }

  function completeProjectCreation(mode) {
    const name = projNameInput.value.trim();
    const keyText = document.getElementById('keyPill') ? document.getElementById('keyPill').textContent : generateKey(name) + '-';
    const folderName = folderNameInput.value.trim() || name;
    const persistentImageUrl = uploadedImageFile ? URL.createObjectURL(uploadedImageFile) : null;
    const EMPTY_STATS = [
      { label: 'สำเร็จ', color: '#25A767', pctText: '00.00%', pct: 0, count: 0 },
      { label: 'กำลังทำ', color: '#5981EC', pctText: '00.00%', pct: 0, count: 0 },
      { label: 'รอตรวจ', color: '#911EF2', pctText: '00.00%', pct: 0, count: 0 },
      { label: 'ยังไม่ทำ', color: '#A7A7A7', pctText: '00.00%', pct: 0, count: 0 }
    ];
    const project = {
      name, key: keyText, folderName,
      keyPrefix: keyText.replace(/-$/, ''),
      tasks: [],
      members: selectedMembers.slice(),
      docCount: uploadedDocs.length,
      imageUrl: persistentImageUrl,
      total: 0, stats: EMPTY_STATS,
      heatActive: false, heatActivities: 0, heatTasks: 0, heatToday: 0, heatWeek: 0, heatMonth: 0,
      streak: 0, bestStreak: 0
    };

    const cardAvatar = persistentImageUrl
      ? `<img src="${persistentImageUrl}" style="width:100%;height:100%;object-fit:cover;" alt="${name}" />`
      : `<span style="font-size:22px; font-weight:700;">${name.trim().charAt(0).toUpperCase() || '?'}</span>`;

    const card = buildProjectCard({
      name,
      avatarBg: 'linear-gradient(135deg, #F55A48, #911EF2)',
      avatarContent: cardAvatar,
      state: 'empty',
      total: project.total,
      stats: project.stats,
      tasks: null
    });
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => { if (!e.target.closest('[data-stub]')) openDashboard(project); });
    projectGrid.appendChild(card);
    emptyState.style.display = 'none';

    const projectsList = document.getElementById('projectsList');
    const sideRow = document.createElement('div');
    sideRow.className = 'project-row';
    const sideIcon = persistentImageUrl
      ? `<img src="${persistentImageUrl}" alt="${name}" />`
      : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="7" width="18" height="13" rx="2"/></svg>';
    sideRow.innerHTML = `
      <span class="project-icon">${sideIcon}</span>
      <span class="label"></span>
    `;
    sideRow.querySelector('.label').textContent = name;
    sideRow.addEventListener('click', () => {
      allSelectableItems.forEach(el => el.classList.remove('active'));
      sideRow.classList.add('active');
      openDashboard(project);
    });
    projectsList.appendChild(sideRow);
    allSelectableItems.push(sideRow);
    projectsList.classList.remove('hidden');
    document.getElementById('projectsHeader').querySelector('.chev').classList.add('open');

    project.cardEl = card;
    project.sidebarEl = sideRow;
    ALL_PROJECTS.push(project);
    if (typeof renderDriveSidebarIfOpen === 'function') renderDriveSidebarIfOpen();

    closeModal();

    if (mode === 'auto') {
      showToast('สร้างโปรเจคสำเร็จ — หน้า Kanban ยังอยู่ระหว่างพัฒนา (ยังไม่ทำใน prototype นี้)');
    } else {
      showToast('สร้างโปรเจคสำเร็จ');
      openDashboard(project);
    }
  }

  document.getElementById('createNormal').addEventListener('click', () => finalizeProject('normal'));
  document.getElementById('createAuto').addEventListener('click', () => finalizeProject('auto'));

  const workspacePage = document.getElementById('workspacePage');
  const dashboardPage = document.getElementById('dashboardPage');

