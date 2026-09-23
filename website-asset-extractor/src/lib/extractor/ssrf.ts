import dns from "node:dns/promises";
import { isIP } from "node:net";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.goog",
]);

const METADATA_HOST_PATTERNS = [
  /^169\.254\.169\.254$/,
  /^metadata\./i,
];

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === "::1" || normalized === "::") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (normalized.startsWith("fe80")) return true;
  return false;
}

function isBlockedIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) return isPrivateIpv4(ip);
  if (version === 6) return isPrivateIpv6(ip);
  return true;
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (host.endsWith(".localhost") || host.endsWith(".local")) return true;
  if (METADATA_HOST_PATTERNS.some((re) => re.test(host))) return true;
  if (isIP(host)) return isBlockedIp(host);
  return false;
}

export class UrlValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UrlValidationError";
  }
}

export async function assertSafePublicUrl(input: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    throw new UrlValidationError("Invalid URL format.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new UrlValidationError("Only HTTP and HTTPS URLs are allowed.");
  }

  if (parsed.username || parsed.password) {
    throw new UrlValidationError("URLs with credentials are not allowed.");
  }

  const hostname = parsed.hostname;
  if (isBlockedHostname(hostname)) {
    throw new UrlValidationError("This URL points to a blocked host.");
  }

  if (!isIP(hostname)) {
    try {
      const records = await dns.lookup(hostname, { all: true });
      for (const record of records) {
        if (isBlockedIp(record.address)) {
          throw new UrlValidationError(
            "This URL resolves to a private or internal address.",
          );
        }
      }
    } catch (err) {
      if (err instanceof UrlValidationError) throw err;
      throw new UrlValidationError("Could not resolve hostname.");
    }
  } else if (isBlockedIp(hostname)) {
    throw new UrlValidationError("This URL points to a blocked address.");
  }

  return parsed;
}

export function normalizeUserUrl(input: string): string {
  const trimmed = input.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}
