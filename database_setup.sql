-- Database Setup SQL for Karumart
-- Run these commands in your Supabase SQL Editor

-- 1. Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'consumer', -- 'consumer', 'farmer', 'delivery', 'admin'
  phone TEXT,
  address TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected' (for farmers)
  shop_name TEXT,
  shop_description TEXT,
  shop_status TEXT DEFAULT 'open', -- 'open', 'closed_temporary', 'closed_permanent'
  avatar_url TEXT,
  is_frozen BOOLEAN DEFAULT false,
  badge_best_seller BOOLEAN DEFAULT false,
  badge_official BOOLEAN DEFAULT false,
  badge_krishi_mall BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'Kg',
  category TEXT,
  image_url TEXT,
  is_approved BOOLEAN DEFAULT false,
  sku TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consumer_id UUID REFERENCES profiles(id),
  total_amount DECIMAL NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
  payment_method TEXT DEFAULT 'cod', -- 'cod', 'bkash', 'nagad'
  payment_status TEXT DEFAULT 'unpaid', -- 'paid', 'unpaid'
  transaction_id TEXT,
  address TEXT,
  phone TEXT,
  delivery_man_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Order Items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price_at_time DECIMAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Banners table
CREATE TABLE IF NOT EXISTS banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  link_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Static Banners table
CREATE TABLE IF NOT EXISTS static_banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  link_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Vouchers table
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT DEFAULT 'percentage', -- 'percentage', 'fixed'
  value DECIMAL NOT NULL,
  min_purchase DECIMAL DEFAULT 0,
  expiry_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Complaints table
CREATE TABLE IF NOT EXISTS complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  order_id UUID REFERENCES orders(id),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'in_review', 'resolved', 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Admin Logs table
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  target_id TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Site Settings table (THE ONE CAUSING THE ERROR)
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY, -- usually 'site_config'
  hotline TEXT,
  email TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial site config if it doesn't exist
INSERT INTO site_settings (id, hotline, email)
VALUES ('site_config', '+880123456789', 'support@karumart.com')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS (Row Level Security) - Basic Setup
-- Note: Adjust policies based on your needs
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE static_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Simple public read policies for testing (Harden these for production!)
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public read banners" ON banners FOR SELECT USING (true);
CREATE POLICY "Public read static_banners" ON static_banners FOR SELECT USING (true);
CREATE POLICY "Public read site_settings" ON site_settings FOR SELECT USING (true);

-- Allow authenticated users to insert orders
CREATE POLICY "Auth insert orders" ON orders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
