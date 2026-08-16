import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trash, Plus, Minus, ShoppingBag } from 'lucide-react';

export default function Cart() {
  const { items, removeItem, updateQuantity, total } = useCart();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const hasClosedShopItems = items.some(item => item.farmer?.shop_status !== 'open');

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <ShoppingBag className="w-16 h-16 text-gray-300" />
        <h2 className="text-2xl font-bold text-gray-500">{t.emptyCart}</h2>
        <Link to="/">
          <Button className="bg-green-600 hover:bg-green-700">{t.buyProducts}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-green-800">{t.cart}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-4 flex gap-4">
                <Link to={`/product/${item.id}`} className="w-24 h-24 shrink-0 rounded-lg overflow-hidden block hover:opacity-85 hover:scale-102 transition-all">
                  <img 
                    src={item.image_url || `https://picsum.photos/seed/${item.name}/200/200`} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </Link>
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between">
                    <Link to={`/product/${item.id}`} className="font-bold text-lg hover:text-green-600 transition-colors line-clamp-1">
                      {item.name}
                    </Link>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => removeItem(item.id)}>
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-green-700 font-bold">৳{item.price}</p>
                    {item.farmer?.shop_status !== 'open' ? (
                      <span className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full">
                        {t.closed}
                      </span>
                    ) : (
                      <div className="flex items-center gap-3 bg-gray-100 rounded-full px-3 py-1">
                        <button onClick={() => updateQuantity(item.id, item.cartQuantity - 1)}>
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-bold w-4 text-center">{item.cartQuantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.cartQuantity + 1)}
                          disabled={item.cartQuantity >= item.quantity}
                          className={item.cartQuantity >= item.quantity ? 'text-gray-300 cursor-not-allowed' : ''}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  {item.farmer?.shop_status === 'open' && item.cartQuantity >= item.quantity && (
                    <p className="text-[10px] text-amber-600 mt-1">{t.maxStockReached}</p>
                  )}
                  {item.farmer?.shop_status !== 'open' && (
                    <p className="text-[10px] text-red-500 mt-1">{t.shopClosedNotice}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <Card className="bg-green-50 border-green-100">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-bold text-green-800">{t.orderSummary}</h3>
              <div className="flex justify-between text-lg">
                <span>{t.total}</span>
                <span className="font-bold">৳{total}</span>
              </div>
              <Button 
                onClick={() => navigate('/checkout')}
                className="w-full bg-green-600 hover:bg-green-700 py-6 text-lg"
                disabled={hasClosedShopItems}
              >
                {t.checkout}
              </Button>
              {hasClosedShopItems && (
                <p className="text-xs text-red-500 text-center">{t.shopClosedError}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
