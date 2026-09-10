(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    /* Mobile nav toggle */
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".nav");
    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        nav.classList.toggle("open");
      });
    }

    /* Active nav link based on current path */
    var path = location.pathname.split("/").filter(Boolean);
    var docName = path.pop() || "index.html";
    var links = document.querySelectorAll(".nav a");
    links.forEach(function (a) {
      var href = a.getAttribute("href") || "";
      var matchesHome = docName === "index.html" && (href === "index.html" || href === "./" || href === ".");
      var matchesLeaf = href.indexOf(docName) !== -1 && href !== "index.html";
      if (matchesHome || matchesLeaf) a.classList.add("active");
    });

    /* Dark / light theme */
    var THEME_KEY = "toby.theme";
    var toggle = document.querySelector(".theme-toggle");
    var apply = function (theme) {
      document.documentElement.setAttribute("data-theme", theme);
      try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
      if (toggle) toggle.textContent = theme === "dark" ? "\u2600" : "\u263E";
    };
    var stored = null;
    try { stored = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (stored) {
      apply(stored);
    } else {
      var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      apply(prefersDark ? "dark" : "light");
    }
    if (toggle) {
      toggle.addEventListener("click", function () {
        var current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
        apply(current === "dark" ? "light" : "dark");
      });
    }

    /* Footer year */
    var yr = document.querySelectorAll("[data-year]");
    yr.forEach(function (el) { el.textContent = new Date().getFullYear(); });
  });
})();