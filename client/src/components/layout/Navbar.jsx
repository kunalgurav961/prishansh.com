
import { useState } from 'react'
import { Link, NavLink } from 'react-router'
import {
    Search, UserRound, Heart, ShoppingBag,
    Menu, X, LogOut
} from 'lucide-react'
import { useAuth0 } from '@auth0/auth0-react'
import { useDispatch, useSelector } from 'react-redux'
import { clearUser } from '../../store/userSlice'
import useCart from '../../hooks/useCart'

const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const { isAuthenticated, isLoading, logout, user: authUser } = useAuth0()
    const { totalCount } = useCart()
    const dispatch = useDispatch()
    const storedUser = useSelector((state) => state.user.user)
    const user = storedUser?.subject === authUser?.sub ? storedUser : null

    const accountPath = isAuthenticated ? '/account/profile' : '/login'
    const handleLogout = () => {
        dispatch(clearUser())
        logout({ logoutParams: { returnTo: window.location.origin } })
    }

    const categories = [
        { name: 'Sarees', path: '/category/sarees' },
        { name: 'Dress Materials', path: '/category/dress-materials' },
        { name: 'Jewellery', path: '/category/jewellery' },
        { name: 'Kids', path: '/category/kids' },
        { name: 'Toys', path: '/category/toys' },
    ]

    const linkClass = ({ isActive }) =>
        `relative py-1 text-[11px] font-medium uppercase tracking-[0.08em] transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:bg-[#5433eb] after:transition-transform ${isActive
            ? 'text-[#5433eb] after:w-full after:scale-x-100'
            : 'text-stone-600 after:w-full after:scale-x-0 hover:text-[#5433eb] hover:after:scale-x-100'
        }`

    return (
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md">


            {/* Main navbar */}
            <div className="border-b border-stone-200/90">
                <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-4 sm:px-8 md:py-5 lg:px-0">

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="flex h-10 w-10 items-center justify-center text-stone-800 transition-colors hover:text-[#5433eb] md:hidden"
                        aria-label="Toggle navigation menu"
                    >
                        {menuOpen ? <X size={23} /> : <Menu size={23} />}
                    </button>

                    {/* Brand */}
                    <Link to="/" className="shrink-0 text-center transition-opacity hover:opacity-75">
                        <h1 className="text-lg font-semibold tracking-[0.16em] text-stone-900 sm:text-xl">
                            PRISHANSH
                        </h1>
                        <p className="mt-1 text-[8px] font-medium tracking-[0.3em] text-[#5433eb] sm:text-[9px]">
                            B O U T I Q U E
                        </p>
                    </Link>

                    {/* Desktop search */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            const query = e.currentTarget.elements.search.value.trim()
                            if (query) {
                                window.location.href = `/shop?search=${encodeURIComponent(query)}`
                            }
                        }}
                        className="boutique-search hidden max-w-md flex-1 items-center px-4 md:flex"
                    >
                        <Search size={18} className="text-stone-500" />
                        <input
                            name="search"
                            type="search"
                            placeholder="Search sarees, jewellery, clothing..."
                            className="ml-2 w-full bg-transparent text-sm text-stone-800 outline-none placeholder:text-stone-400"
                        />
                    </form>

                    {/* Actions */}
                    <div className="flex items-center gap-1 text-stone-800 sm:gap-1">
                        <button
                            onClick={() => setSearchOpen(!searchOpen)}
                            className="flex h-10 w-10 items-center justify-center transition-colors hover:text-[#5433eb] md:hidden"
                            aria-label="Search products"
                        >
                            <Search size={21} />
                        </button>

                        <Link to={accountPath} aria-label={user?.name ? `My account, ${user.name}` : 'My account'} className="hidden h-10 w-10 items-center justify-center transition-colors hover:text-[#5433eb] sm:flex">
                            <UserRound size={21} />
                        </Link>

                        {isAuthenticated && !isLoading && (
                            <button onClick={handleLogout} aria-label="Sign out" title="Sign out" className="flex h-10 w-10 items-center justify-center transition-colors hover:text-[#5433eb]">
                                <LogOut size={20} />
                            </button>
                        )}

                        <Link to="/wishlist" aria-label="Wishlist" className="flex h-10 w-10 items-center justify-center transition-colors hover:text-[#5433eb]">
                            <Heart size={21} />
                        </Link>

                        <Link to="/cart" aria-label="Shopping cart" className="relative flex h-10 w-10 items-center justify-center transition-colors hover:text-[#5433eb]">
                            <ShoppingBag size={22} />
                            {totalCount > 0 && (
                                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#5433eb] px-1 text-[9px] font-semibold text-white">
                                    {totalCount}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>

                {/* Mobile search */}
                {searchOpen && (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            const query = e.currentTarget.elements.search.value.trim()
                            if (query) {
                                window.location.href = `/shop?search=${encodeURIComponent(query)}`
                            }
                        }}
                        className="boutique-search mx-3 flex items-center gap-2 px-4 md:hidden"
                    >
                        <Search size={18} className="text-stone-500" />
                        <input
                            name="search"
                            autoFocus
                            placeholder="Search products..."
                            className="w-full bg-transparent py-3 text-sm text-stone-800 outline-none placeholder:text-stone-400"
                        />
                    </form>
                )}

                {/* Desktop category navigation */}
                <nav className="mx-auto hidden max-w-[1200px] items-center justify-center gap-6 py-3.5 md:flex">
                    <NavLink to="/" className={linkClass}>Home</NavLink>
                    <NavLink to="/shop" className={linkClass}>Shop All</NavLink>

                    {categories.map((category) => (
                        <NavLink
                            key={category.path}
                            to={category.path}
                            className={linkClass}
                        >
                            {category.name}
                        </NavLink>
                    ))}

                    <NavLink to="/about" className={linkClass}>Our Story</NavLink>

                </nav>
            </div>

            {/* Mobile navigation */}
            {menuOpen && (
                <nav className="border-b border-stone-200 bg-white px-5 py-3 shadow-[0_14px_30px_rgba(47,35,28,0.10)] md:hidden">
                    <div className="flex flex-col">
                        <NavLink
                            to="/"
                            onClick={() => setMenuOpen(false)}
                            className="border-b border-stone-100 py-3.5 text-sm font-medium text-stone-800 transition-colors hover:text-[#5433eb]"
                        >
                            Home
                        </NavLink>

                        <NavLink
                            to="/shop"
                            onClick={() => setMenuOpen(false)}
                            className="border-b border-stone-100 py-3.5 text-sm font-medium text-stone-800 transition-colors hover:text-[#5433eb]"
                        >
                            Shop All
                        </NavLink>

                        {categories.map((category) => (
                            <NavLink
                                key={category.path}
                                to={category.path}
                                onClick={() => setMenuOpen(false)}
                                className="border-b border-stone-100 py-3.5 text-sm font-medium text-stone-800 transition-colors hover:text-[#5433eb]"
                            >
                                {category.name}
                            </NavLink>
                        ))}

                        <NavLink
                            to="/about"
                            onClick={() => setMenuOpen(false)}
                            className="border-b border-stone-100 py-3.5 text-sm font-medium text-stone-800 transition-colors hover:text-[#5433eb]"
                        >
                            Our Story
                        </NavLink>

                        <NavLink
                            to="/contact"
                            onClick={() => setMenuOpen(false)}
                            className="border-b border-stone-100 py-3.5 text-sm font-medium text-stone-800 transition-colors hover:text-[#5433eb]"
                        >
                            Contact
                        </NavLink>

                        <Link
                            to={accountPath}
                            onClick={() => setMenuOpen(false)}
                            className="py-3.5 text-sm font-medium text-stone-800 transition-colors hover:text-[#5433eb]"
                        >
                            My Account
                        </Link>

                        {isAuthenticated && !isLoading && (
                            <button
                                onClick={() => {
                                    setMenuOpen(false)
                                    handleLogout()
                                }}
                                className="border-t border-stone-100 py-3.5 text-left text-sm font-medium text-stone-800 transition-colors hover:text-[#5433eb]"
                            >
                                Sign out
                            </button>
                        )}
                    </div>
                </nav>
            )}
        </header>
    )
}

export default Navbar
