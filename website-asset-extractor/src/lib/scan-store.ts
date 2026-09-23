import { SCAN_STORE_TTL_MS } from "@/lib/constants";
import type { ScanResult } from "@/lib/extractor/types";

interface StoredScan {
  result: ScanResult;
  expiresAt: number;
}

const store = new Map<string, StoredScan>();

function prune() {
  const now = Date.now();
  for (const [id, entry] of store) {
    if (entry.expiresAt <= now) store.delete(id);
  }
}

export function saveScan(result: ScanResult): void {
  prune();
  store.set(result.scanId, {
    result,
    expiresAt: Date.now() + SCAN_STORE_TTL_MS,
  });
}

export function getScan(scanId: string): ScanResult | null {
  prune();
  const entry = store.get(scanId);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    store.delete(scanId);
    return null;
  }
  return entry.result;
}

export function isUrlAllowedForScan(scanId: string, url: string): boolean {
  const scan = getScan(scanId);
  if (!scan) return false;
  return scan.assets.some((a) => a.url === url);
}
