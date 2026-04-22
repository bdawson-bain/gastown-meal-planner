import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Plan from './pages/Plan'
import Plans from './pages/Plans'
import GroceryList from './pages/GroceryList'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route
          index
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="login" element={<Login />} />
        <Route path="onboarding" element={<Onboarding />} />
        <Route
          path="plan"
          element={
            <ProtectedRoute>
              <Plan />
            </ProtectedRoute>
          }
        />
        <Route
          path="plans"
          element={
            <ProtectedRoute>
              <Plans />
            </ProtectedRoute>
          }
        />
        <Route
          path="grocery-list"
          element={
            <ProtectedRoute>
              <GroceryList />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  )
}
