"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "../components";
import { BANGLADESH_DISTRICTS } from "../data/bangladesh-locations";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

type Address = {
  id: number;
  label: string;
  recipient_name: string;
  phone: string;
  address: string;
  district: string;
  upazila?: string;
  is_default: boolean;
};

type OrderHistoryItem = {
  id: number;
  status: string;
  status_display?: string;
  payment_method?: string;
  address?: string;
  delivery_charge?: string | number;
  discount_amount?: string | number;
  created_at: string;
  total: string | number;
  items?: {
    id: number;
    product_name: string;
    product_slug: string;
    product_image?: string;
    quantity: number;
    unit_price: string | number;
  }[];
};

type AccountData = {
  authenticated: boolean;
  name: string;
  email: string;
  avatar_url?: string;
  profile?: { phone: string; avatar_url: string };
  addresses: Address[];
  orders: OrderHistoryItem[];
};

export default function AccountPage() {
  const [account, setAccount] = useState<AccountData | null>(null);
  const [csrfToken, setCsrfToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState("");
  const [phone, setPhone] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"history" | "addresses" | "settings">("history");

  const [address, setAddress] = useState({
    label: "",
    recipient_name: "",
    phone: "",
    address: "",
    district: "",
    upazila: "",
    is_default: true
  });

  const loadData = () => {
    fetch(API + "/auth/me/", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setAccount(data);
        if (data.authenticated) {
          setProfileName(data.name || "");
          setPhone(data.profile?.phone || "");
        }
      })
      .catch(() => setNotice("অ্যাকাউন্ট তথ্য লোড করা যায়নি।"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("google=success")) {
      setNotice("Google অ্যাকাউন্ট দিয়ে সফলভাবে লগইন হয়েছে।");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    fetch(API + "/auth/csrf/", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setCsrfToken(data.csrfToken || ""))
      .catch(() => undefined);
    loadData();
  }, []);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const response = await fetch(API + "/customer/profile/", {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken
      },
      body: JSON.stringify({ name: profileName, phone })
    });
    setSaving(false);
    setNotice(response.ok ? "প্রোফাইল তথ্য সফলভাবে সংরক্ষণ করা হয়েছে।" : "প্রোফাইল তথ্য সংরক্ষণ করা সম্ভব হয়নি।");
    if (response.ok) loadData();
  };

  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);

  const addAddress = async (event: FormEvent) => {
    event.preventDefault();
    const isEditing = editingAddressId !== null;
    const url = isEditing ? `${API}/customer/addresses/${editingAddressId}/` : `${API}/customer/addresses/`;
    const method = isEditing ? "PATCH" : "POST";

    const response = await fetch(url, {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken
      },
      body: JSON.stringify(address)
    });
    setNotice(response.ok ? (isEditing ? "ঠিকানা আপডেট করা হয়েছে।" : "নতুন ঠিকানা যোগ করা হয়েছে।") : "ঠিকানা সংরক্ষণ করা সম্ভব হয়নি।");
    if (response.ok) {
      setEditingAddressId(null);
      setAddress({ label: "", recipient_name: "", phone: "", address: "", district: "", upazila: "", is_default: true });
      loadData();
    }
  };

  const setDefaultAddress = async (id: number) => {
    const response = await fetch(`${API}/customer/addresses/${id}/`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken
      },
      body: JSON.stringify({ is_default: true })
    });
    if (response.ok) {
      setNotice("ডিফল্ট ঠিকানা পরিবর্তন করা হয়েছে।");
      loadData();
    }
  };

  const deleteAddress = async (id: number) => {
    if (!confirm("আপনি কি নিশ্চিত যে এই ঠিকানাটি মুছে ফেলতে চান?")) return;
    const response = await fetch(`${API}/customer/addresses/${id}/`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "X-CSRFToken": csrfToken
      }
    });
    if (response.ok) {
      setNotice("ঠিকানাটি মুছে ফেলা হয়েছে।");
      loadData();
    }
  };

  const startEditAddress = (addr: Address) => {
    setEditingAddressId(addr.id);
    setAddress({
      label: addr.label || "",
      recipient_name: addr.recipient_name || "",
      phone: addr.phone || "",
      address: addr.address || "",
      district: addr.district || "",
      upazila: addr.upazila || "",
      is_default: addr.is_default
    });
  };

  const logout = async () => {
    await fetch(API + "/auth/logout/", {
      method: "POST",
      credentials: "include",
      headers: { "X-CSRFToken": csrfToken }
    });
    window.location.href = "/";
  };

  if (loading) {
    return (
      <>
        <Header />
        <main style={{ padding: "60px 16px", textAlign: "center", color: "#64748b" }}>
          লোড হচ্ছে...
        </main>
      </>
    );
  }

  if (!account?.authenticated) {
    return (
      <>
        <Header />
        <main style={{ padding: "60px 16px 100px", backgroundColor: "#f8fafc", minHeight: "80vh" }}>
          <div
            style={{
              maxWidth: "480px",
              margin: "0 auto",
              backgroundColor: "#ffffff",
              padding: "40px 24px",
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
              border: "1px solid #e2e8f0",
              textAlign: "center"
            }}
          >
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#10b981", letterSpacing: "1px" }}>
              কাস্টমার পোর্টাল
            </span>
            <h1 style={{ margin: "8px 0 12px", fontSize: "1.6rem", color: "#0f172a" }}>
              অ্যাকাউন্টে প্রবেশ করুন
            </h1>
            <p style={{ color: "#64748b", fontSize: "0.92rem", lineHeight: 1.5, marginBottom: "28px" }}>
              Google দিয়ে এক ক্লিকে লগইন করে আপনার সংরক্ষিত ঠিকানা, কেনাকাটার ইতিহাস এবং দ্রুত চেকআউটের সুবিধা উপভোগ করুন।
            </p>
            <button
              onClick={() => {
                window.location.href = API + "/auth/google/start/?next=/account";
              }}
              style={{
                width: "100%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                backgroundColor: "#ffffff",
                border: "1px solid #cbd5e1",
                padding: "12px",
                borderRadius: "10px",
                fontSize: "0.95rem",
                fontWeight: 600,
                color: "#334155",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Google দিয়ে লগইন করুন
            </button>
          </div>
        </main>
      </>
    );
  }

  const avatar = account.avatar_url || account.profile?.avatar_url;

  return (
    <>
      <Header />
      <main style={{ padding: "40px 16px 80px", backgroundColor: "#f8fafc", minHeight: "85vh" }}>
        <div style={{ maxWidth: "1050px", margin: "0 auto" }}>
          
          {/* Header Profile Banner */}
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "24px 28px",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "16px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "#10b981",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.4rem",
                  fontWeight: 700,
                  overflow: "hidden"
                }}
              >
                {avatar ? (
                  <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span>{account.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: "1.5rem", color: "#0f172a", fontWeight: 700 }}>
                  স্বাগতম, {account.name}
                </h1>
                <span style={{ fontSize: "0.9rem", color: "#64748b" }}>{account.email}</span>
              </div>
            </div>
            <button
              onClick={logout}
              style={{
                padding: "8px 18px",
                borderRadius: "8px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                fontWeight: 600,
                fontSize: "0.88rem",
                cursor: "pointer"
              }}
            >
              লগআউট
            </button>
          </div>

          {/* Navigation Tabs Bar */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "24px",
              borderBottom: "2px solid #e2e8f0",
              paddingBottom: "2px",
              overflowX: "auto"
            }}
          >
            <button
              onClick={() => setActiveTab("history")}
              style={{
                padding: "10px 20px",
                borderRadius: "10px 10px 0 0",
                backgroundColor: activeTab === "history" ? "#10b981" : "transparent",
                color: activeTab === "history" ? "#ffffff" : "#475569",
                fontWeight: 700,
                fontSize: "0.95rem",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              📦 অর্ডার ইতিহাস (Buy History) ({account?.orders?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab("addresses")}
              style={{
                padding: "10px 20px",
                borderRadius: "10px 10px 0 0",
                backgroundColor: activeTab === "addresses" ? "#10b981" : "transparent",
                color: activeTab === "addresses" ? "#ffffff" : "#475569",
                fontWeight: 700,
                fontSize: "0.95rem",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              📍 সংরক্ষিত ঠিকানাসমূহ ({account.addresses.length})
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              style={{
                padding: "10px 20px",
                borderRadius: "10px 10px 0 0",
                backgroundColor: activeTab === "settings" ? "#10b981" : "transparent",
                color: activeTab === "settings" ? "#ffffff" : "#475569",
                fontWeight: 700,
                fontSize: "0.95rem",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              ⚙️ প্রোফাইল সেটিংস
            </button>
          </div>

          {notice && (
            <div
              style={{
                padding: "12px 16px",
                backgroundColor: "#ecfdf5",
                border: "1px solid #a7f3d0",
                color: "#047857",
                borderRadius: "10px",
                marginBottom: "24px",
                fontSize: "0.9rem",
                fontWeight: 500
              }}
            >
              {notice}
            </div>
          )}

          {/* TAB 1: Buy History */}
          {activeTab === "history" && (
            <div
              style={{
                backgroundColor: "#ffffff",
                padding: "28px",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
              }}
            >
              <h2 style={{ margin: "0 0 20px", fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>📦</span> আপনার অর্ডার ইতিহাস (Buy History)
              </h2>
              {account.orders.length ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {account.orders.map((order) => {
                    const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
                      pending: { bg: "#fef3c7", color: "#d97706", label: "পেন্ডিং (প্রসেসিং চলছে)" },
                      confirmed: { bg: "#e0f2fe", color: "#0284c7", label: "কনফার্ম করা হয়েছে" },
                      processing: { bg: "#e0e7ff", color: "#4f46e5", label: "প্রসেসিং" },
                      shipped: { bg: "#fae8ff", color: "#c026d3", label: "শিপিং এ আছে" },
                      delivered: { bg: "#d1fae5", color: "#059669", label: "ডেলিভারি সম্পন্ন" },
                      cancelled: { bg: "#fee2e2", color: "#dc2626", label: "বাতিলকৃত" }
                    };
                    const statusInfo = statusConfig[order.status] || { bg: "#f1f5f9", color: "#475569", label: order.status_display || order.status };

                    return (
                      <div
                        key={order.id}
                        style={{
                          borderRadius: "16px",
                          border: "1px solid #e2e8f0",
                          backgroundColor: "#ffffff",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                          overflow: "hidden"
                        }}
                      >
                        {/* Order Card Header */}
                        <div
                          style={{
                            padding: "16px 20px",
                            backgroundColor: "#f8fafc",
                            borderBottom: "1px solid #e2e8f0",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "12px"
                          }}
                        >
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <strong style={{ fontSize: "1.05rem", color: "#0f172a" }}>
                                অর্ডার আইডি #{order.id}
                              </strong>
                              <span
                                style={{
                                  fontSize: "0.78rem",
                                  padding: "4px 12px",
                                  borderRadius: "20px",
                                  backgroundColor: statusInfo.bg,
                                  color: statusInfo.color,
                                  fontWeight: 700
                                }}
                              >
                                {statusInfo.label}
                              </span>
                            </div>
                            <span style={{ fontSize: "0.83rem", color: "#64748b", marginTop: "4px", display: "block" }}>
                              অর্ডারের তারিখ: {new Date(order.created_at).toLocaleDateString("bn-BD", { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block" }}>মোট পরিমাণ</span>
                            <strong style={{ fontSize: "1.25rem", color: "#059669" }}>
                              ৳{Number(order.total).toLocaleString("bn-BD")}
                            </strong>
                          </div>
                        </div>

                        {/* Order Items Section */}
                        <div style={{ padding: "18px 20px" }}>
                          {order.items && order.items.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
                              {order.items.map((item) => (
                                <div
                                  key={item.id}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "14px",
                                    padding: "10px",
                                    borderRadius: "10px",
                                    backgroundColor: "#fafafa",
                                    border: "1px solid #f1f5f9"
                                  }}
                                >
                                  <div
                                    style={{
                                      width: "54px",
                                      height: "54px",
                                      borderRadius: "8px",
                                      overflow: "hidden",
                                      backgroundColor: "#e2e8f0",
                                      flexShrink: 0,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center"
                                    }}
                                  >
                                    {item.product_image ? (
                                      <img src={item.product_image} alt={item.product_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                      <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#64748b" }}>📦</span>
                                    )}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <Link href={`/products/${item.product_slug}`} style={{ textDecoration: "none" }}>
                                      <strong style={{ fontSize: "0.95rem", color: "#1e293b", display: "block" }}>
                                        {item.product_name}
                                      </strong>
                                    </Link>
                                    <span style={{ fontSize: "0.83rem", color: "#64748b", marginTop: "2px", display: "block" }}>
                                      পরিমাণ: {item.quantity}টি × ৳{Number(item.unit_price).toLocaleString("bn-BD")}
                                    </span>
                                  </div>
                                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#334155" }}>
                                    ৳{(Number(item.unit_price) * item.quantity).toLocaleString("bn-BD")}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={{ color: "#64748b", fontSize: "0.88rem", margin: "0 0 12px" }}>পণ্য সংক্রান্ত তথ্য প্রসেস হচ্ছে...</p>
                          )}

                          {/* Footer Info (Address & Payment) */}
                          <div
                            style={{
                              paddingTop: "12px",
                              borderTop: "1px dashed #e2e8f0",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: "0.84rem",
                              color: "#64748b",
                              flexWrap: "wrap",
                              gap: "8px"
                            }}
                          >
                            <span>
                              📍 <strong>ডেলিভারি ঠিকানা:</strong> {order.address || "প্রদত্ত ঠিকানা"}
                            </span>
                            <span style={{ backgroundColor: "#f1f5f9", padding: "4px 10px", borderRadius: "6px", fontWeight: 600, color: "#334155" }}>
                              {order.payment_method === "cod" ? "💵 ক্যাশ অন ডেলিভারি" : "💳 অনলাইন পেমেন্ট"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 16px", color: "#64748b" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🛍️</div>
                  <h3 style={{ margin: "0 0 8px", color: "#0f172a" }}>এখনও কোনো অর্ডার করেননি!</h3>
                  <p style={{ margin: "0 0 20px" }}>পছন্দের পণ্যগুলো বেছে নিয়ে এখনই প্রথম অর্ডার করুন।</p>
                  <Link
                    href="/#shop"
                    style={{
                      display: "inline-block",
                      backgroundColor: "#10b981",
                      color: "#fff",
                      fontWeight: 700,
                      padding: "10px 24px",
                      borderRadius: "10px",
                      textDecoration: "none"
                    }}
                  >
                    কেনাকাটা শুরু করুন →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Saved Addresses */}
          {activeTab === "addresses" && (
            <div>
              <div
                style={{
                  backgroundColor: "#ffffff",
                  padding: "28px",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  marginBottom: "28px"
                }}
              >
                <h2 style={{ margin: "0 0 20px", fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>
                  সংরক্ষিত ঠিকানাসমূহ ({account.addresses.length})
                </h2>
                {account.addresses.length ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "18px" }}>
                    {account.addresses.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          padding: "18px",
                          borderRadius: "14px",
                          border: item.is_default ? "2px solid #10b981" : "1px solid #e2e8f0",
                          backgroundColor: item.is_default ? "#f0fdf4" : "#ffffff",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <strong style={{ fontSize: "1rem", color: "#0f172a" }}>📍 {item.label}</strong>
                          {item.is_default && (
                            <span style={{ fontSize: "0.78rem", color: "#059669", backgroundColor: "#d1fae5", padding: "2px 10px", borderRadius: "12px", fontWeight: 700 }}>
                              ডিফল্ট
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: "0.9rem", color: "#475569", lineHeight: 1.6 }}>
                          <strong>{item.recipient_name}</strong> · {item.phone}
                          <br />
                          {item.address}
                          {(item.upazila || item.district) && (
                            <span style={{ color: "#059669", fontWeight: 600, display: "block", marginTop: "2px" }}>
                              {[item.upazila ? `উপজেলা: ${item.upazila}` : "", item.district ? `জেলা: ${item.district}` : ""].filter(Boolean).join(", ")}
                            </span>
                          )}
                        </p>

                        {/* Action buttons: Set Default, Edit, Delete */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            marginTop: "14px",
                            paddingTop: "10px",
                            borderTop: "1px dashed #e2e8f0"
                          }}
                        >
                          {!item.is_default && (
                            <button
                              type="button"
                              onClick={() => setDefaultAddress(item.id)}
                              style={{
                                fontSize: "0.78rem",
                                color: "#059669",
                                backgroundColor: "#ecfdf5",
                                border: "1px solid #a7f3d0",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontWeight: 600
                              }}
                            >
                              ডিফল্ট করুন
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => startEditAddress(item)}
                            style={{
                              fontSize: "0.78rem",
                              color: "#0284c7",
                              backgroundColor: "#f0f9ff",
                              border: "1px solid #bae6fd",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontWeight: 600
                            }}
                          >
                            ✏️ এডিট
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteAddress(item.id)}
                            style={{
                              fontSize: "0.78rem",
                              color: "#dc2626",
                              backgroundColor: "#fef2f2",
                              border: "1px solid #fecaca",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontWeight: 600,
                              marginLeft: "auto"
                            }}
                          >
                            🗑️ ডিলিট
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#64748b", margin: 0 }}>
                    অর্ডার করার সময় আপনার শিপিং ঠিকানা স্বয়ংক্রিয়ভাবে এখানে সেভ হয়ে থাকবে।
                  </p>
                )}
              </div>

              {/* Form to add/edit address */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  padding: "24px",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
                    {editingAddressId ? "✏️ ঠিকানা এডিট করুন" : "+ নতুন ঠিকানা যোগ করুন"}
                  </h3>
                  {editingAddressId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAddressId(null);
                        setAddress({ label: "", recipient_name: "", phone: "", address: "", district: "", upazila: "", is_default: true });
                      }}
                      style={{ fontSize: "0.8rem", color: "#64748b", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                    >
                      বাতিল করুন
                    </button>
                  )}
                </div>
                <form onSubmit={addAddress} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                        ঠিকানার লেবেল (যেমন: বাসা / অফিস)
                      </label>
                      <input
                        value={address.label}
                        onChange={(e) => setAddress({ ...address, label: e.target.value })}
                        placeholder="যেমন: বাসা / অফিস"
                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                        প্রাপকের নাম
                      </label>
                      <input
                        required
                        value={address.recipient_name}
                        onChange={(e) => setAddress({ ...address, recipient_name: e.target.value })}
                        placeholder="যেমন: রাহিম উদ্দিন"
                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                      />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                        মোবাইল নম্বর
                      </label>
                      <input
                        required
                        value={address.phone}
                        onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                        placeholder="01XXXXXXXXX"
                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                        জেলা নির্বাচন করুন *
                      </label>
                      <select
                        value={address.district}
                        onChange={(e) => {
                          setAddress({ ...address, district: e.target.value, address: "" });
                        }}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", backgroundColor: "#fff" }}
                      >
                        <option value="">-- জেলা বেছে নিন --</option>
                        {BANGLADESH_DISTRICTS.map((item) => (
                          <option key={item.district} value={item.district}>
                            {item.district}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                        উপজেলা / থানা *
                      </label>
                      <select
                        disabled={!address.district}
                        value={address.upazila}
                        onChange={(e) => {
                          setAddress({ ...address, upazila: e.target.value });
                        }}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "0.9rem",
                          backgroundColor: address.district ? "#fff" : "#f1f5f9",
                          cursor: address.district ? "pointer" : "not-allowed"
                        }}
                      >
                        <option value="">-- উপজেলা/থানা বেছে নিন --</option>
                        {address.district &&
                          BANGLADESH_DISTRICTS.find((d) => d.district === address.district)?.upazilas.map((upazila) => (
                            <option key={upazila} value={upazila}>
                              {upazila}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                      গ্রাম / সড়ক / বাসা নম্বর (বিস্তারিত ঠিকানা)
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={address.address}
                      onChange={(e) => setAddress({ ...address, address: e.target.value })}
                      placeholder={`উদাহরণ (ঢাকার জন্য):
বাসা # ১২ (৩য় তলা), রোড # ৪, ব্লক # বি, মিরপুর-১০, ঢাকা।

উদাহরণ (ঢাকার বাইরের জন্য):
মাতব্বর বাড়ি, উত্তর পাড়া (পুরাতন জামে মসজিদের পিছনে), গ্রাম: রামপুর, ডাকঘর: রামপুর বাজার-৩৮০০।`}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", fontFamily: "inherit", lineHeight: "1.5" }}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{
                      backgroundColor: "#1e293b",
                      color: "#fff",
                      fontWeight: 600,
                      padding: "11px",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      width: "fit-content"
                    }}
                  >
                    ঠিকানা সংরক্ষণ করুন
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: Profile Settings */}
          {activeTab === "settings" && (
            <div
              style={{
                backgroundColor: "#ffffff",
                padding: "28px",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                maxWidth: "600px"
              }}
            >
              <h2 style={{ margin: "0 0 20px", fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>
                প্রোফাইল সেটিংস
              </h2>
              <form onSubmit={saveProfile} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                    আপনার নাম
                  </label>
                  <input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.95rem",
                      outline: "none"
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                    ইমেইল ঠিকানা (Google Account)
                  </label>
                  <input
                    value={account.email}
                    readOnly
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      backgroundColor: "#f8fafc",
                      fontSize: "0.95rem",
                      color: "#64748b"
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                    মোবাইল নম্বর
                  </label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.95rem",
                      outline: "none"
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    backgroundColor: "#10b981",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "0.98rem",
                    padding: "12px 24px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    width: "fit-content",
                    marginTop: "8px"
                  }}
                >
                  {saving ? "সংরক্ষণ হচ্ছে..." : "প্রোফাইল আপডেট করুন"}
                </button>
              </form>
            </div>
          )}

        </div>
      </main>
    </>
  );
}
