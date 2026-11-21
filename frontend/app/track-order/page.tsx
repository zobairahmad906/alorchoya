"use client";

import { FormEvent, useState } from "react";
import { Header } from "../components";

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

const labels: Record<string, string> = {
  pending: "অপেক্ষমাণ (Pending)",
  confirmed: "নিশ্চিত (Confirmed)",
  processing: "প্রস্তুত হচ্ছে (Processing)",
  paid: "পেমেন্ট সম্পন্ন (Paid)",
  shipped: "শিপ করা হয়েছে (Shipped)",
  delivered: "ডেলিভারি সম্পন্ন (Delivered)",
  cancelled: "বাতিল (Cancelled)",
};

const steps = ["pending", "confirmed", "processing", "shipped", "delivered"];

function toEnglishDigits(str: string): string {
  const bn = "০১২৩৪৫৬৭৮৯";
  return str.replace(/[০-৯]/g, (d) => String(bn.indexOf(d)));
}

export default function TrackOrderPage() {
  const [result, setResult] = useState<{ id: number; status: string; total: string; created_at: string } | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setMessage("");
    setResult(null);
    setLoading(true);

    try {
      const rawId = String(data.get("id") || "").trim();
      const rawPhone = String(data.get("phone") || "").trim();

      const id = toEnglishDigits(rawId).replace(/\D/g, "");
      const phone = toEnglishDigits(rawPhone).replace(/[^\d+]/g, "");

      if (!id && !phone) {
        throw new Error("অর্ডার নম্বর অথবা ফোন নম্বর দিন।");
      }

      const queryParams = new URLSearchParams();
      if (id) queryParams.set("id", id);
      if (phone) queryParams.set("phone", phone);

      const endpoint = typeof window !== "undefined" && window.location.origin
        ? `${window.location.origin}/api/orders/track/?${queryParams.toString()}`
        : `${API}/orders/track/?${queryParams.toString()}`;

      const response = await fetch(endpoint, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail || "অর্ডার পাওয়া যায়নি। তথ্য সঠিক কিনা চেক করুন।");
      }
      setResult(body);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "অর্ডার পাওয়া যায়নি।");
    } finally {
      setLoading(false);
    }
  };

  const currentStep = result ? steps.indexOf(result.status) : -1;

  return (
    <>
      <Header />
      <main className="tracking-page">
        <div className="tracking-shell">
          <section className="tracking-hero">
            <div>
              <span className="checkout-kicker">অর্ডার ট্র্যাকিং</span>
              <h1>আপনার অর্ডার কোথায় আছে?</h1>
              <p>অর্ডার নম্বর ও ফোন নম্বর দিয়ে আপনার অর্ডারের বর্তমান অবস্থা দেখুন।</p>
            </div>
            <div className="tracking-illustration">
              📦<span>→</span>🚚<span>→</span>🏠
            </div>
          </section>

          <section className="tracking-card">
            <div className="tracking-card-heading">
              <div>
                <span>সহজ ও নিরাপদ</span>
                <h2>অর্ডারের তথ্য দিন</h2>
              </div>
              <span className="tracking-lock">🔒</span>
            </div>
            <form className="tracking-form" onSubmit={submit}>
              <label>
                অর্ডার নম্বর
                <input required name="id" inputMode="numeric" placeholder="যেমন: 123 বা ১২৩" />
              </label>
              <label>
                অর্ডারের ফোন নম্বর
                <input required name="phone" inputMode="tel" placeholder="যেমন: 017XXXXXXXX" />
              </label>
              <button type="submit" className="place-order-btn" disabled={loading}>
                {loading ? "খোঁজা হচ্ছে..." : "অর্ডার ট্র্যাক করুন →"}
              </button>
            </form>
            {message && (
              <p className="tracking-error" style={{ color: "#ef4444", marginTop: "14px", fontWeight: 700 }}>
                ⚠️ {message}
              </p>
            )}
          </section>

          {result && (
            <section className="tracking-result">
              <div className="tracking-result-head">
                <div>
                  <span>অর্ডার #{result.id}</span>
                  <h2>{labels[result.status] || result.status}</h2>
                </div>
                <strong>৳{Number(result.total).toLocaleString("bn-BD")}</strong>
              </div>
              <div className="tracking-timeline">
                {steps.map((step, index) => (
                  <div
                    className={`tracking-step ${
                      result.status === "cancelled" ? "cancelled" : index <= currentStep ? "done" : ""
                    }`}
                    key={step}
                  >
                    <span>{index <= currentStep && result.status !== "cancelled" ? "✓" : index + 1}</span>
                    <div>
                      <b>{labels[step]}</b>
                      {index === currentStep && <small>বর্তমান অবস্থা</small>}
                    </div>
                  </div>
                ))}
              </div>
              <p className="tracking-date">
                অর্ডার করা হয়েছে: {new Date(result.created_at).toLocaleString("bn-BD")}
              </p>
            </section>
          )}

          <p className="tracking-help">
            অর্ডার নম্বর খুঁজে না পেলে এসএমএস/ইনভয়েস বা হেল্পলাইনে (01302 111188) যোগাযোগ করুন।
          </p>
        </div>
      </main>
    </>
  );
}
