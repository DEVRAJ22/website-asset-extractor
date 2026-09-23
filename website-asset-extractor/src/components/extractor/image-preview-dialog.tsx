"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ExtractedAsset } from "@/lib/extractor/types";
import { formatBytes, formatDimensions } from "@/lib/format";
import { Download, ExternalLink } from "lucide-react";

interface ImagePreviewDialogProps {
  asset: ExtractedAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (asset: ExtractedAsset) => void;
}

export function ImagePreviewDialog({
  asset,
  open,
  onOpenChange,
  onDownload,
}: ImagePreviewDialogProps) {
  if (!asset) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">{asset.filename}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex max-h-[50vh] items-center justify-center overflow-hidden rounded-lg border bg-muted/30 p-4">
            {asset.type === "image" || asset.type === "svg" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={asset.url}
                alt={asset.filename}
                className="max-h-[48vh] max-w-full object-contain"
              />
            ) : (
              <p className="text-sm text-muted-foreground">No preview available</p>
            )}
          </div>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Dimensions</dt>
              <dd>{formatDimensions(asset.width, asset.height)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Format</dt>
              <dd className="uppercase">{asset.format}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">File size</dt>
              <dd>{formatBytes(asset.size)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Source URL</dt>
              <dd className="break-all font-mono text-xs">{asset.url}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => onDownload(asset)}>
              <Download className="size-4" />
              Download
            </Button>
            <Button variant="outline" asChild>
              <a href={asset.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
                Open source
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
