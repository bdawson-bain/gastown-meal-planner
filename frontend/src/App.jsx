import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Plan from './pages/Plan'
import GroceryList from './pages/GroceryList'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
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
