import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function ComingSoon() {
  const location = useLocation()
  const navigate = useNavigate()

  const title = location.pathname
    .replace('/', '')
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

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
          width: 420,
          background: 'var(--brand-surface)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-modal)',
          padding: 'var(--space-12) var(--space-8)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'var(--brand-secondary-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--space-6)',
            fontSize: 28,
          }}
        >
          ⏳
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--brand-heading)', margin: '0 0 var(--space-2)' }}>
          {title || 'Page'}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--brand-text-secondary)', margin: '0 0 var(--space-8)' }}>
          This page is coming soon. We're working on it!
        </p>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-6)',
            background: '#111',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-card)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={15} />
          Go Back
        </button>
      </div>
    </div>
  )
}
