import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import cartService from '../services/cartService';

interface CartContextType {
  cartCount: number;
  setCartCount: React.Dispatch<React.SetStateAction<number>>;
  fetchCartCount: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartCount, setCartCount] = useState<number>(0);

  const fetchCartCount = async () => {
    try {
      const res = await cartService.getMyCart();
      if (res && res.success && Array.isArray(res.data)) {
        // Count each product once (unique products count)
        const count = res.data.length;
        setCartCount(count);
      } else {
        setCartCount(0);
      }
    } catch (error) {
      console.log('Error fetching cart count:', error);
    }
  };

  useEffect(() => {
    // Initial fetch of cart count
    fetchCartCount();
  }, []);

  return (
    <CartContext.Provider value={{ cartCount, setCartCount, fetchCartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
