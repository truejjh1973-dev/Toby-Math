(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var quizzes = document.querySelectorAll(".quiz");
    quizzes.forEach(function (quiz) {
      var key = quiz.getAttribute("data-quiz");
      var title = quiz.getAttribute("data-title") || "Quiz";
      var questions = quiz.querySelectorAll(".q");
      if (!questions.length) return;

      var statusEl = document.createElement("p");
      statusEl.className = "quiz-status";
      quiz.appendChild(statusEl);

      var resetBtn = document.createElement("button");
      resetBtn.type = "button";
      resetBtn.className = "quiz-reset";
      resetBtn.textContent = "Reset score";
      resetBtn.style.display = "none";
      quiz.appendChild(resetBtn);

      var best = 0;
      try {
        best = parseInt(localStorage.getItem("toby.quiz." + key) || "0", 10) || 0;
      } catch (e) {}

      function render() {
        if (!questionStates) return;
        var done = questionStates.filter(Boolean).length;
        var correct = questionStates.filter(function (s) { return s === "correct"; }).length;
        if (done === questions.length) {
          if (correct > best) {
            best = correct;
            try { localStorage.setItem("toby.quiz." + key, String(best)); } catch (e) {}
          }
          statusEl.textContent =
            title + " complete: " + correct + " / " + questions.length + ". Best: " + best + " / " + questions.length + ".";
          resetBtn.style.display = "inline-block";
        } else {
          statusEl.textContent =
            title + " in progress \u2014 " + correct + " correct so far (best " + best + ").";
          resetBtn.style.display = "none";
        }
      }

      var questionStates = new Array(questions.length).fill(null);

      questions.forEach(function (q, qi) {
        var answer = q.getAttribute("data-answer");
        var buttons = q.querySelectorAll(".options button");
        var feedback = q.querySelector(".feedback");

        buttons.forEach(function (btn) {
          btn.addEventListener("click", function () {
            if (questionStates[qi]) return;
            var choice = btn.getAttribute("data-choice");
            buttons.forEach(function (b) { b.disabled = true; });
            q.classList.add("done");
            if (choice === answer) {
              btn.classList.add("selected-correct");
              questionStates[qi] = "correct";
            } else {
              btn.classList.add("selected-wrong");
              questionStates[qi] = "wrong";
              buttons.forEach(function (b) {
                if (b.getAttribute("data-choice") === answer) b.classList.add("selected-correct");
              });
            }
            if (feedback) feedback.classList.add("show");
            render();
          });
        });
      });

      resetBtn.addEventListener("click", function () {
        try { localStorage.removeItem("toby.quiz." + key); } catch (e) {}
        best = 0;
        questionStates = new Array(questions.length).fill(null);
        questions.forEach(function (q) {
          q.classList.remove("done");
          q.querySelectorAll(".options button").forEach(function (b) {
            b.disabled = false;
            b.classList.remove("selected-correct", "selected-wrong");
          });
          var fb = q.querySelector(".feedback");
          if (fb) fb.classList.remove("show");
        });
        render();
      });

      render();
    });
  });
})();