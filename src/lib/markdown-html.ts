/** Tiny Markdown -> HTML converter for AI output inserted into the editor. */
function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s: string) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1<em>$2</em>")
    .replace(/~~(.+?)~~/g, "<s>$1</s>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

const cells = (row: string) =>
  row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

export function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    if (!line.trim()) {
      i++;
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      out.push(`<h${h[1]!.length}>${inline(h[2]!)}</h${h[1]!.length}>`);
      i++;
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      out.push("<hr>");
      i++;
      continue;
    }
    if (line.trim().startsWith("|") && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1] ?? "")) {
      const head = cells(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i]!.trim().startsWith("|")) rows.push(cells(lines[i++]!));
      out.push(
        `<table><tbody><tr>${head.map((c) => `<th><p>${inline(c)}</p></th>`).join("")}</tr>${rows
          .map((r) => `<tr>${head.map((_, k) => `<td><p>${inline(r[k] ?? "")}</p></td>`).join("")}</tr>`)
          .join("")}</tbody></table>`,
      );
      continue;
    }
    if (/^\s*[-*]\s+\[( |x)\]\s+/i.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+\[( |x)\]\s+/i.test(lines[i]!)) {
        const m = /^\s*[-*]\s+\[( |x)\]\s+(.*)$/i.exec(lines[i++]!)!;
        items.push(`<li data-type="taskItem" data-checked="${m[1]!.toLowerCase() === "x"}"><p>${inline(m[2]!)}</p></li>`);
      }
      out.push(`<ul data-type="taskList">${items.join("")}</ul>`);
      continue;
    }
    if (/^\s*[-*•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i]!))
        items.push(`<li><p>${inline(lines[i++]!.replace(/^\s*[-*•]\s+/, ""))}</p></li>`);
      out.push(`<ul>${items.join("")}</ul>`);
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i]!))
        items.push(`<li><p>${inline(lines[i++]!.replace(/^\s*\d+[.)]\s+/, ""))}</p></li>`);
      out.push(`<ol>${items.join("")}</ol>`);
      continue;
    }
    if (line.startsWith(">")) {
      const q: string[] = [];
      while (i < lines.length && lines[i]!.startsWith(">")) q.push(lines[i++]!.replace(/^>\s?/, ""));
      out.push(`<blockquote><p>${inline(q.join(" "))}</p></blockquote>`);
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i]!.trim() && !/^(#{1,6}\s|\s*[-*•]\s|\s*\d+[.)]\s|>|\|)/.test(lines[i]!))
      para.push(lines[i++]!);
    if (!para.length) para.push(lines[i++]!);
    out.push(`<p>${inline(para.join(" "))}</p>`);
  }
  return out.join("");
}
