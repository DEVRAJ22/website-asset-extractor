import type { CheerioAPI } from "cheerio";
import type { RawAsset } from "@/lib/extractor/types";
import {
  extractUrlsFromCss,
  inferTypeFromUrl,
  parseSrcSet,
  pickBestSrcSetCandidate,
  resolveUrl,
} from "@/lib/extractor/url-utils";

const LAZY_ATTRS = [
  "src",
  "data-src",
  "data-lazy-src",
  "data-original",
  "data-lazy",
  "data-url",
  "data-image",
];

function pushImage(
  assets: RawAsset[],
  baseUrl: string,
  raw: string | undefined,
  source: string,
  width?: number,
  height?: number,
) {
  if (!raw) return;
  const url = resolveUrl(baseUrl, raw);
  if (!url) return;
  const type = inferTypeFromUrl(url);
  if (type !== "image" && type !== "svg") return;
  assets.push({ url, type, source, width, height });
}

export function extractImages($: CheerioAPI, baseUrl: string): RawAsset[] {
  const assets: RawAsset[] = [];

  $("img").each((_, el) => {
    const width = parseInt($(el).attr("width") ?? "", 10) || undefined;
    const height = parseInt($(el).attr("height") ?? "", 10) || undefined;

    for (const attr of LAZY_ATTRS) {
      pushImage(assets, baseUrl, $(el).attr(attr), `img[${attr}]`, width, height);
    }

    const srcset = $(el).attr("srcset") ?? $(el).attr("data-srcset");
    if (srcset) {
      const candidates = parseSrcSet(srcset, baseUrl);
      const best = pickBestSrcSetCandidate(candidates);
      if (best) {
        pushImage(
          assets,
          baseUrl,
          best.url,
          "img[srcset]",
          best.width ?? width,
          height,
        );
      }
    }
  });

  $("picture source").each((_, el) => {
    const srcset = $(el).attr("srcset");
    if (!srcset) return;
    const candidates = parseSrcSet(srcset, baseUrl);
    const best = pickBestSrcSetCandidate(candidates);
    if (best) {
      pushImage(assets, baseUrl, best.url, "picture source", best.width);
    }
    pushImage(assets, baseUrl, $(el).attr("src"), "picture source[src]");
  });

  const metaSelectors: Array<[string, string]> = [
    ['meta[property="og:image"]', "og:image"],
    ['meta[property="og:image:url"]', "og:image:url"],
    ['meta[property="og:image:secure_url"]', "og:image:secure_url"],
    ['meta[name="twitter:image"]', "twitter:image"],
    ['meta[name="twitter:image:src"]', "twitter:image:src"],
  ];

  for (const [selector, source] of metaSelectors) {
    $(selector).each((_, el) => {
      pushImage(assets, baseUrl, $(el).attr("content"), source);
    });
  }

  $('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').each(
    (_, el) => {
      pushImage(assets, baseUrl, $(el).attr("href"), "link icon");
    },
  );

  $("[style]").each((_, el) => {
    const style = $(el).attr("style");
    if (!style) return;
    for (const url of extractUrlsFromCss(style, baseUrl)) {
      const type = inferTypeFromUrl(url);
      if (type === "image" || type === "svg") {
        assets.push({ url, type, source: "inline style background" });
      }
    }
  });

  $("style").each((_, el) => {
    const css = $(el).html() ?? "";
    for (const url of extractUrlsFromCss(css, baseUrl)) {
      const type = inferTypeFromUrl(url);
      if (type === "image" || type === "svg") {
        assets.push({ url, type, source: "style tag background" });
      }
    }
  });

  return assets;
}
