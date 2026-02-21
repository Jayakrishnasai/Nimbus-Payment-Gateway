import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const { isAuthenticated } = useAuth();
    const [cart, setCart] = useState({ items: [], total: 0, itemCount: 0 });
    const [loading, setLoading] = useState(false);

    const fetchCart = useCallback(async () => {
        if (!isAuthenticated) {
            setCart({ items: [], total: 0, itemCount: 0 });
            return;
        }
        try {
            setLoading(true);
            const res = await cartAPI.get();
            setCart(res.data);
        } catch (err) {
            console.error('Failed to fetch cart:', err);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    const addItem = async (productId, quantity = 1) => {
        try {
            const res = await cartAPI.addItem(productId, quantity);
            setCart(res.data);
            toast.success('Added to cart!', { icon: '🛒' });
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to add item');
            throw err;
        }
    };

    const updateItem = async (productId, quantity) => {
        try {
            const res = await cartAPI.updateItem(productId, quantity);
            setCart(res.data);
        } catch (err) {
            toast.error('Failed to update cart');
            throw err;
        }
    };

    const removeItem = async (productId) => {
        try {
            const res = await cartAPI.removeItem(productId);
            setCart(res.data);
            toast.success('Removed from cart');
        } catch (err) {
            toast.error('Failed to remove item');
            throw err;
        }
    };

    const clearCart = async () => {
        try {
            const res = await cartAPI.clear();
            setCart(res.data);
        } catch (err) {
            toast.error('Failed to clear cart');
        }
    };

    return (
        <CartContext.Provider value={{ cart, loading, addItem, updateItem, removeItem, clearCart, fetchCart }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within CartProvider');
    return ctx;
};
