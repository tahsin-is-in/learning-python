# PythonOS

**Learn Python from Zero → Advanced → Real-World Projects.**

PythonOS is a self-contained, interactive Python learning platform that runs entirely as a static site — no backend, no build step, no database. It behaves like a personal tutor rather than a documentation wiki: every lesson follows Concept → Intuition → Syntax → Examples → Common Mistakes → Practice → Quiz → Mastery Check, and can be read in two modes (⚡ Quick revision or 📚 Deep learning).

## Features

- Full 23-level curriculum map (Foundations → Professional Python), with real, complete lessons for Foundations and Python Fundamentals as a working example set
- Two-layer lessons: Quick Mode (2–5 min revision) and Deep Mode (full explanation, examples, common mistakes, mini-projects)
- Practice engine with MCQ / predict-output / find-the-error / debug question types, filterable by topic and difficulty
- Debugging Lab and Code Reading Lab
- Exam Mode: generates a short test from any level + difficulty combination
- Daily Python: a rotating daily concept + question, with a streak counter
- Project Mode: goal, requirements, architecture, milestones, layered hints, testing checklist and extension ideas for each project — solutions are never given upfront
- In-browser Python **Playground** powered by [Pyodide](https://pyodide.org) (real CPython compiled to WebAssembly) — no server required, and the rest of the site works fine if it can't load
- Client-side search (`Ctrl/Cmd + K`) across lessons, glossary, projects and cheat sheets
- Progress dashboard: completion %, quiz accuracy, streaks, badges, and a spaced-repetition review queue
- Printable cheat sheets and an alphabetical glossary
- Light / Dark / System theme, remembered locally
- Fully responsive (sidebar becomes a drawer on mobile), keyboard-navigable, respects `prefers-reduced-motion`

All progress is stored in the browser's `localStorage` under a single key (`pythonos_state_v1`) — nothing is sent to a server, and there's no login.

## Project structure

```
pythonos/
├── index.html            # single-page app shell (sidebar, topbar, router mounts here)
├── css/
│   ├── themes.css        # color tokens (light/dark)
│   ├── style.css         # layout & components
│   └── responsive.css    # mobile breakpoints
├── js/
│   ├── storage.js        # localStorage wrapper (progress, streaks, badges, review queue)
│   ├── router.js         # tiny hash router (#/lesson/:id etc.)
│   ├── quiz.js           # reusable question-rendering engine
│   ├── practice.js       # filterable practice question browser
│   ├── search.js         # Ctrl+K client-side search
│   ├── playground.js     # Pyodide-powered code editor
│   └── app.js            # data loading + every page view
├── data/
│   ├── curriculum.json   # the full 23-level map (titles + topic lists) — used for nav & roadmap
│   ├── lessons.json      # full lesson content (add new lessons here)
│   ├── questions.json    # standalone practice question bank
│   ├── projects.json     # project-mode content
│   ├── glossary.json     # glossary terms
│   └── cheatsheets.json  # printable cheat sheet content
├── projects/ , cheatsheets/, assets/   # reserved for future static content (images, etc.)
├── .nojekyll
└── README.md
```

Content is deliberately kept out of the JavaScript. `app.js` only knows how to *render* whatever is in `data/*.json` — to add material, you edit JSON, not code.

## Running locally

```bash
git clone <your-fork-url>
cd pythonos
python -m http.server 8000
```

Then open **http://localhost:8000**.

You need a local server (not double-clicking `index.html`) because the app loads `data/*.json` with `fetch()`, and browsers block `fetch()` against `file://` URLs for security reasons. Any static server works — `python -m http.server`, `npx serve`, VS Code's "Live Server" extension, etc.

## Deploying to GitHub Pages

1. Push this repository to GitHub.
2. In **Settings → Pages**, set the source to the `main` branch, root folder.
3. Your site will be published at `https://USERNAME.github.io/REPO-NAME/`.
4. The `.nojekyll` file is already included so GitHub Pages serves the `data/` and `js/` folders as-is (Jekyll would otherwise ignore underscore-prefixed files and reprocess things it doesn't need to).
5. Routing uses hash URLs (`#/lesson/...`), so there's nothing extra to configure — GitHub Pages doesn't need a rewrite rule the way a `history`-API router would.

## Adding a lesson

Add an object to `data/lessons.json`:

```json
{
  "id": "unique-id",
  "levelId": "basics",
  "title": "Lesson Title",
  "difficulty": "beginner",
  "estimatedTime": "20 minutes",
  "prerequisites": ["id-of-a-lesson-that-should-come-first"],
  "objectives": ["What the learner will be able to do"],
  "quick": { "definitions": ["..."], "syntax": "code", "rules": ["..."], "cheat": "code" },
  "deep": { "intuition": "...", "sections": [{ "heading": "...", "body": "..." }], "examples": [{ "title": "...", "code": "...", "explain": "..." }], "realWorld": "..." },
  "commonMistakes": [{ "bad": "code", "good": "code", "why": "..." }],
  "practice": ["exercise 1", "exercise 2"],
  "challenge": "harder problem",
  "miniProject": { "title": "...", "goal": "..." },
  "quiz": [{ "q": "...", "options": ["...", "..."], "correctIndex": 0, "explain": "..." }],
  "prev": "previous-lesson-id-or-null",
  "next": "next-lesson-id-or-null"
}
```

The lesson will automatically appear under its level in the sidebar/roadmap, respect prerequisite locking, and get a quiz, progress tracking, and a review-queue entry once completed — no code changes needed.

## Adding practice questions

Add an object to `data/questions.json` with `id`, `type`, `topic`, `difficulty`, `prompt`, `options`, `correctIndex`, `hint` and `explain`. It will show up automatically in Practice, and can be pulled into Exam Mode.

## Adding a project

Add an object to `data/projects.json` following the shape already used there (`goal`, `requirements`, `concepts`, `architecture`, `milestones`, `hints`, `commonProblems`, `testingChecklist`, `extensions`).

## How progress is stored

Everything lives under one `localStorage` key, `pythonos_state_v1`, defined in `js/storage.js`:

- `completedLessons` — which lessons are done, and the confidence rating given (Again/Hard/Good/Easy)
- `quizScores`, `practiceSolved`, `projectsCompleted`
- `streak` — current/best day streak, driven by completing lessons or the Daily Python session
- `reviewQueue` — a lightweight spaced-repetition schedule (interval lengthens with higher confidence)
- `badges` — awarded automatically once thresholds in `app.js`'s `BADGE_DEFS` are met

Because it's just `localStorage`, progress is per-browser and per-device, and `Progress → Reset all progress` clears it instantly.

## What's scaffolded vs. what's fully written

This first version ships a **fully working system** — routing, lessons, quizzes, practice, debugging lab, code reading lab, exam mode, daily practice, projects, cheat sheets, glossary, search, dark mode, streaks, badges, spaced review, and the Pyodide playground all work end-to-end today. Real, complete lesson content is written for **Level 0 (Foundations)** and **Level 1 (Python Fundamentals)** as a proof of the system; `curriculum.json` maps out all 23 levels for navigation and the roadmap, and each additional level is meant to be filled in the same way, using `lessons.json`, without touching the JavaScript.

## Future improvements

- Fill in lessons for Levels 2–22 (Data Structures through Professional Python) — the architecture supports hundreds of lessons without changes
- Expand the practice bank into the thousands of questions
- Add more cheat sheets (NumPy, pandas, SQL, Git in more depth)
- Replace the simple substring search with a small pre-built inverted index once content grows large
- Optional: syntax highlighting in code blocks (e.g. Prism.js) once you're ready to add an external dependency
