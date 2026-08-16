import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User, Loader2, Minimize2 } from 'lucide-react';
import { chatWithSupport } from '@/services/geminiService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';

import { useLanguage } from '@/contexts/LanguageContext';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export default function AIChatbot() {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      role: 'model', 
      text: t.chatWelcome
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [productContext, setProductContext] = useState('');
  const [siteSettings, setSiteSettings] = useState({ 
    hotline: '+880123456789', 
    email: 'support@karumart.com' 
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchSettingsAndProducts = async () => {
      try {
        // Fetch Settings
        const { data: settings } = await supabase
          .from('site_settings')
          .select('hotline, email')
          .eq('id', 'site_config')
          .single();
        if (settings) setSiteSettings(settings);

        // Fetch Products with Farmer info for context (Matches Home.tsx logic)
        const { data: products } = await supabase
          .from('products')
          .select(`
            name,
            price,
            quantity,
            farmer:profiles!inner(shop_name, full_name, shop_status)
          `)
          .eq('is_approved', true)
          .eq('farmer.shop_status', 'open')
          .limit(50);

        if (products) {
          const context = (products as any[]).map(p => {
            const farmer = Array.isArray(p.farmer) ? p.farmer[0] : p.farmer;
            return `- ${p.name}: ৳${p.price}, Stock: ${p.quantity}, Seller: ${farmer?.shop_name || farmer?.full_name || 'Generic'}`;
          }).join('\n');
          setProductContext(context);
        }
      } catch (e) {
        console.error('Error fetching chat context:', e);
      }
    };
    fetchSettingsAndProducts();
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Gemini expects strictly alternating roles: user -> model -> user.
      // The history passed to startChat must end with a 'model' response for sendMessage to work.
      let historyMessages = messages.filter(m => m.id !== '1');
      
      // Ensure we only have complete pairs or history ends with model
      if (historyMessages.length > 0) {
        // If it starts with model, drop it
        if (historyMessages[0].role === 'model') {
          historyMessages = historyMessages.slice(1);
        }
        
        // If it ends with user, drop it (history must end with model before sendMessage)
        if (historyMessages.length > 0 && historyMessages[historyMessages.length - 1].role === 'user') {
          historyMessages = historyMessages.slice(0, -1);
        }
      }

      // Map to Gemini format
      const history = historyMessages.slice(-10).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseText = await chatWithSupport(history, userMessage.text, siteSettings, productContext);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error: any) {
      console.error("Chat Error Detailed:", error);
      let errorText = t.chatError;
      
      if (error?.message?.includes('429')) {
        errorText = language === 'bn' 
          ? "দুঃখিত, আপনি খুব দ্রুত মেসেজ পাঠাচ্ছেন। দয়া করে এক মিনিট অপেক্ষা করে আবার চেষ্টা করুন।" 
          : "Sorry, you are sending messages too fast. Please wait a minute and try again.";
      } else if (error?.message?.includes('API Key missing')) {
        errorText = language === 'bn'
          ? "এপিআই কি (API Key) পাওয়া যাচ্ছে না। নেটলিফাইতে VITE_GEMINI_API_KEY সেট করতে হবে।"
          : "API Key missing. VITE_GEMINI_API_KEY must be set in Netlify.";
      } else if (error?.message?.includes('403')) {
        errorText = language === 'bn'
          ? "আপনার এপিআই কি-টি সঠিক নয় অথবা এটি কাজ করছে না। দয়া করে নতুন একটি কি তৈরি করুন।"
          : "Invalid API Key or forbidden access. Please create a new key.";
      } else {
        // Show actual error message if it's unknown
        errorText = language === 'bn' 
          ? `দুঃখিত, একটি সমস্যা হয়েছে: ${error?.message || 'Unknown Error'}`
          : `Sorry, an error occurred: ${error?.message || 'Unknown Error'}`;
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: errorText
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-20 right-4 sm:bottom-6 sm:right-6 w-14 h-14 bg-green-600 text-white rounded-full shadow-2xl flex items-center justify-center z-[9999] ${isOpen ? 'hidden' : 'flex'}`}
      >
        <MessageSquare className="w-6 h-6" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[400px] h-full sm:h-[600px] sm:max-h-[85vh] bg-white sm:rounded-3xl shadow-2xl z-[99999] flex flex-col overflow-hidden border border-gray-100"
          >
            {/* Header */}
            <div className="bg-green-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{t.chatBuddy}</h3>
                    <span className="text-[8px] bg-white/20 px-1 rounded border border-white/30 uppercase tracking-tighter">v2.1 Live</span>
                  </div>
                  <p className="text-[10px] text-green-100">{t.onlineSupport}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <Minimize2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                      message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                    }`}>
                      {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                    }`}>
                      {message.text}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                      <span className="text-xs text-gray-500 italic">{t.typing}</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t.typeQuestion}
                  className="rounded-xl border-gray-200 h-12"
                />
                <Button 
                  type="submit" 
                  disabled={loading || !input.trim()}
                  className="h-12 bg-green-600 hover:bg-green-700 rounded-xl px-5"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </form>
              <p className="text-[10px] text-center text-gray-400 mt-2">
                {t.answerInBangla}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
