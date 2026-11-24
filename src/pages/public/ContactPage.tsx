import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase';
import { BRAND } from '@/constants';
import { useLanguage } from '@/contexts/LanguageContext';

export const ContactPage: React.FC = () => {
  const { t, isBangla } = useLanguage();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.message.trim()) {
      toast.error(isBangla ? 'অনুগ্রহ করে সকল আবশ্যকীয় তথ্য পূরণ করুন' : 'Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'contactMessages'), {
        ...formData,
        createdAt: serverTimestamp(),
        status: 'unread',
      });

      setIsSuccess(true);
      toast.success(isBangla ? 'আপনার বার্তা সফলভাবে পাঠানো হয়েছে!' : 'Message sent successfully!');
      setFormData({ name: '', phone: '', email: '', subject: '', message: '' });
    } catch (err) {
      console.error('Failed to send contact message:', err);
      toast.error(isBangla ? 'বার্তা পাঠানো যায়নি। আবার চেষ্টা করুন।' : 'Failed to send message.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{`যোগাযোগ — ${BRAND.nameBn}`}</title>
        <meta name="description" content="Sigmenta™ এর সাথে যোগাযোগ করুন।" />
      </Helmet>

      <div className="max-w-content mx-auto px-4 py-8 font-bangla">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-[#292329] mb-2">
            {t('page.contact')}
          </h1>
          <p className="text-xs md:text-sm text-[#77717A]">
            {isBangla
              ? 'আমাদের সাথে যেকোনো মতামত, প্রশ্ন বা সহযোগিতার জন্য নির্দ্বিধায় বার্তা পাঠান।'
              : 'Feel free to reach out with any inquiries or feedback.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Details Cards */}
          <div className="space-y-4">
            <div className="bg-white border border-[#F0E2E8] rounded-3xl p-6 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-[#FFF0F5] text-[#D45D83] flex items-center justify-center shrink-0 mt-1">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#292329] mb-1">ফোন নম্বর</h3>
                <p className="text-xs text-[#77717A] leading-relaxed">{BRAND.phone}</p>
                <p className="text-[11px] text-[#A8A1AB] mt-0.5">সকাল ১০টা থেকে রাত ৮টা পর্যন্ত</p>
              </div>
            </div>

            <div className="bg-white border border-[#F0E2E8] rounded-3xl p-6 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-[#FFF0F5] text-[#D45D83] flex items-center justify-center shrink-0 mt-1">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#292329] mb-1">ইমেইল ঠিকানা</h3>
                <p className="text-xs text-[#77717A] leading-relaxed">{BRAND.email}</p>
                <p className="text-[11px] text-[#A8A1AB] mt-0.5">২৪ ঘণ্টার মধ্যে উত্তর দেওয়া হয়</p>
              </div>
            </div>

            <div className="bg-white border border-[#F0E2E8] rounded-3xl p-6 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-[#FFF0F5] text-[#D45D83] flex items-center justify-center shrink-0 mt-1">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#292329] mb-1">অফিসের ঠিকানা</h3>
                <p className="text-xs text-[#77717A] leading-relaxed">{BRAND.address}</p>
              </div>
            </div>

            <div className="bg-white border border-[#F0E2E8] rounded-3xl p-6 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-[#FFF0F5] text-[#D45D83] flex items-center justify-center shrink-0 mt-1">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#292329] mb-1">কার্যদিবস</h3>
                <p className="text-xs text-[#77717A] leading-relaxed">শনিবার – বৃহস্পতিবার</p>
                <p className="text-[11px] text-[#A8A1AB] mt-0.5">শুক্রবার সাপ্তাহিক বন্ধ</p>
              </div>
            </div>
          </div>

          {/* Message Form */}
          <div className="lg:col-span-2 bg-white border border-[#F0E2E8] rounded-3xl p-6 md:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-[#292329] mb-6">
              আমাদের একটি বার্তা পাঠান
            </h2>

            {isSuccess ? (
              <div className="text-center py-12 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                <h3 className="text-lg font-bold text-[#292329]">ধন্যবাদ!</h3>
                <p className="text-xs text-[#77717A] max-w-sm mx-auto">
                  আপনার বার্তাটি সফলভাবে পাঠানো হয়েছে। আমাদের প্রতিনিধি দ্রুত আপনার সাথে যোগাযোগ করবেন।
                </p>
                <button
                  type="button"
                  onClick={() => setIsSuccess(false)}
                  className="mt-4 px-6 py-2 bg-[#FFF0F5] text-[#D45D83] rounded-xl text-xs font-bold hover:bg-[#D45D83] hover:text-white transition-colors"
                >
                  আরেকটি বার্তা পাঠান
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#292329] mb-1">
                      আপনার নাম <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="পুরো নাম দিন"
                      required
                      className="w-full px-4 py-2.5 text-xs bg-[#FFF8FA] border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#292329] mb-1">
                      মোবাইল নম্বর <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="01XXXXXXXXX"
                      required
                      className="w-full px-4 py-2.5 text-xs bg-[#FFF8FA] border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#292329] mb-1">
                      ইমেইল (ঐচ্ছিক)
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="example@mail.com"
                      className="w-full px-4 py-2.5 text-xs bg-[#FFF8FA] border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#292329] mb-1">
                      বিষয়
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="অর্ডার অনুসন্ধান / সাধারণ তথ্য"
                      className="w-full px-4 py-2.5 text-xs bg-[#FFF8FA] border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#292329] mb-1">
                    বার্তা <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="আপনার বার্তা বিস্তারিত লিখুন..."
                    required
                    className="w-full px-4 py-2.5 text-xs bg-[#FFF8FA] border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-[#D45D83] hover:bg-[#B8446C] disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'পাঠানো হচ্ছে...' : 'বার্তা পাঠান'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactPage;
