const state = {
  lang: localStorage.getItem('exovisions-lang') || 'fr',
  theme: localStorage.getItem('exovisions-theme') || 'dark',
  data: {}
};

const translations = {
  fr: {
    hero: {
      eyebrow: 'Agence de design graphique premium',
      title: 'Nous sculptons des marques mémorables avec élégance et précision.',
      description: 'Branding, UI/UX, motion design, packaging et contenus pour les marques qui veulent se distinguer avec un langage visuel cohérent et puissant.',
      ctaPrimary: 'Voir le portfolio',
      ctaSecondary: 'Planifier une mission',
      cardTitle: 'Design premium pour l’expansion',
      cardText: 'Des systèmes de marque cohérents, des interfaces élégantes et des campagnes visuelles qui stimulent la conversion.'
    },
    metrics: {
      projects: 'projets réalisés',
      clients: 'clients satisfaits',
      rating: 'note moyenne',
      response: 'réponse moyenne'
    },
    services: { label: 'Services de haut niveau', title: 'Un studio complet pour votre présence visuelle.', description: 'Nous unissons créativité, stratégie et exécution pour produire un système cohérent à chaque point de contact.' },
    portfolio: { label: 'Réalisations', title: 'Des projets élégants, impactants et prêts à convertir.' },
    testimonials: { label: 'Témoignages', title: 'La preuve de notre impact sur le terrain.' },
    faq: { label: 'FAQ', title: 'Questions fréquentes' },
    contact: { title: 'Prêt à lancer votre prochain chapitre visuel ?' },
    admin: { title: 'Administration' }
  },
  en: {
    hero: {
      eyebrow: 'Premium graphic design agency',
      title: 'We shape memorable brands with elegance and precision.',
      description: 'Branding, UI/UX, motion design, packaging and content for brands that want to stand out with a coherent and powerful visual language.',
      ctaPrimary: 'See portfolio',
      ctaSecondary: 'Book a mission',
      cardTitle: 'Premium design for scale',
      cardText: 'Consistent brand systems, elegant interfaces and visual campaigns that drive conversion.'
    },
    metrics: {
      projects: 'projects delivered',
      clients: 'happy clients',
      rating: 'average score',
      response: 'average response'
    },
    services: { label: 'High-end services', title: 'A complete studio for your visual presence.', description: 'We blend creativity, strategy and execution to deliver a coherent system at every touchpoint.' },
    portfolio: { label: 'Projects', title: 'Elegant, impactful projects built to convert.' },
    testimonials: { label: 'Testimonials', title: 'Proof of our impact on the ground.' },
    faq: { label: 'FAQ', title: 'Frequently asked questions' },
    contact: { title: 'Ready to launch your next visual chapter?' },
    admin: { title: 'Administration' }
  }
};

function setTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('exovisions-theme', theme);
  const toggle = document.querySelector('.theme-toggle');
  if (toggle) toggle.textContent = theme === 'dark' ? '☀' : '☾';
}

function setLang(lang) {
  state.lang = lang;
  localStorage.setItem('exovisions-lang', lang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const keys = el.getAttribute('data-i18n').split('.');
    let value = translations[lang];
    keys.forEach(k => value = value?.[k]);
    if (value) el.textContent = value;
  });
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove('show'), 2200);
}

async function loadData() {
  const files = ['settings', 'services', 'portfolio', 'testimonials', 'faq', 'blog'];
  const loaded = {};
  const baseDir = window.location.pathname.includes('/pages/') ? '..' : '.';
  for (const file of files) {
    try {
      const response = await fetch(`${baseDir}/database/${file}.json`);
      if (!response.ok) continue;
      loaded[file] = await response.json();
    } catch (error) {
      console.warn(`Unable to load ${file}.json`, error);
    }
  }
  state.data = loaded;
  return loaded;
}

function renderHome() {
  const services = state.data.services || [];
  const portfolio = state.data.portfolio || [];
  const testimonials = state.data.testimonials || [];
  const faq = state.data.faq || [];
  document.getElementById('services-list').innerHTML = services.slice(0, 6).map(service => `
    <article class="card">
      <div class="meta">${service.category || 'Service'}</div>
      <h3>${service.title}</h3>
      <p>${service.description}</p>
    </article>
  `).join('');

  document.getElementById('featured-portfolio').innerHTML = portfolio.slice(0, 6).map(project => `
    <article class="card">
      <div class="meta">${project.category}</div>
      <h3>${project.title}</h3>
      <p>${project.description}</p>
      <div class="hero-highlights">
        ${project.technologies.slice(0, 3).map(t => `<span class="pill">${t}</span>`).join('')}
      </div>
    </article>
  `).join('');

  document.getElementById('testimonials-list').innerHTML = testimonials.slice(0, 3).map(item => `
    <article class="card">
      <div class="meta">${item.company}</div>
      <h3>${item.name}</h3>
      <p>“${item.comment}”</p>
    </article>
  `).join('');

  document.getElementById('faq-list').innerHTML = faq.slice(0, 5).map(item => `
    <details class="stack-item">
      <summary>${item.question}</summary>
      <p>${item.answer}</p>
    </details>
  `).join('');
}

