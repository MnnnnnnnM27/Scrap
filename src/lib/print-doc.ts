// Prints only the document title + body. Everything else on the page (bars, menus,
// portals, ghost text) is hidden for print, and browser header/footer text is removed.
export function printDocument(title: string, html: string) {
  document.getElementById("scrap-print")?.remove();
  document.getElementById("scrap-print-style")?.remove();
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

  const style = document.createElement("style");
  style.id = "scrap-print-style";
  style.textContent = `
#scrap-print{display:none}
@media print{
  @page{margin:0;size:auto}
  html,body{background:#fff!important;margin:0!important;padding:0!important}
  body>*:not(#scrap-print){display:none!important}
  #scrap-print{display:block!important;color:#111;font-family:var(--font-doc);font-size:12pt;line-height:1.6;
    padding:18mm 18mm;-webkit-box-decoration-break:clone;box-decoration-break:clone}
  #scrap-print h1.doc-title{font-size:22pt;margin:0 0 14pt;letter-spacing:-0.01em}
  #scrap-print h1{font-size:20pt}#scrap-print h2{font-size:16pt}#scrap-print h3{font-size:14pt}
  #scrap-print img{max-width:100%;break-inside:avoid}
  #scrap-print table{border-collapse:collapse;width:100%;margin:10pt 0}
  #scrap-print td,#scrap-print th{border:1px solid #ccc;padding:5pt 7pt;text-align:left;vertical-align:top}
  #scrap-print blockquote{border-left:3px solid #ccc;margin:0;padding-left:12pt;color:#444}
  #scrap-print ul[data-type="taskList"]{list-style:none;padding-left:0}
  #scrap-print ul[data-type="taskList"] li{display:flex;gap:8pt}
  #scrap-print hr{border:0;border-top:1px solid #ddd}
}`;
  const root = document.createElement("div");
  root.id = "scrap-print";
  root.innerHTML = `${title ? `<h1 class="doc-title">${esc(title)}</h1>` : ""}${html}`;
  document.head.appendChild(style);
  document.body.appendChild(root);

  const cleanup = () => {
    root.remove();
    style.remove();
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  // let any open menu close and fonts settle first
  setTimeout(() => window.print(), 250);
}
