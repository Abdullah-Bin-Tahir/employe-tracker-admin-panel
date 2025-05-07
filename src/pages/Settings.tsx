"use client"

import type React from "react"

import { useState } from "react"
import { getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth"
import { getFirestore, doc, updateDoc } from "firebase/firestore"
import { useAuth } from "../contexts/AuthContext"
import "./Settings.css"

const Settings = () => {
  const { currentUser } = useAuth()
  const [companyName, setCompanyName] = useState(currentUser?.displayName || "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const auth = getAuth()
  const db = getFirestore()

  const handleUpdateCompanyName = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser) return

    try {
      setLoading(true)
      setError("")
      setSuccess("")

      await updateDoc(doc(db, "users", currentUser.uid), {
        displayName: companyName,
      })

      setSuccess("Company name updated successfully")
    } catch (error: any) {
      console.error("Error updating company name:", error)
      setError(error.message || "Failed to update company name")
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser || !auth.currentUser) return

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match")
      return
    }

    try {
      setLoading(true)
      setError("")
      setSuccess("")

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword)

      await reauthenticateWithCredential(auth.currentUser, credential)

      // Update password
      await updatePassword(auth.currentUser, newPassword)

      setSuccess("Password updated successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      console.error("Error changing password:", error)
      if (error.code === "auth/wrong-password") {
        setError("Current password is incorrect")
      } else {
        setError(error.message || "Failed to change password")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="settings-page">
      <h2>Settings</h2>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="settings-card">
        <h3>Company Information</h3>
        <form onSubmit={handleUpdateCompanyName}>
          <div className="form-group">
            <label htmlFor="companyName">Company Name</label>
            <input
              type="text"
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="save-button" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      <div className="settings-card">
        <h3>Change Password</h3>
        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="save-button" disabled={loading}>
            {loading ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Settings
