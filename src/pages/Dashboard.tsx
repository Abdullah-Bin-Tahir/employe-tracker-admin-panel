"use client"

import { useState, useEffect } from "react"
import { getFirestore, collection, query, where, onSnapshot } from "firebase/firestore"
import { useAuth } from "../contexts/AuthContext"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import "./Dashboard.css"
import L from "leaflet"

// Fix for default marker icons in Leaflet with React
// import L from "leaflet";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});


interface EmployeeStatus {
  id: string
  displayName: string
  email: string
  status: "online" | "offline"
  lastLocation?: {
    latitude: number
    longitude: number
    timestamp: number
  }
  lastUpdated: Date
}

const Dashboard = () => {
  const { currentUser } = useAuth()
  const [employees, setEmployees] = useState<EmployeeStatus[]>([])
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    offline: 0,
  })
  const [mapCenter, setMapCenter] = useState<[number, number]>([51.505, -0.09]) // Default to London
  const [mapZoom, setMapZoom] = useState(13)
  const db = getFirestore()

  useEffect(() => {
    if (!currentUser) return

    const employeesQuery = query(
      collection(db, "users"),
      where("companyId", "==", currentUser.companyId),
      where("role", "==", "employee"),
    )

    const unsubscribe = onSnapshot(employeesQuery, (snapshot) => {
      const employeeData: EmployeeStatus[] = []

      snapshot.forEach((doc) => {
        const data = doc.data()
        employeeData.push({
          id: doc.id,
          displayName: data.displayName || data.email,
          email: data.email,
          status: data.status || "offline",
          lastLocation: data.lastLocation,
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
        })
      })

      setEmployees(employeeData)

      // Update stats
      setStats({
        total: employeeData.length,
        online: employeeData.filter((e) => e.status === "online").length,
        offline: employeeData.filter((e) => e.status === "offline").length,
      })

      // Set map center to the first online employee with location
      const onlineWithLocation = employeeData.find((e) => e.status === "online" && e.lastLocation)
      if (onlineWithLocation && onlineWithLocation.lastLocation) {
        setMapCenter([onlineWithLocation.lastLocation.latitude, onlineWithLocation.lastLocation.longitude])
      }
    })

    return () => unsubscribe()
  }, [currentUser])

  const formatDate = (date: Date) => {
    return date.toLocaleString()
  }

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>

      <div className="stats-container">
        <div className="stat-card">
          <h3>Total Employees</h3>
          <p className="stat-number">{stats.total}</p>
        </div>
        <div className="stat-card online">
          <h3>Online</h3>
          <p className="stat-number">{stats.online}</p>
        </div>
        <div className="stat-card offline">
          <h3>Offline</h3>
          <p className="stat-number">{stats.offline}</p>
        </div>
      </div>

      <div className="map-container">
        <h3>Employee Locations</h3>
        <div className="map">
          <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: "400px", width: "100%" }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {employees
              .filter((employee) => employee.status === "online" && employee.lastLocation)
              .map((employee) => (
                <Marker
                  key={employee.id}
                  position={[employee.lastLocation!.latitude, employee.lastLocation!.longitude]}
                >
                  <Popup>
                    <div>
                      <strong>{employee.displayName}</strong>
                      <br />
                      Status: {employee.status}
                      <br />
                      Last updated: {formatDate(employee.lastUpdated)}
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <table className="activity-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Status</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {employees.length > 0 ? (
              employees
                .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())
                .map((employee) => (
                  <tr key={employee.id}>
                    <td>{employee.displayName}</td>
                    <td>
                      <span className={`status-badge ${employee.status}`}>{employee.status}</span>
                    </td>
                    <td>{formatDate(employee.lastUpdated)}</td>
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan={3} className="no-data">
                  No employees found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Dashboard
