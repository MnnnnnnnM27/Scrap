export type ChartSpec = {
  title: string;
  type: "bar" | "line" | "pie";
  labels: string[];
  values: number[];
};

const PALETTE = ["#3B6FD8", "#2E9E6E", "#E0902C", "#D2506A", "#8A5BD6", "#5F6B7A", "#2AA3B8", "#B5832A"];

/** Draws a clean chart onto a canvas and returns a PNG data URL. */
export function renderChartPng(spec: ChartSpec): string {
  const W = 1200;
  const H = 720;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, W, H);
  const font = "-apple-system, system-ui, sans-serif";
  g.fillStyle = "#1c1c1e";
  g.font = `600 34px ${font}`;
  g.fillText(spec.title || "Chart", 48, 64);

  const n = Math.min(spec.labels.length, spec.values.length);
  const vals = spec.values.slice(0, n).map((v) => (Number.isFinite(v) ? v : 0));
  const labels = spec.labels.slice(0, n);
  if (!n) return c.toDataURL("image/png");

  if (spec.type === "pie") {
    const total = vals.reduce((a, b) => a + Math.max(0, b), 0) || 1;
    let a0 = -Math.PI / 2;
    const cx = 380, cy = 400, r = 250;
    vals.forEach((v, i) => {
      const a1 = a0 + (Math.max(0, v) / total) * Math.PI * 2;
      g.beginPath();
      g.moveTo(cx, cy);
      g.arc(cx, cy, r, a0, a1);
      g.closePath();
      g.fillStyle = PALETTE[i % PALETTE.length]!;
      g.fill();
      g.strokeStyle = "#fff";
      g.lineWidth = 4;
      g.stroke();
      a0 = a1;
    });
    g.font = `400 24px ${font}`;
    labels.forEach((l, i) => {
      const y = 200 + i * 44;
      g.fillStyle = PALETTE[i % PALETTE.length]!;
      g.beginPath();
      g.arc(720, y - 8, 10, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#1c1c1e";
      g.fillText(`${l} — ${Math.round((Math.max(0, vals[i]!) / total) * 100)}%`, 744, y);
    });
    return c.toDataURL("image/png");
  }

  const left = 100, right = W - 48, top = 120, bottom = H - 90;
  const max = Math.max(...vals, 0) || 1;
  const min = Math.min(...vals, 0);
  const span = max - min || 1;
  const y = (v: number) => bottom - ((v - min) / span) * (bottom - top);
  g.strokeStyle = "#e5e5ea";
  g.lineWidth = 2;
  g.font = `400 20px ${font}`;
  g.fillStyle = "#8e8e93";
  for (let k = 0; k <= 4; k++) {
    const v = min + (span * k) / 4;
    const yy = y(v);
    g.beginPath();
    g.moveTo(left, yy);
    g.lineTo(right, yy);
    g.stroke();
    g.fillText(Number(v.toFixed(1)).toLocaleString(), 24, yy + 7);
  }
  const step = (right - left) / n;
  labels.forEach((l, i) => {
    g.fillStyle = "#3a3a3c";
    const text = l.length > 12 ? l.slice(0, 11) + "…" : l;
    g.fillText(text, left + step * i + step / 2 - g.measureText(text).width / 2, bottom + 36);
  });
  if (spec.type === "line") {
    g.strokeStyle = PALETTE[0]!;
    g.lineWidth = 5;
    g.beginPath();
    vals.forEach((v, i) => {
      const xx = left + step * i + step / 2;
      if (i) g.lineTo(xx, y(v));
      else g.moveTo(xx, y(v));
    });
    g.stroke();
    vals.forEach((v, i) => {
      g.fillStyle = PALETTE[0]!;
      g.beginPath();
      g.arc(left + step * i + step / 2, y(v), 8, 0, Math.PI * 2);
      g.fill();
    });
  } else {
    vals.forEach((v, i) => {
      const bw = Math.min(90, step * 0.6);
      const xx = left + step * i + (step - bw) / 2;
      g.fillStyle = PALETTE[i % PALETTE.length]!;
      const y0 = y(Math.max(0, min));
      const y1 = y(v);
      g.beginPath();
      g.roundRect(xx, Math.min(y0, y1), bw, Math.abs(y0 - y1) || 2, 8);
      g.fill();
    });
  }
  return c.toDataURL("image/png");
}

/** Downscale an uploaded image to keep documents light. */
export async function fileToDataUrl(file: File, maxW = 1600): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, maxW / img.naturalWidth);
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}
