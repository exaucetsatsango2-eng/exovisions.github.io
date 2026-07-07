import { isAdminUser, getCurrentUser, logout, onAuthChange } from './auth.js';

const STORAGE_KEYS = {
  projects: 'exo-local-projects'
};

const state = {
  projects: [],
  eventsBound: false
};

function readProjects() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.projects) || '[]');
  } catch (error) {
    return [];
  }
}

function writeProjects(projects) {
  localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(projects));
}

function ensureSeedProjects() {
  const projects = readProjects();
  if (!projects.length) {
    const seedProjects = [
      {
        id: 'seed-1',
        title: 'Branding ExoVisions',
        description: 'Une identité visuelle pensée pour un lancement premium.',
        imageUrl: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80',
        createdAt: new Date().toISOString()
      }
    ];
    writeProjects(seedProjects);
    return seedProjects;
  }
  return projects;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Impossible de lire l’image.'));
    reader.readAsDataURL(file);
  });
}

export async function initAdminDashboard() {
  const currentUser = getCurrentUser();

  const handleAuth = async (user) => {
    const authorized = await isAdminUser(user);

    if (!user) {
      window.location.href = 'login.html?redirect=admin.html';
      return;
    }

    if (!authorized) {
      renderLockedShell(user);
      return;
    }

    renderAdminShell(user);
    await loadProjects();
    bindEvents();
  };

  if (currentUser) {
    await handleAuth(currentUser);
    return;
  }

  onAuthChange((user) => {
    if (!user) return;
    handleAuth(user);
  });
}

function renderAdminShell(user) {
  const adminContent = document.getElementById('admin-content');
  const lockedContent = document.getElementById('locked-content');
  const userBadge = document.getElementById('user-pill');
  const adminLink = document.getElementById('admin-link');
  const loginLink = document.getElementById('login-link');

  if (adminContent && lockedContent) {
    adminContent.hidden = false;
    lockedContent.hidden = true;
  }

  if (userBadge) {
    userBadge.hidden = false;
    userBadge.textContent = `Admin · ${user.email}`;
  }

  if (adminLink) adminLink.hidden = false;
  if (loginLink) loginLink.hidden = true;
}

function renderLockedShell(user) {
  const adminContent = document.getElementById('admin-content');
  const lockedContent = document.getElementById('locked-content');
  const userBadge = document.getElementById('user-pill');
  const adminLink = document.getElementById('admin-link');
  const loginLink = document.getElementById('login-link');

  if (adminContent && lockedContent) {
    adminContent.hidden = true;
    lockedContent.hidden = false;
  }

  if (userBadge) {
    userBadge.hidden = false;
    userBadge.textContent = user?.email ? `Compte · ${user.email}` : 'Compte non autorisé';
  }

  if (adminLink) adminLink.hidden = true;
  if (loginLink) loginLink.hidden = false;
}

async function loadProjects() {
  const list = document.getElementById('project-list');
  if (!list) return;

  ensureSeedProjects();
  state.projects = readProjects().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  list.innerHTML = '';

  if (!state.projects.length) {
    list.innerHTML = '<li class="empty-state">Aucune photo publiée pour le moment.</li>';
    return;
  }

  state.projects.forEach((project) => {
    const item = document.createElement('li');
    item.className = 'admin-item';
    item.innerHTML = `
      <img src="${project.imageUrl}" alt="${project.title || 'Projet'}" />
      <div>
        <strong>${project.title || 'Projet sans titre'}</strong>
        <p>${project.description || ''}</p>
        <button class="btn-danger" data-id="${project.id}">Supprimer</button>
      </div>
    `;
    list.appendChild(item);
  });
}

function bindEvents() {
  if (state.eventsBound) return;

  const form = document.getElementById('project-form');
  const fileInput = document.getElementById('project-image');
  const titleInput = document.getElementById('project-title');
  const descriptionInput = document.getElementById('project-description');
  const status = document.getElementById('admin-status');
  const logoutButton = document.getElementById('logout-button');
  const list = document.getElementById('project-list');

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!fileInput?.files?.length) {
        status.textContent = 'Choisissez une image avant l’envoi.';
        return;
      }

      const file = fileInput.files[0];
      const title = titleInput?.value.trim() || 'Projet';
      const description = descriptionInput?.value.trim() || '';
      const user = getCurrentUser();

      if (!user) return;

      status.textContent = 'Téléversement en cours...';

      try {
        const imageUrl = await fileToDataUrl(file);
        const project = {
          id: `project-${Date.now()}`,
          title,
          description,
          imageUrl,
          createdAt: new Date().toISOString(),
          owner: user.uid
        };

        const projects = [project, ...readProjects()];
        writeProjects(projects);
        form.reset();
        status.textContent = 'Photo ajoutée avec succès.';
        await loadProjects();
      } catch (error) {
        status.textContent = error.message || 'Erreur lors du téléversement.';
      }
    });
  }

  if (list) {
    list.addEventListener('click', async (event) => {
      const button = event.target.closest('button[data-id]');
      if (!button) return;

      const { id } = button.dataset;
      if (!confirm('Supprimer cette entrée ?')) return;

      const projects = readProjects().filter((project) => project.id !== id);
      writeProjects(projects);
      status.textContent = 'Entrée supprimée.';
      await loadProjects();
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      await logout();
      window.location.href = 'login.html';
    });
  }

  state.eventsBound = true;
}
