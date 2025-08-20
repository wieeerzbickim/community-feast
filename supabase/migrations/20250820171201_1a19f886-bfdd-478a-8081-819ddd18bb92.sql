-- Create admin user directly in auth.users and user_profiles
-- First, let's insert a default admin user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token,
  phone_change_token,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@localharvest.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  '',
  '',
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "System Administrator"}',
  false,
  null,
  null,
  '',
  '',
  '',
  0,
  null,
  '',
  null,
  false,
  null
) ON CONFLICT (email) DO NOTHING;

-- Insert corresponding user profile with admin role
INSERT INTO user_profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
) 
SELECT 
  id,
  'admin@localharvest.com',
  'System Administrator',
  'admin',
  now(),
  now()
FROM auth.users 
WHERE email = 'admin@localharvest.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Initialize admin settings
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