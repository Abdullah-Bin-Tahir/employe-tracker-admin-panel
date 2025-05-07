"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { getAuth, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from "firebase/auth"
import { getFirestore, doc, getDoc } from "firebase/firestore"
import { app } from "../firebase"

interface User {
  uid: string
  email: string
  role: string
  companyId: string
  displayName?: string
}

interface AuthContextType {
  currentUser: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const auth = getAuth(app)
  const db = getFirestore(app)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get additional user data from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()

          // Only allow admin users to access the web portal
          if (userData.role === "admin") {
            setCurrentUser({
              uid: user.uid,
              email: user.email || "",
              role: userData.role,
              companyId: userData.companyId,
              displayName: userData.displayName || user.displayName || "",
            })
          } else {
            // If not admin, sign them out
            await firebaseSignOut(auth)
            setCurrentUser(null)
          }
        }
      } else {
        setCurrentUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      await signInWithEmailAndPassword(auth, email, password)
      // The user state will be set by the auth state listener
    } catch (error: any) {
      console.error("Login error:", error)
      throw new Error(error.message || "Failed to login")
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await firebaseSignOut(auth)
      setCurrentUser(null)
    } catch (error: any) {
      console.error("Logout error:", error)
      throw new Error(error.message || "Failed to logout")
    }
  }

  const value = {
    currentUser,
    loading,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
