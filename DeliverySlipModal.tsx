import React, { useRef, useState } from 'react';
import { Order } from '@/types';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Download, MapPin, Package, Truck, Loader2, User, Phone } from 'lucide-react';
import { downloadPdfFromElement } from '@/lib/pdfGenerator';

interface DeliverySlipModalProps {
  order: Order;
  trigger?: React.ReactNode;
}

export function DeliverySlipModal({ order, trigger }: DeliverySlipModalProps) {
  const { t } = useLanguage();
  const slipRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    if (!slipRef.current || isGenerating) return;
    
    setIsGenerating(true);
    try {
      const filename = `delivery-slip-${order.id.slice(0, 8).toUpperCase()}.pdf`;
      await downloadPdfFromElement(slipRef.current, filename, 'ডেলিভারি স্লিপ ডাউনলোড সফল হয়েছে');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div onClick={handleDownloadPDF} className="cursor-pointer inline-flex items-center">
        {trigger || (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Truck className="w-3.5 h-3.5" />
            )}
            ডেলিভারি স্লিপ
          </Button>
        )}
      </div>

      {/* Hidden Delivery Slip Template */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div 
          ref={slipRef} 
          className="p-12 flex flex-col"
          style={{ 
            width: '794px', 
            minHeight: '1123px',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            fontFamily: '"Inter", sans-serif'
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-10 pb-6" style={{ borderBottom: '4px solid #0f172a' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#0f172a' }}>
                <Truck className="w-8 h-8 text-white" style={{ color: '#ffffff' }} />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tighter" style={{ color: '#0f172a' }}>DELIVERY SLIP</h1>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: '#64748b' }}>Logistics & Distribution</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono font-black" style={{ color: '#0f172a' }}>#DS-{order.id.slice(0, 8).toUpperCase()}</p>
              <p className="text-xs font-bold" style={{ color: '#64748b' }}>{new Date().toLocaleDateString('bn-BD')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12 mb-10">
            {/* Delivery To */}
            <div className="p-6 rounded-2xl" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: '#2563eb' }}>
                <MapPin className="w-3 h-3" /> ডেলিভারি গন্তব্য
              </h3>
              <div className="space-y-2">
                <p className="text-xl font-black" style={{ color: '#0f172a' }}>{order.consumer?.full_name}</p>
                <p className="text-sm font-medium leading-relaxed" style={{ color: '#475569' }}>{order.address}</p>
                <div className="pt-2 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f0fdf4' }}>
                    <Phone className="w-4 h-4" style={{ color: '#16a34a' }} />
                  </div>
                  <p className="text-lg font-black" style={{ color: '#0f172a' }}>{order.phone}</p>
                </div>
              </div>
            </div>

            {/* Order Info */}
            <div className="p-6 rounded-2xl" style={{ backgroundColor: '#f0f9ff', border: '1px solid #e0f2fe' }}>
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: '#2563eb' }}>
                <Package className="w-3 h-3" /> অর্ডার সামারি
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs font-bold" style={{ color: '#64748b' }}>অর্ডার আইডি:</span>
                  <span className="text-xs font-mono font-black" style={{ color: '#0f172a' }}>#{order.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-bold" style={{ color: '#64748b' }}>পেমেন্ট মেথড:</span>
                  <span className="text-xs font-black uppercase" style={{ color: '#0f172a' }}>{order.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-bold" style={{ color: '#64748b' }}>অবস্থা:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                    {order.payment_status === 'paid' ? 'PAID' : 'COLLECT CASH'}
                  </span>
                </div>
                <div className="pt-2 flex justify-between items-center" style={{ borderTop: '1px solid #dbeafe' }}>
                  <span className="text-sm font-black" style={{ color: '#0f172a' }}>মোট মূল্য:</span>
                  <span className="text-2xl font-black" style={{ color: '#1d4ed8' }}>৳{order.total_amount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Product List */}
          <div className="flex-grow">
            <h3 className="text-xs font-black uppercase tracking-widest mb-4 px-2" style={{ color: '#94a3b8' }}>পণ্য তালিকা</h3>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
              <table className="w-full text-left">
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest" style={{ color: '#64748b' }}>পণ্য</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center" style={{ color: '#64748b' }}>পরিমাণ</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest" style={{ color: '#64748b' }}>বিক্রেতা</th>
                  </tr>
                </thead>
                <tbody style={{ backgroundColor: '#ffffff' }}>
                  {order.items?.map((item, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td className="px-6 py-6">
                        <p className="font-black" style={{ color: '#0f172a' }}>{item.product?.name}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>SKU: {item.product?.sku || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-6 text-center font-mono font-black text-lg" style={{ color: '#334155' }}>
                        {item.quantity}
                      </td>
                      <td className="px-6 py-6">
                        <p className="text-sm font-bold" style={{ color: '#334155' }}>{item.product?.farmer?.shop_name || item.product?.farmer?.full_name}</p>
                        <p className="text-[10px] font-bold" style={{ color: '#94a3b8' }}>{item.product?.farmer?.address}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer / Verification */}
          <div className="mt-12 pt-8" style={{ borderTop: '2px dashed #e2e8f0' }}>
            <div className="grid grid-cols-2 gap-20">
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden italic text-[8px] text-center p-2 border-2 border-dashed" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', color: '#cbd5e1' }}>
                    QR Verification Placeholder
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#0f172a' }}>Security Guard</p>
                    <p className="text-[9px] font-bold leading-relaxed" style={{ color: '#94a3b8' }}>
                      ক্রেতাকে পণ্য বুঝিয়ে দেওয়ার সময় এই স্লিপটি সাথে রাখুন। পেমেন্ট সংগ্রহ করলে অবশ্যই সিস্টেমে আপডেট করুন।
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-end">
                <div className="w-full mb-2 border-b-2" style={{ borderColor: '#0f172a' }}></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-center" style={{ color: '#0f172a' }}>ডেলিভারি ম্যানের স্বাক্ষর</p>
              </div>
            </div>
            
            <div className="mt-20 text-center flex justify-center py-6 rounded-2xl" style={{ backgroundColor: '#f9fafb' }}>
              <p className="text-[10px] font-bold" style={{ color: '#94a3b8' }}>© {new Date().getFullYear()} KARUMART Logistics. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
