"use client";

import React, { useState, useRef, useEffect } from "react";
import { HelpCircle } from "lucide-react";

export const FINANCIAL_DEFINITIONS: Record<string, { title: string; definition: string }> = {
  revenue: {
    title: "Total Revenue (মোট বিক্রি / টার্নওভার)",
    definition: "সফলভাবে সম্পন্ন হওয়া সমস্ত অর্ডারের মোট বিক্রয়মূল্য। স্টোরে কাস্টমারদের দেওয়া মূল টাকার সমষ্টি।",
  },
  cogs: {
    title: "COGS / Cost of Goods Sold (পণ্যের ক্রয় খরচ)",
    definition: "যেসব পণ্য বিক্রি হয়েছে, সেগুলো পাইকারি কেনা বা প্রস্তুত করতে আপনার সরাসরি যে মূলধন খরচ হয়েছিল।",
  },
  gross_profit: {
    title: "Gross Profit (মোট অর্জিত লাভ)",
    definition: "পণ্য বিক্রি করার পর পণ্যের মূল ক্রয় খরচ (COGS) বাদ দিলে আপনার কাছে যে মূল মুনাফা অবশিষ্ট থাকে।",
  },
  gross_margin: {
    title: "Gross Margin (মোট লাভের হার %)",
    definition: "মোট বিক্রির কত শতাংশ টাকা আপনার ব্যবসায়ে প্রকৃত লাভ বা মুনাফা হিসেবে থাকে।",
  },
  locked_capital: {
    title: "Stock Capital Locked (ইনভেন্টরিতে আটকে থাকা মূলধন)",
    definition: "বর্তমানে গুদামে অবিক্রীত স্টকের পেছনে আপনার যে পরিমাণ নগদ টাকা আটকে রয়েছে। এটি আপনার ব্যবসায়িক ওয়ার্কিং ক্যাপিটাল।",
  },
  potential_turnover: {
    title: "Potential Retail Turnover (সম্ভাব্য মোট বিক্রয়মূল্য)",
    definition: "বর্তমানে স্টকে থাকা সব পণ্য যদি বর্তমান রিটেল মূল্যে সম্পূর্ণ বিক্রি হয়ে যায়, তাহলে সর্বমোট কত টাকা ক্যাশ আসবে।",
  },
  potential_profit: {
    title: "Expected Catalog Profit (স্টক থেকে সম্ভাব্য মোট লাভ)",
    definition: "স্টকে থাকা সমস্ত পণ্য সম্পূর্ণ বিক্রি হলে ক্রয়মূল্য বাদ দিয়ে সর্বমোট কত টাকা নিট লাভ অর্জিত হতে পারে।",
  },
  unit_profit: {
    title: "Unit Profit (প্রতি পিসে একক লাভ)",
    definition: "একটি নির্দিষ্ট পণ্য ১ পিস বিক্রি করলে ক্রয় খরচ বাদ দিয়ে আপনার কাছে নিট কত টাকা লাভ থাকে।",
  },
  markup: {
    title: "Markup on Cost (মার্কআপ / ইনভেস্টমেন্টের উপর লাভ %)",
    definition: "ক্রয়মূল্যের কত শতাংশ বাড়িয়ে আপনি পণ্যটির বিক্রয়মূল্য নির্ধারণ করেছেন (ROI)।",
  },
  effective_price: {
    title: "Effective Selling Price (কার্যকরী বিক্রয়মূল্য)",
    definition: "কাস্টমার বাস্তবে যে মূল্যে পণ্যটি ক্রয় করেন (অফার বা সেল প্রাইস থাকলে সেটি, না থাকলে রেগুলার বেস প্রাইস)।",
  },
};

interface FinancialTooltipProps {
  termKey?: string;
  title?: string;
  definition?: string;
  children: React.ReactNode;
  align?: "auto" | "left" | "right" | "center";
  className?: string;
  showIcon?: boolean;
}

export default function FinancialTooltip({
  termKey,
  title,
  definition,
  children,
  align = "auto",
  className = "",
  showIcon = true,
}: FinancialTooltipProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  const preset = termKey ? FINANCIAL_DEFINITIONS[termKey] : null;
  const dTitle = title || preset?.title || "Financial Metric (আর্থিক তথ্য)";
  const dDef =
    definition ||
    preset?.definition ||
    "পণ্য ক্রয়-বিক্রয়ের তথ্যের ভিত্তিতে তৈরি করা হিসাব।";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  const getAlignStyle = (): React.CSSProperties => {
    if (align === "left") return { left: 0, transform: "none" };
    if (align === "right") return { right: 0, transform: "none" };
    if (align === "center") return { left: "50%", transform: "translateX(-50%)" };
    return { left: "50%", transform: "translateX(-50%)" };
  };

  return (
    <span
      ref={containerRef}
      className={`relative inline-flex items-center gap-1 cursor-pointer select-none ${className}`}
      style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={(e) => {
        e.stopPropagation();
        setOpen((v) => !v);
      }}
    >
      <span style={{ borderBottom: "1px dotted #8faf9b", transition: "color 0.2s" }}>
        {children}
      </span>
      {showIcon && (
        <HelpCircle size={14} style={{ color: "#8faf9b", flexShrink: 0 }} />
      )}

      {open && (
        <div
          role="tooltip"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            zIndex: 9999,
            bottom: "calc(100% + 8px)",
            width: "280px",
            maxWidth: "90vw",
            background: "#173f35",
            color: "#fff",
            padding: "12px 14px",
            borderRadius: "14px",
            boxShadow: "0 14px 35px rgba(0,0,0,0.25)",
            border: "1px solid rgba(201, 164, 92, 0.3)",
            fontSize: "12px",
            textAlign: "left",
            fontFamily: "sans-serif",
            pointerEvents: "auto",
            ...getAlignStyle(),
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.12)", paddingBottom: "6px" }}>
            <span style={{ fontWeight: 800, fontSize: "11px", color: "#c9a45c" }}>
              {dTitle}
            </span>
            <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.5px", background: "rgba(201,164,92,0.18)", color: "#f7f1e5", padding: "2px 6px", borderRadius: "10px" }}>
              মেট্রিক
            </span>
          </div>

          <p style={{ marginTop: "8px", margin: "8px 0 0", color: "#f7f1e5", lineHeight: 1.5, fontSize: "11px", fontWeight: 400 }}>
            {dDef}
          </p>
        </div>
      )}
    </span>
  );
}
