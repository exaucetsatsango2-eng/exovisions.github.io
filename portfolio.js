/* Affichage des réalisations à partir de js/portfolio-data.js */
(function () {
  const grid = document.querySelector('[data-portfolio]');
  if (!grid) return;

  const items = (window.PORTFOLIO || []).map((p, i) => ({ ...p, id: i }));
  const cats = window.PORTFOLIO_CATEGORIES || {};
  const mode = grid.dataset.portfolio; // "featured" (accueil) ou "all" (page Réalisations)
  let visible = []; // réalisations avec image, pour naviguer dans la lightbox

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  function tileHTML(p) {
    const cap = `<span class="tile-cap"><strong>${esc(p.title)}</strong><span>${esc(cats[p.category] || '')}</span></span>`;
    if (p.src) {
      return `<li class="tile"><button class="tile-btn" type="button" data-id="${p.id}" aria-label="Agrandir : ${esc(p.title)}">` +
        `<img src="${esc(p.src)}" alt="${esc(p.alt || p.title)}" loading="lazy">${cap}</button></li>`;
    }
    return `<li class="tile"><div class="tile-static"><div class="tile-empty"><span>Visuel bientôt disponible</span></div>${cap}</div></li>`;
  }

  function render(filter) {
    let list = items;
    if (mode === 'featured') {
      list = items.filter((p) => p.featured);
      if (!list.length) list = items;
      list = list.slice(0, 3);
    } else if (filter && filter !== 'all') {
      list = items.filter((p) => p.category === filter);
    }
    visible = list.filter((p) => p.src);
    grid.innerHTML = list.length
      ? list.map(tileHTML).join('')
      : '<li class="empty-msg">Aucune réalisation dans cette catégorie pour le moment.</li>';
  }

  /* Filtres */
  const bar = document.getElementById('filters');
  if (bar && mode === 'all') {
    const used = [...new Set(items.map((p) => p.category))].filter((c) => cats[c]);
    bar.innerHTML = ['all', ...used].map((c) =>
      `<button class="chip" type="button" data-filter="${c}" aria-pressed="${c === 'all'}">${c === 'all' ? 'Tout' : esc(cats[c])}</button>`
    ).join('');
    bar.addEventListener('click', (e) => {
      const b = e.target.closest('[data-filter]');
      if (!b) return;
      bar.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      render(b.dataset.filter);
    });
  }

  /* Lightbox */
  const dlg = document.getElementById('lightbox');
  let idx = 0;

  function show(i) {
    if (!visible.length) return;
    idx = (i + visible.length) % visible.length;
    const p = visible[idx];
    const img = dlg.querySelector('img');
    img.src = p.src;
    img.alt = p.alt || p.title;
    dlg.querySelector('.lb-title').textContent = p.title;
    dlg.querySelector('.lb-cat').textContent = cats[p.category] || '';
    dlg.querySelectorAll('[data-lb="prev"],[data-lb="next"]').forEach((b) => { b.hidden = visible.length < 2; });
  }

  if (dlg) {
    grid.addEventListener('click', (e) => {
      const b = e.target.closest('.tile-btn');
      if (!b) return;
      const k = visible.findIndex((p) => p.id === Number(b.dataset.id));
      if (k < 0) return;
      show(k);
      dlg.showModal();
    });
    dlg.addEventListener('click', (e) => {
      const action = e.target.closest('[data-lb]')?.dataset.lb;
      if (action === 'close' || e.target === dlg) dlg.close();
      if (action === 'prev') show(idx - 1);
      if (action === 'next') show(idx + 1);
    });
    dlg.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  render('all');
})();
