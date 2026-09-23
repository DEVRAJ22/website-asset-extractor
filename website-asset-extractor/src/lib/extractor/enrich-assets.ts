import { MAX_ASSETS } from "@/lib/constants";
import type { ExtractedAsset, RawAsset } from "@/lib/extractor/types";
import {
  getFilenameFromUrl,
  inferFormat,
  inferTypeFromUrl,
} from "@/lib/extractor/url-utils";
import { assertSafePublicUrl } from "@/lib/extractor/ssrf";

async function probeAsset(url: string): Promise<{ size?: number; contentType?: string }> {
  try {
    await assertSafePublicUrl(url);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      const response = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "follow",
        headers: { "User-Agent": "WebsiteAssetExtractor/1.0" },
      });
      const length = response.headers.get("content-length");
      const contentType = response.headers.get("content-type") ?? undefined;
      return {
        size: length ? parseInt(length, 10) : undefined,
        contentType,
      };
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return {};
  }
}

export async function enrichAssets(
  raw: RawAsset[],
  onProgress?: (count: number) => void,
): Promise<{ assets: ExtractedAsset[]; failedCount: number }> {
  const limited = raw.slice(0, MAX_ASSETS);
  const assets: ExtractedAsset[] = [];
  let failedCount = 0;

  const batchSize = 10;
  for (let i = 0; i < limited.length; i += batchSize) {
    const batch = limited.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (item, index) => {
        const id = `${i + index}-${Buffer.from(item.url).toString("base64url").slice(0, 12)}`;
        let failed = false;
        let size: number | undefined;
        let format = item.format ?? inferFormat(item.url);

        try {
          const probe = await probeAsset(item.url);
          size = probe.size;
          if (probe.contentType) {
            format = inferFormat(item.url, probe.contentType);
          }
        } catch {
          failed = true;
          failedCount += 1;
        }

        const type = item.type ?? inferTypeFromUrl(item.url);
        const asset: ExtractedAsset = {
          id,
          url: item.url,
          type,
          filename: getFilenameFromUrl(item.url),
          format,
          width: item.width,
          height: item.height,
          size,
          source: item.source,
          failed,
        };
        return asset;
      }),
    );
    assets.push(...results);
    onProgress?.(assets.length);
  }

  return { assets, failedCount };
}
