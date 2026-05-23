document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // 1. EFFET SCROLL HEADER (Réduction Menu + Logo)
    // ==========================================
    const header = document.querySelector(".main-header");
    const logoImg = document.querySelector(".logo-img");

    window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
            header.style.padding = "8px 0";
            header.style.backgroundColor = "rgba(0, 43, 97, 0.98)";
            if (logoImg) logoImg.style.height = "35px"; // Réduction fluide du logo
        } else {
            header.style.padding = "15px 0";
            header.style.backgroundColor = "#002754";
            if (logoImg) logoImg.style.height = "45px"; // Retour à la taille normale
        }
    });

    // ==========================================
    // 2. ACTIVATION DES BARRES DE COMPÉTENCES
    // ==========================================
    const progressBars = document.querySelectorAll(".progress");
    
    // Déclenchement automatique de l'animation au chargement
    setTimeout(() => {
        progressBars.forEach(bar => {
            const targetWidth = bar.getAttribute("data-width");
            bar.style.width = targetWidth;
        });
    }, 300);

    // // ==========================================
// 3. GESTION DU FORMULAIRE DE CONTACT
// ==========================================
const contactForm = document.querySelector(".contact-form");

if (contactForm) {
    contactForm.addEventListener("submit", () => {
        // On affiche juste un message rapide, le HTML va gérer le reste de l'envoi
        alert("Préparation de l'envoi de votre message...");
    });
}

    // ==========================================
    // 4. GESTION DE LA CLASSE ACTIVE SUR LE MENU
    // ==========================================
    const navLinks = document.querySelectorAll(".main-nav ul li a");
    
    navLinks.forEach(link => {
        link.addEventListener("click", () => {
            navLinks.forEach(l => l.classList.remove("active"));
            link.classList.add("active");
        });
    });
});
