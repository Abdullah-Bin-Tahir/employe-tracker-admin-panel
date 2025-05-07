"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getFirestore, doc, getDoc, collection, query, orderBy, getDocs,deleteDoc } from "firebase/firestore"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import "./EmployeeDetails.css"

interface LocationHistory {
  id: string
  latitude: number
  longitude: number
  timestamp: number
  createdAt: Date
  eventType:string
}

interface EmployeeDetails {
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
  createdAt: Date
}

const EmployeeDetails = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState<EmployeeDetails | null>(null)
  const [locationHistory, setLocationHistory] = useState<LocationHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const db = getFirestore()

  useEffect(() => {
    const loadEmployeeDetails = async () => {
      if (!id) return

      try {
        setLoading(true)

        // Get employee details
        const employeeDoc = await getDoc(doc(db, "users", id))

        if (!employeeDoc.exists()) {
          setError("Employee not found")
          setLoading(false)
          return
        }

        const data = employeeDoc.data()
        setEmployee({
          id: employeeDoc.id,
          displayName: data.displayName || data.email,
          email: data.email,
          status: data.status || "offline",
          lastLocation: data.lastLocation,
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
        })

        // Get location history
        const historyQuery = query(collection(db, "users", id, "locationHistory"), orderBy("createdAt", "desc"))

        const historySnapshot = await getDocs(historyQuery)
        const historyData: LocationHistory[] = []

        historySnapshot.forEach((doc) => {
          const data = doc.data()
          historyData.push({
            id: doc.id,
            latitude: data.latitude,
            longitude: data.longitude,
            eventType: data.eventType,
            timestamp: data.timestamp,
            createdAt: data.createdAt?.toDate() || new Date(),
          })
        })

        setLocationHistory(historyData)
      } catch (error) {
        console.error("Error loading employee details:", error)
        setError("Failed to load employee details")
      } finally {
        setLoading(false)
      }
    }

    loadEmployeeDetails()
  }, [id])

  const handleDeleteEmployee = async () => {
    if (!id) return
  
    const confirmDelete = window.confirm("Are you sure you want to delete this employee?")
    if (!confirmDelete) return
  
    try {
      // Delete Firestore user document
      await deleteDoc(doc(db, "users", id))
  
      // Optional: Delete subcollections (locationHistory) — Firestore does not delete subcollections automatically.
      // You can handle this via a Cloud Function or manually loop and delete.
  
      // Navigate back
      alert("Employee deleted successfully.")
      navigate("/employees")
    } catch (error) {
      console.error("Error deleting employee:", error)
      alert("Failed to delete employee.")
    }
  }
  const formatDate = (date: Date) => {
    return date.toLocaleString()
  }

  if (loading) {
    return <div className="loading">Loading employee details...</div>
  }

  if (error || !employee) {
    return (
      <div className="error-container">
        <div className="error-message">{error || "Employee not found"}</div>
        <button className="back-button" onClick={() => navigate("/employees")}>
          Back to Employees
        </button>
      </div>
    )
  }

  return (
    <div className="employee-details">
      <div className="details-header">
        <button className="back-button" onClick={() => navigate("/employees")}>
          &larr; Back to Employees
        </button>
       
      </div>

      <div className="employee-info-card">
        <div className="employee-header">
          <h2>{employee.displayName}</h2>
          <span className={`status-badge ${employee.status}`}>{employee.status}</span>
        </div>

        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Email:</span>
            <span className="info-value">{employee.email}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Joined:</span>
            <span className="info-value">{formatDate(employee.createdAt)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Last Updated:</span>
            <span className="info-value">{formatDate(employee.lastUpdated)}</span>
          </div>
        </div>
      </div>

      {employee.status === "online" && employee.lastLocation && (
        <div className="location-card">
          <h3>Current Location</h3>
          <div className="map-container">
            <MapContainer
              center={[employee.lastLocation.latitude, employee.lastLocation.longitude]}
              zoom={15}
              style={{ height: "400px", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={[employee.lastLocation.latitude, employee.lastLocation.longitude]}>
                <Popup>
                  <div>
                    <strong>{employee.displayName}</strong>
                    <br />
                    Last updated: {formatDate(employee.lastUpdated)}
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
          <div className="coordinates">
            <div className="coordinate">
              <span className="coordinate-label">Latitude:</span>
              <span className="coordinate-value">{employee.lastLocation.latitude.toFixed(6)}</span>
            </div>
            <div className="coordinate">
              <span className="coordinate-label">Longitude:</span>
              <span className="coordinate-value">{employee.lastLocation.longitude.toFixed(6)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="history-card">
        <h3>Location History</h3>
        {locationHistory.length > 0 ? (
          <table className="history-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Event Type</th>
              </tr>
            </thead>
            <tbody>
              {locationHistory.map((location) => (
                <tr key={location.id}>
                  <td>{formatDate(location.createdAt)}</td>
                  <td>{location.latitude.toFixed(6)}</td>
                  <td>{location.longitude.toFixed(6)}</td>
                  <td>{location.eventType || "check-in"}</td>
                </tr>
              ))}
              
            </tbody>
          </table>
          
        ) : (
          <div className="no-data">No location history available</div>
        )}
        
      </div>
      <button
  className="delete-button"
  onClick={handleDeleteEmployee}
  style={{ backgroundColor: "red", color: "white", padding: "10px",  border: "none",marginTop: "20px", borderRadius: "5px" }}
>
  Delete Employee Account
</button>
    </div>
  )
}

export default EmployeeDetails
