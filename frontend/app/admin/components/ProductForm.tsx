"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Save,
  Plus,
  Trash2,
  Lock,
  Unlock,
  AlertTriangle,
  Wallet,
  Layers,
  Camera,
  Image as ImageIcon,
  Star,
  Mic,
  Volume2,
  X,
  Upload,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import WordLikeEditor from "./WordLikeEditor";
import GeneralAttributesEditor, { parseAttributesText, formatAttributesObject } from "./GeneralAttributesEditor";
import FinancialTooltip from "./FinancialTooltip";

const skuAliases: Record<string, string> = {
  "পাঞ্জাবি": "PNJ",
  "পাঞ্জাবী": "PNJ",
  panjabi: "PNJ",
  punjabi: "PNJ",
  mobile: "MOB",
  "মোবাইল": "MOB",
  shirt: "SHT",
  "শার্ট": "SHT",
  tshirt: "TSH",
  saree: "SRE",
  "শাড়ি": "SRE",
  honey: "HNY",
  "মধু": "HNY",
  ghee: "GHE",
  "ঘি": "GHE",
  oil: "OIL",
  "তেল": "OIL",
};

export function suggestBaseSku(name: string, category: string): string {
  const replaceAliases = (value: string) =>
    Object.entries(skuAliases).reduce(
      (result, [source, target]) => result.replaceAll(source, target),
      String(value || "").toLowerCase()
    );
  const words = replaceAliases(name).match(/[a-z0-9]+/g) || [];
  const categoryToken = (replaceAliases(category).match(/[a-z0-9]+/g) || ["PRD"])[0]
    .slice(0, 3)
    .toUpperCase();
  if (!words.length) return "";
  const numericModel = [...words].reverse().find((word) => /\d/.test(word));
  const firstWord = words[0] || "";
  let model =
    words.length > 1
      ? words.slice(1, 3).join("").slice(0, 6).toUpperCase()
      : firstWord.slice(0, 6).toUpperCase();
  if (numericModel) {
    model = /^\d+$/.test(numericModel)
      ? (words[1] || firstWord).slice(0, 2).toUpperCase() + numericModel
      : numericModel.toUpperCase();
  }
  const candidate =
    words.length > 1
      ? firstWord.slice(0, 3).toUpperCase() + "-" + model
      : categoryToken + "-" + model;
  return candidate.replace(/[^A-Z0-9-]/g, "").slice(0, 15);
}

export function suggestVariantSku(baseSku: string, attributesText: string): string {
  const aliases: Record<string, string> = {
    black: "BLK",
    "কালো": "BLK",
    white: "WHT",
    "সাদা": "WHT",
    red: "RED",
    "লাল": "RED",
    blue: "BLU",
    "নীল": "BLU",
    green: "GRN",
    "সবুজ": "GRN",
  };
  const values = String(attributesText || "")
    .split(",")
    .map((entry) => (entry.includes(":") ? entry.split(":")[1]?.trim() : entry.trim()) || "")
    .filter(Boolean)
    .map((value) => {
      const normalized = aliases[value.toLowerCase()] || value;
      return normalized
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 6);
    });
  return [baseSku, ...values].filter(Boolean).join("-").slice(0, 100);
}

export interface VariantItem {
  id?: number;
  attributes_text?: string;
  attributes?: Record<string, string>;
  sku: string;
  price: string;
  stock: string;
}

export interface ExistingImageItem {
  id: number;
  image: string;
  alt_text?: string;
  is_primary?: boolean;
  variant_id?: number | null;
}

export interface ProductFormData {
  id?: number;
  name: string;
  category_id: number;
  base_sku: string;
  initial_stock: string;
  base_price: string;
  sale_price: string;
  cost_price: string;
  weight_kg: string;
  dimension_length_cm: string;
  dimension_width_cm: string;
  dimension_height_cm: string;
  status: "active" | "inactive";
  stock_alert_threshold: string;
  attributes_text: string;
  description: string;
  warranty_information: string;
  is_featured: boolean;
  voice_audio_file: File | null;
  voice_audio_file_url: string;
  remove_voice_audio: boolean;
  variants: VariantItem[];
}

interface ProductFormProps {
  initialProduct?: any;
  categories: { id: number; name: string }[];
  onSaveSuccess: () => void;
  onCancel: () => void;
  getApiUrl: (endpoint: string) => string;
}

