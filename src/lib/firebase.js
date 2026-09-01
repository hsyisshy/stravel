import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCFVFYFiA-mgr68qIHwrSBPdCX6gto-61Q',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'fir-travel-ed41b.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'fir-travel-ed41b',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'fir-travel-ed41b.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '4208320574',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:4208320574:web:4163955d8b08bf7642716f',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-27NDTE4H4R',
}

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const storage = getStorage(app)
