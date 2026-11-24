import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FileText, Clock, AlertCircle } from 'lucide-react';
import { settingsService } from '@/services/settingsService';
import { sanitizeHtml, formatDate } from '@/utils';
import { BRAND, LEGAL_PAGE_KEYS } from '@/constants';
import type { LegalPage as LegalPageType, LegalPageKey } from '@/types';

interface LegalPageProps {
  pageKey?: LegalPageKey;
}

const DEFAULT_TITLES: Record<string, string> = {
  'privacy-policy': 'গোপনীয়তা নীতি (Privacy Policy)',
  'terms-and-conditions': 'শর্তাবলী ও নীতিমালা (Terms & Conditions)',
  'refund-policy': 'রিফান্ড ও রিটার্ন নীতি (Refund & Return Policy)',
  'shipping-policy': 'শিপিং ও ডেলিভারি নীতি (Shipping & Delivery Policy)',
};

const DEFAULT_FALLBACKS: Record<string, string> = {
  'privacy-policy': `
    <h2>গোপনীয়তা নীতি</h2>
    <p>সর্বশেষ আপডেট: অক্টোবর ২০২৬</p>

    <h3>১. ভূমিকা</h3>
    <p>Sigmenta ("আমরা", "আমাদের") এ আপনার গোপনীয়তা সুরক্ষা আমাদের সর্বোচ্চ অগ্রাধিকার। এই গোপনীয়তা নীতিতে বর্ণনা করা হয়েছে আমরা কীভাবে আপনার ব্যক্তিগত তথ্য সংগ্রহ, ব্যবহার ও সুরক্ষা করি। আমাদের ওয়েবসাইট ব্যবহার করে আপনি এই নীতির শর্তে সম্মত হচ্ছেন।</p>

    <h3>২. আমরা কী তথ্য সংগ্রহ করি</h3>
    <p>আমরা নিম্নলিখিত তথ্য সংগ্রহ করতে পারি:</p>
    <ul>
      <li><strong>পরিচয় সংক্রান্ত তথ্য:</strong> নাম, ইমেইল ঠিকানা, মোবাইল নম্বর</li>
      <li><strong>ডেলিভারি সংক্রান্ত তথ্য:</strong> বাড়ির ঠিকানা, জেলা, এলাকা</li>
      <li><strong>লেনদেন সংক্রান্ত তথ্য:</strong> ক্রয়ের ইতিহাস, অর্ডার বিবরণ</li>
      <li><strong>প্রযুক্তিগত তথ্য:</strong> আইপি ঠিকানা, ব্রাউজার প্রকার, ডিভাইস তথ্য</li>
      <li><strong>ব্যবহার সংক্রান্ত তথ্য:</strong> আপনি কোন পণ্য দেখেছেন, কোন পাতায় কত সময় থেকেছেন</li>
    </ul>

    <h3>৩. তথ্য ব্যবহারের উদ্দেশ্য</h3>
    <p>সংগৃহীত তথ্য কেবলমাত্র নিম্নলিখিত উদ্দেশ্যে ব্যবহার করা হয়:</p>
    <ul>
      <li>অর্ডার প্রক্রিয়াকরণ এবং ডেলিভারি নিশ্চিতকরণ</li>
      <li>গ্রাহক সেবা ও অভিযোগ সমাধান</li>
      <li>নতুন পণ্য, অফার ও অবকাঠামো সম্পর্কে আপনাকে অবগত করা (শুধুমাত্র আপনার সম্মতিতে)</li>
      <li>আমাদের পরিষেবার মান উন্নয়ন</li>
      <li>জালিয়াতি প্রতিরোধ ও নিরাপত্তা নিশ্চিতকরণ</li>
    </ul>

    <h3>৪. তথ্যের নিরাপত্তা ও সুরক্ষা</h3>
    <p>আমরা আপনার তথ্য সুরক্ষার জন্য শিল্প-মানের নিরাপত্তা ব্যবস্থা প্রয়োগ করি। আপনার পাসওয়ার্ড এনক্রিপ্টেড আকারে সংরক্ষণ করা হয়। পেমেন্ট তথ্য নিরাপদ গেটওয়ের মাধ্যমে প্রক্রিয়া করা হয় — আমরা আপনার কার্ড বা মোবাইল ব্যাংকিং পিন কখনও সংরক্ষণ করি না।</p>

    <h3>৫. তথ্য তৃতীয় পক্ষের সাথে শেয়ার</h3>
    <p>আমরা কখনই আপনার ব্যক্তিগত তথ্য তৃতীয় পক্ষের কাছে বিক্রি করি না। তবে ডেলিভারি সম্পন্ন করতে কুরিয়ার সার্ভিস প্রদানকারীর সাথে প্রয়োজনীয় তথ্য (নাম, ফোন, ঠিকানা) শেয়ার করা হতে পারে। এছাড়া আইনি বাধ্যবাধকতার ক্ষেত্রে কর্তৃপক্ষের অনুরোধে তথ্য প্রদান করা হতে পারে।</p>

    <h3>৬. কুকিজ ও ট্র্যাকিং</h3>
    <p>আমাদের ওয়েবসাইট কার্যকর অভিজ্ঞতা প্রদানের জন্য কুকিজ ব্যবহার করে। আপনি ব্রাউজার সেটিংস থেকে কুকিজ নিষ্ক্রিয় করতে পারেন, তবে এতে কিছু সুবিধা সীমিত হয়ে যেতে পারে।</p>

    <h3>৭. আপনার অধিকার</h3>
    <p>আপনার নিম্নলিখিত অধিকার রয়েছে:</p>
    <ul>
      <li>আপনার সংরক্ষিত তথ্য দেখার অধিকার</li>
      <li>ভুল তথ্য সংশোধনের অনুরোধ করার অধিকার</li>
      <li>আপনার অ্যাকাউন্ট মুছে ফেলার অনুরোধ করার অধিকার</li>
      <li>বিপণন যোগাযোগ থেকে অপ্ট-আউট করার অধিকার</li>
    </ul>

    <h3>৮. যোগাযোগ</h3>
    <p>গোপনীয়তা সংক্রান্ত যেকোনো প্রশ্ন বা অভিযোগের জন্য আমাদের সাথে যোগাযোগ করুন:<br/>
    📧 ইমেইল: support@sigmenta.com<br/>
    📞 হেল্পলাইন: +880 1620 605353</p>
  `,

  'terms-and-conditions': `
    <h2>শর্তাবলী ও নীতিমালা</h2>
    <p>সর্বশেষ আপডেট: অক্টোবর ২০২৬</p>

    <h3>১. সম্মতি ও গ্রহণযোগ্যতা</h3>
    <p>Sigmenta ওয়েবসাইটে প্রবেশ, ব্রাউজ বা কেনাকাটা করার মাধ্যমে আপনি এই শর্তাবলী পড়েছেন এবং সম্পূর্ণরূপে মেনে নিতে সম্মত হচ্ছেন বলে গণ্য করা হবে। আপনি যদি এই শর্তাবলীতে সম্মত না হন, তাহলে আমাদের ওয়েবসাইট ব্যবহার থেকে বিরত থাকুন।</p>

    <h3>২. অ্যাকাউন্ট ও নিবন্ধন</h3>
    <ul>
      <li>অ্যাকাউন্ট খোলার সময় আপনাকে সঠিক ও সত্য তথ্য প্রদান করতে হবে।</li>
      <li>আপনার অ্যাকাউন্ট পাসওয়ার্ড ও নিরাপত্তার দায়িত্ব সম্পূর্ণ আপনার।</li>
      <li>অ্যাকাউন্টে কোনো সন্দেহজনক কার্যক্রম দেখলে তাৎক্ষণিক আমাদের জানান।</li>
      <li>একটি ব্যক্তি একটিমাত্র অ্যাকাউন্ট খুলতে পারবেন।</li>
    </ul>

    <h3>৩. পণ্যের তথ্য ও মূল্য</h3>
    <ul>
      <li>আমরা পণ্যের সঠিক বিবরণ ও ছবি প্রদানের চেষ্টা করি, তবে রঙ সামান্য ভিন্ন দেখাতে পারে (স্ক্রিনের বৈচিত্র্যের কারণে)।</li>
      <li>সকল মূল্য বাংলাদেশি টাকায় (৳) প্রদর্শিত এবং ডেলিভারি চার্জ আলাদাভাবে প্রযোজ্য।</li>
      <li>পণ্যের মজুদ শেষ হলে বা অনিচ্ছাকৃত মূল্য-ভুল পরিলক্ষিত হলে আমরা অর্ডার বাতিল করার অধিকার সংরক্ষণ করি এবং গ্রাহককে অবহিত করব।</li>
    </ul>

    <h3>৪. অর্ডার ও পেমেন্ট</h3>
    <ul>
      <li>অর্ডার সম্পন্ন হলে আপনার নিবন্ধিত নম্বরে/ইমেইলে নিশ্চিতকরণ বার্তা পাঠানো হবে।</li>
      <li>ক্যাশ অন ডেলিভারি (COD) অর্ডারের ক্ষেত্রে পণ্য গ্রহণের সময় নগদ অর্থ পরিশোধ করতে হবে।</li>
      <li>অনলাইন পেমেন্টের ক্ষেত্রে নিরাপদ পেমেন্ট গেটওয়ে ব্যবহার করা হয়।</li>
    </ul>

    <h3>৫. অর্ডার বাতিল</h3>
    <ul>
      <li>অর্ডার "অপেক্ষমাণ" অবস্থায় থাকলে গ্রাহক নিজে বাতিল করতে পারবেন।</li>
      <li>একবার "নিশ্চিত" বা তার পরবর্তী পর্যায়ে গেলে অর্ডার বাতিলের জন্য সরাসরি আমাদের সাথে যোগাযোগ করুন।</li>
      <li>গ্রাহক কর্তৃক বাতিলের ক্ষেত্রে অনলাইনে পরিশোধিত অর্থ ৫-৭ কার্যদিবসের মধ্যে ফেরত দেওয়া হবে।</li>
    </ul>

    <h3>৬. বৌদ্ধিক সম্পদ অধিকার</h3>
    <p>এই ওয়েবসাইটের সকল বিষয়বস্তু (লোগো, ছবি, টেক্সট, ডিজাইন) Sigmenta-এর মালিকানাধীন। পূর্ব অনুমতি ছাড়া কোনো বিষয়বস্তু অনুলিপি, বিতরণ বা ব্যবহার করা যাবে না।</p>

    <h3>৭. দায়বদ্ধতার সীমাবদ্ধতা</h3>
    <p>আমরা সর্বোচ্চ সেবা নিশ্চিত করার চেষ্টা করি। তবে প্রাকৃতিক দুর্যোগ, হরতাল, ইন্টারনেট বিভ্রাট বা অন্য কোনো অনিবার্য পরিস্থিতিতে সেবায় বিঘ্ন ঘটলে আমরা দায়ী থাকব না।</p>

    <h3>৮. প্রযোজ্য আইন</h3>
    <p>এই শর্তাবলী বাংলাদেশের আইন অনুযায়ী পরিচালিত হবে। যেকোনো বিরোধের ক্ষেত্রে বাংলাদেশের আদালতের এখতিয়ার প্রযোজ্য হবে।</p>

    <h3>৯. শর্তাবলী পরিবর্তন</h3>
    <p>Sigmenta যেকোনো সময় এই শর্তাবলী পরিবর্তন করার অধিকার রাখে। পরিবর্তিত শর্ত ওয়েবসাইটে প্রকাশিত হওয়ার পর থেকে কার্যকর হবে।</p>

    <h3>১০. যোগাযোগ</h3>
    <p>📧 ইমেইল: support@sigmenta.com<br/>
    📞 হেল্পলাইন: +880 1620 605353<br/>
    🕐 সময়: সকাল ১০টা – রাত ৮টা (শুক্রবার বন্ধ)</p>
  `,

  'refund-policy': `
    <h2>রিফান্ড ও রিটার্ন নীতি</h2>
    <p>সর্বশেষ আপডেট: অক্টোবর ২০২৬</p>

    <p>Sigmenta-এ আমরা আপনার সন্তুষ্টিকে সর্বোচ্চ গুরুত্ব দিই। আমাদের রিটার্ন ও রিফান্ড নীতি নিম্নরূপ:</p>

    <h3>১. রিটার্ন যোগ্য পরিস্থিতি</h3>
    <p>নিম্নলিখিত ক্ষেত্রে পণ্য রিটার্ন গ্রহণযোগ্য:</p>
    <ul>
      <li><strong>ক্ষতিগ্রস্ত পণ্য:</strong> ডেলিভারির সময় পণ্য ভাঙা বা ক্ষতিগ্রস্ত অবস্থায় পেলে</li>
      <li><strong>ভুল পণ্য:</strong> অর্ডার করা পণ্যের বদলে ভিন্ন পণ্য ডেলিভারি হলে</li>
      <li><strong>ত্রুটিপূর্ণ পণ্য:</strong> উৎপাদন ত্রুটির কারণে পণ্যে সমস্যা থাকলে</li>
      <li><strong>অসম্পূর্ণ অর্ডার:</strong> অর্ডারের কিছু অংশ না পেলে</li>
    </ul>

    <h3>২. রিটার্নের সময়সীমা</h3>
    <ul>
      <li>পণ্য পাওয়ার <strong>৪৮ ঘন্টার মধ্যে</strong> সমস্যা জানাতে হবে।</li>
      <li>COD অর্ডারের ক্ষেত্রে ডেলিভারিম্যানের সামনেই পণ্য যাচাই করুন — সমস্যা থাকলে তাৎক্ষণিকভাবে গ্রহণ না করে আমাদের জানান।</li>
    </ul>

    <h3>৩. রিটার্ন গ্রহণযোগ্য নয় যেসব ক্ষেত্রে</h3>
    <ul>
      <li>পণ্য ব্যবহার করার পরে বা ট্যাগ/মোড়ক খোলার পরে</li>
      <li>গ্রাহকের অবহেলায় বা দুর্ঘটনায় ক্ষতিগ্রস্ত পণ্য</li>
      <li>ব্যক্তিগত পছন্দ বা রঙ ভিন্ন দেখানোর কারণ (স্ক্রিনের পার্থক্য)</li>
      <li>সেল/ছাড়ে কেনা পণ্য (বিশেষ উল্লেখ না থাকলে)</li>
    </ul>

    <h3>৪. রিটার্ন প্রক্রিয়া</h3>
    <ol>
      <li>প্রথমে আমাদের হেল্পলাইনে (+880 1620 605353) ফোন করুন বা ইমেইল করুন।</li>
      <li>পণ্যের ছবি এবং সমস্যার বিবরণ পাঠান।</li>
      <li>আমাদের টিম ২৪ ঘন্টার মধ্যে সমাধান দেবে।</li>
      <li>রিটার্ন অনুমোদিত হলে পণ্য পিকআপের ব্যবস্থা করা হবে।</li>
    </ol>

    <h3>৫. রিফান্ড প্রক্রিয়া ও সময়সীমা</h3>
    <table style="width:100%; border-collapse:collapse; font-size:13px;">
      <tr style="background:#FFF0F5; font-weight:bold;">
        <td style="padding:8px; border:1px solid #F0E2E8;">পেমেন্ট পদ্ধতি</td>
        <td style="padding:8px; border:1px solid #F0E2E8;">রিফান্ড সময়</td>
        <td style="padding:8px; border:1px solid #F0E2E8;">রিফান্ড মাধ্যম</td>
      </tr>
      <tr>
        <td style="padding:8px; border:1px solid #F0E2E8;">বিকাশ</td>
        <td style="padding:8px; border:1px solid #F0E2E8;">৩-৫ কার্যদিবস</td>
        <td style="padding:8px; border:1px solid #F0E2E8;">বিকাশ নম্বরে</td>
      </tr>
      <tr>
        <td style="padding:8px; border:1px solid #F0E2E8;">নগদ</td>
        <td style="padding:8px; border:1px solid #F0E2E8;">৩-৫ কার্যদিবস</td>
        <td style="padding:8px; border:1px solid #F0E2E8;">নগদ নম্বরে</td>
      </tr>
      <tr>
        <td style="padding:8px; border:1px solid #F0E2E8;">ক্যাশ অন ডেলিভারি</td>
        <td style="padding:8px; border:1px solid #F0E2E8;">পণ্য ফেরতের সময়ই</td>
        <td style="padding:8px; border:1px solid #F0E2E8;">নগদ বা বিকাশে</td>
      </tr>
    </table>

    <h3>৬. এক্সচেঞ্জ বিকল্প</h3>
    <p>রিফান্ডের পরিবর্তে আপনি চাইলে একই মূল্যের অন্য পণ্যের সাথে এক্সচেঞ্জ করতে পারবেন। এক্ষেত্রে ডেলিভারি চার্জ মওকুফ করা হবে।</p>

    <h3>৭. যোগাযোগ</h3>
    <p>📞 হেল্পলাইন: +880 1620 605353<br/>
    📧 ইমেইল: support@sigmenta.com<br/>
    🕐 সময়: সকাল ১০টা – রাত ৮টা</p>
  `,

  'shipping-policy': `
    <h2>শিপিং ও ডেলিভারি নীতি</h2>
    <p>সর্বশেষ আপডেট: অক্টোবর ২০২৬</p>

    <p>Sigmenta সারা বাংলাদেশে দ্রুত ও নিরাপদ ডেলিভারি নিশ্চিত করে। আমাদের ডেলিভারি নীতি সম্পর্কে নিচে বিস্তারিত জানুন।</p>

    <h3>১. ডেলিভারি এলাকা</h3>
    <p>আমরা বর্তমানে <strong>সমগ্র বাংলাদেশে</strong> ডেলিভারি দিয়ে থাকি। দ্বীপ বা দুর্গম এলাকায় ডেলিভারির ক্ষেত্রে অতিরিক্ত সময় লাগতে পারে।</p>

    <h3>২. ডেলিভারি চার্জ</h3>
    <table style="width:100%; border-collapse:collapse; font-size:13px;">
      <tr style="background:#FFF0F5; font-weight:bold;">
        <td style="padding:8px; border:1px solid #F0E2E8;">এলাকা</td>
        <td style="padding:8px; border:1px solid #F0E2E8;">ডেলিভারি চার্জ</td>
        <td style="padding:8px; border:1px solid #F0E2E8;">আনুমানিক সময়</td>
      </tr>
      <tr>
        <td style="padding:8px; border:1px solid #F0E2E8;">ঢাকা মেট্রোপলিটন (ভেতরে)</td>
        <td style="padding:8px; border:1px solid #F0E2E8;">৳৭০</td>
        <td style="padding:8px; border:1px solid #F0E2E8;">১-২ কার্যদিবস</td>
      </tr>
      <tr>
        <td style="padding:8px; border:1px solid #F0E2E8;">ঢাকার বাইরে (সারাদেশে)</td>
        <td style="padding:8px; border:1px solid #F0E2E8;">৳১২০ / ৳১৩০</td>
        <td style="padding:8px; border:1px solid #F0E2E8;">২-৪ কার্যদিবস</td>
      </tr>
    </table>
    <p><em>* নির্দিষ্ট পরিমাণের বেশি অর্ডারে বিনামূল্যে ডেলিভারি পাওয়া যেতে পারে। বিস্তারিত ওয়েবসাইটে দেখুন।</em></p>

    <h3>৩. অর্ডার প্রক্রিয়াকরণ সময়</h3>
    <ul>
      <li>প্রতিটি অর্ডার নিশ্চিত হওয়ার পর <strong>২৪ ঘন্টার মধ্যে</strong> প্যাকেজিং ও শিপমেন্ট শুরু হয়।</li>
      <li>শুক্রবার এবং সরকারি ছুটির দিনে অর্ডার প্রক্রিয়া হয় না — পরবর্তী কার্যদিবসে প্রক্রিয়া শুরু হবে।</li>
    </ul>

    <h3>৪. ডেলিভারি ট্র্যাকিং</h3>
    <p>পণ্য শিপ হওয়ার পরে আপনার নিবন্ধিত মোবাইল নম্বরে SMS এবং/অথবা ইমেইলে ট্র্যাকিং তথ্য পাঠানো হবে। আপনি আমাদের ওয়েবসাইটের "আমার অর্ডার" বিভাগ থেকেও অর্ডারের বর্তমান অবস্থা জানতে পারবেন।</p>

    <h3>৫. ডেলিভারি গ্রহণ</h3>
    <ul>
      <li>ডেলিভারিম্যান আসার আগে ফোনে যোগাযোগ করবেন।</li>
      <li>পণ্য গ্রহণের আগে অবশ্যই প্যাকেজিং পরীক্ষা করুন।</li>
      <li>কোনো সমস্যা থাকলে ডেলিভারিম্যানের সামনেই পণ্য গ্রহণ না করে আমাদের হেল্পলাইনে জানান।</li>
      <li>তিনবার ডেলিভারি প্রচেষ্টার পরেও না পাওয়া গেলে অর্ডার বাতিল হতে পারে।</li>
    </ul>

    <h3>৬. বিশেষ পরিস্থিতিতে বিলম্ব</h3>
    <p>নিচের পরিস্থিতিতে ডেলিভারিতে স্বাভাবিকের চেয়ে বেশি সময় লাগতে পারে:</p>
    <ul>
      <li>প্রাকৃতিক দুর্যোগ বা অতিরিক্ত বৃষ্টিপাত</li>
      <li>হরতাল বা অবরোধ পরিস্থিতি</li>
      <li>ঈদ বা অন্য উৎসবের সময় অতিরিক্ত চাহিদা</li>
      <li>দুর্গম বা নতুন এলাকায় ডেলিভারি</li>
    </ul>

    <h3>৭. হারানো বা ক্ষতিগ্রস্ত পার্সেল</h3>
    <p>শিপমেন্টের সময় পণ্য হারিয়ে গেলে বা ক্ষতিগ্রস্ত হলে আমরা সম্পূর্ণ দায়িত্ব নিয়ে বিনামূল্যে পুনরায় পণ্য পাঠাব বা সম্পূর্ণ রিফান্ড দেব।</p>

    <h3>৮. যোগাযোগ</h3>
    <p>ডেলিভারি সংক্রান্ত যেকোনো সমস্যায়:<br/>
    📞 হেল্পলাইন: +880 1620 605353<br/>
    📧 ইমেইল: support@sigmenta.com<br/>
    🕐 সময়: সকাল ১০টা – রাত ৮টা (শুক্রবার বন্ধ)</p>
  `,
};

