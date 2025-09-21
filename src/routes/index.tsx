import { Navigate, Route, Routes } from 'react-router-dom'
import { DEFAULT_PROJETO_ID } from '@/config/constants'
import ProtectedRoute from './ProtectedRoute'
import Login from '@/pages/Login'
import ProjetoPage from '@/pages/Projeto'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/projeto/:id"
        element={
          <ProtectedRoute>
            <ProjetoPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to={`/projeto/${DEFAULT_PROJETO_ID}`} replace />} />
      <Route path="*" element={<Navigate to={`/projeto/${DEFAULT_PROJETO_ID}`} replace />} />
    </Routes>
  )
}
