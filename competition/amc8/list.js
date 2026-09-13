/* AMC 8 practice-tests list: per-exam status from local records.
 * Keys mirror the shared exam engine (tobymath.<examId>.current/result.v1).
 * Read-only here except Retake, which clears that year's live exam only.
 */
(function () {
  "use strict";

  function fmtLeft(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    var m = Math.floor(s / 60);
    return m + ":" + (s % 60 < 10 ? "0" : "") + (s % 60) + " left";
  }

  function load(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function link(href, text, primary) {
    var a = document.createElement("a");
    a.href = href;
    a.className = "btn " + (primary ? "btn-primary" : "btn-ghost");
    if (primary) {
      a.style.background = "var(--accent)";
      a.style.color = "#fff";
    } else {
      a.style.border = "1px solid var(--line)";
      a.style.color = "var(--ink)";
    }
    a.textContent = text;
    return a;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var cards = document.querySelectorAll('#test-list .card[data-exam]');
    cards.forEach(function (card) {
      var exam = card.getAttribute("data-exam");
      var year = card.getAttribute("data-exam-year");
      var status = card.querySelector("[data-status]");
      var actions = card.querySelector("[data-actions]");
      var now = Date.now();
      var cur = load("tobymath." + exam + ".current.v1");
      var res = load("tobymath." + exam + ".result.v1");
      var live = cur && cur.status === "in-progress" && cur.endsAt > now;

      actions.innerHTML = "";
      if (live) {
        status.textContent = "Test in progress — " + fmtLeft(cur.endsAt - now) + ".";
        actions.appendChild(link(year + "/index.html#/test", "Resume Test", true));
        actions.appendChild(link(year + "/index.html", "View Instructions", false));
      } else {
        if (res) {
          status.textContent = "Last submitted score: " + res.score + " / 25 (" +
            (res.submitMode === "expired" ? "time expired" : "submitted") + ").";
          actions.appendChild(link(year + "/index.html#/result", "View Results", true));
          var retake = link(year + "/index.html", "Retake Test", false);
          retake.addEventListener("click", function (e) {
            // Fresh record for this year only; other years untouched.
            e.preventDefault();
            try { localStorage.removeItem("tobymath." + exam + ".current.v1"); } catch (err) {}
            location.href = year + "/index.html";
          });
          actions.appendChild(retake);
        } else {
          status.textContent = "Not started on this device.";
          actions.appendChild(link(year + "/index.html", "View Instructions", true));
        }
      }
    });
  });
})();
