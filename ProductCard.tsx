import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '@/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ShoppingCart, MapPin, Store, Heart, CheckCircle2, ShieldCheck, Award, Star, Share2, Plus, Minus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getTranslatedCategory } from '@/lib/translations';

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { items, addItem, updateQuantity, removeItem } = useCart();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const cartItem = items.find((item) => item.id === product.id);
  const quantityInCart = cartItem ? cartItem.cartQuantity : 0;

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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

  useEffect(() => {
    if (user) {
      checkWishlist();
    }
  }, [user, product.id]);

  const checkWishlist = async () => {
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', user?.id)
        .eq('product_id', product.id)
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
          .eq('product_id', product.id);
        
        if (error) throw error;
        setIsWishlisted(false);
        toast.success(t.wishlistRemoved);
      } else {
        const { error } = await supabase
          .from('wishlist')
          .insert({ user_id: user.id, product_id: product.id });
        
        if (error) throw error;
        setIsWishlisted(true);
        toast.success(t.wishlistAdded);
      }
    } catch (error: any) {
      console.error('Wishlist Error Details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        user_id: user.id,
        product_id: product.id
      });
      toast.error(`উইশলিস্ট আপডেট করতে সমস্যা হয়েছে: ${error.message || 'অজানা ত্রুটি'}`);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddToCart = () => {
    addItem(product);
    toast.success(`${product.name} ${t.addedToCart}`);
  };

  const isFlashSale = product.flash_sale_active;
  const activePrice = isFlashSale && product.flash_sale_price ? product.flash_sale_price : product.price;
  const discountPercentage = isFlashSale && product.flash_sale_price 
    ? Math.round(((product.price - product.flash_sale_price) / product.price) * 100) 
    : 0;

  return (
    <Card className="group/card overflow-hidden bg-white border border-gray-100/90 hover:border-green-300/80 shadow-xs hover:shadow-xl hover:-translate-y-1.5 hover:ring-2 hover:ring-green-500/20 transition-all duration-300 ease-out rounded-xl md:rounded-2xl">
      <Link to={`/product/${product.id}`} className="block">
        <div className="aspect-square overflow-hidden bg-gray-100 relative group">
          <img
            src={product.image_url || `https://picsum.photos/seed/${product.name}/400/400`}
            alt={product.name}
            className="w-full h-full object-cover group-hover/card:scale-108 group-hover/card:brightness-[1.02] transition-transform duration-500 ease-out"
            referrerPolicy="no-referrer"
          />
          
          {isFlashSale && (
            <div className="absolute top-0 right-0 bg-orange-600 text-white px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-bl-xl font-black text-xs md:text-sm shadow-md z-10 animate-bounce group-hover/card:animate-none">
              -{discountPercentage}%
            </div>
          )}

          <button
            onClick={toggleWishlist}
            disabled={wishlistLoading}
            className={`absolute top-2 right-${isFlashSale ? '10' : '2'} p-2 rounded-full shadow-md hover:scale-110 active:scale-95 transition-all z-20 ${
              isWishlisted 
                ? 'bg-red-50 text-red-500 shadow-red-100' 
                : 'bg-white/90 backdrop-blur-xs text-gray-400 hover:text-red-500 hover:bg-white'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={handleShare}
            className="absolute top-11 sm:top-12 right-2 p-2 rounded-full shadow-md hover:scale-110 active:scale-95 transition-all z-20 bg-white/90 backdrop-blur-xs text-gray-400 hover:text-green-600 hover:bg-white"
            title={t.share}
          >
            <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          
          {/* Badge Overlays */}
          <div className="absolute top-2 left-2 flex flex-col gap-1.5 pointer-events-none">
            {product.farmer?.badge_best_seller && (
              <div className="bg-green-600/90 backdrop-blur-sm text-white px-2 py-0.5 rounded-full shadow-md border border-white/30 flex items-center gap-1 scale-90 origin-left">
                <CheckCircle2 className="w-3 h-3 fill-white text-green-600" />
                <span className="text-[9px] font-black uppercase tracking-tight">Best Seller</span>
              </div>
            )}
            {product.farmer?.badge_krishi_mall && (
              <div className="bg-amber-500/90 backdrop-blur-sm text-white px-2 py-0.5 rounded-md shadow-md border border-white/30 text-[9px] font-black flex items-center gap-1 scale-90 origin-left">
                <Store className="w-3 h-3" /> SUPER MALL
              </div>
            )}
          </div>
        </div>
      </Link>
      <CardContent className="p-1.5 sm:p-2.5 md:p-3">
        <Link to={`/product/${product.id}`} className="block group-hover/card:text-green-600">
          <div className="flex flex-col gap-0 mb-0.5">
            <div className="flex items-center justify-between gap-1">
              <h3 className="font-bold text-[11px] sm:text-xs md:text-base text-gray-800 group-hover/card:text-green-600 transition-colors truncate flex-1">
                {product.name}
              </h3>
              {product.farmer?.rating && (
                <div className="flex items-center gap-0.5 bg-yellow-50 px-1 py-0.5 rounded border border-yellow-100 shrink-0">
                  <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-[8px] md:text-[10px] font-black text-yellow-700">{product.farmer.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </Link>
        <p className="text-[8px] sm:text-[10px] md:text-xs text-gray-500 mb-0.5 leading-tight">{getTranslatedCategory(product.category, t)}</p>
        {product.farmer?.address && (
          <Link 
            to={`/farmer/${product.farmer_id}`}
            className="text-[8px] sm:text-[9px] md:text-[10px] text-gray-400 flex items-center gap-0.5 mb-1 truncate hover:text-green-600 transition-colors"
          >
            <MapPin className="w-2.5 h-2.5 text-red-400 shrink-0" /> {product.farmer.address}
          </Link>
        )}
        <div className="flex justify-between items-center mt-1">
          <div className="flex flex-col leading-none">
            {isFlashSale && (
              <span className="text-[8px] sm:text-[10px] text-gray-400 line-through font-bold leading-none mb-0.5">৳{product.price}</span>
            )}
            <span className={`text-[12px] sm:text-sm md:text-lg font-black leading-none ${isFlashSale ? 'text-orange-600' : 'text-green-700'}`}>৳{activePrice}</span>
          </div>
          <div className="flex flex-col items-end gap-0">
            <Link 
              to={`/farmer/${product.farmer_id}`}
              className="text-[8px] sm:text-[9px] md:text-[10px] text-green-600 hover:text-green-700 hover:underline flex items-center gap-0.5 leading-none font-medium"
            >
              <Store className="w-2.5 h-2.5 md:w-3 md:h-3" /> {t.viewShop}
            </Link>
            {product.farmer?.badge_official && (
              <span className="inline-flex items-center gap-0.5 bg-blue-600 text-white px-1 py-0.2 rounded text-[6px] sm:text-[7px] md:text-[8px] font-black uppercase tracking-tighter shrink-0 border border-blue-400 shadow-xs mt-0.5">
                <ShieldCheck className="w-2 h-2 md:w-2.5 md:h-2.5" /> OFFICIAL
              </span>
            )}
          </div>
        </div>
        <p className="text-[8px] text-gray-400 mt-1 leading-none">{product.quantity} {t.available}</p>
      </CardContent>
      <CardFooter className="p-1.5 sm:p-2.5 md:p-3 pt-0">
        {product.farmer?.shop_status !== 'open' ? (
          <Button 
            className="w-full bg-gray-400 text-white gap-1 h-7 sm:h-8 md:h-9 text-[10px] sm:text-xs md:text-xs font-semibold rounded-lg cursor-not-allowed"
            disabled
          >
            {t.closed}
          </Button>
        ) : product.quantity <= 0 ? (
          <Button 
            className="w-full bg-gray-300 text-gray-600 gap-1 h-7 sm:h-8 md:h-9 text-[10px] sm:text-xs md:text-xs font-semibold rounded-lg cursor-not-allowed"
            disabled
          >
            {t.stockOut}
          </Button>
        ) : quantityInCart > 0 ? (
          <div 
            className="w-full flex items-center justify-between bg-green-50 border border-green-300 rounded-lg h-7 sm:h-8 md:h-9 px-1 shadow-xs"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 rounded-md text-green-700 hover:bg-green-200 hover:text-green-900 transition-colors p-0 flex items-center justify-center shrink-0 cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
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
                <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-red-500 hover:scale-110 transition-transform" />
              ) : (
                <Minus className="w-3 h-3 md:w-3.5 md:h-3.5" />
              )}
            </Button>

            <div className="flex items-center gap-1 font-bold text-[11px] sm:text-xs md:text-sm text-green-900 select-none px-1">
              <span className="min-w-[1.2rem] text-center">{quantityInCart}</span>
              <span className="text-[9px] font-medium text-green-700 hidden md:inline">in cart</span>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors p-0 flex items-center justify-center shrink-0 shadow-xs cursor-pointer disabled:opacity-50 disabled:bg-gray-400"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (quantityInCart >= product.quantity) {
                  toast.error(`সর্বোচ্চ ${product.quantity} টি পণ্য উপলব্ধ আছে`);
                  return;
                }
                updateQuantity(product.id, quantityInCart + 1);
              }}
              disabled={quantityInCart >= product.quantity}
              title="Increase"
            >
              <Plus className="w-3 h-3 md:w-3.5 md:h-3.5" />
            </Button>
          </div>
        ) : (
          <Button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAddToCart();
            }}
            className="w-full bg-green-600 hover:bg-green-700 active:scale-[0.98] gap-1 h-7 sm:h-8 md:h-9 text-[10px] sm:text-xs md:text-xs font-semibold shadow-xs hover:shadow-md transition-all rounded-lg"
          >
            <ShoppingCart className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span className="hidden sm:inline">{t.addToCart}</span>
            <span className="sm:hidden">{t.cart}</span>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
