import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { UserRole } from '@/types';
import { ShoppingBag, Store, Truck } from 'lucide-react';

export default function Login() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('consumer');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Attempt to sign in
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error(t.invalidLogin);
        }
        throw error;
      }

      if (data.user) {
        // 2. Verify if the user role matches the selected role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

          if (profileError) {
            if (profileError.code === 'PGRST116') {
              // Profile not found, sign out
              await supabase.auth.signOut();
              throw new Error(t.profileNotFound);
            }
            throw profileError;
          }

          if (profile.role !== role) {
            await supabase.auth.signOut();
            throw new Error(t.roleMismatch);
          }
        }

        toast.success(t.loginSuccess);
        navigate(from, { replace: true });
      } catch (error: any) {
        toast.error(error.message || t.loginFailed);
      } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[75vh] py-8 px-4">
      <Card className="w-full max-w-md shadow-lg border-gray-100 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100/50 pb-6">
          <CardTitle className="text-2xl font-black text-center text-green-800 tracking-tight">{t.login}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-5">
          <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 shadow-sm leading-relaxed">
            <p className="font-bold text-amber-800 mb-1 flex items-center gap-1.5">{t.warning}</p>
            {t.loginNotice}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">{t.loginAs}</Label>
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
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="example@mail.com"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t.password}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 rounded-xl"
              />
            </div>
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 font-bold h-12 rounded-xl text-base shadow-sm mt-2" disabled={loading}>
              {loading ? `${t.pending}...` : t.login}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center border-t border-gray-100 py-4 bg-gray-50/50">
          <Link to="/register" className="text-sm font-semibold text-green-600 hover:underline">
            {t.dontHaveAccount}
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
