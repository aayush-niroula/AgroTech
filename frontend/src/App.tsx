import Register from './components/Register'
import { Route, Routes } from 'react-router-dom'
import Login from './components/Login'
import ForgotPassword from './components/ForgotPassword'



import AppLayout from './AppLayout'
import MarketplacePage from './Pages/MarkerPlace'
import HomePage from './Pages/HomePage'
import FeaturesPage from './Pages/FeaturePage'
import PlantDiseaseDetection from './Pages/PlantDiseaseDetection'
import AddProductForm from './components/AddProductForm'
import ProductDetailPage from './Pages/ProductDetailsPage'
import {ChatPage }from './Pages/ChatPage'
import Inbox from './components/Inbox'


const App = () => {
  return (
     <Routes>
      {/* Layout Route with Nested Pages */}
      <Route path="/" element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route  path='/features' element={<FeaturesPage/>}/>
        <Route path="marketplace" element={<MarketplacePage />} />
        <Route path='/predict-disease' element={<PlantDiseaseDetection/>}/>
        <Route path='/createproduct' element={<AddProductForm/>}/>
        <Route path='/product/:productId' element={<ProductDetailPage/>}/>
        <Route path='chat/:sellerId' element={<ChatPage/>}/>
        <Route path="/seller/inbox" element={<Inbox />} />
      </Route>

      {/* Auth Pages (no Navbar) */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
    </Routes>
  
  )
}

export default App