import { Outlet } from "react-router-dom";
import { Navbar } from "./components/Navbar";


const AppLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col">
    <Navbar/>
    <main className="flex-grow">
    <Outlet/>
    </main>
    </div>
  )
}

export default AppLayout