import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { translations } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { ShieldCheck, Lock } from 'lucide-react';

const t = translations.bn;

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Check if the user is actually an admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      if (profile.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('আপনার কাছে অ্যাডমিন প্যানেলে প্রবেশের অনুমতি নেই।');
      }

      toast.success('অ্যাডমিন লগইন সফল হয়েছে');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'লগইন ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[70vh] bg-gray-50 p-4">
      <Card className="w-full max-w-md border-t-4 border-t-red-600 shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-red-50 rounded-full">
              <ShieldCheck className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">অ্যাডমিন লগইন</CardTitle>
          <p className="text-sm text-gray-500">শুধুমাত্র অনুমোদিত অ্যাডমিনদের জন্য</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                অ্যাডমিন ইমেইল
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@karumart.com"
                  className="pl-10"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <span className="text-sm">@</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">পাসওয়ার্ড</Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={loading}>
              {loading ? 'যাচাই করা হচ্ছে...' : 'অ্যাডমিন হিসেবে প্রবেশ করুন'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center">
          <Link to="/login" className="text-sm text-gray-600 hover:text-green-600">
            সাধারণ ব্যবহারকারী লগইন
          </Link>
          <p className="text-[10px] text-gray-400">
            নিরাপত্তার স্বার্থে আপনার লগইন তথ্য গোপন রাখুন।
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
