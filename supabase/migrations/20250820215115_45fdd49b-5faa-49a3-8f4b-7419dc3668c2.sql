
-- Fix FK on products.producer_id to reference user_profiles.id instead of producer_profiles.id

BEGIN;

-- Drop existing foreign key constraint if it exists
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_producer_id_fkey;

-- Add new foreign key referencing user_profiles(id)
ALTER TABLE public.products
  ADD CONSTRAINT products_producer_id_fkey
  FOREIGN KEY (producer_id)
  REFERENCES public.user_profiles(id)
  ON UPDATE CASCADE
  ON DELETE CASCADE;

COMMIT;
