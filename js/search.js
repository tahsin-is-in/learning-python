/* search.js — simple client-side substring search over lessons, glossary and projects.
   No index needed at this content size; swap in a real inverted index if the
   dataset grows into the thousands of items. */

const Search = (() => {
  let index = [];
  let modalEl, inputEl, resultsEl;

  function buildIndex(data) {
    index = [];
    (data.lessons || []).forEach(l => index.push({
      type: "Lesson", title: l.title, subtitle: l.levelId, href: `#/lesson/${l.id}`,
      haystack: `${l.title} ${l.levelId} ${(l.objectives || []).join(" ")}`.toLowerCase()
    }));
    (data.glossary || []).forEach(g => index.push({
      type: "Glossary", title: g.term, subtitle: g.definition, href: `#/glossary`,
      haystack: `${g.term} ${g.definition}`.toLowerCase()
    }));
    (data.projects || []).forEach(p => index.push({
      type: "Project", title: p.title, subtitle: p.tier, href: `#/project/${p.id}`,
      haystack: `${p.title} ${p.goal}`.toLowerCase()
    }));
    (data.cheatsheets || []).forEach(c => index.push({
      type: "Cheat sheet", title: c.title, subtitle: "Printable reference", href: `#/cheatsheets`,
      haystack: `${c.title}`.toLowerCase()
    }));
  }

  function mount() {
    modalEl = document.getElementById("search-modal");
    inputEl = document.getElementById("search-input");
    resultsEl = document.getElementById("search-results");

    document.getElementById("search-open-btn").addEventListener("click", open);
    modalEl.addEventListener("click", (e) => { if (e.target === modalEl) close(); });
    window.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); open(); }
      if (e.key === "Escape") close();
    });
    inputEl.addEventListener("input", () => renderResults(inputEl.value));
  }

  function open() {
    modalEl.classList.add("open");
    inputEl.value = "";
    renderResults("");
    setTimeout(() => inputEl.focus(), 30);
  }
  function close() { modalEl.classList.remove("open"); }

  function renderResults(query) {
    const q = query.trim().toLowerCase();
    const matches = (q ? index.filter(item => item.haystack.includes(q)) : index).slice(0, 30);
    resultsEl.innerHTML = matches.map(m => `
      <a class="search-result" href="${m.href}">
        <span class="type">${m.type}</span><br>
        <strong>${escapeHtml(m.title)}</strong><br>
        <span style="color:var(--muted);font-size:.82rem">${escapeHtml((m.subtitle || "").slice(0, 90))}</span>
      </a>
    `).join("") || `<p style="padding:1rem;color:var(--muted)">No results.</p>`;
    [...resultsEl.querySelectorAll("a")].forEach(a => a.addEventListener("click", close));
  }

  return { buildIndex, mount, open, close };
})();
