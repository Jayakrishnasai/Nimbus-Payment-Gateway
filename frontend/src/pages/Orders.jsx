import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Package, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import { orderAPI } from '../services/api';

// ✅ Safe status config (frozen to prevent mutation)
const statusConfig = Object.freeze({
    pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Pending' },
    confirmed: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Confirmed' },
    processing: { icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Processing' },
    shipped: { icon: Truck, color: 'text-primary-400', bg: 'bg-primary-500/10', label: 'Shipped' },
    delivered: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Delivered' },
    cancelled: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Cancelled' },
    refunded: { icon: XCircle, color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'Refunded' },
});

// ✅ Utility: Safe date formatting (memo-friendly)
const formatDate = (dateStr) => {
    try {
        return new Intl.DateTimeFormat('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(dateStr));
    } catch {
        return 'Invalid date';
    }
};

// ✅ Validate order status
const getStatusConfig = (status) => {
    return statusConfig[status] || statusConfig.pending;
};

function OrderCardContent({ order, sc, Icon }) {
    return (
        <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${sc.bg} flex items-center justify-center`}>
                    <Icon size={20} className={sc.color} />
                </div>
                <div>
                    <p className="font-display font-semibold">{order.order_number}</p>
                    <p className="text-xs text-surface-200/50">
                        {formatDate(order.created_at)}
                    </p>
                </div>
            </div>

            <div className="text-right">
                <p className="text-lg font-bold">
                    ₹{Number(order.total || 0).toLocaleString('en-IN')}
                </p>

                <span className={`text-xs font-medium ${sc.color}`}>
                    {sc.label}
                </span>

                {/* ✅ Optional: Risk flag (future AI integration) */}
                {order.risk_score > 80 && (
                    <p className="text-xs text-red-400 mt-1">⚠ High Risk</p>
                )}
            </div>
        </div>
    );
}

OrderCardContent.propTypes = {
    order: PropTypes.shape({
        order_number: PropTypes.string.isRequired,
        created_at: PropTypes.string.isRequired,
        total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        status: PropTypes.string.isRequired,
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        risk_score: PropTypes.number,
    }).isRequired,
    sc: PropTypes.shape({
        bg: PropTypes.string.isRequired,
        color: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
    }).isRequired,
    Icon: PropTypes.elementType.isRequired,
};

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ✅ Fetch orders (safe + reusable)
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await orderAPI.list({ limit: 20 });

            if (!res?.data?.orders) {
                throw new Error("Invalid API response");
            }

            setOrders(res.data.orders);
        } catch (err) {
            console.error("Order fetch failed:", err);
            setError("Failed to load orders. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    // ✅ Cleanup-safe effect
    useEffect(() => {
        let isMounted = true;

        const safeFetch = async () => {
            try {
                const res = await orderAPI.list({ limit: 20 });

                if (isMounted && res?.data?.orders) {
                    setOrders(res.data.orders);
                }
            } catch (err) {
                if (isMounted) {
                    console.error(err);
                    setError("Failed to load orders.");
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        safeFetch();

        return () => {
            isMounted = false;
        };
    }, []);

    // 🔄 Loading UI
    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="space-y-4">
                    {Array.from({ length: 3 }, (_, i) => (
                        <div key={i} className="glass-card p-6 h-24 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    // ❌ Error UI
    if (error) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-20 text-center">
                <XCircle size={48} className="text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-3">Something went wrong</h2>
                <p className="text-surface-200/50 mb-6">{error}</p>
                <button
                    onClick={fetchOrders}
                    className="gradient-btn px-6 py-3 rounded-xl"
                >
                    Retry
                </button>
            </div>
        );
    }

    // 📦 Empty State
    if (orders.length === 0) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-20 text-center">
                <Package size={48} className="text-surface-200/20 mx-auto mb-4" />
                <h2 className="text-2xl font-display font-bold mb-3">
                    No Orders Yet
                </h2>
                <p className="text-surface-200/50 mb-6">
                    Start shopping to see your orders here
                </p>
                <Link
                    to="/products"
                    className="gradient-btn px-6 py-3 rounded-xl inline-block"
                >
                    <span>Browse Products</span>
                </Link>
            </div>
        );
    }

    // ✅ Main UI
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-display font-bold mb-8"
            >
                My <span className="gradient-text">Orders</span>
            </motion.h1>

            <div className="space-y-4">
                {orders.map((order, i) => {
                    const sc = getStatusConfig(order.status);
                    const Icon = sc.icon;

                    return (
                        <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            {order.status === 'pending' ? (
                                <Link
                                    to={`/payment/${order.id}`}
                                    className="block glass-card p-5 sm:p-6 hover:border-primary-500/30 transition-all"
                                >
                                    <OrderCardContent order={order} sc={sc} Icon={Icon} />
                                </Link>
                            ) : (
                                <div className="glass-card p-5 sm:p-6 border-surface-800/50 opacity-90">
                                    <OrderCardContent order={order} sc={sc} Icon={Icon} />
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
