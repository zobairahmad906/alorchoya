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
  return (
    <button
      type="button"
      onClick={onClick}
      className={`stat-card-wrap ${color} ${active ? "active" : ""}`}
    >
      <div className="stat-card-inner">
        <div className="stat-card-top">
          <div className="stat-card-icon-box">{icon}</div>
          {active && <span className="stat-card-active-pill">Active</span>}
        </div>

        <div className="stat-card-body">
          <div className="stat-card-title">{title}</div>
          <div className="stat-card-value">{value}</div>
          {subValue && <div className="stat-card-sub" title={subValue}>{subValue}</div>}
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
      toast.error("Failed to load image gallery.");
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
        throw new Error(err.images || err.error || "Upload failed.");
      }

      const uploadedAssets = await res.json();
      toast.success(`${uploadedAssets.length} images added to gallery successfully!`);
      setPendingFiles([]);
      setUploadProgress(100);
      await loadAll(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload images.");
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
        toast.error("Please select at least one image.");
        return;
      }
      payload.asset_ids = selectedIds;
    } else if (onlyFailed) {
      if (stats.failed === 0) {
        toast.success("No failed images found.");
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
        toast.success(`${data.queued || 0} images added to processing queue.`);
      } else {
        toast.error("Failed to start preparation queue.");
      }
    } catch {
      toast.error("Server error occurred.");
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
        toast.success("Image order updated successfully.");
      }
    } catch {
      toast.error("Failed to update image order.");
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
        toast.success("Image metadata saved successfully.");
      } else {
        toast.error("Failed to save image metadata.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setSavingDetails(false);
    }
  };

  const handleLinkProduct = async (assetId: number, productId: number) => {
    if (!productId) {
      toast.error("Please select a target product.");
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
        toast.success("Image linked to product successfully!");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to link image.");
      }
    } catch {
      toast.error("An error occurred.");
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
        toast.success("Product link removed successfully.");
      } else {
        toast.error("Failed to unlink product.");
      }
    } catch {
      toast.error("An error occurred.");
    }
  };

  const handleBulkLink = async () => {
    if (!selectedIds.length || !targetProductId) {
      toast.error("Please select images and target product.");
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
      toast.success(`${selectedIds.length} images linked to product!`);
    } catch {
      toast.error("Some images could not be linked.");
    } finally {
      setBusy(false);
    }
  };

  const handleBulkUnlink = async () => {
    const links = selectedIds.flatMap((id) =>
      (assets.find((a) => a.id === id)?.links || []).map((l) => ({ ...l, asset_id: id }))
    );
    if (!links.length) {
      toast.error("Selected images have no active product links.");
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
      toast.success("All product links unlinked for selected images.");
    } catch {
      toast.error("Failed to unlink some products.");
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
        toast.success("Image deleted successfully.");
      }
    } catch {
      toast.error("Failed to delete image.");
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
      toast.success("Selected images deleted successfully.");
    } catch {
      toast.error("Failed to delete some images.");
    } finally {
      setConfirmBusy(false);
      setConfirmDialog(null);
    }
  };

  const failedItems = embedSummary?.failed_items || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      {/* 1. Header Card */}
      <div className="gallery-header-card">
        <div className="gallery-header-info">
          <h1>
            Product Image Gallery
            <span className="gallery-badge-emerald">{assets.length} Total Assets</span>
          </h1>
          <p>
            Central reusable product media library — upload, prepare AI metadata, and link to products.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={() => loadAll()}
            className="gallery-btn-white"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* 2. Status & Embed Card */}
      <section className="gallery-section-card">
        <div className="gallery-section-top">
          <div className="gallery-section-title-wrap">
            <div className="gallery-icon-cube">
              <Cpu size={22} />
            </div>
            <div>
              <div className="gallery-section-heading">
                <h2>Image Preparation & AI Indexing Status</h2>
                <span className="gallery-badge-emerald">Auto-Ready Pipeline</span>
              </div>
              <p className="gallery-section-sub">
                Last Preparation:{" "}
                <b style={{ color: "#334155" }}>
                  {embedSummary?.last_embedded_at
                    ? new Date(embedSummary.last_embedded_at).toLocaleString("bn-BD")
                    : "Completed"}
                </b>
              </p>
            </div>
          </div>

          <div className="gallery-section-actions">
            {stats.failed > 0 && (
              <button
                type="button"
                disabled={embeddingBusy}
                onClick={() => triggerEmbeddingQueue({ onlyFailed: true })}
                className="gallery-btn-danger"
              >
                <RefreshCw size={14} />
                Retry Failed ({stats.failed})
              </button>
            )}

            {stats.failed > 0 && (
              <button
                type="button"
                onClick={() => setShowErrorLogs((v) => !v)}
                className="gallery-btn-white"
              >
                {showErrorLogs ? "Hide Error Logs" : "View Error Logs"}
              </button>
            )}

            <button
              type="button"
              disabled={embeddingBusy || stats.pending + stats.failed === 0}
              onClick={() => triggerEmbeddingQueue()}
              className="gallery-btn-primary"
            >
              <Sparkles size={14} />
              {embeddingBusy ? "Processing..." : `Prepare Pending (${stats.pending + stats.failed})`}
            </button>
          </div>
        </div>

        {/* 6 Stat Cards Grid */}
        <div className="stat-cards-grid">
          <GalleryStatCard
            title="Preparing"
            value={stats.pending}
            icon={<Clock size={18} />}
            color="orange"
            subValue="In Queue"
            active={statusFilter === "pending"}
            onClick={() => setStatusFilter(statusFilter === "pending" ? "all" : "pending")}
          />
          <GalleryStatCard
            title="Processing"
            value={stats.processing}
            icon={<Cpu size={18} />}
            color="blue"
            subValue="Active Processing"
            active={statusFilter === "processing"}
            onClick={() => setStatusFilter(statusFilter === "processing" ? "all" : "processing")}
          />
          <GalleryStatCard
            title="Ready"
            value={stats.ready}
            icon={<CheckCircle2 size={18} />}
            color="green"
            subValue={`${stats.progressPercent}% Completed`}
            active={statusFilter === "ready"}
            onClick={() => setStatusFilter(statusFilter === "ready" ? "all" : "ready")}
          />
          <GalleryStatCard
            title="Linked"
            value={stats.linked}
            icon={<Link2 size={18} />}
            color="purple"
            subValue="Linked to Products"
            active={statusFilter === "linked"}
            onClick={() => setStatusFilter(statusFilter === "linked" ? "all" : "linked")}
          />
          <GalleryStatCard
            title="Unlinked"
            value={stats.unlinked}
            icon={<Unlink size={18} />}
            color="indigo"
            subValue="Ready in Library"
            active={statusFilter === "unlinked"}
            onClick={() => setStatusFilter(statusFilter === "unlinked" ? "all" : "unlinked")}
          />
          <GalleryStatCard
            title="Failed"
            value={stats.failed}
            icon={<AlertCircle size={18} />}
            color="red"
            subValue={stats.failed > 0 ? "Requires Retry" : "No Errors"}
            active={statusFilter === "failed"}
            onClick={() => setStatusFilter(statusFilter === "failed" ? "all" : "failed")}
          />
        </div>

        {/* Progress bar */}
        <div className="gallery-progress-wrap">
          <div className="gallery-progress-labels">
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Sparkles size={13} style={{ color: "#10b981" }} />
              Readiness Progress
            </span>
            <span className="gallery-progress-pct">
              {stats.ready} / {stats.total} Ready ({stats.progressPercent}%)
            </span>
          </div>
          <div className="gallery-progress-track">
            <div
              className="gallery-progress-bar"
              style={{ width: `${stats.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Diagnostic error logs */}
        {showErrorLogs && failedItems.length > 0 && (
          <div style={{ marginTop: "14px", borderRadius: "12px", border: "1px solid #fecdd3", background: "#fff1f2", padding: "14px" }}>
            <b style={{ color: "#9f1239", fontSize: "12px" }}>Failed Image Logs:</b>
            <div style={{ marginTop: "8px", maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
              {failedItems.map((item) => (
                <div
                  key={item.id}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#ffffff", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ffe4e6", fontSize: "12px", color: "#be123c" }}
                >
                  <span style={{ fontWeight: 700 }}>#{item.id} — {item.filename}</span>
                  <span style={{ fontFamily: "monospace", fontSize: "11px" }}>{item.processing_error || "Processing Error"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 3. Drag & Drop Upload Zone */}
      <form
        onSubmit={handleUpload}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`gallery-dropzone-box ${dragActive ? "drag-over" : ""}`}
      >
        <div className="gallery-dropzone-content">
          <label className="gallery-dropzone-label">
            <div className="gallery-upload-circle">
              <UploadCloud size={26} />
            </div>
            <div>
              <div className="gallery-dropzone-title">
                Drag & drop product images here, or click to browse
              </div>
              <div className="gallery-dropzone-subtitle">
                Supports PNG, JPG, WEBP (Max 15 MB). Multiple files supported.
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => setPendingFiles(Array.from(e.target.files || []))}
              style={{ display: "none" }}
            />
          </label>

          {pendingFiles.length > 0 && (
            <div className="gallery-staged-actions">
              <span className="gallery-badge-emerald">
                {pendingFiles.length} Staged
              </span>
              <button
                type="button"
                onClick={() => setPendingFiles([])}
                className="gallery-btn-white"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="gallery-btn-primary"
              >
                {uploading ? `Uploading (${uploadProgress}%)` : "Start Upload"}
              </button>
            </div>
          )}
        </div>

        {uploading && (
          <div className="gallery-upload-progress">
            <div style={{ width: `${uploadProgress}%` }} />
          </div>
        )}

        {pendingFiles.length > 0 && (
          <div className="gallery-staged-previews">
            {pendingFiles.map((file, idx) => (
              <div key={file.name + idx} className="gallery-staged-card">
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                />
                <button
                  type="button"
                  onClick={() => setPendingFiles((curr) => curr.filter((_, i) => i !== idx))}
                  className="gallery-staged-remove"
                >
                  <X size={12} />
                </button>
                <div className="gallery-staged-filename" title={file.name}>
                  {file.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </form>

      {/* 4. Filter Toolbar & View Switcher */}
      <div className="gallery-filter-toolbar">
        <div className="gallery-toolbar-left">
          <div className="gallery-search-box">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Search by filename, alt text, or product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="search-clear"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="gallery-select"
          >
            <option value="all">All Statuses ({assets.length})</option>
            <option value="ready">Ready ({stats.ready})</option>
            <option value="pending">Pending ({stats.pending})</option>
            <option value="processing">Processing ({stats.processing})</option>
            <option value="linked">Linked ({stats.linked})</option>
            <option value="unlinked">Unlinked ({stats.unlinked})</option>
            <option value="failed">Failed ({stats.failed})</option>
          </select>

          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="gallery-select"
            style={{ maxWidth: "220px" }}
          >
            <option value="all">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="gallery-toolbar-right">
          <div className="gallery-view-switcher">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={view === "grid" ? "active" : ""}
              title="Grid View"
            >
              <Grid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setView("masonry")}
              className={view === "masonry" ? "active" : ""}
              title="Masonry View"
            >
              <SlidersHorizontal size={15} />
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={view === "list" ? "active" : ""}
              title="List View"
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
            className="gallery-btn-white"
          >
            {selectedIds.length === filteredAssets.length && filteredAssets.length > 0 ? (
              <CheckSquare size={14} style={{ color: "#10b981" }} />
            ) : (
              <Square size={14} />
            )}
            Select ({selectedIds.length})
          </button>
        </div>
      </div>

      {/* 5. Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="gallery-bulk-action-bar">
          <div className="gallery-bulk-count">
            <span className="bulk-count-pill">{selectedIds.length}</span>
            <span>image(s) selected</span>
          </div>

          <div className="gallery-bulk-buttons">
            <select
              value={targetProductId}
              onChange={(e) => setTargetProductId(e.target.value)}
              className="gallery-select"
              style={{ padding: "6px 10px", fontSize: "12px" }}
            >
              <option value="">Select target product...</option>
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
              className="gallery-btn-indigo"
            >
              <Link2 size={13} />
              Bulk Link
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={handleBulkUnlink}
              className="gallery-btn-white"
              style={{ padding: "7px 12px", fontSize: "12px" }}
            >
              <Unlink size={13} />
              Unlink All
            </button>

            <button
              type="button"
              disabled={confirmBusy}
              onClick={() => setConfirmDialog({ type: "bulk" })}
              className="gallery-btn-danger"
              style={{ padding: "7px 12px", fontSize: "12px" }}
            >
              <Trash2 size={13} />
              Delete Selected ({selectedIds.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: "4px" }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 6. Main Gallery Views */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0" }}>
          <div className="animate-spin" style={{ width: "36px", height: "36px", borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#10b981", marginBottom: "14px" }} />
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#64748b" }}>Loading image library...</p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", textAlign: "center" }}>
          <FileImage size={48} style={{ color: "#cbd5e1", marginBottom: "12px" }} />
          <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#334155", margin: "0 0 6px" }}>No images found</h3>
          <p style={{ fontSize: "13px", color: "#64748b", maxWidth: "360px", margin: 0 }}>
            Drag & drop images above or adjust your search filter.
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
                  className={`gallery-list-item ${isActive ? "active" : ""}`}
                >
                  <div className="gallery-list-left">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds((curr) => [...curr, asset.id]);
                        else setSelectedIds((curr) => curr.filter((id) => id !== asset.id));
                      }}
                      style={{ width: "16px", height: "16px", accentColor: "#10b981", cursor: "pointer" }}
                    />
                    <img
                      src={asset.image}
                      alt={asset.alt_text || asset.filename}
                      className="gallery-list-thumb"
                    />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {asset.filename}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px", fontSize: "11px", color: "#64748b" }}>
                        <span>{formatBytes(asset.file_size)}</span>
                        {asset.dimensions && <span>• {asset.dimensions.width}×{asset.dimensions.height}</span>}
                        <span>• {new Date(asset.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="gallery-list-right">
                    <span className={`status-pill ${asset.processing_status}`}>
                      {asset.processing_status}
                    </span>

                    {asset.links && asset.links.length > 0 ? (
                      <span className="gallery-card-link-badge">
                        {asset.links.length} linked
                      </span>
                    ) : (
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>Unlinked</span>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => reorderAsset(asset.id, -1)}
                        disabled={index === 0}
                        style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: "4px", opacity: index === 0 ? 0.3 : 1 }}
                        title="Move Up"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => reorderAsset(asset.id, 1)}
                        disabled={index === filteredAssets.length - 1}
                        style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: "4px", opacity: index === filteredAssets.length - 1 ? 0.3 : 1 }}
                        title="Move Down"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setLinkModalAsset(asset)}
                        style={{ background: "transparent", border: "none", color: "#4f46e5", cursor: "pointer", padding: "4px" }}
                        title="Link to Product"
                      >
                        <Link2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDialog({ type: "single", id: asset.id })}
                        style={{ background: "transparent", border: "none", color: "#e11d48", cursor: "pointer", padding: "4px" }}
                        title="Delete Image"
                      >
                        <Trash2 size={14} />
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
                className={`gallery-item-card ${view === "masonry" ? "gallery-masonry-item" : ""} ${isSelected ? "selected" : ""} ${isActive ? "active" : ""}`}
              >
                <div className="gallery-thumb-wrap">
                  <img
                    src={asset.image}
                    alt={asset.alt_text || asset.filename}
                    loading="lazy"
                  />

                  <div className="gallery-card-checkbox" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds((curr) => [...curr, asset.id]);
                        else setSelectedIds((curr) => curr.filter((id) => id !== asset.id));
                      }}
                    />
                  </div>

                  <div className="gallery-card-status">
                    <span className={`status-pill ${asset.processing_status}`}>
                      {asset.processing_status}
                    </span>
                  </div>

                  <div className="gallery-card-hover-overlay" onClick={(e) => e.stopPropagation()}>
                    <div className="overlay-left">
                      <button
                        type="button"
                        onClick={() => reorderAsset(asset.id, -1)}
                        disabled={index === 0}
                        title="Move Left"
                      >
                        <ArrowUp size={13} style={{ transform: "rotate(-90deg)" }} />
                      </button>
                      <button
                        type="button"
                        onClick={() => reorderAsset(asset.id, 1)}
                        disabled={index === filteredAssets.length - 1}
                        title="Move Right"
                      >
                        <ArrowDown size={13} style={{ transform: "rotate(-90deg)" }} />
                      </button>
                    </div>

                    <div className="overlay-right">
                      <button
                        type="button"
                        onClick={() => setLinkModalAsset(asset)}
                        className="overlay-btn-indigo"
                        title="Link to Product"
                      >
                        <Link2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDialog({ type: "single", id: asset.id })}
                        className="overlay-btn-danger"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="gallery-card-details">
                  <div className="gallery-card-filename" title={asset.filename}>
                    {asset.filename}
                  </div>
                  <div className="gallery-card-alt" title={asset.alt_text}>
                    {asset.alt_text || "No alt text"}
                  </div>

                  <div className="gallery-card-meta">
                    <span>{formatBytes(asset.file_size)}</span>
                    {asset.links && asset.links.length > 0 ? (
                      <span className="gallery-card-link-badge">
                        {asset.links.length} linked
                      </span>
                    ) : (
                      <span className="gallery-card-unlinked">Unlinked</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 7. Asset Inspector Drawer */}
      {activeAsset && (
        <div
          className="gallery-drawer-backdrop"
          onClick={() => setActiveAssetId(null)}
        >
          <div
            className="gallery-drawer-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="gallery-drawer-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#ecfdf5", color: "#047857", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "13px" }}>
                  #{activeAsset.id}
                </span>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "260px" }}>
                    {activeAsset.filename}
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b" }}>Image Inspector & Metadata</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveAssetId(null)}
                style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#f1f5f9", border: "none", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="gallery-drawer-preview">
              <img
                src={activeAsset.image}
                alt={activeAsset.alt_text || activeAsset.filename}
              />
              <a
                href={activeAsset.image}
                target="_blank"
                rel="noreferrer"
              >
                Full Image <ExternalLink size={12} />
              </a>
            </div>

            <div className="gallery-drawer-stats">
              <div className="gallery-drawer-stat-box">
                <span className="gallery-drawer-stat-label">File Size</span>
                <span className="gallery-drawer-stat-val">{formatBytes(activeAsset.file_size)}</span>
              </div>
              <div className="gallery-drawer-stat-box">
                <span className="gallery-drawer-stat-label">Dimensions</span>
                <span className="gallery-drawer-stat-val">
                  {activeAsset.dimensions ? `${activeAsset.dimensions.width} × ${activeAsset.dimensions.height} px` : "N/A"}
                </span>
              </div>
              <div className="gallery-drawer-stat-box">
                <span className="gallery-drawer-stat-label">Upload Date</span>
                <span className="gallery-drawer-stat-val">
                  {new Date(activeAsset.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </span>
              </div>
              <div className="gallery-drawer-stat-box">
                <span className="gallery-drawer-stat-label">Status</span>
                <span className="gallery-drawer-stat-val" style={{ color: "#047857" }}>
                  {activeAsset.processing_status}
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={saveAssetDetails} style={{ marginTop: "16px" }}>
              <div className="gallery-form-group">
                <label>Filename</label>
                <input
                  type="text"
                  value={editDraft.filename}
                  onChange={(e) => setEditDraft({ ...editDraft, filename: e.target.value })}
                  className="gallery-input"
                />
              </div>

              <div className="gallery-form-group">
                <label>Alt Text (SEO)</label>
                <input
                  type="text"
                  value={editDraft.alt_text}
                  onChange={(e) => setEditDraft({ ...editDraft, alt_text: e.target.value })}
                  className="gallery-input"
                  placeholder="e.g. Alorchoya Premium Diary Notebook..."
                />
              </div>

              <div className="gallery-form-group">
                <label>AI Visual Description / Caption</label>
                <textarea
                  rows={2}
                  value={editDraft.image_caption}
                  onChange={(e) => setEditDraft({ ...editDraft, image_caption: e.target.value })}
                  className="gallery-textarea"
                  placeholder="AI visual description / details..."
                />
              </div>

              <button
                type="submit"
                disabled={savingDetails}
                className="gallery-btn-primary"
                style={{ width: "100%", justifyContent: "center", marginTop: "14px", padding: "10px" }}
              >
                {savingDetails ? "Saving..." : "Save Metadata"}
              </button>
            </form>

            {/* Linked Products Section */}
            <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <h4 style={{ margin: 0, fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#334155" }}>
                  Linked Products ({activeAsset.links?.length || 0})
                </h4>
              </div>

              {activeAsset.links && activeAsset.links.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                  {activeAsset.links.map((link) => (
                    <div
                      key={link.id}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: "10px", border: "1px solid #f1f5f9", background: "#f8fafc", fontSize: "13px" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Package size={14} style={{ color: "#10b981" }} />
                        <span style={{ fontWeight: 700, color: "#0f172a" }}>{link.product_name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnlink(activeAsset.id, link.id)}
                        style={{ background: "transparent", border: "none", color: "#e11d48", fontWeight: 700, fontSize: "11px", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}
                        title="Unlink"
                      >
                        <Unlink size={12} />
                        Unlink
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic", marginBottom: "16px" }}>
                  This image is not linked to any product yet.
                </p>
              )}

              {/* Quick Link to Product Form */}
              <div style={{ padding: "14px", borderRadius: "12px", border: "1px solid #e0e7ff", background: "#eef2ff" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#1e1b4b", marginBottom: "8px" }}>
                  Link to a New Product
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <select
                    value={targetProductId}
                    onChange={(e) => setTargetProductId(e.target.value)}
                    className="gallery-select"
                    style={{ flex: 1, padding: "8px 10px", fontSize: "12px" }}
                  >
                    <option value="">Select target product...</option>
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
                    className="gallery-btn-indigo"
                  >
                    Link
                  </button>
                </div>
              </div>
            </div>

            {/* Delete Image Action */}
            <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #e2e8f0" }}>
              <button
                type="button"
                onClick={() => setConfirmDialog({ type: "single", id: activeAsset.id })}
                className="gallery-btn-danger"
                style={{ width: "100%", justifyContent: "center", padding: "10px" }}
              >
                <Trash2 size={14} />
                Delete this image permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Quick Link Modal */}
      {linkModalAsset && (
        <div
          className="gallery-modal-backdrop"
          onClick={() => setLinkModalAsset(null)}
        >
          <div
            className="gallery-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid #f1f5f9" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                <Link2 size={16} style={{ color: "#4f46e5" }} />
                Link Image to Product
              </h3>
              <button
                type="button"
                onClick={() => setLinkModalAsset(null)}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "16px 0", padding: "12px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <img
                src={linkModalAsset.image}
                alt={linkModalAsset.filename}
                style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {linkModalAsset.filename}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {linkModalAsset.alt_text || "No alt text"}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>
                Select Target Product:
              </label>
              <select
                value={targetProductId}
                onChange={(e) => setTargetProductId(e.target.value)}
                className="gallery-select"
                style={{ width: "100%" }}
              >
                <option value="">Choose a product from catalog...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setLinkModalAsset(null)}
                  className="gallery-btn-white"
                >
                  Clear
                </button>
                <button
                  type="button"
                  disabled={!targetProductId || busy}
                  onClick={() => handleLinkProduct(linkModalAsset.id, Number(targetProductId))}
                  className="gallery-btn-indigo"
                  style={{ padding: "9px 18px", fontSize: "13px" }}
                >
                  {busy ? "Linking..." : "Confirm Link"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. Delete Confirmation Modal */}
      {confirmDialog && (
        <div
          className="gallery-modal-backdrop"
          onClick={() => setConfirmDialog(null)}
        >
          <div
            className="gallery-modal-card"
            style={{ textAlign: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#fee2e2", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <Trash2 size={24} />
            </div>
            <h3 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
              {confirmDialog.type === "bulk"
                ? `Delete ${selectedIds.length} selected images?`
                : "Delete this image?"}
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#64748b", lineHeight: 1.5 }}>
              Deleting this image will remove it permanently from storage and unlink it from all associated products.
            </p>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="gallery-btn-white"
                style={{ flex: 1, justifyContent: "center" }}
              >
                Cancel
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
                className="gallery-btn-danger"
                style={{ flex: 1, justifyContent: "center", background: "#e11d48", color: "#ffffff", border: "none" }}
              >
                {confirmBusy ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
