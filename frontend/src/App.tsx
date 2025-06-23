import Register from './components/Register'
import { Route, Routes } from 'react-router-dom'
import Login from './components/Login'
import ForgotPassword from './components/ForgotPassword'
import HomePage from './components/HomePage'

import MarketplacePage from './components/MarkerPlace'
import AppLayout from './AppLayout'


const App = () => {
  return (
     <Routes>
      {/* Layout Route with Nested Pages */}
      <Route path="/" element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="marketplace" element={<MarketplacePage />} />
      </Route>

      {/* Auth Pages (no Navbar) */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
    </Routes>
  
  )
}

export default App