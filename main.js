/*Dev Njogu PORTFOLIO — script.js
   Handles: View toggling, dynamic rendering, localStorage,
            form validation, modals, animations */

'use strict';

/* ── UTILITY HELPERS ── */

/**
 * Get element by selector (shorthand)
 */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/**
 * Show a toast notification
 */
function showToast(msg, duration = 2800) {
  const toast = $('#toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

/**
 * Persist data to localStorage under a namespaced key
 */
function saveData(key, value) {
  localStorage.setItem(`portfolio_${key}`, JSON.stringify(value));
}

/**
 * Load data from localStorage, returning a default if missing
 */
function loadData(key, fallback = null) {
  try {
    const raw = localStorage.getItem(`portfolio_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Read a File as a data URL (returns a Promise)
 */
function readFileAsDataURL(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = e => res(e.target.result);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

/**
 * Generate a simple unique ID
 */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/**
 * Build a star string (e.g. "★★★★☆")
 */
function buildStars(n) {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

/* APP STATE — seeded defaults, overridden by localStorage */

const DEFAULTS = {
  hero: {
    name: 'Dev Njogu',
    nameItalic: 'Njogu',
    title: 'Full-Stack Developer & Cybersecurity enthusiast',
    bio: 'I craft elegant, high-performance digital experiences — bridging the gap between stunning design and robust engineering. Confidence in turning complex problems into clean, scalable solutions.',
  },

  skills: [
    {
      id: uid(),
      category: 'Frontend',
      items: [
        { name: 'HTML', level: 92 },
        { name: 'JavaScript', level: 88 },
        { name: 'CSS', level: 95 },
        { name: 'Vue.js', level: 78 },
      ],
    },
    {
      id: uid(),
      category: 'Backend',
      items: [
        { name: 'Node.js', level: 85 },
        { name: 'Python', level: 80 },
        { name: 'PostgreSQL', level: 82 },
        { name: 'Mongo DB', level: 88 },
      ],
    },
    {
      id: uid(),
      category: 'Tools & DevOps',
      items: [
        { name: 'Git / GitHub', level: 94 },
        { name: 'Docker', level: 72 },
        { name: 'CI/CD (GitHub Actions)', level: 78 },
        { name: 'Figma ', level: 83 },
      ],
    },
  ],
  contact: {
    email: 'njogumugo020@gmail.com',
    location: 'Nairobi, Kenya',
    linkedin: 'www.linkedin.com/in/njogu-mugo-392b13298',
  },

  cvUrl: '',      // stores data URL of uploaded PDF
  profileImg: '', // stores data URL of profile image
};

/* ── Global state — loaded from storage or defaults ── */
let state = {
  hero:           loadData('hero',           DEFAULTS.hero),
  skills:         loadData('skills',         DEFAULTS.skills),
  projects:       loadData('projects',       DEFAULTS.projects),
  experience:     loadData('experience',     DEFAULTS.experience),
  education:      loadData('education',      DEFAULTS.education),
  certifications: loadData('certifications', DEFAULTS.certifications),
  reviews:        loadData('reviews',        DEFAULTS.reviews),
  contact:        loadData('contact',        DEFAULTS.contact),
  cvUrl:          loadData('cvUrl',          DEFAULTS.cvUrl),
  profileImg:     loadData('profileImg',     DEFAULTS.profileImg),
};

let isAdmin = false; // current view mode

/* NAVIGATION */
function initNav() {
  const navbar    = $('#navbar');
  const hamburger = $('#hamburger');
  const navLinks  = $('#navLinks');

  /* Sticky shadow on scroll */
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
    highlightActiveSection();
  });

  /* Hamburger toggle */
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  /* Close mobile menu on link click */
  $$('.nav-links a').forEach(a => {
    a.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}

function highlightActiveSection() {
  const sections = $$('section[id]');
  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 100) current = sec.id;
  });
  $$('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
  });
}

/* VIEW TOGGLE (Employer ↔ Admin)*/
function initViewToggle() {
  const toggle = $('#viewToggle');
  toggle.addEventListener('change', () => {
    isAdmin = toggle.checked;
    document.body.classList.toggle('admin-mode', isAdmin);
    showToast(isAdmin ? 'Admin mode activated' : 'Employer view active');
    // Animate skill bars when switching to employer view
    if (!isAdmin) animateSkillBars();
  });
}

/* HERO SECTION */
function renderHero() {
  const h = state.hero;

  /* Update name (keep italic second word pattern) */
  const nameWords = h.name.split(' ');
  const firstName = nameWords[0] || '';
  const lastName  = nameWords.slice(1).join(' ') || '';

  $('.hero-name').innerHTML = `${firstName}<br><em>${lastName}</em>`;
  $('#heroTitle').textContent  = h.title;
  $('#heroBio').textContent     = h.bio;

  /* Profile image */
  if (state.profileImg) {
    const img = $('#heroImg');
    img.src = state.profileImg;
    img.style.display = 'block';
    $('#heroImgPlaceholder').style.display = 'none';
  }
}

function initHeroAdmin() {
  /* Edit hero button */
  $('#editHeroBtn').addEventListener('click', () => {
    $('#editName').value = state.hero.name;
    $('#editTitle').value = state.hero.title;
    $('#editBio').value = state.hero.bio;
    $('#heroEditModal').classList.add('open');
  });

  $('#cancelHeroBtn').addEventListener('click', () => {
    $('#heroEditModal').classList.remove('open');
  });

  $('#saveHeroBtn').addEventListener('click', () => {
    state.hero.name  = $('#editName').value.trim() || state.hero.name;
    state.hero.title = $('#editTitle').value.trim() || state.hero.title;
    state.hero.bio   = $('#editBio').value.trim() || state.hero.bio;
    saveData('hero', state.hero);
    renderHero();
    $('#heroEditModal').classList.remove('open');
    showToast('✓ Hero section updated');
  });

  /* Close on backdrop click */
  $('#heroEditModal').addEventListener('click', e => {
    if (e.target === $('#heroEditModal')) $('#heroEditModal').classList.remove('open');
  });

  /* Profile image upload */
  $('#profileImageInput').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('⚠ Image too large (max 5MB)'); return; }
    const dataUrl = await readFileAsDataURL(file);
    state.profileImg = dataUrl;
    saveData('profileImg', dataUrl);
    renderHero();
    showToast('✓ Profile photo updated');
  });
}

/*SKILLS */
function renderSkills() {
  const grid = $('#skillsGrid');
  grid.innerHTML = '';

  state.skills.forEach(cat => {
    const card = document.createElement('div');
    card.className = 'skill-card reveal';
    card.dataset.id = cat.id;

    card.innerHTML = `
      <div class="skill-card-header">
        <span class="skill-card-title">${cat.category}</span>
        <span class="skill-card-icon">${cat.icon}</span>
      </div>
      ${cat.items.map(s => `
        <div class="skill-item">
          <div class="skill-meta">
            <span>${s.name}</span>
            <span>${s.level}%</span>
          </div>
          <div class="skill-bar">
            <div class="skill-bar-fill" data-level="${s.level}" style="width:0%"></div>
          </div>
        </div>
      `).join('')}
      <div class="admin-only skill-admin-actions">
        <button class="btn btn-admin-sm edit-skill-btn">✎ Edit</button>
        <button class="btn btn-danger del-skill-btn">✕ Delete</button>
      </div>
    `;

    /* Admin actions */
    card.querySelector('.edit-skill-btn')?.addEventListener('click', e => {
      e.stopPropagation();
      openSkillModal(cat.id);
    });

    card.querySelector('.del-skill-btn')?.addEventListener('click', e => {
      e.stopPropagation();
      if (!confirm(`Delete "${cat.category}" category?`)) return;
      state.skills = state.skills.filter(s => s.id !== cat.id);
      saveData('skills', state.skills);
      renderSkills();
      showToast('✓ Skill category deleted');
    });

    grid.appendChild(card);
  });

  observeReveal();
  animateSkillBars();
}

function animateSkillBars() {
  $$('.skill-bar-fill').forEach(bar => {
    // Use rAF to trigger CSS transition after paint
    requestAnimationFrame(() => {
      bar.style.width = bar.dataset.level + '%';
    });
  });
}

function initSkillsAdmin() {
  $('#addSkillBtn').addEventListener('click', () => openSkillModal(null));
}

/**
 * Open a modal to add or edit a skill category
 */
function openSkillModal(id) {
  const existing = id ? state.skills.find(s => s.id === id) : null;

  const modalContent = `
    <div class="modal-form">
      <h2 class="modal-form-title">${existing ? 'Edit' : 'Add'} Skill Category</h2>
      <div class="form-row">
        <div>
          <label>Category Name</label>
          <input type="text" id="sk_cat" value="${existing?.category || ''}" placeholder="e.g. Frontend" />
        </div>
        <div>
          <label>Icon (emoji)</label>
          <input type="text" id="sk_icon" value="${existing?.icon || '🛠'}" placeholder="🛠" />
        </div>
      </div>
      <label>Skills (one per line: "Skill Name, Level")</label>
      <textarea id="sk_items" rows="6" placeholder="React, 90&#10;TypeScript, 85&#10;CSS, 95">${(existing?.items || []).map(i => `${i.name}, ${i.level}`).join('\n')}</textarea>
      <button class="btn btn-primary" id="saveSkillBtn">Save Category</button>
    </div>
  `;

  openModal(modalContent);

  $('#saveSkillBtn').addEventListener('click', () => {
    const category = $('#sk_cat').value.trim();
    const icon = $('#sk_icon').value.trim();
    const rawItems = $('#sk_items').value.trim();

    if (!category) { showToast('⚠ Category name is required'); return; }

    const items = rawItems.split('\n')
      .map(line => {
        const parts = line.split(',');
        const name  = parts[0]?.trim();
        const level = parseInt(parts[1]) || 80;
        return name ? { name, level: Math.min(100, Math.max(0, level)) } : null;
      })
      .filter(Boolean);

    if (existing) {
      Object.assign(existing, { category, icon, items });
    } else {
      state.skills.push({ id: uid(), category, icon, items });
    }

    saveData('skills', state.skills);
    closeModal();
    renderSkills();
    showToast('✓ Skills updated');
  });
}

/*PROJECTS*/
function renderProjects() {
  const grid = $('#projectsGrid');
  grid.innerHTML = '';

  if (!state.projects.length) {
    grid.innerHTML = '<p style="color:var(--text-3);text-align:center;grid-column:1/-1">No projects yet. Add one in Admin mode.</p>';
    return;
  }

  state.projects.forEach(proj => {
    const card = document.createElement('div');
    card.className = 'project-card reveal';
    card.dataset.id = proj.id;

    const thumb = proj.thumbnail
      ? `<img src="${proj.thumbnail}" alt="${proj.title}" />`
      : `<div class="project-thumb-placeholder">💻</div>`;

    card.innerHTML = `
      <div class="project-thumb">${thumb}</div>
      <div class="project-body">
        <div class="project-tags">
          ${proj.tags.map(t => `<span class="project-tag">${t}</span>`).join('')}
        </div>
        <h3 class="project-title">${proj.title}</h3>
        <p class="project-desc">${proj.description}</p>
        <div class="project-footer">
          <span class="project-view-link">View Details →</span>
          <div class="admin-only project-admin-actions">
            <button class="btn btn-admin-sm edit-proj-btn">✎</button>
            <button class="btn btn-danger del-proj-btn">✕</button>
          </div>
        </div>
      </div>
    `;

    /* Click card body (not admin buttons) → open detail modal */
    card.querySelector('.project-thumb').addEventListener('click', () => openProjectDetail(proj.id));
    card.querySelector('.project-title').addEventListener('click', () => openProjectDetail(proj.id));
    card.querySelector('.project-desc').addEventListener('click', () => openProjectDetail(proj.id));
    card.querySelector('.project-view-link').addEventListener('click', () => openProjectDetail(proj.id));

    /* Admin actions */
    card.querySelector('.edit-proj-btn')?.addEventListener('click', e => {
      e.stopPropagation();
      openProjectForm(proj.id);
    });

    card.querySelector('.del-proj-btn')?.addEventListener('click', e => {
      e.stopPropagation();
      if (!confirm(`Delete "${proj.title}"?`)) return;
      state.projects = state.projects.filter(p => p.id !== proj.id);
      saveData('projects', state.projects);
      renderProjects();
      showToast('✓ Project deleted');
    });

    grid.appendChild(card);
  });

  observeReveal();
}

function initProjectsAdmin() {
  $('#addProjectBtn').addEventListener('click', () => openProjectForm(null));
}

/**
 * Open detailed view modal for a project
 */
function openProjectDetail(id) {
  const proj = state.projects.find(p => p.id === id);
  if (!proj) return;

  let screenshotsHtml = '';
  if (proj.screenshots?.length) {
    screenshotsHtml = `
      <p class="modal-label">Screenshots</p>
      <div class="modal-screenshots">
        ${proj.screenshots.map(s => `<img src="${s}" alt="screenshot" />`).join('')}
      </div>
    `;
  }

  let videoHtml = '';
  if (proj.videoUrl) {
    const isYT = proj.videoUrl.includes('youtube') || proj.videoUrl.includes('youtu.be');
    videoHtml = `
      <p class="modal-label">Demo Video</p>
      <div class="modal-video-wrap">
        ${isYT
          ? `<iframe src="${proj.videoUrl}" frameborder="0" allowfullscreen></iframe>`
          : `<video src="${proj.videoUrl}" controls></video>`
        }
      </div>
    `;
  }

  const content = `
    ${proj.thumbnail ? `<img class="modal-hero-img" src="${proj.thumbnail}" alt="${proj.title}" />` : ''}
    <h2 class="modal-title">${proj.title}</h2>
    <div class="modal-tags">
      ${proj.tags.map(t => `<span class="project-tag">${t}</span>`).join('')}
    </div>
    <p class="modal-desc">${proj.longDesc || proj.description}</p>
    ${videoHtml}
    ${screenshotsHtml}
    <div class="modal-links">
      ${proj.liveUrl ? `<a href="${proj.liveUrl}" target="_blank" class="btn btn-primary btn-sm">🚀 Live Demo</a>` : ''}
      ${proj.repoUrl ? `<a href="${proj.repoUrl}" target="_blank" class="btn btn-ghost btn-sm">⌥ Repository</a>` : ''}
    </div>
  `;

  openModal(content);
}

/**
 * Add or Edit project form modal
 */
function openProjectForm(id) {
  const existing = id ? state.projects.find(p => p.id === id) : null;
  let previewUrls = existing?.screenshots ? [...existing.screenshots] : [];
  let thumbUrl    = existing?.thumbnail || '';
  let videoDataUrl = existing?.videoUrl || '';

  const content = `
    <div class="modal-form">
      <h2 class="modal-form-title">${existing ? 'Edit' : 'Add'} Project</h2>

      <label>Project Title</label>
      <input type="text" id="pf_title" value="${existing?.title || ''}" placeholder="My Awesome Project" />

      <label>Short Description</label>
      <textarea id="pf_desc" rows="2" placeholder="Brief summary...">${existing?.description || ''}</textarea>

      <label>Full Description</label>
      <textarea id="pf_longdesc" rows="3" placeholder="Detailed description...">${existing?.longDesc || ''}</textarea>

      <label>Technologies (comma separated)</label>
      <input type="text" id="pf_tags" value="${(existing?.tags || []).join(', ')}" placeholder="React, Node.js, PostgreSQL" />

      <div class="form-row">
        <div>
          <label>Live URL</label>
          <input type="url" id="pf_live" value="${existing?.liveUrl || ''}" placeholder="https://..." />
        </div>
        <div>
          <label>Repository URL</label>
          <input type="url" id="pf_repo" value="${existing?.repoUrl || ''}" placeholder="https://github.com/..." />
        </div>
      </div>

      <label>Thumbnail Image</label>
      <input type="file" id="pf_thumb" accept="image/*" />
      ${thumbUrl ? `<img class="preview-thumb" id="thumbPreview" src="${thumbUrl}" alt="thumb" style="width:140px;height:90px;margin-top:6px" />` : '<div id="thumbPreview"></div>'}

      <label>Screenshots (multiple)</label>
      <input type="file" id="pf_shots" accept="image/*" multiple />
      <div class="image-preview-row" id="shotsPreview">
        ${previewUrls.map(s => `<img class="preview-thumb" src="${s}" alt="ss" />`).join('')}
      </div>

      <label>Demo Video (file upload)</label>
      <input type="file" id="pf_video" accept="video/*" />
      ${videoDataUrl ? `<video src="${videoDataUrl}" controls style="width:100%;border-radius:8px;margin-top:6px;max-height:150px"></video>` : ''}

      <label>Or paste Video URL (YouTube embed)</label>
      <input type="url" id="pf_videourl" value="${(!videoDataUrl && existing?.videoUrl) ? existing.videoUrl : ''}" placeholder="https://www.youtube.com/embed/..." />

      <button class="btn btn-primary" id="saveProjBtn">Save Project</button>
    </div>
  `;

  openModal(content);

  /* Thumbnail preview */
  $('#pf_thumb').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    thumbUrl = await readFileAsDataURL(file);
    const prev = $('#thumbPreview');
    if (prev.tagName === 'IMG') prev.src = thumbUrl;
    else {
      const img = document.createElement('img');
      img.className = 'preview-thumb';
      img.src = thumbUrl;
      img.style.cssText = 'width:140px;height:90px;margin-top:6px';
      prev.replaceWith(img);
    }
  });

  /* Screenshots preview */
  $('#pf_shots').addEventListener('change', async e => {
    const files = [...e.target.files];
    const urls  = await Promise.all(files.map(readFileAsDataURL));
    previewUrls = [...previewUrls, ...urls];
    const row = $('#shotsPreview');
    row.innerHTML = previewUrls.map(s => `<img class="preview-thumb" src="${s}" alt="ss" />`).join('');
  });

  /* Video file preview */
  $('#pf_video').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    videoDataUrl = await readFileAsDataURL(file);
    showToast('✓ Video loaded');
  });

  /* Save */
  $('#saveProjBtn').addEventListener('click', () => {
    const title   = $('#pf_title').value.trim();
    const desc    = $('#pf_desc').value.trim();
    const longDesc = $('#pf_longdesc').value.trim();
    const tags    = $('#pf_tags').value.split(',').map(t => t.trim()).filter(Boolean);
    const liveUrl = $('#pf_live').value.trim();
    const repoUrl = $('#pf_repo').value.trim();
    const videoUrlInput = $('#pf_videourl').value.trim();
    const finalVideo = videoDataUrl || videoUrlInput;

    if (!title) { showToast('⚠ Title is required'); return; }

    const data = { title, description: desc, longDesc, tags, liveUrl, repoUrl,
                   thumbnail: thumbUrl, screenshots: previewUrls, videoUrl: finalVideo };

    if (existing) {
      Object.assign(existing, data);
    } else {
      state.projects.push({ id: uid(), ...data });
    }

    saveData('projects', state.projects);
    closeModal();
    renderProjects();
    showToast('✓ Project saved');
  });
}

/* CV SECTION*/
function renderCV() {
  /* Download button */
  const dlBtn = $('#downloadCvBtn');
  if (state.cvUrl) {
    dlBtn.href = state.cvUrl;
    dlBtn.download = 'AlexMorgan_CV.pdf';
    dlBtn.textContent = 'Download PDF';
  } else {
    dlBtn.href = '#';
    dlBtn.textContent = 'Download PDF (placeholder)';
    dlBtn.addEventListener('click', e => {
      e.preventDefault();
      if (!isAdmin) showToast('📄 CV not yet uploaded. Enable Admin mode to upload.');
    });
  }

  renderTimeline('experience',  state.experience,  '#experienceTimeline');
  renderTimeline('education',   state.education,   '#educationTimeline');
  renderCerts();
}

function renderTimeline(type, items, selector) {
  const el = $(selector);
  el.innerHTML = '';

  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'timeline-item';
    div.dataset.id = item.id;

    div.innerHTML = `
      <p class="timeline-date">${item.date}</p>
      <p class="timeline-role">${item.role}</p>
      <p class="timeline-company">${item.company}</p>
      <p class="timeline-desc">${item.desc}</p>
      <div class="admin-only timeline-admin">
        <button class="btn btn-admin-sm edit-timeline-btn">✎ Edit</button>
        <button class="btn btn-danger del-timeline-btn">✕</button>
      </div>
    `;

    div.querySelector('.edit-timeline-btn')?.addEventListener('click', () => openTimelineForm(type, item.id));
    div.querySelector('.del-timeline-btn')?.addEventListener('click', () => {
      if (!confirm('Delete this entry?')) return;
      state[type] = state[type].filter(i => i.id !== item.id);
      saveData(type, state[type]);
      renderTimeline(type, state[type], selector);
      showToast('✓ Entry deleted');
    });

    el.appendChild(div);
  });
}

function renderCerts() {
  const list = $('#certsList');
  list.innerHTML = '';

  state.certifications.forEach(cert => {
    const li = document.createElement('li');
    li.className = 'cert-item';
    li.innerHTML = `
      <span class="cert-icon">🏅</span>
      <div>
        <p class="cert-name">${cert.name}</p>
        <p class="cert-issuer">${cert.issuer}</p>
      </div>
      <button class="admin-only cert-del" title="Delete" data-id="${cert.id}">✕</button>
    `;

    li.querySelector('.cert-del')?.addEventListener('click', () => {
      state.certifications = state.certifications.filter(c => c.id !== cert.id);
      saveData('certifications', state.certifications);
      renderCerts();
      showToast('✓ Certificate removed');
    });

    list.appendChild(li);
  });
}

function initCVAdmin() {
  /* Upload CV PDF */
  $('#cvUploadInput').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') { showToast('⚠ Please upload a PDF file'); return; }
    if (file.size > 10 * 1024 * 1024) { showToast('⚠ PDF too large (max 10MB)'); return; }
    const dataUrl = await readFileAsDataURL(file);
    state.cvUrl = dataUrl;
    saveData('cvUrl', dataUrl);
    renderCV();
    showToast('✓ CV uploaded');
  });

  /* Add Certificate */
  $('#addCertBtn').addEventListener('click', () => {
    const content = `
      <div class="modal-form">
        <h2 class="modal-form-title">Add Certificate</h2>
        <label>Certificate Name</label>
        <input type="text" id="cert_name" placeholder="AWS Solutions Architect" />
        <label>Issuer & Year</label>
        <input type="text" id="cert_issuer" placeholder="Amazon Web Services · 2024" />
        <button class="btn btn-primary" id="saveCertBtn">Save</button>
      </div>
    `;

    openModal(content);

    $('#saveCertBtn').addEventListener('click', () => {
      const name   = $('#cert_name').value.trim();
      const issuer = $('#cert_issuer').value.trim();
      if (!name) { showToast('⚠ Name required'); return; }
      state.certifications.push({ id: uid(), name, issuer });
      saveData('certifications', state.certifications);
      closeModal();
      renderCerts();
      showToast('✓ Certificate added');
    });
  });

  /* Add Experience */
  $('#addExpBtn').addEventListener('click', () => openTimelineForm('experience', null));

  /* Add Education */
  $('#addEduBtn').addEventListener('click', () => openTimelineForm('education', null));
}

function openTimelineForm(type, id) {
  const existing = id ? state[type].find(i => i.id === id) : null;

  const content = `
    <div class="modal-form">
      <h2 class="modal-form-title">${existing ? 'Edit' : 'Add'} ${type === 'experience' ? 'Experience' : 'Education'}</h2>
      <label>Date / Period</label>
      <input type="text" id="tl_date" value="${existing?.date || ''}" placeholder="2022 – Present" />
      <label>${type === 'experience' ? 'Role / Position' : 'Degree / Course'}</label>
      <input type="text" id="tl_role" value="${existing?.role || ''}" placeholder="${type === 'experience' ? 'Senior Developer' : 'BSc Computer Science'}" />
      <label>${type === 'experience' ? 'Company' : 'Institution'}</label>
      <input type="text" id="tl_company" value="${existing?.company || ''}" placeholder="${type === 'experience' ? 'Techify Labs' : 'University of Nairobi'}" />
      <label>Description</label>
      <textarea id="tl_desc" rows="3" placeholder="What you achieved or learned...">${existing?.desc || ''}</textarea>
      <button class="btn btn-primary" id="saveTlBtn">Save</button>
    </div>
  `;

  openModal(content);

  const selector = type === 'experience' ? '#experienceTimeline' : '#educationTimeline';

  $('#saveTlBtn').addEventListener('click', () => {
    const date    = $('#tl_date').value.trim();
    const role    = $('#tl_role').value.trim();
    const company = $('#tl_company').value.trim();
    const desc    = $('#tl_desc').value.trim();

    if (!role) { showToast('⚠ Role/Degree is required'); return; }

    const entry = { date, role, company, desc };

    if (existing) {
      Object.assign(existing, entry);
    } else {
      state[type].push({ id: uid(), ...entry });
    }

    saveData(type, state[type]);
    closeModal();
    renderTimeline(type, state[type], selector);
    showToast('✓ Entry saved');
  });
}

/* REVIEWS*/
function renderReviews() {
  const grid = $('#reviewsGrid');
  grid.innerHTML = '';

  state.reviews.forEach(rev => {
    const card = document.createElement('div');
    card.className = 'review-card reveal';

    card.innerHTML = `
      <button class="review-del admin-only" title="Delete review" data-id="${rev.id}">✕</button>
      <div class="review-quote">"</div>
      <p class="review-text">${rev.text}</p>
      <div class="review-stars">${buildStars(rev.rating)}</div>
      <div class="review-author">
        <div class="review-avatar">${rev.name[0]}</div>
        <div>
          <p class="review-name">${rev.name}</p>
          <p class="review-role">${rev.role}</p>
        </div>
      </div>
    `;

    card.querySelector('.review-del')?.addEventListener('click', () => {
      if (!confirm('Delete this review?')) return;
      state.reviews = state.reviews.filter(r => r.id !== rev.id);
      saveData('reviews', state.reviews);
      renderReviews();
      showToast('✓ Review deleted');
    });

    grid.appendChild(card);
  });

  observeReveal();
}

function initReviewForm() {
  $('#addReviewBtn').addEventListener('click', () => {
    let selectedRating = 5;

    const content = `
      <div class="modal-form">
        <h2 class="modal-form-title">Leave a Review</h2>
        <label>Your Name</label>
        <input type="text" id="rv_name" placeholder="Jane Smith" />
        <label>Your Role / Title</label>
        <input type="text" id="rv_role" placeholder="Product Manager, ACME Corp" />
        <label>Rating</label>
        <div class="star-picker" id="starPicker">
          ${[1,2,3,4,5].map(n => `<span data-val="${n}" class="${n <= selectedRating ? 'active' : ''}">★</span>`).join('')}
        </div>
        <label>Review</label>
        <textarea id="rv_text" rows="4" placeholder="Share your experience working with Alex..."></textarea>
        <button class="btn btn-primary" id="saveReviewBtn">Submit Review</button>
      </div>
    `;

    openModal(content);

    /* Star picker interaction */
    const picker = $('#starPicker');
    picker.addEventListener('click', e => {
      if (e.target.dataset.val) {
        selectedRating = parseInt(e.target.dataset.val);
        $$('span', picker).forEach(s => s.classList.toggle('active', parseInt(s.dataset.val) <= selectedRating));
      }
    });

    $('#saveReviewBtn').addEventListener('click', () => {
      const name = $('#rv_name').value.trim();
      const role = $('#rv_role').value.trim();
      const text = $('#rv_text').value.trim();

      if (!name || !text) { showToast('⚠ Name and review text are required'); return; }

      state.reviews.push({ id: uid(), name, role, rating: selectedRating, text });
      saveData('reviews', state.reviews);
      closeModal();
      renderReviews();
      showToast('✓ Thank you for your review!');
    });
  });
}

/*CONTACT*/
function renderContact() {
  const c = state.contact;
  $('#contactEmail').textContent   = c.email;
  $('#contactLocation').textContent = c.location;
  const li = $('#contactLinkedIn');
  li.textContent = c.linkedin;
  li.href = `https://${c.linkedin}`;
}

function initContactAdmin() {
  $('#editContactBtn').addEventListener('click', () => {
    const c = state.contact;
    const content = `
      <div class="modal-form">
        <h2 class="modal-form-title">Edit Contact Info</h2>
        <label>Email</label>
        <input type="email" id="ct_email" value="${c.email}" />
        <label>Location</label>
        <input type="text" id="ct_loc" value="${c.location}" />
        <label>LinkedIn URL (without https://)</label>
        <input type="text" id="ct_li" value="${c.linkedin}" />
        <button class="btn btn-primary" id="saveContactBtn">Save</button>
      </div>
    `;

    openModal(content);

    $('#saveContactBtn').addEventListener('click', () => {
      state.contact.email    = $('#ct_email').value.trim() || c.email;
      state.contact.location = $('#ct_loc').value.trim() || c.location;
      state.contact.linkedin = $('#ct_li').value.trim() || c.linkedin;
      saveData('contact', state.contact);
      closeModal();
      renderContact();
      showToast('✓ Contact info updated');
    });
  });
}

function initContactForm() {
  const form      = $('#contactForm');
  const nameEl    = $('#contactName');
  const emailEl   = $('#contactEmailInput');
  const msgEl     = $('#contactMsg');
  const success   = $('#formSuccess');

  function setError(inputEl, errorId, msg) {
    $(errorId).textContent = msg;
    inputEl.classList.toggle('error', !!msg);
  }

  function validate() {
    let valid = true;
    const name  = nameEl.value.trim();
    const email = emailEl.value.trim();
    const msg   = msgEl.value.trim();

    if (!name) {
      setError(nameEl, '#nameError', 'Name is required');
      valid = false;
    } else { setError(nameEl, '#nameError', ''); }

    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setError(emailEl, '#emailError', 'Email is required');
      valid = false;
    } else if (!emailRx.test(email)) {
      setError(emailEl, '#emailError', 'Please enter a valid email');
      valid = false;
    } else { setError(emailEl, '#emailError', ''); }

    if (!msg) {
      setError(msgEl, '#msgError', 'Message is required');
      valid = false;
    } else if (msg.length < 20) {
      setError(msgEl, '#msgError', 'Message must be at least 20 characters');
      valid = false;
    } else { setError(msgEl, '#msgError', ''); }

    return valid;
  }

  /* Real-time validation on blur */
  [nameEl, emailEl, msgEl].forEach(el => el.addEventListener('blur', validate));

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!validate()) return;

    /* Simulate submission */
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Sending…';

    setTimeout(() => {
      form.reset();
      success.classList.add('show');
      btn.disabled = false;
      btn.textContent = 'Send Message';
      setTimeout(() => success.classList.remove('show'), 5000);
    }, 1400);
  });
}

