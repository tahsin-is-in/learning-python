/* router.js — tiny hash router.
   Routes look like #/lesson/variables-and-data-types or #/dashboard.
   Hash routing means GitHub Pages needs zero server configuration. */

const Router = (() => {
  const routes = [];

  function register(pattern, handler) {
    // pattern like "/lesson/:id" -> regex with named groups
    const paramNames = [];
    const regexStr = "^" + pattern.replace(/:[^/]+/g, (m) => {
      paramNames.push(m.slice(1));
      return "([^/]+)";
    }) + "$";
    routes.push({ regex: new RegExp(regexStr), paramNames, handler });
  }

  function resolve() {
    let hash = location.hash.replace(/^#/, "");
    if (!hash) hash = "/dashboard";
    for (const r of routes) {
      const match = hash.match(r.regex);
      if (match) {
        const params = {};
        r.paramNames.forEach((name, i) => { params[name] = decodeURIComponent(match[i + 1]); });
        r.handler(params);
        return;
      }
    }
    // no match -> dashboard
    navigate("/dashboard");
  }

  function navigate(path) {
    if (location.hash.replace(/^#/, "") === path) { resolve(); }
    else { location.hash = path; }
  }

  function start() {
    window.addEventListener("hashchange", resolve);
    resolve();
  }

  return { register, navigate, start, resolve };
})();
