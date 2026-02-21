import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);

    if (isAuthenticated) { navigate('/'); return null; }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(form.email, form.password);
            toast.success('Welcome back!');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Login failed');
        } finally { setLoading(false); }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
                <div className="glass-card p-8 sm:p-10">
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mx-auto mb-4">
                            <LogIn size={24} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-display font-bold">Welcome Back</h1>
                        <p className="text-surface-200/50 text-sm mt-1">Sign in to your account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm text-surface-200/70 mb-1.5">Email</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-200/30" />
                                <input type="email" required value={form.email}
                                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface-800/50 border border-surface-700 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-white"
                                    placeholder="john@example.com" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-surface-200/70 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-200/30" />
                                <input type="password" required value={form.password}
                                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface-800/50 border border-surface-700 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-white"
                                    placeholder="••••••••" />
                            </div>
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full gradient-btn py-3.5 rounded-xl text-lg flex items-center justify-center gap-2 disabled:opacity-50">
                            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><LogIn size={20} /><span>Sign In</span></>}
                        </button>
                    </form>

                    <p className="text-center text-surface-200/50 text-sm mt-6">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">Sign Up</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
