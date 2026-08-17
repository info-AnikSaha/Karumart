import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Order } from '@/types';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Star, Loader2, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface RatingModalProps {
  order: Order;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function RatingModal({ order, trigger, onSuccess }: RatingModalProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Get product IDs associated with the order items
      const productIds = Array.from(
        new Set((order.items || []).map(item => item.product_id).filter(Boolean))
      );

      // Insert product reviews matching the reviews table schema (product_id, consumer_id, rating, comment)
      if (productIds.length > 0) {
        const reviewsToInsert = productIds.map(prodId => ({
          product_id: prodId,
          consumer_id: order.consumer_id,
          rating,
          comment: comment.trim() || undefined,
        }));

        const { error } = await supabase.from('reviews').insert(reviewsToInsert);
        if (error) {
          console.warn('Reviews table insert warning:', error.message);
        }
      }

      // 2. Identify the farmer/seller ID
      const farmerId =
        order.farmer_id ||
        order.farmer?.id ||
        order.items?.find(i => i.product?.farmer_id)?.product?.farmer_id ||
        order.items?.[0]?.product?.farmer_id;

      // 3. Update the seller's rating in profiles table
      if (farmerId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('rating, total_reviews')
          .eq('id', farmerId)
          .maybeSingle();

        const prevCount = profile?.total_reviews || 0;
        const prevRating = profile?.rating || 5;
        const newCount = prevCount + 1;
        const newRating = Number(((prevRating * prevCount + rating) / newCount).toFixed(1));

        await supabase
          .from('profiles')
          .update({
            rating: newRating,
            total_reviews: newCount,
          })
          .eq('id', farmerId);
      }

      toast.success(t.ratingSubmitSuccess);
      setOpen(false);
      setComment('');
      onSuccess?.();
    } catch (error: any) {
      console.error('Rating error:', error);
      toast.error(t.ratingSubmitError + ': ' + (error.message || 'Error'));
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
              className="h-8 text-[10px] text-green-600 border-green-100 hover:bg-green-50 gap-1.5 font-bold"
            >
              <Star className="w-3 h-3 fill-green-600" /> {t.giveRating}
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" /> {t.rateSeller}
          </DialogTitle>
          <DialogDescription>
            {t.rateExp}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform active:scale-90"
                >
                  <Star 
                    className={`w-10 h-10 ${
                      (hoveredRating || rating) >= star 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-gray-200 fill-gray-100'
                    }`} 
                  />
                </button>
              ))}
            </div>
            <p className="text-sm font-bold text-gray-500 bg-gray-50 px-4 py-1 rounded-full border">
               {rating === 5 ? t.ratingExcellent :
                rating === 4 ? t.ratingGood :
                rating === 3 ? t.ratingAverage :
                rating === 2 ? t.ratingPoor : t.ratingVeryPoor}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
              <MessageSquare className="w-3 h-3" /> {t.optionalComment}
            </Label>
            <Textarea 
              placeholder={t.shareExp} 
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 h-12 text-base font-bold shadow-lg shadow-green-100">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                t.submitRating
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
