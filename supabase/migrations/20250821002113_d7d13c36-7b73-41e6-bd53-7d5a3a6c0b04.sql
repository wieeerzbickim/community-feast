-- Add commission rate to admin settings if it doesn't exist
INSERT INTO admin_settings (key, value, description)
VALUES ('commission_rate', '5', 'Platform commission rate percentage')
ON CONFLICT (key) DO NOTHING;