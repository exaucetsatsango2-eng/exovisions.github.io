const STORAGE_KEYS = {
  adminAccount: 'exo-local-admin',
  session: 'exo-local-session'
};

function ensureAdminAccount() {
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
    email: 'admin@exovisions.com',
    password: 'admin2026'
  };
  localStorage.setItem(STORAGE_KEYS.adminAccount, JSON.stringify(fallbackAccount));
  return fallbackAccount;
}

function emitAuthChange() {
  window.dispatchEvent(new Event('exo-auth-changed'));
}

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.session) || 'null');
  } catch (error) {
    return null;
  }
}

function writeSession(user) {
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(user));
  emitAuthChange();
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.session);
  emitAuthChange();
}

export async function isAdminUser(user) {
  if (!user?.email) return false;
  const account = ensureAdminAccount();
  return user.email.toLowerCase() === account.email.toLowerCase();
}

export function getCurrentUser() {
  return readSession();
}

export async function loginWithEmail(email, password) {
  const account = ensureAdminAccount();
  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail !== account.email.toLowerCase() || password !== account.password) {
    throw new Error('Identifiants invalides.');
  }

  const user = {
    email: account.email,
    uid: 'local-admin'
  };
  writeSession(user);
  return { user };
}

export async function loginWithGoogle() {
  throw new Error('La connexion Google est désactivée en mode local.');
}

export async function registerWithEmail() {
  throw new Error('L’inscription est désactivée en mode local.');
}

export async function logout() {
  clearSession();
}

export function onAuthChange(callback) {
  const handler = () => callback(getCurrentUser());
  window.addEventListener('exo-auth-changed', handler);
  return () => window.removeEventListener('exo-auth-changed', handler);
}