function renderPortfolioPage() {
  const portfolio = state.data.portfolio || [];
  const list = document.getElementById('portfolio-list');
  if (!list) return;
  const filters = ['Tous', ...new Set(portfolio.map(project => project.category).filter(Boolean))];
  document.getElementById('portfolio-filters').innerHTML = filters.map((filter, index) => `<button class="filter-chip ${index === 0 ? 'active' : ''}" data-filter="${filter}">${filter}</button>`).join('');
  let activeFilter = 'Tous';
  const renderProjects = () => {
    const query = (document.getElementById('portfolio-search')?.value || '').trim().toLowerCase();
    const visible = portfolio.filter(project => {
      const matchesFilter = activeFilter === 'Tous' || project.category === activeFilter;
      const matchesQuery = !query || [project.title, project.description, project.category, project.client].join(' ').toLowerCase().includes(query);
      return matchesFilter && matchesQuery;
    });
    list.innerHTML = visible.map(project => `
      <article class="card">
        <div class="meta">${project.category}</div>
        <h3>${project.title}</h3>
        <p>${project.description}</p>
        <div class="hero-highlights">
          ${project.technologies.slice(0, 3).map(t => `<span class="pill">${t}</span>`).join('')}
        </div>
      </article>
    `).join('');
  };
  renderProjects();
  document.querySelectorAll('.filter-chip').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    activeFilter = button.dataset.filter;
    renderProjects();
  }));
  document.getElementById('portfolio-search')?.addEventListener('input', renderProjects);
}

function renderBlogPage() {
  const posts = state.data.blog || [];
  const list = document.getElementById('blog-list');
  if (!list) return;
  list.innerHTML = posts.map(post => `
    <article class="card">
      <div class="meta">${post.category}</div>
      <h3>${post.title}</h3>
      <p>${post.excerpt}</p>
      <div class="hero-highlights">
        <span class="pill">${post.date}</span>
      </div>
    </article>
  `).join('');
}

function renderCaseStudiesPage() {
  const portfolio = state.data.portfolio || [];
  const list = document.getElementById('cases-list');
  if (!list) return;
  list.innerHTML = portfolio.slice(0, 4).map(project => `
    <article class="card">
      <div class="meta">${project.client}</div>
      <h3>${project.title}</h3>
      <p>${project.description}</p>
      <div class="hero-highlights">
        <span class="pill">${project.date}</span>
        <span class="pill">${project.category}</span>
      </div>
    </article>
  `).join('');
}

function initAdmin() {
  const form = document.getElementById('admin-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    const orders = JSON.parse(localStorage.getItem('exovisions-orders') || '[]');
    orders.push({ ...payload, createdAt: new Date().toISOString() });
    localStorage.setItem('exovisions-orders', JSON.stringify(orders));
    showToast('Commande enregistrée localement');
    form.reset();
  });
  document.getElementById('export-json').addEventListener('click', () => {
    const payload = {
      portfolio: state.data.portfolio || [],
      services: state.data.services || [],
      blog: state.data.blog || [],
      orders: JSON.parse(localStorage.getItem('exovisions-orders') || '[]')
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'exovisions-export.json';
    link.click();
    showToast('Export JSON prêt');
  });
}

function initNav() {
  const nav = document.querySelector('.site-nav');
  const trigger = document.querySelector('.nav-toggle');
  if (trigger && nav) {
    trigger.addEventListener('click', () => nav.classList.toggle('open'));
  }
  document.querySelector('.theme-toggle')?.addEventListener('click', () => {
    const nextTheme = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  });
}

async function bootstrap() {
  setTheme(state.theme);
  setLang(state.lang);
  initNav();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(console.error);
  }
  await loadData();
  if (document.getElementById('services-list')) renderHome();
  if (document.getElementById('portfolio-list')) renderPortfolioPage();
  if (document.getElementById('blog-list')) renderBlogPage();
  if (document.getElementById('cases-list')) renderCaseStudiesPage();
  if (document.getElementById('admin-form')) initAdmin();
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    });
  });
}

window.addEventListener('DOMContentLoaded', bootstrap);
