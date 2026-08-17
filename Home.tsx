import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Product, Banner, StaticBanner, SidePromoBanner } from '@/types';
import { ProductCard } from '@/components/ProductCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Banknote, ShieldCheck, CreditCard, Truck, ArrowLeft, ArrowRight, Tag, Timer, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { normalizeSearchQuery, matchesSearch } from '@/lib/searchUtils';
import { motion, AnimatePresence } from 'motion/react';
import { getTranslatedCategory } from '@/lib/translations';
import { KarumartLogo } from '@/components/KarumartLogo';
import { DistrictSelect } from '@/components/DistrictSelect';
import { matchDistrictInAddress, ALL_DISTRICTS, findDistrict } from '@/lib/districts';
import { MapPin } from 'lucide-react';

const CountdownTimer = ({ endTime, onEnd }: { endTime: string, onEnd: () => void }) => {
  const [timeLeft, setTimeLeft] = useState<{h: number, m: number, s: number} | null>(null);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft(null);
        onEnd();
        return;
      }

      setTimeLeft({
        h: Math.floor(diff / (1000 * 60 * 60)),
        m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((diff % (1000 * 60)) / 1000)
      });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  if (!timeLeft) return null;

  return (
    <div className="flex gap-1 md:gap-2 items-center font-mono">
      <div className="bg-white/20 backdrop-blur-md px-1.5 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl border border-white/30 flex flex-col items-center min-w-[32px] md:min-w-[50px]">
        <span className="text-sm md:text-xl font-black leading-none">{timeLeft.h.toString().padStart(2, '0')}</span>
        <span className="text-[6px] md:text-[8px] font-bold uppercase tracking-widest opacity-70">Hrs</span>
      </div>
      <span className="text-sm md:text-xl font-black animate-pulse">:</span>
      <div className="bg-white/20 backdrop-blur-md px-1.5 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl border border-white/30 flex flex-col items-center min-w-[32px] md:min-w-[50px]">
        <span className="text-sm md:text-xl font-black leading-none">{timeLeft.m.toString().padStart(2, '0')}</span>
        <span className="text-[6px] md:text-[8px] font-bold uppercase tracking-widest opacity-70">Min</span>
      </div>
      <span className="text-sm md:text-xl font-black animate-pulse">:</span>
      <div className="bg-white/20 backdrop-blur-md px-1.5 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl border border-white/30 flex flex-col items-center min-w-[32px] md:min-w-[50px]">
        <span className="text-sm md:text-xl font-black leading-none">{timeLeft.s.toString().padStart(2, '0')}</span>
        <span className="text-[6px] md:text-[8px] font-bold uppercase tracking-widest opacity-70">Sec</span>
      </div>
    </div>
  );
};

