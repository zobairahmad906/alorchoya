export type DistrictData = {
  division: string;
  district: string;
  upazilas: string[];
  isDhaka: boolean;
};

export const BANGLADESH_DISTRICTS: DistrictData[] = [
  // 1. Dhaka Division (13 Districts)
  { division: "ঢাকা (Dhaka)", district: "ঢাকা (Dhaka City)", upazilas: ["ধানমন্ডি", "গুলশান", "বনানী", "উত্তরা", "মিরপুর", "মোহাম্মদপুর", "বাড্ডা", "খিলগাঁও", "যাত্রাবাড়ী", "লালবাগ", "মতিঝিল", "শাহবাগ", "পল্টন", "তেজগাঁও", "রমনা", "সাভার", "ধামরাই", "কেরানীগঞ্জ", "নবাবগঞ্জ", "দোহার"], isDhaka: true },
  { division: "ঢাকা (Dhaka)", district: "গাজীপুর (Gazipur)", upazilas: ["গাজীপুর সদর", "কালিয়াকৈড়", "কাপাসিয়া", "শ্রীপুর", "কালীগঞ্জ"], isDhaka: false },
  { division: "ঢাকা (Dhaka)", district: "নারায়ণগঞ্জ (Narayanganj)", upazilas: ["নারায়ণগঞ্জ সদর", "বন্দর", "আড়াইহাজার", "রূপগঞ্জ", "সোনারগাঁও"], isDhaka: false },
  { division: "ঢাকা (Dhaka)", district: "মুন্সীগঞ্জ (Munshiganj)", upazilas: ["মুন্সীগঞ্জ সদর", "টঙ্গীবাড়ী", "সিরাজদিখান", "লৌহজং", "শ্রীনগর", "গজারিয়া"], isDhaka: false },
  { division: "ঢাকা (Dhaka)", district: "মানিকগঞ্জ (Manikganj)", upazilas: ["মানিকগঞ্জ সদর", "সিংগাইর", "শিবালয়", "ঘিওর", "হরিরামপুর", "সাটুরিয়া", "দৌলতপুর"], isDhaka: false },
  { division: "ঢাকা (Dhaka)", district: "নরসিংদী (Narsingdi)", upazilas: ["নরসিংদী সদর", "পলাশ", "শিবপুর", "মনোহরদী", "বেলাব", "রায়পুরা"], isDhaka: false },
  { division: "ঢাকা (Dhaka)", district: "টাঙ্গাইল (Tangail)", upazilas: ["টাঙ্গাইল সদর", "মির্জাপুর", "কালিহাতী", "ঘাটাইল", "সখীপুর", "বাসাইল", "নাগরপুর", "মধুপুর", "গোপালপুর", "দেলদুয়ার", "ভূঞাপুর", "ধনবাড়ী"], isDhaka: false },
  { division: "ঢাকা (Dhaka)", district: "ফরিদপুর (Faridpur)", upazilas: ["ফরিদপুর সদর", "বোয়ালমারী", "আলফাডাঙ্গা", "মধুখালী", "ভাংগা", "নগরকান্দা", "চরভদ্রাসন", "সদরপুর", "সালথা"], isDhaka: false },
  { division: "ঢাকা (Dhaka)", district: "মাদারীপুর (Madaripur)", upazilas: ["মাদারীপুর সদর", "শিবচর", "কালকিনি", "রাজৈর", "দশরথপুর"], isDhaka: false },
  { division: "ঢাকা (Dhaka)", district: "শরীয়তপুর (Shariatpur)", upazilas: ["শরীয়তপুর সদর", "নড়িয়া", "জাজিরা", "গোসাইরহাট", "ভেদরগঞ্জ", "ডামুড্যা"], isDhaka: false },
  { division: "ঢাকা (Dhaka)", district: "রাজবাড়ী (Rajbari)", upazilas: ["রাজবাড়ী সদর", "পাংশা", "বালিয়াকান্দি", "গোয়ালন্দ", "কালুখালী"], isDhaka: false },
  { division: "ঢাকা (Dhaka)", district: "গোপালগঞ্জ (Gopalganj)", upazilas: ["গোপালগঞ্জ সদর", "টুঙ্গিপাড়া", "কোটালীপাড়া", "কাসিয়ানী", "মুকসুদপুর"], isDhaka: false },
  { division: "ঢাকা (Dhaka)", district: "কিশোরগঞ্জ (Kishoreganj)", upazilas: ["কিশোরগঞ্জ সদর", "ভৈরব", "হোসেনপুর", "কটিয়াদী", "পাকুন্দিয়া", "তারাইল", "করিমগঞ্জ", "ইটনা", "মিঠামইন", "অষ্টগ্রাম", "নিকলী", "বাজিতপুর", "কুলিয়ারচর"], isDhaka: false },

  // 2. Chittagong Division (11 Districts)
  { division: "চট্টগ্রাম (Chittagong)", district: "চট্টগ্রাম (Chittagong)", upazilas: ["চট্টগ্রাম সদর", "পটিয়া", "হাটহাজারী", "মিরসরাই", "সীতাকুণ্ড", "রাঙ্গুনিয়া", "বাঁশখালী", "আনোয়ারা", "বোয়ালখালী", "চন্দনাইশ", "ফটিকছড়ি", "লোহাগাড়া", "সন্দীপ", "সাতকানিয়া", "কর্ণফুলী"], isDhaka: false },
  { division: "চট্টগ্রাম (Chittagong)", district: "কক্সবাজার (Cox's Bazar)", upazilas: ["কক্সবাজার সদর", "উখিয়া", "টেকনাফ", "চকরিয়া", "মহেশখালী", "পেকুয়া", "কুতুবদিয়া", "রামু", "ঈদগাঁও"], isDhaka: false },
  { division: "চট্টগ্রাম (Chittagong)", district: "কুমিল্লা (Cumilla)", upazilas: ["কুমিল্লা সদর", "লাকসাম", "দাউদকান্দি", "দেবিদ্বার", "চান্দিনা", "বুড়িচং", "ব্রাহ্মণপাড়া", "নাঙ্গলকোট", "হোমনা", "মেঘনা", "মুরাদনগর", "মনোহরগঞ্জ", "চৌদ্দগ্রাম", "বরুড়া", "তিটাস", "লালমাই"], isDhaka: false },
  { division: "চট্টগ্রাম (Chittagong)", district: "ফেনী (Feni)", upazilas: ["ফেনী সদর", "ছাগলনাইয়া", "দাগনভূঞা", "পরশুরাম", "ফুলগাজী", "সোনাগাজী"], isDhaka: false },
  { division: "চট্টগ্রাম (Chittagong)", district: "নোয়াখালী (Noakhali)", upazilas: ["নোয়াখালী সদর", "বেগমগঞ্জ", "চাটখিল", "কোম্পানীগঞ্জ", "সেনবাগ", "হাতিয়া", "কবীরহাট", "সোনাইমুড়ী", "সুবর্ণচর"], isDhaka: false },
  { division: "চট্টগ্রাম (Chittagong)", district: "লক্ষ্মীপুর (Lakshmipur)", upazilas: ["লক্ষ্মীপুর সদর", "রায়পুর", "রামগঞ্জ", "রামগতি", "কমলনগর"], isDhaka: false },
  { division: "চট্টগ্রাম (Chittagong)", district: "ব্রাহ্মণবাড়িয়া (Brahmanbaria)", upazilas: ["ব্রাহ্মণবাড়িয়া সদর", "আশুগঞ্জ", "বাঞ্ছারামপুর", "নবীনগর", "সরাইল", "কসবা", "আখাউড়া", "নাসিরনগর", "বিজয়নগর"], isDhaka: false },
  { division: "চট্টগ্রাম (Chittagong)", district: "চাঁদপুর (Chandpur)", upazilas: ["চাঁদপুর সদর", "ফরিদগঞ্জ", "হাইমচর", "হাজীগঞ্জ", "কচুয়া", "মতলব উত্তর", "মতলব দক্ষিণ", "শাহরাস্তি"], isDhaka: false },
  { division: "চট্টগ্রাম (Chittagong)", district: "রাঙ্গামাটি (Rangamati)", upazilas: ["রাঙ্গামাটি সদর", "কাপ্তাই", "কাউখালী", "বাঘাইছড়ি", "বরকল", "লংগদু", "রাজস্থলী", "বেতবুনিয়া", "জুরাছড়ি", "নানিয়ারচর"], isDhaka: false },
  { division: "চট্টগ্রাম (Chittagong)", district: "বান্দরবান (Bandarban)", upazilas: ["বান্দরবান সদর", "থানচি", "রূমা", "রোয়াংছড়ি", "লামা", "আলিকদম", "নাইক্ষ্যংছড়ি"], isDhaka: false },
  { division: "চট্টগ্রাম (Chittagong)", district: "খাগড়াছড়ি (Khagrachhari)", upazilas: ["খাগড়াছড়ি সদর", "দিঘীनाला", "পানছড়ি", "মহালছড়ি", "মাটিরাঙ্গা", "রামগড়", "মানিকছড়ি", "লক্ষ্মীছড়ি"], isDhaka: false },

  // 3. Rajshahi Division (8 Districts)
  { division: "রাজশাহী (Rajshahi)", district: "রাজশাহী (Rajshahi)", upazilas: ["রাজশাহী সদর", "পবা", "গোদাগাড়ী", "তানোর", "মোহনপুর", "বাগমারা", "দুর্গাপুর", "পুঠিয়া", "চারঘাট", "বাঘা"], isDhaka: false },
  { division: "রাজশাহী (Rajshahi)", district: "বগুড়া (Bogra)", upazilas: ["বগুড়া সদর", "শেরপুর", "শিবগঞ্জ", "ধুনট", "নন্দীগ্রাম", "শাজাহানপুর", "কাহালু", "গাবতলী", "সারিয়াকান্দি", "আদমদীঘি", "দুপচাঁচিয়া", "সোনারায়"], isDhaka: false },
  { division: "রাজশাহী (Rajshahi)", district: "পাবনা (Pabna)", upazilas: ["পাবনা সদর", "ঈশ্বরদী", "অষ্টগ্রাম", "বেড়া", "ভাংগুড়া", "চাটমোহর", "ফরিদপুর", "সাঁথিয়া", "সুজানগর"], isDhaka: false },
  { division: "রাজশাহী (Rajshahi)", district: "সিরাজগঞ্জ (Sirajganj)", upazilas: ["সিরাজগঞ্জ সদর", "শাহজাদপুর", "উল্লাপাড়া", "বেলকুচি", "কামারখন্দ", "কাজীপুর", "রায়গঞ্জ", "তারাস", "চৌহালী"], isDhaka: false },
  { division: "রাজশাহী (Rajshahi)", district: "নওগাঁ (Naogaon)", upazilas: ["নওগাঁ সদর", "মহাদেবপুর", "মান্দা", "নিয়ামতপুর", "পত্নীতলা", "ধামইরহাট", "বদলগাছী", "রাণীনগর", "আত্রাই", "সাপাহার", "পোরশা"], isDhaka: false },
  { division: "রাজশাহী (Rajshahi)", district: "নাটোর (Natore)", upazilas: ["নাটোর সদর", "সিংড়া", "বড়াইগ্রাম", "গুরুদাসপুর", "লালপুর", "বাগাতিপাড়া", "নলডাঙ্গা"], isDhaka: false },
  { division: "রাজশাহী (Rajshahi)", district: "চাঁপাইনবাবগঞ্জ (Chapainawabganj)", upazilas: ["চাঁপাইনবাবগঞ্জ সদর", "শিবগঞ্জ", "গোমস্তাপুর", "নাচোল", "ভোলাহাট"], isDhaka: false },
  { division: "রাজশাহী (Rajshahi)", district: "জয়পুরহাট (Joypurhat)", upazilas: ["জয়পুরহাট সদর", "পাঁচবিবি", "কালাই", "ক্ষেতলাল", "আক্কেলপুর"], isDhaka: false },

  // 4. Khulna Division (10 Districts)
  { division: "খুলনা (Khulna)", district: "খুলনা (Khulna)", upazilas: ["খুলনা সদর", "রূপসা", "ডুমুরিয়া", "ফুলতলা", "বটিয়াঘাটা", "দাকোপ", "পাইকগাছা", "কয়রা", "তেরখাদা"], isDhaka: false },
  { division: "খুলনা (Khulna)", district: "যশোর (Jashore)", upazilas: ["যশোর সদর", "ঝিকরগাছা", "চৌগাছা", "শার্শা", "মণিরামপুর", "কেশবপুর", "অভয়নগর", "বাঘারপাড়া"], isDhaka: false },
  { division: "খুলনা (Khulna)", district: "কুষ্টিয়া (Kushtia)", upazilas: ["কুষ্টিয়া সদর", "কুমারখালী", "খোকসা", "মিরপুর", "ভেড়ামারা", "দৌলতপুর"], isDhaka: false },
  { division: "খুলনা (Khulna)", district: "সাতক্ষীরা (Satkhira)", upazilas: ["সাতক্ষীরা সদর", "কলারোয়া", "তালা", "দেবহাটা", "কালীগঞ্জ", "আশাশুনি", "শ্যামনগর"], isDhaka: false },
  { division: "খুলনা (Khulna)", district: "বাগেরহাট (Bagerhat)", upazilas: ["বাগেরহাট সদর", "ফকিরহাট", "মোল্লাহাট", "চিতলমারী", "কচুয়া", "রামপাল", "মোংলা", "মোরেলগঞ্জ", "শরণখোলা"], isDhaka: false },
  { division: "খুলনা (Khulna)", district: "ঝিনাইদহ (Jhenaidah)", upazilas: ["ঝিনাইদহ সদর", "কালীগঞ্জ", "কোটচাঁদপুর", "মহেশপুর", "শৈলকুপা", "হরিণাকুণ্ডু"], isDhaka: false },
  { division: "খুলনা (Khulna)", district: "চুয়াডাঙ্গা (Chuadanga)", upazilas: ["চুয়াডাঙ্গা সদর", "আলমডাঙ্গা", "দামুড়হুদা", "জীবননগর"], isDhaka: false },
  { division: "খুলনা (Khulna)", district: "মেহেরপুর (Meherpur)", upazilas: ["মেহেরপুর সদর", "গাংনী", "মুজিবনগর"], isDhaka: false },
  { division: "খুলনা (Khulna)", district: "নড়াইল (Narail)", upazilas: ["নড়াইল সদর", "লোহাগড়া", "কালিয়া"], isDhaka: false },
  { division: "খুলনা (Khulna)", district: "মাগুরা (Magura)", upazilas: ["মাগুরা সদর", "শ্রীপুর", "শালিখা", "মুহম্মদপুর"], isDhaka: false },

  // 5. Barisal Division (6 Districts)
  { division: "বরিশাল (Barishal)", district: "বরিশাল (Barishal)", upazilas: ["বরিশাল সদর", "বাকেরগঞ্জ", "বাবুগঞ্জ", "উজিরপুর", "বানারীপাড়া", "গৌরনদী", "আগৈলঝাড়া", "মেহেন্দিগঞ্জ", "মুলাদী", "হিজলা"], isDhaka: false },
  { division: "বরিশাল (Barishal)", district: "পটুয়াখালী (Patuakhali)", upazilas: ["পটুয়াখালী সদর", "গলাচিপা", "বাউফল", "দশমিনা", "মির্জাগঞ্জ", "কলাপাড়া", "দুমকি", "রাঙ্গাবালী"], isDhaka: false },
  { division: "বরিশাল (Barishal)", district: "ভোলা (Bhola)", upazilas: ["ভোলা সদর", "দৌলতখান", "বোরহানউদ্দিন", "তজুমদ্দিন", "লালমোহন", "চরফ্যাশন", "মনপুরা"], isDhaka: false },
  { division: "বরিশাল (Barishal)", district: "পিরোজপুর (Pirojpur)", upazilas: ["পিরোজপুর সদর", "ইন্দুরকানী", "কাউখালী", "জীয়ানগর", "নাজিরপুর", "নেছারাবাদ (স্বরূপকাঠী)", "ভাণ্ডারিয়া", "মঠবাড়িয়া"], isDhaka: false },
  { division: "বরিশাল (Barishal)", district: "বরগুনা (Barguna)", upazilas: ["বরগুনা সদর", "আমতলী", "পাথরঘাটা", "বেতাগী", "বামনা", "তালতলী"], isDhaka: false },
  { division: "বরিশাল (Barishal)", district: "ঝালকাঠি (Jhalokathi)", upazilas: ["ঝালকাঠি সদর", "কাঠালিয়া", "নলছিটি", "রাজাপুর"], isDhaka: false },

  // 6. Sylhet Division (4 Districts)
  { division: "সিলেট (Sylhet)", district: "সিলেট (Sylhet)", upazilas: ["সিলেট সদর", "দক্ষিণ সুরমা", "গোলাপগঞ্জ", "বিয়ানীবাজার", "জকিগঞ্জ", "কানাঘাট", "জৈন্তাপুর", "গোয়াইনঘাট", "কোম্পানীগঞ্জ", "ফেনচুগঞ্জ", "বালাগঞ্জ", "বিশ্বনাথ", "ওসমানীনগর"], isDhaka: false },
  { division: "সিলেট (Sylhet)", district: "মৌলভীবাজার (Moulvibazar)", upazilas: ["মৌলভীবাজার সদর", "শ্রীমঙ্গল", "কমলগঞ্জ", "কুলাউড়া", "বড়লেখা", "জুড়ী", "রাজনগর"], isDhaka: false },
  { division: "সিলেট (Sylhet)", district: "হবিগঞ্জ (Habiganj)", upazilas: ["হবিগঞ্জ সদর", "লাখাই", "মাধবপুর", "চুনারুঘাট", "বাহুবল", "নবীগঞ্জ", "আজমিরীগঞ্জ", "বানিয়াচং", "শায়েস্তাগঞ্জ"], isDhaka: false },
  { division: "সিলেট (Sylhet)", district: "সুনামগঞ্জ (Sunamganj)", upazilas: ["সুনামগঞ্জ সদর", "দক্ষিণ সুনামগঞ্জ (শান্তিগঞ্জ)", "ছাতক", "দোয়ারাবাজার", "জগন্নাথপুর", "দিরাই", "শাল্লা", "ধর্মপাশা", "জামালগঞ্জ", "তাহিরপুর", "বিশ্বম্ভরপুর", "মধ্যনগর"], isDhaka: false },

  // 7. Rangpur Division (8 Districts)
  { division: "রংপুর (Rangpur)", district: "রংপুর (Rangpur)", upazilas: ["রংপুর সদর", "গংগাচড়া", "বদরগঞ্জ", "মিঠাপুকুর", "পিরগঞ্জ", "কাউনিয়া", "পীরগাছা", "তারাগঞ্জ"], isDhaka: false },
  { division: "রংপুর (Rangpur)", district: "দিনাজপুর (Dinajpur)", upazilas: ["দিনাজপুর সদর", "বীরগঞ্জ", "কাহারোল", "বোচাগঞ্জ", "বিরল", "ফুলবাড়ী", "পার্বতীপুর", "হাকিমপুর", "নবাবগঞ্জ", "বিরামপুর", "ঘোড়াঘাট", "চিরিরবন্দর", "খানসামা"], isDhaka: false },
  { division: "রংপুর (Rangpur)", district: "গাইবান্ধা (Gaibandha)", upazilas: ["গাইবান্ধা সদর", "সাদুল্লাপুর", "পলাশবাড়ী", "গোবিন্দগঞ্জ", "সুন্দরগঞ্জ", "সাঘাটা", "ফুলছড়ি"], isDhaka: false },
  { division: "রংপুর (Rangpur)", district: "কুড়িগ্রাম (Kurigram)", upazilas: ["কুড়িগ্রাম সদর", "নাগেশ্বরী", "ভুরুঙ্গামারী", "ফুলবাড়ী", "রাজারহাট", "উলিপুর", "চিলমারী", "রৌমারী", "চর রাজিবপুর"], isDhaka: false },
  { division: "রংপুর (Rangpur)", district: "নীলফামারী (Nilphamari)", upazilas: ["নীলফামারী সদর", "সৈয়দপুর", "ডোমার", "ডিমলা", "জলঢাকা", "কিশোরগঞ্জ"], isDhaka: false },
  { division: "রংপুর (Rangpur)", district: "লালমনিরহাট (Lalmonirhat)", upazilas: ["লালমনিরহাট সদর", "কালীগঞ্জ", "হাতীবান্ধা", "পাটগ্রাম", "আদিতমারী"], isDhaka: false },
  { division: "রংপুর (Rangpur)", district: "পঞ্চগড় (Panchagarh)", upazilas: ["পঞ্চগড় সদর", "তেঁতুলিয়া", "বোদা", "আটোয়ারী", "দেবীগঞ্জ"], isDhaka: false },
  { division: "রংপুর (Rangpur)", district: "ঠাকুরগাঁও (Thakurgaon)", upazilas: ["ঠাকুরগাঁও সদর", "পীরগঞ্জ", "রানীশংকৈল", "হরিপুর", "বালিয়াডাঙ্গী"], isDhaka: false },

  // 8. Mymensingh Division (4 Districts)
  { division: "ময়মনসিংহ (Mymensingh)", district: "ময়মনসিংহ (Mymensingh)", upazilas: ["ময়মনসিংহ সদর", "মুক্তাগাছা", "ফুলবাড়ীয়া", "ত্রিশাল", "ভালুকা", "গফরগাঁও", "নান্দাইল", "ঈশ্বরগঞ্জ", "ধোবাউড়া", "হালুয়াঘাট", "ফুলপুর", "তারা কান্দা"], isDhaka: false },
  { division: "ময়মনসিংহ (Mymensingh)", district: "জামালপুর (Jamalpur)", upazilas: ["জামালপুর সদর", "মেলান্দহ", "ইসলামপুর", "দেওয়ানগঞ্জ", "মাদারগঞ্জ", "সরিষাবাড়ী", "বকশীগঞ্জ"], isDhaka: false },
  { division: "ময়মনসিংহ (Mymensingh)", district: "নেত্রকোণা (Netrokona)", upazilas: ["নেত্রকোণা সদর", "বারহাট্টা", "কলমাকান্দা", "দুর্গাপুর", "আটপাড়া", "কেন্দুয়া", "মদন", "খালিয়াজুরী", "পূর্বধলা", "মোহনগঞ্জ"], isDhaka: false },
  { division: "ময়মনসিংহ (Mymensingh)", district: "শেরপুর (Sherpur)", upazilas: ["শেরপুর সদর", "নালীতাবাড়ী", "শ্রীবরদী", "ঝিনাইগাতী", "নকলা"], isDhaka: false }
];
