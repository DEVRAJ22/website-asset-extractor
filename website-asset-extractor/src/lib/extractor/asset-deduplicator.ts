import { normalizeUrlKey, pickBestSrcSetCandidate } from "@/lib/extractor/url-utils";
import type { RawAsset } from "@/lib/extractor/types";

function imageGroupKey(asset: RawAsset): string {
  try {
    const url = new URL(asset.url);
    const path = url.pathname.replace(/-\d+x\d+(?=\.[a-z]+$)/i, "");
    return `${url.hostname}${path}`;
  } catch {
    return normalizeUrlKey(asset.url);
  }
}

export function deduplicateAssets(assets: RawAsset[]): RawAsset[] {
  const byUrl = new Map<string, RawAsset>();
  const imageGroups = new Map<string, RawAsset[]>();

  for (const asset of assets) {
    const key = normalizeUrlKey(asset.url);
    const existing = byUrl.get(key);
    if (!existing) {
      byUrl.set(key, asset);
    } else {
      const merged: RawAsset = {
        ...existing,
        width: Math.max(existing.width ?? 0, asset.width ?? 0) || undefined,
        height: Math.max(existing.height ?? 0, asset.height ?? 0) || undefined,
        source: existing.source.includes(asset.source)
          ? existing.source
          : `${existing.source}, ${asset.source}`,
      };
      byUrl.set(key, merged);
    }

    if (asset.type === "image" || asset.type === "svg") {
      const gKey = imageGroupKey(asset);
      const group = imageGroups.get(gKey) ?? [];
      group.push(asset);
      imageGroups.set(gKey, group);
    }
  }

  const dropUrls = new Set<string>();
  for (const [, group] of imageGroups) {
    if (group.length <= 1) continue;
    const candidates = group.map((a) => ({
      url: a.url,
      width: a.width,
    }));
    const best = pickBestSrcSetCandidate(candidates);
    if (!best) continue;
    for (const item of group) {
      if (normalizeUrlKey(item.url) !== normalizeUrlKey(best.url)) {
        dropUrls.add(normalizeUrlKey(item.url));
      }
    }
  }

  const result: RawAsset[] = [];
  for (const [key, asset] of byUrl) {
    if (!dropUrls.has(key)) result.push(asset);
  }
  return result;
}
