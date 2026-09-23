import type { CheerioAPI } from "cheerio";
import type { RawAsset } from "@/lib/extractor/types";
import { resolveUrl } from "@/lib/extractor/url-utils";

export function extractVideos($: CheerioAPI, baseUrl: string): RawAsset[] {
  const assets: RawAsset[] = [];

  $("video").each((_, el) => {
    const poster = $(el).attr("poster");
    if (poster) {
      const url = resolveUrl(baseUrl, poster);
      if (url) {
        assets.push({ url, type: "image", source: "video poster" });
      }
    }
    const src = $(el).attr("src");
    if (src) {
      const url = resolveUrl(baseUrl, src);
      if (url) assets.push({ url, type: "video", source: "video[src]" });
    }
  });

  $("video source, source[type^='video/']").each((_, el) => {
    const src = $(el).attr("src");
    if (!src) return;
    const url = resolveUrl(baseUrl, src);
    if (url) assets.push({ url, type: "video", source: "video source" });
  });

  $('meta[property="og:video"], meta[property="og:video:url"]').each((_, el) => {
    const content = $(el).attr("content");
    if (!content) return;
    const url = resolveUrl(baseUrl, content);
    if (url) assets.push({ url, type: "video", source: "og:video" });
  });

  return assets;
}
