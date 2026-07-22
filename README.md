# KARUMART Admin Panel

A modern React admin dashboard for the KARUMART D2C e-commerce platform, built with React 18, Tailwind CSS, and Supabase.

## Features

- **Dashboard**: Revenue overview, stats, charts (line, pie, bar), recent orders, top products
- **User Management**: Full CRUD for users (admins, sellers, buyers, logistics handlers)
- **Product Management**: Full CRUD for products with category filtering
- **Order Management**: Track orders, view details, update status
- **Category Management**: Organize products into categories
- **Settings**: General settings, appearance, notifications, security

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

```powershell
# 1. Navigate to project folder
cd karumart-admin

# 2. Install dependencies
npm install

# 3. Copy environment file
Copy-Item .env.example .env

# 4. Update .env with your Supabase credentials

# 5. Start development server
npm run dev
```

### Supabase Setup

Create these tables in your Supabase SQL Editor:

```sql
-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT CHECK (role IN ('admin', 'seller', 'buyer', 'logistics')) DEFAULT 'buyer',
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  stock INTEGER DEFAULT 0,
  image_url TEXT,
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  seller_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders, order tracking & automatic order-number generation
-- The full, authoritative schema lives in:
--   supabase/migrations/0001_orders_tracking.sql
-- Run that file in the Supabase SQL editor. It creates the order_status enum,
-- the orders table (uuid id, auto-generated order_number KM-YYMMDD-NNNN via a
-- BEFORE INSERT trigger), the order_status_history audit trail, Realtime
-- publication, and Row Level Security. Summary of the orders table:
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE,            -- auto: KM-YYMMDD-NNNN (DB trigger)
  customer_id UUID REFERENCES profiles(id),
  customer_name TEXT, customer_email TEXT, customer_phone TEXT,
  shipping_address TEXT,
  items JSONB NOT NULL DEFAULT '[]',   -- [{ product_id, name, quantity, price }]
  subtotal DECIMAL(10,2), shipping_fee DECIMAL(10,2), total_amount DECIMAL(10,2),
  status order_status DEFAULT 'pending',
  payment_method TEXT, payment_status TEXT DEFAULT 'unpaid',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Orders, tracking & profile dashboards

- **Automatic order IDs** — every order gets a unique, human-readable
  `KM-YYMMDD-NNNN` number (daily-reset sequence) assigned race-safely by a
  Postgres trigger. See `supabase/migrations/0001_orders_tracking.sql`.
- **Real-time tracking** — order status lifecycle
  (`pending → confirmed → processing → shipped → out_for_delivery → delivered`,
  plus `cancelled`/`returned`) with a full audit trail in `order_status_history`,
  pushed live to the UI via Supabase Realtime (`src/hooks/useRealtimeOrders.js`,
  `src/hooks/useOrderTracking.js`).
- **User profile dashboard** — admin user-detail page at `/users/:id`
  (`src/pages/UserProfile.jsx`); the customer-facing dashboard design is in
  `docs/user-profile-dashboard-architecture.md`.

## Tech Stack

- **React 18** - UI Framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router v6** - Routing
- **Supabase** - Backend/Database
- **Recharts** - Charts
- **Lucide React** - Icons

## Team Collaboration

### Sharing with your teammate

1. **Initialize Git repository**:
```powershell
cd karumart-admin
git init
git add .
git commit -m "Initial commit: Admin panel setup"
```

2. **Create GitHub repository** and push:
```powershell
git remote add origin https://github.com/YOUR-USERNAME/karumart-admin.git
git branch -M main
git push -u origin main
```

3. **Share the repository link** with your teammate

### What your teammate needs to start working

1. Node.js 18+ installed
2. Git installed
3. Supabase account access
4. A copy of the project requirements (KARUMART412 PDF)
5. API keys for Supabase (shared separately, not in git)

### What you need to ask from your teammate

1. Which specific features/modules will they build?
2. What Supabase credentials do they have?
3. Their Git username to add as collaborator
4. Preferred communication channel (WhatsApp/Teams/Discord)
5. Timeline and milestone deadlines

## Project Structure

```
karumart-admin/
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   └── Sidebar.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Users.jsx
│   │   ├── Products.jsx
│   │   ├── Orders.jsx
│   │   ├── Categories.jsx
│   │   ├── Settings.jsx
│   │   └── Login.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── lib/
│   │   └── supabase.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── .env.example
```

## Key RBAC Roles (from project spec)

- **Admin** - Full access (your role)
- **Seller** - Manages own products and inventory
- **Buyer** - Browses and purchases products
- **Logistics** - Handles delivery and tracking

## License

University Course Project - KARUMART
