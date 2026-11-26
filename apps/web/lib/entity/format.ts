import type { Entity } from "@/lib/api/entities";

export type Relation = Entity["relations"][number];
export type Source = Entity["sources"][number];

const ENTITY_TYPE_LABELS: Record<Entity["entity_type"], string> = {
  place: "Lugar",
  civilization: "Civilização",
  state: "Estado",
  person: "Pessoa",
  event: "Evento",
  culture: "Cultura",
  work: "Obra",
  concept: "Conceito",
};

export function entityTypeLabel(type: Entity["entity_type"]): string {
  return ENTITY_TYPE_LABELS[type];
}

/**
 * A API usa ano astronômico, que tem ano zero: 1 a.C. = 0, 70 a.C. = −69. Positivos são d.C. e ficam iguais.
 */
export function formatYear(year: number): string {
  return year <= 0 ? `${1 - year} a.C.` : String(year);
}

export function formatPeriod(start: number | null, end: number | null): string | null {
  if (start !== null && end !== null) {
    if (start === end) return formatYear(start);
    // Dois anos a.C. dividem a marca: "70–19 a.C.".
    if (end <= 0) return `${1 - start}–${formatYear(end)}`;
    return `${formatYear(start)}–${formatYear(end)}`;
  }
  if (start !== null) return `a partir de ${formatYear(start)}`;
  if (end !== null) return `até ${formatYear(end)}`;
  return null;
}

export type RelationGroup = { label: string; relations: Relation[] };

/** Agrupa pelo rótulo ("é autor de", "nasceu em"…), mantendo a ordem em que a API entrega. */
export function groupRelations(relations: Relation[]): RelationGroup[] {
  const groups = new Map<string, Relation[]>();
  for (const relation of relations) {
    const label = relation.label ?? relation.relation_type;
    groups.set(label, [...(groups.get(label) ?? []), relation]);
  }
  return [...groups].map(([label, items]) => ({ label, relations: items }));
}

/** Editora, ano e localizador numa linha só, sem separadores sobrando quando faltam campos. */
export function sourceDetails(source: Source): string | null {
  const publication = [source.publisher_or_journal, source.publication_year?.toString()].filter(Boolean).join(", ");
  const parts = [publication, source.locator].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}

/** A descrição é texto puro; linhas em branco separam parágrafos. */
export function splitParagraphs(text: string | null): string[] {
  if (!text) return [];
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
