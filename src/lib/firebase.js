import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCkdQhdXcIzrNVRCntLLduZGU0OpYXdCO4',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'fir-travel-51872.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'fir-travel-51872',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'fir-travel-51872.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '39211497808',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:39211497808:web:bc1a1db443e733eb15d455',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-5PERYMSDXX',
}

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const storage = getStorage(app)
