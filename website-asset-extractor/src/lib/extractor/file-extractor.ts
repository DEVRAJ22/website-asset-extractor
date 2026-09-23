import type { CheerioAPI } from "cheerio";
import { FILE_EXTENSIONS } from "@/lib/constants";
import type { RawAsset } from "@/lib/extractor/types";
import {
  getExtensionFromUrl,
  inferTypeFromUrl,
  resolveUrl,
} from "@/lib/extractor/url-utils";

const DOWNLOADABLE_RE =
  /\.(pdf|zip|rar|7z|docx?|xlsx?|pptx?|csv|txt|json|xml|tar|gz)(\?|$)/i;

export function extractFiles($: CheerioAPI, baseUrl: string): RawAsset[] {
  const assets: RawAsset[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    const url = resolveUrl(baseUrl, href);
    if (!url) return;

    const ext = getExtensionFromUrl(url);
    const isFile =
      FILE_EXTENSIONS.has(ext) ||
      DOWNLOADABLE_RE.test(url) ||
      $(el).attr("download") !== undefined;

    if (!isFile) return;

    const type = inferTypeFromUrl(url, "file");
    assets.push({ url, type, source: "download link" });
  });

  return assets;
}
