"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "../components";
import { useCart } from "../cart";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

type CourierOption = { id: string; name: string; live_quote: boolean };
type LocationOption = { id: string; name: string };

function normalizeLocations(rows: Record<string, unknown>[], level: "cities" | "zones" | "areas"): LocationOption[] {
  const idKeys = level === "cities" ? ["city_id", "id"] : level === "zones" ? ["zone_id", "id"] : ["area_id", "id"];
  const nameKeys = level === "cities" ? ["city_name", "name"] : level === "zones" ? ["zone_name", "name"] : ["area_name", "name"];
  return rows.map(row => ({
    id: String(idKeys.map(key => row[key]).find(value => value !== undefined && value !== null) ?? ""),
    name: String(nameKeys.map(key => row[key]).find(value => value) ?? ""),
  })).filter(option => option.id && option.name);
}

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const [orderSuccess, setOrderSuccess] = useState<{ id: string; number?: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [googleNotice, setGoogleNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; avatar_url?: string } | null>(null);

  const [courierOptions, setCourierOptions] = useState<CourierOption[]>([]);
  const [courierProvider, setCourierProvider] = useState("");
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [zones, setZones] = useState<LocationOption[]>([]);
  const [areas, setAreas] = useState<LocationOption[]>([]);
  const [cityId, setCityId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [courierError, setCourierError] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState<number | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const paymentMethod = "cod" as const;

  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [couponError, setCouponError] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);

  const [savedAddresses, setSavedAddresses] = useState<{ id: number; label: string; recipient_name: string; phone: string; address: string; district: string; upazila?: string }[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  useEffect(() => {
    // 1. Fetch CSRF token
    fetch(API + "/auth/csrf/", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setCsrfToken(data.csrfToken || ""))
      .catch(() => undefined);

    fetch(API + "/checkout/couriers/")
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Live courier service is unavailable.");
        const providers = Array.isArray(data.providers) ? data.providers as CourierOption[] : [];
        setCourierOptions(providers);
        const provider = providers[0]?.id || "";
        setCourierProvider(provider);
        if (!provider) throw new Error("Live delivery quotation is not configured yet. Please contact the store.");
        setLocationsLoading(true);
        const cityResponse = await fetch(`${API}/checkout/couriers/${provider}/cities/`);
        const cityData = await cityResponse.json();
        if (!cityResponse.ok) throw new Error(cityData.error || "Could not load courier cities.");
        setCities(normalizeLocations(cityData.results || [], "cities"));
      })
      .catch(error => setCourierError(error instanceof Error ? error.message : "Could not connect to the courier."))
      .finally(() => setLocationsLoading(false));

    // 3. Check Google login or errors
    const params = new URLSearchParams(window.location.search);
    if (params.get("google_error")) {
      setGoogleNotice("Google login সম্পন্ন হয়নি। আপনি অতিথি হিসেবে অর্ডারের তথ্য পূরণ করতে পারেন।");
    }

    fetch(API + "/auth/me/", { credentials: "include" })
      .then((res) => res.json())
      .then((profile) => {
        if (profile.authenticated) {
          setUserProfile({
            name: profile.name || "",
            email: profile.email || "",
            avatar_url: profile.avatar_url || ""
          });
          setName(profile.name || "");
          setEmail(profile.email || "");
          setPhone(profile.profile?.phone || "");

          if (Array.isArray(profile.addresses) && profile.addresses.length > 0) {
            setSavedAddresses(profile.addresses);
            const defaultAddress = profile.addresses.find((item: { is_default: boolean }) => item.is_default) || profile.addresses[0];
            if (defaultAddress) {
              handleSelectSavedAddress(defaultAddress);
            }
          }
        }
      })
      .catch(() => undefined);
  }, []);

  const handleSelectSavedAddress = (addr: { id: number; recipient_name: string; phone: string; address: string; district: string; upazila?: string }) => {
    setSelectedAddressId(addr.id);
    if (addr.recipient_name) setName(addr.recipient_name);
    if (addr.phone) setPhone(addr.phone);
    setDeliveryAddress(addr.address);
  };

  const handleCityChange = async (value: string) => {
    setCityId(value); setZoneId(""); setAreaId(""); setZones([]); setAreas([]); setDeliveryCharge(null); setQuoteLoading(false); setCourierError("");
    if (!value) return;
    setLocationsLoading(true);
    try {
      const response = await fetch(`${API}/checkout/couriers/${courierProvider}/zones/?city_id=${encodeURIComponent(value)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load zones.");
      setZones(normalizeLocations(data.results || [], "zones"));
    } catch (error) { setCourierError(error instanceof Error ? error.message : "Could not load zones."); }
    finally { setLocationsLoading(false); }
  };

  const handleZoneChange = async (value: string) => {
    setZoneId(value); setAreaId(""); setAreas([]); setDeliveryCharge(null); setQuoteLoading(false); setCourierError("");
    if (!value) return;
    setLocationsLoading(true);
    try {
      const response = await fetch(`${API}/checkout/couriers/${courierProvider}/areas/?zone_id=${encodeURIComponent(value)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load areas.");
      setAreas(normalizeLocations(data.results || [], "areas"));
    } catch (error) { setCourierError(error instanceof Error ? error.message : "Could not load areas."); }
    finally { setLocationsLoading(false); }
  };

  useEffect(() => {
    setDeliveryCharge(null);
    if (!courierProvider || !cityId || !zoneId || !areaId || !items.length) { setQuoteLoading(false); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setQuoteLoading(true); setCourierError("");
      try {
        const response = await fetch(`${API}/checkout/couriers/quote/`, {
          method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
          body: JSON.stringify({ provider: courierProvider, city_id: cityId, zone_id: zoneId, area_id: areaId,
            items: items.map(item => ({ product_id: item.id, quantity: item.quantity })) })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not calculate live delivery charge.");
        setDeliveryCharge(Number(data.delivery_charge));
      } catch (error) {
        if (!controller.signal.aborted) setCourierError(error instanceof Error ? error.message : "Could not calculate live delivery charge.");
      } finally { if (!controller.signal.aborted) setQuoteLoading(false); }
    }, 300);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [courierProvider, cityId, zoneId, areaId, items]);

  const handleApplyCoupon = async (e: React.MouseEvent) => {
    e.preventDefault();
    setCouponError("");
    if (!couponCode.trim()) { setCouponError("Enter a coupon code."); return; }
    try {
      const response = await fetch(`${API}/checkout/coupons/validate/`, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coupon_code: couponCode, items: items.map(item => ({ product_id: item.id, quantity: item.quantity })) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Coupon could not be applied.");
      setCouponCode(data.coupon_code);
      setCouponDiscount(Number(data.discount_amount));
      setCouponApplied(true);
    } catch (error) { setCouponError(error instanceof Error ? error.message : "Coupon could not be applied."); }
  };

  const grandTotal = Math.max(0, total + (deliveryCharge || 0) - couponDiscount);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    if (!items.length) {
      setErrorMessage("আপনার কার্টে কোনো পণ্য নেই।");
      setSubmitting(false);
      return;
    }

    try {
      if (deliveryCharge === null || !cityId || !zoneId || !areaId) {
        throw new Error("Choose a city, zone, and area and wait for the live delivery charge.");
      }
      const cityName = cities.find(option => option.id === cityId)?.name || "";
      const zoneName = zones.find(option => option.id === zoneId)?.name || "";
      const areaName = areas.find(option => option.id === areaId)?.name || "";
      const fullAddressStr = [deliveryAddress, areaName, zoneName, cityName].filter(Boolean).join(", ");

      const res = await fetch(`${API}/orders/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRFToken": csrfToken } : {})
        },
        body: JSON.stringify({
          customer_name: name,
          email: email,
          phone: phone,
          address: fullAddressStr,
          coupon_code: couponApplied ? couponCode : "",
          payment_method: paymentMethod,
          courier_provider: courierProvider,
          courier_city_id: cityId,
          courier_city_name: cityName,
          courier_zone_id: zoneId,
          courier_zone_name: zoneName,
          courier_area_id: areaId,
          courier_area_name: areaName,
          items: items.map((item) => ({
            product_id: item.id,
            quantity: item.quantity
          }))
        })
      });

      const orderData = await res.json().catch(() => ({}));
      if (!res.ok) {
        let errStr = "অর্ডারটি সম্পন্ন করা যায়নি। আপনার তথ্য পুনঃনিরীক্ষা করুন।";
        if (orderData.detail) errStr = orderData.detail;
        else if (typeof orderData === "object") {
          const firstKey = Object.keys(orderData)[0];
          if (firstKey) {
            const val = orderData[firstKey];
            errStr = Array.isArray(val) ? `${firstKey}: ${val[0]}` : `${firstKey}: ${val}`;
          }
        }
        throw new Error(errStr);
      }

      clear();
      setOrderSuccess({
        id: orderData.id || "1001",
        number: orderData.order_number || `#${orderData.id || "REC"}`
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "অর্ডারটি সম্পন্ন করা সম্ভব হয়নি।");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="checkout-page-wrapper">
        <div className="checkout-container">
          
          {/* Header Title */}
          <div className="checkout-header-text">
            <span className="checkout-badge">
              🔒 100% নিরাপদ চেকআউট
            </span>
            <h1 className="checkout-title">
              অর্ডার চূড়ান্ত করুন
            </h1>
            <p className="checkout-sub">
              নিচের তথ্যগুলো পূরণ করে আপনার অর্ডারটি দ্রুত কনফার্ম করুন
            </p>
          </div>

          {googleNotice && (
            <div className="google-notice-bar">
              {googleNotice}
            </div>
          )}

          {/* Success Screen */}
          {orderSuccess ? (
            <div className="order-success-card">
              <div className="success-icon-box">
                ✓
              </div>
              <h2>
                ধন্যবাদ! আপনার অর্ডার সফল হয়েছে
              </h2>
              <p>
                অর্ডার আইডি: <strong>{orderSuccess.number}</strong>
                <br />
                আমাদের প্রতিনিধি দ্রুত ফোন কলের মাধ্যমে আপনার অর্ডারটি নিশ্চিত করবেন।
              </p>
              <Link href="/" className="back-home-btn">
                হোম পেজে ফিরে যান →
              </Link>
            </div>
          ) : (
            <div className="checkout-grid-layout">
              
              {/* Main Form Area */}
              <div className="checkout-form-stack">
                
                {/* User Status / Quick Login Bar */}
                {userProfile ? (
                  <div className="user-logged-card">
                    <div className="user-avatar-circle">
                      {userProfile.avatar_url ? (
                        <img src={userProfile.avatar_url} alt={userProfile.name} />
                      ) : (
                        <span>{userProfile.name?.charAt(0).toUpperCase() || "U"}</span>
                      )}
                    </div>
                    <div className="user-account-details">
                      <div className="user-account-header">
                        <strong className="user-display-name">{userProfile.name}</strong>
                        <span className="verified-chip">✓ ভেরিফাইড অ্যাকাউন্ট</span>
                      </div>
                      <span className="user-email-text">{userProfile.email}</span>
                    </div>
                  </div>
                ) : (
                  <div className="guest-login-bar">
                    <div className="guest-login-text">
                      <strong>অ্যাকাউন্ট নিশ্চিতকরণ</strong>
                      <span>অর্ডারের সুবিধা পেতে Google অ্যাকাউন্ট দিয়ে সাইন ইন করুন</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = API + "/auth/google/start/";
                      }}
                      className="google-chip-btn"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      Google দিয়ে সাইন ইন
                    </button>
                  </div>
                )}

                {errorMessage && (
                  <div className="checkout-error-box">
                    ⚠️ {errorMessage}
                  </div>
                )}

                <form onSubmit={submit} className="checkout-form-body">
                  
                  {/* Step 1: Customer Contact Info */}
                  <div className="form-step-card">
                    <h2 className="step-heading">
                      <span className="step-num">1</span>
                      যোগাযোগের তথ্য
                    </h2>

                    <div className="contact-inputs-grid">
                      <div className="field-group">
                        <label>আপনার নাম *</label>
                        <input
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="যেমন: রাহিম উদ্দিন"
                        />
                      </div>

                      <div className="field-group">
                        <label>মোবাইল নম্বর *</label>
                        <input
                          required
                          type="tel"
                          inputMode="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="01XXXXXXXXX"
                        />
                      </div>

                      <div className="field-group full-width">
                        <label>ইমেইল ঠিকানা (ঐচ্ছিক)</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Shipping & Delivery Zone */}
                  <div className="form-step-card">
                    <h2 className="step-heading">
                      <span className="step-num">2</span>
                      ডেলিভারি এলাকা ও ঠিকানা
                    </h2>

                    {/* Saved Addresses Section for Logged-In Users */}
                    {savedAddresses.length > 0 && (
                      <div className="saved-addresses-block" style={{ marginBottom: "20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                          <label style={{ fontWeight: 600, fontSize: "0.95rem", color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
                            <span>📍</span> সংরক্ষিত ঠিকানাসমূহ ({savedAddresses.length})
                          </label>
                          <Link href="/account" style={{ fontSize: "0.82rem", color: "#d97706", fontWeight: 500, textDecoration: "none" }}>
                            ম্যানেজ করুন ➔
                          </Link>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
                          {savedAddresses.map((addr) => {
                            const isSelected = selectedAddressId === addr.id;
                            return (
                              <div
                                key={addr.id}
                                onClick={() => handleSelectSavedAddress(addr)}
                                style={{
                                  border: isSelected ? "2px solid #d97706" : "1px solid #e2e8f0",
                                  backgroundColor: isSelected ? "#fffbe6" : "#ffffff",
                                  borderRadius: "10px",
                                  padding: "12px",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  boxShadow: isSelected ? "0 2px 8px rgba(217, 119, 6, 0.15)" : "none",
                                  position: "relative"
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                  <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#1e293b" }}>
                                    {addr.label || "ঠিকানা"}
                                  </span>
                                  {isSelected && (
                                    <span style={{ fontSize: "0.75rem", backgroundColor: "#d97706", color: "#ffffff", padding: "2px 8px", borderRadius: "12px", fontWeight: 600 }}>
                                      সিলেক্ট করা
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: "0.85rem", color: "#334155", lineHeight: "1.4" }}>
                                  <strong>{addr.recipient_name}</strong> ({addr.phone})
                                </div>
                                <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "4px" }}>
                                  {addr.address}
                                  {(addr.upazila || addr.district) && (
                                    <span style={{ display: "block", color: "#059669", fontWeight: 500, fontSize: "0.78rem", marginTop: "2px" }}>
                                      {[addr.upazila ? `উপজেলা: ${addr.upazila}` : "", addr.district ? `জেলা: ${addr.district}` : ""].filter(Boolean).join(", ")}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {/* Option to enter a new address */}
                          <div
                            onClick={() => {
                              setSelectedAddressId(null);
                              setCityId("");
                              setZoneId("");
                              setAreaId("");
                              setDeliveryAddress("");
                            }}
                            style={{
                              border: selectedAddressId === null ? "2px solid #d97706" : "1px dashed #cbd5e1",
                              backgroundColor: selectedAddressId === null ? "#fffbe6" : "#f8fafc",
                              borderRadius: "10px",
                              padding: "12px",
                              cursor: "pointer",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "center",
                              alignItems: "center",
                              textAlign: "center",
                              minHeight: "80px",
                              transition: "all 0.2s ease"
                            }}
                          >
                            <span style={{ fontSize: "1.2rem", color: "#d97706", fontWeight: 700 }}>+</span>
                            <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#334155" }}>
                              নতুন অন্য ঠিকানা ব্যবহার করুন
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="field-group" style={{ marginBottom: "18px" }}>
                      <label>Delivery courier</label>
                      <select value={courierProvider} disabled={courierOptions.length <= 1} onChange={e => { setCourierProvider(e.target.value); setCityId(""); setZoneId(""); setAreaId(""); setZones([]); setAreas([]); setDeliveryCharge(null); }}>
                        <option value="">Choose courier</option>
                        {courierOptions.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
                      </select>
                    </div>
                    <div className="contact-inputs-grid" style={{ marginBottom: "18px" }}>
                      <div className="field-group">
                        <label>City *</label>
                        <select required value={cityId} disabled={locationsLoading || !cities.length} onChange={e => handleCityChange(e.target.value)}>
                          <option value="">{locationsLoading ? "Loading cities..." : "Choose city"}</option>
                          {cities.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
                        </select>
                      </div>
                      <div className="field-group">
                        <label>Zone *</label>
                        <select required value={zoneId} disabled={!cityId || locationsLoading || !zones.length} onChange={e => handleZoneChange(e.target.value)}>
                          <option value="">{locationsLoading ? "Loading zones..." : "Choose zone"}</option>
                          {zones.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
                        </select>
                      </div>
                      <div className="field-group">
                        <label>Area *</label>
                        <select required value={areaId} disabled={!zoneId || locationsLoading || !areas.length} onChange={e => { setAreaId(e.target.value); setDeliveryCharge(null); }}>
                          <option value="">{locationsLoading ? "Loading areas..." : "Choose area"}</option>
                          {areas.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
                        </select>
                      </div>
                    </div>
                    {courierError && <div className="checkout-error-box" role="alert">{courierError}</div>}
                    {quoteLoading && <p aria-live="polite">Checking live delivery charge...</p>}
                    {deliveryCharge !== null && !quoteLoading && <p aria-live="polite">Live delivery charge: <strong>{deliveryCharge === null ? "?" : `BDT ${deliveryCharge.toLocaleString("bn-BD")}`}</strong></p>}

                    <div className="field-group">
                      <label>Detailed address (house, road, landmark) *</label>
                      <textarea required rows={4} value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="House, road, area, and a nearby landmark" style={{ lineHeight: "1.5", fontSize: "0.9rem" }} />
                    </div>
                  </div>

                  {/* Step 3: Payment Method */}
                  <div className="form-step-card">
                    <h2 className="step-heading">
                      <span className="step-num">3</span>
                      পেমেন্ট পদ্ধতি
                    </h2>

                    <div className="payment-methods-stack">
                      <div className="payment-option selected">
                        <div>
                          <strong>Cash on Delivery (COD)</strong>
                          <span>Pay when your order is delivered.</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={!items.length || submitting || quoteLoading || deliveryCharge === null || !cityId || !zoneId || !areaId}
                    className="place-order-submit-btn"
                  >
                    {submitting
                      ? "অর্ডার প্রসেস হচ্ছে..."
                      : `অর্ডার কনফার্ম করুন · ৳${grandTotal.toLocaleString("bn-BD")}`}
                  </button>
                </form>
              </div>

              {/* Order Summary Sidebar */}
              <aside className="checkout-summary-sidebar">
                <h2 className="summary-head-title">
                  <span>অর্ডার সারাংশ</span>
                  <span className="count-tag">{items.length}টি পণ্য</span>
                </h2>

                {/* Items List */}
                <div className="summary-items-list">
                  {items.map((item) => {
                    const price = Number(item.discount_price || item.price);
                    const imageSrc = item.images[0]?.card_image || item.images[0]?.hero_desktop || item.images[0]?.image;

                    return (
                      <div key={item.id} className="summary-item-row">
                        <div className="summary-img-box">
                          {imageSrc ? (
                            <img src={imageSrc} alt="" />
                          ) : (
                            <div className="summary-fallback-icon">🛍️</div>
                          )}
                        </div>
                        <div className="summary-item-info">
                          <h4>{item.name}</h4>
                          <span>পরিমাণ: {item.quantity}</span>
                        </div>
                        <strong className="summary-item-price">
                          ৳{(price * item.quantity).toLocaleString("bn-BD")}
                        </strong>
                      </div>
                    );
                  })}
                </div>

                {/* Coupon Code Input */}
                <div className="coupon-input-box">
                  <label>প্রোমো / কুপন কোড</label>
                  <div className="coupon-form-inline">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="কুপন কোড (যেমন: ALORCHOYA)"
                      disabled={couponApplied}
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponApplied}
                      className={couponApplied ? "applied" : ""}
                    >
                      {couponApplied ? "প্রযুক্ত" : "আবেদন"}
                    </button>
                  </div>
                  {couponError && <span className="coupon-err">{couponError}</span>}
                  {couponApplied && <span className="coupon-success">✓ ১০% ছাড় যুক্ত করা হয়েছে!</span>}
                </div>

                {/* Cost Calculations */}
                <div className="cost-breakdown">
                  <div className="cost-row">
                    <span>সাবটোটাল</span>
                    <span>৳{total.toLocaleString("bn-BD")}</span>
                  </div>
                  <div className="cost-row">
                    <span>ডেলিভারি চার্জ</span>
                    <strong>{deliveryCharge === null ? "?" : `BDT ${deliveryCharge.toLocaleString("bn-BD")}`}</strong>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="cost-row discount">
                      <span>কুপন ছাড়</span>
                      <span>-৳{couponDiscount.toLocaleString("bn-BD")}</span>
                    </div>
                  )}
                  <hr />
                  <div className="cost-row grand-total">
                    <span>সর্বমোট</span>
                    <span className="grand-price">৳{grandTotal.toLocaleString("bn-BD")}</span>
                  </div>
                </div>

                <div className="checkout-trust-notice">
                  🚚 পণ্য ডেলিভারির সময় সর্বোচ্চ যত্ন ও নিরাপত্তা নিশ্চিত করা হয়।
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        .checkout-page-wrapper {
          padding: 40px 16px 80px;
          background-color: #f8fafc;
          min-height: 85vh;
        }
        .checkout-container {
          max-width: 1100px;
          margin: 0 auto;
        }
        .checkout-header-text {
          margin-bottom: 32px;
          text-align: center;
        }
        .checkout-badge {
          font-size: 0.85rem;
          font-weight: 700;
          color: #10b981;
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }
        .checkout-title {
          margin: 6px 0;
          font-size: 2rem;
          font-weight: 800;
          color: #0f172a;
        }
        .checkout-sub {
          margin: 0;
          color: #64748b;
          font-size: 0.95rem;
        }
        .google-notice-bar {
          background-color: #fffbebe6;
          border: 1px solid #fef3c7;
          color: #b45309;
          padding: 12px 16px;
          border-radius: 10px;
          margin-bottom: 24px;
          font-size: 0.9rem;
        }
        .order-success-card {
          background-color: #ffffff;
          border-radius: 20px;
          padding: 50px 30px;
          text-align: center;
          max-width: 580px;
          margin: 20px auto;
          box-shadow: 0 10px 30px rgba(0,0,0,0.06);
          border: 1px solid #e2e8f0;
        }
        .success-icon-box {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background-color: #d1fae5;
          color: #059669;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 2.2rem;
          margin-bottom: 20px;
        }
        .order-success-card h2 {
          margin: 0 0 10px;
          font-size: 1.75rem;
          font-weight: 800;
          color: #0f172a;
        }
        .order-success-card p {
          color: #475569;
          font-size: 1rem;
          line-height: 1.6;
          margin-bottom: 24px;
        }
        .order-success-card strong {
          color: #10b981;
          font-size: 1.1rem;
        }
        .back-home-btn {
          display: inline-block;
          background-color: #10b981;
          color: #ffffff;
          font-weight: 700;
          font-size: 1rem;
          padding: 14px 32px;
          border-radius: 12px;
          text-decoration: none;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
        }
        .checkout-grid-layout {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 32px;
          align-items: start;
        }
        .checkout-form-stack {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .user-logged-card {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }
        .user-avatar-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
          overflow: hidden;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(16, 185, 129, 0.2);
        }
        .user-avatar-circle img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .user-account-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .user-account-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .user-display-name {
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;
        }
        .verified-chip {
          font-size: 0.75rem;
          font-weight: 600;
          color: #059669;
          background-color: #d1fae5;
          padding: 2px 8px;
          border-radius: 12px;
        }
        .user-email-text {
          font-size: 0.85rem;
          color: #64748b;
        }
        .guest-login-bar {
          background-color: #ffffff;
          border-radius: 12px;
          padding: 14px 20px;
          border: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }
        .guest-login-text strong {
          font-size: 0.95rem;
          color: #0f172a;
          display: block;
        }
        .guest-login-text span {
          font-size: 0.82rem;
          color: #64748b;
        }
        .google-chip-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background-color: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 8px 14px;
          font-weight: 600;
          font-size: 0.85rem;
          color: #334155;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }
        .google-chip-btn:hover {
          background-color: #f8fafc;
        }
        .g-mark {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: #4285f4;
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.75rem;
        }
        .checkout-error-box {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 14px 18px;
          border-radius: 12px;
          font-size: 0.92rem;
          font-weight: 500;
        }
        .checkout-form-body {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .form-step-card {
          background-color: #ffffff;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 10px rgba(0,0,0,0.02);
        }
        .step-heading {
          margin: 0 0 18px;
          font-size: 1.15rem;
          font-weight: 700;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .step-num {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background-color: #ecfdf5;
          color: #10b981;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
        }
        .contact-inputs-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .full-width {
          grid-column: 1 / -1;
        }
        .field-group label, .field-label {
          font-size: 0.88rem;
          font-weight: 600;
          color: #334155;
        }
        .field-group input, .field-group textarea, .field-group select, .coupon-form-inline input {
          padding: 12px 14px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          font-size: 0.95rem;
          outline: none;
          font-family: inherit;
        }
        .zone-selector-wrapper {
          margin-bottom: 18px;
        }
        .zones-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 8px;
        }
        .zone-card {
          padding: 14px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          background-color: #ffffff;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 4px;
          transition: all 0.15s ease;
        }
        .zone-card.selected {
          border: 2px solid #10b981;
          background-color: #f0fdf4;
        }
        .zone-name {
          font-weight: 700;
          font-size: 0.95rem;
          color: #1e293b;
        }
        .zone-card.selected .zone-name {
          color: #065f46;
        }
        .zone-charge {
          font-size: 0.85rem;
          color: #64748b;
        }
        .zone-card.selected .zone-charge {
          color: #047857;
        }
        .payment-methods-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .payment-option {
          padding: 14px 18px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          background-color: #ffffff;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }
        .payment-option.selected {
          border: 2px solid #10b981;
          background-color: #f0fdf4;
        }
        .payment-option strong {
          display: block;
          font-size: 0.95rem;
          color: #0f172a;
        }
        .payment-option span {
          font-size: 0.82rem;
          color: #64748b;
        }
        .place-order-submit-btn {
          width: 100%;
          background-color: #10b981;
          color: #ffffff;
          font-weight: 800;
          font-size: 1.1rem;
          padding: 16px 24px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35);
        }
        .place-order-submit-btn:disabled {
          background-color: #94a3b8;
          cursor: not-allowed;
          box-shadow: none;
        }
        .checkout-summary-sidebar {
          background-color: #ffffff;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.04);
          position: sticky;
          top: 90px;
        }
        .summary-head-title {
          margin: 0 0 16px;
          font-size: 1.2rem;
          font-weight: 700;
          color: #0f172a;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .count-tag {
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 400;
        }
        .summary-items-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 20px;
        }
        .summary-item-row {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .summary-img-box {
          width: 52px;
          height: 52px;
          border-radius: 8px;
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          flex-shrink: 0;
        }
        .summary-img-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .summary-fallback-icon {
          display: grid;
          place-items: center;
          height: 100%;
        }
        .summary-item-info {
          flex: 1;
          min-width: 0;
        }
        .summary-item-info h4 {
          margin: 0;
          font-size: 0.88rem;
          font-weight: 600;
          color: #1e293b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .summary-item-info span {
          font-size: 0.78rem;
          color: #64748b;
        }
        .summary-item-price {
          font-size: 0.92rem;
          color: #0f172a;
        }
        .coupon-input-box {
          padding: 14px 0;
          border-top: 1px solid #f1f5f9;
          border-bottom: 1px solid #f1f5f9;
          margin-bottom: 16px;
        }
        .coupon-input-box label {
          font-size: 0.82rem;
          font-weight: 600;
          color: #475569;
          display: block;
          margin-bottom: 6px;
        }
        .coupon-form-inline {
          display: flex;
          gap: 8px;
        }
        .coupon-form-inline input {
          flex: 1;
          padding: 8px 12px;
          font-size: 0.88rem;
          text-transform: uppercase;
        }
        .coupon-form-inline button {
          padding: 8px 14px;
          border-radius: 8px;
          background-color: #1e293b;
          color: #fff;
          font-weight: 600;
          font-size: 0.85rem;
          border: none;
          cursor: pointer;
        }
        .coupon-form-inline button.applied {
          background-color: #10b981;
          cursor: default;
        }
        .coupon-err {
          color: #ef4444;
          font-size: 0.78rem;
          margin-top: 4px;
          display: block;
        }
        .coupon-success {
          color: #10b981;
          font-size: 0.8rem;
          margin-top: 4px;
          display: block;
          font-weight: 600;
        }
        .cost-breakdown {
          display: flex;
          flex-direction: column;
          gap: 10px;
          color: #475569;
          font-size: 0.92rem;
        }
        .cost-row {
          display: flex;
          justify-content: space-between;
        }
        .cost-row.discount {
          color: #10b981;
          font-weight: 600;
        }
        .cost-row.grand-total {
          color: #0f172a;
          font-size: 1.25rem;
          font-weight: 800;
        }
        .grand-price {
          color: #059669;
        }
        .cost-breakdown hr {
          border: none;
          border-top: 1px solid #cbd5e1;
          margin: 6px 0;
        }
        .checkout-trust-notice {
          margin-top: 20px;
          padding: 12px;
          border-radius: 8px;
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          font-size: 0.8rem;
          color: #64748b;
          text-align: center;
        }

        /* Responsive Breakpoints */
        @media (max-width: 900px) {
          .checkout-grid-layout {
            grid-template-columns: 1fr;
          }
          .checkout-summary-sidebar {
            position: static;
          }
        }
        @media (max-width: 600px) {
          .contact-inputs-grid, .zones-grid {
            grid-template-columns: 1fr;
          }
          .checkout-title {
            font-size: 1.5rem;
          }
          .google-quick-box {
            flex-direction: column;
            align-items: flex-start;
          }
          .google-connect-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
}
