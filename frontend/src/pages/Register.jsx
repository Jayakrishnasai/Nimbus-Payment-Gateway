import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, UserPlus } from 'lucide-react';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// eslint-disable-next-line react/prop-types
const Input = ({ icon: Icon, label, value, onChange, type = 'text', required, placeholder }) => (
    <div>
        <label className="block text-sm text-surface-200/70 mb-1.5">{label}</label>
        <div className="relative">
            <Icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-200/30" />
            <input type={type} required={required} value={value}
                onChange={onChange}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface-800/50 border border-surface-700 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-white"
                placeholder={placeholder} />
        </div>
    </div>
);

Input.propTypes = {
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    type: PropTypes.string,
    required: PropTypes.bool,
    placeholder: PropTypes.string
};

export default function Register() {
    const { register, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '' });
    const [loading, setLoading] = useState(false);

    if (isAuthenticated) { navigate('/'); return null; }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
        setLoading(true);
        try {
            await register(form);
            toast.success('Account created!');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Registration failed');
        } finally { setLoading(false); }
    };



    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
                <div className="glass-card p-8 sm:p-10">
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mx-auto mb-4">
                            <UserPlus size={24} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-display font-bold">Create Account</h1>
                        <p className="text-surface-200/50 text-sm mt-1">Start your shopping journey</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input icon={User} label="First Name" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} required placeholder="John" />
                            <Input icon={User} label="Last Name" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} required placeholder="Doe" />
                        </div>
                        <Input icon={Mail} label="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" required placeholder="john@example.com" />
                        <Input icon={Phone} label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
                        <Input icon={Lock} label="Password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} type="password" required placeholder="Min 8 characters" />

                        <button type="submit" disabled={loading}
                            className="w-full gradient-btn py-3.5 rounded-xl text-lg flex items-center justify-center gap-2 disabled:opacity-50 mt-2">
                            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><UserPlus size={20} /><span>Create Account</span></>}
                        </button>
                    </form>

                    <p className="text-center text-surface-200/50 text-sm mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">Sign In</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
