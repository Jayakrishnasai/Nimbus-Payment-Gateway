import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, CreditCard, Lock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { orderAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Checkout() {
    const { cart } = useCart();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [address, setAddress] = useState({ name: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'IN' });

    const tax = Math.round(cart.total * 0.18);
    const shipping = cart.total >= 999 ? 0 : 99;
    const total = Math.round(cart.total + tax + shipping);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!address.name || !address.line1 || !address.city || !address.state || !address.postalCode) {
            toast.error('Please fill all required fields'); return;
        }
        setLoading(true);
        try {
            const res = await orderAPI.create({ shippingAddress: address, billingAddress: address, idempotencyKey: `ck-${Date.now()}` });
            toast.success('Order created!');
            navigate(`/payment/${res.data.id}`);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to create order');
        } finally { setLoading(false); }
    };

    if (cart.items.length === 0) { navigate('/cart'); return null; }

    const Input = ({ label, field, required, placeholder, span2 }) => (
        <div className={span2 ? 'sm:col-span-2' : ''}>
            <label className="block text-sm text-surface-200/70 mb-1.5">{label}{required && ' *'}</label>
            <input type="text" required={required} value={address[field]}
                onChange={e => setAddress(a => ({ ...a, [field]: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-surface-800/50 border border-surface-700 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-white"
                placeholder={placeholder} />
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-display font-bold mb-8">
                <span className="gradient-text">Checkout</span>
            </motion.h1>
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2">
                        <div className="glass-card p-6 sm:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                                    <MapPin size={20} className="text-primary-400" />
                                </div>
                                <h2 className="text-xl font-display font-semibold">Shipping Address</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input label="Full Name" field="name" required placeholder="John Doe" span2 />
                                <Input label="Address Line 1" field="line1" required placeholder="123 Main St" span2 />
                                <Input label="Address Line 2" field="line2" placeholder="Apt 4B" span2 />
                                <Input label="City" field="city" required placeholder="Mumbai" />
                                <Input label="State" field="state" required placeholder="Maharashtra" />
                                <Input label="Postal Code" field="postalCode" required placeholder="400001" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6 h-fit sticky top-28">
                        <h3 className="text-lg font-display font-semibold mb-4">Order Summary</h3>
                        <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                            {cart.items.map(item => (
                                <div key={item.id} className="flex items-center gap-3">
                                    <img src={item.imageUrl} alt="" className="w-12 h-12 object-cover rounded-lg" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate">{item.name}</p>
                                        <p className="text-xs text-surface-200/50">Qty: {item.quantity}</p>
                                    </div>
                                    <p className="text-sm font-medium">₹{item.subtotal.toLocaleString('en-IN')}</p>
                                </div>
                            ))}
                        </div>
                        <hr className="border-surface-700 my-4" />
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-surface-200/70">Subtotal</span><span>₹{cart.total.toLocaleString('en-IN')}</span></div>
                            <div className="flex justify-between"><span className="text-surface-200/70">GST (18%)</span><span>₹{tax.toLocaleString('en-IN')}</span></div>
                            <div className="flex justify-between"><span className="text-surface-200/70">Shipping</span><span className={shipping === 0 ? 'text-green-400' : ''}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
                            <hr className="border-surface-700 my-3" />
                            <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="gradient-text">₹{total.toLocaleString('en-IN')}</span></div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full gradient-btn py-4 rounded-xl mt-6 flex items-center justify-center gap-2 text-lg disabled:opacity-50">
                            {loading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing...</> : <><CreditCard size={20} /><span>Pay ₹{total.toLocaleString('en-IN')}</span></>}
                        </button>
                        <div className="flex items-center justify-center gap-2 mt-4 text-surface-200/40 text-xs"><Lock size={12} />Secured with 256-bit SSL</div>
                    </motion.div>
                </div>
            </form>
        </div>
    );
}
