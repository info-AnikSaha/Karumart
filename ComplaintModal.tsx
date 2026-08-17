import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Order, Complaint } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { AlertCircle, Camera, CheckCircle2, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ComplaintModalProps {
  order: Order;
  trigger?: React.ReactNode;
}

export function ComplaintModal({ order, trigger }: ComplaintModalProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'refund' | 'replacement' | 'quality_issue'>('quality_issue');
  const [reason, setReason] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const newUrls = [...imageUrls];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `complaint-${order.id}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('complaints')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('complaints')
          .getPublicUrl(filePath);
        
        newUrls.push(publicUrl);
      }
      setImageUrls(newUrls);
      toast.success('ছবি আপলোড সফল হয়েছে');
    } catch (error: any) {
      toast.error('ছবি আপলোড করতে সমস্যা হয়েছে: ' + error.message);
    } finally {
      setUploadingImages(false);
    }
  };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!reason) {
        toast.error(t.enterComplaintReason);
        return;
      }
  
      setLoading(true);
      try {
        const { error } = await supabase.from('complaints').insert({
          order_id: order.id,
          user_id: order.consumer_id,
          type,
          reason,
          images: imageUrls,
          status: 'pending',
        });
  
        if (error) throw error;
  
        toast.success(t.complaintSubmitSuccess);
        setOpen(false);
        setReason('');
        setImageUrls([]);
      } catch (error: any) {
        toast.error(t.complaintSubmitError + ': ' + error.message);
      } finally {
        setLoading(false);
      }
    };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={(triggerProps) => 
          trigger ? (
            React.cloneElement(trigger as React.ReactElement, triggerProps)
          ) : (
            <Button
              {...triggerProps}
              variant="outline"
              size="sm"
              className="h-8 text-[10px] text-red-600 border-red-100 hover:bg-red-50 gap-1.5 font-bold"
            >
              <AlertCircle className="w-3 h-3" /> {t.reportIssue}
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" /> {t.complaintAndRefund}
          </DialogTitle>
          <DialogDescription>
            {t.complaintDesc}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-500 uppercase">{t.complaintType}</Label>
            <Select value={type} onValueChange={(val: any) => setType(val)}>
              <SelectTrigger>
                <SelectValue placeholder={t.selectType} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quality_issue">{t.qualityIssue}</SelectItem>
                <SelectItem value="replacement">{t.replacement}</SelectItem>
                <SelectItem value="refund">{t.refund}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-500 uppercase">{t.complaintReason}</Label>
            <Textarea 
              placeholder={t.writeReason} 
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-bold text-gray-500 uppercase">{t.proofImages}</Label>
            <div className="grid grid-cols-4 gap-2">
              {imageUrls.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border">
                  <img src={url} alt="Proof" className="w-full h-full object-cover" />
                </div>
              ))}
              <Label className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                <Camera className="w-5 h-5 text-gray-400 mb-1" />
                <span className="text-[10px] text-gray-400">{t.upload}</span>
                <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
              </Label>
            </div>
            {uploadingImages && <p className="text-[10px] text-blue-500 animate-pulse">{t.uploading}</p>}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading || uploadingImages} className="w-full bg-red-600 hover:bg-red-700 h-12 text-base font-bold shadow-lg shadow-red-100">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                t.reportIssue
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
