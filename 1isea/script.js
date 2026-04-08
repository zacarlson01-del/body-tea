document.addEventListener("DOMContentLoaded", () => {
  // Hamburger / Mobile menu
  const menuToggle = document.getElementById("mobile-menu");
  const navList = document.querySelector(".nav-list");

  if (menuToggle && navList) {
    const closeMenu = () => navList.classList.remove("active");
    const toggleMenu = () => navList.classList.toggle("active");

    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMenu();
    });

    // Close menu when a link is clicked
    navList.querySelectorAll("a").forEach(a => {
      a.addEventListener("click", () => closeMenu());
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      const clickedInsideNav = navList.contains(e.target);
      const clickedHamburger = menuToggle.contains(e.target);
      if (!clickedInsideNav && !clickedHamburger) closeMenu();
    });
  }

  // Reveal animation for membership boxes (kept from original)
  const elements = document.querySelectorAll(".membership-box");
  if (elements.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
      });
    }, { threshold: 0.1 });

    elements.forEach(el => observer.observe(el));
  }
});
