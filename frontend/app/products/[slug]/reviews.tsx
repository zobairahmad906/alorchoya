"use client";

import { useState, useEffect, type FormEvent } from "react";
import type { Product, Review } from "../../types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

type Account = { authenticated: boolean; name?: string; email?: string; profile?: { avatar_url?: string } };

export function ProductReviews({ product }: { product: Product }) {
  const [reviewsList, setReviewsList] = useState<Review[]>(product.reviews || []);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [customerName, setCustomerName] = useState("");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Authentication state
  const [account, setAccount] = useState<Account | null>(null);
  const [csrfToken, setCsrfToken] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Fetch Auth & CSRF status on mount
  useEffect(() => {
    fetch(`${API}/auth/csrf/`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setCsrfToken(data.csrfToken || ""))
      .catch(() => {});

    fetch(`${API}/auth/me/`, { credentials: "include" })
      .then((res) => res.json())
      .then((data: Account) => {
        setAccount(data);
        if (data.authenticated && data.name) {
          setCustomerName(data.name);
        }
      })
      .catch(() => setAccount({ authenticated: false }));
  }, []);

  // Calculate statistics
  const totalCount = reviewsList.length;
  const avgRating = totalCount > 0
    ? (reviewsList.reduce((acc, curr) => acc + curr.rating, 0) / totalCount).toFixed(1)
    : "5.0";

  const ratingCounts = {
    5: reviewsList.filter(r => r.rating === 5).length,
    4: reviewsList.filter(r => r.rating === 4).length,
    3: reviewsList.filter(r => r.rating === 3).length,
    2: reviewsList.filter(r => r.rating === 2).length,
    1: reviewsList.filter(r => r.rating === 1).length,
  };

  const ratingLabels: Record<number, string> = {
    5: "অসাধারণ (৫ স্টার)",
    4: "খুব ভালো (৪ স্টার)",
    3: "মোটামুটি (৩ স্টার)",
    2: "উন্নতি দরকার (২ স্টার)",
    1: "খারাপ (১ স্টার)",
  };

  const handleFormSubmitClick = (event: FormEvent) => {
    event.preventDefault();

    // If user is not logged in AND hasn't entered a name, pop up authentication / guest modal
    if (!account?.authenticated && !customerName.trim()) {
      setShowAuthModal(true);
      return;
    }

    executeSubmit();
  };

  const executeSubmit = async (guestNameOverride?: string) => {
    if (!comment.trim()) return;

    setSending(true);
    setMessage("");

    const finalName = guestNameOverride || customerName.trim() || (account?.name) || "সন্তুষ্ট কাস্টমার";
    const avatarUrl = account?.profile?.avatar_url || "";

    try {
      const response = await fetch(`${API}/products/${product.slug}/reviews/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
        },
        body: JSON.stringify({
          customer_name: finalName,
          avatar_url: avatarUrl,
          rating: Number(rating),
          comment: comment.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "রিভিউ জমা দেওয়া সম্ভব হয়নি।");
      }

      setMessage("✅ ধন্যবাদ! আপনার মতামত ও রেটিং সফলভাবে প্রকাশিত হয়েছে।");
      
      const newReviewObj: Review = {
        id: data.id || Date.now(),
        customer_name: finalName,
        avatar_url: avatarUrl,
        rating: Number(rating),
        comment: comment.trim(),
        created_at: new Date().toISOString(),
      };

      setReviewsList(prev => [newReviewObj, ...prev]);
      setComment("");
      setRating(5);
      setShowAuthModal(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "রিভিউ জমা দেওয়া সম্ভব হয়নি। আবার চেষ্টা করুন।");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="reviews-section-container">
      <div className="section-head">
        <h2>⭐ কাস্টমার রিভিউ ও রেটিং</h2>
        <p>আমাদের পণ্য সম্পর্কে অন্যান্য ক্রেতাদের সতস্ফূর্ত অনুভূতি ও মতামত</p>
      </div>

      {/* Rating Summary Dashboard */}
      <div className="rating-summary-card">
        <div className="overall-score-box">
          <span className="big-score">{avgRating}</span>
          <div className="stars-row gold">
            {[1, 2, 3, 4, 5].map(star => (
              <span key={star} className={star <= Math.round(Number(avgRating)) ? "star-filled" : "star-empty"}>
                ★
              </span>
            ))}
          </div>
          <span className="total-reviews-count">{totalCount}টি ক্রেতার রিভিউ</span>
        </div>

        {/* Rating Bars Breakdown */}
        <div className="rating-bars-breakdown">
          {[5, 4, 3, 2, 1].map(num => {
            const count = ratingCounts[num as keyof typeof ratingCounts] || 0;
            const pct = totalCount > 0 ? (count / totalCount) * 100 : num === 5 ? 100 : 0;
            return (
              <div key={num} className="bar-row">
                <span className="bar-label">{num} ★</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="bar-count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Submission Form */}
      <div className="review-form-card">
        <div className="form-card-header">
          <div>
            <h3>📝 আপনার মতামত ও রেটিং দিন</h3>
            <p className="form-subtitle">পণ্যটি ব্যবহারের অভিজ্ঞতা শেয়ার করে অন্যান্য ক্রেতাদের সাহায্য করুন</p>
          </div>
          {account?.authenticated && (
            <span className="user-logged-badge">
              {account.profile?.avatar_url ? (
                <img src={account.profile.avatar_url} alt="" className="badge-avatar-img" />
              ) : (
                <span className="badge-avatar-initial">{(account.name || "U").charAt(0).toUpperCase()}</span>
              )}
              <span>{account.name || account.email}</span>
            </span>
          )}
        </div>

        <form onSubmit={handleFormSubmitClick}>
          <div className="form-group">
            <label className="field-label">আপনার স্টার রেটিং নির্বাচন করুন:</label>
            <div className="interactive-star-input">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  className={`star-btn ${star <= (hoverRating || rating) ? "active" : ""}`}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  aria-label={`${star} Star`}
                >
                  ★
                </button>
              ))}
              <span className="star-feedback-label">
                {ratingLabels[hoverRating || rating]}
              </span>
            </div>
          </div>

          {!account?.authenticated && (
            <div className="form-group">
              <label htmlFor="rev-name" className="field-label">আপনার নাম:</label>
              <input
                id="rev-name"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="যেমন: তানজিলা পারভীন"
                className="styled-input"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="rev-comment" className="field-label">আপনার মতামত বা রিভিউ লিখুন *:</label>
            <textarea
              id="rev-comment"
              required
              minLength={4}
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="পণ্যটির গুণমান, ফিনিশিং ও ডেলিভারি সেবা কেমন লেগেছে লিখুন..."
              className="styled-textarea"
            />
          </div>

          <button type="submit" className="btn-submit-review" disabled={sending}>
            {sending ? "জমা দেওয়া হচ্ছে..." : "✨ মতামত জমা দিন"}
          </button>

          {message && <p className="review-alert-msg">{message}</p>}
        </form>
      </div>

      {/* Published Customer Reviews List */}
      <div className="published-reviews-container">
        <h3 className="list-title">💬 সাম্প্রতিক কাস্টমার মতামত ({reviewsList.length})</h3>

        {reviewsList.length > 0 ? (
          <div className="review-cards-grid">
            {reviewsList.map((rev, idx) => {
              const initial = rev.customer_name ? rev.customer_name.trim().charAt(0).toUpperCase() : "ক";
              const avatarToDisplay = rev.avatar_url || (account?.authenticated && account.name === rev.customer_name ? account.profile?.avatar_url : "");
              return (
                <article key={rev.id || idx} className="review-card-item">
                  <div className="review-card-header">
                    {avatarToDisplay ? (
                      <img src={avatarToDisplay} alt={rev.customer_name} className="avatar-img" />
                    ) : (
                      <div className="avatar-circle">{initial}</div>
                    )}
                    <div className="reviewer-meta">
                      <div className="name-row">
                        <strong className="reviewer-name">{rev.customer_name || "সন্তুষ্ট কাস্টমার"}</strong>
                        <span className="verified-badge">✓ ভেরিফাইড ক্রেতা</span>
                      </div>
                      <div className="stars-row gold mini">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className={star <= rev.rating ? "star-filled" : "star-empty"}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="review-comment-body">{rev.comment}</p>

                  <div className="review-card-footer">
                    <span className="review-date">
                      {rev.created_at
                        ? new Date(rev.created_at).toLocaleDateString("bn-BD", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "সম্প্রতি"}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-reviews-box">
            <span className="empty-icon">🌟</span>
            <p>এখনও কোনো রিভিউ নেই। আপনিই প্রথম আপনার মূল্যবান মতামত প্রকাশ করুন!</p>
          </div>
        )}
      </div>

      {/* Sign Up / Login / Guest Choice Modal Popup */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-x" onClick={() => setShowAuthModal(false)}>✕</button>

            <div className="modal-header">
              <span className="modal-icon">🔐</span>
              <h3>লগইন বা একাউন্ট নির্বাচন করুন</h3>
              <p>রিভিউ পোস্ট করার জন্য সাইন-ইন করুন অথবা নাম দিয়ে অতি সহজেই রিভিউ দিন</p>
            </div>

            <div className="modal-options-list">
              {/* Option 1: Google One-Click Login */}
              <button
                type="button"
                className="auth-option-btn google-btn"
                onClick={() => {
                  window.location.href = `${API}/auth/google/start/?next=${encodeURIComponent(window.location.pathname)}`;
                }}
              >
                <span className="auth-btn-icon">🌐</span>
                <span>Google একাউন্ট দিয়ে এক-ক্লিকে লগইন করুন</span>
              </button>

              <div className="modal-divider"><span>অথবা</span></div>

              {/* Option 2: Quick Name Entry */}
              <div className="guest-entry-box">
                <label className="field-label">আপনার নাম লিখুন:</label>
                <div className="guest-input-row">
                  <input
                    type="text"
                    placeholder="যেমন: মোঃ সাব্বির হোসেন"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="styled-input"
                  />
                  <button
                    type="button"
                    className="btn-submit-review"
                    onClick={() => {
                      if (customerName.trim()) {
                        executeSubmit(customerName.trim());
                      }
                    }}
                  >
                    পোস্ট করুন →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
