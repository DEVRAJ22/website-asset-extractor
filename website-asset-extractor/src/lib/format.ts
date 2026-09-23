export function formatBytes(bytes?: number): string {
  if (bytes === undefined || Number.isNaN(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDimensions(width?: number, height?: number): string {
  if (!width && !height) return "—";
  if (width && height) return `${width} × ${height}`;
  return width ? `${width}w` : `${height}h`;
}
