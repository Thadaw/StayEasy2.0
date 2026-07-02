import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import HostLandingPage from './pages/HostLandingPage'
import HostPortalPage from './pages/HostPortalPage'
import TenantSetup from './pages/TenantSetup'
import CountryPage from './pages/CountryPage'
import HotelDetailPage from './pages/HotelDetailPage'
import ProfilePage from './pages/ProfilePage'
import ComingSoon from './pages/ComingSoon'
import ReservePage from './pages/ReservePage'
import RoomSelectPage from './pages/RoomSelectPage'
import BookingConfirmationPage from './pages/BookingConfirmationPage'
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/become-a-host" element={<HostLandingPage />} />
        <Route path="/host/login" element={<Login />} />
        <Route path="/host/signup" element={<Signup />} />
        <Route path="/host" element={<HostLandingPage />} />
        <Route path="/host/tenant-setup" element={<TenantSetup />} />
        <Route path="/host/portal" element={<HostPortalPage />} />
        <Route path="/country/:code" element={<CountryPage />} />
        <Route path="/hotel/:id" element={<HotelDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/notifications" element={<ComingSoon />} />
        <Route path="/account-settings" element={<ComingSoon />} />
        <Route path="/language-currency" element={<ComingSoon />} />
        <Route path="/reserve/:id" element={<ReservePage />} />
        <Route path="/select-room/:id" element={<RoomSelectPage />} />
        <Route path="/booking-confirmation" element={<BookingConfirmationPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
