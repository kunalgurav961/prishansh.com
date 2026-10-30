import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router'
import { useAuth0 } from '@auth0/auth0-react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Camera,
  CheckCircle2,
  ClipboardList,
  LoaderCircle,
  PackageOpen,
  Pencil,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react'
import {
  accountApiConfigurationMessage,
  getMyOrders,
  isAccountApiConfigured,
  updateAccountProfile,
  uploadAccountAvatar,
} from '../../services/accountService'
import { profileUpdated } from '../../store/userSlice'
import { formatPrice } from '../../utils/formatPrice'

const MAX_AVATAR_BYTES = 5 * 1024 * 1024
const acceptedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

const getDisplayName = (profile, user) => profile?.name || profile?.fullName || user?.name || user?.nickname || 'Customer'
const getEmail = (profile, user) => profile?.email || user?.email || 'Email unavailable'
const getMobile = (profile) => profile?.mobile || profile?.phone || profile?.phoneNumber || ''
const getAvatar = (profile, user) => profile?.avatarUrl || profile?.avatar || profile?.picture || user?.picture || ''

const initialValues = (profile, user) => ({
  name: getDisplayName(profile, user),
  mobile: getMobile(profile),
})

const getInitials = (name) => name
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join('')
  .toUpperCase() || 'PB'

const formatDate = (value) => {
  const date = value ? new Date(value) : null

  return date && !Number.isNaN(date.valueOf())
    ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
    : 'Date unavailable'
}

const getOrderId = (order) => order.orderNumber || order.orderId || order.id || order._id || 'Order'
const getOrderDate = (order) => order.createdAt || order.orderDate || order.date
const getOrderTotal = (order) => order.totalAmount ?? order.total ?? order.grandTotal ?? order.amount
const getOrderStatus = (order) => order.status || order.orderStatus || 'Processing'
const getOrderItems = (order) => order.items || order.products || order.lineItems || []
const getItemName = (item) => item.name || item.productName || item.product?.name || 'Product'
const getItemImage = (item) => item.image || item.imageUrl || item.thumbnail || item.product?.image || item.product?.imageUrl

const statusClass = (status) => {
  const normalized = String(status).toLowerCase()

  if (normalized.includes('deliver') || normalized.includes('complete')) return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
  if (normalized.includes('cancel') || normalized.includes('fail')) return 'bg-rose-50 text-rose-700 ring-rose-600/20'
  if (normalized.includes('ship') || normalized.includes('dispatch')) return 'bg-sky-50 text-sky-700 ring-sky-600/20'
  return 'bg-amber-50 text-amber-800 ring-amber-600/20'
}

const Avatar = ({ name, source, size = 'large' }) => {
  const dimensions = size === 'large' ? 'h-24 w-24 text-2xl' : 'h-11 w-11 text-sm'

  if (source) {
    return <img src={source} alt="" className={`${dimensions} shrink-0 rounded-full border-4 border-white object-cover shadow-sm`} />
  }

  return (
    <span className={`${dimensions} flex shrink-0 items-center justify-center rounded-full bg-stone-900 font-semibold tracking-wide text-white`}>
      {getInitials(name)}
    </span>
  )
}

const AccountNav = () => {
  const baseClass = 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors'
  const activeClass = 'bg-violet-50 text-[#5433eb]'
  const idleClass = 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'

  return (
    <nav aria-label="Account navigation" className="flex gap-2 overflow-x-auto border-b border-stone-200 pb-3 lg:flex-col lg:border-b-0 lg:pb-0">
      <NavLink end to="/account/profile" className={({ isActive }) => `${baseClass} ${isActive ? activeClass : idleClass}`}>
        <UserRound size={18} />
        Profile
      </NavLink>
      <NavLink to="/account/orders" className={({ isActive }) => `${baseClass} ${isActive ? activeClass : idleClass}`}>
        <ClipboardList size={18} />
        My Orders
      </NavLink>
      <NavLink to="/account/profile/edit" className={({ isActive }) => `${baseClass} ${isActive ? activeClass : idleClass}`}>
        <Pencil size={18} />
        Edit Profile
      </NavLink>
    </nav>
  )
}