export default function ProductForm({
  initialProduct,
  categories,
  onSaveSuccess,
  onCancel,
  getApiUrl,
}: ProductFormProps) {
  const isEdit = Boolean(initialProduct?.id);

  const [form, setForm] = useState<ProductFormData>({
    id: initialProduct?.id,
    name: initialProduct?.name || "",
    category_id: initialProduct?.category?.id || categories[0]?.id || 1,
    base_sku: initialProduct?.base_sku || "",
    initial_stock: initialProduct ? String(initialProduct.stock ?? 0) : "10",
    base_price: initialProduct ? String(initialProduct.price ?? "") : "",
    sale_price: initialProduct ? String(initialProduct.discount_price ?? "") : "",
    cost_price: initialProduct ? String(initialProduct.cost_price ?? "") : "",
    weight_kg: initialProduct ? String(initialProduct.weight_kg ?? "") : "",
    dimension_length_cm: initialProduct ? String(initialProduct.dimension_length_cm ?? "") : "",
    dimension_width_cm: initialProduct ? String(initialProduct.dimension_width_cm ?? "") : "",
    dimension_height_cm: initialProduct ? String(initialProduct.dimension_height_cm ?? "") : "",
    status: initialProduct?.is_active === false ? "inactive" : "active",
    stock_alert_threshold: initialProduct ? String(initialProduct.stock_alert_threshold ?? 5) : "5",
    attributes_text: initialProduct?.attributes
      ? formatAttributesObject(initialProduct.attributes, "\n")
      : "",
    description: initialProduct?.description || "",
    warranty_information: initialProduct?.warranty_information || "",
    is_featured: Boolean(initialProduct?.is_featured),
    voice_audio_file: null,
    voice_audio_file_url: initialProduct?.voice_audio_file || "",
    remove_voice_audio: false,
    variants: Array.isArray(initialProduct?.variants)
      ? initialProduct.variants.map((v: any) => ({
          id: v.id,
          attributes: v.attributes || {},
          attributes_text: formatAttributesObject(v.attributes, ", "),
          sku: v.sku || "",
          price: v.price != null ? String(v.price) : "",
          stock: v.stock != null ? String(v.stock) : "0",
        }))
      : [],
  });

  const [skuLocked, setSkuLocked] = useState(isEdit);
  const [skuTouched, setSkuTouched] = useState(Boolean(initialProduct?.base_sku));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Variants state
  const [variantDraft, setVariantDraft] = useState<VariantItem>({
    attributes_text: "",
    sku: "",
    price: "",
    stock: "0",
  });
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null);

  // Gallery state
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryDragging, setGalleryDragging] = useState(false);
  const [galleryVariantKey, setGalleryVariantKey] = useState<string>("");
  const [galleryFileAssignments, setGalleryFileAssignments] = useState<Record<string, string>>({});
  const [existingGallery, setExistingGallery] = useState<ExistingImageItem[]>(
    Array.isArray(initialProduct?.images) ? initialProduct.images : []
  );

  // Active modal for variant image assignment
  const [activeVariantModalIndex, setActiveVariantModalIndex] = useState<number | null>(null);

  // Real-time unit economics
  const financialMetrics = useMemo(() => {
    const base = parseFloat(form.base_price) || 0;
    const sale = parseFloat(form.sale_price) || 0;
    const cost = parseFloat(form.cost_price) || 0;
    const stock = parseFloat(form.initial_stock) || 0;

    const effectivePrice = sale > 0 ? sale : base;
    const hasPrices = effectivePrice > 0;
    const discount = base > 0 && sale > 0 && base > sale ? base - sale : 0;
    const discountPercent =
      base > 0 && discount > 0 ? Number(((discount / base) * 100).toFixed(1)) : 0;

    const unitProfit = cost > 0 && hasPrices ? effectivePrice - cost : null;
    const marginPercent =
      unitProfit !== null && effectivePrice > 0
        ? Number(((unitProfit / effectivePrice) * 100).toFixed(1))
        : null;
    const markupPercent =
      unitProfit !== null && cost > 0
        ? Number(((unitProfit / cost) * 100).toFixed(1))
        : null;
    const isLoss = unitProfit !== null && unitProfit < 0;

    const totalStockCost = cost > 0 && stock > 0 ? cost * stock : 0;
    const totalPotentialRevenue = hasPrices && stock > 0 ? effectivePrice * stock : 0;
    const totalPotentialProfit =
      totalStockCost > 0 && totalPotentialRevenue > 0
        ? totalPotentialRevenue - totalStockCost
        : 0;

    return {
      base,
      sale,
      cost,
      stock,
      effectivePrice,
      hasPrices,
      discount,
      discountPercent,
      unitProfit,
      marginPercent,
      markupPercent,
      isLoss,
      totalStockCost,
      totalPotentialRevenue,
      totalPotentialProfit,
    };
  }, [form.base_price, form.sale_price, form.cost_price, form.initial_stock]);

  const setValue = (key: keyof ProductFormData, val: any) => {
    setDirty(true);
    setForm((curr) => {
      const next = { ...curr, [key]: val };
      if (key === "name" && !skuTouched && !isEdit) {
        const catName = categories.find((c) => c.id === next.category_id)?.name || "";
        next.base_sku = suggestBaseSku(val, catName);
      }
      return next;
    });
  };

  const addGalleryFiles = (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (!imageFiles.length) return;
    setDirty(true);
    setGalleryFiles((curr) => {
      const updated = [...curr, ...imageFiles];
      setGalleryFileAssignments((prev) => {
        const next = { ...prev };
        updated.forEach((file, idx) => {
          const key = `${file.name}_${idx}`;
          if (next[key] === undefined) next[key] = galleryVariantKey;
        });
        return next;
      });
      return updated;
    });
  };

  // Variant operations
  const addOrUpdateVariant = () => {
    if (!variantDraft.attributes_text && !variantDraft.sku) {
      alert("Please provide variant attribute (e.g. Size: L) or SKU.");
      return;
    }
    setDirty(true);
    const newVariant: VariantItem = {
      ...variantDraft,
      attributes: parseAttributesText(variantDraft.attributes_text),
      sku: variantDraft.sku || suggestVariantSku(form.base_sku, variantDraft.attributes_text || ""),
    };

    if (editingVariantIndex !== null) {
      setForm((curr) => {
        const updated = [...curr.variants];
        updated[editingVariantIndex] = { ...updated[editingVariantIndex], ...newVariant };
        return { ...curr, variants: updated };
      });
      setEditingVariantIndex(null);
    } else {
      setForm((curr) => ({ ...curr, variants: [...curr.variants, newVariant] }));
    }

    setVariantDraft({ attributes_text: "", sku: "", price: "", stock: "0" });
  };

  const editVariantRow = (index: number) => {
    const v = form.variants[index];
    setVariantDraft({
      attributes_text: v.attributes_text || formatAttributesObject(v.attributes, ", "),
      sku: v.sku,
      price: v.price,
      stock: v.stock,
    });
    setEditingVariantIndex(index);
  };

  const updateInlineVariantField = (index: number, field: keyof VariantItem, val: string) => {
    setDirty(true);
    setForm((curr) => {
      const updated = [...curr.variants];
      updated[index] = { ...updated[index], [field]: val };
      if (field === "attributes_text") {
        updated[index].attributes = parseAttributesText(val);
      }
      return { ...curr, variants: updated };
    });
  };

  // Helper to get variant images
  const getVariantImages = (variant: VariantItem, index: number) => {
    const images: { type: string; id?: number; fileKey?: string; url: string }[] = [];
    const targetKey = variant?.id ? `id:${variant.id}` : String(index);

    existingGallery.forEach((img) => {
      if (img.variant_id && (img.variant_id === variant?.id || String(img.variant_id) === String(variant?.id))) {
        images.push({ type: "existing", id: img.id, url: img.image });
      }
    });

    galleryFiles.forEach((file, fileIdx) => {
      const fileKey = `${file.name}_${fileIdx}`;
      const assigned = galleryFileAssignments[fileKey] ?? galleryVariantKey;
      if (assigned === targetKey) {
        images.push({ type: "file", fileKey, url: URL.createObjectURL(file) });
      }
    });

    return images;
  };

  // Save product
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert("Product name is required.");
      return;
    }
    if (!form.base_price) {
      alert("Product regular price (Base Price) is required.");
      return;
    }

    setSaving(true);
    try {
      const cleanNum = (val: string) => (val === "" || val == null ? null : val);
      const payload: any = {
        name: form.name.trim(),
        category_id: form.category_id,
        base_sku: form.base_sku.trim(),
        stock: form.initial_stock === "" ? 0 : parseInt(form.initial_stock) || 0,
        base_price: form.base_price,
        sale_price: cleanNum(form.sale_price),
        cost_price: cleanNum(form.cost_price),
        weight_kg: cleanNum(form.weight_kg),
        dimension_length_cm: cleanNum(form.dimension_length_cm),
        dimension_width_cm: cleanNum(form.dimension_width_cm),
        dimension_height_cm: cleanNum(form.dimension_height_cm),
        status: form.status,
        stock_alert_threshold: form.stock_alert_threshold === "" ? 5 : parseInt(form.stock_alert_threshold) || 5,
        warranty_information: form.warranty_information || "",
        description: form.description || "",
        attributes: form.attributes_text ? parseAttributesText(form.attributes_text) : {},
        is_featured: form.is_featured,
        variants: form.variants.map((v) => ({
          ...(v.id ? { id: v.id } : {}),
          attributes: v.attributes_text ? parseAttributesText(v.attributes_text) : v.attributes || {},
          sku: (v.sku || "").trim(),
          price: cleanNum(v.price),
          stock: v.stock === "" ? 0 : parseInt(v.stock) || 0,
        })),
      };

      const url = isEdit ? getApiUrl(`/admin/products/${form.id}/`) : getApiUrl("/admin/products/");
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || "Failed to save product.");
        setSaving(false);
        return;
      }

      const savedProduct = await res.json();
      const prodId = savedProduct.id;

      // Upload voice audio if provided
      if (form.voice_audio_file && prodId) {
        const audioData = new FormData();
        audioData.append("voice_audio_file", form.voice_audio_file);
        await fetch(getApiUrl(`/admin/products/${prodId}/`), {
          method: "PATCH",
          credentials: "include",
          body: audioData,
        });
      } else if (form.remove_voice_audio && prodId) {
        await fetch(getApiUrl(`/admin/products/${prodId}/`), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ remove_voice_audio: true }),
        });
      }

      // Upload new gallery files with variant assignments
      if (galleryFiles.length > 0 && prodId) {
        const groupedFiles = new Map<string, File[]>();
        galleryFiles.forEach((file, idx) => {
          const fileKey = `${file.name}_${idx}`;
          const assignment = galleryFileAssignments[fileKey] ?? galleryVariantKey ?? "";
          let targetVarId = "";
          if (String(assignment).startsWith("id:")) {
            targetVarId = String(assignment).slice(3);
          } else if (assignment !== "") {
            const matchedVar = savedProduct?.variants?.[Number(assignment)];
            if (matchedVar?.id) targetVarId = String(matchedVar.id);
          }
          const groupList = groupedFiles.get(targetVarId) || [];
          groupList.push(file);
          groupedFiles.set(targetVarId, groupList);
        });

        for (const [vId, filesList] of Array.from(groupedFiles.entries())) {
          const imgFormData = new FormData();
          filesList.forEach((f) => imgFormData.append("images", f));
          if (vId) imgFormData.append("variant_id", vId);
          await fetch(getApiUrl(`/products/${prodId}/upload-images/`), {
            method: "POST",
            credentials: "include",
            body: imgFormData,
          });
        }
      }

      setSaving(false);
      onSaveSuccess();
    } catch (err) {
      alert("An error occurred while saving.");
      setSaving(false);
    }
  };

  // Image actions for existing images
  const handleDeleteExistingImage = async (imgId: number) => {
    if (!confirm("Are you sure you want to delete this image?")) return;
    try {
      const res = await fetch(getApiUrl(`/admin/products/images/${imgId}/`), {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setExistingGallery((prev) => prev.filter((img) => img.id !== imgId));
      }
    } catch {
      alert("Failed to delete image.");
    }
  };

  const handleSetPrimaryImage = async (imgId: number) => {
    try {
      const res = await fetch(getApiUrl(`/admin/products/images/${imgId}/`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_primary: true }),
      });
      if (res.ok) {
        setExistingGallery((prev) =>
          prev.map((img) => ({ ...img, is_primary: img.id === imgId }))
        );
      }
    } catch {
      alert("Failed to set primary image.");
    }
  };

  const handleUpdateImageVariant = async (imgId: number, variantIdStr: string) => {
    const val = variantIdStr === "" ? null : parseInt(variantIdStr);
    try {
      await fetch(getApiUrl(`/admin/products/images/${imgId}/`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ variant_id: val }),
      });
      setExistingGallery((prev) =>
        prev.map((img) => (img.id === imgId ? { ...img, variant_id: val } : img))
      );
    } catch {
      // ignore
    }
  };

  return (
    <div style={{ maxWidth: "980px", margin: "0 auto", paddingBottom: "40px" }}>
      {/* Top Banner Header */}
      <div
        style={{
          borderLeft: "6px solid var(--forest)",
          paddingLeft: "16px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2
              style={{
                fontFamily: "'Tiro Bangla', serif",
                fontSize: "26px",
                color: "var(--forest)",
                margin: 0,
              }}
            >
              {isEdit ? `Edit Product #${form.id}` : "Create New Product"}
            </h2>
            {dirty && (
              <span
                style={{
                  background: "#fff1f2",
                  color: "#be123c",
                  border: "1px solid #fecdd3",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "20px",
                }}
              >
                Unsaved Changes
              </span>
            )}
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--coffee)", opacity: 0.85 }}>
            Complete catalog specifications for AI customer search, live inventory, and automated sales.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "9px 18px",
              borderRadius: "10px",
              border: "1px solid var(--line)",
              background: "#fff",
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--forest)",
              cursor: "pointer",
            }}
          >
            Cancel / View Catalog
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 22px",
              borderRadius: "10px",
              border: "none",
              background: "var(--forest)",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(23,63,53,0.2)",
              opacity: saving ? 0.6 : 1,
            }}
          >
            <Save size={16} />
            {saving ? "Saving..." : isEdit ? "Update Product" : "Save Product"}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* SECTION 1: Basic Specifications */}
        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            border: "1px solid var(--line)",
            padding: "24px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 800,
              color: "var(--forest)",
              margin: "0 0 16px",
              paddingBottom: "10px",
              borderBottom: "1px solid var(--line)",
            }}
          >
            1. Basic Specs & Pricing
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--ink)", marginBottom: "6px" }}>
                Product Name <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Premium Cotton Panjabi / Notebook"
                value={form.name}
                onChange={(e) => setValue("name", e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--line)",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--ink)", marginBottom: "6px" }}>
                Category
              </label>
              <select
                value={form.category_id}
                onChange={(e) => setValue("category_id", parseInt(e.target.value))}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--line)",
                  fontSize: "14px",
                  outline: "none",
                  background: "#fff",
                }}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "14px",
              marginTop: "16px",
            }}
          >
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--ink)", marginBottom: "6px" }}>
                Initial Stock
              </label>
              <input
                type="number"
                min="0"
                value={form.initial_stock}
                onChange={(e) => setValue("initial_stock", e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--line)",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--ink)", marginBottom: "6px" }}>
                Regular Price (৳) <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={form.base_price}
                onChange={(e) => setValue("base_price", e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--line)",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--ink)", marginBottom: "6px" }}>
                Sale / Discount Price (৳)
              </label>
              <input
                type="number"
                step="any"
                placeholder="Optional discount price"
                value={form.sale_price}
                onChange={(e) => setValue("sale_price", e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--line)",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--forest)", marginBottom: "6px" }}>
                Cost / Wholesale Price (৳)
              </label>
              <input
                type="number"
                step="any"
                placeholder="Purchase cost"
                value={form.cost_price}
                onChange={(e) => setValue("cost_price", e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1.5px solid rgba(23,63,53,0.3)",
                  background: "rgba(23,63,53,0.03)",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Unit Economics & Profit Intelligence Card */}
          {(financialMetrics.hasPrices || financialMetrics.cost > 0) && (
            <div
              style={{
                marginTop: "16px",
                borderRadius: "14px",
                border: "1px solid var(--line)",
                background: "var(--cream)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  borderBottom: "1px solid var(--line)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Wallet size={15} style={{ color: "var(--forest)" }} />
                  <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--forest)" }}>
                    Real-time Unit Economics & Profit Analysis
                  </span>
                </div>
                {financialMetrics.discountPercent > 0 && (
                  <span
                    style={{
                      background: "#fef3c7",
                      color: "#92400e",
                      border: "1px solid #fde68a",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    {financialMetrics.discountPercent}% discount active
                  </span>
                )}
              </div>

              <div style={{ padding: "14px" }}>
                {financialMetrics.isLoss && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      background: "#fff1f2",
                      border: "1px solid #fecdd3",
                      borderRadius: "10px",
                      padding: "10px 12px",
                      marginBottom: "12px",
                      color: "#be123c",
                      fontSize: "12px",
                    }}
                  >
                    <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                    <div>
                      <strong>Warning: Selling price is lower than cost price!</strong>
                      <p style={{ margin: "2px 0 0" }}>
                        Effective price (৳{financialMetrics.effectivePrice.toFixed(2)}) is lower than cost (৳{financialMetrics.cost.toFixed(2)}). Unit loss: ৳{Math.abs(financialMetrics.unitProfit || 0).toFixed(2)}.
                      </p>
                    </div>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
                  <div style={{ background: "#fff", padding: "10px", borderRadius: "10px", border: "1px solid var(--line)" }}>
                    <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                      <FinancialTooltip termKey="effective_price">Effective Selling Price</FinancialTooltip>
                    </span>
                    <p style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: 900, color: "var(--ink)" }}>
                      ৳{financialMetrics.effectivePrice.toFixed(2)}
                    </p>
                    <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                      {financialMetrics.sale > 0 ? "From sale price" : "Regular price"}
                    </span>
                  </div>

                  <div style={{ background: "#fff", padding: "10px", borderRadius: "10px", border: "1px solid var(--line)" }}>
                    <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                      <FinancialTooltip termKey="unit_profit">Unit Profit</FinancialTooltip>
                    </span>
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: "16px",
                        fontWeight: 900,
                        color: financialMetrics.unitProfit === null ? "#94a3b8" : financialMetrics.isLoss ? "#dc2626" : "#16a34a",
                      }}
                    >
                      {financialMetrics.unitProfit !== null
                        ? `${financialMetrics.unitProfit >= 0 ? "+" : ""}৳${financialMetrics.unitProfit.toFixed(2)}`
                        : "—"}
                    </p>
                    <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                      {financialMetrics.marginPercent !== null
                        ? `${financialMetrics.marginPercent}% margin`
                        : "Enter cost price to calculate"}
                    </span>
                  </div>

                  <div style={{ background: "#fff", padding: "10px", borderRadius: "10px", border: "1px solid var(--line)" }}>
                    <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                      <FinancialTooltip termKey="markup">Markup (ROI %)</FinancialTooltip>
                    </span>
                    <p style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: 900, color: "var(--forest)" }}>
                      {financialMetrics.markupPercent !== null ? `${financialMetrics.markupPercent}%` : "—"}
                    </p>
                    <span style={{ fontSize: "10px", color: "#94a3b8" }}>Return on Investment</span>
                  </div>

                  <div style={{ background: "#fff", padding: "10px", borderRadius: "10px", border: "1px solid var(--line)" }}>
                    <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                      <FinancialTooltip termKey="locked_capital">Capital Locked in Stock</FinancialTooltip>
                    </span>
                    <p style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: 900, color: "var(--forest)" }}>
                      {financialMetrics.totalStockCost > 0 ? `৳${financialMetrics.totalStockCost.toLocaleString()}` : "—"}
                    </p>
                    <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                      {financialMetrics.totalPotentialProfit > 0
                        ? `Potential Profit: ৳${financialMetrics.totalPotentialProfit.toLocaleString()}`
                        : `${financialMetrics.stock} units in stock`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Base SKU with Lock & Auto Generator */}
          <div
            style={{
              marginTop: "16px",
              padding: "14px",
              borderRadius: "14px",
              background: "rgba(23,63,53,0.04)",
              border: "1px solid var(--line)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--forest)" }}>
                Base SKU{" "}
                <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b" }}>
                  {isEdit
                    ? skuLocked
                      ? "(Locked for reference protection)"
                      : "(Unlocked — changing SKU may affect references)"
                    : skuTouched
                    ? "(Custom SKU)"
                    : "(Auto-suggested from title)"}
                </span>
              </label>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {!isEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      const catName = categories.find((c) => c.id === form.category_id)?.name || "";
                      const suggested = suggestBaseSku(form.name, catName);
                      setForm((curr) => ({ ...curr, base_sku: suggested }));
                      setSkuTouched(false);
                    }}
                    style={{
                      border: "none",
                      background: "none",
                      color: "var(--forest)",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    Auto-Suggest SKU
                  </button>
                )}

                {isEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      if (skuLocked && !confirm("Warning: Changing the Base SKU may affect existing references. Are you sure you want to unlock?")) {
                        return;
                      }
                      setSkuLocked((prev) => !prev);
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      border: "1px solid var(--line)",
                      background: skuLocked ? "#e2e8f0" : "#fef3c7",
                      color: skuLocked ? "#475569" : "#92400e",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {skuLocked ? <Lock size={12} /> : <Unlock size={12} />}
                    {skuLocked ? "Unlock SKU" : "Unlocked"}
                  </button>
                )}
              </div>
            </div>

            <input
              type="text"
              readOnly={Boolean(isEdit && skuLocked)}
              value={form.base_sku}
              onChange={(e) => {
                setSkuTouched(true);
                setValue("base_sku", e.target.value.toUpperCase());
              }}
              placeholder="e.g. PNJ-COT01"
              style={{
                marginTop: "8px",
                width: "100%",
                boxSizing: "border-box",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid var(--line)",
                fontFamily: "monospace",
                fontSize: "13px",
                textTransform: "uppercase",
                background: isEdit && skuLocked ? "#f1f5f9" : "#fff",
                outline: "none",
              }}
            />
          </div>

          {/* Status & Shipping Dimensions */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "12px",
              marginTop: "16px",
            }}
          >
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--ink)", marginBottom: "4px" }}>
                Product Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setValue("status", e.target.value as "active" | "inactive")}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  fontSize: "13px",
                  outline: "none",
                  background: "#fff",
                }}
              >
                <option value="active">Active (Visible in AI search & storefront)</option>
                <option value="inactive">Inactive (Hidden)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--ink)", marginBottom: "4px" }}>
                Weight (kg)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0.000"
                value={form.weight_kg}
                onChange={(e) => setValue("weight_kg", e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--ink)", marginBottom: "4px" }}>
                Length (cm)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={form.dimension_length_cm}
                onChange={(e) => setValue("dimension_length_cm", e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--ink)", marginBottom: "4px" }}>
                Width (cm)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={form.dimension_width_cm}
                onChange={(e) => setValue("dimension_width_cm", e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--ink)", marginBottom: "4px" }}>
                Height (cm)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={form.dimension_height_cm}
                onChange={(e) => setValue("dimension_height_cm", e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--ink)", marginBottom: "4px" }}>
                Low Stock Alert Threshold
              </label>
              <input
                type="number"
                min="0"
                placeholder="5"
                value={form.stock_alert_threshold}
                onChange={(e) => setValue("stock_alert_threshold", e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Attributes & Rich Description */}
        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            border: "1px solid var(--line)",
            padding: "24px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 800,
              color: "var(--forest)",
              margin: "0 0 16px",
              paddingBottom: "10px",
              borderBottom: "1px solid var(--line)",
            }}
          >
            2. Attributes & Rich Description
          </h3>

          <div style={{ marginBottom: "16px" }}>
            <GeneralAttributesEditor
              value={form.attributes_text}
              onChange={(val) => setValue("attributes_text", val)}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--forest)", marginBottom: "6px" }}>
              Detailed Description (Rich Text Editor)
            </label>
            <WordLikeEditor
              value={form.description}
              onChange={(val) => setValue("description", val)}
              placeholder="Enter detailed product specs, fabric/materials, usage, size guide, etc..."
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--forest)", marginBottom: "6px" }}>
              Warranty Information
            </label>
            <textarea
              rows={2}
              value={form.warranty_information}
              onChange={(e) => setValue("warranty_information", e.target.value)}
              placeholder="e.g. 7-day replacement warranty or standard brand warranty"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid var(--line)",
                fontSize: "13px",
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* SECTION 3: Product Call Confirmation Voice Audio */}
        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            border: "1px solid var(--line)",
            padding: "24px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "rgba(23,63,53,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--forest)",
                }}
              >
                <Mic size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "var(--forest)" }}>
                  Product Voice Audio (Call Confirmation)
                </h4>
                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b" }}>
                  Plays this custom audio clip when a customer orders this product (MP3 / WAV).
                </p>
              </div>
            </div>

            {(form.voice_audio_file || form.voice_audio_file_url) && (
              <button
                type="button"
                onClick={() =>
                  setForm((curr) => ({
                    ...curr,
                    voice_audio_file: null,
                    voice_audio_file_url: "",
                    remove_voice_audio: true,
                  }))
                }
                style={{
                  border: "none",
                  background: "none",
                  color: "#dc2626",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Delete Audio
              </button>
            )}
          </div>

          {form.voice_audio_file ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 14px",
                borderRadius: "10px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#166534",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              <Volume2 size={16} />
              <span>{form.voice_audio_file.name}</span>
              <span style={{ marginLeft: "auto", fontSize: "11px", color: "#64748b", fontWeight: 400 }}>
                (Will upload upon saving)
              </span>
            </div>
          ) : form.voice_audio_file_url ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                borderRadius: "10px",
                background: "var(--cream)",
                border: "1px solid var(--line)",
              }}
            >
              <audio controls style={{ height: "32px", maxWidth: "280px" }} src={form.voice_audio_file_url} />
              <label
                style={{
                  marginLeft: "auto",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--forest)",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Change Audio
                <input
                  type="file"
                  accept="audio/mp3,audio/wav,audio/mpeg,audio/ogg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setForm((curr) => ({ ...curr, voice_audio_file: file, remove_voice_audio: false }));
                  }}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          ) : (
            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "14px",
                borderRadius: "10px",
                border: "1.5px dashed var(--line)",
                background: "rgba(23,63,53,0.02)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <Volume2 size={16} style={{ color: "var(--forest)" }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--forest)" }}>
                Select Custom Voice Audio (Optional)
              </span>
              <input
                type="file"
                accept="audio/mp3,audio/wav,audio/mpeg,audio/ogg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setForm((curr) => ({ ...curr, voice_audio_file: file, remove_voice_audio: false }));
                }}
                style={{ display: "none" }}
              />
            </label>
          )}
        </div>

        {/* SECTION 4: Product Variants Manager */}
        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            border: "1px solid var(--line)",
            padding: "24px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", borderBottom: "1px solid var(--line)", paddingBottom: "10px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "var(--forest)", display: "flex", alignItems: "center", gap: "6px" }}>
                <Layers size={18} />
                Product Variants ({form.variants.length})
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b" }}>
                Add size or color variants with independent pricing, stock, and SKU tracking.
              </p>
            </div>
          </div>

          {/* Variant Draft Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "8px",
              padding: "12px",
              borderRadius: "12px",
              background: "var(--cream)",
              border: "1px solid var(--line)",
              marginBottom: "14px",
            }}
          >
            <input
              type="text"
              placeholder="Size: L, Color: Deep Black"
              value={variantDraft.attributes_text}
              onChange={(e) => setVariantDraft({ ...variantDraft, attributes_text: e.target.value })}
              style={{
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid var(--line)",
                fontSize: "12px",
                outline: "none",
                background: "#fff",
              }}
            />

            <div style={{ display: "flex", gap: "4px" }}>
              <input
                type="text"
                placeholder="Variant SKU (auto)"
                value={variantDraft.sku}
                onChange={(e) => setVariantDraft({ ...variantDraft, sku: e.target.value.toUpperCase() })}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  fontFamily: "monospace",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  outline: "none",
                  background: "#fff",
                }}
              />
              <button
                type="button"
                title="Suggest Variant SKU"
                onClick={() => {
                  const suggested = suggestVariantSku(form.base_sku || suggestBaseSku(form.name, ""), variantDraft.attributes_text || "");
                  setVariantDraft((curr) => ({ ...curr, sku: suggested }));
                }}
                style={{
                  padding: "6px 10px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  background: "#fff",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--forest)",
                  cursor: "pointer",
                }}
              >
                Auto
              </button>
            </div>

            <input
              type="number"
              step="any"
              min="0"
              placeholder={`Price (৳${form.sale_price || form.base_price || "Base"})`}
              value={variantDraft.price}
              onChange={(e) => setVariantDraft({ ...variantDraft, price: e.target.value })}
              style={{
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid var(--line)",
                fontSize: "12px",
                outline: "none",
                background: "#fff",
              }}
            />

            <div style={{ display: "flex", gap: "6px" }}>
              <input
                type="number"
                min="0"
                placeholder="Stock"
                value={variantDraft.stock}
                onChange={(e) => setVariantDraft({ ...variantDraft, stock: e.target.value })}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  fontSize: "12px",
                  outline: "none",
                  background: "#fff",
                }}
              />
              <button
                type="button"
                onClick={addOrUpdateVariant}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: "none",
                  background: "var(--forest)",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <Plus size={14} />
                {editingVariantIndex !== null ? "Update" : "Add Variant"}
              </button>
            </div>
          </div>

          {/* Variants List / Table */}
          {form.variants.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {form.variants.map((variant, index) => {
                const vImages = getVariantImages(variant, index);
                const primaryUrl = vImages[0]?.url;

                return (
                  <div
                    key={variant.id || index}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "40px 1.5fr 1.2fr 100px 90px auto",
                      gap: "8px",
                      alignItems: "center",
                      padding: "8px 10px",
                      borderRadius: "10px",
                      background: "#fafafa",
                      border: "1px solid var(--line)",
                      fontSize: "12px",
                    }}
                  >
                    {/* Variant Image Trigger Button */}
                    <button
                      type="button"
                      title="Set or change variant image"
                      onClick={() => setActiveVariantModalIndex(index)}
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        border: "1px solid var(--line)",
                        background: "#fff",
                        padding: 0,
                        overflow: "hidden",
                        position: "relative",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {primaryUrl ? (
                        <>
                          <img src={primaryUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          {vImages.length > 1 && (
                            <span
                              style={{
                                position: "absolute",
                                bottom: 0,
                                right: 0,
                                background: "var(--forest)",
                                color: "#fff",
                                fontSize: "9px",
                                fontWeight: 800,
                                padding: "1px 3px",
                                borderTopLeftRadius: "4px",
                              }}
                            >
                              {vImages.length}
                            </span>
                          )}
                        </>
                      ) : (
                        <Camera size={14} style={{ color: "#94a3b8" }} />
                      )}
                    </button>

                    <input
                      type="text"
                      value={variant.attributes_text || formatAttributesObject(variant.attributes, ", ")}
                      onChange={(e) => updateInlineVariantField(index, "attributes_text", e.target.value)}
                      placeholder="Size: L, Color: Navy"
                      style={{
                        padding: "6px 8px",
                        borderRadius: "6px",
                        border: "1px solid var(--line)",
                        fontSize: "12px",
                        outline: "none",
                      }}
                    />

                    <input
                      type="text"
                      value={variant.sku}
                      onChange={(e) => updateInlineVariantField(index, "sku", e.target.value.toUpperCase())}
                      placeholder="SKU"
                      style={{
                        padding: "6px 8px",
                        borderRadius: "6px",
                        border: "1px solid var(--line)",
                        fontFamily: "monospace",
                        fontSize: "12px",
                        textTransform: "uppercase",
                        outline: "none",
                      }}
                    />

                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={variant.price}
                      onChange={(e) => updateInlineVariantField(index, "price", e.target.value)}
                      placeholder={`৳${form.sale_price || form.base_price || "Base"}`}
                      style={{
                        padding: "6px 8px",
                        borderRadius: "6px",
                        border: "1px solid var(--line)",
                        fontSize: "12px",
                        outline: "none",
                      }}
                    />

                    <input
                      type="number"
                      min="0"
                      value={variant.stock}
                      onChange={(e) => updateInlineVariantField(index, "stock", e.target.value)}
                      placeholder="Stock"
                      style={{
                        padding: "6px 8px",
                        borderRadius: "6px",
                        border: "1px solid var(--line)",
                        fontSize: "12px",
                        fontWeight: 600,
                        outline: "none",
                      }}
                    />

                    <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        onClick={() => editVariantRow(index)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: "6px",
                          border: "1px solid var(--line)",
                          background: "#fff",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "var(--forest)",
                          cursor: "pointer",
                        }}
                      >
                        Draft
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDirty(true);
                          setForm((curr) => ({
                            ...curr,
                            variants: curr.variants.filter((_, i) => i !== index),
                          }));
                        }}
                        style={{
                          padding: "4px 6px",
                          borderRadius: "6px",
                          border: "1px solid #fecdd3",
                          background: "#fff",
                          color: "#ef4444",
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 5: Product & Variant Images Gallery */}
        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            border: "1px solid var(--line)",
            padding: "24px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", borderBottom: "1px solid var(--line)", paddingBottom: "10px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "var(--forest)", display: "flex", alignItems: "center", gap: "6px" }}>
                <ImageIcon size={18} />
                Product & Variant Images Gallery
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b" }}>
                Upload images directly from your device and tag them to variants as needed.
              </p>
            </div>
          </div>

          {/* Existing Attached Images */}
          {isEdit && existingGallery.length > 0 && (
            <div style={{ marginBottom: "18px" }}>
              <p style={{ margin: "0 0 8px", fontSize: "12px", fontWeight: 700, color: "var(--forest)" }}>
                Attached Images ({existingGallery.length}):
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "10px" }}>
                {existingGallery.map((img) => (
                  <div
                    key={img.id}
                    style={{
                      borderRadius: "10px",
                      border: "1px solid var(--line)",
                      background: "#fff",
                      overflow: "hidden",
                      position: "relative",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div style={{ position: "relative", width: "100%", height: "110px", background: "#f8fafc" }}>
                      <img src={img.image} alt={img.alt_text || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {img.is_primary && (
                        <span
                          style={{
                            position: "absolute",
                            top: "4px",
                            left: "4px",
                            background: "var(--forest)",
                            color: "#fff",
                            fontSize: "9px",
                            fontWeight: 800,
                            padding: "2px 6px",
                            borderRadius: "10px",
                          }}
                        >
                          Primary
                        </span>
                      )}
                      <div style={{ position: "absolute", top: "4px", right: "4px", display: "flex", gap: "4px" }}>
                        <button
                          type="button"
                          title="Set as Primary Image"
                          onClick={() => handleSetPrimaryImage(img.id)}
                          style={{
                            padding: "3px 4px",
                            borderRadius: "4px",
                            background: img.is_primary ? "#f59e0b" : "rgba(255,255,255,0.9)",
                            color: img.is_primary ? "#fff" : "#475569",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          <Star size={11} />
                        </button>
                        <button
                          type="button"
                          title="Delete Image"
                          onClick={() => handleDeleteExistingImage(img.id)}
                          style={{
                            padding: "3px 4px",
                            borderRadius: "4px",
                            background: "rgba(255,255,255,0.9)",
                            color: "#dc2626",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                    <div style={{ padding: "6px" }}>
                      <select
                        value={img.variant_id ?? ""}
                        onChange={(e) => handleUpdateImageVariant(img.id, e.target.value)}
                        style={{
                          width: "100%",
                          fontSize: "10px",
                          padding: "4px",
                          borderRadius: "4px",
                          border: "1px solid var(--line)",
                        }}
                      >
                        <option value="">General Product Image</option>
                        {form.variants.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.attributes_text || v.sku || `Variant #${v.id}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Image Upload Field */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--ink)", marginBottom: "4px" }}>
                Select New Images
              </label>
              <label
                onDragOver={(e) => { e.preventDefault(); setGalleryDragging(true); }}
                onDragEnter={(e) => { e.preventDefault(); setGalleryDragging(true); }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setGalleryDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setGalleryDragging(false);
                  addGalleryFiles(e.dataTransfer.files);
                }}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: "6px", minHeight: "100px", padding: "14px", borderRadius: "10px",
                  border: `2px dashed ${galleryDragging ? "var(--emerald)" : "var(--line)"}`,
                  background: galleryDragging ? "#ecfdf5" : "#fff", color: "var(--coffee)", cursor: "pointer",
                  textAlign: "center", transition: "background 120ms, border-color 120ms",
                }}
              >
                <Upload size={20} color="var(--emerald)" />
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--forest)" }}>
                  {galleryDragging ? "Drop images to add them" : "Drag and drop images here, or click to browse"}
                </span>
                <span style={{ fontSize: "11px" }}>You can select multiple images</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    addGalleryFiles(e.target.files || []);
                    e.currentTarget.value = "";
                  }}
                  style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
                  aria-label="Select product images"
                />
              </label>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--ink)", marginBottom: "4px" }}>
                Default Assignment for New Images
              </label>
              <select
                value={galleryVariantKey}
                onChange={(e) => setGalleryVariantKey(e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "8px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  fontSize: "12px",
                  background: "#fff",
                }}
              >
                <option value="">General Product Image (All Variants)</option>
                {form.variants.map((v, idx) => (
                  <option key={v.id || idx} value={v.id ? `id:${v.id}` : String(idx)}>
                    {v.attributes_text || v.sku || `Variant ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Upload Queue Thumbnails */}
          {galleryFiles.length > 0 && (
            <div style={{ marginTop: "14px" }}>
              <p style={{ margin: "0 0 6px", fontSize: "11px", fontWeight: 700, color: "var(--forest)" }}>
                Staged Images for Upload ({galleryFiles.length}):
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "8px" }}>
                {galleryFiles.map((file, idx) => {
                  const fileKey = `${file.name}_${idx}`;
                  const assignedKey = galleryFileAssignments[fileKey] ?? galleryVariantKey;
                  const previewUrl = URL.createObjectURL(file);

                  return (
                    <div
                      key={fileKey}
                      style={{
                        borderRadius: "8px",
                        border: "1px solid var(--line)",
                        background: "#fff",
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      <div style={{ position: "relative", width: "100%", height: "90px" }}>
                        <img src={previewUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button
                          type="button"
                          onClick={() => {
                            setDirty(true);
                            setGalleryFiles((curr) => curr.filter((_, i) => i !== idx));
                          }}
                          style={{
                            position: "absolute",
                            top: "3px",
                            right: "3px",
                            background: "rgba(0,0,0,0.6)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "50%",
                            width: "18px",
                            height: "18px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <X size={10} />
                        </button>
                      </div>
                      <div style={{ padding: "4px" }}>
                        <select
                          value={assignedKey}
                          onChange={(e) => {
                            setDirty(true);
                            setGalleryFileAssignments((prev) => ({ ...prev, [fileKey]: e.target.value }));
                          }}
                          style={{
                            width: "100%",
                            fontSize: "10px",
                            padding: "3px",
                            borderRadius: "4px",
                            border: "1px solid var(--line)",
                          }}
                        >
                          <option value="">General Product Image</option>
                          {form.variants.map((v, vIdx) => (
                            <option key={v.id || vIdx} value={v.id ? `id:${v.id}` : String(vIdx)}>
                              {v.attributes_text || v.sku || `Variant ${vIdx + 1}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "10px",
            paddingTop: "16px",
            borderTop: "1px solid var(--line)",
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "10px 24px",
              borderRadius: "10px",
              border: "1px solid var(--line)",
              background: "#fff",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--forest)",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 32px",
              borderRadius: "10px",
              border: "none",
              background: "var(--forest)",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(23,63,53,0.2)",
              opacity: saving ? 0.6 : 1,
            }}
          >
            <Save size={16} />
            {saving ? "Saving..." : isEdit ? "Update Product" : "Save Product"}
          </button>
        </div>
      </form>

      {/* Variant Image Selector Modal */}
      {activeVariantModalIndex !== null && form.variants[activeVariantModalIndex] && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "18px",
              maxWidth: "520px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: "12px", marginBottom: "16px" }}>
              <div>
                <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "var(--forest)" }}>
                  Variant Image Assignment
                </h4>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--coffee)" }}>
                  {form.variants[activeVariantModalIndex].attributes_text ||
                    form.variants[activeVariantModalIndex].sku ||
                    `Variant #${activeVariantModalIndex + 1}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveVariantModalIndex(null)}
                style={{ border: "none", background: "none", fontSize: "18px", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <div>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--forest)", marginBottom: "8px" }}>
                Upload a new image directly for this variant:
              </p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (!files.length) return;
                  const targetVar = form.variants[activeVariantModalIndex];
                  const targetKey = targetVar.id ? `id:${targetVar.id}` : String(activeVariantModalIndex);
                  setDirty(true);
                  setGalleryFiles((curr) => {
                    const updated = [...curr, ...files];
                    setGalleryFileAssignments((prev) => {
                      const next = { ...prev };
                      files.forEach((file, idx) => {
                        const k = `${file.name}_${curr.length + idx}`;
                        next[k] = targetKey;
                      });
                      return next;
                    });
                    return updated;
                  });
                }}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "8px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  fontSize: "12px",
                }}
              />
            </div>

            {/* Currently assigned to this variant */}
            <div style={{ marginTop: "16px" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--forest)", marginBottom: "8px" }}>
                Images currently linked to this variant:
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: "8px" }}>
                {getVariantImages(form.variants[activeVariantModalIndex], activeVariantModalIndex).map((img, i) => (
                  <div
                    key={i}
                    style={{
                      height: "80px",
                      borderRadius: "8px",
                      border: "1px solid var(--line)",
                      overflow: "hidden",
                    }}
                  >
                    <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
                {getVariantImages(form.variants[activeVariantModalIndex], activeVariantModalIndex).length === 0 && (
                  <span style={{ fontSize: "11px", color: "#94a3b8", fontStyle: "italic", gridColumn: "1/-1" }}>
                    No images assigned yet.
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
              <button
                type="button"
                onClick={() => setActiveVariantModalIndex(null)}
                style={{
                  padding: "8px 18px",
                  borderRadius: "8px",
                  border: "none",
                  background: "var(--forest)",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
