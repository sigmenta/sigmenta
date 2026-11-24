# Women's Favorite — E-Commerce Platform

> একটি প্রিমিয়াম বাংলাদেশি নারী ফ্যাশন ই-কমার্স প্ল্যাটফর্ম  
> A premium women's fashion e-commerce platform for Bangladesh

---

## Project Overview

**Women's Favorite** is a full-stack, production-grade e-commerce web application designed specifically for the Bangladesh market. It targets female shoppers and offers a curated selection of clothing, accessories, and beauty products.

**Key capabilities:**
- 🛍️ Product catalog with categories, filters, search, and reviews
- 🛒 Persistent cart and wishlist (Firebase-backed)
- 📦 Order management with real-time status tracking
- 💳 COD + bKash + Nagad payment methods (bKash/Nagad require merchant setup)
- 🔐 Role-based admin panel (super_admin → admin → customer)
- ☁️ Cloudinary image management with server-side signed uploads
- 📊 Admin dashboard with sales analytics
- 🇧🇩 Full Bangla UI, mobile-first design

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | React | 18.x |
| Language | TypeScript | 5.x |
| Build Tool | Vite | 5.x |
| Styling | Tailwind CSS | 3.x |
| State | Zustand | 4.x |
| Data Fetching | TanStack Query | 5.x |
| Backend (BaaS) | Firebase (Auth, Firestore, Functions) | 10.x SDK |
| Cloud Functions | Node.js | 18 (LTS) |
| Functions Framework | firebase-functions | 4.x |
| Admin SDK | firebase-admin | 12.x |
| Validation | Zod | 3.x |
| HTTP Client | Axios | 1.x |
| Image CDN | Cloudinary | — |
| Icons | Lucide React | latest |
| Routing | React Router DOM | 6.x |
| Forms | React Hook Form | 7.x |

---

## Project Structure

```
womens-favorite/
├── public/                     # Static assets (favicon, robots.txt)
├── src/
│   ├── assets/                 # Images, fonts bundled with app
│   ├── components/
│   │   ├── admin/              # Admin-only UI components
│   │   │   └── ImageUploader.tsx
│   │   ├── layout/             # Header, Footer, Sidebar
│   │   ├── product/            # ProductCard, ProductGrid, etc.
│   │   ├── cart/               # Cart drawer and items
│   │   ├── checkout/           # Checkout form and summary
│   │   └── ui/                 # Reusable primitives (Button, Input, Modal)
│   ├── constants/
│   │   └── index.ts            # App-wide constants (brand colors, API keys ref)
│   ├── contexts/               # React contexts (AuthContext, CartContext)
│   ├── hooks/                  # Custom React hooks
│   ├── lib/
│   │   ├── firebase.ts         # Firebase app initialization
│   │   ├── cloudinary.ts       # Cloudinary upload helper (calls signing function)
│   │   └── queryClient.ts      # TanStack Query client config
│   ├── pages/                  # Route-level page components
│   │   ├── Home.tsx
│   │   ├── Shop.tsx
│   │   ├── ProductDetail.tsx
│   │   ├── Cart.tsx
│   │   ├── Checkout.tsx
│   │   ├── OrderConfirmation.tsx
│   │   ├── Profile.tsx
│   │   ├── Orders.tsx
│   │   ├── Wishlist.tsx
│   │   └── admin/
│   │       ├── Dashboard.tsx
│   │       ├── Products.tsx
│   │       ├── Orders.tsx
│   │       └── Users.tsx
│   ├── services/               # Firestore data access layer (products, orders, etc.)
│   ├── store/                  # Zustand stores
│   ├── types/
│   │   └── index.ts            # All TypeScript interfaces and types
│   └── main.tsx                # App entry point
├── functions/                  # Firebase Cloud Functions
│   ├── src/
│   │   ├── cloudinary/
│   │   │   └── sign.ts         # Cloudinary signed upload
│   │   ├── orders/
│   │   │   └── createOrder.ts  # Atomic order creation
│   │   ├── payments/
│   │   │   ├── bkash.ts        # bKash PGW stub
│   │   │   └── nagad.ts        # Nagad DFS stub
│   │   ├── roles/
│   │   │   └── grantRole.ts    # Admin role management
│   │   ├── shared/
│   │   │   ├── admin.ts        # Admin SDK singleton
│   │   │   └── types.ts        # Shared type definitions
│   │   └── index.ts            # Function exports
│   ├── package.json
│   └── tsconfig.json
├── firebase.json               # Firebase project configuration
├── firestore.rules             # Firestore security rules
├── firestore.indexes.json      # Composite index definitions
├── .env.example                # Environment variable template
└── README.md                   # This file
```

