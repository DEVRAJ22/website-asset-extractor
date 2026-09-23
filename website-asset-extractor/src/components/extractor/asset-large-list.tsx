"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { ExtractedAsset } from "@/lib/extractor/types";
import { formatBytes, formatDimensions } from "@/lib/format";
import { Download, ExternalLink } from "lucide-react";

interface AssetLargeListProps {
  assets: ExtractedAsset[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onDownload: (asset: ExtractedAsset) => void;
  onPreview: (asset: ExtractedAsset) => void;
}

export function AssetLargeList({
  assets,
  selected,
  onToggle,
  onDownload,
  onPreview,
}: AssetLargeListProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {assets.map((asset) => (
        <article
          key={asset.id}
          className="flex flex-col overflow-hidden rounded-lg border bg-card"
        >
          <div className="relative aspect-video bg-muted/30">
            {asset.type === "image" || asset.type === "svg" ? (
              <button
                type="button"
                className="size-full"
                onClick={() => onPreview(asset)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.url}
                  alt={asset.filename}
                  className="size-full object-contain p-2"
                  loading="lazy"
                />
              </button>
            ) : (
              <div className="flex size-full items-center justify-center text-sm capitalize text-muted-foreground">
                {asset.type} asset
              </div>
            )}
            <div className="absolute left-2 top-2">
              <Checkbox
                checked={selected.has(asset.id)}
                onCheckedChange={() => onToggle(asset.id)}
                aria-label={`Select ${asset.filename}`}
                className="bg-background"
              />
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-2 p-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 text-sm font-medium leading-snug">
                {asset.filename}
              </h3>
              <Badge variant="secondary" className="shrink-0 capitalize">
                {asset.type}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDimensions(asset.width, asset.height)} · {formatBytes(asset.size)} ·{" "}
              <span className="uppercase">{asset.format}</span>
            </p>
            <p className="line-clamp-2 font-mono text-[10px] text-muted-foreground">
              {asset.url}
            </p>
            <div className="mt-auto flex gap-2 pt-2">
              <Button size="sm" variant="secondary" onClick={() => onDownload(asset)}>
                <Download className="size-3.5" />
                Download
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={asset.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-3.5" />
                  Open
                </a>
              </Button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
