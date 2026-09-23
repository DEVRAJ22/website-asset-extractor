"use client";

import { AssetLargeList } from "@/components/extractor/asset-large-list";
import { AssetTableView } from "@/components/extractor/asset-table-view";
import { AssetToolbar, type ViewMode } from "@/components/extractor/asset-toolbar";
import { ImagePreviewDialog } from "@/components/extractor/image-preview-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecentUrls } from "@/hooks/use-recent-urls";
import {
  filterAssets,
  sortAssets,
  type AssetFilterType,
  type AssetSort,
} from "@/lib/asset-filters";
import type { ExtractedAsset, ScanResult } from "@/lib/extractor/types";
import { AlertCircle, Globe, Loader2, ScanSearch } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

async function downloadAssetFile(scanId: string, asset: ExtractedAsset) {
  const res = await fetch("/api/download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scanId, url: asset.url }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Download failed");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = asset.filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadZip(scanId: string, assetIds?: string[]) {
  const res = await fetch("/api/download-zip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scanId, assetIds }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "ZIP download failed");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "website-assets.zip";
  a.click();
  URL.revokeObjectURL(url);
}

export function ExtractorDashboard() {
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<AssetFilterType>("all");
  const [sort, setSort] = useState<AssetSort>("resolution");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previewAsset, setPreviewAsset] = useState<ExtractedAsset | null>(null);
  const { recent, addRecent } = useRecentUrls();

  const filtered = useMemo(() => {
    if (!scanResult) return [];
    const f = filterAssets(scanResult.assets, query, typeFilter);
    return sortAssets(f, sort);
  }, [scanResult, query, typeFilter, sort]);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleScan = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setScanError("Enter a website URL to scan.");
      toast.error("Enter a website URL to scan.");
      return;
    }
    setScanning(true);
    setScanError(null);
    setScanResult(null);
    setSelected(new Set());
    setProgressMessage("Connecting to server…");

    try {
      setProgressMessage("Fetching and analyzing page…");
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed, stream: false }),
      });

      const data = (await response.json()) as ScanResult & { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Scan request failed.");
      }

      setScanResult(data);
      addRecent(data.pageUrl);
      toast.success(`Found ${data.assets.length} assets`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Scan failed.";
      setScanError(message);
      toast.error(message);
    } finally {
      setScanning(false);
      setProgressMessage(null);
    }
  };

  const handleDownload = async (asset: ExtractedAsset) => {
    if (!scanResult) return;
    try {
      await downloadAssetFile(scanResult.scanId, asset);
      toast.success(`Downloaded ${asset.filename}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed");
    }
  };

  const handleDownloadSelected = async () => {
    if (!scanResult || selected.size === 0) return;
    try {
      await downloadZip(scanResult.scanId, Array.from(selected));
      toast.success("ZIP download started");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ZIP failed");
    }
  };

  const handleDownloadAll = async () => {
    if (!scanResult) return;
    try {
      await downloadZip(scanResult.scanId);
      toast.success("ZIP download started");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ZIP failed");
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const text = e.dataTransfer.getData("text/plain").trim();
    if (text) setUrl(text);
  };

  return (
    <section id="scanner" className="mx-auto w-full max-w-6xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Globe className="size-5" />
            Scan a public website
          </CardTitle>
          <CardDescription>
            Paste or drop a URL. We extract images, media, icons, and linked files from publicly accessible pages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onSubmit={(e) => {
              e.preventDefault();
              void handleScan();
            }}
          >
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={scanning}
              autoComplete="url"
              name="url"
            />
            <Button type="submit" disabled={scanning} className="shrink-0">
              {scanning ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Scanning…
                </>
              ) : (
                <>
                  <ScanSearch className="size-4" />
                  Scan website
                </>
              )}
            </Button>
          </form>
          {recent.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {recent.map((item) => (
                <Button
                  key={item}
                  variant="outline"
                  size="sm"
                  className="max-w-full truncate font-normal"
                  onClick={() => setUrl(item)}
                >
                  {item}
                </Button>
              ))}
            </div>
          )}
          {scanning && (
            <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="size-4 animate-spin" />
                {progressMessage ?? "Scanning…"}
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          )}
          {scanError && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {scanError}
            </div>
          )}
        </CardContent>
      </Card>

      {scanResult && (
        <div className="mt-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{scanResult.assets.length} assets</Badge>
            {scanResult.failedAssetCount > 0 && (
              <Badge variant="outline">{scanResult.failedAssetCount} probe warnings</Badge>
            )}
            {scanResult.usedPlaywright && <Badge>JS rendered</Badge>}
          </div>
          {(scanResult.warnings.length > 0 || scanResult.errors.length > 0) && (
            <ul className="space-y-1 text-sm text-muted-foreground">
              {[...scanResult.warnings, ...scanResult.errors].map((msg) => (
                <li key={msg}>• {msg}</li>
              ))}
            </ul>
          )}

          <AssetToolbar
            query={query}
            onQueryChange={setQuery}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            sort={sort}
            onSortChange={setSort}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            selectedCount={selected.size}
            totalCount={filtered.length}
            onSelectAll={() => setSelected(new Set(filtered.map((a) => a.id)))}
            onClearSelection={() => setSelected(new Set())}
            onDownloadSelected={handleDownloadSelected}
            onDownloadAllZip={handleDownloadAll}
          />

          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
              No assets match your filters.
            </div>
          ) : viewMode === "table" ? (
            <AssetTableView
              assets={filtered}
              selected={selected}
              onToggle={toggleSelect}
              onDownload={handleDownload}
              onPreview={(asset) => {
                if (asset.type === "image" || asset.type === "svg") {
                  setPreviewAsset(asset);
                }
              }}
            />
          ) : (
            <AssetLargeList
              assets={filtered}
              selected={selected}
              onToggle={toggleSelect}
              onDownload={handleDownload}
              onPreview={(asset) => setPreviewAsset(asset)}
            />
          )}
        </div>
      )}

      <ImagePreviewDialog
        asset={previewAsset}
        open={!!previewAsset}
        onOpenChange={(open) => !open && setPreviewAsset(null)}
        onDownload={handleDownload}
      />
    </section>
  );
}
