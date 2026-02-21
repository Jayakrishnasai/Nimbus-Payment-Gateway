import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import { orderAPI } from '../services/api';

const statusConfig = {
    pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Pending' },
    confirmed: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Confirmed' },
    processing: { icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Processing' },
    shipped: { icon: Truck, color: 'text-primary-400', bg: 'bg-primary-500/10', label: 'Shipped' },
    delivered: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Delivered' },
    cancelled: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Cancelled' },
    refunded: { icon: XCircle, color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'Refunded' },
};

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        orderAPI.list({ limit: 50 })
            .then(res => setOrders(res.data.orders))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="glass-card p-6 h-24 skeleton" />)}</div>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-20 text-center">
                <Package size={48} className="text-surface-200/20 mx-auto mb-4" />
                <h2 className="text-2xl font-display font-bold mb-3">No Orders Yet</h2>
                <p className="text-surface-200/50 mb-6">Start shopping to see your orders here</p>
                <Link to="/products" className="gradient-btn px-6 py-3 rounded-xl inline-block"><span>Browse Products</span></Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-display font-bold mb-8">
                My <span className="gradient-text">Orders</span>
            </motion.h1>

            <div className="space-y-4">
                {orders.map((order, i) => {
                    const sc = statusConfig[order.status] || statusConfig.pending;
                    const Icon = sc.icon;
                    return (
                        <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                            <Link to={order.status === 'pending' ? `/payment/${order.id}` : '#'} className="block glass-card p-5 sm:p-6 hover:border-primary-500/30 transition-all">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl ${sc.bg} flex items-center justify-center`}>
                                            <Icon size={20} className={sc.color} />
                                        </div>
                                        <div>
                                            <p className="font-display font-semibold">{order.order_number}</p>
                                            <p className="text-xs text-surface-200/50">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold">₹{Number(order.total).toLocaleString('en-IN')}</p>
                                        <span className={`text-xs font-medium ${sc.color}`}>{sc.label}</span>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
