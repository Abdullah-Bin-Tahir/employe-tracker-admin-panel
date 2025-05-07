"use client"

import { useAuth } from "../contexts/AuthContext"
import "./Navbar.css"

const Navbar = () => {
  const { currentUser } = useAuth()

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h1 className="page-title">Dashboard</h1>
      </div>
      <div className="navbar-right">
        <div className="user-info">
          <span className="user-name">{currentUser?.displayName || currentUser?.email}</span>
          <span className="user-role">Administrator</span>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
