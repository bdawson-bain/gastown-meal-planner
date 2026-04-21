import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Onboarding from './pages/Onboarding'
import Plan from './pages/Plan'
import GroceryList from './pages/GroceryList'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="onboarding" element={<Onboarding />} />
        <Route path="plan" element={<Plan />} />
        <Route path="grocery-list" element={<GroceryList />} />
      </Route>
    </Routes>
  )
}
