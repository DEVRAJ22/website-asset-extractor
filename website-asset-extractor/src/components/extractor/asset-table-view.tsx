"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ExtractedAsset } from "@/lib/extractor/types";
import { formatBytes, formatDimensions } from "@/lib/format";
import { Download, ExternalLink } from "lucide-react";

interface AssetTableViewProps {
  assets: ExtractedAsset[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onDownload: (asset: ExtractedAsset) => void;
  onPreview: (asset: ExtractedAsset) => void;
}

function AssetThumb({ asset, onPreview }: { asset: ExtractedAsset; onPreview: () => void }) {
  if (asset.type === "image" || asset.type === "svg") {
    return (
      <button
        type="button"
        onClick={onPreview}
        className="flex size-12 items-center justify-center overflow-hidden rounded border bg-muted/40"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset.url}
          alt=""
          className="max size-12 object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </button>
    );
  }
  return (
    <div className="flex size-12 items-center justify-center rounded border bg-muted/40 text-[10px] uppercase text-muted-foreground">
      {asset.type}
    </div>
  );
}

export function AssetTableView({
  assets,
  selected,
  onToggle,
  onDownload,
  onPreview,
}: AssetTableViewProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead className="w-16">Preview</TableHead>
            <TableHead>Filename</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Format</TableHead>
            <TableHead>Dimensions</TableHead>
            <TableHead>Size</TableHead>
            <TableHead className="hidden lg:table-cell">Source</TableHead>
            <TableHead className="w-28 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset) => (
            <TableRow key={asset.id} data-state={selected.has(asset.id) ? "selected" : undefined}>
              <TableCell>
                <Checkbox
                  checked={selected.has(asset.id)}
                  onCheckedChange={() => onToggle(asset.id)}
                  aria-label={`Select ${asset.filename}`}
                />
              </TableCell>
              <TableCell>
                <AssetThumb
                  asset={asset}
                  onPreview={() => onPreview(asset)}
                />
              </TableCell>
              <TableCell className="max-w-[200px] truncate font-medium">
                {asset.filename}
                {asset.failed && (
                  <Badge variant="outline" className="ml-2 text-[10px]">
                    probe failed
                  </Badge>
                )}
              </TableCell>
              <TableCell className="capitalize">{asset.type}</TableCell>
              <TableCell className="uppercase">{asset.format}</TableCell>
              <TableCell>{formatDimensions(asset.width, asset.height)}</TableCell>
              <TableCell>{formatBytes(asset.size)}</TableCell>
              <TableCell className="hidden max-w-[220px] truncate font-mono text-xs lg:table-cell">
                {asset.url}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onDownload(asset)}
                    aria-label="Download"
                  >
                    <Download className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" asChild>
                    <a href={asset.url} target="_blank" rel="noopener noreferrer" aria-label="Open source">
                      <ExternalLink className="size-4" />
                    </a>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
