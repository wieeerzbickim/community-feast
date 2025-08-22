import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Star } from 'lucide-react';

interface ReviewFormProps {
  orderId: string;
  productId: string;
  producerId: string;
  onReviewSubmitted: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  orderId,
  productId,
  producerId,
  onReviewSubmitted
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitReview = async () => {
    if (!user || rating === 0) {
      toast({
        title: t('common.error'),
        description: t('common.selectRating'),
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          consumer_id: user.id,
          producer_id: producerId,
          product_id: productId,
          order_id: orderId,
          rating,
          comment: comment.trim() || null
        });

      if (error) throw error;

      // Update producer's average rating
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('producer_id', producerId);

      if (reviews) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        await supabase
          .from('producer_profiles')
          .update({
            rating: avgRating,
            review_count: reviews.length
          })
          .eq('id', producerId);
      }

      toast({
        title: t('common.reviewSubmitted'),
        description: t('common.thankYouForFeedback'),
      });

      onReviewSubmitted();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('reviews.leaveReview')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">{t('reviews.rating')}</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1 hover:scale-110 transition-transform"
              >
                <Star
                  className={`h-6 w-6 ${
                    star <= rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300 hover:text-yellow-400'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">{t('reviews.comment')} ({t('common.optional')})</label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('common.shareExperienceWithProduct')}
            rows={3}
          />
        </div>

        <Button
          onClick={submitReview}
          disabled={rating === 0 || submitting}
          className="w-full"
        >
          {submitting ? t('common.submitting') : t('common.submit')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ReviewForm;