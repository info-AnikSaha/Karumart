import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Order, OrderStatus, Profile } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Truck, MapPin, Phone, RefreshCw, Package, CheckCircle, Clock, Ban, ArrowUpRight, RefreshCcw, ArrowLeftCircle } from 'lucide-react';
import { DeliverySlipModal } from '@/components/DeliverySlipModal';
import { InvoiceModal } from '@/components/InvoiceModal';
import { DistrictSelect } from '@/components/DistrictSelect';
import { matchDistrictInAddress, detectDistrictFromAddress, ALL_DISTRICTS } from '@/lib/districts';

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case 'delivered':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'cancelled':
    case 'returned':
    case 'return_requested':
    case 'return_picked_up':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'on_the_way':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'picked_up':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'confirmed':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedPickupDistrict, setSelectedPickupDistrict] = useState<string>('all');
  const [selectedAssignedDistrict, setSelectedAssignedDistrict] = useState<string>('all');

  const getStatusLabel = (status: OrderStatus | string) => {
    switch (status) {
      case 'pending':
        return t.pending || (language === 'bn' ? 'অপেক্ষমান' : 'Pending');
      case 'confirmed':
        return language === 'bn' ? 'নিশ্চিত' : 'Confirmed';
      case 'picked_up':
        return t.pickedUp || (language === 'bn' ? 'সংগৃহীত' : 'Picked Up');
      case 'on_the_way':
        return t.onTheWay || (language === 'bn' ? 'পথে আছে (Shipped)' : 'On The Way (Shipped)');
      case 'delivered':
        return t.delivered || (language === 'bn' ? 'ডেলিভারি সম্পন্ন' : 'Delivered');
      case 'cancelled':
        return t.cancelled || (language === 'bn' ? 'বাতিল' : 'Cancelled');
      case 'return_requested':
        return t.returnRequested || (language === 'bn' ? 'রিটার্ন অনুরোধ' : 'Return Requested');
      case 'return_picked_up':
        return t.returnPickedUp || (language === 'bn' ? 'রিটার্ন সংগৃহীত' : 'Return Picked Up');
      case 'returned':
        return t.returned || (language === 'bn' ? 'ফেরত সম্পন্ন' : 'Returned');
      default:
        return status;
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US');
  };

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const [assignedRes, availableRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*, consumer:profiles!orders_consumer_id_fkey(*), items:order_items(*, product:products(*, farmer:profiles(*)))')
          .eq('delivery_man_id', user?.id),
        supabase
          .from('orders')
          .select('*, consumer:profiles!orders_consumer_id_fkey(*), items:order_items(*, product:products(*, farmer:profiles(*)))')
          .is('delivery_man_id', null)
          .in('status', ['confirmed', 'return_requested'])
      ]);

      if (assignedRes.error) throw assignedRes.error;
      if (availableRes.error) throw availableRes.error;

      setOrders(assignedRes.data || []);
      setAvailableOrders(availableRes.data || []);
    } catch (error: any) {
      console.error('Error fetching delivery data:', error);
      toast.error(language === 'bn' ? 'অর্ডার লোড করতে সমস্যা হয়েছে: ' + error.message : 'Error loading orders: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      // Optimistic update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));

      // Get current order to check previous status
      const { data: currentOrder } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single();

      const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
      if (error) throw error;

      // Handle stock changes based on delivery status
      if (status === 'cancelled' && currentOrder?.status !== 'cancelled') {
        // Restore stock if cancelled (since it was decremented at checkout)
        const { data: items } = await supabase
          .from('order_items')
          .select('product_id, quantity')
          .eq('order_id', orderId);
          
        if (items) {
          for (const item of items) {
            const { data: p } = await supabase
              .from('products')
              .select('quantity')
              .eq('id', item.product_id)
              .single();
            
            if (p) {
              await supabase
                .from('products')
                .update({ quantity: p.quantity + item.quantity })
                .eq('id', item.product_id);
            }
          }
        }
      } else if (status === 'returned' && currentOrder?.status !== 'returned') {
        // Restore stock when returned to seller
        const { data: items } = await supabase
          .from('order_items')
          .select('id, product_id, quantity')
          .eq('order_id', orderId);
          
        if (items) {
          for (const item of items) {
            const { data: p } = await supabase
              .from('products')
              .select('quantity')
              .eq('id', item.product_id)
              .single();
            
            if (p) {
              await supabase
                .from('products')
                .update({ quantity: p.quantity + item.quantity })
                .eq('id', item.product_id);
            }
          }
        }
      }

      toast.success(language === 'bn' ? 'অর্ডারের অবস্থা পরিবর্তন করা হয়েছে' : 'Order status updated successfully');
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message);
      fetchOrders();
    }
  };

  const handlePickOrder = async (orderId: string, currentStatus: OrderStatus) => {
    try {
      const nextStatus = currentStatus === 'return_requested' ? 'return_picked_up' : 'picked_up';
      const { error } = await supabase.from('orders').update({ 
        delivery_man_id: user?.id,
        status: nextStatus
      }).eq('id', orderId);
      
      if (error) throw error;
      toast.success(language === 'bn' ? 'অর্ডারটি আপনার জন্য বরাদ্দ করা হয়েছে' : 'Order assigned to you successfully');
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const stats = {
    picked_up: orders.filter(o => o.status === 'picked_up').length,
    on_the_way: orders.filter(o => o.status === 'on_the_way').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    return_picked_up: orders.filter(o => o.status === 'return_picked_up').length,
    returned: orders.filter(o => o.status === 'returned').length,
    available: availableOrders.length
  };

  const filteredOrders = orders.filter(order => {
    if (activeFilter !== 'all' && order.status !== activeFilter) return false;
    if (selectedAssignedDistrict !== 'all') {
      const sellerMatches = order.items?.some(item => 
        matchDistrictInAddress(item.product?.farmer?.address, selectedAssignedDistrict)
      );
      const buyerMatches = matchDistrictInAddress(order.address, selectedAssignedDistrict);
      if (!sellerMatches && !buyerMatches) return false;
    }
    return true;
  });

  const filteredAvailableOrders = availableOrders.filter(order => {
    if (selectedPickupDistrict === 'all') return true;
    const sellerMatches = order.items?.some(item => 
      matchDistrictInAddress(item.product?.farmer?.address, selectedPickupDistrict)
    );
    const buyerMatches = matchDistrictInAddress(order.address, selectedPickupDistrict);
    return sellerMatches || buyerMatches;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {language === 'bn' ? 'ডেলিভারি ড্যাশবোর্ড' : 'Delivery Dashboard'}
          </h1>
          <p className="text-gray-500">
            {language === 'bn' 
              ? 'আপনার বরাদ্দকৃত অর্ডারের বর্তমান অবস্থা পরিচালনা করুন' 
              : 'Manage the delivery status of your assigned orders'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeFilter !== 'all' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setActiveFilter('all')}
              className="text-blue-600 font-bold hover:bg-blue-50 border-blue-200"
            >
              {language === 'bn' ? 'সবগুলো দেখুন' : 'View All'}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={fetchOrders} className="gap-2 bg-white shadow-sm border-gray-200 hover:bg-gray-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {language === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* 6 Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: সংগৃহীত / Picked Up */}
        <Card 
          className={`cursor-pointer transition-all border shadow-sm ${activeFilter === 'picked_up' ? 'ring-2 ring-blue-500 bg-blue-50/30' : 'hover:border-blue-300'}`}
          onClick={() => setActiveFilter('picked_up')}
        >
          <CardContent className="p-3 text-center flex flex-col items-center justify-center">
            <p className="text-[10px] font-bold text-gray-500 mb-1 uppercase">
              {t.pickedUp || (language === 'bn' ? 'সংগৃহীত' : 'Picked Up')}
            </p>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              <p className="text-xl font-black text-gray-900">{formatNumber(stats.picked_up)}</p>
            </div>
            {activeFilter === 'picked_up' && <div className="mt-1 w-4 h-1 bg-blue-600 rounded-full" />}
          </CardContent>
        </Card>

        {/* Card 2: পথে আছে / On The Way / Shipped */}
        <Card 
          className={`cursor-pointer transition-all border shadow-sm ${activeFilter === 'on_the_way' ? 'ring-2 ring-blue-500 bg-blue-50/30' : 'hover:border-blue-300'}`}
          onClick={() => setActiveFilter('on_the_way')}
        >
          <CardContent className="p-3 text-center flex flex-col items-center justify-center">
            <p className="text-[10px] font-bold text-gray-500 mb-1 uppercase">
              {t.onTheWay || (language === 'bn' ? 'পথে আছে' : 'On The Way')}
            </p>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              <p className="text-xl font-black text-gray-900">{formatNumber(stats.on_the_way)}</p>
            </div>
            {activeFilter === 'on_the_way' && <div className="mt-1 w-4 h-1 bg-blue-600 rounded-full" />}
          </CardContent>
        </Card>

        {/* Card 3: ডেলিভারি সম্পন্ন / Delivered */}
        <Card 
          className={`cursor-pointer transition-all border shadow-sm ${activeFilter === 'delivered' ? 'ring-2 ring-green-500 bg-green-50/30' : 'hover:border-green-300'}`}
          onClick={() => setActiveFilter('delivered')}
        >
          <CardContent className="p-3 text-center flex flex-col items-center justify-center">
            <p className="text-[10px] font-bold text-gray-500 mb-1 uppercase">
              {t.delivered || (language === 'bn' ? 'ডেলিভারি সম্পন্ন' : 'Delivered')}
            </p>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-xl font-black text-gray-900">{formatNumber(stats.delivered)}</p>
            </div>
            {activeFilter === 'delivered' && <div className="mt-1 w-4 h-1 bg-green-600 rounded-full" />}
          </CardContent>
        </Card>

        {/* Card 4: বাতিল / Cancelled */}
        <Card 
          className={`cursor-pointer transition-all border shadow-sm ${activeFilter === 'cancelled' ? 'ring-2 ring-red-500 bg-red-50/30' : 'hover:border-red-300'}`}
          onClick={() => setActiveFilter('cancelled')}
        >
          <CardContent className="p-3 text-center flex flex-col items-center justify-center">
            <p className="text-[10px] font-bold text-gray-500 mb-1 uppercase">
              {t.cancelled || (language === 'bn' ? 'বাতিল' : 'Cancelled')}
            </p>
            <div className="flex items-center gap-2">
              <Ban className="w-4 h-4 text-red-600" />
              <p className="text-xl font-black text-gray-900">{formatNumber(stats.cancelled)}</p>
            </div>
            {activeFilter === 'cancelled' && <div className="mt-1 w-4 h-1 bg-red-600 rounded-full" />}
          </CardContent>
        </Card>

        {/* Card 5: রিটার্ন সংগৃহীত / Return Picked Up */}
        <Card 
          className={`cursor-pointer transition-all border shadow-sm ${activeFilter === 'return_picked_up' ? 'ring-2 ring-amber-500 bg-amber-50/30' : 'hover:border-amber-300'}`}
          onClick={() => setActiveFilter('return_picked_up')}
        >
          <CardContent className="p-3 text-center flex flex-col items-center justify-center">
            <p className="text-[10px] font-bold text-gray-500 mb-1 uppercase">
              {t.returnPickedUp || (language === 'bn' ? 'রিটার্ন সংগৃহীত' : 'Return Picked Up')}
            </p>
            <div className="flex items-center gap-2">
              <RefreshCcw className="w-4 h-4 text-amber-600" />
              <p className="text-xl font-black text-gray-900">{formatNumber(stats.return_picked_up)}</p>
            </div>
            {activeFilter === 'return_picked_up' && <div className="mt-1 w-4 h-1 bg-amber-600 rounded-full" />}
          </CardContent>
        </Card>

        {/* Card 6: ফেরত সম্পন্ন / Returned */}
        <Card 
          className={`cursor-pointer transition-all border shadow-sm ${activeFilter === 'returned' ? 'ring-2 ring-gray-600 bg-gray-50' : 'hover:border-gray-400'}`}
          onClick={() => setActiveFilter('returned')}
        >
          <CardContent className="p-3 text-center flex flex-col items-center justify-center">
            <p className="text-[10px] font-bold text-gray-500 mb-1 uppercase">
              {t.returned || (language === 'bn' ? 'ফেরত সম্পন্ন' : 'Returned')}
            </p>
            <div className="flex items-center gap-2">
              <ArrowLeftCircle className="w-4 h-4 text-gray-600" />
              <p className="text-xl font-black text-gray-900">{formatNumber(stats.returned)}</p>
            </div>
            {activeFilter === 'returned' && <div className="mt-1 w-4 h-1 bg-gray-600 rounded-full" />}
          </CardContent>
        </Card>
      </div>

      {/* Available Pickups Alert (Side Card) */}
      <div 
        className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-colors"
        onClick={() => document.getElementById('available-orders')?.scrollIntoView({ behavior: 'smooth' })}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-sm">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-amber-900">
              {language === 'bn' 
                ? `পিকআপের অপেক্ষায় ${formatNumber(stats.available)} টি অর্ডার` 
                : `${formatNumber(stats.available)} Orders Awaiting Pickup`}
            </h3>
            <p className="text-xs text-amber-700">
              {language === 'bn' ? 'নতুন ডেলিভারি নিতে এখানে ক্লিক করুন' : 'Click here to take new delivery orders'}
            </p>
          </div>
        </div>
        <ArrowUpRight className="w-5 h-5 text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between border-b pb-2 gap-2">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-800">{t.assignedOrders || (language === 'bn' ? 'বরাদ্দকৃত অর্ডার' : 'Assigned Orders')}</h2>
              {activeFilter !== 'all' && (
                <Badge className="bg-blue-600 text-white rounded-full px-2.5 py-0.5 text-xs border-none hover:bg-blue-700">
                  {getStatusLabel(activeFilter)}
                </Badge>
              )}
            </div>
            
            {/* Assigned Orders District Filter */}
            <div className="w-[170px]">
              <DistrictSelect 
                value={selectedAssignedDistrict}
                onValueChange={setSelectedAssignedDistrict}
                includeAll={true}
                allLabel={language === 'bn' ? 'সকল জেলা' : 'All Districts'}
                placeholder={language === 'bn' ? 'জেলা অনুযায়ী' : 'By District'}
                className="h-8 text-xs bg-gray-50"
              />
            </div>
          </div>
          {filteredOrders.length > 0 ? (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className={`border-l-4 hover:shadow-md transition-all rounded-xl ${
                  order.status === 'delivered' ? 'border-l-green-500' :
                  order.status === 'cancelled' ? 'border-l-red-500' :
                  order.status === 'on_the_way' ? 'border-l-blue-500' :
                  'border-l-amber-500'
                }`}>
                  <CardContent className="p-5">
                    <div className="flex flex-col space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-gray-900 text-sm">#ORD-{order.id.slice(0, 8).toUpperCase()}</span>
                            <Badge className={`${getStatusColor(order.status)} border shadow-sm font-medium`}>
                              {getStatusLabel(order.status)}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-gray-400">
                            {language === 'bn' ? 'অর্ডার করা হয়েছে' : 'Ordered on'}: {new Date(order.created_at).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}
                          </p>
                        </div>
                        <p className="text-lg font-black text-green-700">৳{order.total_amount}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Buyer Info */}
                        <div className="p-3 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              {language === 'bn' ? 'ডেলিভারি গন্তব্য (Buyer)' : 'Delivery Destination (Buyer)'}
                            </p>
                            {(() => {
                              const dist = detectDistrictFromAddress(order.address);
                              return dist ? (
                                <span className="bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                  📍 {language === 'bn' ? dist.nameBn : dist.nameEn}
                                </span>
                              ) : null;
                            })()}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-gray-800">{order.consumer?.full_name}</p>
                            <p className="text-xs text-gray-600 flex items-start gap-1.5">
                              <MapPin className="w-3 h-3 text-red-400 mt-0.5 shrink-0" /> {order.address}
                            </p>
                            <p className="text-xs text-gray-600 flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-green-500 shrink-0" /> {order.phone}
                            </p>
                          </div>
                        </div>

                        {/* Seller Info */}
                        <div className="p-3 bg-blue-50/30 rounded-xl space-y-2 border border-blue-100/50">
                          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                            {language === 'bn' ? 'পিকআপ লোকেশন (Seller)' : 'Pickup Location (Seller)'}
                          </p>
                          <div className="space-y-3">
                            {Array.from(new Map(order.items?.map(item => [item.product?.farmer?.id, item.product?.farmer])).values()).map((farmerData, idx) => {
                              const farmer = farmerData as Profile;
                              const farmerDist = detectDistrictFromAddress(farmer?.address);
                              return (
                                <div key={idx} className="space-y-1 border-b last:border-0 border-blue-100/50 pb-1 last:pb-0">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-bold text-blue-800">{farmer?.shop_name || farmer?.full_name}</p>
                                    {farmerDist && (
                                      <span className="bg-blue-100 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                        🏪 {language === 'bn' ? farmerDist.nameBn : farmerDist.nameEn}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-gray-600 flex items-start gap-1.5 leading-tight">
                                    <MapPin className="w-3 h-3 text-red-400 mt-0.5 shrink-0" /> {farmer?.address || (language === 'bn' ? 'ঠিকানা পাওয়া যায়নি' : 'No address provided')}
                                  </p>
                                  <p className="text-[11px] text-gray-600 flex items-center gap-1.5 leading-tight">
                                    <Phone className="w-3 h-3 text-green-500 shrink-0" /> {farmer?.phone || (language === 'bn' ? 'ফোন পাওয়া যায়নি' : 'No phone provided')}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t flex flex-col md:flex-row justify-between items-center gap-3">
                        <span className="text-sm text-gray-500 font-medium">
                          {language === 'bn' ? 'অবস্থা পরিবর্তন করুন:' : 'Update Status:'}
                        </span>
                        <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full md:w-auto">
                          <InvoiceModal order={order} />
                          <DeliverySlipModal order={order} />
                          <Select 
                            value={order.status} 
                            onValueChange={(val: OrderStatus) => handleUpdateStatus(order.id, val)}
                          >
                            <SelectTrigger className="w-full md:w-[200px] h-9 bg-white border-gray-200 font-medium text-xs">
                              <SelectValue placeholder={t.changeStatus || (language === 'bn' ? 'অবস্থা পরিবর্তন' : 'Change Status')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="confirmed">{language === 'bn' ? 'নিশ্চিত (Confirmed)' : 'Confirmed'}</SelectItem>
                              <SelectItem value="picked_up">{t.pickedUp || (language === 'bn' ? 'সংগৃহীত (Picked Up)' : 'Picked Up')}</SelectItem>
                              <SelectItem value="on_the_way">{t.onTheWay || (language === 'bn' ? 'পথে আছে (Shipped / On The Way)' : 'On The Way / Shipped')}</SelectItem>
                              <SelectItem value="delivered">{t.delivered || (language === 'bn' ? 'ডেলিভারি সম্পন্ন (Delivered)' : 'Delivered')}</SelectItem>
                              <SelectItem value="cancelled">{t.cancelled || (language === 'bn' ? 'বাতিল (Cancelled)' : 'Cancelled')}</SelectItem>
                              <SelectItem value="return_picked_up">{t.returnPickedUp || (language === 'bn' ? 'রিটার্ন সংগৃহীত (Return Picked)' : 'Return Picked Up')}</SelectItem>
                              <SelectItem value="returned">{t.returned || (language === 'bn' ? 'ফেরত সম্পন্ন (Returned)' : 'Returned')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed py-16 flex flex-col items-center justify-center text-gray-500 bg-gray-50/50 rounded-2xl">
              <Package className="w-12 h-12 mb-3 text-gray-300" />
              <p className="font-bold text-gray-400">
                {activeFilter === 'all' && selectedAssignedDistrict === 'all'
                  ? (language === 'bn' ? 'আপনার জন্য কোন অর্ডার বরাদ্দ নেই।' : 'No orders assigned to you yet.')
                  : (language === 'bn' ? 'এই ফিল্টারে কোন বরাদ্দকৃত অর্ডার পাওয়া যায়নি।' : 'No assigned orders found for this filter.')}
              </p>
            </Card>
          )}
        </div>

        <div className="space-y-4" id="available-orders">
          <div className="flex flex-wrap items-center justify-between border-b pb-2 gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <h2 className="text-xl font-bold text-gray-800">
                {language === 'bn' ? 'সংগ্রহের অপেক্ষায় (Available)' : 'Available Pickups'}
              </h2>
              <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold text-xs">
                {formatNumber(filteredAvailableOrders.length)} {language === 'bn' ? 'টি' : ''}
              </Badge>
            </div>

            {/* Available Pickups District Filter */}
            <div className="w-[190px]">
              <DistrictSelect 
                value={selectedPickupDistrict}
                onValueChange={setSelectedPickupDistrict}
                includeAll={true}
                allLabel={language === 'bn' ? 'সকল জেলা (পিকআপ)' : 'All Districts (Pickup)'}
                placeholder={language === 'bn' ? 'পিকআপ জেলা ফিল্টার' : 'Pickup District'}
                className="h-8 text-xs bg-amber-50/60 border-amber-200"
              />
            </div>
          </div>
          {filteredAvailableOrders.length > 0 ? (
            <div className="grid gap-4">
              {filteredAvailableOrders.map((order) => (
                <Card key={order.id} className="hover:border-green-300 transition-all border-l-4 border-l-amber-500">
                  <CardContent className="p-4">
                    <div className="flex flex-col space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-900 mb-1 text-sm">#ORD-{order.id.slice(0, 8).toUpperCase()}</p>
                          <div className="flex items-center gap-2">
                            {order.status === 'return_requested' && (
                              <Badge variant="destructive" className="bg-red-500 text-white border-none text-[10px] animate-pulse uppercase px-2 py-0">
                                {t.returnRequested || (language === 'bn' ? 'রিটার্ন অনুরোধ' : 'Return Requested')}
                              </Badge>
                            )}
                            <Badge className={`${getStatusColor(order.status)} border text-[10px] h-5 font-medium`}>
                              {getStatusLabel(order.status)}
                            </Badge>
                          </div>
                        </div>
                        <Button 
                          onClick={() => handlePickOrder(order.id, order.status)} 
                          className="bg-green-600 hover:bg-green-700 text-white font-bold h-9 px-6 shadow-md shadow-green-100 transition-all active:scale-95"
                        >
                          {language === 'bn' ? 'পিক করুন' : 'Pick Order'}
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {/* Summary Info */}
                        <div className="flex flex-col gap-1.5 p-3 bg-gray-50 rounded-lg border border-gray-100 shadow-inner">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-gray-400 capitalize">
                              {language === 'bn' ? 'ডেলিভারি গন্তব্য (Delivery to)' : 'Delivery to'}
                            </p>
                            {(() => {
                              const dist = detectDistrictFromAddress(order.address);
                              return dist ? (
                                <span className="bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                  📦 {language === 'bn' ? dist.nameBn : dist.nameEn}
                                </span>
                              ) : null;
                            })()}
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-gray-700 font-medium leading-relaxed">{order.address}</p>
                          </div>
                          <p className="text-xs text-gray-600 font-bold ml-1.5">
                            {language === 'bn' ? 'ক্রেতা' : 'Buyer'}: {order.consumer?.full_name || (language === 'bn' ? 'অজানা' : 'Unknown')}
                          </p>
                        </div>
                        
                        {/* Seller Locations */}
                        <div className="space-y-2">
                          <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">
                            {language === 'bn' ? 'পিকআপ লোকেশনসমূহ (Pickup From):' : 'Pickup Locations (Pickup From):'}
                          </span>
                          <div className="grid grid-cols-1 gap-2">
                            {Array.from(new Map(order.items?.map(item => [item.product?.farmer?.id, item.product?.farmer])).values()).map((farmerData, idx) => {
                              const farmer = farmerData as Profile;
                              const farmerDist = detectDistrictFromAddress(farmer?.address);
                              return (
                                <div key={idx} className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm flex items-start gap-3">
                                  <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center text-amber-700 shrink-0 font-bold border border-amber-200 text-xs shadow-inner">
                                    {idx + 1}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1">
                                      <p className="text-xs font-bold text-gray-800 truncate">{farmer?.shop_name || farmer?.full_name}</p>
                                      {farmerDist && (
                                        <span className="bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0">
                                          📍 {language === 'bn' ? farmerDist.nameBn : farmerDist.nameEn}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-gray-500 truncate flex items-center gap-1 mt-0.5">
                                      <MapPin className="w-2.5 h-2.5 shrink-0" /> {farmer?.address || (language === 'bn' ? 'ঠিকানা নেই' : 'No address')}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed py-16 flex flex-col items-center justify-center text-gray-500 bg-gray-50/50">
              <RefreshCw className="w-12 h-12 mb-3 text-gray-100" />
              <p className="font-medium text-sm text-center px-6">
                {selectedPickupDistrict !== 'all'
                  ? (language === 'bn' ? 'নির্বাচিত জেলায় সংগ্রহের মতো কোন অর্ডার নেই।' : 'No pickup orders found in the selected district.')
                  : (language === 'bn' ? 'বর্তমানে কোন নতুন অর্ডার নেই।' : 'No new orders available currently.')}
              </p>
              <p className="text-[10px] text-gray-400 mt-2 text-center px-6 italic">
                {language === 'bn' ? '* নিশ্চিত করা অর্ডারগুলো এখানে দেখা যাবে।' : '* Confirmed orders will appear here.'}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
