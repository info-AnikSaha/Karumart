import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { PaymentService, PaymentMethod } from '@/services/paymentService';
import { CreditCard, Wallet, Truck, CheckCircle2, Smartphone } from 'lucide-react';

export default function Checkout() {
  const { items, subtotal, deliveryFee, discount, grandTotal, appliedVoucher, applyVoucher, removeVoucher, clearCart, settings } = useCart();
  const { user, profile } = useAuth();
  const [promoCode, setPromoCode] = useState('');
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const { t } = useLanguage();
  const [address, setAddress] = useState(profile?.address || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [receiverName, setReceiverName] = useState(profile?.receiver_name || profile?.full_name || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [saveToProfile, setSaveToProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    
    setLoading(true);
    try {
      // 0. Save address to profile if requested
      if (saveToProfile && user) {
        await supabase
          .from('profiles')
          .update({ address, phone })
          .eq('id', user.id);
      }

      // 1. Check stock and shop status for all items first
      for (const item of items) {
        const { data: product, error: fetchError } = await supabase
          .from('products')
          .select('quantity, name, farmer:profiles!inner(shop_status, is_frozen)')
          .eq('id', item.id)
          .single();
          
        if (fetchError || !product) throw new Error(`${item.name} ${t.notFound}`);
        
        // Check shop status and freeze status
        const farmer = (product as any).farmer;
        if (farmer?.shop_status !== 'open' || farmer?.is_frozen) {
          const errorMsg = farmer?.is_frozen 
            ? `${product.name} - শপটি কারুমার্ট টিম দ্বারা ফ্রিজ করা হয়েছে` 
            : `${product.name} - ${t.shopClosedError}`;
          throw new Error(errorMsg);
        }

        if (product.quantity < item.cartQuantity) {
          throw new Error(`${product.name} ${t.insufficientStock}${product.quantity})`);
        }
      }

      // 2. Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          consumer_id: user?.id,
          total_amount: grandTotal,
          subtotal,
          delivery_fee: deliveryFee,
          discount_amount: discount,
          voucher_code: appliedVoucher?.code || null,
          status: 'pending',
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'cod' ? 'pending' : 'pending',
          address,
          phone,
        })
        .select('id')
        .single();

      if (orderError) {
        console.error('Order Error:', orderError);
        throw new Error(`${t.orderCreateError}: ` + orderError.message);
      }

      if (!orderData) throw new Error(t.orderCreateFailed);

      // 2.5 Process Digital Payment if not COD
      let transactionId = '';
      if (paymentMethod !== 'cod') {
        const paymentResult = await PaymentService.processPayment(paymentMethod, grandTotal, orderData.id);
        if (!paymentResult.success) {
          // If payment fails, we might want to cancel the order or keep it as pending payment
          throw new Error(paymentResult.error || 'পেমেন্ট সম্পন্ন করা সম্ভব হয়নি');
        }
        transactionId = paymentResult.transactionId || '';
        
        // Update order with payment details
        await supabase
          .from('orders')
          .update({ 
            payment_status: 'paid',
            transaction_id: transactionId 
          })
          .eq('id', orderData.id);
      }

    // 3. Create order items and update stock
    const orderItems = items.map(item => {
      const activePrice = (item.flash_sale_active && item.flash_sale_price) 
        ? item.flash_sale_price 
        : item.price;
      return {
        order_id: orderData.id,
        product_id: item.id,
        quantity: item.cartQuantity,
        price_at_time: activePrice,
        status: 'pending',
      };
    });

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) {
        console.error('Items Error:', itemsError);
        throw new Error(`${t.orderItemAddError}: ` + itemsError.message);
      }

      // 4. Update stock immediately
      for (const item of items) {
        const { data: p } = await supabase.from('products').select('quantity').eq('id', item.id).single();
        if (p) {
          await supabase.from('products').update({ quantity: Math.max(0, p.quantity - item.cartQuantity) }).eq('id', item.id);
        }
      }

      toast.success(t.orderSuccess);
      clearCart();
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || t.orderFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-green-800">{t.checkout}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>{t.address} {t.andContact}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePlaceOrder} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="receiverName">{t.receiverName}</Label>
                <Input 
                  id="receiverName" 
                  value={receiverName} 
                  onChange={e => setReceiverName(e.target.value)} 
                  required 
                  placeholder={t.deliveryNamePlaceholder}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t.phone}</Label>
                <Input 
                  id="phone" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  required 
                  placeholder="01xxxxxxxxx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">{t.address}</Label>
                <Input 
                  id="address" 
                  value={address} 
                  onChange={e => setAddress(e.target.value)} 
                  required 
                  placeholder={t.addressPlaceholder}
                />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <input 
                  type="checkbox" 
                  id="saveToProfile" 
                  checked={saveToProfile}
                  onChange={e => setSaveToProfile(e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="saveToProfile" className="text-sm text-gray-600 cursor-pointer">
                  {t.saveAddressToProfile}
                </label>
              </div>

              <div className="space-y-4 pt-4">
                <Label className="text-lg font-bold text-gray-700">পেমেন্ট পদ্ধতি নির্বাচন করুন (Select Payment Method)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                      paymentMethod === 'cod' 
                        ? 'border-green-600 bg-green-50 text-green-700' 
                        : 'border-gray-100 hover:border-green-200 bg-white text-gray-500'
                    }`}
                  >
                    <Truck className="w-8 h-8 mb-2" />
                    <span className="font-bold text-sm">ক্যাশ অন ডেলিভারি</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bkash')}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                      paymentMethod === 'bkash' 
                        ? 'border-[#D12053] bg-[#fdf2f4] text-[#D12053]' 
                        : 'border-gray-100 hover:border-[#D12053]/30 bg-white text-gray-500'
                    }`}
                  >
                    <Smartphone className="w-8 h-8 mb-2" />
                    <span className="font-bold text-sm">বিকাশ (bKash)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('nagad')}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                      paymentMethod === 'nagad' 
                        ? 'border-[#F15A22] bg-[#fef5f2] text-[#F15A22]' 
                        : 'border-gray-100 hover:border-[#F15A22]/30 bg-white text-gray-500'
                    }`}
                  >
                    <Wallet className="w-8 h-8 mb-2" />
                    <span className="font-bold text-sm">নগদ (Nagad)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                      paymentMethod === 'card' 
                        ? 'border-blue-600 bg-blue-50 text-blue-700' 
                        : 'border-gray-100 hover:border-blue-200 bg-white text-gray-500'
                    }`}
                  >
                    <CreditCard className="w-8 h-8 mb-2" />
                    <span className="font-bold text-sm">কার্ড / SSLCommerz</span>
                  </button>
                </div>
              </div>

              <div className="pt-6">
                <Button 
                  type="submit" 
                  className={`w-full py-7 text-xl font-black rounded-2xl shadow-lg transition-all hover:-translate-y-1 ${
                    paymentMethod === 'cod' ? 'bg-green-600 hover:bg-green-700 shadow-green-100' :
                    paymentMethod === 'bkash' ? 'bg-[#D12053] hover:bg-[#b01a45] shadow-[#D12053]/10' :
                    paymentMethod === 'nagad' ? 'bg-[#F15A22] hover:bg-[#d94e1b] shadow-[#F15A22]/10' :
                    'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
                  }`}
                  disabled={loading || items.length === 0}
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>প্রসেসিং হচ্ছে...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                       {paymentMethod === 'cod' ? <CheckCircle2 className="w-6 h-6" /> : <Wallet className="w-6 h-6" />}
                       <span>{paymentMethod === 'cod' ? t.placeOrder : 'পেমেন্ট করুন এবং অর্ডার দিন'}</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle>{t.orderSummary}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map(item => {
              const activePrice = (item.flash_sale_active && item.flash_sale_price) 
                ? item.flash_sale_price 
                : item.price;
              return (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.name} x {item.cartQuantity}</span>
                  <span className="font-medium">৳{activePrice * item.cartQuantity}</span>
                </div>
              );
            })}
            
            <div className="pt-4 space-y-3 border-t border-gray-100">
              <div className="space-y-2">
                <Label htmlFor="promo" className="text-xs font-bold text-gray-500 uppercase tracking-widest">প্রোমোকোড / ভাউচার</Label>
                <div className="flex gap-2">
                  <Input 
                    id="promo" 
                    placeholder="EID2026" 
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value)}
                    className="h-10 uppercase font-mono"
                    disabled={!!appliedVoucher}
                  />
                  {appliedVoucher ? (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        removeVoucher();
                        setPromoCode('');
                      }}
                      className="h-10 text-red-600 border-red-100"
                    >
                      মুছুন
                    </Button>
                  ) : (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={async () => {
                        setApplyingVoucher(true);
                        await applyVoucher(promoCode);
                        setApplyingVoucher(false);
                      }}
                      disabled={!promoCode || applyingVoucher}
                      className="h-10 border-blue-200 text-blue-600"
                    >
                      {applyingVoucher ? '...' : 'অ্যাপ্লাই'}
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm pt-2">
                <div className="flex justify-between text-gray-500">
                  <span>সাবটোটাল</span>
                  <span>৳{subtotal}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-red-600 font-medium">
                    <span>ডিসকাউন্ট ({appliedVoucher?.code})</span>
                    <span>-৳{discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-500">
                  <span>ডেলিভারি চার্জ</span>
                  {deliveryFee === 0 ? (
                    <span className="text-green-600 font-bold">ফ্রি (৳০)</span>
                  ) : (
                    <span>৳{deliveryFee}</span>
                  )}
                </div>
                {deliveryFee > 0 && (
                  <p className="text-[10px] text-amber-600 italic">
                    * ৳{settings.free_delivery_threshold} এর বেশি কেনাকাটা করলে ডেলিভারি চার্জ ফ্রি!
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 flex justify-between font-black text-2xl text-green-700">
              <span>{t.total}</span>
              <span>৳{grandTotal}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
