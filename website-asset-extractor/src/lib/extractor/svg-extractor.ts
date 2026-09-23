import type { CheerioAPI } from "cheerio";
import type { RawAsset } from "@/lib/extractor/types";
import { getExtensionFromUrl, resolveUrl } from "@/lib/extractor/url-utils";

export function extractSvgs($: CheerioAPI, baseUrl: string): RawAsset[] {
  const assets: RawAsset[] = [];

  $("object[data], embed[src]").each((_, el) => {
    const raw = $(el).attr("data") ?? $(el).attr("src");
    if (!raw) return;
    const url = resolveUrl(baseUrl, raw);
    if (!url) return;
    if (getExtensionFromUrl(url) === "svg" || url.includes(".svg")) {
      assets.push({ url, type: "svg", source: "object/embed svg" });
    }
  });

  $("a[href$='.svg'], a[href*='.svg?']").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    const url = resolveUrl(baseUrl, href);
    if (url) assets.push({ url, type: "svg", source: "link to svg" });
  });

  return assets;
}
