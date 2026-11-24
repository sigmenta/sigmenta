import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle, X, Send, Bot, Sparkles, Phone,
  ExternalLink, ArrowRight, RefreshCw, ShoppingBag, CheckCircle2
} from 'lucide-react';
import { productService, getLocalProducts } from '@/services/productService';
import { categoryService, getLocalCategories } from '@/services/categoryService';
import { getDeliveryFees } from '@/services/settingsService';
import { BRAND, ROUTES } from '@/constants';
import type { Product, Category } from '@/types';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  products?: Product[];
  actionLink?: {
    text: string;
    url: string;
    isExternal?: boolean;
  };
  timestamp: Date;
}

const WHATSAPP_NUMBER = '01620605353';
const WHATSAPP_LINK = 'https://wa.me/8801620605353?text=' + encodeURIComponent('আসসালামু আলাইকুম Sigmenta, আমি ওয়েবসাইট থেকে পণ্যের বিষয়ে জানতে চাই।');

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: `আসসালামু আলাইকুম! Sigmenta (সিগমেন্টা) — Wear Your Style-এ স্বাগতম ⚡ আমি আপনার ২৪/৭ শপিং অ্যাসিস্ট্যান্ট।\n\nআপনি যেকোনো পোশাক বা পণ্যের নাম বা ধরন লিখে দাম, স্টক ও বিস্তারিত জানতে পারেন।`,
      timestamp: new Date(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen, messages, isTyping]);


  // Clean common inquiry stop words to extract actual product keywords without broken regex
  const extractProductKeywords = (text: string): string => {
    const stopWords = [
      'apnader', 'apnader kache', 'ache', 'ki', 'koto', 'dam', 'daam', 'price',
      'dekte', 'chai', 'dekan', 'dekhaw', 'dekhaben', 'kintu', 'ar', 'er', 'oi',
      'আমাদের', 'আপনাদের', 'কাছে', 'আছে', 'কি', 'কী', 'কত', 'দাম', 'প্রাইস', 'দেখতে',
      'চাই', 'দেখান', 'দেখাবেন', 'পণ্য', 'প্রোডাক্ট', 'product', 'products',
      'please', 'plz', 'help', 'bolen', 'জানান', 'প্লিজ', 'এর', 'একটি', 'একটা',
      'কিনা', 'হবে', 'লাগবে', 'নিব', 'কিনব', 'অর্ডার', 'করব'
    ];
    let cleaned = text.toLowerCase();
    for (const word of stopWords) {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      cleaned = cleaned.replace(new RegExp(`(^|\\s+)${escaped}(?=\\s+|$|[?,.!])`, 'gi'), ' ');
    }
    return cleaned.replace(/\s+/g, ' ').trim();
  };

  const handleSend = async (userQuery?: string) => {
    const textToSend = (userQuery || inputText).trim();
    if (!textToSend || isTyping) return;

    // Append user message immediately
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!userQuery) setInputText('');
    setIsTyping(true);

    try {
      // Natural 250ms typing delay — NEVER hangs or lags
      await new Promise((r) => setTimeout(r, 250));

      const q = textToSend.toLowerCase().trim();
      const cleanKeyword = extractProductKeywords(textToSend);

      // ── 1. Greetings & Casual Conversation ─────────────────────────────
      if (
        /^(hi|hello|hey|salam|assalamu|assalamualaikum|হায়|হাই|হ্যালো|সালাম|কেমন|ভালো|valo)$/i.test(q) ||
        q.includes('assalamu') ||
        q.includes('আসসালামু') ||
        q.includes('সালাম') ||
        q.includes('কেমন আছেন') ||
        q.includes('kemon') ||
        q === 'hi' ||
        q === 'hello' ||
        q === 'hey'
      ) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: `ওয়ালাইকুম আসসালাম! ⚡ Sigmenta (সিগমেন্টা)-এ আপনাকে স্বাগতম।\n\nআমি আপনার কেনাকাটার সহকারী। আপনি যেকোনো পণ্যের নাম, দাম, সাইজ, ডেলিভারি বা অর্ডার করার নিয়ম সম্পর্কে জানতে পারেন।`,
            actionLink: {
              text: '🛍️ সব ট্রেন্ডিং কালেকশন দেখুন',
              url: ROUTES.PRODUCTS,
            },
            timestamp: new Date(),
          },
        ]);
        return;
      }

      // ── 2. How to Order / Ordering Assistance ───────────────────────────
      if (
        q.includes('kivabe') ||
        q.includes('কীভাবে') ||
        q.includes('কিভাবে') ||
        q.includes('how to order') ||
        q.includes('অর্ডার করতে চাই') ||
        q.includes('কিনতে চাই') ||
        q.includes('order korte chai') ||
        q.includes('kinte chai') ||
        (q.includes('অর্ডার') && (q.includes('করব') || q.includes('দেওয়') || q.includes('করার'))) ||
        (q.includes('order') && (q.includes('korbo') || q.includes('system') || q.includes('process')))
      ) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: `🛍️ **খুব সহজে অর্ডার করার নিয়ম:**\n\n1️⃣ আপনার পছন্দের পণ্যে ক্লিক করে **"অর্ডার করুন"** বাটনে চাপুন।\n2️⃣ আপনার নাম, মোবাইল নম্বর এবং ডেলিভারি ঠিকানা লিখুন।\n3️⃣ **"ক্যাশ অন ডেলিভারি"** সিলেক্ট করে অর্ডার নিশ্চিত করুন।\n\nএছাড়াও আপনি চাইলে সরাসরি আমাদের WhatsApp-এ নাম-ঠিকানা ও পণ্যের ছবি পাঠিয়েও অর্ডার করতে পারেন!`,
            actionLink: {
              text: '📲 সরাসরি হোয়াটসঅ্যাপে অর্ডার দিন',
              url: WHATSAPP_LINK,
              isExternal: true,
            },
            timestamp: new Date(),
          },
        ]);
        return;
      }

      // ── 3. WhatsApp / Helpline / Phone / Contact ────────────────────────
      if (
        q.includes('whatsapp') ||
        q.includes('হোয়াটসঅ্যাপ') ||
        q.includes('helpline') ||
        q.includes('হেল্পলাইন') ||
        q.includes('phone') ||
        q.includes('ফোন') ||
        q.includes('number') ||
        q.includes('নাম্বার') ||
        q.includes('নম্বর') ||
        q.includes('contact') ||
        q.includes('যোগাযোগ') ||
        q.includes('কল') ||
        q.includes('01620605353')
      ) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: `আমাদের সাথে সরাসরি কথা বলতে বা পরামর্শের জন্য যোগাযোগ করুন:\n\n📞 হেল্পলাইন / WhatsApp: **${WHATSAPP_NUMBER}**\n🕒 সময়: সকাল ১০টা – রাত ১০টা (প্রতিদিন)`,
            actionLink: {
              text: '📲 সরাসরি হোয়াটসঅ্যাপে চ্যাট করুন',
              url: WHATSAPP_LINK,
              isExternal: true,
            },
            timestamp: new Date(),
          },
        ]);
        return;
      }

      // ── 3.1 Facebook Page Inquiry ───────────────────────────────────────
      if (
        q.includes('facebook') ||
        q.includes('ফেসবুক') ||
        q.includes('fb page') ||
        q === 'fb' ||
        q.includes('পেজ') ||
        q.includes('page link')
      ) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: `আমাদের অফিশিয়াল ফেসবুক পেজ ভিজিট করতে নিচের বাটনে ক্লিক করুন। নতুন নতুন কালেকশন, অফার এবং লাইভ আপডেট পেতে পেজে লাইক ও ফলো দিয়ে সঙ্গে থাকুন! 🌸`,
            actionLink: {
              text: '🔵 অফিসিয়াল ফেসবুক পেজে যান',
              url: 'https://www.facebook.com/profile.php?id=61595742368303',
              isExternal: true,
            },
            timestamp: new Date(),
          },
        ]);
        return;
      }

      // ── 4. Delivery & Shipping Inquiry ─────────────────────────────────
      if (
        q.includes('delivery') ||
        q.includes('ডেলিভারি') ||
        q.includes('shipping') ||
        q.includes('শিপিং') ||
        q.includes('চার্জ') ||
        q.includes('charge') ||
        q.includes('খরচ') ||
        q.includes('সময়') ||
        q.includes('time') ||
        q.includes('কবে পাব') ||
        q.includes('কয়দিন') ||
        q.includes('পৌঁছাবে')
      ) {
        const fees = getDeliveryFees();
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: `🚚 **ডেলিভারি চার্জ ও সময়:**\n\n• **ঢাকা সিটির ভেতরে:** মাত্র ${fees.dhaka} টাকা (১-২ দিনে হোম ডেলিভারি)\n• **ঢাকার বাইরে সারাদেশে:** ${fees.outsideDhaka} টাকা (২-৪ দিনে হোম ডেলিভারি)\n\n🎁 **বিশেষ সুবিধা:** ৩,০০০ টাকার বেশি অর্ডারে সারা বাংলাদেশে সম্পূর্ণ **ফ্রি ডেলিভারি**!\n\nসব অর্ডারে ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে টাকা পরিশোধ) সুবিধা রয়েছে।`,
            actionLink: {
              text: 'শিপিং ও ডেলিভারি নীতিমালা বিস্তারিত দেখুন',
              url: ROUTES.SHIPPING_POLICY,
            },
            timestamp: new Date(),
          },
        ]);
        return;
      }

      // ── 5. Payment Methods & Cash on Delivery ───────────────────────────
      if (
        q.includes('payment') ||
        q.includes('পেমেন্ট') ||
        q.includes('টাকা') ||
        q.includes('bkash') ||
        q.includes('বিকাশ') ||
        q.includes('nagad') ||
        q.includes('নগদ') ||
        q.includes('cod') ||
        q.includes('ক্যাশ অন')
      ) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: `💳 **পেমেন্ট পদ্ধতি:**\n\n✅ বর্তমানে আমাদের সবচেয়ে জনপ্রিয় পদ্ধতি **ক্যাশ অন ডেলিভারি (Cash on Delivery)** চালু রয়েছে—পার্সেল হাতে পেয়ে দেখে তারপর ডেলিভারিম্যানকে টাকা পরিশোধ করবেন।\n\nবিকাশ/নগদ অনলাইন পেমেন্ট খুব শীঘ্রই অ্যাপে যুক্ত হচ্ছে।`,
            actionLink: {
              text: '🛍️ সব পণ্য দেখতে যান',
              url: ROUTES.PRODUCTS,
            },
            timestamp: new Date(),
          },
        ]);
        return;
      }

      // ── 6. Return / Refund / Exchange Policy ───────────────────────────
      if (
        q.includes('return') ||
        q.includes('রিটার্ন') ||
        q.includes('refund') ||
        q.includes('রিফান্ড') ||
        q.includes('change') ||
        q.includes('পরিবর্তন') ||
        q.includes('চেঞ্জ') ||
        q.includes('নষ্ট') ||
        q.includes('ভাঙা') ||
        q.includes('ত্রুটি')
      ) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: `💰 **সহজ রিটার্ন ও পরিবর্তন নীতি:**\n\nপণ্য হাতে পাওয়ার পর কোনো সমস্যা (ভুল পণ্য বা ত্রুটিপূর্ণ) দেখা দিলে ডেলিভারির ৪৮ ঘণ্টার মধ্যে আমাদের জানান। আমরা বিনামূল্যে পণ্য পরিবর্তন অথবা সম্পূর্ণ মূল্য রিফান্ড প্রদান করি।`,
            actionLink: {
              text: 'রিফান্ড ও রিটার্ন নীতি বিস্তারিত পড়ুন',
              url: ROUTES.REFUND_POLICY,
            },
            timestamp: new Date(),
          },
        ]);
        return;
      }

      // ── 7. Offers / Discounts / Hot Deals ──────────────────────────────
      if (
        q.includes('offer') ||
        q.includes('অফার') ||
        q.includes('discount') ||
        q.includes('ছাড়') ||
        q.includes('ছাড়') ||
        q.includes('coupon') ||
        q.includes('কুপন') ||
        q.includes('new') ||
        q.includes('নতুন') ||
        q.includes('trending') ||
        q.includes('সেরা')
      ) {
        const localProducts = getLocalProducts().filter((p) => 
          p.status === 'published' && 
          p.categorySlug !== 'skincare' && 
          p.categorySlug !== 'makeup' && 
          !p.slug?.includes('rose-glow')
        );
        const onSale = localProducts.filter((p) => (p.salePrice && p.salePrice < p.regularPrice) || p.isFeatured || p.isBestSeller);
        const displayProds = (onSale.length > 0 ? onSale : localProducts).slice(0, 4);

        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: `✨ বর্তমানে আমাদের হট ডিল এবং সেরা অফারের কয়েকটি পণ্য নিচে দেওয়া হলো:`,
            products: displayProds,
            actionLink: {
              text: 'সব অফার পণ্য দেখুন →',
              url: ROUTES.PRODUCTS,
            },
            timestamp: new Date(),
          },
        ]);
        return;
      }

      // ── 8. Instant In-Memory Product Search (0ms) ───────────────────────
      const allLocal = getLocalProducts().filter((p) => 
        p.status === 'published' && 
        p.categorySlug !== 'skincare' && 
        p.categorySlug !== 'makeup' && 
        !p.slug?.includes('rose-glow')
      );

      const searchQuery = (cleanKeyword || q).toLowerCase();

      const matchedProducts = allLocal
        .map((p) => {
          let score = 0;
          const nameBn = (p.nameBn || '').toLowerCase();
          const nameEn = (p.nameEn || '').toLowerCase();
          const tags = (p.tags || []).join(' ').toLowerCase();
          const desc = ((p as any).description || p.descriptionBn || p.descriptionEn || '').toLowerCase();
          const cat = (p.categorySlug || '').toLowerCase();
          const sku = (p.sku || '').toLowerCase();

          if (nameBn === searchQuery || nameEn === searchQuery) score += 100;
          if (nameBn.startsWith(searchQuery) || nameEn.startsWith(searchQuery)) score += 60;
          if (nameBn.includes(searchQuery) || nameEn.includes(searchQuery)) score += 40;
          if (tags.includes(searchQuery)) score += 30;
          if (cat.includes(searchQuery)) score += 25;
          if (desc.includes(searchQuery)) score += 15;
          if (sku.includes(searchQuery)) score += 10;

          const words = searchQuery.split(/\s+/).filter((w) => w.length > 1);
          for (const w of words) {
            if (nameBn.includes(w) || nameEn.includes(w)) score += 20;
            if (tags.includes(w)) score += 10;
          }
          return { product: p, score };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.product)
        .slice(0, 4);

      if (matchedProducts.length > 0) {
        const first = matchedProducts[0]!;
        const priceText = first.salePrice
          ? `৳${first.salePrice.toLocaleString('bn-BD')} (আগের দাম: ৳${first.regularPrice.toLocaleString('bn-BD')})`
          : `৳${first.regularPrice.toLocaleString('bn-BD')}`;

        let reply = `আপনার অনুসন্ধান অনুযায়ী **${matchedProducts.length}টি** পণ্য পাওয়া গেছে:\n\n👉 **${first.nameBn}**-এর বর্তমান মূল্য **${priceText}**।`;
        if (first.stockStatus === 'out_of_stock') {
          reply += '\n⚠️ *পণ্যটি বর্তমানে স্টকে শেষ।*';
        } else {
          reply += '\n✅ *পণ্যটি স্টকে এভেইলেবল আছে। এখনই অর্ডার করতে পারেন।*';
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: reply,
            products: matchedProducts,
            actionLink: {
              text: 'সব পণ্য দেখুন →',
              url: ROUTES.PRODUCTS,
            },
            timestamp: new Date(),
          },
        ]);
        return;
      }

      // ── 9. Category Matching ──────────────────────────────────────────
      const localCats = getLocalCategories();
      const catMatch = localCats.find(
        (c) =>
          c.nameBn?.toLowerCase().includes(q) ||
          c.nameEn?.toLowerCase().includes(q) ||
          c.slug?.toLowerCase().includes(q) ||
          (cleanKeyword &&
            (c.nameBn?.toLowerCase().includes(cleanKeyword) ||
              c.nameEn?.toLowerCase().includes(cleanKeyword)))
      );

      if (catMatch) {
        const catProducts = allLocal.filter((p) => p.categorySlug === catMatch.slug).slice(0, 4);
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: `📁 **${catMatch.nameBn}** ক্যাটাগরির পণ্যসমূহ:`,
            products: catProducts.length > 0 ? catProducts : allLocal.slice(0, 3),
            actionLink: {
              text: `${catMatch.nameBn} ক্যাটাগরির সব পণ্য দেখুন →`,
              url: `/category/${catMatch.slug}`,
            },
            timestamp: new Date(),
          },
        ]);
        return;
      }

      // ── 10. Instant Friendly Fallback with Popular Suggestions ────────
      const topProducts = allLocal.slice(0, 3);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `"${textToSend}" সম্পর্কিত সরাসরি কোনো পণ্য মেলেনি। তবে আমাদের জনপ্রিয় কিছু পণ্য নিচে দেখতে পারেন, অথবা যেকোনো প্রয়োজনে সরাসরি আমাদের হোয়াটসঅ্যাপে নক করতে পারেন:`,
          products: topProducts,
          actionLink: {
            text: `📲 WhatsApp হেল্পলাইনে কথা বলুন (${WHATSAPP_NUMBER})`,
            url: WHATSAPP_LINK,
            isExternal: true,
          },
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      console.error('[ChatBot] Error answering message:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `যেকোনো তথ্যের জন্য সরাসরি আমাদের হোয়াটসঅ্যাপে যোগাযোগ করতে পারেন: **${WHATSAPP_NUMBER}**`,
          actionLink: {
            text: '📲 হোয়াটসঅ্যাপে চ্যাট করুন',
            url: WHATSAPP_LINK,
            isExternal: true,
          },
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[250] font-bangla">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="কাস্টমার সাপোর্ট চ্যাটবট"
            className="group relative flex items-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 border border-slate-700"
          >
            <div className="relative">
              <MessageCircle className="w-6 h-6 text-white" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>
            <span className="text-xs font-bold text-white hidden sm:inline-block">
              সহায়তা প্রয়োজন?
            </span>
          </button>
        )}
      </div>

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="fixed bottom-20 md:bottom-6 right-3 md:right-6 z-[300] w-[92vw] sm:w-[380px] md:w-[400px] h-[550px] max-h-[80vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden font-bangla animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="bg-[#0F172A] text-white p-4 flex items-center justify-between shadow-sm flex-shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-xl bg-white/10 backdrop-blur-xs p-1 flex items-center justify-center border border-white/20">
                <Bot className="w-5 h-5 text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0F172A] rounded-full" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5 !text-white text-white">
                  <span className="!text-white text-white font-bold tracking-wide">Sigmenta সহকারী</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </h3>
                <p className="text-[11px] text-slate-300 flex items-center gap-1 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  অনলাইন • সাহায্য করতে প্রস্তুত
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
              aria-label="চ্যাট বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Official WhatsApp Helpline Notice Banner */}
          <div className="bg-[#E7F8EE] border-b border-[#C6F0D6] px-3.5 py-2 flex items-center justify-between gap-2 flex-shrink-0">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 rounded-full bg-[#25D366] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Phone className="w-3.5 h-3.5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] text-gray-500 font-medium leading-none">হোয়াটসঅ্যাপ হেল্পলাইন</p>
                <p className="text-xs font-bold text-[#1E7E34] leading-tight tracking-wide">{WHATSAPP_NUMBER}</p>
              </div>
            </div>

            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 bg-[#25D366] hover:bg-[#20BA5A] text-white text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors flex-shrink-0 shadow-xs"
            >
              <span>চ্যাট করুন</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#FFF8FA]/60">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs md:text-sm leading-relaxed whitespace-pre-line shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-[#D45D83] text-white rounded-br-none'
                      : 'bg-white text-[#292329] border border-[#F0E2E8] rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Optional Action Link */}
                {msg.actionLink && (
                  <div className="mt-2">
                    {msg.actionLink.isExternal ? (
                      <a
                        href={msg.actionLink.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                      >
                        <span>{msg.actionLink.text}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <Link
                        to={msg.actionLink.url}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-pink-50 border border-[#D45D83] text-[#D45D83] rounded-xl text-xs font-bold shadow-xs transition-colors"
                      >
                        <span>{msg.actionLink.text}</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                )}

                {/* Optional Product Cards Grid in Chat */}
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-2.5 space-y-2 w-full max-w-[95%]">
                    {msg.products.map((prod) => {
                      const img = (prod as any).primaryImage || prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600&auto=format&fit=crop';
                      const price = prod.salePrice || prod.regularPrice;

                      return (
                        <div
                          key={prod.id}
                          className="bg-white border border-[#F0E2E8] rounded-2xl p-2.5 flex items-center justify-between gap-3 shadow-xs hover:border-[#D45D83] transition-all"
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 p-0.5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              <img
                                src={img}
                                alt={prod.nameBn}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600&auto=format&fit=crop';
                                }}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            </div>
                            <div className="overflow-hidden text-left">
                              <h4 className="text-xs font-bold text-[#292329] truncate">{prod.nameBn}</h4>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-xs font-bold text-[#D45D83]">
                                  ৳{price.toLocaleString('bn-BD')}
                                </span>
                                {prod.salePrice && prod.salePrice < prod.regularPrice && (
                                  <span className="text-[10px] text-gray-400 line-through">
                                    ৳{prod.regularPrice.toLocaleString('bn-BD')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <Link
                            to={`/product/${prod.slug}`}
                            onClick={() => setIsOpen(false)}
                            className="px-2.5 py-1 bg-[#D45D83] hover:bg-[#B8446C] text-white text-[11px] font-bold rounded-lg flex-shrink-0 shadow-xs transition-colors"
                          >
                            কিনুন
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-[#77717A] bg-white border border-[#F0E2E8] px-3.5 py-2 rounded-2xl w-fit shadow-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--color-primary)]" />
                <span>সিগমেন্টা সহকারী লিখছে...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Quick Prompt Chips */}
          <div className="bg-white border-t border-[#F0E2E8] px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
            <button
              type="button"
              onClick={() => handleSend('ডেলিভারি চার্জ কত?')}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold border border-slate-300 whitespace-nowrap transition-colors"
            >
              🚚 ডেলিভারি চার্জ
            </button>
            <button
              type="button"
              onClick={() => handleSend('আজকের সেরা অফার কি কি?')}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold border border-slate-300 whitespace-nowrap transition-colors"
            >
              🔥 সেরা অফার
            </button>
            <button
              type="button"
              onClick={() => handleSend('হুডি ও পায়জামা কালেকশন')}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold border border-slate-300 whitespace-nowrap transition-colors"
            >
              🧥 কালেকশন
            </button>

            <button
              type="button"
              onClick={() => handleSend('হোয়াটসঅ্যাপ হেল্পলাইন')}
              className="px-2.5 py-1 rounded-full bg-green-50 hover:bg-green-100 text-green-700 text-[11px] font-semibold border border-green-200 whitespace-nowrap transition-colors flex items-center gap-1"
            >
              <Phone className="w-2.5 h-2.5 text-green-600" />
              <span>WhatsApp</span>
            </button>
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-[#F0E2E8] flex items-center gap-2 flex-shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="পণ্যের নাম লিখে দাম বা স্টক জানুন..."
              disabled={isTyping}
              className="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-slate-800 placeholder-gray-400 bg-slate-50/50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl transition-colors shadow-xs flex-shrink-0"
              aria-label="বার্তা পাঠান"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatBot;
