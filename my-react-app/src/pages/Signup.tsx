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

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    nationality: '',
    password: '',
  })
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

    if (!form.fullName.trim()) { setError('Full name is required.'); return }
    if (!form.phone.trim()) { setError('Phone number is required.'); return }
    if (!EMAIL_RE.test(form.email)) { setError('Please enter a valid email address.'); return }
    if (!isHost && !form.nationality.trim()) { setError('Nationality is required.'); return }
    if (!PASSWORD_RE.test(form.password)) { setError('Password must be 8+ characters with a number and a special character.'); return }
    setLoading(true)
    try {
      const basePath = isHost ? '/auth/users' : '/auth/guests'
      const payload: Record<string, string> = {
        full_name: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      }
      if (!isHost) payload.nationality = form.nationality
      await api.post(`${basePath}/register`, payload)
      toast.success('Verification code sent to your email')
      setShowOtpStep(true)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setError('')
    setOtpLoading(true)
    try {
      const basePath = isHost ? '/auth/users' : '/auth/guests'
      await api.post(`${basePath}/verify-otp`, { email: form.email, otp })
      localStorage.setItem('authType', isHost ? 'host' : 'guest')
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
      const basePath = isHost ? '/auth/users' : '/auth/guests'
      await api.post(`${basePath}/resend-otp`, { email: form.email })
      toast.success('Verification code resent to your email')
      setResendTimer(30)
    } catch {
      toast.error('Failed to resend code. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#e8e8e8] flex items-center justify-center p-5 font-jakarta">
      <div className="w-[640px] h-[440px] bg-white rounded-2xl flex overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.13)]">
        <div className="custom-scroll w-1/2 bg-white flex-1 flex flex-col py-[22px] px-8 pb-7 order-1 shrink-0 overflow-y-auto">
          <div className="flex mb-1">
            <div
              onClick={() => navigate(isHost ? '/host/login' : '/login')}
              className="py-[3px] text-[11px] font-bold tracking-[0.8px] uppercase text-[#ccc] border-b-2 border-transparent mr-[18px] cursor-pointer"
            >
              Login
            </div>
            <div className="py-[3px] text-[11px] font-bold tracking-[0.8px] uppercase text-black border-b-2 border-black">
              Sign up
            </div>
          </div>

          {!showOtpStep ? (
            <>
              <div className="text-xl font-bold text-black mb-0.5">
                {isHost ? 'Become a Host' : 'Create account'}
              </div>
              <div className="text-xs text-[#999] mb-3">
                {isHost ? 'Start listing your property today' : 'Start finding your stay today'}
              </div>

              <div className="mb-[7px]">
                <label className="text-[11px] text-[#666] mb-[3px] block uppercase tracking-[0.4px]">
                  Full name
                </label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={e => setForm(prev => ({ ...prev, fullName: e.target.value }))}
                  onFocus={() => setPwFocused(false)}
                  placeholder="Enter your name"
                  autoComplete="off"
                  className="w-full border-none border-b-[1.5px] border-b-[#ddd] py-[7px] pr-0 text-sm text-black outline-none bg-transparent"
                />
              </div>

              <div className="relative mb-[7px]">
                <label className="text-[11px] text-[#666] mb-[3px] block uppercase tracking-[0.4px]">
                  Phone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                  onFocus={() => setPwFocused(false)}
                  placeholder="+977-98XXXXXXXX"
                  autoComplete="off"
                  className="w-full border-none border-b-[1.5px] border-b-[#ddd] py-[7px] pr-[26px] text-sm text-black outline-none bg-transparent"
                />
              </div>

              {!isHost && (
                <div className="relative mb-[7px]">
                  <label className="text-[11px] text-[#666] mb-[3px] block uppercase tracking-[0.4px]">
                    Nationality
                  </label>
                  <input
                    type="text"
                    value={form.nationality}
                    onChange={e => setForm(prev => ({ ...prev, nationality: e.target.value }))}
                    onFocus={() => setPwFocused(false)}
                    placeholder="e.g. Nepali"
                    autoComplete="off"
                    className="w-full border-none border-b-[1.5px] border-b-[#ddd] py-[7px] pr-[26px] text-sm text-black outline-none bg-transparent"
                  />
                </div>
              )}

              <div className="relative mb-[7px]">
                <label className="text-[11px] text-[#666] mb-[3px] block uppercase tracking-[0.4px]">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                  onFocus={() => setPwFocused(false)}
                  placeholder="Enter your email"
                  autoComplete="off"
                  className="w-full border-none border-b-[1.5px] border-b-[#ddd] py-[7px] pr-[26px] text-sm text-black outline-none bg-transparent"
                />
              </div>

              <div className="relative mb-[7px]">
                <label className="text-[11px] text-[#666] mb-[3px] block uppercase tracking-[0.4px]">
                  Password
                </label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                  onFocus={() => setPwFocused(true)}
                  onBlur={() => setPwFocused(false)}
                  placeholder="••••••••"
                  autoComplete="off"
                  className="w-full border-none border-b-[1.5px] border-b-[#ddd] py-[7px] pr-[26px] text-sm text-black outline-none bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  aria-label="Toggle password visibility"
                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[#bbb] text-[15px] p-0"
                >
                  {showPw ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
              </div>
              <div className="text-[11px] text-[#bbb] mt-0 mb-1.5">
                Must be 8+ characters with a number and a special character.
              </div>

              {error && (
                <p className="text-[#e94560] text-xs mb-1.5">{error}</p>
              )}

              <button
                onClick={handleSignup}
                disabled={loading}
                className="w-full py-[11px] bg-black text-white border-none rounded-lg text-sm font-semibold cursor-pointer mt-0 opacity-100 disabled:opacity-70 disabled:cursor-default"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>

              <div className="text-center mt-3 text-xs text-[#aaa]">
                Already have an account?{' '}
                <span
                  onClick={() => navigate(isHost ? '/host/login' : '/login')}
                  className="text-black font-semibold cursor-pointer"
                >
                  Log in
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="text-xl font-bold text-black mb-[3px]">
                Verify your email
              </div>
              <div className="text-xs text-[#999] mb-5">
                A verification code was sent to <strong>{form.email}</strong>
              </div>

              {!verified ? (
                <>
                  <div className="relative mb-5">
                    <label className="text-[11px] text-[#666] mb-[3px] block uppercase tracking-[0.4px]">
                      Verification code
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit code"
                      autoComplete="off"
                      className="w-full border-none border-b-[1.5px] border-b-[#ddd] py-[7px] pr-[26px] text-sm text-black outline-none bg-transparent tracking-[8px] font-semibold"
                    />
                  </div>

                  {error && (
                    <p className="text-[#e94560] text-xs mb-2.5">{error}</p>
                  )}

                  <button
                    onClick={handleVerifyOtp}
                    disabled={otpLoading || otp.length < 4}
                    className="w-full py-[11px] bg-black text-white border-none rounded-lg text-sm font-semibold cursor-pointer mt-0.5 opacity-100 disabled:opacity-70 disabled:cursor-default"
                  >
                    {otpLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>

                  <div className="text-center mt-1.5 text-xs text-[#aaa]">
                    Didn't receive the code?{' '}
                    <span
                      onClick={handleResendOtp}
                      className={`font-semibold ${(resendTimer > 0 || resendLoading) ? 'text-[#ccc] cursor-default' : 'text-black cursor-pointer'}`}
                    >
                      {resendLoading ? 'Sending...' : resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend'}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center mb-5">
                    <div className="text-[40px] mb-2.5">✓</div>
                    <p className="text-[13px] text-[#1E8449] font-semibold">
                      Email verified successfully!
                    </p>
                  </div>

                  <button
                    onClick={() => navigate(isHost ? '/host/login' : '/login')}
                    className="w-full py-[11px] bg-black text-white border-none rounded-lg text-sm font-semibold cursor-pointer mt-0.5"
                  >
                    Next
                  </button>
                </>
              )}
            </>
          )}
        </div>

        <div className="w-1/2 bg-[#dde0ee] order-2 shrink-0">
          <BuildingScene mode="signup" passwordFocused={pwFocused} passwordVisible={showPw} />
        </div>
      </div>
    </div>
  )
}
