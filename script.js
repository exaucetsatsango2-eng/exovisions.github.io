(function () {
  window.exoAuth = window.exoAuth || { mode: 'local' };

  const config = {
    adminEmail: 'admin@exovisions.com',
    adminPassword: 'admin2026',
    loginPage: 'login.html',
    adminPage: 'admin.html'
  };

  const STORAGE_KEYS = {
    adminAccount: 'exo-local-admin',
    session: 'exo-local-session'
  };

  const ensureAdminAccount = () => {
    const stored = localStorage.getItem(STORAGE_KEYS.adminAccount);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.email && parsed?.password) {
          return parsed;
        }
      } catch (error) {
        console.warn('Invalid local admin account.', error);
      }
    }

    const fallbackAccount = {
      email: config.adminEmail,
      password: config.adminPassword
    };
    localStorage.setItem(STORAGE_KEYS.adminAccount, JSON.stringify(fallbackAccount));
    return fallbackAccount;
  };

  const getStoredSession = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.session) || 'null');
    } catch (error) {
      return null;
    }
  };

  const persistSession = (user) => {
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(user));
    window.dispatchEvent(new Event('exo-auth-changed'));
  };

  const clearSession = () => {
    localStorage.removeItem(STORAGE_KEYS.session);
    window.dispatchEvent(new Event('exo-auth-changed'));
  };

  const getCurrentUser = () => {
    return getStoredSession();
  };

  const isAdminUser = (user) => {
    const account = ensureAdminAccount();
    return !!user && user.email?.toLowerCase() === account.email.toLowerCase();
  };

  const getRedirectTarget = () => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    return redirect && redirect !== config.loginPage ? redirect : config.adminPage;
  };

  const showInlineMessage = (selector, message, type = 'info') => {
    const element = document.querySelector(selector);
    if (!element) return;
    element.textContent = message;
    element.className = `auth-message ${type}`;
  };

  const updateNav = (user) => {
    const loginLink = document.getElementById('login-link');
    const adminLink = document.getElementById('admin-link');
    const userPill = document.getElementById('user-pill');

    if (!loginLink || !adminLink || !userPill) return;

    if (isAdminUser(user)) {
      loginLink.hidden = true;
      adminLink.hidden = false;
      userPill.hidden = false;
      userPill.textContent = `Admin · ${user.email}`;
    } else if (user) {
      loginLink.hidden = true;
      adminLink.hidden = true;
      userPill.hidden = false;
      userPill.textContent = user.email || 'Connecté';
    } else {
      loginLink.hidden = false;
      adminLink.hidden = true;
      userPill.hidden = true;
      userPill.textContent = '';
    }
  };

  const handleLoginForm = () => {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const submitButton = form.querySelector('button[type="submit"]');

      if (!email || !password) {
        showInlineMessage('#auth-feedback', 'Veuillez saisir votre email et votre mot de passe.', 'error');
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = 'Connexion...';

      try {
        const account = ensureAdminAccount();
        const normalizedEmail = email.trim().toLowerCase();

        if (normalizedEmail !== account.email.toLowerCase() || password !== account.password) {
          throw new Error('Identifiants invalides.');
        }

        const user = { email: account.email, uid: 'local-admin' };
        persistSession(user);
        updateNav(user);
        window.location.href = getRedirectTarget();
      } catch (error) {
        showInlineMessage('#auth-feedback', error.message || 'Échec de la connexion.', 'error');
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Se connecter';
      }
    });
  };

  const protectAdminPage = () => {
    const adminPage = document.body.dataset.adminPage;
    if (!adminPage) return;

    const adminContent = document.getElementById('admin-content');
    const lockedContent = document.getElementById('locked-content');
    if (!adminContent || !lockedContent) return;

    const currentUser = getCurrentUser();
    if (!currentUser) {
      window.location.href = `${config.loginPage}?redirect=${encodeURIComponent(config.adminPage)}`;
      return;
    }

    if (!isAdminUser(currentUser)) {
      adminContent.hidden = true;
      lockedContent.hidden = false;
      updateNav(currentUser);
      return;
    }

    adminContent.hidden = false;
    lockedContent.hidden = true;
    updateNav(currentUser);
  };

  const handleLogout = () => {
    const logoutButton = document.getElementById('logout-button');
    if (!logoutButton) return;

    logoutButton.addEventListener('click', async () => {
      clearSession();
      window.location.href = config.loginPage;
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    ensureAdminAccount();
    const currentUser = getCurrentUser();
    updateNav(currentUser);

    if (window.location.pathname.includes('login.html') && currentUser && isAdminUser(currentUser)) {
      window.location.href = config.adminPage;
      return;
    }

    handleLoginForm();
    handleLogout();
    protectAdminPage();
  });
})();
