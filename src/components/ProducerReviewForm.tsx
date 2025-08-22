import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Star } from 'lucide-react';

interface ProducerReviewFormProps {
  producerId: string;
  onReviewSubmitted: () => void;
}

const ProducerReviewForm: React.FC<ProducerReviewFormProps> = ({ producerId, onReviewSubmitted }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: t('common.error'),
        description: t('common.mustBeLoggedIn'),
        variant: "destructive",
      });
      return;
    }

    if (rating === 0) {
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
          producer_id: producerId,
          consumer_id: user.id,
          rating,
          comment: comment.trim() || null,
        });

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('common.producerReviewSubmitted'),
      });

      setRating(0);
      setComment('');
      onReviewSubmitted();
    } catch (error) {
      console.error('Error submitting producer review:', error);
      toast({
        title: t('common.error'),
        description: t('common.failedToSubmit'),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('reviews.rateProducer')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t('reviews.pleaseLogInToRate')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('reviews.rateProducer')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">{t('reviews.rating')}</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
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
              placeholder={t('common.shareExperienceWithProducer')}
              rows={3}
            />
          </div>

          <Button type="submit" disabled={submitting || rating === 0}>
            {submitting ? t('common.submitting') : t('common.submit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProducerReviewForm;