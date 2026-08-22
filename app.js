"use strict";

/*
=========================================================
EXOVISIONS — FULLSTACK FRONTEND
Supabase + UX + Navigation
=========================================================
*/

const App = {

  supabase: null,

  async init() {

    this.initSupabase();

    this.theme();
    this.navigation();
    this.scrollHeader();
    this.activeNavigation();
    this.reveal();
    this.links();

    await this.loadProjects();
    await this.bindForms();

  },


  /* =====================================================
     SUPABASE
  ===================================================== */

  initSupabase() {

    if (
      typeof supabase === "undefined" ||
      !window.EXOVISIONS_SUPABASE
    ) {
      console.warn("Supabase non configuré.");
      return;
    }

    this.supabase = supabase.createClient(
      window.EXOVISIONS_SUPABASE.url,
      window.EXOVISIONS_SUPABASE.key
    );

  },


  /* =====================================================
     THEME
  ===================================================== */

  theme() {

    const button =
      document.getElementById("themeToggle");

    if (!button) return;

    const savedTheme =
      localStorage.getItem("exovisions-theme");

    if (savedTheme === "light") {

      document.body.classList.add("light");

      button.textContent = "☾";

    }

    button.addEventListener("click", () => {

      document.body.classList.toggle("light");

      const isLight =
        document.body.classList.contains("light");

      localStorage.setItem(
        "exovisions-theme",
        isLight ? "light" : "dark"
      );

      button.textContent =
        isLight ? "☾" : "☼";

    });

  },


  /* =====================================================
     MOBILE NAV
  ===================================================== */

  navigation() {

    const button =
      document.getElementById("menuButton");

    const navigation =
      document.getElementById("navigation");

    if (!button || !navigation) return;

    button.addEventListener("click", () => {

      navigation.classList.toggle("open");

    });

    navigation
      .querySelectorAll("a")
      .forEach(link => {

        link.addEventListener("click", () => {

          navigation.classList.remove("open");

        });

      });

  },


  /* =====================================================
     HEADER
  ===================================================== */

  scrollHeader() {

    const header =
      document.getElementById("header");

    if (!header) return;

    const update = () => {

      header.style.boxShadow =
        window.scrollY > 30
          ? "0 10px 40px rgba(0,0,0,.15)"
          : "none";

    };

    window.addEventListener(
      "scroll",
      update,
      { passive: true }
    );

    update();

  },


  /* =====================================================
     ACTIVE NAVIGATION
  ===================================================== */

  activeNavigation() {

    const sections =
      document.querySelectorAll("section[id]");

    const links =
      document.querySelectorAll(".nav-link");

    if (!sections.length || !links.length) return;

    const observer =
      new IntersectionObserver(
        entries => {

          entries.forEach(entry => {

            if (!entry.isIntersecting) return;

            links.forEach(link => {

              link.classList.remove("active");

              if (
                link.getAttribute("href") ===
                `#${entry.target.id}`
              ) {

                link.classList.add("active");

              }

            });

          });

        },
        { threshold: .35 }
      );

    sections.forEach(section => {

      observer.observe(section);

    });

  },


  /* =====================================================
     REVEAL
  ===================================================== */

  reveal() {

    const elements =
      document.querySelectorAll(
        ".service-card, .project, .process-item, .about-card, .cta-card"
      );

    if (!elements.length) return;

    const observer =
      new IntersectionObserver(
        entries => {

          entries.forEach(entry => {

            if (!entry.isIntersecting) return;

            entry.target.animate(
              [
                {
                  opacity: 0,
                  transform: "translateY(25px)"
                },
                {
                  opacity: 1,
                  transform: "translateY(0)"
                }
              ],
              {
                duration: 650,
                easing:
                  "cubic-bezier(.2,.8,.2,1)",
                fill: "forwards"
              }
            );

            observer.unobserve(entry.target);

          });

        },
        { threshold: .12 }
      );

    elements.forEach(element => {

      element.style.opacity = "0";

      observer.observe(element);

    });

  },


  /* =====================================================
     PROJECTS
  ===================================================== */

  async loadProjects() {

    if (!this.supabase) return;

    const container =
      document.querySelector("[data-projects]");

    if (!container) return;

    const {
      data,
      error
    } = await this.supabase
      .from("projets")
      .select("*")
      .eq("published", true)
      .order("created_at", {
        ascending: false
      });

    if (error) {

      console.error(
        "Erreur projets:",
        error
      );

      return;

    }

    if (!data || !data.length) return;

    container.innerHTML =
      data.map(project => `

        <article
          class="project"
          data-project-id="${this.escape(project.id)}"
        >

          ${
            project.image_url
              ? `
                <img
                  src="${this.escape(project.image_url)}"
                  alt="${this.escape(project.title || "Projet ExoVisions")}"
                  loading="lazy"
                >
              `
              : ""
          }

          <div class="project-content">

            <small>
              ${this.escape(project.category || "")}
            </small>

            <h3>
              ${this.escape(project.title || "")}
            </h3>

            ${
              project.description
                ? `
                  <p>
                    ${this.escape(project.description)}
                  </p>
                `
                : ""
            }

          </div>

        </article>

      `).join("");

  },


  /* =====================================================
     CONTACT / COMMANDES
  ===================================================== */

  async bindForms() {

    if (!this.supabase) return;

    const forms =
      document.querySelectorAll(
        "form[data-supabase]"
      );

    forms.forEach(form => {

      form.addEventListener(
        "submit",
        async event => {

          event.preventDefault();

          const table =
            form.dataset.supabase;

          if (
            !["contacts", "commandes"]
              .includes(table)
          ) {

            return;

          }

          const formData =
            new FormData(form);

          const payload = {};

          formData.forEach(
            (value, key) => {

              if (value !== "") {

                payload[key] = value;

              }

            }
          );

          const button =
            form.querySelector(
              "button[type='submit']"
            );

          if (button) {

            button.disabled = true;

            button.dataset.originalText =
              button.textContent;

            button.textContent =
              "Envoi...";

          }

          const {
            error
          } = await this.supabase
            .from(table)
            .insert(payload);

          if (button) {

            button.disabled = false;

            button.textContent =
              button.dataset.originalText;

          }

          if (error) {

            console.error(error);

            this.notify(
              "Une erreur est survenue. Réessayez."
            );

            return;

          }

          form.reset();

          this.notify(
            "Votre demande a bien été envoyée."
          );

        }
      );

    });

  },


  /* =====================================================
     TOAST
  ===================================================== */

  notify(message) {

    let toast =
      document.getElementById(
        "exovisions-toast"
      );

    if (!toast) {

      toast =
        document.createElement("div");

      toast.id =
        "exovisions-toast";

      toast.style.position = "fixed";
      toast.style.bottom = "20px";
      toast.style.right = "20px";
      toast.style.zIndex = "99999";
      toast.style.padding = "14px 18px";
      toast.style.borderRadius = "12px";
      toast.style.background = "#111";
      toast.style.color = "#fff";
      toast.style.fontSize = "13px";
      toast.style.boxShadow =
        "0 15px 40px rgba(0,0,0,.25)";

      document.body.appendChild(toast);

    }

    toast.textContent = message;

    toast.style.opacity = "1";

    clearTimeout(
      this.toastTimer
    );

    this.toastTimer =
      setTimeout(() => {

        toast.style.opacity = "0";

      }, 3500);

  },


  /* =====================================================
     ESCAPE HTML
  ===================================================== */

  escape(value) {

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  },


  /* =====================================================
     SMOOTH LINKS
  ===================================================== */

  links() {

    document
      .querySelectorAll('a[href^="#"]')
      .forEach(link => {

        link.addEventListener(
          "click",
          event => {

            const id =
              link.getAttribute("href");

            if (!id || id === "#") return;

            const target =
              document.querySelector(id);

            if (!target) return;

            event.preventDefault();

            target.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });

          }
        );

      });

  }

};


document.addEventListener(
  "DOMContentLoaded",
  () => App.init()
);