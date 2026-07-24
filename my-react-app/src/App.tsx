import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { PageLoader } from './components/PageLoader'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ScrollRestoration } from './components/ScrollRestoration'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const CountryPage = lazy(() => import('./pages/CountryPage'))
const PropertyDetailPage = lazy(() => import('./pages/PropertyDetailPage'))
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage'))
const ComingSoon = lazy(() => import('./pages/ComingSoon'))
const ReservePage = lazy(() => import('./pages/ReservePage'))
const BookingConfirmationPage = lazy(() => import('./pages/BookingConfirmationPage'))
const ProfileLayout = lazy(() => import('./pages/profile/ProfileLayout'))
const AboutMe = lazy(() => import('./pages/profile/AboutMe'))
const Favourites = lazy(() => import('./pages/profile/Favourites'))
const Bookings = lazy(() => import('./pages/profile/Bookings'))
const Coupons = lazy(() => import('./pages/profile/Coupons'))
const Reviews = lazy(() => import('./pages/profile/Reviews'))
const Notifications = lazy(() => import('./pages/profile/Notifications'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function App() {
  return (
    <BrowserRouter>
      <ScrollRestoration />
      <Suspense fallback={<PageLoader />}>
        <ErrorBoundary>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/country/:code" element={<CountryPage />} />
          <Route path="/hotel/:id" element={<PropertyDetailPage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/profile" element={<ProtectedRoute><ProfileLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="about" replace />} />
            <Route path="about" element={<AboutMe />} />
            <Route path="favourites" element={<Favourites />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="coupons" element={<Coupons />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>

          <Route path="/notifications" element={<ComingSoon />} />
          <Route path="/account-settings" element={<ComingSoon />} />
          <Route path="/language-currency" element={<ComingSoon />} />
          <Route path="/reserve/:id" element={<ProtectedRoute><ReservePage /></ProtectedRoute>} />
          <Route path="/booking-confirmation" element={<ProtectedRoute><BookingConfirmationPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </ErrorBoundary>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
