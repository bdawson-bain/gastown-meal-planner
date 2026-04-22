import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children }) {
  const userId = localStorage.getItem('user_id')
  if (!userId) {
    return <Navigate to="/" replace />
  }
  return children
}
