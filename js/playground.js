/* playground.js — in-browser Python execution using Pyodide (WebAssembly CPython).
   Pyodide is loaded lazily and only when the Playground view is first opened,
   so it never slows down the rest of the site. The rest of PythonOS works
   fully without it. */

const Playground = (() => {
  let pyodide = null;
  let loading = false;

  const EXAMPLES = [
    { label: "Hello, world", code: 'print("Hello, world!")' },
    { label: "Loop", code: "for i in range(5):\n    print(i, i * i)" },
    { label: "Function", code: "def greet(name):\n    return f\"Hi, {name}!\"\n\nprint(greet(\"PythonOS\"))" },
  ];

  async function ensureLoaded(statusEl) {
    if (pyodide) return pyodide;
    if (loading) return null;
    loading = true;
    statusEl.textContent = "Loading the Python runtime (Pyodide)… this happens once per session.";
    try {
      if (!window.loadPyodide) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
          s.onload = resolve;
          s.onerror = () => reject(new Error("Could not load Pyodide from the CDN."));
          document.head.appendChild(s);
        });
      }
      pyodide = await window.loadPyodide();
      statusEl.textContent = "Ready.";
    } catch (e) {
      statusEl.textContent = "Couldn't load the in-browser Python runtime (needs an internet connection the first time). You can still write code here and run it locally with `python3 file.py`.";
      loading = false;
      return null;
    }
    loading = false;
    return pyodide;
  }

  function mount(container) {
    container.innerHTML = `
      <h1>💻 Playground</h1>
      <p style="color:var(--muted)">Write Python and run it right here in your browser — powered by Pyodide, a real Python interpreter compiled to WebAssembly. Nothing you write here is sent anywhere.</p>
      <div class="pg-toolbar">
        <button class="btn" data-role="run">▶ Run</button>
        <button class="btn secondary" data-role="clear-output">Clear Output</button>
        <button class="btn secondary" data-role="reset">Reset Code</button>
        <select data-role="example" class="btn ghost" style="cursor:pointer">
          <option value="">Load example…</option>
          ${EXAMPLES.map((e, i) => `<option value="${i}">${e.label}</option>`).join("")}
        </select>
      </div>
      <p data-role="status" style="font-size:.8rem;color:var(--muted)"></p>
      <div class="playground-grid">
        <textarea id="pg-editor" spellcheck="false">${EXAMPLES[0].code}</textarea>
        <div id="pg-output">Output will appear here.</div>
      </div>
    `;

    const editor = container.querySelector("#pg-editor");
    const output = container.querySelector("#pg-output");
    const status = container.querySelector('[data-role="status"]');

    container.querySelector('[data-role="run"]').addEventListener("click", async () => {
      const py = await ensureLoaded(status);
      if (!py) return;
      output.textContent = "Running…";
      try {
        py.runPython(`
import sys, io
sys.stdout = io.StringIO()
sys.stderr = sys.stdout
        `);
        py.runPython(editor.value);
        const text = py.runPython("sys.stdout.getvalue()");
        output.textContent = text || "(no output — try adding a print() statement)";
      } catch (err) {
        output.textContent = "Error:\n" + err.message;
      }
    });

    container.querySelector('[data-role="clear-output"]').addEventListener("click", () => {
      output.textContent = "Output will appear here.";
    });
    container.querySelector('[data-role="reset"]').addEventListener("click", () => {
      editor.value = EXAMPLES[0].code;
    });
    container.querySelector('[data-role="example"]').addEventListener("change", (e) => {
      const idx = e.target.value;
      if (idx !== "") editor.value = EXAMPLES[idx].code;
    });
  }

  return { mount };
})();
