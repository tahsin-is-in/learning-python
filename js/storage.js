/* storage.js — thin, safe wrapper around localStorage.
   All PythonOS state lives under a single namespaced key so it's easy
   to inspect, export, or reset. */

const Storage = (() => {
  const KEY = "pythonos_state_v1";

  const defaultState = () => ({
    theme: "system",
    completedLessons: {},      // { lessonId: { completedAt, confidence } }
    quizScores: {},            // { lessonId: { correct, total, lastAttempt } }
    practiceSolved: {},        // { questionId: true }
    projectsCompleted: {},     // { projectId: true }
    dailyDone: {},             // { "YYYY-MM-DD": true }
    streak: { current: 0, best: 0, lastDay: null },
    badges: {},                // { badgeId: earnedAt }
    reviewQueue: {},           // { lessonId: { due: dateStr, interval } }
  });

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return Object.assign(defaultState(), parsed);
    } catch (e) {
      console.warn("PythonOS: could not read local storage, starting fresh.", e);
      return defaultState();
    }
  }

  let state = load();

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("PythonOS: could not save progress locally.", e);
    }
  }

  function get() { return state; }

  function update(mutator) {
    mutator(state);
    save();
  }

  function reset() {
    state = defaultState();
    save();
  }

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function markLessonComplete(lessonId, confidence) {
    update(s => {
      s.completedLessons[lessonId] = { completedAt: Date.now(), confidence: confidence || "good" };
      bumpStreak(s);
      scheduleReview(s, lessonId, confidence || "good");
    });
  }

  function bumpStreak(s) {
    const today = todayStr();
    if (s.streak.lastDay === today) return;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    s.streak.current = (s.streak.lastDay === yesterday) ? s.streak.current + 1 : 1;
    s.streak.best = Math.max(s.streak.best, s.streak.current);
    s.streak.lastDay = today;
  }

  function scheduleReview(s, lessonId, confidence) {
    const intervals = { again: 1, hard: 2, good: 4, easy: 8 };
    const days = intervals[confidence] || 4;
    const due = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
    s.reviewQueue[lessonId] = { due, interval: days };
  }

  function recordQuizScore(lessonId, correct, total) {
    update(s => { s.quizScores[lessonId] = { correct, total, lastAttempt: Date.now() }; });
  }

  function markPracticeSolved(questionId) {
    update(s => { s.practiceSolved[questionId] = true; });
  }

  function markProjectComplete(projectId) {
    update(s => { s.projectsCompleted[projectId] = true; });
  }

  function markDailyDone() {
    update(s => { s.dailyDone[todayStr()] = true; bumpStreak(s); });
  }

  function awardBadge(id) {
    let awarded = false;
    update(s => {
      if (!s.badges[id]) { s.badges[id] = Date.now(); awarded = true; }
    });
    return awarded;
  }

  return {
    get, update, reset, save,
    markLessonComplete, recordQuizScore, markPracticeSolved,
    markProjectComplete, markDailyDone, awardBadge, todayStr,
  };
})();
