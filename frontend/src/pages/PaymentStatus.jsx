import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    QrCode, Clock, CheckCircle, XCircle, Copy, ExternalLink,
    RefreshCw, AlertTriangle, Smartphone, Shield, Timer
} from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function PaymentStatus() {
    const { orderId } = useParams();
    const navigate = useNavigate();

    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(0);
    const [status, setStatus] = useState('pending'); // pending | success | failed | expired
    const [showManualConfirm, setShowManualConfirm] = useState(false);
    const [utrInput, setUtrInput] = useState('');
    const [confirming, setConfirming] = useState(false);
    const [copied, setCopied] = useState(false);

    const socketRef = useRef(null);
    const timerRef = useRef(null);
    const pollRef = useRef(null);

    // Fetch payment details
    const fetchPayment = useCallback(async () => {
        try {
            const { data } = await api.get(`/payments/${orderId}/status`);
            setPayment(data);

            if (data.status === 'captured') {
                setStatus('success');
            } else if (data.status === 'failed') {
                setStatus('failed');
            } else if (data.status === 'expired') {
                setStatus('expired');
            } else {
                setStatus('pending');
                // Calculate time remaining
                if (data.expires_at) {
                    const remaining = Math.max(0, Math.floor((new Date(data.expires_at) - Date.now()) / 1000));
                    setTimeLeft(remaining);
                    if (remaining <= 0) setStatus('expired');
                }
            }
        } catch (error) {
            toast.error('Failed to load payment details');
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    // Countdown timer
    useEffect(() => {
        if (status !== 'pending' || timeLeft <= 0) return;
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    setStatus('expired');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [status, timeLeft]);

    // WebSocket real-time updates
    useEffect(() => {
        fetchPayment();

        const socket = io(import.meta.env.VITE_WS_URL || window.location.origin, {
            transports: ['websocket', 'polling'],
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('join-order', orderId);
        });

        socket.on('payment-update', (data) => {
            if (data.status === 'success') {
                setStatus('success');
                clearInterval(timerRef.current);
                clearInterval(pollRef.current);
                toast.success('Payment confirmed!');
            } else if (data.status === 'failed') {
                setStatus('failed');
            } else if (data.status === 'expired') {
                setStatus('expired');
            }
        });

        // Fallback polling every 5 seconds
        pollRef.current = setInterval(fetchPayment, 5000);

        return () => {
            socket.disconnect();
            clearInterval(timerRef.current);
            clearInterval(pollRef.current);
        };
    }, [orderId, fetchPayment]);

    // Copy VPA to clipboard
    const handleCopyVpa = () => {
        if (payment?.merchant_vpa) {
            navigator.clipboard.writeText(payment.merchant_vpa);
            setCopied(true);
            toast.success('UPI ID copied!');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Open UPI deep link (mobile)
    const handleOpenUpiApp = () => {
        if (payment?.upi_deep_link) {
            window.location.href = payment.upi_deep_link;
        }
    };

    // Manual "I Have Paid" confirmation
    const handleManualConfirm = async () => {
        if (confirming) return;
        setConfirming(true);
        try {
            await api.post(`/payments/${orderId}/confirm`, { utrNumber: utrInput || null });
            toast.success('Payment verification submitted. We\'ll confirm shortly.');
            setShowManualConfirm(false);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Confirmation failed');
        } finally {
            setConfirming(false);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

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
        <div className="min-h-screen py-12 px-4">
            <div className="max-w-lg mx-auto">
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
                            {payment?.utr_number && (
                                <p className="text-sm text-gray-500 mb-6">UTR: {payment.utr_number}</p>
                            )}
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

                    {/* ── EXPIRED ── */}
                    {status === 'expired' && (
                        <motion.div
                            key="expired"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="glass-card p-8 text-center"
                        >
                            <AlertTriangle className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
                            <h1 className="text-2xl font-bold text-white mb-2">Payment Expired</h1>
                            <p className="text-gray-400 mb-6">
                                The payment window has closed. Please try again.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => navigate(`/checkout`)}
                                    className="btn-primary flex-1"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" /> Retry Payment
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
                                className="btn-primary w-full"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" /> Try Again
                            </button>
                        </motion.div>
                    )}

                    {/* ── PENDING — QR + UPI Payment ── */}
                    {status === 'pending' && (
                        <motion.div
                            key="pending"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="space-y-6"
                        >
                            {/* Header */}
                            <div className="text-center">
                                <h1 className="text-2xl font-bold text-white mb-1">Complete Payment</h1>
                                <p className="text-gray-400">
                                    Scan QR or use UPI ID to pay
                                    <span className="text-gradient font-bold ml-2">
                                        ₹{parseFloat(payment?.amount || 0).toLocaleString('en-IN')}
                                    </span>
                                </p>
                            </div>

                            {/* Timer */}
                            <motion.div
                                className={`flex items-center justify-center gap-2 py-2 px-4 rounded-full mx-auto w-fit
                                    ${timeLeft < 60 ? 'bg-red-500/20 text-red-400' : 'bg-purple-500/20 text-purple-300'}`}
                                animate={timeLeft < 60 ? { scale: [1, 1.05, 1] } : {}}
                                transition={{ repeat: Infinity, duration: 1 }}
                            >
                                <Timer className="w-4 h-4" />
                                <span className="font-mono font-bold text-lg">{formatTime(timeLeft)}</span>
                            </motion.div>

                            {/* QR Code Card */}
                            <motion.div
                                className="glass-card p-6"
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200 }}
                            >
                                <div className="flex items-center gap-2 mb-4 justify-center">
                                    <QrCode className="w-5 h-5 text-purple-400" />
                                    <span className="text-sm text-gray-300 font-medium">Scan with any UPI app</span>
                                </div>

                                {/* QR Image */}
                                {payment?.qr_code_url && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.3, type: 'spring' }}
                                        className="bg-white rounded-2xl p-4 w-fit mx-auto mb-4"
                                    >
                                        <img
                                            src={payment.qr_code_url}
                                            alt="UPI QR Code"
                                            className="w-64 h-64"
                                        />
                                    </motion.div>
                                )}

                                {/* UPI App Logos Row */}
                                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-4">
                                    <Smartphone className="w-3 h-3" />
                                    Google Pay • PhonePe • Paytm • BHIM
                                </div>

                                {/* UPI ID + Copy */}
                                <div className="flex items-center gap-2 bg-white/5 rounded-xl p-3">
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 mb-0.5">UPI ID</p>
                                        <p className="text-white font-mono font-medium">{payment?.merchant_vpa}</p>
                                    </div>
                                    <button
                                        onClick={handleCopyVpa}
                                        className={`p-2 rounded-lg transition-all duration-200
                                            ${copied ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-400 hover:text-white'}`}
                                    >
                                        {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                    </button>
                                </div>
                            </motion.div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleOpenUpiApp}
                                    className="btn-primary flex items-center justify-center gap-2 text-sm"
                                >
                                    <ExternalLink className="w-4 h-4" /> Open UPI App
                                </button>
                                <button
                                    onClick={() => setShowManualConfirm(true)}
                                    className="glass-card p-3 text-purple-300 hover:text-white
                                        transition-all text-sm text-center font-medium"
                                >
                                    <Shield className="w-4 h-4 inline mr-1" /> I Have Paid
                                </button>
                            </div>

                            {/* Manual Confirm Drawer */}
                            <AnimatePresence>
                                {showManualConfirm && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="glass-card p-4 overflow-hidden"
                                    >
                                        <h3 className="text-white font-medium mb-3">Enter UTR / Reference Number</h3>
                                        <p className="text-xs text-gray-400 mb-3">
                                            You can find this in your UPI app's transaction history. This helps us verify your payment faster.
                                        </p>
                                        <input
                                            type="text"
                                            placeholder="e.g. 123456789012"
                                            value={utrInput}
                                            onChange={(e) => setUtrInput(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                                                text-white placeholder-gray-500 focus:border-purple-500
                                                focus:outline-none mb-3 font-mono"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleManualConfirm}
                                                disabled={confirming}
                                                className="btn-primary flex-1 text-sm"
                                            >
                                                {confirming ? 'Submitting...' : 'Submit for Verification'}
                                            </button>
                                            <button
                                                onClick={() => setShowManualConfirm(false)}
                                                className="px-4 py-2 text-gray-400 hover:text-white text-sm"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Security Note */}
                            <div className="flex items-start gap-2 text-xs text-gray-500 px-2">
                                <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                                <p>
                                    Payments are verified securely via bank confirmation webhook.
                                    Your payment details are never stored on our servers.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
