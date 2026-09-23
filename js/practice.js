/* practice.js — filterable practice question browser. */

const Practice = (() => {
  function render(container, allQuestions, opts = {}) {
    const topics = [...new Set(allQuestions.map(q => q.topic))];
    const difficulties = [...new Set(allQuestions.map(q => q.difficulty))];

    let activeTopic = opts.presetTopic || "all";
    let activeDifficulty = "all";

    const shell = document.createElement("div");
    shell.innerHTML = `
      <div class="filter-row" data-role="topic-filters"></div>
      <div class="filter-row" data-role="diff-filters"></div>
      <div data-role="q-list"></div>
    `;
    container.innerHTML = "";
    container.appendChild(shell);

    const topicRow = shell.querySelector('[data-role="topic-filters"]');
    const diffRow = shell.querySelector('[data-role="diff-filters"]');
    const qList = shell.querySelector('[data-role="q-list"]');

    function chip(row, label, value, isActive, onClick) {
      const c = document.createElement("button");
      c.className = "chip" + (isActive ? " active" : "");
      c.textContent = label;
      c.addEventListener("click", onClick);
      row.appendChild(c);
    }

    function renderFilters() {
      topicRow.innerHTML = "";
      chip(topicRow, "All topics", "all", activeTopic === "all", () => { activeTopic = "all"; renderFilters(); renderList(); });
      topics.forEach(t => chip(topicRow, t.replace(/-/g, " "), t, activeTopic === t, () => { activeTopic = t; renderFilters(); renderList(); }));

      diffRow.innerHTML = "";
      chip(diffRow, "All levels", "all", activeDifficulty === "all", () => { activeDifficulty = "all"; renderFilters(); renderList(); });
      difficulties.forEach(d => chip(diffRow, d, d, activeDifficulty === d, () => { activeDifficulty = d; renderFilters(); renderList(); }));
    }

    function renderList() {
      const filtered = allQuestions.filter(q =>
        (activeTopic === "all" || q.topic === activeTopic) &&
        (activeDifficulty === "all" || q.difficulty === activeDifficulty)
      );
      qList.innerHTML = filtered.length ? "" : `<p style="color:var(--muted)">No questions match these filters yet.</p>`;
      QuizEngine.renderSet(qList, filtered, {
        onProgress: () => {
          filtered.forEach(q => Storage.markPracticeSolved(q.id));
        }
      });
    }

    renderFilters();
    renderList();
  }

  return { render };
})();
