/* app.js — boots PythonOS: loads content data, builds the sidebar/topbar,
   registers routes, and renders every page. Kept as one file for a v1 static
   site; split further (per-view files) once the lesson count grows a lot. */

const App = (() => {
  let DATA = { curriculum: [], lessons: [], questions: [], projects: [], glossary: [], cheatsheets: [] };

  const CODE_READING_SET = [
    { prompt: "def mystery(nums):\n    total = 0\n    for n in nums:\n        if n % 2 == 0:\n            total += n\n    return total\n\nprint(mystery([1,2,3,4,5,6]))",
      questions: ["What does this print?", "What is the time complexity?", "What would happen with an empty list?"],
      answer: "It sums only the even numbers: 2 + 4 + 6 = 12. Time complexity is O(n) — one pass through the list. With an empty list it returns 0 safely." },
    { prompt: "def find(items, target):\n    for i in range(len(items)):\n        if items[i] == target:\n            return i\n    return -1",
      questions: ["What does this function do?", "What is the time complexity?", "How could it be improved for a sorted list?"],
      answer: "It's a linear search returning the index of target, or -1 if absent. O(n) worst case. On a sorted list, binary search would do this in O(log n)." }
  ];

  const DEBUG_SET = [
    { title: "Off-by-one", broken: "for i in range(1, 5):\n    print(i)\n# meant to print 1 2 3 4 5", fix: "for i in range(1, 6):\n    print(i)", explain: "range()'s stop value is exclusive, so range(1,5) stops at 4." },
    { title: "Infinite loop", broken: "n = 5\nwhile n > 0:\n    print(n)", fix: "n = 5\nwhile n > 0:\n    print(n)\n    n -= 1", explain: "Nothing changes n, so the condition never becomes False." },
    { title: "Assignment vs comparison", broken: "if x = 10:\n    print(\"ten\")", fix: "if x == 10:\n    print(\"ten\")", explain: "= assigns; == compares. A single = inside a condition is a SyntaxError." },
    { title: "Type mismatch", broken: "age = input(\"Age: \")\nprint(age + 1)", fix: "age = int(input(\"Age: \"))\nprint(age + 1)", explain: "input() always returns a string; it must be converted to int before arithmetic." }
  ];

  async function loadData() {
    const [curriculum, lessons, questions, projects, glossary, cheatsheets] = await Promise.all([
      fetch("data/curriculum.json").then(r => r.json()),
      fetch("data/lessons.json").then(r => r.json()),
      fetch("data/questions.json").then(r => r.json()),
      fetch("data/projects.json").then(r => r.json()),
      fetch("data/glossary.json").then(r => r.json()),
      fetch("data/cheatsheets.json").then(r => r.json()),
    ]);
    DATA = { curriculum, lessons, questions, projects, glossary, cheatsheets };
  }

  function lessonById(id) { return DATA.lessons.find(l => l.id === id); }
  function levelById(id) { return DATA.curriculum.find(l => l.id === id); }
  function lessonsForLevel(levelId) { return DATA.lessons.filter(l => l.levelId === levelId); }

  function isUnlocked(lesson) {
    const s = Storage.get();
    return (lesson.prerequisites || []).every(p => s.completedLessons[p]);
  }

  /* ---------------- Sidebar & shell ---------------- */

  function buildSidebar() {
    const nav = document.getElementById("side-nav");
    const levelLinks = DATA.curriculum.map(level =>
      `<a class="nav-link" href="#/level/${level.id}" data-nav="level-${level.id}">
        <span class="icon">${level.icon}</span> ${level.title}
      </a>`
    ).join("");

    nav.innerHTML = `
      <a class="nav-link" href="#/dashboard" data-nav="dashboard"><span class="icon">🏠</span> Dashboard</a>
      <a class="nav-link" href="#/roadmap" data-nav="roadmap"><span class="icon">🗺️</span> Learning Roadmap</a>
      <div class="nav-group-label">Learn</div>
      <div class="nav-sub">${levelLinks}</div>
      <div class="nav-group-label">Practice</div>
      <a class="nav-link" href="#/playground" data-nav="playground"><span class="icon">💻</span> Playground</a>
      <a class="nav-link" href="#/practice" data-nav="practice"><span class="icon">🧠</span> Practice</a>
      <a class="nav-link" href="#/debugging-lab" data-nav="debugging-lab"><span class="icon">🐛</span> Debugging Lab</a>
      <a class="nav-link" href="#/code-reading" data-nav="code-reading"><span class="icon">🔍</span> Code Reading Lab</a>
      <a class="nav-link" href="#/exam" data-nav="exam"><span class="icon">📝</span> Exam Mode</a>
      <a class="nav-link" href="#/daily" data-nav="daily"><span class="icon">🔥</span> Daily Python</a>
      <div class="nav-group-label">Build & Reference</div>
      <a class="nav-link" href="#/projects" data-nav="projects"><span class="icon">🚀</span> Projects</a>
      <a class="nav-link" href="#/cheatsheets" data-nav="cheatsheets"><span class="icon">📋</span> Cheat Sheets</a>
      <a class="nav-link" href="#/glossary" data-nav="glossary"><span class="icon">📖</span> Glossary</a>
      <a class="nav-link" href="#/progress" data-nav="progress"><span class="icon">📊</span> Progress</a>
    `;
  }

  function setActiveNav(key) {
    document.querySelectorAll(".nav-link").forEach(a => a.classList.remove("active"));
    const el = document.querySelector(`[data-nav="${key}"]`);
    if (el) el.classList.add("active");
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("sidebar-backdrop").classList.remove("open");
  }

  function setContent(html) {
    document.getElementById("content").innerHTML = html;
    window.scrollTo(0, 0);
  }

  function crumbs(parts) {
    return `<div class="breadcrumbs">${parts.map((p, i) =>
      i === parts.length - 1 ? `<span>${p.label}</span>` : `<a href="${p.href}">${p.label}</a> / `
    ).join("")}</div>`;
  }

  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2200);
  }

  /* ---------------- Theme ---------------- */

  function applyTheme(theme) {
    if (theme === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", theme);
  }

  function initTheme() {
    const s = Storage.get();
    applyTheme(s.theme);
    document.getElementById("theme-toggle").addEventListener("click", () => {
      const order = ["light", "dark", "system"];
      const next = order[(order.indexOf(Storage.get().theme) + 1) % order.length];
      Storage.update(st => { st.theme = next; });
      applyTheme(next);
      toast(`Theme: ${next}`);
    });
  }

  /* ---------------- Badges ---------------- */

  const BADGE_DEFS = {
    "first-lesson": { label: "🏅 First Lesson Complete", check: s => Object.keys(s.completedLessons).length >= 1 },
    "five-lessons": { label: "🏅 5 Lessons Complete", check: s => Object.keys(s.completedLessons).length >= 5 },
    "ten-practice": { label: "🏅 10 Practice Questions", check: s => Object.keys(s.practiceSolved).length >= 10 },
    "first-project": { label: "🏅 First Project", check: s => Object.keys(s.projectsCompleted).length >= 1 },
    "streak-3": { label: "🏅 3-Day Streak", check: s => s.streak.current >= 3 },
  };

  function checkBadges() {
    const s = Storage.get();
    Object.entries(BADGE_DEFS).forEach(([id, def]) => {
      if (def.check(s) && Storage.awardBadge(id)) toast(`Badge earned: ${def.label}`);
    });
  }

  /* ---------------- Views ---------------- */

  function renderDashboard() {
    setActiveNav("dashboard");
    const s = Storage.get();
    const totalLessons = DATA.lessons.length;
    const done = Object.keys(s.completedLessons).length;
    const pct = totalLessons ? Math.round((done / totalLessons) * 100) : 0;

    const nextLesson = DATA.lessons.find(l => !s.completedLessons[l.id] && isUnlocked(l));
    const recent = Object.entries(s.completedLessons)
      .sort((a, b) => b[1].completedAt - a[1].completedAt)
      .slice(0, 4)
      .map(([id]) => lessonById(id))
      .filter(Boolean);

    setContent(`
      <div class="hero">
        <h1>PythonOS</h1>
        <p>Your complete journey from Python beginner to professional developer.</p>
      </div>

      <div class="grid-3">
        <div class="card stat"><span class="num">${done}/${totalLessons}</span><span class="label">Lessons complete</span></div>
        <div class="card stat"><span class="num">${Object.keys(s.practiceSolved).length}</span><span class="label">Practice questions solved</span></div>
        <div class="card stat"><span class="num">🔥 ${s.streak.current}</span><span class="label">Day streak (best ${s.streak.best})</span></div>
      </div>

      <div class="card">
        <h3 style="margin-top:0">Overall progress</h3>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
        <p style="color:var(--muted);font-size:.85rem;margin:.4rem 0 0">${pct}% of the current lesson library</p>
      </div>

      ${nextLesson ? `
      <div class="card">
        <h3 style="margin-top:0">Continue learning</h3>
        <p>${escapeHtml(nextLesson.title)} — ${levelById(nextLesson.levelId)?.title || ""}</p>
        <a class="btn" href="#/lesson/${nextLesson.id}">Resume →</a>
      </div>` : `
      <div class="card">
        <h3 style="margin-top:0">You're caught up 🎉</h3>
        <p style="color:var(--muted)">You've completed every unlocked lesson currently in the library. Check the roadmap for what's coming next.</p>
        <a class="btn secondary" href="#/roadmap">View roadmap →</a>
      </div>`}

      <div class="grid-2">
        <div class="card">
          <h3 style="margin-top:0">Recently studied</h3>
          ${recent.length ? recent.map(l => `<div style="padding:.3rem 0"><a href="#/lesson/${l.id}">${escapeHtml(l.title)}</a></div>`).join("") : `<p style="color:var(--muted)">Nothing yet — start your first lesson!</p>`}
        </div>
        <div class="card">
          <h3 style="margin-top:0">Daily Python</h3>
          <p style="color:var(--muted)">A tiny daily habit: one concept, one problem.</p>
          <a class="btn secondary" href="#/daily">Today's session →</a>
        </div>
      </div>
    `);
  }

  function renderRoadmap() {
    setActiveNav("roadmap");
    const s = Storage.get();
    const rows = DATA.curriculum.map(level => {
      const lessons = lessonsForLevel(level.id);
      const done = lessons.filter(l => s.completedLessons[l.id]).length;
      const pct = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
      return `
        <a class="roadmap-stage" href="#/level/${level.id}" style="text-decoration:none;color:inherit">
          <span class="stage-idx">${String(level.order).padStart(2, "0")}</span>
          <div style="flex:1">
            <strong>${level.icon} ${escapeHtml(level.title)}</strong>
            <div style="font-size:.82rem;color:var(--muted)">${escapeHtml(level.summary)}</div>
          </div>
          <div style="width:140px">
            <div class="stage-bar"><div style="width:${pct}%"></div></div>
            <div style="font-size:.72rem;color:var(--muted);text-align:right">${lessons.length ? `${done}/${lessons.length}` : "coming soon"}</div>
          </div>
        </a>`;
    }).join("");

    setContent(`
      <h1>🗺️ Learning Roadmap</h1>
      <p style="color:var(--muted)">The full PythonOS curriculum, in order. Lessons are being added continuously — levels with content are clickable now; the rest are mapped out and coming soon.</p>
      <div class="roadmap-list">${rows}</div>
    `);
  }

  function renderLevel(params) {
    setActiveNav(`level-${params.id}`);
    const level = levelById(params.id);
    if (!level) return setContent(`<p>Level not found.</p>`);
    const lessons = lessonsForLevel(level.id);
    const s = Storage.get();

    setContent(`
      ${crumbs([{ href: "#/roadmap", label: "Roadmap" }, { label: level.title }])}
      <h1>${level.icon} ${escapeHtml(level.title)}</h1>
      <p style="color:var(--muted)">${escapeHtml(level.summary)}</p>

      ${lessons.length ? `
      <div class="card">
        <h3 style="margin-top:0">Lessons</h3>
        ${lessons.map(l => {
          const done = !!s.completedLessons[l.id];
          const unlocked = isUnlocked(l);
          return `<div style="display:flex;justify-content:space-between;align-items:center;padding:.5rem 0;border-bottom:1px solid var(--border)">
            <div>
              ${unlocked ? `<a href="#/lesson/${l.id}">${escapeHtml(l.title)}</a>` : `<span style="color:var(--muted)">🔒 ${escapeHtml(l.title)}</span>`}
              <span class="badge ${l.difficulty}" style="margin-left:.5rem">${l.difficulty}</span>
            </div>
            <span style="font-size:.8rem;color:var(--muted)">${done ? "✅ done" : unlocked ? l.estimatedTime : "locked"}</span>
          </div>`;
        }).join("")}
      </div>` : `
      <div class="card">
        <p style="color:var(--muted)">Full lessons for this level are on the roadmap and not written yet — this is exactly the kind of level you can add next using <code>data/lessons.json</code>.</p>
      </div>`}

      <p style="margin-top:1.5rem"><strong>Topics this level covers:</strong></p>
      <ul style="color:var(--muted)">${level.topics.map(t => `<li>${escapeHtml(t)}</li>`).join("")}</ul>
    `);
  }

  function renderLesson(params) {
    const lesson = lessonById(params.id);
    if (!lesson) return setContent(`<p>Lesson not found.</p>`);
    setActiveNav(`level-${lesson.levelId}`);
    const level = levelById(lesson.levelId);
    const unmetPrereqs = (lesson.prerequisites || []).filter(p => !Storage.get().completedLessons[p]).map(lessonById).filter(Boolean);
    let mode = "quick";

    function body() {
      const q = lesson.quick, d = lesson.deep;
      if (mode === "quick") {
        return `
          <h3>⚡ Key definitions</h3>
          <ul>${(q.definitions || []).map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
          ${q.syntax ? `<h3>Syntax</h3><div class="code-window"><div class="bar"><span></span><span></span><span></span></div><pre>${escapeHtml(q.syntax)}</pre></div>` : ""}
          ${(q.rules || []).length ? `<div class="box remember"><div class="box-title">⭐ Remember</div><ul style="margin:0">${q.rules.map(r => `<li>${escapeHtml(r)}</li>`).join("")}</ul></div>` : ""}
          ${q.cheat ? `<h3>Cheat sheet</h3><div class="code-window"><div class="bar"><span></span><span></span><span></span></div><pre>${escapeHtml(q.cheat)}</pre></div>` : ""}
        `;
      }
      return `
        <h3>Intuition</h3><p>${escapeHtml(d.intuition)}</p>
        ${(d.sections || []).map(sec => `<h3>${escapeHtml(sec.heading)}</h3><p>${escapeHtml(sec.body)}</p>`).join("")}
        <h3>Examples</h3>
        ${(d.examples || []).map(ex => `
          <p><strong>${escapeHtml(ex.title)}</strong></p>
          <div class="code-window"><div class="bar"><span></span><span></span><span></span></div><pre>${escapeHtml(ex.code)}</pre></div>
          <p style="color:var(--muted)">${escapeHtml(ex.explain)}</p>
        `).join("")}
        <div class="box mistake"><div class="box-title">⚠️ Common Mistakes</div>
          ${(lesson.commonMistakes || []).map(m => `
            <p style="margin:.4rem 0"><code>${escapeHtml(m.bad)}</code> → <code>${escapeHtml(m.good)}</code><br><span style="color:var(--muted);font-size:.9em">${escapeHtml(m.why)}</span></p>
          `).join("")}
        </div>
        <h3>Practice</h3><ul>${(lesson.practice || []).map(p => `<li>${escapeHtml(p)}</li>`).join("")}</ul>
        <div class="box tip"><div class="box-title">🟠 Challenge</div>${escapeHtml(lesson.challenge || "")}</div>
        ${lesson.miniProject ? `<div class="box tip"><div class="box-title">🚀 Mini Project: ${escapeHtml(lesson.miniProject.title)}</div>${escapeHtml(lesson.miniProject.goal)}</div>` : ""}
        ${d.realWorld ? `<h3>Where this is actually used</h3><p style="color:var(--muted)">${escapeHtml(d.realWorld)}</p>` : ""}
      `;
    }

    function render() {
      setContent(`
        ${crumbs([{ href: "#/roadmap", label: "Roadmap" }, { href: `#/level/${level.id}`, label: level.title }, { label: lesson.title }])}
        <div class="lesson-header">
          <div>
            <h1 style="margin-bottom:.2rem">${escapeHtml(lesson.title)}</h1>
            <span class="badge ${lesson.difficulty}">${lesson.difficulty}</span>
            <span style="color:var(--muted);font-size:.85rem;margin-left:.5rem">⏱ ${lesson.estimatedTime}</span>
          </div>
          <div class="mode-toggle">
            <button data-mode="quick" class="${mode === "quick" ? "active" : ""}">⚡ Quick</button>
            <button data-mode="deep" class="${mode === "deep" ? "active" : ""}">📚 Deep</button>
          </div>
        </div>

        ${unmetPrereqs.length ? `
        <div class="box mistake"><div class="box-title">🔗 Learn this first</div>
          ${unmetPrereqs.map(p => `<a href="#/lesson/${p.id}">${escapeHtml(p.title)}</a>`).join(", ")}
        </div>` : ""}

        <div class="card">
          <h3 style="margin-top:0">Learning objective</h3>
          <ul>${(lesson.objectives || []).map(o => `<li>${escapeHtml(o)}</li>`).join("")}</ul>
        </div>

        <div id="lesson-body">${body()}</div>

        <div class="card">
          <h3 style="margin-top:0">Quick quiz</h3>
          <div id="lesson-quiz"></div>
        </div>

        <div class="card">
          <h3 style="margin-top:0">Mastery check</h3>
          <p style="color:var(--muted)">Can you explain this concept out loud, from memory, without looking at the notes? If yes:</p>
          <div style="display:flex;gap:.5rem;flex-wrap:wrap">
            <button class="btn secondary" data-conf="again">Again</button>
            <button class="btn secondary" data-conf="hard">Hard</button>
            <button class="btn secondary" data-conf="good">Good</button>
            <button class="btn" data-conf="easy">Easy — mark complete</button>
          </div>
        </div>

        <div class="lesson-nav-footer">
          ${lesson.prev ? `<a class="btn secondary" href="#/lesson/${lesson.prev}">← Previous</a>` : `<span></span>`}
          ${lesson.next ? `<a class="btn" href="#/lesson/${lesson.next}">Next →</a>` : `<span></span>`}
        </div>
      `);

      document.querySelectorAll(".mode-toggle button").forEach(b => {
        b.addEventListener("click", () => { mode = b.dataset.mode; render(); });
      });

      const quizContainer = document.getElementById("lesson-quiz");
      QuizEngine.renderSet(quizContainer, lesson.quiz || [], {
        onProgress: (correct, total) => Storage.recordQuizScore(lesson.id, correct, total)
      });

      document.querySelectorAll("[data-conf]").forEach(b => {
        b.addEventListener("click", () => {
          Storage.markLessonComplete(lesson.id, b.dataset.conf);
          checkBadges();
          toast("Progress saved ✅");
          setActiveNav(`level-${lesson.levelId}`);
        });
      });
    }
    render();
  }

  function renderPractice() {
    setActiveNav("practice");
    setContent(`<h1>🧠 Practice</h1><p style="color:var(--muted)">Multiple choice, predict-the-output, find-the-error and debugging questions. Filter by topic or difficulty.</p><div id="practice-root"></div>`);
    Practice.render(document.getElementById("practice-root"), DATA.questions);
  }

  function renderDebuggingLab() {
    setActiveNav("debugging-lab");
    setContent(`
      <h1>🐛 Debugging Lab</h1>
      <p style="color:var(--muted)">Real, broken programs. Read the code, spot the bug, then reveal the fix.</p>
      ${DEBUG_SET.map((d, i) => `
        <div class="card">
          <h3 style="margin-top:0">${i + 1}. ${escapeHtml(d.title)}</h3>
          <div class="code-window"><div class="bar"><span></span><span></span><span></span></div><pre>${escapeHtml(d.broken)}</pre></div>
          <details class="qa"><summary>Show the fix</summary>
            <div class="code-window" style="margin-top:.6rem"><div class="bar"><span></span><span></span><span></span></div><pre>${escapeHtml(d.fix)}</pre></div>
            <p style="color:var(--muted)">${escapeHtml(d.explain)}</p>
          </details>
        </div>
      `).join("")}
    `);
  }

  function renderCodeReading() {
    setActiveNav("code-reading");
    setContent(`
      <h1>🔍 Code Reading Lab</h1>
      <p style="color:var(--muted)">Programming maturity comes from reading code as much as writing it. Study each snippet and answer before revealing.</p>
      ${CODE_READING_SET.map((c, i) => `
        <div class="card">
          <h3 style="margin-top:0">Snippet ${i + 1}</h3>
          <div class="code-window"><div class="bar"><span></span><span></span><span></span></div><pre>${escapeHtml(c.prompt)}</pre></div>
          <ul>${c.questions.map(q => `<li>${escapeHtml(q)}</li>`).join("")}</ul>
          <details class="qa"><summary>Reveal analysis</summary><p style="margin-top:.5rem">${escapeHtml(c.answer)}</p></details>
        </div>
      `).join("")}
    `);
  }

  function renderProjects() {
    setActiveNav("projects");
    const s = Storage.get();
    const groups = { beginner: [], intermediate: [], advanced: [] };
    DATA.projects.forEach(p => (groups[p.tier] || groups.beginner).push(p));
    setContent(`
      <h1>🚀 Projects</h1>
      <p style="color:var(--muted)">Build real things. Each project gives you the goal and requirements — try to solve it yourself before opening hints.</p>
      ${Object.entries(groups).filter(([, arr]) => arr.length).map(([tier, arr]) => `
        <h2 style="text-transform:capitalize">${tier}</h2>
        <div class="grid-2">
          ${arr.map(p => `
            <div class="card">
              <h3 style="margin-top:0">${escapeHtml(p.title)} ${s.projectsCompleted[p.id] ? "✅" : ""}</h3>
              <p style="color:var(--muted)">${escapeHtml(p.goal)}</p>
              <a class="btn secondary" href="#/project/${p.id}">Open project →</a>
            </div>
          `).join("")}
        </div>
      `).join("")}
    `);
  }

  function renderProjectDetail(params) {
    setActiveNav("projects");
    const p = DATA.projects.find(x => x.id === params.id);
    if (!p) return setContent(`<p>Project not found.</p>`);
    setContent(`
      ${crumbs([{ href: "#/projects", label: "Projects" }, { label: p.title }])}
      <h1>🚀 ${escapeHtml(p.title)}</h1>
      <div class="card"><h3 style="margin-top:0">Goal</h3><p>${escapeHtml(p.goal)}</p></div>
      <div class="card"><h3 style="margin-top:0">Requirements</h3><ul>${p.requirements.map(r => `<li>${escapeHtml(r)}</li>`).join("")}</ul></div>
      <div class="card"><h3 style="margin-top:0">Concepts required</h3><p>${p.concepts.join(", ")}</p></div>
      <div class="card"><h3 style="margin-top:0">Suggested architecture</h3><p>${escapeHtml(p.architecture)}</p></div>
      <div class="card"><h3 style="margin-top:0">Milestones</h3><ol>${p.milestones.map(m => `<li>${escapeHtml(m)}</li>`).join("")}</ol></div>
      <div class="card">
        <h3 style="margin-top:0">Hints</h3>
        <details class="qa"><summary>Hint 1</summary><p>${escapeHtml(p.hints[0] || "")}</p></details>
        ${p.hints[1] ? `<details class="qa"><summary>Hint 2</summary><p>${escapeHtml(p.hints[1])}</p></details>` : ""}
      </div>
      <div class="card"><h3 style="margin-top:0">Common problems</h3><ul>${p.commonProblems.map(c => `<li>${escapeHtml(c)}</li>`).join("")}</ul></div>
      <div class="card"><h3 style="margin-top:0">Testing checklist</h3><ul>${p.testingChecklist.map(c => `<li>☐ ${escapeHtml(c)}</li>`).join("")}</ul></div>
      <div class="card"><h3 style="margin-top:0">Extension ideas</h3><ul>${p.extensions.map(c => `<li>${escapeHtml(c)}</li>`).join("")}</ul></div>
      <button class="btn" id="mark-done">Mark project complete</button>
    `);
    document.getElementById("mark-done").addEventListener("click", () => {
      Storage.markProjectComplete(p.id);
      checkBadges();
      toast("Project marked complete 🎉");
    });
  }

  function renderCheatsheets() {
    setActiveNav("cheatsheets");
    setContent(`
      <h1>📋 Python Cheat Sheets</h1>
      <p style="color:var(--muted)">Printable quick references. Use your browser's Print (Ctrl/Cmd + P) on any sheet.</p>
      <div class="cheat-grid">
        ${DATA.cheatsheets.map(c => `
          <div class="card">
            <h3 style="margin-top:0">${escapeHtml(c.title)}</h3>
            ${c.items.map(i => `<p style="margin:.35rem 0"><strong>${escapeHtml(i.label)}</strong></p><pre style="margin:.2rem 0 .6rem">${escapeHtml(i.code)}</pre>`).join("")}
          </div>
        `).join("")}
      </div>
    `);
  }

  function renderGlossary() {
    setActiveNav("glossary");
    const terms = [...DATA.glossary].sort((a, b) => a.term.localeCompare(b.term));
    setContent(`
      <h1>📖 Python Glossary</h1>
      <dl>
        ${terms.map(t => `
          <div class="glossary-term">
            <dt>${escapeHtml(t.term)}</dt>
            <dd style="margin:.2rem 0">${escapeHtml(t.definition)}</dd>
            <dd style="margin:0"><code>${escapeHtml(t.example)}</code></dd>
          </div>
        `).join("")}
      </dl>
    `);
  }

  function renderProgress() {
    setActiveNav("progress");
    const s = Storage.get();
    const total = DATA.lessons.length;
    const done = Object.keys(s.completedLessons).length;
    const quizAcc = Object.values(s.quizScores);
    const acc = quizAcc.length ? Math.round(100 * quizAcc.reduce((a, q) => a + q.correct, 0) / quizAcc.reduce((a, q) => a + q.total, 0)) : 0;
    const earnedBadges = Object.keys(s.badges);
    const dueReviews = Object.entries(s.reviewQueue).filter(([, r]) => r.due <= Storage.todayStr());

    setContent(`
      <h1>📊 Progress</h1>
      <div class="grid-3">
        <div class="card stat"><span class="num">${done}/${total}</span><span class="label">Lessons complete</span></div>
        <div class="card stat"><span class="num">${acc}%</span><span class="label">Quiz accuracy</span></div>
        <div class="card stat"><span class="num">${Object.keys(s.projectsCompleted).length}</span><span class="label">Projects completed</span></div>
      </div>

      <div class="card">
        <h3 style="margin-top:0">🔁 Review queue</h3>
        ${dueReviews.length ? dueReviews.map(([id]) => {
          const l = lessonById(id); if (!l) return "";
          return `<div style="padding:.3rem 0"><a href="#/lesson/${id}">${escapeHtml(l.title)}</a> <span style="color:var(--muted);font-size:.8rem">due for review</span></div>`;
        }).join("") : `<p style="color:var(--muted)">Nothing due for review right now.</p>`}
      </div>

      <div class="card">
        <h3 style="margin-top:0">Badges</h3>
        ${earnedBadges.length ? earnedBadges.map(id => `<span class="badge" style="margin:.2rem">${BADGE_DEFS[id]?.label || id}</span>`).join("") : `<p style="color:var(--muted)">No badges yet — complete a lesson to earn your first one.</p>`}
      </div>

      <div class="card">
        <h3 style="margin-top:0">Reset local progress</h3>
        <p style="color:var(--muted);font-size:.88rem">Progress is stored only in this browser (localStorage). Nothing is sent to a server.</p>
        <button class="btn secondary" id="reset-btn">Reset all progress</button>
      </div>
    `);
    document.getElementById("reset-btn").addEventListener("click", () => {
      if (confirm("This clears all local PythonOS progress. Continue?")) { Storage.reset(); toast("Progress reset."); Router.navigate("/dashboard"); }
    });
  }

  function renderDaily() {
    setActiveNav("daily");
    const s = Storage.get();
    const doneToday = !!s.dailyDone[Storage.todayStr()];
    const pool = DATA.lessons;
    const dayIndex = Math.abs(hashCode(Storage.todayStr())) % pool.length;
    const lesson = pool[dayIndex];
    const question = DATA.questions[Math.abs(hashCode(Storage.todayStr() + "q")) % DATA.questions.length];

    setContent(`
      <h1>🔥 Daily Python</h1>
      <p style="color:var(--muted)">A five-minute daily habit builds Python fluency faster than occasional long sessions.</p>
      <div class="card">
        <h3 style="margin-top:0">Today's concept</h3>
        <p><a href="#/lesson/${lesson.id}">${escapeHtml(lesson.title)}</a></p>
        <p style="color:var(--muted)">${escapeHtml((lesson.quick.definitions || [""])[0])}</p>
      </div>
      <div class="card">
        <h3 style="margin-top:0">Today's question</h3>
        <div id="daily-q"></div>
      </div>
      <button class="btn" id="daily-done" ${doneToday ? "disabled" : ""}>${doneToday ? "✅ Done for today" : "Mark today complete"}</button>
    `);
    QuizEngine.renderSet(document.getElementById("daily-q"), [question]);
    document.getElementById("daily-done").addEventListener("click", () => {
      Storage.markDailyDone(); checkBadges(); toast("Streak extended 🔥"); renderDaily();
    });
  }

  function renderExam() {
    setActiveNav("exam");
    setContent(`
      <h1>📝 Exam Mode</h1>
      <p style="color:var(--muted)">Choose a level and difficulty, then generate a short test from that content.</p>
      <div class="card">
        <div class="filter-row">
          <select id="exam-level" class="btn ghost">
            <option value="all">All levels</option>
            ${DATA.curriculum.map(l => `<option value="${l.id}">${l.title}</option>`).join("")}
          </select>
          <select id="exam-diff" class="btn ghost">
            <option value="all">All difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <button class="btn" id="exam-start">Generate Exam</button>
        </div>
      </div>
      <div id="exam-root"></div>
      <div id="exam-summary"></div>
    `);
    document.getElementById("exam-start").addEventListener("click", () => {
      const level = document.getElementById("exam-level").value;
      const diff = document.getElementById("exam-diff").value;
      const lessonQuizzes = DATA.lessons
        .filter(l => (level === "all" || l.levelId === level) && (diff === "all" || l.difficulty === diff))
        .flatMap(l => (l.quiz || []).map(q => ({ ...q, topic: l.id })));
      const practiceQs = DATA.questions.filter(q => diff === "all" || q.difficulty === diff);
      const pool = [...lessonQuizzes, ...practiceQs].sort(() => Math.random() - 0.5).slice(0, 8);
      const root = document.getElementById("exam-root");
      const summary = document.getElementById("exam-summary");
      if (!pool.length) { root.innerHTML = `<p style="color:var(--muted)">No questions available for that combination yet.</p>`; summary.innerHTML = ""; return; }
      let correct = 0, answered = 0;
      QuizEngine.renderSet(root, pool, {
        onProgress: (c, t) => {
          answered++;
          if (answered === t) {
            summary.innerHTML = `<div class="card"><h3 style="margin-top:0">Result</h3><p>Score: ${c}/${t} (${Math.round(100 * c / t)}%)</p></div>`;
          }
        }
      });
    });
  }

  function hashCode(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; }
    return h;
  }

  function renderPlaygroundView() {
    setActiveNav("playground");
    Playground.mount(document.getElementById("content"));
  }

  /* ---------------- Routes ---------------- */

  function registerRoutes() {
    Router.register("/dashboard", renderDashboard);
    Router.register("/roadmap", renderRoadmap);
    Router.register("/level/:id", renderLevel);
    Router.register("/lesson/:id", renderLesson);
    Router.register("/practice", renderPractice);
    Router.register("/debugging-lab", renderDebuggingLab);
    Router.register("/code-reading", renderCodeReading);
    Router.register("/projects", renderProjects);
    Router.register("/project/:id", renderProjectDetail);
    Router.register("/cheatsheets", renderCheatsheets);
    Router.register("/glossary", renderGlossary);
    Router.register("/progress", renderProgress);
    Router.register("/daily", renderDaily);
    Router.register("/exam", renderExam);
    Router.register("/playground", renderPlaygroundView);
  }

  /* ---------------- Mobile drawer ---------------- */

  function initDrawer() {
    document.getElementById("menu-toggle").addEventListener("click", () => {
      document.getElementById("sidebar").classList.add("open");
      document.getElementById("sidebar-backdrop").classList.add("open");
    });
    document.getElementById("sidebar-backdrop").addEventListener("click", () => {
      document.getElementById("sidebar").classList.remove("open");
      document.getElementById("sidebar-backdrop").classList.remove("open");
    });
  }

  function renderStreakChip() {
    const s = Storage.get();
    document.getElementById("streak-chip").textContent = `🔥 ${s.streak.current}`;
  }

  async function init() {
    await loadData();
    buildSidebar();
    registerRoutes();
    initTheme();
    initDrawer();
    Search.buildIndex(DATA);
    Search.mount();
    renderStreakChip();
    Router.start();
    window.addEventListener("hashchange", renderStreakChip);
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", App.init);
