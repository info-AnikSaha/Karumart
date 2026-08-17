import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ConsumerDashboard from './ConsumerDashboard';
import SellerDashboard from './SellerDashboard';
import AdminDashboard from './AdminDashboard';
import DeliveryDashboard from './DeliveryDashboard';

export default function Dashboard() {
  const { profile } = useAuth();

  if (!profile) return <div>লোড হচ্ছে...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-green-800">
        {profile.role === 'consumer' && 'ক্রেতা ড্যাশবোর্ড'}
        {profile.role === 'farmer' && 'বিক্রেতা ড্যাশবোর্ড'}
        {profile.role === 'admin' && 'অ্যাডমিন প্যানেল'}
        {profile.role === 'delivery_man' && 'ডেলিভারি ম্যান ড্যাশবোর্ড'}
      </h1>

      <Routes>
        <Route index element={
          profile.role === 'consumer' ? <ConsumerDashboard /> :
          profile.role === 'farmer' ? <SellerDashboard /> :
          profile.role === 'admin' ? <AdminDashboard /> :
          profile.role === 'delivery_man' ? <DeliveryDashboard /> :
          <Navigate to="/" />
        } />
      </Routes>
    </div>
  );
}
