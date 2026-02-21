import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { productAPI } from '../services/api';
import ProductCard from '../components/ProductCard';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [filters, setFilters] = useState({ search: '', category: '', sort: 'created_at', order: 'DESC' });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        productAPI.getCategories().then(res => setCategories(res.data)).catch(() => { });
    }, []);

    useEffect(() => {
        setLoading(true);
        productAPI.list({ ...filters, page: pagination.page, limit: 12 })
            .then(res => {
                setProducts(res.data.products);
                setPagination(res.data.pagination);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [filters, pagination.page]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(p => ({ ...p, page: 1 }));
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-4xl font-display font-bold mb-2">
                    All <span className="gradient-text">Products</span>
                </h1>
                <p className="text-surface-200/60">Discover our curated collection of premium products</p>
            </motion.div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <form onSubmit={handleSearch} className="flex-1 relative">
                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-200/40" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={filters.search}
                        onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface-800/50 border border-surface-700 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-white placeholder:text-surface-200/40"
                    />
                    {filters.search && (
                        <button type="button" onClick={() => setFilters(f => ({ ...f, search: '' }))} className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-200/40 hover:text-white">
                            <X size={18} />
                        </button>
                    )}
                </form>

                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl border border-surface-700 hover:border-primary-500/50 transition-all text-surface-200 hover:text-white"
                >
                    <SlidersHorizontal size={18} /> Filters
                </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    className="glass-card p-6 mb-8 overflow-hidden"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {/* Category */}
                        <div>
                            <label className="text-sm font-medium text-surface-200/70 mb-2 block">Category</label>
                            <select
                                value={filters.category}
                                onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl bg-surface-800/50 border border-surface-700 text-white outline-none focus:border-primary-500/50"
                            >
                                <option value="">All Categories</option>
                                {categories.map(c => (
                                    <option key={c.category} value={c.category}>{c.category} ({c.count})</option>
                                ))}
                            </select>
                        </div>

                        {/* Sort */}
                        <div>
                            <label className="text-sm font-medium text-surface-200/70 mb-2 block">Sort By</label>
                            <select
                                value={`${filters.sort}-${filters.order}`}
                                onChange={(e) => {
                                    const [sort, order] = e.target.value.split('-');
                                    setFilters(f => ({ ...f, sort, order }));
                                }}
                                className="w-full px-4 py-3 rounded-xl bg-surface-800/50 border border-surface-700 text-white outline-none focus:border-primary-500/50"
                            >
                                <option value="created_at-DESC">Newest First</option>
                                <option value="created_at-ASC">Oldest First</option>
                                <option value="price-ASC">Price: Low → High</option>
                                <option value="price-DESC">Price: High → Low</option>
                                <option value="name-ASC">Name: A → Z</option>
                            </select>
                        </div>

                        {/* Clear */}
                        <div className="flex items-end">
                            <button
                                onClick={() => setFilters({ search: '', category: '', sort: 'created_at', order: 'DESC' })}
                                className="px-6 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Product Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array(8).fill(0).map((_, i) => (
                        <div key={i} className="glass-card overflow-hidden">
                            <div className="aspect-square skeleton" />
                            <div className="p-4 space-y-3">
                                <div className="h-3 skeleton w-1/3" />
                                <div className="h-5 skeleton w-3/4" />
                                <div className="h-6 skeleton w-1/3" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : products.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-surface-200/50 text-lg">No products found</p>
                    <button
                        onClick={() => setFilters({ search: '', category: '', sort: 'created_at', order: 'DESC' })}
                        className="mt-4 text-primary-400 hover:text-primary-300 transition-colors"
                    >
                        Clear all filters
                    </button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((product, i) => (
                            <ProductCard key={product.id} product={product} index={i} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-12">
                            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setPagination(p => ({ ...p, page }))}
                                    className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${page === pagination.page
                                            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                                            : 'bg-surface-800/50 text-surface-200 hover:bg-surface-700'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
