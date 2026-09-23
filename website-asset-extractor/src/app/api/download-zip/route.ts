import { buildZipBuffer } from "@/lib/download-utils";
import { getScan } from "@/lib/scan-store";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  scanId: z.string().uuid(),
  assetIds: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "scanId is required." }, { status: 400 });
  }

  const scan = getScan(parsed.data.scanId);
  if (!scan) {
    return Response.json({ error: "Scan session expired or not found." }, { status: 404 });
  }

  const ids = parsed.data.assetIds;
  const assets =
    ids && ids.length > 0
      ? scan.assets.filter((a) => ids.includes(a.id))
      : scan.assets;

  if (assets.length === 0) {
    return Response.json({ error: "No assets selected." }, { status: 400 });
  }

  try {
    const zip = await buildZipBuffer(assets);
    const host = new URL(scan.finalUrl).hostname.replace(/[^a-z0-9.-]/gi, "-");
    const filename = `assets-${host}.zip`;
    return new Response(new Uint8Array(zip), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "ZIP creation failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
