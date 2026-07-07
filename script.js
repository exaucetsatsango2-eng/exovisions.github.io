(function () {
  const config = {
    adminEmail: 'admin@exovisions.com',
    demoPassword: 'Exo2026!',
    firebaseConfig: {
      apiKey: 'AIzaSyBn0fHYCsgcQPdNNUGgU3ti7KhqWOOMbDk',
      authDomain: 'exovisions-8360a.firebaseapp.com',
      projectId: 'exovisions-8360a',
      storageBucket: 'exovisions-8360a.firebasestorage.app',
      messagingSenderId: '614706658999',
      appId: '1:614706658999:web:c67e5caa9851ba455c5732',
      measurementId: 'G-S0FFQ4D4Z4'
    },
    loginPage: 'login.html',
    adminPage: 'admin.html'
  };

  const storageKey = 'exo-admin-auth';
  const noteKey = 'exo-admin-note';

  const isPlaceholderConfig = () => {
    return !config.firebaseConfig.apiKey || config.firebaseConfig.apiKey.includes('YOUR_');
  };

  const persistAuth = (user, mode = 'demo') => {
    localStorage.setItem(storageKey, JSON.stringify({ mode, user }));
  };

  const clearAuth = () => {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(noteKey);
  };

  const getStoredAuth = () => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || 'null');
    } catch (error) {
      return null;
    }
  };

  const getCurrentUser = () => {
    if (!window.exoAuth) return null;
    if (window.exoAuth.currentUser) return window.exoAuth.currentUser;
    if (window.exoAuth.auth?.currentUser) return window.exoAuth.auth.currentUser;
    return null;
  };

  const isAdminUser = (user) => {
    return !!user && user.email?.toLowerCase() === config.adminEmail.toLowerCase();
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

    const isAdmin = isAdminUser(user);

    if (isAdmin) {
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

  const initializeFirebase = () => {
    if (window.exoAuth?.mode === 'firebase' && window.exoAuth.auth) {
      return true;
    }

    if (isPlaceholderConfig()) {
      window.exoAuth = { mode: 'demo' };
      return false;
    }

    window.exoAuth = { mode: 'demo' };
    return false;
  };

  const handleGoogleLogin = () => {
    const button = document.getElementById('google-login');
    if (!button || !window.exoAuth?.signInWithPopup) return;

    button.addEventListener('click', async () => {
      try {
        const result = await window.exoAuth.signInWithPopup();
        const user = result.user;
        if (isAdminUser(user)) {
          persistAuth(user, 'firebase');
          window.location.href = config.adminPage;
        } else {
          showInlineMessage('#auth-feedback', 'Ce compte Google n’est pas autorisé à l’administration.', 'error');
          await window.exoAuth.signOut();
        }
      } catch (error) {
        showInlineMessage('#auth-feedback', error.message || 'Échec de la connexion Google.', 'error');
      }
    });
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
        if (email.toLowerCase() === config.adminEmail.toLowerCase() && password === config.demoPassword) {
          const demoUser = { email, uid: 'demo-admin' };
          window.exoAuth = { ...window.exoAuth, currentUser: demoUser, mode: 'demo' };
          persistAuth(demoUser, 'demo');
          const redirectTarget = getRedirectTarget();
          window.location.href = redirectTarget;
          return;
        }

        if (!window.exoAuth?.auth) {
          showInlineMessage('#auth-feedback', 'Le mode démo n’est pas disponible pour ce compte. Utilisez Firebase ou le compte demo.', 'error');
          return;
        }

        const credential = await window.exoAuth.signInWithEmailAndPassword(email, password);
        const user = credential.user;
        const isAdmin = isAdminUser(user);

        if (!isAdmin) {
          showInlineMessage('#auth-feedback', 'Ce compte n’est pas autorisé à accéder à l’administration.', 'error');
          await window.exoAuth.signOut();
          return;
        }

        const redirectTarget = getRedirectTarget();
        window.location.href = redirectTarget;
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

    const storedAuth = getStoredAuth();
    if (storedAuth?.mode === 'demo' && isAdminUser(storedAuth.user)) {
      window.exoAuth = { ...window.exoAuth, currentUser: storedAuth.user, mode: 'demo' };
      adminContent.hidden = false;
      lockedContent.hidden = true;
      updateNav(storedAuth.user);
      return;
    }

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

    if (window.exoAuth?.onAuthStateChanged) {
      window.exoAuth.onAuthStateChanged((user) => {
        const resolvedUser = user || currentUser;
        if (!isAdminUser(resolvedUser)) {
          adminContent.hidden = true;
          lockedContent.hidden = false;
          updateNav(resolvedUser);
          return;
        }

        adminContent.hidden = false;
        lockedContent.hidden = true;
        updateNav(resolvedUser);
      });
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
      clearAuth();
      if (window.exoAuth?.signOut) {
        await window.exoAuth.signOut();
      }
      window.location.href = config.loginPage;
    });
  };

  const handleAdminDashboard = () => {
    const noteInput = document.getElementById('announcement-note');
    const notePreview = document.getElementById('announcement-preview');
    const noteForm = document.getElementById('announcement-form');

    if (!noteInput || !notePreview || !noteForm) return;

    const savedNote = localStorage.getItem(noteKey) || 'Aucune note enregistrée.';
    noteInput.value = savedNote;
    notePreview.textContent = savedNote;

    noteForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = noteInput.value.trim();
      localStorage.setItem(noteKey, value || 'Aucune note enregistrée.');
      notePreview.textContent = localStorage.getItem(noteKey);
      showInlineMessage('#admin-feedback', 'Note enregistrée dans votre navigateur.', 'info');
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    const initialized = initializeFirebase();
    updateNav(null);

    const storedAuth = getStoredAuth();
    if (storedAuth?.user && storedAuth.mode === 'demo') {
      window.exoAuth = { ...window.exoAuth, currentUser: storedAuth.user, mode: 'demo' };
      updateNav(storedAuth.user);
    }

    handleLoginForm();
    handleGoogleLogin();
    handleLogout();
    handleAdminDashboard();

    if (!initialized) {
      return;
    }

    if (window.exoAuth?.onAuthStateChanged) {
      window.exoAuth.onAuthStateChanged((user) => {
        updateNav(user);
      });
    }

    protectAdminPage();
  });
})();
