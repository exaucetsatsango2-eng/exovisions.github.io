import {
  db,
  storage,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  serverTimestamp
} from './firebase-config.js';
import { isAdminUser, getCurrentUser, logout, onAuthChange } from './auth.js';

const state = {
  projects: [],
  eventsBound: false
};

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

  const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  state.projects = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

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
        <button class="btn-danger" data-id="${project.id}" data-image="${project.imagePath || ''}">Supprimer</button>
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

      const storageRef = ref(storage, `projects/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(snapshot.ref);

      await addDoc(collection(db, 'projects'), {
        title,
        description,
        imageUrl,
        imagePath: snapshot.ref.fullPath,
        owner: user.uid,
        createdAt: serverTimestamp()
      });

      form.reset();
      status.textContent = 'Photo ajoutée avec succès.';
      await loadProjects();
    });
  }

  if (list) {
    list.addEventListener('click', async (event) => {
      const button = event.target.closest('button[data-id]');
      if (!button) return;

      const { id, image } = button.dataset;
      if (!confirm('Supprimer cette entrée ?')) return;

      try {
        if (image) {
          await deleteObject(ref(storage, image));
        }
        await deleteDoc(doc(db, 'projects', id));
        status.textContent = 'Entrée supprimée.';
        await loadProjects();
      } catch (error) {
        status.textContent = 'Erreur lors de la suppression.';
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