const ProfileOverview = ({ profile, user, profileLoading, profileError }) => {
  const name = getDisplayName(profile, user)
  const email = getEmail(profile, user)
  const mobile = getMobile(profile)

  return (
    <section aria-labelledby="profile-overview-title">
      <div className="flex flex-col gap-5 rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="flex items-center gap-4">
          <Avatar name={name} source={getAvatar(profile, user)} />
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] text-[#5433eb]">MY ACCOUNT</p>
            <h1 id="profile-overview-title" className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">{name}</h1>
            <p className="mt-1 text-sm text-stone-600">{email}</p>
          </div>
        </div>
        <Link to="/account/profile/edit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#5433eb] px-5 text-sm font-medium text-white shadow-[0_4px_24px_rgba(69,36,219,0.22)] transition-colors hover:bg-[#4322cf] focus:outline-none focus:ring-2 focus:ring-[#5433eb] focus:ring-offset-2">
          <Pencil size={16} />
          Edit Profile
        </Link>
      </div>

      {profileError && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
          {profileError}
        </p>
      )}

      <div className="mt-5 rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-stone-900">Personal information</h2>
            <p className="mt-1 text-sm text-stone-600">Your details are kept private and used to support your account.</p>
          </div>
          {profileLoading && <LoaderCircle className="animate-spin text-stone-400" size={20} aria-label="Loading profile details" />}
        </div>
        <dl className="mt-6 grid gap-5 border-t border-stone-100 pt-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.12em] text-stone-500">Full name</dt>
            <dd className="mt-1 text-sm font-medium text-stone-900">{name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.12em] text-stone-500">Email address</dt>
            <dd className="mt-1 break-all text-sm font-medium text-stone-900">{email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.12em] text-stone-500">Mobile number</dt>
            <dd className="mt-1 text-sm font-medium text-stone-900">{mobile || 'Not added yet'}</dd>
          </div>
        </dl>
      </div>
    </section>
  )
}

