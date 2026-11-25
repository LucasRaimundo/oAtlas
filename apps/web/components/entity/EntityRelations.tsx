import Link from "next/link";

import { entityTypeLabel, formatPeriod, groupRelations, type Relation } from "@/lib/entity/format";

export function EntityRelations({ relations }: { relations: Relation[] }) {
  if (relations.length === 0) return null;
  return (
    <section aria-labelledby="relacoes-title" className="mt-16 border-t border-cold-white/10 pt-10">
      <h2 id="relacoes-title" className="font-serif text-3xl font-semibold">
        Relações
      </h2>
      {groupRelations(relations).map((group) => (
        <div key={group.label} className="mt-6">
          <h3 className="text-sm font-medium uppercase tracking-[0.15em] text-gold">{group.label}</h3>
          <ul className="mt-3 space-y-3">
            {group.relations.map((relation) => {
              const period = formatPeriod(relation.start_year, relation.end_year);
              return (
                <li key={`${relation.relation_type}-${relation.direction}-${relation.entity.slug}`}>
                  <Link
                    href={`/entidade/${relation.entity.slug}`}
                    className="font-serif text-xl underline decoration-gold/40 underline-offset-4 hover:decoration-gold"
                  >
                    {relation.entity.name}
                  </Link>
                  <span className="ml-2 text-sm text-cold-white/60">
                    {entityTypeLabel(relation.entity.entity_type)}
                    {period && ` · ${period}`}
                  </span>
                  {relation.description && (
                    <p className="mt-1 text-sm leading-relaxed text-cold-white/80">{relation.description}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
