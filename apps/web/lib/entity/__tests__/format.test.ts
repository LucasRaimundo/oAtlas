import { describe, expect, it } from "vitest";

import { entityDates, formatPeriod, formatYear, groupRelations, sourceDetails, splitParagraphs, type Relation, type Source } from "../format";

function relation(slug: string, label: string | null, relation_type = "related_to"): Relation {
  return {
    direction: "outgoing",
    relation_type,
    label,
    description: null,
    start_year: null,
    end_year: null,
    entity: { slug, name: slug, entity_type: "work", summary: null },
  };
}

function source(overrides: Partial<Source> = {}): Source {
  return {
    id: "s1",
    title: "Vida de Virgílio",
    source_type: "book",
    author_or_institution: null,
    publication_year: null,
    publisher_or_journal: null,
    identifier: null,
    url: null,
    contribution_type: "reference",
    locator: null,
    ...overrides,
  };
}

describe("groupRelations", () => {
  it("groups by label keeping the order the API delivered", () => {
    const groups = groupRelations([
      relation("eneida", "é autor de"),
      relation("mantua", "nasceu em"),
      relation("georgicas", "é autor de"),
    ]);

    expect(groups.map((g) => [g.label, g.relations.map((r) => r.entity.slug)])).toEqual([
      ["é autor de", ["eneida", "georgicas"]],
      ["nasceu em", ["mantua"]],
    ]);
  });

  it("falls back to the relation type when there is no label", () => {
    expect(groupRelations([relation("augusto", null, "patron_of")])[0].label).toBe("patron_of");
  });
});

describe("formatYear", () => {
  it.each([
    [0, "1 a.C."],
    [1, "1"],
    [-69, "70 a.C."],
    [-26, "27 a.C."],
    [476, "476"],
  ])("reads astronomical year %s as %j", (year, expected) => {
    expect(formatYear(year)).toBe(expected);
  });
});

describe("formatPeriod", () => {
  it.each([
    [-69, -18, "70–19 a.C."],
    [-26, 14, "27 a.C.–14"],
    [0, 1, "1 a.C.–1"],
    [-18, -18, "19 a.C."],
    [-51, null, "a partir de 52 a.C."],
    [null, 476, "até 476"],
    [null, null, null],
  ])("formats %s to %s as %j", (start, end, expected) => {
    expect(formatPeriod(start, end)).toBe(expected);
  });
});

describe("entityDates", () => {
  it.each([
    ["person", -69, -18, "70–19 a.C."],
    ["person", null, -45, "m. 46 a.C."],
    ["person", -81, null, "n. 82 a.C."],
    ["state", -26, 395, "27 a.C.–395"],
    ["event", -51, -51, "52 a.C."],
    ["state", -752, null, "a partir de 753 a.C."],
    ["work", null, null, null],
  ] as const)("formats a %s from %s to %s as %j", (entity_type, start_year, end_year, expected) => {
    expect(entityDates({ entity_type, start_year, end_year })).toBe(expected);
  });
});

describe("sourceDetails", () => {
  it("joins publisher, year and locator", () => {
    expect(sourceDetails(source({ publisher_or_journal: "Penguin", publication_year: 2006, locator: "cap. 2" }))).toBe(
      "Penguin, 2006 · cap. 2",
    );
  });

  it("leaves no dangling separators when fields are missing", () => {
    expect(sourceDetails(source({ locator: "p. 12" }))).toBe("p. 12");
    expect(sourceDetails(source({ publication_year: 1999 }))).toBe("1999");
    expect(sourceDetails(source())).toBeNull();
  });
});

describe("splitParagraphs", () => {
  it("splits on blank lines and drops empty paragraphs", () => {
    expect(splitParagraphs("Primeiro.\n\n  \n\nSegundo,\ncontinua.\n")).toEqual(["Primeiro.", "Segundo,\ncontinua."]);
    expect(splitParagraphs(null)).toEqual([]);
  });
});
