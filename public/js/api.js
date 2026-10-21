// Shared fetch helper for every page. Cookie-based session (httpOnly), so credentials:'include'
// is what keeps the user logged in across requests — no token handling needed in the page itself.
async function api(path, opts = {}) {
  const res = await fetch('/api' + path, {
    method: opts.method || 'GET',
    credentials: 'include',
    headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* no body */ }
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `request_failed_${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/** Call at the top of any page that requires login. Redirects to login.html if not authenticated. */
async function requireLogin() {
  try {
    return await api('/me');
  } catch (e) {
    window.location.href = '/login.html?next=' + encodeURIComponent(window.location.pathname);
    throw e;
  }
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function naira(n) {
  return '₦' + Math.round(n).toLocaleString('en-NG');
}

function subjectLabel(slug) {
  if (!slug) return '';
  const map = {
    mathematics: 'Mathematics', english: 'English', englishlit: 'Literature', physics: 'Physics',
    chemistry: 'Chemistry', biology: 'Biology', commerce: 'Commerce', accounting: 'Accounting',
    economics: 'Economics', government: 'Government', crk: 'CRK', irk: 'IRK', geography: 'Geography',
    civiledu: 'Civic Education', currentaffairs: 'Current Affairs', history: 'History', insurance: 'Insurance',
  };
  return map[slug] || (slug.charAt(0).toUpperCase() + slug.slice(1));
}
