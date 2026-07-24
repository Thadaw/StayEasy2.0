import { useState } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { AxiosError } from 'axios'
import { Eye, EyeOff } from 'lucide-react'
import BuildingScene from '../components/BuildingScene'
import api from '../api'
import { useAuth } from '../context/AuthContext'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const isHost = location.pathname.startsWith('/host') || searchParams.get('host') === 'true'
  const { login } = useAuth()
  const redirect = searchParams.get('redirect') || '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(true)
  const [pwFocused, setPwFocused] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)


  
  const [loginClicked, setLoginClicked] = useState(false)

  const fieldsReady = email.trim().length > 0 && password.trim().length > 0

  const handleLogin = async () => {
    setError('')
    setLoginClicked(true)
    setLoading(true)

    if (!email.trim()) { setError('Email is required.'); setLoginClicked(false); return }
    if (!password.trim()) { setError('Password is required.'); setLoginClicked(false); return }
    if (!EMAIL_RE.test(email)) { setError('Please enter a valid email address.'); setLoginClicked(false); return }

    const params = new URLSearchParams()
    params.append('grant_type', 'password')
    params.append('username', email)
    params.append('password', password)

    let userType: 'guest' | 'host' = 'guest'
    let res

    try {
      res = await api.post('/auth/guests/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      userType = 'guest'
    } catch {
      try {
        res = await api.post('/auth/users/login', params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
        userType = 'host'
      } catch (err) {
        const isAxiosError = err instanceof AxiosError
        const status = isAxiosError ? err.response?.status : undefined
        const detail = isAxiosError ? err.response?.data?.detail || '' : ''
        if (status === 404) {
          setError('No account found with this email. Please sign up first.')
        } else if (status === 403 || /verified|verify|activate/i.test(detail)) {
          setError('Account not verified. Please check your email for the verification code.')
        } else if (status === 401) {
          setError('Invalid email or password.')
        } else {
          setError(detail || 'Invalid email or password.')
        }
        setLoginClicked(false)
        setLoading(false)
        return
      }
    }

    await login(res!.data.access_token, userType)
    setTimeout(() => navigate(userType === 'host' ? '/become-a-host' : redirect), 1700)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--brand-secondary-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          width: 640,
          height: 440,
          background: 'var(--brand-surface)',
          borderRadius: 'var(--radius-xl)',
          display: 'flex',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-modal)',
        }}
      >
        {/* Animated scene panel */}
        <div style={{ width: '50%', background: 'var(--brand-secondary-surface)', order: 1, flexShrink: 0 }}>
          <BuildingScene
            mode="login"
            fieldsReady={fieldsReady}
            loginClicked={loginClicked}
            passwordFocused={pwFocused}
            passwordVisible={showPw}
          />
        </div>

        {/* Form panel */}
        <div
          style={{
            width: '50%',
            background: 'var(--brand-surface)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: 'var(--space-9) var(--space-8) var(--space-11)',
            order: 2,
            flexShrink: 0,
          }}
        >
          {/* Tabs */}
          <div style={{ display: 'flex', marginBottom: 'var(--space-2)' }}>
            <div
              style={{
                padding: 'var(--space-1) 0',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                color: 'var(--brand-heading)',
                borderBottom: '2px solid var(--brand-heading)',
                marginRight: 'var(--space-4)',
              }}
            >
              Login
            </div>
            <div
              onClick={() => navigate(isHost ? '/host/signup' : redirect ? `/signup?redirect=${encodeURIComponent(redirect)}` : '/signup')}
              style={{
                padding: 'var(--space-1) 0',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                color: '#ccc',
                borderBottom: '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              Sign up
            </div>
          </div>

          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--brand-heading)', marginBottom: 'var(--space-1)' }}>
            {isHost ? 'Welcome Back, Host' : 'Welcome back!'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--brand-text-secondary)', marginBottom: 'var(--space-4)' }}>
            {isHost ? 'Manage your properties' : 'Please enter your details'}
          </div>



          {/* Email */}
          <div style={{ position: 'relative', marginBottom: 'var(--space-3)' }}>
            <label
              style={{
                fontSize: 11,
                color: 'var(--brand-text-secondary)',
                marginBottom: 'var(--space-1)',
                display: 'block',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value.slice(0, 254))}
              onFocus={() => setPwFocused(false)}
              placeholder="Enter your email"
              autoComplete="off"
              maxLength={254}
              style={{
                width: '100%',
                border: 'none',
                borderBottom: '1.5px solid #ddd',
                padding: 'var(--space-2) var(--space-6) var(--space-2) 0',
                fontSize: 14,
                color: 'var(--brand-heading)',
                outline: 'none',
                background: 'transparent',
              }}
            />
          </div>

          {/* Password */}
          <div style={{ position: 'relative', marginBottom: 'var(--space-3)' }}>
            <label
              style={{
                fontSize: 11,
                color: 'var(--brand-text-secondary)',
                marginBottom: 'var(--space-1)',
                display: 'block',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}
            >
              Password
            </label>
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value.slice(0, 128))}
              onFocus={() => setPwFocused(true)}
              onBlur={() => setPwFocused(false)}
              placeholder="Set your password"
              autoComplete="off"
              maxLength={128}
              style={{
                width: '100%',
                border: 'none',
                borderBottom: '1.5px solid #ddd',
                padding: 'var(--space-2) var(--space-6) var(--space-2) 0',
                fontSize: 14,
                color: 'var(--brand-heading)',
                outline: 'none',
                background: 'transparent',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPw(p => !p)}
              aria-label="Toggle password visibility"
              style={{
                position: 'absolute',
                right: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--brand-text-secondary)',
                fontSize: 15,
                padding: 0,
              }}
            >
              {showPw ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
          </div>

          {error && (
            <p style={{ color: 'var(--brand-danger)', fontSize: 12, marginBottom: 'var(--space-3)' }}>{error}</p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: 'var(--space-3)',
              background: '#111',
              border: 'none',
              borderRadius: 'var(--radius-card)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'default' : 'pointer',
              marginTop: 'var(--space-1)',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Signing in...' : 'Log In'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 'var(--space-3)', fontSize: 12, color: 'var(--brand-text-secondary)' }}>
            Don't have an account?{' '}
            <span
              onClick={() => navigate(isHost ? '/host/signup' : redirect ? `/signup?redirect=${encodeURIComponent(redirect)}` : '/signup')}
              style={{ color: 'var(--brand-heading)', fontWeight: 600, cursor: 'pointer' }}
            >
              Sign up
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
