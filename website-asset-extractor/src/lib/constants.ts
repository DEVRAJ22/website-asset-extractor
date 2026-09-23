export const MAX_PAGE_BYTES = 5 * 1024 * 1024;
export const MAX_ASSETS = 500;
export const FETCH_TIMEOUT_MS = 30_000;
export const MAX_REDIRECTS = 5;
export const MAX_ZIP_FILES = 150;
export const MAX_ZIP_BYTES = 100 * 1024 * 1024;
export const MAX_SINGLE_DOWNLOAD_BYTES = 25 * 1024 * 1024;
export const SCAN_STORE_TTL_MS = 30 * 60 * 1000;
export const PLAYWRIGHT_TIMEOUT_MS = 25_000;

export const FILE_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "zip",
  "rar",
  "7z",
  "tar",
  "gz",
  "csv",
  "txt",
  "json",
  "xml",
]);

export const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "avif",
  "bmp",
  "ico",
  "tiff",
]);

export const VIDEO_EXTENSIONS = new Set([
  "mp4",
  "webm",
  "ogg",
  "mov",
  "m4v",
]);

export const AUDIO_EXTENSIONS = new Set([
  "mp3",
  "wav",
  "ogg",
  "m4a",
  "aac",
  "flac",
]);
