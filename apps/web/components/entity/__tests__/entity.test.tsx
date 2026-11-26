import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { Entity, Section } from "@/lib/api/entities";
import type { Relation, Source } from "@/lib/entity/format";

import { EntityHeader } from "../EntityHeader";
import { EntityRelations } from "../EntityRelations";
import { EntitySections } from "../EntitySections";
import { EntitySources } from "../EntitySources";

const entity: Entity = {
  id: "1",
  slug: "virgilio",
  name: "Virgílio",
  entity_type: "person",
  summary: "Poeta romano.",
  description: "Nasceu perto de Mântua.\n\n<b>Escreveu</b> a Eneida.",
  cover: null,
  location: null,
  start_year: -69,
  end_year: -18,
  aliases: [],
  sections: [],
  relations: [],
  sources: [],
};

const section = (key: string, position: number): Section => ({
  section_key: key,
  title: key.toUpperCase(),
  position,
  content: [{ type: "paragraph", text: [{ text: key, bold: false, italic: false, href: null }] }],
});

const relation: Relation = {
  direction: "outgoing",
  relation_type: "author_of",
  label: "é autor de",
  description: null,
  start_year: -28,
  end_year: -18,
  entity: { slug: "eneida", name: "Eneida", entity_type: "work", summary: null },
};

const source = (overrides: Partial<Source>): Source => ({
  id: "s1",
  title: "Vida de Virgílio",
  source_type: "book",
  author_or_institution: "Suetônio",
  publication_year: null,
  publisher_or_journal: null,
  identifier: null,
  url: null,
  contribution_type: "reference",
  locator: "§ 3",
  ...overrides,
});

describe("EntityHeader", () => {
  it("shows only the type when the entity has no dates", () => {
    const html = renderToStaticMarkup(<EntityHeader entity={{ ...entity, start_year: null, end_year: null }} />);

    expect(html).not.toContain(" · ");
  });

  it("shows the type, dates, name and summary, and the description as escaped paragraphs", () => {
    const html = renderToStaticMarkup(<EntityHeader entity={entity} />);

    expect(html).toContain(">Pessoa<");
    expect(html).toContain("<span>70–19 a.C.</span>");
    expect(html).toMatch(/<h1[^>]*>Virgílio<\/h1>/);
    expect(html).toContain("Poeta romano.");
    expect(html.match(/<p class="mt-4 leading-relaxed">/g)).toHaveLength(2);
    expect(html).toContain("&lt;b&gt;Escreveu");
  });
});

describe("EntitySections", () => {
  it("orders sections by position and anchors each one by its key", () => {
    const html = renderToStaticMarkup(<EntitySections sections={[section("obras", 2), section("origem", 1)]} />);

    expect(html.indexOf('id="origem"')).toBeLessThan(html.indexOf('id="obras"'));
    expect(html).toMatch(/<h2 id="origem-title"[^>]*>ORIGEM<\/h2>/);
  });
});

describe("EntityRelations", () => {
  it("links each related entity to its own page under its group label", () => {
    const html = renderToStaticMarkup(<EntityRelations relations={[relation]} />);

    expect(html).toContain(">é autor de</h3>");
    expect(html).toContain('href="/entidade/eneida"');
    expect(html).toContain("Obra · 29–19 a.C.");
  });

  it("renders nothing when there are no relations", () => {
    expect(renderToStaticMarkup(<EntityRelations relations={[]} />)).toBe("");
  });
});

describe("EntitySources", () => {
  it("links the title only for http(s) urls", () => {
    const safe = renderToStaticMarkup(<EntitySources sources={[source({ url: "https://example.org/vita" })]} />);
    const unsafe = renderToStaticMarkup(<EntitySources sources={[source({ url: "javascript:alert(1)" })]} />);

    expect(safe).toContain('<a href="https://example.org/vita" target="_blank" rel="noopener noreferrer"');
    expect(unsafe).not.toContain("<a");
    expect(unsafe).toContain("<cite>Vida de Virgílio</cite>");
  });

  it("shows author, title and locator", () => {
    const html = renderToStaticMarkup(<EntitySources sources={[source({})]} />);

    expect(html).toContain("Suetônio. <cite>Vida de Virgílio</cite>. § 3");
  });
});
