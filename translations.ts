/**
 * Bilingual Translations Dictionary for Karumart (Bangla & English)
 */

export interface ProductTranslation {
  title: string;
  artisan: string;
  origin: string;
  description: string;
}

export const PRODUCT_TRANSLATIONS: Record<string, ProductTranslation> = {
  'prod-1': {
    title: 'Artistic Clay Platters & Bowls Set (1 Pair)',
    artisan: 'Khogen Chandra Pal',
    origin: 'Bijoypur, Comilla',
    description: 'Traditional environment-friendly tableware handcrafted on manual wheels, solar dried, and fired carefully in local clay kilns. Fostered with generations of Comilla style pottery.'
  },
  'prod-2': {
    title: 'Sundarbans Genuine Raw Khalisha Flower Honey (500g)',
    artisan: 'Mofizul Islam Mowal',
    origin: 'Koyra, Sundarbans Coast',
    description: '100% pure, unpasteurized natural honey harvested risking lives from deep Sundarbans mangroves during seasonal Khalsia bloom.'
  },
  'prod-3': {
    title: 'Hand-woven Silk-thread Traditional Nakshi Kantha',
    artisan: 'Sajeda Khatun & Team',
    origin: 'Shibganj, Chapainawabganj',
    description: 'Exquisite traditional quilt painstakingly embroidered over a course of 2 months with colorful premium silk thread stitches by skilled rural women artisans.'
  },
  'prod-4': {
    title: 'Traditional Wood-Pressed Pure Mustard Oil (1L)',
    artisan: 'Md. Asad Ali',
    origin: 'Atrai, Naogaon',
    description: 'Rich, potent, and aromatic cold-pressed oil prepared from finest red mustard seeds in heavy wooden mills ("Ghani") without processing heat.'
  },
  'prod-5': {
    title: 'Homemade Sweet-Sour-Spicy Green Mango Pickle (400g)',
    artisan: 'Rabeya Bosri',
    origin: 'Nesarabad, Pirojpur',
    description: 'Authentic grandma recipe pickle sliced from fresh orchard mangoes, naturally sun-cured, seasoned with pure mustard oil and wild five-spice blends.'
  },
  'prod-6': {
    title: 'Handcrafted Hill-Tracts Bamboo Pen & Flower Case',
    artisan: 'Ang Mong Marma',
    origin: 'Rangamati, Hill District',
    description: 'Sleek eco-friendly desk accessory carved intricately out of organic forest bamboo by master designers of the Rangamati hill tribes.'
  },
  'prod-7': {
    title: 'Baghabari Special Premium Grass-fed Pure Ghee (1kg)',
    artisan: 'Kartik Ghosh',
    origin: 'Baghabari, Sirajganj',
    description: 'Superb granulated golden clarified butter traditionally simmered from hand-churned fresh cream from indigenous cows in Sirajganj char basin.'
  },
  'prod-8': {
    title: 'Silky Shital Pati Traditional Cool Sleeping Mat',
    artisan: 'Maya Rani Das',
    origin: 'Balaganj, Sylhet',
    description: 'Vantaged Sylhet luxury cooling mat woven manually using ultra-fine splits of natural Murta reed cane, keeping your bedding cool during hot summers.'
  }
};

export const CATEGORY_TRANSLATIONS: Record<string, string> = {
  'সব পণ্য': 'All Products',
  'মাটির শিল্প': 'Clay & Pottery',
  'নকশী কাঁথা ও বুটিক': 'Weaving & Boutiques',
  'খাঁটি মধু ও ঘি': 'Raw Honey & Pure Ghee',
  'হাতের তৈরি আচার ও মসলা': 'Homemade Pickles & Spices',
  'বাঁশ ও বেত শিল্প': 'Bamboo & Cane Crafts'
};

