import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { UserRole } from '@/types';
import { ShoppingBag, Store, Truck, ShieldCheck } from 'lucide-react';

export default function Register() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('consumer');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error(t.registerFailed);

      // 2. Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role,
        status: role === 'farmer' ? 'pending' : 'approved',
      });

      if (profileError) throw profileError;

      toast.success(t.registerSuccess);
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || t.registerFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[85vh] py-8 px-4">
      <Card className="w-full max-w-lg shadow-lg border-gray-100 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100/50 pb-6">
          <CardTitle className="text-2xl font-black text-center text-green-800 tracking-tight">
            {t.register}
          </CardTitle>
          <p className="text-xs text-center text-gray-500 mt-1 font-medium">
            {role === 'consumer' && (t.joinAsConsumer || 'ক্রেতা অ্যাকাউন্ট')}
            {role === 'farmer' && (t.joinAsSeller || 'বিক্রেতা হিসেবে যোগ দিন')}
            {role === 'delivery_man' && (t.joinAsDeliveryMan || 'ডেলিভারি ম্যান হিসেবে যোগ দিন')}
          </p>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Top Account Type Buttons */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
              {t.registerAs}
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('consumer')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  role === 'consumer'
                    ? 'border-green-600 bg-green-50 text-green-700 font-bold shadow-sm'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                }`}
              >
                <ShoppingBag className="w-5 h-5 mb-1 text-green-600" />
                <span className="text-xs">{t.consumer}</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('farmer')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  role === 'farmer'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-bold shadow-sm'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                }`}
              >
                <Store className="w-5 h-5 mb-1 text-emerald-600" />
                <span className="text-xs">{t.seller}</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('delivery_man')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  role === 'delivery_man'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-sm'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                }`}
              >
                <Truck className="w-5 h-5 mb-1 text-blue-600" />
                <span className="text-xs">{t.deliveryMan}</span>
              </button>
            </div>

            {role === 'farmer' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 mt-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 font-medium">
                  {t.farmerApprovalNotice}
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t.fullName}</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-11 rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t.password}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 font-bold h-12 rounded-xl text-base shadow-sm mt-2"
              disabled={loading}
            >
              {loading ? `${t.pending}...` : t.register}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t border-gray-100 py-4 bg-gray-50/50">
          <Link to="/login" className="text-sm font-semibold text-green-600 hover:underline">
            {t.alreadyHaveAccount}
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

