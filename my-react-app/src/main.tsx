import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { FavoritesProvider } from './context/FavoritesContext'
import { BookingProvider } from './context/BookingContext'
import { CouponProvider } from './context/CouponContext'
import './i18n'
import './index.css'
import App from './App'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FavoritesProvider>
          <BookingProvider>
            <CouponProvider>
            <App />
            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          </CouponProvider>
          </BookingProvider>
        </FavoritesProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
