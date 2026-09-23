import * as cheerio from "cheerio";
import { MAX_ASSETS } from "@/lib/constants";
import { deduplicateAssets } from "@/lib/extractor/asset-deduplicator";
import { extractAudio } from "@/lib/extractor/audio-extractor";
import { enrichAssets } from "@/lib/extractor/enrich-assets";
import { extractFiles } from "@/lib/extractor/file-extractor";
import { loadPageContent } from "@/lib/extractor/fetch-page";
import { extractImages } from "@/lib/extractor/image-extractor";
import { extractSvgs } from "@/lib/extractor/svg-extractor";
import type { ScanResult } from "@/lib/extractor/types";
import { extractVideos } from "@/lib/extractor/video-extractor";
import { extractUrlsFromCss, resolveUrl } from "@/lib/extractor/url-utils";
import { randomUUID } from "node:crypto";

export interface ScanOptions {
  onProgress?: (stage: string, message: string, count?: number) => void;
}

export async function scanWebsite(
  url: string,
  options: ScanOptions = {},
): Promise<ScanResult> {
  const { onProgress } = options;
  const warnings: string[] = [];
  const errors: string[] = [];

  onProgress?.("fetch", "Fetching page content…");
  const page = await loadPageContent(url);
  if (page.usedPlaywright) {
    warnings.push("Rendered page with Playwright for dynamic content.");
  } else if (process.env.VERCEL === "1") {
    warnings.push(
      "Using static HTML fetch on this deployment. Some lazy-loaded assets may be missed.",
    );
  }

  onProgress?.("parse", "Parsing HTML and extracting asset URLs…");
  const $ = cheerio.load(page.html);
  const baseUrl = page.finalUrl;

  const raw = [
    ...extractImages($, baseUrl),
    ...extractVideos($, baseUrl),
    ...extractAudio($, baseUrl),
    ...extractSvgs($, baseUrl),
    ...extractFiles($, baseUrl),
  ];

  const stylesheetUrls: string[] = [];
  $('link[rel="stylesheet"][href]').each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    const resolved = resolveUrl(baseUrl, href);
    if (resolved) stylesheetUrls.push(resolved);
  });

  const cssToFetch = stylesheetUrls.slice(0, 8);
  for (const sheetUrl of cssToFetch) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8_000);
      const res = await fetch(sheetUrl, {
        signal: controller.signal,
        headers: { "User-Agent": "WebsiteAssetExtractor/1.0" },
      });
      clearTimeout(timeout);
      if (!res.ok) continue;
      const css = await res.text();
      for (const bgUrl of extractUrlsFromCss(css, sheetUrl)) {
        raw.push({ url: bgUrl, type: "image", source: "external stylesheet" });
      }
    } catch {
      warnings.push(`Could not fetch stylesheet: ${sheetUrl}`);
    }
  }

  const deduped = deduplicateAssets(raw);
  if (deduped.length > MAX_ASSETS) {
    warnings.push(`Capped results at ${MAX_ASSETS} assets.`);
  }

  onProgress?.("enrich", "Probing asset metadata…", deduped.length);
  const { assets, failedCount } = await enrichAssets(deduped, (count) => {
    onProgress?.("enrich", "Probing asset metadata…", count);
  });

  if (failedCount > 0) {
    warnings.push(`${failedCount} assets could not be fully probed (size/metadata).`);
  }

  onProgress?.("done", "Scan complete.", assets.length);

  return {
    scanId: randomUUID(),
    pageUrl: url,
    finalUrl: baseUrl,
    assets,
    warnings,
    errors,
    failedAssetCount: failedCount,
    usedPlaywright: page.usedPlaywright,
    fetchedAt: new Date().toISOString(),
  };
}
