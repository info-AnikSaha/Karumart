-- Supabase Database Schema for KaruMart
-- Copy and paste this script into your Supabase SQL Editor and click "Run" to create all the tables.
-- This schema matches the Drizzle ORM model defined in your app's codebase.

-- 1. Create the Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    uid TEXT NOT NULL UNIQUE, -- Firebase Auth UID / JWT UID
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'buyer', -- 'buyer', 'artisan', 'admin'
    district TEXT,
    phone TEXT,
    password TEXT,
    shop_name TEXT,
    shop_address TEXT,
    shop_status TEXT NOT NULL DEFAULT 'active',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_shop_verified BOOLEAN NOT NULL DEFAULT TRUE,
    verification_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Create the Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    price INTEGER NOT NULL,
    original_price INTEGER,
    discount INTEGER,
    rating REAL DEFAULT 4.5,
    reviews INTEGER DEFAULT 0,
    image TEXT NOT NULL,
    origin TEXT NOT NULL,
    artisan TEXT NOT NULL,
    description TEXT,
    stock INTEGER NOT NULL DEFAULT 5,
    is_karu_mall BOOLEAN NOT NULL DEFAULT FALSE,
    sku TEXT,
    artisan_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_approved BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Create the Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    buyer_name TEXT NOT NULL,
    buyer_phone TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'cod', -- 'cod', 'bkash', etc.
    total_amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'cancelled'
    tracking_id TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. Create the Order Items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    price INTEGER NOT NULL -- Historical price at purchase time
);

-- 5. Add performance indexes for faster lookup
CREATE INDEX IF NOT EXISTS idx_products_artisan_id ON products(artisan_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_id ON orders(tracking_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
