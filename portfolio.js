const STORAGE_KEYS = {
  projects: 'exo-local-projects'
};

const container = document.getElementById('portfolio-dynamic-grid');

if (container) {
  container.innerHTML = '<p class="loading-state">Chargement du portfolio…</p>';

  function readProjects() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.projects) || '[]');
    } catch (error) {
      return [];
    }
  }

  function loadProjects() {
    try {
      const projects = readProjects().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

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
            <h3 class="fr-title">${project.description || 'Projet ajouté localement'}</h3>
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