export const LegalPage: React.FC<LegalPageProps> = ({ pageKey: propPageKey }) => {
  const location = useLocation();

  // Determine key either from prop or URL pathname
  let currentKey: LegalPageKey = 'privacy-policy';
  if (propPageKey) {
    currentKey = propPageKey;
  } else {
    const path = location.pathname;
    if (path.includes('terms')) currentKey = 'terms-and-conditions';
    else if (path.includes('refund')) currentKey = 'refund-policy';
    else if (path.includes('shipping')) currentKey = 'shipping-policy';
    else currentKey = 'privacy-policy';
  }

  const [legalData, setLegalData] = useState<LegalPageType | null>(null);

  useEffect(() => {
    let isMounted = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Background fetch any admin updates from Firestore
    settingsService.getLegalPage(currentKey)
      .then((data: any) => {
        if (isMounted && data?.contentBn) setLegalData(data);
      })
      .catch(() => {
        // Fallback content is already rendered immediately
      });

    return () => { isMounted = false; };
  }, [currentKey]);

  const pageTitle = legalData?.titleBn || DEFAULT_TITLES[currentKey] || 'আইনি নীতিমালা';
  const pageContent = legalData?.contentBn || DEFAULT_FALLBACKS[currentKey] || '';

  return (
    <>
      <Helmet>
        <title>{`${pageTitle} — ${BRAND.nameBn}`}</title>
      </Helmet>

      <div className="max-w-content mx-auto px-4 py-8 font-bangla">
        <div className="max-w-3xl mx-auto bg-white border border-[#F0E2E8] rounded-3xl p-6 md:p-12 shadow-sm">
          {/* Header */}
          <div className="border-b border-[#F0E2E8] pb-6 mb-8">
            <div className="flex items-center gap-2 text-xs font-bold text-[#D45D83] mb-2 uppercase tracking-wider">
              <FileText className="w-4 h-4" />
              <span>Sigmenta নীতিমালা</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#292329] mb-3">
              {pageTitle}
            </h1>
            {legalData?.lastUpdated && (
              <div className="flex items-center gap-1.5 text-xs text-[#77717A]">
                <Clock className="w-3.5 h-3.5" />
                <span>সর্বশেষ আপডেট: {formatDate(legalData.lastUpdated, 'bn')}</span>
              </div>
            )}
          </div>

          {/* Body Content — instantly rendered from bundled content */}
          <div
            className="text-sm leading-relaxed text-[#292329] legal-content"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(pageContent) }}
          />

          {/* Legal Note */}
          <div className="mt-12 p-4 rounded-2xl bg-[#FFF8FA] border border-[#F0E2E8] flex items-start gap-3 text-xs text-[#77717A]">
            <AlertCircle className="w-4 h-4 text-[#D45D83] shrink-0 mt-0.5" />
            <p>
              এই নীতিমালাটি বাংলাদেশ সরকারের ই-কমার্স বিধিমালা ও ভোক্তা অধিকার আইনের সাথে সামঞ্জস্যপূর্ণ। যেকোনো সহায়তায় আমাদের হেল্পলাইনে যোগাযোগ করুন।
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LegalPage;