export default function Home() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const flashSaleScrollRef = React.useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannersLoading, setBannersLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('karumart_banners');
      return !cached;
    } catch {
      return true;
    }
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [banners, setBanners] = useState<Banner[]>(() => {
    try {
      const cached = localStorage.getItem('karumart_banners');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [staticBanners, setStaticBanners] = useState<StaticBanner[]>(() => {
    try {
      const cached = localStorage.getItem('karumart_static_banners');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [sidePromoBanners, setSidePromoBanners] = useState<SidePromoBanner[]>(() => {
    try {
      const cached = localStorage.getItem('karumart_side_promo_banners');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [siteSettings, setSiteSettings] = useState<any>(() => {
    try {
      const cached = localStorage.getItem('karumart_site_settings');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [currentBanner, setCurrentBanner] = useState(0);

  const scrollFlashSale = (direction: 'left' | 'right') => {
    if (flashSaleScrollRef.current) {
      const scrollAmount = 400;
      flashSaleScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [heroSearch, setHeroSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    setSearchQuery(q);
    
    // If searching, scroll to top
    if (q) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.search]);

  useEffect(() => {
    fetchCategories();
    fetchBanners();
    fetchSidePromoBanners();
    fetchStaticBanners();
    fetchSiteSettings();
    fetchFlashSaleProducts();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortBy]); // Refetch on category or sort change

  // Auto-slide for banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners]);

  const fetchBanners = async () => {
    try {
      if (banners.length === 0) setBannersLoading(true);
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      const bannerList = data || [];
      setBanners(bannerList);
      try {
        localStorage.setItem('karumart_banners', JSON.stringify(bannerList));
      } catch {}
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setBannersLoading(false);
    }
  };

  const fetchSidePromoBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('side_promo_banners')
        .select('*')
        .eq('is_active', true);
      
      if (!error && data) {
        setSidePromoBanners(data);
        try {
          localStorage.setItem('karumart_side_promo_banners', JSON.stringify(data));
        } catch {}
      } else {
        setSidePromoBanners([]);
      }
    } catch {
      setSidePromoBanners([]);
    }
  };

  const fetchStaticBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('static_banners')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      const staticList = data || [];
      setStaticBanners(staticList);
      try {
        localStorage.setItem('karumart_static_banners', JSON.stringify(staticList));
      } catch {}
    } catch (error) {
      console.error('Error fetching static banners:', error);
    }
  };

  const fetchSiteSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 'site_config')
        .maybeSingle();
      
      if (error) throw error;
      if (data) {
        setSiteSettings(data);
        try {
          localStorage.setItem('karumart_site_settings', JSON.stringify(data));
        } catch {}
      }
    } catch (error) {
       console.error('Error fetching site settings:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('category, farmer:profiles!inner(shop_status)')
        .eq('is_approved', true)
        .eq('farmer.shop_status', 'open');
      
      if (error) throw error;
      const uniqueCategories = Array.from(new Set(data.map(p => p.category)));
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchFlashSaleProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, farmer:profiles!inner(*)')
        .eq('is_approved', true)
        .eq('flash_sale_active', true)
        .eq('farmer.shop_status', 'open')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setFlashSaleProducts(data || []);
    } catch (error) {
      console.error('Error fetching flash sale products:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('products')
        .select('*, farmer:profiles!inner(*)')
        .eq('is_approved', true)
        .eq('farmer.shop_status', 'open');

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      if (sortBy === 'price_asc') {
        query = query.order('price', { ascending: true });
      } else if (sortBy === 'price_desc') {
        query = query.order('price', { ascending: false });
      } else if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      let finalProducts = data || [];

      // Handle Best Selling sort
      if (sortBy === 'best_selling') {
        // 1. Fetch all order items to count sales
        const { data: salesData, error: salesError } = await supabase
          .from('order_items')
          .select('product_id, quantity');
        
        if (!salesError && salesData) {
          const salesMap: Record<string, number> = {};
          salesData.forEach(item => {
            salesMap[item.product_id] = (salesMap[item.product_id] || 0) + item.quantity;
          });

          finalProducts = finalProducts.sort((a, b) => (salesMap[b.id] || 0) - (salesMap[a.id] || 0));
        }
      }

      setProducts(finalProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const isMatch = matchesSearch(
      product.name, 
      product.category, 
      searchQuery, 
      product.farmer?.shop_name || product.farmer?.full_name,
      product.farmer?.address
    );
    
    const matchesDistrict = selectedDistrict === 'all' || matchDistrictInAddress(product.farmer?.address, selectedDistrict);
    const matchesMinPrice = minPrice === '' || product.price >= Number(minPrice);
    const matchesMaxPrice = maxPrice === '' || product.price <= Number(maxPrice);
    
    return isMatch && matchesDistrict && matchesMinPrice && matchesMaxPrice;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedDistrict('all');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
  };

  const activeFiltersCount = [
    selectedCategory !== 'all',
    selectedDistrict !== 'all',
    minPrice !== '',
    maxPrice !== '',
    searchQuery !== ''
  ].filter(Boolean).length;

  const nextBanner = () => setCurrentBanner((prev) => (prev + 1) % banners.length);
  const prevBanner = () => setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0
    })
  };

  const clearSearch = () => {
    navigate('/');
  };

  return (
    <div className="space-y-4 md:space-y-8">
      <AnimatePresence mode="wait">
        {!searchQuery ? (
          <motion.div
            key="hero-sections"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4 md:space-y-8"
          >
            {/* HERO SECTION GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
              {/* Main Hero Slider */}
              <section className="lg:col-span-3 relative h-[200px] sm:h-[300px] md:h-[450px] max-h-[500px] rounded-2xl md:rounded-3xl overflow-hidden group bg-gray-50 shadow-xs">
                <AnimatePresence initial={false} custom={1}>
                  {bannersLoading ? (
                    <div className="absolute inset-0">
                      <Skeleton className="w-full h-full rounded-2xl md:rounded-3xl" />
                    </div>
                  ) : banners.length > 0 ? (
                    <motion.div
                      key={currentBanner}
                      custom={1}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.5 }
                      }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <img 
                        src={banners[currentBanner].image_url} 
                        alt={banners[currentBanner].title || 'Banner'} 
                        className="w-full h-full object-fill md:object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                        {/* Text overlay removed for full brightness as requested */}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="absolute inset-0 bg-linear-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
                      <KarumartLogo size={120} className="opacity-80" />
                    </div>
                  )}
                </AnimatePresence>

                {/* Controls */}
                {banners.length > 1 && (
                  <>
                    <button 
                      onClick={prevBanner}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40 z-10"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={nextBanner}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40 z-10"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                      {banners.map((_, i) => (
                        <button 
                          key={i}
                          onClick={() => setCurrentBanner(i)}
                          className={`w-2 h-2 rounded-full transition-all ${currentBanner === i ? 'w-6 bg-white' : 'bg-white/50'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </section>

              {/* Side Promo Banner (Maintained separately via Admin Panel) */}
              <section className="hidden lg:block lg:col-span-1 relative h-[220px] sm:h-[260px] md:h-[450px] max-h-[500px] rounded-2xl md:rounded-3xl overflow-hidden shadow-xs border border-gray-100 bg-gray-50 group hover:shadow-md transition-all">
                {(() => {
                  const activeBanner = sidePromoBanners.length > 0 ? sidePromoBanners[0] : staticBanners.length > 0 ? staticBanners[0] : null;
                  
                  if (activeBanner) {
                    return (
                      <a 
                        href={activeBanner.link_url || '#'} 
                        onClick={(e) => {
                          if (activeBanner.link_url?.startsWith('/')) {
                            e.preventDefault();
                            navigate(activeBanner.link_url);
                          }
                        }}
                        className="block w-full h-full relative group"
                      >
                        <img 
                          src={activeBanner.image_url} 
                          alt="Side Promo Banner" 
                          className="w-full h-full object-cover rounded-2xl md:rounded-3xl group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </a>
                    );
                  }

                  if (bannersLoading) {
                    return <Skeleton className="w-full h-full rounded-2xl md:rounded-3xl" />;
                  }

                  return (
                    <a 
                      href="#all-products-section" 
                      onClick={(e) => {
                        e.preventDefault();
                        const el = document.getElementById('all-products-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="block w-full h-full relative group cursor-pointer overflow-hidden rounded-2xl md:rounded-3xl"
                    >
                      <img 
                        src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800" 
                        alt="Promo Banner" 
                        className="w-full h-full object-cover rounded-2xl md:rounded-3xl group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </a>
                  );
                })()}
              </section>
            </div>

            {/* Features Section */}
            <section className="bg-white/50 rounded-2xl md:rounded-3xl p-3 md:p-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-0">
                <div className="flex items-center gap-2 md:gap-4 lg:border-r lg:border-gray-200 lg:px-6">
                  <div className="p-2 md:p-3 bg-white rounded-xl md:rounded-2xl shadow-sm shrink-0">
                    <Banknote className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-[10px] sm:text-xs md:text-base leading-tight">{t.affordablePrice}</h3>
                    <p className="text-[8px] sm:text-[10px] md:text-sm text-gray-500 leading-tight">{t.bestPrice}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-4 lg:border-r lg:border-gray-200 lg:px-6">
                  <div className="p-2 md:p-3 bg-white rounded-xl md:rounded-2xl shadow-sm shrink-0">
                    <ShieldCheck className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-[10px] sm:text-xs md:text-base leading-tight">{t.pureProduct}</h3>
                    <p className="text-[8px] sm:text-[10px] md:text-sm text-gray-500 leading-tight">{t.guarantee}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-4 lg:border-r lg:border-gray-200 lg:px-6">
                  <div className="p-2 md:p-3 bg-white rounded-xl md:rounded-2xl shadow-sm shrink-0">
                    <CreditCard className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-[10px] sm:text-xs md:text-base leading-tight">{t.safePayment}</h3>
                    <p className="text-[8px] sm:text-[10px] md:text-sm text-gray-500 leading-tight">{t.cashOn}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-4 lg:px-6">
                  <div className="p-2 md:p-3 bg-white rounded-xl md:rounded-2xl shadow-sm shrink-0">
                    <Truck className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-[10px] sm:text-xs md:text-base leading-tight">{t.fastDelivery}</h3>
                    <p className="text-[8px] sm:text-[10px] md:text-sm text-gray-500 leading-tight">{t.doorstep}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Static Banners Section */}
            {staticBanners.length > 0 && (
              <section className="space-y-4 md:space-y-6">
                {staticBanners.map((banner) => (
                  <div 
                    key={banner.id} 
                    className="rounded-2xl md:rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {banner.link_url ? (
                      <a href={banner.link_url} className="block w-full h-full">
                        <img 
                          src={banner.image_url} 
                          alt="Static Banner" 
                          className="w-full h-full object-cover block"
                          referrerPolicy="no-referrer"
                        />
                      </a>
                    ) : (
                      <img 
                        src={banner.image_url} 
                        alt="Static Banner" 
                        className="w-full h-full object-cover block"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>
                ))}
              </section>
            )}

            {/* Flash Sale Section */}
            {flashSaleProducts.length > 0 && 
             (!siteSettings?.flash_sale_end_time || new Date(siteSettings.flash_sale_end_time) > new Date()) && (
              <section 
                style={{
                  backgroundImage: siteSettings?.flash_sale_bg_image 
                    ? `linear-gradient(to bottom right, rgba(0,0,0,0.6), rgba(0,0,0,0.2)), url(${siteSettings.flash_sale_bg_image})` 
                    : (siteSettings?.flash_sale_bg_color?.includes('gradient'))
                      ? siteSettings.flash_sale_bg_color
                      : undefined,
                  backgroundColor: (!siteSettings?.flash_sale_bg_image && !siteSettings?.flash_sale_bg_color?.includes('gradient') && (siteSettings?.flash_sale_bg_color?.startsWith('#') || siteSettings?.flash_sale_bg_color?.startsWith('rgb'))) 
                    ? siteSettings.flash_sale_bg_color 
                    : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
                className={`rounded-xl md:rounded-[1.5rem] p-2 md:p-3 text-white relative overflow-hidden group shadow-xl shadow-orange-200/20 ${(!siteSettings?.flash_sale_bg_image && siteSettings?.flash_sale_bg_color?.startsWith('from-')) ? `bg-gradient-to-br ${siteSettings.flash_sale_bg_color}` : (!siteSettings?.flash_sale_bg_color || (siteSettings?.flash_sale_bg_color && !siteSettings.flash_sale_bg_color.includes('gradient') && !siteSettings.flash_sale_bg_color.startsWith('#') && !siteSettings.flash_sale_bg_color.startsWith('rgb')) ? 'bg-gradient-to-br from-orange-500 to-red-600' : '')}`}
              >
                <div className="absolute top-0 right-0 p-1 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                  <Tag className="w-16 h-16 md:w-32 md:h-32 rotate-12" />
                </div>
                
                <div className="flex flex-row items-center justify-between gap-1 mb-2 md:mb-2 relative z-10 px-1.5">
                  <div className="flex items-center gap-1 md:gap-3">
                    <div className="bg-white/20 backdrop-blur-xl p-1 md:p-1.5 rounded-lg md:rounded-xl border border-white/30 shrink-0 shadow-inner">
                      <Timer className="w-3.5 h-3.5 md:w-5 md:h-5 text-white animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1 md:gap-2 text-white">
                        <span className="bg-white text-orange-600 px-0.5 py-0 rounded text-[5px] md:text-[8px] font-black uppercase tracking-tighter shadow-sm shrink-0">
                          HOT
                        </span>
                        <h2 className="text-[12px] md:text-2xl font-black tracking-tighter leading-none italic uppercase drop-shadow-md whitespace-nowrap">Flash Sale</h2>
                      </div>
                      <div className="hidden sm:block">
                        {siteSettings?.flash_sale_end_time && (
                          <div className="scale-75 md:scale-80 origin-left -mt-1">
                            <CountdownTimer 
                              endTime={siteSettings.flash_sale_end_time} 
                              onEnd={() => fetchSiteSettings()} 
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="block sm:hidden">
                      {siteSettings?.flash_sale_end_time && (
                        <div className="origin-right scale-[0.85]">
                          <CountdownTimer 
                            endTime={siteSettings.flash_sale_end_time} 
                            onEnd={() => fetchSiteSettings()} 
                          />
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => {
                        const target = document.getElementById('all-products-section');
                        if (target) target.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-2 py-1 rounded-md border border-white/30 text-[8px] md:text-xs font-black uppercase tracking-widest flex items-center gap-0.5 transition-all shadow-sm"
                    >
                      {t.viewAll} <ArrowRight className="w-2.5 h-2.5 md:w-3 md:h-3" />
                    </button>
                  </div>
                </div>

                <div className="relative group/slider -mx-1">
                  {/* Left Scroll Button */}
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/90 hover:bg-white text-orange-600 shadow-xl opacity-0 group-hover/slider:opacity-100 transition-opacity hidden md:flex h-8 w-8"
                    onClick={() => scrollFlashSale('left')}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>

                  {/* Right Scroll Button */}
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/90 hover:bg-white text-orange-600 shadow-xl opacity-0 group-hover/slider:opacity-100 transition-opacity hidden md:flex h-8 w-8"
                    onClick={() => scrollFlashSale('right')}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>

                  <div 
                    ref={flashSaleScrollRef}
                    className="flex overflow-x-auto gap-2.5 md:gap-4 pb-1.5 md:pb-1 no-scrollbar relative z-10 scroll-smooth snap-x"
                  >
                   {flashSaleProducts.map(product => (
                    <div key={product.id} className="w-[140px] sm:w-[160px] md:w-[200px] shrink-0 snap-start">
                      <ProductCard product={product} />
                    </div>
                  ))}
                  <div className="w-[120px] md:w-[160px] shrink-0 flex items-center justify-center snap-start px-2">
                    <button 
                      onClick={() => {
                        const target = document.getElementById('all-products-section');
                        if (target) target.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="group flex flex-col items-center gap-3 text-white/80 hover:text-white transition-colors"
                    >
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-white/20 group-hover:scale-110 transition-all">
                        <ArrowRight className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest">{t.viewAll}</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

            {/* Category Browse Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-bold text-gray-800">{t.browseByCategory}</h2>
                <Button 
                  variant="link" 
                  className="text-green-600 p-0 h-auto"
                  onClick={() => setSelectedCategory('all')}
                >
                  {t.viewAll}
                </Button>
              </div>
              <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar -mx-2 px-2 sm:justify-center md:justify-start">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`flex-shrink-0 px-6 py-2.5 rounded-full border text-sm font-medium transition-all duration-200 ${
                    selectedCategory === 'all' 
                      ? 'bg-green-600 text-white border-green-600 shadow-md shadow-green-100' 
                      : 'bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:bg-green-50'
                  }`}
                >
                  {t.allProducts}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex-shrink-0 px-6 py-2.5 rounded-full border text-sm font-medium transition-all duration-200 ${
                      selectedCategory === cat 
                        ? 'bg-green-600 text-white border-green-600 shadow-md shadow-green-100' 
                        : 'bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:bg-green-50'
                    }`}
                  >
                    {getTranslatedCategory(cat, t)}
                  </button>
                ))}
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div
            key="search-results-header"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex items-center gap-4 py-4"
          >
            <Button variant="ghost" size="icon" onClick={clearSearch} className="rounded-full">
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {filteredProducts.length} {t.productsFoundCount}
              </h1>
              <p className="text-gray-500">
                {t.searchResultsFor} <span className="font-bold text-green-600">"{searchQuery}"</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div id="all-products-section" className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-800">{t.products}</h2>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                {activeFiltersCount} {t.activeFilters}
              </Badge>
            )}
            {selectedDistrict !== 'all' && (
              <Badge 
                variant="outline" 
                className="bg-green-50 text-green-700 border-green-300 gap-1.5 cursor-pointer hover:bg-green-100 py-1"
                onClick={() => setSelectedDistrict('all')}
              >
                <MapPin className="w-3 h-3 text-red-500" />
                {(() => {
                  const dist = ALL_DISTRICTS.find(d => d.id === selectedDistrict);
                  return dist ? `${dist.nameBn} (${dist.nameEn})` : selectedDistrict;
                })()}
                <X className="w-3 h-3 text-gray-400 hover:text-red-500" />
              </Badge>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Quick District Filter in Header */}
            <div className="w-[170px] sm:w-[190px]">
              <DistrictSelect
                value={selectedDistrict}
                onValueChange={setSelectedDistrict}
                includeAll={true}
                allLabel={t.allDistricts || 'সকল জেলা'}
                placeholder={t.allDistricts || 'সকল জেলা'}
                className="h-9 text-xs"
              />
            </div>

            <Button 
              variant="outline" 
              className={`gap-2 h-9 text-xs ${showFilters ? 'bg-green-50 border-green-200 text-green-700' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {t.filter}
            </Button>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px] sm:w-[160px] h-9 text-xs">
                <SelectValue placeholder={t.sortBy} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t.sortNewest}</SelectItem>
                <SelectItem value="price_asc">{t.sortPriceAsc}</SelectItem>
                <SelectItem value="price_desc">{t.sortPriceDesc}</SelectItem>
                <SelectItem value="best_selling">{t.sortBestSelling}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {showFilters && (
          <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{t.category}</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.allProducts} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allProducts}</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{getTranslatedCategory(cat, t)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-green-600" />
                  {t.district || 'জেলা'}
                </label>
                <DistrictSelect 
                  value={selectedDistrict}
                  onValueChange={setSelectedDistrict}
                  includeAll={true}
                  allLabel={t.allDistricts || 'সকল জেলা (All Districts)'}
                  placeholder={t.allDistricts || 'সকল জেলা'}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{t.minPrice}</label>
                <Input 
                  type="number" 
                  placeholder="0" 
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{t.maxPrice}</label>
                <Input 
                  type="number" 
                  placeholder="10000" 
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button 
                  variant="ghost" 
                  className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 gap-2 h-9 sm:h-10"
                  onClick={clearFilters}
                >
                  <X className="w-4 h-4" />
                  {t.clearFilter}
                </Button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-500">{t.noProductsFound}</p>
            <Button variant="link" onClick={clearFilters} className="text-green-600 mt-2">
              {t.clearAllFilters}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
