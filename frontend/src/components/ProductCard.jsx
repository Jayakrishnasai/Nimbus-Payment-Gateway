import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShoppingCart, Eye, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product, index = 0 }) {
    const { isAuthenticated } = useAuth();
    const { addItem } = useCart();

    const discount = product.compare_price
        ? Math.round((1 - product.price / product.compare_price) * 100)
        : 0;

    const handleAddToCart = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) {
            window.location.href = '/login';
            return;
        }
        await addItem(product.id);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
        >
            <Link to={`/products/${product.slug || product.id}`} className="block group">
                <div className="glass-card overflow-hidden">
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden">
                        <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            loading="lazy"
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-surface-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Badges */}
                        {discount > 0 && (
                            <span className="absolute top-3 left-3 px-3 py-1 bg-gradient-to-r from-primary-500 to-accent-500 text-white text-xs font-bold rounded-full">
                                -{discount}%
                            </span>
                        )}
                        {product.featured && (
                            <span className="absolute top-3 right-3 px-3 py-1 bg-amber-500/90 text-white text-xs font-bold rounded-full flex items-center gap-1">
                                <Star size={12} fill="currentColor" /> Featured
                            </span>
                        )}

                        {/* Quick Actions */}
                        <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                            <button
                                onClick={handleAddToCart}
                                className="flex-1 gradient-btn py-2.5 text-sm rounded-xl flex items-center justify-center gap-2"
                            >
                                <ShoppingCart size={16} /> <span>Add to Cart</span>
                            </button>
                            <div className="p-2.5 rounded-xl bg-surface-800/80 backdrop-blur-sm hover:bg-surface-700 transition-colors">
                                <Eye size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                        {product.category && (
                            <p className="text-primary-400 text-xs font-semibold uppercase tracking-wider mb-1">
                                {product.category}
                            </p>
                        )}
                        <h3 className="font-display font-semibold text-surface-100 line-clamp-2 group-hover:text-white transition-colors">
                            {product.name}
                        </h3>
                        <div className="mt-3 flex items-center gap-3">
                            <span className="text-xl font-bold text-white">
                                ₹{Number(product.price).toLocaleString('en-IN')}
                            </span>
                            {product.compare_price && (
                                <span className="text-sm text-surface-200/60 line-through">
                                    ₹{Number(product.compare_price).toLocaleString('en-IN')}
                                </span>
                            )}
                        </div>
                        {product.stock !== undefined && product.stock <= 10 && product.stock > 0 && (
                            <p className="mt-2 text-xs text-amber-400">Only {product.stock} left!</p>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
