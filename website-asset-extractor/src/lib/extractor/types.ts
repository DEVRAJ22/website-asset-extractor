export type AssetType = "image" | "video" | "audio" | "svg" | "file";

export interface RawAsset {
  url: string;
  type: AssetType;
  source: string;
  width?: number;
  height?: number;
  format?: string;
}

export interface ExtractedAsset {
  id: string;
  url: string;
  type: AssetType;
  filename: string;
  format: string;
  width?: number;
  height?: number;
  size?: number;
  source: string;
  failed?: boolean;
}

export interface ScanResult {
  scanId: string;
  pageUrl: string;
  finalUrl: string;
  assets: ExtractedAsset[];
  warnings: string[];
  errors: string[];
  failedAssetCount: number;
  usedPlaywright: boolean;
  fetchedAt: string;
}

export type ScanProgressEvent =
  | { type: "progress"; stage: string; message: string; count?: number }
  | { type: "complete"; result: ScanResult }
  | { type: "error"; message: string };
