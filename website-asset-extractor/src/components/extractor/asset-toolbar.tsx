"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AssetFilterType, AssetSort } from "@/lib/asset-filters";
import { Archive, Download, LayoutGrid, List, Search } from "lucide-react";

export type ViewMode = "table" | "large";

interface AssetToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  typeFilter: AssetFilterType;
  onTypeFilterChange: (value: AssetFilterType) => void;
  sort: AssetSort;
  onSortChange: (value: AssetSort) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDownloadSelected: () => void;
  onDownloadAllZip: () => void;
  disabled?: boolean;
}

export function AssetToolbar({
  query,
  onQueryChange,
  typeFilter,
  onTypeFilterChange,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onDownloadSelected,
  onDownloadAllZip,
  disabled,
}: AssetToolbarProps) {
  return (
    <div className="sticky top-0 z-20 space-y-3 border-b bg-background/95 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search by filename, URL, or format…"
            className="pl-9"
            disabled={disabled}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={typeFilter}
            onValueChange={(v) => onTypeFilterChange(v as AssetFilterType)}
            disabled={disabled}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
              <SelectItem value="svg">SVG</SelectItem>
              <SelectItem value="file">Files</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sort}
            onValueChange={(v) => onSortChange(v as AssetSort)}
            disabled={disabled}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="resolution">Resolution</SelectItem>
              <SelectItem value="size">File size</SelectItem>
              <SelectItem value="type">Type</SelectItem>
              <SelectItem value="url">URL</SelectItem>
            </SelectContent>
          </Select>
          <Tabs
            value={viewMode}
            onValueChange={(v) => onViewModeChange(v as ViewMode)}
          >
            <TabsList>
              <TabsTrigger value="table" disabled={disabled}>
                <List className="size-4" />
                <span className="sr-only">Table</span>
              </TabsTrigger>
              <TabsTrigger value="large" disabled={disabled}>
                <LayoutGrid className="size-4" />
                <span className="sr-only">Large list</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {totalCount} assets · {selectedCount} selected
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onSelectAll} disabled={disabled || totalCount === 0}>
            Select all
          </Button>
          <Button variant="outline" size="sm" onClick={onClearSelection} disabled={disabled || selectedCount === 0}>
            Clear
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onDownloadSelected}
            disabled={disabled || selectedCount === 0}
          >
            <Download className="size-4" />
            Download selected
          </Button>
          <Button size="sm" onClick={onDownloadAllZip} disabled={disabled || totalCount === 0}>
            <Archive className="size-4" />
            Download all ZIP
          </Button>
        </div>
      </div>
    </div>
  );
}
