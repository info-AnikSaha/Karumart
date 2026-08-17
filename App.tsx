import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Pages (to be created)
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import AdminLogin from '@/pages/AdminLogin';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard/index';
import ProductDetail from '@/pages/ProductDetail';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import ShopDetail from '@/pages/ShopDetail';

function AdminRouteRedirect() {
  const { profile } = useAuth();
  if (profile?.role === 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return <AdminLogin />;
}

export default function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin" element={<AdminRouteRedirect />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/register" element={<Register />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/shop/:id" element={<ShopDetail />} />
                <Route path="/seller/:id" element={<ShopDetail />} />
                <Route path="/farmer/:id" element={<ShopDetail />} />
                <Route path="/cart" element={<Cart />} />
                
                <Route 
                  path="/checkout" 
                  element={
                    <ProtectedRoute allowedRoles={['consumer']}>
                      <Checkout />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/dashboard/*" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </Layout>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}
