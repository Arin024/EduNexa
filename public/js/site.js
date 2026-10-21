// ===========================================================================
// PrepMaster AI — Shared Site Client, PWA Engine & Component Renderer
// ===========================================================================

const DEVELOPER_WEBSITE_URL = 'https://arinze-web-studio.netlify.app/';

// ---------------------------------------------------------------------------
// PWA Installation & Lifecycle Engine
// ---------------------------------------------------------------------------
let deferredInstallPrompt = null;
let isPWAInstalled = false;

function checkIsStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator && window.navigator.standalone === true) ||
    document.referrer.includes('android-app://')
  );
}

isPWAInstalled = checkIsStandalone();

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  window.deferredPWAInstallPrompt = e;
  // Notify any active install buttons on the page
  const installBtns = document.querySelectorAll('.pm-pwa-install-trigger');
  installBtns.forEach((btn) => {
    btn.style.display = 'inline-flex';
  });
  const installBanners = document.querySelectorAll('.pm-pwa-banner-card');
  installBanners.forEach((b) => {
    b.style.display = 'flex';
  });
});

window.addEventListener('appinstalled', () => {
  isPWAInstalled = true;
  deferredInstallPrompt = null;
  window.deferredPWAInstallPrompt = null;
  const installBtns = document.querySelectorAll('.pm-pwa-install-trigger, .pm-pwa-banner-card');
  installBtns.forEach((el) => {
    el.style.display = 'none';
  });
  showToast('PrepMaster AI installed successfully! You can now launch it from your home screen.');
});

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[SW] Registration failed:', err);
    });
  });
}

function promptPWAInstall() {
  if (isPWAInstalled) {
    showToast('PrepMaster AI is already installed on this device.');
    return;
  }

  // iOS Safari check
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (isIOS) {
    showIOSInstallModal();
    return;
  }

  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        isPWAInstalled = true;
      }
      deferredInstallPrompt = null;
    });
  } else {
    // If browser doesn't support beforeinstallprompt or not ready
    showToast('To install, tap your browser menu (⋮) and select "Add to Home Screen" or "Install App".');
  }
}

