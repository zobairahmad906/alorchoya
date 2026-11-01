"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  CheckSquare,
  Clock,
  Cpu,
  ExternalLink,
  Eye,
  FileImage,
  Filter,
  Grid,
  ImagePlus,
  Info,
  Link2,
  List,
  Loader2,
  Package,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Square,
  Trash2,
  Unlink,
  UploadCloud,
  X,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

export type ImageAssetLink = {
  id: number;
  asset_id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  variant_label?: string | null;
  position: number;
  created_at: string;
};

export type ProductImageAsset = {
  id: number;
  image: string;
  filename: string;
  alt_text: string;
  image_caption: string;
  links: ImageAssetLink[];
  processing_status: "pending" | "processing" | "ready" | "failed";
  processing_error: string;
  embedding_version: string;
  position: number;
  file_size?: number | null;
  dimensions?: { width: number; height: number } | null;
  created_at: string;
  updated_at: string;
};

export type EmbedSummary = {
  counts: {
    total: number;
    pending: number;
    processing: number;
    ready: number;
    failed: number;
  };
  last_embedded_at?: string | null;
  queue_policy?: {
    batch_size: number;
    delay_seconds: number;
    batch_interval_seconds: number;
    mode: string;
  };
  failed_items?: { id: number; filename: string; processing_error: string; updated_at: string }[];
};

function formatBytes(bytes?: number | null) {
  if (!bytes || Number.isNaN(Number(bytes))) return "—";
  const kb = Number(bytes) / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: "blue" | "purple" | "orange" | "red" | "green" | "indigo";
  subValue?: string;
  active?: boolean;
  onClick: () => void;
}

