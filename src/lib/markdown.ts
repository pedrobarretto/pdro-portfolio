function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInline(text: string) {
  const codeTokens: string[] = [];
  const imageTokens: string[] = [];
  const linkTokens: string[] = [];

  const withCodeTokens = text.replace(/`([^`]+)`/g, (_match, code) => {
    const token = `@@CODE${codeTokens.length}@@`;
    codeTokens.push(`<code>${escapeHtml(code)}</code>`);
    return token;
  });

  const withImageTokens = withCodeTokens.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (_match, alt, url) => {
      const token = `@@IMG${imageTokens.length}@@`;
      imageTokens.push(
        `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" />`,
      );
      return token;
    },
  );

  const withLinkTokens = withImageTokens.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_match, label, url) => {
      const token = `@@LINK${linkTokens.length}@@`;
      linkTokens.push(
        `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`,
      );
      return token;
    },
  );

  let output = escapeHtml(withLinkTokens);

  output = output.replace(/\*\*([\s\S]+?)\*\*/g, (_match, bold) => {
    return `<strong>${bold}</strong>`;
  });

  output = output.replace(/\*([\s\S]+?)\*/g, (_match, italic) => {
    return `<em>${italic}</em>`;
  });

  output = output.replace(/_([\s\S]+?)_/g, (_match, italic) => {
    return `<em>${italic}</em>`;
  });

  output = output.replace(/@@CODE(\d+)@@/g, (_match, index) => {
    const tokenIndex = Number(index);
    return codeTokens[tokenIndex] ?? "";
  });

  output = output.replace(/@@IMG(\d+)@@/g, (_match, index) => {
    const tokenIndex = Number(index);
    return imageTokens[tokenIndex] ?? "";
  });

  output = output.replace(/@@LINK(\d+)@@/g, (_match, index) => {
    const tokenIndex = Number(index);
    return linkTokens[tokenIndex] ?? "";
  });

  return output;
}

function flushParagraph(buffer: string[], html: string[]) {
  if (buffer.length === 0) return;
  html.push(`<p>${renderInline(buffer.join(" "))}</p>`);
  buffer.length = 0;
}

function flushList(listType: "ul" | "ol" | null, items: string[], html: string[]) {
  if (!listType || items.length === 0) return;
  const rendered = items.map((item) => `<li>${renderInline(item)}</li>`).join("");
  html.push(`<${listType}>${rendered}</${listType}>`);
  items.length = 0;
}

function flushBlockquote(buffer: string[], html: string[]) {
  if (buffer.length === 0) return;
  const inner = markdownToHtml(buffer.join("\n"));
  html.push(`<blockquote>${inner}</blockquote>`);
  buffer.length = 0;
}

export function markdownToHtml(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  const paragraphBuffer: string[] = [];
  const listItems: string[] = [];
  const blockquoteBuffer: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let inCodeBlock = false;
  let codeFenceLang = "";
  let codeLines: string[] = [];

  const flushBuffers = () => {
    flushParagraph(paragraphBuffer, html);
    flushList(listType, listItems, html);
    listType = null;
    flushBlockquote(blockquoteBuffer, html);
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        const code = escapeHtml(codeLines.join("\n"));
        const langClass = codeFenceLang ? ` class="language-${codeFenceLang}"` : "";
        html.push(`<pre><code${langClass}>${code}</code></pre>`);
        inCodeBlock = false;
        codeFenceLang = "";
        codeLines = [];
      } else {
        flushBuffers();
        inCodeBlock = true;
        codeFenceLang = line.replace("```", "").trim();
        codeLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (/^\s*>/.test(line)) {
      flushParagraph(paragraphBuffer, html);
      flushList(listType, listItems, html);
      listType = null;
      blockquoteBuffer.push(line.replace(/^\s*>\s?/, ""));
      continue;
    }

    if (blockquoteBuffer.length > 0 && line.trim() === "") {
      flushBlockquote(blockquoteBuffer, html);
      continue;
    }

    if (line.trim() === "") {
      flushBuffers();
      continue;
    }

    if (/^#{1,6}\s+/.test(line)) {
      flushBuffers();
      const level = line.match(/^#{1,6}/)?.[0].length ?? 1;
      const text = line.replace(/^#{1,6}\s+/, "");
      html.push(`<h${level}>${renderInline(text)}</h${level}>`);
      continue;
    }

    if (/^(-|\*|\+)\s+/.test(line)) {
      flushParagraph(paragraphBuffer, html);
      flushBlockquote(blockquoteBuffer, html);
      if (listType && listType !== "ul") {
        flushList(listType, listItems, html);
      }
      listType = "ul";
      listItems.push(line.replace(/^(-|\*|\+)\s+/, ""));
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      flushParagraph(paragraphBuffer, html);
      flushBlockquote(blockquoteBuffer, html);
      if (listType && listType !== "ol") {
        flushList(listType, listItems, html);
      }
      listType = "ol";
      listItems.push(line.replace(/^\d+\.\s+/, ""));
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      flushBuffers();
      html.push("<hr />");
      continue;
    }

    paragraphBuffer.push(line.trim());
  }

  flushBuffers();

  if (inCodeBlock && codeLines.length > 0) {
    const code = escapeHtml(codeLines.join("\n"));
    const langClass = codeFenceLang ? ` class="language-${codeFenceLang}"` : "";
    html.push(`<pre><code${langClass}>${code}</code></pre>`);
  }

  return html.join("\n");
}
