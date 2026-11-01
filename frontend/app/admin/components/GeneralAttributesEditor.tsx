"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  Tag,
  Plus,
  X,
  SlidersHorizontal,
  Edit3,
  ClipboardPaste,
} from "lucide-react";

export function parseAttributesText(text: any): Record<string, string> {
  if (!text) return {};
  if (typeof text === "object" && !Array.isArray(text)) return text;

  const raw = String(text).trim();
  if (!raw) return {};

  const result: Record<string, string> = {};

  if (raw.includes("\n")) {
    const lines = raw.split(/\r?\n+/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const colonIdx = trimmed.indexOf(":");
      if (colonIdx > 0) {
        const key = trimmed.slice(0, colonIdx).trim();
        const val = trimmed.slice(colonIdx + 1).trim();
        if (key && val) {
          result[key] = val;
        }
      }
    }
    return result;
  }

  const regex = /([^:;,]+?)\s*:\s*([^;]+?)(?=(?:[,;]\s*[^:;,]+?:|$))/g;
  let match;
  let matchedAny = false;
  while ((match = regex.exec(raw)) !== null) {
    const key = match[1].trim();
    let val = match[2].trim();
    if (val.endsWith(",")) val = val.slice(0, -1).trim();
    if (key && val) {
      result[key] = val;
      matchedAny = true;
    }
  }

  if (matchedAny) return result;

  const colonIdx = raw.indexOf(":");
  if (colonIdx > 0) {
    const key = raw.slice(0, colonIdx).trim();
    const val = raw.slice(colonIdx + 1).trim();
    if (key && val) {
      result[key] = val;
    }
  }

  return result;
}

export function formatAttributesObject(attrs: any, separator = "\n"): string {
  if (!attrs || typeof attrs !== "object") return "";
  return Object.entries(attrs)
    .map(([key, value]) => `${key}: ${value}`)
    .join(separator);
}

const COMMON_PRESETS = [
  { key: "Fabric", val: "100% Cotton" },
  { key: "Fit", val: "Regular Fit" },
  { key: "Pattern", val: "Embroidered / Solid" },
  { key: "Origin", val: "Bangladesh" },
  { key: "Care", val: "Dry Clean / Machine Wash" },
  { key: "Gender", val: "Men / Women" },
];

interface GeneralAttributesEditorProps {
  value?: string;
  onChange?: (val: string) => void;
}