function showIOSInstallModal() {
  const existing = document.getElementById('pm-ios-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'pm-ios-modal';
  overlay.className = 'pm-modal-overlay';
  overlay.innerHTML = `
    <div class="pm-modal-card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <img src="/icons/icon-192.png" width="38" height="38" style="border-radius:10px;" alt="PrepMaster">
          <div>
            <h3 style="margin:0; font-size:1.1rem;">Install PrepMaster AI</h3>
            <span class="subtle">For iPhone &amp; iPad</span>
          </div>
        </div>
        <button onclick="document.getElementById('pm-ios-modal').remove()" style="background:none; border:none; color:#64748b; font-size:22px; cursor:pointer;">&times;</button>
      </div>
      <p style="color:#475569; font-size:0.92rem; line-height:1.5; margin-bottom:16px;">
        Install this app on your iPhone or iPad for a faster, full-screen exam prep experience without browser clutter.
      </p>
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:14px; margin-bottom:20px;">
        <div style="display:flex; align-items:flex-start; gap:12px; margin-bottom:10px;">
          <span style="background:#2563eb; color:#fff; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; flex-shrink:0;">1</span>
          <span style="font-size:0.9rem; color:#1e293b;">Tap the <strong>Share</strong> icon (${getIcon('share', '', 16)}) at the bottom of Safari.</span>
        </div>
        <div style="display:flex; align-items:flex-start; gap:12px; margin-bottom:10px;">
          <span style="background:#2563eb; color:#fff; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; flex-shrink:0;">2</span>
          <span style="font-size:0.9rem; color:#1e293b;">Scroll down and select <strong>Add to Home Screen</strong>.</span>
        </div>
        <div style="display:flex; align-items:flex-start; gap:12px;">
          <span style="background:#2563eb; color:#fff; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; flex-shrink:0;">3</span>
          <span style="font-size:0.9rem; color:#1e293b;">Tap <strong>Add</strong> in the top-right corner.</span>
        </div>
      </div>
      <button onclick="document.getElementById('pm-ios-modal').remove()" class="pm-btn pm-btn-primary pm-btn-block">Got It</button>
    </div>
  `;
  document.body.appendChild(overlay);
}

// ---------------------------------------------------------------------------
// Toast Notification Utility
// ---------------------------------------------------------------------------
function showToast(message, type = 'info') {
  let container = document.getElementById('pm-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'pm-toast-container';
    container.style.cssText = 'position:fixed; top:20px; right:20px; z-index:9999; display:flex; flex-direction:column; gap:8px; max-width:360px; width:calc(100% - 40px); pointer-events:none;';
    document.body.appendChild(container);
  } else {
    // Clear previous toasts so they don't stack up uncontrollably
    container.innerHTML = '';
  }

  const toast = document.createElement('div');
  toast.style.cssText = 'background:#0f172a; color:#fff; padding:12px 16px; border-radius:12px; font-size:0.9rem; box-shadow:0 10px 25px rgba(0,0,0,0.25); display:flex; align-items:center; gap:10px; animation:pmSlideUp 0.2s ease; border:1px solid rgba(255,255,255,0.1); pointer-events:auto;';
  toast.innerHTML = `<span style="color:#38bdf8;">${getIcon('sparkles', '', 18)}</span><span style="flex:1;">${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, 4000);
}

// ---------------------------------------------------------------------------
// Topbar & Bottom Navigation Renderers
// ---------------------------------------------------------------------------
function renderTopbar(title = '') {
  const el = document.getElementById('site-topbar');
  if (!el) return;

  const showInstall = !isPWAInstalled;

  el.className = 'pm-topbar';
  el.innerHTML = `
    <div class="pm-topbar-inner">
      <a href="/dashboard.html" class="pm-brand-link">
        <div class="pm-brand-logo">
          <img src="/icons/icon-192.png" width="34" height="34" style="border-radius:9px;" alt="Logo">
        </div>
        <div class="pm-brand-name">
          PrepMaster AI
          <span class="pm-brand-tag">Exam Coach</span>
        </div>
      </a>

      <div style="display:flex; align-items:center; gap:10px;">
        ${showInstall ? `
          <button onclick="promptPWAInstall()" class="pm-btn pm-btn-sm pm-btn-secondary pm-pwa-install-trigger" style="display:inline-flex;">
            ${getIcon('download', '', 15)}
            <span class="pm-desktop-only">Install App</span>
          </button>
        ` : ''}

        <a href="/premium.html" class="pm-btn pm-btn-sm pm-btn-outline" style="border-color:#fde68a; background:#fffbeb; color:#b45309;">
          ${getIcon('star', '', 14)}
          <span class="pm-desktop-only">Upgrade</span>
        </a>

        <div style="position:relative;">
          <button id="user-menu-btn" class="pm-btn pm-btn-ghost" style="padding:6px; border-radius:50%; width:36px; height:36px;" title="Account">
            ${getIcon('user', '', 20)}
          </button>
          <div id="user-menu-dropdown" style="display:none; position:absolute; right:0; top:42px; background:#fff; border:1px solid #e2e8f0; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.08); width:180px; padding:6px; z-index:100;">
            <a href="/progress.html" style="display:flex; align-items:center; gap:8px; padding:8px 12px; border-radius:8px; font-size:0.88rem; color:#1e293b;">
              ${getIcon('progress', '', 16)} Progress
            </a>
            <a href="/study-plan.html" style="display:flex; align-items:center; gap:8px; padding:8px 12px; border-radius:8px; font-size:0.88rem; color:#1e293b;">
              ${getIcon('calendar', '', 16)} Study Plan
            </a>
            <a href="/referrals.html" style="display:flex; align-items:center; gap:8px; padding:8px 12px; border-radius:8px; font-size:0.88rem; color:#1e293b;">
              ${getIcon('gift', '', 16)} Refer &amp; Earn
            </a>
            <div style="height:1px; background:#e2e8f0; margin:4px 0;"></div>
            <a href="#" id="pm-logout-btn" style="display:flex; align-items:center; gap:8px; padding:8px 12px; border-radius:8px; font-size:0.88rem; color:#e11d48;">
              ${getIcon('logOut', '', 16)} Log Out
            </a>
          </div>
        </div>
      </div>
    </div>
  `;

  // Menu Dropdown Logic
  const menuBtn = document.getElementById('user-menu-btn');
  const menuDrop = document.getElementById('user-menu-dropdown');
  if (menuBtn && menuDrop) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      menuDrop.style.display = menuDrop.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', () => {
      menuDrop.style.display = 'none';
    });
  }

  // Logout Logic
  const logoutBtn = document.getElementById('pm-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try { await api('/auth/logout', { method: 'POST' }); } catch {}
      window.location.href = '/login.html';
    });
  }
}

const NAV_TABS = [
  { href: '/dashboard.html', icon: 'home', label: 'Command' },
  { href: '/practice.html', icon: 'practice', label: 'Practice' },
  { href: '/mock.html', icon: 'cbt', label: 'CBT Mock' },
  { href: '/tutor.html', icon: 'coach', label: 'AI Coach' },
  { href: '/progress.html', icon: 'progress', label: 'Progress' },
];

function renderBottomNav() {
  const el = document.getElementById('site-nav');
  if (!el) return;
  const currentPath = window.location.pathname;

  el.className = 'pm-bottom-nav';
  el.innerHTML = NAV_TABS.map((tab) => {
    const isActive = currentPath === tab.href;
    return `
      <a href="${tab.href}" class="pm-nav-tab ${isActive ? 'active' : ''}">
        ${getIcon(tab.icon, '', 20)}
        <span>${tab.label}</span>
      </a>
    `;
  }).join('');
}

function renderDeveloperAttribution() {
  const el = document.getElementById('site-footer');
  if (!el) return;
  el.innerHTML = `
    <footer style="text-align:center; padding:32px 16px 20px; color:#64748b; font-size:0.82rem; border-top:1px solid #e2e8f0; margin-top:40px;">
      <div style="display:flex; justify-content:center; gap:16px; margin-bottom:12px; font-weight:600;">
        <a href="/privacy-policy.html" style="color:#64748b;">Privacy Policy</a>
        <span>&bull;</span>
        <a href="/terms.html" style="color:#64748b;">Terms of Service</a>
        <span>&bull;</span>
        <a href="/premium.html" style="color:#64748b;">Premium Plans</a>
      </div>
      <div>
        Designed &amp; Engineered by
        <a href="${DEVELOPER_WEBSITE_URL}" target="_blank" rel="noopener noreferrer" style="font-weight:700; color:#1e293b;">Arinzechukwu Christian</a>
        &bull; Powered by
        <a href="${DEVELOPER_WEBSITE_URL}" target="_blank" rel="noopener noreferrer" style="font-weight:700; color:#2563eb;">Arinze Web Studio</a>
      </div>
      <div class="subtle" style="margin-top:6px;">
        PrepMaster AI &bull; Official Nigerian Past Questions (JAMB &bull; WAEC &bull; NECO)
      </div>
    </footer>
  `;
}

// ---------------------------------------------------------------------------
// Signature "Rescue Me" Session Launcher
// ---------------------------------------------------------------------------
function launchRescueSession(subject, topic) {
  if (!subject) subject = 'mathematics';
  let cleanTopic = topic || '';
  try { cleanTopic = decodeURIComponent(cleanTopic); } catch {}
  window.location.href = `/practice.html?subject=${encodeURIComponent(subject)}&rescue=1&topic=${encodeURIComponent(cleanTopic)}`;
}

// ---------------------------------------------------------------------------
// Real-Time Online / Offline Connectivity Indicator (PWA Requirement)
// ---------------------------------------------------------------------------
function initConnectivityListener() {
  function updateStatus(isOnline) {
    let indicator = document.getElementById('pm-offline-indicator');
    if (!isOnline) {
      if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'pm-offline-indicator';
        indicator.style.cssText = 'position:fixed; bottom:74px; left:16px; z-index:9998; display:flex; align-items:center; gap:8px; background:#d97706; color:#ffffff; font-size:0.82rem; font-weight:700; padding:8px 14px; border-radius:999px; box-shadow:0 10px 25px rgba(0,0,0,0.2); animation:pmSlideUp 0.2s ease;';
        indicator.innerHTML = '<span style="width:8px; height:8px; border-radius:50%; background:#fff; display:inline-block;"></span> Offline Mode — Cached data is active';
        document.body.appendChild(indicator);
      }
    } else {
      if (indicator) {
        indicator.remove();
        showToast('Internet restored — Back online!');
      }
    }
  }

  window.addEventListener('online', () => updateStatus(true));
  window.addEventListener('offline', () => updateStatus(false));
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    updateStatus(false);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderDeveloperAttribution();
  initConnectivityListener();
});

