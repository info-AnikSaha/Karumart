export type UserRole = 'consumer' | 'farmer' | 'admin' | 'delivery_man';
export type FarmerStatus = 'pending' | 'approved' | 'rejected';
export type ShopStatus = 'open' | 'closed_temporary' | 'closed_permanent';
export type OrderStatus = 'pending' | 'confirmed' | 'picked_up' | 'on_the_way' | 'delivered' | 'cancelled' | 'return_requested' | 'return_picked_up' | 'returned';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  status?: FarmerStatus;
  shop_status?: ShopStatus;
  full_name: string;
  shop_name?: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  cover_url?: string;
  is_frozen?: boolean;
  badge_best_seller?: boolean;
  badge_official?: boolean;
  badge_krishi_mall?: boolean;
  rating?: number;
  total_reviews?: number;
  created_at: string;
}

export interface Product {
  id: string;
  farmer_id: string;
  sku?: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  image_url: string;
  description: string;
  is_approved: boolean;
  flash_sale_active?: boolean;
  flash_sale_price?: number;
  created_at: string;
  farmer?: Profile;
}

export interface Order {
  id: string;
  consumer_id: string;
  farmer_id?: string;
  total_amount: number;
  subtotal?: number;
  delivery_fee?: number;
  discount_amount?: number;
  voucher_code?: string;
  status: OrderStatus;
  payment_status?: 'pending' | 'paid' | 'failed';
  payment_method?: 'cod' | 'bkash' | 'nagad' | 'card';
  transaction_id?: string;
  delivery_man_id?: string;
  address: string;
  phone: string;
  created_at: string;
  consumer?: Profile;
  delivery_man?: Profile;
  farmer?: Profile;
  items?: OrderItem[];
}

export interface Voucher {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  value: number;
  min_purchase: number;
  expiry_date: string;
  is_active: boolean;
  created_at: string;
}

export interface Complaint {
  id: string;
  order_id: string;
  user_id: string;
  type: 'refund' | 'replacement' | 'quality_issue';
  reason: string;
  status: 'pending' | 'in_review' | 'resolved' | 'rejected';
  images?: string[];
  created_at: string;
  order?: Order;
  consumer?: Profile;
}

export interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  target_id: string;
  details: string;
  created_at: string;
  admin?: Profile;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_time: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  product?: Product;
}

export interface Review {
  id: string;
  product_id: string;
  consumer_id: string;
  rating: number;
  comment: string;
  created_at: string;
  consumer?: Profile;
}

export interface Banner {
  id: string;
  image_url: string;
  title?: string;
  subtitle?: string;
  link_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface StaticBanner {
  id: string;
  image_url: string;
  link_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface SidePromoBanner {
  id: string;
  image_url: string;
  link_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface Wishlist {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}
