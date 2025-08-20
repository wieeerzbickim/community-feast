-- Fix products RLS to not require an existing producer_profiles row
DROP POLICY IF EXISTS "Producers can insert own products" ON public.products;
DROP POLICY IF EXISTS "Producers can update own products" ON public.products;
DROP POLICY IF EXISTS "Producers can delete own products" ON public.products;

CREATE POLICY "Producers (role) can insert own products"
ON public.products
FOR INSERT
WITH CHECK (
  auth.uid() = producer_id
  AND EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role IN ('producer','admin')
  )
);

CREATE POLICY "Producers (role) can update own products"
ON public.products
FOR UPDATE
USING (
  producer_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role IN ('producer','admin')
  )
)
WITH CHECK (
  producer_id = auth.uid()
);

CREATE POLICY "Producers (role) can delete own products"
ON public.products
FOR DELETE
USING (
  producer_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role IN ('producer','admin')
  )
);