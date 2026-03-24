import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, LogOut, Menu, X, Package, Search, Heart, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { PermissionGate } from './PermissionGate';

export default function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const { cart } = useCart();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [megaMenuOpen, setMegaMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [cartHover, setCartHover] = useState(false);

    // Scroll listener for sticky glass effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
        }
    };

    return (
        <motion.nav 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'glass border-b border-primary-500/10 shadow-xl shadow-black/10' : 'bg-transparent'}`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Brand */}
                    <div className="flex items-center gap-12">
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="text-white font-display font-bold text-lg">N</span>
                            </div>
                            <span className="font-display text-xl font-bold gradient-text hidden sm:block">NimbusCart</span>
                        </Link>

                        {/* Desktop Links (Mega Menu trigger) */}
                        <div className="hidden lg:flex items-center gap-8">
                            <Link to="/" className="text-surface-200 hover:text-white transition-colors text-sm font-bold">
                                Home
                            </Link>
                            
                            {/* Mega Menu Wrapper */}
                            <div 
                                className="relative py-8"
                                onMouseEnter={() => setMegaMenuOpen(true)}
                                onMouseLeave={() => setMegaMenuOpen(false)}
                                onFocus={() => setMegaMenuOpen(true)}
                                onBlur={() => setMegaMenuOpen(false)}
                                role="group"
                                aria-label="Shop Menu"
                            >
                                <button className="text-surface-200 hover:text-white transition-colors text-sm font-bold flex items-center gap-1 outline-none">
                                    Shop <ChevronDown size={14} className={`transition-transform duration-200 ${megaMenuOpen ? 'rotate-180 text-primary-400' : ''}`} />
                                </button>
                                
                                <AnimatePresence>
                                    {megaMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 15, rotateX: -10 }}
                                            animate={{ opacity: 1, y: 0, rotateX: 0 }}
                                            exit={{ opacity: 0, y: 15, rotateX: -10 }}
                                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                            className="absolute top-16 left-0 w-[500px] glass-card p-6 shadow-2xl rounded-2xl grid grid-cols-2 gap-6 border border-surface-800 origin-top"
                                        >
                                            <div>
                                                <h4 className="text-xs font-bold text-surface-200/50 uppercase tracking-wider mb-4">Categories</h4>
                                                <ul className="space-y-3">
                                                    <li><Link to="/products?category=Electronics" className="text-sm font-medium text-surface-100 hover:text-primary-400 block transition-colors">Electronics</Link></li>
                                                    <li><Link to="/products?category=Fashion" className="text-sm font-medium text-surface-100 hover:text-primary-400 block transition-colors">Fashion</Link></li>
                                                    <li><Link to="/products?category=Accessories" className="text-sm font-medium text-surface-100 hover:text-primary-400 block transition-colors">Accessories</Link></li>
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-surface-200/50 uppercase tracking-wider mb-4">Featured</h4>
                                                <Link to="/products/wireless-nc-headphones" className="block rounded-xl overflow-hidden relative group aspect-video">
                                                    <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600" alt="Promo" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-surface-950/90 to-transparent flex items-end p-4">
                                                        <span className="text-white font-bold text-sm">New Audio Drops</span>
                                                    </div>
                                                </Link>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* Central Search Bar (Desktop) */}
                    <div className="hidden lg:flex flex-1 max-w-md mx-8">
                        <form onSubmit={handleSearch} className="relative w-full group">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-200/40 group-focus-within:text-primary-400 transition-colors" />
                            <input 
                                type="text"
                                placeholder="Search products, brands, categories..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-surface-900/50 border border-surface-800 rounded-full py-2.5 pl-11 pr-4 text-sm text-surface-100 placeholder:text-surface-200/40 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all font-medium"
                            />
                        </form>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-1 sm:gap-3">
                        <button className="lg:hidden p-2 rounded-xl text-surface-200 hover:bg-surface-800 transition-colors">
                            <Search size={22} />
                        </button>
                        
                        <Link 
                            to="/products?featured=true"
                            className="hidden sm:flex p-2 rounded-xl text-surface-200 hover:bg-surface-800 hover:text-rose-400 transition-colors relative"
                        >
                            <Heart size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-surface-950" />
                        </Link>

                        {/* Cart */}
                        <div 
                            className="relative"
                            onMouseEnter={() => setCartHover(true)}
                            onMouseLeave={() => setCartHover(false)}
                            onFocus={() => setCartHover(true)}
                            onBlur={() => setCartHover(false)}
                            role="group"
                            aria-label="Mini Cart"
                        >
                            <Link to="/cart" className="relative p-2 rounded-xl text-surface-200 hover:bg-surface-800 hover:text-white transition-colors group block">
                                <ShoppingCart size={20} />
                                {cart.itemCount > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-gradient-to-r from-primary-500 to-accent-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white ring-2 ring-surface-950"
                                    >
                                        {cart.itemCount}
                                    </motion.span>
                                )}
                            </Link>

                            {/* Mini Cart Dropdown */}
                            <AnimatePresence>
                                {cartHover && cart.itemCount > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 top-12 w-64 glass-card p-4 shadow-2xl border border-surface-800 z-[60]"
                                    >
                                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-surface-800">
                                            <span className="text-sm font-bold text-white">Your Cart</span>
                                            <span className="text-xs text-surface-200/60">{cart.itemCount} items</span>
                                        </div>
                                        <div className="max-h-48 overflow-y-auto mb-4 space-y-3">
                                            {cart.items?.slice(0, 3).map(item => (
                                                <div key={item.id} className="flex gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-surface-800 overflow-hidden flex-shrink-0">
                                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-white truncate">{item.name}</p>
                                                        <p className="text-[10px] text-surface-200/60">{item.quantity} × ₹{item.price}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {cart.items?.length > 3 && (
                                                <p className="text-[10px] text-center text-surface-200/40">+ {cart.items.length - 3} more items</p>
                                            )}
                                        </div>
                                        <Link 
                                            to="/cart" 
                                            className="block w-full text-center py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-bold transition-colors"
                                        >
                                            View Cart
                                        </Link>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {isAuthenticated ? (
                            <div className="relative ml-2">
                                <button
                                    onClick={() => setProfileOpen(!profileOpen)}
                                    className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-primary-500/30 hover:border-primary-500 hover:shadow-lg hover:shadow-primary-500/20 transition-all"
                                >
                                    <span className="text-primary-300 text-sm font-bold">
                                        {user?.firstName?.[0]?.toUpperCase() || 'U'}
                                    </span>
                                </button>

                                <AnimatePresence>
                                    {profileOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                            className="absolute right-0 top-12 w-56 glass-card shadow-2xl rounded-2xl origin-top-right border border-surface-800 overflow-hidden"
                                        >
                                            <div className="px-4 py-3 bg-surface-800/30 border-b border-surface-800">
                                                <p className="text-sm font-bold text-white">{user?.firstName} {user?.lastName}</p>
                                                <p className="text-xs text-surface-200/60 truncate">{user?.email}</p>
                                            </div>
                                            <div className="p-2">
                                                <Link
                                                    to="/orders"
                                                    onClick={() => setProfileOpen(false)}
                                                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-800 transition-colors text-sm text-surface-200 hover:text-white font-medium"
                                                >
                                                    <Package size={16} /> My Orders
                                                </Link>
                                                
                                                <PermissionGate roles={['admin', 'SUPER_ADMIN']} permission="analytics:view">
                                                    <Link
                                                        to="/admin"
                                                        onClick={() => setProfileOpen(false)}
                                                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-primary-500/10 transition-colors text-sm text-primary-400 font-medium"
                                                    >
                                                        <Package size={16} /> Admin Panel
                                                    </Link>
                                                </PermissionGate>

                                                <PermissionGate roles="vendor" permission="product:create">
                                                    <Link
                                                        to="/vendor/dashboard"
                                                        onClick={() => setProfileOpen(false)}
                                                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-accent-500/10 transition-colors text-sm text-accent-400 font-medium"
                                                    >
                                                        <Package size={16} /> Vendor Dash
                                                    </Link>
                                                </PermissionGate>
                                                <button
                                                    onClick={() => { setProfileOpen(false); handleLogout(); }}
                                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-rose-500/10 transition-colors text-sm text-rose-400 mt-1 font-medium"
                                                >
                                                    <LogOut size={16} /> Logout
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="hidden sm:flex items-center gap-3 ml-2">
                                <Link to="/login" className="text-sm font-bold text-surface-200 hover:text-white transition-colors">Log in</Link>
                                <Link to="/register" className="text-sm font-bold text-surface-950 bg-white hover:bg-surface-200 transition-colors px-5 py-2 rounded-full shadow-lg shadow-white/10">Sign up</Link>
                            </div>
                        )}

                        {/* Mobile menu toggle */}
                        <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2 rounded-xl text-surface-200 hover:bg-surface-800 transition-colors ml-1">
                            {menuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="lg:hidden overflow-hidden glass border-t border-surface-800/50"
                    >
                        <div className="px-4 py-6 space-y-4">
                            {!isAuthenticated && (
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <Link to="/login" onClick={() => setMenuOpen(false)} className="text-center text-sm font-bold text-surface-200 border border-surface-700 hover:bg-surface-800 transition-colors px-4 py-3 rounded-xl">Log in</Link>
                                    <Link to="/register" onClick={() => setMenuOpen(false)} className="text-center text-sm font-bold text-surface-950 bg-white hover:bg-surface-200 transition-colors px-4 py-3 rounded-xl">Sign up</Link>
                                </div>
                            )}
                            <Link to="/" onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-xl hover:bg-surface-800 transition-colors text-base font-bold">Home</Link>
                            <Link to="/products" onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-xl hover:bg-surface-800 transition-colors text-base font-bold">Shop All Products</Link>
                            {isAuthenticated && (
                                <Link to="/orders" onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-xl hover:bg-surface-800 transition-colors text-base font-bold">My Orders</Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}
