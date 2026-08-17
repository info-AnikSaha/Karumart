import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/types';

interface CartItem extends Product {
  cartQuantity: number;
}

import { Voucher } from '@/types';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number; // Subtotal
  subtotal: number;
  deliveryFee: number;
  discount: number;
  grandTotal: number;
  appliedVoucher: Voucher | null;
  settings: {
    delivery_charge: number;
    free_delivery_threshold: number;
  };
  applyVoucher: (code: string) => Promise<boolean>;
  removeVoucher: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [settings, setSettings] = useState({
    delivery_charge: 50,
    free_delivery_threshold: 500
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 'site_config')
        .maybeSingle(); 
      if (data) {
        setSettings({
          delivery_charge: typeof data.delivery_charge === 'number' ? data.delivery_charge : 50,
          free_delivery_threshold: typeof data.free_delivery_threshold === 'number' ? data.free_delivery_threshold : 500
        });
      }
    };

    fetchSettings();

    // Subscribe to changes in site_settings
    const channel = supabase
      .channel('site_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings',
          filter: 'id=eq.site_config'
        },
        (payload) => {
          if (payload.new) {
            const data = payload.new as any;
            setSettings({
              delivery_charge: typeof data.delivery_charge === 'number' ? data.delivery_charge : 50,
              free_delivery_threshold: typeof data.free_delivery_threshold === 'number' ? data.free_delivery_threshold : 500
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setItems(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product) => {
    setItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, cartQuantity: item.cartQuantity + 1 } 
            : item
        );
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
  };

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems(prev => prev.map(item => 
      item.id === productId ? { ...item, cartQuantity: quantity } : item
    ));
  };

  const clearCart = () => {
    setItems([]);
    setAppliedVoucher(null);
  };

  const subtotal = items.reduce((sum, item) => {
    const activePrice = (item.flash_sale_active && item.flash_sale_price) 
      ? item.flash_sale_price 
      : item.price;
    return sum + (activePrice * item.cartQuantity);
  }, 0);
  
  const deliveryFee = subtotal >= settings.free_delivery_threshold || items.length === 0 ? 0 : settings.delivery_charge;
  
  let discount = 0;
  if (appliedVoucher) {
    if (appliedVoucher.discount_type === 'percentage') {
      discount = (subtotal * appliedVoucher.value) / 100;
    } else {
      discount = appliedVoucher.value;
    }
  }

  const grandTotal = Math.max(0, subtotal + deliveryFee - discount);

  const applyVoucher = async (code: string) => {
    try {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        toast.error('ভাউচার কোডটি সঠিক নয়');
        return false;
      }

      const voucher = data as Voucher;
      const now = new Date().toISOString();
      if (voucher.expiry_date && voucher.expiry_date < now) {
        toast.error('ভাউচারটির মেয়াদ শেষ হয়ে গেছে');
        return false;
      }

      if (subtotal < voucher.min_purchase) {
        toast.error(`এই ভাউচারটি পেতে হলে অন্তত ৳${voucher.min_purchase} টাকার অর্ডার করতে হবে`);
        return false;
      }

      setAppliedVoucher(voucher);
      toast.success(`${voucher.code} ভাউচারটি অ্যাপ্লাই করা হয়েছে!`);
      return true;
    } catch (err) {
      toast.error('ভাউচার অ্যাপ্লাই করতে সমস্যা হয়েছে');
      return false;
    }
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
  };

  return (
    <CartContext.Provider value={{ 
      items, addItem, removeItem, updateQuantity, clearCart, 
      total: subtotal, subtotal, deliveryFee, discount, grandTotal,
      appliedVoucher, applyVoucher, removeVoucher, settings 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
