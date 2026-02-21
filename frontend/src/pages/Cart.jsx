import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Cart() {
    const { cart, loading, updateItem, removeItem } = useCart();

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="glass-card p-6 flex gap-6">
                            <div className="w-24 h-24 skeleton rounded-xl" />
                            <div className="flex-1 space-y-3">
                                <div className="h-5 skeleton w-1/2" />
                                <div className="h-4 skeleton w-1/4" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (cart.items.length === 0) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-20 text-center">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="w-24 h-24 rounded-full bg-surface-800/50 flex items-center justify-center mx-auto mb-6">
                        <ShoppingBag size={40} className="text-surface-200/30" />
                    </div>
                    <h2 className="text-2xl font-display font-bold mb-3">Your Cart is Empty</h2>
                    <p className="text-surface-200/50 mb-8">Start adding products to your cart</p>
                    <Link to="/products" className="gradient-btn px-8 py-3 rounded-xl inline-flex items-center gap-2">
                        <span>Browse Products</span> <ArrowRight size={18} />
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.h1
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-display font-bold mb-8"
            >
                Shopping <span className="gradient-text">Cart</span>
                <span className="text-surface-200/40 text-lg font-normal ml-3">({cart.itemCount} items)</span>
            </motion.h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Items */}
                <div className="lg:col-span-2 space-y-4">
                    {cart.items.map((item, i) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="glass-card p-4 sm:p-6 flex gap-4 sm:gap-6"
                        >
                            <Link to={`/products/${item.slug}`} className="shrink-0">
                                <img src={item.imageUrl} alt={item.name} className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl" />
                            </Link>
                            <div className="flex-1 min-w-0">
                                <Link to={`/products/${item.slug}`}>
                                    <h3 className="font-display font-semibold text-white hover:text-primary-400 transition-colors truncate">{item.name}</h3>
                                </Link>
                                <p className="text-primary-400 font-bold mt-1">₹{item.price.toLocaleString('en-IN')}</p>

                                <div className="flex items-center justify-between mt-3">
                                    <div className="flex items-center gap-3 bg-surface-800/50 border border-surface-700 rounded-lg px-3 py-1.5">
                                        <button onClick={() => updateItem(item.productId, item.quantity - 1)} className="hover:text-primary-400 transition-colors">
                                            <Minus size={14} />
                                        </button>
                                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                                        <button onClick={() => updateItem(item.productId, item.quantity + 1)} className="hover:text-primary-400 transition-colors">
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-white font-bold">₹{item.subtotal.toLocaleString('en-IN')}</span>
                                        <button onClick={() => removeItem(item.productId)} className="p-2 rounded-lg hover:bg-red-500/10 text-surface-200/40 hover:text-red-400 transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Summary */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                    className="glass-card p-6 h-fit sticky top-28"
                >
                    <h3 className="text-lg font-display font-semibold mb-6">Order Summary</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between text-surface-200/70">
                            <span>Subtotal ({cart.itemCount} items)</span>
                            <span className="text-white">₹{cart.total.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-surface-200/70">
                            <span>GST (18%)</span>
                            <span className="text-white">₹{Math.round(cart.total * 0.18).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-surface-200/70">
                            <span>Shipping</span>
                            <span className={cart.total >= 999 ? 'text-green-400' : 'text-white'}>
                                {cart.total >= 999 ? 'FREE' : '₹99'}
                            </span>
                        </div>
                        <hr className="border-surface-700 my-4" />
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total</span>
                            <span className="gradient-text">
                                ₹{Math.round(cart.total * 1.18 + (cart.total >= 999 ? 0 : 99)).toLocaleString('en-IN')}
                            </span>
                        </div>
                    </div>

                    <Link
                        to="/checkout"
                        className="w-full gradient-btn py-4 rounded-xl text-center mt-6 flex items-center justify-center gap-2 text-lg"
                    >
                        <span>Proceed to Checkout</span>
                        <ArrowRight size={20} />
                    </Link>

                    <Link to="/products" className="block text-center text-primary-400 hover:text-primary-300 text-sm mt-4 transition-colors">
                        Continue Shopping
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
