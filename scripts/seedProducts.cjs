// ─── Script to Seed Products directly to Firestore ────────────────────────────
const fs = require('fs');
const os = require('os');
const https = require('https');

const p = os.homedir() + '/.config/configstore/firebase-tools.json';
const conf = JSON.parse(fs.readFileSync(p));
const token = conf.tokens.access_token;
const proj = 'women-s-favorite';

const products = [
  {
    id: 'prod-rashed',
    nameBn: 'rashed',
    nameEn: 'rashed',
    slug: 'rashed',
    sku: 'WF-1120',
    categoryId: 'cat-clothing',
    categorySlug: 'clothing',
    regularPrice: 2500000,
    salePrice: 2500000,
    stockQuantity: 10,
    stockStatus: 'in_stock',
    status: 'published',
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: true,
    isTrending: true,
    isOnSale: false,
    descriptionBn: 'প্রিমিয়াম এক্সক্লুসিভ কালেকশন।',
    descriptionEn: 'Premium exclusive collection.',
    primaryImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=600&auto=format&fit=crop',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=600&auto=format&fit=crop',
        isPrimary: true,
      },
    ],
    averageRating: 5.0,
    totalReviews: 1,
  },
  {
    id: 'prod-1',
    nameBn: 'রোজ গ্লো হাইড্রেটিং ফেস সিরাম (৩০ মি.লি.)',
    nameEn: 'Rose Glow Hydrating Face Serum 30ml',
    slug: 'rose-glow-hydrating-face-serum',
    sku: 'WF-SK-001',
    categoryId: 'cat-skincare',
    categorySlug: 'skincare',
    regularPrice: 1450,
    salePrice: 1150,
    stockQuantity: 50,
    stockStatus: 'in_stock',
    status: 'published',
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: false,
    isTrending: true,
    isOnSale: true,
    descriptionBn: 'ত্বকের উজ্জ্বলতা বৃদ্ধি ও গভীর আর্দ্রতা জোগাতে ১০০% খাঁটি প্রাকৃতিক সিরাম।',
    descriptionEn: '100% pure organic face serum for instant glow and deep hydration.',
    primaryImage: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop',
        isPrimary: true,
      },
    ],
    averageRating: 4.9,
    totalReviews: 24,
  },
  {
    id: 'prod-2',
    nameBn: 'ম্যাট ভেলভেট লিপস্টিক — বেরি পিঙ্ক',
    nameEn: 'Matte Velvet Lipstick - Berry Pink',
    slug: 'matte-velvet-lipstick-berry-pink',
    sku: 'WF-MK-002',
    categoryId: 'cat-makeup',
    categorySlug: 'makeup',
    regularPrice: 850,
    salePrice: 720,
    stockQuantity: 50,
    stockStatus: 'in_stock',
    status: 'published',
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: false,
    isTrending: false,
    isOnSale: true,
    descriptionBn: '১২ ঘণ্টা স্থায়ী নন-ড্রাইং ভেলভেট ম্যাট ফর্মুলা সমৃদ্ধ প্রিমিয়াম লিপস্টিক।',
    descriptionEn: 'Long-lasting 12-hour velvety matte lipstick that hydrates lips.',
    primaryImage: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=600&auto=format&fit=crop',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=600&auto=format&fit=crop',
        isPrimary: true,
      },
    ],
    averageRating: 4.8,
    totalReviews: 18,
  },
  {
    id: 'prod-3',
    nameBn: 'প্রিমিয়াম এমব্রয়ডারি কটন কুর্তি — ব্লাশ পিঙ্ক',
    nameEn: 'Premium Embroidered Cotton Kurti - Blush Pink',
    slug: 'embroidered-cotton-kurti-blush-pink',
    sku: 'WF-CL-003',
    categoryId: 'cat-kurtis',
    categorySlug: 'kurtis',
    regularPrice: 2200,
    salePrice: 1850,
    stockQuantity: 35,
    stockStatus: 'in_stock',
    status: 'published',
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: true,
    isTrending: true,
    isOnSale: true,
    descriptionBn: '১০০% পিওর কটন ফ্যাব্রিকে হাতে সূক্ষ্ম কারুকার্য করা গর্জিয়াস ডিজাইনার কুর্তি।',
    descriptionEn: 'Finely handcrafted embroidery on 100% breathable pure cotton.',
    primaryImage: 'https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?q=80&w=600&auto=format&fit=crop',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?q=80&w=600&auto=format&fit=crop',
        isPrimary: true,
      },
    ],
    averageRating: 5.0,
    totalReviews: 31,
  },
  {
    id: 'prod-4',
    nameBn: 'লাক্সারি লেদার শোল্ডার হ্যান্ডব্যাগ — ডাস্টি রোজ',
    nameEn: 'Luxury Leather Shoulder Handbag - Dusty Rose',
    slug: 'luxury-leather-shoulder-bag-dusty-rose',
    sku: 'WF-BG-004',
    categoryId: 'cat-bags',
    categorySlug: 'bags',
    regularPrice: 3500,
    salePrice: 2950,
    stockQuantity: 20,
    stockStatus: 'in_stock',
    status: 'published',
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: false,
    isTrending: true,
    isOnSale: true,
    descriptionBn: 'আভিজাত্য ও স্থায়িত্বের নিখুঁত সমন্বয়। একাধিক চেম্বার ও গোল্ড-টোনড জিপার।',
    descriptionEn: 'Premium genuine faux leather with gold-tone accents and multi-pockets.',
    primaryImage: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=600&auto=format&fit=crop',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=600&auto=format&fit=crop',
        isPrimary: true,
      },
    ],
    averageRating: 4.9,
    totalReviews: 12,
  },
  {
    id: 'prod-5',
    nameBn: 'রোজ গোল্ড পার্ল ড্রপ কানের দুল',
    nameEn: 'Rose Gold Pearl Drop Earrings',
    slug: 'rose-gold-pearl-drop-earrings',
    sku: 'WF-JW-005',
    categoryId: 'cat-jewelry',
    categorySlug: 'jewelry',
    regularPrice: 950,
    salePrice: 800,
    stockQuantity: 40,
    stockStatus: 'in_stock',
    status: 'published',
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: true,
    isTrending: true,
    isOnSale: true,
    descriptionBn: 'যেকোনো উৎসবের সাজে স্নিগ্ধ আভিজাত্য এনে দেবে এই মুক্তাখচিত কানের দুল।',
    descriptionEn: 'Delicate pearls set in premium rose gold plating for a timeless look.',
    primaryImage: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=600&auto=format&fit=crop',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=600&auto=format&fit=crop',
        isPrimary: true,
      },
    ],
    averageRating: 4.7,
    totalReviews: 9,
  },
  {
    id: 'prod-6',
    nameBn: 'নারিশিং আরগান হেয়ার অয়েল (১০০ মি.লি.)',
    nameEn: 'Nourishing Argan Hair Oil 100ml',
    slug: 'nourishing-argan-hair-oil-100ml',
    sku: 'WF-HC-006',
    categoryId: 'cat-haircare',
    categorySlug: 'hair-care',
    regularPrice: 1200,
    salePrice: 990,
    stockQuantity: 45,
    stockStatus: 'in_stock',
    status: 'published',
    isFeatured: false,
    isBestSeller: true,
    isNewArrival: false,
    isTrending: false,
    isOnSale: true,
    descriptionBn: 'চুলের গোড়া মজবুত ও সিল্কি করতে খাঁটি মরক্কান আরগান তেলের জাদুকরী মিশ্রণ।',
    descriptionEn: 'Pure Moroccan argan oil elixir for damage repair and silky smooth hair.',
    primaryImage: 'https://images.unsplash.com/photo-1608248597359-272ec22a9643?q=80&w=600&auto=format&fit=crop',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1608248597359-272ec22a9643?q=80&w=600&auto=format&fit=crop',
        isPrimary: true,
      },
    ],
    averageRating: 4.8,
    totalReviews: 15,
  },
  {
    id: 'prod-7',
    nameBn: 'কমফোর্ট ব্লক হিল স্যান্ডেল — নুড পিঙ্ক',
    nameEn: 'Comfort Block Heel Sandals - Nude Pink',
    slug: 'comfort-block-heel-sandals-nude',
    sku: 'WF-FW-007',
    categoryId: 'cat-footwear',
    categorySlug: 'footwear',
    regularPrice: 2400,
    salePrice: 1950,
    stockQuantity: 25,
    stockStatus: 'in_stock',
    status: 'published',
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: true,
    isTrending: false,
    isOnSale: true,
    descriptionBn: 'আরামদায়ক কুশন সোলে তৈরি ট্রেন্ডি ব্লক হিল যা সারাদিন পরলেও ক্লান্তি আসে না।',
    descriptionEn: 'Ultra-comfortable cushioned sole block heels for effortless style all day.',
    primaryImage: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=600&auto=format&fit=crop',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=600&auto=format&fit=crop',
        isPrimary: true,
      },
    ],
    averageRating: 4.6,
    totalReviews: 7,
  },
  {
    id: 'prod-8',
    nameBn: 'এক্সক্লুসিভ লাক্সারি গিফট বক্স হ্যাম্পার',
    nameEn: 'Exclusive Luxury Gift Box Hamper',
    slug: 'exclusive-luxury-gift-box-hamper',
    sku: 'WF-GF-008',
    categoryId: 'cat-gifts',
    categorySlug: 'gifts',
    regularPrice: 4500,
    salePrice: 3800,
    stockQuantity: 15,
    stockStatus: 'in_stock',
    status: 'published',
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: true,
    isTrending: true,
    isOnSale: true,
    descriptionBn: 'প্রিয়জনকে উপহার দেওয়ার জন্য পারফেক্ট কম্বিনেশন — পারফিউম, চকলেট ও কেয়ার কিট।',
    descriptionEn: 'Curated luxury hamper featuring fine fragrance and beauty essentials.',
    primaryImage: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600&auto=format&fit=crop',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600&auto=format&fit=crop',
        isPrimary: true,
      },
    ],
    averageRating: 5.0,
    totalReviews: 28,
  },
];

