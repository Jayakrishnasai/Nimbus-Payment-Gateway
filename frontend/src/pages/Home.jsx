import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Truck, CreditCard, Star, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { productAPI } from '../services/api';
import ProductCard from '../components/ProductCard';

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
                {/* Animated background */}
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600/10 rounded-full blur-3xl" />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="text-center max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-sm font-medium mb-8">
                                <Sparkles size={16} /> Cloud-Native E-Commerce Platform
                            </span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                            className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold leading-tight mb-8"
                        >
                            Shop the Future with{' '}
                            <span className="gradient-text">NimbusCart</span>
                        </motion.h1>

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
                                Create Account
                            </Link>
                        </motion.div>
                    </div>
                </div>
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
                                className="glass-card p-8 text-center"
                            >
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mx-auto mb-5`}>
                                    <feature.icon size={24} className="text-white" />
                                </div>
                                <h3 className="text-lg font-display font-semibold mb-2">{feature.title}</h3>
                                <p className="text-surface-200/60 text-sm">{feature.desc}</p>
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
                            <p className="text-surface-200/70">Hand-picked products just for you</p>
                        </div>
                        <Link
                            to="/products"
                            className="hidden sm:flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors font-medium"
                        >
                            View All <ArrowRight size={18} />
                        </Link>
                    </motion.div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="glass-card overflow-hidden">
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
                        className="glass-card p-12 sm:p-16 text-center relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-accent-500/10" />
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

            {/* Footer */}
            <footer className="border-t border-surface-800 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">N</span>
                            </div>
                            <span className="font-display font-bold gradient-text">NimbusCart</span>
                        </div>
                        <p className="text-surface-200/50 text-sm">
                            © 2026 NimbusCart. Cloud-Native E-Commerce Platform.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
