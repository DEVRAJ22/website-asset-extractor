import { ZipArchive } from "archiver";
import { PassThrough } from "node:stream";
import {
  FETCH_TIMEOUT_MS,
  MAX_SINGLE_DOWNLOAD_BYTES,
  MAX_ZIP_BYTES,
  MAX_ZIP_FILES,
} from "@/lib/constants";
import type { ExtractedAsset } from "@/lib/extractor/types";
import { assertSafePublicUrl } from "@/lib/extractor/ssrf";
import { getFilenameFromUrl } from "@/lib/extractor/url-utils";

export function uniqueFilename(name: string, used: Set<string>): string {
  if (!used.has(name)) {
    used.add(name);
    return name;
  }
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  let i = 2;
  while (used.has(`${base}-${i}${ext}`)) i += 1;
  const unique = `${base}-${i}${ext}`;
  used.add(unique);
  return unique;
}

export async function fetchAssetBuffer(url: string): Promise<Buffer> {
  await assertSafePublicUrl(url);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "WebsiteAssetExtractor/1.0" },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Empty body");
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_SINGLE_DOWNLOAD_BYTES) {
        throw new Error("File exceeds maximum download size.");
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks);
  } finally {
    clearTimeout(timeout);
  }
}

export async function buildZipBuffer(assets: ExtractedAsset[]): Promise<Buffer> {
  if (assets.length > MAX_ZIP_FILES) {
    throw new Error(`ZIP limited to ${MAX_ZIP_FILES} files.`);
  }

  const archive = new ZipArchive({ zlib: { level: 6 } });
  const stream = new PassThrough();
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  const done = new Promise<Buffer>((resolve, reject) => {
    stream.on("data", (chunk: Buffer) => {
      totalBytes += chunk.length;
      if (totalBytes > MAX_ZIP_BYTES) {
        reject(new Error("ZIP exceeds maximum allowed size."));
        archive.abort();
        return;
      }
      chunks.push(chunk);
    });
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
    archive.on("error", reject);
  });

  archive.pipe(stream);
  const usedNames = new Set<string>();

  for (const asset of assets) {
    try {
      const buffer = await fetchAssetBuffer(asset.url);
      const name = uniqueFilename(asset.filename || getFilenameFromUrl(asset.url), usedNames);
      archive.append(buffer, { name });
    } catch {
      /* skip failed files — scan already tracks failures */
    }
  }

  await archive.finalize();
  return done;
}