const OrdersPanel = ({ orders, isLoading, error, isConfigured }) => {
  if (isLoading) {
    return (
      <section className="flex min-h-64 items-center justify-center rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm" aria-live="polite">
        <LoaderCircle className="animate-spin text-[#5433eb]" size={24} />
        <span className="ml-3 text-sm text-stone-600">Loading your orders…</span>
      </section>
    )
  }

  if (error || !isConfigured) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-stone-800" role="alert">
        <h1 className="text-lg font-semibold">Orders are not available yet</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6">{error || accountApiConfigurationMessage}</p>
      </section>
    )
  }

  if (orders.length === 0) {
    return (
      <section className="flex min-h-72 flex-col items-center justify-center rounded-[28px] border border-stone-200 bg-white px-6 py-12 text-center shadow-sm">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-50 text-[#5433eb]"><PackageOpen size={25} /></span>
        <h1 className="mt-5 text-xl font-semibold text-stone-900">No orders yet</h1>
        <p className="mt-2 max-w-sm text-sm leading-6 text-stone-600">When you place an order, its details and delivery status will appear here.</p>
        <Link to="/shop" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[#5433eb] px-5 text-sm font-medium text-white transition-colors hover:bg-[#4322cf]">Shop Now</Link>
      </section>
    )
  }

  return (
    <section aria-labelledby="orders-title">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-[#5433eb]">PURCHASE HISTORY</p>
          <h1 id="orders-title" className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">My Orders</h1>
        </div>
        <p className="text-sm text-stone-500">{orders.length} {orders.length === 1 ? 'order' : 'orders'}</p>
      </div>
      <div className="space-y-4">
        {orders.map((order) => {
          const items = Array.isArray(getOrderItems(order)) ? getOrderItems(order) : []
          const status = getOrderStatus(order)

          return (
            <article key={String(getOrderId(order))} className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-stone-100 bg-stone-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:flex sm:items-center sm:gap-8">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-stone-500">Order</p>
                    <p className="mt-0.5 text-sm font-semibold text-stone-900">#{getOrderId(order)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-stone-500">Placed on</p>
                    <p className="mt-0.5 text-sm text-stone-800">{formatDate(getOrderDate(order))}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-stone-500">Total</p>
                    <p className="mt-0.5 text-sm font-semibold text-stone-900">{formatPrice(getOrderTotal(order))}</p>
                  </div>
                </div>
                <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusClass(status)}`}>{status}</span>
              </div>
              <div className="divide-y divide-stone-100 px-5">
                {items.slice(0, 3).map((item, index) => (
                  <div key={item.id || item._id || `${getItemName(item)}-${index}`} className="flex items-center gap-3 py-4">
                    {getItemImage(item) ? (
                      <img src={getItemImage(item)} alt="" className="h-12 w-10 rounded-md border border-stone-100 object-cover" />
                    ) : (
                      <span className="flex h-12 w-10 items-center justify-center rounded-md bg-stone-100 text-stone-400"><PackageOpen size={17} /></span>
                    )}
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-stone-800">{getItemName(item)}</p>
                    {item.quantity && <span className="text-xs text-stone-500">Qty {item.quantity}</span>}
                  </div>
                ))}
                {items.length === 0 && <p className="py-4 text-sm text-stone-600">Item details are unavailable for this order.</p>}
                {items.length > 3 && <p className="py-3 text-sm text-stone-600">+{items.length - 3} more items</p>}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

const EditProfile = ({ profile, user, getAccessTokenSilently, onProfileSaved }) => {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [values, setValues] = useState(() => initialValues(profile, user))
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
  }, [avatarPreview])

  const name = getDisplayName(profile, user)
  const email = getEmail(profile, user)
  const avatar = avatarPreview || getAvatar(profile, user)

  const chooseAvatar = (event) => {
    const [file] = event.target.files || []
    setFeedback(null)

    if (!file) return

    if (!acceptedImageTypes.has(file.type)) {
      setErrors((current) => ({ ...current, avatar: 'Choose a JPG, PNG, or WebP image.' }))
      return
    }

    if (file.size > MAX_AVATAR_BYTES) {
      setErrors((current) => ({ ...current, avatar: 'Profile pictures must be 5 MB or smaller.' }))
      return
    }

    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setErrors((current) => ({ ...current, avatar: undefined }))
  }

  const validate = () => {
    const nextErrors = {}
    const normalizedName = values.name.trim()
    const normalizedMobile = values.mobile.trim()

    if (normalizedName.length < 2 || normalizedName.length > 100) {
      nextErrors.name = 'Enter a name between 2 and 100 characters.'
    }

    if (normalizedMobile && !/^[+]?[-()\s0-9]{7,20}$/.test(normalizedMobile)) {
      nextErrors.mobile = 'Enter a valid mobile number.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const save = async (event) => {
    event.preventDefault()
    setFeedback(null)

    if (!validate()) return

    if (!isAccountApiConfigured) {
      setFeedback({ type: 'error', message: accountApiConfigurationMessage })
      return
    }

    setIsSaving(true)

    try {
      const savedProfile = await updateAccountProfile(getAccessTokenSilently, {
        name: values.name.trim(),
        mobile: values.mobile.trim() || null,
      })
      const avatarProfile = avatarFile
        ? await uploadAccountAvatar(getAccessTokenSilently, avatarFile)
        : {}

      onProfileSaved({ ...savedProfile, ...avatarProfile })
      setAvatarFile(null)
      setFeedback({ type: 'success', message: 'Your profile has been updated.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'We could not save your profile. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  const cancel = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarPreview('')
    setAvatarFile(null)
    setErrors({})
    setFeedback(null)
    setValues(initialValues(profile, user))
    navigate('/account/profile')
  }

  return (
    <section aria-labelledby="edit-profile-title" className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-5">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-[#5433eb]">ACCOUNT SETTINGS</p>
          <h1 id="edit-profile-title" className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">Edit Profile</h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">Keep your name and mobile number up to date.</p>
        </div>
        <Pencil size={20} className="mt-1 text-stone-400" aria-hidden="true" />
      </div>

      <form onSubmit={save} className="mt-6 max-w-2xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar name={name} source={avatar} />
          <div>
            <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-stone-300 px-4 text-sm font-medium text-stone-800 transition-colors hover:border-[#5433eb] hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-[#5433eb] focus:ring-offset-2">
              <Camera size={16} />
              Change picture
            </button>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseAvatar} className="sr-only" />
            <p className="mt-2 text-xs text-stone-500">JPG, PNG, or WebP. Maximum size 5 MB.</p>
            {errors.avatar && <p className="mt-2 text-sm text-rose-700">{errors.avatar}</p>}
          </div>
        </div>

        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-stone-800">Full name</span>
            <input value={values.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} autoComplete="name" className="boutique-control mt-2 w-full px-4 text-sm text-stone-900 outline-none" />
            {errors.name && <span id="name-error" className="mt-2 block text-sm text-rose-700">{errors.name}</span>}
          </label>
          <label className="block">
            <span className="text-sm font-medium text-stone-800">Email address</span>
            <input value={email} readOnly aria-readonly="true" className="mt-2 min-h-11 w-full cursor-not-allowed rounded-full border border-stone-200 bg-stone-50 px-4 text-sm text-stone-500 outline-none" />
            <span className="mt-2 block text-xs text-stone-500">Email changes are managed securely by your sign-in provider.</span>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-stone-800">Mobile number <span className="text-stone-400">(optional)</span></span>
            <input value={values.mobile} onChange={(event) => setValues((current) => ({ ...current, mobile: event.target.value }))} aria-invalid={Boolean(errors.mobile)} aria-describedby={errors.mobile ? 'mobile-error' : undefined} autoComplete="tel" inputMode="tel" placeholder="Enter mobile number" className="boutique-control mt-2 w-full px-4 text-sm text-stone-900 outline-none placeholder:text-stone-400" />
            {errors.mobile && <span id="mobile-error" className="mt-2 block text-sm text-rose-700">{errors.mobile}</span>}
          </label>
        </div>

        {feedback && (
          <p className={`mt-6 flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`} role="status">
            {feedback.type === 'success' ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <X size={18} className="mt-0.5 shrink-0" />}
            {feedback.message}
          </p>
        )}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={cancel} disabled={isSaving} className="inline-flex min-h-11 items-center justify-center rounded-full border border-stone-300 px-5 text-sm font-medium text-stone-800 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60">Cancel</button>
          <button type="submit" disabled={isSaving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#5433eb] px-5 text-sm font-medium text-white transition-colors hover:bg-[#4322cf] disabled:cursor-not-allowed disabled:opacity-60">
            {isSaving ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </section>
  )
}

const Profile = () => {
  const { user: authUser, isLoading: authLoading, getAccessTokenSilently } = useAuth0()
  const dispatch = useDispatch()
  const location = useLocation()
  const storedProfile = useSelector((state) => state.user.user)
  const profile = storedProfile?.subject === authUser?.sub ? storedProfile : null
  const userStatus = useSelector((state) => state.user.status)
  const userError = useSelector((state) => state.user.error)
  const [orders, setOrders] = useState([])
  const [ordersState, setOrdersState] = useState({ loading: false, error: null })
  const ordersRequested = useRef(false)

  const section = useMemo(() => {
    if (location.pathname.endsWith('/orders')) return 'orders'
    if (location.pathname.endsWith('/edit')) return 'edit'
    return 'profile'
  }, [location.pathname])

  useEffect(() => {
    let active = true

    const load = async () => {
      if (section !== 'orders' || !isAccountApiConfigured || ordersRequested.current || !active) return

      ordersRequested.current = true
      setOrdersState({ loading: true, error: null })
      try {
        const result = await getMyOrders(getAccessTokenSilently)

        if (active) {
          setOrders(result.slice().sort((first, second) => new Date(getOrderDate(second) || 0) - new Date(getOrderDate(first) || 0)))
          setOrdersState({ loading: false, error: null })
        }
      } catch (error) {
        if (active) {
          setOrdersState({ loading: false, error: error instanceof Error ? error.message : 'We could not load your orders.' })
        }
      }
    }

    load()
    return () => { active = false }
  }, [getAccessTokenSilently, section])

  if (authLoading) {
    return (
      <main className="mx-auto flex min-h-72 max-w-7xl items-center justify-center px-5 py-12" aria-live="polite">
        <LoaderCircle className="animate-spin text-[#5433eb]" size={24} />
        <span className="ml-3 text-sm text-stone-600">Loading your account…</span>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-10rem)] bg-[#f2f4f5] py-7 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-stone-500">
          <Link to="/" className="hover:text-[#5433eb]">Home</Link>
          <span aria-hidden="true">/</span>
          <span className="text-stone-800">My Account</span>
        </div>
        <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-9">
          <aside className="lg:pt-2">
            <div className="mb-4 hidden items-center gap-2 px-3 text-xs font-semibold tracking-[0.16em] text-stone-500 lg:flex"><ShieldCheck size={15} /> ACCOUNT</div>
            <AccountNav />
          </aside>
          <div>
            {section === 'profile' && <ProfileOverview profile={profile} user={authUser} profileLoading={userStatus === 'loading' && !profile && !authUser} profileError={userError} />}
            {section === 'orders' && <OrdersPanel orders={orders} isLoading={ordersState.loading} error={ordersState.error} isConfigured={isAccountApiConfigured} />}
            {section === 'edit' && <EditProfile key={`${profile?.subject || authUser?.sub || 'profile'}:${userStatus}`} profile={profile} user={authUser} getAccessTokenSilently={getAccessTokenSilently} onProfileSaved={(savedProfile) => dispatch(profileUpdated({ subject: authUser?.sub, profile: savedProfile }))} />}
          </div>
        </div>
      </div>
    </main>
  )
}

export default Profile
