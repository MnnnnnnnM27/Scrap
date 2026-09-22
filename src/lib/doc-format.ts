export type JSONNode = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: JSONNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

function inlineToMarkdown(nodes: JSONNode[] = []): string {
  return nodes
    .map((n) => {
      if (n.type === "hardBreak") return "  \n";
      let text = n.text ?? "";
      if (!text) return "";
      for (const mark of n.marks ?? []) {
        if (mark.type === "bold") text = `**${text}**`;
        else if (mark.type === "italic") text = `*${text}*`;
        else if (mark.type === "underline") text = `<u>${text}</u>`;
        else if (mark.type === "strike") text = `~~${text}~~`;
        else if (mark.type === "code") text = `\`${text}\``;
        else if (mark.type === "link") text = `[${text}](${String(mark.attrs?.['href'] ?? "")})`;
      }
      return text;
    })
    .join("");
}

function blockToMarkdown(node: JSONNode, indent = ""): string {
  switch (node.type) {
    case "paragraph":
      return indent + inlineToMarkdown(node.content) + "\n\n";
    case "heading": {
      const level = Number(node.attrs?.['level'] ?? 1);
      return `${"#".repeat(Math.min(6, Math.max(1, level)))} ${inlineToMarkdown(node.content)}\n\n`;
    }
    case "bulletList":
      return (
        (node.content ?? [])
          .map((li) => `${indent}- ${listItemText(li, indent)}`)
          .join("\n")
          .trimEnd() + "\n\n"
      );
    case "orderedList":
      return (
        (node.content ?? [])
          .map((li, i) => `${indent}${i + 1}. ${listItemText(li, indent)}`)
          .join("\n")
          .trimEnd() + "\n\n"
      );
    case "taskList":
      return (
        (node.content ?? [])
          .map((li) => `${indent}- [${li.attrs?.['checked'] ? "x" : " "}] ${listItemText(li, indent)}`)
          .join("\n")
          .trimEnd() + "\n\n"
      );
    case "blockquote":
      return (
        (node.content ?? [])
          .map((child) => `> ${blockToMarkdown(child).trim()}`)
          .join("\n") + "\n\n"
      );
    case "codeBlock":
      return "```\n" + inlineToMarkdown(node.content) + "\n```\n\n";
    case "horizontalRule":
      return "---\n\n";
    default:
      if (node.content) return node.content.map((c) => blockToMarkdown(c, indent)).join("");
      return node.text ? node.text + "\n\n" : "";
  }
}

function listItemText(item: JSONNode, indent: string): string {
  return (item.content ?? [])
    .map((child) => blockToMarkdown(child, indent + "  "))
    .join("")
    .trim();
}

export function docToMarkdown(doc: unknown, title?: string): string {
  const root = (doc ?? {}) as JSONNode;
  const body = (root.content ?? []).map((n) => blockToMarkdown(n)).join("");
  const heading = title?.trim() ? `# ${title.trim()}\n\n` : "";
  return (heading + body).replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

export function docToPlainText(doc: unknown): string {
  const root = (doc ?? {}) as JSONNode;
  const walk = (node: JSONNode): string => {
    if (node.text) return node.text;
    if (node.type === "hardBreak") return "\n";
    const inner = (node.content ?? []).map(walk).join(node.type === "doc" ? "\n" : "");
    return node.type === "paragraph" || node.type?.endsWith("List") || node.type === "heading"
      ? inner + "\n"
      : inner;
  };
  return walk(root).replace(/\n{2,}/g, "\n").trim();
}
