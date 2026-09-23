import { fetchAssetBuffer } from "@/lib/download-utils";
import { getFilenameFromUrl } from "@/lib/extractor/url-utils";
import { isUrlAllowedForScan } from "@/lib/scan-store";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const querySchema = z.object({
  scanId: z.string().uuid(),
  url: z.string().url(),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = querySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "scanId and url are required." }, { status: 400 });
  }

  const { scanId, url } = parsed.data;
  if (!isUrlAllowedForScan(scanId, url)) {
    return Response.json({ error: "Asset not found in scan session." }, { status: 403 });
  }

  try {
    const buffer = await fetchAssetBuffer(url);
    const filename = getFilenameFromUrl(url);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "")}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Download failed.";
    return Response.json({ error: message }, { status: 502 });
  }
}
