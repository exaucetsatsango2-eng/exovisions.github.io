/* ExoVisions_Win — script principal */
(function () {
  const CFG = window.EXO_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;

  /* Année du pied de page */
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* Thème clair / sombre */
  $$('.theme-btn').forEach((b) => b.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try { localStorage.setItem('exo-theme', next); } catch (e) { /* stockage indisponible */ }
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', next === 'light' ? '#F5F8FB' : '#1C202B');
  }));

  /* Menu mobile */
  const menuBtn = $('.menu-btn');
  const nav = $('#nav');
  if (menuBtn && nav) {
    const setMenu = (open) => {
      nav.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    };
    menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
    });
  }

  /* Boutons WhatsApp / e-mail (cachés tant que js/config.js est vide) */
  const wa = String(CFG.whatsapp || '').replace(/\D/g, '');
  $$('[data-whatsapp]').forEach((a) => {
    if (wa) { a.href = 'https://wa.me/' + wa; a.target = '_blank'; a.rel = 'noopener'; }
    else a.hidden = true;
  });
  $$('[data-email]').forEach((a) => {
    if (CFG.email) a.href = 'mailto:' + CFG.email;
    else a.hidden = true;
  });

  /* Copier une couleur de la charte */
  $$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); } catch (e) { /* copie impossible */ }
    const label = $('small', b);
    const old = label.textContent;
    label.textContent = 'Copié';
    setTimeout(() => { label.textContent = old; }, 1400);
  }));

  /* Logo d'accueil : la bille orange suit le pointeur */
  const pupil = $('#pupil');
  const mark = $('#hero-mark');
  if (pupil && mark && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    addEventListener('pointermove', (e) => {
      const r = mark.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height * (103.5 / 207);
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(7, d / 40);
      pupil.style.transform = `translate(${(dx / d * k).toFixed(2)}px, ${(dy / d * k).toFixed(2)}px)`;
    }, { passive: true });
  }

  /* Formulaire de contact : prépare le message et l'envoie par WhatsApp (ou e-mail) */
  const form = $('#contact-form');
  if (form) {
    const status = $('#form-status');
    const say = (msg, isError) => {
      status.textContent = msg;
      status.classList.toggle('error', !!isError);
    };

    const wanted = new URLSearchParams(location.search).get('offre');
    if (wanted) {
      const sel = form.elements.offre;
      [...sel.options].forEach((o) => { if (o.value === wanted) sel.value = wanted; });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const d = new FormData(form);
      const text =
        `Bonjour ExoVisions_Win,\n\nJe m'appelle ${d.get('nom')}.\n` +
        `Offre souhaitée : ${d.get('offre')}\n\n${d.get('message')}\n\n` +
        `Pour me répondre : ${d.get('contact')}`;

      if (wa) {
        window.open('https://wa.me/' + wa + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
        say('WhatsApp s’ouvre avec votre message. Appuyez sur Envoyer pour le transmettre.');
      } else if (CFG.email) {
        location.href = 'mailto:' + CFG.email +
          '?subject=' + encodeURIComponent('Demande de devis — ' + d.get('offre')) +
          '&body=' + encodeURIComponent(text);
        say('Votre messagerie s’ouvre avec votre message.');
      } else {
        say('Le formulaire n’est pas encore actif : aucun moyen de contact n’est renseigné.', true);
        console.warn('Renseigne whatsapp ou email dans js/config.js');
      }
    });
  }
})();
