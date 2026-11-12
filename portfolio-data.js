/* ============================================================
   TES RÉALISATIONS — c'est ici que tu places tes images.

   1. Dépose l'image dans le dossier  assets/portfolio/
      (ex. assets/portfolio/logo-boulangerie.jpg)
   2. Dans le bloc correspondant ci-dessous, écris le chemin dans  src
      (ex. src: "assets/portfolio/logo-boulangerie.jpg")
   3. Enregistre : l'image apparaît sur la page Réalisations.

   Pour ajouter une réalisation : copie un bloc { ... }, sépare-le
   du précédent par une virgule, puis modifie ses champs.

   Champs :
   - title    : nom affiché sous l'image
   - category : logo | branding | affiche | social
   - src      : chemin de l'image (laisse "" tant qu'elle n'est pas prête)
   - alt      : description de l'image pour l'accessibilité (facultatif)
   - featured : true = affichée aussi sur la page d'accueil (3 maximum)

   Attention : GitHub Pages distingue majuscules et minuscules.
   "Logo.JPG" et "logo.jpg" sont deux fichiers différents.
   ============================================================ */

window.PORTFOLIO_CATEGORIES = {
  logo: "Logos",
  branding: "Branding & charte graphique",
  affiche: "Affiches & supports imprimés",
  social: "Réseaux sociaux & événements"
};

window.PORTFOLIO = [
  { title: "Logo — nom du client",       category: "logo",     src: "", alt: "", featured: true },
  { title: "Charte graphique — client",  category: "branding", src: "", alt: "", featured: true },
  { title: "Affiche — événement",        category: "affiche",  src: "", alt: "", featured: true },
  { title: "Visuel réseaux sociaux",     category: "social",   src: "", alt: "", featured: false },
  { title: "Calicot — client",           category: "affiche",  src: "", alt: "", featured: false },
  { title: "Save the date — mariage",    category: "social",   src: "", alt: "", featured: false }
];
