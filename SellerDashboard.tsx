import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Product, Order } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Plus, Trash, Package, ShoppingBag, RefreshCw, MapPin, Settings, Edit2, Camera, Image as ImageIcon, X, TrendingUp, CheckCircle, XCircle, Calendar, DollarSign, Snowflake, LineChart as LineChartIcon, BarChart3, Wand2, Sparkles, Share2 } from 'lucide-react';
import { generateProductDescription } from '@/services/geminiService';
import { InvoiceModal } from '@/components/InvoiceModal';
import { DeliverySlipModal } from '@/components/DeliverySlipModal';
import { getTranslatedCategory, COMMON_CATEGORIES } from '@/lib/translations';
import { DistrictSelect } from '@/components/DistrictSelect';
import { detectDistrictFromAddress, ALL_DISTRICTS, findDistrict } from '@/lib/districts';

export default function SellerDashboard() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isUpdateProductOpen, setIsUpdateProductOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [updateStockValue, setUpdateStockValue] = useState<number>(0);
  const [updatePriceValue, setUpdatePriceValue] = useState<number>(0);
  const [updateCategoryValue, setUpdateCategoryValue] = useState<string>('');
  const [updateDescriptionValue, setUpdateDescriptionValue] = useState<string>('');
  const [updateSkuValue, setUpdateSkuValue] = useState<string>('');
  const initialDetected = detectDistrictFromAddress(profile?.address);
  const [selectedDistrict, setSelectedDistrict] = useState<string>(initialDetected?.id || '');
  const [detailedAddress, setDetailedAddress] = useState<string>(() => {
    if (!profile?.address) return '';
    if (initialDetected) {
      return profile.address
        .replace(new RegExp(`^(${initialDetected.nameBn}|${initialDetected.nameEn})[\\s,]*`, 'i'), '')
        .replace(new RegExp(`[\\s,]*(${initialDetected.nameBn}|${initialDetected.nameEn})$`, 'i'), '')
        .trim();
    }
    return profile.address;
  });
  const [farmerAddress, setFarmerAddress] = useState(profile?.address || '');
  const [shopName, setShopName] = useState(profile?.shop_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [coverUrl, setCoverUrl] = useState(profile?.cover_url || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    if (profile?.address) {
      setFarmerAddress(profile.address);
      const detected = detectDistrictFromAddress(profile.address);
      if (detected) {
        setSelectedDistrict(detected.id);
        const remaining = profile.address
          .replace(new RegExp(`^(${detected.nameBn}|${detected.nameEn})[\\s,]*`, 'i'), '')
          .replace(new RegExp(`[\\s,]*(${detected.nameBn}|${detected.nameEn})$`, 'i'), '')
          .trim();
        setDetailedAddress(remaining);
      } else {
        setDetailedAddress(profile.address);
      }
    }
    if (profile?.shop_name) setShopName(profile.shop_name);
    if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
    if (profile?.cover_url) setCoverUrl(profile.cover_url);
  }, [profile?.address, profile?.shop_name, profile?.avatar_url, profile?.cover_url]);
  const [uploadingProductImage, setUploadingProductImage] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalIncome: 0,
    monthlyOrders: 0,
    monthlyIncome: 0,
    totalCancelled: 0,
    totalSuccessful: 0,
  });
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    price: 0,
    quantity: 0,
    image_url: '',
    description: '',
    sku: '',
  });

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryValue, setCustomCategoryValue] = useState('');

  useEffect(() => {
    if (user && profile?.status === 'approved') {
      fetchFarmerData();
    } else {
      setLoading(false);
    }
  }, [user, profile]);

  const fetchFarmerData = async () => {
    try {
      setLoading(true);
      // 1. Fetch farmer's products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('farmer_id', user?.id)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;
      setProducts(productsData || []);

      const productIds = productsData?.map(p => p.id) || [];

      if (productIds.length > 0) {
        // 2. Fetch order items for these products using explicit joins
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            id,
            order_id,
            product_id,
            quantity,
            price_at_time,
            status,
            orders!inner (
              id,
              total_amount,
              status,
              address,
              phone,
              created_at,
              consumer_id,
              profiles!orders_consumer_id_fkey (
                full_name,
                email,
                phone
              )
            ),
            products!inner (
              name,
              image_url
            )
          `)
          .in('product_id', productIds);

        if (itemsError) throw itemsError;

        // Group order items by order
        const farmerOrders: Record<string, Order> = {};
        let totalIncome = 0;
        let monthlyOrders = 0;
        let monthlyIncome = 0;
        let totalCancelled = 0;
        let totalSuccessful = 0;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        itemsData?.forEach((item: any) => {
          const orderData = item.orders;
          if (orderData) {
            if (!farmerOrders[item.order_id]) {
              farmerOrders[item.order_id] = { 
                ...orderData, 
                consumer: orderData.profiles,
                items: [] 
              };

              const orderDate = new Date(orderData.created_at);
              const isCurrentMonth = orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;

              if (isCurrentMonth) monthlyOrders++;
              if (orderData.status === 'delivered') totalSuccessful++;
              if (orderData.status === 'cancelled') totalCancelled++;
            }
            farmerOrders[item.order_id].items?.push({
              ...item,
              product: item.products
            });

            // Calculate income for this farmer's items
            if (item.orders.status === 'delivered') {
              const itemIncome = item.price_at_time * item.quantity;
              totalIncome += itemIncome;
              
              const orderDate = new Date(item.orders.created_at);
              if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
                monthlyIncome += itemIncome;
              }
            }
          }
        });
        
        setStats({
          totalOrders: Object.keys(farmerOrders).length,
          totalIncome,
          monthlyOrders,
          monthlyIncome,
          totalCancelled,
          totalSuccessful
        });
        
        setOrders(Object.values(farmerOrders).sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching farmer data:', error);
      toast.error('অর্ডার লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে SQL পলিসিগুলো চেক করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmItems = async (orderId: string, itemIds: string[]) => {
    try {
      // 1. Update status of farmer's items in this order
      const { error: itemsError } = await supabase
        .from('order_items')
        .update({ status: 'confirmed' })
        .in('id', itemIds);

      if (itemsError) throw itemsError;

      // 2. Check if ALL items in the entire order (from all sellers) are now confirmed
      const { data: allItems, error: fetchError } = await supabase
        .from('order_items')
        .select('status')
        .eq('order_id', orderId);

      if (fetchError) throw fetchError;

      const allConfirmed = allItems.every(item => item.status === 'confirmed');

      if (allConfirmed) {
        // 3. If everything is confirmed, update the main order status
        const { error: orderError } = await supabase
          .from('orders')
          .update({ status: 'confirmed' })
          .eq('id', orderId);

        if (orderError) throw orderError;
        toast.success('অর্ডারটি পুরোপুরি নিশ্চিত করা হয়েছে এবং ডেলিভারি ম্যানের জন্য প্রস্তুত!');
      } else {
        toast.success('আপনার পণ্যগুলো নিশ্চিত করা হয়েছে। অন্য বিক্রেতারা কনফার্ম করলে এটি ডেলিভারির জন্য প্রস্তুত হবে।');
      }

      fetchFarmerData();
    } catch (error: any) {
      toast.error(error.message || 'অর্ডার নিশ্চিত করতে সমস্যা হয়েছে');
    }
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingProductImage(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `product-${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('shop-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('shop-assets')
        .getPublicUrl(filePath);

      setNewProduct({ ...newProduct, image_url: publicUrl });
      toast.success('পণ্যের ছবি আপলোড সফল হয়েছে');
    } catch (error: any) {
      console.error('Upload error:', error);
      if (error.message?.includes('bucket_not_found') || error.error === 'Bucket not found') {
        toast.error('স্টোরেজ বাকেট পাওয়া যায়নি। অনুগ্রহ করে Supabase-এ "shop-assets" নামে একটি পাবলিক বাকেট তৈরি করুন।');
      } else {
        toast.error('ছবি আপলোড করতে সমস্যা হয়েছে: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setUploadingProductImage(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('products').insert({
        ...newProduct,
        farmer_id: user?.id,
        is_approved: false, // Needs admin approval
      });

      if (error) throw error;
      toast.success('পণ্যটি যোগ করা হয়েছে এবং অনুমোদনের জন্য অপেক্ষমান।');
      setIsAddProductOpen(false);
      setNewProduct({
        name: '',
        category: '',
        price: 0,
        quantity: 0,
        image_url: '',
        description: '',
        sku: '',
      });
      setIsCustomCategory(false);
      fetchFarmerData();
    } catch (error: any) {
      toast.error(error.message || 'পণ্য যোগ করতে সমস্যা হয়েছে');
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', productToDelete);
      if (error) throw error;
      toast.success('পণ্যটি মুছে ফেলা হয়েছে');
      setIsDeleteConfirmOpen(false);
      setProductToDelete(null);
      fetchFarmerData();
    } catch (error: any) {
      toast.error(error.message || 'পণ্য মুছতে সমস্যা হয়েছে');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdatingProfile(true);
      const districtObj = ALL_DISTRICTS.find(d => d.id === selectedDistrict);
      let finalAddress = farmerAddress;

      if (districtObj) {
        finalAddress = detailedAddress.trim() 
          ? `${districtObj.nameBn}, ${detailedAddress.trim()}`
          : districtObj.nameBn;
      } else if (detailedAddress.trim()) {
        finalAddress = detailedAddress.trim();
      }

      const { error } = await supabase
        .from('profiles')
        .update({ 
          address: finalAddress,
          shop_name: shopName,
          avatar_url: avatarUrl,
          cover_url: coverUrl
        })
        .eq('id', user?.id);

      if (error) throw error;
      setFarmerAddress(finalAddress);
      toast.success('আপনার শপের ঠিকানা ও প্রোফাইল সফলভাবে আপডেট করা হয়েছে');
    } catch (error: any) {
      toast.error(error.message || 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUpdatingProfile(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${type}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to 'shop-assets' bucket (assuming it exists or will be created)
      const { error: uploadError } = await supabase.storage
        .from('shop-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('shop-assets')
        .getPublicUrl(filePath);

      if (type === 'avatar') setAvatarUrl(publicUrl);
      else setCoverUrl(publicUrl);

      toast.success('ছবি আপলোড সফল হয়েছে। সেভ বাটনে ক্লিক করুন।');
    } catch (error: any) {
      console.error('Upload error:', error);
      if (error.message?.includes('bucket_not_found') || error.error === 'Bucket not found') {
        toast.error('স্টোরেজ বাকেট পাওয়া যায়নি। অনুগ্রহ করে Supabase ড্যাশবোর্ডে গিয়ে "shop-assets" নামে একটি পাবলিক বাকেট তৈরি করুন।');
      } else {
        toast.error('ছবি আপলোড করতে সমস্যা হয়েছে: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleDeleteImage = (type: 'avatar' | 'cover') => {
    if (type === 'avatar') setAvatarUrl('');
    else setCoverUrl('');
    toast.info('ছবিটি সরানো হয়েছে। পরিবর্তন স্থায়ী করতে সেভ বাটনে ক্লিক করুন।');
  };

  const handleToggleShop = async (status: 'open' | 'closed_temporary' | 'closed_permanent') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ shop_status: status })
        .eq('id', user?.id);

      if (error) throw error;
      toast.success('শপের অবস্থা পরিবর্তন করা হয়েছে');
      window.location.reload(); 
    } catch (error: any) {
      toast.error(error.message || 'শপের অবস্থা পরিবর্তন করতে সমস্যা হয়েছে');
    }
  };

  const handleAIDescription = async (type: 'new' | 'edit') => {
    const productName = type === 'new' ? newProduct.name : selectedProduct?.name;
    const category = type === 'new' ? newProduct.category : updateCategoryValue;

    if (!productName) {
      toast.error('অনুগ্রহ করে আগে পণ্যের নাম লিখুন');
      return;
    }

    try {
      setIsGeneratingDescription(true);
      const description = await generateProductDescription(productName, category);
      if (type === 'new') {
        setNewProduct(prev => ({ ...prev, description }));
      } else {
        setUpdateDescriptionValue(description);
      }
      toast.success('AI দ্বারা বিবরণ তৈরি করা হয়েছে!');
    } catch (error) {
      toast.error('বিবরণ তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      const updatePayload: any = { 
        quantity: updateStockValue,
        price: updatePriceValue,
        category: updateCategoryValue,
        description: updateDescriptionValue
      };

      // Only allow adding SKU if it hasn't been set yet
      if (!selectedProduct.sku && updateSkuValue) {
        updatePayload.sku = updateSkuValue.toUpperCase();
      }

      const { error } = await supabase
        .from('products')
        .update(updatePayload)
        .eq('id', selectedProduct.id);

      if (error) throw error;
      toast.success('পণ্যের তথ্য আপডেট করা হয়েছে');
      setIsUpdateProductOpen(false);
      fetchFarmerData();
    } catch (error: any) {
      toast.error(error.message || 'তথ্য আপডেট করতে সমস্যা হয়েছে');
    }
  };

  const handleShareProduct = async (product: Product) => {
    const shareData = {
      title: product.name,
      text: `${t.shareText}${product.name}`,
      url: `${window.location.origin}/product/${product.id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success(t.linkCopied);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (profile?.status !== 'approved') {
    return (
      <div className="text-center py-20 bg-amber-50 rounded-3xl border border-amber-200">
        <h2 className="text-2xl font-bold text-amber-800 mb-2">আপনার অ্যাকাউন্টটি এখনো অনুমোদিত নয়</h2>
        <p className="text-amber-700">অ্যাডমিন আপনার অ্যাকাউন্টটি যাচাই করার পর আপনি পণ্য যোগ করতে পারবেন। অনুগ্রহ করে অপেক্ষা করুন।</p>
      </div>
    );
  }

  if (profile?.is_frozen) {
    return (
      <div className="text-center py-20 bg-red-50 rounded-3xl border border-red-200">
        <Snowflake className="w-16 h-16 text-red-600 mx-auto mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold text-red-800 mb-2">আপনার শপটি ফ্রিজ করা হয়েছে</h2>
        <p className="text-red-700">কারুমার্ট টিম আপনার শপটি ফ্রিজ করেছেন। বিস্তারিত জানতে অনুগ্রহ করে কারুমার্ট হেল্প সেন্টারে যোগাযোগ করুন।</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats & Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-blue-100 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-3">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-3xl font-black text-blue-800">{stats.totalOrders}</p>
              <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">মোট অর্ডার</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-100 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-3xl font-black text-green-800">{stats.totalSuccessful}</p>
              <p className="text-xs text-green-600 font-bold uppercase tracking-wider">সফল অর্ডার</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-100 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-3">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-3xl font-black text-red-800">{stats.totalCancelled}</p>
              <p className="text-xs text-red-600 font-bold uppercase tracking-wider">বাতিল অর্ডার</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-100 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-3xl font-black text-purple-800">{stats.monthlyOrders}</p>
              <p className="text-xs text-purple-600 font-bold uppercase tracking-wider">এই মাসের অর্ডার</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 border-amber-100 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-3">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
              <p className="text-3xl font-black text-amber-800">৳{stats.monthlyIncome}</p>
              <p className="text-xs text-amber-600 font-bold uppercase tracking-wider">এই মাসের আয়</p>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50 border-emerald-100 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-3">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-3xl font-black text-emerald-800">৳{stats.totalIncome}</p>
              <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">মোট আয়</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white border-none shadow-sm h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
              <BarChart3 className="w-5 h-5 text-green-600" /> ক্যাটাগরি অনুযায়ী পণ্য
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(
                  products.reduce((acc, p) => {
                    const cat = p.category || 'অন্যান্য';
                    acc[cat] = (acc[cat] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([name, value]) => ({ name, value }))}
              >
                <XAxis dataKey="name" hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: '800' }}
                />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {Object.entries(products.reduce((acc, p) => {
                    const cat = p.category || 'অন্যান্য';
                    acc[cat] = (acc[cat] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444'][index % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Profile & Shop Settings Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-green-50 border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-green-800">
              <Settings className="w-5 h-5" /> প্রোফাইল ও শপ সেটিংস
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Avatar Upload */}
                <div className="space-y-2">
                  <Label className="text-green-700">প্রোফাইল লোগো</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 bg-white rounded-full border-2 border-green-200 flex items-center justify-center overflow-hidden group">
                      {avatarUrl ? (
                        <>
                          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => handleDeleteImage('avatar')}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-6 h-6 text-white" />
                          </button>
                        </>
                      ) : (
                        <Camera className="w-8 h-8 text-green-200" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleImageUpload(e, 'avatar')}
                        className="text-xs"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">লোগো হিসেবে আপনার বা আপনার শপের ছবি দিন</p>
                    </div>
                  </div>
                </div>

                {/* Cover Upload */}
                <div className="space-y-2">
                  <Label className="text-green-700">শপ কভার ব্যানার</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative w-32 h-20 bg-white rounded-lg border-2 border-green-200 flex items-center justify-center overflow-hidden group">
                      {coverUrl ? (
                        <>
                          <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => handleDeleteImage('cover')}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-6 h-6 text-white" />
                          </button>
                        </>
                      ) : (
                        <ImageIcon className="w-8 h-8 text-green-200" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleImageUpload(e, 'cover')}
                        className="text-xs"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">শপের উপরে বড় ব্যানার হিসেবে দেখাবে</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shopName" className="text-green-700 font-medium">শপের নাম (ফাঁকা রাখলে আপনার নাম দেখাবে)</Label>
                  <Input 
                    id="shopName"
                    className="bg-white border-green-200 focus:border-green-500"
                    placeholder="দেশি মার্ট / অর্গানিক ফার্ম"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-green-50/50 p-4 rounded-xl border border-green-100">
                  <div className="space-y-2">
                    <Label htmlFor="district" className="text-green-800 font-semibold flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-green-600" /> শপের জেলা (তালিকা থেকে সিলেক্ট করুন) *
                    </Label>
                    <DistrictSelect 
                      value={selectedDistrict}
                      onValueChange={(val) => setSelectedDistrict(val)}
                      placeholder="আপনার জেলা নির্বাচন করুন (যেমন: বগুড়া)"
                    />
                    <p className="text-[11px] text-gray-500">
                      বাংলাদেশ-এর ৬৪ জেলার তালিকা থেকে আপনার জেলা নির্বাচন করুন।
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="detailedAddress" className="text-green-800 font-semibold">
                      থানা / উপজেলা / বিস্তারিত এলাকা
                    </Label>
                    <Input 
                      id="detailedAddress"
                      className="bg-white border-green-200 focus:border-green-500"
                      placeholder="যেমন: শেরপুর রোড, সদর, বাজার এলাকা"
                      value={detailedAddress}
                      onChange={(e) => setDetailedAddress(e.target.value)}
                    />
                    <p className="text-[11px] text-gray-500">
                      ডেলিভারি ম্যান ও ক্রেতাদের সুবিধার জন্য সঠিক থানা ও এলাকা উল্লেখ করুন।
                    </p>
                  </div>

                  {/* Dynamic address preview */}
                  <div className="col-span-1 md:col-span-2 pt-2 border-t border-green-200/60 flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-medium">প্রোফাইলে প্রদর্শিত ঠিকানা:</span>
                    <span className="font-bold text-green-700 bg-white px-3 py-1 rounded-full border border-green-200 shadow-xs">
                      📍 {(() => {
                        const dist = ALL_DISTRICTS.find(d => d.id === selectedDistrict);
                        if (dist) {
                          return detailedAddress.trim() ? `${dist.nameBn}, ${detailedAddress.trim()}` : dist.nameBn;
                        }
                        return detailedAddress.trim() || farmerAddress || 'কোনো জেলা নির্বাচন করা হয়নি';
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={updatingProfile}
              >
                {updatingProfile ? 'আপডেট হচ্ছে...' : 'সকল তথ্য সংরক্ষণ করুন'}
              </Button>
            </form>
            <p className="text-[10px] text-green-600 mt-2 italic">
              * সঠিক তথ্য ও সুন্দর ছবি দিলে ক্রেতারা আপনার শপ থেকে কেনাকাটা করতে বেশি আগ্রহী হবেন।
            </p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
              <Settings className="w-5 h-5" /> শপ ম্যানেজমেন্ট
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">বর্তমান অবস্থা:</span>
              <Badge className={
                profile?.shop_status === 'open' ? 'bg-green-100 text-green-700' :
                profile?.shop_status === 'closed_temporary' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
              }>
                {profile?.shop_status === 'open' ? 'খোলা' : 
                 profile?.shop_status === 'closed_temporary' ? 'সাময়িক বন্ধ' : 'স্থায়ী বন্ধ'}
              </Badge>
            </div>
            <div className="grid gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="justify-start bg-white"
                onClick={() => handleToggleShop('open')}
                disabled={profile?.shop_status === 'open'}
              >
                শপ খুলুন
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="justify-start bg-white text-orange-600"
                onClick={() => handleToggleShop('closed_temporary')}
                disabled={profile?.shop_status === 'closed_temporary'}
              >
                সাময়িক বন্ধ করুন
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="justify-start bg-white text-red-600"
                onClick={() => handleToggleShop('closed_permanent')}
                disabled={profile?.shop_status === 'closed_permanent'}
              >
                স্থায়ীভাবে বন্ধ করুন
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
          <Package className="w-5 h-5 text-green-600" /> {t.products}
        </h2>
        <Dialog 
          open={isAddProductOpen} 
          onOpenChange={(open) => {
            if (open) {
              setNewProduct({
                name: '',
                category: '',
                price: 0,
                quantity: 0,
                image_url: '',
                description: '',
                sku: '',
              });
              setIsCustomCategory(false);
            }
            setIsAddProductOpen(open);
          }}
        >
          <DialogTrigger render={(triggerProps) => (
            <Button {...triggerProps} className="bg-green-600 hover:bg-green-700 gap-2">
              <Plus className="w-4 h-4" /> {t.addProduct}
            </Button>
          )} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.addProduct}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="space-y-2">
                <Label>ইউনিক SKU আইডি (Unique SKU ID)</Label>
                <div className="flex gap-2">
                  <Input 
                    required 
                    value={newProduct.sku} 
                    onChange={e => setNewProduct({...newProduct, sku: e.target.value.toUpperCase()})} 
                    placeholder="VEG-001"
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setNewProduct({...newProduct, sku: `SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`})}
                  >
                    তৈরি করুন
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.productName}</Label>
                  <Input required value={newProduct.name || ''} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>{t.category}</Label>
                  <Select 
                    value={isCustomCategory ? 'Others' : (newProduct.category || COMMON_CATEGORIES[0])} 
                    onValueChange={(val) => {
                      if (val === 'Others') {
                        setIsCustomCategory(true);
                        setNewProduct({...newProduct, category: ''});
                      } else {
                        setIsCustomCategory(false);
                        setNewProduct({...newProduct, category: val});
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="ক্যাটাগরি নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_CATEGORIES.map(cat => {
                        const translated = getTranslatedCategory(cat, t);
                        return (
                          <SelectItem key={cat} value={cat}>
                            {translated !== cat ? `${translated} (${cat})` : cat}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {isCustomCategory && (
                    <Input 
                      placeholder={t.customCategoryPlaceholder || "নতুন ক্যাটাগরির নাম লিখুন"} 
                      className="mt-2"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.price} (৳)</Label>
                  <Input 
                    type="number" 
                    required 
                    value={newProduct.price ?? 0} 
                    onFocus={(e) => e.target.select()}
                    onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.quantity}</Label>
                  <Input 
                    type="number" 
                    required 
                    value={newProduct.quantity ?? 0} 
                    onFocus={(e) => e.target.select()}
                    onChange={e => setNewProduct({...newProduct, quantity: Number(e.target.value)})} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t.image} (Upload)</Label>
                <div className="flex items-center gap-4">
                  {newProduct.image_url && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
                      <img src={newProduct.image_url} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setNewProduct({ ...newProduct, image_url: '' })}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )}
                  <div className="flex-1">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleProductImageUpload}
                      disabled={uploadingProductImage}
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      {uploadingProductImage ? 'আপলোড হচ্ছে...' : 'সরাসরি ছবি আপলোড করুন অথবা নিচে লিঙ্ক দিন'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t.image} URL (Optional)</Label>
                <Input value={newProduct.image_url || ''} onChange={e => setNewProduct({...newProduct, image_url: e.target.value})} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>{t.description}</Label>
                <div className="relative">
                  <Input 
                    value={newProduct.description || ''} 
                    onChange={e => setNewProduct({...newProduct, description: e.target.value})} 
                    className="pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isGeneratingDescription}
                    onClick={() => handleAIDescription('new')}
                    className="absolute right-1 top-1 h-10 w-10 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    title="AI দিয়ে ডেসক্রিপশন জেনারেট করুন"
                  >
                    {isGeneratingDescription ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-500" /> নাম লেখার পর যাদুর কাঠি আইকনে ক্লিক করে ডেসক্রিপশন লিখুন
                </p>
              </div>
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">{t.addProduct}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="py-4 px-6 font-black text-gray-700">SKU</TableHead>
              <TableHead className="py-4 px-6 font-black text-gray-700">{t.productName}</TableHead>
              <TableHead className="py-4 px-6 font-black text-gray-700">{t.category}</TableHead>
              <TableHead className="py-4 px-6 font-black text-gray-700">{t.price}</TableHead>
              <TableHead className="py-4 px-6 font-black text-gray-700">{t.quantity}</TableHead>
              <TableHead className="py-4 px-6 font-black text-gray-700">{t.status}</TableHead>
              <TableHead className="text-right py-4 px-6 font-black text-gray-700">অ্যাকশন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(Object.entries(
              products.reduce((acc, p) => {
                const cat = p.category || 'অন্যান্য';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(p);
                return acc;
              }, {} as Record<string, Product[]>)
            ) as [string, Product[]][]).map(([category, catProducts]) => (
              <React.Fragment key={category}>
                <TableRow className="bg-gray-50/80 border-y border-gray-100">
                  <TableCell colSpan={7} className="py-3 px-6">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-5 bg-green-600 rounded-full" />
                      <span className="font-black text-green-800 text-lg">{category} ({catProducts.length}টি)</span>
                    </div>
                  </TableCell>
                </TableRow>
                {catProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-gray-50/30 transition-colors">
                    <TableCell className="font-mono font-bold text-xs text-blue-600 py-4 px-6">{product.sku || 'N/A'}</TableCell>
                    <TableCell className="font-bold py-4 px-6">{product.name}</TableCell>
                    <TableCell className="py-4 px-6">{product.category}</TableCell>
                    <TableCell className="font-black py-4 px-6">৳{product.price}</TableCell>
                    <TableCell className="font-bold py-4 px-6 text-amber-600">{product.quantity}</TableCell>
                    <TableCell className="py-4 px-6">
                      <Badge className={`border-none px-3 py-1 font-bold ${product.is_approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {product.is_approved ? t.approved : t.pending}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right py-4 px-6 space-x-1 whitespace-nowrap">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-green-600 hover:bg-green-50 h-9 w-9 rounded-lg" 
                        onClick={() => handleShareProduct(product)}
                        title={t.share}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-blue-600 hover:bg-blue-50 h-9 w-9 rounded-lg" 
                        onClick={() => {
                          setSelectedProduct(product);
                          setUpdateStockValue(product.quantity);
                          setUpdatePriceValue(product.price);
                          setUpdateCategoryValue(product.category || '');
                          setUpdateDescriptionValue(product.description || '');
                          setUpdateSkuValue(product.sku || '');
                          setIsUpdateProductOpen(true);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-600 hover:bg-red-50 h-9 w-9 rounded-lg" 
                        onClick={() => {
                          setProductToDelete(product.id);
                          setIsDeleteConfirmOpen(true);
                        }}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20 text-gray-400 font-medium italic">
                  আপনার কোন পণ্য পাওয়া যায়নি। নতুন পণ্য যোগ করুন।
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isUpdateProductOpen} onOpenChange={setIsUpdateProductOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>পণ্যের তথ্য আপডেট করুন: {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateProduct} className="space-y-4">
            <div className="space-y-2">
              <Label>ইউনিক SKU আইডি (Unique SKU ID)</Label>
              {selectedProduct?.sku ? (
                <>
                  <Input 
                    disabled
                    value={selectedProduct.sku} 
                    className="bg-gray-50 font-mono font-bold"
                  />
                  <p className="text-[10px] text-amber-600 font-bold">SKU আইডি পরিবর্তনযোগ্য নয়।</p>
                </>
              ) : (
                <div className="flex gap-2">
                  <Input 
                    required 
                    value={updateSkuValue || ''} 
                    onChange={e => setUpdateSkuValue(e.target.value.toUpperCase())} 
                    placeholder="VEG-001"
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setUpdateSkuValue(`SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`)}
                  >
                    তৈরি করুন
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>ক্যাটাগরি (Category)</Label>
              <Select 
                value={COMMON_CATEGORIES.includes(updateCategoryValue) ? updateCategoryValue : 'Others'} 
                onValueChange={(val) => {
                  if (val === 'Others') {
                    // Keep original value if it was custom, or clear if switching to custom
                    if (COMMON_CATEGORIES.includes(updateCategoryValue)) {
                      setUpdateCategoryValue('');
                    }
                  } else {
                    setUpdateCategoryValue(val);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="ক্যাটাগরি নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_CATEGORIES.map(cat => {
                    const translated = getTranslatedCategory(cat, t);
                    return (
                      <SelectItem key={cat} value={cat}>
                        {translated !== cat ? `${translated} (${cat})` : cat}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {!COMMON_CATEGORIES.includes(updateCategoryValue) && (
                <Input 
                  placeholder={t.customCategoryPlaceholder || "নতুন ক্যাটাগরির নাম লিখুন"} 
                  className="mt-2"
                  value={updateCategoryValue}
                  onChange={(e) => setUpdateCategoryValue(e.target.value)}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>মূল্য (Price - ৳)</Label>
              <Input 
                type="number" 
                required 
                value={updatePriceValue} 
                onFocus={(e) => e.target.select()}
                onChange={e => setUpdatePriceValue(Number(e.target.value))} 
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label>পরিমাণ (Quantity)</Label>
              <Input 
                type="number" 
                required 
                value={updateStockValue} 
                onFocus={(e) => e.target.select()}
                onChange={e => setUpdateStockValue(Number(e.target.value))} 
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label>বিবরণ (Description)</Label>
              <div className="relative">
                <Input 
                  value={updateDescriptionValue || ''} 
                  onChange={e => setUpdateDescriptionValue(e.target.value)} 
                  className="pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={isGeneratingDescription}
                  onClick={() => handleAIDescription('edit')}
                  className="absolute right-1 top-1 h-10 w-10 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  title="AI দিয়ে ডেসক্রিপশন জেনারেট করুন"
                >
                  {isGeneratingDescription ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-500" /> যাদুর কাঠি আইকনে ক্লিক করে AI ডেসক্রিপশন তৈরি করুন
              </p>
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">আপডেট করুন</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-green-600" /> আপনার পণ্যের অর্ডারসমূহ
          </h2>
          <Button variant="outline" size="sm" onClick={fetchFarmerData} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            রিফ্রেশ করুন
          </Button>
        </div>
        {orders.length > 0 ? (
          <div className="grid gap-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-bold">অর্ডার #{order.id.slice(0, 8)}</p>
                      <Badge variant="outline" className="text-[10px]">
                        {new Date(order.created_at).toLocaleDateString('bn-BD')}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">ক্রেতা: {order.consumer?.full_name}</p>
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold text-gray-700">আপনার পণ্যসমূহ:</p>
                      {order.items?.map(item => (
                        <div key={item.id} className="flex items-center justify-between bg-white p-2 rounded border border-gray-100">
                          <div className="flex items-center gap-2">
                            <img 
                              src={item.product?.image_url || `https://picsum.photos/seed/${item.product?.name}/50/50`} 
                              alt={item.product?.name}
                              className="w-8 h-8 rounded object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <p className="text-xs font-medium">{item.product?.name}</p>
                              <p className="text-[10px] text-gray-500">৳{item.price_at_time} x {item.quantity}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className={`text-[10px] ${item.status === 'confirmed' ? 'text-green-600 border-green-200' : 'text-amber-600 border-amber-200'}`}>
                            {item.status === 'confirmed' ? 'নিশ্চিত' : 'অপেক্ষমান'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                    <div className="flex flex-col items-end mb-2">
                      <span className="text-[10px] text-gray-400">অর্ডারের অবস্থা</span>
                      <Badge className={
                        order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                        order.status === 'return_requested' ? 'bg-orange-100 text-orange-700' :
                        order.status === 'return_picked_up' ? 'bg-purple-100 text-purple-700' :
                        order.status === 'returned' ? 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-700'
                      }>
                        {order.status === 'pending' ? t.pending : 
                         order.status === 'confirmed' ? 'ডেলিভারির জন্য প্রস্তুত' :
                         order.status === 'picked_up' ? t.pickedUp :
                         order.status === 'on_the_way' ? t.onTheWay :
                         order.status === 'delivered' ? t.delivered : 
                         order.status === 'return_requested' ? t.returnRequested :
                         order.status === 'return_picked_up' ? t.returnPickedUp :
                         order.status === 'returned' ? t.returned : t.cancelled}
                      </Badge>
                    </div>
                    
                    <div className="bg-green-50 p-2 rounded-lg border border-green-100 w-full md:w-auto">
                      <p className="text-[10px] text-green-600">আপনার পণ্যের মোট মূল্য</p>
                      <p className="text-lg font-bold text-green-700">
                        ৳{order.items?.reduce((sum, item) => sum + (item.price_at_time * item.quantity), 0)}
                      </p>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto mt-2">
                       <InvoiceModal order={order} />
                       <DeliverySlipModal order={order} />
                    </div>

                    {order.status === 'pending' && order.items?.some(i => i.status === 'pending') && (
                      <Button 
                        size="sm" 
                        onClick={() => handleConfirmItems(order.id, order.items?.filter(i => i.status === 'pending').map(i => i.id) || [])}
                        className="bg-green-600 hover:bg-green-700 mt-2 w-full md:w-auto"
                      >
                        আপনার পণ্যগুলো নিশ্চিত করুন
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center py-10 text-gray-500">এখনো কোন অর্ডার পাওয়া যায়নি।</p>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>পণ্য মুছে ফেলুন</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">আপনি কি নিশ্চিত যে আপনি এই পণ্যটি মুছে ফেলতে চান? এটি আর ফিরে পাওয়া যাবে না।</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>বাতিল</Button>
            <Button variant="destructive" onClick={handleDeleteProduct}>মুছে ফেলুন</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
