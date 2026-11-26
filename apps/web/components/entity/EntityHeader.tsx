import type { Entity } from "@/lib/api/entities";
import { entityTypeLabel, splitParagraphs } from "@/lib/entity/format";

import { EntityCover } from "./EntityCover";

export function EntityHeader({ entity }: { entity: Entity }) {
  const introduction = splitParagraphs(entity.description);
  return (
    <header className="border-b border-cold-white/10 pb-10">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">{entityTypeLabel(entity.entity_type)}</p>
      <h1 className="mt-3 font-serif text-5xl leading-tight font-semibold sm:text-6xl">{entity.name}</h1>
      {entity.summary && <p className="mt-4 text-lg leading-relaxed text-cold-white/80">{entity.summary}</p>}
      {entity.cover && <EntityCover cover={entity.cover} />}
      {introduction.map((paragraph, index) => (
        <p key={index} className="mt-4 leading-relaxed">
          {paragraph}
        </p>
      ))}
    </header>
  );
}
