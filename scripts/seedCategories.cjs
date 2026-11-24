// ─── Script to Seed Categories directly to Firestore ──────────────────────────
const fs = require('fs');
const os = require('os');
const https = require('https');

const p = os.homedir() + '/.config/configstore/firebase-tools.json';
const conf = JSON.parse(fs.readFileSync(p));
const token = conf.tokens.access_token;
const proj = 'women-s-favorite';

const categories = [
  {
    id: 'cat-sarees',
    nameBn: 'শাড়ি ও ট্র্যাডিশনাল',
    nameEn: 'Sarees & Traditional',
    slug: 'sarees',
    icon: '🥻',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=400&auto=format&fit=crop',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'cat-kurtis',
    nameBn: 'কুর্তি ও সালোয়ার কামিজ',
    nameEn: 'Kurtis & Salwar',
    slug: 'kurtis',
    icon: '👗',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=400&auto=format&fit=crop',
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'cat-skincare',
    nameBn: 'স্কিনকেয়ার',
    nameEn: 'Skincare',
    slug: 'skincare',
    icon: '✨',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=400&auto=format&fit=crop',
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 'cat-makeup',
    nameBn: 'মেকআপ ও কসমেটিকস',
    nameEn: 'Makeup & Cosmetics',
    slug: 'makeup',
    icon: '💄',
    image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=400&auto=format&fit=crop',
    sortOrder: 4,
    isActive: true,
  },
  {
    id: 'cat-haircare',
    nameBn: 'হেয়ার কেয়ার',
    nameEn: 'Hair Care',
    slug: 'hair-care',
    icon: '💇‍♀️',
    image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?q=80&w=400&auto=format&fit=crop',
    sortOrder: 5,
    isActive: true,
  },
  {
    id: 'cat-bags',
    nameBn: 'ব্যাগ ও পার্স',
    nameEn: 'Bags & Purses',
    slug: 'bags',
    icon: '👜',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=400&auto=format&fit=crop',
    sortOrder: 6,
    isActive: true,
  },
  {
    id: 'cat-jewelry',
    nameBn: 'গহনা ও জুয়েলারি',
    nameEn: 'Jewelry & Accessories',
    slug: 'jewelry',
    icon: '💍',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=400&auto=format&fit=crop',
    sortOrder: 7,
    isActive: true,
  },
  {
    id: 'cat-footwear',
    nameBn: 'জুতো ও স্যান্ডেল',
    nameEn: 'Footwear & Heels',
    slug: 'footwear',
    icon: '👠',
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=400&auto=format&fit=crop',
    sortOrder: 8,
    isActive: true,
  },
  {
    id: 'cat-perfumes',
    nameBn: 'পারফিউম ও সুবাস',
    nameEn: 'Fragrance & Perfume',
    slug: 'perfumes',
    icon: '🌸',
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=400&auto=format&fit=crop',
    sortOrder: 9,
    isActive: true,
  },
  {
    id: 'cat-accessories',
    nameBn: 'ঘড়ি ও অ্যাক্সেসরিজ',
    nameEn: 'Watches & Accessories',
    slug: 'accessories',
    icon: '⌚',
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=400&auto=format&fit=crop',
    sortOrder: 10,
    isActive: true,
  },
  {
    id: 'cat-gifts',
    nameBn: 'গিফট আইটেম',
    nameEn: 'Gift Items',
    slug: 'gifts',
    icon: '🎁',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=400&auto=format&fit=crop',
    sortOrder: 11,
    isActive: true,
  },
];

async function updateCategory(cat) {
  const fields = {
    id: { stringValue: cat.id },
    nameBn: { stringValue: cat.nameBn },
    nameEn: { stringValue: cat.nameEn },
    slug: { stringValue: cat.slug },
    icon: { stringValue: cat.icon },
    image: { stringValue: cat.image },
    sortOrder: { integerValue: String(cat.sortOrder) },
    isActive: { booleanValue: cat.isActive },
    createdAt: { timestampValue: new Date().toISOString() },
    updatedAt: { timestampValue: new Date().toISOString() },
  };

  const url = `https://firestore.googleapis.com/v1/projects/${proj}/databases/(default)/documents/categories/${cat.id}`;

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
            console.log(`✅ [${res.statusCode}] Uploaded category: ${cat.nameBn} (${cat.slug})`);
            resolve();
          } else {
            console.error(`❌ [${res.statusCode}] Failed: ${cat.slug}: ${data}`);
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
  console.log(`Starting to seed ${categories.length} categories to Firestore (${proj})...`);
  for (const cat of categories) {
    await updateCategory(cat);
  }
  console.log('🎉 All categories successfully published to Firebase Firestore!');
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
