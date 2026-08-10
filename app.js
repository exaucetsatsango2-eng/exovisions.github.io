"use strict";

/* =========================================================
   EXOVISIONS — V2 FRONTEND
   Navigation, thème, animations et UX
========================================================= */

const App = {

  init() {

    this.theme();
    this.navigation();
    this.scrollHeader();
    this.activeNavigation();
    this.reveal();
    this.links();

  },


  /* ================= THEME ================= */

  theme() {

    const button = document.getElementById("themeToggle");

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


  /* ================= MOBILE NAV ================= */

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


  /* ================= HEADER ================= */

  scrollHeader() {

    const header =
      document.getElementById("header");

    if (!header) return;

    const update = () => {

      if (window.scrollY > 30) {

        header.style.boxShadow =
          "0 10px 40px rgba(0,0,0,.15)";

      } else {

        header.style.boxShadow = "none";

      }

    };

    window.addEventListener(
      "scroll",
      update,
      { passive: true }
    );

    update();

  },


  /* ================= ACTIVE NAV ================= */

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
        {
          threshold: .35
        }
      );


    sections.forEach(section => {

      observer.observe(section);

    });

  },


  /* ================= REVEAL ================= */

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
                easing: "cubic-bezier(.2,.8,.2,1)",
                fill: "forwards"
              }
            );

            observer.unobserve(entry.target);

          });

        },
        {
          threshold: .12
        }
      );


    elements.forEach(element => {

      element.style.opacity = "0";

      observer.observe(element);

    });

  },


  /* ================= SMOOTH LINKS ================= */

  links() {

    document
      .querySelectorAll('a[href^="#"]')
      .forEach(link => {

        link.addEventListener("click", event => {

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

        });

      });

  }

};


document.addEventListener(
  "DOMContentLoaded",
  () => App.init()
);