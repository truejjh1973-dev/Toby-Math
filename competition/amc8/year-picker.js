/* Shared year picker: plain year navigation, no exam-state logic.
 * Submitted/retake states stay on the status cards and result pages.
 * Usage: <div data-year-picker data-base="competition/amc8"></div>
 *   data-base: path prefix holding the per-year folders ("" or "." on list page).
 * Without JS the container keeps its fallback link to the full test list.
 */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var host = document.querySelector("[data-year-picker]");
    if (!host || !window.AMC8_YEARS) return;
    var base = host.getAttribute("data-base") || ".";

    var row = document.createElement("div");
    row.className = "year-picker";

    var label = document.createElement("label");
    var selectId = "year-pick-" + Math.random().toString(36).slice(2, 8);
    label.setAttribute("for", selectId);
    label.textContent = "Choose a paper:";
    row.appendChild(label);

    var select = document.createElement("select");
    select.id = selectId;
    window.AMC8_YEARS.forEach(function (y) {
      var opt = document.createElement("option");
      opt.value = y;
      opt.textContent = y + " AMC 8";
      select.appendChild(opt);
    });
    row.appendChild(select);

    var go = document.createElement("button");
    go.type = "button";
    go.className = "btn btn-primary year-go";
    go.textContent = "Take the Test";
    go.addEventListener("click", function () {
      var y = select.value;
      var prefix = base.replace(/\/$/, "");
      if (!prefix || prefix === ".") prefix = ".";
      location.href = prefix + "/" + y + "/index.html";
    });
    row.appendChild(go);

    host.innerHTML = "";
    host.appendChild(row);
  });
})();
