import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/contexts/AuthContext';
import { Profile, Product, Order, Banner, StaticBanner, SidePromoBanner, Voucher, Complaint, AdminLog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { generateProductDescription } from '@/services/geminiService';
import { InvoiceModal } from '@/components/InvoiceModal';
import { DeliverySlipModal } from '@/components/DeliverySlipModal';
import { logAdminAction } from '@/services/adminService';
import { getTranslatedCategory, COMMON_CATEGORIES } from '@/lib/translations';
import { 
  Users, ShoppingBag, Package, TrendingUp, UserPlus, Check, X, Edit2, Award,
  Settings, Lock, Image as ImageIcon, Trash2, Plus, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon,
  Search, ExternalLink, LayoutDashboard, UserCheck, Store, FileImage, CheckSquare,
  MapPin, Calendar, Truck, User, Snowflake, Wallet, CheckCircle2, ShieldCheck,
  Smartphone, CreditCard, Tag, AlertTriangle, History, Ticket, ArrowRight,
  ShieldAlert, RefreshCcw, Copy, Sparkles, Wand2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';

const FlashSaleRow: React.FC<{ product: Product, onUpdate: (productId: string, active: boolean, salePrice?: number) => Promise<void> }> = ({ product, onUpdate }) => {
  const [salePrice, setSalePrice] = useState(product.flash_sale_price || Math.floor(product.price * 0.8));
  
  return (
    <TableRow className="hover:bg-gray-50/50">
      <TableCell className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-gray-800">{product.name}</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{product.sku}</span>
          </div>
        </div>
      </TableCell>
      <TableCell className="py-3 px-4">
        <span className="font-mono font-bold text-gray-600">৳{product.price}</span>
      </TableCell>
      <TableCell className="py-3 px-4">
        <Badge variant={product.flash_sale_active ? "default" : "outline"} className={product.flash_sale_active ? "bg-orange-100 text-orange-700 border-none" : "text-gray-400"}>
          {product.flash_sale_active ? 'অ্যাক্টিভ' : 'নিস্ক্রিয়'}
        </Badge>
      </TableCell>
      <TableCell className="py-3 px-4">
        <div className="flex items-center gap-2 max-w-[120px]">
          <span className="text-gray-400">৳</span>
          <Input 
            type="number" 
            value={salePrice} 
            onChange={(e) => setSalePrice(Number(e.target.value))}
            className="h-8 text-xs font-bold font-mono"
          />
        </div>
      </TableCell>
      <TableCell className="py-3 px-4 text-right">
        <Button 
          size="sm"
          variant={product.flash_sale_active ? "destructive" : "default"}
          className={`h-8 px-4 rounded-lg font-black text-[10px] uppercase tracking-wider ${!product.flash_sale_active ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
          onClick={() => onUpdate(product.id, !product.flash_sale_active, salePrice)}
        >
          {product.flash_sale_active ? 'বন্ধ করুন' : 'চালু করুন'}
        </Button>
      </TableCell>
    </TableRow>
  );
};

const SQL_SETUP_CODE = `-- Database Setup SQL for Karumart (Ver 2.6 - Exhaustive RLS Fix)
-- This script clears all existing policies and sets up fresh, robust ones for ALL tables.

-- 1. Nuclear Policy Drop (Removes ALL policies on all tables to start fresh)
DO $$ 
DECLARE 
  pol RECORD;
BEGIN 
  FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
  LOOP 
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON ' || quote_ident(pol.tablename);
  END LOOP;
END $$;

-- 2. Ensure ALL Tables Exist
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY, 
  hotline TEXT, 
  email TEXT, 
  delivery_charge DECIMAL DEFAULT 50, 
  free_delivery_threshold DECIMAL DEFAULT 500, 
  flash_sale_bg_color TEXT DEFAULT 'from-orange-500 to-red-600',
  flash_sale_bg_image TEXT,
  flash_sale_end_time TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Ensure new columns exist for existing tables
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS delivery_charge DECIMAL DEFAULT 50;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS free_delivery_threshold DECIMAL DEFAULT 500;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS flash_sale_bg_color TEXT DEFAULT 'from-orange-500 to-red-600';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS flash_sale_bg_image TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS flash_sale_end_time TIMESTAMPTZ;

INSERT INTO site_settings (id, hotline, email, delivery_charge, free_delivery_threshold, flash_sale_bg_color) 
VALUES ('site_config', '+880123456789', 'support@karumart.com', 50, 500, 'from-orange-500 to-red-600') 
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS profiles (id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY, full_name TEXT, email TEXT, role TEXT DEFAULT 'consumer', phone TEXT, address TEXT, status TEXT DEFAULT 'pending', shop_name TEXT, shop_description TEXT, shop_status TEXT DEFAULT 'open', avatar_url TEXT, is_frozen BOOLEAN DEFAULT false, badge_best_seller BOOLEAN DEFAULT false, badge_official BOOLEAN DEFAULT false, badge_krishi_mall BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());

CREATE TABLE IF NOT EXISTS products (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, farmer_id UUID REFERENCES profiles(id) ON DELETE CASCADE, name TEXT NOT NULL, description TEXT, price DECIMAL NOT NULL, quantity INTEGER NOT NULL DEFAULT 0, unit TEXT DEFAULT 'Kg', category TEXT, image_url TEXT, is_approved BOOLEAN DEFAULT false, sku TEXT UNIQUE, flash_sale_active BOOLEAN DEFAULT false, flash_sale_price DECIMAL, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
-- Ensure columns exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS flash_sale_active BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS flash_sale_price DECIMAL;

CREATE TABLE IF NOT EXISTS orders (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, consumer_id UUID REFERENCES profiles(id), delivery_man_id UUID REFERENCES profiles(id), total_amount DECIMAL NOT NULL, subtotal DECIMAL, delivery_fee DECIMAL, discount_amount DECIMAL, voucher_code TEXT, status TEXT DEFAULT 'pending', payment_method TEXT DEFAULT 'cod', payment_status TEXT DEFAULT 'unpaid', transaction_id TEXT, address TEXT, phone TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
-- Ensure new columns exist for existing orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal DECIMAL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS voucher_code TEXT;

CREATE TABLE IF NOT EXISTS order_items (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, order_id UUID REFERENCES orders(id) ON DELETE CASCADE, product_id UUID REFERENCES products(id), quantity INTEGER NOT NULL, price_at_time DECIMAL NOT NULL, status TEXT DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT NOW());

CREATE TABLE IF NOT EXISTS banners (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, image_url TEXT, title TEXT, subtitle TEXT, link_url TEXT, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS static_banners (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, image_url TEXT, link_url TEXT, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS side_promo_banners (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, image_url TEXT, link_url TEXT, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS vouchers (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, code TEXT UNIQUE, discount_amount DECIMAL, discount_type TEXT, min_purchase DECIMAL, expiry_date DATE, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS complaints (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID REFERENCES profiles(id), order_id UUID REFERENCES orders(id), subject TEXT, description TEXT, status TEXT DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS reviews (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, product_id UUID REFERENCES products(id) ON DELETE CASCADE, consumer_id UUID REFERENCES profiles(id) ON DELETE CASCADE, rating INTEGER NOT NULL DEFAULT 5, comment TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS admin_logs (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, admin_id UUID REFERENCES profiles(id), action TEXT, target_id TEXT, details TEXT, created_at TIMESTAMPTZ DEFAULT NOW());

-- 3. Enable RLS on ALL tables
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE static_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE side_promo_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- 4. Unified Permissive Policies for ALL Tables
-- Using a loop to apply generic permissive policies to all tables for simplicity and robustness
DO $$ 
DECLARE 
  tab RECORD;
BEGIN 
  FOR tab IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
  LOOP 
    EXECUTE 'CREATE POLICY ' || quote_ident(tab.tablename || '_all_policy') || ' ON ' || quote_ident(tab.tablename) || ' FOR ALL TO public USING (true) WITH CHECK (true)';
  END LOOP;
END $$;`;

export default function AdminDashboard() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [farmers, setFarmers] = useState<Profile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [staticBanners, setStaticBanners] = useState<StaticBanner[]>([]);
  const [sidePromoBanners, setSidePromoBanners] = useState<SidePromoBanner[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '', fullName: '' });
  const [newBanner, setNewBanner] = useState({ image_url: '', title: '', subtitle: '', link_url: '' });
  const [newStaticBanner, setNewStaticBanner] = useState({ image_url: '', link_url: '' });
  const [newSidePromoBanner, setNewSidePromoBanner] = useState({ image_url: '', link_url: '' });
  const [addingBanner, setAddingBanner] = useState(false);
  const [addingStaticBanner, setAddingStaticBanner] = useState(false);
  const [addingSidePromoBanner, setAddingSidePromoBanner] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<string | null>(null);
  const [staticBannerToDelete, setStaticBannerToDelete] = useState<string | null>(null);
  const [sidePromoBannerToDelete, setSidePromoBannerToDelete] = useState<string | null>(null);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [emailData, setEmailData] = useState({ newEmail: '' });
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedOverviewMonth, setSelectedOverviewMonth] = useState<number>(new Date().getMonth());
  const [selectedOverviewYear, setSelectedOverviewYear] = useState<number>(new Date().getFullYear());
  const [selectedOverviewSubRange, setSelectedOverviewSubRange] = useState<string>('full');
  const [selectedOverviewDay, setSelectedOverviewDay] = useState<number>(new Date().getDate());
  const [selectedSalesDate, setSelectedSalesDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sellerSearchQuery, setSellerSearchQuery] = useState('');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderDateFilter, setOrderDateFilter] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [flashSaleSearchQuery, setFlashSaleSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    price: 0,
    quantity: 0,
    category: '',
    description: '',
    sku: '',
    image_url: '',
    is_approved: false
  });
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);
  const [isGeneratingSKUs, setIsGeneratingSKUs] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // Site Settings state
  const [siteSettings, setSiteSettings] = useState({
    id: 'site_config',
    hotline: '+880123456789',
    email: 'support@karumart.com',
    delivery_charge: 50,
    free_delivery_threshold: 500,
    flash_sale_bg_color: 'from-orange-500 to-red-600',
    flash_sale_bg_image: '',
    flash_sale_end_time: ''
  });
  const [updatingSiteSettings, setUpdatingSiteSettings] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ table: string; status: 'ok' | 'error' | 'pending' }[]>([]);

  const profile = users.find(u => u.id === user?.id);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      const [farmersRes, productsRes, ordersRes, usersRes, bannersRes, staticBannersRes, sidePromoBannersRes, orderItemsRes, settingsRes, vouchersRes, complaintsRes, logsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'farmer').order('created_at', { ascending: false }),
        supabase.from('products').select('*, farmer:profiles!farmer_id(*)').order('created_at', { ascending: false }),
        supabase.from('orders').select(`
          *,
          consumer:profiles!consumer_id (*),
          delivery_man:profiles!delivery_man_id (*)
        `).order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('banners').select('*').order('created_at', { ascending: false }),
        supabase.from('static_banners').select('*').order('created_at', { ascending: false }),
        supabase.from('side_promo_banners').select('*').order('created_at', { ascending: false }),
        supabase.from('order_items').select('*, products!product_id(name, category, image_url, sku, farmer:profiles!farmer_id(*)), orders:orders!order_id!inner(status, created_at)'),
        supabase.from('site_settings').select('*').eq('id', 'site_config').maybeSingle(),
        supabase.from('vouchers').select('*').order('created_at', { ascending: false }),
        supabase.from('complaints').select('*, order:orders!order_id(*), consumer:profiles!user_id(*)').order('created_at', { ascending: false }),
        supabase.from('admin_logs').select('*, admin:profiles!admin_id(*)').order('created_at', { ascending: false })
      ]);

      if (farmersRes.error) console.error('Farmers Error:', farmersRes.error);
      if (productsRes.error) console.error('Products Error:', productsRes.error);
      if (ordersRes.error) console.error('Orders Error:', ordersRes.error);
      if (usersRes.error) console.error('Users Error:', usersRes.error);
      if (bannersRes.error) console.error('Banners Error:', bannersRes.error);
      if (staticBannersRes.error) console.error('Static Banners Error:', staticBannersRes.error);
      if (orderItemsRes.error) console.error('Order Items Error:', orderItemsRes.error);
      if (vouchersRes.error) console.error('Vouchers Error:', vouchersRes.error);
      if (complaintsRes.error) console.error('Complaints Error:', complaintsRes.error);
      if (logsRes.error) console.error('Logs Error:', logsRes.error);
      if (settingsRes.error) console.error('Settings Error:', settingsRes.error);

      // Track DB Status for debugging
      setDbStatus([
        { table: 'profiles', status: farmersRes.error ? 'error' : 'ok' },
        { table: 'products', status: productsRes.error ? 'error' : 'ok' },
        { table: 'orders', status: ordersRes.error ? 'error' : 'ok' },
        { table: 'site_settings', status: settingsRes.error ? 'error' : 'ok' },
        { table: 'admin_logs', status: logsRes.error ? 'error' : 'ok' },
        { table: 'vouchers', status: vouchersRes.error ? 'error' : 'ok' },
        { table: 'banners', status: bannersRes.error ? 'error' : 'ok' },
        { table: 'complaints', status: complaintsRes.error ? 'error' : 'ok' },
        { table: 'order_items', status: orderItemsRes.error ? 'error' : 'ok' },
        { table: 'static_banners', status: staticBannersRes.error ? 'error' : 'ok' },
        { table: 'side_promo_banners', status: sidePromoBannersRes.error ? 'error' : 'ok' }
      ]);

      setFarmers(farmersRes.data || []);
      setProducts(productsRes.data || []);
      setOrders(ordersRes.data || []);
      setUsers(usersRes.data || []);
      setBanners(bannersRes.data || []);
      setStaticBanners(staticBannersRes.data || []);
      setSidePromoBanners(sidePromoBannersRes.data || []);
      setOrderItems(orderItemsRes.data || []);
      setVouchers(vouchersRes.data || []);
      setComplaints(complaintsRes.data || []);
      setAdminLogs(logsRes.data || []);
      
      if (settingsRes.data) {
        setSiteSettings({
          id: 'site_config',
          hotline: settingsRes.data.hotline || '+880123456789',
          email: settingsRes.data.email || 'support@karumart.com',
          delivery_charge: Number(settingsRes.data.delivery_charge ?? 50),
          free_delivery_threshold: Number(settingsRes.data.free_delivery_threshold ?? 500),
          flash_sale_bg_color: settingsRes.data.flash_sale_bg_color || 'from-orange-500 to-red-600',
          flash_sale_bg_image: settingsRes.data.flash_sale_bg_image || '',
          flash_sale_end_time: settingsRes.data.flash_sale_end_time || ''
        });
      }

      if (farmersRes.error || productsRes.error || ordersRes.error) {
        throw new Error(farmersRes.error?.message || productsRes.error?.message || ordersRes.error?.message || 'Data fetch failed');
      }
    } catch (error: any) {
      console.error('Error fetching admin data:', error);
      toast.error(t.toastErrorLoadingData + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
      toast.success(t.updateStatus);
      
      // Update local state to reflect change immediately
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: status as any } : o));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: status as any });
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleFarmerStatus = async (farmerId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase.from('profiles').update({ status }).eq('id', farmerId);
      if (error) throw error;
      toast.success(status === 'approved' ? t.approved : t.rejected);
      fetchAllData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleProductApproval = async (productId: string, isApproved: boolean) => {
    try {
      const { error } = await supabase.from('products').update({ is_approved: isApproved }).eq('id', productId);
      if (error) throw error;
      toast.success(isApproved ? t.approved : t.rejected);
      fetchAllData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleFlashSaleUpdate = async (productId: string, active: boolean, salePrice?: number) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          flash_sale_active: active, 
          flash_sale_price: salePrice 
        })
        .eq('id', productId);
      
      if (error) throw error;
      toast.success(active ? 'ফ্ল্যাশ সেল অ্যাক্টিভ করা হয়েছে' : 'ফ্ল্যাশ সেল বন্ধ করা হয়েছে');
      fetchAllData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      toast.success(t.delete);
      setProductToDelete(null);
      fetchAllData();
    } catch (error: any) {
      toast.error(t.toastErrorDeletingProduct + ': ' + error.message);
    }
  };

  const productCategories = COMMON_CATEGORIES;

  const handleAIDescription = async () => {
    if (!editFormData.name) {
      toast.error('অনুগ্রহ করে আগে পণ্যের নাম লিখুন');
      return;
    }

    try {
      setIsGeneratingDescription(true);
      const description = await generateProductDescription(editFormData.name, editFormData.category);
      setEditFormData(prev => ({ ...prev, description }));
      toast.success('AI দ্বারা বিবরণ তৈরি করা হয়েছে!');
    } catch (error) {
      toast.error('বিবরণ তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    try {
      setIsUpdatingProduct(true);
      const { error } = await supabase
        .from('products')
        .update({
          name: editFormData.name,
          price: editFormData.price,
          quantity: editFormData.quantity,
          category: editFormData.category,
          description: editFormData.description,
          sku: editFormData.sku,
          image_url: editFormData.image_url,
          is_approved: editFormData.is_approved
        })
        .eq('id', editingProduct.id);

      if (error) throw error;
      toast.success(t.success);
      setEditingProduct(null);
      fetchAllData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUpdatingProduct(false);
    }
  };

  const handleGenerateMissingSKUs = async () => {
    const productsWithoutSKU = products.filter(p => !p.sku || p.sku === '' || p.sku === 'N/A');
    if (productsWithoutSKU.length === 0) {
      toast.info(t.allSKUExist);
      return;
    }

    try {
      setIsGeneratingSKUs(true);
      const existingSKUs = new Set(products.map(p => p.sku).filter(Boolean) as string[]);
      
      let updatedCount = 0;
      for (const product of productsWithoutSKU) {
        let newSKU;
        // Generate a 8 character unique SKU with AM- prefix
        do {
          newSKU = 'AM-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        } while (existingSKUs.has(newSKU));
        
        existingSKUs.add(newSKU);
        
        const { error } = await supabase
          .from('products')
          .update({ sku: newSKU })
          .eq('id', product.id);
        
        if (error) {
          console.error(`Error updating SKU for product ${product.id}:`, error);
        } else {
          updatedCount++;
        }
      }

      if (updatedCount > 0) {
        toast.success(t.skuGeneratedCount.replace('{count}', updatedCount.toString()));
        fetchAllData();
      } else {
        toast.info(t.skuUpdateNone);
      }
    } catch (error: any) {
      toast.error(t.errorGeneratingSKU + ': ' + error.message);
    } finally {
      setIsGeneratingSKUs(false);
    }
  };

  const handleGenerateSingleSKU = () => {
    const existingSKUs = new Set(products.map(p => p.sku).filter(Boolean) as string[]);
    let newSKU;
    do {
      newSKU = 'AM-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    } while (existingSKUs.has(newSKU));
    
    setEditFormData(prev => ({ ...prev, sku: newSKU }));
    toast.success(t.skuGenerated);
  };

  const handleShopStatus = async (farmerId: string, status: 'open' | 'closed_temporary' | 'closed_permanent') => {
    try {
      const { error } = await supabase.from('profiles').update({ shop_status: status }).eq('id', farmerId);
      if (error) throw error;
      toast.success(t.toastShopStatusUpdated);
      fetchAllData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleFreeze = async (farmerId: string, isFrozen: boolean) => {
    try {
      const { error } = await supabase.from('profiles').update({ is_frozen: isFrozen }).eq('id', farmerId);
      if (error) throw error;
      
      // Log the action
      if (user) {
        await logAdminAction(
          user.id,
          isFrozen ? 'FREEZE_SHOP' : 'UNFREEZE_SHOP',
          farmerId,
          JSON.stringify({ farmerId, timestamp: new Date().toISOString() })
        );
      }

      toast.success(isFrozen ? t.toastShopFrozen : t.toastShopUnfrozen);
      fetchAllData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleBadge = async (farmerId: string, field: 'badge_best_seller' | 'badge_official' | 'badge_krishi_mall', value: boolean) => {
    try {
      const { error } = await supabase.from('profiles').update({ [field]: value }).eq('id', farmerId);
      if (error) throw error;
      toast.success(t.toastBadgeUpdated);
      fetchAllData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAddingBanner(true);
      const { error } = await supabase.from('banners').insert({ ...newBanner, is_active: true });
      if (error) throw error;
      toast.success(t.toastBannerAdded);
      setNewBanner({ image_url: '', title: '', subtitle: '', link_url: '' });
      fetchAllData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setAddingBanner(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    try {
      const { error } = await supabase.from('banners').delete().eq('id', id);
      if (error) throw error;
      toast.success(t.toastBannerDeleted);
      setBannerToDelete(null);
      fetchAllData();
    } catch (error: any) {
      console.error('Error deleting banner:', error);
      toast.error(t.errorDeletingBanner + ': ' + error.message);
    }
  };

  const handleAddStaticBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAddingStaticBanner(true);
      const { error } = await supabase.from('static_banners').insert({ ...newStaticBanner, is_active: true });
      if (error) throw error;
      toast.success(t.toastStaticBannerAdded);
      setNewStaticBanner({ image_url: '', link_url: '' });
      fetchAllData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setAddingStaticBanner(false);
    }
  };

  const handleDeleteStaticBanner = async (id: string) => {
    try {
      const { error } = await supabase.from('static_banners').delete().eq('id', id);
      if (error) throw error;
      toast.success(t.toastStaticBannerDeleted);
      setStaticBannerToDelete(null);
      fetchAllData();
    } catch (error: any) {
      console.error('Error deleting static banner:', error);
      toast.error(t.errorDeletingBanner + ': ' + error.message);
    }
  };

  const handleAddSidePromoBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAddingSidePromoBanner(true);
      const { error } = await supabase.from('side_promo_banners').insert({ ...newSidePromoBanner, is_active: true });
      if (error) throw error;
      toast.success(t.toastSidePromoBannerAdded || 'সাইড প্রমো ব্যানার যোগ করা হয়েছে');
      setNewSidePromoBanner({ image_url: '', link_url: '' });
      fetchAllData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setAddingSidePromoBanner(false);
    }
  };

  const handleDeleteSidePromoBanner = async (id: string) => {
    try {
      const { error } = await supabase.from('side_promo_banners').delete().eq('id', id);
      if (error) throw error;
      toast.success(t.toastSidePromoBannerDeleted || 'সাইড প্রমো ব্যানার মুছে ফেলা হয়েছে');
      setSidePromoBannerToDelete(null);
      fetchAllData();
    } catch (error: any) {
      console.error('Error deleting side promo banner:', error);
      toast.error((t.errorDeletingBanner || 'ব্যানার মুছতে সমস্যা হয়েছে') + ': ' + error.message);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // In a real app, this would be a server-side function to create a user without signing out the current admin
      // For this demo, we'll simulate it or use a specific API if available.
      // Since we don't have a backend function tool, we'll inform the user.
      toast.info(t.newAdminNotice);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      return toast.error(t.toastPasswordMismatch);
    }
    
    try {
      setUpdatingPassword(true);
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new
      });
      
      if (error) throw error;
      toast.success(t.toastPasswordUpdateSuccess);
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdatingEmail(true);
      
      // 1. Update auth email
      const { error: authError } = await supabase.auth.updateUser({
        email: emailData.newEmail
      });
      
      if (authError) throw authError;

      // 2. Update profile email
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ email: emailData.newEmail })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      toast.success(t.emailUpdateSuccess);
      setEmailData({ newEmail: '' });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleUpdateSiteSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdatingSiteSettings(true);
      const { error } = await supabase
        .from('site_settings')
        .upsert({ 
          id: 'site_config',
          hotline: siteSettings.hotline,
          email: siteSettings.email,
          delivery_charge: siteSettings.delivery_charge,
          free_delivery_threshold: siteSettings.free_delivery_threshold,
          flash_sale_bg_color: siteSettings.flash_sale_bg_color,
          flash_sale_bg_image: siteSettings.flash_sale_bg_image,
          flash_sale_end_time: siteSettings.flash_sale_end_time || null,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success(t.toastSiteSettingsSuccess);
    } catch (error: any) {
      console.error('Error updating site settings:', error);
      toast.error(t.settingsUpdateError, {
        description: error.message || 'Unknown error'
      });
    } finally {
      setUpdatingSiteSettings(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (selectedOverviewSubRange === 'all_time') return true;

    const d = new Date(o.created_at);
    const monthMatches = d.getMonth() === selectedOverviewMonth && d.getFullYear() === selectedOverviewYear;
    if (!monthMatches) return false;

    const day = d.getDate();
    if (selectedOverviewSubRange === 'first_15') return day <= 15;
    if (selectedOverviewSubRange === 'last_15') return day > 15;
    if (selectedOverviewSubRange === 'week_1') return day <= 7;
    if (selectedOverviewSubRange === 'week_2') return day > 7 && day <= 14;
    if (selectedOverviewSubRange === 'week_3') return day > 14 && day <= 21;
    if (selectedOverviewSubRange === 'week_4') return day > 21;
    if (selectedOverviewSubRange === 'daily') return day === selectedOverviewDay;
    
    return true;
  });

  const navItems = [
    { id: 'overview', label: t.overview, icon: LayoutDashboard },
    { id: 'sellers', label: t.seller, icon: Store },
    { id: 'orders', label: t.allOrders, icon: ShoppingBag },
    { id: 'complaints', label: t.reportIssue, icon: AlertTriangle, badge: complaints.filter(c => c.status === 'pending').length },
    { id: 'vouchers', label: t.coupons, icon: Ticket },
    { id: 'flash-sale', label: 'Flash Sale', icon: Tag },
    { id: 'products', label: t.allProducts, icon: Package, badge: products.filter(p => !p.is_approved).length },
    { id: 'logs', label: t.adminLogs, icon: History },
    { id: 'banners', label: t.sliderBanners, icon: ImageIcon },
    { id: 'promo-banners', label: t.sidePromoBanners, icon: Tag },
    { id: 'static-banners', label: t.bottomStaticBanners, icon: FileImage },
    { id: 'new-admin', label: t.admin, icon: UserPlus },
    { id: 'settings', label: t.settings, icon: Settings },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-gray-100 animate-in fade-in zoom-in duration-200">
          <p className="font-black text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <p className="text-sm font-bold text-gray-600">
                {entry.name}: <span className="text-gray-900">{entry.name.includes(t.currencySymbol) ? t.currencySymbol : ''}{entry.value.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}</span>
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const subRangeLabels: Record<string, string> = {
    full: t.fullMonth,
    first_15: t.first15,
    last_15: t.last15,
    week_1: t.week1,
    week_2: t.week2,
    week_3: t.week3,
    week_4: t.week4,
    daily: t.daily
  };

  const currentMonthOrders = orders.filter(o => {
    const d = new Date(o.created_at);
    return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
  });

  const monthRevenue = currentMonthOrders
    .filter(o => ['CONFIRMED', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED'].includes(o.status?.toUpperCase()))
    .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

  const totalRevenue = filteredOrders
    .filter(o => ['CONFIRMED', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED'].includes(o.status?.toUpperCase()))
    .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    
  const successfulOrdersCount = filteredOrders.filter(o => o.status?.toUpperCase() === 'DELIVERED').length;
  
  const consumerCount = users.filter(u => u.role === 'consumer').length;
  const pendingComplaintsCount = complaints.filter(c => c.status === 'pending').length;
  const outOfStockCount = products.filter(p => (p.quantity || 0) === 0).length;
  const avgOrderValue = orders.length > 0 
    ? (orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) / orders.length) 
    : 0;
  const totalSellersCount = farmers.length;
  const activeProductsCount = products.filter(p => p.is_approved).length;
  const pendingFarmerApprovalsCount = farmers.filter(f => f.status === 'pending').length;

  // Category Sales Calculation
  const categorySales: Record<string, number> = {};
  // Create a quick lookup map for filtered orders
  const filteredOrderMapLookup = new Map(filteredOrders.map(o => [o.id, o]));
  
  orderItems.forEach(item => {
    const parentOrder = filteredOrderMapLookup.get(item.order_id) as { status: string } | undefined;
    if (parentOrder && ['confirmed', 'picked_up', 'on_the_way', 'delivered'].includes(parentOrder.status) && item.products) {
      const cat = item.products.category || 'Others';
      categorySales[cat] = (categorySales[cat] || 0) + (item.price_at_time * item.quantity);
    }
  });

  const COLORS = ['#4CAF50', '#03A9F4', '#FF9800', '#9C27B0', '#FFC107', '#E91E63', '#795548', '#607D8B'];
  
  const categorySalesData = Object.entries(categorySales)
    .map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    }))
    .sort((a, b) => b.value - a.value);
  
  // Prepare chart data
  const months = [
    t.january, t.february, t.march, t.april, t.may, t.june,
    t.july, t.august, t.september, t.october, t.november, t.december
  ];
  const monthShort = t.monthsShort;
  
  // Top Selling Products Calculation (Uses filteredOrders directly for safety)
  const productSales: Record<string, { name: string, category: string, image: string, total: number, count: number }> = {};
  
  // Create a quick lookup map for filtered orders
  const filteredOrderMap = new Map(filteredOrders.map(o => [o.id, o]));

  orderItems.forEach(item => {
    const parentOrder = filteredOrderMap.get(item.order_id) as { status: string } | undefined;
    // Only count items from the filtered orders list that have a valid status
    if (parentOrder && ['confirmed', 'picked_up', 'on_the_way', 'delivered'].includes(parentOrder.status) && item.products) {
      const pId = item.product_id;
      if (!productSales[pId]) {
        productSales[pId] = { 
          name: item.products.name, 
          category: item.products.category, 
          image: item.products.image_url,
          total: 0, 
          count: 0 
        };
      }
      productSales[pId].total += (item.price_at_time * item.quantity);
      productSales[pId].count += item.quantity;
    }
  });

  const topSellingProducts = Object.values(productSales)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const monthlyData = monthShort.map((month, index) => {
    const monthOrders = orders.filter(o => {
      const orderDate = new Date(o.created_at);
      return orderDate.getMonth() === index && orderDate.getFullYear() === selectedOverviewYear;
    });
    const orderCount = monthOrders.length;
    const revenue = monthOrders
      .filter(o => ['confirmed', 'picked_up', 'on_the_way', 'delivered'].includes(o.status))
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);
    return { name: month, orders: orderCount, revenue };
  });

  const last24HoursData = Array.from({ length: 24 }).map((_, i) => {
    const hourOrders = orders.filter(o => {
      const orderDate = new Date(o.created_at);
      const isCorrectDay = orderDate.toISOString().split('T')[0] === selectedSalesDate;
      return ['confirmed', 'picked_up', 'on_the_way', 'delivered'].includes(o.status) && 
             isCorrectDay &&
             orderDate.getHours() === i;
    });
    
    const sales = hourOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    return { name: `${i}:00`, sales };
  });

  const statusCounts = {
    delivered: filteredOrders.filter(o => o.status === 'delivered').length,
    cancelled: filteredOrders.filter(o => o.status === 'cancelled').length,
    returned: filteredOrders.filter(o => ['returned', 'return_requested', 'return_picked_up'].includes(o.status)).length
  };

  const pendingApprovals = farmers.filter(f => f.status === 'pending').length + products.filter(p => !p.is_approved).length;

  const orderStatusData = [
    { name: t.success, value: statusCounts.delivered, color: '#4CAF50' },
    { name: t.cancelled, value: statusCounts.cancelled, color: '#F44336' },
    { name: t.returned, value: statusCounts.returned, color: '#FF9800' }
  ].filter(item => item.value > 0);

  if (loading && farmers.length === 0) {
    return (
      <div className="flex h-[70vh] items-center justify-center -mt-8 -mx-4 bg-gray-50/20 rounded-[2.5rem]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-green-100 rounded-full" />
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">{t.loading}...</h2>
            <p className="text-gray-500 font-medium tracking-wide">আপনার ডাটাবেস থেকে তথ্য সংগ্রহ করা হচ্ছে...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 min-h-screen bg-[#F8F9FA] font-sans selection:bg-green-100 selection:text-green-900">
      <div className="max-w-full mx-auto space-y-8 px-4 lg:px-6">
        {/* Modern Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-3xl opacity-30 -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-110" />
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-green-600/10 p-2.5 rounded-2xl">
                <ShieldCheck className="w-8 h-8 text-green-600" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none">{t.adminPanel}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-600 bg-green-50 px-2 py-0.5 rounded-md">v2.0 PRO</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">System Monitoring</span>
                </div>
              </div>
            </div>
            <p className="text-base text-gray-400 font-medium px-1 tracking-tight">{t.dashboardWelcome || 'Welcome back to your command center'}</p>
          </div>

          <div className="flex flex-wrap items-center gap-6 relative z-10">
            {/* Global Date Filter */}
            <div className="flex items-center gap-3 bg-gray-50/80 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-gray-100 shadow-sm transition-all hover:bg-white hover:shadow-md">
              <Calendar className="w-5 h-5 text-green-600" />
              <div className="h-4 w-[1px] bg-gray-200" />
              <div className="flex items-center gap-2">
                <Select value={selectedOverviewSubRange} onValueChange={setSelectedOverviewSubRange}>
                  <SelectTrigger className="h-8 w-[110px] text-xs font-black bg-transparent border-none focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full" className="font-bold">{t.fullMonth || 'Full Month'}</SelectItem>
                    <SelectItem value="all_time" className="font-bold">{t.allTime || 'All Time'}</SelectItem>
                    <SelectItem value="daily" className="font-bold">{t.daily || 'Daily'}</SelectItem>
                  </SelectContent>
                </Select>
                
                {selectedOverviewSubRange !== 'all_time' && (
                  <>
                    <Select value={selectedOverviewMonth.toString()} onValueChange={(val) => setSelectedOverviewMonth(parseInt(val))}>
                      <SelectTrigger className="h-8 w-[100px] text-xs font-black bg-transparent border-none focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month, idx) => <SelectItem key={idx} value={idx.toString()} className="font-bold">{month}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={selectedOverviewYear.toString()} onValueChange={(val) => setSelectedOverviewYear(parseInt(val))}>
                      <SelectTrigger className="h-8 w-[80px] text-xs font-black bg-transparent border-none focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2023, 2024, 2025, 2026, 2027].map((year) => (
                          <SelectItem key={year} value={year.toString()} className="font-bold">{year.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', { useGrouping: false })}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}

                {selectedOverviewSubRange === 'daily' && (
                  <div className="flex items-center gap-2 ml-2">
                    <Input 
                      type="number" 
                      min="1" 
                      max="31" 
                      value={selectedOverviewDay || 1} 
                      onChange={(e) => setSelectedOverviewDay(parseInt(e.target.value) || 1)}
                      className="h-8 w-14 text-xs font-black bg-white/50 border-gray-100 rounded-lg text-center p-0"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-sm font-black text-gray-900 leading-none">{profile?.full_name}</span>
                <span className="text-[10px] font-black text-green-600 uppercase tracking-widest mt-1">Super Admin</span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-100 to-green-50 border-2 border-white shadow-xl flex items-center justify-center overflow-hidden">
                <img src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.id}`} alt="Admin" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Ultra-Slim Modern Sidebar */}
          <aside className="w-full lg:w-56 shrink-0 sticky top-24 z-10">
            <div className="bg-white p-3 rounded-[1.75rem] border border-gray-100 shadow-[0_4px_25px_rgb(0,0,0,0.02)] space-y-1">
              <div className="px-3 py-2 mb-1">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Main Menu</p>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                      activeTab === item.id 
                        ? 'text-white' 
                        : 'text-gray-500 hover:text-green-600 hover:bg-green-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 relative z-10">
                      <item.icon className={`w-3.5 h-3.5 transition-all duration-300 ${activeTab === item.id ? 'text-white scale-110' : 'text-gray-400 group-hover:text-green-600'}`} />
                      <span className="font-black text-[10px] uppercase tracking-wider truncate">{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`relative z-10 h-4 min-w-[1rem] px-1 flex items-center justify-center rounded-md text-[8px] font-black ${
                        activeTab === item.id ? 'bg-white text-green-600' : 'bg-red-500 text-white'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    {activeTab === item.id && (
                      <motion.div 
                        layoutId="sidebar-active"
                        className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-500"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                ))}
              </nav>
              
              <div className="mt-6 pt-4 border-t border-gray-50 space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 text-red-500 hover:bg-red-50 rounded-xl py-4 h-auto px-3 font-black uppercase tracking-wider text-[9px] transition-all"
                  onClick={() => window.location.href = '/'}
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  {t.backToShop}
                </Button>
              </div>
            </div>
          </aside>

          {/* Main Dashboard Content */}
          <div className="flex-1 w-full min-w-0 space-y-8">
            {/* Elegant Overview Stats Grid */}
            {(activeTab === 'overview' || activeTab === 'sellers' || activeTab === 'products') && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                {/* Total Sellers */}
                <Card className="bg-white border-none shadow-[0_2px_12px_-3px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.12)] transition-all duration-300 rounded-[1.5rem] group overflow-hidden">
                  <CardContent className="p-6 flex flex-col items-start gap-4 h-full relative">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center transition-colors group-hover:bg-green-600 group-hover:text-white duration-300">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{t.totalSellers}</p>
                      <h4 className="text-2xl font-bold text-gray-900 font-mono tracking-tight">
                        {farmers.length.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                      </h4>
                    </div>
                    <div className="absolute top-4 right-4 w-12 h-12 bg-green-500 opacity-[0.03] rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                  </CardContent>
                </Card>

                {/* Pending Approval */}
                <Card className="bg-white border-none shadow-[0_2px_12px_-3px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.12)] transition-all duration-300 rounded-[1.5rem] group overflow-hidden">
                  <CardContent className="p-6 flex flex-col items-start gap-4 h-full relative">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center transition-colors group-hover:bg-amber-500 group-hover:text-white duration-300">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{t.pendingApproval}</p>
                      <h4 className="text-2xl font-bold text-gray-900 font-mono tracking-tight">
                        {pendingApprovals.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                      </h4>
                    </div>
                    <div className="absolute top-4 right-4 w-12 h-12 bg-amber-500 opacity-[0.03] rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                  </CardContent>
                </Card>

                {/* Total Products */}
                <Card className="bg-white border-none shadow-[0_2px_12px_-3px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.12)] transition-all duration-300 rounded-[1.5rem] group overflow-hidden">
                  <CardContent className="p-6 flex flex-col items-start gap-4 h-full relative">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center transition-colors group-hover:bg-blue-600 group-hover:text-white duration-300">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{t.totalProducts}</p>
                      <h4 className="text-2xl font-bold text-gray-900 font-mono tracking-tight">
                        {products.length.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                      </h4>
                    </div>
                    <div className="absolute top-4 right-4 w-12 h-12 bg-blue-500 opacity-[0.03] rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                  </CardContent>
                </Card>

                {/* Total Orders */}
                <Card className="bg-white border-none shadow-[0_2px_12px_-3px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.12)] transition-all duration-300 rounded-[1.5rem] group overflow-hidden">
                  <CardContent className="p-6 flex flex-col items-start gap-4 h-full relative">
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center transition-colors group-hover:bg-orange-600 group-hover:text-white duration-300">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{t.allOrders || 'Total Orders'}</p>
                      <h4 className="text-2xl font-bold text-gray-900 font-mono tracking-tight">
                        {orders.length.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                      </h4>
                    </div>
                    <div className="absolute top-4 right-4 w-12 h-12 bg-orange-500 opacity-[0.03] rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                  </CardContent>
                </Card>

                {/* Successful Orders */}
                <Card className="bg-white border-none shadow-[0_2px_12px_-3px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.12)] transition-all duration-300 rounded-[1.5rem] group overflow-hidden">
                  <CardContent className="p-6 flex flex-col items-start gap-4 h-full relative">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center transition-colors group-hover:bg-emerald-600 group-hover:text-white duration-300">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{t.successOrder || 'Successful Orders'}</p>
                      <h4 className="text-2xl font-bold text-gray-900 font-mono tracking-tight">
                        {successfulOrdersCount.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                      </h4>
                    </div>
                    <div className="absolute top-4 right-4 w-12 h-12 bg-emerald-500 opacity-[0.03] rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                  </CardContent>
                </Card>

                {/* Total Sale (Filtered) */}
                <Card className="bg-white border-none shadow-[0_2px_12px_-3px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.12)] transition-all duration-300 rounded-[1.5rem] group overflow-hidden">
                  <CardContent className="p-6 flex flex-col items-start gap-4 h-full relative">
                    <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center transition-colors group-hover:bg-violet-600 group-hover:text-white duration-300">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                        {t.totalSell || 'Total Sale'} ({subRangeLabels[selectedOverviewSubRange]})
                      </p>
                      <h4 className="text-2xl font-bold text-gray-900 font-mono tracking-tight flex items-baseline gap-1">
                        <span className="text-base text-gray-400 font-medium">{t.currencySymbol}</span>
                        {totalRevenue.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                      </h4>
                    </div>
                    <div className="absolute top-4 right-4 w-12 h-12 bg-violet-500 opacity-[0.03] rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                  </CardContent>
                </Card>

                {/* This Month Sale */}
                <Card className="bg-white border-none shadow-[0_2px_12px_-3px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.12)] transition-all duration-300 rounded-[1.5rem] group overflow-hidden">
                  <CardContent className="p-6 flex flex-col items-start gap-4 h-full relative">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center transition-colors group-hover:bg-indigo-600 group-hover:text-white duration-300">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">This Month Sale</p>
                      <h4 className="text-2xl font-bold text-gray-900 font-mono tracking-tight flex items-baseline gap-1">
                        <span className="text-base text-gray-400 font-medium">{t.currencySymbol}</span>
                        {monthRevenue.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                      </h4>
                    </div>
                    <div className="absolute top-4 right-4 w-12 h-12 bg-indigo-500 opacity-[0.03] rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                  </CardContent>
                </Card>

                {/* Total Consumers */}
                <Card className="bg-white border-none shadow-[0_2px_12px_-3px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.12)] transition-all duration-300 rounded-[1.5rem] group overflow-hidden">
                  <CardContent className="p-6 flex flex-col items-start gap-4 h-full relative">
                    <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center transition-colors group-hover:bg-pink-600 group-hover:text-white duration-300">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{t.totalConsumers || 'Total Consumers'}</p>
                      <h4 className="text-2xl font-bold text-gray-900 font-mono tracking-tight">
                        {consumerCount.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                      </h4>
                    </div>
                    <div className="absolute top-4 right-4 w-12 h-12 bg-pink-500 opacity-[0.03] rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                  </CardContent>
                </Card>

                {/* Pending Complaints */}
                <Card className="bg-white border-none shadow-[0_2px_12px_-3px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.12)] transition-all duration-300 rounded-[1.5rem] group overflow-hidden">
                  <CardContent className="p-6 flex flex-col items-start gap-4 h-full relative">
                    <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center transition-colors group-hover:bg-rose-600 group-hover:text-white duration-300">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{t.pendingComplaints || 'Pending Complaints'}</p>
                      <h4 className="text-2xl font-bold text-red-600 font-mono tracking-tight">
                        {pendingComplaintsCount.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                      </h4>
                    </div>
                    <div className="absolute top-4 right-4 w-12 h-12 bg-rose-500 opacity-[0.03] rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                  </CardContent>
                </Card>

                {/* Out Of Stock */}
                <Card className="bg-white border-none shadow-[0_2px_12px_-3px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.12)] transition-all duration-300 rounded-[1.5rem] group overflow-hidden">
                  <CardContent className="p-6 flex flex-col items-start gap-4 h-full relative">
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center transition-colors group-hover:bg-red-600 group-hover:text-white duration-300">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{t.outOfStock || 'Out Of Stock'}</p>
                      <h4 className="text-2xl font-bold text-red-600 font-mono tracking-tight">
                        {outOfStockCount.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                      </h4>
                    </div>
                    <div className="absolute top-4 right-4 w-12 h-12 bg-red-500 opacity-[0.03] rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                  </CardContent>
                </Card>

                {/* Avg Order Value */}
                <Card className="bg-white border-none shadow-[0_2px_12px_-3px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.12)] transition-all duration-300 rounded-[1.5rem] group overflow-hidden">
                  <CardContent className="p-6 flex flex-col items-start gap-4 h-full relative">
                    <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center transition-colors group-hover:bg-sky-600 group-hover:text-white duration-300">
                      <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{t.avgOrderValue || 'Avg Order Value'}</p>
                      <h4 className="text-2xl font-bold text-gray-900 font-mono tracking-tight flex items-baseline gap-1">
                        <span className="text-base text-gray-400 font-medium">{t.currencySymbol}</span>
                        {avgOrderValue.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </h4>
                    </div>
                    <div className="absolute top-4 right-4 w-12 h-12 bg-sky-500 opacity-[0.03] rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                  </CardContent>
                </Card>

                {/* Total Sellers */}
                <Card className="bg-white border-none shadow-[0_2px_12px_-3px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.12)] transition-all duration-300 rounded-[1.5rem] group overflow-hidden">
                  <CardContent className="p-6 flex flex-col items-start gap-4 h-full relative">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center transition-colors group-hover:bg-indigo-600 group-hover:text-white duration-300">
                      <Store className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{t.totalSellers || 'Total Sellers'}</p>
                      <h4 className="text-2xl font-bold text-gray-900 font-mono tracking-tight">
                        {totalSellersCount.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                      </h4>
                    </div>
                    <div className="absolute top-4 right-4 w-12 h-12 bg-indigo-500 opacity-[0.03] rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                  </CardContent>
                </Card>

                {/* Active Products */}
                <Card className="bg-white border-none shadow-[0_2px_12px_-3px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.12)] transition-all duration-300 rounded-[1.5rem] group overflow-hidden">
                  <CardContent className="p-6 flex flex-col items-start gap-4 h-full relative">
                    <div className="w-12 h-12 bg-lime-50 text-lime-600 rounded-xl flex items-center justify-center transition-colors group-hover:bg-lime-600 group-hover:text-white duration-300">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{t.activeProducts || 'Active Products'}</p>
                      <h4 className="text-2xl font-bold text-gray-900 font-mono tracking-tight">
                        {activeProductsCount.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                      </h4>
                    </div>
                    <div className="absolute top-4 right-4 w-12 h-12 bg-lime-500 opacity-[0.03] rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                  </CardContent>
                </Card>

                {/* Pending Farmer Approvals */}
                <Card className="bg-white border-none shadow-[0_2px_12px_-3px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.12)] transition-all duration-300 rounded-[1.5rem] group overflow-hidden">
                  <CardContent className="p-6 flex flex-col items-start gap-4 h-full relative">
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center transition-colors group-hover:bg-orange-600 group-hover:text-white duration-300">
                      <UserPlus className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{t.pendingFarmerApprovals || 'Farmer Approvals'}</p>
                      <h4 className="text-2xl font-bold text-gray-900 font-mono tracking-tight">
                        {pendingFarmerApprovalsCount.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                      </h4>
                    </div>
                    <div className="absolute top-4 right-4 w-12 h-12 bg-orange-500 opacity-[0.03] rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                  </CardContent>
                </Card>
              </div>
            )}

            {dbStatus.some(s => s.status === 'error') && (
              <div className="p-10 bg-red-50 border-2 border-red-200 rounded-[3rem] shadow-2xl shadow-red-100/50 flex flex-col items-start gap-8 border-dashed">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-red-600 rounded-3xl flex items-center justify-center shadow-xl shadow-red-200">
                    <AlertTriangle className="w-8 h-8 text-white animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-red-900 leading-tight">Database Incomplete</h2>
                    <p className="text-red-700 font-bold opacity-80">Several tables are missing in your Supabase database.</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {dbStatus.filter(s => s.status === 'error').map(s => (
                    <Badge key={s.table} variant="destructive" className="px-4 py-1.5 font-black uppercase tracking-widest text-[10px] bg-red-600">
                      {s.table} Missing
                    </Badge>
                  ))}
                </div>

                <div className="w-full bg-white rounded-[2rem] p-8 shadow-inner border border-red-100">
                  <h4 className="text-lg font-black text-red-900 mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-black text-white rounded-xl flex items-center justify-center text-xs">SQL</span>
                      How to Fix This Immediately:
                    </div>
                    <Button 
                      className="bg-red-600 hover:bg-red-700 font-black px-6 rounded-xl animate-bounce"
                      onClick={() => {
                        navigator.clipboard.writeText(SQL_SETUP_CODE);
                        toast.success("SQL Code Copied! Now paste it in Supabase SQL Editor.");
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" /> Copy SQL Code
                    </Button>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-black text-gray-500 text-sm">1</div>
                      <p className="text-xs font-bold text-gray-600 leading-relaxed">
                        Open your <a href="https://supabase.com/dashboard" target="_blank" className="text-blue-600 underline">Supabase Dashboard</a> and go to the <b>SQL Editor</b>.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-black text-gray-500 text-sm">2</div>
                      <p className="text-xs font-bold text-gray-600 leading-relaxed">
                        Open the file <code className="bg-gray-100 px-2 py-0.5 rounded text-red-600 font-mono">database_setup.sql</code> in this editor's file explorer and copy all its content.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-black text-gray-500 text-sm">3</div>
                      <p className="text-xs font-bold text-gray-600 leading-relaxed">
                        Paste the SQL into a <b>New Query</b> in Supabase and click <b>Run</b>. All tables will be created instantly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-0 border-none bg-transparent">
              {/* Hidden TabsList as we use Sidebar now */}
              <TabsList className="hidden" />

        <TabsContent value="overview" className="space-y-10">
          {/* Quick Actions / Pending Alerts */}
          {(farmers.filter(f => f.status === 'pending').length > 0 || products.filter(p => !p.is_approved).length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {farmers.filter(f => f.status === 'pending').length > 0 && (
                <Card className="border-amber-100 bg-amber-50/30 overflow-hidden group hover:shadow-md transition-all">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-amber-600">
                        <UserCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-lg font-black text-amber-900">{t.farmersCount.replace('{count}', farmers.filter(f => f.status === 'pending').length.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US'))}</p>
                        <p className="text-sm text-amber-700 font-bold">{t.pendingApproval}</p>
                      </div>
                    </div>
                    <Button className="bg-amber-600 hover:bg-amber-700 font-black rounded-xl h-12 px-6" onClick={() => setActiveTab('sellers')}>{t.verify}</Button>
                  </CardContent>
                </Card>
              )}
              {products.filter(p => !p.is_approved).length > 0 && (
                <Card className="border-blue-100 bg-blue-50/30 overflow-hidden group hover:shadow-md transition-all">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-600">
                        <CheckSquare className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-lg font-black text-blue-900">{t.productsCountTemplate.replace('{count}', products.filter(p => !p.is_approved).length.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US'))}</p>
                        <p className="text-sm text-blue-700 font-bold">{t.pendingApproval}</p>
                      </div>
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700 font-black rounded-xl h-12 px-6" onClick={() => setActiveTab('products')}>{t.check}</Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left Column - Main Charts and Tables */}
            <div className="xl:col-span-2 space-y-8">
              {/* Monthly Revenue Bar Chart */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                    <h3 className="font-black text-gray-900 text-xl">{t.monthlyOrdersRevenue} ({selectedOverviewYear.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', {useGrouping:false})})</h3>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" /> {t.order}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" /> {t.totalEarn}
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-h-[400px] relative" key={`monthly-chart-${activeTab}-${language}-${orders.length}`}>
                  <div className="absolute inset-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                          </linearGradient>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fontWeight: 'bold' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fontWeight: 'bold' }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                        <Bar name={t.order} dataKey="orders" fill="url(#colorOrders)" radius={[6, 6, 0, 0]} barSize={24} />
                        <Bar name={`${t.totalEarn} (${t.currencySymbol})`} dataKey="revenue" fill="url(#colorRevenue)" radius={[6, 6, 0, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Sub Grids for Sales Trend and Top Products */}
              <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8">
                {/* Sales Trend Line Chart */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                      <LineChartIcon className="w-6 h-6 text-amber-600" />
                      <h3 className="text-lg font-black text-gray-900">{t.salesTrend}</h3>
                    </div>
                    <Input 
                      type="date" 
                      value={selectedSalesDate || ''} 
                      onChange={(e) => setSelectedSalesDate(e.target.value)}
                      className="h-10 rounded-xl border-amber-50 bg-amber-50 font-bold text-xs w-40"
                    />
                  </div>
                  <div className="flex-1 min-h-[300px] relative" key={`sales-trend-${activeTab}-${language}-${selectedSalesDate}`}>
                    <div className="absolute inset-0">
                      <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={last24HoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} interval={4} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line 
                              type="monotone" 
                              dataKey="sales" 
                              stroke="#f59e0b" 
                              strokeWidth={3} 
                              dot={false}
                              activeDot={{ r: 6, fill: '#f59e0b', strokeWidth: 0 }}
                            />
                          </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Top Selling Products List */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col">
                  <div className="flex items-center gap-3 mb-8">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                    <h3 className="text-lg font-black text-gray-900">{t.top5Products}</h3>
                  </div>
                  <div className="space-y-4">
                    {topSellingProducts.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-all group">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 bg-gray-50 rounded-xl overflow-hidden shrink-0 group-hover:scale-110 transition-transform">
                            <img src={p.image} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-gray-900 truncate">{p.name}</p>
                            <p className="text-[10px] font-bold text-gray-400">{p.category}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-black text-gray-900">{t.currencySymbol}{p.total.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}</p>
                          <p className="text-[10px] font-bold text-gray-400">{p.count} Units</p>
                        </div>
                      </div>
                    ))}
                    {topSellingProducts.length === 0 && <p className="text-center py-10 text-gray-300 italic font-bold">No data found</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Status, Categories and Activity */}
            <div className="space-y-8">
              {/* Order Status Visualization */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col">
                <div className="flex items-center gap-3 mb-8">
                  <PieChartIcon className="w-6 h-6 text-purple-600" />
                  <h3 className="font-black text-gray-900 text-lg">{t.orderStatusTitle}</h3>
                </div>
                <div className="h-[240px] relative flex flex-col items-center justify-center">
                  {orderStatusData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={orderStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={90}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                          >
                            {orderStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap justify-center gap-2 mt-4">
                        {orderStatusData.map((entry, index) => (
                          <div key={index} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50 text-[10px] font-black text-gray-600">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                            {entry.name}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : <div className="text-gray-300 italic">No Data</div>}
                </div>
              </div>

              {/* Sales Category Distribution */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col">
                <div className="flex items-center gap-3 mb-8">
                  <Tag className="w-6 h-6 text-pink-600" />
                  <h3 className="font-black text-gray-900 text-lg">{t.salesByCategory || 'Sales by Category'}</h3>
                </div>
                <div className="h-[240px] relative flex flex-col items-center justify-center">
                  {categorySalesData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categorySalesData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={90}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                          >
                            {categorySalesData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap justify-center gap-2 mt-4 max-h-[80px] overflow-y-auto">
                        {categorySalesData.slice(0, 6).map((entry, index) => (
                          <div key={index} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50 text-[10px] font-black text-gray-600">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                            {entry.name}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : <div className="text-gray-300 italic">No Data</div>}
                </div>
              </div>

              {/* Recent System Activity */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <History className="w-6 h-6 text-indigo-600" />
                  <h3 className="font-black text-gray-900 text-lg">{t.recentActivity || 'Recent Activity'}</h3>
                </div>
                <div className="space-y-3">
                  {adminLogs.slice(0, 5).map((log, i) => (
                    <div key={i} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-all">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <History className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-gray-900 leading-snug line-clamp-2">{log.action}</p>
                        <p className="text-[9px] font-bold text-gray-400 mt-0.5">{new Date(log.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                  <Button variant="ghost" className="w-full text-[10px] font-black tracking-widest text-gray-400 hover:text-gray-900" onClick={() => setActiveTab('logs')}>SEE ALL LOGS</Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sellers">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6 p-8">
              <CardTitle className="text-2xl font-black flex items-center gap-3">
                <Store className="w-7 h-7 text-green-600" /> {t.sellerManagement}
              </CardTitle>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input 
                  placeholder={t.searchSellerPlaceholder} 
                  className="pl-12 h-14 rounded-2xl border-gray-200 text-lg shadow-sm focus:ring-2 focus:ring-green-500/20"
                  value={sellerSearchQuery || ''}
                  onChange={(e) => setSellerSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table className="min-w-[1200px]">
                <TableHeader className="bg-gray-50/50">
                  <TableRow className="hover:bg-transparent border-b border-gray-100">
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 py-3 px-4">{t.fullName}</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 py-3 px-4">{t.shopName}</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 py-3 px-4">{t.location}</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 py-3 px-4">{t.status}</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 py-3 px-4">{t.shopStatus}</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 py-3 px-4 text-center">{t.freeze}</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 py-3 px-4 text-center">{t.badges}</TableHead>
                    <TableHead className="sticky right-0 bg-gray-50/50 z-20 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 py-3 px-4 text-right shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]">{t.action}</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {farmers
                  .filter(f => f.full_name.toLowerCase().includes(sellerSearchQuery.toLowerCase()))
                  .map((farmer) => (
                  <TableRow key={farmer.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 font-black text-xs border border-green-100 shrink-0">
                            {farmer.full_name?.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-gray-900 text-sm whitespace-nowrap">{farmer.full_name}</span>
                            <span className="text-[10px] text-gray-400 font-bold">{farmer.phone}</span>
                          </div>
                        </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                        <Link 
                          to={`/farmer/${farmer.id}`} 
                          className="flex items-center gap-2 text-green-600 hover:text-green-700 font-black text-sm group transition-all"
                        >
                          <Store className="w-4 h-4" />
                          <span className="group-hover:underline">{farmer.shop_name || t.notAvailable}</span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                    </TableCell>
                    <TableCell className="text-gray-500 font-medium text-xs py-3 px-4 max-w-[200px] truncate">{farmer.address || t.notAvailable}</TableCell>
                    <TableCell className="py-3 px-4">
                      <Badge className={`px-2.5 py-0.5 border-none text-[9px] font-black uppercase tracking-widest ${
                        farmer.status === 'approved' ? 'bg-green-100 text-green-700' :
                        farmer.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {farmer.status === 'approved' ? t.approved : 
                         farmer.status === 'pending' ? t.pending : t.rejected}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <Badge className={`px-2.5 py-0.5 border-none text-[9px] font-black uppercase tracking-widest ${
                        farmer.shop_status === 'open' ? 'bg-green-100 text-green-700' :
                        farmer.shop_status === 'closed_temporary' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {farmer.shop_status === 'open' ? t.open : 
                         farmer.shop_status === 'closed_temporary' ? t.tempClosed : t.permClosed}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center py-3 px-4">
                      <Button
                        variant={farmer.is_frozen ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => handleToggleFreeze(farmer.id, !farmer.is_frozen)}
                        className={`gap-2 font-black rounded-xl h-8 px-3 shadow-none transition-all text-[10px] uppercase tracking-tighter ${!farmer.is_frozen ? 'border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100' : 'shadow-lg shadow-red-100 animate-pulse'}`}
                      >
                        <Snowflake className={`w-3.5 h-3.5 ${farmer.is_frozen ? 'animate-pulse' : ''}`} />
                        {farmer.is_frozen ? t.unfreeze : t.freeze}
                      </Button>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                         <button
                           className={`p-1.5 rounded-lg transition-all ${farmer.badge_best_seller ? 'bg-amber-100 text-amber-600 border border-amber-200 shadow-sm' : 'bg-gray-50 text-gray-400 border border-transparent hover:bg-gray-100'}`}
                           onClick={() => handleToggleBadge(farmer.id, 'badge_best_seller', !farmer.badge_best_seller)}
                           title="Best Seller"
                         >
                           <Award className="w-4 h-4" />
                         </button>
                         <button
                           className={`p-1.5 rounded-lg transition-all ${farmer.badge_official ? 'bg-blue-100 text-blue-600 border border-blue-200 shadow-sm' : 'bg-gray-50 text-gray-400 border border-transparent hover:bg-gray-100'}`}
                           onClick={() => handleToggleBadge(farmer.id, 'badge_official', !farmer.badge_official)}
                           title="Official Store"
                         >
                           <ShieldCheck className="w-4 h-4" />
                         </button>
                         <button
                           className={`p-1.5 rounded-lg transition-all ${farmer.badge_krishi_mall ? 'bg-green-100 text-green-600 border border-green-200 shadow-sm' : 'bg-gray-50 text-gray-400 border border-transparent hover:bg-gray-100'}`}
                           onClick={() => handleToggleBadge(farmer.id, 'badge_krishi_mall', !farmer.badge_krishi_mall)}
                           title="Super Mall"
                         >
                           <Store className="w-4 h-4" />
                         </button>
                      </div>
                    </TableCell>
                    <TableCell className="sticky right-0 bg-white/95 backdrop-blur-sm z-10 text-right py-3 px-4 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]">
                      <Select 
                        value={farmer.shop_status || 'open'} 
                        onValueChange={(val: any) => handleShopStatus(farmer.id, val)}
                      >
                        <SelectTrigger className="h-8 w-[120px] text-[10px] font-black ml-auto rounded-xl border-gray-200 shadow-none focus:ring-0">
                          <SelectValue placeholder={t.manageShop} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                          <SelectItem value="open" className="font-bold text-xs">{t.openShop}</SelectItem>
                          <SelectItem value="closed_temporary" className="font-bold text-xs">{t.tempClosed}</SelectItem>
                          <SelectItem value="closed_permanent" className="font-bold text-xs">{t.permClosed}</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </TabsContent>

        <TabsContent value="promo-banners">
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-semibold flex items-center gap-3">
            <Tag className="w-5 h-5 text-amber-600 shrink-0" />
            <span>হোমপেজের উপর-ডানপাশের সাইড প্রমো ব্যানার (Top-Right Side Promo Banner) পরিবর্তন করতে এই অপশনটি ব্যবহার করুন।</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 border-none shadow-sm">
              <CardHeader className="bg-white border-b border-gray-50 p-6">
                <CardTitle className="text-xl font-black flex items-center gap-3">
                  <Plus className="w-6 h-6 text-green-600" /> {t.newSidePromoBanner || 'নতুন সাইড প্রমো ব্যানার'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8 p-6">
                <form onSubmit={handleAddSidePromoBanner} className="space-y-6">
                  <div className="space-y-3">
                    <Label className="font-black text-lg text-gray-700">{t.imageUrl} (GIF supported)</Label>
                    <Input 
                      required 
                      value={newSidePromoBanner.image_url || ''} 
                      onChange={e => setNewSidePromoBanner({...newSidePromoBanner, image_url: e.target.value})} 
                      placeholder="https://... (GIF supported)"
                      className="h-14 rounded-2xl border-gray-200 text-lg shadow-sm"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-black text-lg text-gray-700">{t.linkUrl}</Label>
                    <Input 
                      value={newSidePromoBanner.link_url || ''} 
                      onChange={e => setNewSidePromoBanner({...newSidePromoBanner, link_url: e.target.value})} 
                      placeholder="/category/grocery"
                      className="h-14 rounded-2xl border-gray-200 text-lg shadow-sm"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 font-black py-8 text-xl rounded-2xl shadow-lg shadow-green-100 transition-all hover:-translate-y-1" disabled={addingSidePromoBanner}>
                    {addingSidePromoBanner ? t.adding : t.addBanner}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-50 p-6">
                <CardTitle className="text-xl font-black flex items-center gap-3">
                  <ImageIcon className="w-6 h-6 text-amber-600" /> {t.currentSidePromoBanners || 'সচল সাইড প্রমো ব্যানারসমূহ'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8 p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {sidePromoBanners.map((banner) => (
                    <div key={banner.id} className="relative group rounded-[2rem] overflow-hidden border border-gray-100 shadow-md hover:shadow-xl transition-all duration-500">
                      <img 
                        src={banner.image_url} 
                        alt="Side Promo Banner" 
                        className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          type="button"
                          className="rounded-full w-16 h-16 shadow-2xl transform scale-75 group-hover:scale-100 transition-all duration-300"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSidePromoBannerToDelete(banner.id);
                          }}
                        >
                          <Trash2 className="w-8 h-8" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {sidePromoBanners.length === 0 && (
                    <div className="col-span-2 text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-400 font-medium italic">{t.noSidePromoBanners || 'কোন সাইড প্রমো ব্যানার পাওয়া যায়নি'}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Promo Banner Delete Confirmation Modal */}
          {sidePromoBannerToDelete && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
              <Card className="w-full max-w-sm">
                <CardHeader>
                  <CardTitle className="text-lg">{t.deleteBanner}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">{t.confirmDeleteBanner}</p>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1" 
                      onClick={() => setSidePromoBannerToDelete(null)}
                    >
                      {t.no}
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="flex-1" 
                      onClick={() => handleDeleteSidePromoBanner(sidePromoBannerToDelete)}
                    >
                      {t.yesDelete}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="static-banners">
          <div className="mb-6 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-sm font-semibold flex items-center gap-3">
            <FileImage className="w-5 h-5 text-blue-600 shrink-0" />
            <span>হোমপেজের নিচের সেকশনের ব্যানার (Bottom Banner) পরিবর্তন করতে এই অপশনটি ব্যবহার করুন।</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 border-none shadow-sm">
              <CardHeader className="bg-white border-b border-gray-50 p-6">
                <CardTitle className="text-xl font-black flex items-center gap-3">
                  <Plus className="w-6 h-6 text-green-600" /> {t.newStaticBanner}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8 p-6">
                <form onSubmit={handleAddStaticBanner} className="space-y-6">
                  <div className="space-y-3">
                    <Label className="font-black text-lg text-gray-700">{t.imageUrl} (GIF supported)</Label>
                    <Input 
                      required 
                      value={newStaticBanner.image_url || ''} 
                      onChange={e => setNewStaticBanner({...newStaticBanner, image_url: e.target.value})} 
                      placeholder="https://... (GIF supported)"
                      className="h-14 rounded-2xl border-gray-200 text-lg shadow-sm"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-black text-lg text-gray-700">{t.linkUrl}</Label>
                    <Input 
                      value={newStaticBanner.link_url || ''} 
                      onChange={e => setNewStaticBanner({...newStaticBanner, link_url: e.target.value})} 
                      placeholder="/category/grocery"
                      className="h-14 rounded-2xl border-gray-200 text-lg shadow-sm"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 font-black py-8 text-xl rounded-2xl shadow-lg shadow-green-100 transition-all hover:-translate-y-1" disabled={addingStaticBanner}>
                    {addingStaticBanner ? t.adding : t.addBanner}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-50 p-6">
                <CardTitle className="text-xl font-black flex items-center gap-3">
                  <ImageIcon className="w-6 h-6 text-amber-600" /> {t.currentStaticBanners}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8 p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {staticBanners.map((banner) => (
                    <div key={banner.id} className="relative group rounded-[2rem] overflow-hidden border border-gray-100 shadow-md hover:shadow-xl transition-all duration-500">
                      <img 
                        src={banner.image_url} 
                        alt="Static Banner" 
                        className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          type="button"
                          className="rounded-full w-16 h-16 shadow-2xl transform scale-75 group-hover:scale-100 transition-all duration-300"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setStaticBannerToDelete(banner.id);
                          }}
                        >
                          <Trash2 className="w-8 h-8" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {staticBanners.length === 0 && (
                    <div className="col-span-2 text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-400 font-medium italic">{t.noStaticBanners}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Static Delete Confirmation Modal */}
          {staticBannerToDelete && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
              <Card className="w-full max-w-sm">
                <CardHeader>
                  <CardTitle className="text-lg">{t.deleteBanner}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">{t.confirmDeleteBanner}</p>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1" 
                      onClick={() => setStaticBannerToDelete(null)}
                    >
                      {t.no}
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="flex-1" 
                      onClick={() => handleDeleteStaticBanner(staticBannerToDelete)}
                    >
                      {t.yesDelete}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="banners">
          <div className="mb-6 p-4 rounded-2xl bg-green-50 border border-green-200 text-green-900 text-sm font-semibold flex items-center gap-3">
            <ImageIcon className="w-5 h-5 text-green-600 shrink-0" />
            <span>হোমপেজের প্রধান স্লাইডার ব্যানার (Main Hero Slider) পরিবর্তন করতে এই অপশনটি ব্যবহার করুন।</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 border-none shadow-sm">
              <CardHeader className="bg-white border-b border-gray-50 p-6">
                <CardTitle className="text-xl font-black flex items-center gap-3">
                  <Plus className="w-6 h-6 text-green-600" /> {t.addNewBanner}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8 p-6">
                <form onSubmit={handleAddBanner} className="space-y-6">
                  <div className="space-y-3">
                    <Label className="font-black text-lg text-gray-700">{t.imageUrl}</Label>
                    <Input 
                      required 
                      value={newBanner.image_url || ''} 
                      onChange={e => setNewBanner({...newBanner, image_url: e.target.value})} 
                      placeholder="https://..."
                      className="h-14 rounded-2xl border-gray-200 text-lg shadow-sm"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-black text-lg text-gray-700">{t.title}</Label>
                    <Input 
                      value={newBanner.title || ''} 
                      onChange={e => setNewBanner({...newBanner, title: e.target.value})} 
                      placeholder={t.placeholderFreshVeg}
                      className="h-14 rounded-2xl border-gray-200 text-lg shadow-sm"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-black text-lg text-gray-700">{t.subtitle}</Label>
                    <Input 
                      value={newBanner.subtitle || ''} 
                      onChange={e => setNewBanner({...newBanner, subtitle: e.target.value})} 
                      placeholder={t.placeholderFarmDirect}
                      className="h-14 rounded-2xl border-gray-200 text-lg shadow-sm"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-black text-lg text-gray-700">{t.linkUrl}</Label>
                    <Input 
                      value={newBanner.link_url || ''} 
                      onChange={e => setNewBanner({...newBanner, link_url: e.target.value})} 
                      placeholder="/category/grocery"
                      className="h-14 rounded-2xl border-gray-200 text-lg shadow-sm"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 font-black py-8 text-xl rounded-2xl shadow-lg shadow-green-100 transition-all hover:-translate-y-1" disabled={addingBanner}>
                    {addingBanner ? t.adding : t.addBanner}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-50 p-6">
                <CardTitle className="text-xl font-black flex items-center gap-3">
                  <ImageIcon className="w-6 h-6 text-amber-600" /> {t.activeBanners}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8 p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {banners.map((banner) => (
                    <div key={banner.id} className="relative group rounded-[2rem] overflow-hidden border border-gray-100 shadow-md hover:shadow-xl transition-all duration-500">
                      <img 
                        src={banner.image_url} 
                        alt={banner.title || 'Banner'} 
                        className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="p-6 bg-white">
                        <p className="font-black text-xl text-gray-800 truncate">{banner.title || t.noTitle}</p>
                        <p className="text-sm text-gray-500 font-bold truncate mt-2">{banner.subtitle || t.noSubtitle}</p>
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          type="button"
                          className="rounded-full w-16 h-16 shadow-2xl transform scale-75 group-hover:scale-100 transition-all duration-300"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setBannerToDelete(banner.id);
                          }}
                        >
                          <Trash2 className="w-8 h-8" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {banners.length === 0 && (
                    <div className="col-span-2 text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-400 font-medium italic">{t.noBannersFound}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Delete Confirmation Modal */}
          <Dialog open={!!bannerToDelete} onOpenChange={(open) => !open && setBannerToDelete(null)}>
            <DialogContent className="max-w-sm rounded-3xl border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-black text-red-600 flex items-center gap-2">
                  <Trash2 className="w-6 h-6" /> {t.deleteBanner}
                </DialogTitle>
                <DialogDescription>{t.confirmDeleteBanner}</DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex gap-3 sm:justify-start">
                <Button 
                  variant="outline" 
                  className="flex-1 h-12 rounded-xl font-bold" 
                  onClick={() => setBannerToDelete(null)}
                >
                  {t.no}
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1 h-12 rounded-xl font-black bg-red-600 hover:bg-red-700" 
                  onClick={() => handleDeleteBanner(bannerToDelete!)}
                >
                  {t.yesDelete}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="products">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 lg:p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <CardTitle className="text-xl font-black flex items-center gap-2">
                  <Package className="w-6 h-6 text-blue-600" /> {t.productManagement}
                </CardTitle>
                {products.filter(p => !p.sku || p.sku === '' || p.sku === 'N/A').length > 0 && (
                  <Button 
                    onClick={handleGenerateMissingSKUs} 
                    disabled={isGeneratingSKUs}
                    variant="outline"
                    className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 font-bold rounded-xl h-9 px-3 text-xs"
                  >
                    {isGeneratingSKUs ? (
                      <span className="flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 animate-bounce" /> {t.generating}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Plus className="w-3.5 h-3.5" /> {t.generateRemainingSKU}
                      </span>
                    )}
                  </Button>
                )}
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder={t.searchSKUPlaceholder} 
                  className="pl-10 h-10 rounded-xl border-gray-200 text-sm shadow-sm focus:ring-2 focus:ring-blue-500/20"
                  value={productSearchQuery || ''}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto shadow-inner">
              <Table className="min-w-[1200px]">
              <TableHeader className="bg-gray-50/50">
                <TableRow className="hover:bg-transparent border-b border-gray-100">
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 py-3 px-4 whitespace-nowrap">{t.skuId}</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 py-3 px-4">{t.product}</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 py-3 px-4">{t.seller}</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 py-3 px-4 text-center">{t.priceAndStock}</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 py-3 px-4 text-center">{t.status}</TableHead>
                  <TableHead className="sticky right-0 bg-gray-50/50 z-20 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 py-3 px-4 text-right shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]">{t.action}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Object.entries(
                  products
                    .filter(p => {
                      if (!productSearchQuery) return true;
                      return p.sku?.toLowerCase().includes(productSearchQuery.toLowerCase());
                    })
                    .reduce((acc, p) => {
                      const cat = p.category || t.others;
                      if (!acc[cat]) acc[cat] = [];
                      acc[cat].push(p);
                      return acc;
                    }, {} as Record<string, any[]>)
                ) as [string, any[]][]).map(([category, catProducts]) => (
                  <React.Fragment key={category}>
                    <TableRow className="bg-gray-100/50 border-y border-gray-200">
                      <TableCell colSpan={6} className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                          <h3 className="text-xl font-black text-gray-900">{category} ({catProducts.length}{t.units})</h3>
                        </div>
                      </TableCell>
                    </TableRow>
                    {catProducts.map((product) => (
                      <TableRow key={product.id} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell className="py-3 px-4">
                          <Link to={`/farmer/${product.farmer_id}`} className="block transition-transform hover:scale-105 active:scale-95">
                            <Badge variant="outline" className="font-mono font-black text-blue-600 border-blue-200 bg-blue-50 px-3 py-1 cursor-pointer hover:bg-blue-100 transition-colors">
  {product.sku || t.notAvailable}
</Badge>
                          </Link>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <Link to={`/product/${product.id}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                            <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 shadow-sm flex-shrink-0">
                              <img 
                                src={product.image_url} 
                                alt={product.name} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-base font-black text-gray-800">{product.name}</span>
                              <span className="text-xs text-gray-400 font-medium line-clamp-1">{product.category}</span>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className="text-gray-600 py-3 px-4">
                          <Link to={`/farmer/${product.farmer_id}`} className="hover:text-green-600 transition-colors">
                            <div className="font-bold text-base">{product.farmer?.shop_name || product.farmer?.full_name || t.notAvailable}</div>
                            <div className="text-[10px] text-gray-400">{product.farmer?.full_name}</div>
                          </Link>
                        </TableCell>
                        <TableCell className="py-3 px-4">
  <div className="flex flex-col items-center gap-1">
    <div className="text-lg font-black text-green-700 font-mono tracking-tight">{t.currencySymbol}{product.price.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}</div>
    <div className="text-[9px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100/50">{t.stock}: {product.quantity} {t.units}</div>
  </div>
</TableCell>

<TableCell className="py-3 px-4 text-center">
  <Badge className={`border-none px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg ${
    product.is_approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
  }`}>
    {product.is_approved ? t.approved : t.pendingApprovalShort}
  </Badge>
</TableCell>
                        <TableCell className="sticky right-0 bg-white/95 backdrop-blur-sm z-10 text-right py-3 px-4 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]">
                          <div className="flex items-center justify-end gap-2">
                            {!product.is_approved && (
                              <Button 
                                variant="ghost"
                                size="icon"
                                className="text-green-600 hover:bg-green-50 h-10 w-10 rounded-xl"
                                onClick={() => handleProductApproval(product.id, true)}
                                title={t.approve}
                              >
                                <Check className="w-5 h-5" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost"
                              size="icon"
                              className="text-blue-600 hover:bg-blue-50 h-10 w-10 rounded-xl"
                              onClick={() => {
                                setEditingProduct(product);
                                setEditFormData({
                                  name: product.name,
                                  price: product.price,
                                  quantity: product.quantity,
                                  category: product.category,
                                  description: product.description,
                                  sku: product.sku || '',
                                  image_url: product.image_url || '',
                                  is_approved: product.is_approved
                                });
                              }}
                              title={t.edit}
                            >
                              <Edit2 className="w-5 h-5" />
                            </Button>
                            <Button 
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:bg-red-50 h-10 w-10 rounded-xl"
                              onClick={() => setProductToDelete(product.id)}
                              title={t.deleteProduct}
                            >
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
          </Card>

          {/* Product Delete Confirmation Modal */}
          <Dialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
            <DialogContent className="max-w-sm rounded-3xl border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-black text-red-600 flex items-center gap-2">
                  <Trash2 className="w-6 h-6" /> {t.deleteProduct}
                </DialogTitle>
                <DialogDescription>{t.confirmDeleteProduct}</DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex gap-3 sm:justify-start">
                <Button 
                  variant="outline" 
                  className="flex-1 h-12 rounded-xl font-bold" 
                  onClick={() => setProductToDelete(null)}
                >
                  {t.no}
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1 h-12 rounded-xl font-black bg-red-600 hover:bg-red-700" 
                  onClick={() => handleDeleteProduct(productToDelete!)}
                >
                  {t.yesDelete}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Product Modal */}
          <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
            <DialogContent className="max-w-lg p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
              <DialogHeader className="bg-white border-b border-gray-50 flex flex-row items-center justify-between p-6">
                <DialogTitle className="text-xl font-black">{t.editProduct}</DialogTitle>
                <DialogDescription className="sr-only">Update product details</DialogDescription>
              </DialogHeader>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label className="font-bold">{t.productName}</Label>
                  <Input 
                    value={editFormData.name || ''} 
                    onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">{t.imageURL} (Image URL)</Label>
                  <Input 
                    value={editFormData.image_url || ''} 
                    onChange={e => setEditFormData({...editFormData, image_url: e.target.value})}
                    className="h-12 rounded-xl"
                    placeholder="https://..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold">{t.price} ({t.currencySymbol})</Label>
                    <Input 
                      type="number" 
                      value={editFormData.price ?? 0} 
                      onChange={e => setEditFormData({...editFormData, price: Number(e.target.value)})}
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">{t.stockQuantity}</Label>
                    <Input 
                      type="number" 
                      value={editFormData.quantity ?? 0} 
                      onChange={e => setEditFormData({...editFormData, quantity: Number(e.target.value)})}
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">{t.category}</Label>
                  <Select 
                    value={productCategories.includes(editFormData.category) ? editFormData.category : 'Others'} 
                    onValueChange={(val) => {
                      if (val === 'Others') {
                        if (productCategories.includes(editFormData.category)) {
                          setEditFormData({...editFormData, category: ''});
                        }
                      } else {
                        setEditFormData({...editFormData, category: val});
                      }
                    }}
                  >
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="ক্যাটাগরি নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      {productCategories.map(cat => {
                        const translated = getTranslatedCategory(cat, t);
                        return (
                          <SelectItem key={cat} value={cat}>
                            {translated !== cat ? `${translated} (${cat})` : cat}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {!productCategories.includes(editFormData.category) && (
                    <Input 
                      placeholder={t.customCategoryPlaceholder || "নতুন ক্যাটাগরির নাম লিখুন"} 
                      value={editFormData.category || ''}
                      onChange={e => setEditFormData({...editFormData, category: e.target.value})}
                      className="h-12 rounded-xl mt-2"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">{t.skuId}</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={editFormData.sku || ''} 
                      onChange={e => setEditFormData({...editFormData, sku: e.target.value.toUpperCase()})}
                      className="h-12 rounded-xl font-mono uppercase flex-1"
                      placeholder={t.autoGenerate}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleGenerateSingleSKU}
                      className="h-12 px-4 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
                      title={t.generateUniqueSKU}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" /> {t.generate}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">{t.approvalStatus}</Label>
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 p-3 rounded-xl">
                    <Button
                      type="button"
                      variant={editFormData.is_approved ? "default" : "outline"}
                      onClick={() => setEditFormData({...editFormData, is_approved: true})}
                      className={`flex-1 rounded-lg h-10 ${editFormData.is_approved ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    >
                      <Check className="w-4 h-4 mr-2" /> {t.approved}
                    </Button>
                    <Button
                      type="button"
                      variant={!editFormData.is_approved ? "destructive" : "outline"}
                      onClick={() => setEditFormData({...editFormData, is_approved: false})}
                      className={`flex-1 rounded-lg h-10 ${!editFormData.is_approved ? 'bg-red-600 hover:bg-red-700' : ''}`}
                    >
                      <X className="w-4 h-4 mr-2" /> {t.pendingApprovalShort}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">{t.description}</Label>
                  <div className="relative">
                    <Input 
                      value={editFormData.description || ''} 
                      onChange={e => setEditFormData({...editFormData, description: e.target.value})}
                      className="h-12 rounded-xl pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={isGeneratingDescription}
                      onClick={handleAIDescription}
                      className="absolute right-1 top-1 h-10 w-10 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      title="AI দিয়ে ডেসক্রিপশন জেনারেট করুন"
                    >
                      {isGeneratingDescription ? (
                        <RefreshCcw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-500" /> যাদুর কাঠি আইকনে ক্লিক করে AI ডেসক্রিপশন তৈরি করুন
                  </p>
                </div>
              </div>
              <DialogFooter className="p-6 bg-gray-50 flex gap-3 sm:justify-start">
                <Button 
                  variant="outline" 
                  className="flex-1 h-12 rounded-xl font-bold" 
                  onClick={() => setEditingProduct(null)}
                >
                  {t.cancel}
                </Button>
                <Button 
                  className="flex-1 h-12 rounded-xl font-bold bg-blue-600 hover:bg-blue-700" 
                  onClick={handleUpdateProduct}
                  disabled={isUpdatingProduct}
                >
                  {isUpdatingProduct ? t.updating : t.update}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="orders">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6 p-8">
              <CardTitle className="text-2xl font-black flex items-center gap-3">
                <ShoppingBag className="w-7 h-7 text-purple-600" /> {t.allOrders}
              </CardTitle>
              <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input 
                    type="date"
                    className="pl-12 h-14 rounded-2xl border-gray-200 text-lg shadow-sm focus:ring-2 focus:ring-green-500/20"
                    value={orderDateFilter || ''}
                    onChange={(e) => setOrderDateFilter(e.target.value)}
                  />
                  {orderDateFilter && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-red-500"
                      onClick={() => setOrderDateFilter('')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input 
                    placeholder={t.searchOrderPlaceholder} 
                    className="pl-12 h-14 rounded-2xl border-gray-200 text-lg shadow-sm focus:ring-2 focus:ring-green-500/20"
                    value={orderSearchQuery || ''}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <div className="overflow-x-auto max-h-[750px] overflow-y-auto">
              <Table className="min-w-[1200px]">
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="font-bold text-xs py-3 px-4">{t.id}</TableHead>
                  <TableHead className="font-bold text-xs py-3 px-4">{t.dateTime}</TableHead>
                  <TableHead className="font-bold text-xs py-3 px-4">{t.customer}</TableHead>
                  <TableHead className="font-bold text-xs py-3 px-4">{t.total}</TableHead>
                  <TableHead className="font-bold text-xs py-3 px-4">{t.status}</TableHead>
                  <TableHead className="font-bold text-xs py-3 px-4">{t.deliveryMan}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders
                  .filter(o => {
                    const matchesId = o.id.toLowerCase().includes(orderSearchQuery.toLowerCase());
                    const matchesDate = !orderDateFilter || o.created_at.split('T')[0] === orderDateFilter;
                    return matchesId && matchesDate;
                  })
                  .length > 0 ? orders.filter(o => {
                    const matchesId = o.id.toLowerCase().includes(orderSearchQuery.toLowerCase());
                    const matchesDate = !orderDateFilter || o.created_at.split('T')[0] === orderDateFilter;
                    return matchesId && matchesDate;
                  }).map((order) => (
                  <TableRow key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="font-mono py-3 px-4">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="text-green-600 hover:text-green-700 font-bold bg-green-50 px-2.5 py-1 rounded-lg transition-all hover:shadow-sm text-xs"
                      >
                        #{order.id.slice(0, 8)}
                      </button>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="font-bold text-sm text-gray-800 tracking-tight">{new Date(order.created_at).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}</div>
                      <div className="text-[10px] text-gray-500 font-bold">{new Date(order.created_at).toLocaleTimeString(language === 'bn' ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                    </TableCell>
                    <TableCell className="font-bold text-sm text-gray-700 py-3 px-4">{order.consumer?.full_name}</TableCell>
                    <TableCell className="font-black text-base text-gray-900 py-3 px-4">{t.currencySymbol}{order.total_amount}</TableCell>
                    <TableCell className="py-3 px-4">
                      <Badge className={`px-2 py-0.5 border-none text-[10px] font-bold ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status === 'pending' ? t.orderPending :
                         order.status === 'confirmed' ? t.orderConfirmed :
                         order.status === 'processing' ? t.orderInProcess :
                         order.status === 'shipped' ? t.orderShipped :
                         order.status === 'delivered' ? t.orderDelivered : t.orderCancelled}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm py-3 px-4 font-bold">{order.delivery_man?.full_name || t.notAssigned}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 bg-gray-50/30">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                          <ShoppingBag className="w-8 h-8 text-gray-200" />
                        </div>
                        <p className="text-gray-400 font-bold italic">{t.noOrdersFound || 'No orders found matching your search.'}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          </Card>

          {/* Order Details Modal */}
          {selectedOrder && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
              <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                  <CardTitle className="text-xl">{t.orderDetails}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)}>
                    <X className="w-5 h-5" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{t.orderId}</p>
                      <p className="font-mono text-sm">#{selectedOrder.id}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{t.orderStatus}</p>
                      <Select 
                        value={selectedOrder.status} 
                        onValueChange={(value) => handleUpdateOrderStatus(selectedOrder.id, value)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder={t.changeStatus} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">{t.orderPending}</SelectItem>
                          <SelectItem value="confirmed">{t.orderConfirmed}</SelectItem>
                          <SelectItem value="picked_up">{t.orderPickedUp}</SelectItem>
                          <SelectItem value="on_the_way">{t.orderOnTheWay}</SelectItem>
                          <SelectItem value="delivered">{t.orderDelivered}</SelectItem>
                          <SelectItem value="cancelled">{t.orderCancelled}</SelectItem>
                          <SelectItem value="return_requested">{t.returnRequested}</SelectItem>
                          <SelectItem value="return_picked_up">{t.returnPickedUp}</SelectItem>
                          <SelectItem value="returned">{t.returned}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{t.paymentMethod}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {selectedOrder.payment_method === 'cod' ? <Truck className="w-4 h-4 text-gray-600" /> :
                         selectedOrder.payment_method === 'bkash' ? <Smartphone className="w-4 h-4 text-[#D12053]" /> :
                         selectedOrder.payment_method === 'nagad' ? <Wallet className="w-4 h-4 text-[#F15A22]" /> :
                         <CreditCard className="w-4 h-4 text-blue-600" />}
                        <p className="font-black text-sm uppercase">
                          {selectedOrder.payment_method === 'cod' ? 'COD' : 
                           selectedOrder.payment_method === 'bkash' ? 'bKash' :
                           selectedOrder.payment_method === 'nagad' ? 'Nagad' : 'SSLCommerz'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{t.paymentStatus}</p>
                      <Badge className={`mt-1 border-none font-black text-[10px] px-2 py-0.5 ${
                        selectedOrder.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {selectedOrder.payment_status === 'paid' ? t.paid : t.unpaid}
                      </Badge>
                    </div>
                  </div>

                  {selectedOrder.transaction_id && (
                    <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                      <p className="text-[10px] text-blue-600 uppercase font-black tracking-widest mb-1">{t.transactionId}</p>
                      <p className="font-mono text-sm font-black text-blue-800">{selectedOrder.transaction_id}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div 
                      className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => setSelectedUser(selectedOrder.consumer || null)}
                    >
                      <User className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-blue-900">{t.customerInfo}</p>
                          <ExternalLink className="w-3 h-3 text-blue-500" />
                        </div>
                        <p className="text-sm text-gray-700 font-medium">{selectedOrder.consumer?.full_name}</p>
                        <p className="text-xs text-gray-500">{selectedOrder.consumer?.email}</p>
                        <p className="text-[10px] text-blue-600 mt-1 font-bold">{t.clickToSeeProfile}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold">{t.deliveryAddress}</p>
                        <p className="text-sm text-gray-600 font-medium">{selectedOrder.consumer?.full_name}</p>
                        <p className="text-sm text-gray-600">{selectedOrder.address}</p>
                        <p className="text-xs text-gray-500 mt-1">{t.phone}: {selectedOrder.phone}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold">{t.orderDate}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(selectedOrder.created_at).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <Truck className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold">{t.deliveryMan}</p>
                        <p className="text-sm text-gray-600">
                          {selectedOrder.delivery_man?.full_name || t.notAssigned}
                        </p>
                        {selectedOrder.delivery_man?.phone && (
                          <p className="text-xs text-gray-500">{selectedOrder.delivery_man.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Items Section */}
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-gray-900 border-b pb-1">{t.orderedProducts}</p>
                    <div className="space-y-2">
                      {orderItems.filter(item => item.order_id === selectedOrder.id).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 border rounded-lg bg-white">
                          <img 
                            src={item.products?.image_url || 'https://picsum.photos/seed/product/100/100'} 
                            alt={item.products?.name}
                            className="w-12 h-12 rounded-md object-cover border"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{item.products?.name}</p>
                            <div className="flex flex-col">
                              <p className="text-[10px] font-bold text-gray-400">
                                {t.seller}: {item.products?.farmer?.shop_name || item.products?.farmer?.full_name}
                              </p>
                              <p className="text-[10px] font-mono font-bold text-blue-600">SKU: {item.products?.sku || t.notAvailable}</p>
                            </div>
                            <p className="text-xs text-gray-500 font-medium">{item.quantity} x {t.currencySymbol}{item.price_at_time}</p>
                          </div>
                          <p className="text-sm font-bold text-gray-900">{t.currencySymbol}{item.quantity * item.price_at_time}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <div className="flex gap-2">
                       <InvoiceModal order={selectedOrder} />
                       <DeliverySlipModal order={selectedOrder} />
                    </div>
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>{t.totalPayable}:</span>
                      <span className="text-green-700">{t.currencySymbol}{selectedOrder.total_amount}</span>
                    </div>
                  </div>

                  <Button className="w-full bg-gray-900 text-white" onClick={() => setSelectedOrder(null)}>
                    {t.close}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* User Profile & Order History Modal */}
          {selectedUser && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4 backdrop-blur-sm">
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-white sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{selectedUser.full_name}</CardTitle>
                      <p className="text-xs text-gray-500">{selectedUser.email}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedUser(null)}>
                    <X className="w-5 h-5" />
                  </Button>
                </CardHeader>
                <CardContent className="overflow-y-auto p-0">
                  <div className="p-6 space-y-6">
                    {/* User Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-3 rounded-xl text-center border border-gray-100">
                        <p className="text-xl font-bold text-gray-900">
                          {orders.filter(o => o.consumer_id === selectedUser.id).length.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                        </p>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">{t.totalOrders}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-xl text-center border border-green-100">
                        <p className="text-xl font-bold text-green-700">
                          {orders.filter(o => o.consumer_id === selectedUser.id && o.status === 'delivered').length.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                        </p>
                        <p className="text-[10px] text-green-600 uppercase font-bold">{t.successDelivery}</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-xl text-center border border-blue-100">
                        <p className="text-xl font-bold text-blue-700">
                          {t.currencySymbol}{orders.filter(o => o.consumer_id === selectedUser.id && o.status === 'delivered').reduce((sum, o) => sum + o.total_amount, 0).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                        </p>
                        <p className="text-[10px] text-blue-600 uppercase font-bold">{t.totalSpent}</p>
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-gray-900 border-b pb-1">{t.userInfo}</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-gray-500">{t.phone}</p>
                          <p className="font-medium">{selectedUser.phone || t.noData}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{t.address}</p>
                          <p className="font-medium">{selectedUser.address || t.noData}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{t.role}</p>
                          <Badge variant="outline" className="capitalize">{selectedUser.role}</Badge>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{t.joinDate}</p>
                          <p className="font-medium">{new Date(selectedUser.created_at).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Order History */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-gray-900 border-b pb-1">{t.orderHistory}</h3>
                      <div className="space-y-3">
                        {orders.filter(o => o.consumer_id === selectedUser.id).length === 0 ? (
                          <p className="text-center py-8 text-gray-500 text-sm italic">{t.noOrdersFound}</p>
                        ) : (
                          orders
                            .filter(o => o.consumer_id === selectedUser.id)
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .map(order => (
                              <div key={order.id} className="border rounded-lg p-3 hover:border-green-200 transition-colors bg-white shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="text-xs font-mono font-bold text-gray-500">#{order.id.slice(0, 8)}</p>
                                    <p className="text-[10px] text-gray-400">{new Date(order.created_at).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}</p>
                                  </div>
                                  <Badge className={
                                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                    'bg-blue-100 text-blue-700'
                                  }>
                                    {order.status}
                                  </Badge>
                                </div>

                                {/* Order Items Summary */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {orderItems.filter(item => item.order_id === order.id).map((item, idx) => (
                                    <div key={idx} className="relative group">
                                      <img 
                                        src={item.products?.image_url || 'https://picsum.photos/seed/product/100/100'} 
                                        alt={item.products?.name}
                                        className="w-10 h-10 rounded-md object-cover border shadow-sm"
                                        referrerPolicy="no-referrer"
                                      />
                                      <span className="absolute -top-1 -right-1 bg-green-600 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center border border-white font-bold">
                                        {item.quantity}
                                      </span>
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-10">
                                        {item.products?.name}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div className="flex justify-between items-center">
                                  <p className="text-sm font-bold text-gray-700">{t.currencySymbol}{order.total_amount}</p>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-7 text-[10px] px-2"
                                    onClick={() => {
                                      setSelectedOrder(order);
                                      setSelectedUser(null);
                                    }}
                                  >
                                    {t.viewDetails}
                                  </Button>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <div className="p-4 border-t bg-gray-50">
                  <Button className="w-full" onClick={() => setSelectedUser(null)}>
                    {t.close}
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="new-admin">
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Add New Admin Form */}
              <Card className="w-full md:w-[450px] border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white shrink-0">
                <CardHeader className="p-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md border border-white/10">
                    <UserPlus className="w-6 h-6 text-blue-400" />
                  </div>
                  <CardTitle className="text-2xl font-black">{t.addAdmin || 'Add New Admin'}</CardTitle>
                  <CardDescription className="text-gray-400">{t.addAdminSub || 'Grant administrative access to a user'}</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <form onSubmit={handleCreateAdmin} className="space-y-6">
                    <div className="space-y-3">
                      <Label className="font-bold text-gray-700">Email Address</Label>
                      <Input 
                        placeholder="admin@example.com" 
                        value={newAdmin.email || ''} 
                        onChange={e => setNewAdmin({...newAdmin, email: e.target.value})}
                        className="h-12 rounded-xl border-gray-100 bg-gray-50/50" 
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="font-bold text-gray-700">Full Name</Label>
                      <Input 
                        placeholder="Enter full name" 
                        value={newAdmin.fullName || ''} 
                        onChange={e => setNewAdmin({...newAdmin, fullName: e.target.value})}
                        className="h-12 rounded-xl border-gray-100 bg-gray-50/50" 
                      />
                    </div>
                    <Button type="submit" className="w-full h-14 bg-gray-900 hover:bg-black text-white font-black rounded-xl shadow-lg transition-all active:scale-95">
                      {t.createAdminAccount || 'Create Admin Account'}
                    </Button>
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3 text-blue-700">
                      <ShieldCheck className="w-5 h-5 shrink-0" />
                      <p className="text-[10px] leading-relaxed font-medium">
                        Administrators have full access to system data, orders, and configuration. Be cautious when granting these permissions.
                      </p>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Admins List */}
              <Card className="flex-1 border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="p-4 border-b border-gray-50">
                   <div className="flex items-center justify-between">
                     <div>
                        <CardTitle className="text-xl font-black text-gray-900">{t.systemAdmins || 'System Administrators'}</CardTitle>
                        <CardDescription className="text-sm text-gray-500">{t.activeAdmins || 'Active users with administrative privileges'}</CardDescription>
                     </div>
                     <Badge className="bg-blue-100 text-blue-700 border-none font-black px-3 py-1 rounded-xl uppercase tracking-widest text-[8px]">
                        {users.filter(u => u.role === 'admin').length} ACTIVE
                     </Badge>
                   </div>
                </CardHeader>
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                   <Table>
                      <TableHeader className="bg-gray-50/50">
                        <TableRow className="hover:bg-transparent border-b border-gray-100">
                          <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 py-3 px-4">ADMINISTRATOR</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 py-3 px-4">CONTACT INFO</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 py-3 px-4">LEVEL</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 py-3 px-4 text-right">ACTION</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.filter(u => u.role === 'admin').map((adm) => (
                          <TableRow key={adm.id} className="group hover:bg-gray-50 transition-all">
                            <TableCell className="py-3 px-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                                     {adm.avatar_url ? (
                                        <img src={adm.avatar_url} alt="" className="w-full h-full object-cover" />
                                     ) : (
                                        <User className="w-5 h-5 text-gray-400" />
                                     )}
                                  </div>
                                  <div>
                                     <p className="font-bold text-gray-900 text-sm">{adm.full_name}</p>
                                     <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-0.5">SUPER_USER</p>
                                  </div>
                               </div>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                               <div className="space-y-0.5">
                                  <p className="font-bold text-gray-700 text-xs">{adm.email}</p>
                                  <p className="text-[10px] text-gray-400 font-medium">{adm.phone || 'No phone set'}</p>
                               </div>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                               <Badge className="bg-gray-100 text-gray-600 border-none font-bold text-[9px] px-2 py-0.5 rounded-md">
                                  LEVEL 1
                                </Badge>
                            </TableCell>
                            <TableCell className="py-3 px-4 text-right">
                               <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                                  <ShieldAlert className="w-4 h-4" />
                               </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                   </Table>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="complaints">
          <Card className="border-none shadow-sm overflow-hidden">
             <CardHeader className="bg-white border-b border-gray-50 p-4 lg:p-6">
               <CardTitle className="text-xl font-black flex items-center gap-3">
                 <AlertTriangle className="w-6 h-6 text-red-600" /> {t.complaintManagement}
               </CardTitle>
               <CardDescription className="text-sm">{t.complaintSub}</CardDescription>
             </CardHeader>
             <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
               <Table className="min-w-[1000px]">
                 <TableHeader className="bg-gray-50/50">
                   <TableRow>
                     <TableHead className="py-3 px-4 font-bold text-xs">{t.id}</TableHead>
                     <TableHead className="py-3 px-4 font-bold text-xs">{t.customer}</TableHead>
                     <TableHead className="py-3 px-4 font-bold text-xs">{t.order}</TableHead>
                     <TableHead className="py-3 px-4 font-bold text-xs">{t.type}</TableHead>
                     <TableHead className="py-3 px-4 font-bold text-xs">{t.reason}</TableHead>
                     <TableHead className="py-3 px-4 font-bold text-xs">{t.status}</TableHead>
                     <TableHead className="sticky right-0 bg-gray-50/50 z-20 py-3 px-4 font-bold text-xs text-right shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]">{t.action}</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {complaints.map(complaint => (
                     <TableRow key={complaint.id}>
                       <TableCell className="py-3 px-4 font-mono text-[10px]">#{complaint.id.slice(0,8)}</TableCell>
                       <TableCell className="py-3 px-4">
                          <p className="font-bold text-xs">{complaint.consumer?.full_name}</p>
                          <p className="text-[10px] text-gray-500">{complaint.consumer?.phone}</p>
                       </TableCell>
                       <TableCell className="py-3 px-4">
                          <Button variant="link" className="p-0 h-auto font-black text-green-700 text-xs" onClick={() => setSelectedOrder(complaint.order || null)}>
                            #{complaint.order_id.slice(0,8)}
                          </Button>
                       </TableCell>
                       <TableCell className="py-3 px-4 capitalize font-bold text-gray-700 text-xs">{complaint.type.replace('_', ' ')}</TableCell>
                       <TableCell className="py-3 px-4 max-w-[150px] truncate text-xs">{complaint.reason}</TableCell>
                       <TableCell className="py-3 px-4">
                          <Badge className={`border-none font-bold text-[9px] px-2 py-0.5 ${
                            complaint.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            complaint.status === 'resolved' ? 'bg-green-100 text-green-700' :
                            complaint.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {complaint.status === 'pending' ? t.complaintPending :
                             complaint.status === 'resolved' ? t.complaintResolved :
                             complaint.status === 'rejected' ? t.complaintRejected : t.complaintReview}
                          </Badge>
                       </TableCell>
                       <TableCell className="sticky right-0 bg-white/95 backdrop-blur-sm z-10 py-3 px-4 text-right shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]">
                          <Select 
                            value={complaint.status} 
                            onValueChange={async (status: any) => {
                               const { error } = await supabase.from('complaints').update({ status }).eq('id', complaint.id);
                               if (!error) {
                                 toast.success(t.updateComplaintStatus);
                                 fetchAllData();
                               }
                            }}
                          >
                            <SelectTrigger className="w-[100px] h-7 text-[10px] ml-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                               <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                               <SelectItem value="in_review" className="text-xs">In Review</SelectItem>
                               <SelectItem value="resolved" className="text-xs">Resolved</SelectItem>
                               <SelectItem value="rejected" className="text-xs">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                       </TableCell>
                     </TableRow>
                   ))}
                   {complaints.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-10 text-gray-400 italic text-sm">{t.noComplaints}</TableCell></TableRow>}
                 </TableBody>
               </Table>
             </div>
          </Card>
        </TabsContent>

        <TabsContent value="vouchers">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="p-8 border-b border-gray-50 bg-gradient-to-r from-green-50/30 to-transparent">
                <CardTitle className="text-2xl font-black flex items-center gap-4 text-gray-900">
                  <Ticket className="w-8 h-8 text-green-600" /> {t.createVoucher}
                </CardTitle>
                <CardDescription className="text-gray-400 font-medium">{t.voucherSub}</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const formData = new FormData(form);
                  const newV = {
                    code: formData.get('code')?.toString().toUpperCase(),
                    discount_type: formData.get('type'),
                    value: Number(formData.get('value')),
                    min_purchase: Number(formData.get('min')),
                    expiry_date: formData.get('expiry') || null,
                    is_active: true
                  };
                  const { error } = await supabase.from('vouchers').insert(newV);
                  if (error) toast.error(error.message);
                  else {
                    toast.success(t.voucherSaved);
                    form?.reset();
                    fetchAllData();
                  }
                }} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-gray-500">{t.voucherCode}</Label>
                    <Input name="code" required placeholder="EID2026" className="h-12 rounded-xl border-gray-200 font-mono font-black focus:ring-green-500/10 uppercase" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-gray-500">{t.voucherType}</Label>
                      <Select name="type" defaultValue="percentage">
                        <SelectTrigger className="h-12 rounded-xl border-gray-200 font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage" className="font-bold">{t.voucherTypePercentage}</SelectItem>
                          <SelectItem value="fixed" className="font-bold">{t.voucherTypeFixed}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-gray-500">{t.voucherValue}</Label>
                      <Input name="value" type="number" required className="h-12 rounded-xl border-gray-200 font-bold" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-gray-500">{t.minPurchaseLimit}</Label>
                    <Input name="min" type="number" required defaultValue="500" className="h-12 rounded-xl border-gray-200 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-gray-500">{t.expiryDate}</Label>
                    <Input name="expiry" type="datetime-local" className="h-12 rounded-xl border-gray-200 font-bold" />
                  </div>
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 h-14 font-black rounded-xl shadow-lg shadow-green-100 transition-all hover:-translate-y-0.5">
                    {t.saveVoucher}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="p-4 lg:p-6 border-b border-gray-50">
                <CardTitle className="text-xl font-black flex items-center gap-4 text-gray-900">
                  <Package className="w-7 h-7 text-blue-600" /> {t.activeVouchers}
                </CardTitle>
              </CardHeader>
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <Table className="min-w-[800px]">
                  <TableHeader className="bg-gray-50/30">
                    <TableRow className="hover:bg-transparent border-b border-gray-100">
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 py-3 px-4">{t.voucherCode}</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 py-3 px-4 text-center">{t.discount}</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 py-3 px-4 text-center">{t.minSpent}</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 py-3 px-4 text-center">{t.validUntil}</TableHead>
                      <TableHead className="sticky right-0 bg-gray-50/50 z-20 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 py-3 px-4 text-right shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]">{t.action}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vouchers.map(v => (
                      <TableRow key={v.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="py-3 px-4">
                          <span className="font-mono font-black text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-100 italic text-xs">{v.code}</span>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-center">
                          <span className="font-black text-gray-900 text-xs">{v.value}{v.discount_type === 'percentage' ? '%' : t.currencySymbol} OFF</span>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-center">
                          <span className="font-bold text-gray-600 text-xs">{t.currencySymbol}{v.min_purchase.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}</span>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-center">
                          <Badge variant="outline" className={`font-bold border-gray-100 text-[9px] px-2 py-0.5 ${v.expiry_date && new Date(v.expiry_date) < new Date() ? 'text-red-500 bg-red-50' : 'text-blue-600 bg-blue-50'}`}>
                            {v.expiry_date ? new Date(v.expiry_date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US') : t.unlimited}
                          </Badge>
                        </TableCell>
                        <TableCell className="sticky right-0 bg-white/95 backdrop-blur-sm z-10 py-3 px-4 text-right shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg h-7 w-7"
                            onClick={async () => {
                               const { error } = await supabase.from('vouchers').delete().eq('id', v.id);
                               if (!error) fetchAllData();
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {vouchers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-16 text-gray-400 font-medium italic text-sm">
                          {t.noVouchersFound || 'No active vouchers at the moment'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs">
           <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-[#0A0B0D]">
             <CardHeader className="p-6 border-b border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                <CardTitle className="text-xl font-black flex items-center gap-3 text-white">
                  <History className="w-6 h-6 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" /> {t.adminLogs}
                </CardTitle>
                <CardDescription className="text-gray-400 font-medium text-sm mt-1">{t.adminLogsSub}</CardDescription>
             </CardHeader>
             <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
               <Table className="min-w-[1000px]">
                 <TableHeader className="bg-white/5">
                   <TableRow className="hover:bg-transparent border-b border-white/5">
                     <TableHead className="py-3 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{t.time}</TableHead>
                     <TableHead className="py-3 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{t.admin}</TableHead>
                     <TableHead className="py-3 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{t.action}</TableHead>
                     <TableHead className="py-3 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{t.target}</TableHead>
                     <TableHead className="py-3 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 text-center">Ref ID</TableHead>
                     <TableHead className="py-3 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{t.details}</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {adminLogs.map(log => (
                     <TableRow key={log.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                       <TableCell className="py-3 px-4">
                          <span className="text-[10px] text-gray-500 font-mono tracking-tighter block group-hover:text-blue-400 transition-colors">
                             {new Date(log.created_at).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                          </span>
                       </TableCell>
                       <TableCell className="py-3 px-4">
                          <div className="flex items-center gap-2">
                             <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-[10px] text-blue-400 font-black border border-blue-500/20">
                                {log.admin?.full_name?.charAt(0)}
                             </div>
                             <span className="font-bold text-xs text-gray-200 whitespace-nowrap">{log.admin?.full_name}</span>
                          </div>
                       </TableCell>
                       <TableCell className="py-3 px-4">
                          <Badge className={`border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-md ${
                             log.action.includes('FREEZE') ? 'bg-red-500/20 text-red-400' :
                             log.action.includes('REFUND') ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                             {log.action}
                          </Badge>
                       </TableCell>
                       <TableCell className="py-3 px-4">
                          {(() => {
                             if (log.action.includes('SHOP') || log.action.includes('FARMER')) {
                                const farmer = farmers.find(f => f.id === log.target_id);
                                return farmer ? (
                                   <Link to={`/farmer/${farmer.id}`} className="text-blue-400 hover:text-blue-300 font-bold text-[10px] flex items-center gap-1.5 transition-colors">
                                      <Store className="w-3.5 h-3.5" /> {farmer.shop_name || farmer.full_name}
                                   </Link>
                                ) : <span className="text-gray-600 text-[10px] italic">{t.notAvailable || 'N/A'}</span>;
                             }
                             if (log.action.includes('PRODUCT')) {
                                const product = products.find(p => p.id === log.target_id);
                                return product ? (
                                   <Link to={`/product/${product.id}`} className="text-blue-400 hover:text-blue-300 font-bold text-[10px] flex items-center gap-1.5 transition-colors">
                                      <Package className="w-3.5 h-3.5" /> {product.name}
                                   </Link>
                                ) : <span className="text-gray-600 text-[10px] italic">{t.notAvailable || 'N/A'}</span>;
                             }
                             return <span className="text-gray-600 uppercase font-black text-[8px] tracking-widest">System</span>;
                          })()}
                       </TableCell>
                       <TableCell className="py-3 px-4 text-center">
                          <span className="font-mono text-[9px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded-md border border-white/5">{log.target_id.slice(0, 8)}</span>
                       </TableCell>
                       <TableCell className="py-3 px-4 text-[11px] text-gray-400 font-medium max-w-[250px] leading-relaxed">
                          <div className="group/detail relative flex flex-col gap-1">
                             <div className="truncate">{log.details}</div>
                             <Dialog>
                                <DialogTrigger render={(props) => (
                                   <button 
                                      {...props}
                                      className="text-[9px] text-blue-400 opacity-0 group-hover/detail:opacity-100 transition-opacity flex items-center gap-1 font-black uppercase hover:text-blue-300"
                                   >
                                      <Search className="w-2.5 h-2.5" /> {t.viewDetails || 'View Details'}
                                   </button>
                                )} />
                                <DialogContent className="max-w-md bg-gray-900 border-white/10 text-white shadow-2xl">
                                   <DialogHeader>
                                      <DialogTitle className="text-white text-lg font-black tracking-tight flex items-center gap-2">
                                         <History className="w-5 h-5 text-blue-400 shadow-sm" /> {t.logDetails || 'Log Details'}
                                      </DialogTitle>
                                      <DialogDescription className="text-gray-400 font-mono text-[10px]">Reference ID: {log.target_id}</DialogDescription>
                                   </DialogHeader>
                                   <div className="bg-black/80 p-5 rounded-2xl border border-white/5 font-mono text-[11px] leading-relaxed break-all overflow-y-auto max-h-[400px] mt-4 shadow-inner">
                                      {(() => {
                                         try {
                                            const obj = JSON.parse(log.details || '{}');
                                            return <pre className="whitespace-pre-wrap tracking-tighter text-blue-200/80">{JSON.stringify(obj, null, 2)}</pre>;
                                         } catch (e) {
                                            return <span className="opacity-80 leading-loose break-words">{log.details}</span>;
                                         }
                                      })()}
                                   </div>
                                </DialogContent>
                             </Dialog>
                          </div>
                       </TableCell>
                     </TableRow>
                   ))}
                   {adminLogs.length === 0 && (
                     <TableRow>
                       <TableCell colSpan={6} className="text-center py-20">
                          <div className="flex flex-col items-center gap-3 opacity-40">
                             <History className="w-10 h-10 text-gray-600" />
                             <p className="text-gray-500 font-bold italic text-sm tracking-wide">{t.noDataInAuditLog}</p>
                          </div>
                       </TableCell>
                     </TableRow>
                   )}
                 </TableBody>
               </Table>
             </div>
           </Card>
        </TabsContent>

        <TabsContent value="flash-sale">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 lg:p-6">
              <CardTitle className="text-xl font-black flex items-center gap-2">
                <Tag className="w-6 h-6 text-orange-600" /> Flash Sale Management
              </CardTitle>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder={t.searchSKUPlaceholder || "Search products..."} 
                  className="pl-10 h-10 rounded-xl border-gray-200 text-sm shadow-sm focus:ring-2 focus:ring-orange-500/20"
                  value={flashSaleSearchQuery}
                  onChange={(e) => setFlashSaleSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <div className="overflow-x-auto max-h-[700px] shadow-inner">
              <Table className="min-w-[800px]">
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 py-3 px-4">Product</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 py-3 px-4">Regular Price</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 py-3 px-4">Status</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 py-3 px-4">Flash Sale Price</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 py-3 px-4 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products
                    .filter(p => !flashSaleSearchQuery || p.name.toLowerCase().includes(flashSaleSearchQuery.toLowerCase()) || p.sku?.toLowerCase().includes(flashSaleSearchQuery.toLowerCase()))
                    .map(product => (
                        <FlashSaleRow 
                          key={product.id} 
                          product={product} 
                          onUpdate={handleFlashSaleUpdate} 
                        />
                    ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
            {/* Admin Profile Settings */}
            <Card className="lg:col-span-2 border-none shadow-xl rounded-[2.5rem] overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-50 p-10">
                <CardTitle className="text-3xl font-black flex items-center gap-4">
                  <Settings className="w-8 h-8 text-gray-600" /> {t.adminSettings}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10">
                <div className="space-y-10">
                  <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 shadow-inner">
                    <p className="text-xl text-blue-800 font-black">{t.currentEmail}: {user?.email}</p>
                  </div>

                  <form onSubmit={handleUpdateEmail} className="space-y-8 pb-10 border-b border-gray-100">
                    <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                      <Users className="w-6 h-6 text-blue-600" /> {t.changeEmail}
                    </h3>
                    <div className="space-y-3">
                      <Label className="text-lg font-black text-gray-700">{t.newEmailAddress}</Label>
                      <Input 
                        type="email" 
                        required 
                        value={emailData.newEmail} 
                        onChange={e => setEmailData({newEmail: e.target.value})} 
                        placeholder={t.enterNewEmail}
                        className="h-16 rounded-2xl border-gray-200 text-xl shadow-sm focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-16 text-xl font-black rounded-2xl shadow-lg shadow-blue-100 transition-all hover:-translate-y-1" disabled={updatingEmail}>
                      {updatingEmail ? t.sendingRequest : t.changeEmailSubmit}
                    </Button>
                    <p className="text-sm text-amber-600 italic font-bold">
                      {t.emailChangeNote}
                    </p>
                  </form>
                  
                  <form onSubmit={handleUpdatePassword} className="space-y-8">
                    <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                      <Lock className="w-6 h-6 text-red-600" /> {t.changePassword}
                    </h3>
                    <div className="space-y-3">
                      <Label className="text-lg font-black text-gray-700">{t.newPassword}</Label>
                      <Input 
                        type="password" 
                        required 
                        value={passwordData.new} 
                        onChange={e => setPasswordData({...passwordData, new: e.target.value})} 
                        placeholder={t.passwordPlaceholder}
                        className="h-16 rounded-2xl border-gray-200 text-xl shadow-sm focus:ring-4 focus:ring-red-500/10"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-lg font-black text-gray-700">{t.confirmPassword}</Label>
                      <Input 
                        type="password" 
                        required 
                        value={passwordData.confirm} 
                        onChange={e => setPasswordData({...passwordData, confirm: e.target.value})} 
                        className="h-16 rounded-2xl border-gray-200 text-xl shadow-sm focus:ring-4 focus:ring-red-500/10"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 h-16 text-xl font-black rounded-2xl shadow-lg shadow-red-100 transition-all hover:-translate-y-1" disabled={updatingPassword}>
                      {updatingPassword ? t.updating : t.updatePasswordSubmit}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>

            {/* Site Config / Support Settings */}
            <Card className="lg:col-span-1 border-none shadow-xl rounded-[2.5rem] overflow-hidden self-start">
              <CardHeader className="bg-green-600 p-8 text-white">
                <CardTitle className="text-2xl font-black flex items-center gap-3">
                  <LayoutDashboard className="w-6 h-6" /> {t.siteSettings}
                </CardTitle>
                <p className="text-green-50 text-sm mt-1">{t.siteSettingsSub}</p>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleUpdateSiteSettings} className="space-y-8">
                  <div className="space-y-3">
                    <Label className="font-bold text-gray-700">{t.hotline}</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                      <Input 
                        value={siteSettings.hotline || ''} 
                        onChange={e => setSiteSettings({...siteSettings, hotline: e.target.value})}
                        className="pl-10 h-12 rounded-xl border-gray-200 focus:ring-green-500/10"
                        placeholder="+৮৮০১৩২৪৫৬৭৮৯"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold text-gray-700">{t.supportEmail}</Label>
                    <div className="relative">
                      <ShoppingBag className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                      <Input 
                        type="email"
                        value={siteSettings.email || ''} 
                        onChange={e => setSiteSettings({...siteSettings, email: e.target.value})}
                        className="pl-10 h-12 rounded-xl border-gray-200 focus:ring-green-500/10"
                        placeholder="support@karumart.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label className="font-bold text-gray-700">{t.deliveryCharge}</Label>
                      <Input 
                        type="number"
                        value={siteSettings.delivery_charge ?? 50} 
                        onChange={e => {
                          const val = parseFloat(e.target.value);
                          setSiteSettings({...siteSettings, delivery_charge: isNaN(val) ? 0 : val});
                        }}
                        className="h-12 rounded-xl border-gray-200 focus:ring-green-500/10"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="font-bold text-gray-700">{t.freeDeliveryThreshold}</Label>
                      <Input 
                        type="number"
                        value={siteSettings.free_delivery_threshold ?? 500} 
                        onChange={e => {
                          const val = parseFloat(e.target.value);
                          setSiteSettings({...siteSettings, free_delivery_threshold: isNaN(val) ? 0 : val});
                        }}
                        className="h-12 rounded-xl border-gray-200 focus:ring-green-500/10"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 space-y-6">
                    <h4 className="font-black text-orange-600 flex items-center gap-2">
                       <Tag className="w-4 h-4" /> Flash Sale Customization
                    </h4>
                    
                    <div className="space-y-3">
                      <Label className="font-bold text-gray-700">Background Color (Tailwind classes, Hex Code, or Gradient)</Label>
                      
                      {/* Visual Color Picker Row */}
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-gray-500 uppercase">Custom Color</span>
                          <div className="flex items-center gap-2">
                            <input 
                              type="color" 
                              value={siteSettings.flash_sale_bg_color?.startsWith('#') ? siteSettings.flash_sale_bg_color : '#ff8500'} 
                              onChange={e => setSiteSettings({...siteSettings, flash_sale_bg_color: e.target.value})}
                              className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white shadow-sm"
                            />
                            <span className="text-sm font-mono text-gray-600">{siteSettings.flash_sale_bg_color}</span>
                          </div>
                        </div>
                        <div className="h-10 w-px bg-gray-200 mx-2" />
                        <div className="flex-1">
                          <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Quick Presets</span>
                          <div className="flex flex-wrap gap-2">
                            <Button 
                              type="button" size="sm" variant="outline" 
                              className="h-8 w-8 rounded-full p-0 bg-gradient-to-r from-orange-500 to-red-600 border-none shadow-sm hover:scale-110 transition-transform"
                              onClick={() => setSiteSettings({...siteSettings, flash_sale_bg_color: 'from-orange-500 to-red-600'})}
                              title="Default Orange"
                            />
                            <Button 
                              type="button" size="sm" variant="outline" 
                              className="h-8 w-8 rounded-full p-0 bg-green-300 border-none shadow-sm hover:scale-110 transition-transform"
                              onClick={() => setSiteSettings({...siteSettings, flash_sale_bg_color: '#86efac'})}
                              title="Light Green"
                            />
                            <Button 
                              type="button" size="sm" variant="outline" 
                              className="h-8 w-8 rounded-full p-0 bg-green-600 border-none shadow-sm hover:scale-110 transition-transform"
                              onClick={() => setSiteSettings({...siteSettings, flash_sale_bg_color: '#16a34a'})}
                              title="Classic Green"
                            />
                            <Button 
                              type="button" size="sm" variant="outline" 
                              className="h-8 w-8 rounded-full p-0 bg-gradient-to-r from-green-600 to-emerald-500 border-none shadow-sm hover:scale-110 transition-transform"
                              onClick={() => setSiteSettings({...siteSettings, flash_sale_bg_color: 'linear-gradient(to right, #16a34a, #10b981)'})}
                              title="Eco Fresh"
                            />
                            <Button 
                              type="button" size="sm" variant="outline" 
                              className="h-8 w-8 rounded-full p-0 bg-gradient-to-r from-indigo-600 to-blue-700 border-none shadow-sm hover:scale-110 transition-transform"
                              onClick={() => setSiteSettings({...siteSettings, flash_sale_bg_color: 'linear-gradient(to right, #4f46e5, #1d4ed8)'})}
                              title="Indigo Blue"
                            />
                            <Button 
                              type="button" size="sm" variant="outline" 
                              className="h-8 w-8 rounded-full p-0 bg-gradient-to-r from-amber-500 to-orange-600 border-none shadow-sm hover:scale-110 transition-transform"
                              onClick={() => setSiteSettings({...siteSettings, flash_sale_bg_color: 'linear-gradient(to right, #f59e0b, #ea580c)'})}
                              title="Harvest Gold"
                            />
                            <Button 
                              type="button" size="sm" variant="outline" 
                              className="h-8 w-8 rounded-full p-0 bg-gradient-to-r from-purple-600 to-pink-500 border-none shadow-sm hover:scale-110 transition-transform"
                              onClick={() => setSiteSettings({...siteSettings, flash_sale_bg_color: 'linear-gradient(to right, #9333ea, #ec4899)'})}
                              title="Modern Purple"
                            />
                            <Button 
                              type="button" size="sm" variant="outline" 
                              className="h-8 w-8 rounded-full p-0 bg-gradient-to-r from-teal-500 to-cyan-600 border-none shadow-sm hover:scale-110 transition-transform"
                              onClick={() => setSiteSettings({...siteSettings, flash_sale_bg_color: 'linear-gradient(to right, #14b8a6, #0891b2)'})}
                              title="Ocean Teal"
                            />
                          </div>
                        </div>
                      </div>

                      <Input 
                        value={siteSettings.flash_sale_bg_color || ''} 
                        onChange={e => setSiteSettings({...siteSettings, flash_sale_bg_color: e.target.value})}
                        className="h-12 rounded-xl border-gray-200 focus:ring-green-500/10"
                        placeholder="e.g., #4f46e5 or from-orange-500 to-red-600"
                      />
                      <p className="text-[10px] text-gray-400">Use Preset colors, the Color Picker, or a custom Hex code.</p>
                    </div>

                    <div className="space-y-3">
                      <Label className="font-bold text-gray-700">Background Image URL (Optional)</Label>
                      <Input 
                        value={siteSettings.flash_sale_bg_image || ''} 
                        onChange={e => setSiteSettings({...siteSettings, flash_sale_bg_image: e.target.value})}
                        className="h-12 rounded-xl border-gray-200 focus:ring-orange-500/10"
                        placeholder="https://images.unsplash.com/..."
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="font-bold text-gray-700">Flash Sale End Time (For Countdown)</Label>
                      <Input 
                        type="datetime-local"
                        value={siteSettings.flash_sale_end_time ? new Date(new Date(siteSettings.flash_sale_end_time).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} 
                        onChange={e => setSiteSettings({...siteSettings, flash_sale_end_time: e.target.value})}
                        className="h-12 rounded-xl border-gray-200 focus:ring-orange-500/10"
                      />
                      <p className="text-[10px] text-gray-400">Select when the flash sale section should end/hide.</p>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-700 h-14 font-black rounded-xl shadow-lg shadow-green-100"
                    disabled={updatingSiteSettings}
                  >
                    {updatingSiteSettings ? t.saving : t.saveSettings}
                  </Button>

                  <div className="pt-4 border-t border-gray-100">
                    <Button 
                      type="button"
                      variant="outline"
                      className="w-full h-12 rounded-xl text-blue-600 border-blue-100 hover:bg-blue-50 flex items-center gap-2 font-bold"
                      onClick={() => {
                        navigator.clipboard.writeText(SQL_SETUP_CODE);
                        toast.success('SQL Setup Code copied to clipboard!');
                      }}
                    >
                      <Copy className="w-4 h-4" /> Copy Database Fix SQL
                    </Button>
                    <p className="text-[10px] text-gray-400 mt-2 text-center">
                      If settings won't save, copy this SQL and run it in your Supabase SQL Editor.
                    </p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                    <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                      {t.siteSettingsNote}
                    </p>
                  </div>
                </form>

                {dbStatus.some(s => s.status === 'error') && (
                  <div className="mt-8 p-6 bg-red-50 rounded-2xl border border-red-100">
                    <h4 className="text-red-800 font-bold flex items-center gap-2 mb-2">
                       <AlertTriangle className="w-5 h-5" /> Database Sync Warning
                    </h4>
                    <p className="text-xs text-red-700 leading-relaxed">
                      One or more tables are missing or inaccessible. Please run the SQL setup script in your Supabase SQL Editor.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {dbStatus.map(s => (
                        <Badge key={s.table} variant={s.status === 'ok' ? 'default' : 'destructive'} className="text-[10px]">
                          {s.table}: {s.status}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  </div>
</div>
</div>
  );
}
