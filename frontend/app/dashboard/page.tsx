"use client";

import React, { useState, useEffect, useRef } from "react";
import { MarkdownPreview } from "../markdown";
import Link from "next/link";
import { Header } from "../components";
import ImageGallery from "./ImageGallery";
import ProductForm from "../admin/components/ProductForm";
import toast, { Toaster } from "react-hot-toast";
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Image as ImageIcon,
  Users,
  Store,
  ExternalLink,
  Plus,
  RefreshCw,
  Menu,
  X,
  Wallet,
  TrendingUp,
  ShieldCheck,
  Award,
  Filter,
  ArrowUpRight,
  Package,
  Phone,
  Printer,
  CheckSquare,
  Square,
  Truck,
  CheckCircle2,
  Receipt,
  RotateCcw,
  Tag,
  Download,
  AlertTriangle,
  Star,
  Trash2,
  Copy,
  Edit2,
  Edit3,
  ChevronUp,
  ChevronDown,
  SlidersHorizontal,
  Check,
} from "lucide-react";

// Platform WhatsApp SVG icon
function WhatsAppIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.668-.699c.974.53 1.954.82 2.79.821 3.183 0 5.767-2.586 5.768-5.766.001-3.181-2.584-5.767-5.766-5.767zm3.393 8.163c-.144.405-.837.774-1.17.822-.312.043-.683.08-2.029-.475-1.611-.666-2.651-2.316-2.732-2.423-.081-.107-.655-.87-.655-1.662 0-.791.415-1.182.562-1.341.147-.159.324-.199.432-.199.108 0 .216.001.31.006.101.005.236-.039.369.28.136.326.467 1.137.509 1.22.042.083.07.18.014.292-.056.113-.085.183-.169.282-.085.099-.178.221-.254.298-.085.086-.174.179-.075.349.099.17.44 1.053 1.205 1.733.722.64 1.332.839 1.52.924.188.085.297.071.407-.056.11-.127.469-.548.595-.736.126-.188.252-.157.424-.093.172.064 1.091.514 1.278.608.187.094.312.14.358.219.046.079.046.458-.098.863z" />
    </svg>
  );
}

type OrderItem = {
  id: number;
  product_name: string;
  product_image?: string;
  quantity: number;
  unit_price: string;
};

type Order = {
  id: number;
  status: string;
  status_display: string;
  payment_method: string;
  customer_name: string;
  customer_profile_name?: string | null;
  customer_username?: string | null;
  customer_avatar?: string | null;
  phone?: string;
  email?: string;
  address: string;
  delivery_charge: string;
  discount_amount: string;
  created_at: string;
  total: number;
  items: OrderItem[];
  courier_provider?: string;
  consignment_id?: string;
  tracking_code?: string;
  courier_status?: string;
  courier_booking_data?: any;
};

type CustomerDirectoryItem = {
  id: string | number;
  customer_name: string;
  profile_name?: string | null;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  address: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string;
  purchased_products: { id: number; name: string; image?: string | null }[];
};

type Product = {
  id: number;
  name: string;
  description: string;
  slug: string;
  base_sku?: string;
  price: string;
  discount_price?: string | null;
  cost_price?: string | null;
  stock: number;
  weight_kg?: string | null;
  dimension_length_cm?: string | null;
  dimension_width_cm?: string | null;
  dimension_height_cm?: string | null;
  stock_alert_threshold?: number;
  attributes?: Record<string, string>;
  warranty_information?: string;
  voice_audio_file?: string | null;
  is_featured?: boolean;
  is_active?: boolean;
  category: { id?: number; name: string };
  images: { id: number; image: string; alt_text?: string; is_primary?: boolean; variant_id?: number | null }[];
  variants?: { id?: number; attributes?: Record<string, string>; sku: string; price?: string; stock: number }[];
};

type CouponItem = {
  id: number;
  code: string;
  discount_type: "percent" | "fixed";
  value: string;
  min_order: string;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
};

type CourierConfigItem = {
  id: number;
  provider: "steadfast" | "pathao";
  is_active: boolean;
  is_sandbox: boolean;
  api_key: string;
  api_secret: string;
  client_id: string;
  client_secret: string;
  username: string;
  password: string;
  store_id: string;
  updated_at: string;
};

