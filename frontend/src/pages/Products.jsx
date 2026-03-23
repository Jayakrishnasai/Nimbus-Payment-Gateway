/* cspell:ignore Qube */
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { productAPI } from '../services/api';
import ProductCard from '../components/ProductCard';

export default function Products() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    
    // Generate stable IDs for skeletons to satisfy SonarQube S6479
    const skeletonIds = Array.from({ length: 8 }, (_, i) => `skeleton-${i}`);
    
    // Sync filters with URL search params
    const filters = {
        search: searchParams.get('search') || '',
        category: searchParams.get('category') || '',
        sort: searchParams.get('sort') || 'created_at',
        order: searchParams.get('order') || 'DESC'
    };
    const page = Number.parseInt(searchParams.get('page') || '1', 10);

    const [showFilters, setShowFilters] = useState(false);

    const updateFilters = (newFilters) => {
        const params = new URLSearchParams(searchParams);
        Object.entries(newFilters).forEach(([key, value]) => {
            if (value) params.set(key, value);
            else params.delete(key);
        });
        params.set('page', '1'); // Reset to page 1 on filter change
        setSearchParams(params);
    };

    const setPage = (p) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', p.toString());
        setSearchParams(params);
    };

    const clearFilters = () => {
        setSearchParams({});
    };

    useEffect(() => {
        productAPI.getCategories().then(res => setCategories(res.data)).catch(() => { });
    }, []);

    useEffect(() => {
        setLoading(true);
        productAPI.list({ ...filters, page, limit: 12 })
            .then(res => {
                setProducts(res.data.products);
                setPagination(res.data.pagination);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [searchParams]);

    const handleSearch = (e) => {
        e.preventDefault();
        // Filters already sync via updateFilters on input change
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
                        onChange={(e) => updateFilters({ search: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface-800/50 border border-surface-700 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-white placeholder:text-surface-200/40"
                    />
                    {filters.search && (
                        <button type="button" onClick={() => updateFilters({ search: '' })} className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-200/40 hover:text-white">
                            <X size={18} />
                        </button>
                    )}
                </form>

                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl border transition-all ${
                        (showFilters || Object.values(filters).some(v => v !== '' && v !== 'created_at' && v !== 'DESC'))
                            ? 'border-primary-500/50 bg-primary-500/5 text-white shadow-lg shadow-primary-500/10'
                            : 'border-surface-700 text-surface-200 hover:text-white hover:border-border-600'
                    }`}
                >
                    <SlidersHorizontal size={18} />
                    Filters
                    {Object.values(filters).some(v => v !== '' && v !== 'created_at' && v !== 'DESC') && (
                        <span className="ml-1 w-5 h-5 rounded-full bg-primary-500 text-[10px] font-bold flex items-center justify-center text-white">
                            {Object.values(filters).filter(v => v !== '' && v !== 'created_at' && v !== 'DESC').length}
                        </span>
                    )}
                </button>
            </div>

            {/* Category Quick Links */}
            <div className="flex flex-wrap gap-2 mb-8">
                <button
                    onClick={() => updateFilters({ category: '' })}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        filters.category === ''
                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                            : 'bg-surface-800/50 text-surface-200 hover:bg-surface-700'
                    }`}
                >
                    All Categories
                </button>
                {categories.map(c => (
                    <button
                        key={c.category}
                        onClick={() => updateFilters({ category: c.category })}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            filters.category === c.category
                                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                                : 'bg-surface-800/50 text-surface-200 hover:bg-surface-700'
                        }`}
                    >
                        {c.category}
                    </button>
                ))}
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
                            <label htmlFor="category-select" className="text-sm font-medium text-surface-200/70 mb-2 block">Category</label>
                            <select
                                id="category-select"
                                value={filters.category}
                                onChange={(e) => updateFilters({ category: e.target.value })}
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
                            <label htmlFor="sort-select" className="text-sm font-medium text-surface-200/70 mb-2 block">Sort By</label>
                            <select
                                id="sort-select"
                                value={`${filters.sort}-${filters.order}`}
                                onChange={(e) => {
                                    const [sort, order] = e.target.value.split('-');
                                    updateFilters({ sort, order });
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
                                onClick={clearFilters}
                                className="px-6 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all font-medium"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
            {/* Product Grid Section */}
            {(() => {
                if (loading) {
                    return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {skeletonIds.map((id) => (
                                <div key={id} className="glass-card overflow-hidden group">
                                    <div className="aspect-[4/5] relative overflow-hidden bg-surface-800">
                                        <div className="absolute inset-0 skeleton" />
                                    </div>
                                    <div className="p-5 space-y-4">
                                        <div className="space-y-2">
                                            <div className="h-4 skeleton w-1/4 rounded-full" />
                                            <div className="h-6 skeleton w-3/4 rounded-lg" />
                                        </div>
                                        <div className="flex items-center justify-between pt-2">
                                            <div className="h-7 skeleton w-1/3 rounded-lg" />
                                            <div className="h-10 skeleton w-10 rounded-xl" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                }

                if (products.length === 0) {
                    return (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-24 glass-card border-dashed border-2 border-surface-700/50"
                        >
                            <div className="w-20 h-20 bg-surface-800/50 rounded-full flex items-center justify-center mx-auto mb-6 text-surface-400">
                                <Search size={40} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-2xl font-display font-bold text-white mb-2">No products found</h3>
                            <p className="text-surface-200/60 max-w-sm mx-auto mb-8">
                                We couldn't find any products matching your current filters. Try adjusting your search or category.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button
                                    onClick={clearFilters}
                                    className="gradient-btn px-6 py-3 rounded-xl flex items-center gap-2"
                                >
                                    <X size={18} /> Clear All Filters
                                </button>
                                <Link
                                    to="/"
                                    className="px-6 py-3 rounded-xl border border-surface-700 text-surface-200 hover:text-white hover:bg-surface-800/50 transition-all font-medium"
                                >
                                    Back to Home
                                </Link>
                            </div>
                        </motion.div>
                    );
                }

                return (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {products.map((product, i) => (
                                <ProductCard key={product.id} product={product} index={i} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-12">
                                {new Array(pagination.totalPages).fill(0).map((_, i) => {
                                    const p = i + 1;
                                    const isActive = p === page;
                                    return (
                                        <button
                                            key={`pagination-page-${p}`}
                                            onClick={() => setPage(p)}
                                            className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${isActive
                                                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                                                : 'bg-surface-800/50 text-surface-200 hover:bg-surface-700'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </>
                );
            })()}
        </div>
    );
}
