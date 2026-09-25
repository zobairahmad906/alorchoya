"use client";

import React, { useState, useEffect, useRef } from "react";
import { MarkdownPreview } from "../markdown";
import Link from "next/link";
import { Header } from "../components";

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
  address: string;
  delivery_charge: string;
  discount_amount: string;
  created_at: string;
  total: number;
  items: OrderItem[];
};

type Product = {
  id: number;
  name: string;
  description: string;
  slug: string;
  price: string;
  discount_price?: string | null;
  stock: number;
  is_featured?: boolean;
  is_active?: boolean;
  category: { id?: number; name: string };
  images: { id: number; image: string; alt_text?: string; is_primary?: boolean }[];
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
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "products" | "customers">("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState("");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("");
  const [orderSearch, setOrderSearch] = useState<string>("");

  type CategoryItem = { id: number; name: string; slug: string };

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("");

  // Product modal / editing state
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
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

  const customersList = React.useMemo(() => {
    const map = new Map<string, { customer_name: string; address: string; total_orders: number; total_spent: number; last_order_date: string }>();
    orders.forEach((ord) => {
      const key = ord.customer_name ? ord.customer_name.trim() : `Customer #${ord.id}`;
      if (!map.has(key)) {
        map.set(key, {
          customer_name: key,
          address: ord.address || "N/A",
          total_orders: 1,
          total_spent: ord.total,
          last_order_date: ord.created_at,
        });
      } else {
        const item = map.get(key)!;
        item.total_orders += 1;
        item.total_spent += ord.total;
        if (new Date(ord.created_at) > new Date(item.last_order_date)) {
          item.last_order_date = ord.created_at;
        }
      }
    });
    return Array.from(map.values());
  }, [orders]);

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
        setError("আপনার অ্যাডমিন পারমিশন নেই। দয়া করে অ্যাকাউন্ট দিয়ে লগইন করুন।");
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
    } catch (err) {
      console.error(err);
      setError("ডেটা লোড করতে সমস্যা হয়েছে। সার্ভার স্ট্যাটাস চেক করুন।");
    } finally {
      setLoading(false);
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
      alert("স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।");
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!editingProduct?.id;
      const url = isEdit ? getApiUrl("/admin/products/" + editingProduct.id + "/") : getApiUrl("/admin/products/");
      const res = await fetch(url, { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json", ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}) }, credentials: "include", body: JSON.stringify(productForm) });
      const savedProduct = await res.json().catch(() => ({}));
      if (!res.ok) { alert(savedProduct.error || savedProduct.detail || "পণ্য সংরক্ষণ করা সম্ভব হয়নি।"); return; }
      if (imageFile && savedProduct.id) {
        const uploadData = new FormData();
        uploadData.append("images", imageFile);
        const uploadRes = await fetch(getApiUrl("/products/" + savedProduct.id + "/upload-images/"), { method: "POST", headers: csrfToken ? { "X-CSRFToken": csrfToken } : {}, credentials: "include", body: uploadData });
        if (!uploadRes.ok) { alert("পণ্য সংরক্ষণ হয়েছে, কিন্তু image upload হয়নি।"); }
      }
      setShowProductModal(false); setEditingProduct(null); setImageFile(null); setDescriptionMode("write"); fetchDashboardData();
    } catch (err) { alert("ত্রুটি ঘটেছে। আবার চেষ্টা করুন।"); }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই পণ্যটি মুছে ফেলতে চান?")) return;
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
      alert("মুছে ফেলা সম্ভব হয়নি।");
    }
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      slug: p.slug,
      description: p.description || "",
      image_alt: p.images?.[0]?.alt_text || "",
      image_primary: p.images?.[0]?.is_primary ?? true,
      price: p.price,
      discount_price: p.discount_price || "",
      stock: p.stock,
      category_id: p.category?.id || (categories[0]?.id || 1),
      image_url: "",
      is_featured: p.is_featured || false,
      is_active: p.is_active !== false
    });
    setImageFile(null);
    setDescriptionMode("write");
    setShowProductModal(true);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      slug: "",
      description: "",
      image_alt: "",
      image_primary: true,
      price: "",
      discount_price: "",
      stock: 10,
      category_id: categories[0]?.id || 1,
      image_url: "",
      is_featured: false,
      is_active: true
    });
    setImageFile(null);
    setDescriptionMode("write");
    setShowProductModal(true);
  };

  const insertMarkdown = (before: string, after = "", placeholder = "লিখুন") => {
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
        setLoginError(data.error || "লগইন ব্যর্থ হয়েছে। তথ্য আবার চেক করুন।");
      }
    } catch (err) {
      setLoginError("সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি।");
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
            <h2 className="admin-login-title">অ্যাডমিন পোর্টাল লগইন</h2>
            <p className="admin-login-subtitle">
              ড্যাশবোর্ডে প্রবেশ করতে আপনার Admin/Superuser অ্যাকাউন্টের ইউজারনেম ও পাসওয়ার্ড দিন।
            </p>

            {loginError && (
              <div className="admin-error-banner">
                ⚠️ {loginError}
              </div>
            )}

            <a className="google-btn" href={getApiUrl("/auth/google/start/?next=/dashboard")} style={{ display: "flex", justifyContent: "center", marginBottom: "16px", textDecoration: "none" }}>
              <span className="google-mark">G</span> Google account দিয়ে প্রবেশ করুন
            </a>
            <div style={{ textAlign: "center", color: "#64748b", fontSize: "12px", marginBottom: "14px" }}>অথবা Admin username/password ব্যবহার করুন</div>
            <form onSubmit={handleAdminLogin}>
              <div className="admin-form-group">
                <label>ইউজারনেম বা ইমেইল</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: zobair"
                  value={loginUsername}
                  onChange={e => setLoginUsername(e.target.value)}
                  className="admin-input-field"
                />
              </div>

              <div className="admin-form-group">
                <label>পাসওয়ার্ড</label>
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
                {isSubmittingLogin ? "লগইন হচ্ছে..." : "প্রবেশ করুন ➔"}
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
    return (
      (o.id ? o.id.toString().includes(orderSearch) : false) ||
      (o.customer_name ? o.customer_name.toLowerCase().includes(orderSearch.toLowerCase()) : false) ||
      (o.address ? o.address.toLowerCase().includes(orderSearch.toLowerCase()) : false)
    );
  });

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !productSearch ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.slug.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCat =
      !productCategoryFilter ||
      (p.category?.id && p.category.id.toString() === productCategoryFilter);
    return matchesSearch && matchesCat;
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
          <title>ইনভয়েস মেমো #${order.id} - আলোছায়া</title>
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
              <h1 class="brand">আলোছায়া (Alorchoya)</h1>
              <div class="tagline">বুকস & ক্রাফট শপ | আলোর সাথে পথচলা</div>
            </div>
            <div>
              <h2 class="inv-title">ক্যাশ মেমো / ইনভয়েস</h2>
              <div class="inv-meta">অর্ডার নং: <strong>#${order.id}</strong></div>
              <div class="inv-meta">তারিখ: ${new Date(order.created_at).toLocaleDateString("bn-BD")}</div>
            </div>
          </div>

          <div class="box-grid">
            <div>
              <strong style="color: #64748b; font-size: 12px; text-transform: uppercase;">গ্রাহকের তথ্য:</strong>
              <div style="font-size: 16px; font-weight: 700; color: #173f35; margin-top: 4px;">${order.customer_name}</div>
              <div>${order.address}</div>
            </div>
            <div style="text-align: right;">
              <strong style="color: #64748b; font-size: 12px; text-transform: uppercase;">পেমেন্ট বিবরণ:</strong>
              <div style="font-size: 14px; font-weight: 700; color: #10b981; margin-top: 4px;">মেথড: ${order.payment_method.toUpperCase()}</div>
              <div>স্ট্যাটাস: ${order.status_display || order.status}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>আইটেমের বিবরণ</th>
                <th style="text-align: center;">পরিমাণ</th>
                <th style="text-align: right;">একক মূল্য</th>
                <th style="text-align: right;">মোট</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals">
            <div>ডেলিভারি চার্জ: ৳${order.delivery_charge}</div>
            <div>ডিসকাউন্ট: -৳${order.discount_amount}</div>
            <div class="grand-total">সর্বমোট প্রদেয়: ৳${order.total}</div>
          </div>

          <div class="footer">
            ধন্যবাদ আপনার কেনাকাটার জন্য! আলোছায়া - support@alorchoya.com
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
      <Header />
      <div className="admin-dashboard-container">
        <div className="admin-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="admin-header-title" style={{ fontSize: "18px" }}>
              👑 অ্যাডমিন কন্ট্রোল প্যানেল
            </span>
            <span className="admin-header-badge">
              Store Management Active
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <a
              href={getApiUrl("/admin/")}
              target="_blank"
              rel="noreferrer"
              className="admin-header-link"
            >
              Django Backend ↗
            </a>
          </div>
        </div>

        {/* Main Container */}
        <div className="admin-body">
        
        {/* Navigation Tabs */}
        <div className="admin-tabs-nav">
          <button
            onClick={() => setActiveTab("overview")}
            className={`admin-tab-btn ${activeTab === "overview" ? "active" : ""}`}
          >
            📊 ড্যাশবোর্ড ওভারভিউ
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`admin-tab-btn ${activeTab === "orders" ? "active" : ""}`}
          >
            📦 অর্ডার ম্যানেজমেন্ট
            {stats && stats.pending_orders > 0 && (
              <span style={{ marginLeft: "8px", backgroundColor: "#f59e0b", color: "#0f172a", fontSize: "11px", padding: "2px 8px", borderRadius: "9999px", fontWeight: 800 }}>
                {stats.pending_orders}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`admin-tab-btn ${activeTab === "products" ? "active" : ""}`}
          >
            🛍️ প্রোডাক্ট & স্টক কন্ট্রোল
          </button>
          <button
            onClick={() => setActiveTab("customers")}
            className={`admin-tab-btn ${activeTab === "customers" ? "active" : ""}`}
          >
            👥 গ্রাহক তালিকা ({customersList.length})
          </button>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && stats && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* KPI Cards Grid */}
            <div className="admin-kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
              <div className="admin-kpi-card">
                <div className="admin-kpi-title">মোট বিক্রয় (Revenue)</div>
                <div className="admin-kpi-val emerald">৳{stats.total_revenue.toLocaleString()}</div>
                <div className="admin-kpi-sub" style={{ color: "#64748b" }}>গত ৩০ দিনে: ৳{stats.monthly_revenue.toLocaleString()}</div>
              </div>

              <div className="admin-kpi-card">
                <div className="admin-kpi-title">গড় অর্ডার মান (AOV)</div>
                <div className="admin-kpi-val" style={{ color: "var(--forest)" }}>৳{stats.avg_order_value || 0}</div>
                <div className="admin-kpi-sub" style={{ color: "#64748b" }}>প্রতি অর্ডারে গড় খরচ</div>
              </div>

              <div className="admin-kpi-card">
                <div className="admin-kpi-title">মোট অর্ডার</div>
                <div className="admin-kpi-val">{stats.total_orders} টি</div>
                <div className="admin-kpi-sub" style={{ color: "#fbbf24" }}>পেন্ডিং: {stats.pending_orders} টি | ডেলিভার্ড: {stats.delivered_orders} টি</div>
              </div>

              <div className="admin-kpi-card">
                <div className="admin-kpi-title">মোট গ্রাহক</div>
                <div className="admin-kpi-val" style={{ color: "var(--forest)" }}>{stats.unique_customers || customersList.length} জন</div>
                <div className="admin-kpi-sub" style={{ color: "var(--emerald)" }}>ইউনিক গ্রাহক ডিরেক্টরি</div>
              </div>

              <div className="admin-kpi-card">
                <div className="admin-kpi-title">পণ্য স্টক স্ট্যাটাস</div>
                <div className="admin-kpi-val">{stats.total_products} টি প্রোডাক্ট</div>
                <div className="admin-kpi-sub" style={{ color: "#fb7185" }}>স্টক শেষ: {stats.out_of_stock_products} টি | কম স্টক: {stats.low_stock_products} টি</div>
              </div>

              <div className="admin-kpi-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div className="admin-kpi-title">কুইক অ্যাকশন</div>
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <button onClick={openCreateModal} className="admin-tab-btn active" style={{ flex: 1, fontSize: "12px", padding: "8px" }}>
                    + নতুন প্রোডাক্ট
                  </button>
                  <button onClick={() => setActiveTab("orders")} className="admin-header-link" style={{ flex: 1, fontSize: "12px", textAlign: "center" }}>
                    অর্ডার লিস্ট ➔
                  </button>
                </div>
              </div>
            </div>

            {/* Sales Chart & Top Selling Products Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "24px" }}>
              {/* Daily Sales Bar Chart */}
              <div className="admin-panel">
                <h3 style={{ fontFamily: "'Tiro Bangla', serif", fontSize: "20px", color: "var(--forest)", margin: "0 0 20px" }}>
                  📈 গত ৭ দিনের বিক্রয় চিত্র (Sales Trend)
                </h3>
                <div style={{ height: "200px", display: "flex", alignItems: "flex-end", gap: "16px", paddingTop: "16px", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
                  {stats.daily_sales.map((day, idx) => {
                    const maxRev = Math.max(...stats.daily_sales.map(d => d.revenue), 1000);
                    const heightPercent = Math.max((day.revenue / maxRev) * 100, 8);
                    return (
                      <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                        <div
                          style={{ height: `${heightPercent}%`, width: "100%", background: "linear-gradient(180deg, var(--emerald), var(--forest))", borderRadius: "6px 6px 0 0" }}
                        ></div>
                        <span style={{ fontSize: "12px", color: "var(--coffee)", fontWeight: 600 }}>{day.date}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Selling Products */}
              <div className="admin-panel">
                <h3 style={{ fontFamily: "'Tiro Bangla', serif", fontSize: "20px", color: "var(--forest)", margin: "0 0 16px" }}>
                  🔥 সেরা বিক্রিত বই/পণ্য
                </h3>
                {stats.top_products && stats.top_products.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {stats.top_products.map((item, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "var(--ivory)", borderRadius: "8px", border: "1px solid var(--line)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontWeight: 800, color: "var(--emerald)", fontSize: "14px" }}>#{idx + 1}</span>
                          <span style={{ fontWeight: 600, fontSize: "13px", color: "var(--forest)" }}>{item.name}</span>
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--coffee)", background: "var(--cream)", padding: "2px 8px", borderRadius: "6px" }}>
                          {item.sold} টি বিক্রি
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: "var(--coffee)", fontSize: "13px", textAlign: "center", paddingTop: "30px" }}>
                    এখনো অর্ডার সম্বলিত তথ্য পাওয়া যায়নি।
                  </div>
                )}
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div className="admin-panel">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <h3 style={{ fontFamily: "'Tiro Bangla', serif", fontSize: "20px", color: "var(--forest)", margin: 0 }}>🚀 সর্বশেষ ১০টি অর্ডার</h3>
                <button onClick={() => setActiveTab("orders")} className="admin-header-link" style={{ fontSize: "12px" }}>
                  সব অর্ডার দেখুন ➔
                </button>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>অর্ডার আইডি</th>
                      <th>গ্রাহকের নাম</th>
                      <th>তারিখ</th>
                      <th>মোট টাকা</th>
                      <th>স্ট্যাটাস</th>
                      <th style={{ textAlign: "right" }}>অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent_orders.map(order => (
                      <tr key={order.id}>
                        <td style={{ fontWeight: 700, color: "var(--forest)" }}>#{order.id}</td>
                        <td style={{ fontWeight: 600 }}>{order.customer_name}</td>
                        <td style={{ color: "var(--coffee)", fontSize: "13px" }}>{new Date(order.created_at).toLocaleDateString("bn-BD")}</td>
                        <td style={{ fontWeight: 700, color: "var(--forest)" }}>৳{order.total}</td>
                        <td>
                          <span className={`admin-badge ${order.status}`}>
                            {order.status_display || order.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            onClick={() => { setSelectedOrder(order); setActiveTab("orders"); }}
                            className="admin-header-link"
                            style={{ padding: "4px 12px", fontSize: "12px" }}
                          >
                            বিস্তারিত
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

        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <div style={{ display: "grid", gridTemplateColumns: selectedOrder ? "1fr 1.5fr" : "1fr", gap: "24px" }}>
            {/* Orders List Column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Filters */}
              <div className="admin-panel" style={{ padding: "16px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
                <input
                  type="text"
                  placeholder="অর্ডার আইডি, নাম বা ফোন নম্বর দিয়ে খুঁজুন..."
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  className="admin-input-field"
                  style={{ flex: 1, minWidth: "200px" }}
                />
                <select
                  value={orderStatusFilter}
                  onChange={e => setOrderStatusFilter(e.target.value)}
                  className="admin-input-field"
                  style={{ width: "auto" }}
                >
                  <option value="">সকল স্ট্যাটাস</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {filteredOrders.length === 0 ? (
                  <div className="admin-panel" style={{ textAlign: "center", color: "var(--coffee)", padding: "32px" }}>
                    কোনো অর্ডার পাওয়া যায়নি।
                  </div>
                ) : (
                  filteredOrders.map(order => (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="admin-panel"
                      style={{
                        padding: "16px 20px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderColor: selectedOrder?.id === order.id ? "var(--forest)" : "var(--line)",
                        background: selectedOrder?.id === order.id ? "var(--cream)" : "#ffffff"
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: 800, color: "var(--forest)" }}>#{order.id}</span>
                          <span style={{ fontWeight: 600, color: "var(--ink)" }}>{order.customer_name}</span>
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--coffee)", marginTop: "4px" }}>
                          {new Date(order.created_at).toLocaleString("bn-BD")}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 800, color: "var(--forest)", fontSize: "16px" }}>৳{order.total}</div>
                        <span className={`admin-badge ${order.status}`} style={{ marginTop: "4px" }}>
                          {order.status_display || order.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Selected Order Detailed Drawer View */}
            {selectedOrder && (
              <div className="admin-panel" style={{ position: "sticky", top: "80px", alignSelf: "flex-start", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: "12px" }}>
                  <div>
                    <h3 style={{ fontFamily: "'Tiro Bangla', serif", fontSize: "20px", color: "var(--forest)", margin: 0 }}>
                      অর্ডার বিস্তারিত <span style={{ color: "var(--emerald)" }}>#{selectedOrder.id}</span>
                    </h3>
                    <p style={{ fontSize: "12px", color: "var(--coffee)", margin: "4px 0 0" }}>
                      তারিখ: {new Date(selectedOrder.created_at).toLocaleString("bn-BD")}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handlePrintInvoice(selectedOrder)}
                      className="admin-tab-btn active"
                      style={{ padding: "4px 12px", fontSize: "12px", marginTop: 0 }}
                    >
                      📄 প্রিন্ট মেমো / ইনভয়েস
                    </button>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="admin-header-link"
                      style={{ padding: "4px 12px" }}
                    >
                      বন্ধ করুন ✕
                    </button>
                  </div>
                </div>

                {/* Status Updater */}
                <div style={{ background: "var(--cream)", padding: "14px", borderRadius: "12px", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--forest)" }}>স্ট্যাটাস পরিবর্তন করুন:</span>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {["pending", "confirmed", "shipped", "delivered", "cancelled"].map(st => (
                      <button
                        key={st}
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, st)}
                        className={`admin-tab-btn ${selectedOrder.status === st ? "active" : ""}`}
                        style={{ padding: "5px 12px", fontSize: "12px", textTransform: "capitalize" }}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Customer Details */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "var(--ivory)", padding: "16px", borderRadius: "12px", border: "1px solid var(--line)", fontSize: "13px" }}>
                  <div>
                    <div style={{ color: "var(--coffee)", fontWeight: 700, marginBottom: "4px" }}>গ্রাহকের ঠিকানা & নাম</div>
                    <div style={{ fontWeight: 700, color: "var(--forest)" }}>{selectedOrder.customer_name}</div>
                    <div style={{ color: "var(--ink)", marginTop: "4px" }}>{selectedOrder.address}</div>
                  </div>
                  <div>
                    <div style={{ color: "var(--coffee)", fontWeight: 700, marginBottom: "4px" }}>পেমেন্ট & ডেলিভারি</div>
                    <div style={{ color: "var(--ink)" }}>মেথড: <span style={{ fontWeight: 700, color: "var(--forest)", textTransform: "uppercase" }}>{selectedOrder.payment_method}</span></div>
                    <div style={{ color: "var(--ink)", marginTop: "4px" }}>ডেলিভারি চার্জ: ৳{selectedOrder.delivery_charge}</div>
                    <div style={{ color: "var(--ink)", marginTop: "2px" }}>ডিসকাউন্ট: ৳{selectedOrder.discount_amount}</div>
                  </div>
                </div>

                {/* Ordered Items */}
                <div>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--coffee)", marginBottom: "12px", textTransform: "uppercase" }}>অর্ডারকৃত আইটেমসমূহ</h4>
                  <div style={{ borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
                    {selectedOrder.items.map(item => (
                      <div key={item.id} style={{ padding: "12px 0", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "13px", borderBottom: "1px solid var(--cream)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          {item.product_image && (
                            <img src={item.product_image} alt={item.product_name} style={{ width: "42px", height: "42px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--line)" }} />
                          )}
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--forest)" }}>{item.product_name}</div>
                            <div style={{ color: "var(--coffee)", fontSize: "12px" }}>পরিমাণ: {item.quantity} x ৳{item.unit_price}</div>
                          </div>
                        </div>
                        <div style={{ fontWeight: 800, color: "var(--forest)" }}>
                          ৳{parseFloat(item.unit_price) * item.quantity}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "16px", fontWeight: 800, color: "var(--forest)", paddingTop: "8px" }}>
                  <span>সর্বমোট প্রদেয়:</span>
                  <span style={{ fontSize: "22px", fontFamily: "'Tiro Bangla', serif" }}>৳{selectedOrder.total}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PRODUCTS & STOCK TAB */}
        {activeTab === "products" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontFamily: "'Tiro Bangla', serif", fontSize: "22px", color: "var(--forest)", margin: 0 }}>পণ্য তালিকা & ইনভেন্টরি ক্যাটালগ</h3>
              <button
                onClick={openCreateModal}
                className="admin-submit-btn"
                style={{ width: "auto", padding: "10px 20px", marginTop: 0 }}
              >
                + নতুন পণ্য যোগ করুন
              </button>
            </div>

            {/* Filter Bar */}
            <div className="admin-panel" style={{ padding: "16px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
              <input
                type="text"
                placeholder="পণ্যের নাম বা স্ল্যাগ দিয়ে খুঁজুন..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                className="admin-input-field"
                style={{ flex: 1, minWidth: "220px" }}
              />
              <select
                value={productCategoryFilter}
                onChange={e => setProductCategoryFilter(e.target.value)}
                className="admin-input-field"
                style={{ width: "auto" }}
              >
                <option value="">সকল ক্যাটাগরি</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <span className="admin-badge pending" style={{ fontSize: "12px", marginLeft: "auto" }}>
                মোট {filteredProducts.length} টি পণ্য
              </span>
            </div>

            <div className="admin-panel" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>পণ্য</th>
                      <th>ক্যাটাগরি</th>
                      <th>মূল্য</th>
                      <th>ডিসকাউন্ট</th>
                      <th>স্টক (Stock)</th>
                      <th>স্ট্যাটাস</th>
                      <th style={{ textAlign: "right" }}>অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "var(--coffee)" }}>
                          কোনো পণ্য পাওয়া যায়নি।
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
                              <div>{product.name}</div>
                              <div style={{ fontSize: "11px", color: "var(--coffee)", fontWeight: 400 }}>/products/{product.slug}</div>
                            </div>
                          </td>
                          <td style={{ color: "var(--ink)" }}>{product.category?.name || "N/A"}</td>
                          <td style={{ fontWeight: 700, color: "var(--forest)" }}>৳{product.price}</td>
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
                                {product.stock} টি
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
                              এডিট
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="admin-header-link"
                              style={{ padding: "4px 12px", fontSize: "12px", background: "rgba(225,29,72,0.1)", color: "#e11d48", borderColor: "rgba(225,29,72,0.3)" }}
                            >
                              ডিলিট
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

        {/* CUSTOMERS TAB */}
        {activeTab === "customers" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="admin-panel" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontFamily: "'Tiro Bangla', serif", fontSize: "22px", color: "var(--forest)", margin: 0 }}>👥 কাস্টমার ডিরেক্টরি & অর্ডার হিস্ট্রি</h3>
              <span className="admin-badge pending" style={{ fontSize: "13px" }}>{customersList.length} জন কাস্টমার ডিরেক্টরি</span>
            </div>

            <div className="admin-panel" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>কাস্টমারের নাম</th>
                      <th>ঠিকানা / অবস্থান</th>
                      <th>মোট অর্ডার সংখ্যা</th>
                      <th>মোট ক্রয় মান (Total Spent)</th>
                      <th>সর্বশেষ অর্ডারের তারিখ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customersList.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "var(--coffee)" }}>
                          কোনো কাস্টমার ডেটা পাওয়া যায়নি।
                        </td>
                      </tr>
                    ) : (
                      customersList.map((c, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 700, color: "var(--forest)" }}>{c.customer_name}</td>
                          <td style={{ color: "var(--ink)" }}>{c.address}</td>
                          <td style={{ fontWeight: 700 }}>
                            <span className="admin-badge delivered" style={{ background: "rgba(16,185,129,0.1)", color: "var(--forest)" }}>
                              {c.total_orders} টি অর্ডার
                            </span>
                          </td>
                          <td style={{ fontWeight: 800, color: "var(--emerald)" }}>৳{c.total_spent}</td>
                          <td style={{ color: "var(--coffee)", fontSize: "13px" }}>{new Date(c.last_order_date).toLocaleDateString("bn-BD")}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Add/Edit Modal */}
      {showProductModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(23,63,53,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="admin-login-card" style={{ maxWidth: "560px", padding: "32px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: "12px", marginBottom: "20px" }}>
              <h3 style={{ fontFamily: "'Tiro Bangla', serif", fontSize: "22px", color: "var(--forest)", margin: 0 }}>
                {editingProduct ? "পণ্য এডিট করুন" : "নতুন পণ্য যোগ করুন"}
              </h3>
              <button onClick={() => setShowProductModal(false)} style={{ background: "none", border: "none", fontSize: "18px", color: "var(--coffee)", cursor: "pointer" }}>✕</button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="admin-form-group" style={{ margin: 0 }}>
                <label>পণ্যের নাম</label>
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
                  <label>পণ্যের Slug</label>
                  <input type="text" required value={productForm.slug} onChange={e => setProductForm({ ...productForm, slug: e.target.value })} className="admin-input-field" placeholder="product-slug" />
                </div>
                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label>ছবির Alt text</label>
                  <input type="text" value={productForm.image_alt} onChange={e => setProductForm({ ...productForm, image_alt: e.target.value })} className="admin-input-field" placeholder="পণ্যের ছবির বর্ণনা" />
                </div>
              </div>

              <div className="admin-form-group" style={{ margin: 0 }}>
                <label>ডিভাইস থেকে ছবি নির্বাচন করুন</label>
                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="admin-input-field" />
                {imageFile && <small style={{ color: "var(--emerald)" }}>নির্বাচিত: {imageFile.name}</small>}
                <small style={{ color: "var(--coffee)", fontSize: "11px" }}>ছবি save করার পর product gallery-তে upload হবে</small>
              </div>
              <div className="admin-form-group" style={{ margin: 0 }}>
                <label>অথবা Image URL</label>
                <input type="url" placeholder="https://example.com/image.jpg" value={productForm.image_url} onChange={e => setProductForm({ ...productForm, image_url: e.target.value })} className="admin-input-field" />
              </div>

              <div className="admin-form-group markdown-editor" style={{ margin: 0 }}>
                <label>পণ্যের বিস্তারিত বিবরণ (Markdown)</label>
                <div className="markdown-tabs"><button type="button" className={descriptionMode === "write" ? "active" : ""} onClick={() => setDescriptionMode("write")}>Write</button><button type="button" className={descriptionMode === "preview" ? "active" : ""} onClick={() => setDescriptionMode("preview")}>Preview</button></div>
                {descriptionMode === "write" ? <><div className="markdown-toolbar"><button type="button" onClick={() => insertMarkdown("# ", "", "শিরোনাম")}>H1</button><button type="button" onClick={() => insertMarkdown("**", "**", "গুরুত্বপূর্ণ লেখা")}>B</button><button type="button" onClick={() => insertMarkdown("*", "*", "ইটালিক লেখা")}>I</button><button type="button" onClick={() => insertMarkdown("- ", "", "তালিকার বিষয়")}>• List</button><button type="button" onClick={() => insertMarkdown("> ", "", "উদ্ধৃতি")}>Quote</button></div><textarea ref={descriptionRef} rows={8} value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} className="admin-input-field markdown-textarea" placeholder="# পণ্যের বৈশিষ্ট্য

- কাঠের তৈরি
- সহজে ব্যবহারযোগ্য

**বিশেষ দ্রষ্টব্য:** যত্নসহকারে ব্যবহার করুন।" /></> : <MarkdownPreview value={productForm.description} className="markdown-editor-preview" />}
                <small style={{ color: "var(--coffee)", fontSize: "11px" }}>Markdown ব্যবহার করুন: # heading, **bold**, *italic*, - list, &gt; quote</small>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label>মূল্য (৳)</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                    className="admin-input-field"
                  />
                </div>
                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label>ডিসকাউন্ট মূল্য (ঐচ্ছিক)</label>
                  <input
                    type="number"
                    min="0"
                    max={productForm.price || undefined}
                    value={productForm.discount_price}
                    onChange={e => setProductForm({ ...productForm, discount_price: e.target.value })}
                    className="admin-input-field"
                  />
                  <small style={{ color: "var(--coffee)", fontSize: "11px" }}>খালি রাখলে discount থাকবে না</small>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label>স্টক (পরিমাণ)</label>
                  <input
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={e => setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })}
                    className="admin-input-field"
                  />
                </div>
                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label>ক্যাটাগরি</label>
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
                  প্রধান ছবি হিসেবে ব্যবহার
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", color: "var(--forest)", fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={productForm.is_featured}
                    onChange={e => setProductForm({ ...productForm, is_featured: e.target.checked })}
                  />
                  ফিচার্ড প্রোডাক্ট
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", color: "var(--forest)", fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={productForm.is_active}
                    onChange={e => setProductForm({ ...productForm, is_active: e.target.checked })}
                  />
                  পাবলিশড (Active)
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "16px", borderTop: "1px solid var(--line)" }}>
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="admin-header-link"
                  style={{ padding: "10px 20px" }}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="admin-submit-btn"
                  style={{ width: "auto", padding: "10px 24px", marginTop: 0 }}
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
