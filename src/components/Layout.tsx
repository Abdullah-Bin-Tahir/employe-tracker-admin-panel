import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"
import Navbar from "./Navbar"
import "./Layout.css"

const Layout = () => {
  return (
    <div className="layout">
      <Sidebar />
      <div className="content">
        <Navbar />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