function GalleryStatCard({ title, value, icon, color, subValue, active, onClick }: StatCardProps) {
  const colorPalettes = {
    blue: { color: "#3b82f6", bg: "rgba(59, 130, 246, 0.08)", border: "rgba(59, 130, 246, 0.2)", glow: "#3b82f6" },
    purple: { color: "#a855f7", bg: "rgba(168, 85, 247, 0.08)", border: "rgba(168, 85, 247, 0.2)", glow: "#a855f7" },
    orange: { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.08)", border: "rgba(245, 158, 11, 0.2)", glow: "#f59e0b" },
    red: { color: "#ef4444", bg: "rgba(239, 68, 68, 0.08)", border: "rgba(239, 68, 68, 0.2)", glow: "#ef4444" },
    green: { color: "#10b981", bg: "rgba(16, 185, 129, 0.08)", border: "rgba(16, 185, 129, 0.2)", glow: "#10b981" },
    indigo: { color: "#6366f1", bg: "rgba(99, 102, 241, 0.08)", border: "rgba(99, 102, 241, 0.2)", glow: "#6366f1" },
  };

  const palette = colorPalettes[color] || colorPalettes.indigo;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative p-1.5 sm:p-2 rounded-2xl w-full text-left transition-all duration-300 hover:-translate-y-1 focus:outline-none ${
        active ? "scale-[1.02]" : ""
      }`}
      style={{
        background: `linear-gradient(145deg, ${palette.bg}, #ffffff)`,
        boxShadow: active
          ? `0 16px 32px -10px ${palette.glow}40, 0 0 0 2px ${palette.color}`
          : `0 8px 20px -8px ${palette.glow}20, 0 0 0 1px ${palette.border}`,
      }}
    >
      <div className="relative bg-white/95 backdrop-blur-xl h-full rounded-xl p-3.5 flex flex-col justify-between gap-2 border border-white shadow-xs overflow-hidden">
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div
            className="absolute -top-6 -right-6 w-16 h-16 rounded-full opacity-20 blur-lg transition-opacity duration-500 hover:opacity-40"
            style={{ background: palette.color }}
          />
        </div>

        <div className="flex items-center justify-between relative z-10">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
            style={{
              background: `linear-gradient(135deg, ${palette.bg}, #ffffff)`,
              border: `1px solid ${palette.border}`,
              color: palette.color,
            }}
          >
            {icon}
          </div>
          {active && (
            <span
              className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: palette.bg, color: palette.color }}
            >
              Active
            </span>
          )}
        </div>

        <div className="relative z-10 min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-slate-500 truncate">
            {title}
          </div>
          <p className="text-xl font-black text-slate-900 tracking-tight leading-tight">
            {value}
          </p>
          {subValue && (
            <div className="mt-1.5 pt-1 border-t border-slate-100 flex items-center">
              <span className="text-[10px] font-semibold text-slate-400 truncate">
                {subValue}
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

interface ImageGalleryProps {
  products: { id: number; name: string; slug: string }[];
  csrfToken: string;
  getApiUrl: (endpoint: string) => string;
  onRefreshProducts?: () => void;
}

export default function ImageGallery({ products, csrfToken, getApiUrl, onRefreshProducts }: ImageGalleryProps) {
  const [assets, setAssets] = useState<ProductImageAsset[]>([]);
  const [embedSummary, setEmbedSummary] = useState<EmbedSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Upload state
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Filters & views
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [view, setView] = useState<"grid" | "masonry" | "list">("grid");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activeAssetId, setActiveAssetId] = useState<number | null>(null);

  // Inspector & link state
  const [linkModalAsset, setLinkModalAsset] = useState<ProductImageAsset | null>(null);
  const [targetProductId, setTargetProductId] = useState<string>("");
  const [busy, setBusy] = useState(false);

  // Embedding state
  const [embeddingBusy, setEmbeddingBusy] = useState(false);
  const [showErrorLogs, setShowErrorLogs] = useState(false);

  // Edit alt/caption
  const [editDraft, setEditDraft] = useState({ filename: "", alt_text: "", image_caption: "" });
  const [savingDetails, setSavingDetails] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ type: "single" | "bulk"; id?: number } | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAll = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [assetsRes, embedRes] = await Promise.all([
        fetch(getApiUrl("/admin/product-image-library/"), { credentials: "include" }),
        fetch(getApiUrl("/admin/product-image-library/embed/"), { credentials: "include" }),
      ]);

      if (assetsRes.ok) {
        const assetList: ProductImageAsset[] = await assetsRes.json();
        setAssets(assetList || []);
        if (!activeAssetId && assetList && assetList.length > 0) {
          setActiveAssetId(assetList[0].id);
        }
      }

      if (embedRes.ok) {
        const embedData: EmbedSummary = await embedRes.json();
        setEmbedSummary(embedData);
      }
    } catch {
      toast.error("গ্যালারি লোড করা সম্ভব হয়নি।");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const activeAsset = useMemo(
    () => assets.find((a) => a.id === activeAssetId) || null,
    [assets, activeAssetId]
  );

  useEffect(() => {
    if (activeAsset) {
      setEditDraft({
        filename: activeAsset.filename || "",
        alt_text: activeAsset.alt_text || "",
        image_caption: activeAsset.image_caption || "",
      });
    }
  }, [activeAsset]);

  const stats = useMemo(() => {
    const counts = {
      total: assets.length,
      pending: assets.filter((a) => a.processing_status === "pending").length,
      processing: assets.filter((a) => a.processing_status === "processing").length,
      ready: assets.filter((a) => a.processing_status === "ready").length,
      failed: assets.filter((a) => a.processing_status === "failed").length,
      linked: assets.filter((a) => (a.links || []).length > 0).length,
      unlinked: assets.filter((a) => (a.links || []).length === 0).length,
    };
    const progressPercent = counts.total > 0 ? Math.round((counts.ready / counts.total) * 100) : 0;
    return { ...counts, progressPercent };
  }, [assets]);

  const filteredAssets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assets.filter((asset) => {
      const links = asset.links || [];
      const linkedNames = links.map((l) => `${l.product_name || ""}`).join(" ");
      const searchable = `${asset.filename || ""} ${asset.alt_text || ""} ${asset.image_caption || ""} ${linkedNames}`.toLowerCase();
      const matchesSearch = !q || searchable.includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "ready" && asset.processing_status === "ready") ||
        (statusFilter === "pending" && asset.processing_status === "pending") ||
        (statusFilter === "processing" && asset.processing_status === "processing") ||
        (statusFilter === "failed" && asset.processing_status === "failed") ||
        (statusFilter === "linked" && links.length > 0) ||
        (statusFilter === "unlinked" && links.length === 0);

      const matchesProduct =
        productFilter === "all" ||
        links.some((l) => String(l.product_id) === String(productFilter));

      return matchesSearch && matchesStatus && matchesProduct;
    });
  }, [assets, search, statusFilter, productFilter]);

  // Drop handlers
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);
    const dropped = Array.from(event.dataTransfer.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (dropped.length) {
      setPendingFiles((curr) => [...curr, ...dropped]);
    }
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!pendingFiles.length) return;
    setUploading(true);
    setUploadProgress(20);

    const formData = new FormData();
    pendingFiles.forEach((file) => formData.append("images", file));

    try {
      const res = await fetch(getApiUrl("/admin/product-image-library/"), {
        method: "POST",
        credentials: "include",
        headers: csrfToken ? { "X-CSRFToken": csrfToken } : undefined,
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.images || err.error || "আপলোড ব্যর্থ হয়েছে।");
      }

      const uploadedAssets = await res.json();
      toast.success(`${uploadedAssets.length} টি ছবি সফলভাবে গ্যালারিতে যোগ হয়েছে!`);
      setPendingFiles([]);
      setUploadProgress(100);
      await loadAll(true);
    } catch (err: any) {
      toast.error(err.message || "ছবি আপলোড করা সম্ভব হয়নি।");
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 300);
    }
  };

  const triggerEmbeddingQueue = async ({ onlyFailed = false, selectedOnly = false, assetIds = [] }: { onlyFailed?: boolean; selectedOnly?: boolean; assetIds?: number[] } = {}) => {
    const payload: any = {};
    if (assetIds.length) {
      payload.asset_ids = assetIds;
    } else if (selectedOnly) {
      if (!selectedIds.length) {
        toast.error("অন্তত একটি ছবি নির্বাচন করুন");
        return;
      }
      payload.asset_ids = selectedIds;
    } else if (onlyFailed) {
      if (stats.failed === 0) {
        toast.success("কোনো ফেইলড ছবি নেই");
        return;
      }
      payload.only_failed = true;
    }

    setEmbeddingBusy(true);
    try {
      const res = await fetch(getApiUrl("/admin/product-image-library/embed/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        await loadAll(true);
        toast.success(`${data.queued || 0} টি ছবি প্রসেসিং কিউতে যুক্ত হয়েছে।`);
      } else {
        toast.error("প্রিপারেশন কিউ শুরু করা যায়নি।");
      }
    } catch {
      toast.error("সার্ভার ত্রুটি ঘটেছে।");
    } finally {
      setEmbeddingBusy(false);
    }
  };

  const reorderAsset = async (assetId: number, direction: number) => {
    const idx = filteredAssets.findIndex((a) => a.id === assetId);
    const nextIdx = idx + direction;
    if (idx < 0 || nextIdx < 0 || nextIdx >= filteredAssets.length) return;

    const copy = [...filteredAssets];
    [copy[idx], copy[nextIdx]] = [copy[nextIdx], copy[idx]];
    const positions = Object.fromEntries(copy.map((item, pos) => [item.id, pos]));

    try {
      const res = await fetch(getApiUrl("/admin/product-image-library/reorder/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ positions }),
      });

      if (res.ok) {
        await loadAll(true);
        toast.success("ইমেজের ক্রম সংরক্ষিত হয়েছে।");
      }
    } catch {
      toast.error("ক্রম পরিবর্তন সম্ভব হয়নি।");
    }
  };

  const saveAssetDetails = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeAsset) return;
    setSavingDetails(true);

    try {
      const res = await fetch(getApiUrl(`/admin/product-image-library/${activeAsset.id}/`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          filename: editDraft.filename,
          alt_text: editDraft.alt_text,
          image_caption: editDraft.image_caption,
        }),
      });

      if (res.ok) {
        await loadAll(true);
        if (onRefreshProducts) onRefreshProducts();
        toast.success("ইমেজ মেটাডেটা সংরক্ষিত হয়েছে।");
      } else {
        toast.error("তথ্য সংরক্ষণ করা যায়নি।");
      }
    } catch {
      toast.error("ত্রুটি ঘটেছে।");
    } finally {
      setSavingDetails(false);
    }
  };

  const handleLinkProduct = async (assetId: number, productId: number) => {
    if (!productId) {
      toast.error("একটি প্রোডাক্ট নির্বাচন করুন");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(getApiUrl(`/admin/product-image-library/${assetId}/link/`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ product_id: productId }),
      });

      if (res.ok) {
        setLinkModalAsset(null);
        await loadAll(true);
        if (onRefreshProducts) onRefreshProducts();
        toast.success("ছবিটি প্রোডাক্টের সাথে সফলভাবে যুক্ত হয়েছে!");
      } else {
        const err = await res.json();
        toast.error(err.error || "যুক্ত করা সম্ভব হয়নি।");
      }
    } catch {
      toast.error("ত্রুটি ঘটেছে।");
    } finally {
      setBusy(false);
    }
  };

  const handleUnlink = async (assetId: number, linkId: number) => {
    try {
      const res = await fetch(getApiUrl(`/admin/product-image-library/${assetId}/links/${linkId}/`), {
        method: "DELETE",
        credentials: "include",
        headers: csrfToken ? { "X-CSRFToken": csrfToken } : undefined,
      });

      if (res.ok) {
        await loadAll(true);
        if (onRefreshProducts) onRefreshProducts();
        toast.success("প্রোডাক্ট লিংক সরানো হয়েছে।");
      } else {
        toast.error("আনলিংক করা যায়নি।");
      }
    } catch {
      toast.error("ত্রুটি ঘটেছে।");
    }
  };

  const handleBulkLink = async () => {
    if (!selectedIds.length || !targetProductId) {
      toast.error("ছবি ও টার্গেট প্রোডাক্ট নির্বাচন করুন");
      return;
    }
    setBusy(true);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(getApiUrl(`/admin/product-image-library/${id}/link/`), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
            },
            credentials: "include",
            body: JSON.stringify({ product_id: Number(targetProductId) }),
          })
        )
      );
      setSelectedIds([]);
      await loadAll(true);
      if (onRefreshProducts) onRefreshProducts();
      toast.success(`${selectedIds.length} টি ছবি প্রোডাক্টে লিংক হয়েছে!`);
    } catch {
      toast.error("কিছু ছবি লিংক করা যায়নি।");
    } finally {
      setBusy(false);
    }
  };

  const handleBulkUnlink = async () => {
    const links = selectedIds.flatMap((id) =>
      (assets.find((a) => a.id === id)?.links || []).map((l) => ({ ...l, asset_id: id }))
    );
    if (!links.length) {
      toast.error("নির্বাচিত ছবিগুলোতে কোনো সক্রিয় প্রোডাক্ট লিংক নেই।");
      return;
    }
    setBusy(true);
    try {
      await Promise.all(
        links.map((l) =>
          fetch(getApiUrl(`/admin/product-image-library/${l.asset_id}/links/${l.id}/`), {
            method: "DELETE",
            credentials: "include",
            headers: csrfToken ? { "X-CSRFToken": csrfToken } : undefined,
          })
        )
      );
      setSelectedIds([]);
      await loadAll(true);
      if (onRefreshProducts) onRefreshProducts();
      toast.success("নির্বাচিত ছবিগুলোর সব লিংক বিচ্ছিন্ন করা হয়েছে।");
    } catch {
      toast.error("কিছু লিংক সরানো সম্ভব হয়নি।");
    } finally {
      setBusy(false);
    }
  };

  const deleteAssetNow = async (id: number) => {
    setConfirmBusy(true);
    try {
      const res = await fetch(getApiUrl(`/admin/product-image-library/${id}/`), {
        method: "DELETE",
        credentials: "include",
        headers: csrfToken ? { "X-CSRFToken": csrfToken } : undefined,
      });

      if (res.ok) {
        if (activeAssetId === id) setActiveAssetId(null);
        setSelectedIds((curr) => curr.filter((item) => item !== id));
        await loadAll(true);
        if (onRefreshProducts) onRefreshProducts();
        toast.success("ছবি মুছে ফেলা হয়েছে।");
      }
    } catch {
      toast.error("মুছে ফেলা সম্ভব হয়নি।");
    } finally {
      setConfirmBusy(false);
      setConfirmDialog(null);
    }
  };

  const deleteAssetsNow = async (ids: number[]) => {
    setConfirmBusy(true);
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(getApiUrl(`/admin/product-image-library/${id}/`), {
            method: "DELETE",
            credentials: "include",
            headers: csrfToken ? { "X-CSRFToken": csrfToken } : undefined,
          })
        )
      );
      if (activeAssetId && ids.includes(activeAssetId)) setActiveAssetId(null);
      setSelectedIds([]);
      await loadAll(true);
      if (onRefreshProducts) onRefreshProducts();
      toast.success("নির্বাচিত ছবিগুলো মুছে ফেলা হয়েছে।");
    } catch {
      toast.error("কিছু ছবি মুছে ফেলা সম্ভব হয়নি।");
    } finally {
      setConfirmBusy(false);
      setConfirmDialog(null);
    }
  };

  const failedItems = embedSummary?.failed_items || [];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              🖼️ প্রোডাক্ট ইমেজ গ্যালারি (Image Gallery)
            </h1>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-xs font-bold text-emerald-700">
              {assets.length} টি অ্যাসেট
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            আলোছায়ার সেন্ট্রাল রিইউজেবল ইমেজ লাইব্রেরি — আপলোড করুন, এআই মেটাডেটা প্রিপেয়ার করুন এবং যেকোনো প্রোডাক্টে লিংক করুন।
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadAll()}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-xs"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            রিফ্রেশ
          </button>
        </div>
      </div>

      {/* Embedding & Status Summary Card */}
      <section className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm border border-slate-200/80 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Cpu size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  ইমেজ প্রিপারেশন ও ইনডেক্সিং স্ট্যাটাস
                </h2>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                  Auto-Ready Pipeline
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                সর্বশেষ প্রিপারেশন:{" "}
                <b className="text-slate-700">
                  {embedSummary?.last_embedded_at
                    ? new Date(embedSummary.last_embedded_at).toLocaleString("bn-BD")
                    : "সম্পূর্ণ হয়েছে"}
                </b>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {stats.failed > 0 && (
              <button
                type="button"
                disabled={embeddingBusy}
                onClick={() => triggerEmbeddingQueue({ onlyFailed: true })}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition shadow-xs"
              >
                <RefreshCw size={14} />
                রিট্রাই ফেইলড ({stats.failed})
              </button>
            )}

            {stats.failed > 0 && (
              <button
                type="button"
                onClick={() => setShowErrorLogs((v) => !v)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                {showErrorLogs ? "এরর লুকান" : "এরর ডিটেইলস"}
              </button>
            )}

            <button
              type="button"
              disabled={embeddingBusy || stats.pending + stats.failed === 0}
              onClick={() => triggerEmbeddingQueue()}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50"
            >
              <Sparkles size={14} />
              {embeddingBusy ? "প্রসেসিং হচ্ছে..." : `পেন্ডিং প্রিপেয়ার (${stats.pending + stats.failed})`}
            </button>
          </div>
        </div>

        {/* 6 Stat Cards Grid */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          <GalleryStatCard
            title="Preparing"
            value={stats.pending}
            icon={<Clock size={16} />}
            color="orange"
            subValue="কিউতে অপেক্ষমান"
            active={statusFilter === "pending"}
            onClick={() => setStatusFilter(statusFilter === "pending" ? "all" : "pending")}
          />
          <GalleryStatCard
            title="Processing"
            value={stats.processing}
            icon={<Cpu size={16} />}
            color="blue"
            subValue="অ্যাক্টিভ প্রসেসিং"
            active={statusFilter === "processing"}
            onClick={() => setStatusFilter(statusFilter === "processing" ? "all" : "processing")}
          />
          <GalleryStatCard
            title="Ready"
            value={stats.ready}
            icon={<CheckCircle2 size={16} />}
            color="green"
            subValue={`${stats.progressPercent}% সম্পন্ন`}
            active={statusFilter === "ready"}
            onClick={() => setStatusFilter(statusFilter === "ready" ? "all" : "ready")}
          />
          <GalleryStatCard
            title="Linked"
            value={stats.linked}
            icon={<Link2 size={16} />}
            color="purple"
            subValue="প্রোডাক্টে যুক্ত"
            active={statusFilter === "linked"}
            onClick={() => setStatusFilter(statusFilter === "linked" ? "all" : "linked")}
          />
          <GalleryStatCard
            title="Unlinked"
            value={stats.unlinked}
            icon={<Unlink size={16} />}
            color="indigo"
            subValue="ব্যবহারের জন্য প্রস্তুত"
            active={statusFilter === "unlinked"}
            onClick={() => setStatusFilter(statusFilter === "unlinked" ? "all" : "unlinked")}
          />
          <GalleryStatCard
            title="Failed"
            value={stats.failed}
            icon={<AlertCircle size={16} />}
            color="red"
            subValue={stats.failed > 0 ? "পুনরায় চেষ্টা প্রয়োজন" : "কোনো ত্রুটি নেই"}
            active={statusFilter === "failed"}
            onClick={() => setStatusFilter(statusFilter === "failed" ? "all" : "failed")}
          />
        </div>

        {/* Progress bar */}
        <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-3">
          <div className="mb-1.5 flex justify-between items-center text-xs font-bold text-slate-600">
            <span className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-emerald-600" />
              রেডিনেস প্রগ্রেস
            </span>
            <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-black">
              {stats.ready} / {stats.total} রেডি ({stats.progressPercent}%)
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
              style={{ width: `${stats.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Diagnostic error logs */}
        {showErrorLogs && failedItems.length > 0 && (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50/50 p-3 text-xs">
            <b className="text-rose-800">ফেইলড ইমেজ লগ:</b>
            <div className="mt-2 max-h-36 space-y-1.5 overflow-y-auto">
              {failedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-1.5 text-rose-700 shadow-xs border border-rose-100"
                >
                  <span className="font-semibold">#{item.id} — {item.filename}</span>
                  <span className="font-mono text-[11px]">{item.processing_error || "ত্রুটি ঘটেছে"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Drag & Drop Upload Zone */}
      <form
        onSubmit={handleUpload}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed p-6 transition-all duration-300 shadow-xs ${
          dragActive
            ? "border-emerald-500 bg-emerald-50/70 scale-[1.01]"
            : "border-slate-300 bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 hover:border-emerald-400"
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <label className="flex flex-1 cursor-pointer items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shrink-0">
              <UploadCloud size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                এখানে ছবি ড্রপ করুন, অথবা ক্লিক করে ব্রাউজ করুন
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                PNG, JPG, WEBP সাপোর্ট করে (সর্বোচ্চ ১৫ মেগাবাইট)। একাধিক ছবি একসাথে আপলোড করতে পারবেন।
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => setPendingFiles(Array.from(e.target.files || []))}
              className="hidden"
            />
          </label>

          {pendingFiles.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                {pendingFiles.length} টি সিলেক্টেড
              </span>
              <button
                type="button"
                onClick={() => setPendingFiles([])}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-2 text-xs font-bold text-white shadow-md disabled:opacity-50"
              >
                {uploading ? `আপলোড হচ্ছে (${uploadProgress}%)` : "আপলোড শুরু করুন"}
              </button>
            </div>
          )}
        </div>

        {uploading && (
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {pendingFiles.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-8">
            {pendingFiles.map((file, idx) => (
              <div
                key={file.name + idx}
                className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs group"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="h-16 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPendingFiles((curr) => curr.filter((_, i) => i !== idx))}
                  className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-rose-600 transition"
                >
                  <X size={10} />
                </button>
                <p className="truncate px-1.5 py-0.5 text-[9px] font-bold text-slate-700 bg-white">
                  {file.name}
                </p>
              </div>
            ))}
          </div>
        )}
      </form>

      {/* Filter Toolbar & View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ফাইলের নাম, অল্টার টেক্সট বা প্রোডাক্ট সার্চ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none font-semibold text-slate-700"
          >
            <option value="all">সব স্ট্যাটাস ({assets.length})</option>
            <option value="ready">Ready ({stats.ready})</option>
            <option value="pending">Pending ({stats.pending})</option>
            <option value="processing">Processing ({stats.processing})</option>
            <option value="linked">Linked ({stats.linked})</option>
            <option value="unlinked">Unlinked ({stats.unlinked})</option>
            <option value="failed">Failed ({stats.failed})</option>
          </select>

          {/* Product filter */}
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none font-semibold text-slate-700 max-w-[200px]"
          >
            <option value="all">সব প্রোডাক্ট</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* View Switcher & Selection Count */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={`p-1.5 rounded-lg text-xs font-bold transition ${
                view === "grid" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
              title="গ্রিড ভিউ"
            >
              <Grid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setView("masonry")}
              className={`p-1.5 rounded-lg text-xs font-bold transition ${
                view === "masonry" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
              title="ম্যাসনরি ভিউ"
            >
              <SlidersHorizontal size={15} />
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={`p-1.5 rounded-lg text-xs font-bold transition ${
                view === "list" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
              title="লিস্ট ভিউ"
            >
              <List size={15} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (selectedIds.length === filteredAssets.length) {
                setSelectedIds([]);
              } else {
                setSelectedIds(filteredAssets.map((a) => a.id));
              }
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            {selectedIds.length === filteredAssets.length && filteredAssets.length > 0 ? (
              <CheckSquare size={14} className="text-emerald-600" />
            ) : (
              <Square size={14} />
            )}
            সিলেক্ট ({selectedIds.length})
          </button>
        </div>
      </div>

      {/* Bulk Action Bar (Visible when images are selected) */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-50 border border-indigo-200 p-3.5 rounded-2xl animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black">
              {selectedIds.length}
            </span>
            <span className="text-xs font-bold text-indigo-900">টি ছবি নির্বাচিত হয়েছে</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick bulk link to product */}
            <select
              value={targetProductId}
              onChange={(e) => setTargetProductId(e.target.value)}
              className="text-xs border border-indigo-200 rounded-xl px-2.5 py-1.5 bg-white text-slate-800"
            >
              <option value="">প্রোডাক্ট সিলেক্ট করুন...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={!targetProductId || busy}
              onClick={handleBulkLink}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <Link2 size={13} />
              বাল্ক লিংক
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={handleBulkUnlink}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <Unlink size={13} />
              সব লিংক কাটুন
            </button>

            <button
              type="button"
              disabled={confirmBusy}
              onClick={() => setConfirmDialog({ type: "bulk" })}
              className="flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
            >
              <Trash2 size={13} />
              মুছে ফেলুন ({selectedIds.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="p-1.5 text-slate-500 hover:text-slate-800"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Main Gallery Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-200">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600 mb-3" />
          <p className="text-xs font-bold text-slate-500">ইমেজ লাইব্রেরি লোড হচ্ছে...</p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-200 text-center">
          <FileImage size={48} className="text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-700">কোনো ছবি পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            উপরে ড্র্যাগ অ্যান্ড ড্রপ বক্সে ছবি ড্রপ করুন অথবা অন্য ফিল্টারে সার্চ করুন।
          </p>
        </div>
      ) : (
        <div
          className={
            view === "grid"
              ? "gallery-grid"
              : view === "masonry"
              ? "gallery-masonry"
              : "gallery-list"
          }
        >
          {filteredAssets.map((asset, index) => {
            const isSelected = selectedIds.includes(asset.id);
            const isActive = activeAssetId === asset.id;

            if (view === "list") {
              return (
                <div
                  key={asset.id}
                  onClick={() => setActiveAssetId(asset.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border bg-white cursor-pointer transition ${
                    isActive
                      ? "border-emerald-500 shadow-sm ring-1 ring-emerald-500"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds((curr) => [...curr, asset.id]);
                        else setSelectedIds((curr) => curr.filter((id) => id !== asset.id));
                      }}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <img
                      src={asset.image}
                      alt={asset.alt_text || asset.filename}
                      className="w-12 h-12 object-cover rounded-lg border border-slate-100"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800 line-clamp-1">
                        {asset.filename}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                        <span>{formatBytes(asset.file_size)}</span>
                        {asset.dimensions && (
                          <span>• {asset.dimensions.width}×{asset.dimensions.height}</span>
                        )}
                        <span>• {new Date(asset.created_at).toLocaleDateString("bn-BD")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        asset.processing_status === "ready"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : asset.processing_status === "failed"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {asset.processing_status}
                    </span>

                    {/* Linked products pill */}
                    {asset.links && asset.links.length > 0 ? (
                      <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                        {asset.links.length} লিংকড
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        আনলিংকড
                      </span>
                    )}

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => reorderAsset(asset.id, -1)}
                        disabled={index === 0}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        title="উপরে নিন"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => reorderAsset(asset.id, 1)}
                        disabled={index === filteredAssets.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        title="নিচে নিন"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setLinkModalAsset(asset)}
                        className="p-1 text-indigo-600 hover:text-indigo-800"
                        title="প্রোডাক্টে লিংক করুন"
                      >
                        <Link2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDialog({ type: "single", id: asset.id })}
                        className="p-1 text-rose-500 hover:text-rose-700"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            // Grid or Masonry Item Card
            return (
              <div
                key={asset.id}
                onClick={() => setActiveAssetId(asset.id)}
                className={`gallery-item-card cursor-pointer group ${
                  view === "masonry" ? "gallery-masonry-item" : ""
                } ${isSelected ? "selected" : ""} ${isActive ? "ring-2 ring-emerald-500" : ""}`}
              >
                {/* Thumb Container */}
                <div className="gallery-thumb-wrap">
                  <img
                    src={asset.image}
                    alt={asset.alt_text || asset.filename}
                    loading="lazy"
                  />

                  {/* Top Left Checkbox */}
                  <div
                    className="absolute top-2 left-2 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds((curr) => [...curr, asset.id]);
                        else setSelectedIds((curr) => curr.filter((id) => id !== asset.id));
                      }}
                      className="w-4 h-4 rounded border-white/80 bg-black/40 text-emerald-600 focus:ring-0 shadow-sm cursor-pointer"
                    />
                  </div>

                  {/* Top Right Status Badge */}
                  <div className="absolute top-2 right-2 z-10">
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-md shadow-xs ${
                        asset.processing_status === "ready"
                          ? "bg-emerald-500/90 text-white"
                          : asset.processing_status === "failed"
                          ? "bg-rose-500/90 text-white"
                          : "bg-amber-500/90 text-white"
                      }`}
                    >
                      {asset.processing_status}
                    </span>
                  </div>

                  {/* Overlay Action Bar */}
                  <div className="gallery-thumb-overlay" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => reorderAsset(asset.id, -1)}
                        disabled={index === 0}
                        className="w-7 h-7 rounded-lg bg-black/60 text-white flex items-center justify-center hover:bg-black disabled:opacity-30"
                        title="পূর্বে নিন"
                      >
                        <ArrowUp size={13} className="-rotate-90" />
                      </button>
                      <button
                        type="button"
                        onClick={() => reorderAsset(asset.id, 1)}
                        disabled={index === filteredAssets.length - 1}
                        className="w-7 h-7 rounded-lg bg-black/60 text-white flex items-center justify-center hover:bg-black disabled:opacity-30"
                        title="পরে নিন"
                      >
                        <ArrowDown size={13} className="-rotate-90" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setLinkModalAsset(asset)}
                        className="w-7 h-7 rounded-lg bg-indigo-600/90 text-white flex items-center justify-center hover:bg-indigo-700"
                        title="প্রোডাক্টে লিংক করুন"
                      >
                        <Link2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDialog({ type: "single", id: asset.id })}
                        className="w-7 h-7 rounded-lg bg-rose-600/90 text-white flex items-center justify-center hover:bg-rose-700"
                        title="ডিলিট"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Details Footer */}
                <div className="p-3 bg-white">
                  <p className="text-xs font-bold text-slate-800 truncate" title={asset.filename}>
                    {asset.filename}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5" title={asset.alt_text}>
                    {asset.alt_text || "কোনো অল্টার টেক্সট নেই"}
                  </p>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <span>{formatBytes(asset.file_size)}</span>
                    {asset.links && asset.links.length > 0 ? (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                        {asset.links.length} লিংকড
                      </span>
                    ) : (
                      <span className="text-slate-400">ফ্রি</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Asset Inspector Drawer (When an image is clicked) */}
      {activeAsset && (
        <div
          className="gallery-drawer-backdrop"
          onClick={() => setActiveAssetId(null)}
        >
          <div
            className="gallery-drawer-panel p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-sm">
                  #{activeAsset.id}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 truncate max-w-[260px]">
                    {activeAsset.filename}
                  </h3>
                  <p className="text-[11px] text-slate-500">ইমেজ ইন্সপেক্টর ও মেটাডেটা</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveAssetId(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            {/* Image Preview Box */}
            <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative group">
              <img
                src={activeAsset.image}
                alt={activeAsset.alt_text || activeAsset.filename}
                className="w-full h-56 object-contain bg-slate-900/5"
              />
              <a
                href={activeAsset.image}
                target="_blank"
                rel="noreferrer"
                className="absolute right-2 top-2 rounded-lg bg-black/70 hover:bg-black text-white px-2.5 py-1 text-xs font-bold flex items-center gap-1.5"
              >
                ফুল প্রিভিউ <ExternalLink size={12} />
              </a>
            </div>

            {/* Quick Stats Grid */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">ফাইল সাইজ</span>
                <span className="font-bold text-slate-800">{formatBytes(activeAsset.file_size)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">ডাইমেনশন</span>
                <span className="font-bold text-slate-800">
                  {activeAsset.dimensions ? `${activeAsset.dimensions.width} × ${activeAsset.dimensions.height} px` : "N/A"}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">আপলোড তারিখ</span>
                <span className="font-bold text-slate-800">
                  {new Date(activeAsset.created_at).toLocaleDateString("bn-BD")}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">স্ট্যাটাস</span>
                <span className="font-bold text-emerald-700">{activeAsset.processing_status}</span>
              </div>
            </div>

            {/* Editable Details Form */}
            <form onSubmit={saveAssetDetails} className="mt-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ফাইলের নাম (Filename)
                </label>
                <input
                  type="text"
                  value={editDraft.filename}
                  onChange={(e) => setEditDraft({ ...editDraft, filename: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  অল্টার টেক্সট (Alt Text / SEO)
                </label>
                <input
                  type="text"
                  value={editDraft.alt_text}
                  onChange={(e) => setEditDraft({ ...editDraft, alt_text: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="যেমন: আলোছায়া বিশেষ ডায়েরি বাঁধাই..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  এআই ভিজ্যুয়াল ডেসক্রিপশন / ক্যাপশন
                </label>
                <textarea
                  rows={2}
                  value={editDraft.image_caption}
                  onChange={(e) => setEditDraft({ ...editDraft, image_caption: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none font-mono text-[11px]"
                  placeholder="এআই ভিজ্যুয়াল ক্যাপশন..."
                />
              </div>

              <button
                type="submit"
                disabled={savingDetails}
                className="w-full rounded-xl bg-slate-900 hover:bg-black text-white py-2 text-xs font-bold transition disabled:opacity-50"
              >
                {savingDetails ? "সংরক্ষণ হচ্ছে..." : "মেটাডেটা আপডেট করুন"}
              </button>
            </form>

            {/* Linked Products Section */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  সংযুক্ত প্রোডাক্টসমূহ ({activeAsset.links?.length || 0})
                </h4>
              </div>

              {activeAsset.links && activeAsset.links.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {activeAsset.links.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Package size={14} className="text-emerald-600" />
                        <span className="font-bold text-slate-800">{link.product_name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnlink(activeAsset.id, link.id)}
                        className="text-rose-600 hover:text-rose-800 p-1 text-[11px] font-bold flex items-center gap-1"
                        title="আনলিংক"
                      >
                        <Unlink size={12} />
                        আনলিংক
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 mb-4 italic">
                  এই ছবিটি এখনো কোনো প্রোডাক্টে যুক্ত করা হয়নি।
                </p>
              )}

              {/* Quick Link to Product Form */}
              <div className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-2.5">
                <label className="block text-xs font-bold text-indigo-950">
                  নতুন প্রোডাক্টের সাথে লিংক করুন
                </label>
                <div className="flex gap-2">
                  <select
                    value={targetProductId}
                    onChange={(e) => setTargetProductId(e.target.value)}
                    className="flex-1 text-xs border border-indigo-200 rounded-xl px-2.5 py-2 bg-white text-slate-800"
                  >
                    <option value="">প্রোডাক্ট সিলেক্ট করুন...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!targetProductId || busy}
                    onClick={() => handleLinkProduct(activeAsset.id, Number(targetProductId))}
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 text-xs font-bold disabled:opacity-50"
                  >
                    লিংক
                  </button>
                </div>
              </div>
            </div>

            {/* Delete Image Action */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setConfirmDialog({ type: "single", id: activeAsset.id })}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 py-2.5 text-xs font-bold transition"
              >
                <Trash2 size={14} />
                এই ছবিটি সম্পূর্ণ মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Link Modal (when clicking Link icon on a card) */}
      {linkModalAsset && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setLinkModalAsset(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Link2 size={16} className="text-indigo-600" />
                প্রোডাক্টের সাথে লিংক করুন
              </h3>
              <button
                type="button"
                onClick={() => setLinkModalAsset(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center gap-3 my-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <img
                src={linkModalAsset.image}
                alt={linkModalAsset.filename}
                className="w-14 h-14 object-cover rounded-lg border border-slate-200"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {linkModalAsset.filename}
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {linkModalAsset.alt_text || "কোনো অল্টার টেক্সট নেই"}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                প্রোডাক্ট নির্বাচন করুন:
              </label>
              <select
                value={targetProductId}
                onChange={(e) => setTargetProductId(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value="">তালিকায় থাকা প্রোডাক্ট বেছে নিন...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setLinkModalAsset(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={!targetProductId || busy}
                  onClick={() => handleLinkProduct(linkModalAsset.id, Number(targetProductId))}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  {busy ? "লিংক হচ্ছে..." : "লিংক কনফার্ম করুন"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDialog && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setConfirmDialog(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {confirmDialog.type === "bulk"
                ? `${selectedIds.length} টি ছবি মুছে ফেলতে চান?`
                : "এই ছবিটি মুছে ফেলতে চান?"}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 mb-5">
              এই ছবি মুছে ফেললে তা স্টোরেজ থেকে চিরতরে মুছে যাবে এবং সংযুক্ত সব প্রোডাক্ট থেকেও অপসারিত হবে।
            </p>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 flex-1"
              >
                না, রাখুন
              </button>
              <button
                type="button"
                disabled={confirmBusy}
                onClick={() => {
                  if (confirmDialog.type === "bulk") {
                    deleteAssetsNow(selectedIds);
                  } else if (confirmDialog.id) {
                    deleteAssetNow(confirmDialog.id);
                  }
                }}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white flex-1 disabled:opacity-50"
              >
                {confirmBusy ? "মুছে ফেলা হচ্ছে..." : "হ্যাঁ, মুছে ফেলুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

