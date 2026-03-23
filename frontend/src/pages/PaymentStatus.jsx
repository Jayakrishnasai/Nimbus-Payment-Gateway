import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';

export default function PaymentStatus() {
    const { orderId: routeOrderId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    
    // Support both /payment/:orderId and /payment/status?order=...
    const orderId = (routeOrderId && routeOrderId !== 'status') 
        ? routeOrderId 
        : searchParams.get('order');
        
    const redirectStatus = searchParams.get('status');

    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('pending'); // pending | success | failed | canceled

    const socketRef = useRef(null);
    const pollRef = useRef(null);
    const { clearCart } = useCart();

    useEffect(() => {
        if (!orderId) {
            navigate('/');
            return;
        }

        if (redirectStatus === 'cancel') {
            setStatus('canceled');
            setLoading(false);
            return;
        }

        const fetchPayment = async () => {
            try {
                const { data } = await api.get(`/payments/${orderId}/verify`);
                setPayment(data);

                if (data.status === 'captured') {
                    setStatus('success');
                    clearCart();
                } else if (data.status === 'failed' || data.status === 'expired') {
                    setStatus('failed');
                } else {
                    setStatus('pending');
                }
            } catch (error) {
                console.error(error);
                // Keep polling if not found or error (webhook might not have processed yet)
            } finally {
                setLoading(false);
            }
        };

        fetchPayment();

        // WebSocket real-time updates
        const socket = io(import.meta.env.VITE_WS_URL || window.location.origin, {
            transports: ['websocket', 'polling'],
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('join:order', orderId);
        });

        socket.on('payment:update', (data) => {
            if (data.status === 'success') {
                setStatus('success');
                clearCart();
                clearInterval(pollRef.current);
            } else if (data.status === 'failed' || data.status === 'expired') {
                setStatus('failed');
                clearInterval(pollRef.current);
            }
        });

        // Fallback polling until success or failure
        pollRef.current = setInterval(() => {
            fetchPayment();
        }, 3000);

        return () => {
            socket.disconnect();
            clearInterval(pollRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId, redirectStatus]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 px-4 flex items-center justify-center">
            <div className="max-w-lg w-full">
                <AnimatePresence mode="wait">
                    {/* ── SUCCESS ── */}
                    {status === 'success' && (
                        <motion.div
                            key="success"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="glass-card p-8 text-center"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                            >
                                <CheckCircle className="w-24 h-24 text-green-400 mx-auto mb-6" />
                            </motion.div>
                            <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
                            <p className="text-gray-400 mb-2">
                                Order #{payment?.order_number} has been confirmed.
                            </p>
                            <p className="text-2xl font-bold text-gradient mb-8">
                                ₹{parseFloat(payment?.amount || 0).toLocaleString('en-IN')}
                            </p>
                            <button
                                onClick={() => navigate('/orders')}
                                className="btn-primary w-full"
                            >
                                View Orders
                            </button>
                        </motion.div>
                    )}

                    {/* ── PENDING / VERIFYING ── */}
                    {status === 'pending' && (
                        <motion.div
                            key="pending"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="glass-card p-8 text-center"
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-6"
                            />
                            <h1 className="text-2xl font-bold text-white mb-2">Verifying Payment...</h1>
                            <p className="text-gray-400">
                                Waiting for confirmation from Stripe. This usually takes a few seconds.
                            </p>
                        </motion.div>
                    )}

                    {/* ── CANCELED ── */}
                    {status === 'canceled' && (
                        <motion.div
                            key="canceled"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="glass-card p-8 text-center"
                        >
                            <AlertTriangle className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
                            <h1 className="text-2xl font-bold text-white mb-2">Payment Cancelled</h1>
                            <p className="text-gray-400 mb-6">
                                You cancelled the Stripe checkout process.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => navigate(`/cart`)}
                                    className="btn-primary flex-1"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" /> Return to Cart
                                </button>
                                <button
                                    onClick={() => navigate('/orders')}
                                    className="glass-card px-4 py-2 text-gray-300 hover:text-white flex-1 text-center"
                                >
                                    My Orders
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── FAILED ── */}
                    {status === 'failed' && (
                        <motion.div
                            key="failed"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="glass-card p-8 text-center"
                        >
                            <XCircle className="w-20 h-20 text-red-400 mx-auto mb-6" />
                            <h1 className="text-2xl font-bold text-white mb-2">Payment Failed</h1>
                            <p className="text-gray-400 mb-6">
                                {payment?.error_description || 'Something went wrong with your payment.'}
                            </p>
                            <button
                                onClick={() => navigate(`/checkout`)}
                                className="btn-primary w-full flex justify-center items-center"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" /> Try Again
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
