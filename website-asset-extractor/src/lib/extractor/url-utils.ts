import {
  AUDIO_EXTENSIONS,
  FILE_EXTENSIONS,
  IMAGE_EXTENSIONS,
  VIDEO_EXTENSIONS,
} from "@/lib/constants";
import type { AssetType } from "@/lib/extractor/types";

export function normalizeUrlKey(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    const host = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.replace(/\/+$/, "") || "/";
    const search = parsed.search;
    return `${parsed.protocol}//${host}${pathname}${search}`;
  } catch {
    return url.trim();
  }
}

export function resolveUrl(baseUrl: string, candidate: string): string | null {
  const trimmed = candidate.trim();
  if (!trimmed || trimmed.startsWith("javascript:") || trimmed.startsWith("data:")) {
    return null;
  }
  if (trimmed.startsWith("blob:")) {
    return null;
  }
  try {
    if (trimmed.startsWith("//")) {
      const base = new URL(baseUrl);
      return `${base.protocol}${trimmed}`;
    }
    return new URL(trimmed, baseUrl).href;
  } catch {
    return null;
  }
}

export function getExtensionFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const last = pathname.split("/").pop() ?? "";
    const dot = last.lastIndexOf(".");
    if (dot === -1) return "";
    return last.slice(dot + 1).toLowerCase().split("?")[0];
  } catch {
    return "";
  }
}

export function getFilenameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const segment = pathname.split("/").filter(Boolean).pop();
    if (segment) return decodeURIComponent(segment.split("?")[0]);
  } catch {
    /* ignore */
  }
  return "asset";
}

export function inferFormat(url: string, contentType?: string): string {
  const ext = getExtensionFromUrl(url);
  if (ext) return ext;
  if (contentType) {
    const part = contentType.split(";")[0].trim();
    if (part.includes("/")) return part.split("/")[1] ?? "unknown";
  }
  return "unknown";
}

export function inferTypeFromUrl(url: string, hint?: AssetType): AssetType {
  if (hint) return hint;
  const ext = getExtensionFromUrl(url);
  if (ext === "svg" || ext === "svgz") return "svg";
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  if (VIDEO_EXTENSIONS.has(ext)) return "video";
  if (AUDIO_EXTENSIONS.has(ext)) return "audio";
  if (FILE_EXTENSIONS.has(ext)) return "file";
  if (url.includes(".svg")) return "svg";
  return "image";
}

export interface SrcSetCandidate {
  url: string;
  width?: number;
  density?: number;
}

export function parseSrcSet(srcset: string, baseUrl: string): SrcSetCandidate[] {
  const parts = srcset.split(",").map((p) => p.trim()).filter(Boolean);
  const candidates: SrcSetCandidate[] = [];

  for (const part of parts) {
    const tokens = part.split(/\s+/);
    const rawUrl = tokens[0];
    const resolved = resolveUrl(baseUrl, rawUrl);
    if (!resolved) continue;

    let width: number | undefined;
    let density: number | undefined;
    for (const token of tokens.slice(1)) {
      if (token.endsWith("w")) {
        width = parseInt(token, 10);
      } else if (token.endsWith("x")) {
        density = parseFloat(token);
      }
    }
    candidates.push({ url: resolved, width, density });
  }
  return candidates;
}

export function pickBestSrcSetCandidate(
  candidates: SrcSetCandidate[],
): SrcSetCandidate | null {
  if (candidates.length === 0) return null;
  const withWidth = candidates.filter((c) => c.width);
  if (withWidth.length > 0) {
    return withWidth.reduce((best, cur) =>
      (cur.width ?? 0) > (best.width ?? 0) ? cur : best,
    );
  }
  const withDensity = candidates.filter((c) => c.density);
  if (withDensity.length > 0) {
    return withDensity.reduce((best, cur) =>
      (cur.density ?? 0) > (best.density ?? 0) ? cur : best,
    );
  }
  return candidates[candidates.length - 1];
}

export function extractUrlsFromCss(css: string, baseUrl: string): string[] {
  const urls: string[] = [];
  const re = /url\(\s*['"]?([^'")]+)['"]?\s*\)/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(css)) !== null) {
    const resolved = resolveUrl(baseUrl, match[1]);
    if (resolved) urls.push(resolved);
  }
  return urls;
}
