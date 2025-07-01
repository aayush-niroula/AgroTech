import Register from './components/Register'
import { Route, Routes } from 'react-router-dom'
import Login from './components/Login'
import ForgotPassword from './components/ForgotPassword'



import AppLayout from './AppLayout'
import MarketplacePage from './Pages/MarkerPlace'
import HomePage from './Pages/HomePage'
import FeaturesPage from './Pages/FeaturePage'
import PlantDiseaseDetection from './Pages/PlantDiseaseDetection'


const App = () => {
  return (
     <Routes>
      {/* Layout Route with Nested Pages */}
      <Route path="/" element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route  path='/features' element={<FeaturesPage/>}/>
        <Route path="marketplace" element={<MarketplacePage />} />
        <Route path='/predict-disease' element={<PlantDiseaseDetection/>}/>
      </Route>

      {/* Auth Pages (no Navbar) */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
    </Routes>
  
  )
}

export default App