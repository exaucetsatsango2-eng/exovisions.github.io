import {
  db,
  collection,
  getDocs,
  query,
  orderBy
} from './firebase-config.js';

const container = document.getElementById('portfolio-dynamic-grid');

if (container) {
  container.innerHTML = '<p class="loading-state">Chargement du portfolio…</p>';

  async function loadProjects() {
    try {
      const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const projects = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

      if (!projects.length) {
        container.innerHTML = '<p class="empty-state">Aucun projet publié pour le moment.</p>';
        return;
      }

      container.innerHTML = '';
      projects.forEach((project, index) => {
        const card = document.createElement('article');
        const className = index % 2 === 0 ? 'project-card large' : 'project-card small';
        card.className = className;
        card.innerHTML = `
          <div class="card-bg-gradient"></div>
          <div class="project-image-wrapper">
            <img src="${project.imageUrl}" alt="${project.title || 'Projet ExoVisions'}" class="project-img" />
          </div>
          <div class="project-info">
            <span class="eng-title">${project.title || 'Portfolio'}</span>
            <h3 class="fr-title">${project.description || 'Projet mis à jour via Firebase'}</h3>
          </div>
        `;
        container.appendChild(card);
      });
    } catch (error) {
      container.innerHTML = '<p class="empty-state">Le contenu dynamique n’a pas pu être chargé.</p>';
    }
  }

  loadProjects();
}
