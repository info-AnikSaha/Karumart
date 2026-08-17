import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Product, Review } from '@/types';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingCart, ArrowLeft, ShieldCheck, MapPin, Star, Snowflake, CheckCircle2, Award, Store, Heart, Share2, Zap, Plus, Minus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getTranslatedCategory } from '@/lib/translations';

export default function ProductDetail() {
  const { id } = useParams();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const { items, addItem, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  const cartItem = items.find((i) => i.id === product?.id);
  const quantityInCart = cartItem?.cartQuantity || 0;

  const handleShare = async () => {
    if (!product) return;
    
    const shareData = {
      title: product.name,
      text: `${t.shareText}${product.name}`,
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
      console.error('Error sharing:', error);
    }
  };

  useEffect(() => {
    if (user && id) {
      checkWishlist();
    }
  }, [user, id]);

  const checkWishlist = async () => {
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', user?.id)
        .eq('product_id', id)
        .maybeSingle();
      
      if (error) throw error;
      setIsWishlisted(!!data);
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error(t.loginToWishlist);
      return;
    }

    try {
      setWishlistLoading(true);
      if (isWishlisted) {
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', product?.id);
        
        if (error) throw error;
        setIsWishlisted(false);
        toast.success(t.wishlistRemoved);
      } else {
        const { error } = await supabase
          .from('wishlist')
          .insert({ user_id: user.id, product_id: product?.id });
        
        if (error) throw error;
        setIsWishlisted(true);
        toast.success(t.wishlistAdded);
      }
    } catch (error: any) {
      console.error('Wishlist Error:', error);
      toast.error(`উইশলিস্ট আপডেট করতে সমস্যা হয়েছে: ${error.message || 'অজানা ত্রুটি'}`);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      if (product.farmer?.is_frozen) {
        toast.error('দুঃখিত, এই শপটি বর্তমানে ফ্রিজ করা আছে। আপনি অর্ডার করতে পারবেন না।');
        return;
      }
      addItem(product);
      toast.success(`${product.name} ${t.addedToCartSuccess}`);
    }
  };

  const handleBuyNow = () => {
    if (product) {
      if (product.farmer?.is_frozen) {
        toast.error('দুঃখিত, এই শপটি বর্তমানে ফ্রিজ করা আছে। আপনি অর্ডার করতে পারবেন না।');
        return;
      }
      if (product.farmer?.shop_status !== 'open') {
        toast.error(t.shopClosedError);
        return;
      }
      addItem(product);
      navigate('/checkout');
    }
  };

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchReviews();
    }
  }, [id]);

  const fetchReviews = async () => {
    try {
      // Try fetching with explicit relation name first, fallback to profiles if it fails
      const { data, error } = await supabase
        .from('reviews')
        .select('*, profiles!reviews_consumer_id_fkey(*)')
        .eq('product_id', id)
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback if the named relation fails
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('reviews')
          .select('*, profiles(*)')
          .eq('product_id', id)
          .order('created_at', { ascending: false });
          
        if (fallbackError) throw fallbackError;
        
        // Map profiles to consumer for the UI
        const mappedData = fallbackData?.map(r => ({
          ...r,
          consumer: r.profiles
        }));
        setReviews(mappedData || []);
      } else {
        // Map profiles to consumer for the UI
        const mappedData = data?.map(r => ({
          ...r,
          consumer: r.profiles
        }));
        setReviews(mappedData || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, farmer:profiles(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20">{t.loading}</div>;
  if (!product) return <div className="text-center py-20">{t.productNotFound}</div>;

  return (
    <div className="space-y-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> {t.back}
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="aspect-square rounded-3xl overflow-hidden bg-gray-100 shadow-xl relative group">
          <img 
            src={product.image_url || `https://picsum.photos/seed/${product.name}/800/800`} 
            alt={product.name} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <button
            onClick={toggleWishlist}
            disabled={wishlistLoading}
            className={`absolute top-6 right-6 p-4 rounded-full shadow-2xl transition-all z-10 ${
              isWishlisted 
                ? 'bg-red-50 text-red-500 scale-110' 
                : 'bg-white/90 text-gray-400 hover:text-red-500 hover:scale-110'
            }`}
          >
            <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleShare}
            className="absolute top-6 left-6 p-4 rounded-full shadow-2xl transition-all z-10 bg-white/90 text-gray-400 hover:text-green-600 hover:scale-110"
            title={t.share}
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <Badge className="bg-green-100 text-green-700 mb-2">{getTranslatedCategory(product.category, t)}</Badge>
            <div className="flex flex-col gap-1">
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-2">
                {product.name}
                {product.farmer?.badge_best_seller && (
                  <div className="bg-green-600 px-3 py-1 rounded-full shadow-lg border border-white/20 shrink-0 flex items-center gap-2 animate-in slide-in-from-right duration-500" title="Best Seller">
                    <CheckCircle2 className="w-5 h-5 fill-white text-green-600" />
                    <span className="text-xs font-black uppercase tracking-tight text-white">Best Seller</span>
                  </div>
                )}
              </h1>
              <div className="flex flex-wrap gap-3 mt-2">
                {product.farmer?.badge_official && (
                  <span className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest shadow-lg border border-blue-400">
                    <ShieldCheck className="w-4 h-4" /> OFFICIAL STORE
                  </span>
                )}
                {product.farmer?.badge_krishi_mall && (
                  <span className="inline-flex items-center gap-1.5 bg-amber-500 text-white px-4 py-1.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest shadow-lg border border-amber-400">
                    <Store className="w-4 h-4" /> SUPER MALL
                  </span>
                )}
              </div>
            </div>
            <p className="text-3xl font-bold text-green-700 mt-4">৳{product.price}</p>
          </div>

          <div className={`p-6 rounded-2xl border transition-colors duration-500 space-y-4 ${
            product.farmer?.badge_krishi_mall ? 'bg-amber-50 border-amber-200' : 'bg-white border-green-50'
          }`}>
            <Link to={`/farmer/${product.farmer_id}`} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold group-hover:bg-green-200 transition-colors overflow-hidden">
                  {product.farmer?.avatar_url ? (
                    <img src={product.farmer.avatar_url} alt="Shop Logo" className="w-full h-full object-cover" />
                  ) : (
                    product.farmer?.full_name?.charAt(0)
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t.sellerInfo}</p>
                  <p className="font-bold text-gray-800 group-hover:text-green-600 transition-colors">
                    {product.farmer?.shop_name || product.farmer?.full_name}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="rounded-full border-green-200 text-green-700 hover:bg-green-50">
                {t.viewShopBtn}
              </Button>
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" /> {product.farmer?.address || t.noAddress}
            </div>
            <div className="flex items-center gap-2 text-sm text-green-600">
              <ShieldCheck className="w-4 h-4" /> {t.purityGuarantee}
            </div>
          </div>

          <div className="space-y-2">
            {product.sku && (
              <p className="text-xs font-mono font-black text-blue-600 mb-1 uppercase tracking-wider">SKU ID: {product.sku}</p>
            )}
            <h3 className="font-bold text-gray-800">{t.description}</h3>
            <p className="text-gray-600 leading-relaxed">
              {product.description || t.noDescription}
            </p>
          </div>

          <div className="pt-6">
            {product.farmer?.shop_status !== 'open' ? (
              <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-700">
                <p className="font-bold">{t.shopClosedError}</p>
                <p className="text-sm">{t.shopClosedNotice}</p>
              </div>
            ) : product.farmer?.is_frozen ? (
              <div className="bg-red-50 border border-red-200 p-6 rounded-2xl text-red-800 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <Snowflake className="w-5 h-5 animate-pulse" />
                  <p>Shop frozen by Karumart Team</p>
                </div>
                <p className="text-sm text-red-600">বিস্তারিত জানতে অনুগ্রহ করে কারুমার্ট হেল্প সেন্টারে যোগাযোগ করুন।</p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-3 items-center">
                  {quantityInCart > 0 ? (
                    <div className="flex items-center gap-3 bg-green-50 border-2 border-green-500 rounded-full px-3 py-2 shadow-md shadow-green-100">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="w-10 h-10 rounded-full text-green-800 hover:bg-green-200 transition-colors p-0 flex items-center justify-center cursor-pointer"
                        onClick={() => {
                          if (quantityInCart <= 1) {
                            removeItem(product.id);
                            toast.info(`${product.name} ${t.cart} থেকে সরানো হয়েছে`);
                          } else {
                            updateQuantity(product.id, quantityInCart - 1);
                          }
                        }}
                        title={quantityInCart === 1 ? "Remove" : "Decrease"}
                      >
                        {quantityInCart === 1 ? (
                          <Trash2 className="w-5 h-5 text-red-500 hover:scale-110 transition-transform" />
                        ) : (
                          <Minus className="w-5 h-5 font-bold" />
                        )}
                      </Button>

                      <div className="flex flex-col items-center justify-center px-2 select-none">
                        <span className="text-xl font-black text-green-900 leading-none">{quantityInCart}</span>
                        <span className="text-[10px] font-semibold text-green-700 uppercase tracking-wider">ইন কার্ট</span>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="w-10 h-10 rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors p-0 flex items-center justify-center shadow-xs cursor-pointer disabled:opacity-50 disabled:bg-gray-400"
                        onClick={() => {
                          if (quantityInCart >= product.quantity) {
                            toast.error(`সর্বোচ্চ ${product.quantity} টি পণ্য উপলব্ধ আছে`);
                            return;
                          }
                          updateQuantity(product.id, quantityInCart + 1);
                        }}
                        disabled={quantityInCart >= product.quantity}
                        title="Increase"
                      >
                        <Plus className="w-5 h-5 font-bold" />
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={handleAddToCart}
                      className="flex-1 sm:flex-initial bg-green-600 hover:bg-green-700 py-6 px-8 sm:px-10 text-base sm:text-lg gap-2.5 rounded-full shadow-lg shadow-green-100 transition-all font-semibold"
                      disabled={product.quantity <= 0 || product.farmer?.is_frozen}
                    >
                      <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                      {product.farmer?.is_frozen ? 'শপ ফ্রিজ করা' : product.quantity > 0 ? t.addToCart : t.outOfStock}
                    </Button>
                  )}

                  <Button 
                    onClick={handleBuyNow}
                    className="flex-1 sm:flex-initial bg-amber-500 hover:bg-amber-600 text-white py-6 px-8 sm:px-10 text-base sm:text-lg gap-2.5 rounded-full shadow-lg shadow-amber-100 transition-all font-semibold"
                    disabled={product.quantity <= 0 || product.farmer?.is_frozen}
                  >
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                    {t.buyNow || 'সরাসরি কিনুন'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleShare}
                    className="py-6 px-6 text-base sm:text-lg gap-2 rounded-full border-gray-200 text-gray-700 hover:bg-gray-50 shrink-0"
                    title={t.share}
                  >
                    <Share2 className="w-5 h-5" />
                    <span className="hidden sm:inline">{t.share}</span>
                  </Button>
                </div>
                {product.quantity <= 0 && (
                  <p className="text-red-500 text-sm mt-2">{t.noStockError}</p>
                )}
                {product.quantity > 0 && product.quantity < 10 && (
                  <p className="text-amber-600 text-sm mt-2">{t.only} {product.quantity} {t.left}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="pt-12 border-t">
        <h2 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-2">
          <Star className="w-6 h-6 text-amber-500 fill-amber-500" /> {t.customerReviews} ({reviews.length})
        </h2>

        {reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold">
                      {review.consumer?.full_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{review.consumer?.full_name}</p>
                      <p className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString(t.appName === 'Karumart' ? 'en-US' : 'bn-BD')}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < review.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-200'}`} 
                      />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 italic">"{review.comment}"</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <p className="text-gray-500">{t.noReviews}</p>
          </div>
        )}
      </div>
    </div>
  );
}
