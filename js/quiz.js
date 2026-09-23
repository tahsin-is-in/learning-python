/* quiz.js — renders a list of MCQ-style questions with hint -> answer -> explanation
   flow, and reports a score. Used by lesson quizzes, the practice engine, and Exam Mode. */

const QuizEngine = (() => {
  let idCounter = 0;

  function renderQuestion(container, q, opts = {}) {
    const uid = `q${idCounter++}`;
    const wrap = document.createElement("div");
    wrap.className = "card quiz-q";
    wrap.innerHTML = `
      <p style="white-space:pre-wrap;font-weight:600;margin-bottom:.6rem">${escapeHtml(q.prompt || q.q)}</p>
      <div class="opt-list" data-role="options"></div>
      <div style="display:flex;gap:.5rem;margin-top:.4rem;flex-wrap:wrap">
        ${q.hint ? `<button class="btn ghost" data-role="hint-btn">Show Hint</button>` : ""}
        <button class="btn secondary" data-role="answer-btn">Show Answer</button>
      </div>
      <p data-role="hint" class="box tip" style="display:none;margin-top:.6rem"></p>
      <p data-role="explain" class="box remember" style="display:none;margin-top:.6rem"></p>
    `;
    container.appendChild(wrap);

    const optWrap = wrap.querySelector('[data-role="options"]');
    let answered = false;
    q.options.forEach((optText, i) => {
      const b = document.createElement("button");
      b.className = "opt";
      b.textContent = optText;
      b.addEventListener("click", () => {
        if (answered) return;
        answered = true;
        const correctIndex = q.correctIndex;
        [...optWrap.children].forEach((child, j) => {
          if (j === correctIndex) child.classList.add("correct");
          else if (j === i) child.classList.add("incorrect");
          child.disabled = true;
        });
        const isCorrect = i === correctIndex;
        if (opts.onAnswer) opts.onAnswer(isCorrect, q);
        const explainEl = wrap.querySelector('[data-role="explain"]');
        explainEl.style.display = "block";
        explainEl.innerHTML = `<div class="box-title">${isCorrect ? "✅ Correct" : "❌ Not quite"}</div>${escapeHtml(q.explain || "")}`;
      });
      optWrap.appendChild(b);
    });

    const hintBtn = wrap.querySelector('[data-role="hint-btn"]');
    if (hintBtn) {
      hintBtn.addEventListener("click", () => {
        const h = wrap.querySelector('[data-role="hint"]');
        h.style.display = "block";
        h.innerHTML = `<div class="box-title">💡 Hint</div>${escapeHtml(q.hint)}`;
      });
    }
    wrap.querySelector('[data-role="answer-btn"]').addEventListener("click", () => {
      if (!answered) {
        answered = true;
        [...optWrap.children].forEach((child, j) => {
          if (j === q.correctIndex) child.classList.add("correct");
          child.disabled = true;
        });
        if (opts.onAnswer) opts.onAnswer(null, q);
      }
      const explainEl = wrap.querySelector('[data-role="explain"]');
      explainEl.style.display = "block";
      explainEl.innerHTML = `<div class="box-title">Answer</div>${escapeHtml(q.explain || "")}`;
    });

    return wrap;
  }

  function renderSet(container, questions, opts = {}) {
    container.innerHTML = "";
    let correct = 0, total = questions.length;
    questions.forEach(q => {
      renderQuestion(container, q, {
        onAnswer: (isCorrect) => {
          if (isCorrect) correct++;
          if (opts.onProgress) opts.onProgress(correct, total);
        }
      });
    });
    return () => ({ correct, total });
  }

  return { renderQuestion, renderSet };
})();

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML.replace(/\n/g, "<br>");
}
