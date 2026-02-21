import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, User, LogOut, Menu, X, Package, Home, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const { cart } = useCart();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-primary-500/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="text-white font-display font-bold text-lg">N</span>
                        </div>
                        <span className="font-display text-xl font-bold gradient-text hidden sm:block">NimbusCart</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link to="/" className="text-surface-200 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
                            <Home size={16} /> Home
                        </Link>
                        <Link to="/products" className="text-surface-200 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
                            <Package size={16} /> Products
                        </Link>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        {/* Cart */}
                        <Link to="/cart" className="relative p-2 rounded-xl hover:bg-surface-800 transition-colors group">
                            <ShoppingCart size={22} className="text-surface-200 group-hover:text-primary-400 transition-colors" />
                            {cart.itemCount > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full text-xs font-bold flex items-center justify-center"
                                >
                                    {cart.itemCount}
                                </motion.span>
                            )}
                        </Link>

                        {isAuthenticated ? (
                            <div className="relative">
                                <button
                                    onClick={() => setProfileOpen(!profileOpen)}
                                    className="flex items-center gap-2 p-2 rounded-xl hover:bg-surface-800 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                                        <span className="text-white text-sm font-bold">
                                            {user?.firstName?.[0]?.toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                    <span className="hidden sm:block text-sm font-medium text-surface-200">
                                        {user?.firstName || 'User'}
                                    </span>
                                </button>

                                <AnimatePresence>
                                    {profileOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                            className="absolute right-0 top-14 w-48 glass-card p-2 shadow-2xl"
                                        >
                                            <Link
                                                to="/orders"
                                                onClick={() => setProfileOpen(false)}
                                                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface-700/50 transition-colors text-sm"
                                            >
                                                <Package size={16} className="text-primary-400" /> My Orders
                                            </Link>
                                            <button
                                                onClick={() => { setProfileOpen(false); handleLogout(); }}
                                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/10 transition-colors text-sm text-red-400"
                                            >
                                                <LogOut size={16} /> Logout
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="gradient-btn text-sm px-5 py-2.5 rounded-xl"
                            >
                                <span>Sign In</span>
                            </Link>
                        )}

                        {/* Mobile menu */}
                        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-xl hover:bg-surface-800 transition-colors">
                            {menuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="md:hidden overflow-hidden glass border-t border-primary-500/10"
                    >
                        <div className="px-4 py-4 space-y-2">
                            <Link to="/" onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-xl hover:bg-surface-800 transition-colors text-sm font-medium">Home</Link>
                            <Link to="/products" onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-xl hover:bg-surface-800 transition-colors text-sm font-medium">Products</Link>
                            <Link to="/orders" onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-xl hover:bg-surface-800 transition-colors text-sm font-medium">Orders</Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