export const DISTRICT_TRANSLATIONS: Record<string, string> = {
  'সকল জেলা': 'All Districts',
  'বাগেরহাট': 'Bagerhat',
  'বান্দরবান': 'Bandarban',
  'বরগুনা': 'Barguna',
  'বরিশাল': 'Barisal',
  'ভোলা': 'Bhola',
  'বগুড়া': 'Bogra',
  'ব্রাহ্মণবাড়িয়া': 'Brahmanbaria',
  'চাঁদপুর': 'Chandpur',
  'চাঁপাইনবাবগঞ্জ': 'Chapainawabganj',
  'চট্টগ্রাম': 'Chittagong',
  'চুয়াডাঙ্গা': 'Chuadanga',
  'কুমিল্লা': 'Comilla',
  'কক্সবাজার': "Cox's Bazar",
  'ঢাকা': 'Dhaka',
  'দিনাজপুর': 'Dinajpur',
  'ফরিদপুর': 'Faridpur',
  'ফেনী': 'Feni',
  'গাইবান্ধা': 'Gaibandha',
  'গাজীপুর': 'Gazipur',
  'গোপালগঞ্জ': 'Gopalganj',
  'হবিগঞ্জ': 'Habiganj',
  'জামালপুর': 'Jamalpur',
  'যশোর': 'Jessore',
  'ঝালকাঠি': 'Jhalokati',
  'ঝিনাইদহ': 'Jhenaidah',
  'জয়পুরহাট': 'Joypurhat',
  'খাগড়াছড়ি': 'Khagrachari',
  'খুলনা': 'Khulna',
  'কিশোরগঞ্জ': 'Kishoreganj',
  'কুড়িগ্রাম': 'Kurigram',
  'কুষ্টিয়া': 'Kushtia',
  'লক্ষ্মীপুর': 'Lakshmipur',
  'লালমনিরহাট': 'Lalmonirhat',
  'মাদারীপুর': 'Madaripur',
  'মাগুরা': 'Magura',
  'মানিকগঞ্জ': 'Manikganj',
  'মেহেরপুর': 'Meherpur',
  'مৌলভীবাজার': 'Moulvibazar',
  'মুন্সীগঞ্জ': 'Munshiganj',
  'ময়মনসিংহ': 'Mymensingh',
  'নওগাঁ': 'Naogaon',
  'নড়াইল': 'Narail',
  'নারায়ণগঞ্জ': 'Narayanganj',
  'নরসিংদী': 'Narsingdi',
  'নাটোর': 'Natore',
  'নেত্রকোণা': 'Netrokona',
  'নীলফামারী': 'Nilphamari',
  'নোয়াখালী': 'Noakhali',
  'পাবনা': 'Pabna',
  'পঞ্চগড়': 'Panchagarh',
  'পটুয়াখালী': 'Patuakhali',
  'পিরোজপুর': 'Pirojpur',
  'রাজবাড়ী': 'Rajbari',
  'রাজশাহী': 'Rajshahi',
  'রাঙ্গামাটি': 'Rangamati',
  'রংপুর': 'Rangpur',
  'সাতক্ষীরা': 'Satkhira',
  'শরীয়তপুর': 'Shariatpur',
  'শেরপুর': 'Sherpur',
  'সিরাজগঞ্জ': 'Sirajganj',
  'সুনামগঞ্জ': 'Sunamganj',
  'সিলেট': 'Sylhet',
  'টাঙ্গাইল': 'Tangail',
  'ঠাকুরগাঁও': 'Thakurgaon'
};

export const SLIDE_TRANSLATIONS = [
  {
    title: 'Karumart: Straight From Village Soil to Urban Homes',
    subtitle: '100% authentic, organic, and pure food & heritage crafts handmade by over 250+ remote rural artisans and local farmers across Bangladesh.',
    accent: 'Handcrafts & Heritage Fest',
    tagline: 'Artisanal clay pottery, Nakshi Kantha, and cooling Shital Pati at your doorstep.'
  },
  {
    title: 'Rich Splendor of Traditional Rural Handwork',
    subtitle: 'Bespoke eco-friendly creations carved from fresh bamboo, natural cane, and golden jute, bringing organic warmth to your modern interior.',
    accent: 'Eco-Friendly Bamboo & Cane',
    tagline: 'Support native artisans, secure green environmental heritage.'
  },
  {
    title: 'Preservative-Free Pure Homemade Organic Foods',
    subtitle: 'Golden cow-milk ghee, deep-woods wild honey, and tangy sun-cured pickles packed with raw nutrition and authentic countryside secrets.',
    accent: '100% Pure Local Taste',
    tagline: 'Organic and chemical-free locally-sourced gourmet delights.'
  }
];

