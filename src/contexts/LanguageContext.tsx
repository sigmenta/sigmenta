import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Language, LanguageContextValue } from '@/types';
import { LANGUAGES, STORAGE_KEYS } from '@/constants';

/* ── Translation dictionaries ── */
const translations: Record<Language, Record<string, string>> = {
  bn: {
    // ── Navigation ──
    'nav.home': 'হোম',
    'nav.products': 'পণ্য',
    'nav.categories': 'ক্যাটাগরি',
    'nav.cart': 'কার্ট',
    'nav.wishlist': 'পছন্দের তালিকা',
    'nav.account': 'অ্যাকাউন্ট',
    'nav.search': 'খুঁজুন',
    'nav.login': 'লগইন',
    'nav.register': 'নিবন্ধন',
    'nav.logout': 'লগআউট',

    // ── Common ──
    'common.loading': 'লোড হচ্ছে...',
    'common.error': 'একটি সমস্যা হয়েছে',
    'common.retry': 'আবার চেষ্টা করুন',
    'common.save': 'সংরক্ষণ করুন',
    'common.cancel': 'বাতিল',
    'common.delete': 'মুছুন',
    'common.edit': 'সম্পাদনা',
    'common.confirm': 'নিশ্চিত করুন',
    'common.close': 'বন্ধ করুন',
    'common.back': 'ফিরে যান',
    'common.next': 'পরবর্তী',
    'common.previous': 'পূর্ববর্তী',
    'common.submit': 'জমা দিন',
    'common.update': 'আপডেট',
    'common.view_all': 'সব দেখুন',
    'common.see_more': 'আরও দেখুন',
    'common.no_results': 'কোনো ফলাফল পাওয়া যায়নি',
    'common.empty': 'কিছু নেই',
    'common.required': 'এটি আবশ্যক',
    'common.optional': '(ঐচ্ছিক)',
    'common.or': 'অথবা',
    'common.and': 'এবং',
    'common.of': 'এর মধ্যে',
    'common.items': 'টি পণ্য',
    'common.yes': 'হ্যাঁ',
    'common.no': 'না',
    'common.copy': 'কপি করুন',
    'common.copied': 'কপি হয়েছে!',
    'common.share': 'শেয়ার করুন',
    'common.filter': 'ফিল্টার',
    'common.sort': 'সাজান',
    'common.search': 'খুঁজুন',
    'common.clear': 'মুছুন',
    'common.apply': 'প্রয়োগ করুন',
    'common.reset': 'রিসেট করুন',
    'common.page': 'পৃষ্ঠা',
    'common.taka': '৳',
    'common.free': 'বিনামূল্যে',
    'common.sold': 'বিক্রিত',
    'common.new': 'নতুন',
    'common.sale': 'সেল',
    'common.off': 'ছাড়',

    // ── Products ──
    'product.add_to_cart': 'কার্টে যোগ করুন',
    'product.buy_now': 'এখনই কিনুন',
    'product.add_to_wishlist': 'পছন্দের তালিকায় যোগ করুন',
    'product.remove_from_wishlist': 'পছন্দের তালিকা থেকে সরান',
    'product.out_of_stock': 'স্টকে নেই',
    'product.low_stock': 'সীমিত স্টক',
    'product.in_stock': 'স্টকে আছে',
    'product.sku': 'SKU',
    'product.category': 'ক্যাটাগরি',
    'product.tags': 'ট্যাগ',
    'product.share': 'শেয়ার করুন',
    'product.description': 'বিবরণ',
    'product.specifications': 'বৈশিষ্ট্য',
    'product.reviews': 'রিভিউ',
    'product.related': 'সম্পর্কিত পণ্য',
    'product.select_variant': 'বেছে নিন',
    'product.quantity': 'পরিমাণ',
    'product.regular_price': 'নিয়মিত মূল্য',
    'product.sale_price': 'বিক্রয় মূল্য',
    'product.you_save': 'আপনি বাঁচাচ্ছেন',
    'product.added_to_cart': 'কার্টে যোগ হয়েছে!',
    'product.added_to_wishlist': 'পছন্দের তালিকায় যোগ হয়েছে!',
    'product.no_reviews': 'এখনও কোনো রিভিউ নেই',
    'product.write_review': 'রিভিউ লিখুন',
    'product.filter_by': 'ফিল্টার করুন',
    'product.sort_by': 'সাজান',
    'product.price_range': 'মূল্য পরিসীমা',
    'product.featured': 'ফিচার্ড পণ্য',
    'product.best_sellers': 'সেরা বিক্রিত',
    'product.new_arrivals': 'নতুন আগত',
    'product.trending': 'ট্রেন্ডিং',

    // ── Cart ──
    'cart.title': 'শপিং কার্ট',
    'cart.empty': 'আপনার কার্ট খালি',
    'cart.empty_description': 'কিছু পণ্য কার্টে যোগ করুন',
    'cart.continue_shopping': 'কেনাকাটা চালিয়ে যান',
    'cart.checkout': 'চেকআউট করুন',
    'cart.subtotal': 'মোট পণ্যমূল্য',
    'cart.delivery_fee': 'ডেলিভারি চার্জ',
    'cart.discount': 'ছাড়',
    'cart.total': 'সর্বমোট',
    'cart.remove_item': 'সরিয়ে দিন',
    'cart.update_quantity': 'পরিমাণ আপডেট',
    'cart.coupon_code': 'কুপন কোড',
    'cart.apply_coupon': 'কুপন প্রয়োগ করুন',
    'cart.coupon_applied': 'কুপন সফলভাবে প্রয়োগ হয়েছে!',
    'cart.invalid_coupon': 'অবৈধ বা মেয়াদোত্তীর্ণ কুপন',
    'cart.free_delivery': 'বিনামূল্যে ডেলিভারি',
    'cart.items': 'টি পণ্য',

    // ── Checkout ──
    'checkout.title': 'চেকআউট',
    'checkout.delivery_info': 'ডেলিভারির তথ্য',
    'checkout.full_name': 'পুরো নাম',
    'checkout.phone': 'মোবাইল নম্বর',
    'checkout.address': 'ঠিকানা',
    'checkout.district': 'জেলা',
    'checkout.area': 'এলাকা',
    'checkout.postal_code': 'পোস্টাল কোড',
    'checkout.instructions': 'ডেলিভারির নির্দেশনা',
    'checkout.payment_method': 'পেমেন্ট পদ্ধতি',
    'checkout.place_order': 'অর্ডার করুন',
    'checkout.order_summary': 'অর্ডারের সারসংক্ষেপ',
    'checkout.save_address': 'এই ঠিকানা সংরক্ষণ করুন',
    'checkout.terms_agree': 'আমি শর্তাবলী মেনে নিচ্ছি',

    // ── Orders ──
    'order.my_orders': 'আমার অর্ডার',
    'order.order_details': 'অর্ডারের বিবরণ',
    'order.order_id': 'অর্ডার নম্বর',
    'order.order_date': 'অর্ডারের তারিখ',
    'order.order_status': 'অর্ডারের অবস্থা',
    'order.track_order': 'অর্ডার ট্র্যাক করুন',
    'order.cancel_order': 'অর্ডার বাতিল করুন',
    'order.no_orders': 'কোনো অর্ডার নেই',
    'order.placed': 'অর্ডার করা হয়েছে',
    'order.estimated_delivery': 'আনুমানিক ডেলিভারি',

    // ── Auth ──
    'auth.login': 'লগইন',
    'auth.register': 'নিবন্ধন করুন',
    'auth.logout': 'লগআউট',
    'auth.email': 'ইমেইল',
    'auth.password': 'পাসওয়ার্ড',
    'auth.confirm_password': 'পাসওয়ার্ড নিশ্চিত করুন',
    'auth.name': 'নাম',
    'auth.phone': 'মোবাইল নম্বর',
    'auth.forgot_password': 'পাসওয়ার্ড ভুলে গেছেন?',
    'auth.reset_password': 'পাসওয়ার্ড রিসেট',
    'auth.no_account': 'অ্যাকাউন্ট নেই?',
    'auth.have_account': 'ইতিমধ্যে অ্যাকাউন্ট আছে?',
    'auth.login_success': 'সফলভাবে লগইন হয়েছে!',
    'auth.logout_success': 'সফলভাবে লগআউট হয়েছে',
    'auth.register_success': 'নিবন্ধন সফল হয়েছে!',
    'auth.invalid_credentials': 'ইমেইল বা পাসওয়ার্ড ভুল',
    'auth.email_in_use': 'এই ইমেইলটি ইতিমধ্যে ব্যবহৃত',
    'auth.weak_password': 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে',
    'auth.passwords_mismatch': 'পাসওয়ার্ড মিলছে না',
    'auth.reset_email_sent': 'পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে',
    'auth.user_not_found': 'এই ইমেইলে কোনো অ্যাকাউন্ট নেই',

    // ── Account ──
    'account.profile': 'প্রোফাইল',
    'account.orders': 'অর্ডার',
    'account.addresses': 'ঠিকানা',
    'account.wishlist': 'পছন্দের তালিকা',
    'account.settings': 'সেটিংস',
    'account.delete_account': 'অ্যাকাউন্ট মুছুন',
    'account.edit_profile': 'প্রোফাইল সম্পাদনা',
    'account.add_address': 'নতুন ঠিকানা যোগ করুন',
    'account.default_address': 'ডিফল্ট ঠিকানা',

    // ── Reviews ──
    'review.rating': 'রেটিং',
    'review.review': 'রিভিউ',
    'review.title': 'রিভিউর শিরোনাম',
    'review.write': 'রিভিউ লিখুন',
    'review.submit': 'রিভিউ জমা দিন',
    'review.verified_purchase': 'যাচাইকৃত ক্রয়',
    'review.helpful': 'এটি সহায়ক ছিল',
    'review.pending_approval': 'অনুমোদনের অপেক্ষায়',
    'review.login_required': 'রিভিউ দিতে লগইন করুন',

    // ── Pages ──
    'page.about': 'আমাদের সম্পর্কে',
    'page.contact': 'যোগাযোগ',
    'page.privacy': 'গোপনীয়তা নীতি',
    'page.terms': 'শর্তাবলী',
    'page.refund': 'ফেরত নীতি',
    'page.shipping': 'শিপিং নীতি',
    'page.not_found': 'পৃষ্ঠা পাওয়া যায়নি',
    'page.not_found_description': 'আপনি যে পৃষ্ঠাটি খুঁজছেন তা পাওয়া যায়নি',

    // ── Footer ──
    'footer.quick_links': 'দ্রুত লিংক',
    'footer.customer_service': 'কাস্টমার সেবা',
    'footer.policies': 'নীতিমালা',
    'footer.follow_us': 'আমাদের অনুসরণ করুন',
    'footer.newsletter': 'নিউজলেটার',
    'footer.newsletter_placeholder': 'আপনার ইমেইল দিন',
    'footer.subscribe': 'সাবস্ক্রাইব',
    'footer.rights': 'সর্বস্বত্ব সংরক্ষিত',
    'footer.made_in': 'তৈরি হয়েছে বাংলাদেশে',

    // ── Search ──
    'search.placeholder': 'পণ্য খুঁজুন...',
    'search.results_for': 'এর জন্য ফলাফল',
    'search.no_results': 'কোনো পণ্য পাওয়া যায়নি',
    'search.recent': 'সাম্প্রতিক খোঁজ',
    'search.suggestions': 'পরামর্শ',

    // ── Payment ──
    'payment.cod': 'ক্যাশ অন ডেলিভারি',
    'payment.bkash': 'বিকাশ',
    'payment.nagad': 'নগদ',
    'payment.success': 'পেমেন্ট সফল',
    'payment.failed': 'পেমেন্ট ব্যর্থ',
    'payment.pending': 'পেমেন্ট প্রক্রিয়াধীন',

    // ── Errors ──
    'error.network': 'নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।',
    'error.permission': 'আপনার এই কাজ করার অনুমতি নেই',
    'error.not_found': 'পাওয়া যায়নি',
    'error.server': 'সার্ভার সমস্যা হয়েছে',
    'error.upload_failed': 'আপলোড ব্যর্থ হয়েছে',
    'error.file_too_large': 'ফাইল অনেক বড়',
    'error.invalid_file_type': 'অনুমোদিত ফাইল টাইপ নয়',

    // ── Success ──
    'success.saved': 'সফলভাবে সংরক্ষিত হয়েছে',
    'success.deleted': 'সফলভাবে মুছে গেছে',
    'success.updated': 'সফলভাবে আপডেট হয়েছে',
    'success.order_placed': 'অর্ডার সফলভাবে হয়েছে!',
    'success.review_submitted': 'রিভিউ জমা হয়েছে, অনুমোদনের অপেক্ষায়',

    // ── Announcement ──
    'announcement.default': 'বিশেষ অফারের জন্য আমাদের নিউজলেটার সাবস্ক্রাইব করুন!',

    // ── Trust signals ──
    'trust.free_delivery': 'বিনামূল্যে ডেলিভারি',
    'trust.easy_return': 'সহজ রিটার্ন',
    'trust.secure_payment': 'নিরাপদ পেমেন্ট',
    'trust.authentic': 'অথেনটিক পণ্য',

    // ── Home ──
    'home.categories': 'ক্যাটাগরি',
    'home.reviews': 'গ্রাহকদের মতামত',
    'home.cta_title': 'আপনার পছন্দের পণ্য খুঁজুন',
    'home.cta_subtitle': 'হাজারো প্রিমিয়াম পণ্যের সংগ্রহ থেকে আপনার পছন্দের পণ্যটি বেছে নিন। দ্রুত ডেলিভারি, সহজ রিটার্ন, নিরাপদ পেমেন্ট।',
    'home.view_all_products': 'সব পণ্য দেখুন',

    // ── Products List ──
    'products.all': 'সব পণ্য',
    'products.found_count': 'টি পণ্য পাওয়া গেছে',
    'products.active_filters': 'সক্রিয় ফিল্টার:',
    'products.clear_all': 'সব মুছুন',
    'products.no_products_found': 'কোনো পণ্য পাওয়া যায়নি। ফিল্টার পরিবর্তন করুন।',
    'products.no_products_found_sub': 'কোনো পণ্য পাওয়া যায়নি। অনুগ্রহ করে অন্য ফিল্টার ব্যবহার করুন।',
    'products.load_more': 'আরও লোড করুন',
    'products.sale_items': 'সেল পণ্য',

    // ── Filters ──
    'filter.categories': 'ক্যাটাগরি',
    'filter.min': 'সর্বনিম্ন',
    'filter.max': 'সর্বোচ্চ',
    'filter.stars': 'তারা',
    'filter.stock': 'স্টক',
    'filter.in_stock_only': 'শুধু স্টকে আছে',
    'filter.offers': 'অফার',
    'filter.sale_only': 'শুধু সেলের পণ্য',

    // ── Product Card & Detail ──
    'product.bestseller': 'বেস্টসেলার',
    'product.fast_delivery': 'দ্রুত ডেলিভারি',
    'product.authentic_badge': '১০০% অরিজিনাল',
    'product.easy_return': 'সহজ রিটার্ন',
    'product.write_review_desc': 'আপনার অভিজ্ঞতা বিস্তারিত জানান...',
    'product.submitting': 'জমা হচ্ছে...',
    'product.validating': 'যাচাই হচ্ছে...',

    // ── Checkout ──
    'checkout.step_1': '১',
    'checkout.step_2': '২',
    'checkout.full_name_placeholder': 'পুরো নাম লিখুন',
    'checkout.area_placeholder': 'থানা / এরিয়া (যেমন: মিরপুর, ধানমন্ডি)',
    'checkout.address_full': 'পূর্ণ ডেলিভারি ঠিকানা',
    'checkout.address_placeholder': 'বাড়ি নং, রোড নং, ফ্ল্যাট নং, এলাকার বিস্তারিত ঠিকানা...',
    'checkout.instructions_placeholder': 'বিশেষ কোনো নির্দেশনা থাকলে লিখুন (ঐচ্ছিক)',
    'checkout.cod_title': 'ক্যাশ অন ডেলিভারি (Cash on Delivery)',
    'checkout.popular': 'জনপ্রিয়',
    'checkout.cod_desc': 'পণ্য হাতে পেয়ে দেখে মূল্য পরিশোধ করুন।',
    'checkout.bkash_title': 'বিকাশ পেমেন্ট (bKash)',
    'checkout.bkash_desc': 'বিকাশ গেটওয়ের মাধ্যমে তাৎক্ষণিক ও সুরক্ষিত পেমেন্ট করুন।',
    'checkout.nagad_title': 'নগদ পেমেন্ট (Nagad)',
    'checkout.nagad_desc': 'নগদ ওয়ালেটের মাধ্যমে নিরাপদে মূল্য পরিশোধ করুন।',
    'checkout.delivery_charge_for': 'ডেলিভারি চার্জ',
    'checkout.processing': 'অর্ডার প্রক্রিয়াধীন...',
    'checkout.est_delivery': 'আনুমানিক ডেলিভারি:',
    'checkout.order_sms_notice': 'অর্ডার সংক্রান্ত যেকোনো আপডেট এসএমএস ও ফোন কলের মাধ্যমে জানানো হবে।',
    'checkout.quantity': 'পরিমাণ',
    'checkout.days_dhaka': '২-৩ দিন',
    'checkout.days_outside': '৩-৫ দিন',
  },

  en: {
    // ── Navigation ──
    'nav.home': 'Home',
    'nav.products': 'Products',
    'nav.categories': 'Categories',
    'nav.cart': 'Cart',
    'nav.wishlist': 'Wishlist',
    'nav.account': 'Account',
    'nav.search': 'Search',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.logout': 'Logout',

    // ── Common ──
    'common.loading': 'Loading...',
    'common.error': 'Something went wrong',
    'common.retry': 'Try Again',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.confirm': 'Confirm',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.submit': 'Submit',
    'common.update': 'Update',
    'common.view_all': 'View All',
    'common.see_more': 'See More',
    'common.no_results': 'No results found',
    'common.empty': 'Empty',
    'common.required': 'This is required',
    'common.optional': '(optional)',
    'common.or': 'or',
    'common.and': 'and',
    'common.of': 'of',
    'common.items': 'items',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.copy': 'Copy',
    'common.copied': 'Copied!',
    'common.share': 'Share',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.search': 'Search',
    'common.clear': 'Clear',
    'common.apply': 'Apply',
    'common.reset': 'Reset',
    'common.page': 'Page',
    'common.taka': '৳',
    'common.free': 'Free',
    'common.sold': 'Sold',
    'common.new': 'New',
    'common.sale': 'Sale',
    'common.off': 'off',

    // ── Products ──
    'product.add_to_cart': 'Add to Cart',
    'product.buy_now': 'Buy Now',
    'product.add_to_wishlist': 'Add to Wishlist',
    'product.remove_from_wishlist': 'Remove from Wishlist',
    'product.out_of_stock': 'Out of Stock',
    'product.low_stock': 'Low Stock',
    'product.in_stock': 'In Stock',
    'product.sku': 'SKU',
    'product.category': 'Category',
    'product.tags': 'Tags',
    'product.share': 'Share',
    'product.description': 'Description',
    'product.specifications': 'Specifications',
    'product.reviews': 'Reviews',
    'product.related': 'Related Products',
    'product.select_variant': 'Select',
    'product.quantity': 'Quantity',
    'product.regular_price': 'Regular Price',
    'product.sale_price': 'Sale Price',
    'product.you_save': 'You save',
    'product.added_to_cart': 'Added to cart!',
    'product.added_to_wishlist': 'Added to wishlist!',
    'product.no_reviews': 'No reviews yet',
    'product.write_review': 'Write a Review',
    'product.filter_by': 'Filter by',
    'product.sort_by': 'Sort by',
    'product.price_range': 'Price Range',
    'product.featured': 'Featured Products',
    'product.best_sellers': 'Best Sellers',
    'product.new_arrivals': 'New Arrivals',
    'product.trending': 'Trending',

    // ── Cart ──
    'cart.title': 'Shopping Cart',
    'cart.empty': 'Your cart is empty',
    'cart.empty_description': 'Add some products to your cart',
    'cart.continue_shopping': 'Continue Shopping',
    'cart.checkout': 'Checkout',
    'cart.subtotal': 'Subtotal',
    'cart.delivery_fee': 'Delivery Fee',
    'cart.discount': 'Discount',
    'cart.total': 'Total',
    'cart.remove_item': 'Remove',
    'cart.update_quantity': 'Update Quantity',
    'cart.coupon_code': 'Coupon Code',
    'cart.apply_coupon': 'Apply Coupon',
    'cart.coupon_applied': 'Coupon applied successfully!',
    'cart.invalid_coupon': 'Invalid or expired coupon',
    'cart.free_delivery': 'Free Delivery',
    'cart.items': 'items',

    // ── Checkout ──
    'checkout.title': 'Checkout',
    'checkout.delivery_info': 'Delivery Information',
    'checkout.full_name': 'Full Name',
    'checkout.phone': 'Phone Number',
    'checkout.address': 'Address',
    'checkout.district': 'District',
    'checkout.area': 'Area',
    'checkout.postal_code': 'Postal Code',
    'checkout.instructions': 'Delivery Instructions',
    'checkout.payment_method': 'Payment Method',
    'checkout.place_order': 'Place Order',
    'checkout.order_summary': 'Order Summary',
    'checkout.save_address': 'Save this address',
    'checkout.terms_agree': 'I agree to the terms and conditions',

    // ── Orders ──
    'order.my_orders': 'My Orders',
    'order.order_details': 'Order Details',
    'order.order_id': 'Order ID',
    'order.order_date': 'Order Date',
    'order.order_status': 'Order Status',
    'order.track_order': 'Track Order',
    'order.cancel_order': 'Cancel Order',
    'order.no_orders': 'No orders yet',
    'order.placed': 'Order Placed',
    'order.estimated_delivery': 'Estimated Delivery',

    // ── Auth ──
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.logout': 'Logout',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirm_password': 'Confirm Password',
    'auth.name': 'Name',
    'auth.phone': 'Phone Number',
    'auth.forgot_password': 'Forgot Password?',
    'auth.reset_password': 'Reset Password',
    'auth.no_account': "Don't have an account?",
    'auth.have_account': 'Already have an account?',
    'auth.login_success': 'Logged in successfully!',
    'auth.logout_success': 'Logged out successfully',
    'auth.register_success': 'Registration successful!',
    'auth.invalid_credentials': 'Invalid email or password',
    'auth.email_in_use': 'This email is already registered',
    'auth.weak_password': 'Password must be at least 8 characters',
    'auth.passwords_mismatch': "Passwords don't match",
    'auth.reset_email_sent': 'Password reset link sent to your email',
    'auth.user_not_found': 'No account found with this email',

    // ── Account ──
    'account.profile': 'Profile',
    'account.orders': 'Orders',
    'account.addresses': 'Addresses',
    'account.wishlist': 'Wishlist',
    'account.settings': 'Settings',
    'account.delete_account': 'Delete Account',
    'account.edit_profile': 'Edit Profile',
    'account.add_address': 'Add New Address',
    'account.default_address': 'Default Address',

    // ── Reviews ──
    'review.rating': 'Rating',
    'review.review': 'Review',
    'review.title': 'Review Title',
    'review.write': 'Write a Review',
    'review.submit': 'Submit Review',
    'review.verified_purchase': 'Verified Purchase',
    'review.helpful': 'Helpful',
    'review.pending_approval': 'Pending Approval',
    'review.login_required': 'Login to write a review',

    // ── Pages ──
    'page.about': 'About Us',
    'page.contact': 'Contact Us',
    'page.privacy': 'Privacy Policy',
    'page.terms': 'Terms & Conditions',
    'page.refund': 'Refund Policy',
    'page.shipping': 'Shipping Policy',
    'page.not_found': 'Page Not Found',
    'page.not_found_description': 'The page you are looking for does not exist',

    // ── Footer ──
    'footer.quick_links': 'Quick Links',
    'footer.customer_service': 'Customer Service',
    'footer.policies': 'Policies',
    'footer.follow_us': 'Follow Us',
    'footer.newsletter': 'Newsletter',
    'footer.newsletter_placeholder': 'Enter your email',
    'footer.subscribe': 'Subscribe',
    'footer.rights': 'All rights reserved',
    'footer.made_in': 'Made in Bangladesh',

    // ── Search ──
    'search.placeholder': 'Search products...',
    'search.results_for': 'Results for',
    'search.no_results': 'No products found',
    'search.recent': 'Recent Searches',
    'search.suggestions': 'Suggestions',

    // ── Payment ──
    'payment.cod': 'Cash on Delivery',
    'payment.bkash': 'bKash',
    'payment.nagad': 'Nagad',
    'payment.success': 'Payment Successful',
    'payment.failed': 'Payment Failed',
    'payment.pending': 'Payment Pending',

    // ── Errors ──
    'error.network': 'Network error. Please try again.',
    'error.permission': 'You do not have permission to do this',
    'error.not_found': 'Not found',
    'error.server': 'Server error occurred',
    'error.upload_failed': 'Upload failed',
    'error.file_too_large': 'File is too large',
    'error.invalid_file_type': 'File type not allowed',

    // ── Success ──
    'success.saved': 'Saved successfully',
    'success.deleted': 'Deleted successfully',
    'success.updated': 'Updated successfully',
    'success.order_placed': 'Order placed successfully!',
    'success.review_submitted': 'Review submitted, pending approval',

    // ── Announcement ──
    'announcement.default': 'Subscribe to our newsletter for exclusive offers!',

    // ── Trust signals ──
    'trust.free_delivery': 'Free Delivery',
    'trust.easy_return': 'Easy Returns',
    'trust.secure_payment': 'Secure Payment',
    'trust.authentic': 'Authentic Products',

    // ── Home ──
    'home.categories': 'Categories',
    'home.reviews': 'Customer Reviews',
    'home.cta_title': 'Find Your Favorite Products',
    'home.cta_subtitle': 'Choose from thousands of premium products. Fast delivery, easy returns, and secure payment.',
    'home.view_all_products': 'View All Products',

    // ── Products List ──
    'products.all': 'All Products',
    'products.found_count': 'products found',
    'products.active_filters': 'Active Filters:',
    'products.clear_all': 'Clear All',
    'products.no_products_found': 'No products found. Please change filters.',
    'products.no_products_found_sub': 'No products found. Please try another filter.',
    'products.load_more': 'Load More',
    'products.sale_items': 'Sale Items',

    // ── Filters ──
    'filter.categories': 'Categories',
    'filter.min': 'Min',
    'filter.max': 'Max',
    'filter.stars': 'Stars',
    'filter.stock': 'Stock',
    'filter.in_stock_only': 'In stock only',
    'filter.offers': 'Offers',
    'filter.sale_only': 'Sale items only',

    // ── Product Card & Detail ──
    'product.bestseller': 'Bestseller',
    'product.fast_delivery': 'Fast Delivery',
    'product.authentic_badge': '100% Authentic',
    'product.easy_return': 'Easy Return',
    'product.write_review_desc': 'Share your detailed experience...',
    'product.submitting': 'Submitting...',
    'product.validating': 'Validating...',

    // ── Checkout ──
    'checkout.step_1': '1',
    'checkout.step_2': '2',
    'checkout.full_name_placeholder': 'Enter full name',
    'checkout.area_placeholder': 'Thana / Area (e.g. Mirpur, Dhanmondi)',
    'checkout.address_full': 'Full Delivery Address',
    'checkout.address_placeholder': 'House no, Road no, Flat no, Detailed area address...',
    'checkout.instructions_placeholder': 'Any special instructions (optional)',
    'checkout.cod_title': 'Cash on Delivery (COD)',
    'checkout.popular': 'Popular',
    'checkout.cod_desc': 'Pay with cash upon delivery after checking the product.',
    'checkout.bkash_title': 'bKash Payment',
    'checkout.bkash_desc': 'Pay instantly and securely via bKash gateway.',
    'checkout.nagad_title': 'Nagad Payment',
    'checkout.nagad_desc': 'Pay securely through Nagad wallet.',
    'checkout.delivery_charge_for': 'Delivery Fee',
    'checkout.processing': 'Processing order...',
    'checkout.est_delivery': 'Estimated Delivery:',
    'checkout.order_sms_notice': 'Order updates will be communicated via SMS and phone call.',
    'checkout.quantity': 'Qty',
    'checkout.days_dhaka': '2-3 days',
    'checkout.days_outside': '3-5 days',
  },
};

/* ── Context ── */
const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

/* ── Provider ── */
interface LanguageProviderProps {
  children: React.ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LANGUAGE) as Language | null;
      if (stored && Object.values(LANGUAGES).includes(stored)) {
        return stored;
      }
    } catch {
      // localStorage not available
    }
    return LANGUAGES.BN; // Default to Bangla
  });

  /* Sync lang attribute on <html> */
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = 'ltr'; // Both BN and EN are LTR
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  /**
   * Translate a key. Falls back to English, then returns the key itself.
   */
  const t = useCallback(
    (key: string): string => {
      return (
        translations[language]?.[key] ??
        translations['en']?.[key] ??
        key
      );
    },
    [language]
  );

  const value: LanguageContextValue = {
    language,
    setLanguage,
    t,
    isBangla: language === LANGUAGES.BN,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

/* ── Hook ── */
export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;
