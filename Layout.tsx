import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ShoppingCart, User, LogOut, Menu, X, ShieldCheck, Sprout, Search } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import AIChatbot from '@/components/AIChatbot';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { normalizeSearchQuery } from '@/lib/searchUtils';
import { getTranslatedCategory } from '@/lib/translations';
import karumartLogo from '@/assets/logo.jpg';
import { KarumartLogo } from '@/components/KarumartLogo';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, signOut } = useAuth();
  const { items } = useCart();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{type: 'product' | 'shop' | 'category', text: string}[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchData, setSearchData] = useState<{ products: string[], shops: string[], categories: string[] }>({ products: [], shops: [], categories: [] });

  useEffect(() => {
    const fetchSearchData = async () => {
      const { data: products } = await supabase.from('products').select('name, category');
      const { data: farmers } = await supabase.from('profiles').select('shop_name, full_name').eq('role', 'farmer');
      
      const productNames = Array.from(new Set(products?.map(p => p.name) || []));
      const categories = Array.from(new Set(products?.map(p => p.category) || []));
      const shopNames = Array.from(new Set(farmers?.map(f => f.shop_name || f.full_name).filter(Boolean) || []));

      setSearchData({ products: productNames, shops: shopNames as string[], categories });
    };

    fetchSearchData();
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const searchTerms = normalizeSearchQuery(searchQuery);
    const newSuggestions: {type: 'product' | 'shop' | 'category', text: string}[] = [];
    const seen = new Set<string>();

    // Suggest Categories
    searchData.categories.forEach(cat => {
      const translated = getTranslatedCategory(cat, t);
      if (searchTerms.some(term => translated.toLowerCase().includes(term.toLowerCase()) || cat.toLowerCase().includes(term.toLowerCase()))) {
        if (!seen.has(`category:${translated}`)) {
          newSuggestions.push({ type: 'category', text: translated });
          seen.add(`category:${translated}`);
        }
      }
    });

    // Suggest Products
    searchData.products.forEach(name => {
      if (searchTerms.some(term => name.toLowerCase().includes(term.toLowerCase()))) {
        if (!seen.has(`product:${name}`)) {
          newSuggestions.push({ type: 'product', text: name });
          seen.add(`product:${name}`);
        }
      }
    });

    // Suggest Shops
    searchData.shops.forEach(name => {
      if (searchTerms.some(term => name.toLowerCase().includes(term.toLowerCase()))) {
        if (!seen.has(`shop:${name}`)) {
          newSuggestions.push({ type: 'shop', text: name });
          seen.add(`shop:${name}`);
        }
      }
    });

    setSuggestions(newSuggestions.slice(0, 8));
  }, [searchQuery, searchData, t]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchQuery(params.get('q') || '');
  }, [location.search]);

  // Global shortcut: Ctrl + Shift + A to open Admin Panel / Admin Login
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        if (profile?.role === 'admin') {
          navigate('/dashboard');
          toast.success('অ্যাডমিন প্যানেলে প্রবেশ করা হয়েছে');
        } else {
          navigate('/admin/login');
          toast.info('অ্যাডমিন লগইন পেজে নেভিগেট করা হয়েছে');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, profile]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Save to search history (keep last 10 unique searches)
      try {
        const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        const updatedHistory = [searchQuery.trim(), ...history.filter((s: string) => s !== searchQuery.trim())].slice(0, 10);
        localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
      } catch (e) {
        console.error('Error saving search history:', e);
      }
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/');
    }
    setIsMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] font-sans text-[#1a1a1a]">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-green-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-3.5 group">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-white border-2 border-green-200 shadow-md flex items-center justify-center p-1 group-hover:scale-105 group-hover:border-green-500 transition-all">
                  <KarumartLogo className="w-full h-full" size="100%" />
                </div>
                <span className="text-2xl sm:text-3xl font-black text-green-700 tracking-tight group-hover:text-green-800 transition-colors">
                  {t.appName}
                </span>
              </Link>
            </div>

            <div className="flex items-center flex-1 max-w-2xl mx-4 lg:mx-8 hidden md:block relative">
              <form onSubmit={handleSearch} className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                  <Search className="text-gray-400 group-focus-within:text-green-600 w-5 h-5 transition-colors" />
                </div>
                <Input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  className="w-full pl-12 pr-4 py-6 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-base md:text-lg shadow-sm hover:shadow-md"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Button 
                    type="submit" 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700 rounded-xl px-4 py-2 h-9"
                  >
                    {t.search}
                  </Button>
                </div>
              </form>

              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 ring-1 ring-black/5"
                  >
                    <div className="p-2 bg-gray-50/50 border-b border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3">{t.suggestions}</p>
                    </div>
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        className="w-full px-5 py-3.5 text-left hover:bg-green-50 flex items-center justify-between group transition-colors border-b border-gray-50 last:border-none"
                        onClick={() => {
                          setSearchQuery(suggestion.text);
                          navigate(`/?q=${encodeURIComponent(suggestion.text)}`);
                          setShowSuggestions(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-gray-100 rounded-lg group-hover:bg-green-100 transition-colors">
                            <Search className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                          </div>
                          <span className="text-base font-medium text-gray-700 group-hover:text-green-700">{suggestion.text}</span>
                        </div>
                        <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 group-hover:bg-green-100 group-hover:text-green-600 border-none">
                          {suggestion.type === 'product' ? t.products : suggestion.type === 'shop' ? t.viewShop : t.category}
                        </Badge>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center space-x-8">
              <LanguageSwitcher />
              <Link to="/" className="hover:text-green-600 transition-colors">{t.home}</Link>
              
              <Link to="/cart" className="relative hover:text-green-600 transition-colors">
                <ShoppingCart className="w-6 h-6" />
                {items.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-green-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {items.reduce((acc, item) => acc + item.cartQuantity, 0)}
                  </span>
                )}
              </Link>

              {user ? (
                <>
                  <Link to="/dashboard" className="hover:text-green-600 transition-colors">{t.dashboard}</Link>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-600">{profile?.full_name}</span>
                    <Button variant="ghost" size="icon" onClick={handleSignOut}>
                      <LogOut className="w-5 h-5" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link to="/login">
                    <Button variant="ghost">{t.login}</Button>
                  </Link>
                  <Link to="/register">
                    <Button className="bg-green-600 hover:bg-green-700">{t.register}</Button>
                  </Link>
                </div>
              )}
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`p-2 rounded-full transition-colors ${isSearchOpen ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:text-green-600'}`}
              >
                <Search className="w-6 h-6" />
              </button>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 hover:text-green-600 p-2"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar (Toggled) */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-white border-b border-green-100 overflow-hidden relative"
            >
              <div className="px-4 py-4">
                <form onSubmit={handleSearch} className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    className="w-full pl-12 pr-4 py-6 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-base"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    autoFocus
                  />
                </form>

                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="mt-3 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden ring-1 ring-black/5"
                    >
                      <div className="p-2 bg-gray-50/50 border-b border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3">{t.suggestions}</p>
                      </div>
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          className="w-full px-5 py-4 text-left hover:bg-green-50 flex items-center justify-between group transition-colors border-b border-gray-50 last:border-none"
                          onClick={() => {
                            setSearchQuery(suggestion.text);
                            navigate(`/?q=${encodeURIComponent(suggestion.text)}`);
                            setShowSuggestions(false);
                            setIsSearchOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-gray-100 rounded-lg">
                              <Search className="w-4 h-4 text-gray-400" />
                            </div>
                            <span className="text-base font-medium text-gray-700">{suggestion.text}</span>
                          </div>
                          <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500">
                            {suggestion.type === 'product' ? t.products : suggestion.type === 'shop' ? t.viewShop : t.category}
                          </Badge>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-green-100 px-4 pt-2 pb-6 space-y-4">
            <div className="py-2 border-b border-gray-50">
              <LanguageSwitcher />
            </div>
            <Link to="/" className="block py-2 hover:text-green-600" onClick={() => setIsMenuOpen(false)}>{t.home}</Link>
            
            <Link to="/cart" className="flex items-center justify-between py-2 hover:text-green-600" onClick={() => setIsMenuOpen(false)}>
              <span>{t.cart}</span>
              {items.length > 0 && (
                <span className="bg-green-600 text-white text-[10px] font-bold rounded-full px-2 py-0.5">
                  {items.reduce((acc, item) => acc + item.cartQuantity, 0)}
                </span>
              )}
            </Link>

            {user ? (
              <>
                <Link to="/dashboard" className="block py-2 hover:text-green-600" onClick={() => setIsMenuOpen(false)}>{t.dashboard}</Link>
                <button onClick={handleSignOut} className="block w-full text-left py-2 text-red-600">{t.logout}</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block py-2 hover:text-green-600" onClick={() => setIsMenuOpen(false)}>{t.login}</Link>
                <Link to="/register" className="block py-2 hover:text-green-600" onClick={() => setIsMenuOpen(false)}>{t.register}</Link>
              </>
            )}
          </div>
        )}
      </header>

      <main className={`${location.pathname.startsWith('/dashboard') ? 'max-w-none px-2 sm:px-4 lg:px-6' : 'max-w-7xl px-3 sm:px-6 lg:px-8'} mx-auto py-4 md:py-8 transition-all duration-500`}>
        {children}
      </main>

      <footer className="bg-white border-t border-green-100 py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 opacity-95">
            <KarumartLogo size={44} className="w-11 h-11 border-2 border-green-200 bg-white p-1 rounded-xl shadow-xs" />
            <span className="font-black text-2xl text-green-700">{t.appName}</span>
          </div>
          <p className="text-gray-500 text-sm">© {new Date().getFullYear()} {t.appName}. {t.allRightsReserved}</p>
        </div>
      </footer>
      <AIChatbot />
      <Toaster />
    </div>
  );
};
