import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Truck, CreditCard, Sparkles as SparklesIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { productAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import Sparkles from '../components/ui/Sparkles';
import TextReveal from '../components/ui/TextReveal';
import SpotlightCard from '../components/ui/SpotlightCard';

export default function Home() {
    const [featured, setFeatured] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        productAPI.list({ featured: true, limit: 3 })
            .then(res => setFeatured(res.data.products))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="relative overflow-hidden">
            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center">
                <Sparkles className="opacity-70" particleDensity={70} />
                {/* Animated background - Redefined for better contrast */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary-500/10 rounded-full blur-[120px] animate-pulse-slow" />
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-500/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="text-center max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-sm font-medium mb-8">
                                <SparklesIcon size={16} /> Cloud-Native E-Commerce Platform
                            </span>
                        </motion.div>

                        <TextReveal 
                            text="Shop the Future with NimbusCart" 
                            className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold leading-tight mb-8"
                        />

                        <motion.p
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="text-lg sm:text-xl text-surface-200/80 max-w-2xl mx-auto mb-12 leading-relaxed"
                        >
                            Experience premium shopping with instant UPI QR payments,
                            real-time order tracking, and enterprise-grade security.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4"
                        >
                            <Link
                                to="/products"
                                className="gradient-btn px-8 py-4 text-lg rounded-2xl flex items-center gap-3 shadow-lg shadow-primary-500/25"
                            >
                                <span>Explore Products</span>
                                <ArrowRight size={20} />
                            </Link>
                            <Link
                                to="/register"
                                className="px-8 py-4 text-lg rounded-2xl border border-surface-700 hover:border-primary-500/50 hover:bg-surface-800/50 transition-all text-surface-200 hover:text-white"
                            >
                                Get Started
                            </Link>
                        </motion.div>

                        {/* Trust Signals - Mini */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1, duration: 1 }}
                            className="mt-16 flex flex-wrap justify-center items-center gap-8 opacity-40 grayscale"
                        >
                            <span className="text-sm font-bold tracking-widest uppercase">Trusted By 10k+ Users</span>
                            <div className="h-4 w-px bg-surface-700" />
                            <div className="flex items-center gap-2">
                                <Shield size={16} /> <span className="text-xs font-bold uppercase">PCI Compliant</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CreditCard size={16} /> <span className="text-xs font-bold uppercase">Secure UPI</span>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Animated Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                >
                    <span className="text-[10px] uppercase tracking-[0.2em] text-surface-200/40 font-bold">Scroll to explore</span>
                    <div className="w-5 h-8 border-2 border-surface-700 rounded-full flex justify-center p-1">
                        <motion.div
                            animate={{ y: [0, 12, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="w-1 h-1 bg-primary-400 rounded-full"
                        />
                    </div>
                </motion.div>
            </section>

            {/* Features */}
            <section className="py-24 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
                            Why Choose <span className="gradient-text">NimbusCart</span>
                        </h2>
                        <p className="text-surface-200/70 max-w-xl mx-auto">
                            Built with enterprise-grade technology for the modern shopper
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: Zap, title: 'Lightning Fast', desc: 'Blazing fast checkout with optimized performance', color: 'from-yellow-500 to-orange-500' },
                            { icon: Shield, title: 'Bank-Grade Security', desc: 'HTTPS, encryption, and secure payment processing', color: 'from-green-500 to-emerald-500' },
                            { icon: CreditCard, title: 'UPI QR Payments', desc: 'Instant payment via dynamic UPI QR codes', color: 'from-primary-500 to-accent-500' },
                            { icon: Truck, title: 'Free Shipping', desc: 'Free delivery on orders above ₹999', color: 'from-blue-500 to-cyan-500' },
                        ].map((feature, i) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <SpotlightCard className="p-8 text-center h-full flex flex-col items-center">
                                    <div className={`w-14 h-14 z-10 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mx-auto mb-5`}>
                                        <feature.icon size={24} className="text-white" />
                                    </div>
                                    <h3 className="text-lg z-10 font-display font-semibold mb-2">{feature.title}</h3>
                                    <p className="text-surface-200/60 z-10 text-sm">{feature.desc}</p>
                                </SpotlightCard>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            <section className="py-24 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex items-center justify-between mb-12"
                    >
                        <div>
                            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-2">
                                Featured <span className="gradient-text">Products</span>
                            </h2>
                            <p className="text-surface-200/70">Top rated items from our collection</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="hidden lg:flex items-center -space-x-2 mr-4">
                                {Array.from({ length: 4 }, (_, i) => `avatar-${i}`).map(id => (
                                    <div key={id} className="w-8 h-8 rounded-full border-2 border-surface-950 bg-surface-800 flex items-center justify-center overflow-hidden">
                                        <img src={`https://i.pravatar.cc/100?img=${id === 'avatar-0' ? 11 : 12}`} alt="User" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                                <div className="ml-4 text-xs font-bold text-surface-200/60">+4.8 (2k reviews)</div>
                            </div>
                            <Link
                                to="/products"
                                className="hidden sm:flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors font-medium"
                            >
                                View All <ArrowRight size={18} />
                            </Link>
                        </div>
                    </motion.div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {Array.from({ length: 3 }, (_, i) => `featured-skeleton-${i}`).map((id) => (
                                <div key={id} className="glass-card overflow-hidden">
                                    <div className="aspect-square skeleton" />
                                    <div className="p-4 space-y-3">
                                        <div className="h-3 skeleton w-1/3" />
                                        <div className="h-5 skeleton w-2/3" />
                                        <div className="h-6 skeleton w-1/3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {featured.map((product, i) => (
                                <ProductCard key={product.id} product={product} index={i} />
                            ))}
                        </div>
                    )}

                    <div className="sm:hidden mt-8 text-center">
                        <Link to="/products" className="gradient-btn px-6 py-3 rounded-xl inline-flex items-center gap-2">
                            <span>View All Products</span> <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 relative">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="glass-card p-12 sm:p-16 text-center relative overflow-hidden ring-1 ring-primary-500/20 shadow-2xl shadow-primary-500/10"
                    >
                        <Sparkles particleDensity={40} className="opacity-50" />
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-accent-500/10 pointer-events-none" />
                        <div className="relative">
                            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
                                Ready to Start Shopping?
                            </h2>
                            <p className="text-surface-200/70 mb-8 max-w-lg mx-auto">
                                Join thousands of happy customers and experience the future of online shopping.
                            </p>
                            <Link
                                to="/register"
                                className="gradient-btn px-8 py-4 text-lg rounded-2xl inline-flex items-center gap-3 shadow-lg shadow-primary-500/25"
                            >
                                <span>Get Started Free</span>
                                <ArrowRight size={20} />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Upgraded Footer */}
            <footer className="border-t border-surface-900 pt-20 pb-10 bg-surface-950/50 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
                                    <span className="text-white font-bold text-lg">N</span>
                                </div>
                                <span className="font-display font-bold text-xl gradient-text">NimbusCart</span>
                            </div>
                            <p className="text-surface-200/60 text-sm leading-relaxed">
                                The ultimate cloud-native e-commerce experience. Fast, secure, and built for the future.
                            </p>
                            <div className="flex items-center gap-4 pt-2">
                                <div className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center text-surface-400 hover:text-white transition-colors cursor-pointer">
                                    <Zap size={16} />
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center text-surface-400 hover:text-white transition-colors cursor-pointer">
                                    <Shield size={16} />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-6">Shop</h4>
                            <ul className="space-y-4">
                                {['Electronics', 'Fashion', 'Accessories', 'Home & Decor'].map(item => (
                                    <li key={item}><Link to={`/products?category=${item}`} className="text-surface-200/60 text-sm hover:text-primary-400 transition-colors">{item}</Link></li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-6">Support</h4>
                            <ul className="space-y-4">
                                {['Help Center', 'Shipping Policy', 'Returns & Refunds', 'Contact Us'].map(item => (
                                    <li key={item}><Link to="/" className="text-surface-200/60 text-sm hover:text-primary-400 transition-colors">{item}</Link></li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-6">Newsletter</h4>
                            <p className="text-surface-200/60 text-sm mb-4">Get the latest updates on new arrivals and sales.</p>
                            <form className="relative group">
                                <input 
                                    type="email" 
                                    placeholder="your@email.com" 
                                    className="w-full bg-surface-800 border border-surface-700 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-primary-500/50 transition-all"
                                />
                                <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white hover:bg-primary-600 transition-colors">
                                    <ArrowRight size={16} />
                                </button>
                            </form>
                        </div>
                    </div>
                    
                    <div className="pt-8 border-t border-surface-900 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-surface-200/40 text-xs">
                            © 2026 NimbusCart Platform. All rights reserved.
                        </p>
                        <div className="flex items-center gap-6 text-xs text-surface-200/40">
                            <Link to="/" className="hover:text-white transition-colors">Privacy Policy</Link>
                            <Link to="/" className="hover:text-white transition-colors">Terms of Service</Link>
                            <Link to="/" className="hover:text-white transition-colors">Cookies</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
