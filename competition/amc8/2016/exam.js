/* 2016 AMC 8 timed practice — single-page exam app.
 * Views: #/instructions, #/test, #/result (hash-routed, no server fallback needed).
 * Timing is wall-clock based (endsAt - now); refresh/background never extends it.
 */
(function () {
  "use strict";

  var CURR_KEY = "tobymath.amc8.2016.current.v1";
  var RES_KEY = "tobymath.amc8.2016.result.v1";
  var TAB_KEY = "tobymath.amc8.2016.tab";
  var OFFICIAL_DURATION = 2400; // 40 minutes — the published configuration.
  var LOCK_FRESH_MS = 15000;

  var LETTERS = ["A", "B", "C", "D", "E"];

  // Localhost-only clock override for timeout testing (?dur=SECONDS).
  // Ignored on any other host; production timing stays 2400 s.
  function effectiveDuration() {
    var host = location.hostname || "";
    if (host === "localhost" || host === "127.0.0.1") {
      var m = /[?&]dur=(\d+)/.exec(location.search || "");
      if (m) {
        var s = parseInt(m[1], 10);
        if (s >= 5 && s <= 2400) return s;
      }
    }
    return OFFICIAL_DURATION;
  }

  /* ---------- tiny helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function fmtMMSS(ms) {
    if (ms < 0) ms = 0;
    var s = Math.ceil(ms / 1000);
    return pad(Math.floor(s / 60)) + ":" + pad(s % 60);
  }
  function fmtUsed(ms) {
    var s = Math.max(0, Math.round(ms / 1000));
    return Math.floor(s / 60) + " min " + pad(s % 60) + " sec";
  }
  function uid() {
    return "a" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function load(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function save(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }
  function storageOK() {
    try {
      var k = "tobymath.amc8.2016.probe";
      localStorage.setItem(k, "1");
      localStorage.removeItem(k);
      return true;
    } catch (e) { return false; }
  }

  /* ---------- math-safe markdown (LaTeX preserved for MathJax) ---------- */
  function renderMathMd(src) {
    var s = String(src || "");
    var d = [], ix = [];
    s = s.replace(/\$\$([\s\S]+?)\$\$/g, function (m) {
      d.push(m);
      return "@@MATHD" + (d.length - 1) + "@@";
    });
    s = s.replace(/\$([^$\n]+?)\$/g, function (m) {
      ix.push(m);
      return "@@MATHI" + (ix.length - 1) + "@@";
    });

    // Preserve the small set of raw HTML tags used by the bank (<ul>/<li>).
    var tags = [];
    s = s.replace(/<\/?(?:ul|li)>/gi, function (m) {
      tags.push(m);
      return "@@TAG" + (tags.length - 1) + "@@";
    });
    s = esc(s);

    var figs = [];
    s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, function (m, alt, url) {
      figs.push({ alt: alt, src: url });
      return "@@FIG" + (figs.length - 1) + "@@";
    });

    function figHtml(f) {
      return '<figure class="fig"><img src="' + esc(f.src) + '" alt="' +
        esc(f.alt || "Problem diagram") + '" loading="lazy">' +
        "<figcaption>Diagram — select it to zoom in or out.</figcaption></figure>";
    }

    var blocks = s.split(/\n\s*\n/);
    var html = blocks.map(function (block) {
      var b = block.trim();
      if (!b) return "";
      // Figure-only block.
      if (/^(?:@@FIG\d+@@\s*)+$/.test(b)) {
        return b.replace(/@@FIG(\d+)@@/g, function (m, n) { return figHtml(figs[+n]); });
      }
      // List block: rejoin lines, restore tags.
      if (b.indexOf("@@TAG") !== -1) {
        var list = b.replace(/\n+/g, "");
        list = list.replace(/@@TAG(\d+)@@/g, function (m, n) { return tags[+n]; });
        return list;
      }
      // Text block (may contain inline figures + math placeholders).
      var parts = b.split(/(@@FIG\d+@@)/g).map(function (part) {
        var fm = /^@@FIG(\d+)@@$/.exec(part);
        if (fm) return figHtml(figs[+fm[1]]);
        return "<p>" + part.replace(/\n/g, "<br>") + "</p>";
      });
      return parts.join("");
    }).join("");

    html = html.replace(/@@MATHD(\d+)@@/g, function (m, n) { return d[+n]; });
    html = html.replace(/@@MATHI(\d+)@@/g, function (m, n) { return ix[+n]; });
    return html;
  }

  function typeset(el) {
    try {
      if (window.MathJax && MathJax.typesetPromise) {
        return MathJax.typesetPromise([el]).catch(function () {});
      }
    } catch (e) {}
    return Promise.resolve();
  }
  function mathReady() {
    return !!(window.MathJax && MathJax.typesetPromise);
  }

  /* ---------- app state ---------- */
  var bank = null;          // runtime question bank
  var bankFailed = false;
  var canStore = true;
  var tabId = null;
  try {
    tabId = sessionStorage.getItem(TAB_KEY);
    if (!tabId) {
      tabId = uid();
      sessionStorage.setItem(TAB_KEY, tabId);
    }
  } catch (e) { tabId = uid(); }

  var ui = {
    view: "instructions",
    currentQ: 1,
    filter: "all",
    warned5: false,
    warned1: false,
    settling: false,
    settled: false,
    saveMsg: ""
  };
  var timerId = null;
  var hbId = null;

  function getCurrent() { return load(CURR_KEY); }
  function getResult() { return load(RES_KEY); }

  function answeredCount(rec) {
    var n = 0;
    for (var i = 1; i <= 25; i++) if (rec.answers && rec.answers[i]) n++;
    return n;
  }
  function markedCount(rec) {
    return rec.marked ? rec.marked.length : 0;
  }

  /* ---------- view switching ---------- */
  var VIEWS = ["instructions", "test", "result"];
  function show(view) {
    ui.view = view;
    VIEWS.forEach(function (v) {
      var el = $("view-" + v);
      if (el) el.hidden = (v !== view);
    });
    if (location.hash !== "#/" + view) {
      try { history.replaceState(null, "", "#/" + view); } catch (e) { location.hash = "#/" + view; }
    }
    window.scrollTo(0, 0);
  }

  /* ---------- instructions ---------- */
  function refreshInstructions() {
    var cur = getCurrent();
    var res = getResult();
    var now = Date.now();
    var live = cur && cur.status === "in-progress" && cur.endsAt > now;

    $("btn-resume-wrap").hidden = !live;
    if (live) {
      $("btn-resume").textContent = "Resume Test (" + fmtMMSS(cur.endsAt - now) + " left)";
    }
    $("btn-viewresult-wrap").hidden = !res;
    if (res) {
      $("last-score").textContent = "Last submitted score: " + res.score + " / 25 (" +
        (res.submitMode === "expired" ? "time expired" : "submitted") + ").";
    } else {
      $("last-score").textContent = "";
    }

    // Another tab owns the live exam.
    var taken = live && cur.lock && cur.lock.tabId && cur.lock.tabId !== tabId &&
      (now - (cur.lock.hb || 0)) < LOCK_FRESH_MS;
    $("tab-taken").hidden = !taken;

    // Readiness gate: bank + renderer must be ready before Start is allowed.
    var ready = bank && !bankFailed && mathReady();
    var gate = $("load-status");
    if (bankFailed) {
      gate.textContent = "The test could not be loaded. Please try again.";
      gate.className = "notice error";
      gate.hidden = false;
    } else if (!bank || !mathReady()) {
      gate.textContent = "Loading test questions, diagrams, and the formula renderer…";
      gate.className = "notice";
      gate.hidden = false;
    } else {
      gate.hidden = true;
    }

    if (!canStore) {
      $("no-store").hidden = false;
    } else {
      $("no-store").hidden = true;
    }
    updateStartBtn(!!ready);
  }

  function updateStartBtn(ready) {
    var ok = ready && $("ack").checked && (canStore || $("ack-nostore").checked);
    $("btn-start").disabled = !ok;
  }

  function bindInstructions() {
    $("ack").addEventListener("change", function () { updateStartBtn(bank && mathReady()); });
    $("ack-nostore").addEventListener("change", function () { updateStartBtn(bank && mathReady()); });
    $("btn-start").addEventListener("click", startExam);
    $("btn-resume").addEventListener("click", function () { enterTest(); });
    $("btn-viewresult").addEventListener("click", function () {
      var r = getResult();
      if (r) renderResult(r, null);
    });
    $("btn-takeover").addEventListener("click", function () {
      var cur = getCurrent();
      if (cur) {
        cur.lock = { tabId: tabId, hb: Date.now() };
        try { save(CURR_KEY, cur); } catch (e) {}
      }
      refreshInstructions();
    });
  }

  function startExam() {
    if (!bank) return;
    var dur = effectiveDuration();
    var now = Date.now();
    var rec = {
      attemptId: uid(),
      examId: "amc8-2016",
      bankVersion: bank.bankVersion || "1.0",
      durationSec: dur,
      startedAt: now,
      endsAt: now + dur * 1000,
      status: "in-progress",
      answers: {},
      marked: [],
      current: 1,
      lock: { tabId: tabId, hb: now }
    };
    try {
      save(CURR_KEY, rec);
    } catch (e) {
      if (canStore) {
        canStore = false;
        refreshInstructions();
        return;
      }
      // Storage unavailable but student confirmed: keep going in memory only.
    }
    ui.currentQ = 1;
    ui.warned5 = false;
    ui.warned1 = false;
    ui.settling = false;
    ui.settled = false;
    enterTest();
  }

  /* ---------- test view ---------- */
  function enterTest() {
    var cur = getCurrent();
    var now = Date.now();
    if (!cur || cur.status !== "in-progress") { show("instructions"); refreshInstructions(); return; }
    if (cur.endsAt <= now) {
      // Returned after the deadline: lock immediately, no answering allowed.
      settle("expired");
      return;
    }
    // Claim the tab lock (keeps the original deadline).
    cur.lock = { tabId: tabId, hb: Date.now() };
    try { save(CURR_KEY, cur); } catch (e) {}
    ui.currentQ = cur.current >= 1 && cur.current <= 25 ? cur.current : 1;
    ui.warned5 = false;
    ui.warned1 = false;
    ui.settling = false;
    ui.settled = false;
    show("test");
    renderQuestion();
    renderNavigator();
    startTimer();
    startHeartbeat();
  }

  function qByNumber(n) {
    for (var i = 0; i < bank.questions.length; i++) {
      if (bank.questions[i].number === n) return bank.questions[i];
    }
    return null;
  }

  function persist(mut) {
    var cur = getCurrent();
    if (!cur || cur.status !== "in-progress") return false;
    if (Date.now() >= cur.endsAt) { settle("expired"); return false; }
    mut(cur);
    cur.lock = { tabId: tabId, hb: Date.now() };
    try {
      save(CURR_KEY, cur);
      ui.saveMsg = "Saved on this device";
      var el = $("save-state");
      if (el) { el.textContent = ui.saveMsg; el.className = "q-meta"; }
      return true;
    } catch (e) {
      ui.saveMsg = "Your latest changes could not be saved on this device. Keep this page open.";
      var el2 = $("save-state");
      if (el2) { el2.textContent = ui.saveMsg; el2.className = "q-meta save-fail"; }
      return true; // in-memory answers still apply for this session
    }
  }

  function renderQuestion() {
    var cur = getCurrent();
    if (!cur) { show("instructions"); refreshInstructions(); return; }
    var n = ui.currentQ;
    var q = qByNumber(n);
    if (!q) return;

    $("q-title").textContent = "Question " + n + " of 25";
    $("q-title").focus({ preventScroll: true });
    $("q-counts").textContent = "Answered " + answeredCount(cur) + " / 25";

    var stem = $("q-stem");
    stem.innerHTML = renderMathMd(q.stem);
    stem.querySelectorAll(".fig img").forEach(function (img) {
      img.addEventListener("click", function () {
        var fig = img.closest(".fig");
        if (fig) fig.classList.toggle("enlarged");
      });
    });

    var yours = cur.answers ? cur.answers[n] : null;
    var field = $("q-opts");
    field.innerHTML = "";
    var legend = document.createElement("legend");
    legend.textContent = "Choose one answer (A–E).";
    field.appendChild(legend);
    LETTERS.forEach(function (L, i) {
      var label = document.createElement("label");
      label.className = "opt" + (yours === L ? " picked" : "");
      var input = document.createElement("input");
      input.type = "radio";
      input.name = "q";
      input.value = L;
      input.checked = (yours === L);
      input.setAttribute("aria-label", "Option " + L);
      input.addEventListener("change", function () {
        var ok = persist(function (c) {
          c.answers[n] = L;
          c.current = n;
        });
        if (ok) { renderQuestionOptions(); renderNavigator(); }
      });
      var lw = document.createElement("span");
      lw.className = "opt-letter";
      lw.textContent = L + ".";
      var tx = document.createElement("span");
      tx.className = "opt-text";
      tx.innerHTML = renderMathMd(q.options[i]);
      label.appendChild(input);
      label.appendChild(lw);
      label.appendChild(tx);
      field.appendChild(label);
    });

    var marked = cur.marked && cur.marked.indexOf(n) !== -1;
    var mk = $("btn-mark");
    mk.textContent = marked ? "Remove Mark" : "Mark for Review";
    mk.setAttribute("aria-pressed", marked ? "true" : "false");

    $("btn-clear").disabled = !yours;
    $("btn-prev").disabled = (n === 1);
    $("btn-next").textContent = (n === 25) ? "Review Answer Sheet" : "Next";

    typeset($("q-card"));
  }

  // Light re-render of option states after a choice (keeps focus stable).
  function renderQuestionOptions() {
    var cur = getCurrent();
    if (!cur) return;
    var n = ui.currentQ;
    var yours = cur.answers ? cur.answers[n] : null;
    var inputs = $("q-opts").querySelectorAll('input[name="q"]');
    inputs.forEach(function (input) {
      var on = input.value === yours;
      input.checked = on;
      var label = input.closest("label");
      if (label) label.classList.toggle("picked", on);
    });
    $("btn-clear").disabled = !yours;
    $("q-counts").textContent = "Answered " + answeredCount(cur) + " / 25";
  }

  function renderNavigator() {
    var cur = getCurrent();
    if (!cur) return;
    var grid = $("nav-grid");
    grid.innerHTML = "";
    for (var n = 1; n <= 25; n++) {
      (function (num) {
        var b = document.createElement("button");
        b.type = "button";
        var a = cur.answers ? cur.answers[num] : null;
        var m = cur.marked && cur.marked.indexOf(num) !== -1;
        var cls = (a ? "answered" : "unanswered") + (num === ui.currentQ ? " current" : "");
        b.className = cls;
        b.innerHTML = esc(String(num < 10 ? "0" + num : num)) + (m ? '<span class="mk" aria-hidden="true">⚑</span>' : "");
        var label = "Question " + num + ", " + (a ? "answered" : "unanswered") + (m ? ", marked for review" : "") + (num === ui.currentQ ? ", current" : "");
        b.setAttribute("aria-label", label);
        b.addEventListener("click", function () { gotoQ(num); });
        grid.appendChild(b);
      })(n);
    }
    $("nav-counts").textContent = "Answered " + answeredCount(cur) + " of 25 · Unanswered " +
      (25 - answeredCount(cur)) + " · Marked " + markedCount(cur);
  }

  function gotoQ(n) {
    if (n < 1 || n > 25) return;
    var ok = persist(function (c) { c.current = n; });
    if (!ok && !getCurrent()) return;
    ui.currentQ = n;
    renderQuestion();
    renderNavigator();
  }

  function bindTest() {
    $("btn-prev").addEventListener("click", function () { gotoQ(ui.currentQ - 1); });
    $("btn-next").addEventListener("click", function () {
      if (ui.currentQ === 25) {
        // Review the answer sheet — never an implicit submit.
        var det = $("nav-details");
        if (det) det.open = true;
        $("exam-side").scrollIntoView({ behavior: "smooth", block: "start" });
        $("btn-submit").focus({ preventScroll: true });
      } else {
        gotoQ(ui.currentQ + 1);
      }
    });
    $("btn-clear").addEventListener("click", function () {
      var n = ui.currentQ;
      persist(function (c) { if (c.answers) delete c.answers[n]; c.current = n; });
      renderQuestionOptions();
      renderNavigator();
    });
    $("btn-mark").addEventListener("click", function () {
      var n = ui.currentQ;
      persist(function (c) {
        c.marked = c.marked || [];
        var i = c.marked.indexOf(n);
        if (i === -1) c.marked.push(n); else c.marked.splice(i, 1);
        c.current = n;
      });
      var cur = getCurrent();
      var marked = cur && cur.marked && cur.marked.indexOf(n) !== -1;
      var mk = $("btn-mark");
      mk.textContent = marked ? "Remove Mark" : "Mark for Review";
      mk.setAttribute("aria-pressed", marked ? "true" : "false");
      renderNavigator();
    });
    $("btn-submit").addEventListener("click", openSubmitModal);
    $("btn-keep").addEventListener("click", closeSubmitModal);
    $("btn-confirm-submit").addEventListener("click", function () {
      var btn = $("btn-confirm-submit");
      btn.disabled = true; // avoid double-settle on repeated clicks
      settle("manual");
    });
    $("modal").addEventListener("click", function (e) {
      if (e.target === $("modal")) closeSubmitModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !$("modal").hidden) closeSubmitModal();
    });
  }

  function openSubmitModal() {
    var cur = getCurrent();
    if (!cur) return;
    var a = answeredCount(cur), u = 25 - a, m = markedCount(cur);
    $("submit-summary").textContent = "Answered: " + a + " of 25. Unanswered: " + u +
      ". Marked for review: " + m + ". You cannot change your answers after submitting.";
    $("btn-confirm-submit").disabled = false;
    $("modal").hidden = false;
    $("btn-keep").focus();
    // The timer keeps running while this dialog is open.
  }
  function closeSubmitModal() {
    $("modal").hidden = true;
    var b = $("btn-submit");
    if (b) b.focus();
  }

  /* ---------- timer ---------- */
  function startTimer() {
    stopTimer();
    tick();
    timerId = setInterval(tick, 250);
  }
  function stopTimer() {
    if (timerId) { clearInterval(timerId); timerId = null; }
  }
  function tick() {
    var cur = getCurrent();
    if (!cur || cur.status !== "in-progress") { stopTimer(); return; }
    var left = cur.endsAt - Date.now();
    if (left <= 0) {
      $("timer-val").textContent = "00:00";
      settle("expired");
      return;
    }
    $("timer-val").textContent = fmtMMSS(left);
    $("exam-timer").classList.toggle("low", left <= 60000);
    if (ui.view === "test") {
      if (left <= 5 * 60 * 1000 && !ui.warned5) {
        ui.warned5 = true;
        flashNotice("5 minutes remaining.");
      }
      if (left <= 60 * 1000 && !ui.warned1) {
        ui.warned1 = true;
        flashNotice("1 minute remaining.");
      }
    }
    // Keep the resume label fresh if the student is on instructions.
    if (ui.view === "instructions") refreshInstructions();
  }
  var flashTimer = null;
  function flashNotice(msg) {
    var el = $("time-warn");
    el.textContent = msg;
    el.hidden = false;
    if (flashTimer) clearTimeout(flashTimer);
    flashTimer = setTimeout(function () { el.hidden = true; }, 8000);
  }

  function startHeartbeat() {
    stopHeartbeat();
    hbId = setInterval(function () {
      var cur = getCurrent();
      if (!cur || cur.status !== "in-progress") { stopHeartbeat(); return; }
      if (cur.lock && cur.lock.tabId === tabId) {
        cur.lock.hb = Date.now();
        try { save(CURR_KEY, cur); } catch (e) {}
      }
    }, 5000);
  }
  function stopHeartbeat() {
    if (hbId) { clearInterval(hbId); hbId = null; }
  }

  /* ---------- scoring / settle (single entry for manual + expiry) ---------- */
  function scoreOf(answers) {
    var correct = 0, incorrect = 0, unanswered = 0;
    var per = [];
    for (var n = 1; n <= 25; n++) {
      var q = qByNumber(n);
      var yours = answers ? answers[n] : null;
      var row;
      if (!yours) { unanswered++; row = { n: n, yours: null, correct: q.answer, result: "unanswered" }; }
      else if (yours === q.answer) { correct++; row = { n: n, yours: yours, correct: q.answer, result: "correct" }; }
      else { incorrect++; row = { n: n, yours: yours, correct: q.answer, result: "incorrect" }; }
      per.push(row);
    }
    return { score: correct, correct: correct, incorrect: incorrect, unanswered: unanswered, per: per };
  }

  function settle(mode) {
    if (ui.settling || ui.settled) return;
    ui.settling = true;
    stopTimer();
    var cur = getCurrent();
    if (!cur || cur.status !== "in-progress") { ui.settling = false; return; }
    var now = Date.now();
    var s = scoreOf(cur.answers);
    var result = {
      attemptId: cur.attemptId,
      examId: cur.examId,
      bankVersion: cur.bankVersion,
      startedAt: cur.startedAt,
      endsAt: cur.endsAt,
      submittedAt: now,
      submitMode: mode, // "manual" | "expired"
      durationSec: cur.durationSec,
      score: s.score,
      correct: s.correct,
      incorrect: s.incorrect,
      unanswered: s.unanswered,
      answers: cur.answers || {},
      marked: cur.marked || [],
      per: s.per
    };
    try { save(RES_KEY, result); } catch (e) {}
    try { localStorage.removeItem(CURR_KEY); } catch (e) {}
    ui.settled = true;
    ui.settling = false;
    stopHeartbeat();
    if (!$("modal").hidden) $("modal").hidden = true;
    renderResult(result, mode === "expired" ? "Time is up. Your saved answers have been submitted." : null);
  }

  /* ---------- result + review ---------- */
  function renderResult(res, banner) {
    stopTimer();
    stopHeartbeat();
    show("result");
    $("timer-val").textContent = "--:--";
    $("exam-timer").classList.remove("low");
    var b = $("result-banner");
    if (banner) { b.textContent = banner; b.hidden = false; }
    else b.hidden = true;

    $("score-line").textContent = "Your score: " + res.score + " / 25";
    $("stat-correct").textContent = res.correct;
    $("stat-incorrect").textContent = res.incorrect;
    $("stat-unanswered").textContent = res.unanswered;
    $("stat-time").textContent = fmtUsed(res.submittedAt - res.startedAt);
    $("stat-submitted").textContent = res.submitMode === "expired" ? "Time expired" : "Submitted";

    var tb = $("ans-tbody");
    tb.innerHTML = "";
    res.per.forEach(function (row) {
      var tr = document.createElement("tr");
      var tdN = document.createElement("td");
      tdN.className = "n";
      var a = document.createElement("a");
      a.href = "#review-q-" + row.n;
      a.textContent = row.n;
      a.addEventListener("click", function () {
        setFilter("all");
        setTimeout(function () {
          var t = $("review-q-" + row.n);
          if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 60);
      });
      tdN.appendChild(a);
      var tdY = document.createElement("td");
      tdY.textContent = row.yours || "Not answered";
      var tdC = document.createElement("td");
      tdC.textContent = row.correct;
      var tdR = document.createElement("td");
      var pill = document.createElement("span");
      if (row.result === "correct") { pill.className = "pill ok"; pill.textContent = "✓ Correct"; }
      else if (row.result === "incorrect") { pill.className = "pill bad"; pill.textContent = "✗ Incorrect"; }
      else { pill.className = "pill none"; pill.textContent = "— Unanswered"; }
      tdR.appendChild(pill);
      tr.appendChild(tdN); tr.appendChild(tdY); tr.appendChild(tdC); tr.appendChild(tdR);
      tb.appendChild(tr);
    });

    renderReview(res);
    typeset($("view-result"));
  }

  function setFilter(f) {
    ui.filter = f;
    document.querySelectorAll(".filter-row button").forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-filter") === f ? "true" : "false");
    });
    var res = getResult();
    if (res) renderReview(res);
  }

  function renderReview(res) {
    var counts = {
      all: 25,
      incorrect: res.incorrect,
      unanswered: res.unanswered,
      marked: (res.marked || []).length
    };
    document.querySelectorAll(".filter-row button").forEach(function (btn) {
      var f = btn.getAttribute("data-filter");
      var label = f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1);
      btn.textContent = label + " (" + counts[f] + ")";
      btn.setAttribute("aria-pressed", f === ui.filter ? "true" : "false");
    });

    var list = $("review-list");
    list.innerHTML = "";
    var shown = 0;
    res.per.forEach(function (row) {
      var n = row.n;
      var isMarked = (res.marked || []).indexOf(n) !== -1;
      if (ui.filter === "incorrect" && row.result !== "incorrect") return;
      if (ui.filter === "unanswered" && row.result !== "unanswered") return;
      if (ui.filter === "marked" && !isMarked) return;
      shown++;
      var q = qByNumber(n);
      var card = document.createElement("article");
      card.className = "review-q " + row.result;
      card.id = "review-q-" + n;

      var h = document.createElement("h3");
      h.className = "q-title";
      h.textContent = "Question " + n + " of 25";
      if (isMarked) {
        var mt = document.createElement("span");
        mt.className = "mark-tag";
        mt.textContent = "⚑ Marked";
        h.appendChild(mt);
      }
      card.appendChild(h);

      var stem = document.createElement("div");
      stem.className = "q-stem";
      stem.innerHTML = renderMathMd(q.stem);
      card.appendChild(stem);

      var opts = document.createElement("div");
      opts.style.marginTop = "12px";
      LETTERS.forEach(function (L, i) {
        var div = document.createElement("div");
        var cls = "opt-review";
        var flag = "";
        if (L === row.correct) { cls += " is-correct"; flag = "✓ Correct answer"; }
        else if (L === row.yours) { cls += " is-yours-wrong"; flag = "✗ Your answer"; }
        div.className = cls;
        var lw = document.createElement("span");
        lw.className = "opt-letter";
        lw.textContent = L + ".";
        var tx = document.createElement("span");
        tx.className = "opt-text";
        tx.innerHTML = renderMathMd(q.options[i]);
        div.appendChild(lw);
        div.appendChild(tx);
        if (flag) {
          var fg = document.createElement("span");
          fg.className = "opt-flag";
          fg.textContent = flag;
          div.appendChild(fg);
        }
        opts.appendChild(div);
      });
      card.appendChild(opts);

      var line = document.createElement("p");
      line.className = "your-line";
      line.innerHTML = "<strong>Your answer:</strong> " + esc(row.yours || "Not answered") +
        " &nbsp;·&nbsp; <strong>Correct answer: " + esc(row.correct) + ".</strong> " +
        '<span class="ans-value">' + renderMathMd(q.answerValue) + "</span>";
      card.appendChild(line);

      var toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "btn btn-ghost btn-sm";
      toggle.textContent = "Show Explanation";
      toggle.setAttribute("aria-expanded", "false");
      var sol = document.createElement("div");
      sol.className = "sol-body";
      sol.hidden = true;
      sol.innerHTML = renderMathMd(q.solution);
      toggle.addEventListener("click", function () {
        var open = sol.hidden;
        sol.hidden = !open;
        toggle.textContent = open ? "Hide Explanation" : "Show Explanation";
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        if (open) typeset(card);
      });
      card.appendChild(toggle);
      card.appendChild(sol);

      card.querySelectorAll(".fig img").forEach(function (img) {
        img.addEventListener("click", function () {
          var fig = img.closest(".fig");
          if (fig) fig.classList.toggle("enlarged");
        });
      });

      list.appendChild(card);
    });
    if (!shown) {
      var empty = document.createElement("p");
      empty.className = "notice";
      var msg = {
        incorrect: "No incorrect answers — every answered question is correct.",
        unanswered: "No unanswered questions — you answered all 25.",
        marked: "No marked questions in this attempt."
      }[ui.filter] || "Nothing to show.";
      empty.textContent = msg;
      list.appendChild(empty);
    }
    typeset(list);
  }

  function bindResult() {
    document.querySelectorAll(".filter-row button").forEach(function (btn) {
      btn.addEventListener("click", function () { setFilter(btn.getAttribute("data-filter")); });
    });
    $("btn-retake").addEventListener("click", function () {
      // A retake starts a brand-new record from the instructions page.
      try { localStorage.removeItem(CURR_KEY); } catch (e) {}
      ui.filter = "all";
      ui.currentQ = 1;
      ui.settled = false;
      ui.settling = false;
      show("instructions");
      $("ack").checked = false;
      try { if ($("ack-nostore")) $("ack-nostore").checked = false; } catch (e) {}
      refreshInstructions();
    });
  }

  /* ---------- boot ---------- */
  function route() {
    var h = location.hash || "";
    var cur = getCurrent();
    var res = getResult();
    var now = Date.now();

    if (cur && cur.status === "in-progress" && cur.endsAt <= now) {
      settle("expired"); // locked immediately; no answering allowed after expiry
      return;
    }
    if (h === "#/test") {
      if (cur && cur.status === "in-progress") enterTest();
      else if (res) renderResult(res, null);
      else { show("instructions"); refreshInstructions(); }
    } else if (h === "#/result") {
      if (res) renderResult(res, null);
      else { show("instructions"); refreshInstructions(); }
    } else {
      // Pre-submit views never expose answers or explanations.
      show("instructions");
      refreshInstructions();
    }
  }

  function pollMathReady() {
    var tries = 0;
    var id = setInterval(function () {
      tries++;
      if (mathReady() || tries > 60) {
        clearInterval(id);
        refreshInstructions();
        if (ui.view === "test") typeset($("q-card"));
        if (ui.view === "result") {
          var r = getResult();
          if (r) typeset($("view-result"));
        }
      }
    }, 250);
  }

  document.addEventListener("DOMContentLoaded", function () {
    canStore = storageOK();
    bindInstructions();
    bindTest();
    bindResult();

    fetch("test-data.json", { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("http " + r.status);
        return r.json();
      })
      .then(function (data) {
        if (!data || !data.questions || data.questions.length !== 25) {
          throw new Error("bad bank");
        }
        bank = data;
        refreshInstructions();
        route();
      })
      .catch(function () {
        bankFailed = true;
        refreshInstructions();
        route();
      });

    refreshInstructions();
    pollMathReady();
    window.addEventListener("hashchange", route);
    setInterval(function () {
      // Keep an expired exam locked even if the tick stopped.
      var cur = getCurrent();
      if (cur && cur.status === "in-progress" && Date.now() >= cur.endsAt) settle("expired");
    }, 1000);
  });

  // Exposed for local verification (scoring + renderer checks).
  window.__amc8 = {
    scoreOf: function (answers) {
      if (!bank) return null;
      return scoreOf(answers);
    },
    renderMathMd: renderMathMd,
    duration: effectiveDuration,
    officialDuration: OFFICIAL_DURATION
  };
})();
