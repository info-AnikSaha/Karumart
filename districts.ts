export interface District {
  id: string;
  nameEn: string;
  nameBn: string;
  divisionEn: string;
  divisionBn: string;
  aliases?: string[];
}

export interface Division {
  id: string;
  nameEn: string;
  nameBn: string;
  districts: District[];
}

export const DIVISIONS_AND_DISTRICTS: Division[] = [
  {
    id: 'dhaka',
    nameEn: 'Dhaka',
    nameBn: 'ঢাকা',
    districts: [
      { id: 'dhaka', nameEn: 'Dhaka', nameBn: 'ঢাকা', divisionEn: 'Dhaka', divisionBn: 'ঢাকা', aliases: ['dha', 'dhaka city'] },
      { id: 'gazipur', nameEn: 'Gazipur', nameBn: 'গাজীপুর', divisionEn: 'Dhaka', divisionBn: 'ঢাকা' },
      { id: 'narayanganj', nameEn: 'Narayanganj', nameBn: 'নারায়ণগঞ্জ', divisionEn: 'Dhaka', divisionBn: 'ঢাকা', aliases: ['narayanganj', 'narayangonj'] },
      { id: 'tangail', nameEn: 'Tangail', nameBn: 'টাঙ্গাইল', divisionEn: 'Dhaka', divisionBn: 'ঢাকা' },
      { id: 'faridpur', nameEn: 'Faridpur', nameBn: 'ফরিদপুর', divisionEn: 'Dhaka', divisionBn: 'ঢাকা' },
      { id: 'kishoreganj', nameEn: 'Kishoreganj', nameBn: 'কিশোরগঞ্জ', divisionEn: 'Dhaka', divisionBn: 'ঢাকা', aliases: ['kishorganj'] },
      { id: 'manikganj', nameEn: 'Manikganj', nameBn: 'মানিকগঞ্জ', divisionEn: 'Dhaka', divisionBn: 'ঢাকা', aliases: ['manikgonj'] },
      { id: 'munshiganj', nameEn: 'Munshiganj', nameBn: 'মুন্সীগঞ্জ', divisionEn: 'Dhaka', divisionBn: 'ঢাকা', aliases: ['munshigonj'] },
      { id: 'narsingdi', nameEn: 'Narsingdi', nameBn: 'নরসিংদী', divisionEn: 'Dhaka', divisionBn: 'ঢাকা' },
      { id: 'gopalganj', nameEn: 'Gopalganj', nameBn: 'গোপালগঞ্জ', divisionEn: 'Dhaka', divisionBn: 'ঢাকা', aliases: ['gopalgonj'] },
      { id: 'madaripur', nameEn: 'Madaripur', nameBn: 'মাদারীপুর', divisionEn: 'Dhaka', divisionBn: 'ঢাকা' },
      { id: 'rajbari', nameEn: 'Rajbari', nameBn: 'রাজবাড়ী', divisionEn: 'Dhaka', divisionBn: 'ঢাকা' },
      { id: 'shariatpur', nameEn: 'Shariatpur', nameBn: 'শরীয়তপুর', divisionEn: 'Dhaka', divisionBn: 'ঢাকা' },
    ]
  },
  {
    id: 'chattogram',
    nameEn: 'Chattogram',
    nameBn: 'চট্টগ্রাম',
    districts: [
      { id: 'chattogram', nameEn: 'Chattogram', nameBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', divisionBn: 'চট্টগ্রাম', aliases: ['chittagong', 'ctg'] },
      { id: 'coxsbazar', nameEn: 'Cox\'s Bazar', nameBn: 'কক্সবাজার', divisionEn: 'Chattogram', divisionBn: 'চট্টগ্রাম', aliases: ['coxs bazar', 'coxbazar', 'cox\'s bazar'] },
      { id: 'cumilla', nameEn: 'Cumilla', nameBn: 'কুমিল্লা', divisionEn: 'Chattogram', divisionBn: 'চট্টগ্রাম', aliases: ['comilla'] },
      { id: 'feni', nameEn: 'Feni', nameBn: 'ফেনী', divisionEn: 'Chattogram', divisionBn: 'চট্টগ্রাম' },
      { id: 'brahmanbaria', nameEn: 'Brahmanbaria', nameBn: 'ব্রাহ্মণবাড়িয়া', divisionEn: 'Chattogram', divisionBn: 'চট্টগ্রাম', aliases: ['b-baria', 'brahmanbaria'] },
      { id: 'noakhali', nameEn: 'Noakhali', nameBn: 'নোয়াখালী', divisionEn: 'Chattogram', divisionBn: 'চট্টগ্রাম' },
      { id: 'chandpur', nameEn: 'Chandpur', nameBn: 'চাঁদপুর', divisionEn: 'Chattogram', divisionBn: 'চট্টগ্রাম' },
      { id: 'lakshmipur', nameEn: 'Lakshmipur', nameBn: 'লক্ষ্মীপুর', divisionEn: 'Chattogram', divisionBn: 'চট্টগ্রাম', aliases: ['laxmipur'] },
      { id: 'rangamati', nameEn: 'Rangamati', nameBn: 'রাঙ্গামাটি', divisionEn: 'Chattogram', divisionBn: 'চট্টগ্রাম' },
      { id: 'bandarban', nameEn: 'Bandarban', nameBn: 'বান্দরবান', divisionEn: 'Chattogram', divisionBn: 'চট্টগ্রাম' },
      { id: 'khagrachhari', nameEn: 'Khagrachhari', nameBn: 'খাগড়াছড়ি', divisionEn: 'Chattogram', divisionBn: 'চট্টগ্রাম', aliases: ['khagrachari'] },
    ]
  },
  {
    id: 'rajshahi',
    nameEn: 'Rajshahi',
    nameBn: 'রাজশাহী',
    districts: [
      { id: 'rajshahi', nameEn: 'Rajshahi', nameBn: 'রাজশাহী', divisionEn: 'Rajshahi', divisionBn: 'রাজশাহী' },
      { id: 'bogura', nameEn: 'Bogura', nameBn: 'বগুড়া', divisionEn: 'Rajshahi', divisionBn: 'রাজশাহী', aliases: ['bogra', 'bogura', 'বগুড়া'] },
      { id: 'pabna', nameEn: 'Pabna', nameBn: 'পাবনা', divisionEn: 'Rajshahi', divisionBn: 'রাজশাহী' },
      { id: 'sirajganj', nameEn: 'Sirajganj', nameBn: 'সিরাজগঞ্জ', divisionEn: 'Rajshahi', divisionBn: 'রাজশাহী', aliases: ['sirajgonj'] },
      { id: 'naogaon', nameEn: 'Naogaon', nameBn: 'নওগাঁ', divisionEn: 'Rajshahi', divisionBn: 'রাজশাহী', aliases: ['naogaon', 'নওগা'] },
      { id: 'natore', nameEn: 'Natore', nameBn: 'নাটোর', divisionEn: 'Rajshahi', divisionBn: 'রাজশাহী' },
      { id: 'chapainawabganj', nameEn: 'Chapainawabganj', nameBn: 'চাঁপাইনবাবগঞ্জ', divisionEn: 'Rajshahi', divisionBn: 'রাজশাহী', aliases: ['chapai', 'nawabganj'] },
      { id: 'joypurhat', nameEn: 'Joypurhat', nameBn: 'জয়পুরহাট', divisionEn: 'Rajshahi', divisionBn: 'রাজশাহী', aliases: ['jaipurhat'] },
    ]
  },
  {
    id: 'khulna',
    nameEn: 'Khulna',
    nameBn: 'খুলনা',
    districts: [
      { id: 'khulna', nameEn: 'Khulna', nameBn: 'খুলনা', divisionEn: 'Khulna', divisionBn: 'খুলনা' },
      { id: 'jashore', nameEn: 'Jashore', nameBn: 'যশোর', divisionEn: 'Khulna', divisionBn: 'খুলনা', aliases: ['jessore'] },
      { id: 'satkhira', nameEn: 'Satkhira', nameBn: 'সাতক্ষীরা', divisionEn: 'Khulna', divisionBn: 'খুলনা' },
      { id: 'kushtia', nameEn: 'Kushtia', nameBn: 'কুষ্টিয়া', divisionEn: 'Khulna', divisionBn: 'খুলনা' },
      { id: 'jhenaidah', nameEn: 'Jhenaidah', nameBn: 'ঝিনাইদহ', divisionEn: 'Khulna', divisionBn: 'খুলনা', aliases: ['jhenaidaha'] },
      { id: 'bagerhat', nameEn: 'Bagerhat', nameBn: 'বাগেরহাট', divisionEn: 'Khulna', divisionBn: 'খুলনা' },
      { id: 'chuadanga', nameEn: 'Chuadanga', nameBn: 'চুয়াডাঙ্গা', divisionEn: 'Khulna', divisionBn: 'খুলনা' },
      { id: 'magura', nameEn: 'Magura', nameBn: 'মাগুরা', divisionEn: 'Khulna', divisionBn: 'খুলনা' },
      { id: 'meherpur', nameEn: 'Meherpur', nameBn: 'মেহেরপুর', divisionEn: 'Khulna', divisionBn: 'খুলনা' },
      { id: 'narail', nameEn: 'Narail', nameBn: 'নড়াইল', divisionEn: 'Khulna', divisionBn: 'খুলনা' },
    ]
  },
  {
    id: 'barishal',
    nameEn: 'Barishal',
    nameBn: 'বরিশাল',
    districts: [
      { id: 'barishal', nameEn: 'Barishal', nameBn: 'বরিশাল', divisionEn: 'Barishal', divisionBn: 'বরিশাল', aliases: ['barisal'] },
      { id: 'bhola', nameEn: 'Bhola', nameBn: 'ভোলা', divisionEn: 'Barishal', divisionBn: 'বরিশাল' },
      { id: 'patuakhali', nameEn: 'Patuakhali', nameBn: 'পটুয়াখালী', divisionEn: 'Barishal', divisionBn: 'বরিশাল' },
      { id: 'pirojpur', nameEn: 'Pirojpur', nameBn: 'পিরোজপুর', divisionEn: 'Barishal', divisionBn: 'বরিশাল' },
      { id: 'barguna', nameEn: 'Barguna', nameBn: 'বরগুনা', divisionEn: 'Barishal', divisionBn: 'বরিশাল' },
      { id: 'jhalokati', nameEn: 'Jhalokati', nameBn: 'ঝালকাঠি', divisionEn: 'Barishal', divisionBn: 'বরিশাল', aliases: ['jhalakathi'] },
    ]
  },
  {
    id: 'sylhet',
    nameEn: 'Sylhet',
    nameBn: 'সিলেট',
    districts: [
      { id: 'sylhet', nameEn: 'Sylhet', nameBn: 'সিলেট', divisionEn: 'Sylhet', divisionBn: 'সিলেট' },
      { id: 'moulvibazar', nameEn: 'Moulvibazar', nameBn: 'মৌলভীবাজার', divisionEn: 'Sylhet', divisionBn: 'সিলেট', aliases: ['maulvibazar'] },
      { id: 'habiganj', nameEn: 'Habiganj', nameBn: 'হবিগঞ্জ', divisionEn: 'Sylhet', divisionBn: 'সিলেট', aliases: ['habigonj'] },
      { id: 'sunamganj', nameEn: 'Sunamganj', nameBn: 'সুনামগঞ্জ', divisionEn: 'Sylhet', divisionBn: 'সিলেট', aliases: ['sunamgonj'] },
    ]
  },
  {
    id: 'rangpur',
    nameEn: 'Rangpur',
    nameBn: 'রংপুর',
    districts: [
      { id: 'rangpur', nameEn: 'Rangpur', nameBn: 'রংপুর', divisionEn: 'Rangpur', divisionBn: 'রংপুর' },
      { id: 'dinajpur', nameEn: 'Dinajpur', nameBn: 'দিনাজপুর', divisionEn: 'Rangpur', divisionBn: 'রংপুর' },
      { id: 'gaibandha', nameEn: 'Gaibandha', nameBn: 'গাইবান্ধা', divisionEn: 'Rangpur', divisionBn: 'রংপুর' },
      { id: 'kurigram', nameEn: 'Kurigram', nameBn: 'কুড়িগ্রাম', divisionEn: 'Rangpur', divisionBn: 'রংপুর' },
      { id: 'lalmonirhat', nameEn: 'Lalmonirhat', nameBn: 'লালমনিরহাট', divisionEn: 'Rangpur', divisionBn: 'রংপুর' },
      { id: 'nilphamari', nameEn: 'Nilphamari', nameBn: 'নীলফামারী', divisionEn: 'Rangpur', divisionBn: 'রংপুর' },
      { id: 'panchagarh', nameEn: 'Panchagarh', nameBn: 'পঞ্চগড়', divisionEn: 'Rangpur', divisionBn: 'রংপুর' },
      { id: 'thakurgaon', nameEn: 'Thakurgaon', nameBn: 'ঠাকুরগাঁও', divisionEn: 'Rangpur', divisionBn: 'রংপুর' },
    ]
  },
  {
    id: 'mymensingh',
    nameEn: 'Mymensingh',
    nameBn: 'ময়মনসিংহ',
    districts: [
      { id: 'mymensingh', nameEn: 'Mymensingh', nameBn: 'ময়মনসিংহ', divisionEn: 'Mymensingh', divisionBn: 'ময়মনসিংহ' },
      { id: 'jamalpur', nameEn: 'Jamalpur', nameBn: 'জামালপুর', divisionEn: 'Mymensingh', divisionBn: 'ময়মনসিংহ' },
      { id: 'netrokona', nameEn: 'Netrokona', nameBn: 'নেত্রকোণা', divisionEn: 'Mymensingh', divisionBn: 'ময়মনসিংহ', aliases: ['netrakona'] },
      { id: 'sherpur', nameEn: 'Sherpur', nameBn: 'শেরপুর', divisionEn: 'Mymensingh', divisionBn: 'ময়মনসিংহ' },
    ]
  }
];

export const ALL_DISTRICTS: District[] = DIVISIONS_AND_DISTRICTS.flatMap(d => d.districts);

/**
 * Finds a matching district object by district ID, name in English or Bengali, or alias.
 */
export function findDistrict(query?: string | null): District | undefined {
  if (!query) return undefined;
  const cleanQuery = query.trim().toLowerCase();

  return ALL_DISTRICTS.find(d => 
    d.id.toLowerCase() === cleanQuery ||
    d.nameEn.toLowerCase() === cleanQuery ||
    d.nameBn === query.trim() ||
    (d.aliases && d.aliases.some(a => a.toLowerCase() === cleanQuery))
  );
}

/**
 * Checks if a given text/address contains a specific district (matching by id, English name, Bengali name, or aliases)
 */
export function matchDistrictInAddress(address?: string | null, targetDistrictIdOrName?: string | null): boolean {
  if (!targetDistrictIdOrName || targetDistrictIdOrName === 'all') return true;
  if (!address) return false;

  const targetDistrict = findDistrict(targetDistrictIdOrName) || {
    id: targetDistrictIdOrName.toLowerCase(),
    nameEn: targetDistrictIdOrName,
    nameBn: targetDistrictIdOrName,
    divisionEn: '',
    divisionBn: '',
    aliases: []
  };

  const normalizedAddress = address.toLowerCase();
  
  // Direct check
  if (normalizedAddress.includes(targetDistrict.id.toLowerCase())) return true;
  if (normalizedAddress.includes(targetDistrict.nameEn.toLowerCase())) return true;
  if (address.includes(targetDistrict.nameBn)) return true;

  if (targetDistrict.aliases) {
    for (const alias of targetDistrict.aliases) {
      if (normalizedAddress.includes(alias.toLowerCase())) return true;
      if (address.includes(alias)) return true;
    }
  }

  return false;
}

/**
 * Extracts or detects a district from an address string
 */
export function detectDistrictFromAddress(address?: string | null): District | undefined {
  if (!address) return undefined;
  const normalized = address.toLowerCase();

  for (const d of ALL_DISTRICTS) {
    if (address.includes(d.nameBn)) return d;
    if (normalized.includes(d.id)) return d;
    if (normalized.includes(d.nameEn.toLowerCase())) return d;
    if (d.aliases) {
      for (const a of d.aliases) {
        if (normalized.includes(a.toLowerCase()) || address.includes(a)) return d;
      }
    }
  }

  return undefined;
}

/**
 * Formats district name based on active language
 */
export function formatDistrictName(district: District | string | undefined, lang: 'bn' | 'en' = 'bn'): string {
  if (!district) return '';
  if (typeof district === 'string') {
    const found = findDistrict(district);
    if (found) {
      return lang === 'bn' ? found.nameBn : found.nameEn;
    }
    return district;
  }
  return lang === 'bn' ? district.nameBn : district.nameEn;
}
