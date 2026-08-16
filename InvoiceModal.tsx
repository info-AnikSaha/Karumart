import React, { useRef, useState } from 'react';
import { Order } from '@/types';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Download, MapPin, Package, Sprout, Loader2 } from 'lucide-react';
import { KarumartLogo } from '@/components/KarumartLogo';
import { downloadPdfFromElement } from '@/lib/pdfGenerator';

interface InvoiceModalProps {
  order: Order;
  trigger?: React.ReactNode;
}

export function InvoiceModal({ order, trigger }: InvoiceModalProps) {
  const { t } = useLanguage();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current || isGenerating) return;
    
    setIsGenerating(true);
    try {
      const filename = `invoice-${order.id.slice(0, 8).toUpperCase()}.pdf`;
      await downloadPdfFromElement(invoiceRef.current, filename, 'ইনভয়েস ডাউনলোড সফল হয়েছে');
    } finally {
      setIsGenerating(false);
    }
  };

  const calculateSubtotal = () => {
    return order.items?.reduce((total, item) => total + (item.price_at_time * item.quantity), 0) || 0;
  };

  return (
    <>
      <div onClick={handleDownloadPDF} className="cursor-pointer inline-flex items-center">
        {trigger || (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs gap-2 border-green-200 text-green-700 hover:bg-green-50"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            {t.invoice}
          </Button>
        )}
      </div>

      {/* Hidden Invoice Template for PDF Generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div 
          ref={invoiceRef} 
          className="p-16 flex flex-col relative"
          style={{ 
            width: '794px', 
            minHeight: '1123px',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            fontFamily: '"Inter", sans-serif'
          }}
        >
          {/* Subtle Document Grid Overlay for Professionalism */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ 
            backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
            backgroundSize: '40px 40px' 
          }}></div>

              <div className="flex justify-between items-center mb-16 relative z-10" style={{ backgroundColor: '#ffffff' }}>
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden bg-white border border-green-200 p-1">
                      <KarumartLogo className="w-full h-full" size="100%" />
                    </div>
                <div>
                  <div className="flex items-baseline leading-none">
                    <span className="text-[42px] font-black tracking-tighter" style={{ color: '#0f172a' }}>KARU</span>
                    <span className="text-[42px] font-black tracking-tighter ml-1" style={{ color: '#16a34a' }}>MART</span>
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] mt-1" style={{ color: '#64748b', opacity: 0.6 }}>E-Commerce Pioneer</p>
                </div>
              </div>
              <div className="space-y-1 text-xs font-bold uppercase tracking-widest pl-2" style={{ color: '#64748b' }}>
                <p className="flex items-center gap-2">
                  Dhaka, Bangladesh
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="mb-4">
                <h2 className="text-6xl font-black tracking-tighter italic opacity-10" style={{ color: '#0f172a' }}>INVOICE</h2>
                <div className="mt-[-40px] relative z-10">
                  <h2 className="text-3xl font-black tracking-[0.2em] uppercase" style={{ color: '#0f172a' }}>INVOICE</h2>
                </div>
              </div>
              <div className="space-y-2 mt-8">
                <div className="flex justify-end items-center gap-4">
                  <span className="text-[10px] uppercase font-black tracking-widest" style={{ color: '#94a3b8' }}>Invoice No.</span>
                  <span className="text-sm font-mono font-bold" style={{ color: '#0f172a' }}>AK-INV-{order.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-end items-center gap-4">
                  <span className="text-[10px] uppercase font-black tracking-widest" style={{ color: '#94a3b8' }}>Issue Date</span>
                  <span className="text-sm font-bold" style={{ color: '#16a34a' }}>{new Date(order.created_at).toLocaleDateString('bn-BD')}</span>
                </div>
                <div className="flex justify-end items-center gap-4">
                  <span className="text-[10px] uppercase font-black tracking-widest" style={{ color: '#94a3b8' }}>Status</span>
                  <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest" style={{ 
                    backgroundColor: order.payment_status === 'paid' ? '#dcfce7' : '#fee2e2', 
                    color: order.payment_status === 'paid' ? '#166534' : '#991b1b' 
                  }}>
                    {order.payment_status === 'paid' ? 'PAID' : 'DUE'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="h-0.5 w-full mb-16" style={{ backgroundColor: '#f1f5f9' }}></div>

          {/* Parties Section with Better Layout */}
          <div className="grid grid-cols-2 gap-24 mb-20 relative z-10" style={{ backgroundColor: '#ffffff' }}>
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f1f5f9' }}>
                  <Package className="w-5 h-5" style={{ color: '#64748b' }} />
                </div>
                <h3 className="text-xs font-black uppercase tracking-[0.3em]" style={{ color: '#16a34a' }}>
                  {t.billTo}
                </h3>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-black underline underline-offset-8" style={{ color: '#0f172a', textDecorationColor: '#dcfce7', textDecorationThickness: '4px' }}>{order.consumer?.full_name || 'গ্রাহক'}</p>
                <div className="pt-4 space-y-1">
                  <p className="text-sm leading-relaxed max-w-[280px] font-medium" style={{ color: '#64748b' }}>{order.address}</p>
                  {order.phone && <p className="text-sm font-bold mt-2" style={{ color: '#0f172a' }}>M: {order.phone}</p>}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="w-full max-w-[300px]">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center ml-auto" style={{ backgroundColor: '#f1f5f9' }}>
                    <MapPin className="w-5 h-5" style={{ color: '#64748b' }} />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-[0.3em]" style={{ color: '#16a34a' }}>
                    {t.sellerInfo}
                  </h3>
                </div>
                <div className="space-y-2 text-right">
                  {order.items && order.items.length > 0 && (
                    <>
                      <p className="text-2xl font-black" style={{ color: '#0f172a' }}>
                        {order.items[0].product?.farmer?.shop_name || order.items[0].product?.farmer?.full_name || 'বিক্রেতা'}
                      </p>
                      <p className="text-sm leading-relaxed font-medium ml-auto" style={{ color: '#64748b' }}>
                        {order.items[0].product?.farmer?.address || 'বাংলাদেশ'}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Items Table with Mission Control Style (Recipe 1) */}
          <div className="flex-grow relative z-10">
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: '#64748b' }}>{t.item}</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-center" style={{ color: '#64748b' }}>{t.quantity}</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-right" style={{ color: '#64748b' }}>{t.price}</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-right" style={{ color: '#64748b' }}>{t.total}</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item, idx) => (
                    <tr key={item.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td className="px-8 py-6">
                        <p className="font-black text-lg mb-1" style={{ color: '#0f172a' }}>{item.product?.name}</p>
                        <p className="text-[10px] font-bold tracking-widest uppercase italic" style={{ color: '#94a3b8' }}>{item.product?.category || 'Organic Produce'}</p>
                      </td>
                      <td className="px-8 py-6 text-center text-base font-mono font-bold" style={{ color: '#475569' }}>{item.quantity.toString().padStart(2, '0')}</td>
                      <td className="px-8 py-6 text-right text-base font-mono font-bold" style={{ color: '#475569' }}>৳{item.price_at_time}</td>
                      <td className="px-8 py-6 text-right text-lg font-black" style={{ color: '#16a34a' }}>৳{item.price_at_time * item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-16 mt-20 relative z-10">
            {/* Signature & QR Section */}
            <div className="flex gap-12 items-end">
              <div className="space-y-6">
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center" style={{ border: '2px dashed #e2e8f0' }}>
                   {/* Visual Placeholder for QR Code */}
                   <div className="grid grid-cols-4 gap-1 p-3">
                     {[...Array(16)].map((_, i) => (
                       <div key={i} className="w-2 h-2 rounded-[1px]" style={{ backgroundColor: Math.random() > 0.4 ? '#0f172a' : 'transparent' }}></div>
                     ))}
                   </div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest leading-loose" style={{ color: '#cbd5e1' }}>
                  Scan to verify<br />Original Digital Doc
                </p>
              </div>
              
              <div className="flex-grow pt-12">
                <div className="w-full h-[1px] mb-4" style={{ backgroundColor: '#0f172a' }}></div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: '#0f172a' }}>Authorized Signatory</p>
                <p className="text-[9px] font-bold italic mt-1" style={{ color: '#94a3b8' }}>KARUMART Digital Platform</p>
              </div>
            </div>

            {/* Total Summary with White Background as requested */}
            <div className="w-full max-w-[340px] ml-auto p-10 rounded-3xl" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#64748b' }}>{t.subtotal}</span>
                  <span className="text-lg font-mono font-bold" style={{ color: '#0f172a' }}>৳{order.subtotal || calculateSubtotal()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#64748b' }}>{t.deliveryCharge}</span>
                  <span className="text-lg font-mono font-bold" style={{ color: '#0f172a' }}>৳{order.delivery_fee || 0}</span>
                </div>

                {(order.discount_amount || 0) > 0 && (
                  <div className="flex justify-between items-center p-2 rounded-lg -mx-2" style={{ backgroundColor: '#f9fafb' }}>
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#ef4444' }}>{t.discount}</span>
                    <span className="text-lg font-mono font-bold" style={{ color: '#ef4444' }}>- ৳{order.discount_amount}</span>
                  </div>
                )}

                <div className="pt-6" style={{ borderTop: '2px solid #f1f5f9' }}>
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#16a34a' }}>Net Amount</p>
                      <p className="text-sm font-black italic tracking-widest" style={{ color: '#16a34a' }}>{t.grandTotal}</p>
                    </div>
                    <span className="text-4xl font-black" style={{ color: '#0f172a' }}>৳{order.total_amount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* New Professional Footer Section */}
          <div className="mt-20 pt-12 relative z-10" style={{ borderTop: '2px solid #f1f5f9' }}>
            <div className="grid grid-cols-2 gap-12 mb-16">
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: '#0f172a' }}>Terms & Integrity</h4>
                <ul className="space-y-2">
                  <li className="text-[10px] font-bold leading-relaxed" style={{ color: '#64748b' }}>
                    • This is a computer-generated invoice and requires no physical signature.
                  </li>
                  <li className="text-[10px] font-bold leading-relaxed" style={{ color: '#64748b' }}>
                    • Products are verified by Karumart quality assurance standards.
                  </li>
                </ul>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="flex items-center gap-2 mb-4">
                  <Sprout className="w-4 h-4" style={{ color: '#16a34a' }} />
                  <p className="text-[11px] font-black tracking-[0.3em] uppercase italic" style={{ color: '#0f172a' }}>Field to Table Integrity</p>
                </div>
                <p className="text-[10px] font-bold max-w-[280px] leading-relaxed" style={{ color: '#64748b' }}>
                  {t.helplineMessage}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center p-6 rounded-2xl" style={{ backgroundColor: '#f8fafc' }}>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#16a34a' }}></div>
                </div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: '#64748b' }}>
                  Doc Ver: 2.0.4 • {t.appName} Digital Logistics Group
                </p>
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: '#94a3b8' }}>
                Copyright &copy; {new Date().getFullYear()} • Secure Invoice
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
