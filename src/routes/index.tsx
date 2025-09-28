import { Navigate, Route, Routes } from 'react-router-dom'
import { DEFAULT_PROJETO_ID } from '@/config/constants'
import ProtectedRoute from './ProtectedRoute'
import Login from '@/pages/Login'
import ProjetoPage from '@/pages/Projeto'
import Materia from '@/pages/Materia'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/projeto/:projetoId"
        element={
          <ProtectedRoute>
            <ProjetoPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projeto/:projetoId/materias"
        element={
          <ProtectedRoute>
            <Materia />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to={`/projeto/${DEFAULT_PROJETO_ID}`} replace />} />
      <Route path="*" element={<Navigate to={`/projeto/${DEFAULT_PROJETO_ID}`} replace />} />
    </Routes>
  )
}
