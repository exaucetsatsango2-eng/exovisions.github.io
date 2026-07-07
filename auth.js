import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc
} from './firebase-config.js';

const ADMIN_EMAILS = ['admin@exovisions.com'];

export async function isAdminUser(user) {
  if (!user) return false;

  const normalizedEmail = user.email?.toLowerCase();
  if (normalizedEmail && ADMIN_EMAILS.includes(normalizedEmail)) {
    return true;
  }

  if (!user.uid) return false;

  try {
    const adminRef = doc(db, 'admins', user.uid);
    const adminSnap = await getDoc(adminRef);
    return adminSnap.exists();
  } catch (error) {
    return false;
  }
}

export function getCurrentUser() {
  return auth.currentUser;
}

export async function loginWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function registerWithEmail(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  return signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
