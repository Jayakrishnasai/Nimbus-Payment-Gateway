import { useState, useEffect, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Minus, Plus, ArrowLeft, Package, Shield, Truck, Star } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, MeshDistortMaterial } from '@react-three/drei';
import { productAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

function Product3DViewer() {
    return (
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} color="#6366f1" />
            <pointLight position={[-10, -10, -5]} intensity={0.5} color="#d946ef" />
            <Suspense fallback={null}>
                <Box args={[2, 2, 2]}>
                    <MeshDistortMaterial
                        color="#6366f1"
                        roughness={0.1}
                        metalness={0.8}
                        distort={0.3}
                        speed={2}
                    />
                </Box>
            </Suspense>
            <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={4} />
        </Canvas>
    );
}

export default function ProductDetail() {
    const { id } = useParams();
    const { isAuthenticated } = useAuth();
    const { addItem } = useCart();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [show3D, setShow3D] = useState(false);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        setLoading(true);
        productAPI.getById(id)
            .then(res => setProduct(res.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [id]);

    const handleAddToCart = async () => {
        if (!isAuthenticated) {
            window.location.href = '/login';
            return;
        }
        setAdding(true);
        try {
            await addItem(product.id, quantity);
        } finally {
            setAdding(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="aspect-square skeleton rounded-2xl" />
                    <div className="space-y-4">
                        <div className="h-4 skeleton w-1/4" />
                        <div className="h-8 skeleton w-3/4" />
                        <div className="h-4 skeleton w-full" />
                        <div className="h-4 skeleton w-2/3" />
                        <div className="h-10 skeleton w-1/3 mt-6" />
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-20 text-center">
                <p className="text-surface-200/50 text-lg mb-4">Product not found</p>
                <Link to="/products" className="text-primary-400 hover:text-primary-300">← Back to products</Link>
            </div>
        );
    }

    const discount = product.compare_price
        ? Math.round((1 - product.price / product.compare_price) * 100)
        : 0;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumb */}
            <Link to="/products" className="inline-flex items-center gap-2 text-surface-200/60 hover:text-primary-400 transition-colors mb-8 text-sm">
                <ArrowLeft size={16} /> Back to Products
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Image / 3D Viewer */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="glass-card overflow-hidden rounded-2xl">
                        {show3D ? (
                            <div className="aspect-square">
                                <Product3DViewer />
                            </div>
                        ) : (
                            <div className="aspect-square relative">
                                <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                                {discount > 0 && (
                                    <span className="absolute top-4 left-4 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white text-sm font-bold rounded-full">
                                        Save {discount}%
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Toggle 3D */}
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={() => setShow3D(false)}
                            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${!show3D ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'bg-surface-800/50 text-surface-200 border border-surface-700'}`}
                        >
                            📷 Photo View
                        </button>
                        <button
                            onClick={() => setShow3D(true)}
                            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${show3D ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'bg-surface-800/50 text-surface-200 border border-surface-700'}`}
                        >
                            🧊 3D Preview
                        </button>
                    </div>
                </motion.div>

                {/* Details */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="space-y-6"
                >
                    {product.category && (
                        <span className="text-primary-400 text-sm font-semibold uppercase tracking-wider">
                            {product.category}
                        </span>
                    )}

                    <h1 className="text-3xl sm:text-4xl font-display font-bold">
                        {product.name}
                    </h1>

                    {/* Rating placeholder */}
                    <div className="flex items-center gap-2">
                        <div className="flex">
                            {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} size={18} className={s <= 4 ? 'text-amber-400 fill-amber-400' : 'text-surface-700'} />
                            ))}
                        </div>
                        <span className="text-surface-200/50 text-sm">(4.0) · 128 reviews</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-4">
                        <span className="text-4xl font-bold text-white">
                            ₹{Number(product.price).toLocaleString('en-IN')}
                        </span>
                        {product.compare_price && (
                            <span className="text-xl text-surface-200/40 line-through">
                                ₹{Number(product.compare_price).toLocaleString('en-IN')}
                            </span>
                        )}
                    </div>

                    <p className="text-surface-200/70 leading-relaxed">
                        {product.description}
                    </p>

                    {/* Stock */}
                    <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${product.stock > 10 ? 'bg-green-500' : product.stock > 0 ? 'bg-amber-500' : 'bg-red-500'}`} />
                        <span className={`text-sm ${product.stock > 10 ? 'text-green-400' : product.stock > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                            {product.stock > 10 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} left` : 'Out of Stock'}
                        </span>
                    </div>

                    {/* Quantity & Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <div className="flex items-center gap-4 bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-1 hover:text-primary-400 transition-colors">
                                <Minus size={18} />
                            </button>
                            <span className="w-8 text-center font-medium">{quantity}</span>
                            <button onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))} className="p-1 hover:text-primary-400 transition-colors">
                                <Plus size={18} />
                            </button>
                        </div>

                        <button
                            onClick={handleAddToCart}
                            disabled={adding || product.stock === 0}
                            className="flex-1 gradient-btn py-4 rounded-xl text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {adding ? (
                                <span className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Adding...</span>
                            ) : (
                                <span className="flex items-center gap-2"><ShoppingCart size={20} /> Add to Cart</span>
                            )}
                        </button>
                    </div>

                    {/* Benefits */}
                    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-surface-800">
                        {[
                            { icon: Truck, label: 'Free Shipping' },
                            { icon: Shield, label: 'Secure Payment' },
                            { icon: Package, label: 'Easy Returns' },
                        ].map(b => (
                            <div key={b.label} className="text-center">
                                <b.icon size={20} className="text-primary-400 mx-auto mb-1" />
                                <p className="text-xs text-surface-200/50">{b.label}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
