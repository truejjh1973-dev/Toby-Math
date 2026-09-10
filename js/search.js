(function () {
  "use strict";

  var INDEX_URL = "data/index.json";

  function normalize(s) {
    return (s || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function tokenize(s) {
    return normalize(s).split(" ").filter(Boolean);
  }

  function score(doc, terms) {
    var hay = normalize(doc.title + " " + doc.keywords + " " + doc.description + " " + doc.body);
    var score = 0;
    var title = normalize(doc.title);
    terms.forEach(function (t) {
      var i = title.indexOf(t);
      if (i !== -1) score += 10;
      if (hay.indexOf(t) !== -1) score += 1;
    });
    return score;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var input = document.getElementById("search-input");
    var status = document.getElementById("search-status");
    var results = document.getElementById("search-results");
    if (!input || !status || !results) return;

    var docs = [];
    fetch(INDEX_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        docs = data.pages || [];
        status.textContent = docs.length + " pages indexed. Start typing above.";
      })
      .catch(function () {
        status.textContent = "Could not load the search index. Try opening this site via a local server (e.g. python -m http.server).";
      });

    function run(query) {
      results.innerHTML = "";
      var q = normalize(query);
      if (!q) {
        status.textContent = docs.length ? docs.length + " pages indexed. Start typing above." : "";
        return;
      }
      var terms = tokenize(query);
      var hits = docs
        .map(function (d) { return { doc: d, score: score(d, terms) }; })
        .filter(function (h) { return h.score > 0; })
        .sort(function (a, b) { return b.score - a.score; })
        .slice(0, 12);

      if (!hits.length) {
        status.textContent = "No results for \u201c" + q + "\u201d. Try a broader keyword.";
        return;
      }
      status.textContent = hits.length + " result" + (hits.length > 1 ? "s" : "") + " for \u201c" + q + "\u201d.";
      hits.forEach(function (h) {
        var a = document.createElement("a");
        a.className = "search-result";
        a.href = h.doc.url;
        var path = document.createElement("div");
        path.className = "path";
        path.textContent = h.doc.section;
        var title = document.createElement("h3");
        title.textContent = h.doc.title;
        var desc = document.createElement("p");
        desc.textContent = h.doc.description;
        a.appendChild(path);
        a.appendChild(title);
        a.appendChild(desc);
        results.appendChild(a);
      });
    }

    input.addEventListener("input", function () { run(this.value); });

    var params = new URLSearchParams(location.search);
    var q = params.get("q");
    if (q) { input.value = q; run(q); }
  });
})();