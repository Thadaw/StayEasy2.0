import { useState } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { AxiosError } from 'axios'
import { Eye, EyeOff } from 'lucide-react'
import BuildingScene from '../components/BuildingScene'
import api from '../api'
import { useAuth } from '../context/AuthContext'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function extractError(err: unknown): string {
  if (err instanceof AxiosError && err.response?.data) {
    const data = err.response.data as Record<string, unknown>
    if (typeof data.detail === 'string') return data.detail
    if (typeof data.message === 'string') return data.message
  }
  return 'Invalid email or password.'
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { login: authLogin } = useAuth()
  const isHost = location.pathname.startsWith('/host') || searchParams.get('host') === 'true'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(true)
  const [pwFocused, setPwFocused] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loginClicked, setLoginClicked] = useState(false)

  const fieldsReady = email.trim().length > 0 && password.trim().length > 0

  const handleLogin = async () => {
    setError('')
    setLoginClicked(true)

    if (!email.trim()) { setError('Email is required.'); setLoginClicked(false); return }
    if (!password.trim()) { setError('Password is required.'); setLoginClicked(false); return }
    if (!EMAIL_RE.test(email)) { setError('Please enter a valid email address.'); setLoginClicked(false); return }

    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('grant_type', 'password')
      params.append('username', email)
      params.append('password', password)
      const res = await api.post('/auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      localStorage.setItem('token', res.data.access_token)
      await authLogin(res.data.access_token)
      const redirectTo = searchParams.get('redirect')
      setTimeout(() => navigate(redirectTo || '/'), 1500)
    } catch (err) {
      setError(extractError(err))
      setLoginClicked(false)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#e8e8e8] flex items-center justify-center p-5 font-jakarta">
      <div className="w-[640px] h-[440px] bg-white rounded-2xl flex overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.13)]">
        <div className="w-1/2 bg-[#dde0ee] order-1 shrink-0">
          <BuildingScene
            mode="login"
            fieldsReady={fieldsReady}
            loginClicked={loginClicked}
            passwordFocused={pwFocused}
            passwordVisible={showPw}
          />
        </div>

        <div className="w-1/2 bg-white flex flex-col justify-center py-9 px-8 order-2 shrink-0">
          <div className="flex mb-2">
            <div className="py-[3px] text-[11px] font-bold tracking-[0.8px] uppercase text-black border-b-2 border-black mr-[18px]">
              Login
            </div>
            <div
              onClick={() => navigate(isHost ? '/host/signup' : '/signup')}
              className="py-[3px] text-[11px] font-bold tracking-[0.8px] uppercase text-[#ccc] border-b-2 border-transparent cursor-pointer"
            >
              Sign up
            </div>
          </div>

          <div className="text-xl font-bold text-black mb-[3px]">
            {isHost ? 'Welcome Back, Host' : 'Welcome back!'}
          </div>
          <div className="text-xs text-[#999] mb-5">
            {isHost ? 'Manage your properties' : 'Please enter your details'}
          </div>

          <div className="relative mb-[13px]">
            <label className="text-[11px] text-[#666] mb-[3px] block uppercase tracking-[0.4px]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setPwFocused(false)}
              placeholder="Enter your email"
              autoComplete="off"
              className="w-full border-none border-b-[1.5px] border-b-[#ddd] py-[7px] pr-[26px] text-sm text-black outline-none bg-transparent"
            />
          </div>

          <div className="relative mb-[13px]">
            <label className="text-[11px] text-[#666] mb-[3px] block uppercase tracking-[0.4px]">
              Password
            </label>
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setPwFocused(true)}
              onBlur={() => setPwFocused(false)}
              placeholder="Set your password"
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

          <div className="flex items-center gap-1.5 mb-[13px]">
            <input
              type="checkbox"
              id="remember"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              className="w-3 h-3 accent-black"
            />
            <label htmlFor="remember" className="text-[11px] text-[#999]">
              Remember for 30 days
            </label>
            <span className="text-[11px] text-[#bbb] cursor-pointer ml-auto">
              Forgot password?
            </span>
          </div>

          {error && (
            <p className="text-[#e94560] text-xs mb-2.5">{error}</p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-[11px] bg-black text-white border-none rounded-lg text-sm font-semibold cursor-pointer mt-0.5 opacity-100 disabled:opacity-70 disabled:cursor-default"
          >
            {loading ? 'Signing in...' : 'Log In'}
          </button>

          <div className="text-center mt-[11px] text-xs text-[#aaa]">
            Don't have an account?{' '}
            <span
              onClick={() => navigate(isHost ? '/host/signup' : '/signup')}
              className="text-black font-semibold cursor-pointer"
            >
              Sign up
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
