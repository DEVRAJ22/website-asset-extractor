import type { CheerioAPI } from "cheerio";
import type { RawAsset } from "@/lib/extractor/types";
import { resolveUrl } from "@/lib/extractor/url-utils";

export function extractAudio($: CheerioAPI, baseUrl: string): RawAsset[] {
  const assets: RawAsset[] = [];

  $("audio").each((_, el) => {
    const src = $(el).attr("src");
    if (src) {
      const url = resolveUrl(baseUrl, src);
      if (url) assets.push({ url, type: "audio", source: "audio[src]" });
    }
  });

  $("audio source, source[type^='audio/']").each((_, el) => {
    const src = $(el).attr("src");
    if (!src) return;
    const url = resolveUrl(baseUrl, src);
    if (url) assets.push({ url, type: "audio", source: "audio source" });
  });

  return assets;
}