/*MODAL UTILITY */
function openModal(htmlContent) {
  $('#modalBody').innerHTML = htmlContent;
  $('#modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  $('#modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function initModal() {
  $('#modalClose').addEventListener('click', closeModal);
  $('#modalOverlay').addEventListener('click', e => {
    if (e.target === $('#modalOverlay')) closeModal();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

/*INTERSECTION OBSERVER — reveal animations */
let observer;

function observeReveal() {
  if (observer) observer.disconnect();

  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        /* Animate skill bars when they come into view */
        if (entry.target.classList.contains('skill-card')) {
          entry.target.querySelectorAll('.skill-bar-fill').forEach(bar => {
            bar.style.width = bar.dataset.level + '%';
          });
        }
      }
    });
  }, { threshold: 0.12 });

  $$('.reveal').forEach(el => observer.observe(el));
}

/* SMOOTH SCROLL OFFSET (account for fixed nav)*/
function initSmoothScroll() {
  $$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: offset, behavior: 'smooth' });
    });
  });
}

/*BOOTSTRAP — init everything */
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initViewToggle();
  initModal();
  initSmoothScroll();

  /* Render all sections */
  renderHero();
  renderSkills();
  renderProjects();
  renderCV();
  renderReviews();
  renderContact();

  /* Admin capabilities */
  initHeroAdmin();
  initSkillsAdmin();
  initProjectsAdmin();
  initCVAdmin();
  initReviewForm();
  initContactAdmin();
  initContactForm();

  /* Initial scroll highlight */
  highlightActiveSection();

  /* Observe existing reveals */
  observeReveal();

  console.log('%c Dev Njogu Portfolio ', 'background:#d4a558;color:#0f0f0f;font-weight:bold;padding:4px 8px;border-radius:4px;');
  console.log('Toggle Admin mode with the switch in the navbar to manage content.');
});