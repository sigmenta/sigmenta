// ─── Script to Seed Beautiful Banners directly to Firestore ──────────────────
const fs = require('fs');
const os = require('os');
const https = require('https');

const p = os.homedir() + '/.config/configstore/firebase-tools.json';
const conf = JSON.parse(fs.readFileSync(p));
const token = conf.tokens.access_token;
const proj = 'women-s-favorite';

const banners = [
  {
    id: 'banner-fashion-1',
    titleBn: 'প্রিমিয়াম উইমেনস ফ্যাশন কালেকশন',
    titleEn: 'Exclusive Women Fashion Collection',
    subtitleBn: 'উৎসব ও বিশেষ দিনের সেরা ডিজাইনার শাড়ি ও থ্রি-পিস কালেকশন — এক্সক্লুসিভ অফার!',
    subtitleEn: 'Designer Sarees & Traditional Wear for Every Special Occasion',
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1600&auto=format&fit=crop',
    imagePublicId: 'banner-fashion-1',
    ctaText: 'কালেকশন দেখুন',
    ctaLink: '/category/sarees',
    position: 'hero',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'banner-skincare-2',
    titleBn: '১০০% অরিজিনাল স্কিনকেয়ার ও বিউটি',
    titleEn: '100% Authentic Skincare & Beauty',
    subtitleBn: 'ত্বকের বিশেষ যত্নে সেরা ব্র্যান্ডের প্রাকৃতিক সিরাম, ময়েশ্চারাইজার ও ফেসওয়াশ',
    subtitleEn: 'Pure, Dermatologist Recommended Skincare Essentials',
    imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1600&auto=format&fit=crop',
    imagePublicId: 'banner-skincare-2',
    ctaText: 'স্কিনকেয়ার দেখুন',
    ctaLink: '/category/skincare',
    position: 'hero',
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'banner-bags-3',
    titleBn: 'আভিজাত্যময় হ্যান্ডব্যাগ ও স্টাইলিশ পার্স',
    titleEn: 'Elegant Handbags & Stylish Clutches',
    subtitleBn: 'আপনার প্রতিদিনের সাজে আভিজাত্য বাড়াতে আকর্ষণীয় ব্যাগ কালেকশন',
    subtitleEn: 'Modern, Trendy & Functional Bags for Every Modern Woman',
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1600&auto=format&fit=crop',
    imagePublicId: 'banner-bags-3',
    ctaText: 'ব্যাগ কালেকশন',
    ctaLink: '/category/bags',
    position: 'hero',
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 'banner-makeup-4',
    titleBn: 'গ্ল্যামারাস মেকআপ ও কসমেটিকস',
    titleEn: 'Glamorous Makeup & Cosmetics',
    subtitleBn: 'টপ রেটেড লিপস্টিক, ফাউন্ডেশন ও আই মেকআপ কালেকশনে আকর্ষণীয় ছাড়!',
    subtitleEn: 'Top-rated Lipsticks, Foundations & Eye Makeup with Exclusive Discounts',
    imageUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=1600&auto=format&fit=crop',
    imagePublicId: 'banner-makeup-4',
    ctaText: 'মেকআপ দেখুন',
    ctaLink: '/category/makeup',
    position: 'hero',
    sortOrder: 4,
    isActive: true,
  },
];

async function uploadBanner(banner) {
  const fields = {
    id: { stringValue: banner.id },
    titleBn: { stringValue: banner.titleBn },
    titleEn: { stringValue: banner.titleEn },
    subtitleBn: { stringValue: banner.subtitleBn },
    subtitleEn: { stringValue: banner.subtitleEn },
    imageUrl: { stringValue: banner.imageUrl },
    imagePublicId: { stringValue: banner.imagePublicId },
    ctaText: { stringValue: banner.ctaText },
    ctaLink: { stringValue: banner.ctaLink },
    position: { stringValue: banner.position },
    sortOrder: { integerValue: String(banner.sortOrder) },
    isActive: { booleanValue: banner.isActive },
    createdAt: { timestampValue: new Date().toISOString() },
    updatedAt: { timestampValue: new Date().toISOString() },
  };

  const url = `https://firestore.googleapis.com/v1/projects/${proj}/databases/(default)/documents/banners/${banner.id}`;

  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`✅ [${res.statusCode}] Uploaded banner: ${banner.titleBn}`);
            resolve();
          } else {
            console.error(`❌ [${res.statusCode}] Failed: ${banner.id}: ${data}`);
            reject(new Error(data));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(JSON.stringify({ fields }));
    req.end();
  });
}

async function run() {
  console.log(`Starting to seed ${banners.length} banners to Firestore (${proj})...`);
  for (const b of banners) {
    await uploadBanner(b);
  }
  console.log('🎉 All banners successfully published to Firebase Firestore!');
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
