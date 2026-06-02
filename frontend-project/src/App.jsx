import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layout/Layout.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Welcome from './pages/Welcome.jsx';
import Car from './pages/Car.jsx';
import ParkingSlot from './pages/ParkingSlot.jsx';
import ParkingRecord from './pages/ParkingRecord.jsx';
import Payment from './pages/Payment.jsx';
import Reports from './pages/Reports.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ChangePassword from './pages/ChangePassword.jsx';

function isTokenValid() {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 > Date.now();
    } catch { return false; }
}

function ProtectedRoute({ children }) {
    return isTokenValid() ? children : <Navigate to="/login" replace />;
}

function App() {
    return (
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/dashboard" element={<ProtectedRoute><Layout><Welcome /></Layout></ProtectedRoute>} />
            <Route path="/cars" element={<ProtectedRoute><Layout><Car /></Layout></ProtectedRoute>} />
            <Route path="/slots" element={<ProtectedRoute><Layout><ParkingSlot /></Layout></ProtectedRoute>} />
            <Route path="/records" element={<ProtectedRoute><Layout><ParkingRecord /></Layout></ProtectedRoute>} />
            <Route path="/payments" element={<ProtectedRoute><Layout><Payment /></Layout></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>} />
            <Route path="/change-password" element={<ProtectedRoute><Layout><ChangePassword /></Layout></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
