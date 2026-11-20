export type DashLang = "bn" | "en";

export const DASH_I18N: Record<string, { bn: string; en: string }> = {
  // Sidebar
  mainMenu: { bn: "মূল মেনু", en: "MAIN MENU" },
  overview: { bn: "ওভারভিউ", en: "Overview" },
  orders: { bn: "অর্ডার ও ডেলিভারি", en: "Orders & Fulfillment" },
  products: { bn: "পণ্য ও ইনভেন্টরি", en: "Products & Stock" },
  hero: { bn: "হিরো ব্যানার", en: "Hero Banners" },
  coupons: { bn: "কুপন ও অফার", en: "Coupons & Deals" },
  courier: { bn: "কুরিয়ার লজিস্টিকস", en: "Courier Logistics" },
  gallery: { bn: "মিডিয়া গ্যালারি", en: "Image Gallery" },
  customers: { bn: "গ্রাহক তালিকা", en: "Customer Directory" },
  layout: { bn: "হোমপেজ লেআউট", en: "Homepage Themes" },
  categories: { bn: "ক্যাটাগরি ম্যানেজার", en: "Category Manager" },
  storefront: { bn: "ওয়েবসাইটে যান ↗", en: "Storefront ↗" },
  djangoAdmin: { bn: "জ্যাঙ্গো ব্যাকেন্ড ↗", en: "Django ↗" },
  storeAdmin: { bn: "স্টোর অ্যাডমিন", en: "Store Admin" },
  onlineSession: { bn: "অনলাইন সেশন", en: "Online Session" },

  // Topbar
  titleOverview: { bn: "ড্যাশবোর্ড ওভারভিউ", en: "Dashboard Overview" },
  titleOrders: { bn: "অর্ডার ও ডেলিভারি ব্যবস্থাপনা", en: "Orders & Fulfillment" },
  titleProducts: { bn: "পণ্য ও ইনভেন্টরি তালিকা", en: "Products & Inventory" },
  titleHero: { bn: "হোম হিরো স্লাইডার ও ব্যানার ম্যানেজমেন্ট", en: "Hero Slider & Banners" },
  titleCoupons: { bn: "ডিসকাউন্ট ও কুপন কোড", en: "Promotions & Coupon Discounts" },
  titleCourier: { bn: "কুরিয়ার ও পার্সেল লজিস্টিকস", en: "Courier & Delivery Logistics" },
  titleGallery: { bn: "সেন্ট্রাল ইমেজ ও মিডিয়া লাইব্রেরি", en: "Central Image Gallery & Media Hub" },
  titleCustomers: { bn: "গ্রাহক ও কাস্টমার তালিকা", en: "Customer Directory" },
  titleLayout: { bn: "হোমপেজ ডিজাইন মডেল ও লেআউট ম্যানেজার", en: "Homepage Design Models & Themes" },
  titleCategories: { bn: "ক্যাটাগরি ম্যানেজমেন্ট ও সাজসজ্জা", en: "Category Management & Catalog" },
  addProduct: { bn: "নতুন পণ্য যোগ", en: "Add Product" },
  refresh: { bn: "রিফ্রেশ", en: "Refresh" },
  language: { bn: "ভাষা", en: "Language" },

  // Overview Header & KPIs
  financialOverviewTitle: { bn: "স্টোর পারফরম্যান্স ও আর্থিক হিসাব", en: "Store Performance & Financial Overview" },
  financialOverviewSub: { bn: "লাইভ রেভিনিউ, নিট লাভ, ইনভেন্টরি স্টক মূল্যায়ন ও প্রোডাক্ট প্রাইস অ্যানালিটিক্স", en: "Live revenue, net profit, stock valuation and pricing analytics" },
  financialMetricsTag: { bn: "আর্থিক লাভ ও বিক্রয় বিবরণী (Revenue & Profit Metrics)", en: "Financial Profit & Revenue Metrics" },
  inventoryMetricsTag: { bn: "ইনভেন্টরি ও গোডাউন স্টক মূল্যায়ন (Inventory & Stock Valuation)", en: "Inventory & Warehouse Stock Valuation" },
  totalRevenue: { bn: "মোট বিক্রয় (Total Revenue)", en: "Total Revenue" },
  last30Days: { bn: "গত ৩০ দিন", en: "Last 30 Days" },
  grossProfit: { bn: "মোট নিট লাভ (Gross Profit)", en: "Gross Profit" },
  margin: { bn: "মার্জিন", en: "Margin" },
  avgProfit: { bn: "গড় লাভ", en: "Avg Profit" },
  totalOrders: { bn: "মোট অর্ডার (Total Orders)", en: "Total Orders" },
  pendingOrders: { bn: "অপেক্ষমান অর্ডার (Pending)", en: "Pending Orders" },
  deliveredOrders: { bn: "সফল ডেলিভারি (Delivered)", en: "Delivered Orders" },
  cancelledOrders: { bn: "বাতিল অর্ডার (Cancelled)", en: "Cancelled Orders" },
  retailStockValuation: { bn: "খুচরা বিক্রয় মূল্যে মোট স্টক", en: "Retail Valuation of Total Stock" },
  totalStockUnits: { bn: "মোট মজুদ", en: "Total Stock" },
  pieces: { bn: "পিস", en: "items" },
  costStockValuation: { bn: "গোডাউনে মোট মূলধন (Cost Value)", en: "Total Invested Capital (Cost Value)" },
  costStockValuationSub: { bn: "গোডাউনে আটকে থাকা মোট মূলধন", en: "Total capital tied up in warehouse stock" },
  potentialProfit: { bn: "সম্ভাব্য নিট লাভ (Expected Profit)", en: "Potential Net Profit (Expected Profit)" },
  potentialProfitSub: { bn: "সব স্টক বিক্রি হলে অর্জিতব্য লাভ", en: "Estimated net profit if all current stock is sold" },
  salesAnalytics: { bn: "দৈনিক বিক্রয় ও লাভ গ্রাফ (Sales & Net Profit Analytics)", en: "Daily Sales & Net Profit Analytics" },
  last7Days: { bn: "গত ৭ দিন", en: "Last 7 Days" },
  last14Days: { bn: "গত ১৪ দিন", en: "Last 14 Days" },
  dualMetric: { bn: "বিক্রয় ও লাভ", en: "Revenue & Profit" },
  ordersMetric: { bn: "অর্ডার সংখ্যা", en: "Order Count" },
  topSellingProducts: { bn: "সবচেয়ে বেশি বিক্রিত পণ্য (Top Selling Products)", en: "Top Selling Products" },
  categoryBreakdown: { bn: "ক্যাটাগরি ভিত্তিক স্টক ও বিক্রয় বিবরণী", en: "Category Stock & Sales Breakdown" },
  recentOrders: { bn: "সাম্প্রতিক অর্ডার তালিকা (Recent Orders)", en: "Recent Orders" },

  // Orders Tab
  statusAll: { bn: "সব", en: "All" },
  statusPending: { bn: "পেন্ডিং", en: "Pending" },
  statusConfirmed: { bn: "কনফার্মড", en: "Confirmed" },
  statusCourierBooked: { bn: "কুরিয়ার বুকড", en: "Courier Booked" },
  statusProcessing: { bn: "প্রসেসিং", en: "Processing" },
  statusPaid: { bn: "পরিশোধিত", en: "Paid" },
  statusShipped: { bn: "শিপড", en: "Shipped" },
  statusDelivered: { bn: "ডেলিভার্ড", en: "Delivered" },
  statusCancelled: { bn: "বাতিল", en: "Cancelled" },
  searchOrdersPlaceholder: { bn: "অর্ডার খুঁজুন (নাম, ফোন নম্বর বা অর্ডার আইডি)...", en: "Search orders by name, phone, or order ID..." },
  exportCsv: { bn: "এক্সপোর্ট CSV", en: "Export CSV" },
  bulkUpdate: { bn: "বাল্ক আপডেট", en: "Bulk Update" },
  orderNo: { bn: "অর্ডার নং", en: "Order #" },
  customer: { bn: "ক্রেতার তথ্য", en: "Customer Info" },
  productsCount: { bn: "পণ্য", en: "Products" },
  totalAmount: { bn: "মোট মূল্য", en: "Total Amount" },
  paymentMethod: { bn: "পেমেন্ট", en: "Payment" },
  courierCol: { bn: "কুরিয়ার", en: "Courier" },
  statusHeader: { bn: "স্ট্যাটাস", en: "Status" },
  actions: { bn: "অ্যাকশন", en: "Actions" },
  viewDetails: { bn: "ডিটেইলস", en: "Details" },
  bookToCourier: { bn: "কুরিয়ারে পাঠান", en: "Book Courier" },
  trackCourier: { bn: "ট্র্যাকিং", en: "Track" },
  printSlip: { bn: "প্রিন্ট চালান", en: "Print Invoice" },

  // Products Tab
  productCatalogTitle: { bn: "প্রোডাক্ট ক্যাটালগ ও ইনভেন্টরি", en: "Product Catalog & Inventory" },
  productCatalogSub: { bn: "সকল পণ্যের বিবরণ, স্টক লেভেল এবং ভ্যারিয়েন্ট পরিচালনা করুন।", en: "Manage all product specifications, stock levels, and variants." },
  searchProductPlaceholder: { bn: "পণ্য খুঁজুন (নাম বা SKU)...", en: "Search products by name or SKU..." },
  allCategories: { bn: "সকল ক্যাটাগরি", en: "All Categories" },
  lowStockOnly: { bn: "সীমিত স্টক (Low Stock)", en: "Low Stock Only" },
  productImage: { bn: "ছবি", en: "Image" },
  productName: { bn: "পণ্যের নাম ও ক্যাটাগরি", en: "Product Name & Category" },
  sellingPrice: { bn: "বিক্রয় মূল্য", en: "Selling Price" },
  stockQuantity: { bn: "মজুদ স্টক", en: "Stock Level" },
  featuredStorefront: { bn: "ফিচার্ড", en: "Featured" },
  activeStatus: { bn: "অবস্থা", en: "Status" },
  editProduct: { bn: "সম্পাদনা", en: "Edit" },
  deleteProduct: { bn: "মুছুন", en: "Delete" },
  active: { bn: "সক্রিয়", en: "Active" },
  inactive: { bn: "নিষ্ক্রিয়", en: "Inactive" },

  // Coupons Tab
  couponTitle: { bn: "ডিসকাউন্ট কুপন ও প্রমোশন", en: "Discount Coupons & Promotions" },
  couponSub: { bn: "ক্রেতাদের জন্য বিশেষ অফার ও কুপন কোড তৈরি ও পরিচালনা করুন।", en: "Create and manage special discount codes and promotional offers." },
  createCoupon: { bn: "+ নতুন কুপন", en: "+ Create Coupon" },
  couponCode: { bn: "কুপন কোড", en: "Coupon Code" },
  discount: { bn: "ছাড়", en: "Discount" },
  minOrder: { bn: "নূন্যতম অর্ডার", en: "Min Order" },
  validUntil: { bn: "মেয়াদ", en: "Valid Until" },

  // Courier Tab
  courierTitle: { bn: "কুরিয়ার পার্সেল ও ডেলিভারি লজিস্টিকস", en: "Courier Logistics & Delivery Management" },
  courierSub: { bn: "Steadfast এবং Pathao কুরিয়ার ইন্টিগ্রেশন এবং লাইভ ট্র্যাকিং।", en: "Steadfast & Pathao courier integration with live parcel tracking." },
  dispatchedParcels: { bn: "পাঠানো পার্সেলসমূহ", en: "Dispatched Parcels" },
  pendingBooking: { bn: "বুকিং বাকি অর্ডার", en: "Pending Courier Booking" },
  apiSettings: { bn: "কুরিয়ার API কনফিগারেশন", en: "Courier API Settings" },

  // Hero Banners Tab
  heroTitle: { bn: "হোম হিরো স্লাইডার ও ব্যানার ম্যানেজমেন্ট", en: "Homepage Hero Slider & Banners" },
  heroSub: { bn: "হোমপেজের মূল হিরো স্লাইডার এবং আকর্ষণীয় ব্যানারগুলো সাজান।", en: "Manage homepage hero slides, campaign banners, and call-to-actions." },
  addSlide: { bn: "+ নতুন স্লাইড", en: "+ Add New Slide" },

  // Media Gallery Tab
  galleryTitle: { bn: "সেন্ট্রাল ইমেজ ও মিডিয়া লাইব্রেরি", en: "Central Image & Media Hub" },
  gallerySub: { bn: "পণ্যের জন্য উচ্চ রেজুলিউশনের ছবি আপলোড ও পরিচালনা করুন।", en: "Upload, manage, and attach high-resolution product media." },

  // Customer Directory Tab
  customerTitle: { bn: "গ্রাহক ও ক্রেতা ডিরেক্টরি", en: "Customer & Client Directory" },
  customerSub: { bn: "সকল নিবন্ধিত এবং অর্ডারকারী গ্রাহকের সম্পূর্ণ প্রোফাইল ও অর্ডারের ইতিহাস।", en: "Profiles and complete ordering history of registered customers." },
  searchCustomerPlaceholder: { bn: "গ্রাহক খুঁজুন (নাম, ইমেইল বা ফোন নম্বর)...", en: "Search customers by name, email, or phone..." },
  totalSpent: { bn: "মোট খরচ", en: "Total Spent" },
  lastOrder: { bn: "সর্বশেষ অর্ডার", en: "Last Order" }
};

export function getDashText(key: string, lang: DashLang = "bn"): string {
  const item = DASH_I18N[key];
  if (!item) return key;
  return item[lang] || item.bn || key;
}
