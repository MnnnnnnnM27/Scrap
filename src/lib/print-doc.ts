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
  @page{margin:16mm 18mm;size:auto}
  html,body{background:#fff!important;margin:0!important;padding:0!important}
  body>*:not(#scrap-print){display:none!important}
  #scrap-print{display:block!important;color:#111;font-family:var(--font-doc);font-size:13.5pt;line-height:1.65}
  #scrap-print p{margin:0 0 0.8em}
  #scrap-print strong,#scrap-print b{font-weight:700}
  #scrap-print em,#scrap-print i{font-style:italic}
  #scrap-print u{text-decoration:underline}
  #scrap-print s{text-decoration:line-through}
  #scrap-print h1,#scrap-print h2,#scrap-print h3,#scrap-print h4{font-weight:650;line-height:1.25;break-after:avoid}
  #scrap-print h1.doc-title{font-size:26pt;margin:0 0 16pt;letter-spacing:-0.01em}
  #scrap-print h1{font-size:21pt;margin:1.1em 0 0.4em}
  #scrap-print h2{font-size:17pt;margin:1em 0 0.35em}
  #scrap-print h3{font-size:14.5pt;margin:0.9em 0 0.3em}
  #scrap-print > :not(.doc-title):is(h1,h2){border-top:1px solid #ddd;padding-top:0.8em;margin-top:1.3em}
  #scrap-print > .doc-title + :is(h1,h2){border-top:0;padding-top:0}
  #scrap-print ul{list-style:disc;padding-left:1.4em;margin:0 0 0.8em}
  #scrap-print ol{list-style:decimal;padding-left:1.4em;margin:0 0 0.8em}
  #scrap-print li p{margin:0 0 0.25em}
  #scrap-print [style*="text-align: center"]{text-align:center}
  #scrap-print img{max-width:100%;break-inside:avoid;margin:0.6em 0}
  #scrap-print table{border-collapse:collapse;width:100%;margin:10pt 0}
  #scrap-print td,#scrap-print th{border:1px solid #ccc;padding:5pt 7pt;text-align:left;vertical-align:top}
  #scrap-print th{font-weight:650;background:#f5f5f5}
  #scrap-print blockquote{border-left:3px solid #ccc;margin:0 0 0.8em;padding-left:12pt;color:#444}
  #scrap-print ul[data-type="taskList"]{list-style:none;padding-left:0}
  #scrap-print ul[data-type="taskList"] li{display:flex;gap:8pt}
  #scrap-print hr{border:0;border-top:1px solid #ddd;margin:1.2em 0}
}`;
  const root = document.createElement("div");
  root.id = "scrap-print";
  root.dataset["docFont"] = document.documentElement.dataset["docFont"] ?? "default";
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
