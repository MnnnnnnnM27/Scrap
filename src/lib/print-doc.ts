// Prints only the document title + body in an isolated frame, so no app chrome ever appears.
export function printDocument(title: string, html: string) {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(frame);
  const font = getComputedStyle(document.documentElement).getPropertyValue("--font-doc") || "-apple-system, system-ui, sans-serif";
  const fontLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .map((l) => `<link rel="stylesheet" href="${(l as HTMLLinkElement).href}">`)
    .join("");
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
  const doc = frame.contentDocument!;
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title || "Untitled")}</title>${fontLinks}
<style>
@page{margin:18mm}
body{margin:0;color:#111;background:#fff;font-family:${font};font-size:12pt;line-height:1.6}
h1.doc-title{font-size:24pt;margin:0 0 16pt;letter-spacing:-0.01em}
img{max-width:100%}
table{border-collapse:collapse;width:100%;margin:10pt 0}
td,th{border:1px solid #ccc;padding:5pt 7pt;text-align:left;vertical-align:top}
blockquote{border-left:3px solid #ccc;margin:0;padding-left:12pt;color:#444}
ul[data-type="taskList"]{list-style:none;padding-left:0}
ul[data-type="taskList"] li{display:flex;gap:8pt}
ul[data-type="taskList"] li>label{flex:none}
hr{border:0;border-top:1px solid #ddd}
</style></head><body>${title ? `<h1 class="doc-title">${esc(title)}</h1>` : ""}${html}</body></html>`);
  doc.close();
  const go = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    setTimeout(() => frame.remove(), 1000);
  };
  // give web fonts and images a moment to load
  setTimeout(go, 400);
}
