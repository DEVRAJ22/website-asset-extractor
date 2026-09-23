import {
  FETCH_TIMEOUT_MS,
  MAX_PAGE_BYTES,
  MAX_REDIRECTS,
  PLAYWRIGHT_TIMEOUT_MS,
} from "@/lib/constants";
import { assertSafePublicUrl } from "@/lib/extractor/ssrf";

export interface PageContent {
  html: string;
  finalUrl: string;
  usedPlaywright: boolean;
}

async function fetchWithRedirects(url: string): Promise<{ html: string; finalUrl: string }> {
  let current = url;
  let redirects = 0;

  while (redirects <= MAX_REDIRECTS) {
    await assertSafePublicUrl(current);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(current, {
        signal: controller.signal,
        redirect: "manual",
        headers: {
          "User-Agent":
            "WebsiteAssetExtractor/1.0 (+https://github.com; public research bot)",
          Accept: "text/html,application/xhtml+xml",
        },
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) {
          throw new Error("Redirect without location header.");
        }
        current = new URL(location, current).href;
        redirects += 1;
        continue;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch page (HTTP ${response.status}).`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Empty response body.");

      const chunks: Uint8Array[] = [];
      let total = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > MAX_PAGE_BYTES) {
          throw new Error("Page exceeds maximum allowed size.");
        }
        chunks.push(value);
      }

      const html = Buffer.concat(chunks).toString("utf-8");
      return { html, finalUrl: current };
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error("Too many redirects.");
}

function shouldTryPlaywright(html: string): boolean {
  const imgCount = (html.match(/<img\b/gi) ?? []).length;
  const hasAppShell =
    /id=["']__next["']|id=["']root["']|data-reactroot/i.test(html) &&
    imgCount < 2;
  const hasLazyHints = /data-src|loading=["']lazy["']/i.test(html);
  return hasAppShell || (hasLazyHints && imgCount < 3);
}

async function fetchWithPlaywright(url: string): Promise<{ html: string; finalUrl: string }> {
  await assertSafePublicUrl(url);
  let chromium: typeof import("playwright").chromium;
  try {
    const pw = await import("playwright");
    chromium = pw.chromium;
  } catch {
    const pwCore = await import("playwright-core");
    chromium = pwCore.chromium;
  }

  const browser = await chromium.launch({
    headless: true,
    timeout: 15_000,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: PLAYWRIGHT_TIMEOUT_MS,
    });
    await page.waitForTimeout(800);
    const html = await page.content();
    const finalUrl = page.url();
    await assertSafePublicUrl(finalUrl);
    return { html, finalUrl };
  } finally {
    await browser.close();
  }
}

export async function loadPageContent(url: string): Promise<PageContent> {
  const fetched = await fetchWithRedirects(url);

  const playwrightEnabled = process.env.ENABLE_PLAYWRIGHT === "1";
  if (
    playwrightEnabled &&
    shouldTryPlaywright(fetched.html) &&
    process.env.VERCEL !== "1"
  ) {
    try {
      const rendered = await fetchWithPlaywright(fetched.finalUrl);
      return { ...rendered, usedPlaywright: true };
    } catch {
      /* fall back to static HTML */
    }
  }

  return { ...fetched, usedPlaywright: false };
}
