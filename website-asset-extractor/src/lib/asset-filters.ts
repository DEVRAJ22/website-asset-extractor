import type { ExtractedAsset } from "@/lib/extractor/types";

export type AssetFilterType = "all" | "image" | "video" | "audio" | "svg" | "file";
export type AssetSort = "resolution" | "size" | "type" | "url";

export function filterAssets(
  assets: ExtractedAsset[],
  query: string,
  typeFilter: AssetFilterType,
): ExtractedAsset[] {
  const q = query.trim().toLowerCase();
  return assets.filter((asset) => {
    if (typeFilter !== "all" && asset.type !== typeFilter) return false;
    if (!q) return true;
    return (
      asset.filename.toLowerCase().includes(q) ||
      asset.url.toLowerCase().includes(q) ||
      asset.format.toLowerCase().includes(q) ||
      asset.source.toLowerCase().includes(q)
    );
  });
}

export function sortAssets(assets: ExtractedAsset[], sort: AssetSort): ExtractedAsset[] {
  const copy = [...assets];
  copy.sort((a, b) => {
    switch (sort) {
      case "resolution": {
        const areaA = (a.width ?? 0) * (a.height ?? 0);
        const areaB = (b.width ?? 0) * (b.height ?? 0);
        return areaB - areaA;
      }
      case "size":
        return (b.size ?? 0) - (a.size ?? 0);
      case "type":
        return a.type.localeCompare(b.type);
      case "url":
        return a.url.localeCompare(b.url);
      default:
        return 0;
    }
  });
  return copy;
}
