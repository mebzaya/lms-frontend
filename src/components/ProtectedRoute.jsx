import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div className="page-status">Loading...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
  }

  return children
}