type HeroSlide = {
  id: number;
  title: string;
  subtitle: string;
  eyebrow: string;
  image: string;
  mobile_image?: string | null;
  button_text: string;
  button_link: string;
  product?: number | null;
  product_slug?: string;
  product_name?: string;
  product_price?: string;
  product_discount_price?: string;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type DashboardStats = {
  total_revenue: number;
  monthly_revenue: number;
  avg_order_value?: number;
  total_orders: number;
  pending_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  total_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
  unique_customers?: number;
  daily_sales: { date: string; revenue: number; orders: number }[];
  top_products?: { name: string; sold: number }[];
  recent_orders: Order[];
};

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "products" | "coupons" | "courier" | "hero" | "gallery" | "customers">("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState("");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [orderSearch, setOrderSearch] = useState<string>("");
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [bulkUpdating, setBulkUpdating] = useState<boolean>(false);

  type CategoryItem = { id: number; name: string; slug: string };

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("");
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [quickEditProductId, setQuickEditProductId] = useState<number | null>(null);
  const [quickPriceVal, setQuickPriceVal] = useState<string>("");
  const [quickStockVal, setQuickStockVal] = useState<string>("");

  // Customer search & state
  const [customerSearch, setCustomerSearch] = useState<string>("");

  // Coupons state
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponSubmitting, setCouponSubmitting] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: "",
    discount_type: "percent" as "percent" | "fixed",
    value: "",
    min_order: "0",
    max_uses: "",
    expires_at: "",
    is_active: true
  });

  // Courier state
  const [courierConfigs, setCourierConfigs] = useState<CourierConfigItem[]>([]);
  const [selectedCourierTab, setSelectedCourierTab] = useState<"steadfast" | "pathao">("steadfast");
  const [savingCourierConfig, setSavingCourierConfig] = useState(false);
  const [steadfastForm, setSteadfastForm] = useState({
    api_key: "",
    api_secret: "",
    is_sandbox: true,
    is_active: false
  });
  const [pathaoForm, setPathaoForm] = useState({
    client_id: "",
    client_secret: "",
    username: "",
    password: "",
    store_id: "",
    is_sandbox: true,
    is_active: false
  });

  // Courier Booking modal state
  const [courierBookingModalOpen, setCourierBookingModalOpen] = useState(false);
  const [bookingOrder, setBookingOrder] = useState<Order | null>(null);
  const [bookingProvider, setBookingProvider] = useState<"steadfast" | "pathao">("steadfast");
  const [bookingRecipientName, setBookingRecipientName] = useState("");
  const [bookingRecipientPhone, setBookingRecipientPhone] = useState("");
  const [bookingRecipientAddress, setBookingRecipientAddress] = useState("");
  const [bookingCodAmount, setBookingCodAmount] = useState("");
  const [bookingWeight, setBookingWeight] = useState("0.5");
  const [bookingNote, setBookingNote] = useState("");
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Courier Tracking modal state
  const [courierTrackingModalOpen, setCourierTrackingModalOpen] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [trackingDetails, setTrackingDetails] = useState<any>(null);
  const [loadingTracking, setLoadingTracking] = useState(false);

  // Hero slides state
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [showSlideModal, setShowSlideModal] = useState(false);
  const [slideSubmitting, setSlideSubmitting] = useState(false);
  const [slideImageFile, setSlideImageFile] = useState<File | null>(null);
  const [slideMobileImageFile, setSlideMobileImageFile] = useState<File | null>(null);
  const [slideImagePreview, setSlideImagePreview] = useState("");
  const [slideMobileImagePreview, setSlideMobileImagePreview] = useState("");
  const [slideForm, setSlideForm] = useState({
    title: "",
    subtitle: "",
    eyebrow: "★ বিশেষ অফার",
    button_text: "কেনাকাটা শুরু করুন",
    button_link: "#shop",
    product: "" as string | number,
    position: 0,
    is_active: true,
  });

  // Product modal / editing state
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [descriptionMode, setDescriptionMode] = useState<"write" | "preview">("write");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    slug: "",
    description: "",
    image_alt: "",
    image_primary: true,
    price: "",
    discount_price: "",
    stock: 0,
    category_id: 1,
    image_url: "",
    is_featured: false,
    is_active: true
  });

  // Admin Login state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [serverCustomers, setServerCustomers] = useState<CustomerDirectoryItem[]>([]);

  const customersList = React.useMemo<CustomerDirectoryItem[]>(() => {
    if (serverCustomers.length > 0) {
      return serverCustomers;
    }
    const map = new Map<string, CustomerDirectoryItem>();
    orders.forEach((ord) => {
      const key = ord.customer_name ? ord.customer_name.trim() : `Customer #${ord.id}`;
      const productThumbs = (ord.items || []).map(it => ({
        id: it.id,
        name: it.product_name,
        image: it.product_image || null,
      }));
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          customer_name: key,
          profile_name: ord.customer_profile_name || null,
          username: ord.customer_username || null,
          email: ord.email || null,
          phone: ord.phone || null,
          avatar_url: ord.customer_avatar || null,
          address: ord.address || "N/A",
          total_orders: 1,
          total_spent: ord.total,
          last_order_date: ord.created_at,
          purchased_products: productThumbs,
        });
      } else {
        const item = map.get(key)!;
        item.total_orders += 1;
        item.total_spent += ord.total;
        if (!item.avatar_url && ord.customer_avatar) item.avatar_url = ord.customer_avatar;
        if (!item.profile_name && ord.customer_profile_name) item.profile_name = ord.customer_profile_name;
        if (!item.email && ord.email) item.email = ord.email;
        if (!item.phone && ord.phone) item.phone = ord.phone;
        if (new Date(ord.created_at) > new Date(item.last_order_date)) {
          item.last_order_date = ord.created_at;
        }
        productThumbs.forEach(pt => {
          if (!item.purchased_products.some(p => p.name === pt.name)) {
            item.purchased_products.push(pt);
          }
        });
      }
    });
    return Array.from(map.values());
  }, [serverCustomers, orders]);

  const getApiUrl = (endpoint: string) => {
    let [pathStr, queryStr] = endpoint.split("?");
    if (!pathStr.startsWith("/")) pathStr = `/${pathStr}`;
    if (!pathStr.endsWith("/")) pathStr = `${pathStr}/`;
    const cleanEndpoint = queryStr ? `${pathStr}?${queryStr}` : pathStr;

    if (typeof window !== "undefined") {
      return `/api${cleanEndpoint}`;
    }
    return `http://backend:8000/api${cleanEndpoint}`;
  };

  useEffect(() => {
    fetch(getApiUrl("/auth/csrf/"), { credentials: "include" }).then(response => response.json()).then(data => setCsrfToken(data.csrfToken || "")).catch(() => undefined);
    fetchDashboardData();
  }, [orderStatusFilter]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const statsRes = await fetch(getApiUrl("/admin/dashboard/stats/"), { credentials: "include" });
      if (statsRes.status === 403 || statsRes.status === 401) {
        setError("You do not have admin permissions. Please log in with an admin account.");
        setLoading(false);
        return;
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      // Fetch Orders
      const orderQuery = orderStatusFilter ? `?status=${encodeURIComponent(orderStatusFilter)}&dashboard_refresh=1` : "?dashboard_refresh=1";
      const ordersUrl = getApiUrl(`/admin/orders/${orderQuery}`);
      const ordersRes = await fetch(ordersUrl, { credentials: "include", cache: "no-store", redirect: "follow" });
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      }

      // Fetch Products
      const productsRes = await fetch(getApiUrl("/admin/products/"), { credentials: "include" });
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      }

      // Fetch Categories
      const catRes = await fetch(getApiUrl("/categories/"));
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.results || catData);
      }

      // Fetch Customers Directory
      try {
        const custRes = await fetch(getApiUrl("/admin/customers/"), { credentials: "include" });
        if (custRes.ok) {
          const custData = await custRes.json();
          setServerCustomers(custData);
        }
      } catch (cErr) {
        console.error("Failed to load customer directory:", cErr);
      }

      // Fetch Coupons
      try {
        const couponRes = await fetch(getApiUrl("/admin/coupons/"), { credentials: "include" });
        if (couponRes.ok) {
          const couponData = await couponRes.json();
          setCoupons(couponData);
        }
      } catch (cpErr) {
        console.error("Failed to load coupons:", cpErr);
      }

      // Fetch Courier Configs
      try {
        const courierRes = await fetch(getApiUrl("/admin/courier/config/"), { credentials: "include" });
        if (courierRes.ok) {
          const cData = await courierRes.json();
          setCourierConfigs(cData);
          const st = cData.find((c: any) => c.provider === "steadfast");
          if (st) {
            setSteadfastForm({
              api_key: st.api_key || "",
              api_secret: st.api_secret || "",
              is_sandbox: st.is_sandbox ?? true,
              is_active: st.is_active ?? false,
            });
          }
          const pt = cData.find((c: any) => c.provider === "pathao");
          if (pt) {
            setPathaoForm({
              client_id: pt.client_id || "",
              client_secret: pt.client_secret || "",
              username: pt.username || "",
              password: pt.password || "",
              store_id: pt.store_id || "",
              is_sandbox: pt.is_sandbox ?? true,
              is_active: pt.is_active ?? false,
            });
          }
        }
      } catch (courErr) {
        console.error("Failed to load courier config:", courErr);
      }

      // Fetch Hero Slides
      try {
        const heroRes = await fetch(getApiUrl("/admin/hero-slides/"), { credentials: "include" });
        if (heroRes.ok) {
          const heroData = await heroRes.json();
          setHeroSlides(Array.isArray(heroData) ? heroData : heroData.results || []);
        }
      } catch (hErr) {
        console.error("Failed to load hero slides:", hErr);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data. Please check server status.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCourierConfig = async (provider: "steadfast" | "pathao") => {
    setSavingCourierConfig(true);
    try {
      const payload = provider === "steadfast" ? { provider, ...steadfastForm } : { provider, ...pathaoForm };
      const res = await fetch(getApiUrl("/admin/courier/config/"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}) },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const saved = await res.json();
        setCourierConfigs(prev => prev.map(c => c.provider === provider ? saved : c));
        toast.success(`${provider === "steadfast" ? "SteadFast" : "Pathao"} settings saved successfully!`);
      } else {
        toast.error("Failed to save courier configuration");
      }
    } catch (e) {
      toast.error("Network error saving courier configuration");
    } finally {
      setSavingCourierConfig(false);
    }
  };

  const handleOpenBookingModal = (order: Order) => {
    setBookingOrder(order);
    setBookingRecipientName(order.customer_name);
    setBookingRecipientPhone(order.phone || "");
    setBookingRecipientAddress(order.address || "");
    setBookingCodAmount(order.total.toString());
    setBookingWeight("0.5");
    setBookingNote(`Order #${order.id}`);
    setCourierBookingModalOpen(true);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingOrder) return;
    setIsSubmittingBooking(true);
    try {
      const payload = {
        order_id: bookingOrder.id,
        provider: bookingProvider,
        recipient_name: bookingRecipientName,
        recipient_phone: bookingRecipientPhone,
        recipient_address: bookingRecipientAddress,
        cod_amount: parseFloat(bookingCodAmount) || bookingOrder.total,
        weight: parseFloat(bookingWeight) || 0.5,
        note: bookingNote
      };
      const res = await fetch(getApiUrl("/admin/courier/book/"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}) },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Consignment booked with ${bookingProvider.toUpperCase()}! Tracking: ${data.tracking_code || data.consignment_id}`);
        setCourierBookingModalOpen(false);
        fetchDashboardData();
        if (selectedOrder?.id === bookingOrder.id && data.order) {
          setSelectedOrder(data.order);
        }
      } else {
        toast.error(data.error || "Failed to book consignment.");
      }
    } catch (e) {
      toast.error("Server error while dispatching consignment.");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleTrackCourier = async (order: Order) => {
    setTrackingOrder(order);
    setCourierTrackingModalOpen(true);
    setLoadingTracking(true);
    setTrackingDetails(null);
    try {
      const res = await fetch(getApiUrl(`/admin/courier/track/${order.id}/`), {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setTrackingDetails(data);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to fetch tracking details");
      }
    } catch (e) {
      toast.error("Network error fetching tracking info");
    } finally {
      setLoadingTracking(false);
    }
  };

  const handleExportOrdersCSV = () => {
    if (!orders || orders.length === 0) {
      toast.error("No orders to export");
      return;
    }
    const headers = ["Order ID", "Date", "Customer Name", "Phone", "Email", "Address", "Items Count", "Delivery Fee", "Discount", "Total", "Status", "Payment Method"];
    const rows = orders.map(o => [
      o.id,
      new Date(o.created_at).toISOString().split("T")[0],
      `"${(o.customer_name || "").replace(/"/g, '""')}"`,
      `"${o.phone || ""}"`,
      `"${o.email || ""}"`,
      `"${(o.address || "").replace(/"/g, '""')}"`,
      o.items ? o.items.length : 0,
      o.delivery_charge || 0,
      o.discount_amount || 0,
      o.total,
      o.status,
      o.payment_method || "COD"
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orders_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Orders exported to CSV!");
  };

  const handleToggleProductFeatured = async (product: Product) => {
    const newFeatured = !product.is_featured;
    try {
      const res = await fetch(getApiUrl(`/admin/products/${product.id}/`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}) },
        credentials: "include",
        body: JSON.stringify({ is_featured: newFeatured })
      });
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_featured: newFeatured } : p));
        toast.success(newFeatured ? "Marked as Featured!" : "Unmarked as Featured");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update featured status");
    }
  };

  const handleQuickSavePriceStock = async (productId: number) => {
    try {
      const payload: any = {};
      if (quickPriceVal !== "") payload.price = parseFloat(quickPriceVal);
      if (quickStockVal !== "") payload.stock = parseInt(quickStockVal, 10);
      const res = await fetch(getApiUrl(`/admin/products/${productId}/`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}) },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updated = await res.json();
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, price: updated.price, stock: updated.stock } : p));
        setQuickEditProductId(null);
        toast.success("Price & stock updated!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update price & stock");
    }
  };

  const handleToggleCouponActive = async (coupon: CouponItem) => {
    try {
      const res = await fetch(getApiUrl(`/admin/coupons/${coupon.id}/`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}) },
        credentials: "include",
        body: JSON.stringify({ is_active: !coupon.is_active })
      });
      if (res.ok) {
        setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_active: !coupon.is_active } : c));
        toast.success(`Coupon ${!coupon.is_active ? "activated" : "deactivated"}`);
      }
    } catch (e) {
      toast.error("Failed to update coupon status");
    }
  };

  const handleDeleteCoupon = async (couponId: number) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      const res = await fetch(getApiUrl(`/admin/coupons/${couponId}/`), {
        method: "DELETE",
        headers: { ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}) },
        credentials: "include"
      });
      if (res.ok) {
        setCoupons(prev => prev.filter(c => c.id !== couponId));
        toast.success("Coupon deleted successfully");
      }
    } catch (e) {
      toast.error("Failed to delete coupon");
    }
  };

  const openCreateSlideModal = () => {
    setEditingSlide(null);
    setSlideImageFile(null);
    setSlideMobileImageFile(null);
    setSlideImagePreview("");
    setSlideMobileImagePreview("");
    setSlideForm({
      title: "",
      subtitle: "",
      eyebrow: "★ বিশেষ অফার",
      button_text: "কেনাকাটা শুরু করুন",
      button_link: "#shop",
      product: "",
      position: heroSlides.length,
      is_active: true,
    });
    setShowSlideModal(true);
  };

  const openEditSlideModal = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setSlideImageFile(null);
    setSlideMobileImageFile(null);
    setSlideImagePreview(slide.image || "");
    setSlideMobileImagePreview(slide.mobile_image || "");
    setSlideForm({
      title: slide.title || "",
      subtitle: slide.subtitle || "",
      eyebrow: slide.eyebrow || "★ বিশেষ অফার",
      button_text: slide.button_text || "কেনাকাটা শুরু করুন",
      button_link: slide.button_link || "#shop",
      product: slide.product || "",
      position: slide.position || 0,
      is_active: slide.is_active,
    });
    setShowSlideModal(true);
  };

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide && !slideImageFile) {
      toast.error("অনুগ্রহ করে স্লাইডের ছবি নির্বাচন করুন।");
      return;
    }
    setSlideSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", slideForm.title);
      formData.append("subtitle", slideForm.subtitle);
      formData.append("eyebrow", slideForm.eyebrow);
      formData.append("button_text", slideForm.button_text);
      formData.append("button_link", slideForm.button_link);
      formData.append("position", String(slideForm.position));
      formData.append("is_active", String(slideForm.is_active));
      if (slideForm.product) {
        formData.append("product", String(slideForm.product));
      } else {
        formData.append("product", "");
      }
      if (slideImageFile) {
        formData.append("image", slideImageFile);
      }
      if (slideMobileImageFile) {
        formData.append("mobile_image", slideMobileImageFile);
      }

      const url = editingSlide
        ? getApiUrl(`/admin/hero-slides/${editingSlide.id}/`)
        : getApiUrl("/admin/hero-slides/");
      const method = editingSlide ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}) },
        body: formData,
      });

      if (res.ok) {
        toast.success(editingSlide ? "স্লাইড আপডেট সফল হয়েছে!" : "নতুন ব্যানার স্লাইড তৈরি হয়েছে!");
        setShowSlideModal(false);
        fetchDashboardData();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || "সংরক্ষণ করতে সমস্যা হয়েছে।");
      }
    } catch {
      toast.error("সার্ভার সমস্যা হয়েছে।");
    } finally {
      setSlideSubmitting(false);
    }
  };

  const handleToggleSlideActive = async (slide: HeroSlide) => {
    try {
      const res = await fetch(getApiUrl(`/admin/hero-slides/${slide.id}/`), {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRFToken": csrfToken } : {})
        },
        body: JSON.stringify({ is_active: !slide.is_active }),
      });
      if (res.ok) {
        setHeroSlides(prev => prev.map(s => s.id === slide.id ? { ...s, is_active: !s.is_active } : s));
        toast.success(slide.is_active ? "ব্যানার নিষ্ক্রিয় করা হয়েছে" : "ব্যানার সক্রিয় করা হয়েছে");
      }
    } catch {
      toast.error("স্ট্যাটাস আপডেট ব্যর্থ হয়েছে");
    }
  };

  const handleMoveSlide = async (slide: HeroSlide, direction: "up" | "down") => {
    const newPos = direction === "up" ? Math.max(0, slide.position - 1) : slide.position + 1;
    try {
      const res = await fetch(getApiUrl(`/admin/hero-slides/${slide.id}/`), {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRFToken": csrfToken } : {})
        },
        body: JSON.stringify({ position: newPos }),
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch {
      toast.error("পজিশন আপডেট ব্যর্থ হয়েছে");
    }
  };

  const handleDeleteSlide = async (id: number) => {
    if (!confirm("আপনি কি নিশ্চিত এই ব্যানার স্লাইডটি ডিলিট করতে চান?")) return;
    try {
      const res = await fetch(getApiUrl(`/admin/hero-slides/${id}/`), {
        method: "DELETE",
        credentials: "include",
        headers: { ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}) },
      });
      if (res.ok) {
        setHeroSlides(prev => prev.filter(s => s.id !== id));
        toast.success("ব্যানার স্লাইড মুছে ফেলা হয়েছে!");
      }
    } catch {
      toast.error("সার্ভার ত্রুটি");
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code.trim() || !couponForm.value) {
      toast.error("Code and discount value are required");
      return;
    }
    setCouponSubmitting(true);
    try {
      const payload: any = {
        code: couponForm.code.trim().toUpperCase(),
        discount_type: couponForm.discount_type,
        value: parseFloat(couponForm.value),
        min_order: parseFloat(couponForm.min_order) || 0,
        is_active: couponForm.is_active,
      };
      if (couponForm.max_uses) payload.max_uses = parseInt(couponForm.max_uses, 10);
      if (couponForm.expires_at) payload.expires_at = new Date(couponForm.expires_at).toISOString();

      const res = await fetch(getApiUrl("/admin/coupons/"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}) },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const created = await res.json();
        setCoupons(prev => [created, ...prev]);
        setShowCouponModal(false);
        setCouponForm({
          code: "",
          discount_type: "percent",
          value: "",
          min_order: "0",
          max_uses: "",
          expires_at: "",
          is_active: true
        });
        toast.success("Coupon created successfully!");
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.code ? `Error: ${errData.code[0]}` : "Failed to create coupon");
      }
    } catch (e) {
      toast.error("Network error while creating coupon");
    } finally {
      setCouponSubmitting(false);
    }
  };

  const handleQuickStockChange = async (product: Product, delta: number) => {
    const newStock = Math.max(0, product.stock + delta);
    try {
      const res = await fetch(getApiUrl(`/admin/products/${product.id}/`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}) },
        credentials: "include",
        body: JSON.stringify({ stock: newStock })
      });
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: newStock } : p));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleProductActive = async (product: Product) => {
    const newStatus = !product.is_active;
    try {
      const res = await fetch(getApiUrl(`/admin/products/${product.id}/`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}) },
        credentials: "include",
        body: JSON.stringify({ is_active: newStatus })
      });
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: newStatus } : p));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const res = await fetch(getApiUrl(`/admin/orders/${orderId}/`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}) },
        credentials: "include",
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updatedOrder = await res.json();
        setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(updatedOrder);
        }
        fetchDashboardData();
      }
    } catch (err) {
      alert("Failed to update order status.");
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!editingProduct?.id;
      const url = isEdit ? getApiUrl("/admin/products/" + editingProduct.id + "/") : getApiUrl("/admin/products/");
      const res = await fetch(url, { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json", ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}) }, credentials: "include", body: JSON.stringify(productForm) });
      const savedProduct = await res.json().catch(() => ({}));
      if (!res.ok) { alert(savedProduct.error || savedProduct.detail || "Failed to save product."); return; }
      if (imageFile && savedProduct.id) {
        const uploadData = new FormData();
        uploadData.append("images", imageFile);
        const uploadRes = await fetch(getApiUrl("/products/" + savedProduct.id + "/upload-images/"), { method: "POST", headers: csrfToken ? { "X-CSRFToken": csrfToken } : {}, credentials: "include", body: uploadData });
        if (!uploadRes.ok) { alert("Product saved, but image upload failed."); }
      }
      setShowProductModal(false); setEditingProduct(null); setImageFile(null); setDescriptionMode("write"); fetchDashboardData();
    } catch (err) { alert("An error occurred. Please try again."); }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(getApiUrl(`/admin/products/${productId}/`), {
        method: "DELETE",
        headers: csrfToken ? { "X-CSRFToken": csrfToken } : {},
        credentials: "include"
      });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== productId));
        fetchDashboardData();
      }
    } catch (err) {
      alert("Failed to delete product.");
    }
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setShowProductForm(true);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const insertMarkdown = (before: string, after = "", placeholder = "text") => {
    const area = descriptionRef.current;
    if (!area) return;
    const start = area.selectionStart; const end = area.selectionEnd;
    const selected = productForm.description.slice(start, end) || placeholder;
    const next = productForm.description.slice(0, start) + before + selected + after + productForm.description.slice(end);
    setProductForm({ ...productForm, description: next });
    window.setTimeout(() => { area.focus(); area.setSelectionRange(start + before.length, start + before.length + selected.length); }, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmittingLogin(true);
    try {
      const res = await fetch(getApiUrl("/admin/login/"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}) },
        credentials: "include",
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setError(null);
        await fetchDashboardData();
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      } else {
        setLoginError(data.error || "Login failed. Please verify your credentials.");
      }
    } catch (err) {
      setLoginError("Could not connect to the server.");
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="admin-login-wrapper">
          <div className="admin-login-card">
            <div className="admin-login-icon">🔐</div>
            <h2 className="admin-login-title">Admin Portal Login</h2>
            <p className="admin-login-subtitle">
              Enter your Admin / Superuser username and password to access the dashboard.
            </p>

            {loginError && (
              <div className="admin-error-banner">
                ⚠️ {loginError}
              </div>
            )}

            <a className="google-btn" href={getApiUrl("/auth/google/start/?next=/dashboard")} style={{ display: "flex", justifyContent: "center", marginBottom: "16px", textDecoration: "none" }}>
              <span className="google-mark">G</span> Continue with Google Account
            </a>
            <div style={{ textAlign: "center", color: "#64748b", fontSize: "12px", marginBottom: "14px" }}>Or use Admin username & password</div>
            <form onSubmit={handleAdminLogin}>
              <div className="admin-form-group">
                <label>Username or Email</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. admin"
                  value={loginUsername}
                  onChange={e => setLoginUsername(e.target.value)}
                  className="admin-input-field"
                />
              </div>

              <div className="admin-form-group">
                <label>Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="admin-input-field"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingLogin}
                className="admin-submit-btn"
              >
                {isSubmittingLogin ? "Signing in..." : "Sign In ➔"}
              </button>
            </form>

            <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(51, 65, 85, 0.5)", textAlign: "center" }}>
              <a
                href={getApiUrl("/admin/")}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#64748b", fontSize: "12px", textDecoration: "none" }}
              >
                Django Admin Panel ↗
              </a>
            </div>
          </div>
        </div>
      </>
    );
  }

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      !orderSearch ||
      (o.id ? o.id.toString().includes(orderSearch) : false) ||
      (o.customer_name ? o.customer_name.toLowerCase().includes(orderSearch.toLowerCase()) : false) ||
      (o.phone ? o.phone.toLowerCase().includes(orderSearch.toLowerCase()) : false) ||
      (o.address ? o.address.toLowerCase().includes(orderSearch.toLowerCase()) : false);

    const matchesStatus =
      !orderStatusFilter || orderStatusFilter === "all" || o.status === orderStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const getWhatsAppLink = (order: Order) => {
    if (!order.phone) return null;
    let cleanPhone = order.phone.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "88" + cleanPhone;
    } else if (!cleanPhone.startsWith("880") && cleanPhone.length === 10) {
      cleanPhone = "880" + cleanPhone;
    }
    const msg = `Assalamu Alaikum ${order.customer_name}, thank you for your order #${order.id} from Alorchoya. Total: ৳${order.total}. Status: ${(order.status_display || order.status).toUpperCase()}. If you need any assistance, please let us know!`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  const handleBulkUpdateStatus = async (status: string) => {
    if (selectedOrderIds.length === 0) {
      toast.error("Please select at least one order.");
      return;
    }
    setBulkUpdating(true);
    try {
      const res = await fetch(getApiUrl("/api/admin/orders/"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({ order_ids: selectedOrderIds, status }),
      });
      if (res.ok) {
        toast.success(`Updated ${selectedOrderIds.length} orders to ${status}!`);
        setSelectedOrderIds([]);
        fetchDashboardData();
      } else {
        toast.error("Failed to update orders.");
      }
    } catch (e) {
      toast.error("Server error during bulk update.");
    } finally {
      setBulkUpdating(false);
    }
  };

  const handlePrintThermalSlip = (order: Order) => {
    const printWindow = window.open("", "_blank", "width=380,height=600");
    if (!printWindow) return;

    const itemsRows = order.items
      .map(
        (item) => `
      <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
        <span style="flex: 1; padding-right: 6px;">${item.quantity}x ${item.product_name}</span>
        <span style="font-weight: 700;">৳${parseFloat(item.unit_price) * item.quantity}</span>
      </div>
    `
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>POS Slip #${order.id}</title>
          <style>
            @page { margin: 0; size: 80mm auto; }
            body { font-family: monospace; width: 280px; margin: 0 auto; padding: 12px 8px; font-size: 12px; color: #000; line-height: 1.35; }
            .center { text-align: center; }
            .dashed { border-top: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="center bold" style="font-size: 16px;">ALORCHOYA</div>
          <div class="center" style="font-size: 10px;">Books & Craft Shop</div>
          <div class="center" style="font-size: 10px;">Living With Light</div>
          <div class="dashed"></div>
          <div class="row"><span>Order ID:</span><span class="bold">#${order.id}</span></div>
          <div class="row"><span>Date:</span><span>${new Date(order.created_at).toLocaleDateString("en-US")}</span></div>
          <div class="row"><span>Status:</span><span class="bold">${(order.status_display || order.status).toUpperCase()}</span></div>
          <div class="dashed"></div>
          <div><span class="bold">Customer:</span> ${order.customer_name}</div>
          ${order.phone ? `<div><span class="bold">Phone:</span> ${order.phone}</div>` : ""}
          <div style="margin-top: 2px;"><span class="bold">Address:</span> ${order.address}</div>
          <div class="dashed"></div>
          <div class="bold" style="margin-bottom: 4px;">ORDER ITEMS:</div>
          ${itemsRows}
          <div class="dashed"></div>
          <div class="row"><span>Delivery:</span><span>৳${order.delivery_charge}</span></div>
          ${parseFloat(order.discount_amount) > 0 ? `<div class="row"><span>Discount:</span><span>-৳${order.discount_amount}</span></div>` : ""}
          <div class="row bold" style="font-size: 14px; margin-top: 4px;">
            <span>TOTAL:</span>
            <span>৳${order.total}</span>
          </div>
          <div class="row" style="margin-top: 2px; font-size: 11px;">
            <span>Payment:</span>
            <span class="bold">${order.payment_method.toUpperCase()}</span>
          </div>
          <div class="dashed"></div>
          <div class="center" style="font-size: 10px; margin-top: 8px;">Thank you for shopping with Alorchoya!</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !productSearch ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.slug.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.base_sku && p.base_sku.toLowerCase().includes(productSearch.toLowerCase()));
    const matchesCat =
      !productCategoryFilter ||
      (p.category?.id && p.category.id.toString() === productCategoryFilter);
    const matchesLowStock = !lowStockFilter || p.stock <= 5;
    return matchesSearch && matchesCat && matchesLowStock;
  });

  const filteredCustomers = customersList.filter(c => {
    if (!customerSearch) return true;
    const q = customerSearch.toLowerCase();
    return (
      (c.customer_name && c.customer_name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  });

  const handlePrintInvoice = (order: Order) => {
    const printWindow = window.open("", "_blank", "width=800,height=700");
    if (!printWindow) return;

    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${item.product_name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">৳${item.unit_price}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700;">৳${parseFloat(item.unit_price) * item.quantity}</td>
        </tr>
      `
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${order.id} - Alorchoya</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 40px; color: #173f35; background: #fff; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #173f35; padding-bottom: 16px; margin-bottom: 24px; }
            .brand { font-size: 26px; font-weight: 800; color: #173f35; margin: 0; }
            .tagline { font-size: 13px; color: #64748b; margin-top: 4px; }
            .inv-title { font-size: 22px; font-weight: 800; color: #10b981; text-align: right; margin: 0; }
            .inv-meta { font-size: 13px; color: #64748b; text-align: right; margin-top: 4px; }
            .box-grid { display: flex; justify-content: space-between; gap: 24px; background: #fcfbf7; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px; }
            th { background: #173f35; color: #fff; padding: 10px; text-align: left; font-size: 13px; }
            .totals { font-size: 15px; font-weight: 700; text-align: right; display: flex; flex-direction: column; gap: 6px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
            .grand-total { font-size: 22px; color: #173f35; font-weight: 800; margin-top: 8px; }
            .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="brand">Alorchoya</h1>
              <div class="tagline">Books & Craft Shop | Living With Light</div>
            </div>
            <div>
              <h2 class="inv-title">INVOICE / CASH MEMO</h2>
              <div class="inv-meta">Order No: <strong>#${order.id}</strong></div>
              <div class="inv-meta">Date: ${new Date(order.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</div>
            </div>
          </div>

          <div class="box-grid">
            <div>
              <strong style="color: #64748b; font-size: 12px; text-transform: uppercase;">Customer Details:</strong>
              <div style="font-size: 16px; font-weight: 700; color: #173f35; margin-top: 4px;">${order.customer_name}</div>
              <div>${order.address}</div>
            </div>
            <div style="text-align: right;">
              <strong style="color: #64748b; font-size: 12px; text-transform: uppercase;">Payment Details:</strong>
              <div style="font-size: 14px; font-weight: 700; color: #10b981; margin-top: 4px;">Method: ${order.payment_method.toUpperCase()}</div>
              <div>Status: ${order.status_display || order.status}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals">
            <div>Delivery Charge: ৳${order.delivery_charge}</div>
            <div>Discount: -৳${order.discount_amount}</div>
            <div class="grand-total">Grand Total: ৳${order.total}</div>
          </div>

          <div class="footer">
            Thank you for shopping with Alorchoya! Support: support@alorchoya.com
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="admin-shell">
        {/* Mobile Backdrop */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Mobile Backdrop */}
        {mobileSidebarOpen && (
          <div
            className="admin-mobile-backdrop"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* LEFT SIDEBAR (White Theme like newsmartagent) */}
        <aside className={`admin-sidebar ${mobileSidebarOpen ? "open" : ""}`}>
          <div className="admin-sidebar-brand">
            <div className="admin-sidebar-brand-logo-wrap">
              <img
                src="/alorchoya-logo.jpeg"
                alt="Alorchoya"
                className="admin-sidebar-logo-img"
              />
            </div>
            <div>
              <div className="admin-sidebar-brand-text">Alorchoya</div>
              <div className="admin-sidebar-brand-sub">Admin Portal</div>
            </div>
          </div>

          <nav className="admin-sidebar-nav">
            <div className="admin-sidebar-nav-label">MAIN MENU</div>

            <button
              onClick={() => { setActiveTab("overview"); setMobileSidebarOpen(false); }}
              className={`admin-nav-item ${activeTab === "overview" ? "active" : ""}`}
            >
              <div className="admin-nav-item-content">
                <LayoutDashboard size={18} className="admin-nav-item-icon" />
                <span>Overview</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab("orders"); setMobileSidebarOpen(false); }}
              className={`admin-nav-item ${activeTab === "orders" ? "active" : ""}`}
            >
              <div className="admin-nav-item-content">
                <ShoppingCart size={18} className="admin-nav-item-icon" />
                <span>Orders</span>
              </div>
              {stats && stats.pending_orders > 0 && (
                <span className="admin-nav-badge warning">
                  {stats.pending_orders}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab("products"); setMobileSidebarOpen(false); }}
              className={`admin-nav-item ${activeTab === "products" ? "active" : ""}`}
            >
              <div className="admin-nav-item-content">
                <Boxes size={18} className="admin-nav-item-icon" />
                <span>Products & Stock</span>
              </div>
              <span className="admin-nav-badge">
                {products.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab("hero"); setMobileSidebarOpen(false); }}
              className={`admin-nav-item ${activeTab === "hero" ? "active" : ""}`}
            >
              <div className="admin-nav-item-content">
                <SlidersHorizontal size={18} className="admin-nav-item-icon" />
                <span>Hero Banners</span>
              </div>
              <span className="admin-nav-badge success">
                {heroSlides.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab("coupons"); setMobileSidebarOpen(false); }}
              className={`admin-nav-item ${activeTab === "coupons" ? "active" : ""}`}
            >
              <div className="admin-nav-item-content">
                <Tag size={18} className="admin-nav-item-icon" />
                <span>Coupons & Deals</span>
              </div>
              <span className="admin-nav-badge">
                {coupons.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab("courier"); setMobileSidebarOpen(false); }}
              className={`admin-nav-item ${activeTab === "courier" ? "active" : ""}`}
            >
              <div className="admin-nav-item-content">
                <Truck size={18} className="admin-nav-item-icon" />
                <span>Courier Logistics</span>
              </div>
              <span className="admin-nav-badge">
                {orders.filter(o => o.consignment_id).length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab("gallery"); setMobileSidebarOpen(false); }}
              className={`admin-nav-item ${activeTab === "gallery" ? "active" : ""}`}
            >
              <div className="admin-nav-item-content">
                <ImageIcon size={18} className="admin-nav-item-icon" />
                <span>Image Gallery</span>
              </div>
              <span className="admin-nav-badge success">
                AI Media
              </span>
            </button>

            <button
              onClick={() => { setActiveTab("customers"); setMobileSidebarOpen(false); }}
              className={`admin-nav-item ${activeTab === "customers" ? "active" : ""}`}
            >
              <div className="admin-nav-item-content">
                <Users size={18} className="admin-nav-item-icon" />
                <span>Customers</span>
              </div>
              <span className="admin-nav-badge">
                {customersList.length}
              </span>
            </button>
          </nav>

          <div className="admin-sidebar-footer">
            <div className="admin-sidebar-user">
              <div className="admin-sidebar-avatar">
                AD
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="admin-sidebar-user-name">
                  Store Admin
                </div>
                <div className="admin-sidebar-user-status">
                  <span className="admin-status-dot" /> Online Session
                </div>
              </div>
            </div>

            <div className="admin-sidebar-sublinks">
              <Link href="/" className="admin-sidebar-sublink" title="View Storefront">
                <Store size={14} /> Storefront ↗
              </Link>
              <a
                href={getApiUrl("/admin/")}
                target="_blank"
                rel="noreferrer"
                className="admin-sidebar-sublink"
                title="Django Admin"
              >
                <ExternalLink size={14} /> Django ↗
              </a>
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN WRAPPER */}
        <div className="admin-main-wrapper">
          <header className="admin-topbar">
            <div className="admin-topbar-left">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                className="admin-topbar-toggle"
                title="Toggle Menu"
              >
                {mobileSidebarOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
              <div className="admin-topbar-title">
                {activeTab === "overview" && "Dashboard Overview"}
                {activeTab === "orders" && "Orders & Fulfillment"}
                {activeTab === "products" && "Products & Inventory"}
                {activeTab === "hero" && "হোম হিরো স্লাইডার ও ব্যানার ম্যানেজমেন্ট"}
                {activeTab === "coupons" && "Promotions & Coupon Discounts"}
                {activeTab === "courier" && "Courier & Delivery Logistics"}
                {activeTab === "gallery" && "Central Image Gallery & Media Hub"}
                {activeTab === "customers" && "Customer Directory"}
              </div>
            </div>

            <div className="admin-topbar-actions">
              <button
                onClick={openCreateModal}
                className="admin-btn-primary"
              >
                <Plus size={15} /> Add Product
              </button>
              <button
                onClick={() => fetchDashboardData()}
                className="admin-btn-secondary"
                title="Refresh Data"
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          </header>

          <main className="admin-main-viewport">
            {/* OVERVIEW TAB (Exact newsmartagent Profit Style) */}
            {activeTab === "overview" && stats && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* 1. Overview / Profit Style Header Bar */}
                <div className="profit-filter-bar">
                  <div className="profit-filter-left">
                    <div className="profit-filter-icon-box">
                      <Filter size={20} />
                    </div>
                    <div>
                      <h3 className="profit-filter-title">
                        Store Performance & Financial Overview
                      </h3>
                      <p className="profit-filter-sub">
                        Live revenue, order fulfillment, stock valuation & customer directory ledger
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={openCreateModal}
                      className="admin-btn-primary"
                    >
                      <Plus size={15} /> Add Product
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("hero")}
                      className="admin-btn-secondary"
                    >
                      <SlidersHorizontal size={14} /> Hero Banners
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("orders")}
                      className="admin-btn-secondary"
                    >
                      View Orders <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>

                {/* 2. Key Financial & Operational StatCards (Exact newsmartagent Profit Style) */}
                <div className="profit-stat-grid">
                  {/* Card 1: Total Revenue (Green) */}
                  <div className="profit-stat-card green">
                    <div className="profit-stat-inner">
                      <div className="profit-glow-orb" style={{ background: "#10b981" }} />
                      <div className="profit-icon-box green">
                        <TrendingUp size={22} />
                      </div>
                      <div>
                        <div className="profit-title">Total Revenue</div>
                        <div className="profit-val">৳{stats.total_revenue.toLocaleString()}</div>
                        <div className="profit-sub">
                          Last 30 Days: ৳{stats.monthly_revenue.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Average Order Value (Blue) */}
                  <div className="profit-stat-card blue">
                    <div className="profit-stat-inner">
                      <div className="profit-glow-orb" style={{ background: "#3b82f6" }} />
                      <div className="profit-icon-box blue">
                        <Wallet size={22} />
                      </div>
                      <div>
                        <div className="profit-title">Average Order Value</div>
                        <div className="profit-val">৳{stats.avg_order_value || 0}</div>
                        <div className="profit-sub">
                          Avg. customer spend per checkout
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Total Orders (Indigo) */}
                  <div className="profit-stat-card indigo">
                    <div className="profit-stat-inner">
                      <div className="profit-glow-orb" style={{ background: "#6366f1" }} />
                      <div className="profit-icon-box indigo">
                        <ShoppingCart size={22} />
                      </div>
                      <div>
                        <div className="profit-title">Total Orders</div>
                        <div className="profit-val">{stats.total_orders}</div>
                        <div className="profit-sub">
                          Pending: {stats.pending_orders} | Delivered: {stats.delivered_orders}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Total Customers (Purple) */}
                  <div className="profit-stat-card purple">
                    <div className="profit-stat-inner">
                      <div className="profit-glow-orb" style={{ background: "#a855f7" }} />
                      <div className="profit-icon-box purple">
                        <Users size={22} />
                      </div>
                      <div>
                        <div className="profit-title">Customer Profiles</div>
                        <div className="profit-val">{stats.unique_customers || customersList.length}</div>
                        <div className="profit-sub">
                          Unique customer accounts recorded
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 5: Inventory & Stock Status (Orange) */}
                  <div className="profit-stat-card orange">
                    <div className="profit-stat-inner">
                      <div className="profit-glow-orb" style={{ background: "#f59e0b" }} />
                      <div className="profit-icon-box orange">
                        <Boxes size={22} />
                      </div>
                      <div>
                        <div className="profit-title">Inventory & Stock</div>
                        <div className="profit-val">{stats.total_products} Products</div>
                        <div className="profit-sub">
                          Out of stock: {stats.out_of_stock_products} | Low: {stats.low_stock_products}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 6: Operations Health (Teal) */}
                  <div className="profit-stat-card teal">
                    <div className="profit-stat-inner">
                      <div className="profit-glow-orb" style={{ background: "#0d9488" }} />
                      <div className="profit-icon-box teal">
                        <ShieldCheck size={22} />
                      </div>
                      <div>
                        <div className="profit-title">System Status</div>
                        <div className="profit-val">100% Active</div>
                        <div className="profit-sub">
                          Live store & AI catalog active
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Sales Trend & Top Products Row (Profit Panel Style) */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
                  {/* Daily Sales Bar Chart */}
                  <div className="profit-panel-card" style={{ flex: 1.6 }}>
                    <div className="profit-panel-header">
                      <h3 className="profit-panel-title">
                        <TrendingUp size={20} style={{ color: "#4f46e5" }} />
                        Sales Analytics (Last 7 Days)
                      </h3>
                      <p className="profit-panel-sub">
                        Daily sales revenue velocity and turnover
                      </p>
                    </div>
                    <div className="profit-bar-chart">
                      {stats.daily_sales.map((day, idx) => {
                        const maxRev = Math.max(...stats.daily_sales.map(d => d.revenue), 1000);
                        const heightPercent = Math.max((day.revenue / maxRev) * 100, 8);
                        return (
                          <div key={idx} className="profit-bar-col">
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>
                              ৳{day.revenue > 0 ? (day.revenue >= 1000 ? `${(day.revenue / 1000).toFixed(1)}k` : day.revenue) : 0}
                            </span>
                            <div
                              className="profit-bar-fill"
                              style={{ height: `${heightPercent}%` }}
                              title={`${day.date}: ৳${day.revenue}`}
                            />
                            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700 }}>
                              {day.date}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Top Selling Products */}
                  <div className="profit-panel-card" style={{ flex: 1 }}>
                    <div className="profit-panel-header">
                      <h3 className="profit-panel-title">
                        <Award size={20} style={{ color: "#f59e0b" }} />
                        Top Selling Products
                      </h3>
                      <p className="profit-panel-sub">
                        Best-performing catalog items by units sold
                      </p>
                    </div>
                    {stats.top_products && stats.top_products.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {stats.top_products.map((item, idx) => (
                          <div key={idx} className="profit-top-product-item">
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                              <span style={{
                                width: "26px",
                                height: "26px",
                                borderRadius: "8px",
                                background: idx === 0 ? "#fef3c7" : idx === 1 ? "#eff6ff" : "#f1f5f9",
                                color: idx === 0 ? "#b45309" : idx === 1 ? "#1d4ed8" : "#475569",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 900,
                                fontSize: "12px",
                                flexShrink: 0
                              }}>
                                #{idx + 1}
                              </span>
                              <span style={{ fontWeight: 700, fontSize: "13px", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {item.name}
                              </span>
                            </div>
                            <span style={{ fontSize: "12px", fontWeight: 800, color: "#059669", background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "3px 10px", borderRadius: "8px", flexShrink: 0 }}>
                              {item.sold} sold
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: "#94a3b8", fontSize: "13px", textAlign: "center", padding: "40px 0", fontWeight: 600 }}>
                        No product sales recorded yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Recent Orders Panel (Profit Table Style) */}
                <div className="profit-panel-card" style={{ padding: "20px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", paddingBottom: "14px", borderBottom: "1px solid #f1f5f9" }}>
                    <div>
                      <h3 className="profit-panel-title">
                        <Package size={20} style={{ color: "#2563eb" }} />
                        Recent Orders (Last 10)
                      </h3>
                      <p className="profit-panel-sub">
                        Latest customer checkouts and fulfillment status
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("orders")}
                      className="admin-btn-secondary"
                      style={{ fontSize: "12px", padding: "7px 14px" }}
                    >
                      View All Orders <ArrowUpRight size={13} />
                    </button>
                  </div>

                  <div style={{ overflowX: "auto" }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Customer Name</th>
                          <th>Date</th>
                          <th>Total</th>
                          <th>Status</th>
                          <th style={{ textAlign: "right" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recent_orders.map(order => (
                          <tr key={order.id}>
                            <td style={{ fontWeight: 800, color: "#2563eb" }}>#{order.id}</td>
                            <td style={{ fontWeight: 700, color: "#0f172a" }}>{order.customer_name}</td>
                            <td style={{ color: "#64748b", fontSize: "13px" }}>
                              {new Date(order.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                            </td>
                            <td style={{ fontWeight: 800, color: "#0f172a" }}>৳{order.total}</td>
                            <td>
                              <span className={`admin-badge ${order.status}`}>
                                {order.status_display || order.status}
                              </span>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button
                                onClick={() => { setSelectedOrder(order); setActiveTab("orders"); }}
                                className="admin-btn-secondary"
                                style={{ padding: "5px 12px", fontSize: "11px", fontWeight: 700 }}
                              >
                                Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
          )}

        {/* ORDERS TAB (Fulfillment Powerhouse with Status Tabs, Bulk Actions & WhatsApp) */}
        {activeTab === "orders" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* 1. Status Filter Tabs Bar with Live Counters */}
            <div className="order-tabs-bar">
              {[
                { id: "all", label: "All Orders", count: orders.length },
                { id: "pending", label: "Pending", count: orders.filter(o => o.status === "pending").length },
                { id: "confirmed", label: "Confirmed", count: orders.filter(o => o.status === "confirmed").length },
                { id: "processing", label: "Processing", count: orders.filter(o => o.status === "processing").length },
                { id: "shipped", label: "Shipped", count: orders.filter(o => o.status === "shipped").length },
                { id: "delivered", label: "Delivered", count: orders.filter(o => o.status === "delivered").length },
                { id: "cancelled", label: "Cancelled", count: orders.filter(o => o.status === "cancelled").length },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setOrderStatusFilter(tab.id)}
                  className={`order-tab-pill ${orderStatusFilter === tab.id ? "active" : ""}`}
                >
                  <span>{tab.label}</span>
                  <span className="order-tab-counter">{tab.count}</span>
                </button>
              ))}
            </div>

            {/* 2. Bulk Action Bar (Visible when orders are selected) */}
            {selectedOrderIds.length > 0 && (
              <div className="order-bulk-bar">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    background: "#2563eb",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: "12px"
                  }}>
                    {selectedOrderIds.length}
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: 700 }}>
                    Orders Selected
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    disabled={bulkUpdating}
                    onClick={() => handleBulkUpdateStatus("confirmed")}
                    className="admin-btn-secondary"
                    style={{ padding: "6px 12px", fontSize: "12px", background: "#1e293b", color: "#f8fafc", borderColor: "#334155" }}
                  >
                    Mark Confirmed
                  </button>
                  <button
                    type="button"
                    disabled={bulkUpdating}
                    onClick={() => handleBulkUpdateStatus("shipped")}
                    className="admin-btn-secondary"
                    style={{ padding: "6px 12px", fontSize: "12px", background: "#1e293b", color: "#60a5fa", borderColor: "#334155" }}
                  >
                    Mark Shipped
                  </button>
                  <button
                    type="button"
                    disabled={bulkUpdating}
                    onClick={() => handleBulkUpdateStatus("delivered")}
                    className="admin-btn-secondary"
                    style={{ padding: "6px 12px", fontSize: "12px", background: "#1e293b", color: "#34d399", borderColor: "#334155" }}
                  >
                    Mark Delivered
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedOrderIds([])}
                    className="admin-btn-secondary"
                    style={{ padding: "6px 12px", fontSize: "12px", background: "transparent", color: "#94a3b8", borderColor: "#334155" }}
                  >
                    Deselect All
                  </button>
                </div>
              </div>
            )}

            {/* 3. Search & Quick Controls */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "260px" }}>
                <input
                  type="text"
                  placeholder="Search by Order ID, customer name, phone, or address..."
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  className="admin-input-field"
                  style={{ flex: 1, margin: 0 }}
                />
                {orderSearch && (
                  <button
                    type="button"
                    onClick={() => setOrderSearch("")}
                    className="admin-btn-secondary"
                    style={{ padding: "8px 12px", fontSize: "12px" }}
                  >
                    Clear
                  </button>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedOrderIds.length === filteredOrders.length) {
                      setSelectedOrderIds([]);
                    } else {
                      setSelectedOrderIds(filteredOrders.map(o => o.id));
                    }
                  }}
                  className="admin-btn-secondary"
                  style={{ fontSize: "12px" }}
                >
                  {selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0 ? (
                    <CheckSquare size={14} style={{ color: "#2563eb" }} />
                  ) : (
                    <Square size={14} />
                  )}
                  Select All ({filteredOrders.length})
                </button>

                <button
                  type="button"
                  onClick={handleExportOrdersCSV}
                  className="admin-btn-secondary"
                  style={{
                    fontSize: "12px",
                    background: "#f0fdf4",
                    borderColor: "#bbf7d0",
                    color: "#166534",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: 600
                  }}
                  title="Download all orders in CSV format"
                >
                  <Download size={14} />
                  Export CSV
                </button>
              </div>
            </div>

            {/* 4. Main Orders Layout: List Column & Sticky Detail Drawer */}
            <div style={{ display: "grid", gridTemplateColumns: selectedOrder ? "1.1fr 1.3fr" : "1fr", gap: "24px", alignItems: "start" }}>
              {/* Orders List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {filteredOrders.length === 0 ? (
                  <div className="profit-panel-card" style={{ textAlign: "center", padding: "48px 20px" }}>
                    <Package size={38} style={{ color: "#cbd5e1", margin: "0 auto 12px" }} />
                    <h4 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 800, color: "#334155" }}>
                      No orders found
                    </h4>
                    <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                      Try adjusting your search query or status filter.
                    </p>
                  </div>
                ) : (
                  filteredOrders.map(order => {
                    const isSelected = selectedOrderIds.includes(order.id);
                    const isActive = selectedOrder?.id === order.id;
                    const waLink = getWhatsAppLink(order);

                    return (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`order-card-row ${isActive ? "selected" : ""}`}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onClick={e => e.stopPropagation()}
                            onChange={e => {
                              if (e.target.checked) setSelectedOrderIds(curr => [...curr, order.id]);
                              else setSelectedOrderIds(curr => curr.filter(id => id !== order.id));
                            }}
                            style={{ width: "16px", height: "16px", accentColor: "#2563eb", cursor: "pointer", flexShrink: 0 }}
                          />

                          {/* Customer Avatar / Badge */}
                          {order.customer_avatar ? (
                            <img
                              src={order.customer_avatar}
                              alt={order.customer_profile_name || order.customer_name}
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                objectFit: "cover",
                                border: "2px solid #3b82f6",
                                flexShrink: 0
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                                color: "#1d4ed8",
                                fontWeight: 800,
                                fontSize: "14px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: "1.5px solid #bfdbfe",
                                flexShrink: 0
                              }}
                            >
                              {(order.customer_profile_name || order.customer_name || "C").charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                              <span style={{ fontWeight: 900, color: "#2563eb", fontSize: "14px" }}>
                                #{order.id}
                              </span>
                              <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>
                                {order.customer_name}
                              </span>
                              {order.customer_profile_name && order.customer_profile_name !== order.customer_name && (
                                <span style={{ fontSize: "11px", fontWeight: 600, color: "#475569", background: "#f1f5f9", padding: "1px 6px", borderRadius: "6px" }}>
                                  👤 {order.customer_profile_name}
                                </span>
                              )}
                              <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", background: "#f1f5f9", padding: "1px 6px", borderRadius: "6px" }}>
                                {order.items.length} items
                              </span>
                            </div>

                            {/* Product Thumbnails Preview */}
                            {order.items && order.items.length > 0 && (
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                                {order.items.slice(0, 3).map((it, idx) => (
                                  <div
                                    key={it.id || idx}
                                    title={`${it.product_name} (${it.quantity}x)`}
                                    style={{
                                      width: "28px",
                                      height: "28px",
                                      borderRadius: "6px",
                                      overflow: "hidden",
                                      border: "1px solid #e2e8f0",
                                      background: "#f8fafc",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0
                                    }}
                                  >
                                    {it.product_image ? (
                                      <img src={it.product_image} alt={it.product_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                      <Package size={14} style={{ color: "#94a3b8" }} />
                                    )}
                                  </div>
                                ))}
                                {order.items.length > 3 && (
                                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", background: "#f1f5f9", padding: "2px 6px", borderRadius: "6px" }}>
                                    +{order.items.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}

                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px", fontSize: "12px", color: "#64748b", flexWrap: "wrap" }}>
                              <span>{new Date(order.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                              {order.phone && <span>• {order.phone}</span>}
                              <span>• {order.payment_method.toUpperCase()}</span>
                              {order.consignment_id ? (
                                <span
                                  onClick={e => { e.stopPropagation(); handleTrackCourier(order); }}
                                  style={{
                                    background: "#f0fdf4",
                                    color: "#166534",
                                    border: "1px solid #bbf7d0",
                                    padding: "1px 7px",
                                    borderRadius: "6px",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px"
                                  }}
                                  title="Click to track live courier status"
                                >
                                  <Truck size={12} />
                                  {(order.courier_provider || "courier").toUpperCase()}: {order.tracking_code || order.consignment_id}
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={e => { e.stopPropagation(); handleOpenBookingModal(order); }}
                                  style={{
                                    background: "#eff6ff",
                                    color: "#1d4ed8",
                                    border: "1px solid #bfdbfe",
                                    padding: "1px 7px",
                                    borderRadius: "6px",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px"
                                  }}
                                >
                                  <Truck size={12} /> Book Courier
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                          {/* Quick WhatsApp & Call Action Icons */}
                          {waLink && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="btn-whatsapp"
                              title="Chat with customer on WhatsApp"
                            >
                              <WhatsAppIcon />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </a>
                          )}

                          {order.phone && (
                            <a
                              href={`tel:${order.phone}`}
                              onClick={e => e.stopPropagation()}
                              className="btn-call"
                              title="Call customer directly"
                            >
                              <Phone size={12} />
                              <span className="hidden sm:inline">Call</span>
                            </a>
                          )}

                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 900, color: "#0f172a", fontSize: "15px" }}>
                              ৳{order.total}
                            </div>
                            <span className={`admin-badge ${order.status}`} style={{ marginTop: "4px" }}>
                              {order.status_display || order.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Selected Order Detail Drawer */}
              {selectedOrder && (
                <div
                  className="profit-panel-card"
                  style={{
                    position: "sticky",
                    top: "80px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px",
                    padding: "24px"
                  }}
                >
                  {/* Top Bar with Print and Close */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{
                          padding: "3px 8px",
                          borderRadius: "8px",
                          background: "#eff6ff",
                          color: "#2563eb",
                          fontWeight: 900,
                          fontSize: "13px"
                        }}>
                          #{selectedOrder.id}
                        </span>
                        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                          Order Details
                        </h3>
                      </div>
                      <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0" }}>
                        Placed on {new Date(selectedOrder.created_at).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() => handlePrintInvoice(selectedOrder)}
                        className="admin-btn-secondary"
                        style={{ padding: "6px 10px", fontSize: "12px" }}
                        title="Print Full A4 Invoice"
                      >
                        <Printer size={13} /> A4
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePrintThermalSlip(selectedOrder)}
                        className="btn-thermal"
                        title="Print Compact 80mm POS Slip"
                      >
                        <Receipt size={13} /> POS
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(null)}
                        className="admin-btn-secondary"
                        style={{ padding: "6px 10px", fontSize: "12px" }}
                        title="Close Inspector"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Customer Quick Contact Bar */}
                  {(selectedOrder.phone || selectedOrder.email) && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "10px 14px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                          Direct Customer Contact
                        </div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", marginTop: "2px" }}>
                          {selectedOrder.phone || "No phone provided"}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {getWhatsAppLink(selectedOrder) && (
                          <a
                            href={getWhatsAppLink(selectedOrder)!}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-whatsapp"
                          >
                            <WhatsAppIcon /> Message
                          </a>
                        )}
                        {selectedOrder.phone && (
                          <a
                            href={`tel:${selectedOrder.phone}`}
                            className="btn-call"
                          >
                            <Phone size={12} /> Call
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status Updater Bar */}
                  <div style={{ background: "#ffffff", padding: "14px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#64748b", marginBottom: "8px" }}>
                      Update Order Status:
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map(st => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleUpdateOrderStatus(selectedOrder.id, st)}
                          className={`order-tab-pill ${selectedOrder.status === st ? "active" : ""}`}
                          style={{ padding: "6px 12px", fontSize: "12px", textTransform: "capitalize" }}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Courier Dispatch Card */}
                  <div style={{ background: "#ffffff", padding: "14px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                      <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Truck size={14} style={{ color: "#2563eb" }} /> Courier Consignment & Delivery
                      </div>
                      {selectedOrder.consignment_id && (
                        <span className="admin-badge delivered" style={{ fontSize: "11px" }}>
                          Booked ({selectedOrder.courier_provider})
                        </span>
                      )}
                    </div>

                    {selectedOrder.consignment_id ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: "#f8fafc", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px" }}>
                          <span style={{ color: "#64748b" }}>Consignment ID:</span>
                          <span style={{ fontWeight: 800, fontFamily: "monospace", color: "#0f172a" }}>{selectedOrder.consignment_id}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px" }}>
                          <span style={{ color: "#64748b" }}>Tracking Code:</span>
                          <span style={{ fontWeight: 800, fontFamily: "monospace", color: "#2563eb" }}>{selectedOrder.tracking_code || selectedOrder.consignment_id}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px" }}>
                          <span style={{ color: "#64748b" }}>Courier Status:</span>
                          <span style={{ fontWeight: 700, textTransform: "capitalize", color: "#166534" }}>{selectedOrder.courier_status || "In Review"}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleTrackCourier(selectedOrder)}
                          className="admin-btn-primary"
                          style={{ width: "100%", justifyContent: "center", marginTop: "4px", padding: "8px", fontSize: "12px" }}
                        >
                          <Truck size={14} /> Track Parcel Live
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", background: "#f0fdf4", padding: "12px", borderRadius: "12px", border: "1px solid #bbf7d0" }}>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 800, color: "#166534" }}>Ready for Courier Booking</div>
                          <div style={{ fontSize: "11px", color: "#15803d" }}>Dispatch to SteadFast or Pathao in 1-click</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenBookingModal(selectedOrder)}
                          className="admin-btn-primary"
                          style={{ padding: "8px 16px", fontSize: "12px", background: "#16a34a", borderColor: "#16a34a" }}
                        >
                          <Truck size={14} /> Book Courier
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Customer & Payment Split Info Cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                      <div style={{ color: "#64748b", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", marginBottom: "8px" }}>
                        Customer & Delivery Address
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        {selectedOrder.customer_avatar ? (
                          <img
                            src={selectedOrder.customer_avatar}
                            alt={selectedOrder.customer_profile_name || selectedOrder.customer_name}
                            style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover", border: "1.5px solid #3b82f6", flexShrink: 0 }}
                          />
                        ) : (
                          <div style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                            color: "#1d4ed8",
                            fontWeight: 800,
                            fontSize: "14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid #bfdbfe",
                            flexShrink: 0
                          }}>
                            {(selectedOrder.customer_profile_name || selectedOrder.customer_name || "C").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "13px" }}>
                            {selectedOrder.customer_name}
                          </div>
                          {selectedOrder.customer_profile_name && selectedOrder.customer_profile_name !== selectedOrder.customer_name && (
                            <div style={{ fontSize: "11px", color: "#64748b" }}>
                              Profile: {selectedOrder.customer_profile_name}
                            </div>
                          )}
                          {selectedOrder.customer_username && (
                            <div style={{ fontSize: "11px", color: "#2563eb" }}>
                              @{selectedOrder.customer_username}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ color: "#475569", fontSize: "12px", marginTop: "4px", lineHeight: 1.4 }}>
                        {selectedOrder.address}
                      </div>
                    </div>

                    <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                      <div style={{ color: "#64748b", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", marginBottom: "4px" }}>
                        Payment & Shipping
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "#2563eb" }}>
                        Method: {selectedOrder.payment_method.toUpperCase()}
                      </div>
                      <div style={{ color: "#475569", fontSize: "12px", marginTop: "4px" }}>
                        Delivery Fee: ৳{selectedOrder.delivery_charge}
                      </div>
                      <div style={{ color: "#475569", fontSize: "12px" }}>
                        Discount: -৳{selectedOrder.discount_amount}
                      </div>
                    </div>
                  </div>

                  {/* Ordered Items List */}
                  <div>
                    <h4 style={{ fontSize: "12px", fontWeight: 800, color: "#64748b", margin: "0 0 10px", textTransform: "uppercase" }}>
                      Ordered Items ({selectedOrder.items.length})
                    </h4>
                    <div style={{ borderTop: "1px solid #f1f5f9", display: "flex", flexDirection: "column" }}>
                      {selectedOrder.items.map(item => (
                        <div
                          key={item.id}
                          style={{
                            padding: "10px 0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderBottom: "1px solid #f1f5f9"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {item.product_image ? (
                              <img
                                src={item.product_image}
                                alt={item.product_name}
                                style={{ width: "38px", height: "38px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                              />
                            ) : (
                              <div style={{ width: "38px", height: "38px", borderRadius: "8px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                                <Package size={16} />
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "13px" }}>
                                {item.product_name}
                              </div>
                              <div style={{ color: "#64748b", fontSize: "11px" }}>
                                {item.quantity} × ৳{item.unit_price}
                              </div>
                            </div>
                          </div>
                          <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "13px" }}>
                            ৳{parseFloat(item.unit_price) * item.quantity}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Grand Total */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: "12px",
                    borderTop: "2px dashed #e2e8f0"
                  }}>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                      Grand Total:
                    </span>
                    <span style={{ fontSize: "22px", fontWeight: 900, color: "#0f172a" }}>
                      ৳{selectedOrder.total}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PRODUCTS & STOCK TAB */}
        {activeTab === "products" && (
          showProductForm ? (
            <ProductForm
              initialProduct={editingProduct}
              categories={categories}
              onSaveSuccess={() => {
                setShowProductForm(false);
                setEditingProduct(null);
                fetchDashboardData();
                toast.success("Product saved successfully!");
              }}
              onCancel={() => {
                setShowProductForm(false);
                setEditingProduct(null);
              }}
              getApiUrl={getApiUrl}
            />
          ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontSize: "22px", fontWeight: 800, color: "var(--forest)", margin: 0 }}>Product Catalog & Inventory</h3>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--coffee)" }}>
                  Manage all product specifications, stock levels, and variants.
                </p>
              </div>
              <button
                onClick={openCreateModal}
                className="admin-submit-btn"
                style={{ width: "auto", padding: "10px 20px", marginTop: 0 }}
              >
                + Add New Product
              </button>
            </div>

            {/* Filter Bar */}
            <div className="admin-panel" style={{ padding: "16px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
              <input
                type="text"
                placeholder="Search by product name, SKU, or slug..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                className="admin-input-field"
                style={{ flex: 1, minWidth: "220px", margin: 0 }}
              />
              <select
                value={productCategoryFilter}
                onChange={e => setProductCategoryFilter(e.target.value)}
                className="admin-input-field"
                style={{ width: "auto", margin: 0 }}
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setLowStockFilter(prev => !prev)}
                className="admin-btn-secondary"
                style={{
                  fontSize: "12px",
                  padding: "8px 14px",
                  background: lowStockFilter ? "#fef2f2" : "#f8fafc",
                  borderColor: lowStockFilter ? "#ef4444" : "#e2e8f0",
                  color: lowStockFilter ? "#b91c1c" : "#475569",
                  fontWeight: lowStockFilter ? 800 : 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <AlertTriangle size={14} style={{ color: lowStockFilter ? "#ef4444" : "#f59e0b" }} />
                Low Stock (≤5)
              </button>

              <span className="admin-badge pending" style={{ fontSize: "12px", marginLeft: "auto" }}>
                {filteredProducts.length} Products Found
              </span>
            </div>

            <div className="admin-panel" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Discount</th>
                      <th>Stock</th>
                      <th>Featured</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: "center", padding: "32px", color: "var(--coffee)" }}>
                          No products found.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map(product => (
                        <tr key={product.id}>
                          <td style={{ fontWeight: 700, color: "var(--forest)", display: "flex", alignItems: "center", gap: "12px" }}>
                            {product.images?.[0]?.image ? (
                              <img src={product.images[0].image} alt={product.name} style={{ width: "42px", height: "42px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--line)" }} />
                            ) : (
                              <div style={{ width: "42px", height: "42px", background: "var(--cream)", borderRadius: "8px", display: "grid", placeItems: "center", fontSize: "10px", color: "var(--coffee)" }}>No Img</div>
                            )}
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span>{product.name}</span>
                                {Array.isArray(product.variants) && product.variants.length > 0 && (
                                  <span style={{ fontSize: "10px", background: "rgba(23,63,53,0.08)", color: "var(--forest)", padding: "1px 6px", borderRadius: "8px", fontWeight: 700 }}>
                                    {product.variants.length} variants
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: "11px", color: "var(--coffee)", fontWeight: 400 }}>/products/{product.slug}</div>
                            </div>
                          </td>
                          <td style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--forest)", fontWeight: 600 }}>
                            {product.base_sku || "-"}
                          </td>
                          <td style={{ color: "var(--ink)" }}>{product.category?.name || "N/A"}</td>
                          <td>
                            {quickEditProductId === product.id ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <span style={{ fontSize: "11px", fontWeight: 700 }}>৳</span>
                                <input
                                  type="number"
                                  value={quickPriceVal}
                                  onChange={e => setQuickPriceVal(e.target.value)}
                                  style={{ width: "68px", padding: "3px 6px", fontSize: "12px", border: "1.5px solid #2563eb", borderRadius: "6px" }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleQuickSavePriceStock(product.id)}
                                  style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: "4px", padding: "4px 6px", cursor: "pointer" }}
                                  title="Save Price"
                                >
                                  <Check size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setQuickEditProductId(null)}
                                  style={{ background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: "4px", padding: "4px 6px", cursor: "pointer" }}
                                  title="Cancel"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontWeight: 700, color: "var(--forest)" }}>৳{product.price}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setQuickEditProductId(product.id);
                                    setQuickPriceVal(product.price);
                                    setQuickStockVal(product.stock.toString());
                                  }}
                                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8", padding: "2px" }}
                                  title="Quick Edit Price"
                                >
                                  <Edit2 size={12} />
                                </button>
                              </div>
                            )}
                          </td>
                          <td style={{ color: "var(--emerald)", fontWeight: 700 }}>{product.discount_price ? `৳${product.discount_price}` : "-"}</td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <button
                                onClick={() => handleQuickStockChange(product, -1)}
                                style={{ width: "22px", height: "22px", borderRadius: "4px", border: "1px solid var(--line)", background: "var(--cream)", fontWeight: 700, cursor: "pointer" }}
                              >
                                -
                              </button>
                              <span className={`admin-badge ${product.stock === 0 ? "cancelled" : product.stock <= 5 ? "pending" : "delivered"}`}>
                                {product.stock} in stock
                              </span>
                              <button
                                onClick={() => handleQuickStockChange(product, 1)}
                                style={{ width: "22px", height: "22px", borderRadius: "4px", border: "1px solid var(--line)", background: "var(--cream)", fontWeight: 700, cursor: "pointer" }}
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleToggleProductFeatured(product)}
                              style={{
                                background: product.is_featured ? "#fef3c7" : "#f8fafc",
                                color: product.is_featured ? "#b45309" : "#94a3b8",
                                border: "1px solid",
                                borderColor: product.is_featured ? "#fde68a" : "#e2e8f0",
                                padding: "4px 8px",
                                borderRadius: "8px",
                                fontSize: "11px",
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                              title="Toggle Featured on Storefront"
                            >
                              <Star size={12} fill={product.is_featured ? "#b45309" : "none"} />
                              {product.is_featured ? "Featured" : "Standard"}
                            </button>
                          </td>
                          <td>
                            <button
                              onClick={() => handleToggleProductActive(product)}
                              className={`admin-badge ${product.is_active ? "delivered" : "cancelled"}`}
                              style={{ border: "none", cursor: "pointer" }}
                            >
                              {product.is_active ? "Active" : "Disabled"}
                            </button>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              onClick={() => openEditModal(product)}
                              className="admin-header-link"
                              style={{ padding: "4px 12px", fontSize: "12px", marginRight: "6px" }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="admin-header-link"
                              style={{ padding: "4px 12px", fontSize: "12px", background: "rgba(225,29,72,0.1)", color: "#e11d48", borderColor: "rgba(225,29,72,0.3)" }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          )
        )}

        {/* COUPONS & DEALS TAB */}
        {activeTab === "coupons" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h3 style={{ fontSize: "22px", fontWeight: 800, color: "var(--forest)", margin: 0 }}>Promotions & Coupon Discounts</h3>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--coffee)" }}>
                  Create voucher codes, percentage discounts, and track usage counts.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCouponModal(true)}
                className="admin-submit-btn"
                style={{ width: "auto", padding: "10px 20px", marginTop: 0 }}
              >
                + Create Promo Code
              </button>
            </div>

            {coupons.length === 0 ? (
              <div className="profit-panel-card" style={{ textAlign: "center", padding: "48px 20px" }}>
                <Tag size={40} style={{ color: "#94a3b8", margin: "0 auto 12px" }} />
                <h4 style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>No active coupons found</h4>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "6px 0 16px" }}>
                  Create your first promotional discount code to reward shoppers.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCouponModal(true)}
                  className="admin-btn-primary"
                >
                  Create Promo Code
                </button>
              </div>
            ) : (
              <div className="coupon-grid">
                {coupons.map(cp => {
                  const isExpired = cp.expires_at && new Date(cp.expires_at) < new Date();
                  return (
                    <div key={cp.id} className="coupon-card">
                      <div className="coupon-card-header">
                        <span className="coupon-code-pill">{cp.code}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(cp.code);
                              toast.success(`Copied "${cp.code}"`);
                            }}
                            className="admin-btn-secondary"
                            style={{ padding: "4px 8px", fontSize: "11px" }}
                            title="Copy Code"
                          >
                            <Copy size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(cp.id)}
                            className="admin-btn-secondary"
                            style={{ padding: "4px 8px", fontSize: "11px", color: "#ef4444" }}
                            title="Delete Coupon"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="coupon-discount-val">
                          {cp.discount_type === "percent" ? `${cp.value}% OFF` : `৳${cp.value} OFF`}
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                          {parseFloat(cp.min_order) > 0 ? `Minimum order: ৳${cp.min_order}` : "No minimum spend required"}
                        </div>
                      </div>

                      <div className="coupon-meta-row">
                        <span>Used: <strong>{cp.used_count}</strong> {cp.max_uses ? `/ ${cp.max_uses}` : "times"}</span>
                        <span>
                          {cp.expires_at ? (
                            <span style={{ color: isExpired ? "#ef4444" : "#64748b" }}>
                              {isExpired ? "Expired: " : "Expires: "}
                              {new Date(cp.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          ) : (
                            "No expiration"
                          )}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "4px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: cp.is_active && !isExpired ? "#166534" : "#991b1b" }}>
                          {isExpired ? "Expired" : cp.is_active ? "● Active" : "○ Inactive"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleCouponActive(cp)}
                          className={`admin-badge ${cp.is_active ? "delivered" : "cancelled"}`}
                          style={{ border: "none", cursor: "pointer", fontSize: "11px" }}
                        >
                          {cp.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* COURIER LOGISTICS TAB */}
        {activeTab === "courier" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h3 style={{ fontSize: "22px", fontWeight: 800, color: "var(--forest)", margin: 0 }}>Courier & Delivery Logistics</h3>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--coffee)" }}>
                  Configure automated dispatch with SteadFast & Pathao, generate consignments, and monitor real-time tracking.
                </p>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setActiveTab("orders")}
                  className="admin-btn-secondary"
                  style={{ fontSize: "12px" }}
                >
                  <ShoppingCart size={14} /> View All Orders
                </button>
              </div>
            </div>

            {/* Courier KPI cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              <div className="profit-stat-card green" style={{ padding: "18px" }}>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#166534", textTransform: "uppercase" }}>Dispatched Shipments</div>
                <div style={{ fontSize: "24px", fontWeight: 900, color: "#0f172a", marginTop: "4px" }}>
                  {orders.filter(o => o.consignment_id).length}
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Booked with Courier Consignment</div>
              </div>

              <div className="profit-stat-card orange" style={{ padding: "18px" }}>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#9a3412", textTransform: "uppercase" }}>Pending Dispatch</div>
                <div style={{ fontSize: "24px", fontWeight: 900, color: "#0f172a", marginTop: "4px" }}>
                  {orders.filter(o => !o.consignment_id && (o.status === "confirmed" || o.status === "processing")).length}
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Confirmed orders ready for booking</div>
              </div>

              <div className="profit-stat-card blue" style={{ padding: "18px" }}>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#1e40af", textTransform: "uppercase" }}>Active Integrations</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", marginTop: "8px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <span className={`admin-badge ${steadfastForm.is_active ? "delivered" : "cancelled"}`}>
                    SteadFast: {steadfastForm.is_active ? "Active" : "Disabled"}
                  </span>
                  <span className={`admin-badge ${pathaoForm.is_active ? "delivered" : "cancelled"}`}>
                    Pathao: {pathaoForm.is_active ? "Active" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>

            {/* Courier Configuration Card with Tabs */}
            <div className="profit-panel-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                    Courier API & Gateway Credentials
                  </h4>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                    Enter your merchant API credentials provided by your courier account.
                  </p>
                </div>

                {/* Sub tabs */}
                <div style={{ display: "flex", background: "#f1f5f9", padding: "4px", borderRadius: "10px", gap: "4px" }}>
                  <button
                    type="button"
                    onClick={() => setSelectedCourierTab("steadfast")}
                    style={{
                      border: "none",
                      padding: "6px 16px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      background: selectedCourierTab === "steadfast" ? "#ffffff" : "transparent",
                      color: selectedCourierTab === "steadfast" ? "#0f172a" : "#64748b",
                      boxShadow: selectedCourierTab === "steadfast" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                    }}
                  >
                    SteadFast Courier
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCourierTab("pathao")}
                    style={{
                      border: "none",
                      padding: "6px 16px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      background: selectedCourierTab === "pathao" ? "#ffffff" : "transparent",
                      color: selectedCourierTab === "pathao" ? "#0f172a" : "#64748b",
                      boxShadow: selectedCourierTab === "pathao" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                    }}
                  >
                    Pathao Courier
                  </button>
                </div>
              </div>

              {/* SteadFast Form */}
              {selectedCourierTab === "steadfast" && (
                <form
                  onSubmit={e => { e.preventDefault(); handleSaveCourierConfig("steadfast"); }}
                  style={{ display: "flex", flexDirection: "column", gap: "16px" }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div className="admin-form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>SteadFast API Key</label>
                      <input
                        type="text"
                        placeholder="e.g. your_steadfast_api_key"
                        value={steadfastForm.api_key}
                        onChange={e => setSteadfastForm({ ...steadfastForm, api_key: e.target.value })}
                        className="admin-input-field"
                      />
                    </div>
                    <div className="admin-form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>SteadFast Secret Key</label>
                      <input
                        type="password"
                        placeholder="e.g. your_steadfast_secret_key"
                        value={steadfastForm.api_secret}
                        onChange={e => setSteadfastForm({ ...steadfastForm, api_secret: e.target.value })}
                        className="admin-input-field"
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "24px", paddingTop: "8px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "#334155" }}>
                      <input
                        type="checkbox"
                        checked={steadfastForm.is_sandbox}
                        onChange={e => setSteadfastForm({ ...steadfastForm, is_sandbox: e.target.checked })}
                      />
                      Sandbox / Test Mode
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 700, color: steadfastForm.is_active ? "#166534" : "#64748b" }}>
                      <input
                        type="checkbox"
                        checked={steadfastForm.is_active}
                        onChange={e => setSteadfastForm({ ...steadfastForm, is_active: e.target.checked })}
                      />
                      Enable SteadFast for Order Dispatch
                    </label>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
                    <button
                      type="submit"
                      disabled={savingCourierConfig}
                      className="admin-submit-btn"
                      style={{ width: "auto", padding: "10px 24px", marginTop: 0 }}
                    >
                      {savingCourierConfig ? "Saving..." : "Save SteadFast Settings"}
                    </button>
                  </div>
                </form>
              )}

              {/* Pathao Form */}
              {selectedCourierTab === "pathao" && (
                <form
                  onSubmit={e => { e.preventDefault(); handleSaveCourierConfig("pathao"); }}
                  style={{ display: "flex", flexDirection: "column", gap: "16px" }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div className="admin-form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>Client ID</label>
                      <input
                        type="text"
                        placeholder="Pathao API Client ID"
                        value={pathaoForm.client_id}
                        onChange={e => setPathaoForm({ ...pathaoForm, client_id: e.target.value })}
                        className="admin-input-field"
                      />
                    </div>
                    <div className="admin-form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>Client Secret</label>
                      <input
                        type="password"
                        placeholder="Pathao API Client Secret"
                        value={pathaoForm.client_secret}
                        onChange={e => setPathaoForm({ ...pathaoForm, client_secret: e.target.value })}
                        className="admin-input-field"
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                    <div className="admin-form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>Merchant Email / Username</label>
                      <input
                        type="text"
                        placeholder="Registered Pathao Email"
                        value={pathaoForm.username}
                        onChange={e => setPathaoForm({ ...pathaoForm, username: e.target.value })}
                        className="admin-input-field"
                      />
                    </div>
                    <div className="admin-form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>Password</label>
                      <input
                        type="password"
                        placeholder="Merchant Password"
                        value={pathaoForm.password}
                        onChange={e => setPathaoForm({ ...pathaoForm, password: e.target.value })}
                        className="admin-input-field"
                      />
                    </div>
                    <div className="admin-form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>Default Store ID (Optional)</label>
                      <input
                        type="text"
                        placeholder="Store ID"
                        value={pathaoForm.store_id}
                        onChange={e => setPathaoForm({ ...pathaoForm, store_id: e.target.value })}
                        className="admin-input-field"
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "24px", paddingTop: "8px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "#334155" }}>
                      <input
                        type="checkbox"
                        checked={pathaoForm.is_sandbox}
                        onChange={e => setPathaoForm({ ...pathaoForm, is_sandbox: e.target.checked })}
                      />
                      Sandbox / Test Mode
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 700, color: pathaoForm.is_active ? "#166534" : "#64748b" }}>
                      <input
                        type="checkbox"
                        checked={pathaoForm.is_active}
                        onChange={e => setPathaoForm({ ...pathaoForm, is_active: e.target.checked })}
                      />
                      Enable Pathao for Order Dispatch
                    </label>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
                    <button
                      type="submit"
                      disabled={savingCourierConfig}
                      className="admin-submit-btn"
                      style={{ width: "auto", padding: "10px 24px", marginTop: 0 }}
                    >
                      {savingCourierConfig ? "Saving..." : "Save Pathao Settings"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Consignments Table & Dispatch Queue */}
            <div className="profit-panel-card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                    Dispatched Consignments & Tracking Ledger
                  </h4>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                    Real-time status of all booked orders
                  </p>
                </div>
                <span className="admin-badge pending" style={{ fontSize: "12px" }}>
                  {orders.filter(o => o.consignment_id).length} Active Consignments
                </span>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Courier Provider</th>
                      <th>Consignment ID</th>
                      <th>Tracking Code</th>
                      <th>Customer Details</th>
                      <th>COD Amount</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.filter(o => o.consignment_id).length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: "center", padding: "36px", color: "var(--coffee)" }}>
                          No orders have been dispatched yet. Go to Orders tab to book consignments!
                        </td>
                      </tr>
                    ) : (
                      orders.filter(o => o.consignment_id).map(o => (
                        <tr key={o.id}>
                          <td style={{ fontWeight: 800, color: "#2563eb" }}>#{o.id}</td>
                          <td>
                            <span style={{
                              fontWeight: 700,
                              textTransform: "uppercase",
                              fontSize: "11px",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              background: o.courier_provider === "steadfast" ? "#fef3c7" : "#e0e7ff",
                              color: o.courier_provider === "steadfast" ? "#b45309" : "#4338ca",
                              border: "1px solid",
                              borderColor: o.courier_provider === "steadfast" ? "#fde68a" : "#c7d2fe"
                            }}>
                              {o.courier_provider || "SteadFast"}
                            </span>
                          </td>
                          <td style={{ fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>
                            {o.consignment_id}
                          </td>
                          <td style={{ fontFamily: "monospace", fontWeight: 700, color: "#2563eb" }}>
                            {o.tracking_code || o.consignment_id}
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: "#0f172a" }}>{o.customer_name}</div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>{o.phone}</div>
                          </td>
                          <td style={{ fontWeight: 800, color: "#0f172a" }}>৳{o.total}</td>
                          <td>
                            <span className="admin-badge delivered" style={{ textTransform: "capitalize" }}>
                              {o.courier_status || "In Review"}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              onClick={() => handleTrackCourier(o)}
                              className="admin-header-link"
                              style={{ padding: "4px 12px", fontSize: "12px", color: "#2563eb", borderColor: "#93c5fd" }}
                            >
                              Track
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOMERS TAB (CRM & Directory) */}
        {activeTab === "customers" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h3 style={{ fontSize: "22px", fontWeight: 800, color: "var(--forest)", margin: 0 }}>Customer Directory & CRM</h3>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--coffee)" }}>
                  Verified customer profiles, lifetime spend, order history, and direct communication.
                </p>
              </div>
              <span className="admin-badge pending" style={{ fontSize: "13px" }}>
                {filteredCustomers.length} Customer Profiles
              </span>
            </div>

            {/* Customer Search Filter Bar */}
            <div className="admin-panel" style={{ padding: "16px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
              <input
                type="text"
                placeholder="Search customers by name, phone, email, or address..."
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                className="admin-input-field"
                style={{ flex: 1, minWidth: "260px", margin: 0 }}
              />
              {customerSearch && (
                <button
                  type="button"
                  onClick={() => setCustomerSearch("")}
                  className="admin-btn-secondary"
                  style={{ padding: "8px 12px", fontSize: "12px" }}
                >
                  Clear
                </button>
              )}
            </div>

            <div className="admin-panel" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Customer Profile</th>
                      <th>Contact & Actions</th>
                      <th>Delivery Location</th>
                      <th>Purchased Items</th>
                      <th>Orders Count</th>
                      <th>Lifetime Spent</th>
                      <th>Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "var(--coffee)" }}>
                          No customer records found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((c, idx) => {
                        const isVip = c.total_spent >= 5000 || c.total_orders >= 3;
                        const isLoyal = !isVip && c.total_orders >= 2;

                        return (
                          <tr key={c.id || idx}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                {c.avatar_url ? (
                                  <img
                                    src={c.avatar_url}
                                    alt={c.profile_name || c.customer_name}
                                    style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover", border: "1.5px solid #2563eb", flexShrink: 0 }}
                                  />
                                ) : (
                                  <div style={{
                                    width: "38px",
                                    height: "38px",
                                    borderRadius: "50%",
                                    background: "#eff6ff",
                                    color: "#1d4ed8",
                                    fontWeight: 800,
                                    fontSize: "14px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    border: "1px solid #bfdbfe",
                                    flexShrink: 0
                                  }}>
                                    {(c.profile_name || c.customer_name || "C").charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span style={{ fontWeight: 700, color: "var(--forest)" }}>{c.customer_name}</span>
                                    {isVip && (
                                      <span className="customer-badge-vip">★ VIP</span>
                                    )}
                                    {isLoyal && (
                                      <span className="customer-badge-loyal">Returning</span>
                                    )}
                                  </div>
                                  {c.profile_name && c.profile_name !== c.customer_name && (
                                    <div style={{ fontSize: "11px", color: "var(--coffee)" }}>👤 {c.profile_name}</div>
                                  )}
                                  {c.username && (
                                    <div style={{ fontSize: "11px", color: "#2563eb" }}>@{c.username}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ fontSize: "12px", color: "var(--ink)", fontWeight: 600 }}>{c.phone || "—"}</div>
                              {c.email && <div style={{ fontSize: "11px", color: "var(--coffee)" }}>{c.email}</div>}
                              {c.phone && (
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                                  <a
                                    href={`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Assalamu Alaikum ${c.customer_name}, greetings from Alorchoya!`)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn-whatsapp"
                                    style={{ padding: "3px 8px", fontSize: "11px", borderRadius: "6px" }}
                                    title="Open WhatsApp chat"
                                  >
                                    <WhatsAppIcon /> WA
                                  </a>
                                  <a
                                    href={`tel:${c.phone}`}
                                    className="btn-call"
                                    style={{ padding: "3px 8px", fontSize: "11px", borderRadius: "6px" }}
                                    title="Call Customer"
                                  >
                                    <Phone size={11} /> Call
                                  </a>
                                </div>
                              )}
                            </td>
                            <td style={{ color: "var(--ink)", fontSize: "12px", maxWidth: "200px" }}>{c.address}</td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap", maxWidth: "160px" }}>
                                {(c.purchased_products || []).slice(0, 4).map((p, pIdx) => (
                                  <div
                                    key={pIdx}
                                    title={p.name}
                                    style={{
                                      width: "28px",
                                      height: "28px",
                                      borderRadius: "6px",
                                      overflow: "hidden",
                                      border: "1px solid #e2e8f0",
                                      background: "#f8fafc",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0
                                    }}
                                  >
                                    {p.image ? (
                                      <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                      <Package size={14} style={{ color: "#94a3b8" }} />
                                    )}
                                  </div>
                                ))}
                                {(c.purchased_products || []).length > 4 && (
                                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", background: "#f1f5f9", padding: "1px 5px", borderRadius: "6px" }}>
                                    +{c.purchased_products.length - 4}
                                  </span>
                                )}
                                {(!c.purchased_products || c.purchased_products.length === 0) && (
                                  <span style={{ color: "var(--coffee)", fontSize: "12px" }}>—</span>
                                )}
                              </div>
                            </td>
                            <td style={{ fontWeight: 700 }}>
                              <span className="admin-badge delivered" style={{ background: "rgba(16,185,129,0.1)", color: "var(--forest)" }}>
                                {c.total_orders} Orders
                              </span>
                            </td>
                            <td style={{ fontWeight: 800, color: "var(--emerald)" }}>৳{c.total_spent}</td>
                            <td style={{ color: "var(--coffee)", fontSize: "12px" }}>
                              {c.last_order_date ? new Date(c.last_order_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* IMAGE GALLERY TAB */}
        {activeTab === "gallery" && (
          <ImageGallery
            products={products}
            csrfToken={csrfToken}
            getApiUrl={getApiUrl}
            onRefreshProducts={fetchDashboardData}
          />
        )}
        {/* HERO SECTION SLIDES & BANNERS TAB */}
        {activeTab === "hero" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Header / Action Bar */}
            <div className="admin-panel" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", padding: "20px 24px" }}>
              <div>
                <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
                  🖼️ হোম হিরো সেকশন ব্যানার ও স্লাইডার
                </h3>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                  হোমপেজের মূল স্লাইডারে প্রদর্শনের জন্য ছবি, আকর্ষণীয় শিরোনাম, অফার ব্যাজ ও বাটন কাস্টমাইজ করুন।
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateSlideModal}
                className="admin-btn-primary"
                style={{ padding: "10px 20px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Plus size={16} /> নতুন স্লাইড যোগ করুন
              </button>
            </div>

            {/* Slides List / Cards */}
            {heroSlides.length === 0 ? (
              <div className="admin-panel" style={{ padding: "48px 24px", textAlign: "center" }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#f1f5f9", display: "grid", placeItems: "center", margin: "0 auto 16px", color: "#64748b" }}>
                  <ImageIcon size={32} />
                </div>
                <h4 style={{ fontSize: "17px", fontWeight: 700, color: "#1e293b", margin: "0 0 8px" }}>
                  কোনো কাস্টম হিরো ব্যানার পাওয়া যায়নি
                </h4>
                <p style={{ maxWidth: "480px", margin: "0 auto 20px", fontSize: "13px", color: "#64748b", lineHeight: 1.6 }}>
                  এখনও কোনো কাস্টম স্লাইড যুক্ত করা হয়নি। বর্তমানে হোমপেজে স্বয়ংক্রিয়ভাবে ফিচার্ড পণ্যগুলোর ছবি দেখানো হচ্ছে। নিজস্ব ব্যানার ও অফার টেক্সট দেখাতে নিচের বাটনে ক্লিক করুন।
                </p>
                <button
                  type="button"
                  onClick={openCreateSlideModal}
                  className="admin-btn-primary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  <Plus size={16} /> প্রথম স্লাইড তৈরি করুন
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
                {heroSlides.map((slide, index) => (
                  <div
                    key={slide.id}
                    className="admin-panel"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "20px",
                      padding: "16px 20px",
                      opacity: slide.is_active ? 1 : 0.65,
                      borderLeft: slide.is_active ? "4px solid #10b981" : "4px solid #94a3b8",
                      flexWrap: "wrap",
                      position: "relative",
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{ width: "120px", height: "80px", borderRadius: "8px", overflow: "hidden", background: "#f8fafc", border: "1px solid #e2e8f0", flexShrink: 0, position: "relative" }}>
                      {slide.image ? (
                        <img
                          src={slide.image}
                          alt={slide.title || "Banner"}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "#94a3b8" }}>
                          <ImageIcon size={24} />
                        </div>
                      )}
                    </div>

                    {/* Information */}
                    <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "12px", background: "rgba(201, 164, 92, 0.15)", color: "#b45309" }}>
                          {slide.eyebrow || "★ বিশেষ অফার"}
                        </span>
                        {slide.is_active ? (
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#166534", background: "#dcfce7", padding: "2px 8px", borderRadius: "12px" }}>
                            ✓ সক্রিয় (Active)
                          </span>
                        ) : (
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#475569", background: "#f1f5f9", padding: "2px 8px", borderRadius: "12px" }}>
                            বন্ধ (Inactive)
                          </span>
                        )}
                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                          ক্রম: #{slide.position}
                        </span>
                      </div>

                      <h4 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: "0 0 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {slide.title || (slide.product_name ? `পণ্য: ${slide.product_name}` : "ব্যানার স্লাইড")}
                      </h4>

                      {slide.subtitle && (
                        <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 6px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {slide.subtitle}
                        </p>
                      )}

                      <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "#475569" }}>
                        <span>বাটন: <b>{slide.button_text || "কেনাকাটা"}</b></span>
                        <span>লিংক: <code>{slide.button_link || "#shop"}</code></span>
                        {slide.product_name && (
                          <span style={{ color: "#2563eb", fontWeight: 600 }}>
                            🔗 {slide.product_name} (৳{slide.product_price})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ordering Buttons */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <button
                        type="button"
                        onClick={() => handleMoveSlide(slide, "up")}
                        disabled={index === 0}
                        style={{ padding: "4px 8px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: index === 0 ? "not-allowed" : "pointer", opacity: index === 0 ? 0.4 : 1 }}
                        title="উপরে নিন"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveSlide(slide, "down")}
                        disabled={index === heroSlides.length - 1}
                        style={{ padding: "4px 8px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: index === heroSlides.length - 1 ? "not-allowed" : "pointer", opacity: index === heroSlides.length - 1 ? 0.4 : 1 }}
                        title="নিচে নিন"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => handleToggleSlideActive(slide)}
                        style={{
                          padding: "6px 12px",
                          fontSize: "12px",
                          fontWeight: 600,
                          borderRadius: "6px",
                          border: "1px solid",
                          borderColor: slide.is_active ? "#fcd34d" : "#86efac",
                          background: slide.is_active ? "#fef3c7" : "#f0fdf4",
                          color: slide.is_active ? "#b45309" : "#166534",
                          cursor: "pointer",
                        }}
                      >
                        {slide.is_active ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditSlideModal(slide)}
                        className="admin-btn-secondary"
                        style={{ padding: "6px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                      >
                        <Edit3 size={13} /> এডিট
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSlide(slide.id)}
                        style={{ padding: "6px 10px", background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5", borderRadius: "6px", cursor: "pointer" }}
                        title="মুছে ফেলুন"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

          </main>
        </div>
      </div>

      {/* Product Add/Edit Modal */}
      {showProductModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(23,63,53,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="admin-login-card" style={{ maxWidth: "560px", padding: "32px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: "12px", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h3>
              <button onClick={() => setShowProductModal(false)} style={{ background: "none", border: "none", fontSize: "18px", color: "var(--coffee)", cursor: "pointer" }}>✕</button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="admin-form-group" style={{ margin: 0 }}>
                <label>Product Name</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                  className="admin-input-field"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label>Product Slug</label>
                  <input type="text" required value={productForm.slug} onChange={e => setProductForm({ ...productForm, slug: e.target.value })} className="admin-input-field" placeholder="product-slug" />
                </div>
                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label>Image Alt Text</label>
                  <input type="text" value={productForm.image_alt} onChange={e => setProductForm({ ...productForm, image_alt: e.target.value })} className="admin-input-field" placeholder="Image description for SEO" />
                </div>
              </div>

              <div className="admin-form-group" style={{ margin: 0 }}>
                <label>Select Image from Device</label>
                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="admin-input-field" />
                {imageFile && <small style={{ color: "var(--emerald)" }}>Selected: {imageFile.name}</small>}
                <small style={{ color: "var(--coffee)", fontSize: "11px" }}>Image will upload to product gallery after saving</small>
              </div>
              <div className="admin-form-group" style={{ margin: 0 }}>
                <label>Or Image URL</label>
                <input type="url" placeholder="https://example.com/image.jpg" value={productForm.image_url} onChange={e => setProductForm({ ...productForm, image_url: e.target.value })} className="admin-input-field" />
              </div>

              <div className="admin-form-group markdown-editor" style={{ margin: 0 }}>
                <label>Product Description (Markdown)</label>
                <div className="markdown-tabs"><button type="button" className={descriptionMode === "write" ? "active" : ""} onClick={() => setDescriptionMode("write")}>Write</button><button type="button" className={descriptionMode === "preview" ? "active" : ""} onClick={() => setDescriptionMode("preview")}>Preview</button></div>
                {descriptionMode === "write" ? <><div className="markdown-toolbar"><button type="button" onClick={() => insertMarkdown("# ", "", "Heading")}>H1</button><button type="button" onClick={() => insertMarkdown("**", "**", "Bold Text")}>B</button><button type="button" onClick={() => insertMarkdown("*", "*", "Italic Text")}>I</button><button type="button" onClick={() => insertMarkdown("- ", "", "List Item")}>• List</button><button type="button" onClick={() => insertMarkdown("> ", "", "Quote")}>Quote</button></div><textarea ref={descriptionRef} rows={8} value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} className="admin-input-field markdown-textarea" placeholder="# Product Specifications\n- High quality build\n- Authentic materials\n\n**Note:** Handle with care." /></> : <MarkdownPreview value={productForm.description} className="markdown-editor-preview" />}
                <small style={{ color: "var(--coffee)", fontSize: "11px" }}>Use Markdown: # heading, **bold**, *italic*, - list, &gt; quote</small>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label>Price (৳)</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                    className="admin-input-field"
                  />
                </div>
                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label>Discount Price (Optional)</label>
                  <input
                    type="number"
                    min="0"
                    max={productForm.price || undefined}
                    value={productForm.discount_price}
                    onChange={e => setProductForm({ ...productForm, discount_price: e.target.value })}
                    className="admin-input-field"
                  />
                  <small style={{ color: "var(--coffee)", fontSize: "11px" }}>Leave empty if no discount applies</small>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label>Stock (Quantity)</label>
                  <input
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={e => setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })}
                    className="admin-input-field"
                  />
                </div>
                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label>Category</label>
                  <select
                    value={productForm.category_id}
                    onChange={e => setProductForm({ ...productForm, category_id: parseInt(e.target.value) || 1 })}
                    className="admin-input-field"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "24px", paddingTop: "8px", flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", color: "var(--forest)", fontWeight: 600 }}>
                  <input type="checkbox" checked={productForm.image_primary} onChange={e => setProductForm({ ...productForm, image_primary: e.target.checked })} />
                  Use as Primary Image
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", color: "var(--forest)", fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={productForm.is_featured}
                    onChange={e => setProductForm({ ...productForm, is_featured: e.target.checked })}
                  />
                  Featured Product
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", color: "var(--forest)", fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={productForm.is_active}
                    onChange={e => setProductForm({ ...productForm, is_active: e.target.checked })}
                  />
                  Published (Active)
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "16px", borderTop: "1px solid var(--line)" }}>
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="admin-header-link"
                  style={{ padding: "10px 20px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-submit-btn"
                  style={{ width: "auto", padding: "10px 24px", marginTop: 0 }}
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Create / Edit Hero Slide Modal */}
      {showSlideModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", overflowY: "auto" }}>
          <div className="admin-login-card" style={{ maxWidth: "600px", width: "100%", padding: "28px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <SlidersHorizontal size={18} style={{ color: "#2563eb" }} />
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  {editingSlide ? "হিরো ব্যানার স্লাইড সম্পাদনা" : "নতুন হিরো ব্যানার স্লাইড তৈরি"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSlideModal(false)}
                style={{ background: "none", border: "none", fontSize: "18px", color: "#64748b", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSlide} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Image Picker */}
              <div className="admin-form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>
                  ব্যানার ছবি (Desktop Image) {editingSlide ? "(পরিবর্তন করতে চাইলে নির্বাচন করুন)" : "*"}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSlideImageFile(file);
                      setSlideImagePreview(URL.createObjectURL(file));
                    }
                  }}
                  className="admin-input-field"
                  style={{ padding: "8px" }}
                />
                <small style={{ color: "#64748b", fontSize: "11px", marginTop: "4px", display: "block" }}>
                  প্রস্তাবিত সাইজ: 1200x800 বা 800x1000 পিকচার (JPG, PNG, WebP)
                </small>

                {slideImagePreview && (
                  <div style={{ marginTop: "10px", width: "100%", height: "160px", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0", background: "#f8fafc" }}>
                    <img src={slideImagePreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}
              </div>

              {/* Title & Subtitle */}
              <div className="admin-form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>শিরোনাম (Title)</label>
                <input
                  type="text"
                  placeholder="যেমন: আপনার ঘরের সৌন্দর্য বাড়ান প্রিমিয়াম হোম ডেকোরে"
                  value={slideForm.title}
                  onChange={e => setSlideForm({ ...slideForm, title: e.target.value })}
                  className="admin-input-field"
                />
              </div>

              <div className="admin-form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>উপশিরোনাম / বিবরণ (Subtitle / Description)</label>
                <textarea
                  rows={2}
                  placeholder="যেমন: অভিজ্ঞ কারিগরদের তৈরি বুকশেলফ, ওয়াল শেলফ ও ডেকোরেটিভ ফার্নিচারের বিশ্বস্ত অনলাইন শপ।"
                  value={slideForm.subtitle}
                  onChange={e => setSlideForm({ ...slideForm, subtitle: e.target.value })}
                  className="admin-input-field"
                  style={{ resize: "vertical" }}
                />
              </div>

              {/* Eyebrow & Button */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>ট্যাগ / অফার ব্যাজ</label>
                  <input
                    type="text"
                    placeholder="যেমন: ★ বিশেষ অফার"
                    value={slideForm.eyebrow}
                    onChange={e => setSlideForm({ ...slideForm, eyebrow: e.target.value })}
                    className="admin-input-field"
                  />
                </div>

                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>বাটন টেক্সট</label>
                  <input
                    type="text"
                    placeholder="যেমন: কেনাকাটা শুরু করুন"
                    value={slideForm.button_text}
                    onChange={e => setSlideForm({ ...slideForm, button_text: e.target.value })}
                    className="admin-input-field"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>বাটন লিংক (URL)</label>
                  <input
                    type="text"
                    placeholder="#shop অথবা /offers অথবা /shop"
                    value={slideForm.button_link}
                    onChange={e => setSlideForm({ ...slideForm, button_link: e.target.value })}
                    className="admin-input-field"
                  />
                </div>

                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>নির্দিষ্ট পণ্যের সাথে লিংক (ঐচ্ছিক)</label>
                  <select
                    value={slideForm.product}
                    onChange={e => {
                      const val = e.target.value;
                      const selectedProd = products.find(p => String(p.id) === val);
                      setSlideForm({
                        ...slideForm,
                        product: val ? Number(val) : "",
                        button_link: selectedProd ? `/products/${selectedProd.slug}` : slideForm.button_link,
                      });
                    }}
                    className="admin-input-field"
                  >
                    <option value="">-- কোনো পণ্য লিংক নেই --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (৳{p.price})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", alignItems: "center" }}>
                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>ক্রম / পজিশন (Position)</label>
                  <input
                    type="number"
                    value={slideForm.position}
                    onChange={e => setSlideForm({ ...slideForm, position: parseInt(e.target.value) || 0 })}
                    className="admin-input-field"
                  />
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: "#1e293b", fontWeight: 600, marginTop: "18px" }}>
                  <input
                    type="checkbox"
                    checked={slideForm.is_active}
                    onChange={e => setSlideForm({ ...slideForm, is_active: e.target.checked })}
                  />
                  স্লাইডটি এখনই সক্রিয় (Active) রাখুন
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "14px", borderTop: "1px solid #e2e8f0" }}>
                <button
                  type="button"
                  onClick={() => setShowSlideModal(false)}
                  className="admin-header-link"
                  style={{ padding: "8px 16px" }}
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  disabled={slideSubmitting}
                  className="admin-submit-btn"
                  style={{ width: "auto", padding: "8px 24px", marginTop: 0 }}
                >
                  {slideSubmitting ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Create Coupon Modal */}
      {showCouponModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="admin-login-card" style={{ maxWidth: "480px", width: "100%", padding: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Tag size={18} style={{ color: "#2563eb" }} />
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: 0 }}>Create Promo Coupon</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCouponModal(false)}
                style={{ background: "none", border: "none", fontSize: "18px", color: "#64748b", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="admin-form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER20, ALORCHOYA"
                  value={couponForm.code}
                  onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  className="admin-input-field"
                  style={{ textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>Discount Type</label>
                  <select
                    value={couponForm.discount_type}
                    onChange={e => setCouponForm({ ...couponForm, discount_type: e.target.value as "percent" | "fixed" })}
                    className="admin-input-field"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (৳)</option>
                  </select>
                </div>

                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>
                    {couponForm.discount_type === "percent" ? "Percentage Off (%)" : "Fixed Amount (৳)"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder={couponForm.discount_type === "percent" ? "e.g. 15" : "e.g. 100"}
                    value={couponForm.value}
                    onChange={e => setCouponForm({ ...couponForm, value: e.target.value })}
                    className="admin-input-field"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>Min Order (৳)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={couponForm.min_order}
                    onChange={e => setCouponForm({ ...couponForm, min_order: e.target.value })}
                    className="admin-input-field"
                  />
                </div>

                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>Max Uses (Optional)</label>
                  <input
                    type="number"
                    placeholder="Unlimited"
                    value={couponForm.max_uses}
                    onChange={e => setCouponForm({ ...couponForm, max_uses: e.target.value })}
                    className="admin-input-field"
                  />
                </div>
              </div>

              <div className="admin-form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>Expiration Date (Optional)</label>
                <input
                  type="date"
                  value={couponForm.expires_at}
                  onChange={e => setCouponForm({ ...couponForm, expires_at: e.target.value })}
                  className="admin-input-field"
                />
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: "#1e293b", fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={couponForm.is_active}
                  onChange={e => setCouponForm({ ...couponForm, is_active: e.target.checked })}
                />
                Active immediately upon creation
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "14px", borderTop: "1px solid #e2e8f0" }}>
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="admin-header-link"
                  style={{ padding: "8px 16px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={couponSubmitting}
                  className="admin-submit-btn"
                  style={{ width: "auto", padding: "8px 20px", marginTop: 0 }}
                >
                  {couponSubmitting ? "Creating..." : "Save Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Courier Booking Modal */}
      {courierBookingModalOpen && bookingOrder && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="admin-login-card" style={{ maxWidth: "520px", width: "100%", padding: "28px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Truck size={20} style={{ color: "#2563eb" }} />
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Book Courier Consignment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCourierBookingModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: "18px", color: "#64748b", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitBooking} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "13px" }}>
                <strong>Order #{bookingOrder.id}</strong> • Total Items: <strong>{bookingOrder.items?.length || 0}</strong> • Order Value: <strong>৳{bookingOrder.total}</strong>
              </div>

              {/* Provider Choice */}
              <div className="admin-form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>Select Courier Provider</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "6px" }}>
                  <button
                    type="button"
                    onClick={() => setBookingProvider("steadfast")}
                    style={{
                      padding: "10px",
                      borderRadius: "10px",
                      border: "2px solid",
                      borderColor: bookingProvider === "steadfast" ? "#2563eb" : "#e2e8f0",
                      background: bookingProvider === "steadfast" ? "#eff6ff" : "#ffffff",
                      fontWeight: 800,
                      color: bookingProvider === "steadfast" ? "#1d4ed8" : "#475569",
                      cursor: "pointer"
                    }}
                  >
                    SteadFast Courier
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingProvider("pathao")}
                    style={{
                      padding: "10px",
                      borderRadius: "10px",
                      border: "2px solid",
                      borderColor: bookingProvider === "pathao" ? "#2563eb" : "#e2e8f0",
                      background: bookingProvider === "pathao" ? "#eff6ff" : "#ffffff",
                      fontWeight: 800,
                      color: bookingProvider === "pathao" ? "#1d4ed8" : "#475569",
                      cursor: "pointer"
                    }}
                  >
                    Pathao Courier
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>Recipient Name</label>
                  <input
                    type="text"
                    required
                    value={bookingRecipientName}
                    onChange={e => setBookingRecipientName(e.target.value)}
                    className="admin-input-field"
                  />
                </div>
                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>Recipient Phone</label>
                  <input
                    type="text"
                    required
                    value={bookingRecipientPhone}
                    onChange={e => setBookingRecipientPhone(e.target.value)}
                    className="admin-input-field"
                  />
                </div>
              </div>

              <div className="admin-form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>Delivery Address</label>
                <textarea
                  required
                  rows={2}
                  value={bookingRecipientAddress}
                  onChange={e => setBookingRecipientAddress(e.target.value)}
                  className="admin-input-field"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>COD Amount to Collect (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={bookingCodAmount}
                    onChange={e => setBookingCodAmount(e.target.value)}
                    className="admin-input-field"
                  />
                </div>
                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={bookingWeight}
                    onChange={e => setBookingWeight(e.target.value)}
                    className="admin-input-field"
                  />
                </div>
              </div>

              <div className="admin-form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>Instructions / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Fragile, Handle with care"
                  value={bookingNote}
                  onChange={e => setBookingNote(e.target.value)}
                  className="admin-input-field"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
                <button
                  type="button"
                  onClick={() => setCourierBookingModalOpen(false)}
                  className="admin-header-link"
                  style={{ padding: "8px 16px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBooking}
                  className="admin-submit-btn"
                  style={{ width: "auto", padding: "8px 24px", marginTop: 0 }}
                >
                  {isSubmittingBooking ? "Dispatching..." : "Confirm & Book Consignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Courier Live Tracking Modal */}
      {courierTrackingModalOpen && trackingOrder && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="admin-login-card" style={{ maxWidth: "480px", width: "100%", padding: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Truck size={20} style={{ color: "#2563eb" }} />
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    Live Courier Tracking
                  </h3>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>Order #{trackingOrder.id} • {(trackingOrder.courier_provider || "courier").toUpperCase()}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCourierTrackingModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: "18px", color: "#64748b", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {loadingTracking ? (
              <div style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 10px" }} />
                <div>Fetching live delivery status from courier...</div>
              </div>
            ) : trackingDetails ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Consignment ID</span>
                    <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#0f172a" }}>{trackingDetails.consignment_id}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Tracking Code</span>
                    <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#2563eb" }}>{trackingDetails.tracking_code || trackingDetails.consignment_id}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Delivery Status</span>
                    <span className="admin-badge delivered" style={{ textTransform: "uppercase" }}>
                      {trackingDetails.delivery_status || "In Review"}
                    </span>
                  </div>
                </div>

                {trackingDetails.events && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "#334155" }}>Delivery Timeline:</div>
                    {trackingDetails.events.map((ev: any, idx: number) => (
                      <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "12px" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2563eb", marginTop: "4px", flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>{ev.status_label}</div>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>{ev.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setCourierTrackingModalOpen(false)}
                  className="admin-btn-secondary"
                  style={{ width: "100%", justifyContent: "center", padding: "10px", marginTop: "8px" }}
                >
                  Close
                </button>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "24px", color: "#ef4444" }}>
                Unable to load tracking details.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
