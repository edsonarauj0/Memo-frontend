import { Routes, Route } from 'react-router-dom'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import ProtectedRoute from './ProtectedRoute'
import { Menu } from '../components/sidebar/app-sidebar'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Menu>
              <Dashboard />
            </Menu>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
