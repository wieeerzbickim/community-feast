-- Make product_id and order_id nullable in reviews table to support both product and producer reviews
ALTER TABLE public.reviews 
ALTER COLUMN product_id DROP NOT NULL,
ALTER COLUMN order_id DROP NOT NULL;

-- Add a check constraint to ensure we have either product_id (for product reviews) or both producer_id and no product_id (for producer reviews)
ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_type_check 
CHECK (
  (product_id IS NOT NULL AND producer_id IS NOT NULL) OR 
  (product_id IS NULL AND producer_id IS NOT NULL)
);

-- Add index for better performance on queries
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_producer_id ON public.reviews(producer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_consumer_id ON public.reviews(consumer_id);