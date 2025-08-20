import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit a review",
        variant: "destructive",
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Error",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // First create a dummy order for the review (required by schema)
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          consumer_id: user.id,
          producer_id: producerId,
          total_amount: 0,
          status: 'completed',
          delivery_method: 'pickup'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // For producer reviews, we need a product_id. Let's get any product from this producer
      let productId;
      const { data: producerProduct } = await supabase
        .from('products')
        .select('id')
        .eq('producer_id', producerId)
        .limit(1)
        .maybeSingle();

      if (producerProduct) {
        productId = producerProduct.id;
      } else {
        // Create a dummy product for this producer review
        const { data: dummyProduct, error: dummyProductError } = await supabase
          .from('products')
          .insert({
            name: 'Producer Review',
            price: 0,
            producer_id: producerId,
            is_available: false,
            stock_quantity: 0
          })
          .select()
          .single();

        if (dummyProductError) throw dummyProductError;
        productId = dummyProduct.id;
      }

      const { error } = await supabase
        .from('reviews')
        .insert({
          producer_id: producerId,
          consumer_id: user.id,
          product_id: productId,
          order_id: orderData.id,
          rating,
          comment: comment.trim() || null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your producer review has been submitted",
      });

      setRating(0);
      setComment('');
      onReviewSubmitted();
    } catch (error) {
      console.error('Error submitting producer review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review",
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
          <CardTitle>Rate this Producer</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please log in to rate the producer.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate this Producer</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Rating</label>
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
            <label className="text-sm font-medium mb-2 block">Comment (optional)</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this producer..."
              rows={3}
            />
          </div>

          <Button type="submit" disabled={submitting || rating === 0}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProducerReviewForm;