const build = new URL(import.meta.url).searchParams.get('v');
const buildPattern = /^[a-f0-9]{40}-\d+-\d+$/;
const appRoot = new URL('./', import.meta.url);

function clearSiteCookies() {
  const paths = new Set(['/', appRoot.pathname, location.pathname]);
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.trim().split('=', 1)[0];
    if (!/^(?:__Host-)?sandbox-live-[\w-]+$/.test(name)) continue;
    for (const path of paths) {
      document.cookie = `${name}=; Max-Age=0; Path=${path}; Secure; SameSite=Lax`;
    }
  }
}

export function watchBuild(canRefresh = () => true) {
  if (!buildPattern.test(build)) return;
  let checking = false;
  async function check() {
    if (checking) return;
    checking = true;
    try {
      const marker = new URL('build.json', appRoot);
      marker.searchParams.set('check', Date.now());
      const response = await fetch(marker, {cache: 'no-store'});
      if (!response.ok) return;
      const next = (await response.json()).build;
      if (!buildPattern.test(next) || next === build || !canRefresh()) return;

      const page = new URL(location.href);
      page.searchParams.set('build', next);
      if (page.href === location.href) return;
      clearSiteCookies();
      location.replace(page.href);
    } catch {
      // Retry on the next check if the network or deployment is unavailable.
    } finally {
      checking = false;
    }
  }
  check();
  setInterval(check, 30000);
}