export default function GeneralAttributesEditor({
  value = "",
  onChange,
}: GeneralAttributesEditorProps) {
  const [smartInput, setSmartInput] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [valInput, setValInput] = useState("");
  const [isRawMode, setIsRawMode] = useState(false);
  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [bulkPasteText, setBulkPasteText] = useState("");

  const parsedAttributes = useMemo(() => {
    return parseAttributesText(value);
  }, [value]);

  const attributeEntries = useMemo(() => {
    return Object.entries(parsedAttributes);
  }, [parsedAttributes]);

  const importParsedBlock = (textToParse: string) => {
    const parsed = parseAttributesText(textToParse);
    if (!parsed || Object.keys(parsed).length === 0) return 0;
    const updated = { ...parsedAttributes, ...parsed };
    onChange?.(formatAttributesObject(updated, "\n"));
    return Object.keys(parsed).length;
  };

  const handleSmartSubmit = () => {
    const raw = smartInput.trim();
    if (!raw) return;

    if (raw.includes(":") || raw.includes("\n")) {
      const count = importParsedBlock(raw);
      if (count > 0) {
        setSmartInput("");
        return;
      }
    }

    if (keyInput.trim() && valInput.trim()) {
      const updated = { ...parsedAttributes, [keyInput.trim()]: valInput.trim() };
      onChange?.(formatAttributesObject(updated, "\n"));
      setKeyInput("");
      setValInput("");
      return;
    }

    const colonIdx = raw.indexOf(":");
    if (colonIdx > 0) {
      const k = raw.slice(0, colonIdx).trim();
      const v = raw.slice(colonIdx + 1).trim();
      if (k && v) {
        const updated = { ...parsedAttributes, [k]: v };
        onChange?.(formatAttributesObject(updated, "\n"));
        setSmartInput("");
      }
    } else {
      setKeyInput(raw);
      setSmartInput("");
    }
  };

  const handleSmartKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSmartSubmit();
    }
  };

  const handleAddAttribute = (k: string, v: string) => {
    const key = k.trim();
    const val = v.trim();
    if (!key || !val) return;
    const updated = { ...parsedAttributes, [key]: val };
    onChange?.(formatAttributesObject(updated, "\n"));
    setKeyInput("");
    setValInput("");
  };

  const handleRemoveAttribute = (keyToRemove: string) => {
    const updated = { ...parsedAttributes };
    delete updated[keyToRemove];
    onChange?.(formatAttributesObject(updated, "\n"));
  };

  return (
    <div
      style={{
        borderRadius: "16px",
        border: "1px solid var(--line)",
        background: "#fff",
        padding: "16px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          borderBottom: "1px solid var(--line)",
          paddingBottom: "12px",
          marginBottom: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: "rgba(23,63,53,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--forest)",
            }}
          >
            <SlidersHorizontal size={15} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--forest)" }}>
              বৈশিষ্ট্য ও স্পেসিফিকেশন (Attributes - {attributeEntries.length})
            </h4>
            <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b" }}>
              কী: ভ্যালু লিখে Enter চাপুন (যেমন: Fabric: Cotton)
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            type="button"
            onClick={() => setShowBulkPaste((prev) => !prev)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              borderRadius: "8px",
              fontSize: "11px",
              fontWeight: 600,
              background: showBulkPaste ? "var(--forest)" : "var(--cream)",
              color: showBulkPaste ? "#fff" : "var(--forest)",
              border: "1px solid var(--line)",
              cursor: "pointer",
            }}
          >
            <ClipboardPaste size={12} />
            {showBulkPaste ? "প্যানেল বন্ধ করুন" : "বাল্ক স্পেক্স পেস্ট"}
          </button>

          <button
            type="button"
            onClick={() => setIsRawMode((prev) => !prev)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              borderRadius: "8px",
              fontSize: "11px",
              fontWeight: 600,
              background: "transparent",
              color: "var(--coffee)",
              border: "1px solid var(--line)",
              cursor: "pointer",
            }}
          >
            <Edit3 size={11} />
            {isRawMode ? "চিপস মোড" : "র' টেক্সট"}
          </button>
        </div>
      </div>

      {/* Bulk Paste Box */}
      {showBulkPaste && (
        <div
          style={{
            marginBottom: "14px",
            padding: "12px",
            background: "var(--cream)",
            borderRadius: "12px",
            border: "1px dashed var(--gold)",
          }}
        >
          <p style={{ margin: "0 0 6px", fontSize: "12px", fontWeight: 700, color: "var(--forest)" }}>
            একাধিক লাইন স্পেসিফিকেশন পেস্ট করুন (Format: Key: Value):
          </p>
          <textarea
            value={bulkPasteText}
            onChange={(e) => setBulkPasteText(e.target.value)}
            rows={4}
            placeholder={`Fabric: 100% Cotton\nFit: Slim Fit\nColor: Deep Navy\nCare: Machine Wash`}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid var(--line)",
              fontFamily: "monospace",
              fontSize: "12px",
              outline: "none",
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
            <button
              type="button"
              onClick={() => setBulkPasteText("")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid var(--line)",
                background: "#fff",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              মুছুন
            </button>
            <button
              type="button"
              onClick={() => {
                importParsedBlock(bulkPasteText);
                setBulkPasteText("");
                setShowBulkPaste(false);
              }}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                border: "none",
                background: "var(--forest)",
                color: "#fff",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              যোগ করুন
            </button>
          </div>
        </div>
      )}

      {/* Raw Mode or Visual Chips */}
      {isRawMode ? (
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          rows={4}
          placeholder="Fabric: Cotton&#10;Color: Black"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "10px",
            borderRadius: "10px",
            border: "1px solid var(--line)",
            fontFamily: "monospace",
            fontSize: "13px",
            outline: "none",
          }}
        />
      ) : (
        <div>
          {/* Smart Add Bar */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                type="text"
                value={smartInput}
                onChange={(e) => setSmartInput(e.target.value)}
                onKeyDown={handleSmartKeyDown}
                placeholder="যেমন: Fabric: Cotton অথবা Size: XL লিখে Enter চাপুন"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "8px 12px",
                  borderRadius: "10px",
                  border: "1px solid var(--line)",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>
            <button
              type="button"
              onClick={handleSmartSubmit}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "8px 16px",
                borderRadius: "10px",
                border: "none",
                background: "var(--forest)",
                color: "#fff",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Plus size={14} /> যোগ করুন
            </button>
          </div>

          {/* Quick Presets */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>দ্রুত প্রিসেট:</span>
            {COMMON_PRESETS.map((p) => {
              const alreadyHas = !!parsedAttributes[p.key];
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handleAddAttribute(p.key, p.val)}
                  style={{
                    padding: "3px 8px",
                    borderRadius: "6px",
                    border: "1px solid var(--line)",
                    background: alreadyHas ? "rgba(23,63,53,0.08)" : "#fff",
                    color: alreadyHas ? "var(--forest)" : "#475569",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  + {p.key}
                </button>
              );
            })}
          </div>

          {/* Rendered Chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", minHeight: "36px" }}>
            {attributeEntries.length === 0 ? (
              <span style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic", alignSelf: "center" }}>
                কোনো বৈশিষ্ট্য যোগ করা হয়নি। উপরের বক্সে লিখে সহজে যোগ করুন।
              </span>
            ) : (
              attributeEntries.map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 10px",
                    borderRadius: "10px",
                    background: "var(--cream)",
                    border: "1px solid var(--line)",
                    fontSize: "12px",
                    color: "var(--forest)",
                    fontWeight: 600,
                  }}
                >
                  <Tag size={12} style={{ color: "var(--gold)" }} />
                  <span>
                    <strong style={{ color: "var(--ink)" }}>{k}:</strong> {v}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttribute(k)}
                    style={{
                      border: "none",
                      background: "none",
                      color: "#dc2626",
                      cursor: "pointer",
                      padding: "0 2px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
