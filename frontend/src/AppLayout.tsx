import { Outlet } from "react-router-dom";
import { Navbar } from "./components/Navbar";


const AppLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-black dark:to-gray-900 transition-colors flex flex-col">
    <Navbar/>
    <main className="flex-grow">
    <Outlet/>
    </main>
    </div>
  )
}

export default AppLayout