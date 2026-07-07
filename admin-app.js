import {
  db,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc
} from './firebase-config.js';
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

function toProject(item) {
  return {
    id: item.id,
    title: item.title || 'Projet',
    description: item.description || '',
    imageUrl: item.imageUrl || '',
    createdAt: item.createdAt || new Date().toISOString(),
    owner: item.owner || 'local'
  };
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Impossible de lire l’image.'));
    reader.readAsDataURL(file);
  });
}

async function loadProjectsFromRemote() {
  try {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const projects = snapshot.docs.map((docSnap) => toProject({ id: docSnap.id, ...docSnap.data() }));
    if (projects.length) {
      writeProjects(projects);
      return projects;
    }
  } catch (error) {
    console.warn('Remote project loading failed; using local data instead.', error);
  }

  return readProjects();
}

async function saveProjectToRemote(project) {
  try {
    const docRef = await addDoc(collection(db, 'projects'), project);
    return { id: docRef.id, ...project };
  } catch (error) {
    console.warn('Remote save failed; saving locally instead.', error);
    return project;
  }
}

async function deleteProjectFromRemote(id) {
  try {
    await deleteDoc(doc(db, 'projects', id));
    return true;
  } catch (error) {
    console.warn('Remote delete failed.', error);
    return false;
  }
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

  const projects = await loadProjectsFromRemote();
  state.projects = projects.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
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

      status.textContent = 'Publication en cours...';

      try {
        const imageUrl = await fileToDataUrl(file);
        const project = {
          title,
          description,
          imageUrl,
          createdAt: new Date().toISOString(),
          owner: user.uid
        };

        const savedProject = await saveProjectToRemote(project);
        const projects = [toProject(savedProject), ...readProjects().filter((item) => item.id !== savedProject.id)];
        writeProjects(projects);
        form.reset();
        status.textContent = 'Photo publiée en ligne.';
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

      const removed = await deleteProjectFromRemote(id);
      if (removed) {
        const projects = readProjects().filter((project) => project.id !== id);
        writeProjects(projects);
        status.textContent = 'Entrée supprimée en ligne.';
        await loadProjects();
      } else {
        status.textContent = 'Suppression locale seulement.';
      }
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
