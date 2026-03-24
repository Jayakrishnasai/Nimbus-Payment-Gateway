import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import PropTypes from 'prop-types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { usePermission } from './hooks/usePermission';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import PaymentStatus from './pages/PaymentStatus';
import Login from './pages/Login';
import Register from './pages/Register';
import Orders from './pages/Orders';

function ProtectedRoute({ children, permission, roles }) {
    const { isAuthenticated, loading } = useAuth();
    const hasPermission = usePermission(permission, roles);

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
    
    if (!isAuthenticated) return <Navigate to="/login" />;
    
    if (permission || roles.length > 0) {
        if (!hasPermission) return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                <h2 className="text-3xl font-bold text-white mb-2">Access Denied</h2>
                <p className="text-surface-200/60 mb-6">You do not have the required permissions to view this page.</p>
                <Navigate to="/" delay={3000} /> {/* Optional auto-redirect */}
                <Link to="/" className="text-primary-400 hover:text-primary-300">Return Home</Link>
            </div>
        );
    }

    return children;
}

ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired,
    permission: PropTypes.string,
    roles: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
};

ProtectedRoute.defaultProps = {
    permission: null,
    roles: [],
};

// Placeholders for demo
const AdminDashboard = () => <div className="p-8 text-center"><h1 className="text-2xl font-bold">Admin System Control</h1><p>Full system access granted.</p></div>;
const VendorDashboard = () => <div className="p-8 text-center"><h1 className="text-2xl font-bold">Vendor Merchant Portal</h1><p>Manage your products and orders.</p></div>;

function AppRoutes() {
    return (
        <div className="min-h-screen bg-surface-950">
            <Navbar />
            <main className="pt-20">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                    <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                    <Route path="/payment/:orderId" element={<ProtectedRoute><PaymentStatus /></ProtectedRoute>} />
                    <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute permission="analytics:view"><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/vendor/dashboard" element={<ProtectedRoute roles="vendor"><VendorDashboard /></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>
        </div>
    );
}

export default function App() {
    return (
        <Router>
            <AuthProvider>
                <CartProvider>
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 3000,
                            style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid rgba(99,102,241,0.2)' },
                            success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
                            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
                        }}
                    />
                    <AppRoutes />
                </CartProvider>
            </AuthProvider>
        </Router>
    );
}
