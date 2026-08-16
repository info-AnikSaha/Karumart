// A mapping of Banglish and English terms to Bengali terms for Karumart products & categories
const searchMap: Record<string, string> = {
  // Traditional Sarees & Clothing
  'saree': 'শাড়ি',
  'sari': 'শাড়ি',
  'shari': 'শাড়ি',
  'tangail': 'টাঙ্গাইল',
  'jamdani': 'জামদানি',
  'cotton': 'সুতি',
  'suti': 'সুতি',
  'silk': 'সিল্ক',
  'khadi': 'খাদি',
  'lungi': 'লুঙ্গি',
  'panjabi': 'পাঞ্জাবি',
  'punjabi': 'পাঞ্জাবি',
  'kurti': 'কুর্তি',
  'gamcha': 'গামছা',

  // Nokshi Katha & Handloom Textiles
  'nokshi': 'নকশী',
  'nakshi': 'নকশী',
  'katha': 'কাঁথা',
  'kantha': 'কাঁথা',
  'handloom': 'হ্যান্ডলুম',
  'shitol pati': 'শীতল পাটি',
  'shitol': 'শীতল',
  'pati': 'পাটি',
  'mat': 'মাদুর',
  'madur': 'মাদুর',

  // Earthenware & Pottery
  'pottery': 'মৃৎশিল্প',
  'clay': 'মাটি',
  'earthen': 'মাটির',
  'matir': 'মাটির',
  'matir patro': 'মাটির পাত্র',
  'matir plate': 'মাটির থালা',
  'patro': 'পাত্র',
  'hadi': 'হাঁড়ি',
  'hari': 'হাঁড়ি',
  'shora': 'সরা',
  'tagar': 'টগর',
  'tub': 'টব',
  'flower tub': 'টব',
  'fulerdani': 'ফুলদানি',
  'vase': 'ফুলদানি',

  // Bamboo & Cane Crafts
  'bamboo': 'বাঁশ',
  'bash': 'বাঁশ',
  'cane': 'বেত',
  'bet': 'বেত',
  'kula': 'কুলা',
  'dala': 'ডালা',
  'jhuri': 'ঝুড়ি',
  'basket': 'ঝুড়ি',
  'chaluni': 'চালুনি',
  'khaloi': 'খালোই',

  // Jute Crafts & Goods
  'jute': 'পাট',
  'pat': 'পাট',
  'patshilpo': 'পাটশিল্প',
  'jute bag': 'পাটের ব্যাগ',
  'bag': 'ব্যাগ',
  'shika': 'শিকা',
  'rug': 'পাপোশ',
  'doormat': 'পাপোশ',

  // Brass & Bell Metal (কাঁসা ও পিতল)
  'brass': 'পিতল',
  'pitol': 'পিতল',
  'bell metal': 'কাঁসা',
  'kasha': 'কাঁসা',
  'kansa': 'কাঁসা',
  'kashar thala': 'কাঁসার থালা',
  'kashar bati': 'কাঁসার বাটি',
  'thala': 'থালা',
  'bati': 'বাটি',
  'glass': 'গ্লাস',
  'jug': 'জগ',
  'lamp': 'প্রদীপ',
  'prodip': 'প্রদীপ',

  // Wooden Crafts
  'wood': 'কাঠ',
  'kath': 'কাঠ',
  'wooden': 'কাঠের',
  'kather': 'কাঠের',
  'kather chorkha': 'চরকা',
  'boat': 'নৌকা',
  'nouka': 'নৌকা',
  'toy': 'খেলনা',
  'khelna': 'খেলনা',
  'mask': 'মুখোশ',
  'mukhosh': 'মুখোশ',

  // Jewelry & Accessories
  'jewelry': 'গয়না',
  'jewellery': 'গয়না',
  'goyna': 'গয়না',
  'mala': 'মালা',
  'necklace': 'হার',
  'dul': 'দুল',
  'earring': 'দুল',
  'churi': 'চুড়ি',
  'bangles': 'চুড়ি',
  'resmi churi': 'রেশমি চুড়ি',
  'clay jewelry': 'মাটির গয়না',

  // Leather Goods
  'leather': 'চামড়া',
  'chamra': 'চামড়া',
  'wallet': 'মানিব্যাগ',
  'juta': 'জুতা',
  'sandal': 'স্যান্ডেল',

  // Organic Food, Honey, Ghee & Traditional Food
  'modhu': 'মধু',
  'honey': 'মধু',
  'sundarban honey': 'সুন্দরবনের মধু',
  'ghee': 'ঘি',
  'ghi': 'ঘি',
  'sarisha tel': 'সরিষার তেল',
  'mustard oil': 'সরিষার তেল',
  'oil': 'তেল',
  'tel': 'তেল',
  'gur': 'গুড়',
  'jaggery': 'গুড়',
  'khejur gur': 'খেজুর গুড়',
  'patali gur': 'পাটালি গুড়',
  'mishti': 'মিষ্টি',
  'sweet': 'মিষ্টি',
  'pitha': 'পিঠা',
  'nakshi pitha': 'নকশী পিঠা',
  'shutki': 'শুঁটকি',
  'dried fish': 'শুঁটকি',
  'cha': 'চা',
  'tea': 'চা',
  'green tea': 'গ্রিন টি',
  'masala': 'মসলা',
  'mosla': 'মসলা',
  'spice': 'মসলা',

  // Home Decor & Folk Art
  'decor': 'সাজসজ্জা',
  'home decor': 'হোম ডেকর',
  'wall art': 'ওয়াল আর্ট',
  'painting': 'চিত্রকর্ম',
  'rickshaw art': 'রিকশা আর্ট',
  'art': 'শিল্প',
  'shilpo': 'শিল্প',
  'handicraft': 'হস্তশিল্প',
  'craft': 'হস্তশিল্প',
  'hostoshilpo': 'হস্তশিল্প',
  'gift': 'উপহার',
  'box': 'বাক্স'
};

/**
 * Normalizes search query by grouping synonyms for each word in the query.
 * Returns an array of arrays, where each sub-array contains synonyms for a word.
 */
export function getSearchGroups(query: string): string[][] {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return [];

  const words = normalized.split(/\s+/);
  
  return words.map(word => {
    const synonyms = [word];
    
    // Direct map match
    if (searchMap[word]) {
      synonyms.push(searchMap[word]);
    }

    // Partial matches in map
    Object.entries(searchMap).forEach(([key, bengali]) => {
      if (word.length > 2 && (key.includes(word) || word.includes(key))) {
        synonyms.push(key);
        synonyms.push(bengali);
      }
    });

    return Array.from(new Set(synonyms));
  });
}

/**
 * Legacy support for single array of terms
 */
export function normalizeSearchQuery(query: string): string[] {
  const groups = getSearchGroups(query);
  return Array.from(new Set(groups.flat()));
}

/**
 * Checks if a product matches the search query using "AND" logic for words
 * and "OR" logic for synonyms within each word.
 */
export function matchesSearch(
  productName: string, 
  productCategory: string, 
  searchQuery: string,
  shopName?: string,
  address?: string
): boolean {
  const groups = getSearchGroups(searchQuery);
  if (groups.length === 0) return true;
  
  const name = productName.toLowerCase();
  const category = productCategory.toLowerCase();
  const shop = shopName?.toLowerCase() || '';
  const location = address?.toLowerCase() || '';

  // Every word in the query must have at least one synonym matching name, category, shop, or location
  return groups.every(group => 
    group.some(term => {
      const t = term.toLowerCase();
      return name.includes(t) || 
             category.includes(t) || 
             shop.includes(t) ||
             location.includes(t);
    })
  );
}
