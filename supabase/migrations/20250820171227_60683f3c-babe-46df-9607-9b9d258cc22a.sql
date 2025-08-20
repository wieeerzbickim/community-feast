-- Initialize admin settings for platform configuration
INSERT INTO admin_settings (key, value, description) VALUES 
('transaction_fee_percent', '12', 'Platform transaction fee percentage'),
('listing_fee_enabled', 'false', 'Whether listing fees are enabled'),
('listing_fee_amount', '2.00', 'Fee charged per product listing'),
('platform_name', 'LocalHarvest Hub', 'Name of the platform'),
('support_email', 'support@localharvest.com', 'Support contact email'),
('max_delivery_radius', '25', 'Maximum delivery radius in miles'),
('currency', 'USD', 'Platform currency'),
('maintenance_mode', 'false', 'Platform maintenance mode')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = now();

-- Function to promote a user to admin (can be called manually)
CREATE OR REPLACE FUNCTION promote_user_to_admin(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_profiles 
  SET role = 'admin', updated_at = now()
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
END;
$$;