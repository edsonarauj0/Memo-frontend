import { BrowserRouter } from 'react-router-dom'
import Layout from './components/Layout'
import { AppRoutes } from './routes'
import { AuthProvider } from './contexts/AuthContext'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <AppRoutes />
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  )
}
