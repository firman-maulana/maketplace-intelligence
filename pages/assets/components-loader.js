/**
 * Component Loader Script
 * Automatically loads reusable components defined via:
 * <app-header></app-header>
 * <app-footer></app-footer>
 * <app-cta-v1></app-cta-v1>
 * <app-cta-v2></app-cta-v2>
 * <app-newsletter></app-newsletter>
 * OR <div data-component="header"></div>
 */
(function () {
  const componentMap = {
    'header': 'components/header/header.html',
    'footer': 'components/footer/footer.html',
    'sections/CTAV1': 'components/sections/CTAV1.html',
    'sections/CTAV2': 'components/sections/CTAV2.html',
    'sections/newsletter': 'components/sections/newsletter.html',
    'cta-v1': 'components/sections/CTAV1.html',
    'cta-v2': 'components/sections/CTAV2.html',
    'newsletter': 'components/sections/newsletter.html'
  };

  const tagMap = {
    'APP-HEADER': 'header',
    'APP-FOOTER': 'footer',
    'APP-CTA-V1': 'sections/CTAV1',
    'APP-CTA-V2': 'sections/CTAV2',
    'APP-NEWSLETTER': 'sections/newsletter'
  };

  // Determine base path for components relative to root
  function getComponentPath(compName) {
    const rawPath = componentMap[compName] || (compName.endsWith('.html') ? compName : `components/${compName}.html`);
    // If the current URL has /pages/ in pathname, adjust if needed
    const currentPath = window.location.pathname;
    if (currentPath.includes('/pages/')) {
      return rawPath;
    }
    // If root level
    return rawPath;
  }

  async function loadComponent(element, componentName) {
    const filePath = getComponentPath(componentName);
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to load ${filePath} (status ${response.status})`);
      }
      const html = await response.text();
      const temp = document.createElement('div');
      temp.innerHTML = html.trim();

      const newNodes = Array.from(temp.childNodes);
      const parent = element.parentNode;
      if (!parent) return [];

      newNodes.forEach((node) => parent.insertBefore(node, element));
      parent.removeChild(element);
      return newNodes;
    } catch (err) {
      console.error('[ComponentLoader Error]:', err);
      return [];
    }
  }

  function reinitializeLibraries() {
    // 1. Re-initialize GSAP reveal animations for injected [data-ns-animate]
    if (typeof window.initRevealElements === 'function') {
      try {
        window.initRevealElements();
      } catch (e) {
        console.warn('initRevealElements error:', e);
      }
    }

    // Fallback: If header/elements still have opacity-0, ensure they are visible
    document.querySelectorAll('.header-one.opacity-0').forEach(header => {
      header.classList.remove('opacity-0');
      header.style.opacity = '1';
    });

    // 2. Re-bind Sidebar mobile menu
    if (typeof sidebarAnimation !== 'undefined' && sidebarAnimation.init) {
      try {
        sidebarAnimation.init();
      } catch (e) {
        console.warn('sidebarAnimation.init error:', e);
      }
    }

    // 3. Re-bind Theme toggle
    if (typeof themeSwitcher !== 'undefined' && themeSwitcher.init) {
      try {
        themeSwitcher.init();
      } catch (e) {
        console.warn('themeSwitcher.init error:', e);
      }
    }

    // 4. Refresh ScrollTrigger
    if (typeof ScrollTrigger !== 'undefined' && ScrollTrigger.refresh) {
      ScrollTrigger.refresh();
    }

    // 5. Update status login tombol header (Get Started -> Dashboard)
    updateHeaderAuthState();
  }

  function updateHeaderAuthState() {
    try {
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('auth_user');
      let user = null;
      try {
        user = userStr ? JSON.parse(userStr) : null;
      } catch (e) {}

      // Pengguna dianggap login jika token ada ATAU user profile ada di storage
      const isLoggedIn = !!(token || (user && (user.id || user.username || user.email)));

      const targetHref = isLoggedIn ? '../dashboard/pages/index.html' : '../dashboard/pages/auth-login-cover.html';
      const targetText = isLoggedIn ? 'Dashboard' : 'Get started';

      const desktopBtn = document.getElementById('headerAuthBtn');
      const mobileBtn = document.getElementById('headerAuthBtnMobile');

      if (desktopBtn) {
        desktopBtn.href = targetHref;
        const span = desktopBtn.querySelector('span');
        if (span) {
          span.textContent = targetText;
        } else {
          desktopBtn.textContent = targetText;
        }
      }

      if (mobileBtn) {
        mobileBtn.href = targetHref;
        const span = mobileBtn.querySelector('span');
        if (span) {
          span.textContent = targetText;
        } else {
          mobileBtn.textContent = targetText;
        }
      }

      // Fallback selector untuk link header manapun
      document.querySelectorAll('header a, .header-one a, aside.sidebar a').forEach(a => {
        const txt = (a.textContent || '').trim().toLowerCase();
        if (txt === 'get started' || txt === 'dashboard' || a.href.includes('auth-login-cover') || a.href.includes('dashboard/pages/index')) {
          a.href = targetHref;
          const span = a.querySelector('span');
          if (span) span.textContent = targetText;
          else a.textContent = targetText;
        }
      });
    } catch (e) {
      console.warn('updateHeaderAuthState error:', e);
    }
  }

  window.addEventListener('storage', updateHeaderAuthState);
  window.addEventListener('pageshow', updateHeaderAuthState);
  document.addEventListener('DOMContentLoaded', updateHeaderAuthState);
  [50, 150, 300, 600, 1000, 2000].forEach(delay => setTimeout(updateHeaderAuthState, delay));

  async function initializeComponents() {
    const customElements = document.querySelectorAll(Object.keys(tagMap).join(','));
    const customTagPromises = Array.from(customElements).map(el => {
      const compName = tagMap[el.tagName];
      return loadComponent(el, compName);
    });

    const dataComponentElements = document.querySelectorAll('[data-component]');
    const dataCompPromises = Array.from(dataComponentElements).map(el => {
      const compName = el.getAttribute('data-component');
      return loadComponent(el, compName);
    });

    await Promise.all([...customTagPromises, ...dataCompPromises]);

    // Dispatch event
    document.dispatchEvent(new CustomEvent('components:loaded'));

    // Re-run animations and scripts
    reinitializeLibraries();
  }

  // Run as early as possible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeComponents);
  } else {
    initializeComponents();
  }
})();
