import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Product, Profile } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ProductCard } from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { MapPin, ShoppingBag, ArrowLeft, Store, ShieldCheck, Snowflake, CheckCircle2, Award, Share2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ShopDetail() {
  const { id } = useParams();
  const { t } = useLanguage();
  const [farmer, setFarmer] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleShareShop = async () => {
    if (!farmer) return;
    
    const shareData = {
      title: farmer.shop_name || farmer.full_name,
      text: `${t.shareText}${farmer.shop_name || farmer.full_name}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success(t.linkCopied);
      }
    } catch (error) {
      console.error('Error sharing store:', error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchFarmerData();
    }
  }, [id]);

  const fetchFarmerData = async () => {
    setLoading(true);
    try {
      // Fetch farmer profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (profileError) throw profileError;
      setFarmer(profileData);

      // Fetch farmer products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*, farmer:profiles(*)')
        .eq('farmer_id', id)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching farmer shop data:', error);
      toast.error(t.shopLoadError);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-48 bg-gray-200 rounded-3xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!farmer) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-800">{t.shopNotFound}</h2>
        <Button onClick={() => navigate('/')} className="mt-4 bg-green-600">{t.backToHome}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> {t.back}
      </Button>

      {/* Shop Header */}
      {farmer.is_frozen && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <Snowflake className="w-6 h-6 text-red-600 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-800">Shop frozen by Karumart Team</h3>
            <p className="text-sm text-red-600">বিস্তারিত জানতে অনুগ্রহ করে কারুমার্ট হেল্প সেন্টারে যোগাযোগ করুন।</p>
          </div>
        </div>
      )}

      <div className={`relative overflow-hidden rounded-2xl md:rounded-3xl text-white shadow-xl min-h-[140px] sm:min-h-[180px] md:min-h-[250px] flex items-end transition-colors duration-500 ${
        farmer.badge_krishi_mall ? 'bg-amber-500' : 'bg-green-800'
      }`}>
        {/* Cover Image */}
        {farmer.cover_url ? (
          <img 
            src={farmer.cover_url} 
            alt="Shop Cover" 
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className={`absolute inset-0 opacity-90 transition-colors duration-500 ${
            farmer.badge_krishi_mall ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 'bg-gradient-to-r from-green-600 to-green-800'
          }`} />
        )}
        
        <div className="relative z-10 w-full p-4 sm:p-6 md:p-10 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
          <div className="flex flex-row items-center md:items-end gap-3.5 sm:gap-5 md:gap-6">
            <div className={`w-14 h-14 sm:w-20 sm:h-20 md:w-32 md:h-32 bg-white rounded-full flex items-center justify-center text-2xl sm:text-3xl md:text-5xl font-bold border-2 md:border-4 border-white shadow-lg overflow-hidden shrink-0 transition-colors ${
              farmer.badge_krishi_mall ? 'text-amber-600' : 'text-green-700'
            }`}>
              {farmer.avatar_url ? (
                <img src={farmer.avatar_url} alt={farmer.full_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                farmer.full_name.charAt(0)
              )}
            </div>
            <div className="text-left space-y-1 sm:space-y-2 pb-0.5 md:pb-2 min-w-0 flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-4">
                <div className="flex flex-col min-w-0">
                  <h1 className="text-lg sm:text-2xl md:text-4xl font-bold drop-shadow-md flex items-center flex-wrap justify-start gap-2 truncate">
                    <span className="truncate">{farmer.shop_name || farmer.full_name}</span>
                    {farmer.badge_best_seller && (
                      <div className="bg-green-600 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-lg border border-white/30 flex items-center gap-1 sm:gap-2 animate-in slide-in-from-top duration-500 shrink-0" title="Best Seller">
                        <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 fill-white text-green-600" />
                        <span className="text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-tight text-white">Best Seller</span>
                      </div>
                    )}
                  </h1>
                  <div className="flex flex-wrap items-center justify-start gap-1.5 sm:gap-3 mt-1">
                    {farmer.badge_official && (
                      <span className="inline-flex items-center gap-1 bg-blue-600 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-wider shadow-md border border-blue-400">
                        <ShieldCheck className="w-3 h-3 md:w-4 md:h-4 text-blue-100" /> OFFICIAL
                      </span>
                    )}
                    {farmer.badge_krishi_mall && (
                      <span className="inline-flex items-center gap-1 bg-white text-amber-600 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-wider shadow-md border border-white">
                        <Store className="w-3 h-3 md:w-4 md:h-4" /> SUPER MALL
                      </span>
                    )}
                  </div>
                </div>
                {farmer.shop_status === 'open' ? (
                  <span className="inline-flex items-center w-fit px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-green-500/40 border border-green-400/50 text-[10px] sm:text-xs font-medium backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full mr-1.5 animate-pulse" />
                    {t.open}
                  </span>
                ) : (
                  <span className="inline-flex items-center w-fit px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-red-500/40 border border-red-400/50 text-[10px] sm:text-xs font-medium text-red-100 backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-400 rounded-full mr-1.5" />
                    {t.closed}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-start gap-2.5 sm:gap-4 text-green-50 text-xs sm:text-sm">
                <div className="flex items-center gap-1 drop-shadow-sm">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> <span className="truncate max-w-[120px] sm:max-w-none">{farmer.address || t.noAddress}</span>
                </div>
                <div className="flex items-center gap-1 drop-shadow-sm">
                  <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> {products.length} {t.productsCount}
                </div>
                <div className="flex items-center gap-1 drop-shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-300 shrink-0" /> {t.verifiedFarmer}
                </div>
                <button 
                  onClick={handleShareShop}
                  className="flex items-center gap-1 drop-shadow-sm hover:text-white transition-colors group/share"
                >
                  <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover/share:scale-110 transition-transform" /> {t.share}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Store className="w-6 h-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-800">{t.allProductsTitle}</h2>
        </div>

        {farmer.is_frozen ? (
          <div className="text-center py-20 bg-red-50 rounded-3xl border border-red-200">
            <Snowflake className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-800 font-bold">শপটি ফ্রিজ করা হয়েছে</p>
            <p className="text-red-600 text-sm">কারুমার্ট টিম এই শপটি ফ্রিজ করেছেন। বিস্তারিত জানতে অনুগ্রহ করে কারুমার্ট হেল্প সেন্টারে যোগাযোগ করুন।</p>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <p className="text-gray-500 italic">{t.noFarmerProducts}</p>
          </div>
        )}
      </div>
    </div>
  );
}
