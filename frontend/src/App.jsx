import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";

// Admin Pages
import Dashboard from "./pages/Dashboard.jsx";
import AddResident from "./pages/AddResident.jsx";
import EditResident from "./pages/EditResident.jsx";
import Complaints from "./pages/Complaints.jsx";
import Circulars from "./pages/Circulars.jsx";
import VacatedList from "./pages/VacatedList.jsx";
import BlocksPage from "./pages/BlocksPage.jsx";
import BlockDetailsPage from "./pages/BlockDetailsPage.jsx";
import BlockFloorRoomsPage from "./pages/BlockFloorRoomsPage.jsx";
import RoomDetailsPage from "./pages/RoomDetailsPage.jsx";
import PaymentTrackingPage from "./pages/PaymentTrackingPage.jsx";
import RoomOccupancyPage from "./pages/RoomOccupancyPage.jsx";
import ResidentsListPage from "./pages/ResidentsListPage.jsx";
import ManageRoomsPage from "./pages/ManageRoomsPage.jsx";
import AdminComplaintManagement from "./pages/AdminComplaintManagement.jsx";
import AdminFoodConfirmationList from "./pages/AdminFoodConfirmationList.jsx";
import FoodMenuManagement from "./pages/FoodMenuManagement.jsx";

// User Pages
import UserDashboard from "./pages/UserDashboard.jsx";
import FoodConfirmation from "./pages/FoodConfirmation.jsx";
import UserComplaints from "./pages/UserComplaints.jsx";
import UserCirculars from "./pages/UserCirculars.jsx";
import FoodMenu from "./pages/FoodMenu.jsx";
import UserProfile from "./pages/UserProfile.jsx";

import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated (either admin or user)
    const userToken = localStorage.getItem("userToken");
    const adminToken = localStorage.getItem("adminToken");
    const userInfo = localStorage.getItem("user");
    const adminInfo = localStorage.getItem("admin");
    
    if ((userToken && userInfo) || (adminToken && adminInfo)) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route 
          path="/login" 
          element={
            localStorage.getItem("adminToken") 
              ? <Navigate to="/dashboard" replace /> 
              : <Login setIsAuthenticated={setIsAuthenticated} />
          } 
        />


        {/* Admin Routes */}
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/add-resident" 
          element={isAuthenticated ? <AddResident /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/edit-resident/:id" 
          element={isAuthenticated ? <EditResident /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/complaints" 
          element={isAuthenticated ? <Complaints /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/circulars" 
          element={isAuthenticated ? <Circulars /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/vacated" 
          element={isAuthenticated ? <VacatedList /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/blocks" 
          element={isAuthenticated ? <BlocksPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/block/:blockNumber/floor/:floorNumber" 
          element={isAuthenticated ? <BlockFloorRoomsPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/block/:blockNumber" 
          element={isAuthenticated ? <BlockDetailsPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/room/:blockNumber/:roomNumber" 
          element={isAuthenticated ? <RoomDetailsPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/payment-tracking" 
          element={isAuthenticated ? <PaymentTrackingPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/payment-tracking/:residentId" 
          element={isAuthenticated ? <PaymentTrackingPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/rooms-occupancy" 
          element={isAuthenticated ? <RoomOccupancyPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/residents-list" 
          element={isAuthenticated ? <ResidentsListPage /> : <Navigate to="/login" replace />} 
        />
        <Route
          path="/manage-rooms"
          element={isAuthenticated ? <ManageRoomsPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/admin-food-confirmations"
          element={isAuthenticated ? <AdminFoodConfirmationList /> : <Navigate to="/login" replace />}
        />        <Route 
          path="/food-menu-management"
          element={isAuthenticated ? <FoodMenuManagement /> : <Navigate to="/login" replace />}
        />
        {/* User Routes */}
        <Route 
          path="/user-dashboard" 
          element={isAuthenticated ? <UserDashboard /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/food-menu" 
          element={isAuthenticated ? <FoodMenu /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/food-confirmation" 
          element={isAuthenticated ? <FoodConfirmation /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/user-complaints" 
          element={isAuthenticated ? <UserComplaints /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/user-circulars" 
          element={isAuthenticated ? <UserCirculars /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/user-profile" 
          element={isAuthenticated ? <UserProfile /> : <Navigate to="/login" replace />} 
        />

        {/* Default Route - Always go to login if not authenticated */}
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} 
        />

        {/* 404 - Not Found */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
