import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import StaffLayout from './components/StaffLayout'
import HomePage from './pages/HomePage'
import BookingPage from './pages/BookingPage'
import BookingConfirmationPage from './pages/BookingConfirmationPage'
import LookupPage from './pages/LookupPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminDashboard from './pages/admin/Dashboard'
import AdminBookings from './pages/admin/Bookings'
import AdminUsers from './pages/admin/Users'
import AdminSettings from './pages/admin/Settings'
import AdminParkingTypes from './pages/admin/ParkingTypes'
import AdminDiscounts from './pages/admin/Discounts'
import AdminServices from './pages/admin/Services'
import AdminNotifications from './pages/admin/Notifications'
import StaffDashboard from './pages/staff/Dashboard'
import StaffBookings from './pages/staff/Bookings'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="booking" element={<BookingPage />} />
            <Route path="booking-confirmation" element={<BookingConfirmationPage />} />
            <Route path="lookup" element={<LookupPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
          </Route>

          {/* Protected admin routes */}
          <Route path="/admin" element={<ProtectedRoute requiredRole="admin" />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="parking-types" element={<AdminParkingTypes />} />
              <Route path="services" element={<AdminServices />} />
              <Route path="discounts" element={<AdminDiscounts />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Route>

          {/* Protected staff routes */}
          <Route path="/staff" element={<ProtectedRoute requiredRole="staff" />}>
            <Route element={<StaffLayout />}>
              <Route index element={<StaffDashboard />} />
              <Route path="dashboard" element={<StaffDashboard />} />
              <Route path="bookings" element={<StaffBookings />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App 