async function uploadProduct(p) {
  const fields = {
    id: { stringValue: p.id },
    nameBn: { stringValue: p.nameBn },
    nameEn: { stringValue: p.nameEn },
    slug: { stringValue: p.slug },
    sku: { stringValue: p.sku },
    categoryId: { stringValue: p.categoryId },
    categorySlug: { stringValue: p.categorySlug },
    regularPrice: { integerValue: String(p.regularPrice) },
    salePrice: { integerValue: String(p.salePrice) },
    stockQuantity: { integerValue: String(p.stockQuantity) },
    stockStatus: { stringValue: p.stockStatus },
    status: { stringValue: p.status },
    isFeatured: { booleanValue: p.isFeatured },
    isBestSeller: { booleanValue: p.isBestSeller },
    isNewArrival: { booleanValue: p.isNewArrival },
    isTrending: { booleanValue: p.isTrending },
    isOnSale: { booleanValue: p.isOnSale },
    descriptionBn: { stringValue: p.descriptionBn },
    descriptionEn: { stringValue: p.descriptionEn },
    primaryImage: { stringValue: p.primaryImage },
    images: {
      arrayValue: {
        values: p.images.map((img) => ({
          mapValue: {
            fields: {
              url: { stringValue: img.url },
              isPrimary: { booleanValue: img.isPrimary },
            },
          },
        })),
      },
    },
    averageRating: { doubleValue: p.averageRating },
    totalReviews: { integerValue: String(p.totalReviews) },
    createdAt: { timestampValue: new Date().toISOString() },
    updatedAt: { timestampValue: new Date().toISOString() },
  };

  const url = `https://firestore.googleapis.com/v1/projects/${proj}/databases/(default)/documents/products/${p.id}`;

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
            console.log(`✅ [${res.statusCode}] Uploaded product: ${p.nameBn} (${p.slug})`);
            resolve();
          } else {
            console.error(`❌ [${res.statusCode}] Failed: ${p.id}: ${data}`);
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
  console.log(`Starting to seed ${products.length} products to Firestore (${proj})...`);
  for (const prod of products) {
    await uploadProduct(prod);
  }
  console.log('🎉 All products successfully published to Firebase Firestore!');
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
