import { initializeApp, getApps, getApp } from "firebase/app"

// Your main Firebase config
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
}

// Initialize the main app (if not already initialized)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

// Initialize secondary app only when needed
export const getSecondaryApp = () => {
  const secondaryAppName = "Secondary"
  const existingApp = getApps().find((a) => a.name === secondaryAppName)

  if (existingApp) return existingApp
  return initializeApp(firebaseConfig, secondaryAppName)
}
