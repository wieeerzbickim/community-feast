-- Fix RLS policy for products table to allow producers to insert their own products
DROP POLICY IF EXISTS "Producers can manage own products" ON public.products;

-- Create a more explicit policy for INSERT operations
CREATE POLICY "Producers can insert own products" 
ON public.products 
FOR INSERT 
WITH CHECK (
  auth.uid() = producer_id 
  AND EXISTS (
    SELECT 1 FROM producer_profiles 
    WHERE id = auth.uid()
  )
);

-- Create a policy for SELECT operations
CREATE POLICY "Producers can view own products" 
ON public.products 
FOR SELECT 
USING (
  producer_id = auth.uid()
  OR TRUE -- Anyone can view products (for marketplace)
);

-- Create a policy for UPDATE operations
CREATE POLICY "Producers can update own products" 
ON public.products 
FOR UPDATE 
USING (
  producer_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM producer_profiles 
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  producer_id = auth.uid()
);

-- Create a policy for DELETE operations
CREATE POLICY "Producers can delete own products" 
ON public.products 
FOR DELETE 
USING (
  producer_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM producer_profiles 
    WHERE id = auth.uid()
  )
);