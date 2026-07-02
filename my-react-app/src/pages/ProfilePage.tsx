import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useBookings } from '../context/BookingContext'
import { useFavorites } from '../context/FavoritesContext'
import { useCoupons } from '../context/CouponContext'
import { Camera, Calendar, MapPin, Heart, Pencil, Check, X, Ticket, Clock, ArrowLeft } from 'lucide-react'
import { hotels } from '../data/hotels'

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const userType = localStorage.getItem('userType') || 'guest'

  useEffect(() => { window.scrollTo(0, 0) }, [])

  useEffect(() => { refreshUser() }, [])

  const firstName = user && (user.firstName || user.first_name)
  const lastName = user && (user.lastName || user.last_name)
  const initials = ((firstName || '')?.[0] || '') + ((lastName || '')?.[0] || '')
  const displayInitials = initials.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'

  if (userType === 'host') {
    return <HostProfileView firstName={firstName} lastName={lastName} displayInitials={displayInitials} user={user} />
  }

  return <GuestAccountView firstName={firstName} lastName={lastName} displayInitials={displayInitials} user={user} navigate={navigate} />
}

function HostProfileView({ firstName, lastName, displayInitials, user }: any) {
  const [showPhotoMenu, setShowPhotoMenu] = useState(false)
  const [photoData, setPhotoData] = useState<string>(() => localStorage.getItem('photo_host') || '')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const data = reader.result as string
      localStorage.setItem('photo_host', data)
      setPhotoData(data)
      setShowPhotoMenu(false)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ width: 480, background: '#fff', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.13)', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #dde0ee 0%, #c5cae9 100%)', padding: '40px 32px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            {photoData ? (
              <img src={photoData} alt="Profile" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            ) : (
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ backgroundColor: '#2E86AB' }}>
                {displayInitials}
              </div>
            )}
            <div
              onClick={() => setShowPhotoMenu(v => !v)}
              style={{ position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
              title="Change profile picture"
            >
              <Camera size={14} color="#555" />
            </div>

            {showPhotoMenu && (
              <>
                <div onClick={() => setShowPhotoMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
                <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 8, background: '#fff', borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.15)', zIndex: 50, minWidth: 200, overflow: 'hidden', padding: 4 }}>
                  <button onClick={() => fileInputRef.current?.click()} style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#111', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 8 }} onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    <Camera size={15} color="#555" /> Upload from device
                  </button>
                  <button onClick={() => cameraInputRef.current?.click()} style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#111', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 8 }} onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    <Camera size={15} color="#555" /> Take photo
                  </button>
                  {photoData && (
                    <button onClick={() => { localStorage.removeItem('photo_host'); setPhotoData(''); setShowPhotoMenu(false) }} style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#e94560', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 8 }} onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                      <X size={15} /> Remove photo
                    </button>
                  )}
                </div>
              </>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelected} style={{ display: 'none' }} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoSelected} style={{ display: 'none' }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: 0 }}>{firstName} {lastName}</h1>
          {user?.countryFlag && user?.country && (
            <p style={{ fontSize: 13, color: '#555', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>{user.countryFlag}</span><span>{user.country}</span>
            </p>
          )}
        </div>
        <div style={{ padding: '28px 32px 32px' }}>
          <InfoRow label="Email" value={user?.email || '—'} />
          <InfoRow label="Phone" value={user?.phone || '—'} />
          <InfoRow label="Member since" value={user?.joinedDate ? new Date(user.joinedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'} />
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: 2 }}>{label}</label>
      <p style={{ fontSize: 14, color: '#111', margin: 0 }}>{value}</p>
    </div>
  )
}

function GuestAccountView({ firstName, lastName, displayInitials, user, navigate }: any) {
  const { bookings, cancelBooking } = useBookings()
  const { favorites } = useFavorites()
  const { activeCoupons, usedCoupons } = useCoupons()
  const { updateProfile } = useAuth()

  const [editingAbout, setEditingAbout] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [editingPhone, setEditingPhone] = useState(false)
  const [aboutText, setAboutText] = useState(user?.aboutMe || '')
  const [editFirstName, setEditFirstName] = useState(firstName || '')
  const [editLastName, setEditLastName] = useState(lastName || '')
  const [editPhone, setEditPhone] = useState(user?.phone || '')
  const [showPhotoMenu, setShowPhotoMenu] = useState(false)
  const [saving, setSaving] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const photoKey = user?.id ? `photo_${user.id}` : 'photo_guest'
  const [photoData, setPhotoData] = useState<string>(() => localStorage.getItem(photoKey) || '')

  const handlePhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const data = reader.result as string
      localStorage.setItem(photoKey, data)
      setPhotoData(data)
      setShowPhotoMenu(false)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleSaveAbout = async () => {
    setSaving(true)
    await updateProfile({ aboutMe: aboutText })
    setEditingAbout(false)
    setSaving(false)
  }

  const handleSaveName = async () => {
    setSaving(true)
    const [first, ...rest] = editFirstName.trim().split(' ')
    const last = editLastName.trim() || rest.join(' ') || ''
    await updateProfile({ first_name: first || firstName, last_name: last || lastName })
    setEditingName(false)
    setSaving(false)
  }

  const handleSavePhone = async () => {
    setSaving(true)
    await updateProfile({ phone: editPhone })
    setEditingPhone(false)
    setSaving(false)
  }

  const displayFirstName = firstName
  const displayLastName = lastName

  const upcomingBookings = bookings.filter(b => b.status === 'upcoming')
  const pastBookings = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled')

  const favoriteHotels = hotels.filter(h => favorites.has(h.id))

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px 64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => navigate(-1)} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', color: '#111', display: 'flex', alignItems: 'center' }}><ArrowLeft size={20} /></button>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111', margin: 0 }}>Profile</h1>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 24 }}>
          <div style={{ padding: 32, display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ position: 'relative' }}>
                {photoData ? (
                  <img src={photoData} alt="Profile" className="w-20 h-20 rounded-full object-cover" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                ) : (
                  <div className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ backgroundColor: '#2E86AB' }}>
                    {displayInitials}
                  </div>
                )}
                <div
                  onClick={() => setShowPhotoMenu(v => !v)}
                  style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                  title="Change profile picture"
                >
                  <Camera size={12} color="#555" />
                </div>

                {showPhotoMenu && (
                  <>
                    <div onClick={() => setShowPhotoMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
                    <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 8, background: '#fff', borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.15)', zIndex: 50, minWidth: 200, overflow: 'hidden', padding: 4 }}>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#111', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 8 }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                      >
                        <Camera size={15} color="#555" /> Upload from device
                      </button>
                      <button
                        onClick={() => cameraInputRef.current?.click()}
                        style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#111', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 8 }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                      >
                        <Camera size={15} color="#555" /> Take photo
                      </button>
                      {photoData && (
                        <button
                          onClick={() => { localStorage.removeItem(photoKey); setPhotoData(''); setShowPhotoMenu(false) }}
                          style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#e94560', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 8 }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                          <X size={15} /> Remove photo
                        </button>
                      )}
                    </div>
                  </>
                )}

                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelected} style={{ display: 'none' }} />
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoSelected} style={{ display: 'none' }} />
              </div>
              <span style={{ fontSize: 12, color: '#888', marginTop: 6, fontWeight: 500 }}>Guest</span>
            </div>
            <div style={{ flex: 1 }}>
              {editingName ? (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                    <input
                      value={editFirstName}
                      onChange={e => setEditFirstName(e.target.value)}
                      placeholder="First name"
                      style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, color: '#111', fontFamily: "'Segoe UI', sans-serif", outline: 'none' }}
                    />
                    <input
                      value={editLastName}
                      onChange={e => setEditLastName(e.target.value)}
                      placeholder="Last name"
                      style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, color: '#111', fontFamily: "'Segoe UI', sans-serif", outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setEditingName(false); setEditFirstName(firstName); setEditLastName(lastName) }} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontSize: 12, fontWeight: 600, color: '#555', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleSaveName} disabled={saving} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: saving ? '#ccc' : '#2E86AB', fontSize: 12, fontWeight: 600, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer' }}>{saving ? 'Saving...' : 'Save name'}</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: 0 }}>{displayFirstName} {displayLastName}</h2>
                  <button onClick={() => { setEditFirstName(firstName); setEditLastName(lastName); setEditingName(true) }} style={{ padding: 4, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: '#999' }} title="Edit name">
                    <Pencil size={14} />
                  </button>
                </div>
              )}
              <div style={{ marginBottom: user?.countryFlag && user?.country ? 6 : 0 }}>
                <p style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '0.4px', margin: '0 0 1px' }}>Email</p>
                <p style={{ fontSize: 14, color: '#111', margin: 0 }}>{user?.email || '—'}</p>
              </div>
              <div style={{ marginBottom: user?.countryFlag && user?.country ? 6 : 0 }}>
                <p style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '0.4px', margin: '0 0 1px' }}>Phone</p>
                {editingPhone ? (
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        value={editPhone}
                        onChange={e => setEditPhone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, color: '#111', fontFamily: "'Segoe UI', sans-serif", outline: 'none' }}
                      />
                      <button onClick={handleSavePhone} disabled={saving} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: saving ? '#ccc' : '#2E86AB', fontSize: 12, fontWeight: 600, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer' }}>{saving ? '...' : <Check size={14} />}</button>
                      <button onClick={() => { setEditingPhone(false); setEditPhone(user?.phone || '') }} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontSize: 12, fontWeight: 600, color: '#555', cursor: 'pointer' }}><X size={14} /></button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <p style={{ fontSize: 14, color: '#111', margin: 0 }}>{user?.phone || <span style={{ color: '#999', fontStyle: 'italic' }}>Not provided</span>}</p>
                    <button onClick={() => { setEditPhone(user?.phone || ''); setEditingPhone(true) }} style={{ padding: 2, borderRadius: 4, border: 'none', background: 'none', cursor: 'pointer', color: '#999', display: 'flex' }} title="Edit phone">
                      <Pencil size={12} />
                    </button>
                  </div>
                )}
              </div>
              {user?.countryFlag && user?.country && (
                <p style={{ fontSize: 13, color: '#777', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>{user.countryFlag}</span><span>{user.country}</span>
                  {user?.joinedDate && (
                    <span style={{ color: '#999', marginLeft: 8 }}>· Member since {new Date(user.joinedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        <SectionCard title="About Me" icon={<Pencil size={16} />}>
          {editingAbout ? (
            <div>
              <textarea
                value={aboutText}
                onChange={e => setAboutText(e.target.value)}
                placeholder="Tell guests about yourself..."
                maxLength={500}
                style={{ width: '100%', minHeight: 100, padding: 12, borderRadius: 8, border: '1px solid #ddd', fontSize: 14, color: '#111', fontFamily: "'Segoe UI', sans-serif", resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <span style={{ fontSize: 12, color: '#999' }}>{aboutText.length}/500</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setEditingAbout(false); setAboutText(user?.aboutMe || '') }} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontSize: 13, fontWeight: 600, color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <X size={14} /> Cancel
                  </button>
                  <button onClick={handleSaveAbout} disabled={saving} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: saving ? '#ccc' : '#2E86AB', fontSize: 13, fontWeight: 600, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Check size={14} /> {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {user?.aboutMe ? (
                <p style={{ fontSize: 14, color: '#333', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{user.aboutMe}</p>
              ) : (
                <p style={{ fontSize: 14, color: '#999', margin: 0, fontStyle: 'italic' }}>No bio added yet. Share a bit about yourself.</p>
              )}
              <button onClick={() => { setAboutText(user?.aboutMe || ''); setEditingAbout(true) }} style={{ marginTop: 12, padding: '6px 14px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontSize: 13, fontWeight: 600, color: '#555', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Pencil size={13} /> {user?.aboutMe ? 'Edit' : 'Add bio'}
              </button>
            </div>
          )}
        </SectionCard>

        {favoriteHotels.length > 0 && (
          <SectionCard title="Favourite Properties" icon={<Heart size={16} color="#e94560" />}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {favoriteHotels.slice(0, 4).map(hotel => (
                <div
                  key={hotel.id}
                  onClick={() => navigate(`/hotel/${hotel.id}`)}
                  style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #eee', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                >
                  <img src={hotel.imageUrl} alt={hotel.name} style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
                  <div style={{ padding: '8px 10px 10px' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#111', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{hotel.name}</p>
                    <p style={{ fontSize: 11, color: '#777', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{hotel.city}, {hotel.country}</p>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#2E86AB', margin: '4px 0 0' }}>${hotel.price} <span style={{ fontWeight: 400, color: '#999', fontSize: 11 }}>night</span></p>
                  </div>
                </div>
              ))}
              {favoriteHotels.length > 4 && (
                <div onClick={() => navigate('/my-wishlist')} style={{ borderRadius: 12, border: '2px dashed #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: 120 }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#2E86AB'; e.currentTarget.style.color = '#2E86AB' }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.color = '#999' }}>
                  <div style={{ textAlign: 'center', color: 'inherit' }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>+{favoriteHotels.length - 4} more</span>
                    <p style={{ fontSize: 11, margin: '4px 0 0', color: 'inherit' }}>View all</p>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        <SectionCard title="My Bookings" icon={<Calendar size={16} />}>
          <div id="bookings" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#2e7d32' }} />
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: 0 }}>Active Reservations</h3>
                <span style={{ fontSize: 12, color: '#999' }}>({upcomingBookings.length})</span>
              </div>
              {upcomingBookings.length === 0 ? (
                <div style={{ background: '#f9f9f9', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                  <Calendar size={28} color="#ddd" style={{ marginBottom: 8 }} />
                  <p style={{ fontSize: 13, color: '#999', margin: 0 }}>No active reservations</p>
                  <button onClick={() => navigate('/')} style={{ marginTop: 8, padding: '6px 16px', borderRadius: 8, border: 'none', background: '#111', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Browse stays</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {upcomingBookings.map(b => (
                    <div key={b.id} style={{ borderRadius: 12, border: '1px solid #eee', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', gap: 10, padding: 10 }}>
                        <img src={b.hotelImage} alt={b.hotelName} style={{ width: 70, height: 70, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ fontSize: 13, fontWeight: 600, color: '#111', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.hotelName}</h4>
                          <p style={{ fontSize: 11, color: '#777', margin: '2px 0', display: 'flex', alignItems: 'center', gap: 2 }}>
                            <MapPin size={10} /> {b.hotelCity}, {b.hotelCountry}
                          </p>
                          <p style={{ fontSize: 11, color: '#555', margin: '2px 0' }}>
                            {new Date(b.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(b.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>${b.totalPrice.toFixed(2)}</span>
                            <button onClick={() => { if (window.confirm('Cancel this booking?')) cancelBooking(b.id) }} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e94560', background: 'none', color: '#e94560', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#999' }} />
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: 0 }}>Past Bookings</h3>
                <span style={{ fontSize: 12, color: '#999' }}>({pastBookings.length})</span>
              </div>
              {pastBookings.length === 0 ? (
                <div style={{ background: '#f9f9f9', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                  <Clock size={28} color="#ddd" style={{ marginBottom: 8 }} />
                  <p style={{ fontSize: 13, color: '#999', margin: 0 }}>No past bookings yet</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div
                    style={{
                      maxHeight: pastBookings.length > 4 ? 360 : 'none',
                      overflowY: pastBookings.length > 4 ? 'auto' : 'visible',
                      overflowX: 'hidden',
                      paddingRight: 4,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#cbd5e1 transparent',
                      scrollBehavior: 'smooth'
                    }}
                  >
                    {pastBookings.map(b => (
                      <div key={b.id} style={{ borderRadius: 12, border: '1px solid #eee', opacity: 0.65, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', gap: 10, padding: 10 }}>
                          <img src={b.hotelImage} alt={b.hotelName} style={{ width: 70, height: 70, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <h4 style={{ fontSize: 13, fontWeight: 600, color: '#111', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.hotelName}</h4>
                              <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, backgroundColor: b.status === 'completed' ? '#e8f5e9' : '#fce4ec', color: b.status === 'completed' ? '#2e7d32' : '#c62828', whiteSpace: 'nowrap' }}>{b.status === 'completed' ? 'Completed' : 'Cancelled'}</span>
                            </div>
                            <p style={{ fontSize: 11, color: '#777', margin: '2px 0' }}>
                              {new Date(b.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(b.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: '4px 0 0' }}>${b.totalPrice.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {pastBookings.length > 4 && (
                    <p style={{ fontSize: 11, color: '#999', margin: 0, textAlign: 'center' }}>Scroll to see more past bookings</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="My Coupons" icon={<Ticket size={16} />}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#2E86AB' }} />
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: 0 }}>Active Coupons</h3>
                <span style={{ fontSize: 12, color: '#999' }}>({activeCoupons.length})</span>
              </div>
              {activeCoupons.length === 0 ? (
                <div style={{ background: '#f9f9f9', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                  <Ticket size={28} color="#ddd" style={{ marginBottom: 8 }} />
                  <p style={{ fontSize: 13, color: '#999', margin: 0 }}>No active coupons</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {activeCoupons.map(c => (
                    <CouponCard key={c.id} coupon={c} />
                  ))}
                </div>
              )}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#999' }} />
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: 0 }}>Used Coupons</h3>
                <span style={{ fontSize: 12, color: '#999' }}>({usedCoupons.length})</span>
              </div>
              {usedCoupons.length === 0 ? (
                <div style={{ background: '#f9f9f9', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                  <Ticket size={28} color="#ddd" style={{ marginBottom: 8 }} />
                  <p style={{ fontSize: 13, color: '#999', margin: 0 }}>No used coupons yet</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {usedCoupons.map(c => (
                    <CouponCard key={c.id} coupon={c} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: 24 }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon}
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111', margin: 0 }}>{title}</h2>
      </div>
      <div style={{ padding: 20 }}>
        {children}
      </div>
    </div>
  )
}

function CouponCard({ coupon }: { coupon: any }) {
  const isActive = coupon.status === 'active'
  const daysLeft = isActive ? Math.ceil((new Date(coupon.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0

  return (
    <div style={{
      borderRadius: 12,
      border: `1px solid ${isActive ? '#e0f2e0' : '#eee'}`,
      background: isActive ? '#fafffa' : '#fafafa',
      overflow: 'hidden',
      padding: 12,
      opacity: isActive ? 1 : 0.7,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: isActive ? '#2E86AB' : '#ccc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Ticket size={18} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: isActive ? '#2E86AB' : '#888', letterSpacing: '0.5px' }}>{coupon.code}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? '#2e7d32' : '#999' }}>
              {coupon.discountType === 'percentage' ? `${coupon.discount}% OFF` : `$${coupon.discount} OFF`}
            </span>
          </div>
          <p style={{ fontSize: 11, color: '#777', margin: '2px 0' }}>{coupon.description}</p>
          {isActive ? (
            <p style={{ fontSize: 10, color: daysLeft <= 3 ? '#e94560' : '#999', margin: '4px 0 0' }}>
              {daysLeft > 0 ? `${daysLeft} day${daysLeft > 1 ? 's' : ''} left` : 'Expiring today'}
            </p>
          ) : (
            <p style={{ fontSize: 10, color: '#999', margin: '4px 0 0' }}>
              Used {coupon.usedAt ? new Date(coupon.usedAt).toLocaleDateString() : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
