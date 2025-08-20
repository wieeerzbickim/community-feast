-- Fix foreign key: point reviews.producer_id to user_profiles(id) instead of producer_profiles(id)
DO $$
BEGIN
  -- Drop existing FK if exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'reviews_producer_id_fkey' 
      AND table_name = 'reviews'
  ) THEN
    ALTER TABLE public.reviews DROP CONSTRAINT reviews_producer_id_fkey;
  END IF;
END $$;

-- Recreate FK to user_profiles
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_producer_id_fkey
  FOREIGN KEY (producer_id)
  REFERENCES public.user_profiles(id)
  ON UPDATE CASCADE
  ON DELETE RESTRICT;