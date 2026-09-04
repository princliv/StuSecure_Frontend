import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { firebaseApp } from './config';

export const auth = getAuth(firebaseApp);

export const firebaseAuth = {
  signIn: (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password),

  signUp: (email: string, password: string) =>
    createUserWithEmailAndPassword(auth, email, password),

  signOut: () => signOut(auth),

  resetPassword: (email: string) => sendPasswordResetEmail(auth, email),

  sendVerificationEmail: (user: User) => sendEmailVerification(user),

  onAuthStateChanged: (callback: (user: User | null) => void) =>
    onAuthStateChanged(auth, callback),

  getIdToken: (user: User, forceRefresh = false) => user.getIdToken(forceRefresh),
};