---

## Getting Started

### Prerequisites

- **Node.js** 18 LTS or later → [nodejs.org](https://nodejs.org)
- **npm** 9+ or **pnpm** 8+
- **Firebase CLI** → `npm install -g firebase-tools`
- **Git**
- A **Firebase project** (see Firebase Setup below)
- A **Cloudinary account** (see Cloudinary Setup below)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/womens-favorite.git
cd womens-favorite

# 2. Install frontend dependencies
npm install

# 3. Install Cloud Functions dependencies
cd functions
npm install
cd ..

# 4. Copy environment template
cp .env.example .env.local

# 5. Fill in your .env.local values (see Environment Variables section)

# 6. Start the development server
npm run dev
```

---

## Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Name it `womens-favorite` (or your preferred name)
4. Enable Google Analytics (recommended)
5. Click **"Create project"**

### Step 2: Enable Authentication

1. In the Firebase Console, go to **Authentication → Sign-in method**
2. Enable **Email/Password**
3. Enable **Google** (configure OAuth consent screen in Google Cloud Console)
4. Add your domain to **Authorized domains**

### Step 3: Create Firestore Database

1. Go to **Firestore Database → Create database**
2. Select **Production mode** (rules will be deployed separately)
3. Choose region: **asia-east1** (Taiwan) — closest to Bangladesh
4. Click **Done**

### Step 4: Deploy Security Rules

```bash
# Login to Firebase
firebase login

# Select your project
firebase use --add

# Deploy rules only
firebase deploy --only firestore:rules

# Deploy indexes only
firebase deploy --only firestore:indexes

# Deploy both
firebase deploy --only firestore
```

### Step 5: Enable Firebase Functions

> ⚠️ Firebase Functions requires the **Blaze (pay-as-you-go) plan**. The free Spark plan does not support outbound network calls needed for payment integrations.

1. Go to Firebase Console → **Functions**
2. Click **"Upgrade project"** if prompted
3. Enable Functions

### Step 6: Register Web App

1. Project Overview → **"Add app"** → Web (`</>`)
2. Register the app, copy the config object
3. Paste values into your `.env.local` file

---

## Cloudinary Setup

### Step 1: Create Account

1. Sign up at [cloudinary.com](https://cloudinary.com/)
2. Note your **Cloud Name**, **API Key**, and **API Secret** from the dashboard

### Step 2: Create Upload Preset (optional for unsigned uploads)

> The Women's Favorite app uses **server-side signed uploads** via Cloud Functions. You do NOT need an unsigned preset for production.

If you want to use unsigned uploads in development only:
1. Settings → **Upload** → **Upload presets** → **Add upload preset**
2. Set signing mode: **Unsigned**
3. Restrict to a folder, e.g. `products-dev`

### Step 3: Set Environment Variables

```bash
# Frontend .env.local (only VITE_ prefix is exposed to browser)
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_api_key
# ⚠️ NEVER add CLOUDINARY_API_SECRET to any VITE_ variable!
```

### Step 4: Set Functions Config (API Secret)

```bash
# This is the ONLY place the API secret should live
firebase functions:config:set \
  cloudinary.api_secret="YOUR_API_SECRET" \
  cloudinary.api_key="YOUR_API_KEY" \
  cloudinary.cloud_name="YOUR_CLOUD_NAME"
```

---

## Environment Variables

Create a `.env.local` file in the project root. **Never commit this file to Git.**

```dotenv
# ──────────────────────────────────────────
# Firebase Web App Config
# Get these from Firebase Console → Project Settings → Your apps
# ──────────────────────────────────────────
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# ──────────────────────────────────────────
# Cloudinary (public keys only — safe in browser)
# API Secret goes ONLY in Firebase Functions config (see above)
# ──────────────────────────────────────────
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_api_key

# ──────────────────────────────────────────
# App Config
# ──────────────────────────────────────────
VITE_APP_NAME=Women's Favorite
VITE_APP_URL=https://your-domain.com

# ──────────────────────────────────────────
# Feature Flags (set to 'true' to enable)
# ──────────────────────────────────────────
VITE_ENABLE_BKASH=false
VITE_ENABLE_NAGAD=false
VITE_ENABLE_GOOGLE_ANALYTICS=false

# ──────────────────────────────────────────
# Emulator (development only)
# Set to 'true' when running Firebase Emulator Suite
# ──────────────────────────────────────────
VITE_USE_EMULATORS=false
```

---

## Firebase Functions Deployment

```bash
# Build TypeScript
cd functions
npm run build

# Deploy all functions
cd ..
firebase deploy --only functions

# Deploy a single function
firebase deploy --only functions:createOrder

# View function logs
firebase functions:log --only createOrder
```

### Setting Functions Config

```bash
# bKash (required for bKash payments)
firebase functions:config:set \
  bkash.app_key="YOUR_APP_KEY" \
  bkash.app_secret="YOUR_APP_SECRET" \
  bkash.username="YOUR_USERNAME" \
  bkash.password="YOUR_PASSWORD" \
  bkash.sandbox="true"

# Nagad (required for Nagad payments)
firebase functions:config:set \
  nagad.merchant_id="YOUR_MERCHANT_ID" \
  nagad.merchant_private_key="BASE64_ENCODED_PRIVATE_KEY" \
  nagad.pgw_public_key="BASE64_ENCODED_NAGAD_PUBLIC_KEY" \
  nagad.sandbox="true"

# Cloudinary (required for image uploads)
firebase functions:config:set \
  cloudinary.api_secret="YOUR_API_SECRET" \
  cloudinary.api_key="YOUR_API_KEY" \
  cloudinary.cloud_name="YOUR_CLOUD_NAME"
```

---

## bKash Integration Guide

> ⚠️ **Status: NOT_IMPLEMENTED** — See `functions/src/payments/bkash.ts`

### Getting a Merchant Account

1. Visit [developer.bka.sh](https://developer.bka.sh/)
2. Click **"Become a Merchant"**
3. Submit your application with:
   - Trade license (ট্রেড লাইসেন্স)
   - TIN certificate
   - Bank account information
   - Business contact details
4. bKash support will contact you: `pgw_support@bkash.com`
5. Receive: App Key, App Secret, Username, Password
6. Test on sandbox: `https://tokenized.sandbox.bka.sh/v1.2.0-beta`

### Implementation Steps

1. Set Firebase Functions config (see above)
2. Open `functions/src/payments/bkash.ts`
3. Follow the inline implementation template
4. Uncomment the implementation block in `initiateBkashPayment`
5. Implement `verifyBkashPayment` with execute + status check
6. Add an HTTP trigger `bkashCallback` function
7. Register the callback URL with bKash
8. Set `VITE_ENABLE_BKASH=true` in your environment

---

## Nagad Integration Guide

> ⚠️ **Status: NOT_IMPLEMENTED** — See `functions/src/payments/nagad.ts`

### Getting a Merchant Account

1. Visit [nagad.com.bd/merchant](https://nagad.com.bd/merchant/)
2. Call Nagad merchant support: **16167**
3. Submit required documents:
   - Trade license
   - NID of proprietor
   - Bank account details
4. Receive: Merchant ID, Merchant Private Key (RSA), Nagad PGW Public Key
5. Test on sandbox: `http://sandbox.mynagad.com:10080`

### Implementation Steps

1. Base64-encode your RSA private key and Nagad's public key
2. Set Firebase Functions config (see above)
3. Open `functions/src/payments/nagad.ts`
4. Implement `encryptWithNagadPublicKey` using Node.js `crypto`
5. Implement `signWithMerchantPrivateKey` using Node.js `crypto`
6. Complete `initiateNagadPayment` and `verifyNagadPayment`
7. Add an HTTP trigger `nagadCallback`
8. Register callback URL with Nagad support
9. Set `VITE_ENABLE_NAGAD=true`

---

## Admin Setup

> ⚠️ **NEVER create an admin account through self-registration.** Always set admin roles via Cloud Functions with an existing super_admin account or directly via Admin SDK during initial setup.

### Creating the First Super Admin (Bootstrap)

Since no super_admin exists yet, you must set the first one manually:

```bash
# Option 1: Using Firebase Admin SDK script
# Create a file: scripts/set-super-admin.js

const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function setFirstSuperAdmin(uid) {
  await admin.auth().setCustomUserClaims(uid, { role: 'super_admin' });
  await admin.firestore().collection('users').doc(uid).update({
    role: 'super_admin',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log(`Super admin set for: ${uid}`);
}

// Replace with the UID from Firebase Auth → Users tab
setFirstSuperAdmin('THE_USER_UID_HERE');
```

```bash
# Run the script (get service account from Firebase Console → Project Settings → Service accounts)
node scripts/set-super-admin.js
```

```bash
# Option 2: Using Firebase CLI + Emulator (development)
firebase auth:import users.json --hash-algo=SCRYPT ...
```

Once the first super_admin exists, additional admins can be granted via the admin panel UI which calls the `grantAdminRole` Cloud Function.

---

## Development Commands

```bash
# Start Vite dev server (frontend only)
npm run dev

# Start with Firebase Emulator Suite (recommended for full-stack dev)
firebase emulators:start --import=./emulator-data --export-on-exit

# In another terminal:
VITE_USE_EMULATORS=true npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# TypeScript type check
npm run type-check

# Lint
npm run lint

# Build Cloud Functions
cd functions && npm run build

# Deploy everything
firebase deploy
```

---

## Production Deployment Checklist

- [ ] Set all Firebase Functions config values (Cloudinary, bKash, Nagad)
- [ ] Deploy Firestore security rules: `firebase deploy --only firestore:rules`
- [ ] Deploy Firestore indexes: `firebase deploy --only firestore:indexes`
- [ ] Build frontend: `npm run build`
- [ ] Deploy hosting: `firebase deploy --only hosting`
- [ ] Deploy functions: `firebase deploy --only functions`
- [ ] Set `bkash.sandbox="false"` and `nagad.sandbox="false"` for production
- [ ] Enable Firebase App Check (reCAPTCHA v3)
- [ ] Configure Cloudinary upload restrictions (file size, format, folder)
- [ ] Add custom domain in Firebase Hosting
- [ ] Set up Firebase Alerting for error thresholds
- [ ] Test the complete order flow end-to-end
- [ ] Verify payment callbacks are registered with gateways
- [ ] Review Firestore security rules with Firebase Rules Playground
- [ ] Enable Google Analytics / Firebase Analytics
- [ ] Set CORS policies on Cloudinary account

---

## Known Limitations

1. **bKash & Nagad payments are stubs** — merchant accounts and API integration must be completed separately.
2. **No real-time stock reservation** — stock is decremented atomically at order creation but there is no "reserve stock in cart" feature.
3. **SMS notifications** — not implemented. Integrate with Bangladesh SMS providers (e.g., SSL Wireless, BD SMS) separately.
4. **Delivery tracking** — order status updates are manual (admin sets status). Real courier API integration is not included.
5. **Multi-currency** — only BDT (৳) is supported.
6. **Rate limiting** — Cloudinary upload rate limiting is implemented via Firestore. Additional rate limiting for other endpoints should use Firebase App Check or a WAF.

---

## Security Considerations

- **Custom claims** are the only trusted role mechanism. Never trust `role` stored in Firestore for authorization.
- **Order creation** is server-side only — clients cannot write to the `orders` collection.
- **Payment amounts** are always recalculated server-side in `createOrder`. Never trust client-reported prices.
- **Cloudinary API Secret** lives only in Firebase Functions config. Never expose it via `VITE_` prefix.
- **Audit logs** are write-protected (Admin SDK only) and provide a tamper-evident trail.
- **Firebase App Check** should be enabled in production to prevent abuse of callable functions.
- Enable **Firebase Security Rules** monitoring and set up alerts for unexpected rule denials.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Follow the TypeScript strict mode guidelines
4. Write Bangla UI text first, English fallback
5. Use brand colors from `src/constants/index.ts`
6. Test with Firebase Emulator Suite before submitting PR
7. Submit a pull request with a clear description

---

*Built with ❤️ for Bangladeshi women* 🇧🇩