export const BADGE_TRANSLATIONS = [
  { text: 'Affordable & Fair Prices', desc: 'Sourced directly at artisan-preset fair rates' },
  { text: '100% Pure & Authentic', desc: 'Zero chemicals or preservatives guaranteed' },
  { text: 'Secure Payments', desc: 'Secure cash-on-delivery or digital wallet transfers' },
  { text: 'Fast Home Delivery', desc: 'Handled with peak care and delivered nationwide' }
];

export const TRANSLATIONS: Record<string, Record<'bn' | 'en', string>> = {
  top_notice: {
    bn: 'গ্রামীণ অর্থনীতি সচল রাখুন, সরাসরি প্রান্তিক কৃষকদের এবং সুনিপুণ কারিগরদের থেকে কিনুন',
    en: 'Empower rural economies by buying directly from remote farmers and skilled master artisans.'
  },
  help_center: {
    bn: 'সাহায্য কেন্দ্র',
    en: 'Help Center'
  },
  tracking: {
    bn: 'ডেলিভারি ট্র্যাকিং',
    en: 'Track Delivery'
  },
  search_placeholder: {
    bn: 'পণ্য খুঁজুন (যেমন: মধু, খাঁটি ঘি, নকশী কাঁথা, মাটির পাত্র...)',
    en: 'Search products (e.g. Honey, Pure Ghee, Nakshi Kantha, Pottery...)'
  },
  search_placeholder_mobile: {
    bn: 'পণ্য খুঁজুন (যেমন: মধু, ঘি, নকশী কাঁথা...)',
    en: 'Search (e.g. Honey, Ghee, blanket...)'
  },
  sell_btn: {
    bn: 'কারুপণ্য বিক্রি করুন',
    en: 'Sell Handicrafts'
  },
  login: {
    bn: 'লগইন',
    en: 'Login'
  },
  logout: {
    bn: 'লগআউট',
    en: 'Logout'
  },
  tagline: {
    bn: 'প্রান্তিক কারিগরের শতভাগ খাঁটি সম্ভার',
    en: '100% Authentic collection from remote village artisans'
  },
  local_goods: {
    bn: 'দেশি পণ্য',
    en: 'Local Craft'
  },
  items: {
    bn: 'টি পণ্য',
    en: ' items'
  },
  artisan_zone: {
    bn: 'কারিগর জোন',
    en: 'Artisan Zone'
  },
  live_now: {
    bn: 'সরাসরি যুক্ত হোন',
    en: 'Join Directly'
  },
  promo_heading: {
    bn: 'আপনি কি হস্তশিল্পী বা ঘরে তৈরি আচার-ঘি উৎপাদনকারী?',
    en: 'Are you an artisan or maker of homemade pickles & ghee?'
  },
  promo_body: {
    bn: 'আপনার কাছে কি সুন্দরবনের খাঁটি মধু, কুষ্টিয়ার তিলের খাজা, দেশি সরিষার খাঁটি তেল, নকশী কাঁথা বোনার চমৎকার প্রতিভা আছে? কারুমার্ট প্ল্যাটফর্মে যুক্ত করুন আমাদের সহায়তায় এবং সরাসরি শহরের ক্রেতাদের কাছে সঠিক মূল্যে বিক্রি করুন!',
    en: 'Do you harvest wild honey, cold-press pure mustard oil, or weave beautiful traditional quilts? Showcase your talents on Karumart with our support and get absolute fair value right from city buyers!'
  },
  benefit_1_bold: {
    bn: '০% কমিশন সুবিধা:',
    en: '0% Commissions:'
  },
  benefit_1_text: {
    bn: ' কারিগর পাবেন পুরো লাভ।',
    en: ' Overwise, you pocket 100% of your listed products profits.'
  },
  benefit_2_bold: {
    bn: 'সহজ ডেলিভারি:',
    en: 'Easy Pickups:'
  },
  benefit_2_text: {
    bn: ' গ্রাম এসে পণ্য সংগ্রহ করবে ডেলিভারিকর্মী।',
    en: ' Cougars and package runners retrieve parcels from your village steps.'
  },
  benefit_3_bold: {
    bn: 'নিরাপদ ও দ্রুত পেমেন্ট:',
    en: 'Secure Payouts:'
  },
  benefit_3_text: {
    bn: ' সরাসরি বিকাশ বা রকেটে।',
    en: ' Direct instant mobile transfers through bKash, Rocket, or Nagad.'
  },
  post_btn: {
    bn: 'আপনার পণ্য পোস্ট করুন',
    en: 'Post Your Local Goods'
  },
  support_call: {
    bn: 'সহায়তা পেতে কল করুন: ০৯৬১২-কারুমার্ট (টোল ফ্রি)',
    en: 'Support Call Center: 09612-KARUMART (Toll Free)'
  },
  live_stats_prefix: {
    bn: 'আজকের তথ্য: ',
    en: 'Today\'s Platform Stats: '
  },
  live_stats_products: {
    bn: 'টি দেশীয় পণ্য',
    en: ' local crafts'
  },
  live_stats_mid: {
    bn: ' লাইভ প্রদর্শিত হচ্ছে এবং এবং মোট ',
    en: ' are live, with a total of '
  },
  live_stats_districts: {
    bn: 'টি প্রান্তিক জেলা',
    en: ' remote districts'
  },
  live_stats_suffix: {
    bn: ' সংযুক্ত আছে।',
    en: ' actively integrated.'
  },
  handcrafted_highlight: {
    bn: 'নকশী বোনা: আমেনা খাতুন (চাঁপাইনবাবগঞ্জ), খলিশা মধু: মৌয়াল মফিজুল (সুন্দরবন)',
    en: 'Silk Quilting: Amena Khatun (Chapainawabganj) | Honey Collector: Mofizul (Sundarbans)'
  },
  catalog_purity: {
    bn: 'নিখুঁত বাছাইকৃত শতভাগ ভেজালমুক্ত এবং স্থানীয় কারিগরদের নিজ হাতে বানানো উপাদানের সম্ভার।',
    en: 'Strictly inspected, chemical-free organic selections handcrafted by rural remote artisans.'
  },
  products_found: {
    bn: 'টি পণ্য পাওয়া গেছে',
    en: ' items cataloged'
  },
  filter_origin: {
    bn: 'উৎস জেলা:',
    en: 'Origin:'
  },
  filter_sort: {
    bn: 'ক্রম সাজান:',
    en: 'Sort By:'
  },
  sort_newest: {
    bn: 'নতুন পণ্য',
    en: 'New Arrivals'
  },
  sort_price_asc: {
    bn: 'দাম: কম থেকে বেশি',
    en: 'Price: Low to High'
  },
  sort_price_desc: {
    bn: 'দাম: বেশি থেকে কম',
    en: 'Price: High to Low'
  },
  buyer: {
    bn: 'সম্মানিত ক্রেতা',
    en: 'Valued Buyer'
  },
  artisan: {
    bn: 'প্রান্তিক কারিগর',
    en: 'Rural Artisan'
  },
  buy_now: {
    bn: 'পণ্য কিনুন',
    en: 'Shop Now'
  },
  assured: {
    bn: 'Karu Assured',
    en: 'Karu Assured'
  },
  discount_badge: {
    bn: 'ছাড়!',
    en: 'OFF!'
  },
  artisan_profile_tag: {
    bn: 'গ্রামীণ কারিগর প্রোফাইল',
    en: 'Grown Artisan Profile'
  },
  origin_region: {
    bn: ' অঞ্চল',
    en: ' Region'
  },
  artisan_benefit: {
    bn: '✓ শতভাগ লাভ কারিগরের',
    en: '✓ 100% Profits to Artisan'
  },
  fair_price_label: {
    bn: 'ন্যায্য মূল্য নির্ধারণ',
    en: 'Fair Trade Price'
  },
  add_to_cart: {
    bn: 'কার্টে যোগ করুন',
    en: 'Add to Cart'
  },
  added_in_cart: {
    bn: 'ঝুড়িতে যোগ করা আছে:',
    en: 'In Shopping Basket:'
  },
  open_cart_btn: {
    bn: 'শপিং ব্যাগ খুলুন',
    en: 'Open Shopping Cart'
  },
  reviews_label: {
    bn: 'রিভিউ',
    en: 'reviews'
  },
  view_details: {
    bn: 'বিস্তারিত দেখুন',
    en: 'View Details'
  },
  share_success: {
    bn: 'পণ্য লিঙ্ক কপি করা হয়েছে!',
    en: 'Aesthetic product link copied!'
  },
  favorites_toast: {
    bn: 'পছন্দের পণ্যসমূহ দেখতে নিচের ক্যাডালগ লক্ষ্য করুন',
    en: 'Look at the catalog below to inspect your favorites'
  },
  fav_list_empty: {
    bn: 'আপনার পছন্দের তালিকা খালি! পণ্যের পাশের হার্ট আইকন চাপুন।',
    en: 'Your favorites are empty! Tap the heart icons on products.'
  },
  favorites_has: {
    bn: 'আপনার পছন্দের তালিকায় ',
    en: 'Your favorite list holds '
  },
  favorites_has_suffix: {
    bn: 'টি পণ্য রয়েছে',
    en: ' curated crafts.'
  },
  added_to_cart_toast: {
    bn: ' কার্টে যুক্ত করা হয়েছে',
    en: ' added to basket'
  },
  removed_cart_toast: {
    bn: 'পণ্যটি ঝুড়ি থেকে সরানো হয়েছে',
    en: 'Item ejected from basket'
  },
  cart_title: {
    bn: 'আপনার শপিং ব্যাগ',
    en: 'Your Shopping Basket'
  },
  cart_total_label: {
    bn: 'সর্বমোট মূল্য:',
    en: 'Subtotal Amount:'
  },
  total_gains_artisan: {
    bn: 'কারিগরের মোট অর্জন',
    en: 'Artisan Net Earning'
  },
  proceed_to_checkout: {
    bn: 'শিপিং ঠিকানায় যান',
    en: 'Proceed to Shipping'
  },
  checkout_title: {
    bn: 'ডেলিভারি ও শিপিং তথ্য',
    en: 'Delivery & Shipping Details'
  },
  delivery_charge: {
    bn: 'ডেলিভারি চার্জ (সারাদেশে):',
    en: 'Courier Charge (Nationwide):'
  },
  total_payable: {
    bn: 'মোট প্রদেয় টাকা:',
    en: 'Total Payable Amount:'
  },
  full_name_label: {
    bn: 'সম্পূর্ণ নাম *',
    en: 'Full Name *'
  },
  full_name_placeholder: {
    bn: 'উদা: মো: মারুফ হাসান',
    en: 'e.g. Md. Maruf Hasan'
  },
  mobile_label: {
    bn: 'মোবাইল নম্বর (বিকাশ/রকেটসহ) *',
    en: 'Mobile Number *'
  },
  mobile_placeholder: {
    bn: 'উদা: ০১৭xxxxxxxx',
    en: 'e.g. 017xxxxxxxx'
  },
  shipping_address_label: {
    bn: 'বিস্তারিত ঠিকানা ও জেলা *',
    en: 'Detailed Address & District *'
  },
  shipping_address_placeholder: {
    bn: 'উদা: বাসা নং ৫, রোড ২৩, ধানমন্ডি, ঢাকা',
    en: 'e.g. Flat B3, House 45, Dhanmondi, Dhaka'
  },
  payment_method_label: {
    bn: 'পেমেন্ট পদ্ধতি',
    en: 'Payment Method'
  },
  payment_cod: {
    bn: 'হাতে পেয়ে মূল্য পরিশোধ (ক্যাশ অন ডেলিভারি)',
    en: 'Cash on Delivery (COD)'
  },
  payment_mobile: {
    bn: 'বিকাশ / রকেট / নগদ (ডিজিটাল পেমেন্ট)',
    en: 'bKash / rocket / Nagad (Digital Pay)'
  },
  back_to_cart: {
    bn: 'ব্যাগে ফিরে যান',
    en: 'Return to Cart'
  },
  confirm_order: {
    bn: 'অর্ডার নিশ্চিত করুন',
    en: 'Confirm & Place Order'
  },
  order_success_title: {
    bn: 'অর্ডার সফল হয়েছে! 🎉',
    en: 'Order Placed Successfully! 🎉'
  },
  order_success_desc: {
    bn: 'আপনার পছন্দের দেশি ঐতিহ্যবাহী পণ্য সংগ্রহের অর্ডারটি লাভ করেছি। আমাদের প্রতিনিধি ১ ঘণ্টার মধ্যে কল করে ঠিকানা নিশ্চিত করবেন।',
    en: 'We have received your order. Our customer care representative will call you within 1 hour to verify your delivery slots.'
  },
  order_id: {
    bn: 'অর্ডার আইডি: ',
    en: 'Order ID: '
  },
  estimated_delivery: {
    bn: 'ডেলিভারি সময়সীমা: ৪৮ থেকে ৭২ ঘণ্টা',
    en: 'Estimated dispatch: 48 to 72 hours'
  },
  close_dialog: {
    bn: 'বন্ধ করুন',
    en: 'Close'
  },
  empty_cart_msg: {
    bn: 'আপনার শপিং ব্যাগটি খালি! খাঁটি ও সুস্বাদু দেশি ঐতিহ্য লালন করুন।',
    en: 'Your shopping basket is empty! Cherish authentic village heritages.'
  },

  // Auth / Add Product modals
  auth_title_login: {
    bn: 'কারুমার্টে লগইন করুন',
    en: 'Login to Karumart'
  },
  auth_title_register: {
    bn: 'নতুন কারিগর বা ক্রেতা নিবন্ধন',
    en: 'Artisan & Buyer Registration'
  },
  role_choose: {
    bn: 'আপনার ভূমিকা নির্বাচন করুন',
    en: 'Select Your Account Type'
  },
  join_buyer: {
    bn: 'আমি পণ্য কিনতে চাই (ক্রেতা)',
    en: 'I want to Buy Local (Buyer)'
  },
  join_artisan: {
    bn: 'আমি পণ্য বিক্রি করতে চাই (কারিগর)',
    en: 'I want to Sell Local (Artisan)'
  },
  phone_label: {
    bn: 'মোবাইল নম্বর',
    en: 'Mobile Number'
  },
  phone_placeholder: {
    bn: 'বিকাশ/রকেট নম্বর দিন',
    en: 'Account or mobile number'
  },
  password_label: {
    bn: 'পাসওয়ার্ড',
    en: 'Password'
  },
  form_name_label: {
    bn: 'আপনার নাম / কারিগরের নাম',
    en: 'Your Name / Artisan Name'
  },
  form_name_placeholder: {
    bn: 'উদা: আমেনা খাতুন',
    en: 'e.g. Amena Khatun'
  },
  origin_district_label: {
    bn: 'কারিগর বা খামারিদের জেলা',
    en: 'Artisan Origin District'
  },
  btn_submit_login: {
    bn: 'প্রবেশ করুন',
    en: 'Sign In'
  },
  btn_submit_register: {
    bn: 'নিবন্ধন সম্পন্ন করুন',
    en: 'Complete Registration'
  },
  register_toggle_msg: {
    bn: 'নতুন অ্যাকাউন্ট তৈরি করতে চান?',
    en: 'Don\'t have an account?'
  },
  register_toggle_link: {
    bn: 'এখানে নিবন্ধন করুন',
    en: 'Register Here'
  },
  login_toggle_msg: {
    bn: 'ইতিমধ্যে অ্যাকাউন্ট আছে?',
    en: 'Already have an account?'
  },
  login_toggle_link: {
    bn: 'এখানে লগইন করুন',
    en: 'Login Here'
  },

  add_product_title: {
    bn: 'গ্রামীণ খাঁটি ও ঐতিহ্যবাহী পণ্য যোগ করুন',
    en: 'Publish Authentic Traditional Product'
  },
  add_product_subtitle: {
    bn: 'প্রান্তিক কারিগর হিসেবে আপনার হাতে তৈরি নতুন পণ্যটি সরাসরি Karumart শোকেসে সাজান',
    en: 'List your handcrafted agricultural or woven crafts directly onto the Karumart showcase'
  },
  prod_name_label: {
    bn: 'পণ্যের নাম *',
    en: 'Product Name *'
  },
  prod_name_placeholder: {
    bn: 'উদা: খাঁটি কাঠের ঘানির তেল (১ লিটার)',
    en: 'e.g. Wood-Pressed Mustard Oil (1 Liter)'
  },
  prod_category_label: {
    bn: 'পণ্য ক্যাটাগরি *',
    en: 'Product Category *'
  },
  prod_price_label: {
    bn: 'আমাদের ন্যায্য মূল্য (টাকা) *',
    en: 'Our Fair Price (BDT) *'
  },
  prod_orig_price_label: {
    bn: 'বাজার মূল্য (টাকা - ঐচ্ছিক)',
    en: 'Standard Market Price (BDT - Optional)'
  },
  prod_desc_label: {
    bn: 'পণ্যের পেছনের শৈল্পিক ইতিহাস বা গুণাবলী',
    en: 'Artisanal Backstory & Organic Benefits'
  },
  prod_desc_placeholder: {
    bn: 'যেমন: কুমিল্লা অঞ্চলের খাঁটি লাল মাটি রোদে শুকিয়ে আগুনে নিখুঁত পোড়ানো...',
    en: 'Explain how it was handcrafted, your village background, raw ingredients, and pure values...'
  },
  prod_image_choice: {
    bn: 'পণ্যের বাস্তবসম্মত ছবি যুক্তকরণ',
    en: 'Select Product Image Representation'
  },
  prod_image_preset: {
    bn: 'আমাদের রেডিমেড খাঁটি ছবি ব্যবহার করুন',
    en: 'Use one of our curated high-quality presets'
  },
  prod_image_custom_url: {
    bn: 'কাস্টম ছবির লিঙ্ক (URL) দিন',
    en: 'Provide custom image link (URL)'
  },
  prod_image_custom_placeholder: {
    bn: 'https://images.unsplash.com/...',
    en: 'https://images.unsplash.com/...'
  },
  submit_add_product: {
    bn: 'পণ্যটি লাইভ করুন',
    en: 'Publish Product Live'
  },
  artisan_name_label: {
    bn: 'কারিগরের নাম *',
    en: 'Artisan Name *'
  },
  err_phone: {
    bn: 'অনুগ্রহ করে মোবাইল নম্বর প্রদান করুন',
    en: 'Please provide a valid mobile number'
  },
  err_register_name: {
    bn: 'অনুগ্রহ করে আপনার নাম প্রদান করুন',
    en: 'Please provide your full legal name'
  },
  err_all_info: {
    bn: 'অনুগ্রহ করে প্রয়োজনীয় সকল তথ্য দিন',
    en: 'Please provide all required fields'
  },
  err_checkout_info: {
    bn: 'অনুগ্রহ করে শিপিং ঠিকানা ও মোবাইল দিন',
    en: 'Please fill out shipping details and mobile contact'
  },
  err_login_buyer: {
    bn: 'আপনি ক্রেতা হিসেবে আছেন। কারিগর হতে চাইলে কারিগর অ্যাকাউন্ট দিয়ে লগইন করুন।',
    en: 'Currently signed in as a Buyer. To sell, please login with an Artisan profile.'
  },
  err_artisan_register_required: {
    bn: 'পণ্য যুক্ত করার আগে অনুগ্রহ করে নিবন্ধন সম্পন্ন করুন',
    en: 'Please complete registration before publishing products'
  },
  success_reg: {
    bn: 'রেজিস্ট্রেশন সফল! স্বাগতম',
    en: 'Registration successful! Welcome'
  },
  success_login: {
    bn: 'স্বাগতম! সফলভাবে লগইন সম্পন্ন হয়েছে',
    en: 'Welcome! Signed in successfully'
  }
};
