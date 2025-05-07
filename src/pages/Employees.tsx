"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, serverTimestamp, setDoc } from "firebase/firestore"
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth"
import { useAuth } from "../contexts/AuthContext"
import "./Employees.css"
import { getSecondaryApp } from "../firebase" // Import the getSecondaryApp function

interface Employee {
  id: string
  displayName: string
  email: string
  status: "online" | "offline"
  lastUpdated: Date
}

const secondaryApp = getSecondaryApp()
const secondaryAuth = getAuth(secondaryApp)
const Employees = () => {
  const { currentUser } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newEmployee, setNewEmployee] = useState({
    displayName: "",
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const db = getFirestore()
  const auth = getAuth()

  const loadEmployees = async () => {
    if (!currentUser) return

    try {
      setLoading(true)
      const employeesQuery = query(
        collection(db, "users"),
        where("companyId", "==", currentUser.companyId),
        where("role", "==", "employee"),
      )

      const querySnapshot = await getDocs(employeesQuery)
      const employeeData: Employee[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        employeeData.push({
          id: doc.id,
          displayName: data.displayName || data.email,
          email: data.email,
          status: data.status || "offline",
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
        })
      })

      setEmployees(employeeData)
    } catch (error) {
      console.error("Error loading employees:", error)
      setError("Failed to load employees")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEmployees()
  }, [currentUser])

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser) return

    try {
      setError("")
      setSuccess("")

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newEmployee.email, newEmployee.password)

      // Create user document with employee role
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: newEmployee.email,
        displayName: newEmployee.displayName,
        role: "employee",
        companyId: currentUser.companyId,
        status: "offline",
        createdAt: serverTimestamp(),
      })
      // Cleanup
      await secondaryAuth.signOut()
      setSuccess("Employee added successfully")
      setShowAddModal(false)
      setNewEmployee({
        displayName: "",
        email: "",
        password: "",
      })

      // Reload employees list
      loadEmployees()
    } catch (error: any) {
      console.error("Error adding employee:", error)
      setError(error.message || "Failed to add employee")
    }
  }

  return (
    <div className="employees-page">
      <div className="employees-header">
        <h2>Employees</h2>
        <button className="add-button" onClick={() => setShowAddModal(true)}>
          Add Employee
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {loading ? (
        <div className="loading">Loading employees...</div>
      ) : (
        <div className="employees-table-container">
          <table className="employees-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.length > 0 ? (
                employees.map((employee) => (
                  <tr key={employee.id}>
                    <td>{employee.displayName}</td>
                    <td>{employee.email}</td>
                    <td>
                      <span className={`status-badge ${employee.status}`}>{employee.status}</span>
                    </td>
                    <td>{employee.lastUpdated.toLocaleString()}</td>
                    <td>
                      <Link to={`/employees/${employee.id}`} className="view-button">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="no-data">
                    No employees found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add New Employee</h3>
            <form onSubmit={handleAddEmployee}>
              <div className="form-group">
                <label htmlFor="displayName">Name</label>
                <input
                  type="text"
                  id="displayName"
                  value={newEmployee.displayName}
                  onChange={(e) => setNewEmployee({ ...newEmployee, displayName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={newEmployee.password}
                  onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                  required
                />
              </div>

              <div className="modal-buttons">
                <button type="button" className="cancel-button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-button">
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Employees
