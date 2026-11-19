import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { ContentBlock, ListItem, TextRun } from "@/lib/api/entities";

import { SectionContent } from "../SectionContent";

const run = (text: string, extra: Partial<TextRun> = {}): TextRun => ({
  text,
  bold: false,
  italic: false,
  href: null,
  ...extra,
});

const render = (...blocks: ContentBlock[]) => renderToStaticMarkup(<SectionContent blocks={blocks} />);

const paragraph = (...text: TextRun[]): ContentBlock => ({ type: "paragraph", text });

describe("SectionContent", () => {
  it("shows HTML markup in the text literally instead of interpreting it", () => {
    const html = render(paragraph(run('<script>alert("x")</script><b>negrito</b>')));

    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<b>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("opens http(s) links in a new tab without leaking the opener", () => {
    const html = render(paragraph(run("Eneida", { href: "https://pt.wikipedia.org/wiki/Eneida" })));

    expect(html).toContain('<a href="https://pt.wikipedia.org/wiki/Eneida" target="_blank" rel="noopener noreferrer"');
  });

  it.each(["javascript:alert(1)", "data:text/html,<script>alert(1)</script>", "/entidade/virgilio"])(
    "renders a %s link as plain text",
    (href) => {
      const html = render(paragraph(run("clique", { href })));

      expect(html).not.toContain("<a");
      expect(html).not.toContain("javascript:");
      expect(html).toContain("clique");
    },
  );

  it("combines bold and italic, keeping the formatting inside the link", () => {
    const html = render(paragraph(run("Bucólicas", { bold: true, italic: true, href: "https://example.org/b" })));

    expect(html).toMatch(/<a [^>]*><strong><em>Bucólicas<\/em><\/strong><\/a>/);
  });

  it("maps heading levels 3 and 4 to h3 and h4", () => {
    const html = render({ type: "heading", level: 3, text: [run("Obras")] }, { type: "heading", level: 4, text: [run("Eneida")] });

    expect(html).toMatch(/<h3[^>]*>Obras<\/h3>/);
    expect(html).toMatch(/<h4[^>]*>Eneida<\/h4>/);
  });

  it("keeps the hierarchy of nested lists, each sublist inside its parent item", () => {
    const item = (text: string, items: ListItem[] = []): ListItem => ({ text: [run(text)], items });
    const html = render({
      type: "list",
      style: "ordered",
      items: [item("Obras", [item("Poesia", [item("Eneida")])]), item("Legado")],
    });

    expect(html.replace(/ class="[^"]*"/g, "")).toBe(
      "<div><ol><li>Obras<ol><li>Poesia<ol><li>Eneida</li></ol></li></ol></li><li>Legado</li></ol></div>",
    );
  });

  it("renders unordered lists as ul", () => {
    const html = render({ type: "list", style: "unordered", items: [{ text: [run("a")], items: [] }] });

    expect(html).toContain("<ul");
    expect(html).not.toContain("<ol");
  });

  it("shows the quote caption when present and omits it when null", () => {
    const quote = (caption: string | null): ContentBlock => ({ type: "quote", text: [run("Arma virumque cano")], caption });

    expect(render(quote("Eneida, I, 1"))).toMatch(/<figcaption[^>]*>— Eneida, I, 1<\/figcaption>/);
    expect(render(quote(null))).not.toContain("figcaption");
  });
});
