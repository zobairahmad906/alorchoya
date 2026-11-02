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
} from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "products" | "gallery" | "customers">("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
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
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data. Please check server status.");
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
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && stats && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* KPI Cards Grid */}
            <div className="admin-kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
              <div className="admin-kpi-card">
                <div className="admin-kpi-title">Total Revenue</div>
                <div className="admin-kpi-val emerald">৳{stats.total_revenue.toLocaleString()}</div>
                <div className="admin-kpi-sub" style={{ color: "#64748b" }}>Last 30 Days: ৳{stats.monthly_revenue.toLocaleString()}</div>
              </div>

              <div className="admin-kpi-card">
                <div className="admin-kpi-title">Average Order Value (AOV)</div>
                <div className="admin-kpi-val" style={{ color: "var(--forest)" }}>৳{stats.avg_order_value || 0}</div>
                <div className="admin-kpi-sub" style={{ color: "#64748b" }}>Avg. spend per order</div>
              </div>

              <div className="admin-kpi-card">
                <div className="admin-kpi-title">Total Orders</div>
                <div className="admin-kpi-val">{stats.total_orders}</div>
                <div className="admin-kpi-sub" style={{ color: "#fbbf24" }}>Pending: {stats.pending_orders} | Delivered: {stats.delivered_orders}</div>
              </div>

              <div className="admin-kpi-card">
                <div className="admin-kpi-title">Total Customers</div>
                <div className="admin-kpi-val" style={{ color: "var(--forest)" }}>{stats.unique_customers || customersList.length} Profiles</div>
                <div className="admin-kpi-sub" style={{ color: "var(--emerald)" }}>Unique Customer Directory</div>
              </div>

              <div className="admin-kpi-card">
                <div className="admin-kpi-title">Inventory & Stock Status</div>
                <div className="admin-kpi-val">{stats.total_products} Products</div>
                <div className="admin-kpi-sub" style={{ color: "#fb7185" }}>Out of stock: {stats.out_of_stock_products} | Low stock: {stats.low_stock_products}</div>
              </div>

              <div className="admin-kpi-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div className="admin-kpi-title">Quick Actions</div>
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <button onClick={openCreateModal} className="admin-tab-btn active" style={{ flex: 1, fontSize: "12px", padding: "8px" }}>
                    + Add Product
                  </button>
                  <button onClick={() => setActiveTab("orders")} className="admin-header-link" style={{ flex: 1, fontSize: "12px", textAlign: "center" }}>
                    Orders List ➔
                  </button>
                </div>
              </div>
            </div>

            {/* Sales Chart & Top Selling Products Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "24px" }}>
              {/* Daily Sales Bar Chart */}
              <div className="admin-panel">
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 20px" }}>
                  Sales Analytics (Last 7 Days)
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
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 16px" }}>
                  Top Selling Products
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
                          {item.sold} sold
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: "var(--coffee)", fontSize: "13px", textAlign: "center", paddingTop: "30px" }}>
                    No order records available yet.
                  </div>
                )}
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div className="admin-panel">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "20px", fontWeight: 800, color: "var(--forest)", margin: 0 }}>Recent Orders (Last 10)</h3>
                <button onClick={() => setActiveTab("orders")} className="admin-header-link" style={{ fontSize: "12px" }}>
                  View All Orders ➔
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

        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <div style={{ display: "grid", gridTemplateColumns: selectedOrder ? "1fr 1.5fr" : "1fr", gap: "24px" }}>
            {/* Orders List Column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Filters */}
              <div className="admin-panel" style={{ padding: "16px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
                <input
                  type="text"
                  placeholder="Search by Order ID, name, or phone..."
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
                  <option value="">All Statuses</option>
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
                    No orders found.
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
                    <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                      Order Details <span style={{ color: "var(--emerald)" }}>#{selectedOrder.id}</span>
                    </h3>
                    <p style={{ fontSize: "12px", color: "var(--coffee)", margin: "4px 0 0" }}>
                      Date: {new Date(selectedOrder.created_at).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handlePrintInvoice(selectedOrder)}
                      className="admin-tab-btn active"
                      style={{ padding: "4px 12px", fontSize: "12px", marginTop: 0 }}
                    >
                      📄 Print Invoice / Memo
                    </button>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="admin-header-link"
                      style={{ padding: "4px 12px" }}
                    >
                      Close ✕
                    </button>
                  </div>
                </div>

                {/* Status Updater */}
                <div style={{ background: "var(--cream)", padding: "14px", borderRadius: "12px", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--forest)" }}>Update Order Status:</span>
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
                    <div style={{ color: "var(--coffee)", fontWeight: 700, marginBottom: "4px" }}>Customer & Delivery Address</div>
                    <div style={{ fontWeight: 700, color: "var(--forest)" }}>{selectedOrder.customer_name}</div>
                    <div style={{ color: "var(--ink)", marginTop: "4px" }}>{selectedOrder.address}</div>
                  </div>
                  <div>
                    <div style={{ color: "var(--coffee)", fontWeight: 700, marginBottom: "4px" }}>Payment & Fulfillment</div>
                    <div style={{ color: "var(--ink)" }}>Method: <span style={{ fontWeight: 700, color: "var(--forest)", textTransform: "uppercase" }}>{selectedOrder.payment_method}</span></div>
                    <div style={{ color: "var(--ink)", marginTop: "4px" }}>Delivery Charge: ৳{selectedOrder.delivery_charge}</div>
                    <div style={{ color: "var(--ink)", marginTop: "2px" }}>Discount: ৳{selectedOrder.discount_amount}</div>
                  </div>
                </div>

                {/* Ordered Items */}
                <div>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--coffee)", marginBottom: "12px", textTransform: "uppercase" }}>Order Items</h4>
                  <div style={{ borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
                    {selectedOrder.items.map(item => (
                      <div key={item.id} style={{ padding: "12px 0", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "13px", borderBottom: "1px solid var(--cream)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          {item.product_image && (
                            <img src={item.product_image} alt={item.product_name} style={{ width: "42px", height: "42px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--line)" }} />
                          )}
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--forest)" }}>{item.product_name}</div>
                            <div style={{ color: "var(--coffee)", fontSize: "12px" }}>Qty: {item.quantity} × ৳{item.unit_price}</div>
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
                  <span>Total Payable:</span>
                  <span style={{ fontSize: "22px", fontWeight: 800 }}>৳{selectedOrder.total}</span>
                </div>
              </div>
            )}
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
                placeholder="Search by product name or slug..."
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
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
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
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "var(--coffee)" }}>
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

        {/* CUSTOMERS TAB */}
        {activeTab === "customers" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="admin-panel" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: "22px", fontWeight: 800, color: "var(--forest)", margin: 0 }}>👥 Customer Directory & History</h3>
              <span className="admin-badge pending" style={{ fontSize: "13px" }}>{customersList.length} Customer Profiles</span>
            </div>

            <div className="admin-panel" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Customer Name</th>
                      <th>Address / Location</th>
                      <th>Total Orders</th>
                      <th>Total Spent</th>
                      <th>Last Order Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customersList.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "var(--coffee)" }}>
                          No customer records found.
                        </td>
                      </tr>
                    ) : (
                      customersList.map((c, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 700, color: "var(--forest)" }}>{c.customer_name}</td>
                          <td style={{ color: "var(--ink)" }}>{c.address}</td>
                          <td style={{ fontWeight: 700 }}>
                            <span className="admin-badge delivered" style={{ background: "rgba(16,185,129,0.1)", color: "var(--forest)" }}>
                              {c.total_orders} Orders
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

        {/* IMAGE GALLERY TAB */}
        {activeTab === "gallery" && (
          <ImageGallery
            products={products}
            csrfToken={csrfToken}
            getApiUrl={getApiUrl}
            onRefreshProducts={fetchDashboardData}
          />
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
    </>
  );
}
