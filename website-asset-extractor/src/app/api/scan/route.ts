import { scanWebsite } from "@/lib/extractor";
import { UrlValidationError, assertSafePublicUrl, normalizeUserUrl } from "@/lib/extractor/ssrf";
import type { ScanProgressEvent } from "@/lib/extractor/types";
import { saveScan } from "@/lib/scan-store";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  url: z.string().min(1).max(2048),
  stream: z.boolean().optional(),
});

function ndjsonLine(event: ScanProgressEvent): string {
  return `${JSON.stringify(event)}\n`;
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "URL is required." }, { status: 400 });
  }

  const normalized = normalizeUserUrl(parsed.data.url);

  try {
    await assertSafePublicUrl(normalized);
  } catch (err) {
    const message =
      err instanceof UrlValidationError ? err.message : "URL validation failed.";
    return Response.json({ error: message }, { status: 400 });
  }

  if (parsed.data.stream) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: ScanProgressEvent) => {
          controller.enqueue(encoder.encode(ndjsonLine(event)));
        };
        try {
          send({ type: "progress", stage: "validate", message: "URL validated." });
          const result = await scanWebsite(normalized, {
            onProgress: (stage, message, count) => {
              send({ type: "progress", stage, message, count });
            },
          });
          saveScan(result);
          send({ type: "complete", result });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Scan failed unexpectedly.";
          send({ type: "error", message });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-store",
      },
    });
  }

  try {
    const result = await scanWebsite(normalized);
    saveScan(result);
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
