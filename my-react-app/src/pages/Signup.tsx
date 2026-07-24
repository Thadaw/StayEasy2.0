import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { AxiosError } from 'axios'
import { Eye, EyeOff } from 'lucide-react'
import BuildingScene from '../components/BuildingScene'
import api from '../api'
import toast from 'react-hot-toast'

const PASSWORD_RE = /^(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function extractError(err: unknown, fallback = 'Could not create account. Please check your details and try again.'): string {
  if (err instanceof AxiosError && err.response?.data) {
    const data = err.response.data as Record<string, unknown>
    if (typeof data.detail === 'string') return data.detail
    if (typeof data.message === 'string') return data.message
    if (Array.isArray(data.errors) && data.errors[0]?.msg) return data.errors[0].msg
  }
  return fallback
}
export default function Signup() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const isHost = location.pathname.startsWith('/host') || searchParams.get('host') === 'true'

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(true)
  const [pwFocused, setPwFocused] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [showOtpStep, setShowOtpStep] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [verified, setVerified] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)

  useEffect(() => {
    if (resendTimer <= 0) return
    const id = setInterval(() => {
      setResendTimer(t => t - 1)
    }, 1000)
    return () => clearInterval(id)
  }, [resendTimer])

  const handleSignup = async () => {
    setError('')

    if (!fullName.trim()) { setError('Full name is required.'); return }
    if (!phone.trim()) { setError('Phone number is required.'); return }
    if (!EMAIL_RE.test(email)) { setError('Please enter a valid email address.'); return }
    if (!PASSWORD_RE.test(password)) { setError('Password must be 8+ characters with a number and a special character.'); return }
    setLoading(true)
    try {
      const endpoint = isHost ? 'auth/users/register' : 'auth/guests/register'
      await api.post(endpoint, {
        full_name: fullName,
        email,
        phone,
        password,
      })
      toast.success('Verification code sent to your email')
      setShowOtpStep(true)
    } catch (err) {
      const isAxiosError = err instanceof AxiosError
      const status = isAxiosError ? err.response?.status : undefined
      const detail = isAxiosError
        ? err.response?.data?.detail || err.response?.data?.message || ''
        : ''
      if (
        status === 409 ||
        /already.*(?:exist|registered|taken|used)|(?:exist|registered|taken|used).*already/i.test(detail)
      ) {
        setError('This email is already registered. Please log in instead.')
      } else {
        setError('Could not create account. Please check your details and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setError('')
    setOtpLoading(true)
    try {
      const endpoint = isHost ? '/auth/users/verify-otp' : '/auth/guests/verify-otp'
      await api.post(endpoint, { email, otp })
      setVerified(true)
      toast.success('Account verified successfully!')
    } catch (err) {
      setError(extractError(err, 'Invalid verification code. Please try again.'))
    } finally {
      setOtpLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setError('')
    setResendLoading(true)
    try {
      const endpoint = isHost ? 'auth/users/resend-otp' : 'auth/guests/resend-otp'
      await api.post(endpoint, { email })
      toast.success('Verification code resent to your email')
      setResendTimer(30)
    } catch {
      toast.error('Failed to resend code. Please try again.')
    } finally {
      setResendLoading(false)
    }
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
        {/* Form panel — on the LEFT for sign up */}
        <div
          className="custom-scroll"
          style={{
            width: '50%',
            background: 'var(--brand-surface)',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: 'var(--space-6) var(--space-8) var(--space-7)',
            order: 1,
            flexShrink: 0,
            overflowY: 'auto',
          }}
        >
          {/* Tabs */}
          <div style={{ display: 'flex', marginBottom: 'var(--space-1)' }}>
            <div
              onClick={() => navigate(isHost ? '/host/login' : '/login')}
              style={{
                padding: 'var(--space-1) 0',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                color: '#ccc',
                borderBottom: '2px solid transparent',
                marginRight: 'var(--space-4)',
                cursor: 'pointer',
              }}
            >
              Login
            </div>
            <div
              style={{
                padding: 'var(--space-1) 0',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                color: 'var(--brand-heading)',
                borderBottom: '2px solid var(--brand-heading)',
              }}
            >
              Sign up
            </div>
          </div>

          {!showOtpStep ? (
            <>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--brand-heading)', marginBottom: 'var(--space-1)' }}>
                {isHost ? 'Become a Host' : 'Create account'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--brand-text-secondary)', marginBottom: 'var(--space-6)' }}>
                {isHost ? 'Start listing your property today' : 'Start finding your stay today'}
              </div>

              {/* Full name */}
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <label
                  style={{
                    fontSize: 11, color: 'var(--brand-text-secondary)', marginBottom: 'var(--space-1)', display: 'block',
                    textTransform: 'uppercase', letterSpacing: '0.4px',
                  }}
                >
                  Full name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value.slice(0, 100))}
                  onFocus={() => setPwFocused(false)}
                  placeholder="Enter your name"
                  autoComplete="off"
                  maxLength={100}
                  style={{
                    width: '100%', border: 'none', borderBottom: '1.5px solid #ddd',
                    padding: 'var(--space-2) var(--space-1) var(--space-2) 0', fontSize: 14, color: 'var(--brand-heading)', outline: 'none', background: 'transparent',
                  }}
                />
              </div>

              {/* Phone */}
              <div style={{ position: 'relative', marginBottom: 'var(--space-3)' }}>
                <label
                  style={{
                    fontSize: 11, color: 'var(--brand-text-secondary)', marginBottom: 'var(--space-1)', display: 'block',
                    textTransform: 'uppercase', letterSpacing: '0.4px',
                  }}
                >
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value.slice(0, 20))}
                  onFocus={() => setPwFocused(false)}
                  placeholder="+977-98XXXXXXXX"
                  autoComplete="off"
                  maxLength={20}
                  style={{
                    width: '100%', border: 'none', borderBottom: '1.5px solid #ddd',
                    padding: 'var(--space-2) var(--space-6) var(--space-2) 0', fontSize: 14, color: 'var(--brand-heading)', outline: 'none', background: 'transparent',
                  }}
                />
              </div>

              {/* Email */}
              <div style={{ position: 'relative', marginBottom: 'var(--space-3)' }}>
                <label
                  style={{
                    fontSize: 11, color: 'var(--brand-text-secondary)', marginBottom: 'var(--space-1)', display: 'block',
                    textTransform: 'uppercase', letterSpacing: '0.4px',
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
                    width: '100%', border: 'none', borderBottom: '1.5px solid #ddd',
                    padding: 'var(--space-2) var(--space-6) var(--space-2) 0', fontSize: 14, color: 'var(--brand-heading)', outline: 'none', background: 'transparent',
                  }}
                />
              </div>

              {/* Password */}
              <div style={{ position: 'relative', marginBottom: 'var(--space-3)' }}>
                <label
                  style={{
                    fontSize: 11, color: 'var(--brand-text-secondary)', marginBottom: 'var(--space-1)', display: 'block',
                    textTransform: 'uppercase', letterSpacing: '0.4px',
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
                  placeholder="••••••••"
                  autoComplete="off"
                  maxLength={128}
                  style={{
                    width: '100%', border: 'none', borderBottom: '1.5px solid #ddd',
                        padding: 'var(--space-2) var(--space-6) var(--space-2) 0', fontSize: 14, color: 'var(--brand-heading)', outline: 'none', background: 'transparent',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  aria-label="Toggle password visibility"
                  style={{
                    position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-text-secondary)', fontSize: 15, padding: 0,
                  }}
                >
                  {showPw ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
              </div>

              <div style={{ fontSize: 11, color: 'var(--brand-text-secondary)', marginTop: -8, marginBottom: 'var(--space-3)' }}>
                Must be 8+ characters with a number and a special character.
              </div>

              {error && (
                <p style={{ color: 'var(--brand-danger)', fontSize: 12, marginBottom: 'var(--space-2)' }}>{error}</p>
              )}

              <button
                onClick={handleSignup}
                disabled={loading}
                style={{
                  width: '100%', padding: 'var(--space-3)', background: '#111', border: 'none', borderRadius: 'var(--radius-card)',
                  color: '#fff', fontSize: 14, fontWeight: 600, cursor: loading ? 'default' : 'pointer',
                  marginTop: 'var(--space-1)', opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>

                  <div style={{ textAlign: 'center', marginTop: 'var(--space-3)', fontSize: 12, color: 'var(--brand-text-secondary)' }}>
                Already have an account?{' '}
                <span
                  onClick={() => navigate(isHost ? '/host/login' : '/login')}
                  style={{ color: 'var(--brand-heading)', fontWeight: 600, cursor: 'pointer' }}
                >
                  Log in
                </span>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--brand-heading)', marginBottom: 'var(--space-1)' }}>
                Verify your email
              </div>
              <div style={{ fontSize: 12, color: 'var(--brand-text-secondary)', marginBottom: 'var(--space-6)' }}>
                A verification code was sent to <strong>{email}</strong>
              </div>

              {!verified ? (
                <>
                  {/* OTP input */}
                  <div style={{ position: 'relative', marginBottom: 'var(--space-6)' }}>
                    <label
                      style={{
                        fontSize: 11, color: 'var(--brand-text-secondary)', marginBottom: 'var(--space-1)', display: 'block',
                        textTransform: 'uppercase', letterSpacing: '0.4px',
                      }}
                    >
                      Verification code
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit code"
                      autoComplete="off"
                      style={{
                        width: '100%', border: 'none', borderBottom: '1.5px solid #ddd',
                    padding: 'var(--space-2) var(--space-6) var(--space-2) 0', fontSize: 14, color: 'var(--brand-heading)', outline: 'none', background: 'transparent',
                        letterSpacing: 8,
                        fontWeight: 600,
                      }}
                    />
                  </div>

                  {error && (
                    <p style={{ color: 'var(--brand-danger)', fontSize: 12, marginBottom: 'var(--space-3)' }}>{error}</p>
                  )}

                  <button
                    onClick={handleVerifyOtp}
                    disabled={otpLoading || otp.length < 4}
                    style={{
                      width: '100%', padding: 'var(--space-3)', background: '#111', border: 'none', borderRadius: 'var(--radius-card)',
                      color: '#fff', fontSize: 14, fontWeight: 600, cursor: otpLoading ? 'default' : 'pointer',
                      marginTop: 'var(--space-1)', opacity: otpLoading || otp.length < 4 ? 0.7 : 1,
                    }}
                  >
                    {otpLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>

              <div style={{ textAlign: 'center', marginTop: 'var(--space-3)', fontSize: 12, color: 'var(--brand-text-secondary)' }}>
                    Didn't receive the code?{' '}
                    <span
                      onClick={handleResendOtp}
                      style={{
                        color: resendTimer > 0 || resendLoading ? '#ccc' : 'var(--brand-heading)',
                        fontWeight: 600,
                        cursor: resendTimer > 0 || resendLoading ? 'default' : 'pointer',
                      }}
                    >
                      {resendLoading ? 'Sending...' : resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend'}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                    <div style={{ fontSize: 40, marginBottom: 'var(--space-3)' }}>✓</div>
                    <p style={{ fontSize: 13, color: 'var(--brand-success)', fontWeight: 600 }}>
                      Email verified successfully!
                    </p>
                  </div>

                  <button
                    onClick={() => navigate(isHost ? '/host/login' : '/login')}
                    style={{
                      width: '100%', padding: 'var(--space-3)', background: '#111', border: 'none', borderRadius: 'var(--radius-card)',
                      color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                      marginTop: 'var(--space-1)',
                    }}
                  >
                    Next
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* Animated scene panel — on the RIGHT for sign up */}
        <div style={{ width: '50%', background: 'var(--brand-secondary-surface)', order: 2, flexShrink: 0 }}>
          <BuildingScene mode="signup" passwordFocused={pwFocused} passwordVisible={showPw} />
        </div>
      </div>
    </div>
  )
}
