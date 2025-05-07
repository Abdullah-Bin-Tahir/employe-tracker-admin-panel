"use client"

import { NavLink } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { FaChartPie, FaUsers, FaCog, FaSignOutAlt } from "react-icons/fa";
import "./Sidebar.css"

const Sidebar = () => {
  const { currentUser, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Failed to log out", error)
    }
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Team Manager</h2>
        <p className="company-name">{currentUser?.displayName}</p>
      </div>
      <div className="sidebar-divider"></div>
      <ul className="sidebar-nav">
        <li>
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
            <FaChartPie /> Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/employees" className={({ isActive }) => (isActive ? "active" : "")}>
            <FaUsers /> Employees
          </NavLink>
        </li>
        <li>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? "active" : "")}>
            <FaCog /> Settings
          </NavLink>
        </li>
      </ul>
      <div className="sidebar-divider"></div>
      <div className="sidebar-footer">
        <button className="logout-button" onClick={handleLogout}>
          <FaSignOutAlt /> Logout
        </button>
      </div>
    </div>
  )
}

export default Sidebar
